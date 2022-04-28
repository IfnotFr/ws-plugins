export default class {
  version = '1.0.0'

  constructor ({ parent, log, options = {} } = {}) {
    this.client = parent
    this.log = log

    this.options = Object.assign({}, {
      interval: 30000,
      timeout: 5000,
      outage: 3,
      onTimeout: () => {
        this.log.info('Terminating websocket ...')
        this.client.ws.terminate()
      }
    }, options)
  }

  init () {
    this.timeout = null
    this.lastHeartbeat = null
  }

  heartbeat (outage = false) {
    if (!outage) {
      this.log.debug('Got heartbeat in ' + (this.lastHeartbeat ? Date.now() - this.lastHeartbeat : null) + ' ms, setting new timeout in ' + (this.options.interval + this.options.timeout) + ' ms.')
      this.lastHeartbeat = Date.now()
      this.client.ws.pingpong.outage = 0
    }

    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => {
      this.client.ws.pingpong.outage++
      if (this.client.ws.pingpong.outage >= this.options.outage) {
        this.log.warning('Connection timeout, calling "ontimeout".')
        this.options.onTimeout()
      } else {
        this.log.warning('Connection outage (', this.client.ws.pingpong.outage, '/', this.options.outage, ').')
        this.heartbeat(true)
      }
    }, this.options.interval + this.options.timeout)
  }

  open () {
    this.client.ws.pingpong.outage = 0

    this.log.info('Watching new connection ...')
    this.heartbeat()

    // Handling ping
    this.client.ws.on('ping', this.onPing = (rawDateNow) => {
      this.log.debug('Received a ping, responding with a pong ...')
      this.heartbeat()
    })
  }

  close () {
    this.log.info('Exiting ...')
    if (this.onPing) this.client.ws.off('ping', this.onPing)
    clearTimeout(this.timeout)
  }
}