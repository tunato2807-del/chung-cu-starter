# Cửa sổ thao tác: cập nhật qua Terminal VS Code

Bản cập nhật dùng code nghiệp vụ trên `codex/thesis-mysql-database` và tích hợp lên `main`. Giữ React/Vite, MySQL, API, phân quyền và cấu trúc dữ liệu hiện có.

## Những gì thay đổi

- Thêm, sửa, chuyển căn, bàn giao tài khoản, phân công, nghiệm thu, duyệt/gửi hóa đơn, đặt lịch và thu chi mở ngay trong cửa sổ.
- Bảng chi tiết, lịch sử, dữ liệu liên quan và biểu đồ có nút mở/đóng; danh sách chính rộng hơn, không còn form nằm bên cạnh hoặc cuối trang.
- Đóng bằng dấu ×, nút Đóng hoặc Esc. Tab/Shift+Tab nằm trong cửa sổ; khi đóng, bàn phím trở lại nút vừa bấm.
- Giữ bộ lọc, trang danh sách và vị trí cuộn ở nền. Khi lưu thành công, cập nhật dữ liệu và đóng form tương ứng. Khi lưu lỗi, giữ form và nội dung đã nhập. Trong khi gửi, tạm khóa nút đóng để tránh ngắt thao tác.
- Liên kết chi tiết vẫn có URL riêng: mở URL trực tiếp sẽ mở trang chi tiết; bấm từ danh sách sẽ mở cửa sổ trên danh sách. Nút Quay lại của trình duyệt cũng đóng được cửa sổ chi tiết.
- QR vị trí vẫn là bảng xem nhỏ chỉ chứa mã QR cạnh nút Xem QR. QR thanh toán được mở riêng bằng nút Xem QR thanh toán.

## Máy đã có bản Git

Dừng frontend bằng Ctrl+C. Trong Terminal tại đúng thư mục có `package.json`:

```powershell
git status --short
git pull --ff-only origin main
npm.cmd run dev:frontend
```

Bản sửa này không đổi dependency/lockfile nên máy đang chạy bình thường không cần cài lại `node_modules`. Nếu máy báo thiếu Vite/dependency, dừng cả backend và frontend rồi mới chạy `npm.cmd ci --include=dev` để tránh lỗi khóa file trên Windows.

Lệnh cập nhật code gọn nhất là `git pull --ff-only origin main`. Dùng `main` hoặc nhánh nghiệp vụ gốc chưa có commit riêng; bản cập nhật giữ lịch sử của hai nhánh đó. Nếu Git báo có sửa đổi cục bộ hoặc không thể fast-forward, dừng và giữ lại bản sửa để đối chiếu; không dùng `reset --hard` hay xóa thư mục để ép cập nhật.

Không chép file lẻ từ các bài hướng dẫn cũ vào bản mới. Lần thay đổi giao diện này không thêm migration và không cần tạo lại dữ liệu. `.env`, `.certs/`, `backend/storage/` và dữ liệu MySQL hiện có vẫn là cấu hình/dữ liệu cục bộ, không nằm trong commit giao diện.

## Tải code sang thư mục mới

Tại thư mục cha chưa có `chung-cu-dialogs`:

```powershell
git clone --branch main https://github.com/tunato2807-del/chung-cu-starter.git chung-cu-dialogs
Set-Location chung-cu-dialogs
npm.cmd ci --include=dev
```

Thư mục mới chưa có cấu hình/mật khẩu/database riêng. Cài hoàn toàn mới theo [hướng dẫn cài mới](cai-moi-hoan-toan-vscode.md); máy có dữ liệu cũ theo [hướng dẫn CSDL MySQL](csdl-do-an-mysql.md). Đừng chạy bộ tạo dữ liệu mới chỉ để cập nhật giao diện.

## Chạy và kiểm tra

Backend vẫn chạy trong terminal riêng bằng `npm.cmd run dev:backend`; frontend bằng `npm.cmd run dev:frontend`. Máy đã dùng HTTPS tiếp tục dùng `npm.cmd run dev:frontend:https` và chứng chỉ hiện có.

```powershell
npm.cmd run build
npm.cmd run test:ui
```

`test:ui` dùng dữ liệu kiểm thử trong trình duyệt, không kết nối database, không đọc `.env` riêng và không xác nhận nghiệp vụ MySQL. Trên Windows, nếu chưa có Chromium cho Playwright, cài bằng `npx.cmd playwright install chromium`. Trên Linux môi trường cloud, dùng browser đã khai báo trong lockfile.

`npm.cmd run test:e2e` dùng database `chung_cu_test` và các server riêng trên 3101/5174. Cần MySQL và quyền tạo database kiểm thử; không trỏ kiểm thử tới database đang sử dụng. Xem README để chạy bộ nghiệm thu tích hợp.

## Các file dùng chung

- `frontend/src/shared/Dialog.jsx`, `Dialog.css`, `dialog-state.js`: cửa sổ, trạng thái đang gửi, focus, khóa cuộn.
- `frontend/src/shared/PageActions.jsx`: đưa nút thao tác lên đầu màn hình/cửa sổ.
- `frontend/src/shared/dialog-navigation.jsx`: mở bản ghi trên danh sách và trở lại đúng bộ lọc.
- `frontend/src/shared/ui.jsx`, `resource-events.js`: làm mới dữ liệu sau khi đóng; ngăn dữ liệu phiên trước xuất hiện ở tài khoản mới.
- `frontend/src/app/App.jsx`, `Layout.jsx`: giữ màn hình nền khi mở các lớp chi tiết.

Các module nghiệp vụ gọi lại API cũ. Không thay API thật bằng dữ liệu mẫu trong ứng dụng.

## Ảnh giao diện đã chạy

Ảnh chụp Chromium dùng dữ liệu kiểm thử, không chứa thông tin cư dân hoặc mật khẩu thật:

- [Cửa sổ trên máy tính, 1440 px](cua-so-thao-tac/may-tinh.png).
- [Cửa sổ trên điện thoại, 320 px](cua-so-thao-tac/dien-thoai.png).

Định hướng của lần sửa là đưa thao tác và nội dung liên quan vào cửa sổ ngay tại màn hình đang làm việc. Dùng màu, chữ và nút hiện có; form cuộn ở bên trong, tiêu đề/nút đóng luôn nhìn thấy; bảng dài có vùng cuộn ngang riêng.

## Kiểm chứng bản cập nhật ngày 14/11/2026

- Node.js 24.19.0; build production bằng Vite thành công.
- `scripts/check-local.js`: 0 lỗi file/dependency.
- Bộ Playwright đầy đủ: **96/96 đạt** trên Chromium, có API và MySQL 8.0.46 kiểm thử riêng. Bao gồm cư trú/chuyển căn trong ngày, tài khoản/bàn giao, phản ánh QR và ảnh, phân công/nghiệm thu, hóa đơn/thu phí, bảo trì, tiện ích, quỹ/chứng từ, Excel/PDF và lỗi/quyền truy cập.
- Cửa sổ và bố cục được kiểm tra ở 320, 768, 1024, 1440 px; các quy trình nghiệp vụ chạy ở desktop và viewport điện thoại. Đây là kiểm thử browser tự động; chưa xác nhận camera/chứng chỉ trên điện thoại vật lý của người dùng.
- Giữ nguyên backend, schema và lockfile trong lần sửa này. Build còn cảnh báo kích thước chunk của thư viện QR hiện có; không chặn build.
