# Cập nhật quản lý phương tiện trong VS Code

Khi đã có module phí/hóa đơn, dùng [hướng dẫn hóa đơn mới nhất](cap-nhat-hoa-don-vscode.md) chứa cả service cư trú/phương tiện có khóa dữ liệu đã tính phí. Các khối code bên dưới là bản trước module hóa đơn.

Code đầy đủ theo từng file cho bước phát triển sau commit `a79ea3e` (căn hộ/cư dân đã hỗ trợ chuyển cùng ngày). Mở hướng dẫn này trên GitHub để copy từng khối code vào VS Code. Không cần tải ZIP hoặc tạo lại dự án.

## Chuẩn bị

Dừng backend và frontend bằng Ctrl+C trong các terminal tương ứng. Mở đúng thư mục dự án đang chạy. Giữ các file cấu hình/chứng chỉ và dữ liệu local hiện có. Nếu có thay đổi riêng trong các file sẽ thay, lưu một bản trước khi sửa.

Cần đủ migration 001, 002, 003 và 004. Giữ nguyên SQL cũ đã áp dụng; chỉ tạo mới `004_vehicles.sql`. Nếu chưa có `003_same_day_residency.sql`, tạo file đó theo phần phụ lục cuối hướng dẫn trước khi migrate.

Thay hoặc tạo toàn bộ nội dung của **đủ 9 file dưới đây**. Đặc biệt cần thay cả `residency.service.js` (backend cư trú) và `Residency.jsx` (giao diện cư trú) để chuyển xe cùng căn hộ. File `app.js` kiểm tra đủ bốn migration và đăng ký API mới. Không khởi động lại ứng dụng giữa lúc mới thay một phần các file.

## 1. `database/migrations/004_vehicles.sql`

```sql
CREATE TABLE IF NOT EXISTS phuong_tien (
  ma_phuong_tien INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_dang_ky VARCHAR(20) NOT NULL UNIQUE,
  ma_cu_dan INT UNSIGNED NOT NULL,
  ma_can_ho INT UNSIGNED NOT NULL,
  ma_lich_su_cu_tru INT UNSIGNED NOT NULL,
  ma_dang_ky_truoc INT UNSIGNED NULL UNIQUE,
  loai_xe ENUM('O_TO','XE_MAY','XE_DAP') NOT NULL,
  bien_so VARCHAR(15) CHARACTER SET ascii COLLATE ascii_bin NULL,
  hang_xe VARCHAR(50) NOT NULL DEFAULT '',
  mau_sac VARCHAR(50) NOT NULL DEFAULT '',
  ngay_dang_ky DATE NOT NULL,
  ngay_ket_thuc DATE NULL,
  ly_do_ket_thuc VARCHAR(255) NOT NULL DEFAULT '',
  ma_nguoi_tao INT UNSIGNED NOT NULL,
  ma_nguoi_ket_thuc INT UNSIGNED NULL,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  bien_so_dang_hoat_dong VARCHAR(15) CHARACTER SET ascii COLLATE ascii_bin
    GENERATED ALWAYS AS (CASE WHEN ngay_ket_thuc IS NULL THEN bien_so ELSE NULL END) STORED,
  UNIQUE (bien_so_dang_hoat_dong),
  CONSTRAINT chk_xe_ngay CHECK (ngay_ket_thuc IS NULL OR ngay_ket_thuc >= ngay_dang_ky),
  CONSTRAINT chk_xe_bien_so CHECK (loai_xe='XE_DAP' OR bien_so IS NOT NULL),
  CONSTRAINT chk_xe_ket_thuc CHECK (
    (ngay_ket_thuc IS NULL AND ma_nguoi_ket_thuc IS NULL AND ly_do_ket_thuc='') OR
    (ngay_ket_thuc IS NOT NULL AND ma_nguoi_ket_thuc IS NOT NULL AND CHAR_LENGTH(TRIM(ly_do_ket_thuc))>0)
  ),
  FOREIGN KEY (ma_cu_dan) REFERENCES cu_dan(ma_cu_dan),
  FOREIGN KEY (ma_can_ho) REFERENCES can_ho(ma_can_ho),
  FOREIGN KEY (ma_lich_su_cu_tru) REFERENCES lich_su_cu_tru(ma_lich_su_cu_tru),
  FOREIGN KEY (ma_dang_ky_truoc) REFERENCES phuong_tien(ma_phuong_tien),
  FOREIGN KEY (ma_nguoi_tao) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_nguoi_ket_thuc) REFERENCES nguoi_dung(ma_nguoi_dung),
  INDEX idx_xe_resident (ma_cu_dan, ngay_ket_thuc),
  INDEX idx_xe_stay (ma_lich_su_cu_tru, ngay_ket_thuc),
  INDEX idx_xe_apartment_period (ma_can_ho, ngay_dang_ky, ngay_ket_thuc),
  INDEX idx_xe_plate_period (bien_so, ngay_dang_ky, ngay_ket_thuc)
) ENGINE=InnoDB;
```

## 2. `backend/src/modules/vehicles/vehicles.validation.js`

