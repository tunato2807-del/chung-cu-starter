import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, integer, text } from "../../lib/http.js";
import { pagination, today } from "../billing/billing.validation.js";
import { lockApartment } from "../billing/billing.guards.js";

const missing = () => fail(404, "NOT_FOUND", "Không tìm thấy thông báo.");
function checkVersion(row, value) {
  if (row.phien_ban !== integer(value, "phien_ban"))
    fail(409, "STALE_VERSION", "Thông báo đã thay đổi. Hãy tải lại trang.");
}
async function audit(db, id, actor, event, note = null) {
  await rows(
    db,
    "INSERT INTO lich_su_thong_bao (ma_thong_bao,ma_nguoi_thuc_hien,su_kien,ghi_chu) VALUES (?,?,?,?)",
    [id, actor.ma_nguoi_dung, event, note],
  );
}
function content(body) {
  const scope = choice(body.pham_vi, "pham_vi", ["TOAN_BO", "KHOI", "CAN_HO"]);
  return [
    text(body.tieu_de, "tieu_de", 3, 160),
    text(body.noi_dung, "noi_dung", 3, 6000),
    scope,
    scope === "KHOI" ? text(body.khoi, "khoi", 1, 10) : null,
    scope === "CAN_HO" ? integer(body.ma_can_ho, "ma_can_ho") : null,
    choice(body.muc_do, "muc_do", ["THUONG", "QUAN_TRONG"]),
  ];
}
async function validateTarget(db, fields) {
  if (fields[2] === "CAN_HO") await lockApartment(db, fields[4]);
  if (fields[2] === "KHOI") {
    const result = await rows(
      db,
      "SELECT ma_can_ho FROM can_ho WHERE khoi=? LIMIT 1",
      [fields[3]],
    );
    if (!result.length)
      fail(422, "INVALID_BLOCK", "Chưa có căn hộ thuộc khối đã chọn.");
  }
}
export async function create(body, actor) {
  const fields = content(body);
  return transaction(async (db) => {
    await validateTarget(db, fields);
    const result = await rows(
      db,
      "INSERT INTO thong_bao (tieu_de,noi_dung,pham_vi,khoi,ma_can_ho,muc_do,ma_nguoi_tao) VALUES (?,?,?,?,?,?,?)",
      [...fields, actor.ma_nguoi_dung],
    );
    await audit(db, result.insertId, actor, "TAO_NHAP");
    return { ma_thong_bao: result.insertId };
  });
}
export async function change(id, action, body, actor) {
  // Target validation precedes notification lock, matching apartment -> bill -> notification order.
  const fields = action === "sua" ? content(body) : null;
  return transaction(async (db) => {
    if (fields) await validateTarget(db, fields);
    const [n] = await rows(
      db,
      "SELECT * FROM thong_bao WHERE ma_thong_bao=? FOR UPDATE",
      [id],
    );
    if (!n) missing();
    checkVersion(n, body.phien_ban);
    if (action === "thu_hoi") {
      if (n.trang_thai === "THU_HOI")
        fail(409, "INVALID_STATE", "Thông báo đã được thu hồi.");
      const reason = text(body.ly_do, "ly_do", 3, 255);
      await rows(
        db,
        "UPDATE thong_bao SET trang_thai='THU_HOI',ma_nguoi_thu_hoi=?,ngay_thu_hoi=UTC_TIMESTAMP(6),ly_do_thu_hoi=?,phien_ban=phien_ban+1 WHERE ma_thong_bao=?",
        [actor.ma_nguoi_dung, reason, id],
      );
      await audit(db, id, actor, "THU_HOI", reason);
    } else {
      if (n.trang_thai !== "NHAP" || n.loai !== "THONG_BAO")
        fail(
          409,
          "INVALID_STATE",
          "Chỉ sửa hoặc phát hành thông báo đang ở bản nháp.",
        );
      if (action === "sua") {
        await rows(
          db,
          "UPDATE thong_bao SET tieu_de=?,noi_dung=?,pham_vi=?,khoi=?,ma_can_ho=?,muc_do=?,phien_ban=phien_ban+1 WHERE ma_thong_bao=?",
          [...fields, id],
        );
        await audit(db, id, actor, "SUA_NHAP");
      } else {
        await rows(
          db,
          "UPDATE thong_bao SET trang_thai='DA_GUI',ma_nguoi_gui=?,ngay_gui=UTC_TIMESTAMP(6),phien_ban=phien_ban+1 WHERE ma_thong_bao=?",
          [actor.ma_nguoi_dung, id],
        );
        await audit(db, id, actor, "PHAT_HANH");
      }
    }
    return { ma_thong_bao: id };
  });
}
const adminFrom =
  "FROM thong_bao n LEFT JOIN can_ho a ON a.ma_can_ho=n.ma_can_ho LEFT JOIN hoa_don h ON h.ma_hoa_don=n.ma_hoa_don";
