# Liên kết thiết bị → QR → phản ánh — code từng file cho VS Code

Áp dụng sau bản Khối & tầng `fca264f` trên nhánh `codex/auth-qr-incidents`. **11 file chạy tính năng** (3 tạo mới, 8 thay toàn bộ), kèm 2 file kiểm thử tùy chọn. Có migration **018_equipment_qr.sql**; không thêm thư viện, không tải ZIP.

## Chức năng

Bản trong repository đã đạt **215 kiểm tra backend, 47 kịch bản E2E và build**; có kiểm thử ở 1440/375 px. Đã áp dụng và chạy lại migration 018 thành công. Kiểm thử tự động chưa thay việc thử camera trên điện thoại thật.

- **BQL → Vị trí & QR → Thêm vị trí:** chọn Loại vị trí = Thiết bị, tìm/chọn hồ sơ thiết bị theo mã/tên (có phân trang). Lựa chọn được giữ khi đổi trang/từ khóa. Vị trí khu vực không gán thiết bị. Vị trí thiết bị vẫn có thể chưa gán hồ sơ để tương thích các QR cũ.
- QR loại Thiết bị có nút **Liên kết thiết bị** để gán, đổi hoặc bỏ liên kết; cần kiểm tra thiết bị trên tem, xác nhận rồi lưu. Có lịch sử 20 lần đổi gần nhất, người thực hiện và mã tài sản trước/sau. Không tự gộp hoặc suy đoán theo tên.
- **Mã QR đã in giữ nguyên URL/token** khi chỉ đổi liên kết. Nút Thay mã vẫn thu hồi mã cũ như trước. Nếu tem có tên/mã thiết bị cũ, kiểm tra và thay phần nhãn tương ứng trước khi dùng cho thiết bị khác.
- Cư dân quét QR được hiển thị tên/mã thiết bị. Server tự lấy thiết bị từ QR, lưu ID/mã/tên/vị trí **tại thời điểm gửi**. Các trường thiết bị do client tự gửi không quyết định liên kết.
- Đổi tên thiết bị hoặc đổi/bỏ liên kết QR **không viết lại thiết bị trong phản ánh đã gửi**. Phản ánh trước khi có liên kết giữ nguyên chưa gán; không backfill theo tên. Kiểm tra tương tự/gộp trùng phải cùng thiết bị lúc gửi (kể cả chưa gán).
- **Thiết bị & bảo trì → mở thiết bị:** xem số QR đang liên kết, phản ánh ghi nhận thiết bị lúc gửi, liên kết đến danh sách và 5 phản ánh mới nhất. BQL mở hồ sơ thiết bị ngay từ chi tiết phản ánh. KTV/cư dân chỉ đọc snapshot trong phản ánh thuộc quyền mình, không có quyền mở danh bạ thiết bị.
- Danh sách QR có tìm tên vị trí/mã/tên thiết bị và 20 vị trí mỗi trang. QR/phản ánh lọc theo thiết bị hiện tại/snapshot riêng, để không nhầm lịch sử sau khi đổi liên kết.

Thiết bị tạm dừng vẫn được gán để tiếp nhận sự cố. Thiết bị ngừng sử dụng không được gán mới; liên kết cũ không tự bị tắt. Muốn ngừng nhận phản ánh tại tem cũ, BQL dùng **Vô hiệu hóa** vị trí. Không tự tạo phiếu bảo trì hoặc nghiệm thu từ một phản ánh.

Nếu biểu mẫu được mở trước khi BQL đổi liên kết, server báo thông tin đã đổi và không ghi phản ánh. Nội dung vẫn ở form/bản nháp; tải lại trang, kiểm tra đúng thiết bị rồi gửi. Ảnh không lưu vào bản nháp: sau reload phải chọn lại ảnh. Retry của yêu cầu đã gửi thành công trả receipt cũ, không tạo thêm một phản ánh cho thiết bị mới.

## Cập nhật trên Windows

1. Nếu chưa có bản Khối & tầng 017, cập nhật [bản trước](cap-nhat-khoi-tang-vscode.md) trước. Lưu các sửa đổi riêng, dừng frontend/backend bằng Ctrl+C. Giữ `.env`, `.certs`, database và ảnh/chứng từ.
2. Mở `D:\DO_AN\chung-cu-starter-codex-auth-qr-incidents` trong VS Code. Tạo mới/thay toàn bộ đúng **file 1–11** bên dưới. Chép nội dung trong khối mã, không chép dấu backtick và không nối cuối file.
3. Giữ nguyên migration 001–017; tạo mới 018 đúng nội dung. Tại thư mục gốc, khi database đang chạy:

```powershell
npm run db:migrate
```

Phải thấy `Schema current: 018_equipment_qr.sql`. Backend mới yêu cầu đủ 18 migration. Nếu DB Docker đang dừng thì chạy `npm run db:up` trước. Không chạy `db:seed`, không xóa database/volume, không sửa migration cũ. Migration không đổi token QR hoặc gán lại thiết bị cho dữ liệu cũ.

4. Không cần `npm install`. Khởi động backend:

```powershell
npm run dev:backend
```

Terminal khác giữ lệnh frontend đang dùng, ví dụ HTTPS đã thiết lập:

```powershell
npm run dev:frontend:https
```

Chỉ chạy một Vite trên cổng 5173. Ctrl+F5, đăng nhập BQL rồi mở Vị trí & QR. Dùng HTTPS được điện thoại tin cậy khi mở camera trong trang. Nếu lấy bằng Git, lưu sửa đổi cá nhân, cập nhật nhánh `codex/auth-qr-incidents`, chạy migration rồi restart. Sau bản này không chép app.js, QR routes, PublicReports.jsx, Reports.jsx hoặc Maintenance.jsx từ hướng dẫn cũ đè lên.

## Kịch bản thử

1. Tạo hai thiết bị A và B trong Thiết bị & bảo trì. Tạo vị trí loại Thiết bị, tìm/chọn A. Xem QR và mở thử: form nhận đúng mã/tên A, vẫn chọn/chụp ảnh được.
2. Gửi phản ánh có ảnh. BQL mở phản ánh: thấy thiết bị lúc gửi A và nút mở hồ sơ A. Hồ sơ A có phản ánh mới.
3. Mở một tab phản ánh QR và nhập nội dung nhưng chưa gửi. BQL đổi liên kết QR sang B. Token không đổi, phản ánh cũ vẫn A; tab cũ bị chặn khi gửi và giữ nội dung. Tải lại tab, kiểm tra B, chọn lại ảnh nếu cần rồi gửi.
4. Hồ sơ A: QR hiện tại có thể bằng 0, phản ánh A vẫn còn. Hồ sơ B: QR hiện tại có tem đã đổi, phản ánh mới thuộc B. Lọc danh sách không đưa phản ánh A sang B.
5. Bỏ liên kết QR: các phản ánh A/B đã gửi giữ nguyên. QR vẫn mở được form vị trí, không còn nhãn thiết bị. Xem lịch sử liên kết; thử tắt/thay mã theo quy trình cũ.
6. Thử KTV khác/cư dân mở danh bạ thiết bị hoặc liên kết QR: bị chặn. KTV được giao chỉ xem thiết bị snapshot của công việc mình được giao.

## Danh sách file chạy tính năng

| STT | Đường dẫn | Thao tác |
|---|---|---|
| 1 | `database/migrations/018_equipment_qr.sql` | Tạo mới |
| 2 | `backend/src/modules/qr/qr.service.js` | Tạo mới |
| 3 | `backend/src/modules/qr/qr.routes.js` | Thay toàn bộ |
| 4 | `backend/src/modules/incidents/incidents.service.js` | Thay toàn bộ |
| 5 | `backend/src/modules/incidents/incidents.repository.js` | Thay toàn bộ |
| 6 | `backend/src/app.js` | Thay toàn bộ |
| 7 | `frontend/src/features/qr/QrEquipment.jsx` | Tạo mới |
| 8 | `frontend/src/features/qr/Locations.jsx` | Thay toàn bộ |
| 9 | `frontend/src/features/incidents/PublicReports.jsx` | Thay toàn bộ |
| 10 | `frontend/src/features/incidents/Reports.jsx` | Thay toàn bộ |
| 11 | `frontend/src/features/maintenance/Maintenance.jsx` | Thay toàn bộ |

## File kiểm thử tùy chọn

Không cần chép 12–13 để chạy web. Nếu muốn chạy bộ kiểm thử mới, chép thêm hai file này; công cụ test từ bản 017 cần được giữ. `npm test` và `npm run test:e2e` dùng `chung_cu_test`, chạy nối tiếp.

| STT | Đường dẫn | Thao tác |
|---|---|---|
| 12 | `backend/test/equipment-qr.test.js` | Tạo mới |
| 13 | `e2e/equipment-qr.spec.js` | Tạo mới |

## 1. database/migrations/018_equipment_qr.sql

Tạo mới.

```sql
ALTER TABLE vi_tri_qr
  ADD COLUMN ma_thiet_bi INT UNSIGNED NULL,
  ADD COLUMN phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ADD CONSTRAINT fk_qr_equipment FOREIGN KEY (ma_thiet_bi) REFERENCES thiet_bi(ma_thiet_bi),
  ADD CONSTRAINT chk_qr_equipment_type CHECK (ma_thiet_bi IS NULL OR loai='THIET_BI');
ALTER TABLE phan_anh
  ADD COLUMN ma_thiet_bi INT UNSIGNED NULL,
  ADD COLUMN ma_tai_san_luc_gui VARCHAR(30) NULL,
  ADD COLUMN ten_thiet_bi_luc_gui VARCHAR(150) NULL,
  ADD COLUMN vi_tri_thiet_bi_luc_gui VARCHAR(160) NULL,
  ADD CONSTRAINT fk_incident_equipment FOREIGN KEY (ma_thiet_bi) REFERENCES thiet_bi(ma_thiet_bi),
  ADD CONSTRAINT chk_incident_equipment_snapshot CHECK (
    (ma_thiet_bi IS NULL AND ma_tai_san_luc_gui IS NULL AND ten_thiet_bi_luc_gui IS NULL AND vi_tri_thiet_bi_luc_gui IS NULL)
    OR (ma_thiet_bi IS NOT NULL AND ma_tai_san_luc_gui IS NOT NULL AND ten_thiet_bi_luc_gui IS NOT NULL AND vi_tri_thiet_bi_luc_gui IS NOT NULL)
  ),
  ADD INDEX idx_incident_equipment (ma_thiet_bi,ma_phan_anh);
CREATE TABLE lich_su_lien_ket_qr (
  ma_lich_su INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_vi_tri_qr INT UNSIGNED NOT NULL,
  ma_thiet_bi_cu INT UNSIGNED NULL,
  ma_thiet_bi_moi INT UNSIGNED NULL,
  ma_nguoi_thuc_hien INT UNSIGNED NOT NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (ma_vi_tri_qr) REFERENCES vi_tri_qr(ma_vi_tri_qr) ON DELETE CASCADE,
  FOREIGN KEY (ma_thiet_bi_cu) REFERENCES thiet_bi(ma_thiet_bi),
  FOREIGN KEY (ma_thiet_bi_moi) REFERENCES thiet_bi(ma_thiet_bi),
  FOREIGN KEY (ma_nguoi_thuc_hien) REFERENCES nguoi_dung(ma_nguoi_dung),
  INDEX idx_qr_link_history (ma_vi_tri_qr,ma_lich_su)
) ENGINE=InnoDB;
```

## 2. backend/src/modules/qr/qr.service.js

Tạo mới.

```js
import { randomUUID } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, text, integer, choice } from "../../lib/http.js";

const joined = `SELECT v.*,e.ma_tai_san,e.ten_thiet_bi,e.vi_tri AS vi_tri_thiet_bi FROM vi_tri_qr v LEFT JOIN thiet_bi e ON e.ma_thiet_bi=v.ma_thiet_bi`;
const equipmentId = (value) =>
  value === null || value === undefined || value === ""
    ? null
    : integer(value, "ma_thiet_bi");
async function target(db, id) {
  if (id === null) return null;
  const [equipment] = await rows(
    db,
    "SELECT ma_thiet_bi,trang_thai FROM thiet_bi WHERE ma_thiet_bi=? FOR SHARE",
    [id],
  );
  if (!equipment || equipment.trang_thai === "NGUNG_SU_DUNG")
    fail(
      422,
      "INVALID_EQUIPMENT",
      "Chọn thiết bị đang sử dụng hoặc tạm dừng, chưa ngừng sử dụng.",
    );
  return equipment;
}
async function locked(db, id, body, required = false) {
  const [location] = await rows(
    db,
    "SELECT * FROM vi_tri_qr WHERE ma_vi_tri_qr=? FOR UPDATE",
    [integer(id, "id")],
  );
  if (!location) fail(404, "NOT_FOUND", "Không tìm thấy vị trí.");
  if (
    (required || body.phien_ban !== undefined) &&
    location.phien_ban !== integer(body.phien_ban, "phien_ban")
  )
    fail(
      409,
      "QR_CHANGED",
      "Vị trí hoặc liên kết đã đổi. Hãy tải lại danh sách rồi mở lại.",
    );
  return location;
}
async function linkHistory(db, location, oldId, newId, user) {
  await rows(
    db,
    "INSERT INTO lich_su_lien_ket_qr (ma_vi_tri_qr,ma_thiet_bi_cu,ma_thiet_bi_moi,ma_nguoi_thuc_hien) VALUES (?,?,?,?)",
    [location, oldId, newId, user.ma_nguoi_dung],
  );
}
export async function list(query) {
  const page = integer(query.page || 1, "page");
  if (page < 1 || page > 100000)
    fail(422, "INVALID_PAGE", "Trang không hợp lệ.");
  const clauses = [],
    values = [];
  if (query.q) {
    clauses.push(
      "(v.ten_vi_tri LIKE ? OR e.ma_tai_san LIKE ? OR e.ten_thiet_bi LIKE ?)",
    );
    const q = `%${text(query.q, "q", 1, 100)}%`;
    values.push(q, q, q);
  }
  if (query.ma_thiet_bi !== undefined && query.ma_thiet_bi !== "") {
    clauses.push("v.ma_thiet_bi=?");
    values.push(integer(query.ma_thiet_bi, "ma_thiet_bi"));
  }
  const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
  const [count] = await rows(
    pool,
    "SELECT COUNT(*) AS total FROM vi_tri_qr v LEFT JOIN thiet_bi e ON e.ma_thiet_bi=v.ma_thiet_bi" +
      where,
    values,
  );
  return {
    data: await rows(
      pool,
      joined +
        where +
        ` ORDER BY v.ma_vi_tri_qr DESC LIMIT 20 OFFSET ${(page - 1) * 20}`,
      values,
    ),
    total: count.total,
    page,
  };
}
export async function detail(id) {
  const [location] = await rows(pool, joined + " WHERE v.ma_vi_tri_qr=?", [
    integer(id, "id"),
  ]);
  if (!location) fail(404, "NOT_FOUND", "Không tìm thấy vị trí.");
  return {
    ...location,
    lich_su_lien_ket: await rows(
      pool,
      `SELECT h.ma_lich_su,h.ngay_tao,o.ma_tai_san AS tai_san_cu,n.ma_tai_san AS tai_san_moi,u.ho_va_ten AS nguoi_thuc_hien FROM lich_su_lien_ket_qr h LEFT JOIN thiet_bi o ON o.ma_thiet_bi=h.ma_thiet_bi_cu LEFT JOIN thiet_bi n ON n.ma_thiet_bi=h.ma_thiet_bi_moi JOIN nguoi_dung u ON u.ma_nguoi_dung=h.ma_nguoi_thuc_hien WHERE h.ma_vi_tri_qr=? ORDER BY h.ma_lich_su DESC LIMIT 20`,
      [location.ma_vi_tri_qr],
    ),
  };
}
export async function create(body, user) {
  const name = text(body.ten_vi_tri, "ten_vi_tri", 2, 100),
    type = choice(body.loai, "loai", ["KHU_VUC", "THIET_BI"]),
    id = equipmentId(body.ma_thiet_bi);
  if (id !== null && type !== "THIET_BI")
    fail(
      422,
      "INVALID_QR_TYPE",
      "Chỉ liên kết thiết bị với vị trí loại Thiết bị.",
    );
  return transaction(async (db) => {
    await target(db, id);
    const r = await rows(
      db,
      "INSERT INTO vi_tri_qr (ten_vi_tri,loai,mo_ta,token_qr,ma_nguoi_tao,ma_thiet_bi) VALUES (?,?,?,?,?,?)",
      [
        name,
        type,
        text(body.mo_ta || "", "mo_ta", 0, 255),
        randomUUID(),
        user.ma_nguoi_dung,
        id,
      ],
    );
    if (id !== null) await linkHistory(db, r.insertId, null, id, user);
    return (
      await rows(db, joined + " WHERE v.ma_vi_tri_qr=?", [r.insertId])
    )[0];
  });
}
export async function link(id, body, user) {
  const selected = equipmentId(body.ma_thiet_bi);
  if (body.ma_thiet_bi === undefined || body.xac_nhan_doi_lien_ket !== true)
    fail(
      422,
      "CONFIRM_LINK",
      "Hãy chọn thiết bị hoặc bỏ liên kết và xác nhận thay đổi.",
    );
  return transaction(async (db) => {
    const location = await locked(db, id, body, true);
    if (location.loai !== "THIET_BI")
      fail(
        422,
        "INVALID_QR_TYPE",
        "Chỉ liên kết thiết bị với vị trí loại Thiết bị.",
      );
    if (location.ma_thiet_bi === selected) return { da_thay_doi: false };
    await target(db, selected);
    await rows(
      db,
      "UPDATE vi_tri_qr SET ma_thiet_bi=?,phien_ban=phien_ban+1 WHERE ma_vi_tri_qr=?",
      [selected, location.ma_vi_tri_qr],
    );
    await linkHistory(
      db,
      location.ma_vi_tri_qr,
      location.ma_thiet_bi,
      selected,
      user,
    );
    return { da_thay_doi: true };
  });
}
export async function setActive(id, body) {
  if (typeof body.dang_hoat_dong !== "boolean")
    fail(422, "VALIDATION", "Trạng thái không hợp lệ.");
  return transaction(async (db) => {
    const location = await locked(db, id, body);
    await rows(
      db,
      "UPDATE vi_tri_qr SET dang_hoat_dong=?,phien_ban=phien_ban+1 WHERE ma_vi_tri_qr=?",
      [body.dang_hoat_dong, location.ma_vi_tri_qr],
    );
    return { ok: true };
  });
}
export async function rotate(id, body) {
  return transaction(async (db) => {
    const location = await locked(db, id, body);
    if (!location.dang_hoat_dong)
      fail(409, "QR_INACTIVE", "Hãy kích hoạt vị trí trước khi thay mã.");
    const token = randomUUID();
    await rows(
      db,
      "UPDATE vi_tri_qr SET token_qr=?,phien_ban=phien_ban+1 WHERE ma_vi_tri_qr=?",
      [token, location.ma_vi_tri_qr],
    );
    return { token_qr: token };
  });
}
```

