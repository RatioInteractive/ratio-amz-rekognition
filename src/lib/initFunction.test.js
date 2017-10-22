import _ from 'lodash'
import { Container } from 'aurelia-dependency-injection'
import { init, globalContainer } from './initFunction'
import EnvVarsManager from './services/EnvVarsManager'
import mockHandlerInvoker from './handler/handlerInvoker'

jest.mock('./handler/handlerInvoker', () => { return jest.fn(() => Promise.resolve()) })

let container
describe('initFunction', () => {
  beforeEach(() => {
    container = new Container()
  })

  it('should require handler name', () => {
    expect(() => {
      init(undefined)
    }).toThrow(/handler name is required/)
  })

  it('should require container', () => {
    expect(() => {
      init('handler', undefined)
    }).toThrow(/container is required/)
  })

  it('should require configureContainer to be a function', () => {
    expect(() => {
      init('handler', {}, {})
    }).toThrow(/configureContainer must be a function/)
  })

  it('should call passed configureContainer function with container as parameter', () => {
    const mockConfigureContainer = jest.fn()
    init('handler', container, mockConfigureContainer)
    expect(mockConfigureContainer).toHaveBeenCalledWith(container)
  })

  it('should export the passed container as a reference', () => {
    init('handler', container)
    expect(globalContainer).toEqual(container)
  })

  it('should set the passed container as global', () => {
    init('handler', container)
    expect(Container.instance).toEqual(container)
  })

  it('should add EnvVarsManager service to the container if it is not already registered', () => {
    init('handler', container)
    expect(container.hasResolver('EnvVarsManager')).toBe(true)
    expect(container.getResolver('EnvVarsManager').state instanceof EnvVarsManager).toBe(true)
  })

  it('should not add EnvVarsManager service to the container if it is already registered', () => {
    const mockEnvVarsManager = { isATestMock: true, decryptAndCache: () => { } }
    container.registerInstance('EnvVarsManager', mockEnvVarsManager)
    init('handler', container)
    expect(container.getResolver('EnvVarsManager').state.isATestMock).toBe(true)
  })

  it('should decrypt env vars if an array of environment variable names is passed', () => {
    const expectedEnvVars = ['var1', 'var2', 'var3']
    const mockEnvVarsManager = { decryptAndCache: jest.fn().mockReturnValue(Promise.resolve()) }
    container.registerInstance('EnvVarsManager', mockEnvVarsManager)
    init('handler', container, undefined, expectedEnvVars)
    expect(mockEnvVarsManager.decryptAndCache).toHaveBeenCalledWith(expectedEnvVars)
  })

  it('should not decrypt env vars if array of environment variable names is not passed', () => {
    const mockEnvVarsManager = { decryptAndCache: jest.fn().mockReturnValue(Promise.resolve()) }
    container.registerInstance('EnvVarsManager', mockEnvVarsManager)
    init('handler', container, undefined, undefined)
    expect(mockEnvVarsManager.decryptAndCache).toHaveBeenCalledTimes(0)
  })

  it('should not decrypt env vars if array of environment variable names is empty', () => {
    const mockEnvVarsManager = { decryptAndCache: jest.fn().mockReturnValue(Promise.resolve()) }
    container.registerInstance('EnvVarsManager', mockEnvVarsManager)
    init('handler', container, undefined, [])
    expect(mockEnvVarsManager.decryptAndCache).toHaveBeenCalledTimes(0)
  })

  it('should return handler function', () => {
    const handler = init('handler', container)
    expect(_.isFunction(handler)).toEqual(true)
  })

  describe('when handler() is called', () => {
    let mockEnvVarsManager, handler, decryptAndCacheResolver
    beforeEach(() => {
      mockEnvVarsManager = {
        decryptAndCache: jest.fn().mockReturnValue(new Promise((resolve) => {
          decryptAndCacheResolver = resolve
        }))
      }
      container.registerInstance('EnvVarsManager', mockEnvVarsManager)
      mockHandlerInvoker.mockClear()
      handler = init('handler', container, undefined, ['var1'])
    })

    it('should call handlerInvoker() after env variables decryption is done', (done) => {
      const expectedEvent = { prop1: 'prop1 val' }
      const expectedContext = { contextProp1: 'context prop1 val' }
      handler(expectedEvent, expectedContext, () => {
        expect(mockHandlerInvoker).toHaveBeenCalledTimes(1)
        expect(mockHandlerInvoker).toHaveBeenCalledWith(expectedEvent, expectedContext, 'handler', container)
        done()
      })
      expect(mockHandlerInvoker).toHaveBeenCalledTimes(0)
      decryptAndCacheResolver() // this forces the decryption promise to resolve
    })

    it('should return response from handlerInvoker()', (done) => {
      const expectedHandlerResponse = { res: 'my response' }
      mockHandlerInvoker.mockReturnValue(Promise.resolve(expectedHandlerResponse))
      handler({}, {}, (err, response) => {
        expect(err).toBeNull()
        expect(response).toEqual(expectedHandlerResponse)
        done()
      })
      decryptAndCacheResolver()
    })

    it('should return error from handlerInvoker()', (done) => {
      const expectedHandlerError = new Error('handler error')
      mockHandlerInvoker.mockReturnValue(Promise.reject(expectedHandlerError))
      handler({}, {}, (err, response) => {
        expect(response).toBeNull()
        expect(err).toEqual(expectedHandlerError)
        done()
      })
      decryptAndCacheResolver()
    })

    it('should return error from env vars decryption', (done) => {
      const expectedDecryptionError = new Error('decryption error')
      mockEnvVarsManager.decryptAndCache.mockReturnValue(Promise.reject(expectedDecryptionError))
      handler = init('handler', container, undefined, ['var1'])
      handler({}, {}, (err, response) => {
        expect(response).toBeNull()
        expect(err).toEqual(expectedDecryptionError)
        done()
      })
      decryptAndCacheResolver()
    })

    it('should not call handlerInvoker() if env vars decryption returns an error', (done) => {
      const expectedDecryptionError = new Error('decryption error')
      mockEnvVarsManager.decryptAndCache.mockReturnValue(Promise.reject(expectedDecryptionError))
      handler = init('handler', container, undefined, ['var1'])
      handler({}, {}, () => {
        expect(mockHandlerInvoker).toHaveBeenCalledTimes(0)
        done()
      })
      decryptAndCacheResolver()
    })
  })

  describe('when customInit function is passed', () => {
    it('should call customInit() after environment variable are decrypted', (done) => {
      let decryptAndCacheResolver
      const mockEnvVarsManager = {
        decryptAndCache: jest.fn().mockReturnValue(new Promise((resolve) => {
          decryptAndCacheResolver = resolve
        }))
      }
      container.registerInstance('EnvVarsManager', mockEnvVarsManager)

      const mockCustomInit = jest.fn(() => Promise.resolve())
      const handler = init('handler', container, undefined, ['var1'], mockCustomInit)
      handler({}, {}, () => {
        expect(mockCustomInit).toHaveBeenCalledTimes(1)
        done()
      })
      expect(mockCustomInit).toHaveBeenCalledTimes(0)
      decryptAndCacheResolver() // this forces the decryption promise to resolve
    })

    it('should call handlerInvoker() after customInit resolves', (done) => {
      let customInitResolver
      mockHandlerInvoker.mockReset()
      const mockCustomInit = jest.fn().mockReturnValue(new Promise((resolve) => {
        customInitResolver = resolve
      }))
      const handler = init('handler', container, undefined, undefined, mockCustomInit)
      handler({}, {}, () => {
        expect(mockHandlerInvoker).toHaveBeenCalledTimes(1)
        done()
      })
      expect(mockHandlerInvoker).toHaveBeenCalledTimes(0)
      customInitResolver() // this forces the customInit promise to resolve
    })

    it('should require customInit to be a function', () => {
      expect(() => {
        init('handler', container, undefined, undefined, {})
      }).toThrow(/customInit must be a function/)
    })
  })
})
