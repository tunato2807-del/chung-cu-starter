# Bằng chứng lỗi ở baseline d226254

Các proof xác nhận hành vi lỗi, **không phải** test nghiệm thu bản đã sửa. Sau khi sửa, assertion mong hành vi cũ có thể thất bại; cần chuyển kỳ vọng đúng vào regression suite, giữ thư mục này làm chứng cứ lịch sử. Không nạp `.env` hoặc credentials thật để chạy proof.

Chạy từ root dự án:

```bash
node docs/ra-soat-spec-kit-2026-11-04/proofs/incident-session-revocation.mjs
node docs/ra-soat-spec-kit-2026-11-04/proofs/missing-local-config.mjs
node docs/ra-soat-spec-kit-2026-11-04/proofs/proxy-rate-limit.mjs
node docs/ra-soat-spec-kit-2026-11-04/proofs/apartment-draft-privacy.mjs
```

- Incident mock dùng real service với connection trong memory; không mở DB.
- Missing-config chỉ inspect pool config và child startup thiếu JWT, không gọi DB. Một số sandbox cần quyền spawn tiến trình con.
- Proxy dùng Express/Vite thật và hai client loopback127.0.0.2/3; cần bind loopback. Limiter hạ xuống1 trong app proof riêng, không đổi limiter ứng dụng.
- Browser cần Chromium/Playwright đi kèm root devDependencies. `UI_QA_CHROMIUM` có thể chọn executable riêng; mặc định giải nén binary của `@sparticuz/chromium`. Vite dùng cổng5187 strict; proof tự dừng đúng subprocess của nó. API hoàn toàn giả, không dùng tài khoản thật. Chỉ kết luận cho cùng tab/browser, không nháp giữa thiết bị.

`incident-session-live.mjs` là phép thử MySQL có ghi **fixture giả của chính nó**, không dành cho DB đang làm việc. Chỉ chạy khi đã tạo MySQL thử nghiệm riêng, schema019:

```bash
REVIEW_ISOLATED_DB=1 DB_HOST=127.0.0.1 DB_PORT=CONG_DB_THU DB_USER=USER_THU DB_PASSWORD=MAT_KHAU_THU DB_NAME=chung_cu_test node docs/ra-soat-spec-kit-2026-11-04/proofs/incident-session-live.mjs
```

Dòng trên là mẫu bash với cấu hình thử, không phải hướng dẫn gửi mật khẩu lên chat hoặc lệnh PowerShell để chạy trên database của bạn. Script yêu cầu flag riêng và DB_NAME đúng; tạo ID ngẫu nhiên, chỉ cập nhật tài khoản/phản ánh vừa tạo và dọn fixture đó. Cần quyền DML test phù hợp, không cần performance_schema. Lượt rà soát đã chạy nó trên container MySQL mới rồi dọn container; không đụng DB chung_cu hoặc chung_cu_nghiem_thu.
