# Tổng quan vận hành — code đầy đủ 8 file cho VS Code

> Có bản bổ sung [biểu đồ ngày/tuần/tháng/quý/năm — code đầy đủ 5 file](cap-nhat-bieu-do-tong-quan-vscode.md). Áp dụng sau hướng dẫn này. Sau khi thêm biểu đồ, không chép lại Dashboard.jsx hoặc dashboard.routes.js cũ bên dưới đè lên.

Áp dụng sau bản sửa mã cư dân/PDF `f6881f3` trên nhánh `codex/auth-qr-incidents`. Đây là trang **Tổng quan** mới của ban quản lý, tổng hợp công nợ, phản ánh, bảo trì và tiện ích từ dữ liệu hiện có. Chép đủ **8 file** dưới đây vào VS Code; không cần tải ZIP, cài thêm thư viện hoặc chạy migration cho bản cập nhật này.

## Chức năng

- Bốn chỉ số đầu trang: còn phải thu, thu phí trong tháng, phản ánh đang mở và phiếu bảo trì quá hạn.
- Bốn nhóm chi tiết có liên kết đến báo cáo, danh sách đã lọc và từng hồ sơ cần xử lý. Mỗi nhóm hiển thị tối đa 5 mục; số đếm luôn tính trên toàn bộ dữ liệu phù hợp.
- Phản ánh ưu tiên khẩn cấp, sau đó phản ánh gửi sớm. Phiếu bảo trì ưu tiên quá hạn và hạn sớm. Hóa đơn ưu tiên quá hạn, sau đó hạn thanh toán sớm; hóa đơn chưa đặt hạn ở cuối.
- Nút **Cập nhật số liệu**, thời điểm đọc theo giờ Việt Nam, giao diện máy tính/điện thoại, trạng thái không có dữ liệu và thông báo khi tải thất bại.
- Chỉ tài khoản ban quản lý truy cập được. Mở Tổng quan không tự lập phiếu, gửi nhắc phí, duyệt lịch hoặc ghi nhận thanh toán.

## Cách tính để đối chiếu

- **Còn phải thu / nợ quá hạn:** hóa đơn `DA_GUI` ở tất cả kỳ, chưa thanh toán. Không cộng nháp, đã thanh toán hoặc đã hủy. Hạn trước hôm nay mới là quá hạn; đến hạn hôm nay và chưa đặt hạn không tính quá hạn.
- **Thu phí trong tháng:** tổng `so_tien_da_thu` của hóa đơn đã thanh toán, theo ngày xác nhận thu từ đầu tháng tới hết hôm nay ở Việt Nam. Kỳ hóa đơn có thể thuộc tháng cũ. Cách tính trùng báo cáo thu phí; không lấy doanh thu từ sổ quỹ thay thế.
- **Phản ánh đang mở:** Mới, Đã phân công, Đang xử lý, Đã xử lý/chờ nghiệm thu. Loại đã đóng và từ chối. Bộ lọc danh sách mới `DANG_MO` chỉ là bộ lọc tổng hợp, không phải trạng thái để ghi vào hồ sơ.
- **Bảo trì:** phiếu mở gồm Mới, Đã phân công, Đang thực hiện, Chờ nghiệm thu. Không tính phiếu hoàn thành/hủy vào số quá hạn. Thiết bị ngừng sử dụng không tính quá hạn/sắp đến hạn; khoảng nhắc dùng số ngày đã cấu hình cho từng thiết bị.
- **Tiện ích:** số chờ duyệt gồm mọi lượt còn ở trạng thái chờ, kể cả đã qua giờ. Số đã duyệt hôm nay tính theo ngày bắt đầu lượt đặt. Danh sách công việc chỉ hiện lượt chờ duyệt sắp tới và lượt đã duyệt đang diễn ra/sắp tới, bỏ lịch hủy/từ chối và lịch đã kết thúc.

Các số và danh sách được đọc trong cùng một snapshot database, cùng mốc giờ. Tiền tổng hợp trả dạng chuỗi và hiển thị bằng BigInt để không mất chính xác ở số lớn. Nếu cập nhật thất bại, trang báo lỗi để thử lại, không giữ số cũ thành số liệu mới hoặc giả thành 0.

## Cập nhật trên Windows

