# Cập nhật 4 lỗi sau rà soát — VS Code, 30/10/2026

Đây là bản **sửa lỗi** trên nhánh `codex/editorial-business-ui` của `tunato2807-del/chung-cu-starter`. Giữ nguyên stack, giao diện nghiệp vụ, dữ liệu, mật khẩu và luồng hóa đơn đang có. Không cần tải ZIP hoặc tạo lại database. Tổng số bảng vẫn là **38**; migration 019 chỉ thêm hai cột và chỉ mục vào bảng phản ánh.

## Hành vi sau khi sửa

- **Bàn giao tài khoản căn:** chủ mới kế thừa hóa đơn của căn, không thấy nội dung, tên, điện thoại hoặc ảnh phản ánh của chủ trước. Người gửi giữ quyền phản ánh của mình qua đổi mật khẩu; nếu được cấp tài khoản cá nhân gắn đúng cùng hồ sơ cư dân thì xem lại được phản ánh đó. BQL và kỹ thuật viên được phân công vẫn xử lý theo quyền hiện có.
- **Phản ánh cũ trước migration 019:** phản ánh gửi bằng tài khoản căn chưa có danh tính lịch sử đáng tin cậy được giữ nguyên cho BQL/kỹ thuật viên xử lý; không tự gán cho người đang phụ trách. Tài khoản cá nhân cũ vẫn xem phản ánh gửi bằng chính tài khoản đó. Tra cứu công khai vẫn chỉ trả trạng thái/timeline khi có đúng mã và điện thoại, không trả nội dung/ảnh. Chưa cung cấp thao tác tự nhận lại phản ánh lịch sử.
- **Tài khoản căn chưa gắn chủ hộ:** vẫn đăng nhập và xem hóa đơn được; cần BQL gắn chủ hộ trước khi gửi phản ánh bằng tài khoản đó. Form hiển thị hướng dẫn khi chưa đủ điều kiện. Khách chưa từng đăng nhập vẫn gửi phản ánh công khai theo quy trình hiện có.
- **Phiên hết hạn:** trở về đăng nhập khi thao tác tại trang được bảo vệ; JSON API và tải Excel/PDF đồng bộ cùng trạng thái phiên. Sai mật khẩu hiển thị đúng lỗi. Phản hồi 401 của phiên cũ không làm mất phiên vừa đăng nhập. Form QR giữ nội dung và ảnh trong lần mở trang hiện tại, yêu cầu đăng nhập lại trước khi gửi, không tự chuyển thành khách. Ảnh chưa được gửi không được hứa giữ qua việc đóng/tải lại trình duyệt.
- **Thu phí:** lập/thao tác hóa đơn lẻ đọc lại phiên BQL sau khi chờ khóa dữ liệu và giữ khóa kiểm tra đến cuối giao dịch. Phiên bị thu hồi trước đó trả 401, không ghi thanh toán/lịch sử.
- **VAT điện:** vẫn tính bằng số nguyên và làm tròn như trước. Trường hợp thuế rất lớn vượt `DECIMAL(12,2)` bị từ chối bằng 422 có thông báo rõ thay vì lỗi ghi SQL 500; không tăng đơn giá hay tự cắt số tiền.

## Cập nhật trên máy bạn

1. Dừng **đúng hai terminal** frontend/backend bằng Ctrl+C, lưu các file đang sửa. Nếu dùng Git, kiểm tra và lưu thay đổi của bạn trước khi cập nhật; không dùng `reset --hard`.
2. Nếu copy thủ công, chép đủ **15 file** bên dưới vào đúng đường dẫn tính từ thư mục gốc. Ba file mới là migration 019, `incident-sender.js`, `auth-session.js`. Chỉ chép phần code vào file, không chép dấu ``` hoặc tiêu đề. Các file test ở cuối trang không bắt buộc để chạy web.
3. Chạy migration vào đúng database bạn định mở web. Không chạy lại seed hoặc bộ tạo nghiệm thu.

**Nếu backend dùng database trong `.env` (ví dụ `chung_cu`):** tại PowerShell ở thư mục gốc:

```powershell
cd D:\DO_AN\chung-cu-starter-codex-auth-qr-incidents
npm run db:migrate
npm run dev:backend
```

**Nếu bạn đăng nhập bằng tài khoản trong `backend/storage/acceptance/chung_cu_nghiem_thu/TAI-KHOAN.md`:** dùng database nghiệm thu đã có. Lệnh sau chỉ chọn database cho tiến trình migration, không sửa `.env`:

```powershell
node --env-file-if-exists=.env --input-type=module -e "process.env.DB_NAME='chung_cu_nghiem_thu'; await import('./backend/scripts/migrate.js');"
npm run start:backend:acceptance
```

Nếu bộ nghiệm thu mang hậu tố khác, thay đúng tên đó trong lệnh migration và khởi động bằng `npm run start:backend:acceptance -- --database=chung_cu_nghiem_thu_<hau_to>`.

Migration cần in `Schema current: 019_incident_sender_privacy.sql`. Nếu bạn dùng cả database thường lẫn nghiệm thu, chạy migration cho **cả hai** trước khi chuyển qua lại. Không sửa checksum hay xóa dòng `schema_migrations`. Nếu migration lỗi giữa chừng, dừng và kiểm tra thông báo; không tự đánh dấu migration đã chạy.

Ở terminal thứ hai:

```powershell
npm run dev:frontend:https
```

Dùng lệnh HTTPS nếu bạn đã có chứng chỉ và muốn quét camera trên điện thoại. Truy cập địa chỉ IP hiện tại được Vite in ra, khớp chứng chỉ; không dùng `127.0.0.1` của máy tính trên điện thoại. Nếu chưa dùng HTTPS/camera thì `npm run dev:frontend` vẫn chạy giao diện. Bản sửa này không đổi IP Wi-Fi hoặc gia hạn chứng chỉ; dùng hướng dẫn [đăng nhập, QR và địa chỉ](sua-dang-nhap-qr-va-dia-chi-vscode.md) khi IP thực tế đã đổi.

Trong terminal thứ ba:

```powershell
node scripts/check-local.js --api http://127.0.0.1:3000
npm run build
```

Lượt này không thêm dependency, không đổi package-lock. Máy đã cài đủ có thể build trực tiếp; không cần chạy lại `npm ci`. Đăng nhập bằng file tài khoản thuộc **đúng database backend đang in khi khởi động**. Không gửi mật khẩu lên chat/GitHub.

## Các file đầy đủ để copy

Mở từng mục dưới đây hoặc bấm tên file để xem file gốc trên GitHub; nút **Raw** giúp copy chỉ nội dung code. Không thay `App.jsx`/router từ nhánh `main` vào bản nghiệp vụ.

### 1. `database/migrations/019_incident_sender_privacy.sql`

Tạo file mới; không sửa các migration 001–018. [Mở file gốc](../database/migrations/019_incident_sender_privacy.sql).

```sql
-- Resident identity is independent of the reusable apartment billing account.
-- Never infer a historical sender from the apartment's current householder.
ALTER TABLE phan_anh
  ADD COLUMN ma_cu_dan_nguoi_gui INT UNSIGNED NULL,
  ADD COLUMN gui_tu_tai_khoan_can_ho BOOLEAN NOT NULL DEFAULT FALSE,
  ADD CONSTRAINT fk_incident_sender_resident FOREIGN KEY (ma_cu_dan_nguoi_gui) REFERENCES cu_dan(ma_cu_dan),
  ADD INDEX idx_incident_sender_resident (ma_cu_dan_nguoi_gui,ma_phan_anh),
  ADD INDEX idx_incident_sender_account (ma_nguoi_gui,gui_tu_tai_khoan_can_ho,ma_phan_anh);
-- Legacy apartment submissions remain visible to BQL and assigned technicians.
-- Their resident identity stays NULL until it can be verified independently.
UPDATE phan_anh p JOIN nguoi_dung u ON u.ma_nguoi_dung=p.ma_nguoi_gui
  SET p.gui_tu_tai_khoan_can_ho=TRUE
  WHERE u.ma_can_ho_thanh_toan IS NOT NULL;
```

### 2. `backend/src/app.js`

Sửa kiểm tra sẵn sàng thành schema 019. [Mở file gốc](../backend/src/app.js).

```javascript
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
      "SELECT name FROM schema_migrations WHERE name IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
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
        "019_incident_sender_privacy.sql",
      ],
    );
    if (migrations.length !== 19) throw new Error("Schema not initialized");
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

### 3. `backend/src/modules/auth/auth.repository.js`

Trả đúng danh tính cư dân của người đang đăng nhập. [Mở file gốc](../backend/src/modules/auth/auth.repository.js).

```javascript
import { pool, rows } from "../../lib/db.js";
export const publicColumns =
  "ma_nguoi_dung, ho_va_ten, so_dien_thoai, ten_dang_nhap, ma_can_ho_thanh_toan, vai_tro, chuyen_mon, dang_hoat_dong, phien_ban_token";
export async function findUser(id, db = pool) {
  return (
    await rows(
      db,
      `SELECT ${publicColumns},COALESCE(ma_cu_dan_phu_trach,(SELECT c.ma_cu_dan FROM cu_dan c WHERE c.ma_nguoi_dung=nguoi_dung.ma_nguoi_dung)) AS ma_cu_dan,(SELECT c.so_dien_thoai FROM cu_dan c WHERE c.ma_cu_dan=nguoi_dung.ma_cu_dan_phu_trach) AS dien_thoai_dang_nhap FROM nguoi_dung WHERE ma_nguoi_dung=?`,
      [id],
    )
  )[0];
}
export async function listUsers() {
  return rows(
    pool,
    `SELECT ${publicColumns} FROM nguoi_dung WHERE ma_can_ho_thanh_toan IS NULL ORDER BY ma_nguoi_dung LIMIT 200`,
  );
}
```

### 4. `backend/src/modules/incidents/incident-sender.js`

Tạo file mới: khóa và kiểm tra lại người gửi sau bước xử lý ảnh. [Mở file gốc](../backend/src/modules/incidents/incident-sender.js).

```javascript
import { rows } from "../../lib/db.js";
import { fail } from "../../lib/http.js";

// Images may take time to process. Revalidate and hold the sender identity until
// commit, so a handover/password change during that work cannot misattribute it.
export async function lockSender(db, user) {
  if (!user) return { resident: null, apartmentAccount: false };
  const expired = () =>
    fail(
      401,
      "SESSION_EXPIRED",
      "Phiên đã hết hạn. Vui lòng đăng nhập lại trước khi gửi phản ánh.",
    );
  // Match residency's resident -> account lock order, including the resident FK
  // taken by the subsequent INSERT. Never lock a new resident after the account.
  let person;
  if (user.vai_tro === "CU_DAN" && user.ma_cu_dan != null) {
    [person] = await rows(
      db,
      "SELECT ma_cu_dan,ma_nguoi_dung FROM cu_dan WHERE ma_cu_dan=? FOR SHARE",
      [user.ma_cu_dan],
    );
    if (!person) expired();
  }
  const [current] = await rows(
    db,
    "SELECT ma_nguoi_dung,vai_tro,ma_can_ho_thanh_toan,ma_cu_dan_phu_trach,dang_hoat_dong,phien_ban_token FROM nguoi_dung WHERE ma_nguoi_dung=? FOR SHARE",
    [user.ma_nguoi_dung],
  );
  if (
    !current?.dang_hoat_dong ||
    current.phien_ban_token !== user.phien_ban_token ||
    current.vai_tro !== user.vai_tro
  )
    expired();
  const apartmentAccount = current.ma_can_ho_thanh_toan !== null;
  if (apartmentAccount) {
    if (current.ma_cu_dan_phu_trach === null)
      fail(
        422,
        "HOUSEHOLDER_REQUIRED",
        "Tài khoản căn hộ chưa gắn chủ hộ phụ trách. Vui lòng liên hệ Ban quản lý trước khi gửi phản ánh bằng tài khoản này.",
      );
    if (current.ma_cu_dan_phu_trach !== person?.ma_cu_dan) expired();
  } else if (person && person.ma_nguoi_dung !== current.ma_nguoi_dung)
    expired();
  return { resident: person?.ma_cu_dan ?? null, apartmentAccount };
}
```

### 5. `backend/src/modules/incidents/incidents.repository.js`

Quyền xem danh sách, chi tiết và ảnh theo người gửi. [Mở file gốc](../backend/src/modules/incidents/incidents.repository.js).

