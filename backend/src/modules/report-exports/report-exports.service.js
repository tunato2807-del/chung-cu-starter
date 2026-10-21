import * as financial from "../financial-reports/financial-reports.service.js";
import { ledger } from "../treasury/treasury.service.js";
import { today } from "../billing/billing.validation.js";
import { date, format, reserve, send, time } from "./report-files.js";
const col = (key, title, type = "text", width = 20, pdfWidth = 1) => ({
  title,
  type,
  width,
  pdfWidth,
  value: typeof key === "function" ? key : (r) => r[key],
});
const metric = (label, value, type = "money") => ({ label, value, type });
const all = (v) => v || "Tất cả";
const categories = {
  BO_SUNG_QUY: "Bổ sung quỹ",
  THU_KHAC: "Thu khác",
  VAN_HANH: "Vận hành",
  BAO_TRI: "Bảo trì",
  MUA_SAM: "Mua sắm",
  CHI_KHAC: "Chi khác",
  DIEU_CHINH: "Đảo phiếu",
  THU_HOA_DON: "Thu hóa đơn",
};
const debtViews = {
  CAN_HO: "Theo căn hộ",
  HOA_DON: "Hóa đơn chưa thu",
  THEO_KY: "Tổng hợp theo kỳ",
};
export function debtModel(r) {
  const f = r.filters,
    s = r.summary,
    view = f.che_do;
  let columns;
  if (view === "CAN_HO")
    columns = [
      col("so_can_ho", "Căn hộ"),
      col("khoi", "Khối", "text", 12, 0.5),
      col(
        (x) => x.nguoi_phu_trach || "Chưa gắn chủ hộ",
        "Người phụ trách hiện tại",
        "text",
        28,
        1.4,
      ),
      col("dien_thoai_phu_trach", "Số điện thoại"),
      col("so_hoa_don_chua_thu", "Hóa đơn chưa thu", "count", 18, 0.7),
      col((x) => date(x.han_som_nhat), "Hạn sớm nhất"),
      col("con_phai_thu", "Còn phải thu", "money"),
      col("no_qua_han", "Nợ quá hạn", "money"),
    ];
  else if (view === "HOA_DON")
    columns = [
      col("so_hoa_don", "Hóa đơn"),
      col("so_can_ho", "Căn hộ"),
      col("khoi", "Khối", "text", 12, 0.5),
      col("ky_thanh_toan", "Kỳ hóa đơn"),
      col((x) => date(x.han_thanh_toan), "Hạn thanh toán"),
      col(
        (x) =>
          x.qua_han
            ? "Quá hạn"
            : x.han_thanh_toan
              ? "Chưa quá hạn"
              : "Chưa đặt hạn",
        "Tình trạng",
      ),
      col("tong_tien", "Còn phải thu", "money"),
    ];
  else
    columns = [
      col("ky_thanh_toan", "Kỳ hóa đơn"),
      col("so_hoa_don", "Số hóa đơn", "count", 15, 0.6),
      col("so_hoa_don_da_thu", "Đã thu (hóa đơn)", "count", 18, 0.7),
      col("so_hoa_don_chua_thu", "Chưa thu (hóa đơn)", "count", 18, 0.7),
      col("tong_da_gui", "Tổng đã gửi", "money"),
      col("da_thu", "Đã thu", "money"),
      col("con_phai_thu", "Còn phải thu", "money"),
      col("no_qua_han", "Nợ quá hạn", "money"),
    ];
  return {
    title: `Báo cáo công nợ · ${debtViews[view]}`,
    file: `cong-no-${view.toLowerCase().replaceAll("_", "-")}`,
    day: r.ngay_bao_cao,
    at: r.tai_luc,
    rows: r.data,
    columns,
    filters: [
      ["Từ kỳ", all(f.tu_ky)],
      ["Đến kỳ", all(f.den_ky)],
      ["Khối", all(f.khoi)],
      ["Tìm số căn", all(f.q)],
      ["Mã căn lọc riêng", all(f.ma_can_ho)],
      ["Chỉ quá hạn", f.qua_han === "1" ? "Có" : "Không"],
      ["Xét quá hạn đến", date(r.ngay_bao_cao)],
    ],
    summary: [
      metric("Tổng hóa đơn đã gửi", s.tong_da_gui),
      metric("Đã thu theo kỳ hóa đơn", s.da_thu),
      metric("Còn phải thu", s.con_phai_thu),
      metric("Nợ quá hạn", s.no_qua_han),
      metric("Số căn còn nợ", s.so_can_con_no, "count"),
      metric("Tỷ lệ đã thu (%)", String(s.ty_le_da_thu), "text"),
    ],
    notes: [
      "Công nợ hiện tại của các kỳ đã chọn; không phải số dư hồi tố tại một ngày trong quá khứ.",
      "Tổng hợp tính toàn bộ kỳ/khối/căn đã lọc. Cách xem hóa đơn chỉ liệt kê hóa đơn chưa thu; lọc quá hạn chỉ tác động chi tiết, không đổi tổng hợp.",
      "Ngày đến hạn hôm nay chưa là quá hạn. Người phụ trách là thông tin hiện tại; các bản nháp, chưa gửi và đã hủy không được cộng vào tổng.",
    ],
  };
}
export function collectionModel(r) {
  const f = r.filters,
    s = r.summary,
    grouped = f.che_do === "THEO_NGAY";
  return {
    title: `Báo cáo thu phí · ${grouped ? "Tổng hợp theo ngày" : "Các khoản đã thu"}`,
    file: `thu-phi-${grouped ? "theo-ngay" : "giao-dich"}`,
    day: r.ngay_bao_cao,
    at: r.tai_luc,
    rows: r.data,
    filters: [
      ["Từ ngày xác nhận", date(f.tu_ngay)],
      ["Đến ngày xác nhận", date(f.den_ngay)],
      ["Khối", all(f.khoi)],
      ["Tìm số căn", all(f.q)],
      ["Mã căn lọc riêng", all(f.ma_can_ho)],
    ],
    summary: [
      metric("Đã ghi nhận thu", s.tong_da_thu),
      metric("Số khoản thu", s.so_khoan_thu, "count"),
      metric("Số căn đã thu", s.so_can_da_thu, "count"),
    ],
    columns: grouped
      ? [
          col((x) => date(x.ngay_thu), "Ngày thu"),
          col("so_khoan_thu", "Số khoản thu", "count"),
          col("da_thu", "Đã thu", "money"),
        ]
      : [
          col("so_hoa_don", "Hóa đơn"),
          col("so_can_ho", "Căn hộ"),
          col("khoi", "Khối", "text", 12, 0.5),
          col("ky_thanh_toan", "Kỳ hóa đơn"),
          col(
            (x) => time(x.ngay_thanh_toan),
            "Thời điểm xác nhận (VN)",
            "text",
            28,
            1.3,
          ),
          col("ma_tham_chieu", "Mã tham chiếu", "text", 28, 1.2),
          col("nguoi_xac_nhan", "Người xác nhận", "text", 28, 1.2),
          col("so_tien_da_thu", "Đã thu", "money"),
        ],
    notes: [
      "Theo thời điểm BQL xác nhận thu trên phần mềm, quy đổi giờ Việt Nam, không phải kỳ hóa đơn hoặc ngày chuyển khoản ngân hàng.",
      "Khoảng ngày tính cả ngày đầu và ngày cuối. Chỉ các hóa đơn đã xác nhận thu mới được đưa vào báo cáo.",
    ],
  };
}
export function ledgerModel(r) {
  const f = r.filters,
    s = r.summary,
    grouped = f.che_do === "THEO_THANG";
  return {
    title: `Sổ quỹ · ${r.fund.ten_quy} · ${grouped ? "Theo tháng" : "Từng khoản thu / chi"}`,
    file: `so-quy-${r.fund.ma_quy}-${grouped ? "theo-thang" : "giao-dich"}`,
    day: today(),
    at: r.tai_luc,
    rows: r.data,
    filters: [
      ["Quỹ", r.fund.ten_quy],
      ["Từ ngày hạch toán", date(f.tu_ngay)],
      ["Đến ngày hạch toán", date(f.den_ngay)],
      [
        "Nguồn chi tiết",
        f.nguon === "PHIEU"
          ? "Phiếu thu / chi"
          : f.nguon === "HOA_DON"
            ? "Hóa đơn"
            : "Tất cả",
      ],
      [
        "Loại chi tiết",
        f.loai === "THU" ? "Thu" : f.loai === "CHI" ? "Chi" : "Tất cả",
      ],
      ["Tìm kiếm", all(f.q)],
    ],
    summary: [
      metric("Đầu kỳ", s.dau_ky),
      metric("Thu trong kỳ", s.tong_thu),
      metric("Chi trong kỳ", s.tong_chi),
      metric("Cuối kỳ", s.cuoi_ky),
    ],
    columns: grouped
      ? [
          col("ky", "Tháng"),
          col("tong_thu", "Tổng thu", "money"),
          col("tong_chi", "Tổng chi", "money"),
          col(
            (x) => (BigInt(x.tong_thu) - BigInt(x.tong_chi)).toString(),
            "Chênh lệch",
            "money",
          ),
        ]
      : [
          col((x) => date(x.ngay), "Ngày hạch toán", "text", 20, 0.8),
          col("so_chung_tu", "Chứng từ"),
          col(
            (x) => (x.nguon === "HOA_DON" ? "Hóa đơn" : "Phiếu thu / chi"),
            "Nguồn",
            "text",
            18,
            0.8,
          ),
          col((x) => categories[x.nhom] || x.nhom, "Nhóm", "text", 20, 0.8),
          col("doi_tac", "Người nộp / nhận", "text", 28, 1.2),
          col("dien_giai", "Diễn giải", "text", 60, 2.4),
          col(
            (x) => (x.loai === "THU" ? x.so_tien : "0"),
            "Thu",
            "money",
            22,
            1.1,
          ),
          col(
            (x) => (x.loai === "CHI" ? x.so_tien : "0"),
            "Chi",
            "money",
            22,
            1.1,
          ),
        ],
    notes: [
      "Số dư theo dữ liệu đã ghi nhận, cần đối soát tiền mặt và ngân hàng thực tế. Hạch toán lùi ngày có thể làm thay đổi số dư quá khứ.",
      "Tổng hợp là toàn quỹ trong khoảng ngày; nguồn/loại/tìm kiếm chỉ lọc chi tiết từng khoản. Chế độ tháng tổng hợp toàn quỹ, các tháng biên chỉ tính ngày thuộc khoảng đã chọn.",
      "Chỉ tính phiếu đã ghi sổ và hóa đơn đã xác nhận thu. Phiếu gốc và phiếu đảo đều được giữ để thể hiện đầy đủ lịch sử, không cộng lại một hóa đơn thành phiếu thu.",
    ],
  };
}
export async function download(req, res, kind, id) {
  const exportFormat = format(req.query);
  let release;
  try {
    release = reserve(req.user.ma_nguoi_dung);
    const result =
      kind === "cong_no"
        ? await financial.debts(req.query, exportFormat)
        : kind === "thu_phi"
          ? await financial.collections(req.query, exportFormat)
          : await ledger(id, req.query, exportFormat);
    const model =
      kind === "cong_no"
        ? debtModel(result)
        : kind === "thu_phi"
          ? collectionModel(result)
          : ledgerModel(result);
    await send(res, model, exportFormat);
  } catch (error) {
    if (error.code === "EXPORT_BUSY") res.set("Retry-After", "3");
    throw error;
  } finally {
    release?.();
  }
}
