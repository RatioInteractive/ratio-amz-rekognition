/**
 * Provides functions' initialization logic.
 */
import 'babel-polyfill'
import 'aurelia-polyfills'
import { isNil, isFunction, isArray } from 'lodash'
import handlerInvoker from './handler/handlerInvoker'
import EnvVarsManager from './services/EnvVarsManager'

let globalContainer

/**
 * Initializes the function by initializing the DI container and resolving the environment variables needing decryption.
 * @param {string} handlerName - the name of the handler that will be execution by this function invocation.
 * @param {object} container - the DI container to be initialized.
 * @param {function} configureContainer - an optional function that configures the container with all dependency registrations
 * needed by this function invocation. The container instance will be passed to this function invocation.
 * @param {array of strings} envVarNamesToDecrypt - an optional array containing the names of the environment variables that need to
 * be decrypted before this function's handler is executed.
 * @param {function} customInit = an optional function that allows to execute custom initialization code (i.e opening data connections, etc.)
 * before the handler is executed. This function is called with the container instance as first argument. This function is
 * called after the environment variables are decrypted.
 * @returns The handler function to be invoked by this function execution. The handler function will be invoked by
 * the function's runtime with an event instance, a context instance and a callback function.
 */
export function init(handlerName, container, configureContainer, envVarNamesToDecrypt, customInit) {
  if (isNil(handlerName)) {
    throw new Error('handler name is required')
  }

  if (isNil(container)) {
    throw new Error('container is required')
  }

  if (!isNil(configureContainer) && !isFunction(configureContainer)) {
    throw new Error('configureContainer must be a function')
  }

  if (!isNil(customInit) && !isFunction(customInit)) {
    throw new Error('customInit must be a function')
  }

  container.makeGlobal()
  if (!container.hasResolver('EnvVarsManager')) {
    container.registerInstance('EnvVarsManager', new EnvVarsManager())
  }
  if (!isNil(configureContainer)) {
    configureContainer(container)
  }

  let decryptAndCachePromise = Promise.resolve()
  if (isArray(envVarNamesToDecrypt) && envVarNamesToDecrypt.length > 0) {
    const envVarsManagerInstance = container.get('EnvVarsManager')
    decryptAndCachePromise = envVarsManagerInstance.decryptAndCache(envVarNamesToDecrypt)
  }

  globalContainer = container
  return async (event, context, cb) => {
    try {
      await decryptAndCachePromise

      if (!isNil(customInit)) {
        await customInit(container)
      }

      const response = await handlerInvoker(event, context, handlerName, container)
      cb(null, response)
    } catch (err) {
      cb(err, null)
    }
  }
}

/**
 * The container passed during initialization.
 */
export { globalContainer }
