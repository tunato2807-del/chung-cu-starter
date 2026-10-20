import { createHash } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, text } from "../../lib/http.js";
import * as v from "./treasury.validation.js";
import { prepare } from "./treasury.proofs.js";
const missing = () =>
  fail(404, "NOT_FOUND", "Không tìm thấy quỹ, phiếu hoặc chứng từ.");
async function actor(db, user) {
  const [u] = await rows(
    db,
    "SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_nguoi_dung=? AND vai_tro='QUAN_TRI_VIEN' AND dang_hoat_dong=1 AND phien_ban_token=? FOR SHARE",
    [user.ma_nguoi_dung, user.phien_ban_token],
  );
  if (!u)
    fail(401, "SESSION_EXPIRED", "Phiên đã hết hạn. Vui lòng đăng nhập lại.");
}
async function snapshot(work) {
  const db = await pool.getConnection();
  try {
    await db.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await db.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
    const r = await work(db);
    await db.commit();
    return r;
  } catch (e) {
    await db.rollback();
    throw e;
  } finally {
    db.release();
  }
}
async function getFund(db, id, lock = false) {
  const [f] = await rows(
    db,
    `SELECT * FROM quy_tai_chinh WHERE ma_quy=?${lock ? " FOR UPDATE" : ""}`,
    [id],
  );
  if (!f) missing();
  return f;
}
function open(f) {
  if (!f.dang_hoat_dong)
    fail(409, "FUND_CLOSED", "Quỹ đang tạm ngừng lập và duyệt phiếu mới.");
}
const code = (p) =>
  `${p.loai === "THU" ? "PT" : "PC"}${String(p.ma_phieu).padStart(6, "0")}`;
// The receipt source is the existing immutable paid invoice, never a copied voucher.
// Fund IDs are validated internal integers; no user strings are interpolated here.
function source(id) {
  // Older installations can use a different utf8mb4 collation. Normalize text
  // in both sources instead of altering the existing financial tables.
  const u = (expression) =>
    `CONVERT(${expression} USING utf8mb4) COLLATE utf8mb4_unicode_ci`;
  const voucherCode =
    "CONCAT(IF(p.loai='THU','PT','PC'),LPAD(CAST(p.ma_phieu AS CHAR),GREATEST(6,CHAR_LENGTH(CAST(p.ma_phieu AS CHAR))),'0'))";
  return `(SELECT ${u("'PHIEU'")} AS nguon,p.ma_phieu AS ma_ban_ghi,p.ngay_hach_toan AS ngay,${u("p.loai")} AS loai,p.so_tien,${u("p.nhom")} AS nhom,${u("p.doi_tac")} AS doi_tac,${u("p.dien_giai")} AS dien_giai,p.ma_phieu_goc,${u(voucherCode)} AS so_chung_tu
    FROM phieu_thu_chi p WHERE p.ma_quy=${id} AND p.trang_thai='DA_GHI_SO'
    UNION ALL SELECT ${u("'HOA_DON'")},h.ma_hoa_don,DATE(CONVERT_TZ(h.ngay_thanh_toan,'+00:00','+07:00')),${u("'THU'")},h.so_tien_da_thu,${u("'THU_HOA_DON'")},${u("CONCAT('Căn ',a.so_can_ho)")},${u("CONCAT('Thu hóa đơn ',h.so_hoa_don,' · kỳ ',h.ky_thanh_toan)")},NULL,${u("h.so_hoa_don")}
    FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho JOIN quy_tai_chinh q ON q.ma_quy=${id} AND q.nhan_thu_hoa_don=1
    WHERE h.trang_thai='DA_THANH_TOAN' AND h.ngay_thanh_toan IS NOT NULL) s`;
}

