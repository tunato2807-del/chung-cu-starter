# Chuyển đồ án từ MySQL sang PostgreSQL trên Windows

> **Bản CSDL hiện tại:** theo lựa chọn mới của người dùng, dùng MySQL31 bảng trên nhánh `codex/thesis-mysql-database`. Xem [hướng dẫn mới](csdl-do-an-mysql.md). Các bước/chỉ tiêu của bài cũ là lịch sử, không chép code PostgreSQL hoặc SQL38 bảng vào bản mới.

Cập nhật 05/11/2026, nhánh `codex/editorial-business-ui`. Backend hiện dùng **PostgreSQL 17 trở lên** và driver `pg`; frontend, URL API và các nghiệp vụ vẫn được giữ. Schema gồm **38 bảng / 397 cột / 88 khóa ngoại**. MySQL chỉ còn dùng làm nguồn cho công cụ chuyển dữ liệu một lần, qua dependency phát triển `mysql2`.

Các kiểm thử trong workspace dùng database thử nghiệm riêng. Database trên máy Windows của bạn chỉ được chuyển khi bạn chạy các bước dưới đây. Không chạy `db:seed` hoặc tạo lại bộ nghiệm thu để thay thế dữ liệu cũ.

## 1. Chuẩn bị code và bản sao lưu

Chạy trong PowerShell tại thư mục gốc đang dùng, ví dụ:

```powershell
Set-Location "D:\DO_AN\chung-cu-starter-github"
git status --short
git switch codex/editorial-business-ui
git pull --ff-only origin codex/editorial-business-ui
```

Nếu Git báo có sửa đổi cục bộ, giữ chúng bằng commit hoặc stash trước; không dùng `reset --hard`. Dừng backend/frontend của dự án bằng **Ctrl+C** trong các terminal đang chạy; giữ dịch vụ MySQL hoạt động để đọc nguồn. Không cho người khác ghi thêm dữ liệu cho tới khi kiểm tra xong và chuyển backend sang PostgreSQL.

Nếu đây là thư mục clone mới, chép `.env`, `backend/storage/`, `backend/.demo-credentials` và `.certs/` từ thư mục dự án cũ sang trước. GitHub không chứa các tệp local đó. Giữ cả thư mục cũ; không chạy `init:local` để thay cấu hình MySQL đang dùng bằng một bộ mới.

Giữ một bản code MySQL có thể quay lại. Nếu clone nông không tìm thấy mốc `4f658f6`, chạy `git fetch --unshallow origin` trước khi tạo nhánh backup:

```powershell
git branch backup/mysql-before-postgresql 4f658f6
if (Test-Path .env.mysql) { throw ".env.mysql đã tồn tại; giữ lại bản đó và kiểm tra trước." }
Copy-Item .env .env.mysql
```

Giữ nguyên `backend/storage/` (đặc biệt `images/`), `backend/.demo-credentials`, các bộ `backend/storage/acceptance/`, và `.certs/`. Ảnh phản ánh nằm ngoài database; chứng từ quỹ dạng BLOB được chuyển trong database. Không đưa các tệp này lên GitHub.

Sao lưu MySQL bằng MySQL Workbench hoặc `mysqldump`. Ví dụ với MySQL cài riêng của bạn, cổng 3306 và tài khoản root; mật khẩu nhập tại lời nhắc:

```powershell
mysqldump --host=127.0.0.1 --port=3306 --user=root --password --single-transaction --routines --triggers --result-file="D:\DO_AN\chung_cu-before-pg.sql" chung_cu
mysqldump --host=127.0.0.1 --port=3306 --user=root --password --single-transaction --routines --triggers --result-file="D:\DO_AN\nghiem_thu-before-pg.sql" chung_cu_nghiem_thu
```

Nếu chưa có lệnh trong PATH, dùng đường dẫn `mysqldump.exe` trong thư mục MySQL hoặc chức năng Data Export của Workbench. Với MySQL Docker, giữ container/volume nguồn hoạt động và dùng đúng cổng trong `.env.mysql`. Không dùng `docker compose down -v`.

## 2. Cài dependency và tạo cấu hình PostgreSQL riêng

```powershell
npm.cmd ci --include=dev --workspaces --include-workspace-root --bin-links=true
node scripts/configure-postgresql.js --source-env=.env.mysql --output=.env.postgresql
code .env.postgresql
```

Nếu `npm ci` báo EBUSY, đóng những terminal/server của dự án, đóng cửa sổ Explorer đang mở `node_modules` rồi thử lại; không xóa file lock hoặc dữ liệu database. Công cụ cấu hình tạo mật khẩu PostgreSQL mới, giữ khóa ký phiên/cấu hình cookie từ bản cũ, không ghi đè tệp đã có và không in mật khẩu.

Chọn **một** cách chạy PostgreSQL:

### A. PostgreSQL cài riêng

