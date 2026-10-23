# Căn chỉnh ô tổng quan và xử lý npm EBUSY trên Windows

Bản cập nhật ngày 23/10/2026 cho nhánh `codex/editorial-business-ui`.

## 1. Thay hai file giao diện

Thay toàn bộ nội dung hai file bên dưới trong dự án đang có trên máy bạn:

1. `frontend/src/features/dashboard/Dashboard.jsx`
2. `frontend/src/styles/residence.css`

Biểu tượng được căn giữa nền 36 × 36 px. Các thẻ cùng hàng có số liệu và chú thích thẳng hàng; nhãn dài được xuống dòng riêng với biểu tượng. Số tiền lớn vẫn hiển thị đủ chữ số. Bố cục dùng bốn cột ở màn hình lớn, hai cột ở màn hình vừa và một cột ở điện thoại.

## 2. Khắc phục lỗi EBUSY tại node_modules/brotli/enc

`EBUSY: resource busy or locked, rmdir ...` có nghĩa Windows chưa cho npm xóa thư mục vì còn tiến trình giữ nó. `npm ci` có bước xóa cây dependency trước khi cài lại, nên dừng ở bước này. Log hiện tại chưa xác định được tiến trình nào đang giữ thư mục.

1. Nhấn **Ctrl+C** trong các terminal đang chạy backend, frontend, test hoặc lệnh npm của dự án; chờ chúng dừng.
2. Lưu các file đang sửa. Đóng cửa sổ Explorer đang mở trong `node_modules`; nếu vẫn khóa, đóng cửa sổ VS Code của dự án và mở **PowerShell riêng**.
3. Chạy tại thư mục gốc dự án:

```powershell
Set-Location "D:\DO_AN\chung-cu-starter-codex-auth-qr-incidents"
npm install --include=dev --workspaces --include-workspace-root --bin-links=true
```

Lệnh `npm install` cài bổ sung tại chỗ, dùng `package-lock.json` hiện có để chọn các phiên bản đã khóa khi khớp `package.json`. Chờ cài thành công rồi mới chạy:

```powershell
npm run build
```

Nếu vẫn gặp `EBUSY`, lưu công việc và khởi động lại Windows; chạy lại lệnh cài ở trên trước khi mở VS Code hoặc khởi động web. Không xóa `package-lock.json`, không cần cài Vite toàn cục và không kết thúc hàng loạt mọi tiến trình Node trên máy.

Sau khi cài xong, mở hai terminal tại gốc dự án để chạy web:

```powershell
# Terminal 1
npm run dev:backend
```

```powershell
# Terminal 2: HTTP trong mạng nội bộ
npm exec -w frontend -- vite --host 0.0.0.0 --port 5173 --strictPort
```

Nếu đang dùng HTTPS để mở camera trên điện thoại, tiếp tục dùng lệnh `npm run dev:frontend:https` cùng cấu hình chứng chỉ đã thiết lập thay cho lệnh HTTP. Chỉ khởi động một frontend trên cổng 5173. Tải lại trình duyệt bằng **Ctrl+F5** sau khi chép file.

## 3. Đã kiểm tra

- Build frontend và kiểm tra file/dependency trong workspace: đạt.
- Trình duyệt Chromium ở 320, 768, 1024, 1440 và 2048 px: icon nằm giữa nền, hàng số liệu/chú thích thẳng nhau, thẻ cùng hàng cao bằng nhau, không tràn ngang.
- Số tiền 18 chữ số, dữ liệu bằng 0, cập nhật số liệu, lỗi API/thử lại, liên kết bằng bàn phím và hiện/ẩn biểu đồ: đạt.
- axe kiểm tra WCAG 2 A/AA, 2.1 A/AA và best practices tại năm kích thước: không phát hiện vi phạm.

Các kiểm tra trình duyệt dùng phản hồi API giả lập, không đọc hoặc sửa database của bạn. Lỗi khóa thư mục trên Windows cần xử lý trên máy bạn; kiểm tra trong workspace Linux không xác nhận được tiến trình Windows đang giữ file.

Ảnh xem trước dùng dữ liệu kiểm thử: [máy tính](can-chinh-tong-quan/desktop.png) · [điện thoại](can-chinh-tong-quan/mobile.png).

## 4. Mã nguồn đầy đủ để sao chép

Mỗi khối sau là toàn bộ nội dung một file, không chứa dấu `...` thay cho code.

### `frontend/src/features/dashboard/Dashboard.jsx`

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
        <span className="metric-title">{title}</span>
        <span className="metric-icon" aria-hidden="true">
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

### `frontend/src/styles/residence.css`

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
  --workspace-header-height: 80px;
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
  top: var(--workspace-header-height);
  height: calc(100dvh - var(--workspace-header-height));
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
.overview-metrics > .overview-metric {
  display: grid;
  grid-template-rows: minmax(40px, auto) 1fr auto;
  align-items: start;
  gap: 16px;
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 24px;
  background: white;
  box-shadow: var(--shadow);
  border-top: 3px solid var(--ink);
}
.overview-metric:hover {
  background: #fafbf6;
  border-color: #a1b16c;
}
.overview-metric > .metric-label {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 36px;
  align-items: center;
  gap: 12px;
  min-height: 40px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}
.overview-metric .metric-title {
  min-width: 0;
  overflow-wrap: anywhere;
}
.overview-metric .metric-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background: var(--brand-soft);
  color: var(--olive);
}
.overview-metric .metric-icon .icon {
  display: block;
  width: 20px;
  height: 20px;
}
.overview-metric > strong {
  min-width: 0;
  margin: 0;
  color: var(--ink);
  font-size: clamp(24px, 2.2vw, 34px);
  line-height: 1.25;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.overview-metric > small {
  min-height: 3em;
  margin-top: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
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
  .overview-metrics > .overview-metric {
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

/* Header và sidebar dùng cùng mốc chiều cao; không để menu chừa khoảng trống sau khi header cuộn đi. */
.brand-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}
.brand-copy strong {
  font: inherit;
  font-weight: 800;
  white-space: nowrap;
}
.brand-copy small {
  display: block;
  line-height: 1.4;
}
@media (min-width: 901px) {
  .is-workspace .topbar {
    position: sticky;
    top: 0;
    z-index: 40;
  }
  .is-workspace .sidebar {
    max-height: calc(100dvh - var(--workspace-header-height));
  }
}
@media (max-width: 900px) {
  .is-workspace .topbar,
  .is-workspace .sidebar {
    position: relative;
    top: auto;
  }
}
```
