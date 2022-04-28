import Router from './router'

export default class extends Router {
  version = '1.0.0'

  constructor ({ parent, log, options = {} } = {}) {
    super({ parent, log, options })
    this.client = parent
  }

  open () {
    this.wrap(this.client.ws)
  }
}