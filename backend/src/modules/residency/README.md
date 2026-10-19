# Căn hộ, cư dân và lịch sử cư trú

Chưa triển khai. Khi phát triển, tạo:

- residency.routes.js: URL và middleware.
- residency.controller.js: nhận HTTP, trả kết quả.
- residency.service.js: quy tắc nghiệp vụ và ranh giới transaction.
- residency.repository.js: truy vấn MySQL có tham số.
- residency.validation.js: kiểm tra đầu vào.

Kiểm tra quyền trên từng bản ghi tại service. Không tin vai trò hoặc mã căn hộ do frontend gửi.
