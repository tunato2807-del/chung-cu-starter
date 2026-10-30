import assert from "node:assert/strict";
import { electricityLines } from "../../../backend/src/modules/billing/billing.electricity.js";
import {
  amount,
  scaled,
} from "../../../backend/src/modules/billing/billing.validation.js";

const lines = electricityLines(
  {
    cach_tinh: "DON_GIA",
    bac_dien: null,
    don_gia: "2000000000",
    thue_gtgt: "8",
    ma_cau_hinh_phi: 1,
  },
  scaled("100", 3, 9),
  {},
  1,
);
const total = lines.reduce((n, l) => n + BigInt(l.thanh_tien), 0n);
assert.equal(amount(total.toString()), total);
assert.equal(scaled("2000000000", 2, 10), 200000000000n);
assert(scaled(lines.at(-1).don_gia, 2, 14) > 999999999999n);
console.log(
  JSON.stringify(
    {
      lines,
      total: lines.reduce((n, l) => n + BigInt(l.thanh_tien), 0n).toString(),
      maxInvoice: "99999999999999",
      maxUnitPrice: "9999999999.99",
    },
    null,
    2,
  ),
);
