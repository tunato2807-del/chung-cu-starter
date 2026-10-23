# Giao diện mới: ảnh lớn, chữ rõ, điều hướng gọn

Dành cho dự án **đầy đủ nghiệp vụ** `chung-cu-starter-codex-auth-qr-incidents`. Nhánh GitHub: **codex/editorial-business-ui**. Không lấy App.jsx từ nhánh main vì main có cấu trúc giao diện xem trước khác với bản nghiệp vụ.

## Xem trước

- [Trang chủ desktop](giao-dien-editorial/cong-cu-dan-1440.png) · [Điện thoại](giao-dien-editorial/cong-cu-dan-320.png)
- [Tổng quan quản trị](giao-dien-editorial/tong-quan-1440.png) · [Danh sách căn hộ](giao-dien-editorial/can-ho-1440.png)
- [Đăng nhập](giao-dien-editorial/dang-nhap-1440.png) · [Thanh toán (dữ liệu kiểm thử)](giao-dien-editorial/thanh-toan-1440.png)

Bản này có tiêu đề **“Sống an tâm. Kết nối dễ dàng.”**, ảnh ngang có nút dừng/chuyển, danh sách dịch vụ đánh số, nút đen, điểm nhấn olive và sidebar quản trị nền trắng. Hệ chữ, màu, bảng, form và thẻ tổng quan áp dụng cho các phân hệ qua stylesheet dùng chung.

Nike và Apple bị chặn bởi proxy của môi trường, nên đây là thiết kế độc lập theo hướng ảnh lớn/chữ mạnh, không phải bản sao hay bản đối chiếu trực tiếp với website hiện tại của họ. Ảnh kiến trúc là ảnh minh họa sẵn có trong dự án.

## Cập nhật trong VS Code

Sao lưu các file hiện tại trước khi thay. Nếu bạn đã cập nhật đủ bản `codex/appfolio-business-ui`, có **4 file** thay đổi: `residence.css`, `Portal.jsx`, `Layout.jsx`, `Billing.jsx`. File hóa đơn chỉ thêm khả năng focus/cuộn bảng bằng bàn phím. Hai file `main.jsx` và `App.jsx` bên dưới được giữ để bạn kiểm tra đầy đủ đường dẫn import, không chép nhầm App của bản khung.

Nếu chưa cập nhật bản trước, chép đủ **6 file** dưới đây vào đúng thư mục, tạo file nếu chưa có. Giữ các file `global.css`, `professional.css`, `navigation.js`, `Auth.jsx` của **bản nghiệp vụ** đang chạy.

| File | Vai trò |
| --- | --- |
| frontend/src/styles/residence.css | Hệ giao diện toàn ứng dụng |
| frontend/src/main.jsx | Nạp residence.css cuối cùng |
| frontend/src/features/incidents/Portal.jsx | Trang dịch vụ cư dân mới |
| frontend/src/app/App.jsx | Router nghiệp vụ, import Portal mới |
| frontend/src/app/Layout.jsx | Header, menu theo quyền, footer |
| frontend/src/features/billing/Billing.jsx | Bảng chi tiết hóa đơn hỗ trợ cuộn bằng bàn phím |

Ảnh và slideshow dùng các file có sẵn: `frontend/src/shared/PhotoCarousel.jsx`, `PhotoCarousel.css`, ba ảnh trong `frontend/public/images/residences/`. Không cần cài thư viện mới, chạy migration hay đổi database.

Từ PowerShell tại thư mục gốc dự án:

```powershell
npm run build
```

Nếu build thành công, khởi động frontend bằng lệnh bạn đang dùng trước đó (`dev:frontend` hoặc `dev:frontend:https`). Giữ cấu hình HTTPS hiện tại để điện thoại dùng camera. Nếu đang có Vite chạy, lưu file sẽ cập nhật; tải lại bằng **Ctrl+Shift+R**. Không chạy thêm server trùng cổng.

Nếu vẫn thấy giao diện cũ:

1. Mở `frontend/src/main.jsx`, kiểm tra `import "./styles/residence.css";` nằm sau hai CSS cũ.
2. Mở `frontend/src/app/App.jsx`, kiểm tra `import Portal from "../features/incidents/Portal.jsx";`. Không import Portal cũ từ PublicReports.jsx.
3. Kiểm tra terminal đang chạy đúng thư mục dự án bạn vừa sửa.
4. Nếu trắng trang, lấy dòng lỗi đỏ đầu tiên ở F12 → Console. Không thay navigation hay tự thêm dữ liệu mảng rỗng để che lỗi.

## Nội dung file đầy đủ

### frontend/src/styles/residence.css

