# Cập nhật phí và hóa đơn trong VS Code

> Đây là bản hóa đơn ban đầu (migration 005). Nếu đã cập nhật điện bậc thang (006), dùng [hướng dẫn điện bậc thang](cap-nhat-dien-bac-thang-vscode.md) khi sửa 5 file liên quan; không chép lại phiên bản cũ bên dưới đè lên bản mới.

Code đầy đủ theo từng file cho bước phát triển sau commit `cdff84b` (đã có cư trú và phương tiện). Mở trang hướng dẫn này trên GitHub để copy từng khối vào VS Code, không cần tải ZIP.

## Chuẩn bị

Dừng backend/frontend bằng Ctrl+C tại đúng terminal. Mở thư mục dự án đang chạy. Giữ `.env`, `.certs`, dữ liệu MySQL và thư mục ảnh local. Nếu có sửa riêng trong các file sẽ thay, lưu bản riêng trước khi cập nhật.

Giữ nguyên các migration 001–004 đã chạy. Tạo migration 005 bên dưới. Cần cập nhật **đủ 11 file**; cả service phương tiện/cư trú có thay đổi để bảo vệ dữ liệu đã tính phí. Không khởi động ứng dụng khi mới copy một phần file. Dependency `qrcode` đã có từ chức năng QR trước, không cần cài thêm thư viện.

## 1. `database/migrations/005_billing.sql`

```sql
CREATE TABLE IF NOT EXISTS loai_phi (
  loai_phi VARCHAR(30) PRIMARY KEY,
  ten_phi VARCHAR(80) NOT NULL,
  don_vi_tinh VARCHAR(20) NOT NULL
) ENGINE=InnoDB;
INSERT IGNORE INTO loai_phi VALUES
 ('PHI_QUAN_LY','Phí quản lý','m²'),('GUI_O_TO','Gửi ô tô','xe'),
 ('GUI_XE_MAY','Gửi xe máy','xe'),('GUI_XE_DAP','Gửi xe đạp','xe'),
 ('TIEN_NUOC','Tiền nước','m³'),('TIEN_DIEN','Tiền điện','kWh');
CREATE TABLE IF NOT EXISTS cau_hinh_phi (
  ma_cau_hinh_phi INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  loai_phi VARCHAR(30) NOT NULL,
  don_gia DECIMAL(12,2) NOT NULL,
  tu_ngay DATE NOT NULL,
  den_ngay DATE NULL,
  ma_nguoi_tao INT UNSIGNED NOT NULL,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (loai_phi,tu_ngay),
  CHECK (don_gia >= 0),
  CHECK (den_ngay IS NULL OR den_ngay > tu_ngay),
  FOREIGN KEY (loai_phi) REFERENCES loai_phi(loai_phi),
  FOREIGN KEY (ma_nguoi_tao) REFERENCES nguoi_dung(ma_nguoi_dung)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS chi_so_dich_vu (
  ma_chi_so_dich_vu INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_can_ho INT UNSIGNED NOT NULL,
  loai_dich_vu ENUM('DIEN','NUOC') NOT NULL,
  ky_thanh_toan CHAR(7) NOT NULL,
  chi_so_cu DECIMAL(12,3) NOT NULL,
  chi_so_moi DECIMAL(12,3) NOT NULL,
  ngay_chot DATE NOT NULL,
  ghi_chu VARCHAR(255) NOT NULL DEFAULT '',
  ma_nguoi_ghi INT UNSIGNED NOT NULL,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ngay_ghi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (ma_can_ho,loai_dich_vu,ky_thanh_toan),
  CHECK (chi_so_cu >= 0 AND chi_so_moi >= chi_so_cu),
  FOREIGN KEY (ma_can_ho) REFERENCES can_ho(ma_can_ho),
  FOREIGN KEY (ma_nguoi_ghi) REFERENCES nguoi_dung(ma_nguoi_dung)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS hoa_don (
  ma_hoa_don INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  so_hoa_don VARCHAR(25) NOT NULL UNIQUE,
  ma_can_ho INT UNSIGNED NOT NULL,
  ky_thanh_toan CHAR(7) NOT NULL,
  ngay_chot_phi DATE NOT NULL,
  lan_lap INT UNSIGNED NOT NULL,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  trang_thai ENUM('NHAP','DA_DUYET','DA_GUI','DA_THANH_TOAN','HUY') NOT NULL DEFAULT 'NHAP',
  tinh_nuoc BOOLEAN NOT NULL,
  tinh_dien BOOLEAN NOT NULL,
  tinh_xe BOOLEAN NOT NULL,
  tong_tien DECIMAL(14,0) NOT NULL DEFAULT 0,
  loi_du_lieu JSON NOT NULL,
  dau_van_tay CHAR(64) NOT NULL,
  han_thanh_toan DATE NULL,
  ma_ngan_hang CHAR(6) NOT NULL DEFAULT '',
  so_tai_khoan VARCHAR(30) NOT NULL DEFAULT '',
  ten_nguoi_nhan VARCHAR(100) NOT NULL DEFAULT '',
  ma_hoa_don_thay_the_cho INT UNSIGNED NULL UNIQUE,
  ma_nguoi_lap INT UNSIGNED NOT NULL,
  ma_nguoi_duyet INT UNSIGNED NULL,
  ma_nguoi_gui INT UNSIGNED NULL,
  ma_nguoi_huy INT UNSIGNED NULL,
  ma_nguoi_xac_nhan INT UNSIGNED NULL,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngay_duyet DATETIME NULL,
  ngay_gui DATETIME NULL,
  ngay_huy DATETIME NULL,
  ngay_thanh_toan DATETIME NULL,
  ly_do_huy VARCHAR(255) NOT NULL DEFAULT '',
  so_tien_da_thu DECIMAL(14,0) NOT NULL DEFAULT 0,
  ma_tham_chieu VARCHAR(100) NULL UNIQUE,
  hieu_luc TINYINT GENERATED ALWAYS AS (CASE WHEN trang_thai='HUY' THEN NULL ELSE 1 END) STORED,
  UNIQUE (ma_can_ho,ky_thanh_toan,lan_lap),
  UNIQUE (ma_can_ho,ky_thanh_toan,hieu_luc),
  CHECK (tong_tien >= 0 AND so_tien_da_thu >= 0),
  CHECK (trang_thai <> 'DA_THANH_TOAN' OR (so_tien_da_thu=tong_tien AND ma_tham_chieu IS NOT NULL)),
  FOREIGN KEY (ma_can_ho) REFERENCES can_ho(ma_can_ho),
  FOREIGN KEY (ma_hoa_don_thay_the_cho) REFERENCES hoa_don(ma_hoa_don),
  FOREIGN KEY (ma_nguoi_lap) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_nguoi_duyet) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_nguoi_gui) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_nguoi_huy) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_nguoi_xac_nhan) REFERENCES nguoi_dung(ma_nguoi_dung),
  INDEX idx_bill_source (ma_can_ho,trang_thai,ngay_chot_phi)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS chi_tiet_hoa_don (
  ma_chi_tiet_hoa_don INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_hoa_don INT UNSIGNED NOT NULL,
  ma_cau_hinh_phi INT UNSIGNED NOT NULL,
  ma_chi_so_dich_vu INT UNSIGNED NULL,
  loai_phi VARCHAR(30) NOT NULL,
  dien_giai VARCHAR(255) NOT NULL,
  don_vi_tinh VARCHAR(20) NOT NULL,
  so_luong DECIMAL(12,3) NOT NULL,
  don_gia DECIMAL(12,2) NOT NULL,
  thanh_tien DECIMAL(14,0) NOT NULL,
  du_lieu_nguon JSON NOT NULL,
  CHECK (so_luong >= 0 AND don_gia >= 0 AND thanh_tien >= 0),
  FOREIGN KEY (ma_hoa_don) REFERENCES hoa_don(ma_hoa_don),
  FOREIGN KEY (ma_cau_hinh_phi) REFERENCES cau_hinh_phi(ma_cau_hinh_phi),
  FOREIGN KEY (ma_chi_so_dich_vu) REFERENCES chi_so_dich_vu(ma_chi_so_dich_vu)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS lich_su_hoa_don (
  ma_lich_su_hoa_don INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_hoa_don INT UNSIGNED NOT NULL,
  su_kien VARCHAR(30) NOT NULL,
  ma_nguoi_ghi INT UNSIGNED NOT NULL,
  ghi_chu VARCHAR(255) NOT NULL DEFAULT '',
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_hoa_don) REFERENCES hoa_don(ma_hoa_don),
  FOREIGN KEY (ma_nguoi_ghi) REFERENCES nguoi_dung(ma_nguoi_dung)
) ENGINE=InnoDB;
```

## 2. `backend/src/modules/billing/billing.validation.js`

```js
import { fail, integer, text } from "../../lib/http.js";
export const feeTypes = [
  "PHI_QUAN_LY",
  "GUI_O_TO",
  "GUI_XE_MAY",
  "GUI_XE_DAP",
  "TIEN_NUOC",
  "TIEN_DIEN",
];
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function day(value, future = false) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    fail(422, "INVALID_DATE", "Ngày cần theo định dạng YYYY-MM-DD.");
  const d = new Date(`${value}T00:00:00Z`);
  if (
    Number.isNaN(d.getTime()) ||
    d.toISOString().slice(0, 10) !== value ||
    value < "1900-01-01" ||
    value > "2199-12-31" ||
    (!future && value > today())
  )
    fail(422, "INVALID_DATE", "Ngày không hợp lệ hoặc vượt ngày cho phép.");
  return value;
}
export function period(value) {
  if (
    typeof value !== "string" ||
    !/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(value)
  )
    fail(422, "INVALID_PERIOD", "Kỳ thu cần có định dạng YYYY-MM.");
  return value;
}
export function monthDay(value, month) {
  day(value);
  if (value.slice(0, 7) !== period(month))
    fail(422, "INVALID_CUTOFF", "Ngày chốt phải thuộc kỳ thu đã chọn.");
  return value;
}
export function scaled(value, scale = 2, digits = 10) {
  const s = String(value ?? "");
  if (!new RegExp(`^\\d{1,${digits}}(?:\\.\\d{1,${scale}})?$`).test(s))
    fail(422, "INVALID_DECIMAL", `Nhập số không âm với tối đa ${scale} số lẻ.`);
  const [a, b = ""] = s.split(".");
  return BigInt(a) * 10n ** BigInt(scale) + BigInt(b.padEnd(scale, "0"));
}
export const decimal = (n, scale) => {
  const s = n.toString().padStart(scale + 1, "0");
  return `${s.slice(0, -scale)}.${s.slice(-scale)}`;
};
export function amount(value) {
  const s = String(value ?? "");
  if (!/^\d{1,14}$/.test(s))
    fail(
      422,
      "INVALID_AMOUNT",
      "Số tiền cần là số nguyên đồng, tối đa 14 chữ số.",
    );
  return BigInt(s);
}
export function lineTotal(qty, price) {
  const n = (scaled(qty, 3, 9) * scaled(price, 2, 10) + 50000n) / 100000n;
  if (n > 99999999999999n)
    fail(422, "AMOUNT_TOO_LARGE", "Số tiền vượt giới hạn.");
  return n.toString();
}
export function options(body) {
  const result = {};
  for (const key of ["tinh_nuoc", "tinh_dien", "tinh_xe"]) {
    if (typeof body[key] !== "boolean")
      fail(
        422,
        "INVALID_OPTIONS",
        "Cần chọn rõ các khoản nước, điện và xe được thu.",
      );
    result[key] = body[key];
  }
  return result;
}
export function version(row, value) {
  if (row.phien_ban !== integer(value, "phien_ban"))
    fail(409, "STALE_VERSION", "Hóa đơn hoặc chỉ số đã thay đổi. Hãy tải lại.");
}
export function pagination(query) {
  const page = integer(query.page || 1, "page");
  if (page < 1 || page > 100000)
    fail(422, "INVALID_PAGE", "Trang không hợp lệ.");
  return { page, offset: (page - 1) * 20 };
}
```

