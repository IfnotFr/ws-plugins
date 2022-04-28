import EventEmitter2 from 'eventemitter2'

export default class Router {
  constructor ({ parent, log, options = {} } = {}) {
    this.log = log
    this.parent = parent
    this.options = Object.assign({}, {
      delimiter: '/',
      wildcard: false,
      prefix: 'WSP-ROUTER:'
    }, options)
  }

  init () {
    this.events = new EventEmitter2({
      wildcard: this.options.wildcard,
      delimiter: this.options.delimiter,
    })
  }

  wrap (ws) {
    /*
     * WRAPPING SEND FUNCTION
     */
    const send = ws.send
    ws.send = (name, data) => {
      // Forward default behavior if there is only one parameter
      if (data === undefined) return send.call(ws, name)
      else {
        const payload = { name, data }
        this.parent.emit('sending', payload)
        this.log.debug('Sending: ' + payload.name)
        send.call(ws, this.options.prefix + JSON.stringify(payload))
      }
    }

    /*
     * WRAPPING ON FUNCTION
     */
    const on = ws.on
    ws.on = (name, handler) => {
      // Forward default behavior if the first char is not a delimiter
      if (name.charAt(0) !== this.options.delimiter) {
        return on.call(ws, name, (data) => {
          // When receiving a message
          if (name === 'message') {
            const message = data.toString()
            if (message.substring(0, this.options.prefix.length) === this.options.prefix) {
              const payload = JSON.parse(message.substring(this.options.prefix.length))
              return this.events.emit(payload.name, payload.data) // TODO: SEND SOME JSON.parse data ?
            }
          }

          return handler(data)
        })
      } else {
        return this.events.on(name, handler)
      }
    }
  }
}