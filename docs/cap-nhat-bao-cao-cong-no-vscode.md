# Báo cáo công nợ và thu phí — code từng file cho VS Code

Bản tiếp theo sau `fb2418a` (Thông báo và nhắc phí). Chép đủ **7 file** bên dưới; không cần tải ZIP, cài thêm thư viện hoặc thêm migration. Bản này dùng schema đến 009 hiện có. Nếu chưa có phần thông báo, cập nhật [bản thông báo 9 file](cap-nhat-thong-bao-nhac-phi-vscode.md) trước. Khi đã cập nhật bản mới, không chép App.jsx/app.js/global.css của bản cũ đè lại.

## Cách cập nhật

1. Dừng backend và frontend bằng Ctrl+C. Lưu riêng thay đổi cá nhân trước khi thay file. Giữ database, ảnh, `.env` và `.certs`.
2. Tạo 3 file mới tại mục 1, 2 và 5; thay toàn bộ nội dung 4 file còn lại. Chỉ chép phần mã bên trong mỗi khối, bỏ dòng mở/đóng khối mã.
3. Mở PowerShell ở thư mục gốc dự án (nơi có package.json). Không cần seed lại hoặc sửa migration. Nếu schema đã đến 009, khởi động:

```powershell
npm run dev:backend
```

Terminal thứ hai:

```powershell
npm run dev:frontend:https
```

Giữ cấu hình HTTPS hiện có để thử camera điện thoại. Tải lại web, đăng nhập tài khoản BQL, mở **Công nợ & thu phí**. Cư dân/KTV không có quyền vào phần báo cáo.

## Cách đọc số liệu

**Công nợ theo kỳ hóa đơn** mặc định tất cả kỳ. Có lọc từ kỳ/đến kỳ, khối và số căn:

- Tổng đã gửi chỉ gồm hóa đơn Đã gửi hoặc Đã thanh toán.
- Đã thu theo kỳ là tiền đã xác nhận của các hóa đơn trong kỳ đã chọn; ngày thu có thể ở kỳ khác.
- Còn phải thu chỉ gồm hóa đơn Đã gửi/chưa thanh toán. Tổng đã gửi = đã thu + còn phải thu.
- Nợ quá hạn nằm trong số còn phải thu, không cộng thêm lần nữa. Chỉ quá hạn nếu hạn trả trước hôm nay theo giờ Việt Nam; hạn hôm nay chưa quá hạn.
- Loại nháp, hóa đơn chưa gửi và đã hủy; hóa đơn thay thế không bị cộng cùng bản hủy. Nhiều chủ hộ không làm nhân số tiền.

Chọn **Công nợ theo căn**, **Hóa đơn chưa thu** hoặc **Tổng hợp theo kỳ**. Bấm ô **Nợ quá hạn** để xem hóa đơn quá hạn; bộ lọc quá hạn chỉ đổi bảng chi tiết, không đổi tổng phía trên. Khi chỉ xem căn có nợ quá hạn, mỗi căn vẫn hiện toàn bộ nợ của căn trong kỳ đã lọc. Người phụ trách là người hiện tại, không tự thay nghĩa vụ tài chính của hóa đơn cũ.

Bấm **Xem hóa đơn** ở căn để lọc hóa đơn riêng căn đó. Bấm số hóa đơn hoặc **Kiểm tra / nhắc phí** để mở chi tiết; dùng nút nhắc và xác nhận thu đã có. Màn báo cáo chỉ đọc, không tự gửi nhắc hoặc xác nhận tiền.

**Thu phí theo ngày xác nhận** mặc định đầu tháng đến hôm nay tại Việt Nam. Chọn ngày đầu/ngày cuối, khối và số căn; xem từng khoản/tham chiếu/người xác nhận hoặc tổng hợp theo ngày. Kỳ hóa đơn cũ vẫn được ghi vào đúng ngày BQL xác nhận thu. Khoảng ngày gồm cả ngày cuối, kể cả khoản ghi nhận sát nửa đêm. Đây là thời điểm BQL ghi nhận trên hệ thống, có thể khác ngày cư dân chuyển khoản từ ngân hàng.

Số liệu công nợ là **số dư hiện tại của các kỳ đã chọn**, chưa phải công nợ hồi tố tại ngày quá khứ. Tổng phía trên luôn tính hết bộ lọc, không chỉ 20 dòng đang xem. Tiền tính và định dạng bằng số nguyên chính xác; tỷ lệ đã thu làm tròn 2 số lẻ. Hóa đơn đã thu thiếu thời điểm xác nhận không vào báo cáo theo ngày. Bản này không có sổ chi hoặc đồng bộ ngân hàng.

