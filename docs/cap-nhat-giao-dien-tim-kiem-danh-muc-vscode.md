# Giao diện tìm kiếm và danh mục dịch vụ — code đầy đủ cho VS Code

## 1. Thiết kế đã triển khai

Bạn đã chọn hướng **tìm kiếm nổi bật, danh mục rõ, nội dung gọn và dễ đọc** khi lấy Class Central làm định hướng. Bản này tổ chức lại cổng cư dân quanh dịch vụ thực tế, đồng thời làm gọn không gian quản trị:

- Cổng cư dân: ô tìm dịch vụ, từ khóa thường dùng, lọc theo danh mục, thông báo khi không có kết quả và nút đặt lại bộ lọc.
- Mỗi dịch vụ có mô tả và trạng thái cần đăng nhập. Sau khi đăng nhập, dịch vụ đã chọn được mở theo vai trò thực tế; kỹ thuật viên được đưa về công việc nếu lựa chọn trước đó không dành cho vai trò này.
- Thanh đầu trang khi làm việc có **Tìm chức năng**. Gõ `hoadon`, `dien nuoc`, `baotri` hoặc tên có dấu đều dùng được. Kết quả lấy từ menu của vai trò hiện tại; dùng ↑/↓ để di chuyển, Enter để mở, Escape để đóng. Đây là tìm chức năng trong ứng dụng.
- Menu nhóm nhận diện đúng cả các danh sách con: phiếu bảo trì thuộc Thiết bị & bảo trì; lịch đặt thuộc Tiện ích; phiếu thu chi thuộc Quỹ.
- Nền trung tính, chữ màu than, điểm nhấn vàng ở tìm kiếm và xanh ở nghiệp vụ. Giảm bo góc/bóng đổ; biểu mẫu, bảng dữ liệu, cảnh báo và màn hình thanh toán dùng chung nhịp khoảng cách.
- Tổng quan có dải số liệu gọn và các nhóm việc rõ ràng. Các lựa chọn ẩn/hiện và kiểu biểu đồ vẫn hoạt động.
- Ảnh chụp minh họa được giữ, khung ảnh gọn hơn; trình chiếu vẫn tự chuyển, dừng/đổi ảnh được và tôn trọng cài đặt giảm chuyển động.

### Giới hạn đối chiếu website tham khảo

