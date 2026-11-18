# Báo cáo chuyên ngành viết lại từ đầu — Tô Hoàng Tuấn

Bản báo cáo đầy đủ theo **đề cương 1250080221_To_Hoang_Tuan.docx, hướng dẫn Word 2026–2027 và toàn bộ 16 trang hướng dẫn PDF** vừa được cung cấp. Đối chiếu ứng dụng hiện tại `cceb904`, không dùng nguyên văn quyển cũ. Bản PDF xem trước có **109 trang**, gồm 16 trang đầu không đánh số, 66 trang nội dung chính, 25 trang phụ lục và 2 trang tài liệu tham khảo.

## Tải và xem

- **[Word báo cáo mới — chỉnh sửa trực tiếp](Bao-cao-DACN_To-Hoang-Tuan_Viet-lai.docx)**
- **[PDF xem trước toàn bộ báo cáo](Ban-xem-truoc_Bao-cao-viet-lai.pdf)**
- **[ZIP Word, PDF, sơ đồ draw.io, SVG/PNG và hình giao diện](Bao-cao-moi-va-so-do-chinh-sua.zip)**
- [Đọc nội dung báo cáo ngay trên GitHub](Noi-dung-bao-cao.md)
- [Đối chiếu yêu cầu của cả ba tệp và cách xử lý điểm chưa thống nhất](DOI-CHIEU-YEU-CAU.md)
- [Bộ 17 sơ đồ hiện hành, mở riêng từng hình](../../so-do-theo-mau-2026-11-17/README.md)

Trên GitHub, mở `.docx` hoặc `.zip`, chọn **Download raw file**. Tệp Word mới là **quyển báo cáo toàn văn**, có các hình được đặt trong đúng mục, khác với tập hình Word của những lượt trước.

## Nội dung đã có

Đủ thứ tự các phần theo hướng dẫn: hai bìa, lời cảm ơn/cam đoan, hai trang nhận xét, lịch 15 tuần, tóm tắt một trang, mục lục và hai danh mục động, viết tắt, Mở đầu, ba chương, kết luận, phụ lục, tài liệu tham khảo.

Chương 1 có công việc liên quan, so sánh phương án, cơ sở lý thuyết và công nghệ. Chương 2 có yêu cầu chức năng/phi chức năng; 5 đặc tả Use Case; các sơ đồ chức năng, use case, activity, sequence, trạng thái, lớp, ERD, kiến trúc và luồng dữ liệu; thuật toán QR, ảnh, giao dịch và tiền. Chương 3 có môi trường, cài đặt, API/mã tiêu biểu, 9 ảnh giao diện hiện tại, ma trận 26 ca kiểm thử đại diện và đánh giá mục tiêu. Phụ lục 1 hướng dẫn sử dụng. Phụ lục 2 tra cứu đúng **18 bảng, 218 thuộc tính và 46 khóa ngoại** của Hình 2.15. [Từ điển đầy đủ 31 bảng của CSDL triển khai](../../so-do-theo-mau-2026-11-17/TU-DIEN-362-COT.md).

Có **26 hình, 39 bảng biểu và 11 tài liệu tham khảo**. Các số `[n]` trong nội dung liên kết bằng field REF tới mục nguồn; cả 11 tài liệu đều có trích dẫn. Các danh mục sử dụng TOC, số trang dùng PAGEREF, chú thích có SEQ. Các tham chiếu đã được đối chiếu theo bản PDF trước bàn giao.

## ERD và hình có thể sửa

Giữ đúng ERD đã thống nhất: **18 bảng trọng tâm, đủ 218 thuộc tính và 46 khóa ngoại qua 41 hình thoi trên một trang**, oval một cột; khóa chính gạch liền, khóa ngoại gạch đứt; không in đậm thuộc tính, không nhãn FK/R trong oval. Database đầy đủ vẫn là **31 bảng/362 cột/81 FK và 8 view**, không bị sửa hoặc cắt bảng.

