# Sửa lỗi trộn App và menu giữa hai phiên bản

Người dùng báo lỗi `App.jsx:21 Cannot read properties of undefined (reading 'filter')`. Đã tái hiện trong Chromium bằng App của 89f4e60 và cấu trúc navigation bản nghiệp vụ: root rỗng, cùng lỗi filter. Xem [trước sửa](blank-screen-before.json).

## Sửa đúng bản trên máy người dùng

[Hướng dẫn hai file khôi phục](khoi-phuc-ban-nghiep-vu-vscode.md) chứa nguyên văn App.jsx và global.css của 2f00acd (nhánh codex/auth-qr-incidents). Đã kiểm tra nội dung hai khối code trùng byte với file nguồn dùng để build. Không sửa backend hoặc database.

Đã giải nén frontend đúng phiên bản vào thư mục kiểm tra tạm, cài theo lockfile bằng `npm ci --workspace frontend --include-workspace-root=false`, rồi chạy `npm run build`: thành công, 158 module. Build có cảnh báo chunk lớn và chỉ thị use client từ React Router như bản cũ; không thay dependency hay nới kiểm tra để bỏ cảnh báo.

Browser smoke test bản khôi phục: cổng dịch vụ hiện sáu dịch vụ, tìm `hoa don`, chọn hóa đơn chuyển sang đăng nhập, mở route quét QR và tra cứu. Trang chủ không tràn ngang ở 320/768/1024/1440px, không có pageerror. Trạng thái phiên chưa đăng nhập được mô phỏng bằng HTTP 401; không thử đăng nhập thật, camera, ghi phản ánh hoặc database trong kiểm tra này. [Báo cáo](restored-business-report.json).

## Bảo vệ riêng cho bộ khung main

App của main nay nhận diện menu không tương thích và hiển thị liên kết khôi phục rõ ràng thay vì lỗi render. Không dùng mảng rỗng làm màn hình nghiệp vụ giả. Bản main hợp lệ vẫn mở Tổng quan và đủ tám mục menu BQL. Kiểm tra tại 320/1440px không tràn ngang, không có pageerror. [Sau sửa](blank-screen-after.json).

`verify-branch-mismatch.mjs` dùng cùng các biến UI_QA_PLAYWRIGHT, UI_QA_CHROMIUM, UI_QA_ORIGIN, UI_QA_OUTPUT được mô tả trong verification.md. Chạy với UI_EXPECT_BROKEN=1 trên 89f4e60 để tái hiện trước sửa; bỏ biến đó trên bản mới để kiểm tra khắc phục. Script chỉ chặn response module navigation trong trình duyệt của bài kiểm tra, không thay file menu trên đĩa.
