# Nguyên tắc dự án — bản ghi nhận phục vụ rà soát

**Phiên bản:** 0.1.0. **Ngày ghi nhận:** 04/11/2026. **Trạng thái:** khung đối chiếu từ các yêu cầu đã có; không phải một tiêu chuẩn mới đã được GVHD/người dùng phê duyệt toàn bộ.

## I. Giữ phạm vi và stack đã chốt

Phục vụ một chung cư bằng Web Responsive. Giữ React/JavaScript/Vite, Express/Node và MySQL trong các thư mục hiện có. Không tự thêm app native, multi-tenant hoặc cổng thanh toán tự động. Bảo trì, tiện ích, quỹ, dashboard và nhập/xuất là phần mở rộng đã được người dùng chọn; không dùng việc có thêm module để thay thế nghiệm thu luồng QR cốt lõi.

Nguồn: Word `1250080221_To_Hoang_Tuan.docx`, các lựa chọn triển khai trong hội thoại, README và `docs/architecture.md`.

## II. Quyền dữ liệu theo đúng người và hành động

Server kiểm tra quyền độc lập với UI. Bàn giao tài khoản căn chỉ kế thừa hóa đơn; phản ánh và thông tin riêng của người cũ phải tách. Đổi mật khẩu của cùng người không làm mất quyền phản ánh của chính họ. Không tự gắn phản ánh theo SĐT tự khai. Phiên bị thu hồi phải mất quyền; yêu cầu đang chờ khóa hoặc xử lý ảnh cần xác minh lại trước ghi.

Nguồn: quyết định trực tiếp của người dùng về bàn giao; auth/incident-privacy/billing hiện có. Phạm vi bản nháp được đưa ra đối chiếu vì chứa cùng tên/SĐT/nội dung riêng; SK-01 nêu rõ giới hạn cùng tab/trình duyệt.

## III. Không thay dữ liệu thật để có kết quả đạt

Giữ migration đã áp dụng bất biến; thay đổi schema dùng migration mới. Không reset/seed lại DB hiện có để sửa đăng nhập. Khởi động đúng database và bộ credentials. Không đọc/đưa mật khẩu, `.env`, khóa chứng chỉ hoặc ảnh thật lên GitHub/log. Kiểm thử tạo fixture riêng và dọn đúng fixture đó; không suy diễn cấu hình máy người dùng từ workspace Linux.

Nguồn: quy trình migrate, hướng dẫn chạy và các yêu cầu bảo toàn dữ liệu trong phiên làm việc.

## IV. Tiền và trạng thái có bằng chứng

Tính tiền thập phân chính xác/BigInt và snapshot; không dùng QR hoặc login để tự xác nhận đã thu. BQL đối soát thực tế rồi xác nhận đúng tổng. Transaction giữ trạng thái và lịch sử cùng nhau; retry không tạo thu/phiếu/phản ánh trùng. Nhập mới bằng Excel; xuất Excel/PDF. Không khôi phục nhập PDF chỉ để tài liệu cũ đúng.

Nguồn: giới hạn thanh toán trong Word; quyết định nhập/xuất và module billing/treasury/data-exchange.

## V. Nghiệm thu phải gắn với nguồn và môi trường

Tách yêu cầu, mã, test tự động và thực nghiệm máy thật. Không ghi Pass cho thiết bị, Postman, Figma, tốc độ, tải hoặc khôi phục chưa thử. Viewport Chromium không thay phép đo camera Android. Kiểm thử mới phải chứng minh lỗi trước sửa và hành vi mong đợi sau sửa; giữ các ca bảo toàn chức năng đang chạy.

Nguồn: chương 3 của Word và các mẫu nghiệm thu hiện có.

## VI. Thay đổi phải review được

Chỉ sửa trong phạm vi công việc hiện tại, lưu file/commit và chỉ dẫn cập nhật qua Git ở nhánh nghiệp vụ. Spec/plan/task là tài liệu giúp người thực hiện đối chiếu, không tự cho phép merge main, triển khai production, gửi thông báo cho người khác hoặc thay nguyên tắc nghiệp vụ. Các ngưỡng hiệu năng, thời hạn lưu dữ liệu, RPO/RTO chưa có nguồn thì ghi cần xác nhận, không bịa số để đánh dấu đạt.

**Quản lý thay đổi:** khi người dùng đổi nghiệp vụ, cập nhật nguyên tắc liên quan và dẫn nguồn quyết định, sau đó đối chiếu spec/plan/tasks/test. Mức ưu tiên lỗi trong báo cáo là đánh giá rủi ro hiện tại, không tự gắn CRITICAL chỉ vì một tiêu chuẩn mới được viết trong lượt rà soát.

## Sửa đổi theo yêu cầu mới: PostgreSQL

Người dùng đã yêu cầu chuyển toàn bộ dự án từ MySQL sang PostgreSQL. Từ feature002, ràng buộc Data Layer MySQL ở mục I được thay bằng PostgreSQL; các nguyên tắc bảo toàn chức năng/API, dữ liệu nguồn, quyền riêng tư và bằng chứng vẫn giữ. Xem `specs/002-postgresql-migration/spec.md`. Không suy ra rằng đã chuyển dữ liệu trên máy Windows khi chỉ mới kiểm thử workspace.
