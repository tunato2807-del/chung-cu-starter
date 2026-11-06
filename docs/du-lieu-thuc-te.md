# Dữ liệu thực tế cho đề tài

Đề tài tập trung quản lý vận hành một chung cư và tiếp nhận phản ánh. Thông tin của nhiều chung cư trên website chỉ dùng làm tài liệu tham khảo có nguồn; không ghép cư dân, thiết bị, thu phí và phản ánh của các dự án khác nhau thành dữ liệu vận hành một tòa nhà.

## Nguồn đang chuẩn bị đối chiếu

| Nguồn chính thức dự kiến | Nội dung cần kiểm chứng | Trạng thái ngày 06/11/2026 |
| --- | --- | --- |
| [Vinhomes](https://vinhomes.vn/) | Tìm hồ sơ chung cư phù hợp, tên dự án, địa chỉ, khối và tiện ích được công bố | Chưa truy cập được từ môi trường hiện tại; chưa lấy dữ liệu |
| [VISAHO](https://visaho.vn/) | Hồ sơ dự án quản lý, dịch vụ vận hành và tiện ích có công bố | Proxy từ chối truy cập HTTP 403; chưa lấy dữ liệu |
| [VietQR](https://api.vietqr.io/v2/banks) | Đối chiếu tên ngân hàng và BIN của danh sách chọn khi lập hóa đơn | Proxy từ chối truy cập HTTP 403; chưa đồng bộ |

Đây là các nguồn cần đọc tiếp, không phải xác nhận đã nhập dữ liệu thật. Môi trường đã lưu bản nháp bổ sung quyền truy cập `vinhomes.vn`, `www.vinhomes.vn`, `visaho.vn`, `www.visaho.vn`, `api.vietqr.io`; cần Review/Save và Publish để áp dụng. Chưa có thông tin dự án, ảnh hoặc giá dịch vụ từ các nguồn này được ghi vào database.

Mỗi thông tin thu thập cần giữ đường dẫn trang chi tiết, ngày đối chiếu và nội dung nguồn. Chỉ tên gọi tiện ích được công bố không đủ xác định giá đặt lịch, sức chứa và giờ mở cửa. Ảnh minh họa hiện tại vẫn ghi rõ là ảnh minh họa cho đến khi có ảnh đúng dự án cùng nguồn sử dụng phù hợp.

## Khởi tạo mới không có dữ liệu mẫu

Chỉ dùng sau khi đã cấu hình MySQL và chạy migration trên **database mới**. Không đổi `DB_NAME` của backend đang phục vụ dữ liệu hiện có một cách tùy ý.

Trong terminal VS Code tại thư mục dự án:

```powershell
npm.cmd run db:migrate
npm.cmd run setup:admin
```

Nhập họ tên và số điện thoại của người quản trị thực tế. Lệnh tạo duy nhất một tài khoản BQL và lưu mật khẩu ngẫu nhiên trong `backend/storage/setup/<ten_database>.initial-admin.json`. Đọc tệp trên máy, đăng nhập rồi đổi mật khẩu trong trang **Tài khoản**. Thư mục này được Git bỏ qua; trên Windows vẫn cần giữ tệp trong tài khoản máy tính riêng của bạn.

Lệnh không tạo căn hộ, cư dân, vị trí QR, phản ánh, hóa đơn, giao dịch, ngân hàng nhận tiền hoặc ảnh giả. Nếu database đã có tài khoản, lệnh dừng mà không sửa dữ liệu hay cấp lại mật khẩu. Nếu tệp tài khoản đã có, lệnh không ghi đè. Tài khoản và QR đã chuyển từ bản cũ tiếp tục sử dụng theo database cũ/đích đã chọn.

Sau đó nhập hồ sơ thực tế qua các màn hình đang có:

1. **Khối & tầng**, rồi **Căn hộ**: dùng danh mục được BQL xác nhận; không suy ra số căn và diện tích từ ảnh quảng cáo.
2. **Cư dân & cư trú**, **Phương tiện**: dùng hồ sơ do BQL/cư dân cung cấp; có thể nhập Excel theo mẫu hệ thống. Không lấy thông tin cá nhân của người khác trên web để tạo tài khoản cư dân.
3. **Thiết bị & bảo trì**, **Vị trí & QR**: tạo theo danh mục kiểm kê. Tạo QR từ hệ thống sau khi đã chốt URL HTTPS mà điện thoại truy cập được; không dùng QR quảng cáo của chung cư khác.
4. **Tiện ích & đặt lịch**, **Đơn giá phí**: dùng quy định và bảng phí đã xác nhận. Đơn giá trên web cần đúng nơi áp dụng và thời gian hiệu lực.
5. **Chỉ số điện nước**, **Phí & hóa đơn**, **Quỹ**: chỉ ghi số đo, khoản phải thu, chứng từ và thanh toán có hồ sơ. Hệ thống không tự tạo giao dịch để làm đầy biểu đồ.
6. **Phản ánh**: do cư dân/khách gửi trong lúc sử dụng; không chuyển nội dung đánh giá công khai thành phản ánh có thật của cư dân trong database.

## Dữ liệu đã có và nghiệm thu

Bản cập nhật này không xóa dữ liệu hoặc đổi tên dữ liệu giả lập thành dữ liệu thật. `db:acceptance`, `samples/` và các fixture kiểm thử vẫn giữ nhãn giả lập và nằm trong quy trình nghiệm thu riêng. Không chạy `db:acceptance` để khởi tạo vận hành thực tế.

Nếu đang dùng bộ nghiệm thu, giữ nguyên bộ đó để kiểm thử. Khi có hồ sơ thật, tạo database vận hành mới và nhập từng danh mục đã xác nhận. Giữ nguyên bản sao lưu và các file cấu hình/tài khoản cũ để đối chiếu, không chạy lệnh reset hoặc xóa dữ liệu hàng loạt.

## Kiểm chứng thay đổi khởi tạo

Đã chạy 14 kiểm tra trong `scripts/initial-admin.test.js` và `scripts/local-diagnostics.test.js`, gồm MySQL 8.4 trong container riêng với dữ liệu kiểm thử: chuẩn hóa số điện thoại, giới hạn họ tên, từ chối chạy thiếu thông tin tương tác, không ghi đè tệp mật khẩu, rollback khi không ghi được tệp, giữ nguyên tài khoản khi chạy lại, hai tiến trình chỉ tạo một quản trị viên và giữ tệp mật khẩu nếu mất phản hồi sau COMMIT. Các bảng căn hộ/cư dân/xe/QR/phản ánh/hóa đơn/thiết bị/thu chi vẫn trống sau khởi tạo. Không kết nối database trên máy người dùng.

`npm run build` thành công; `node scripts/check-local.js` báo 0 lỗi. Đây là kiểm chứng phần code khởi tạo, không xác nhận đã thu thập hoặc nhập dữ liệu thật từ website.