## 3. backend/src/modules/qr/qr.routes.js

Thay toàn bộ.

```js
import { Router } from "express";
import { pool, rows } from "../../lib/db.js";
import { fail } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./qr.service.js";
export const qrRouter = Router(),
  publicQrRouter = Router();
publicQrRouter.get("/:token", async (req, res) => {
  const [location] = await rows(
    pool,
    `SELECT v.ten_vi_tri,v.mo_ta,v.phien_ban,e.ma_tai_san,e.ten_thiet_bi FROM vi_tri_qr v LEFT JOIN thiet_bi e ON e.ma_thiet_bi=v.ma_thiet_bi WHERE v.token_qr=? AND v.dang_hoat_dong=1`,
    [req.params.token],
  );
  if (!location)
    fail(
      404,
      "QR_INVALID",
      "Mã QR không hợp lệ hoặc đã ngừng sử dụng. Vui lòng liên hệ Ban quản lý.",
    );
  res.json({
    data: {
      ten_vi_tri: location.ten_vi_tri,
      mo_ta: location.mo_ta,
      phien_ban_qr: location.phien_ban,
      thiet_bi: location.ma_tai_san
        ? {
            ma_tai_san: location.ma_tai_san,
            ten_thiet_bi: location.ten_thiet_bi,
          }
        : null,
    },
  });
});
qrRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
qrRouter.get("/", async (req, res) => res.json(await service.list(req.query)));
qrRouter.get("/:id", async (req, res) =>
  res.json({ data: await service.detail(req.params.id) }),
);
qrRouter.post("/", async (req, res) =>
  res.status(201).json({ data: await service.create(req.body, req.user) }),
);
qrRouter.put("/:id/thiet_bi", async (req, res) =>
  res.json({ data: await service.link(req.params.id, req.body, req.user) }),
);
qrRouter.patch("/:id", async (req, res) =>
  res.json({ data: await service.setActive(req.params.id, req.body) }),
);
qrRouter.post("/:id/sinh_lai_qr", async (req, res) =>
  res.json({ data: await service.rotate(req.params.id, req.body) }),
);
```

## 4. backend/src/modules/incidents/incidents.service.js

Thay toàn bộ.

