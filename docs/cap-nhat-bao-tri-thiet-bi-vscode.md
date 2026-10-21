# Thiết bị và bảo trì — code từng file cho VS Code

> Bản tiếp theo: [Đặt lịch tiện ích cư dân — code đầy đủ 8 file](cap-nhat-dat-lich-tien-ich-vscode.md). Nếu đã cập nhật tiện ích, không dùng app.js/App.jsx/global.css bên dưới đè lên bản mới.

Bản tiếp theo sau `d48909a` (báo cáo công nợ và thu phí). Chép đủ **9 file** bên dưới, không cần tải ZIP hoặc cài thêm thư viện. Nếu chưa có bản công nợ, cập nhật [bản 7 file báo cáo](cap-nhat-bao-cao-cong-no-vscode.md) trước. Giữ nguyên các chức năng đã có; không chép App.jsx/app.js/global.css cũ đè lại sau bản này.

## Cách cập nhật

1. Dừng backend và frontend bằng Ctrl+C. Lưu riêng các thay đổi cá nhân trước khi thay file. Giữ database, ảnh hiện trường, `.env` và `.certs`.
2. Tạo các file mới ở mục 1–5 và 7, thay toàn bộ nội dung các file ở mục 6, 8, 9. Chỉ chép phần mã trong mỗi khối, bỏ dòng mở/đóng khối mã.
3. Mở PowerShell tại thư mục gốc dự án (nơi có package.json), chạy:

```powershell
npm run db:migrate
npm run dev:backend
```

Migration thêm **010_maintenance.sql** và **011_maintenance_plan_checks.sql**. Giữ nguyên 001–009, không xóa volume/database, không chạy seed lại để sửa lỗi. Lệnh migrate không tạo hoặc giao phiếu thật. Nếu lỗi SQL giữa chừng, giữ nguyên thông báo lỗi và kiểm tra các bảng đã tạo trước khi chạy lại.

4. Terminal thứ hai:

```powershell
npm run dev:frontend:https
```

Giữ cấu hình HTTPS/chứng chỉ đang dùng để thử camera điện thoại. Tải lại web sau khi khởi động hai tiến trình.

## BQL sử dụng

- Mở **Thiết bị & bảo trì** → **Thêm thiết bị**. Nhập mã tài sản, tên, loại, vị trí, serial/ngày lắp nếu có, trạng thái và ghi chú. Mã tài sản duy nhất, chuẩn hóa chữ hoa, dùng chữ không dấu/số/gạch ngang/gạch dưới và giữ cố định sau khi tạo.
- Nhập chu kỳ 1–3650 ngày cùng ngày bảo trì kế tiếp; bỏ trống cả hai nếu chưa cấu hình lịch. Nhắc trước 0–90 ngày, mặc định 7. Có tìm mã/tên/vị trí, lọc loại/trạng thái/lịch và phân trang.
- Cảnh báo **Quá hạn** khi ngày kế tiếp trước hôm nay tại Việt Nam. Hạn hôm nay và ngày cuối cửa sổ nhắc trước thuộc **Sắp / đến hạn**. Thiết bị tạm dừng vẫn được theo dõi, ngừng sử dụng thì bỏ lịch.
- Mở thiết bị → **Lập phiếu định kỳ** hoặc **Lập phiếu đột xuất**. Phiếu định kỳ lấy ngày/chu kỳ từ hồ sơ; đột xuất có tiêu đề/nội dung/hạn riêng. Có thể chọn KTV ngay hoặc để Chưa phân công. Nếu chưa có tài khoản KTV, cấp trong **Nhân sự & tài khoản** trước.
- Chỉ có một phiếu định kỳ chưa kết thúc cho mỗi thiết bị. Bấm gửi lại cùng yêu cầu sẽ mở đúng phiếu đã tạo. Phiếu giữ tên/vị trí lúc lập, không mất thông tin cũ khi sửa hồ sơ thiết bị.
- Mở phiếu để giao/đổi KTV; đổi người cần lý do, người cũ mất quyền ngay. Đổi lịch khi chưa bắt đầu cần lý do; định kỳ sẽ cập nhật cả ngày kế tiếp của hồ sơ. Có thể hủy phiếu chưa kết thúc kèm lý do, giữ lịch sử.
- Khi KTV báo cáo, chọn **Nghiệm thu đạt** kèm nhận xét hoặc **Trả lại kỹ thuật viên** kèm lý do. Báo cáo lượt cũ giữ trong lịch sử; trả lại xóa kết quả hiện tại để KTV gửi lượt mới. Phiếu đã hoàn thành không sửa/hủy lại.

## Kỹ thuật viên sử dụng

Đăng nhập tài khoản KTV → **Bảo trì thiết bị**. Chỉ thấy phiếu hiện được giao cho chính tài khoản đó, có lọc loại/trạng thái/quá hạn. Mở phiếu → **Bắt đầu bảo trì** → ghi ngày thực hiện và kết quả từ 10 ký tự → **Gửi báo cáo bảo trì**. Ngày thực hiện phải từ ngày lập phiếu đến hôm nay. KTV không tự nghiệm thu, đổi lịch, đổi người hoặc hủy phiếu.

Nếu BQL trả lại, đọc lý do và lịch sử, thực hiện thêm rồi gửi báo cáo mới. Nếu BQL đổi người, tài khoản cũ không tiếp tục xem/ghi được phiếu đó, kể cả mở liên kết cũ.

## Quy tắc lịch kế tiếp

- Nghiệm thu định kỳ: ngày kế tiếp = **ngày thực hiện đã nghiệm thu + chu kỳ lưu trong phiếu**. Ví dụ thực hiện 20/10/2026, chu kỳ 30 ngày → ngày kế tiếp 19/11/2026. Không lấy ngày bấm nghiệm thu làm ngày thực hiện thay KTV.
- Hệ thống cập nhật ngày; BQL chủ động lập phiếu kỳ sau. Cảnh báo nằm trên màn hình web.
- Phiếu đột xuất không đổi lịch định kỳ. Trả lại/hủy không dời lịch. Nghiệm thu không tự đổi trạng thái vận hành thiết bị.
- Không đổi chu kỳ/ngày/nhắc trước khi còn phiếu định kỳ mở; hoàn thành hoặc hủy phiếu trước. Ngừng sử dụng thiết bị cần xử lý hết mọi phiếu mở, sau đó tự bỏ lịch, không xóa lịch sử.
- Khi hai người thao tác cùng phiên bản, người sau nhận lỗi yêu cầu tải lại. Nếu ghi lịch sử lỗi, cả phiếu và thay đổi ngày kế tiếp được khôi phục.

