# Sửa 4 lỗi sau rà soát — 30/10/2026

Đã triển khai bản sửa trên nhánh `codex/editorial-business-ui`. [Hướng dẫn cập nhật VS Code và code đầy đủ từng file](cap-nhat-4-loi-sau-ra-soat-vscode.md). Database hiện có vẫn giữ 38 bảng; cần chạy migration mới **019_incident_sender_privacy.sql** trên từng database được sử dụng.

Áp dụng phương pháp tái hiện → sửa nguyên nhân → kiểm thử hồi quy của [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/eb07f19f52c2669f2364897aaa293e2aaddd7b1c), kết hợp `debugging-and-error-recovery`, `test-driven-development` và `security-and-hardening`. Đây là bản sửa bốn phát hiện trong [báo cáo trước](ra-soat-sau-2026-10-30.md), không khẳng định mọi lỗi có thể có trong toàn dự án đều đã được loại bỏ.

## Thay đổi

| Lỗi | Hành vi sau sửa | File chính |
| --- | --- | --- |
| Chủ mới thấy phản ánh/ảnh chủ trước | Lưu mã cư dân người gửi tại lúc tiếp nhận; danh sách/chi tiết/ảnh theo người đó. Hóa đơn vẫn theo căn. Đổi mật khẩu không đổi danh tính lịch sử. | [migration 019](../database/migrations/019_incident_sender_privacy.sql), [sender](../backend/src/modules/incidents/incident-sender.js), [quyền đọc](../backend/src/modules/incidents/incidents.repository.js), [tiếp nhận](../backend/src/modules/incidents/incidents.service.js), [danh tính phiên](../backend/src/modules/auth/auth.repository.js) |
| Thu phí bằng phiên đã bị thu hồi trong lúc chờ khóa | Sau khi khóa căn/hóa đơn, đọc lại vai trò, trạng thái hoạt động và phiên bản token bằng `FOR SHARE`, giữ đến cuối giao dịch. Cùng guard cho lập mới và mọi thao tác hóa đơn lẻ, cả retry thu tiền. | [guard](../backend/src/modules/billing/billing.guards.js), [hóa đơn](../backend/src/modules/billing/billing.service.js), [batch dùng chung](../backend/src/modules/billing/billing-batch.service.js) |
| VAT vượt cột đơn giá | Kiểm tra giá trị thuế đã làm tròn trong giới hạn `DECIMAL(12,2)` trước khi ghi SQL; vượt giới hạn trả 422. Giữ cách tính BigInt và mức giá hiện có. | [bộ tính điện](../backend/src/modules/billing/billing.electricity.js) |
| Frontend giữ trạng thái đăng nhập cũ sau 401 | Một trạng thái phiên trong memory cho AuthContext/API JSON/tải báo cáo; thông báo hết phiên và cho đăng nhập lại. Thế hệ yêu cầu bảo vệ phiên mới khỏi 401 trả muộn. Không xóa form/ảnh và không tự gửi thành khách. | [session](../frontend/src/shared/auth-session.js), [client](../frontend/src/shared/api/client.js), [Auth](../frontend/src/features/auth/Auth.jsx), [export](../frontend/src/shared/ReportExport.jsx) |

### Phản ánh cũ và bàn giao

Không suy đoán người gửi quá khứ từ chủ hộ hiện tại hoặc số điện thoại nhập trong form. Migration đánh dấu phản ánh lịch sử gửi từ tài khoản căn, để mã cư dân người gửi NULL. BQL và kỹ thuật viên được phân công tiếp tục xử lý; cư dân không được nhận các nội dung/ảnh này theo tài khoản căn. Không xóa hoặc thay nội dung/ảnh. Tra cứu công khai bằng đúng mã và điện thoại vẫn chỉ trả trạng thái/timeline, không mở quyền nội dung riêng.

Phản ánh mới lấy danh tính từ phiên được server xác minh, không nhận `ma_cu_dan_nguoi_gui` tự khai trong body. Khóa hồ sơ cư dân rồi tài khoản theo thứ tự phù hợp luồng cư trú; xác minh lại sau bước xử lý ảnh để tránh gán nhầm người nếu bàn giao/đổi mật khẩu trong lúc tải ảnh. Tài khoản căn chưa gắn chủ hộ trả 422 và hướng dẫn liên hệ BQL khi gửi phản ánh; đăng nhập/xem hóa đơn vẫn được phép.

Nếu chủ cũ có tài khoản cá nhân liên kết đúng hồ sơ cư dân đó, họ tiếp tục xem phản ánh của mình qua tài khoản cá nhân. Chưa thêm chức năng nhận lại phản ánh legacy chưa xác định người gửi. Không tự cấp tài khoản mới hoặc đặt lại mật khẩu để phục hồi dữ liệu đó.

### Hết phiên khi điền biểu mẫu

