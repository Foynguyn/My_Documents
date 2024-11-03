// viết hàm validate nhận vào checkSchema
// và trả ra middleware xử lý lỗi

import { NextFunction, Request, Response } from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import HTTP_STATUS from '~/constants/httpStatus'
import { EntityError, ErrorWithStatus } from '~/models/schemas/errors'

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req)
    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    const errorObject = errors.mapped()
    const entityError = new EntityError({ errors: {} })
    //  for in duyệt key
    for (const key in errorObject) {
      const { msg } = errorObject[key] // lấy msg trong mỗi thuộc tính
      // nếu có nội dung lỗi nào mà dùng ErrorWithStatus hoặc lỗi có mã khác 422
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        next(msg)
      }
      // những lỗi là 422 sẽ được nhét vào entityError
      entityError.errors[key] = errorObject[key].msg
    }
    next(entityError)
  }
}
