import AWS from 'aws-sdk'

const s3 = new AWS.S3()

export default class S3 {
  call(action, params) {
    return s3[action](params).promise()
  }
}
