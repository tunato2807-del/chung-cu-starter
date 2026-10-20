import { createHash } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, text, integer } from "../../lib/http.js";
import { day, pagination } from "../billing/billing.validation.js";
import * as v from "./maintenance.validation.js";
const admin = (user) => user.vai_tro === "QUAN_TRI_VIEN";
const notFound = () =>
  fail(
    404,
    "NOT_FOUND",
    "Không tìm thấy dữ liệu bảo trì hoặc bạn không còn quyền xem.",
  );
const openSql = "('MOI','DA_PHAN_CONG','DANG_THUC_HIEN','CHO_NGHIEM_THU')";
async function actor(db, user) {
  const [u] = await rows(
    db,
    "SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_nguoi_dung=? AND dang_hoat_dong=1 AND vai_tro=? AND phien_ban_token=? FOR SHARE",
    [user.ma_nguoi_dung, user.vai_tro, user.phien_ban_token],
  );
  if (!u)
    fail(401, "SESSION_EXPIRED", "Phiên đã hết hạn. Vui lòng đăng nhập lại.");
}
async function staff(db, id) {
  const [u] = await rows(
    db,
    "SELECT ma_nguoi_dung,ho_va_ten FROM nguoi_dung WHERE ma_nguoi_dung=? AND vai_tro='KY_THUAT_VIEN' AND dang_hoat_dong=1 FOR SHARE",
    [id],
  );
  if (!u) fail(422, "INVALID_TECHNICIAN", "Chọn kỹ thuật viên đang hoạt động.");
  return u;
}
async function lockEquipment(db, id) {
  const [e] = await rows(
    db,
    "SELECT * FROM thiet_bi WHERE ma_thiet_bi=? FOR UPDATE",
    [id],
  );
  if (!e) notFound();
  return e;
}
async function audit(db, e, j, user, event, note, data) {
  await rows(
    db,
    "INSERT INTO lich_su_bao_tri (ma_thiet_bi,ma_phieu_bao_tri,ma_nguoi_thuc_hien,su_kien,ghi_chu,du_lieu) VALUES (?,?,?,?,?,?)",
    [e, j, user.ma_nguoi_dung, event, note, JSON.stringify(data)],
  );
}
const history = (db, e, j) =>
  rows(
    db,
    `SELECT l.ma_lich_su,l.su_kien,l.ghi_chu,l.ngay_tao,u.ho_va_ten FROM lich_su_bao_tri l JOIN nguoi_dung u ON u.ma_nguoi_dung=l.ma_nguoi_thuc_hien WHERE l.ma_thiet_bi=? AND ${j ? "l.ma_phieu_bao_tri=?" : "l.ma_phieu_bao_tri IS NULL"} ORDER BY l.ma_lich_su`,
    j ? [e, j] : [e],
  );
