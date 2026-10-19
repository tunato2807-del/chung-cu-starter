# Đơn giá, chỉ số, hóa đơn và xác nhận chuyển khoản

Chưa triển khai. Khi phát triển, tạo:

- billing.routes.js: URL và middleware.
- billing.controller.js: nhận HTTP, trả kết quả.
- billing.service.js: quy tắc nghiệp vụ và ranh giới transaction.
- billing.repository.js: truy vấn MySQL có tham số.
- billing.validation.js: kiểm tra đầu vào.

Kiểm tra quyền trên từng bản ghi tại service. Không tin vai trò hoặc mã căn hộ do frontend gửi.
