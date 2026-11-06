// Synthetic identities and operating assumptions, never copied from private records.
export const plan = Object.freeze({
  blocks: 4,
  floorsPerBlock: 25,
  homesPerFloor: 2,
  months: 13,
  reports: 240,
  equipment: 160,
  bookings: 160,
  notices: 140,
  vouchers: 160,
});
export const exceptions = Object.freeze({
  khoi_toa_nha: "Một chung cư gồm 4 khối; không tạo 100 khối để đủ số dòng.",
  loai_phi: "Ứng dụng hỗ trợ 6 loại phí cố định.",
  cau_hinh_phi:
    "6 biểu phí áp dụng trong kỳ mô phỏng; không tạo lịch sử đổi giá vô nghĩa.",
  tien_ich: "8 tiện ích phù hợp quy mô chung cư.",
  quy_tai_chinh: "4 quỹ có mục đích riêng; không nhân bản quỹ.",
  schema_migrations: "Do công cụ migration quản lý; không chèn migration giả.",
});
const surnames = [
  "Nguyễn",
  "Trần",
  "Lê",
  "Phạm",
  "Hoàng",
  "Huỳnh",
  "Vũ",
  "Võ",
  "Đặng",
  "Bùi",
  "Đỗ",
  "Hồ",
  "Ngô",
  "Dương",
  "Lý",
  "Đinh",
  "Trương",
  "Phan",
  "Đoàn",
  "Mai",
];
const givenNames = [
  "Minh An",
  "Quốc Bảo",
  "Thu Hà",
  "Gia Huy",
  "Ngọc Lan",
  "Hoàng Nam",
  "Thanh Tâm",
  "Hải Yến",
  "Quang Minh",
  "Khánh Linh",
  "Đức Anh",
  "Phương Thảo",
  "Tuấn Kiệt",
  "Bảo Ngọc",
  "Hữu Phúc",
  "Thùy Dương",
  "Tiến Đạt",
  "Kim Ngân",
  "Trung Hiếu",
  "Mỹ Duyên",
  "Nhật Quang",
  "Thanh Trúc",
  "Anh Tuấn",
  "Diệu Linh",
  "Đình Khang",
  "Ngọc Mai",
  "Thành Long",
  "Tú Anh",
  "Việt Hoàng",
  "Bích Ngọc",
];
export function personName(index) {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= surnames.length * givenNames.length
  )
    throw new Error("Identity index outside the synthetic catalogue.");
  const given =
    (index * 3 + Math.floor(index / surnames.length)) % givenNames.length;
  return `${surnames[index % surnames.length]} ${givenNames[given]}`;
}
export const phoneNumber = (index) =>
  `09${String(50000000 + index).padStart(8, "0")}`;
export const shiftDay = (date, count) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + count * 86400000)
    .toISOString()
    .slice(0, 10);
export function monthAt(day, offset) {
  const value = new Date(`${day.slice(0, 7)}-01T00:00:00Z`);
  value.setUTCMonth(value.getUTCMonth() + offset);
  return value.toISOString().slice(0, 7);
}
export function monthEnd(month) {
  const value = new Date(`${month}-01T00:00:00Z`);
  value.setUTCMonth(value.getUTCMonth() + 1);
  value.setUTCDate(0);
  return value.toISOString().slice(0, 10);
}
// Local calendar dates are stored as UTC timestamps, without future synthetic events.
export function eventTime(day, minute = 0, now = Date.now()) {
  return new Date(
    Math.min(Date.parse(`${day}T00:00:00+07:00`) + minute * 60000, now - 1000),
  )
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}
export function bookingSlot(index, day) {
  const group = Math.floor(index / 8);
  const date = shiftDay(day, 1 + Math.floor(group / 4));
  const hour = [8, 10, 14, 16][group % 4];
  return {
    facility: index % 8,
    date,
    start: `${String(hour).padStart(2, "0")}:00`,
    end: `${String(hour + 1).padStart(2, "0")}:00`,
  };
}
