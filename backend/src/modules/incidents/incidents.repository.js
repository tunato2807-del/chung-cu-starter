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
