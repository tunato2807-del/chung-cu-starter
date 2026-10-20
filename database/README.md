# MySQL 8.4

`migrations/001_auth_qr_incidents.sql` triển khai 5 bảng nghiệp vụ: `nguoi_dung`, `vi_tri_qr`, `phan_anh`, `lich_su_phan_anh`, `hinh_anh_phan_anh`; cùng `yeu_cau_gui`, `gioi_han_gui` cho chống gửi lặp/giới hạn gửi và `schema_migrations` theo dõi phiên bản.

Tại gốc repository: `npm run init:local`, `npm run db:up`, `npm run db:migrate`, `npm run db:seed`. Migration có khóa MySQL và checksum, không tự xóa dữ liệu, chạy lại không tạo bản ghi nghiệp vụ trùng. MySQL DDL không rollback toàn bộ; nếu lỗi giữa chừng, kiểm tra lỗi và các bảng đã tạo trước khi chạy lại. `IF NOT EXISTS` hỗ trợ tiếp tục migration đầu tiên bị gián đoạn, không phải cơ chế nâng cấp một schema cũ khác cấu trúc. Không sửa migration đã áp dụng; thêm migration tiếp theo.

Cổng DB, user, database và mật khẩu đọc từ `.env` gốc; không ghi thông tin kết nối thật vào Git. Compose chỉ mở cổng trên loopback. Với MySQL ngoài Docker, cấu hình các biến tương ứng, tạo database UTF8MB4 và cấp quyền migration cho user trước khi chạy.

Kiểm thử dùng `chung_cu_test`; các test xóa fixture của chính lượt chạy, không xóa bảng hoặc dữ liệu phát triển. Lệnh test có Docker để tạo database và trigger gây lỗi phục vụ kiểm tra rollback; ứng dụng thường chỉ dùng user của database.

`migrations/002_residency.sql` thêm `can_ho`, `cu_dan`, `lich_su_cu_tru`. Liên kết tài khoản cư dân tùy chọn và duy nhất; căn hiện tại lấy từ lịch sử đang mở. Cột sinh duy nhất chặn hai đợt chưa kết thúc của một cư dân. Chuyển căn có khóa hồ sơ và transaction; không xóa lịch sử. Chạy `npm run db:migrate` để áp dụng các migration chưa chạy theo thứ tự tên; chạy lại không tạo dữ liệu trùng và phát hiện file đã áp dụng bị sửa/mất.

Nghiệp vụ thanh toán mở rộng được bổ sung bằng migration mới khi triển khai.

`migrations/003_same_day_residency.sql` thay CHECK tự sinh từ migration 002 bằng ràng buộc có tên cho phép `den_ngay >= tu_ngay`. Giữ mọi bản ghi lịch sử, không sửa migration 002 đã chạy. Khoảng rỗng giữ dấu vết chuyển trong ngày; UNIQUE đợt đang mở và khóa giao dịch vẫn có hiệu lực.

`migrations/004_vehicles.sql` thêm `phuong_tien`. Mỗi đăng ký giữ căn chịu phí, đợt cư trú và mã riêng; `ma_dang_ky_truoc` liên kết bản chuyển tiếp. UNIQUE cột sinh chỉ áp dụng cho biển số đang gửi; xe đạp có thể NULL. CHECK giữ ngày kết thúc không trước ngày đăng ký và bắt buộc người/lý do khi kết thúc. FK không xóa dây chuyền lịch sử. Chuyển xe và chuyển cư trú cùng transaction; không sửa các migration 001–003 đã chạy.

`005_billing.sql` thêm danh mục phí, giá theo hiệu lực, chỉ số kỳ, hóa đơn, dòng tiền và lịch sử. Unique bản hiệu lực theo căn/kỳ, mã tham chiếu thu và liên kết thay thế giữ chống trùng; ràng buộc ngày/số không âm và số đã thu bằng tổng được áp dụng trong schema. Quy tắc dữ liệu nguồn/giá/chỉ số có kiểm tra transaction tại service. Không có đơn giá hoặc ngân hàng nhận tiền mặc định. Quyền cư dân đối chiếu đợt đang mở tại thời điểm request.

`006_electricity_tiers.sql` thêm cách tính, thuế và JSON bậc điện theo từng phiên bản giá. Dữ liệu cũ mặc định DON_GIA/0%, hóa đơn cũ không bị tính lại. Đơn giá dòng hóa đơn mở rộng để chứa khoản thuế; không sửa migration 005 đã chạy.

