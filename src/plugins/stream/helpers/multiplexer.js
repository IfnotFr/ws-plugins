import { PassThrough, Transform } from 'stream'
import EventEmitter2 from 'eventemitter2'
import { v4 as uuidv4 } from 'uuid'

const debug = true

export default class extends EventEmitter2 {
  constructor (options = {}) {
    super()
    this.options = Object.assign({}, {
      stream: null,
      prefixLength: 10,
    }, options)

    this.stream = this.options.stream ? this.options.stream : new PassThrough()
    this.writables = {}
    this.readables = {}

    this.dispatchToReadables()
  }

  dispatchToReadables () {
    this.stream.on('data', raw => {
      const prefix = raw.slice(0, this.options.prefixLength).toString()
      const chunk = raw.slice(this.options.prefixLength)
      console.log('[MULTIPLEXER]', 'Reading chunk of ' + chunk.length + ' bytes from main stream ...')

      const readables = this.getReadableStreams(prefix)
      for (const id in readables) {
        const readable = readables[id]
        const result = readable.stream.write(chunk)
        if (!result) {
          console.log('[MULTIPLEXER]', '- Tried to write them into readable stream ' + id + ' but backpressure occurred, pausing main stream ...')
          this.stream.pause()
        } else {
          console.log('[MULTIPLEXER]', '- Write success into readable stream ' + id + ' !')
        }
      }
    })

    this.stream.on('end', () => {
      console.log('[MULTIPLEXER]', 'Getting stream end from main stream ...')
      const readables = this.getReadableStreams()
      for (const id in readables) {
        const readable = readables[id]
        console.log('[MULTIPLEXER]', '- Forwarded stream end to readable stream ' + readable.name + ' (' + id + ') !')
        readable.stream.end()
      }
    })
  }

  getReadableStreams (prefix) {
    if (prefix) {
      return Object.fromEntries(Object.entries(this.readables).filter(entry => {
        const [id, readable] = entry
        return readable.prefix === prefix
      }))
    } else {
      return this.readables
    }
  }

  nameToPrefix (name) {
    return name.substring(0, this.options.prefixLength).padEnd(this.options.prefixLength)
  }

  writable (name) {
    const id = uuidv4()
    const prefix = this.nameToPrefix(name)
    // const stream = new PassThrough()
    const stream = new Transform({
      transform (chunk, encoding, callback) {
        console.log('[MULTIPLEXER]', 'Received chunk of ' + chunk.length + ' bytes (' + encoding + ') into writable stream ' + name + ' (' + id + '), sending into main stream ...')
        this.push(Buffer.concat([
          Buffer.from(prefix),
          chunk
        ]))
        callback()
      }
    })

    this.writables[id] = { name, prefix, stream }
    stream.on('end', () => {
      console.log('[MULTIPLEXER]', 'Received stream end for writable stream ' + name + ' (' + id + '), closing ...')
      delete this.writables[id]
    })

    // We pipe all the data from the writable stream into the main stream, all the backpressure
    // is handled by the pipe method and will be propagated to the source stream.
    stream.pipe(this.stream, { end: false })

    console.log('[MULTIPLEXER]', 'Generated writable stream for ' + name + ' (' + id + ').')

    return stream
  }

  readable (name) {
    const id = uuidv4()
    const prefix = this.nameToPrefix(name)
    const stream = new PassThrough()
    this.readables[id] = { name, prefix, stream }

    // If the readable stream got a backpressure, the main stream will be paused and should
    // be resumed when the readable stream is ready to receive data.
    stream.on('drain', () => {
      console.log('[MULTIPLEXER]', 'Received stream drain for readable stream ' + name + ' (' + id + '), resuming main stream ...')
      this.stream.resume()
    })
    stream.on('end', () => {
      console.log('[MULTIPLEXER]', 'Received stream end for readable stream ' + name + ' (' + id + '), closing ...')
      delete this.readables[id]
    })

    console.log('[MULTIPLEXER]', 'Generated readable stream for ' + name + ' (' + id + ')')

    return stream
  }
}