```javascript
import { pool, rows } from "../../lib/db.js";
import { fail, integer } from "../../lib/http.js";
export function canRead(user, r) {
  return (
    user.vai_tro === "QUAN_TRI_VIEN" ||
    (user.vai_tro === "KY_THUAT_VIEN" &&
      user.ma_nguoi_dung === r.ma_ky_thuat_vien) ||
    (user.vai_tro === "CU_DAN" &&
      (r.ma_cu_dan_nguoi_gui != null
        ? user.ma_cu_dan != null && user.ma_cu_dan === r.ma_cu_dan_nguoi_gui
        : !r.gui_tu_tai_khoan_can_ho &&
          user.ma_can_ho_thanh_toan == null &&
          user.ma_nguoi_dung === r.ma_nguoi_gui))
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
    clauses.push(
      "((p.ma_cu_dan_nguoi_gui IS NOT NULL AND p.ma_cu_dan_nguoi_gui=?) OR (p.ma_cu_dan_nguoi_gui IS NULL AND p.gui_tu_tai_khoan_can_ho=0 AND p.ma_nguoi_gui=? AND ?=1))",
    );
    params.push(
      user.ma_cu_dan ?? null,
      user.ma_nguoi_dung,
      user.ma_can_ho_thanh_toan == null ? 1 : 0,
    );
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

### 6. `backend/src/modules/incidents/incidents.service.js`

Ghi danh tính từ phiên phía server; không nhận danh tính do form tự khai. [Mở file gốc](../backend/src/modules/incidents/incidents.service.js).

```javascript
import { randomBytes, createHash } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, text, phone, choice, integer } from "../../lib/http.js";
import { saveImages, cleanupImages } from "../../lib/images.js";
import { lockedReport, addImages, history } from "./incidents.repository.js";
import { lockSender } from "./incident-sender.js";
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
    resident: user?.ma_cu_dan ?? null,
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
      const sender = await lockSender(db, user);
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
        `INSERT INTO phan_anh (ma_tra_cuu,khoa_yeu_cau,ma_vi_tri_qr,ma_nguoi_gui,ten_nguoi_gui,so_dien_thoai_nguoi_gui,can_ho_khai_bao,tieu_de,noi_dung,loai_su_co,ma_thiet_bi,ma_tai_san_luc_gui,ten_thiet_bi_luc_gui,vi_tri_thiet_bi_luc_gui,ma_cu_dan_nguoi_gui,gui_tu_tai_khoan_can_ho) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
          sender.resident,
          sender.apartmentAccount,
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

### 7. `backend/src/modules/billing/billing.guards.js`

Kiểm tra phiên BQL trong giao dịch. [Mở file gốc](../backend/src/modules/billing/billing.guards.js).

```javascript
import { rows } from "../../lib/db.js";
import { fail } from "../../lib/http.js";
export async function assertBillingActor(db, user) {
  const found = await rows(
    db,
    "SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_nguoi_dung=? AND vai_tro='QUAN_TRI_VIEN' AND dang_hoat_dong=1 AND phien_ban_token=? FOR SHARE",
    [user.ma_nguoi_dung, user.phien_ban_token],
  );
  if (!found.length)
    fail(
      401,
      "SESSION_EXPIRED",
      "Phiên đã hết hạn. Đăng nhập lại trước khi xử lý hóa đơn.",
    );
}
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

### 8. `backend/src/modules/billing/billing-batch.service.js`

Dùng chung điều kiện kiểm tra phiên cho hóa đơn hàng loạt. [Mở file gốc](../backend/src/modules/billing/billing-batch.service.js).

