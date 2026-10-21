import * as residency from "../residency/residency.service.js";
import * as vehicles from "../vehicles/vehicles.service.js";
import * as billing from "../billing/billing.service.js";
import * as maintenance from "../maintenance/maintenance.service.js";
import * as amenities from "../amenities/amenities.service.js";
import { date, send } from "../report-exports/report-files.js";
import { today } from "../billing/billing.validation.js";
import { catalog } from "./catalog.js";

const configs = {
  can_ho: {
    read: (q, u, f) => residency.listApartments(q, f),
    filters: ["q", "tang"],
    columns: [
      ["ma_can_ho", "Mã căn"],
      ["so_can_ho", "Căn hộ"],
      ["khoi", "Khối"],
      ["tang", "Tầng", "count"],
      ["dien_tich_m2", "Diện tích (m²)", "count"],
      ["so_cu_dan", "Cư dân đang ở", "count"],
      ["tinh_phi_dich_vu", "Tính phí dịch vụ", "flag"],
    ],
  },
  cu_dan: {
    read: (q, u, f) => residency.listResidents(q, f),
    filters: ["q", "ma_can_ho", "ma_cu_dan", "trang_thai"],
    columns: [
      ["ma_cu_dan", "Mã cư dân"],
      ["ho_va_ten", "Họ tên"],
      ["so_dien_thoai", "Điện thoại"],
      ["so_can_ho", "Căn đang ở"],
      ["quan_he", "Quan hệ"],
      ["tu_ngay", "Ngày vào", "date"],
    ],
  },
  phuong_tien: {
    read: (q, u, f) => vehicles.list(q, f),
    filters: ["q", "loai_xe", "trang_thai", "ma_can_ho", "ma_cu_dan"],
    columns: [
      ["ma_dang_ky", "Mã đăng ký"],
      ["ma_cu_dan", "Mã cư dân"],
      ["ho_va_ten", "Cư dân"],
      ["so_can_ho", "Căn hộ"],
      ["loai_xe", "Loại xe"],
      ["bien_so", "Biển số"],
      ["ngay_dang_ky", "Ngày đăng ký", "date"],
      ["ngay_ket_thuc", "Ngày kết thúc", "date"],
    ],
  },
  chi_so: {
    read: (q, u, f) => billing.meters(q, f),
    filters: ["ma_can_ho", "ky_thanh_toan"],
    columns: [
      ["so_can_ho", "Căn hộ"],
      ["loai_dich_vu", "Dịch vụ"],
      ["ky_thanh_toan", "Kỳ"],
      ["chi_so_cu", "Chỉ số cũ", "count"],
      ["chi_so_moi", "Chỉ số mới", "count"],
      ["ngay_chot", "Ngày chốt", "date"],
      ["ghi_chu", "Ghi chú"],
    ],
  },
  thiet_bi: {
    read: (q, u, f) => maintenance.equipmentList(q, f),
    filters: ["q", "loai", "trang_thai", "lich"],
    columns: [
      ["ma_tai_san", "Mã tài sản"],
      ["ten_thiet_bi", "Tên thiết bị"],
      ["loai", "Loại"],
      ["vi_tri", "Vị trí"],
      ["so_serial", "Serial"],
      ["trang_thai", "Trạng thái"],
      ["chu_ky_ngay", "Chu kỳ (ngày)"],
      ["ngay_bao_tri_tiep_theo", "Bảo trì kế tiếp", "date"],
    ],
  },
  hoa_don: {
    read: billing.list,
    filters: ["q", "ma_can_ho", "ky_thanh_toan", "trang_thai"],
    columns: [
      ["so_hoa_don", "Số hóa đơn"],
      ["so_can_ho", "Căn hộ"],
      ["ky_thanh_toan", "Kỳ"],
      ["ngay_chot_phi", "Ngày chốt", "date"],
      ["trang_thai", "Trạng thái"],
      ["tong_tien", "Tổng tiền", "money"],
      ["han_thanh_toan", "Hạn trả", "date"],
    ],
  },
  bao_tri: {
    read: maintenance.jobs,
    filters: ["q", "ma_thiet_bi", "loai", "trang_thai", "qua_han"],
    columns: [
      ["ma_phieu_bao_tri", "Mã phiếu"],
      ["ma_tai_san", "Mã tài sản"],
      ["ten_thiet_bi_luc_lap", "Thiết bị"],
      ["tieu_de", "Công việc"],
      ["loai", "Loại"],
      ["ngay_den_han", "Đến hạn", "date"],
      ["trang_thai", "Trạng thái"],
      ["ky_thuat_vien", "Kỹ thuật viên"],
    ],
  },
  dat_lich: {
    read: amenities.bookings,
    filters: ["q", "ma_tien_ich", "ngay", "trang_thai"],
    columns: [
      ["ma_dat_lich", "Mã lượt"],
      ["ten_tien_ich", "Tiện ích"],
      ["ten_nguoi_dat", "Người đặt"],
      ["so_can_ho", "Căn hộ"],
      ["bat_dau", "Bắt đầu (giờ VN)"],
      ["ket_thuc", "Kết thúc (giờ VN)"],
      ["so_nguoi", "Số người", "count"],
      ["trang_thai", "Trạng thái"],
    ],
  },
};
const labels = {
  q: "Tìm kiếm",
  tang: "Tầng",
  ma_can_ho: "Mã căn",
  ma_cu_dan: "Mã cư dân",
  loai_xe: "Loại xe",
  trang_thai: "Trạng thái",
  ky_thanh_toan: "Kỳ",
  loai: "Loại",
  lich: "Lịch bảo trì",
  ma_thiet_bi: "Mã thiết bị",
  qua_han: "Quá hạn",
  ma_tien_ich: "Mã tiện ích",
  ngay: "Ngày",
};
export async function exportData(kind, query, user, format, res) {
  const config = configs[kind],
    filters = Object.fromEntries(
      config.filters
        .filter((k) => query[k] !== undefined && query[k] !== "")
        .map((k) => [k, query[k]]),
    );
  const result = await config.read(filters, user, format);
  const report = {
    currency: kind === "hoa_don",
    title: `Danh sách ${catalog[kind].title.toLowerCase()}`,
    file: `danh-sach-${kind.replaceAll("_", "-")}`,
    day: today(),
    at: new Date().toISOString().slice(0, 19).replace("T", " "),
    rows: result.data,
    filters: Object.entries(filters).map(([k, v]) => [labels[k], v]),
    summary: [
      {
        label: "Số dòng theo bộ lọc",
        value: result.data.length,
        type: "count",
      },
    ],
    notes: [
      "Tệp danh sách phục vụ đối chiếu và báo cáo. Để nhập mới, dùng tệp mẫu tại Nhập / xuất dữ liệu.",
      "Không bao gồm mật khẩu hoặc thông tin phiên đăng nhập.",
    ],
    columns: config.columns.map(([key, title, type]) => ({
      title,
      type: ["count", "money"].includes(type) ? type : "text",
      width: /tên|việc|thiết bị|Ghi chú/i.test(title) ? 32 : 21,
      pdfWidth: /tên|việc|thiết bị|Ghi chú/i.test(title) ? 1.7 : 1,
      value: (row) =>
        type === "date"
          ? date(row[key])
          : type === "flag"
            ? row[key]
              ? "Có"
              : "Không"
            : (row[key] ?? ""),
    })),
  };
  await send(res, report, format);
}
