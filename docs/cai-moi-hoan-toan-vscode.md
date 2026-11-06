# Cài mới hoàn toàn trên Windows / VS Code

Quy trình này thay cho bước chép tệp từ bản cũ. Tạo `.env`, khóa JWT, database, tài khoản web, ảnh minh họa và token QR mới; không chép `.env`, `.certs`, `backend/storage` hoặc `.demo-credentials` cũ. MySQL đã cài trên máy vẫn dùng được: chỉ dùng dịch vụ và thông tin kết nối, không đọc bảng dữ liệu của dự án cũ. Database cũ không bị sửa hoặc xóa.

## 1. Tải vào thư mục trống

Cần Git, Node.js 24 và MySQL 8.0.21+ hoặc 8.4 đang chạy. Dừng backend/frontend cũ bằng Ctrl+C; giữ dịch vụ MySQL. Trong PowerShell của VS Code:

```powershell
& {
    $ErrorActionPreference = 'Stop'
    $projectDirectory = 'D:\DO_AN\chung-cu-starter-fresh'
    if (Test-Path -LiteralPath $projectDirectory) {
        throw 'Thư mục đã tồn tại. Đổi tên đích thành chung-cu-starter-fresh2 để cài bản mới riêng.'
    }
    New-Item -ItemType Directory -Force 'D:\DO_AN' | Out-Null
    git clone --branch codex/thesis-mysql-database --single-branch https://github.com/tunato2807-del/chung-cu-starter.git $projectDirectory
    if ($LASTEXITCODE -ne 0) { throw 'Git clone chưa thành công.' }
    Set-Location -LiteralPath $projectDirectory
    npm.cmd ci --include=dev --workspaces --include-workspace-root --bin-links=true
    if ($LASTEXITCODE -ne 0) { throw 'Chưa cài xong thư viện.' }
    npm.cmd run init:fresh
    if ($LASTEXITCODE -ne 0) { throw 'Chưa tạo được cấu hình mới.' }
    code .
}
```

`init:fresh` không đọc tệp cấu hình cũ. Nó chỉ ghi độc quyền `.env` khi chưa có tệp, tạo tên database ngẫu nhiên dạng `chung_cu_nghiem_thu_moi...` và khóa JWT mới. Nếu đã có `.env`, lệnh dừng để bạn chọn thư mục cài mới khác.

## 2. Nhập thông tin kết nối MySQL trên máy

```powershell
code .env
```

Với MySQL cài riêng trên máy bạn, kiểm tra các dòng:

```dotenv
DB_ENGINE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD="MAT_KHAU_MYSQL_TREN_MAY_BAN"
```

Thay mật khẩu mẫu bằng mật khẩu quản trị MySQL mà bạn nhập khi mở MySQL Command Line Client. Đây là mật khẩu kết nối dịch vụ MySQL, không phải mật khẩu web. Nếu dùng user/cổng khác thì điền đúng thông tin của dịch vụ. Tài khoản MySQL cần quyền tạo database. Giữ `FRESH_INSTALL=1`, `DB_NAME` và `JWT_SECRET` mới sinh; không chép giá trị từ bản cũ. Không gửi mật khẩu lên chat hoặc GitHub.

## 3. Tạo bộ dữ liệu mới

Để dùng trên máy tính trước:

```powershell
npm.cmd run db:realistic:fresh
```

Lệnh mặc định tạo QR với origin `http://localhost:5173`. Database đích lấy từ `.env` mới; lệnh dùng `CREATE DATABASE` bắt buộc mới. Nếu tên đích đã tồn tại, lệnh dừng trước migration/seed và không sử dụng dữ liệu bên trong. Không có tùy chọn chọn lại database cũ hoặc reset.

Chờ đến dòng **Hoàn tất**. Lệnh tự chạy schema mới và tạo bộ mô phỏng 200 căn, 400 cư dân, 13 kỳ hóa đơn cùng phản ánh, bảo trì, tiện ích và thu chi. Mật khẩu web và token QR được sinh mới. Tên và số liệu là dữ liệu mô phỏng theo mã bộ sinh, không phải dữ liệu cư dân lấy từ website.

Nếu lần tạo đã thành công, không chạy lại lệnh tạo dữ liệu: chuyển sang bước chạy backend. Nếu thất bại, xem lỗi và manifest; database/tệp dở dang được giữ để kiểm tra, không có thao tác reset tự động.

## 4. Chạy web với cấu hình mới

Terminal thứ nhất, tại thư mục mới:

```powershell
npm.cmd run dev:backend
```

Terminal thứ hai:

```powershell
npm.cmd run dev:frontend
```

Mở `http://localhost:5173` bằng cửa sổ ẩn danh. Backend tự đọc đúng `DB_NAME` mới trong `.env`; quy trình này không cần `start:backend:acceptance` hoặc truyền tên bộ dữ liệu cũ.

