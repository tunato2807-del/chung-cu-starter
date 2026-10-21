# Đặt lịch tiện ích cư dân — code từng file cho VS Code

> Bản tiếp theo: [Thu chi và quỹ — code đầy đủ 9 file](cap-nhat-thu-chi-quy-vscode.md). Nếu đã cập nhật thu chi, không dùng app.js/App.jsx/global.css bên dưới đè lên bản mới.

Bản tiếp theo sau `b73eb07` (thiết bị và bảo trì). Chép đủ **8 file** dưới đây vào dự án đang có. Không cần tải ZIP hoặc cài thêm thư viện. Nếu chưa cập nhật bảo trì, làm theo [bản 9 file bảo trì](cap-nhat-bao-tri-thiet-bi-vscode.md) trước; bản này dùng cả các chức năng tài khoản căn hộ, cư trú, hóa đơn, thông báo và báo cáo đã có.

## Cập nhật trên máy Windows

1. Dừng backend/frontend bằng Ctrl+C, lưu lại các thay đổi cá nhân trước khi thay nội dung file. Giữ `.env`, `.certs`, database và ảnh hiện trường.
2. Tạo file mới ở mục 1–4 và 6; thay **toàn bộ nội dung** file ở mục 5, 7, 8. Tạo thư mục `amenities` nếu chưa có. Mỗi mục bên dưới chứa đầy đủ code của file đó, chỉ chép phần bên trong khối mã.
3. Mở PowerShell tại thư mục gốc dự án (nơi có package.json), chạy:

```powershell
npm run db:migrate
npm run dev:backend
```

Migration mới **012_amenity_bookings.sql** chỉ thêm ba bảng. Giữ nguyên 001–011, không sửa migration cũ, không xóa database hoặc volume. Không cần chạy seed lại. Nếu migrate báo lỗi, xử lý lỗi trước khi chạy backend; không chạy SQL tạo schema cũ bằng tay.

4. Mở terminal thứ hai tại thư mục gốc:

```powershell
npm run dev:frontend:https
```

Dùng lệnh HTTPS đang hoạt động trên máy bạn để giữ camera QR. Nếu chỉ thử đặt lịch qua HTTP, vẫn dùng lệnh Vite mở LAN trước đây. Không chạy hai Vite cùng cổng. Khi đã chạy lại frontend, tải lại trang bằng Ctrl+F5.

5. Không chép lại app.js/App.jsx/global.css từ hướng dẫn cũ sau bản này vì sẽ làm mất menu/router mới.

## Ban quản lý sử dụng

- Đăng nhập BQL → **Tiện ích & đặt lịch** → **Thêm tiện ích**. Ví dụ: Phòng sinh hoạt cộng đồng, tầng 2, sức chứa 20, mở 06:00–22:00, mỗi lượt tối đa 120 phút, đặt trước tối đa 30 ngày. Nhập quy định sử dụng rồi lưu.
- Giờ mở/đóng áp dụng hằng ngày; chưa có lịch cuối tuần/ngày nghỉ riêng. Chỉ khung cùng ngày, bước 30 phút, giờ cuối tối đa 23:30. Mỗi lượt tối đa 30–360 phút tùy cấu hình, số người 1–1000 và không vượt sức chứa.
- Mở tiện ích để xem các ô trống/bận theo ngày. Ô bận không có tên/căn/ghi chú của người khác. Nhấn **Tải lại lịch trống** để lấy dữ liệu mới nhất.
- Chọn **Quản lý lượt đặt** để tìm theo tiện ích/căn/người đặt, lọc ngày sử dụng và trạng thái. Mở mã DL… → **Duyệt lịch**, **Từ chối lịch** hoặc **Xác nhận hủy lịch**. Từ chối/hủy cần lý do ít nhất 5 ký tự; mọi thao tác giữ lịch sử.
- Duyệt/từ chối/hủy chỉ được thực hiện trước giờ bắt đầu. Yêu cầu chờ duyệt tới giờ không tự được duyệt, không được dùng tiện ích; trang hiển thị đã tới giờ. Không có tự động hoàn thành hay chấm công sử dụng.
- **Sửa tiện ích** có thể đổi thông tin/cấu hình. Tạm ngừng chỉ chặn lượt mới, giữ lịch đang có và vẫn cho BQL duyệt/hủy chúng trước giờ bắt đầu. Đổi sức chứa/giờ/thời lượng bị chặn nếu làm sai một lượt đang giữ chỗ chưa kết thúc; xử lý các lượt đó trước. Giảm hạn đặt trước áp dụng lượt mới. Tên/vị trí đã lưu trong lượt cũ không thay theo hồ sơ mới.

## Cư dân và tài khoản căn hộ sử dụng

- Đăng nhập → **Đặt lịch tiện ích** → chọn tiện ích → chọn **Ngày sử dụng**, chọn ô giờ trống để điền giờ bắt đầu/kết thúc, có thể điều chỉnh giờ kết thúc. Nhập số người và ghi chú → **Gửi yêu cầu đặt lịch**.
- Chỉ giờ tương lai trong giới hạn đặt trước được phép; tất cả tính theo giờ Việt Nam, kể cả điện thoại đặt múi giờ khác. Ngày cuối hạn đặt trước được tính cả ngày. Khi thử lần đầu nên chọn ngày mai để không nhầm giờ đã qua.
- Tài khoản cá nhân cần được BQL liên kết với hồ sơ cư dân có đợt đang ở. Tài khoản căn CH… hoặc đăng nhập bằng số điện thoại chủ hộ cần người phụ trách hiện tại đang là chủ hộ của chính căn. Nếu chưa có liên kết, trang hướng dẫn liên hệ BQL. Hệ thống tự xác định căn/người đặt, không nhập căn thủ công.
- Gửi thành công chuyển tới chi tiết DL… trạng thái **Chờ duyệt**. Chỉ sử dụng sau khi BQL duyệt. **Lịch đặt của tôi** để xem lại, lọc lịch và hủy trước giờ bắt đầu kèm lý do.
- Cá nhân chỉ xem lịch tự đặt; sau chuyển đi vẫn đọc lịch sử nhưng không hủy tại đợt cũ, kể cả quay lại căn trong đợt mới. Tài khoản căn có chủ hộ hợp lệ xem/quản lý lịch của cả căn và được hủy thay hộ.
- Đổi chủ hộ vẫn dùng cơ chế bàn giao/ngắt phiên cũ đã có. Chủ mới tiếp tục quản lý lịch của căn bằng phiên đăng nhập mới. Chuyển đi không tự hủy lượt đã đặt; BQL hoặc tài khoản căn còn hợp lệ xử lý lịch sắp tới trước giờ bắt đầu.

## Quy tắc chống trùng và giới hạn bản này

Mỗi lượt giữ **riêng toàn bộ tiện ích**, sức chứa là số người của lượt đó. Hai nhóm không cùng dùng một khung giờ dù chưa hết sức chứa. Cả **Chờ duyệt** và **Đã duyệt** đều giữ chỗ; từ chối/hủy giải phóng giờ. Lượt 08:00–09:00 và 09:00–10:00 được phép; 08:30–09:30 bị trùng với lượt đầu.

Server kiểm tra lại sau khi khóa tiện ích trong transaction, nên hai người gửi cùng lúc không đặt trùng. Gửi lại cùng yêu cầu giữ nguyên UUID sẽ trả đúng lượt đã tạo; không tạo thêm hoặc khôi phục lượt đã hủy. Nếu gửi lỗi trùng/mạng, nội dung biểu mẫu giữ nguyên. Đổi thông tin tạo mã yêu cầu mới. Nếu báo phiên bản thay đổi, tải lại trang để dùng cấu hình hiện tại.

Phần này chưa thu phí, đặt cọc, tạo hóa đơn tiện ích, đặt lặp hằng tuần, sửa giờ lượt đã gửi, gửi email/SMS/push hoặc tích hợp khóa cửa. Muốn đổi giờ, hủy trước giờ bắt đầu rồi đặt lượt mới. Quyền xem ghi chú/lịch sử của từng lượt được kiểm tra ở API; người khác chỉ xem ô giờ bận.

## Thử nhanh sau cập nhật

1. BQL tạo một tiện ích theo ví dụ trên; đăng nhập tài khoản căn có chủ hộ trên điện thoại.
2. Chọn ngày mai, đặt 08:00–09:00, 3 người. Xem trạng thái Chờ duyệt và mã DL…
3. Dùng tài khoản căn khác chọn cùng tiện ích/ngày: hai ô 08:00 và 08:30 phải hiện Đã đặt, không xem được ghi chú/căn/người của lượt kia. Nếu nhập giờ trùng thủ công, gửi báo trùng và giữ nội dung form.
4. BQL mở Quản lý lượt đặt → duyệt. Điện thoại tải lại phải thấy Đã duyệt cùng ghi chú duyệt.
5. Cư dân hủy kèm lý do, tải lại lịch trống phải đặt được 08:00–09:00. BQL thử từ chối lượt mới: giờ cũng trống lại.
6. Tạm ngừng nhận lịch mới: không gửi thêm được; lịch cũ vẫn giữ nguyên. Nếu còn lịch chưa kết thúc, thử giảm sức chứa thấp hơn số người đã đặt: phải báo không thể đổi.

Bộ kiểm tra tự động của chức năng mới gồm quyền/CSRF, UUID lặp, đặt đồng thời khác căn, khoảng giao nhau/sát giờ, cấu hình sửa đồng thời, quyền sau chuyển đi/quay lại/bàn giao, phân trang và rollback khi ghi lịch sử lỗi. Trình duyệt kiểm tra luồng đặt/duyệt/hủy/từ chối ở 1440 px và 375 px. Test dùng `chung_cu_test`, giữ dữ liệu phát triển. Tại máy có Docker có thể chạy lần lượt `npm test`, `npm run test:e2e`, rồi `npm run build` nếu đã chép cả các file test từ GitHub; các file test không cần thiết để sử dụng chức năng.

## 1. `database/migrations/012_amenity_bookings.sql`

```sql
-- Booking times are Vietnam wall-clock DATETIME, audit timestamps are UTC.
CREATE TABLE tien_ich (
  ma_tien_ich INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ten_tien_ich VARCHAR(120) NOT NULL,
  vi_tri VARCHAR(160) NOT NULL,
  mo_ta TEXT NOT NULL,
  suc_chua SMALLINT UNSIGNED NOT NULL,
  gio_mo TIME NOT NULL,
  gio_dong TIME NOT NULL,
  toi_da_phut SMALLINT UNSIGNED NOT NULL,
  dat_truoc_ngay SMALLINT UNSIGNED NOT NULL,
  dang_mo BOOLEAN NOT NULL DEFAULT TRUE,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ma_nguoi_tao INT UNSIGNED NOT NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (ma_nguoi_tao) REFERENCES nguoi_dung(ma_nguoi_dung),
  CHECK (suc_chua BETWEEN 1 AND 1000),
  CHECK (gio_mo >= '00:00:00' AND gio_mo < gio_dong AND gio_dong <= '23:30:00'),
  CHECK (SECOND(gio_mo)=0 AND MINUTE(gio_mo) IN (0,30) AND SECOND(gio_dong)=0 AND MINUTE(gio_dong) IN (0,30)),
  CHECK (toi_da_phut BETWEEN 30 AND 360 AND MOD(toi_da_phut,30)=0),
  CHECK (dat_truoc_ngay BETWEEN 1 AND 90),
  INDEX idx_amenities_open (dang_mo,ma_tien_ich)
) ENGINE=InnoDB;
CREATE TABLE dat_lich_tien_ich (
  ma_dat_lich INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_tien_ich INT UNSIGNED NOT NULL,
  ma_can_ho INT UNSIGNED NOT NULL,
  ma_nguoi_dat INT UNSIGNED NOT NULL,
  ma_cu_dan INT UNSIGNED NOT NULL,
  ma_lich_su_cu_tru INT UNSIGNED NOT NULL,
  ten_tien_ich VARCHAR(120) NOT NULL,
  vi_tri VARCHAR(160) NOT NULL,
  ten_nguoi_dat VARCHAR(100) NOT NULL,
  bat_dau DATETIME NOT NULL,
  ket_thuc DATETIME NOT NULL,
  so_nguoi SMALLINT UNSIGNED NOT NULL,
  ghi_chu VARCHAR(1000) NOT NULL,
  trang_thai ENUM('CHO_DUYET','DA_DUYET','TU_CHOI','DA_HUY') NOT NULL DEFAULT 'CHO_DUYET',
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  khoa_yeu_cau CHAR(36) NOT NULL UNIQUE,
  van_tay CHAR(64) NOT NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (ma_tien_ich) REFERENCES tien_ich(ma_tien_ich),
  FOREIGN KEY (ma_can_ho) REFERENCES can_ho(ma_can_ho),
  FOREIGN KEY (ma_nguoi_dat) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_cu_dan) REFERENCES cu_dan(ma_cu_dan),
  FOREIGN KEY (ma_lich_su_cu_tru) REFERENCES lich_su_cu_tru(ma_lich_su_cu_tru),
  CHECK (so_nguoi BETWEEN 1 AND 1000),
  CHECK (ket_thuc>bat_dau AND DATE(bat_dau)=DATE(ket_thuc)),
  CHECK (SECOND(bat_dau)=0 AND MINUTE(bat_dau) IN (0,30) AND SECOND(ket_thuc)=0 AND MINUTE(ket_thuc) IN (0,30)),
  CHECK (TIMESTAMPDIFF(MINUTE,bat_dau,ket_thuc) BETWEEN 30 AND 360),
  INDEX idx_booking_overlap (ma_tien_ich,trang_thai,bat_dau,ket_thuc),
  INDEX idx_booking_apartment (ma_can_ho,bat_dau,ma_dat_lich),
  INDEX idx_booking_creator (ma_nguoi_dat,bat_dau,ma_dat_lich)
) ENGINE=InnoDB;
CREATE TABLE lich_su_dat_lich (
  ma_lich_su INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_dat_lich INT UNSIGNED NOT NULL,
  ma_nguoi_thuc_hien INT UNSIGNED NOT NULL,
  su_kien ENUM('DAT_LICH','DUYET','TU_CHOI','HUY') NOT NULL,
  ghi_chu VARCHAR(1000) NOT NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (ma_dat_lich) REFERENCES dat_lich_tien_ich(ma_dat_lich) ON DELETE CASCADE,
  FOREIGN KEY (ma_nguoi_thuc_hien) REFERENCES nguoi_dung(ma_nguoi_dung),
  INDEX idx_booking_history (ma_dat_lich,ma_lich_su)
) ENGINE=InnoDB;
```

