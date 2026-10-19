# Thông báo và nhắc phí — code từng file cho VS Code

Bản tiếp theo sau `f1a1703` (danh sách tài khoản căn hộ và đăng nhập SĐT chủ hộ). Chép đủ **9 file** bên dưới, không cần tải ZIP hoặc cài dependency mới. Nếu chưa có bản tài khoản căn hộ, cập nhật [bản danh sách/đăng nhập](cap-nhat-danh-sach-tai-khoan-can-ho-vscode.md) trước. Các file đầy đủ bên dưới giữ các phần hóa đơn, VietQR, ngân hàng chọn sẵn và tài khoản căn đã có.

## Cách cập nhật

1. Dừng backend và frontend bằng Ctrl+C. Lưu riêng các thay đổi cá nhân trước khi thay file. Giữ `.env`, `.certs`, ảnh và database.
2. Tạo các file mới theo đường dẫn, thay **toàn bộ** nội dung các file đã có bằng code tương ứng. Chỉ chép phần mã bên trong từng khối, bỏ dòng mở/đóng khối mã.
3. Mở PowerShell ở thư mục gốc dự án rồi chạy:

```powershell
npm run db:migrate
npm run dev:backend
```

Migration mới là **009_announcements.sql**; giữ nguyên 001–008, không xóa volume/database, không chạy lại seed để sửa lỗi. Migration không tạo/gửi thông báo thật. Nếu lỗi SQL giữa chừng, giữ thông báo lỗi để xử lý các bảng đã tạo trước khi chạy lại.

4. Terminal thứ hai:

```powershell
npm run dev:frontend:https
```

Dùng cấu hình HTTPS/chứng chỉ hiện có khi thử camera điện thoại. Sau khi backend/frontend khởi động, tải lại trang.

## Chức năng mới

- BQL có mục **Thông báo**: soạn bản nháp, chọn toàn chung cư/khối/một căn, mức độ bình thường/quan trọng, tìm/lọc/phân trang. Lưu bản nháp rồi phát hành bản đã lưu. Bản đã phát hành chỉ thu hồi kèm lý do, không sửa nội dung. Lịch sử BQL được giữ.
- Cư dân có **Thông báo**, số chưa đọc, bộ lọc chưa đọc, trang chi tiết tự đánh dấu đã đọc qua request riêng. GET API không tự đánh dấu. Nếu ghi trạng thái đọc lỗi có nút thử lại.
- BQL mở hóa đơn **Đã gửi**, bấm **Nhắc thanh toán trên web**. Server lấy đúng kỳ, số tiền, hạn và liên kết hóa đơn. Bấm lại/đồng thời không tạo thêm; tối đa một nhắc/hóa đơn/ngày Việt Nam. Thu hồi nhắc hôm nay cũng không cho tạo lại nhắc cùng hóa đơn trong hôm đó.
- Thông báo chung theo căn/cư trú hiện tại. Người mới có thể đọc thông báo còn phát hành dành cho căn; chuyển đi không xem căn cũ. Tài khoản căn và tài khoản cá nhân của người đang phụ trách mới được nhận nhắc phí. Cá nhân chỉ nhận kỳ có quyền xem theo ngày nhập cư; dùng tài khoản căn để đối soát sổ hóa đơn trước ngày nhập cư.
- Khi bàn giao tài khoản căn cho chủ hộ khác, trạng thái đã đọc tách theo người mới, phiên cũ mất quyền. Tài khoản cá nhân của người cũ mất nhắc phí khi không còn phụ trách, dù vẫn ở cùng căn.
- Hóa đơn đã thanh toán vẫn có lịch sử nhắc để xem, nhưng không tính chưa đọc. Hóa đơn hủy ẩn nhắc khỏi cư dân. Nhắc không tự ghi nhận tiền hoặc đổi tổng hóa đơn.

Đây là thông báo **trên web**, BQL chủ động gửi; chưa có lịch tự động, SMS, email hay thông báo đẩy. Số chưa đọc cập nhật khi đổi trang, quay lại tab và mỗi 60 giây khi mở web. Hộp cá nhân cần liên kết tài khoản với hồ sơ cư dân và đợt cư trú; tài khoản demo chưa liên kết sẽ chưa có thông báo.

## 1. `database/migrations/009_announcements.sql`

Tạo file mới.

```sql
CREATE TABLE thong_bao (
  ma_thong_bao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  loai ENUM('THONG_BAO','NHAC_PHI') NOT NULL DEFAULT 'THONG_BAO',
  tieu_de VARCHAR(160) NOT NULL,
  noi_dung TEXT NOT NULL,
  pham_vi ENUM('TOAN_BO','KHOI','CAN_HO') NOT NULL,
  khoi VARCHAR(10) NULL,
  ma_can_ho INT UNSIGNED NULL,
  muc_do ENUM('THUONG','QUAN_TRONG') NOT NULL DEFAULT 'THUONG',
  trang_thai ENUM('NHAP','DA_GUI','THU_HOI') NOT NULL DEFAULT 'NHAP',
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ma_hoa_don INT UNSIGNED NULL,
  ngay_nhac DATE NULL,
  ma_nguoi_tao INT UNSIGNED NOT NULL,
  ma_nguoi_gui INT UNSIGNED NULL,
  ma_nguoi_thu_hoi INT UNSIGNED NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  ngay_gui DATETIME(6) NULL,
  ngay_thu_hoi DATETIME(6) NULL,
  ly_do_thu_hoi VARCHAR(255) NULL,
  FOREIGN KEY (ma_can_ho) REFERENCES can_ho(ma_can_ho),
  FOREIGN KEY (ma_hoa_don) REFERENCES hoa_don(ma_hoa_don),
  FOREIGN KEY (ma_nguoi_tao) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_nguoi_gui) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_nguoi_thu_hoi) REFERENCES nguoi_dung(ma_nguoi_dung),
  UNIQUE KEY uq_bill_reminder_day (ma_hoa_don,ngay_nhac),
  INDEX idx_announcement_inbox (trang_thai,ngay_gui,ma_thong_bao),
  CHECK ((pham_vi='TOAN_BO' AND khoi IS NULL AND ma_can_ho IS NULL) OR
         (pham_vi='KHOI' AND khoi IS NOT NULL AND ma_can_ho IS NULL) OR
         (pham_vi='CAN_HO' AND khoi IS NULL AND ma_can_ho IS NOT NULL)),
  CHECK ((loai='THONG_BAO' AND ma_hoa_don IS NULL AND ngay_nhac IS NULL) OR
         (loai='NHAC_PHI' AND ma_hoa_don IS NOT NULL AND ngay_nhac IS NOT NULL AND pham_vi='CAN_HO'))
) ENGINE=InnoDB;
CREATE TABLE thong_bao_da_doc (
  ma_thong_bao INT UNSIGNED NOT NULL,
  ma_nguoi_dung INT UNSIGNED NOT NULL,
  -- Snapshot scope, deliberately not a resident FK: no reverse resident lock.
  nguoi_tiep_nhan INT UNSIGNED NOT NULL DEFAULT 0,
  ngay_doc DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (ma_thong_bao,ma_nguoi_dung,nguoi_tiep_nhan),
  FOREIGN KEY (ma_thong_bao) REFERENCES thong_bao(ma_thong_bao) ON DELETE CASCADE,
  FOREIGN KEY (ma_nguoi_dung) REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE lich_su_thong_bao (
  ma_lich_su INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_thong_bao INT UNSIGNED NOT NULL,
  ma_nguoi_thuc_hien INT UNSIGNED NOT NULL,
  su_kien VARCHAR(30) NOT NULL,
  ghi_chu VARCHAR(255) NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (ma_thong_bao) REFERENCES thong_bao(ma_thong_bao) ON DELETE CASCADE,
  FOREIGN KEY (ma_nguoi_thuc_hien) REFERENCES nguoi_dung(ma_nguoi_dung),
  INDEX idx_announcement_history (ma_thong_bao,ma_lich_su)
) ENGINE=InnoDB;
```