1. Lưu các sửa đổi cá nhân rồi dừng backend/frontend bằng Ctrl+C. Giữ nguyên `.env`, `.certs`, database, ảnh và chứng từ.
2. Mở thư mục dự án `D:\DO_AN\chung-cu-starter-codex-auth-qr-incidents`. Tạo thư mục cha và các file **Tạo mới** nếu chưa có. Với **Thay toàn bộ**, thay toàn bộ nội dung file, không nối xuống cuối. Chỉ chép nội dung trong khối mã, không chép dấu ba backtick.
3. Thay **đủ 8 file cùng đợt**. `App.jsx` dùng Dashboard mới; `Reports.jsx` bỏ Dashboard cũ và thêm bộ lọc đang mở; repository backend nhận bộ lọc đó. Không lấy các file cũ từ hướng dẫn trước đè lên sau bản này. File `SystemStatus.jsx` sẵn có có thể giữ nguyên.
4. Bản này không thêm SQL, không sửa migration 001–014 và không cần `npm install`, migrate hay seed lại. Tại thư mục gốc, mở terminal thứ nhất:

```powershell
npm run dev:backend
```

Terminal thứ hai dùng lệnh frontend hiện tại, ví dụ nếu đã cấu hình HTTPS:

```powershell
npm run dev:frontend:https
```

Nếu vẫn dùng HTTP LAN, giữ lệnh Vite đang dùng. Chỉ chạy một Vite trên cổng 5173. Restart cả backend để đăng ký API mới, sau đó Ctrl+F5 trình duyệt.

Nếu lấy code bằng Git thay vì chép tay, lưu thay đổi riêng trước khi cập nhật nhánh `codex/auth-qr-incidents`. Không chạy các lệnh reset database để thử trang này.

## Thử chức năng

1. Đăng nhập BQL → **Tổng quan** (`/quan-tri`). Tiêu đề là **Tổng quan vận hành**, có bốn chỉ số và bốn nhóm chi tiết.
2. Đối chiếu Còn phải thu với Công nợ & thu phí, chế độ Hóa đơn. Bấm Thu phí trong tháng để mở đúng báo cáo theo ngày đầu tháng đến hôm nay.
3. Bấm Phản ánh đang mở: bộ lọc hiện **Đang mở (chưa đóng)**, không có hồ sơ đóng/từ chối. Bấm từng trạng thái trong nhóm Phản ánh để lọc riêng.
4. Bấm Phiếu bảo trì quá hạn, Thiết bị quá hạn, Thiết bị sắp đến hạn và Lượt chờ duyệt để kiểm tra các danh sách tương ứng. Bấm mã hồ sơ để xử lý tại màn nghiệp vụ hiện có.
5. Sau khi ghi nhận thu, chuyển trạng thái phản ánh/bảo trì hoặc duyệt lượt đặt, quay lại Tổng quan và bấm **Cập nhật số liệu**. Kiểm tra trên cả máy tính và điện thoại.
6. Với database chưa có dữ liệu nghiệp vụ, các chỉ số hiện 0 và mỗi nhóm có thông báo trống. Khi backend lỗi, phải hiện thông báo lỗi và nút cập nhật để thử lại.

## Danh sách file

1. [backend/src/modules/dashboard/dashboard.service.js](../backend/src/modules/dashboard/dashboard.service.js) — **Tạo mới**.
2. [backend/src/modules/dashboard/dashboard.routes.js](../backend/src/modules/dashboard/dashboard.routes.js) — **Tạo mới**.
3. [backend/src/app.js](../backend/src/app.js) — **Thay toàn bộ**.
4. [backend/src/modules/incidents/incidents.repository.js](../backend/src/modules/incidents/incidents.repository.js) — **Thay toàn bộ**.
5. [frontend/src/features/dashboard/Dashboard.jsx](../frontend/src/features/dashboard/Dashboard.jsx) — **Tạo mới**.
6. [frontend/src/features/dashboard/Dashboard.css](../frontend/src/features/dashboard/Dashboard.css) — **Tạo mới**.
7. [frontend/src/app/App.jsx](../frontend/src/app/App.jsx) — **Thay toàn bộ**.
8. [frontend/src/features/incidents/Reports.jsx](../frontend/src/features/incidents/Reports.jsx) — **Thay toàn bộ**.

## Code đầy đủ

### 1. `backend/src/modules/dashboard/dashboard.service.js`

