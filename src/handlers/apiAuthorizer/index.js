import { Container } from 'aurelia-dependency-injection'
import { init } from '../../lib/initFunction'
import ApiAuthorizerHandler from './ApiAuthorizerHandler'

export default init('ApiAuthorizerHandler', new Container(), (container) => {
  container.registerSingleton('ApiAuthorizerHandler', ApiAuthorizerHandler)
}, ['jwtSecret'])
