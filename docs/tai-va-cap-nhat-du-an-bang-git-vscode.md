# Tải và cập nhật toàn bộ dự án bằng Terminal VS Code

Cập nhật **02/11/2026**, dành cho Windows PowerShell và repository `tunato2807-del/chung-cu-starter`.

**Nhánh đầy đủ:** `codex/editorial-business-ui`. Nhánh `main` hiện là bản khung cũ. `git clone` lấy toàn bộ mã nguồn đã lưu trên nhánh, gồm backend, frontend, migration, tài liệu và các mẫu có trong Git. `npm ci` cài thư viện theo lockfile. Những lần sau dùng `git pull`, không cần tải ZIP hay copy từng file.

## 1. Kiểm tra công cụ

Trong VS Code chọn **Terminal → New Terminal**, dùng PowerShell:

```powershell
git --version
node --version
npm.cmd --version
```

Khuyến nghị Node.js 24. Nếu không nhận lệnh `git`, cài [Git for Windows](https://git-scm.com/downloads/win), rồi đóng/mở lại VS Code. Không cần `winget`. Nếu GitHub yêu cầu đăng nhập do repository đang để private, dùng cửa sổ đăng nhập của Git Credential Manager; không dán mật khẩu/token vào lệnh hoặc gửi lên chat.

## 2. Tải một lần vào thư mục mới

Giữ bản cũ tại `D:\DO_AN\chung-cu-starter-codex-auth-qr-incidents`. Các lệnh dưới tải sang **`D:\DO_AN\chung-cu-starter-github`**, không ghi đè bản cũ. Dừng terminal backend/frontend của bản cũ bằng Ctrl+C trước khi chuẩn bị chạy bản mới.

Dán cả khối sau vào PowerShell. Nếu thư mục đích đã có, khối lệnh dừng; xem mục 5 để cập nhật bản đã clone.

```powershell
& {
    $ErrorActionPreference = 'Stop'
    $projectDirectory = 'D:\DO_AN\chung-cu-starter-github'

    if (Test-Path -LiteralPath $projectDirectory) {
        throw "Thư mục đã tồn tại: $projectDirectory. Không ghi đè. Xem mục cập nhật bằng git pull."
    }

    New-Item -ItemType Directory -Force 'D:\DO_AN' | Out-Null
    Set-Location 'D:\DO_AN'

    git clone --branch codex/editorial-business-ui --single-branch https://github.com/tunato2807-del/chung-cu-starter.git $projectDirectory
    if ($LASTEXITCODE -ne 0) { throw 'Git clone chưa thành công. Dừng tại đây.' }

    Set-Location -LiteralPath $projectDirectory
    npm.cmd ci --include=dev --workspaces --include-workspace-root --bin-links=true
    if ($LASTEXITCODE -ne 0) { throw 'Cài thư viện chưa thành công. Dừng tại đây.' }

    code .
}
```

Sau khi tải, `git branch --show-current` phải in `codex/editorial-business-ui`. Nếu không nhận lệnh `code`, mã nguồn vẫn đã tải; mở thư mục mới trong VS Code. Thư mục clone có `.git`, vì vậy từ đây có thể cập nhật bằng Git.

## 3. Giữ cấu hình và ảnh từ bản đang dùng trên cùng máy

GitHub không chứa `.env`, `.certs`, `backend/storage`, `backend/.demo-credentials` vì các tệp này là cấu hình, chứng chỉ, ảnh và thông tin tài khoản cục bộ. Database MySQL cũng nằm riêng, không nằm trong `git clone`.

Nếu đang chuyển từ đúng thư mục cũ trên cùng máy, chạy khối sau **trước khi khởi động web mới**. Nó chỉ chép cục bộ những tệp/thư mục đang có ở bản cũ, không đưa lên GitHub; gặp một đích đã tồn tại thì dừng để tránh ghi đè. Nếu đường dẫn bản cũ khác, sửa `$oldDirectory` trước khi chạy. Không chạy lại khối này để cập nhật cấu hình sau khi đã chuyển xong.

```powershell
& {
    $ErrorActionPreference = 'Stop'
    $oldDirectory = 'D:\DO_AN\chung-cu-starter-codex-auth-qr-incidents'
    $newDirectory = 'D:\DO_AN\chung-cu-starter-github'
    $localItems = @('.env', '.certs', 'backend\storage', 'backend\.demo-credentials')

    if (-not (Test-Path -LiteralPath (Join-Path $newDirectory '.git'))) {
        throw 'Thư mục mới chưa được clone bằng Git. Chạy mục 2 trước.'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $oldDirectory '.env'))) {
        throw 'Chưa tìm thấy .env của bản cũ. Kiểm tra lại đường dẫn; không tạo mật khẩu/database mới thay thế.'
    }

    foreach ($relativePath in $localItems) {
        $sourcePath = Join-Path $oldDirectory $relativePath
        $destinationPath = Join-Path $newDirectory $relativePath
        if ((Test-Path -LiteralPath $sourcePath) -and (Test-Path -LiteralPath $destinationPath)) {
            throw "Đích đã có: $relativePath. Dừng, không ghi đè."
        }
    }
    foreach ($relativePath in $localItems) {
        $sourcePath = Join-Path $oldDirectory $relativePath
        $destinationPath = Join-Path $newDirectory $relativePath
        if (Test-Path -LiteralPath $sourcePath) {
            New-Item -ItemType Directory -Force (Split-Path -Parent $destinationPath) | Out-Null
            Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Recurse
            Write-Host "Đã chép cục bộ: $relativePath"
        }
    }
    Set-Location -LiteralPath $newDirectory
}
```

Giữ MySQL trên máy chạy như trước. Với `.env` cũ và cùng MySQL, dữ liệu/mật khẩu đã tạo vẫn nằm trong database cũ; không chạy lại seed hoặc bộ tạo dữ liệu nghiệm thu. Tệp tài khoản trong storage cần khớp đúng database backend đang dùng. Nếu chuyển sang **máy khác**, cần chuyển database và thiết lập chứng chỉ riêng theo [hướng dẫn chạy đồ án](huong-dan-chay-do-an-windows.md); clone mã nguồn không tự chuyển MySQL hoặc quyền tin cậy chứng chỉ.

## 4. Migration và chạy bản vừa tải

Tất cả terminal phải đứng tại thư mục mới:

```powershell
Set-Location 'D:\DO_AN\chung-cu-starter-github'
```

### Nếu dùng bộ nghiệm thu `chung_cu_nghiem_thu`

Trong terminal backend:

```powershell
node --env-file-if-exists=.env --input-type=module -e "process.env.DB_NAME='chung_cu_nghiem_thu'; await import('./backend/scripts/migrate.js');"
npm.cmd run start:backend:acceptance
```

Chạy lệnh `npm.cmd` sau khi migration thành công. Backend phải in `Database: "chung_cu_nghiem_thu"`. Dùng tài khoản trong `backend/storage/acceptance/chung_cu_nghiem_thu/TAI-KHOAN.md`.

Nếu bộ mẫu có hậu tố, thay đúng tên trong migration và dùng **đối số vị trí**:

```powershell
npm.cmd run start:backend:acceptance -- chung_cu_nghiem_thu_b2
```

### Nếu dùng database trong `.env`, thường là `chung_cu`

Dùng cách này thay cho hai lệnh nghiệm thu:

```powershell
npm.cmd run db:migrate
npm.cmd run dev:backend
```

Chạy backend sau khi migration thành công. Không chạy cả hai backend cùng lúc vì cùng dùng cổng 3000. Bản 30/10 có migration **019_incident_sender_privacy.sql**; bản cập nhật về sau có thể thêm migration mới. Không sửa migration đã áp dụng.

### Frontend ở terminal khác

```powershell
Set-Location 'D:\DO_AN\chung-cu-starter-github'
npm.cmd run dev:frontend:https
```

Dùng HTTPS khi đã chép chứng chỉ và cần camera điện thoại. Nếu chỉ thử trên máy tính chưa có chứng chỉ, dùng `npm.cmd run dev:frontend`. Mở địa chỉ Vite in ra; IP Wi-Fi phải khớp chứng chỉ nếu dùng HTTPS qua IP. Không chạy cả hai frontend cùng lúc trên cổng 5173.

## 5. Mỗi lần có bản cập nhật mới trên GitHub

Dừng đúng terminal backend/frontend bằng Ctrl+C để tránh Windows khóa `node_modules`. Trong thư mục clone:

```powershell
Set-Location 'D:\DO_AN\chung-cu-starter-github'
git status --short
git branch --show-current
git pull --ff-only
```

Chỉ pull khi đang ở `codex/editorial-business-ui`. Nếu `git status` báo những file bạn đã sửa, lưu/commit thay đổi cần giữ và xử lý trước; không dùng `reset --hard` hay xóa thư mục. Nếu pull báo xung đột hoặc không thể fast-forward, dừng để kiểm tra; không chạy tiếp các bước cập nhật. Thư mục `.env`, chứng chỉ và storage được `.gitignore` bảo vệ khỏi các bản cập nhật Git thông thường.

Sau khi pull thành công:

```powershell
npm.cmd ci --include=dev --workspaces --include-workspace-root --bin-links=true
```

Sau khi cài thành công, chạy lại migration cho đúng database ở mục 4, rồi khởi động backend/frontend ở hai terminal. Việc cài lại thư viện trong mỗi lần cập nhật là cách đơn giản để theo đúng lockfile; chỉ cần thiết khi dependency thay đổi. Nếu gặp `EBUSY`, dừng các tiến trình của dự án và đóng cửa sổ đang giữ file; xem [hướng dẫn xử lý EBUSY](cap-nhat-can-chinh-tong-quan-vscode.md). Không cần xóa `package-lock.json` hoặc cài Vite toàn cục.

Kiểm tra khi backend đang chạy:

```powershell
node scripts/check-local.js --api http://127.0.0.1:3000
npm.cmd run build
```

Không cần tải lại cả dự án. Git chỉ nhận các thay đổi mới từ GitHub; `npm ci` đồng bộ thư viện và migration cập nhật cấu trúc database đang dùng.