Tạo mới.

```js
import { pool, rows } from "../../lib/db.js";

const count = (condition) => `CAST(COALESCE(SUM(${condition}),0) AS UNSIGNED)`;
const money = (expression) => `CAST(COALESCE(SUM(${expression}),0) AS CHAR)`;
const incidentOpen = "('MOI','DA_PHAN_CONG','DANG_XU_LY','DA_XU_LY')";
const jobOpen = "('MOI','DA_PHAN_CONG','DANG_THUC_HIEN','CHO_NGHIEM_THU')";

// One read-only snapshot for every counter and work queue. GET never generates work,
// sends reminders, changes bookings or writes a financial record.
export async function overview() {
  const db = await pool.getConnection();
  try {
    await db.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await db.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
    const [clock] = await rows(
      db,
      `SELECT UTC_TIMESTAMP(6) AS tai_luc,
      DATE_FORMAT(DATE_ADD(UTC_TIMESTAMP(),INTERVAL 7 HOUR),'%Y-%m-%d') AS ngay_hien_tai,
      DATE_FORMAT(DATE_ADD(UTC_TIMESTAMP(),INTERVAL 7 HOUR),'%Y-%m-%d %H:%i:%s') AS gio_hien_tai`,
    );
    const day = clock.ngay_hien_tai,
      monthStart = `${day.slice(0, 7)}-01`,
      tomorrow = new Date(new Date(`${day}T00:00:00Z`).getTime() + 86400000)
        .toISOString()
        .slice(0, 10),
      utc = (d) =>
        new Date(`${d}T00:00:00+07:00`)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
    const [finance] = await rows(
      db,
      `SELECT
      ${money("CASE WHEN trang_thai='DA_GUI' THEN tong_tien ELSE 0 END")} AS con_phai_thu,
      ${money("CASE WHEN trang_thai='DA_GUI' AND han_thanh_toan<? THEN tong_tien ELSE 0 END")} AS no_qua_han,
      ${count("trang_thai='DA_GUI'")} AS hoa_don_chua_thu,
      ${count("trang_thai='DA_GUI' AND han_thanh_toan<?")} AS hoa_don_qua_han,
      COUNT(DISTINCT CASE WHEN trang_thai='DA_GUI' THEN ma_can_ho END) AS can_con_no,
      ${money("CASE WHEN trang_thai='DA_THANH_TOAN' AND ngay_thanh_toan>=? AND ngay_thanh_toan<? THEN so_tien_da_thu ELSE 0 END")} AS thu_trong_thang
      FROM hoa_don WHERE trang_thai IN ('DA_GUI','DA_THANH_TOAN')`,
      [day, day, utc(monthStart), utc(tomorrow)],
    );
    finance.hoa_don = await rows(
      db,
      `SELECT h.ma_hoa_don,h.so_hoa_don,h.ky_thanh_toan,h.tong_tien,h.han_thanh_toan,a.so_can_ho,
      (h.han_thanh_toan<?) AS qua_han FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho
      WHERE h.trang_thai='DA_GUI'
      ORDER BY (h.han_thanh_toan<?) DESC,h.han_thanh_toan IS NULL,h.han_thanh_toan,h.ma_hoa_don LIMIT 5`,
      [day, day],
    );
    const [incidents] = await rows(
      db,
      `SELECT
      ${count("trang_thai='MOI'")} AS moi,
      ${count("trang_thai='DA_PHAN_CONG'")} AS da_phan_cong,
      ${count("trang_thai='DANG_XU_LY'")} AS dang_xu_ly,
      ${count("trang_thai='DA_XU_LY'")} AS cho_nghiem_thu,
      COUNT(*) AS dang_mo FROM phan_anh WHERE trang_thai IN ${incidentOpen}`,
    );
    incidents.danh_sach = await rows(
      db,
      `SELECT p.ma_phan_anh,p.tieu_de,p.trang_thai,p.do_uu_tien,p.ngay_tao,v.ten_vi_tri,u.ho_va_ten AS ky_thuat_vien
      FROM phan_anh p JOIN vi_tri_qr v ON v.ma_vi_tri_qr=p.ma_vi_tri_qr LEFT JOIN nguoi_dung u ON u.ma_nguoi_dung=p.ma_ky_thuat_vien
      WHERE p.trang_thai IN ${incidentOpen}
      ORDER BY FIELD(p.do_uu_tien,'KHAN_CAP','CAO','TRUNG_BINH','THAP'),p.ngay_tao,p.ma_phan_anh LIMIT 5`,
    );
    const [maintenance] = await rows(
      db,
      `SELECT
      ${count("ngay_den_han<?")} AS phieu_qua_han,
      ${count("trang_thai='CHO_NGHIEM_THU'")} AS cho_nghiem_thu,
      COUNT(*) AS phieu_dang_mo FROM phieu_bao_tri WHERE trang_thai IN ${jobOpen}`,
      [day],
    );
    const [equipment] = await rows(
      db,
      `SELECT
      ${count("ngay_bao_tri_tiep_theo<?")} AS thiet_bi_qua_han,
      ${count("ngay_bao_tri_tiep_theo>=? AND ngay_bao_tri_tiep_theo<=DATE_ADD(?,INTERVAL nhac_truoc_ngay DAY)")} AS thiet_bi_sap_den_han
      FROM thiet_bi WHERE trang_thai<>'NGUNG_SU_DUNG'`,
      [day, day, day],
    );
    Object.assign(maintenance, equipment);
    maintenance.danh_sach = await rows(
      db,
      `SELECT j.ma_phieu_bao_tri,j.tieu_de,j.ten_thiet_bi_luc_lap,j.trang_thai,j.ngay_den_han,j.do_uu_tien,u.ho_va_ten AS ky_thuat_vien
      FROM phieu_bao_tri j LEFT JOIN nguoi_dung u ON u.ma_nguoi_dung=j.ma_ky_thuat_vien WHERE j.trang_thai IN ${jobOpen}
      ORDER BY (j.ngay_den_han<?) DESC,j.ngay_den_han,(j.trang_thai='CHO_NGHIEM_THU') DESC,j.ma_phieu_bao_tri LIMIT 5`,
      [day],
    );
    const [amenities] = await rows(
      db,
      `SELECT
      ${count("trang_thai='CHO_DUYET'")} AS cho_duyet,
      ${count("trang_thai='DA_DUYET' AND bat_dau>=? AND bat_dau<?")} AS da_duyet_hom_nay
      FROM dat_lich_tien_ich`,
      [`${day} 00:00:00`, `${tomorrow} 00:00:00`],
    );
    amenities.danh_sach = await rows(
      db,
      `SELECT b.ma_dat_lich,b.ten_tien_ich,b.ten_nguoi_dat,b.bat_dau,b.ket_thuc,b.so_nguoi,b.trang_thai,a.so_can_ho
      FROM dat_lich_tien_ich b JOIN can_ho a ON a.ma_can_ho=b.ma_can_ho
      WHERE (b.trang_thai='CHO_DUYET' AND b.bat_dau>?) OR (b.trang_thai='DA_DUYET' AND b.ket_thuc>?)
      ORDER BY b.bat_dau,b.ma_dat_lich LIMIT 5`,
      [clock.gio_hien_tai, clock.gio_hien_tai],
    );
    await db.commit();
    return {
      ...clock,
      tu_ngay_thu: monthStart,
      den_ngay_thu: day,
      tai_chinh: finance,
      phan_anh: incidents,
      bao_tri: maintenance,
      tien_ich: amenities,
    };
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}
```

