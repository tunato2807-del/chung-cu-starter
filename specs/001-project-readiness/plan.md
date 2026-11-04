# Kế hoạch rà soát và khắc phục có giới hạn

**Ngày:** 04/11/2026. **Baseline:** `d226254`, `codex/editorial-business-ui`. [Đặc tả](spec.md) · [Nguyên tắc](../../.specify/memory/constitution.md).

## Summary

Lượt này hoàn tất inventory, phân tích chênh lệch và bằng chứng. Các thay đổi runtime bên dưới là **kế hoạch chưa triển khai**, không đánh dấu hoàn thành do test hiện tại xanh. Ưu tiên quyền riêng tư bản nháp và phiên thao tác phản ánh, rồi proxy/khởi động/runner, sau đó thống nhất hồ sơ và nghiệm thu thực tế.

## Technical Context

- Node >=22.12, khuyến nghị 24; React 19/JavaScript/Vite 7; Express 5, `jose`, MySQL, Sharp/Multer, ExcelJS, pdfmake; giữ npm workspaces/lockfile.
- Database hiện tại có 19 migration, 38 bảng, 397 cột, 88 FK. Không cần xóa/gộp bảng cho lượt sửa các lỗi đang nêu; mô hình ERD rút gọn vẫn chỉ là tài liệu.
- Ảnh phản ánh ở backend/storage; nháp form ở sessionStorage; cookie HttpOnly ở server. Không biến sessionStorage thành nơi chứa token.
- Node test backend tích hợp MySQL riêng; test helper có fixture/mock; Playwright có cả API thật và API stubs. Phải ghi rõ loại nào được chạy.
- Windows/Chrome/Android là mục tiêu demo, Linux workspace chỉ là nơi kiểm chứng tự động. Ngưỡng tốc độ/tải/chính sách lưu dữ liệu chưa chốt, không mặc định một số mới.

## Constitution Check

| Nguyên tắc | Áp dụng trong kế hoạch |
| --- | --- |
| Phạm vi/stack | Không thêm framework, app native, gateway hoặc chuyển 38 bảng |
| Quyền riêng tư | Tách bản nháp theo người; guard actor khi ghi; không dùng SĐT form để quyết định chủ |
| Bảo toàn dữ liệu | Không init/seed lại DB đang dùng; test DB riêng, chỉ sửa schema bằng migration mới nếu thật sự cần |
| Tiền/trạng thái | Giữ hóa đơn theo căn, phản ánh theo người; không làm yếu kiểm tra snapshot/BigInt |
| Nghiệm thu | Ghi rõ RED/GREEN, API mock/DB thật và thiết bị chưa đo |
| Review được | Sửa từng nhóm có test, cập nhật tài liệu và hướng dẫn Git; không merge main/deploy |

## Phase 0 — Rà soát (đã làm)

Đọc nguồn Spec Kit và Word, nguồn module/test/docs; chạy lại kiểm thử baseline, tạo các proof giới hạn. Xem [bằng chứng JSON](../../docs/ra-soat-spec-kit-2026-11-04/evidence.json), [báo cáo](../../docs/ra-soat-spec-kit-2026-11-04.md). Không gọi slash command `analyze` khi integration và feature-artifact do CLI chưa tồn tại; đây là phân tích thủ công theo cùng nhóm tiêu chí.

## Phase 1 — Bản nháp và giao dịch phản ánh (chưa làm)

1. Dùng danh tính cư dân thực của phiên để chia nháp tài khoản căn; tài khoản cá nhân chưa gắn cư dân dùng phạm vi tài khoản cá nhân; guest giữ phạm vi tab/QR. Migration nháp cũ phải giữ kín, không tự gán cho chủ hiện tại chỉ vì trùng ID căn. Việc hết phiên cùng chủ phải giữ nội dung/ảnh đang điền; bàn giao khác chủ phải reset/tách dữ liệu hiển thị, kể cả inputs uncontrolled đã mount, không chỉ đổi storage key.
2. Khóa và kiểm tra lại actor active/role/token ở luồng phân công/chuyển trạng thái phản ánh sau khi chờ khóa và sau xử lý ảnh. Thiết kế thứ tự khóa nhất quán với luồng phân công/người dùng, tránh thêm khóa theo chiều ngược gây deadlock. Recheck assignment/version và rollback/dọn ảnh trên lỗi. Không dùng lại guard hóa đơn BQL-only cho actor KTV.
3. Tạo test RED đúng hai ca SK-01/02 trước khi sửa; GREEN phải giữ quyền phản ánh đã gửi, đổi mật khẩu cùng chủ, ảnh form khi hết phiên và dữ liệu hóa đơn kế thừa.

