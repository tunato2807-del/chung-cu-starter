# Bật camera trong web trên điện thoại qua Wi-Fi

Camera trong trình duyệt cần secure context: HTTPS với chứng chỉ được thiết bị tin cậy, hoặc localhost trên chính thiết bị đó. HTTP qua IP như `192.168.1.208` có thể mở form nhưng không được phép bật camera trong trang. Ứng dụng Camera của điện thoại vẫn có thể quét mã dán chứa URL HTTP để mở form.

Các bước dưới dành cho Windows và Android cùng Wi-Fi. Dùng IP Wi-Fi hiện tại của máy tính; thay `192.168.1.208` nếu IP thay đổi. Giữ backend và MySQL đang chạy như bình thường. HTTPS được xử lý ở Vite, `/api` vẫn chuyển tiếp tới backend loopback trên cùng máy.

## 1. Lấy bản code có cấu hình HTTPS

Nếu đã clone repository bằng Git:

```powershell
git pull --ff-only origin codex/auth-qr-incidents
```

Nếu đã tải ZIP, tải lại ZIP của nhánh `codex/auth-qr-incidents` và thay các file mã nguồn đã cập nhật; giữ `.env`, `backend/.demo-credentials` và dữ liệu local. Có thể chép riêng `frontend/vite.https.config.js` và các thay đổi scripts trong hai file package.json. Không thay file `.env` bằng file của máy khác.

## 2. Tạo chứng chỉ phát triển bằng mkcert

Cài mkcert từ package Winget `FiloSottile.mkcert` (hoặc release chính thức https://github.com/FiloSottile/mkcert). Chạy PowerShell:

```powershell
winget install --id FiloSottile.mkcert --exact
```

Mở lại terminal để nhận PATH mới. Tại thư mục gốc dự án:

```powershell
mkcert -install
New-Item -ItemType Directory -Force .certs
mkcert -cert-file .certs/dev-cert.pem -key-file .certs/dev-key.pem localhost 127.0.0.1 192.168.1.208
Copy-Item (Join-Path (mkcert -CAROOT) 'rootCA.pem') .certs/rootCA.crt
```

`mkcert -install` cài CA phát triển vào máy tính và có thể yêu cầu quyền quản trị. Thư mục `.certs` được Git bỏ qua. Chỉ chuyển file **rootCA.crt** sang điện thoại; giữ các file khóa riêng `dev-key.pem` và `rootCA-key.pem` trên máy tính.

## 3. Cho điện thoại tin cậy CA phát triển

Chuyển `.certs/rootCA.crt` vào bộ nhớ điện thoại qua USB hoặc phương thức chuyển file bạn đang dùng. Trên Android, tìm **Cài đặt → Bảo mật → Cài đặt chứng chỉ → Chứng chỉ CA**, rồi chọn `rootCA.crt`. Tên menu phụ thuộc hãng điện thoại; có thể tìm “Chứng chỉ CA” trong phần cài đặt. Xác nhận cài CA của máy phát triển, rồi đóng/mở lại Chrome. Đây là CA dành riêng cho môi trường thử nghiệm; có thể gỡ trong danh sách chứng chỉ người dùng khi thử xong.

## 4. Chạy HTTPS

Dừng terminal Vite cũ bằng Ctrl+C. Giữ terminal backend, rồi chạy ở terminal frontend tại gốc dự án:

```powershell
npm run dev:frontend:https
```

Trên cả máy tính và điện thoại mở:

```text
https://192.168.1.208:5173
```

Trang phải mở được **không có cảnh báo chứng chỉ**. Nếu còn cảnh báo, kiểm tra lại CA đã cài đúng, IP có trong chứng chỉ và ngày giờ thiết bị. Không bỏ qua xác minh chứng chỉ để dùng camera. Nếu máy đổi IP, tạo lại dev-cert.pem/dev-key.pem với IP mới; không cần tạo lại CA.

Trên máy tính đăng nhập BQL → Vị trí & QR → Xem QR qua địa chỉ HTTPS này để QR có URL HTTPS cùng origin. Không cần thay token QR. Trên điện thoại vào Quét QR → Mở camera → Cho phép. Hướng camera về mã trên màn hình máy tính.

Nếu HTTPS đã tin cậy nhưng camera vẫn lỗi: kiểm tra quyền Camera của trang trong Chrome, quyền Camera của ứng dụng Chrome trong Android và đóng ứng dụng khác đang sử dụng camera. Không mở trang qua trình duyệt nhúng của ứng dụng chat.

## Xác minh tự động

`npm run test:https` cần OpenSSL. Kiểm tra này tạo CA tạm, xác minh TLS bằng CA đó, kiểm tra Vite phục vụ frontend và proxy `/api`; không cài CA thử vào hệ điều hành và không tắt xác minh TLS. Nó không thay thế kiểm thử camera trên điện thoại thật.
