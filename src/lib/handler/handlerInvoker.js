/**
 * Provides the invocation function.
 * @module lib/handler/handlerInvoker
 */

import { isNil, isFunction } from 'lodash'
import loggerFactory from '../services/loggerFactory'

const logger = loggerFactory('handlerInvoker')

/**
 * Creates an handler instance - with all its dependencies resolved - and executes it.
 * @param {any} event - the event object passed to the function.
 * @param {any} context - the context object passed to the function.
 * @param {any} handlerName - the handler name to resolve
 * @param {any} container - the DI container that creates the handler instance and resolves its dependencies.
 * @returns the response returned by the handler execution.
 */
export default async function invoke(event, context, handlerName, container) {
  logger.debug('invoke() called with arguments:\n', { event, context, handlerName })
  if (isNil(handlerName)) {
    const err = new Error('handlerName is required. The invoke operation cannot be performed')
    logger.error(err.message)
    throw err
  }

  // Uses the DI container to create the handler. The handlerName must to be registered in the container during function initialization.
  let handlerInstance = container.get(handlerName)
  if (!isFunction(handlerInstance.execute)) {
    const err = new Error(`The handler -${handlerName}- must expose an execute() function`)
    logger.error(err.message)
    throw err
  }
  logger.debug(`${handlerName} instance created`)

  logger.debug(`Invoke execute() on ${handlerName} handler`)
  try {
    return handlerInstance.execute(event, context)
  } catch (err) {
    logger.error(err, { err, context }, (loggerError) => {
      // If for any reasons the logger throws an error, log it with the console
      if (loggerError) {
        console.log('Logger error: ' + loggerError)
      }
    })
    throw err
  }
}
