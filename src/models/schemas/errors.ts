// dựa trên dạng lỗi bình thường (stack, message)
// ta sẽ tạo ra một loại lỗi mới {status, message}

import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'

export class ErrorWithStatus {
  message: string
  status: number
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

// tạo kiểu lỗi giống thiết kế
type ErrorType = Record<
  string,
  {
    msg: string
    [key: string]: any
  }
>

export class EntityError extends ErrorWithStatus {
  // sẽ tự có status và msg
  errors: ErrorType
  constructor({ message = USERS_MESSAGES.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorType }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY }) // 422
    this.errors = errors
  }
}
