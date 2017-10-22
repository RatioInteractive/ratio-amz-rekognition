import FaceRecognitionService from './FaceRecognitionService'

describe('FaceRecognitionService', () => {
  let service, mockRekognition
  beforeEach(() => {
    mockRekognition = {
      call: jest.fn(() => Promise.resolve())
    }
    service = new FaceRecognitionService(mockRekognition)
  })

  describe('when indexFace() is called', () => {
    it('should create a new faces collection', async () => {
      await service.indexFace()
      expect(getCallParamsHelper('createCollection', mockRekognition.call.mock.calls)).toEqual({ CollectionId: 'team_photos' })
    })

    it('should not create a new faces collection if it already exists', async () => {
      mockRekognition.call.mockImplementation((method) => {
        if (method === 'listCollections') {
          return { CollectionIds: ['coll_1', 'coll_2', 'team_photos', 'coll_3'] }
        }
      })
      await service.indexFace()
      expect(getCallParamsHelper('createCollection', mockRekognition.call.mock.calls)).toBeUndefined()
    })

    it('should store the face inside the faces collection', async () => {
      await service.indexFace('my_photos_bucket', 'my/photo/name')
      expect(getCallParamsHelper('indexFaces', mockRekognition.call.mock.calls)).toEqual({
        CollectionId: 'team_photos',
        DetectionAttributes: [],
        Image: {
          S3Object: {
            Bucket: 'my_photos_bucket',
            Name: 'my/photo/name'
          }
        }
      })
    })

    it('should return a normalized collection of detected faces', async () => {
      const indexedFaces = {
        FaceRecords: [
          { Face: { FaceId: 'face_1', Confidence: 98.555 }, FaceDetail: { prop: 'face_1_prop' } },
          { Face: { FaceId: 'face_2', Confidence: 99.555 }, FaceDetail: { prop: 'face_2_prop' } },
          { Face: { FaceId: 'face_3', Confidence: 95.555 }, FaceDetail: { prop: 'face_3_prop' } }
        ]
      }
      mockRekognition.call.mockImplementation((method) => {
        if (method === 'indexFaces') {
          return indexedFaces
        }
      })
      const faces = await service.indexFace()
      expect(faces[0].faceId).toEqual('face_1')
      expect(faces[0].confidence).toEqual(indexedFaces.FaceRecords[0].Face.Confidence)
      expect(faces[0].details).toEqual(JSON.stringify(indexedFaces.FaceRecords[0].FaceDetail))

      expect(faces[1].faceId).toEqual('face_2')
      expect(faces[1].confidence).toEqual(indexedFaces.FaceRecords[1].Face.Confidence)
      expect(faces[1].details).toEqual(JSON.stringify(indexedFaces.FaceRecords[1].FaceDetail))

      expect(faces[2].faceId).toEqual('face_3')
      expect(faces[2].confidence).toEqual(indexedFaces.FaceRecords[2].Face.Confidence)
      expect(faces[2].details).toEqual(JSON.stringify(indexedFaces.FaceRecords[2].FaceDetail))
    })

    it('should return an empty collection if no faces are detected', async () => {
      mockRekognition.call.mockImplementation((method) => {
        if (method === 'indexFaces') {
          return { FaceRecords: [] }
        }
      })
      const faces = await service.indexFace()
      expect(faces.length).toEqual(0)
    })
  })

  describe('when searchFaces() is called', () => {
    it('should match a face in the collection', async () => {
      await service.searchFaces('my_photos_bucket', 'my/photo/name')
      expect(getCallParamsHelper('searchFacesByImage', mockRekognition.call.mock.calls)).toEqual({
        CollectionId: 'team_photos',
        FaceMatchThreshold: 95,
        Image: {
          S3Object: {
            Bucket: 'my_photos_bucket',
            Name: 'my/photo/name'
          }
        },
        MaxFaces: 5
      })
    })

    it('should return a normalized collection of matched faces', async () => {
      const matchedFaces = {
        FaceMatches: [
          { Face: { FaceId: 'face_1' }, Similarity: 98.555 },
          { Face: { FaceId: 'face_2' }, Similarity: 99.555 },
          { Face: { FaceId: 'face_3' }, Similarity: 95.555 }
        ]
      }
      mockRekognition.call.mockImplementation((method) => {
        if (method === 'searchFacesByImage') {
          return matchedFaces
        }
      })
      const faces = await service.searchFaces()
      expect(faces[0].faceId).toEqual('face_1')
      expect(faces[0].similarity).toEqual(matchedFaces.FaceMatches[0].Similarity)

      expect(faces[1].faceId).toEqual('face_2')
      expect(faces[1].similarity).toEqual(matchedFaces.FaceMatches[1].Similarity)

      expect(faces[2].faceId).toEqual('face_3')
      expect(faces[2].similarity).toEqual(matchedFaces.FaceMatches[2].Similarity)
    })

    it('should return an empty collection if no faces are matched', async () => {
      mockRekognition.call.mockImplementation((method) => {
        if (method === 'searchFacesByImage') {
          return { FaceMatches: [] }
        }
      })
      const faces = await service.searchFaces()
      expect(faces.length).toEqual(0)
    })
  })
})

function getCallParamsHelper(method, calls) {
  const safeCalls = calls || []
  let params
  safeCalls.forEach((call) => {
    if (call[0] === method) {
      params = call[1]
    }
  })
  return params
}
