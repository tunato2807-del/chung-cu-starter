# Cập nhật căn hộ và cư dân trong VS Code

Khi đã có module phí/hóa đơn, dùng [hướng dẫn hóa đơn mới nhất](cap-nhat-hoa-don-vscode.md) chứa cả service cư trú/phương tiện có khóa dữ liệu đã tính phí. Các khối code bên dưới là bản trước module hóa đơn.

Bản hướng dẫn này là phiên bản căn hộ/cư trú trước module phương tiện. Khi đã triển khai phương tiện, dùng [hướng dẫn phương tiện](cap-nhat-phuong-tien-vscode.md) chứa đầy đủ các file cư trú được bổ sung xử lý xe.

Hướng dẫn này chứa code đầy đủ theo từng file cho bản bổ sung sau commit `b41060d`, gồm hướng dẫn khoảng ngày chuyển căn hợp lệ. Mở file Markdown này trên GitHub để copy từng khối code vào VS Code, không cần tải ZIP. Các khối code là ảnh chụp của phiên bản bổ sung căn hộ/cư trú này; khi nâng cấp tiếp, dùng phiên bản mới của file nguồn.

## Trước khi sửa

Mở thư mục dự án đang chạy của bạn. Dừng backend/frontend bằng Ctrl+C trong đúng terminal của từng tiến trình. Giữ lại `.env`, `.certs` và `backend/storage` trên máy. Nếu có chỉnh sửa riêng trong các file dưới đây, lưu một bản trước khi thay.

Tạo các thư mục còn thiếu. Tạo hoặc thay toàn bộ nội dung từng file bên dưới bằng khối code tương ứng. Không thay file `001_auth_qr_incidents.sql` đã chạy. Chưa cần chạy ứng dụng cho đến khi đã thay đủ file.

## 1. `database/migrations/002_residency.sql`

```sql
CREATE TABLE IF NOT EXISTS can_ho (
  ma_can_ho INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  so_can_ho VARCHAR(20) NOT NULL UNIQUE,
  khoi VARCHAR(10) NOT NULL,
  tang SMALLINT UNSIGNED NOT NULL,
  dien_tich_m2 DECIMAL(8,2) NOT NULL,
  tinh_phi_dich_vu BOOLEAN NOT NULL DEFAULT TRUE,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (dien_tich_m2 > 0),
  INDEX idx_floor (khoi, tang)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS cu_dan (
  ma_cu_dan INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ho_va_ten VARCHAR(100) NOT NULL,
  so_dien_thoai VARCHAR(15) NOT NULL,
  ma_nguoi_dung INT UNSIGNED NULL UNIQUE,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_nguoi_dung) REFERENCES nguoi_dung(ma_nguoi_dung)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS lich_su_cu_tru (
  ma_lich_su_cu_tru INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_cu_dan INT UNSIGNED NOT NULL,
  ma_can_ho INT UNSIGNED NOT NULL,
  quan_he ENUM('CHU_HO','THANH_VIEN','NGUOI_THUE') NOT NULL,
  tu_ngay DATE NOT NULL,
  den_ngay DATE NULL,
  ma_nguoi_ghi_nhan INT UNSIGNED NOT NULL,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cu_dan_dang_o INT UNSIGNED GENERATED ALWAYS AS
    (CASE WHEN den_ngay IS NULL THEN ma_cu_dan ELSE NULL END) STORED,
  UNIQUE (cu_dan_dang_o),
  CHECK (den_ngay IS NULL OR den_ngay > tu_ngay),
  FOREIGN KEY (ma_cu_dan) REFERENCES cu_dan(ma_cu_dan),
  FOREIGN KEY (ma_can_ho) REFERENCES can_ho(ma_can_ho),
  FOREIGN KEY (ma_nguoi_ghi_nhan) REFERENCES nguoi_dung(ma_nguoi_dung),
  INDEX idx_resident_period (ma_cu_dan, tu_ngay, den_ngay),
  INDEX idx_apartment_period (ma_can_ho, tu_ngay, den_ngay)
) ENGINE=InnoDB;
```

## 1b. `database/migrations/003_same_day_residency.sql`

Tạo file mới dưới đây để hỗ trợ chuyển căn cùng ngày. Giữ nguyên migration 001 và 002 nếu đã chạy.

```sql
ALTER TABLE lich_su_cu_tru
  DROP CHECK lich_su_cu_tru_chk_1,
  ADD CONSTRAINT chk_cu_tru_thu_tu_ngay
    CHECK (den_ngay IS NULL OR den_ngay >= tu_ngay);
```

## 2. `backend/scripts/migrate.js`

