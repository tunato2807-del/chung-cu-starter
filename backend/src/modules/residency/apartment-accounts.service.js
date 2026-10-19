import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, integer } from "../../lib/http.js";
import { lockApartment } from "../billing/billing.guards.js";

const columns =
  "u.ma_nguoi_dung,u.ten_dang_nhap,u.ma_can_ho_thanh_toan,u.ma_cu_dan_phu_trach,u.dang_hoat_dong,u.phien_ban_ban_giao,c.ho_va_ten AS nguoi_phu_trach,c.so_dien_thoai AS dien_thoai_phu_trach";
export async function accountForApartment(id, db = pool) {
  const [account] = await rows(
    db,
    `SELECT ${columns} FROM nguoi_dung u LEFT JOIN cu_dan c ON c.ma_cu_dan=u.ma_cu_dan_phu_trach WHERE u.ma_can_ho_thanh_toan=?`,
    [id],
  );
  return account || null;
}
async function audit(db, apartmentId, old, next, actor, event) {
  await rows(
    db,
    "INSERT INTO lich_su_ban_giao_can_ho (ma_can_ho,ma_cu_dan_cu,ma_cu_dan_moi,ma_nguoi_thuc_hien,su_kien) VALUES (?,?,?,?,?)",
    [apartmentId, old, next, actor.ma_nguoi_dung, event],
  );
}
async function rotate(db, account, apartment, owner, actor, event) {
  const secret = randomBytes(18).toString("base64url");
  const changingOwner = owner !== account.ma_cu_dan_phu_trach;
  await rows(
    db,
    `UPDATE nguoi_dung SET mat_khau_ma_hoa=?,dang_hoat_dong=1,${changingOwner ? "ma_cu_dan_phu_trach=?," : ""}ho_va_ten=?,phien_ban_token=phien_ban_token+1,phien_ban_ban_giao=phien_ban_ban_giao+1,so_lan_dang_nhap_sai=0,khoa_den_luc=NULL WHERE ma_nguoi_dung=?`,
    [
      await bcrypt.hash(secret, 12),
      ...(changingOwner ? [owner] : []),
      `Tài khoản căn ${apartment.so_can_ho}`,
      account.ma_nguoi_dung,
    ],
  );
  await audit(
    db,
    apartment.ma_can_ho,
    account.ma_cu_dan_phu_trach,
    owner,
    actor,
    event,
  );
  return {
    ...(await accountForApartment(apartment.ma_can_ho, db)),
    mat_khau_tam_thoi: secret,
  };
}
// Caller holds the apartment lock; generated credentials are returned once only.
export async function ensureApartmentAccount(db, apartment, actor) {
  const [existing] = await rows(
    db,
    "SELECT * FROM nguoi_dung WHERE ma_can_ho_thanh_toan=? FOR UPDATE",
    [apartment.ma_can_ho],
  );
  if (existing) return { account: existing, credentials: null };
  const username = `CH${String(apartment.ma_can_ho).padStart(6, "0")}`;
  const secret = randomBytes(18).toString("base64url");
  const r = await rows(
    db,
    "INSERT INTO nguoi_dung (ho_va_ten,ten_dang_nhap,so_dien_thoai,vai_tro,mat_khau_ma_hoa,ma_can_ho_thanh_toan) VALUES (?,?,NULL,'CU_DAN',?,?)",
    [
      `Tài khoản căn ${apartment.so_can_ho}`,
      username,
      await bcrypt.hash(secret, 12),
      apartment.ma_can_ho,
    ],
  );
  await audit(db, apartment.ma_can_ho, null, null, actor, "TAO_TAI_KHOAN");
  const [account] = await rows(
    db,
    "SELECT * FROM nguoi_dung WHERE ma_nguoi_dung=?",
    [r.insertId],
  );
  return {
    account,
    credentials: {
      ...(await accountForApartment(apartment.ma_can_ho, db)),
      mat_khau_tam_thoi: secret,
    },
  };
}
export async function assignHouseholder(
  db,
  apartment,
  residentId,
  actor,
  confirmed = false,
) {
  const { account } = await ensureApartmentAccount(db, apartment, actor);
  if (account.ma_cu_dan_phu_trach === residentId) return null;
  if (account.ma_cu_dan_phu_trach !== null && confirmed !== true)
    fail(
      409,
      "HANDOVER_REQUIRED",
      "Căn đã có người phụ trách thanh toán. Chọn xác nhận bàn giao tài khoản cho chủ hộ mới.",
    );
  return rotate(db, account, apartment, residentId, actor, "BAN_GIAO_CHU_HO");
}
export async function releaseHouseholder(db, apartmentId, residentId, actor) {
  const [account] = await rows(
    db,
    "SELECT * FROM nguoi_dung WHERE ma_can_ho_thanh_toan=? FOR UPDATE",
    [apartmentId],
  );
  if (!account || account.ma_cu_dan_phu_trach !== residentId) return;
  await rows(
    db,
    "UPDATE nguoi_dung SET ma_cu_dan_phu_trach=NULL,dang_hoat_dong=0,phien_ban_token=phien_ban_token+1,phien_ban_ban_giao=phien_ban_ban_giao+1 WHERE ma_nguoi_dung=?",
    [account.ma_nguoi_dung],
  );
  await audit(db, apartmentId, residentId, null, actor, "NGUNG_PHU_TRACH");
}
export async function manageApartmentAccount(id, body, actor) {
  return transaction(async (db) => {
    // Match residency's resident -> apartment -> account lock order. Only the
    // new owner needs a resident FK lock; audit IDs are immutable snapshots.
    const residentId =
      body.thao_tac === "ban_giao"
        ? integer(body.ma_cu_dan, "ma_cu_dan")
        : null;
    if (residentId !== null)
      await rows(
        db,
        "SELECT ma_cu_dan FROM cu_dan WHERE ma_cu_dan=? FOR UPDATE",
        [residentId],
      );
    const apartment = await lockApartment(db, id);
    const { account } = await ensureApartmentAccount(db, apartment, actor);
    if (
      integer(body.phien_ban_ban_giao, "phien_ban_ban_giao") !==
      account.phien_ban_ban_giao
    )
      fail(
        409,
        "STALE_VERSION",
        "Thông tin tài khoản đã thay đổi. Hãy tải lại.",
      );
    if (body.thao_tac === "cap_lai_mat_khau")
      return rotate(
        db,
        account,
        apartment,
        account.ma_cu_dan_phu_trach,
        actor,
        "CAP_LAI_MAT_KHAU",
      );
    if (body.thao_tac !== "ban_giao")
      fail(422, "INVALID_ACTION", "Thao tác tài khoản không hợp lệ.");
    // All stay changes lock this apartment before mutation. Read after that lock,
    // without taking resident locks in the reverse order of the residency flow.
    const [owner] = await rows(
      db,
      "SELECT ma_cu_dan FROM lich_su_cu_tru WHERE ma_cu_dan=? AND ma_can_ho=? AND quan_he='CHU_HO' AND den_ngay IS NULL",
      [residentId, id],
    );
    if (!owner)
      fail(
        422,
        "NOT_HOUSEHOLDER",
        "Chỉ bàn giao cho cư dân đang là chủ hộ của căn này.",
      );
    if (account.ma_cu_dan_phu_trach === residentId)
      fail(
        409,
        "ALREADY_RESPONSIBLE",
        "Cư dân này đã phụ trách. Dùng Cấp lại mật khẩu nếu cần.",
      );
    return assignHouseholder(
      db,
      apartment,
      residentId,
      actor,
      body.xac_nhan_ban_giao,
    );
  });
}
