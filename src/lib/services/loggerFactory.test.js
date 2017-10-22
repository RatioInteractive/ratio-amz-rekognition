import loggerFactory from './loggerFactory'

describe('loggerFactory', () => {
  let mockConsole, logger

  beforeEach(() => {
    mockConsole = {
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn()
    }
    logger = loggerFactory('my_context')
    logger.console = mockConsole
    logger.process = process
    logger.process.env.SUPPRESS_LOGGER = false
    logger.process.env.LOG_LEVEL = 'debug'
  })

  afterEach(() => {
    process.env.SUPPRESS_LOGGER = true
    delete logger.process.env.LOG_LEVEL
  })

  it('should return a logger instance initialized with given context', () => {
    const myLogger = loggerFactory('my_context')
    expect(myLogger).toBeDefined()
    expect(myLogger.context).toEqual('my_context')
  })

  it('should log with passed level', () => {
    logger.log('info')
    expect(mockConsole.info).toHaveBeenCalled()
  })

  it('should log formatted message', () => {
    logger.log('info', 'my_message')
    expect(mockConsole.info).toHaveBeenCalledWith('info: [my_context] - my_message')
  })

  it('should not log messages with log level below LOG_LEVEL', () => {
    logger.process.env.LOG_LEVEL = 'error' // only errors will be logged
    logger.debug('my_message')
    expect(mockConsole.info).toHaveBeenCalledTimes(0)
    logger.info('my_message')
    expect(mockConsole.info).toHaveBeenCalledTimes(0)
    logger.warn('my_message')
    expect(mockConsole.warn).toHaveBeenCalledTimes(0)
    logger.error('my_message')
    expect(mockConsole.error).toHaveBeenCalled()

    logger.process.env.LOG_LEVEL = 'warn' // only errors and warns will be logged
    logger.debug('my_message')
    expect(mockConsole.info).toHaveBeenCalledTimes(0)
    logger.info('my_message')
    expect(mockConsole.info).toHaveBeenCalledTimes(0)
    logger.warn('my_message')
    expect(mockConsole.warn).toHaveBeenCalled()
    logger.error('my_message')
    expect(mockConsole.error).toHaveBeenCalled()

    logger.process.env.LOG_LEVEL = 'info' // only errors, warns and info will be logged
    logger.debug('my_message')
    expect(mockConsole.info).toHaveBeenCalledTimes(0)
    logger.info('my_message')
    expect(mockConsole.info).toHaveBeenCalled()
    logger.warn('my_message')
    expect(mockConsole.warn).toHaveBeenCalled()
    logger.error('my_message')
    expect(mockConsole.error).toHaveBeenCalled()

    logger.process.env.LOG_LEVEL = 'debug' // all levels will be logged
    logger.debug('my_message')
    expect(mockConsole.info).toHaveBeenCalled()
    logger.info('my_message')
    expect(mockConsole.info).toHaveBeenCalled()
    logger.warn('my_message')
    expect(mockConsole.warn).toHaveBeenCalled()
    logger.error('my_message')
    expect(mockConsole.error).toHaveBeenCalled()
  })

  it('should default to "warn" LOG_LEVEL', () => {
    delete logger.process.env.LOG_LEVEL // should use default log level
    logger.debug('my_message')
    expect(mockConsole.info).toHaveBeenCalledTimes(0)
    logger.info('my_message')
    expect(mockConsole.info).toHaveBeenCalledTimes(0)
    logger.warn('my_message')
    expect(mockConsole.warn).toHaveBeenCalled()
    logger.error('my_message')
    expect(mockConsole.error).toHaveBeenCalled()
  })

  it('should fail if invalid log level is assigned to LOG_LEVEL', () => {
    logger.process.env.LOG_LEVEL = 'INVALID'
    logger.log('info', 'my_message')
    expect(mockConsole.error).toHaveBeenCalledWith('Invalid LOG_LEVEL. Expected one of: debug, info, warn, error')
    expect(mockConsole.info).toHaveBeenCalledTimes(0)
  })

  it('should fail if invalid log level is passed to log function', () => {
    delete logger.process.env.LOG_LEVEL
    logger.log('invalid', 'my_message')
    expect(mockConsole.error).toHaveBeenCalledWith('Invalid level passed to log function. Expected one of: debug, info, warn, error')
  })
})