```javascript
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { pool, rows } from "../../lib/db.js";
import { fail, integer } from "../../lib/http.js";
import { period, monthDay, options } from "./billing.validation.js";
import { requestKey } from "../maintenance/maintenance.validation.js";
import {
  assertBillingActor as actor,
  lockApartment,
} from "./billing.guards.js";
import { generate, prepareDraft } from "./billing.service.js";

const signingKey = randomBytes(32);
export const hash = (x) =>
  createHash("sha256").update(JSON.stringify(x)).digest("hex");
const mac = (s) =>
  createHmac("sha256", signingKey).update(s).digest("base64url");
function input(body) {
  const month = period(body.ky_thanh_toan);
  if (
    !Array.isArray(body.ma_can_ho) ||
    body.ma_can_ho.length < 1 ||
    body.ma_can_ho.length > 50
  )
    fail(422, "BATCH_SIZE", "Chọn từ 1 đến 50 căn hộ mỗi đợt.");
  const ids = body.ma_can_ho.map((id) => integer(id, "ma_can_ho"));
  if (ids.some((id) => id < 1) || new Set(ids).size !== ids.length)
    fail(422, "BATCH_APARTMENTS", "Mã căn phải hợp lệ và không lặp trong đợt.");
  return {
    ma_can_ho: ids.sort((a, b) => a - b),
    ky_thanh_toan: month,
    ngay_chot_phi: monthDay(body.ngay_chot_phi, month),
    ...options(body),
  };
}
export { assertBillingActor as actor } from "./billing.guards.js";
export function tokenFor(bodyHash, quoteHash, user) {
  const payload = Buffer.from(
    JSON.stringify({
      bodyHash,
      quoteHash,
      actor: user.ma_nguoi_dung,
      version: user.phien_ban_token,
      expires: Date.now() + 900000,
    }),
  ).toString("base64url");
  return `${payload}.${mac(payload)}`;
}
export function verify(token, bodyHash, user) {
  const [payload, signature, extra] =
    typeof token === "string" ? token.split(".") : [];
  if (!payload || !signature || extra || token.length > 2000)
    fail(
      409,
      "PREVIEW_REQUIRED",
      "Hãy xem trước đợt hóa đơn trước khi xác nhận.",
    );
  const expected = Buffer.from(mac(payload)),
    actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
    fail(
      409,
      "PREVIEW_REQUIRED",
      "Bản xem trước không hợp lệ hoặc máy chủ đã khởi động lại. Hãy xem trước lại.",
    );
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    fail(409, "PREVIEW_REQUIRED", "Hãy xem trước lại đợt hóa đơn.");
  }
  if (
    data.bodyHash !== bodyHash ||
    data.actor !== user.ma_nguoi_dung ||
    data.version !== user.phien_ban_token ||
    data.expires < Date.now()
  )
    fail(
      409,
      "PREVIEW_EXPIRED",
      "Dữ liệu, phiên đăng nhập đã đổi hoặc bản xem trước quá 15 phút. Hãy xem trước lại.",
    );
  return data.quoteHash;
}
async function quote(db, body) {
  // Acquire every apartment in ascending order before taking shared fee-source locks.
  const apartments = [];
  for (const id of body.ma_can_ho) {
    try {
      apartments.push(await lockApartment(db, id));
    } catch (error) {
      if (error.code !== "NOT_FOUND") throw error;
      apartments.push({ ma_can_ho: id, so_can_ho: `#${id}`, missing: true });
    }
  }
  const result = [];
  for (const apartment of apartments) {
    const row = {
      ma_can_ho: apartment.ma_can_ho,
      so_can_ho: apartment.so_can_ho,
      khoi: apartment.khoi || "",
      tong_tien: "0",
      loi: [],
      chi_tiet: [],
    };
    try {
      if (apartment.missing) fail(404, "NOT_FOUND", "Không tìm thấy căn hộ.");
      const { snapshot } = await prepareDraft(db, apartment, body);
      row.tong_tien = snapshot.total;
      row.loi = snapshot.errors;
      row.chi_tiet = snapshot.lines;
    } catch (error) {
      if (!error.status || error.status >= 500) throw error;
      row.loi = [error.message];
    }
    result.push(row);
  }
  return result;
}
export async function batchBills(raw, user, commit = false) {
  const body = input(raw),
    bodyHash = hash(body),
    key = commit ? requestKey(raw.khoa_yeu_cau) : null;
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    let batchId;
    if (commit) {
      // The unique request row serializes retries, including requests on another server.
      await rows(
        db,
        "INSERT INTO dot_lap_hoa_don (ma_nguoi_lap,khoa_yeu_cau,dau_vao_sha256) VALUES (?,?,?) ON DUPLICATE KEY UPDATE khoa_yeu_cau=khoa_yeu_cau",
        [user.ma_nguoi_dung, key, bodyHash],
      );
      const [batch] = await rows(
        db,
        "SELECT * FROM dot_lap_hoa_don WHERE ma_nguoi_lap=? AND khoa_yeu_cau=? FOR UPDATE",
        [user.ma_nguoi_dung, key],
      );
      if (batch.dau_vao_sha256 !== bodyHash)
        fail(
          409,
          "BATCH_KEY_CONFLICT",
          "Mã yêu cầu đã dùng cho dữ liệu khác. Hãy xem trước một đợt mới.",
        );
      batchId = batch.ma_dot_lap;
      if (batch.ket_qua !== null) {
        await actor(db, user);
        const result =
          typeof batch.ket_qua === "string"
            ? JSON.parse(batch.ket_qua)
            : batch.ket_qua;
        return { ...result, da_lap_truoc: true };
      }
    }
    const expected = commit ? verify(raw.xac_nhan, bodyHash, user) : null;
    const preview = await quote(db, body);
    const errors = preview.filter((r) => r.loi.length).length;
    await actor(db, user);
    if (!commit)
      return {
        rows: preview,
        so_can: preview.length,
        so_can_loi: errors,
        tong_tien: preview
          .filter((r) => !r.loi.length)
          .reduce((n, r) => n + BigInt(r.tong_tien), 0n)
          .toString(),
        xac_nhan: errors ? null : tokenFor(bodyHash, hash(preview), user),
      };
    if (errors || hash(preview) !== expected)
      fail(
        409,
        "BATCH_CHANGED",
        "Chưa tạo hóa đơn nào. Đơn giá, chỉ số, xe hoặc hóa đơn đã thay đổi. Hãy xem trước lại từng căn.",
      );
    const invoices = [];
    for (const row of preview) {
      const result = await generate(
        { ...body, ma_can_ho: row.ma_can_ho },
        user,
        db,
      );
      invoices.push({
        ma_can_ho: row.ma_can_ho,
        so_can_ho: row.so_can_ho,
        ...result,
        tong_tien: row.tong_tien,
      });
    }
    await actor(db, user);
    const result = {
      ma_dot_lap: batchId,
      so_hoa_don: invoices.length,
      tong_tien: preview
        .reduce((n, r) => n + BigInt(r.tong_tien), 0n)
        .toString(),
      hoa_don: invoices,
    };
    await rows(db, "UPDATE dot_lap_hoa_don SET ket_qua=? WHERE ma_dot_lap=?", [
      JSON.stringify(result),
      batchId,
    ]);
    await db.commit();
    return { ...result, da_lap_truoc: false };
  } finally {
    try {
      await db.rollback();
    } finally {
      db.release();
    }
  }
}
```

### 9. `backend/src/modules/billing/billing.service.js`

Áp dụng cho lập, tính lại, duyệt, gửi, hủy, thay thế và xác nhận thu hóa đơn lẻ. [Mở file gốc](../backend/src/modules/billing/billing.service.js).

```javascript
import { reportPage } from "../report-exports/report-files.js";
import { createHash, randomBytes } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, integer, text } from "../../lib/http.js";
import { lockApartment, assertBillingActor } from "./billing.guards.js";
import { vietQR } from "./billing.qr.js";
import * as v from "./billing.validation.js";
import { electricityConfig, electricityLines } from "./billing.electricity.js";

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
    config = electricityConfig(body, type),
    price =
      config.cach_tinh === "BAC_THANG"
        ? "0.00"
        : v.decimal(v.scaled(body.don_gia), 2),
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
      "INSERT INTO cau_hinh_phi (loai_phi,don_gia,tu_ngay,ma_nguoi_tao,cach_tinh,thue_gtgt,bac_dien) VALUES (?,?,?,?,?,?,?)",
      [
        type,
        price,
        from,
        user.ma_nguoi_dung,
        config.cach_tinh,
        config.thue_gtgt,
        config.bac_dien === null ? null : JSON.stringify(config.bac_dien),
      ],
    );
    return { ma_cau_hinh_phi: result.insertId };
  });
}
export async function meters(query, exportFormat = null) {
  const { page, offset, limit, check } = reportPage(query, exportFormat),
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
  check(count.total);
  const data = await rows(
    pool,
    `SELECT m.*,a.so_can_ho FROM chi_so_dich_vu m JOIN can_ho a ON a.ma_can_ho=m.ma_can_ho ${condition} ORDER BY m.ky_thanh_toan DESC,m.ma_chi_so_dich_vu DESC LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return { data, total: count.total, page };
}
export async function saveMeter(body, user, connection = null) {
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
  }, connection);
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
      if (type === "DIEN") {
        const rate = rates.find((r) => r.loai_phi === "TIEN_DIEN");
        if (!rate) errors.push("Thiếu đơn giá TIEN_DIEN tại ngày chốt.");
        else {
          // Preserve legacy flat/no-VAT snapshots byte-for-byte for existing drafts.
          if (rate.cach_tinh === "BAC_THANG" || v.scaled(rate.thue_gtgt) > 0n) {
            lines.push(
              ...electricityLines(
                rate,
                used,
                {
                  chi_so_cu: meter.chi_so_cu,
                  chi_so_moi: meter.chi_so_moi,
                  phien_ban: meter.phien_ban,
                },
                meter.ma_chi_so_dich_vu,
              ),
            );
            continue;
          }
        }
        if (!rate) continue;
      }
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
export async function prepareDraft(db, apartment, body, previous = null) {
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
  return { month, day, options, existing, snapshot };
}
async function makeDraft(db, apartment, body, user, previous = null) {
  const { month, day, options, existing, snapshot } = await prepareDraft(
    db,
    apartment,
    body,
    previous,
  );
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
export async function generate(body, user, connection = null) {
  const id = integer(body.ma_can_ho, "ma_can_ho");
  return transaction(async (db) => {
    const apartment = await lockApartment(db, id);
    await assertBillingActor(db, user);
    return makeDraft(db, apartment, body, user);
  }, connection);
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
export function paymentDetails(body, cutoff = "1900-01-01", checkToday = true) {
  const due = v.day(body.han_thanh_toan, true),
    bin = text(body.ma_ngan_hang, "ma_ngan_hang", 6, 6),
    account = text(body.so_tai_khoan, "so_tai_khoan", 6, 30),
    name = text(body.ten_nguoi_nhan, "ten_nguoi_nhan", 2, 100);
  if (
    due < cutoff ||
    (checkToday && due < v.today()) ||
    !/^\d{6}$/.test(bin) ||
    !/^\d{6,30}$/.test(account)
  )
    fail(
      422,
      "INVALID_PAYMENT_DETAILS",
      "Hạn trả phải từ hôm nay và không trước ngày chốt; BIN gồm 6 số, tài khoản gồm 6–30 số.",
    );
  return {
    han_thanh_toan: due,
    ma_ngan_hang: bin,
    so_tai_khoan: account,
    ten_nguoi_nhan: name,
  };
}
export async function prepareBillAction(db, bill, apartment, operation, body) {
  v.version(bill, body.phien_ban);
  if (operation === "duyet") {
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
      [bill.ma_hoa_don],
    );
    const lines = saved.map(({ ma_hoa_don, ma_chi_tiet_hoa_don, ...l }) => ({
      ...l,
      du_lieu_nguon: json(l.du_lieu_nguon),
    }));
    if (digest({ lines, errors: json(bill.loi_du_lieu) }) !== bill.dau_van_tay)
      fail(
        409,
        "BILL_TOTAL_MISMATCH",
        "Chi tiết hóa đơn không khớp dữ liệu đã lập. Hãy tính lại.",
      );
    return {};
  }
  state(bill, ["DA_DUYET"]);
  return paymentDetails(body, bill.ngay_chot_phi);
}

export async function action(id, action, body, user, connection = null) {
  return transaction(async (db) => {
    const { bill, apartment } = await lockedBill(db, id);
    await assertBillingActor(db, user);
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
      await prepareBillAction(db, bill, apartment, action, body);
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='DA_DUYET',ma_nguoi_duyet=?,ngay_duyet=CURRENT_TIMESTAMP WHERE ma_hoa_don=?",
        [user.ma_nguoi_dung, id],
      );
    } else if (action === "gui") {
      state(bill, ["DA_DUYET"]);
      const details = await prepareBillAction(
        db,
        bill,
        apartment,
        action,
        body,
      );
      const {
        han_thanh_toan: due,
        ma_ngan_hang: bin,
        so_tai_khoan: account,
        ten_nguoi_nhan: name,
      } = details;
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
        "UPDATE hoa_don SET trang_thai='DA_THANH_TOAN',so_tien_da_thu=?,ma_tham_chieu=?,ma_nguoi_xac_nhan=?,ngay_thanh_toan=UTC_TIMESTAMP() WHERE ma_hoa_don=?",
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
  }, connection);
}

function access(user, where, values) {
  if (user.vai_tro === "QUAN_TRI_VIEN") return;
  if (user.vai_tro !== "CU_DAN")
    fail(403, "FORBIDDEN", "Bạn không có quyền xem hóa đơn.");
  if (user.ma_can_ho_thanh_toan !== null) {
    where.push(
      "h.trang_thai IN ('DA_GUI','DA_THANH_TOAN') AND EXISTS (SELECT 1 FROM nguoi_dung u WHERE u.ma_nguoi_dung=? AND u.ma_can_ho_thanh_toan=h.ma_can_ho AND u.dang_hoat_dong=1 AND u.phien_ban_token=?)",
    );
    values.push(user.ma_nguoi_dung, user.phien_ban_token);
  } else {
    where.push(
      "h.trang_thai IN ('DA_GUI','DA_THANH_TOAN') AND EXISTS (SELECT 1 FROM cu_dan c JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan WHERE c.ma_nguoi_dung=? AND l.ma_can_ho=h.ma_can_ho AND l.den_ngay IS NULL AND l.tu_ngay<=h.ngay_chot_phi)",
    );
    values.push(user.ma_nguoi_dung);
  }
}
function summary(bill) {
  return {
    ...bill,
    qua_han: bill.trang_thai === "DA_GUI" && bill.han_thanh_toan < v.today(),
  };
}
export async function list(query, user, exportFormat = null) {
  const { page, offset, limit, check } = reportPage(query, exportFormat),
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
  check(count.total);
  const data = await rows(
    pool,
    `SELECT h.ma_hoa_don,h.so_hoa_don,h.ky_thanh_toan,h.ngay_chot_phi,h.trang_thai,h.phien_ban,h.tong_tien,h.han_thanh_toan,a.so_can_ho FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho ${condition} ORDER BY h.ma_hoa_don DESC LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return { data: data.map(summary), total: count.total, page };
}
export async function detail(id, user) {
  const where = ["h.ma_hoa_don=?"],
    values = [id];
  access(user, where, values);
  const [row] = await rows(
    pool,
    `SELECT h.*,a.so_can_ho,c.ho_va_ten AS nguoi_phu_trach_thanh_toan FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho LEFT JOIN nguoi_dung tk ON tk.ma_can_ho_thanh_toan=h.ma_can_ho LEFT JOIN cu_dan c ON c.ma_cu_dan=tk.ma_cu_dan_phu_trach WHERE ${where.join(" AND ")}`,
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
    "nguoi_phu_trach_thanh_toan",
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

### 10. `backend/src/modules/billing/billing.electricity.js`

Chặn thuế vượt giới hạn cột đơn giá trước khi ghi MySQL. [Mở file gốc](../backend/src/modules/billing/billing.electricity.js).

```javascript
import { choice, fail } from "../../lib/http.js";
import * as v from "./billing.validation.js";

// Quantities use 3 decimal places, prices 2. No floating point money arithmetic.
export function electricityConfig(body, type) {
  const method = choice(body.cach_tinh ?? "DON_GIA", "cach_tinh", [
    "DON_GIA",
    "BAC_THANG",
  ]);
  const vat = v.scaled(body.thue_gtgt ?? "0", 2, 3);
  if (vat > 10000n) fail(422, "INVALID_VAT", "Thuế GTGT phải từ 0 đến 100%.");
  const invalid = () =>
    fail(
      422,
      "INVALID_TIERS",
      "Các bậc cần ngưỡng kWh nguyên tăng dần, giá không âm và bậc cuối không giới hạn.",
    );
  if (
    type !== "TIEN_DIEN" &&
    (method !== "DON_GIA" || vat !== 0n || body.bac_dien != null)
  )
    fail(
      422,
      "ELECTRICITY_ONLY",
      "Bậc thang và thuế riêng chỉ áp dụng cho tiền điện.",
    );
  if (method === "DON_GIA") {
    if (body.bac_dien != null) invalid();
    return { cach_tinh: method, thue_gtgt: v.decimal(vat, 2), bac_dien: null };
  }
  if (
    !Array.isArray(body.bac_dien) ||
    body.bac_dien.length < 2 ||
    body.bac_dien.length > 12
  )
    invalid();
  let previous = 0;
  const tiers = body.bac_dien.map((tier, index, all) => {
    if (!tier || typeof tier !== "object" || Array.isArray(tier)) invalid();
    const upper = tier.den_kwh;
    if (index === all.length - 1) {
      if (upper !== null) invalid();
    } else {
      if (
        !Number.isSafeInteger(upper) ||
        upper <= previous ||
        upper > 999999999
      )
        invalid();
      previous = upper;
    }
    return { den_kwh: upper, don_gia: v.decimal(v.scaled(tier.don_gia), 2) };
  });
  return { cach_tinh: method, thue_gtgt: v.decimal(vat, 2), bac_dien: tiers };
}

export function electricityLines(rate, used, source, meterId) {
  const tiers =
    typeof rate.bac_dien === "string"
      ? JSON.parse(rate.bac_dien)
      : rate.bac_dien;
  const config = electricityConfig({ ...rate, bac_dien: tiers }, "TIEN_DIEN");
  const lines = [];
  const add = (
    qty,
    price,
    label,
    unit,
    extra,
    total = v.lineTotal(qty, price),
  ) => {
    lines.push({
      loai_phi: "TIEN_DIEN",
      dien_giai: label,
      don_vi_tinh: unit,
      so_luong: qty,
      don_gia: price,
      thanh_tien: total,
      ma_cau_hinh_phi: rate.ma_cau_hinh_phi,
      ma_chi_so_dich_vu: meterId,
      du_lieu_nguon: { ...source, cach_tinh: config.cach_tinh, ...extra },
    });
  };
  if (config.cach_tinh === "DON_GIA") {
    add(
      v.decimal(used, 3),
      v.decimal(v.scaled(rate.don_gia), 2),
      "Tiền điện",
      "kWh",
      {},
    );
  } else {
    let lower = 0n,
      remaining = used;
    for (const [index, tier] of config.bac_dien.entries()) {
      const upper = tier.den_kwh === null ? null : BigInt(tier.den_kwh) * 1000n;
      const quantity =
        upper === null || remaining < upper - lower ? remaining : upper - lower;
      if (quantity > 0n || (used === 0n && index === 0))
        add(
          v.decimal(quantity, 3),
          tier.don_gia,
          `Tiền điện bậc ${index + 1} (${lower / 1000n}–${upper === null ? "không giới hạn" : upper / 1000n} kWh)`,
          "kWh",
          {
            bac: index + 1,
            tu_kwh: Number(lower / 1000n),
            den_kwh: tier.den_kwh,
          },
        );
      remaining -= quantity;
      if (remaining === 0n) break;
      lower = upper;
    }
  }
  const base = lines.reduce((sum, line) => sum + BigInt(line.thanh_tien), 0n);
  const vat = v.scaled(config.thue_gtgt, 2, 3);
  if (vat > 0n) {
    const tax = (base * vat + 5000n) / 10000n;
    // The tax is stored as a one-unit charge in don_gia DECIMAL(12,2).
    // Reject before writing SQL, including a rounded value above that limit.
    if (tax * 100n > 999999999999n)
      fail(422, "AMOUNT_TOO_LARGE", "Thuế điện vượt giới hạn đơn giá hóa đơn.");
    // One tax charge, whose unit price is the tax amount (not the energy rate).
    add(
      "1.000",
      v.decimal(tax * 100n, 2),
      `Thuế GTGT điện ${config.thue_gtgt}% trên ${base.toLocaleString("vi-VN")} đ`,
      "khoản",
      {
        thue_gtgt: config.thue_gtgt,
        tien_truoc_thue: base.toString(),
      },
      tax.toString(),
    );
  }
  return lines;
}
```

### 11. `frontend/src/shared/auth-session.js`

Tạo file mới: trạng thái phiên chỉ nằm trong bộ nhớ, có thế hệ yêu cầu. [Mở file gốc](../frontend/src/shared/auth-session.js).

```javascript
// Only memory is shared here; the server continues to own the session cookie.
let session = { user: null, expired: false, epoch: 0 };
const listeners = new Set();

export const getAuthSession = () => session;

export function subscribeAuthSession(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(user, expired) {
  session = { user, expired, epoch: session.epoch + 1 };
  for (const listener of listeners) listener();
}

export function setAuthSession(user) {
  publish(user, false);
}

export function expireAuthSession(requestSession, knownExpired = false) {
  // A request made before a login/logout cannot invalidate the newer session.
  if (
    requestSession.epoch !== session.epoch ||
    session.expired ||
    (!requestSession.user && !knownExpired)
  )
    return;
  publish(null, true);
}
```

### 12. `frontend/src/shared/api/client.js`

Đồng bộ 401; không để phản hồi cũ xóa phiên mới. [Mở file gốc](../frontend/src/shared/api/client.js).

```javascript
import { expireAuthSession, getAuthSession } from "../auth-session.js";

// JSON requests and file downloads must observe the same session generation.
export async function fetchWithSession(input, options = {}) {
  const requestSession = getAuthSession();
  const response = await fetch(input, options);
  const pathname = new URL(
    typeof input === "string" ? input : input.url || String(input),
    "http://app.invalid",
  ).pathname;
  if (
    response.status === 401 &&
    pathname.replace(/\/+$/, "") !== "/api/xac_thuc/dang_nhap"
  ) {
    expireAuthSession(requestSession);
    if (!requestSession.user) {
      // On first load there is no user yet. Only an explicit expired-cookie
      // response distinguishes that session from an ordinary anonymous visit.
      const data = await response
        .clone()
        .json()
        .catch(() => null);
      if (data?.error?.code === "SESSION_EXPIRED")
        expireAuthSession(requestSession, true);
    }
  }
  return response;
}

export async function getJson(path, options = {}) {
  const requestSession = getAuthSession();
  const pathname = path.split(/[?#]/, 1)[0];
  if (
    requestSession.expired &&
    /^\/cong_khai\/phan_anh\/?$/.test(pathname) &&
    !["GET", "HEAD"].includes((options.method || "GET").toUpperCase())
  )
    throw Object.assign(
      new Error(
        "Phiên đã hết hạn. Vui lòng đăng nhập lại trước khi gửi. Nội dung và ảnh trong biểu mẫu vẫn được giữ lại.",
      ),
      { status: 401, code: "SESSION_EXPIRED" },
    );
  const headers = { "X-App-Request": "1", ...options.headers };
  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetchWithSession(`/api${path}`, {
      ...options,
      headers,
      body,
      credentials: "same-origin",
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Không kết nối được máy chủ. Thông tin trong biểu mẫu vẫn được giữ lại.",
    );
  }
  let result;
  try {
    result = await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw Object.assign(
      new Error(
        `Máy chủ chưa trả được phản hồi hợp lệ (HTTP ${response.status}). Vui lòng thử lại sau.`,
      ),
      { status: response.status, code: "API_RESPONSE_INVALID" },
    );
  }
  if (!result || typeof result !== "object" || Array.isArray(result))
    throw Object.assign(
      new Error("Phản hồi từ máy chủ không hợp lệ. Vui lòng tải lại trang."),
      {
        status: response.status,
        code: "API_RESPONSE_INVALID",
      },
    );
  if (!response.ok) {
    const error = new Error(
      result.error?.message || `Yêu cầu thất bại (${response.status})`,
    );
    Object.assign(error, result.error, { status: response.status });
    throw error;
  }
  return result;
}
```

### 13. `frontend/src/features/auth/Auth.jsx`

Hiển thị đăng nhập khi hết phiên, giữ cây biểu mẫu công khai. [Mở file gốc](../frontend/src/features/auth/Auth.jsx).

```jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import {
  getAuthSession,
  setAuthSession,
  subscribeAuthSession,
} from "../../shared/auth-session.js";
import Icon from "../../shared/Icon.jsx";
import PhotoCarousel from "../../shared/PhotoCarousel.jsx";
import { serviceDestination } from "../incidents/portal-services.js";
import {
  ErrorBox,
  Field,
  Loading,
  homeFor,
  roleNames,
} from "../../shared/ui.jsx";
const Context = createContext(null);
export const useAuth = () => useContext(Context);
export function AuthProvider({ children }) {
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const initialSession = getAuthSession();
    const controller = new AbortController();
    getJson("/xac_thuc/toi", { signal: controller.signal })
      .then((r) => {
        if (
          !controller.signal.aborted &&
          initialSession.epoch === getAuthSession().epoch
        )
          setAuthSession(r.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  const logout = async () => {
    const requestSession = getAuthSession();
    await getJson("/xac_thuc/dang_xuat", { method: "POST" });
    if (requestSession.epoch === getAuthSession().epoch) setAuthSession(null);
  };
  return (
    <Context.Provider
      value={{
        user: session.user,
        setUser: setAuthSession,
        sessionExpired: session.expired,
        loading,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/dang-nhap" replace />;
  if (roles && !roles.includes(user.vai_tro))
    return (
      <div className="card">
        <h1>Bạn không có quyền mở trang này</h1>
        <Link to={homeFor(user)}>Về không gian của tôi</Link>
      </div>
    );
  return children;
}
export function Login() {
  const { user, setUser, sessionExpired } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [error, setError] = useState(),
    [pending, setPending] = useState(false),
    [showPassword, setShowPassword] = useState(false);
  if (user)
    return (
      <Navigate
        to={serviceDestination(user, location.state?.service) || homeFor(user)}
        replace
      />
    );
  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <span className="auth-story-label">
          <Icon name="building" size={18} />
          Không gian sống, kết nối mỗi ngày
        </span>
        <h2>
          Dịch vụ tòa nhà,
          <br />
          trong tầm tay bạn.
        </h2>
        <p>
          Theo dõi hóa đơn, gửi phản ánh và sử dụng dịch vụ chung cư ngay trong
          tài khoản của bạn.
        </p>
        <PhotoCarousel variant="auth" />
        <div className="auth-trust">
          <Icon name="shield" />
          <span>Thông tin và dịch vụ theo tài khoản được cấp.</span>
        </div>
      </aside>
      <section className="card auth-form">
        <p className="eyebrow">Chào mừng bạn trở lại</p>
        <h1>Đăng nhập</h1>
        <p className="muted">Sử dụng tài khoản do Ban quản lý cấp.</p>
        {sessionExpired && (
          <p className="note" role="status">
            Phiên đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.
          </p>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            setError(null);
            try {
              const result = await getJson("/xac_thuc/dang_nhap", {
                method: "POST",
                body: Object.fromEntries(new FormData(e.currentTarget)),
              });
              let session;
              try {
                session = await getJson("/xac_thuc/toi");
              } catch (sessionError) {
                if (sessionError.status !== 401) throw sessionError;
                throw new Error(
                  "Trình duyệt chưa lưu được phiên đăng nhập. Hãy mở đúng địa chỉ web, kiểm tra quyền cookie và dùng HTTPS, rồi thử lại.",
                );
              }
              if (
                !session.data?.ma_nguoi_dung ||
                session.data.ma_nguoi_dung !== result.data?.ma_nguoi_dung
              )
                throw new Error(
                  "Không duy trì được phiên đăng nhập. Vui lòng đăng nhập lại tại cùng địa chỉ web.",
                );
              setUser(session.data);
              navigate(
                serviceDestination(session.data, location.state?.service) ||
                  homeFor(session.data),
              );
            } catch (err) {
              setError(err);
            } finally {
              setPending(false);
            }
          }}
        >
          <Field
            label="Số điện thoại hoặc tài khoản căn hộ"
            name="so_dien_thoai"
            type="text"
            required
            autoComplete="username"
          />
          <Field label="Loại tài khoản">
            <select name="loai_tai_khoan" defaultValue="TU_DONG">
              <option value="TU_DONG">Tự nhận diện</option>
              <option value="CAN_HO">Tài khoản căn hộ</option>
              <option value="CA_NHAN">Tài khoản cá nhân / Ban quản lý</option>
            </select>
          </Field>
          <details className="login-help">
            <summary>Dùng số điện thoại hay mã căn hộ?</summary>
            <p>
              Tài khoản căn hộ dùng số điện thoại của chủ hộ phụ trách hiện tại
              hoặc mã CH. Nếu số điện thoại dùng chung với tài khoản cá nhân,
              chọn loại tài khoản phù hợp.
            </p>
          </details>
          <div className="password-field">
            <Field
              label="Mật khẩu"
              name="mat_khau"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              <Icon name={showPassword ? "eyeOff" : "eye"} />
            </button>
          </div>
          <ErrorBox error={error} />
          <button className="primary auth-submit" disabled={pending}>
            {pending ? "Đang đăng nhập…" : "Đăng nhập"}
            <Icon name="arrow" size={18} />
          </button>
        </form>
        <p className="muted">
          Chưa có tài khoản hoặc quên mật khẩu? Liên hệ Ban quản lý để được xác
          minh.
        </p>
        <Link to="/">Về cổng dịch vụ</Link>
      </section>
    </div>
  );
}
export function Account() {
  const { user, setUser } = useAuth();
  const [error, setError] = useState(),
    [pending, setPending] = useState(false),
    [done, setDone] = useState(false);
  if (done)
    return (
      <div className="card">
        <h1>Đã đổi mật khẩu</h1>
        <p>Tất cả phiên cũ đã kết thúc.</p>
        <Link to="/dang-nhap" onClick={() => setUser(null)}>
          Đăng nhập lại
        </Link>
      </div>
    );
  return (
    <section className="card narrow">
      <h1>Tài khoản</h1>
      <p>
        {user.ho_va_ten} · {roleNames[user.vai_tro]}
      </p>
      <p>{user.ten_dang_nhap || user.so_dien_thoai}</p>
      {user.ma_can_ho_thanh_toan && (
        <p>
          Số điện thoại đăng nhập:{" "}
          {user.dien_thoai_dang_nhap || "Chưa gắn chủ hộ"}
        </p>
      )}
      <h2>Đổi mật khẩu</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          setError(null);
          if (form.get("mat_khau_moi") !== form.get("xac_nhan")) {
            setError(new Error("Mật khẩu xác nhận không khớp."));
            return;
          }
          setPending(true);
          try {
            await getJson("/xac_thuc/doi_mat_khau", {
              method: "POST",
              body: Object.fromEntries(form),
            });
            setDone(true);
          } catch (err) {
            setError(err);
          } finally {
            setPending(false);
          }
        }}
      >
        <Field
          label="Mật khẩu hiện tại"
          name="mat_khau_cu"
          type="password"
          required
          autoComplete="current-password"
        />
        <Field
          label="Mật khẩu mới (ít nhất 10 ký tự)"
          name="mat_khau_moi"
          type="password"
          minLength={10}
          required
          autoComplete="new-password"
        />
        <Field
          label="Nhập lại mật khẩu mới"
          name="xac_nhan"
          type="password"
          minLength={10}
          required
          autoComplete="new-password"
        />
        <ErrorBox error={error} />
        <button className="primary" disabled={pending}>
          Đổi mật khẩu và kết thúc mọi phiên
        </button>
      </form>
    </section>
  );
}
```

### 14. `frontend/src/shared/ReportExport.jsx`

Đồng bộ hết phiên cả khi tải Excel/PDF. [Mở file gốc](../frontend/src/shared/ReportExport.jsx).

```jsx
import React, { useEffect, useRef, useState } from "react";
import { ErrorBox } from "./ui.jsx";
import { fetchWithSession } from "./api/client.js";
export default function ReportExport({
  path,
  disabled = false,
  template = false,
}) {
  const [pending, setPending] = useState(""),
    [error, setError] = useState(null),
    [notice, setNotice] = useState(""),
    active = useRef(null),
    currentPath = useRef(path);
  currentPath.current = path;
  useEffect(() => {
    active.current?.abort();
    active.current = null;
    setPending("");
    setError(null);
    setNotice("");
    return () => active.current?.abort();
  }, [path]);
  async function download(format) {
    const controller = new AbortController(),
      requestPath = path;
    active.current = controller;
    setPending(format);
    setError(null);
    setNotice("");
    try {
      const url = new URL("/api" + path, window.location.origin);
      url.searchParams.set("dinh_dang", format);
      const r = await fetchWithSession(url, {
        credentials: "same-origin",
        headers: { "X-App-Request": "1" },
        signal: controller.signal,
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        const message =
          data.error?.message ||
          (r.status >= 500
            ? "Máy chủ chưa trả được tệp báo cáo. Kiểm tra backend đang chạy và lỗi trong terminal backend rồi thử lại."
            : `Không tải được báo cáo (${r.status}).`);
        throw new Error(message);
      }
      const mime =
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      if (!r.headers.get("Content-Type")?.startsWith(mime))
        throw new Error("Máy chủ trả tệp không đúng định dạng. Hãy thử lại.");
      const blob = await r.blob();
      if (controller.signal.aborted || currentPath.current !== requestPath)
        return;
      const file =
        r.headers
          .get("Content-Disposition")
          ?.match(/filename="([a-zA-Z0-9_.-]+)"/)?.[1] || `bao-cao.${format}`;
      const link = document.createElement("a"),
        objectURL = URL.createObjectURL(blob);
      link.href = objectURL;
      link.download = file;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectURL), 60000);
      setNotice(
        template
          ? "Đã tải mẫu trống. Điền sheet Nhap từ dòng 2, lưu tệp rồi chọn lại để xem trước. Sheet Vi du chỉ minh họa."
          : `Đã tạo tệp ${format === "pdf" ? "PDF" : "Excel"} gồm ${Number(r.headers.get("X-Export-Rows") || 0).toLocaleString("vi-VN")} dòng. ${format === "xlsx" ? "Excel mở tại trang Chi tiết; bộ lọc và số liệu chung nằm ở trang Tổng hợp. " : ""}Kiểm tra mục Tệp đã tải xuống của trình duyệt.`,
      );
    } catch (e) {
      if (!controller.signal.aborted && currentPath.current === requestPath)
        setError(
          e.name === "TypeError"
            ? new Error(
                "Không kết nối được máy chủ để tải báo cáo. Hãy thử lại.",
              )
            : e,
        );
    } finally {
      if (active.current === controller) {
        active.current = null;
        setPending("");
      }
    }
  }
  return (
    <section
      className="report-export"
      aria-label={template ? "Tải mẫu Excel" : "Xuất báo cáo"}
    >
      <div className="actions">
        <button
          type="button"
          disabled={disabled || !!pending}
          onClick={() => download("xlsx")}
        >
          {pending === "xlsx"
            ? "Đang tạo Excel…"
            : template
              ? "Tải mẫu Excel"
              : "Xuất Excel"}
        </button>
        {!template && (
          <button
            type="button"
            disabled={disabled || !!pending}
            onClick={() => download("pdf")}
          >
            {pending === "pdf" ? "Đang tạo PDF…" : "Xuất PDF"}
          </button>
        )}
        <small>
          {template
            ? "Mẫu trống .xlsx: điền sheet Nhap từ dòng 2, tối đa 100 dòng. Ví dụ nằm riêng ở sheet Vi du."
            : "Xuất toàn bộ kết quả theo bộ lọc: tối đa 10.000 dòng Excel hoặc 1.000 dòng PDF. Excel có trang Chi tiết và Tổng hợp."}
        </small>
      </div>
      {notice && (
        <p className="note" role="status">
          {notice}
        </p>
      )}
      <ErrorBox error={error} />
    </section>
  );
}
```

### 15. `backend/scripts/seed-acceptance.js`

Cập nhật thông báo schema khi tạo bộ nghiệm thu mới; không cần tạo lại dữ liệu đã có. [Mở file gốc](../backend/scripts/seed-acceptance.js).

```javascript
// Synthetic acceptance data only. Never point this script at chung_cu or chung_cu_test.
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import QRCode from "qrcode";
import ExcelJS from "exceljs";
import { acceptanceOptions } from "../../scripts/create-acceptance-data.js";
import { pool, rows } from "../src/lib/db.js";
import * as structure from "../src/modules/residency/building-structure.service.js";
import * as residency from "../src/modules/residency/residency.service.js";
import * as accounts from "../src/modules/residency/apartment-accounts.service.js";
import * as vehicles from "../src/modules/vehicles/vehicles.service.js";
import * as billing from "../src/modules/billing/billing.service.js";
import { batchBills } from "../src/modules/billing/billing-batch.service.js";
import { batchBillActions } from "../src/modules/billing/billing-batch-actions.service.js";
import { today } from "../src/modules/billing/billing.validation.js";
import * as maintenance from "../src/modules/maintenance/maintenance.service.js";
import * as amenities from "../src/modules/amenities/amenities.service.js";
import * as announcements from "../src/modules/announcements/announcements.service.js";
import * as treasury from "../src/modules/treasury/treasury.service.js";
import * as qr from "../src/modules/qr/qr.service.js";
import * as incidents from "../src/modules/incidents/incidents.service.js";
import { importFile } from "../src/modules/data-exchange/import.service.js";
import { catalog } from "../src/modules/data-exchange/catalog.js";
import { template } from "../src/modules/data-exchange/import-files.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const day = today();
const shiftDay = (date, n) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000)
    .toISOString()
    .slice(0, 10);
const month = (offset) => {
  const date = new Date(`${day.slice(0, 7)}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
};
const endMonth = (value) => {
  const date = new Date(`${value}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return date.toISOString().slice(0, 10);
};
const beginning = `${month(-13)}-01`;
const stamp = (date, hour = "02") => `${date} ${hour}:00:00`;
const options = acceptanceOptions([
  `--database=${process.env.DB_NAME || ""}`,
  `--origin=${process.env.ACCEPTANCE_ORIGIN || "https://localhost:5173"}`,
]);
const out = path.join(root, "backend/storage/acceptance", options.database);
const manifest = {
  database: options.database,
  ngay_tao: day,
  origin: options.origin,
  trang_thai: "DANG_TAO",
  accounts: [],
  qr: [],
  invoices: [],
  scenarios: [],
  checks: [],
  files: [],
};
const saveManifest = () =>
  writeFile(
    path.join(out, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    { mode: 0o600 },
  );
const scenario = (feature, steps, expected) =>
  manifest.scenarios.push({ feature, steps, expected });
const one = async (table, key, id) =>
  (await rows(pool, `SELECT * FROM ${table} WHERE ${key}=?`, [id]))[0];
async function versioned(table, key, id, body) {
  return { phien_ban: (await one(table, key, id)).phien_ban, ...body };
}
let admin, tech, otherTech, residentUser;
const apartments = [],
  residents = [],
  equipment = [],
  locations = [];

async function freshDatabase() {
  const tables = await rows(
    pool,
    "SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE'",
  );
  if (tables.length !== 38)
    throw new Error(
      "Cần schema hiện tại với 38 bảng. Kiểm tra migration trước khi tạo dữ liệu.",
    );
  for (const { name } of tables) {
    if (["schema_migrations", "loai_phi", "quy_tai_chinh"].includes(name))
      continue;
    if (!/^[a-z0-9_]+$/.test(name)) throw new Error("Tên bảng không hỗ trợ.");
    const [count] = await rows(pool, `SELECT COUNT(*) AS n FROM \`${name}\``);
    if (count.n)
      throw new Error(
        `Database đã có dữ liệu ở ${name}. Dừng để giữ nguyên. Dùng --database=chung_cu_nghiem_thu_<mã mới> cho bộ mới.`,
      );
  }
  const [[funds], [types]] = await Promise.all([
    rows(pool, "SELECT COUNT(*) AS n FROM quy_tai_chinh"),
    rows(pool, "SELECT COUNT(*) AS n FROM loai_phi"),
  ]);
  if (funds.n !== 1 || types.n !== 6)
    throw new Error(
      "Database không còn ở trạng thái migration mới, chưa tạo dữ liệu.",
    );
  await mkdir(path.dirname(out), { recursive: true });
  // Refuse to overwrite any previous seed credentials, including partial runs.
  await mkdir(out);
  await saveManifest();
}
async function createUser(name, phone, role, active = true) {
  const password = randomBytes(18).toString("base64url");
  manifest.accounts.push({
    name,
    login: phone,
    password,
    role,
    kind: "CA_NHAN",
    active,
  });
  await saveManifest();
  const r = await rows(
    pool,
    "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,vai_tro,chuyen_mon,mat_khau_ma_hoa,dang_hoat_dong) VALUES (?,?,?,?,?,?)",
    [
      name,
      phone,
      role,
      role === "KY_THUAT_VIEN" ? "Điện nước và thiết bị" : "",
      await bcrypt.hash(password, 12),
      active,
    ],
  );
  return one("nguoi_dung", "ma_nguoi_dung", r.insertId);
}
async function seedHousing() {
  admin = await createUser("NT · Ban quản lý", "0909000001", "QUAN_TRI_VIEN");
  tech = await createUser(
    "NT · Kỹ thuật điện nước",
    "0909000002",
    "KY_THUAT_VIEN",
  );
  otherTech = await createUser(
    "NT · Kỹ thuật thang máy",
    "0909000003",
    "KY_THUAT_VIEN",
  );
  residentUser = await createUser(
    "NT · Trần Ngọc Mai (cá nhân)",
    "0909000004",
    "CU_DAN",
  );
  await createUser(
    "NT · Nhân sự đã khóa",
    "0909000005",
    "KY_THUAT_VIEN",
    false,
  );
  for (const block of ["A", "B", "C"]) {
    await structure.saveBlock(null, {
      khoi: block,
      ten_khoi: `Khối ${block} nghiệm thu`,
      mo_ta:
        block === "C"
          ? "Khối trống để thử danh mục độc lập"
          : "Dữ liệu giả lập",
    });
    if (block === "C") continue;
    for (let floor = 1; floor <= (block === "A" ? 4 : 3); floor++) {
      await structure.saveFloor(block, null, {
        tang: floor,
        ten_tang: `Tầng ${floor}`,
        mo_ta: "Nghiệm thu",
      });
      if (floor === 4) continue;
      for (let n = 1; n <= 3; n++) {
        const apartment = await residency.saveApartment(
          null,
          {
            so_can_ho: `${block}${floor}0${n}`,
            khoi: block,
            tang: floor,
            dien_tich_m2: ["65.50", "80", "52.25"][n - 1],
            tinh_phi_dich_vu: !(block === "B" && floor === 3),
          },
          admin,
        );
        apartments.push(apartment);
      }
    }
  }
  const names = [
    "Nguyễn Minh An",
    "Lê Quang Bình",
    "Phạm Thu Hà",
    "Võ Thành Nam",
    "Đặng Ngọc Lan",
    "Bùi Gia Huy",
    "Đỗ Thanh Tâm",
    "Ngô Hải Yến",
    "Lý Quốc Bảo",
    "Trương Minh Tú",
  ];
  for (const [i, name] of names.entries()) {
    const apt = apartments[i < 6 ? i : i + 1];
    residents.push(
      await residency.saveResident(
        null,
        {
          ho_va_ten: `NT · ${name}`,
          so_dien_thoai: `090901${String(i + 1).padStart(4, "0")}`,
          ma_can_ho: apt.ma_can_ho,
          quan_he: "CHU_HO",
          ngay: beginning,
        },
        admin,
      ),
    );
  }
  residents.push(
    await residency.saveResident(
      null,
      {
        ho_va_ten: residentUser.ho_va_ten,
        so_dien_thoai: residentUser.so_dien_thoai,
        ma_nguoi_dung: residentUser.ma_nguoi_dung,
        ma_can_ho: apartments[0].ma_can_ho,
        quan_he: "THANH_VIEN",
        ngay: beginning,
      },
      admin,
    ),
  );
  const moving = await residency.saveResident(
    null,
    {
      ho_va_ten: "NT · Cư dân chuyển căn kèm xe",
      so_dien_thoai: "0909010091",
      ma_can_ho: apartments[12].ma_can_ho,
      quan_he: "NGUOI_THUE",
      ngay: beginning,
    },
    admin,
  );
  const stay = (await residency.residentDetail(moving.ma_cu_dan)).history[0];
  await vehicles.create(
    {
      ma_cu_dan: moving.ma_cu_dan,
      ma_lich_su_cu_tru: stay.ma_lich_su_cu_tru,
      loai_xe: "XE_MAY",
      bien_so: "99NT00991",
      hang_xe: "Honda",
      mau_sac: "Xanh",
      ngay_dang_ky: beginning,
    },
    admin,
  );
  await residency.changeStay(
    moving.ma_cu_dan,
    "chuyen_can",
    {
      ngay: day,
      phien_ban: moving.phien_ban,
      ma_can_ho: apartments[13].ma_can_ho,
      quan_he: "NGUOI_THUE",
      chuyen_phuong_tien: true,
    },
    admin,
  );
  residents.push(moving);
  const leaving = await residency.saveResident(
    null,
    {
      ho_va_ten: "NT · Cư dân đã chuyển đi",
      so_dien_thoai: "0909010092",
      ma_can_ho: apartments[14].ma_can_ho,
      quan_he: "CHU_HO",
      ngay: beginning,
    },
    admin,
  );
  await residency.changeStay(
    leaving.ma_cu_dan,
    "chuyen_di",
    { ngay: shiftDay(day, -7), phien_ban: leaving.phien_ban },
    admin,
  );
  residents.push(leaving);
  for (let i = 0; i < 6; i++) {
    const stay = (await residency.residentDetail(residents[i].ma_cu_dan))
      .history[0];
    for (let n = 0; n <= i % 3; n++)
      await vehicles.create(
        {
          ma_cu_dan: residents[i].ma_cu_dan,
          ma_lich_su_cu_tru: stay.ma_lich_su_cu_tru,
          loai_xe: ["XE_MAY", "O_TO", "XE_DAP"][n],
          bien_so: n === 2 ? "" : `99NT${i}00${n}1`,
          hang_xe: ["Honda", "Toyota", "Thống Nhất"][n],
          mau_sac: "Trắng",
          ngay_dang_ky: beginning,
        },
        admin,
      );
  }
  scenario(
    "Nhà ở, cư trú và xe",
    "Sơ đồ: khối C trống, tầng A4 trống. Căn A101 có chủ hộ và thành viên. Tìm cư dân chuyển căn/chuyển đi; xem lịch sử và xe.",
    "Đúng số căn/người; xe chuyển từ B201 sang B202, lịch sử cũ không mất.",
  );
}

const payment = {
  ma_ngan_hang: "970422",
  so_tai_khoan: "000000000000",
  ten_nguoi_nhan: "TAI KHOAN GIA LAP KHONG CHUYEN TIEN",
};
async function batchAction(ids, operation) {
  const items = [];
  for (const id of ids) {
    const bill = await one("hoa_don", "ma_hoa_don", id);
    items.push({ ma_hoa_don: id, phien_ban: bill.phien_ban });
  }
  const body = {
    thao_tac: operation,
    hoa_don: items,
    ...payment,
    han_thanh_toan: shiftDay(day, 10),
  };
  const preview = await batchBillActions(body, admin);
  if (!preview.xac_nhan)
    throw new Error(
      `Không xem trước được lô ${operation}: ${JSON.stringify(preview.rows)}`,
    );
  return batchBillActions(
    { ...body, xac_nhan: preview.xac_nhan, khoa_yeu_cau: randomUUID() },
    admin,
    true,
  );
}
async function seedBilling() {
  for (const [loai_phi, don_gia] of [
    ["PHI_QUAN_LY", "12000"],
    ["GUI_XE_MAY", "100000"],
    ["GUI_O_TO", "1200000"],
    ["GUI_XE_DAP", "30000"],
    ["TIEN_NUOC", "15000"],
    ["TIEN_DIEN", "0"],
  ])
    await billing.createRate(
      {
        loai_phi,
        don_gia,
        tu_ngay: beginning,
        ...(loai_phi === "TIEN_DIEN"
          ? {
              cach_tinh: "BAC_THANG",
              thue_gtgt: "8",
              bac_dien: [50, 100, 200, 300, 400, null].map((den_kwh, i) => ({
                den_kwh,
                don_gia: [1984, 2050, 2380, 2998, 3350, 3460][i].toString(),
              })),
            }
          : {}),
      },
      admin,
    );
  const counters = Array.from({ length: 6 }, () => ({ DIEN: 1000, NUOC: 100 }));
  for (let offset = -12; offset <= 0; offset++) {
    const period = month(offset),
      cutoff = offset ? endMonth(period) : day;
    for (let i = 0; i < 6; i++)
      for (const type of ["DIEN", "NUOC"]) {
        const used =
          type === "DIEN"
            ? [35, 75, 150, 250, 350, 450][i] + ((offset + 12) % 3)
            : 5 + i;
        await billing.saveMeter(
          {
            ma_can_ho: apartments[i].ma_can_ho,
            loai_dich_vu: type,
            ky_thanh_toan: period,
            ngay_chot: cutoff,
            chi_so_cu: counters[i][type].toString(),
            chi_so_moi: (counters[i][type] + used).toString(),
            ky_dau: offset === -12,
            ghi_chu: "Chỉ số nghiệm thu giả lập",
          },
          admin,
        );
        counters[i][type] += used;
      }
    const body = {
      ma_can_ho: apartments.slice(0, 6).map((apt) => apt.ma_can_ho),
      ky_thanh_toan: period,
      ngay_chot_phi: cutoff,
      tinh_dien: true,
      tinh_nuoc: true,
      tinh_xe: true,
    };
    const preview = await batchBills(body, admin);
    if (!preview.xac_nhan)
      throw new Error(
        `Lỗi dữ liệu lô hóa đơn: ${JSON.stringify(preview.rows)}`,
      );
    const batch = await batchBills(
      { ...body, xac_nhan: preview.xac_nhan, khoa_yeu_cau: randomUUID() },
      admin,
      true,
    );
    const ids = batch.hoa_don.map((bill) => bill.ma_hoa_don);
    await batchAction(offset ? ids : ids.slice(1), "DUYET");
    await batchAction(offset ? ids : ids.slice(2), "GUI");
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if ((offset && i < 4) || (!offset && i === 4)) {
        const b = await one("hoa_don", "ma_hoa_don", id);
        await billing.action(
          id,
          "xac_nhan_thanh_toan",
          {
            phien_ban: b.phien_ban,
            so_tien: b.tong_tien,
            ma_tham_chieu: `NT-${period}-${i}`,
          },
          admin,
        );
      }
      if (!offset && i === 5) {
        await billing.action(
          id,
          "huy",
          await versioned("hoa_don", "ma_hoa_don", id, {
            ly_do: "Hủy mẫu để thử hóa đơn thay thế",
          }),
          admin,
        );
        await billing.action(
          id,
          "lap_thay_the",
          await versioned("hoa_don", "ma_hoa_don", id, {}),
          admin,
        );
      }
      // Historical timestamps are synthetic fixtures; amounts/statuses were made by real services.
      const recorded = offset
        ? shiftDay(
            cutoff,
            -Math.min(5, new Date(`${cutoff}T00:00:00Z`).getUTCDate() - 1),
          )
        : day;
      await rows(
        pool,
        "UPDATE hoa_don SET ngay_tao=?,ngay_duyet=IF(ngay_duyet IS NULL,NULL,?),ngay_gui=IF(ngay_gui IS NULL,NULL,?),ngay_thanh_toan=IF(ngay_thanh_toan IS NULL,NULL,?),han_thanh_toan=IF(trang_thai IN ('DA_GUI','DA_THANH_TOAN'),?,han_thanh_toan) WHERE ma_hoa_don=?",
        [
          stamp(recorded),
          stamp(recorded, "03"),
          stamp(recorded, "04"),
          stamp(recorded, "05"),
          offset ? cutoff : shiftDay(day, 10),
          id,
        ],
      );
      await rows(
        pool,
        "UPDATE lich_su_hoa_don SET ngay_tao=? WHERE ma_hoa_don=?",
        [stamp(recorded, "05"), id],
      );
      manifest.invoices.push({
        id,
        apartment: apartments[i].so_can_ho,
        period,
        ...(
          await rows(
            pool,
            "SELECT trang_thai,tong_tien,han_thanh_toan FROM hoa_don WHERE ma_hoa_don=?",
            [id],
          )
        )[0],
      });
    }
    console.log(`  Hóa đơn kỳ ${period}`);
  }
  const unpaid = (
    await rows(
      pool,
      "SELECT * FROM hoa_don WHERE trang_thai='DA_GUI' ORDER BY ky_thanh_toan LIMIT 1",
    )
  )[0];
  await announcements.remindBill(
    unpaid.ma_hoa_don,
    { phien_ban: unpaid.phien_ban },
    admin,
  );
  scenario(
    "Giá, chỉ số, hóa đơn, nhắc phí",
    "Xem A101–A203, 13 kỳ. Kỳ hiện tại có nháp/đã duyệt/đã gửi/đã thu/hủy và bản thay thế. Mở A101 xem hóa đơn cũ và nhắc phí.",
    "Điện qua đủ 6 bậc, xe theo từng loại; hóa đơn cũ có công nợ quá hạn. VietQR dùng STK giả lập, tuyệt đối không chuyển tiền.",
  );
}