```js
import { randomBytes, createHash } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, text, phone, choice, integer } from "../../lib/http.js";
import { saveImages, cleanupImages } from "../../lib/images.js";
import { lockedReport, addImages, history } from "./incidents.repository.js";
export const categories = [
  "DIEN",
  "NUOC",
  "THANG_MAY",
  "VE_SINH",
  "AN_NINH",
  "KHAC",
];
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hash = (value) => createHash("sha256").update(value).digest("hex");
export async function submit(body, files, user, ip) {
  const b = {
    token: text(body.token_qr, "token_qr", 36, 36),
    key: text(body.khoa_yeu_cau, "khoa_yeu_cau", 36, 36),
    title: text(body.tieu_de, "tieu_de", 3, 150),
    content: text(body.noi_dung, "noi_dung", 10, 5000),
    name: text(body.ten_nguoi_gui, "ten_nguoi_gui", 2, 100),
    phone: phone(body.so_dien_thoai),
    apartment: text(body.can_ho_khai_bao || "", "can_ho_khai_bao", 0, 40),
    category: choice(body.loai_su_co, "loai_su_co", categories),
    user: user?.ma_nguoi_dung || null,
  };
  if (!uuid.test(b.token) || !uuid.test(b.key))
    fail(422, "VALIDATION", "Token QR hoặc khóa yêu cầu không hợp lệ.");
  const fingerprint = hash(
    JSON.stringify(b) + files.map((f) => hash(f.buffer)).join(","),
  );
  let names = [],
    retained = false;
  try {
    // Images are prepared before opening DB locks; all metadata commits together.
    names = await saveImages(files);
    const result = await transaction(async (db) => {
      await rows(
        db,
        "INSERT INTO yeu_cau_gui (khoa,van_tay) VALUES (?,?) ON DUPLICATE KEY UPDATE khoa=khoa",
        [b.key, fingerprint],
      );
      const [request] = await rows(
        db,
        "SELECT * FROM yeu_cau_gui WHERE khoa=? FOR UPDATE",
        [b.key],
      );
      if (request.van_tay !== fingerprint)
        fail(
          409,
          "IDEMPOTENCY_CONFLICT",
          "Khóa gửi đã được dùng cho nội dung khác. Hãy mở biểu mẫu mới.",
        );
      if (request.ma_phan_anh)
        return {
          ...(
            await rows(
              db,
              "SELECT ma_tra_cuu FROM phan_anh WHERE ma_phan_anh=?",
              [request.ma_phan_anh],
            )
          )[0],
          replay: true,
        };
      const [loc] = await rows(
        db,
        "SELECT * FROM vi_tri_qr WHERE token_qr=? AND dang_hoat_dong=1 FOR SHARE",
        [b.token],
      );
      if (!loc)
        fail(
          404,
          "QR_INVALID",
          "Mã QR đã bị thay hoặc vô hiệu hóa. Vui lòng quét lại.",
        );
      if (
        (loc.ma_thiet_bi !== null && body.phien_ban_qr === undefined) ||
        (body.phien_ban_qr !== undefined &&
          loc.phien_ban !== integer(body.phien_ban_qr, "phien_ban_qr"))
      )
        fail(
          409,
          "QR_CHANGED",
          "Liên kết vị trí đã thay đổi. Hãy tải lại biểu mẫu và kiểm tra thiết bị trước khi gửi.",
        );
      const [equipment] =
        loc.ma_thiet_bi === null
          ? []
          : await rows(
              db,
              "SELECT ma_tai_san,ten_thiet_bi,vi_tri FROM thiet_bi WHERE ma_thiet_bi=? FOR SHARE",
              [loc.ma_thiet_bi],
            );
      const rateKey = hash(b.phone + "|" + ip);
      await rows(
        db,
        "INSERT INTO gioi_han_gui (khoa,cac_moc_thoi_gian) VALUES (?,JSON_ARRAY()) ON DUPLICATE KEY UPDATE khoa=khoa",
        [rateKey],
      );
      const [rate] = await rows(
        db,
        "SELECT cac_moc_thoi_gian FROM gioi_han_gui WHERE khoa=? FOR UPDATE",
        [rateKey],
      );
      const times = (
        typeof rate.cac_moc_thoi_gian === "string"
          ? JSON.parse(rate.cac_moc_thoi_gian)
          : rate.cac_moc_thoi_gian
      ).filter((t) => t > Date.now() - 3600000);
      if (times.length >= 5)
        fail(
          429,
          "SUBMISSION_LIMIT",
          "Bạn đã gửi 5 phản ánh trong một giờ. Vui lòng thử lại sau.",
        );
      const similar = await rows(
        db,
        "SELECT 1 FROM phan_anh WHERE ma_vi_tri_qr=? AND ma_thiet_bi <=> ? AND loai_su_co=? AND trang_thai IN ('MOI','DA_PHAN_CONG','DANG_XU_LY','DA_XU_LY') LIMIT 1",
        [loc.ma_vi_tri_qr, loc.ma_thiet_bi, b.category],
      );
      if (
        similar.length &&
        body.xac_nhan_gui !== "true" &&
        body.xac_nhan_gui !== true
      )
        fail(
          409,
          "SIMILAR_REPORT",
          "Vị trí này có sự cố tương tự đang được tiếp nhận. Bạn vẫn muốn gửi phản ánh riêng?",
        );
      const lookup = randomBytes(32).toString("hex");
      const r = await rows(
        db,
        `INSERT INTO phan_anh (ma_tra_cuu,khoa_yeu_cau,ma_vi_tri_qr,ma_nguoi_gui,ten_nguoi_gui,so_dien_thoai_nguoi_gui,can_ho_khai_bao,tieu_de,noi_dung,loai_su_co,ma_thiet_bi,ma_tai_san_luc_gui,ten_thiet_bi_luc_gui,vi_tri_thiet_bi_luc_gui) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          lookup,
          b.key,
          loc.ma_vi_tri_qr,
          b.user,
          b.name,
          b.phone,
          b.apartment,
          b.title,
          b.content,
          b.category,
          loc.ma_thiet_bi,
          equipment?.ma_tai_san ?? null,
          equipment?.ten_thiet_bi ?? null,
          equipment?.vi_tri ?? null,
        ],
      );
      await addImages(db, r.insertId, names, "PHAN_ANH", 1, user);
      await history(
        db,
        { ma_phan_anh: r.insertId, trang_thai: null, ma_ky_thuat_vien: null },
        user,
        "TIEP_NHAN",
        "MOI",
        "",
        "Đã tiếp nhận phản ánh.",
      );
      await rows(db, "UPDATE yeu_cau_gui SET ma_phan_anh=? WHERE khoa=?", [
        r.insertId,
        b.key,
      ]);
      await rows(
        db,
        "UPDATE gioi_han_gui SET cac_moc_thoi_gian=? WHERE khoa=?",
        [JSON.stringify([...times, Date.now()]), rateKey],
      );
      return { ma_tra_cuu: lookup, replay: false };
    });
    retained = !result.replay;
    return result;
  } finally {
    if (!retained) await cleanupImages(names);
  }
}
export async function lookup(body) {
  const number = phone(body.so_dien_thoai);
  if (
    typeof body.ma_tra_cuu !== "string" ||
    !/^[a-f0-9]{64}$/.test(body.ma_tra_cuu)
  )
    fail(
      404,
      "NOT_FOUND",
      "Không tìm thấy phản ánh. Kiểm tra mã và số điện thoại.",
    );
  let [r] = await rows(
    pool,
    `SELECT p.ma_phan_anh,p.trang_thai,p.ngay_tao,p.ngay_dong,p.ma_phan_anh_goc,v.ten_vi_tri FROM phan_anh p JOIN vi_tri_qr v USING(ma_vi_tri_qr) WHERE ma_tra_cuu=? AND so_dien_thoai_nguoi_gui=?`,
    [body.ma_tra_cuu, number],
  );
  if (!r)
    fail(
      404,
      "NOT_FOUND",
      "Không tìm thấy phản ánh. Kiểm tra mã và số điện thoại.",
    );
  if (r.trang_thai === "TRUNG") {
    const [original] = await rows(
      pool,
      "SELECT trang_thai,ngay_dong FROM phan_anh WHERE ma_phan_anh=?",
      [r.ma_phan_anh_goc],
    );
    r = {
      ...r,
      trang_thai: original.trang_thai,
      ngay_dong: original.ngay_dong,
    };
  }
  const timeline = await rows(
    pool,
    "SELECT trang_thai_moi,ngay_tao,noi_dung_cong_khai FROM lich_su_phan_anh WHERE ma_phan_anh=? ORDER BY ma_lich_su_phan_anh",
    [r.ma_phan_anh],
  );
  // Deliberately omit IDs, names, contact details, report contents, and images.
  return {
    ten_vi_tri: r.ten_vi_tri,
    trang_thai: r.trang_thai,
    ngay_tao: r.ngay_tao,
    ngay_dong: r.ngay_dong,
    lich_su: timeline,
  };
}
export async function assign(id, body, actor) {
  const version = integer(body.phien_ban, "phien_ban"),
    technician = integer(body.ma_ky_thuat_vien, "ma_ky_thuat_vien");
  const priority = choice(body.do_uu_tien, "do_uu_tien", [
    "THAP",
    "TRUNG_BINH",
    "CAO",
    "KHAN_CAP",
  ]);
  await transaction(async (db) => {
    const r = await lockedReport(db, id, actor, version);
    if (!["MOI", "DA_PHAN_CONG", "DANG_XU_LY"].includes(r.trang_thai))
      fail(409, "STATE_CONFLICT", "Không thể phân công ở trạng thái này.");
    const [u] = await rows(
      db,
      "SELECT * FROM nguoi_dung WHERE ma_nguoi_dung=? AND vai_tro='KY_THUAT_VIEN' AND dang_hoat_dong=1 FOR SHARE",
      [technician],
    );
    if (!u)
      fail(422, "TECHNICIAN_INVALID", "Chọn kỹ thuật viên đang hoạt động.");
    const status = r.trang_thai === "MOI" ? "DA_PHAN_CONG" : r.trang_thai;
    await rows(
      db,
      "UPDATE phan_anh SET ma_ky_thuat_vien=?,do_uu_tien=?,trang_thai=?,phien_ban=phien_ban+1 WHERE ma_phan_anh=?",
      [technician, priority, status, id],
    );
    await history(
      db,
      r,
      actor,
      "PHAN_CONG",
      status,
      text(body.ghi_chu || "", "ghi_chu", 0, 500),
      "Đã phân công kỹ thuật viên xử lý.",
      technician,
    );
  });
}
export async function transition(id, body, files, actor) {
  const version = integer(body.phien_ban, "phien_ban");
  const target = choice(body.trang_thai, "trang_thai", [
    "DANG_XU_LY",
    "DA_XU_LY",
    "DA_DONG",
    "TU_CHOI",
    "TRUNG",
  ]);
  const note = text(body.ghi_chu || "", "ghi_chu", 0, 500),
    publicNote = text(
      body.noi_dung_cong_khai || "",
      "noi_dung_cong_khai",
      0,
      500,
    );
  let names = [],
    committed = false;
  try {
    if (files.length && target !== "DA_XU_LY")
      fail(422, "IMAGE_STAGE", "Chỉ gửi ảnh nghiệm thu khi hoàn thành.");
    names = await saveImages(files);
    await transaction(async (db) => {
      const r = await lockedReport(db, id, actor, version);
      const tech = actor.vai_tro === "KY_THUAT_VIEN";
      if (tech) {
        if (
          actor.ma_nguoi_dung !== r.ma_ky_thuat_vien ||
          !(
            (r.trang_thai === "DA_PHAN_CONG" && target === "DANG_XU_LY") ||
            (r.trang_thai === "DANG_XU_LY" && target === "DA_XU_LY")
          )
        )
          fail(
            409,
            "STATE_CONFLICT",
            "Không thể chuyển trạng thái công việc này.",
          );
        if (target === "DA_XU_LY" && (!note || !names.length))
          fail(
            422,
            "EVIDENCE_REQUIRED",
            "Hoàn thành cần ghi chú và ít nhất một ảnh nghiệm thu mới.",
          );
      } else if (actor.vai_tro === "QUAN_TRI_VIEN") {
        if (
          !(
            (r.trang_thai === "MOI" && ["TU_CHOI", "TRUNG"].includes(target)) ||
            (r.trang_thai === "DA_XU_LY" &&
              ["DA_DONG", "DANG_XU_LY"].includes(target))
          )
        )
          fail(
            409,
            "STATE_CONFLICT",
            "Không thể chuyển trạng thái phản ánh này.",
          );
        if (target !== "DA_DONG" && !note)
          fail(422, "REASON_REQUIRED", "Vui lòng nhập lý do.");
      } else fail(403, "FORBIDDEN", "Bạn không có quyền cập nhật phản ánh.");
      let original = null;
      if (target === "TRUNG") {
        original = integer(body.ma_phan_anh_goc, "ma_phan_anh_goc");
        if (original === id)
          fail(422, "MERGE_INVALID", "Không thể gộp vào chính phản ánh này.");
        const [parent] = await rows(
          db,
          "SELECT * FROM phan_anh WHERE ma_phan_anh=? FOR UPDATE",
          [original],
        );
        if (
          !parent ||
          parent.ma_vi_tri_qr !== r.ma_vi_tri_qr ||
          parent.ma_thiet_bi !== r.ma_thiet_bi ||
          !["MOI", "DA_PHAN_CONG", "DANG_XU_LY", "DA_XU_LY"].includes(
            parent.trang_thai,
          )
        )
          fail(
            422,
            "MERGE_INVALID",
            "Phản ánh gốc phải cùng vị trí, cùng thiết bị lúc gửi và đang được xử lý.",
          );
        // A report which already has children cannot become a duplicate itself.
        if (
          (
            await rows(
              db,
              "SELECT 1 FROM phan_anh WHERE ma_phan_anh_goc=? LIMIT 1",
              [id],
            )
          ).length
        )
          fail(
            422,
            "MERGE_INVALID",
            "Phản ánh này đã là bản gốc của phản ánh khác.",
          );
      }
      const round =
        r.luot_xu_ly +
        (r.trang_thai === "DA_XU_LY" && target === "DANG_XU_LY" ? 1 : 0);
      await rows(
        db,
        `UPDATE phan_anh SET trang_thai=?,phien_ban=phien_ban+1,luot_xu_ly=?,ma_phan_anh_goc=?,ngay_dong=IF(?='DA_DONG',UTC_TIMESTAMP(),NULL) WHERE ma_phan_anh=?`,
        [target, round, original, target, id],
      );
      await addImages(db, id, names, "NGHIEM_THU", round, actor);
      await history(db, r, actor, "DOI_TRANG_THAI", target, note, publicNote);
    });
    committed = true;
  } finally {
    if (!committed) await cleanupImages(names);
  }
}
```

## 5. backend/src/modules/incidents/incidents.repository.js

Thay toàn bộ.

```js
import { pool, rows } from "../../lib/db.js";
import { fail, integer } from "../../lib/http.js";
export function canRead(user, r) {
  return (
    user.vai_tro === "QUAN_TRI_VIEN" ||
    (user.vai_tro === "KY_THUAT_VIEN" &&
      user.ma_nguoi_dung === r.ma_ky_thuat_vien) ||
    (user.vai_tro === "CU_DAN" && user.ma_nguoi_dung === r.ma_nguoi_gui)
  );
}
export async function lockedReport(db, id, user, version) {
  const [r] = await rows(
    db,
    "SELECT * FROM phan_anh WHERE ma_phan_anh=? FOR UPDATE",
    [id],
  );
  if (!r || !canRead(user, r))
    fail(404, "NOT_FOUND", "Không tìm thấy phản ánh trong phạm vi của bạn.");
  if (r.phien_ban !== version)
    fail(
      409,
      "VERSION_CONFLICT",
      "Dữ liệu đã được người khác thay đổi. Hãy tải lại trước khi thao tác.",
    );
  return r;
}
export async function history(
  db,
  r,
  actor,
  type,
  nextStatus,
  note = "",
  publicNote = "",
  technician = r.ma_ky_thuat_vien,
) {
  await rows(
    db,
    `INSERT INTO lich_su_phan_anh
    (ma_phan_anh,loai_su_kien,trang_thai_cu,trang_thai_moi,ma_nguoi_thay_doi,ghi_chu,noi_dung_cong_khai,ma_ky_thuat_vien_cu,ma_ky_thuat_vien_moi)
    VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      r.ma_phan_anh,
      type,
      r.trang_thai,
      nextStatus,
      actor?.ma_nguoi_dung || null,
      note,
      publicNote,
      r.ma_ky_thuat_vien,
      technician,
    ],
  );
}
export async function addImages(db, id, names, type, round, actor) {
  for (const name of names)
    await rows(
      db,
      "INSERT INTO hinh_anh_phan_anh (ma_phan_anh,duong_dan_tep,loai,luot_xu_ly,ma_nguoi_tai_len) VALUES (?,?,?,?,?)",
      [id, name, type, round, actor?.ma_nguoi_dung || null],
    );
}
export async function detail(id, user) {
  const [r] = await rows(
    pool,
    `SELECT p.*,v.ten_vi_tri,n.ho_va_ten AS ten_ky_thuat_vien FROM phan_anh p JOIN vi_tri_qr v USING(ma_vi_tri_qr) LEFT JOIN nguoi_dung n ON n.ma_nguoi_dung=p.ma_ky_thuat_vien WHERE p.ma_phan_anh=?`,
    [id],
  );
  if (!r || !canRead(user, r))
    fail(404, "NOT_FOUND", "Không tìm thấy phản ánh trong phạm vi của bạn.");
  delete r.ma_tra_cuu;
  delete r.khoa_yeu_cau;
  r.lich_su = await rows(
    pool,
    `SELECT l.*,n.ho_va_ten AS nguoi_thuc_hien FROM lich_su_phan_anh l LEFT JOIN nguoi_dung n ON n.ma_nguoi_dung=l.ma_nguoi_thay_doi WHERE ma_phan_anh=? ORDER BY ma_lich_su_phan_anh`,
    [id],
  );
  if (user.vai_tro === "CU_DAN")
    r.lich_su = r.lich_su.map((l) => ({
      ma_lich_su_phan_anh: l.ma_lich_su_phan_anh,
      trang_thai_moi: l.trang_thai_moi,
      ngay_tao: l.ngay_tao,
      noi_dung_cong_khai: l.noi_dung_cong_khai,
    }));
  r.hinh_anh = await rows(
    pool,
    "SELECT ma_hinh_anh_phan_anh,loai,luot_xu_ly FROM hinh_anh_phan_anh WHERE ma_phan_anh=? ORDER BY ma_hinh_anh_phan_anh",
    [id],
  );
  return r;
}
export async function list(user, query) {
  const clauses = [],
    params = [];
  if (query.ma_thiet_bi !== undefined && query.ma_thiet_bi !== "") {
    clauses.push("p.ma_thiet_bi=?");
    params.push(integer(query.ma_thiet_bi, "ma_thiet_bi"));
  }
  if (user.vai_tro === "KY_THUAT_VIEN") {
    clauses.push("p.ma_ky_thuat_vien=?");
    params.push(user.ma_nguoi_dung);
  }
  if (user.vai_tro === "CU_DAN") {
    clauses.push("p.ma_nguoi_gui=?");
    params.push(user.ma_nguoi_dung);
  }
  for (const key of ["trang_thai", "loai_su_co"])
    if (typeof query[key] === "string" && query[key]) {
      if (key === "trang_thai" && query[key] === "DANG_MO") {
        clauses.push(
          "p.trang_thai IN ('MOI','DA_PHAN_CONG','DANG_XU_LY','DA_XU_LY')",
        );
        continue;
      }
      clauses.push(`p.${key}=?`);
      params.push(query[key]);
    }
  if (typeof query.q === "string" && query.q) {
    clauses.push("(p.tieu_de LIKE ? OR v.ten_vi_tri LIKE ?)");
    params.push(`%${query.q.slice(0, 100)}%`, `%${query.q.slice(0, 100)}%`);
  }
  const where = clauses.length ? " WHERE " + clauses.join(" AND ") : "";
  const page = Math.min(
      100000,
      Math.max(1, Number.parseInt(query.page, 10) || 1),
    ),
    size = 20;
  const joins =
    " FROM phan_anh p JOIN vi_tri_qr v USING(ma_vi_tri_qr) LEFT JOIN nguoi_dung n ON n.ma_nguoi_dung=p.ma_ky_thuat_vien";
  const [count] = await rows(
    pool,
    "SELECT COUNT(*) AS total" + joins + where,
    params,
  );
  const data = await rows(
    pool,
    `SELECT p.ma_phan_anh,p.tieu_de,p.loai_su_co,p.do_uu_tien,p.trang_thai,p.ngay_tao,p.phien_ban,p.ma_thiet_bi,p.ma_tai_san_luc_gui,p.ten_thiet_bi_luc_gui,v.ten_vi_tri,n.ho_va_ten AS ten_ky_thuat_vien` +
      joins +
      where +
      ` ORDER BY p.ma_phan_anh DESC LIMIT ${size} OFFSET ${(page - 1) * size}`,
    params,
  );
  return { data, meta: { page, total: count.total, page_size: size } };
}
```

## 6. backend/src/app.js

Thay toàn bộ.

```js
import express from "express";
import { structureRouter } from "./modules/residency/building-structure.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { dataExchangeRouter } from "./modules/data-exchange/data-exchange.routes.js";
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

import {
  fundsRouter,
  vouchersRouter,
} from "./modules/treasury/treasury.routes.js";

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
      "SELECT name FROM schema_migrations WHERE name IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
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
        "013_treasury.sql",
        "014_data_imports.sql",
        "015_bill_batches.sql",
        "016_bill_actions.sql",
        "017_building_structure.sql",
        "018_equipment_qr.sql",
      ],
    );
    if (migrations.length !== 18) throw new Error("Schema not initialized");
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
app.use("/api/tong_quan", dashboardRouter);
app.use("/api/trao_doi_du_lieu", dataExchangeRouter);
app.use("/api/nguoi_dung", usersRouter);
app.use("/api/can_ho", apartmentsRouter);
app.use("/api/cau_truc_toa_nha", structureRouter);
app.use("/api/cu_dan", residentsRouter);
app.use("/api/phuong_tien", vehiclesRouter);
app.use("/api/cau_hinh_phi", ratesRouter);
app.use("/api/chi_so_dich_vu", metersRouter);
app.use("/api/hoa_don", billsRouter);
app.use("/api/bao_cao", financialReportsRouter);
app.use("/api/quy", fundsRouter);
app.use("/api/phieu_thu_chi", vouchersRouter);
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

## 7. frontend/src/features/qr/QrEquipment.jsx

Tạo mới.

```jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  date,
  useResource,
} from "../../shared/ui.jsx";

function EquipmentOptions({ path, onChoose, page, onPage }) {
  const resource = useResource(path);
  return (
    <>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Field label="Chọn thiết bị">
        <select
          value=""
          onChange={(event) => {
            const row = resource.result?.data.find(
              (item) => String(item.ma_thiet_bi) === event.target.value,
            );
            if (row) onChoose(row);
          }}
        >
          <option value="">Chọn trong kết quả tìm kiếm</option>
          {resource.result?.data.map((item) => (
            <option
              key={item.ma_thiet_bi}
              value={item.ma_thiet_bi}
              disabled={item.trang_thai === "NGUNG_SU_DUNG"}
            >
              {item.ma_tai_san} · {item.ten_thiet_bi}
              {item.trang_thai === "NGUNG_SU_DUNG" ? " · Đã ngừng sử dụng" : ""}
            </option>
          ))}
        </select>
      </Field>
      {resource.result && (
        <p className="muted">
          {resource.result.total} thiết bị phù hợp. Đang xem tối đa 20 thiết bị
          trên trang.
        </p>
      )}
      <div className="actions">
        <button
          type="button"
          disabled={resource.loading || page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Trang thiết bị trước
        </button>
        <span>Trang {page}</span>
        <button
          type="button"
          disabled={
            resource.loading ||
            !resource.result ||
            page * 20 >= resource.result.total
          }
          onClick={() => onPage(page + 1)}
        >
          Trang thiết bị sau
        </button>
      </div>
    </>
  );
}
export function EquipmentPicker({ value, onChange, initialId }) {
  const [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [error, setError] = useState(null);
  useEffect(() => {
    if (!initialId) return;
    const controller = new AbortController();
    getJson(`/thiet_bi/${encodeURIComponent(initialId)}`, {
      signal: controller.signal,
    })
      .then((result) => {
        if (!controller.signal.aborted) onChange(result.data);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err);
      });
    return () => controller.abort();
    // initialId identifies the device in the incoming equipment-page link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);
  const path = `/thiet_bi?${new URLSearchParams({ q: query, page: String(page) })}`;
  return (
    <div className="qr-equipment-picker">
      <Field
        label="Tìm thiết bị theo mã hoặc tên"
        value={query}
        maxLength={100}
        onChange={(event) => {
          setQuery(event.target.value);
          setPage(1);
        }}
      />
      <ErrorBox error={error} />
      <EquipmentOptions
        key={path}
        path={path}
        onChoose={onChange}
        page={page}
        onPage={setPage}
      />
      <p>
        {value
          ? `Đã chọn: ${value.ma_tai_san} · ${value.ten_thiet_bi}`
          : "Chưa liên kết hồ sơ thiết bị."}
      </p>
      {value && (
        <button type="button" onClick={() => onChange(null)}>
          Bỏ chọn thiết bị
        </button>
      )}
    </div>
  );
}
export function QrLinkEditor({ location, onSaved, onClose }) {
  const [device, setDevice] = useState(location.ma_thiet_bi ? location : null),
    [pending, setPending] = useState(false),
    [error, setError] = useState(null);
  const history = useResource(`/vi_tri_qr/${location.ma_vi_tri_qr}`);
  return (
    <section className="card no-print" aria-label="Liên kết thiết bị với QR">
      <h2>Liên kết thiết bị · {location.ten_vi_tri}</h2>
      <p>
        Liên kết áp dụng cho phản ánh gửi sau khi lưu. Phản ánh cũ giữ nguyên
        thiết bị lúc gửi. URL và ảnh QR không đổi; kiểm tra lại tem đang dán
        trước khi đổi sang thiết bị khác.
      </p>
      <ErrorBox error={error} />
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          try {
            await getJson(`/vi_tri_qr/${location.ma_vi_tri_qr}/thiet_bi`, {
              method: "PUT",
              body: {
                ma_thiet_bi: device?.ma_thiet_bi ?? null,
                phien_ban: location.phien_ban,
                xac_nhan_doi_lien_ket: true,
              },
            });
            onSaved();
          } catch (err) {
            setError(err);
          } finally {
            setPending(false);
          }
        }}
      >
        <fieldset disabled={pending}>
          <EquipmentPicker value={device} onChange={setDevice} />
          <label className="check">
            <input type="checkbox" required /> Tôi đã kiểm tra thiết bị trên tem
            QR và đồng ý thay đổi liên kết cho các phản ánh tiếp theo.
          </label>
          <div className="actions">
            <button className="primary">
              {pending ? "Đang lưu…" : "Lưu liên kết"}
            </button>
            <button type="button" onClick={onClose}>
              Đóng và tải lại
            </button>
          </div>
        </fieldset>
      </form>
      <details>
        <summary>20 thay đổi liên kết gần nhất</summary>
        {history.loading && <Loading />}
        <ErrorBox error={history.error} />
        <ul>
          {history.result?.data.lich_su_lien_ket.map((item) => (
            <li key={item.ma_lich_su}>
              {date(item.ngay_tao)} · {item.tai_san_cu || "Chưa liên kết"} →{" "}
              {item.tai_san_moi || "Bỏ liên kết"} · {item.nguoi_thuc_hien}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

export function EquipmentQrConnections({ id }) {
  const locations = useResource(`/vi_tri_qr?ma_thiet_bi=${id}`),
    incidents = useResource(`/phan_anh?ma_thiet_bi=${id}`);
  return (
    <section className="card" aria-label="QR và phản ánh của thiết bị">
      <h2>QR & phản ánh của thiết bị</h2>
      <div className="actions">
        <Link className="button" to={`/quan-tri/vi-tri-qr?ma_thiet_bi=${id}`}>
          Quản lý QR của thiết bị
        </Link>
        <Link className="button" to={`/quan-tri/phan-anh?ma_thiet_bi=${id}`}>
          Xem phản ánh của thiết bị
        </Link>
        <button
          onClick={() => {
            locations.reload();
            incidents.reload();
          }}
        >
          Cập nhật liên kết và phản ánh
        </button>
      </div>
      {(locations.loading || incidents.loading) && <Loading />}
      <ErrorBox error={locations.error || incidents.error} />
      {locations.result && (
        <p>
          {locations.result.total} vị trí QR đang liên kết (gồm cả vị trí đã vô
          hiệu hóa).
        </p>
      )}
      {incidents.result && (
        <>
          <p>
            {incidents.result.meta.total} phản ánh ghi nhận thiết bị này lúc
            gửi. Các phản ánh trước khi có liên kết không được tự gán lại.
          </p>
          <ul>
            {incidents.result.data.slice(0, 5).map((item) => (
              <li key={item.ma_phan_anh}>
                <Link to={`/quan-tri/phan-anh/${item.ma_phan_anh}`}>
                  #{item.ma_phan_anh} · {item.tieu_de}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
```

## 8. frontend/src/features/qr/Locations.jsx

Thay toàn bộ.

```jsx
import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Link, useSearchParams } from "react-router-dom";
import { EquipmentPicker, QrLinkEditor } from "./QrEquipment.jsx";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";
function QrCard({ location }) {
  const [image, setImage] = useState(""),
    [error, setError] = useState();
  const url = `${window.location.origin}/r/${location.token_qr}`;
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, { width: 320, margin: 2, errorCorrectionLevel: "M" })
      .then((x) => {
        if (active) setImage(x);
      })
      .catch(setError);
    return () => {
      active = false;
    };
  }, [url]);
  return (
    <section className="qr-print card">
      <h2>{location.ten_vi_tri}</h2>
      {location.ma_thiet_bi && (
        <p>
          {location.ma_tai_san} · {location.ten_thiet_bi}
        </p>
      )}
      <p>Quét mã để gửi phản ánh tại vị trí</p>
      {image && (
        <img
          className="qr-image"
          src={image}
          alt={`Mã QR ${location.ten_vi_tri}`}
        />
      )}
      <ErrorBox error={error} />
      <p className="qr-url">{url}</p>
      <div className="actions no-print">
        <Link className="button" to={`/r/${location.token_qr}`}>
          Mở thử biểu mẫu
        </Link>
        {image && (
          <a
            className="button"
            href={image}
            download={`vi-tri-${location.ma_vi_tri_qr}.png`}
          >
            Tải ảnh QR
          </a>
        )}
        <button onClick={() => window.print()}>In mã này</button>
      </div>
      <p className="muted">
        Để quét trên điện thoại, hãy mở hệ thống bằng tên miền HTTPS mà điện
        thoại truy cập được trước khi in.
      </p>
    </section>
  );
}
export default function Locations() {
  const [params, setParams] = useSearchParams();
  const resource = useResource(`/vi_tri_qr?${params}`),
    [type, setType] = useState(
      params.get("ma_thiet_bi") ? "THIET_BI" : "KHU_VUC",
    ),
    [device, setDevice] = useState(null),
    [editingLink, setEditingLink] = useState(null),
    [selected, setSelected] = useState(),
    [error, setError] = useState(),
    [pending, setPending] = useState(false),
    [confirmation, setConfirmation] = useState();
  async function change(action) {
    setPending(true);
    setError(null);
    try {
      await action();
      setSelected(null);
      setConfirmation(null);
      setEditingLink(null);
      resource.reload();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">DANH MỤC TÒA NHÀ</p>
          <h1>Vị trí & mã QR</h1>
        </div>
      </div>
      <ErrorBox error={error} />
      <form
        className="filters no-print"
        onSubmit={(event) => {
          event.preventDefault();
          const next = new URLSearchParams(params);
          next.set("q", new FormData(event.currentTarget).get("q"));
          next.delete("page");
          setParams(next);
        }}
      >
        <Field
          label="Tìm vị trí hoặc thiết bị"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <button>Tìm vị trí</button>
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setEditingLink(null);
            resource.reload();
          }}
        >
          Tải lại vị trí
        </button>
        {params.get("ma_thiet_bi") && (
          <Link to="/quan-tri/vi-tri-qr">Xem tất cả vị trí</Link>
        )}
      </form>
      <div className="detail-grid">
        <section className="card no-print">
          <h2>Thêm vị trí</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const body = Object.fromEntries(new FormData(form));
              body.ma_thiet_bi =
                type === "THIET_BI" ? (device?.ma_thiet_bi ?? null) : null;
              change(async () => {
                await getJson("/vi_tri_qr", { method: "POST", body });
                form.reset();
                setDevice(null);
                setType("KHU_VUC");
              });
            }}
          >
            <fieldset disabled={pending}>
              <Field
                label="Tên vị trí"
                name="ten_vi_tri"
                required
                minLength={2}
                maxLength={100}
              />
              <Field label="Loại vị trí">
                <select
                  name="loai"
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value);
                    setDevice(null);
                  }}
                >
                  <Options
                    values={{ KHU_VUC: "Khu vực", THIET_BI: "Thiết bị" }}
                  />
                </select>
              </Field>
              {type === "THIET_BI" && (
                <fieldset disabled={pending}>
                  <EquipmentPicker
                    value={device}
                    onChange={setDevice}
                    initialId={params.get("ma_thiet_bi")}
                  />
                </fieldset>
              )}
              <Field label="Mô tả" name="mo_ta" maxLength={255} />
              <button className="primary" disabled={pending}>
                Tạo vị trí và mã QR
              </button>
            </fieldset>
          </form>
          <h2>Danh sách vị trí</h2>
          {resource.loading && <Loading />}
          <ErrorBox error={resource.error} />
          <ul className="location-list">
            {resource.result?.data.map((l) => (
              <li key={l.ma_vi_tri_qr}>
                <strong>{l.ten_vi_tri}</strong>
                <small>
                  {l.dang_hoat_dong ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                </small>
                {l.ma_thiet_bi && (
                  <p>
                    <Link to={`/quan-tri/thiet-bi/${l.ma_thiet_bi}`}>
                      {l.ma_tai_san} · {l.ten_thiet_bi}
                    </Link>
                  </p>
                )}
                <div className="actions">
                  <button
                    onClick={() => {
                      setSelected(l);
                      setConfirmation(null);
                    }}
                    disabled={!l.dang_hoat_dong}
                  >
                    Xem QR
                  </button>
                  <button
                    disabled={pending}
                    onClick={() =>
                      change(() =>
                        getJson(`/vi_tri_qr/${l.ma_vi_tri_qr}`, {
                          method: "PATCH",
                          body: {
                            dang_hoat_dong: !l.dang_hoat_dong,
                            phien_ban: l.phien_ban,
                          },
                        }),
                      )
                    }
                  >
                    {l.dang_hoat_dong ? "Vô hiệu hóa" : "Kích hoạt"}
                  </button>
                  {l.loai === "THIET_BI" && (
                    <button
                      disabled={pending}
                      onClick={() => {
                        setEditingLink(l);
                        setSelected(null);
                        setConfirmation(null);
                      }}
                    >
                      Liên kết thiết bị
                    </button>
                  )}
                  <button
                    disabled={pending || !l.dang_hoat_dong}
                    onClick={() => setConfirmation(l)}
                  >
                    Thay mã
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {resource.result?.data.length === 0 && <p>Chưa có vị trí nào.</p>}
          {resource.result && (
            <div className="actions">
              <button
                disabled={resource.loading || resource.result.page <= 1}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set("page", String(resource.result.page - 1));
                  setParams(next);
                }}
              >
                Trang vị trí trước
              </button>
              <span>
                {resource.result.total} vị trí · Trang {resource.result.page}
              </span>
              <button
                disabled={
                  resource.loading ||
                  resource.result.page * 20 >= resource.result.total
                }
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set("page", String(resource.result.page + 1));
                  setParams(next);
                }}
              >
                Trang vị trí sau
              </button>
            </div>
          )}
        </section>
        <div>
          {editingLink && (
            <QrLinkEditor
              key={`${editingLink.ma_vi_tri_qr}:${editingLink.phien_ban}`}
              location={editingLink}
              onSaved={() => {
                setEditingLink(null);
                resource.reload();
              }}
              onClose={() => {
                setEditingLink(null);
                resource.reload();
              }}
            />
          )}
          {confirmation && (
            <section className="card no-print" role="alert">
              <h2>Thay QR: {confirmation.ten_vi_tri}?</h2>
              <p>Mã đã in sẽ mất hiệu lực. Bạn cần in và dán mã mới.</p>
              <div className="actions">
                <button
                  className="danger"
                  disabled={pending}
                  onClick={() =>
                    change(() =>
                      getJson(
                        `/vi_tri_qr/${confirmation.ma_vi_tri_qr}/sinh_lai_qr`,
                        {
                          method: "POST",
                          body: { phien_ban: confirmation.phien_ban },
                        },
                      ),
                    )
                  }
                >
                  Xác nhận thay mã
                </button>
                <button onClick={() => setConfirmation(null)}>Hủy</button>
              </div>
            </section>
          )}
          {selected ? (
            <QrCard key={selected.token_qr} location={selected} />
          ) : editingLink ? null : (
            <div className="card no-print">
              <h2>In mã tại vị trí</h2>
              <p className="muted">
                Chọn “Xem QR” để xem trước, tải ảnh hoặc in mã dán.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

## 9. frontend/src/features/incidents/PublicReports.jsx

Thay toàn bộ.

```jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { useReportDraft } from "../../shared/use-report-draft.js";
import { useAuth } from "../auth/Auth.jsx";
import {
  Badge,
  categories,
  ErrorBox,
  Field,
  ImagesInput,
  Loading,
  Options,
  Timeline,
  useResource,
} from "../../shared/ui.jsx";
export function Portal() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">CỔNG DỊCH VỤ CHUNG CƯ</p>
        <h1>
          Một phản ánh.
          <br />
          Một không gian sống tốt hơn.
        </h1>
        <p>
          Gửi sự cố ngay tại vị trí, theo dõi tiến độ xử lý và kết nối với Ban
          quản lý.
        </p>
        <div className="actions">
          <Link className="button primary" to="/quet-qr">
            Quét QR để phản ánh
          </Link>
          <Link className="button" to="/tra-cuu">
            Tra cứu tiến độ
          </Link>
        </div>
      </section>
      <div className="three-columns">
        {[
          [
            "01",
            "Quét mã tại vị trí",
            "Dùng camera điện thoại quét mã QR tại khu vực hoặc thiết bị.",
          ],
          [
            "02",
            "Mô tả sự cố",
            "Chọn loại sự cố, nhập thông tin liên hệ và ảnh hiện trường.",
          ],
          [
            "03",
            "Theo dõi xử lý",
            "Giữ mã tra cứu riêng để theo dõi tiến độ cùng số điện thoại.",
          ],
        ].map(([n, t, d]) => (
          <article className="card" key={n}>
            <span className="step">{n}</span>
            <h2>{t}</h2>
            <p className="muted">{d}</p>
          </article>
        ))}
      </div>
      <p className="note">
        Không cần tài khoản để gửi phản ánh qua QR. Trường hợp nguy hiểm tức
        thời, hãy liên hệ trực tiếp Ban quản lý hoặc cơ quan khẩn cấp.
      </p>
    </>
  );
}
export function Scanner() {
  const navigate = useNavigate(),
    [error, setError] = useState(),
    [running, setRunning] = useState(false);
  const scanner = useRef(),
    mounted = useRef(true);
  function open(value) {
    const url = new URL(value, window.location.origin);
    if (
      url.origin !== window.location.origin ||
      !/^\/r\/[0-9a-f-]{36}$/i.test(url.pathname)
    )
      throw new Error("Mã QR không thuộc hệ thống này.");
    navigate(url.pathname);
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (scanner.current?.isScanning) scanner.current.stop().catch(() => {});
    };
  }, []);
  async function start() {
    setError(null);
    if (!window.isSecureContext) {
      setError(
        new Error(
          "Không mở được camera vì địa chỉ HTTP qua IP mạng nội bộ chưa có kết nối bảo mật. Hãy dùng HTTPS đã được thiết bị tin cậy, hoặc dùng ứng dụng Camera điện thoại quét mã QR đang hiển thị trên máy tính.",
        ),
      );
      return;
    }
    setRunning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!mounted.current) return;
      scanner.current = new Html5Qrcode("qr-reader");
      await scanner.current.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: 220 },
        (value) => {
          try {
            open(value);
          } catch (err) {
            if (mounted.current) setError(err);
          }
        },
        () => {},
      );
      if (!mounted.current && scanner.current.isScanning)
        await scanner.current.stop();
    } catch {
      if (mounted.current) {
        setRunning(false);
        setError(
          new Error(
            "Không mở được camera. Hãy cấp quyền và dùng HTTPS, hoặc quét mã bằng camera điện thoại rồi mở liên kết.",
          ),
        );
      }
    }
  }
  return (
    <section className="card narrow">
      <h1>Quét mã QR</h1>
      <p>Đưa camera hướng về mã QR của vị trí cần phản ánh.</p>
      <div id="qr-reader" />
      {!running && (
        <button className="primary" onClick={start}>
          Mở camera
        </button>
      )}
      <ErrorBox error={error} />
      <hr />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            open(new FormData(e.currentTarget).get("url"));
          } catch (err) {
            setError(err);
          }
        }}
      >
        <Field
          label="Hoặc dán liên kết QR của tòa nhà"
          name="url"
          type="text"
          required
          placeholder="/r/…"
        />
        <button>Mở biểu mẫu</button>
      </form>
    </section>
  );
}
export function SubmitReport() {
  const { token } = useParams(),
    { user, loading: authLoading } = useAuth(),
    resource = useResource(`/cong_khai/vi_tri_qr/${encodeURIComponent(token)}`);
  const form = useRef(null);
  const draft = useReportDraft(token, user?.ma_nguoi_dung);
  const [error, setError] = useState(),
    [pending, setPending] = useState(false),
    [receipt, setReceipt] = useState(),
    [confirmed, setConfirmed] = useState(false),
    [copy, setCopy] = useState("");
  if (resource.loading || authLoading) return <Loading />;
  if (resource.error)
    return (
      <div className="card">
        <h1>Không mở được vị trí</h1>
        <ErrorBox error={resource.error} />
        <Link to="/quet-qr">Quét mã khác</Link>
      </div>
    );
  if (receipt)
    return (
      <section className="card narrow">
        <p className="eyebrow">ĐÃ TIẾP NHẬN</p>
        <h1>Cảm ơn bạn đã phản ánh</h1>
        <p>Ban quản lý sẽ kiểm tra và phân công xử lý.</p>
        <Field label="Mã tra cứu riêng">
          <textarea readOnly value={receipt.ma_tra_cuu} rows={3} />
        </Field>
        <p className="muted">
          Lưu mã này và dùng cùng số điện thoại đã nhập. Không chia sẻ mã công
          khai.
        </p>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(receipt.ma_tra_cuu);
              setCopy("Đã sao chép mã.");
            } catch {
              setCopy("Hãy chọn và sao chép mã trong ô phía trên.");
            }
          }}
        >
          Sao chép mã
        </button>
        <p role="status">{copy}</p>
        <Link
          className="button primary"
          to="/tra-cuu"
          state={{ code: receipt.ma_tra_cuu }}
        >
          Tra cứu tiến độ
        </Link>
      </section>
    );
  return (
    <section className="card narrow">
      <p className="eyebrow">PHẢN ÁNH TẠI VỊ TRÍ</p>
      <h1>{resource.result.data.ten_vi_tri}</h1>
      {resource.result.data.thiet_bi && (
        <p className="note">
          Thiết bị: {resource.result.data.thiet_bi.ma_tai_san} ·{" "}
          {resource.result.data.thiet_bi.ten_thiet_bi}
        </p>
      )}
      <p className="muted">{resource.result.data.mo_ta}</p>
      {draft.restored && (
        <p className="note" role="status">
          Đã khôi phục nội dung bản nháp. Nếu trước đó đã chọn ảnh, hãy chọn lại
          ảnh trước khi gửi.
        </p>
      )}
      {draft.warning && (
        <p className="note" role="status">
          {draft.warning}
        </p>
      )}
      <form
        ref={form}
        onInput={(event) => draft.save(event.currentTarget)}
        onSubmit={async (e) => {
          e.preventDefault();
          draft.save(e.currentTarget);
          const data = new FormData(e.currentTarget);
          data.set("token_qr", token);
          if (resource.result.data.phien_ban_qr !== undefined)
            data.set("phien_ban_qr", String(resource.result.data.phien_ban_qr));
          data.set("khoa_yeu_cau", draft.requestKey);
          if (confirmed) data.set("xac_nhan_gui", "true");
          setPending(true);
          setError(null);
          try {
            const result = await getJson("/cong_khai/phan_anh", {
              method: "POST",
              body: data,
            });
            draft.clear();
            setReceipt(result.data);
          } catch (err) {
            setError(err);
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="Loại sự cố">
          <select
            name="loai_su_co"
            required
            defaultValue={draft.values.loai_su_co || "DIEN"}
          >
            <Options values={categories} />
          </select>
        </Field>
        <Field
          label="Tiêu đề"
          name="tieu_de"
          defaultValue={draft.values.tieu_de || ""}
          required
          minLength={3}
          maxLength={150}
          placeholder="Ví dụ: Đèn hành lang không sáng"
        />
        <Field label="Mô tả chi tiết">
          <textarea
            name="noi_dung"
            defaultValue={draft.values.noi_dung || ""}
            required
            minLength={10}
            maxLength={5000}
            rows={4}
          />
        </Field>
        <ImagesInput
          disabled={pending}
          onBeforeChoose={() => draft.save(form.current)}
        />
        <div className="form-grid">
          <Field
            label="Họ tên"
            name="ten_nguoi_gui"
            defaultValue={draft.values.ten_nguoi_gui ?? user?.ho_va_ten ?? ""}
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
          />
          <Field
            label="Số điện thoại"
            name="so_dien_thoai"
            type="tel"
            defaultValue={
              draft.values.so_dien_thoai ?? user?.so_dien_thoai ?? ""
            }
            required
            autoComplete="tel"
          />
        </div>
        <Field
          label="Căn hộ (tùy chọn)"
          name="can_ho_khai_bao"
          defaultValue={draft.values.can_ho_khai_bao || ""}
          maxLength={40}
        />
        <small className="muted">
          Thông tin căn hộ do người gửi khai báo, chưa được xác minh.
        </small>
        <ErrorBox error={error} />
        {error?.code === "SIMILAR_REPORT" && (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Tôi vẫn muốn gửi phản ánh riêng
          </label>
        )}
        <button
          className="primary full"
          disabled={pending || (error?.code === "SIMILAR_REPORT" && !confirmed)}
        >
          {pending ? "Đang gửi…" : "Gửi phản ánh"}
        </button>
      </form>
    </section>
  );
}
export function LookupReport({ initialCode = "" }) {
  const [result, setResult] = useState(),
    [error, setError] = useState(),
    [pending, setPending] = useState(false);
  return (
    <section className="card narrow">
      <p className="eyebrow">THEO DÕI TIẾN ĐỘ</p>
      <h1>Tra cứu phản ánh</h1>
      <p className="muted">
        Nhập mã được cấp khi gửi và số điện thoại tương ứng.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          setResult(null);
          try {
            setResult(
              (
                await getJson("/cong_khai/phan_anh/tra_cuu", {
                  method: "POST",
                  body: Object.fromEntries(new FormData(e.currentTarget)),
                })
              ).data,
            );
          } catch (err) {
            setError(err);
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="Mã tra cứu">
          <textarea
            name="ma_tra_cuu"
            defaultValue={initialCode}
            required
            minLength={64}
            maxLength={64}
            rows={3}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <Field
          label="Số điện thoại"
          name="so_dien_thoai"
          type="tel"
          required
          autoComplete="tel"
        />
        <ErrorBox error={error} />
        <button className="primary" disabled={pending}>
          {pending ? "Đang tra cứu…" : "Tra cứu"}
        </button>
      </form>
      {result && (
        <div className="lookup-result">
          <h2>{result.ten_vi_tri}</h2>
          <Badge status={result.trang_thai} />
          <Timeline items={result.lich_su} />
        </div>
      )}
    </section>
  );
}
```

## 10. frontend/src/features/incidents/Reports.jsx

Thay toàn bộ.

```jsx
import React, { useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { useAuth } from "../auth/Auth.jsx";
import {
  Badge,
  categories,
  date,
  ErrorBox,
  Field,
  ImagesInput,
  Loading,
  Options,
  priorities,
  statuses,
  Timeline,
  useResource,
} from "../../shared/ui.jsx";
export const reportBase = (user) =>
  user.vai_tro === "QUAN_TRI_VIEN"
    ? "/quan-tri/phan-anh"
    : user.vai_tro === "KY_THUAT_VIEN"
      ? "/ky-thuat/cong-viec"
      : "/cu-dan/phan-anh";
function ReportTable({ items, base, search = "" }) {
  if (!items.length)
    return (
      <div className="empty">
        <h2>Chưa có phản ánh</h2>
        <p>Không có phản ánh trong phạm vi hoặc bộ lọc hiện tại.</p>
      </div>
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Phản ánh</th>
            <th>Trạng thái</th>
            <th>Phụ trách</th>
            <th>Ngày gửi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.ma_phan_anh}>
              <td>
                <Link to={`${base}/${r.ma_phan_anh}`} state={{ search }}>
                  #{r.ma_phan_anh} · {r.tieu_de}
                </Link>
                <small>
                  {r.ten_vi_tri} · {categories[r.loai_su_co]} ·{" "}
                  {priorities[r.do_uu_tien]}
                </small>
              </td>
              <td>
                <Badge status={r.trang_thai} />
              </td>
              <td>{r.ten_ky_thuat_vien || "Chưa phân công"}</td>
              <td>{date(r.ngay_tao)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ReportList() {
  const { user } = useAuth(),
    [params, setParams] = useSearchParams();
  const resource = useResource(`/phan_anh?${params}`);
  const base = reportBase(user),
    title =
      user.vai_tro === "KY_THUAT_VIEN"
        ? "Công việc của tôi"
        : user.vai_tro === "CU_DAN"
          ? "Phản ánh của tôi"
          : "Bàn làm việc phản ánh";
  function filter(k, v) {
    const next = new URLSearchParams(params);
    next.set(k, v);
    next.delete("page");
    setParams(next, { replace: true });
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TIẾP NHẬN & XỬ LÝ</p>
          <h1>{title}</h1>
        </div>
        {user.vai_tro === "CU_DAN" && (
          <Link className="button primary" to="/quet-qr">
            Gửi phản ánh qua QR
          </Link>
        )}
      </div>
      <section className="card">
        {params.get("ma_thiet_bi") && (
          <p>
            Đang lọc theo thiết bị được ghi nhận lúc gửi phản ánh.{" "}
            <button
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("ma_thiet_bi");
                next.delete("page");
                setParams(next);
              }}
            >
              Bỏ lọc thiết bị
            </button>
          </p>
        )}
        <div className="filters">
          <Field label="Tìm tiêu đề hoặc vị trí">
            <input
              type="search"
              value={params.get("q") || ""}
              onChange={(e) => filter("q", e.target.value)}
              placeholder="Tìm phản ánh…"
            />
          </Field>
          <Field label="Trạng thái">
            <select
              value={params.get("trang_thai") || ""}
              onChange={(e) => filter("trang_thai", e.target.value)}
            >
              <Options
                values={{ DANG_MO: "Đang mở (chưa đóng)", ...statuses }}
                empty="Tất cả trạng thái"
              />
            </select>
          </Field>
          <Field label="Loại sự cố">
            <select
              value={params.get("loai_su_co") || ""}
              onChange={(e) => filter("loai_su_co", e.target.value)}
            >
              <Options values={categories} empty="Tất cả loại" />
            </select>
          </Field>
        </div>
        {resource.loading && <Loading />}
        <ErrorBox error={resource.error} />
        {resource.result && (
          <>
            <ReportTable
              items={resource.result.data}
              base={base}
              search={params.toString()}
            />
            <div className="pagination">
              <button
                disabled={resource.result.meta.page <= 1}
                onClick={() =>
                  setParams((p) => {
                    const n = new URLSearchParams(p);
                    n.set("page", resource.result.meta.page - 1);
                    return n;
                  })
                }
              >
                Trước
              </button>
              <span>
                Trang {resource.result.meta.page} · {resource.result.meta.total}{" "}
                phản ánh
              </span>
              <button
                disabled={
                  resource.result.meta.page * 20 >= resource.result.meta.total
                }
                onClick={() =>
                  setParams((p) => {
                    const n = new URLSearchParams(p);
                    n.set("page", resource.result.meta.page + 1);
                    return n;
                  })
                }
              >
                Sau
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
export function ReportDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    location = useLocation(),
    resource = useResource(`/phan_anh/${id}`);
  const [error, setError] = useState(),
    [pending, setPending] = useState(false);
  const r = resource.result?.data;
  async function mutate(path, body) {
    setPending(true);
    setError(null);
    try {
      await getJson(`/phan_anh/${id}/${path}`, { method: "PATCH", body });
      resource.reload();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <Link
        className="back"
        to={`${reportBase(user)}${location.state?.search ? "?" + location.state.search : ""}`}
      >
        ← Về danh sách
      </Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      {r && (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">PHẢN ÁNH #{r.ma_phan_anh}</p>
              <h1>{r.tieu_de}</h1>
            </div>
            <Badge status={r.trang_thai} />
          </div>
          <div className="detail-grid">
            <div>
              <section className="card">
                <h2>{r.ten_vi_tri}</h2>
                {r.ma_thiet_bi && (
                  <div className="note">
                    <p>
                      Thiết bị lúc gửi: {r.ma_tai_san_luc_gui} ·{" "}
                      {r.ten_thiet_bi_luc_gui}
                    </p>
                    <p>{r.vi_tri_thiet_bi_luc_gui}</p>
                    {user.vai_tro === "QUAN_TRI_VIEN" && (
                      <Link to={`/quan-tri/thiet-bi/${r.ma_thiet_bi}`}>
                        Mở hồ sơ thiết bị
                      </Link>
                    )}
                  </div>
                )}
                <div className="tags">
                  <span>{categories[r.loai_su_co]}</span>
                  <span>Ưu tiên: {priorities[r.do_uu_tien]}</span>
                </div>
                <p className="pre-wrap">{r.noi_dung}</p>
                <dl className="metadata">
                  <dt>Người gửi</dt>
                  <dd>{r.ten_nguoi_gui}</dd>
                  <dt>Số điện thoại</dt>
                  <dd>{r.so_dien_thoai_nguoi_gui}</dd>
                  <dt>Căn hộ khai báo</dt>
                  <dd>{r.can_ho_khai_bao || "Không cung cấp"}</dd>
                  <dt>Ngày tiếp nhận</dt>
                  <dd>{date(r.ngay_tao)}</dd>
                  <dt>Kỹ thuật viên</dt>
                  <dd>{r.ten_ky_thuat_vien || "Chưa phân công"}</dd>
                </dl>
                {["PHAN_ANH", "NGHIEM_THU"].map((type) => (
                  <React.Fragment key={type}>
                    <h3>
                      {type === "PHAN_ANH"
                        ? "Ảnh hiện trường"
                        : "Ảnh nghiệm thu"}
                    </h3>
                    <div className="image-grid">
                      {r.hinh_anh
                        .filter((img) => img.loai === type)
                        .map((img) => (
                          <a
                            key={img.ma_hinh_anh_phan_anh}
                            href={`/api/phan_anh/${id}/hinh_anh/${img.ma_hinh_anh_phan_anh}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img
                              loading="lazy"
                              src={`/api/phan_anh/${id}/hinh_anh/${img.ma_hinh_anh_phan_anh}`}
                              alt={`${type === "PHAN_ANH" ? "Hiện trường" : "Nghiệm thu"} · lượt ${img.luot_xu_ly}`}
                            />
                          </a>
                        ))}
                    </div>
                    {!r.hinh_anh.some((img) => img.loai === type) && (
                      <p className="muted">Chưa có ảnh.</p>
                    )}
                  </React.Fragment>
                ))}
              </section>
              <section className="card">
                <h2>Lịch sử xử lý</h2>
                <Timeline items={r.lich_su} />
              </section>
            </div>
            <section className="card action-panel">
              <h2>Thao tác</h2>
              <ErrorBox error={error} />
              {error?.status === 409 && (
                <button
                  onClick={() => {
                    resource.reload();
                    setError(null);
                  }}
                >
                  Tải lại dữ liệu mới nhất
                </button>
              )}
              {user.vai_tro === "QUAN_TRI_VIEN" &&
                ["MOI", "DA_PHAN_CONG", "DANG_XU_LY"].includes(
                  r.trang_thai,
                ) && (
                  <Assignment
                    key={`assign-${r.phien_ban}`}
                    report={r}
                    pending={pending}
                    onSubmit={(body) => mutate("phan_cong", body)}
                  />
                )}
              {user.vai_tro === "QUAN_TRI_VIEN" &&
                ["MOI", "DA_XU_LY"].includes(r.trang_thai) && (
                  <AdminDecision
                    key={`decision-${r.phien_ban}`}
                    report={r}
                    pending={pending}
                    onSubmit={(body) => mutate("trang_thai", body)}
                  />
                )}
              {user.vai_tro === "KY_THUAT_VIEN" &&
                r.trang_thai === "DA_PHAN_CONG" && (
                  <>
                    <p>Bắt đầu khi bạn sẵn sàng xử lý tại hiện trường.</p>
                    <button
                      className="primary"
                      disabled={pending}
                      onClick={() =>
                        mutate("trang_thai", {
                          phien_ban: r.phien_ban,
                          trang_thai: "DANG_XU_LY",
                        })
                      }
                    >
                      Bắt đầu xử lý
                    </button>
                  </>
                )}
              {user.vai_tro === "KY_THUAT_VIEN" &&
                r.trang_thai === "DANG_XU_LY" && (
                  <form
                    key={r.phien_ban}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const data = new FormData(e.currentTarget);
                      data.set("phien_ban", r.phien_ban);
                      data.set("trang_thai", "DA_XU_LY");
                      mutate("trang_thai", data);
                    }}
                  >
                    <Field label="Kết quả xử lý (bắt buộc)">
                      <textarea
                        name="ghi_chu"
                        required
                        maxLength={500}
                        rows={4}
                      />
                    </Field>
                    <Field label="Phản hồi công khai (tùy chọn)">
                      <textarea
                        name="noi_dung_cong_khai"
                        maxLength={500}
                        rows={3}
                      />
                    </Field>
                    <p className="muted">
                      Cần ảnh nghiệm thu mới của lượt xử lý hiện tại.
                    </p>
                    <ImagesInput />
                    <button className="primary" disabled={pending}>
                      Hoàn thành và gửi nghiệm thu
                    </button>
                  </form>
                )}
              {(user.vai_tro === "CU_DAN" ||
                ["DA_DONG", "TU_CHOI", "TRUNG"].includes(r.trang_thai) ||
                (user.vai_tro === "KY_THUAT_VIEN" &&
                  r.trang_thai === "DA_XU_LY")) && (
                <p className="muted">
                  {r.trang_thai === "DA_XU_LY"
                    ? "Kết quả đã gửi, đang chờ Ban quản lý nghiệm thu."
                    : "Không có thao tác cập nhật ở trạng thái này."}
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
function Assignment({ report: r, pending, onSubmit }) {
  const resource = useResource("/nguoi_dung");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...Object.fromEntries(new FormData(e.currentTarget)),
          phien_ban: r.phien_ban,
        });
      }}
    >
      <h3>
        {r.trang_thai === "MOI"
          ? "Phân công kỹ thuật viên"
          : "Điều chỉnh phân công"}
      </h3>
      <ErrorBox error={resource.error} />
      <Field label="Kỹ thuật viên">
        <select
          name="ma_ky_thuat_vien"
          required
          defaultValue={r.ma_ky_thuat_vien || ""}
        >
          <option value="">Chọn kỹ thuật viên</option>
          {resource.result?.data
            .filter((u) => u.vai_tro === "KY_THUAT_VIEN" && u.dang_hoat_dong)
            .map((u) => (
              <option value={u.ma_nguoi_dung} key={u.ma_nguoi_dung}>
                {u.ho_va_ten}
              </option>
            ))}
        </select>
      </Field>
      <Field label="Độ ưu tiên">
        <select name="do_uu_tien" defaultValue={r.do_uu_tien}>
          <Options values={priorities} />
        </select>
      </Field>
      <Field label="Ghi chú nội bộ">
        <textarea name="ghi_chu" maxLength={500} rows={2} />
      </Field>
      <button className="primary" disabled={pending || resource.loading}>
        Lưu phân công
      </button>
    </form>
  );
}
function AdminDecision({ report: r, pending, onSubmit }) {
  const options =
    r.trang_thai === "MOI"
      ? { TU_CHOI: "Từ chối", TRUNG: "Gộp vào phản ánh khác" }
      : { DA_DONG: "Nghiệm thu đạt và đóng", DANG_XU_LY: "Trả lại xử lý" };
  const [target, setTarget] = useState(Object.keys(options)[0]);
  return (
    <form
      className="decision"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...Object.fromEntries(new FormData(e.currentTarget)),
          phien_ban: r.phien_ban,
          trang_thai: target,
        });
      }}
    >
      <h3>
        {r.trang_thai === "MOI" ? "Quyết định khác" : "Nghiệm thu kết quả"}
      </h3>
      <Field label="Thao tác">
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <Options values={options} />
        </select>
      </Field>
      {target === "TRUNG" && (
        <Field
          label="Mã số phản ánh gốc (cùng vị trí)"
          name="ma_phan_anh_goc"
          type="number"
          min="1"
          required
        />
      )}
      <Field
        label={target === "DA_DONG" ? "Ghi chú nội bộ" : "Lý do (bắt buộc)"}
      >
        <textarea
          name="ghi_chu"
          required={target !== "DA_DONG"}
          maxLength={500}
          rows={3}
        />
      </Field>
      <Field label="Phản hồi công khai">
        <textarea name="noi_dung_cong_khai" maxLength={500} rows={3} />
      </Field>
      <button
        disabled={pending}
        className={target === "DA_DONG" ? "primary" : "danger"}
      >
        Xác nhận quyết định
      </button>
    </form>
  );
}
```

## 11. frontend/src/features/maintenance/Maintenance.jsx

Thay toàn bộ.

```jsx
import DataTools from "../../shared/DataTools.jsx";
import { EquipmentQrConnections } from "../qr/QrEquipment.jsx";
import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { Field, ErrorBox, Loading, Options } from "../../shared/ui.jsx";
import { newRequestKey } from "../../shared/request-key.js";
import { useAuth } from "../auth/Auth.jsx";
const types = {
  THANG_MAY: "Thang máy",
  MAY_BOM: "Máy bơm",
  PCCC: "PCCC",
  DIEN: "Điện",
  NUOC: "Nước",
  CAMERA: "Camera",
  KHAC: "Khác",
};
const equipmentStates = {
  DANG_SU_DUNG: "Đang sử dụng",
  TAM_DUNG: "Tạm dừng",
  NGUNG_SU_DUNG: "Ngừng sử dụng",
};
const states = {
  MOI: "Chưa phân công",
  DA_PHAN_CONG: "Đã phân công",
  DANG_THUC_HIEN: "Đang thực hiện",
  CHO_NGHIEM_THU: "Chờ nghiệm thu",
  HOAN_THANH: "Hoàn thành",
  HUY: "Đã hủy",
};
const levels = { THUONG: "Bình thường", CAO: "Cao", KHAN_CAP: "Khẩn cấp" };
const schedules = {
  QUA_HAN: "Quá hạn",
  SAP_DEN_HAN: "Sắp / đến hạn",
  CHUA_DEN_HAN: "Chưa đến hạn",
  CHUA_CAU_HINH: "Chưa có lịch",
  NGUNG_THEO_DOI: "Ngừng theo dõi",
};
const events = {
  TAO_THIET_BI: "Tạo thiết bị",
  SUA_THIET_BI: "Sửa thiết bị",
  LAP_PHIEU: "Lập phiếu",
  PHAN_CONG: "Phân công",
  DOI_LICH: "Đổi lịch",
  BAT_DAU: "Bắt đầu",
  BAO_CAO: "Báo cáo kết quả",
  TRA_LAI: "Trả lại thực hiện",
  NGHIEM_THU: "Nghiệm thu",
  HUY: "Hủy phiếu",
};
const day = (x) => (x ? x.split("-").reverse().join("/") : "—");
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const time = (x) =>
  x
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(x.replace(" ", "T") + "Z"))
    : "—";
