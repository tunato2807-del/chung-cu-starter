# Giao diện mới cho bản đầy đủ nghiệp vụ — 5 file để copy

Bản này được làm trên `codex/appfolio-business-ui`, xuất phát từ bản có đăng nhập, QR, căn hộ, hóa đơn và các phân hệ đang dùng (`codex/auth-qr-incidents` tại 2f00acd). Đây là bản thiết kế mới, khác với bộ main xem trước và bộ khôi phục trang trắng trước đó.

## Xem giao diện trước khi copy

- [Trang chủ mới](giao-dien-van-hanh-moi/cong-cu-dan-1440.png)
- [Đăng nhập mới](giao-dien-van-hanh-moi/dang-nhap-1440.png)
- [Tổng quan quản trị mới](giao-dien-van-hanh-moi/tong-quan-1440.png)
- [Bảng và biểu mẫu căn hộ](giao-dien-van-hanh-moi/can-ho-1440.png)
- [Điện thoại](giao-dien-van-hanh-moi/cong-cu-dan-320.png)

Ảnh bảng/tổng quan được chụp trong kiểm tra UI với fixture API, không phải dữ liệu database trên máy bạn. Ảnh tòa nhà là các ảnh cục bộ dự án đã có, giữ nguyên giấy phép/ghi nguồn trong frontend/public/images/residences/README.md.

## Cập nhật trong VS Code

Tạo hoặc thay lần lượt đủ năm file theo đúng thứ tự bên dưới. Giữ bản sao chỉnh sửa riêng nếu có trước khi thay. Giữ global.css và professional.css của bản đầy đủ nghiệp vụ. Không chép navigation.js từ bộ khung main vào dự án đang chạy.

| Thứ tự | File | Thao tác |
|---|---|---|
| 1 | frontend/src/styles/residence.css | Tạo mới |
| 2 | frontend/src/main.jsx | Thay nội dung |
| 3 | frontend/src/features/incidents/Portal.jsx | Tạo mới |
| 4 | frontend/src/app/App.jsx | Thay nội dung |
| 5 | frontend/src/app/Layout.jsx | Thay nội dung |

**Cần tạo đủ hai file mới và cập nhật cả ba file cũ.** App.jsx bên dưới là bản có BrowserRouter/AuthProvider, không phải App của bộ main xem trước. Những route và API nghiệp vụ vẫn dùng bản hiện có; chỉ đổi component cổng cư dân, bố cục và stylesheet.

main.jsx cần nạp CSS theo thứ tự:

```jsx
import "./styles/global.css";
import "./styles/professional.css";
import "./styles/residence.css";
```

Thiếu dòng cuối thì giao diện mới sẽ không được áp dụng. Bộ này không thêm dependency, migration hoặc file ảnh mới. Không cần chạy seed/migration để đổi giao diện.

Sau khi lưu năm file, chạy ở thư mục gốc:

```powershell
npm run build
```

Khởi động lại Vite bằng lệnh bạn đang sử dụng. Nếu chạy HTTP để xem trên mạng LAN:

```powershell
npm exec -w frontend -- vite --host 0.0.0.0 --port 5173 --strictPort
```

Nếu đang dùng HTTPS cho camera, giữ lệnh HTTPS và chứng chỉ đã cấu hình. Chỉ mở một tiến trình Vite ở cổng 5173. Tải lại trình duyệt bằng Ctrl+Shift+R.

Khi cập nhật đúng, trang chủ có tiêu đề **Chung cư của bạn, trong tầm tay.**, nút xanh dương và khối dịch vụ mới; trang đăng nhập có mảng navy; khu quản trị có sidebar navy. Nếu màn hình còn như cũ, kiểm tra đã lưu đúng thư mục dự án và main.jsx có import residence.css ở cuối.

AppFolio do người dùng gợi ý hiện chặn truy cập từ môi trường thực hiện (403/lỗi proxy), nên chưa đối chiếu được trang trực tiếp. Bản này là thiết kế độc lập cho dự án, không sao chép thương hiệu hoặc nội dung AppFolio. Xem [quyết định thiết kế](giao-dien-van-hanh-moi/design-contract.md) và [kết quả kiểm tra](giao-dien-van-hanh-moi/verification.md).

## 1. frontend/src/styles/residence.css

Tạo file mới, lưu UTF-8.

