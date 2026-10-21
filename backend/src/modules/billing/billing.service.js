import { reportPage } from "../report-exports/report-files.js";
import { createHash, randomBytes } from "node:crypto";
import { pool, rows, transaction } from "../../lib/db.js";
import { choice, fail, integer, text } from "../../lib/http.js";
import { lockApartment } from "./billing.guards.js";
import { vietQR } from "./billing.qr.js";
import * as v from "./billing.validation.js";
import { electricityConfig, electricityLines } from "./billing.electricity.js";

const json = (x) => (typeof x === "string" ? JSON.parse(x) : x);
function stable(x) {
  if (Array.isArray(x)) return x.map(stable);
  if (x && typeof x === "object")
    return Object.fromEntries(
      Object.keys(x)
        .sort()
        .map((k) => [k, stable(x[k])]),
    );
  return x;
}
const digest = (x) =>
  createHash("sha256")
    .update(JSON.stringify(stable(x)))
    .digest("hex");
const fixed = ["DA_DUYET", "DA_GUI", "DA_THANH_TOAN"];
const state = (row, allowed) => {
  if (!allowed.includes(row.trang_thai))
    fail(
      409,
      "INVALID_STATE",
      "Trạng thái hóa đơn không cho phép thao tác này.",
    );
};
const opts = (row, body = {}) =>
  v.options(
    Object.fromEntries(
      ["tinh_nuoc", "tinh_dien", "tinh_xe"].map((key) => [
        key,
        key in body ? body[key] : !!row[key],
      ]),
    ),
  );
async function log(db, id, user, event, note = "") {
  await rows(
    db,
    "INSERT INTO lich_su_hoa_don (ma_hoa_don,ma_nguoi_ghi,su_kien,ghi_chu) VALUES (?,?,?,?)",
    [id, user.ma_nguoi_dung, event, note],
  );
}

