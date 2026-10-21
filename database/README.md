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

`migrations/013_treasury.sql` thêm quỹ, phiếu thu/chi, chứng từ và audit. Chỉ seed một quỹ nhận thu hóa đơn, không seed số dư/phiếu hoặc sửa hóa đơn cũ. Generated UNIQUE quy_hoa_don giới hạn một nguồn hóa đơn; CHECK quỹ đó luôn hoạt động. Phiếu dùng DECIMAL(14,0) dương; UNIQUE UUID/fingerprint tạo nháp và UNIQUE ma_phieu_goc cho phiếu đảo, audit TEXT giữ đủ snapshot. Chứng từ MEDIUMBLOB cùng transaction, mỗi tệp tối đa 5 MB, CHECK kích thước thực, UNIQUE(phiếu,SHA256), FK cascade khi công cụ test dọn fixture. API không xóa quỹ/phiếu, chỉ hủy nháp hoặc ghi phiếu đảo.

Hóa đơn đã thu được đọc trực tiếp vào sổ quỹ vận hành, gồm dữ liệu đã xác nhận trước cập nhật, không backfill phiếu thu. Ngày hạch toán phiếu là DATE Việt Nam; timestamp audit/duyệt UTC. File chứng từ thu chi nằm trong database, cần sao lưu database đầy đủ; ảnh phản ánh cũ vẫn nằm trong backend/storage/images và vẫn cần sao lưu thư mục đó. Không sửa 001–013 đã áp dụng. Migrate chạy lại chỉ kiểm tra checksum và không thêm quỹ mặc định lần nữa.


`migrations/014_data_imports.sql` thêm ledger `dot_nhap_du_lieu`: actor, UUID, phân hệ, SHA256 tệp, 1–100 dòng, kết quả JSON chỉ ID/số dòng và thời điểm UTC. UNIQUE(actor,UUID) chặn UUID dùng lại cho lô khác, UNIQUE(actor,phan_he,SHA256) chặn nhập lại cùng file với UUID mới. FK người nhập giữ audit. Không sửa dữ liệu nghiệp vụ cũ, không seed lô nhập hay sao chép file/mật khẩu. Ledger chỉ commit cùng toàn bộ hồ sơ trong lô, preview và lô lỗi rollback. Giữ nguyên checksum migration 001–013.

`migrations/015_bill_batches.sql` thêm ledger `dot_lap_hoa_don`: người lập, UUID duy nhất theo người lập, SHA256 đầu vào chuẩn hóa, JSON kết quả và thời điểm tạo UTC. Kết quả chỉ chứa ID căn/hóa đơn, tổng tiền và số hóa đơn; không chứa token xem trước hay thông tin ngân hàng/mật khẩu. Row ledger commit cùng toàn bộ bản nháp, không backfill hoặc sửa hóa đơn cũ. Retry cùng UUID trả kết quả cũ, batch lỗi rollback cả ledger. Chạy `npm run db:migrate`, không sửa 001–014 và không seed lại. API ready yêu cầu đủ 15 migration.

`migrations/016_bill_actions.sql` thêm ledger riêng `dot_xu_ly_hoa_don` cho DUYET/GUI: actor, UUID duy nhất theo actor, thao tác, hash input và JSON kết quả. Kết quả chứa ID/số hóa đơn/căn, tổng và trạng thái lúc xử lý, không lưu token hay thông tin ngân hàng; thông tin nhận tiền vẫn snapshot ở từng hóa đơn như trước. Ledger commit cùng toàn bộ chuyển trạng thái/audit; lỗi rollback mọi thay đổi, retry không thực hiện lại. Giữ nguyên 001–015; migration không backfill, duyệt hoặc gửi hóa đơn sẵn có. API ready mới yêu cầu đủ 16 migration.

`migrations/017_building_structure.sql` thêm `khoi_toa_nha` và `tang_toa_nha` (khóa ghép khối/số tầng), backfill khối/tầng từ tất cả căn đang có theo collation của DB. Không đổi ID/số căn, cư dân, tài khoản hoặc hóa đơn. FK `tang_toa_nha → khoi_toa_nha` và `can_ho(khoi,tang) → tang_toa_nha` dùng ON UPDATE CASCADE, chặn xóa khi còn phụ thuộc. Service đổi mã/số trong transaction và tăng phiên bản căn/tầng bị ảnh hưởng; không đổi mã căn hoặc viết lại snapshot hóa đơn cũ. Số tầng giới hạn 0–200.

`giu_khi_trong` giữ các mục BQL khai báo/sửa hoặc được backfill hiển thị khi chưa có căn. Client cũ/Excel vẫn dùng chuỗi khối/tầng: service cấp đủ cha trong cùng transaction với căn, đặt cờ tự phát sinh; khối tự phát sinh không còn căn và không có tầng khai báo riêng được ẩn, không xóa dữ liệu cha. Production không có trigger tự tạo cha; API/service phải bảo đảm và FK là ràng buộc cuối cùng. `scripts/test-local.js` chỉ tạo hai trigger phụ trợ trong **chung_cu_test** cho các fixture tích hợp cũ chèn căn trực tiếp; kiểm thử mới có ca tắt các trigger này để chứng minh service không phụ thuộc trigger. Giữ checksum 001–017 khi đã áp dụng; readiness yêu cầu đủ 17.
