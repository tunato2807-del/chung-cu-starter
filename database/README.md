# CSDL MySQL cho đồ án chuyên ngành

Schema hiện tại có **31 bảng thật / 362 cột / 81 FK**, cùng8 view lịch sử. Hỗ trợ MySQL 8.0.21+ và 8.4; Docker mặc định8.4. [Thiết kế,18 bảng trọng tâm và ma trận Word](../docs/csdl-do-an/README.md) · [hướng dẫn Windows](../docs/csdl-do-an-mysql.md).

- `thesis-mysql/001_thesis_schema.sql`: baseline hiện tại, dùng trên database mới. Giữ 24 bảng nghiệp vụ,6 bảng kỹ thuật; gom 8 bảng nhật ký cũ thành 1 bảng có FK/CHECK/JSON Schema và 8 view theo phân hệ.
- `migrations/001…019`: bản MySQL 38 bảng trước đây, giữ nguyên byte/checksum để kiểm tra/chuyển nguồn 018 hoặc019. Backend không áp dụng các file này lên schema mới.
- Bộ PostgreSQL được lưu trong nhánh/lịch sử cũ, không phải runtime hiện tại.

Runner `backend/scripts/migrate.js` có GET_LOCK và checksum, từ chối database cũ/dở dang thay vì ghi đè. MySQL DDL không rollback toàn bộ: nếu lỗi khởi tạo, giữ database đích dở dang để kiểm tra và tạo một đích mới. Dữ liệu nguồn không bị sửa. Readiness kiểm tra `001_thesis_schema.sql`; không giả ghi19 migration cũ để làm API sẵn sàng.

Tạo máy mới: init:local → db:up → db:migrate → db:seed. Máy có dữ liệu: configure-thesis-mysql → copy-thesis-data vào DB khác → kiểm tra → đổi cấu hình backend. Không dùng seed để thay dữ liệu hiện tại.

API giữ ID nghiệp vụ, tài khoản/alias SĐT chủ hộ, hash mật khẩu, QR token, snapshot tiền/ngân hàng, lịch sử và quyền riêng tư sau bàn giao. Chuyển dữ liệu cũ đối chiếu đủ 37 tập dữ liệu qua bảng/view mới; chuẩn bị AUTO_INCREMENT trước transaction, chép dữ liệu trong transaction, kiểm lại mọi FK trước commit và rollback khi lỗi. Nguồn chỉ đọc và phải dừng ghi trong lúc cutover. Báo cáo đối chiếu local không chứa mật khẩu/hàng dữ liệu.

Nhật ký chung không thay thế lịch sử cư trú: `lich_su_cu_tru` vẫn là bảng quan hệ cư dân–căn theo thời gian, được xe, phí và quyền sử dụng. Tiền giữ DECIMAL/snapshot; ảnh/chứng từ giữ quyền theo API. Các phần bảo trì, tiện ích, quỹ, nhắc phí, báo cáo, nhập Excel/xuất Excel-PDF và dashboard đều được giữ.

[ERD vật lý](../docs/bao-cao/erd-phan-he.md) và [từ điển](../docs/bao-cao/tu-dien-du-lieu.md) sinh từ metadata MySQL thật bằng `scripts/export-schema.js`. Các view không tính thành bảng/cột vật lý. `scripts/build-thesis-schema.js` là công cụ sinh baseline từ metadata của bản cũ trong môi trường phát triển; không chạy lại để ghi đè migration đã áp dụng.
