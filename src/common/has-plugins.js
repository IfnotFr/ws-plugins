export default {
  loadPlugins (plugins, options) {
    this.plugins = {}

    // Load plugins
    for (let key in options) {
      if (key in plugins) {
        const log = this.log.child({ plugin: key })
        log.info('Loading with options ' + JSON.stringify(options[key]) + '...')
        this.plugins[key] = new plugins[key]({ parent: this, log, options: options[key] })
      } else {
        this.log.error('Plugin ' + key + ' not found')
      }
    }

    // Run init
    for (let key in this.plugins) {
      if ('init' in this.plugins[key]) this.plugins[key].init()
    }
  },

  injectPluginsNamespaces (ws, plugins = []) {
    for (let key of plugins) {
      ws[key] = {}
    }
  },

  hasPlugin (name, version = null) {
    if (name in this.plugins) {
      // TODO: check version
      return true
    }

    return false
  },

  getPlugins () {
    return this.plugins
  },

  pluginDispatch (method, args) {
    for (let key in this.plugins) {
      this.log.debug('Dispatching ' + method + ' to plugin ...', { plugin: key })
      if (method in this.plugins[key]) this.plugins[key][method](args)
    }
  }
}