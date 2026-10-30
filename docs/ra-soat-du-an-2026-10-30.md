# Rà soát dự án ngày 30/10/2026

> Bổ sung sau lượt review này: [rà soát sâu và 4 phát hiện còn mở](ra-soat-sau-2026-10-30.md), gồm quy tắc riêng tư phản ánh sau bàn giao vừa được người dùng xác nhận. Kết quả test dưới đây không bao phủ các kịch bản mới đó.

Nhánh kiểm tra: `codex/editorial-business-ui`, bản nghiệp vụ đầy đủ. Database kiểm thử: `chung_cu_test`. Không tạo lại database phát triển/nghiệm thu hoặc thay mật khẩu/tokens của người dùng để chữa lỗi.

## Phương pháp và phạm vi

Theo yêu cầu, đã đọc [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) tại commit `eb07f19f52c2669f2364897aaa293e2aaddd7b1c`, áp dụng:

- [debugging-and-error-recovery](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/debugging-and-error-recovery/SKILL.md): tái hiện, khoanh vùng, sửa nguyên nhân, kiểm tra lại.
- [test-driven-development](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/test-driven-development/SKILL.md): viết ca thất bại trước khi sửa; có agent viết riêng ca tái hiện.
- [code-review-and-quality](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/code-review-and-quality/SKILL.md): kiểm tra tính đúng, khả năng đọc, kiến trúc, bảo mật, hiệu năng.
- [security-and-hardening](https://github.com/addyosmani/agent-skills/blob/eb07f19f52c2669f2364897aaa293e2aaddd7b1c/skills/security-and-hardening/SKILL.md): giữ ranh giới xác thực/token, rà soát input và dependency.

Rà soát trực tiếp đường khởi động, cấu hình frontend/proxy, đăng nhập/cookie/phân quyền, bộ đọc QR, nhận ảnh/Excel, xuất báo cáo, các router nghiệp vụ và hướng dẫn chạy. Chạy toàn bộ bộ kiểm thử backend và giao diện cho các phân hệ hiện có: cư trú/căn hộ/tài khoản căn, xe, hóa đơn/điện bậc thang, thông báo, công nợ, bảo trì, tiện ích, quỹ, nhập/xuất, dashboard và phản ánh. Đây là rà soát code/kiểm thử trong workspace, không phải xác nhận trạng thái MySQL hoặc thiết bị vật lý trên máy Windows của người dùng.

## Kết quả ưu tiên và cách xử lý

| Mức | Phát hiện | Xử lý / bằng chứng |
| --- | --- | --- |
| Cao — vận hành | Tài khoản trong `TAI-KHOAN.md` và QR thuộc từng DB; lựa chọn `$env:DB_NAME` không tồn tại sau khi đóng terminal. Hướng dẫn trước dễ làm người dùng mở lại DB mặc định rồi dùng mật khẩu bộ mẫu. | Thêm lệnh `start:backend:acceptance`/`dev:backend:acceptance`, in rõ DB và đường dẫn tài khoản ở backend. Kiểm tra tiến trình thật xác nhận lệnh chọn DB mẫu ưu tiên hơn biến kế thừa. Đây là giả thuyết cần đối chiếu trên máy người dùng, chưa có log để kết luận lỗi 401 cụ thể của máy đó. |
| Cao — chức năng | Scanner từ chối QR có IP nội bộ cũ dù token còn hợp lệ, vì so sánh origin tuyệt đối. | Tái hiện bằng QR từ `http://192.168.1.100:5173`; sửa để chỉ lấy đường dẫn token, mở trên origin hiện tại, backend vẫn xác minh. E2E kiểm tra cả token hợp lệ và token không tồn tại. |
| Vừa | Frontend HTTP tự tăng cổng nếu cổng yêu cầu bị chiếm. | Ca kiểm thử dùng cổng tạm đang bận đã thất bại trước sửa. Cấu hình `strictPort: true` cho HTTP, giữ cổng 5173; ca này đạt sau sửa. |
| Vừa | POST đăng nhập trả 200 nhưng cookie chưa lưu vẫn chuyển vào trang quản trị và giữ user trong React. | Tái hiện POST200/GET phiên401. Frontend xác minh `/xac_thuc/toi` trước điều hướng; không lưu được phiên thì ở lại trang đăng nhập với thông báo rõ. |
| Vừa | Proxy trả HTML/rỗng 500 làm client ném `SyntaxError`, che lỗi kết nối. | Hai ca Node thất bại trước sửa, đạt sau sửa; giữ nguyên mã lỗi JSON401 và AbortError. |
| Cao — advisory | `body-parser 2.3.0`: GHSA-27r3-jxmh-p828, DoS với request nén có bytes thừa. JSON parser của ứng dụng là đường tiếp nhận liên quan. | Đọc changelog, cập nhật riêng lockfile lên 2.4.0, vẫn trong range Express; 16 ca auth/QR/HTTP liên quan đạt trước khi chốt cập nhật. |
| Cao — advisory | `multer 2.4.0`: GHSA-q7qp-rjg7-q26m, DoS khi async fileFilter còn chờ sau teardown. Ứng dụng không có async fileFilter riêng nhưng thư viện vẫn nằm trong đường upload. | Đọc changelog, cập nhật riêng lockfile lên 2.5.0; 26 ca ảnh/QR/nhập Excel liên quan đạt. Giới hạn file/quyền ghi giữ nguyên. |
| Vừa — kiểm thử | Một số E2E giữ nhãn giao diện trước: tiêu đề portal, nhãn nhập/xuất, vùng danh mục, nút danh mục bảo trì; một liên kết tra cứu trùng footer khiến locator mơ hồ. | Cập nhật locator theo màn hình thật và giới hạn liên kết nhận biên nhận trong main. Các assertion về quyền, số lượng, điều hướng, bàn phím và đăng xuất vẫn được kiểm tra, không bỏ/skip ca thất bại. |

## Ranh giới bảo mật của bản sửa

- QR khác origin chỉ được phục hồi khi là IP nội bộ/loopback hoặc cùng hostname đổi giao thức/cổng. URL có credentials, giao thức thực thi, hostname ngoài, query/hash hay UUID sai bị từ chối.
- Không fetch hoặc điều hướng sang IP cũ. Token lạ/đã thu hồi/không hoạt động vẫn bị backend từ chối. Không bỏ kiểm tra tài khoản, cookie, CSRF hoặc trạng thái QR để làm đăng nhập/quét mã “thành công”.
- Không đổi thuật toán hash, JWT secret, mật khẩu, giới hạn đăng nhập hay tự mở khóa BQL. Phân biệt lỗi cookie bằng việc xác minh phiên sau POST.
- Công cụ `diagnose` chỉ SELECT số lượng/trạng thái, đọc sự tồn tại của file tài khoản và chứng chỉ công khai. Không đọc file mật khẩu/hash/khóa riêng, không thử đăng nhập và chỉ gọi API loopback được kiểm tra đầu vào.
- Dependency được cập nhật từng thư viện bằng npm với install scripts tắt; không sửa lockfile thủ công hoặc dùng `audit fix --force`.

## Kiểm chứng

| Kiểm tra | Kết quả |
| --- | --- |
| Baseline backend trước sửa | 216/216 đạt |
| Toàn bộ backend sau sửa/dependency | 216/216 đạt |
| Bộ giao diện | Chạy 69 ca: 63 đạt ở lượt toàn bộ; 6 ca dùng nhãn cũ được sửa. Chạy lại 8 ca thuộc hai file có locator cập nhật: 8/8 đạt. Tất cả 69 ca khác nhau đã đạt; không skip. |
| Hồi quy mới | 6 E2E kết nối/QR/phiên; 4 API-client, 4 chẩn đoán, 3 QR-link, 1 cổng Vite đạt |
| Helper cũ | 5 check-local, 4 tạo mẫu, 4 schema, 5 điều hướng đạt |
| CLI thực tế | API readiness + chẩn đoán SELECT + chọn DB mẫu trong tiến trình mới: đạt; không tạo DB mẫu để kiểm tra startup |
| Mutation | Đảo điều kiện tin cậy host QR làm ca hồi quy thất bại; khôi phục code, các ca đạt |
| HTTPS | Xác minh CA, nội dung frontend và proxy API: đạt; không tắt xác minh TLS |
| Build / file check | Build đạt, check-local 0 lỗi, diff whitespace sạch |
| Dependency audit sau vá | 0 critical, 0 high, còn 2 moderate liên quan cùng nhánh ExcelJS → uuid |

Các lệnh kiểm tra đã dùng:

```bash
npm test
npm run test:e2e
node --env-file-if-exists=.env node_modules/@playwright/test/cli.js test e2e/interface.spec.js e2e/service-discovery.spec.js
node scripts/api-client.test.js
node scripts/local-diagnostics.test.js
node scripts/qr-links.test.js
node --test scripts/dev-server.test.js
node scripts/check-local.test.js
node scripts/create-acceptance-data.test.js
node scripts/export-schema.test.js
node scripts/service-navigation.test.js
npm run test:https
npm run build
node scripts/check-local.js
npm audit --json
```

Các kiểm thử DB chạy trong `chung_cu_test`; E2E dùng API/Vite ở cổng 3101/5174. Mạng/bind cổng và tiến trình con cần quyền tương ứng trong sandbox; ca tạo mẫu được chạy lại với quyền tiến trình con và đạt, không sửa điều kiện từ chối DB thật để qua kiểm thử.

## Các điểm cần theo dõi

1. **Tài khoản và IP trên máy người dùng:** chưa có URL đầy đủ/log Database hoặc kết quả `npm run diagnose` từ Windows, nên chưa xác nhận DB nào đang phục vụ request bị 401. Nếu BQL đang khóa tạm, chờ hết hạn hoặc xử lý qua quy trình quản trị được phép; bản sửa không gỡ khóa tự động.
2. **QR đã in chứa IP tuyệt đối:** camera bên ngoài web vẫn mở IP cũ. Khi IP đó không còn truy cập được thì không có code frontend nào tự chạy để đổi URL. Dùng Scanner tại web hiện tại hoặc in lại; DHCP reservation/hostname có DNS và chứng chỉ ổn định là cách giữ URL dài hạn. Cần thử camera và quyền CA trên điện thoại thật.
3. **Moderate ở uuid `<11.1.1`:** GHSA-w5hq-g745-h8pq ảnh hưởng v3/v5/v6 khi truyền buffer. ExcelJS 4.4.0 trong ứng dụng chỉ gọi v4 không buffer tại `cf-rule-ext-xform.js`; code dự án dùng `crypto.randomUUID`. Chưa thấy đường nhập/xuất gọi API bị ảnh hưởng. Không downgrade ExcelJS 3.4.0 hoặc override uuid major khi chưa xác minh tương thích. Theo dõi bản vá upstream, rà lại trước **06/11/2026** hoặc ngay khi thay cách dùng ExcelJS/uuid.
4. **Triển khai công khai:** cấu hình hiện tại phù hợp đồ án cục bộ. Cần kế hoạch cho hostname/HTTPS cố định, cookie Secure, security headers tại reverse proxy, backup database/ảnh và rate-limit dùng chung khi chạy nhiều instance. Rate-limit hiện trong memory theo `req.ip`, backend qua Vite loopback có thể gộp người dùng vào cùng IP; chưa thay trust-proxy/forwarded-header policy trong bản chữa lỗi này.
5. **Hiệu năng frontend:** build vẫn cảnh báo chunk lớn hơn 500 kB và directive React Router bị bỏ qua. Chưa tách bundle vì không phải nguyên nhân lỗi đăng nhập/QR. Không đổi ngưỡng cảnh báo để che kết quả.

## Cách cập nhật trên máy người dùng

Xem [code đầy đủ 9 file, cách khởi động và chẩn đoán](sua-dang-nhap-qr-va-dia-chi-vscode.md) và [hướng dẫn chạy đồ án](huong-dan-chay-do-an-windows.md). Dùng file tài khoản của đúng database, mở frontend bằng đúng địa chỉ/cổng và đối chiếu dòng Database trong terminal backend.
