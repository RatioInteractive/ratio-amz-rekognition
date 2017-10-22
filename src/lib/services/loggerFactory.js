/**
 * Provides the logger factory
 */
import { isNil } from 'lodash'

const levels = ['debug', 'info', 'warn', 'error']

/**
 * Creates and returns a new instance of a Logger class initialized with the given context.
 * @param {string} context - represents a string to prepend to all logged messages.
 * @returns a new instance of a logger initialized with the given context string.
 */
export default function loggerFactory(context) {
  return new Logger(context)
}

/**
 * Provides methods that allow to log error, warn, info and debug formatted messages.
 * @class Logger
 */
class Logger {
  /**
   * Creates an instance of Logger.
   * @param {any} context - represents a string to prepend to all logged messages.
   * @memberof Logger
   */
  constructor(context) {
    this.context = context
    this.console = console
    this.process = process
  }

  /**
   * Logs a message with the given level.
   * @param {any} level - the level to log the message with. debug level will be mapped to info level.
   * @param {any} message - the message string to log.
   * @param {any} optionalParams - the parameters to be logged along with the message.
   * @memberof Logger
   */
  log(level, message, ...optionalParams) {
    if (this.process.env.SUPPRESS_LOGGER === 'true' || this.process.env.SUPPRESS_LOGGER === true) {
      return
    }
    const enabledLevel = level === 'debug' ? 'info' : level // debug is mapped to info because debug is not defined on console

    const formattedMessage = `${level}: [${this.context}] - ${message}`
    const minLevel = isNil(this.process.env.LOG_LEVEL) ? 'warn' : this.process.env.LOG_LEVEL
    const minLevelIndex = levels.indexOf(minLevel)
    if (minLevelIndex === -1) {
      this.console.error('Invalid LOG_LEVEL. Expected one of: debug, info, warn, error')
      return
    }
    const levelIndex = levels.indexOf(level)
    if (levelIndex === -1) {
      this.console.error('Invalid level passed to log function. Expected one of: debug, info, warn, error')
      return
    }
    if (levelIndex >= minLevelIndex) {
      this.console[enabledLevel](formattedMessage, ...optionalParams)
    }
  }

  /**
   * Logs an info message.
   * @param {any} message - the message string to log.
   * @param {any} optionalParams - the parameters to be logged along with the message.
   * @memberof Logger
   */
  info(message, ...optionalParams) {
    this.log('info', message, ...optionalParams)
  }

  /**
   * Logs a debug message.
   * @param {any} message - the message string to log.
   * @param {any} optionalParams - the parameters to be logged along with the message.
   * @memberof Logger
   */
  debug(message, ...optionalParams) {
    this.log('debug', message, ...optionalParams)
  }

  /**
   * Logs a warning message.
   * @param {any} message - the message string to log.
   * @param {any} optionalParams - the parameters to be logged along with the message.
   * @memberof Logger
   */
  warn(message, ...optionalParams) {
    this.log('warn', message, ...optionalParams)
  }

  /**
   * Logs an error message.
   * @param {any} message - the message string to log.
   * @param {any} optionalParams - the parameters to be logged along with the message.
   * @memberof Logger
   */
  error(message, ...optionalParams) {
    this.log('error', message, ...optionalParams)
  }
}