## 3. `backend/src/modules/billing/billing.guards.js`

```js
import { rows } from "../../lib/db.js";
import { fail } from "../../lib/http.js";
export async function lockApartment(db, id) {
  const [a] = await rows(
    db,
    "SELECT * FROM can_ho WHERE ma_can_ho=? FOR UPDATE",
    [id],
  );
  if (!a) fail(404, "NOT_FOUND", "Không tìm thấy căn hộ.");
  return a;
}
export async function assertVehiclePeriodOpen(db, apartmentId, from) {
  await lockApartment(db, apartmentId);
  const locked = await rows(
    db,
    "SELECT ma_hoa_don FROM hoa_don WHERE ma_can_ho=? AND tinh_xe=1 AND trang_thai IN ('DA_DUYET','DA_GUI','DA_THANH_TOAN') AND ngay_chot_phi>=? LIMIT 1 FOR UPDATE",
    [apartmentId, from],
  );
  if (locked.length)
    fail(
      409,
      "BILLED_VEHICLE_PERIOD",
      "Phí xe tại ngày này đã được chốt trong hóa đơn. Hãy chọn ngày sau ngày chốt hoặc xử lý hóa đơn trước.",
    );
}
```

## 4. `backend/src/modules/billing/billing.qr.js`

```js
import { fail } from "../../lib/http.js";
export function crc16(text) {
  let crc = 0xffff;
  for (const byte of Buffer.from(text, "utf8")) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++)
      crc = ((crc << 1) ^ (crc & 0x8000 ? 0x1021 : 0)) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
function tlv(id, value) {
  const s = String(value),
    length = Buffer.byteLength(s, "utf8");
  if (length > 99) fail(422, "QR_TOO_LONG", "Thông tin QR quá dài.");
  return id + String(length).padStart(2, "0") + s;
}
export function vietQR(bill) {
  if (bill.trang_thai !== "DA_GUI") return null;
  const bank = tlv("00", bill.ma_ngan_hang) + tlv("01", bill.so_tai_khoan);
  const transfer =
    tlv("00", "A000000727") + tlv("01", bank) + tlv("02", "QRIBFTTA");
  const payload =
    tlv("00", "01") +
    tlv("01", "12") +
    tlv("38", transfer) +
    tlv("53", "704") +
    tlv("54", bill.tong_tien) +
    tlv("58", "VN") +
    tlv("62", tlv("08", bill.so_hoa_don)) +
    "6304";
  return payload + crc16(payload);
}
```

## 5. `backend/src/modules/billing/billing.service.js`