```css
/* Giao diện editorial cho bản nghiệp vụ. Nạp sau global.css và professional.css. */
:root {
  --ink: #171917;
  --muted: #61665c;
  --brand: #171917;
  --brand-deep: #353a30;
  --brand-soft: #eef1e4;
  --line: #dddfd7;
  --canvas: #f5f5f1;
  --accent: #171917;
  --accent-deep: #353a30;
  --surface: #fff;
  --charcoal: #171917;
  --control-line: #848b7b;
  --shadow: none;
  --highlight: #ddea9a;
  --olive: #52612b;
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
  background: #ddea9a;
  color: var(--charcoal);
}
a {
  color: var(--brand-deep);
}
button,
.button {
  min-height: 44px;
  padding: 10px 18px;
  border-color: var(--control-line);
  border-radius: 4px;
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
  outline: 3px solid #52612b;
  outline-offset: 3px;
}
input,
select,
textarea {
  border-color: var(--control-line);
  border-radius: 4px;
  color: var(--ink);
  font-size: 14px;
  min-height: 44px;
}
input::placeholder,
textarea::placeholder {
  color: #666d5f;
}
input:focus,
select:focus,
textarea:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px #17191714;
}
input[type="checkbox"],
input[type="radio"] {
  accent-color: var(--brand);
}
.field > label {
  color: #3f4738;
  font-size: 13px;
}
h1,
h2,
h3 {
  color: var(--ink);
}
h1 {
  font-size: clamp(28px, 2.8vw, 40px);
  letter-spacing: -0.04em;
  font-weight: 750;
}
.muted,
.note,
.overview-note {
  color: var(--muted);
}
.card {
  border-color: var(--line);
  border-radius: 4px;
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
  border-radius: 4px;
}
.success {
  color: #176044;
  background: #edf8f1;
  border-color: #a8d2b6;
}

/* Điều hướng công khai và bố cục không gian làm việc. */
.topbar {
  height: 80px;
  padding: 0 max(32px, calc((100% - 1440px) / 2));
  background: #fff;
  border-bottom: 1px solid var(--line);
  box-shadow: none;
  gap: 32px;
}
.brand {
  color: var(--charcoal);
  gap: 12px;
  font-size: 18px;
  letter-spacing: 0.04em;
}
.brand-icon {
  width: 44px;
  height: 44px;
  background: var(--ink);
  color: white;
  border: 0;
  border-radius: 50%;
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
  background: #ecf0df;
  color: var(--brand-deep);
  border-radius: 4px;
}
.profile-dropdown {
  border-color: var(--line);
  border-radius: 4px;
}
.profile-dropdown a:hover,
.profile-dropdown button:hover {
  background: var(--brand-soft);
}
.is-public {
  background: #fff;
}
.is-public .public-space {
  max-width: 1504px;
  padding: 0 32px 48px;
  margin: 0 auto;
}
.is-public .public-space > main {
  padding-top: 0;
}
.is-public .public-space > main > .card:first-child,
.is-public .public-space > main > .narrow:first-child {
  margin-top: 40px;
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
  color: var(--charcoal);
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
  background: linear-gradient(180deg, transparent 35%, #171917d9 100%);
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
  background: white;
  height: 80px;
  padding: 20px 24px;
  width: 100%;
  color: var(--ink);
  margin: 0;
  border-bottom: 1px solid var(--line);
}
.is-workspace .brand small {
  color: var(--muted);
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
  background: white;
  border-right: 1px solid var(--line);
  padding: 24px 16px;
  color: var(--ink);
}
.is-workspace .sidebar-heading {
  margin-bottom: 16px;
  padding: 0 12px 20px;
  border-bottom: 1px solid #dcded6;
}
.is-workspace .sidebar-heading .eyebrow {
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 0.03em;
}
.is-workspace .nav-group {
  margin-bottom: 20px;
}
.is-workspace .nav-group-label {
  color: var(--muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding-left: 12px;
  text-transform: uppercase;
}
.is-workspace .sidebar nav a {
  color: var(--ink);
  min-height: 44px;
  padding: 11px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 13px;
}
.is-workspace .sidebar nav a .icon {
  color: var(--muted);
}
.is-workspace .sidebar nav a:hover {
  background: var(--brand-soft);
  color: var(--ink);
}
.is-workspace .sidebar nav a.active {
  color: white;
  background: var(--ink);
  box-shadow: inset 3px 0 var(--highlight);
  font-weight: 600;
}
.is-workspace .sidebar nav a.active .icon {
  color: var(--highlight);
}
.is-workspace .sidebar .public-link {
  background: var(--brand-soft);
  border: 1px solid var(--line);
  color: var(--ink);
  border-radius: 4px;
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
  background: #f5f5f1;
  border-color: var(--control-line);
  border-radius: 4px;
}
.function-search form:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px #17191714;
}
.function-results li a:hover,
.function-results li a:focus-visible {
  background: var(--brand-soft);
}
.notification-count {
  background: #52612b;
  color: #fff;
}
.page-heading {
  gap: 20px;
  margin-bottom: 24px;
}
.page-heading .eyebrow,
.overview-page > .page-heading .eyebrow {
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
  border-radius: 4px;
  padding: 24px;
  background: white;
  box-shadow: var(--shadow);
  border-top: 3px solid var(--ink);
}
.overview-metric:nth-child(n + 3) {
  border-top: 3px solid var(--ink);
}
.overview-metric:hover {
  background: #fafbf6;
  border-color: #a1b16c;
}
.overview-metric .metric-label {
  color: var(--muted);
  font-size: 12px;
}
.overview-metric .metric-icon {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background: var(--brand-soft);
  color: var(--olive);
}
.overview-metric > strong {
  color: var(--ink);
  font-size: clamp(26px, 2.6vw, 38px);
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
  background: #f0f1eb;
  border-radius: 4px;
  color: var(--brand-deep);
}
.overview-mini:hover {
  background: #ecf0df;
}
.overview-mini > strong {
  color: var(--brand-deep);
}
.overview-mini > span {
  color: var(--muted);
}
.overview-empty {
  background: #f5f5f1;
  color: var(--muted);
  border-radius: 4px;
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
  border-radius: 4px;
}
.table-scroll,
.table-wrap,
.table-container {
  border-color: var(--line);
  border-radius: 4px;
}
table {
  border-color: var(--line);
}
th {
  background: #f0f1eb;
  color: #50574a;
  font-size: 12px;
  font-weight: 600;
  padding: 14px 16px;
  border-color: var(--line);
  letter-spacing: 0.01em;
}
td {
  padding: 14px 16px;
  color: #31362c;
  border-color: #e6e8e0;
  font-size: 13px;
}
tr:hover td {
  background: #f8f8f4;
}
.pagination button,
.data-tools button {
  border-radius: 4px;
}
.filters,
.report-filters {
  border-color: var(--line);
  background: #f8f8f4;
}
.maintenance-actions,
.treasury-actions {
  border-color: var(--line);
}
.amenity-card,
.fund-card {
  border-radius: 4px;
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
  color: var(--charcoal);
}
.payment-card {
  border-radius: 4px;
}
.payment-qr-frame {
  border-color: var(--line);
  border-radius: 4px;
  box-shadow: none;
}

/* Đăng nhập dùng cùng hình ảnh và hệ màu với cổng cư dân. */
.is-public .auth-layout {
  grid-template-columns: 1fr 1fr;
  max-width: 1080px;
  gap: 0;
  background: white;
  border: 1px solid var(--line);
  border-radius: 4px;
  overflow: hidden;
  margin: 48px auto;
}
.is-public .auth-story {
  background: var(--charcoal);
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
  color: #d6ddcd;
  font-size: 13px;
}
.is-public .auth-story-label,
.is-public .auth-trust {
  color: #d6ddcd;
}
.is-public .auth-story .photo-carousel {
  border-radius: 4px;
  border-color: #79816d;
}
.is-public .auth-form {
  padding: 44px;
  background: white;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.is-public .auth-form h1 {
  color: var(--charcoal);
}
.is-public .auth-form .eyebrow {
  color: var(--brand-deep);
}
.login-help p {
  background: #f5f5f1;
  border-color: var(--brand);
}
footer {
  background: var(--charcoal);
  border: 0;
  color: #d6ddcd;
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
  color: #bec6b4;
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
  color: #eef3e4;
  text-decoration: none;
  font-size: 12px;
}
.footer-links a:hover {
  color: white;
  text-decoration: underline;
}

@media (max-width: 1200px) {
  .overview-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 1024px) {
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
    color: var(--charcoal);
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
    color: var(--muted);
    font-size: 11px;
  }
  .is-workspace .mobile-menu-toggle {
    color: #eef3e4;
    background: #30352b;
    border: 1px solid #79816d;
    min-height: 44px;
  }
  .is-workspace .sidebar nav a {
    margin: 0;
    font-size: 12px;
  }
  .is-workspace .sidebar nav a.active {
    box-shadow: inset 0 -3px var(--highlight);
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
    border-radius: 4px;
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
    border-radius: 4px;
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

/* Cổng dịch vụ: ảnh panorama, chữ rõ, danh sách thay cho lưới thẻ đồng dạng. */
.resident-portal {
  min-width: 0;
}
.resident-hero {
  display: grid;
  isolation: isolate;
  margin-top: 24px;
}
.resident-hero-visual,
.resident-hero-copy {
  grid-area: 1 / 1;
  min-width: 0;
}
.resident-hero-visual {
  align-self: stretch;
}
.resident-hero-visual .photo-carousel {
  border: 0;
  border-radius: 0;
  box-shadow: none;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.resident-hero-visual .photo-carousel-viewport {
  flex: 1;
  aspect-ratio: auto;
  min-height: 540px;
  background: var(--charcoal);
}
.resident-hero-visual .photo-carousel-viewport::after {
  background: linear-gradient(
    90deg,
    #111810eb 0%,
    #111810b8 45%,
    #11181024 100%
  );
}
.photo-carousel--editorial .photo-carousel-caption {
  display: none;
}
.resident-hero-visual .photo-carousel-toolbar {
  min-height: 60px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--line);
  background: #fff;
}
.resident-hero-copy {
  z-index: 1;
  align-self: end;
  padding: 96px 48px 108px;
  pointer-events: none;
}
.resident-hero-copy a {
  pointer-events: auto;
}
.resident-eyebrow {
  color: #fff;
  margin: 0 0 20px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 600;
  font-size: 12px;
}
.resident-eyebrow > span {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: var(--highlight);
  margin-right: 12px;
}
.resident-hero h1 {
  font-size: clamp(44px, 5.7vw, 80px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.045em;
  margin: 0 0 24px;
  color: #fff;
}
.resident-hero h1 > span {
  color: var(--highlight);
}
.resident-intro {
  max-width: 460px;
  color: #fff;
  margin: 0 0 28px;
  font-size: 15px;
  line-height: 1.7;
}
.resident-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.resident-hero-actions .button {
  min-height: 48px;
  padding: 12px 24px;
  border-radius: 48px;
  font-size: 13px;
}
.resident-hero-actions .primary {
  background: #fff;
  color: var(--ink);
  border-color: #fff;
}
.resident-hero-actions .primary:hover {
  background: var(--highlight);
  color: var(--ink);
  border-color: var(--highlight);
}
.resident-secondary {
  background: #171917;
  color: #fff;
  border-color: #fff;
}
.resident-secondary:hover {
  background: #353a30;
  color: #fff;
  border-color: #fff;
}
.resident-hero a:focus-visible {
  outline-color: var(--highlight);
}
.resident-service-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-bottom: 1px solid var(--line);
}
.resident-service-strip a {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 24px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  color: var(--ink);
  border-right: 1px solid var(--line);
}
.resident-service-strip a:last-child {
  border-right: 0;
}
.resident-service-strip a > .icon:last-child {
  margin-left: auto;
}
.resident-service-strip a:hover {
  background: var(--brand-soft);
}
.resident-catalog {
  padding-top: 64px;
  scroll-margin-top: 112px;
}
.resident-section-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 24px;
  margin-bottom: 32px;
}
.resident-kicker {
  text-transform: uppercase;
  color: var(--olive);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin: 0 0 16px;
}
.resident-section-heading h2,
.resident-support h2 {
  font-size: clamp(28px, 3.5vw, 48px);
  line-height: 1.16;
  letter-spacing: -0.04em;
  margin: 0 0 16px;
  font-weight: 750;
  color: var(--ink);
}
.resident-section-heading p:last-child {
  color: var(--muted);
  font-size: 14px;
  margin: 0;
}
.resident-catalog-count {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--muted);
  max-width: 35%;
  overflow-wrap: anywhere;
}
.resident-search {
  margin-bottom: 20px;
}
.resident-search > label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}
.resident-search > div {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 8px 8px 20px;
  border: 1px solid var(--control-line);
  border-radius: 4px;
  background: var(--canvas);
}
.resident-search > div:focus-within {
  outline: 2px solid var(--olive);
  outline-offset: 3px;
}
.resident-search input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  padding: 8px 0;
  font-size: 15px;
  box-shadow: none;
}
.resident-search input:focus {
  outline: none;
  box-shadow: none;
}
.resident-search button {
  flex-shrink: 0;
  min-height: 48px;
  padding: 12px 24px;
}
.resident-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 24px;
}
.resident-categories button {
  border-radius: 48px;
  border-color: var(--line);
  padding: 10px 20px;
  min-height: 44px;
  font-size: 12px;
  background: #fff;
  color: var(--muted);
}
.resident-categories button[aria-pressed="true"] {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}
.resident-services {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 32px;
  padding: 0;
  margin: 0;
  border-top: 1px solid var(--line);
}
.resident-services > li {
  min-width: 0;
}
.resident-service {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  align-content: start;
  column-gap: 20px;
  height: 100%;
  min-height: 212px;
  padding: 28px 16px;
  border-bottom: 1px solid var(--line);
  text-decoration: none;
  color: var(--ink);
  transition: background 0.18s ease;
}
.resident-service:hover {
  background: var(--canvas);
}
.resident-service-top {
  display: flex;
  flex-direction: column;
  gap: 12px;
  grid-column: 1;
  grid-row: 1 / 4;
}
.resident-service-number {
  font-size: 12px;
  color: var(--muted);
}
.resident-service-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--brand-soft);
  color: var(--olive);
  border-radius: 50%;
}
.resident-service h3 {
  grid-column: 2;
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.resident-service > p {
  grid-column: 2;
  margin: 0 0 24px;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.7;
}
.resident-service-bottom {
  grid-column: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--ink);
  margin-top: auto;
}
.resident-service-bottom > .icon {
  width: 32px;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 50%;
  padding: 6px;
}
.resident-service-featured .resident-service-icon {
  background: var(--ink);
  color: var(--highlight);
}
.resident-support {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  margin-top: 64px;
  padding: 48px;
  background: var(--brand-soft);
}
.resident-support > div > p:not(.resident-kicker) {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.8;
  max-width: 400px;
  margin: 0 0 24px;
}
.resident-support .button {
  border-radius: 40px;
}
.resident-support > ol {
  list-style: none;
  padding: 0;
  margin: 0;
}
.resident-support li {
  display: flex;
  gap: 20px;
  align-items: start;
  padding: 24px 0;
  border-bottom: 1px solid #c9cdbd;
}
.resident-support li:first-child {
  padding-top: 0;
}
.resident-support li:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}
.resident-support li > span {
  color: var(--olive);
  font-size: 20px;
  line-height: 1.3;
}
.resident-support li > div {
  flex: 1;
}
.resident-support li > .icon {
  color: var(--olive);
}
.resident-support h3 {
  font-size: 16px;
  margin: 0 0 8px;
}
.resident-support li p {
  color: var(--muted);
  font-size: 13px;
  margin: 0;
}
.resident-emergency {
  display: flex;
  align-items: start;
  gap: 8px;
  color: var(--muted);
  font-size: 11px;
  margin: 24px 0 0;
}
.resident-emergency > .icon {
  margin-top: 2px;
}

/* Biểu mẫu, hóa đơn và các không gian đã đăng nhập. */
.is-public .top-links > .button {
  border-radius: 40px;
}
.is-public .auth-layout {
  border-radius: 0;
}
.is-public .auth-form > h1 {
  font-size: 40px;
}
.is-public .auth-form button.primary {
  border-radius: 40px;
}
.is-public .auth-story {
  background: var(--charcoal);
}
.is-public .auth-story .photo-carousel {
  border-radius: 0;
}
.is-public footer {
  padding-top: 48px;
  padding-bottom: 48px;
}
.is-public .footer-brand {
  font-size: clamp(24px, 4vw, 48px);
  letter-spacing: -0.04em;
  font-weight: 800;
}
.is-workspace .card {
  border-radius: 4px;
}
.is-workspace .page-heading {
  padding-bottom: 24px;
  border-bottom: 1px solid var(--line);
}
.is-workspace .workspace-breadcrumb {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}
.payment-card {
  overflow: hidden;
}
.payment-header {
  border-bottom: 1px solid var(--line);
}
.payment-qr-frame {
  background: white;
}
@media (min-width: 901px) {
  .is-workspace .sidebar {
    scrollbar-width: thin;
    scrollbar-color: #c4cbbd white;
  }
}
@media (max-width: 1024px) {
  .resident-hero-copy {
    padding: 88px 32px 100px;
  }
  .resident-hero h1 {
    font-size: 60px;
  }
  .resident-service-strip a {
    padding: 20px 16px;
    font-size: 12px;
  }
  .resident-support {
    padding: 32px;
    gap: 32px;
  }
  .resident-services {
    column-gap: 20px;
  }
}
@media (max-width: 650px) {
  .resident-hero {
    margin-top: 12px;
  }
  .resident-hero-visual .photo-carousel-viewport {
    min-height: 460px;
  }
  .resident-hero-visual .photo-carousel-viewport::after {
    background: linear-gradient(180deg, #11181055, #111810eb 70%);
  }
  .resident-hero-copy {
    padding: 80px 20px 88px;
  }
  .resident-hero h1 {
    font-size: clamp(34px, 8.7vw, 48px);
    line-height: 1.14;
    margin-bottom: 16px;
  }
  .resident-eyebrow {
    font-size: 9px;
    letter-spacing: 0.08em;
    margin-bottom: 16px;
  }
  .resident-intro {
    font-size: 12px;
    margin-bottom: 20px;
  }
  .resident-hero-actions {
    gap: 8px;
  }
  .resident-hero-actions .button {
    font-size: 11px;
    padding: 12px 16px;
  }
  .resident-hero-visual .photo-carousel-toolbar {
    padding: 4px;
  }
  .resident-hero-visual .photo-carousel-label {
    left: 16px;
    top: 16px;
    font-size: 8px;
  }
  .resident-service-strip {
    grid-template-columns: 1fr;
  }
  .resident-service-strip a {
    padding: 16px 4px;
    border-right: 0;
    border-bottom: 1px solid var(--line);
    font-size: 12px;
  }
  .resident-service-strip a:last-child {
    border-bottom: 0;
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
    font-size: 30px;
  }
  .resident-section-heading p:last-child {
    font-size: 13px;
  }
  .resident-catalog-count {
    max-width: 100%;
    font-size: 11px;
  }
  .resident-search > div {
    gap: 8px;
    padding: 8px;
    flex-wrap: wrap;
  }
  .resident-search input {
    font-size: 13px;
    width: calc(100% - 32px);
  }
  .resident-search button {
    width: 100%;
    min-height: 44px;
  }
  .resident-categories {
    gap: 6px;
  }
  .resident-categories button {
    padding: 10px 12px;
    font-size: 11px;
  }
  .resident-services {
    grid-template-columns: 1fr;
  }
  .resident-service {
    min-height: 0;
    padding: 24px 0;
    column-gap: 12px;
    grid-template-columns: 36px minmax(0, 1fr);
  }
  .resident-service-icon {
    width: 36px;
    height: 36px;
  }
  .resident-service h3 {
    font-size: 19px;
  }
  .resident-service > p {
    font-size: 12px;
    margin-bottom: 16px;
  }
  .resident-support {
    grid-template-columns: 1fr;
    margin-top: 36px;
    padding: 24px;
    gap: 28px;
  }
  .resident-support h2 {
    font-size: 30px;
  }
  .resident-support li {
    gap: 12px;
  }
  .resident-support li > .icon {
    display: none;
  }
  .resident-support h3 {
    font-size: 14px;
  }
  .resident-emergency {
    font-size: 10px;
  }
  .is-public .auth-form > h1 {
    font-size: 32px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .resident-service {
    transition: none;
  }
}
.payment-details dt,
.payment-notice,
.payment-amount-label {
  color: var(--muted);
}
.payment-details dd {
  color: var(--ink);
}
.payment-details .payment-reference {
  background: var(--brand-soft);
  border-color: var(--line);
  border-radius: 4px;
}
```

