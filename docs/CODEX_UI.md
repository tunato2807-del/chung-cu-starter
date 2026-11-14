# Sửa giao diện bằng Codex Web

## Chọn dự án

Trong chat Codex Web mới, chọn repository **`tunato2807-del/chung-cu-starter`**, nhánh **`main`** (hoặc nhánh làm việc của bạn) và môi trường cloud phù hợp.

`AGENTS.md` ở gốc dự án và 10 skill trong `.agents/skills/` hướng dẫn Codex làm việc trên code hiện có. Không cần dán link GitHub vào ô **Quản lý biến môi trường** để dùng chúng. Kết nối MCP/Figma/Sentry được thiết lập riêng theo công cụ và tài khoản của phiên.

## Prompt mẫu

```text
Đọc AGENTS.md của chung-cu-starter và
.agents/skills/frontend-ui-engineering/SKILL.md.

Hãy sửa giao diện [trang/component] theo [mô tả hoặc link Figma].
Làm trực tiếp trong frontend/ hiện có; giữ React/JavaScript/Vite,
navigation, API và chức năng đang chạy. Không khởi tạo ứng dụng mới.
Giữ đúng các nghiệp vụ, API và phân quyền hiện tại. Dùng Dialog chung cho form/bảng liên quan; giữ bộ lọc, vị trí cuộn và nội dung nhập khi lưu lỗi.

Kiểm tra responsive, các tương tác chính, bàn phím và console/network.
Chạy npm run build từ gốc dự án; báo file đã sửa và kết quả kiểm chứng.
```

## Chuẩn bị môi trường

Node.js 24; chạy `npm ci` tại gốc repository. Để chạy app, dùng hai terminal tại gốc: `npm run dev:backend` và `npm run dev:frontend`. Kiểm tra backend `/api/health`, frontend và luồng gọi API qua Vite proxy theo `AGENTS.md`.

Ứng dụng nghiệp vụ cần MySQL và `.env` cục bộ theo README. `npm run test:ui` dùng fixture để kiểm tra UI mà không cần MySQL; `npm test`/`npm run test:e2e` dùng database kiểm thử riêng. Không in cấu hình/mật khẩu, không tạo lại dữ liệu chỉ để sửa giao diện. Tài liệu nguồn và bản công cụ tùy chọn: `https://github.com/tunato2807-del/agents-ai`.
