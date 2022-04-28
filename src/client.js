import merge from 'lodash.merge'
import omit from 'lodash.omit'
import EventEmitter2 from 'eventemitter2'

class Client extends EventEmitter2 {
  constructor (ws, options) {
    super()

    this.ws = ws
    this.options = merge({}, this.defaultOptions = {
      catchErrors: true,
      plugins: {
        pingpong: require('./plugins/pingpong/client').default,
        reconnect: require('./plugins/reconnect/client').default,
        stream: require('./plugins/stream/client').default,
        router: require('./plugins/router/client').default,
        asyncPayload: require('./plugins/async-payload/client').default,
      },
      log: 'info',
    }, options)
    this.log = this.createLogger({ level: this.options.log })
  }

  init () {
    if (this.options.debug) this.log.info('Starting client ...')
    this.loadPlugins(this.options.plugins, omit(this.options, Object.keys(this.defaultOptions)))
    this.injectPluginsNamespaces(this.ws, Object.keys(this.getPlugins()))
    this.handleEvents()
    return this
  }

  handleEvents () {
    this.ws.on('open', this.onWsOpen = () => {
      this.log.info('Connection opened.')
      this.pluginDispatch('open')
    })

    this.ws.on('close', this.onWsClose = () => {
      this.log.info('Connection closed.')
      this.pluginDispatch('close')
      this.ws.off('open', this.onWsOpen)
      this.ws.off('close', this.onWsClose)
      if (this.options.catchErrors) this.ws.off('error', this.onWsError)
    })

    if (this.options.catchErrors) {
      this.ws.on('error', this.onWsError = (error) => {
        this.log.error(error)
        this.pluginDispatch('error')
        this.ws.terminate()
      })
    }
  }
}

import hasPlugins from './common/has-plugins'
import hasLogger from './common/has-logger'

Object.assign(Client.prototype, hasPlugins)
Object.assign(Client.prototype, hasLogger)

export default Client