import jwt from 'jsonwebtoken'
import ApiAuthorizerHandler from './ApiAuthorizerHandler'

describe('ApiAuthorizerHandler', () => {
  let handler
  let mockEnvVarsManager
  let event, context
  const jwtSecret = 'my_alki_secret'

  beforeEach(() => {
    mockEnvVarsManager = {
      get: jest.fn((key) => {
        if (key === 'jwtSecret') return jwtSecret
        return ''
      })
    }
    handler = new ApiAuthorizerHandler(mockEnvVarsManager)

    event = {}
    context = {}
  })

  describe('when token is invalid', () => {
    it('should return Unauthorized if JWT is missing', async () => {
      try {
        await handler.execute(event, context)
      } catch (err) {
        expect(err.message).toEqual('Unauthorized')
      }
    })

    it('should return Unauthorized if JWT payload does not have a channel', async () => {
      event.authorizationToken = jwt.sign({ otherProp: 'other prop value' }, jwtSecret)
      try {
        await handler.execute(event, context)
      } catch (err) {
        expect(err.message).toEqual('Unauthorized')
      }
    })
  })

  describe('when token is valid', () => {
    beforeEach(() => {
      event.authorizationToken = jwt.sign({ channel: 'my_channel' }, jwtSecret)
      event.methodArn = 'arn:aws:execute-api:us-east-1:123456789012:qsxrty/test/GET/mydemoresource/giveme'
    })

    it('should return policy with valid policy id', async () => {
      const policy = await handler.execute(event, context)
      expect(policy.principalId).toEqual('my_channel')
    })

    it('should return policy with valid authorizer context', async () => {
      const policy = await handler.execute(event, context)
      expect(policy.context.channel).toEqual('my_channel')
    })

    it('should return policy that allows to invoke the resource', async () => {
      const policy = await handler.execute(event, context)
      expect(policy.policyDocument.Statement[0].Effect).toEqual('Allow')
    })
  })
})
