// đây là một middlewares giúp mình lọc lại request body
// chỉ lấy những thứ mình muốn thôi, còn những cái mình ko muốn thì bỏ đi

import { pick } from 'lodash'

// FilterKeys<T> là mảng các key của object T nào đó
type FilterKeys<T> = Array<keyof T>
import { Request, Response, NextFunction } from 'express'

export const filterMiddleware = <T>(filterKeys: FilterKeys<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // middleware này sẽ mod lại req.body bằng những filterKeys đã liệt kê
    req.body = pick(req.body, filterKeys)
    next()
  }
}
