# Bộ dữ liệu nghiệm thu toàn hệ thống

Bộ tạo mẫu cho schema **018_equipment_qr.sql**, bao phủ dữ liệu của **38 bảng**, không ghi dữ liệu mẫu vào database phát triển `chung_cu`. Các giá điện/thuế/ngân hàng chỉ là cấu hình giả lập theo kịch bản, không xác nhận biểu giá pháp lý hiện hành.

Xem **[code đầy đủ từng file và lệnh PowerShell cho VS Code](../../docs/cap-nhat-du-lieu-nghiem-thu-vscode.md)**. Có hai file chạy tính năng và một file kiểm thử tùy chọn. Không cần dependency hoặc migration mới; sử dụng các migration 001–018 đã có.

## Dữ liệu được tạo

Số liệu dưới đây là bộ mới tạo thành công ngày 21/10/2026 trong workspace. Khi tạo trên máy người dùng, ngày/kỳ được tính theo ngày Việt Nam lúc chạy; ID, mật khẩu, token QR và mã tra cứu được sinh riêng.

| Phân hệ | Dữ liệu |
|---|---|
| Tài khoản | 24 tài khoản: BQL, 2 KTV, cư dân cá nhân, nhân sự bị khóa và 19 tài khoản căn; có căn đã khóa do chủ hộ chuyển đi |
| Tòa nhà | 4 khối A/B/C/IMP; 8 tầng; 19 căn; khối C và tầng A4 trống để thử danh mục độc lập |
| Cư trú/xe | 14 cư dân, 15 đợt cư trú; chuyển căn B201 → B202 kèm xe, chuyển đi; 15 đăng ký xe gồm đang gửi và đã kết thúc |
| Phí/chỉ số | 6 đơn giá, điện đủ 6 bậc + VAT 8% giả lập; 157 bản ghi điện/nước, chuỗi chỉ số liên tục |
| Hóa đơn | 79 hóa đơn, 675 dòng chi tiết, 13 kỳ; nháp/duyệt/gửi/đã thu/hủy/thay thế; 13 đợt lập và 26 đợt duyệt/gửi hàng loạt |
| Công nợ/thu | Hóa đơn quá hạn/chưa quá hạn/đã thu; xác nhận thu có mã tham chiếu, lịch sử và tiền trên sổ quỹ vận hành |
| QR/phản ánh | 5 QR, 32 phản ánh, 44 ảnh; đủ 7 trạng thái, trả lại, đổi người thực hiện, gộp; snapshot thiết bị trước/sau đổi liên kết |
| Thiết bị/bảo trì | 10 thiết bị; quá hạn/sắp hạn/chưa lịch/tạm dừng/ngừng; 7 phiếu đủ các trạng thái, có báo cáo bị trả lại |
| Tiện ích | 3 tiện ích; 8 lượt đặt chờ/duyệt/từ chối/hủy từ ngày mai; một tiện ích tạm ngừng |
| Thông báo | 6 thông báo gồm toàn bộ/khối/căn, nháp/thu hồi, nhắc phí; biên nhận đã đọc và mục chưa đọc |
| Quỹ | 3 quỹ, 6 phiếu, 4 chứng từ; nháp/ghi sổ/hủy/đảo; quỹ bảo trì mẫu còn **18.500.000 đồng** |
| Nhập/xuất | 6 đợt nhập thực tế qua service (5 Excel + 1 PDF biểu mẫu); 17 file thử nhập; 24 file báo cáo Excel/PDF đã xuất |
| Tổng quan | Hóa đơn phân bố 13 tháng và phản ánh ở nhiều mốc ngày, có dữ liệu cho ngày/tuần/tháng/quý/năm |

Những con số có thể tăng sau khi bạn thử thêm dữ liệu. Số dư quỹ là số dư của phần mềm theo dữ liệu giả lập, không đại diện tiền thật. Tài khoản nhận tiền trong hóa đơn cố ý là tài khoản giả; chỉ thử hiển thị/đọc QR, không thực hiện chuyển khoản thật.

## Chạy nhanh với MySQL Docker của dự án

Tại thư mục gốc, khi MySQL đang chạy:

```powershell
node --env-file-if-exists=.env scripts/create-acceptance-data.js --docker --origin=https://192.168.1.208:5173
```

Thay IP bằng địa chỉ mạng hiện tại của máy tính. Origin cần đúng địa chỉ HTTPS mà điện thoại mở được và khớp chứng chỉ. `--docker` tạo riêng database `chung_cu_nghiem_thu` và cấp quyền cho DB_USER hiện có qua MySQL administrator trong container. Không sửa `.env` hoặc cấu hình cổng.

Nếu dùng MySQL riêng, dùng quyền quản trị để tạo database/cấp quyền tương ứng, sau đó chạy cùng lệnh **bỏ `--docker`**. Hướng dẫn chi tiết trong tài liệu VS Code.