Trong phiên triển khai ngày 21/10/2026, truy cập trực tiếp [PiHome](https://pihome.asia/), [VISAHO](https://visaho.vn/), [BuildingCare](https://buildingcare.biz/) và [Class Central](https://www.classcentral.com/) đều bị proxy của môi trường chặn (`403` / `ERR_TUNNEL_CONNECTION_FAILED`), kể cả thử qua trình duyệt. Vì thế chưa thể xác nhận bố cục hiện hành, chụp màn hình hoặc so sánh chi tiết bốn website. Các quyết định ở trên là thiết kế mới theo ưu tiên bạn đã chọn; không phải mô tả thiết kế đã quan sát trực tiếp từ các trang đó.

## 2. Xem trước

Ảnh chụp trực tiếp bản chạy trong workspace, dùng dữ liệu nghiệm thu giả lập. Số liệu/tên trên máy bạn có thể khác.

[Các màn hình mẫu và kết quả kiểm tra](giao-dien-danh-muc/README.md).

![Cổng dịch vụ mới](giao-dien-danh-muc/cong-cu-dan-1440.png)

![Tổng quan vận hành](giao-dien-danh-muc/tong-quan-1440.png)

## 3. Cập nhật trên máy bạn

Bản nền: commit `1f64bda` trên nhánh `codex/auth-qr-incidents`, sau [bản Excel chi tiết và ảnh thật](cap-nhat-excel-chi-tiet-anh-that-vscode.md). Cần có sẵn `Icon.jsx`, `PhotoCarousel.jsx`, `PhotoCarousel.css` và ba ảnh trong `frontend/public/images/residences/` của bản đó. `frontend/src/main.jsx` đã nạp `global.css` trước `professional.css`.

Mở thư mục sau bằng VS Code:

```text
D:\DO_AN\chung-cu-starter-codex-auth-qr-incidents
```

Dừng **terminal Vite** bằng `Ctrl+C`, rồi tạo/thay đủ **9 file frontend** bên dưới. Mỗi khối code là **toàn bộ nội dung file**, lưu UTF-8. Những file mới phải đúng đuôi `.js` hoặc `.jsx`, tránh `.js.txt`. Đặc biệt file dịch vụ danh mục ở **frontend/src/features/incidents/**.

Không thêm thư viện, không có migration mới. Backend và database đang chạy có thể giữ nguyên. Bộ ảnh hiện có được đọc cục bộ, không cần tải lại.

| File | Thao tác | Nội dung |
| --- | --- | --- |
| `frontend/src/shared/search.js` | Tạo mới | So khớp tiếng Việt có/không dấu và từ viết liền. |
| `frontend/src/features/incidents/portal-services.js` | Tạo mới | Danh mục dịch vụ và đích đến theo vai trò. |
| `frontend/src/shared/FunctionSearch.jsx` | Tạo mới | Ô tìm nhanh chức năng, hỗ trợ bàn phím và trạng thái không có kết quả. |
| `frontend/src/app/navigation.js` | Thay toàn bộ | Giữ menu theo vai trò, nhận diện cả trang con bảo trì/đặt lịch/thu chi. |
| `frontend/src/app/Layout.jsx` | Thay toàn bộ | Thanh đầu trang, tìm chức năng, menu nhóm và hồ sơ. |
| `frontend/src/features/auth/Auth.jsx` | Thay toàn bộ | Đăng nhập gọn hơn, mở dịch vụ đã chọn sau khi đăng nhập. |
| `frontend/src/features/incidents/PublicReports.jsx` | Thay toàn bộ | Cổng cư dân với tìm kiếm/danh mục; giữ luồng QR, ảnh và bản nháp. |
| `frontend/src/features/dashboard/Dashboard.jsx` | Thay toàn bộ | Tiêu đề và nhóm số liệu vận hành dễ đọc. |
| `frontend/src/styles/professional.css` | Thay toàn bộ | Giao diện chung của mọi phân hệ: màu, chữ, biểu mẫu, bảng và responsive. |

Sau khi chép đủ các file, ở terminal tại thư mục gốc:

```powershell
node scripts/check-local.js
npm run build
npm run dev:frontend:https
```

Dùng địa chỉ HTTPS đang hoạt động, ví dụ `https://192.168.1.208:5173`, rồi `Ctrl+F5`. IP này chỉ phù hợp nếu máy bạn vẫn dùng IP đó và chứng chỉ đã bao gồm địa chỉ này. Nếu chỉ dùng HTTP trên chính máy tính, chạy `npm run dev:frontend` thay cho lệnh HTTPS. Chỉ chạy một Vite trên cổng 5173.

Nếu bạn dùng Git để đồng bộ, chọn đúng nhánh `codex/auth-qr-incidents` và xem các thay đổi cục bộ trước khi cập nhật; không cần tải lại ZIP.

## 4. Code đầy đủ 9 file

### File 1: `frontend/src/shared/search.js`

**Tạo mới.** So khớp tiếng Việt có/không dấu và từ viết liền.

```javascript
// Tìm tiếng Việt có/không dấu; khoảng trắng và dấu nối không làm mất kết quả.
export function searchKey(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function matchesSearch(query, ...values) {
  const key = searchKey(query);
  return !key || values.some((value) => searchKey(value).includes(key));
}
```

### File 2: `frontend/src/features/incidents/portal-services.js`

**Tạo mới.** Danh mục dịch vụ và đích đến theo vai trò.

```javascript
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
```

### File 3: `frontend/src/shared/FunctionSearch.jsx`

**Tạo mới.** Ô tìm nhanh chức năng, hỗ trợ bàn phím và trạng thái không có kết quả.

```jsx
import React, { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import { matchesSearch } from "./search.js";

export default function FunctionSearch({ groups }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const input = useRef(null);
  const id = useId();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const items = groups.flatMap((group) =>
    group.items.map(([path, label, icon]) => ({
      path,
      label,
      icon,
      group: group.title,
    })),
  );
  const matches = items.filter((item) => matchesSearch(query, item.label));
  const results = matches.slice(0, 7);

  useEffect(() => {
    setQuery("");
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const close = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  function move(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      input.current.focus();
      setOpen(false);
    } else if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const links = [...root.current.querySelectorAll("li a")];
      const index = links.indexOf(document.activeElement);
      const next = event.key === "ArrowDown" ? index + 1 : index - 1;
      if (next < 0) input.current.focus();
      else links[Math.min(next, links.length - 1)]?.focus();
    }
  }

  return (
    <div
      className="function-search"
      ref={root}
      onKeyDown={move}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <form
        role="search"
        aria-label="Tìm chức năng"
        onSubmit={(event) => {
          event.preventDefault();
          if (query.trim() && matches.length === 1) {
            navigate(matches[0].path);
            setOpen(false);
          } else setOpen(true);
        }}
      >
        <label className="sr-only" htmlFor={id}>
          Tìm chức năng
        </label>
        <Icon name="search" size={18} />
        <input
          id={id}
          ref={input}
          type="search"
          placeholder="Tìm chức năng…"
          autoComplete="off"
          maxLength={80}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
        />
        <button type="submit" aria-label="Xem kết quả tìm chức năng">
          <Icon name="arrow" size={17} />
        </button>
      </form>
      {open && (
        <div className="function-results">
          <p role="status">
            {query.trim()
              ? `${matches.length} chức năng phù hợp`
              : "Đi đến chức năng"}
            {matches.length > 7 && " · Nhập thêm để thu hẹp"}
          </p>
          <ul aria-label="Kết quả tìm chức năng">
            {results.map((item) => (
              <li key={item.path}>
                <Link to={item.path} onClick={() => setOpen(false)}>
                  <Icon name={item.icon} size={18} />
                  <span>
                    {item.label}
                    <small>{item.group}</small>
                  </span>
                  <Icon name="arrow" size={15} />
                </Link>
              </li>
            ))}
          </ul>
          {!results.length && (
            <span className="function-no-result">
              Thử “căn hộ”, “hóa đơn” hoặc tên chức năng trong menu.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

### File 4: `frontend/src/app/navigation.js`

**Thay toàn bộ.** Giữ menu theo vai trò, nhận diện cả trang con bảo trì/đặt lịch/thu chi.

```javascript
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

const aliases = {
  "/quan-tri/thiet-bi": ["/quan-tri/bao-tri"],
  "/quan-tri/tien-ich": ["/quan-tri/dat-lich"],
  "/quan-tri/quy": ["/quan-tri/phieu-thu-chi"],
  "/cu-dan/tien-ich": ["/cu-dan/dat-lich"],
};

export function isFunctionActive(pathname, path) {
  if (path === "/quan-tri") return pathname === path;
  return [path, ...(aliases[path] || [])].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
```

### File 5: `frontend/src/app/Layout.jsx`

**Thay toàn bộ.** Thanh đầu trang, tìm chức năng, menu nhóm và hồ sơ.

```jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/Auth.jsx";
import { useUnreadCount } from "../features/announcements/Announcements.jsx";
import { ErrorBox, homeFor, roleNames } from "../shared/ui.jsx";
import Icon from "../shared/Icon.jsx";
import { navigation, isFunctionActive } from "./navigation.js";
import FunctionSearch from "../shared/FunctionSearch.jsx";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [error, setError] = useState();
  const [expanded, setExpanded] = useState(false);
  const menu = useRef(null);
  const profile = useRef(null);
  const unread = useUnreadCount(user, pathname);
  const workspace =
    !!user &&
    ["/quan-tri", "/ky-thuat", "/cu-dan", "/tai-khoan"].some((path) =>
      pathname.startsWith(path),
    );
  const groups = navigation[user?.vai_tro] || [];
  const initials =
    user?.ho_va_ten
      ?.trim()
      .split(/\s+/)
      .slice(-2)
      .map((word) => word[0])
      .join("") || "CC";

  useEffect(() => {
    const closeProfile = (event) => {
      if (profile.current && !profile.current.contains(event.target))
        profile.current.open = false;
    };
    document.addEventListener("pointerdown", closeProfile);
    return () => document.removeEventListener("pointerdown", closeProfile);
  }, []);

  useEffect(() => {
    setExpanded(false);
    if (profile.current) profile.current.open = false;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const nav = menu.current;
    const active = nav?.querySelector('[aria-current="page"]');
    // Chỉ cuộn thanh menu ngang; không làm trang nội dung nhảy vị trí.
    if (nav && active && window.matchMedia("(max-width: 900px)").matches) {
      nav.scrollLeft = Math.max(0, active.offsetLeft - nav.offsetLeft - 16);
    }
  }, [pathname, user?.vai_tro]);

  return (
    <div className={`app-shell ${workspace ? "is-workspace" : "is-public"}`}>
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Icon name="building" size={26} />
          </span>
          <span>
            CHUNG CƯ<small>QUẢN LÝ VẬN HÀNH</small>
          </span>
        </Link>
        {workspace ? (
          <FunctionSearch groups={groups} />
        ) : (
          <nav className="public-nav" aria-label="Dịch vụ công khai">
            <Link to="/">Dịch vụ cư dân</Link>
            <Link to="/quet-qr">Gửi phản ánh</Link>
          </nav>
        )}
        <div className="top-links">
          <Link className="lookup-link" to="/tra-cuu">
            <Icon name="search" size={18} />
            Tra cứu
          </Link>
          {user ? (
            <details
              className="profile-menu"
              ref={profile}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  profile.current.open = false;
                  profile.current.querySelector("summary").focus();
                }
              }}
            >
              <summary aria-label={`Tùy chọn tài khoản ${user.ho_va_ten}`}>
                <span className="avatar" aria-hidden="true">
                  {initials}
                </span>
                <span className="profile-name">
                  {user.ho_va_ten}
                  <small>{roleNames[user.vai_tro]}</small>
                </span>
                <Icon name="chevron" size={16} />
              </summary>
              <div className="profile-dropdown">
                <p>
                  {user.ho_va_ten}
                  <small>{roleNames[user.vai_tro]}</small>
                </p>
                <Link to={homeFor(user)}>
                  <Icon name="dashboard" />
                  Không gian của tôi
                </Link>
                <Link to="/tai-khoan">
                  <Icon name="user" />
                  Cài đặt tài khoản
                </Link>
                <button type="button" onClick={() => logout().catch(setError)}>
                  <Icon name="logout" />
                  Đăng xuất
                </button>
              </div>
            </details>
          ) : (
            <Link className="button primary" to="/dang-nhap">
              Đăng nhập
              <Icon name="arrow" size={17} />
            </Link>
          )}
        </div>
      </header>
      <ErrorBox error={error} />
      <div className={workspace ? "workspace" : "public-space"}>
        {workspace && (
          <aside className={`sidebar${expanded ? " is-expanded" : ""}`}>
            <div className="sidebar-heading">
              <span className="eyebrow">{roleNames[user.vai_tro]}</span>
              <button
                className="mobile-menu-toggle"
                type="button"
                aria-controls="workspace-navigation"
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
              >
                <Icon name="menu" size={18} />
                {expanded ? "Thu gọn menu" : "Tất cả chức năng"}
                <Icon name="chevron" size={16} />
              </button>
            </div>
            <nav
              id="workspace-navigation"
              aria-label="Chức năng"
              ref={menu}
              onKeyDown={(event) => {
                if (event.key === "Escape" && expanded) {
                  setExpanded(false);
                  menu.current.previousElementSibling
                    .querySelector("button")
                    .focus();
                }
              }}
            >
              {groups.map((group) => (
                <div className="nav-group" key={group.title}>
                  <p className="nav-group-label">{group.title}</p>
                  {group.items.map(([path, label, icon]) => (
                    <Link
                      key={path}
                      to={path}
                      className={
                        isFunctionActive(pathname, path) ? "active" : undefined
                      }
                      aria-current={
                        isFunctionActive(pathname, path) ? "page" : undefined
                      }
                      onClick={() => setExpanded(false)}
                    >
                      <Icon name={icon} size={19} />
                      <span>{label}</span>
                      {path === "/cu-dan/thong-bao" && unread > 0 && (
                        <span
                          className="notification-count"
                          aria-label={`${unread} chưa đọc`}
                        >
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
            <Link className="public-link" to="/">
              <Icon name="external" size={17} />
              Cổng dịch vụ<span aria-hidden="true">↗</span>
            </Link>
          </aside>
        )}
        <main id="main-content" tabIndex={-1} key={pathname}>
          {children}
        </main>
      </div>
      <footer>
        <span className="footer-brand">CHUNG CƯ</span>
        <span>Cổng tiếp nhận phản ánh & điều phối xử lý</span>
      </footer>
    </div>
  );
}
```

### File 6: `frontend/src/features/auth/Auth.jsx`

**Thay toàn bộ.** Đăng nhập gọn hơn, mở dịch vụ đã chọn sau khi đăng nhập.

```jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import Icon from "../../shared/Icon.jsx";
import PhotoCarousel from "../../shared/PhotoCarousel.jsx";
import { serviceDestination } from "../incidents/portal-services.js";
import {
  ErrorBox,
  Field,
  Loading,
  homeFor,
  roleNames,
} from "../../shared/ui.jsx";
const Context = createContext(null);
export const useAuth = () => useContext(Context);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    getJson("/xac_thuc/toi")
      .then((r) => setUser(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const logout = async () => {
    await getJson("/xac_thuc/dang_xuat", { method: "POST" });
    setUser(null);
  };
  return (
    <Context.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </Context.Provider>
  );
}
export function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/dang-nhap" replace />;
  if (roles && !roles.includes(user.vai_tro))
    return (
      <div className="card">
        <h1>Bạn không có quyền mở trang này</h1>
        <Link to={homeFor(user)}>Về không gian của tôi</Link>
      </div>
    );
  return children;
}
export function Login() {
  const { user, setUser } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [error, setError] = useState(),
    [pending, setPending] = useState(false),
    [showPassword, setShowPassword] = useState(false);
  if (user)
    return (
      <Navigate
        to={serviceDestination(user, location.state?.service) || homeFor(user)}
        replace
      />
    );
  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <span className="auth-story-label">
          <Icon name="building" size={18} />
          Không gian sống, kết nối mỗi ngày
        </span>
        <h2>
          Dịch vụ tòa nhà,
          <br />
          trong tầm tay bạn.
        </h2>
        <p>
          Theo dõi hóa đơn, gửi phản ánh và sử dụng dịch vụ chung cư ngay trong
          tài khoản của bạn.
        </p>
        <PhotoCarousel variant="auth" />
        <div className="auth-trust">
          <Icon name="shield" />
          <span>Thông tin và dịch vụ theo tài khoản được cấp.</span>
        </div>
      </aside>
      <section className="card auth-form">
        <p className="eyebrow">Chào mừng bạn trở lại</p>
        <h1>Đăng nhập</h1>
        <p className="muted">Sử dụng tài khoản do Ban quản lý cấp.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            setError(null);
            try {
              const result = await getJson("/xac_thuc/dang_nhap", {
                method: "POST",
                body: Object.fromEntries(new FormData(e.currentTarget)),
              });
              setUser(result.data);
              navigate(
                serviceDestination(result.data, location.state?.service) ||
                  homeFor(result.data),
              );
            } catch (err) {
              setError(err);
            } finally {
              setPending(false);
            }
          }}
        >
          <Field
            label="Số điện thoại hoặc tài khoản căn hộ"
            name="so_dien_thoai"
            type="text"
            required
            autoComplete="username"
          />
          <Field label="Loại tài khoản">
            <select name="loai_tai_khoan" defaultValue="TU_DONG">
              <option value="TU_DONG">Tự nhận diện</option>
              <option value="CAN_HO">Tài khoản căn hộ</option>
              <option value="CA_NHAN">Tài khoản cá nhân / Ban quản lý</option>
            </select>
          </Field>
          <details className="login-help">
            <summary>Dùng số điện thoại hay mã căn hộ?</summary>
            <p>
              Tài khoản căn hộ dùng số điện thoại của chủ hộ phụ trách hiện tại
              hoặc mã CH. Nếu số điện thoại dùng chung với tài khoản cá nhân,
              chọn loại tài khoản phù hợp.
            </p>
          </details>
          <div className="password-field">
            <Field
              label="Mật khẩu"
              name="mat_khau"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              <Icon name={showPassword ? "eyeOff" : "eye"} />
            </button>
          </div>
          <ErrorBox error={error} />
          <button className="primary auth-submit" disabled={pending}>
            {pending ? "Đang đăng nhập…" : "Đăng nhập"}
            <Icon name="arrow" size={18} />
          </button>
        </form>
        <p className="muted">
          Chưa có tài khoản hoặc quên mật khẩu? Liên hệ Ban quản lý để được xác
          minh.
        </p>
        <Link to="/">Về cổng dịch vụ</Link>
      </section>
    </div>
  );
}
export function Account() {
  const { user, setUser } = useAuth();
  const [error, setError] = useState(),
    [pending, setPending] = useState(false),
    [done, setDone] = useState(false);
  if (done)
    return (
      <div className="card">
        <h1>Đã đổi mật khẩu</h1>
        <p>Tất cả phiên cũ đã kết thúc.</p>
        <Link to="/dang-nhap" onClick={() => setUser(null)}>
          Đăng nhập lại
        </Link>
      </div>
    );
  return (
    <section className="card narrow">
      <h1>Tài khoản</h1>
      <p>
        {user.ho_va_ten} · {roleNames[user.vai_tro]}
      </p>
      <p>{user.ten_dang_nhap || user.so_dien_thoai}</p>
      {user.ma_can_ho_thanh_toan && (
        <p>
          Số điện thoại đăng nhập:{" "}
          {user.dien_thoai_dang_nhap || "Chưa gắn chủ hộ"}
        </p>
      )}
      <h2>Đổi mật khẩu</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          setError(null);
          if (form.get("mat_khau_moi") !== form.get("xac_nhan")) {
            setError(new Error("Mật khẩu xác nhận không khớp."));
            return;
          }
          setPending(true);
          try {
            await getJson("/xac_thuc/doi_mat_khau", {
              method: "POST",
              body: Object.fromEntries(form),
            });
            setDone(true);
          } catch (err) {
            setError(err);
          } finally {
            setPending(false);
          }
        }}
      >
        <Field
          label="Mật khẩu hiện tại"
          name="mat_khau_cu"
          type="password"
          required
          autoComplete="current-password"
        />
        <Field
          label="Mật khẩu mới (ít nhất 10 ký tự)"
          name="mat_khau_moi"
          type="password"
          minLength={10}
          required
          autoComplete="new-password"
        />
        <Field
          label="Nhập lại mật khẩu mới"
          name="xac_nhan"
          type="password"
          minLength={10}
          required
          autoComplete="new-password"
        />
        <ErrorBox error={error} />
        <button className="primary" disabled={pending}>
          Đổi mật khẩu và kết thúc mọi phiên
        </button>
      </form>
    </section>
  );
}
```

### File 7: `frontend/src/features/incidents/PublicReports.jsx`

**Thay toàn bộ.** Cổng cư dân với tìm kiếm/danh mục; giữ luồng QR, ảnh và bản nháp.

```jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { useReportDraft } from "../../shared/use-report-draft.js";
import { useAuth } from "../auth/Auth.jsx";
import Icon from "../../shared/Icon.jsx";
import PhotoCarousel from "../../shared/PhotoCarousel.jsx";
import {
  filterServices,
  portalServices,
  serviceCategories,
} from "./portal-services.js";
import {
  Badge,
  categories,
  ErrorBox,
  Field,
  ImagesInput,
  Loading,
  Options,
  Timeline,
  useResource,
} from "../../shared/ui.jsx";
export function Portal() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const catalog = useRef(null);
  const services = portalServices(user);
  const results = filterServices(services, query, category);
  const technician = user?.vai_tro === "KY_THUAT_VIEN";
  const suggestions = technician
    ? ["Công việc", "Bảo trì", "Phản ánh"]
    : ["Hóa đơn", "Đặt lịch", "Phản ánh"];
  const categories = serviceCategories.filter(
    ([id]) =>
      id === "all" || services.some((service) => service.category === id),
  );
  function showCatalog(event) {
    event.preventDefault();
    catalog.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }
  return (
    <>
      <section className="portal-hero">
        <div className="hero">
          <p className="eyebrow">Dịch vụ dành cho cư dân</p>
          <h1>
            Bạn cần hỗ trợ
            <br />
            điều gì hôm nay?
          </h1>
          <p>
            {technician
              ? "Phản ánh sự cố, theo dõi công việc và bảo trì thiết bị. Tìm đúng dịch vụ và bắt đầu ngay tại đây."
              : "Phản ánh sự cố, thanh toán hóa đơn hay đặt lịch tiện ích. Tìm đúng dịch vụ và bắt đầu ngay tại đây."}
          </p>
          <form
            className="catalog-search"
            role="search"
            aria-label="Tìm dịch vụ cư dân"
            onSubmit={showCatalog}
          >
            <label className="sr-only" htmlFor="service-search">
              Tìm dịch vụ
            </label>
            <Icon name="search" size={22} />
            <input
              id="service-search"
              type="search"
              autoComplete="off"
              maxLength={80}
              placeholder="Bạn đang tìm dịch vụ gì?"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCategory("all");
              }}
            />
            <button type="submit">
              Tìm kiếm
              <Icon name="arrow" size={18} />
            </button>
          </form>
          <div className="hero-suggestions">
            <span>Thường dùng:</span>
            {suggestions.map((label) => (
              <button
                key={label}
                type="button"
                onClick={(event) => {
                  setQuery(label);
                  setCategory("all");
                  showCatalog(event);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <Link className="hero-qr-link" to="/quet-qr">
            <Icon name="qr" size={18} />
            Quét QR để phản ánh
            <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="portal-illustration">
          <PhotoCarousel />
        </div>
      </section>
      <section
        className="service-catalog"
        aria-labelledby="catalog-title"
        id="dich-vu"
        ref={catalog}
      >
        <div className="catalog-heading">
          <div>
            <h2 id="catalog-title">Chọn dịch vụ bạn cần</h2>
            <p>Thông tin rõ ràng, thao tác ngay khi cần.</p>
          </div>
          <span role="status" aria-live="polite">
            {results.length} dịch vụ
            {query.trim() ? ` cho “${query.trim()}”` : ""}
          </span>
        </div>
        <div
          className="catalog-categories"
          role="group"
          aria-label="Danh mục dịch vụ"
        >
          {categories.map(([id, label]) => (
            <button
              type="button"
              key={id}
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {results.length ? (
          <ul className="service-grid" aria-label="Danh sách dịch vụ">
            {results.map((service) => {
              const needsLogin = !user && !service.access;
              return (
                <li key={service.id}>
                  <Link
                    className="service-card"
                    aria-label={service.title}
                    to={needsLogin ? "/dang-nhap" : service.path}
                    state={needsLogin ? { service: service.id } : undefined}
                  >
                    <div
                      className={`service-card-top service-tone-${service.category}`}
                    >
                      <span className="service-symbol">
                        <Icon name={service.icon} size={24} />
                      </span>
                      <span>
                        {
                          serviceCategories.find(
                            ([id]) => id === service.category,
                          )?.[1]
                        }
                      </span>
                    </div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <div className="service-card-bottom">
                      <span>
                        {service.access ||
                          (needsLogin ? "Đăng nhập để sử dụng" : "Mở dịch vụ")}
                      </span>
                      <Icon name="arrow" size={18} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="catalog-empty">
            <Icon name="search" size={28} />
            <h3>Chưa tìm thấy dịch vụ phù hợp</h3>
            <p>
              Thử từ khóa “hóa đơn”, “đặt lịch” hoặc xem lại tất cả dịch vụ.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
            >
              Xem tất cả dịch vụ
            </button>
          </div>
        )}
      </section>
      <section className="portal-how" aria-labelledby="how-title">
        <div>
          <p className="eyebrow">Khi có sự cố tại tòa nhà</p>
          <h2 id="how-title">
            Phản ánh dễ dàng.
            <br />
            Theo dõi rõ ràng.
          </h2>
          <p>
            Không cần đăng nhập để gửi phản ánh qua QR. Mã tra cứu riêng giúp
            bạn theo dõi từng bước xử lý.
          </p>
          <Link to="/tra-cuu">
            Tôi đã gửi phản ánh
            <Icon name="arrow" size={16} />
          </Link>
        </div>
        <ol className="portal-steps">
          {[
            [
              "Quét mã tại vị trí",
              "Mở camera điện thoại và quét QR tại khu vực hoặc thiết bị.",
            ],
            [
              "Mô tả và gửi ảnh",
              "Chọn loại sự cố, nhập thông tin liên hệ và thêm ảnh hiện trường.",
            ],
            [
              "Theo dõi kết quả",
              "Lưu mã tra cứu, xem tiến độ và phản hồi sau khi xử lý.",
            ],
          ].map(([title, description], i) => (
            <li key={title}>
              <span aria-hidden="true">0{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <p className="portal-emergency">
        <Icon name="shield" size={18} />
        Trường hợp nguy hiểm tức thời, hãy liên hệ trực tiếp Ban quản lý hoặc cơ
        quan khẩn cấp.
      </p>
    </>
  );
}
export function Scanner() {
  const navigate = useNavigate(),
    [error, setError] = useState(),
    [running, setRunning] = useState(false);
  const scanner = useRef(),
    mounted = useRef(true);
  function open(value) {
    const url = new URL(value, window.location.origin);
    if (
      url.origin !== window.location.origin ||
      !/^\/r\/[0-9a-f-]{36}$/i.test(url.pathname)
    )
      throw new Error("Mã QR không thuộc hệ thống này.");
    navigate(url.pathname);
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (scanner.current?.isScanning) scanner.current.stop().catch(() => {});
    };
  }, []);
  async function start() {
    setError(null);
    if (!window.isSecureContext) {
      setError(
        new Error(
          "Không mở được camera vì địa chỉ HTTP qua IP mạng nội bộ chưa có kết nối bảo mật. Hãy dùng HTTPS đã được thiết bị tin cậy, hoặc dùng ứng dụng Camera điện thoại quét mã QR đang hiển thị trên máy tính.",
        ),
      );
      return;
    }
    setRunning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!mounted.current) return;
      scanner.current = new Html5Qrcode("qr-reader");
      await scanner.current.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: 220 },
        (value) => {
          try {
            open(value);
          } catch (err) {
            if (mounted.current) setError(err);
          }
        },
        () => {},
      );
      if (!mounted.current && scanner.current.isScanning)
        await scanner.current.stop();
    } catch {
      if (mounted.current) {
        setRunning(false);
        setError(
          new Error(
            "Không mở được camera. Hãy cấp quyền và dùng HTTPS, hoặc quét mã bằng camera điện thoại rồi mở liên kết.",
          ),
        );
      }
    }
  }
  return (
    <section className="card narrow">
      <h1>Quét mã QR</h1>
      <p>Đưa camera hướng về mã QR của vị trí cần phản ánh.</p>
      <div id="qr-reader" />
      {!running && (
        <button className="primary" onClick={start}>
          Mở camera
        </button>
      )}
      <ErrorBox error={error} />
      <hr />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            open(new FormData(e.currentTarget).get("url"));
          } catch (err) {
            setError(err);
          }
        }}
      >
        <Field
          label="Hoặc dán liên kết QR của tòa nhà"
          name="url"
          type="text"
          required
          placeholder="/r/…"
        />
        <button>Mở biểu mẫu</button>
      </form>
    </section>
  );
}
export function SubmitReport() {
  const { token } = useParams(),
    { user, loading: authLoading } = useAuth(),
    resource = useResource(`/cong_khai/vi_tri_qr/${encodeURIComponent(token)}`);
  const form = useRef(null);
  const draft = useReportDraft(token, user?.ma_nguoi_dung);
  const [error, setError] = useState(),
    [pending, setPending] = useState(false),
    [receipt, setReceipt] = useState(),
    [confirmed, setConfirmed] = useState(false),
    [copy, setCopy] = useState("");
  if (resource.loading || authLoading) return <Loading />;
  if (resource.error)
    return (
      <div className="card">
        <h1>Không mở được vị trí</h1>
        <ErrorBox error={resource.error} />
        <Link to="/quet-qr">Quét mã khác</Link>
      </div>
    );
  if (receipt)
    return (
      <section className="card narrow">
        <p className="eyebrow">ĐÃ TIẾP NHẬN</p>
        <h1>Cảm ơn bạn đã phản ánh</h1>
        <p>Ban quản lý sẽ kiểm tra và phân công xử lý.</p>
        <Field label="Mã tra cứu riêng">
          <textarea readOnly value={receipt.ma_tra_cuu} rows={3} />
        </Field>
        <p className="muted">
          Lưu mã này và dùng cùng số điện thoại đã nhập. Không chia sẻ mã công
          khai.
        </p>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(receipt.ma_tra_cuu);
              setCopy("Đã sao chép mã.");
            } catch {
              setCopy("Hãy chọn và sao chép mã trong ô phía trên.");
            }
          }}
        >
          Sao chép mã
        </button>
        <p role="status">{copy}</p>
        <Link
          className="button primary"
          to="/tra-cuu"
          state={{ code: receipt.ma_tra_cuu }}
        >
          Tra cứu tiến độ
        </Link>
      </section>
    );
  return (
    <section className="card narrow">
      <p className="eyebrow">PHẢN ÁNH TẠI VỊ TRÍ</p>
      <h1>{resource.result.data.ten_vi_tri}</h1>
      {resource.result.data.thiet_bi && (
        <p className="note">
          Thiết bị: {resource.result.data.thiet_bi.ma_tai_san} ·{" "}
          {resource.result.data.thiet_bi.ten_thiet_bi}
        </p>
      )}
      <p className="muted">{resource.result.data.mo_ta}</p>
      {draft.restored && (
        <p className="note" role="status">
          Đã khôi phục nội dung bản nháp. Nếu trước đó đã chọn ảnh, hãy chọn lại
          ảnh trước khi gửi.
        </p>
      )}
      {draft.warning && (
        <p className="note" role="status">
          {draft.warning}
        </p>
      )}
      <form
        ref={form}
        onInput={(event) => draft.save(event.currentTarget)}
        onSubmit={async (e) => {
          e.preventDefault();
          draft.save(e.currentTarget);
          const data = new FormData(e.currentTarget);
          data.set("token_qr", token);
          if (resource.result.data.phien_ban_qr !== undefined)
            data.set("phien_ban_qr", String(resource.result.data.phien_ban_qr));
          data.set("khoa_yeu_cau", draft.requestKey);
          if (confirmed) data.set("xac_nhan_gui", "true");
          setPending(true);
          setError(null);
          try {
            const result = await getJson("/cong_khai/phan_anh", {
              method: "POST",
              body: data,
            });
            draft.clear();
            setReceipt(result.data);
          } catch (err) {
            setError(err);
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="Loại sự cố">
          <select
            name="loai_su_co"
            required
            defaultValue={draft.values.loai_su_co || "DIEN"}
          >
            <Options values={categories} />
          </select>
        </Field>
        <Field
          label="Tiêu đề"
          name="tieu_de"
          defaultValue={draft.values.tieu_de || ""}
          required
          minLength={3}
          maxLength={150}
          placeholder="Ví dụ: Đèn hành lang không sáng"
        />
        <Field label="Mô tả chi tiết">
          <textarea
            name="noi_dung"
            defaultValue={draft.values.noi_dung || ""}
            required
            minLength={10}
            maxLength={5000}
            rows={4}
          />
        </Field>
        <ImagesInput
          disabled={pending}
          onBeforeChoose={() => draft.save(form.current)}
        />
        <div className="form-grid">
          <Field
            label="Họ tên"
            name="ten_nguoi_gui"
            defaultValue={draft.values.ten_nguoi_gui ?? user?.ho_va_ten ?? ""}
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
          />
          <Field
            label="Số điện thoại"
            name="so_dien_thoai"
            type="tel"
            defaultValue={
              draft.values.so_dien_thoai ?? user?.so_dien_thoai ?? ""
            }
            required
            autoComplete="tel"
          />
        </div>
        <Field
          label="Căn hộ (tùy chọn)"
          name="can_ho_khai_bao"
          defaultValue={draft.values.can_ho_khai_bao || ""}
          maxLength={40}
        />
        <small className="muted">
          Thông tin căn hộ do người gửi khai báo, chưa được xác minh.
        </small>
        <ErrorBox error={error} />
        {error?.code === "SIMILAR_REPORT" && (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Tôi vẫn muốn gửi phản ánh riêng
          </label>
        )}
        <button
          className="primary full"
          disabled={pending || (error?.code === "SIMILAR_REPORT" && !confirmed)}
        >
          {pending ? "Đang gửi…" : "Gửi phản ánh"}
        </button>
      </form>
    </section>
  );
}
export function LookupReport({ initialCode = "" }) {
  const [result, setResult] = useState(),
    [error, setError] = useState(),
    [pending, setPending] = useState(false);
  return (
    <section className="card narrow">
      <p className="eyebrow">THEO DÕI TIẾN ĐỘ</p>
      <h1>Tra cứu phản ánh</h1>
      <p className="muted">
        Nhập mã được cấp khi gửi và số điện thoại tương ứng.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          setResult(null);
          try {
            setResult(
              (
                await getJson("/cong_khai/phan_anh/tra_cuu", {
                  method: "POST",
                  body: Object.fromEntries(new FormData(e.currentTarget)),
                })
              ).data,
            );
          } catch (err) {
            setError(err);
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="Mã tra cứu">
          <textarea
            name="ma_tra_cuu"
            defaultValue={initialCode}
            required
            minLength={64}
            maxLength={64}
            rows={3}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <Field
          label="Số điện thoại"
          name="so_dien_thoai"
          type="tel"
          required
          autoComplete="tel"
        />
        <ErrorBox error={error} />
        <button className="primary" disabled={pending}>
          {pending ? "Đang tra cứu…" : "Tra cứu"}
        </button>
      </form>
      {result && (
        <div className="lookup-result">
          <h2>{result.ten_vi_tri}</h2>
          <Badge status={result.trang_thai} />
          <Timeline items={result.lich_su} />
        </div>
      )}
    </section>
  );
}
```

### File 8: `frontend/src/features/dashboard/Dashboard.jsx`

**Thay toàn bộ.** Tiêu đề và nhóm số liệu vận hành dễ đọc.

```jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { Badge, ErrorBox, Loading, priorities } from "../../shared/ui.jsx";
import "./Dashboard.css";
import DashboardCharts from "./DashboardCharts.jsx";
import Icon from "../../shared/Icon.jsx";

const amount = (value) => `${BigInt(value || 0).toLocaleString("vi-VN")} đ`;
const day = (value) =>
  value ? value.slice(0, 10).split("-").reverse().join("/") : "Chưa đặt hạn";
const clock = (value, utc = false) =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value.replace(" ", "T") + (utc ? "Z" : "+07:00")));
const jobs = {
  MOI: "Mới lập",
  DA_PHAN_CONG: "Đã phân công",
  DANG_THUC_HIEN: "Đang thực hiện",
  CHO_NGHIEM_THU: "Chờ nghiệm thu",
};
function useOverview() {
  const [revision, setRevision] = useState(0),
    [state, setState] = useState({ loading: true });
  useEffect(() => {
    const controller = new AbortController();
    setState({ revision, loading: true });
    getJson("/tong_quan", { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted)
          setState({ revision, data: result.data, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ revision, error, loading: false });
      });
    return () => controller.abort();
  }, [revision]);
  return {
    ...(state.revision === revision ? state : { loading: true }),
    revision,
    reload: () => setRevision((n) => n + 1),
  };
}
function Metric({ title, value, hint, to, money = false, alert = false }) {
  return (
    <Link
      className={`overview-metric${alert ? " overview-alert" : ""}`}
      to={to}
    >
      <span className="metric-label">
        {title}
        <span className="metric-icon">
          <Icon
            name={
              money ? "wallet" : to.includes("bao-tri") ? "tool" : "message"
            }
          />
        </span>
      </span>
      <strong>
        {money ? amount(value) : Number(value).toLocaleString("vi-VN")}
      </strong>
      <small>{hint}</small>
    </Link>
  );
}
function Mini({ title, value, to }) {
  return (
    <Link className="overview-mini" to={to}>
      <span>{title}</span>
      <strong>{Number(value).toLocaleString("vi-VN")}</strong>
    </Link>
  );
}
function Panel({ title, hint, to, label, children }) {
  return (
    <section className="card overview-panel">
      <div className="overview-panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{hint}</p>
        </div>
        <Link to={to}>{label || "Xem tất cả"} →</Link>
      </div>
      {children}
    </section>
  );
}
function Queue({ items, empty, render }) {
  return items.length ? (
    <ul className="overview-queue">{items.map(render)}</ul>
  ) : (
    <p className="overview-empty">{empty}</p>
  );
}
export default function Dashboard() {
  const resource = useOverview(),
    data = resource.data;
  const debt = "/quan-tri/bao-cao-tai-chinh?che_do=HOA_DON",
    overdue = `${debt}&qua_han=1`;
  const receipts = data
    ? `/quan-tri/bao-cao-tai-chinh?bao_cao=THU_PHI&tu_ngay=${data.tu_ngay_thu}&den_ngay=${data.den_ngay_thu}`
    : "";
  return (
    <div className="overview-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Không gian điều hành</p>
          <h1>Tổng quan vận hành</h1>
          <p className="muted">
            Các khoản cần thu, phản ánh và công việc cần chú ý hôm nay.
          </p>
        </div>
        <button
          type="button"
          disabled={resource.loading}
          onClick={resource.reload}
        >
          <Icon name="refresh" size={17} />
          {resource.loading ? "Đang cập nhật…" : "Cập nhật số liệu"}
        </button>
      </div>
      <ErrorBox error={resource.error} />
      {resource.loading && <Loading />}
      {data && (
        <>
          <p className="overview-stamp">
            Dữ liệu lúc <strong>{clock(data.tai_luc, true)}</strong> · Giờ Việt
            Nam
          </p>
          <section
            className="overview-metrics"
            aria-label="Chỉ số vận hành chính"
          >
            <Metric
              title="Còn phải thu"
              value={data.tai_chinh.con_phai_thu}
              money
              hint={`${data.tai_chinh.can_con_no} căn · ${data.tai_chinh.hoa_don_chua_thu} hóa đơn đã gửi chưa thu`}
              to={debt}
            />
            <Metric
              title="Thu phí trong tháng"
              value={data.tai_chinh.thu_trong_thang}
              money
              hint={`Ngày xác nhận thu: ${day(data.tu_ngay_thu)} – ${day(data.den_ngay_thu)}`}
              to={receipts}
            />
            <Metric
              title="Phản ánh đang mở"
              value={data.phan_anh.dang_mo}
              hint={`${data.phan_anh.moi} mới · ${data.phan_anh.cho_nghiem_thu} chờ nghiệm thu`}
              to="/quan-tri/phan-anh?trang_thai=DANG_MO"
            />
            <Metric
              title="Phiếu bảo trì quá hạn"
              value={data.bao_tri.phieu_qua_han}
              hint="Phiếu còn mở, hạn trước hôm nay"
              to="/quan-tri/bao-tri?qua_han=1"
              alert={data.bao_tri.phieu_qua_han > 0}
            />
          </section>
        </>
      )}
      <DashboardCharts refresh={resource.revision} />
      {data && (
        <>
          <div className="overview-grid">
            <Panel
              title="Công nợ cần theo dõi"
              hint="Tất cả kỳ hóa đơn đã gửi, ưu tiên hạn thanh toán sớm."
              to={debt}
              label="Báo cáo công nợ"
            >
              <div className="overview-debt">
                <Link to={overdue}>
                  <span>Nợ quá hạn</span>
                  <strong>{amount(data.tai_chinh.no_qua_han)}</strong>
                </Link>
                <p>
                  {data.tai_chinh.hoa_don_qua_han} hóa đơn quá hạn. Hóa đơn đến
                  hạn hôm nay chưa tính quá hạn.
                </p>
              </div>
              <Queue
                items={data.tai_chinh.hoa_don}
                empty="Không có hóa đơn đã gửi còn phải thu."
                render={(r) => (
                  <li key={r.ma_hoa_don}>
                    <div>
                      <Link to={`/quan-tri/hoa-don/${r.ma_hoa_don}`}>
                        {r.so_hoa_don}
                      </Link>
                      <small>
                        Căn {r.so_can_ho} · Kỳ {r.ky_thanh_toan}
                      </small>
                      <small>
                        Hạn trả: {day(r.han_thanh_toan)}{" "}
                        {r.qua_han ? "· Quá hạn" : ""}
                      </small>
                    </div>
                    <strong>{amount(r.tong_tien)}</strong>
                  </li>
                )}
              />
            </Panel>
            <Panel
              title="Phản ánh cần xử lý"
              hint="Ưu tiên khẩn cấp trước, sau đó phản ánh gửi sớm."
              to="/quan-tri/phan-anh"
            >
              <div className="overview-minis">
                {[
                  ["MOI", "Mới", "moi"],
                  ["DA_PHAN_CONG", "Đã phân công", "da_phan_cong"],
                  ["DANG_XU_LY", "Đang xử lý", "dang_xu_ly"],
                  ["DA_XU_LY", "Chờ nghiệm thu", "cho_nghiem_thu"],
                ].map(([state, title, key]) => (
                  <Mini
                    key={state}
                    title={title}
                    value={data.phan_anh[key]}
                    to={`/quan-tri/phan-anh?trang_thai=${state}`}
                  />
                ))}
              </div>
              <Queue
                items={data.phan_anh.danh_sach}
                empty="Không có phản ánh đang mở."
                render={(r) => (
                  <li key={r.ma_phan_anh}>
                    <div>
                      <Link to={`/quan-tri/phan-anh/${r.ma_phan_anh}`}>
                        #{r.ma_phan_anh} · {r.tieu_de}
                      </Link>
                      <small>
                        {r.ten_vi_tri} · {priorities[r.do_uu_tien]}
                      </small>
                      <small>{r.ky_thuat_vien || "Chưa phân công"}</small>
                    </div>
                    <Badge status={r.trang_thai} />
                  </li>
                )}
              />
            </Panel>
            <Panel
              title="Bảo trì thiết bị"
              hint="Theo dõi phiếu công việc và lịch bảo trì của thiết bị."
              to="/quan-tri/bao-tri"
              label="Phiếu bảo trì"
            >
              <div className="overview-minis">
                <Mini
                  title="Thiết bị quá hạn"
                  value={data.bao_tri.thiet_bi_qua_han}
                  to="/quan-tri/thiet-bi?lich=QUA_HAN"
                />
                <Mini
                  title="Thiết bị sắp đến hạn"
                  value={data.bao_tri.thiet_bi_sap_den_han}
                  to="/quan-tri/thiet-bi?lich=SAP_DEN_HAN"
                />
                <Mini
                  title="Chờ nghiệm thu"
                  value={data.bao_tri.cho_nghiem_thu}
                  to="/quan-tri/bao-tri?trang_thai=CHO_NGHIEM_THU"
                />
                <Mini
                  title="Phiếu quá hạn"
                  value={data.bao_tri.phieu_qua_han}
                  to="/quan-tri/bao-tri?qua_han=1"
                />
              </div>
              <Queue
                items={data.bao_tri.danh_sach}
                empty="Không có phiếu bảo trì đang mở."
                render={(r) => (
                  <li key={r.ma_phieu_bao_tri}>
                    <div>
                      <Link to={`/quan-tri/bao-tri/${r.ma_phieu_bao_tri}`}>
                        #{r.ma_phieu_bao_tri} · {r.tieu_de}
                      </Link>
                      <small>
                        {r.ten_thiet_bi_luc_lap} · Hạn {day(r.ngay_den_han)}
                      </small>
                      <small>{r.ky_thuat_vien || "Chưa phân công"}</small>
                    </div>
                    <span className="overview-pill">{jobs[r.trang_thai]}</span>
                  </li>
                )}
              />
            </Panel>
            <Panel
              title="Đặt lịch tiện ích"
              hint="Lượt đang diễn ra và sắp tới; lịch đã hủy/từ chối được bỏ qua."
              to="/quan-tri/dat-lich"
              label="Quản lý lượt đặt"
            >
              <div className="overview-minis">
                <Mini
                  title="Lượt chờ duyệt"
                  value={data.tien_ich.cho_duyet}
                  to="/quan-tri/dat-lich?trang_thai=CHO_DUYET"
                />
                <Mini
                  title="Đã duyệt hôm nay"
                  value={data.tien_ich.da_duyet_hom_nay}
                  to={`/quan-tri/dat-lich?trang_thai=DA_DUYET&ngay=${data.ngay_hien_tai}`}
                />
              </div>
              <p className="overview-note">
                Số chờ duyệt gồm cả lượt đã qua giờ. Mở danh sách để kiểm tra
                trạng thái từng lượt.
              </p>
              <Queue
                items={data.tien_ich.danh_sach}
                empty="Không có lượt đang diễn ra hoặc sắp tới."
                render={(r) => (
                  <li key={r.ma_dat_lich}>
                    <div>
                      <Link to={`/quan-tri/dat-lich/${r.ma_dat_lich}`}>
                        {r.ten_tien_ich}
                      </Link>
                      <small>
                        {clock(r.bat_dau)} – {r.ket_thuc.slice(11, 16)}
                      </small>
                      <small>
                        Căn {r.so_can_ho} · {r.ten_nguoi_dat} · {r.so_nguoi}{" "}
                        người
                      </small>
                    </div>
                    <span className="overview-pill">
                      {r.trang_thai === "DA_DUYET" ? "Đã duyệt" : "Chờ duyệt"}
                    </span>
                  </li>
                )}
              />
            </Panel>
          </div>
          <p className="overview-note">
            Mỗi nhóm hiển thị tối đa 5 mục. Số đếm tính trên toàn bộ dữ liệu; mở
            danh sách để xem đầy đủ. Thu phí dựa trên ngày xác nhận thu, công nợ
            dựa trên hóa đơn đã gửi chưa thu.
          </p>
        </>
      )}
    </div>
  );
}
```

### File 9: `frontend/src/styles/professional.css`

**Thay toàn bộ.** Giao diện chung của mọi phân hệ: màu, chữ, biểu mẫu, bảng và responsive.

```css
/* Lớp giao diện chung, nạp sau CSS nghiệp vụ để giữ nguyên chức năng từng màn hình. */
:root {
  --ink: #22272b;
  --muted: #626970;
  --brand: #17624d;
  --brand-deep: #104734;
  --brand-soft: #eff5f0;
  --line: #e1e3e1;
  --canvas: #f6f7f8;
  --accent: #f3cf58;
  --accent-deep: #e5ba34;
  --surface: #fff;
  --shadow: none;
  font-family:
    "Segoe UI",
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  color: var(--ink);
  background: var(--canvas);
  font-size: 14px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
body {
  min-width: 320px;
}
::selection {
  background: #c9e6d9;
  color: #133e35;
}
a {
  color: var(--brand);
}
.icon {
  display: inline-block;
  flex: 0 0 auto;
  vertical-align: middle;
}
button,
.button {
  min-height: 42px;
  padding: 10px 16px;
  border: 1px solid #cbd8d4;
  border-radius: 6px;
  color: #354d56;
  font-size: 13px;
  font-weight: 600;
  transition:
    background 0.16s,
    border-color 0.16s,
    box-shadow 0.16s;
}
button:hover:not(:disabled),
.button:hover {
  background: #f0f6f3;
  border-color: #9fbeb1;
}
button:disabled,
.button[aria-disabled="true"] {
  opacity: 0.55;
}
.primary {
  color: white;
  background: var(--brand);
  border-color: var(--brand);
  box-shadow: none;
}
.primary:hover:not(:disabled),
.button.primary:hover {
  background: var(--brand-deep);
  color: white;
  border-color: var(--brand-deep);
}
.danger {
  background: #fff5f4;
  color: #a33335;
  border-color: #edccca;
}
:focus-visible {
  outline: 3px solid #368a75;
  outline-offset: 3px;
}
button:active:not(:disabled),
.button:active {
  transform: translateY(1px);
}
input,
select,
textarea {
  font-size: 14px;
  color: var(--ink);
  border: 1px solid #cbd8d4;
  border-radius: 8px;
  padding: 11px 12px;
  min-height: 44px;
  background: white;
}
input::placeholder,
textarea::placeholder {
  color: #7b8b94;
  opacity: 1;
}
input:focus,
select:focus,
textarea:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px #1264570d;
}
input:disabled,
select:disabled,
textarea:disabled,
input[readonly] {
  background: #f4f7f6;
  color: #5a6d75;
}
input[type="checkbox"],
input[type="radio"] {
  accent-color: var(--brand);
  flex-shrink: 0;
}
input[type="file"] {
  padding: 8px;
  background: #f8faf9;
  font-size: 13px;
}
input[type="file"]::file-selector-button {
  border: 1px solid var(--line);
  padding: 8px 12px;
  margin-right: 10px;
  border-radius: 6px;
  background: white;
  color: var(--brand);
  font-weight: 600;
  cursor: pointer;
}
textarea {
  min-height: 112px;
}
.field {
  gap: 7px;
  margin-bottom: 18px;
  min-width: 0;
}
.field > label {
  color: #374f58;
  font-size: 13px;
  font-weight: 600;
}
.form-grid {
  gap: 0 20px;
}
form {
  min-width: 0;
}
h1,
h2,
h3 {
  color: var(--ink);
  line-height: 1.3;
  letter-spacing: -0.02em;
}
h1 {
  font-size: clamp(24px, 2.2vw, 29px);
  font-weight: 700;
  margin: 0 0 22px;
}
h2 {
  font-size: 18px;
  font-weight: 650;
}
h3 {
  font-size: 15px;
}
.muted,
.note {
  color: var(--muted);
}
.note {
  font-size: 12px;
  line-height: 1.75;
}
.eyebrow {
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
  margin: 0 0 8px;
}
.app-shell {
  min-height: 100vh;
}
.skip-link {
  position: fixed;
  top: -100px;
  left: 16px;
  padding: 12px 18px;
  background: var(--brand-deep);
  color: white;
  border-radius: 8px;
  z-index: 100;
}
.skip-link:focus {
  top: 12px;
}
.topbar {
  height: 80px;
  padding: 0 36px;
  gap: 28px;
  position: relative;
  z-index: 30;
  border-bottom: 1px solid var(--line);
  background: white;
}
.brand {
  gap: 11px;
  font-size: 16px;
  letter-spacing: 0.8px;
  color: var(--brand-deep);
  flex-shrink: 0;
}
.brand-icon {
  width: 40px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 5px;
  border: 1px solid #ddba48;
  background: var(--accent);
  color: var(--ink);
}
.brand small {
  font-size: 8px;
  letter-spacing: 1.4px;
  margin-top: 3px;
  color: var(--muted);
}
.topbar-context {
  font-size: 12px;
  color: var(--muted);
  padding-left: 26px;
  border-left: 1px solid var(--line);
  margin-right: auto;
}
.top-links {
  display: flex;
  align-items: center;
  gap: 24px;
  font-size: 13px;
}
.top-links .lookup-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  text-decoration: none;
  font-weight: 600;
  color: #4d626b;
  min-height: 44px;
}
.top-links .lookup-link:hover {
  color: var(--brand);
}
.profile-menu {
  position: relative;
}
.profile-menu summary {
  display: flex;
  list-style: none;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  border-radius: 6px;
  padding: 6px;
}
.profile-menu summary::-webkit-details-marker {
  display: none;
}
.profile-menu summary:hover {
  background: var(--brand-soft);
}
.avatar {
  text-transform: uppercase;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #e6f0ea;
  color: var(--brand);
  font-size: 12px;
  font-weight: 700;
}
.profile-name {
  font-size: 12px;
  font-weight: 650;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.profile-name small {
  display: block;
  font-size: 10px;
  font-weight: 400;
  color: var(--muted);
}
.profile-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: 260px;
  background: white;
  border: 1px solid var(--line);
  padding: 8px;
  box-shadow: 0 14px 40px #1b303b24;
  border-radius: 8px;
}
.profile-dropdown p {
  padding: 8px 10px 14px;
  margin: 0 0 6px;
  border-bottom: 1px solid var(--line);
  font-weight: 650;
  overflow-wrap: anywhere;
}
.profile-dropdown p small {
  display: block;
  color: var(--muted);
  font-weight: 400;
  font-size: 12px;
}
.profile-dropdown a,
.profile-dropdown button {
  width: 100%;
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  border: 0;
  padding: 10px;
  color: var(--ink);
  border-radius: 7px;
}
.profile-dropdown a:hover {
  background: var(--brand-soft);
}
.profile-dropdown button {
  color: #a33335;
}
.workspace {
  display: grid;
  grid-template-columns: 238px minmax(0, 1fr);
  max-width: 1920px;
  margin: 0 auto;
  align-items: start;
}
.sidebar {
  position: sticky;
  top: 0;
  height: 100dvh;
  max-height: 100dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #c5d5ce transparent;
  padding: 22px 12px 18px;
  border-right: 1px solid var(--line);
  background: white;
}
.sidebar-heading {
  padding: 0 12px 13px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--line);
}
.sidebar-heading .eyebrow {
  display: block;
  font-size: 10px;
  letter-spacing: 0.2px;
  color: #546e64;
  margin: 0;
}
.mobile-menu-toggle {
  display: none;
}
.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.nav-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.nav-group-label {
  font-size: 11px;
  text-transform: none;
  letter-spacing: 0.2px;
  font-weight: 650;
  color: #667c76;
  padding: 0 12px;
  margin: 0 0 6px;
}
.sidebar nav a {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  min-height: 40px;
  color: #50616b;
  border-radius: 8px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.45;
  border: 1px solid transparent;
}
.sidebar nav a .icon {
  color: #789087;
}
.sidebar nav a:hover {
  color: var(--brand);
  background: #f3f8f5;
}
.sidebar nav a.active {
  background: #f0f4f0;
  color: var(--brand-deep);
  border-color: transparent;
  box-shadow: inset 3px 0 var(--brand);
  font-weight: 650;
}
.sidebar nav a.active .icon {
  color: var(--brand);
}
.sidebar .public-link {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 15px 12px 0;
  border-top: 1px solid var(--line);
  margin-top: 22px;
  font-size: 12px;
  color: var(--muted);
  text-decoration: none;
}
.public-link > span:last-child {
  margin-left: auto;
}
.notification-count {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  margin-left: auto;
  background: var(--brand);
  color: white;
  font-size: 10px;
  border-radius: 6px;
  padding: 0 5px;
}
.workspace main {
  padding: 32px clamp(20px, 2.4vw, 40px) 48px;
  min-width: 0;
  min-height: calc(100vh - 76px);
}
main:focus {
  outline: none;
}
.public-space {
  max-width: 1280px;
  margin: 0 auto;
  padding: 42px 40px;
  min-height: calc(100vh - 150px);
}
.page-heading {
  align-items: center;
  gap: 18px;
  margin-bottom: 26px;
}
.page-heading h1 {
  margin-bottom: 0;
}
.page-heading .muted {
  margin-bottom: 0;
  margin-top: 9px;
  max-width: 750px;
  font-size: 13px;
}
.page-heading > .actions {
  margin: 0;
}
.card {
  background: white;
  padding: 24px;
  margin-bottom: 22px;
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  min-width: 0;
}
.card > h2:first-child {
  margin-top: 0;
}
.card .card {
  box-shadow: none;
  border-color: #e6edeb;
  border-radius: 7px;
}
.detail-grid {
  align-items: start;
}
.narrow {
  max-width: 720px;
}
.actions {
  gap: 10px;
  flex-wrap: wrap;
}
.filters {
  gap: 12px 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 18px;
  align-items: end;
}
.filters .field {
  margin-bottom: 0;
}
.table-wrap {
  border: 1px solid var(--line);
  border-radius: 7px;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: #bdcfc6 #f4f7f5;
  overscroll-behavior-x: contain;
}
table {
  font-size: 13px;
  background: white;
}
th {
  font-size: 11px;
  font-weight: 650;
  color: #5a7079;
  background: #f6f7f7;
  letter-spacing: 0.15px;
  white-space: nowrap;
}
th,
td {
  padding: 14px 16px;
  border-bottom-color: #eaf0ed;
}
td {
  color: #3f484e;
  vertical-align: middle;
}
td:first-child {
  min-width: 140px;
}
td:last-child {
  color: #566f76;
}
td a:not(.button) {
  font-weight: 600;
  text-decoration: none;
}
td a:not(.button):hover {
  text-decoration: underline;
}
tbody tr:last-child td {
  border-bottom: 0;
}
tbody tr:hover {
  background: #f8fbf9;
}
td .button,
td button {
  min-height: 36px;
  padding: 7px 11px;
  font-size: 12px;
}
.pagination {
  padding-top: 18px;
  font-size: 12px;
  gap: 10px;
  flex-wrap: wrap;
}
.pagination button {
  min-height: 38px;
  font-size: 12px;
}
.badge {
  padding: 4px 9px;
  font-weight: 650;
  font-size: 10px;
  border-radius: 6px;
  white-space: nowrap;
  letter-spacing: 0.1px;
}
.status-MOI {
  color: #296794;
  background: #eaf3fc;
}
.status-DA_PHAN_CONG {
  color: #5d4c91;
  background: #f0ecfa;
}
.status-DANG_XU_LY {
  color: #98621e;
  background: #fff4de;
}
.status-DA_XU_LY {
  color: #146b62;
  background: #e2f3ee;
}
.status-DA_DONG {
  color: #396550;
  background: #eaf2ec;
}
.status-TU_CHOI {
  color: #a34543;
  background: #fceeee;
}
.error {
  border: 1px solid #f0d1cb;
  border-left: 3px solid #c95c4a;
  background: #fff6f3;
  color: #9b382e;
  font-size: 13px;
  border-radius: 6px;
  padding: 14px 16px;
  overflow-wrap: anywhere;
}
.error strong {
  font-weight: 600;
}
.success {
  padding: 14px 16px;
  border: 1px solid #b9dbc8;
  border-left: 3px solid #29845c;
  border-radius: 6px;
  color: #246446;
  background: #eff9f1;
}
.empty,
.overview-empty,
.trend-empty {
  background: #f7faf8;
  padding: 24px 18px;
  border: 1px dashed #d1dfd8;
  border-radius: 7px;
  color: var(--muted);
}
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 130px;
  font-size: 13px;
}
.loading-spinner {
  width: 22px;
  height: 22px;
  border: 2px solid #d9e8e0;
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: loading-turn 0.8s linear infinite;
}
@keyframes loading-turn {
  to {
    transform: rotate(360deg);
  }
}
.metadata {
  gap: 14px 20px;
  font-size: 13px;
}
.metadata dt {
  color: var(--muted);
}
.timeline {
  border-left-color: #dbe8e1;
}
.timeline li {
  padding-bottom: 24px;
}
.timeline time {
  font-size: 11px;
  color: var(--muted);
}
.image-grid img {
  border-radius: 6px;
  border: 1px solid var(--line);
  object-fit: cover;
}
details > summary {
  cursor: pointer;
  color: var(--brand);
  font-weight: 600;
  padding: 8px 0;
}
.location-list li {
  border-bottom-color: var(--line);
  padding: 18px 0;
}
.stats,
.finance-stats,
.maintenance-stats,
.treasury-metrics {
  gap: 14px;
}
.stats .stat {
  border: 1px solid var(--line);
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--shadow);
}
.stats .stat strong {
  color: var(--ink);
  font-size: 32px;
}
.overview-page > .page-heading {
  padding: 0 0 22px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 16px;
}
.overview-page > .page-heading .eyebrow {
  color: #53796a;
}
.overview-page > .page-heading h1 {
  color: var(--ink);
}
.overview-page > .page-heading button {
  background: white;
  flex-shrink: 0;
}
.overview-stamp {
  font-size: 11px;
  margin: 0 0 20px;
  color: var(--muted);
}
.overview-metrics {
  gap: 0;
  background: white;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}
