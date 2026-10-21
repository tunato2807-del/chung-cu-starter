// Local VietQR/NAPAS BIN directory. Selecting a bank never sends account data
// to a third-party service. Update this list when a bank changes its BIN/name.
export const banks = [
  ["970416", "ACB", "Ngân hàng TMCP Á Châu"],
  [
    "970405",
    "Agribank",
    "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam",
  ],
  ["970425", "ABBANK", "Ngân hàng TMCP An Bình"],
  ["970409", "Bac A Bank", "Ngân hàng TMCP Bắc Á"],
  ["970438", "BaoViet Bank", "Ngân hàng TMCP Bảo Việt"],
  ["970418", "BIDV", "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam"],
  ["970446", "Co-opBank", "Ngân hàng Hợp tác xã Việt Nam"],
  ["970431", "Eximbank", "Ngân hàng TMCP Xuất Nhập khẩu Việt Nam"],
  ["970437", "HDBank", "Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh"],
  ["970434", "Indovina Bank", "Ngân hàng TNHH Indovina"],
  ["970452", "KienlongBank", "Ngân hàng TMCP Kiên Long"],
  ["970449", "LPBank", "Ngân hàng TMCP Lộc Phát Việt Nam"],
  ["970422", "MB", "Ngân hàng TMCP Quân đội"],
  ["970426", "MSB", "Ngân hàng TMCP Hàng Hải Việt Nam"],
  ["970428", "Nam A Bank", "Ngân hàng TMCP Nam Á"],
  ["970419", "NCB", "Ngân hàng TMCP Quốc Dân"],
  ["970448", "OCB", "Ngân hàng TMCP Phương Đông"],
  ["970430", "PGBank", "Ngân hàng TMCP Thịnh vượng và Phát triển"],
  ["970412", "PVcomBank", "Ngân hàng TMCP Đại Chúng Việt Nam"],
  ["970403", "Sacombank", "Ngân hàng TMCP Sài Gòn Thương Tín"],
  ["970400", "Saigonbank", "Ngân hàng TMCP Sài Gòn Công Thương"],
  ["970429", "SCB", "Ngân hàng TMCP Sài Gòn"],
  ["970440", "SeABank", "Ngân hàng TMCP Đông Nam Á"],
  ["970443", "SHB", "Ngân hàng TMCP Sài Gòn – Hà Nội"],
  ["970424", "Shinhan Bank", "Ngân hàng TNHH MTV Shinhan Việt Nam"],
  ["970407", "Techcombank", "Ngân hàng TMCP Kỹ thương Việt Nam"],
  ["970423", "TPBank", "Ngân hàng TMCP Tiên Phong"],
  ["970458", "UOB", "Ngân hàng TNHH MTV United Overseas Bank Việt Nam"],
  ["970441", "VIB", "Ngân hàng TMCP Quốc tế Việt Nam"],
  ["970427", "Viet A Bank", "Ngân hàng TMCP Việt Á"],
  ["970433", "Vietbank", "Ngân hàng TMCP Việt Nam Thương Tín"],
  ["970436", "Vietcombank", "Ngân hàng TMCP Ngoại thương Việt Nam"],
  ["970415", "VietinBank", "Ngân hàng TMCP Công Thương Việt Nam"],
  ["970432", "VPBank", "Ngân hàng TMCP Việt Nam Thịnh Vượng"],
  ["970457", "Woori Bank", "Ngân hàng TNHH MTV Woori Việt Nam"],
]
  .map(([bin, shortName, name]) => ({ bin, shortName, name }))
  .sort((a, b) => a.shortName.localeCompare(b.shortName, "vi"));

export const bankName = (bin) =>
  banks.find((bank) => bank.bin === bin)?.shortName || `Ngân hàng (BIN ${bin})`;
export const bankSearch = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
