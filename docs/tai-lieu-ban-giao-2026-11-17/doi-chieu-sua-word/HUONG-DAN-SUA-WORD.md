# Sửa Word ở đâu khi cập nhật bản form riêng?

Đối chiếu: bản nền `56ebfe8` → GitHub `main` tại `cceb904`. Phần này là hướng dẫn chỉnh báo cáo, không phải báo cáo đã được thay toàn bộ nội dung.

## Những mục cần sửa

| Mục Word | Trước | Cần cập nhật |
|---|---|---|
| Mở đầu; Phụ lục D | Bản báo cáo đang đối chiếu 56ebfe8, nhánh thesis-mysql-database. | Ghi rõ bản nền 56ebfe8; phần giao diện cửa sổ được đối chiếu bổ sung với main tại cceb904. Giữ nguyên ngày/phiên bản của các kết quả thử lịch sử. |
| 2.7 — Thiết kế giao diện | Biểu mẫu nằm ngay trong trang, bên cạnh hoặc phía dưới danh sách. | Mô tả nút mở cửa sổ riêng, đóng bằng ×/Đóng/Esc, giữ bộ lọc/trang/cuộn và focus; đang gửi thì khóa đóng, lỗi thì giữ nội dung. |
| 3.2.3 — Frontend, camera và ảnh | Chưa mô tả bộ điều phối cửa sổ mới. | Bổ sung Dialog, ActionPanel, dialog-navigation, làm mới dữ liệu sau khi lưu và loại bỏ dữ liệu phiên cũ. Không mô tả như thay thuật toán QR/ảnh hay API. |
| 3.2.4 — Phân hệ hỗ trợ | Mới liệt kê các nghiệp vụ căn hộ, cư trú, hóa đơn, tiện ích, quỹ… | Bổ sung rằng thao tác nhập liệu/chi tiết được mở trong cửa sổ ở các phân hệ. Biểu đồ và bảng số liệu cũng mở riêng. Quy tắc nghiệp vụ và số lượng bảng vẫn giữ. |
| 3.3 — Kết quả giao diện | Bốn ảnh cũ chưa thể hiện cửa sổ Thêm/Sửa/Chi tiết. | Bổ sung ảnh desktop/mobile của form mới; có thể dùng số Hình 3.5–3.6 nếu chưa có hình sau 3.4. Giữ ảnh đăng nhập/gửi phản ánh nếu nội dung vẫn đúng; không thay toàn bộ ảnh theo tên file sửa. |
| 3.4 — Kiểm thử | Chưa có nhóm ca kiểm tra riêng cho cửa sổ. | Thêm ca Esc/Tab/focus, khóa đóng khi chờ, giữ dữ liệu khi lỗi, quay lại danh sách, mở URL trực tiếp, hết phiên và responsive. Chỉ ghi kết quả theo lần chạy có minh chứng. |
| 3.5; Kết luận | Chưa tách cải tiến cách thao tác khỏi nghiệp vụ nền. | Nêu cải tiến thao tác, ngữ cảnh danh sách và bàn phím. Không diễn giải thành tính năng nghiệp vụ mới, DB mới hoặc tăng số lượng Use Case. |
| Phụ lục C — Cài đặt | Ví dụ tải nhánh codex/thesis-mysql-database. | Nếu hướng dẫn tải bản có cửa sổ, đổi nhánh trong ví dụ clone thành main. Máy đang có dữ liệu không chạy init:fresh/seed chỉ để nhận giao diện mới. |

## Những phần vẫn đúng

Backend, thư mục database và package-lock.json không đổi giữa bản nền 56ebfe8 và cceb904. Vì vậy phần lý thuyết Chương 1, danh sách chức năng, Use Case nghiệp vụ, Activity/Sequence nghiệp vụ, trạng thái phản ánh, lớp phân tích, ERD, từ điển 31 bảng và công thức tính tiền vẫn dùng được. Không cần vẽ lại 21 sơ đồ chỉ vì chuyển biểu mẫu sang cửa sổ. Nếu có hình mô tả vị trí UI hoặc thứ tự bấm nút cụ thể, chỉnh nhãn cho khớp màn hình mới.

## Đoạn có thể chèn vào báo cáo

