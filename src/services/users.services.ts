// userService chứa các method giúp xử lý liên quan đến users collection

import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { loginRegbody, RegisterReqBody, UpdateMeReqBody } from '~/models/requests/users.request'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { ErrorWithStatus } from '~/models/schemas/errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { error } from 'console'
import { update } from 'lodash'

class UserService {
  // viết hàm dùng đúng jwt để đăng ký access_token
  private signAccessToken(user_id: string) {
    return signToken({
      payLoad: { user_id, tokenType: TokenType.AccessToken },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN }
    })
  }

  // viết hàm dùng đúng jwt để đăng ký access_token
  private signRefreshToken(user_id: string) {
    return signToken({
      payLoad: { user_id, tokenType: TokenType.RefreshToken },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN }
    })
  }

  // viết hàm dùng đúng jwt để đăng ký email_verify_token
  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payLoad: { user_id, tokenType: TokenType.EmailVerificationToken },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN }
    })
  }

  private signForgotPasswordToken(user_id: string) {
    return signToken({
      payLoad: { user_id, tokenType: TokenType.ForgotPassordToken },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN }
    })
  }

  async register(payload: RegisterReqBody) {
    let user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
    const result = await databaseService.users.insertOne(
      new User({
        _id: user_id,
        username: `user${user_id.toString()}`,
        email_verify_token,
        ...payload,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth)
      })
    )
    // sau khi tạo tài khoản và lưu trên database ta sẽ ký acc và rf để đưa
    // cho người dùng, nhưng mà muốn ký thì phải cần user_id của account đó

    // ký
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id.toString()),
      this.signRefreshToken(user_id.toString())
    ])
    // ký thêm email verify token gửi vào email của người đăng ký
    console.log(`gửi mail link xác thực sau:
      http://localhost:3000/users/verify-email/?email_verify_token=${email_verify_token}`)

    // lưu refresh token lại
    databaseService.refresh_tokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async login({ email, password }: loginRegbody) {
    // dùng email và password để tìm user
    const user = await databaseService.users.findOne({
      email,
      password: hashPassword(password)
    })

    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY, // 422
        message: USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT
      })
    }
    // nếu có user thì tạo at và rf
    const user_id = user._id.toHexString()
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])
    // lưu refresh token lại
    databaseService.refresh_tokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async logout(refresh_token: string) {
    await databaseService.refresh_tokens.deleteOne({ token: refresh_token })
  }

  async findUserById(user_id: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND, // 404
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    return user
  }

  async checkEmailExist(email: string): Promise<Boolean> {
    // tìm user nào đang xài email đó, ko có user thì nghĩa là email chưa ai xài
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async checkRefreshToken({ user_id, refresh_token }: { user_id: string; refresh_token: string }) {
    const refreshToken = await databaseService.refresh_tokens.findOne({
      user_id: new ObjectId(user_id),
      token: refresh_token
    })
    if (!refreshToken) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED, // 401
        message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID
      })
    }
    return refresh_token
  }

  async checkEmailVerifyToken({ user_id, email_verify_token }: { user_id: string; email_verify_token: string }) {
    // tìm xem user nào có sở hữu hai thông tin này cùng lúc
    // nếu có thì nghĩa là token hợp lệ
    // nếu ko có thì token này đã bị thay thế rồi
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id), // người dùng đưa cho mình string nhưng mình cần objectId
      email_verify_token
    })
    // nếu ko có thì token đã bị thay thế
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY, //422
        message: USERS_MESSAGES.EMAIL_IS_INVALID
      })
    }
    // nếu có thì return
    return user // thay thế cho chữ true
  }

  async checkForgotPasswordToken({
    user_id,
    forgot_password_token
  }: {
    user_id: string
    forgot_password_token: string
  }) {
    // dùng 2 thông tni trên tìm user
    //  tìm được thì token ok
    // ko thì throw với thông báo "token invalid"
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id),
      forgot_password_token
    })
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID
      })
    }
    return user
  }

  async checkEmailVerified(user_id: string): Promise<boolean> {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    return user?.verify == UserVerifyStatus.Verified
  }

  async resendEmailVerifyToken(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())

    console.log(`gửi mail link xác thực sau:
      http://localhost:3000/users/verify-email/?email_verify_token=${email_verify_token}`)

    // lưu vào database
    databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            email_verify_token,
            updated_at: '$$NOW'
          }
        }
      ]
    )
  }

  async verifyEmail(user_id: string) {
    // gọi hàm này khi đã kiểm tra email_verify_token
    // đúng mã, đúng người dùng
    // cập nhật trạng thái cho account
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            verify: UserVerifyStatus.Verified,
            email_verify_token: '',
            updated_at: `$$NOW`
          }
        }
      ]
    )
    // ký lại ac và rf
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id.toString()),
      this.signRefreshToken(user_id.toString())
    ])
    databaseService.refresh_tokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async forgotPassword(email: string) {
    // dùng email tìm user lấy _id tạo forgot_password_token
    const user = await databaseService.users.findOne({ email })
    if (user) {
      // đã xét điều kiện trước khi vô hàm
      const user_id = user._id.toString()
      // ký forgot_password_token
      const forgot_password_token = await this.signForgotPasswordToken(user_id)
      // lưu vào database
      await databaseService.users.updateOne(
        {
          _id: new ObjectId(user_id)
        },
        [
          {
            $set: {
              forgot_password_token,
              updated_at: `$$NOW`
            }
          }
        ]
      )
      // gửi email cái link cho người dùng aws | log
      console.log(`gửi mail link xác thực sau:
        http://localhost:8000/reset-password/?forgot_password_token=${forgot_password_token}`)
    }
  }

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
          updated_at: `$$NOW`
        }
      }
    ])
  }

  async getme(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          // 0: ko lay, 1: lay
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    return user
  }

  async updateMe({ user_id, payload }: { user_id: string; payload: UpdateMeReqBody }) {
    // payload này có 2 khuyết điểm
    // 1. mình ko biết người dùng truyền lên cái gì
    // 2. nếu có truyền lên dateOfBirth thì nó sẽ là string => date
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    // 3. nếu có truyền lên username thì mình phải cho username là unique
    if (_payload.username) {
      // tìm xem có ai bị trùng ko
      const user = await databaseService.users.findOne({ username: _payload.username })
      if (user) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.FORBIDDEN,
          message: USERS_MESSAGES.USERNAME_ALREADY_EXISTS
        })
      }
    }
    // vượt qua 2 cái chướng ngại vật đó thì update thôi
    const userInfor = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            ...payload,
            updated_at: `$$NOW`
          }
        }
      ],
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return userInfor
  }

  async changePassword({
    user_id,
    old_password,
    password
  }: {
    user_id: string
    old_password: string
    password: string
  }) {
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id),
      password: hashPassword(old_password)
    })
    // nếu mà ko có user nào khớp
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    // nếu mà tìm được user từ password cũ thì tiến hành cập nhật
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          updated_at: `$$NOW`
        }
      }
    ])
  }

  async refreshToken({ user_id, refresh_token }: { user_id: string; refresh_token: string }) {
    // tạo 2 ac và rf (chưa tính đến vấn dề route timing)
    const [access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken(user_id), //
      this.signRefreshToken(user_id)
    ])
    // xóa mã cũ
    await databaseService.refresh_tokens.deleteOne({ token: refresh_token })
    // lưu mã mới
    await databaseService.refresh_tokens.insertOne(
      new RefreshToken({
        token: new_refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return {
      access_token,
      refresh_token: new_refresh_token
    }
  }
}
// tạo instance
let userService = new UserService()
export default userService