async function balance(db, id) {
  const [r] = await rows(
    db,
    `SELECT CAST(COALESCE(SUM(IF(loai='THU',so_tien,-so_tien)),0) AS CHAR) AS so_du FROM ${source(id)} WHERE ngay<=?`,
    [v.today()],
  );
  return r.so_du;
}
export async function funds(query) {
  const { page, offset } = v.pagination(query),
    args = [],
    where = query.q ? "WHERE ten_quy LIKE ?" : "";
  if (query.q) args.push(`%${text(query.q, "q", 1, 100)}%`);
  const [n] = await rows(
      pool,
      `SELECT COUNT(*) AS total FROM quy_tai_chinh ${where}`,
      args,
    ),
    data = await rows(
      pool,
      `SELECT * FROM quy_tai_chinh ${where} ORDER BY nhan_thu_hoa_don DESC,ma_quy DESC LIMIT 20 OFFSET ${offset}`,
      args,
    );
  return { data, total: n.total, page };
}
export async function fundDetail(id) {
  return snapshot(async (db) => ({
    ...(await getFund(db, id)),
    so_du: await balance(db, id),
  }));
}
export async function saveFund(id, body, user) {
  const data = v.fund(body);
  return transaction(async (db) => {
    if (id) {
      const old = await getFund(db, id, true);
      await actor(db, user);
      v.version(old, body.phien_ban);
      if (old.nhan_thu_hoa_don && !data.dang_hoat_dong)
        fail(422, "INVOICE_FUND", "Quỹ nhận thu hóa đơn cần luôn hoạt động.");
      await rows(
        db,
        "UPDATE quy_tai_chinh SET ten_quy=?,mo_ta=?,dang_hoat_dong=?,phien_ban=phien_ban+1 WHERE ma_quy=?",
        [...Object.values(data), id],
      );
    } else {
      await actor(db, user);
      const r = await rows(
        db,
        "INSERT INTO quy_tai_chinh (ten_quy,mo_ta,dang_hoat_dong) VALUES (?,?,?)",
        Object.values(data),
      );
      id = r.insertId;
    }
    return { ma_quy: id };
  });
}
async function audit(db, id, user, event, note = "") {
  await rows(
    db,
    "INSERT INTO lich_su_thu_chi (ma_phieu,ma_nguoi_thuc_hien,su_kien,ghi_chu) VALUES (?,?,?,?)",
    [id, user.ma_nguoi_dung, event, note],
  );
}
// No non-locking read in the transaction before taking the fund mutex. In particular
// the immutable fund hint is read outside it, so approvals never reuse an older snapshot.
async function withVoucher(id, user, work) {
  const [hint] = await rows(
    pool,
    "SELECT ma_quy FROM phieu_thu_chi WHERE ma_phieu=?",
    [id],
  );
  if (!hint) missing();
  return transaction(async (db) => {
    const f = await getFund(db, hint.ma_quy, true);
    const [p] = await rows(
      db,
      "SELECT * FROM phieu_thu_chi WHERE ma_phieu=? FOR UPDATE",
      [id],
    );
    if (!p) missing();
    await actor(db, user);
    return work(db, f, p);
  });
}
function draft(p) {
  if (p.trang_thai !== "NHAP")
    fail(
      409,
      "IMMUTABLE_VOUCHER",
      "Chỉ sửa hoặc hủy phiếu nháp. Phiếu đã ghi sổ cần lập phiếu đảo.",
    );
}
const baseFields = "ma_quy,loai,nhom,ngay_hach_toan,so_tien,doi_tac,dien_giai";
export async function create(body, user) {
  const data = v.voucher(body),
    key = v.key(body.khoa_yeu_cau),
    hash = createHash("sha256")
      .update(JSON.stringify({ actor: user.ma_nguoi_dung, ...data }))
      .digest("hex");
  return transaction(async (db) => {
    const f = await getFund(db, data.ma_quy, true);
    await actor(db, user);
    const [prior] = await rows(
      db,
      "SELECT ma_phieu,van_tay FROM phieu_thu_chi WHERE khoa_yeu_cau=? FOR UPDATE",
      [key],
    );
    if (prior) {
      if (prior.van_tay !== hash)
        fail(
          409,
          "REQUEST_KEY_REUSED",
          "Mã yêu cầu đã dùng cho thông tin khác. Hãy mở lại biểu mẫu.",
        );
      return { ma_phieu: prior.ma_phieu, replay: true };
    }
    open(f);
    const r = await rows(
      db,
      `INSERT INTO phieu_thu_chi (${baseFields},ma_nguoi_lap,khoa_yeu_cau,van_tay) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [...Object.values(data), user.ma_nguoi_dung, key, hash],
    );
    await audit(db, r.insertId, user, "TAO_NHAP", JSON.stringify(data));
    return { ma_phieu: r.insertId, replay: false };
  });
}
export async function edit(id, body, user) {
  const data = v.voucher(body);
  return withVoucher(id, user, async (db, f, p) => {
    draft(p);
    open(f);
    v.version(p, body.phien_ban);
    if (data.ma_quy !== p.ma_quy || data.loai !== p.loai)
      fail(
        422,
        "IMMUTABLE_FUND",
        "Không đổi quỹ hoặc loại của phiếu đã lập. Hủy nháp và tạo phiếu mới.",
      );
    await rows(
      db,
      "UPDATE phieu_thu_chi SET nhom=?,ngay_hach_toan=?,so_tien=?,doi_tac=?,dien_giai=?,phien_ban=phien_ban+1 WHERE ma_phieu=?",
      [
        data.nhom,
        data.ngay_hach_toan,
        data.so_tien,
        data.doi_tac,
        data.dien_giai,
        id,
      ],
    );
    await audit(db, id, user, "SUA_NHAP", JSON.stringify(data));
    return { ma_phieu: id };
  });
}
export async function act(id, action, body, user) {
  return withVoucher(id, user, async (db, f, p) => {
    if (action === "dao") {
      const reason = v.reason(body.ly_do);
      const [prior] = await rows(
        db,
        "SELECT ma_phieu,dien_giai,ma_nguoi_lap FROM phieu_thu_chi WHERE ma_phieu_goc=? FOR UPDATE",
        [id],
      );
      if (prior) {
        if (
          prior.dien_giai !== reason ||
          prior.ma_nguoi_lap !== user.ma_nguoi_dung
        )
          fail(
            409,
            "ALREADY_REVERSED",
            "Phiếu đã được đảo. Mở phiếu đảo trong chi tiết để kiểm tra.",
          );
        return { ma_phieu: prior.ma_phieu, replay: true };
      }
      v.version(p, body.phien_ban);
      if (p.trang_thai !== "DA_GHI_SO" || p.ma_phieu_goc)
        fail(
          409,
          "INVALID_REVERSAL",
          "Chỉ đảo một lần phiếu gốc đã ghi sổ; không đảo tiếp phiếu đảo.",
        );
      const type = p.loai === "THU" ? "CHI" : "THU";
      if (
        type === "CHI" &&
        BigInt(await balance(db, p.ma_quy)) < BigInt(p.so_tien)
      )
        fail(
          409,
          "INSUFFICIENT_FUNDS",
          "Quỹ không đủ số dư hiện tại để đảo khoản thu này.",
        );
      const r = await rows(
        db,
        "INSERT INTO phieu_thu_chi (ma_quy,loai,nhom,ngay_hach_toan,so_tien,doi_tac,dien_giai,trang_thai,ma_nguoi_lap,ma_nguoi_duyet,ngay_duyet,ma_phieu_goc) VALUES (?,?,'DIEU_CHINH',?,?,?,?,'DA_GHI_SO',?,?,UTC_TIMESTAMP(6),?)",
        [
          p.ma_quy,
          type,
          v.today(),
          p.so_tien,
          p.doi_tac,
          reason,
          user.ma_nguoi_dung,
          user.ma_nguoi_dung,
          id,
        ],
      );
      await rows(
        db,
        "UPDATE phieu_thu_chi SET phien_ban=phien_ban+1 WHERE ma_phieu=?",
        [id],
      );
      await audit(
        db,
        id,
        user,
        "DAO_PHIEU",
        `${code({ ...p, ma_phieu: r.insertId, loai: type })}: ${reason}`,
      );
      await audit(db, r.insertId, user, "TAO_DAO", `${code(p)}: ${reason}`);
      return { ma_phieu: r.insertId, replay: false };
    }
    v.version(p, body.phien_ban);
    draft(p);
    if (action === "huy") {
      await rows(
        db,
        "UPDATE phieu_thu_chi SET trang_thai='HUY',phien_ban=phien_ban+1 WHERE ma_phieu=?",
        [id],
      );
      await audit(db, id, user, "HUY", v.reason(body.ly_do));
    } else if (action === "duyet") {
      open(f);
      v.day(p.ngay_hach_toan);
      if (p.loai === "CHI") {
        const [n] = await rows(
          db,
          "SELECT COUNT(*) AS total FROM chung_tu_thu_chi WHERE ma_phieu=?",
          [id],
        );
        if (!n.total)
          fail(
            422,
            "PROOF_REQUIRED",
            "Phiếu chi cần ít nhất một chứng từ trước khi duyệt.",
          );
        if (BigInt(await balance(db, p.ma_quy)) < BigInt(p.so_tien))
          fail(
            409,
            "INSUFFICIENT_FUNDS",
            "Quỹ không đủ số dư hiện tại để duyệt chi.",
          );
      }
      await rows(
        db,
        "UPDATE phieu_thu_chi SET trang_thai='DA_GHI_SO',ma_nguoi_duyet=?,ngay_duyet=UTC_TIMESTAMP(6),phien_ban=phien_ban+1 WHERE ma_phieu=?",
        [user.ma_nguoi_dung, id],
      );
      await audit(
        db,
        id,
        user,
        "GHI_SO",
        text(body.ghi_chu || "", "ghi_chu", 0, 1000),
      );
    } else fail(422, "INVALID_ACTION", "Thao tác không hợp lệ.");
    return { ma_phieu: id };
  });
}
const select = `p.ma_phieu,p.ma_quy,p.loai,p.nhom,p.ngay_hach_toan,p.so_tien,p.doi_tac,p.dien_giai,p.trang_thai,p.phien_ban,p.ma_phieu_goc,p.ngay_tao,p.ngay_duyet,q.ten_quy,r.ma_phieu AS ma_phieu_dao`;
const from =
  "FROM phieu_thu_chi p JOIN quy_tai_chinh q ON q.ma_quy=p.ma_quy LEFT JOIN phieu_thu_chi r ON r.ma_phieu_goc=p.ma_phieu";
export async function list(query) {
  const { page, offset } = v.pagination(query),
    where = ["1=1"],
    args = [];
  if (query.ma_quy) {
    where.push("p.ma_quy=?");
    args.push(v.positive(query.ma_quy, "ma_quy"));
  }
  if (query.loai) {
    where.push("p.loai=?");
    args.push(choice(query.loai, "loai", ["THU", "CHI"]));
  }
  if (query.trang_thai) {
    where.push("p.trang_thai=?");
    args.push(
      choice(query.trang_thai, "trang_thai", ["NHAP", "DA_GHI_SO", "HUY"]),
    );
  }
  if (query.q) {
    where.push("(p.doi_tac LIKE ? OR p.dien_giai LIKE ?)");
    const q = `%${text(query.q, "q", 1, 100)}%`;
    args.push(q, q);
  }
  const clause = where.join(" AND "),
    [n] = await rows(
      pool,
      `SELECT COUNT(*) AS total ${from} WHERE ${clause}`,
      args,
    ),
    data = await rows(
      pool,
      `SELECT ${select} ${from} WHERE ${clause} ORDER BY p.ma_phieu DESC LIMIT 20 OFFSET ${offset}`,
      args,
    );
  return { data, total: n.total, page };
}
export async function detail(id) {
  const [p] = await rows(
    pool,
    `SELECT ${select},u.ho_va_ten AS nguoi_lap,d.ho_va_ten AS nguoi_duyet ${from} JOIN nguoi_dung u ON u.ma_nguoi_dung=p.ma_nguoi_lap LEFT JOIN nguoi_dung d ON d.ma_nguoi_dung=p.ma_nguoi_duyet WHERE p.ma_phieu=?`,
    [id],
  );
  if (!p) missing();
  p.chung_tu = await rows(
    pool,
    "SELECT ma_chung_tu,ten_tep,loai_tep,kich_thuoc,ngay_tao FROM chung_tu_thu_chi WHERE ma_phieu=? ORDER BY ma_chung_tu",
    [id],
  );
  p.history = await rows(
    pool,
    "SELECT h.ma_lich_su,h.su_kien,h.ghi_chu,h.ngay_tao,u.ho_va_ten FROM lich_su_thu_chi h JOIN nguoi_dung u ON u.ma_nguoi_dung=h.ma_nguoi_thuc_hien WHERE h.ma_phieu=? ORDER BY h.ma_lich_su",
    [id],
  );
  return p;
}
export async function attach(id, body, files, user) {
  const prepared = await prepare(files);
  return withVoucher(id, user, async (db, f, p) => {
    draft(p);
    const existing = await rows(
        db,
        "SELECT ma_chung_tu,bam_sha256 FROM chung_tu_thu_chi WHERE ma_phieu=?",
        [id],
      ),
      fresh = prepared.filter(
        (x) => !existing.some((y) => y.bam_sha256 === x.hash),
      );
    if (!fresh.length) return { ma_phieu: id, replay: true };
    v.version(p, body.phien_ban);
    if (existing.length + fresh.length > 5)
      fail(422, "PROOF_LIMIT", "Mỗi phiếu giữ tối đa 5 chứng từ.");
    for (const file of fresh)
      await rows(
        db,
        "INSERT INTO chung_tu_thu_chi (ma_phieu,ten_tep,loai_tep,kich_thuoc,bam_sha256,noi_dung,ma_nguoi_tai) VALUES (?,?,?,?,?,?,?)",
        [
          id,
          file.name,
          file.type,
          file.buffer.length,
          file.hash,
          file.buffer,
          user.ma_nguoi_dung,
        ],
      );
    await rows(
      db,
      "UPDATE phieu_thu_chi SET phien_ban=phien_ban+1 WHERE ma_phieu=?",
      [id],
    );
    await audit(
      db,
      id,
      user,
      "THEM_CHUNG_TU",
      fresh.map((f) => f.name).join(", "),
    );
    return { ma_phieu: id, replay: false };
  });
}
export async function removeProof(id, proofId, body, user) {
  return withVoucher(id, user, async (db, f, p) => {
    draft(p);
    v.version(p, body.phien_ban);
    const r = await rows(
      db,
      "DELETE FROM chung_tu_thu_chi WHERE ma_phieu=? AND ma_chung_tu=?",
      [id, proofId],
    );
    if (!r.affectedRows) missing();
    await rows(
      db,
      "UPDATE phieu_thu_chi SET phien_ban=phien_ban+1 WHERE ma_phieu=?",
      [id],
    );
    await audit(db, id, user, "XOA_CHUNG_TU", `Chứng từ #${proofId}`);
    return { ma_phieu: id };
  });
}
export async function proof(id, proofId) {
  const [f] = await rows(
    pool,
    "SELECT loai_tep,noi_dung FROM chung_tu_thu_chi WHERE ma_phieu=? AND ma_chung_tu=?",
    [id, proofId],
  );
  if (!f) missing();
  return f;
}
export async function ledger(id, query) {
  const range = v.range(query),
    { page, offset } = v.pagination(query),
    mode = choice(query.che_do || "GIAO_DICH", "che_do", [
      "GIAO_DICH",
      "THEO_THANG",
    ]);
  return snapshot(async (db) => {
    const fund = await getFund(db, id),
      [stamp] = await rows(db, "SELECT UTC_TIMESTAMP(6) AS tai_luc");
    const [s] = await rows(
      db,
      `SELECT CAST(COALESCE(SUM(IF(ngay<?,IF(loai='THU',so_tien,-so_tien),0)),0) AS CHAR) AS dau_ky,CAST(COALESCE(SUM(IF(ngay>=? AND loai='THU',so_tien,0)),0) AS CHAR) AS tong_thu,CAST(COALESCE(SUM(IF(ngay>=? AND loai='CHI',so_tien,0)),0) AS CHAR) AS tong_chi FROM ${source(id)} WHERE ngay<=?`,
      [range.tu_ngay, range.tu_ngay, range.tu_ngay, range.den_ngay],
    );
    s.cuoi_ky = (
      BigInt(s.dau_ky) +
      BigInt(s.tong_thu) -
      BigInt(s.tong_chi)
    ).toString();
    const args = [range.tu_ngay, range.den_ngay],
      where = ["ngay>=?", "ngay<=?"];
    if (mode === "GIAO_DICH") {
      if (query.loai) {
        where.push("loai=?");
        args.push(choice(query.loai, "loai", ["THU", "CHI"]));
      }
      if (query.nguon) {
        where.push("nguon=?");
        args.push(choice(query.nguon, "nguon", ["PHIEU", "HOA_DON"]));
      }
      if (query.q) {
        where.push(
          "(so_chung_tu LIKE ? OR doi_tac LIKE ? OR dien_giai LIKE ?)",
        );
        const q = `%${text(query.q, "q", 1, 100)}%`;
        args.push(q, q, q);
      }
    }
    const clause = where.join(" AND "),
      grouped = mode === "THEO_THANG",
      dataFrom = grouped
        ? `FROM (SELECT DATE_FORMAT(ngay,'%Y-%m') AS ky,CAST(SUM(IF(loai='THU',so_tien,0)) AS CHAR) AS tong_thu,CAST(SUM(IF(loai='CHI',so_tien,0)) AS CHAR) AS tong_chi ${"FROM " + source(id)} WHERE ${clause} GROUP BY DATE_FORMAT(ngay,'%Y-%m')) m`
        : `FROM ${source(id)} WHERE ${clause}`;
    const [n] = await rows(db, `SELECT COUNT(*) AS total ${dataFrom}`, args),
      data = await rows(
        db,
        `SELECT ${grouped ? "m.*" : "s.*"} ${dataFrom} ORDER BY ${grouped ? "ky DESC" : "ngay DESC,nguon,ma_ban_ghi DESC"} LIMIT 20 OFFSET ${offset}`,
        args,
      );
    return {
      fund,
      data,
      total: n.total,
      page,
      summary: s,
      filters: { ...range, che_do: mode },
      ...stamp,
    };
  });
}
