# Bộ tệp Excel / PDF đã điền sẵn để thử nhập

Tạo ngày **2026-10-20**, mã bộ **T261020**. Toàn bộ họ tên, điện thoại, biển số, căn hộ và thiết bị là dữ liệu giả lập để kiểm thử. Không có tài khoản/mật khẩu có sẵn trong tệp. Mỗi tệp tối đa 6 dòng, dưới giới hạn của hệ thống.

## Chọn bộ Excel hoặc PDF

Bộ **Excel** dùng căn `T261020X01`, `T261020X02`, `T261020X03` và khối TESTX. Bộ **PDF** dùng căn `T261020P01`, `T261020P02`, `T261020P03` và khối TESTP. Hai bộ dùng mã/điện thoại khác nhau, nên có thể thử cả hai. PDF đã điền sẵn và còn ô chỉnh sửa; không dùng Print to PDF hoặc làm phẳng trước khi nhập.

| Phần dữ liệu chọn trên web | Excel | PDF | Số dòng mỗi tệp |
|---|---|---|---|
| Căn hộ | [01_can_ho.xlsx](01_can_ho.xlsx) | [01_can_ho.pdf](01_can_ho.pdf) | 3 |
| Cư dân | [02_cu_dan.xlsx](02_cu_dan.xlsx) | [02_cu_dan.pdf](02_cu_dan.pdf) | 4 |
| Phương tiện | [03_phuong_tien.xlsx](03_phuong_tien.xlsx) | [03_phuong_tien.pdf](03_phuong_tien.pdf) | 3, cần thay mã cư dân |
| Chỉ số điện nước | [04_chi_so.xlsx](04_chi_so.xlsx) | [04_chi_so.pdf](04_chi_so.pdf) | 6 |
| Thiết bị | [05_thiet_bi.xlsx](05_thiet_bi.xlsx) | [05_thiet_bi.pdf](05_thiet_bi.pdf) | 3 |

Trên GitHub, mở file rồi bấm **Download raw file** để tải. Khi đã tải tệp về máy, không cần chép code hay cập nhật ứng dụng để sử dụng bộ mẫu này; ứng dụng cần có bản nhập/xuất `7b48d59` hoặc mới hơn.

## Thứ tự thử

Đăng nhập BQL → **Nhập / xuất Excel, PDF**. Mỗi lần chọn đúng phần dữ liệu → chọn tệp → **Xem trước tệp** → kiểm tra không có lỗi → **Xác nhận nhập**.

1. Nhập **01_can_ho** trước: tạo 3 căn và tài khoản căn. Giữ mật khẩu tạm thời vừa hiện để thử đăng nhập; mật khẩu chỉ hiện một lần.
2. Nhập **02_cu_dan** sau: An là chủ hộ căn 01, Mai là thành viên căn 01, Bình thuê căn 02, Hà là chủ hộ căn 03. Tài khoản căn 01/03 được bàn giao cho chủ hộ, nên dùng mật khẩu mới ở kết quả nhập cư dân.
3. **03_phuong_tien cần sửa mã trước khi nhập.** Mã cư dân do database trên máy bạn sinh ra, bộ mẫu không thể biết sẵn. Mở danh sách Cư dân, tìm TEST X hoặc TEST P, xuất Excel để lấy cột **Mã cư dân**:
   - Thay mọi `THAY_MA_CU_DAN_1` bằng mã **Nguyễn Minh An** của đúng nhóm X/P.
   - Thay `THAY_MA_CU_DAN_2` bằng mã **Lê Quang Bình** của đúng nhóm X/P.
   - Giữ nguyên số căn. Với Excel, sửa sheet **Nhap**. Với PDF, mở bằng Chrome/Acrobat, sửa ô mã cư dân và **Save**. Nếu chưa thay mã thì bản xem trước sẽ báo lỗi; đây là bước cần làm, không phải lỗi đọc tệp.
4. Nhập **04_chi_so** sau căn hộ: 3 căn, mỗi căn một dòng điện và một dòng nước, kỳ **2026-10**, ngày chốt **2026-10-19**, xác nhận kỳ đầu = 1. Không nhập lại để ghi đè kỳ đã có.
5. Nhập **05_thiet_bi** độc lập, không cần căn hộ/cư dân. Có ví dụ máy bơm theo chu kỳ 30 ngày, PCCC tạm dừng và camera chưa cấu hình lịch.

Ngày cư trú và đăng ký xe là **2026-10-01**. Nếu máy của bạn đang đặt ngày trước ngày này, sửa ngày hợp lệ trước khi thử. Nếu số căn/điện thoại/mã tài sản đã tồn tại do đã thử bộ này, chọn bộ còn lại hoặc tạo bộ mới bên dưới. Không xóa database để thử lại.

## Tệp cố ý có lỗi

- [90_loi_dien_tich_can_ho.xlsx](90_loi_dien_tich_can_ho.xlsx): chọn Căn hộ. Có 1 dòng đúng, 1 dòng diện tích âm. Kỳ vọng **2 dòng · 1 dòng lỗi**, nút xác nhận bị khóa, chưa căn nào được lưu.
- [91_loi_loai_thiet_bi.pdf](91_loi_loai_thiet_bi.pdf): chọn Thiết bị. Có 1 dòng đúng, 1 dòng loại `SAI_LOAI`. Kỳ vọng **2 dòng · 1 dòng lỗi**, chưa thiết bị nào được lưu.

Để thử chống trùng: sau khi đã nhập thành công tệp hợp lệ, chọn lại tệp và xem trước. Các dòng trùng phải báo lỗi và không tạo hồ sơ mới. Gửi lại yêu cầu đang lưu với cùng xác nhận/tệp được nhận diện là đã nhập.

## Tạo bộ mới trên máy bạn

Script chỉ tạo tệp, **không kết nối hoặc ghi database**. Tại thư mục gốc dự án có các thư viện của bản nhập/xuất:

```powershell
node scripts/create-import-samples.js --tag=TEST02 --out=samples/thu-lan-2
```

Chọn tag 2–10 chữ in hoa/số khác bộ trước. Script tạo mã căn/tài sản/biển số mới và tính điện thoại mẫu theo tag. Nếu hệ thống báo điện thoại trùng, sửa sang số giả lập khác chưa dùng; sau đó lấy lại mã cư dân thực tế để sửa tệp xe. Ngày được tính lại theo lịch Việt Nam lúc chạy.

`du-lieu-mau.json` ghi các dòng ví dụ để đối chiếu và `manifest.json` mô tả số dòng/tệp; hai file JSON không dùng để nhập vào web.