// Evaluate residence, custody, token version and read scope together, on every query.
const inboxFrom = `FROM thong_bao n
 JOIN nguoi_dung u ON u.ma_nguoi_dung=? AND u.dang_hoat_dong=1 AND u.phien_ban_token=?
 LEFT JOIN cu_dan c ON c.ma_nguoi_dung=u.ma_nguoi_dung
 LEFT JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan AND l.den_ngay IS NULL
 JOIN can_ho a ON a.ma_can_ho=COALESCE(u.ma_can_ho_thanh_toan,l.ma_can_ho)
 LEFT JOIN nguoi_dung payer ON payer.ma_can_ho_thanh_toan=a.ma_can_ho
 LEFT JOIN hoa_don h ON h.ma_hoa_don=n.ma_hoa_don
 LEFT JOIN thong_bao_da_doc r ON r.ma_thong_bao=n.ma_thong_bao AND r.ma_nguoi_dung=u.ma_nguoi_dung
 AND r.nguoi_tiep_nhan=IF(u.ma_can_ho_thanh_toan IS NULL,0,COALESCE(u.ma_cu_dan_phu_trach,0))`;
const visible = `n.trang_thai='DA_GUI'
 AND (n.pham_vi='TOAN_BO' OR (n.pham_vi='KHOI' AND n.khoi=a.khoi) OR (n.pham_vi='CAN_HO' AND n.ma_can_ho=a.ma_can_ho))
 AND (n.loai='THONG_BAO' OR ((payer.ma_nguoi_dung=u.ma_nguoi_dung OR (payer.ma_cu_dan_phu_trach=c.ma_cu_dan AND l.tu_ngay<=h.ngay_chot_phi)) AND h.trang_thai IN ('DA_GUI','DA_THANH_TOAN')))`;
const unread =
  "r.ma_thong_bao IS NULL AND (n.loai='THONG_BAO' OR h.trang_thai='DA_GUI')";
