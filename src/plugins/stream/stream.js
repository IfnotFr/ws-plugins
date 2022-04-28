import { createWebSocketStream } from 'ws'
import Multiplexer from './helpers/multiplexer'

export default class {
  constructor ({ parent, log, options = {} } = {}) {
    this.log = log
    this.parent = parent
    this.options = Object.assign({}, {
      nameLength: 8,
    }, options)
  }

  wrap (ws) {
    const multiplexer = new Multiplexer({
      stream: createWebSocketStream(ws),
      prefixLength: this.options.nameLength,
    })

    ws.stream = {
      readable: (name, options = {}) => {
        return multiplexer.readable(name, options)
      },
      writable: (name, options = {}) => {
        return multiplexer.writable(name, options)
      }
    }
  }
}