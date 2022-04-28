import Stream from './stream'

export default class extends Stream {
  version = '1.0.0'

  constructor ({ parent, log, options = {} } = {}) {
    super({ parent, log, options })
    this.client = parent
  }

  open () {
    this.wrap(this.client.ws)
  }
}