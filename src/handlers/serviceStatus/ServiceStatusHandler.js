// import versionJSON from '../.version.json'
import BaseHandler from '../../lib/handler/BaseHandler'
import { success } from '../../lib/apigLambdaProxyHelper'

export default class ServiceStatusHandler extends BaseHandler {
  static inject() { return ['EnvVarsManager'] }
  constructor(envVarsManager) {
    super()
    this.envVarsManager = envVarsManager
  }

  _process(event, context) {
    const version = this.envVarsManager.get('serviceVersion')
    this.logger.info('Service version:', version)
    return Promise.resolve(success({ version: version }))
  }
}
