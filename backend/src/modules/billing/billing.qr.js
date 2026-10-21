import { fail } from "../../lib/http.js";
export function crc16(text) {
  let crc = 0xffff;
  for (const byte of Buffer.from(text, "utf8")) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++)
      crc = ((crc << 1) ^ (crc & 0x8000 ? 0x1021 : 0)) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
function tlv(id, value) {
  const s = String(value),
    length = Buffer.byteLength(s, "utf8");
  if (length > 99) fail(422, "QR_TOO_LONG", "Thông tin QR quá dài.");
  return id + String(length).padStart(2, "0") + s;
}
export function vietQR(bill) {
  if (bill.trang_thai !== "DA_GUI") return null;
  const bank = tlv("00", bill.ma_ngan_hang) + tlv("01", bill.so_tai_khoan);
  const transfer =
    tlv("00", "A000000727") + tlv("01", bank) + tlv("02", "QRIBFTTA");
  const payload =
    tlv("00", "01") +
    tlv("01", "12") +
    tlv("38", transfer) +
    tlv("53", "704") +
    tlv("54", bill.tong_tien) +
    tlv("58", "VN") +
    tlv("62", tlv("08", bill.so_hoa_don)) +
    "6304";
  return payload + crc16(payload);
}
