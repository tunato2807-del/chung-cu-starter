import { randomBytes, createHash } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { fail, text, phone, choice, integer } from "../../lib/http.js";
import { saveImages, cleanupImages } from "../../lib/images.js";
import { lockedReport, addImages, history } from "./incidents.repository.js";
export const categories = [
  "DIEN",
  "NUOC",
  "THANG_MAY",
  "VE_SINH",
  "AN_NINH",
  "KHAC",
];
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hash = (value) => createHash("sha256").update(value).digest("hex");
export async function submit(body, files, user, ip) {
  const b = {
    token: text(body.token_qr, "token_qr", 36, 36),
    key: text(body.khoa_yeu_cau, "khoa_yeu_cau", 36, 36),
    title: text(body.tieu_de, "tieu_de", 3, 150),
    content: text(body.noi_dung, "noi_dung", 10, 5000),
    name: text(body.ten_nguoi_gui, "ten_nguoi_gui", 2, 100),
    phone: phone(body.so_dien_thoai),
    apartment: text(body.can_ho_khai_bao || "", "can_ho_khai_bao", 0, 40),
    category: choice(body.loai_su_co, "loai_su_co", categories),
    user: user?.ma_nguoi_dung || null,
  };
  if (!uuid.test(b.token) || !uuid.test(b.key))
    fail(422, "VALIDATION", "Token QR hoặc khóa yêu cầu không hợp lệ.");
  const fingerprint = hash(
    JSON.stringify(b) + files.map((f) => hash(f.buffer)).join(","),
  );
  let names = [],
    retained = false;
  try {
    // Images are prepared before opening DB locks; all metadata commits together.
    names = await saveImages(files);
    const result = await transaction(async (db) => {
      await rows(
        db,
        "INSERT INTO yeu_cau_gui (khoa,van_tay) VALUES (?,?) ON DUPLICATE KEY UPDATE khoa=khoa",
        [b.key, fingerprint],
      );
      const [request] = await rows(
        db,
        "SELECT * FROM yeu_cau_gui WHERE khoa=? FOR UPDATE",
        [b.key],
      );
      if (request.van_tay !== fingerprint)
        fail(
          409,
          "IDEMPOTENCY_CONFLICT",
          "Khóa gửi đã được dùng cho nội dung khác. Hãy mở biểu mẫu mới.",
        );
      if (request.ma_phan_anh)
        return {
          ...(
            await rows(
              db,
              "SELECT ma_tra_cuu FROM phan_anh WHERE ma_phan_anh=?",
              [request.ma_phan_anh],
            )
          )[0],
          replay: true,
        };
      const [loc] = await rows(
        db,
        "SELECT * FROM vi_tri_qr WHERE token_qr=? AND dang_hoat_dong=1 FOR SHARE",
        [b.token],
      );
      if (!loc)
        fail(
          404,
          "QR_INVALID",
          "Mã QR đã bị thay hoặc vô hiệu hóa. Vui lòng quét lại.",
        );
      const rateKey = hash(b.phone + "|" + ip);
      await rows(
        db,
        "INSERT INTO gioi_han_gui (khoa,cac_moc_thoi_gian) VALUES (?,JSON_ARRAY()) ON DUPLICATE KEY UPDATE khoa=khoa",
        [rateKey],
      );
      const [rate] = await rows(
        db,
        "SELECT cac_moc_thoi_gian FROM gioi_han_gui WHERE khoa=? FOR UPDATE",
        [rateKey],
      );
      const times = (
        typeof rate.cac_moc_thoi_gian === "string"
          ? JSON.parse(rate.cac_moc_thoi_gian)
          : rate.cac_moc_thoi_gian
      ).filter((t) => t > Date.now() - 3600000);
      if (times.length >= 5)
        fail(
          429,
          "SUBMISSION_LIMIT",
          "Bạn đã gửi 5 phản ánh trong một giờ. Vui lòng thử lại sau.",
        );
      const similar = await rows(
        db,
        "SELECT 1 FROM phan_anh WHERE ma_vi_tri_qr=? AND loai_su_co=? AND trang_thai IN ('MOI','DA_PHAN_CONG','DANG_XU_LY','DA_XU_LY') LIMIT 1",
        [loc.ma_vi_tri_qr, b.category],
      );
      if (
        similar.length &&
        body.xac_nhan_gui !== "true" &&
        body.xac_nhan_gui !== true
      )
        fail(
          409,
          "SIMILAR_REPORT",
          "Vị trí này có sự cố tương tự đang được tiếp nhận. Bạn vẫn muốn gửi phản ánh riêng?",
        );
      const lookup = randomBytes(32).toString("hex");
      const r = await rows(
        db,
        `INSERT INTO phan_anh (ma_tra_cuu,khoa_yeu_cau,ma_vi_tri_qr,ma_nguoi_gui,ten_nguoi_gui,so_dien_thoai_nguoi_gui,can_ho_khai_bao,tieu_de,noi_dung,loai_su_co) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          lookup,
          b.key,
          loc.ma_vi_tri_qr,
          b.user,
          b.name,
          b.phone,
          b.apartment,
          b.title,
          b.content,
          b.category,
        ],
      );
      await addImages(db, r.insertId, names, "PHAN_ANH", 1, user);
      await history(
        db,
        { ma_phan_anh: r.insertId, trang_thai: null, ma_ky_thuat_vien: null },
        user,
        "TIEP_NHAN",
        "MOI",
        "",
        "Đã tiếp nhận phản ánh.",
      );
      await rows(db, "UPDATE yeu_cau_gui SET ma_phan_anh=? WHERE khoa=?", [
        r.insertId,
        b.key,
      ]);
      await rows(
        db,
        "UPDATE gioi_han_gui SET cac_moc_thoi_gian=? WHERE khoa=?",
        [JSON.stringify([...times, Date.now()]), rateKey],
      );
      return { ma_tra_cuu: lookup, replay: false };
    });
    retained = !result.replay;
    return result;
  } finally {
    if (!retained) await cleanupImages(names);
  }
}
export async function lookup(body) {
  const number = phone(body.so_dien_thoai);
  if (
    typeof body.ma_tra_cuu !== "string" ||
    !/^[a-f0-9]{64}$/.test(body.ma_tra_cuu)
  )
    fail(
      404,
      "NOT_FOUND",
      "Không tìm thấy phản ánh. Kiểm tra mã và số điện thoại.",
    );
  let [r] = await rows(
    pool,
    `SELECT p.ma_phan_anh,p.trang_thai,p.ngay_tao,p.ngay_dong,p.ma_phan_anh_goc,v.ten_vi_tri FROM phan_anh p JOIN vi_tri_qr v USING(ma_vi_tri_qr) WHERE ma_tra_cuu=? AND so_dien_thoai_nguoi_gui=?`,
    [body.ma_tra_cuu, number],
  );
  if (!r)
    fail(
      404,
      "NOT_FOUND",
      "Không tìm thấy phản ánh. Kiểm tra mã và số điện thoại.",
    );
  if (r.trang_thai === "TRUNG") {
    const [original] = await rows(
      pool,
      "SELECT trang_thai,ngay_dong FROM phan_anh WHERE ma_phan_anh=?",
      [r.ma_phan_anh_goc],
    );
    r = {
      ...r,
      trang_thai: original.trang_thai,
      ngay_dong: original.ngay_dong,
    };
  }
  const timeline = await rows(
    pool,
    "SELECT trang_thai_moi,ngay_tao,noi_dung_cong_khai FROM lich_su_phan_anh WHERE ma_phan_anh=? ORDER BY ma_lich_su_phan_anh",
    [r.ma_phan_anh],
  );
  // Deliberately omit IDs, names, contact details, report contents, and images.
  return {
    ten_vi_tri: r.ten_vi_tri,
    trang_thai: r.trang_thai,
    ngay_tao: r.ngay_tao,
    ngay_dong: r.ngay_dong,
    lich_su: timeline,
  };
}
export async function assign(id, body, actor) {
  const version = integer(body.phien_ban, "phien_ban"),
    technician = integer(body.ma_ky_thuat_vien, "ma_ky_thuat_vien");
  const priority = choice(body.do_uu_tien, "do_uu_tien", [
    "THAP",
    "TRUNG_BINH",
    "CAO",
    "KHAN_CAP",
  ]);
  await transaction(async (db) => {
    const r = await lockedReport(db, id, actor, version);
    if (!["MOI", "DA_PHAN_CONG", "DANG_XU_LY"].includes(r.trang_thai))
      fail(409, "STATE_CONFLICT", "Không thể phân công ở trạng thái này.");
    const [u] = await rows(
      db,
      "SELECT * FROM nguoi_dung WHERE ma_nguoi_dung=? AND vai_tro='KY_THUAT_VIEN' AND dang_hoat_dong=1 FOR SHARE",
      [technician],
    );
    if (!u)
      fail(422, "TECHNICIAN_INVALID", "Chọn kỹ thuật viên đang hoạt động.");
    const status = r.trang_thai === "MOI" ? "DA_PHAN_CONG" : r.trang_thai;
    await rows(
      db,
      "UPDATE phan_anh SET ma_ky_thuat_vien=?,do_uu_tien=?,trang_thai=?,phien_ban=phien_ban+1 WHERE ma_phan_anh=?",
      [technician, priority, status, id],
    );
    await history(
      db,
      r,
      actor,
      "PHAN_CONG",
      status,
      text(body.ghi_chu || "", "ghi_chu", 0, 500),
      "Đã phân công kỹ thuật viên xử lý.",
      technician,
    );
  });
}
export async function transition(id, body, files, actor) {
  const version = integer(body.phien_ban, "phien_ban");
  const target = choice(body.trang_thai, "trang_thai", [
    "DANG_XU_LY",
    "DA_XU_LY",
    "DA_DONG",
    "TU_CHOI",
    "TRUNG",
  ]);
  const note = text(body.ghi_chu || "", "ghi_chu", 0, 500),
    publicNote = text(
      body.noi_dung_cong_khai || "",
      "noi_dung_cong_khai",
      0,
      500,
    );
  let names = [],
    committed = false;
  try {
    if (files.length && target !== "DA_XU_LY")
      fail(422, "IMAGE_STAGE", "Chỉ gửi ảnh nghiệm thu khi hoàn thành.");
    names = await saveImages(files);
    await transaction(async (db) => {
      const r = await lockedReport(db, id, actor, version);
      const tech = actor.vai_tro === "KY_THUAT_VIEN";
      if (tech) {
        if (
          actor.ma_nguoi_dung !== r.ma_ky_thuat_vien ||
          !(
            (r.trang_thai === "DA_PHAN_CONG" && target === "DANG_XU_LY") ||
            (r.trang_thai === "DANG_XU_LY" && target === "DA_XU_LY")
          )
        )
          fail(
            409,
            "STATE_CONFLICT",
            "Không thể chuyển trạng thái công việc này.",
          );
        if (target === "DA_XU_LY" && (!note || !names.length))
          fail(
            422,
            "EVIDENCE_REQUIRED",
            "Hoàn thành cần ghi chú và ít nhất một ảnh nghiệm thu mới.",
          );
      } else if (actor.vai_tro === "QUAN_TRI_VIEN") {
        if (
          !(
            (r.trang_thai === "MOI" && ["TU_CHOI", "TRUNG"].includes(target)) ||
            (r.trang_thai === "DA_XU_LY" &&
              ["DA_DONG", "DANG_XU_LY"].includes(target))
          )
        )
          fail(
            409,
            "STATE_CONFLICT",
            "Không thể chuyển trạng thái phản ánh này.",
          );
        if (target !== "DA_DONG" && !note)
          fail(422, "REASON_REQUIRED", "Vui lòng nhập lý do.");
      } else fail(403, "FORBIDDEN", "Bạn không có quyền cập nhật phản ánh.");
      let original = null;
      if (target === "TRUNG") {
        original = integer(body.ma_phan_anh_goc, "ma_phan_anh_goc");
        if (original === id)
          fail(422, "MERGE_INVALID", "Không thể gộp vào chính phản ánh này.");
        const [parent] = await rows(
          db,
          "SELECT * FROM phan_anh WHERE ma_phan_anh=? FOR UPDATE",
          [original],
        );
        if (
          !parent ||
          parent.ma_vi_tri_qr !== r.ma_vi_tri_qr ||
          !["MOI", "DA_PHAN_CONG", "DANG_XU_LY", "DA_XU_LY"].includes(
            parent.trang_thai,
          )
        )
          fail(
            422,
            "MERGE_INVALID",
            "Phản ánh gốc phải cùng vị trí và đang được xử lý.",
          );
        // A report which already has children cannot become a duplicate itself.
        if (
          (
            await rows(
              db,
              "SELECT 1 FROM phan_anh WHERE ma_phan_anh_goc=? LIMIT 1",
              [id],
            )
          ).length
        )
          fail(
            422,
            "MERGE_INVALID",
            "Phản ánh này đã là bản gốc của phản ánh khác.",
          );
      }
      const round =
        r.luot_xu_ly +
        (r.trang_thai === "DA_XU_LY" && target === "DANG_XU_LY" ? 1 : 0);
      await rows(
        db,
        `UPDATE phan_anh SET trang_thai=?,phien_ban=phien_ban+1,luot_xu_ly=?,ma_phan_anh_goc=?,ngay_dong=IF(?='DA_DONG',UTC_TIMESTAMP(),NULL) WHERE ma_phan_anh=?`,
        [target, round, original, target, id],
      );
      await addImages(db, id, names, "NGHIEM_THU", round, actor);
      await history(db, r, actor, "DOI_TRANG_THAI", target, note, publicNote);
    });
    committed = true;
  } finally {
    if (!committed) await cleanupImages(names);
  }
}