```css
/* Hệ giao diện cho bản nghiệp vụ có router và phân quyền thật. Nạp sau professional.css. */
:root {
  --ink: #172b4d;
  --muted: #526580;
  --brand: #1565d8;
  --brand-deep: #104ea9;
  --brand-soft: #edf4ff;
  --line: #dbe3ee;
  --canvas: #f4f7fc;
  --accent: #1565d8;
  --accent-deep: #104ea9;
  --surface: #fff;
  --navy: #102a43;
  --control-line: #8091a8;
  --shadow: 0 4px 16px #102a4306;
  font-family:
    "Segoe UI",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-size: 15px;
  color: var(--ink);
  background: var(--canvas);
  line-height: 1.65;
}
body {
  min-width: 320px;
}
::selection {
  background: #d2e5ff;
  color: var(--navy);
}
a {
  color: var(--brand-deep);
}
button,
.button {
  min-height: 44px;
  padding: 10px 18px;
  border-color: var(--control-line);
  border-radius: 8px;
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
}
button:hover:not(:disabled),
.button:hover {
  background: var(--brand-soft);
  border-color: var(--brand);
  color: var(--brand-deep);
}
.primary,
.button.primary,
.payment-download {
  background: var(--brand);
  color: #fff;
  border-color: var(--brand);
}
.primary:hover:not(:disabled),
.button.primary:hover,
.payment-download:hover {
  background: var(--brand-deep);
  color: #fff;
  border-color: var(--brand-deep);
}
:focus-visible {
  outline: 3px solid #b35300;
  outline-offset: 3px;
}
input,
select,
textarea {
  border-color: var(--control-line);
  border-radius: 8px;
  color: var(--ink);
  font-size: 14px;
  min-height: 44px;
}
input::placeholder,
textarea::placeholder {
  color: #61718a;
}
input:focus,
select:focus,
textarea:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px #1565d814;
}
input[type="checkbox"],
input[type="radio"] {
  accent-color: var(--brand);
}
.field > label {
  color: #31465f;
  font-size: 13px;
}
h1,
h2,
h3 {
  color: var(--ink);
}
h1 {
  font-size: clamp(26px, 2.5vw, 34px);
  letter-spacing: -0.04em;
}
.muted,
.note,
.overview-note {
  color: var(--muted);
}
.card {
  border-color: var(--line);
  border-radius: 12px;
  box-shadow: var(--shadow);
}
.card > h2,
.page-heading h1 {
  color: var(--ink);
}
.error {
  color: #9c3028;
  background: #fff2ef;
  border-color: #e7b0a7;
  border-radius: 8px;
}
.success {
  color: #176044;
  background: #edf8f1;
  border-color: #a8d2b6;
}

/* Điều hướng công khai và bố cục không gian làm việc. */
.topbar {
  height: 84px;
  padding: 0 max(32px, calc((100% - 1280px) / 2));
  background: #fff;
  border-bottom: 1px solid var(--line);
  box-shadow: none;
  gap: 32px;
}
.brand {
  color: var(--navy);
  gap: 12px;
  font-size: 18px;
  letter-spacing: 0.04em;
}
.brand-icon {
  width: 44px;
  height: 44px;
  background: var(--brand);
  color: white;
  border: 0;
  border-radius: 10px;
}
.brand small {
  color: var(--muted);
  font-size: 9px;
  letter-spacing: 0.16em;
}
.public-nav {
  gap: 28px;
  margin-left: 32px;
}
.public-nav a {
  color: var(--ink);
  font-size: 14px;
}
.top-links {
  gap: 24px;
}
.lookup-link {
  color: var(--muted);
}
.top-links > .button {
  padding: 12px 20px;
}
.profile-name {
  color: var(--ink);
}
.profile-name small {
  color: var(--muted);
}
.avatar {
  background: #e5efff;
  color: var(--brand-deep);
  border-radius: 10px;
}
.profile-dropdown {
  border-color: var(--line);
  border-radius: 10px;
}
.profile-dropdown a:hover,
.profile-dropdown button:hover {
  background: var(--brand-soft);
}
.is-public {
  background: #fff;
}
.is-public .public-space {
  max-width: 1344px;
  padding: 0 32px 40px;
  margin: 0 auto;
}
.is-public .public-space > main {
  padding-top: 0;
}
.is-public .public-space > main > .card:first-child,
.is-public .public-space > main > .narrow:first-child {
  margin-top: 40px;
}

/* Cổng cư dân: ảnh và hành động chính ở trên, tìm kiếm và danh mục ở dưới. */
.resident-portal {
  min-width: 0;
}
.resident-hero {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  align-items: center;
  gap: 64px;
  padding: 64px 0 56px;
}
.resident-hero-copy {
  min-width: 0;
}
.resident-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 24px;
  color: var(--brand-deep);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.resident-eyebrow > span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand);
}
.resident-hero h1 {
  font-size: clamp(38px, 4.3vw, 62px);
  line-height: 1.13;
  letter-spacing: -0.05em;
  font-weight: 700;
  color: var(--navy);
  margin: 0 0 24px;
}
.resident-hero h1 > span {
  color: var(--brand);
}
.resident-intro {
  max-width: 500px;
  margin: 0 0 28px;
  font-size: 16px;
  line-height: 1.85;
  color: var(--muted);
}
.resident-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.resident-hero-actions .button {
  min-height: 52px;
  padding: 14px 22px;
  font-size: 14px;
}
.resident-secondary {
  background: white;
}
.resident-hero-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 24px;
  font-size: 12px;
  color: var(--muted);
}
.resident-hero-note > .icon {
  margin-top: 2px;
  color: var(--brand);
}
.resident-hero-visual {
  position: relative;
  min-width: 0;
  padding: 0 0 88px 24px;
}
.resident-hero-visual::before {
  content: "";
  position: absolute;
  top: 40px;
  right: -16px;
  bottom: 16px;
  left: 64px;
  border-radius: 24px;
  background: #eaf2ff;
  z-index: 0;
}
.resident-hero-visual .photo-carousel {
  position: relative;
  border-radius: 20px;
  border-color: var(--line);
  box-shadow: none;
}
.resident-hero-visual .photo-carousel-viewport {
  aspect-ratio: 1.3;
}
.resident-hero-visual .photo-carousel-toolbar {
  min-height: 56px;
  padding: 6px 12px;
}
.photo-carousel-toolbar button {
  color: var(--brand-deep);
  min-height: 44px;
}
.photo-carousel-arrows button {
  width: 44px;
}
.photo-carousel-dots button {
  width: 32px;
}
.photo-carousel-dots [aria-current="true"] span {
  background: var(--brand);
}
.photo-carousel-label {
  color: var(--navy);
  border-radius: 6px;
}
.photo-carousel-label .live-dot {
  background: var(--brand);
}
.photo-carousel-caption p {
  color: white;
}
.photo-carousel-caption > span {
  color: #fff;
}
.photo-carousel-viewport::after {
  background: linear-gradient(180deg, transparent 35%, #102a43d9 100%);
}
.resident-photo-link {
  position: absolute;
  z-index: 2;
  bottom: 0;
  left: 0;
  right: 36px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: white;
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: 0 12px 28px #102a4312;
  color: var(--ink);
  text-decoration: none;
}
.resident-photo-link:hover {
  border-color: var(--brand);
}
.resident-photo-link > .icon:last-child {
  margin-left: auto;
  color: var(--brand);
}
.resident-photo-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  background: var(--brand-soft);
  color: var(--brand);
  border-radius: 10px;
}
.resident-photo-link strong {
  display: block;
  font-size: 14px;
}
.resident-photo-link small {
  display: block;
  color: var(--muted);
  font-size: 12px;
  margin-top: 2px;
}
.resident-service-strip {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr;
  gap: 24px;
  align-items: center;
  padding: 28px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.resident-service-strip > p {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.75;
  margin: 0;
}
.resident-service-strip strong {
  color: var(--ink);
  font-size: 14px;
}
.resident-service-strip > span {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}
.resident-service-strip .icon {
  color: var(--brand);
}
.resident-catalog {
  padding-top: 64px;
  scroll-margin-top: 100px;
}
.resident-section-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 28px;
}
.resident-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--brand-deep);
  margin: 0 0 12px;
}
.resident-section-heading h2,
.resident-support h2 {
  font-size: clamp(26px, 2.8vw, 36px);
  letter-spacing: -0.035em;
  line-height: 1.25;
  margin: 0 0 12px;
  color: var(--navy);
}
.resident-section-heading p:last-child {
  font-size: 14px;
  color: var(--muted);
  margin: 0;
}
.resident-catalog-count {
  flex-shrink: 0;
  color: var(--muted);
  font-size: 12px;
  max-width: 35%;
  overflow-wrap: anywhere;
}
.resident-search {
  margin-bottom: 20px;
}
.resident-search > label {
  display: block;
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 8px;
}
.resident-search > div {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 6px 6px 20px;
  border: 1px solid var(--control-line);
  background: #fff;
  border-radius: 10px;
}
.resident-search > div:focus-within {
  outline: 3px solid #1565d824;
  outline-offset: 2px;
  border-color: var(--brand);
}
.resident-search .icon {
  color: var(--brand);
}
.resident-search input {
  min-width: 0;
  border: 0;
  box-shadow: none;
  padding: 10px 0;
  font-size: 15px;
  background: transparent;
}
.resident-search input:focus {
  box-shadow: none;
  outline: none;
}
.resident-search button {
  flex-shrink: 0;
  min-height: 48px;
  padding: 12px 24px;
}
.resident-search button .icon {
  color: white;
}
.resident-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 28px;
}
.resident-categories button {
  min-height: 44px;
  padding: 10px 16px;
  border-color: var(--line);
  border-radius: 8px;
  background: #f5f7fb;
  color: var(--muted);
  font-size: 12px;
}
.resident-categories button[aria-pressed="true"] {
  background: var(--navy);
  border-color: var(--navy);
  color: white;
}
.resident-services {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.resident-services > li {
  min-width: 0;
}
.resident-service {
  display: flex;
  flex-direction: column;
  min-height: 244px;
  height: 100%;
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: white;
  color: var(--ink);
  text-decoration: none;
  transition:
    border-color 0.18s,
    box-shadow 0.18s;
}
.resident-service:hover {
  border-color: var(--brand);
  box-shadow: 0 8px 24px #102a430c;
}
.resident-service-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 10px;
  color: var(--muted);
}
.resident-service-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: var(--brand-soft);
  color: var(--brand);
  flex-shrink: 0;
}
.resident-service h3 {
  font-size: 18px;
  margin: 20px 0 8px;
  letter-spacing: -0.02em;
}
.resident-service > p {
  margin: 0 0 24px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.8;
}
.resident-service-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border-top: 1px solid var(--line);
  padding-top: 16px;
  margin-top: auto;
  color: var(--brand-deep);
  font-size: 11px;
  font-weight: 600;
}
.resident-service-featured {
  background: var(--navy);
  border-color: var(--navy);
}
.resident-service-featured:hover {
  border-color: #467bb6;
}
.resident-service-featured h3 {
  color: white;
}
.resident-service-featured .resident-service-top,
.resident-service-featured > p {
  color: #c4d3e6;
}
.resident-service-featured .resident-service-icon {
  background: #204665;
  color: #a9d1ff;
}
.resident-service-featured .resident-service-bottom {
  border-color: #35526d;
  color: #c7e1ff;
}
.resident-support {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 64px;
  padding: 44px;
  margin-top: 64px;
  background: #edf4ff;
  border-radius: 16px;
}
.resident-support > div > p:not(.resident-kicker) {
  max-width: 360px;
  font-size: 14px;
  line-height: 1.85;
  color: var(--muted);
  margin: 0 0 24px;
}
.resident-support > ol {
  list-style: none;
  padding: 0;
  margin: 0;
}
.resident-support li {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 24px 0;
  border-bottom: 1px solid #cfdcf0;
}
.resident-support li:first-child {
  padding-top: 0;
}
.resident-support li:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}
.resident-support li > span {
  font-size: 23px;
  color: var(--brand);
  line-height: 1.25;
}
.resident-support li > div {
  flex: 1;
}
.resident-support li > .icon {
  color: var(--brand);
  margin-top: 4px;
}
.resident-support h3 {
  font-size: 15px;
  margin: 0 0 8px;
}
.resident-support li p {
  color: var(--muted);
  font-size: 13px;
  margin: 0;
}
.resident-emergency {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 24px 0 0;
  color: var(--muted);
  font-size: 11px;
}
.resident-emergency > .icon {
  margin-top: 1px;
}

/* Không gian nghiệp vụ: giữ nội dung và trạng thái của từng phân hệ. */
.is-workspace .topbar {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr) auto;
  height: 80px;
  padding: 0 28px 0 0;
  gap: 28px;
}
.is-workspace .topbar > .brand {
  display: flex;
  background: var(--navy);
  height: 80px;
  padding: 20px 24px;
  width: 100%;
  color: white;
  margin: 0;
  border-bottom: 1px solid #2b455f;
}
.is-workspace .brand small {
  color: #bbcadc;
  font-size: 8px;
}
.is-workspace .topbar > .function-search {
  width: min(440px, 100%);
  margin: 0;
}
.is-workspace .workspace {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  max-width: none;
  padding: 0;
}
.is-workspace .sidebar {
  top: 80px;
  height: calc(100dvh - 80px);
  background: var(--navy);
  border-right: 0;
  padding: 24px 16px;
  color: #d1deee;
}
.is-workspace .sidebar-heading {
  margin-bottom: 16px;
  padding: 0 12px 20px;
  border-bottom: 1px solid #304a64;
}
.is-workspace .sidebar-heading .eyebrow {
  color: #c1d3e9;
  font-size: 12px;
  letter-spacing: 0.03em;
}
.is-workspace .nav-group {
  margin-bottom: 20px;
}
.is-workspace .nav-group-label {
  color: #abc0d8;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding-left: 12px;
}
.is-workspace .sidebar nav a {
  color: #cedbed;
  min-height: 44px;
  padding: 11px 12px;
  margin-bottom: 4px;
  border-radius: 7px;
  font-size: 13px;
}
.is-workspace .sidebar nav a .icon {
  color: #b4c8e0;
}
.is-workspace .sidebar nav a:hover {
  background: #1d3c59;
  color: white;
}
.is-workspace .sidebar nav a.active {
  color: white;
  background: #244e79;
  box-shadow: inset 3px 0 #80b9ff;
  font-weight: 600;
}
.is-workspace .sidebar nav a.active .icon {
  color: #bdddff;
}
.is-workspace .sidebar .public-link {
  background: #1d3c59;
  border: 1px solid #3e5b76;
  color: #e1edff;
  border-radius: 8px;
  margin-top: 20px;
  padding: 12px;
}
.is-workspace .workspace main {
  min-width: 0;
  max-width: none;
  padding: 28px 32px 48px;
  background: var(--canvas);
}
.workspace-breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--muted);
  font-size: 11px;
  margin: 0 0 24px;
}
.workspace-breadcrumb a {
  color: var(--muted);
  text-decoration: none;
}
.workspace-breadcrumb a:hover {
  color: var(--brand);
  text-decoration: underline;
}
.workspace-breadcrumb [aria-current="page"] {
  color: var(--ink);
  font-weight: 600;
}
.function-search form {
  background: #f4f7fc;
  border-color: var(--control-line);
  border-radius: 8px;
}
.function-search form:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px #1565d814;
}
.function-results li a:hover,
.function-results li a:focus-visible {
  background: var(--brand-soft);
}
.notification-count {
  background: #245fc0;
  color: #fff;
}
.page-heading {
  gap: 20px;
  margin-bottom: 24px;
}
.page-heading .eyebrow,
.overview-page .eyebrow {
  color: var(--brand-deep);
}
.overview-stamp {
  color: var(--muted);
  font-size: 11px;
  margin-bottom: 24px;
}
.overview-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 0;
  margin-bottom: 24px;
}
.overview-metric,
.overview-metric:first-child {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 24px;
  background: white;
  box-shadow: var(--shadow);
}
.overview-metric:nth-child(n + 3) {
  border-top: 1px solid var(--line);
}
.overview-metric:hover {
  background: #fafdff;
  border-color: #8bb2e7;
}
.overview-metric .metric-label {
  color: var(--muted);
  font-size: 12px;
}
.overview-metric .metric-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--brand-soft);
  color: var(--brand);
}
.overview-metric > strong {
  color: var(--ink);
  font-size: clamp(23px, 2.2vw, 32px);
  letter-spacing: -0.04em;
}
.overview-metric > small {
  color: var(--muted);
  font-size: 11px;
}
.overview-alert > strong {
  color: #a33627;
}
.overview-alert .metric-icon {
  background: #fff0eb;
  color: #a33627;
}
.overview-panel-heading {
  border-color: var(--line);
}
.overview-panel-heading p,
.overview-queue small,
.overview-note {
  color: var(--muted);
}
.overview-mini {
  background: #f1f5fc;
  border-radius: 8px;
  color: var(--brand-deep);
}
.overview-mini:hover {
  background: #e6efff;
}
.overview-mini > strong {
  color: var(--brand-deep);
}
.overview-mini > span {
  color: var(--muted);
}
.overview-empty {
  background: #f4f7fc;
  color: var(--muted);
  border-radius: 8px;
}
.overview-pill {
  background: var(--brand-soft);
  color: var(--brand-deep);
}
.overview-queue > li {
  border-color: var(--line);
}
.overview-debt {
  background: #fff3ed;
}
.overview-grid {
  gap: 24px;
}
.trends-controls,
.trends-card,
.chart-toolbar {
  border-color: var(--line);
  border-radius: 10px;
}
.table-scroll,
.table-wrap,
.table-container {
  border-color: var(--line);
  border-radius: 10px;
}
table {
  border-color: var(--line);
}
th {
  background: #f1f5fb;
  color: #455c78;
  font-size: 11px;
  font-weight: 600;
  padding: 16px;
  border-color: var(--line);
}
td {
  padding: 16px;
  color: #263c58;
  border-color: #e7edf5;
  font-size: 13px;
}
tr:hover td {
  background: #f8fbff;
}
.pagination button,
.data-tools button {
  border-radius: 7px;
}
.filters,
.report-filters {
  border-color: var(--line);
  background: #f8faff;
}
.maintenance-actions,
.treasury-actions {
  border-color: var(--line);
}
.amenity-card,
.fund-card {
  border-radius: 12px;
  border-color: var(--line);
}
.bank-picker,
.payment-header {
  background: var(--brand-soft);
  border-color: var(--line);
}
.payment-header h2,
.payment-amount,
.bill-total {
  color: var(--navy);
}
.payment-card {
  border-radius: 14px;
}
.payment-qr-frame {
  border-color: var(--line);
  border-radius: 10px;
  box-shadow: none;
}

/* Đăng nhập dùng cùng hình ảnh và hệ màu với cổng cư dân. */
.is-public .auth-layout {
  grid-template-columns: 1fr 1fr;
  max-width: 1080px;
  gap: 0;
  background: white;
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
  margin: 48px auto;
}
.is-public .auth-story {
  background: var(--navy);
  color: white;
  padding: 40px;
  border-radius: 0;
}
.is-public .auth-story > h2 {
  color: white;
  font-size: 32px;
  letter-spacing: -0.035em;
}
.is-public .auth-story > p {
  color: #c6d6e9;
  font-size: 13px;
}
.is-public .auth-story-label,
.is-public .auth-trust {
  color: #c6d6e9;
}
.is-public .auth-story .photo-carousel {
  border-radius: 12px;
  border-color: #496781;
}
.is-public .auth-form {
  padding: 44px;
  background: white;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.is-public .auth-form h1 {
  color: var(--navy);
}
.is-public .auth-form .eyebrow {
  color: var(--brand-deep);
}
.login-help p {
  background: #f4f7fc;
  border-color: var(--brand);
}
footer {
  background: var(--navy);
  border: 0;
  color: #d3dfee;
  padding: 32px max(32px, calc((100% - 1280px) / 2));
  gap: 24px;
}
.footer-brand {
  color: white;
  font-size: 15px;
  letter-spacing: 0.07em;
  display: block;
}
.footer-description {
  color: #b4c6dd;
  font-size: 12px;
  display: block;
  margin-top: 8px;
}
.footer-links {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}
.footer-links a {
  color: #e2edfc;
  text-decoration: none;
  font-size: 12px;
}
.footer-links a:hover {
  color: white;
  text-decoration: underline;
}

@media (max-width: 1200px) {
  .resident-hero {
    gap: 32px;
  }
  .resident-hero h1 {
    font-size: 48px;
  }
  .resident-service-strip {
    gap: 16px;
  }
  .resident-service-strip > span {
    font-size: 12px;
    gap: 8px;
  }
  .resident-service {
    padding: 24px;
  }
  .overview-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 1024px) {
  .resident-hero {
    gap: 24px;
    padding: 40px 0;
  }
  .resident-hero h1 {
    font-size: 42px;
  }
  .resident-intro {
    font-size: 14px;
  }
  .resident-hero-visual {
    padding-left: 12px;
  }
  .resident-photo-link {
    padding: 12px;
    right: 12px;
  }
  .resident-photo-link small {
    font-size: 11px;
  }
  .resident-service-strip {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .resident-catalog {
    padding-top: 44px;
  }
  .resident-services {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .resident-support {
    gap: 32px;
    padding: 32px;
  }
  .public-nav {
    margin-left: 0;
    gap: 16px;
  }
  .is-workspace .topbar {
    grid-template-columns: 224px minmax(0, 1fr) auto;
    gap: 20px;
    padding-right: 20px;
  }
  .is-workspace .workspace {
    grid-template-columns: 224px minmax(0, 1fr);
  }
  .is-workspace .topbar > .brand {
    padding: 20px 16px;
  }
  .is-workspace .workspace main {
    padding: 24px;
  }
  .is-public .auth-story {
    padding: 28px;
  }
  .is-public .auth-form {
    padding: 32px;
  }
}
@media (max-width: 900px) {
  .topbar {
    height: auto;
    min-height: 76px;
    padding: 16px 24px;
    gap: 16px;
  }
  .is-workspace .topbar {
    display: flex;
    padding: 16px 24px;
    height: auto;
    gap: 16px;
  }
  .is-workspace .topbar > .brand {
    background: transparent;
    padding: 0;
    height: auto;
    width: auto;
    color: var(--navy);
    border: 0;
  }
  .is-workspace .brand small {
    color: var(--muted);
  }
  .is-workspace .topbar > .function-search {
    width: 100%;
    max-width: none;
  }
  .is-workspace .workspace {
    display: block;
  }
  .is-workspace .sidebar {
    top: auto;
    height: auto;
    padding: 16px 24px;
  }
  .is-workspace .sidebar-heading {
    padding: 0;
    margin: 0 0 12px;
    border: 0;
  }
  .is-workspace .sidebar-heading .eyebrow {
    color: #d4e2f6;
    font-size: 11px;
  }
  .is-workspace .mobile-menu-toggle {
    color: #e6f0ff;
    background: #244967;
    border: 1px solid #6180a0;
    min-height: 44px;
  }
  .is-workspace .sidebar nav a {
    margin: 0;
    font-size: 12px;
  }
  .is-workspace .sidebar nav a.active {
    box-shadow: inset 0 -3px #80b9ff;
  }
  .is-workspace .nav-group {
    margin: 0;
  }
  .is-workspace .sidebar.is-expanded nav {
    gap: 8px;
  }
  .is-public .public-space {
    padding: 0 24px 32px;
  }
  .resident-hero h1 {
    font-size: 38px;
  }
  .resident-hero-actions .button {
    padding: 12px 16px;
    font-size: 13px;
  }
  .resident-hero-visual .photo-carousel-viewport {
    aspect-ratio: 1.05;
  }
  .resident-photo-link {
    bottom: 0;
  }
  .resident-service-top {
    font-size: 10px;
  }
  .resident-support h2 {
    font-size: 28px;
  }
  .resident-support {
    gap: 28px;
  }
  .resident-support li {
    gap: 12px;
  }
}
@media (max-width: 650px) {
  .topbar,
  .is-workspace .topbar {
    padding: 16px;
    gap: 12px;
  }
  .brand {
    font-size: 15px;
    gap: 8px;
  }
  .brand-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }
  .brand small {
    font-size: 7px;
    letter-spacing: 0.09em;
  }
  .top-links {
    gap: 10px;
  }
  .top-links > .button {
    min-height: 44px;
    padding: 10px 12px;
    font-size: 12px;
  }
  .top-links > .button > .icon {
    display: none;
  }
  .is-public .public-space {
    padding: 0 20px 32px;
  }
  .resident-hero {
    grid-template-columns: 1fr;
    gap: 28px;
    padding: 36px 0 28px;
  }
  .resident-eyebrow {
    margin-bottom: 16px;
    font-size: 10px;
  }
  .resident-hero h1 {
    font-size: clamp(35px, 8vw, 46px);
    margin-bottom: 20px;
  }
  .resident-intro {
    font-size: 14px;
    margin-bottom: 24px;
  }
  .resident-hero-actions {
    gap: 8px;
  }
  .resident-hero-actions .button {
    min-height: 48px;
    font-size: 12px;
    padding: 12px 14px;
  }
  .resident-hero-note {
    margin-top: 20px;
    font-size: 11px;
  }
  .resident-hero-visual {
    padding: 0 0 80px;
  }
  .resident-hero-visual::before {
    right: -8px;
    left: 24px;
    bottom: 12px;
    border-radius: 16px;
  }
  .resident-hero-visual .photo-carousel {
    border-radius: 16px;
  }
  .resident-hero-visual .photo-carousel-viewport {
    aspect-ratio: 1.12;
  }
  .resident-hero-visual .photo-carousel-caption {
    left: 16px;
    right: 16px;
    bottom: 20px;
  }
  .resident-hero-visual .photo-carousel-caption p {
    font-size: 20px;
  }
  .resident-hero-visual .photo-carousel-caption > span {
    font-size: 11px;
  }
  .resident-hero-visual .photo-carousel-label {
    font-size: 8px;
    top: 16px;
    left: 16px;
  }
  .resident-hero-visual .photo-carousel-toolbar {
    padding: 4px 6px;
    min-height: 52px;
  }
  .photo-carousel-arrows {
    gap: 0;
  }
  .photo-carousel-dots button {
    width: 24px;
  }
  .photo-carousel-arrows button {
    width: 36px;
  }
  .photo-carousel-rotation {
    padding: 0 4px;
    gap: 4px;
    font-size: 9px;
  }
  .resident-photo-link {
    bottom: 0;
    left: 12px;
    right: 12px;
    padding: 12px;
    gap: 8px;
  }
  .resident-photo-icon {
    width: 36px;
    height: 36px;
  }
  .resident-photo-link strong {
    font-size: 12px;
  }
  .resident-photo-link small {
    font-size: 10px;
  }
  .resident-service-strip {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 24px 0;
  }
  .resident-service-strip > p br {
    display: none;
  }
  .resident-service-strip > p {
    margin-bottom: 4px;
  }
  .resident-service-strip > span {
    font-size: 13px;
  }
  .resident-catalog {
    padding-top: 36px;
  }
  .resident-section-heading {
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 24px;
  }
  .resident-section-heading h2 {
    font-size: 28px;
  }
  .resident-section-heading p:last-child {
    font-size: 13px;
  }
  .resident-catalog-count {
    max-width: 100%;
    font-size: 11px;
  }
  .resident-search > div {
    padding: 6px 8px 8px;
    gap: 8px;
    flex-wrap: wrap;
  }
  .resident-search input {
    width: calc(100% - 32px);
    flex: 1;
    font-size: 13px;
    padding: 10px 0;
  }
  .resident-search button {
    width: 100%;
    min-height: 44px;
  }
  .resident-categories {
    gap: 6px;
    margin-bottom: 20px;
  }
  .resident-categories button {
    font-size: 11px;
    padding: 8px 12px;
  }
  .resident-services {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .resident-service {
    min-height: 0;
    padding: 24px;
  }
  .resident-service h3 {
    margin-top: 16px;
    font-size: 18px;
  }
  .resident-service > p {
    margin-bottom: 20px;
  }
  .resident-service-top {
    justify-content: flex-start;
    font-size: 10px;
  }
  .resident-service-bottom {
    padding-top: 12px;
  }
  .resident-support {
    grid-template-columns: 1fr;
    gap: 28px;
    margin-top: 36px;
    padding: 24px;
    border-radius: 12px;
  }
  .resident-support h2 {
    font-size: 28px;
  }
  .resident-support > div > p:not(.resident-kicker) {
    font-size: 13px;
  }
  .resident-support li > .icon {
    display: none;
  }
  .resident-support h3 {
    font-size: 14px;
  }
  .resident-support li p {
    font-size: 12px;
  }
  .resident-emergency {
    font-size: 10px;
  }
  .is-workspace .sidebar {
    padding: 12px 16px;
  }
  .is-workspace .workspace main {
    padding: 24px 16px 32px;
  }
  .is-workspace .sidebar.is-expanded nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .is-workspace .sidebar.is-expanded nav a {
    font-size: 11px;
    padding: 10px 8px;
  }
  .workspace-breadcrumb {
    margin-bottom: 20px;
    font-size: 10px;
  }
  .overview-metrics {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .overview-metric {
    padding: 20px;
  }
  .overview-grid {
    gap: 16px;
  }
  .overview-panel {
    padding: 20px;
  }
  .is-public .auth-layout {
    grid-template-columns: 1fr;
    margin: 24px auto;
    border-radius: 12px;
  }
  .is-public .auth-story {
    padding: 0;
  }
  .is-public .auth-story .photo-carousel {
    border: 0;
    border-radius: 0;
    margin: 0;
  }
  .is-public .auth-form {
    padding: 28px 20px;
  }
  .is-public .auth-story .photo-carousel-viewport {
    aspect-ratio: 1.8;
  }
  footer {
    padding: 28px 20px;
  }
  .footer-links {
    gap: 16px;
  }
  .footer-links a {
    font-size: 11px;
  }
}
@media print {
  .workspace-breadcrumb,
  .footer-links {
    display: none;
  }
  .is-workspace .workspace {
    display: block;
  }
  .is-workspace .workspace main {
    background: white;
    padding: 0;
  }
  .resident-photo-link {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition: none !important;
    animation: none !important;
    scroll-behavior: auto !important;
  }
}
```

