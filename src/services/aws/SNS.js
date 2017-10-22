import AWS from 'aws-sdk'

const sns = new AWS.SNS()

export default class SNS {
  call(action, params) {
    return sns[action](params).promise()
  }
}