Giữ các trích dẫn [n] đã có trong báo cáo; các đoạn dưới mô tả mã nguồn dự án tại cceb904.

### Chèn bổ sung tại mục 2.7

Ở phiên bản giao diện cửa sổ, các thao tác thêm, sửa, xem chi tiết và xử lý bản ghi được mở từ nút tương ứng trong một cửa sổ thao tác riêng. Danh sách nền được giữ lại để người dùng tiếp tục công việc với bộ lọc, trang và vị trí cuộn trước đó. Cửa sổ hỗ trợ đóng bằng nút ×, nút Đóng hoặc phím Esc; khi đóng, focus trở về nút đã mở cửa sổ. Trong khi yêu cầu lưu đang được xử lý, thao tác đóng bị khóa. Nếu API trả lỗi, cửa sổ tiếp tục hiển thị thông báo và nội dung đã nhập để người dùng điều chỉnh. Biểu đồ vận hành và bảng số liệu cũng có cửa sổ xem riêng. Đây là thay đổi cách tương tác ở frontend; các quy tắc nghiệp vụ và cấu trúc dữ liệu được giữ nguyên.

### Chèn bổ sung tại mục 3.2.3

Frontend sử dụng thành phần Dialog và ActionPanel dùng chung để quản lý cửa sổ thao tác. Dialog điều khiển lớp cửa sổ, tiêu đề, nút đóng, trạng thái đang gửi và phạm vi điều hướng bàn phím. Các liên kết chi tiết được điều phối qua dialog-navigation để giữ trang danh sách ở nền; khi mở URL chi tiết trực tiếp, ứng dụng vẫn cung cấp trang chi tiết độc lập. Sau thao tác thành công, tài nguyên liên quan được làm mới mà không phải tải lại toàn bộ trang. Khi phiên đăng nhập hết hiệu lực, dữ liệu riêng và các cửa sổ liên quan được loại bỏ theo ngữ cảnh phiên. Các thành phần này tiếp tục gọi API nghiệp vụ hiện có.

### Chèn bổ sung tại cuối mục 3.2.4

Cách mở cửa sổ được áp dụng cho các nhóm thao tác căn hộ, cư dân và cư trú, phương tiện, tài khoản, vị trí QR, phản ánh, thiết bị và bảo trì, hóa đơn, thông báo, tiện ích và quỹ. Các bảng chi tiết hoặc dữ liệu liên quan có thể được mở phía trên cửa sổ bản ghi và đóng trở lại đúng ngữ cảnh trước đó. Thay đổi tập trung vào tổ chức vùng làm việc và thao tác, không làm thay đổi công thức tính phí, quyền API hoặc vòng đời nghiệp vụ đã trình bày ở các phần trước.

### Chèn bổ sung tại mục 3.3, trước các ảnh mới

Các ảnh bổ sung minh họa cửa sổ Thêm căn hộ trên kích thước desktop và điện thoại. Khi mở biểu mẫu, trang danh sách được giữ ở phía sau; phần nhập liệu được đặt trong cửa sổ có tiêu đề và nút đóng rõ ràng. Trên màn hình hẹp, cửa sổ thu theo chiều rộng thiết bị và cho phép cuộn nội dung bên trong. Ảnh sử dụng dữ liệu kiểm thử và chỉ minh họa bố cục; chúng không thay thế minh chứng tạo bản ghi thành công vào MySQL trên máy nghiệm thu.

### Chèn bổ sung tại mục 3.4.1 hoặc 3.4.4

Nhóm kiểm thử giao diện cửa sổ bao gồm mở đúng biểu mẫu từ nút thao tác, đóng bằng ×/Đóng/Esc, di chuyển focus bằng Tab và Shift+Tab, trở lại nút mở sau khi đóng, giữ bộ lọc và vị trí danh sách, khóa đóng khi đang gửi, giữ nội dung khi API trả lỗi, làm mới dữ liệu sau khi lưu và loại bỏ nội dung riêng khi phiên đăng nhập hết hiệu lực. Các ca còn kiểm tra mở liên kết chi tiết trực tiếp, nút Quay lại của trình duyệt và bố cục ở nhiều kích thước màn hình. Kết quả thực tế cần ghi kèm phiên bản, lệnh, môi trường và minh chứng của lần chạy.

