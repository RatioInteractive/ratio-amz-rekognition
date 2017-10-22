import AWS from 'aws-sdk'

const dynamoDB = new AWS.DynamoDB.DocumentClient()

export default class DynamoDB {
  call(action, params) {
    return dynamoDB[action](params).promise()
  }
}
