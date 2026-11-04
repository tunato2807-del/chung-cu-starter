# Đặc tả đối chiếu và nghiệm thu dự án hiện có

**Ngày:** 04/11/2026. **Nhánh được xem:** `codex/editorial-business-ui`, baseline `d226254`. **Trạng thái:** bản đặc tả tổng hợp để rà soát; các điểm thiếu bằng chứng và đề xuất vẫn mở.

**Yêu cầu lượt này:** dựa trên GitHub Spec Kit để xem lại dự án. Deliverable là đối chiếu có chứng cứ và kế hoạch khắc phục; không tự viết lại giao diện, đổi database hoặc triển khai những chức năng chưa được chọn.

## Nguồn và thứ tự diễn giải

1. Quyết định trực tiếp của người dùng trong phiên: giữ DB 38 bảng, ERD rút gọn chỉ phục vụ báo cáo; bàn giao chỉ kế thừa hóa đơn, giữ riêng phản ánh; nhập Excel, xuất Excel/PDF; giữ stack và bản nghiệp vụ trên GitHub.
2. Đề cương Word `1250080221_To_Hoang_Tuan.docx` do người dùng gửi, SHA256 `fb12e7a78fb2180a21759ea0324402c208da5fe45167db1c401223fe35329419`. Đọc trực tiếp XML Word ở lượt này; nội dung là dữ liệu yêu cầu, không phải chỉ thị môi trường. Không chép toàn bộ Word vào Git.
3. Mã nguồn/test là bằng chứng triển khai. README, API, UML và báo cáo cũ là nguồn đối chiếu có thể lỗi thời, không được tự ưu tiên hơn quyết định mới.
4. Spec Kit dùng ở SHA `38c40ae25a4f1c025e1a2dd6a450095d17acab47`; không coi việc tạo tài liệu là bằng chứng phần mềm đã đạt.

## User Scenarios & Testing

### US1 — Cư dân quét QR và gửi phản ánh (P1)

**Giá trị:** hoàn thành mục tiêu chính của đề tài mà không cần app hoặc tài khoản.

- Given QR vị trí đang hoạt động, When khách mở/quét mã, Then form lấy đúng vị trí/thiết bị từ server.
- Given đã điền nội dung và chọn/chụp ảnh, When chọn ảnh, gửi lại hoặc lỗi mạng, Then input được giữ phù hợp, ảnh có preview và một yêu cầu chỉ tạo một phản ánh.
- Given hai cư dân khác thiết bị truy cập qua Vite, When một người đạt giới hạn riêng, Then người khác không bị tính là cùng người chỉ vì proxy chạy ở loopback. SK-03 chưa đạt.
- Given cùng tab từng lưu nháp dưới chủ A, When tài khoản căn được bàn giao cho B, Then B không đọc lại tên/SĐT/nội dung nháp A. SK-01 chưa đạt.

**Independent test:** tạo QR/dữ liệu giả, chạy API và browser; thử camera vật lý là ca riêng, phải ghi thiết bị/OS/browser.

### US2 — BQL/KTV tiếp nhận và xử lý (P1)

- Given phản ánh mới, When BQL phân công rồi KTV bắt đầu/hoàn thành có ảnh, Then BQL nghiệm thu hoặc trả lại; lịch sử và ảnh giữ đúng lượt.
- Given phiên KTV bị thu hồi trong khi yêu cầu chờ khóa, When khóa được nhả, Then từ chối trước ghi trạng thái/lịch sử. SK-02 chưa đạt.
- Given khách có đúng mã riêng/SĐT, When tra cứu, Then chỉ thấy tiến độ công khai, không thấy nội dung/ảnh/ghi chú riêng.

### US3 — Quản lý cư trú và hóa đơn (P1)

