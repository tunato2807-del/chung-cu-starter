# Kiểm chứng chuyển PostgreSQL

> **Bản CSDL hiện tại:** theo lựa chọn mới của người dùng, dùng MySQL31 bảng trên nhánh `codex/thesis-mysql-database`. Xem [hướng dẫn mới](csdl-do-an-mysql.md). Các bước/chỉ tiêu của bài cũ là lịch sử, không chép code PostgreSQL hoặc SQL38 bảng vào bản mới.

Ngày 05/11/2026. Mốc nguồn MySQL: `4f658f6`, nhánh nghiệp vụ `codex/editorial-business-ui`. Thay đổi này thực hiện yêu cầu đổi hệ quản trị; không đánh dấu các phát hiện ngoài phạm vi trong [review Spec Kit](ra-soat-spec-kit-2026-11-04.md) là đã sửa.

## Thay đổi đã thực hiện

- Runtime Express dùng `pg`; truy vấn nghiệp vụ là SQL PostgreSQL. Lớp `db` giữ hình dạng kết quả nội bộ và biên dịch placeholder có nhận biết chuỗi/comment/dollar quote, không dịch cú pháp MySQL lúc chạy.
- 19 migration PostgreSQL riêng; schema vật lý 38 bảng, 397 cột, 88 FK. Identity, CHECK, generated UNIQUE, JSON, NUMERIC, BYTEA và collation được kiểm chứng trên server thật. Các file migration MySQL gốc không thay đổi byte/checksum.
- Báo cáo giữ snapshot REPEATABLE READ READ ONLY; transaction, khóa bản ghi, savepoint nhập Excel và mã lỗi SQLSTATE được chuyển đồng bộ. Các quy tắc API về tiền dạng chuỗi, cờ 0/1 và ngày giờ được giữ.
- Compose dùng PostgreSQL 17, project/volume riêng; khởi tạo, nghiệm thu, chẩn đoán, exporter schema và runner test đều dùng PostgreSQL. `mysql2` chỉ còn là dependency phát triển để đọc nguồn khi chuyển và kiểm thử công cụ đó.
- Công cụ chuyển từ MySQL 018/019 kiểm tra checksum nguồn, từ chối đích có dữ liệu trước khi migrate và kiểm tra lại trong khóa chuyển. Copy/kiểm chứng/FK/restart sequence trong một transaction; không sửa nguồn và không ghi đè dữ liệu đích.

## Môi trường và kết quả

Node 24.19.0, PostgreSQL 17.11 (`postgres:17`), MySQL 8.4 cho nguồn thử nghiệm và Chromium đóng gói trong dependency. Hai server database thử nghiệm độc lập, chỉ mở cổng loopback; không dùng cấu hình/database thật của người dùng.

| Kiểm tra | Kết quả |
|---|---|
| Áp dụng từ database PostgreSQL mới | Đủ 19 migration; chạy lại giữ checksum |
| Backend/API | 226 test đạt |
| Công cụ/helper, bật cả bài chuyển giữa hai server thật | 49 test đạt |
| Giao diện trình duyệt, gồm 1440 px và 375 px | 73 test đạt |
| Build frontend | Đạt |
| HTTPS trust + frontend + proxy API | Đạt |
| Bộ mẫu PostgreSQL mới | 46 kiểm tra nghiệm thu đạt; có dữ liệu ở 38 bảng |
| Export metadata PostgreSQL | 38 bảng / 397 cột / 88 FK; đã sinh lại ERD/từ điển |

Bộ API bao gồm đăng nhập/khóa phiên, QR thu hồi, ảnh riêng tư, quyền sau bàn giao tài khoản căn, cư trú/chuyển căn cùng ngày, phương tiện, giá điện bậc thang/VAT, snapshot hóa đơn, duyệt/gửi theo lô, công nợ/thu phí, thông báo/nhắc phí, thiết bị/bảo trì, đặt lịch đồng thời, quỹ/chứng từ, nhập Excel và xuất Excel/PDF. Các ca lỗi audit, xung đột phiên bản và đua ghi vẫn phải rollback/giữ đúng số bản ghi.