```js
import { createHash, randomBytes } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, integer, text } from "../../lib/http.js";
import { lockApartment } from "./billing.guards.js";
import { vietQR } from "./billing.qr.js";
import * as v from "./billing.validation.js";

const json = (x) => (typeof x === "string" ? JSON.parse(x) : x);
function stable(x) {
  if (Array.isArray(x)) return x.map(stable);
  if (x && typeof x === "object")
    return Object.fromEntries(
      Object.keys(x)
        .sort()
        .map((k) => [k, stable(x[k])]),
    );
  return x;
}
const digest = (x) =>
  createHash("sha256")
    .update(JSON.stringify(stable(x)))
    .digest("hex");
const fixed = ["DA_DUYET", "DA_GUI", "DA_THANH_TOAN"];
const state = (row, allowed) => {
  if (!allowed.includes(row.trang_thai))
    fail(
      409,
      "INVALID_STATE",
      "Trạng thái hóa đơn không cho phép thao tác này.",
    );
};
const opts = (row, body = {}) =>
  v.options(
    Object.fromEntries(
      ["tinh_nuoc", "tinh_dien", "tinh_xe"].map((key) => [
        key,
        key in body ? body[key] : !!row[key],
      ]),
    ),
  );
async function log(db, id, user, event, note = "") {
  await rows(
    db,
    "INSERT INTO lich_su_hoa_don (ma_hoa_don,ma_nguoi_ghi,su_kien,ghi_chu) VALUES (?,?,?,?)",
    [id, user.ma_nguoi_dung, event, note],
  );
}

export async function rates(query) {
  const { page, offset } = v.pagination(query),
    values = [],
    where = [];
  if (query.loai_phi) {
    where.push("c.loai_phi=?");
    values.push(choice(query.loai_phi, "loai_phi", v.feeTypes));
  }
  const condition = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM cau_hinh_phi c ${condition}`,
    values,
  );
  const data = await rows(
    pool,
    `SELECT c.*,l.ten_phi,l.don_vi_tinh FROM cau_hinh_phi c JOIN loai_phi l ON l.loai_phi=c.loai_phi ${condition} ORDER BY c.ma_cau_hinh_phi DESC LIMIT 20 OFFSET ${offset}`,
    values,
  );
  return { data, total: count.total, page };
}
export async function createRate(body, user) {
  const type = choice(body.loai_phi, "loai_phi", v.feeTypes),
    price = v.decimal(v.scaled(body.don_gia), 2),
    from = v.day(body.tu_ngay, true);
  return transaction(async (db) => {
    await rows(
      db,
      "SELECT loai_phi FROM loai_phi WHERE loai_phi=? FOR UPDATE",
      [type],
    );
    const [last] = await rows(
      db,
      "SELECT * FROM cau_hinh_phi WHERE loai_phi=? ORDER BY tu_ngay DESC LIMIT 1 FOR UPDATE",
      [type],
    );
    if (last) {
      if (from <= last.tu_ngay)
        fail(
          422,
          "RATE_ORDER",
          "Ngày áp dụng mới phải sau phiên bản giá gần nhất.",
        );
      const used = await rows(
        db,
        "SELECT h.ma_hoa_don FROM chi_tiet_hoa_don d JOIN hoa_don h ON h.ma_hoa_don=d.ma_hoa_don WHERE d.ma_cau_hinh_phi=? AND h.trang_thai<>'HUY' AND h.ngay_chot_phi>=? LIMIT 1",
        [last.ma_cau_hinh_phi, from],
      );
      if (used.length)
        fail(
          409,
          "RATE_IN_USE",
          "Ngày áp dụng mới trùng khoảng giá đã dùng. Chọn ngày sau ngày chốt hóa đơn đã lập.",
        );
      await rows(
        db,
        "UPDATE cau_hinh_phi SET den_ngay=? WHERE ma_cau_hinh_phi=?",
        [from, last.ma_cau_hinh_phi],
      );
    }
    const result = await rows(
      db,
      "INSERT INTO cau_hinh_phi (loai_phi,don_gia,tu_ngay,ma_nguoi_tao) VALUES (?,?,?,?)",
      [type, price, from, user.ma_nguoi_dung],
    );
    return { ma_cau_hinh_phi: result.insertId };
  });
}
export async function meters(query) {
  const { page, offset } = v.pagination(query),
    values = [],
    where = [];
  if (query.ma_can_ho) {
    where.push("m.ma_can_ho=?");
    values.push(integer(query.ma_can_ho, "ma_can_ho"));
  }
  if (query.ky_thanh_toan) {
    where.push("m.ky_thanh_toan=?");
    values.push(v.period(query.ky_thanh_toan));
  }
  const condition = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM chi_so_dich_vu m ${condition}`,
    values,
  );
  const data = await rows(
    pool,
    `SELECT m.*,a.so_can_ho FROM chi_so_dich_vu m JOIN can_ho a ON a.ma_can_ho=m.ma_can_ho ${condition} ORDER BY m.ky_thanh_toan DESC,m.ma_chi_so_dich_vu DESC LIMIT 20 OFFSET ${offset}`,
    values,
  );
  return { data, total: count.total, page };
}
export async function saveMeter(body, user) {
  const apartmentId = integer(body.ma_can_ho, "ma_can_ho"),
    type = choice(body.loai_dich_vu, "loai_dich_vu", ["DIEN", "NUOC"]),
    month = v.period(body.ky_thanh_toan),
    day = v.monthDay(body.ngay_chot, month);
  const old = v.scaled(body.chi_so_cu, 3, 9),
    next = v.scaled(body.chi_so_moi, 3, 9),
    note = text(body.ghi_chu ?? "", "ghi_chu", 0, 255);
  if (next < old)
    fail(422, "METER_DECREASE", "Chỉ số mới không được nhỏ hơn chỉ số cũ.");
  return transaction(async (db) => {
    await lockApartment(db, apartmentId);
    const billed = await rows(
      db,
      "SELECT ma_hoa_don FROM hoa_don WHERE ma_can_ho=? AND ky_thanh_toan=? AND trang_thai IN ('DA_DUYET','DA_GUI','DA_THANH_TOAN') LIMIT 1 FOR UPDATE",
      [apartmentId, month],
    );
    if (billed.length)
      fail(
        409,
        "METER_LOCKED",
        "Kỳ này đã có hóa đơn được duyệt. Hủy hóa đơn chưa thanh toán trước khi điều chỉnh chỉ số.",
      );
    const records = await rows(
      db,
      "SELECT * FROM chi_so_dich_vu WHERE ma_can_ho=? AND loai_dich_vu=? ORDER BY ky_thanh_toan DESC FOR UPDATE",
      [apartmentId, type],
    );
    if (records[0]?.ky_thanh_toan > month)
      fail(
        409,
        "METER_LATER_PERIOD",
        "Chỉ ghi hoặc sửa kỳ mới nhất; đã có chỉ số kỳ sau.",
      );
    const current = records.find((r) => r.ky_thanh_toan === month),
      previous = records.find((r) => r.ky_thanh_toan < month);
    if (previous) {
      const prior = new Date(`${month}-01T00:00:00Z`);
      prior.setUTCMonth(prior.getUTCMonth() - 1);
      if (previous.ky_thanh_toan !== prior.toISOString().slice(0, 7))
        fail(
          422,
          "MISSING_PREVIOUS_METER",
          "Thiếu chỉ số kỳ liền trước. Hãy bổ sung trước khi ghi kỳ này.",
        );
      if (old !== v.scaled(previous.chi_so_moi, 3, 9))
        fail(
          422,
          "METER_CHAIN",
          "Chỉ số cũ phải bằng chỉ số mới của kỳ liền trước.",
        );
    } else if (!current && body.ky_dau !== true)
      fail(
        422,
        "FIRST_METER",
        "Kỳ đầu cần xác nhận nhập cả chỉ số đầu và cuối.",
      );
    if (current) {
      v.version(current, body.phien_ban);
      await rows(
        db,
        "UPDATE chi_so_dich_vu SET chi_so_cu=?,chi_so_moi=?,ngay_chot=?,ghi_chu=?,ma_nguoi_ghi=?,ngay_ghi=CURRENT_TIMESTAMP,phien_ban=phien_ban+1 WHERE ma_chi_so_dich_vu=?",
        [
          v.decimal(old, 3),
          v.decimal(next, 3),
          day,
          note,
          user.ma_nguoi_dung,
          current.ma_chi_so_dich_vu,
        ],
      );
      return { ma_chi_so_dich_vu: current.ma_chi_so_dich_vu };
    }
    const result = await rows(
      db,
      "INSERT INTO chi_so_dich_vu (ma_can_ho,loai_dich_vu,ky_thanh_toan,chi_so_cu,chi_so_moi,ngay_chot,ghi_chu,ma_nguoi_ghi) VALUES (?,?,?,?,?,?,?,?)",
      [
        apartmentId,
        type,
        month,
        v.decimal(old, 3),
        v.decimal(next, 3),
        day,
        note,
        user.ma_nguoi_dung,
      ],
    );
    return { ma_chi_so_dich_vu: result.insertId };
  });
}

async function calculate(db, apartment, month, day, options) {
  await rows(db, "SELECT loai_phi FROM loai_phi ORDER BY loai_phi FOR UPDATE");
  const rates = await rows(
    db,
    "SELECT c.*,l.ten_phi,l.don_vi_tinh FROM cau_hinh_phi c JOIN loai_phi l ON l.loai_phi=c.loai_phi WHERE c.tu_ngay<=? AND (c.den_ngay IS NULL OR c.den_ngay>?) ORDER BY c.loai_phi FOR UPDATE",
    [day, day],
  );
  const meters = await rows(
    db,
    "SELECT * FROM chi_so_dich_vu WHERE ma_can_ho=? AND ky_thanh_toan=? ORDER BY loai_dich_vu FOR UPDATE",
    [apartment.ma_can_ho, month],
  );
  const cars = options.tinh_xe
    ? await rows(
        db,
        "SELECT ma_phuong_tien,loai_xe FROM phuong_tien WHERE ma_can_ho=? AND ngay_dang_ky<=? AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc>?) ORDER BY ma_phuong_tien FOR UPDATE",
        [apartment.ma_can_ho, day, day],
      )
    : [];
  const lines = [],
    errors = [];
  function add(type, quantity, source = {}, meterId = null) {
    const rate = rates.find((r) => r.loai_phi === type);
    if (!rate) {
      errors.push(`Thiếu đơn giá ${type} tại ngày chốt.`);
      return;
    }
    const qty = v.decimal(v.scaled(quantity, 3, 9), 3),
      price = v.decimal(v.scaled(rate.don_gia), 2);
    lines.push({
      loai_phi: type,
      dien_giai: rate.ten_phi,
      don_vi_tinh: rate.don_vi_tinh,
      so_luong: qty,
      don_gia: price,
      thanh_tien: v.lineTotal(qty, price),
      ma_cau_hinh_phi: rate.ma_cau_hinh_phi,
      ma_chi_so_dich_vu: meterId,
      du_lieu_nguon: source,
    });
  }
  if (apartment.tinh_phi_dich_vu) add("PHI_QUAN_LY", apartment.dien_tich_m2);
  if (options.tinh_xe)
    for (const [type, fee] of [
      ["O_TO", "GUI_O_TO"],
      ["XE_MAY", "GUI_XE_MAY"],
      ["XE_DAP", "GUI_XE_DAP"],
    ]) {
      const selected = cars.filter((r) => r.loai_xe === type);
      if (selected.length)
        add(fee, String(selected.length), {
          ma_dang_ky: selected.map((r) => r.ma_phuong_tien),
        });
    }
  for (const [type, enabled] of [
    ["NUOC", options.tinh_nuoc],
    ["DIEN", options.tinh_dien],
  ])
    if (enabled) {
      const meter = meters.find((r) => r.loai_dich_vu === type);
      if (!meter || meter.ngay_chot !== day) {
        errors.push(`Thiếu chỉ số ${type} đúng ngày chốt ${day}.`);
        continue;
      }
      const used =
        v.scaled(meter.chi_so_moi, 3, 9) - v.scaled(meter.chi_so_cu, 3, 9);
      add(
        `TIEN_${type}`,
        v.decimal(used, 3),
        {
          chi_so_cu: meter.chi_so_cu,
          chi_so_moi: meter.chi_so_moi,
          phien_ban: meter.phien_ban,
        },
        meter.ma_chi_so_dich_vu,
      );
    }
  if (!lines.length) errors.push("Chưa có khoản phí hợp lệ được áp dụng.");
  const total = lines.reduce((n, l) => n + BigInt(l.thanh_tien), 0n);
  if (total > 99999999999999n)
    fail(422, "AMOUNT_TOO_LARGE", "Tổng hóa đơn vượt giới hạn.");
  return {
    lines,
    errors,
    total: total.toString(),
    hash: digest({ lines, errors }),
  };
}
async function storeSnapshot(db, id, snapshot) {
  await rows(db, "DELETE FROM chi_tiet_hoa_don WHERE ma_hoa_don=?", [id]);
  for (const l of snapshot.lines)
    await rows(
      db,
      "INSERT INTO chi_tiet_hoa_don (ma_hoa_don,ma_cau_hinh_phi,ma_chi_so_dich_vu,loai_phi,dien_giai,don_vi_tinh,so_luong,don_gia,thanh_tien,du_lieu_nguon) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [
        id,
        l.ma_cau_hinh_phi,
        l.ma_chi_so_dich_vu,
        l.loai_phi,
        l.dien_giai,
        l.don_vi_tinh,
        l.so_luong,
        l.don_gia,
        l.thanh_tien,
        JSON.stringify(l.du_lieu_nguon),
      ],
    );
  await rows(
    db,
    "UPDATE hoa_don SET tong_tien=?,loi_du_lieu=?,dau_van_tay=? WHERE ma_hoa_don=?",
    [snapshot.total, JSON.stringify(snapshot.errors), snapshot.hash, id],
  );
}
async function makeDraft(db, apartment, body, user, previous = null) {
  const month = v.period(body.ky_thanh_toan),
    day = v.monthDay(body.ngay_chot_phi, month),
    options = v.options(body);
  const existing = await rows(
    db,
    "SELECT * FROM hoa_don WHERE ma_can_ho=? AND ky_thanh_toan=? ORDER BY lan_lap DESC FOR UPDATE",
    [apartment.ma_can_ho, month],
  );
  if (existing.some((h) => h.trang_thai !== "HUY"))
    fail(
      409,
      "BILL_EXISTS",
      "Căn đã có hóa đơn còn hiệu lực trong kỳ. Mở hóa đơn nháp để tính lại.",
    );
  if (
    existing.length &&
    (!previous || existing[0].ma_hoa_don !== previous.ma_hoa_don)
  )
    fail(
      409,
      "REPLACEMENT_REQUIRED",
      "Hãy lập thay thế từ hóa đơn hủy gần nhất.",
    );
  const snapshot = await calculate(db, apartment, month, day, options);
  const result = await rows(
    db,
    "INSERT INTO hoa_don (so_hoa_don,ma_can_ho,ky_thanh_toan,ngay_chot_phi,lan_lap,tinh_nuoc,tinh_dien,tinh_xe,loi_du_lieu,dau_van_tay,ma_nguoi_lap,ma_hoa_don_thay_the_cho) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    [
      `HD${month.replace("-", "")}-${randomBytes(6).toString("hex").toUpperCase()}`,
      apartment.ma_can_ho,
      month,
      day,
      (existing[0]?.lan_lap || 0) + 1,
      options.tinh_nuoc,
      options.tinh_dien,
      options.tinh_xe,
      "[]",
      snapshot.hash,
      user.ma_nguoi_dung,
      previous?.ma_hoa_don || null,
    ],
  );
  await storeSnapshot(db, result.insertId, snapshot);
  await log(db, result.insertId, user, previous ? "LAP_THAY_THE" : "LAP_NHAP");
  return { ma_hoa_don: result.insertId };
}
export async function generate(body, user) {
  const id = integer(body.ma_can_ho, "ma_can_ho");
  return transaction(async (db) =>
    makeDraft(db, await lockApartment(db, id), body, user),
  );
}
async function lockedBill(db, id) {
  const [row] = await rows(
    db,
    "SELECT ma_can_ho FROM hoa_don WHERE ma_hoa_don=?",
    [id],
  );
  if (!row) fail(404, "NOT_FOUND", "Không tìm thấy hóa đơn.");
  const apartment = await lockApartment(db, row.ma_can_ho);
  const [bill] = await rows(
    db,
    "SELECT * FROM hoa_don WHERE ma_hoa_don=? FOR UPDATE",
    [id],
  );
  return { bill, apartment };
}
export async function action(id, action, body, user) {
  return transaction(async (db) => {
    const { bill, apartment } = await lockedBill(db, id);
    if (
      action === "xac_nhan_thanh_toan" &&
      bill.trang_thai === "DA_THANH_TOAN"
    ) {
      if (
        v.amount(body.so_tien).toString() === bill.so_tien_da_thu &&
        text(body.ma_tham_chieu, "ma_tham_chieu", 3, 100) === bill.ma_tham_chieu
      )
        return { ma_hoa_don: id };
      fail(409, "ALREADY_PAID", "Hóa đơn đã được xác nhận thu.");
    }
    v.version(bill, body.phien_ban);
    if (action === "lap_thay_the") {
      state(bill, ["HUY"]);
      return makeDraft(
        db,
        apartment,
        {
          ky_thanh_toan: bill.ky_thanh_toan,
          ngay_chot_phi: body.ngay_chot_phi ?? bill.ngay_chot_phi,
          ...opts(bill, body),
        },
        user,
        bill,
      );
    }
    if (action === "tinh_lai") {
      state(bill, ["NHAP"]);
      const day = v.monthDay(
          body.ngay_chot_phi ?? bill.ngay_chot_phi,
          bill.ky_thanh_toan,
        ),
        options = opts(bill, body);
      await storeSnapshot(
        db,
        id,
        await calculate(db, apartment, bill.ky_thanh_toan, day, options),
      );
      await rows(
        db,
        "UPDATE hoa_don SET ngay_chot_phi=?,tinh_nuoc=?,tinh_dien=?,tinh_xe=? WHERE ma_hoa_don=?",
        [day, options.tinh_nuoc, options.tinh_dien, options.tinh_xe, id],
      );
    } else if (action === "duyet") {
      state(bill, ["NHAP"]);
      const current = await calculate(
        db,
        apartment,
        bill.ky_thanh_toan,
        bill.ngay_chot_phi,
        opts(bill),
      );
      if (current.errors.length || BigInt(current.total) <= 0n)
        fail(
          422,
          "INCOMPLETE_BILL",
          "Hóa đơn còn thiếu dữ liệu hoặc tổng bằng 0. Bổ sung và tính lại bản nháp.",
        );
      if (current.hash !== bill.dau_van_tay || current.total !== bill.tong_tien)
        fail(
          409,
          "STALE_BILL_SOURCE",
          "Dữ liệu nguồn đã thay đổi. Hãy tính lại bản nháp trước khi duyệt.",
        );
      const saved = await rows(
        db,
        "SELECT * FROM chi_tiet_hoa_don WHERE ma_hoa_don=? ORDER BY ma_chi_tiet_hoa_don",
        [id],
      );
      const lines = saved.map(({ ma_hoa_don, ma_chi_tiet_hoa_don, ...l }) => ({
        ...l,
        du_lieu_nguon: json(l.du_lieu_nguon),
      }));
      if (
        digest({ lines, errors: json(bill.loi_du_lieu) }) !== bill.dau_van_tay
      )
        fail(
          409,
          "BILL_TOTAL_MISMATCH",
          "Chi tiết hóa đơn không khớp dữ liệu đã lập. Hãy tính lại.",
        );
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='DA_DUYET',ma_nguoi_duyet=?,ngay_duyet=CURRENT_TIMESTAMP WHERE ma_hoa_don=?",
        [user.ma_nguoi_dung, id],
      );
    } else if (action === "gui") {
      state(bill, ["DA_DUYET"]);
      const due = v.day(body.han_thanh_toan, true),
        bin = text(body.ma_ngan_hang, "ma_ngan_hang", 6, 6),
        account = text(body.so_tai_khoan, "so_tai_khoan", 6, 30),
        name = text(body.ten_nguoi_nhan, "ten_nguoi_nhan", 2, 100);
      if (
        due < bill.ngay_chot_phi ||
        due < v.today() ||
        !/^\d{6}$/.test(bin) ||
        !/^\d{6,30}$/.test(account)
      )
        fail(
          422,
          "INVALID_PAYMENT_DETAILS",
          "Hạn trả phải từ hôm nay và không trước ngày chốt; BIN gồm 6 số, tài khoản gồm 6–30 số.",
        );
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='DA_GUI',han_thanh_toan=?,ma_ngan_hang=?,so_tai_khoan=?,ten_nguoi_nhan=?,ma_nguoi_gui=?,ngay_gui=CURRENT_TIMESTAMP WHERE ma_hoa_don=?",
        [due, bin, account, name, user.ma_nguoi_dung, id],
      );
    } else if (action === "huy") {
      state(bill, ["NHAP", "DA_DUYET", "DA_GUI"]);
      const reason = text(body.ly_do, "ly_do", 3, 255);
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='HUY',ly_do_huy=?,ma_nguoi_huy=?,ngay_huy=CURRENT_TIMESTAMP WHERE ma_hoa_don=?",
        [reason, user.ma_nguoi_dung, id],
      );
    } else if (action === "xac_nhan_thanh_toan") {
      state(bill, ["DA_GUI"]);
      const amount = v.amount(body.so_tien),
        reference = text(body.ma_tham_chieu, "ma_tham_chieu", 3, 100);
      if (amount !== BigInt(bill.tong_tien))
        fail(
          422,
          "WRONG_AMOUNT",
          "Chỉ xác nhận khi số tiền đã đối soát bằng đúng tổng hóa đơn.",
        );
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='DA_THANH_TOAN',so_tien_da_thu=?,ma_tham_chieu=?,ma_nguoi_xac_nhan=?,ngay_thanh_toan=CURRENT_TIMESTAMP WHERE ma_hoa_don=?",
        [amount.toString(), reference, user.ma_nguoi_dung, id],
      );
    } else fail(404, "NOT_FOUND", "Không có thao tác hóa đơn này.");
    await rows(
      db,
      "UPDATE hoa_don SET phien_ban=phien_ban+1 WHERE ma_hoa_don=?",
      [id],
    );
    await log(
      db,
      id,
      user,
      action.toUpperCase(),
      action === "huy" ? text(body.ly_do, "ly_do", 3, 255) : "",
    );
    return { ma_hoa_don: id };
  });
}

function access(user, where, values) {
  if (user.vai_tro === "QUAN_TRI_VIEN") return;
  if (user.vai_tro !== "CU_DAN")
    fail(403, "FORBIDDEN", "Bạn không có quyền xem hóa đơn.");
  where.push(
    "h.trang_thai IN ('DA_GUI','DA_THANH_TOAN') AND EXISTS (SELECT 1 FROM cu_dan c JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan WHERE c.ma_nguoi_dung=? AND l.ma_can_ho=h.ma_can_ho AND l.den_ngay IS NULL AND l.tu_ngay<=h.ngay_chot_phi)",
  );
  values.push(user.ma_nguoi_dung);
}
function summary(bill) {
  return {
    ...bill,
    qua_han: bill.trang_thai === "DA_GUI" && bill.han_thanh_toan < v.today(),
  };
}
export async function list(query, user) {
  const { page, offset } = v.pagination(query),
    where = [],
    values = [];
  access(user, where, values);
  if (query.ky_thanh_toan) {
    where.push("h.ky_thanh_toan=?");
    values.push(v.period(query.ky_thanh_toan));
  }
  if (query.trang_thai) {
    where.push("h.trang_thai=?");
    values.push(
      choice(query.trang_thai, "trang_thai", [
        "NHAP",
        "DA_DUYET",
        "DA_GUI",
        "DA_THANH_TOAN",
        "HUY",
      ]),
    );
  }
  if (query.ma_can_ho) {
    where.push("h.ma_can_ho=?");
    values.push(integer(query.ma_can_ho, "ma_can_ho"));
  }
  if (query.q) {
    const q = text(query.q, "q", 1, 100);
    where.push("(h.so_hoa_don LIKE ? OR a.so_can_ho LIKE ?)");
    values.push(`%${q}%`, `%${q}%`);
  }
  const condition = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho ${condition}`,
    values,
  );
  const data = await rows(
    pool,
    `SELECT h.ma_hoa_don,h.so_hoa_don,h.ky_thanh_toan,h.ngay_chot_phi,h.trang_thai,h.tong_tien,h.han_thanh_toan,a.so_can_ho FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho ${condition} ORDER BY h.ma_hoa_don DESC LIMIT 20 OFFSET ${offset}`,
    values,
  );
  return { data: data.map(summary), total: count.total, page };
}
export async function detail(id, user) {
  const where = ["h.ma_hoa_don=?"],
    values = [id];
  access(user, where, values);
  const [row] = await rows(
    pool,
    `SELECT h.*,a.so_can_ho FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho WHERE ${where.join(" AND ")}`,
    values,
  );
  if (!row)
    fail(
      404,
      "NOT_FOUND",
      "Không tìm thấy hóa đơn hoặc bạn không còn quyền xem.",
    );
  const lines = await rows(
    pool,
    "SELECT * FROM chi_tiet_hoa_don WHERE ma_hoa_don=? ORDER BY ma_chi_tiet_hoa_don",
    [id],
  );
  if (user.vai_tro === "QUAN_TRI_VIEN")
    return {
      ...summary(row),
      loi_du_lieu: json(row.loi_du_lieu),
      lines: lines.map((l) => ({ ...l, du_lieu_nguon: json(l.du_lieu_nguon) })),
      history: await rows(
        pool,
        "SELECT l.*,u.ho_va_ten FROM lich_su_hoa_don l JOIN nguoi_dung u ON u.ma_nguoi_dung=l.ma_nguoi_ghi WHERE ma_hoa_don=? ORDER BY l.ma_lich_su_hoa_don",
        [id],
      ),
      qr_payload: vietQR(row),
    };
  const allowed = [
    "ma_hoa_don",
    "so_hoa_don",
    "so_can_ho",
    "ky_thanh_toan",
    "ngay_chot_phi",
    "trang_thai",
    "tong_tien",
    "han_thanh_toan",
    "ma_ngan_hang",
    "so_tai_khoan",
    "ten_nguoi_nhan",
    "ngay_thanh_toan",
    "so_tien_da_thu",
    "ma_tham_chieu",
  ];
  return {
    ...summary(Object.fromEntries(allowed.map((k) => [k, row[k]]))),
    lines: lines.map((l) =>
      Object.fromEntries(
        ["dien_giai", "don_vi_tinh", "so_luong", "don_gia", "thanh_tien"].map(
          (k) => [k, l[k]],
        ),
      ),
    ),
    qr_payload: vietQR(row),
  };
}
```

## 6. `backend/src/modules/billing/billing.routes.js`

```js
import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./billing.service.js";
export const ratesRouter = Router(),
  metersRouter = Router(),
  billsRouter = Router(),
  selfBillsRouter = Router();