.overview-metric {
  padding: 22px;
  border: 0;
  border-left: 1px solid var(--line);
  border-radius: 0;
  gap: 12px;
  box-shadow: none;
  background: white;
  position: relative;
}
.overview-metric:hover {
  background: #fafbf9;
  border-color: var(--line);
  box-shadow: inset 0 -3px var(--brand);
}
.overview-metric > .metric-label {
  color: #526a72;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}
.metric-icon {
  color: #77817b;
  flex: 0 0 auto;
  display: inline-flex;
}
.overview-metric > strong {
  font-size: clamp(22px, 1.8vw, 29px);
  font-weight: 700;
  letter-spacing: -0.6px;
  color: var(--ink);
}
.overview-metric > small {
  font-size: 11px;
  color: var(--muted);
}
.overview-alert .metric-icon {
  color: #ab5336;
  background: #fff0e7;
}
.overview-alert > strong {
  color: #a24e32;
}
.overview-panel-heading h2 {
  font-size: 16px;
}
.overview-panel-heading p,
.overview-panel-heading > a {
  font-size: 12px;
}
.overview-panel-heading > a {
  text-decoration: none;
}
.overview-mini {
  background: #f6f7f6;
  border: 0;
  border-radius: 5px;
  padding: 12px;
}
.overview-mini > span {
  font-size: 12px;
}
.overview-mini > strong {
  font-size: 21px;
}
.overview-queue a {
  font-size: 13px;
  text-decoration: none;
}
.overview-queue small {
  font-size: 11px;
  color: var(--muted);
}
.overview-debt {
  background: #fff7eb;
  border: 1px solid #f3e6d0;
  border-radius: 6px;
}
.trends {
  padding: 22px 24px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: white;
  box-shadow: var(--shadow);
}
.trends-heading h2 {
  font-size: 17px;
}
.trends-heading p {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 0;
}
.trends-filters {
  background: #f6f9f7;
  box-shadow: none;
  margin-top: 20px;
  border-color: var(--line);
}
.trends-visibility {
  background: #fafcfb;
  border-color: var(--line);
}
.trends-grid {
  gap: 16px;
}
.trend-card {
  box-shadow: none;
  border-radius: 7px;
  padding: 20px;
}
.trend-card h3 {
  font-size: 15px;
}
.trend-detail {
  background: #edf5f0;
}
.report-tabs,
.finance-tabs,
.maintenance-tabs,
.treasury-tabs {
  gap: 8px;
  flex-wrap: wrap;
}
.report-export {
  padding: 14px 16px;
  border: 1px solid #e3ece7;
  background: #f6f9f7;
  border-radius: 6px;
  gap: 10px;
}
.data-tools {
  gap: 12px;
}
.data-tools .button,
.report-export button {
  min-height: 36px;
  padding: 7px 12px;
  font-size: 12px;
}
.report-export small {
  font-size: 11px;
  color: var(--muted);
}
.import-help {
  background: #f2f7f4;
  border-radius: 7px;
  border: 1px solid var(--line);
}
.import-steps {
  font-size: 13px;
  gap: 12px 20px;
  color: var(--brand);
}
.maintenance-actions,
.treasury-actions {
  gap: 16px;
}
.amenity-card,
.fund-card,
.treasury-fund {
  border-color: var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
}
.amenity-card h2,
.fund-card h2 {
  font-size: 17px;
}
.amenity-slot {
  border-radius: 8px;
}
.payment-card {
  padding: 0;
  max-width: 980px;
  margin: 24px auto;
  overflow: hidden;
}
.payment-header {
  text-align: center;
  padding: 28px;
  background: #edf5f0;
  border-bottom: 1px solid #dfeae3;
}
.payment-header h2 {
  font-size: 23px;
  color: #174c3f;
}
.payment-body {
  max-width: 720px;
  padding: 32px;
}
.payment-amount {
  color: #145747;
  letter-spacing: -0.7px;
}
.payment-qr-frame {
  border-radius: 8px;
  border-color: #d5e4db;
  box-shadow: 0 6px 22px #1a4d3a0d;
}
.payment-details > div {
  padding: 14px 0;
}
.payment-download {
  background: var(--brand);
  color: white;
  border-color: var(--brand);
}
.payment-download:hover {
  color: var(--brand);
}
.bank-picker {
  background: #f5f9f6;
  border-color: #dbe8df;
  border-radius: 7px;
}
.bill-total {
  padding-top: 18px;
  color: #164e40;
}
.qr-print {
  padding: 28px;
}
.qr-image {
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid var(--line);
}
footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 20px;
  font-size: 12px;
  color: var(--muted);
  padding: 26px max(24px, calc((100% - 1200px) / 2));
  border-top: 1px solid var(--line);
  background: white;
}
.footer-brand {
  font-weight: 700;
  letter-spacing: 1px;
  color: #567368;
}

