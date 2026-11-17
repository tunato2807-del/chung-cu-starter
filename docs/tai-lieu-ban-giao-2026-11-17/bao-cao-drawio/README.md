# 21 sơ đồ draw.io chỉnh sửa riêng

> **Bản mới theo mẫu:** [21 sơ đồ đã vẽ lại cùng Word/PDF/PNG/SVG](../../so-do-theo-mau-2026-11-17/README.md). Thư mục hiện tại lưu bộ trước khi áp dụng mẫu.

Các hình khớp số Hình 2.1–2.21 trong báo cáo Tô Hoàng Tuấn, MSSV 1250080221.
Nguồn là các sơ đồ của chính bản DOCX đã gửi, đối chiếu với DOT/JSON đi kèm báo cáo trong repository. Đây là các đối tượng vector gốc: chữ, hình, ô thuộc tính và đường nối đều sửa được. Không dùng một ảnh PNG đặt vào draw.io làm “file chỉnh sửa”.

## Cách mở và sửa nhanh nhất

1. Giải nén gói này.
2. Mở diagrams.net hoặc draw.io Desktop → File → Open From → Device.
3. Chọn file trong `drawio-rieng/` để mở một hình; hoặc `Tat-ca-21-so-do.drawio` để mở cả 21 tab.
4. Nhấp đúp để sửa chữ; kéo đường nối và điểm nối để chỉnh bố cục. Ô bảng/lớp và hình tác nhân có thể được nhóm. Nếu cần chỉnh từng thành phần, vào nhóm hoặc dùng Arrange → Ungroup.
5. File → Export as → PNG / SVG / PDF để chèn vào Word sau khi chỉnh. Giữ lại file .drawio để chỉnh tiếp.

## Nếu muốn copy–paste mã XML

1. Mở file `.xml.txt` tương ứng trong `xml-de-copy/` bằng Notepad/VS Code.
2. Ctrl+A → Ctrl+C để sao chép toàn bộ nội dung, từ `<mxGraphModel ...>` đến `</mxGraphModel>`.
3. Trong một trang vẽ trống của draw.io, vào Extras → Edit Diagram.
4. Dán mã XML, chọn thay thế trang vẽ hiện tại (Replace existing drawing), rồi xác nhận. Chỉ làm trên trang trống hoặc trang bạn muốn thay.
5. Các khối và đường nối xuất hiện dưới dạng đối tượng chỉnh sửa được. Dán mã XML trực tiếp lên canvas không phải cách nhập XML.

Cũng có thể mở file .drawio, chọn tab → Ctrl+A → Ctrl+C rồi dán sang một trang draw.io khác.

## Nội dung trong gói

- `drawio-rieng/`: 21 file, mỗi file một sơ đồ.
- `xml-de-copy/`: 21 bản XML dạng văn bản để copy–paste.
- `Tat-ca-21-so-do.drawio`: file tổng hợp 21 trang.
- `xem-truoc/`: 21 ảnh PNG để xem/chèn nhanh; đây không phải nguồn chỉnh sửa.
- `Xem-truoc-21-so-do.pdf`: xem nhanh cả bộ; khổ trang theo hình, không phải PDF A4 nộp báo cáo.
- `DOI-CHIEU-TRICH-DAN.md`: giải thích yêu cầu [n] và ánh xạ các nguồn trong bản Word bổ sung.
- `danh-muc-hinh.json`: số hình, tên file và số đối tượng gốc.

ERD là các phân hệ rút gọn, giữ tên/thuộc tính được chọn trong báo cáo; không phải ERD đầy đủ 31 bảng. Không dùng bản ERD 38 bảng cũ làm hiện trạng. Lớp là mô hình phân tích; «module» không có nghĩa mã JavaScript dùng lớp ORM. Bốn ảnh giao diện ở Chương 3 là ảnh chụp màn hình, nên không được dựng lại thành sơ đồ UML giả.

## Danh mục

| Hình | Nội dung | File riêng |
|---|---|---|
| 2.1 | Phân rã chức năng theo nhóm nghiệp vụ | `drawio-rieng/02-01-phan-ra-chuc-nang.drawio` |
| 2.2 | Use Case tổng thể | `drawio-rieng/02-02-use-case-tong-the.drawio` |
| 2.3 | Use Case phân rã Ban quản lý | `drawio-rieng/02-03-use-case-bql.drawio` |
| 2.4 | Use Case cư dân, người gửi công khai và kỹ thuật viên | `drawio-rieng/02-04-use-case-cu-dan.drawio` |
| 2.5 | Hoạt động tạo và xuất mã QR vị trí | `drawio-rieng/02-05-activity-qr.drawio` |
| 2.6 | Hoạt động quét QR và gửi phản ánh | `drawio-rieng/02-06-activity-gui.drawio` |
| 2.7 | Hoạt động phân công, xử lý và nghiệm thu | `drawio-rieng/02-07-activity-xu-ly.drawio` |
| 2.8 | Hoạt động lập, duyệt, gửi và xác nhận thu hóa đơn | `drawio-rieng/02-08-activity-hoa-don.drawio` |
| 2.9 | Tuần tự tạo và hiển thị QR | `drawio-rieng/02-09-sequence-qr.drawio` |
| 2.10 | Tuần tự mở QR và gửi phản ánh | `drawio-rieng/02-10-sequence-gui.drawio` |
| 2.11 | Tuần tự điều phối và chuyển trạng thái phản ánh | `drawio-rieng/02-11-sequence-xu-ly.drawio` |
| 2.12 | Tuần tự tra cứu hóa đơn và hiển thị VietQR | `drawio-rieng/02-12-sequence-vietqr.drawio` |
| 2.13 | Vòng đời phản ánh | `drawio-rieng/02-13-trang-thai-phan-anh.drawio` |
| 2.14 | Sơ đồ lớp phân tích các khái niệm trọng tâm | `drawio-rieng/02-14-lop-phan-tich.drawio` |
| 2.15 | ERD logic nhà ở, cư trú và phương tiện | `drawio-rieng/02-15-erd-cu-tru.drawio` |
| 2.16 | ERD logic QR, phản ánh và ảnh | `drawio-rieng/02-16-erd-phan-anh.drawio` |
| 2.17 | ERD logic phí, chỉ số, hóa đơn và thông báo | `drawio-rieng/02-17-erd-hoa-don.drawio` |
| 2.18 | ERD vật lý rút gọn của luồng phản ánh và ảnh | `drawio-rieng/02-18-erd-vat-ly-phan-anh.drawio` |
| 2.19 | ERD vật lý rút gọn của luồng hóa đơn | `drawio-rieng/02-19-erd-vat-ly-hoa-don.drawio` |
| 2.20 | Kiến trúc ba tầng và kho ảnh | `drawio-rieng/02-20-kien-truc.drawio` |
| 2.21 | Luồng dữ liệu từ QR đến theo dõi kết quả | `drawio-rieng/02-21-luong-du-lieu.drawio` |