```js
import { choice, fail, integer, text } from "../../lib/http.js";
import { date } from "../residency/residency.validation.js";

export const types = ["O_TO", "XE_MAY", "XE_DAP"];
export function plate(value, required = false) {
  if (value == null || value === "") {
    if (required) fail(422, "PLATE_REQUIRED", "Ô tô và xe máy cần có biển số.");
    return null;
  }
  const result = text(value, "bien_so", 1, 30)
    .toUpperCase()
    .replace(/[\s.-]/g, "");
  if (!/^[A-Z0-9]{5,15}$/.test(result) || !/\d/.test(result))
    fail(
      422,
      "INVALID_PLATE",
      "Biển số cần 5–15 chữ cái/số, có ít nhất một chữ số; cho phép dấu chấm, gạch nối và khoảng trắng.",
    );
  return result;
}
export function registration(body) {
  const type = choice(body.loai_xe, "loai_xe", types);
  return {
    ma_cu_dan: integer(body.ma_cu_dan, "ma_cu_dan"),
    ma_lich_su_cu_tru: integer(body.ma_lich_su_cu_tru, "ma_lich_su_cu_tru"),
    loai_xe: type,
    bien_so: plate(body.bien_so, type !== "XE_DAP"),
    hang_xe: text(body.hang_xe ?? "", "hang_xe", 0, 50),
    mau_sac: text(body.mau_sac ?? "", "mau_sac", 0, 50),
    ngay_dang_ky: date(body.ngay_dang_ky),
  };
}
```

## 3. `backend/src/modules/vehicles/vehicles.service.js`

```js
import { randomBytes } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, integer, text } from "../../lib/http.js";
import { date } from "../residency/residency.validation.js";
import * as valid from "./vehicles.validation.js";

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
      "SELECT ma_cu_dan FROM phuong_tien WHERE ma_phuong_tien=?",
      [id],
    );
    if (!owner) fail(404, "NOT_FOUND", "Không tìm thấy đăng ký xe.");
    // All writes lock resident -> stay/vehicle, matching the residency transfer order.
    await residentLock(db, owner.ma_cu_dan);
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
  await rows(
    db,
    "UPDATE phuong_tien SET ngay_ket_thuc=?,ly_do_ket_thuc=?,ma_nguoi_ket_thuc=?,phien_ban=phien_ban+1 WHERE ma_lich_su_cu_tru=? AND ngay_ket_thuc IS NULL",
    [day, reason, userId, stayId],
  );
  return active;
}
export async function carryStayVehicles(db, records, stay, day, userId) {
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

## 4. `backend/src/modules/vehicles/vehicles.routes.js`

```js
import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./vehicles.service.js";

export const vehiclesRouter = Router();
vehiclesRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
vehiclesRouter.get("/", async (req, res) =>
  res.json(await service.list(req.query)),
);
vehiclesRouter.get("/:id", async (req, res) =>
  res.json({ data: await service.detail(integer(req.params.id, "id")) }),
);
vehiclesRouter.post("/", async (req, res) =>
  res.status(201).json({ data: await service.create(req.body, req.user) }),
);
vehiclesRouter.post("/:id/ket_thuc", async (req, res) =>
  res.json({
    data: await service.end(integer(req.params.id, "id"), req.body, req.user),
  }),
);
```

## 5. `backend/src/modules/residency/residency.service.js`

```js
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, integer, text } from "../../lib/http.js";
import * as valid from "./residency.validation.js";
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

## 6. `backend/src/app.js`

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
      "SELECT name FROM schema_migrations WHERE name IN (?,?,?,?)",
      [
        "001_auth_qr_incidents.sql",
        "002_residency.sql",
        "003_same_day_residency.sql",
        "004_vehicles.sql",
      ],
    );
    if (migrations.length !== 4) throw new Error("Schema not initialized");
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

## 7. `frontend/src/features/vehicles/Vehicles.jsx`