## 1. `backend/src/modules/financial-reports/financial-reports.service.js`

Tạo file mới.

```js
import { pool, rows } from "../../lib/db.js";
import { choice, fail, integer, text } from "../../lib/http.js";
import {
  day,
  pagination,
  period,
  today,
} from "../billing/billing.validation.js";

// All queries in one response read the same committed snapshot, without locking bills.
async function snapshot(work) {
  const db = await pool.getConnection();
  try {
    await db.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await db.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
    const result = await work(db);
    await db.commit();
    return result;
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}
function filters(query) {
  const result = {
    khoi: query.khoi ? text(query.khoi, "khoi", 1, 10) : "",
    q: query.q ? text(query.q, "q", 1, 100) : "",
  };
  if (query.ma_can_ho) {
    result.ma_can_ho = integer(query.ma_can_ho, "ma_can_ho");
    if (!result.ma_can_ho) fail(422, "VALIDATION", "Mã căn hộ không hợp lệ.");
  }
  return result;
}
function conditions(f) {
  const where = [],
    values = [];
  if (f.khoi) {
    where.push("a.khoi=?");
    values.push(f.khoi);
  }
  if (f.q) {
    where.push("a.so_can_ho LIKE ?");
    values.push(`%${f.q}%`);
  }
  if (f.ma_can_ho) {
    where.push("a.ma_can_ho=?");
    values.push(f.ma_can_ho);
  }
  return { where, values };
}
const from = "FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho";
const money = (expression) => `CAST(COALESCE(SUM(${expression}),0) AS CHAR)`;
const unpaid = "h.trang_thai='DA_GUI'";
const paid = "h.trang_thai='DA_THANH_TOAN'";
function aggregates(overdue) {
  return `${money("h.tong_tien")} AS tong_da_gui,
    ${money(`CASE WHEN ${paid} THEN h.so_tien_da_thu ELSE 0 END`)} AS da_thu,
    ${money(`CASE WHEN ${unpaid} THEN h.tong_tien ELSE 0 END`)} AS con_phai_thu,
    ${money(`CASE WHEN ${overdue} THEN h.tong_tien ELSE 0 END`)} AS no_qua_han,
    COUNT(*) AS so_hoa_don, CAST(COALESCE(SUM(${paid}),0) AS UNSIGNED) AS so_hoa_don_da_thu,
    CAST(COALESCE(SUM(${unpaid}),0) AS UNSIGNED) AS so_hoa_don_chua_thu,
    CAST(COALESCE(SUM(${overdue}),0) AS UNSIGNED) AS so_hoa_don_qua_han`;
}
export async function blocks() {
  return rows(pool, "SELECT DISTINCT khoi FROM can_ho ORDER BY khoi");
}
export async function debts(query) {
  const calendarDay = today(),
    f = filters(query),
    { page, offset } = pagination(query);
  f.tu_ky = query.tu_ky ? period(query.tu_ky) : "";
  f.den_ky = query.den_ky ? period(query.den_ky) : "";
  f.che_do = choice(query.che_do || "CAN_HO", "che_do", [
    "CAN_HO",
    "HOA_DON",
    "THEO_KY",
  ]);
  f.qua_han = choice(query.qua_han || "0", "qua_han", ["0", "1"]);
  if (f.tu_ky && f.den_ky && f.tu_ky > f.den_ky)
    fail(422, "INVALID_PERIOD_RANGE", "Từ kỳ không được sau đến kỳ.");
  if (f.che_do === "THEO_KY" && f.qua_han === "1")
    fail(
      422,
      "INVALID_FILTER",
      "Lọc quá hạn chỉ dùng cho danh sách căn hoặc hóa đơn chưa thu.",
    );
  const { where, values } = conditions(f);
  where.push("h.trang_thai IN ('DA_GUI','DA_THANH_TOAN')");
  if (f.tu_ky) {
    where.push("h.ky_thanh_toan>=?");
    values.push(f.tu_ky);
  }
  if (f.den_ky) {
    where.push("h.ky_thanh_toan<=?");
    values.push(f.den_ky);
  }
  const condition = where.join(" AND ");
  // Validated YYYY-MM-DD, interpolated once to keep summary/group parameters identical.
  const overdue = `(${unpaid} AND h.han_thanh_toan IS NOT NULL AND h.han_thanh_toan<'${calendarDay}')`;
  return snapshot(async (db) => {
    const [stamp] = await rows(db, "SELECT UTC_TIMESTAMP(6) AS tai_luc");
    const [summary] = await rows(
      db,
      `SELECT ${aggregates(overdue)},COUNT(DISTINCT CASE WHEN ${unpaid} THEN h.ma_can_ho END) AS so_can_con_no ${from} WHERE ${condition}`,
      values,
    );
    summary.ty_le_da_thu =
      summary.tong_da_gui === "0"
        ? 0
        : Number(
            (BigInt(summary.da_thu) * 10000n +
              BigInt(summary.tong_da_gui) / 2n) /
              BigInt(summary.tong_da_gui),
          ) / 100;
    let source, order;
    const args = values;
    if (f.che_do === "CAN_HO") {
      const grouped = `SELECT h.ma_can_ho,COUNT(*) AS so_hoa_don_chua_thu,
        ${money("h.tong_tien")} AS con_phai_thu,
        ${money(`CASE WHEN ${overdue} THEN h.tong_tien ELSE 0 END`)} AS no_qua_han,
        MIN(h.han_thanh_toan) AS han_som_nhat
        ${from} WHERE ${condition} AND ${unpaid} GROUP BY h.ma_can_ho
        ${f.qua_han === "1" ? `HAVING SUM(${overdue})>0` : ""}`;
      source = `FROM (${grouped}) d JOIN can_ho a ON a.ma_can_ho=d.ma_can_ho
        LEFT JOIN nguoi_dung tk ON tk.ma_can_ho_thanh_toan=a.ma_can_ho
        LEFT JOIN cu_dan c ON c.ma_cu_dan=tk.ma_cu_dan_phu_trach`;
      order =
        "ORDER BY CAST(d.no_qua_han AS DECIMAL(40,0)) DESC,CAST(d.con_phai_thu AS DECIMAL(40,0)) DESC,d.ma_can_ho";
    } else if (f.che_do === "HOA_DON") {
      source = `${from} WHERE ${condition} AND ${unpaid}${f.qua_han === "1" ? ` AND ${overdue}` : ""}`;
      order = `ORDER BY ${overdue} DESC,h.han_thanh_toan IS NULL,h.han_thanh_toan,h.ma_hoa_don`;
    } else {
      source = `FROM (SELECT h.ky_thanh_toan,${aggregates(overdue)} ${from} WHERE ${condition} GROUP BY h.ky_thanh_toan) d`;
      order = "ORDER BY d.ky_thanh_toan DESC";
    }
    const [count] = await rows(db, `SELECT COUNT(*) AS total ${source}`, args);
    const fields =
      f.che_do === "CAN_HO"
        ? "d.*,a.so_can_ho,a.khoi,c.ho_va_ten AS nguoi_phu_trach,c.so_dien_thoai AS dien_thoai_phu_trach"
        : f.che_do === "THEO_KY"
          ? "d.*"
          : `h.ma_hoa_don,h.so_hoa_don,h.ma_can_ho,h.ky_thanh_toan,h.tong_tien,h.han_thanh_toan,a.so_can_ho,a.khoi,${overdue} AS qua_han`;
    const data = await rows(
      db,
      `SELECT ${fields} ${source} ${order} LIMIT 20 OFFSET ${offset}`,
      args,
    );
    return {
      data,
      summary,
      total: count.total,
      page,
      filters: f,
      ngay_bao_cao: calendarDay,
      ...stamp,
    };
  });
}
function utcMidnight(vietnamDay, next = false) {
  const timestamp =
    new Date(`${vietnamDay}T00:00:00+07:00`).getTime() + (next ? 86400000 : 0);
  return new Date(timestamp).toISOString().slice(0, 19).replace("T", " ");
}
export async function collections(query) {
  const calendarDay = today(),
    f = filters(query),
    { page, offset } = pagination(query);
  f.tu_ngay = day(query.tu_ngay || `${calendarDay.slice(0, 7)}-01`);
  f.den_ngay = day(query.den_ngay || calendarDay);
  f.che_do = choice(query.che_do || "GIAO_DICH", "che_do", [
    "GIAO_DICH",
    "THEO_NGAY",
  ]);
  if (f.tu_ngay > f.den_ngay)
    fail(422, "INVALID_DATE_RANGE", "Từ ngày không được sau đến ngày.");
  const { where, values } = conditions(f);
  where.push(`${paid} AND h.ngay_thanh_toan>=? AND h.ngay_thanh_toan<?`);
  values.push(utcMidnight(f.tu_ngay), utcMidnight(f.den_ngay, true));
  const condition = where.join(" AND "),
    localDay =
      "DATE_FORMAT(CONVERT_TZ(h.ngay_thanh_toan,'+00:00','+07:00'),'%Y-%m-%d')";
  return snapshot(async (db) => {
    const [stamp] = await rows(db, "SELECT UTC_TIMESTAMP(6) AS tai_luc");
    const [summary] = await rows(
      db,
      `SELECT ${money("h.so_tien_da_thu")} AS tong_da_thu,COUNT(*) AS so_khoan_thu,COUNT(DISTINCT h.ma_can_ho) AS so_can_da_thu ${from} WHERE ${condition}`,
      values,
    );
    const source =
      f.che_do === "THEO_NGAY"
        ? `FROM (SELECT ${localDay} AS ngay_thu,${money("h.so_tien_da_thu")} AS da_thu,COUNT(*) AS so_khoan_thu ${from} WHERE ${condition} GROUP BY ${localDay}) d`
        : `${from} LEFT JOIN nguoi_dung u ON u.ma_nguoi_dung=h.ma_nguoi_xac_nhan WHERE ${condition}`;
    const [count] = await rows(
      db,
      `SELECT COUNT(*) AS total ${source}`,
      values,
    );
    const fields =
      f.che_do === "THEO_NGAY"
        ? "d.*"
        : "h.ma_hoa_don,h.so_hoa_don,h.ma_can_ho,h.ky_thanh_toan,h.so_tien_da_thu,h.ma_tham_chieu,h.ngay_thanh_toan,a.so_can_ho,a.khoi,u.ho_va_ten AS nguoi_xac_nhan";
    const order =
      f.che_do === "THEO_NGAY"
        ? "d.ngay_thu DESC"
        : "h.ngay_thanh_toan DESC,h.ma_hoa_don DESC";
    const data = await rows(
      db,
      `SELECT ${fields} ${source} ORDER BY ${order} LIMIT 20 OFFSET ${offset}`,
      values,
    );
    return {
      data,
      summary,
      total: count.total,
      page,
      filters: f,
      ngay_bao_cao: calendarDay,
      ...stamp,
    };
  });
}
```

