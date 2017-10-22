import expect, { createSpy } from 'expect'
import UserDevicesHandler from '../../../../src/handlers/serviceStatus/ServiceStatusHandler'
import { extractBody } from '../../../../src/lib/apigLambdaProxyHelper'

describe('ServiceStatusHandler', () => {
  let handler
  let mockEnvVarsManager
  let context

  beforeEach(() => {
    mockEnvVarsManager = {
      get: createSpy()
    }
    handler = new UserDevicesHandler(mockEnvVarsManager)

    context = {}
  })

  it('should return response with service version from environment variable', () => {
    const expectVersion = '1.0.1111'
    mockEnvVarsManager.get.andReturn(expectVersion)
    return handler.execute({}, context).then((response) => {
      expect(mockEnvVarsManager.get).toHaveBeenCalledWith('serviceVersion')
      const responseBody = extractBody(response)
      expect(response.statusCode).toEqual(200)
      expect(responseBody.version).toEqual(expectVersion)
    })
  })
})
