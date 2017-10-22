import { inject } from 'aurelia-dependency-injection'
import { get, isNil } from 'lodash'
import BaseHandler from '../../lib/handler/BaseHandler'

@inject('FaceRecognitionService', 'MetadataService', 'MessageService')
export default class SearchFacesHandler extends BaseHandler {
  constructor(faceRecognitionService, metadataService, messageService) {
    super()
    this.faceRecognitionService = faceRecognitionService
    this.metadataService = metadataService
    this.messageService = messageService
  }

  async _process(event, context) {
    const bucketArn = get(event, 'Records[0].s3.bucket.name')
    const objectKey = get(event, 'Records[0].s3.object.key')

    this.logger.debug(`Matching face from S3 object: "${bucketArn}/${objectKey}"`)
    const faces = await this.faceRecognitionService.searchFaces(bucketArn, objectKey)

    if (!isNil(faces) && faces.length > 0) {
      this.logger.debug('Getting faces metadata')
      const metadata = await this.metadataService.getFacesMetadata(faces.map((face) => {
        return face.faceId
      })) || []
      this.logger.debug('Sending matches messages')
      this.messageService.publishMatches(bucketArn, objectKey, metadata)
    } else {
      this.logger.debug('Sending unknown message')
      this.messageService.publishMatches(bucketArn, objectKey)
    }
  }
}
