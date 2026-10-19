# Cấu hình tòa nhà

Chưa triển khai. Khi phát triển, tạo:

- settings.routes.js: URL và middleware.
- settings.controller.js: nhận HTTP, trả kết quả.
- settings.service.js: quy tắc nghiệp vụ và ranh giới transaction.
- settings.repository.js: truy vấn MySQL có tham số.
- settings.validation.js: kiểm tra đầu vào.

Kiểm tra quyền trên từng bản ghi tại service. Không tin vai trò hoặc mã căn hộ do frontend gửi.