```jsx
import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";

const types = { O_TO: "Ô tô", XE_MAY: "Xe máy", XE_DAP: "Xe đạp" };
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const formValues = (event) =>
  Object.fromEntries(new FormData(event.currentTarget));

function OwnerPicker({ initialId, onChoose }) {
  const [q, setQ] = useState(""),
    [selected, setSelected] = useState(null);
  const resource = useResource(
    `/cu_dan?trang_thai=DANG_O&q=${encodeURIComponent(q)}${!q && initialId ? `&ma_cu_dan=${initialId}` : ""}`,
  );
  const matches = resource.result?.data || [];
  function choose(id) {
    const owner = matches.find((r) => String(r.ma_cu_dan) === id) || null;
    setSelected(owner);
    onChoose(owner);
  }
  return (
    <>
      <Field label="Tìm cư dân theo tên hoặc số điện thoại">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
        />
      </Field>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Field label="Cư dân đăng ký xe">
        <select
          name="ma_cu_dan"
          required
          value={selected?.ma_cu_dan || ""}
          onChange={(e) => choose(e.target.value)}
        >
          <option value="">Chọn cư dân đang ở</option>
          {selected &&
            !matches.some((r) => r.ma_cu_dan === selected.ma_cu_dan) && (
              <option value={selected.ma_cu_dan}>
                {selected.ho_va_ten} · {selected.so_dien_thoai} · Căn{" "}
                {selected.so_can_ho}
              </option>
            )}
          {matches.map((r) => (
            <option value={r.ma_cu_dan} key={r.ma_cu_dan}>
              {r.ho_va_ten} · {r.so_dien_thoai} · Căn {r.so_can_ho}
            </option>
          ))}
        </select>
      </Field>
      <input
        type="hidden"
        name="ma_lich_su_cu_tru"
        value={selected?.ma_lich_su_cu_tru || ""}
      />
      {selected && (
        <p>
          Căn chịu phí: <strong>{selected.so_can_ho}</strong> · Cư trú từ{" "}
          {selected.tu_ngay}.
        </p>
      )}
      {resource.result?.total > 20 && (
        <small>
          Có {resource.result.total} cư dân phù hợp. Nhập tên hoặc số điện thoại
          cụ thể để tìm.
        </small>
      )}
    </>
  );
}

function VehicleForm({ initialId, pending, onSave }) {
  const [type, setType] = useState("XE_MAY"),
    [owner, setOwner] = useState(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(formValues(e));
      }}
    >
      <fieldset disabled={pending}>
        <OwnerPicker initialId={initialId} onChoose={setOwner} />
        <Field label="Loại xe">
          <select
            name="loai_xe"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <Options values={types} />
          </select>
        </Field>
        <Field
          label={type === "XE_DAP" ? "Biển số (tùy chọn)" : "Biển số"}
          name="bien_so"
          required={type !== "XE_DAP"}
          maxLength={30}
          placeholder="Ví dụ: 59A-123.45"
        />
        <div className="form-grid">
          <Field label="Hãng xe" name="hang_xe" maxLength={50} />
          <Field label="Màu sắc" name="mau_sac" maxLength={50} />
        </div>
        <Field
          label="Ngày đăng ký xe"
          name="ngay_dang_ky"
          type="date"
          required
          min={owner?.tu_ngay || "1900-01-01"}
          max={today()}
          defaultValue={today()}
        />
        <small>
          Ngày đăng ký từ ngày bắt đầu đợt cư trú đến hôm nay. Xe đạp không bắt
          buộc có biển số.
        </small>
        <button className="primary" disabled={!owner}>
          {pending ? "Đang lưu…" : "Lưu đăng ký xe"}
        </button>
      </fieldset>
    </form>
  );
}

function VehicleDetail({ id }) {
  const resource = useResource(`/phuong_tien/${id}`),
    record = resource.result?.data;
  return (
    <section className="card">
      <h2>Chi tiết đăng ký xe</h2>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      {record && (
        <>
          <h3>
            {record.ma_dang_ky} · {types[record.loai_xe]} ·{" "}
            {record.bien_so || "Không có biển số"}
          </h3>
          <p>
            <Link to={`/quan-tri/cu-dan/${record.ma_cu_dan}`}>
              {record.ho_va_ten}
            </Link>{" "}
            · {record.so_dien_thoai} · Căn chịu phí: {record.so_can_ho}
          </p>
          <p>
            Hãng xe: {record.hang_xe || "—"} · Màu sắc: {record.mau_sac || "—"}
          </p>
          <p>
            Từ ngày {record.ngay_dang_ky} ·{" "}
            {record.ngay_ket_thuc
              ? `Kết thúc trước ngày ${record.ngay_ket_thuc}`
              : "Đang gửi"}{" "}
            · Người tạo: {record.nguoi_tao}
          </p>
          {record.ngay_ket_thuc && (
            <p>
              Lý do kết thúc: {record.ly_do_ket_thuc} · Người ghi nhận:{" "}
              {record.nguoi_ket_thuc}
            </p>
          )}
          {record.ngay_ket_thuc === record.ngay_dang_ky && (
            <p>Đăng ký kết thúc trong ngày; bản ghi được giữ để xem lịch sử.</p>
          )}
          {record.ma_dang_ky_truoc && (
            <p>
              Chuyển tiếp từ{" "}
              <Link
                to={`/quan-tri/phuong-tien?q=${encodeURIComponent(record.dang_ky_truoc)}`}
              >
                {record.dang_ky_truoc}
              </Link>
              .
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default function Vehicles() {
  const [params, setParams] = useSearchParams();
  const resource = useResource(`/phuong_tien?${params}`);
  const [adding, setAdding] = useState(false),
    [ending, setEnding] = useState(null),
    [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [notice, setNotice] = useState("");
  async function save(path, body, message) {
    setPending(true);
    setError(null);
    setNotice("");
    try {
      await getJson(path, { method: "POST", body });
      setAdding(false);
      setEnding(null);
      setSelected(null);
      setNotice(message);
      resource.reload();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  function go(page) {
    const next = new URLSearchParams(params);
    next.set("page", String(page));
    setParams(next);
  }
  const page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Phương tiện</h1>
          <p>Quản lý đăng ký xe và căn hộ chịu phí theo từng đợt cư trú.</p>
        </div>
        <button
          className="primary"
          disabled={pending}
          onClick={() => {
            setAdding(!adding);
            setEnding(null);
          }}
        >
          {adding ? "Đóng biểu mẫu" : "Đăng ký xe"}
        </button>
      </div>
      {params.get("ma_cu_dan") && (
        <p>
          Đang lọc xe của cư dân #{params.get("ma_cu_dan")} ·{" "}
          <Link to="/quan-tri/phuong-tien">Xem tất cả</Link>
        </p>
      )}
      {notice && (
        <p className="note" role="status">
          {notice}
        </p>
      )}
      <ErrorBox error={error} />
      {adding && (
        <section className="card narrow">
          <h2>Đăng ký xe mới</h2>
          <VehicleForm
            initialId={params.get("ma_cu_dan")}
            pending={pending}
            onSave={(body) => save("/phuong_tien", body, "Đã tạo đăng ký xe.")}
          />
        </section>
      )}
      {ending && (
        <section className="card narrow">
          <h2>Kết thúc đăng ký {ending.ma_dang_ky}</h2>
          <p>
            {ending.bien_so || types[ending.loai_xe]} · Căn {ending.so_can_ho}.
            Bản ghi cũ sẽ được giữ trong lịch sử.
          </p>
          <form
            key={ending.ma_phuong_tien}
            onSubmit={(e) => {
              e.preventDefault();
              save(
                `/phuong_tien/${ending.ma_phuong_tien}/ket_thuc`,
                { ...formValues(e), phien_ban: ending.phien_ban },
                "Đã kết thúc đăng ký xe.",
              );
            }}
          >
            <fieldset disabled={pending}>
              <Field
                label="Ngày kết thúc đăng ký xe"
                name="ngay_ket_thuc"
                type="date"
                required
                min={ending.ngay_dang_ky}
                max={today()}
                defaultValue={today()}
              />
              <Field
                label="Lý do kết thúc"
                name="ly_do_ket_thuc"
                required
                minLength={3}
                maxLength={255}
              />
              <button className="primary">
                {pending ? "Đang lưu…" : "Xác nhận kết thúc"}
              </button>
            </fieldset>
          </form>
          <button disabled={pending} onClick={() => setEnding(null)}>
            Hủy
          </button>
        </section>
      )}
      <form
        key={params.toString()}
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          const next = new URLSearchParams(formValues(e));
          if (params.has("ma_cu_dan"))
            next.set("ma_cu_dan", params.get("ma_cu_dan"));
          setParams(next);
        }}
      >
        <Field
          label="Tìm biển số, mã đăng ký, cư dân hoặc căn hộ"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field label="Lọc loại xe">
          <select name="loai_xe" defaultValue={params.get("loai_xe") || ""}>
            <Options values={types} empty="Tất cả loại xe" />
          </select>
        </Field>
        <Field label="Tình trạng đăng ký">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <option value="">Tất cả đăng ký</option>
            <option value="DANG_GUI">Đang gửi</option>
            <option value="DA_KET_THUC">Đã kết thúc</option>
          </select>
        </Field>
        <button>Tìm kiếm</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã đăng ký</th>
                <th>Loại / biển số</th>
                <th>Cư dân</th>
                <th>Căn chịu phí</th>
                <th>Thời gian</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((v) => (
                <tr key={v.ma_phuong_tien}>
                  <td>{v.ma_dang_ky}</td>
                  <td>
                    {types[v.loai_xe]}
                    <br />
                    {v.bien_so || "Không có biển số"}
                  </td>
                  <td>
                    <Link to={`/quan-tri/cu-dan/${v.ma_cu_dan}`}>
                      {v.ho_va_ten}
                    </Link>
                  </td>
                  <td>{v.so_can_ho}</td>
                  <td>
                    {v.ngay_dang_ky}
                    <br />
                    {v.ngay_ket_thuc
                      ? `Đến trước ${v.ngay_ket_thuc}`
                      : "Đang gửi"}
                  </td>
                  <td>
                    <div className="actions">
                      <button onClick={() => setSelected(v.ma_phuong_tien)}>
                        Chi tiết
                      </button>
                      {!v.ngay_ket_thuc && (
                        <button
                          disabled={pending}
                          onClick={() => {
                            setEnding(v);
                            setAdding(false);
                          }}
                        >
                          Kết thúc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!resource.loading && resource.result?.total === 0 && (
          <p>Chưa có đăng ký xe phù hợp.</p>
        )}
        <div className="actions">
          <button
            disabled={resource.loading || page <= 1}
            onClick={() => go(page - 1)}
          >
            Trang trước
          </button>
          <span>
            Trang {page} · {total} đăng ký
          </span>
          <button
            disabled={resource.loading || page * 20 >= total}
            onClick={() => go(page + 1)}
          >
            Trang sau
          </button>
        </div>
      </section>
      {selected && <VehicleDetail id={selected} />}
    </>
  );
}
```