let scene, completion;
async function seedAssetsAndReports() {
  await mkdir(path.join(out, "anh"));
  const makeImage = async (label, color, file) => {
    const svg = `<svg width="960" height="640" xmlns="http://www.w3.org/2000/svg"><rect width="960" height="640" fill="${color}"/><rect x="90" y="140" width="780" height="370" fill="#fff"/><text x="140" y="260" font-size="38">DU LIEU NGHIEM THU GIA LAP</text><text x="140" y="340" font-size="32">${label}</text><text x="140" y="420" font-size="24">${day} - khong phai anh hien truong that</text></svg>`;
    const buffer = await sharp(Buffer.from(svg)).jpeg().toBuffer();
    await writeFile(path.join(out, "anh", file), buffer);
    return { originalname: file, mimetype: "image/jpeg", buffer };
  };
  scene = await makeImage(
    "MO PHONG SU CO - thiet bi can kiem tra",
    "#edc9b8",
    "hien-truong.jpg",
  );
  completion = await makeImage(
    "MO PHONG HOAN THANH - da kiem tra",
    "#b8ded4",
    "nghiem-thu.jpg",
  );
  for (let i = 0; i < 8; i++) {
    const e = await maintenance.createEquipment(
      {
        ma_tai_san: `NT-TB-${String(i + 1).padStart(2, "0")}`,
        ten_thiet_bi: [
          "Thang máy A",
          "Máy bơm A",
          "Tủ PCCC A",
          "Tủ điện B",
          "Camera sảnh",
          "Đồng hồ nước",
          "Quạt thông gió tạm dừng",
          "Máy bơm đã ngừng",
        ][i],
        loai: [
          "THANG_MAY",
          "MAY_BOM",
          "PCCC",
          "DIEN",
          "CAMERA",
          "NUOC",
          "KHAC",
          "MAY_BOM",
        ][i],
        vi_tri: i < 4 ? "Khối A · tầng 1" : "Khối B · tầng 1",
        so_serial: `NT-SN-${i}`,
        ngay_lap_dat: beginning,
        trang_thai:
          i === 7 ? "NGUNG_SU_DUNG" : i === 6 ? "TAM_DUNG" : "DANG_SU_DUNG",
        chu_ky_ngay: i === 5 ? null : 30,
        ngay_bao_tri_tiep_theo:
          i === 5 ? null : shiftDay(day, [-10, -2, 0, 3, 30, 0, 5, 0][i]),
        nhac_truoc_ngay: 7,
        ghi_chu: "Dữ liệu tài sản giả lập để nghiệm thu",
      },
      admin,
    );
    equipment.push(await one("thiet_bi", "ma_thiet_bi", e.ma_thiet_bi));
  }
  for (let i = 0; i < 5; i++)
    locations.push(
      await qr.create(
        {
          ten_vi_tri: `NT · ${["Thang máy A", "Máy bơm A", "Sảnh A", "Bãi xe B", "Mã đã vô hiệu"][i]}`,
          loai: i < 2 ? "THIET_BI" : "KHU_VUC",
          ma_thiet_bi: i < 2 ? equipment[i].ma_thiet_bi : null,
          mo_ta: "Vị trí nghiệm thu giả lập",
        },
        admin,
      ),
    );
  const reportIds = [];
  const states = [
    "MOI",
    "DA_PHAN_CONG",
    "DANG_XU_LY",
    "DA_XU_LY",
    "DA_DONG",
    "TU_CHOI",
    "TRUNG",
    "DANG_XU_LY",
  ];
  for (let i = 0; i < 32; i++) {
    const location = locations[i % 4],
      target = states[i % states.length];
    const receipt = await incidents.submit(
      {
        token_qr: location.token_qr,
        phien_ban_qr: location.phien_ban,
        khoa_yeu_cau: randomUUID(),
        tieu_de: `NT-${String(i + 1).padStart(2, "0")} · ${target} · cần kiểm tra thiết bị/khu vực`,
        noi_dung:
          "Dữ liệu giả lập: phát hiện tiếng ồn/rò nước tại vị trí. Đề nghị Ban quản lý kiểm tra và phản hồi.",
        ten_nguoi_gui: i % 2 ? residents[0].ho_va_ten : residentUser.ho_va_ten,
        so_dien_thoai: `090902${String(i + 1).padStart(4, "0")}`,
        loai_su_co: incidents.categories[i % incidents.categories.length],
        xac_nhan_gui: true,
      },
      [scene],
      i % 2 ? null : residentUser,
      "127.0.0.1",
    );
    const report = (
      await rows(pool, "SELECT * FROM phan_anh WHERE ma_tra_cuu=?", [
        receipt.ma_tra_cuu,
      ])
    )[0];
    const id = report.ma_phan_anh;
    reportIds.push(id);
    const change = async (state, actor, files = [], extra = {}) =>
      incidents.transition(
        id,
        await versioned("phan_anh", "ma_phan_anh", id, {
          trang_thai: state,
          ghi_chu: "Ghi chú nghiệm thu giả lập",
          noi_dung_cong_khai: "Đã cập nhật tiến độ xử lý.",
          ...extra,
        }),
        files,
        actor,
      );
    if (
      ["DA_PHAN_CONG", "DANG_XU_LY", "DA_XU_LY", "DA_DONG"].includes(target)
    ) {
      await incidents.assign(
        id,
        await versioned("phan_anh", "ma_phan_anh", id, {
          ma_ky_thuat_vien: tech.ma_nguoi_dung,
          do_uu_tien: i % 3 ? "TRUNG_BINH" : "KHAN_CAP",
          ghi_chu: "Phân công nghiệm thu",
        }),
        admin,
      );
      if (target !== "DA_PHAN_CONG") await change("DANG_XU_LY", tech);
      if (["DA_XU_LY", "DA_DONG"].includes(target) || i % 8 === 7) {
        await change("DA_XU_LY", tech, [completion]);
        if (target === "DA_DONG") await change("DA_DONG", admin);
        if (i % 8 === 7)
          await change("DANG_XU_LY", admin, [], {
            ghi_chu: "Trả lại, cần ảnh góc khác và kiểm tra bổ sung",
          });
      }
    } else if (target === "TU_CHOI") await change("TU_CHOI", admin);
    else if (target === "TRUNG")
      await change("TRUNG", admin, [], { ma_phan_anh_goc: reportIds[2] });
    const date = shiftDay(
      day,
      -[0, 1, 3, 7, 14, 25, 60, 120, 240, 365][i % 10],
    );
    await rows(
      pool,
      "UPDATE phan_anh SET ngay_tao=?,ngay_dong=IF(trang_thai='DA_DONG',?,NULL) WHERE ma_phan_anh=?",
      [stamp(date), stamp(date, "05"), id],
    );
    await rows(
      pool,
      "UPDATE lich_su_phan_anh SET ngay_tao=TIMESTAMPADD(SECOND,ma_lich_su_phan_anh,?) WHERE ma_phan_anh=?",
      [stamp(date), id],
    );
    manifest.scenarios.push({
      feature: `Phản ánh NT-${String(i + 1).padStart(2, "0")}`,
      id,
      status: target,
      phone: report.so_dien_thoai_nguoi_gui,
      lookup: receipt.ma_tra_cuu,
      url: "/tra-cuu",
    });
  }
  const linked = await qr.detail(locations[0].ma_vi_tri_qr);
  await incidents.assign(
    reportIds[1],
    await versioned("phan_anh", "ma_phan_anh", reportIds[1], {
      ma_ky_thuat_vien: otherTech.ma_nguoi_dung,
      do_uu_tien: "CAO",
      ghi_chu: "Phân công lại để nghiệm thu quyền giữa hai kỹ thuật viên",
    }),
    admin,
  );
  await qr.link(
    linked.ma_vi_tri_qr,
    {
      phien_ban: linked.phien_ban,
      ma_thiet_bi: equipment[2].ma_thiet_bi,
      xac_nhan_doi_lien_ket: true,
    },
    admin,
  );
  await qr.setActive(locations[4].ma_vi_tri_qr, {
    phien_ban: locations[4].phien_ban,
    dang_hoat_dong: false,
  });
  for (const original of locations) {
    const location = await qr.detail(original.ma_vi_tri_qr);
    const url = `${options.origin}/r/${location.token_qr}`,
      file = `qr-${location.ma_vi_tri_qr}.png`;
    await QRCode.toFile(path.join(out, file), url, { width: 420, margin: 3 });
    manifest.qr.push({
      name: location.ten_vi_tri,
      url,
      file,
      active: Boolean(location.dang_hoat_dong),
    });
  }
  for (let i = 0; i < 7; i++) {
    const e = equipment[i],
      j = await maintenance.createJob(
        e.ma_thiet_bi,
        {
          loai: i === 5 ? "DOT_XUAT" : "DINH_KY",
          phien_ban_thiet_bi: e.phien_ban,
          khoa_yeu_cau: randomUUID(),
          ma_ky_thuat_vien: i ? tech.ma_nguoi_dung : null,
          tieu_de: "Kiểm tra đột xuất nghiệm thu",
          noi_dung: "Kiểm tra thiết bị theo tình huống giả lập",
          ngay_den_han: shiftDay(day, 2),
        },
        admin,
      );
    const id = j.ma_phieu_bao_tri;
    const act = (action, user, extra = {}) =>
      versioned("phieu_bao_tri", "ma_phieu_bao_tri", id, extra).then((body) =>
        maintenance.act(id, action, body, user),
      );
    if (i >= 2 && i <= 5) await act("bat_dau", tech);
    if (i >= 3 && i <= 5)
      await act("bao_cao", tech, {
        ngay_thuc_hien: day,
        ket_qua: "Đã vệ sinh, kiểm tra vận hành và chạy thử an toàn (giả lập).",
      });
    if (i === 4)
      await act("nghiem_thu", admin, {
        nhan_xet: "Đạt yêu cầu theo kịch bản nghiệm thu",
      });
    if (i === 5)
      await act("tra_lai", admin, {
        ly_do: "Bổ sung phép đo và thử lại thiết bị",
      });
    if (i === 6)
      await act("huy", admin, {
        ly_do: "Hủy phiếu thử theo kế hoạch nghiệm thu",
      });
  }
  scenario(
    "QR, ảnh, phản ánh và thiết bị",
    "Mở các QR PNG, đăng nhập cư dân xem phản ánh cá nhân; tra cứu bằng mã + SĐT trong manifest. QR thang máy đã đổi sang PCCC sau khi tạo phản ánh.",
    "Phản ánh cũ giữ thiết bị lúc gửi; có đầy đủ trạng thái và lượt bị trả lại. Ảnh có chữ giả lập. QR cuối bị vô hiệu.",
  );
  scenario(
    "Bảo trì",
    "Thiết bị NT-TB-01..08; lọc quá hạn/sắp hạn/chưa lịch/ngừng; mở phiếu theo trạng thái.",
    "Có MOI, DA_PHAN_CONG, DANG_THUC_HIEN, CHO_NGHIEM_THU, HOAN_THANH, HUY và một lượt bị trả lại.",
  );
}

