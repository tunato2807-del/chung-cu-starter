# Chuyển hệ quản trị sang PostgreSQL

Nguồn: yêu cầu trực tiếp mới nhất của người dùng. Yêu cầu này thay ràng buộc giữ MySQL trong bộ rà soát001; giữ nguyên các nguyên tắc khác về API, chức năng và bảo toàn dữ liệu.

- PostgreSQL 17+ là hệ quản trị runtime chính; React/Vite/Express và hợp đồng API giữ nguyên.
- Chuyển toàn bộ 38 bảng/19 migration hiện có sang SQL PostgreSQL riêng, không sửa checksum các migration MySQL đã áp dụng.
- Bảo toàn ID, hash mật khẩu, token QR, phiên bản, JSON snapshot/hóa đơn, tiền, ngày giờ và liên kết dữ liệu. Không tái sinh credentials/QR khi nhập dữ liệu cũ.
- Chuyển native SQL trong mọi module, báo cáo, seed, diagnostic/exporter và công cụ test. Chỉ giữ mysql2 trong công cụ chuyển dữ liệu nguồn, không trong runtime app.
- Cung cấp đường chuyển dữ liệu nguồn chỉ đọc sang đích rỗng trong transaction, kiểm tra schema/count/chuỗi ID; không reset/truncate DB cũ hoặc tự cắt dữ liệu lỗi.
- Có cấu hình PostgreSQL/Compose và hướng dẫn Windows rõ DB nguồn/đích. Không tự ghi đè .env thực của người dùng; giữ MySQL để quay lại nếu chưa cutover.
- Kiểm chứng thật bằng PostgreSQL: luồng auth/QR/cư trú/xe/phí/báo cáo/thông báo/bảo trì/tiện ích/quỹ/Excel/PDF, rollback/races; chạy build và helper/UI liên quan.

Không tự sửa các phát hiện review001 ngoài phần cần để giữ đúng hành vi khi đổi DB. Chuyển dữ liệu thật trên Windows cần người dùng chạy công cụ với cấu hình cục bộ; workspace không có quyền truy cập máy đó.
