import AsyncPayloadClient from '../../../src/plugins/async-payload/client'

const createPlugin = (options = {}) => {
  return new AsyncPayloadClient({
    parent: getClientMock({
      wrapSend: true,
      wrapSendStringifyObjects: true,
    }),
    log: getWinstonMock(),
    options
  })
}

test('plugin can be created', () => {
  const plugin = createPlugin()
})

test('values transformation', () => {
  const plugin = createPlugin()

  // Top level primitives
  expect(plugin.transform('string')).toBe('string')
  expect(plugin.transform(123)).toBe(123)
  expect(plugin.transform(true)).toBe(true)

  // Nested primitives
  expect(plugin.transform(['one', 'two'])).toStrictEqual(['one', 'two'])
  expect(plugin.transform({ a: 'one', b: 'two' })).toStrictEqual({ a: 'one', b: 'two' })

  // Promises
  expect(plugin.transform(new Promise(resolve => {}))).toStrictEqual('PROMISE')
})
