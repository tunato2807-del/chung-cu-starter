import { pool, rows } from "../../lib/db.js";
export const publicColumns =
  "ma_nguoi_dung, ho_va_ten, so_dien_thoai, vai_tro, chuyen_mon, dang_hoat_dong, phien_ban_token";
export async function findUser(id, db = pool) {
  return (
    await rows(
      db,
      `SELECT ${publicColumns} FROM nguoi_dung WHERE ma_nguoi_dung=?`,
      [id],
    )
  )[0];
}
export async function listUsers() {
  return rows(
    pool,
    `SELECT ${publicColumns} FROM nguoi_dung ORDER BY ma_nguoi_dung LIMIT 200`,
  );
}