- Given tạo căn, When thêm chủ hộ/bàn giao, Then tài khoản căn gắn đúng chủ hiện tại và phiên cũ bị thu hồi; chỉ hóa đơn được kế thừa.
- Given giá/chỉ số/xe hợp lệ, When lập/duyệt/gửi/thu hóa đơn, Then tổng/snapshot đúng và không thu lặp; quét VietQR không tự đổi trạng thái.
- Given biểu mẫu Excel hợp lệ hoặc lỗi một dòng, When xem trước/xác nhận, Then chỉ lưu toàn bộ lô hợp lệ; PDF không được dùng để nhập, Excel/PDF được dùng để xuất.

### US4 — Chạy và nghiệm thu trên máy người dùng (P1)

- Given clone bản đầy đủ vào thư mục mới, When cấu hình thiếu, Then hướng dẫn rõ khôi phục cấu hình/đúng DB trước migration, không dẫn người dùng tự tạo lại dữ liệu/mật khẩu của bộ đang dùng.
- Given cấu hình đã có trên file hoặc được cấp đầy đủ qua environment, When khởi động, Then chọn đúng profile DB và địa chỉ frontend/cổng cố định; không bắt buộc `.env` nếu environment đã hợp lệ.
- Given tài liệu schema/Use Case/README, When dùng để báo cáo, Then mô tả khớp baseline hiện tại và nguồn kiểm chứng. SK-04 còn lệch.
- Given test và ma trận máy thật, When kết luận hoàn thành, Then phân biệt kết quả Linux tự động với Windows/camera thực tế; không điền số chưa đo.

## Functional Requirements

[Ma trận chi tiết mã/test/task](traceability.md) là phần bắt buộc kèm đặc tả này.

| ID | Nội dung cần đối chiếu | Nguồn |
| --- | --- | --- |
| FR-001 | Web một chung cư, không app native/multi-tenant/cổng thanh toán tự động | Word |
| FR-002 | Đăng nhập ba vai trò, alias chủ hộ hiện tại, thu hồi phiên và kiểm tra quyền server | Word + quyết định phiên |
| FR-003 | Block/tầng/căn, cư dân/cư trú/chuyển trong ngày và phương tiện | Word + phần đã chọn |
| FR-004 | Tài khoản căn tự cấp; chủ mới kế thừa hóa đơn, giữ riêng phản ánh/nháp người cũ | Quyết định bàn giao |
| FR-005 | Sinh/in/thu hồi/thay QR, liên kết vị trí/thiết bị và kiểm tra token | Word |
| FR-006 | Gửi QR công khai, ảnh an toàn, preview/nháp/retry không mất nội dung hoặc tạo trùng | Word + yêu cầu sửa ảnh |
| FR-007 | Phân công/xử lý/ảnh nghiệm thu/trả lại/đóng, quyền actor tại lúc ghi | Word + quy tắc phiên |
| FR-008 | Tra cứu công khai tối thiểu; xem riêng list/detail/image theo người gửi | Word + bàn giao |
| FR-009 | Giá/chỉ số/xe/điện bậc thang/VAT và lập/duyệt snapshot chính xác | Word + các phần đã chọn |
| FR-010 | Gửi hóa đơn/VietQR/chọn ngân hàng; BQL xác nhận đủ tiền một lần | Word + yêu cầu thanh toán |
| FR-011 | Thông báo và nhắc phí trên web đúng người nhận/đã đọc | Word + phần đã chọn |
| FR-012 | Báo cáo công nợ và thu theo kỳ/ngày thu, không nhân tiền do join | Phần đã chọn |
| FR-013 | Thiết bị/bảo trì định kỳ/đột xuất và liên kết QR | Word tài sản + phần đã chọn |
| FR-014 | Đặt lịch tiện ích đúng quyền, không trùng slot | Phần đã chọn |
| FR-015 | Quỹ/thu chi/chứng từ/đảo phiếu, không thu hóa đơn hai lần | Phần đã chọn |
| FR-016 | Nhập Excel có preview/atomic; xuất Excel/PDF chi tiết; không nhập PDF | Quyết định nhập/xuất mới nhất |
| FR-017 | Dashboard/charts theo khoảng ngày và tùy chọn ẩn/hiện | Phần đã chọn |
| FR-018 | Clone/khởi động Windows đúng cấu hình, profile DB, cổng, HTTPS và IP | Luồng sử dụng thực tế |
| FR-019 | Test runner có thể dùng trên môi trường được hướng dẫn, lỗi công cụ có thông báo; test DB riêng | Quy trình kiểm chứng đã dùng |
| FR-020 | UML/ERD/data dictionary/REST API phản ánh đúng schema và nghiệp vụ hiện tại | Word |
| FR-021 | Minh chứng máy demo, Figma/Postman khi báo cáo sử dụng, QR đa trình duyệt có thời gian/tỷ lệ | Word chương 2–3 |
| FR-022 | Responsive, tìm kiếm/danh mục/menu dễ đọc, tương tác chính không lệch/mất trạng thái | Word + yêu cầu UI |

