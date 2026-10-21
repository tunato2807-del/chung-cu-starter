// Public column allowlists: never export account secrets, tokens or internal audit JSON.
const field = (key, label, example, hint = "") => ({
  key,
  label,
  example,
  hint,
});
export const catalog = {
  can_ho: {
    title: "Căn hộ",
    path: "/quan-tri/can-ho",
    importable: true,
    note: "Thêm căn mới và tài khoản căn hộ. Không thay đổi căn đã có. Mật khẩu mới chỉ hiện một lần sau khi lưu.",
    fields: [
      field("so_can_ho", "Số căn hộ", "A101"),
      field("khoi", "Khối", "A"),
      field("tang", "Tầng", "1"),
      field(
        "dien_tich_m2",
        "Diện tích (m²)",
        "75.5",
        "Dùng dấu chấm cho phần thập phân.",
      ),
      field("tinh_phi_dich_vu", "Tính phí dịch vụ", "1", "1 = có, 0 = không."),
    ],
  },
  cu_dan: {
    title: "Cư dân",
    path: "/quan-tri/cu-dan",
    importable: true,
    note: "Thêm hồ sơ và đợt cư trú đầu tiên. Số điện thoại đã có hồ sơ sẽ báo trùng. Không tự bàn giao tài khoản của chủ hộ đang có.",
    fields: [
      field("ho_va_ten", "Họ và tên", "Nguyễn Văn An"),
      field(
        "so_dien_thoai",
        "Số điện thoại",
        "0901234567",
        "Giữ số 0 đầu, lưu ô Excel dạng văn bản.",
      ),
      field("so_can_ho", "Số căn hộ", "A101"),
      field(
        "quan_he",
        "Quan hệ với căn hộ",
        "THANH_VIEN",
        "CHU_HO / THANH_VIEN / NGUOI_THUE.",
      ),
      field(
        "ngay",
        "Ngày bắt đầu cư trú",
        "2026-10-01",
        "YYYY-MM-DD, không sau hôm nay.",
      ),
    ],
  },
  phuong_tien: {
    title: "Phương tiện",
    path: "/quan-tri/phuong-tien",
    importable: true,
    note: "Đăng ký xe cho cư dân đang ở căn đã chọn. Thời gian đã chốt hóa đơn và biển số trùng vẫn được kiểm tra.",
    fields: [
      field(
        "ma_cu_dan",
        "Mã cư dân",
        "1",
        "Mở Cư dân, sao chép mã số trên danh sách/hồ sơ. Không dùng tên tài khoản CH...",
      ),
      field("so_can_ho", "Số căn hộ chịu phí", "A101"),
      field("loai_xe", "Loại xe", "XE_MAY", "O_TO / XE_MAY / XE_DAP."),
      field("bien_so", "Biển số", "59A12345", "Có thể trống với xe đạp."),
      field("hang_xe", "Hãng xe", "Honda"),
      field("mau_sac", "Màu sắc", "Trắng"),
      field(
        "ngay_dang_ky",
        "Ngày đăng ký",
        "2026-10-01",
        "YYYY-MM-DD, không sau hôm nay.",
      ),
    ],
  },
  chi_so: {
    title: "Chỉ số điện nước",
    path: "/quan-tri/chi-so",
    importable: true,
    note: "Thêm chỉ số kỳ chưa có, theo thứ tự kỳ tăng dần. Không ghi đè chỉ số cũ. Kỳ đầu cần ky_dau = 1.",
    fields: [
      field("so_can_ho", "Số căn hộ", "A101"),
      field("loai_dich_vu", "Dịch vụ", "NUOC", "DIEN / NUOC."),
      field("ky_thanh_toan", "Kỳ", "2026-10", "YYYY-MM."),
      field(
        "chi_so_cu",
        "Chỉ số cũ",
        "100",
        "Tối đa 3 số lẻ, dấu chấm thập phân.",
      ),
      field("chi_so_moi", "Chỉ số mới", "105.5"),
      field(
        "ngay_chot",
        "Ngày chốt",
        "2026-10-01",
        "YYYY-MM-DD, thuộc kỳ đã chọn.",
      ),
      field("ky_dau", "Xác nhận kỳ đầu", "1", "1 = kỳ đầu, 0 = kỳ tiếp theo."),
      field("ghi_chu", "Ghi chú", ""),
    ],
  },
  thiet_bi: {
    title: "Thiết bị",
    path: "/quan-tri/thiet-bi",
    importable: true,
    note: "Thêm thiết bị và lịch bảo trì. Không nhập phiếu nghiệm thu hoặc sửa thiết bị đã có.",
    fields: [
      field(
        "ma_tai_san",
        "Mã tài sản",
        "BOM-A01",
        "Mã duy nhất: chữ không dấu, số, - hoặc _.",
      ),
      field("ten_thiet_bi", "Tên thiết bị", "Máy bơm A"),
      field(
        "loai",
        "Loại thiết bị",
        "MAY_BOM",
        "THANG_MAY / MAY_BOM / PCCC / DIEN / NUOC / CAMERA / KHAC.",
      ),
      field("vi_tri", "Vị trí", "Tầng hầm A"),
      field("so_serial", "Số serial", "SN001"),
      field("ngay_lap_dat", "Ngày lắp đặt", "", "YYYY-MM-DD hoặc để trống."),
      field(
        "trang_thai",
        "Trạng thái",
        "DANG_SU_DUNG",
        "DANG_SU_DUNG / TAM_DUNG / NGUNG_SU_DUNG.",
      ),
      field(
        "chu_ky_ngay",
        "Chu kỳ (ngày)",
        "",
        "Để trống cả chu kỳ và ngày kế tiếp nếu chưa cấu hình.",
      ),
      field(
        "ngay_bao_tri_tiep_theo",
        "Ngày bảo trì kế tiếp",
        "",
        "YYYY-MM-DD.",
      ),
      field("nhac_truoc_ngay", "Nhắc trước (ngày)", "7", "0–90."),
      field("ghi_chu", "Ghi chú", ""),
    ],
  },
  hoa_don: { title: "Hóa đơn", path: "/quan-tri/hoa-don" },
  bao_tri: { title: "Phiếu bảo trì", path: "/quan-tri/bao-tri" },
  dat_lich: { title: "Lượt đặt tiện ích", path: "/quan-tri/dat-lich" },
};
export function publicCatalog() {
  return Object.entries(catalog).map(([key, value]) => ({ key, ...value }));
}
