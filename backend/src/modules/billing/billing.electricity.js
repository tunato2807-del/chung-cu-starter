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
