# Cập nhật điện bậc thang trong VS Code

> Sau khi có tài khoản căn hộ (007–008), dùng [hướng dẫn tài khoản căn mới nhất](cap-nhat-tai-khoan-can-ho-vscode.md) cho các file trùng tên; không chép bản cũ đè lên thay đổi mới.

> Nếu đã cập nhật giao diện chọn ngân hàng/QR, dùng [bản giao diện mới](cap-nhat-giao-dien-thanh-toan-vscode.md) cho file Billing.jsx; không chép lại giao diện cũ bên dưới đè lên bản mới.

Bản cập nhật tiếp theo sau phí và hóa đơn (commit `c61a3c4`, migration 005). Không cần tải ZIP: tạo/thay đầy đủ **5 file** bên dưới. Nếu chưa có module hóa đơn, làm [bản hóa đơn ban đầu](cap-nhat-hoa-don-vscode.md) trước, rồi áp dụng bản này. Không cần cài thêm dependency.

## Chuẩn bị

Dừng backend/frontend bằng Ctrl+C, lưu bản riêng nếu đã tự sửa các file liên quan. Giữ `.env`, `.certs`, ảnh và database. Giữ nguyên migration 001–005 đã chạy; chỉ thêm migration 006. Migration mới giữ giá cũ là một đơn giá/0% thuế và không thay đổi hóa đơn đã lưu. Nháp điện đơn giá cũ vẫn tương thích.

## Quy tắc và ví dụ

- Điện tiêu thụ = chỉ số cuối − chỉ số đầu. Chia lần lượt theo ngưỡng cộng dồn, phần vượt tính ở bậc tiếp theo; không lấy giá bậc cao nhất nhân toàn bộ kWh.
- Ngưỡng và giá, thuế đều nhập được theo từng phiên bản ngày hiệu lực. Cho phép 2–12 bậc, ngưỡng nguyên tăng dần, bậc cuối không giới hạn. Bản mới kết thúc khoảng của bản trước; không sửa trực tiếp biểu giá đã lưu.
- Từng bậc làm tròn half-up đến đồng, cộng tiền điện trước thuế. Thuế điện làm tròn half-up trên số đó, thành dòng khoản thu riêng; không đánh thuế điện lên phí nước/xe/quản lý. Hóa đơn lưu từng dòng bậc, giá, lượng và chi tiết thuế, không đổi sau khi duyệt khi thêm biểu giá mới.
- Một căn/định mức, một biểu giá tại ngày chốt cho toàn kỳ. Chưa tách kỳ đổi giá, phân bổ theo ngày đọc công tơ hoặc định mức nhiều hộ. Đối chiếu hồ sơ thu điện trước khi duyệt trong các trường hợp này.
- Công tơ đứng tên cư dân và thanh toán trực tiếp cho EVN: bỏ chọn **BQL thu tiền điện** để tránh thu trùng. Chỉ dùng đơn giá một mức khi phù hợp hồ sơ thu điện thực tế, không coi chế độ này là xác nhận tính hợp pháp của mức thu.

Mẫu dưới đây theo số liệu người dùng cung cấp, **chưa xác minh là biểu giá/thuế còn hiệu lực**. Nút điền mẫu chỉ điền biểu mẫu để xem/sửa; không tự seed database. Với 300 kWh:

| Khoản | Số lượng | Đơn giá | Thành tiền |
|---|---:|---:|---:|
| Bậc 1 | 50 kWh | 1.984 | 99.200 |
| Bậc 2 | 50 kWh | 2.050 | 102.500 |
| Bậc 3 | 100 kWh | 2.380 | 238.000 |
| Bậc 4 | 100 kWh | 2.998 | 299.800 |
| Trước thuế | | | 739.500 |
| Thuế GTGT 8% | | | 59.160 |
| Tổng tiền điện | | | **798.660 đồng** |

## 1. `database/migrations/006_electricity_tiers.sql`

Tạo file mới.

```sql
ALTER TABLE cau_hinh_phi
  ADD COLUMN cach_tinh ENUM('DON_GIA','BAC_THANG') NOT NULL DEFAULT 'DON_GIA',
  ADD COLUMN thue_gtgt DECIMAL(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN bac_dien JSON NULL,
  ADD CONSTRAINT chk_fee_vat CHECK (thue_gtgt >= 0 AND thue_gtgt <= 100),
  ADD CONSTRAINT chk_fee_electricity CHECK (
    (loai_phi='TIEN_DIEN' AND (
      (cach_tinh='DON_GIA' AND bac_dien IS NULL) OR
      (cach_tinh='BAC_THANG' AND bac_dien IS NOT NULL AND don_gia=0)
    )) OR
    (loai_phi<>'TIEN_DIEN' AND cach_tinh='DON_GIA' AND thue_gtgt=0 AND bac_dien IS NULL)
  );
ALTER TABLE chi_tiet_hoa_don MODIFY COLUMN don_gia DECIMAL(16,2) NOT NULL;
```

## 2. `backend/src/modules/billing/billing.electricity.js`

Tạo file mới.

