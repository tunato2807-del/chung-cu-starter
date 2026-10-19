# Vị trí, token QR và thu hồi QR

Chưa triển khai. Khi phát triển, tạo:

- qr.routes.js: URL và middleware.
- qr.controller.js: nhận HTTP, trả kết quả.
- qr.service.js: quy tắc nghiệp vụ và ranh giới transaction.
- qr.repository.js: truy vấn MySQL có tham số.
- qr.validation.js: kiểm tra đầu vào.

Kiểm tra quyền trên từng bản ghi tại service. Không tin vai trò hoặc mã căn hộ do frontend gửi.
