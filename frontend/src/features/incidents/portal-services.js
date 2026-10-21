import { matchesSearch } from "../../shared/search.js";

export const serviceCategories = [
  ["all", "Tất cả dịch vụ"],
  ["support", "Phản ánh & hỗ trợ"],
  ["finance", "Phí & thanh toán"],
  ["living", "Tiện ích & thông tin"],
  ["account", "Tài khoản"],
];

export function portalServices(user) {
  const role = user?.vai_tro;
  const common = [
    {
      id: "feedback",
      title: "Gửi phản ánh",
      description: "Quét QR tại khu vực, mô tả sự cố và gửi ảnh hiện trường.",
      category: "support",
      icon: "qr",
      path: "/quet-qr",
      access: "Không cần đăng nhập",
      keywords: "su co bao hong camera",
    },
    {
      id: "lookup",
      title: "Tra cứu tiến độ",
      description: "Dùng mã tra cứu và số điện thoại để xem kết quả xử lý.",
      category: "support",
      icon: "search",
      path: "/tra-cuu",
      access: "Không cần đăng nhập",
      keywords: "phan anh ho tro",
    },
  ];
  const privateServices =
    role === "KY_THUAT_VIEN"
      ? [
          {
            id: "work",
            title: "Công việc được giao",
            description:
              "Tiếp nhận, cập nhật tiến độ và báo cáo kết quả xử lý.",
            category: "support",
            icon: "tool",
            path: "/ky-thuat/cong-viec",
          },
          {
            id: "maintenance",
            title: "Bảo trì thiết bị",
            description:
              "Xem lịch bảo trì và các phiếu công việc cần thực hiện.",
            category: "living",
            icon: "calendar",
            path: "/ky-thuat/bao-tri",
          },
        ]
      : [
          {
            id: "bills",
            title: "Hóa đơn & thanh toán",
            description: "Xem chi tiết các khoản phí và mã QR chuyển khoản.",
            category: "finance",
            icon: "receipt",
            path:
              role === "QUAN_TRI_VIEN"
                ? "/quan-tri/hoa-don"
                : "/cu-dan/hoa-don",
            keywords: "dien nuoc gui xe cong no",
          },
          {
            id: "amenities",
            title: "Đặt lịch tiện ích",
            description:
              "Chọn tiện ích, xem khung giờ và theo dõi lịch đã đặt.",
            category: "living",
            icon: "calendar",
            path:
              role === "QUAN_TRI_VIEN"
                ? "/quan-tri/tien-ich"
                : "/cu-dan/tien-ich",
          },
          {
            id: "announcements",
            title: "Thông báo tòa nhà",
            description:
              "Đọc thông tin từ Ban quản lý và các thông báo nhắc phí.",
            category: "living",
            icon: "bell",
            path:
              role === "QUAN_TRI_VIEN"
                ? "/quan-tri/thong-bao"
                : "/cu-dan/thong-bao",
          },
        ];
  return [
    ...common,
    ...privateServices,
    {
      id: "account",
      title: "Tài khoản của bạn",
      description: "Xem thông tin đăng nhập và thay đổi mật khẩu tài khoản.",
      category: "account",
      icon: "user",
      path: "/tai-khoan",
    },
  ];
}

export function filterServices(services, query, category = "all") {
  return services.filter(
    (service) =>
      (category === "all" || service.category === category) &&
      matchesSearch(
        query,
        service.title,
        service.description,
        service.keywords,
      ),
  );
}

// Chỉ nhận ID dịch vụ có sẵn. Không dùng đường dẫn tùy ý từ state/URL để chuyển trang.
export function serviceDestination(user, id) {
  return portalServices(user).find((service) => service.id === id)?.path;
}