Bộ tạo chỉ chấp nhận `chung_cu_nghiem_thu` hoặc `chung_cu_nghiem_thu_<mã chữ thường/số>`. Database phải chỉ có dữ liệu danh mục gốc của migration. Chạy lại trên DB đã có mẫu sẽ dừng, không xóa/chèn trùng/cấp lại mật khẩu. Đây là hành vi giữ nguyên bộ đang nghiệm thu, không phải lỗi cần reset database. Muốn bộ mới dùng `--database=chung_cu_nghiem_thu_b2`.

Các luồng được tạo qua service hiện hành để tính đúng snapshot/lịch sử. Riêng tài khoản khởi tạo được bootstrap bằng bcrypt, còn mốc thời gian hóa đơn/phản ánh lịch sử được điều chỉnh trong database mẫu để mô phỏng quá khứ và công nợ. Không dùng lịch sử giả lập làm chứng từ vận hành thật. Nếu tạo dừng giữa chừng, giữ manifest để xem giai đoạn đã tạo và dùng tên DB nghiệm thu mới; không tự ghi “hoàn tất” hoặc chạy lại để chồng dữ liệu.

## Kết quả trên máy người dùng

Sau khi console báo **Hoàn tất**, mở:

```text
backend/storage/acceptance/chung_cu_nghiem_thu/
├── README.md           Kịch bản và số dòng từng bảng
├── TAI-KHOAN.md        Tên đăng nhập, SĐT chủ hộ, mật khẩu, trạng thái
├── manifest.json       ID, mã tra cứu/SĐT, kiểm tra và danh mục mẫu
├── QR.html             Trang xem/in 5 QR
├── qr-*.png            Ảnh QR
├── anh/                Ảnh hiện trường/nghiệm thu giả lập
├── nhap/               Excel và PDF còn trường điền
└── xuat/               Báo cáo từ dữ liệu mẫu
```

Thư mục này đã nằm trong quy tắc Git ignore của `backend/storage/`; không đưa file tài khoản/mã tra cứu lên GitHub. File mẫu sinh ở workspace không dùng cho database máy bạn vì ID/token/password là riêng từng bộ; hãy chạy bộ tạo trên máy bạn.

File `da-nhap-*` đã được nhập để có lịch sử. File `thu-*` chưa nhập: chọn đúng phân hệ và thử theo thứ tự **căn hộ → cư dân → phương tiện → chỉ số → thiết bị**. Bộ Excel dùng căn `NT-THU-X`, PDF dùng `NT-THU-P`; chọn được cả hai. Mã cư dân của xe đã điền theo bộ hiện tại, không còn placeholder. File `loi-dien-tich.xlsx` cố ý sai để thử xem trước/chặn nhập. Không Print to PDF/làm phẳng file biểu mẫu trước khi nhập.

## Mở web bằng database mẫu

Dừng backend cũ bằng Ctrl+C trong terminal của nó. Trong terminal đó:

```powershell
$env:DB_NAME = "chung_cu_nghiem_thu"
npm run start -w backend
```

Giữ terminal này chạy. Terminal khác:

```powershell
node scripts/check-local.js --api http://127.0.0.1:3000
npm run dev:frontend:https
```

Giữ frontend đang chạy thì không cần mở thêm một Vite chiếm cùng cổng. Mở web bằng cửa sổ ẩn danh, đăng nhập bằng `TAI-KHOAN.md` để dùng đúng phiên của bộ mới. Không chạy thêm backend ở cổng 3000 khi bản cũ còn chạy. Tên miền frontend `/api` vẫn proxy backend như cấu hình hiện có.

Để quay lại DB cũ: Ctrl+C backend mẫu, rồi trong chính terminal đó:

```powershell
Remove-Item Env:DB_NAME -ErrorAction SilentlyContinue
npm run start -w backend
```

Lúc này backend đọc DB_NAME từ `.env` cũ; đóng cửa sổ ẩn danh hoặc đăng nhập lại. Database mẫu vẫn được giữ để dùng tiếp.

## Phạm vi kiểm tra

Lần chạy workspace: **58 kiểm tra API/tệp đạt**, bao gồm 3 vai trò, SĐT chủ hộ, tài khoản khóa, chặn quyền, dashboard 5 khoảng, danh sách, báo cáo, tra cứu và đối chiếu tổng tiền/số dư. Kiểm tra 38 bảng đều có dữ liệu; chạy lại bị chặn; số dòng 38 bảng database phát triển không đổi. Các suite backend/E2E hiện có vẫn cần chạy lần lượt trong `chung_cu_test` khi sửa nghiệp vụ.

Quét QR/camera vật lý, UI trên điện thoại, các bước duyệt/nghiệm thu bạn tự thao tác và đối soát chuyển khoản thật chưa được công nhận đạt chỉ vì đã có bộ mẫu. Dùng [ma trận nghiệm thu](../../docs/bao-cao/nghiem-thu.md) và README sinh cùng bộ để ghi nhận kết quả thực tế.
