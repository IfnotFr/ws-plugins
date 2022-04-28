# ws-plugins `WIP`

WebSocket Plugins is a modulable plugin system for client and server WebSockets.

Without any breaking changes of the initial WebSocket API, you can add built-in plugins into your WebSockets or create your own plugins.

## Quick Start

    yarn add @ifnot/ws-plugins
    (or) npm install @ifnot/ws-plugins --save

Server :

```javascript
const { WebSocketServer } = require('ws')
const { server } = require('@ifnot/ws-plugins')

const wss = new WebSocketServer({ port: 8080 })
server(wss, {
  // Add plugins here
  catchErrors: true,
  log: 'info'
})
```

Client :

```javascript
const WebSocket = require('ws')
const { client } = require('@ifnot/ws-plugins')

const ws = new WebSocket('ws://127.0.0.1:8080')
client(ws, {
  // Add plugins here
  catchErrors: true,
  log: 'info'
})
```

## Built-in Plugins

Summary :

* [PingPong](#pingpong): Close broken connections.
* [Reconnect](#reconnect): Reconnect when connection is closed.
* [Stream](#stream): Multiple simultaneous streams through one connection.
* [Router](#router): Namespace messages, handle them with a router
* [AsyncPayload](#async-payload): Send promise and streams into your object messages.

### PingPong

Automatically close broken connections after a ping-pong timeout. [Read more](https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections)

```javascript
// Server
server(wss, {
  pingpong: {
    interval: 30000, // In ms, the interval between each ping
    timeout: 1000, // In ms, the timeout where a client connection is considered broken
    onTimeout: (ws) => {}, // Replace the default behaviour of `ws.terminate()` when a timeout occurs
    onPong: (ws, ms) => {} // Add a custom handler when a pong is received
  }
})

// Client
client(ws, {
  pingpong: {
    interval: 30000, // In ms, should be same as server
    timeout: 1000, // In ms, should be same as server
    outage: 3, // The number of timeouts before the connection is considered broken
    onTimeout: () => {} // Replace the default behaviour of `ws.terminate()` when a timeout occurs
  }
})
```

Tips :
* As the ping is sent by the server using a `setInterval`, when high delay occurs (WebSocket paused, NodeJs event loop stuck), the client may trigger a timeout and disconnect. Tune the `outage` option to avoid this.

### Reconnect

Restart your client connection handler when the connection is closed. [Read more](https://stackoverflow.com/a/23176223/1301237)

```javascript
// Client
function connect () {
  const ws = new WebSocket('ws://127.0.0.1:8099')
  client(ws, {
    catchErrors: true, // catchErrors option is REQUIRED
    pingpong: true, // pingpong plugin is RECOMMENDED
    reconnect: {
      handler: connect
    }
  })
}
connect()
```

### Stream

Write and read multiple simultaneous streams on a single WebSocket connection.

```javascript
// Server
server(wss, {
  stream: {
    nameLength: 10 // The fixed amount of bytes allocated at the beginning of each chunks for storing the name of the stream.
  }
})

// Send two files at the same time to any connected client
wss.on('connection', (ws) => {
  ws.stream.readable('my-stream1').pipe(fs.createWriteStream('./from1.txt'))
  ws.stream.readable('my-stream2').pipe(fs.createWriteStream('./from2.txt'))
})

// Client
client(ws, {
  stream: {
    nameLength: 10 // Should be same as server
  }
})

// One connected, pipe the two files from the server stream (names must match)
ws.on('open', () => {
  fs.createReadStream('./to1.txt').pipe(socket.stream.writable('my-stream1'))
  fs.createReadStream('./to2.txt').pipe(socket.stream.writable('my-stream2'))
})
```

#### Tips:
* Writable streams will add the name of the stream as prefix (adding an overload of `nameLength` bytes). When received, the prefix will be used to find the corresponding reading stream and then removed before piping.
* The slowest reading stream will apply backpressure and slow down the entire WebSocket stream and not only the source writing stream.
* You can open multiple reading stream with the same name to create copies. And opening multiple same writing stream to merge streams.

### Router

Send named messages with `router.send` and read them using a router (like a REST API). You can also make `router.query` which wait for a response using a promise.

```javascript
// Server
server(wss, {
  stream: true, // stream plugin is REQUIRED
  router: {
    delimiter: '/', // The delimiter used to make paths
    wildcard: false, // If true, the router will accept wildcard paths
  }
})

wss.on('connection', function connection (ws) {
  // Handle a message from client named `/hello/world`
  ws.router.on('/hello-world', (data) => {
    console.log('Websocket ping received')
  })
  
  // Handle a message query from client named `/users/create`
  ws.router.on('/users/create', user => {
    console.log('User received', user)
    return user
  })
  
  // You can also send a message to the client with the router
  ws.router.send('/foo')
})

// Client
client(ws, {
  stream: true, // stream plugin is REQUIRED
  router: {
    delimiter: '/', // Should be same as server
    wildcard: false, // If true, the router will accept wildcard paths
  }
})

ws.on('open', async () => {
  // Send a `hello-world` message to the server
  ws.router.send('/hello-world')
  
  // Send a `/users/create` query to the server and wait for the response
  const user = await ws.router.query('/users/create', { name: 'John' })
  
  // Catch all messages from the server (with wildcard)
  ws.router.on('/*', (data) => {
    console.log('Websocket message received', data)
  })
})
```

#### TODO

* Add support for global routing on the server instead of runtime routing for each connection. We may add also a middleware plugin.

### AsyncPayload

Send promises and streams through WebSocket messages.

```javascript
// Server
server(wss, {
  stream: true, // stream plugin is REQUIRED
  asyncPayload: true
})

wss.on('connection', (ws) => {
  // You can send a file with metadata
  ws.send({
    name: 'my-file.tx',
    size: 12345,
    type: 'text/plain',
    stream: fs.createReadStream('./my-file.txt'),
  })
  
  // You can receive a promise  
  ws.on('message', async ({ name, completion }) => {
    try {
      await completion
      console.error('Task', name, 'suceeded.')
    } catch (e) {
      console.error('Task', name, 'failed', e)
    }
  })
})

// Client
client(ws, {
  stream: true, // stream plugin is REQUIRED
  asyncPayload: true
})

ws.on('open', () => {
  // And receive the file
  ws.on('message', async (data) => {
    const { name, size, type, stream } = data
    stream.pipe(fs.createWriteStream(name))
  })
  
  // Or send a promise
  ws.send({
    name: 'MY_LONG_TASK',
    completion: new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve('Hello world')
      }, 1000)
    })
  })
})
```

Tips :
* You can also send promise/streams with `router.send` and `router.query` methods with the router plugin.