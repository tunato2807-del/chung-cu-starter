import { reportPage } from "../report-exports/report-files.js";
import { createHash } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, integer, text } from "../../lib/http.js";
import * as v from "./amenities.validation.js";
const active = "('CHO_DUYET','DA_DUYET')";
const missing = () =>
  fail(404, "NOT_FOUND", "Không tìm thấy lịch đặt hoặc tiện ích.");
async function actor(db, user) {
  const [u] = await rows(
    db,
    "SELECT * FROM nguoi_dung WHERE ma_nguoi_dung=? AND dang_hoat_dong=1 AND vai_tro=? AND phien_ban_token=? FOR SHARE",
    [user.ma_nguoi_dung, user.vai_tro, user.phien_ban_token],
  );
  if (!u)
    fail(401, "SESSION_EXPIRED", "Phiên đã hết hạn. Vui lòng đăng nhập lại.");
  return u;
}
const contextFrom = `FROM nguoi_dung u
 JOIN cu_dan c ON (u.ma_can_ho_thanh_toan IS NULL AND c.ma_nguoi_dung=u.ma_nguoi_dung) OR (u.ma_can_ho_thanh_toan IS NOT NULL AND c.ma_cu_dan=u.ma_cu_dan_phu_trach)
 JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan AND l.den_ngay IS NULL
 JOIN can_ho a ON a.ma_can_ho=l.ma_can_ho
 WHERE u.ma_nguoi_dung=? AND u.dang_hoat_dong=1 AND u.phien_ban_token=?
 AND (u.ma_can_ho_thanh_toan IS NULL OR (u.ma_can_ho_thanh_toan=a.ma_can_ho AND l.quan_he='CHU_HO'))`;
export async function context(user) {
  const [c] = await rows(
    pool,
    `SELECT c.ma_cu_dan,c.ho_va_ten,l.ma_lich_su_cu_tru,a.ma_can_ho,a.so_can_ho,a.khoi ${contextFrom}`,
    [user.ma_nguoi_dung, user.phien_ban_token],
  );
  return c || null;
}
// Same order as residency/handover: resident -> apartment -> amenity -> booking -> account.
// A resident row freezes the current stay while residency writes wait on that row.
async function lockContext(db, user) {
  const [hint] = await rows(db, `SELECT c.ma_cu_dan ${contextFrom}`, [
    user.ma_nguoi_dung,
    user.phien_ban_token,
  ]);
  if (!hint)
    fail(
      403,
      "NO_RESIDENCE",
      "Cần hồ sơ cư trú hiện tại; tài khoản căn hộ cần chủ hộ đang phụ trách. Liên hệ BQL để liên kết.",
    );
  const [c] = await rows(
    db,
    "SELECT * FROM cu_dan WHERE ma_cu_dan=? FOR UPDATE",
    [hint.ma_cu_dan],
  );
  const [l] = await rows(
    db,
    "SELECT * FROM lich_su_cu_tru WHERE ma_cu_dan=? AND den_ngay IS NULL FOR UPDATE",
    [hint.ma_cu_dan],
  );
  if (!l)
    fail(
      409,
      "RESIDENCE_CHANGED",
      "Thông tin cư trú đã thay đổi. Hãy tải lại trang.",
    );
  const [a] = await rows(
    db,
    "SELECT ma_can_ho,so_can_ho FROM can_ho WHERE ma_can_ho=? FOR UPDATE",
    [l.ma_can_ho],
  );
  return { ...c, ...l, so_can_ho: a.so_can_ho };
}
function confirmContext(c, u) {
  const valid = u.ma_can_ho_thanh_toan
    ? u.ma_can_ho_thanh_toan === c.ma_can_ho &&
      u.ma_cu_dan_phu_trach === c.ma_cu_dan &&
      c.quan_he === "CHU_HO"
    : c.ma_nguoi_dung === u.ma_nguoi_dung;
  if (!valid)
    fail(
      409,
      "RESIDENCE_CHANGED",
      "Người phụ trách hoặc hồ sơ cư trú đã đổi. Hãy đăng nhập lại.",
    );
}
async function lockedFacility(db, id) {
  const [f] = await rows(
    db,
    "SELECT * FROM tien_ich WHERE ma_tien_ich=? FOR UPDATE",
    [id],
  );
  if (!f) missing();
  return f;
}
const fields =
  "ten_tien_ich,vi_tri,mo_ta,suc_chua,gio_mo,gio_dong,toi_da_phut,dat_truoc_ngay,dang_mo";
