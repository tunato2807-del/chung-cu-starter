# Quyển báo cáo đồ án chuyên ngành

**Xây dựng hệ thống quản lý vận hành chung cư và tiếp nhận phản ánh cư dân**
Tô Hoàng Tuấn — MSSV 1250080221 — lớp 12_ĐH_CNPM3 — khóa 2023–2027.
GVHD theo đề cương: **ThS. Đặng Đức Trung**.

Đây là **bản thảo đầy đủ để sinh viên và GVHD rà soát**, được viết theo hai hướng dẫn mới cung cấp và đối chiếu mã nguồn `56ebfe8`, nhánh `codex/thesis-mysql-database`. Tháng/năm nộp để trống theo yêu cầu; không cần trả lời lại câu hỏi thời gian.

## Mở báo cáo

- [Bản Word chỉnh sửa được](Bao-cao-DACN_To-Hoang-Tuan_1250080221.docx)
- [PDF xem trước](Ban-xem-truoc_Bao-cao-DACN.pdf)
- [Đối chiếu yêu cầu Khoa/GVHD và cách xử lý chỗ khác nhau](DOI-CHIEU-HUONG-DAN.md)
- [Nội dung Markdown đầy đủ, gồm từ điển và kịch bản](noi-dung-day-du.md)
- [Nguồn nội dung chính để sửa/tái tạo](noi-dung.md)
- [Metadata và các mục còn cần hoàn thiện](kiem-chung/tai-lieu.json)

Trong Terminal VS Code của checkout cùng nhánh:

```powershell
git pull --ff-only origin codex/thesis-mysql-database
Start-Process .\docs\bao-cao\quyen-bao-cao-2026\Bao-cao-DACN_To-Hoang-Tuan_1250080221.docx
```

Không cần chạy Python hoặc cài lại ứng dụng để mở/chỉnh sửa Word. Khi tải qua GitHub, mở tệp rồi chọn **Download raw file** nếu trang không hỗ trợ xem DOCX.

## Nội dung đã có

- Bìa/bìa lót, lời cảm ơn, lời cam đoan dự thảo, hai trang nhận xét để trống, lịch dự kiến, tóm tắt một trang, mục lục và danh mục hình/bảng động, danh mục viết tắt.
- Mở đầu; ba chương đúng bố cục khoa/GVHD; kết luận và hướng phát triển; phụ lục; 14 tài liệu tham khảo.
- **25 hình**: 21 sơ đồ tự dựng (phân rã, Use Case, 4 Activity, 4 Sequence, trạng thái, lớp phân tích, ERD logic/vật lý, kiến trúc và luồng dữ liệu) và 4 ảnh chụp giao diện hiện tại.
- Năm đặc tả Use Case cốt lõi; phân tích chống gửi lặp, ảnh theo lượt, bàn giao chủ hộ, số xe theo loại, tính điện bậc thang, snapshot và giao dịch theo lô.
- Từ điển đủ **31 bảng vật lý, 362 cột và 81 FK**; tách **8 view** lịch sử. Không sử dụng thiết kế 38 bảng cũ làm hiện trạng.
- **32 kịch bản nghiệm thu**, có dữ liệu/thao tác, kết quả mong đợi và ô kết quả thực tế chưa tự điền Pass.
- Hướng dẫn cài mới/chạy Windows, HTTPS và điện thoại dựa theo các công cụ hiện có.

Số trang kiểm tra cụ thể nằm ở [phan-trang.json](kiem-chung/phan-trang.json). Trang có thể thay đổi khi Word trên Windows dùng Times New Roman thay cho phông tương đương của bản render Linux.

## Trước khi in hoặc nộp