### frontend/src/main.jsx

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

### frontend/src/features/incidents/Portal.jsx

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
            Sống an tâm.
            <br />
            <span>Kết nối dễ dàng.</span>
          </h1>
          <p className="resident-intro">
            Một nơi để gửi phản ánh, xem hóa đơn và đặt lịch tiện ích. Mọi việc
            của căn hộ, ngay trong tầm tay.
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
        </div>
        <div className="resident-hero-visual">
          <PhotoCarousel variant="editorial" />
        </div>
      </section>

      <nav className="resident-service-strip" aria-label="Truy cập nhanh">
        <a href="#dich-vu" onClick={showCatalog}>
          <Icon name="search" size={20} />
          Tìm dịch vụ
          <Icon name="arrow" size={18} />
        </a>
        <Link to="/quet-qr">
          <Icon name="qr" size={20} />
          Phản ánh qua QR
          <Icon name="arrow" size={18} />
        </Link>
        <Link to="/tra-cuu">
          <Icon name="message" size={20} />
          Theo dõi phản ánh
          <Icon name="arrow" size={18} />
        </Link>
      </nav>

      <section
        className="resident-catalog"
        id="dich-vu"
        ref={catalog}
        aria-labelledby="catalog-title"
      >
        <div className="resident-section-heading">
          <div>
            <p className="resident-kicker">01 / Dịch vụ cư dân</p>
            <h2 id="catalog-title">Hôm nay, bạn cần gì?</h2>
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
              <ServiceCard
                key={service.id}
                service={service}
                user={user}
                number={services.indexOf(service) + 1}
              />
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

