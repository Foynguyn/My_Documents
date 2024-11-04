import express, { Request, Response } from 'express'
import {
  emailVerifyController,
  forgotPasswordController,
  loginController,
  logoutController,
  registerController,
  resendEmailVerifyToken
} from '~/controllers/users.controller'
import {
  accTokenValidator,
  emailVerifyTokenValidator,
  forgtrPasswordValidator,
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

/*
    desc: verify email => khi người dùng bấm vào link trong email
    thì họ sẽ gửi email_verify_token thông qua query
    để mình kiểm tra, vậy thì trong query sẽ có cái token đó
    mình sẽ verify và lưu payload vào decode_email_verify_token
    tạo ac và rf cho em đăng nhập  (options)
    
    path: users/verify-email/?memail-verify_token = string
    method: get
*/
userRouter.get('/verify-email', emailVerifyTokenValidator, wrapAsync(emailVerifyController))

/*
    desc: gửi lại link verify email khi người dùng nhấn gửi lại email
    path: users/resend/verify-email
    method: post
    headers: (Authorization: "bearer <access_token")
*/

userRouter.post('/resend-verify-email', accTokenValidator, wrapAsync(resendEmailVerifyToken))

/*
    desc: thông báo bị quên mật khẩu, yêu cầu lấy lại
    server kiểm tra email có tồn tại trong hệ thống không
    gửi link khôi phục account qua email cho người dùng

    gửi lên email
    path: /users/forgot-password
    body: {email: string}
*/
userRouter.post('/forgot-password', forgtrPasswordValidator, wrapAsync(forgotPasswordController))
export default userRouter
