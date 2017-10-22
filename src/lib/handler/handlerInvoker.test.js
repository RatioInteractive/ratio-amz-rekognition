import { Container } from 'aurelia-dependency-injection'
import { expectToBeRejected } from '../helpers'
import handlerInvoker from './handlerInvoker'

describe('handlerInvoker', () => {
  let mockHandlerInstance, event, context, container

  beforeAll(() => {
    container = new Container()
    event = {}
    context = {}
    mockHandlerInstance = {
      execute: jest.fn(Promise.resolve())
    }
    container.registerInstance('handler', mockHandlerInstance)
    container.registerInstance('handler-no-execute', {})
  })

  beforeEach(() => {
    mockHandlerInstance.execute.mockReturnValue(Promise.resolve())
  })

  it('should call execute on handler type', () => {
    return handlerInvoker(event, context, 'handler', container)
      .then(() => {
        expect(mockHandlerInstance.execute).toHaveBeenCalled()
      })
  })

  it('should pass event and context to handler', () => {
    return handlerInvoker(event, context, 'handler', container)
      .then(() => {
        expect(mockHandlerInstance.execute).toHaveBeenCalledWith(event, context)
      })
  })

  it('should return handler response', () => {
    const expectedResponse = {}
    mockHandlerInstance.execute.mockReturnValue(Promise.resolve(expectedResponse))
    return handlerInvoker(event, context, 'handler', container)
      .then((response) => {
        expect(response).toEqual(expectedResponse)
      })
  })

  it('should throw if handler name is not passed', () => {
    return handlerInvoker(event, context, undefined, container)
      .then(() => { expectToBeRejected() })
      .catch((err) => {
        expect(err.message).toMatch(/handlerName is required. The invoke operation cannot be performed/)
      })
  })

  it('should throw if handler instance does not have execute() function', () => {
    const handlerName = 'handler_without_execute'
    return handlerInvoker(event, context, handlerName, container)
      .then(() => { expectToBeRejected() })
      .catch((err) => {
        expect(err.message).toEqual(`The handler -${handlerName}- must expose an execute() function`)
      })
  })
})