function ServiceCard({ service, user, number }) {
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
          <span className="resident-service-number" aria-hidden="true">
            {String(number).padStart(2, "0")}
          </span>
          <span className="resident-service-icon">
            <Icon name={service.icon} size={24} />
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
        <p className="resident-kicker">02 / Tiếp nhận & xử lý</p>
        <h2 id="support-title">
          Để nơi mình sống
          <br />
          tốt hơn mỗi ngày.
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

### frontend/src/app/App.jsx

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

### frontend/src/app/Layout.jsx

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
            Nơi mình sống. Điều mình quan tâm.
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

### frontend/src/features/billing/Billing.jsx

```jsx
import DataTools from "../../shared/DataTools.jsx";
import BatchBills from "./BatchBills.jsx";
import BatchBillActions from "./BatchBillActions.jsx";
import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import QRCode from "qrcode";
import { banks, bankName, bankSearch } from "./banks.js";
import { useAuth } from "../auth/Auth.jsx";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";

const fees = {
  PHI_QUAN_LY: "Phí quản lý",
  GUI_O_TO: "Gửi ô tô",
  GUI_XE_MAY: "Gửi xe máy",
  GUI_XE_DAP: "Gửi xe đạp",
  TIEN_NUOC: "Tiền nước",
  TIEN_DIEN: "Tiền điện",
};
const statuses = {
  NHAP: "Bản nháp",
  DA_DUYET: "Đã duyệt",
  DA_GUI: "Đã gửi",
  DA_THANH_TOAN: "Đã thanh toán",
  HUY: "Đã hủy",
};
const meterNames = { DIEN: "Điện", NUOC: "Nước" };
const eventNames = {
  LAP_NHAP: "Lập bản nháp",
  LAP_THAY_THE: "Lập bản thay thế",
  TINH_LAI: "Tính lại bản nháp",
  DUYET: "Duyệt hóa đơn",
  GUI: "Gửi hóa đơn",
  HUY: "Hủy hóa đơn",
  XAC_NHAN_THANH_TOAN: "Xác nhận đã thu",
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const money = (n) => `${BigInt(n || 0).toLocaleString("vi-VN")} đ`;
// Format API decimal strings without losing precision or displaying trailing zeros.
const number = (value) => {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(String(value ?? ""));
  if (!match) return "—";
  const fraction = (match[2] || "").replace(/0+$/, "");
  return `${BigInt(match[1]).toLocaleString("vi-VN")}${fraction ? `,${fraction}` : ""}`;
};
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
function billOptions(body) {
  for (const k of ["tinh_nuoc", "tinh_dien", "tinh_xe"])
    body[k] = body[k] === "1";
  return body;
}
function useAction(done) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [notice, setNotice] = useState("");
  async function run(path, method, body, after) {
    setPending(true);
    setError(null);
    setNotice("");
    try {
      const r = await getJson(path, { method, body });
      setNotice(
        path.endsWith("/nhac_phi")
          ? r.data.da_ton_tai
            ? "Hóa đơn này đã được nhắc trên web hôm nay."
            : "Đã gửi nhắc thanh toán vào hộp thông báo trên web."
          : "Đã lưu thay đổi.",
      );
      after?.(r.data);
      done?.();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return { pending, error, notice, run };
}
function Feedback({ action }) {
  return (
    <>
      {action.notice && (
        <p className="note" role="status">
          {action.notice}
        </p>
      )}
      <ErrorBox error={action.error} />
    </>
  );
}
function Pager({ resource }) {
  const [params, setParams] = useSearchParams(),
    page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(p) {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    setParams(next);
  }
  return (
    <div className="actions">
      <button
        disabled={resource.loading || page <= 1}
        onClick={() => go(page - 1)}
      >
        Trang trước
      </button>
      <span>
        Trang {page} · {total} bản ghi
      </span>
      <button
        disabled={resource.loading || page * 20 >= total}
        onClick={() => go(page + 1)}
      >
        Trang sau
      </button>
    </div>
  );
}
function ApartmentField({ initialId = "", initialLabel = "" }) {
  const [q, setQ] = useState(""),
    [id, setId] = useState(String(initialId)),
    [label, setLabel] = useState(initialLabel);
  const resource = useResource(`/can_ho?q=${encodeURIComponent(q)}`),
    matches = resource.result?.data || [];
  return (
    <>
      <Field label="Tìm căn hộ để chọn">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
        />
      </Field>
      <ErrorBox error={resource.error} />
      <Field label="Căn hộ">
        <select
          name="ma_can_ho"
          required
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setLabel(e.target.selectedOptions[0].textContent);
          }}
        >
          <option value="">Chọn căn hộ</option>
          {id && !matches.some((a) => String(a.ma_can_ho) === id) && (
            <option value={id}>{label || `Căn #${id}`}</option>
          )}
          {matches.map((a) => (
            <option key={a.ma_can_ho} value={a.ma_can_ho}>
              {a.so_can_ho}
            </option>
          ))}
        </select>
      </Field>
      {resource.result?.total > 20 && (
        <small>
          Nhập số căn cụ thể để thu hẹp {resource.result.total} kết quả.
        </small>
      )}
    </>
  );
}
function ChargeOptions({ bill }) {
  return (
    <div className="card">
      <p>
        Khoản thu áp dụng: phí quản lý theo cấu hình của căn hộ; các khoản khác
        chọn dưới đây.
      </p>
      {[
        ["tinh_nuoc", "Thu tiền nước", true],
        ["tinh_dien", "BQL thu tiền điện", false],
        ["tinh_xe", "Thu phí gửi xe", true],
      ].map(([key, label, defaultValue]) => (
        <label className="checkbox" key={key}>
          <input
            type="checkbox"
            name={key}
            value="1"
            defaultChecked={bill ? !!bill[key] : defaultValue}
          />
          {label}
        </label>
      ))}
      <small>
        Điện áp dụng biểu giá và thuế hiệu lực tại ngày chốt. Nếu cư dân trả
        trực tiếp cho EVN, không chọn BQL thu tiền điện. Phí xe theo số đăng ký
        hiệu lực tại ngày chốt, chưa chia theo ngày.
      </small>
    </div>
  );
}