for (const router of [ratesRouter, metersRouter, billsRouter])
  router.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
selfBillsRouter.use(optionalAuth, requireAuth, roles("CU_DAN"));
ratesRouter.get("/", async (req, res) =>
  res.json(await service.rates(req.query)),
);
ratesRouter.post("/", async (req, res) =>
  res.status(201).json({ data: await service.createRate(req.body, req.user) }),
);
metersRouter.get("/", async (req, res) =>
  res.json(await service.meters(req.query)),
);
metersRouter.put("/", async (req, res) =>
  res.json({ data: await service.saveMeter(req.body, req.user) }),
);
billsRouter.post("/lap", async (req, res) =>
  res.status(201).json({ data: await service.generate(req.body, req.user) }),
);
for (const router of [billsRouter, selfBillsRouter]) {
  router.get("/", async (req, res) =>
    res.json(await service.list(req.query, req.user)),
  );
  router.get("/:id", async (req, res) =>
    res.json({
      data: await service.detail(integer(req.params.id, "id"), req.user),
    }),
  );
}
for (const action of [
  "tinh_lai",
  "duyet",
  "gui",
  "huy",
  "lap_thay_the",
  "xac_nhan_thanh_toan",
])
  billsRouter.post(`/:id/${action}`, async (req, res) =>
    res.json({
      data: await service.action(
        integer(req.params.id, "id"),
        action,
        req.body,
        req.user,
      ),
    }),
  );
```

## 7. `backend/src/modules/vehicles/vehicles.service.js`

```js
import { randomBytes } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, integer, text } from "../../lib/http.js";
import { date } from "../residency/residency.validation.js";
import * as valid from "./vehicles.validation.js";
import {
  lockApartment,
  assertVehiclePeriodOpen,
} from "../billing/billing.guards.js";

