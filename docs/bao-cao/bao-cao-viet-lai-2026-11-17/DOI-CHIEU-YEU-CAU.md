# Đối chiếu ba tệp đầu vào và cách áp dụng

Bản báo cáo mới được viết lại từ nội dung đề cương, không ghép lại văn bản quyển cũ. Hình hiện hành và mô tả schema được tái sử dụng vì đã được yêu cầu chỉnh ở các lượt trước. Nguồn phần mềm là commit `cceb904`; các commit sau đó chỉ thay tài liệu.

Đã đọc toàn bộ nội dung đề cương Word, hướng dẫn Word (cả bảng, đầu/cuối trang, chú thích) và 16 trang PDF. Đã xem bản kết xuất các tệp Word và toàn bộ slide PDF; logo bìa lấy từ chính hướng dẫn được cung cấp. `kiem-chung/dau-vao.json` lưu tên, SHA-256 và phạm vi trích xuất của từng tệp.

| Nội dung | Vị trí nguồn | Cách áp dụng |
|---|---|---|
| Thông tin sinh viên, đề tài, GVHD | Đề cương P44–54 | Tô Hoàng Tuấn, 1250080221, 12_ĐH_CNPM3, khóa 2023–2027; ThS. Đặng Đức Trung |
| Thứ tự 19 phần | Word P9–32; PDF trang 2 | Hai bìa, cảm ơn, cam đoan, hai nhận xét, lịch, tóm tắt, mục lục, hai danh mục, viết tắt, Mở đầu, ba chương, kết luận, phụ lục, tài liệu tham khảo |
| Khổ, lề, font, giãn dòng | Word P48–54 | A4; trên/dưới/phải 2 cm, trái 3 cm; Times New Roman 13; đoạn văn 1,5 dòng; tiêu đề 16 |
| Tiêu đề có ví dụ size 14 hoặc 13 | Word P199–200, P483, P493 | Chọn quy định chung P48 (tiêu đề 16). Bìa theo chỉ dẫn riêng 14/16/18–30. Không dùng font/căn lề vô tình có sẵn trong file mẫu |
| Số trang từ Mở đầu hay chương 1 | Word P34, P56 so với P489 | Chọn quy định chính P34/P56: Mở đầu là trang 1; phần trước không đánh số; số góc phải dưới |
| Header/footer | Word P53–54 | Header tên đề tài bên trái và GVHD bên phải; footer tên sinh viên trái, PAGE phải. Header thu nhỏ để đủ hai phần, nội dung chính vẫn 13 |
| Màu và trang trí | Word P41–43; PDF trang 3 | Chữ đen; logo/hình có màu; bìa để in trên giấy cứng xanh, không tô toàn bộ trang điện tử xanh; không chép chữ hướng dẫn hoặc ví dụ tên sinh viên lên bìa |
| Thời điểm ghi trên bìa | PDF trang 3 ví dụ tháng 12/2025; Word ví dụ 2026; đề cương để trống tháng | Giữ trống tháng/năm theo lựa chọn trước của người dùng, không tự lấy năm ví dụ làm ngày nộp. Mốc thực hiện trong đề cương là 24/08–04/12/2026 |
| Lịch làm việc | Đề cương bảng P198; PDF trang 7 | Đủ 15 tuần, ghi là lịch dự kiến; nhận xét/chữ ký để GVHD ghi, không giả xác nhận đã hoàn tất |
| Tóm tắt | Word P22–28; PDF trang 8 | Không quá một trang A4; nêu bài toán, mục tiêu, phương pháp, công nghệ, kết quả, giới hạn |
| Mở đầu | Word P56–66; PDF trang 10 | Viết các đoạn văn, có phạm vi, phương pháp và bố cục, khoảng 1–2 trang |
| Chương 1 | Word P67–72; PDF trang 11; đề cương 1.1–1.2 | Có công việc/dự án liên quan, so sánh phương án, khác biệt, lý thuyết và công nghệ |
| CyHome / Building Care | Đề cương P129 | Ghi là ví dụ từ đề cương; chưa có tài liệu chính thức truy cập được nên không gán tính năng hay chấm điểm sản phẩm. Dùng README ERPNext chính thức để tham khảo dự án liên quan; không gọi là khảo sát dùng thử |
| Chương 2 | Word P73–78; PDF trang 12; đề cương 2.1–2.7 | Đủ yêu cầu, phân rã, use case/5 đặc tả, 4 activity, 4 sequence, trạng thái, lớp, ERD, từ điển, kiến trúc/luồng, lý do và thuật toán, UI/UX |
| Mô hình dữ liệu | Đề cương 2.4 và yêu cầu người dùng | Hình 2.15 và Phụ lục 2 cùng mô tả 18 bảng, 218 thuộc tính và 46 khóa ngoại. Từ điển kỹ thuật đi kèm mô tả đủ 31 bảng, 362 cột và 81 khóa ngoại của CSDL triển khai. |
| Chương 3 | Word P79–82; PDF trang 13; đề cương 3.1–3.4 | Môi trường thật, cài đặt, API/mã tiêu biểu, hình hiện thực, test có log, đánh giá và hạn chế |
| Khác biệt công nghệ | Đề cương P75, P179 và package-lock.json | Viết CSS riêng, jose, Node.js 24 như hiện thực, không tuyên bố đã dùng Tailwind/Bootstrap/jsonwebtoken |
| Figma / Postman | Đề cương 2.7, 3.1 | Chưa có tệp Figma/collection Postman nên không gán ảnh thực thi là mockup hoặc nói đã dùng công cụ mà không có bằng chứng |
| QR đa thiết bị | Đề cương P109, P191 | Không bịa máy, thời gian/tỷ lệ; có bảng “Chưa đo” và phương pháp thực nghiệm đề xuất |
| Tài liệu tham khảo | Word P39, P95–101, P548–550; PDF trang 16 | 11 nguồn chính thức đã tải và đọc phần liên quan; sắp theo ABC tác giả tổ chức, đánh [n], có trích dẫn trong cả ba chương. Không chép danh sách sách trong đề cương nếu chưa đọc/kiểm chứng |
| Trường trích dẫn Word | Word P119 gợi ý References/IEEE | Số [n] dùng field REF liên kết bookmark mục tài liệu, cập nhật được. Không tuyên bố đã tạo cơ sở dữ liệu citation manager của Word. Danh mục giữ thứ tự ABC như quy định chính |
| Mục lục và danh mục động | Word P355, P403–433; PDF trang 9 | Ba field TOC, bookmark, PAGEREF; caption có SEQ. Cache số trang được kết xuất và đối chiếu PDF trước bàn giao |
| Phụ lục | Word P92, P537–550 và PDF trang 15 | Sau kết luận và trước tài liệu tham khảo. Phụ lục 1 hướng dẫn sử dụng. Phụ lục 2 tra cứu cấu trúc đúng theo 18 bảng trong Hình 2.15. |
| Nhận xét và chữ ký | Word P13–21; PDF trang 4–7 | Giữ ô nhận xét/chữ ký thật để người có trách nhiệm điền; không giả nhận xét, điểm hoặc chữ ký |

Các đoạn quy định trong tài liệu được dùng làm yêu cầu trình bày theo yêu cầu của người dùng. Những dòng “cơ quan cần liên hệ” trong đề cương là nội dung tham khảo, không phải ủy quyền liên hệ hoặc gửi tin nhắn.
