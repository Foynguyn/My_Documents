import { Router } from 'express'
import { uploadSingleImageController } from '~/controllers/medias.controllers'
const mediaRouter = Router()

// setup router
mediaRouter.post('/upload-image', uploadSingleImageController)
export default mediaRouter