## 8. `frontend/src/features/residency/Residency.jsx`

```jsx
import React, { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";

const relations = {
  CHU_HO: "Chủ hộ",
  THANH_VIEN: "Thành viên",
  NGUOI_THUE: "Người thuê",
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const values = (event) => Object.fromEntries(new FormData(event.currentTarget));
const displayDay = (day) => day.split("-").reverse().join("/");

function Pager({ resource }) {
  const [params, setParams] = useSearchParams();
  const page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(next) {
    const p = new URLSearchParams(params);
    p.set("page", String(next));
    setParams(p);
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
        Trang {page} · {total} hồ sơ
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
function useChange(reload) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState();
  async function change(path, method, body, done) {
    setPending(true);
    setError(null);
    try {
      await getJson(path, { method, body });
      done?.();
      reload();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return { pending, error, change };
}

export function Apartments() {
  const [params, setParams] = useSearchParams();
  const resource = useResource(`/can_ho?${params}`);
  const [editing, setEditing] = useState(null),
    [selected, setSelected] = useState(null);
  const action = useChange(() => {
    resource.reload();
    setSelected(null);
  });
  return (
    <>
      <h1>Căn hộ</h1>
      <p>Trạng thái có người ở được xác định từ các đợt cư trú đang mở.</p>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Tìm số căn hộ hoặc khối"
          name="q"
          defaultValue={params.get("q") || ""}
          maxLength={100}
        />
        <Field
          label="Tầng (tùy chọn)"
          name="tang"
          type="number"
          min={0}
          max={200}
          defaultValue={params.get("tang") || ""}
        />
        <button>Tìm kiếm</button>
      </form>
      <ErrorBox error={resource.error || action.error} />
      <div className="detail-grid">
        <section className="card">
          <h2>Danh sách căn hộ</h2>
          {resource.loading && <Loading />}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Căn hộ</th>
                  <th>Khối / tầng</th>
                  <th>Diện tích</th>
                  <th>Cư dân</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {resource.result?.data.map((a) => (
                  <tr key={a.ma_can_ho}>
                    <td>{a.so_can_ho}</td>
                    <td>
                      {a.khoi} / {a.tang}
                    </td>
                    <td>{a.dien_tich_m2} m²</td>
                    <td>{a.so_cu_dan ? `${a.so_cu_dan} đang ở` : "Trống"}</td>
                    <td>
                      <div className="actions">
                        <button onClick={() => setSelected(a.ma_can_ho)}>
                          Xem
                        </button>
                        <button
                          disabled={action.pending}
                          onClick={() => setEditing(a)}
                        >
                          Sửa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!resource.loading && resource.result?.total === 0 && (
            <p>Chưa có căn hộ phù hợp.</p>
          )}
          <Pager resource={resource} />
        </section>
        <section className="card">
          <h2>{editing ? `Sửa căn ${editing.so_can_ho}` : "Thêm căn hộ"}</h2>
          <form
            key={editing?.ma_can_ho || "new"}
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget,
                body = values(e);
              body.tinh_phi_dich_vu = body.tinh_phi_dich_vu === "1";
              if (editing) body.phien_ban = editing.phien_ban;
              action.change(
                `/can_ho${editing ? `/${editing.ma_can_ho}` : ""}`,
                editing ? "PATCH" : "POST",
                body,
                () => {
                  form.reset();
                  setEditing(null);
                },
              );
            }}
          >
            <fieldset disabled={action.pending}>
              <Field
                label="Số căn hộ"
                name="so_can_ho"
                required
                maxLength={20}
                defaultValue={editing?.so_can_ho || ""}
              />
              <div className="form-grid">
                <Field
                  label="Khối"
                  name="khoi"
                  required
                  maxLength={10}
                  defaultValue={editing?.khoi || ""}
                />
                <Field
                  label="Tầng"
                  name="tang"
                  type="number"
                  required
                  min={0}
                  max={200}
                  defaultValue={editing?.tang ?? 1}
                />
              </div>
              <Field
                label="Diện tích (m²)"
                name="dien_tich_m2"
                type="number"
                required
                min="0.01"
                max="999999.99"
                step="0.01"
                defaultValue={editing?.dien_tich_m2 || ""}
              />
              <Field label="Tính phí dịch vụ">
                <select
                  name="tinh_phi_dich_vu"
                  defaultValue={editing?.tinh_phi_dich_vu === 0 ? "0" : "1"}
                >
                  <option value="1">Có</option>
                  <option value="0">Không</option>
                </select>
              </Field>
              <button className="primary">
                {action.pending ? "Đang lưu…" : "Lưu căn hộ"}
              </button>
            </fieldset>
          </form>
          {editing && (
            <button disabled={action.pending} onClick={() => setEditing(null)}>
              Hủy sửa
            </button>
          )}
        </section>
      </div>
      {selected && <ApartmentResidents id={selected} />}
    </>
  );
}
function ApartmentResidents({ id: selected }) {
  const detail = useResource(`/can_ho/${selected}`);
  return (
    <section className="card">
      {detail.loading && <Loading />}
      <ErrorBox error={detail.error} />
      {detail.result && (
        <>
          <h2>Cư dân căn {detail.result.data.so_can_ho}</h2>
          <Link
            className="button"
            to={`/quan-tri/cu-dan?ma_can_ho=${selected}&so=${encodeURIComponent(detail.result.data.so_can_ho)}`}
          >
            Thêm hoặc xem cư dân căn này
          </Link>
          <ul>
            {detail.result.data.residents.map((r) => (
              <li key={r.ma_cu_dan}>
                <Link to={`/quan-tri/cu-dan/${r.ma_cu_dan}`}>
                  {r.ho_va_ten}
                </Link>{" "}
                · {r.so_dien_thoai} · {relations[r.quan_he]} · Từ {r.tu_ngay}
              </li>
            ))}
          </ul>
          {!detail.result.data.residents.length && (
            <p>Chưa có cư dân đang ở.</p>
          )}
        </>
      )}
    </section>
  );
}

function ApartmentPicker({ initialId = "", initialLabel = "" }) {
  const [q, setQ] = useState(""),
    [id, setId] = useState(String(initialId)),
    [label, setLabel] = useState(initialLabel);
  const resource = useResource(`/can_ho?q=${encodeURIComponent(q)}`);
  const apartments = resource.result?.data || [];
  return (
    <>
      <Field label="Tìm căn hộ">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nhập số căn hộ hoặc khối"
        />
      </Field>
      {resource.loading && <Loading />}
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
          {id && !apartments.some((a) => String(a.ma_can_ho) === id) && (
            <option value={id}>{label || `Căn hộ #${id}`}</option>
          )}
          {apartments.map((a) => (
            <option key={a.ma_can_ho} value={a.ma_can_ho}>
              {a.so_can_ho} · Khối {a.khoi} · Tầng {a.tang}
            </option>
          ))}
        </select>
      </Field>
      {resource.result?.total > 20 && (
        <small>
          Có {resource.result.total} căn phù hợp. Nhập số căn cụ thể để thu hẹp
          danh sách.
        </small>
      )}
    </>
  );
}

