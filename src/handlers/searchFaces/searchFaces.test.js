import { isFunction } from 'lodash'
import { init } from '../../lib/initFunction'
import { Container } from 'aurelia-dependency-injection'
import searchFaces from './'

jest.mock('../../lib/initFunction', () => { return { init: jest.fn(() => () => { }) } })

describe('searchFaces', () => {
  it('should call init with SearchFacesHandler', () => {
    expect(init.mock.calls[0][0]).toEqual('SearchFacesHandler')
  })

  it('should register SearchFacesHandler inside DI container', () => {
    const initContainerFunc = init.mock.calls[0][2]
    const container = new Container()
    initContainerFunc(container)
    expect(container.getResolver('SearchFacesHandler')).toBeDefined()
  })

  it('should register needed services inside DI container', () => {
    const initContainerFunc = init.mock.calls[0][2]
    const container = new Container()
    initContainerFunc(container)
    expect(container.getResolver('DynamoDB')).toBeDefined()
    expect(container.getResolver('Rekognition')).toBeDefined()
    expect(container.getResolver('S3')).toBeDefined()
    expect(container.getResolver('SNS')).toBeDefined()
    expect(container.getResolver('FaceRecognitionService')).toBeDefined()
    expect(container.getResolver('MetadataService')).toBeDefined()
    expect(container.getResolver('MessageService')).toBeDefined()
    expect(container.getResolver('EnvVarsManager')).toBeDefined()
  })

  it('should return handler from init', () => {
    expect(isFunction(searchFaces)).toBeTruthy()
  })
})