**Các file dự kiến:** `frontend/src/shared/use-report-draft.js`, `frontend/src/features/incidents/PublicReports.jsx`, auth identity client khi cần; `backend/src/modules/incidents/incidents.repository.js`, `incidents.service.js`; test browser/API mới.

## Phase 2 — Proxy và khởi động Windows (chưa làm)

1. Chọn một ranh giới proxy tin cậy rõ: forwarding chỉ từ proxy được kiểm soát, API loopback và loại header client giả; hoặc thiết kế bucket theo actor/identifier chuẩn hóa phù hợp từng route. Không đặt `trust proxy=true` cho mọi nguồn và không tin thẳng `X-Forwarded-For` do client gửi. Test hai địa chỉ client thực khác nhau, spoof header và các route auth/public.
2. Preflight phân biệt cấu hình thiếu và cấu hình được cấp qua environment; in hướng dẫn khôi phục `.env` cũ/profile DB khi clone. Không tự điền mật khẩu, không tự chạy seed, không đổi 3306 sang 3307. Thiếu cấu hình thì dừng trước migration; có cấu hình hợp lệ không cần bắt buộc file `.env`.
3. Test runner gọi npm theo cách chạy được trên Windows, ví dụ dùng Node + npm CLI được npm cung cấp trong `npm_execpath`, và in `result.error` đã lọc khi spawn thất bại. Xác định rõ test tích hợp cần MySQL Docker riêng hay hỗ trợ MySQL native; không tự dùng DB làm việc để bỏ bước test Docker.

**Các file dự kiến:** `backend/src/lib/http.js`, `backend/src/app.js` nếu cần trusted proxy, `frontend/vite.config.js`; startup/migrate scripts và `scripts/test-local.js`; test helper/Windows mới. Cấu hình proxy và biến môi trường phải có hướng dẫn cập nhật đồng bộ.

## Phase 3 — Hồ sơ và bằng chứng nghiệm thu (chưa làm)

- Đánh dấu nguồn hiện hành cho README/architecture/API; sửa những câu nhập PDF/lập lô/ownership lỗi thời; giữ bài hướng dẫn cũ như bản lịch sử có ngày/SHA.
- Sinh lại metadata/UML/ERD theo schema 019 từ DB thử, so checksum; không chỉ sửa tay số 395 thành 397. Giữ ERD tổng quan gọn của người dùng và giải thích nó không phải 38 bảng vật lý bị xóa.
- Thực hiện năm Use Case cốt lõi và các phần mở rộng đã chọn bằng dữ liệu demo; đo QR thực tế Edge/Chrome/Cốc Cốc, ghi model/OS/version, từng lượt thành công/lỗi/thời gian. Xác nhận cấu hình Figma/Postman/ngưỡng NFR với người dùng/GVHD trước khi ghi đã đạt.

## Validation Strategy

- Baseline lượt này: 222/222 backend; 39/39 helper; 19/19 browser liên quan (API stubs); build đạt. Các số này không bao phủ tự động ca mới SK-01/02/03.
- Chạy các proof ở `docs/ra-soat-spec-kit-2026-11-04/proofs/` để tái hiện **hành vi lỗi baseline**, không đưa các assert mong lỗi vào suite nghiệm thu sau sửa. Thêm regression với kết quả mong đợi đã sửa vào test chính.
- Sau sửa mỗi nhóm, chạy test bị ảnh hưởng rồi full backend/helper, browser luồng liên quan và build. Windows runner phải có kết quả Windows thật, không dùng Linux mock để thay.
- Không ghi benchmark, QR camera hay tiền chuyển ngân hàng là Pass từ Chromium/API stubs. Không nâng dependency tự động; advisory hiện có ghi rõ khả năng ảnh hưởng và lịch xem lại.

## Rủi ro và cách xử lý

Chia nháp mới có thể làm mất khả năng tự khôi phục nháp cũ không xác định người; ưu tiên giữ kín và giải thích cho người gửi, không đoán owner. Guard actor có thể gây deadlock nếu chèn sai thứ tự khóa; cần test race/rollback trước phát hành. Proxy trust quá rộng có thể làm giả bucket; phải chốt topology và kiểm thử. Migration MySQL không transactional hoàn toàn; không sửa checksum hoặc tự đánh dấu applied khi lỗi. Dữ liệu thật và chứng chỉ của máy người dùng không được mang vào workspace để “làm test nhanh”.
