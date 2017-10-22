import { isEmpty, isNil } from 'lodash'
import { inject } from 'aurelia-dependency-injection'
import loggerFactory from '../lib/services/loggerFactory'

const logger = loggerFactory('MessageService')

const MATCHES_SNS_TOPIC = 'matchesSNSTopic'

@inject('EnvVarsManager', 'SNS')
export default class MessageService {
  constructor(envVarsManager, sns) {
    this.envVarsManager = envVarsManager
    this.sns = sns
  }

  async publishMatches(s3Bucket, s3Object, facesInfo) {
    if (isEmpty(facesInfo)) {
      return this._publish(s3Bucket, s3Object)
    }

    const promises = facesInfo.map((faceInfo) => this._publish(s3Bucket, s3Object, faceInfo))
    return Promise.all(promises)
  }

  async _publish(s3Bucket, s3Object, faceInfoObj) {
    const params = {
      TopicArn: this.envVarsManager.get(MATCHES_SNS_TOPIC),
      Subject: !isNil(faceInfoObj) ? `ratio-amz-rekognition - matched face IDL: "${faceInfoObj.faceId}"` : 'ratio-amz-rekognition - Unknown face',
      Message: JSON.stringify({ bucket: s3Bucket, objectKey: s3Object, match: !isNil(faceInfoObj) ? faceInfoObj : 'unknown' })
    }
    logger.debug('Publishing message with params: ', params)
    return this.sns.call('publish', params)
  }
}
