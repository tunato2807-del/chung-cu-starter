# Hồ sơ phân tích thiết kế và nghiệm thu

Bộ tài liệu bổ sung cho đề cương `1250080221_To_Hoang_Tuan.docx` của Tô Hoàng Tuấn, đối chiếu mã nguồn ngày **21/10/2026**, schema **018_equipment_qr.sql**. Tài liệu tham chiếu là yêu cầu để đánh giá; không tự chứng minh ứng dụng đã chạy trên máy Windows hay điện thoại của người dùng.

Các nghiệp vụ chính đã có. Phần làm tiếp lần này là hoàn thiện hồ sơ chương 2 và chuẩn bị nghiệm thu chương 3, thay vì thêm phân hệ không có trong phạm vi đề tài.

| Mục đề cương | Tài liệu dùng cho báo cáo |
|---|---|
| 2.1 Phân rã chức năng; 2.5 kiến trúc và luồng dữ liệu | [Kiến trúc, chức năng, lớp và ERD logic](kien-truc-va-mo-hinh.md) |
| 2.2 Use Case tổng thể, BQL/cư dân, 5 đặc tả | [Use Case và đặc tả](use-case.md) |
| 2.3 Bốn Activity và bốn Sequence | [Quy trình và trình tự](quy-trinh.md) |
| 2.4 Class Diagram, ERD logic | [Mô hình phân tích](kien-truc-va-mo-hinh.md) |
| 2.4 ERD vật lý và từ điển toàn bộ bảng | [ERD theo phân hệ](erd-phan-he.md), [ERD toàn bộ](erd-vat-ly.mmd), [từ điển dữ liệu](tu-dien-du-lieu.md) |
| 3.3 Minh chứng demo; 3.4 Test Case và thực nghiệm | [Ma trận nghiệm thu và kế hoạch chụp hình](nghiem-thu.md) |
| Cập nhật bản Windows không bị thiếu file | [Hướng dẫn VS Code với code từng file](../cap-nhat-nghiem-thu-vscode.md) |

Sơ đồ Mermaid hiển thị ngay trên GitHub trong các tệp Markdown. Trong VS Code, dùng trình xem Markdown hỗ trợ Mermaid hoặc mở mã sơ đồ trong công cụ Mermaid tương thích. Sơ đồ Use Case dùng hình ellipse và actor qua `flowchart` để mô phỏng ký pháp, **không phải cú pháp UML Use Case nguyên bản**. Nếu GVHD yêu cầu chuẩn UML chặt chẽ, dùng đặc tả này để dựng lại trong StarUML/draw.io. Class Diagram là mô hình phân tích; dự án thực thi bằng hàm/module JavaScript, không dùng ORM entity classes.

Đưa hình vào Word theo từng phân hệ, kèm chú thích “Nguồn: thiết kế theo mã nguồn dự án, schema 018”. Không thu nhỏ toàn bộ ERD 38 bảng vào một trang. Ưu tiên ERD logic ở nội dung chính và từ điển/ERD vật lý ở phụ lục.

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
