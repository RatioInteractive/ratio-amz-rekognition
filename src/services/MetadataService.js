import { inject } from 'aurelia-dependency-injection'
import { get } from 'lodash'
import loggerFactory from '../lib/services/loggerFactory'

const logger = loggerFactory('FaceRecognitionService')

const FACES_METADATA_TABLE = 'facesMetadataTable'

@inject('EnvVarsManager', 'DynamoDB', 'S3')
export default class MetadataService {
  constructor(envVarsManager, dynamoDB, s3) {
    this.envVarsManager = envVarsManager
    this.dynamoDB = dynamoDB
    this.s3 = s3
  }

  async storeFaceMetadata(bucket, objectKey, faceInfo) {
    const objectData = await this._getS3HeadObject(bucket, objectKey)

    logger.info('S3 object metadata:', objectData)
    const metadata = get(objectData, 'Metadata', {})
    return this._putMetadata(faceInfo, metadata)
  }

  async getFacesMetadata(faceIds) {
    const getPromises = faceIds.map((faceId) => this._getFaceMetadata(faceId))
    return Promise.all(getPromises)
  }

  async _getS3HeadObject(bucket, objectKey) {
    const params = {
      Bucket: bucket,
      Key: objectKey
    }
    logger.debug('Getting metadata from object S3 object:', params)
    return this.s3.call('headObject', params)
  }

  async _putMetadata(faceInfo, metadata) {
    const createdAt = new Date().getTime()
    const params = {
      TableName: this.envVarsManager.get(FACES_METADATA_TABLE),
      Item: {
        faceId: faceInfo.faceId,
        faceConfidence: faceInfo.confidence,
        faceDetails: faceInfo.details,
        fullname: metadata.fullname,
        team: metadata.team,
        createdAt: createdAt,
        updatedAt: createdAt
      }
    }
    logger.debug('Persisting S3 object metadata', params)
    return this.dynamoDB.call('put', params)
  }

  async _getFaceMetadata(faceId) {
    const params = {
      TableName: this.envVarsManager.get(FACES_METADATA_TABLE),
      Key: {
        faceId
      }
    }
    logger.debug('Getting face metadata with params: ', params)
    return this.dynamoDB.call('get', params)
  }
}
