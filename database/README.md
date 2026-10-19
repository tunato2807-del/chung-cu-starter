# MySQL 8.4

`migrations/001_auth_qr_incidents.sql` triển khai 5 bảng nghiệp vụ: `nguoi_dung`, `vi_tri_qr`, `phan_anh`, `lich_su_phan_anh`, `hinh_anh_phan_anh`; cùng `yeu_cau_gui`, `gioi_han_gui` cho chống gửi lặp/giới hạn gửi và `schema_migrations` theo dõi phiên bản.

Tại gốc repository: `npm run init:local`, `npm run db:up`, `npm run db:migrate`, `npm run db:seed`. Migration có khóa MySQL và checksum, không tự xóa dữ liệu, chạy lại không tạo bản ghi nghiệp vụ trùng. MySQL DDL không rollback toàn bộ; nếu lỗi giữa chừng, kiểm tra lỗi và các bảng đã tạo trước khi chạy lại. `IF NOT EXISTS` hỗ trợ tiếp tục migration đầu tiên bị gián đoạn, không phải cơ chế nâng cấp một schema cũ khác cấu trúc. Không sửa migration đã áp dụng; thêm migration tiếp theo.

Cổng DB, user, database và mật khẩu đọc từ `.env` gốc; không ghi thông tin kết nối thật vào Git. Compose chỉ mở cổng trên loopback. Với MySQL ngoài Docker, cấu hình các biến tương ứng, tạo database UTF8MB4 và cấp quyền migration cho user trước khi chạy.

Kiểm thử dùng `chung_cu_test`; các test xóa fixture của chính lượt chạy, không xóa bảng hoặc dữ liệu phát triển. Lệnh test có Docker để tạo database và trigger gây lỗi phục vụ kiểm tra rollback; ứng dụng thường chỉ dùng user của database.

Thiết kế đích về căn hộ, lịch sử cư trú, xe, chỉ số, đơn giá theo hiệu lực, hóa đơn và thông báo chưa được migration trong phiên bản này.
