import SearchFacesHandler from './searchFacesHandler'

describe('SearchFacesHandler', () => {
  let handler
  let mockFaceRecognitionService, mockMetadataService, mockMessageService
  let event, context

  beforeEach(() => {
    mockFaceRecognitionService = {
      searchFaces: jest.fn(() => Promise.resolve())
    }
    mockMetadataService = {
      getFacesMetadata: jest.fn(() => Promise.resolve())
    }
    mockMessageService = {
      publishMatches: jest.fn(() => Promise.resolve())
    }
    handler = new SearchFacesHandler(mockFaceRecognitionService, mockMetadataService, mockMessageService)
    event = {
      'Records': [
        {
          'eventVersion': '2.0',
          'eventTime': '1970-01-01T00:00:00.000Z',
          'requestParameters': {
            'sourceIPAddress': '127.0.0.1'
          },
          's3': {
            'configurationId': 'testConfigRule',
            'object': {
              'eTag': '0123456789abcdef0123456789abcdef',
              'sequencer': '0A1B2C3D4E5F678901',
              'key': 'searchFaces/HappyFace.jpg',
              'size': 1024
            },
            'bucket': {
              'arn': 'arn:aws:s3:::mybucket',
              'name': 'mybucket',
              'ownerIdentity': {
                'principalId': 'EXAMPLE'
              }
            },
            's3SchemaVersion': '1.0'
          },
          'responseElements': {
            'x-amz-id-2': 'EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH',
            'x-amz-request-id': 'EXAMPLE123456789'
          },
          'awsRegion': 'us-east-1',
          'eventName': 'ObjectCreated:Put',
          'userIdentity': {
            'principalId': 'EXAMPLE'
          },
          'eventSource': 'aws:s3'
        }
      ]
    }
    context = {}
  })

  it('should match the picture received in the S3 event with the indexed pictures', async () => {
    await handler.execute(event, context)
    expect(mockFaceRecognitionService.searchFaces).toHaveBeenCalledWith(event.Records[0].s3.bucket.name, event.Records[0].s3.object.key)
  })

  describe('when matching picture returns faces', () => {
    let faces
    describe('when matching picture returns one face info', () => {
      beforeEach(() => {
        faces = [{ faceId: 'face_id_1' }]
        mockFaceRecognitionService.searchFaces.mockImplementation(() => Promise.resolve(faces))
      })

      it('should get the related metadata from the storage', async () => {
        await handler.execute(event, context)
        expect(mockMetadataService.getFacesMetadata).toHaveBeenCalledWith([faces[0].faceId])
      })
    })

    describe('when matching picture returns more then one face info', () => {
      beforeEach(() => {
        faces = [{ faceId: 'face_id_1' }, { faceId: 'face_id_2' }, { faceId: 'face_id_3' }]
        mockFaceRecognitionService.searchFaces.mockImplementation(() => Promise.resolve(faces))
      })

      it('should get related metadata from the storage for each match', async () => {
        await handler.execute(event, context)
        expect(mockMetadataService.getFacesMetadata).toHaveBeenCalledWith([faces[0].faceId, faces[1].faceId, faces[2].faceId])
      })
    })

    it('should send messages with matched faces', async () => {
      faces = [{ faceId: 'face_id_1' }, { faceId: 'face_id_2' }, { faceId: 'face_id_3' }]
      const facesMetadata = [
        { faceId: 'my_face_id1', fullname: 'my_fn1', team: 'my_team1' },
        { faceId: 'my_face_id2', fullname: 'my_fn2', team: 'my_team1' },
        { faceId: 'my_face_id3', fullname: 'my_fn3', team: 'my_team2' }
      ]
      mockFaceRecognitionService.searchFaces.mockImplementation(() => Promise.resolve(faces))
      mockMetadataService.getFacesMetadata.mockImplementation(() => Promise.resolve(facesMetadata))
      await handler.execute(event, context)
      expect(mockMessageService.publishMatches).toHaveBeenCalledWith(
        event.Records[0].s3.bucket.name, event.Records[0].s3.object.key, facesMetadata)
    })
  })

  describe('when matching picture does not returns faces', () => {
    let faces
    describe('when matching picture returns no faces info', () => {
      beforeEach(() => {
        faces = []
        mockFaceRecognitionService.searchFaces.mockImplementation(() => Promise.resolve(faces))
      })

      it('should not get metadata from storage', async () => {
        await handler.execute(event, context)
        expect(mockMetadataService.getFacesMetadata).toHaveBeenCalledTimes(0)
      })
    })

    describe('when matching picture returns undefined', () => {
      beforeEach(() => {
        faces = undefined
        mockFaceRecognitionService.searchFaces.mockImplementation(() => Promise.resolve(faces))
      })

      it('should not get metadata from storage', async () => {
        await handler.execute(event, context)
        expect(mockMetadataService.getFacesMetadata).toHaveBeenCalledTimes(0)
      })
    })

    it('should send unknown message', async () => {
      faces = []
      const facesMetadata = []
      mockFaceRecognitionService.searchFaces.mockImplementation(() => Promise.resolve(faces))
      mockMetadataService.getFacesMetadata.mockImplementation(() => Promise.resolve(facesMetadata))
      await handler.execute(event, context)
      expect(mockMessageService.publishMatches).toHaveBeenCalledWith(
        event.Records[0].s3.bucket.name, event.Records[0].s3.object.key)
    })
  })

  describe('when matching picture fails', () => {
    let indexFaceErr
    beforeEach(() => {
      indexFaceErr = new Error('indexFace failure')
      mockFaceRecognitionService.searchFaces.mockImplementation(() => Promise.reject(indexFaceErr))
    })

    it('should re-throw exception', async () => {
      try {
        await handler.execute(event, context)
      } catch (err) {
        expect(err.message).toEqual(indexFaceErr.message)
      }
    })

    it('should not get metadata from storage', async () => {
      try {
        await handler.execute(event, context)
      } catch (err) {
        expect(mockMetadataService.getFacesMetadata).toHaveBeenCalledTimes(0)
      }
    })
  })
})