## 2. `backend/src/modules/amenities/amenities.validation.js`

```js
import { choice, fail, integer, text } from "../../lib/http.js";
import { day, today, pagination } from "../billing/billing.validation.js";
export { today, pagination };
export const states = ["CHO_DUYET", "DA_DUYET", "TU_CHOI", "DA_HUY"];
export function nowVN() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}
export function addDays(value, n) {
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function positive(value, field, max = 4294967295) {
  const n = integer(value, field);
  if (n < 1 || n > max)
    fail(422, "VALIDATION", `Giá trị ${field} phải từ 1 đến ${max}.`);
  return n;
}
export function version(row, value) {
  if (row.phien_ban !== integer(value, "phien_ban"))
    fail(409, "STALE_VERSION", "Dữ liệu đã thay đổi. Hãy tải lại trang.");
}
export function clock(value) {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):(00|30)$/.test(value))
    fail(
      422,
      "INVALID_TIME",
      "Giờ phải theo định dạng HH:mm, theo bước 30 phút.",
    );
  return value;
}
export const minutes = (x) =>
  Number(x.slice(0, 2)) * 60 + Number(x.slice(3, 5));
export function facility(body) {
  const open = clock(body.gio_mo),
    close = clock(body.gio_dong);
  const max = positive(body.toi_da_phut, "toi_da_phut", 360);
  if (open >= close || max % 30 || max > minutes(close) - minutes(open))
    fail(
      422,
      "INVALID_HOURS",
      "Giờ đóng phải sau giờ mở trong cùng ngày; thời lượng tối đa theo bước 30 phút và không vượt giờ mở cửa.",
    );
  if (typeof body.dang_mo !== "boolean")
    fail(422, "VALIDATION", "Chọn rõ trạng thái mở đặt lịch.");
  return {
    ten_tien_ich: text(body.ten_tien_ich, "ten_tien_ich", 2, 120),
    vi_tri: text(body.vi_tri, "vi_tri", 2, 160),
    mo_ta: text(body.mo_ta || "", "mo_ta", 0, 2000),
    suc_chua: positive(body.suc_chua, "suc_chua", 1000),
    gio_mo: open,
    gio_dong: close,
    toi_da_phut: max,
    dat_truoc_ngay: positive(body.dat_truoc_ngay, "dat_truoc_ngay", 90),
    dang_mo: body.dang_mo,
  };
}
export function booking(body) {
  const date = day(body.ngay, true),
    start = clock(body.gio_bat_dau),
    end = clock(body.gio_ket_thuc);
  if (start >= end)
    fail(
      422,
      "INVALID_TIME",
      "Giờ kết thúc phải sau giờ bắt đầu trong cùng ngày.",
    );
  return {
    bat_dau: `${date} ${start}:00`,
    ket_thuc: `${date} ${end}:00`,
    so_nguoi: positive(body.so_nguoi, "so_nguoi", 1000),
    ghi_chu: text(body.ghi_chu || "", "ghi_chu", 0, 1000),
  };
}
export function checkBooking(f, b, now = nowVN()) {
  if (!f.dang_mo)
    fail(409, "AMENITY_CLOSED", "Tiện ích đang tạm ngừng nhận lịch mới.");
  if (
    b.bat_dau <= now ||
    b.bat_dau.slice(0, 10) > addDays(now.slice(0, 10), f.dat_truoc_ngay)
  )
    fail(
      422,
      "BOOKING_DATE",
      "Chọn giờ tương lai trong thời hạn đặt trước của tiện ích.",
    );
  if (
    b.bat_dau.slice(11, 16) < f.gio_mo.slice(0, 5) ||
    b.ket_thuc.slice(11, 16) > f.gio_dong.slice(0, 5) ||
    minutes(b.ket_thuc.slice(11)) - minutes(b.bat_dau.slice(11)) > f.toi_da_phut
  )
    fail(
      422,
      "BOOKING_HOURS",
      "Khung giờ vượt giờ mở cửa hoặc thời lượng tối đa.",
    );
  if (b.so_nguoi > f.suc_chua)
    fail(422, "BOOKING_CAPACITY", "Số người vượt sức chứa tiện ích.");
}
export function key(value) {
  const s = text(value, "khoa_yeu_cau", 36, 36).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s))
    fail(
      422,
      "INVALID_REQUEST_KEY",
      "Mã yêu cầu không hợp lệ. Hãy mở lại biểu mẫu.",
    );
  return s;
}
export function state(value) {
  return choice(value, "trang_thai", states);
}
export function calendarDay(value) {
  return day(value, true);
}
```

## 3. `backend/src/modules/amenities/amenities.service.js`

