import { inject } from 'aurelia-dependency-injection'
import { get, isNil } from 'lodash'
import BaseHandler from '../../lib/handler/BaseHandler'

@inject('FaceRecognitionService', 'MetadataService')
export default class IndexFaceHandler extends BaseHandler {
  constructor(faceRecognitionService, metadataService) {
    super()
    this.faceRecognitionService = faceRecognitionService
    this.metadataService = metadataService
  }

  async _process(event, context) {
    const bucketArn = get(event, 'Records[0].s3.bucket.name')
    const objectKey = get(event, 'Records[0].s3.object.key')

    this.logger.debug(`Indexing face from S3 object: "${bucketArn}/${objectKey}"`)
    const faces = await this.faceRecognitionService.indexFace(bucketArn, objectKey)

    if (!isNil(faces) && faces.length > 0) {
      this.logger.debug('Storing face metadata')
      this.metadataService.storeFaceMetadata(bucketArn, objectKey, faces[0])
    }
  }
}
