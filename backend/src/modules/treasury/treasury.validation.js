import { choice, fail, integer, text } from "../../lib/http.js";
import {
  amount,
  day,
  pagination,
  today,
} from "../billing/billing.validation.js";
export { pagination, today, day };
export const categories = {
  THU: ["BO_SUNG_QUY", "THU_KHAC"],
  CHI: ["VAN_HANH", "BAO_TRI", "MUA_SAM", "CHI_KHAC"],
};
export function positive(value, field) {
  const n = integer(value, field);
  if (n < 1) fail(422, "VALIDATION", "Mã phải lớn hơn 0.");
  return n;
}
export function version(row, value) {
  if (row.phien_ban !== integer(value, "phien_ban"))
    fail(
      409,
      "STALE_VERSION",
      "Phiếu hoặc quỹ đã thay đổi. Hãy tải lại trang.",
    );
}
export function fund(body) {
  if (typeof body.dang_hoat_dong !== "boolean")
    fail(422, "VALIDATION", "Chọn rõ trạng thái quỹ.");
  return {
    ten_quy: text(body.ten_quy, "ten_quy", 2, 120),
    mo_ta: text(body.mo_ta || "", "mo_ta", 0, 1000),
    dang_hoat_dong: body.dang_hoat_dong,
  };
}
export function voucher(body) {
  const type = choice(body.loai, "loai", ["THU", "CHI"]),
    sum = amount(body.so_tien);
  if (sum <= 0n)
    fail(422, "INVALID_AMOUNT", "Số tiền phải là số nguyên đồng lớn hơn 0.");
  return {
    ma_quy: positive(body.ma_quy, "ma_quy"),
    loai: type,
    nhom: choice(body.nhom, "nhom", categories[type]),
    ngay_hach_toan: day(body.ngay_hach_toan),
    so_tien: sum.toString(),
    doi_tac: text(body.doi_tac, "doi_tac", 2, 150),
    dien_giai: text(body.dien_giai, "dien_giai", 5, 1000),
  };
}
export function key(value) {
  const s = text(value, "khoa_yeu_cau", 36, 36).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s))
    fail(
      422,
      "INVALID_REQUEST_KEY",
      "Mã yêu cầu không hợp lệ. Hãy mở lại biểu mẫu.",
    );
  return s;
}
export function range(query) {
  const current = today(),
    from = day(query.tu_ngay || `${current.slice(0, 7)}-01`),
    to = day(query.den_ngay || current);
  if (from > to)
    fail(422, "INVALID_DATE_RANGE", "Từ ngày không được sau đến ngày.");
  return { tu_ngay: from, den_ngay: to };
}
export function reason(value) {
  return text(value, "ly_do", 5, 1000);
}