export async function facilities(query) {
  const { page, offset } = v.pagination(query),
    args = [],
    where = ["1=1"];
  if (query.q) {
    where.push("(ten_tien_ich LIKE ? OR vi_tri LIKE ?)");
    const q = `%${text(query.q, "q", 1, 100)}%`;
    args.push(q, q);
  }
  if (query.dang_mo) {
    if (!["0", "1"].includes(query.dang_mo))
      fail(422, "VALIDATION", "Trạng thái không hợp lệ.");
    where.push("dang_mo=?");
    args.push(Number(query.dang_mo));
  }
  const clause = where.join(" AND ");
  const [n] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM tien_ich WHERE ${clause}`,
    args,
  );
  const data = await rows(
    pool,
    `SELECT ma_tien_ich,${fields},phien_ban FROM tien_ich WHERE ${clause} ORDER BY dang_mo DESC,ma_tien_ich DESC LIMIT 20 OFFSET ${offset}`,
    args,
  );
  return { data, total: n.total, page };
}
export async function facilityDetail(id) {
  const [f] = await rows(
    pool,
    `SELECT ma_tien_ich,${fields},phien_ban FROM tien_ich WHERE ma_tien_ich=?`,
    [id],
  );
  if (!f) missing();
  return f;
}
export async function saveFacility(id, body, user) {
  const data = v.facility(body);
  return transaction(async (db) => {
    if (id) {
      const old = await lockedFacility(db, id);
      await actor(db, user);
      v.version(old, body.phien_ban);
      // Pausing stops new reservations; existing reservations remain valid.
      // Policy edits may not invalidate any live future reservation, including pending ones.
      const conflicts = await rows(
        db,
        `SELECT ma_dat_lich FROM dat_lich_tien_ich WHERE ma_tien_ich=? AND trang_thai IN ${active} AND ket_thuc>? AND (so_nguoi>? OR TIME(bat_dau)<? OR TIME(ket_thuc)>? OR TIMESTAMPDIFF(MINUTE,bat_dau,ket_thuc)>?) LIMIT 1 FOR UPDATE`,
        [
          id,
          v.nowVN(),
          data.suc_chua,
          data.gio_mo,
          data.gio_dong,
          data.toi_da_phut,
        ],
      );
      if (conflicts.length)
        fail(
          409,
          "EXISTING_BOOKINGS",
          "Cấu hình mới ảnh hưởng lịch đang giữ chỗ. Xử lý các lịch đó trước khi đổi.",
        );
      await rows(
        db,
        `UPDATE tien_ich SET ${Object.keys(data)
          .map((k) => `${k}=?`)
          .join(",")},phien_ban=phien_ban+1 WHERE ma_tien_ich=?`,
        [...Object.values(data), id],
      );
    } else {
      await actor(db, user);
      const r = await rows(
        db,
        `INSERT INTO tien_ich (${fields},ma_nguoi_tao) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [...Object.values(data), user.ma_nguoi_dung],
      );
      id = r.insertId;
    }
    return { ma_tien_ich: id };
  });
}
export async function calendar(id, query) {
  const f = await facilityDetail(id),
    day = v.calendarDay(query.ngay),
    now = v.nowVN();
  if (day < now.slice(0, 10) || day > v.addDays(now.slice(0, 10), 90))
    fail(
      422,
      "CALENDAR_RANGE",
      "Lịch trống chỉ tra cứu từ hôm nay đến 90 ngày tới.",
    );
  const busy = await rows(
    pool,
    `SELECT bat_dau,ket_thuc FROM dat_lich_tien_ich WHERE ma_tien_ich=? AND trang_thai IN ${active} AND bat_dau>=? AND bat_dau<? ORDER BY bat_dau`,
    [id, `${day} 00:00:00`, `${v.addDays(day, 1)} 00:00:00`],
  );
  const slots = [];
  const label = (m) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  for (let m = v.minutes(f.gio_mo); m < v.minutes(f.gio_dong); m += 30) {
    const start = `${day} ${label(m)}:00`,
      end = `${day} ${label(m + 30)}:00`;
    slots.push({
      gio_bat_dau: label(m),
      gio_ket_thuc: label(m + 30),
      da_dat: busy.some((b) => b.bat_dau < end && b.ket_thuc > start),
      co_the_dat:
        !!f.dang_mo &&
        start > now &&
        day <= v.addDays(now.slice(0, 10), f.dat_truoc_ngay),
    });
  }
  // Aggregate occupancy only: no other apartment, applicant, notes or booking identifiers.
  return { ngay: day, slots };
}
export async function createBooking(id, body, user) {
  const data = v.booking(body),
    key = v.key(body.khoa_yeu_cau),
    policyVersion = integer(body.phien_ban_tien_ich, "phien_ban_tien_ich");
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({ id, user: user.ma_nguoi_dung, policyVersion, ...data }),
    )
    .digest("hex");
  return transaction(async (db) => {
    const c = await lockContext(db, user),
      f = await lockedFacility(db, id),
      u = await actor(db, user);
    confirmContext(c, u);
    const [prior] = await rows(
      db,
      "SELECT ma_dat_lich,van_tay FROM dat_lich_tien_ich WHERE khoa_yeu_cau=? FOR UPDATE",
      [key],
    );
    if (prior) {
      if (prior.van_tay !== fingerprint)
        fail(
          409,
          "REQUEST_KEY_REUSED",
          "Mã yêu cầu đã được dùng cho thông tin khác. Hãy mở lại biểu mẫu.",
        );
      return { ma_dat_lich: prior.ma_dat_lich, replay: true };
    }
    v.version(f, policyVersion);
    v.checkBooking(f, data);
    // Parent-row mutex serializes every create/decision/cancel/policy edit for this amenity.
    // Locking reads see committed writes after a waiter acquires that mutex.
    const clash = await rows(
      db,
      `SELECT ma_dat_lich FROM dat_lich_tien_ich WHERE ma_tien_ich=? AND trang_thai IN ${active} AND bat_dau<? AND ket_thuc>? LIMIT 1 FOR UPDATE`,
      [id, data.ket_thuc, data.bat_dau],
    );
    if (clash.length)
      fail(
        409,
        "BOOKING_CONFLICT",
        "Khung giờ này đã có người giữ chỗ. Hãy tải lại lịch trống và chọn giờ khác.",
      );
    const r = await rows(
      db,
      `INSERT INTO dat_lich_tien_ich (ma_tien_ich,ma_can_ho,ma_nguoi_dat,ma_cu_dan,ma_lich_su_cu_tru,ten_tien_ich,vi_tri,ten_nguoi_dat,bat_dau,ket_thuc,so_nguoi,ghi_chu,khoa_yeu_cau,van_tay) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        c.ma_can_ho,
        u.ma_nguoi_dung,
        c.ma_cu_dan,
        c.ma_lich_su_cu_tru,
        f.ten_tien_ich,
        f.vi_tri,
        c.ho_va_ten,
        ...Object.values(data),
        key,
        fingerprint,
      ],
    );
    await audit(db, r.insertId, user, "DAT_LICH", data.ghi_chu);
    return { ma_dat_lich: r.insertId, replay: false };
  });
}
async function audit(db, id, user, event, note) {
  await rows(
    db,
    "INSERT INTO lich_su_dat_lich (ma_dat_lich,ma_nguoi_thuc_hien,su_kien,ghi_chu) VALUES (?,?,?,?)",
    [id, user.ma_nguoi_dung, event, note],
  );
}
// Personal accounts retain read access to their own history after moving. Fixed accounts
// read apartment history only while their custodian is a current householder there.
function scope(user, args) {
  args.push(user.ma_nguoi_dung, user.phien_ban_token);
  return `EXISTS (SELECT 1 FROM nguoi_dung u WHERE u.ma_nguoi_dung=? AND u.dang_hoat_dong=1 AND u.phien_ban_token=? AND ((u.ma_can_ho_thanh_toan IS NULL AND b.ma_nguoi_dat=u.ma_nguoi_dung) OR (u.ma_can_ho_thanh_toan=b.ma_can_ho AND EXISTS (SELECT 1 FROM lich_su_cu_tru l WHERE l.ma_cu_dan=u.ma_cu_dan_phu_trach AND l.ma_can_ho=b.ma_can_ho AND l.den_ngay IS NULL AND l.quan_he='CHU_HO'))))`;
}
const selection = `b.ma_dat_lich,b.ma_tien_ich,b.ma_can_ho,b.ma_nguoi_dat,b.ten_tien_ich,b.vi_tri,b.ten_nguoi_dat,b.bat_dau,b.ket_thuc,b.so_nguoi,b.ghi_chu,b.trang_thai,b.phien_ban,b.ngay_tao,a.so_can_ho,a.khoi`;
export async function bookings(query, user, exportFormat = null) {
  const { page, offset, limit, check } = reportPage(query, exportFormat),
    args = [],
    where = ["1=1"];
  if (user.vai_tro !== "QUAN_TRI_VIEN") where.push(scope(user, args));
  if (query.ma_tien_ich) {
    where.push("b.ma_tien_ich=?");
    args.push(v.positive(query.ma_tien_ich, "ma_tien_ich"));
  }
  if (query.trang_thai) {
    where.push("b.trang_thai=?");
    args.push(v.state(query.trang_thai));
  }
  if (query.ngay) {
    where.push("b.bat_dau>=? AND b.bat_dau<?");
    const d = v.calendarDay(query.ngay);
    args.push(`${d} 00:00:00`, `${v.addDays(d, 1)} 00:00:00`);
  }
  if (query.q) {
    where.push(
      "(a.so_can_ho LIKE ? OR b.ten_tien_ich LIKE ? OR b.ten_nguoi_dat LIKE ?)",
    );
    const q = `%${text(query.q, "q", 1, 100)}%`;
    args.push(q, q, q);
  }
  const from = `FROM dat_lich_tien_ich b JOIN can_ho a ON a.ma_can_ho=b.ma_can_ho WHERE ${where.join(" AND ")}`;
  const [n] = await rows(pool, `SELECT COUNT(*) AS total ${from}`, args);
  check(n.total);
  const data = await rows(
    pool,
    `SELECT ${selection} ${from} ORDER BY b.bat_dau DESC,b.ma_dat_lich DESC LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    args,
  );
  check(data.length);
  return { data, total: n.total, page };
}
export async function bookingDetail(id, user) {
  const args = [id],
    own = user.vai_tro !== "QUAN_TRI_VIEN" ? ` AND ${scope(user, args)}` : "";
  const [b] = await rows(
    pool,
    `SELECT ${selection} FROM dat_lich_tien_ich b JOIN can_ho a ON a.ma_can_ho=b.ma_can_ho WHERE b.ma_dat_lich=?${own}`,
    args,
  );
  if (!b) missing();
  b.history = await rows(
    pool,
    "SELECT h.ma_lich_su,h.su_kien,h.ghi_chu,h.ngay_tao,u.ho_va_ten FROM lich_su_dat_lich h JOIN nguoi_dung u ON u.ma_nguoi_dung=h.ma_nguoi_thuc_hien WHERE h.ma_dat_lich=? ORDER BY h.ma_lich_su",
    [id],
  );
  const c = user.vai_tro === "CU_DAN" ? await context(user) : null;
  b.co_the_huy =
    activeState(b) &&
    b.bat_dau > v.nowVN() &&
    (user.vai_tro === "QUAN_TRI_VIEN" ||
      !!(
        c &&
        c.ma_can_ho === b.ma_can_ho &&
        (user.ma_can_ho_thanh_toan ||
          (b.ma_nguoi_dat === user.ma_nguoi_dung &&
            (
              await rows(
                pool,
                "SELECT ma_dat_lich FROM dat_lich_tien_ich WHERE ma_dat_lich=? AND ma_lich_su_cu_tru=?",
                [id, c.ma_lich_su_cu_tru],
              )
            ).length))
      ));
  return b;
}
function activeState(b) {
  return ["CHO_DUYET", "DA_DUYET"].includes(b.trang_thai);
}
export async function act(id, action, body, user) {
  return transaction(async (db) => {
    const c = user.vai_tro === "CU_DAN" ? await lockContext(db, user) : null;
    const [hint] = await rows(
      db,
      "SELECT ma_tien_ich FROM dat_lich_tien_ich WHERE ma_dat_lich=?",
      [id],
    );
    if (!hint) missing();
    await lockedFacility(db, hint.ma_tien_ich);
    const [b] = await rows(
      db,
      "SELECT * FROM dat_lich_tien_ich WHERE ma_dat_lich=? FOR UPDATE",
      [id],
    );
    if (!b) missing();
    const u = await actor(db, user);
    if (c) {
      confirmContext(c, u);
      if (
        action !== "huy" ||
        c.ma_can_ho !== b.ma_can_ho ||
        (!u.ma_can_ho_thanh_toan &&
          (b.ma_nguoi_dat !== u.ma_nguoi_dung ||
            b.ma_lich_su_cu_tru !== c.ma_lich_su_cu_tru))
      )
        missing();
    }
    v.version(b, body.phien_ban);
    if (b.bat_dau <= v.nowVN())
      fail(
        409,
        "BOOKING_STARTED",
        "Lịch đã tới giờ bắt đầu; không thể duyệt, từ chối hoặc hủy nữa.",
      );
    if (!activeState(b) || (action !== "huy" && b.trang_thai !== "CHO_DUYET"))
      fail(
        409,
        "INVALID_STATE",
        "Lịch không còn ở trạng thái cho phép thao tác này.",
      );
    const note = text(
      body.ghi_chu || "",
      "ghi_chu",
      action === "duyet" ? 0 : 5,
      1000,
    );
    const state = { duyet: "DA_DUYET", tu_choi: "TU_CHOI", huy: "DA_HUY" }[
      action
    ];
    if (!state) fail(422, "INVALID_ACTION", "Thao tác không hợp lệ.");
    await rows(
      db,
      "UPDATE dat_lich_tien_ich SET trang_thai=?,phien_ban=phien_ban+1 WHERE ma_dat_lich=?",
      [state, id],
    );
    await audit(db, id, user, action.toUpperCase(), note);
    return { ma_dat_lich: id };
  });
}
