# Quản lý chung cư · Phản ánh QR

React 19 + Vite 7, Express 5 và MySQL 8.4. Phiên bản này triển khai luồng **đăng nhập, phân quyền và phản ánh qua QR** theo ba tài liệu thiết kế; chưa triển khai cư trú, phương tiện, hóa đơn và thông báo.

## Chạy môi trường phát triển

Cần Node.js 24, npm và Docker có Compose. Chạy tại thư mục gốc repository:

```bash
npm ci
npm run init:local
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev:backend
```

Terminal thứ hai, cũng tại thư mục gốc:

```bash
npm run dev:frontend
```

`init:local` tạo `.env` với mật khẩu MySQL và khóa ký phiên ngẫu nhiên, không ghi đè file đã tồn tại. MySQL chạy ở cổng 3307, API ở 3000, Vite ở 5173. Nếu đổi cổng API, đặt `API_TARGET` khi chạy Vite. Trên máy cloud có thư mục home chỉ đọc, dùng `npm ci --cache /workspace/.npm-cache`.

`db:seed` chỉ dành cho phát triển: tạo BQL, KTV, cư dân và ba vị trí QR. SĐT tương ứng là `0900000001`, `0900000002`, `0900000003`. **Mật khẩu ngẫu nhiên nằm trong file local `backend/.demo-credentials`**; mở file bằng trình soạn thảo. File này và `.env` được Git bỏ qua. Chạy seed lại không thay mật khẩu hoặc xóa dữ liệu hiện có. Không dùng các tài khoản demo cho triển khai thật.

Docker lưu MySQL trong volume `mysql_data`; ảnh nằm tại `backend/storage/images`. `docker compose stop` dừng database và giữ dữ liệu. Cần sao lưu cả database và thư mục ảnh; không xóa volume để sửa lỗi kết nối.

## Thử luồng chức năng

1. Đăng nhập BQL → **Vị trí & QR** → chọn vị trí hoặc tạo mới → xem, tải hoặc in QR.
2. Mở liên kết QR bằng trình duyệt khác hoặc cửa sổ riêng tư. Nhập sự cố, thông tin liên hệ và tối đa 5 ảnh. Lưu mã tra cứu riêng khi gửi thành công.
3. BQL → **Phản ánh** → mở chi tiết → chọn KTV và mức ưu tiên.
4. Đăng nhập KTV → **Công việc** → bắt đầu → ghi kết quả và nộp ảnh nghiệm thu mới.
5. BQL nghiệm thu đạt để đóng, hoặc trả lại xử lý kèm lý do. Lượt xử lý tiếp theo phải nộp ảnh mới.
6. Khách tra cứu bằng mã riêng và SĐT. Chỉ trả tiến độ và phản hồi công khai; không trả ảnh, nội dung riêng hoặc thông tin liên hệ.

BQL cấp/khóa tài khoản tại **Nhân sự & tài khoản**. Cư dân chỉ xem phản ánh đã gửi bằng chính tài khoản; phản ánh khách không tự gắn vào tài khoản theo SĐT. KTV mất quyền ngay ở request tiếp theo khi bị phân công lại. Đổi mật khẩu hoặc đăng xuất kết thúc tất cả phiên của tài khoản.

Mã QR chứa URL theo tên miền đang mở trang quản trị. Khi thử camera điện thoại, dùng một tên miền HTTPS truy cập được từ điện thoại; địa chỉ loopback của máy phát triển không dùng được trên điện thoại. Camera trong web có hướng dẫn khi bị từ chối quyền và hỗ trợ dán URL cùng hệ thống; không tự mở URL ngoài hệ thống.

Để dùng nút **Mở camera** trên điện thoại cùng Wi-Fi, xem [hướng dẫn HTTPS cho Windows/Android](docs/https-local.md). Sau khi tạo và tin cậy chứng chỉ, chạy `npm run dev:frontend:https`. HTTP qua IP mạng nội bộ chỉ dùng được để mở form; trình duyệt chặn camera trong trang.

## Kiểm tra

```bash
npm run build
npm test
npm run test:e2e
```

- `npm test`: tạo/migrate database riêng `chung_cu_test`, chạy kiểm thử HTTP với MySQL thật. Gồm xác thực, khóa phiên, quyền bản ghi/ảnh, QR thu hồi, gửi lặp đồng thời, chuyển trạng thái, nghiệm thu mới, gộp trùng, giới hạn gửi và rollback khi lịch sử lỗi.
- `npm run test:e2e`: chạy API/Vite riêng ở 3101/5174, mở Chromium và đi hết luồng qua giao diện ở 1440 px và 375 px. Browser Linux được đóng gói trong dependency `@sparticuz/chromium`, không cần tải thêm từ CDN. Kiểm thử không thay dữ liệu database phát triển. Hai lệnh test nên chạy lần lượt.
- `/api/health` kiểm tra tiến trình; `/api/ready` kiểm tra database và migration. Không coi một cổng mở là đã sẵn sàng.

Chưa đo tải lớn, thử camera trên thiết bị thật hoặc kiểm thử sao lưu/phục hồi. Trước triển khai thật: phục vụ frontend và `/api` cùng origin qua HTTPS, đặt `COOKIE_SECURE=true`, dùng khóa/mật khẩu riêng, cấu hình backup và giới hạn request tại reverse proxy. Backend hiện bind loopback; Vite là máy chủ phát triển.

Xem [kiến trúc và quy tắc](docs/architecture.md), [API](docs/api.md), [database](database/README.md). Những quy tắc hóa đơn/cư trú đang là đề xuất trong tài liệu được để lại cho giai đoạn tiếp theo, chưa được coi là nghiệp vụ đã chốt.