## 1. `database/migrations/010_maintenance.sql`

Tạo file mới.

```sql
CREATE TABLE thiet_bi (
  ma_thiet_bi INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_tai_san VARCHAR(30) NOT NULL UNIQUE,
  ten_thiet_bi VARCHAR(150) NOT NULL,
  loai ENUM('THANG_MAY','MAY_BOM','PCCC','DIEN','NUOC','CAMERA','KHAC') NOT NULL,
  vi_tri VARCHAR(160) NOT NULL,
  so_serial VARCHAR(100) NOT NULL DEFAULT '',
  ngay_lap_dat DATE NULL,
  ghi_chu VARCHAR(1000) NOT NULL DEFAULT '',
  trang_thai ENUM('DANG_SU_DUNG','TAM_DUNG','NGUNG_SU_DUNG') NOT NULL DEFAULT 'DANG_SU_DUNG',
  chu_ky_ngay SMALLINT UNSIGNED NULL,
  ngay_bao_tri_tiep_theo DATE NULL,
  nhac_truoc_ngay TINYINT UNSIGNED NOT NULL DEFAULT 7,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  ma_nguoi_tao INT UNSIGNED NOT NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  ngay_cap_nhat DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (ma_nguoi_tao) REFERENCES nguoi_dung(ma_nguoi_dung),
  CHECK ((chu_ky_ngay IS NULL AND ngay_bao_tri_tiep_theo IS NULL) OR (chu_ky_ngay BETWEEN 1 AND 3650 AND ngay_bao_tri_tiep_theo IS NOT NULL)),
  CHECK (nhac_truoc_ngay<=90),
  CHECK (trang_thai<>'NGUNG_SU_DUNG' OR chu_ky_ngay IS NULL),
  INDEX idx_equipment_due (trang_thai,ngay_bao_tri_tiep_theo)
) ENGINE=InnoDB;
CREATE TABLE phieu_bao_tri (
  ma_phieu_bao_tri INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_thiet_bi INT UNSIGNED NOT NULL,
  loai ENUM('DINH_KY','DOT_XUAT') NOT NULL,
  tieu_de VARCHAR(180) NOT NULL,
  noi_dung VARCHAR(2000) NOT NULL,
  ten_thiet_bi_luc_lap VARCHAR(150) NOT NULL,
  vi_tri_luc_lap VARCHAR(160) NOT NULL,
  ngay_lap DATE NOT NULL,
  ngay_den_han DATE NOT NULL,
  chu_ky_ngay SMALLINT UNSIGNED NULL,
  do_uu_tien ENUM('THUONG','CAO','KHAN_CAP') NOT NULL DEFAULT 'THUONG',
  trang_thai ENUM('MOI','DA_PHAN_CONG','DANG_THUC_HIEN','CHO_NGHIEM_THU','HOAN_THANH','HUY') NOT NULL DEFAULT 'MOI',
  ma_ky_thuat_vien INT UNSIGNED NULL,
  ma_nguoi_lap INT UNSIGNED NOT NULL,
  ma_nguoi_nghiem_thu INT UNSIGNED NULL,
  ma_nguoi_huy INT UNSIGNED NULL,
  phien_ban INT UNSIGNED NOT NULL DEFAULT 0,
  luot_thuc_hien INT UNSIGNED NOT NULL DEFAULT 1,
  ngay_thuc_hien DATE NULL,
  ket_qua TEXT NOT NULL,
  nhan_xet_nghiem_thu VARCHAR(1000) NOT NULL DEFAULT '',
  ly_do_huy VARCHAR(500) NOT NULL DEFAULT '',
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  ngay_bat_dau DATETIME(6) NULL,
  ngay_bao_cao DATETIME(6) NULL,
  ngay_nghiem_thu DATETIME(6) NULL,
  ngay_huy DATETIME(6) NULL,
  khoa_yeu_cau CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  van_tay CHAR(64) NOT NULL,
  dinh_ky_dang_mo INT UNSIGNED GENERATED ALWAYS AS (CASE WHEN loai='DINH_KY' AND trang_thai NOT IN ('HOAN_THANH','HUY') THEN ma_thiet_bi ELSE NULL END) STORED,
  UNIQUE KEY uq_open_periodic (dinh_ky_dang_mo),
  FOREIGN KEY (ma_thiet_bi) REFERENCES thiet_bi(ma_thiet_bi),
  FOREIGN KEY (ma_ky_thuat_vien) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_nguoi_lap) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_nguoi_nghiem_thu) REFERENCES nguoi_dung(ma_nguoi_dung),
  FOREIGN KEY (ma_nguoi_huy) REFERENCES nguoi_dung(ma_nguoi_dung),
  CHECK ((loai='DINH_KY' AND chu_ky_ngay BETWEEN 1 AND 3650) OR (loai='DOT_XUAT' AND chu_ky_ngay IS NULL)),
  CHECK (trang_thai NOT IN ('DA_PHAN_CONG','DANG_THUC_HIEN','CHO_NGHIEM_THU','HOAN_THANH') OR ma_ky_thuat_vien IS NOT NULL),
  CHECK (trang_thai NOT IN ('CHO_NGHIEM_THU','HOAN_THANH') OR (ngay_thuc_hien IS NOT NULL AND CHAR_LENGTH(ket_qua)>=10)),
  CHECK (ngay_thuc_hien IS NULL OR ngay_thuc_hien>=ngay_lap),
  CHECK (trang_thai<>'HOAN_THANH' OR (ma_nguoi_nghiem_thu IS NOT NULL AND ngay_nghiem_thu IS NOT NULL)),
  CHECK (trang_thai<>'HUY' OR (ma_nguoi_huy IS NOT NULL AND CHAR_LENGTH(ly_do_huy)>=3)),
  INDEX idx_maintenance_equipment (ma_thiet_bi,trang_thai,ma_phieu_bao_tri),
  INDEX idx_maintenance_assigned (ma_ky_thuat_vien,trang_thai,ngay_den_han),
  INDEX idx_maintenance_due (trang_thai,ngay_den_han)
) ENGINE=InnoDB;
CREATE TABLE lich_su_bao_tri (
  ma_lich_su INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_thiet_bi INT UNSIGNED NOT NULL,
  ma_phieu_bao_tri INT UNSIGNED NULL,
  ma_nguoi_thuc_hien INT UNSIGNED NOT NULL,
  su_kien VARCHAR(30) NOT NULL,
  ghi_chu TEXT NOT NULL,
  du_lieu JSON NOT NULL,
  ngay_tao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (ma_thiet_bi) REFERENCES thiet_bi(ma_thiet_bi) ON DELETE CASCADE,
  FOREIGN KEY (ma_phieu_bao_tri) REFERENCES phieu_bao_tri(ma_phieu_bao_tri) ON DELETE CASCADE,
  FOREIGN KEY (ma_nguoi_thuc_hien) REFERENCES nguoi_dung(ma_nguoi_dung),
  INDEX idx_maintenance_history (ma_thiet_bi,ma_phieu_bao_tri,ma_lich_su)
) ENGINE=InnoDB;
```

