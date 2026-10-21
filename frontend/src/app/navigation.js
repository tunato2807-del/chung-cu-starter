// Nhãn, đường dẫn và nhóm menu. Phân quyền vẫn được kiểm tra tại route/API.
const account = {
  title: "Cá nhân",
  items: [["/tai-khoan", "Tài khoản", "user"]],
};
export const navigation = {
  QUAN_TRI_VIEN: [
    {
      title: "Điều hành",
      items: [
        ["/quan-tri", "Tổng quan", "dashboard"],
        ["/quan-tri/phan-anh", "Phản ánh", "message"],
        ["/quan-tri/thong-bao", "Thông báo", "bell"],
      ],
    },
    {
      title: "Tòa nhà & cư dân",
      items: [
        ["/quan-tri/can-ho", "Căn hộ", "home"],
        ["/quan-tri/so-do-toa-nha", "Sơ đồ tòa nhà", "map"],
        ["/quan-tri/cau-truc-toa-nha", "Khối & tầng", "layers"],
        ["/quan-tri/cu-dan", "Cư dân & cư trú", "users"],
        ["/quan-tri/tai-khoan-can-ho", "Tài khoản căn hộ", "key"],
        ["/quan-tri/phuong-tien", "Phương tiện", "car"],
      ],
    },
    {
      title: "Dịch vụ & vận hành",
      items: [
        ["/quan-tri/thiet-bi", "Thiết bị & bảo trì", "tool"],
        ["/quan-tri/tien-ich", "Tiện ích & đặt lịch", "calendar"],
        ["/quan-tri/vi-tri-qr", "Vị trí & QR", "qr"],
      ],
    },
    {
      title: "Tài chính",
      items: [
        ["/quan-tri/don-gia", "Đơn giá phí", "receipt"],
        ["/quan-tri/chi-so", "Chỉ số điện nước", "meter"],
        ["/quan-tri/hoa-don", "Phí & hóa đơn", "wallet"],
        ["/quan-tri/bao-cao-tai-chinh", "Công nợ & thu phí", "chart"],
        ["/quan-tri/quy", "Thu chi & quỹ", "wallet"],
      ],
    },
    {
      title: "Quản trị",
      items: [
        ["/quan-tri/nhap-xuat", "Nhập / xuất Excel, PDF", "file"],
        ["/quan-tri/nhan-su", "Nhân sự & tài khoản", "users"],
      ],
    },
    account,
  ],
  KY_THUAT_VIEN: [
    {
      title: "Nghiệp vụ kỹ thuật",
      items: [
        ["/ky-thuat/cong-viec", "Công việc", "message"],
        ["/ky-thuat/bao-tri", "Bảo trì thiết bị", "tool"],
      ],
    },
    account,
  ],
  CU_DAN: [
    {
      title: "Dịch vụ của bạn",
      items: [
        ["/cu-dan/phan-anh", "Phản ánh của tôi", "message"],
        ["/cu-dan/hoa-don", "Hóa đơn của tôi", "wallet"],
        ["/cu-dan/tien-ich", "Đặt lịch tiện ích", "calendar"],
        ["/cu-dan/thong-bao", "Thông báo", "bell"],
      ],
    },
    account,
  ],
};
