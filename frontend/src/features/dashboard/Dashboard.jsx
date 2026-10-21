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
          <p className="eyebrow">VẬN HÀNH TÒA NHÀ</p>
          <h1>Tổng quan vận hành</h1>
          <p className="muted">
            Theo dõi khoản cần thu và công việc cần xử lý của ban quản lý.
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
            Nam · Các nhóm số liệu cùng thời điểm đọc.
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
