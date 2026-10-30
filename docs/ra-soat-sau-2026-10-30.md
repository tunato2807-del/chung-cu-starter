# Rà soát sâu toàn dự án — 30/10/2026

**Phiên bản được rà soát:** `f16c6b0`, nhánh `codex/editorial-business-ui`.

**Kết quả:** 4 phát hiện mới còn mở, gồm 1 lỗi quyền riêng tư ưu tiên cao và 3 lỗi mức vừa. Đây là báo cáo review; các file nghiệp vụ ở phiên bản được rà soát chưa được sửa trong lượt này.

## Phạm vi và cách kiểm tra

Tiếp tục áp dụng [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/eb07f19f52c2669f2364897aaa293e2aaddd7b1c): `code-review-and-quality`, `security-and-hardening`, `debugging-and-error-recovery` và phương pháp tái hiện của `test-driven-development`. Có review độc lập phần tài chính và các ranh giới phân quyền; các kết luận bên dưới được đối chiếu lại với source và chứng cứ có thể chạy.

Đã xem các nhóm: khởi động/cấu hình và công cụ kiểm tra; đăng nhập/phiên; cư dân/căn hộ/tài khoản căn/xe; phản ánh/QR/ảnh; phí/chỉ số/hóa đơn/batch; quỹ và báo cáo; bảo trì; thông báo; tiện ích; nhập/xuất; trạng thái frontend. Không khẳng định một lượt review đã chứng minh mọi nhánh đều đúng.

Baseline đã có ở [lượt sửa trước](ra-soat-du-an-2026-10-30.md): 216 ca backend và 69 ca giao diện đã đạt, build đạt. Source nghiệp vụ không đổi từ baseline nên không chạy lại toàn bộ chỉ để lặp số liệu. Lượt này dùng các kịch bản mới nằm ngoài độ phủ đó, không đọc file mật khẩu hay database của người dùng.

## 1. P1 — Chủ hộ mới có thể đọc phản ánh riêng của chủ trước

**Quy tắc người dùng vừa xác nhận:** chỉ kế thừa hóa đơn; phản ánh của chủ trước phải được giữ riêng.

**Nguồn:**

