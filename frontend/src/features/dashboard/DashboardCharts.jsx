import React, { useEffect, useState } from "react";
import { getJson } from "../../shared/api/client.js";
import { ErrorBox, Field, Loading } from "../../shared/ui.jsx";
import "./DashboardCharts.css";

const money = (v) => `${BigInt(v).toLocaleString("vi-VN")} đ`;
const number = (v) => BigInt(v).toLocaleString("vi-VN");
const day = (s) => s.split("-").reverse().join("/");
const localDay = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const periods = {
  NGAY: "Ngày",
  TUAN: "Tuần",
  THANG: "Tháng",
  QUY: "Quý",
  NAM: "Năm",
};
const colors = ["#16776c", "#c16a25", "#4778b2", "#915697"];
const config = [
  {
    id: "finance",
    title: "Thu phí và hạn công nợ",
    unit: "đồng",
    monetary: true,
    note: "Đã thu theo ngày xác nhận. Còn nợ theo hạn trả của hóa đơn hiện chưa thanh toán; không phải số dư công nợ lịch sử. Hóa đơn chưa đặt hạn không nằm trong biểu đồ.",
    series: [
      ["da_thu", "Đã thu"],
      ["con_no", "Còn nợ theo hạn trả"],
    ],
  },
  {
    id: "incidents",
    title: "Tiếp nhận và đóng phản ánh",
    unit: "phản ánh",
    note: "Tiếp nhận theo thời điểm gửi; đóng theo thời điểm nghiệm thu đóng hồ sơ. Hai số có thể thuộc các hồ sơ khác nhau.",
    series: [
      ["tiep_nhan", "Tiếp nhận"],
      ["da_dong", "Đã đóng"],
    ],
  },
  {
    id: "maintenance",
    title: "Lập và nghiệm thu bảo trì",
    unit: "phiếu",
    note: "Lập phiếu theo ngày lập nghiệp vụ, bỏ phiếu đã hủy. Nghiệm thu theo thời điểm hoàn thành; không phải số phiếu tồn tại cuối kỳ.",
    series: [
      ["lap_moi", "Phiếu lập"],
      ["nghiem_thu", "Nghiệm thu"],
    ],
  },
  {
    id: "bookings",
    title: "Lượt đặt tiện ích",
    unit: "lượt",
    note: "Theo giờ/ngày bắt đầu sử dụng và trạng thái hiện tại. Bao gồm lịch sắp tới trong kỳ đã chọn; lịch hủy/từ chối được tách riêng.",
    series: [
      ["da_duyet", "Đã duyệt"],
      ["cho_duyet", "Chờ duyệt"],
      ["da_huy", "Đã hủy"],
      ["tu_choi", "Từ chối"],
    ],
  },
];

