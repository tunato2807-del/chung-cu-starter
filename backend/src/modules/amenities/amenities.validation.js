import { choice, fail, integer, text } from "../../lib/http.js";
import { day, today, pagination } from "../billing/billing.validation.js";
export { today, pagination };
export const states = ["CHO_DUYET", "DA_DUYET", "TU_CHOI", "DA_HUY"];
export function nowVN() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}
export function addDays(value, n) {
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function positive(value, field, max = 4294967295) {
  const n = integer(value, field);
  if (n < 1 || n > max)
    fail(422, "VALIDATION", `Giá trị ${field} phải từ 1 đến ${max}.`);
  return n;
}
export function version(row, value) {
  if (row.phien_ban !== integer(value, "phien_ban"))
    fail(409, "STALE_VERSION", "Dữ liệu đã thay đổi. Hãy tải lại trang.");
}
export function clock(value) {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):(00|30)$/.test(value))
    fail(
      422,
      "INVALID_TIME",
      "Giờ phải theo định dạng HH:mm, theo bước 30 phút.",
    );
  return value;
}
export const minutes = (x) =>
  Number(x.slice(0, 2)) * 60 + Number(x.slice(3, 5));
export function facility(body) {
  const open = clock(body.gio_mo),
    close = clock(body.gio_dong);
  const max = positive(body.toi_da_phut, "toi_da_phut", 360);
  if (open >= close || max % 30 || max > minutes(close) - minutes(open))
    fail(
      422,
      "INVALID_HOURS",
      "Giờ đóng phải sau giờ mở trong cùng ngày; thời lượng tối đa theo bước 30 phút và không vượt giờ mở cửa.",
    );
  if (typeof body.dang_mo !== "boolean")
    fail(422, "VALIDATION", "Chọn rõ trạng thái mở đặt lịch.");
  return {
    ten_tien_ich: text(body.ten_tien_ich, "ten_tien_ich", 2, 120),
    vi_tri: text(body.vi_tri, "vi_tri", 2, 160),
    mo_ta: text(body.mo_ta || "", "mo_ta", 0, 2000),
    suc_chua: positive(body.suc_chua, "suc_chua", 1000),
    gio_mo: open,
    gio_dong: close,
    toi_da_phut: max,
    dat_truoc_ngay: positive(body.dat_truoc_ngay, "dat_truoc_ngay", 90),
    dang_mo: body.dang_mo,
  };
}
export function booking(body) {
  const date = day(body.ngay, true),
    start = clock(body.gio_bat_dau),
    end = clock(body.gio_ket_thuc);
  if (start >= end)
    fail(
      422,
      "INVALID_TIME",
      "Giờ kết thúc phải sau giờ bắt đầu trong cùng ngày.",
    );
  return {
    bat_dau: `${date} ${start}:00`,
    ket_thuc: `${date} ${end}:00`,
    so_nguoi: positive(body.so_nguoi, "so_nguoi", 1000),
    ghi_chu: text(body.ghi_chu || "", "ghi_chu", 0, 1000),
  };
}
export function checkBooking(f, b, now = nowVN()) {
  if (!f.dang_mo)
    fail(409, "AMENITY_CLOSED", "Tiện ích đang tạm ngừng nhận lịch mới.");
  if (
    b.bat_dau <= now ||
    b.bat_dau.slice(0, 10) > addDays(now.slice(0, 10), f.dat_truoc_ngay)
  )
    fail(
      422,
      "BOOKING_DATE",
      "Chọn giờ tương lai trong thời hạn đặt trước của tiện ích.",
    );
  if (
    b.bat_dau.slice(11, 16) < f.gio_mo.slice(0, 5) ||
    b.ket_thuc.slice(11, 16) > f.gio_dong.slice(0, 5) ||
    minutes(b.ket_thuc.slice(11)) - minutes(b.bat_dau.slice(11)) > f.toi_da_phut
  )
    fail(
      422,
      "BOOKING_HOURS",
      "Khung giờ vượt giờ mở cửa hoặc thời lượng tối đa.",
    );
  if (b.so_nguoi > f.suc_chua)
    fail(422, "BOOKING_CAPACITY", "Số người vượt sức chứa tiện ích.");
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
export function state(value) {
  return choice(value, "trang_thai", states);
}
export function calendarDay(value) {
  return day(value, true);
}
