import IndexFaceHandler from './IndexFaceHandler'

describe('IndexFaceHandler', () => {
  let handler
  let mockFaceRecognitionService, mockMetadataService
  let event, context

  beforeEach(() => {
    mockFaceRecognitionService = {
      indexFace: jest.fn(() => Promise.resolve())
    }
    mockMetadataService = {
      storeFaceMetadata: jest.fn(() => Promise.resolve())
    }
    handler = new IndexFaceHandler(mockFaceRecognitionService, mockMetadataService)
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
              'key': 'indexFaces/HappyFace.jpg',
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

  it('should index the picture received in the S3 event', async () => {
    await handler.execute(event, context)
    expect(mockFaceRecognitionService.indexFace).toHaveBeenCalledWith(event.Records[0].s3.bucket.name, event.Records[0].s3.object.key)
  })

  describe('when indexing picture returns one face', () => {
    let faces
    beforeEach(() => {
      faces = [{ faceId: 'face_id_1' }]
      mockFaceRecognitionService.indexFace.mockImplementation(() => {
        return Promise.resolve(faces)
      })
    })

    it('should store inside the metadata storage the face information returned by the recognition service', async () => {
      await handler.execute(event, context)
      expect(mockMetadataService.storeFaceMetadata).toHaveBeenCalledWith(event.Records[0].s3.bucket.name, event.Records[0].s3.object.key, faces[0])
    })
  })

  describe('when indexing picture returns more then one face info', () => {
    let faces
    beforeEach(() => {
      faces = [{ faceId: 'face_id_1' }, { faceId: 'face_id_2' }, { faceId: 'face_id_3' }]
      mockFaceRecognitionService.indexFace.mockImplementation(() => {
        return Promise.resolve(faces)
      })
    })

    it('should store inside the metadata storage the first face info returned by the recognition service', async () => {
      await handler.execute(event, context)
      expect(mockMetadataService.storeFaceMetadata).toHaveBeenCalledWith(event.Records[0].s3.bucket.name, event.Records[0].s3.object.key, faces[0])
    })
  })

  describe('when indexing picture returns no face info', () => {
    let faces
    beforeEach(() => {
      faces = []
      mockFaceRecognitionService.indexFace.mockImplementation(() => Promise.resolve(faces))
    })

    it('should not store inside the metadata storage any face info', async () => {
      await handler.execute(event, context)
      expect(mockMetadataService.storeFaceMetadata).toHaveBeenCalledTimes(0)
    })
  })

  describe('when indexing picture returns undefined', () => {
    let faces
    beforeEach(() => {
      faces = undefined
      mockFaceRecognitionService.indexFace.mockImplementation(() => Promise.resolve(faces))
    })

    it('should not store inside the metadata storage any face info', async () => {
      await handler.execute(event, context)
      expect(mockMetadataService.storeFaceMetadata).toHaveBeenCalledTimes(0)
    })
  })

  describe('when indexing picture fails', () => {
    let indexFaceErr
    beforeEach(() => {
      indexFaceErr = new Error('indexFace failure')
      mockFaceRecognitionService.indexFace.mockImplementation(() => Promise.reject(indexFaceErr))
    })

    it('should re-throw exception', async () => {
      try {
        await handler.execute(event, context)
      } catch (err) {
        expect(err.message).toEqual(indexFaceErr.message)
      }
    })

    it('should not store inside the metadata storage any face ID', async () => {
      try {
        await handler.execute(event, context)
      } catch (err) {
        expect(mockMetadataService.storeFaceMetadata).toHaveBeenCalledTimes(0)
      }
    })
  })
})
