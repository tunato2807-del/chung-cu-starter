# Chạy CSDL MySQL đúng đồ án, giữ đủ nghiệp vụ

Bản mới ở nhánh **`codex/thesis-mysql-database`**. MySQL là lựa chọn bạn vừa xác nhận theo Word. Schema có **31 bảng thật, 362 cột, 81 FK và 8 view lịch sử**; [18 bảng trọng tâm, phần mở rộng và ma trận Word](csdl-do-an/README.md). Các phần quản lý cư dân/căn/xe, QR/phản ánh/nghiệm thu, phí/VietQR/thông báo, bảo trì, tiện ích, quỹ, báo cáo và nhập/xuất vẫn có đủ.

Các bước dưới chạy trong PowerShell ở thư mục chứa package.json. Công cụ chuyển tạo **database đích khác**, đọc nguồn MySQL 018/019 và đối chiếu dữ liệu. Chưa có thao tác nào được thực hiện trên database máy bạn chỉ vì tải code GitHub.

## 1. Lấy đúng nhánh và giữ bản cũ

Dừng các server của dự án bằng Ctrl+C trước khi đổi nhánh/cài dependency, để chế độ watch không khởi động code mới với cấu hình nguồn cũ.

```powershell
Set-Location "D:\DO_AN\chung-cu-starter-github"
git status --short
git fetch origin
git switch codex/thesis-mysql-database
git pull --ff-only origin codex/thesis-mysql-database
npm.cmd ci --include=dev --workspaces --include-workspace-root --bin-links=true
```

Nếu chưa clone:

```powershell
git clone --branch codex/thesis-mysql-database https://github.com/tunato2807-del/chung-cu-starter.git chung-cu-starter-do-an
Set-Location chung-cu-starter-do-an
npm.cmd ci --include=dev
```

Giữ sửa đổi local bằng commit/stash trước khi đổi nhánh nếu Git yêu cầu; không reset code/dữ liệu. Nếu npm báo EBUSY, dừng server dự án bằng Ctrl+C, đóng những cửa sổ đang giữ node_modules rồi thử lại. GitHub không chứa `.env`, mật khẩu mẫu, ảnh hoặc chứng chỉ; clone mới cần chép các tệp local từ thư mục đang dùng.

Giữ bản thư mục cũ, `.env`/`.env.mysql`, `backend/.demo-credentials`, toàn bộ `backend/storage/` và `.certs/`. Dừng backend cũ trong thời gian sao lưu/chuyển dữ liệu; giữ dịch vụ MySQL nguồn đang chạy, không để người dùng ghi thêm trong lúc cutover.

Sao lưu MySQL qua Workbench hoặc mysqldump. Ví dụ máy bạn dùng root và cổng 3306; nhập mật khẩu tại lời nhắc, không đặt mật khẩu trong lệnh/chat:

```powershell
mysqldump --host=127.0.0.1 --port=3306 --user=root --password --single-transaction --default-character-set=utf8mb4 --result-file="D:\DO_AN\chung_cu-truoc-doi.sql" chung_cu
mysqldump --host=127.0.0.1 --port=3306 --user=root --password --single-transaction --default-character-set=utf8mb4 --result-file="D:\DO_AN\nghiem_thu-truoc-doi.sql" chung_cu_nghiem_thu
```

Dùng đường dẫn mysqldump.exe trong thư mục MySQL nếu chưa có PATH. Cổng/user khác thì dùng cấu hình thật của bạn. Không xóa database/volume nguồn để chuyển.

## 2. Chuẩn bị cấu hình MySQL đích

Nếu `.env` hiện tại vẫn là MySQL và chưa có `.env.mysql`, lưu riêng:

```powershell
if (-not (Test-Path .env.mysql)) { Copy-Item .env .env.mysql }
node scripts/configure-thesis-mysql.js .env.mysql .env.thesis
code .env.thesis
```

Nếu đã theo hướng dẫn PostgreSQL trước đó, dùng **tệp `.env.mysql` đã sao lưu trước khi đổi**; không chép cấu hình PostgreSQL thành nguồn MySQL. Nếu PostgreSQL đã nhận các dữ liệu mới mà MySQL cũ chưa có, giữ cả PostgreSQL để đối soát trước; bộ chép này không tự lấy dữ liệu mới đó từ snapshot MySQL cũ.

Công cụ giữ user/password MySQL, JWT và cookie của bản nguồn, đổi `DB_ENGINE=mysql`, `DB_NAME=chung_cu_do_an`, không ghi đè nguồn hoặc tệp đích đã có, không in mật khẩu. Kiểm tra trong editor:

```dotenv
DB_ENGINE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_NAME=chung_cu_do_an
```

