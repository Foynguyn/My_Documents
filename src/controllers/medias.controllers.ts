import { Request, Response, NextFunction } from 'express'
import formidable from 'formidable'
import path from 'path'

export const uploadSingleImageController = async (
  req: Request,
  res: Response, //
  next: NextFunction
) => {
  // khi người ta upload hình lên thì mình sẽ kiểm tra hình bằng forrmidable
  // __dirname chứa đường dẫn tuyệt đối đến thư mục chứa file đang chạy
  // path.resolve('uploads') đường dẫn mà mình muốn làm chỗ lưu file
  console.log(path.resolve('uploads'))

  const form = formidable({
    uploadDir: path.resolve('uploads'), // nơi sẽ lưu nếu vượt qua kiểm duyệt
    maxFiles: 1, // tối đa 1 file
    keepExtensions: true, // giữ lại đuôi file
    maxFileSize: 1024 * 300 // tối đa 1 hình ko quá 300KB
  })
  // tiến hành xài form để kiểm tra hình
  form.parse(req, (err, fields, files) => {
    // files là object chứa các file đã tải lên server
    // nếu ko upload file nào thì files sẽ là {}
    if (err) {
      throw err
    } else {
      res.json({
        message: 'upload image successfully'
      })
    }
  })
}
