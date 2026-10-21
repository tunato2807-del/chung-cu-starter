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