function dueState(e, today) {
  if (e.trang_thai === "NGUNG_SU_DUNG") return "NGUNG_THEO_DOI";
  if (!e.ngay_bao_tri_tiep_theo) return "CHUA_CAU_HINH";
  if (e.ngay_bao_tri_tiep_theo < today) return "QUA_HAN";
  return e.ngay_bao_tri_tiep_theo <= v.addDays(today, e.nhac_truoc_ngay)
    ? "SAP_DEN_HAN"
    : "CHUA_DEN_HAN";
}
const equipmentSelect = `SELECT e.*,(SELECT j.ma_phieu_bao_tri FROM phieu_bao_tri j WHERE j.dinh_ky_dang_mo=e.ma_thiet_bi) AS phieu_dinh_ky_dang_mo FROM thiet_bi e`;
export async function equipmentList(query) {
  const { page, offset } = pagination(query),
    today = v.today(),
    where = ["1=1"],
    values = [];
  if (query.q) {
    const q = `%${text(query.q, "q", 1, 100)}%`;
    where.push(
      "(e.ma_tai_san LIKE ? OR e.ten_thiet_bi LIKE ? OR e.vi_tri LIKE ?)",
    );
    values.push(q, q, q);
  }
  if (query.loai) {
    where.push("e.loai=?");
    values.push(choice(query.loai, "loai", v.types));
  }
  if (query.trang_thai) {
    where.push("e.trang_thai=?");
    values.push(choice(query.trang_thai, "trang_thai", v.equipmentStates));
  }
  if (query.lich) {
    const filter = choice(query.lich, "lich", [
      "QUA_HAN",
      "SAP_DEN_HAN",
      "CHUA_CAU_HINH",
    ]);
    where.push("e.trang_thai<>'NGUNG_SU_DUNG'");
    if (filter === "CHUA_CAU_HINH") where.push("e.chu_ky_ngay IS NULL");
    else if (filter === "QUA_HAN") {
      where.push("e.ngay_bao_tri_tiep_theo<?");
      values.push(today);
    } else {
      where.push(
        "e.ngay_bao_tri_tiep_theo>=? AND e.ngay_bao_tri_tiep_theo<=DATE_ADD(?,INTERVAL e.nhac_truoc_ngay DAY)",
      );
      values.push(today, today);
    }
  }
  const condition = where.join(" AND ");
  const [summary] = await rows(
    pool,
    `SELECT COUNT(*) AS total,CAST(COALESCE(SUM(e.trang_thai<>'NGUNG_SU_DUNG' AND e.ngay_bao_tri_tiep_theo<?),0) AS UNSIGNED) AS qua_han,CAST(COALESCE(SUM(e.trang_thai<>'NGUNG_SU_DUNG' AND e.ngay_bao_tri_tiep_theo>=? AND e.ngay_bao_tri_tiep_theo<=DATE_ADD(?,INTERVAL e.nhac_truoc_ngay DAY)),0) AS UNSIGNED) AS sap_den_han FROM thiet_bi e WHERE ${condition}`,
    [today, today, today, ...values],
  );
  const data = await rows(
    pool,
    `${equipmentSelect} WHERE ${condition} ORDER BY e.ngay_bao_tri_tiep_theo IS NULL,e.ngay_bao_tri_tiep_theo,e.ma_thiet_bi LIMIT 20 OFFSET ${offset}`,
    values,
  );
  return {
    data: data.map((e) => ({ ...e, tinh_trang_lich: dueState(e, today) })),
    summary,
    total: summary.total,
    page,
    ngay_hien_tai: today,
  };
}
export async function equipmentDetail(id) {
  const [e] = await rows(pool, `${equipmentSelect} WHERE e.ma_thiet_bi=?`, [
    id,
  ]);
  if (!e) notFound();
  return {
    ...e,
    tinh_trang_lich: dueState(e, v.today()),
    history: await history(pool, id, null),
  };
}
export async function createEquipment(body, user) {
  const code = v.assetCode(body.ma_tai_san),
    fields = v.equipment(body);
  return transaction(async (db) => {
    await actor(db, user);
    const keys = Object.keys(fields);
    const result = await rows(
      db,
      `INSERT INTO thiet_bi (ma_tai_san,${keys.join(",")},ma_nguoi_tao) VALUES (${Array(
        keys.length + 2,
      )
        .fill("?")
        .join(",")})`,
      [code, ...Object.values(fields), user.ma_nguoi_dung],
    );
    await audit(
      db,
      result.insertId,
      null,
      user,
      "TAO_THIET_BI",
      "Tạo thiết bị và cấu hình lịch bảo trì.",
      { ma_tai_san: code, ...fields },
    );
    return { ma_thiet_bi: result.insertId };
  });
}
export async function updateEquipment(id, body, user) {
  const fields = v.equipment(body);
  return transaction(async (db) => {
    const old = await lockEquipment(db, id);
    await actor(db, user);
    v.version(old, body.phien_ban);
    if (body.ma_tai_san && v.assetCode(body.ma_tai_san) !== old.ma_tai_san)
      fail(422, "IMMUTABLE_ASSET_CODE", "Mã tài sản được giữ cố định.");
    const planChanged = [
      "chu_ky_ngay",
      "ngay_bao_tri_tiep_theo",
      "nhac_truoc_ngay",
    ].some((k) => fields[k] !== old[k]);
    if (planChanged) {
      const existing = await rows(
        db,
        "SELECT ma_phieu_bao_tri FROM phieu_bao_tri WHERE dinh_ky_dang_mo=? FOR UPDATE",
        [id],
      );
      if (existing.length)
        fail(
          409,
          "OPEN_PERIODIC_JOB",
          "Hoàn thành hoặc hủy phiếu định kỳ đang mở trước khi đổi lịch.",
        );
    }
    if (fields.trang_thai === "NGUNG_SU_DUNG") {
      const active = await rows(
        db,
        `SELECT ma_phieu_bao_tri FROM phieu_bao_tri WHERE ma_thiet_bi=? AND trang_thai IN ${openSql} LIMIT 1 FOR UPDATE`,
        [id],
      );
      if (active.length)
        fail(
          409,
          "OPEN_MAINTENANCE_JOB",
          "Thiết bị còn phiếu chưa kết thúc. Hãy nghiệm thu hoặc hủy phiếu trước.",
        );
    }
    await rows(
      db,
      `UPDATE thiet_bi SET ${Object.keys(fields)
        .map((k) => `${k}=?`)
        .join(
          ",",
        )},phien_ban=phien_ban+1,ngay_cap_nhat=UTC_TIMESTAMP(6) WHERE ma_thiet_bi=?`,
      [...Object.values(fields), id],
    );
    await audit(
      db,
      id,
      null,
      user,
      "SUA_THIET_BI",
      "Cập nhật thông tin thiết bị/lịch bảo trì.",
      { truoc: old, sau: fields },
    );
    return { ma_thiet_bi: id };
  });
}
export async function technicians(query) {
  const { page, offset } = pagination(query),
    q = query.q ? `%${text(query.q, "q", 1, 100)}%` : "%";
  const [count] = await rows(
    pool,
    "SELECT COUNT(*) AS total FROM nguoi_dung WHERE vai_tro='KY_THUAT_VIEN' AND dang_hoat_dong=1 AND ho_va_ten LIKE ?",
    [q],
  );
  return {
    data: await rows(
      pool,
      `SELECT ma_nguoi_dung,ho_va_ten,chuyen_mon FROM nguoi_dung WHERE vai_tro='KY_THUAT_VIEN' AND dang_hoat_dong=1 AND ho_va_ten LIKE ? ORDER BY ma_nguoi_dung LIMIT 20 OFFSET ${offset}`,
      [q],
    ),
    total: count.total,
    page,
  };
}
export async function createJob(equipmentId, body, user) {
  const type = choice(body.loai, "loai", ["DINH_KY", "DOT_XUAT"]),
    key = v.requestKey(body.khoa_yeu_cau);
  const data = {
    loai: type,
    ma_ky_thuat_vien: body.ma_ky_thuat_vien
      ? v.positive(body.ma_ky_thuat_vien, "ma_ky_thuat_vien")
      : null,
    do_uu_tien: choice(body.do_uu_tien || "THUONG", "do_uu_tien", [
      "THUONG",
      "CAO",
      "KHAN_CAP",
    ]),
  };
  if (type === "DOT_XUAT")
    Object.assign(data, {
      tieu_de: text(body.tieu_de, "tieu_de", 3, 180),
      noi_dung: text(body.noi_dung, "noi_dung", 3, 2000),
      ngay_den_han: day(body.ngay_den_han, true),
    });
  else
    data.phien_ban_thiet_bi = integer(
      body.phien_ban_thiet_bi,
      "phien_ban_thiet_bi",
    );
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ equipmentId, user: user.ma_nguoi_dung, ...data }))
    .digest("hex");
  return transaction(async (db) => {
    const e = await lockEquipment(db, equipmentId);
    await actor(db, user);
    const [old] = await rows(
      db,
      "SELECT ma_phieu_bao_tri,van_tay FROM phieu_bao_tri WHERE khoa_yeu_cau=? FOR UPDATE",
      [key],
    );
    if (old) {
      if (old.van_tay !== fingerprint)
        fail(
          409,
          "REQUEST_KEY_REUSED",
          "Mã yêu cầu đã dùng cho phiếu khác. Hãy mở lại biểu mẫu.",
        );
      return { ma_phieu_bao_tri: old.ma_phieu_bao_tri, replay: true };
    }
    if (e.trang_thai === "NGUNG_SU_DUNG")
      fail(409, "EQUIPMENT_RETIRED", "Thiết bị đã ngừng sử dụng.");
    if (type === "DINH_KY") {
      v.version(e, data.phien_ban_thiet_bi);
      if (!e.chu_ky_ngay)
        fail(
          409,
          "NO_PLAN",
          "Cấu hình chu kỳ và ngày bảo trì trước khi lập phiếu định kỳ.",
        );
      const active = await rows(
        db,
        "SELECT ma_phieu_bao_tri FROM phieu_bao_tri WHERE dinh_ky_dang_mo=? FOR UPDATE",
        [equipmentId],
      );
      if (active.length)
        fail(
          409,
          "OPEN_PERIODIC_JOB",
          "Đã có phiếu định kỳ đang mở cho thiết bị này.",
        );
      Object.assign(data, {
        tieu_de: `Bảo trì định kỳ: ${e.ten_thiet_bi}`,
        noi_dung:
          "Thực hiện bảo trì định kỳ theo hướng dẫn kỹ thuật của thiết bị và ghi rõ kết quả.",
        ngay_den_han: e.ngay_bao_tri_tiep_theo,
      });
    }
    const assignee = data.ma_ky_thuat_vien
      ? await staff(db, data.ma_ky_thuat_vien)
      : null;
    const result = await rows(
      db,
      "INSERT INTO phieu_bao_tri (ma_thiet_bi,loai,tieu_de,noi_dung,ten_thiet_bi_luc_lap,vi_tri_luc_lap,ngay_lap,ngay_den_han,chu_ky_ngay,do_uu_tien,trang_thai,ma_ky_thuat_vien,ma_nguoi_lap,ket_qua,khoa_yeu_cau,van_tay) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'',?,?)",
      [
        equipmentId,
        type,
        data.tieu_de,
        data.noi_dung,
        e.ten_thiet_bi,
        e.vi_tri,
        v.today(),
        data.ngay_den_han,
        type === "DINH_KY" ? e.chu_ky_ngay : null,
        data.do_uu_tien,
        assignee ? "DA_PHAN_CONG" : "MOI",
        data.ma_ky_thuat_vien,
        user.ma_nguoi_dung,
        key,
        fingerprint,
      ],
    );
    await audit(
      db,
      equipmentId,
      result.insertId,
      user,
      "LAP_PHIEU",
      `Lập phiếu bảo trì${assignee ? ` và giao ${assignee.ho_va_ten}` : " chưa phân công"}.`,
      { ...data, chu_ky_ngay: type === "DINH_KY" ? e.chu_ky_ngay : null },
    );
    return { ma_phieu_bao_tri: result.insertId, replay: false };
  });
}
const jobFrom =
  "FROM phieu_bao_tri j JOIN thiet_bi e ON e.ma_thiet_bi=j.ma_thiet_bi LEFT JOIN nguoi_dung u ON u.ma_nguoi_dung=j.ma_ky_thuat_vien";
