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