JSON API và tải Excel/PDF đều xử lý 401. Khi khởi động, phân biệt `SESSION_EXPIRED` (cookie hết hiệu lực) và `UNAUTHORIZED` (khách không có phiên): khách vẫn gửi công khai được; phiên đã hết hạn phải đăng nhập lại. Sai mật khẩu tại API đăng nhập không xóa phiên khác. Việc đổi trạng thái AuthContext không thay key của cây component công khai, nên form/ảnh đang mở được giữ. Không bảo đảm giữ ảnh chưa gửi qua reload/đóng trình duyệt; không lưu token vào localStorage.

Yêu cầu ảnh native của trình duyệt không đi qua client JSON/download; lỗi HTTP của riêng `<img>` không tự kích hoạt thông báo phiên. Server vẫn kiểm tra quyền ảnh, và yêu cầu JSON/download tiếp theo sẽ đồng bộ phiên.

## Kiểm chứng

Đã ghi nhận RED trước sửa: ba hồi quy backend thất bại ở quyền người gửi, VAT và phiên thu phí; các kịch bản trình duyệt thất bại ở điều hướng phiên hết hạn. Các bản mở rộng download/cookie hết hạn cũng được xác nhận thất bại trước khi thêm xử lý.

| Kiểm tra | Kết quả |
| --- | --- |
| Toàn bộ `backend/test/*.test.js`, chạy tuần tự trên MySQL thử nghiệm | **222/222 đạt** |
| Test quyền riêng tư/API/MySQL và hồi quy thu phí/sender/VAT sau cải tiến barrier | **6/6 đạt**; là các ca nằm trong bộ backend, không cộng lại vào tổng |
| `node scripts/api-client.test.js` | **13/13 đạt** |
| Browser: connection-recovery, report-draft, gallery-upload, in-page-photo | **19/19 đạt** trên Chromium với API giả lập |
| Migration từ 018 có dữ liệu cũ → 019 | Đạt: nội dung giữ nguyên, đánh dấu tài khoản căn, không gán chủ hiện tại |
| `node scripts/check-local.js` | **0 lỗi**, chỉ kiểm tra file/dependency/sự tồn tại env |
| `npm run build` | Đạt, 162 module; còn cảnh báo chunk lớn và `use client` của React Router như trước |
| Prettier và `git diff --check` | Đạt |
| `npm audit` | 0 critical/high, 2 moderate (`exceljs` → `uuid`), không thêm/cập nhật dependency |

Kiểm thử DB dùng một container MySQL 8.4 mới, cổng loopback ngẫu nhiên, dữ liệu và tài khoản thử riêng. Không nạp `.env`/file mật khẩu, không kết nối hoặc sửa database người dùng. Toàn bộ test backend dùng cùng các file của repository nhưng chạy Node trực tiếp với cấu hình test; các lời gọi DDL fixture của Docker Compose được harness tạm điều hướng riêng vào container test. Lần chạy đầu có hai nhóm lỗi do harness trỏ sai đường dẫn binary Docker; sau sửa harness đã chạy lại toàn bộ và đạt 222/222. Không sửa assertion để bỏ qua lỗi nghiệp vụ.

Luồng API thật đã kiểm chứng: A gửi ảnh → giữ quyền sau đổi mật khẩu → bàn giao B → cookie A bị thu hồi → B không thấy list/detail/image A, vẫn thấy hóa đơn → BQL thấy phản ánh A → B gửi phản ánh riêng → cấp lại mật khẩu B vẫn xem được → tài khoản cá nhân gắn A chỉ xem phản ánh A. Đồng thời test chặn giả mạo mã cư dân trong form và legacy không có danh tính.

Ca thu phí dùng hai connection thật giữ/chờ khóa căn, có barrier quan sát câu khóa được gửi, không dùng thời gian sleep để đoán. Thu hồi phiên BQL trước khi nhả khóa dẫn đến 401, hóa đơn và lịch sử không đổi. Ca mock bao phủ thêm lập mới, tính lại, duyệt, gửi, hủy, thay thế và replay thanh toán.

Chưa chạy trên MySQL/Chrome/Windows của bạn. Cần copy đủ file, migrate đúng DB, khởi động lại và nghiệm thu theo [hướng dẫn](cap-nhat-4-loi-sau-ra-soat-vscode.md). Không cần tạo lại bộ dữ liệu nghiệm thu.

## Các việc còn tách riêng

Các lưu ý cũ về runner `npm.cmd` trên Windows, cấu hình IP/proxy/rate-limit và tách file UI lớn vẫn thuộc lộ trình riêng. Không thay đổi chúng trong bản sửa này. Hai advisory moderate ExcelJS/uuid giữ quyết định hoãn đã nêu trong [báo cáo dependency trước](ra-soat-du-an-2026-10-30.md): code sử dụng UUID v4, chưa có đường gọi API buffer bị ảnh hưởng; xem lại trước 06/11/2026 hoặc khi thay đổi cách dùng.