function ProfileFields({ resident }) {
  const [q, setQ] = useState(""),
    [accountId, setAccountId] = useState(String(resident?.ma_nguoi_dung || ""));
  const users = useResource(`/cu_dan/tai_khoan?q=${encodeURIComponent(q)}`);
  const accounts = users.result?.data || [];
  return (
    <>
      <Field
        label="Họ tên"
        name="ho_va_ten"
        required
        minLength={2}
        maxLength={100}
        defaultValue={resident?.ho_va_ten || ""}
      />
      <Field
        label="Số điện thoại"
        name="so_dien_thoai"
        type="tel"
        required
        maxLength={15}
        defaultValue={resident?.so_dien_thoai || ""}
      />
      <ErrorBox error={users.error} />
      <Field label="Tìm tài khoản theo tên hoặc số điện thoại">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
        />
      </Field>
      <input type="hidden" name="ma_nguoi_dung" value={accountId} />
      <Field label="Tài khoản cư dân (tùy chọn)">
        <select
          disabled={users.loading || !!users.error}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          <option value="">Chưa gắn tài khoản</option>
          {accountId &&
            !accounts.some((u) => String(u.ma_nguoi_dung) === accountId) && (
              <option value={accountId}>Tài khoản đã chọn #{accountId}</option>
            )}
          {accounts.map((u) => (
            <option key={u.ma_nguoi_dung} value={u.ma_nguoi_dung}>
              {u.ho_va_ten} · {u.so_dien_thoai}
            </option>
          ))}
        </select>
      </Field>
      {users.result?.total > 20 && (
        <small>
          Nhập tên hoặc số điện thoại cụ thể để tìm trong {users.result.total}{" "}
          tài khoản.
        </small>
      )}
      <small>
        Cấp tài khoản tại mục Nhân sự & tài khoản, sau đó chọn ở đây.
      </small>
    </>
  );
}
function StayFields({
  current,
  initialId,
  initialLabel,
  minDay = "1900-01-01",
}) {
  return (
    <>
      <ApartmentPicker initialId={initialId} initialLabel={initialLabel} />
      <Field label="Quan hệ với căn hộ">
        <select name="quan_he" defaultValue={current?.quan_he || "THANH_VIEN"}>
          <Options values={relations} />
        </select>
      </Field>
      <Field
        label="Ngày bắt đầu / chuyển căn"
        name="ngay"
        type="date"
        required
        min={minDay}
        max={today()}
        defaultValue={today()}
      />
      {!current && (
        <small>
          Nhập ngày thực tế bắt đầu ở căn hộ, có thể trước ngày lập hồ sơ.
        </small>
      )}
    </>
  );
}