/* Điều hướng và tìm nhanh. Phạm vi tìm kiếm là các chức năng được cấp cho vai trò. */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.is-public {
  background: #faf9f6;
}
.public-nav {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-right: auto;
  margin-left: 24px;
}
.public-nav a {
  color: #464d50;
  text-decoration: none;
  font-size: 13px;
  font-weight: 550;
}
.public-nav a:hover {
  color: var(--brand);
  text-decoration: underline;
}
.top-links {
  margin-left: auto;
}
.function-search {
  position: relative;
  width: min(380px, 35vw);
  margin-left: 14px;
}
.function-search form {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f6f7f6;
  border: 1px solid #e3e5e3;
  border-radius: 6px;
  padding: 0 8px 0 12px;
  color: #6c7470;
}
.function-search input {
  border: 0;
  background: transparent;
  box-shadow: none;
  padding: 10px 0;
  min-width: 0;
  min-height: 42px;
  font-size: 13px;
}
.function-search input:focus {
  box-shadow: none;
  outline: none;
}
.function-search form:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px #17624d14;
}
.function-search form button {
  min-height: 32px;
  width: 32px;
  padding: 0;
  background: transparent;
  border: 0;
}
.function-results {
  position: absolute;
  z-index: 40;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  min-width: 280px;
  background: white;
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 12px 30px #22272b20;
  overflow: hidden;
}
.function-results > p {
  font-size: 11px;
  color: var(--muted);
  background: #fafbf9;
  padding: 12px 16px;
  margin: 0;
  border-bottom: 1px solid var(--line);
}
.function-results ul {
  margin: 0;
  padding: 5px;
  list-style: none;
}
.function-results li a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  text-decoration: none;
  color: var(--ink);
  border-radius: 4px;
  font-size: 13px;
}
.function-results li a:hover,
.function-results li a:focus-visible {
  background: #f1f5ef;
}
.function-results li a > .icon:first-child {
  color: var(--brand);
}
.function-results li a > .icon:last-child {
  margin-left: auto;
  color: #7a837c;
}
.function-results small {
  display: block;
  font-size: 10px;
  color: var(--muted);
}
.function-no-result {
  display: block;
  font-size: 12px;
  padding: 12px 16px 20px;
  color: var(--muted);
}
.overview-metric:first-child {
  border-left: 0;
}
.overview-panel-heading {
  border-bottom: 1px solid var(--line);
  padding-bottom: 18px;
}
.overview-panel-heading h2 {
  font-size: 17px;
}
.overview-alert .metric-icon {
  background: none;
}

