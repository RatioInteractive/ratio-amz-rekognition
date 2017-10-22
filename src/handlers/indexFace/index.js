import { Container } from 'aurelia-dependency-injection'
import { init } from '../../lib/initFunction'
import IndexFaceHandler from './IndexFaceHandler'
import DynamoDB from '../../services/aws/DynamoDB'
import Rekognition from '../../services/aws/Rekognition'
import S3 from '../../services/aws/S3'
import FaceRecognitionService from '../../services/FaceRecognitionService'
import MetadataService from '../../services/MetadataService'
import EnvVarsManager from '../../lib/services/EnvVarsManager'

export default init('IndexFaceHandler', new Container(), (container) => {
  container.registerSingleton('EnvVarsManager', EnvVarsManager)
  container.registerSingleton('DynamoDB', DynamoDB)
  container.registerSingleton('Rekognition', Rekognition)
  container.registerSingleton('S3', S3)
  container.registerSingleton('FaceRecognitionService', FaceRecognitionService)
  container.registerSingleton('MetadataService', MetadataService)
  container.registerSingleton('IndexFaceHandler', IndexFaceHandler)
})
