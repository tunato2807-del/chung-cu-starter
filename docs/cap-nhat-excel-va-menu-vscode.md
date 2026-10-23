# Sửa nhập/xuất Excel, bỏ PDF và chỉnh header/menu BQL

Nhánh **codex/editorial-business-ui**. Cập nhật trên bản đầy đủ nghiệp vụ đang hiển thị trong ảnh của bạn; không dùng App/navigation của nhánh main.

## Những gì đã sửa

- Chỉ còn **nhập/xuất Excel .xlsx**, gồm danh sách các phân hệ và báo cáo công nợ, thu phí, sổ quỹ. Gỡ nút, mẫu, parser, renderer và thư viện tạo PDF. Chứng từ PDF đính kèm phiếu quỹ đang có là tài liệu nghiệp vụ riêng, không thuộc chức năng nhập/xuất báo cáo này.
- Mẫu tải trên web là **mẫu trống**: sheet Nhap nhận dữ liệu, Huong dan giải thích cột, Vi du minh họa. Không tự nhập dữ liệu ví dụ. Tải mẫu rồi chọn lại ngay khi chưa điền sẽ báo rõ “Chưa có dữ liệu trong sheet Nhap”.
- Tệp xuất Chi tiết không được dùng làm tệp nhập. Giữ số 0 đầu của mã/điện thoại, ngày ISO, chặn công thức/liên kết và hơn 100 dòng; không âm thầm cắt bớt dữ liệu.
- Giữ bước xem trước, xác nhận cả lô, rollback khi có lỗi, kiểm tra dữ liệu trùng/khóa kỳ và quyền BQL. Xuất đủ kết quả theo bộ lọc, tối đa 10.000 dòng; Excel mở ở Chi tiết và có Tổng hợp riêng.
- Header và sidebar dùng cùng mốc 80px trên desktop; header giữ trên cùng khi cuộn. Điện thoại dùng bố cục thường để menu không chiếm toàn màn hình. Logo CHUNG CƯ / QUẢN LÝ VẬN HÀNH căn theo hai dòng, tài khoản không lặp lại nhãn vai trò khi tên đã là Ban quản lý.

## Cập nhật từng file trong VS Code

Chép đủ các file liên quan trước khi khởi động lại backend:

1. [Code 6 file frontend đầy đủ](sua-excel-va-menu/code-frontend.md).
2. [Code 6 file backend đầy đủ](sua-excel-va-menu/code-backend.md).
3. [Code 2 script tạo mẫu/nghiệm thu](sua-excel-va-menu/code-scripts.md), để các script cũ không còn gọi PDF sau khi gỡ thư viện.

Các file kiểm thử đã cập nhật ở thư mục backend/test và e2e trên cùng nhánh GitHub, không cần chép để chạy web. Không sửa schema hay dữ liệu hiện tại; không cần chạy migration cho bản sửa này.

Dừng backend/frontend cũ bằng Ctrl+C trong đúng terminal của chúng. Từ thư mục gốc dự án:

```powershell
npm uninstall -w backend @pdf-lib/fontkit pdf-lib pdfmake pdf-parse
npm ci
npm run build
```

Lệnh uninstall cập nhật backend/package.json và package-lock.json trên máy bạn. Nếu dùng Git lấy trọn commit thì hai file này đã cập nhật, chỉ cần npm ci và npm run build.

Chạy lại backend:

```powershell
npm run dev:backend
```

Ở terminal khác, chạy frontend bằng lệnh bạn đang dùng (HTTP hoặc dev:frontend:https). Giữ nguyên chứng chỉ HTTPS/cấu hình camera hiện tại. Không mở thêm server trùng cổng. Nhấn Ctrl+Shift+R trong trình duyệt.

## Thử Excel ngay

[**Tải bộ Excel đã điền sẵn**](../samples/nhap-du-lieu/README.md). Trên GitHub mở tệp .xlsx → Download raw file. Tệp mới có mã bộ T261023 để tránh nhầm bộ cũ.

- Nhập 01_can_ho trước, rồi 02_cu_dan.
- Với 03_phuong_tien, thay THAY_MA_CU_DAN_1/2 bằng mã cư dân thật vừa tạo trên database máy bạn. Không dùng mã tài khoản CH...; cư dân phải đang ở đúng căn chịu phí.
- Nhập 04_chi_so sau căn hộ; thiết bị 05_thiet_bi có thể thử độc lập.
- Hai file 90/91 cố ý có một dòng sai để thử chặn cả lô.

Muốn dùng mẫu trống tải trên web: điền **sheet Nhap từ dòng 2**, lưu và đóng Excel rồi chọn lại tệp đã lưu. Không điền vào sheet Vi du hoặc Huong dan.

## Về lỗi tải tệp HTTP 500

Trong kiểm thử, cả 5 mẫu Excel tải thành công và các tệp điền ở sheet Nhap đọc được. Lỗi 500 cụ thể trên máy bạn chưa tái hiện được trong môi trường này. Bản sửa hiển thị thông báo rõ khi backend/proxy không trả được tệp; vẫn cần backend chạy đúng và dependency đã cài.

Nếu lỗi lặp lại sau khi cập nhật đủ file, kiểm tra terminal backend lúc bấm tải. Trong PowerShell khác có thể kiểm tra:

```powershell
node scripts/check-local.js --api http://127.0.0.1:3000
```

Không gửi mật khẩu hoặc toàn bộ .env. Lỗi backend/request ID nếu có sẽ giúp xác định chính xác thay vì đoán từ mã HTTP.

## Xem kết quả

[Header/menu sau khi cuộn](sua-excel-va-menu/menu-sau-khi-cuon-1440.png) · [Trang Excel trên điện thoại](sua-excel-va-menu/excel-320.png) · [Kiểm chứng](sua-excel-va-menu/verification.md).
