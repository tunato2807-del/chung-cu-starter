import { pool, rows } from "../../lib/db.js";
import { choice } from "../../lib/http.js";
import { day, today } from "../billing/billing.validation.js";

const iso = (date) => date.toISOString().slice(0, 10);
const date = (s) => new Date(`${s}T00:00:00Z`);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const localUtc = (s) =>
  new Date(`${s}T00:00:00+07:00`).toISOString().slice(0, 19).replace("T", " ");
const keys = [
  "da_thu",
  "con_no",
  "tiep_nhan",
  "da_dong",
  "lap_moi",
  "nghiem_thu",
  "cho_duyet",
  "da_duyet",
  "da_huy",
  "tu_choi",
];

// Calendar arithmetic uses UTC only as a date container. Business dates are Vietnam dates.
export function statisticsRange(query = {}, currentDay = today()) {
  const khoang = choice(query.khoang ?? "THANG", "khoang", [
    "NGAY",
    "TUAN",
    "THANG",
    "QUY",
    "NAM",
  ]);
  const ngay = day(query.ngay ?? currentDay, true);
  const anchor = date(ngay),
    year = anchor.getUTCFullYear(),
    month = anchor.getUTCMonth();
  let start = anchor,
    end,
    don_vi = "NGAY",
    nhan_khoang;
  if (khoang === "NGAY") {
    end = addDays(start, 1);
    don_vi = "GIO";
    nhan_khoang = `Ngày ${ngay.split("-").reverse().join("/")}`;
  } else if (khoang === "TUAN") {
    start = addDays(anchor, -((anchor.getUTCDay() + 6) % 7));
    end = addDays(start, 7);
    nhan_khoang = "Tuần từ thứ Hai đến Chủ nhật";
  } else if (khoang === "THANG") {
    start = new Date(Date.UTC(year, month, 1));
    end = new Date(Date.UTC(year, month + 1, 1));
    nhan_khoang = `Tháng ${month + 1}/${year}`;
  } else {
    const quarterMonth = Math.floor(month / 3) * 3;
    start = new Date(Date.UTC(year, khoang === "NAM" ? 0 : quarterMonth, 1));
    end = new Date(Date.UTC(year, khoang === "NAM" ? 12 : quarterMonth + 3, 1));
    don_vi = "THANG";
    nhan_khoang =
      khoang === "NAM"
        ? `Năm ${year}`
        : `Quý ${Math.floor(month / 3) + 1}/${year}`;
  }
  const diem = [];
  if (don_vi === "GIO") {
    for (let h = 0; h < 24; h++)
      diem.push({
        moc: `${ngay} ${String(h).padStart(2, "0")}:00:00`,
        nhan: `${String(h).padStart(2, "0")}h`,
      });
  } else {
    for (
      let d = start;
      d < end;
      d =
        don_vi === "THANG"
          ? new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
          : addDays(d, 1)
    ) {
      const s = iso(d);
      diem.push({
        moc: don_vi === "THANG" ? s.slice(0, 7) : s,
        nhan:
          don_vi === "THANG"
            ? `T${d.getUTCMonth() + 1}`
            : s.slice(5).split("-").reverse().join("/"),
      });
    }
  }
  return {
    khoang,
    ngay,
    tu_ngay: iso(start),
    den_ngay: iso(addDays(end, -1)),
    den_truoc_ngay: iso(end),
    don_vi,
    nhan_khoang,
    diem,
  };
}

