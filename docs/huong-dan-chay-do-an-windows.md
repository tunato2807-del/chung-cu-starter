# Hướng dẫn chạy đồ án trên Windows và VS Code

> **Bản sửa 30/10/2026:** [copy đủ file và migrate lên schema 019](cap-nhat-4-loi-sau-ra-soat-vscode.md) trước khi chạy backend. Chọn đúng database thường/nghiệm thu; không tạo lại dữ liệu hoặc mật khẩu.

**Đề tài:** Xây dựng hệ thống quản lý vận hành chung cư và tiếp nhận phản ánh cư dân.

Hướng dẫn cập nhật ngày **30/10/2026**, dành cho bản nghiệp vụ trên nhánh `codex/editorial-business-ui`. Các lệnh dưới đây chạy trong **PowerShell**, tại thư mục gốc chứa `package.json`, `backend/` và `frontend/`:

```powershell
Set-Location "D:\DO_AN\chung-cu-starter-codex-auth-qr-incidents"
```

Máy đã được thiết lập trong quá trình làm đồ án dùng Node.js 24, MySQL cài riêng ở cổng 3306 và bộ dữ liệu mẫu `chung_cu_nghiem_thu`. Nếu bạn đang dùng máy đó, bắt đầu từ **mục 1**. Mục 5 dành cho máy mới hoặc khi vừa cập nhật code/dependency.

## 1. Mở dự án và MySQL

1. Mở VS Code → **File → Open Folder** → chọn thư mục dự án ở trên.
2. Bảo đảm dịch vụ MySQL đang chạy. Trên Windows, nhấn **Win+R**, nhập `services.msc`, tìm dịch vụ MySQL của máy và kiểm tra trạng thái **Running**; chọn **Start** nếu đang dừng.
3. Mở các terminal bằng **Terminal → New Terminal**. Mỗi terminal đều cần đứng ở thư mục gốc dự án.

Web gồm ba thành phần:

| Thành phần | Địa chỉ/cổng mặc định | Công dụng |
| --- | --- | --- |
| MySQL cài riêng | `127.0.0.1:3306` | Lưu dữ liệu |
| Backend Express | `http://127.0.0.1:3000` | Xử lý API, đăng nhập và nghiệp vụ |
| Frontend Vite | `https://localhost:5173` khi chạy HTTPS | Giao diện trên trình duyệt |

Frontend chuyển tiếp `/api` đến backend ở cổng 3000. Trình duyệt mở cổng **5173** để sử dụng đồ án.

## 2. Chạy backend với bộ dữ liệu nghiệm thu đã tạo

Trong **terminal 1**:

```powershell
npm run start:backend:acceptance
```

Khi xuất hiện dòng sau, giữ terminal này chạy:

```text
API: http://127.0.0.1:3000/api/health
```

Lệnh này luôn chọn `chung_cu_nghiem_thu`, kể cả khi mở terminal mới. Backend in rõ dòng `Database: "chung_cu_nghiem_thu"` và đường dẫn `TAI-KHOAN.md` tương ứng. Bộ khác có thể chọn bằng `npm run start:backend:acceptance -- chung_cu_nghiem_thu_b2`.

Lệnh `start` phù hợp lúc trình diễn đồ án. Khi đang sửa code backend và muốn tự khởi động lại sau mỗi lần lưu, dùng **`npm run dev:backend:acceptance` thay cho lệnh `start:backend:acceptance`** trong cùng terminal.

### Muốn dùng dữ liệu làm việc ban đầu thay vì bộ nghiệm thu

Nhấn **Ctrl+C** để dừng backend, sau đó chạy trong chính terminal đó:

```powershell
Remove-Item Env:DB_NAME -ErrorAction SilentlyContinue
npm run start -w backend
```

Backend sẽ lấy tên database từ `.env` của bạn, thường là `chung_cu`. Đăng xuất rồi đăng nhập lại khi đổi database, hoặc mở một cửa sổ ẩn danh để tránh dùng phiên đăng nhập của bộ khác.

## 3. Chạy frontend và mở web