async function seedBookingsAnnouncementsFunds() {
  for (let i = 0; i < 3; i++) {
    const f = await amenities.saveFacility(
      null,
      {
        ten_tien_ich: [
          "NT · Phòng sinh hoạt",
          "NT · Sân thể thao",
          "NT · Hồ bơi tạm ngừng",
        ][i],
        vi_tri: "Khu tiện ích chung cư",
        mo_ta: "Tiện ích giả lập, không thu phí",
        suc_chua: [40, 10, 20][i],
        gio_mo: "06:00",
        gio_dong: "22:00",
        toi_da_phut: 120,
        dat_truoc_ngay: 30,
        dang_mo: i !== 2,
      },
      admin,
    );
    if (i === 2) continue;
    for (let n = 0; n < 4; n++) {
      const facility = await amenities.facilityDetail(f.ma_tien_ich);
      const b = await amenities.createBooking(
        f.ma_tien_ich,
        {
          ngay: shiftDay(day, n + 1),
          gio_bat_dau: "09:00",
          gio_ket_thuc: "10:00",
          so_nguoi: 5,
          ghi_chu: "Lịch nghiệm thu giả lập",
          phien_ban_tien_ich: facility.phien_ban,
          khoa_yeu_cau: randomUUID(),
        },
        residentUser,
      );
      if (n)
        await amenities.act(
          b.ma_dat_lich,
          [null, "duyet", "tu_choi", "huy"][n],
          await versioned("dat_lich_tien_ich", "ma_dat_lich", b.ma_dat_lich, {
            ghi_chu: "Quyết định theo kịch bản nghiệm thu",
          }),
          n === 3 ? residentUser : admin,
        );
    }
  }
  for (let i = 0; i < 5; i++) {
    const n = await announcements.create(
      {
        tieu_de: `NT · ${["Lịch vệ sinh chung cư", "Kiểm tra điện khối A", "Thông báo căn A101", "Bản nháp chưa phát hành", "Thông báo đã thu hồi"][i]}`,
        noi_dung:
          "Dữ liệu nghiệm thu giả lập. Vui lòng theo dõi hướng dẫn của Ban quản lý trên cổng cư dân.",
        pham_vi: ["TOAN_BO", "KHOI", "CAN_HO", "TOAN_BO", "TOAN_BO"][i],
        khoi: "A",
        ma_can_ho: apartments[0].ma_can_ho,
        muc_do: i % 2 ? "QUAN_TRONG" : "THUONG",
      },
      admin,
    );
    if (i !== 3)
      await announcements.change(
        n.ma_thong_bao,
        "phat_hanh",
        await versioned("thong_bao", "ma_thong_bao", n.ma_thong_bao, {}),
        admin,
      );
    if (i === 0) await announcements.markRead(n.ma_thong_bao, residentUser);
    if (i === 4)
      await announcements.change(
        n.ma_thong_bao,
        "thu_hoi",
        await versioned("thong_bao", "ma_thong_bao", n.ma_thong_bao, {
          ly_do: "Thu hồi thông báo giả lập",
        }),
        admin,
      );
  }
  const fund = await treasury.saveFund(
    null,
    {
      ten_quy: "NT · Quỹ bảo trì mẫu",
      mo_ta: "Quỹ giả lập, không đại diện tiền thật",
      dang_hoat_dong: true,
    },
    admin,
  );
  const amounts = ["20000000", "1500000", "700000", "300000", "500000"];
  for (let i = 0; i < amounts.length; i++) {
    const p = await treasury.create(
      {
        ma_quy: fund.ma_quy,
        loai: i === 0 ? "THU" : "CHI",
        nhom: i === 0 ? "BO_SUNG_QUY" : "BAO_TRI",
        ngay_hach_toan: shiftDay(day, -(5 - i)),
        so_tien: amounts[i],
        doi_tac: "Đơn vị giả lập nghiệm thu",
        dien_giai: "Thu chi mẫu để thử ghi sổ, chứng từ và đảo phiếu",
        khoa_yeu_cau: randomUUID(),
      },
      admin,
    );
    if (i)
      await treasury.attach(
        p.ma_phieu,
        await versioned("phieu_thu_chi", "ma_phieu", p.ma_phieu, {}),
        [completion],
        admin,
      );
    if (i === 3) continue;
    await treasury.act(
      p.ma_phieu,
      i === 4 ? "huy" : "duyet",
      await versioned("phieu_thu_chi", "ma_phieu", p.ma_phieu, {
        ly_do: "Hủy phiếu nháp mẫu",
        ghi_chu: "Ghi sổ giả lập",
      }),
      admin,
    );
    if (i === 2)
      await treasury.act(
        p.ma_phieu,
        "dao",
        await versioned("phieu_thu_chi", "ma_phieu", p.ma_phieu, {
          ly_do: "Đảo khoản chi giả lập để kiểm tra số dư",
        }),
        admin,
      );
  }
  await treasury.saveFund(
    null,
    {
      ten_quy: "NT · Quỹ đã tạm khóa",
      mo_ta: "Dùng kiểm tra chặn lập phiếu",
      dang_hoat_dong: false,
    },
    admin,
  );
  scenario(
    "Tiện ích",
    "Phòng sinh hoạt/sân thể thao có lịch từ ngày mai đến 4 ngày tới; hồ bơi tạm ngừng.",
    "Có chờ/duyệt/từ chối/hủy; khung đang giữ chỗ bị chặn trùng. Cư dân không xem chi tiết người khác.",
  );
  scenario(
    "Thông báo",
    "Đăng nhập tài khoản cá nhân xem toàn bộ/khối/căn, đã đọc/chưa đọc; BQL xem bản nháp/thu hồi và nhắc phí.",
    "Phạm vi và biên nhận đọc đúng, nháp/thu hồi không lộ ra cư dân.",
  );
  scenario(
    "Quỹ và thu chi",
    "Mở quỹ vận hành và NT · Quỹ bảo trì mẫu; xem sổ quỹ, chứng từ, phiếu đảo/nháp/hủy.",
    "Quỹ mẫu còn 18.500.000 đồng; khoản chi 700.000 được đảo. Thu hóa đơn chỉ nằm ở quỹ vận hành, không nhân đôi.",
  );
}