## 2. `database/migrations/011_maintenance_plan_checks.sql`

Tạo file mới.

```sql
ALTER TABLE thiet_bi
  ADD CONSTRAINT chk_equipment_plan_pair_strict CHECK (
    (chu_ky_ngay IS NULL AND ngay_bao_tri_tiep_theo IS NULL) OR
    (chu_ky_ngay IS NOT NULL AND chu_ky_ngay BETWEEN 1 AND 3650 AND ngay_bao_tri_tiep_theo IS NOT NULL)
  );
ALTER TABLE phieu_bao_tri
  ADD CONSTRAINT chk_maintenance_period_strict CHECK (
    (loai='DINH_KY' AND chu_ky_ngay IS NOT NULL AND chu_ky_ngay BETWEEN 1 AND 3650) OR
    (loai='DOT_XUAT' AND chu_ky_ngay IS NULL)
  );
```

## 3. `backend/src/modules/maintenance/maintenance.validation.js`

Tạo file mới.

```js
import { choice, fail, integer, text } from "../../lib/http.js";
import { day, today } from "../billing/billing.validation.js";
export { today };
export const types = [
  "THANG_MAY",
  "MAY_BOM",
  "PCCC",
  "DIEN",
  "NUOC",
  "CAMERA",
  "KHAC",
];
export const equipmentStates = ["DANG_SU_DUNG", "TAM_DUNG", "NGUNG_SU_DUNG"];
export const jobStates = [
  "MOI",
  "DA_PHAN_CONG",
  "DANG_THUC_HIEN",
  "CHO_NGHIEM_THU",
  "HOAN_THANH",
  "HUY",
];
export const openStates = jobStates.slice(0, 4);
export function positive(value, field) {
  const n = integer(value, field);
  if (n < 1) fail(422, "VALIDATION", "Mã không hợp lệ.");
  return n;
}
export function version(row, value) {
  if (row.phien_ban !== integer(value, "phien_ban"))
    fail(
      409,
      "STALE_VERSION",
      "Dữ liệu bảo trì đã thay đổi. Hãy tải lại trang.",
    );
}
export function addDays(value, days) {
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return day(d.toISOString().slice(0, 10), true);
}
export function requestKey(value) {
  const key = text(value, "khoa_yeu_cau", 36, 36).toLowerCase();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(key)
  )
    fail(
      422,
      "INVALID_REQUEST_KEY",
      "Mã yêu cầu không hợp lệ. Hãy tải lại biểu mẫu.",
    );
  return key;
}
export function equipment(body) {
  const state = choice(body.trang_thai, "trang_thai", equipmentStates);
  let cycle =
    body.chu_ky_ngay === null ||
    body.chu_ky_ngay === "" ||
    body.chu_ky_ngay === undefined
      ? null
      : positive(body.chu_ky_ngay, "chu_ky_ngay");
  let due = body.ngay_bao_tri_tiep_theo
    ? day(body.ngay_bao_tri_tiep_theo, true)
    : null;
  if (cycle > 3650 || Boolean(cycle) !== Boolean(due))
    fail(
      422,
      "INVALID_PLAN",
      "Nhập đủ chu kỳ 1–3650 ngày và ngày bảo trì kế tiếp, hoặc bỏ trống cả hai.",
    );
  const notice = integer(body.nhac_truoc_ngay ?? 7, "nhac_truoc_ngay");
  if (notice > 90)
    fail(422, "INVALID_PLAN", "Số ngày nhắc trước cần từ 0 đến 90.");
  if (state === "NGUNG_SU_DUNG") {
    cycle = null;
    due = null;
  }
  return {
    ten_thiet_bi: text(body.ten_thiet_bi, "ten_thiet_bi", 2, 150),
    loai: choice(body.loai, "loai", types),
    vi_tri: text(body.vi_tri, "vi_tri", 2, 160),
    so_serial: text(body.so_serial || "", "so_serial", 0, 100),
    ngay_lap_dat: body.ngay_lap_dat ? day(body.ngay_lap_dat) : null,
    ghi_chu: text(body.ghi_chu || "", "ghi_chu", 0, 1000),
    trang_thai: state,
    chu_ky_ngay: cycle,
    ngay_bao_tri_tiep_theo: due,
    nhac_truoc_ngay: notice,
  };
}
export function assetCode(value) {
  const code = text(value, "ma_tai_san", 2, 30).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{1,29}$/.test(code))
    fail(
      422,
      "INVALID_ASSET_CODE",
      "Mã tài sản dùng chữ không dấu, số, gạch ngang hoặc gạch dưới.",
    );
  return code;
}

// MySQL CHAR_LENGTH counts Unicode code points, not UTF-16 code units.
export function recordText(value, field, min, max) {
  const result = text(value, field, min, max);
  if (Array.from(result).length < min)
    fail(422, "VALIDATION", "Nội dung chưa đủ ký tự.", {
      [field]: `Cần ít nhất ${min} ký tự.`,
    });
  return result;
}
```

## 4. `backend/src/modules/maintenance/maintenance.service.js`

Tạo file mới.

