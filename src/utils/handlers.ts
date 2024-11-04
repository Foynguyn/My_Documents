// file này chứa hàm có tên là wrapAsync
// wrapAsync là một hàm nhận vào async request handler
// và nó tạo ra cấu trúc try catch next cho "async request handler"
// từ đó "async request hadnler" có thể throw thoải mái mà ko cần try catch next gì cả
import { Request, Response, NextFunction, RequestHandler } from 'express'
export const wrapAsync = <P, T>(func: RequestHandler<P, any, any, T>) => {
  return async (req: Request<P, any, any, T>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
