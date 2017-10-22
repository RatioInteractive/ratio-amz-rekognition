import AWS from 'aws-sdk'

const rekognition = new AWS.Rekognition()

export default class Rekognition {
  call(action, params) {
    return rekognition[action](params).promise()
  }
}