export function Residents() {
  const [params, setParams] = useSearchParams(),
    [adding, setAdding] = useState(false);
  const filter = new URLSearchParams(params);
  filter.delete("so");
  const resource = useResource(`/cu_dan?${filter}`);
  const action = useChange(resource.reload);
  return (
    <>
      <div className="page-heading">
        <h1>Cư dân</h1>
        <button
          className="primary"
          disabled={action.pending}
          onClick={() => setAdding(!adding)}
        >
          {adding ? "Đóng biểu mẫu" : "Thêm cư dân"}
        </button>
      </div>
      {params.get("ma_can_ho") && (
        <p>
          Đang lọc căn {params.get("so") || `#${params.get("ma_can_ho")}`} ·{" "}
          <Link to="/quan-tri/cu-dan">Xem tất cả cư dân</Link>
        </p>
      )}
      <ErrorBox error={action.error} />
      {adding && (
        <section className="card narrow">
          <h2>Hồ sơ và đợt cư trú đầu tiên</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action.change("/cu_dan", "POST", values(e), () =>
                setAdding(false),
              );
            }}
          >
            <fieldset disabled={action.pending}>
              <ProfileFields />
              <StayFields
                initialId={params.get("ma_can_ho") || ""}
                initialLabel={params.get("so") || ""}
              />
              <button className="primary">
                {action.pending ? "Đang lưu…" : "Lưu cư dân"}
              </button>
            </fieldset>
          </form>
        </section>
      )}
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          const p = new URLSearchParams(values(e));
          for (const key of ["ma_can_ho", "so"])
            if (params.has(key)) p.set(key, params.get(key));
          setParams(p);
        }}
      >
        <Field
          label="Tìm tên hoặc số điện thoại"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field label="Tình trạng cư trú">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <option value="">Tất cả</option>
            <option value="DANG_O">Đang ở</option>
            <option value="DA_CHUYEN_DI">Đã chuyển đi</option>
          </select>
        </Field>
        <button>Tìm kiếm</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Số điện thoại</th>
                <th>Căn hộ hiện tại</th>
                <th>Quan hệ</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((r) => (
                <tr key={r.ma_cu_dan}>
                  <td>
                    <Link to={`/quan-tri/cu-dan/${r.ma_cu_dan}`}>
                      {r.ho_va_ten}
                    </Link>
                  </td>
                  <td>{r.so_dien_thoai}</td>
                  <td>{r.so_can_ho || "Đã chuyển đi"}</td>
                  <td>{relations[r.quan_he] || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!resource.loading && resource.result?.total === 0 && (
          <p>Chưa có cư dân phù hợp.</p>
        )}
        <Pager resource={resource} />
      </section>
    </>
  );
}