export async function statistics(query = {}) {
  // Validate before acquiring a connection; all SQL expressions below are server constants.
  const range = statisticsRange(query);
  const db = await pool.getConnection();
  try {
    await db.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await db.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
    const [clock] = await rows(db, "SELECT UTC_TIMESTAMP(6) AS tai_luc");
    const points = range.diem.map((p) => ({
      ...p,
      ...Object.fromEntries(
        keys.map((k) => [k, ["da_thu", "con_no"].includes(k) ? "0" : 0]),
      ),
    }));
    const format =
      range.don_vi === "GIO"
        ? "%Y-%m-%d %H:00:00"
        : range.don_vi === "THANG"
          ? "%Y-%m"
          : "%Y-%m-%d";
    const aggregate = async (table, column, values, condition, utc = true) => {
      const businessTime = utc ? `DATE_ADD(${column},INTERVAL 7 HOUR)` : column;
      const result = await rows(
        db,
        `SELECT DATE_FORMAT(${businessTime},'${format}') AS moc,${values} FROM ${table}
        WHERE ${column}>=? AND ${column}<? ${condition ? `AND ${condition}` : ""} GROUP BY moc`,
        utc
          ? [localUtc(range.tu_ngay), localUtc(range.den_truoc_ngay)]
          : [range.tu_ngay, range.den_truoc_ngay],
      );
      const lookup = new Map(result.map((r) => [r.moc, r]));
      for (const point of points)
        if (lookup.has(point.moc)) Object.assign(point, lookup.get(point.moc));
    };
    await aggregate(
      "hoa_don",
      "ngay_thanh_toan",
      "CAST(SUM(so_tien_da_thu) AS CHAR) AS da_thu",
      "trang_thai='DA_THANH_TOAN'",
    );
    // A DATE has no hour: daily debt/maintenance totals are never assigned a fake hour.
    const dateFormat = range.don_vi === "THANG" ? "%Y-%m" : "%Y-%m-%d";
    const daily = async (table, column, values, condition) => {
      const result = await rows(
        db,
        `SELECT DATE_FORMAT(${column},'${dateFormat}') AS moc,${values} FROM ${table}
        WHERE ${column}>=? AND ${column}<? ${condition ? `AND ${condition}` : ""} GROUP BY moc`,
        [range.tu_ngay, range.den_truoc_ngay],
      );
      const lookup = new Map(result.map((r) => [r.moc, r]));
      // Day-only quantities are returned separately rather than inventing a midnight event.
      if (range.don_vi === "GIO") return result[0] || {};
      for (const point of points)
        if (lookup.has(point.moc)) Object.assign(point, lookup.get(point.moc));
      return {};
    };
    const debtDay = await daily(
      "hoa_don",
      "han_thanh_toan",
      "CAST(SUM(tong_tien) AS CHAR) AS con_no",
      "trang_thai='DA_GUI'",
    );
    await aggregate("phan_anh", "ngay_tao", "COUNT(*) AS tiep_nhan");
    await aggregate(
      "phan_anh",
      "ngay_dong",
      "COUNT(*) AS da_dong",
      "trang_thai='DA_DONG'",
    );
    const jobsDay = await daily(
      "phieu_bao_tri",
      "ngay_lap",
      "COUNT(*) AS lap_moi",
      "trang_thai<>'HUY'",
    );
    await aggregate(
      "phieu_bao_tri",
      "ngay_nghiem_thu",
      "COUNT(*) AS nghiem_thu",
      "trang_thai='HOAN_THANH'",
    );
    await aggregate(
      "dat_lich_tien_ich",
      "bat_dau",
      "CAST(SUM(trang_thai='CHO_DUYET') AS UNSIGNED) AS cho_duyet,CAST(SUM(trang_thai='DA_DUYET') AS UNSIGNED) AS da_duyet,CAST(SUM(trang_thai='DA_HUY') AS UNSIGNED) AS da_huy,CAST(SUM(trang_thai='TU_CHOI') AS UNSIGNED) AS tu_choi",
      "",
      false,
    );
    const tong = Object.fromEntries(
      keys.map((key) => [
        key,
        ["da_thu", "con_no"].includes(key)
          ? points.reduce((s, p) => s + BigInt(p[key]), 0n).toString()
          : points.reduce((s, p) => s + Number(p[key]), 0),
      ]),
    );
    if (range.don_vi === "GIO") {
      tong.con_no = debtDay.con_no || "0";
      tong.lap_moi = jobsDay.lap_moi || 0;
    }
    await db.commit();
    return { ...range, ...clock, diem: points, tong };
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}
