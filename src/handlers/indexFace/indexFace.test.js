import { isFunction } from 'lodash'
import { init } from '../../lib/initFunction'
import { Container } from 'aurelia-dependency-injection'
import initFace from './'

jest.mock('../../lib/initFunction', () => { return { init: jest.fn(() => () => { }) } })

describe('indexFace', () => {
  it('should call init with IndexFaceHandler', () => {
    expect(init.mock.calls[0][0]).toEqual('IndexFaceHandler')
  })

  it('should register IndexFaceHandler inside DI container', () => {
    const initContainerFunc = init.mock.calls[0][2]
    const container = new Container()
    initContainerFunc(container)
    expect(container.getResolver('IndexFaceHandler')).toBeDefined()
  })

  it('should register needed services inside DI container', () => {
    const initContainerFunc = init.mock.calls[0][2]
    const container = new Container()
    initContainerFunc(container)
    expect(container.getResolver('DynamoDB')).toBeDefined()
    expect(container.getResolver('Rekognition')).toBeDefined()
    expect(container.getResolver('S3')).toBeDefined()
    expect(container.getResolver('FaceRecognitionService')).toBeDefined()
    expect(container.getResolver('MetadataService')).toBeDefined()
    expect(container.getResolver('EnvVarsManager')).toBeDefined()
  })

  it('should return handler from init', () => {
    expect(isFunction(initFace)).toBeTruthy()
  })
})
