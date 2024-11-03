// file này lưu hàm tiện ích giúp mình liên kết với server jwt
// và nhờ nó ký cho mình 1 @token
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { TokenPayload } from './models/requests/users.request'
dotenv.config()
// signToken là hàm ký token
export const signToken = ({
  payLoad,
  privateKey,
  options = { algorithm: 'HS256' }
}: {
  payLoad: string | object | Buffer
  privateKey: string
  options?: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    // kêu jwt ký cho mình
    jwt.sign(payLoad, privateKey, options, (error, token) => {
      if (error) {
        throw reject(error)
      } else resolve(token as string)
    })
  })
}

// làm hàm giúp kiểm tra một token có đúng với chữ ký hay không
// nếu đúng thì trả ra payload đang có trong token đó
export const verifyToken = ({ token, privateKey }: { token: string; privateKey: string }) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, privateKey, (error, decode) => {
      if (error) throw reject(error)
      else return resolve(decode as TokenPayload)
    })
  })
}