### Dùng HTTPS để thử camera trên điện thoại

Bạn đã tạo chứng chỉ bằng mkcert trước đó. Với hai file `.certs/dev-cert.pem` và `.certs/dev-key.pem` còn trên máy, chạy trong **terminal 2**:

```powershell
npm run dev:frontend:https
```

Giữ terminal chạy rồi mở trên máy tính:

```text
https://localhost:5173/
```

Đăng nhập bằng tài khoản của **đúng database** đang chạy. Với bộ nghiệm thu, mở file sau trong VS Code để lấy tên đăng nhập và mật khẩu:

```text
backend/storage/acceptance/chung_cu_nghiem_thu/TAI-KHOAN.md
```

Tài khoản demo của database làm việc được lưu riêng trong `backend/.demo-credentials`. Mật khẩu được sinh ngẫu nhiên; tài khoản của bộ nghiệm thu không dùng chung với tài khoản demo.

### Nếu chỉ thử trên máy tính và chưa có chứng chỉ

Thay lệnh HTTPS bằng:

```powershell
npm run dev:frontend
```

Mở `http://127.0.0.1:5173/`. Chỉ chọn **một** cách chạy frontend. Nếu cổng 5173 đã có Vite chạy, dùng terminal đang chạy đó hoặc nhấn Ctrl+C để dừng trước khi đổi cách chạy.

## 4. Kiểm tra hệ thống và truy cập bằng điện thoại

Trong **terminal 3**, khi backend vẫn đang chạy:

```powershell
node scripts/check-local.js --api http://127.0.0.1:3000
```

Kết quả mong đợi:

```text
[OK] API: /api/health: HTTP 200, sẵn sàng.
[OK] API: /api/ready: HTTP 200, sẵn sàng.
0 lỗi.
```

`health` xác nhận API trả lời; `ready` kiểm tra kết nối database và schema. Kiểm tra này không thay cho việc tự thử các chức năng trên giao diện.

### Mở trên điện thoại và thử quét QR

1. Kết nối điện thoại và máy tính vào cùng Wi-Fi.
2. Trên máy tính chạy `ipconfig`, lấy **IPv4 Address của adapter Wi-Fi đang kết nối**, không lấy địa chỉ Radmin VPN hoặc VMware.
3. Khi frontend chạy HTTPS, trên điện thoại mở `https://IP-WIFI:5173/`. Ví dụ địa chỉ bạn từng dùng là `https://192.168.1.208:5173/`; thay IP nếu máy đã đổi địa chỉ.
4. Điện thoại phải tin cậy CA phát triển đã cài từ `.certs/rootCA.crt`; địa chỉ IP đang mở phải có trong chứng chỉ. Trang cần mở được không có cảnh báo chứng chỉ trước khi thử nút **Mở camera**.
5. Trên máy tính, mở web bằng cùng địa chỉ HTTPS qua IP, đăng nhập BQL → **Vị trí & QR** → xem mã QR. Trên điện thoại vào **Quét QR → Mở camera**, cấp quyền rồi quét mã trên màn hình máy tính.

Với bộ nghiệm thu đã tạo, bạn cũng có thể mở `backend/storage/acceptance/chung_cu_nghiem_thu/QR.html` trên máy tính để xem/in QR. Các liên kết này giữ địa chỉ khi tạo bộ mẫu. Nếu IP đã đổi, dùng trang **Vị trí & QR** qua địa chỉ mới để tạo lại ảnh QR từ token đang lưu.

Nếu máy đổi IP, dùng mkcert đã tải trong `.certs` để tạo lại chứng chỉ. Ví dụ dưới dành cho IP `192.168.1.208`; thay bằng IP Wi-Fi hiện tại trước khi chạy, rồi khởi động lại frontend HTTPS:

```powershell
& ".\.certs\mkcert.exe" -cert-file .certs/dev-cert.pem -key-file .certs/dev-key.pem localhost 127.0.0.1 192.168.1.208
```