## 2. `backend/src/modules/announcements/announcements.service.js`

Tạo file mới.

```js
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, integer, text } from "../../lib/http.js";
import { pagination, today } from "../billing/billing.validation.js";
import { lockApartment } from "../billing/billing.guards.js";

const missing = () => fail(404, "NOT_FOUND", "Không tìm thấy thông báo.");
function checkVersion(row, value) {
  if (row.phien_ban !== integer(value, "phien_ban"))
    fail(409, "STALE_VERSION", "Thông báo đã thay đổi. Hãy tải lại trang.");
}
async function audit(db, id, actor, event, note = null) {
  await rows(
    db,
    "INSERT INTO lich_su_thong_bao (ma_thong_bao,ma_nguoi_thuc_hien,su_kien,ghi_chu) VALUES (?,?,?,?)",
    [id, actor.ma_nguoi_dung, event, note],
  );
}
function content(body) {
  const scope = choice(body.pham_vi, "pham_vi", ["TOAN_BO", "KHOI", "CAN_HO"]);
  return [
    text(body.tieu_de, "tieu_de", 3, 160),
    text(body.noi_dung, "noi_dung", 3, 6000),
    scope,
    scope === "KHOI" ? text(body.khoi, "khoi", 1, 10) : null,
    scope === "CAN_HO" ? integer(body.ma_can_ho, "ma_can_ho") : null,
    choice(body.muc_do, "muc_do", ["THUONG", "QUAN_TRONG"]),
  ];
}
async function validateTarget(db, fields) {
  if (fields[2] === "CAN_HO") await lockApartment(db, fields[4]);
  if (fields[2] === "KHOI") {
    const result = await rows(
      db,
      "SELECT ma_can_ho FROM can_ho WHERE khoi=? LIMIT 1",
      [fields[3]],
    );
    if (!result.length)
      fail(422, "INVALID_BLOCK", "Chưa có căn hộ thuộc khối đã chọn.");
  }
}
export async function create(body, actor) {
  const fields = content(body);
  return transaction(async (db) => {
    await validateTarget(db, fields);
    const result = await rows(
      db,
      "INSERT INTO thong_bao (tieu_de,noi_dung,pham_vi,khoi,ma_can_ho,muc_do,ma_nguoi_tao) VALUES (?,?,?,?,?,?,?)",
      [...fields, actor.ma_nguoi_dung],
    );
    await audit(db, result.insertId, actor, "TAO_NHAP");
    return { ma_thong_bao: result.insertId };
  });
}
export async function change(id, action, body, actor) {
  // Target validation precedes notification lock, matching apartment -> bill -> notification order.
  const fields = action === "sua" ? content(body) : null;
  return transaction(async (db) => {
    if (fields) await validateTarget(db, fields);
    const [n] = await rows(
      db,
      "SELECT * FROM thong_bao WHERE ma_thong_bao=? FOR UPDATE",
      [id],
    );
    if (!n) missing();
    checkVersion(n, body.phien_ban);
    if (action === "thu_hoi") {
      if (n.trang_thai === "THU_HOI")
        fail(409, "INVALID_STATE", "Thông báo đã được thu hồi.");
      const reason = text(body.ly_do, "ly_do", 3, 255);
      await rows(
        db,
        "UPDATE thong_bao SET trang_thai='THU_HOI',ma_nguoi_thu_hoi=?,ngay_thu_hoi=UTC_TIMESTAMP(6),ly_do_thu_hoi=?,phien_ban=phien_ban+1 WHERE ma_thong_bao=?",
        [actor.ma_nguoi_dung, reason, id],
      );
      await audit(db, id, actor, "THU_HOI", reason);
    } else {
      if (n.trang_thai !== "NHAP" || n.loai !== "THONG_BAO")
        fail(
          409,
          "INVALID_STATE",
          "Chỉ sửa hoặc phát hành thông báo đang ở bản nháp.",
        );
      if (action === "sua") {
        await rows(
          db,
          "UPDATE thong_bao SET tieu_de=?,noi_dung=?,pham_vi=?,khoi=?,ma_can_ho=?,muc_do=?,phien_ban=phien_ban+1 WHERE ma_thong_bao=?",
          [...fields, id],
        );
        await audit(db, id, actor, "SUA_NHAP");
      } else {
        await rows(
          db,
          "UPDATE thong_bao SET trang_thai='DA_GUI',ma_nguoi_gui=?,ngay_gui=UTC_TIMESTAMP(6),phien_ban=phien_ban+1 WHERE ma_thong_bao=?",
          [actor.ma_nguoi_dung, id],
        );
        await audit(db, id, actor, "PHAT_HANH");
      }
    }
    return { ma_thong_bao: id };
  });
}
const adminFrom =
  "FROM thong_bao n LEFT JOIN can_ho a ON a.ma_can_ho=n.ma_can_ho LEFT JOIN hoa_don h ON h.ma_hoa_don=n.ma_hoa_don";
// Evaluate residence, custody, token version and read scope together, on every query.
const inboxFrom = `FROM thong_bao n
 JOIN nguoi_dung u ON u.ma_nguoi_dung=? AND u.dang_hoat_dong=1 AND u.phien_ban_token=?
 LEFT JOIN cu_dan c ON c.ma_nguoi_dung=u.ma_nguoi_dung
 LEFT JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan AND l.den_ngay IS NULL
 JOIN can_ho a ON a.ma_can_ho=COALESCE(u.ma_can_ho_thanh_toan,l.ma_can_ho)
 LEFT JOIN nguoi_dung payer ON payer.ma_can_ho_thanh_toan=a.ma_can_ho
 LEFT JOIN hoa_don h ON h.ma_hoa_don=n.ma_hoa_don
 LEFT JOIN thong_bao_da_doc r ON r.ma_thong_bao=n.ma_thong_bao AND r.ma_nguoi_dung=u.ma_nguoi_dung
 AND r.nguoi_tiep_nhan=IF(u.ma_can_ho_thanh_toan IS NULL,0,COALESCE(u.ma_cu_dan_phu_trach,0))`;
const visible = `n.trang_thai='DA_GUI'
 AND (n.pham_vi='TOAN_BO' OR (n.pham_vi='KHOI' AND n.khoi=a.khoi) OR (n.pham_vi='CAN_HO' AND n.ma_can_ho=a.ma_can_ho))
 AND (n.loai='THONG_BAO' OR ((payer.ma_nguoi_dung=u.ma_nguoi_dung OR (payer.ma_cu_dan_phu_trach=c.ma_cu_dan AND l.tu_ngay<=h.ngay_chot_phi)) AND h.trang_thai IN ('DA_GUI','DA_THANH_TOAN')))`;
const unread =
  "r.ma_thong_bao IS NULL AND (n.loai='THONG_BAO' OR h.trang_thai='DA_GUI')";
const select = `n.ma_thong_bao,n.loai,n.tieu_de,n.pham_vi,n.khoi,n.ma_can_ho,n.muc_do,n.trang_thai,n.phien_ban,n.ngay_tao,n.ngay_gui,n.ma_hoa_don,h.trang_thai AS trang_thai_hoa_don,a.so_can_ho`;
const receiptSelect = `r.ngay_doc,(${unread}) AS chua_doc`;
export async function list(query, actor, personal = false) {
  const { page, offset } = pagination(query),
    args = personal ? [actor.ma_nguoi_dung, actor.phien_ban_token] : [],
    clauses = [personal ? visible : "1=1"];
  if (query.q) {
    clauses.push("n.tieu_de LIKE ?");
    args.push(`%${text(query.q, "q", 1, 100)}%`);
  }
  if (query.loai) {
    clauses.push("n.loai=?");
    args.push(choice(query.loai, "loai", ["THONG_BAO", "NHAC_PHI"]));
  }
  if (!personal && query.trang_thai) {
    clauses.push("n.trang_thai=?");
    args.push(
      choice(query.trang_thai, "trang_thai", ["NHAP", "DA_GUI", "THU_HOI"]),
    );
  }
  if (personal && query.chua_doc === "1") clauses.push(unread);
  const from = personal ? inboxFrom : adminFrom,
    where = clauses.join(" AND ");
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total ${from} WHERE ${where}`,
    args,
  );
  const data = await rows(
    pool,
    `SELECT ${select},LEFT(n.noi_dung,180) AS tom_tat${personal ? `,${receiptSelect}` : ""} ${from} WHERE ${where} ORDER BY COALESCE(n.ngay_gui,n.ngay_tao) DESC,n.ma_thong_bao DESC LIMIT 20 OFFSET ${offset}`,
    args,
  );
  return { data, total: count.total, page };
}
export async function unreadCount(actor) {
  const [result] = await rows(
    pool,
    `SELECT COUNT(*) AS so_chua_doc ${inboxFrom} WHERE ${visible} AND ${unread}`,
    [actor.ma_nguoi_dung, actor.phien_ban_token],
  );
  return result;
}
export async function detail(id, actor, personal = false) {
  const [n] = await rows(
    pool,
    `SELECT ${select},n.noi_dung,n.ly_do_thu_hoi,n.ngay_thu_hoi${personal ? `,${receiptSelect}` : ""} ${personal ? inboxFrom : adminFrom} WHERE n.ma_thong_bao=?${personal ? ` AND ${visible}` : ""}`,
    personal ? [actor.ma_nguoi_dung, actor.phien_ban_token, id] : [id],
  );
  if (!n) missing();
  if (!personal)
    n.history = await rows(
      pool,
      "SELECT s.*,u.ho_va_ten FROM lich_su_thong_bao s JOIN nguoi_dung u ON u.ma_nguoi_dung=s.ma_nguoi_thuc_hien WHERE s.ma_thong_bao=? ORDER BY s.ma_lich_su",
      [id],
    );
  return n;
}
export async function markRead(id, actor) {
  return transaction(async (db) => {
    // Freeze this account's recipient scope while inserting its receipt.
    const [u] = await rows(
      db,
      "SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_nguoi_dung=? AND dang_hoat_dong=1 AND phien_ban_token=? FOR UPDATE",
      [actor.ma_nguoi_dung, actor.phien_ban_token],
    );
    if (!u)
      fail(401, "SESSION_EXPIRED", "Phiên đã hết hạn. Vui lòng đăng nhập lại.");
    const [n] = await rows(
      db,
      `SELECT IF(u.ma_can_ho_thanh_toan IS NULL,0,COALESCE(u.ma_cu_dan_phu_trach,0)) AS recipient ${inboxFrom} WHERE n.ma_thong_bao=? AND ${visible}`,
      [actor.ma_nguoi_dung, actor.phien_ban_token, id],
    );
    if (!n) missing();
    await rows(
      db,
      "INSERT IGNORE INTO thong_bao_da_doc (ma_thong_bao,ma_nguoi_dung,nguoi_tiep_nhan) VALUES (?,?,?)",
      [id, actor.ma_nguoi_dung, n.recipient],
    );
    return { ma_thong_bao: id, da_doc: true };
  });
}
export async function remindBill(id, body, actor) {
  return transaction(async (db) => {
    const [hint] = await rows(
      db,
      "SELECT ma_can_ho FROM hoa_don WHERE ma_hoa_don=?",
      [id],
    );
    if (!hint) fail(404, "NOT_FOUND", "Không tìm thấy hóa đơn.");
    const apartment = await lockApartment(db, hint.ma_can_ho);
    const [b] = await rows(
      db,
      "SELECT * FROM hoa_don WHERE ma_hoa_don=? FOR UPDATE",
      [id],
    );
    if (b.trang_thai !== "DA_GUI")
      fail(
        409,
        "INVALID_STATE",
        "Chỉ nhắc phí hóa đơn đã gửi và chưa thanh toán.",
      );
    if (b.phien_ban !== integer(body.phien_ban, "phien_ban"))
      fail(409, "STALE_VERSION", "Hóa đơn đã thay đổi. Hãy tải lại.");
    const day = today();
    const [existing] = await rows(
      db,
      "SELECT ma_thong_bao FROM thong_bao WHERE ma_hoa_don=? AND ngay_nhac=? FOR UPDATE",
      [id, day],
    );
    if (existing) return { ...existing, da_ton_tai: true };
    const title = `Nhắc thanh toán hóa đơn ${b.so_hoa_don}`;
    const bodyText = `Căn ${apartment.so_can_ho} · Kỳ ${b.ky_thanh_toan}\nSố tiền cần thanh toán: ${BigInt(b.tong_tien).toLocaleString("vi-VN")} đồng.\nHạn thanh toán: ${b.han_thanh_toan}.\nVui lòng mở hóa đơn để kiểm tra thông tin và mã QR chuyển khoản. Nếu đã chuyển tiền, hãy liên hệ ban quản lý để đối soát.`;
    const result = await rows(
      db,
      "INSERT INTO thong_bao (loai,tieu_de,noi_dung,pham_vi,ma_can_ho,muc_do,trang_thai,ma_hoa_don,ngay_nhac,ma_nguoi_tao,ma_nguoi_gui,ngay_gui) VALUES ('NHAC_PHI',?,?,'CAN_HO',?,'QUAN_TRONG','DA_GUI',?,?,?,?,UTC_TIMESTAMP(6))",
      [
        title,
        bodyText,
        b.ma_can_ho,
        id,
        day,
        actor.ma_nguoi_dung,
        actor.ma_nguoi_dung,
      ],
    );
    await audit(db, result.insertId, actor, "NHAC_PHI", b.so_hoa_don);
    return { ma_thong_bao: result.insertId, da_ton_tai: false };
  });
}
```

## 3. `backend/src/modules/announcements/announcements.routes.js`

Tạo file mới.

```js
import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./announcements.service.js";
export const announcementsRouter = Router(),
  selfAnnouncementsRouter = Router();
announcementsRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
selfAnnouncementsRouter.use(optionalAuth, requireAuth, roles("CU_DAN"));
selfAnnouncementsRouter.get("/chua_doc", async (req, res) =>
  res.json({ data: await service.unreadCount(req.user) }),
);
for (const [router, personal] of [
  [announcementsRouter, false],
  [selfAnnouncementsRouter, true],
]) {
  router.get("/", async (req, res) =>
    res.json(await service.list(req.query, req.user, personal)),
  );
  router.get("/:id", async (req, res) =>
    res.json({
      data: await service.detail(
        integer(req.params.id, "id"),
        req.user,
        personal,
      ),
    }),
  );
}
announcementsRouter.post("/", async (req, res) =>
  res.status(201).json({ data: await service.create(req.body, req.user) }),
);
announcementsRouter.put("/:id", async (req, res) =>
  res.json({
    data: await service.change(
      integer(req.params.id, "id"),
      "sua",
      req.body,
      req.user,
    ),
  }),
);
for (const action of ["phat_hanh", "thu_hoi"])
  announcementsRouter.post(`/:id/${action}`, async (req, res) =>
    res.json({
      data: await service.change(
        integer(req.params.id, "id"),
        action,
        req.body,
        req.user,
      ),
    }),
  );
selfAnnouncementsRouter.post("/:id/da_doc", async (req, res) =>
  res.json({
    data: await service.markRead(integer(req.params.id, "id"), req.user),
  }),
);
```

## 4. `backend/src/modules/billing/billing.routes.js`

Thay toàn bộ nội dung file.

```js
import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./billing.service.js";
import { remindBill } from "../announcements/announcements.service.js";
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

