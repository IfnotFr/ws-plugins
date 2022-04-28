import Streams from '../../../src/plugins/stream/streams'

const createPlugin = (options = {}) => {
  return new Streams({
    parent: getClientMock(),
    log: getWinstonMock(),
    options
  })
}

test('plugin can be created', () => {
  const plugin = createPlugin()
})

test('values transformation', () => {
  const plugin = createPlugin()


})