async function createImport(kind, format, record, file) {
  let buffer;
  if (format === "xlsx") {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await template(kind, "xlsx", {}));
    const sheet = wb.getWorksheet(1);
    if (sheet.rowCount > 1) sheet.spliceRows(2, sheet.rowCount - 1);
    sheet.addRow(
      catalog[kind].fields.map((field) => String(record[field.key] ?? "")),
    );
    buffer = Buffer.from(await wb.xlsx.writeBuffer());
  } else {
    throw new Error("Chỉ tạo tệp Excel .xlsx.");
  }
  await writeFile(path.join(out, "nhap", file), buffer);
  manifest.files.push({ file: `nhap/${file}`, kind, format });
  return { originalname: file, buffer };
}
async function seedImportsAndAccounts() {
  await mkdir(path.join(out, "nhap"));
  const owner = residents[0];
  const records = {
    can_ho: {
      so_can_ho: "NT-IMP-01",
      khoi: "IMP",
      tang: "1",
      dien_tich_m2: "70",
      tinh_phi_dich_vu: "1",
    },
    cu_dan: {
      ho_va_ten: "NT · Cư dân nhập Excel",
      so_dien_thoai: "0909030001",
      so_can_ho: "NT-IMP-01",
      quan_he: "CHU_HO",
      ngay: day,
    },
    phuong_tien: {
      ma_cu_dan: String(owner.ma_cu_dan),
      so_can_ho: apartments[0].so_can_ho,
      loai_xe: "XE_DAP",
      bien_so: "",
      hang_xe: "Thống Nhất",
      mau_sac: "Đỏ",
      ngay_dang_ky: day,
    },
    chi_so: {
      so_can_ho: "NT-IMP-01",
      loai_dich_vu: "NUOC",
      ky_thanh_toan: month(0),
      chi_so_cu: "0",
      chi_so_moi: "8",
      ngay_chot: day,
      ky_dau: "1",
      ghi_chu: "Chỉ số nhập từ file mẫu",
    },
    thiet_bi: {
      ma_tai_san: "NT-IMP-TB",
      ten_thiet_bi: "NT · Thiết bị nhập file",
      loai: "CAMERA",
      vi_tri: "Sảnh khối IMP",
      trang_thai: "DANG_SU_DUNG",
      nhac_truoc_ngay: "7",
    },
  };
  let number = 0;
  for (const [kind, record] of Object.entries(records)) {
    const file = await createImport(
      kind,
      "xlsx",
      record,
      `da-nhap-${++number}-${kind}.xlsx`,
    );
    const preview = await importFile(kind, file, {}, admin);
    if (preview.errors)
      throw new Error(`File mẫu lỗi: ${JSON.stringify(preview.rows)}`);
    await importFile(
      kind,
      file,
      { xac_nhan: preview.xac_nhan, khoa_yeu_cau: randomUUID() },
      admin,
      true,
    );
  }
  // Các tệp Excel chưa nhập, dành cho thao tác nghiệm thu thủ công.
  for (const format of ["xlsx"])
    for (const [kind, record] of Object.entries(records)) {
      const tag = "X",
        next = { ...record };
      if (["can_ho", "cu_dan", "chi_so"].includes(kind))
        next.so_can_ho = `NT-THU-${tag}`;
      if (kind === "cu_dan") next.so_dien_thoai = "0909030002";
      if (kind === "thiet_bi") next.ma_tai_san = `NT-THU-${tag}-TB`;
      await createImport(kind, format, next, `thu-${kind}.${format}`);
    }
  await createImport(
    "can_ho",
    "xlsx",
    { ...records.can_ho, so_can_ho: "NT-LOI", dien_tich_m2: "-10" },
    "loi-dien-tich.xlsx",
  );
  const aptAccounts = await rows(
    pool,
    "SELECT ma_nguoi_dung,ma_can_ho_thanh_toan FROM nguoi_dung WHERE ma_can_ho_thanh_toan IS NOT NULL ORDER BY ma_can_ho_thanh_toan",
  );
  for (const account of aptAccounts) {
    const current = await accounts.accountForApartment(
      account.ma_can_ho_thanh_toan,
    );
    const credentials = current.dang_hoat_dong
      ? await accounts.manageApartmentAccount(
          account.ma_can_ho_thanh_toan,
          {
            thao_tac: "cap_lai_mat_khau",
            phien_ban_ban_giao: current.phien_ban_ban_giao,
          },
          admin,
        )
      : { ...current, mat_khau_tam_thoi: "(tài khoản đã khóa)" };
    const apt = await one("can_ho", "ma_can_ho", account.ma_can_ho_thanh_toan);
    manifest.accounts.push({
      name: `Tài khoản căn ${apt.so_can_ho}`,
      login: credentials.ten_dang_nhap,
      phone: credentials.dien_thoai_phu_trach,
      password: credentials.mat_khau_tam_thoi,
      role: "CU_DAN",
      kind: "CAN_HO",
      active: Boolean(credentials.dang_hoat_dong),
      apartment: apt.so_can_ho,
    });
    await saveManifest();
  }
  scenario(
    "Nhập/xuất",
    "5 file Excel da-nhap-* đã tạo lịch sử nhập. File thu-* để thử thêm: căn → cư dân → xe → chỉ số → thiết bị. File loi-dien-tich dùng thử preview lỗi.",
    "Preview chưa lưu; lỗi không nhập. Mã cư dân xe đã điền thật; xe đăng ký ngày hôm nay để không sửa kỳ khóa. Chỉ nhận Excel .xlsx.",
  );
  scenario(
    "Tài khoản căn và bàn giao",
    "Mở A101, thử tên CH... hoặc SĐT chủ hộ ghi trong tài khoản. Thêm chủ hộ mới có xác nhận bàn giao rồi thử phiên/SĐT cũ.",
    "Phiên cũ bị ngắt; mật khẩu/SĐT mới theo người phụ trách. Khi bàn giao, thông tin trong file tài khoản cũ không còn áp dụng.",
  );
}

