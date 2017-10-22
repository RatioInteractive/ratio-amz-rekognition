import { Container } from 'aurelia-dependency-injection'
import { init } from '../../lib/initFunction'
import ServiceStatusHandler from './ServiceStatusHandler'

let container = new Container()
container.makeGlobal()
const handle = init(container, (container) => {
  container.registerSingleton('ServiceStatusHandler', ServiceStatusHandler)
})

const handler = (event, context, cb) => {
  return handle(event, context, 'ServiceStatusHandler', cb)
}

export default handler
