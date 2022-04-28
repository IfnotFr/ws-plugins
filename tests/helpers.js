global.getWinstonMock = () => {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}

global.getClientMock = (options = {}) => {
  return {
    options
  }
}