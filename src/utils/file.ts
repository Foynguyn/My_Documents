import fs from 'fs' // thao tác file/folder
import path from 'path'
// initFolder: hàm kiểm tra xem có folder uploads hay không?
// nếu ko có thì nó tạo giúp anh
export const initFolder = () => {
  // lấy đường dẫn từ gốc hệ thống vào uploads
  const uploadsFolderPath = path.resolve('uploads')
  // nếu mà đường dẫn không dẫn đến thư mục thì anh em mình tạo mới
  if (!fs.existsSync(uploadsFolderPath)) {
    fs.mkdirSync(uploadsFolderPath, {
      recursive: true // đệ quy | có thể tạo lòng các thư mục vào nhau
    })
  }
}