```js
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pool } from "../src/lib/db.js";
const db = await pool.getConnection();
try {
  const [[lock]] = await db.query(
    "SELECT GET_LOCK('chung_cu_migrations', 30) AS acquired",
  );
  if (!lock.acquired) throw new Error("Migration is already running");
  await db.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(100) PRIMARY KEY, checksum CHAR(64) NOT NULL)",
  );
  const directory = new URL("../../database/migrations/", import.meta.url);
  const names = (await readdir(directory))
    .filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name))
    .sort();
  const [applied] = await db.query("SELECT name FROM schema_migrations");
  if (applied.some(({ name }) => !names.includes(name)))
    throw new Error("An applied migration is missing from this checkout.");
  for (const name of names) {
    const sql = await readFile(
      new URL(`../../database/migrations/${name}`, import.meta.url),
      "utf8",
    );
    const checksum = createHash("sha256").update(sql).digest("hex");
    const [old] = await db.execute(
      "SELECT checksum FROM schema_migrations WHERE name=?",
      [name],
    );
    if (old.length && old[0].checksum !== checksum)
      throw new Error(
        "Applied migration changed. Add a new migration instead.",
      );
    if (!old.length) {
      // MySQL DDL commits implicitly. A partial failure must be investigated, never marked applied.
      for (const statement of sql.split(";").filter((x) => x.trim()))
        await db.query(statement);
      await db.execute("INSERT INTO schema_migrations VALUES (?,?)", [
        name,
        checksum,
      ]);
    }
  }
  console.log(`Schema current: ${names.at(-1)}`);
} finally {
  await db.query("SELECT RELEASE_LOCK('chung_cu_migrations')");
  db.release();
  await pool.end();
}
```

## 3. `backend/src/modules/residency/residency.validation.js`

```js
import { choice, fail, integer, phone, text } from "../../lib/http.js";

export function date(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    fail(422, "INVALID_DATE", "Nhập ngày theo định dạng YYYY-MM-DD.");
  const parsed = new Date(`${value}T00:00:00Z`);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value ||
    value < "1900-01-01" ||
    value > today
  )
    fail(422, "INVALID_DATE", "Ngày cư trú phải hợp lệ và không sau hôm nay.");
  return value;
}
export function apartment(body) {
  const area = String(body.dien_tich_m2 ?? "");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(area) || Number(area) <= 0)
    fail(422, "INVALID_AREA", "Diện tích phải lớn hơn 0 và có tối đa 2 số lẻ.");
  const floor = integer(body.tang, "tang");
  if (floor > 200) fail(422, "INVALID_FLOOR", "Tầng phải từ 0 đến 200.");
  if (typeof body.tinh_phi_dich_vu !== "boolean")
    fail(422, "INVALID_FEE_FLAG", "Cần chọn có hoặc không tính phí dịch vụ.");
  return [
    text(body.so_can_ho, "so_can_ho", 1, 20),
    text(body.khoi, "khoi", 1, 10),
    floor,
    area,
    body.tinh_phi_dich_vu,
  ];
}
export function resident(body) {
  return [
    text(body.ho_va_ten, "ho_va_ten", 2, 100),
    phone(body.so_dien_thoai),
    body.ma_nguoi_dung == null || body.ma_nguoi_dung === ""
      ? null
      : integer(body.ma_nguoi_dung, "ma_nguoi_dung"),
  ];
}
export function stay(body) {
  return [
    integer(body.ma_can_ho, "ma_can_ho"),
    choice(body.quan_he, "quan_he", ["CHU_HO", "THANH_VIEN", "NGUOI_THUE"]),
    date(body.ngay),
  ];
}
```

## 4. `backend/src/modules/residency/residency.service.js`

```js
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, integer, text } from "../../lib/http.js";
import * as valid from "./residency.validation.js";

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
    `SELECT c.*,l.ma_can_ho,l.quan_he,l.tu_ngay,a.so_can_ho ${residentJoin} ${where} ORDER BY c.ho_va_ten,c.ma_cu_dan LIMIT 20 OFFSET ${offset}`,
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
    if (current)
      await rows(
        db,
        "UPDATE lich_su_cu_tru SET den_ngay=? WHERE ma_lich_su_cu_tru=?",
        [day, current.ma_lich_su_cu_tru],
      );
    if (next)
      await rows(
        db,
        "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,?,?,?)",
        [id, ...next, user.ma_nguoi_dung],
      );
    await rows(
      db,
      "UPDATE cu_dan SET phien_ban=phien_ban+1 WHERE ma_cu_dan=?",
      [id],
    );
    return { ma_cu_dan: id, phien_ban: resident.phien_ban + 1 };
  });
}
```

## 5. `backend/src/modules/residency/residency.routes.js`

