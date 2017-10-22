import { inject } from 'aurelia-dependency-injection'
import { includes, get } from 'lodash'
import loggerFactory from '../lib/services/loggerFactory'

const TEAM_PHOTOS_COLLECTION = 'team_photos'

const logger = loggerFactory('FaceRecognitionService')

@inject('Rekognition')
export default class FaceRecognitionService {
  constructor(rekognition) {
    this.rekognition = rekognition
  }

  async indexFace(s3Bucket, s3Object) {
    logger.debug('Getting faces collections list')
    const collections = await this.rekognition.call('listCollections', {})

    logger.debug(`Checking if faces collection "${TEAM_PHOTOS_COLLECTION}" already exists`, collections)
    if (!this._collectionAlreadyExists(collections)) {
      logger.info(`Creating faces collection "${TEAM_PHOTOS_COLLECTION}"`)
      await this._creatCollection()
    }
    const indexedFaces = await this._indexFaces(s3Bucket, s3Object)
    logger.info('Indexed faces: ', indexedFaces)

    const faceRecords = get(indexedFaces, 'FaceRecords', [])
    const faces = []
    faceRecords.forEach((faceItem) => {
      faces.push({
        faceId: get(faceItem, 'Face.FaceId'),
        confidence: get(faceItem, 'Face.Confidence', 0),
        details: JSON.stringify(get(faceItem, 'FaceDetail', {}))
      })
    })
    return faces
  }

  async searchFaces(s3Bucket, s3Object) {
    logger.debug('Searching face')

    const params = {
      CollectionId: TEAM_PHOTOS_COLLECTION,
      FaceMatchThreshold: 95,
      Image: {
        S3Object: {
          Bucket: s3Bucket,
          Name: s3Object
        }
      },
      MaxFaces: 5
    }
    const foundFaces = await this.rekognition.call('searchFacesByImage', params)
    logger.info('Found faces: ', foundFaces)

    const faceMatches = get(foundFaces, 'FaceMatches', [])
    const faces = []
    faceMatches.forEach((faceItem) => {
      faces.push({
        faceId: get(faceItem, 'Face.FaceId'),
        confidence: get(faceItem, 'Face.Confidence', 0),
        similarity: get(faceItem, 'Similarity', 0)
      })
    })
    return faces
  }

  async _creatCollection() {
    const params = {
      CollectionId: TEAM_PHOTOS_COLLECTION
    }
    return this.rekognition.call('createCollection', params)
  }

  async _indexFaces(s3Bucket, s3Object) {
    const params = {
      CollectionId: TEAM_PHOTOS_COLLECTION,
      DetectionAttributes: [],
      Image: {
        S3Object: {
          Bucket: s3Bucket,
          Name: s3Object
        }
      }
    }
    logger.debug(`Indexing face from S3 object`, params)
    return this.rekognition.call('indexFaces', params)
  }

  _collectionAlreadyExists(collections) {
    const ids = get(collections, 'CollectionIds', [])
    const exists = includes(ids, TEAM_PHOTOS_COLLECTION)
    logger.info(`Faces collection "${TEAM_PHOTOS_COLLECTION}" found: "${exists}"`)
    return exists
  }
}