billsRouter.post("/:id/nhac_phi", async (req, res) =>
  res.json({
    data: await remindBill(integer(req.params.id, "id"), req.body, req.user),
  }),
);
```

## 5. `backend/src/app.js`

Thay toàn bộ nội dung file.

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
      "SELECT name FROM schema_migrations WHERE name IN (?,?,?,?,?,?,?,?,?)",
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
      ],
    );
    if (migrations.length !== 9) throw new Error("Schema not initialized");
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

## 6. `frontend/src/features/announcements/Announcements.jsx`

Tạo file mới.

```jsx
import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../auth/Auth.jsx";
import { getJson } from "../../shared/api/client.js";
import {
  date,
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";

const states = {
  NHAP: "Bản nháp",
  DA_GUI: "Đã phát hành",
  THU_HOI: "Đã thu hồi",
};
const scopes = {
  TOAN_BO: "Toàn chung cư",
  KHOI: "Theo khối",
  CAN_HO: "Một căn hộ",
};
const levels = { THUONG: "Bình thường", QUAN_TRONG: "Quan trọng" };
const types = { THONG_BAO: "Thông báo chung", NHAC_PHI: "Nhắc thanh toán" };
const events = {
  TAO_NHAP: "Tạo bản nháp",
  SUA_NHAP: "Sửa bản nháp",
  PHAT_HANH: "Phát hành",
  THU_HOI: "Thu hồi",
  NHAC_PHI: "Nhắc thanh toán",
};
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
const changed = () => window.dispatchEvent(new Event("notifications:changed"));

export function useUnreadCount(user, pathname) {
  const [result, setResult] = useState({ key: "", count: 0 });
  const key =
    user?.vai_tro === "CU_DAN"
      ? `${user.ma_nguoi_dung}:${user.phien_ban_token}`
      : "";
  useEffect(() => {
    if (!key) return;
    let active = true,
      sequence = 0;
    const controller = new AbortController();
    async function refresh() {
      const run = ++sequence;
      try {
        const r = await getJson("/cua_toi/thong_bao/chua_doc", {
          signal: controller.signal,
        });
        if (active && sequence === run)
          setResult({ key, count: r.data.so_chua_doc });
      } catch {
        if (active && sequence === run) setResult({ key, count: 0 });
      }
    }
    refresh();
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    window.addEventListener("notifications:changed", refresh);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("notifications:changed", refresh);
    };
  }, [key, pathname]);
  return key && result.key === key ? result.count : 0;
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
      setNotice("Đã lưu thông báo.");
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
function Target({ initial }) {
  const [scope, setScope] = useState(initial?.pham_vi || "TOAN_BO"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(String(initial?.ma_can_ho || ""));
  const apartments = useResource(`/can_ho?q=${encodeURIComponent(query)}`);
  const matches = apartments.result?.data || [];
  return (
    <>
      <Field label="Phạm vi nhận">
        <select
          name="pham_vi"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        >
          <Options values={scopes} />
        </select>
      </Field>
      {scope === "KHOI" && (
        <Field
          label="Khối nhận thông báo"
          name="khoi"
          required
          maxLength={10}
          defaultValue={initial?.khoi || ""}
          placeholder="Ví dụ A"
        />
      )}
      {scope === "CAN_HO" && (
        <>
          <Field label="Tìm căn hộ nhận thông báo">
            <input
              value={query}
              maxLength={100}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Field>
          <ErrorBox error={apartments.error} />
          <Field label="Căn hộ nhận thông báo">
            <select
              name="ma_can_ho"
              required
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Chọn căn hộ</option>
              {selected &&
                !matches.some((a) => String(a.ma_can_ho) === selected) && (
                  <option value={selected}>
                    {initial?.so_can_ho || `Căn đã chọn #${selected}`}
                  </option>
                )}
              {matches.map((a) => (
                <option key={a.ma_can_ho} value={a.ma_can_ho}>
                  {a.so_can_ho} · Khối {a.khoi}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}
    </>
  );
}
function Editor({ initial, action, onSave }) {
  return (
    <form
      key={initial?.phien_ban ?? "new"}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(values(e));
      }}
    >
      <fieldset disabled={action.pending}>
        <Field
          label="Tiêu đề thông báo"
          name="tieu_de"
          required
          minLength={3}
          maxLength={160}
          defaultValue={initial?.tieu_de || ""}
        />
        <Field label="Nội dung thông báo">
          <textarea
            name="noi_dung"
            rows={7}
            required
            minLength={3}
            maxLength={6000}
            defaultValue={initial?.noi_dung || ""}
          />
        </Field>
        <Target initial={initial} />
        <Field label="Mức độ">
          <select name="muc_do" defaultValue={initial?.muc_do || "THUONG"}>
            <Options values={levels} />
          </select>
        </Field>
        <button className="primary">
          {initial ? "Lưu bản nháp" : "Tạo bản nháp"}
        </button>
      </fieldset>
    </form>
  );
}
function Meta({ item, admin }) {
  return (
    <div className="notification-meta">
      <span className={`notification-priority priority-${item.muc_do}`}>
        {levels[item.muc_do]}
      </span>
      <span>{types[item.loai]}</span>
      {admin ? (
        <>
          <span>{states[item.trang_thai]}</span>
          <span>
            {scopes[item.pham_vi]}
            {item.pham_vi === "KHOI"
              ? ` ${item.khoi}`
              : item.pham_vi === "CAN_HO"
                ? ` ${item.so_can_ho}`
                : ""}
          </span>
        </>
      ) : (
        <span>
          {item.chua_doc ? "Chưa đọc" : item.ngay_doc ? "Đã đọc" : "Đã xử lý"}
        </span>
      )}
      <time>{date(item.ngay_gui || item.ngay_tao)}</time>
      {item.trang_thai_hoa_don === "DA_THANH_TOAN" && (
        <span className="badge">Đã thanh toán</span>
      )}
    </div>
  );
}
export function Announcements() {
  const { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri/thong-bao" : "/cu-dan/thong-bao",
    api = admin ? "/thong_bao" : "/cua_toi/thong_bao";
  const [params, setParams] = useSearchParams(),
    resource = useResource(`${api}?${params}`),
    [adding, setAdding] = useState(false),
    action = useAction(),
    navigate = useNavigate();
  const page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(page) {
    const next = new URLSearchParams(params);
    next.set("page", page);
    setParams(next);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Kết nối cư dân</p>
          <h1>{admin ? "Thông báo và nhắc phí" : "Thông báo của tôi"}</h1>
        </div>
        {admin && (
          <button className="primary" onClick={() => setAdding(!adding)}>
            {adding ? "Đóng biểu mẫu" : "Soạn thông báo"}
          </button>
        )}
      </div>
      <p className="muted">
        {admin
          ? "Thông báo xuất hiện trên web sau khi phát hành. Nhắc phí tại chi tiết hóa đơn đã gửi, tối đa một lần mỗi ngày cho mỗi hóa đơn."
          : "Thông báo dành cho căn hộ hiện tại. Nhắc phí chỉ dành cho tài khoản căn hộ và người phụ trách thanh toán."}
      </p>
      <Feedback action={action} />
      {adding && (
        <section className="card narrow">
          <h2>Soạn thông báo</h2>
          <Editor
            action={action}
            onSave={(body) =>
              action.run(api, "POST", body, (n) =>
                navigate(`${base}/${n.ma_thong_bao}`),
              )
            }
          />
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
          label="Tìm thông báo"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field label="Loại thông báo">
          <select name="loai" defaultValue={params.get("loai") || ""}>
            <Options values={types} empty="Tất cả" />
          </select>
        </Field>
        {admin ? (
          <Field label="Trạng thái thông báo">
            <select
              name="trang_thai"
              defaultValue={params.get("trang_thai") || ""}
            >
              <Options values={states} empty="Tất cả" />
            </select>
          </Field>
        ) : (
          <Field label="Trạng thái đọc">
            <select name="chua_doc" defaultValue={params.get("chua_doc") || ""}>
              <option value="">Tất cả</option>
              <option value="1">Chưa đọc</option>
            </select>
          </Field>
        )}
        <button>Lọc thông báo</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section
        className="card notification-inbox"
        aria-label="Danh sách thông báo"
      >
        {resource.result?.data.map((n) => (
          <article
            key={n.ma_thong_bao}
            className={`notification-item ${n.chua_doc ? "is-unread" : ""}`}
          >
            <Meta item={n} admin={admin} />
            <h2>
              <Link to={`${base}/${n.ma_thong_bao}`}>{n.tieu_de}</Link>
            </h2>
            <p>{n.tom_tat}</p>
          </article>
        ))}
        {resource.result?.total === 0 && <p>Chưa có thông báo phù hợp.</p>}
        <div className="actions">
          <button
            disabled={resource.loading || page <= 1}
            onClick={() => go(page - 1)}
          >
            Trang trước
          </button>
          <span>
            Trang {page} · {total} thông báo
          </span>
          <button
            disabled={resource.loading || page * 20 >= total}
            onClick={() => go(page + 1)}
          >
            Trang sau
          </button>
        </div>
      </section>
    </>
  );
}
export function AnnouncementDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri/thong-bao" : "/cu-dan/thong-bao",
    api = admin ? "/thong_bao" : "/cua_toi/thong_bao";
  const resource = useResource(`${api}/${id}`),
    n = resource.result?.data,
    action = useAction(resource.reload),
    [read, setRead] = useState(false),
    [readError, setReadError] = useState(null),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    if (admin || !n) return;
    let active = true;
    setRead(false);
    setReadError(null);
    getJson(`${api}/${id}/da_doc`, { method: "POST", body: {} })
      .then(() => {
        if (active) {
          setRead(true);
          changed();
        }
      })
      .catch((e) => {
        if (active) setReadError(e);
      });
    return () => {
      active = false;
    };
  }, [admin, api, id, n, retry]);
  const run = (name, body = {}) =>
    action.run(`${api}/${id}${name ? `/${name}` : ""}`, name ? "POST" : "PUT", {
      ...body,
      phien_ban: n.phien_ban,
    });
  return (
    <>
      <Link to={base}>← Danh sách thông báo</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Feedback action={action} />
      <ErrorBox error={readError} />
      {readError && (
        <button onClick={() => setRetry((x) => x + 1)}>
          Thử đánh dấu đã đọc
        </button>
      )}
      {n && (
        <>
          <section className="card notification-detail">
            <Meta
              item={read ? { ...n, chua_doc: 0, ngay_doc: n.ngay_gui } : n}
              admin={admin}
            />
            <h1>{n.tieu_de}</h1>
            <div className="notification-body">{n.noi_dung}</div>
            {n.ma_hoa_don && (
              <div className="notification-bill">
                <p>
                  {n.trang_thai_hoa_don === "DA_THANH_TOAN"
                    ? "Hóa đơn đã được xác nhận thanh toán."
                    : n.trang_thai_hoa_don === "HUY"
                      ? "Hóa đơn đã hủy."
                      : "Kiểm tra chi tiết hóa đơn và mã QR trước khi chuyển tiền."}
                </p>
                <Link
                  className="button primary"
                  to={`${admin ? "/quan-tri" : "/cu-dan"}/hoa-don/${n.ma_hoa_don}`}
                >
                  Xem hóa đơn
                </Link>
              </div>
            )}
            {n.ly_do_thu_hoi && (
              <p className="note">Lý do thu hồi: {n.ly_do_thu_hoi}</p>
            )}
          </section>
          {admin && n.trang_thai === "NHAP" && (
            <section className="card narrow">
              <h2>Chỉnh sửa bản nháp</h2>
              <Editor
                initial={n}
                action={action}
                onSave={(body) => run("", body)}
              />
              <p className="muted">
                Kiểm tra và lưu nội dung trước khi phát hành. Thông báo đã phát
                hành chỉ có thể thu hồi.
              </p>
              <button
                className="primary"
                disabled={action.pending}
                onClick={() => run("phat_hanh")}
              >
                Phát hành thông báo đã lưu
              </button>
            </section>
          )}
          {admin && n.trang_thai !== "THU_HOI" && (
            <section className="card narrow">
              <h2>Thu hồi thông báo</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run("thu_hoi", values(e));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Lý do thu hồi"
                    name="ly_do"
                    required
                    minLength={3}
                    maxLength={255}
                  />
                  <button>Thu hồi thông báo</button>
                </fieldset>
              </form>
            </section>
          )}
          {admin && (
            <section className="card">
              <h2>Lịch sử thông báo</h2>
              <ul>
                {n.history.map((h) => (
                  <li key={h.ma_lich_su}>
                    {date(h.ngay_tao)} · {events[h.su_kien] || h.su_kien} ·{" "}
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

## 7. `frontend/src/features/billing/Billing.jsx`

Thay toàn bộ nội dung file.

```jsx
import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import QRCode from "qrcode";
import { banks, bankName, bankSearch } from "./banks.js";
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
// Format API decimal strings without losing precision or displaying trailing zeros.
const number = (value) => {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(String(value ?? ""));
  if (!match) return "—";
  const fraction = (match[2] || "").replace(/0+$/, "");
  return `${BigInt(match[1]).toLocaleString("vi-VN")}${fraction ? `,${fraction}` : ""}`;
};
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
      setNotice(
        path.endsWith("/nhac_phi")
          ? r.data.da_ton_tai
            ? "Hóa đơn này đã được nhắc trên web hôm nay."
            : "Đã gửi nhắc thanh toán vào hộp thông báo trên web."
          : "Đã lưu thay đổi.",
      );
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
        Điện áp dụng biểu giá và thuế hiệu lực tại ngày chốt. Nếu cư dân trả
        trực tiếp cho EVN, không chọn BQL thu tiền điện. Phí xe theo số đăng ký
        hiệu lực tại ngày chốt, chưa chia theo ngày.
      </small>
    </div>
  );
}

export function Rates() {
  const [params, setParams] = useSearchParams(),
    resource = useResource(`/cau_hinh_phi?${params}`),
    action = useAction(resource.reload),
    [type, setType] = useState("PHI_QUAN_LY"),
    [method, setMethod] = useState("BAC_THANG"),
    [vat, setVat] = useState(""),
    [tiers, setTiers] = useState(
      [50, 100, 200, 300, 400, null].map((upper) => ({
        den_kwh: upper,
        don_gia: "",
      })),
    );
  function setTier(index, key, value) {
    setTiers((all) =>
      all.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  }
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
            const body = values(e);
            if (type === "TIEN_DIEN") {
              body.cach_tinh = method;
              body.thue_gtgt = vat;
              if (method === "BAC_THANG")
                body.bac_dien = tiers.map((r, i) => ({
                  den_kwh: i === tiers.length - 1 ? null : Number(r.den_kwh),
                  don_gia: r.don_gia,
                }));
            }
            action.run("/cau_hinh_phi", "POST", body, () => {
              form.reset();
              setType("PHI_QUAN_LY");
              setMethod("BAC_THANG");
              setVat("");
              setTiers(
                [50, 100, 200, 300, 400, null].map((upper) => ({
                  den_kwh: upper,
                  don_gia: "",
                })),
              );
            });
          }}
        >
          <fieldset disabled={action.pending}>
            <Field label="Loại phí">
              <select
                name="loai_phi"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <Options values={fees} />
              </select>
            </Field>
            {type === "TIEN_DIEN" && (
              <>
                <Field label="Cách tính điện">
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option value="BAC_THANG">Bậc thang lũy tiến</option>
                    <option value="DON_GIA">
                      Một đơn giá theo cấu hình thu điện
                    </option>
                  </select>
                </Field>
                <p>
                  Đối chiếu biểu giá, định mức và thuế áp dụng trước khi lưu.
                  Công tơ do EVN thu trực tiếp không đưa vào hóa đơn BQL.
                </p>
                <Field label="Thuế GTGT điện (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={vat}
                    onChange={(e) => setVat(e.target.value)}
                  />
                </Field>
                {method === "BAC_THANG" && (
                  <>
                    <p>
                      Nhập ngưỡng cộng dồn: 50, 100, 200... kWh. Điện vượt mỗi
                      ngưỡng được tính ở bậc tiếp theo.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTiers(
                          [50, 100, 200, 300, 400, null].map((upper, i) => ({
                            den_kwh: upper,
                            don_gia: String(
                              [1984, 2050, 2380, 2998, 3350, 3460][i],
                            ),
                          })),
                        );
                        setVat("8");
                      }}
                    >
                      Điền mẫu 6 bậc và thuế 8%
                    </button>
                    <small>
                      Mẫu theo số liệu tham khảo bạn cung cấp, chưa xác minh
                      hiệu lực; có thể sửa trước khi lưu.
                    </small>
                    {tiers.map((row, i) => (
                      <div className="form-grid" key={i}>
                        <Field label={`Bậc ${i + 1}: đến kWh`}>
                          {i === tiers.length - 1 ? (
                            <span>Không giới hạn</span>
                          ) : (
                            <input
                              type="number"
                              min="1"
                              max="999999999"
                              step="1"
                              required
                              value={row.den_kwh ?? ""}
                              onChange={(e) =>
                                setTier(i, "den_kwh", e.target.value)
                              }
                            />
                          )}
                        </Field>
                        <Field label={`Đơn giá bậc ${i + 1} (đồng/kWh)`}>
                          <input
                            type="number"
                            min="0"
                            max="9999999999.99"
                            step="0.01"
                            required
                            value={row.don_gia}
                            onChange={(e) =>
                              setTier(i, "don_gia", e.target.value)
                            }
                          />
                        </Field>
                      </div>
                    ))}
                    <div className="actions">
                      <button
                        type="button"
                        disabled={tiers.length >= 12}
                        onClick={() =>
                          setTiers((all) => [
                            ...all.slice(0, -1),
                            { den_kwh: "", don_gia: "" },
                            all.at(-1),
                          ])
                        }
                      >
                        Thêm bậc
                      </button>
                      <button
                        type="button"
                        disabled={tiers.length <= 2}
                        onClick={() =>
                          setTiers((all) => [...all.slice(0, -2), all.at(-1)])
                        }
                      >
                        Bớt bậc
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
            {(type !== "TIEN_DIEN" || method === "DON_GIA") && (
              <Field
                label="Đơn giá (đồng/đơn vị)"
                name="don_gia"
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
                required
              />
            )}
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
                  <td>
                    {r.cach_tinh === "BAC_THANG" ? (
                      <details>
                        <summary>Biểu giá bậc thang</summary>
                        <ol>
                          {(typeof r.bac_dien === "string"
                            ? JSON.parse(r.bac_dien)
                            : r.bac_dien
                          ).map((tier, i) => (
                            <li key={i}>
                              Đến {tier.den_kwh ?? "không giới hạn"} kWh:{" "}
                              {number(tier.don_gia)} đ/kWh
                            </li>
                          ))}
                        </ol>
                      </details>
                    ) : (
                      number(r.don_gia)
                    )}
                    {r.loai_phi === "TIEN_DIEN" && (
                      <small> · Thuế GTGT {number(r.thue_gtgt)}%</small>
                    )}
                  </td>
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
                  <td>{number(r.chi_so_cu)}</td>
                  <td>{number(r.chi_so_moi)}</td>
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
function BankSelect() {
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState("");
  const matches = banks.filter((bank) =>
    bankSearch(`${bank.shortName} ${bank.name} ${bank.bin}`).includes(
      bankSearch(query),
    ),
  );
  const current = banks.find((bank) => bank.bin === selected);
  const option = (bank) => (
    <option key={bank.bin} value={bank.bin}>
      {bank.shortName} — {bank.name}
    </option>
  );
  return (
    <div className="bank-picker">
      <Field label="Tìm ngân hàng">
        <input
          type="search"
          value={query}
          maxLength={100}
          placeholder="Nhập tên ngân hàng, ví dụ Vietcombank"
          onChange={(e) => setQuery(e.target.value)}
        />
      </Field>
      <Field label="Ngân hàng nhận tiền">
        <select
          name="ma_ngan_hang"
          required
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Chọn ngân hàng</option>
          {current &&
            !matches.some((bank) => bank.bin === selected) &&
            option(current)}
          {matches.map(option)}
        </select>
      </Field>
      {!matches.length && (
        <p className="muted">
          Không tìm thấy ngân hàng. Hãy thử tên khác hoặc xóa từ khóa.
        </p>
      )}
      {current && (
        <p className="bank-selection">
          Đã chọn: <strong>{current.shortName}</strong>
        </p>
      )}
    </div>
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
    <section
      className="card payment-card"
      aria-label="Thông tin thanh toán hóa đơn"
    >
      <header className="payment-header">
        <span className="payment-status">Chờ thanh toán</span>
        <h2>Chuyển khoản bằng VietQR</h2>
        <p>
          Căn {bill.so_can_ho} · Kỳ {bill.ky_thanh_toan}
        </p>
      </header>
      <div className="payment-body">
        <p className="payment-amount-label">Số tiền cần thanh toán</p>
        <p className="payment-amount">{money(bill.tong_tien)}</p>
        <div className="payment-qr-frame">
          <span className="payment-qr-brand">VIETQR</span>
          {image ? (
            <img
              src={image}
              alt={`VietQR hóa đơn ${bill.so_hoa_don}`}
              width="320"
              height="320"
            />
          ) : (
            !error && <p role="status">Đang tạo mã QR…</p>
          )}
          <ErrorBox error={error} />
          <span className="payment-qr-caption">
            Quét mã bằng ứng dụng ngân hàng
          </span>
        </div>
        <dl className="payment-details">
          <div>
            <dt>Ngân hàng</dt>
            <dd>{bankName(bill.ma_ngan_hang)}</dd>
          </div>
          <div>
            <dt>Số tài khoản</dt>
            <dd className="payment-account">{bill.so_tai_khoan}</dd>
          </div>
          <div>
            <dt>Người nhận</dt>
            <dd>{bill.ten_nguoi_nhan}</dd>
          </div>
          <div className="payment-reference">
            <dt>Nội dung chuyển khoản</dt>
            <dd>{bill.so_hoa_don}</dd>
          </div>
          <div>
            <dt>Hạn thanh toán</dt>
            <dd>{bill.han_thanh_toan?.split("-").reverse().join("/")}</dd>
          </div>
        </dl>
        {image && (
          <a
            className="button payment-download"
            href={image}
            download={`VietQR-${bill.so_hoa_don}.png`}
          >
            Tải mã QR
          </a>
        )}
        <p className="payment-notice">
          Kiểm tra người nhận, số tiền và giữ đúng nội dung chuyển khoản. Ban
          quản lý sẽ xác nhận sau khi đối soát giao dịch.
        </p>
      </div>
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
          <p className="muted">
            Người phụ trách thanh toán hiện tại:{" "}
            <strong>
              {bill.nguoi_phu_trach_thanh_toan || "Chưa gắn chủ hộ"}
            </strong>
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
          <section className="card bill-lines">
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
                      <td className="bill-number">{number(l.so_luong)}</td>
                      <td>{l.don_vi_tinh}</td>
                      <td className="bill-number">{number(l.don_gia)} đ</td>
                      <td className="bill-number bill-line-total">
                        {money(l.thanh_tien)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 className="bill-total">Tổng cộng: {money(bill.tong_tien)}</h2>
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
            <section className="card narrow bill-publish">
              <h2>Gửi hóa đơn cho cư dân</h2>
              <p className="muted">
                Chọn ngân hàng và điền thông tin nhận tiền để tạo mã thanh toán
                cho hóa đơn.
              </p>
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
                  <BankSelect />
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
              <h2>Nhắc phí và xác nhận thu tiền</h2>
              <p className="muted">
                Gửi vào hộp thông báo của tài khoản căn hộ và người phụ trách
                thanh toán hiện tại. Mỗi hóa đơn được nhắc tối đa một lần trong
                ngày.
              </p>
              <button disabled={action.pending} onClick={() => run("nhac_phi")}>
                Nhắc thanh toán trên web
              </button>
              <h3>Xác nhận thu tiền</h3>
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

## 8. `frontend/src/app/App.jsx`

Thay toàn bộ nội dung file.

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
          ["/quan-tri/don-gia", "Đơn giá phí"],
          ["/quan-tri/chi-so", "Chỉ số điện nước"],
          ["/quan-tri/hoa-don", "Phí & hóa đơn"],
          ["/quan-tri/thong-bao", "Thông báo"],
          ["/quan-tri/vi-tri-qr", "Vị trí & QR"],
          ["/quan-tri/nhan-su", "Nhân sự & tài khoản"],
        ]
      : user?.vai_tro === "KY_THUAT_VIEN"
        ? [["/ky-thuat/cong-viec", "Công việc"]]
        : [
            ["/cu-dan/phan-anh", "Phản ánh của tôi"],
            ["/cu-dan/hoa-don", "Hóa đơn của tôi"],
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
              ["/quan-tri/don-gia", <Rates />],
              ["/quan-tri/chi-so", <Meters />],
              ["/quan-tri/hoa-don", <Bills />],
              ["/quan-tri/hoa-don/:id", <BillDetail />],
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

## 9. `frontend/src/styles/global.css`

Thay toàn bộ nội dung file.

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
```

## Thử sau khi cập nhật

1. Đăng nhập BQL → Thông báo → soạn nội dung, chọn một căn có chủ hộ đã nhận tài khoản. Tạo nháp, kiểm tra lại tiêu đề/phạm vi. Khi chưa phát hành, đăng nhập tài khoản căn bằng trình duyệt khác sẽ chưa thấy.
2. BQL phát hành → tài khoản căn tải lại **Thông báo**: thấy thông báo chưa đọc. Mở chi tiết, quay lại danh sách: số chưa đọc giảm. Thử bằng một căn khác: không thấy thông báo riêng căn đầu.
3. Mở hóa đơn Đã gửi của căn → nhắc thanh toán → cư dân vào Thông báo để mở hóa đơn/QR. BQL bấm nhắc lại trong ngày phải báo đã nhắc hôm nay.
4. BQL xác nhận thu sau khi đối soát → cư dân tải lại: nhắc phí hiện đã thanh toán và không còn trong số chưa đọc. Hủy một hóa đơn chưa thu khác: nhắc tương ứng không còn hiển thị.
5. Thử bàn giao tài khoản căn: phiên cũ phải hết hiệu lực; người mới dùng SĐT/mật khẩu được bàn giao và có trạng thái đọc riêng.

Kiểm tra tự động tại repository bằng `npm test`, `npm run test:e2e`, `npm run build`. Test dùng database riêng `chung_cu_test`; không chạy hai suite DB đồng thời. Các file kiểm thử không bắt buộc để chạy ứng dụng khi chép thủ công. API chi tiết xem [docs/api.md](api.md).

Kết quả kiểm tra bản này: **78/78 kiểm thử máy chủ**, **22/22 kiểm thử trình duyệt** và **build thành công**. Hai luồng thông báo mới được thử trên 1440 px và 375 px; các khối code ở trên đã được đối chiếu khớp đầy đủ với 9 file ứng dụng.