Giữ DB_PASSWORD/JWT_SECRET thật trong tệp local, không gửi chúng lên GitHub/chat. Với MySQL cài riêng của bạn, dùng tài khoản/cổng/mật khẩu đang chạy. Hỗ trợ MySQL 8.0.21+ (ví dụ8.0.46) và 8.4; không cần gỡ dịch vụ MySQL chỉ để đổi schema. Tài khoản cần quyền CREATE DATABASE/DDL ở database đích; root phù hợp cho máy làm đồ án. Nếu dùng user riêng, nhờ tài khoản quản trị tạo DB/grant đúng user trước.

Docker là lựa chọn cho máy mới: `npm.cmd run init:local` tạo `.env` nếu chưa có, `npm.cmd run db:up` khởi động MySQL 8.4. Project mới `chung-cu-thesis-mysql` và volume `thesis_mysql_data` tách khỏi các volume cũ. Nếu nguồn cũng là Docker, giữ nguồn và chuẩn bị MySQL đích ở cổng khác bằng `.env.thesis`, rồi:

```powershell
docker compose --env-file .env.thesis up -d --wait
```

Hai server không cùng bind một cổng. Nếu native MySQL3306 vẫn đang chạy thì có thể dùng ngay server đó với **tên database đích khác**, không cần tạo thêm container. Đổi mật khẩu trong tệp không tự đổi mật khẩu của volume Docker đã khởi tạo.

## 3. Chuyển dữ liệu vào schema 31 bảng

Tại terminal mới không có các biến DB\_\* ghi đè từ trước:

```powershell
node --env-file=.env.thesis scripts/copy-thesis-data.js --source-env=.env.mysql --source-db=chung_cu --target-db=chung_cu_do_an
```

Chờ **Hoàn tất**. Nếu đang dùng bộ nghiệm thu cũ, chuyển riêng:

```powershell
node --env-file=.env.thesis scripts/copy-thesis-data.js --source-env=.env.mysql --source-db=chung_cu_nghiem_thu --target-db=chung_cu_nghiem_thu_doan
```

Công cụ tự tạo DB đích còn thiếu, áp dụng baseline mới, rồi chép dữ liệu. Nguồn018 hoặc019 phải có checksum migration khớp các file MySQL gốc; không sửa checksum để ép chạy. Đích phải mới hoặc chỉ có các dòng danh mục mặc định nguyên bản, chưa có dữ liệu nghiệp vụ. Không đổi DB nguồn thành đích cùng server; chạy lại trên đích đã có dữ liệu bị chặn.

Cách kiểm tra dữ liệu:

1. Giữ ID nghiệp vụ, mật khẩu đã mã hóa, quyền/phiên bản, alias SĐT chủ hộ, QR token, snapshot hóa đơn, ngày giờ, ảnh tham chiếu và BLOB chứng từ.
2. Chuyển 8 lịch sử vào nhật ký chung; lưu loại và ID gốc để đọc qua view mà không va chạm ID giữa các bảng cũ. Không gộp/xóa lịch sử cư trú.
3. Đối chiếu số dòng và SHA-256 đủ 37 tập dữ liệu nguồn qua bảng/view mới, kiểm lại 81 FK của schema đích trước commit. JSON snapshot giữ nguyên các số lớn, không qua phép làm tròn JavaScript.
4. Chuẩn bị AUTO_INCREMENT trên đích rỗng trước transaction để giữ cả khoảng trống ID ở nguồn. Các dữ liệu được chép trong transaction; lỗi chép/đối chiếu/FK sẽ rollback dữ liệu đích, nguồn chỉ đọc.

MySQL DDL không rollback toàn bộ: nếu lỗi ở bước khởi tạo, schema đích có thể dở dang; giữ lại để kiểm tra và dùng tên đích mới. Nếu dữ liệu chép lỗi sau khi schema đã tạo xong, các dòng chép được rollback. Mất kết nối đúng lúc COMMIT được báo là chưa xác nhận kết quả, cần kiểm tra đích trước khi thử lại. Tệp báo cáo local nằm trong `backend/storage/migrations/`, không chứa mật khẩu/hàng dữ liệu.

Nguồn018 được bổ sung hai trường quyền riêng tư theo quy tắc019: phản ánh của tài khoản căn được đánh dấu, không suy đoán người gửi lịch sử từ chủ hộ hiện tại. Chủ mới vẫn chỉ kế thừa hóa đơn theo quyền, không nhận phản ánh riêng của chủ trước.

## 4. Chạy bản mới bằng dữ liệu đã chuyển

Giữ `.env.mysql` làm bản cấu hình nguồn; sau khi đối chiếu hoàn tất:

```powershell
Copy-Item .env.thesis .env -Force
npm.cmd run db:migrate
npm.cmd run dev:backend
```

Dữ liệu thường ở `chung_cu_do_an`. Để chạy bộ nghiệm thu đã chuyển, dùng lệnh sau **thay** cho backend thường, không chạy hai backend cùng cổng:

```powershell
npm.cmd run start:backend:acceptance -- chung_cu_nghiem_thu_doan
```

Mặc định mới của `start:backend:acceptance` và `db:acceptance` cũng là `chung_cu_nghiem_thu_doan` để tách khỏi bộ nguồn cũ. Tài khoản/mật khẩu của bộ cũ không thay đổi. Đọc `backend/storage/acceptance/chung_cu_nghiem_thu/TAI-KHOAN.md` cũ. Muốn file gợi ý của backend khớp tên DB mới, chép nguyên thư mục bộ cũ sang `backend/storage/acceptance/chung_cu_nghiem_thu_doan` khi đích chưa tồn tại; giữ bản cũ. README/manifest cũ có thể vẫn ghi tên DB nguồn, chọn DB theo lệnh backend trên.

Terminal frontend:

```powershell
npm.cmd run dev:frontend:https
```

Nếu chưa có HTTPS/chứng chỉ, dùng `npm.cmd run dev:frontend` và mở http://localhost:5173 trên máy tính. HTTP localhost chỉ dùng `COOKIE_SECURE=false`; giữ `COOKIE_SECURE=true` khi chạy HTTPS. Camera điện thoại cần HTTPS và chứng chỉ được tin cậy; dùng [hướng dẫn HTTPS](https-local.md). Việc đổi schema không thay IP Wi-Fi, URL frontend hoặc QR đã in; nếu DHCP đổi IP thì cần URL/chứng chỉ truy cập được như trước.

Terminal kiểm tra:

```powershell
node scripts/check-local.js --api http://127.0.0.1:3000
npm.cmd run diagnose
npm.cmd run build
```

Thử tài khoản BQL/KTV/cư dân cũ, QR cũ, phản ánh/ảnh, lịch sử chuyển căn/bàn giao, hóa đơn cũ, VietQR, thông báo và các phần mở rộng trước khi mở lại cho người dùng ghi dữ liệu. Giữ nguyên `backend/storage/` vì ảnh hiện trường là tệp ngoài DB; công cụ không tự lấy ảnh từ một thư mục clone khác.

## 5. Máy mới hoặc tạo bộ nghiệm thu mới

Chỉ máy chưa có dữ liệu: `init:local` → `db:up` → `db:migrate` → `setup:admin`. Với MySQL cài riêng, tạo `chung_cu_do_an` UTF8MB4 và điền cấu hình cho khớp trước migrate. Lệnh `setup:admin` hỏi tên và số điện thoại quản trị viên, sinh mật khẩu lưu tại `backend/storage/setup/<ten_database>.initial-admin.json`; không tạo dữ liệu nghiệp vụ giả. `db:seed` là tên lệnh tương thích cho cùng quy trình. Nếu database đã có bất kỳ tài khoản nào, lệnh dừng và giữ tài khoản/mật khẩu hiện có. Xem [khởi tạo bằng dữ liệu thực tế](du-lieu-thuc-te.md).

Bộ mẫu mới độc lập:

```powershell
npm.cmd run db:acceptance -- --database=chung_cu_nghiem_thu_doan --origin=https://192.168.1.208:5173
npm.cmd run start:backend:acceptance -- chung_cu_nghiem_thu_doan
```

Nếu đã chuyển dữ liệu vào bộ có tên đó thì dùng một hậu tố mới thay vì chạy seed chồng. IP phải là IP Wi-Fi hiện tại khớp chứng chỉ. Bộ mới có tài khoản riêng trong thư mục đúng tên DB; không dùng file tài khoản của bộ khác.

## 6. Kiểm thử, tài liệu và quay lại bản trước

`npm.cmd test` dùng riêng `chung_cu_test`; `npm.cmd run test:e2e` dùng cùng DB test, cổng 3101/5174, chạy hai bộ lần lượt. Windows cài Chromium một lần: `npx playwright install chromium`. Trình tạo test chỉ tạo DB còn thiếu, không reset DB đã có; schema test cũ cần một server test mới hoặc sao lưu/xử lý riêng, không trỏ công cụ reset vào DB thật.

Xem [ERD/ma trận đầy đủ](csdl-do-an/README.md), [từ điển vật lý](bao-cao/tu-dien-du-lieu.md), [bằng chứng](csdl-do-an/kiem-chung.md). Để tái sinh ERD/từ điển từ DB mới: `node --env-file=.env scripts/export-schema.js`.

Trước khi DB mới nhận ghi, có thể dừng backend mới và dùng lại bản code MySQL 38 bảng `4f658f6` cùng `.env.mysql`/DB nguồn (hoặc giữ thư mục cũ đã sao lưu). Bản PostgreSQL được giữ ở nhánh `codex/editorial-business-ui`. Nếu database mới đã có ghi mới, sao lưu/đối soát trước khi quay lại; không tự bỏ các thay đổi đó bằng cách trỏ ngược vào snapshot nguồn.