### Chèn bổ sung tại mục 3.5 hoặc Kết luận

So với giao diện nền, phiên bản cửa sổ tổ chức các thao tác nhập liệu và xem chi tiết quanh danh sách đang làm việc. Việc giữ bộ lọc, vị trí cuộn và focus hỗ trợ người dùng tiếp tục tác vụ sau khi hoàn tất hoặc đóng biểu mẫu. Cải tiến này thuộc cách trình bày và tương tác frontend; mức tăng hiệu suất thao tác chưa được định lượng bằng nghiên cứu người dùng hoặc phép đo thời gian riêng.

## Minh chứng giao diện

Hai ảnh PNG trong gói được lấy từ `docs/cua-so-thao-tac/` ở commit cceb904, tài liệu dự án ghi lượt minh họa ngày 14/11/2026. Đây là ảnh dữ liệu kiểm thử, không phải ảnh vừa chụp trên máy Windows của sinh viên. Khi đã cập nhật code trên máy, nên chụp lại cùng thao tác để nộp theo môi trường nghiệm thu thực tế.

- Hình 3.5 đề xuất: Cửa sổ Thêm căn hộ trên desktop 1440 px.
- Hình 3.6 đề xuất: Cửa sổ Thêm căn hộ trên điện thoại 320 px.
- Hình 3.1 đăng nhập: diff Auth.jsx thay phần Đổi mật khẩu của trang Tài khoản, không thay biểu mẫu đăng nhập công khai.
- Hình 3.2 gửi phản ánh công khai: PublicReports.jsx không đổi trong phạm vi so sánh.
- Hình 3.3 QR: vẫn là ô QR nhỏ; QrPreview thay nơi gắn popup khi nằm trong một cửa sổ đang mở.
- Hình 3.4 danh sách cư dân: ảnh bảng có thể vẫn minh họa danh sách, nhưng cần bổ sung ảnh cửa sổ Thêm/Sửa/Chi tiết để thể hiện phần mới.

## Ca kiểm thử cần bổ sung

- **Mở/đóng:** Bấm Thêm hoặc Sửa → đúng form; ×/Đóng/Esc đóng cửa sổ khi không gửi yêu cầu.
- **Bàn phím:** Tab/Shift+Tab giữ focus trong cửa sổ; đóng trả focus về nút mở.
- **Đang lưu:** Giả lập yêu cầu chưa hoàn tất → nút đóng và Esc không đóng form.
- **Lỗi nhập/API:** API báo lỗi → form vẫn mở, thông báo rõ và dữ liệu đang nhập được giữ.
- **Lưu thành công:** Form hoàn tất → danh sách/bản ghi liên quan được cập nhật theo luồng; không mất bộ lọc nền.
- **Chi tiết/điều hướng:** Mở từ danh sách → cửa sổ; mở URL trực tiếp → trang chi tiết; nút Back trở lại ngữ cảnh trước.
- **Hết phiên:** Phiên hết hiệu lực → loại bỏ dữ liệu riêng và các cửa sổ bản ghi, yêu cầu đăng nhập lại.
- **Responsive:** Kiểm tra cửa sổ ở 320/768/1024/1440 px và cuộn vùng nội dung phù hợp.

Đối chiếu thêm `e2e/dialog-workflows.spec.js`, `playwright.ui.config.js`, `scripts/test-ui.js`. Việc có test trong mã nguồn không tự xác nhận Pass trên máy Windows. Đừng đổi kết quả lịch sử, ngày thử hoặc số test của phiên bản cũ thành kết quả của phiên bản mới.

## Lưu ý khi chốt bản Word

Bản Word đã bổ sung trích dẫn trước đó vẫn đối chiếu code nền 56ebfe8; lượt đó chỉ sửa dẫn chiếu, không phải đã đồng bộ toàn bộ nội dung/ảnh theo cửa sổ mới. Sau khi chèn các phần trên, cập nhật ngày/phiên bản trong phần phạm vi, nguồn ảnh và Phụ lục D; Ctrl+A → F9 để cập nhật mục lục/danh mục hình. Không thay toàn bộ số 56ebfe8 trong các chứng cứ kiểm thử cũ bằng cceb904.
