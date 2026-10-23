# Kiểm chứng bản sửa Excel và menu — 23/10/2026

## Kết quả đã thực hiện

- Cài dependency theo lockfile; gỡ pdf-lib, @pdf-lib/fontkit, pdfmake và pdf-parse. Không có import các thư viện này trong code/scripts/test hiện hành.
- `npm run build`: đạt, 160 modules. Cảnh báo chunk lớn hơn 500 kB và directive use client của React Router vẫn còn như trước; không tăng ngưỡng để giấu cảnh báo.
- `node scripts/check-local.js`: 0 lỗi file/dependency.
- 20 kiểm thử API/MySQL (data-exchange + report-exports) đạt trong **chung_cu_test**, riêng với database vận hành: tải đủ 5 loại mẫu; quyền BQL; preview rollback; xác nhận cả lô; replay không tạo trùng; lỗi dòng/khóa kỳ; xuất đủ dữ liệu vượt trang; giữ điện thoại/mã có 0 đầu; số tiền hơn 15 chữ số; snapshot nhất quán; giới hạn 10.000 dòng và slot xử lý.
- 9 kiểm thử parser/CLI đạt: các file Excel mẫu được đọc thật; chọn nhầm phần dữ liệu; Nhap trống; tệp báo cáo không phải mẫu; không cắt 101 dòng; giới hạn giải nén; ngày Excel; công thức; tên DB và origin nghiệm thu.
- 8 ca trình duyệt đạt: nhập/xuất Excel trên 1440/375px; công nợ/thu phí/sổ quỹ trên 1440/375px; header/sidebar khi cuộn ở 320/768/1024/1440px. Hai ca nhập đã được sửa điểm chờ sau đổi phân hệ để không chọn file vào component cũ đang unmount; không bỏ assertion hoặc nới timeout.
- 4 lượt axe trên trang nhập Excel, WCAG 2 A/AA, 2.1 A/AA và best-practice: không vi phạm. Sửa nhãn riêng cho vùng tải mẫu/xuất và vùng bảng có thể cuộn.
- Script tạo mẫu đã chạy, tạo 7 XLSX có dữ liệu giả lập (5 đúng, 2 có lỗi cố ý), cùng README/manifest. PDF mẫu được bỏ khỏi bộ mới.
- Đã xem ảnh chụp sau khi cuộn: header ở y=0 và sidebar ngay dưới header trên desktop; điện thoại không bị header/menu nổi chiếm màn hình. Logo có nhóm chữ riêng và tài khoản không lặp nhãn Ban quản lý.

## Giới hạn

Ảnh trang Excel/menu dùng catalog và tài khoản UI giả lập. Các ca nhập/xuất và báo cáo trình duyệt/API dùng MySQL thử nghiệm thật; không đọc hay sửa database của máy người dùng. Không xác nhận nghiệp vụ chỉ bằng ảnh chụp.

HTTP 500 tại máy người dùng chưa tái hiện: 5 mẫu Excel và các báo cáo trong kiểm thử trả tệp hợp lệ. Nếu vẫn lỗi sau khi chép đủ code/cài dependency/khởi động lại backend, cần lỗi terminal backend để biết nguyên nhân cụ thể. Không kết luận mọi lỗi HTTP 500 đều do Excel/PDF.

Không chạy lại toàn bộ backend suite hoặc toàn bộ bộ tạo nghiệm thu nhiều nghiệp vụ. Các thay đổi script nghiệm thu đã kiểm tra cú pháp và CLI; chưa tạo lại trọn bộ nghiệm thu trong nhiệm vụ này. Không thử camera/điện thoại vật lý hay chuyển tiền.

PDF chứng từ phiếu quỹ và PDF sơ đồ/tài liệu báo cáo đã có không bị xóa; chức năng đã bỏ là nhập/xuất dữ liệu/báo cáo PDF.

## Lệnh kiểm tra chính

```text
node --test backend/test/import-parser.test.js scripts/create-acceptance-data.test.js
node --env-file-if-exists=.env --test --test-concurrency=1 backend/test/data-exchange.test.js backend/test/report-exports.test.js
node --env-file-if-exists=.env node_modules/@playwright/test/cli.js test e2e/data-exchange.spec.js e2e/report-exports.spec.js e2e/workspace-layout.spec.js
npm run build
node scripts/check-local.js
```

Các lệnh MySQL/test trình duyệt yêu cầu DB_NAME=chung_cu_test và test database/migration/fixture parent trigger được chuẩn bị theo scripts/test-local.js. Không trỏ chúng vào database vận hành. UI_QA_AXE trỏ tới axe.min.js để chạy thêm lượt axe trong workspace-layout.spec.js; thư viện này không được thêm vào runtime web.