function Chart({ data, definition }) {
  const [selected, setSelected] = useState(0);
  const { title, note, monetary, unit, id } = definition;
  const series = definition.series.filter(
    ([key]) => data.don_vi !== "GIO" || !["con_no", "lap_moi"].includes(key),
  );
  const points = data.diem,
    current = points[Math.min(selected, points.length - 1)];
  const display = monetary ? money : number;
  const max = points.reduce(
    (largest, p) =>
      series.reduce(
        (m, [key]) => (BigInt(p[key]) > m ? BigInt(p[key]) : m),
        largest,
      ),
    0n,
  );
  const width = Math.max(520, points.length * 30 + 74),
    height = 224,
    left = 66,
    top = 20,
    plotHeight = 156;
  const step = (width - left - 12) / points.length,
    barWidth = Math.min(14, (step - 7) / series.length);
  const compact = (v) =>
    new Intl.NumberFormat("vi-VN", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(v);
  const fullLabel = (p) =>
    data.don_vi === "GIO"
      ? `${day(p.moc.slice(0, 10))} ${p.nhan}`
      : data.don_vi === "THANG"
        ? `Tháng ${p.moc.slice(5)}/${p.moc.slice(0, 4)}`
        : day(p.moc);
  function move(event, index) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? points.length - 1
          : Math.max(
              0,
              Math.min(
                points.length - 1,
                index + (event.key === "ArrowRight" ? 1 : -1),
              ),
            );
    event.currentTarget.parentNode.children[next].focus();
  }
  return (
    <section className="card trend-card" aria-labelledby={`trend-${id}`}>
      <h3 id={`trend-${id}`}>{title}</h3>
      <div className="trend-totals">
        {definition.series.map(([key, label], i) => (
          <div key={key}>
            <span>
              <i style={{ background: colors[i] }} />
              {label}
            </span>
            <strong>{display(data.tong[key])}</strong>
          </div>
        ))}
      </div>
      <p className="trend-explanation">{note}</p>
      {data.don_vi === "GIO" && ["finance", "maintenance"].includes(id) && (
        <p className="trend-explanation">
          {id === "finance"
            ? "Hạn trả chỉ có ngày nên số còn nợ hiển thị ở tổng ngày, không chia giả theo giờ."
            : "Ngày lập phiếu không có giờ nên số phiếu lập hiển thị ở tổng ngày; biểu đồ giờ thể hiện nghiệm thu."}
        </p>
      )}
      <div className="trend-legend" aria-label={`Chú thích ${title}`}>
        {series.map(([key, label]) => (
          <span key={key}>
            <i
              style={{
                background:
                  colors[definition.series.findIndex(([k]) => k === key)],
              }}
            />
            {label}
          </span>
        ))}
      </div>
      <p className="trend-unit">
        Đơn vị: {unit} ·{" "}
        {data.don_vi === "GIO"
          ? "Theo giờ"
          : data.don_vi === "THANG"
            ? "Theo tháng"
            : "Theo ngày"}
      </p>
      {max === 0n && (
        <p className="trend-empty">
          Chưa có dữ liệu cho các chuỗi biểu đồ trong khoảng này.
        </p>
      )}
      <div
        className="trend-scroll"
        role="region"
        aria-label={`Biểu đồ ${title}, có thể cuộn ngang`}
        tabIndex={0}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ minWidth: width }}
          aria-labelledby={`trend-${id}`}
        >
          {[0, 1, 2].map((n) => (
            <g key={n}>
              <line
                x1={left}
                y1={top + (n * plotHeight) / 2}
                x2={width - 12}
                y2={top + (n * plotHeight) / 2}
                stroke="#dee8e3"
              />
              <text
                x={left - 8}
                y={top + (n * plotHeight) / 2 + 4}
                textAnchor="end"
                className="trend-axis"
              >
                {compact((max * BigInt(2 - n)) / 2n)}
              </text>
            </g>
          ))}
          <g>
            {points.map((p, index) => (
              <g
                key={p.moc}
                role="button"
                tabIndex={0}
                aria-label={`${fullLabel(p)}: ${series.map(([key, label]) => `${label} ${display(p[key])}`).join(", ")}`}
                onFocus={() => setSelected(index)}
                onMouseEnter={() => setSelected(index)}
                onClick={() => setSelected(index)}
                onKeyDown={(e) => {
                  if (["Enter", " "].includes(e.key)) {
                    e.preventDefault();
                    setSelected(index);
                  } else move(e, index);
                }}
              >
                <rect
                  x={left + index * step}
                  y={top}
                  width={step}
                  height={plotHeight}
                  fill={selected === index ? "#edf4f0" : "transparent"}
                />
                {series.map(([key], j) => {
                  const value = BigInt(p[key]),
                    h = max
                      ? Math.max(
                          value ? 1 : 0,
                          (Number((value * 1000000n) / max) / 1000000) *
                            plotHeight,
                        )
                      : 0;
                  return (
                    <rect
                      key={key}
                      x={left + index * step + 4 + j * barWidth}
                      y={top + plotHeight - h}
                      width={barWidth - 1}
                      height={h}
                      rx={2}
                      fill={
                        colors[definition.series.findIndex(([k]) => k === key)]
                      }
                    />
                  );
                })}
                {(points.length <= 12 ||
                  index % 3 === 0 ||
                  index === points.length - 1) && (
                  <text
                    x={left + index * step + step / 2}
                    y={top + plotHeight + 23}
                    textAnchor="middle"
                    className="trend-axis"
                  >
                    {p.nhan}
                  </text>
                )}
              </g>
            ))}
          </g>
        </svg>
      </div>
      <div className="trend-detail" aria-live="polite">
        <strong>{fullLabel(current)}</strong>
        {series.map(([key, label]) => (
          <span key={key}>
            {label}: <b>{display(current[key])}</b>
          </span>
        ))}
      </div>
      <details className="trend-table">
        <summary>Xem bảng số liệu — {title}</summary>
        <div className="table-wrap">
          <table>
            <caption>
              {title} · {data.nhan_khoang} · {unit}
            </caption>
            <thead>
              <tr>
                <th>
                  {data.don_vi === "GIO"
                    ? "Giờ"
                    : data.don_vi === "THANG"
                      ? "Tháng"
                      : "Ngày"}
                </th>
                {series.map(([key, label]) => (
                  <th key={key}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.moc}>
                  <td>{fullLabel(p)}</td>
                  {series.map(([key]) => (
                    <td key={key}>{display(p[key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Tổng</th>
                {series.map(([key]) => (
                  <th key={key}>{display(data.tong[key])}</th>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </details>
    </section>
  );
}

export default function DashboardCharts({ refresh = 0 }) {
  const [period, setPeriod] = useState("THANG"),
    [anchor, setAnchor] = useState(localDay),
    [revision, setRevision] = useState(0),
    [state, setState] = useState({ loading: true });
  const path = `/tong_quan/thong_ke?khoang=${period}&ngay=${anchor}`;
  const requestKey = `${path}:${refresh}:${revision}`;
  useEffect(() => {
    const controller = new AbortController();
    setState({ requestKey, loading: true });
    getJson(path, { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted)
          setState({ requestKey, data, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ requestKey, error, loading: false });
      });
    return () => controller.abort();
  }, [path, requestKey]);
  const resource = state.requestKey === requestKey ? state : { loading: true },
    data = resource.data;
  return (
    <section className="trends" aria-labelledby="trends-title">
      <div className="trends-heading">
        <div>
          <p className="eyebrow">THỐNG KÊ THEO THỜI GIAN</p>
          <h2 id="trends-title">Biểu đồ vận hành</h2>
          <p className="muted">
            Chọn ngày bất kỳ trong kỳ muốn xem. Tuần tính từ thứ Hai đến Chủ
            nhật, theo giờ Việt Nam.
          </p>
        </div>
        <button
          type="button"
          disabled={resource.loading}
          onClick={() => setRevision((n) => n + 1)}
        >
          Cập nhật biểu đồ
        </button>
      </div>
      <div className="trends-filters">
        <Field label="Khoảng thống kê">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {Object.entries(periods).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ngày trong kỳ">
          <input
            type="date"
            min="1900-01-01"
            max="2199-12-31"
            value={anchor}
            onChange={(e) => {
              if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value))
                setAnchor(e.target.value);
            }}
          />
        </Field>
        <button
          type="button"
          onClick={() => {
            setAnchor(localDay());
            setRevision((n) => n + 1);
          }}
        >
          Về kỳ hiện tại
        </button>
      </div>
      <ErrorBox error={resource.error} />
      {resource.loading && <Loading />}
      {data && (
        <>
          <p className="trends-range">
            <strong>{data.nhan_khoang}</strong> · {day(data.tu_ngay)} –{" "}
            {day(data.den_ngay)}
            <br />
            <small>
              Biểu đồ đọc lúc{" "}
              {new Intl.DateTimeFormat("vi-VN", {
                timeZone: "Asia/Ho_Chi_Minh",
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(data.tai_luc.replace(" ", "T") + "Z"))}
              . Bộ lọc này áp dụng cho biểu đồ; các thẻ tổng quan vẫn phản ánh
              số liệu hiện tại.
            </small>
          </p>
          <div className="trends-grid">
            {config.map((definition) => (
              <Chart
                key={`${requestKey}:${definition.id}`}
                data={data}
                definition={definition}
              />
            ))}
          </div>
          <p className="overview-note">
            Chạm hoặc rê chuột lên cột để xem chi tiết; khi chọn cột bằng bàn
            phím, dùng ← → để chuyển mốc. Có thể mở bảng để xem và đối chiếu số
            chính xác.
          </p>
        </>
      )}
    </section>
  );
}
