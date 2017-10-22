import MetadataService from './MetadataService'

describe('MetadataService', () => {
  let service
  let mockEnvVarsManager, mockDynamoDB, mockS3

  beforeEach(() => {
    mockEnvVarsManager = {
      get: jest.fn((key) => {
        if (key === 'facesMetadataTable') return 'metadata_dynamo_table'
        return ''
      })
    }
    mockDynamoDB = {
      call: jest.fn(() => Promise.resolve())
    }
    mockS3 = {
      call: jest.fn(() => Promise.resolve())
    }
    service = new MetadataService(mockEnvVarsManager, mockDynamoDB, mockS3)
  })

  describe('when storeFaceMetadata() is called', () => {
    it('should get metadata info from S3 object', async () => {
      await service.storeFaceMetadata('bucket_name', 'object/key', 'my_face_id')
      expect(mockS3.call.mock.calls[0][0]).toEqual('headObject')
      expect(mockS3.call.mock.calls[0][1]).toEqual({ Bucket: 'bucket_name', Key: 'object/key' })
    })

    describe('when getting metadata returns info', () => {
      let headObjectResponse
      beforeEach(() => {
        headObjectResponse = {
          Metadata: {
            fullname: 'my_fullname',
            team: 'my_team'
          }
        }
        mockS3.call.mockImplementation(() => Promise.resolve(headObjectResponse))
      })

      it('should save metadata and face information inside the table', async () => {
        const expectedFaceInfo = {
          faceId: 'my_face_id',
          confidence: '98.7676',
          details: JSON.stringify({ prop1: 'details_1' })
        }
        await service.storeFaceMetadata('bucket_name', 'object/key', expectedFaceInfo)
        expect(mockDynamoDB.call.mock.calls[0][0]).toEqual('put')
        const params = mockDynamoDB.call.mock.calls[0][1]
        expect(params.TableName).toEqual('metadata_dynamo_table')
        expect(params.Item.faceId).toEqual(expectedFaceInfo.faceId)
        expect(params.Item.faceConfidence).toEqual(expectedFaceInfo.confidence)
        expect(params.Item.faceDetails).toEqual(expectedFaceInfo.details)
        expect(params.Item.fullname).toEqual('my_fullname')
        expect(params.Item.team).toEqual('my_team')
        expect(params.Item.createdAt).toBeDefined()
        expect(params.Item.updatedAt).toEqual(params.Item.createdAt)
      })
    })
  })

  describe('when getFacesMetadata() is called', () => {
    it('should get metadata from the table for one face ID', async () => {
      await service.getFacesMetadata(['my_face_id_1'])
      expect(mockDynamoDB.call.mock.calls[0][0]).toEqual('get')
      const params = mockDynamoDB.call.mock.calls[0][1]
      expect(params.TableName).toEqual('metadata_dynamo_table')
      expect(params.Key.faceId).toEqual('my_face_id_1')
    })

    it('should get metadata from the table for multiple face ID', async () => {
      await service.getFacesMetadata(['my_face_id_1', 'my_face_id_2', 'my_face_id_3', 'my_face_id_4'])
      expect(mockDynamoDB.call.mock.calls[0][0]).toEqual('get')
      const params1 = mockDynamoDB.call.mock.calls[0][1]
      expect(params1.TableName).toEqual('metadata_dynamo_table')
      expect(params1.Key.faceId).toEqual('my_face_id_1')
      const params2 = mockDynamoDB.call.mock.calls[1][1]
      expect(params2.TableName).toEqual('metadata_dynamo_table')
      expect(params2.Key.faceId).toEqual('my_face_id_2')
      const params3 = mockDynamoDB.call.mock.calls[2][1]
      expect(params3.TableName).toEqual('metadata_dynamo_table')
      expect(params3.Key.faceId).toEqual('my_face_id_3')
      const params4 = mockDynamoDB.call.mock.calls[3][1]
      expect(params4.TableName).toEqual('metadata_dynamo_table')
      expect(params4.Key.faceId).toEqual('my_face_id_4')
    })

    it('should return metadata info for each face found in the table', async () => {
      const expectedFacesInfo = [
        { faceId: 'my_face_id_1', fullname: 'fn_1', team: 't_1', faceDetails: JSON.stringify({ prop1: 'details_1' }) },
        { faceId: 'my_face_id_2', fullname: 'fn_2', team: 't_1', faceDetails: JSON.stringify({ prop1: 'details_2' }) },
        { faceId: 'my_face_id_3', fullname: 'fn_3', team: 't_2', faceDetails: JSON.stringify({ prop1: 'details_3' }) }
      ]
      mockDynamoDB.call.mockImplementationOnce(() => Promise.resolve(expectedFacesInfo[0]))
      mockDynamoDB.call.mockImplementationOnce(() => Promise.resolve(expectedFacesInfo[1]))
      mockDynamoDB.call.mockImplementationOnce(() => Promise.resolve(expectedFacesInfo[2]))
      const metadata = await service.getFacesMetadata([expectedFacesInfo[0].faceId, expectedFacesInfo[1].faceId, expectedFacesInfo[2].faceId])
      expect(metadata[0].faceId).toEqual(expectedFacesInfo[0].faceId)
      expect(metadata[0].fullname).toEqual(expectedFacesInfo[0].fullname)
      expect(metadata[0].faceDetails).toEqual(expectedFacesInfo[0].faceDetails)
      expect(metadata[1].faceId).toEqual(expectedFacesInfo[1].faceId)
      expect(metadata[1].fullname).toEqual(expectedFacesInfo[1].fullname)
      expect(metadata[1].faceDetails).toEqual(expectedFacesInfo[1].faceDetails)
      expect(metadata[2].faceId).toEqual(expectedFacesInfo[2].faceId)
      expect(metadata[2].fullname).toEqual(expectedFacesInfo[2].fullname)
      expect(metadata[2].faceDetails).toEqual(expectedFacesInfo[2].faceDetails)
    })
  })
})
