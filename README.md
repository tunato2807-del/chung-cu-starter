# Khung dự án quản lý chung cư và phản ánh QR

JavaScript + React/Vite + Express; MySQL ở bước thiết kế. Đây là bộ khung khởi đầu, chưa phải hệ thống hoàn chỉnh.

## Mở trong VS Code

Giải nén, chọn File → Open Folder → chung-cu-starter. Mở Terminal → New Terminal.
Dùng Node.js 24 LTS và npm.

```bash
npm install
npm run dev:backend
```

Mở terminal thứ hai tại cùng thư mục:

```bash
npm run dev:frontend
```

Mở URL Vite in ra (thường http://localhost:5173). API mặc định http://127.0.0.1:3000/api/health. Chưa cần cài MySQL để xem khung. Nếu đổi cổng backend, cập nhật proxy trong frontend/vite.config.js.

## Hiện đã có

- Giao diện khung với menu bốn nhóm người dùng; chọn nhóm chỉ để xem trước.
- Luồng React gọi API health, phản hồi thành công và lỗi kết nối.
- Express với routes/controller/service mẫu, lỗi JSON, lỗi chung và 404.
- Thư mục dành sẵn cho các nghiệp vụ, hướng dẫn trách nhiệm từng tầng.

## Chưa có

Đăng nhập, phân quyền thật, MySQL, lưu phản ánh, quét QR, tải ảnh, hóa đơn và xác nhận thanh toán. Các trang đang hiển thị placeholder; README trong mỗi module mô tả tệp sẽ tạo tiếp. Không sử dụng cho dữ liệu thật.

## Kiểm tra build

```bash
npm run build
```

Xem docs/architecture.md và database/README.md trước khi triển khai nghiệp vụ. Vite proxy chỉ dùng cho dev; khi triển khai cần cấu hình phục vụ frontend và /api trên cùng origin.

## Sửa giao diện với Codex

Chọn repository `tunato2807-del/chung-cu-starter` trong Codex Web. Dự án có [AGENTS.md](AGENTS.md), 10 skill trong `.agents/skills/` và [prompt mẫu](docs/CODEX_UI.md) để chỉnh UI trên React/JavaScript/Vite hiện có. Không cần thêm link GitHub vào biến môi trường; MCP/plugin dùng cấu hình công cụ hoặc kết nối tài khoản riêng.