```js
import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./residency.service.js";

export const apartmentsRouter = Router(),
  residentsRouter = Router();
for (const router of [apartmentsRouter, residentsRouter])
  router.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));

apartmentsRouter.get("/", async (req, res) =>
  res.json(await service.listApartments(req.query)),
);
apartmentsRouter.get("/:id", async (req, res) =>
  res.json({
    data: await service.apartmentDetail(integer(req.params.id, "id")),
  }),
);
apartmentsRouter.post("/", async (req, res) =>
  res.status(201).json({ data: await service.saveApartment(null, req.body) }),
);
apartmentsRouter.patch("/:id", async (req, res) =>
  res.json({
    data: await service.saveApartment(integer(req.params.id, "id"), req.body),
  }),
);

residentsRouter.get("/tai_khoan", async (req, res) =>
  res.json(await service.availableAccounts(req.query)),
);
residentsRouter.get("/", async (req, res) =>
  res.json(await service.listResidents(req.query)),
);
residentsRouter.get("/:id", async (req, res) =>
  res.json({
    data: await service.residentDetail(integer(req.params.id, "id")),
  }),
);
residentsRouter.post("/", async (req, res) =>
  res
    .status(201)
    .json({ data: await service.saveResident(null, req.body, req.user) }),
);
residentsRouter.patch("/:id", async (req, res) =>
  res.json({
    data: await service.saveResident(
      integer(req.params.id, "id"),
      req.body,
      req.user,
    ),
  }),
);
for (const action of ["chuyen_can", "chuyen_di", "nhap_cu"])
  residentsRouter.post(`/:id/${action}`, async (req, res) =>
    res.json({
      data: await service.changeStay(
        integer(req.params.id, "id"),
        action,
        req.body,
        req.user,
      ),
    }),
  );
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
      "SELECT name FROM schema_migrations WHERE name IN (?,?,?)",
      [
        "001_auth_qr_incidents.sql",
        "002_residency.sql",
        "003_same_day_residency.sql",
      ],
    );
    if (migrations.length !== 3) throw new Error("Schema not initialized");
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

## 7. `frontend/src/features/residency/Residency.jsx`

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

## 8. `frontend/src/app/App.jsx`

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

## 9. `frontend/src/styles/global.css`

Thêm khối sau vào cuối file:

```css
.card fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
```

## Chạy sau khi lưu đủ file

Mở terminal PowerShell tại thư mục gốc dự án:

```powershell
npm run db:migrate
npm run dev:backend
```

Migration bổ sung ba bảng và giữ dữ liệu hiện có; chạy lại được. Nếu gặp lỗi checksum của migration cũ, không xóa database hoặc bản ghi migration: cần giữ lại file SQL cũ đúng với phiên bản đã chạy.

Mở terminal thứ hai tại cùng thư mục:

```powershell
npm run dev:frontend:https
```

Lệnh HTTPS dùng các chứng chỉ bạn đã tạo trong `.certs`. Tải lại trang và đăng nhập BQL bằng tài khoản hiện có. Không cần seed lại hoặc đổi mật khẩu.

## Thử chức năng

1. BQL → **Căn hộ** → tạo hai căn có số khác nhau. Thử sửa diện tích và tìm theo số căn/khối hoặc tầng.
2. **Cư dân & cư trú** → **Thêm cư dân** → nhập liên hệ, chọn căn và quan hệ. Gắn tài khoản Cư dân đã cấp nếu cần; không bắt buộc có tài khoản.
3. Có thể nhập ngày bắt đầu là hôm nay và chuyển căn ngay hôm nay. Ngày chuyển không được trước ngày bắt đầu và không sau hôm nay. Chuyển nhiều lần cùng ngày vẫn giữ mọi căn cũ trong lịch sử.
4. Mở tên cư dân → **Chuyển căn** → chọn căn khác. Lịch sử phải giữ cả căn cũ và căn mới.
5. **Ghi nhận chuyển đi** kết thúc đợt hiện tại; **Ghi nhận quay lại** mở đợt mới. Không tạo hồ sơ cư dân trùng chỉ để ghi nhận quay lại.
6. Đăng nhập KTV hoặc Cư dân để kiểm tra không có quyền mở danh bạ BQL.

Khoảng cư trú là `[từ ngày, đến ngày)`: ngày chuyển thuộc đợt mới. Các đợt kết thúc ngay trong ngày bắt đầu có `từ ngày = đến ngày`, được đánh dấu “Chuyển trong ngày” và giữ nguyên trong lịch sử; hệ thống chưa phân chia theo giờ. Hồ sơ giữ lịch sử; không có nút xóa cứng. Chuyển đi không tự khóa tài khoản. Lựa chọn tính phí dịch vụ chỉ lưu cấu hình chuẩn bị cho module hóa đơn sau này.

## Kiểm chứng tại repository

Bộ kiểm thử bổ sung nằm tại `backend/test/residency.test.js` và `e2e/residency.spec.js`. Chạy `npm test`, `npm run test:e2e` và `npm run build` tại môi trường có Docker. Kiểm thử dùng database riêng `chung_cu_test`.
