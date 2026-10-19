# Thông báo và đối tượng nhận

Chưa triển khai. Khi phát triển, tạo:

- announcements.routes.js: URL và middleware.
- announcements.controller.js: nhận HTTP, trả kết quả.
- announcements.service.js: quy tắc nghiệp vụ và ranh giới transaction.
- announcements.repository.js: truy vấn MySQL có tham số.
- announcements.validation.js: kiểm tra đầu vào.

Kiểm tra quyền trên từng bản ghi tại service. Không tin vai trò hoặc mã căn hộ do frontend gửi.
