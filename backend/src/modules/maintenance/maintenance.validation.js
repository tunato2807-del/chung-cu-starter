import { choice, fail, integer, text } from "../../lib/http.js";
import { day, today } from "../billing/billing.validation.js";
export { today };
export const types = [
  "THANG_MAY",
  "MAY_BOM",
  "PCCC",
  "DIEN",
  "NUOC",
  "CAMERA",
  "KHAC",
];
export const equipmentStates = ["DANG_SU_DUNG", "TAM_DUNG", "NGUNG_SU_DUNG"];
export const jobStates = [
  "MOI",
  "DA_PHAN_CONG",
  "DANG_THUC_HIEN",
  "CHO_NGHIEM_THU",
  "HOAN_THANH",
  "HUY",
];
export const openStates = jobStates.slice(0, 4);
export function positive(value, field) {
  const n = integer(value, field);
  if (n < 1) fail(422, "VALIDATION", "Mã không hợp lệ.");
  return n;
}
export function version(row, value) {
  if (row.phien_ban !== integer(value, "phien_ban"))
    fail(
      409,
      "STALE_VERSION",
      "Dữ liệu bảo trì đã thay đổi. Hãy tải lại trang.",
    );
}
export function addDays(value, days) {
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return day(d.toISOString().slice(0, 10), true);
}
export function requestKey(value) {
  const key = text(value, "khoa_yeu_cau", 36, 36).toLowerCase();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(key)
  )
    fail(
      422,
      "INVALID_REQUEST_KEY",
      "Mã yêu cầu không hợp lệ. Hãy tải lại biểu mẫu.",
    );
  return key;
}
export function equipment(body) {
  const state = choice(body.trang_thai, "trang_thai", equipmentStates);
  let cycle =
    body.chu_ky_ngay === null ||
    body.chu_ky_ngay === "" ||
    body.chu_ky_ngay === undefined
      ? null
      : positive(body.chu_ky_ngay, "chu_ky_ngay");
  let due = body.ngay_bao_tri_tiep_theo
    ? day(body.ngay_bao_tri_tiep_theo, true)
    : null;
  if (cycle > 3650 || Boolean(cycle) !== Boolean(due))
    fail(
      422,
      "INVALID_PLAN",
      "Nhập đủ chu kỳ 1–3650 ngày và ngày bảo trì kế tiếp, hoặc bỏ trống cả hai.",
    );
  const notice = integer(body.nhac_truoc_ngay ?? 7, "nhac_truoc_ngay");
  if (notice > 90)
    fail(422, "INVALID_PLAN", "Số ngày nhắc trước cần từ 0 đến 90.");
  if (state === "NGUNG_SU_DUNG") {
    cycle = null;
    due = null;
  }
  return {
    ten_thiet_bi: text(body.ten_thiet_bi, "ten_thiet_bi", 2, 150),
    loai: choice(body.loai, "loai", types),
    vi_tri: text(body.vi_tri, "vi_tri", 2, 160),
    so_serial: text(body.so_serial || "", "so_serial", 0, 100),
    ngay_lap_dat: body.ngay_lap_dat ? day(body.ngay_lap_dat) : null,
    ghi_chu: text(body.ghi_chu || "", "ghi_chu", 0, 1000),
    trang_thai: state,
    chu_ky_ngay: cycle,
    ngay_bao_tri_tiep_theo: due,
    nhac_truoc_ngay: notice,
  };
}
export function assetCode(value) {
  const code = text(value, "ma_tai_san", 2, 30).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{1,29}$/.test(code))
    fail(
      422,
      "INVALID_ASSET_CODE",
      "Mã tài sản dùng chữ không dấu, số, gạch ngang hoặc gạch dưới.",
    );
  return code;
}

// MySQL CHAR_LENGTH counts Unicode code points, not UTF-16 code units.
export function recordText(value, field, min, max) {
  const result = text(value, field, min, max);
  if (Array.from(result).length < min)
    fail(422, "VALIDATION", "Nội dung chưa đủ ký tự.", {
      [field]: `Cần ít nhất ${min} ký tự.`,
    });
  return result;
}
