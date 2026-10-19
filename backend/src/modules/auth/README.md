# Đăng nhập, tài khoản, phiên và phân quyền

Chưa triển khai. Khi phát triển, tạo:

- auth.routes.js: URL và middleware.
- auth.controller.js: nhận HTTP, trả kết quả.
- auth.service.js: quy tắc nghiệp vụ và ranh giới transaction.
- auth.repository.js: truy vấn MySQL có tham số.
- auth.validation.js: kiểm tra đầu vào.

Kiểm tra quyền trên từng bản ghi tại service. Không tin vai trò hoặc mã căn hộ do frontend gửi.
