import express from 'express'
import userRouter from './routes/users.routers'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediaRouter from './routes/mediasRouter.routers'
import { initFolder } from './utils/file'
// dựng server
const app = express()
const PORT = 3000
// call server chạy
databaseService.connect()
initFolder()
app.use(express.json()) // cho server xài middleware biến đổi json

// cho server kết nối userRouter
app.use('/users', userRouter)
app.use('/medias', mediaRouter)
// http://localhost:3000/users/login body(email, password)
// cho server mở PORT ở 3000

app.use(defaultErrorHandler)

app.listen(PORT, () => {
  console.log('server BE đang chạy trên PORT ' + PORT)
})
