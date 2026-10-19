# Phương tiện gắn với cư trú

Chưa triển khai. Khi phát triển, tạo:

- vehicles.routes.js: URL và middleware.
- vehicles.controller.js: nhận HTTP, trả kết quả.
- vehicles.service.js: quy tắc nghiệp vụ và ranh giới transaction.
- vehicles.repository.js: truy vấn MySQL có tham số.
- vehicles.validation.js: kiểm tra đầu vào.

Kiểm tra quyền trên từng bản ghi tại service. Không tin vai trò hoặc mã căn hộ do frontend gửi.
