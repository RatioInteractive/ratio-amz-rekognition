import { isFunction } from 'lodash'
import { init } from '../../lib/initFunction'
import { Container } from 'aurelia-dependency-injection'
import apiAuthorizer from './'

jest.mock('../../lib/initFunction', () => { return { init: jest.fn(() => () => { }) } })

describe('apiAuthorizer', () => {
  it('should call init with ApiAuthorizerHandler', () => {
    expect(init.mock.calls[0][0]).toEqual('ApiAuthorizerHandler')
  })

  it('should register ApiAuthorizerHandler inside DI container', () => {
    const initContainerFunc = init.mock.calls[0][2]
    const container = new Container()
    initContainerFunc(container)
    expect(container.getResolver('ApiAuthorizerHandler')).toBeDefined()
  })

  it('should call init with needed environment variables to decrypt', () => {
    expect(init.mock.calls[0][3]).toContain('jwtSecret')
  })

  it('should return handler from init', () => {
    expect(isFunction(apiAuthorizer)).toBeTruthy()
  })
})
