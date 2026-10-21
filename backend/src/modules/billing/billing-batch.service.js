import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { pool, rows } from "../../lib/db.js";
import { fail, integer } from "../../lib/http.js";
import { period, monthDay, options } from "./billing.validation.js";
import { requestKey } from "../maintenance/maintenance.validation.js";
import { lockApartment } from "./billing.guards.js";
import { generate, prepareDraft } from "./billing.service.js";

const signingKey = randomBytes(32);
export const hash = (x) =>
  createHash("sha256").update(JSON.stringify(x)).digest("hex");
const mac = (s) =>
  createHmac("sha256", signingKey).update(s).digest("base64url");
function input(body) {
  const month = period(body.ky_thanh_toan);
  if (
    !Array.isArray(body.ma_can_ho) ||
    body.ma_can_ho.length < 1 ||
    body.ma_can_ho.length > 50
  )
    fail(422, "BATCH_SIZE", "Chọn từ 1 đến 50 căn hộ mỗi đợt.");
  const ids = body.ma_can_ho.map((id) => integer(id, "ma_can_ho"));
  if (ids.some((id) => id < 1) || new Set(ids).size !== ids.length)
    fail(422, "BATCH_APARTMENTS", "Mã căn phải hợp lệ và không lặp trong đợt.");
  return {
    ma_can_ho: ids.sort((a, b) => a - b),
    ky_thanh_toan: month,
    ngay_chot_phi: monthDay(body.ngay_chot_phi, month),
    ...options(body),
  };
}
export async function actor(db, user) {
  const found = await rows(
    db,
    "SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_nguoi_dung=? AND vai_tro='QUAN_TRI_VIEN' AND dang_hoat_dong=1 AND phien_ban_token=? FOR SHARE",
    [user.ma_nguoi_dung, user.phien_ban_token],
  );
  if (!found.length)
    fail(
      401,
      "SESSION_EXPIRED",
      "Phiên đã hết hạn. Đăng nhập lại trước khi xử lý hóa đơn.",
    );
}
export function tokenFor(bodyHash, quoteHash, user) {
  const payload = Buffer.from(
    JSON.stringify({
      bodyHash,
      quoteHash,
      actor: user.ma_nguoi_dung,
      version: user.phien_ban_token,
      expires: Date.now() + 900000,
    }),
  ).toString("base64url");
  return `${payload}.${mac(payload)}`;
}
export function verify(token, bodyHash, user) {
  const [payload, signature, extra] =
    typeof token === "string" ? token.split(".") : [];
  if (!payload || !signature || extra || token.length > 2000)
    fail(
      409,
      "PREVIEW_REQUIRED",
      "Hãy xem trước đợt hóa đơn trước khi xác nhận.",
    );
  const expected = Buffer.from(mac(payload)),
    actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
    fail(
      409,
      "PREVIEW_REQUIRED",
      "Bản xem trước không hợp lệ hoặc máy chủ đã khởi động lại. Hãy xem trước lại.",
    );
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    fail(409, "PREVIEW_REQUIRED", "Hãy xem trước lại đợt hóa đơn.");
  }
  if (
    data.bodyHash !== bodyHash ||
    data.actor !== user.ma_nguoi_dung ||
    data.version !== user.phien_ban_token ||
    data.expires < Date.now()
  )
    fail(
      409,
      "PREVIEW_EXPIRED",
      "Dữ liệu, phiên đăng nhập đã đổi hoặc bản xem trước quá 15 phút. Hãy xem trước lại.",
    );
  return data.quoteHash;
}
async function quote(db, body) {
  // Acquire every apartment in ascending order before taking shared fee-source locks.
  const apartments = [];
  for (const id of body.ma_can_ho) {
    try {
      apartments.push(await lockApartment(db, id));
    } catch (error) {
      if (error.code !== "NOT_FOUND") throw error;
      apartments.push({ ma_can_ho: id, so_can_ho: `#${id}`, missing: true });
    }
  }
  const result = [];
  for (const apartment of apartments) {
    const row = {
      ma_can_ho: apartment.ma_can_ho,
      so_can_ho: apartment.so_can_ho,
      khoi: apartment.khoi || "",
      tong_tien: "0",
      loi: [],
      chi_tiet: [],
    };
    try {
      if (apartment.missing) fail(404, "NOT_FOUND", "Không tìm thấy căn hộ.");
      const { snapshot } = await prepareDraft(db, apartment, body);
      row.tong_tien = snapshot.total;
      row.loi = snapshot.errors;
      row.chi_tiet = snapshot.lines;
    } catch (error) {
      if (!error.status || error.status >= 500) throw error;
      row.loi = [error.message];
    }
    result.push(row);
  }
  return result;
}
export async function batchBills(raw, user, commit = false) {
  const body = input(raw),
    bodyHash = hash(body),
    key = commit ? requestKey(raw.khoa_yeu_cau) : null;
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    let batchId;
    if (commit) {
      // The unique request row serializes retries, including requests on another server.
      await rows(
        db,
        "INSERT INTO dot_lap_hoa_don (ma_nguoi_lap,khoa_yeu_cau,dau_vao_sha256) VALUES (?,?,?) ON DUPLICATE KEY UPDATE khoa_yeu_cau=khoa_yeu_cau",
        [user.ma_nguoi_dung, key, bodyHash],
      );
      const [batch] = await rows(
        db,
        "SELECT * FROM dot_lap_hoa_don WHERE ma_nguoi_lap=? AND khoa_yeu_cau=? FOR UPDATE",
        [user.ma_nguoi_dung, key],
      );
      if (batch.dau_vao_sha256 !== bodyHash)
        fail(
          409,
          "BATCH_KEY_CONFLICT",
          "Mã yêu cầu đã dùng cho dữ liệu khác. Hãy xem trước một đợt mới.",
        );
      batchId = batch.ma_dot_lap;
      if (batch.ket_qua !== null) {
        await actor(db, user);
        const result =
          typeof batch.ket_qua === "string"
            ? JSON.parse(batch.ket_qua)
            : batch.ket_qua;
        return { ...result, da_lap_truoc: true };
      }
    }
    const expected = commit ? verify(raw.xac_nhan, bodyHash, user) : null;
    const preview = await quote(db, body);
    const errors = preview.filter((r) => r.loi.length).length;
    await actor(db, user);
    if (!commit)
      return {
        rows: preview,
        so_can: preview.length,
        so_can_loi: errors,
        tong_tien: preview
          .filter((r) => !r.loi.length)
          .reduce((n, r) => n + BigInt(r.tong_tien), 0n)
          .toString(),
        xac_nhan: errors ? null : tokenFor(bodyHash, hash(preview), user),
      };
    if (errors || hash(preview) !== expected)
      fail(
        409,
        "BATCH_CHANGED",
        "Chưa tạo hóa đơn nào. Đơn giá, chỉ số, xe hoặc hóa đơn đã thay đổi. Hãy xem trước lại từng căn.",
      );
    const invoices = [];
    for (const row of preview) {
      const result = await generate(
        { ...body, ma_can_ho: row.ma_can_ho },
        user,
        db,
      );
      invoices.push({
        ma_can_ho: row.ma_can_ho,
        so_can_ho: row.so_can_ho,
        ...result,
        tong_tien: row.tong_tien,
      });
    }
    await actor(db, user);
    const result = {
      ma_dot_lap: batchId,
      so_hoa_don: invoices.length,
      tong_tien: preview
        .reduce((n, r) => n + BigInt(r.tong_tien), 0n)
        .toString(),
      hoa_don: invoices,
    };
    await rows(db, "UPDATE dot_lap_hoa_don SET ket_qua=? WHERE ma_dot_lap=?", [
      JSON.stringify(result),
      batchId,
    ]);
    await db.commit();
    return { ...result, da_lap_truoc: false };
  } finally {
    try {
      await db.rollback();
    } finally {
      db.release();
    }
  }
}
