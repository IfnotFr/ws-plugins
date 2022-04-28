export default class {
  version = '1.0.0'

  constructor ({ parent, log, options = {} } = {}) {
    this.server = parent
    this.log = log

    this.options = Object.assign({}, {
      interval: 30000,
      timeout: 5000,

      onTimeout: (ws) => {
        this.log.debug('Closing ' + ws.id + ' websocket ...')
        ws.terminate()
      },
      onPong: (ws, ms) => {
        this.log.debug('Received pong (latency ' + ms + ' ms) from ' + ws.id)
      },

      debug: true,
    }, options)
  }

  init () {
    const interval = setInterval(() => {
      this.log.debug('Available clients ' + this.server.wss.clients.size)
      for (const ws of this.server.wss.clients) {
        this.log.debug('Sending ping to client ' + ws.id)

        if (ws.pingpong.isAlive === false) {
          this.options.onTimeout(ws)
        } else {
          ws.pingpong.isAlive = false
          ws.ping(Date.now())
        }
      }
    }, this.options.interval)
  }

  connection ({ ws }) {
    ws.pingpong.latency = 0
    ws.pingpong.isAlive = 0

    ws.on('pong', from => {
      const ms = Date.now() - from
      this.options.onPong(ws, ms)
      ws.pingpong.isAlive = true
      ws.pingpong.latency = ms
    })
  }
}