Cài PostgreSQL **17+**, bao gồm các extension chuẩn `unaccent` và ICU (bộ cài Windows chính thức có sẵn). Trong `.env.postgresql`, đặt `DB_USER=postgres` và `DB_PASSWORD` bằng mật khẩu bạn đặt lúc cài, giữ `DB_ENGINE=postgresql`, `DB_HOST=127.0.0.1`, `DB_PORT=5432`. Các giá trị có thể được đặt trong dấu nháy đơn. Kiểm tra dịch vụ PostgreSQL đang Running trong `services.msc`.

Công cụ sẽ tạo database đích còn thiếu. Tài khoản cần quyền `CREATEDB`, quyền sở hữu schema và quyền tạo extension/collation; tài khoản postgres phù hợp cho máy làm đồ án. Nếu database đích đã được quản trị viên tạo sẵn, dùng đúng chủ sở hữu và quyền đó.

### B. PostgreSQL Docker

Giữ các giá trị tài khoản/mật khẩu được tạo trong `.env.postgresql`, mở Docker Desktop và chạy:

```powershell
docker compose --project-name chung-cu-postgresql --env-file .env.postgresql up -d --wait
```

Project Compose mới `chung-cu-postgresql` và volume `postgres_data` tách khỏi project/volume MySQL cũ; không thay container MySQL nguồn đang dùng để chuyển dữ liệu. Cổng PostgreSQL mặc định là 5432. Nếu máy đã dùng cổng đó, đặt cổng trống trong `DB_PORT` của cấu hình đích trước khi chạy Compose. Mật khẩu trong `.env.postgresql` phải khớp mật khẩu được dùng lúc khởi tạo volume PostgreSQL; sửa tệp không tự đổi mật khẩu trong volume đã tồn tại.

## 3. Chuyển database và đối chiếu dữ liệu

Lệnh dưới dùng **`.env.mysql` làm nguồn**, **`.env.postgresql` làm đích**. Các biến `DB_*` đặt thủ công trong terminal được Node ưu tiên hơn tệp; dùng terminal mới, bỏ các biến ghi đè đó nếu đã đặt trước đây.

```powershell
node --env-file=.env.postgresql scripts/migrate-mysql-postgresql.js --source-env=.env.mysql --source-db=chung_cu --target-db=chung_cu
```

Chờ thông báo **Hoàn tất**, sau đó chuyển bộ nghiệm thu cũ (nếu đang dùng):

```powershell
node --env-file=.env.postgresql scripts/migrate-mysql-postgresql.js --source-env=.env.mysql --source-db=chung_cu_nghiem_thu --target-db=chung_cu_nghiem_thu
```

Công cụ hỗ trợ schema MySQL đầy đủ đến **018 hoặc 019**, kiểm tra checksum bản gốc. MySQL chỉ được đọc trong snapshot nhất quán, không chạy migration hoặc sửa tài khoản ở nguồn. PostgreSQL dùng 19 migration riêng trong `database/postgresql/`; `database/migrations/` giữ nguyên SQL/checksum MySQL cũ để đối chiếu.

PostgreSQL đích phải mới, chưa có dữ liệu nghiệp vụ; chỉ chấp nhận các dòng danh mục mặc định nguyên bản của migration. Công cụ sao chép 37 bảng nghiệp vụ, giữ ID, mật khẩu đã mã hóa, alias SĐT chủ hộ, QR token, JSON/snapshot hóa đơn, lịch sử, ngày giờ và BLOB. Nó so sánh số dòng và SHA-256 nội dung từng bảng trước khi commit, kiểm tra lại FK và đặt sequence theo cả ID lớn nhất lẫn AUTO_INCREMENT cũ. Báo cáo không chứa hàng dữ liệu/mật khẩu nằm tại `backend/storage/migrations/`.

Nếu bất kỳ dòng, ràng buộc hoặc đối chiếu nào lỗi, toàn bộ đợt chép dữ liệu đích được rollback; schema mới có thể vẫn còn. Không sửa checksum, bỏ FK hoặc xóa dữ liệu để ép chạy. Các giá trị MySQL không biểu diễn được trong PostgreSQL (ví dụ ngày `0000-00-00`, BIGINT unsigned vượt giới hạn signed 64 bit) sẽ bị từ chối. Chuẩn bị một database đích mới và xử lý dữ liệu theo kết quả kiểm tra. Chạy lại trên đích đã chuyển thành công sẽ bị chặn để tránh nhân đôi/ghi đè.

Với nguồn 018, hai cột quyền riêng tư phản ánh của 019 được bổ sung theo quy tắc cũ: đánh dấu phản ánh gửi từ tài khoản căn, không suy đoán cư dân gửi trong quá khứ từ chủ hộ hiện tại.

## 4. Chuyển backend sang cấu hình mới

Sau khi các lệnh chuyển đều Hoàn tất, thay cấu hình đang chạy bằng bản PostgreSQL đã chuẩn bị. `.env.mysql` vẫn giữ bản nguồn:

```powershell
Copy-Item .env.postgresql .env -Force
npm.cmd run db:migrate
npm.cmd run dev:backend
```

Terminal thứ hai:

```powershell
npm.cmd run dev:frontend:https
```

Giữ chứng chỉ HTTPS đã có; PostgreSQL không thay IP Wi-Fi, chứng chỉ hoặc tên miền frontend. Nếu chưa thiết lập HTTPS, tạm dùng `npm.cmd run dev:frontend` và mở `http://localhost:5173` trên máy tính. Camera điện thoại vẫn cần HTTPS và chứng chỉ được tin cậy; xem [hướng dẫn HTTPS](https-local.md).

Muốn chạy dữ liệu nghiệm thu đã chuyển, dùng backend này thay cho backend thường (không chạy hai backend cùng cổng):

```powershell
npm.cmd run start:backend:acceptance
```

Database `chung_cu_nghiem_thu_<mã>` dùng `npm.cmd run start:backend:acceptance -- chung_cu_nghiem_thu_<mã>`. Tài khoản/mật khẩu vẫn lấy từ đúng thư mục `backend/storage/acceptance/<database>/TAI-KHOAN.md` đã có. Không tạo lại file tài khoản hoặc chạy seed để chữa lỗi đăng nhập.

Terminal thứ ba:

```powershell
node scripts/check-local.js --api http://127.0.0.1:3000
npm.cmd run diagnose
npm.cmd run build
```

Thử BQL/cư dân/KTV, mở QR cũ, xem phản ánh/ảnh cũ, hóa đơn đã thu và chứng từ, rồi tạo một thao tác mới qua web. Chỉ tiếp tục sử dụng khi dữ liệu và quyền đúng. QR giữ nguyên token; QR in URL có IP cũ vẫn phải truy cập được IP/tên miền đó hoặc in lại URL với token hiện tại nếu Wi-Fi đã đổi IP. Chuyển database không sửa URL đã in trên giấy.

## 5. Chạy hằng ngày sau khi chuyển

1. Khởi động dịch vụ PostgreSQL, hoặc `npm.cmd run db:up` với Docker.
2. Terminal backend: `npm.cmd run dev:backend` hoặc `npm.cmd run start:backend:acceptance`.
3. Terminal frontend: `npm.cmd run dev:frontend:https`.

Không cần chạy lại lệnh chuyển/seed mỗi ngày. Không chạy đồng thời backend MySQL cũ và backend PostgreSQL mới để nhận ghi dữ liệu.

## 6. Máy mới chưa có dữ liệu và bộ mẫu mới

Chỉ với máy mới: `npm.cmd ci`, `npm.cmd run init:local` tạo `.env` PostgreSQL; `npm.cmd run db:up`, `npm.cmd run db:migrate`, `npm.cmd run db:seed` tạo bộ demo. Nếu PostgreSQL cài riêng, sửa tài khoản/mật khẩu `.env` cho khớp và tạo database `chung_cu` trong pgAdmin trước khi migrate. Mật khẩu demo được lưu local tại `backend/.demo-credentials`.

Tạo bộ nghiệm thu mới, tách khỏi dữ liệu đã chuyển:

```powershell
npm.cmd run db:acceptance -- --database=chung_cu_nghiem_thu_pg --origin=https://192.168.1.208:5173
npm.cmd run start:backend:acceptance -- chung_cu_nghiem_thu_pg
```

Thay IP bằng IP Wi-Fi hiện tại có trong chứng chỉ của bạn. Bộ mẫu mới dùng tài khoản/mật khẩu riêng, không dùng để đăng nhập database cũ.

## 7. Kiểm thử và quay lại bản MySQL

`npm.cmd test` dùng riêng `chung_cu_test`, tự tạo database nếu chưa có (cần CREATEDB), không reset DB hiện có. `npm.cmd run test:e2e` chạy cùng database test, cần cổng 3101/5174 trống; trên Windows cài Chromium cho Playwright một lần bằng `npx playwright install chromium`. Không chạy hai bộ test đồng thời. `node --test scripts/*.test.js` là các kiểm thử công cụ; bài chuyển thực tế chỉ bật bằng `POSTGRES_TRANSFER_TEST=1` và cổng MySQL thử nghiệm riêng, xem [bằng chứng kiểm thử](kiem-chung-postgresql.md).

Nếu chưa cho người dùng ghi vào PostgreSQL mà cần quay lại: dừng backend mới, giữ nguyên database PostgreSQL để kiểm tra, checkout branch `backup/mysql-before-postgresql`, khôi phục `.env` từ `.env.mysql`, cài dependency đúng bản và chạy lại MySQL/backend cũ. Nếu PostgreSQL đã nhận dữ liệu mới, không đổi ngược ngay: snapshot MySQL cũ không có các thay đổi đó; cần sao lưu PostgreSQL và đối soát trước. Công cụ này không đồng bộ hai chiều.

Các hướng dẫn code từng file trước 05/11/2026 là lịch sử của bản MySQL. Sau khi chuyển, cập nhật nguyên nhánh qua Git, không chép riêng service/SQL MySQL cũ vào bản PostgreSQL.
