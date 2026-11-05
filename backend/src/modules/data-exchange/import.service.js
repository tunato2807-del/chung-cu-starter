import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { pool, rows } from "../../lib/db.js";
import { fail, phone, text } from "../../lib/http.js";
import { saveApartment, saveResident } from "../residency/residency.service.js";
import { create as createVehicle } from "../vehicles/vehicles.service.js";
import { saveMeter } from "../billing/billing.service.js";
import { createEquipment } from "../maintenance/maintenance.service.js";
import { requestKey } from "../maintenance/maintenance.validation.js";
import { parseFile } from "./import-files.js";

// Preview tokens expire on restart and after 15 minutes. No uploaded file is kept on disk.
const signingKey = randomBytes(32);
function signature(payload) {
  return createHmac("sha256", signingKey).update(payload).digest("base64url");
}
function tokenFor(kind, sha, user) {
  const payload = Buffer.from(
    JSON.stringify({
      kind,
      sha,
      actor: user.ma_nguoi_dung,
      version: user.phien_ban_token,
      expires: Date.now() + 900000,
    }),
  ).toString("base64url");
  return `${payload}.${signature(payload)}`;
}
function verify(token, kind, sha, user) {
  const [payload = "", mac = ""] =
    typeof token === "string" ? token.split(".") : [];
  const expected = signature(payload);
  const actualBytes = Buffer.from(mac),
    expectedBytes = Buffer.from(expected);
  if (
    actualBytes.length !== expectedBytes.length ||
    !timingSafeEqual(actualBytes, expectedBytes)
  )
    fail(
      409,
      "PREVIEW_REQUIRED",
      "Hãy xem trước đúng tệp trước khi xác nhận nhập.",
    );
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    fail(409, "PREVIEW_REQUIRED", "Hãy xem trước lại tệp.");
  }
  if (
    data.kind !== kind ||
    data.sha !== sha ||
    data.actor !== user.ma_nguoi_dung ||
    data.version !== user.phien_ban_token ||
    data.expires < Date.now()
  )
    fail(
      409,
      "PREVIEW_EXPIRED",
      "Tệp, phiên đăng nhập đã thay đổi hoặc bản xem trước hết hạn. Hãy xem trước lại.",
    );
}
function bool(value, key) {
  if (value !== "0" && value !== "1")
    fail(422, "INVALID_BOOLEAN", `${key}: nhập 1 hoặc 0.`);
  return value === "1";
}
async function apartment(db, value) {
  const code = text(value, "so_can_ho", 1, 20);
  const [record] = await rows(
    db,
    "SELECT ma_can_ho FROM can_ho WHERE so_can_ho=? FOR UPDATE",
    [code],
  );
  if (!record)
    fail(422, "APARTMENT_NOT_FOUND", `Chưa có căn ${code}. Nhập căn hộ trước.`);
  return record.ma_can_ho;
}
async function write(db, kind, input, user) {
  const body = { ...input };
  if (kind === "can_ho") {
    body.tinh_phi_dich_vu = bool(body.tinh_phi_dich_vu, "tinh_phi_dich_vu");
    return saveApartment(null, body, user, db);
  }
  if (kind === "cu_dan") {
    body.so_dien_thoai = phone(body.so_dien_thoai);
    const existing = await rows(
      db,
      "SELECT ma_cu_dan FROM cu_dan WHERE so_dien_thoai=? LIMIT 1 FOR UPDATE",
      [body.so_dien_thoai],
    );
    if (existing.length)
      fail(
        409,
        "RESIDENT_EXISTS",
        "Số điện thoại đã có hồ sơ cư dân. Dùng màn cư trú để chuyển/nhập căn.",
      );
    body.ma_can_ho = await apartment(db, body.so_can_ho);
    return saveResident(null, body, user, db);
  }
  if (kind === "phuong_tien") {
    // Match the normal resident -> stay -> apartment write lock order.
    const residentId =
      typeof body.ma_cu_dan === "string" ? body.ma_cu_dan.trim() : "";
    if (!/^\d{1,10}$/.test(residentId) || Number(residentId) === 0)
      fail(
        422,
        "INVALID_RESIDENT",
        "Mã cư dân phải là số. Mở Cư dân và sao chép mã của người đang ở đúng căn; thay THAY_MA_CU_DAN_1/2 bằng mã đó, không dùng tên tài khoản CH...",
      );
    await rows(
      db,
      "SELECT ma_cu_dan FROM cu_dan WHERE ma_cu_dan=? FOR UPDATE",
      [residentId],
    );
    const [stay] = await rows(
      db,
      "SELECT ma_lich_su_cu_tru FROM lich_su_cu_tru WHERE ma_cu_dan=? AND den_ngay IS NULL FOR UPDATE",
      [residentId],
    );
    if (!stay)
      fail(422, "NO_ACTIVE_STAY", "Cư dân không có đợt cư trú đang mở.");
    body.ma_lich_su_cu_tru = stay.ma_lich_su_cu_tru;
    body.ma_can_ho = await apartment(db, body.so_can_ho);
    return createVehicle(body, user, db);
  }
  if (kind === "chi_so") {
    body.ma_can_ho = await apartment(db, body.so_can_ho);
    body.ky_dau = bool(body.ky_dau, "ky_dau");
    const existing = await rows(
      db,
      "SELECT ma_chi_so_dich_vu FROM chi_so_dich_vu WHERE ma_can_ho=? AND loai_dich_vu=? AND ky_thanh_toan=? FOR UPDATE",
      [body.ma_can_ho, body.loai_dich_vu, body.ky_thanh_toan],
    );
    if (existing.length)
      fail(
        409,
        "METER_EXISTS",
        "Chỉ số kỳ này đã có. Dùng màn chỉ số để sửa có kiểm tra phiên bản.",
      );
    return saveMeter(body, user, db);
  }
  return createEquipment(body, user, db);
}
async function actor(db, user) {
  const found = await rows(
    db,
    "SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_nguoi_dung=? AND vai_tro='QUAN_TRI_VIEN' AND dang_hoat_dong=1 AND phien_ban_token=? FOR SHARE",
    [user.ma_nguoi_dung, user.phien_ban_token],
  );
  if (!found.length)
    fail(
      401,
      "SESSION_EXPIRED",
      "Phiên đã hết hạn. Đăng nhập lại trước khi nhập dữ liệu.",
    );
}
function rowError(error) {
  if (["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"].includes(error.code))
    throw error;
  if (error.code === "ER_DUP_ENTRY")
    return "Dữ liệu trùng với hệ thống hoặc dòng trước trong tệp.";
  if (error.status && error.status < 500)
    return [
      error.message,
      ...Object.entries(error.field_errors || {}).map(([k, v]) => `${k}: ${v}`),
    ].join(" ");
  throw error;
}
export async function importFile(kind, file, body, user, commit = false) {
  const records = await parseFile(file, kind),
    sha = createHash("sha256").update(file.buffer).digest("hex");
  const key = commit ? requestKey(body.khoa_yeu_cau) : null;
  if (commit) verify(body.xac_nhan, kind, sha, user);
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    if (commit) {
      // Unique keys serialize duplicate requests, including retries on another server.
      const existing = await rows(
        db,
        "SELECT * FROM dot_nhap_du_lieu WHERE ma_nguoi_nhap=? AND (khoa_yeu_cau=? OR (phan_he=? AND sha256=?)) FOR UPDATE",
        [user.ma_nguoi_dung, key, kind, sha],
      );
      if (existing.length) {
        if (existing.some((r) => r.phan_he !== kind || r.sha256 !== sha))
          fail(
            409,
            "IMPORT_KEY_CONFLICT",
            "Mã yêu cầu đã dùng với tệp khác. Xem trước lại.",
          );
        await actor(db, user);
        return {
          ...JSON.parse(
            typeof existing[0].ket_qua === "string"
              ? existing[0].ket_qua
              : JSON.stringify(existing[0].ket_qua),
          ),
          da_nhap_truoc: true,
          tai_khoan_moi: [],
        };
      }
      // Store only a non-secret result. Plaintext temporary passwords are returned once.
      await rows(
        db,
        "INSERT INTO dot_nhap_du_lieu (ma_nguoi_nhap,khoa_yeu_cau,phan_he,sha256,so_dong,ket_qua) VALUES (?,?,?,?,?,?)",
        [user.ma_nguoi_dung, key, kind, sha, records.length, "{}"],
      );
    }
    const preview = [],
      results = [],
      credentials = [];
    for (const record of records) {
      await db.query("SAVEPOINT import_row");
      try {
        if (record.error) fail(422, "INVALID_CELL", record.error);
        const result = await write(db, kind, record.values, user);
        preview.push({ ...record, error: null });
        const idKey = {
          can_ho: "ma_can_ho",
          cu_dan: "ma_cu_dan",
          phuong_tien: "ma_phuong_tien",
          chi_so: "ma_chi_so_dich_vu",
          thiet_bi: "ma_thiet_bi",
        }[kind];
        results.push({ dong: record.line, [idKey]: result[idKey] });
        if (commit && result.tai_khoan_can_ho?.mat_khau_tam_thoi)
          credentials.push({ dong: record.line, ...result.tai_khoan_can_ho });
      } catch (error) {
        const message = rowError(error);
        await db.query("ROLLBACK TO SAVEPOINT import_row");
        preview.push({ ...record, error: message });
      }
    }
    await actor(db, user);
    const errors = preview.filter((r) => r.error).length;
    if (!commit)
      return {
        rows: preview,
        total: records.length,
        errors,
        xac_nhan: errors ? null : tokenFor(kind, sha, user),
      };
    if (errors)
      fail(
        409,
        "IMPORT_CHANGED",
        "Chưa lưu dòng nào. Có dữ liệu không hợp lệ hoặc hệ thống đã thay đổi. Xem trước lại để kiểm tra từng dòng.",
      );
    const result = { so_dong: results.length, ket_qua: results };
    await rows(
      db,
      "UPDATE dot_nhap_du_lieu SET ket_qua=? WHERE ma_nguoi_nhap=? AND khoa_yeu_cau=?",
      [JSON.stringify(result), user.ma_nguoi_dung, key],
    );
    await db.commit();
    return { ...result, tai_khoan_moi: credentials };
  } finally {
    // Preview, replay, errors and disconnected requests never leave partial writes.
    try {
      await db.rollback();
    } finally {
      db.release();
    }
  }
}