const joins = `FROM phuong_tien v JOIN cu_dan c ON c.ma_cu_dan=v.ma_cu_dan JOIN can_ho a ON a.ma_can_ho=v.ma_can_ho`;
const columns = `v.*,c.ho_va_ten,c.so_dien_thoai,a.so_can_ho`;
async function residentLock(db, id) {
  const [resident] = await rows(
    db,
    "SELECT ma_cu_dan FROM cu_dan WHERE ma_cu_dan=? FOR UPDATE",
    [id],
  );
  if (!resident) fail(404, "NOT_FOUND", "Không tìm thấy cư dân.");
}
export async function list(query) {
  const q = query.q ? text(query.q, "q", 1, 100) : "";
  const page = integer(query.page || 1, "page");
  if (page < 1 || page > 100000)
    fail(422, "INVALID_PAGE", "Trang không hợp lệ.");
  const where = [
    "(v.ma_dang_ky LIKE ? OR v.bien_so LIKE ? OR c.ho_va_ten LIKE ? OR c.so_dien_thoai LIKE ? OR a.so_can_ho LIKE ?)",
  ];
  const values = [
    `%${q}%`,
    `%${q.toUpperCase().replace(/[\s.-]/g, "")}%`,
    `%${q}%`,
    `%${q}%`,
    `%${q}%`,
  ];
  if (query.loai_xe) {
    where.push("v.loai_xe=?");
    values.push(choice(query.loai_xe, "loai_xe", valid.types));
  }
  if (query.trang_thai) {
    choice(query.trang_thai, "trang_thai", ["DANG_GUI", "DA_KET_THUC"]);
    where.push(
      query.trang_thai === "DANG_GUI"
        ? "v.ngay_ket_thuc IS NULL"
        : "v.ngay_ket_thuc IS NOT NULL",
    );
  }
  for (const key of ["ma_cu_dan", "ma_can_ho"])
    if (query[key]) {
      where.push(`v.${key}=?`);
      values.push(integer(query[key], key));
    }
  const condition = `WHERE ${where.join(" AND ")}`;
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total ${joins} ${condition}`,
    values,
  );
  const data = await rows(
    pool,
    `SELECT ${columns} ${joins} ${condition} ORDER BY v.ma_phuong_tien DESC LIMIT 20 OFFSET ${(page - 1) * 20}`,
    values,
  );
  return { data, total: count.total, page };
}
export async function detail(id) {
  const [record] = await rows(
    pool,
    `SELECT ${columns},l.tu_ngay,l.den_ngay,u.ho_va_ten AS nguoi_tao,k.ho_va_ten AS nguoi_ket_thuc,p.ma_dang_ky AS dang_ky_truoc ${joins} JOIN lich_su_cu_tru l ON l.ma_lich_su_cu_tru=v.ma_lich_su_cu_tru JOIN nguoi_dung u ON u.ma_nguoi_dung=v.ma_nguoi_tao LEFT JOIN nguoi_dung k ON k.ma_nguoi_dung=v.ma_nguoi_ket_thuc LEFT JOIN phuong_tien p ON p.ma_phuong_tien=v.ma_dang_ky_truoc WHERE v.ma_phuong_tien=?`,
    [id],
  );
  if (!record) fail(404, "NOT_FOUND", "Không tìm thấy đăng ký xe.");
  return record;
}
async function insert(db, record, stay, userId, previous = null) {
  const result = await rows(
    db,
    `INSERT INTO phuong_tien (ma_dang_ky,ma_cu_dan,ma_can_ho,ma_lich_su_cu_tru,ma_dang_ky_truoc,loai_xe,bien_so,hang_xe,mau_sac,ngay_dang_ky,ma_nguoi_tao) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      `XE-${randomBytes(6).toString("hex").toUpperCase()}`,
      record.ma_cu_dan,
      stay.ma_can_ho,
      stay.ma_lich_su_cu_tru,
      previous,
      record.loai_xe,
      record.bien_so,
      record.hang_xe,
      record.mau_sac,
      record.ngay_dang_ky,
      userId,
    ],
  );
  return { ma_phuong_tien: result.insertId };
}
export async function create(body, user) {
  const data = valid.registration(body);
  return transaction(async (db) => {
    await residentLock(db, data.ma_cu_dan);
    const [stay] = await rows(
      db,
      "SELECT * FROM lich_su_cu_tru WHERE ma_cu_dan=? AND den_ngay IS NULL FOR UPDATE",
      [data.ma_cu_dan],
    );
    if (!stay)
      fail(422, "NO_ACTIVE_STAY", "Cư dân đã chuyển đi, chưa thể đăng ký xe.");
    if (stay.ma_lich_su_cu_tru !== data.ma_lich_su_cu_tru)
      fail(
        409,
        "STALE_RESIDENCY",
        "Cư dân đã đổi đợt cư trú. Hãy tải lại và chọn lại cư dân.",
      );
    if (
      body.ma_can_ho !== undefined &&
      integer(body.ma_can_ho, "ma_can_ho") !== stay.ma_can_ho
    )
      fail(
        422,
        "APARTMENT_MISMATCH",
        "Căn chịu phí phải là căn cư dân đang ở.",
      );
    if (data.ngay_dang_ky < stay.tu_ngay)
      fail(
        422,
        "INVALID_START_DATE",
        "Ngày đăng ký xe không được trước ngày bắt đầu đợt cư trú.",
      );
    await assertVehiclePeriodOpen(db, stay.ma_can_ho, data.ngay_dang_ky);
    if (data.bien_so) {
      const conflicts = await rows(
        db,
        `SELECT ma_phuong_tien FROM phuong_tien WHERE bien_so=? AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc>?) AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc>ngay_dang_ky) FOR UPDATE`,
        [data.bien_so, data.ngay_dang_ky],
      );
      if (conflicts.length)
        fail(
          409,
          "PLATE_IN_USE",
          "Biển số đã có đăng ký đang gửi hoặc thời gian đăng ký chồng nhau.",
        );
    }
    return insert(db, data, stay, user.ma_nguoi_dung);
  });
}
export async function end(id, body, user) {
  const day = date(body.ngay_ket_thuc),
    reason = text(body.ly_do_ket_thuc, "ly_do_ket_thuc", 3, 255);
  const expectedVersion = integer(body.phien_ban, "phien_ban");
  return transaction(async (db) => {
    const [owner] = await rows(
      db,
      "SELECT ma_cu_dan,ma_can_ho FROM phuong_tien WHERE ma_phuong_tien=?",
      [id],
    );
    if (!owner) fail(404, "NOT_FOUND", "Không tìm thấy đăng ký xe.");
    // All writes lock resident -> stay/vehicle, matching the residency transfer order.
    await residentLock(db, owner.ma_cu_dan);
    await lockApartment(db, owner.ma_can_ho);
    const [record] = await rows(
      db,
      "SELECT * FROM phuong_tien WHERE ma_phuong_tien=? FOR UPDATE",
      [id],
    );
    if (record.ngay_ket_thuc) {
      if (record.ngay_ket_thuc === day) return { ma_phuong_tien: id };
      fail(
        409,
        "ALREADY_ENDED",
        "Đăng ký đã kết thúc. Không sửa lịch sử đăng ký cũ.",
      );
    }
    if (record.phien_ban !== expectedVersion)
      fail(409, "STALE_VERSION", "Đăng ký đã thay đổi. Hãy tải lại.");
    if (day < record.ngay_dang_ky)
      fail(
        422,
        "INVALID_END_DATE",
        "Ngày kết thúc không được trước ngày đăng ký xe.",
      );
    await assertVehiclePeriodOpen(db, record.ma_can_ho, day);
    await rows(
      db,
      "UPDATE phuong_tien SET ngay_ket_thuc=?,ly_do_ket_thuc=?,ma_nguoi_ket_thuc=?,phien_ban=phien_ban+1 WHERE ma_phuong_tien=?",
      [day, reason, user.ma_nguoi_dung, id],
    );
    return { ma_phuong_tien: id };
  });
}

// Called inside the residency transaction, after its resident row is locked.
export async function finishStayVehicles(db, stayId, day, userId, reason) {
  const [stay] = await rows(
    db,
    "SELECT ma_can_ho FROM lich_su_cu_tru WHERE ma_lich_su_cu_tru=?",
    [stayId],
  );
  await lockApartment(db, stay.ma_can_ho);
  const records = await rows(
    db,
    "SELECT * FROM phuong_tien WHERE ma_lich_su_cu_tru=? ORDER BY ma_phuong_tien FOR UPDATE",
    [stayId],
  );
  if (
    records.some(
      (v) => v.ngay_dang_ky > day || (v.ngay_ket_thuc && v.ngay_ket_thuc > day),
    )
  )
    fail(
      422,
      "VEHICLE_DATE_CONFLICT",
      "Ngày chuyển không được trước ngày đăng ký hoặc kết thúc xe trong đợt cư trú này.",
    );
  const active = records.filter((v) => !v.ngay_ket_thuc);
  if (active.length) await assertVehiclePeriodOpen(db, stay.ma_can_ho, day);
  await rows(
    db,
    "UPDATE phuong_tien SET ngay_ket_thuc=?,ly_do_ket_thuc=?,ma_nguoi_ket_thuc=?,phien_ban=phien_ban+1 WHERE ma_lich_su_cu_tru=? AND ngay_ket_thuc IS NULL",
    [day, reason, userId, stayId],
  );
  return active;
}
export async function carryStayVehicles(db, records, stay, day, userId) {
  if (records.length) await assertVehiclePeriodOpen(db, stay.ma_can_ho, day);
  for (const record of records)
    await insert(
      db,
      { ...record, ngay_dang_ky: day },
      stay,
      userId,
      record.ma_phuong_tien,
    );
}
```

## 8. `backend/src/modules/residency/residency.service.js`

```js
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, integer, text } from "../../lib/http.js";
import * as valid from "./residency.validation.js";
import { lockApartment } from "../billing/billing.guards.js";
import {
  finishStayVehicles,
  carryStayVehicles,
} from "../vehicles/vehicles.service.js";

function search(query) {
  const q = query.q ? text(query.q, "q", 1, 100) : "";
  const page = integer(query.page || 1, "page");
  if (page < 1 || page > 100000)
    fail(422, "INVALID_PAGE", "Trang không hợp lệ.");
  return { q: `%${q}%`, page, offset: (page - 1) * 20 };
}
function version(row, value) {
  if (row.phien_ban !== integer(value, "phien_ban"))
    fail(
      409,
      "STALE_VERSION",
      "Dữ liệu đã thay đổi. Hãy tải lại trước khi sửa.",
    );
}
async function one(db, table, key, id, lock = false) {
  // table/key are internal constants, never request parameters.
  const [row] = await rows(
    db,
    `SELECT * FROM ${table} WHERE ${key}=?${lock ? " FOR UPDATE" : ""}`,
    [id],
  );
  if (!row) fail(404, "NOT_FOUND", "Không tìm thấy hồ sơ hoặc căn hộ.");
  return row;
}
async function checkAccount(db, id, previous) {
  if (id === null) return;
  const account = await one(db, "nguoi_dung", "ma_nguoi_dung", id, true);
  if (
    account.vai_tro !== "CU_DAN" ||
    (!account.dang_hoat_dong && id !== previous)
  )
    fail(422, "INVALID_ACCOUNT", "Chỉ gắn tài khoản cư dân đang hoạt động.");
}

export async function listApartments(query) {
  const { q, page, offset } = search(query);
  const conditions = ["(so_can_ho LIKE ? OR khoi LIKE ?)"];
  const values = [q, q];
  if (query.tang !== undefined && query.tang !== "") {
    const floor = integer(query.tang, "tang");
    if (floor > 200) fail(422, "INVALID_FLOOR", "Tầng phải từ 0 đến 200.");
    conditions.push("tang=?");
    values.push(floor);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM can_ho ${where}`,
    values,
  );
  const data = await rows(
    pool,
    `SELECT c.*, (SELECT COUNT(*) FROM lich_su_cu_tru l WHERE l.ma_can_ho=c.ma_can_ho AND l.den_ngay IS NULL) AS so_cu_dan FROM can_ho c ${where} ORDER BY khoi,tang,so_can_ho LIMIT 20 OFFSET ${offset}`,
    values,
  );
  return { data, total: count.total, page };
}
export async function availableAccounts(query) {
  const { q, page, offset } = search(query);
  const where = `WHERE u.vai_tro='CU_DAN' AND u.dang_hoat_dong=1
    AND (u.ho_va_ten LIKE ? OR u.so_dien_thoai LIKE ?)
    AND NOT EXISTS (SELECT 1 FROM cu_dan c WHERE c.ma_nguoi_dung=u.ma_nguoi_dung)`;
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM nguoi_dung u ${where}`,
    [q, q],
  );
  const data = await rows(
    pool,
    `SELECT u.ma_nguoi_dung,u.ho_va_ten,u.so_dien_thoai FROM nguoi_dung u ${where} ORDER BY u.ho_va_ten,u.ma_nguoi_dung LIMIT 20 OFFSET ${offset}`,
    [q, q],
  );
  return { data, total: count.total, page };
}
export async function apartmentDetail(id) {
  const data = await one(pool, "can_ho", "ma_can_ho", id);
  const residents = await rows(
    pool,
    `SELECT c.ma_cu_dan,c.ho_va_ten,c.so_dien_thoai,l.quan_he,l.tu_ngay FROM cu_dan c JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan WHERE l.ma_can_ho=? AND l.den_ngay IS NULL ORDER BY c.ho_va_ten`,
    [id],
  );
  return { ...data, residents };
}
export async function saveApartment(id, body) {
  const values = valid.apartment(body);
  return transaction(async (db) => {
    if (id) {
      const current = await one(db, "can_ho", "ma_can_ho", id, true);
      version(current, body.phien_ban);
      await rows(
        db,
        "UPDATE can_ho SET so_can_ho=?,khoi=?,tang=?,dien_tich_m2=?,tinh_phi_dich_vu=?,phien_ban=phien_ban+1 WHERE ma_can_ho=?",
        [...values, id],
      );
    } else {
      const result = await rows(
        db,
        "INSERT INTO can_ho (so_can_ho,khoi,tang,dien_tich_m2,tinh_phi_dich_vu) VALUES (?,?,?,?,?)",
        values,
      );
      id = result.insertId;
    }
    return one(db, "can_ho", "ma_can_ho", id);
  });
}

