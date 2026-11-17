# Bộ sơ đồ hiện hành — một ERD hợp nhất

**Quản lý vận hành chung cư và tiếp nhận phản ánh · Tô Hoàng Tuấn — 1250080221**

Đã thay năm ERD cũ bằng **một ERD duy nhất**, đủ **31 bảng, 362 cột và 81 khóa ngoại** trên **một trang draw.io**. Toàn bộ liên kết giữa các nghiệp vụ vẫn nối trực tiếp. Hai bảng kỹ thuật không có FK cũng nằm trên cùng trang. Các sơ đồ tiếp tục dùng cách trình bày trong ảnh mẫu bạn gửi.

## Mở ERD đã gộp

- **[ERD hợp nhất — draw.io chỉnh sửa được](drawio/02-15-erd-hop-nhat.drawio)**
- **[ERD hợp nhất — PDF một trang, giữ vector](ERD-hop-nhat-31-bang.pdf)**
- [SVG phóng to / chèn Word](svg/02-15-erd-hop-nhat.svg) · [PNG xem trước](png/02-15-erd-hop-nhat.png) · [XML để copy vào draw.io](xml/02-15-erd-hop-nhat.xml.txt)
- [Đối chiếu đủ 31 bảng và 81 FK](DOI-CHIEU-KHOA-NGOAI.md) · [Từ điển 362 cột](TU-DIEN-362-COT.md)

ERD giữ ký pháp theo mẫu: thực thể chữ nhật, thuộc tính oval, PK gạch chân, quan hệ hình thoi. Mã R01–R81 trên hình thoi khớp mã ở cột FK và bảng đối chiếu. Quan hệ tự tham chiếu, FK ghép và 14 FK của bảng nhật ký được giữ đầy đủ.

## Tải cả bộ 17 sơ đồ

- **[draw.io tổng hợp — 17 trang, chỉ một trang ERD](Tat-ca-17-so-do-ERD-hop-nhat.drawio)**
- **[Tập hình Word — ERD đã gộp](Tap-hinh-17-so-do-ERD-hop-nhat.docx)**
- **[PDF 17 hình](Xem-truoc-17-so-do-ERD-hop-nhat.pdf)**
- **[ZIP trọn bộ](So-do-theo-mau-tron-bo.zip)** — nguồn draw.io/XML, PNG/SVG, Word/PDF, từ điển và đối chiếu FK.

GitHub có thể không preview `.drawio` hoặc `.docx`: mở file rồi chọn **Download raw file** để tải. Đây là tập hình để đưa vào báo cáo; bản báo cáo toàn văn cũ vẫn là tài liệu lịch sử cần cập nhật hình và số mục.

## Đổi số hình trong Word

| Hình cũ | Hình hiện hành | Cần làm trong Word |
|---|---|---|
| 2.1–2.14 | 2.1–2.14 | Giữ số và nội dung các sơ đồ này. |
| Năm ERD 2.15–2.19 | **2.15 — ERD hợp nhất** | Thay bằng một hình duy nhất; sửa các câu tham chiếu tới năm ERD cũ về Hình 2.15; bỏ bốn caption thừa. |
| 2.20 — Kiến trúc | 2.16 | Cập nhật caption và tham chiếu trong nội dung. |
| 2.21 — Luồng dữ liệu | 2.17 | Cập nhật caption và tham chiếu trong nội dung. |

Trong Word dùng **Update Field** cho caption/tham chiếu và cập nhật lại danh mục hình. Nếu caption được gõ tay, cần sửa các số theo bảng trên.

## Danh mục từng hình

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
| 2.15 | ERD hợp nhất toàn bộ 31 bảng và 81 khóa ngoại | [PNG](png/02-15-erd-hop-nhat.png) | [SVG](svg/02-15-erd-hop-nhat.svg) | [draw.io](drawio/02-15-erd-hop-nhat.drawio) | [XML](xml/02-15-erd-hop-nhat.xml.txt) |
| 2.16 | Kiến trúc ba tầng của hệ thống | [PNG](png/02-16-kien-truc.png) | [SVG](svg/02-16-kien-truc.svg) | [draw.io](drawio/02-16-kien-truc.drawio) | [XML](xml/02-16-kien-truc.xml.txt) |
| 2.17 | Luồng dữ liệu phản ánh từ QR đến nghiệm thu | [PNG](png/02-17-luong-du-lieu.png) | [SVG](svg/02-17-luong-du-lieu.svg) | [draw.io](drawio/02-17-luong-du-lieu.drawio) | [XML](xml/02-17-luong-du-lieu.xml.txt) |

## Xem trước ERD duy nhất

![ERD hợp nhất toàn bộ 31 bảng và 81 khóa ngoại](png/02-15-erd-hop-nhat.png)

## Mở, chỉnh sửa và chèn Word

1. Tải `.drawio` → diagrams.net / draw.io Desktop → **File → Open From → Device**. Chọn tab **Hình 2.15** nếu mở file tổng hợp. Có thể sửa từng ô, kéo nhóm thực thể/thuộc tính và chỉnh điểm nối.
2. Để copy XML: mở `.xml.txt` → **Raw** → copy toàn bộ `<mxGraphModel>...</mxGraphModel>` → **Extras → Edit Diagram** trong trang draw.io trống → dán thay trang đó.
3. Khi xuất PDF trong draw.io, chọn **Crop** hoặc **Fit to 1 × 1 page** để giữ một ERD trên một trang; không xuất dạng nhiều trang ghép.
4. Trong Word ưu tiên chèn SVG để phóng to vẫn rõ. ERD đủ 31 bảng và 362 thuộc tính là hình khổ lớn; tập hình dùng A3 để xem tổng quan và kèm SVG vector cùng PNG dự phòng. Có thể đặt ERD ở phụ lục khổ lớn; việc đặt ở phụ lục không làm tách sơ đồ.

## Nguồn và kiểm chứng

- Schema: [`database/thesis-mysql/001_thesis_schema.sql`](../../database/thesis-mysql/001_thesis_schema.sql). 31 bảng vật lý và 8 view lịch sử; view không được dựng thành bảng mới trên ERD.
- [Mô hình đối chiếu](nguon/mo-hinh-va-doi-chieu.json): tất cả bảng/cột/FK và ID các đối tượng gốc trong draw.io.
- [Kết quả kiểm tra đầy đủ FK](nguon/kiem-tra-erd-hop-nhat.json) · [Kiểm tra kết xuất bằng mxGraph](nguon/kiem-tra-ket-xuat.json) · [Kiểm tra Word/PDF](nguon/kiem-tra-tap-hinh.json).
- [Mã tái sinh sơ đồ](nguon/tao-so-do.py): Python 3, Pillow và Graphviz (`dot`). Chạy `python docs/so-do-theo-mau-2026-11-17/nguon/tao-so-do.py` từ repository để tái sinh draw.io/XML/SVG và mô hình, luôn chỉ một ERD. Bố cục tự động nằm trong `nguon/bo-cuc-erd.dot` và JSON tương ứng.

Các bộ cũ trong `docs/tai-lieu-ban-giao-2026-11-17/` và báo cáo toàn văn trước đây chỉ dùng đối chiếu lịch sử. Bộ hiện hành ở thư mục này đã bỏ năm ERD phân hệ cũ khỏi draw.io tổng hợp, Word, PDF, ZIP và danh mục tải.