async function verifyAndExport() {
  const { app } = await import("../src/app.js");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let cookie = "";
  const req = async (url, body, auth = cookie) => {
    const response = await fetch(base + url, {
      method: body ? "POST" : "GET",
      headers: {
        "X-App-Request": "1",
        ...(auth ? { Cookie: auth } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });
    return response;
  };
  const check = async (name, promise, status = 200) => {
    const response = await promise;
    if (response.status !== status)
      throw new Error(
        `Nghiệm thu ${name}: HTTP ${response.status}, cần ${status}.`,
      );
    manifest.checks.push({ name, status: "DAT", http: status });
    return response;
  };
  try {
    await check("Database ready", req("/ready"));
    const account = manifest.accounts.find(
      (account) => account.role === "QUAN_TRI_VIEN",
    );
    const login = await check(
      "Đăng nhập BQL",
      req(
        "/xac_thuc/dang_nhap",
        { so_dien_thoai: account.login, mat_khau: account.password },
        "",
      ),
    );
    cookie = login.headers.get("set-cookie").split(";")[0];
    for (const url of [
      "/tong_quan",
      "/can_ho/so_do",
      "/bao_cao/cong_no",
      "/bao_cao/thu_phi",
      "/thiet_bi",
      "/bao_tri",
      "/phuong_tien",
      "/thong_bao",
      "/dat_lich_tien_ich",
      "/quy",
      "/trao_doi_du_lieu/lich_su",
    ])
      await check(url, req(url));
    for (const range of ["NGAY", "TUAN", "THANG", "QUY", "NAM"])
      await check(
        `Biểu đồ ${range}`,
        req(`/tong_quan/thong_ke?khoang=${range}&ngay=${day}`),
      );
    await mkdir(path.join(out, "xuat"));
    for (const kind of [
      "can_ho",
      "cu_dan",
      "phuong_tien",
      "chi_so",
      "thiet_bi",
      "bao_tri",
      "hoa_don",
      "dat_lich",
    ])
      for (const format of ["xlsx"]) {
        const url = `/trao_doi_du_lieu/${kind}/xuat?dinh_dang=${format}`;
        const response = await check(`Xuất ${kind} ${format}`, req(url));
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.subarray(0, 2).toString() !== "PK")
          throw new Error(`Tệp xuất ${kind}.${format} sai định dạng.`);
        await writeFile(path.join(out, "xuat", `${kind}.${format}`), buffer);
      }
    for (const kind of ["cong_no", "thu_phi"])
      for (const format of ["xlsx"]) {
        const response = await check(
          `Báo cáo ${kind} ${format}`,
          req(`/bao_cao/${kind}/xuat?dinh_dang=${format}`),
        );
        await writeFile(
          path.join(out, "xuat", `${kind}.${format}`),
          Buffer.from(await response.arrayBuffer()),
        );
      }
    const funds = await rows(
      pool,
      "SELECT ma_quy FROM quy_tai_chinh WHERE dang_hoat_dong=1 ORDER BY ma_quy",
    );
    for (const fund of funds)
      for (const format of ["xlsx"]) {
        const response = await check(
          `Sổ quỹ ${fund.ma_quy} ${format}`,
          req(`/quy/${fund.ma_quy}/so_quy/xuat?dinh_dang=${format}`),
        );
        await writeFile(
          path.join(out, "xuat", `so-quy-${fund.ma_quy}.${format}`),
          Buffer.from(await response.arrayBuffer()),
        );
      }
    const loginResident = await check(
      "Đăng nhập cư dân",
      req(
        "/xac_thuc/dang_nhap",
        {
          so_dien_thoai: residentUser.so_dien_thoai,
          mat_khau: manifest.accounts.find(
            (a) => a.login === residentUser.so_dien_thoai,
          ).password,
        },
        "",
      ),
    );
    const residentCookie = loginResident.headers
      .get("set-cookie")
      .split(";")[0];
    await check(
      "Cư dân bị chặn API BQL",
      req("/nguoi_dung", null, residentCookie),
      403,
    );
    for (const url of [
      "/cua_toi/hoa_don",
      "/cua_toi/thong_bao",
      "/cua_toi/dat_lich",
      "/phan_anh",
    ])
      await check(`Cư dân ${url}`, req(url, null, residentCookie));
    const payer = manifest.accounts.find((a) => a.apartment === "A101");
    const loginPayer = await check(
      "Đăng nhập tài khoản căn A101",
      req(
        "/xac_thuc/dang_nhap",
        {
          so_dien_thoai: payer.login,
          mat_khau: payer.password,
          loai_tai_khoan: "CAN_HO",
        },
        "",
      ),
    );
    await check(
      "Hóa đơn tài khoản căn",
      req(
        "/cua_toi/hoa_don",
        null,
        loginPayer.headers.get("set-cookie").split(";")[0],
      ),
    );
    await check(
      "Đăng nhập bằng SĐT chủ hộ A101",
      req(
        "/xac_thuc/dang_nhap",
        {
          so_dien_thoai: payer.phone,
          mat_khau: payer.password,
          loai_tai_khoan: "CAN_HO",
        },
        "",
      ),
    );
    const technicianAccount = manifest.accounts.find(
      (a) => a.login === tech.so_dien_thoai,
    );
    const techLogin = await check(
      "Đăng nhập kỹ thuật",
      req(
        "/xac_thuc/dang_nhap",
        {
          so_dien_thoai: technicianAccount.login,
          mat_khau: technicianAccount.password,
        },
        "",
      ),
    );
    const techCookie = techLogin.headers.get("set-cookie").split(";")[0];
    await check(
      "Kỹ thuật xem việc được giao",
      req("/phan_anh", null, techCookie),
    );
    await check(
      "Kỹ thuật xem bảo trì được giao",
      req("/bao_tri", null, techCookie),
    );
    await check(
      "Kỹ thuật bị chặn dữ liệu căn hộ",
      req("/can_ho", null, techCookie),
      403,
    );
    const locked = manifest.accounts.find((a) => a.login === "0909000005");
    await check(
      "Tài khoản đã khóa không đăng nhập",
      req(
        "/xac_thuc/dang_nhap",
        { so_dien_thoai: locked.login, mat_khau: locked.password },
        "",
      ),
      401,
    );
    const history = manifest.scenarios.find((s) => s.lookup);
    await check(
      "Tra cứu công khai",
      req(
        "/cong_khai/phan_anh/tra_cuu",
        { ma_tra_cuu: history.lookup, so_dien_thoai: history.phone },
        "",
      ),
    );
    const tables = await rows(
      pool,
      "SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
    );
    manifest.tables = [];
    for (const { name } of tables) {
      const [count] = await rows(pool, `SELECT COUNT(*) AS n FROM \`${name}\``);
      manifest.tables.push({ table: name, rows: count.n });
      if (!count.n) throw new Error(`Bảng ${name} chưa có dữ liệu mẫu.`);
    }
    const [sum] = await rows(
      pool,
      "SELECT COUNT(*) AS errors FROM hoa_don h WHERE h.tong_tien<>(SELECT COALESCE(SUM(d.thanh_tien),0) FROM chi_tiet_hoa_don d WHERE d.ma_hoa_don=h.ma_hoa_don)",
    );
    if (sum.errors) throw new Error("Tổng hóa đơn không khớp chi tiết.");
    const [sampleFund] = await rows(
      pool,
      "SELECT ma_quy FROM quy_tai_chinh WHERE ten_quy='NT · Quỹ bảo trì mẫu'",
    );
    if ((await treasury.fundDetail(sampleFund.ma_quy)).so_du !== "18500000")
      throw new Error("Số dư quỹ mẫu không khớp 18.500.000 đồng.");
    manifest.checks.push({
      name: "38 bảng có dữ liệu; tổng hóa đơn khớp chi tiết",
      status: "DAT",
    });
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function finish() {
  manifest.trang_thai = "HOAN_TAT";
  await saveManifest();
  const credentials = [
    `# Tài khoản nghiệm thu — ${options.database}`,
    "",
    `Tạo ngày ${day}. Mật khẩu chỉ dùng bộ giả lập này. Không commit/chia sẻ công khai file này.`,
    "",
    "| Tên | Loại | Định danh | Mật khẩu | Hoạt động |",
    "|---|---|---|---|---|",
    ...manifest.accounts.map(
      (a) =>
        `| ${a.name} | ${a.kind} | ${a.login}${a.phone ? ` / ${a.phone}` : ""} | ${a.password} | ${a.active ? "Có" : "Đã khóa"} |`,
    ),
  ];
  await writeFile(
    path.join(out, "TAI-KHOAN.md"),
    credentials.join("\n") + "\n",
    { mode: 0o600 },
  );
  const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><title>QR nghiệm thu</title><style>body{font:16px system-ui;margin:32px;background:#f4f8f7}main{display:flex;flex-wrap:wrap;gap:24px}article{background:white;padding:24px;text-align:center;border:1px solid #cadbd6;border-radius:16px}img{width:240px}p{max-width:300px;overflow-wrap:anywhere}@media print{article{break-inside:avoid}}</style><h1>QR dữ liệu nghiệm thu giả lập</h1><p>Web phải đang chạy trên database ${options.database}. STK thanh toán là giả lập, không chuyển tiền.</p><main>${manifest.qr.map((q) => `<article><h2>${q.name}</h2><img src="${q.file}" alt="QR"><p>${q.active ? "Đang hoạt động" : "Đã vô hiệu hóa để thử lỗi"}</p><a href="${q.url}">${q.url}</a></article>`).join("")}</main></html>`;
  await writeFile(path.join(out, "QR.html"), html);
  const guide = [
    `# Bộ dữ liệu nghiệm thu — ${options.database}`,
    "",
    `Ngày tạo: ${day}. Toàn bộ dữ liệu và mốc lịch sử là giả lập. Có 13 kỳ hóa đơn từ ${month(-12)} đến ${month(0)}.`,
    "",
    "Tài khoản xem TAI-KHOAN.md; mã tra cứu/SĐT xem manifest.json. QR xem QR.html; ảnh thử trong anh/. Không chuyển tiền vào STK mẫu.",
    "",
    "## Các bảng",
    "",
    "| Bảng | Số dòng |",
    "|---|---:|",
    ...manifest.tables.map((t) => `| ${t.table} | ${t.rows} |`),
    "",
    "## Kịch bản",
    "",
    ...manifest.scenarios
      .filter((s) => s.steps)
      .flatMap((s) => [
        `### ${s.feature}`,
        "",
        s.steps,
        "",
        `Mong đợi: ${s.expected}`,
        "",
      ]),
    "## Kiểm tra API/tệp tự động",
    "",
    ...manifest.checks.map((c) => `- ${c.status}: ${c.name}`),
    "",
    "Ảnh hiện trường/camera thật, quét điện thoại, chuyển khoản và thao tác UI thủ công vẫn cần người dùng nghiệm thu. Các file xuat/ là báo cáo sinh từ dữ liệu mẫu; file nhap/thu-* là bộ chưa nhập để thử thêm.",
    "",
  ];
  await writeFile(path.join(out, "README.md"), guide.join("\n"));
  console.log(
    `Hoàn tất. Mở ${path.relative(root, out)}/README.md, TAI-KHOAN.md và QR.html trên máy bạn.`,
  );
  console.log(
    `${manifest.checks.length} kiểm tra đạt; dữ liệu 38 bảng, không sửa DB chung_cu. Không in mật khẩu ra terminal.`,
  );
}

try {
  await freshDatabase();
  for (const [name, work] of [
    ["Nhà ở và tài khoản", seedHousing],
    ["Phí/hóa đơn 13 kỳ", seedBilling],
    ["QR/phản ánh/bảo trì", seedAssetsAndReports],
    ["Tiện ích/thông báo/quỹ", seedBookingsAnnouncementsFunds],
    ["Nhập file và tài khoản căn", seedImportsAndAccounts],
    ["Kiểm tra và xuất báo cáo", verifyAndExport],
  ]) {
    console.log(name);
    await work();
    await saveManifest();
  }
  await finish();
} catch (error) {
  if (manifest.accounts.length) {
    manifest.trang_thai = "CHUA_HOAN_TAT";
    manifest.error = error.status
      ? `${error.code}: ${error.message}`
      : error.code || error.message;
    await saveManifest().catch(() => {});
  }
  console.error(
    error.status
      ? `${error.code}: ${error.message}`
      : error.code || error.message,
  );
  console.error(
    "Bộ tạo dừng; không xóa dữ liệu hay thay mật khẩu đã có. Nếu bộ dở dang, giữ manifest và tạo DB nghiệm thu với mã mới.",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
```

## Kiểm chứng và ca nghiệm thu

- Backend: xem [báo cáo kiểm chứng](sua-4-loi-sau-ra-soat-2026-10-30.md), [kiểm thử quyền riêng tư API/MySQL](../backend/test/incident-privacy.test.js) và [hồi quy quyền, phiên, VAT](../backend/test/review-regressions.test.js).
- Frontend: [kiểm thử API/session](../scripts/api-client.test.js), [kịch bản trình duyệt](../e2e/connection-recovery.spec.js). Thư mục `docs/ra-soat-sau-2026-10-30/proofs/` lưu bằng chứng lỗi của SHA cũ, không dùng làm test nghiệm thu bản mới.
- Để tự nghiệm thu: A gửi phản ánh có ảnh → cấp lại mật khẩu cho A và kiểm tra vẫn xem được → bàn giao căn cho B → B vẫn xem được hóa đơn nhưng danh sách/detail/ảnh của A phải bị chặn → BQL vẫn xem được. Không thử trên tài khoản thật nếu chưa muốn bàn giao/đổi mật khẩu thật; dùng bộ nghiệm thu.
- Trong lúc điền QR có ảnh, khi phiên hết hạn, kiểm tra thông báo đăng nhập lại và nội dung/ảnh vẫn còn tại form. Đăng nhập lại không tự gửi phản ánh. Với sai mật khẩu, phải có lỗi rõ ràng, không vòng lặp chuyển về trang quản trị.
