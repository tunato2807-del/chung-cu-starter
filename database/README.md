# MySQL 8.4

`migrations/001_auth_qr_incidents.sql` triển khai 5 bảng nghiệp vụ: `nguoi_dung`, `vi_tri_qr`, `phan_anh`, `lich_su_phan_anh`, `hinh_anh_phan_anh`; cùng `yeu_cau_gui`, `gioi_han_gui` cho chống gửi lặp/giới hạn gửi và `schema_migrations` theo dõi phiên bản.

Tại gốc repository: `npm run init:local`, `npm run db:up`, `npm run db:migrate`, `npm run db:seed`. Migration có khóa MySQL và checksum, không tự xóa dữ liệu, chạy lại không tạo bản ghi nghiệp vụ trùng. MySQL DDL không rollback toàn bộ; nếu lỗi giữa chừng, kiểm tra lỗi và các bảng đã tạo trước khi chạy lại. `IF NOT EXISTS` hỗ trợ tiếp tục migration đầu tiên bị gián đoạn, không phải cơ chế nâng cấp một schema cũ khác cấu trúc. Không sửa migration đã áp dụng; thêm migration tiếp theo.

Cổng DB, user, database và mật khẩu đọc từ `.env` gốc; không ghi thông tin kết nối thật vào Git. Compose chỉ mở cổng trên loopback. Với MySQL ngoài Docker, cấu hình các biến tương ứng, tạo database UTF8MB4 và cấp quyền migration cho user trước khi chạy.

Kiểm thử dùng `chung_cu_test`; các test xóa fixture của chính lượt chạy, không xóa bảng hoặc dữ liệu phát triển. Lệnh test có Docker để tạo database và trigger gây lỗi phục vụ kiểm tra rollback; ứng dụng thường chỉ dùng user của database.

`migrations/002_residency.sql` thêm `can_ho`, `cu_dan`, `lich_su_cu_tru`. Liên kết tài khoản cư dân tùy chọn và duy nhất; căn hiện tại lấy từ lịch sử đang mở. Cột sinh duy nhất chặn hai đợt chưa kết thúc của một cư dân. Chuyển căn có khóa hồ sơ và transaction; không xóa lịch sử. Chạy `npm run db:migrate` để áp dụng các migration chưa chạy theo thứ tự tên; chạy lại không tạo dữ liệu trùng và phát hiện file đã áp dụng bị sửa/mất.

Thiết kế chỉ số, đơn giá theo hiệu lực, hóa đơn và thông báo chưa được migration trong phiên bản này.

`migrations/003_same_day_residency.sql` thay CHECK tự sinh từ migration 002 bằng ràng buộc có tên cho phép `den_ngay >= tu_ngay`. Giữ mọi bản ghi lịch sử, không sửa migration 002 đã chạy. Khoảng rỗng giữ dấu vết chuyển trong ngày; UNIQUE đợt đang mở và khóa giao dịch vẫn có hiệu lực.

`migrations/004_vehicles.sql` thêm `phuong_tien`. Mỗi đăng ký giữ căn chịu phí, đợt cư trú và mã riêng; `ma_dang_ky_truoc` liên kết bản chuyển tiếp. UNIQUE cột sinh chỉ áp dụng cho biển số đang gửi; xe đạp có thể NULL. CHECK giữ ngày kết thúc không trước ngày đăng ký và bắt buộc người/lý do khi kết thúc. FK không xóa dây chuyền lịch sử. Chuyển xe và chuyển cư trú cùng transaction; không sửa các migration 001–003 đã chạy.
