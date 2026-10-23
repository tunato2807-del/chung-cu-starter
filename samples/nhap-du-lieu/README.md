# Bộ Excel đã điền sẵn để thử nhập

Tạo ngày **2026-10-23**, mã bộ **T261023**. Dữ liệu giả lập, không có tài khoản hay mật khẩu thật. Đây là các tệp đã điền sẵn; mẫu tải trên web là mẫu trống.

| Thứ tự | Phần dữ liệu | Tệp | Số dòng |
|---|---|---|---|
| 1 | Căn hộ | [01_can_ho.xlsx](01_can_ho.xlsx) | 3 |
| 2 | Cư dân | [02_cu_dan.xlsx](02_cu_dan.xlsx) | 4 |
| 3 | Phương tiện | [03_phuong_tien.xlsx](03_phuong_tien.xlsx) | 3 |
| 4 | Chỉ số điện nước | [04_chi_so.xlsx](04_chi_so.xlsx) | 6 |
| 5 | Thiết bị | [05_thiet_bi.xlsx](05_thiet_bi.xlsx) | 3 |

Trên GitHub, mở tệp và chọn Download raw file. Đăng nhập BQL → Nhập / xuất Excel → chọn đúng phần dữ liệu → chọn tệp → Xem trước → xác nhận nếu mọi dòng hợp lệ.

Nhập căn hộ trước cư dân và chỉ số. Phương tiện cần cư dân đang ở căn đã chọn: thay THAY_MA_CU_DAN_1 bằng mã Nguyễn Minh An, THAY_MA_CU_DAN_2 bằng mã Lê Quang Bình trong nhóm TEST X. Lấy mã từ Cư dân & cư trú hoặc tệp xuất cư dân; không dùng tên tài khoản CH... Sửa sheet Nhap rồi lưu tệp.

Ngày bắt đầu cư trú/đăng ký xe: 2026-10-01; ngày chốt chỉ số: 2026-10-22; kỳ: 2026-10. Giữ mật khẩu căn hộ vừa được cấp để bàn giao riêng. Xem trước không lưu dữ liệu; cả lô chỉ được lưu khi tất cả dòng hợp lệ. Tệp đã nhập được kiểm tra trùng và không ghi đè hồ sơ cũ.

## Tệp có lỗi để kiểm tra

- [90_loi_dien_tich_can_ho.xlsx](90_loi_dien_tich_can_ho.xlsx): một căn có diện tích âm. Kỳ vọng 2 dòng / 1 dòng lỗi.
- [91_loi_loai_thiet_bi.xlsx](91_loi_loai_thiet_bi.xlsx): một loại thiết bị sai. Kỳ vọng 2 dòng / 1 dòng lỗi.

Không nhập PDF. Không dùng tệp xuất Chi tiết làm tệp nhập; dùng mẫu có sheet Nhap. Dòng ví dụ ở Vi du không được nhập tự động.

Tạo bộ mới để tránh trùng dữ liệu đã thử:

```powershell
node scripts/create-import-samples.js --tag=TEST02 --out=samples/TEST02
```