1. Mở Word bằng Microsoft Word trên máy nộp; kiểm tra thông tin đề tài/lớp/GVHD theo đề cương. Tháng/năm đang để dấu chấm theo yêu cầu.
2. Nhấn **Ctrl+A → F9**, chọn **Update entire table/Cập nhật toàn bộ** nếu được hỏi. Mục lục và hai danh mục dùng trường Word thật; khi thêm hình/bảng, giữ đúng style `FigureCaption`/`TableCaption` và kiểm tra lại số thứ tự.
3. Rà soát lời cảm ơn, cam đoan, đóng góp cá nhân, thư viện và công cụ hỗ trợ; chỉ ký khi đã kiểm tra. Nhận xét, kết luận và chữ ký của GVHD/phản biện do giảng viên ghi.
4. Đối chiếu lịch làm việc với công việc thực tế; điền cấu hình máy, hệ điều hành và phiên bản trình duyệt nghiệm thu.
5. Bổ sung hình hoặc liên kết Figma nếu GVHD vẫn yêu cầu, ảnh chạy luồng nghiệp vụ thật, kết quả 32 ca thử và phép đo QR/camera trên thiết bị thật.
6. Rà soát bản/metadata và ngày truy cập của tài liệu tham khảo khi chốt. Tám tài liệu dự án đã được đọc qua nguồn chính thức GitHub, có URL/hash trong [nguon-tham-khao.json](kiem-chung/nguon-tham-khao.json); các tiêu chuẩn/manual tham chiếu không được ghi giả là đã truy cập web trong lượt này. Danh mục [n] được biên soạn trong nội dung; chưa tự nhận đã nhập vào Word Source Manager.
7. Xuất PDF cuối từ Word sau khi cập nhật trường. Bìa cứng xanh, in một mặt, đóng đinh bấm/bọc gáy theo hướng dẫn; không đóng lò xo.

**PDF kèm theo là bản xem trước**, kết xuất trong Linux với Liberation Serif vì môi trường chưa có Times New Roman. **DOCX đã đặt Times New Roman 13, giãn dòng 1,5, A4 và lề 2/2/3/2 cm.** Cần xuất bản PDF nộp cuối trên máy có đúng phông.

## Phạm vi bằng chứng

Ảnh giao diện dùng fixture API, không đọc tài khoản hay database thật. Ảnh đăng nhập chỉ chụp biểu mẫu, không sao chép ảnh trang trí bên thứ ba. Chúng minh họa màn hình hiện thực, không thay bằng chứng gửi phản ánh/thu phí thành công. Dữ liệu quy mô lớn được ghi đúng là mô phỏng, không phải dữ liệu dân cư thực tế.

Các số 227 test backend, 73 test giao diện và 112 kiểm tra bộ mô phỏng được dẫn kèm ngày/nguồn kiểm chứng lịch sử. Lượt biên soạn này chạy lại **62 helper đạt, 4 bỏ qua**, kiểm tra file/dependency, build và chụp 4 màn hình; không trình bày như đã chạy lại toàn bộ API/MySQL hoặc đã thử camera thật.

- [Log helper](kiem-chung/helper-tests.txt)
- [Log build](kiem-chung/frontend-build.txt)
- [Kiểm tra file/dependency](kiem-chung/check-local.txt)
- [Nguồn và phạm vi ảnh giao diện](kiem-chung/giao-dien.json)
- [Kiểm tra lề/phân trang/số trang/chú thích](kiem-chung/phan-trang.json)
- [Tên/hash các tệp đầu vào đã đọc](kiem-chung/tai-lieu-dau-vao.json)

## Tái tạo tài liệu khi cần

Chỉnh `noi-dung.md`, `thong-tin.json`, `kich-ban.json`; `noi-dung-day-du.md` và DOCX là đầu ra sinh lại. Thêm lời nhận xét/chữ ký trong Word rồi **không chạy sinh lại trên tệp đã ký**; lưu thành bản riêng. Không có script tự đọc hoặc sao chép chữ ký.

Các script chỉ đọc source/metadata trong repository, không đọc `.env`, không kết nối MySQL, không seed và không sửa ứng dụng. Python cần `python-docx`, `Pillow`, `PyMuPDF`; tạo hình cần Graphviz, kết xuất PDF cần LibreOffice. Chụp UI dùng Vite/Playwright/Chromium đã khai báo trong dự án. Môi trường tạo hình hiện tại là Linux; để sửa trực tiếp tài liệu trên Windows chỉ cần Word.

```bash
python docs/bao-cao/quyen-bao-cao-2026/tao-hinh.py
node docs/bao-cao/quyen-bao-cao-2026/chup-giao-dien.mjs
python docs/bao-cao/quyen-bao-cao-2026/ket-xuat.py
```

`ket-xuat.py` tạo DOCX, render PDF, đọc số trang từ bookmark/caption và tái tạo đến khi mục lục ổn định. Kiểm tra chặn caption bị thiếu, chữ vượt khổ giấy, số trang không ở góc phải, trường Word bị hở và phụ lục dày hơn nội dung chính. Kiểm tra tự động bổ sung cho việc xem trực tiếp các trang, không thay thế duyệt bản in.
