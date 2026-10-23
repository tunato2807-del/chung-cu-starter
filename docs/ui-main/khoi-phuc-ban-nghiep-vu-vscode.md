# Khôi phục trang trắng cho bản đầy đủ nghiệp vụ

Lỗi xác nhận từ Console: `App.jsx:21 Cannot read properties of undefined (reading 'filter')`.

Nguyên nhân: App.jsx từ bộ khung main đọc `navigation['Ban quản lý']`, nhưng menu của bản có đăng nhập/QR/hóa đơn dùng `QUAN_TRI_VIEN`, `KY_THUAT_VIEN`, `CU_DAN` và router. Đây là hai cấu trúc khác nhau. Thay thành mảng rỗng chỉ che lỗi, không khôi phục router hay chức năng.

Bộ hướng dẫn tám file của main không phù hợp với bản nghiệp vụ đang chạy trên máy bạn. Dùng hai file bên dưới để khôi phục router và stylesheet đúng bản `codex/auth-qr-incidents`, lấy từ commit `2f00acd26bb4e659121de0ab64d887f523a992aa`. Các API, tài khoản và dữ liệu hiện có giữ theo bản đang cài trên máy bạn.

## Làm ngay trong VS Code

1. Lưu một bản sao hai file hiện tại nếu có chỉnh sửa riêng cần giữ.
2. Thay toàn bộ `frontend/src/app/App.jsx` bằng phần 1 bên dưới.
3. Thay toàn bộ `frontend/src/styles/global.css` bằng phần 2 bên dưới.
4. Giữ `frontend/src/app/navigation.js` của bản nghiệp vụ. File này phải có các nhóm `QUAN_TRI_VIEN`, `KY_THUAT_VIEN`, `CU_DAN` và export `isFunctionActive`. Không chép navigation.js của main vào bản này.
5. Kiểm tra `frontend/src/main.jsx` vẫn import cả `./styles/global.css` và `./styles/professional.css`.
6. Dừng frontend bằng Ctrl+C, rồi khởi động lại như thường dùng. Với địa chỉ hiện tại của bạn:

```powershell
npm exec -w frontend -- vite --host 0.0.0.0 --port 5173 --strictPort
```

Nếu cổng đang chạy, dừng đúng terminal Vite trước khi mở lại. Sau đó mở `http://192.168.1.208:5173/` và nhấn Ctrl+Shift+R. Tiếp tục dùng HTTPS như cấu hình sẵn khi cần camera trong trang web; lệnh trên chỉ là ví dụ HTTP giống địa chỉ báo lỗi.

Không chạy seed hoặc migration để sửa lỗi này. Nguyên nhân ở frontend.

Nếu bạn đã chép cả main.jsx, navigation.js hoặc professional.css từ phiên bản khác, đối chiếu và khôi phục từ những liên kết đúng bản sau:

- [main.jsx](https://github.com/tunato2807-del/chung-cu-starter/blob/2f00acd26bb4e659121de0ab64d887f523a992aa/frontend/src/main.jsx)
- [navigation.js](https://github.com/tunato2807-del/chung-cu-starter/blob/2f00acd26bb4e659121de0ab64d887f523a992aa/frontend/src/app/navigation.js)
- [professional.css](https://github.com/tunato2807-del/chung-cu-starter/blob/2f00acd26bb4e659121de0ab64d887f523a992aa/frontend/src/styles/professional.css)
- [App.jsx](https://github.com/tunato2807-del/chung-cu-starter/blob/2f00acd26bb4e659121de0ab64d887f523a992aa/frontend/src/app/App.jsx)
- [global.css](https://github.com/tunato2807-del/chung-cu-starter/blob/2f00acd26bb4e659121de0ab64d887f523a992aa/frontend/src/styles/global.css)

Mở file GitHub, bấm Raw hoặc biểu tượng Copy để chép toàn bộ mã. Không dùng file của main để thay vào bản nghiệp vụ.

Các file thêm riêng cho bản xem trước như Sidebar.jsx, pageDetails.js, shared/components/Icon.jsx và PageDirectory.jsx không được App.jsx nghiệp vụ này import; không cần xóa chúng để khôi phục.

## 1. frontend/src/app/App.jsx

Thay toàn bộ nội dung. File này khôi phục BrowserRouter, AuthProvider, Layout và các route nghiệp vụ hiện có.

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
  Portal,
  Scanner,
  SubmitReport,
  LookupReport,
} from "../features/incidents/PublicReports.jsx";
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

## 2. frontend/src/styles/global.css

Thay toàn bộ nội dung. Giữ professional.css của bản nghiệp vụ và import nó sau global.css trong main.jsx.

```css
:root {
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  color: #183c3b;
  background: #f2f5f3;
  line-height: 1.6;
  font-synthesis: none;
  font-weight: 400;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
}
a {
  color: #14635a;
  text-underline-offset: 3px;
}
button,
input,
textarea,
select {
  font: inherit;
}
button,
.button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 9px 16px;
  border: 1px solid #b7c9c3;
  border-radius: 8px;
  background: white;
  color: #224b44;
  cursor: pointer;
  text-decoration: none;
  font-weight: 600;
  line-height: 1.4;
}
button:hover,
.button:hover {
  background: #edf5f0;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.primary {
  background: #14635a;
  color: white;
  border-color: #14635a;
}
.primary:hover {
  background: #0a4c45;
}
.danger {
  color: #a33e30;
  background: #fff5f1;
  border-color: #dfb4a9;
}
:focus-visible {
  outline: 3px solid #d99b27;
  outline-offset: 3px;
}
input,
select,
textarea {
  width: 100%;
  padding: 10px 12px;
  min-height: 44px;
  border: 1px solid #b6c6c0;
  border-radius: 6px;
  color: #183c3b;
  background: #fff;
  max-width: 100%;
}
textarea {
  resize: vertical;
}
input[type="checkbox"] {
  width: 20px;
  min-height: 20px;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 4vw;
  border-bottom: 1px solid #dce5df;
  background: white;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  text-decoration: none;
  line-height: 1.4;
}
.brand-icon {
  background: #14635a;
  color: white;
  border-radius: 10px;
  padding: 10px;
  font-size: 18px;
}
.brand small {
  display: block;
  letter-spacing: 1.7px;
  font-size: 9px;
  color: #627c73;
}
.top-links {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
}
.top-links > a {
  text-decoration: none;
}
.workspace {
  display: grid;
  grid-template-columns: 225px minmax(0, 1fr);
  min-height: 80vh;
  max-width: 1600px;
  margin: auto;
}
.sidebar {
  padding: 30px 18px;
  border-right: 1px solid #dce5df;
  background: #fff;
}
.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.sidebar nav a {
  display: block;
  padding: 12px 14px;
  border-radius: 7px;
  text-decoration: none;
  color: #47645b;
}
.sidebar nav a.active {
  background: #e3f0e8;
  color: #13584a;
  font-weight: 700;
}
.public-link {
  display: block;
  margin: 30px 14px;
}
.workspace main {
  padding: 32px;
  min-width: 0;
}
.public-space {
  max-width: 1120px;
  margin: auto;
  padding: 40px 24px;
  min-height: 76vh;
}
h1 {
  font-size: 30px;
  line-height: 1.25;
  margin: 5px 0 24px;
  letter-spacing: -0.7px;
}
h2 {
  font-size: 19px;
  line-height: 1.4;
  margin: 0 0 16px;
}
h3 {
  font-size: 15px;
  margin: 24px 0 12px;
}
p {
  margin: 8px 0 18px;
}
small {
  font-size: 12px;
}
.eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.4px;
  color: #648379;
  margin-bottom: 8px;
}
.card {
  border: 1px solid #dbe5de;
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px #294d3a04;
}
.narrow {
  max-width: 650px;
  margin: 0 auto 24px;
}
.muted,
.note {
  color: #637b72;
}
.note {
  font-size: 13px;
  margin: 24px 0;
}
.hero {
  padding: 35px 0 50px;
  max-width: 800px;
}
.hero h1 {
  font-size: clamp(36px, 5vw, 56px);
  line-height: 1.15;
  letter-spacing: -1.5px;
  margin: 18px 0 24px;
}
.hero p:not(.eyebrow) {
  max-width: 610px;
  color: #60776f;
  font-size: 18px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.hero .actions {
  margin-top: 30px;
}
.three-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.step {
  display: block;
  color: #93aa9f;
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 24px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
  font-size: 14px;
}
.card fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
.field > span,
.field > label {
  font-weight: 600;
}
.field small {
  color: #6d7e77;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.full {
  width: 100%;
  margin-top: 20px;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 18px 0;
}
.error {
  padding: 12px 14px;
  background: #fff2ed;
  color: #9a3428;
  border: 1px solid #efc4b8;
  border-radius: 8px;
  font-size: 14px;
  margin: 15px 0;
  overflow-wrap: anywhere;
}
.error ul {
  padding-left: 20px;
  margin-bottom: 0;
}
.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.page-heading h1,
.page-heading h2 {
  margin-bottom: 0;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin: 28px 0;
}
.stat {
  text-decoration: none;
  color: inherit;
}
.stat span {
  font-size: 13px;
  color: #637b72;
}
.stat strong {
  display: block;
  font-size: 40px;
  font-weight: 650;
  line-height: 1.6;
}
.stat small {
  color: #14635a;
}
.table-wrap {
  overflow: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}
th {
  font-size: 11px;
  color: #698176;
  background: #f5f8f5;
  font-weight: 600;
  white-space: nowrap;
}
th,
td {
  padding: 14px 12px;
  border-bottom: 1px solid #edf1ed;
}
td:first-child {
  min-width: 220px;
}
td a {
  font-weight: 650;
  text-decoration: none;
}
td small {
  display: block;
  color: #71857c;
  margin-top: 5px;
}
td:last-child {
  white-space: nowrap;
  color: #698176;
}
.badge {
  display: inline-block;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  background: #edf1ef;
  color: #52665b;
}
.status-MOI {
  background: #e6efff;
  color: #365c9b;
}
.status-DA_PHAN_CONG {
  background: #e8e7ff;
  color: #5c519b;
}
.status-DANG_XU_LY {
  background: #fff1d9;
  color: #9a6c18;
}
.status-DA_XU_LY {
  background: #e4f3f5;
  color: #2c737e;
}
.status-DA_DONG {
  background: #e3f3e8;
  color: #2c7351;
}
.status-TU_CHOI {
  background: #f9e8e2;
  color: #ad5244;
}
.filters {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 8px;
}
.pagination {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  margin-top: 20px;
}
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(280px, 1fr);
  gap: 24px;
}
.action-panel {
  align-self: start;
}
.tags {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #667e73;
  margin-bottom: 20px;
}
.metadata {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 8px;
  font-size: 13px;
  border-top: 1px solid #e3eae4;
  padding-top: 20px;
}
.metadata dt {
  color: #74897f;
}
.metadata dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.pre-wrap {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.image-grid img {
  width: 120px;
  height: 110px;
  object-fit: cover;
  border-radius: 7px;
  border: 1px solid #dce6de;
  max-width: 100%;
}
.timeline {
  list-style: none;
  padding: 0 0 0 18px;
  border-left: 2px solid #e0e9e1;
  margin-left: 5px;
}
.timeline li {
  position: relative;
  padding: 0 0 26px;
}
.timeline li:before {
  content: "";
  position: absolute;
  left: -25px;
  top: 7px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #73a38c;
  border: 2px solid white;
}
.timeline li > div {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.timeline time {
  font-size: 11px;
  color: #75877e;
}
.timeline p {
  font-size: 13px;
  margin: 8px 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.timeline small {
  color: #75877e;
}
.location-list {
  list-style: none;
  padding: 0;
}
.location-list li {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 6px;
  border-top: 1px solid #e3ebe4;
  padding: 18px 0;
}
.location-list small {
  color: #71857c;
}
.location-list button {
  font-size: 12px;
  padding: 7px 10px;
}
.qr-print {
  text-align: center;
}
.qr-image {
  max-width: 100%;
  width: 280px;
  aspect-ratio: 1;
}
.qr-url {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.qr-print .actions {
  justify-content: center;
}
.qr-print .muted {
  font-size: 12px;
  margin-top: 24px;
}
.decision {
  border-top: 1px solid #e0e8e1;
  margin-top: 22px;
}
.empty {
  padding: 32px;
  text-align: center;
  color: #71857c;
}
.back {
  display: inline-block;
  font-size: 13px;
  margin-bottom: 20px;
}
.lookup-result {
  border-top: 1px solid #e0e8e1;
  margin-top: 26px;
  padding-top: 24px;
}
.lookup-result .timeline {
  margin-top: 24px;
}
hr {
  border: 0;
  border-top: 1px solid #dce5df;
  margin: 25px 0;
}
#qr-reader {
  margin-bottom: 20px;
  overflow: hidden;
}
footer {
  font-size: 11px;
  text-align: center;
  color: #7c9085;
  border-top: 1px solid #dce5df;
  padding: 24px;
}
/* Invoice quantities use Vietnamese separators and align with their prices. */
.bill-lines th:nth-child(2),
.bill-lines th:nth-child(4),
.bill-lines th:nth-child(5),
.bill-number {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.bill-lines .bill-line-total {
  color: #183c3b;
  font-weight: 600;
}
.bill-total {
  margin: 0;
  padding-top: 22px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.bank-picker {
  padding: 18px;
  margin-bottom: 18px;
  border: 1px solid #dce8e2;
  border-radius: 10px;
  background: #f7faf8;
}
.bank-picker select {
  text-overflow: ellipsis;
}
.bank-selection {
  margin: 0;
  font-size: 13px;
  color: #47645b;
}
.bill-publish > .muted {
  font-size: 14px;
  margin-bottom: 24px;
}
.payment-card {
  padding: 0;
  overflow: hidden;
}
.payment-header {
  padding: 28px 24px 24px;
  text-align: center;
  border-bottom: 1px solid #dce8e2;
  background: linear-gradient(135deg, #f2f8f4, #eaf4ef);
}
.payment-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  background: #fff5da;
  color: #805800;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 14px;
}
.payment-header h2 {
  font-size: 24px;
  margin-bottom: 8px;
}
.payment-header p {
  color: #537168;
  margin: 0;
  font-size: 14px;
}
.payment-body {
  max-width: 720px;
  margin: 0 auto;
  padding: 28px 24px;
  text-align: center;
}
.payment-amount-label {
  margin: 0 0 4px;
  color: #637b72;
  font-size: 13px;
}
.payment-amount {
  margin: 0 0 24px;
  font-size: clamp(26px, 4vw, 36px);
  font-weight: 750;
  line-height: 1.3;
  color: #13584a;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.payment-qr-frame {
  width: min(340px, 100%);
  margin: 0 auto;
  padding: 16px;
  border: 1px solid #d4e1d9;
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 24px #1a4d3a0a;
}
.payment-qr-brand {
  display: block;
  font-size: 18px;
  letter-spacing: 2px;
  font-weight: 800;
  color: #164e57;
}
.payment-qr-frame img {
  display: block;
  width: 100%;
  max-width: 320px;
  height: auto;
  aspect-ratio: 1;
  margin: 8px auto;
}
.payment-qr-caption {
  display: block;
  font-size: 12px;
  color: #637b72;
}
.payment-details {
  margin: 28px auto 20px;
  max-width: 560px;
  text-align: left;
  font-size: 14px;
}
.payment-details > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #edf1ed;
}
.payment-details dt {
  color: #637b72;
}
.payment-details dd {
  margin: 0;
  text-align: right;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.payment-account {
  font-size: 17px;
  letter-spacing: 0.4px;
  font-variant-numeric: tabular-nums;
}
.payment-details .payment-reference {
  margin-top: 6px;
  padding: 14px 12px;
  border: 1px solid #d8e6dd;
  border-radius: 8px;
  background: #f2f8f4;
}
.payment-download {
  min-width: 180px;
}
.payment-notice {
  max-width: 500px;
  margin: 20px auto 0;
  font-size: 13px;
  color: #637b72;
}
@media (max-width: 1000px) {
  .workspace {
    grid-template-columns: 185px minmax(0, 1fr);
  }
  .workspace main {
    padding: 24px 20px;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 650px) {
  .topbar {
    padding: 12px 16px;
    align-items: start;
  }
  .brand {
    font-size: 12px;
    gap: 8px;
  }
  .brand-icon {
    padding: 8px;
    font-size: 13px;
  }
  .top-links {
    gap: 8px;
    flex-wrap: wrap;
    justify-content: end;
    font-size: 12px;
    max-width: 55%;
  }
  .top-links .button,
  .top-links button {
    font-size: 11px;
    padding: 8px;
  }
  .workspace {
    display: block;
  }
  .sidebar {
    padding: 12px 16px;
    border-right: 0;
    border-bottom: 1px solid #dce5df;
  }
  .sidebar .eyebrow {
    display: none;
  }
  .sidebar nav {
    flex-direction: row;
    overflow: auto;
  }
  .sidebar nav a {
    font-size: 12px;
    white-space: nowrap;
    padding: 10px;
  }
  .public-link {
    display: none;
  }
  .workspace main {
    padding: 24px 16px;
  }
  .public-space {
    padding: 28px 16px;
  }
  .three-columns {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .hero {
    padding-top: 10px;
  }
  .card {
    padding: 20px;
  }
  .payment-card {
    padding: 0;
  }
  .payment-body {
    padding: 24px 18px;
  }
  .payment-header {
    padding: 24px 18px 20px;
  }
  .payment-header h2 {
    font-size: 21px;
  }
  .payment-details {
    font-size: 13px;
  }
  .payment-details > div {
    gap: 10px;
  }
  .bank-picker {
    padding: 14px;
  }
  .filters {
    grid-template-columns: 1fr;
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .page-heading {
    align-items: start;
    flex-direction: column;
  }
  h1 {
    font-size: 25px;
  }
  .stats {
    gap: 10px;
  }
  .stat {
    padding: 16px;
  }
  .stat strong {
    font-size: 32px;
  }
  .metadata {
    grid-template-columns: 115px 1fr;
  }
  .pagination {
    flex-wrap: wrap;
  }
  .pagination span {
    order: 3;
    width: 100%;
    text-align: center;
  }
  .image-grid img {
    width: 100px;
    height: 90px;
  }
}
@media print {
  body {
    background: white;
  }
  .topbar,
  .sidebar,
  footer,
  .no-print,
  .page-heading {
    display: none !important;
  }
  .workspace,
  .detail-grid {
    display: block;
  }
  .workspace main {
    padding: 0;
  }
  .qr-print {
    border: 0;
    box-shadow: none;
    margin: 0;
  }
  .qr-print .muted {
    display: none;
  }
}

.notification-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  padding: 0.1rem 0.4rem;
  margin-left: 0.5rem;
  border-radius: 1rem;
  background: #a33225;
  color: #fff;
  font-size: 0.8rem;
}
.notification-item {
  padding: 1.4rem 1rem;
  border-bottom: 1px solid #dce7e4;
  border-left: 4px solid transparent;
  overflow-wrap: anywhere;
}
.notification-item.is-unread {
  background: #f0f8f5;
  border-left-color: #16665c;
}
.notification-item h2 {
  margin: 0.7rem 0;
  font-size: 1.15rem;
}
.notification-item p {
  color: #55736e;
  margin-bottom: 0;
  white-space: pre-line;
}
.notification-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 1rem;
  color: #55736e;
  font-size: 0.85rem;
}
.notification-priority {
  border-radius: 0.4rem;
  padding: 0.2rem 0.5rem;
  background: #edf3f1;
}
.priority-QUAN_TRONG {
  color: #8a3c12;
  background: #fff0d8;
  font-weight: 700;
}
.notification-detail h1 {
  overflow-wrap: anywhere;
}
.notification-body {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.8;
  margin: 1.5rem 0;
}
.notification-bill {
  padding: 1.2rem;
  border: 1px solid #dce7e4;
  border-radius: 0.8rem;
  background: #f5f9f7;
}

.finance-filters {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: end;
  margin-bottom: 1rem;
}
.finance-filters .field {
  margin-bottom: 0;
}
.finance-filters > button {
  align-self: end;
  min-height: 44px;
}
@media (max-width: 1150px) {
  .finance-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .finance-filters {
    grid-template-columns: minmax(0, 1fr);
  }
}

.finance-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1rem;
}
.finance-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}
.finance-metric {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.6rem;
  padding: 1.2rem;
  border: 1px solid #dce5df;
  border-radius: 0.8rem;
  background: white;
  text-align: left;
  min-width: 0;
  overflow-wrap: anywhere;
}
.finance-metric strong {
  font-size: clamp(1.15rem, 1.7vw, 1.65rem);
  letter-spacing: -0.02em;
  line-height: 1.4;
}
.finance-metric-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #47645b;
}
.finance-metric small {
  font-weight: 400;
  color: #627c73;
}
.finance-metric.is-paid {
  border-top: 4px solid #14635a;
}
.finance-metric.is-overdue {
  border-top: 4px solid #ad3f2b;
}
.finance-metric.is-overdue strong,
.finance-overdue {
  color: #a33225;
  font-weight: 700;
}
.finance-progress {
  padding: 1rem 1.2rem;
  border-radius: 0.6rem;
  background: #e7f0eb;
}
.finance-progress > div {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.9rem;
}
.finance-progress progress {
  width: 100%;
  height: 0.6rem;
  accent-color: #14635a;
}
.finance-snapshot {
  font-size: 0.8rem;
  color: #627c73;
}
.finance-results th {
  white-space: nowrap;
}
.finance-results td {
  vertical-align: top;
}
.finance-number {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.finance-contact {
  display: block;
  color: #627c73;
}
.finance-pager {
  margin-top: 1rem;
}
.finance-empty {
  text-align: center;
  color: #627c73;
  padding: 1rem;
}
.finance-metrics-cash {
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
}
.finance-date-range {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.6rem;
  padding: 1.2rem;
  border: 1px solid #dce5df;
  border-radius: 0.8rem;
}
.finance-date-range small {
  color: #627c73;
}
@media (max-width: 1150px) {
  .finance-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .finance-metrics,
  .finance-metrics-cash {
    grid-template-columns: minmax(0, 1fr);
  }
  .finance-results {
    padding: 1rem;
  }
  .finance-metric strong {
    font-size: 1.5rem;
  }
}

.maintenance-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.maintenance-stats .card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.maintenance-stats strong {
  font-size: 1.8rem;
}
.maintenance-overdue {
  color: #a33225;
}
.maintenance-tag {
  display: inline-block;
  padding: 0.25rem 0.55rem;
  border-radius: 0.4rem;
  background: #edf3f1;
  color: #47645b;
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0.2rem;
}
.due-QUA_HAN,
.work-HUY {
  background: #fff0ea;
  color: #a33225;
}
.due-SAP_DEN_HAN,
.work-CHO_NGHIEM_THU {
  background: #fff2d9;
  color: #8a5416;
}
.work-HOAN_THANH {
  background: #e3f3e8;
  color: #225e46;
}
.work-DANG_THUC_HIEN {
  background: #e7effb;
  color: #275384;
}
.maintenance-subtitle {
  display: block;
  color: #627c73;
  margin-top: 0.4rem;
}
.maintenance-info {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 2rem;
  margin: 0 0 1.4rem;
}
.maintenance-info dt {
  color: #627c73;
  font-size: 0.85rem;
}
.maintenance-info dd {
  margin: 0.3rem 0 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.maintenance-text,
.maintenance-history p {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.maintenance-staff {
  padding: 1rem;
  border: 1px solid #dce5df;
  border-radius: 0.6rem;
  margin-bottom: 1.2rem;
  background: #f8faf9;
}
.maintenance-staff .actions {
  font-size: 0.85rem;
}
.maintenance-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.maintenance-action-grid .card {
  min-width: 0;
}
.maintenance-history {
  padding-left: 1.2rem;
}
.maintenance-history li {
  padding: 0 0 1rem 0.4rem;
  border-bottom: 1px solid #e4ebe7;
  margin-bottom: 1rem;
}
.maintenance-history li div {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  justify-content: space-between;
}
.maintenance-history time {
  color: #627c73;
  font-size: 0.8rem;
}
@media (max-width: 700px) {
  .maintenance-stats,
  .maintenance-info,
  .maintenance-action-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.amenity-cards,
.amenity-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
}
.amenity-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}
.amenity-card h2 {
  margin-bottom: 0;
  overflow-wrap: anywhere;
}
.amenity-description {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  flex: 1;
}
.amenity-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  color: #627c73;
}
.amenity-open,
.amenity-status {
  display: inline-block;
  padding: 0.3rem 0.7rem;
  border-radius: 2rem;
  font-size: 0.8rem;
  font-weight: 600;
  background: #e3f3e8;
  color: #225e46;
}
.amenity-paused,
.amenity-TU_CHOI,
.amenity-DA_HUY {
  background: #fff0ea;
  color: #a33225;
}
.amenity-CHO_DUYET {
  background: #fff2d9;
  color: #8a5416;
}
.amenity-hero {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 1rem;
}
.amenity-hero h1 {
  overflow-wrap: anywhere;
}
.amenity-hero-meta {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.4rem;
  border-radius: 0.8rem;
  background: #f2f6f4;
}
.amenity-hero-meta strong {
  font-size: 1.7rem;
}
.amenity-hero .amenity-text {
  grid-column: 1 / -1;
}
.amenity-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.amenity-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 1.2rem;
}
.amenity-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}
.amenity-filters .field {
  flex: 1 1 180px;
  margin-bottom: 0;
}
.amenity-calendar-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
}
.amenity-calendar-toolbar .field {
  margin-bottom: 0;
  flex: 1 1 200px;
}
.amenity-slots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
  gap: 0.7rem;
}
.amenity-slots button {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.8rem;
  background: #edf7f0;
  color: #225e46;
  border-color: #bdd6c6;
}
.amenity-slots button small {
  font-weight: 400;
}
.amenity-slots button.amenity-slot-booked {
  background: #fff2d9;
  color: #8a5416;
  border-color: #e4d2ad;
  opacity: 1;
}
.amenity-slots button:disabled:not(.amenity-slot-booked) {
  background: #f0f2f1;
  color: #68756e;
  border-color: #dce3de;
}
.amenity-booking-form {
  max-width: none;
}
.amenity-booking-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.amenity-booking-summary > div {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1.2rem;
  border-radius: 0.8rem;
  background: #f2f6f4;
}
.amenity-booking-summary strong {
  font-size: 1.6rem;
}
.amenity-booking-summary span {
  overflow-wrap: anywhere;
}
.amenity-subtitle,
.amenity-history small {
  display: block;
  color: #627c73;
}
.amenity-history {
  padding-left: 1.3rem;
}
.amenity-history li {
  padding: 0 0 1rem 0.3rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e4ebe7;
}
@media (max-width: 700px) {
  .amenity-cards,
  .amenity-action-grid,
  .amenity-form-grid,
  .amenity-hero,
  .amenity-booking-summary {
    grid-template-columns: minmax(0, 1fr);
  }
  .amenity-filters > button {
    width: 100%;
  }
  .amenity-slots {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .amenity-slots button {
    font-size: 0.8rem;
    padding: 0.6rem 0.3rem;
  }
}
.amenity-slots button.amenity-slot-selected {
  background: #14635a;
  color: white;
  border-color: #14635a;
  box-shadow: 0 0 0 2px #b7d9ca;
}

.treasury-funds,
.treasury-form-grid,
.treasury-action-grid,
.treasury-voucher-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.2rem;
}
.treasury-funds > .card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}
.treasury-funds h2 {
  overflow-wrap: anywhere;
}
.treasury-funds p {
  flex: 1;
}
.treasury-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.treasury-tag {
  display: inline-block;
  padding: 0.3rem 0.7rem;
  border-radius: 2rem;
  background: #e3f3e8;
  color: #225e46;
  font-weight: 600;
  font-size: 0.8rem;
}
.treasury-NHAP {
  background: #fff2d9;
  color: #8a5416;
}
.treasury-HUY,
.treasury-closed {
  background: #fff0ea;
  color: #a33225;
}
.treasury-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}
.treasury-filters .field {
  flex: 1 1 180px;
  margin-bottom: 0;
}
.treasury-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}
.treasury-metrics .card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
}
.treasury-metrics strong {
  font-size: 1.5rem;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}
.treasury-subtitle,
.treasury-history small {
  display: block;
  color: #627c73;
}
.treasury-money {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.treasury-voucher-summary > div {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1.3rem;
  background: #f2f6f4;
  border-radius: 0.8rem;
  overflow-wrap: anywhere;
}
.treasury-voucher-summary strong {
  font-size: 1.7rem;
}
.treasury-history {
  padding-left: 1.3rem;
}
.treasury-history li {
  padding: 0 0 1rem 0.3rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e4ebe7;
}
.treasury-proofs {
  padding-left: 1.3rem;
}
.treasury-proofs li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 1rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid #e4ebe7;
}
.treasury-proofs a {
  overflow-wrap: anywhere;
}
@media (max-width: 1100px) {
  .treasury-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 700px) {
  .treasury-funds,
  .treasury-form-grid,
  .treasury-action-grid,
  .treasury-voucher-summary,
  .treasury-metrics {
    grid-template-columns: minmax(0, 1fr);
  }
  .treasury-filters > button {
    width: 100%;
  }
}

.report-export {
  margin: 1rem 0 1.5rem;
}
.report-export small {
  color: #627c73;
}
.report-export .note {
  margin: 0.6rem 0;
}
@media (max-width: 600px) {
  .report-export small {
    flex-basis: 100%;
  }
}
/* Data exchange shares the active list filters and keeps previews inside the card. */
.data-tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 16px 0;
}
.data-tools .report-export {
  margin: 0;
  flex: 1 1 360px;
  min-width: 0;
}
.data-import {
  margin-top: 20px;
  min-width: 0;
}
.import-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 32px;
  padding-left: 22px;
  color: #14635a;
}
.import-help {
  margin: 20px 0;
  padding: 16px;
  background: #f2f6f4;
  border-radius: 12px;
}
.import-help summary {
  cursor: pointer;
  font-weight: 700;
}
.import-preview {
  margin-top: 24px;
  border-top: 1px solid #dce5df;
  padding-top: 16px;
}
.import-preview .table-wrap {
  max-height: 520px;
  margin: 16px 0;
}
.import-row-error {
  color: #aa3424;
  min-width: 240px;
}
.import-result {
  padding: 20px;
  margin-top: 24px;
  background: #e4f2e9;
  border: 1px solid #bdd8c7;
  border-radius: 12px;
  overflow-wrap: anywhere;
}
.data-import input[type="file"] {
  max-width: 100%;
}
.resident-code {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.resident-code code {
  padding: 4px 10px;
  background: #e4f2e9;
  border-radius: 6px;
  color: #14635a;
  font-size: 1rem;
  font-weight: 700;
}
.resident-code small {
  flex-basis: 100%;
  color: #41675b;
}

```
