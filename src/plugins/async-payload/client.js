import { v4 as uuidv4 } from 'uuid'

export default class {
  version = '1.0.0'

  constructor ({ parent, log, options = {} } = {}) {
    this.client = parent
    this.log = log
  }

  init () {
    if (!this.client.hasPlugin('router')) {
      throw new Error('AsyncPayload plugin requires Router plugin')
    }
  }

  transform (value) {
    if (typeof value === 'object') {
      if (typeof value?.then === 'function') { // If the value is a promise
        const id = uuidv4()

        value.then(result => {
          this.sendPromiseResolve(id, result)
        }).catch(error => {
          this.sendPromiseReject(id, error)
        })

        return '/wsp/async-payload/promise:' + id
      } else if (Array.isArray(value)) { // If the value is an array
        const cloned = []
        for (let i = 0; i < value.length; i++) {
          cloned[i] = this.transform(value[i])
        }
        return cloned
      } else { // If the value is an object
        const cloned = {}
        for (let key in value) {
          cloned[key] = this.transform(value[key])
        }
        return cloned
      }
    } else {
      return value
    }
  }

  sendPromiseResolve (id, result) {
    this.client.ws.send('/wsp/async-payload/promise/resolve', { id, result })
  }

  sendPromiseReject (id, error) {
    this.client.ws.send('/wsp/async-payload/promise/reject', { id, error })
  }

  open () {
    this.client.on('sending', this.onSending = (payload) => {
      payload.data = this.transform(payload.data)
    })
  }

  close () {
    if (this.onSending) this.client.off('sending', this.onSending)
  }
}