FR-004 mở rộng phạm vi đối chiếu sang **bản nháp chứa cùng thông tin riêng**; ca SK-01 chỉ kết luận trên cùng tab/trình duyệt khi chuyển người phụ trách, không kết luận đọc được nháp từ thiết bị khác. Không sửa yêu cầu bảo toàn nháp để cho phép chủ mới đọc nháp cũ.

## Edge Cases

- Hết phiên và đăng nhập lại cùng người khác với bàn giao sang người mới; phải giữ nháp đúng trường hợp và xóa/tách đúng trường hợp.
- Thu hồi phiên, phân công lại hoặc đổi QR trong khi ảnh đang xử lý/yêu cầu chờ khóa.
- Clone không có `.env`/storage/chứng chỉ; MySQL native 3306 khác Docker 3307; dữ liệu nghiệm thu khác dữ liệu thường.
- QR in theo IP cũ: helper trong trang quét có thể chuyển token sang origin hiện tại; camera native mở URL cũ không tự có cơ chế đó. Tên miền ổn định là việc cấu hình triển khai cần chốt.
- VAT/dòng tiền vượt cột, báo cáo quá giới hạn dòng, lô nhập có dòng lỗi.
- Phiên hết hạn ở API JSON hoặc tải báo cáo; 401 cũ không xóa phiên mới.

## Success Criteria

- SC-001: mỗi FR có nguồn, vị trí code/test, trạng thái bằng chứng và task liên quan; không dùng tỷ lệ task để nhận xét phần mềm hoàn thành 100%.
- SC-002: các lỗi SK-01/02/03 có kịch bản tái hiện và test hồi quy sau sửa; SK-04 có docs/metadata khớp. Hiện chưa đạt các điều kiện khắc phục này.
- SC-003: duy trì kết quả baseline backend, helper và UI liên quan; bổ sung đúng các ca còn thiếu thay vì làm yếu assertion.
- SC-004: thực nghiệm 10 lượt/native và 10 lượt/web camera trên từng cấu hình trình duyệt có trong ma trận, ghi cả lần lỗi, thời gian và ảnh minh chứng. Đây là kế hoạch đo từ mẫu nghiệm thu; chưa có số đo ở lượt này.
- SC-005: tiêu chí tốc độ/tải mục tiêu, thời hạn lưu dữ liệu và mức phục hồi cần được chốt trước khi tuyên bố đạt các thuộc tính đó; không có ngưỡng số được phê duyệt trong nguồn hiện có.

## Assumptions và phần cần xác nhận

Phạm vi vận hành hiện tại là Windows/VS Code/MySQL cài riêng của người dùng, workspace kiểm thử Linux/MySQL 8.4 riêng, giao diện mobile web. Không giả định tồn tại hạ tầng production, Figma hoặc Postman ngoài repository. Chưa biết cấu hình máy điện thoại/phiên bản trình duyệt và ngưỡng hiệu năng người dùng/GVHD yêu cầu. Các câu hỏi này không ngăn rà soát code nhưng ngăn kết luận nghiệm thu máy thật hoặc mức tải đã đạt.