/* Cổng cư dân: tìm kiếm trước, danh mục và nội dung dịch vụ phía dưới. */
.portal-hero {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  align-items: center;
  gap: 64px;
  padding: 8px 0 54px;
}
.hero {
  padding: 0;
  max-width: 670px;
  min-width: 0;
}
.hero .eyebrow {
  font-size: 13px;
  font-weight: 550;
  color: #626968;
  margin: 0 0 16px;
}
.hero h1 {
  font-size: clamp(34px, 3.8vw, 52px);
  line-height: 1.16;
  font-weight: 700;
  letter-spacing: -1.6px;
  margin: 0 0 20px;
  color: #242b2b;
}
.hero > p:not(.eyebrow) {
  font-size: 15px;
  max-width: 530px;
  line-height: 1.8;
  color: var(--muted);
  margin: 0 0 24px;
}
.catalog-search {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1.5px solid #454e48;
  border-radius: 6px;
  padding: 5px 5px 5px 16px;
  background: white;
}
.catalog-search:focus-within {
  outline: 3px solid #d2b44c45;
  outline-offset: 2px;
}
.catalog-search > .icon {
  color: #59655d;
}
.catalog-search input {
  min-width: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
  padding: 8px 0;
  min-height: 46px;
  font-size: 14px;
}
.catalog-search input:focus {
  box-shadow: none;
  outline: none;
}
.catalog-search button {
  flex-shrink: 0;
  background: var(--accent);
  color: #292d27;
  border: 1px solid #e6c453;
  min-height: 46px;
  padding: 10px 15px;
  border-radius: 3px;
}
.catalog-search button:hover {
  background: var(--accent-deep);
  border-color: #d4ab33;
}
.hero-suggestions {
  display: flex;
  align-items: center;
  gap: 6px 12px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--muted);
  margin: 12px 0 22px;
}
.hero-suggestions button {
  font-size: 11px;
  min-height: 30px;
  padding: 2px 0;
  border: 0;
  border-radius: 0;
  text-decoration: underline;
  text-decoration-color: #aab5ae;
  text-underline-offset: 4px;
  background: transparent;
  color: #3e4c44;
}
.hero-suggestions button:hover {
  background: transparent;
  color: var(--brand);
  border: 0;
}
.hero-qr-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}
.hero-qr-link:hover {
  text-decoration: underline;
}
.portal-hero .portal-illustration {
  min-width: 0;
  width: 100%;
  padding: 0;
}
.portal-illustration .photo-carousel {
  transform: none;
  border-radius: 8px;
  border-color: #e0e1d9;
  box-shadow: none;
}
.portal-illustration .photo-carousel-viewport {
  aspect-ratio: 1.28;
}
.photo-carousel-caption p {
  font-size: 23px;
  letter-spacing: -0.6px;
}
.photo-carousel-caption > span {
  font-size: 11px;
}
.photo-carousel-label {
  border-radius: 3px;
  letter-spacing: 0.4px;
  font-size: 9px;
  font-weight: 600;
}
.photo-carousel-label .live-dot {
  width: 6px;
  height: 6px;
  background: var(--brand);
  border-radius: 50%;
}
.photo-carousel-toolbar {
  min-height: 52px;
  padding: 6px 12px;
}
.photo-carousel-toolbar button {
  color: var(--brand);
}
.service-catalog {
  scroll-margin-top: 24px;
  border-top: 1px solid #dedfd8;
  padding: 32px 0 0;
}
.catalog-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}
.catalog-heading h2 {
  font-size: 25px;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}