```js
import { choice, fail } from "../../lib/http.js";
import * as v from "./billing.validation.js";

// Quantities use 3 decimal places, prices 2. No floating point money arithmetic.
export function electricityConfig(body, type) {
  const method = choice(body.cach_tinh ?? "DON_GIA", "cach_tinh", [
    "DON_GIA",
    "BAC_THANG",
  ]);
  const vat = v.scaled(body.thue_gtgt ?? "0", 2, 3);
  if (vat > 10000n) fail(422, "INVALID_VAT", "Thuế GTGT phải từ 0 đến 100%.");
  const invalid = () =>
    fail(
      422,
      "INVALID_TIERS",
      "Các bậc cần ngưỡng kWh nguyên tăng dần, giá không âm và bậc cuối không giới hạn.",
    );
  if (
    type !== "TIEN_DIEN" &&
    (method !== "DON_GIA" || vat !== 0n || body.bac_dien != null)
  )
    fail(
      422,
      "ELECTRICITY_ONLY",
      "Bậc thang và thuế riêng chỉ áp dụng cho tiền điện.",
    );
  if (method === "DON_GIA") {
    if (body.bac_dien != null) invalid();
    return { cach_tinh: method, thue_gtgt: v.decimal(vat, 2), bac_dien: null };
  }
  if (
    !Array.isArray(body.bac_dien) ||
    body.bac_dien.length < 2 ||
    body.bac_dien.length > 12
  )
    invalid();
  let previous = 0;
  const tiers = body.bac_dien.map((tier, index, all) => {
    if (!tier || typeof tier !== "object" || Array.isArray(tier)) invalid();
    const upper = tier.den_kwh;
    if (index === all.length - 1) {
      if (upper !== null) invalid();
    } else {
      if (
        !Number.isSafeInteger(upper) ||
        upper <= previous ||
        upper > 999999999
      )
        invalid();
      previous = upper;
    }
    return { den_kwh: upper, don_gia: v.decimal(v.scaled(tier.don_gia), 2) };
  });
  return { cach_tinh: method, thue_gtgt: v.decimal(vat, 2), bac_dien: tiers };
}

export function electricityLines(rate, used, source, meterId) {
  const tiers =
    typeof rate.bac_dien === "string"
      ? JSON.parse(rate.bac_dien)
      : rate.bac_dien;
  const config = electricityConfig({ ...rate, bac_dien: tiers }, "TIEN_DIEN");
  const lines = [];
  const add = (
    qty,
    price,
    label,
    unit,
    extra,
    total = v.lineTotal(qty, price),
  ) => {
    lines.push({
      loai_phi: "TIEN_DIEN",
      dien_giai: label,
      don_vi_tinh: unit,
      so_luong: qty,
      don_gia: price,
      thanh_tien: total,
      ma_cau_hinh_phi: rate.ma_cau_hinh_phi,
      ma_chi_so_dich_vu: meterId,
      du_lieu_nguon: { ...source, cach_tinh: config.cach_tinh, ...extra },
    });
  };
  if (config.cach_tinh === "DON_GIA") {
    add(
      v.decimal(used, 3),
      v.decimal(v.scaled(rate.don_gia), 2),
      "Tiền điện",
      "kWh",
      {},
    );
  } else {
    let lower = 0n,
      remaining = used;
    for (const [index, tier] of config.bac_dien.entries()) {
      const upper = tier.den_kwh === null ? null : BigInt(tier.den_kwh) * 1000n;
      const quantity =
        upper === null || remaining < upper - lower ? remaining : upper - lower;
      if (quantity > 0n || (used === 0n && index === 0))
        add(
          v.decimal(quantity, 3),
          tier.don_gia,
          `Tiền điện bậc ${index + 1} (${lower / 1000n}–${upper === null ? "không giới hạn" : upper / 1000n} kWh)`,
          "kWh",
          {
            bac: index + 1,
            tu_kwh: Number(lower / 1000n),
            den_kwh: tier.den_kwh,
          },
        );
      remaining -= quantity;
      if (remaining === 0n) break;
      lower = upper;
    }
  }
  const base = lines.reduce((sum, line) => sum + BigInt(line.thanh_tien), 0n);
  const vat = v.scaled(config.thue_gtgt, 2, 3);
  if (vat > 0n) {
    const tax = (base * vat + 5000n) / 10000n;
    if (tax > 99999999999999n)
      fail(422, "AMOUNT_TOO_LARGE", "Thuế điện vượt giới hạn.");
    // One tax charge, whose unit price is the tax amount (not the energy rate).
    add(
      "1.000",
      v.decimal(tax * 100n, 2),
      `Thuế GTGT điện ${config.thue_gtgt}% trên ${base.toLocaleString("vi-VN")} đ`,
      "khoản",
      {
        thue_gtgt: config.thue_gtgt,
        tien_truoc_thue: base.toString(),
      },
      tax.toString(),
    );
  }
  return lines;
}
```

## 3. `backend/src/modules/billing/billing.service.js`

Thay toàn bộ nội dung file.

