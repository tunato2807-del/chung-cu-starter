import { pool, rows } from "../../lib/db.js";
import { choice, fail, integer } from "../../lib/http.js";
import { requestKey } from "../maintenance/maintenance.validation.js";
import { lockApartment } from "./billing.guards.js";
import {
  action,
  prepareBillAction,
  paymentDetails,
} from "./billing.service.js";
import { hash, actor, tokenFor, verify } from "./billing-batch.service.js";

function input(raw) {
  const operation = choice(raw.thao_tac, "thao_tac", ["DUYET", "GUI"]);
  if (
    !Array.isArray(raw.hoa_don) ||
    !raw.hoa_don.length ||
    raw.hoa_don.length > 50
  )
    fail(422, "BATCH_SIZE", "Chọn từ 1 đến 50 hóa đơn mỗi đợt.");
  const invoices = raw.hoa_don.map((bill) => ({
    ma_hoa_don: integer(bill?.ma_hoa_don, "ma_hoa_don"),
    phien_ban: integer(bill?.phien_ban, "phien_ban"),
  }));
  if (
    invoices.some((b) => b.ma_hoa_don < 1) ||
    new Set(invoices.map((b) => b.ma_hoa_don)).size !== invoices.length
  )
    fail(422, "BATCH_INVOICES", "Mã hóa đơn phải hợp lệ và không lặp.");
  // Relative due-date checks happen in prepareBillAction; old successful requests remain replayable.
  return {
    thao_tac: operation,
    hoa_don: invoices.sort((a, b) => a.ma_hoa_don - b.ma_hoa_don),
    ...(operation === "GUI" ? paymentDetails(raw, "1900-01-01", false) : {}),
  };
}
async function quote(db, body) {
  const ids = body.hoa_don.map((b) => b.ma_hoa_don),
    placeholders = ids.map(() => "?").join(",");
  const hints = await rows(
    db,
    `SELECT ma_hoa_don,ma_can_ho FROM hoa_don WHERE ma_hoa_don IN (${placeholders})`,
    ids,
  );
  const apartments = new Map();
  for (const id of [...new Set(hints.map((b) => b.ma_can_ho))].sort(
    (a, b) => a - b,
  ))
    apartments.set(id, await lockApartment(db, id));
  const bills = await rows(
    db,
    `SELECT * FROM hoa_don WHERE ma_hoa_don IN (${placeholders}) ORDER BY ma_can_ho,ma_hoa_don FOR UPDATE`,
    ids,
  );
  const result = [];
  for (const requested of body.hoa_don) {
    const bill = bills.find((b) => b.ma_hoa_don === requested.ma_hoa_don),
      apartment = bill && apartments.get(bill.ma_can_ho);
    const row = {
      ma_hoa_don: requested.ma_hoa_don,
      so_hoa_don: bill?.so_hoa_don || `#${requested.ma_hoa_don}`,
      so_can_ho: apartment?.so_can_ho || "—",
      ky_thanh_toan: bill?.ky_thanh_toan || "",
      tong_tien: bill?.tong_tien || "0",
      trang_thai: bill?.trang_thai || "",
      phien_ban: bill?.phien_ban ?? null,
      dau_van_tay: bill?.dau_van_tay || "",
      loi: [],
    };
    try {
      if (!bill || !apartment)
        fail(404, "NOT_FOUND", "Không tìm thấy hóa đơn.");
      await prepareBillAction(
        db,
        bill,
        apartment,
        body.thao_tac.toLowerCase(),
        { ...body, phien_ban: requested.phien_ban },
      );
    } catch (error) {
      if (!error.status || error.status >= 500) throw error;
      row.loi = [error.message];
    }
    result.push(row);
  }
  return result;
}
export async function batchBillActions(raw, user, commit = false) {
  const body = input(raw),
    bodyHash = hash(body),
    key = commit ? requestKey(raw.khoa_yeu_cau) : null;
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    let batchId;
    if (commit) {
      await rows(
        db,
        "INSERT INTO dot_xu_ly_hoa_don (ma_nguoi_thuc_hien,khoa_yeu_cau,thao_tac,dau_vao_sha256) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE khoa_yeu_cau=khoa_yeu_cau",
        [user.ma_nguoi_dung, key, body.thao_tac, bodyHash],
      );
      const [record] = await rows(
        db,
        "SELECT * FROM dot_xu_ly_hoa_don WHERE ma_nguoi_thuc_hien=? AND khoa_yeu_cau=? FOR UPDATE",
        [user.ma_nguoi_dung, key],
      );
      if (record.dau_vao_sha256 !== bodyHash)
        fail(
          409,
          "BATCH_KEY_CONFLICT",
          "Mã yêu cầu đã dùng với thao tác hoặc dữ liệu khác. Xem trước một đợt mới.",
        );
      batchId = record.ma_dot_xu_ly;
      if (record.ket_qua !== null) {
        await actor(db, user);
        return {
          ...(typeof record.ket_qua === "string"
            ? JSON.parse(record.ket_qua)
            : record.ket_qua),
          da_xu_ly_truoc: true,
        };
      }
    }
    const expected = commit ? verify(raw.xac_nhan, bodyHash, user) : null;
    const preview = await quote(db, body),
      errors = preview.filter((r) => r.loi.length).length;
    await actor(db, user);
    const total = preview
      .filter((r) => !r.loi.length)
      .reduce((n, r) => n + BigInt(r.tong_tien), 0n)
      .toString();
    if (!commit)
      return {
        thao_tac: body.thao_tac,
        rows: preview.map(({ dau_van_tay, ...r }) => r),
        so_hoa_don: preview.length,
        so_loi: errors,
        tong_tien: total,
        xac_nhan: errors ? null : tokenFor(bodyHash, hash(preview), user),
      };
    if (errors || hash(preview) !== expected)
      fail(
        409,
        "BATCH_CHANGED",
        "Chưa xử lý hóa đơn nào. Phiên bản, trạng thái hoặc dữ liệu nguồn đã đổi. Hãy chọn lại phiên bản mới và xem trước lại.",
      );
    for (const requested of body.hoa_don)
      await action(
        requested.ma_hoa_don,
        body.thao_tac.toLowerCase(),
        { ...body, phien_ban: requested.phien_ban },
        user,
        db,
      );
    await actor(db, user);
    const result = {
      ma_dot_xu_ly: batchId,
      thao_tac: body.thao_tac,
      so_hoa_don: preview.length,
      tong_tien: total,
      hoa_don: preview.map((r) => ({
        ma_hoa_don: r.ma_hoa_don,
        so_hoa_don: r.so_hoa_don,
        so_can_ho: r.so_can_ho,
        tong_tien: r.tong_tien,
        trang_thai_luc_xu_ly: body.thao_tac === "DUYET" ? "DA_DUYET" : "DA_GUI",
      })),
    };
    await rows(
      db,
      "UPDATE dot_xu_ly_hoa_don SET ket_qua=? WHERE ma_dot_xu_ly=?",
      [JSON.stringify(result), batchId],
    );
    await db.commit();
    return { ...result, da_xu_ly_truoc: false };
  } finally {
    try {
      await db.rollback();
    } finally {
      db.release();
    }
  }
}