const residentJoin = `FROM cu_dan c LEFT JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan AND l.den_ngay IS NULL LEFT JOIN can_ho a ON a.ma_can_ho=l.ma_can_ho`;
export async function listResidents(query) {
  const { q, page, offset } = search(query);
  const conditions = ["(c.ho_va_ten LIKE ? OR c.so_dien_thoai LIKE ?)"];
  const values = [q, q];
  if (query.ma_can_ho) {
    conditions.push("l.ma_can_ho=?");
    values.push(integer(query.ma_can_ho, "ma_can_ho"));
  }
  if (query.ma_cu_dan) {
    conditions.push("c.ma_cu_dan=?");
    values.push(integer(query.ma_cu_dan, "ma_cu_dan"));
  }
  if (query.trang_thai === "DANG_O") conditions.push("l.ma_can_ho IS NOT NULL");
  else if (query.trang_thai === "DA_CHUYEN_DI")
    conditions.push("l.ma_can_ho IS NULL");
  else if (query.trang_thai)
    fail(422, "INVALID_STATUS", "Bộ lọc cư trú không hợp lệ.");
  const where = `WHERE ${conditions.join(" AND ")}`;
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total ${residentJoin} ${where}`,
    values,
  );
  const data = await rows(
    pool,
    `SELECT c.*,l.ma_lich_su_cu_tru,l.ma_can_ho,l.quan_he,l.tu_ngay,a.so_can_ho ${residentJoin} ${where} ORDER BY c.ho_va_ten,c.ma_cu_dan LIMIT 20 OFFSET ${offset}`,
    values,
  );
  return { data, total: count.total, page };
}
export async function residentDetail(id) {
  const resident = await one(pool, "cu_dan", "ma_cu_dan", id);
  const history = await rows(
    pool,
    `SELECT l.*,a.so_can_ho,u.ho_va_ten AS nguoi_ghi_nhan FROM lich_su_cu_tru l JOIN can_ho a ON a.ma_can_ho=l.ma_can_ho JOIN nguoi_dung u ON u.ma_nguoi_dung=l.ma_nguoi_ghi_nhan WHERE l.ma_cu_dan=? ORDER BY l.tu_ngay DESC,l.ma_lich_su_cu_tru DESC`,
    [id],
  );
  return { ...resident, history };
}
export async function saveResident(id, body, user) {
  const values = valid.resident(body);
  const initialStay = id ? null : valid.stay(body);
  return transaction(async (db) => {
    let previousAccount = null;
    if (id) {
      const current = await one(db, "cu_dan", "ma_cu_dan", id, true);
      version(current, body.phien_ban);
      previousAccount = current.ma_nguoi_dung;
    }
    await checkAccount(db, values[2], previousAccount);
    if (id) {
      await rows(
        db,
        "UPDATE cu_dan SET ho_va_ten=?,so_dien_thoai=?,ma_nguoi_dung=?,phien_ban=phien_ban+1 WHERE ma_cu_dan=?",
        [...values, id],
      );
    } else {
      await one(db, "can_ho", "ma_can_ho", initialStay[0]);
      const result = await rows(
        db,
        "INSERT INTO cu_dan (ho_va_ten,so_dien_thoai,ma_nguoi_dung) VALUES (?,?,?)",
        values,
      );
      id = result.insertId;
      await rows(
        db,
        "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,?,?,?)",
        [id, ...initialStay, user.ma_nguoi_dung],
      );
    }
    return one(db, "cu_dan", "ma_cu_dan", id);
  });
}

export async function changeStay(id, action, body, user) {
  const day = valid.date(body.ngay);
  const next = action === "chuyen_di" ? null : valid.stay(body);
  if (
    body.chuyen_phuong_tien !== undefined &&
    typeof body.chuyen_phuong_tien !== "boolean"
  )
    fail(
      422,
      "INVALID_VEHICLE_CHOICE",
      "Lựa chọn chuyển xe cần là có hoặc không.",
    );
  if (body.chuyen_phuong_tien && action !== "chuyen_can")
    fail(
      422,
      "INVALID_VEHICLE_CHOICE",
      "Chỉ chuyển đăng ký xe khi chuyển căn.",
    );
  return transaction(async (db) => {
    const resident = await one(db, "cu_dan", "ma_cu_dan", id, true);
    version(resident, body.phien_ban);
    const history = await rows(
      db,
      "SELECT * FROM lich_su_cu_tru WHERE ma_cu_dan=? ORDER BY tu_ngay DESC,ma_lich_su_cu_tru DESC FOR UPDATE",
      [id],
    );
    const current = history.find((stay) => stay.den_ngay === null);
    if (action === "nhap_cu") {
      if (current)
        fail(
          409,
          "ALREADY_RESIDENT",
          "Cư dân đang ở một căn hộ. Hãy dùng Chuyển căn.",
        );
      if (history.some((stay) => !stay.den_ngay || stay.den_ngay > day))
        fail(
          422,
          "OVERLAPPING_STAY",
          "Ngày nhập cư phải từ ngày kết thúc đợt cư trú gần nhất.",
        );
    } else {
      if (!current)
        fail(409, "NO_ACTIVE_STAY", "Cư dân đã chuyển đi. Hãy tải lại hồ sơ.");
      if (day < current.tu_ngay)
        fail(
          422,
          "INVALID_END_DATE",
          "Ngày chuyển không được trước ngày bắt đầu đợt cư trú hiện tại.",
        );
      if (next && next[0] === current.ma_can_ho)
        fail(422, "SAME_APARTMENT", "Cần chọn căn hộ khác để chuyển căn.");
    }
    if (next) await one(db, "can_ho", "ma_can_ho", next[0]);
    for (const apartmentId of [
      ...new Set([current?.ma_can_ho, next?.[0]].filter(Boolean)),
    ].sort((a, b) => a - b))
      await lockApartment(db, apartmentId);
    const vehicles = current
      ? await finishStayVehicles(
          db,
          current.ma_lich_su_cu_tru,
          day,
          user.ma_nguoi_dung,
          action === "chuyen_can" ? "Chuyển căn" : "Chuyển đi",
        )
      : [];
    if (current)
      await rows(
        db,
        "UPDATE lich_su_cu_tru SET den_ngay=? WHERE ma_lich_su_cu_tru=?",
        [day, current.ma_lich_su_cu_tru],
      );
    if (next) {
      const inserted = await rows(
        db,
        "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,?,?,?)",
        [id, ...next, user.ma_nguoi_dung],
      );
      if (body.chuyen_phuong_tien)
        await carryStayVehicles(
          db,
          vehicles,
          { ma_can_ho: next[0], ma_lich_su_cu_tru: inserted.insertId },
          day,
          user.ma_nguoi_dung,
        );
    }
    await rows(
      db,
      "UPDATE cu_dan SET phien_ban=phien_ban+1 WHERE ma_cu_dan=?",
      [id],
    );
    return { ma_cu_dan: id, phien_ban: resident.phien_ban + 1 };
  });
}
```

## 9. `backend/src/app.js`

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
      "SELECT name FROM schema_migrations WHERE name IN (?,?,?,?,?)",
      [
        "001_auth_qr_incidents.sql",
        "002_residency.sql",
        "003_same_day_residency.sql",
        "004_vehicles.sql",
        "005_billing.sql",
      ],
    );
    if (migrations.length !== 5) throw new Error("Schema not initialized");
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

## 10. `frontend/src/features/billing/Billing.jsx`

```jsx
import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import QRCode from "qrcode";
import { useAuth } from "../auth/Auth.jsx";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";

const fees = {
  PHI_QUAN_LY: "Phí quản lý",
  GUI_O_TO: "Gửi ô tô",
  GUI_XE_MAY: "Gửi xe máy",
  GUI_XE_DAP: "Gửi xe đạp",
  TIEN_NUOC: "Tiền nước",
  TIEN_DIEN: "Tiền điện",
};
const statuses = {
  NHAP: "Bản nháp",
  DA_DUYET: "Đã duyệt",
  DA_GUI: "Đã gửi",
  DA_THANH_TOAN: "Đã thanh toán",
  HUY: "Đã hủy",
};
const meterNames = { DIEN: "Điện", NUOC: "Nước" };
const eventNames = {
  LAP_NHAP: "Lập bản nháp",
  LAP_THAY_THE: "Lập bản thay thế",
  TINH_LAI: "Tính lại bản nháp",
  DUYET: "Duyệt hóa đơn",
  GUI: "Gửi hóa đơn",
  HUY: "Hủy hóa đơn",
  XAC_NHAN_THANH_TOAN: "Xác nhận đã thu",
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const money = (n) => `${BigInt(n || 0).toLocaleString("vi-VN")} đ`;
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
function billOptions(body) {
  for (const k of ["tinh_nuoc", "tinh_dien", "tinh_xe"])
    body[k] = body[k] === "1";
  return body;
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
    } catch (err) {
      setError(err);
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
function Pager({ resource }) {
  const [params, setParams] = useSearchParams(),
    page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(p) {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
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
function ApartmentField({ initialId = "", initialLabel = "" }) {
  const [q, setQ] = useState(""),
    [id, setId] = useState(String(initialId)),
    [label, setLabel] = useState(initialLabel);
  const resource = useResource(`/can_ho?q=${encodeURIComponent(q)}`),
    matches = resource.result?.data || [];
  return (
    <>
      <Field label="Tìm căn hộ để chọn">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
        />
      </Field>
      <ErrorBox error={resource.error} />
      <Field label="Căn hộ">
        <select
          name="ma_can_ho"
          required
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setLabel(e.target.selectedOptions[0].textContent);
          }}
        >
          <option value="">Chọn căn hộ</option>
          {id && !matches.some((a) => String(a.ma_can_ho) === id) && (
            <option value={id}>{label || `Căn #${id}`}</option>
          )}
          {matches.map((a) => (
            <option key={a.ma_can_ho} value={a.ma_can_ho}>
              {a.so_can_ho}
            </option>
          ))}
        </select>
      </Field>
      {resource.result?.total > 20 && (
        <small>
          Nhập số căn cụ thể để thu hẹp {resource.result.total} kết quả.
        </small>
      )}
    </>
  );
}
function ChargeOptions({ bill }) {
  return (
    <div className="card">
      <p>
        Khoản thu áp dụng: phí quản lý theo cấu hình của căn hộ; các khoản khác
        chọn dưới đây.
      </p>
      {[
        ["tinh_nuoc", "Thu tiền nước", true],
        ["tinh_dien", "BQL thu tiền điện", false],
        ["tinh_xe", "Thu phí gửi xe", true],
      ].map(([key, label, defaultValue]) => (
        <label className="checkbox" key={key}>
          <input
            type="checkbox"
            name={key}
            value="1"
            defaultChecked={bill ? !!bill[key] : defaultValue}
          />
          {label}
        </label>
      ))}
      <small>
        Điện dùng đơn giá một mức do BQL cấu hình. Phí xe theo số đăng ký hiệu
        lực tại ngày chốt, chưa chia theo ngày.
      </small>
    </div>
  );
}