```js
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
export async function meters(query) {
  const { page, offset } = v.pagination(query),
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
  const data = await rows(
    pool,
    `SELECT m.*,a.so_can_ho FROM chi_so_dich_vu m JOIN can_ho a ON a.ma_can_ho=m.ma_can_ho ${condition} ORDER BY m.ky_thanh_toan DESC,m.ma_chi_so_dich_vu DESC LIMIT 20 OFFSET ${offset}`,
    values,
  );
  return { data, total: count.total, page };
}
export async function saveMeter(body, user) {
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
  });
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
async function makeDraft(db, apartment, body, user, previous = null) {
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
export async function generate(body, user) {
  const id = integer(body.ma_can_ho, "ma_can_ho");
  return transaction(async (db) =>
    makeDraft(db, await lockApartment(db, id), body, user),
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
export async function action(id, action, body, user) {
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
        [id],
      );
      const lines = saved.map(({ ma_hoa_don, ma_chi_tiet_hoa_don, ...l }) => ({
        ...l,
        du_lieu_nguon: json(l.du_lieu_nguon),
      }));
      if (
        digest({ lines, errors: json(bill.loi_du_lieu) }) !== bill.dau_van_tay
      )
        fail(
          409,
          "BILL_TOTAL_MISMATCH",
          "Chi tiết hóa đơn không khớp dữ liệu đã lập. Hãy tính lại.",
        );
      await rows(
        db,
        "UPDATE hoa_don SET trang_thai='DA_DUYET',ma_nguoi_duyet=?,ngay_duyet=CURRENT_TIMESTAMP WHERE ma_hoa_don=?",
        [user.ma_nguoi_dung, id],
      );
    } else if (action === "gui") {
      state(bill, ["DA_DUYET"]);
      const due = v.day(body.han_thanh_toan, true),
        bin = text(body.ma_ngan_hang, "ma_ngan_hang", 6, 6),
        account = text(body.so_tai_khoan, "so_tai_khoan", 6, 30),
        name = text(body.ten_nguoi_nhan, "ten_nguoi_nhan", 2, 100);
      if (
        due < bill.ngay_chot_phi ||
        due < v.today() ||
        !/^\d{6}$/.test(bin) ||
        !/^\d{6,30}$/.test(account)
      )
        fail(
          422,
          "INVALID_PAYMENT_DETAILS",
          "Hạn trả phải từ hôm nay và không trước ngày chốt; BIN gồm 6 số, tài khoản gồm 6–30 số.",
        );
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
        "UPDATE hoa_don SET trang_thai='DA_THANH_TOAN',so_tien_da_thu=?,ma_tham_chieu=?,ma_nguoi_xac_nhan=?,ngay_thanh_toan=CURRENT_TIMESTAMP WHERE ma_hoa_don=?",
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
  });
}

function access(user, where, values) {
  if (user.vai_tro === "QUAN_TRI_VIEN") return;
  if (user.vai_tro !== "CU_DAN")
    fail(403, "FORBIDDEN", "Bạn không có quyền xem hóa đơn.");
  where.push(
    "h.trang_thai IN ('DA_GUI','DA_THANH_TOAN') AND EXISTS (SELECT 1 FROM cu_dan c JOIN lich_su_cu_tru l ON l.ma_cu_dan=c.ma_cu_dan WHERE c.ma_nguoi_dung=? AND l.ma_can_ho=h.ma_can_ho AND l.den_ngay IS NULL AND l.tu_ngay<=h.ngay_chot_phi)",
  );
  values.push(user.ma_nguoi_dung);
}
function summary(bill) {
  return {
    ...bill,
    qua_han: bill.trang_thai === "DA_GUI" && bill.han_thanh_toan < v.today(),
  };
}
export async function list(query, user) {
  const { page, offset } = v.pagination(query),
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
  const data = await rows(
    pool,
    `SELECT h.ma_hoa_don,h.so_hoa_don,h.ky_thanh_toan,h.ngay_chot_phi,h.trang_thai,h.tong_tien,h.han_thanh_toan,a.so_can_ho FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho ${condition} ORDER BY h.ma_hoa_don DESC LIMIT 20 OFFSET ${offset}`,
    values,
  );
  return { data: data.map(summary), total: count.total, page };
}
export async function detail(id, user) {
  const where = ["h.ma_hoa_don=?"],
    values = [id];
  access(user, where, values);
  const [row] = await rows(
    pool,
    `SELECT h.*,a.so_can_ho FROM hoa_don h JOIN can_ho a ON a.ma_can_ho=h.ma_can_ho WHERE ${where.join(" AND ")}`,
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
```

## 4. `backend/src/app.js`

Thay toàn bộ nội dung file.

```js
import express from "express";
import { healthRouter } from "./modules/health/health.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requestContext, fail } from "./lib/http.js";
import { pool } from "./lib/db.js";
import { authRouter, usersRouter } from "./modules/auth/auth.routes.js";
import { qrRouter, publicQrRouter } from "./modules/qr/qr.routes.js";
import { vehiclesRouter } from "./modules/vehicles/vehicles.routes.js";
import {
  ratesRouter,
  metersRouter,
  billsRouter,
  selfBillsRouter,
} from "./modules/billing/billing.routes.js";
import {
  apartmentsRouter,
  residentsRouter,
} from "./modules/residency/residency.routes.js";
import {
  publicIncidentsRouter,
  incidentsRouter,
} from "./modules/incidents/incidents.routes.js";

export const app = express();
app.disable("x-powered-by");
app.use(requestContext);
app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
  req.body ??= {};
  next();
});
app.use("/api/health", healthRouter);
app.get("/api/ready", async (req, res) => {
  try {
    const [migrations] = await pool.execute(
      "SELECT name FROM schema_migrations WHERE name IN (?,?,?,?,?,?)",
      [
        "001_auth_qr_incidents.sql",
        "002_residency.sql",
        "003_same_day_residency.sql",
        "004_vehicles.sql",
        "005_billing.sql",
        "006_electricity_tiers.sql",
      ],
    );
    if (migrations.length !== 6) throw new Error("Schema not initialized");
    await pool.query("SELECT 1 FROM phan_anh LIMIT 1");
  } catch {
    fail(
      503,
      "DATABASE_UNAVAILABLE",
      "Chưa kết nối được database hoặc chưa chạy migration.",
    );
  }
  res.json({ data: { status: "ok", database: "connected" } });
});
app.use("/api/xac_thuc", authRouter);
app.use("/api/nguoi_dung", usersRouter);
app.use("/api/can_ho", apartmentsRouter);
app.use("/api/cu_dan", residentsRouter);
app.use("/api/phuong_tien", vehiclesRouter);
app.use("/api/cau_hinh_phi", ratesRouter);
app.use("/api/chi_so_dich_vu", metersRouter);
app.use("/api/hoa_don", billsRouter);
app.use("/api/cua_toi/hoa_don", selfBillsRouter);
app.use("/api/vi_tri_qr", qrRouter);
app.use("/api/cong_khai/vi_tri_qr", publicQrRouter);
app.use("/api/cong_khai/phan_anh", publicIncidentsRouter);
app.use("/api/phan_anh", incidentsRouter);
app.use((req, res) =>
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "API chưa tồn tại.",
      request_id: req.requestId,
    },
  }),
);
app.use(errorHandler);
```