const jobFields =
  "j.ma_phieu_bao_tri,j.ma_thiet_bi,j.loai,j.tieu_de,j.ngay_den_han,j.trang_thai,j.ma_ky_thuat_vien,j.phien_ban,j.do_uu_tien,j.ten_thiet_bi_luc_lap,j.vi_tri_luc_lap,e.ma_tai_san,u.ho_va_ten AS ky_thuat_vien";
function scope(user, where, values) {
  if (!admin(user)) {
    where.push(
      "j.ma_ky_thuat_vien=? AND EXISTS (SELECT 1 FROM nguoi_dung actor WHERE actor.ma_nguoi_dung=? AND actor.dang_hoat_dong=1 AND actor.phien_ban_token=?)",
    );
    values.push(user.ma_nguoi_dung, user.ma_nguoi_dung, user.phien_ban_token);
  }
}
export async function jobs(query, user) {
  const { page, offset } = pagination(query),
    where = ["1=1"],
    values = [],
    today = v.today();
  scope(user, where, values);
  if (query.ma_thiet_bi) {
    where.push("j.ma_thiet_bi=?");
    values.push(v.positive(query.ma_thiet_bi, "ma_thiet_bi"));
  }
  if (query.trang_thai) {
    where.push("j.trang_thai=?");
    values.push(choice(query.trang_thai, "trang_thai", v.jobStates));
  }
  if (query.loai) {
    where.push("j.loai=?");
    values.push(choice(query.loai, "loai", ["DINH_KY", "DOT_XUAT"]));
  }
  if (query.q) {
    const q = `%${text(query.q, "q", 1, 100)}%`;
    where.push(
      "(j.tieu_de LIKE ? OR e.ma_tai_san LIKE ? OR e.ten_thiet_bi LIKE ?)",
    );
    values.push(q, q, q);
  }
  if (query.qua_han) {
    choice(query.qua_han, "qua_han", ["0", "1"]);
    if (query.qua_han === "1") {
      where.push(`j.trang_thai IN ${openSql} AND j.ngay_den_han<?`);
      values.push(today);
    }
  }
  const condition = where.join(" AND ");
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total ${jobFrom} WHERE ${condition}`,
    values,
  );
  const data = await rows(
    pool,
    `SELECT ${jobFields},(j.trang_thai IN ${openSql} AND j.ngay_den_han<?) AS qua_han ${jobFrom} WHERE ${condition} ORDER BY (j.trang_thai IN ${openSql}) DESC,j.ngay_den_han,j.ma_phieu_bao_tri DESC LIMIT 20 OFFSET ${offset}`,
    [today, ...values],
  );
  return { data, total: count.total, page, ngay_hien_tai: today };
}
export async function jobDetail(id, user) {
  const where = ["j.ma_phieu_bao_tri=?"],
    values = [id];
  scope(user, where, values);
  const [j] = await rows(
    pool,
    `SELECT ${jobFields},j.noi_dung,j.ngay_lap,j.chu_ky_ngay,j.luot_thuc_hien,j.ngay_thuc_hien,j.ket_qua,j.nhan_xet_nghiem_thu,j.ly_do_huy,j.ngay_tao,j.ngay_bat_dau,j.ngay_bao_cao,j.ngay_nghiem_thu,e.ten_thiet_bi AS ten_hien_tai,e.vi_tri AS vi_tri_hien_tai,e.trang_thai AS trang_thai_thiet_bi ${jobFrom} WHERE ${where.join(" AND ")}`,
    values,
  );
  if (!j) notFound();
  return {
    ...j,
    qua_han: v.openStates.includes(j.trang_thai) && j.ngay_den_han < v.today(),
    history: await history(pool, j.ma_thiet_bi, id),
  };
}
export async function act(id, action, body, user) {
  return transaction(async (db) => {
    const [hint] = await rows(
      db,
      "SELECT ma_thiet_bi FROM phieu_bao_tri WHERE ma_phieu_bao_tri=?",
      [id],
    );
    if (!hint) notFound();
    const e = await lockEquipment(db, hint.ma_thiet_bi),
      [j] = await rows(
        db,
        "SELECT * FROM phieu_bao_tri WHERE ma_phieu_bao_tri=? FOR UPDATE",
        [id],
      );
    await actor(db, user);
    if (!admin(user) && j.ma_ky_thuat_vien !== user.ma_nguoi_dung) notFound();
    if (!admin(user) && !["bat_dau", "bao_cao"].includes(action))
      fail(403, "FORBIDDEN", "Chỉ BQL được thực hiện thao tác này.");
    if (admin(user) && ["bat_dau", "bao_cao"].includes(action))
      fail(
        403,
        "FORBIDDEN",
        "Kỹ thuật viên được giao phiếu thực hiện và ghi kết quả.",
      );
    v.version(j, body.phien_ban);
    const requireState = (allowed) => {
      if (!allowed.includes(j.trang_thai))
        fail(
          409,
          "INVALID_STATE",
          "Phiếu không ở trạng thái cho phép thực hiện thao tác này.",
        );
    };
    let fields = {},
      note = "";
    if (action === "phan_cong") {
      requireState(["MOI", "DA_PHAN_CONG", "DANG_THUC_HIEN"]);
      const target = await staff(
        db,
        v.positive(body.ma_ky_thuat_vien, "ma_ky_thuat_vien"),
      );
      if (target.ma_nguoi_dung === j.ma_ky_thuat_vien)
        fail(
          409,
          "SAME_TECHNICIAN",
          "Phiếu đã được giao cho kỹ thuật viên này.",
        );
      const reason = text(
        body.ghi_chu || "",
        "ghi_chu",
        j.ma_ky_thuat_vien ? 3 : 0,
        500,
      );
      fields = {
        ma_ky_thuat_vien: target.ma_nguoi_dung,
        trang_thai: "DA_PHAN_CONG",
        ngay_bat_dau: null,
      };
      note = `Giao phiếu cho ${target.ho_va_ten}.${reason ? ` ${reason}` : ""}`;
    } else if (action === "doi_lich") {
      requireState(["MOI", "DA_PHAN_CONG"]);
      const due = day(body.ngay_den_han, true);
      note = text(body.ly_do, "ly_do", 3, 500);
      fields = { ngay_den_han: due };
      if (j.loai === "DINH_KY")
        await rows(
          db,
          "UPDATE thiet_bi SET ngay_bao_tri_tiep_theo=?,phien_ban=phien_ban+1,ngay_cap_nhat=UTC_TIMESTAMP(6) WHERE ma_thiet_bi=?",
          [due, e.ma_thiet_bi],
        );
      note = `Đổi hạn từ ${j.ngay_den_han} sang ${due}. ${note}`;
    } else if (action === "bat_dau") {
      requireState(["DA_PHAN_CONG"]);
      fields = { trang_thai: "DANG_THUC_HIEN" };
      await rows(
        db,
        "UPDATE phieu_bao_tri SET ngay_bat_dau=UTC_TIMESTAMP(6) WHERE ma_phieu_bao_tri=?",
        [id],
      );
      note = "Kỹ thuật viên bắt đầu thực hiện.";
    } else if (action === "bao_cao") {
      requireState(["DANG_THUC_HIEN"]);
      const date = day(body.ngay_thuc_hien);
      if (date < j.ngay_lap)
        fail(
          422,
          "INVALID_WORK_DATE",
          "Ngày thực hiện không được trước ngày lập phiếu.",
        );
      fields = {
        trang_thai: "CHO_NGHIEM_THU",
        ngay_thuc_hien: date,
        ket_qua: v.recordText(body.ket_qua, "ket_qua", 10, 4000),
      };
      await rows(
        db,
        "UPDATE phieu_bao_tri SET ngay_bao_cao=UTC_TIMESTAMP(6) WHERE ma_phieu_bao_tri=?",
        [id],
      );
      note = `Báo cáo lượt ${j.luot_thuc_hien}, thực hiện ngày ${date}:\n${fields.ket_qua}`;
    } else if (action === "tra_lai") {
      requireState(["CHO_NGHIEM_THU"]);
      note = text(body.ly_do, "ly_do", 3, 1000);
      fields = {
        trang_thai: "DANG_THUC_HIEN",
        ket_qua: "",
        ngay_thuc_hien: null,
        luot_thuc_hien: j.luot_thuc_hien + 1,
      };
      note = `Trả lại thực hiện: ${note}`;
    } else if (action === "nghiem_thu") {
      requireState(["CHO_NGHIEM_THU"]);
      fields = {
        trang_thai: "HOAN_THANH",
        ma_nguoi_nghiem_thu: user.ma_nguoi_dung,
        nhan_xet_nghiem_thu: text(body.nhan_xet, "nhan_xet", 3, 1000),
      };
      await rows(
        db,
        "UPDATE phieu_bao_tri SET ngay_nghiem_thu=UTC_TIMESTAMP(6) WHERE ma_phieu_bao_tri=?",
        [id],
      );
      note = `Nghiệm thu đạt. ${fields.nhan_xet_nghiem_thu}`;
      if (j.loai === "DINH_KY") {
        const next = v.addDays(j.ngay_thuc_hien, j.chu_ky_ngay);
        await rows(
          db,
          "UPDATE thiet_bi SET ngay_bao_tri_tiep_theo=?,phien_ban=phien_ban+1,ngay_cap_nhat=UTC_TIMESTAMP(6) WHERE ma_thiet_bi=?",
          [next, e.ma_thiet_bi],
        );
        note += ` Ngày bảo trì kế tiếp: ${next}.`;
      }
    } else if (action === "huy") {
      requireState(v.openStates);
      fields = {
        trang_thai: "HUY",
        ma_nguoi_huy: user.ma_nguoi_dung,
        ly_do_huy: v.recordText(body.ly_do, "ly_do", 3, 500),
      };
      await rows(
        db,
        "UPDATE phieu_bao_tri SET ngay_huy=UTC_TIMESTAMP(6) WHERE ma_phieu_bao_tri=?",
        [id],
      );
      note = `Hủy phiếu: ${fields.ly_do_huy}`;
    }
    await rows(
      db,
      `UPDATE phieu_bao_tri SET ${Object.keys(fields)
        .map((k) => `${k}=?`)
        .join(",")},phien_ban=phien_ban+1 WHERE ma_phieu_bao_tri=?`,
      [...Object.values(fields), id],
    );
    await audit(db, e.ma_thiet_bi, id, user, action.toUpperCase(), note, {
      truoc: {
        trang_thai: j.trang_thai,
        ma_ky_thuat_vien: j.ma_ky_thuat_vien,
        ngay_den_han: j.ngay_den_han,
        luot_thuc_hien: j.luot_thuc_hien,
      },
      sau: fields,
    });
    return { ma_phieu_bao_tri: id };
  });
}
