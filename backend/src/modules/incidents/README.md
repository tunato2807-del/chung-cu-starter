# Phản ánh, phân công, ảnh và lịch sử xử lý

Chưa triển khai. Khi phát triển, tạo:

- incidents.routes.js: URL và middleware.
- incidents.controller.js: nhận HTTP, trả kết quả.
- incidents.service.js: quy tắc nghiệp vụ và ranh giới transaction.
- incidents.repository.js: truy vấn MySQL có tham số.
- incidents.validation.js: kiểm tra đầu vào.

Kiểm tra quyền trên từng bản ghi tại service. Không tin vai trò hoặc mã căn hộ do frontend gửi.