## 2. `backend/src/modules/financial-reports/financial-reports.routes.js`

Tạo file mới.

```js
import { Router } from "express";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import * as service from "./financial-reports.service.js";
export const financialReportsRouter = Router();
financialReportsRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
financialReportsRouter.get("/bo_loc", async (req, res) =>
  res.json({ data: await service.blocks() }),
);
financialReportsRouter.get("/cong_no", async (req, res) =>
  res.json(await service.debts(req.query)),
);
financialReportsRouter.get("/thu_phi", async (req, res) =>
  res.json(await service.collections(req.query)),
);
```

## 3. `backend/src/modules/billing/billing.service.js`

Thay toàn bộ nội dung file.

```js
import { createHash, randomBytes } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, integer, text } from "../../lib/http.js";
import { lockApartment } from "./billing.guards.js";
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
  });
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

## 4. `backend/src/app.js`

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
app.use("/api/bao_cao", financialReportsRouter);
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

## 5. `frontend/src/features/financial-reports/FinancialReports.jsx`

Tạo file mới.

```jsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { ErrorBox, Field, Loading, useResource } from "../../shared/ui.jsx";

const money = (n) => `${BigInt(n || 0).toLocaleString("vi-VN")} đ`;
const day = (value) =>
  value ? value.split("-").reverse().join("/") : "Chưa đặt hạn";
