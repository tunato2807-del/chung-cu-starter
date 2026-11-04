# Tasks — rà soát và phần việc tiếp theo

**Ngày:** 04/11/2026. `[x]` chỉ nghĩa deliverable rà soát đã làm; `[ ]` là khắc phục/nghiệm thu chưa làm. Không có task tự động merge, deploy, gửi thông báo hoặc đổi dữ liệu thật. Không dùng `[P]` vì lượt này không giao việc cho agent song song.

## Rà soát đã hoàn tất

- [x] T001 Đọc/pin Spec Kit, Word và các quyết định hội thoại; ghi nguồn trong `spec.md` và `.specify/README.md`. Bao phủ nguồn của FR-001–FR-022.
- [x] T002 Ghi guardrails hiện có vào `.specify/memory/constitution.md`, phân biệt với tiêu chí mới chưa chốt. FR-001, FR-002, FR-004, FR-009, FR-010, FR-016, FR-018, FR-021.
- [x] T003 Lập ma trận FR-001–FR-022 → module/test/evidence/task tại `traceability.md`.
- [x] T004 Chạy lại full backend trên MySQL riêng, helper, UI liên quan và build; ghi kết quả/giới hạn ở `docs/ra-soat-spec-kit-2026-11-04/evidence.json`. FR-019, FR-022.
- [x] T005 Tái hiện nháp A hiện cho chủ B cùng tab bằng browser/API stubs tại `proofs/apartment-draft-privacy.mjs`. FR-004, FR-006, FR-008.
- [x] T006 Tái hiện ghi phản ánh sau thu hồi phiên bằng mock và MySQL riêng tại `proofs/incident-session-*.mjs`. FR-002, FR-007.
- [x] T007 Tái hiện gộp bucket hai client qua Vite và lỗi thiếu config tại `proofs/proxy-rate-limit.mjs`, `proofs/missing-local-config.mjs`. FR-002, FR-005, FR-006, FR-018.
- [x] T008 Đối chiếu metadata schema019 với tài liệu schema018 và kiểm tra runner Windows bằng source, ghi rõ chưa chạy Windows. FR-019, FR-020.
- [x] T009 Tổng hợp 7 phát hiện và mức bằng chứng; lập kế hoạch khắc phục FR-001–FR-022 trong `plan.md`/báo cáo.

## Khắc phục ưu tiên, chưa triển khai

- [ ] T010 [US1] Sửa SK-01: chia nháp theo người, xử lý nháp legacy an toàn và reset dữ liệu hiển thị khi đổi chủ; test RED/GREEN cùng tab A→B, khác tab, guest, hết phiên/cùng chủ giữ ảnh. Files dự kiến `frontend/src/shared/use-report-draft.js`, `PublicReports.jsx`, test browser. FR-004, FR-006, FR-008. Phụ thuộc T005.
- [ ] T011 [US2] Sửa SK-02: revalidate actor tại giao dịch phân công/chuyển trạng thái sau khóa, giữ đúng lock order; test MySQL thu hồi phiên/đổi phân công/rollback ảnh. Files dự kiến module incidents và backend tests. FR-002, FR-007. Phụ thuộc T006.
- [ ] T012 [US1] Sửa SK-03 theo topology proxy tin cậy đã chọn; test hai client, spoof header, giới hạn đăng nhập/gửi/tra cứu. Files dự kiến `lib/http.js`, `app.js`, Vite config/tests. FR-002, FR-005, FR-006, FR-018. Phụ thuộc T007.
- [ ] T013 [US4] Sửa SK-05: preflight clone/config/profile DB, hỗ trợ env được cấp hợp lệ và hướng dẫn copy cấu hình cũ; không tự seed/đổi mật khẩu/cổng. Files dự kiến startup/migrate/check-local và Windows guide. FR-018. Phụ thuộc T007.
- [ ] T014 [US4] Xử lý SK-06: runner npm tương thích Windows và thông báo spawn error; chốt test DB Docker/native và thực hiện Windows thật. File `scripts/test-local.js`, tests và guide. FR-019. Phụ thuộc T008.

## Hồ sơ/nghiệm thu, chưa hoàn tất

- [ ] T015 [US3/US4] Sửa SK-04: thống nhất README/API/Use Case/architecture với ownership, Excel-only import và batch/export hiện có; sinh lại data dictionary/ERD/schema019 bằng exporter, giữ bản rút gọn và 38 bảng. FR-001–FR-020. Phụ thuộc T008; đồng bộ lại sau T010–T014.
- [ ] T016 [US1/US4] Hoàn thành phần máy thật của SK-07: thiết bị/OS/browser, 10 lượt mỗi loại quét native/web, ảnh thư viện/camera/gửi, lỗi và thời gian từng lượt; không thay bằng API stubs. FR-005, FR-006, FR-008, FR-021, FR-022. Phụ thuộc môi trường demo sẵn sàng sau T013.
- [ ] T017 [US4] Chốt ngưỡng hiệu năng/tải mục tiêu, yêu cầu lưu dữ liệu/phục hồi và cách đo với người dùng/GVHD; ghi công cụ/môi trường rồi mới kiểm chứng. FR-018, FR-019, FR-021, FR-022. Phụ thuộc thông tin chưa có; không tự đánh dấu Pass.
- [ ] T018 [US1–US4] Nghiệm thu 5 UC cốt lõi cùng các phần mở rộng đã chọn; cập nhật Test Case thực tế, ảnh demo/Figma/Postman khi có; chạy lại bộ test/build sau khắc phục và ghi remaining limits. FR-001–FR-022. Phụ thuộc T010–T017.

**Thứ tự đề xuất:** T010 → T011 → T012 → T013/T014 → T015 → T016/T017/T018. Những bước cần thiết bị hoặc quyết định tiêu chí do người dùng/GVHD cung cấp vẫn mở; không dùng thời gian chờ làm sự chấp thuận.
