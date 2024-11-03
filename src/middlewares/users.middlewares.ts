// môt 3 interface giúp mô tả, req res do express cung cấp
import { Request, Response, NextFunction } from 'express'
import { body, check, checkSchema } from 'express-validator'
import { JsonWebTokenError, VerifyErrors } from 'jsonwebtoken'
import { capitalize, values } from 'lodash'
import { register } from 'module'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { verifyToken } from '~/jwt'
import { ErrorWithStatus } from '~/models/schemas/errors'
import { validate } from '~/utils/validation'
import dotenv from 'dotenv'
dotenv.config()
// middlewares giống như là 1 túi lọc, người dùng gửi req lên cho mình, mình sẽ
// ép req phải đi qua các middlewares để kiểm tra, khi chạm vào next()

// làm midddleware kiểm tra xem người dùng có gửi lên username và password

// công nghệ cũ cho mình validationchain
// công nghệ mới cho mình RunableValdation<chain> (phải run mới có)

// viết hàm kiểm req.body của chức năng đăng ký ở tài khoản
export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
      },
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 100
        }
      },
      errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
    },
    email: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
      }
    },
    password: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 8,
          max: 50
        },
        errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
      },
      isStrongPassword: {
        options: {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
          // returnScore: true
        },
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
      }
    },
    confirm_password: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 8,
          max: 50
        },
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
      },
      isStrongPassword: {
        options: {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
          // returnScore: true
        },
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
      },
      custom: {
        options: (value, { req }) => {
          // value lúc này là confirm_password
          if (value !== req.body.password) {
            throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
          }
          return true
        }
      }
    },
    date_of_birth: {
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        }
      }
    }
  })
)
// viết hàm kiểm tra loginRegBody
export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: true
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            min: 8,
            max: 50
          },
          errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
        },
        isStrongPassword: {
          options: {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
            // returnScore: true
          },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
      }
    },
    ['body']
  )
)

export const accTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            // value này Bearer <access_token>
            const access_token = value.split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.UNAUTHORIZED, // 401
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
              })
            }
            try {
              // nếu có mã thì mình sẽ verify (xác chữ ký)
              const decode_authoriztion = await verifyToken({
                token: access_token,
                privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              // decode_authorization là payload của access_token đã mã hóa
              // bên trong đó có user_id và token_type
              ;(req as Request).decode_authorization = decode_authoriztion
            } catch (error) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.UNAUTHORIZED, //401
                message: capitalize((error as JsonWebTokenError).message)
              })
            }
            // nếu ok hết
            return true
          }
        }
      }
    },
    ['headers']
  )
)

// viết hàm kiểm tra refresh_token
export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        // vô là kiểm tra luôn
        notEmpty: {
          errorMessage: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            try {
              const decode_refresh_token = await verifyToken({
                token: value,
                privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
              })
              ;(req as Request).decode_refresh_token = decode_refresh_token
            } catch (error) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.UNAUTHORIZED, //401
                message: capitalize((error as JsonWebTokenError).message)
              })
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)