## 5. `frontend/src/features/billing/Billing.jsx`

Thay toàn bộ nội dung file.

```jsx
import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import QRCode from "qrcode";
import { useAuth } from "../auth/Auth.jsx";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";

const fees = {
  PHI_QUAN_LY: "Phí quản lý",
  GUI_O_TO: "Gửi ô tô",
  GUI_XE_MAY: "Gửi xe máy",
  GUI_XE_DAP: "Gửi xe đạp",
  TIEN_NUOC: "Tiền nước",
  TIEN_DIEN: "Tiền điện",
};
const statuses = {
  NHAP: "Bản nháp",
  DA_DUYET: "Đã duyệt",
  DA_GUI: "Đã gửi",
  DA_THANH_TOAN: "Đã thanh toán",
  HUY: "Đã hủy",
};
const meterNames = { DIEN: "Điện", NUOC: "Nước" };
const eventNames = {
  LAP_NHAP: "Lập bản nháp",
  LAP_THAY_THE: "Lập bản thay thế",
  TINH_LAI: "Tính lại bản nháp",
  DUYET: "Duyệt hóa đơn",
  GUI: "Gửi hóa đơn",
  HUY: "Hủy hóa đơn",
  XAC_NHAN_THANH_TOAN: "Xác nhận đã thu",
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const money = (n) => `${BigInt(n || 0).toLocaleString("vi-VN")} đ`;
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
function billOptions(body) {
  for (const k of ["tinh_nuoc", "tinh_dien", "tinh_xe"])
    body[k] = body[k] === "1";
  return body;
}
function useAction(done) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [notice, setNotice] = useState("");
  async function run(path, method, body, after) {
    setPending(true);
    setError(null);
    setNotice("");
    try {
      const r = await getJson(path, { method, body });
      setNotice("Đã lưu thay đổi.");
      after?.(r.data);
      done?.();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return { pending, error, notice, run };
}
function Feedback({ action }) {
  return (
    <>
      {action.notice && (
        <p className="note" role="status">
          {action.notice}
        </p>
      )}
      <ErrorBox error={action.error} />
    </>
  );
}
function Pager({ resource }) {
  const [params, setParams] = useSearchParams(),
    page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(p) {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    setParams(next);
  }
  return (
    <div className="actions">
      <button
        disabled={resource.loading || page <= 1}
        onClick={() => go(page - 1)}
      >
        Trang trước
      </button>
      <span>
        Trang {page} · {total} bản ghi
      </span>
      <button
        disabled={resource.loading || page * 20 >= total}
        onClick={() => go(page + 1)}
      >
        Trang sau
      </button>
    </div>
  );
}
function ApartmentField({ initialId = "", initialLabel = "" }) {
  const [q, setQ] = useState(""),
    [id, setId] = useState(String(initialId)),
    [label, setLabel] = useState(initialLabel);
  const resource = useResource(`/can_ho?q=${encodeURIComponent(q)}`),
    matches = resource.result?.data || [];
  return (
    <>
      <Field label="Tìm căn hộ để chọn">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
        />
      </Field>
      <ErrorBox error={resource.error} />
      <Field label="Căn hộ">
        <select
          name="ma_can_ho"
          required
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setLabel(e.target.selectedOptions[0].textContent);
          }}
        >
          <option value="">Chọn căn hộ</option>
          {id && !matches.some((a) => String(a.ma_can_ho) === id) && (
            <option value={id}>{label || `Căn #${id}`}</option>
          )}
          {matches.map((a) => (
            <option key={a.ma_can_ho} value={a.ma_can_ho}>
              {a.so_can_ho}
            </option>
          ))}
        </select>
      </Field>
      {resource.result?.total > 20 && (
        <small>
          Nhập số căn cụ thể để thu hẹp {resource.result.total} kết quả.
        </small>
      )}
    </>
  );
}
function ChargeOptions({ bill }) {
  return (
    <div className="card">
      <p>
        Khoản thu áp dụng: phí quản lý theo cấu hình của căn hộ; các khoản khác
        chọn dưới đây.
      </p>
      {[
        ["tinh_nuoc", "Thu tiền nước", true],
        ["tinh_dien", "BQL thu tiền điện", false],
        ["tinh_xe", "Thu phí gửi xe", true],
      ].map(([key, label, defaultValue]) => (
        <label className="checkbox" key={key}>
          <input
            type="checkbox"
            name={key}
            value="1"
            defaultChecked={bill ? !!bill[key] : defaultValue}
          />
          {label}
        </label>
      ))}
      <small>
        Điện áp dụng biểu giá và thuế hiệu lực tại ngày chốt. Nếu cư dân trả
        trực tiếp cho EVN, không chọn BQL thu tiền điện. Phí xe theo số đăng ký
        hiệu lực tại ngày chốt, chưa chia theo ngày.
      </small>
    </div>
  );
}