### 2. `backend/src/modules/dashboard/dashboard.routes.js`

Tạo mới.

```js
import { Router } from "express";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import { overview } from "./dashboard.service.js";
export const dashboardRouter = Router();
dashboardRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
dashboardRouter.get("/", async (req, res) =>
  res.json({ data: await overview() }),
);
```

### 3. `backend/src/app.js`

Thay toàn bộ.

```js
import express from "express";
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
      "SELECT name FROM schema_migrations WHERE name IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
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
      ],
    );
    if (migrations.length !== 14) throw new Error("Schema not initialized");
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

### 4. `backend/src/modules/incidents/incidents.repository.js`

Thay toàn bộ.

```js
import { pool, rows } from "../../lib/db.js";
import { fail } from "../../lib/http.js";
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
    `SELECT p.ma_phan_anh,p.tieu_de,p.loai_su_co,p.do_uu_tien,p.trang_thai,p.ngay_tao,p.phien_ban,v.ten_vi_tri,n.ho_va_ten AS ten_ky_thuat_vien` +
      joins +
      where +
      ` ORDER BY p.ma_phan_anh DESC LIMIT ${size} OFFSET ${(page - 1) * size}`,
    params,
  );
  return { data, meta: { page, total: count.total, page_size: size } };
}
```

### 5. `frontend/src/features/dashboard/Dashboard.jsx`

Tạo mới.

```jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { Badge, ErrorBox, Loading, priorities } from "../../shared/ui.jsx";
import "./Dashboard.css";

