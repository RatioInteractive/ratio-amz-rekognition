import AWS from 'aws-sdk'
import { isNil } from 'lodash'
import loggerFactory from './loggerFactory'

const logger = loggerFactory('EnvVarsManager')

export default class EnvVarsManager {
  constructor() {
    this.decryptedVariables = {}
    this.process = process
    this.kms = new AWS.KMS({ apiVersion: '2014-11-01' })
  }

  decryptAndCache(variableNames = []) {
    logger.debug('decryptAndCache() called with vars:', variableNames)
    const decryptedValuePromiseList = variableNames.map(envVar => (
      this._decrypt(envVar)
        .then((decryptedValue) => {
          if (!isNil(decryptedValue)) {
            this.decryptedVariables[envVar] = decryptedValue
          }
        })
    ))

    return Promise.all(decryptedValuePromiseList)
      .then(() => this.decryptedVariables)
  }

  get(envVar) {
    return this.decryptedVariables[envVar] || this.process.env[envVar]
  }

  _decrypt(envVar) {
    const encrypted = this.process.env[envVar]
    if (isNil(encrypted)) {
      logger.info(`environment variable "${envVar}" not found in function configuration. Decryption will be skipped.`)
      return Promise.resolve()
    }
    logger.info(`environment variable "${envVar}" found in function configuration. Decrypting...`)
    return this.kms.decrypt({ CiphertextBlob: Buffer.from(encrypted, 'base64') }).promise()
      .then(data => {
        if (!isNil(data) && !isNil(data.Plaintext)) {
          logger.info(`environment variable "${envVar}" successfully decrypted`)
          const decrypted = data.Plaintext.toString('ascii')
          return decrypted
        }
      })
  }
}