.catalog-heading p {
  color: var(--muted);
  margin: 0;
  font-size: 13px;
}
.catalog-heading > span {
  max-width: 40%;
  overflow-wrap: anywhere;
  font-size: 12px;
  color: var(--muted);
}
.catalog-categories {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}
.catalog-categories button {
  background: transparent;
  border-color: transparent;
  border-radius: 4px;
  min-height: 38px;
  font-size: 12px;
  padding: 8px 14px;
  color: #5e655e;
}
.catalog-categories button:hover {
  background: #eeeee7;
  border-color: transparent;
}
.catalog-categories button[aria-pressed="true"] {
  background: #29372e;
  border-color: #29372e;
  color: white;
}
.service-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.service-grid > li {
  min-width: 0;
}
.service-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 240px;
  padding: 23px;
  border: 1px solid #dedfd9;
  border-radius: 6px;
  background: white;
  text-decoration: none;
  color: var(--ink);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.service-card:hover {
  border-color: #829e8a;
  box-shadow: 0 3px 0 #d8e4d8;
}
.service-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64726a;
  font-size: 10px;
}
.service-symbol {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 4px;
  background: #edf4ec;
  color: #426e4c;
}
.service-tone-finance .service-symbol {
  background: #f9f0d4;
  color: #876f21;
}
.service-tone-living .service-symbol {
  background: #edf1f9;
  color: #536c97;
}
.service-tone-account .service-symbol {
  background: #f2edf5;
  color: #7a5b88;
}
.service-card h3 {
  font-size: 18px;
  margin: 18px 0 8px;
  line-height: 1.4;
}
.service-card > p {
  font-size: 13px;
  line-height: 1.75;
  color: var(--muted);
  margin: 0 0 22px;
}
.service-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 13px;
  border-top: 1px solid #eceee9;
  color: var(--brand);
  font-size: 11px;
}
.catalog-empty {
  text-align: center;
  background: white;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 38px 20px;
  color: var(--muted);
}
.catalog-empty h3 {
  margin: 16px 0 8px;
  font-size: 18px;
}
.catalog-empty p {
  font-size: 13px;
}
.portal-how {
  margin-top: 54px;
  padding: 32px;
  background: #f0f0e9;
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 64px;
  border-radius: 6px;
}
.portal-how h2 {
  font-size: 28px;
  margin: 0 0 16px;
  line-height: 1.3;
}
.portal-how > div > p:not(.eyebrow) {
  font-size: 13px;
  color: var(--muted);
  max-width: 340px;
}
.portal-how a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}
.portal-steps {
  margin: 0;
  padding: 0;
  list-style: none;
}
.portal-steps li {
  display: flex;
  align-items: start;
  gap: 22px;
  border-bottom: 1px solid #d9ddd3;
  padding: 19px 0;
}
.portal-steps li:first-child {
  padding-top: 0;
}
.portal-steps li:last-child {
  border: 0;
  padding-bottom: 0;
}
.portal-steps li > span {
  color: #8c9884;
  font-size: 24px;
  font-weight: 400;
  line-height: 1.4;
}
.portal-steps h3 {
  font-size: 15px;
  margin: 0 0 6px;
}
.portal-steps p {
  font-size: 12px;
  color: var(--muted);
  margin: 0;
}
.portal-emergency {
  font-size: 11px;
  color: var(--muted);
  display: flex;
  align-items: start;
  gap: 8px;
  margin: 22px 0 0;
}
.portal-emergency .icon {
  margin-top: 2px;
}

/* Đăng nhập giữ ảnh thật, đưa biểu mẫu và hướng dẫn lên trước. */
.auth-layout {
  display: grid;
  grid-template-columns: 1fr 1.05fr;
  max-width: 1000px;
  margin: 8px auto 26px;
  background: white;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}
