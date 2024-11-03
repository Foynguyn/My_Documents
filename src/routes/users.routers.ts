import express, { Request, Response } from 'express'
import { loginController, logoutController, registerController } from '~/controllers/users.controller'
import {
  accTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'
// tạo user route
const userRouter = express.Router()

userRouter.post('/register', registerValidator, wrapAsync(registerController))

/*
    desc: login
    path: users/login
    method: post
    body:{
        mail: string,
        password: string
    }
*/

// localhost:3000/users/login
userRouter.post('/login', loginValidator, wrapAsync(loginController))

/*
    desc: logout
    path: users/logout
    method: post
    headers: {
        Authoriation: 'Bearer <access_token>'
    }
    body: {
        refresh_token
    }
*/

userRouter.post('/logout', accTokenValidator, refreshTokenValidator, wrapAsync(logoutController))
export default userRouter