Hình 2.15 trong quyển A4 là hình tổng quan thu nhỏ, cần mở bản vector để đọc các thuộc tính. [ERD PDF vector](../../so-do-theo-mau-2026-11-17/ERD-18-bang-bo-cuc-ro.pdf) · [ERD draw.io](../../so-do-theo-mau-2026-11-17/drawio/02-15-erd-hop-nhat.drawio) · [draw.io tổng hợp 17 trang](../../so-do-theo-mau-2026-11-17/Tat-ca-17-so-do-ERD-hop-nhat.drawio). Tệp ZIP của báo cáo mới chứa cả bản gốc để phóng to/chỉnh sửa; không tách ERD thành các phân hệ.

Word dùng ảnh PNG độ phân giải cao, cắt phần chú thích đã nằm sẵn trong ảnh bằng thuộc tính crop của Word để không lặp hai chú thích. Bản vẽ draw.io/SVG/PDF gốc được giữ nguyên; không sửa nội dung sơ đồ.

## Kết quả kiểm chứng và phần cần bổ sung thực tế

| Kiểm chứng ngày 17/11/2026 | Kết quả |
|---|---|
| `npm run build` | Thành công; vẫn ghi cảnh báo chunk lớn hơn 500 kB |
| `npm test` | 227/227 đạt trên `chung_cu_test` |
| `npm run test:ui` | 48/48 đạt, API giả lập |
| `npm run test:e2e` | 95/96 đạt; một lần tải Excel quá 10 giây |
| Chạy lại riêng `report-exports.spec.js` | 2/2 đạt ở 1440 px và 375 px; giữ log lần đầu |
| Phân trang Word/PDF | Không mất chú thích, không trang trắng nội dung, không tràn lề, số trang đúng; cache danh mục ổn định |

[Log và kết quả kiểm tra](kiem-chung/) không chứng minh vận hành thực tế ở chung cư. Báo cáo **không bịa số đo camera Android/Chrome/Edge/Cốc Cốc, cấu hình máy cá nhân, khảo sát sản phẩm thương mại, mockup Figma hay nghiệm thu cư dân**. Các mục chưa có bằng chứng được ghi rõ. Ảnh dùng fixture hoặc dữ liệu kiểm thử, không chứa hồ sơ cư dân thật.

Chủ báo cáo cần kiểm tra phạm vi đóng góp, lời cảm ơn/cam đoan trước khi ký; GVHD/phản biện ghi nhận xét và ký thật; lịch hiện là lịch dự kiến từ đề cương. Tháng/năm nộp trên bìa để trống như lựa chọn trước. Bảng QR thiết bị cần điền sau khi đo thật, không thay “Chưa đo” bằng số giả.

Word yêu cầu **Times New Roman 13, tiêu đề 16, A4, lề trái 3 cm và các lề còn lại 2 cm, đoạn văn giãn 1,5 dòng**. Bìa theo cỡ riêng của mẫu; header thu nhỏ để đủ tên đề tài và GVHD. PDF Linux dùng Liberation Serif khi máy không có Times New Roman. Trước khi in, mở Word trên máy có Times New Roman, cập nhật toàn bộ trường/mục lục rồi rà lại phân trang; số trang có thể thay đổi. Bìa chính in trên giấy cứng màu xanh theo hướng dẫn.

## Tái tạo trong repository

Cần Python với `python-docx`, `Pillow`, `PyMuPDF`, và LibreOffice (`soffice`). Chạy từ gốc repository:

```bash
python docs/bao-cao/bao-cao-viet-lai-2026-11-17/nguon/viet-noi-dung.py
python docs/bao-cao/bao-cao-viet-lai-2026-11-17/nguon/ket-xuat.py
```

Các lệnh tạo lại Word/PDF từ nguồn đã lưu, không chạy ứng dụng, không đọc `.env` hoặc thay database. Nội dung sửa trực tiếp trong Word không tự ghi ngược về nguồn; giữ bản sao trước khi tái tạo. `nguon/chup-bao-cao-moi.mjs` chụp 4 màn hình với fixture, không cần MySQL. `nguon/kich-ban-chup-workflow.spec.js.txt` là bản lưu kịch bản chụp trong thư mục `e2e` của lần kiểm chứng, không phải test mới đã thêm vào ứng dụng.
