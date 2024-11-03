// userService chứa các method giúp xử lý liên quan đến users collection

import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { loginRegbody, RegisterReqBody } from '~/models/requests/users.request'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/jwt'
import { TokenType } from '~/constants/enums'
import { ErrorWithStatus } from '~/models/schemas/errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'

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

  async register(payload: RegisterReqBody) {
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth)
      })
    )
    // sau khi tạo tài khoản và lưu trên database ta sẽ ký acc và rf để đưa
    // cho người dùng, nhưng mà muốn ký thì phải cần user_id của account đó
    const user_id = result.insertedId.toString()
    // ký
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
  async checkEmailExist(email: string): Promise<Boolean> {
    // tìm user nào đang xài email đó, ko có user thì nghĩa là email chưa ai xài
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
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

  async logout(refresh_token: string) {
    await databaseService.refresh_tokens.deleteOne({ token: refresh_token })
  }
}
// tạo instance
let userService = new UserService()
export default userService