`007_apartment_accounts.sql` cho phép SĐT null ở tài khoản căn, thêm tên đăng nhập duy nhất, FK/unique căn và người phụ trách, phiên bản bàn giao và lịch sử bàn giao. Bổ sung tài khoản khóa cho căn đã có, liên kết người phụ trách chỉ khi có duy nhất một CHU_HO đang ở. Hash có tiền tố ! ở tài khoản backfill là giá trị không đăng nhập được; chỉ khi BQL cấp mật khẩu mới mới kích hoạt. Không đổi tài khoản/điện thoại cá nhân hoặc hóa đơn đã lưu.

`008_handover_audit_locks.sql` giữ mã cư dân cũ/mới trong log như ảnh chụp lịch sử, bỏ FK từ hai mã này để ghi log không lấy khóa cư dân ngược thứ tự khi bàn giao/chuyển đi. FK căn và người thực hiện vẫn giữ. Service kiểm tra cư dân mới đang là CHU_HO trong cùng transaction với khóa cư dân → căn → tài khoản. Tài khoản bị cascade xóa khi công cụ test xóa fixture căn; ứng dụng không cung cấp API xóa căn hoặc tài khoản.

`009_announcements.sql` thêm `thong_bao`, `thong_bao_da_doc`, `lich_su_thong_bao`. Phạm vi có CHECK toàn chung cư/khối/căn; nhắc phí gắn hóa đơn và ngày Việt Nam, UNIQUE hóa đơn/ngày chống trùng. Receipt dùng khóa (thông báo, tài khoản, người tiếp nhận): người tiếp nhận là ID chủ hộ hiện tại của tài khoản căn, hoặc 0 cho tài khoản cá nhân/chưa gắn. Đây là snapshot không có FK cư dân để tránh khóa ngược luồng bàn giao. Audit người thực hiện là FK tài khoản, cùng transaction với nội dung/trạng thái. Không seed hay phát hành thông báo vào dữ liệu phát triển khi migrate.

`010_maintenance.sql` thêm hồ sơ thiết bị/lịch, phiếu bảo trì và audit. Mã tài sản và UUID tạo phiếu duy nhất; UNIQUE cột sinh chỉ cho một định kỳ đang mở mỗi thiết bị. Phiếu giữ snapshot tên/vị trí/chu kỳ, kết quả/ngày thực hiện và phiên bản/lượt. FK/audit giữ dấu vết, ứng dụng không có API xóa; cascade chỉ phục vụ dọn fixture liên quan khi công cụ test xóa dữ liệu thử.

`011_maintenance_plan_checks.sql` bổ sung CHECK cặp chu kỳ/ngày và snapshot định kỳ có IS NOT NULL rõ ràng; giữ 010 đã áp dụng. Không có dữ liệu thiết bị/phiếu demo được tạo tự động khi migrate.

`migrations/012_amenity_bookings.sql` thêm tiện ích, lượt đặt và lịch sử thao tác. Mỗi lượt có FK căn/người/cư dân/đợt cư trú, tên/vị trí/người đặt snapshot, UUID duy nhất và SHA256 input. Không sửa các migration 001–011. CHECK chặn giờ sai thứ tự/khác ngày, phút ngoài bước 30, sức chứa ngoài 1–1000, lượt ngoài 30–360 phút. Quy tắc không giao nhau được đảm bảo bởi khóa row tien_ich chung cho mọi luồng ghi và kiểm tra khoảng [bat_dau,ket_thuc), không phải UNIQUE theo giờ bắt đầu. Index theo tiện ích/trạng thái/giờ, căn/giờ và người đặt/giờ phục vụ tra lịch và phân quyền. Chỉ audit có ON DELETE CASCADE từ lượt đặt, ứng dụng không cung cấp API xóa.

bat_dau/ket_thuc là giờ địa phương Việt Nam, ngay_tao là UTC như các module cũ. Tạm ngừng tiện ích không hủy các lượt đã đặt. Sửa cấu hình bị chặn nếu ảnh hưởng một lượt CHO_DUYET/DA_DUYET chưa kết thúc. Không migration hoặc seed nào tự tạo, duyệt, hủy lượt đặt hay gửi thông báo. Chạy lại migration chỉ xác minh checksum; không phát sinh dữ liệu nghiệp vụ mới.
