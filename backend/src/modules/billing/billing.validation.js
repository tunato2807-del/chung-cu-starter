import { fail, integer, text } from "../../lib/http.js";
export const feeTypes = [
  "PHI_QUAN_LY",
  "GUI_O_TO",
  "GUI_XE_MAY",
  "GUI_XE_DAP",
  "TIEN_NUOC",
  "TIEN_DIEN",
];
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function day(value, future = false) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    fail(422, "INVALID_DATE", "Ngày cần theo định dạng YYYY-MM-DD.");
  const d = new Date(`${value}T00:00:00Z`);
  if (
    Number.isNaN(d.getTime()) ||
    d.toISOString().slice(0, 10) !== value ||
    value < "1900-01-01" ||
    value > "2199-12-31" ||
    (!future && value > today())
  )
    fail(422, "INVALID_DATE", "Ngày không hợp lệ hoặc vượt ngày cho phép.");
  return value;
}
export function period(value) {
  if (
    typeof value !== "string" ||
    !/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(value)
  )
    fail(422, "INVALID_PERIOD", "Kỳ thu cần có định dạng YYYY-MM.");
  return value;
}
export function monthDay(value, month) {
  day(value);
  if (value.slice(0, 7) !== period(month))
    fail(422, "INVALID_CUTOFF", "Ngày chốt phải thuộc kỳ thu đã chọn.");
  return value;
}
export function scaled(value, scale = 2, digits = 10) {
  const s = String(value ?? "");
  if (!new RegExp(`^\\d{1,${digits}}(?:\\.\\d{1,${scale}})?$`).test(s))
    fail(422, "INVALID_DECIMAL", `Nhập số không âm với tối đa ${scale} số lẻ.`);
  const [a, b = ""] = s.split(".");
  return BigInt(a) * 10n ** BigInt(scale) + BigInt(b.padEnd(scale, "0"));
}
export const decimal = (n, scale) => {
  const s = n.toString().padStart(scale + 1, "0");
  return `${s.slice(0, -scale)}.${s.slice(-scale)}`;
};
export function amount(value) {
  const s = String(value ?? "");
  if (!/^\d{1,14}$/.test(s))
    fail(
      422,
      "INVALID_AMOUNT",
      "Số tiền cần là số nguyên đồng, tối đa 14 chữ số.",
    );
  return BigInt(s);
}
export function lineTotal(qty, price) {
  const n = (scaled(qty, 3, 9) * scaled(price, 2, 10) + 50000n) / 100000n;
  if (n > 99999999999999n)
    fail(422, "AMOUNT_TOO_LARGE", "Số tiền vượt giới hạn.");
  return n.toString();
}
export function options(body) {
  const result = {};
  for (const key of ["tinh_nuoc", "tinh_dien", "tinh_xe"]) {
    if (typeof body[key] !== "boolean")
      fail(
        422,
        "INVALID_OPTIONS",
        "Cần chọn rõ các khoản nước, điện và xe được thu.",
      );
    result[key] = body[key];
  }
  return result;
}
export function version(row, value) {
  if (row.phien_ban !== integer(value, "phien_ban"))
    fail(409, "STALE_VERSION", "Hóa đơn hoặc chỉ số đã thay đổi. Hãy tải lại.");
}
export function pagination(query) {
  const page = integer(query.page || 1, "page");
  if (page < 1 || page > 100000)
    fail(422, "INVALID_PAGE", "Trang không hợp lệ.");
  return { page, offset: (page - 1) * 20 };
}