Nếu điện thoại không mở được trang, kiểm tra hai thiết bị cùng mạng và cho phép Node.js qua Windows Firewall trên mạng riêng đang sử dụng. HTTP qua IP có thể mở biểu mẫu nhưng trình duyệt không cấp camera trong trang; HTTPS tin cậy là cách chạy để thử đầy đủ camera.

Nếu đang thiết lập máy mới chưa có chứng chỉ, xem [cách cài mkcert và cài CA trên điện thoại](https-local.md). Chỉ cần thiết lập chứng chỉ một lần cho máy/thiết bị; khi đổi IP, tạo lại chứng chỉ chứa IP mới như ở trên.

## 5. Cài lần đầu hoặc sau khi cập nhật mã nguồn

### Cài dependency

Chạy ở gốc dự án, sau khi dừng các tiến trình backend/frontend của dự án:

```powershell
node --version
npm --version
npm ci --include=dev --workspaces --include-workspace-root --bin-links=true
```

Khuyến nghị Node.js **24**. Vite là dependency phát triển nên cần cài cả devDependencies. Chỉ chạy lại bước cài khi chuẩn bị máy mới, thiếu dependency hoặc các file `package.json`/`package-lock.json` đã thay đổi.

### Thiết lập database trên máy mới

Nếu `.env` chưa có, chạy:

```powershell
npm run init:local
```

Lệnh tạo file với thông tin ngẫu nhiên; nếu `.env` đã tồn tại thì giữ nguyên. Cấu hình khởi tạo mặc định dành cho Docker ở cổng 3307. **Với MySQL cài riêng như máy bạn**, mở `.env` trong VS Code và điền đúng kết nối:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_NAME=chung_cu
```

Điền `DB_PASSWORD` bằng mật khẩu MySQL của máy bạn; giữ `JWT_SECRET` do `init:local` tạo. Nếu dùng tài khoản MySQL khác, điền tên và mật khẩu của tài khoản đó.

Chỉ khi database chưa có, mở MySQL Command Line Client bằng tài khoản quản trị và tạo:

```sql
CREATE DATABASE IF NOT EXISTS chung_cu
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

SQL được chạy ở dấu nhắc `mysql>`. Các lệnh `npm`/`node` chạy trong PowerShell. Nếu dùng tài khoản MySQL khác `root`, tài khoản trong `.env` cần có quyền trên database tương ứng.

Mở PowerShell mới tại gốc dự án, sau khi cấu hình kết nối:

```powershell
npm run db:migrate
npm run db:seed
npm run build
```

`db:migrate` áp dụng các migration còn thiếu và kiểm tra checksum. `db:seed` khởi tạo ba tài khoản demo và vị trí QR cơ bản, không phải bộ dữ liệu nghiệm thu đầy đủ; chạy lại không cấp lại mật khẩu tài khoản đã tồn tại. Mật khẩu mới tạo nằm trong `backend/.demo-credentials`.

Khi cập nhật code có migration mới, chạy `db:migrate` cho database cần cập nhật trước khi khởi động lại backend. Cập nhật giao diện đơn thuần không cần tạo lại dữ liệu mẫu.

**Nếu dùng Docker thay cho MySQL cài riêng:** dùng cấu hình được `init:local` tạo, mở Docker Desktop và chạy `npm run db:up` trước migration. Cổng mặc định của Docker là **3307**, còn hướng dẫn MySQL cài riêng ở trên dùng **3306**. Chọn cấu hình của database bạn muốn chạy.

### Tạo bộ dữ liệu nghiệm thu nếu chưa có

Bạn đã tạo thành công bộ `chung_cu_nghiem_thu` trước đó thì dùng tiếp theo mục 2, không chạy lại bộ tạo mỗi ngày.

Trên máy mới dùng MySQL cài riêng, tạo database bằng MySQL Command Line Client trước:

