# ERD gọn — giữ thuộc tính oval và vai trò chính từng bảng

**Quản lý vận hành chung cư và tiếp nhận phản ánh · Tô Hoàng Tuấn — 1250080221**

Đã làm gọn ERD theo yêu cầu: **31 bảng trên một trang**, chọn **185/362 thuộc tính** gồm mọi cột PK/FK và các trường nghiệp vụ quan trọng. Mỗi bảng có một dòng giải thích vai trò. Giữ cách vẽ **thực thể chữ nhật, thuộc tính oval, PK gạch chân, quan hệ hình thoi** như mẫu bạn chọn. Thuộc tính nghiệp vụ được in đậm; FK kiểm soát dùng màu xám.

## Mở bản gọn

- **[draw.io chỉnh sửa được — một trang, có lớp bật/tắt](drawio/02-15-erd-hop-nhat.drawio)**
- **[PDF ERD một trang — xem/phóng to](ERD-hop-nhat-31-bang.pdf)**
- [PNG xem ngay](png/02-15-erd-hop-nhat.png) · [SVG chèn Word](svg/02-15-erd-hop-nhat.svg) · [XML để copy vào draw.io](xml/02-15-erd-hop-nhat.xml.txt)
- **[Vai trò và thuộc tính đã chọn cho từng bảng](VAI-TRO-VA-THUOC-TINH-CHINH.md)**

## Các quan hệ vẫn được giữ thế nào?

| Lớp trong cùng ERD | Số FK | Cách xem |
|---|---:|---|
| **01 Nghiệp vụ chính** | **39** | Hiện mặc định, dùng cho PNG/SVG/PDF/Word. |
| **02 FK người thao tác và nhật ký** | **42** | Trong draw.io chọn **View → Layers**, bật biểu tượng con mắt của lớp 02. |
| **Tổng trong file gốc** | **81** | Bật cả hai lớp để xem mọi FK của schema. |

42 FK ở lớp 02 gồm các liên kết người tạo/lập/duyệt/gửi và nhật ký. Chúng được ẩn trong bản xem chính để tập trung vào nghiệp vụ. **PNG/SVG/PDF/Word không phải hình hiển thị đầy đủ 81 FK**; [bảng đối chiếu](DOI-CHIEU-KHOA-NGOAI.md) ghi rõ lớp của từng FK. Không xóa ràng buộc trong mô hình hoặc sửa database.

**Không tách ERD:** cả 31 bảng nằm trên cùng một canvas; hai lớp chỉ điều khiển hiển thị đường nối. Các bảng kỹ thuật và nhật ký vẫn hiện trên trang, không dựng liên kết giả. FK ghép, tự tham chiếu và các vai trò khác nhau được giữ đúng trong file gốc.

## Tải cả bộ 17 sơ đồ

- **[Word tập hình — đã dùng ERD gọn](Tap-hinh-17-so-do-ERD-hop-nhat.docx)**
- **[draw.io tổng hợp 17 trang — chỉ một trang ERD](Tat-ca-17-so-do-ERD-hop-nhat.drawio)**
- [PDF 17 hình](Xem-truoc-17-so-do-ERD-hop-nhat.pdf) · [ZIP trọn bộ](So-do-theo-mau-tron-bo.zip)

GitHub có thể không preview DOCX/draw.io: mở file rồi chọn **Download raw file**. Đây là Word tập hợp hình để copy/chèn; báo cáo toàn văn cũ vẫn cần thay hình và cập nhật các câu mô tả tương ứng.

## Nội dung đã lược

Chỉ lược khỏi hình các thuộc tính không phải khóa và không cần giải thích nghiệp vụ chính, như phiên bản khóa đồng thời, dấu vân tay chống lặp, checksum dữ liệu, payload JSON, BLOB và phần lớn dấu thời gian kỹ thuật. [Từ điển đầy đủ](TU-DIEN-362-COT.md) vẫn liệt kê cả 362 cột. [Bảng chọn thuộc tính](VAI-TRO-VA-THUOC-TINH-CHINH.md) cho biết từng bảng giữ gì.

## Danh mục 17 sơ đồ