export function Rates() {
  const [params, setParams] = useSearchParams(),
    resource = useResource(`/cau_hinh_phi?${params}`),
    action = useAction(resource.reload),
    [type, setType] = useState("PHI_QUAN_LY"),
    [method, setMethod] = useState("BAC_THANG"),
    [vat, setVat] = useState(""),
    [tiers, setTiers] = useState(
      [50, 100, 200, 300, 400, null].map((upper) => ({
        den_kwh: upper,
        don_gia: "",
      })),
    );
  function setTier(index, key, value) {
    setTiers((all) =>
      all.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  }
  return (
    <>
      <h1>Đơn giá phí</h1>
      <p>
        Đơn giá theo ngày hiệu lực. Phiên bản mới kết thúc khoảng giá trước đó;
        các đơn giá và chi tiết hóa đơn đã lưu được giữ lại.
      </p>
      <Feedback action={action} />
      <section className="card narrow">
        <h2>Thêm phiên bản giá</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const body = values(e);
            if (type === "TIEN_DIEN") {
              body.cach_tinh = method;
              body.thue_gtgt = vat;
              if (method === "BAC_THANG")
                body.bac_dien = tiers.map((r, i) => ({
                  den_kwh: i === tiers.length - 1 ? null : Number(r.den_kwh),
                  don_gia: r.don_gia,
                }));
            }
            action.run("/cau_hinh_phi", "POST", body, () => {
              form.reset();
              setType("PHI_QUAN_LY");
              setMethod("BAC_THANG");
              setVat("");
              setTiers(
                [50, 100, 200, 300, 400, null].map((upper) => ({
                  den_kwh: upper,
                  don_gia: "",
                })),
              );
            });
          }}
        >
          <fieldset disabled={action.pending}>
            <Field label="Loại phí">
              <select
                name="loai_phi"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <Options values={fees} />
              </select>
            </Field>
            {type === "TIEN_DIEN" && (
              <>
                <Field label="Cách tính điện">
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option value="BAC_THANG">Bậc thang lũy tiến</option>
                    <option value="DON_GIA">
                      Một đơn giá theo cấu hình thu điện
                    </option>
                  </select>
                </Field>
                <p>
                  Đối chiếu biểu giá, định mức và thuế áp dụng trước khi lưu.
                  Công tơ do EVN thu trực tiếp không đưa vào hóa đơn BQL.
                </p>
                <Field label="Thuế GTGT điện (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={vat}
                    onChange={(e) => setVat(e.target.value)}
                  />
                </Field>
                {method === "BAC_THANG" && (
                  <>
                    <p>
                      Nhập ngưỡng cộng dồn: 50, 100, 200... kWh. Điện vượt mỗi
                      ngưỡng được tính ở bậc tiếp theo.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTiers(
                          [50, 100, 200, 300, 400, null].map((upper, i) => ({
                            den_kwh: upper,
                            don_gia: String(
                              [1984, 2050, 2380, 2998, 3350, 3460][i],
                            ),
                          })),
                        );
                        setVat("8");
                      }}
                    >
                      Điền mẫu 6 bậc và thuế 8%
                    </button>
                    <small>
                      Mẫu theo số liệu tham khảo bạn cung cấp, chưa xác minh
                      hiệu lực; có thể sửa trước khi lưu.
                    </small>
                    {tiers.map((row, i) => (
                      <div className="form-grid" key={i}>
                        <Field label={`Bậc ${i + 1}: đến kWh`}>
                          {i === tiers.length - 1 ? (
                            <span>Không giới hạn</span>
                          ) : (
                            <input
                              type="number"
                              min="1"
                              max="999999999"
                              step="1"
                              required
                              value={row.den_kwh ?? ""}
                              onChange={(e) =>
                                setTier(i, "den_kwh", e.target.value)
                              }
                            />
                          )}
                        </Field>
                        <Field label={`Đơn giá bậc ${i + 1} (đồng/kWh)`}>
                          <input
                            type="number"
                            min="0"
                            max="9999999999.99"
                            step="0.01"
                            required
                            value={row.don_gia}
                            onChange={(e) =>
                              setTier(i, "don_gia", e.target.value)
                            }
                          />
                        </Field>
                      </div>
                    ))}
                    <div className="actions">
                      <button
                        type="button"
                        disabled={tiers.length >= 12}
                        onClick={() =>
                          setTiers((all) => [
                            ...all.slice(0, -1),
                            { den_kwh: "", don_gia: "" },
                            all.at(-1),
                          ])
                        }
                      >
                        Thêm bậc
                      </button>
                      <button
                        type="button"
                        disabled={tiers.length <= 2}
                        onClick={() =>
                          setTiers((all) => [...all.slice(0, -2), all.at(-1)])
                        }
                      >
                        Bớt bậc
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
            {(type !== "TIEN_DIEN" || method === "DON_GIA") && (
              <Field
                label="Đơn giá (đồng/đơn vị)"
                name="don_gia"
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
                required
              />
            )}
            <Field
              label="Áp dụng từ ngày"
              name="tu_ngay"
              type="date"
              required
              defaultValue={today()}
            />
            <button className="primary">Lưu đơn giá</button>
          </fieldset>
        </form>
      </section>
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field label="Lọc loại phí">
          <select name="loai_phi" defaultValue={params.get("loai_phi") || ""}>
            <Options values={fees} empty="Tất cả" />
          </select>
        </Field>
        <button>Lọc</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Loại phí</th>
                <th>Đơn giá</th>
                <th>Đơn vị</th>
                <th>Từ ngày</th>
                <th>Đến trước ngày</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((r) => (
                <tr key={r.ma_cau_hinh_phi}>
                  <td>{r.ten_phi}</td>
                  <td>
                    {r.cach_tinh === "BAC_THANG" ? (
                      <details>
                        <summary>Biểu giá bậc thang</summary>
                        <ol>
                          {(typeof r.bac_dien === "string"
                            ? JSON.parse(r.bac_dien)
                            : r.bac_dien
                          ).map((tier, i) => (
                            <li key={i}>
                              Đến {tier.den_kwh ?? "không giới hạn"} kWh:{" "}
                              {number(tier.don_gia)} đ/kWh
                            </li>
                          ))}
                        </ol>
                      </details>
                    ) : (
                      number(r.don_gia)
                    )}
                    {r.loai_phi === "TIEN_DIEN" && (
                      <small> · Thuế GTGT {number(r.thue_gtgt)}%</small>
                    )}
                  </td>
                  <td>{r.don_vi_tinh}</td>
                  <td>{r.tu_ngay}</td>
                  <td>{r.den_ngay || "Chưa kết thúc"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có đơn giá.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
export function Meters() {
  const [params, setParams] = useSearchParams(),
    resource = useResource(`/chi_so_dich_vu?${params}`),
    [editing, setEditing] = useState(null),
    action = useAction(resource.reload);
  return (
    <>
      <h1>Chỉ số điện nước</h1>
      <DataTools
        kind="chi_so"
        params={params}
        importable
        disabled={resource.loading}
      />
      <p>
        Nhập lần lượt từng kỳ. Chỉ số đầu kỳ phải khớp cuối kỳ liền trước; kỳ
        đầu cần xác nhận riêng.
      </p>
      <Feedback action={action} />
      <section className="card narrow">
        <h2>{editing ? "Sửa chỉ số" : "Ghi chỉ số"}</h2>
        <form
          key={editing?.ma_chi_so_dich_vu || "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const body = values(e);
            body.ky_dau = body.ky_dau === "1";
            if (editing) body.phien_ban = editing.phien_ban;
            action.run("/chi_so_dich_vu", "PUT", body, () => setEditing(null));
          }}
        >
          <fieldset disabled={action.pending}>
            {editing ? (
              <>
                <p>
                  Căn {editing.so_can_ho} · Kỳ {editing.ky_thanh_toan} ·{" "}
                  {meterNames[editing.loai_dich_vu]}
                </p>
                <input
                  type="hidden"
                  name="ma_can_ho"
                  value={editing.ma_can_ho}
                />
                <input
                  type="hidden"
                  name="loai_dich_vu"
                  value={editing.loai_dich_vu}
                />
                <input
                  type="hidden"
                  name="ky_thanh_toan"
                  value={editing.ky_thanh_toan}
                />
              </>
            ) : (
              <>
                <ApartmentField />
                <Field label="Dịch vụ">
                  <select name="loai_dich_vu">
                    <option value="NUOC">Nước</option>
                    <option value="DIEN">Điện</option>
                  </select>
                </Field>
                <Field
                  label="Kỳ ghi chỉ số"
                  name="ky_thanh_toan"
                  type="month"
                  required
                  max={today().slice(0, 7)}
                  defaultValue={today().slice(0, 7)}
                />
              </>
            )}
            <div className="form-grid">
              <Field
                label="Chỉ số đầu kỳ"
                name="chi_so_cu"
                type="number"
                min="0"
                step="0.001"
                required
                defaultValue={editing?.chi_so_cu || ""}
              />
              <Field
                label="Chỉ số cuối kỳ"
                name="chi_so_moi"
                type="number"
                min="0"
                step="0.001"
                required
                defaultValue={editing?.chi_so_moi || ""}
              />
            </div>
            <Field
              label="Ngày chốt chỉ số"
              name="ngay_chot"
              type="date"
              required
              max={today()}
              defaultValue={editing?.ngay_chot || today()}
            />
            <Field
              label="Ghi chú chỉ số"
              name="ghi_chu"
              maxLength={255}
              defaultValue={editing?.ghi_chu || ""}
            />
            {!editing && (
              <label className="checkbox">
                <input type="checkbox" name="ky_dau" value="1" />
                Đây là kỳ đầu tiên của căn đối với dịch vụ này
              </label>
            )}
            <button className="primary">Lưu chỉ số</button>
          </fieldset>
        </form>
        {editing && (
          <button disabled={action.pending} onClick={() => setEditing(null)}>
            Hủy sửa
          </button>
        )}
      </section>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Lọc kỳ chỉ số"
          name="ky_thanh_toan"
          type="month"
          defaultValue={params.get("ky_thanh_toan") || ""}
        />
        <button>Lọc chỉ số</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Căn</th>
                <th>Kỳ / dịch vụ</th>
                <th>Đầu kỳ</th>
                <th>Cuối kỳ</th>
                <th>Ngày chốt</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((r) => (
                <tr key={r.ma_chi_so_dich_vu}>
                  <td>{r.so_can_ho}</td>
                  <td>
                    {r.ky_thanh_toan} · {meterNames[r.loai_dich_vu]}
                  </td>
                  <td>{number(r.chi_so_cu)}</td>
                  <td>{number(r.chi_so_moi)}</td>
                  <td>{r.ngay_chot}</td>
                  <td>
                    <button
                      disabled={action.pending}
                      onClick={() => setEditing(r)}
                    >
                      Sửa chỉ số
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager resource={resource} />
      </section>
    </>
  );
}

export function Bills() {
  const { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri/hoa-don" : "/cu-dan/hoa-don",
    api = admin ? "/hoa_don" : "/cua_toi/hoa_don";
  const [params, setParams] = useSearchParams(),
    resource = useResource(`${api}?${params}`),
    [adding, setAdding] = useState(false),
    [batchAdding, setBatchAdding] = useState(false),
    [batchProcessing, setBatchProcessing] = useState(false),
    [batchBusy, setBatchBusy] = useState(false),
    navigate = useNavigate(),
    action = useAction(resource.reload);
  return (
    <>
      <div className="page-heading">
        <h1>{admin ? "Phí và hóa đơn" : "Hóa đơn của tôi"}</h1>
        {admin && (
          <div className="actions">
            <button
              type="button"
              disabled={action.pending || batchBusy}
              onClick={() => {
                setBatchProcessing(!batchProcessing);
                setBatchAdding(false);
                setAdding(false);
              }}
            >
              {batchProcessing
                ? "Đóng duyệt/gửi hàng loạt"
                : "Duyệt/gửi hàng loạt"}
            </button>
            <button
              type="button"
              disabled={action.pending || batchBusy}
              onClick={() => {
                setBatchAdding(!batchAdding);
                setAdding(false);
                setBatchProcessing(false);
              }}
            >
              {batchAdding ? "Đóng lập hàng loạt" : "Lập hàng loạt"}
            </button>
            <button
              className="primary"
              disabled={action.pending || batchBusy}
              onClick={() => {
                setAdding(!adding);
                setBatchAdding(false);
                setBatchProcessing(false);
              }}
            >
              {adding ? "Đóng biểu mẫu" : "Lập hóa đơn"}
            </button>
          </div>
        )}
      </div>
      <Feedback action={action} />
      {batchProcessing && (
        <BatchBillActions onDone={resource.reload} onBusy={setBatchBusy} />
      )}
      {batchAdding && (
        <BatchBills onDone={resource.reload} onBusy={setBatchBusy} />
      )}
      {admin && (
        <DataTools kind="hoa_don" params={params} disabled={resource.loading} />
      )}
      {adding && (
        <section className="card narrow">
          <h2>Lập bản nháp cho căn hộ</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action.run("/hoa_don/lap", "POST", billOptions(values(e)), (r) =>
                navigate(`${base}/${r.ma_hoa_don}`),
              );
            }}
          >
            <fieldset disabled={action.pending}>
              <ApartmentField />
              <Field
                label="Kỳ hóa đơn"
                name="ky_thanh_toan"
                type="month"
                required
                max={today().slice(0, 7)}
                defaultValue={today().slice(0, 7)}
              />
              <Field
                label="Ngày chốt phí"
                name="ngay_chot_phi"
                type="date"
                required
                max={today()}
                defaultValue={today()}
              />
              <ChargeOptions />
              <button className="primary">Tạo bản nháp</button>
            </fieldset>
          </form>
        </section>
      )}
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Tìm số hóa đơn hoặc căn hộ"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field
          label="Lọc kỳ hóa đơn"
          name="ky_thanh_toan"
          type="month"
          defaultValue={params.get("ky_thanh_toan") || ""}
        />
        <Field label="Trạng thái hóa đơn">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options
              values={
                admin
                  ? statuses
                  : {
                      DA_GUI: statuses.DA_GUI,
                      DA_THANH_TOAN: statuses.DA_THANH_TOAN,
                    }
              }
              empty="Tất cả"
            />
          </select>
        </Field>
        <button>Tìm hóa đơn</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Số hóa đơn</th>
                <th>Căn / kỳ</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Hạn trả</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((b) => (
                <tr key={b.ma_hoa_don}>
                  <td>
                    <Link to={`${base}/${b.ma_hoa_don}`}>{b.so_hoa_don}</Link>
                  </td>
                  <td>
                    {b.so_can_ho} · {b.ky_thanh_toan}
                  </td>
                  <td>{money(b.tong_tien)}</td>
                  <td>
                    {statuses[b.trang_thai]}
                    {b.qua_han && " · Quá hạn"}
                  </td>
                  <td>{b.han_thanh_toan || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có hóa đơn phù hợp.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
function BankSelect() {
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState("");
  const matches = banks.filter((bank) =>
    bankSearch(`${bank.shortName} ${bank.name} ${bank.bin}`).includes(
      bankSearch(query),
    ),
  );
  const current = banks.find((bank) => bank.bin === selected);
  const option = (bank) => (
    <option key={bank.bin} value={bank.bin}>
      {bank.shortName} — {bank.name}
    </option>
  );
  return (
    <div className="bank-picker">
      <Field label="Tìm ngân hàng">
        <input
          type="search"
          value={query}
          maxLength={100}
          placeholder="Nhập tên ngân hàng, ví dụ Vietcombank"
          onChange={(e) => setQuery(e.target.value)}
        />
      </Field>
      <Field label="Ngân hàng nhận tiền">
        <select
          name="ma_ngan_hang"
          required
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Chọn ngân hàng</option>
          {current &&
            !matches.some((bank) => bank.bin === selected) &&
            option(current)}
          {matches.map(option)}
        </select>
      </Field>
      {!matches.length && (
        <p className="muted">
          Không tìm thấy ngân hàng. Hãy thử tên khác hoặc xóa từ khóa.
        </p>
      )}
      {current && (
        <p className="bank-selection">
          Đã chọn: <strong>{current.shortName}</strong>
        </p>
      )}
    </div>
  );
}
function PaymentQR({ bill }) {
  const [image, setImage] = useState(""),
    [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    setImage("");
    setError(null);
    if (bill.qr_payload)
      QRCode.toDataURL(bill.qr_payload, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "M",
      })
        .then((url) => {
          if (active) setImage(url);
        })
        .catch((e) => {
          if (active) setError(e);
        });
    return () => {
      active = false;
    };
  }, [bill.qr_payload]);
  if (!bill.qr_payload) return null;
  return (
    <section
      className="card payment-card"
      aria-label="Thông tin thanh toán hóa đơn"
    >
      <header className="payment-header">
        <span className="payment-status">Chờ thanh toán</span>
        <h2>Chuyển khoản bằng VietQR</h2>
        <p>
          Căn {bill.so_can_ho} · Kỳ {bill.ky_thanh_toan}
        </p>
      </header>
      <div className="payment-body">
        <p className="payment-amount-label">Số tiền cần thanh toán</p>
        <p className="payment-amount">{money(bill.tong_tien)}</p>
        <div className="payment-qr-frame">
          <span className="payment-qr-brand">VIETQR</span>
          {image ? (
            <img
              src={image}
              alt={`VietQR hóa đơn ${bill.so_hoa_don}`}
              width="320"
              height="320"
            />
          ) : (
            !error && <p role="status">Đang tạo mã QR…</p>
          )}
          <ErrorBox error={error} />
          <span className="payment-qr-caption">
            Quét mã bằng ứng dụng ngân hàng
          </span>
        </div>
        <dl className="payment-details">
          <div>
            <dt>Ngân hàng</dt>
            <dd>{bankName(bill.ma_ngan_hang)}</dd>
          </div>
          <div>
            <dt>Số tài khoản</dt>
            <dd className="payment-account">{bill.so_tai_khoan}</dd>
          </div>
          <div>
            <dt>Người nhận</dt>
            <dd>{bill.ten_nguoi_nhan}</dd>
          </div>
          <div className="payment-reference">
            <dt>Nội dung chuyển khoản</dt>
            <dd>{bill.so_hoa_don}</dd>
          </div>
          <div>
            <dt>Hạn thanh toán</dt>
            <dd>{bill.han_thanh_toan?.split("-").reverse().join("/")}</dd>
          </div>
        </dl>
        {image && (
          <a
            className="button payment-download"
            href={image}
            download={`VietQR-${bill.so_hoa_don}.png`}
          >
            Tải mã QR
          </a>
        )}
        <p className="payment-notice">
          Kiểm tra người nhận, số tiền và giữ đúng nội dung chuyển khoản. Ban
          quản lý sẽ xác nhận sau khi đối soát giao dịch.
        </p>
      </div>
    </section>
  );
}
export function BillDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri/hoa-don" : "/cu-dan/hoa-don",
    resource = useResource(`${admin ? "/hoa_don" : "/cua_toi/hoa_don"}/${id}`),
    action = useAction(resource.reload),
    navigate = useNavigate(),
    bill = resource.result?.data;
  const run = (name, body = {}, after) =>
    action.run(
      `/hoa_don/${id}/${name}`,
      "POST",
      { ...body, phien_ban: bill.phien_ban },
      after,
    );
  return (
    <>
      <Link to={base}>← Danh sách hóa đơn</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Feedback action={action} />
      {bill && (
        <>
          <h1>Hóa đơn {bill.so_hoa_don}</h1>
          <p>
            Căn {bill.so_can_ho} · Kỳ {bill.ky_thanh_toan} · Chốt ngày{" "}
            {bill.ngay_chot_phi}
          </p>
          <p>
            {statuses[bill.trang_thai]}
            {bill.qua_han && " · Quá hạn"} · Hạn trả:{" "}
            {bill.han_thanh_toan || "Chưa gửi"}
          </p>
          <p className="muted">
            Người phụ trách thanh toán hiện tại:{" "}
            <strong>
              {bill.nguoi_phu_trach_thanh_toan || "Chưa gắn chủ hộ"}
            </strong>
          </p>
          {admin && bill.loi_du_lieu.length > 0 && (
            <div className="error" role="alert">
              <strong>Cần bổ sung trước khi duyệt:</strong>
              <ul>
                {bill.loi_du_lieu.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <section className="card bill-lines">
            <div
              className="table-wrap"
              tabIndex={0}
              role="region"
              aria-label="Chi tiết khoản thu, cuộn ngang để xem đủ cột"
            >
              <table>
                <thead>
                  <tr>
                    <th>Khoản thu</th>
                    <th>Số lượng</th>
                    <th>Đơn vị</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.lines.map((l, i) => (
                    <tr key={i}>
                      <td>{l.dien_giai}</td>
                      <td className="bill-number">{number(l.so_luong)}</td>
                      <td>{l.don_vi_tinh}</td>
                      <td className="bill-number">{number(l.don_gia)} đ</td>
                      <td className="bill-number bill-line-total">
                        {money(l.thanh_tien)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 className="bill-total">Tổng cộng: {money(bill.tong_tien)}</h2>
          </section>
          <PaymentQR bill={bill} />
          {bill.trang_thai === "DA_THANH_TOAN" && (
            <p className="note">
              Đã ghi nhận {money(bill.so_tien_da_thu)} · Tham chiếu:{" "}
              {bill.ma_tham_chieu}
            </p>
          )}
          {admin && bill.trang_thai === "NHAP" && (
            <section className="card narrow">
              <h2>Tính lại bản nháp</h2>
              <form
                key={bill.phien_ban}
                onSubmit={(e) => {
                  e.preventDefault();
                  run("tinh_lai", billOptions(values(e)));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Ngày chốt phí"
                    name="ngay_chot_phi"
                    type="date"
                    required
                    max={today()}
                    defaultValue={bill.ngay_chot_phi}
                  />
                  <ChargeOptions bill={bill} />
                  <button>Tính lại bản nháp</button>
                </fieldset>
              </form>
              <button
                className="primary"
                disabled={
                  action.pending ||
                  bill.loi_du_lieu.length > 0 ||
                  BigInt(bill.tong_tien) <= 0n
                }
                onClick={() => run("duyet")}
              >
                Duyệt hóa đơn
              </button>
            </section>
          )}
          {admin && bill.trang_thai === "DA_DUYET" && (
            <section className="card narrow bill-publish">
              <h2>Gửi hóa đơn cho cư dân</h2>
              <p className="muted">
                Chọn ngân hàng và điền thông tin nhận tiền để tạo mã thanh toán
                cho hóa đơn.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run("gui", values(e));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Hạn thanh toán"
                    name="han_thanh_toan"
                    type="date"
                    min={today()}
                    defaultValue={today()}
                    required
                  />
                  <BankSelect />
                  <Field
                    label="Số tài khoản nhận"
                    name="so_tai_khoan"
                    inputMode="numeric"
                    pattern="[0-9]{6,30}"
                    required
                  />
                  <Field
                    label="Tên người nhận"
                    name="ten_nguoi_nhan"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                  <button className="primary">Gửi hóa đơn</button>
                </fieldset>
              </form>
            </section>
          )}
          {admin && bill.trang_thai === "DA_GUI" && (
            <section className="card narrow">
              <h2>Nhắc phí và xác nhận thu tiền</h2>
              <p className="muted">
                Gửi vào hộp thông báo của tài khoản căn hộ và người phụ trách
                thanh toán hiện tại. Mỗi hóa đơn được nhắc tối đa một lần trong
                ngày.
              </p>
              <button disabled={action.pending} onClick={() => run("nhac_phi")}>
                Nhắc thanh toán trên web
              </button>
              <h3>Xác nhận thu tiền</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run("xac_nhan_thanh_toan", values(e));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Số tiền đã đối soát"
                    name="so_tien"
                    type="number"
                    step="1"
                    min="1"
                    required
                    defaultValue={bill.tong_tien}
                  />
                  <Field
                    label="Mã tham chiếu giao dịch"
                    name="ma_tham_chieu"
                    required
                    minLength={3}
                    maxLength={100}
                  />
                  <label className="checkbox">
                    <input type="checkbox" required />
                    Đã đối soát đủ số tiền hóa đơn
                  </label>
                  <button className="primary">Xác nhận đã thu</button>
                </fieldset>
              </form>
            </section>
          )}
          {admin &&
            ["NHAP", "DA_DUYET", "DA_GUI"].includes(bill.trang_thai) && (
              <section className="card narrow">
                <h2>Hủy hóa đơn</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run("huy", values(e));
                  }}
                >
                  <fieldset disabled={action.pending}>
                    <Field
                      label="Lý do hủy"
                      name="ly_do"
                      required
                      minLength={3}
                      maxLength={255}
                    />
                    <button>Hủy hóa đơn</button>
                  </fieldset>
                </form>
              </section>
            )}
          {admin && bill.trang_thai === "HUY" && (
            <section className="card">
              <p>Lý do hủy: {bill.ly_do_huy}</p>
              <button
                className="primary"
                disabled={action.pending}
                onClick={() =>
                  run("lap_thay_the", {}, (r) =>
                    navigate(`${base}/${r.ma_hoa_don}`),
                  )
                }
              >
                Lập bản thay thế
              </button>
            </section>
          )}
          {admin && (
            <section className="card">
              <h2>Lịch sử hóa đơn</h2>
              <ul>
                {bill.history.map((h) => (
                  <li key={h.ma_lich_su_hoa_don}>
                    {h.ngay_tao} · {eventNames[h.su_kien] || h.su_kien} ·{" "}
                    {h.ho_va_ten}
                    {h.ghi_chu && ` · ${h.ghi_chu}`}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
```