```js
import { createHash } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, text, integer } from "../../lib/http.js";
import { day, pagination } from "../billing/billing.validation.js";
import * as v from "./maintenance.validation.js";
const admin = (user) => user.vai_tro === "QUAN_TRI_VIEN";
const notFound = () =>
  fail(
    404,
    "NOT_FOUND",
    "Không tìm thấy dữ liệu bảo trì hoặc bạn không còn quyền xem.",
  );
const openSql = "('MOI','DA_PHAN_CONG','DANG_THUC_HIEN','CHO_NGHIEM_THU')";
async function actor(db, user) {
  const [u] = await rows(
    db,
    "SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_nguoi_dung=? AND dang_hoat_dong=1 AND vai_tro=? AND phien_ban_token=? FOR SHARE",
    [user.ma_nguoi_dung, user.vai_tro, user.phien_ban_token],
  );
  if (!u)
    fail(401, "SESSION_EXPIRED", "Phiên đã hết hạn. Vui lòng đăng nhập lại.");
}
async function staff(db, id) {
  const [u] = await rows(
    db,
    "SELECT ma_nguoi_dung,ho_va_ten FROM nguoi_dung WHERE ma_nguoi_dung=? AND vai_tro='KY_THUAT_VIEN' AND dang_hoat_dong=1 FOR SHARE",
    [id],
  );
  if (!u) fail(422, "INVALID_TECHNICIAN", "Chọn kỹ thuật viên đang hoạt động.");
  return u;
}
async function lockEquipment(db, id) {
  const [e] = await rows(
    db,
    "SELECT * FROM thiet_bi WHERE ma_thiet_bi=? FOR UPDATE",
    [id],
  );
  if (!e) notFound();
  return e;
}
async function audit(db, e, j, user, event, note, data) {
  await rows(
    db,
    "INSERT INTO lich_su_bao_tri (ma_thiet_bi,ma_phieu_bao_tri,ma_nguoi_thuc_hien,su_kien,ghi_chu,du_lieu) VALUES (?,?,?,?,?,?)",
    [e, j, user.ma_nguoi_dung, event, note, JSON.stringify(data)],
  );
}
const history = (db, e, j) =>
  rows(
    db,
    `SELECT l.ma_lich_su,l.su_kien,l.ghi_chu,l.ngay_tao,u.ho_va_ten FROM lich_su_bao_tri l JOIN nguoi_dung u ON u.ma_nguoi_dung=l.ma_nguoi_thuc_hien WHERE l.ma_thiet_bi=? AND ${j ? "l.ma_phieu_bao_tri=?" : "l.ma_phieu_bao_tri IS NULL"} ORDER BY l.ma_lich_su`,
    j ? [e, j] : [e],
  );
function dueState(e, today) {
  if (e.trang_thai === "NGUNG_SU_DUNG") return "NGUNG_THEO_DOI";
  if (!e.ngay_bao_tri_tiep_theo) return "CHUA_CAU_HINH";
  if (e.ngay_bao_tri_tiep_theo < today) return "QUA_HAN";
  return e.ngay_bao_tri_tiep_theo <= v.addDays(today, e.nhac_truoc_ngay)
    ? "SAP_DEN_HAN"
    : "CHUA_DEN_HAN";
}
const equipmentSelect = `SELECT e.*,(SELECT j.ma_phieu_bao_tri FROM phieu_bao_tri j WHERE j.dinh_ky_dang_mo=e.ma_thiet_bi) AS phieu_dinh_ky_dang_mo FROM thiet_bi e`;
export async function equipmentList(query) {
  const { page, offset } = pagination(query),
    today = v.today(),
    where = ["1=1"],
    values = [];
  if (query.q) {
    const q = `%${text(query.q, "q", 1, 100)}%`;
    where.push(
      "(e.ma_tai_san LIKE ? OR e.ten_thiet_bi LIKE ? OR e.vi_tri LIKE ?)",
    );
    values.push(q, q, q);
  }
  if (query.loai) {
    where.push("e.loai=?");
    values.push(choice(query.loai, "loai", v.types));
  }
  if (query.trang_thai) {
    where.push("e.trang_thai=?");
    values.push(choice(query.trang_thai, "trang_thai", v.equipmentStates));
  }
  if (query.lich) {
    const filter = choice(query.lich, "lich", [
      "QUA_HAN",
      "SAP_DEN_HAN",
      "CHUA_CAU_HINH",
    ]);
    where.push("e.trang_thai<>'NGUNG_SU_DUNG'");
    if (filter === "CHUA_CAU_HINH") where.push("e.chu_ky_ngay IS NULL");
    else if (filter === "QUA_HAN") {
      where.push("e.ngay_bao_tri_tiep_theo<?");
      values.push(today);
    } else {
      where.push(
        "e.ngay_bao_tri_tiep_theo>=? AND e.ngay_bao_tri_tiep_theo<=DATE_ADD(?,INTERVAL e.nhac_truoc_ngay DAY)",
      );
      values.push(today, today);
    }
  }
  const condition = where.join(" AND ");
  const [summary] = await rows(
    pool,
    `SELECT COUNT(*) AS total,CAST(COALESCE(SUM(e.trang_thai<>'NGUNG_SU_DUNG' AND e.ngay_bao_tri_tiep_theo<?),0) AS UNSIGNED) AS qua_han,CAST(COALESCE(SUM(e.trang_thai<>'NGUNG_SU_DUNG' AND e.ngay_bao_tri_tiep_theo>=? AND e.ngay_bao_tri_tiep_theo<=DATE_ADD(?,INTERVAL e.nhac_truoc_ngay DAY)),0) AS UNSIGNED) AS sap_den_han FROM thiet_bi e WHERE ${condition}`,
    [today, today, today, ...values],
  );
  const data = await rows(
    pool,
    `${equipmentSelect} WHERE ${condition} ORDER BY e.ngay_bao_tri_tiep_theo IS NULL,e.ngay_bao_tri_tiep_theo,e.ma_thiet_bi LIMIT 20 OFFSET ${offset}`,
    values,
  );
  return {
    data: data.map((e) => ({ ...e, tinh_trang_lich: dueState(e, today) })),
    summary,
    total: summary.total,
    page,
    ngay_hien_tai: today,
  };
}
export async function equipmentDetail(id) {
  const [e] = await rows(pool, `${equipmentSelect} WHERE e.ma_thiet_bi=?`, [
    id,
  ]);
  if (!e) notFound();
  return {
    ...e,
    tinh_trang_lich: dueState(e, v.today()),
    history: await history(pool, id, null),
  };
}
export async function createEquipment(body, user) {
  const code = v.assetCode(body.ma_tai_san),
    fields = v.equipment(body);
  return transaction(async (db) => {
    await actor(db, user);
    const keys = Object.keys(fields);
    const result = await rows(
      db,
      `INSERT INTO thiet_bi (ma_tai_san,${keys.join(",")},ma_nguoi_tao) VALUES (${Array(
        keys.length + 2,
      )
        .fill("?")
        .join(",")})`,
      [code, ...Object.values(fields), user.ma_nguoi_dung],
    );
    await audit(
      db,
      result.insertId,
      null,
      user,
      "TAO_THIET_BI",
      "Tạo thiết bị và cấu hình lịch bảo trì.",
      { ma_tai_san: code, ...fields },
    );
    return { ma_thiet_bi: result.insertId };
  });
}
export async function updateEquipment(id, body, user) {
  const fields = v.equipment(body);
  return transaction(async (db) => {
    const old = await lockEquipment(db, id);
    await actor(db, user);
    v.version(old, body.phien_ban);
    if (body.ma_tai_san && v.assetCode(body.ma_tai_san) !== old.ma_tai_san)
      fail(422, "IMMUTABLE_ASSET_CODE", "Mã tài sản được giữ cố định.");
    const planChanged = [
      "chu_ky_ngay",
      "ngay_bao_tri_tiep_theo",
      "nhac_truoc_ngay",
    ].some((k) => fields[k] !== old[k]);
    if (planChanged) {
      const existing = await rows(
        db,
        "SELECT ma_phieu_bao_tri FROM phieu_bao_tri WHERE dinh_ky_dang_mo=? FOR UPDATE",
        [id],
      );
      if (existing.length)
        fail(
          409,
          "OPEN_PERIODIC_JOB",
          "Hoàn thành hoặc hủy phiếu định kỳ đang mở trước khi đổi lịch.",
        );
    }
    if (fields.trang_thai === "NGUNG_SU_DUNG") {
      const active = await rows(
        db,
        `SELECT ma_phieu_bao_tri FROM phieu_bao_tri WHERE ma_thiet_bi=? AND trang_thai IN ${openSql} LIMIT 1 FOR UPDATE`,
        [id],
      );
      if (active.length)
        fail(
          409,
          "OPEN_MAINTENANCE_JOB",
          "Thiết bị còn phiếu chưa kết thúc. Hãy nghiệm thu hoặc hủy phiếu trước.",
        );
    }
    await rows(
      db,
      `UPDATE thiet_bi SET ${Object.keys(fields)
        .map((k) => `${k}=?`)
        .join(
          ",",
        )},phien_ban=phien_ban+1,ngay_cap_nhat=UTC_TIMESTAMP(6) WHERE ma_thiet_bi=?`,
      [...Object.values(fields), id],
    );
    await audit(
      db,
      id,
      null,
      user,
      "SUA_THIET_BI",
      "Cập nhật thông tin thiết bị/lịch bảo trì.",
      { truoc: old, sau: fields },
    );
    return { ma_thiet_bi: id };
  });
}
export async function technicians(query) {
  const { page, offset } = pagination(query),
    q = query.q ? `%${text(query.q, "q", 1, 100)}%` : "%";
  const [count] = await rows(
    pool,
    "SELECT COUNT(*) AS total FROM nguoi_dung WHERE vai_tro='KY_THUAT_VIEN' AND dang_hoat_dong=1 AND ho_va_ten LIKE ?",
    [q],
  );
  return {
    data: await rows(
      pool,
      `SELECT ma_nguoi_dung,ho_va_ten,chuyen_mon FROM nguoi_dung WHERE vai_tro='KY_THUAT_VIEN' AND dang_hoat_dong=1 AND ho_va_ten LIKE ? ORDER BY ma_nguoi_dung LIMIT 20 OFFSET ${offset}`,
      [q],
    ),
    total: count.total,
    page,
  };
}
export async function createJob(equipmentId, body, user) {
  const type = choice(body.loai, "loai", ["DINH_KY", "DOT_XUAT"]),
    key = v.requestKey(body.khoa_yeu_cau);
  const data = {
    loai: type,
    ma_ky_thuat_vien: body.ma_ky_thuat_vien
      ? v.positive(body.ma_ky_thuat_vien, "ma_ky_thuat_vien")
      : null,
    do_uu_tien: choice(body.do_uu_tien || "THUONG", "do_uu_tien", [
      "THUONG",
      "CAO",
      "KHAN_CAP",
    ]),
  };
  if (type === "DOT_XUAT")
    Object.assign(data, {
      tieu_de: text(body.tieu_de, "tieu_de", 3, 180),
      noi_dung: text(body.noi_dung, "noi_dung", 3, 2000),
      ngay_den_han: day(body.ngay_den_han, true),
    });
  else
    data.phien_ban_thiet_bi = integer(
      body.phien_ban_thiet_bi,
      "phien_ban_thiet_bi",
    );
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ equipmentId, user: user.ma_nguoi_dung, ...data }))
    .digest("hex");
  return transaction(async (db) => {
    const e = await lockEquipment(db, equipmentId);
    await actor(db, user);
    const [old] = await rows(
      db,
      "SELECT ma_phieu_bao_tri,van_tay FROM phieu_bao_tri WHERE khoa_yeu_cau=? FOR UPDATE",
      [key],
    );
    if (old) {
      if (old.van_tay !== fingerprint)
        fail(
          409,
          "REQUEST_KEY_REUSED",
          "Mã yêu cầu đã dùng cho phiếu khác. Hãy mở lại biểu mẫu.",
        );
      return { ma_phieu_bao_tri: old.ma_phieu_bao_tri, replay: true };
    }
    if (e.trang_thai === "NGUNG_SU_DUNG")
      fail(409, "EQUIPMENT_RETIRED", "Thiết bị đã ngừng sử dụng.");
    if (type === "DINH_KY") {
      v.version(e, data.phien_ban_thiet_bi);
      if (!e.chu_ky_ngay)
        fail(
          409,
          "NO_PLAN",
          "Cấu hình chu kỳ và ngày bảo trì trước khi lập phiếu định kỳ.",
        );
      const active = await rows(
        db,
        "SELECT ma_phieu_bao_tri FROM phieu_bao_tri WHERE dinh_ky_dang_mo=? FOR UPDATE",
        [equipmentId],
      );
      if (active.length)
        fail(
          409,
          "OPEN_PERIODIC_JOB",
          "Đã có phiếu định kỳ đang mở cho thiết bị này.",
        );
      Object.assign(data, {
        tieu_de: `Bảo trì định kỳ: ${e.ten_thiet_bi}`,
        noi_dung:
          "Thực hiện bảo trì định kỳ theo hướng dẫn kỹ thuật của thiết bị và ghi rõ kết quả.",
        ngay_den_han: e.ngay_bao_tri_tiep_theo,
      });
    }
    const assignee = data.ma_ky_thuat_vien
      ? await staff(db, data.ma_ky_thuat_vien)
      : null;
    const result = await rows(
      db,
      "INSERT INTO phieu_bao_tri (ma_thiet_bi,loai,tieu_de,noi_dung,ten_thiet_bi_luc_lap,vi_tri_luc_lap,ngay_lap,ngay_den_han,chu_ky_ngay,do_uu_tien,trang_thai,ma_ky_thuat_vien,ma_nguoi_lap,ket_qua,khoa_yeu_cau,van_tay) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'',?,?)",
      [
        equipmentId,
        type,
        data.tieu_de,
        data.noi_dung,
        e.ten_thiet_bi,
        e.vi_tri,
        v.today(),
        data.ngay_den_han,
        type === "DINH_KY" ? e.chu_ky_ngay : null,
        data.do_uu_tien,
        assignee ? "DA_PHAN_CONG" : "MOI",
        data.ma_ky_thuat_vien,
        user.ma_nguoi_dung,
        key,
        fingerprint,
      ],
    );
    await audit(
      db,
      equipmentId,
      result.insertId,
      user,
      "LAP_PHIEU",
      `Lập phiếu bảo trì${assignee ? ` và giao ${assignee.ho_va_ten}` : " chưa phân công"}.`,
      { ...data, chu_ky_ngay: type === "DINH_KY" ? e.chu_ky_ngay : null },
    );
    return { ma_phieu_bao_tri: result.insertId, replay: false };
  });
}
const jobFrom =
  "FROM phieu_bao_tri j JOIN thiet_bi e ON e.ma_thiet_bi=j.ma_thiet_bi LEFT JOIN nguoi_dung u ON u.ma_nguoi_dung=j.ma_ky_thuat_vien";
const jobFields =
  "j.ma_phieu_bao_tri,j.ma_thiet_bi,j.loai,j.tieu_de,j.ngay_den_han,j.trang_thai,j.ma_ky_thuat_vien,j.phien_ban,j.do_uu_tien,j.ten_thiet_bi_luc_lap,j.vi_tri_luc_lap,e.ma_tai_san,u.ho_va_ten AS ky_thuat_vien";
function scope(user, where, values) {
  if (!admin(user)) {
    where.push(
      "j.ma_ky_thuat_vien=? AND EXISTS (SELECT 1 FROM nguoi_dung actor WHERE actor.ma_nguoi_dung=? AND actor.dang_hoat_dong=1 AND actor.phien_ban_token=?)",
    );
    values.push(user.ma_nguoi_dung, user.ma_nguoi_dung, user.phien_ban_token);
  }
}
export async function jobs(query, user) {
  const { page, offset } = pagination(query),
    where = ["1=1"],
    values = [],
    today = v.today();
  scope(user, where, values);
  if (query.ma_thiet_bi) {
    where.push("j.ma_thiet_bi=?");
    values.push(v.positive(query.ma_thiet_bi, "ma_thiet_bi"));
  }
  if (query.trang_thai) {
    where.push("j.trang_thai=?");
    values.push(choice(query.trang_thai, "trang_thai", v.jobStates));
  }
  if (query.loai) {
    where.push("j.loai=?");
    values.push(choice(query.loai, "loai", ["DINH_KY", "DOT_XUAT"]));
  }
  if (query.q) {
    const q = `%${text(query.q, "q", 1, 100)}%`;
    where.push(
      "(j.tieu_de LIKE ? OR e.ma_tai_san LIKE ? OR e.ten_thiet_bi LIKE ?)",
    );
    values.push(q, q, q);
  }
  if (query.qua_han) {
    choice(query.qua_han, "qua_han", ["0", "1"]);
    if (query.qua_han === "1") {
      where.push(`j.trang_thai IN ${openSql} AND j.ngay_den_han<?`);
      values.push(today);
    }
  }
  const condition = where.join(" AND ");
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total ${jobFrom} WHERE ${condition}`,
    values,
  );
  const data = await rows(
    pool,
    `SELECT ${jobFields},(j.trang_thai IN ${openSql} AND j.ngay_den_han<?) AS qua_han ${jobFrom} WHERE ${condition} ORDER BY (j.trang_thai IN ${openSql}) DESC,j.ngay_den_han,j.ma_phieu_bao_tri DESC LIMIT 20 OFFSET ${offset}`,
    [today, ...values],
  );
  return { data, total: count.total, page, ngay_hien_tai: today };
}
export async function jobDetail(id, user) {
  const where = ["j.ma_phieu_bao_tri=?"],
    values = [id];
  scope(user, where, values);
  const [j] = await rows(
    pool,
    `SELECT ${jobFields},j.noi_dung,j.ngay_lap,j.chu_ky_ngay,j.luot_thuc_hien,j.ngay_thuc_hien,j.ket_qua,j.nhan_xet_nghiem_thu,j.ly_do_huy,j.ngay_tao,j.ngay_bat_dau,j.ngay_bao_cao,j.ngay_nghiem_thu,e.ten_thiet_bi AS ten_hien_tai,e.vi_tri AS vi_tri_hien_tai,e.trang_thai AS trang_thai_thiet_bi ${jobFrom} WHERE ${where.join(" AND ")}`,
    values,
  );
  if (!j) notFound();
  return {
    ...j,
    qua_han: v.openStates.includes(j.trang_thai) && j.ngay_den_han < v.today(),
    history: await history(pool, j.ma_thiet_bi, id),
  };
}
export async function act(id, action, body, user) {
  return transaction(async (db) => {
    const [hint] = await rows(
      db,
      "SELECT ma_thiet_bi FROM phieu_bao_tri WHERE ma_phieu_bao_tri=?",
      [id],
    );
    if (!hint) notFound();
    const e = await lockEquipment(db, hint.ma_thiet_bi),
      [j] = await rows(
        db,
        "SELECT * FROM phieu_bao_tri WHERE ma_phieu_bao_tri=? FOR UPDATE",
        [id],
      );
    await actor(db, user);
    if (!admin(user) && j.ma_ky_thuat_vien !== user.ma_nguoi_dung) notFound();
    if (!admin(user) && !["bat_dau", "bao_cao"].includes(action))
      fail(403, "FORBIDDEN", "Chỉ BQL được thực hiện thao tác này.");
    if (admin(user) && ["bat_dau", "bao_cao"].includes(action))
      fail(
        403,
        "FORBIDDEN",
        "Kỹ thuật viên được giao phiếu thực hiện và ghi kết quả.",
      );
    v.version(j, body.phien_ban);
    const requireState = (allowed) => {
      if (!allowed.includes(j.trang_thai))
        fail(
          409,
          "INVALID_STATE",
          "Phiếu không ở trạng thái cho phép thực hiện thao tác này.",
        );
    };
    let fields = {},
      note = "";
    if (action === "phan_cong") {
      requireState(["MOI", "DA_PHAN_CONG", "DANG_THUC_HIEN"]);
      const target = await staff(
        db,
        v.positive(body.ma_ky_thuat_vien, "ma_ky_thuat_vien"),
      );
      if (target.ma_nguoi_dung === j.ma_ky_thuat_vien)
        fail(
          409,
          "SAME_TECHNICIAN",
          "Phiếu đã được giao cho kỹ thuật viên này.",
        );
      const reason = text(
        body.ghi_chu || "",
        "ghi_chu",
        j.ma_ky_thuat_vien ? 3 : 0,
        500,
      );
      fields = {
        ma_ky_thuat_vien: target.ma_nguoi_dung,
        trang_thai: "DA_PHAN_CONG",
        ngay_bat_dau: null,
      };
      note = `Giao phiếu cho ${target.ho_va_ten}.${reason ? ` ${reason}` : ""}`;
    } else if (action === "doi_lich") {
      requireState(["MOI", "DA_PHAN_CONG"]);
      const due = day(body.ngay_den_han, true);
      note = text(body.ly_do, "ly_do", 3, 500);
      fields = { ngay_den_han: due };
      if (j.loai === "DINH_KY")
        await rows(
          db,
          "UPDATE thiet_bi SET ngay_bao_tri_tiep_theo=?,phien_ban=phien_ban+1,ngay_cap_nhat=UTC_TIMESTAMP(6) WHERE ma_thiet_bi=?",
          [due, e.ma_thiet_bi],
        );
      note = `Đổi hạn từ ${j.ngay_den_han} sang ${due}. ${note}`;
    } else if (action === "bat_dau") {
      requireState(["DA_PHAN_CONG"]);
      fields = { trang_thai: "DANG_THUC_HIEN" };
      await rows(
        db,
        "UPDATE phieu_bao_tri SET ngay_bat_dau=UTC_TIMESTAMP(6) WHERE ma_phieu_bao_tri=?",
        [id],
      );
      note = "Kỹ thuật viên bắt đầu thực hiện.";
    } else if (action === "bao_cao") {
      requireState(["DANG_THUC_HIEN"]);
      const date = day(body.ngay_thuc_hien);
      if (date < j.ngay_lap)
        fail(
          422,
          "INVALID_WORK_DATE",
          "Ngày thực hiện không được trước ngày lập phiếu.",
        );
      fields = {
        trang_thai: "CHO_NGHIEM_THU",
        ngay_thuc_hien: date,
        ket_qua: v.recordText(body.ket_qua, "ket_qua", 10, 4000),
      };
      await rows(
        db,
        "UPDATE phieu_bao_tri SET ngay_bao_cao=UTC_TIMESTAMP(6) WHERE ma_phieu_bao_tri=?",
        [id],
      );
      note = `Báo cáo lượt ${j.luot_thuc_hien}, thực hiện ngày ${date}:\n${fields.ket_qua}`;
    } else if (action === "tra_lai") {
      requireState(["CHO_NGHIEM_THU"]);
      note = text(body.ly_do, "ly_do", 3, 1000);
      fields = {
        trang_thai: "DANG_THUC_HIEN",
        ket_qua: "",
        ngay_thuc_hien: null,
        luot_thuc_hien: j.luot_thuc_hien + 1,
      };
      note = `Trả lại thực hiện: ${note}`;
    } else if (action === "nghiem_thu") {
      requireState(["CHO_NGHIEM_THU"]);
      fields = {
        trang_thai: "HOAN_THANH",
        ma_nguoi_nghiem_thu: user.ma_nguoi_dung,
        nhan_xet_nghiem_thu: text(body.nhan_xet, "nhan_xet", 3, 1000),
      };
      await rows(
        db,
        "UPDATE phieu_bao_tri SET ngay_nghiem_thu=UTC_TIMESTAMP(6) WHERE ma_phieu_bao_tri=?",
        [id],
      );
      note = `Nghiệm thu đạt. ${fields.nhan_xet_nghiem_thu}`;
      if (j.loai === "DINH_KY") {
        const next = v.addDays(j.ngay_thuc_hien, j.chu_ky_ngay);
        await rows(
          db,
          "UPDATE thiet_bi SET ngay_bao_tri_tiep_theo=?,phien_ban=phien_ban+1,ngay_cap_nhat=UTC_TIMESTAMP(6) WHERE ma_thiet_bi=?",
          [next, e.ma_thiet_bi],
        );
        note += ` Ngày bảo trì kế tiếp: ${next}.`;
      }
    } else if (action === "huy") {
      requireState(v.openStates);
      fields = {
        trang_thai: "HUY",
        ma_nguoi_huy: user.ma_nguoi_dung,
        ly_do_huy: v.recordText(body.ly_do, "ly_do", 3, 500),
      };
      await rows(
        db,
        "UPDATE phieu_bao_tri SET ngay_huy=UTC_TIMESTAMP(6) WHERE ma_phieu_bao_tri=?",
        [id],
      );
      note = `Hủy phiếu: ${fields.ly_do_huy}`;
    }
    await rows(
      db,
      `UPDATE phieu_bao_tri SET ${Object.keys(fields)
        .map((k) => `${k}=?`)
        .join(",")},phien_ban=phien_ban+1 WHERE ma_phieu_bao_tri=?`,
      [...Object.values(fields), id],
    );
    await audit(db, e.ma_thiet_bi, id, user, action.toUpperCase(), note, {
      truoc: {
        trang_thai: j.trang_thai,
        ma_ky_thuat_vien: j.ma_ky_thuat_vien,
        ngay_den_han: j.ngay_den_han,
        luot_thuc_hien: j.luot_thuc_hien,
      },
      sau: fields,
    });
    return { ma_phieu_bao_tri: id };
  });
}
```

## 5. `backend/src/modules/maintenance/maintenance.routes.js`

Tạo file mới.

```js
import { Router } from "express";
import { integer } from "../../lib/http.js";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./maintenance.service.js";
export const equipmentRouter = Router(),
  maintenanceRouter = Router();
equipmentRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
maintenanceRouter.use(
  optionalAuth,
  requireAuth,
  roles("QUAN_TRI_VIEN", "KY_THUAT_VIEN"),
);
equipmentRouter.get("/", async (req, res) =>
  res.json(await service.equipmentList(req.query)),
);
equipmentRouter.post("/", async (req, res) =>
  res
    .status(201)
    .json({ data: await service.createEquipment(req.body, req.user) }),
);
equipmentRouter.get("/:id", async (req, res) =>
  res.json({
    data: await service.equipmentDetail(integer(req.params.id, "id")),
  }),
);
equipmentRouter.put("/:id", async (req, res) =>
  res.json({
    data: await service.updateEquipment(
      integer(req.params.id, "id"),
      req.body,
      req.user,
    ),
  }),
);
equipmentRouter.post("/:id/phieu_bao_tri", async (req, res) => {
  const data = await service.createJob(
    integer(req.params.id, "id"),
    req.body,
    req.user,
  );
  res.status(data.replay ? 200 : 201).json({ data });
});
maintenanceRouter.get(
  "/ky_thuat_vien",
  roles("QUAN_TRI_VIEN"),
  async (req, res) => res.json(await service.technicians(req.query)),
);
maintenanceRouter.get("/", async (req, res) =>
  res.json(await service.jobs(req.query, req.user)),
);
maintenanceRouter.get("/:id", async (req, res) =>
  res.json({
    data: await service.jobDetail(integer(req.params.id, "id"), req.user),
  }),
);
for (const action of [
  "phan_cong",
  "doi_lich",
  "bat_dau",
  "bao_cao",
  "tra_lai",
  "nghiem_thu",
  "huy",
])
  maintenanceRouter.post(
    `/:id/${action}`,
    roles(
      ...(["bat_dau", "bao_cao"].includes(action)
        ? ["KY_THUAT_VIEN"]
        : ["QUAN_TRI_VIEN"]),
    ),
    async (req, res) =>
      res.json({
        data: await service.act(
          integer(req.params.id, "id"),
          action,
          req.body,
          req.user,
        ),
      }),
  );
