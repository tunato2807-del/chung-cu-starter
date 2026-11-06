# Bộ dữ liệu mô phỏng sát nghiệp vụ, quy mô lớn

[Kết quả chạy trên MySQL 8.4 và 8.0.46, số lượng từng bảng](kiem-chung-du-lieu-mo-phong.md).

Người dùng đã chọn sử dụng dữ liệu mô phỏng cho bộ này. Mọi danh tính, số điện thoại, chỉ số, phản ánh, hóa đơn, thanh toán và chứng từ được sinh bằng thuật toán, không lấy từ hồ sơ nội bộ chung cư. Tên trên giao diện dùng tên tự nhiên, không gắn tiền tố “Demo” hoặc “NT”. Nguồn gốc mô phỏng được lưu trong tài liệu và manifest; không xác nhận đây là dữ liệu thật từ website.

## Quy mô thiết kế

| Nhóm | Số lượng |
| --- | ---: |
| Khối / tầng | 4 / 100 |
| Căn hộ / cư dân | 200 / 400 |
| Tài khoản căn hộ / nhân sự | 200 / 11 |
| Lịch sử cư trú | 412, có 12 lượt chuyển căn kèm xe |
| Phương tiện | 324 bản ghi, gồm lịch sử đăng ký |
| Chỉ số điện nước | 5.200, liên tục 13 kỳ |
| Hóa đơn | 2.604, gồm bản thay thế |
| Thiết bị / phiếu bảo trì | 160 / 160 |
| Vị trí QR / phản ánh | 180 / 240 |
| Ảnh phản ánh và nghiệm thu | 330 bản ghi ảnh minh họa |
| Lịch tiện ích | 160, đã qua và sắp tới |
| Thông báo | 140 thông báo và 20 nhắc phí |
| Phiếu thu chi / chứng từ | 164 / 160 |
| Lần nhập Excel | 100 lần chạy xem trước và xác nhận thực sự |

Bộ tạo kiểm tra tối thiểu 100 dòng ở **25/31 bảng thật và cả 8 view lịch sử**. Nhật ký, biên nhận đọc, đợt lập/xử lý hóa đơn, yêu cầu gửi và giới hạn gửi cũng được tạo từ luồng tương ứng, không chèn dòng rỗng để đủ số lượng.

Sáu ngoại lệ theo nghiệp vụ:

| Bảng | Số dòng | Lý do |
| --- | ---: | --- |
| `khoi_toa_nha` | 4 | Một chung cư gồm 4 khối |
| `loai_phi` | 6 | Sáu loại phí ứng dụng hỗ trợ |
| `cau_hinh_phi` | 6 | Một cấu hình cho mỗi loại phí trong thời gian mô phỏng |
| `tien_ich` | 8 | Tám tiện ích phù hợp quy mô chung cư |
| `quy_tai_chinh` | 4 | Vận hành, bảo trì, cải tạo/mua sắm, hoạt động cộng đồng |
| `schema_migrations` | 1 | Baseline schema do công cụ migration quản lý |

Số dòng thực tế của từng bảng và view được xuất sau khi tạo, gồm chi tiết hóa đơn và các lịch sử. Điện bậc thang, VAT và các đơn giá là giả định kiểm thử theo yêu cầu trước đó, không xác nhận là giá hiện hành của một chung cư.

## Chạy từ Terminal VS Code

Cập nhật nhánh `codex/thesis-mysql-database`. Giữ `.env`, `backend/storage/` và `.certs/` hiện có. Cần MySQL 8.0.21+ hoặc 8.4 đang chạy và cấu hình kết nối đúng; không cần Docker nếu đã cài MySQL riêng. Không có dependency mới.

```powershell
git fetch origin
git switch codex/thesis-mysql-database
git pull --ff-only origin codex/thesis-mysql-database
```

Trong PowerShell tại thư mục có `package.json`:

```powershell
npm.cmd run db:realistic -- --origin=https://192.168.1.208:5173
```

Thay IP bằng địa chỉ Wi-Fi hiện tại của máy bạn. Origin phải đúng frontend đang chạy và khớp chứng chỉ HTTPS nếu quét bằng camera trong web. Mặc định tạo database riêng **`chung_cu_nghiem_thu_quymo`**, tự chạy migration rồi sinh dữ liệu, giữ nguyên `.env` và database đang dùng. Chờ dòng **Hoàn tất**. Quá trình gồm nhiều lượt băm mật khẩu, nhập Excel, lập hóa đơn, tạo ảnh/QR và kiểm tra; không đóng terminal giữa chừng.

