import { NextFunction, Request, Response } from 'express'
import {
  emailVerifyReqQuery,
  ForgotPasswordReqBody,
  loginRegbody,
  LogoutReqBody,
  RegisterReqBody,
  TokenPayload
} from '~/models/requests/users.request'
import userService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { ErrorWithStatus } from '~/models/schemas/errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { UserVerifyStatus } from '~/constants/enums'

// route này nhận vào email và password để tạo tài khoản cho mình
export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  // lấy email và password từ req.body mà người dùng muốn đăng tài khoản
  // thêm tí logic trước khi trả kết quả cho người dùng
  const { email } = req.body
  // tạo user và lưu vào database
  // try {
  // kiểm tra email có tồn tại chưa
  const isEmailExist = await userService.checkEmailExist(email)
  if (isEmailExist) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY, // 422
      message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS
    })
  }
  const result = await userService.register(req.body)
  // nếu thành công
  res.status(HTTP_STATUS.CREATED).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    data: result
  })
  // } catch (error) {
  //   // res.status(400).json({
  //   //   message: 'Register failed',
  //   //   error
  //   // })
  //   next(error)
  // }
}

export const loginController = async (
  req: Request<ParamsDictionary, any, loginRegbody>,
  res: Response,
  next: NextFunction
) => {
  // Cần lấy email và password để tìm xem user nào đang sở hữu
  // Nếu không có user nào ngừng cuộc chơi
  // Nếu có thì tạo at và rf

  const { email, password } = req.body
  const result = await userService.login({ email, password })
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result // ac vaf rf
  })
}

export const logoutController = async (
  req: Request<ParamsDictionary, any, LogoutReqBody>,
  res: Response,
  next: NextFunction
) => {
  // xem thử user_id trong payload của refresh_token và access_token có giống không
  const { refresh_token } = req.body
  const { user_id: user_id_at } = req.decode_authorization as TokenPayload
  const { user_id: user_id_rf } = req.decode_refresh_token as TokenPayload
  if (user_id_at != user_id_rf) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED, //401
      message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID
    })
  }
  // nếu mà trùng rồi thì mình xem thử refresh_token có được quyền dịch vụ không
  await userService.checkRefreshToken({
    user_id: user_id_at,
    refresh_token
  })
  await userService.logout(refresh_token)
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGOUT_SUCCESS
  })
  // khi nào có mã đó trong database thì mình tiến hành logout (xóa rf khỏi hệ thống)
}

export const emailVerifyController = async (
  req: Request<ParamsDictionary, any, any, emailVerifyReqQuery>,
  res: Response,
  next: NextFunction
) => {
  const { email_verify_token } = req.query
  const { user_id } = req.decode_email_verify_token as TokenPayload
  // kiểm tra xem user_id của token có khớp với lại email_verify_token
  // mà người dùng gửi lên không
  const user = await userService.checkEmailVerifyToken({ user_id, email_verify_token })
  if (user.verify === UserVerifyStatus.Banned) {
    res.status(HTTP_STATUS.ACCEPTED).json({
      message: USERS_MESSAGES.ACCOUNT_HAS_BEEN_BANNED
    })
  } else {
    // verify email
    const result = await userService.verifyEmail(user_id)
    // kết quả
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.EMAIl_VERIFY_SUCCESS,
      result
    })
  }
}

export const resendEmailVerifyToken = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  // dùng user_id tìm thằng user đó
  const user = await userService.findUserById(user_id)
  // kiểm tra xem thằng user đã bị xóa khỏi hệ thống chưa
  if (user.verify === UserVerifyStatus.Verified) {
    res.status(HTTP_STATUS.ACCEPTED).json({
      message: USERS_MESSAGES.EMAIL_HAS_BEEN_VERIFIED
    })
  } else if (user.verify === UserVerifyStatus.Banned) {
    res.status(HTTP_STATUS.ACCEPTED).json({
      message: USERS_MESSAGES.ACCOUNT_HAS_BEEN_BANNED
    })
  } else {
    // tiến hành tạo email_verify_token, lưu và gửi cho người ta
    await userService.resendEmailVerifyToken(user_id)
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.RESEND_EMAIL_SUCCESS
    })
  }
  // kiểm tra xem user đã verify chưa, chưa thì mới tạo token và send
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body
  // dùng email để tìm user này là ai
  const hasUser = await userService.checkEmailExist(email)
  if (!hasUser) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.NOT_FOUND, // 404
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  } else {
    // nếu có user từ email này thì mình tạo token và gửi link vào email cho nó
    await userService.forgotPassword(email) // tìm email và tạo mã
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    })
  }
}