Terminal thứ ba, mở tài khoản và QR vừa tạo:

```powershell
$tenCSDL = node --env-file=.env --input-type=module -e "console.log(process.env.DB_NAME)"
code ".\backend\storage\acceptance\$tenCSDL\TAI-KHOAN.md"
code ".\backend\storage\acceptance\$tenCSDL\README.md"
Start-Process ".\backend\storage\acceptance\$tenCSDL\QR.html"
```

Tài khoản/mật khẩu trong tệp là của database mới. Tệp và ảnh được tạo mới trong thư mục mới, không lấy từ bản cũ. Thư mục storage và `.env` được Git bỏ qua.

## 5. HTTPS mới cho điện thoại, không chép chứng chỉ cũ

Để bật camera trong web trên điện thoại, máy và điện thoại cần cùng Wi-Fi, HTTPS và chứng chỉ được tin cậy. Có thể thực hiện phần này trước bước 3 nếu muốn toàn bộ tệp QR tạo sẵn có URL HTTPS ngay từ đầu.

Tại gốc dự án mới, tải mkcert Windows AMD64 chính thức và tạo CA mới riêng trong `.certs/ca`:

```powershell
$ipMayTinh = '192.168.1.208'
New-Item -ItemType Directory -Force .certs\ca | Out-Null
Invoke-WebRequest -UseBasicParsing `
    -Uri 'https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe' `
    -OutFile '.certs\mkcert.exe'
if ((Get-FileHash '.certs\mkcert.exe' -Algorithm SHA256).Hash -ne 'D2660B50A9ED59EADA480750561C96ABC2ED4C9A38C6A24D93E30E0977631398') {
    throw 'Tệp mkcert không khớp checksum; dừng cài đặt.'
}
$env:CAROOT = (Resolve-Path '.certs\ca').Path
& '.\.certs\mkcert.exe' -install
if ($LASTEXITCODE -ne 0) { throw 'Chưa cài được CA mới.' }
& '.\.certs\mkcert.exe' -cert-file .certs/dev-cert.pem -key-file .certs/dev-key.pem localhost 127.0.0.1 $ipMayTinh
if ($LASTEXITCODE -ne 0) { throw 'Chưa tạo được chứng chỉ HTTPS mới.' }
Copy-Item '.certs\ca\rootCA.pem' '.certs\rootCA.crt'
```

Thay IP bằng địa chỉ Wi-Fi hiện tại từ `ipconfig`. `CAROOT` trỏ tới CA vừa tạo trong dự án mới, không dùng CA cũ trong thư mục người dùng. Nếu Windows hỏi quyền cài chứng chỉ, đó là bước cài CA phát triển vào kho tin cậy của máy. Chỉ chuyển `.certs/rootCA.crt` sang điện thoại và cài tại **Cài đặt → Bảo mật → Chứng chỉ CA**; giữ mọi tệp khóa riêng trên máy tính.

Dừng frontend HTTP bằng Ctrl+C, rồi chạy:

```powershell
npm.cmd run dev:frontend:https
```

Mở `https://192.168.1.208:5173` với IP đã chọn, đăng nhập BQL → **Vị trí & QR** → xem/in QR. URL QR trong web dùng origin HTTPS đang mở nên không cần tạo lại database nếu đã làm bước 3 qua HTTP. `QR.html` tạo ở bước 3 vẫn giữ origin lúc tạo; dùng QR trong màn BQL sau khi chuyển HTTPS.

Nếu làm HTTPS trước khi tạo dữ liệu, ở bước 3 dùng lệnh sau để tất cả PNG/QR.html có đúng URL điện thoại ngay từ đầu:

```powershell
npm.cmd run db:realistic:fresh -- --origin=https://192.168.1.208:5173
```

Không chạy lại lệnh này nếu bước 3 đã tạo thành công. Khi IP thay đổi, cấp lại chứng chỉ cho IP mới bằng CA của chính bản cài mới và xem/in QR qua địa chỉ HTTPS mới.

Nếu mở terminal mới để cấp lại chứng chỉ, đặt lại `$env:CAROOT = (Resolve-Path '.certs\ca').Path` trước khi chạy mkcert để tiếp tục dùng CA của bản cài này.

## Kiểm chứng code cài mới

18 kiểm tra helper/CLI và MySQL 8.0.46 đạt: tên database/khóa mới khác nhau giữa các lần khởi tạo; `.env` có sẵn không bị đọc/ghi đè; không nhận tên database cũ hoặc cờ reset; MySQL từ chối database đã tồn tại trước migration/seed và bản ghi kiểm thử vẫn nguyên vẹn. Bộ sinh dữ liệu nền được kiểm chứng riêng trong [báo cáo quy mô lớn](kiem-chung-du-lieu-mo-phong.md). Việc cài chứng chỉ và camera cần thực hiện trên máy/điện thoại của bạn.
