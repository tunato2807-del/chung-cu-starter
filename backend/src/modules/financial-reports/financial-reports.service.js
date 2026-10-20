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