const select = `n.ma_thong_bao,n.loai,n.tieu_de,n.pham_vi,n.khoi,n.ma_can_ho,n.muc_do,n.trang_thai,n.phien_ban,n.ngay_tao,n.ngay_gui,n.ma_hoa_don,h.trang_thai AS trang_thai_hoa_don,a.so_can_ho`;
const receiptSelect = `r.ngay_doc,(${unread}) AS chua_doc`;
export async function list(query, actor, personal = false) {
  const { page, offset } = pagination(query),
    args = personal ? [actor.ma_nguoi_dung, actor.phien_ban_token] : [],
    clauses = [personal ? visible : "1=1"];
  if (query.q) {
    clauses.push("n.tieu_de LIKE ?");
    args.push(`%${text(query.q, "q", 1, 100)}%`);
  }
  if (query.loai) {
    clauses.push("n.loai=?");
    args.push(choice(query.loai, "loai", ["THONG_BAO", "NHAC_PHI"]));
  }
  if (!personal && query.trang_thai) {
    clauses.push("n.trang_thai=?");
    args.push(
      choice(query.trang_thai, "trang_thai", ["NHAP", "DA_GUI", "THU_HOI"]),
    );
  }
  if (personal && query.chua_doc === "1") clauses.push(unread);
  const from = personal ? inboxFrom : adminFrom,
    where = clauses.join(" AND ");
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total ${from} WHERE ${where}`,
    args,
  );
  const data = await rows(
    pool,
    `SELECT ${select},LEFT(n.noi_dung,180) AS tom_tat${personal ? `,${receiptSelect}` : ""} ${from} WHERE ${where} ORDER BY COALESCE(n.ngay_gui,n.ngay_tao) DESC,n.ma_thong_bao DESC LIMIT 20 OFFSET ${offset}`,
    args,
  );
  return { data, total: count.total, page };
}
export async function unreadCount(actor) {
  const [result] = await rows(
    pool,
    `SELECT COUNT(*) AS so_chua_doc ${inboxFrom} WHERE ${visible} AND ${unread}`,
    [actor.ma_nguoi_dung, actor.phien_ban_token],
  );
  return result;
}
export async function detail(id, actor, personal = false) {
  const [n] = await rows(
    pool,
    `SELECT ${select},n.noi_dung,n.ly_do_thu_hoi,n.ngay_thu_hoi${personal ? `,${receiptSelect}` : ""} ${personal ? inboxFrom : adminFrom} WHERE n.ma_thong_bao=?${personal ? ` AND ${visible}` : ""}`,
    personal ? [actor.ma_nguoi_dung, actor.phien_ban_token, id] : [id],
  );
  if (!n) missing();
  if (!personal)
    n.history = await rows(
      pool,
      "SELECT s.*,u.ho_va_ten FROM lich_su_thong_bao s JOIN nguoi_dung u ON u.ma_nguoi_dung=s.ma_nguoi_thuc_hien WHERE s.ma_thong_bao=? ORDER BY s.ma_lich_su",
      [id],
    );
  return n;
}
export async function markRead(id, actor) {
  return transaction(async (db) => {
    // Freeze this account's recipient scope while inserting its receipt.
    const [u] = await rows(
      db,
      "SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_nguoi_dung=? AND dang_hoat_dong=1 AND phien_ban_token=? FOR UPDATE",
      [actor.ma_nguoi_dung, actor.phien_ban_token],
    );
    if (!u)
      fail(401, "SESSION_EXPIRED", "Phiên đã hết hạn. Vui lòng đăng nhập lại.");
    const [n] = await rows(
      db,
      `SELECT IF(u.ma_can_ho_thanh_toan IS NULL,0,COALESCE(u.ma_cu_dan_phu_trach,0)) AS recipient ${inboxFrom} WHERE n.ma_thong_bao=? AND ${visible}`,
      [actor.ma_nguoi_dung, actor.phien_ban_token, id],
    );
    if (!n) missing();
    await rows(
      db,
      "INSERT IGNORE INTO thong_bao_da_doc (ma_thong_bao,ma_nguoi_dung,nguoi_tiep_nhan) VALUES (?,?,?)",
      [id, actor.ma_nguoi_dung, n.recipient],
    );
    return { ma_thong_bao: id, da_doc: true };
  });
}
export async function remindBill(id, body, actor) {
  return transaction(async (db) => {
    const [hint] = await rows(
      db,
      "SELECT ma_can_ho FROM hoa_don WHERE ma_hoa_don=?",
      [id],
    );
    if (!hint) fail(404, "NOT_FOUND", "Không tìm thấy hóa đơn.");
    const apartment = await lockApartment(db, hint.ma_can_ho);
    const [b] = await rows(
      db,
      "SELECT * FROM hoa_don WHERE ma_hoa_don=? FOR UPDATE",
      [id],
    );
    if (b.trang_thai !== "DA_GUI")
      fail(
        409,
        "INVALID_STATE",
        "Chỉ nhắc phí hóa đơn đã gửi và chưa thanh toán.",
      );
    if (b.phien_ban !== integer(body.phien_ban, "phien_ban"))
      fail(409, "STALE_VERSION", "Hóa đơn đã thay đổi. Hãy tải lại.");
    const day = today();
    const [existing] = await rows(
      db,
      "SELECT ma_thong_bao FROM thong_bao WHERE ma_hoa_don=? AND ngay_nhac=? FOR UPDATE",
      [id, day],
    );
    if (existing) return { ...existing, da_ton_tai: true };
    const title = `Nhắc thanh toán hóa đơn ${b.so_hoa_don}`;
    const bodyText = `Căn ${apartment.so_can_ho} · Kỳ ${b.ky_thanh_toan}\nSố tiền cần thanh toán: ${BigInt(b.tong_tien).toLocaleString("vi-VN")} đồng.\nHạn thanh toán: ${b.han_thanh_toan}.\nVui lòng mở hóa đơn để kiểm tra thông tin và mã QR chuyển khoản. Nếu đã chuyển tiền, hãy liên hệ ban quản lý để đối soát.`;
    const result = await rows(
      db,
      "INSERT INTO thong_bao (loai,tieu_de,noi_dung,pham_vi,ma_can_ho,muc_do,trang_thai,ma_hoa_don,ngay_nhac,ma_nguoi_tao,ma_nguoi_gui,ngay_gui) VALUES ('NHAC_PHI',?,?,'CAN_HO',?,'QUAN_TRONG','DA_GUI',?,?,?,?,UTC_TIMESTAMP(6))",
      [
        title,
        bodyText,
        b.ma_can_ho,
        id,
        day,
        actor.ma_nguoi_dung,
        actor.ma_nguoi_dung,
      ],
    );
    await audit(db, result.insertId, actor, "NHAC_PHI", b.so_hoa_don);
    return { ma_thong_bao: result.insertId, da_ton_tai: false };
  });
}
