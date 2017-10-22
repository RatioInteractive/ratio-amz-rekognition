import BaseHandler from './BaseHandler'

describe('BaseHandler', () => {
  let handler

  beforeEach(() => {
    handler = new TestableHandler()
  })

  it('should instantiate logger with context', () => {
    expect(handler.logger).toBeDefined()
    expect(handler.logger.context).toEqual(handler.handlerName)
  })

  describe('when execute() is called', () => {
    it('should call _process() on derived class', () => {
      const expectedContext = { context: true }
      const expectedEvent = { event: true }
      handler._process = jest.fn(() => Promise.resolve())
      handler.execute(expectedEvent, expectedContext)
      expect(handler._process).toHaveBeenCalledWith(expectedEvent, expectedContext)
    })

    it('should return response from _process()', async () => {
      const expectedResponse = { prop1: 'prop1_value' }
      handler._process = jest.fn(() => Promise.resolve(expectedResponse))
      const response = await handler.execute({}, {})
      expect(response).toEqual(expectedResponse)
    })
  })
})

class TestableHandler extends BaseHandler {
}