.auth-story {
  background: #f0f0e9;
  padding: 34px 30px 26px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.auth-story-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #626e5e;
  font-size: 11px;
}
.auth-story h2 {
  font-size: 34px;
  letter-spacing: -1px;
  line-height: 1.25;
  margin: 26px 0 16px;
}
.auth-story > p {
  font-size: 13px;
  color: var(--muted);
  max-width: 330px;
  margin: 0;
}
.auth-story .photo-carousel {
  border-radius: 6px;
  border-color: #dedfd7;
  margin: 26px 0 20px;
}
.auth-story .photo-carousel-viewport {
  aspect-ratio: 1.45;
}
.auth-story .photo-carousel-caption p {
  font-size: 20px;
}
.auth-story .photo-carousel-caption > span {
  font-size: 11px;
}
.auth-trust {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 11px;
  color: #65725e;
  margin-top: auto;
}
.auth-form.card {
  padding: 40px;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  margin: 0;
}
.auth-form h1 {
  font-size: 29px;
  margin: 0 0 8px;
}
.auth-form > .eyebrow {
  color: #6e756a;
  margin-bottom: 12px;
}
.auth-form > .muted {
  font-size: 13px;
  margin-bottom: 26px;
}
.login-help {
  font-size: 12px;
  margin: -7px 0 20px;
}
.login-help summary {
  padding: 4px 0;
  font-weight: 500;
}
.login-help p {
  background: #f8f8f4;
  padding: 12px;
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 12px;
  border-left: 2px solid #cdd5c5;
}
.password-field {
  position: relative;
}
.password-field input {
  padding-right: 48px;
}
.password-toggle {
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 40px;
  height: 38px;
  min-height: 38px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted);
}
.auth-submit {
  width: 100%;
  min-height: 46px;
  justify-content: space-between;
  margin-top: 6px;
}
.auth-form > .muted:last-of-type {
  font-size: 12px;
  margin: 22px 0 16px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.auth-form > a {
  font-size: 12px;
  text-decoration: none;
}

@media (min-width: 1600px) {
  .overview-grid,
  .trends-grid {
    gap: 24px;
  }
}
@media (max-width: 1200px) {
  .workspace {
    grid-template-columns: 222px minmax(0, 1fr);
  }
  .sidebar {
    padding-left: 9px;
    padding-right: 9px;
  }
  .workspace main {
    padding: 26px 24px 40px;
  }
  .overview-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .overview-metric:nth-child(3) {
    border-left: 0;
  }
  .overview-metric:nth-child(n + 3) {
    border-top: 1px solid var(--line);
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .portal-hero {
    gap: 32px;
  }
  .hero h1 {
    font-size: 42px;
  }
  .catalog-search {
    gap: 8px;
    padding-left: 12px;
  }
  .public-nav {
    margin-left: 0;
    gap: 20px;
  }
  .function-search {
    width: min(330px, 30vw);
    margin-left: 0;
  }
}
@media (max-width: 900px) {
  .topbar {
    height: auto;
    min-height: 72px;
    padding: 14px 22px;
    gap: 18px;
    flex-wrap: wrap;
  }
  .public-nav {
    display: none;
  }
  .function-search {
    order: 3;
    width: 100%;
  }
  .function-results {
    max-height: 55dvh;
    overflow-y: auto;
  }
  .workspace {
    display: block;
  }
  .sidebar {
    position: relative;
    top: auto;
    height: auto;
    max-height: none;
    border-right: 0;
    border-bottom: 1px solid var(--line);
    padding: 10px 22px 8px;
    overflow: visible;
  }
  .sidebar-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0;
    margin: 0 0 8px;
    border: 0;
  }
  .sidebar-heading .eyebrow {
    display: block;
    font-size: 10px;
    letter-spacing: 0;
  }
  .mobile-menu-toggle {
    display: inline-flex;
    padding: 5px 8px;
    min-height: 34px;
    border-color: transparent;
    font-size: 11px;
    gap: 7px;
  }
  .sidebar nav {
    position: relative;
    flex-direction: row;
    gap: 6px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: thin;
    padding-bottom: 4px;
  }
  .nav-group {
    display: contents;
  }
  .nav-group-label {
    display: none;
  }
  .sidebar nav a {
    flex: 0 0 auto;
    min-height: 40px;
    padding: 9px 12px;
    gap: 7px;
    font-size: 12px;
    white-space: nowrap;
  }
  .sidebar nav a .icon {
    width: 17px;
    height: 17px;
  }
  .sidebar nav a.active {
    box-shadow: inset 0 -2px var(--brand);
  }
  .sidebar.is-expanded nav {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    max-height: 55dvh;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .sidebar.is-expanded nav a {
    white-space: normal;
  }
  .sidebar.is-expanded .mobile-menu-toggle > .icon:last-child {
    transform: rotate(180deg);
  }
  .sidebar .public-link {
    display: none;
  }
  .workspace main {
    min-height: 65vh;
  }
  .public-space {
    padding: 32px 24px;
  }
  .hero h1 {
    font-size: 37px;
    letter-spacing: -1px;
  }
  .portal-hero {
    grid-template-columns: 1.2fr 1fr;
    gap: 24px;
  }
  .hero > p:not(.eyebrow) {
    font-size: 13px;
  }
  .catalog-search {
    flex-wrap: wrap;
    gap: 0 8px;
  }
  .catalog-search input {
    width: calc(100% - 38px);
    font-size: 14px;
  }
  .catalog-search button {
    width: 100%;
    min-height: 40px;
  }
  .hero-suggestions {
    gap: 4px 10px;
    margin-bottom: 14px;
  }
  .portal-illustration .photo-carousel-viewport {
    aspect-ratio: 0.95;
  }
  .service-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .portal-how {
    gap: 32px;
    padding: 26px;
  }
  .auth-story {
    padding: 30px 24px;
  }
  .auth-story h2 {
    font-size: 29px;
  }
  .auth-form.card {
    padding: 30px;
  }
}
@media (max-width: 650px) {
  .topbar {
    min-height: 66px;
    padding: 12px 16px;
    gap: 10px;
    align-items: center;
  }
  .brand {
    font-size: 13px;
    gap: 8px;
  }
  .brand-icon {
    width: 32px;
    height: 36px;
    border-radius: 4px;
  }
  .brand-icon .icon {
    width: 21px;
    height: 21px;
  }
  .brand small {
    font-size: 6px;
    letter-spacing: 1.1px;
  }
  .top-links {
    gap: 12px;
    flex-wrap: nowrap;
    max-width: none;
    font-size: 12px;
  }
  .top-links .lookup-link {
    font-size: 11px;
    gap: 4px;
  }
  .top-links .lookup-link .icon {
    display: none;
  }
  .top-links .button {
    font-size: 11px;
    padding: 9px 10px;
    min-height: 38px;
  }
  .top-links .button .icon {
    display: none;
  }
  .profile-name {
    display: none;
  }
  .profile-menu summary {
    gap: 4px;
    padding: 0;
    min-height: 40px;
  }
  .profile-menu summary > .icon {
    display: none;
  }
  .avatar {
    width: 32px;
    height: 32px;
    font-size: 10px;
  }
  .function-search form input {
    font-size: 16px;
  }
  .function-results {
    min-width: 0;
  }
  .sidebar {
    padding: 8px 16px;
  }
  .sidebar.is-expanded nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .workspace main {
    padding: 24px 16px 32px;
  }
  .public-space {
    padding: 26px 16px 32px;
  }
  h1 {
    font-size: 24px;
    letter-spacing: -0.6px;
    overflow-wrap: anywhere;
  }
  .page-heading {
    align-items: start;
    flex-wrap: wrap;
    gap: 14px;
    margin-bottom: 22px;
  }
  .page-heading > div:first-child {
    min-width: 0;
  }
  .page-heading > .actions {
    width: 100%;
  }
  .page-heading .muted {
    font-size: 12px;
  }
  .card {
    padding: 18px;
    border-radius: 7px;
    margin-bottom: 18px;
  }
  .filters {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  input,
  select,
  textarea {
    font-size: 16px;
  }
  .field {
    margin-bottom: 17px;
  }
  th,
  td {
    padding: 12px;
  }
  table {
    font-size: 12px;
  }
  .table-wrap {
    border-radius: 5px;
  }
  td:first-child {
    min-width: 120px;
  }
  .overview-page > .page-heading {
    padding: 0 0 20px;
  }
  .overview-page > .page-heading h1 {
    font-size: 24px;
  }
  .overview-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .overview-metric {
    padding: 15px 12px;
    gap: 10px;
  }
  .overview-metric > .metric-label {
    align-items: start;
    font-size: 11px;
    gap: 5px;
  }
  .metric-icon .icon {
    width: 17px;
    height: 17px;
  }
  .overview-metric > strong {
    font-size: clamp(17px, 4.4vw, 24px);
    letter-spacing: -0.4px;
  }
  .overview-metric > small {
    font-size: 10px;
    line-height: 1.65;
  }
  .trends {
    padding: 18px;
  }
  .payment-header {
    padding: 22px 18px;
  }
  .payment-body {
    padding: 24px 18px;
  }
  .payment-amount {
    font-size: 30px;
  }
  .payment-details {
    font-size: 12px;
  }
  .payment-details > div {
    gap: 12px;
  }
  .qr-print {
    padding: 18px;
  }
  .portal-hero {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 26px;
    padding: 0 0 30px;
  }
  .hero {
    max-width: 100%;
  }
  .hero .eyebrow {
    font-size: 12px;
    margin-bottom: 12px;
  }
  .hero h1 {
    font-size: 35px;
    line-height: 1.18;
    letter-spacing: -1.1px;
    margin-bottom: 16px;
  }
  .hero > p:not(.eyebrow) {
    font-size: 14px;
    margin-bottom: 20px;
  }
  .catalog-search {
    flex-wrap: nowrap;
    gap: 8px;
  }
  .catalog-search input {
    width: 100%;
    font-size: 16px;
    min-height: 42px;
  }
  .catalog-search > .icon {
    width: 18px;
    height: 18px;
  }
  .catalog-search button {
    width: 43px;
    height: 42px;
    min-height: 42px;
    padding: 0;
    font-size: 0;
    gap: 0;
  }
  .catalog-search button .icon {
    width: 19px;
    height: 19px;
  }
  .hero-qr-link {
    font-size: 12px;
  }
  .portal-hero .portal-illustration {
    width: 100%;
    padding: 0;
  }
  .portal-illustration .photo-carousel {
    border-radius: 6px;
  }
  .portal-illustration .photo-carousel-viewport {
    aspect-ratio: 1.8;
  }
  .portal-illustration .photo-carousel-caption p {
    font-size: 19px;
    margin-bottom: 0;
  }
  .portal-illustration .photo-carousel-caption > span {
    display: none;
  }
  .portal-illustration .photo-carousel-label {
    font-size: 8px;
    top: 12px;
    left: 14px;
  }
  .portal-illustration .photo-carousel-caption {
    bottom: 16px;
    left: 16px;
    right: 16px;
  }
  .photo-carousel-toolbar {
    padding: 4px 8px;
    min-height: 48px;
  }
  .service-catalog {
    padding-top: 25px;
  }
  .catalog-heading {
    align-items: start;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 18px;
  }
  .catalog-heading h2 {
    font-size: 23px;
  }
  .catalog-heading > span {
    max-width: 100%;
    font-size: 11px;
  }
  .catalog-categories {
    gap: 4px;
    margin-bottom: 16px;
  }
  .catalog-categories button {
    font-size: 11px;
    padding: 8px 10px;
    min-height: 38px;
  }
  .service-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .service-card {
    padding: 20px;
    min-height: 0;
  }
  .service-card h3 {
    font-size: 18px;
    margin-top: 14px;
  }
  .service-card > p {
    margin-bottom: 18px;
  }
  .portal-how {
    grid-template-columns: 1fr;
    gap: 24px;
    margin-top: 32px;
    padding: 22px;
  }
  .portal-how h2 {
    font-size: 25px;
  }
  .portal-steps li {
    gap: 16px;
    padding: 17px 0;
  }
  .portal-emergency {
    line-height: 1.8;
  }
  .auth-layout {
    display: block;
    margin: 0 auto;
    border-radius: 7px;
    max-width: 480px;
  }
  .auth-layout .auth-story {
    padding: 0;
  }
  .auth-layout .auth-story > .auth-story-label,
  .auth-layout .auth-story > h2,
  .auth-layout .auth-story > p,
  .auth-trust {
    display: none;
  }
  .auth-layout .auth-story .photo-carousel {
    border: 0;
    border-radius: 0;
    margin: 0;
  }
  .auth-story .photo-carousel-viewport {
    aspect-ratio: 1.8;
  }
  .auth-form.card {
    padding: 26px 22px;
  }
  .auth-form > .eyebrow {
    font-size: 11px;
  }
  .auth-form h1 {
    font-size: 26px;
  }
  .auth-form > .muted {
    margin-bottom: 22px;
  }
  footer {
    font-size: 10px;
    padding: 20px 16px;
    gap: 5px;
    flex-direction: column;
    align-items: start;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto;
    transition: none;
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
  }
  button,
  .button,
  .service-card {
    transition: none;
  }
  .loading-spinner {
    animation: none;
  }
}
@media print {
  .topbar,
  .sidebar,
  footer,
  .skip-link {
    display: none;
  }
  .workspace {
    display: block;
  }
  .workspace main,
  .public-space {
    padding: 0;
  }
  .card {
    box-shadow: none;
  }
}
```

## 5. File kiểm thử (tùy chọn khi cập nhật giao diện thủ công)

Ba file này phục vụ kiểm thử phát triển, không cần chép để web chạy. Chúng dùng database riêng `chung_cu_test` khi chạy E2E; không dùng database nghiệm thu làm database kiểm thử.

```powershell
node --test scripts/service-navigation.test.js
npm run test:e2e
```

### `scripts/service-navigation.test.js`

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { matchesSearch } from "../frontend/src/shared/search.js";
import {
  filterServices,
  portalServices,
  serviceDestination,
} from "../frontend/src/features/incidents/portal-services.js";
import { isFunctionActive } from "../frontend/src/app/navigation.js";

test("tìm tiếng Việt có/không dấu, đ và khoảng trắng", () => {
  assert.equal(matchesSearch("HOADON", "Hóa đơn của tôi"), true);
  assert.equal(matchesSearch("dien nuoc", "Chỉ số điện nước"), true);
  assert.equal(matchesSearch("  đặt-lịch ", "Đặt lịch tiện ích"), true);
  assert.equal(matchesSearch("thu chi", "Hóa đơn"), false);
});

test("bộ lọc danh mục và từ khóa cùng áp dụng; trạng thái rỗng có thể khôi phục", () => {
  const catalog = portalServices(null);
  assert.deepEqual(
    filterServices(catalog, "hoadon", "finance").map((s) => s.id),
    ["bills"],
  );
  assert.equal(filterServices(catalog, "hoadon", "account").length, 0);
  assert.equal(filterServices(catalog, "khong co dich vu nay").length, 0);
  assert.equal(filterServices(catalog, "").length, catalog.length);
});

test("ý định đăng nhập chỉ mở dịch vụ có sẵn và đúng vai trò", () => {
  assert.equal(
    serviceDestination({ vai_tro: "CU_DAN" }, "bills"),
    "/cu-dan/hoa-don",
  );
  assert.equal(
    serviceDestination({ vai_tro: "QUAN_TRI_VIEN" }, "bills"),
    "/quan-tri/hoa-don",
  );
  assert.equal(
    serviceDestination({ vai_tro: "KY_THUAT_VIEN" }, "bills"),
    undefined,
  );
  for (const value of [
    "https://example.com",
    "//example.com",
    "/quan-tri/nhan-su",
    {},
    null,
  ])
    assert.equal(serviceDestination({ vai_tro: "CU_DAN" }, value), undefined);
});

test("danh mục kỹ thuật không có lối tắt tới tài chính hoặc quản trị", () => {
  const paths = portalServices({ vai_tro: "KY_THUAT_VIEN" }).map((s) => s.path);
  assert.ok(paths.includes("/ky-thuat/cong-viec"));
  assert.ok(paths.includes("/ky-thuat/bao-tri"));
  assert.ok(
    !paths.some((p) => p.startsWith("/quan-tri") || p.includes("hoa-don")),
  );
});

test("menu đánh dấu đúng trang chi tiết và các danh sách con", () => {
  assert.equal(
    isFunctionActive("/quan-tri/bao-tri/42", "/quan-tri/thiet-bi"),
    true,
  );
  assert.equal(
    isFunctionActive("/quan-tri/dat-lich/42", "/quan-tri/tien-ich"),
    true,
  );
  assert.equal(
    isFunctionActive("/quan-tri/phieu-thu-chi/42", "/quan-tri/quy"),
    true,
  );
  assert.equal(
    isFunctionActive("/cu-dan/dat-lich/42", "/cu-dan/tien-ich"),
    true,
  );
  assert.equal(
    isFunctionActive("/quan-tri/can-ho/42", "/quan-tri/can-ho"),
    true,
  );
  assert.equal(
    isFunctionActive("/quan-tri/can-ho-khac", "/quan-tri/can-ho"),
    false,
  );
  assert.equal(isFunctionActive("/quan-tri/hoa-don", "/quan-tri"), false);
});
```

### `e2e/service-discovery.spec.js`

```javascript
import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";

for (const width of [1440, 375]) {
  test(`service catalog: search, categories, empty state and guest access at ${width}px`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.goto("/");
      const catalog = page.getByRole("region", {
        name: "Chọn dịch vụ bạn cần",
      });
      const list = catalog.getByRole("list", { name: "Danh sách dịch vụ" });
      await expect(list.getByRole("link")).toHaveCount(6);
      const search = page.getByLabel("Tìm dịch vụ", { exact: true });
      await search.fill("hoa don");
      await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
      await expect(list.getByRole("link")).toHaveCount(1);
      await expect(
        list.getByRole("link", { name: "Hóa đơn & thanh toán", exact: true }),
      ).toBeVisible();
      await catalog
        .getByRole("button", { name: "Tài khoản", exact: true })
        .click();
      await expect(
        catalog.getByRole("heading", { name: "Chưa tìm thấy dịch vụ phù hợp" }),
      ).toBeVisible();
      await catalog
        .getByRole("button", { name: "Xem tất cả dịch vụ", exact: true })
        .click();
      await expect(search).toHaveValue("");
      await expect(list.getByRole("link")).toHaveCount(6);
      await catalog
        .getByRole("button", { name: "Phản ánh & hỗ trợ", exact: true })
        .click();
      await expect(list.getByRole("link")).toHaveCount(2);
      await list
        .getByRole("link", { name: "Gửi phản ánh", exact: true })
        .click();
      await expect(page).toHaveURL(/\/quet-qr$/);
      await expect(
        page.getByRole("heading", { name: "Quét mã QR", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

for (const [role, width, title, path, query, label] of [
  [
    "QUAN_TRI_VIEN",
    1440,
    "Hóa đơn & thanh toán",
    "/quan-tri/hoa-don",
    "hoadon",
    "Phí & hóa đơn",
  ],
  [
    "CU_DAN",
    375,
    "Hóa đơn & thanh toán",
    "/cu-dan/hoa-don",
    "hoadon",
    "Hóa đơn của tôi",
  ],
  [
    "KY_THUAT_VIEN",
    768,
    "Đặt lịch tiện ích",
    "/ky-thuat/cong-viec",
    "baotri",
    "Bảo trì thiết bị",
  ],
]) {
  test(`service intent and function search use the signed-in role: ${role}`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex");
    const phone =
      "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
    const password = randomBytes(16).toString("hex");
    let id;
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    try {
      id = (
        await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,?)",
          [
            `Tìm dịch vụ ${suffix}`,
            phone,
            await bcrypt.hash(password, 10),
            role,
          ],
        )
      ).insertId;
      await page.goto("/");
      await page
        .getByRole("list", { name: "Danh sách dịch vụ" })
        .getByRole("link", { name: title, exact: true })
        .click();
      await expect(page).toHaveURL(/\/dang-nhap$/);
      // Phiên thật từ service, không tiêu thụ hạn mức đăng nhập HTTP dùng chung.
      await page.route("**/api/xac_thuc/dang_nhap", async (route) => {
        const session = await login(route.request().postDataJSON());
        await context.addCookies([
          {
            name: "session",
            value: session.token,
            url: "http://127.0.0.1:5174",
            httpOnly: true,
            sameSite: "Strict",
          },
        ]);
        await route.fulfill({ json: { data: session.user } });
      });
      await page.getByLabel("Số điện thoại hoặc tài khoản căn hộ").fill(phone);
      await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
      await page
        .getByRole("button", { name: "Đăng nhập", exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      const search = page.getByRole("searchbox", {
        name: "Tìm chức năng",
        exact: true,
      });
      await search.fill(query);
      const results = page.getByRole("list", { name: "Kết quả tìm chức năng" });
      await expect(results.getByRole("link")).toHaveCount(1);
      await search.press("ArrowDown");
      await expect(
        results.getByRole("link", { name: new RegExp(label) }),
      ).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(search).toBeFocused();
      await expect(results).not.toBeVisible();
      await search.fill("khongtimthaychucnang");
      await expect(results.getByRole("link")).toHaveCount(0);
      await search.fill(query);
      await search.press("Enter");
      if (role === "KY_THUAT_VIEN")
        await expect(page).toHaveURL(/\/ky-thuat\/bao-tri$/);
      else await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(results).not.toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (role === "QUAN_TRI_VIEN") {
        await page.goto("/quan-tri/bao-tri");
        await expect(
          page
            .getByRole("navigation", { name: "Chức năng" })
            .getByRole("link", { name: "Thiết bị & bảo trì", exact: true }),
        ).toHaveAttribute("aria-current", "page");
        await expect(
          page
            .getByRole("navigation", { name: "Chức năng" })
            .locator('[aria-current="page"]'),
        ).toHaveCount(1);
      }
      if (role === "KY_THUAT_VIEN") {
        await page.goto("/");
        const catalog = page.getByRole("list", { name: "Danh sách dịch vụ" });
        await expect(
          catalog.getByRole("link", {
            name: "Công việc được giao",
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          catalog.getByRole("link", {
            name: "Hóa đơn & thanh toán",
            exact: true,
          }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("button", { name: "Hóa đơn", exact: true }),
        ).toHaveCount(0);
        await page
          .getByRole("button", { name: "Bảo trì", exact: true })
          .click();
        await expect(catalog.getByRole("link")).toHaveCount(1);
        await expect(
          catalog.getByRole("link", { name: "Bảo trì thiết bị", exact: true }),
        ).toBeVisible();
      }
    } finally {
      await context.close();
      if (id)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    }
  });
}
```

### `e2e/interface.spec.js`

```javascript
import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, rows } from "../backend/src/lib/db.js";
import { login } from "../backend/src/modules/auth/auth.service.js";

for (const width of [1440, 768, 320]) {
  test(`interface: keyboard access, password visibility, navigation and logout at ${width}px`, async ({
    browser,
  }) => {
    expect(process.env.DB_NAME).toBe("chung_cu_test");
    const suffix = randomBytes(4).toString("hex");
    const password = randomBytes(16).toString("hex");
    const phone =
      "09" + String(randomBytes(4).readUInt32BE() % 100000000).padStart(8, "0");
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let id;
    const fit = async () =>
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    try {
      id = (
        await rows(
          pool,
          "INSERT INTO nguoi_dung (ho_va_ten,so_dien_thoai,mat_khau_ma_hoa,vai_tro) VALUES (?,?,?,'QUAN_TRI_VIEN')",
          [`Giao diện ${suffix}`, phone, await bcrypt.hash(password, 10)],
        )
      ).insertId;
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: /Bạn cần hỗ trợ/ }),
      ).toBeVisible();
      await fit();
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("link", { name: "Đến nội dung chính" }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("main")).toBeFocused();
      await page.goto("/dang-nhap");
      await page.getByLabel("Số điện thoại hoặc tài khoản căn hộ").fill(phone);
      const input = page.getByLabel("Mật khẩu", { exact: true });
      await input.fill(password);
      let loginRequests = 0;
      page.on("request", (request) => {
        if (new URL(request.url()).pathname === "/api/xac_thuc/dang_nhap")
          loginRequests++;
      });
      await page
        .getByRole("button", { name: "Hiện mật khẩu", exact: true })
        .click();
      await expect(input).toHaveAttribute("type", "text");
      await expect(input).toHaveValue(password);
      await page
        .getByRole("button", { name: "Ẩn mật khẩu", exact: true })
        .click();
      await expect(input).toHaveAttribute("type", "password");
      expect(loginRequests).toBe(0);
      await fit();
      // Kiểm tra UI bằng phiên thật, không cộng vào hạn mức HTTP đăng nhập
      // dùng chung của các kịch bản nghiệp vụ. Các spec khác kiểm tra endpoint.
      await page.route("**/api/xac_thuc/dang_nhap", async (route) => {
        const session = await login(route.request().postDataJSON());
        await context.addCookies([
          {
            name: "session",
            value: session.token,
            url: "http://127.0.0.1:5174",
            httpOnly: true,
            sameSite: "Strict",
          },
        ]);
        await route.fulfill({ json: { data: session.user } });
      });
      await page
        .getByRole("button", { name: "Đăng nhập", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Tổng quan vận hành", exact: true }),
      ).toBeVisible();
      const nav = page.getByRole("navigation", { name: "Chức năng" });
      await expect(nav.getByRole("link")).toHaveCount(20);
      await expect(
        nav.getByRole("link", { name: "Tổng quan", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      if (width <= 900) {
        const toggle = page.getByRole("button", {
          name: "Tất cả chức năng",
          exact: true,
        });
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
        await toggle.focus();
        await page.keyboard.press("Enter");
        await expect(
          page.getByRole("button", { name: "Thu gọn menu", exact: true }),
        ).toHaveAttribute("aria-expanded", "true");
        await nav.getByRole("link", { name: "Phản ánh", exact: true }).focus();
        await page.keyboard.press("Escape");
        await expect(toggle).toBeFocused();
        await toggle.click();
      }
      await nav
        .getByRole("link", { name: "Nhập / xuất Excel, PDF", exact: true })
        .click();
      await expect(page).toHaveURL(/\/quan-tri\/nhap-xuat$/);
      await expect(
        nav.getByRole("link", { name: "Nhập / xuất Excel, PDF", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      if (width <= 900)
        await expect(
          page.getByRole("button", { name: "Tất cả chức năng", exact: true }),
        ).toHaveAttribute("aria-expanded", "false");
      await fit();
      const profile = page.locator(".profile-menu > summary");
      await profile.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("button", { name: "Đăng xuất", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(profile).toBeFocused();
      await expect(
        page.getByRole("button", { name: "Đăng xuất", exact: true }),
      ).not.toBeVisible();
      await profile.click();
      await page.getByRole("main").click({ position: { x: 5, y: 5 } });
      await expect(
        page.getByRole("button", { name: "Đăng xuất", exact: true }),
      ).not.toBeVisible();
      await profile.click();
      await page
        .getByRole("button", { name: "Đăng xuất", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Đăng nhập", exact: true }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    } finally {
      await context.close();
      if (id)
        await rows(pool, "DELETE FROM nguoi_dung WHERE ma_nguoi_dung=?", [id]);
    }
  });
}
```

## 6. Tự thử sau khi cập nhật

1. Mở cổng cư dân, tìm `hoa don`, lọc danh mục Tài khoản để thấy trạng thái không có kết quả, rồi bấm Xem tất cả dịch vụ.
2. Khi chưa đăng nhập, chọn Hóa đơn & thanh toán, đăng nhập bằng tài khoản căn hộ: mở danh sách hóa đơn của cư dân. Tài khoản Ban quản lý mở danh sách hóa đơn quản trị.
3. Trong không gian làm việc, gõ `dien nuoc` hoặc `hoadon` tại Tìm chức năng, dùng ↓ rồi Enter để mở. Escape đóng danh sách; nhấp ra ngoài cũng đóng.
4. Mở tổng quan, thử ẩn/hiện từng nhóm biểu đồ và chọn kiểu biểu đồ; lựa chọn đã lưu vẫn được giữ.
5. Trên điện thoại, mở Tất cả chức năng, chọn phân hệ và kiểm tra bảng có thể cuộn ngang bên trong khung. Trang chính không cần cuộn ngang.
6. Thử gửi phản ánh bằng QR kèm ảnh, thanh toán bằng QR, xuất Excel và đặt tiện ích bằng dữ liệu thử của bạn. Các luồng nghiệp vụ hiện có được giữ.

## 7. Kiểm chứng trong workspace

- `npm run build`: đạt. Vite vẫn thông báo chunk lớn và bỏ qua chỉ thị `use client` của React Router; build tạo đủ tệp sản phẩm.
- `node scripts/check-local.js --api http://127.0.0.1:3104`: 0 lỗi; health/ready trả HTTP 200 trong phiên kiểm tra.
- `node --test scripts/service-navigation.test.js`: 5/5 đạt (tìm tiếng Việt, bộ lọc, chuyển trang theo vai trò và nhận diện menu).
- `npm test`: 215/215 kiểm thử backend đạt, dùng MySQL thật trong database kiểm thử riêng.
- `npm run test:e2e`: 59/59 kiểm thử Chromium đạt, bao gồm luồng nghiệp vụ cũ và chức năng tìm kiếm mới.
- Sau tinh chỉnh từ khóa gợi ý trên cổng của kỹ thuật viên, chạy lại 5/5 E2E tìm dịch vụ/đăng nhập/tìm chức năng và build: đều đạt.
- 84 lượt mở trang theo ba vai trò ở 1440/768/320 px không tràn ngang toàn trang, không có lỗi JavaScript hoặc cảnh báo API. Bổ sung kiểm tra cổng dịch vụ/đăng nhập và ảnh ở 375 px, bàn phím và giảm chuyển động.
- Đã đối chiếu nội dung tất cả 9 file ứng dụng và 3 file kiểm thử trong tài liệu này với mã nguồn; các khối code là nội dung đầy đủ.

Kiểm thử trong Chromium/Linux và database giả lập của workspace. Việc dùng camera/quét QR trên điện thoại thật cần thử với HTTPS và quyền camera trên máy của bạn.