const amount = (value) => `${BigInt(value || 0).toLocaleString("vi-VN")} đ`;
const day = (value) =>
  value ? value.slice(0, 10).split("-").reverse().join("/") : "Chưa đặt hạn";
const clock = (value, utc = false) =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value.replace(" ", "T") + (utc ? "Z" : "+07:00")));
const jobs = {
  MOI: "Mới lập",
  DA_PHAN_CONG: "Đã phân công",
  DANG_THUC_HIEN: "Đang thực hiện",
  CHO_NGHIEM_THU: "Chờ nghiệm thu",
};
function useOverview() {
  const [revision, setRevision] = useState(0),
    [state, setState] = useState({ loading: true });
  useEffect(() => {
    const controller = new AbortController();
    setState({ revision, loading: true });
    getJson("/tong_quan", { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted)
          setState({ revision, data: result.data, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ revision, error, loading: false });
      });
    return () => controller.abort();
  }, [revision]);
  return {
    ...(state.revision === revision ? state : { loading: true }),
    reload: () => setRevision((n) => n + 1),
  };
}
function Metric({ title, value, hint, to, money = false, alert = false }) {
  return (
    <Link
      className={`overview-metric${alert ? " overview-alert" : ""}`}
      to={to}
    >
      <span>{title}</span>
      <strong>
        {money ? amount(value) : Number(value).toLocaleString("vi-VN")}
      </strong>
      <small>{hint}</small>
    </Link>
  );
}
function Mini({ title, value, to }) {
  return (
    <Link className="overview-mini" to={to}>
      <span>{title}</span>
      <strong>{Number(value).toLocaleString("vi-VN")}</strong>
    </Link>
  );
}
function Panel({ title, hint, to, label, children }) {
  return (
    <section className="card overview-panel">
      <div className="overview-panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{hint}</p>
        </div>
        <Link to={to}>{label || "Xem tất cả"} →</Link>
      </div>
      {children}
    </section>
  );
}
function Queue({ items, empty, render }) {
  return items.length ? (
    <ul className="overview-queue">{items.map(render)}</ul>
  ) : (
    <p className="overview-empty">{empty}</p>
  );
}
export default function Dashboard() {
  const resource = useOverview(),
    data = resource.data;
  const debt = "/quan-tri/bao-cao-tai-chinh?che_do=HOA_DON",
    overdue = `${debt}&qua_han=1`;
  const receipts = data
    ? `/quan-tri/bao-cao-tai-chinh?bao_cao=THU_PHI&tu_ngay=${data.tu_ngay_thu}&den_ngay=${data.den_ngay_thu}`
    : "";
  return (
    <div className="overview-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">VẬN HÀNH TÒA NHÀ</p>
          <h1>Tổng quan vận hành</h1>
          <p className="muted">
            Theo dõi khoản cần thu và công việc cần xử lý của ban quản lý.
          </p>
        </div>
        <button
          type="button"
          disabled={resource.loading}
          onClick={resource.reload}
        >
          {resource.loading ? "Đang cập nhật…" : "Cập nhật số liệu"}
        </button>
      </div>
      <ErrorBox error={resource.error} />
      {resource.loading && <Loading />}
      {data && (
        <>
          <p className="overview-stamp">
            Dữ liệu lúc <strong>{clock(data.tai_luc, true)}</strong> · Giờ Việt
            Nam · Các nhóm số liệu cùng thời điểm đọc.
          </p>
          <section
            className="overview-metrics"
            aria-label="Chỉ số vận hành chính"
          >
            <Metric
              title="Còn phải thu"
              value={data.tai_chinh.con_phai_thu}
              money
              hint={`${data.tai_chinh.can_con_no} căn · ${data.tai_chinh.hoa_don_chua_thu} hóa đơn đã gửi chưa thu`}
              to={debt}
            />
            <Metric
              title="Thu phí trong tháng"
              value={data.tai_chinh.thu_trong_thang}
              money
              hint={`Ngày xác nhận thu: ${day(data.tu_ngay_thu)} – ${day(data.den_ngay_thu)}`}
              to={receipts}
            />
            <Metric
              title="Phản ánh đang mở"
              value={data.phan_anh.dang_mo}
              hint={`${data.phan_anh.moi} mới · ${data.phan_anh.cho_nghiem_thu} chờ nghiệm thu`}
              to="/quan-tri/phan-anh?trang_thai=DANG_MO"
            />
            <Metric
              title="Phiếu bảo trì quá hạn"
              value={data.bao_tri.phieu_qua_han}
              hint="Phiếu còn mở, hạn trước hôm nay"
              to="/quan-tri/bao-tri?qua_han=1"
              alert={data.bao_tri.phieu_qua_han > 0}
            />
          </section>
          <div className="overview-grid">
            <Panel
              title="Công nợ cần theo dõi"
              hint="Tất cả kỳ hóa đơn đã gửi, ưu tiên hạn thanh toán sớm."
              to={debt}
              label="Báo cáo công nợ"
            >
              <div className="overview-debt">
                <Link to={overdue}>
                  <span>Nợ quá hạn</span>
                  <strong>{amount(data.tai_chinh.no_qua_han)}</strong>
                </Link>
                <p>
                  {data.tai_chinh.hoa_don_qua_han} hóa đơn quá hạn. Hóa đơn đến
                  hạn hôm nay chưa tính quá hạn.
                </p>
              </div>
              <Queue
                items={data.tai_chinh.hoa_don}
                empty="Không có hóa đơn đã gửi còn phải thu."
                render={(r) => (
                  <li key={r.ma_hoa_don}>
                    <div>
                      <Link to={`/quan-tri/hoa-don/${r.ma_hoa_don}`}>
                        {r.so_hoa_don}
                      </Link>
                      <small>
                        Căn {r.so_can_ho} · Kỳ {r.ky_thanh_toan}
                      </small>
                      <small>
                        Hạn trả: {day(r.han_thanh_toan)}{" "}
                        {r.qua_han ? "· Quá hạn" : ""}
                      </small>
                    </div>
                    <strong>{amount(r.tong_tien)}</strong>
                  </li>
                )}
              />
            </Panel>
            <Panel
              title="Phản ánh cần xử lý"
              hint="Ưu tiên khẩn cấp trước, sau đó phản ánh gửi sớm."
              to="/quan-tri/phan-anh"
            >
              <div className="overview-minis">
                {[
                  ["MOI", "Mới", "moi"],
                  ["DA_PHAN_CONG", "Đã phân công", "da_phan_cong"],
                  ["DANG_XU_LY", "Đang xử lý", "dang_xu_ly"],
                  ["DA_XU_LY", "Chờ nghiệm thu", "cho_nghiem_thu"],
                ].map(([state, title, key]) => (
                  <Mini
                    key={state}
                    title={title}
                    value={data.phan_anh[key]}
                    to={`/quan-tri/phan-anh?trang_thai=${state}`}
                  />
                ))}
              </div>
              <Queue
                items={data.phan_anh.danh_sach}
                empty="Không có phản ánh đang mở."
                render={(r) => (
                  <li key={r.ma_phan_anh}>
                    <div>
                      <Link to={`/quan-tri/phan-anh/${r.ma_phan_anh}`}>
                        #{r.ma_phan_anh} · {r.tieu_de}
                      </Link>
                      <small>
                        {r.ten_vi_tri} · {priorities[r.do_uu_tien]}
                      </small>
                      <small>{r.ky_thuat_vien || "Chưa phân công"}</small>
                    </div>
                    <Badge status={r.trang_thai} />
                  </li>
                )}
              />
            </Panel>
            <Panel
              title="Bảo trì thiết bị"
              hint="Theo dõi phiếu công việc và lịch bảo trì của thiết bị."
              to="/quan-tri/bao-tri"
              label="Phiếu bảo trì"
            >
              <div className="overview-minis">
                <Mini
                  title="Thiết bị quá hạn"
                  value={data.bao_tri.thiet_bi_qua_han}
                  to="/quan-tri/thiet-bi?lich=QUA_HAN"
                />
                <Mini
                  title="Thiết bị sắp đến hạn"
                  value={data.bao_tri.thiet_bi_sap_den_han}
                  to="/quan-tri/thiet-bi?lich=SAP_DEN_HAN"
                />
                <Mini
                  title="Chờ nghiệm thu"
                  value={data.bao_tri.cho_nghiem_thu}
                  to="/quan-tri/bao-tri?trang_thai=CHO_NGHIEM_THU"
                />
                <Mini
                  title="Phiếu quá hạn"
                  value={data.bao_tri.phieu_qua_han}
                  to="/quan-tri/bao-tri?qua_han=1"
                />
              </div>
              <Queue
                items={data.bao_tri.danh_sach}
                empty="Không có phiếu bảo trì đang mở."
                render={(r) => (
                  <li key={r.ma_phieu_bao_tri}>
                    <div>
                      <Link to={`/quan-tri/bao-tri/${r.ma_phieu_bao_tri}`}>
                        #{r.ma_phieu_bao_tri} · {r.tieu_de}
                      </Link>
                      <small>
                        {r.ten_thiet_bi_luc_lap} · Hạn {day(r.ngay_den_han)}
                      </small>
                      <small>{r.ky_thuat_vien || "Chưa phân công"}</small>
                    </div>
                    <span className="overview-pill">{jobs[r.trang_thai]}</span>
                  </li>
                )}
              />
            </Panel>
            <Panel
              title="Đặt lịch tiện ích"
              hint="Lượt đang diễn ra và sắp tới; lịch đã hủy/từ chối được bỏ qua."
              to="/quan-tri/dat-lich"
              label="Quản lý lượt đặt"
            >
              <div className="overview-minis">
                <Mini
                  title="Lượt chờ duyệt"
                  value={data.tien_ich.cho_duyet}
                  to="/quan-tri/dat-lich?trang_thai=CHO_DUYET"
                />
                <Mini
                  title="Đã duyệt hôm nay"
                  value={data.tien_ich.da_duyet_hom_nay}
                  to={`/quan-tri/dat-lich?trang_thai=DA_DUYET&ngay=${data.ngay_hien_tai}`}
                />
              </div>
              <p className="overview-note">
                Số chờ duyệt gồm cả lượt đã qua giờ. Mở danh sách để kiểm tra
                trạng thái từng lượt.
              </p>
              <Queue
                items={data.tien_ich.danh_sach}
                empty="Không có lượt đang diễn ra hoặc sắp tới."
                render={(r) => (
                  <li key={r.ma_dat_lich}>
                    <div>
                      <Link to={`/quan-tri/dat-lich/${r.ma_dat_lich}`}>
                        {r.ten_tien_ich}
                      </Link>
                      <small>
                        {clock(r.bat_dau)} – {r.ket_thuc.slice(11, 16)}
                      </small>
                      <small>
                        Căn {r.so_can_ho} · {r.ten_nguoi_dat} · {r.so_nguoi}{" "}
                        người
                      </small>
                    </div>
                    <span className="overview-pill">
                      {r.trang_thai === "DA_DUYET" ? "Đã duyệt" : "Chờ duyệt"}
                    </span>
                  </li>
                )}
              />
            </Panel>
          </div>
          <p className="overview-note">
            Mỗi nhóm hiển thị tối đa 5 mục. Số đếm tính trên toàn bộ dữ liệu; mở
            danh sách để xem đầy đủ. Thu phí dựa trên ngày xác nhận thu, công nợ
            dựa trên hóa đơn đã gửi chưa thu.
          </p>
        </>
      )}
    </div>
  );
}
```

### 6. `frontend/src/features/dashboard/Dashboard.css`

Tạo mới.

```css
.overview-page {
  min-width: 0;
}
.overview-stamp {
  margin: 0 0 20px;
  color: #58786e;
  font-size: 0.9rem;
}
.overview-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.overview-metric {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px;
  background: #fff;
  border: 1px solid #dce7e1;
  border-top: 4px solid #14635a;
  border-radius: 14px;
  text-decoration: none;
  min-width: 0;
}
.overview-metric:hover,
.overview-mini:hover {
  background: #eaf4ef;
}
.overview-metric > span {
  font-weight: 600;
  color: #527369;
}
.overview-metric > strong {
  font-size: clamp(1.4rem, 2vw, 2rem);
  line-height: 1.3;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}
