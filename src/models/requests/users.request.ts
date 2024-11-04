import { JwtPayload } from 'jsonwebtoken'
import { extend } from 'lodash'
import { TokenType } from '~/constants/enums'
import { ParsedQs } from 'qs'
// file lưu các định nghĩa về request
export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface loginRegbody {
  email: string
  password: string
}

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
}

export interface LogoutReqBody {
  refresh_token: string
}

export interface emailVerifyReqQuery extends ParsedQs {
  email_verify_token: string
}

export interface ForgotPasswordReqBody {
  email: string
}
