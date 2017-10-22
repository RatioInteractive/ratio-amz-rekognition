import loggerFactory from '../services/loggerFactory'

/**
 * Base Handler class that provides common functionality for all handlers.
 * @class BaseHandler
 */
export default class BaseHandler {
  /**
   * Creates an instance of BaseHandler.
   * @memberof BaseHandler
   */
  constructor() {
    this.handlerName = this.constructor.name
    this.logger = loggerFactory(this.handlerName)
  }

  /**
   * Executes the handler logic.
   *
   * Extend this base implementation with whatever is appropriate for your specific handler's common logic.
   * @param {any} event - the event object passed to the function.
   * @param {any} context - the context object passed to the function.
   * @returns The response from the handler logic.
   * @memberof BaseHandler
   */
  async execute(event, context) {
    this.logger.info(`Executing handler ${this.handlerName}`)
    return this._process(event, context)
  }

  /**
   * This method should be overridden by derived classes with the handler's specific logic.
   *
   * @param {any} event - the event object passed to the function.
   * @param {any} context - the context object passed to the function.
   * @memberof BaseHandler
   */
  async _process(event, context) {
    this.logger.info('Remember to overwrite this method if you need to provide custom handling logic.')
  }
}
