# Hồ sơ phân tích thiết kế và nghiệm thu

> **Bộ sơ đồ hiện hành:** [17 hình cùng Word/PDF và draw.io — ERD đã hợp nhất](../so-do-theo-mau-2026-11-17/README.md). Chỉ một ERD, đủ 31 bảng / 362 cột / 81 FK; thực thể chữ nhật, thuộc tính oval và quan hệ hình thoi theo mẫu.

> **Bộ tài liệu bàn giao 17/11/2026:** [Word báo cáo, hướng dẫn sửa theo giao diện cửa sổ và hình minh họa](../tai-lieu-ban-giao-2026-11-17/README.md). Các ERD phân hệ trong bộ cũ đã được thay bằng ERD hợp nhất ở liên kết trên.

> **Quyển báo cáo mới theo hướng dẫn khoa/GVHD:** [Word, PDF xem trước và hướng dẫn hoàn thiện](quyen-bao-cao-2026/README.md). Đối chiếu mã nguồn `56ebfe8`, dùng schema **31 bảng + 8 view**, có 25 hình và 32 ca nghiệm thu. Những hình 38 bảng bên dưới thuộc hồ sơ lịch sử, không thay hiện trạng trong quyển mới.

> **CSDL hiện tại (05/11/2026):** [MySQL31 bảng thật, 8 view, giữ đủ nghiệp vụ và18 bảng trọng tâm](../csdl-do-an/README.md). Các hình/kiểm tra schema38 bảng ở bản cũ là lịch sử; ERD vật lý và từ điển đã sinh lại theo baseline mới.

Bộ tài liệu bổ sung cho đề cương `1250080221_To_Hoang_Tuan.docx` của Tô Hoàng Tuấn, đối chiếu mã nguồn ngày **21/10/2026**, schema **018_equipment_qr.sql**. Tài liệu tham chiếu là yêu cầu để đánh giá; không tự chứng minh ứng dụng đã chạy trên máy Windows hay điện thoại của người dùng.

Các nghiệp vụ chính đã có. Phần làm tiếp lần này là hoàn thiện hồ sơ chương 2 và chuẩn bị nghiệm thu chương 3, thay vì thêm phân hệ không có trong phạm vi đề tài.

**ERD dùng cho Word:** [một ERD hợp nhất toàn bộ 31 bảng](../so-do-theo-mau-2026-11-17/README.md), giữ đủ liên kết PK/FK giữa các nghiệp vụ; không tách thành các ERD phân hệ. Bộ rút gọn 38 bảng trước đây chỉ lưu để đối chiếu lịch sử.

| Mục đề cương | Tài liệu dùng cho báo cáo |
|---|---|
| 2.1 Phân rã chức năng; 2.5 kiến trúc và luồng dữ liệu | [Kiến trúc, chức năng, lớp và ERD logic](kien-truc-va-mo-hinh.md) |
| 2.2 Use Case tổng thể, BQL/cư dân, 5 đặc tả | [Use Case và đặc tả](use-case.md) |
| 2.3 Bốn Activity và bốn Sequence | [Quy trình và trình tự](quy-trinh.md) |
| 2.4 Class Diagram, ERD logic | [Mô hình phân tích](kien-truc-va-mo-hinh.md) |
| 2.4 ERD vật lý và từ điển toàn bộ bảng | [ERD hợp nhất một trang](../so-do-theo-mau-2026-11-17/drawio/02-15-erd-hop-nhat.drawio), [đối chiếu 81 FK](../so-do-theo-mau-2026-11-17/DOI-CHIEU-KHOA-NGOAI.md), [từ điển 362 cột](../so-do-theo-mau-2026-11-17/TU-DIEN-362-COT.md) |
| 3.3 Minh chứng demo; 3.4 Test Case và thực nghiệm | [Ma trận nghiệm thu và kế hoạch chụp hình](nghiem-thu.md) |
| Cập nhật bản Windows không bị thiếu file | [Hướng dẫn VS Code với code từng file](../cap-nhat-nghiem-thu-vscode.md) |

Sơ đồ Mermaid hiển thị ngay trên GitHub trong các tệp Markdown. Trong VS Code, dùng trình xem Markdown hỗ trợ Mermaid hoặc mở mã sơ đồ trong công cụ Mermaid tương thích. Sơ đồ Use Case dùng hình ellipse và actor qua `flowchart` để mô phỏng ký pháp, **không phải cú pháp UML Use Case nguyên bản**. Nếu GVHD yêu cầu chuẩn UML chặt chẽ, dùng đặc tả này để dựng lại trong StarUML/draw.io. Class Diagram là mô hình phân tích; dự án thực thi bằng hàm/module JavaScript, không dùng ORM entity classes.

Trong Word thay năm ERD cũ (2.15–2.19) bằng **Hình 2.15 — ERD hợp nhất**, đổi kiến trúc 2.20 thành 2.16 và luồng dữ liệu 2.21 thành 2.17. ERD là một hình khổ lớn; có thể đặt nguyên hình ở phụ lục, dùng SVG/PDF vector để phóng to. Chú thích nguồn: `database/thesis-mysql/001_thesis_schema.sql`, 31 bảng, 81 FK.

Để tái sinh **ba tệp vật lý** sau khi schema đã được migrate đầy đủ, chạy tại thư mục gốc:

```powershell
node --env-file-if-exists=.env scripts/export-schema.js
```

Lệnh dùng cấu hình database hiện có, kiểm tra tên/checksum migration rồi đọc `information_schema` và `schema_migrations`; không đọc hàng cư dân/hóa đơn, không seed/migrate hay sửa dữ liệu. Chỉ ghi đè `tu-dien-du-lieu.md`, `erd-vat-ly.mmd`, `erd-phan-he.md`. Không chạy migration đồng thời khi xuất. Checksum khớp không chứng minh không có ai đã sửa DDL thủ công ngoài runner; cần giữ quy trình quản lý schema.

Để kiểm tra bộ file trên máy trước khi khởi động:

```powershell
node scripts/check-local.js
# Chỉ khi backend đã chạy ở cổng 3000:
node scripts/check-local.js --api http://127.0.0.1:3000
```

Không có dependency hoặc migration mới. Lệnh kiểm tra không thay thế build/kiểm thử nghiệp vụ. Figma, hình chụp demo, kết quả Android/iOS và số đo camera vẫn cần người dùng thực hiện; không ghi “đã đạt” khi chưa có bằng chứng.
