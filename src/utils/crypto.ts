//
// chuẩn bị hàm mã hóa một nội dung nào đó theo mã sha256

import { createHash } from 'crypto'
import dotenv from 'dotenv'
dotenv.config // liên kết với file env
function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex')
}

// viết hàm hashPassword
export function hashPassword(passwoed: string) {
  return sha256(passwoed + process.env.PASSWORD_SECRET)
}