## 2. frontend/src/main.jsx

Thay nội dung, lưu UTF-8.

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.jsx";
import "./styles/global.css";
import "./styles/professional.css";
import "./styles/residence.css";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

## 3. frontend/src/features/incidents/Portal.jsx

Tạo file mới, lưu UTF-8.

```jsx
import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/Auth.jsx";
import Icon from "../../shared/Icon.jsx";
import PhotoCarousel from "../../shared/PhotoCarousel.jsx";
import {
  filterServices,
  portalServices,
  serviceCategories,
} from "./portal-services.js";

export default function Portal() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const catalog = useRef(null);
  const services = portalServices(user);
  const results = filterServices(services, query, category);
  const categories = serviceCategories.filter(
    ([id]) =>
      id === "all" || services.some((service) => service.category === id),
  );

  function showCatalog(event) {
    event.preventDefault();
    catalog.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }

  return (
    <div className="resident-portal">
      <section className="resident-hero" aria-labelledby="portal-title">
        <div className="resident-hero-copy">
          <p className="resident-eyebrow">
            <span />
            Cổng dịch vụ cư dân
          </p>
          <h1 id="portal-title">
            Chung cư của bạn,
            <br />
            <span>trong tầm tay.</span>
          </h1>
          <p className="resident-intro">
            Gửi phản ánh, theo dõi hóa đơn và đặt lịch tiện ích. Kết nối với Ban
            quản lý để mọi việc trong căn hộ trở nên thuận tiện hơn.
          </p>
          <div className="resident-hero-actions">
            <a className="button primary" href="#dich-vu" onClick={showCatalog}>
              Khám phá dịch vụ
              <Icon name="arrow" size={18} />
            </a>
            <Link className="button resident-secondary" to="/quet-qr">
              <Icon name="qr" size={18} />
              Gửi phản ánh
            </Link>
          </div>
          <div className="resident-hero-note">
            <Icon name="shield" size={18} />
            <span>Phản ánh qua QR. Theo dõi bằng mã tra cứu riêng.</span>
          </div>
        </div>
        <div className="resident-hero-visual">
          <PhotoCarousel />
          <Link className="resident-photo-link" to="/tra-cuu">
            <span className="resident-photo-icon">
              <Icon name="message" size={22} />
            </span>
            <span>
              <strong>Đã gửi phản ánh?</strong>
              <small>Xem tiến độ xử lý của bạn</small>
            </span>
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>

      <div className="resident-service-strip" aria-label="Các nhóm dịch vụ">
        <p>
          Một không gian.
          <br />
          <strong>Mọi kết nối cần thiết.</strong>
        </p>
        {[
          ["message", "Phản ánh & hỗ trợ"],
          ["receipt", "Hóa đơn & thanh toán"],
          ["calendar", "Tiện ích & thông tin"],
        ].map(([icon, label]) => (
          <span key={label}>
            <Icon name={icon} size={23} />
            {label}
          </span>
        ))}
      </div>

      <section
        className="resident-catalog"
        id="dich-vu"
        ref={catalog}
        aria-labelledby="catalog-title"
      >
        <div className="resident-section-heading">
          <div>
            <p className="resident-kicker">Dịch vụ dành cho bạn</p>
            <h2 id="catalog-title">Bạn cần hỗ trợ điều gì?</h2>
            <p>
              Chọn dịch vụ để bắt đầu. Thông tin rõ ràng, thao tác thuận tiện.
            </p>
          </div>
          <span
            className="resident-catalog-count"
            role="status"
            aria-live="polite"
          >
            {results.length} dịch vụ
            {query.trim() ? ` cho “${query.trim()}”` : ""}
          </span>
        </div>
        <form
          className="resident-search"
          role="search"
          aria-label="Tìm dịch vụ cư dân"
          onSubmit={showCatalog}
        >
          <label htmlFor="service-search">Tìm dịch vụ</label>
          <div>
            <Icon name="search" size={22} />
            <input
              id="service-search"
              type="search"
              autoComplete="off"
              maxLength={80}
              placeholder="Tìm hóa đơn, đặt lịch, phản ánh…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCategory("all");
              }}
            />
            <button className="primary" type="submit">
              Tìm kiếm
              <Icon name="arrow" size={18} />
            </button>
          </div>
        </form>
        <div
          className="resident-categories"
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
          <ul className="resident-services" aria-label="Danh sách dịch vụ">
            {results.map((service) => (
              <ServiceCard key={service.id} service={service} user={user} />
            ))}
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

      <SupportProcess />
      <p className="resident-emergency">
        <Icon name="shield" size={18} />
        Trường hợp nguy hiểm tức thời, hãy liên hệ trực tiếp Ban quản lý hoặc cơ
        quan khẩn cấp.
      </p>
    </div>
  );
}

function ServiceCard({ service, user }) {
  const needsLogin = !user && !service.access;
  return (
    <li key={service.id}>
      <Link
        className={`resident-service${service.id === "feedback" ? " resident-service-featured" : ""}`}
        aria-label={service.title}
        to={needsLogin ? "/dang-nhap" : service.path}
        state={needsLogin ? { service: service.id } : undefined}
      >
        <div className="resident-service-top">
          <span className="resident-service-icon">
            <Icon name={service.icon} size={24} />
          </span>
          <span>
            {serviceCategories.find(([id]) => id === service.category)?.[1]}
          </span>
        </div>
        <h3>{service.title}</h3>
        <p>{service.description}</p>
        <div className="resident-service-bottom">
          <span>
            {service.access ||
              (needsLogin ? "Đăng nhập để sử dụng" : "Mở dịch vụ")}
          </span>
          <Icon name="arrow" size={20} />
        </div>
      </Link>
    </li>
  );
}

function SupportProcess() {
  return (
    <section className="resident-support" aria-labelledby="support-title">
      <div>
        <p className="resident-kicker">Luôn có kênh để lắng nghe</p>
        <h2 id="support-title">
          Một phản ánh.
          <br />
          Một khởi đầu tốt hơn.
        </h2>
        <p>
          Mô tả sự cố tại vị trí có mã QR. Ban quản lý tiếp nhận, phân công và
          cập nhật kết quả để bạn theo dõi.
        </p>
        <Link className="button primary" to="/tra-cuu">
          Tra cứu phản ánh
          <Icon name="arrow" size={18} />
        </Link>
      </div>
      <ol>
        {[
          [
            "Quét mã tại vị trí",
            "Mở mã QR tại khu vực hoặc thiết bị cần hỗ trợ.",
          ],
          [
            "Gửi nội dung và hình ảnh",
            "Mô tả vấn đề, đính kèm ảnh và giữ mã tra cứu.",
          ],
          [
            "Theo dõi kết quả",
            "Dùng mã tra cứu và số điện thoại để xem tiến độ.",
          ],
        ].map(([title, description], index) => (
          <li key={title}>
            <span aria-hidden="true">0{index + 1}</span>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <Icon name="shield" size={18} />
          </li>
        ))}
      </ol>
    </section>
  );
}
```