```

## 6. `backend/src/app.js`

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

import { financialReportsRouter } from "./modules/financial-reports/financial-reports.routes.js";

import {
  equipmentRouter,
  maintenanceRouter,
} from "./modules/maintenance/maintenance.routes.js";

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
      "SELECT name FROM schema_migrations WHERE name IN (?,?,?,?,?,?,?,?,?,?,?)",
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
      ],
    );
    if (migrations.length !== 11) throw new Error("Schema not initialized");
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

## 7. `frontend/src/features/maintenance/Maintenance.jsx`

Tạo file mới.

```jsx
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
import FinancialReports from "../features/financial-reports/FinancialReports.jsx";
import {
  EquipmentList,
  EquipmentDetail,
  MaintenanceList,
  MaintenanceDetail,
} from "../features/maintenance/Maintenance.jsx";
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
```

## Thử sau khi cập nhật

1. BQL tạo thiết bị với chu kỳ 30 ngày, ngày kế tiếp hôm qua, nhắc trước 7 ngày. Danh sách phải báo Quá hạn.
2. Lập phiếu định kỳ, chọn KTV. Mở thiết bị lại: có liên kết phiếu đang mở, không tạo thêm định kỳ trùng. Thử KTV khác: không được xem phiếu.
3. Đăng nhập KTV được giao, bắt đầu rồi gửi kết quả. BQL kiểm tra và trả lại kèm lý do. KTV mở lại phải ghi kết quả mới; lượt cũ vẫn thấy trong lịch sử.
4. KTV gửi lượt mới, BQL nghiệm thu đạt. Thiết bị có ngày kế tiếp = ngày thực hiện + 30, không tự tạo phiếu mới.
5. Tạo đột xuất, thử phân công/đổi lịch/hủy. Ngày định kỳ phải giữ nguyên. Muốn ngừng sử dụng, xử lý hết phiếu mở rồi lưu trạng thái Ngừng sử dụng; lịch phải được bỏ và lịch sử vẫn còn.
6. Mở từ điện thoại: bảng có thể cuộn ngang để xem các cột; các nút ghi kết quả/nghiệm thu dùng như trên máy tính. Cư dân và khách không được vào phần quản lý này.

Kiểm tra tự động trong repository: `npm test`, `npm run test:e2e`, `npm run build`. Test dùng database riêng `chung_cu_test`; chạy các suite DB lần lượt. File kiểm thử không bắt buộc để chạy app nếu chép code thủ công. Xem [API](api.md), [kiến trúc](architecture.md) và [database](../database/README.md).

Kết quả kiểm tra bản này: **103/103 kiểm thử máy chủ**, **26/26 kiểm thử trình duyệt** và **build thành công**. Luồng thiết bị/định kỳ/đột xuất được thử ở 1440 px và 375 px; 9 khối code đã đối chiếu khớp file ứng dụng/migration.
