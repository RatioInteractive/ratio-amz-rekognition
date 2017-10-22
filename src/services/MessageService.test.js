import MessageService from './MessageService'

describe('MessageService', () => {
  let service
  let mockEnvVarsManager, mockSNS

  beforeEach(() => {
    mockEnvVarsManager = {
      get: jest.fn((key) => {
        if (key === 'matchesSNSTopic') return 'matches_sns_topic_arn'
        return ''
      })
    }
    mockSNS = {
      call: jest.fn(() => Promise.resolve())
    }
    service = new MessageService(mockEnvVarsManager, mockSNS)
  })

  describe('when publishMatches() is called', () => {
    it('should publish one message to SNS topic with face info', async () => {
      const expectedFaceMetadata = { faceId: 'my_face_id', fullname: 'my_fn', team: 'my_team' }
      const expectedBucket = 'my_photos_bucket'
      const expectedObjectKey = 'my/photo/name'
      await service.publishMatches(expectedBucket, expectedObjectKey, [expectedFaceMetadata])
      expect(mockSNS.call.mock.calls[0][0]).toEqual('publish')
      expect(mockSNS.call.mock.calls[0][1]).toEqual({
        TopicArn: 'matches_sns_topic_arn',
        Subject: `ratio-amz-rekognition - matched face IDL: "${expectedFaceMetadata.faceId}"`,
        Message: JSON.stringify({ bucket: expectedBucket, objectKey: expectedObjectKey, match: expectedFaceMetadata })
      })
    })

    it('should publish multiple messages to SNS topic with faces info', async () => {
      const expectedFacesMetadata = [
        { faceId: 'my_face_id1', fullname: 'my_fn1', team: 'my_team1' },
        { faceId: 'my_face_id2', fullname: 'my_fn2', team: 'my_team1' },
        { faceId: 'my_face_id3', fullname: 'my_fn3', team: 'my_team2' }
      ]
      const expectedBucket = 'my_photos_bucket'
      const expectedObjectKey = 'my/photo/name'
      await service.publishMatches(expectedBucket, expectedObjectKey, [expectedFacesMetadata[0], expectedFacesMetadata[1], expectedFacesMetadata[2]])
      expect(mockSNS.call.mock.calls[0][0]).toEqual('publish')
      expect(mockSNS.call.mock.calls[0][1]).toEqual({
        TopicArn: 'matches_sns_topic_arn',
        Subject: `ratio-amz-rekognition - matched face IDL: "${expectedFacesMetadata[0].faceId}"`,
        Message: JSON.stringify({ bucket: expectedBucket, objectKey: expectedObjectKey, match: expectedFacesMetadata[0] })
      })
      expect(mockSNS.call.mock.calls[1][0]).toEqual('publish')
      expect(mockSNS.call.mock.calls[1][1]).toEqual({
        TopicArn: 'matches_sns_topic_arn',
        Subject: `ratio-amz-rekognition - matched face IDL: "${expectedFacesMetadata[1].faceId}"`,
        Message: JSON.stringify({ bucket: expectedBucket, objectKey: expectedObjectKey, match: expectedFacesMetadata[1] })
      })
      expect(mockSNS.call.mock.calls[2][0]).toEqual('publish')
      expect(mockSNS.call.mock.calls[2][1]).toEqual({
        TopicArn: 'matches_sns_topic_arn',
        Subject: `ratio-amz-rekognition - matched face IDL: "${expectedFacesMetadata[2].faceId}"`,
        Message: JSON.stringify({ bucket: expectedBucket, objectKey: expectedObjectKey, match: expectedFacesMetadata[2] })
      })
    })

    describe('when no matches are passed', () => {
      it('should publish unknown message to SNS topic when undefined matches is passed', async () => {
        const expectedBucket = 'my_photos_bucket'
        const expectedObjectKey = 'my/photo/name'
        await service.publishMatches(expectedBucket, expectedObjectKey)
        expect(mockSNS.call.mock.calls[0][0]).toEqual('publish')
        expect(mockSNS.call.mock.calls[0][1]).toEqual({
          TopicArn: 'matches_sns_topic_arn',
          Subject: 'ratio-amz-rekognition - Unknown face',
          Message: JSON.stringify({ bucket: expectedBucket, objectKey: expectedObjectKey, match: 'unknown' })
        })
      })
    })
  })
})
