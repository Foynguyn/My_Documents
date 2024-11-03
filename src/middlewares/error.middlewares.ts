// file này chứa hàm error handler tổng

import HTTP_STATUS from '~/constants/httpStatus'
import { Request, Response, NextFunction } from 'express'
import { omit } from 'lodash'
import { ErrorWithStatus } from '~/models/schemas/errors'
// lỗi từ toàn bộ hệ thống sẽ được dồn về đây
export const defaultErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  // return res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(err, ['status']))
  // lỗi của toàn bộ hệ thống sẽ đổ về đây
  if (error instanceof ErrorWithStatus) {
    res.status(error.status).json(omit(error, ['status']))
  } else {
    // lỗi khác ErrorWithStatus, nghĩa là lỗi bình thường, lỗi ko có status,
    // lỗi có tùm lum thứ stack, name, ko có status
    Object.getOwnPropertyNames(error).forEach((key) => {
      Object.defineProperty(error, key, {
        enumerable: true
      })
    })
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error.message,
      errInfor: omit(error, ['stack'])
    })
  }
}