export function Rates() {
  const [params, setParams] = useSearchParams(),
    resource = useResource(`/cau_hinh_phi?${params}`),
    action = useAction(resource.reload),
    [type, setType] = useState("PHI_QUAN_LY"),
    [method, setMethod] = useState("BAC_THANG"),
    [vat, setVat] = useState(""),
    [tiers, setTiers] = useState(
      [50, 100, 200, 300, 400, null].map((upper) => ({
        den_kwh: upper,
        don_gia: "",
      })),
    );
  function setTier(index, key, value) {
    setTiers((all) =>
      all.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  }
  return (
    <>
      <h1>Đơn giá phí</h1>
      <p>
        Đơn giá theo ngày hiệu lực. Phiên bản mới kết thúc khoảng giá trước đó;
        các đơn giá và chi tiết hóa đơn đã lưu được giữ lại.
      </p>
      <Feedback action={action} />
      <section className="card narrow">
        <h2>Thêm phiên bản giá</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const body = values(e);
            if (type === "TIEN_DIEN") {
              body.cach_tinh = method;
              body.thue_gtgt = vat;
              if (method === "BAC_THANG")
                body.bac_dien = tiers.map((r, i) => ({
                  den_kwh: i === tiers.length - 1 ? null : Number(r.den_kwh),
                  don_gia: r.don_gia,
                }));
            }
            action.run("/cau_hinh_phi", "POST", body, () => {
              form.reset();
              setType("PHI_QUAN_LY");
              setMethod("BAC_THANG");
              setVat("");
              setTiers(
                [50, 100, 200, 300, 400, null].map((upper) => ({
                  den_kwh: upper,
                  don_gia: "",
                })),
              );
            });
          }}
        >
          <fieldset disabled={action.pending}>
            <Field label="Loại phí">
              <select
                name="loai_phi"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <Options values={fees} />
              </select>
            </Field>
            {type === "TIEN_DIEN" && (
              <>
                <Field label="Cách tính điện">
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option value="BAC_THANG">Bậc thang lũy tiến</option>
                    <option value="DON_GIA">
                      Một đơn giá theo cấu hình thu điện
                    </option>
                  </select>
                </Field>
                <p>
                  Đối chiếu biểu giá, định mức và thuế áp dụng trước khi lưu.
                  Công tơ do EVN thu trực tiếp không đưa vào hóa đơn BQL.
                </p>
                <Field label="Thuế GTGT điện (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={vat}
                    onChange={(e) => setVat(e.target.value)}
                  />
                </Field>
                {method === "BAC_THANG" && (
                  <>
                    <p>
                      Nhập ngưỡng cộng dồn: 50, 100, 200... kWh. Điện vượt mỗi
                      ngưỡng được tính ở bậc tiếp theo.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTiers(
                          [50, 100, 200, 300, 400, null].map((upper, i) => ({
                            den_kwh: upper,
                            don_gia: String(
                              [1984, 2050, 2380, 2998, 3350, 3460][i],
                            ),
                          })),
                        );
                        setVat("8");
                      }}
                    >
                      Điền mẫu 6 bậc và thuế 8%
                    </button>
                    <small>
                      Mẫu theo số liệu tham khảo bạn cung cấp, chưa xác minh
                      hiệu lực; có thể sửa trước khi lưu.
                    </small>
                    {tiers.map((row, i) => (
                      <div className="form-grid" key={i}>
                        <Field label={`Bậc ${i + 1}: đến kWh`}>
                          {i === tiers.length - 1 ? (
                            <span>Không giới hạn</span>
                          ) : (
                            <input
                              type="number"
                              min="1"
                              max="999999999"
                              step="1"
                              required
                              value={row.den_kwh ?? ""}
                              onChange={(e) =>
                                setTier(i, "den_kwh", e.target.value)
                              }
                            />
                          )}
                        </Field>
                        <Field label={`Đơn giá bậc ${i + 1} (đồng/kWh)`}>
                          <input
                            type="number"
                            min="0"
                            max="9999999999.99"
                            step="0.01"
                            required
                            value={row.don_gia}
                            onChange={(e) =>
                              setTier(i, "don_gia", e.target.value)
                            }
                          />
                        </Field>
                      </div>
                    ))}
                    <div className="actions">
                      <button
                        type="button"
                        disabled={tiers.length >= 12}
                        onClick={() =>
                          setTiers((all) => [
                            ...all.slice(0, -1),
                            { den_kwh: "", don_gia: "" },
                            all.at(-1),
                          ])
                        }
                      >
                        Thêm bậc
                      </button>
                      <button
                        type="button"
                        disabled={tiers.length <= 2}
                        onClick={() =>
                          setTiers((all) => [...all.slice(0, -2), all.at(-1)])
                        }
                      >
                        Bớt bậc
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
            {(type !== "TIEN_DIEN" || method === "DON_GIA") && (
              <Field
                label="Đơn giá (đồng/đơn vị)"
                name="don_gia"
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
                required
              />
            )}
            <Field
              label="Áp dụng từ ngày"
              name="tu_ngay"
              type="date"
              required
              defaultValue={today()}
            />
            <button className="primary">Lưu đơn giá</button>
          </fieldset>
        </form>
      </section>
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field label="Lọc loại phí">
          <select name="loai_phi" defaultValue={params.get("loai_phi") || ""}>
            <Options values={fees} empty="Tất cả" />
          </select>
        </Field>
        <button>Lọc</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Loại phí</th>
                <th>Đơn giá</th>
                <th>Đơn vị</th>
                <th>Từ ngày</th>
                <th>Đến trước ngày</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((r) => (
                <tr key={r.ma_cau_hinh_phi}>
                  <td>{r.ten_phi}</td>
                  <td>
                    {r.cach_tinh === "BAC_THANG" ? (
                      <details>
                        <summary>Biểu giá bậc thang</summary>
                        <ol>
                          {(typeof r.bac_dien === "string"
                            ? JSON.parse(r.bac_dien)
                            : r.bac_dien
                          ).map((tier, i) => (
                            <li key={i}>
                              Đến {tier.den_kwh ?? "không giới hạn"} kWh:{" "}
                              {tier.don_gia} đ/kWh
                            </li>
                          ))}
                        </ol>
                      </details>
                    ) : (
                      r.don_gia
                    )}
                    {r.loai_phi === "TIEN_DIEN" && (
                      <small> · Thuế GTGT {r.thue_gtgt}%</small>
                    )}
                  </td>
                  <td>{r.don_vi_tinh}</td>
                  <td>{r.tu_ngay}</td>
                  <td>{r.den_ngay || "Chưa kết thúc"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có đơn giá.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
export function Meters() {
  const [params, setParams] = useSearchParams(),
    resource = useResource(`/chi_so_dich_vu?${params}`),
    [editing, setEditing] = useState(null),
    action = useAction(resource.reload);
  return (
    <>
      <h1>Chỉ số điện nước</h1>
      <p>
        Nhập lần lượt từng kỳ. Chỉ số đầu kỳ phải khớp cuối kỳ liền trước; kỳ
        đầu cần xác nhận riêng.
      </p>
      <Feedback action={action} />
      <section className="card narrow">
        <h2>{editing ? "Sửa chỉ số" : "Ghi chỉ số"}</h2>
        <form
          key={editing?.ma_chi_so_dich_vu || "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const body = values(e);
            body.ky_dau = body.ky_dau === "1";
            if (editing) body.phien_ban = editing.phien_ban;
            action.run("/chi_so_dich_vu", "PUT", body, () => setEditing(null));
          }}
        >
          <fieldset disabled={action.pending}>
            {editing ? (
              <>
                <p>
                  Căn {editing.so_can_ho} · Kỳ {editing.ky_thanh_toan} ·{" "}
                  {meterNames[editing.loai_dich_vu]}
                </p>
                <input
                  type="hidden"
                  name="ma_can_ho"
                  value={editing.ma_can_ho}
                />
                <input
                  type="hidden"
                  name="loai_dich_vu"
                  value={editing.loai_dich_vu}
                />
                <input
                  type="hidden"
                  name="ky_thanh_toan"
                  value={editing.ky_thanh_toan}
                />
              </>
            ) : (
              <>
                <ApartmentField />
                <Field label="Dịch vụ">
                  <select name="loai_dich_vu">
                    <option value="NUOC">Nước</option>
                    <option value="DIEN">Điện</option>
                  </select>
                </Field>
                <Field
                  label="Kỳ ghi chỉ số"
                  name="ky_thanh_toan"
                  type="month"
                  required
                  max={today().slice(0, 7)}
                  defaultValue={today().slice(0, 7)}
                />
              </>
            )}
            <div className="form-grid">
              <Field
                label="Chỉ số đầu kỳ"
                name="chi_so_cu"
                type="number"
                min="0"
                step="0.001"
                required
                defaultValue={editing?.chi_so_cu || ""}
              />
              <Field
                label="Chỉ số cuối kỳ"
                name="chi_so_moi"
                type="number"
                min="0"
                step="0.001"
                required
                defaultValue={editing?.chi_so_moi || ""}
              />
            </div>
            <Field
              label="Ngày chốt chỉ số"
              name="ngay_chot"
              type="date"
              required
              max={today()}
              defaultValue={editing?.ngay_chot || today()}
            />
            <Field
              label="Ghi chú chỉ số"
              name="ghi_chu"
              maxLength={255}
              defaultValue={editing?.ghi_chu || ""}
            />
            {!editing && (
              <label className="checkbox">
                <input type="checkbox" name="ky_dau" value="1" />
                Đây là kỳ đầu tiên của căn đối với dịch vụ này
              </label>
            )}
            <button className="primary">Lưu chỉ số</button>
          </fieldset>
        </form>
        {editing && (
          <button disabled={action.pending} onClick={() => setEditing(null)}>
            Hủy sửa
          </button>
        )}
      </section>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Lọc kỳ chỉ số"
          name="ky_thanh_toan"
          type="month"
          defaultValue={params.get("ky_thanh_toan") || ""}
        />
        <button>Lọc chỉ số</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Căn</th>
                <th>Kỳ / dịch vụ</th>
                <th>Đầu kỳ</th>
                <th>Cuối kỳ</th>
                <th>Ngày chốt</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((r) => (
                <tr key={r.ma_chi_so_dich_vu}>
                  <td>{r.so_can_ho}</td>
                  <td>
                    {r.ky_thanh_toan} · {meterNames[r.loai_dich_vu]}
                  </td>
                  <td>{r.chi_so_cu}</td>
                  <td>{r.chi_so_moi}</td>
                  <td>{r.ngay_chot}</td>
                  <td>
                    <button
                      disabled={action.pending}
                      onClick={() => setEditing(r)}
                    >
                      Sửa chỉ số
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager resource={resource} />
      </section>
    </>
  );
}

export function Bills() {
  const { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri/hoa-don" : "/cu-dan/hoa-don",
    api = admin ? "/hoa_don" : "/cua_toi/hoa_don";
  const [params, setParams] = useSearchParams(),
    resource = useResource(`${api}?${params}`),
    [adding, setAdding] = useState(false),
    navigate = useNavigate(),
    action = useAction(resource.reload);
  return (
    <>
      <div className="page-heading">
        <h1>{admin ? "Phí và hóa đơn" : "Hóa đơn của tôi"}</h1>
        {admin && (
          <button
            className="primary"
            disabled={action.pending}
            onClick={() => setAdding(!adding)}
          >
            {adding ? "Đóng biểu mẫu" : "Lập hóa đơn"}
          </button>
        )}
      </div>
      <Feedback action={action} />
      {adding && (
        <section className="card narrow">
          <h2>Lập bản nháp cho căn hộ</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action.run("/hoa_don/lap", "POST", billOptions(values(e)), (r) =>
                navigate(`${base}/${r.ma_hoa_don}`),
              );
            }}
          >
            <fieldset disabled={action.pending}>
              <ApartmentField />
              <Field
                label="Kỳ hóa đơn"
                name="ky_thanh_toan"
                type="month"
                required
                max={today().slice(0, 7)}
                defaultValue={today().slice(0, 7)}
              />
              <Field
                label="Ngày chốt phí"
                name="ngay_chot_phi"
                type="date"
                required
                max={today()}
                defaultValue={today()}
              />
              <ChargeOptions />
              <button className="primary">Tạo bản nháp</button>
            </fieldset>
          </form>
        </section>
      )}
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Tìm số hóa đơn hoặc căn hộ"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field
          label="Lọc kỳ hóa đơn"
          name="ky_thanh_toan"
          type="month"
          defaultValue={params.get("ky_thanh_toan") || ""}
        />
        <Field label="Trạng thái hóa đơn">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options
              values={
                admin
                  ? statuses
                  : {
                      DA_GUI: statuses.DA_GUI,
                      DA_THANH_TOAN: statuses.DA_THANH_TOAN,
                    }
              }
              empty="Tất cả"
            />
          </select>
        </Field>
        <button>Tìm hóa đơn</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Số hóa đơn</th>
                <th>Căn / kỳ</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Hạn trả</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((b) => (
                <tr key={b.ma_hoa_don}>
                  <td>
                    <Link to={`${base}/${b.ma_hoa_don}`}>{b.so_hoa_don}</Link>
                  </td>
                  <td>
                    {b.so_can_ho} · {b.ky_thanh_toan}
                  </td>
                  <td>{money(b.tong_tien)}</td>
                  <td>
                    {statuses[b.trang_thai]}
                    {b.qua_han && " · Quá hạn"}
                  </td>
                  <td>{b.han_thanh_toan || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có hóa đơn phù hợp.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
function PaymentQR({ bill }) {
  const [image, setImage] = useState(""),
    [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    setImage("");
    setError(null);
    if (bill.qr_payload)
      QRCode.toDataURL(bill.qr_payload, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "M",
      })
        .then((url) => {
          if (active) setImage(url);
        })
        .catch((e) => {
          if (active) setError(e);
        });
    return () => {
      active = false;
    };
  }, [bill.qr_payload]);
  if (!bill.qr_payload) return null;
  return (
    <section className="card narrow">
      <h2>Chuyển khoản bằng VietQR</h2>
      {image && (
        <img
          src={image}
          alt={`VietQR hóa đơn ${bill.so_hoa_don}`}
          style={{ width: 320, maxWidth: "100%" }}
        />
      )}
      <ErrorBox error={error} />
      <p>
        BIN ngân hàng: {bill.ma_ngan_hang} · Tài khoản: {bill.so_tai_khoan}
      </p>
      <p>Người nhận: {bill.ten_nguoi_nhan}</p>
      <p>
        Số tiền: <strong>{money(bill.tong_tien)}</strong> · Nội dung:{" "}
        <strong>{bill.so_hoa_don}</strong>
      </p>
      <p>
        Kiểm tra người nhận và số tiền trong ứng dụng ngân hàng. Quét QR không
        tự xác nhận đã thanh toán; BQL ghi nhận sau khi đối soát.
      </p>
    </section>
  );
}
export function BillDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri/hoa-don" : "/cu-dan/hoa-don",
    resource = useResource(`${admin ? "/hoa_don" : "/cua_toi/hoa_don"}/${id}`),
    action = useAction(resource.reload),
    navigate = useNavigate(),
    bill = resource.result?.data;
  const run = (name, body = {}, after) =>
    action.run(
      `/hoa_don/${id}/${name}`,
      "POST",
      { ...body, phien_ban: bill.phien_ban },
      after,
    );
  return (
    <>
      <Link to={base}>← Danh sách hóa đơn</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Feedback action={action} />
      {bill && (
        <>
          <h1>Hóa đơn {bill.so_hoa_don}</h1>
          <p>
            Căn {bill.so_can_ho} · Kỳ {bill.ky_thanh_toan} · Chốt ngày{" "}
            {bill.ngay_chot_phi}
          </p>
          <p>
            {statuses[bill.trang_thai]}
            {bill.qua_han && " · Quá hạn"} · Hạn trả:{" "}
            {bill.han_thanh_toan || "Chưa gửi"}
          </p>
          {admin && bill.loi_du_lieu.length > 0 && (
            <div className="error" role="alert">
              <strong>Cần bổ sung trước khi duyệt:</strong>
              <ul>
                {bill.loi_du_lieu.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <section className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Khoản thu</th>
                    <th>Số lượng</th>
                    <th>Đơn vị</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.lines.map((l, i) => (
                    <tr key={i}>
                      <td>{l.dien_giai}</td>
                      <td>{l.so_luong}</td>
                      <td>{l.don_vi_tinh}</td>
                      <td>{l.don_gia}</td>
                      <td>{money(l.thanh_tien)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2>Tổng cộng: {money(bill.tong_tien)}</h2>
          </section>
          <PaymentQR bill={bill} />
          {bill.trang_thai === "DA_THANH_TOAN" && (
            <p className="note">
              Đã ghi nhận {money(bill.so_tien_da_thu)} · Tham chiếu:{" "}
              {bill.ma_tham_chieu}
            </p>
          )}
          {admin && bill.trang_thai === "NHAP" && (
            <section className="card narrow">
              <h2>Tính lại bản nháp</h2>
              <form
                key={bill.phien_ban}
                onSubmit={(e) => {
                  e.preventDefault();
                  run("tinh_lai", billOptions(values(e)));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Ngày chốt phí"
                    name="ngay_chot_phi"
                    type="date"
                    required
                    max={today()}
                    defaultValue={bill.ngay_chot_phi}
                  />
                  <ChargeOptions bill={bill} />
                  <button>Tính lại bản nháp</button>
                </fieldset>
              </form>
              <button
                className="primary"
                disabled={
                  action.pending ||
                  bill.loi_du_lieu.length > 0 ||
                  BigInt(bill.tong_tien) <= 0n
                }
                onClick={() => run("duyet")}
              >
                Duyệt hóa đơn
              </button>
            </section>
          )}
          {admin && bill.trang_thai === "DA_DUYET" && (
            <section className="card narrow">
              <h2>Gửi hóa đơn cho cư dân</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run("gui", values(e));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Hạn thanh toán"
                    name="han_thanh_toan"
                    type="date"
                    min={today()}
                    defaultValue={today()}
                    required
                  />
                  <Field
                    label="BIN ngân hàng (6 số)"
                    name="ma_ngan_hang"
                    pattern="[0-9]{6}"
                    placeholder="Ví dụ Vietcombank: 970436"
                    required
                  />
                  <Field
                    label="Số tài khoản nhận"
                    name="so_tai_khoan"
                    inputMode="numeric"
                    pattern="[0-9]{6,30}"
                    required
                  />
                  <Field
                    label="Tên người nhận"
                    name="ten_nguoi_nhan"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                  <button className="primary">Gửi hóa đơn</button>
                </fieldset>
              </form>
            </section>
          )}
          {admin && bill.trang_thai === "DA_GUI" && (
            <section className="card narrow">
              <h2>Xác nhận thu tiền</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run("xac_nhan_thanh_toan", values(e));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Số tiền đã đối soát"
                    name="so_tien"
                    type="number"
                    step="1"
                    min="1"
                    required
                    defaultValue={bill.tong_tien}
                  />
                  <Field
                    label="Mã tham chiếu giao dịch"
                    name="ma_tham_chieu"
                    required
                    minLength={3}
                    maxLength={100}
                  />
                  <label className="checkbox">
                    <input type="checkbox" required />
                    Đã đối soát đủ số tiền hóa đơn
                  </label>
                  <button className="primary">Xác nhận đã thu</button>
                </fieldset>
              </form>
            </section>
          )}
          {admin &&
            ["NHAP", "DA_DUYET", "DA_GUI"].includes(bill.trang_thai) && (
              <section className="card narrow">
                <h2>Hủy hóa đơn</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run("huy", values(e));
                  }}
                >
                  <fieldset disabled={action.pending}>
                    <Field
                      label="Lý do hủy"
                      name="ly_do"
                      required
                      minLength={3}
                      maxLength={255}
                    />
                    <button>Hủy hóa đơn</button>
                  </fieldset>
                </form>
              </section>
            )}
          {admin && bill.trang_thai === "HUY" && (
            <section className="card">
              <p>Lý do hủy: {bill.ly_do_huy}</p>
              <button
                className="primary"
                disabled={action.pending}
                onClick={() =>
                  run("lap_thay_the", {}, (r) =>
                    navigate(`${base}/${r.ma_hoa_don}`),
                  )
                }
              >
                Lập bản thay thế
              </button>
            </section>
          )}
          {admin && (
            <section className="card">
              <h2>Lịch sử hóa đơn</h2>
              <ul>
                {bill.history.map((h) => (
                  <li key={h.ma_lich_su_hoa_don}>
                    {h.ngay_tao} · {eventNames[h.su_kien] || h.su_kien} ·{" "}
                    {h.ho_va_ten}
                    {h.ghi_chu && ` · ${h.ghi_chu}`}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
```

## Chạy sau khi chép đủ file

Tại thư mục gốc dự án trong PowerShell:

```powershell
npm run db:migrate
npm run dev:backend
```

Terminal thứ hai:

```powershell
npm run dev:frontend:https
```

Nếu đang dùng HTTP trên máy tính thì giữ lệnh chạy frontend hiện có; HTTPS cần cho camera trên điện thoại, không ảnh hưởng cách tính tiền. Với bản HTTPS, mở địa chỉ mạng hiện tại bằng `https://`, ví dụ `https://192.168.1.208:5173` nếu IP và chứng chỉ chưa đổi.

## Thử trên giao diện

1. BQL → **Đơn giá phí**, chọn **Tiền điện** → **Bậc thang lũy tiến**. Nhập giá/ngưỡng và thuế; có thể điền mẫu rồi kiểm tra/chỉnh lại. Chọn ngày hiệu lực phù hợp, lưu.
2. Nếu đã có giá điện cũ, ngày mới phải sau phiên bản gần nhất. Nếu báo `RATE_IN_USE`, ngày mới đang cắt vào khoảng đã dùng bởi hóa đơn còn hiệu lực: chọn ngày hợp lệ khác hoặc xử lý hóa đơn chưa thu trước. Không sửa trực tiếp SQL giá/hóa đơn đã thu.
3. **Chỉ số điện nước** → chọn căn, dịch vụ **Điện**, kỳ, ngày chốt trùng hóa đơn. Ví dụ đầu 100, cuối 400 = 300 kWh. Nếu là kỳ đầu thì xác nhận kỳ đầu; kỳ sau chỉ số đầu phải nối tiếp kỳ trước.
4. Lập/tính lại hóa đơn nháp, chọn **BQL thu tiền điện**. Kiểm tra từng dòng bậc và thuế. Nếu căn có phí khác, tổng hóa đơn bằng tổng phí khác cộng 798.660 đồng điện theo mẫu trên.
5. Duyệt → gửi → cư dân xem các bậc điện, thuế và QR theo đúng tổng. Chỉ ban quản lý xác nhận thu sau đối soát. Đổi giá về sau không tính lại hóa đơn đã duyệt/gửi/thu.

Không cần thay client upload/camera hoặc sửa các migration cũ. VietQR vẫn tạo cục bộ, chưa được thử bằng giao dịch ngân hàng thật.