Ở lần chạy browser đầu, các fixture còn thiếu phiên bản token, còn dùng LIKE của MySQL hoặc giả lập người đăng nhập nhưng để API badge trả 401. Đã sửa fixture để phù hợp hợp đồng phiên hiện tại và PostgreSQL, giữ các assertion về hành vi/quyền. Không hạ kiểm tra phiên hết hạn trong ứng dụng để cho test qua.

## Thử chuyển đầy đủ dữ liệu

1. Dùng code MySQL tại `4f658f6` và cấu hình giả lập để tạo bộ nghiệm thu riêng trong container MySQL 8.4, đủ 19 migration và 38 bảng. Bộ này gồm 13 kỳ hóa đơn cùng các luồng tài khoản, QR, phản ánh, quỹ/chứng từ, tiện ích và lịch sử nhập file.
2. Chạy công cụ chuyển vào database PostgreSQL mới. Đối chiếu thành công **1.756 dòng của 37 bảng nghiệp vụ**, bằng số dòng và SHA-256 nội dung. `schema_migrations` giữ lịch sử/checksum PostgreSQL riêng, không chép checksum MySQL sang.
3. Khởi động ứng dụng trên database vừa chuyển: **17 kiểm tra HTTP đạt**, gồm đăng nhập bằng mật khẩu BQL cũ, readiness, các danh sách/tổng quan/báo cáo và mở QR token cũ. Không in mật khẩu/token ra log.
4. Bài tích hợp tái lập trong repository tạo database ngẫu nhiên riêng, kiểm tra cả nguồn 018 và 019, ID/hash/ngày/JSON/QR, giữ khoảng trống AUTO_INCREMENT, từ chối đích có dữ liệu, chặn checksum nguồn sai, rollback lỗi chèn và phát hiện/rollback khi trigger đích âm thầm đổi dữ liệu.

Ảnh phản ánh nằm ngoài database được giữ đường dẫn, không tự copy tệp giữa hai thư mục clone. Khi chuyển trên máy khác, cần chép cả `backend/storage/` và các tệp local theo [hướng dẫn Windows](chuyen-postgresql-vscode.md).

## Tái chạy kiểm thử

Với `.env` PostgreSQL thử nghiệm đã cấu hình:

```powershell
npm.cmd test
npm.cmd run test:e2e
node --test scripts/*.test.js
npm.cmd run build
npm.cmd run test:https
```

`npm test` và E2E dùng riêng `chung_cu_test`; không chạy chúng đồng thời. Windows cần cài Chromium cho Playwright trước. Bài kiểm tra chuyển dữ liệu được bỏ qua mặc định; muốn bật, dùng **hai server thử nghiệm riêng**, đặt `DB_ENGINE=postgresql`, các biến `DB_*` trỏ PostgreSQL thử nghiệm, `POSTGRES_TRANSFER_TEST=1`, `MYSQL_TEST_PORT` và `MYSQL_TEST_PASSWORD` của tài khoản root trên MySQL thử nghiệm, rồi chạy:

```powershell
node --test scripts/postgresql-transfer.integration.test.js
```

Bài này tự tạo/xóa các database có hậu tố ngẫu nhiên `chung_cu_migration_test_*`; không cần database nguồn thật. Các test khác không cần cài MySQL. `test:https` cần OpenSSL.

## Giới hạn bằng chứng

Chưa chuyển database trên máy Windows của người dùng, chưa thử camera trên Android thật hoặc đo tải lớn/backup phục hồi. Không có công cụ đồng bộ ngược PostgreSQL→MySQL. Chỉ rollback vận hành về snapshot MySQL cũ trước khi PostgreSQL nhận ghi mới; sau đó cần đối soát dữ liệu phát sinh. Giá trị nguồn không biểu diễn được, xung đột collation hoặc checksum khác sẽ làm công cụ dừng/rollback, không bỏ qua dòng lỗi.

Nếu mất kết nối đúng lúc COMMIT, công cụ báo chưa xác nhận kết quả thay vì khẳng định rollback; cần kiểm tra đích trước khi chạy lại. Nếu đã commit nhưng không ghi được tệp báo cáo, công cụ báo rõ dữ liệu đã chuyển thành công. Build còn cảnh báo chunk lớn và chỉ thị `use client` của dependency như bản trước, không làm build thất bại.