export async function rates(query) {
  const { page, offset } = v.pagination(query),
    values = [],
    where = [];
  if (query.loai_phi) {
    where.push("c.loai_phi=?");
    values.push(choice(query.loai_phi, "loai_phi", v.feeTypes));
  }
  const condition = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM cau_hinh_phi c ${condition}`,
    values,
  );
  const data = await rows(
    pool,
    `SELECT c.*,l.ten_phi,l.don_vi_tinh FROM cau_hinh_phi c JOIN loai_phi l ON l.loai_phi=c.loai_phi ${condition} ORDER BY c.ma_cau_hinh_phi DESC LIMIT 20 OFFSET ${offset}`,
    values,
  );
  return { data, total: count.total, page };
}
export async function createRate(body, user) {
  const type = choice(body.loai_phi, "loai_phi", v.feeTypes),
    config = electricityConfig(body, type),
    price =
      config.cach_tinh === "BAC_THANG"
        ? "0.00"
        : v.decimal(v.scaled(body.don_gia), 2),
    from = v.day(body.tu_ngay, true);
  return transaction(async (db) => {
    await rows(
      db,
      "SELECT loai_phi FROM loai_phi WHERE loai_phi=? FOR UPDATE",
      [type],
    );
    const [last] = await rows(
      db,
      "SELECT * FROM cau_hinh_phi WHERE loai_phi=? ORDER BY tu_ngay DESC LIMIT 1 FOR UPDATE",
      [type],
    );
    if (last) {
      if (from <= last.tu_ngay)
        fail(
          422,
          "RATE_ORDER",
          "Ngày áp dụng mới phải sau phiên bản giá gần nhất.",
        );
      const used = await rows(
        db,
        "SELECT h.ma_hoa_don FROM chi_tiet_hoa_don d JOIN hoa_don h ON h.ma_hoa_don=d.ma_hoa_don WHERE d.ma_cau_hinh_phi=? AND h.trang_thai<>'HUY' AND h.ngay_chot_phi>=? LIMIT 1",
        [last.ma_cau_hinh_phi, from],
      );
      if (used.length)
        fail(
          409,
          "RATE_IN_USE",
          "Ngày áp dụng mới trùng khoảng giá đã dùng. Chọn ngày sau ngày chốt hóa đơn đã lập.",
        );
      await rows(
        db,
        "UPDATE cau_hinh_phi SET den_ngay=? WHERE ma_cau_hinh_phi=?",
        [from, last.ma_cau_hinh_phi],
      );
    }
    const result = await rows(
      db,
      "INSERT INTO cau_hinh_phi (loai_phi,don_gia,tu_ngay,ma_nguoi_tao,cach_tinh,thue_gtgt,bac_dien) VALUES (?,?,?,?,?,?,?)",
      [
        type,
        price,
        from,
        user.ma_nguoi_dung,
        config.cach_tinh,
        config.thue_gtgt,
        config.bac_dien === null ? null : JSON.stringify(config.bac_dien),
      ],
    );
    return { ma_cau_hinh_phi: result.insertId };
  });
}
export async function meters(query, exportFormat = null) {
  const { page, offset, limit, check } = reportPage(query, exportFormat),
    values = [],
    where = [];
  if (query.ma_can_ho) {
    where.push("m.ma_can_ho=?");
    values.push(integer(query.ma_can_ho, "ma_can_ho"));
  }
  if (query.ky_thanh_toan) {
    where.push("m.ky_thanh_toan=?");
    values.push(v.period(query.ky_thanh_toan));
  }
  const condition = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM chi_so_dich_vu m ${condition}`,
    values,
  );
  check(count.total);
  const data = await rows(
    pool,
    `SELECT m.*,a.so_can_ho FROM chi_so_dich_vu m JOIN can_ho a ON a.ma_can_ho=m.ma_can_ho ${condition} ORDER BY m.ky_thanh_toan DESC,m.ma_chi_so_dich_vu DESC LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return { data, total: count.total, page };
}
export async function saveMeter(body, user, connection = null) {
  const apartmentId = integer(body.ma_can_ho, "ma_can_ho"),
    type = choice(body.loai_dich_vu, "loai_dich_vu", ["DIEN", "NUOC"]),
    month = v.period(body.ky_thanh_toan),
    day = v.monthDay(body.ngay_chot, month);
  const old = v.scaled(body.chi_so_cu, 3, 9),
    next = v.scaled(body.chi_so_moi, 3, 9),
    note = text(body.ghi_chu ?? "", "ghi_chu", 0, 255);
  if (next < old)
    fail(422, "METER_DECREASE", "Chỉ số mới không được nhỏ hơn chỉ số cũ.");
  return transaction(async (db) => {
    await lockApartment(db, apartmentId);
    const billed = await rows(
      db,
      "SELECT ma_hoa_don FROM hoa_don WHERE ma_can_ho=? AND ky_thanh_toan=? AND trang_thai IN ('DA_DUYET','DA_GUI','DA_THANH_TOAN') LIMIT 1 FOR UPDATE",
      [apartmentId, month],
    );
    if (billed.length)
      fail(
        409,
        "METER_LOCKED",
        "Kỳ này đã có hóa đơn được duyệt. Hủy hóa đơn chưa thanh toán trước khi điều chỉnh chỉ số.",
      );
    const records = await rows(
      db,
      "SELECT * FROM chi_so_dich_vu WHERE ma_can_ho=? AND loai_dich_vu=? ORDER BY ky_thanh_toan DESC FOR UPDATE",
      [apartmentId, type],
    );
    if (records[0]?.ky_thanh_toan > month)
      fail(
        409,
        "METER_LATER_PERIOD",
        "Chỉ ghi hoặc sửa kỳ mới nhất; đã có chỉ số kỳ sau.",
      );
    const current = records.find((r) => r.ky_thanh_toan === month),
      previous = records.find((r) => r.ky_thanh_toan < month);
    if (previous) {
      const prior = new Date(`${month}-01T00:00:00Z`);
      prior.setUTCMonth(prior.getUTCMonth() - 1);
      if (previous.ky_thanh_toan !== prior.toISOString().slice(0, 7))
        fail(
          422,
          "MISSING_PREVIOUS_METER",
          "Thiếu chỉ số kỳ liền trước. Hãy bổ sung trước khi ghi kỳ này.",
        );
      if (old !== v.scaled(previous.chi_so_moi, 3, 9))
        fail(
          422,
          "METER_CHAIN",
          "Chỉ số cũ phải bằng chỉ số mới của kỳ liền trước.",
        );
    } else if (!current && body.ky_dau !== true)
      fail(
        422,
        "FIRST_METER",
        "Kỳ đầu cần xác nhận nhập cả chỉ số đầu và cuối.",
      );
    if (current) {
      v.version(current, body.phien_ban);
      await rows(
        db,
        "UPDATE chi_so_dich_vu SET chi_so_cu=?,chi_so_moi=?,ngay_chot=?,ghi_chu=?,ma_nguoi_ghi=?,ngay_ghi=CURRENT_TIMESTAMP,phien_ban=phien_ban+1 WHERE ma_chi_so_dich_vu=?",
        [
          v.decimal(old, 3),
          v.decimal(next, 3),
          day,
          note,
          user.ma_nguoi_dung,
          current.ma_chi_so_dich_vu,
        ],
      );
      return { ma_chi_so_dich_vu: current.ma_chi_so_dich_vu };
    }
    const result = await rows(
      db,
      "INSERT INTO chi_so_dich_vu (ma_can_ho,loai_dich_vu,ky_thanh_toan,chi_so_cu,chi_so_moi,ngay_chot,ghi_chu,ma_nguoi_ghi) VALUES (?,?,?,?,?,?,?,?)",
      [
        apartmentId,
        type,
        month,
        v.decimal(old, 3),
        v.decimal(next, 3),
        day,
        note,
        user.ma_nguoi_dung,
      ],
    );
    return { ma_chi_so_dich_vu: result.insertId };
  }, connection);
}

async function calculate(db, apartment, month, day, options) {
  await rows(db, "SELECT loai_phi FROM loai_phi ORDER BY loai_phi FOR UPDATE");
  const rates = await rows(
    db,
    "SELECT c.*,l.ten_phi,l.don_vi_tinh FROM cau_hinh_phi c JOIN loai_phi l ON l.loai_phi=c.loai_phi WHERE c.tu_ngay<=? AND (c.den_ngay IS NULL OR c.den_ngay>?) ORDER BY c.loai_phi FOR UPDATE",
    [day, day],
  );
  const meters = await rows(
    db,
    "SELECT * FROM chi_so_dich_vu WHERE ma_can_ho=? AND ky_thanh_toan=? ORDER BY loai_dich_vu FOR UPDATE",
    [apartment.ma_can_ho, month],
  );
  const cars = options.tinh_xe
    ? await rows(
        db,
        "SELECT ma_phuong_tien,loai_xe FROM phuong_tien WHERE ma_can_ho=? AND ngay_dang_ky<=? AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc>?) ORDER BY ma_phuong_tien FOR UPDATE",
        [apartment.ma_can_ho, day, day],
      )
    : [];
  const lines = [],
    errors = [];
  function add(type, quantity, source = {}, meterId = null) {
    const rate = rates.find((r) => r.loai_phi === type);
    if (!rate) {
      errors.push(`Thiếu đơn giá ${type} tại ngày chốt.`);
      return;
    }
    const qty = v.decimal(v.scaled(quantity, 3, 9), 3),
      price = v.decimal(v.scaled(rate.don_gia), 2);
    lines.push({
      loai_phi: type,
      dien_giai: rate.ten_phi,
      don_vi_tinh: rate.don_vi_tinh,
      so_luong: qty,
      don_gia: price,
      thanh_tien: v.lineTotal(qty, price),
      ma_cau_hinh_phi: rate.ma_cau_hinh_phi,
      ma_chi_so_dich_vu: meterId,
      du_lieu_nguon: source,
    });
  }
  if (apartment.tinh_phi_dich_vu) add("PHI_QUAN_LY", apartment.dien_tich_m2);
  if (options.tinh_xe)
    for (const [type, fee] of [
      ["O_TO", "GUI_O_TO"],
      ["XE_MAY", "GUI_XE_MAY"],
      ["XE_DAP", "GUI_XE_DAP"],
    ]) {
      const selected = cars.filter((r) => r.loai_xe === type);
      if (selected.length)
        add(fee, String(selected.length), {
          ma_dang_ky: selected.map((r) => r.ma_phuong_tien),
        });
    }
  for (const [type, enabled] of [
    ["NUOC", options.tinh_nuoc],
    ["DIEN", options.tinh_dien],
  ])
    if (enabled) {
      const meter = meters.find((r) => r.loai_dich_vu === type);
      if (!meter || meter.ngay_chot !== day) {
        errors.push(`Thiếu chỉ số ${type} đúng ngày chốt ${day}.`);
        continue;
      }
      const used =
        v.scaled(meter.chi_so_moi, 3, 9) - v.scaled(meter.chi_so_cu, 3, 9);
      if (type === "DIEN") {
        const rate = rates.find((r) => r.loai_phi === "TIEN_DIEN");
        if (!rate) errors.push("Thiếu đơn giá TIEN_DIEN tại ngày chốt.");
        else {
          // Preserve legacy flat/no-VAT snapshots byte-for-byte for existing drafts.
          if (rate.cach_tinh === "BAC_THANG" || v.scaled(rate.thue_gtgt) > 0n) {
            lines.push(
              ...electricityLines(
                rate,
                used,
                {
                  chi_so_cu: meter.chi_so_cu,
                  chi_so_moi: meter.chi_so_moi,
                  phien_ban: meter.phien_ban,
                },
                meter.ma_chi_so_dich_vu,
              ),
            );
            continue;
          }
        }
        if (!rate) continue;
      }
      add(
        `TIEN_${type}`,
        v.decimal(used, 3),
        {
          chi_so_cu: meter.chi_so_cu,
          chi_so_moi: meter.chi_so_moi,
          phien_ban: meter.phien_ban,
        },
        meter.ma_chi_so_dich_vu,
      );
    }
  if (!lines.length) errors.push("Chưa có khoản phí hợp lệ được áp dụng.");
  const total = lines.reduce((n, l) => n + BigInt(l.thanh_tien), 0n);
  if (total > 99999999999999n)
    fail(422, "AMOUNT_TOO_LARGE", "Tổng hóa đơn vượt giới hạn.");
  return {
    lines,
    errors,
    total: total.toString(),
    hash: digest({ lines, errors }),
  };
}
async function storeSnapshot(db, id, snapshot) {
  await rows(db, "DELETE FROM chi_tiet_hoa_don WHERE ma_hoa_don=?", [id]);
  for (const l of snapshot.lines)
    await rows(
      db,
      "INSERT INTO chi_tiet_hoa_don (ma_hoa_don,ma_cau_hinh_phi,ma_chi_so_dich_vu,loai_phi,dien_giai,don_vi_tinh,so_luong,don_gia,thanh_tien,du_lieu_nguon) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [
        id,
        l.ma_cau_hinh_phi,
        l.ma_chi_so_dich_vu,
        l.loai_phi,
        l.dien_giai,
        l.don_vi_tinh,
        l.so_luong,
        l.don_gia,
        l.thanh_tien,
        JSON.stringify(l.du_lieu_nguon),
      ],
    );
  await rows(
    db,
    "UPDATE hoa_don SET tong_tien=?,loi_du_lieu=?,dau_van_tay=? WHERE ma_hoa_don=?",
    [snapshot.total, JSON.stringify(snapshot.errors), snapshot.hash, id],
  );
}
export async function prepareDraft(db, apartment, body, previous = null) {
  const month = v.period(body.ky_thanh_toan),
    day = v.monthDay(body.ngay_chot_phi, month),
    options = v.options(body);
  const existing = await rows(
    db,
    "SELECT * FROM hoa_don WHERE ma_can_ho=? AND ky_thanh_toan=? ORDER BY lan_lap DESC FOR UPDATE",
    [apartment.ma_can_ho, month],
  );
  if (existing.some((h) => h.trang_thai !== "HUY"))
    fail(
      409,
      "BILL_EXISTS",
      "Căn đã có hóa đơn còn hiệu lực trong kỳ. Mở hóa đơn nháp để tính lại.",
    );
  if (
    existing.length &&
    (!previous || existing[0].ma_hoa_don !== previous.ma_hoa_don)
  )
    fail(
      409,
      "REPLACEMENT_REQUIRED",
      "Hãy lập thay thế từ hóa đơn hủy gần nhất.",
    );
  const snapshot = await calculate(db, apartment, month, day, options);
  return { month, day, options, existing, snapshot };
}
async function makeDraft(db, apartment, body, user, previous = null) {
  const { month, day, options, existing, snapshot } = await prepareDraft(
    db,
    apartment,
    body,
    previous,
  );
  const result = await rows(
    db,
    "INSERT INTO hoa_don (so_hoa_don,ma_can_ho,ky_thanh_toan,ngay_chot_phi,lan_lap,tinh_nuoc,tinh_dien,tinh_xe,loi_du_lieu,dau_van_tay,ma_nguoi_lap,ma_hoa_don_thay_the_cho) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    [
      `HD${month.replace("-", "")}-${randomBytes(6).toString("hex").toUpperCase()}`,
      apartment.ma_can_ho,
      month,
      day,
      (existing[0]?.lan_lap || 0) + 1,
      options.tinh_nuoc,
      options.tinh_dien,
      options.tinh_xe,
      "[]",
      snapshot.hash,
      user.ma_nguoi_dung,
      previous?.ma_hoa_don || null,
    ],
  );
  await storeSnapshot(db, result.insertId, snapshot);
  await log(db, result.insertId, user, previous ? "LAP_THAY_THE" : "LAP_NHAP");
  return { ma_hoa_don: result.insertId };
}
export async function generate(body, user, connection = null) {
  const id = integer(body.ma_can_ho, "ma_can_ho");
  return transaction(
    async (db) => makeDraft(db, await lockApartment(db, id), body, user),
    connection,
  );
}
async function lockedBill(db, id) {
  const [row] = await rows(
    db,
    "SELECT ma_can_ho FROM hoa_don WHERE ma_hoa_don=?",
    [id],
  );
  if (!row) fail(404, "NOT_FOUND", "Không tìm thấy hóa đơn.");
  const apartment = await lockApartment(db, row.ma_can_ho);
  const [bill] = await rows(
    db,
    "SELECT * FROM hoa_don WHERE ma_hoa_don=? FOR UPDATE",
    [id],
  );
  return { bill, apartment };
}
export function paymentDetails(body, cutoff = "1900-01-01", checkToday = true) {
  const due = v.day(body.han_thanh_toan, true),
    bin = text(body.ma_ngan_hang, "ma_ngan_hang", 6, 6),
    account = text(body.so_tai_khoan, "so_tai_khoan", 6, 30),
    name = text(body.ten_nguoi_nhan, "ten_nguoi_nhan", 2, 100);
  if (
    due < cutoff ||
    (checkToday && due < v.today()) ||
    !/^\d{6}$/.test(bin) ||
    !/^\d{6,30}$/.test(account)
  )
    fail(
      422,
      "INVALID_PAYMENT_DETAILS",
      "Hạn trả phải từ hôm nay và không trước ngày chốt; BIN gồm 6 số, tài khoản gồm 6–30 số.",
    );
  return {
    han_thanh_toan: due,
    ma_ngan_hang: bin,
    so_tai_khoan: account,
    ten_nguoi_nhan: name,
  };
}
export async function prepareBillAction(db, bill, apartment, operation, body) {
  v.version(bill, body.phien_ban);
  if (operation === "duyet") {
    state(bill, ["NHAP"]);
    const current = await calculate(
      db,
      apartment,
      bill.ky_thanh_toan,
      bill.ngay_chot_phi,
      opts(bill),
    );
    if (current.errors.length || BigInt(current.total) <= 0n)
      fail(
        422,
        "INCOMPLETE_BILL",
        "Hóa đơn còn thiếu dữ liệu hoặc tổng bằng 0. Bổ sung và tính lại bản nháp.",
      );
    if (current.hash !== bill.dau_van_tay || current.total !== bill.tong_tien)
      fail(
        409,
        "STALE_BILL_SOURCE",
        "Dữ liệu nguồn đã thay đổi. Hãy tính lại bản nháp trước khi duyệt.",
      );
    const saved = await rows(
      db,
      "SELECT * FROM chi_tiet_hoa_don WHERE ma_hoa_don=? ORDER BY ma_chi_tiet_hoa_don",
      [bill.ma_hoa_don],
    );
    const lines = saved.map(({ ma_hoa_don, ma_chi_tiet_hoa_don, ...l }) => ({
      ...l,
      du_lieu_nguon: json(l.du_lieu_nguon),
    }));
    if (digest({ lines, errors: json(bill.loi_du_lieu) }) !== bill.dau_van_tay)
      fail(
        409,
        "BILL_TOTAL_MISMATCH",
        "Chi tiết hóa đơn không khớp dữ liệu đã lập. Hãy tính lại.",
      );
    return {};
  }
  state(bill, ["DA_DUYET"]);
  return paymentDetails(body, bill.ngay_chot_phi);
}

export async function action(id, action, body, user, connection = null) {
  return transaction(async (db) => {
    const { bill, apartment } = await lockedBill(db, id);
    if (
      action === "xac_nhan_thanh_toan" &&
      bill.trang_thai === "DA_THANH_TOAN"
    ) {
      if (
        v.amount(body.so_tien).toString() === bill.so_tien_da_thu &&
        text(body.ma_tham_chieu, "ma_tham_chieu", 3, 100) === bill.ma_tham_chieu
      )
        return { ma_hoa_don: id };
      fail(409, "ALREADY_PAID", "Hóa đơn đã được xác nhận thu.");
    }
    v.version(bill, body.phien_ban);
    if (action === "lap_thay_the") {
      state(bill, ["HUY"]);
      return makeDraft(
        db,
        apartment,
        {
          ky_thanh_toan: bill.ky_thanh_toan,
          ngay_chot_phi: body.ngay_chot_phi ?? bill.ngay_chot_phi,
          ...opts(bill, body),
        },
        user,
        bill,
      );
    }
    if (action === "tinh_lai") {
      state(bill, ["NHAP"]);
      const day = v.monthDay(
          body.ngay_chot_phi ?? bill.ngay_chot_phi,
          bill.ky_thanh_toan,
        ),
        options = opts(bill, body);
      await storeSnapshot(
        db,
        id,
        await calculate(db, apartment, bill.ky_thanh_toan, day, options),
      );
      await rows(
        db,
        "UPDATE hoa_don SET ngay_chot_phi=?,tinh_nuoc=?,tinh_dien=?,tinh_xe=? WHERE ma_hoa_don=?",
        [day, options.tinh_nuoc, options.tinh_dien, options.tinh_xe, id],
      );
    } else if (action === "duyet") {
      await prepareBillAction(db, bill, apartment, action, body);
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='DA_DUYET',ma_nguoi_duyet=?,ngay_duyet=CURRENT_TIMESTAMP WHERE ma_hoa_don=?",
        [user.ma_nguoi_dung, id],
      );
    } else if (action === "gui") {
      state(bill, ["DA_DUYET"]);
      const details = await prepareBillAction(
        db,
        bill,
        apartment,
        action,
        body,
      );
      const {
        han_thanh_toan: due,
        ma_ngan_hang: bin,
        so_tai_khoan: account,
        ten_nguoi_nhan: name,
      } = details;
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='DA_GUI',han_thanh_toan=?,ma_ngan_hang=?,so_tai_khoan=?,ten_nguoi_nhan=?,ma_nguoi_gui=?,ngay_gui=CURRENT_TIMESTAMP WHERE ma_hoa_don=?",
        [due, bin, account, name, user.ma_nguoi_dung, id],
      );
    } else if (action === "huy") {
      state(bill, ["NHAP", "DA_DUYET", "DA_GUI"]);
      const reason = text(body.ly_do, "ly_do", 3, 255);
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='HUY',ly_do_huy=?,ma_nguoi_huy=?,ngay_huy=CURRENT_TIMESTAMP WHERE ma_hoa_don=?",
        [reason, user.ma_nguoi_dung, id],
      );
    } else if (action === "xac_nhan_thanh_toan") {
      state(bill, ["DA_GUI"]);
      const amount = v.amount(body.so_tien),
        reference = text(body.ma_tham_chieu, "ma_tham_chieu", 3, 100);
      if (amount !== BigInt(bill.tong_tien))
        fail(
          422,
          "WRONG_AMOUNT",
          "Chỉ xác nhận khi số tiền đã đối soát bằng đúng tổng hóa đơn.",
        );
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='DA_THANH_TOAN',so_tien_da_thu=?,ma_tham_chieu=?,ma_nguoi_xac_nhan=?,ngay_thanh_toan=UTC_TIMESTAMP() WHERE ma_hoa_don=?",
        [amount.toString(), reference, user.ma_nguoi_dung, id],
      );
    } else fail(404, "NOT_FOUND", "Không có thao tác hóa đơn này.");
    await rows(
      db,
      "UPDATE hoa_don SET phien_ban=phien_ban+1 WHERE ma_hoa_don=?",
      [id],
    );
    await log(
      db,
      id,
      user,
      action.toUpperCase(),
      action === "huy" ? text(body.ly_do, "ly_do", 3, 255) : "",
    );
    return { ma_hoa_don: id };
  }, connection);
}

function access(user, where, values) {
  if (user.vai_tro === "QUAN_TRI_VIEN") return;
  if (user.vai_tro !== "CU_DAN")
    fail(403, "FORBIDDEN", "Bạn không có quyền xem hóa đơn.");
  if (user.ma_can_ho_thanh_toan !== null) {
    where.push(
      "h.trang_thai IN ('DA_GUI','DA_THANH_TOAN') AND EXISTS (SELECT 1 FROM nguoi_dung u WHERE u.ma_nguoi_dung=? AND u.ma_can_ho_thanh_toan=h.ma_can_ho AND u.dang_hoat_dong=1 AND u.phien_ban_token=?)",
    );
    values.push(user.ma_nguoi_dung, user.phien_ban_token);
  } else {
    where.push(
      "h.trang_thai IN ('DA_GUI','DA_THANH_TOAN') AND EXISTS (SELECT 1 FROM cu_dan c JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan WHERE c.ma_nguoi_dung=? AND l.ma_can_ho=h.ma_can_ho AND l.den_ngay IS NULL AND l.tu_ngay<=h.ngay_chot_phi)",
    );
    values.push(user.ma_nguoi_dung);
  }
}
function summary(bill) {
  return {
    ...bill,
    qua_han: bill.trang_thai === "DA_GUI" && bill.han_thanh_toan < v.today(),
  };
}
export async function list(query, user, exportFormat = null) {
  const { page, offset, limit, check } = reportPage(query, exportFormat),
    where = [],
    values = [];
  access(user, where, values);
  if (query.ky_thanh_toan) {
    where.push("h.ky_thanh_toan=?");
    values.push(v.period(query.ky_thanh_toan));
  }
  if (query.trang_thai) {
    where.push("h.trang_thai=?");
    values.push(
      choice(query.trang_thai, "trang_thai", [
        "NHAP",
        "DA_DUYET",
        "DA_GUI",
        "DA_THANH_TOAN",
        "HUY",
      ]),
    );
  }
  if (query.ma_can_ho) {
    where.push("h.ma_can_ho=?");
    values.push(integer(query.ma_can_ho, "ma_can_ho"));
  }
  if (query.q) {
    const q = text(query.q, "q", 1, 100);
    where.push("(h.so_hoa_don LIKE ? OR a.so_can_ho LIKE ?)");
    values.push(`%${q}%`, `%${q}%`);
  }
  const condition = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [count] = await rows(
    pool,
    `SELECT COUNT(*) AS total FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho ${condition}`,
    values,
  );
  check(count.total);
  const data = await rows(
    pool,
    `SELECT h.ma_hoa_don,h.so_hoa_don,h.ky_thanh_toan,h.ngay_chot_phi,h.trang_thai,h.phien_ban,h.tong_tien,h.han_thanh_toan,a.so_can_ho FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho ${condition} ORDER BY h.ma_hoa_don DESC LIMIT ${exportFormat ? limit + 1 : limit} OFFSET ${offset}`,
    values,
  );
  check(data.length);
  return { data: data.map(summary), total: count.total, page };
}
export async function detail(id, user) {
  const where = ["h.ma_hoa_don=?"],
    values = [id];
  access(user, where, values);
  const [row] = await rows(
    pool,
    `SELECT h.*,a.so_can_ho,c.ho_va_ten AS nguoi_phu_trach_thanh_toan FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho LEFT JOIN nguoi_dung tk ON tk.ma_can_ho_thanh_toan=h.ma_can_ho LEFT JOIN cu_dan c ON c.ma_cu_dan=tk.ma_cu_dan_phu_trach WHERE ${where.join(" AND ")}`,
    values,
  );
  if (!row)
    fail(
      404,
      "NOT_FOUND",
      "Không tìm thấy hóa đơn hoặc bạn không còn quyền xem.",
    );
  const lines = await rows(
    pool,
    "SELECT * FROM chi_tiet_hoa_don WHERE ma_hoa_don=? ORDER BY ma_chi_tiet_hoa_don",
    [id],
  );
  if (user.vai_tro === "QUAN_TRI_VIEN")
    return {
      ...summary(row),
      loi_du_lieu: json(row.loi_du_lieu),
      lines: lines.map((l) => ({ ...l, du_lieu_nguon: json(l.du_lieu_nguon) })),
      history: await rows(
        pool,
        "SELECT l.*,u.ho_va_ten FROM lich_su_hoa_don l JOIN nguoi_dung u ON u.ma_nguoi_dung=l.ma_nguoi_ghi WHERE ma_hoa_don=? ORDER BY l.ma_lich_su_hoa_don",
        [id],
      ),
      qr_payload: vietQR(row),
    };
  const allowed = [
    "ma_hoa_don",
    "so_hoa_don",
    "so_can_ho",
    "nguoi_phu_trach_thanh_toan",
    "ky_thanh_toan",
    "ngay_chot_phi",
    "trang_thai",
    "tong_tien",
    "han_thanh_toan",
    "ma_ngan_hang",
    "so_tai_khoan",
    "ten_nguoi_nhan",
    "ngay_thanh_toan",
    "so_tien_da_thu",
    "ma_tham_chieu",
  ];
  return {
    ...summary(Object.fromEntries(allowed.map((k) => [k, row[k]]))),
    lines: lines.map((l) =>
      Object.fromEntries(
        ["dien_giai", "don_vi_tinh", "so_luong", "don_gia", "thanh_tien"].map(
          (k) => [k, l[k]],
        ),
      ),
    ),
    qr_payload: vietQR(row),
  };
}