export function Rates() {
  const [params, setParams] = useSearchParams(),
    resource = useResource(`/cau_hinh_phi?${params}`),
    action = useAction(resource.reload);
  return (
    <>
      <h1>Đơn giá phí</h1>
      <p>
        Đơn giá theo ngày hiệu lực. Phiên bản mới kết thúc khoảng giá trước đó;
        các đơn giá và chi tiết hóa đơn đã lưu được giữ lại.
      </p>
      <Feedback action={action} />
      <section className="card narrow">
        <h2>Thêm phiên bản giá</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            action.run("/cau_hinh_phi", "POST", values(e), () => form.reset());
          }}
        >
          <fieldset disabled={action.pending}>
            <Field label="Loại phí">
              <select name="loai_phi">
                <Options values={fees} />
              </select>
            </Field>
            <Field
              label="Đơn giá (đồng/đơn vị)"
              name="don_gia"
              type="number"
              min="0"
              max="9999999999.99"
              step="0.01"
              required
            />
            <Field
              label="Áp dụng từ ngày"
              name="tu_ngay"
              type="date"
              required
              defaultValue={today()}
            />
            <button className="primary">Lưu đơn giá</button>
          </fieldset>
        </form>
      </section>
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field label="Lọc loại phí">
          <select name="loai_phi" defaultValue={params.get("loai_phi") || ""}>
            <Options values={fees} empty="Tất cả" />
          </select>
        </Field>
        <button>Lọc</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Loại phí</th>
                <th>Đơn giá</th>
                <th>Đơn vị</th>
                <th>Từ ngày</th>
                <th>Đến trước ngày</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((r) => (
                <tr key={r.ma_cau_hinh_phi}>
                  <td>{r.ten_phi}</td>
                  <td>{r.don_gia}</td>
                  <td>{r.don_vi_tinh}</td>
                  <td>{r.tu_ngay}</td>
                  <td>{r.den_ngay || "Chưa kết thúc"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có đơn giá.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
export function Meters() {
  const [params, setParams] = useSearchParams(),
    resource = useResource(`/chi_so_dich_vu?${params}`),
    [editing, setEditing] = useState(null),
    action = useAction(resource.reload);
  return (
    <>
      <h1>Chỉ số điện nước</h1>
      <p>
        Nhập lần lượt từng kỳ. Chỉ số đầu kỳ phải khớp cuối kỳ liền trước; kỳ
        đầu cần xác nhận riêng.
      </p>
      <Feedback action={action} />
      <section className="card narrow">
        <h2>{editing ? "Sửa chỉ số" : "Ghi chỉ số"}</h2>
        <form
          key={editing?.ma_chi_so_dich_vu || "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const body = values(e);
            body.ky_dau = body.ky_dau === "1";
            if (editing) body.phien_ban = editing.phien_ban;
            action.run("/chi_so_dich_vu", "PUT", body, () => setEditing(null));
          }}
        >
          <fieldset disabled={action.pending}>
            {editing ? (
              <>
                <p>
                  Căn {editing.so_can_ho} · Kỳ {editing.ky_thanh_toan} ·{" "}
                  {meterNames[editing.loai_dich_vu]}
                </p>
                <input
                  type="hidden"
                  name="ma_can_ho"
                  value={editing.ma_can_ho}
                />
                <input
                  type="hidden"
                  name="loai_dich_vu"
                  value={editing.loai_dich_vu}
                />
                <input
                  type="hidden"
                  name="ky_thanh_toan"
                  value={editing.ky_thanh_toan}
                />
              </>
            ) : (
              <>
                <ApartmentField />
                <Field label="Dịch vụ">
                  <select name="loai_dich_vu">
                    <option value="NUOC">Nước</option>
                    <option value="DIEN">Điện</option>
                  </select>
                </Field>
                <Field
                  label="Kỳ ghi chỉ số"
                  name="ky_thanh_toan"
                  type="month"
                  required
                  max={today().slice(0, 7)}
                  defaultValue={today().slice(0, 7)}
                />
              </>
            )}
            <div className="form-grid">
              <Field
                label="Chỉ số đầu kỳ"
                name="chi_so_cu"
                type="number"
                min="0"
                step="0.001"
                required
                defaultValue={editing?.chi_so_cu || ""}
              />
              <Field
                label="Chỉ số cuối kỳ"
                name="chi_so_moi"
                type="number"
                min="0"
                step="0.001"
                required
                defaultValue={editing?.chi_so_moi || ""}
              />
            </div>
            <Field
              label="Ngày chốt chỉ số"
              name="ngay_chot"
              type="date"
              required
              max={today()}
              defaultValue={editing?.ngay_chot || today()}
            />
            <Field
              label="Ghi chú chỉ số"
              name="ghi_chu"
              maxLength={255}
              defaultValue={editing?.ghi_chu || ""}
            />
            {!editing && (
              <label className="checkbox">
                <input type="checkbox" name="ky_dau" value="1" />
                Đây là kỳ đầu tiên của căn đối với dịch vụ này
              </label>
            )}
            <button className="primary">Lưu chỉ số</button>
          </fieldset>
        </form>
        {editing && (
          <button disabled={action.pending} onClick={() => setEditing(null)}>
            Hủy sửa
          </button>
        )}
      </section>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Lọc kỳ chỉ số"
          name="ky_thanh_toan"
          type="month"
          defaultValue={params.get("ky_thanh_toan") || ""}
        />
        <button>Lọc chỉ số</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Căn</th>
                <th>Kỳ / dịch vụ</th>
                <th>Đầu kỳ</th>
                <th>Cuối kỳ</th>
                <th>Ngày chốt</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((r) => (
                <tr key={r.ma_chi_so_dich_vu}>
                  <td>{r.so_can_ho}</td>
                  <td>
                    {r.ky_thanh_toan} · {meterNames[r.loai_dich_vu]}
                  </td>
                  <td>{r.chi_so_cu}</td>
                  <td>{r.chi_so_moi}</td>
                  <td>{r.ngay_chot}</td>
                  <td>
                    <button
                      disabled={action.pending}
                      onClick={() => setEditing(r)}
                    >
                      Sửa chỉ số
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager resource={resource} />
      </section>
    </>
  );
}

export function Bills() {
  const { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri/hoa-don" : "/cu-dan/hoa-don",
    api = admin ? "/hoa_don" : "/cua_toi/hoa_don";
  const [params, setParams] = useSearchParams(),
    resource = useResource(`${api}?${params}`),
    [adding, setAdding] = useState(false),
    navigate = useNavigate(),
    action = useAction(resource.reload);
  return (
    <>
      <div className="page-heading">
        <h1>{admin ? "Phí và hóa đơn" : "Hóa đơn của tôi"}</h1>
        {admin && (
          <button
            className="primary"
            disabled={action.pending}
            onClick={() => setAdding(!adding)}
          >
            {adding ? "Đóng biểu mẫu" : "Lập hóa đơn"}
          </button>
        )}
      </div>
      <Feedback action={action} />
      {adding && (
        <section className="card narrow">
          <h2>Lập bản nháp cho căn hộ</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action.run("/hoa_don/lap", "POST", billOptions(values(e)), (r) =>
                navigate(`${base}/${r.ma_hoa_don}`),
              );
            }}
          >
            <fieldset disabled={action.pending}>
              <ApartmentField />
              <Field
                label="Kỳ hóa đơn"
                name="ky_thanh_toan"
                type="month"
                required
                max={today().slice(0, 7)}
                defaultValue={today().slice(0, 7)}
              />
              <Field
                label="Ngày chốt phí"
                name="ngay_chot_phi"
                type="date"
                required
                max={today()}
                defaultValue={today()}
              />
              <ChargeOptions />
              <button className="primary">Tạo bản nháp</button>
            </fieldset>
          </form>
        </section>
      )}
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Tìm số hóa đơn hoặc căn hộ"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field
          label="Lọc kỳ hóa đơn"
          name="ky_thanh_toan"
          type="month"
          defaultValue={params.get("ky_thanh_toan") || ""}
        />
        <Field label="Trạng thái hóa đơn">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options
              values={
                admin
                  ? statuses
                  : {
                      DA_GUI: statuses.DA_GUI,
                      DA_THANH_TOAN: statuses.DA_THANH_TOAN,
                    }
              }
              empty="Tất cả"
            />
          </select>
        </Field>
        <button>Tìm hóa đơn</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Số hóa đơn</th>
                <th>Căn / kỳ</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Hạn trả</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((b) => (
                <tr key={b.ma_hoa_don}>
                  <td>
                    <Link to={`${base}/${b.ma_hoa_don}`}>{b.so_hoa_don}</Link>
                  </td>
                  <td>
                    {b.so_can_ho} · {b.ky_thanh_toan}
                  </td>
                  <td>{money(b.tong_tien)}</td>
                  <td>
                    {statuses[b.trang_thai]}
                    {b.qua_han && " · Quá hạn"}
                  </td>
                  <td>{b.han_thanh_toan || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có hóa đơn phù hợp.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
function PaymentQR({ bill }) {
  const [image, setImage] = useState(""),
    [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    setImage("");
    setError(null);
    if (bill.qr_payload)
      QRCode.toDataURL(bill.qr_payload, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "M",
      })
        .then((url) => {
          if (active) setImage(url);
        })
        .catch((e) => {
          if (active) setError(e);
        });
    return () => {
      active = false;
    };
  }, [bill.qr_payload]);
  if (!bill.qr_payload) return null;
  return (
    <section className="card narrow">
      <h2>Chuyển khoản bằng VietQR</h2>
      {image && (
        <img
          src={image}
          alt={`VietQR hóa đơn ${bill.so_hoa_don}`}
          style={{ width: 320, maxWidth: "100%" }}
        />
      )}
      <ErrorBox error={error} />
      <p>
        BIN ngân hàng: {bill.ma_ngan_hang} · Tài khoản: {bill.so_tai_khoan}
      </p>
      <p>Người nhận: {bill.ten_nguoi_nhan}</p>
      <p>
        Số tiền: <strong>{money(bill.tong_tien)}</strong> · Nội dung:{" "}
        <strong>{bill.so_hoa_don}</strong>
      </p>
      <p>
        Kiểm tra người nhận và số tiền trong ứng dụng ngân hàng. Quét QR không
        tự xác nhận đã thanh toán; BQL ghi nhận sau khi đối soát.
      </p>
    </section>
  );
}
export function BillDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri/hoa-don" : "/cu-dan/hoa-don",
    resource = useResource(`${admin ? "/hoa_don" : "/cua_toi/hoa_don"}/${id}`),
    action = useAction(resource.reload),
    navigate = useNavigate(),
    bill = resource.result?.data;
  const run = (name, body = {}, after) =>
    action.run(
      `/hoa_don/${id}/${name}`,
      "POST",
      { ...body, phien_ban: bill.phien_ban },
      after,
    );
  return (
    <>
      <Link to={base}>← Danh sách hóa đơn</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Feedback action={action} />
      {bill && (
        <>
          <h1>Hóa đơn {bill.so_hoa_don}</h1>
          <p>
            Căn {bill.so_can_ho} · Kỳ {bill.ky_thanh_toan} · Chốt ngày{" "}
            {bill.ngay_chot_phi}
          </p>
          <p>
            {statuses[bill.trang_thai]}
            {bill.qua_han && " · Quá hạn"} · Hạn trả:{" "}
            {bill.han_thanh_toan || "Chưa gửi"}
          </p>
          {admin && bill.loi_du_lieu.length > 0 && (
            <div className="error" role="alert">
              <strong>Cần bổ sung trước khi duyệt:</strong>
              <ul>
                {bill.loi_du_lieu.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <section className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Khoản thu</th>
                    <th>Số lượng</th>
                    <th>Đơn vị</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.lines.map((l, i) => (
                    <tr key={i}>
                      <td>{l.dien_giai}</td>
                      <td>{l.so_luong}</td>
                      <td>{l.don_vi_tinh}</td>
                      <td>{l.don_gia}</td>
                      <td>{money(l.thanh_tien)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2>Tổng cộng: {money(bill.tong_tien)}</h2>
          </section>
          <PaymentQR bill={bill} />
          {bill.trang_thai === "DA_THANH_TOAN" && (
            <p className="note">
              Đã ghi nhận {money(bill.so_tien_da_thu)} · Tham chiếu:{" "}
              {bill.ma_tham_chieu}
            </p>
          )}
          {admin && bill.trang_thai === "NHAP" && (
            <section className="card narrow">
              <h2>Tính lại bản nháp</h2>
              <form
                key={bill.phien_ban}
                onSubmit={(e) => {
                  e.preventDefault();
                  run("tinh_lai", billOptions(values(e)));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Ngày chốt phí"
                    name="ngay_chot_phi"
                    type="date"
                    required
                    max={today()}
                    defaultValue={bill.ngay_chot_phi}
                  />
                  <ChargeOptions bill={bill} />
                  <button>Tính lại bản nháp</button>
                </fieldset>
              </form>
              <button
                className="primary"
                disabled={
                  action.pending ||
                  bill.loi_du_lieu.length > 0 ||
                  BigInt(bill.tong_tien) <= 0n
                }
                onClick={() => run("duyet")}
              >
                Duyệt hóa đơn
              </button>
            </section>
          )}
          {admin && bill.trang_thai === "DA_DUYET" && (
            <section className="card narrow">
              <h2>Gửi hóa đơn cho cư dân</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run("gui", values(e));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Hạn thanh toán"
                    name="han_thanh_toan"
                    type="date"
                    min={today()}
                    defaultValue={today()}
                    required
                  />
                  <Field
                    label="BIN ngân hàng (6 số)"
                    name="ma_ngan_hang"
                    pattern="[0-9]{6}"
                    placeholder="Ví dụ Vietcombank: 970436"
                    required
                  />
                  <Field
                    label="Số tài khoản nhận"
                    name="so_tai_khoan"
                    inputMode="numeric"
                    pattern="[0-9]{6,30}"
                    required
                  />
                  <Field
                    label="Tên người nhận"
                    name="ten_nguoi_nhan"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                  <button className="primary">Gửi hóa đơn</button>
                </fieldset>
              </form>
            </section>
          )}
          {admin && bill.trang_thai === "DA_GUI" && (
            <section className="card narrow">
              <h2>Xác nhận thu tiền</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run("xac_nhan_thanh_toan", values(e));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Số tiền đã đối soát"
                    name="so_tien"
                    type="number"
                    step="1"
                    min="1"
                    required
                    defaultValue={bill.tong_tien}
                  />
                  <Field
                    label="Mã tham chiếu giao dịch"
                    name="ma_tham_chieu"
                    required
                    minLength={3}
                    maxLength={100}
                  />
                  <label className="checkbox">
                    <input type="checkbox" required />
                    Đã đối soát đủ số tiền hóa đơn
                  </label>
                  <button className="primary">Xác nhận đã thu</button>
                </fieldset>
              </form>
            </section>
          )}
          {admin &&
            ["NHAP", "DA_DUYET", "DA_GUI"].includes(bill.trang_thai) && (
              <section className="card narrow">
                <h2>Hủy hóa đơn</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run("huy", values(e));
                  }}
                >
                  <fieldset disabled={action.pending}>
                    <Field
                      label="Lý do hủy"
                      name="ly_do"
                      required
                      minLength={3}
                      maxLength={255}
                    />
                    <button>Hủy hóa đơn</button>
                  </fieldset>
                </form>
              </section>
            )}
          {admin && bill.trang_thai === "HUY" && (
            <section className="card">
              <p>Lý do hủy: {bill.ly_do_huy}</p>
              <button
                className="primary"
                disabled={action.pending}
                onClick={() =>
                  run("lap_thay_the", {}, (r) =>
                    navigate(`${base}/${r.ma_hoa_don}`),
                  )
                }
              >
                Lập bản thay thế
              </button>
            </section>
          )}
          {admin && (
            <section className="card">
              <h2>Lịch sử hóa đơn</h2>
              <ul>
                {bill.history.map((h) => (
                  <li key={h.ma_lich_su_hoa_don}>
                    {h.ngay_tao} · {eventNames[h.su_kien] || h.su_kien} ·{" "}
                    {h.ho_va_ten}
                    {h.ghi_chu && ` · ${h.ghi_chu}`}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
```

## 11. `frontend/src/app/App.jsx`

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
import Users from "../features/auth/Users.jsx";
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
          ["/quan-tri/cu-dan", "Cư dân & cư trú"],
          ["/quan-tri/phuong-tien", "Phương tiện"],
          ["/quan-tri/don-gia", "Đơn giá phí"],
          ["/quan-tri/chi-so", "Chỉ số điện nước"],
          ["/quan-tri/hoa-don", "Phí & hóa đơn"],
          ["/quan-tri/vi-tri-qr", "Vị trí & QR"],
          ["/quan-tri/nhan-su", "Nhân sự & tài khoản"],
        ]
      : user?.vai_tro === "KY_THUAT_VIEN"
        ? [["/ky-thuat/cong-viec", "Công việc"]]
        : [
            ["/cu-dan/phan-anh", "Phản ánh của tôi"],
            ["/cu-dan/hoa-don", "Hóa đơn của tôi"],
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
              ["/quan-tri/cu-dan", <Residents />],
              ["/quan-tri/cu-dan/:id", <ResidentDetail />],
              ["/quan-tri/phuong-tien", <Vehicles />],
              ["/quan-tri/don-gia", <Rates />],
              ["/quan-tri/chi-so", <Meters />],
              ["/quan-tri/hoa-don", <Bills />],
              ["/quan-tri/hoa-don/:id", <BillDetail />],
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
            {["/cu-dan/hoa-don", "/cu-dan/hoa-don/:id"].map((path) => (
              <Route
                key={path}
                path={path}
                element={
                  <Protected roles={resident}>
                    {path.endsWith(":id") ? <BillDetail /> : <Bills />}
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

## Chạy sau khi lưu đủ file

Tại thư mục gốc dự án trong PowerShell:

```powershell
npm run db:migrate
npm run dev:backend
```

Migration cần báo `Schema current: 005_billing.sql`. Chỉ thêm bảng phí/chỉ số/hóa đơn, giữ dữ liệu cũ; không cần seed lại, đổi mật khẩu hoặc sửa SQL cũ.

Terminal thứ hai tại cùng thư mục:

```powershell
npm run dev:frontend:https
```

Tải lại trang bằng F5, đăng nhập BQL bằng tài khoản đang có. Có ba mục mới: **Đơn giá phí**, **Chỉ số điện nước**, **Phí & hóa đơn**. Cư dân có **Hóa đơn của tôi**.

Kiểm tra backend từ terminal khác trên cùng máy:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/ready
```

Cần `status: ok`, `database: connected`. Nếu chưa sẵn sàng, kiểm tra đủ file SQL 001–005 và chạy migrate trên đúng `.env` của dự án; không xóa database hoặc sửa checksum để bỏ qua lỗi.

## Thử theo từng bước

1. **Đơn giá phí**: nhập các loại phí áp dụng cho tòa nhà. Ngày hiệu lực phải không sau ngày chốt kỳ muốn thu. Giá là đồng/đơn vị; ví dụ minh họa quản lý 12.000/m², gửi xe máy 100.000/xe, nước 15.000/m³. Đây chỉ là số demo, không được tự suy ra giá thực tế. Muốn tạo giá tiếp theo, ngày bắt đầu phải sau phiên bản gần nhất; giá cũ được giữ. Nếu ngày áp dụng mới làm đổi hóa đơn còn hiệu lực thì cần xử lý hóa đơn trước.
2. **Chỉ số điện nước**: chọn căn, dịch vụ, kỳ và ngày chốt. Kỳ đầu nhập cả đầu/cuối, tích xác nhận kỳ đầu. Các kỳ sau phải có kỳ liền trước và đầu kỳ khớp cuối kỳ trước; không tự đoán khi thiếu/thay đồng hồ. Chỉ số cuối không được nhỏ hơn đầu. Chỉ sửa kỳ mới nhất chưa được chốt hóa đơn.
3. **Phí & hóa đơn → Lập hóa đơn**: chọn căn, kỳ và ngày chốt đúng với ngày chốt chỉ số. Chọn rõ khoản nước/điện/xe. Phí quản lý lấy từ cờ tính phí của căn, không căn cứ căn trống. Nước và xe mặc định chọn, điện mặc định không chọn. Chỉ bật điện nếu BQL là bên thu; cách tính một mức không đại diện biểu giá điện bậc thang.
4. Nháp hiện các khoản và tổng, kèm lỗi khi thiếu giá/chỉ số. Bổ sung dữ liệu và bấm **Tính lại bản nháp**. Thử ví dụ 70 m², hai xe máy có hiệu lực tại ngày chốt, nước 113 → 125: tổng phải là 1.220.000 đồng. Xe kết thúc đúng ngày chốt không còn tính cho căn cũ trong ngày đó.
5. **Duyệt hóa đơn** chỉ được khi đủ dữ liệu, tổng dương và nguồn chưa thay đổi. Nếu báo nguồn đã đổi, tính lại trước. Sau duyệt, các dòng tiền cố định; không sửa chỉ số kỳ hoặc hồi tố xe làm đổi phần đã chốt. Việc thu tiền một phần chưa nằm trong phiên bản này.
6. **Gửi hóa đơn**: nhập hạn trả từ hôm nay, BIN ngân hàng 6 số, số tài khoản nhận và tên người nhận. Ví dụ mã BIN Vietcombank là 970436; nhập đúng ngân hàng/tài khoản của BQL thực tế. Thông tin được lưu trên riêng hóa đơn. QR tạo cục bộ, không gọi dịch vụ ảnh ngoài.
7. Đăng nhập tài khoản Cư dân đã gắn hồ sơ đang ở → **Hóa đơn của tôi** → xem dòng tiền, hạn trả và VietQR. Cư dân chỉ thấy hóa đơn đã gửi/đã thu của đúng căn, có ngày chốt trong đợt hiện tại. Chuyển căn/chuyển đi mất quyền xem căn cũ ngay. KTV và khách không được mở API hóa đơn.
8. BQL kiểm tra giao dịch ngân hàng thực tế → **Xác nhận thu tiền**: nhập đúng tổng và mã tham chiếu duy nhất, tích xác nhận đã đối soát. Sau khi thu, QR ẩn và hiển thị thông tin đã thu. Gửi lại cùng giao dịch không ghi thu lần hai; quét QR không tự đổi trạng thái.
9. Hóa đơn chưa thanh toán có thể **Hủy** kèm lý do, rồi **Lập bản thay thế** từ bản hủy gần nhất. Số mới, liên kết bản cũ, giữ các dòng cũ. Không hủy hóa đơn đã thu. Muốn điều chỉnh nguồn của hóa đơn chưa thu đã chốt, xử lý hủy trước rồi lập lại.

## Giới hạn của phiên bản

Lập từng căn, chưa có lập hàng loạt, xuất PDF/Excel, ngân hàng tự báo có, thanh toán một phần/tiền thừa/hoàn tiền hoặc chia phí theo ngày/giờ. Chỉ số tính theo một mức giá. Diện tích đọc từ cấu hình căn lúc lập; khi lập hồi tố, BQL cần kiểm tra diện tích đúng ngày chốt vì chưa có lịch sử thay đổi diện tích ngoài các hóa đơn đã lưu.

Ngày theo lịch Việt Nam. Kỳ YYYY-MM; ngày chốt thuộc kỳ và không trong tương lai. Thiếu khoản được chọn không bị tự bỏ qua. Hóa đơn tổng 0 chưa được duyệt/gửi trong MVP này. Quá hạn tính lúc xem, không lưu một trạng thái riêng.

VietQR đã kiểm tra cấu trúc/CRC và ảnh trên trình duyệt; chưa thực hiện giao dịch ngân hàng thật. Cần kiểm tra ngân hàng và người nhận trong ứng dụng ngân hàng trước giao dịch thực tế. Hệ thống không tự gọi ngân hàng hoặc xác nhận tiền sau khi quét.

## Kiểm thử nguồn

Kiểm thử API nằm tại `backend/test/billing.test.js`; kiểm thử trình duyệt tại `e2e/billing.spec.js`. Dùng database riêng `chung_cu_test`. Từ thư mục gốc, lần lượt chạy `npm test`, `npm run test:e2e`, `npm run build`; cần Docker và các script kiểm thử của bản phương tiện trước đó. Không chạy API test trực tiếp trên database phát triển.