.overview-metric > small {
  color: #647f75;
  margin-top: auto;
}
.overview-alert {
  border-top-color: #b35434;
}
.overview-alert > strong {
  color: #a33e30;
}
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}
.overview-panel {
  margin: 0;
  min-width: 0;
}
.overview-panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}
.overview-panel-heading h2 {
  margin: 0 0 6px;
  font-size: 1.2rem;
}
.overview-panel-heading p {
  color: #647f75;
  margin: 0;
  font-size: 0.9rem;
}
.overview-panel-heading > a {
  flex-shrink: 0;
  font-size: 0.9rem;
  font-weight: 600;
}
.overview-minis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  margin-bottom: 12px;
}
.overview-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  border-radius: 9px;
  background: #f2f6f4;
  text-decoration: none;
}
.overview-mini > span {
  font-size: 0.86rem;
}
.overview-mini > strong {
  font-size: 1.3rem;
  font-variant-numeric: tabular-nums;
}
.overview-debt {
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 10px;
  background: #fff4ec;
}
.overview-debt a {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  color: #a34b2d;
  font-weight: 600;
}
.overview-debt p {
  color: #885c48;
  margin: 8px 0 0;
  font-size: 0.85rem;
}
.overview-queue {
  list-style: none;
  padding: 0;
  margin: 0;
}
.overview-queue > li {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 0;
  border-top: 1px solid #e5ece8;
}
.overview-queue > li > div {
  min-width: 0;
}
.overview-queue a {
  font-weight: 600;
  overflow-wrap: anywhere;
}
.overview-queue small {
  display: block;
  margin-top: 5px;
  color: #647f75;
  font-size: 0.85rem;
}
.overview-queue > li > strong {
  text-align: right;
  font-size: 0.95rem;
  overflow-wrap: anywhere;
  flex: 0 0 auto;
  max-width: 46%;
}
.overview-pill {
  background: #e9f0ec;
  color: #3e6758;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.78rem;
  flex-shrink: 0;
}
.overview-empty {
  padding: 22px 10px;
  color: #6a8278;
  background: #f6f8f6;
  border-radius: 9px;
  text-align: center;
}
.overview-note {
  font-size: 0.85rem;
  color: #647f75;
  line-height: 1.6;
}
@media (max-width: 1200px) {
  .overview-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .overview-metrics {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .overview-metric {
    padding: 18px;
  }
  .overview-metric > strong {
    font-size: 1.7rem;
  }
  .overview-panel-heading {
    flex-direction: column;
    gap: 8px;
  }
  .overview-minis {
    grid-template-columns: 1fr;
  }
  .overview-queue > li {
    flex-wrap: wrap;
    gap: 8px;
  }
  .overview-queue > li > strong {
    max-width: 100%;
    text-align: left;
  }
}
```

### 7. `frontend/src/app/App.jsx`

Thay toàn bộ.

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
import DataExchange from "../features/data-exchange/DataExchange.jsx";
import Dashboard from "../features/dashboard/Dashboard.jsx";
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
import {
  Funds,
  FundDetail,
  Vouchers,
  VoucherNew,
  VoucherDetail,
} from "../features/treasury/Treasury.jsx";
import Users from "../features/auth/Users.jsx";
import ApartmentAccounts from "../features/residency/ApartmentAccounts.jsx";
import {
  Portal,
  Scanner,
  SubmitReport,
  LookupReport,
} from "../features/incidents/PublicReports.jsx";
import { ReportDetail, ReportList } from "../features/incidents/Reports.jsx";
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
          ["/quan-tri/quy", "Thu chi & quỹ"],
          ["/quan-tri/nhap-xuat", "Nhập / xuất Excel, PDF"],
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
              ["/quan-tri/quy", <Funds />],
              ["/quan-tri/quy/:id", <FundDetail />],
              ["/quan-tri/phieu-thu-chi", <Vouchers />],
              ["/quan-tri/phieu-thu-chi/moi", <VoucherNew />],
              ["/quan-tri/phieu-thu-chi/:id", <VoucherDetail />],
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
              ["/quan-tri/nhap-xuat", <DataExchange />],
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

### 8. `frontend/src/features/incidents/Reports.jsx`

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