```js
import { createHash } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, integer, text } from "../../lib/http.js";
import * as v from "./amenities.validation.js";
const active = "('CHO_DUYET','DA_DUYET')";
const missing = () =>
  fail(404, "NOT_FOUND", "Không tìm thấy lịch đặt hoặc tiện ích.");
async function actor(db, user) {
  const [u] = await rows(
    db,
    "SELECT * FROM nguoi_dung WHERE ma_nguoi_dung=? AND dang_hoat_dong=1 AND vai_tro=? AND phien_ban_token=? FOR SHARE",
    [user.ma_nguoi_dung, user.vai_tro, user.phien_ban_token],
  );
  if (!u)
    fail(401, "SESSION_EXPIRED", "Phiên đã hết hạn. Vui lòng đăng nhập lại.");
  return u;
}
const contextFrom = `FROM nguoi_dung u
 JOIN cu_dan c ON (u.ma_can_ho_thanh_toan IS NULL AND c.ma_nguoi_dung=u.ma_nguoi_dung) OR (u.ma_can_ho_thanh_toan IS NOT NULL AND c.ma_cu_dan=u.ma_cu_dan_phu_trach)
 JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan AND l.den_ngay IS NULL
 JOIN can_ho a ON a.ma_can_ho=l.ma_can_ho
 WHERE u.ma_nguoi_dung=? AND u.dang_hoat_dong=1 AND u.phien_ban_token=?
 AND (u.ma_can_ho_thanh_toan IS NULL OR (u.ma_can_ho_thanh_toan=a.ma_can_ho AND l.quan_he='CHU_HO'))`;
export async function context(user) {
  const [c] = await rows(
    pool,
    `SELECT c.ma_cu_dan,c.ho_va_ten,l.ma_lich_su_cu_tru,a.ma_can_ho,a.so_can_ho,a.khoi ${contextFrom}`,
    [user.ma_nguoi_dung, user.phien_ban_token],
  );
  return c || null;
}
// Same order as residency/handover: resident -> apartment -> amenity -> booking -> account.
// A resident row freezes the current stay while residency writes wait on that row.
async function lockContext(db, user) {
  const [hint] = await rows(db, `SELECT c.ma_cu_dan ${contextFrom}`, [
    user.ma_nguoi_dung,
    user.phien_ban_token,
  ]);
  if (!hint)
    fail(
      403,
      "NO_RESIDENCE",
      "Cần hồ sơ cư trú hiện tại; tài khoản căn hộ cần chủ hộ đang phụ trách. Liên hệ BQL để liên kết.",
    );
  const [c] = await rows(
    db,
    "SELECT * FROM cu_dan WHERE ma_cu_dan=? FOR UPDATE",
    [hint.ma_cu_dan],
  );
  const [l] = await rows(
    db,
    "SELECT * FROM lich_su_cu_tru WHERE ma_cu_dan=? AND den_ngay IS NULL FOR UPDATE",
    [hint.ma_cu_dan],
  );
  if (!l)
    fail(
      409,
      "RESIDENCE_CHANGED",
      "Thông tin cư trú đã thay đổi. Hãy tải lại trang.",
    );
  const [a] = await rows(
    db,
    "SELECT ma_can_ho,so_can_ho FROM can_ho WHERE ma_can_ho=? FOR UPDATE",
    [l.ma_can_ho],
  );
  return { ...c, ...l, so_can_ho: a.so_can_ho };
}
function confirmContext(c, u) {
  const valid = u.ma_can_ho_thanh_toan
    ? u.ma_can_ho_thanh_toan === c.ma_can_ho &&
      u.ma_cu_dan_phu_trach === c.ma_cu_dan &&
      c.quan_he === "CHU_HO"
    : c.ma_nguoi_dung === u.ma_nguoi_dung;
  if (!valid)
    fail(
      409,
      "RESIDENCE_CHANGED",
      "Người phụ trách hoặc hồ sơ cư trú đã đổi. Hãy đăng nhập lại.",
    );
}
async function lockedFacility(db, id) {
  const [f] = await rows(
    db,
    "SELECT * FROM tien_ich WHERE ma_tien_ich=? FOR UPDATE",
    [id],
  );
  if (!f) missing();
  return f;
}
const fields =
  "ten_tien_ich,vi_tri,mo_ta,suc_chua,gio_mo,gio_dong,toi_da_phut,dat_truoc_ngay,dang_mo";
export async function facilities(query) {
  const { page, offset } = v.pagination(query),
    args = [],
    where = ["1=1"];
  if (query.q) {
    where.push("(ten_tien_ich LIKE ? OR vi_tri LIKE ?)");
    const q = `%${text(query.q, "q", 1, 100)}%`;
    args.push(q, q);
  }
  if (query.dang_mo) {
    if (!["0", "1"].includes(query.dang_mo))
      fail(422, "VALIDATION", "Trạng thái không hợp lệ.");
    where.push("dang_mo=?");
    args.push(Number(query.dang_mo));
  }
  const clause = where.join(" AND ");
  const [n] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM tien_ich WHERE ${clause}`,
    args,
  );
  const data = await rows(
    pool,
    `SELECT ma_tien_ich,${fields},phien_ban FROM tien_ich WHERE ${clause} ORDER BY dang_mo DESC,ma_tien_ich DESC LIMIT 20 OFFSET ${offset}`,
    args,
  );
  return { data, total: n.total, page };
}
export async function facilityDetail(id) {
  const [f] = await rows(
    pool,
    `SELECT ma_tien_ich,${fields},phien_ban FROM tien_ich WHERE ma_tien_ich=?`,
    [id],
  );
  if (!f) missing();
  return f;
}
export async function saveFacility(id, body, user) {
  const data = v.facility(body);
  return transaction(async (db) => {
    if (id) {
      const old = await lockedFacility(db, id);
      await actor(db, user);
      v.version(old, body.phien_ban);
      // Pausing stops new reservations; existing reservations remain valid.
      // Policy edits may not invalidate any live future reservation, including pending ones.
      const conflicts = await rows(
        db,
        `SELECT ma_dat_lich FROM dat_lich_tien_ich WHERE ma_tien_ich=? AND trang_thai IN ${active} AND ket_thuc>? AND (so_nguoi>? OR TIME(bat_dau)<? OR TIME(ket_thuc)>? OR TIMESTAMPDIFF(MINUTE,bat_dau,ket_thuc)>?) LIMIT 1 FOR UPDATE`,
        [
          id,
          v.nowVN(),
          data.suc_chua,
          data.gio_mo,
          data.gio_dong,
          data.toi_da_phut,
        ],
      );
      if (conflicts.length)
        fail(
          409,
          "EXISTING_BOOKINGS",
          "Cấu hình mới ảnh hưởng lịch đang giữ chỗ. Xử lý các lịch đó trước khi đổi.",
        );
      await rows(
        db,
        `UPDATE tien_ich SET ${Object.keys(data)
          .map((k) => `${k}=?`)
          .join(",")},phien_ban=phien_ban+1 WHERE ma_tien_ich=?`,
        [...Object.values(data), id],
      );
    } else {
      await actor(db, user);
      const r = await rows(
        db,
        `INSERT INTO tien_ich (${fields},ma_nguoi_tao) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [...Object.values(data), user.ma_nguoi_dung],
      );
      id = r.insertId;
    }
    return { ma_tien_ich: id };
  });
}
export async function calendar(id, query) {
  const f = await facilityDetail(id),
    day = v.calendarDay(query.ngay),
    now = v.nowVN();
  if (day < now.slice(0, 10) || day > v.addDays(now.slice(0, 10), 90))
    fail(
      422,
      "CALENDAR_RANGE",
      "Lịch trống chỉ tra cứu từ hôm nay đến 90 ngày tới.",
    );
  const busy = await rows(
    pool,
    `SELECT bat_dau,ket_thuc FROM dat_lich_tien_ich WHERE ma_tien_ich=? AND trang_thai IN ${active} AND bat_dau>=? AND bat_dau<? ORDER BY bat_dau`,
    [id, `${day} 00:00:00`, `${v.addDays(day, 1)} 00:00:00`],
  );
  const slots = [];
  const label = (m) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  for (let m = v.minutes(f.gio_mo); m < v.minutes(f.gio_dong); m += 30) {
    const start = `${day} ${label(m)}:00`,
      end = `${day} ${label(m + 30)}:00`;
    slots.push({
      gio_bat_dau: label(m),
      gio_ket_thuc: label(m + 30),
      da_dat: busy.some((b) => b.bat_dau < end && b.ket_thuc > start),
      co_the_dat:
        !!f.dang_mo &&
        start > now &&
        day <= v.addDays(now.slice(0, 10), f.dat_truoc_ngay),
    });
  }
  // Aggregate occupancy only: no other apartment, applicant, notes or booking identifiers.
  return { ngay: day, slots };
}
export async function createBooking(id, body, user) {
  const data = v.booking(body),
    key = v.key(body.khoa_yeu_cau),
    policyVersion = integer(body.phien_ban_tien_ich, "phien_ban_tien_ich");
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({ id, user: user.ma_nguoi_dung, policyVersion, ...data }),
    )
    .digest("hex");
  return transaction(async (db) => {
    const c = await lockContext(db, user),
      f = await lockedFacility(db, id),
      u = await actor(db, user);
    confirmContext(c, u);
    const [prior] = await rows(
      db,
      "SELECT ma_dat_lich,van_tay FROM dat_lich_tien_ich WHERE khoa_yeu_cau=? FOR UPDATE",
      [key],
    );
    if (prior) {
      if (prior.van_tay !== fingerprint)
        fail(
          409,
          "REQUEST_KEY_REUSED",
          "Mã yêu cầu đã được dùng cho thông tin khác. Hãy mở lại biểu mẫu.",
        );
      return { ma_dat_lich: prior.ma_dat_lich, replay: true };
    }
    v.version(f, policyVersion);
    v.checkBooking(f, data);
    // Parent-row mutex serializes every create/decision/cancel/policy edit for this amenity.
    // Locking reads see committed writes after a waiter acquires that mutex.
    const clash = await rows(
      db,
      `SELECT ma_dat_lich FROM dat_lich_tien_ich WHERE ma_tien_ich=? AND trang_thai IN ${active} AND bat_dau<? AND ket_thuc>? LIMIT 1 FOR UPDATE`,
      [id, data.ket_thuc, data.bat_dau],
    );
    if (clash.length)
      fail(
        409,
        "BOOKING_CONFLICT",
        "Khung giờ này đã có người giữ chỗ. Hãy tải lại lịch trống và chọn giờ khác.",
      );
    const r = await rows(
      db,
      `INSERT INTO dat_lich_tien_ich (ma_tien_ich,ma_can_ho,ma_nguoi_dat,ma_cu_dan,ma_lich_su_cu_tru,ten_tien_ich,vi_tri,ten_nguoi_dat,bat_dau,ket_thuc,so_nguoi,ghi_chu,khoa_yeu_cau,van_tay) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        c.ma_can_ho,
        u.ma_nguoi_dung,
        c.ma_cu_dan,
        c.ma_lich_su_cu_tru,
        f.ten_tien_ich,
        f.vi_tri,
        c.ho_va_ten,
        ...Object.values(data),
        key,
        fingerprint,
      ],
    );
    await audit(db, r.insertId, user, "DAT_LICH", data.ghi_chu);
    return { ma_dat_lich: r.insertId, replay: false };
  });
}
async function audit(db, id, user, event, note) {
  await rows(
    db,
    "INSERT INTO lich_su_dat_lich (ma_dat_lich,ma_nguoi_thuc_hien,su_kien,ghi_chu) VALUES (?,?,?,?)",
    [id, user.ma_nguoi_dung, event, note],
  );
}
// Personal accounts retain read access to their own history after moving. Fixed accounts
// read apartment history only while their custodian is a current householder there.
function scope(user, args) {
  args.push(user.ma_nguoi_dung, user.phien_ban_token);
  return `EXISTS (SELECT 1 FROM nguoi_dung u WHERE u.ma_nguoi_dung=? AND u.dang_hoat_dong=1 AND u.phien_ban_token=? AND ((u.ma_can_ho_thanh_toan IS NULL AND b.ma_nguoi_dat=u.ma_nguoi_dung) OR (u.ma_can_ho_thanh_toan=b.ma_can_ho AND EXISTS (SELECT 1 FROM lich_su_cu_tru l WHERE l.ma_cu_dan=u.ma_cu_dan_phu_trach AND l.ma_can_ho=b.ma_can_ho AND l.den_ngay IS NULL AND l.quan_he='CHU_HO'))))`;
}
const selection = `b.ma_dat_lich,b.ma_tien_ich,b.ma_can_ho,b.ma_nguoi_dat,b.ten_tien_ich,b.vi_tri,b.ten_nguoi_dat,b.bat_dau,b.ket_thuc,b.so_nguoi,b.ghi_chu,b.trang_thai,b.phien_ban,b.ngay_tao,a.so_can_ho,a.khoi`;
export async function bookings(query, user) {
  const { page, offset } = v.pagination(query),
    args = [],
    where = ["1=1"];
  if (user.vai_tro !== "QUAN_TRI_VIEN") where.push(scope(user, args));
  if (query.ma_tien_ich) {
    where.push("b.ma_tien_ich=?");
    args.push(v.positive(query.ma_tien_ich, "ma_tien_ich"));
  }
  if (query.trang_thai) {
    where.push("b.trang_thai=?");
    args.push(v.state(query.trang_thai));
  }
  if (query.ngay) {
    where.push("b.bat_dau>=? AND b.bat_dau<?");
    const d = v.calendarDay(query.ngay);
    args.push(`${d} 00:00:00`, `${v.addDays(d, 1)} 00:00:00`);
  }
  if (query.q) {
    where.push(
      "(a.so_can_ho LIKE ? OR b.ten_tien_ich LIKE ? OR b.ten_nguoi_dat LIKE ?)",
    );
    const q = `%${text(query.q, "q", 1, 100)}%`;
    args.push(q, q, q);
  }
  const from = `FROM dat_lich_tien_ich b JOIN can_ho a ON a.ma_can_ho=b.ma_can_ho WHERE ${where.join(" AND ")}`;
  const [n] = await rows(pool, `SELECT COUNT(*) AS total ${from}`, args);
  const data = await rows(
    pool,
    `SELECT ${selection} ${from} ORDER BY b.bat_dau DESC,b.ma_dat_lich DESC LIMIT 20 OFFSET ${offset}`,
    args,
  );
  return { data, total: n.total, page };
}
export async function bookingDetail(id, user) {
  const args = [id],
    own = user.vai_tro !== "QUAN_TRI_VIEN" ? ` AND ${scope(user, args)}` : "";
  const [b] = await rows(
    pool,
    `SELECT ${selection} FROM dat_lich_tien_ich b JOIN can_ho a ON a.ma_can_ho=b.ma_can_ho WHERE b.ma_dat_lich=?${own}`,
    args,
  );
  if (!b) missing();
  b.history = await rows(
    pool,
    "SELECT h.ma_lich_su,h.su_kien,h.ghi_chu,h.ngay_tao,u.ho_va_ten FROM lich_su_dat_lich h JOIN nguoi_dung u ON u.ma_nguoi_dung=h.ma_nguoi_thuc_hien WHERE h.ma_dat_lich=? ORDER BY h.ma_lich_su",
    [id],
  );
  const c = user.vai_tro === "CU_DAN" ? await context(user) : null;
  b.co_the_huy =
    activeState(b) &&
    b.bat_dau > v.nowVN() &&
    (user.vai_tro === "QUAN_TRI_VIEN" ||
      !!(
        c &&
        c.ma_can_ho === b.ma_can_ho &&
        (user.ma_can_ho_thanh_toan ||
          (b.ma_nguoi_dat === user.ma_nguoi_dung &&
            (
              await rows(
                pool,
                "SELECT ma_dat_lich FROM dat_lich_tien_ich WHERE ma_dat_lich=? AND ma_lich_su_cu_tru=?",
                [id, c.ma_lich_su_cu_tru],
              )
            ).length))
      ));
  return b;
}
function activeState(b) {
  return ["CHO_DUYET", "DA_DUYET"].includes(b.trang_thai);
}
export async function act(id, action, body, user) {
  return transaction(async (db) => {
    const c = user.vai_tro === "CU_DAN" ? await lockContext(db, user) : null;
    const [hint] = await rows(
      db,
      "SELECT ma_tien_ich FROM dat_lich_tien_ich WHERE ma_dat_lich=?",
      [id],
    );
    if (!hint) missing();
    await lockedFacility(db, hint.ma_tien_ich);
    const [b] = await rows(
      db,
      "SELECT * FROM dat_lich_tien_ich WHERE ma_dat_lich=? FOR UPDATE",
      [id],
    );
    if (!b) missing();
    const u = await actor(db, user);
    if (c) {
      confirmContext(c, u);
      if (
        action !== "huy" ||
        c.ma_can_ho !== b.ma_can_ho ||
        (!u.ma_can_ho_thanh_toan &&
          (b.ma_nguoi_dat !== u.ma_nguoi_dung ||
            b.ma_lich_su_cu_tru !== c.ma_lich_su_cu_tru))
      )
        missing();
    }
    v.version(b, body.phien_ban);
    if (b.bat_dau <= v.nowVN())
      fail(
        409,
        "BOOKING_STARTED",
        "Lịch đã tới giờ bắt đầu; không thể duyệt, từ chối hoặc hủy nữa.",
      );
    if (!activeState(b) || (action !== "huy" && b.trang_thai !== "CHO_DUYET"))
      fail(
        409,
        "INVALID_STATE",
        "Lịch không còn ở trạng thái cho phép thao tác này.",
      );
    const note = text(
      body.ghi_chu || "",
      "ghi_chu",
      action === "duyet" ? 0 : 5,
      1000,
    );
    const state = { duyet: "DA_DUYET", tu_choi: "TU_CHOI", huy: "DA_HUY" }[
      action
    ];
    if (!state) fail(422, "INVALID_ACTION", "Thao tác không hợp lệ.");
    await rows(
      db,
      "UPDATE dat_lich_tien_ich SET trang_thai=?,phien_ban=phien_ban+1 WHERE ma_dat_lich=?",
      [state, id],
    );
    await audit(db, id, user, action.toUpperCase(), note);
    return { ma_dat_lich: id };
  });
}
```

## 4. `backend/src/modules/amenities/amenities.routes.js`

```js
import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./amenities.service.js";
export const amenitiesRouter = Router(),
  bookingsRouter = Router(),
  selfBookingsRouter = Router();
