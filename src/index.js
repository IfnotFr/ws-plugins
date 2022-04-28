import Client from './client'
import Server from './server'
import plugins from './plugins/index'

export const client = (ws, options) => (new Client(ws, options)).init()
export const server = (wss, options) => (new Server(wss, options)).init()
export { plugins }

export default {
  client,
  server,
  plugins
}