| Hình | Nội dung | PNG | SVG | draw.io | XML để copy |
|---|---|---|---|---|---|
| 2.1 | Phân rã chức năng theo nhóm nghiệp vụ | [PNG](png/02-01-phan-ra-chuc-nang.png) | [SVG](svg/02-01-phan-ra-chuc-nang.svg) | [draw.io](drawio/02-01-phan-ra-chuc-nang.drawio) | [XML](xml/02-01-phan-ra-chuc-nang.xml.txt) |
| 2.2 | Use Case tổng thể | [PNG](png/02-02-use-case-tong-the.png) | [SVG](svg/02-02-use-case-tong-the.svg) | [draw.io](drawio/02-02-use-case-tong-the.drawio) | [XML](xml/02-02-use-case-tong-the.xml.txt) |
| 2.3 | Use Case phân rã Ban quản lý | [PNG](png/02-03-use-case-bql.png) | [SVG](svg/02-03-use-case-bql.svg) | [draw.io](drawio/02-03-use-case-bql.drawio) | [XML](xml/02-03-use-case-bql.xml.txt) |
| 2.4 | Use Case cư dân, người gửi công khai và kỹ thuật viên | [PNG](png/02-04-use-case-cu-dan.png) | [SVG](svg/02-04-use-case-cu-dan.svg) | [draw.io](drawio/02-04-use-case-cu-dan.drawio) | [XML](xml/02-04-use-case-cu-dan.xml.txt) |
| 2.5 | Hoạt động tạo và xuất mã QR vị trí | [PNG](png/02-05-activity-qr.png) | [SVG](svg/02-05-activity-qr.svg) | [draw.io](drawio/02-05-activity-qr.drawio) | [XML](xml/02-05-activity-qr.xml.txt) |
| 2.6 | Hoạt động quét QR và gửi phản ánh | [PNG](png/02-06-activity-gui.png) | [SVG](svg/02-06-activity-gui.svg) | [draw.io](drawio/02-06-activity-gui.drawio) | [XML](xml/02-06-activity-gui.xml.txt) |
| 2.7 | Hoạt động phân công, xử lý và nghiệm thu | [PNG](png/02-07-activity-xu-ly.png) | [SVG](svg/02-07-activity-xu-ly.svg) | [draw.io](drawio/02-07-activity-xu-ly.drawio) | [XML](xml/02-07-activity-xu-ly.xml.txt) |
| 2.8 | Hoạt động lập, duyệt, gửi và xác nhận thu hóa đơn | [PNG](png/02-08-activity-hoa-don.png) | [SVG](svg/02-08-activity-hoa-don.svg) | [draw.io](drawio/02-08-activity-hoa-don.drawio) | [XML](xml/02-08-activity-hoa-don.xml.txt) |
| 2.9 | Tuần tự tạo và hiển thị QR | [PNG](png/02-09-sequence-qr.png) | [SVG](svg/02-09-sequence-qr.svg) | [draw.io](drawio/02-09-sequence-qr.drawio) | [XML](xml/02-09-sequence-qr.xml.txt) |
| 2.10 | Tuần tự mở QR và gửi phản ánh | [PNG](png/02-10-sequence-gui.png) | [SVG](svg/02-10-sequence-gui.svg) | [draw.io](drawio/02-10-sequence-gui.drawio) | [XML](xml/02-10-sequence-gui.xml.txt) |
| 2.11 | Tuần tự điều phối và chuyển trạng thái phản ánh | [PNG](png/02-11-sequence-xu-ly.png) | [SVG](svg/02-11-sequence-xu-ly.svg) | [draw.io](drawio/02-11-sequence-xu-ly.drawio) | [XML](xml/02-11-sequence-xu-ly.xml.txt) |
| 2.12 | Tuần tự tra cứu hóa đơn và hiển thị VietQR | [PNG](png/02-12-sequence-vietqr.png) | [SVG](svg/02-12-sequence-vietqr.svg) | [draw.io](drawio/02-12-sequence-vietqr.drawio) | [XML](xml/02-12-sequence-vietqr.xml.txt) |
| 2.13 | Vòng đời phản ánh | [PNG](png/02-13-trang-thai-phan-anh.png) | [SVG](svg/02-13-trang-thai-phan-anh.svg) | [draw.io](drawio/02-13-trang-thai-phan-anh.drawio) | [XML](xml/02-13-trang-thai-phan-anh.xml.txt) |
| 2.14 | Sơ đồ lớp phân tích các khái niệm trọng tâm | [PNG](png/02-14-lop-phan-tich.png) | [SVG](svg/02-14-lop-phan-tich.svg) | [draw.io](drawio/02-14-lop-phan-tich.drawio) | [XML](xml/02-14-lop-phan-tich.xml.txt) |
| 2.15 | ERD hợp nhất — thuộc tính và nghiệp vụ chính | [PNG](png/02-15-erd-hop-nhat.png) | [SVG](svg/02-15-erd-hop-nhat.svg) | [draw.io](drawio/02-15-erd-hop-nhat.drawio) | [XML](xml/02-15-erd-hop-nhat.xml.txt) |
| 2.16 | Kiến trúc ba tầng của hệ thống | [PNG](png/02-16-kien-truc.png) | [SVG](svg/02-16-kien-truc.svg) | [draw.io](drawio/02-16-kien-truc.drawio) | [XML](xml/02-16-kien-truc.xml.txt) |
| 2.17 | Luồng dữ liệu phản ánh từ QR đến nghiệm thu | [PNG](png/02-17-luong-du-lieu.png) | [SVG](svg/02-17-luong-du-lieu.svg) | [draw.io](drawio/02-17-luong-du-lieu.drawio) | [XML](xml/02-17-luong-du-lieu.xml.txt) |

