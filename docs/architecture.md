# Kiến trúc phiên bản phản ánh QR

Frontend dùng React Router, điều hướng theo vai trò thật từ API, không còn nút giả lập vai trò. Màn công khai tách khỏi workspace BQL/KTV/cư dân. Các trạng thái tải, rỗng, lỗi, gửi chờ và xung đột được hiển thị tại màn đang thao tác. Bộ lọc và trang danh sách nằm trong URL, giữ khi trở lại từ chi tiết.

Backend tách middleware xác thực, service nghiệp vụ phản ánh và repository truy vấn có tham số. MySQL InnoDB lưu dữ liệu lâu dài, `transaction()` là ranh giới cập nhật trạng thái + lịch sử + metadata ảnh. `phien_ban` và khóa hàng ngăn ghi đè dữ liệu cũ; trả 409 để người dùng tải lại. Lỗi có mã, thông báo, lỗi trường (khi có) và request ID.

## Xác thực và quyền

- Băm mật khẩu bằng bcrypt cost 12, không nhận mật khẩu dài quá 72 byte.
- JWT HS256 có issuer, audience, hạn 8 giờ và phiên bản tài khoản; cookie HttpOnly, SameSite=Strict. Mỗi request kiểm tra lại trạng thái/vai trò/phiên bản trong DB. Đổi mật khẩu, khóa tài khoản, đăng xuất tăng phiên bản.
- Request thay đổi dữ liệu cần `X-App-Request: 1`, không bật CORS và từ chối `Sec-Fetch-Site: cross-site`. Cookie Secure được bật qua cấu hình khi có HTTPS.
- Khóa đăng nhập 15 phút sau 5 lần sai; giới hạn theo IP ở middleware. BQL cấp tài khoản KTV/cư dân, không có đăng ký công khai hoặc tự chọn vai trò.
- KTV chỉ đọc/sửa việc được giao hiện tại; cư dân chỉ đọc bản ghi do tài khoản gửi. Ảnh đọc qua endpoint kiểm tra quyền, không mount thư mục uploads công khai.

## Quy trình phản ánh

`MOI → DA_PHAN_CONG → DANG_XU_LY → DA_XU_LY → DA_DONG`.

BQL có thể phân công lại khi đã phân công/đang xử lý, giữ trạng thái và ghi cả người cũ/mới trong lịch sử. BQL trả `DA_XU_LY → DANG_XU_LY` cần lý do và tăng lượt xử lý. Hoàn thành cần ghi chú và ảnh mới gửi trong cùng request. BQL có thể từ chối hoặc gộp khi `MOI`; gộp phải cùng vị trí, bản gốc còn mở, không tự gộp hoặc tạo chuỗi/vòng gộp.

QR dùng UUID v4; tạo lại thu hồi mã cũ. Server luôn tra lại token khi gửi. Bí mật tra cứu là 32 byte ngẫu nhiên, không đưa vào URL API. Tra cứu qua POST chỉ trả vị trí, trạng thái, thời gian và phản hồi công khai; bản trùng lấy trạng thái hiện tại của bản gốc. Ghi chú nội bộ không trả trong lịch sử cư dân/công khai.

Khóa yêu cầu UUID và dấu vân tay nội dung/tài khoản/ảnh được lưu cùng giao dịch: gửi lại cùng yêu cầu trả mã cũ, nội dung khác trả 409. Giới hạn 5 lần gửi thành công trong 60 phút theo tổ hợp SĐT + IP được lưu trong MySQL; cảnh báo tương tự chỉ thông báo có sự cố đang mở, không lộ hồ sơ của người khác.

Ảnh tối đa 5 tệp × 5 MB/request, tối đa 25 triệu điểm ảnh/tệp. Sharp giải mã kiểm tra JPEG/PNG/WebP, giới hạn kích thước, xuất JPEG loại metadata và đổi tên ngẫu nhiên. Ảnh chuẩn bị trước giao dịch được xóa nếu giao dịch thất bại. Chưa có tác vụ định kỳ thu gom ảnh mồ côi do tiến trình/máy bị dừng đột ngột; cần bổ sung trước vận hành dài hạn. Giới hạn IP trong bộ nhớ phù hợp một tiến trình demo; triển khai nhiều instance cần kho giới hạn dùng chung và cấu hình trust proxy đúng hạ tầng.

## Phạm vi tiếp theo

Chưa triển khai các module cư trú, phương tiện, chỉ số, phí/hóa đơn, VietQR và thông báo. Schema hiện chỉ chứa phần cần cho luồng QR. Những bảng nghiệp vụ tiếp theo phải được bổ sung bằng migration mới, giữ lịch sử và áp dụng quyền theo đợt cư trú theo bản rà soát. Không dùng SQL cũ trong tài liệu thiết kế làm migration cho database đang chạy.
