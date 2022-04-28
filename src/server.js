import { v4 as uuidv4 } from 'uuid'
import { hri } from 'human-readable-ids'
import merge from 'lodash.merge'
import omit from 'lodash.omit'
import EventEmitter2 from 'eventemitter2'

class Server extends EventEmitter2 {
  constructor (wss, options) {
    super()

    this.wss = wss
    this.options = merge({}, this.defaultOptions = {
      wrapSend: true,
      wrapSendStringifyObjects: true,
      plugins: {
        pingpong: require('./plugins/pingpong/server').default,
        stream: require('./plugins/stream/server').default,
        router: require('./plugins/router/server').default,
      },
      log: 'info',
    }, options)
    this.log = this.createLogger({ level: this.options.log })
  }

  init () {
    this.log.info('Starting server ...')
    this.loadPlugins(this.options.plugins, omit(this.options, Object.keys(this.defaultOptions)))
    this.handleEvents()
    return this
  }

  handleEvents () {
    this.wss.on('connection', this.onWssConnection = (ws) => {
      this.injectPluginsNamespaces(ws, Object.keys(this.getPlugins()))
      ws.uid = uuidv4()
      ws.id = hri.random()

      this.log.debug('Got new connection ' + ws.id)

      this.pluginDispatch('connection', { ws })
    })

    this.wss.on('close', this.onWssClose = () => {
      this.log.info('Server closed.')
      this.pluginDispatch('close')
      this.ws.off('connection', this.onWssConnection)
      this.ws.off('close', this.onWssClose)
    })
  }
}

import hasPlugins from './common/has-plugins'
import hasLogger from './common/has-logger'

Object.assign(Server.prototype, hasPlugins)
Object.assign(Server.prototype, hasLogger)

export default Server