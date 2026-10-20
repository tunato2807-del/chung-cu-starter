import { reportPage } from "../report-exports/report-files.js";
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, integer, text } from "../../lib/http.js";
import * as valid from "./residency.validation.js";
import { lockApartment } from "../billing/billing.guards.js";
import {
  finishStayVehicles,
  carryStayVehicles,
} from "../vehicles/vehicles.service.js";

import {
  accountForApartment,
  ensureApartmentAccount,
  assignHouseholder,
  releaseHouseholder,
  ownerPhoneChanged,
} from "./apartment-accounts.service.js";

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
    account.ma_can_ho_thanh_toan !== null ||
    account.vai_tro !== "CU_DAN" ||
    (!account.dang_hoat_dong && id !== previous)
  )
    fail(422, "INVALID_ACCOUNT", "Chỉ gắn tài khoản cư dân đang hoạt động.");
}

export async function listApartments(query, exportFormat = null) {
  const { q } = search({ ...query, page: 1 });
  const { page, offset, limit, check } = reportPage(query, exportFormat);
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
  check(count.total);
  const data = await rows(
    pool,
    `SELECT c.*, (SELECT COUNT(*) FROM lich_su_cu_tru l WHERE l.ma_can_ho=c.ma_can_ho AND l.den_ngay IS NULL) AS so_cu_dan FROM can_ho c ${where} ORDER BY khoi,tang,so_can_ho LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return { data, total: count.total, page };
}
export async function availableAccounts(query) {
  const { q, page, offset } = search(query);
  const where = `WHERE u.vai_tro='CU_DAN' AND u.dang_hoat_dong=1 AND u.ma_can_ho_thanh_toan IS NULL
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
  return {
    ...data,
    residents,
    tai_khoan_can_ho: await accountForApartment(id),
    lich_su_ban_giao: await rows(
      pool,
      "SELECT b.*,u.ho_va_ten AS nguoi_thuc_hien FROM lich_su_ban_giao_can_ho b JOIN nguoi_dung u ON u.ma_nguoi_dung=b.ma_nguoi_thuc_hien WHERE b.ma_can_ho=? ORDER BY b.ma_ban_giao DESC LIMIT 50",
      [id],
    ),
  };
}
export async function saveApartment(id, body, user, connection = null) {
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
    const apartment = await one(db, "can_ho", "ma_can_ho", id);
    const created = await ensureApartmentAccount(db, apartment, user);
    return {
      ...apartment,
      tai_khoan_can_ho:
        created.credentials || (await accountForApartment(id, db)),
    };
  }, connection);
}

const residentJoin = `FROM cu_dan c LEFT JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan AND l.den_ngay IS NULL LEFT JOIN can_ho a ON a.ma_can_ho=l.ma_can_ho`;
export async function listResidents(query, exportFormat = null) {
  const { q } = search({ ...query, page: 1 });
  const { page, offset, limit, check } = reportPage(query, exportFormat);
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
  check(count.total);
  const data = await rows(
    pool,
    `SELECT c.*,l.ma_lich_su_cu_tru,l.ma_can_ho,l.quan_he,l.tu_ngay,a.so_can_ho ${residentJoin} ${where} ORDER BY c.ho_va_ten,c.ma_cu_dan LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return { data, total: count.total, page };
}
export async function residentDetail(id) {
  const resident = await one(pool, "cu_dan", "ma_cu_dan", id);
  const history = await rows(
    pool,
    `SELECT l.*,a.so_can_ho,u.ho_va_ten AS nguoi_ghi_nhan FROM lich_su_cu_tru l JOIN can_ho a ON a.ma_can_ho=l.ma_can_ho JOIN nguoi_dung u ON u.ma_nguoi_dung=l.ma_nguoi_ghi_nhan WHERE l.ma_cu_dan=? ORDER BY l.tu_ngay DESC,l.ma_lich_su_cu_tru DESC`,
    [id],
  );
  return {
    ...resident,
    history,
    tai_khoan_can_ho:
      (
        await rows(
          pool,
          "SELECT ma_can_ho_thanh_toan,ten_dang_nhap,dang_hoat_dong FROM nguoi_dung WHERE ma_cu_dan_phu_trach=?",
          [id],
        )
      )[0] || null,
  };
}
export async function saveResident(id, body, user, connection = null) {
  const values = valid.resident(body);
  const initialStay = id ? null : valid.stay(body);
  return transaction(async (db) => {
    let previousAccount = null,
      previousPhone = null,
      credentials = null;
    if (id) {
      const current = await one(db, "cu_dan", "ma_cu_dan", id, true);
      version(current, body.phien_ban);
      previousAccount = current.ma_nguoi_dung;
      previousPhone = current.so_dien_thoai;
    }
    await checkAccount(db, values[2], previousAccount);
    if (id) {
      await rows(
        db,
        "UPDATE cu_dan SET ho_va_ten=?,so_dien_thoai=?,ma_nguoi_dung=?,phien_ban=phien_ban+1 WHERE ma_cu_dan=?",
        [...values, id],
      );
      if (previousPhone !== values[1]) await ownerPhoneChanged(db, id, user);
    } else {
      const apartment = await lockApartment(db, initialStay[0]);
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
      if (initialStay[1] === "CHU_HO")
        credentials = await assignHouseholder(
          db,
          apartment,
          id,
          user,
          body.xac_nhan_ban_giao,
        );
    }
    return {
      ...(await one(db, "cu_dan", "ma_cu_dan", id)),
      tai_khoan_can_ho: credentials,
    };
  }, connection);
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
    for (const apartmentId of [
      ...new Set([current?.ma_can_ho, next?.[0]].filter(Boolean)),
    ].sort((a, b) => a - b))
      await lockApartment(db, apartmentId);
    const vehicles = current
      ? await finishStayVehicles(
          db,
          current.ma_lich_su_cu_tru,
          day,
          user.ma_nguoi_dung,
          action === "chuyen_can" ? "Chuyển căn" : "Chuyển đi",
        )
      : [];
    if (current) await releaseHouseholder(db, current.ma_can_ho, id, user);
    if (current)
      await rows(
        db,
        "UPDATE lich_su_cu_tru SET den_ngay=? WHERE ma_lich_su_cu_tru=?",
        [day, current.ma_lich_su_cu_tru],
      );
    let credentials = null;
    if (next) {
      const inserted = await rows(
        db,
        "INSERT INTO lich_su_cu_tru (ma_cu_dan,ma_can_ho,quan_he,tu_ngay,ma_nguoi_ghi_nhan) VALUES (?,?,?,?,?)",
        [id, ...next, user.ma_nguoi_dung],
      );
      if (next[1] === "CHU_HO")
        credentials = await assignHouseholder(
          db,
          await one(db, "can_ho", "ma_can_ho", next[0]),
          id,
          user,
          body.xac_nhan_ban_giao,
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
    return {
      ma_cu_dan: id,
      phien_ban: resident.phien_ban + 1,
      tai_khoan_can_ho: credentials,
    };
  });
}
