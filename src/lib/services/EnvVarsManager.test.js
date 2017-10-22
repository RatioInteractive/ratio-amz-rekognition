import EnvVarsManager from './EnvVarsManager'

describe('EnvVarsManager', () => {
  let manager
  beforeEach(() => {
    manager = new EnvVarsManager()
    manager.kms = { decrypt: jest.fn().mockReturnValue({ promise: () => Promise.resolve() }) }
  })

  it('should decrypt given environment variables using kms', () => {
    manager.process = { env: { var1: 'encrypted1', var2: 'encrypted2', var3: 'encrypted3' } }
    return manager.decryptAndCache(['var1', 'var2', 'var3']).then(() => {
      expect(manager.kms.decrypt.mock.calls[0][0].CiphertextBlob).toEqual(Buffer.from(manager.process.env.var1, 'base64'))
      expect(manager.kms.decrypt.mock.calls[1][0].CiphertextBlob).toEqual(Buffer.from(manager.process.env.var2, 'base64'))
      expect(manager.kms.decrypt.mock.calls[2][0].CiphertextBlob).toEqual(Buffer.from(manager.process.env.var3, 'base64'))
    })
  })

  describe('when kms returns decrypted values', () => {
    let kmsResponses
    beforeEach(() => {
      manager.process = { env: { var1: 'encrypted1', var2: 'encrypted2', var3: 'encrypted3' } }
      kmsResponses = [kmsResponse('decrypted1'), kmsResponse('decrypted2'), kmsResponse('decrypted3')]
      let calls = -1
      manager.kms.decrypt.mockReturnValue({
        promise: () => {
          calls++
          return Promise.resolve(kmsResponses[calls])
        }
      })
    })

    it('should return decrypted environment variables', () => {
      return manager.decryptAndCache(['var1', 'var2', 'var3']).then((decryptedVars) => {
        expect(kmsResponses[0].Plaintext.toString).toHaveBeenCalledWith('ascii')
        expect(kmsResponses[1].Plaintext.toString).toHaveBeenCalledWith('ascii')
        expect(kmsResponses[2].Plaintext.toString).toHaveBeenCalledWith('ascii')
        expect(decryptedVars.var1).toEqual('decrypted1')
        expect(decryptedVars.var2).toEqual('decrypted2')
        expect(decryptedVars.var3).toEqual('decrypted3')
      })
    })

    it('should cache decrypted environment variables', () => {
      return manager.decryptAndCache(['var1', 'var2', 'var3']).then(() => {
        expect(manager.get('var1')).toEqual('decrypted1')
        expect(manager.get('var2')).toEqual('decrypted2')
        expect(manager.get('var3')).toEqual('decrypted3')
      })
    })

    it('should not cache non existing environment variable to decrypt', () => {
      return manager.decryptAndCache(['var100', 'var101']).then(() => {
        expect(manager.get('var100')).toBeUndefined()
        expect(manager.get('var101')).toBeUndefined()
      })
    })
  })

  describe('when get() is called', () => {
    it('should return value from env if a cached value is not available', () => {
      manager.process = { env: { var1: 'clear1', var2: 'clear2' } }
      expect(manager.get('var1')).toEqual('clear1')
      expect(manager.get('var2')).toEqual('clear2')
    })
  })
})

function kmsResponse(decryptedString) {
  return {
    Plaintext: { toString: jest.fn().mockReturnValue(decryptedString) }
  }
}