- [Bàn giao tài khoản căn](../backend/src/modules/residency/apartment-accounts.service.js#L24) thay người phụ trách/mật khẩu và phiên bản token trên cùng `ma_nguoi_dung`.
- [canRead](../backend/src/modules/incidents/incidents.repository.js#L3) cho cư dân đọc khi `user.ma_nguoi_dung === report.ma_nguoi_gui`, không phân biệt người phụ trách ở thời điểm gửi.
- [Danh sách](../backend/src/modules/incidents/incidents.repository.js#L103) cũng lọc bằng cùng ID này; [chi tiết](../backend/src/modules/incidents/incidents.repository.js#L63) chọn `p.*`, bao gồm thông tin liên hệ và nội dung.
- [API ảnh](../backend/src/modules/incidents/incidents.routes.js#L38) dựa vào quyền đọc chi tiết nên có cùng vấn đề.

**Kịch bản:** chủ A dùng tài khoản căn gửi phản ánh và ảnh → BQL bàn giao tài khoản đó cho chủ B → phiên cũ của A bị thu hồi đúng → B đăng nhập bằng phiên mới hợp lệ → vẫn đọc được phản ánh/ảnh A đã gửi vì ID tài khoản căn không đổi. Đây là vấn đề tách quyền dữ liệu, không phải việc phiên cũ còn sống.

**Kiểm chứng:** chạy hàm `canRead` thật với hai người phụ trách khác nhau trên cùng tài khoản căn, cả hai được trả `true`. Đã đối chiếu đường list/detail/image; chưa chạy một lần bàn giao trên MySQL trong lượt này.

**Đề xuất sửa:** ghi nhận danh tính cư dân gửi tại thời điểm tiếp nhận, tách khỏi ID tài khoản thanh toán cố định; áp dụng cùng một điều kiện quyền cho list/detail/image. Giữ quyền xem hóa đơn theo căn như hiện tại. Với dữ liệu cũ chưa xác định được người gửi một cách đáng tin cậy, không mặc định gán cho chủ đang phụ trách. Không dùng phiên bản JWT làm danh tính lịch sử vì đổi mật khẩu của cùng một chủ không nên làm họ mất phản ánh của chính mình.

**Ca nghiệm thu cần thêm:** chủ mới không thấy phản ánh cũ trong list, không mở được detail/image trực tiếp; chủ mới vẫn xem được hóa đơn căn; đổi mật khẩu mà không đổi chủ không làm mất quyền dữ liệu của người gửi; BQL vẫn xem được phục vụ xử lý.

## 2. P2 — Ghi nhận thu đơn lẻ có thể tiếp tục sau khi phiên BQL bị thu hồi trong lúc chờ khóa

**Nguồn:** [billing.service.js:530](../backend/src/modules/billing/billing.service.js#L530), [nhánh xác nhận thanh toán](../backend/src/modules/billing/billing.service.js#L611).

`action()` khóa căn/hóa đơn rồi sử dụng đối tượng `user` từ middleware để ghi nhận thu và audit. Không có lần đọc lại trạng thái hoạt động/phiên bản token của actor trong transaction. [Luồng batch](../backend/src/modules/billing/billing-batch.service.js#L37) và treasury đã có guard tương ứng với `FOR SHARE`.

**Kịch bản:** request đã qua middleware → chờ khóa căn do transaction khác đang giữ → phiên BQL bị thu hồi bằng đổi mật khẩu/đăng xuất → khóa được nhả → request cũ vẫn cập nhật `DA_THANH_TOAN` và commit. Điều này không nhất quán với yêu cầu thu hồi phiên trước thao tác ghi và cách luồng batch xử lý.

**Kiểm chứng:** gọi `action()` thật với connection giả có barrier tại khóa căn. Sau khi actor được đánh dấu không còn hợp lệ, nhả barrier; quan sát UPDATE thanh toán, ghi audit và COMMIT, không có truy vấn kiểm tra actor. Đây là chứng cứ execution path bằng mock, chưa phải một cuộc chạy cạnh tranh trên MySQL thật.

**Đề xuất sửa:** dùng guard actor trong transaction của các thao tác ghi hóa đơn đơn lẻ, sau các khóa theo thứ tự thống nhất và trước ghi dữ liệu. Giữ khóa bảo vệ actor tới khi commit. Áp dụng nhất quán cả lập/tính lại/duyệt/gửi/hủy nếu có cùng cửa sổ chờ.

**Ca nghiệm thu cần thêm:** giữ khóa căn, cho thao tác chờ, thu hồi token, nhả khóa; kết quả phải 401, hóa đơn/audit không đổi. Kiểm tra thêm không phát sinh đảo thứ tự khóa với batch và bàn giao tài khoản.

## 3. P2 — Dòng thuế vượt kiểu cột dù bộ tính chấp nhận tổng hóa đơn

**Nguồn:** [dòng VAT](../backend/src/modules/billing/billing.electricity.js#L119), [cột don_gia](../database/migrations/005_billing.sql#L97), [giới hạn tính tiền](../backend/src/modules/billing/billing.validation.js#L69).

Dòng thuế lưu toàn bộ số tiền thuế vào `don_gia`, trong khi `chi_tiet_hoa_don.don_gia` là `DECIMAL(12,2)` — tối đa `9.999.999.999,99`. Bộ tính cho phép tổng tiền tới 14 chữ số, tạo ra khoảng giá trị hợp lệ ở hàm tính nhưng không lưu được vào cột.

**Kịch bản biên đã chạy:** đơn giá điện `2.000.000.000 đ`, sử dụng `100 kWh`, VAT `8%`. Các tham số trong giới hạn validation hiện có; tổng `216.000.000.000 đ` có 12 chữ số, nhưng dòng VAT tạo `don_gia="16000000000.00"`, vượt kiểu cột. Đây là dữ liệu cực lớn, không phải ví dụ giá điện thực tế; nó cho thấy lỗi kiểm soát biên và xử lý nhập nhầm.

**Kiểm chứng:** hàm `electricityLines()` thật tạo ra kết quả trên; đối chiếu kiểu cột trong migration. Kết luận out-of-range là suy ra từ schema, chưa thực hiện INSERT trên MySQL trong lượt này.

**Đề xuất sửa:** thống nhất biểu diễn dòng thuế, giới hạn giá trị và kiểu cột. Nếu mở rộng cột thì tạo migration mới, không sửa migration 005 đã áp dụng. Nếu giữ kiểu cột thì từ chối với lỗi validation rõ trước khi INSERT.

**Ca nghiệm thu cần thêm:** các giá trị ngay dưới/trên giới hạn đơn giá, tổng và VAT phải cho kết quả hợp lệ hoặc lỗi 422, không biến thành HTTP 500 và không ghi dở hóa đơn.

## 4. P2 — Phiên hết hạn sau đăng nhập không được phản ánh vào AuthContext

**Nguồn:** [AuthProvider](../frontend/src/features/auth/Auth.jsx#L16), [Login điều hướng khi còn user](../frontend/src/features/auth/Auth.jsx#L55), [client xử lý lỗi](../frontend/src/shared/api/client.js#L42).

AuthProvider chỉ nạp phiên khi mount và xóa `user` khi logout chủ động. Khi API khác trả 401/`SESSION_EXPIRED`, client ném lỗi nhưng context vẫn giữ user. Điều hướng SPA tới `/dang-nhap` bị Login đưa trở lại trang theo vai trò; biểu mẫu đăng nhập không hiện. Tải lại toàn bộ trang mới nạp lại phiên và hiện biểu mẫu.

**Kiểm chứng:** Chromium với API giả lập: đăng nhập POST200/GET phiên200 → dashboard → API401 → điều hướng SPA tới trang login → bị trả về dashboard, số biểu mẫu login là 0. Hard reload phục hồi màn đăng nhập. Không dùng tài khoản hoặc database thật trong kịch bản này.

**Đề xuất sửa:** có cơ chế đồng bộ sự kiện phiên hết hiệu lực về AuthContext và luồng khôi phục đăng nhập. Phân biệt lỗi nhập sai mật khẩu với lỗi phiên của các request đã xác thực. Bảo toàn bản nháp/ảnh chưa gửi và không tự biến một phản ánh đang đăng nhập thành gửi khách.

**Ca nghiệm thu cần thêm:** hết hạn/thu hồi phiên khi đang dùng SPA mở được màn đăng nhập; nhập sai mật khẩu không xóa phiên không liên quan; dữ liệu biểu mẫu chưa gửi được bảo toàn hoặc có thông báo rõ trước khi đổi ngữ cảnh.

## Các điểm cần xác minh hoặc cải thiện tiếp

- **Runner kiểm thử trên Windows:** [test-local.js:3](../scripts/test-local.js#L3) gọi `spawnSync("npm", ...)` không shell; bản Node cài thông thường trên Windows có `npm.cmd`. Cần dùng Node chạy npm CLI hoặc cách xử lý `.cmd` đúng nền tảng; `result.error` hiện còn bị bỏ qua nên có thể chỉ thoát mã 1. Đây là review theo hợp đồng `child_process`, chưa thực thi trên Windows thật. Runner cũng đang phụ thuộc Docker Compose kể cả người dùng chạy web bằng MySQL cài riêng; tài liệu cần ghi rõ điều kiện của bộ test.
- **Rate-limit qua Vite:** vấn đề req.ip gộp về loopback đã được ghi ở lượt trước, vẫn cần giải quyết khi nhiều người dùng. Thiết kế trusted proxy/forwarded headers phải chống giả mạo, không bật tin mọi header từ client.
- **Bảo trì code:** một số file UI trên 1.000 dòng và nhiều lớp CSS làm việc sửa dễ tác động chéo. Nên tách theo màn hình/trạng thái và gom quy tắc trùng sau khi xử lý các lỗi quyền và tính tiền; không cần đổi framework.
- **Dependency:** hai cảnh báo moderate ExcelJS → uuid và phạm vi dùng v4 đã được đánh giá ở [báo cáo trước](ra-soat-du-an-2026-10-30.md). Không có thay đổi dependency trong lượt review này để cần tự động nâng cấp lại.

Chưa thấy bằng chứng mới đủ mạnh để kết luận có lỗi tính tổng tiền/snapshot ở treasury và financial-reports; các mutex, phiếu đảo, biên ngày Việt Nam và BigInt được kiểm tra trong source. Các candidate chưa tái hiện được không được gắn nhãn là lỗi đã xác nhận.

## Bằng chứng có thể chạy lại

Chạy từ gốc repository:

```bash
node docs/ra-soat-sau-2026-10-30/proofs/apartment-report-privacy.mjs
node docs/ra-soat-sau-2026-10-30/proofs/billing-revocation-mock.mjs
node docs/ra-soat-sau-2026-10-30/proofs/vat-bounds.mjs
```

Ba script dùng hàm thật với dữ liệu trong memory hoặc connection giả; không kết nối MySQL, không nạp `.env`. Chúng xác nhận hành vi lỗi ở SHA được review, không phải bộ test nghiệm thu cho bản đã sửa.

Chứng cứ frontend nằm ở [frontend-expiry.mjs](ra-soat-sau-2026-10-30/proofs/frontend-expiry.mjs). Chạy trong môi trường có Chromium/Playwright và quyền bind loopback; `UI_QA_CHROMIUM` chọn đường dẫn Chromium, mặc định `/tmp/chromium` của workspace Linux. Script chỉ dựng Vite và API stubs.

**Giới hạn kiểm chứng:** automatic approval review đã từ chối lệnh kiểm thử MySQL bổ sung vì lệnh nạp `.env`/dùng credentials bị coi là truy cập tệp đã yêu cầu giữ kín. Không chuyển sang cách khác để đi vòng kiểm soát này. Các phát hiện trong lượt review dựa trên code, hàm thật, mock và Chromium/API stubs; chưa có kiểm chứng MySQL thật bổ sung.

## Thứ tự xử lý đề xuất

1. Tách quyền phản ánh của người gửi khỏi tài khoản căn được bàn giao, với kế hoạch dữ liệu cũ an toàn.
2. Thống nhất kiểm tra actor trong transaction cho các thao tác ghi.
3. Đồng bộ phiên hết hạn giữa API và frontend, bảo toàn biểu mẫu.
4. Sửa giới hạn tiền/kiểu cột dòng thuế và bổ sung ca biên.
5. Sau đó xử lý runner Windows, proxy/rate-limit và tách các file UI lớn.