## 4. frontend/src/app/App.jsx

Thay nội dung, lưu UTF-8.

```jsx
import React from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  AuthProvider,
  Protected,
  Login,
  Account,
} from "../features/auth/Auth.jsx";
import {
  Announcements,
  AnnouncementDetail,
} from "../features/announcements/Announcements.jsx";
import FinancialReports from "../features/financial-reports/FinancialReports.jsx";
import DataExchange from "../features/data-exchange/DataExchange.jsx";
import Dashboard from "../features/dashboard/Dashboard.jsx";
import {
  EquipmentList,
  EquipmentDetail,
  MaintenanceList,
  MaintenanceDetail,
} from "../features/maintenance/Maintenance.jsx";
import {
  Amenities,
  AmenityDetail,
  Bookings,
  BookingDetail,
} from "../features/amenities/Amenities.jsx";
import {
  Funds,
  FundDetail,
  Vouchers,
  VoucherNew,
  VoucherDetail,
} from "../features/treasury/Treasury.jsx";
import Users from "../features/auth/Users.jsx";
import ApartmentAccounts from "../features/residency/ApartmentAccounts.jsx";
import BuildingMap from "../features/residency/BuildingMap.jsx";
import BuildingStructure from "../features/residency/BuildingStructure.jsx";
import {
  Scanner,
  SubmitReport,
  LookupReport,
} from "../features/incidents/PublicReports.jsx";
import Portal from "../features/incidents/Portal.jsx";
import { ReportDetail, ReportList } from "../features/incidents/Reports.jsx";
import Locations from "../features/qr/Locations.jsx";
import Vehicles from "../features/vehicles/Vehicles.jsx";
import {
  Rates,
  Meters,
  Bills,
  BillDetail,
} from "../features/billing/Billing.jsx";
import {
  Apartments,
  Residents,
  ResidentDetail,
} from "../features/residency/Residency.jsx";
import Layout from "./Layout.jsx";
const admin = ["QUAN_TRI_VIEN"],
  technician = ["KY_THUAT_VIEN"],
  resident = ["CU_DAN"];
function Shell() {
  const location = useLocation();
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/dang-nhap" element={<Login />} />
        <Route path="/quet-qr" element={<Scanner />} />
        <Route path="/r/:token" element={<SubmitReport />} />
        <Route
          path="/tra-cuu"
          element={<LookupReport initialCode={location.state?.code} />}
        />
        <Route
          path="/tai-khoan"
          element={
            <Protected>
              <Account />
            </Protected>
          }
        />
        <Route
          path="/quan-tri"
          element={
            <Protected roles={admin}>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/quan-tri/vi-tri-qr"
          element={
            <Protected roles={admin}>
              <Locations />
            </Protected>
          }
        />
        <Route
          path="/quan-tri/nhan-su"
          element={
            <Protected roles={admin}>
              <Users />
            </Protected>
          }
        />
        {[
          ["/quan-tri/can-ho", <Apartments />],
          ["/quan-tri/so-do-toa-nha", <BuildingMap />],
          ["/quan-tri/cau-truc-toa-nha", <BuildingStructure />],
          ["/quan-tri/tai-khoan-can-ho", <ApartmentAccounts />],
          ["/quan-tri/cu-dan", <Residents />],
          ["/quan-tri/cu-dan/:id", <ResidentDetail />],
          ["/quan-tri/phuong-tien", <Vehicles />],
          ["/quan-tri/quy", <Funds />],
          ["/quan-tri/quy/:id", <FundDetail />],
          ["/quan-tri/phieu-thu-chi", <Vouchers />],
          ["/quan-tri/phieu-thu-chi/moi", <VoucherNew />],
          ["/quan-tri/phieu-thu-chi/:id", <VoucherDetail />],
          ["/quan-tri/tien-ich", <Amenities />],
          ["/quan-tri/tien-ich/:id", <AmenityDetail />],
          ["/quan-tri/dat-lich", <Bookings />],
          ["/quan-tri/dat-lich/:id", <BookingDetail />],
          ["/quan-tri/thiet-bi", <EquipmentList />],
          ["/quan-tri/thiet-bi/:id", <EquipmentDetail />],
          ["/quan-tri/bao-tri", <MaintenanceList />],
          ["/quan-tri/bao-tri/:id", <MaintenanceDetail />],
          ["/quan-tri/don-gia", <Rates />],
          ["/quan-tri/chi-so", <Meters />],
          ["/quan-tri/hoa-don", <Bills />],
          ["/quan-tri/hoa-don/:id", <BillDetail />],
          ["/quan-tri/bao-cao-tai-chinh", <FinancialReports />],
          ["/quan-tri/nhap-xuat", <DataExchange />],
          ["/quan-tri/thong-bao", <Announcements />],
          ["/quan-tri/thong-bao/:id", <AnnouncementDetail />],
        ].map(([path, element]) => (
          <Route
            key={path}
            path={path}
            element={<Protected roles={admin}>{element}</Protected>}
          />
        ))}
        {[
          ["/quan-tri/phan-anh", admin],
          ["/ky-thuat/cong-viec", technician],
          ["/cu-dan/phan-anh", resident],
        ].map(([base, roles]) => (
          <React.Fragment key={base}>
            <Route
              path={base}
              element={
                <Protected roles={roles}>
                  <ReportList />
                </Protected>
              }
            />
            <Route
              path={`${base}/:id`}
              element={
                <Protected roles={roles}>
                  <ReportDetail />
                </Protected>
              }
            />
          </React.Fragment>
        ))}
        {[
          ["/cu-dan/tien-ich", <Amenities />],
          ["/cu-dan/tien-ich/:id", <AmenityDetail />],
          ["/cu-dan/dat-lich", <Bookings />],
          ["/cu-dan/dat-lich/:id", <BookingDetail />],
        ].map(([path, element]) => (
          <Route
            key={path}
            path={path}
            element={<Protected roles={resident}>{element}</Protected>}
          />
        ))}
        {["/ky-thuat/bao-tri", "/ky-thuat/bao-tri/:id"].map((path) => (
          <Route
            key={path}
            path={path}
            element={
              <Protected roles={technician}>
                {path.endsWith(":id") ? (
                  <MaintenanceDetail />
                ) : (
                  <MaintenanceList />
                )}
              </Protected>
            }
          />
        ))}
        {[
          "/cu-dan/hoa-don",
          "/cu-dan/hoa-don/:id",
          "/cu-dan/thong-bao",
          "/cu-dan/thong-bao/:id",
        ].map((path) => (
          <Route
            key={path}
            path={path}
            element={
              <Protected roles={resident}>
                {path.includes("thong-bao") ? (
                  path.endsWith(":id") ? (
                    <AnnouncementDetail />
                  ) : (
                    <Announcements />
                  )
                ) : path.endsWith(":id") ? (
                  <BillDetail />
                ) : (
                  <Bills />
                )}
              </Protected>
            }
          />
        ))}
        <Route
          path="*"
          element={
            <section className="card">
              <h1>Không tìm thấy trang</h1>
              <Link to="/">Về cổng dịch vụ</Link>
            </section>
          }
        />
      </Routes>
    </Layout>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}
```

## 5. frontend/src/app/Layout.jsx

Thay nội dung, lưu UTF-8.

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
  const activeItem = groups
    .flatMap((group) => group.items)
    .find(([path]) => isFunctionActive(pathname, path));
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
          {workspace && (
            <nav className="workspace-breadcrumb" aria-label="Vị trí hiện tại">
              <Link to={homeFor(user)}>Không gian của tôi</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{activeItem?.[1] || "Chi tiết"}</span>
            </nav>
          )}
          {children}
        </main>
      </div>
      <footer>
        <div>
          <span className="footer-brand">CHUNG CƯ</span>
          <span className="footer-description">
            Kết nối cư dân. Vận hành thuận tiện.
          </span>
        </div>
        <nav className="footer-links" aria-label="Liên kết cuối trang">
          <Link to="/">Dịch vụ cư dân</Link>
          <Link to="/quet-qr">Gửi phản ánh</Link>
          <Link to="/tra-cuu">Tra cứu tiến độ</Link>
        </nav>
      </footer>
    </div>
  );
}
```
