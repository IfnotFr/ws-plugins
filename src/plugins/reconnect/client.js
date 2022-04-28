export default class {
  version = '1.0.0'

  constructor ({ parent, log, options = {} } = {}) {
    this.client = parent
    this.log = log

    this.options = Object.assign({}, {
      delay: 1000,
      handler: null
    }, options)
  }

  init () {
    if (!this.client.hasPlugin('pingpong')) {
      throw new Error('Reconnect plugin requires pingpong plugin')
    }
    if (this.options.handler === null) {
      throw new Error('Reconnect plugin requires valid handler')
    }
    if (this.client.options.catchErrors !== true) {
      throw new Error('Reconnect plugin requires catchErrors option to be true')
    }
  }

  close () {
    this.log.info('Got "close" event, calling reconnect handler in', this.options.delay, 'ms')
    setTimeout(() => {
      this.options.handler()
    }, this.options.delay)
  }
}