const code = (id) => `BT${String(id).padStart(6, "0")}`;
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
function useData(path) {
  const [state, setState] = useState({ loading: true }),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ path, revision, loading: true });
    getJson(path, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted)
          setState({ path, revision, result, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ path, revision, error, loading: false });
      });
    return () => controller.abort();
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
      setNotice(
        r.data.replay
          ? "Phiếu đã được tạo trước đó. Đã mở lại đúng phiếu."
          : "Đã lưu thay đổi bảo trì.",
      );
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
function History({ items, title = "Lịch sử thực hiện" }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <ol className="maintenance-history">
        {items.map((h) => (
          <li key={h.ma_lich_su}>
            <div>
              <strong>{events[h.su_kien] || h.su_kien}</strong>
              <time>
                {time(h.ngay_tao)} · {h.ho_va_ten}
              </time>
            </div>
            <p>{h.ghi_chu}</p>
          </li>
        ))}
      </ol>
    </section>
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
function TechnicianSelect({ required = false }) {
  const [q, setQ] = useState(""),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState(""),
    [label, setLabel] = useState(""),
    resource = useData(
      `/bao_tri/ky_thuat_vien?q=${encodeURIComponent(q)}&page=${page}`,
    ),
    matches = resource.result?.data || [];
  return (
    <div className="maintenance-staff">
      <Field label="Tìm kỹ thuật viên theo tên">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </Field>
      <ErrorBox error={resource.error} />
      <Field label="Kỹ thuật viên nhận phiếu">
        <select
          name="ma_ky_thuat_vien"
          required={required}
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            setLabel(e.target.selectedOptions[0].text);
          }}
        >
          <option value="">
            {required ? "Chọn kỹ thuật viên" : "Chưa phân công"}
          </option>
          {selected &&
            !matches.some((u) => String(u.ma_nguoi_dung) === selected) && (
              <option value={selected}>{label}</option>
            )}
          {matches.map((u) => (
            <option key={u.ma_nguoi_dung} value={u.ma_nguoi_dung}>
              {u.ho_va_ten}
              {u.chuyen_mon ? ` · ${u.chuyen_mon}` : ""}
            </option>
          ))}
        </select>
      </Field>
      <div className="actions">
        <button
          type="button"
          disabled={resource.loading || page === 1}
          onClick={() => setPage((n) => n - 1)}
        >
          KTV trang trước
        </button>
        <span>Trang {page}</span>
        <button
          type="button"
          disabled={
            resource.loading || page * 20 >= (resource.result?.total || 0)
          }
          onClick={() => setPage((n) => n + 1)}
        >
          KTV trang sau
        </button>
      </div>
    </div>
  );
}
function EquipmentForm({ initial, action, onSave }) {
  return (
    <form
      key={initial?.phien_ban ?? "new"}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(values(e));
      }}
    >
      <fieldset disabled={action.pending}>
        {!initial ? (
          <Field
            label="Mã tài sản"
            name="ma_tai_san"
            required
            minLength={2}
            maxLength={30}
            pattern="[A-Za-z0-9][A-Za-z0-9_-]{1,29}"
            placeholder="Ví dụ TM-A-01"
          />
        ) : (
          <p>
            Mã tài sản: <strong>{initial.ma_tai_san}</strong>
          </p>
        )}
        <div className="form-grid">
          <Field
            label="Tên thiết bị"
            name="ten_thiet_bi"
            required
            minLength={2}
            maxLength={150}
            defaultValue={initial?.ten_thiet_bi || ""}
          />
          <Field label="Loại thiết bị">
            <select name="loai" defaultValue={initial?.loai || "THANG_MAY"}>
              <Options values={types} />
            </select>
          </Field>
          <Field
            label="Vị trí lắp đặt"
            name="vi_tri"
            required
            minLength={2}
            maxLength={160}
            defaultValue={initial?.vi_tri || ""}
          />
          <Field
            label="Số serial"
            name="so_serial"
            maxLength={100}
            defaultValue={initial?.so_serial || ""}
          />
          <Field
            label="Ngày lắp đặt"
            name="ngay_lap_dat"
            type="date"
            max={today()}
            defaultValue={initial?.ngay_lap_dat || ""}
          />
          <Field label="Trạng thái thiết bị">
            <select
              name="trang_thai"
              defaultValue={initial?.trang_thai || "DANG_SU_DUNG"}
            >
              <Options values={equipmentStates} />
            </select>
          </Field>
        </div>
        <Field label="Ghi chú thiết bị">
          <textarea
            name="ghi_chu"
            rows={3}
            maxLength={1000}
            defaultValue={initial?.ghi_chu || ""}
          />
        </Field>
        <h3>Lịch bảo trì định kỳ</h3>
        <p className="muted">
          Nhập cả chu kỳ và ngày kế tiếp; bỏ trống cả hai nếu chưa lập lịch.
          Ngày kế tiếp cập nhật sau khi BQL nghiệm thu phiếu định kỳ.
        </p>
        <div className="form-grid">
          <Field
            label="Chu kỳ bảo trì (ngày)"
            name="chu_ky_ngay"
            type="number"
            min="1"
            max="3650"
            step="1"
            defaultValue={initial?.chu_ky_ngay || ""}
          />
          <Field
            label="Ngày bảo trì kế tiếp"
            name="ngay_bao_tri_tiep_theo"
            type="date"
            defaultValue={initial?.ngay_bao_tri_tiep_theo || ""}
          />
          <Field
            label="Nhắc trước (ngày)"
            name="nhac_truoc_ngay"
            type="number"
            min="0"
            max="90"
            step="1"
            required
            defaultValue={initial?.nhac_truoc_ngay ?? 7}
          />
        </div>
        <button className="primary">
          {initial ? "Lưu thiết bị" : "Thêm thiết bị"}
        </button>
      </fieldset>
    </form>
  );
}
function NewJob({ equipment, type, action, onSave }) {
  const [key] = useState(newRequestKey);
  return (
    <section className="card narrow">
      <h2>{type === "DINH_KY" ? "Lập phiếu định kỳ" : "Lập phiếu đột xuất"}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...values(e),
            loai: type,
            khoa_yeu_cau: key,
            phien_ban_thiet_bi: equipment.phien_ban,
          });
        }}
      >
        <fieldset disabled={action.pending}>
          {type === "DINH_KY" ? (
            <p>
              Hạn thực hiện:{" "}
              <strong>{day(equipment.ngay_bao_tri_tiep_theo)}</strong> · Chu kỳ{" "}
              {equipment.chu_ky_ngay} ngày.
            </p>
          ) : (
            <>
              <Field
                label="Tiêu đề công việc"
                name="tieu_de"
                required
                minLength={3}
                maxLength={180}
              />
              <Field label="Nội dung cần thực hiện">
                <textarea
                  name="noi_dung"
                  required
                  minLength={3}
                  maxLength={2000}
                  rows={4}
                />
              </Field>
              <Field
                label="Hạn thực hiện"
                name="ngay_den_han"
                type="date"
                required
                defaultValue={today()}
              />
            </>
          )}
          <Field label="Ưu tiên">
            <select name="do_uu_tien" defaultValue="THUONG">
              <Options values={levels} />
            </select>
          </Field>
          <TechnicianSelect />
          <button className="primary">Tạo phiếu bảo trì</button>
        </fieldset>
      </form>
    </section>
  );
}
export function EquipmentList() {
  const [params, setParams] = useSearchParams(),
    resource = useData(`/thiet_bi?${params}`),
    [adding, setAdding] = useState(false),
    action = useAction(),
    navigate = useNavigate(),
    s = resource.result?.summary;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Vận hành thiết bị</p>
          <h1>Thiết bị và lịch bảo trì</h1>
        </div>
        <div className="actions">
          <Link className="button" to="/quan-tri/bao-tri">
            Danh sách phiếu bảo trì
          </Link>
          <button className="primary" onClick={() => setAdding(!adding)}>
            {adding ? "Đóng biểu mẫu" : "Thêm thiết bị"}
          </button>
        </div>
      </div>
      <Feedback action={action} />
      <DataTools
        kind="thiet_bi"
        params={params}
        importable
        disabled={resource.loading}
      />
      {adding && (
        <section className="card">
          <h2>Đăng ký thiết bị</h2>
          <EquipmentForm
            action={action}
            onSave={(body) =>
              action.run("/thiet_bi", "POST", body, (e) =>
                navigate(`/quan-tri/thiet-bi/${e.ma_thiet_bi}`),
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
          label="Tìm mã, tên hoặc vị trí thiết bị"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field label="Lọc loại thiết bị">
          <select name="loai" defaultValue={params.get("loai") || ""}>
            <Options values={types} empty="Tất cả loại" />
          </select>
        </Field>
        <Field label="Lọc trạng thái thiết bị">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options values={equipmentStates} empty="Tất cả trạng thái" />
          </select>
        </Field>
        <Field label="Lọc lịch bảo trì">
          <select name="lich" defaultValue={params.get("lich") || ""}>
            <option value="">Tất cả lịch</option>
            <option value="QUA_HAN">Quá hạn</option>
            <option value="SAP_DEN_HAN">Sắp / đến hạn</option>
            <option value="CHUA_CAU_HINH">Chưa có lịch</option>
          </select>
        </Field>
        <button>Lọc thiết bị</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      {s && (
        <>
          <p className="muted">
            Trong bộ lọc · Ngày {day(resource.result.ngay_hien_tai)} tại Việt
            Nam
          </p>
          <div className="maintenance-stats">
            <div className="card">
              <span>Thiết bị</span>
              <strong>{s.total}</strong>
            </div>
            <div className="card">
              <span>Sắp / đến hạn</span>
              <strong>{s.sap_den_han}</strong>
            </div>
            <div className="card">
              <span>Quá hạn</span>
              <strong className="maintenance-overdue">{s.qua_han}</strong>
            </div>
          </div>
        </>
      )}
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã / thiết bị</th>
                <th>Vị trí</th>
                <th>Trạng thái</th>
                <th>Bảo trì kế tiếp</th>
                <th>Lịch</th>
                <th>Phiếu định kỳ</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((e) => (
                <tr key={e.ma_thiet_bi}>
                  <td>
                    <Link to={`/quan-tri/thiet-bi/${e.ma_thiet_bi}`}>
                      {e.ma_tai_san}
                    </Link>
                    <small className="maintenance-subtitle">
                      {e.ten_thiet_bi} · {types[e.loai]}
                    </small>
                  </td>
                  <td>{e.vi_tri}</td>
                  <td>{equipmentStates[e.trang_thai]}</td>
                  <td>
                    {day(e.ngay_bao_tri_tiep_theo)}
                    {e.chu_ky_ngay && (
                      <small className="maintenance-subtitle">
                        Mỗi {e.chu_ky_ngay} ngày
                      </small>
                    )}
                  </td>
                  <td>
                    <span
                      className={`maintenance-tag due-${e.tinh_trang_lich}`}
                    >
                      {schedules[e.tinh_trang_lich]}
                    </span>
                  </td>
                  <td>
                    {e.phieu_dinh_ky_dang_mo ? (
                      <Link to={`/quan-tri/bao-tri/${e.phieu_dinh_ky_dang_mo}`}>
                        {code(e.phieu_dinh_ky_dang_mo)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có thiết bị phù hợp.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
export function EquipmentDetail() {
  const { id } = useParams(),
    resource = useData(`/thiet_bi/${id}`),
    e = resource.result?.data,
    [editing, setEditing] = useState(false),
    [creating, setCreating] = useState(""),
    action = useAction(resource.reload),
    navigate = useNavigate();
  return (
    <>
      <Link to="/quan-tri/thiet-bi">← Danh sách thiết bị</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Feedback action={action} />
      {e && (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">{e.ma_tai_san}</p>
              <h1>{e.ten_thiet_bi}</h1>
            </div>
            <button
              disabled={action.pending}
              onClick={() => {
                setEditing(!editing);
                setCreating("");
              }}
            >
              Sửa thiết bị / lịch
            </button>
          </div>
          <section className="card">
            <dl className="maintenance-info">
              <div>
                <dt>Loại / trạng thái</dt>
                <dd>
                  {types[e.loai]} · {equipmentStates[e.trang_thai]}
                </dd>
              </div>
              <div>
                <dt>Vị trí</dt>
                <dd>{e.vi_tri}</dd>
              </div>
              <div>
                <dt>Serial / ngày lắp</dt>
                <dd>
                  {e.so_serial || "—"} · {day(e.ngay_lap_dat)}
                </dd>
              </div>
              <div>
                <dt>Ngày bảo trì kế tiếp</dt>
                <dd>
                  {day(e.ngay_bao_tri_tiep_theo)} ·{" "}
                  <span className={`maintenance-tag due-${e.tinh_trang_lich}`}>
                    {schedules[e.tinh_trang_lich]}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Chu kỳ / nhắc trước</dt>
                <dd>
                  {e.chu_ky_ngay
                    ? `${e.chu_ky_ngay} ngày · nhắc trước ${e.nhac_truoc_ngay} ngày`
                    : "Chưa có lịch định kỳ"}
                </dd>
              </div>
            </dl>
            {e.ghi_chu && <p className="maintenance-text">{e.ghi_chu}</p>}
            <div className="actions">
              <Link
                className="button"
                to={`/quan-tri/bao-tri?ma_thiet_bi=${id}`}
              >
                Xem phiếu và lịch sử bảo trì
              </Link>
              {e.trang_thai !== "NGUNG_SU_DUNG" && (
                <>
                  <button
                    disabled={
                      !e.chu_ky_ngay ||
                      !!e.phieu_dinh_ky_dang_mo ||
                      action.pending
                    }
                    onClick={() => {
                      setCreating("DINH_KY");
                      setEditing(false);
                    }}
                  >
                    Lập phiếu định kỳ
                  </button>
                  <button
                    disabled={action.pending}
                    onClick={() => {
                      setCreating("DOT_XUAT");
                      setEditing(false);
                    }}
                  >
                    Lập phiếu đột xuất
                  </button>
                </>
              )}
              {e.phieu_dinh_ky_dang_mo && (
                <Link to={`/quan-tri/bao-tri/${e.phieu_dinh_ky_dang_mo}`}>
                  Phiếu định kỳ đang mở: {code(e.phieu_dinh_ky_dang_mo)}
                </Link>
              )}
            </div>
          </section>
          <EquipmentQrConnections key={e.ma_thiet_bi} id={e.ma_thiet_bi} />
          {editing && (
            <section className="card">
              <h2>Sửa thông tin và lịch</h2>
              <EquipmentForm
                initial={e}
                action={action}
                onSave={(body) =>
                  action.run(
                    `/thiet_bi/${id}`,
                    "PUT",
                    { ...body, phien_ban: e.phien_ban },
                    () => setEditing(false),
                  )
                }
              />
            </section>
          )}
          {creating && (
            <NewJob
              key={creating}
              equipment={e}
              type={creating}
              action={action}
              onSave={(body) =>
                action.run(`/thiet_bi/${id}/phieu_bao_tri`, "POST", body, (j) =>
                  navigate(`/quan-tri/bao-tri/${j.ma_phieu_bao_tri}`),
                )
              }
            />
          )}
          <History items={e.history} title="Lịch sử thông tin thiết bị" />
        </>
      )}
    </>
  );
}
export function MaintenanceList() {
  const { user } = useAuth(),
    isAdmin = user.vai_tro === "QUAN_TRI_VIEN",
    base = isAdmin ? "/quan-tri/bao-tri" : "/ky-thuat/bao-tri",
    [params, setParams] = useSearchParams(),
    resource = useData(`/bao_tri?${params}`);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Theo dõi thực hiện</p>
          <h1>{isAdmin ? "Phiếu bảo trì thiết bị" : "Bảo trì được giao"}</h1>
        </div>
        {isAdmin && (
          <Link className="button" to="/quan-tri/thiet-bi">
            Thiết bị và lịch
          </Link>
        )}
      </div>
      {isAdmin && (
        <DataTools kind="bao_tri" params={params} disabled={resource.loading} />
      )}
      <p className="muted">
        {isAdmin
          ? "Lập phiếu từ trang thiết bị. Phiếu định kỳ cập nhật lịch tiếp theo khi BQL nghiệm thu đạt."
          : "Chỉ hiển thị phiếu hiện đang được giao cho bạn. Báo cáo kết quả để BQL nghiệm thu."}
      </p>
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams({
            ...values(e),
            ...(params.get("ma_thiet_bi")
              ? { ma_thiet_bi: params.get("ma_thiet_bi") }
              : {}),
          });
        }}
      >
        <Field
          label="Tìm phiếu, mã hoặc tên thiết bị"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field label="Trạng thái phiếu">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options values={states} empty="Tất cả trạng thái" />
          </select>
        </Field>
        <Field label="Loại phiếu">
          <select name="loai" defaultValue={params.get("loai") || ""}>
            <option value="">Tất cả loại</option>
            <option value="DINH_KY">Định kỳ</option>
            <option value="DOT_XUAT">Đột xuất</option>
          </select>
        </Field>
        <Field label="Hạn thực hiện">
          <select name="qua_han" defaultValue={params.get("qua_han") || "0"}>
            <option value="0">Tất cả hạn</option>
            <option value="1">Chỉ phiếu quá hạn</option>
          </select>
        </Field>
        <button>Lọc phiếu</button>
      </form>
      {params.get("ma_thiet_bi") && (
        <p className="note">
          Đang lọc riêng một thiết bị. <Link to={base}>Xem mọi thiết bị</Link>
        </p>
      )}
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Phiếu</th>
                <th>Thiết bị</th>
                <th>Hạn / ưu tiên</th>
                <th>Trạng thái</th>
                <th>Kỹ thuật viên</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((j) => (
                <tr key={j.ma_phieu_bao_tri}>
                  <td>
                    <Link to={`${base}/${j.ma_phieu_bao_tri}`}>
                      {code(j.ma_phieu_bao_tri)}
                    </Link>
                    <small className="maintenance-subtitle">{j.tieu_de}</small>
                  </td>
                  <td>
                    {j.ma_tai_san}
                    <small className="maintenance-subtitle">
                      {j.ten_thiet_bi_luc_lap}
                    </small>
                  </td>
                  <td>
                    {day(j.ngay_den_han)} · {levels[j.do_uu_tien]}
                    {j.qua_han === 1 && (
                      <span className="maintenance-tag due-QUA_HAN">
                        Quá hạn
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`maintenance-tag work-${j.trang_thai}`}>
                      {states[j.trang_thai]}
                    </span>
                  </td>
                  <td>{j.ky_thuat_vien || "Chưa phân công"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có phiếu phù hợp.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
function ActionForm({ title, button, action, onSubmit, children }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(values(e));
        }}
      >
        <fieldset disabled={action.pending}>
          {children}
          <button className="primary">{button}</button>
        </fieldset>
      </form>
    </section>
  );
}
export function MaintenanceDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    isAdmin = user.vai_tro === "QUAN_TRI_VIEN",
    base = isAdmin ? "/quan-tri/bao-tri" : "/ky-thuat/bao-tri",
    resource = useData(`/bao_tri/${id}`),
    j = resource.result?.data,
    action = useAction(resource.reload);
  const run = (name, body = {}) =>
    action.run(`/bao_tri/${id}/${name}`, "POST", {
      ...body,
      phien_ban: j.phien_ban,
    });
  const open = j && !["HOAN_THANH", "HUY"].includes(j.trang_thai);
  return (
    <>
      <Link to={base}>← Danh sách phiếu bảo trì</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Feedback action={action} />
      {j && (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {code(j.ma_phieu_bao_tri)} ·{" "}
                {j.loai === "DINH_KY" ? "Định kỳ" : "Đột xuất"}
              </p>
              <h1>{j.tieu_de}</h1>
            </div>
            <span className={`maintenance-tag work-${j.trang_thai}`}>
              {states[j.trang_thai]}
            </span>
          </div>
          <section className="card">
            <dl className="maintenance-info">
              <div>
                <dt>Thiết bị lúc lập phiếu</dt>
                <dd>
                  {j.ma_tai_san} · {j.ten_thiet_bi_luc_lap}
                </dd>
              </div>
              <div>
                <dt>Vị trí lúc lập</dt>
                <dd>{j.vi_tri_luc_lap}</dd>
              </div>
              <div>
                <dt>Hạn thực hiện</dt>
                <dd>
                  {day(j.ngay_den_han)}
                  {j.qua_han && (
                    <span className="maintenance-tag due-QUA_HAN">Quá hạn</span>
                  )}{" "}
                  · {levels[j.do_uu_tien]}
                </dd>
              </div>
              <div>
                <dt>Kỹ thuật viên</dt>
                <dd>{j.ky_thuat_vien || "Chưa phân công"}</dd>
              </div>
              <div>
                <dt>Ngày lập / lượt thực hiện</dt>
                <dd>
                  {day(j.ngay_lap)} · Lượt {j.luot_thuc_hien}
                </dd>
              </div>
            </dl>
            <p className="maintenance-text">{j.noi_dung}</p>
            {(j.ten_hien_tai !== j.ten_thiet_bi_luc_lap ||
              j.vi_tri_hien_tai !== j.vi_tri_luc_lap) && (
              <p className="muted">
                Hiện tại: {j.ten_hien_tai} · {j.vi_tri_hien_tai}
              </p>
            )}
            {isAdmin && (
              <Link to={`/quan-tri/thiet-bi/${j.ma_thiet_bi}`}>
                Mở hồ sơ thiết bị
              </Link>
            )}
          </section>
          {j.ket_qua && (
            <section className="card">
              <h2>Kết quả thực hiện</h2>
              <p>
                Ngày thực hiện: {day(j.ngay_thuc_hien)} · Lượt{" "}
                {j.luot_thuc_hien}
              </p>
              <p className="maintenance-text">{j.ket_qua}</p>
              {j.nhan_xet_nghiem_thu && (
                <p className="note">
                  Nhận xét nghiệm thu: {j.nhan_xet_nghiem_thu}
                </p>
              )}
            </section>
          )}
          {!isAdmin && j.trang_thai === "DA_PHAN_CONG" && (
            <section className="card">
              <h2>Thực hiện công việc</h2>
              <button
                className="primary"
                disabled={action.pending}
                onClick={() => run("bat_dau")}
              >
                Bắt đầu bảo trì
              </button>
            </section>
          )}
          {!isAdmin && j.trang_thai === "DANG_THUC_HIEN" && (
            <ActionForm
              title="Gửi kết quả để nghiệm thu"
              button="Gửi báo cáo bảo trì"
              action={action}
              onSubmit={(body) => run("bao_cao", body)}
            >
              <Field
                label="Ngày thực hiện"
                name="ngay_thuc_hien"
                type="date"
                required
                min={j.ngay_lap}
                max={today()}
                defaultValue={today()}
              />
              <Field label="Kết quả bảo trì">
                <textarea
                  name="ket_qua"
                  required
                  minLength={10}
                  maxLength={4000}
                  rows={6}
                  placeholder="Ghi rõ việc đã làm, tình trạng sau bảo trì và vấn đề còn lại."
                />
              </Field>
            </ActionForm>
          )}
          {isAdmin &&
            ["MOI", "DA_PHAN_CONG", "DANG_THUC_HIEN"].includes(
              j.trang_thai,
            ) && (
              <ActionForm
                title={
                  j.ma_ky_thuat_vien ? "Đổi kỹ thuật viên" : "Giao công việc"
                }
                button="Lưu phân công"
                action={action}
                onSubmit={(body) => run("phan_cong", body)}
              >
                <TechnicianSelect required />
                <Field
                  label="Ghi chú / lý do đổi người"
                  name="ghi_chu"
                  required={!!j.ma_ky_thuat_vien}
                  minLength={j.ma_ky_thuat_vien ? 3 : 0}
                  maxLength={500}
                />
              </ActionForm>
            )}
          {isAdmin && ["MOI", "DA_PHAN_CONG"].includes(j.trang_thai) && (
            <ActionForm
              title="Điều chỉnh lịch thực hiện"
              button="Lưu lịch mới"
              action={action}
              onSubmit={(body) => run("doi_lich", body)}
            >
              <Field
                label="Hạn thực hiện mới"
                name="ngay_den_han"
                type="date"
                required
                defaultValue={j.ngay_den_han}
              />
              <Field
                label="Lý do đổi lịch"
                name="ly_do"
                required
                minLength={3}
                maxLength={500}
              />
            </ActionForm>
          )}
          {isAdmin && j.trang_thai === "CHO_NGHIEM_THU" && (
            <div className="maintenance-action-grid">
              <ActionForm
                title="Nghiệm thu kết quả"
                button="Nghiệm thu đạt"
                action={action}
                onSubmit={(body) => run("nghiem_thu", body)}
              >
                <Field label="Nhận xét nghiệm thu">
                  <textarea
                    name="nhan_xet"
                    required
                    minLength={3}
                    maxLength={1000}
                    rows={4}
                  />
                </Field>
                {j.loai === "DINH_KY" && (
                  <p className="muted">
                    Ngày bảo trì kế tiếp = ngày thực hiện đã nghiệm thu +{" "}
                    {j.chu_ky_ngay} ngày. Hệ thống không tự lập phiếu kỳ sau.
                  </p>
                )}
              </ActionForm>
              <ActionForm
                title="Yêu cầu thực hiện lại"
                button="Trả lại kỹ thuật viên"
                action={action}
                onSubmit={(body) => run("tra_lai", body)}
              >
                <Field label="Lý do chưa đạt">
                  <textarea
                    name="ly_do"
                    required
                    minLength={3}
                    maxLength={1000}
                    rows={4}
                  />
                </Field>
                <p className="muted">
                  Kết quả lượt trước giữ trong lịch sử. Kỹ thuật viên cần gửi
                  báo cáo mới.
                </p>
              </ActionForm>
            </div>
          )}
          {isAdmin && open && (
            <ActionForm
              title="Hủy phiếu"
              button="Hủy phiếu bảo trì"
              action={action}
              onSubmit={(body) => run("huy", body)}
            >
              <Field
                label="Lý do hủy phiếu"
                name="ly_do"
                required
                minLength={3}
                maxLength={500}
              />
              <p className="muted">
                Hủy phiếu không cập nhật ngày bảo trì kế tiếp và không xóa lịch
                sử.
              </p>
            </ActionForm>
          )}
          {j.trang_thai === "HUY" && (
            <p className="note">Lý do hủy: {j.ly_do_huy}</p>
          )}
          <History items={j.history} />
        </>
      )}
    </>
  );
}
```

## 12. backend/test/equipment-qr.test.js

Tạo mới.

```js
import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { pool, rows } from "../src/lib/db.js";

test("equipment QR: versioned links, immutable incident snapshots and private equipment scope", async (t) => {
  assert.equal(process.env.DB_NAME, "chung_cu_test");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const suffix = randomBytes(4).toString("hex"),
    password = randomBytes(16).toString("hex"),
    hash = await bcrypt.hash(password, 10);
  const accounts = [],
    devices = [],
    locations = [],
    reports = [],
    requestKeys = [];
  const ddl = (sql) =>
    execFileSync(
      "docker",
      [
        "compose",
        "exec",
        "-T",
        "db",
        "sh",
        "-c",
        'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -u root chung_cu_test',
      ],
      { input: sql },
    );
  async function request(path, cookie, method = "GET", body, csrf = true) {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(csrf ? { "X-App-Request": "1" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });
    return {
      status: response.status,
      body: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  }
  let admin, tech, otherTech, resident, loc, oldManual, reportB, reportNone;
  async function createLocation(body) {
    const result = await request("/vi_tri_qr", admin, "POST", {
      ten_vi_tri: `QR ${suffix}`,
      loai: "THIET_BI",
      ...body,
    });
    assert.equal(result.status, 201);
    locations.push(result.body.data.ma_vi_tri_qr);
    return result.body.data;
  }
  function form(token, version, extra = {}) {
    const body = new FormData();
    const key = randomUUID();
    requestKeys.push(key);
    for (const [k, v] of Object.entries({
      token_qr: token,
      khoa_yeu_cau: key,
      tieu_de: `Sự cố ${suffix}`,
      noi_dung: "Thiết bị phát tiếng ồn cần kiểm tra ngay.",
      ten_nguoi_gui: "Cư dân kiểm thử",
      so_dien_thoai:
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0"),
      loai_su_co: "DIEN",
      ...(version !== undefined ? { phien_ban_qr: version } : {}),
      ...extra,
    }))
      body.set(k, v);
    return body;
  }
  async function send(body, cookie) {
    const result = await request("/cong_khai/phan_anh", cookie, "POST", body);
    if (result.status === 201) {
      const [row] = await rows(
        pool,
        "SELECT * FROM phan_anh WHERE khoa_yeu_cau=?",
        [body.get("khoa_yeu_cau")],
      );
      reports.push(row.ma_phan_anh);
      result.report = row;
    }
    return result;
  }
  const link = (location, id, version) =>
    request(`/vi_tri_qr/${location.ma_vi_tri_qr}/thiet_bi`, admin, "PUT", {
      ma_thiet_bi: id,
      phien_ban: version,
      xac_nhan_doi_lien_ket: true,
    });
  try {
    for (const role of [
      "QUAN_TRI_VIEN",
      "KY_THUAT_VIEN",
      "KY_THUAT_VIEN",
      "CU_DAN",
    ]) {
      const phone =
        "09" +
        String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
      const row = await rows(
        pool,
        "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
        [suffix, phone, hash, role],
      );
      accounts.push(row.insertId);
      const login = await request("/xac_thuc/dang_nhap", null, "POST", {
        so_dien_thoai: phone,
        mat_khau: password,
      });
      assert.equal(login.status, 200);
      if (role === "QUAN_TRI_VIEN") admin = login.cookie;
      else if (role === "CU_DAN") resident = login.cookie;
      else if (!tech) tech = login.cookie;
      else otherTech = login.cookie;
    }
    for (let i = 0; i < 3; i++) {
      const row = await rows(
        pool,
        "INSERT INTO thiet_bi (ma_tai_san,ten_thiet_bi,loai,vi_tri,so_serial,ghi_chu,trang_thai,ma_nguoi_tao) VALUES (?,?,'DIEN',?,?,?, ?,?)",
        [
          `EQ-${suffix}-${i}`,
          `Thiết bị ${suffix}-${i}`,
          "Hầm xe",
          "PRIVATE-SERIAL",
          "PRIVATE-NOTE",
          i === 2 ? "NGUNG_SU_DUNG" : "DANG_SU_DUNG",
          accounts[0],
        ],
      );
      devices.push(row.insertId);
    }
    loc = await createLocation({ ma_thiet_bi: devices[0] });
    oldManual = await createLocation({ ten_vi_tri: `QR cũ ${suffix}` });
    await t.test(
      "list/detail/link reject guests, other roles and missing CSRF",
      async () => {
        for (const path of ["/vi_tri_qr", `/vi_tri_qr/${loc.ma_vi_tri_qr}`]) {
          assert.equal((await request(path)).status, 401);
          for (const cookie of [tech, otherTech, resident])
            assert.equal((await request(path, cookie)).status, 403);
        }
        const path = `/vi_tri_qr/${loc.ma_vi_tri_qr}/thiet_bi`,
          body = {
            ma_thiet_bi: devices[1],
            phien_ban: 0,
            xac_nhan_doi_lien_ket: true,
          };
        for (const cookie of [tech, resident])
          assert.equal((await request(path, cookie, "PUT", body)).status, 403);
        assert.equal(
          (await request(path, admin, "PUT", body, false)).status,
          403,
        );
      },
    );
    await t.test(
      "creation validates equipment/type and public QR exposes only display fields",
      async () => {
        for (const override of [
          { loai: "KHU_VUC", ma_thiet_bi: devices[0] },
          { ma_thiet_bi: devices[2] },
          { ma_thiet_bi: 4294967295 },
        ])
          assert.equal(
            (
              await request("/vi_tri_qr", admin, "POST", {
                ten_vi_tri: "Vị trí sai",
                loai: "THIET_BI",
                ...override,
              })
            ).status,
            422,
          );
        const publicQr = await request(`/cong_khai/vi_tri_qr/${loc.token_qr}`);
        assert.deepEqual(publicQr.body.data.thiet_bi, {
          ma_tai_san: `EQ-${suffix}-0`,
          ten_thiet_bi: `Thiết bị ${suffix}-0`,
        });
        const json = JSON.stringify(publicQr.body);
        for (const forbidden of [
          "PRIVATE",
          "so_serial",
          "ghi_chu",
          "ma_nguoi_tao",
          "lich_su",
          "ngay_bao_tri",
          "ma_thiet_bi",
        ])
          assert.ok(!json.includes(forbidden));
        assert.equal((await link(loc, devices[1], 99)).status, 409);
        assert.equal(
          (
            await request(
              `/vi_tri_qr/${loc.ma_vi_tri_qr}/thiet_bi`,
              admin,
              "PUT",
              { ma_thiet_bi: devices[1], phien_ban: 0 },
            )
          ).status,
          422,
        );
        const legacy = await send(form(oldManual.token_qr));
        assert.equal(legacy.status, 201);
        assert.equal(legacy.report.ma_thiet_bi, null);
      },
    );
    let retryBody, receipt;
    await t.test(
      "stale forms are rejected; submitted device identity comes only from the locked QR",
      async () => {
        assert.equal((await link(loc, devices[1], 0)).status, 200);
        const stale = await send(form(loc.token_qr, 0));
        assert.equal(stale.status, 409);
        assert.equal(stale.body.error.code, "QR_CHANGED");
        assert.equal(
          (await send(form(loc.token_qr))).body.error.code,
          "QR_CHANGED",
        );
        retryBody = form(loc.token_qr, 1, {
          ma_thiet_bi: devices[0],
          ma_tai_san_luc_gui: "SPOOF",
          ten_thiet_bi_luc_gui: "SPOOF",
        });
        const sent = await send(retryBody);
        assert.equal(sent.status, 201);
        reportB = sent.report;
        receipt = sent.body.data.ma_tra_cuu;
        assert.equal(reportB.ma_thiet_bi, devices[1]);
        assert.equal(reportB.ma_tai_san_luc_gui, `EQ-${suffix}-1`);
        assert.equal(reportB.ten_thiet_bi_luc_gui, `Thiết bị ${suffix}-1`);
        assert.equal(reportB.vi_tri_thiet_bi_luc_gui, "Hầm xe");
      },
    );
    await t.test(
      "unlink preserves snapshots and idempotent receipts, never retroactively links old tickets",
      async () => {
        assert.equal((await link(loc, null, 1)).status, 200);
        const replay = await send(retryBody);
        assert.equal(replay.status, 200);
        assert.equal(replay.body.data.ma_tra_cuu, receipt);
        const next = await send(form(loc.token_qr, 2));
        assert.equal(next.status, 201);
        reportNone = next.report;
        assert.equal(reportNone.ma_thiet_bi, null);
        const row = (await request(`/vi_tri_qr/${loc.ma_vi_tri_qr}`, admin))
          .body.data;
        assert.equal(row.token_qr, loc.token_qr);
        assert.equal(row.lich_su_lien_ket.length, 3);
        assert.equal((await link(oldManual, devices[0], 0)).status, 200);
        const [old] = await rows(
          pool,
          "SELECT ma_thiet_bi FROM phan_anh WHERE ma_vi_tri_qr=?",
          [oldManual.ma_vi_tri_qr],
        );
        assert.equal(old.ma_thiet_bi, null);
        const invalidMerge = await request(
          `/phan_anh/${reportNone.ma_phan_anh}/trang_thai`,
          admin,
          "PATCH",
          {
            trang_thai: "TRUNG",
            phien_ban: 0,
            ma_phan_anh_goc: reportB.ma_phan_anh,
            ghi_chu: "Kiểm tra gộp",
          },
        );
        assert.equal(invalidMerge.body.error.code, "MERGE_INVALID");
      },
    );
    await t.test(
      "equipment filters preserve ticket permissions and public lookup stays private after renaming",
      async () => {
        await rows(
          pool,
          "UPDATE thiet_bi SET ten_thiet_bi='Tên mới',vi_tri='Vị trí mới' WHERE ma_thiet_bi=?",
          [devices[1]],
        );
        const snapshot = (
          await request(`/phan_anh/${reportB.ma_phan_anh}`, admin)
        ).body.data;
        assert.equal(snapshot.ten_thiet_bi_luc_gui, `Thiết bị ${suffix}-1`);
        assert.equal(snapshot.vi_tri_thiet_bi_luc_gui, "Hầm xe");
        const adminList = (
          await request(`/phan_anh?ma_thiet_bi=${devices[1]}`, admin)
        ).body;
        assert.deepEqual(
          adminList.data.map((r) => r.ma_phan_anh),
          [reportB.ma_phan_anh],
        );
        assert.equal(
          (await request(`/phan_anh?ma_thiet_bi=${devices[1]}`, resident)).body
            .meta.total,
          0,
        );
        const assigned = await request(
          `/phan_anh/${reportB.ma_phan_anh}/phan_cong`,
          admin,
          "PATCH",
          {
            phien_ban: 0,
            ma_ky_thuat_vien: accounts[1],
            do_uu_tien: "TRUNG_BINH",
          },
        );
        assert.equal(assigned.status, 200);
        assert.equal(
          (await request(`/phan_anh?ma_thiet_bi=${devices[1]}`, tech)).body.meta
            .total,
          1,
        );
        assert.equal(
          (await request(`/phan_anh?ma_thiet_bi=${devices[1]}`, otherTech)).body
            .meta.total,
          0,
        );
        assert.equal(
          (await request(`/thiet_bi/${devices[1]}`, tech)).status,
          403,
        );
        const publicLookup = await request(
          "/cong_khai/phan_anh/tra_cuu",
          null,
          "POST",
          {
            ma_tra_cuu: receipt,
            so_dien_thoai: retryBody.get("so_dien_thoai"),
          },
        );
        assert.equal(publicLookup.status, 200);
        for (const field of [
          "ma_thiet_bi",
          "ma_tai_san_luc_gui",
          "so_serial",
          "ghi_chu",
        ])
          assert.ok(!JSON.stringify(publicLookup.body).includes(field));
        assert.equal(
          (await request("/phan_anh?ma_thiet_bi=abc", admin)).status,
          422,
        );
      },
    );
    await t.test(
      "failed link audit rolls back target and version atomically",
      async () => {
        const auditLoc = await createLocation({ ma_thiet_bi: devices[0] });
        ddl(
          "CREATE TRIGGER test_qr_link_audit BEFORE INSERT ON lich_su_lien_ket_qr FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test audit rollback';",
        );
        try {
          assert.equal((await link(auditLoc, devices[1], 0)).status, 500);
        } finally {
          ddl("DROP TRIGGER IF EXISTS test_qr_link_audit;");
        }
        const after = (
          await request(`/vi_tri_qr/${auditLoc.ma_vi_tri_qr}`, admin)
        ).body.data;
        assert.equal(after.ma_thiet_bi, devices[0]);
        assert.equal(after.phien_ban, 0);
        assert.equal(after.lich_su_lien_ket.length, 1);
      },
    );
    await t.test(
      "concurrent changes have one winner and old report identities remain unchanged",
      async () => {
        const race = await Promise.all(
          [devices[0], devices[1]].map((id) => link(loc, id, 2)),
        );
        assert.deepEqual(race.map((r) => r.status).sort(), [200, 409]);
        const detail = (await request(`/vi_tri_qr/${loc.ma_vi_tri_qr}`, admin))
          .body.data;
        assert.equal(detail.phien_ban, 3);
        assert.equal(detail.token_qr, loc.token_qr);
        assert.equal(
          (
            await rows(
              pool,
              "SELECT ma_thiet_bi FROM phan_anh WHERE ma_phan_anh=?",
              [reportB.ma_phan_anh],
            )
          )[0].ma_thiet_bi,
          devices[1],
        );
      },
    );
    await t.test(
      "location search and pagination include all matching records without leaking device internals",
      async () => {
        for (let i = 0; i < 22; i++)
          await createLocation({
            ten_vi_tri: `PAGE-${suffix}-${i}`,
            loai: "KHU_VUC",
          });
        const first = (await request(`/vi_tri_qr?q=PAGE-${suffix}`, admin))
            .body,
          second = (await request(`/vi_tri_qr?q=PAGE-${suffix}&page=2`, admin))
            .body;
        assert.equal(first.total, 22);
        assert.equal(first.data.length, 20);
        assert.equal(second.data.length, 2);
        assert.equal(
          new Set([...first.data, ...second.data].map((r) => r.ma_vi_tri_qr))
            .size,
          22,
        );
        assert.equal((await request("/vi_tri_qr?page=0", admin)).status, 422);
        const list = await request(
          `/vi_tri_qr?ma_thiet_bi=${devices[0]}`,
          admin,
        );
        for (const row of list.body.data)
          assert.equal(row.ma_thiet_bi, devices[0]);
        assert.ok(!JSON.stringify(list.body).includes("PRIVATE"));
      },
    );
  } finally {
    ddl("DROP TRIGGER IF EXISTS test_qr_link_audit;");
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    for (const id of reports) {
      await rows(pool, "DELETE FROM lich_su_phan_anh WHERE ma_phan_anh=?", [
        id,
      ]);
      await rows(pool, "DELETE FROM yeu_cau_gui WHERE ma_phan_anh=?", [id]);
      await rows(pool, "DELETE FROM phan_anh WHERE ma_phan_anh=?", [id]);
    }
    for (const key of requestKeys)
      await rows(pool, "DELETE FROM yeu_cau_gui WHERE khoa=?", [key]);
    for (const id of locations)
      await rows(pool, "DELETE FROM vi_tri_qr WHERE ma_vi_tri_qr=?", [id]);
    for (const id of devices)
      await rows(pool, "DELETE FROM thiet_bi WHERE ma_thiet_bi=?", [id]);
    for (const id of accounts)
      await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    await pool.end();
  }
});
```

## 13. e2e/equipment-qr.spec.js

Tạo mới.

```js
import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";
import { cleanupImages } from "../backend/src/lib/images.js";

for (const width of [1440, 375])
  test(`equipment QR → photo report → reassignment → stale form → snapshot/filter → unlink at ${width}px`, async ({
    page,
    context,
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    await page.setViewportSize({ width, height: 1000 });
    const guestContext = await browser.newContext({
      viewport: { width, height: 1000 },
    });
    const guest = await guestContext.newPage(),
      stale = await guestContext.newPage();
    const suffix = randomBytes(4).toString("hex"),
      password = randomBytes(16).toString("hex"),
      locationName = `Tem thiết bị ${suffix}`;
    const devices = [],
      errors = [];
    let admin, location;
    const phone =
      "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
    for (const p of [page, guest, stale])
      p.on("pageerror", (error) => errors.push(error.message));
    async function fillReport(p, title) {
      await p.getByLabel("Tiêu đề", { exact: true }).fill(title);
      await p
        .getByLabel("Mô tả chi tiết")
        .fill("Thiết bị chạy ồn bất thường, cần kiểm tra tại hiện trường.");
      await p.getByLabel("Họ tên", { exact: true }).fill("Cư dân demo");
      await p.getByLabel("Số điện thoại", { exact: true }).fill(phone);
    }
    async function saveLink(editor) {
      await editor.getByRole("checkbox").check();
      await editor
        .getByRole("button", { name: "Lưu liên kết", exact: true })
        .click();
      await expect(editor).toHaveCount(0);
    }
    try {
      admin = (
        await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
          [suffix, phone, await bcrypt.hash(password, 10)],
        )
      ).insertId;
      await context.addCookies([
        {
          name: "session",
          value: (await login({ so_dien_thoai: phone, mat_khau: password }))
            .token,
          url: "http://127.0.0.1:5174",
          httpOnly: true,
          sameSite: "Strict",
        },
      ]);
      for (let i = 0; i < 22; i++) {
        const ending = i === 0 ? "A" : i === 21 ? "B" : String(i);
        const row = await rows(
          pool,
          "INSERT INTO thiet_bi (ma_tai_san,ten_thiet_bi,loai,vi_tri,so_serial,ghi_chu,ma_nguoi_tao) VALUES (?,?,'DIEN','Hầm xe','PRIVATE-SERIAL','PRIVATE-NOTE',?)",
          [`EQ-${suffix}-${ending}`, `Máy ${suffix}-${ending}`, admin],
        );
        devices.push(row.insertId);
      }
      const a = devices[0],
        b = devices[21];
      await page.goto("/quan-tri/vi-tri-qr");
      await page.getByLabel("Tên vị trí", { exact: true }).fill(locationName);
      await page
        .getByLabel("Loại vị trí", { exact: true })
        .selectOption("THIET_BI");
      await page.getByLabel("Tìm thiết bị theo mã hoặc tên").fill(suffix);
      await expect(
        page.getByRole("button", { name: "Trang thiết bị sau", exact: true }),
      ).toBeEnabled();
      await page
        .getByRole("button", { name: "Trang thiết bị sau", exact: true })
        .click();
      await page
        .getByLabel("Chọn thiết bị", { exact: true })
        .selectOption(String(b));
      await expect(
        page.getByText(`Đã chọn: EQ-${suffix}-B · Máy ${suffix}-B`, {
          exact: true,
        }),
      ).toBeVisible();
      // Selection survives subsequent searching rather than becoming the first
      // item of a new result page.
      await page
        .getByLabel("Tìm thiết bị theo mã hoặc tên")
        .fill(`EQ-${suffix}-A`);
      await expect(
        page.getByText(`Đã chọn: EQ-${suffix}-B · Máy ${suffix}-B`, {
          exact: true,
        }),
      ).toBeVisible();
      const created = page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === "/api/vi_tri_qr" &&
          r.request().method() === "POST",
      );
      await page
        .getByRole("button", { name: "Tạo vị trí và mã QR", exact: true })
        .click();
      const r = await created;
      expect(r.status()).toBe(201);
      location = (await r.json()).data;
      expect(location.ma_thiet_bi).toBe(b);
      const locationRow = page
        .locator(".location-list > li")
        .filter({ hasText: locationName });
      await locationRow
        .getByRole("button", { name: "Xem QR", exact: true })
        .click();
      await expect(page.getByAltText(`Mã QR ${locationName}`)).toBeVisible();
      await guest.goto(`/r/${location.token_qr}`);
      await expect(
        guest.getByText(`Thiết bị: EQ-${suffix}-B · Máy ${suffix}-B`, {
          exact: true,
        }),
      ).toBeVisible();
      await fillReport(guest, `Phản ánh máy B ${suffix}`);
      const image = await sharp({
        create: { width: 40, height: 40, channels: 3, background: "#339988" },
      })
        .png()
        .toBuffer();
      await guest.locator("input[type=file][multiple]").setInputFiles({
        name: "hien-truong.png",
        mimeType: "image/png",
        buffer: image,
      });
      await expect(guest.getByAltText(/Xem trước/)).toBeVisible();
      await guest
        .getByRole("button", { name: "Gửi phản ánh", exact: true })
        .click();
      await expect(
        guest.getByRole("heading", { name: "Cảm ơn bạn đã phản ánh" }),
      ).toBeVisible();
      const receipt = await guest.getByLabel("Mã tra cứu riêng").inputValue();
      expect(receipt).toHaveLength(64);
      const [reportB] = await rows(
        pool,
        "SELECT * FROM phan_anh WHERE ma_vi_tri_qr=? AND tieu_de=?",
        [location.ma_vi_tri_qr, `Phản ánh máy B ${suffix}`],
      );
      expect(reportB.ma_thiet_bi).toBe(b);
      await stale.goto(`/r/${location.token_qr}`);
      await fillReport(stale, `Bản nháp chưa gửi ${suffix}`);
      await locationRow
        .getByRole("button", { name: "Liên kết thiết bị", exact: true })
        .click();
      const editor = page.getByRole("region", {
        name: "Liên kết thiết bị với QR",
      });
      await editor
        .getByLabel("Tìm thiết bị theo mã hoặc tên")
        .fill(`EQ-${suffix}-A`);
      await editor
        .getByLabel("Chọn thiết bị", { exact: true })
        .selectOption(String(a));
      await saveLink(editor);
      expect(
        (
          await rows(
            pool,
            "SELECT token_qr FROM vi_tri_qr WHERE ma_vi_tri_qr=?",
            [location.ma_vi_tri_qr],
          )
        )[0].token_qr,
      ).toBe(location.token_qr);
      await stale
        .getByRole("button", { name: "Gửi phản ánh", exact: true })
        .click();
      await expect(stale.getByRole("alert")).toContainText(
        "Liên kết vị trí đã thay đổi",
      );
      await expect(stale.getByLabel("Tiêu đề", { exact: true })).toHaveValue(
        `Bản nháp chưa gửi ${suffix}`,
      );
      await stale.reload();
      await expect(
        stale.getByText(`Thiết bị: EQ-${suffix}-A · Máy ${suffix}-A`, {
          exact: true,
        }),
      ).toBeVisible();
      await expect(stale.getByLabel("Tiêu đề", { exact: true })).toHaveValue(
        `Bản nháp chưa gửi ${suffix}`,
      );
      await stale
        .getByRole("button", { name: "Gửi phản ánh", exact: true })
        .click();
      await expect(
        stale.getByRole("heading", { name: "Cảm ơn bạn đã phản ánh" }),
      ).toBeVisible();

      await page.goto(`/quan-tri/phan-anh/${reportB.ma_phan_anh}`);
      await expect(
        page.getByText(`Thiết bị lúc gửi: EQ-${suffix}-B · Máy ${suffix}-B`, {
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.locator(".image-grid img")).toHaveCount(1);
      await page
        .getByRole("link", { name: "Mở hồ sơ thiết bị", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: `Máy ${suffix}-B`, exact: true }),
      ).toBeVisible();
      const connections = page.getByRole("region", {
        name: "QR và phản ánh của thiết bị",
      });
      await expect(connections).toContainText("0 vị trí QR đang liên kết");
      await expect(connections).toContainText(
        "1 phản ánh ghi nhận thiết bị này lúc gửi",
      );
      await connections
        .getByRole("link", { name: "Xem phản ánh của thiết bị", exact: true })
        .click();
      await expect(
        page.getByRole("link", {
          name: `#${reportB.ma_phan_anh} · Phản ánh máy B ${suffix}`,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", {
          name: new RegExp(`Bản nháp chưa gửi ${suffix}`),
        }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Bỏ lọc thiết bị", exact: true }),
      ).toBeVisible();

      await page.goto(`/quan-tri/thiet-bi/${a}`);
      await connections
        .getByRole("link", { name: "Quản lý QR của thiết bị", exact: true })
        .click();
      await expect(locationRow).toBeVisible();
      await locationRow
        .getByRole("button", { name: "Liên kết thiết bị", exact: true })
        .click();
      await editor
        .getByRole("button", { name: "Bỏ chọn thiết bị", exact: true })
        .click();
      await saveLink(editor);
      await guest.goto(`/r/${location.token_qr}`);
      await expect(
        guest.getByRole("heading", { name: locationName, exact: true }),
      ).toBeVisible();
      await expect(guest.getByText(/Thiết bị: EQ-/)).toHaveCount(0);
      await page.goto(`/quan-tri/phan-anh/${reportB.ma_phan_anh}`);
      await expect(
        page.getByText(`Thiết bị lúc gửi: EQ-${suffix}-B · Máy ${suffix}-B`, {
          exact: true,
        }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `/tmp/equipment-qr-${width}.png`,
        fullPage: true,
      });
      expect(errors).toEqual([]);
    } finally {
      await guestContext.close();
      if (location) {
        const tickets = await rows(
          pool,
          "SELECT ma_phan_anh FROM phan_anh WHERE ma_vi_tri_qr=?",
          [location.ma_vi_tri_qr],
        );
        for (const ticket of tickets) {
          const images = await rows(
            pool,
            "SELECT duong_dan_tep FROM hinh_anh_phan_anh WHERE ma_phan_anh=?",
            [ticket.ma_phan_anh],
          );
          await cleanupImages(images.map((i) => i.duong_dan_tep));
          for (const table of [
            "hinh_anh_phan_anh",
            "lich_su_phan_anh",
            "yeu_cau_gui",
          ])
            await rows(pool, `DELETE FROM ${table} WHERE ma_phan_anh=?`, [
              ticket.ma_phan_anh,
            ]);
          await rows(pool, "DELETE FROM phan_anh WHERE ma_phan_anh=?", [
            ticket.ma_phan_anh,
          ]);
        }
        await rows(pool, "DELETE FROM vi_tri_qr WHERE ma_vi_tri_qr=?", [
          location.ma_vi_tri_qr,
        ]);
      }
      for (const id of devices)
        await rows(pool, "DELETE FROM thiet_bi WHERE ma_thiet_bi=?", [id]);
      if (admin)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [
          admin,
        ]);
    }
  });
```