amenitiesRouter.use(
  optionalAuth,
  requireAuth,
  roles("QUAN_TRI_VIEN", "CU_DAN"),
);
bookingsRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
selfBookingsRouter.use(optionalAuth, requireAuth, roles("CU_DAN"));
amenitiesRouter.get("/", async (req, res) =>
  res.json(await service.facilities(req.query)),
);
amenitiesRouter.post("/", roles("QUAN_TRI_VIEN"), async (req, res) =>
  res
    .status(201)
    .json({ data: await service.saveFacility(null, req.body, req.user) }),
);
amenitiesRouter.get("/:id", async (req, res) =>
  res.json({
    data: await service.facilityDetail(integer(req.params.id, "id")),
  }),
);
amenitiesRouter.put("/:id", roles("QUAN_TRI_VIEN"), async (req, res) =>
  res.json({
    data: await service.saveFacility(
      integer(req.params.id, "id"),
      req.body,
      req.user,
    ),
  }),
);
amenitiesRouter.get("/:id/lich", async (req, res) =>
  res.json({
    data: await service.calendar(integer(req.params.id, "id"), req.query),
  }),
);
amenitiesRouter.post("/:id/dat_lich", roles("CU_DAN"), async (req, res) => {
  const data = await service.createBooking(
    integer(req.params.id, "id"),
    req.body,
    req.user,
  );
  res.status(data.replay ? 200 : 201).json({ data });
});
selfBookingsRouter.get("/ngu_canh", async (req, res) =>
  res.json({ data: await service.context(req.user) }),
);
for (const router of [bookingsRouter, selfBookingsRouter]) {
  router.get("/", async (req, res) =>
    res.json(await service.bookings(req.query, req.user)),
  );
  router.get("/:id", async (req, res) =>
    res.json({
      data: await service.bookingDetail(integer(req.params.id, "id"), req.user),
    }),
  );
  for (const action of router === bookingsRouter
    ? ["duyet", "tu_choi", "huy"]
    : ["huy"])
    router.post(`/:id/${action}`, async (req, res) =>
      res.json({
        data: await service.act(
          integer(req.params.id, "id"),
          action,
          req.body,
          req.user,
        ),
      }),
    );
}
```

## 5. `backend/src/app.js`

```js
import express from "express";
import { healthRouter } from "./modules/health/health.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requestContext, fail } from "./lib/http.js";
import { pool } from "./lib/db.js";
import { authRouter, usersRouter } from "./modules/auth/auth.routes.js";
import { qrRouter, publicQrRouter } from "./modules/qr/qr.routes.js";
import { vehiclesRouter } from "./modules/vehicles/vehicles.routes.js";
import {
  ratesRouter,
  metersRouter,
  billsRouter,
  selfBillsRouter,
} from "./modules/billing/billing.routes.js";
import {
  apartmentsRouter,
  residentsRouter,
} from "./modules/residency/residency.routes.js";
import {
  publicIncidentsRouter,
  incidentsRouter,
} from "./modules/incidents/incidents.routes.js";

import {
  announcementsRouter,
  selfAnnouncementsRouter,
} from "./modules/announcements/announcements.routes.js";

import { financialReportsRouter } from "./modules/financial-reports/financial-reports.routes.js";

import {
  equipmentRouter,
  maintenanceRouter,
} from "./modules/maintenance/maintenance.routes.js";

import {
  amenitiesRouter,
  bookingsRouter,
  selfBookingsRouter,
} from "./modules/amenities/amenities.routes.js";