const time = (value) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value.replace(" ", "T") + "Z"))
    : "—";
function Metric({ label, amount, hint, tone = "", onClick, selected }) {
  const body = (
    <>
      <span className="finance-metric-label">{label}</span>
      <strong>{money(amount)}</strong>
      <small>{hint}</small>
    </>
  );
  return onClick ? (
    <button
      className={`finance-metric ${tone}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {body}
    </button>
  ) : (
    <div className={`finance-metric ${tone}`}>{body}</div>
  );
}
function Pager({ result, loading, go }) {
  return (
    <div className="actions finance-pager">
      <button
        disabled={loading || (result?.page || 1) <= 1}
        onClick={() => go(result.page - 1)}
      >
        Trang trước
      </button>
      <span>
        Trang {result?.page || 1} · {result?.total || 0} bản ghi
      </span>
      <button
        disabled={loading || (result?.page || 1) * 20 >= (result?.total || 0)}
        onClick={() => go(result.page + 1)}
      >
        Trang sau
      </button>
    </div>
  );
}
// Tag results with their request so switching report types never renders stale columns/totals.
function useReport(path) {
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

function OverdueFilter({ value, loading, label, onChange }) {
  const [checked, setChecked] = useState(value);
  useEffect(() => setChecked(value), [value]);
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        disabled={loading}
        checked={checked}
        onChange={(e) => {
          const next = e.target.checked;
          // Reflect the click immediately while router navigation updates the URL.
          setChecked(next);
          onChange(next);
        }}
      />
      {label}
    </label>
  );
}

export default function FinancialReports() {
  const calendarDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [params, setParams] = useSearchParams();
  const cash = params.get("bao_cao") === "THU_PHI",
    endpoint = cash ? "thu_phi" : "cong_no";
  const query = new URLSearchParams(params);
  query.delete("bao_cao");
  const resource = useReport(`/bao_cao/${endpoint}?${query}`),
    blocks = useResource("/bao_cao/bo_loc"),
    result = resource.result,
    f = result?.filters,
    s = result?.summary;
  const view = params.get("che_do") || (cash ? "GIAO_DICH" : "CAN_HO"),
    overdue = params.get("qua_han") === "1";
  function setView(che_do, more = {}) {
    const next = new URLSearchParams(params);
    next.set("che_do", che_do);
    next.delete("page");
    next.delete("qua_han");
    for (const [k, v] of Object.entries(more)) next.set(k, v);
    setParams(next);
  }
  function switchReport(report) {
    const next = new URLSearchParams();
    next.set("bao_cao", report);
    for (const k of ["khoi", "q"])
      if (params.get(k)) next.set(k, params.get(k));
    setParams(next);
  }
  function showApartment(id) {
    setView("HOA_DON", { ma_can_ho: String(id) });
  }
  const billLink = (b) => (
    <Link to={`/quan-tri/hoa-don/${b.ma_hoa_don}`}>{b.so_hoa_don}</Link>
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Theo dõi tài chính</p>
          <h1>Báo cáo công nợ và thu phí</h1>
        </div>
        <button disabled={resource.loading} onClick={resource.reload}>
          Cập nhật số liệu
        </button>
      </div>
      <div className="finance-tabs" role="group" aria-label="Loại báo cáo">
        <button
          className={!cash ? "primary" : ""}
          aria-pressed={!cash}
          onClick={() => switchReport("CONG_NO")}
        >
          Công nợ theo kỳ hóa đơn
        </button>
        <button
          className={cash ? "primary" : ""}
          aria-pressed={cash}
          onClick={() => switchReport("THU_PHI")}
        >
          Thu phí theo ngày xác nhận
        </button>
      </div>
      <p className="muted">
        {cash
          ? "Tổng tiền BQL đã ghi nhận thu trong khoảng ngày tại Việt Nam, gồm cả khoản thu cho kỳ hóa đơn cũ. Thời điểm xác nhận có thể khác ngày cư dân chuyển khoản."
          : "Công nợ hiện tại của các kỳ hóa đơn đã chọn. Tổng đã gửi = đã thu + còn phải thu; nợ quá hạn nằm trong số còn phải thu. Mặc định xem tất cả kỳ để không bỏ sót nợ cũ."}
      </p>
      <form
        className="filters finance-filters"
        key={`${endpoint}:${params}`}
        onSubmit={(e) => {
          e.preventDefault();
          const next = new URLSearchParams(
            Object.fromEntries(new FormData(e.currentTarget)),
          );
          next.set("bao_cao", cash ? "THU_PHI" : "CONG_NO");
          next.set("che_do", view);
          if (!cash && overdue && view !== "THEO_KY") next.set("qua_han", "1");
          setParams(next);
        }}
      >
        {cash ? (
          <>
            <Field
              label="Từ ngày xác nhận"
              type="date"
              name="tu_ngay"
              required
              max={calendarDay}
              defaultValue={
                params.get("tu_ngay") || `${calendarDay.slice(0, 7)}-01`
              }
            />
            <Field
              label="Đến ngày xác nhận"
              type="date"
              name="den_ngay"
              required
              max={calendarDay}
              defaultValue={params.get("den_ngay") || calendarDay}
            />
          </>
        ) : (
          <>
            <Field
              label="Từ kỳ hóa đơn"
              type="month"
              name="tu_ky"
              defaultValue={params.get("tu_ky") || ""}
            />
            <Field
              label="Đến kỳ hóa đơn"
              type="month"
              name="den_ky"
              defaultValue={params.get("den_ky") || ""}
            />
          </>
        )}
        <Field label="Khối">
          <select name="khoi" defaultValue={params.get("khoi") || ""}>
            <option value="">Tất cả khối</option>
            {params.get("khoi") &&
              !blocks.result?.data.some(
                (b) => b.khoi === params.get("khoi"),
              ) && (
                <option value={params.get("khoi")}>{params.get("khoi")}</option>
              )}
            {blocks.result?.data.map((b) => (
              <option value={b.khoi} key={b.khoi}>
                {b.khoi}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Tìm số căn hộ"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        {params.get("ma_can_ho") && (
          <input
            type="hidden"
            name="ma_can_ho"
            value={params.get("ma_can_ho")}
          />
        )}
        <button className="primary" disabled={resource.loading}>
          Xem báo cáo
        </button>
        <button
          type="button"
          onClick={() => setParams({ bao_cao: cash ? "THU_PHI" : "CONG_NO" })}
        >
          Xóa bộ lọc
        </button>
      </form>
      <ErrorBox error={blocks.error} />
      <ErrorBox error={resource.error} />
      {resource.loading && <Loading />}
      {s && (
        <>
          <p className="finance-snapshot">
            Dữ liệu lúc {time(result.tai_luc)} · Giờ Việt Nam
            {!cash && ` · Xét quá hạn đến ${day(result.ngay_bao_cao)}`}
          </p>
          {cash ? (
            <div
              className="finance-metrics finance-metrics-cash"
              aria-label="Tổng hợp thu phí"
            >
              <Metric
                label="Đã ghi nhận thu"
                amount={s.tong_da_thu}
                hint={`${s.so_khoan_thu} khoản · ${s.so_can_da_thu} căn hộ`}
                tone="is-paid"
              />
              <div className="finance-date-range">
                <span>Khoảng ngày xác nhận</span>
                <strong>
                  {day(f.tu_ngay)} — {day(f.den_ngay)}
                </strong>
                <small>
                  Theo thời điểm xác nhận trên hệ thống, không phải kỳ hóa đơn.
                </small>
              </div>
            </div>
          ) : (
            <>
              <div className="finance-metrics" aria-label="Tổng hợp công nợ">
                <Metric
                  label="Tổng đã gửi"
                  amount={s.tong_da_gui}
                  hint={`${s.so_hoa_don} hóa đơn đã gửi hoặc đã thu`}
                />
                <Metric
                  label="Đã thu theo kỳ hóa đơn"
                  amount={s.da_thu}
                  hint={`${s.so_hoa_don_da_thu} hóa đơn đã thu`}
                  tone="is-paid"
                />
                <Metric
                  label="Còn phải thu"
                  amount={s.con_phai_thu}
                  hint={`${s.so_hoa_don_chua_thu} hóa đơn · ${s.so_can_con_no} căn còn nợ`}
                  onClick={() => setView("CAN_HO")}
                  selected={view === "CAN_HO" && !overdue}
                />
                <Metric
                  label="Nợ quá hạn"
                  amount={s.no_qua_han}
                  hint={`${s.so_hoa_don_qua_han} hóa đơn quá hạn · Bấm để xem`}
                  tone="is-overdue"
                  onClick={() => setView("HOA_DON", { qua_han: "1" })}
                  selected={view === "HOA_DON" && overdue}
                />
              </div>
              <div className="finance-progress">
                <div>
                  <strong>
                    Tỷ lệ đã thu:{" "}
                    {s.ty_le_da_thu.toLocaleString("vi-VN", {
                      maximumFractionDigits: 2,
                    })}
                    %
                  </strong>
                  <span>Tính theo giá trị hóa đơn</span>
                </div>
                <progress
                  value={s.ty_le_da_thu}
                  max="100"
                  aria-label="Tỷ lệ đã thu theo giá trị hóa đơn"
                />
              </div>
              <p className="muted">
                Không tính bản nháp, hóa đơn chưa gửi hoặc đã hủy. Đây là số dư
                hiện tại, không phải số dư hồi tố tại một ngày trong quá khứ.
              </p>
            </>
          )}
        </>
      )}
      <section className="card finance-results" aria-label="Chi tiết báo cáo">
        <div
          className="finance-tabs"
          role="group"
          aria-label="Cách xem chi tiết"
        >
          {(cash
            ? [
                ["GIAO_DICH", "Các khoản đã thu"],
                ["THEO_NGAY", "Tổng hợp theo ngày"],
              ]
            : [
                ["CAN_HO", "Công nợ theo căn"],
                ["HOA_DON", "Hóa đơn chưa thu"],
                ["THEO_KY", "Tổng hợp theo kỳ"],
              ]
          ).map(([key, label]) => (
            <button
              key={key}
              aria-pressed={view === key}
              className={view === key ? "primary" : ""}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {!cash && view !== "THEO_KY" && (
          <OverdueFilter
            value={overdue}
            loading={resource.loading}
            label={
              view === "CAN_HO"
                ? "Chỉ căn có nợ quá hạn"
                : "Chỉ hóa đơn quá hạn"
            }
            onChange={(checked) =>
              setView(view, { qua_han: checked ? "1" : "0" })
            }
          />
        )}
        {params.get("ma_can_ho") && (
          <p className="note">
            Đang xem riêng căn đã chọn.{" "}
            <button
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("ma_can_ho");
                next.delete("page");
                setParams(next);
              }}
            >
              Xem mọi căn trong bộ lọc
            </button>
          </p>
        )}
        {!cash && (
          <p className="muted">
            Các số tổng ở trên theo bộ lọc kỳ/khối/căn. Chọn cách xem hoặc chỉ
            xem quá hạn chỉ đổi bảng chi tiết.
            {view === "CAN_HO" &&
              " Mỗi căn vẫn gồm toàn bộ nợ của các kỳ đã chọn. Người phụ trách là người hiện tại, không tự thay nghĩa vụ tài chính của hóa đơn cũ."}
          </p>
        )}
        {result && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {cash ? (
                      view === "THEO_NGAY" ? (
                        <>
                          <th>Ngày xác nhận (VN)</th>
                          <th>Số khoản</th>
                          <th>Đã thu</th>
                        </>
                      ) : (
                        <>
                          <th>Hóa đơn</th>
                          <th>Căn / khối / kỳ</th>
                          <th>Thời điểm xác nhận (VN)</th>
                          <th>Tham chiếu</th>
                          <th>Người xác nhận</th>
                          <th>Số tiền đã thu</th>
                        </>
                      )
                    ) : view === "CAN_HO" ? (
                      <>
                        <th>Căn / khối</th>
                        <th>Người phụ trách hiện tại</th>
                        <th>Hóa đơn chưa thu</th>
                        <th>Hạn sớm nhất</th>
                        <th>Còn phải thu</th>
                        <th>Nợ quá hạn</th>
                        <th>Chi tiết</th>
                      </>
                    ) : view === "HOA_DON" ? (
                      <>
                        <th>Hóa đơn</th>
                        <th>Căn / khối</th>
                        <th>Kỳ hóa đơn</th>
                        <th>Hạn thanh toán</th>
                        <th>Tình trạng</th>
                        <th>Còn phải thu</th>
                        <th>Xử lý</th>
                      </>
                    ) : (
                      <>
                        <th>Kỳ hóa đơn</th>
                        <th>Số hóa đơn</th>
                        <th>Tổng đã gửi</th>
                        <th>Đã thu</th>
                        <th>Còn phải thu</th>
                        <th>Nợ quá hạn</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((r, i) => (
                    <tr
                      key={
                        r.ma_hoa_don ||
                        r.ma_can_ho ||
                        r.ky_thanh_toan ||
                        r.ngay_thu ||
                        i
                      }
                    >
                      {cash ? (
                        view === "THEO_NGAY" ? (
                          <>
                            <td>{day(r.ngay_thu)}</td>
                            <td>{r.so_khoan_thu}</td>
                            <td className="finance-number">
                              {money(r.da_thu)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{billLink(r)}</td>
                            <td>
                              {r.so_can_ho} · {r.khoi}
                              <br />
                              {r.ky_thanh_toan}
                            </td>
                            <td>{time(r.ngay_thanh_toan)}</td>
                            <td>{r.ma_tham_chieu}</td>
                            <td>{r.nguoi_xac_nhan || "—"}</td>
                            <td className="finance-number">
                              {money(r.so_tien_da_thu)}
                            </td>
                          </>
                        )
                      ) : view === "CAN_HO" ? (
                        <>
                          <td>
                            <strong>{r.so_can_ho}</strong>
                            <br />
                            Khối {r.khoi}
                          </td>
                          <td>
                            {r.nguoi_phu_trach || "Chưa gắn chủ hộ"}
                            {r.dien_thoai_phu_trach && (
                              <small className="finance-contact">
                                {r.dien_thoai_phu_trach}
                              </small>
                            )}
                          </td>
                          <td>{r.so_hoa_don_chua_thu}</td>
                          <td>{day(r.han_som_nhat)}</td>
                          <td className="finance-number">
                            {money(r.con_phai_thu)}
                          </td>
                          <td
                            className={`finance-number ${r.no_qua_han !== "0" ? "finance-overdue" : ""}`}
                          >
                            {money(r.no_qua_han)}
                          </td>
                          <td>
                            <button onClick={() => showApartment(r.ma_can_ho)}>
                              Xem hóa đơn
                            </button>
                          </td>
                        </>
                      ) : view === "HOA_DON" ? (
                        <>
                          <td>{billLink(r)}</td>
                          <td>
                            {r.so_can_ho} · {r.khoi}
                          </td>
                          <td>{r.ky_thanh_toan}</td>
                          <td>{day(r.han_thanh_toan)}</td>
                          <td>
                            {r.qua_han ? (
                              <span className="finance-overdue">Quá hạn</span>
                            ) : r.han_thanh_toan ? (
                              "Chưa quá hạn"
                            ) : (
                              "Chưa đặt hạn"
                            )}
                          </td>
                          <td className="finance-number">
                            {money(r.tong_tien)}
                          </td>
                          <td>
                            <Link
                              className="button"
                              to={`/quan-tri/hoa-don/${r.ma_hoa_don}`}
                            >
                              Kiểm tra / nhắc phí
                            </Link>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{r.ky_thanh_toan}</td>
                          <td>{r.so_hoa_don}</td>
                          <td className="finance-number">
                            {money(r.tong_da_gui)}
                          </td>
                          <td className="finance-number">{money(r.da_thu)}</td>
                          <td className="finance-number">
                            {money(r.con_phai_thu)}
                          </td>
                          <td className="finance-number">
                            {money(r.no_qua_han)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.total === 0 && (
              <p className="finance-empty">
                {cash
                  ? "Chưa có khoản thu trong khoảng ngày và bộ lọc đã chọn."
                  : "Không có dữ liệu phù hợp với cách xem và bộ lọc đã chọn."}
              </p>
            )}
            <Pager
              result={result}
              loading={resource.loading}
              go={(page) => {
                const next = new URLSearchParams(params);
                next.set("page", page);
                setParams(next);
              }}
            />
          </>
        )}
      </section>
    </>
  );
}
```

## 6. `frontend/src/app/App.jsx`

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
          ["/quan-tri/bao-cao-tai-chinh", "Công nợ & thu phí"],
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

## 7. `frontend/src/styles/global.css`

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
```

## Thử sau khi cập nhật

1. Chọn một khối có hóa đơn Đã gửi và Đã thanh toán. Đối chiếu Tổng đã gửi = Đã thu + Còn phải thu. Bản nháp/chưa gửi/hủy không tăng tổng.
2. Lọc một kỳ rồi đổi cách xem căn/hóa đơn/kỳ; tổng phía trên phải giữ nguyên. Chọn chỉ quá hạn: hóa đơn có hạn hôm nay không được gắn Quá hạn.
3. Chọn căn → mở hóa đơn chưa thu → nhắc phí nếu cần. Sau khi đối soát thực tế, xác nhận thu. Quay lại báo cáo, chọn đúng bộ lọc: đã thu tăng, còn phải thu giảm cùng số tiền; tổng đã gửi giữ nguyên.
4. Đổi sang thu phí theo ngày xác nhận, chọn hôm nay: khoản vừa xác nhận phải xuất hiện, dù hóa đơn thuộc kỳ cũ. Kiểm tra ngày giờ theo Việt Nam.
5. Tìm số căn không tồn tại: tổng về 0 và bảng có thông báo rỗng. Xóa bộ lọc để xem lại.
6. Thử bằng tài khoản cư dân/KTV hoặc chưa đăng nhập: không được đọc báo cáo, kể cả gọi API trực tiếp.

Kiểm tra tự động tại repository: `npm test`, `npm run test:e2e`, `npm run build`. Test dùng database riêng `chung_cu_test`; chạy hai suite DB lần lượt. File test không bắt buộc để chạy ứng dụng khi chép code thủ công. Xem [API](api.md) để kiểm tra các bộ lọc và kiểu dữ liệu.

Kết quả kiểm tra bản này: **87/87 kiểm thử máy chủ**, **24/24 kiểm thử trình duyệt** và **build thành công**. Luồng báo cáo được thử ở 1440 px và 375 px; 7 khối code được đối chiếu khớp đầy đủ với file ứng dụng.
