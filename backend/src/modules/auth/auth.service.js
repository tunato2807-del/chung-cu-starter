import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { transaction, rows } from "../../lib/db.js";
import { fail, phone, text, choice } from "../../lib/http.js";
import { findUser, publicColumns } from "./auth.repository.js";
const secret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new Error(
      "JWT_SECRET must be at least 32 characters. Run npm run init:local.",
    );
  return new TextEncoder().encode(process.env.JWT_SECRET);
};
const dummyHash = bcrypt.hashSync("dummy-password-never-used", 12);
export function password(value, field = "mat_khau") {
  // bcrypt only processes 72 bytes. Reject rather than silently truncate.
  if (
    typeof value !== "string" ||
    value.length < 10 ||
    Buffer.byteLength(value) > 72
  )
    fail(422, "VALIDATION", "Mật khẩu cần từ 10 ký tự và không quá 72 byte.", {
      [field]: "Cần từ 10 ký tự, tối đa 72 byte.",
    });
  return value;
}
export async function login(body) {
  const identifier = text(
    body.ten_dang_nhap ?? body.so_dien_thoai,
    "ten_dang_nhap",
    1,
    30,
  ).trim();
  const apartmentLogin = /^CH\d{6,10}$/i.test(identifier);
  const number = apartmentLogin ? identifier.toUpperCase() : phone(identifier);
  if (
    typeof body.mat_khau !== "string" ||
    Buffer.byteLength(body.mat_khau) > 72
  )
    fail(
      401,
      "LOGIN_FAILED",
      "Thông tin đăng nhập không đúng hoặc tài khoản tạm khóa.",
    );
  const user = await transaction(async (db) => {
    const [u] = await rows(
      db,
      `SELECT * FROM nguoi_dung WHERE ${apartmentLogin ? "ten_dang_nhap" : "so_dien_thoai"}=? FOR UPDATE`,
      [number],
    );
    const valid = await bcrypt.compare(
      body.mat_khau,
      u?.mat_khau_ma_hoa || dummyHash,
    );
    if (
      !u ||
      !u.dang_hoat_dong ||
      (u.khoa_den_luc && new Date(u.khoa_den_luc + "Z").getTime() > Date.now())
    )
      return null;
    if (!valid) {
      await rows(
        db,
        "UPDATE nguoi_dung SET so_lan_dang_nhap_sai=so_lan_dang_nhap_sai+1, khoa_den_luc=IF(so_lan_dang_nhap_sai>=5,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 15 MINUTE),NULL) WHERE ma_nguoi_dung=?",
        [u.ma_nguoi_dung],
      );
      return null;
    }
    await rows(
      db,
      "UPDATE nguoi_dung SET so_lan_dang_nhap_sai=0,khoa_den_luc=NULL WHERE ma_nguoi_dung=?",
      [u.ma_nguoi_dung],
    );
    return findUser(u.ma_nguoi_dung, db);
  });
  if (!user)
    fail(
      401,
      "LOGIN_FAILED",
      "Thông tin đăng nhập không đúng hoặc tài khoản tạm khóa.",
    );
  const token = await new SignJWT({ version: user.phien_ban_token })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.ma_nguoi_dung))
    .setIssuer("chung-cu")
    .setAudience("chung-cu-web")
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
  return { user, token };
}
export async function authenticate(token) {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
      issuer: "chung-cu",
      audience: "chung-cu-web",
    });
    if (!/^\d+$/.test(payload.sub)) return null;
    const u = await findUser(Number(payload.sub));
    return u?.dang_hoat_dong && u.phien_ban_token === payload.version
      ? u
      : null;
  } catch (error) {
    if (error.code?.startsWith("ERR_J")) return null;
    throw error;
  }
}
export async function changePassword(user, body) {
  const fresh = password(body.mat_khau_moi, "mat_khau_moi");
  if (
    typeof body.mat_khau_cu !== "string" ||
    Buffer.byteLength(body.mat_khau_cu) > 72
  )
    fail(422, "PASSWORD", "Mật khẩu hiện tại không đúng.");
  await transaction(async (db) => {
    const [u] = await rows(
      db,
      "SELECT * FROM nguoi_dung WHERE ma_nguoi_dung=? FOR UPDATE",
      [user.ma_nguoi_dung],
    );
    if (!(await bcrypt.compare(body.mat_khau_cu, u.mat_khau_ma_hoa)))
      fail(422, "PASSWORD", "Mật khẩu hiện tại không đúng.");
    await rows(
      db,
      "UPDATE nguoi_dung SET mat_khau_ma_hoa=?,phien_ban_token=phien_ban_token+1 WHERE ma_nguoi_dung=?",
      [await bcrypt.hash(fresh, 12), user.ma_nguoi_dung],
    );
  });
}
export async function createUser(body) {
  const name = text(body.ho_va_ten, "ho_va_ten", 2, 100),
    number = phone(body.so_dien_thoai);
  const role = choice(body.vai_tro, "vai_tro", ["KY_THUAT_VIEN", "CU_DAN"]);
  const hash = await bcrypt.hash(password(body.mat_khau), 12);
  return transaction(async (db) => {
    const r = await rows(
      db,
      "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,vai_tro,mat_khau_ma_hoa,chuyen_mon) VALUES (?,?,?,?,?)",
      [
        name,
        number,
        role,
        hash,
        text(body.chuyen_mon || "", "chuyen_mon", 0, 100),
      ],
    );
    return findUser(r.insertId, db);
  });
}
export async function setUserActive(actor, id, active) {
  if (id === actor.ma_nguoi_dung)
    fail(422, "SELF_LOCK", "Không thể tự khóa tài khoản.");
  if (typeof active !== "boolean")
    fail(422, "VALIDATION", "Trạng thái tài khoản không hợp lệ.");
  return transaction(async (db) => {
    const [user] = await rows(
      db,
      `SELECT ${publicColumns} FROM nguoi_dung WHERE ma_nguoi_dung=? FOR UPDATE`,
      [id],
    );
    if (!user) fail(404, "NOT_FOUND", "Không tìm thấy tài khoản.");
    if (user.ma_can_ho_thanh_toan !== null)
      fail(
        409,
        "APARTMENT_ACCOUNT",
        "Quản lý tài khoản thanh toán trong mục Căn hộ để cấp mật khẩu mới khi mở lại.",
      );
    if (user.vai_tro === "QUAN_TRI_VIEN")
      fail(403, "FORBIDDEN", "Không khóa tài khoản quản trị trong luồng này.");
    await rows(
      db,
      "UPDATE nguoi_dung SET dang_hoat_dong=?,phien_ban_token=phien_ban_token+1 WHERE ma_nguoi_dung=?",
      [active, id],
    );
    return findUser(id, db);
  });
}
