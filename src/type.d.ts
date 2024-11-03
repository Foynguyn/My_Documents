// định nghĩa lại
import { Request } from 'express'
import { TokenPayload } from './models/requests/users.request'
declare module 'express' {
  interface Request {
    decode_authorization?: TokenPayload
    decode_refresh_token?: TokenPayload
  }
}