export function ResidentDetail() {
  const { id } = useParams(),
    resource = useResource(`/cu_dan/${id}`);
  const [mode, setMode] = useState("");
  const action = useChange(resource.reload);
  const resident = resource.result?.data,
    current = resident?.history.find((s) => !s.den_ngay);
  const minDay = current
    ? current.tu_ngay
    : resident?.history[0]?.den_ngay || "1900-01-01";
  const dateBlocked = mode !== "profile" && minDay > today();
  return (
    <>
      <Link to="/quan-tri/cu-dan">← Danh sách cư dân</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error || action.error} />
      {resident && (
        <>
          <h1>{resident.ho_va_ten}</h1>
          <p>
            {resident.so_dien_thoai} ·{" "}
            {current ? `Đang ở căn ${current.so_can_ho}` : "Đã chuyển đi"}
          </p>
          {current && (
            <p>
              Đợt cư trú hiện tại bắt đầu ngày {displayDay(current.tu_ngay)}.
            </p>
          )}
          <p>
            <Link
              className="button"
              to={`/quan-tri/phuong-tien?ma_cu_dan=${id}`}
            >
              Phương tiện của cư dân
            </Link>
          </p>
          <div className="actions">
            {[
              ["profile", "Sửa hồ sơ"],
              ...(current
                ? [
                    ["chuyen_can", "Chuyển căn"],
                    ["chuyen_di", "Ghi nhận chuyển đi"],
                  ]
                : [["nhap_cu", "Ghi nhận quay lại"]]),
            ].map(([value, label]) => (
              <button
                key={value}
                disabled={action.pending}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {mode && (
            <section className="card narrow">
              <h2>
                {
                  {
                    profile: "Sửa hồ sơ",
                    chuyen_can: "Chuyển căn",
                    chuyen_di: "Ghi nhận chuyển đi",
                    nhap_cu: "Ghi nhận quay lại",
                  }[mode]
                }
              </h2>
              {mode !== "profile" && (
                <p className="note" role="status">
                  {dateBlocked
                    ? `Chưa có ngày hợp lệ: ngày sớm nhất là ${displayDay(minDay)}, sau ngày hiện tại ${displayDay(today())}.`
                    : `Có thể chọn ngày từ ${displayDay(minDay)} đến ${displayDay(today())}, kể cả chuyển căn trong ngày bắt đầu ở. Lịch sử căn cũ vẫn được giữ.`}
                </p>
              )}
              <form
                key={`${mode}:${resident.phien_ban}`}
                onSubmit={(e) => {
                  e.preventDefault();
                  const body = { ...values(e), phien_ban: resident.phien_ban };
                  if (mode === "chuyen_can")
                    body.chuyen_phuong_tien = body.chuyen_phuong_tien === "1";
                  action.change(
                    `/cu_dan/${id}${mode === "profile" ? "" : `/${mode}`}`,
                    mode === "profile" ? "PATCH" : "POST",
                    body,
                    () => setMode(""),
                  );
                }}
              >
                <fieldset disabled={action.pending || dateBlocked}>
                  {mode === "profile" ? (
                    <ProfileFields resident={resident} />
                  ) : mode === "chuyen_di" ? (
                    <>
                      <p>Kết thúc đợt cư trú hiện tại và giữ lại lịch sử.</p>
                      <Field
                        label="Ngày chuyển đi"
                        name="ngay"
                        type="date"
                        required
                        min={minDay}
                        max={today()}
                        defaultValue={today()}
                      />
                    </>
                  ) : (
                    <StayFields current={current} minDay={minDay} />
                  )}
                  {mode === "chuyen_can" && (
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        name="chuyen_phuong_tien"
                        value="1"
                        defaultChecked
                      />{" "}
                      Chuyển đăng ký xe đang gửi sang căn mới
                    </label>
                  )}
                  {mode === "chuyen_can" && (
                    <p>
                      Đăng ký xe ở căn cũ sẽ kết thúc cùng ngày chuyển. Khi chọn
                      chuyển xe, hệ thống tạo đăng ký mới và giữ lịch sử căn cũ.
                    </p>
                  )}
                  {mode === "chuyen_di" && (
                    <p>
                      Tất cả đăng ký xe đang gửi của cư dân sẽ kết thúc cùng
                      ngày chuyển đi và được giữ trong lịch sử.
                    </p>
                  )}
                  <button className="primary">
                    {action.pending ? "Đang lưu…" : "Xác nhận lưu"}
                  </button>
                </fieldset>
              </form>
              <button disabled={action.pending} onClick={() => setMode("")}>
                Hủy
              </button>
            </section>
          )}
          <section className="card">
            <h2>Lịch sử cư trú</h2>
            <p>
              Ngày kết thúc không thuộc đợt cũ; khi chuyển căn, đợt mới bắt đầu
              cùng ngày đó. Các đợt bắt đầu và kết thúc cùng ngày được giữ để
              ghi nhận chuyển trong ngày; hệ thống không phân chia theo giờ.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Căn hộ</th>
                    <th>Quan hệ</th>
                    <th>Từ ngày</th>
                    <th>Đến trước ngày</th>
                    <th>Người ghi nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {resident.history.map((s) => (
                    <tr key={s.ma_lich_su_cu_tru}>
                      <td>{s.so_can_ho}</td>
                      <td>{relations[s.quan_he]}</td>
                      <td>{s.tu_ngay}</td>
                      <td>
                        {s.den_ngay || "Đang ở"}
                        {s.den_ngay === s.tu_ngay && (
                          <small> · Chuyển trong ngày</small>
                        )}
                      </td>
                      <td>{s.nguoi_ghi_nhan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
```

## 9. `frontend/src/app/App.jsx`

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
          ["/quan-tri/vi-tri-qr", "Vị trí & QR"],
          ["/quan-tri/nhan-su", "Nhân sự & tài khoản"],
        ]
      : user?.vai_tro === "KY_THUAT_VIEN"
        ? [["/ky-thuat/cong-viec", "Công việc"]]
        : [["/cu-dan/phan-anh", "Phản ánh của tôi"]];
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

## Chạy cập nhật database và ứng dụng

Tại thư mục gốc dự án trong PowerShell:

```powershell
npm run db:migrate
```

Kết quả cần có `Schema current: 004_vehicles.sql`. Migration thêm bảng phương tiện, giữ dữ liệu tài khoản, QR, phản ánh và cư trú. Không cần seed lại hoặc đổi mật khẩu.

Khởi động backend:

```powershell
npm run dev:backend
```

Mở terminal thứ hai tại cùng thư mục:

```powershell
npm run dev:frontend:https
```

Lệnh HTTPS dùng chứng chỉ bạn đã tạo trước đó. Mở trang web và tải lại bằng F5. Đăng nhập tài khoản BQL hiện có.

Để kiểm tra backend trong terminal khác trên máy chạy ứng dụng:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/ready
```

API cần trả `status: ok`, `database: connected`. Nếu báo chưa sẵn sàng, kiểm tra đã lưu đủ SQL 001–004 và migrate bằng `.env` của đúng dự án. Không xóa database hoặc sửa checksum để bỏ qua lỗi migration.

## Thử chức năng

1. BQL → **Phương tiện** → **Đăng ký xe**. Tìm và chọn cư dân đang ở. Căn chịu phí được hiển thị theo đợt cư trú. Nhập loại xe, biển số, hãng/màu và ngày đăng ký, rồi lưu.
2. Thử xe máy/ô tô có biển; thử xe đạp để trống biển. Mỗi đăng ký có mã `XE-...` riêng. Biển viết hoa, bỏ chấm/gạch nối/khoảng trắng; `59A-123.45` và `59A12345` là cùng một biển.
3. Tìm theo biển, mã, tên/SĐT hoặc căn; lọc loại xe và trạng thái. Mở **Chi tiết** để xem căn chịu phí, đợt, người tạo và lý do kết thúc nếu có.
4. Mở **Cư dân & cư trú** → hồ sơ chủ xe → **Chuyển căn**. Giữ chọn **Chuyển đăng ký xe đang gửi sang căn mới** để tự kết thúc bản cũ và tạo bản mới. Chọn căn khác, có thể chuyển ngay hôm nay hoặc nhiều lần trong ngày. Xem **Phương tiện của cư dân** để thấy cả bản cũ và bản mới.
5. Nếu bỏ chọn chuyển xe, các đăng ký cũ kết thúc mà không tạo tiếp. **Ghi nhận chuyển đi** cũng kết thúc toàn bộ xe đang gửi. Quay lại không tự mở lại xe cũ; cần đăng ký mới.
6. Trong danh sách phương tiện, **Kết thúc** cần ngày và lý do. Cùng ngày đăng ký được chấp nhận. Bản cũ giữ lịch sử; không có xóa/sửa căn chịu phí của bản đã kết thúc.

Ngày đăng ký không trước ngày bắt đầu đợt đang ở và không sau hôm nay. Nếu cư dân vừa chuyển căn ở cửa sổ khác, API yêu cầu tải lại/chọn lại cư dân. Ngày chuyển không được trước ngày đăng ký/kết thúc xe đã ghi trong đợt; cần chọn ngày phù hợp. Đăng ký lại cùng biển được sau khi kết thúc, nhưng khoảng thời gian gửi có độ dài lớn hơn 0 không được chồng nhau. Xe đạp không biển phân biệt bằng mã đăng ký riêng.

Tất cả màn và API phương tiện chỉ dành cho BQL. Phiên bản này lưu dữ liệu chuẩn bị cho phí gửi xe; chưa tính hoặc phát hành hóa đơn. Thời gian theo ngày, không chia theo giờ; bản kết thúc cùng ngày là dấu vết lịch sử, không tạo thêm ngày chịu phí.

## Phụ lục: migration 003 nếu dự án chưa có

Chỉ tạo file này nếu đang thiếu `database/migrations/003_same_day_residency.sql`. Nếu đã có, giữ nguyên.

```sql
ALTER TABLE lich_su_cu_tru
  DROP CHECK lich_su_cu_tru_chk_1,
  ADD CONSTRAINT chk_cu_tru_thu_tu_ngay
    CHECK (den_ngay IS NULL OR den_ngay >= tu_ngay);
```

## Kiểm thử dành cho môi trường phát triển

Kiểm thử nguồn nằm trong `backend/test/vehicles.test.js` và `e2e/vehicles.spec.js`. Khi cập nhật bộ test, đổi script `test` trong `backend/package.json` thành:

```json
"test": "node --env-file-if-exists=../.env --test --test-concurrency=1 test/*.test.js"
```

Các bộ kiểm thử API cần chạy tuần tự vì dùng trigger tạm trên database test chung để giả lập lỗi giao dịch. Từ thư mục gốc, chạy `npm test`, `npm run test:e2e`, `npm run build`; cần Docker cho database riêng `chung_cu_test`. Không chạy file test trực tiếp với database phát triển.
