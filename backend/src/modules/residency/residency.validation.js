import { choice, fail, integer, phone, text } from "../../lib/http.js";

export function date(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    fail(422, "INVALID_DATE", "Nhập ngày theo định dạng YYYY-MM-DD.");
  const parsed = new Date(`${value}T00:00:00Z`);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value ||
    value < "1900-01-01" ||
    value > today
  )
    fail(422, "INVALID_DATE", "Ngày cư trú phải hợp lệ và không sau hôm nay.");
  return value;
}
export function apartment(body) {
  const area = String(body.dien_tich_m2 ?? "");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(area) || Number(area) <= 0)
    fail(422, "INVALID_AREA", "Diện tích phải lớn hơn 0 và có tối đa 2 số lẻ.");
  const floor = integer(body.tang, "tang");
  if (floor > 200) fail(422, "INVALID_FLOOR", "Tầng phải từ 0 đến 200.");
  if (typeof body.tinh_phi_dich_vu !== "boolean")
    fail(422, "INVALID_FEE_FLAG", "Cần chọn có hoặc không tính phí dịch vụ.");
  return [
    text(body.so_can_ho, "so_can_ho", 1, 20),
    text(body.khoi, "khoi", 1, 10),
    floor,
    area,
    body.tinh_phi_dich_vu,
  ];
}
export function resident(body) {
  return [
    text(body.ho_va_ten, "ho_va_ten", 2, 100),
    phone(body.so_dien_thoai),
    body.ma_nguoi_dung == null || body.ma_nguoi_dung === ""
      ? null
      : integer(body.ma_nguoi_dung, "ma_nguoi_dung"),
  ];
}
export function stay(body) {
  return [
    integer(body.ma_can_ho, "ma_can_ho"),
    choice(body.quan_he, "quan_he", ["CHU_HO", "THANH_VIEN", "NGUOI_THUE"]),
    date(body.ngay),
  ];
}