```sql
CREATE DATABASE IF NOT EXISTS chung_cu_nghiem_thu
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

Với tài khoản `root` đã cấu hình trên máy bạn, có thể tiếp tục ngay. Tài khoản MySQL khác cần được cấp quyền trên database này.

Tại PowerShell ở gốc dự án, thay IP bằng IP Wi-Fi hiện tại rồi chạy:

```powershell
node --env-file-if-exists=.env scripts/create-acceptance-data.js --origin=https://192.168.1.208:5173
```

Nếu dùng MySQL Docker của dự án, thêm tùy chọn `--docker`; bộ tạo sẽ tạo database và cấp quyền qua container. Chờ thông báo **Hoàn tất**, sau đó dùng mục 2–4 để chạy web. File hướng dẫn, tài khoản và QR nằm trong `backend/storage/acceptance/chung_cu_nghiem_thu/`.

Bộ tạo từ chối chạy chồng trên database đã có dữ liệu. Muốn một bộ khác để thử lại từ đầu, dùng tên mới như `--database=chung_cu_nghiem_thu_b2` và chọn đúng tên đó khi chạy backend. Với MySQL cài riêng, tạo/cấp quyền cho database tên mới trước. [Hướng dẫn dữ liệu nghiệm thu](../samples/nghiem-thu/README.md) có chi tiết các kịch bản.

## 6. Lỗi thường gặp

Nếu không xác định được đang dùng đúng database/tài khoản/QR, chạy `npm run diagnose` tại terminal mới và đối chiếu dòng Database ở terminal backend. Xem [bản sửa đăng nhập, QR và địa chỉ](sua-dang-nhap-qr-va-dia-chi-vscode.md) để cập nhật đủ code và đọc kết quả chẩn đoán.


| Hiện tượng | Cách xử lý |
| --- | --- |
| `vite is not recognized` | Cài dependency gồm devDependencies từ gốc dự án theo mục 5, sau đó chạy lại build/frontend. |
| `EBUSY ... node_modules\brotli\enc` | Ctrl+C dừng các tiến trình của dự án, lưu code, đóng VS Code/Explorer đang giữ thư mục. Mở PowerShell riêng và chạy lệnh cài bổ sung bên dưới. Nếu vẫn khóa, khởi động lại Windows rồi cài trước khi mở web. |
| `Port 5173 is already in use` | Frontend có thể đang chạy ở terminal khác. Dùng bản đang chạy hoặc dừng nó bằng Ctrl+C; sau đó chỉ chạy một frontend. |
| `EADDRINUSE ... 3000` | Kiểm tra terminal backend cũ; dừng backend cũ trước khi chạy backend mới hoặc đổi database. |
| `health` lỗi kết nối | Kiểm tra backend còn chạy, terminal backend có lỗi khởi động không và cổng có đúng 3000 không. |
| `health` đạt nhưng `ready` lỗi | Kiểm tra dịch vụ MySQL, cổng 3306/3307, thông tin kết nối, database đang chọn và migration. |
| Không đăng nhập được | Kiểm tra backend đang dùng database nào và lấy tài khoản từ đúng file của bộ đó; đăng xuất/đăng nhập lại sau khi đổi database. |
| Camera không mở qua IP | Dùng HTTPS với chứng chỉ được điện thoại tin cậy, đúng IP và cấp quyền camera cho trang/Chrome. |
| Vừa chép code nhưng giao diện cũ | Kiểm tra đang mở đúng thư mục dự án, lưu file, khởi động lại frontend nếu cần và nhấn Ctrl+F5. |

Lệnh cài bổ sung sau khi đã giải phóng thư mục bị khóa:

```powershell
npm install --include=dev --workspaces --include-workspace-root --bin-links=true
npm run build
```

## 7. Dừng đồ án

Nhấn **Ctrl+C** trong terminal frontend và backend; các terminal sẽ trở về dấu nhắc PowerShell. Database và dữ liệu vẫn được giữ. Nếu dùng MySQL Docker, có thể chạy `docker compose stop` khi không dùng nữa để dừng container và giữ volume.

`npm run build` tạo bộ file frontend tại `frontend/dist`; nó không tự chạy backend/MySQL. Khi trình diễn theo hướng dẫn này, vẫn cần giữ MySQL, backend và frontend đang chạy.
