import { choice, fail, integer, text } from "../../lib/http.js";
import { date } from "../residency/residency.validation.js";

export const types = ["O_TO", "XE_MAY", "XE_DAP"];
export function plate(value, required = false) {
  if (value == null || value === "") {
    if (required) fail(422, "PLATE_REQUIRED", "Ô tô và xe máy cần có biển số.");
    return null;
  }
  const result = text(value, "bien_so", 1, 30)
    .toUpperCase()
    .replace(/[\s.-]/g, "");
  if (!/^[A-Z0-9]{5,15}$/.test(result) || !/\d/.test(result))
    fail(
      422,
      "INVALID_PLATE",
      "Biển số cần 5–15 chữ cái/số, có ít nhất một chữ số; cho phép dấu chấm, gạch nối và khoảng trắng.",
    );
  return result;
}
export function registration(body) {
  const type = choice(body.loai_xe, "loai_xe", types);
  return {
    ma_cu_dan: integer(body.ma_cu_dan, "ma_cu_dan"),
    ma_lich_su_cu_tru: integer(body.ma_lich_su_cu_tru, "ma_lich_su_cu_tru"),
    loai_xe: type,
    bien_so: plate(body.bien_so, type !== "XE_DAP"),
    hang_xe: text(body.hang_xe ?? "", "hang_xe", 0, 50),
    mau_sac: text(body.mau_sac ?? "", "mau_sac", 0, 50),
    ngay_dang_ky: date(body.ngay_dang_ky),
  };
}