## Xem trước

![ERD một trang với 185 thuộc tính chọn lọc, giữ oval, mặc định hiện 39 FK nghiệp vụ](png/02-15-erd-hop-nhat.png)

## Mở và chỉnh sửa

1. Tải `.drawio` → diagrams.net/draw.io Desktop → **File → Open From → Device**. Trong file tổng hợp chọn tab **Hình 2.15**.
2. Nhấp đúp để sửa chữ, kéo nhóm thực thể/thuộc tính và điểm nối. Thuộc tính và đường nối là đối tượng gốc, không phải ảnh đặt vào file draw.io.
3. Muốn hiện đủ FK: **View → Layers** → bật lớp **02 FK người thao tác và nhật ký**. Khi muốn xuất hình gọn, ẩn lớp đó trước khi export.
4. Muốn copy XML: mở `.xml.txt` → **Raw** → copy toàn bộ `<mxGraphModel>...</mxGraphModel>` → **Extras → Edit Diagram** trên trang draw.io trống → dán thay trang đó.
5. Khi xuất PDF, chọn **Crop** hoặc **Fit to 1 × 1 page**. Trong Word ưu tiên SVG; bản tập hình dùng A3 cho ERD và kèm SVG vector cùng PNG dự phòng.

## Sửa Word theo bản hiện hành

Thay năm ERD cũ (Hình 2.15–2.19) bằng **Hình 2.15 — ERD hợp nhất, thuộc tính và nghiệp vụ chính**. Đổi kiến trúc cũ 2.20 thành 2.16 và luồng dữ liệu cũ 2.21 thành 2.17; Hình 2.1–2.14 giữ nguyên. Cập nhật caption, câu tham chiếu và danh mục hình. Mô tả dưới ERD cần nêu: hình chọn 185 thuộc tính, chỉ hiển thị 39 quan hệ chính; 81 FK đầy đủ nằm trong file gốc/bảng đối chiếu.

## Nguồn và kiểm chứng

- Schema: [`database/thesis-mysql/001_thesis_schema.sql`](../../database/thesis-mysql/001_thesis_schema.sql), 31 bảng / 362 cột / 81 FK và 8 view lịch sử.
- [Mô hình đối chiếu](nguon/mo-hinh-va-doi-chieu.json) · [185 thuộc tính được chọn](nguon/lua-chon-thuoc-tinh.json) · [Đối chiếu 81 FK](DOI-CHIEU-KHOA-NGOAI.md).
- [Kiểm tra khóa và lựa chọn thuộc tính](nguon/kiem-tra-erd-hop-nhat.json) · [Mở và bật/tắt lớp bằng mxGraph](nguon/kiem-tra-ket-xuat.json) · [Kiểm tra Word/PDF](nguon/kiem-tra-tap-hinh.json).
- [Mã tái sinh](nguon/tao-so-do.py): Python 3, Pillow và Graphviz. Chạy `python docs/so-do-theo-mau-2026-11-17/nguon/tao-so-do.py` để tái sinh draw.io/XML/SVG; file lựa chọn thuộc tính phải nằm cùng thư mục với script.

Các bộ ERD cũ trong thư mục bàn giao trước và báo cáo toàn văn là bản lưu lịch sử. Bộ hiện hành chỉ có một ERD và giữ liên kết đầy đủ trong hai lớp của trang đó.