Lệnh chỉ nhận tên `chung_cu_nghiem_thu` hoặc `chung_cu_nghiem_thu_<mã>`. Database hoặc thư mục đầu ra đã có dữ liệu sẽ khiến lệnh dừng. Không có tùy chọn reset/ghi đè. Nếu cần bộ mới:

```powershell
npm.cmd run db:realistic -- --database=chung_cu_nghiem_thu_quymo2 --origin=https://192.168.1.208:5173
```

## Mở web đúng bộ dữ liệu

Dừng backend cũ bằng `Ctrl+C` trong terminal đang chạy backend, sau đó:

```powershell
npm.cmd run start:backend:acceptance -- chung_cu_nghiem_thu_quymo
```

Nếu dùng tên `quymo2`, thay tên database ở lệnh và đường dẫn cho khớp. Frontend vẫn dùng lệnh HTTP/HTTPS bạn đã cấu hình. Không chạy thêm backend khác trên cổng 3000. Mở cửa sổ ẩn danh để tránh nhầm phiên/tài khoản của bộ cũ.

Mở tệp trên máy:

```powershell
code .\backend\storage\acceptance\chung_cu_nghiem_thu_quymo\TAI-KHOAN.md
code .\backend\storage\acceptance\chung_cu_nghiem_thu_quymo\README.md
Start-Process .\backend\storage\acceptance\chung_cu_nghiem_thu_quymo\QR.html
```

- `TAI-KHOAN.md`: BQL, KTV và từng căn. Tài khoản căn đăng nhập bằng mã `CH...` hoặc SĐT chủ hộ, cùng mật khẩu của chính tài khoản căn.
- `QR.html`, `qr/`: QR theo origin đã nhập. Một mã được vô hiệu để kiểm thử trường hợp hết hiệu lực.
- `README.md`, `SO-LUONG-BANG.json`: số lượng 31 bảng/8 view, lý do ngoại lệ và kết quả kiểm tra.
- `manifest.json`: thông tin bộ, mật khẩu và một số mã tra cứu/SĐT phản ánh. Giữ riêng như `TAI-KHOAN.md`; không commit hoặc đăng công khai.
- `nhap/`: 100 tệp đăng ký xe đã nhập. Không nhập lại vì biển số trùng; dùng mẫu trống trên web để nhập thêm.
- `xuat/`: Excel danh sách chi tiết, Excel/PDF công nợ và thu phí. Chỉ số xuất kỳ hiện tại để nằm trong giới hạn báo cáo; database vẫn có đủ 13 kỳ.
- `anh/`: sơ đồ minh họa để thử tải ảnh, không phải ảnh hiện trường thật. Chứng từ cũng là minh họa, không có giá trị thanh toán.

Thông tin ngân hàng dùng STK mô phỏng toàn số 0, không dùng để chuyển tiền. Bộ tạo không gửi SMS, email hoặc gọi ngân hàng. Các mốc lịch sử được đặt lùi trong bộ dữ liệu để thử báo cáo; không đổi ngày giờ máy.

## Kiểm tra trước khi báo hoàn tất

Đếm đủ bảng/view và kiểm tra mốc 100 cùng sáu ngoại lệ; kiểm tra 81 khóa ngoại; đối chiếu tổng chi tiết và số tiền thu hóa đơn, chuỗi chỉ số, chủ hộ hiện tại, lịch tiện ích không trùng, tệp ảnh và số dư quỹ. Kiểm tra API gồm đăng nhập BQL/KTV/căn/SĐT chủ hộ, chặn tài khoản khóa/sai vai trò, QR/tra cứu, năm khoảng thời gian của tổng quan, Excel có ít nhất 100 dòng trong sheet Chi tiết và chữ ký PDF.

Nếu thất bại, manifest ghi `CHUA_HOAN_TAT` và tiến trình trả mã lỗi. Giữ bộ dở dang để kiểm tra; dùng mã database khác sau khi sửa, không xóa database đang dùng.