export const app = express();
app.disable("x-powered-by");
app.use(requestContext);
app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
  req.body ??= {};
  next();
});
app.use("/api/health", healthRouter);
app.get("/api/ready", async (req, res) => {
  try {
    const [migrations] = await pool.execute(
      "SELECT name FROM schema_migrations WHERE name IN (?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        "001_auth_qr_incidents.sql",
        "002_residency.sql",
        "003_same_day_residency.sql",
        "004_vehicles.sql",
        "005_billing.sql",
        "006_electricity_tiers.sql",
        "007_apartment_accounts.sql",
        "008_handover_audit_locks.sql",
        "009_announcements.sql",
        "010_maintenance.sql",
        "011_maintenance_plan_checks.sql",
        "012_amenity_bookings.sql",
      ],
    );
    if (migrations.length !== 12) throw new Error("Schema not initialized");
    await pool.query("SELECT 1 FROM phan_anh LIMIT 1");
  } catch {
    fail(
      503,
      "DATABASE_UNAVAILABLE",
      "Chưa kết nối được database hoặc chưa chạy migration.",
    );
  }
  res.json({ data: { status: "ok", database: "connected" } });
});
app.use("/api/xac_thuc", authRouter);
app.use("/api/nguoi_dung", usersRouter);
app.use("/api/can_ho", apartmentsRouter);
app.use("/api/cu_dan", residentsRouter);
app.use("/api/phuong_tien", vehiclesRouter);
app.use("/api/cau_hinh_phi", ratesRouter);
app.use("/api/chi_so_dich_vu", metersRouter);
app.use("/api/hoa_don", billsRouter);
app.use("/api/bao_cao", financialReportsRouter);
app.use("/api/tien_ich", amenitiesRouter);
app.use("/api/dat_lich_tien_ich", bookingsRouter);
app.use("/api/cua_toi/dat_lich", selfBookingsRouter);
app.use("/api/thiet_bi", equipmentRouter);
app.use("/api/bao_tri", maintenanceRouter);
app.use("/api/thong_bao", announcementsRouter);
app.use("/api/cua_toi/thong_bao", selfAnnouncementsRouter);
app.use("/api/cua_toi/hoa_don", selfBillsRouter);
app.use("/api/vi_tri_qr", qrRouter);
app.use("/api/cong_khai/vi_tri_qr", publicQrRouter);
app.use("/api/cong_khai/phan_anh", publicIncidentsRouter);
app.use("/api/phan_anh", incidentsRouter);
app.use((req, res) =>
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "API chưa tồn tại.",
      request_id: req.requestId,
    },
  }),
);
app.use(errorHandler);
```

## 6. `frontend/src/features/amenities/Amenities.jsx`

```jsx
import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../auth/Auth.jsx";
import { Field, ErrorBox, Loading, Options } from "../../shared/ui.jsx";
import { getJson } from "../../shared/api/client.js";
import { newRequestKey } from "../../shared/request-key.js";
const states = {
  CHO_DUYET: "Chờ duyệt",
  DA_DUYET: "Đã duyệt",
  TU_CHOI: "Từ chối",
  DA_HUY: "Đã hủy",
};
const events = {
  DAT_LICH: "Đặt lịch",
  DUYET: "Duyệt lịch",
  TU_CHOI: "Từ chối",
  HUY: "Hủy lịch",
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const day = (s) => s.split("-").reverse().join("/");
const when = (s) => `${s.slice(11, 16)} · ${day(s.slice(0, 10))}`;
const auditTime = (s) =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(s.replace(" ", "T") + "Z"));
const code = (id) => `DL${String(id).padStart(6, "0")}`;
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
function useData(path) {
  const [state, setState] = useState({ loading: true }),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!path) {
      setState({ path, revision, result: { data: null }, loading: false });
      return;
    }
    const c = new AbortController();
    setState({ path, revision, loading: true });
    getJson(path, { signal: c.signal })
      .then((result) => {
        if (!c.signal.aborted)
          setState({ path, revision, result, loading: false });
      })
      .catch((error) => {
        if (!c.signal.aborted)
          setState({ path, revision, error, loading: false });
      });
    return () => c.abort();
  }, [path, revision]);
  return {
    ...(state.path === path && state.revision === revision
      ? state
      : { loading: true }),
    reload: () => setRevision((n) => n + 1),
  };
}
function useAction(done) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [notice, setNotice] = useState("");
  async function run(path, method, body, after) {
    setPending(true);
    setError(null);
    setNotice("");
    try {
      const r = await getJson(path, { method, body });
      setNotice("Đã lưu thay đổi.");
      after?.(r.data);
      done?.();
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }
  return { pending, error, notice, run };
}
function Feedback({ action }) {
  return (
    <>
      {action.notice && (
        <p className="note" role="status">
          {action.notice}
        </p>
      )}
      <ErrorBox error={action.error} />
    </>
  );
}
function Status({ value }) {
  return (
    <span className={`amenity-status amenity-${value}`}>{states[value]}</span>
  );
}
function Nav({ admin, detail = false }) {
  const base = admin ? "/quan-tri" : "/cu-dan";
  return (
    <div className="actions">
      <Link to={`${base}/tien-ich`}>
        {detail ? "← Danh sách tiện ích" : "Tiện ích"}
      </Link>
      <Link to={`${base}/dat-lich`}>
        {admin ? "Quản lý lượt đặt" : "Lịch đặt của tôi"}
      </Link>
    </div>
  );
}
function Pager({ resource }) {
  const [params, setParams] = useSearchParams(),
    page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(n) {
    const next = new URLSearchParams(params);
    next.set("page", n);
    setParams(next);
  }
  return (
    <div className="actions">
      <button
        disabled={resource.loading || page <= 1}
        onClick={() => go(page - 1)}
      >
        Trang trước
      </button>
      <span>
        Trang {page} · {total} bản ghi
      </span>
      <button
        disabled={resource.loading || page * 20 >= total}
        onClick={() => go(page + 1)}
      >
        Trang sau
      </button>
    </div>
  );
}
function FacilityForm({ data, action, onSave, onCancel }) {
  return (
    <form
      className="card amenity-form"
      onSubmit={(e) => {
        e.preventDefault();
        const b = values(e);
        onSave({
          ...b,
          dang_mo: b.dang_mo === "1",
          ...(data ? { phien_ban: data.phien_ban } : {}),
        });
      }}
    >
      <h2>{data ? "Sửa tiện ích" : "Thêm tiện ích"}</h2>
      <Feedback action={action} />
      <Field label="Tên tiện ích">
        <input
          name="ten_tien_ich"
          required
          minLength={2}
          maxLength={120}
          defaultValue={data?.ten_tien_ich}
        />
      </Field>
      <Field label="Vị trí tiện ích">
        <input
          name="vi_tri"
          required
          minLength={2}
          maxLength={160}
          defaultValue={data?.vi_tri}
        />
      </Field>
      <Field label="Mô tả và quy định">
        <textarea
          name="mo_ta"
          rows={4}
          maxLength={2000}
          defaultValue={data?.mo_ta}
        />
      </Field>
      <div className="amenity-form-grid">
        <Field label="Sức chứa (người)">
          <input
            type="number"
            name="suc_chua"
            required
            min="1"
            max="1000"
            step="1"
            defaultValue={data?.suc_chua || 20}
          />
        </Field>
        <Field label="Mở nhận lịch">
          <select
            name="dang_mo"
            defaultValue={data ? String(Number(data.dang_mo)) : "1"}
          >
            <option value="1">Đang mở</option>
            <option value="0">Tạm ngừng nhận lịch mới</option>
          </select>
        </Field>
        <Field label="Giờ mở cửa">
          <input
            type="time"
            name="gio_mo"
            step="1800"
            required
            defaultValue={data?.gio_mo.slice(0, 5) || "06:00"}
          />
        </Field>
        <Field label="Giờ đóng cửa">
          <input
            type="time"
            name="gio_dong"
            step="1800"
            required
            defaultValue={data?.gio_dong.slice(0, 5) || "22:00"}
          />
        </Field>
        <Field label="Tối đa mỗi lượt (phút)">
          <input
            type="number"
            name="toi_da_phut"
            min="30"
            max="360"
            step="30"
            required
            defaultValue={data?.toi_da_phut || 120}
          />
        </Field>
        <Field label="Được đặt trước tối đa (ngày)">
          <input
            type="number"
            name="dat_truoc_ngay"
            min="1"
            max="90"
            step="1"
            required
            defaultValue={data?.dat_truoc_ngay || 30}
          />
        </Field>
      </div>
      <p className="muted">
        Mỗi lượt dùng riêng tiện ích. Khung giờ theo bước 30 phút, trong cùng
        ngày. Tạm ngừng chỉ chặn lịch mới và giữ các lịch đã đặt. Cấu hình mới
        phải phù hợp với các lịch đang giữ chỗ.
      </p>
      <div className="actions">
        <button className="primary" disabled={action.pending}>
          Lưu tiện ích
        </button>
        <button type="button" disabled={action.pending} onClick={onCancel}>
          Đóng biểu mẫu
        </button>
      </div>
    </form>
  );
}
export function Amenities() {
  const { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri" : "/cu-dan",
    [params, setParams] = useSearchParams(),
    resource = useData(`/tien_ich?${params}`),
    [form, setForm] = useState(false),
    navigate = useNavigate(),
    action = useAction();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">DỊCH VỤ CỘNG ĐỒNG</p>
          <h1>Tiện ích chung cư</h1>
          <p>Chọn không gian, xem lịch trống và đặt giờ sử dụng.</p>
        </div>
        {admin && (
          <button className="primary" onClick={() => setForm(true)}>
            Thêm tiện ích
          </button>
        )}
      </div>
      <Nav admin={admin} />
      <form
        className="card amenity-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(new URLSearchParams(values(e)));
        }}
      >
        <Field label="Tìm tiện ích">
          <input
            name="q"
            maxLength={100}
            defaultValue={params.get("q") || ""}
            placeholder="Tên hoặc vị trí"
          />
        </Field>
        <Field label="Trạng thái nhận lịch">
          <select name="dang_mo" defaultValue={params.get("dang_mo") ?? ""}>
            <option value="">Tất cả</option>
            <option value="1">Đang mở</option>
            <option value="0">Tạm ngừng</option>
          </select>
        </Field>
        <button>Tìm kiếm</button>
      </form>
      {form && (
        <FacilityForm
          action={action}
          onCancel={() => setForm(false)}
          onSave={(b) =>
            action.run("/tien_ich", "POST", b, (d) =>
              navigate(`${base}/tien-ich/${d.ma_tien_ich}`),
            )
          }
        />
      )}
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        <div className="amenity-cards">
          {resource.result?.data.map((f) => (
            <article className="card amenity-card" key={f.ma_tien_ich}>
              <span
                className={`amenity-open ${f.dang_mo ? "" : "amenity-paused"}`}
              >
                {f.dang_mo ? "Đang mở đặt lịch" : "Tạm ngừng nhận lịch"}
              </span>
              <h2>
                <Link to={`${base}/tien-ich/${f.ma_tien_ich}`}>
                  {f.ten_tien_ich}
                </Link>
              </h2>
              <p>{f.vi_tri}</p>
              <p className="amenity-description">
                {f.mo_ta || "Chưa có mô tả."}
              </p>
              <div className="amenity-card-meta">
                <span>
                  {f.gio_mo.slice(0, 5)} – {f.gio_dong.slice(0, 5)}
                </span>
                <span>Tối đa {f.suc_chua} người</span>
                <span>{f.toi_da_phut} phút / lượt</span>
              </div>
              <Link
                className="button primary"
                to={`${base}/tien-ich/${f.ma_tien_ich}`}
              >
                Xem lịch trống
              </Link>
            </article>
          ))}
        </div>
      )}
      {!resource.loading && resource.result?.total === 0 && (
        <p className="card muted">Chưa có tiện ích phù hợp.</p>
      )}
      <Pager resource={resource} />
    </>
  );
}
function Availability({ id, date, refresh, onChoose, selected }) {
  const resource = useData(
    `/tien_ich/${id}/lich?ngay=${date}&refresh=${refresh}`,
  );
  return (
    <section className="card">
      <div className="page-heading">
        <div>
          <h2>Lịch trống ngày {day(date)}</h2>
          <p className="muted">
            Giờ Việt Nam · Ô đã đặt gồm lịch chờ duyệt và đã duyệt.
          </p>
        </div>
      </div>
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        <div className="amenity-slots">
          {resource.result?.data.slots.map((s) => (
            <button
              type="button"
              key={s.gio_bat_dau}
              disabled={s.da_dat || !s.co_the_dat}
              className={
                s.da_dat
                  ? "amenity-slot-booked"
                  : selected === s.gio_bat_dau
                    ? "amenity-slot-selected"
                    : ""
              }
              aria-pressed={selected === s.gio_bat_dau}
              onClick={() => onChoose?.(s)}
              aria-label={`${s.gio_bat_dau} – ${s.gio_ket_thuc}: ${s.da_dat ? "Đã đặt" : s.co_the_dat ? "Còn trống" : "Không nhận lịch"}`}
            >
              <strong>
                {s.gio_bat_dau} – {s.gio_ket_thuc}
              </strong>
              <small>
                {s.da_dat
                  ? "Đã đặt"
                  : s.co_the_dat
                    ? "Còn trống"
                    : "Không nhận lịch"}
              </small>
            </button>
          ))}
        </div>
      )}
      <p className="muted">
        Lịch trống có thể thay đổi. Hệ thống kiểm tra lại khi bạn gửi yêu cầu.
      </p>
    </section>
  );
}
export function AmenityDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    resource = useData(`/tien_ich/${id}`),
    [editing, setEditing] = useState(false),
    [date, setDate] = useState(today),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [refresh, setRefresh] = useState(0),
    [requestKey, setRequestKey] = useState(newRequestKey),
    context = useData(admin ? null : "/cua_toi/dat_lich/ngu_canh"),
    navigate = useNavigate();
  const edit = useAction(() => {
      setEditing(false);
      resource.reload();
      setRefresh((n) => n + 1);
    }),
    book = useAction(),
    f = resource.result?.data;
  // A changed form is a different request. An unchanged retry keeps its original key.
  function changed() {
    setRequestKey(newRequestKey());
  }
  return (
    <>
      <Nav admin={admin} detail />
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        f && (
          <>
            <section className="card amenity-hero">
              <div>
                <p className="eyebrow">TIỆN ÍCH CỘNG ĐỒNG</p>
                <h1>{f.ten_tien_ich}</h1>
                <p>{f.vi_tri}</p>
                <span className="amenity-open">
                  {f.dang_mo ? "Đang mở đặt lịch" : "Tạm ngừng nhận lịch mới"}
                </span>
              </div>
              <div className="amenity-hero-meta">
                <strong>
                  {f.gio_mo.slice(0, 5)} – {f.gio_dong.slice(0, 5)}
                </strong>
                <span>
                  {f.suc_chua} người · {f.toi_da_phut} phút / lượt
                </span>
                <span>Đặt trước tối đa {f.dat_truoc_ngay} ngày</span>
              </div>
              <p className="amenity-text">
                {f.mo_ta || "Chưa có quy định bổ sung."}
              </p>
              {admin && (
                <button onClick={() => setEditing(true)}>Sửa tiện ích</button>
              )}
            </section>
            {editing && (
              <FacilityForm
                key={f.phien_ban}
                data={f}
                action={edit}
                onCancel={() => setEditing(false)}
                onSave={(b) => edit.run(`/tien_ich/${id}`, "PUT", b)}
              />
            )}
            <div className="card amenity-calendar-toolbar">
              <Field label="Ngày sử dụng">
                <input
                  type="date"
                  value={date}
                  min={today()}
                  required
                  onChange={(e) => {
                    if (e.target.value) {
                      setDate(e.target.value);
                      setStart("");
                      setEnd("");
                      changed();
                    }
                  }}
                />
              </Field>
              <button type="button" onClick={() => setRefresh((n) => n + 1)}>
                Tải lại lịch trống
              </button>
            </div>
            <Availability
              id={id}
              date={date}
              refresh={refresh}
              selected={start}
              onChoose={(s) => {
                if (!admin) {
                  setStart(s.gio_bat_dau);
                  setEnd(s.gio_ket_thuc);
                  changed();
                }
              }}
            />
            {!admin && (
              <section className="card amenity-booking-form">
                <h2>Đặt lịch sử dụng</h2>
                <ErrorBox error={context.error} />
                {context.loading ? (
                  <Loading />
                ) : !context.result?.data ? (
                  <p className="note">
                    Cần liên kết tài khoản với cư dân đang ở; tài khoản căn hộ
                    cần chủ hộ đang phụ trách. Hãy liên hệ BQL để được cập nhật.
                  </p>
                ) : (
                  <>
                    <p>
                      Đặt cho{" "}
                      <strong>căn {context.result.data.so_can_ho}</strong> ·{" "}
                      {context.result.data.ho_va_ten}
                    </p>
                    <p className="muted">
                      Một lượt giữ riêng tiện ích. Chờ BQL duyệt trước khi sử
                      dụng. Bạn có thể hủy trước giờ bắt đầu. Chức năng này chưa
                      thu phí tiện ích.
                    </p>
                    <form
                      onChange={changed}
                      onSubmit={(e) => {
                        e.preventDefault();
                        book.run(
                          `/tien_ich/${id}/dat_lich`,
                          "POST",
                          {
                            ...values(e),
                            ngay: date,
                            khoa_yeu_cau: requestKey,
                            phien_ban_tien_ich: f.phien_ban,
                          },
                          (d) => navigate(`/cu-dan/dat-lich/${d.ma_dat_lich}`),
                        );
                      }}
                    >
                      <Feedback action={book} />
                      <div className="amenity-form-grid">
                        <Field label="Giờ bắt đầu">
                          <input
                            name="gio_bat_dau"
                            type="time"
                            step="1800"
                            required
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                          />
                        </Field>
                        <Field label="Giờ kết thúc">
                          <input
                            name="gio_ket_thuc"
                            type="time"
                            step="1800"
                            required
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                          />
                        </Field>
                        <Field label="Số người tham gia">
                          <input
                            name="so_nguoi"
                            type="number"
                            min="1"
                            max={f.suc_chua}
                            required
                            defaultValue="1"
                          />
                        </Field>
                      </div>
                      <Field label="Ghi chú đặt lịch">
                        <textarea name="ghi_chu" rows={3} maxLength={1000} />
                      </Field>
                      <button
                        className="primary"
                        disabled={book.pending || !f.dang_mo}
                      >
                        Gửi yêu cầu đặt lịch
                      </button>
                    </form>
                  </>
                )}
              </section>
            )}
          </>
        )
      )}
    </>
  );
}
export function Bookings() {
  const { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri" : "/cu-dan",
    api = admin ? "/dat_lich_tien_ich" : "/cua_toi/dat_lich",
    [params, setParams] = useSearchParams(),
    resource = useData(`${api}?${params}`);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ĐẶT LỊCH TIỆN ÍCH</p>
          <h1>{admin ? "Quản lý lượt đặt" : "Lịch đặt của tôi"}</h1>
          <p>
            {admin
              ? "Duyệt yêu cầu và điều phối khung giờ sử dụng."
              : "Tài khoản căn hộ xem lịch của căn; tài khoản cá nhân xem lịch tự đặt."}
          </p>
        </div>
      </div>
      <Nav admin={admin} />
      <form
        className="card amenity-filters"
        onSubmit={(e) => {
          e.preventDefault();
          const b = values(e);
          if (params.get("ma_tien_ich"))
            b.ma_tien_ich = params.get("ma_tien_ich");
          setParams(new URLSearchParams(b));
        }}
      >
        <Field label="Tìm lượt đặt">
          <input
            name="q"
            maxLength={100}
            defaultValue={params.get("q") || ""}
            placeholder="Tiện ích, căn hộ, người đặt"
          />
        </Field>
        <Field label="Ngày đặt sử dụng">
          <input
            type="date"
            name="ngay"
            defaultValue={params.get("ngay") || ""}
          />
        </Field>
        <Field label="Trạng thái lượt đặt">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options values={states} empty="Tất cả" />
          </select>
        </Field>
        <button>Lọc lịch đặt</button>
      </form>
      {params.get("ma_tien_ich") && (
        <p className="note">
          Đang lọc theo tiện ích #{params.get("ma_tien_ich")}.{" "}
          <Link to={`${base}/dat-lich`}>Xem tất cả</Link>
        </p>
      )}
      <section className="card">
        <ErrorBox error={resource.error} />
        {resource.loading ? (
          <Loading />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lượt đặt</th>
                  <th>Tiện ích / căn hộ</th>
                  <th>Khung giờ</th>
                  <th>Số người</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {resource.result?.data.map((b) => (
                  <tr key={b.ma_dat_lich}>
                    <td>
                      <Link to={`${base}/dat-lich/${b.ma_dat_lich}`}>
                        {code(b.ma_dat_lich)}
                      </Link>
                    </td>
                    <td>
                      <strong>{b.ten_tien_ich}</strong>
                      <small className="amenity-subtitle">
                        Căn {b.so_can_ho} · {b.ten_nguoi_dat}
                      </small>
                    </td>
                    <td>
                      {when(b.bat_dau)}
                      <small className="amenity-subtitle">
                        đến {b.ket_thuc.slice(11, 16)}
                      </small>
                    </td>
                    <td>{b.so_nguoi}</td>
                    <td>
                      <Status value={b.trang_thai} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {resource.result?.total === 0 && (
              <p className="muted">Chưa có lượt đặt phù hợp.</p>
            )}
          </div>
        )}
        <Pager resource={resource} />
      </section>
    </>
  );
}
export function BookingDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri" : "/cu-dan",
    api = admin ? "/dat_lich_tien_ich" : "/cua_toi/dat_lich",
    resource = useData(`${api}/${id}`),
    action = useAction(resource.reload),
    b = resource.result?.data;
  return (
    <>
      <Link to={`${base}/dat-lich`}>← Danh sách lượt đặt</Link>
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        b && (
          <>
            <section className="card">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">{code(b.ma_dat_lich)}</p>
                  <h1>{b.ten_tien_ich}</h1>
                  <p>{b.vi_tri}</p>
                </div>
                <Status value={b.trang_thai} />
              </div>
              <div className="amenity-booking-summary">
                <div>
                  <span>Khung giờ Việt Nam</span>
                  <strong>
                    {b.bat_dau.slice(11, 16)} – {b.ket_thuc.slice(11, 16)}
                  </strong>
                  <span>{day(b.bat_dau.slice(0, 10))}</span>
                </div>
                <div>
                  <span>Căn hộ / người đặt</span>
                  <strong>Căn {b.so_can_ho}</strong>
                  <span>
                    {b.ten_nguoi_dat} · {b.so_nguoi} người
                  </span>
                </div>
              </div>
              <p className="amenity-text">{b.ghi_chu || "Không có ghi chú."}</p>
              <div className="actions">
                <Link to={`${base}/tien-ich/${b.ma_tien_ich}`}>
                  Xem tiện ích và lịch trống
                </Link>
                {admin && (
                  <Link to={`${base}/dat-lich?ma_tien_ich=${b.ma_tien_ich}`}>
                    Các lịch của tiện ích này
                  </Link>
                )}
              </div>
              {["CHO_DUYET", "DA_DUYET"].includes(b.trang_thai) &&
                new Date(b.bat_dau.replace(" ", "T") + "+07:00") <=
                  new Date() && (
                  <p className="note">
                    Đã tới giờ bắt đầu. Lịch này không còn cho phép duyệt, từ
                    chối hoặc hủy.
                    {b.trang_thai === "CHO_DUYET" &&
                      " Yêu cầu này chưa được duyệt để sử dụng."}
                  </p>
                )}
            </section>
            <Feedback action={action} />
            <div className="amenity-action-grid">
              {(admin && b.trang_thai === "CHO_DUYET" && b.co_the_huy
                ? ["duyet", "tu_choi"]
                : []
              )
                .concat(b.co_the_huy ? ["huy"] : [])
                .map((kind) => (
                  <form
                    className="card"
                    key={`${kind}-${b.phien_ban}`}
                    onSubmit={(e) => {
                      e.preventDefault();
                      action.run(`${api}/${id}/${kind}`, "POST", {
                        ...values(e),
                        phien_ban: b.phien_ban,
                      });
                    }}
                  >
                    <h2>
                      {
                        {
                          duyet: "Duyệt yêu cầu",
                          tu_choi: "Từ chối yêu cầu",
                          huy: "Hủy lượt đặt",
                        }[kind]
                      }
                    </h2>
                    <Field
                      label={
                        {
                          duyet: "Ghi chú duyệt",
                          tu_choi: "Lý do từ chối",
                          huy: "Lý do hủy lịch",
                        }[kind]
                      }
                    >
                      <textarea
                        name="ghi_chu"
                        maxLength={1000}
                        minLength={kind === "duyet" ? 0 : 5}
                        required={kind !== "duyet"}
                        rows={3}
                      />
                    </Field>
                    <button
                      className={kind === "duyet" ? "primary" : "danger"}
                      disabled={action.pending}
                    >
                      {
                        {
                          duyet: "Duyệt lịch",
                          tu_choi: "Từ chối lịch",
                          huy: "Xác nhận hủy lịch",
                        }[kind]
                      }
                    </button>
                  </form>
                ))}
            </div>
            <section className="card">
              <h2>Lịch sử đặt lịch</h2>
              <ol className="amenity-history">
                {b.history.map((h) => (
                  <li key={h.ma_lich_su}>
                    <strong>{events[h.su_kien]}</strong>
                    <small>
                      {auditTime(h.ngay_tao)} · {h.ho_va_ten}
                    </small>
                    <p className="amenity-text">{h.ghi_chu}</p>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )
      )}
    </>
  );
}
```

## 7. `frontend/src/app/App.jsx`

```jsx
import React, { useState } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  AuthProvider,
  useAuth,
  Protected,
  Login,
  Account,
} from "../features/auth/Auth.jsx";
import {
  Announcements,
  AnnouncementDetail,
  useUnreadCount,
} from "../features/announcements/Announcements.jsx";
import FinancialReports from "../features/financial-reports/FinancialReports.jsx";
import {
  EquipmentList,
  EquipmentDetail,
  MaintenanceList,
  MaintenanceDetail,
} from "../features/maintenance/Maintenance.jsx";
import {
  Amenities,
  AmenityDetail,
  Bookings,
  BookingDetail,
} from "../features/amenities/Amenities.jsx";
import Users from "../features/auth/Users.jsx";
import ApartmentAccounts from "../features/residency/ApartmentAccounts.jsx";
import {
  Portal,
  Scanner,
  SubmitReport,
  LookupReport,
} from "../features/incidents/PublicReports.jsx";
import {
  Dashboard,
  ReportDetail,
  ReportList,
} from "../features/incidents/Reports.jsx";
import Locations from "../features/qr/Locations.jsx";
import Vehicles from "../features/vehicles/Vehicles.jsx";
import {
  Rates,
  Meters,
  Bills,
  BillDetail,
} from "../features/billing/Billing.jsx";
import {
  Apartments,
  Residents,
  ResidentDetail,
} from "../features/residency/Residency.jsx";
import { ErrorBox, homeFor, roleNames } from "../shared/ui.jsx";
const admin = ["QUAN_TRI_VIEN"],
  technician = ["KY_THUAT_VIEN"],
  resident = ["CU_DAN"];
function Shell() {
  const { user, logout } = useAuth(),
    location = useLocation(),
    [error, setError] = useState();
  const unread = useUnreadCount(user, location.pathname);
  const inWorkspace =
    !!user &&
    ["/quan-tri", "/ky-thuat", "/cu-dan", "/tai-khoan"].some((p) =>
      location.pathname.startsWith(p),
    );
  const links =
    user?.vai_tro === "QUAN_TRI_VIEN"
      ? [
          ["/quan-tri", "Tổng quan"],
          ["/quan-tri/phan-anh", "Phản ánh"],
          ["/quan-tri/can-ho", "Căn hộ"],
          ["/quan-tri/tai-khoan-can-ho", "Tài khoản căn hộ"],
          ["/quan-tri/cu-dan", "Cư dân & cư trú"],
          ["/quan-tri/phuong-tien", "Phương tiện"],
          ["/quan-tri/thiet-bi", "Thiết bị & bảo trì"],
          ["/quan-tri/tien-ich", "Tiện ích & đặt lịch"],
          ["/quan-tri/don-gia", "Đơn giá phí"],
          ["/quan-tri/chi-so", "Chỉ số điện nước"],
          ["/quan-tri/hoa-don", "Phí & hóa đơn"],
          ["/quan-tri/bao-cao-tai-chinh", "Công nợ & thu phí"],
          ["/quan-tri/thong-bao", "Thông báo"],
          ["/quan-tri/vi-tri-qr", "Vị trí & QR"],
          ["/quan-tri/nhan-su", "Nhân sự & tài khoản"],
        ]
      : user?.vai_tro === "KY_THUAT_VIEN"
        ? [
            ["/ky-thuat/cong-viec", "Công việc"],
            ["/ky-thuat/bao-tri", "Bảo trì thiết bị"],
          ]
        : [
            ["/cu-dan/phan-anh", "Phản ánh của tôi"],
            ["/cu-dan/hoa-don", "Hóa đơn của tôi"],
            ["/cu-dan/tien-ich", "Đặt lịch tiện ích"],
            ["/cu-dan/thong-bao", "Thông báo"],
          ];
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-icon">CC</span>
          <span>
            CHUNG CƯ<small>QUẢN LÝ VẬN HÀNH</small>
          </span>
        </Link>
        <div className="top-links">
          <Link to="/tra-cuu">Tra cứu</Link>
          {user ? (
            <>
              <Link to={homeFor(user)}>{user.ho_va_ten}</Link>
              <button onClick={() => logout().catch(setError)}>
                Đăng xuất
              </button>
            </>
          ) : (
            <Link className="button" to="/dang-nhap">
              Đăng nhập
            </Link>
          )}
        </div>
      </header>
      <ErrorBox error={error} />
      <div className={inWorkspace ? "workspace" : "public-space"}>
        {inWorkspace && (
          <aside className="sidebar">
            <p className="eyebrow">{roleNames[user.vai_tro]}</p>
            <nav aria-label="Chức năng">
              {[...links, ["/tai-khoan", "Tài khoản"]].map(([path, label]) => (
                <NavLink key={path} end={path === "/quan-tri"} to={path}>
                  {label}
                  {path === "/cu-dan/thong-bao" && unread > 0 && (
                    <span
                      className="notification-count"
                      aria-label={`${unread} chưa đọc`}
                    >
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
            <Link className="public-link" to="/">
              Cổng dịch vụ ↗
            </Link>
          </aside>
        )}
        <main key={location.pathname}>
          <Routes>
            <Route path="/" element={<Portal />} />
            <Route path="/dang-nhap" element={<Login />} />
            <Route path="/quet-qr" element={<Scanner />} />
            <Route path="/r/:token" element={<SubmitReport />} />
            <Route
              path="/tra-cuu"
              element={<LookupReport initialCode={location.state?.code} />}
            />
            <Route
              path="/tai-khoan"
              element={
                <Protected>
                  <Account />
                </Protected>
              }
            />
            <Route
              path="/quan-tri"
              element={
                <Protected roles={admin}>
                  <Dashboard />
                </Protected>
              }
            />
            <Route
              path="/quan-tri/vi-tri-qr"
              element={
                <Protected roles={admin}>
                  <Locations />
                </Protected>
              }
            />
            <Route
              path="/quan-tri/nhan-su"
              element={
                <Protected roles={admin}>
                  <Users />
                </Protected>
              }
            />
            {[
              ["/quan-tri/can-ho", <Apartments />],
              ["/quan-tri/tai-khoan-can-ho", <ApartmentAccounts />],
              ["/quan-tri/cu-dan", <Residents />],
              ["/quan-tri/cu-dan/:id", <ResidentDetail />],
              ["/quan-tri/phuong-tien", <Vehicles />],
              ["/quan-tri/tien-ich", <Amenities />],
              ["/quan-tri/tien-ich/:id", <AmenityDetail />],
              ["/quan-tri/dat-lich", <Bookings />],
              ["/quan-tri/dat-lich/:id", <BookingDetail />],
              ["/quan-tri/thiet-bi", <EquipmentList />],
              ["/quan-tri/thiet-bi/:id", <EquipmentDetail />],
              ["/quan-tri/bao-tri", <MaintenanceList />],
              ["/quan-tri/bao-tri/:id", <MaintenanceDetail />],
              ["/quan-tri/don-gia", <Rates />],
              ["/quan-tri/chi-so", <Meters />],
              ["/quan-tri/hoa-don", <Bills />],
              ["/quan-tri/hoa-don/:id", <BillDetail />],
              ["/quan-tri/bao-cao-tai-chinh", <FinancialReports />],
              ["/quan-tri/thong-bao", <Announcements />],
              ["/quan-tri/thong-bao/:id", <AnnouncementDetail />],
            ].map(([path, element]) => (
              <Route
                key={path}
                path={path}
                element={<Protected roles={admin}>{element}</Protected>}
              />
            ))}
            {[
              ["/quan-tri/phan-anh", admin],
              ["/ky-thuat/cong-viec", technician],
              ["/cu-dan/phan-anh", resident],
            ].map(([base, roles]) => (
              <React.Fragment key={base}>
                <Route
                  path={base}
                  element={
                    <Protected roles={roles}>
                      <ReportList />
                    </Protected>
                  }
                />
                <Route
                  path={`${base}/:id`}
                  element={
                    <Protected roles={roles}>
                      <ReportDetail />
                    </Protected>
                  }
                />
              </React.Fragment>
            ))}
            {[
              ["/cu-dan/tien-ich", <Amenities />],
              ["/cu-dan/tien-ich/:id", <AmenityDetail />],
              ["/cu-dan/dat-lich", <Bookings />],
              ["/cu-dan/dat-lich/:id", <BookingDetail />],
            ].map(([path, element]) => (
              <Route
                key={path}
                path={path}
                element={<Protected roles={resident}>{element}</Protected>}
              />
            ))}
            {["/ky-thuat/bao-tri", "/ky-thuat/bao-tri/:id"].map((path) => (
              <Route
                key={path}
                path={path}
                element={
                  <Protected roles={technician}>
                    {path.endsWith(":id") ? (
                      <MaintenanceDetail />
                    ) : (
                      <MaintenanceList />
                    )}
                  </Protected>
                }
              />
            ))}
            {[
              "/cu-dan/hoa-don",
              "/cu-dan/hoa-don/:id",
              "/cu-dan/thong-bao",
              "/cu-dan/thong-bao/:id",
            ].map((path) => (
              <Route
                key={path}
                path={path}
                element={
                  <Protected roles={resident}>
                    {path.includes("thong-bao") ? (
                      path.endsWith(":id") ? (
                        <AnnouncementDetail />
                      ) : (
                        <Announcements />
                      )
                    ) : path.endsWith(":id") ? (
                      <BillDetail />
                    ) : (
                      <Bills />
                    )}
                  </Protected>
                }
              />
            ))}
            <Route
              path="*"
              element={
                <section className="card">
                  <h1>Không tìm thấy trang</h1>
                  <Link to="/">Về cổng dịch vụ</Link>
                </section>
              }
            />
          </Routes>
        </main>
      </div>
      <footer>Chung cư · Cổng tiếp nhận phản ánh & điều phối xử lý</footer>
    </div>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}
```

## 8. `frontend/src/styles/global.css`

```css
:root {
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  color: #183c3b;
  background: #f2f5f3;
  line-height: 1.6;
  font-synthesis: none;
  font-weight: 400;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
}
a {
  color: #14635a;
  text-underline-offset: 3px;
}
button,
input,
textarea,
select {
  font: inherit;
}
button,
.button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 9px 16px;
  border: 1px solid #b7c9c3;
  border-radius: 8px;
  background: white;
  color: #224b44;
  cursor: pointer;
  text-decoration: none;
  font-weight: 600;
  line-height: 1.4;
}
button:hover,
.button:hover {
  background: #edf5f0;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.primary {
  background: #14635a;
  color: white;
  border-color: #14635a;
}
.primary:hover {
  background: #0a4c45;
}
.danger {
  color: #a33e30;
  background: #fff5f1;
  border-color: #dfb4a9;
}
:focus-visible {
  outline: 3px solid #d99b27;
  outline-offset: 3px;
}
input,
select,
textarea {
  width: 100%;
  padding: 10px 12px;
  min-height: 44px;
  border: 1px solid #b6c6c0;
  border-radius: 6px;
  color: #183c3b;
  background: #fff;
  max-width: 100%;
}
textarea {
  resize: vertical;
}
input[type="checkbox"] {
  width: 20px;
  min-height: 20px;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 4vw;
  border-bottom: 1px solid #dce5df;
  background: white;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  text-decoration: none;
  line-height: 1.4;
}
.brand-icon {
  background: #14635a;
  color: white;
  border-radius: 10px;
  padding: 10px;
  font-size: 18px;
}
.brand small {
  display: block;
  letter-spacing: 1.7px;
  font-size: 9px;
  color: #627c73;
}
.top-links {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
}
.top-links > a {
  text-decoration: none;
}
.workspace {
  display: grid;
  grid-template-columns: 225px minmax(0, 1fr);
  min-height: 80vh;
  max-width: 1600px;
  margin: auto;
}
.sidebar {
  padding: 30px 18px;
  border-right: 1px solid #dce5df;
  background: #fff;
}
.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.sidebar nav a {
  display: block;
  padding: 12px 14px;
  border-radius: 7px;
  text-decoration: none;
  color: #47645b;
}
.sidebar nav a.active {
  background: #e3f0e8;
  color: #13584a;
  font-weight: 700;
}
.public-link {
  display: block;
  margin: 30px 14px;
}
.workspace main {
  padding: 32px;
  min-width: 0;
}
.public-space {
  max-width: 1120px;
  margin: auto;
  padding: 40px 24px;
  min-height: 76vh;
}
h1 {
  font-size: 30px;
  line-height: 1.25;
  margin: 5px 0 24px;
  letter-spacing: -0.7px;
}
h2 {
  font-size: 19px;
  line-height: 1.4;
  margin: 0 0 16px;
}
h3 {
  font-size: 15px;
  margin: 24px 0 12px;
}
p {
  margin: 8px 0 18px;
}
small {
  font-size: 12px;
}
.eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.4px;
  color: #648379;
  margin-bottom: 8px;
}
.card {
  border: 1px solid #dbe5de;
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px #294d3a04;
}
.narrow {
  max-width: 650px;
  margin: 0 auto 24px;
}
.muted,
.note {
  color: #637b72;
}
.note {
  font-size: 13px;
  margin: 24px 0;
}
.hero {
  padding: 35px 0 50px;
  max-width: 800px;
}
.hero h1 {
  font-size: clamp(36px, 5vw, 56px);
  line-height: 1.15;
  letter-spacing: -1.5px;
  margin: 18px 0 24px;
}
.hero p:not(.eyebrow) {
  max-width: 610px;
  color: #60776f;
  font-size: 18px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.hero .actions {
  margin-top: 30px;
}
.three-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.step {
  display: block;
  color: #93aa9f;
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 24px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
  font-size: 14px;
}
.card fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
.field > span,
.field > label {
  font-weight: 600;
}
.field small {
  color: #6d7e77;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.full {
  width: 100%;
  margin-top: 20px;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 18px 0;
}
.error {
  padding: 12px 14px;
  background: #fff2ed;
  color: #9a3428;
  border: 1px solid #efc4b8;
  border-radius: 8px;
  font-size: 14px;
  margin: 15px 0;
  overflow-wrap: anywhere;
}
.error ul {
  padding-left: 20px;
  margin-bottom: 0;
}
.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.page-heading h1,
.page-heading h2 {
  margin-bottom: 0;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin: 28px 0;
}
.stat {
  text-decoration: none;
  color: inherit;
}
.stat span {
  font-size: 13px;
  color: #637b72;
}
.stat strong {
  display: block;
  font-size: 40px;
  font-weight: 650;
  line-height: 1.6;
}
.stat small {
  color: #14635a;
}
.table-wrap {
  overflow: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}
th {
  font-size: 11px;
  color: #698176;
  background: #f5f8f5;
  font-weight: 600;
  white-space: nowrap;
}
th,
td {
  padding: 14px 12px;
  border-bottom: 1px solid #edf1ed;
}
td:first-child {
  min-width: 220px;
}
td a {
  font-weight: 650;
  text-decoration: none;
}
td small {
  display: block;
  color: #71857c;
  margin-top: 5px;
}
td:last-child {
  white-space: nowrap;
  color: #698176;
}
.badge {
  display: inline-block;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  background: #edf1ef;
  color: #52665b;
}
.status-MOI {
  background: #e6efff;
  color: #365c9b;
}
.status-DA_PHAN_CONG {
  background: #e8e7ff;
  color: #5c519b;
}
.status-DANG_XU_LY {
  background: #fff1d9;
  color: #9a6c18;
}
.status-DA_XU_LY {
  background: #e4f3f5;
  color: #2c737e;
}
.status-DA_DONG {
  background: #e3f3e8;
  color: #2c7351;
}
.status-TU_CHOI {
  background: #f9e8e2;
  color: #ad5244;
}
.filters {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 8px;
}
.pagination {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  margin-top: 20px;
}
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(280px, 1fr);
  gap: 24px;
}
.action-panel {
  align-self: start;
}
.tags {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #667e73;
  margin-bottom: 20px;
}
.metadata {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 8px;
  font-size: 13px;
  border-top: 1px solid #e3eae4;
  padding-top: 20px;
}
.metadata dt {
  color: #74897f;
}
.metadata dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.pre-wrap {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.image-grid img {
  width: 120px;
  height: 110px;
  object-fit: cover;
  border-radius: 7px;
  border: 1px solid #dce6de;
  max-width: 100%;
}
.timeline {
  list-style: none;
  padding: 0 0 0 18px;
  border-left: 2px solid #e0e9e1;
  margin-left: 5px;
}
.timeline li {
  position: relative;
  padding: 0 0 26px;
}
.timeline li:before {
  content: "";
  position: absolute;
  left: -25px;
  top: 7px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #73a38c;
  border: 2px solid white;
}
.timeline li > div {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.timeline time {
  font-size: 11px;
  color: #75877e;
}
.timeline p {
  font-size: 13px;
  margin: 8px 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.timeline small {
  color: #75877e;
}
.location-list {
  list-style: none;
  padding: 0;
}
.location-list li {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 6px;
  border-top: 1px solid #e3ebe4;
  padding: 18px 0;
}
.location-list small {
  color: #71857c;
}
.location-list button {
  font-size: 12px;
  padding: 7px 10px;
}
.qr-print {
  text-align: center;
}
.qr-image {
  max-width: 100%;
  width: 280px;
  aspect-ratio: 1;
}
.qr-url {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.qr-print .actions {
  justify-content: center;
}
.qr-print .muted {
  font-size: 12px;
  margin-top: 24px;
}
.decision {
  border-top: 1px solid #e0e8e1;
  margin-top: 22px;
}
.empty {
  padding: 32px;
  text-align: center;
  color: #71857c;
}
.back {
  display: inline-block;
  font-size: 13px;
  margin-bottom: 20px;
}
.lookup-result {
  border-top: 1px solid #e0e8e1;
  margin-top: 26px;
  padding-top: 24px;
}
.lookup-result .timeline {
  margin-top: 24px;
}
hr {
  border: 0;
  border-top: 1px solid #dce5df;
  margin: 25px 0;
}
#qr-reader {
  margin-bottom: 20px;
  overflow: hidden;
}
footer {
  font-size: 11px;
  text-align: center;
  color: #7c9085;
  border-top: 1px solid #dce5df;
  padding: 24px;
}
/* Invoice quantities use Vietnamese separators and align with their prices. */
.bill-lines th:nth-child(2),
.bill-lines th:nth-child(4),
.bill-lines th:nth-child(5),
.bill-number {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.bill-lines .bill-line-total {
  color: #183c3b;
  font-weight: 600;
}
.bill-total {
  margin: 0;
  padding-top: 22px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.bank-picker {
  padding: 18px;
  margin-bottom: 18px;
  border: 1px solid #dce8e2;
  border-radius: 10px;
  background: #f7faf8;
}
.bank-picker select {
  text-overflow: ellipsis;
}
.bank-selection {
  margin: 0;
  font-size: 13px;
  color: #47645b;
}
.bill-publish > .muted {
  font-size: 14px;
  margin-bottom: 24px;
}
.payment-card {
  padding: 0;
  overflow: hidden;
}
.payment-header {
  padding: 28px 24px 24px;
  text-align: center;
  border-bottom: 1px solid #dce8e2;
  background: linear-gradient(135deg, #f2f8f4, #eaf4ef);
}
.payment-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  background: #fff5da;
  color: #805800;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 14px;
}
.payment-header h2 {
  font-size: 24px;
  margin-bottom: 8px;
}
.payment-header p {
  color: #537168;
  margin: 0;
  font-size: 14px;
}
.payment-body {
  max-width: 720px;
  margin: 0 auto;
  padding: 28px 24px;
  text-align: center;
}
.payment-amount-label {
  margin: 0 0 4px;
  color: #637b72;
  font-size: 13px;
}
.payment-amount {
  margin: 0 0 24px;
  font-size: clamp(26px, 4vw, 36px);
  font-weight: 750;
  line-height: 1.3;
  color: #13584a;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.payment-qr-frame {
  width: min(340px, 100%);
  margin: 0 auto;
  padding: 16px;
  border: 1px solid #d4e1d9;
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 24px #1a4d3a0a;
}
.payment-qr-brand {
  display: block;
  font-size: 18px;
  letter-spacing: 2px;
  font-weight: 800;
  color: #164e57;
}
.payment-qr-frame img {
  display: block;
  width: 100%;
  max-width: 320px;
  height: auto;
  aspect-ratio: 1;
  margin: 8px auto;
}
.payment-qr-caption {
  display: block;
  font-size: 12px;
  color: #637b72;
}
.payment-details {
  margin: 28px auto 20px;
  max-width: 560px;
  text-align: left;
  font-size: 14px;
}
.payment-details > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #edf1ed;
}
.payment-details dt {
  color: #637b72;
}
.payment-details dd {
  margin: 0;
  text-align: right;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.payment-account {
  font-size: 17px;
  letter-spacing: 0.4px;
  font-variant-numeric: tabular-nums;
}
.payment-details .payment-reference {
  margin-top: 6px;
  padding: 14px 12px;
  border: 1px solid #d8e6dd;
  border-radius: 8px;
  background: #f2f8f4;
}
.payment-download {
  min-width: 180px;
}
.payment-notice {
  max-width: 500px;
  margin: 20px auto 0;
  font-size: 13px;
  color: #637b72;
}
@media (max-width: 1000px) {
  .workspace {
    grid-template-columns: 185px minmax(0, 1fr);
  }
  .workspace main {
    padding: 24px 20px;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 650px) {
  .topbar {
    padding: 12px 16px;
    align-items: start;
  }
  .brand {
    font-size: 12px;
    gap: 8px;
  }
  .brand-icon {
    padding: 8px;
    font-size: 13px;
  }
  .top-links {
    gap: 8px;
    flex-wrap: wrap;
    justify-content: end;
    font-size: 12px;
    max-width: 55%;
  }
  .top-links .button,
  .top-links button {
    font-size: 11px;
    padding: 8px;
  }
  .workspace {
    display: block;
  }
  .sidebar {
    padding: 12px 16px;
    border-right: 0;
    border-bottom: 1px solid #dce5df;
  }
  .sidebar .eyebrow {
    display: none;
  }
  .sidebar nav {
    flex-direction: row;
    overflow: auto;
  }
  .sidebar nav a {
    font-size: 12px;
    white-space: nowrap;
    padding: 10px;
  }
  .public-link {
    display: none;
  }
  .workspace main {
    padding: 24px 16px;
  }
  .public-space {
    padding: 28px 16px;
  }
  .three-columns {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .hero {
    padding-top: 10px;
  }
  .card {
    padding: 20px;
  }
  .payment-card {
    padding: 0;
  }
  .payment-body {
    padding: 24px 18px;
  }
  .payment-header {
    padding: 24px 18px 20px;
  }
  .payment-header h2 {
    font-size: 21px;
  }
  .payment-details {
    font-size: 13px;
  }
  .payment-details > div {
    gap: 10px;
  }
  .bank-picker {
    padding: 14px;
  }
  .filters {
    grid-template-columns: 1fr;
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .page-heading {
    align-items: start;
    flex-direction: column;
  }
  h1 {
    font-size: 25px;
  }
  .stats {
    gap: 10px;
  }
  .stat {
    padding: 16px;
  }
  .stat strong {
    font-size: 32px;
  }
  .metadata {
    grid-template-columns: 115px 1fr;
  }
  .pagination {
    flex-wrap: wrap;
  }
  .pagination span {
    order: 3;
    width: 100%;
    text-align: center;
  }
  .image-grid img {
    width: 100px;
    height: 90px;
  }
}
@media print {
  body {
    background: white;
  }
  .topbar,
  .sidebar,
  footer,
  .no-print,
  .page-heading {
    display: none !important;
  }
  .workspace,
  .detail-grid {
    display: block;
  }
  .workspace main {
    padding: 0;
  }
  .qr-print {
    border: 0;
    box-shadow: none;
    margin: 0;
  }
  .qr-print .muted {
    display: none;
  }
}

.notification-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  padding: 0.1rem 0.4rem;
  margin-left: 0.5rem;
  border-radius: 1rem;
  background: #a33225;
  color: #fff;
  font-size: 0.8rem;
}
.notification-item {
  padding: 1.4rem 1rem;
  border-bottom: 1px solid #dce7e4;
  border-left: 4px solid transparent;
  overflow-wrap: anywhere;
}
.notification-item.is-unread {
  background: #f0f8f5;
  border-left-color: #16665c;
}
.notification-item h2 {
  margin: 0.7rem 0;
  font-size: 1.15rem;
}
.notification-item p {
  color: #55736e;
  margin-bottom: 0;
  white-space: pre-line;
}
.notification-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 1rem;
  color: #55736e;
  font-size: 0.85rem;
}
.notification-priority {
  border-radius: 0.4rem;
  padding: 0.2rem 0.5rem;
  background: #edf3f1;
}
.priority-QUAN_TRONG {
  color: #8a3c12;
  background: #fff0d8;
  font-weight: 700;
}
.notification-detail h1 {
  overflow-wrap: anywhere;
}
.notification-body {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.8;
  margin: 1.5rem 0;
}
.notification-bill {
  padding: 1.2rem;
  border: 1px solid #dce7e4;
  border-radius: 0.8rem;
  background: #f5f9f7;
}

.finance-filters {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: end;
  margin-bottom: 1rem;
}
.finance-filters .field {
  margin-bottom: 0;
}
.finance-filters > button {
  align-self: end;
  min-height: 44px;
}
@media (max-width: 1150px) {
  .finance-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .finance-filters {
    grid-template-columns: minmax(0, 1fr);
  }
}

.finance-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1rem;
}
.finance-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}
.finance-metric {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.6rem;
  padding: 1.2rem;
  border: 1px solid #dce5df;
  border-radius: 0.8rem;
  background: white;
  text-align: left;
  min-width: 0;
  overflow-wrap: anywhere;
}
.finance-metric strong {
  font-size: clamp(1.15rem, 1.7vw, 1.65rem);
  letter-spacing: -0.02em;
  line-height: 1.4;
}
.finance-metric-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #47645b;
}
.finance-metric small {
  font-weight: 400;
  color: #627c73;
}
.finance-metric.is-paid {
  border-top: 4px solid #14635a;
}
.finance-metric.is-overdue {
  border-top: 4px solid #ad3f2b;
}
.finance-metric.is-overdue strong,
.finance-overdue {
  color: #a33225;
  font-weight: 700;
}
.finance-progress {
  padding: 1rem 1.2rem;
  border-radius: 0.6rem;
  background: #e7f0eb;
}
.finance-progress > div {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.9rem;
}
.finance-progress progress {
  width: 100%;
  height: 0.6rem;
  accent-color: #14635a;
}
.finance-snapshot {
  font-size: 0.8rem;
  color: #627c73;
}
.finance-results th {
  white-space: nowrap;
}
.finance-results td {
  vertical-align: top;
}
.finance-number {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.finance-contact {
  display: block;
  color: #627c73;
}
.finance-pager {
  margin-top: 1rem;
}
.finance-empty {
  text-align: center;
  color: #627c73;
  padding: 1rem;
}
.finance-metrics-cash {
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
}
.finance-date-range {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.6rem;
  padding: 1.2rem;
  border: 1px solid #dce5df;
  border-radius: 0.8rem;
}
.finance-date-range small {
  color: #627c73;
}
@media (max-width: 1150px) {
  .finance-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .finance-metrics,
  .finance-metrics-cash {
    grid-template-columns: minmax(0, 1fr);
  }
  .finance-results {
    padding: 1rem;
  }
  .finance-metric strong {
    font-size: 1.5rem;
  }
}

.maintenance-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.maintenance-stats .card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.maintenance-stats strong {
  font-size: 1.8rem;
}
.maintenance-overdue {
  color: #a33225;
}
.maintenance-tag {
  display: inline-block;
  padding: 0.25rem 0.55rem;
  border-radius: 0.4rem;
  background: #edf3f1;
  color: #47645b;
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0.2rem;
}
.due-QUA_HAN,
.work-HUY {
  background: #fff0ea;
  color: #a33225;
}
.due-SAP_DEN_HAN,
.work-CHO_NGHIEM_THU {
  background: #fff2d9;
  color: #8a5416;
}
.work-HOAN_THANH {
  background: #e3f3e8;
  color: #225e46;
}
.work-DANG_THUC_HIEN {
  background: #e7effb;
  color: #275384;
}
.maintenance-subtitle {
  display: block;
  color: #627c73;
  margin-top: 0.4rem;
}
.maintenance-info {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 2rem;
  margin: 0 0 1.4rem;
}
.maintenance-info dt {
  color: #627c73;
  font-size: 0.85rem;
}
.maintenance-info dd {
  margin: 0.3rem 0 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.maintenance-text,
.maintenance-history p {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.maintenance-staff {
  padding: 1rem;
  border: 1px solid #dce5df;
  border-radius: 0.6rem;
  margin-bottom: 1.2rem;
  background: #f8faf9;
}
.maintenance-staff .actions {
  font-size: 0.85rem;
}
.maintenance-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.maintenance-action-grid .card {
  min-width: 0;
}
.maintenance-history {
  padding-left: 1.2rem;
}
.maintenance-history li {
  padding: 0 0 1rem 0.4rem;
  border-bottom: 1px solid #e4ebe7;
  margin-bottom: 1rem;
}
.maintenance-history li div {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  justify-content: space-between;
}
.maintenance-history time {
  color: #627c73;
  font-size: 0.8rem;
}
@media (max-width: 700px) {
  .maintenance-stats,
  .maintenance-info,
  .maintenance-action-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.amenity-cards,
.amenity-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
}
.amenity-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}
.amenity-card h2 {
  margin-bottom: 0;
  overflow-wrap: anywhere;
}
.amenity-description {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  flex: 1;
}
.amenity-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  color: #627c73;
}
.amenity-open,
.amenity-status {
  display: inline-block;
  padding: 0.3rem 0.7rem;
  border-radius: 2rem;
  font-size: 0.8rem;
  font-weight: 600;
  background: #e3f3e8;
  color: #225e46;
}
.amenity-paused,
.amenity-TU_CHOI,
.amenity-DA_HUY {
  background: #fff0ea;
  color: #a33225;
}
.amenity-CHO_DUYET {
  background: #fff2d9;
  color: #8a5416;
}
.amenity-hero {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 1rem;
}
.amenity-hero h1 {
  overflow-wrap: anywhere;
}
.amenity-hero-meta {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.4rem;
  border-radius: 0.8rem;
  background: #f2f6f4;
}
.amenity-hero-meta strong {
  font-size: 1.7rem;
}
.amenity-hero .amenity-text {
  grid-column: 1 / -1;
}
.amenity-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.amenity-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 1.2rem;
}
.amenity-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}
.amenity-filters .field {
  flex: 1 1 180px;
  margin-bottom: 0;
}
.amenity-calendar-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
}
.amenity-calendar-toolbar .field {
  margin-bottom: 0;
  flex: 1 1 200px;
}
.amenity-slots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
  gap: 0.7rem;
}
.amenity-slots button {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.8rem;
  background: #edf7f0;
  color: #225e46;
  border-color: #bdd6c6;
}
.amenity-slots button small {
  font-weight: 400;
}
.amenity-slots button.amenity-slot-booked {
  background: #fff2d9;
  color: #8a5416;
  border-color: #e4d2ad;
  opacity: 1;
}
.amenity-slots button:disabled:not(.amenity-slot-booked) {
  background: #f0f2f1;
  color: #68756e;
  border-color: #dce3de;
}
.amenity-booking-form {
  max-width: none;
}
.amenity-booking-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.amenity-booking-summary > div {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1.2rem;
  border-radius: 0.8rem;
  background: #f2f6f4;
}
.amenity-booking-summary strong {
  font-size: 1.6rem;
}
.amenity-booking-summary span {
  overflow-wrap: anywhere;
}
.amenity-subtitle,
.amenity-history small {
  display: block;
  color: #627c73;
}
.amenity-history {
  padding-left: 1.3rem;
}
.amenity-history li {
  padding: 0 0 1rem 0.3rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e4ebe7;
}
@media (max-width: 700px) {
  .amenity-cards,
  .amenity-action-grid,
  .amenity-form-grid,
  .amenity-hero,
  .amenity-booking-summary {
    grid-template-columns: minmax(0, 1fr);
  }
  .amenity-filters > button {
    width: 100%;
  }
  .amenity-slots {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .amenity-slots button {
    font-size: 0.8rem;
    padding: 0.6rem 0.3rem;
  }
}
.amenity-slots button.amenity-slot-selected {
  background: #14635a;
  color: white;
  border-color: #14635a;
  box-shadow: 0 0 0 2px #b7d9ca;
}
```
