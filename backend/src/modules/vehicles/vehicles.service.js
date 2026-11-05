import { reportPage } from "../report-exports/report-files.js";
import { randomBytes } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, integer, text } from "../../lib/http.js";
import { date } from "../residency/residency.validation.js";
import * as valid from "./vehicles.validation.js";
import {
  lockApartment,
  assertVehiclePeriodOpen,
} from "../billing/billing.guards.js";

const joins = `FROM phuong_tien v JOIN cu_dan c ON c.ma_cu_dan=v.ma_cu_dan JOIN can_ho a ON a.ma_can_ho=v.ma_can_ho`;
const columns = `v.*,c.ho_va_ten,c.so_dien_thoai,a.so_can_ho`;
async function residentLock(db, id) {
  const [resident] = await rows(
    db,
    "SELECT ma_cu_dan FROM cu_dan WHERE ma_cu_dan=? FOR UPDATE",
    [id],
  );
  if (!resident) fail(404, "NOT_FOUND", "Không tìm thấy cư dân.");
}
export async function list(query, exportFormat = null) {
  const q = query.q ? text(query.q, "q", 1, 100) : "";
  const { page, offset, limit, check } = reportPage(query, exportFormat);
  if (page < 1 || page > 100000)
    fail(422, "INVALID_PAGE", "Trang không hợp lệ.");
  const where = [
    "(v.ma_dang_ky LIKE ? OR v.bien_so LIKE ? OR c.ho_va_ten LIKE ? OR c.so_dien_thoai LIKE ? OR a.so_can_ho LIKE ?)",
  ];
  const values = [
    `%${q}%`,
    `%${q.toUpperCase().replace(/[\s.-]/g, "")}%`,
    `%${q}%`,
    `%${q}%`,
    `%${q}%`,
  ];
  if (query.loai_xe) {
    where.push("v.loai_xe=?");
    values.push(choice(query.loai_xe, "loai_xe", valid.types));
  }
  if (query.trang_thai) {
    choice(query.trang_thai, "trang_thai", ["DANG_GUI", "DA_KET_THUC"]);
    where.push(
      query.trang_thai === "DANG_GUI"
        ? "v.ngay_ket_thuc IS NULL"
        : "v.ngay_ket_thuc IS NOT NULL",
    );
  }
  for (const key of ["ma_cu_dan", "ma_can_ho"])
    if (query[key]) {
      where.push(`v.${key}=?`);
      values.push(integer(query[key], key));
    }
  const condition = `WHERE ${where.join(" AND ")}`;
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total ${joins} ${condition}`,
    values,
  );
  check(count.total);
  const data = await rows(
    pool,
    `SELECT ${columns} ${joins} ${condition} ORDER BY v.ma_phuong_tien DESC LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return { data, total: count.total, page };
}
export async function detail(id) {
  const [record] = await rows(
    pool,
    `SELECT ${columns},l.tu_ngay,l.den_ngay,u.ho_va_ten AS nguoi_tao,k.ho_va_ten AS nguoi_ket_thuc,p.ma_dang_ky AS dang_ky_truoc ${joins} JOIN lich_su_cu_tru l ON l.ma_lich_su_cu_tru=v.ma_lich_su_cu_tru JOIN nguoi_dung u ON u.ma_nguoi_dung=v.ma_nguoi_tao LEFT JOIN nguoi_dung k ON k.ma_nguoi_dung=v.ma_nguoi_ket_thuc LEFT JOIN phuong_tien p ON p.ma_phuong_tien=v.ma_dang_ky_truoc WHERE v.ma_phuong_tien=?`,
    [id],
  );
  if (!record) fail(404, "NOT_FOUND", "Không tìm thấy đăng ký xe.");
  return record;
}
async function insert(db, record, stay, userId, previous = null) {
  const result = await rows(
    db,
    `INSERT INTO phuong_tien (ma_dang_ky,ma_cu_dan,ma_can_ho,ma_lich_su_cu_tru,ma_dang_ky_truoc,loai_xe,bien_so,hang_xe,mau_sac,ngay_dang_ky,ma_nguoi_tao) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      `XE-${randomBytes(6).toString("hex").toUpperCase()}`,
      record.ma_cu_dan,
      stay.ma_can_ho,
      stay.ma_lich_su_cu_tru,
      previous,
      record.loai_xe,
      record.bien_so,
      record.hang_xe,
      record.mau_sac,
      record.ngay_dang_ky,
      userId,
    ],
  );
  return { ma_phuong_tien: result.insertId };
}
export async function create(body, user, connection = null) {
  const data = valid.registration(body);
  return transaction(async (db) => {
    await residentLock(db, data.ma_cu_dan);
    const [stay] = await rows(
      db,
      "SELECT * FROM lich_su_cu_tru WHERE ma_cu_dan=? AND den_ngay IS NULL FOR UPDATE",
      [data.ma_cu_dan],
    );
    if (!stay)
      fail(422, "NO_ACTIVE_STAY", "Cư dân đã chuyển đi, chưa thể đăng ký xe.");
    if (stay.ma_lich_su_cu_tru !== data.ma_lich_su_cu_tru)
      fail(
        409,
        "STALE_RESIDENCY",
        "Cư dân đã đổi đợt cư trú. Hãy tải lại và chọn lại cư dân.",
      );
    if (
      body.ma_can_ho !== undefined &&
      integer(body.ma_can_ho, "ma_can_ho") !== stay.ma_can_ho
    )
      fail(
        422,
        "APARTMENT_MISMATCH",
        "Căn chịu phí phải là căn cư dân đang ở.",
      );
    if (data.ngay_dang_ky < stay.tu_ngay)
      fail(
        422,
        "INVALID_START_DATE",
        "Ngày đăng ký xe không được trước ngày bắt đầu đợt cư trú.",
      );
    await assertVehiclePeriodOpen(db, stay.ma_can_ho, data.ngay_dang_ky);
    if (data.bien_so) {
      const conflicts = await rows(
        db,
        `SELECT ma_phuong_tien FROM phuong_tien WHERE bien_so=? AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc>?) AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc>ngay_dang_ky) FOR UPDATE`,
        [data.bien_so, data.ngay_dang_ky],
      );
      if (conflicts.length)
        fail(
          409,
          "PLATE_IN_USE",
          "Biển số đã có đăng ký đang gửi hoặc thời gian đăng ký chồng nhau.",
        );
    }
    return insert(db, data, stay, user.ma_nguoi_dung);
  }, connection);
}
export async function end(id, body, user) {
  const day = date(body.ngay_ket_thuc),
    reason = text(body.ly_do_ket_thuc, "ly_do_ket_thuc", 3, 255);
  const expectedVersion = integer(body.phien_ban, "phien_ban");
  return transaction(async (db) => {
    const [owner] = await rows(
      db,
      "SELECT ma_cu_dan,ma_can_ho FROM phuong_tien WHERE ma_phuong_tien=?",
      [id],
    );
    if (!owner) fail(404, "NOT_FOUND", "Không tìm thấy đăng ký xe.");
    // All writes lock resident -> stay/vehicle, matching the residency transfer order.
    await residentLock(db, owner.ma_cu_dan);
    await lockApartment(db, owner.ma_can_ho);
    const [record] = await rows(
      db,
      "SELECT * FROM phuong_tien WHERE ma_phuong_tien=? FOR UPDATE",
      [id],
    );
    if (record.ngay_ket_thuc) {
      if (record.ngay_ket_thuc === day) return { ma_phuong_tien: id };
      fail(
        409,
        "ALREADY_ENDED",
        "Đăng ký đã kết thúc. Không sửa lịch sử đăng ký cũ.",
      );
    }
    if (record.phien_ban !== expectedVersion)
      fail(409, "STALE_VERSION", "Đăng ký đã thay đổi. Hãy tải lại.");
    if (day < record.ngay_dang_ky)
      fail(
        422,
        "INVALID_END_DATE",
        "Ngày kết thúc không được trước ngày đăng ký xe.",
      );
    await assertVehiclePeriodOpen(db, record.ma_can_ho, day);
    await rows(
      db,
      "UPDATE phuong_tien SET ngay_ket_thuc=?,ly_do_ket_thuc=?,ma_nguoi_ket_thuc=?,phien_ban=phien_ban+1 WHERE ma_phuong_tien=?",
      [day, reason, user.ma_nguoi_dung, id],
    );
    return { ma_phuong_tien: id };
  });
}

// Called inside the residency transaction, after its resident row is locked.
export async function finishStayVehicles(db, stayId, day, userId, reason) {
  const [stay] = await rows(
    db,
    "SELECT ma_can_ho FROM lich_su_cu_tru WHERE ma_lich_su_cu_tru=?",
    [stayId],
  );
  await lockApartment(db, stay.ma_can_ho);
  const records = await rows(
    db,
    "SELECT * FROM phuong_tien WHERE ma_lich_su_cu_tru=? ORDER BY ma_phuong_tien FOR UPDATE",
    [stayId],
  );
  if (
    records.some(
      (v) => v.ngay_dang_ky > day || (v.ngay_ket_thuc && v.ngay_ket_thuc > day),
    )
  )
    fail(
      422,
      "VEHICLE_DATE_CONFLICT",
      "Ngày chuyển không được trước ngày đăng ký hoặc kết thúc xe trong đợt cư trú này.",
    );
  const active = records.filter((v) => !v.ngay_ket_thuc);
  if (active.length) await assertVehiclePeriodOpen(db, stay.ma_can_ho, day);
  await rows(
    db,
    "UPDATE phuong_tien SET ngay_ket_thuc=?,ly_do_ket_thuc=?,ma_nguoi_ket_thuc=?,phien_ban=phien_ban+1 WHERE ma_lich_su_cu_tru=? AND ngay_ket_thuc IS NULL",
    [day, reason, userId, stayId],
  );
  return active;
}
export async function carryStayVehicles(db, records, stay, day, userId) {
  if (records.length) await assertVehiclePeriodOpen(db, stay.ma_can_ho, day);
  for (const record of records)
    await insert(
      db,
      { ...record, ngay_dang_ky: day },
      stay,
      userId,
      record.ma_phuong_tien,
    );
}
