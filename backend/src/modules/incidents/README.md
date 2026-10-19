# Tiếp nhận và xử lý phản ánh

incidents.routes.js nhận HTTP/multipart; incidents.service.js kiểm tra dữ liệu, quyền, trạng thái, chống gửi lặp và giữ ranh giới giao dịch; incidents.repository.js quản lý truy vấn, lịch sử và giới hạn bản ghi theo người dùng. Ảnh được xử lý tại lib/images.js và chỉ phục vụ qua API có quyền.

Xem docs/api.md và docs/architecture.md tại gốc repository để biết quy tắc và endpoint.
