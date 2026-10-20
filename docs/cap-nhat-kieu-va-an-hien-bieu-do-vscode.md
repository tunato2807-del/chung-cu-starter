# Chọn kiểu và hiện/ẩn biểu đồ — code đầy đủ 2 file cho VS Code

Áp dụng sau bản biểu đồ ngày/tuần/tháng/quý/năm `48962d1` trên nhánh `codex/auth-qr-incidents`. Chỉ thay **hai file frontend** bên dưới, không tải lại ZIP. Không sửa backend, database hoặc cài thư viện mới.

## Giao diện mới

Phần **Biểu đồ vận hành** mặc định thu gọn. Bấm **Hiện biểu đồ** khi cần xem, **Ẩn biểu đồ** khi muốn tập trung vào các công việc bên dưới. Mở ra có mục **Biểu đồ muốn hiển thị**: chọn riêng Thu phí & công nợ, Phản ánh, Bảo trì hoặc Tiện ích; không cần hiện cả bốn.

| Nhóm | Kiểu mặc định | Kiểu có thể chọn |
|---|---|---|
| Thu phí và hạn công nợ | Đường | Đường, cột, miền |
| Tiếp nhận và đóng phản ánh | Cột | Đường, cột, miền |
| Lập và nghiệm thu bảo trì | Miền | Đường, cột, miền |
| Lượt đặt tiện ích | Vòng tròn | Vòng tròn, tròn, đường, cột, miền |

Đổi kiểu tại **Kiểu biểu đồ** trên từng thẻ. Các nhóm chọn độc lập; đổi kiểu không thay số liệu hoặc gọi lại API. Bộ chọn ngày/tuần/tháng/quý/năm và bảng số liệu vẫn có như trước.

**Tròn/vòng tròn** biểu diễn tỷ trọng trạng thái đặt tiện ích trong toàn kỳ: đã duyệt, chờ duyệt, đã hủy, từ chối. Các trạng thái loại trừ nhau nên có thể chia tỷ lệ. Chạm lát hoặc chú thích để xem số lượt và phần trăm. Khi không có lượt, chỉ hiện vòng trống và số 0; khi chỉ có một trạng thái, vẽ đủ vòng 100%.

Các chuỗi tiếp nhận/đóng, lập/nghiệm thu là luồng sự kiện có thể cùng một hồ sơ và khác ngày, không dùng biểu đồ tròn để tránh diễn đạt thành các phần của một tổng. **Miền không cộng dồn**, chỉ chồng màu để so sánh. Bảng vẫn giữ số chính xác theo mốc thời gian, kể cả khi đang xem tròn.

Ứng dụng nhớ hiện/ẩn toàn phần, nhóm được chọn và kiểu từng nhóm **riêng theo tài khoản trong trình duyệt**. Không lưu dữ liệu hóa đơn, phản ánh hoặc thông tin nghiệp vụ vào tùy chọn này. Nếu trình duyệt chặn lưu, các nút vẫn dùng được trong phiên; tải lại sẽ về mặc định. Bộ lọc khoảng/ngày giữ trong phiên mở trang, không lưu thành tùy chọn lâu dài.

Thu gọn hoặc bỏ chọn tất cả nhóm thì không tải API thống kê; yêu cầu đang tải được hủy và kết quả cũ được bỏ. Mở lại tải số mới. Các thẻ Tổng quan và hàng đợi bên dưới vẫn hiển thị như trước.

## Chép vào VS Code

1. Mở thư mục dự án trên máy bạn. Lưu các thay đổi riêng trước khi thay code.
2. Thay **toàn bộ nội dung hai file** dưới đây. Chỉ chép nội dung trong khối code, không chép dấu ba backtick, không nối cuối file.
3. Giữ `Dashboard.jsx`, router và service thống kê của bản trước. Không lấy `DashboardCharts.jsx`/CSS từ hướng dẫn cũ đè lên sau bản này.
4. Vite thường cập nhật ngay sau khi lưu. Nhấn **Ctrl+F5** trình duyệt; nếu cần, khởi động lại frontend bằng lệnh đang dùng, ví dụ:

```powershell
npm run dev:frontend:https
```

Không cần `npm install`, migrate, seed hoặc khởi động lại backend cho riêng thay đổi này. Giữ nguyên `.env`, `.certs`, database và ảnh/chứng từ.

## Thử lại

1. Đăng nhập BQL → Tổng quan. Lần đầu chưa có tùy chọn thì phần biểu đồ thu gọn; công việc nằm ngay bên dưới.
2. Bấm **Hiện biểu đồ**: bốn nhóm có bốn kiểu mặc định khác nhau. Đổi kiểu ở mỗi thẻ, chọn kỳ và mở bảng để đối chiếu số.
3. Bỏ chọn Bảo trì/Tiện ích: chỉ các nhóm còn chọn xuất hiện. Bỏ chọn hết: có hướng dẫn chọn nhóm, không tải biểu đồ và các phần khác vẫn dùng được.
4. Chọn vài nhóm và kiểu, bấm **Ẩn biểu đồ**, tải lại trang: vẫn thu gọn. Bấm hiện lại: giữ nhóm/kiểu đã chọn và tải dữ liệu mới. Tài khoản BQL khác có tùy chọn riêng.
5. Trên điện thoại, chạm lát tròn/chú thích hoặc mốc trên đường/cột để xem chi tiết. Với biểu đồ thời gian, Tab rồi dùng ← → / Home / End; với tròn, dùng Tab chọn lát hoặc nút chú thích. Bảng có thể cuộn ngang bên trong.

## Danh sách file

1. [frontend/src/features/dashboard/DashboardCharts.jsx](../frontend/src/features/dashboard/DashboardCharts.jsx) — thay toàn bộ.
2. [frontend/src/features/dashboard/DashboardCharts.css](../frontend/src/features/dashboard/DashboardCharts.css) — thay toàn bộ.

## Code đầy đủ

### 1. `frontend/src/features/dashboard/DashboardCharts.jsx`

```jsx
import React, { useEffect, useState } from "react";
import { getJson } from "../../shared/api/client.js";
import { ErrorBox, Field, Loading } from "../../shared/ui.jsx";
import { useAuth } from "../auth/Auth.jsx";
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
const timeTypes = { DUONG: "Đường", COT: "Cột", MIEN: "Miền" };
const bookingTypes = { VONG: "Vòng tròn", TRON: "Tròn", ...timeTypes };
const config = [
  {
    id: "finance",
    defaultType: "DUONG",
    short: "Thu phí & công nợ",
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
    defaultType: "COT",
    short: "Phản ánh",
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
    defaultType: "MIEN",
    short: "Bảo trì",
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
    defaultType: "VONG",
    short: "Tiện ích",
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

function readPreferences(key) {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(key));
  } catch {
    /* Storage may be disabled. */
  }
  return {
    expanded: saved?.expanded === true,
    visible: Array.isArray(saved?.visible)
      ? config.filter((c) => saved.visible.includes(c.id)).map((c) => c.id)
      : config.map((c) => c.id),
    types: Object.fromEntries(
      config.map((c) => [
        c.id,
        Object.hasOwn(
          c.id === "bookings" ? bookingTypes : timeTypes,
          saved?.types?.[c.id],
        )
          ? saved.types[c.id]
          : c.defaultType,
      ]),
    ),
  };
}
const ratio = (value, max) =>
  max ? Number((BigInt(value) * 1000000n) / max) / 1000000 : 0;

function Pie({ data, series, type, title, display }) {
  const [selected, setSelected] = useState(() =>
    Math.max(
      0,
      series.findIndex(([key]) => BigInt(data.tong[key]) > 0n),
    ),
  );
  const total = series.reduce((sum, [key]) => sum + BigInt(data.tong[key]), 0n);
  let angle = -Math.PI / 2;
  const point = (a, r) => `${160 + Math.cos(a) * r},${140 + Math.sin(a) * r}`;
  const percent = (v) =>
    `${(ratio(v, total) * 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`;
  const positive = series.filter(([key]) => BigInt(data.tong[key]) > 0n).length;
  const inner = type === "VONG" ? 68 : 0;
  return (
    <>
      <div className="trend-pie-layout">
        <svg
          className="trend-pie"
          viewBox="0 0 320 280"
          aria-label={`${title}, tỷ trọng trạng thái trong kỳ`}
        >
          {!total && (
            <circle
              cx="160"
              cy="140"
              r="100"
              fill="none"
              stroke="#e1e9e5"
              strokeWidth="32"
            />
          )}
          <g>
            {series.map(([key, label], i) => {
              const value = BigInt(data.tong[key]);
              if (!value) return null;
              const start = angle,
                end = angle + ratio(value, total) * Math.PI * 2;
              angle = end;
              const full = positive === 1;
              const outerPath = full
                ? "M160,30 A110,110 0 1 1 160,250 A110,110 0 1 1 160,30"
                : `M${point(start, 110)} A110,110 0 ${end - start > Math.PI ? 1 : 0} 1 ${point(end, 110)}`;
              const d = full
                ? `${outerPath} Z ${inner ? `M160,${140 - inner} A${inner},${inner} 0 1 0 160,${140 + inner} A${inner},${inner} 0 1 0 160,${140 - inner} Z` : ""}`
                : `${outerPath} ${inner ? `L${point(end, inner)} A${inner},${inner} 0 ${end - start > Math.PI ? 1 : 0} 0 ${point(start, inner)}` : "L160,140"} Z`;
              return (
                <path
                  key={key}
                  d={d}
                  fill={colors[i]}
                  fillRule="evenodd"
                  stroke="#fff"
                  strokeWidth={selected === i ? 4 : 2}
                  role="button"
                  tabIndex={0}
                  aria-label={`${label}: ${display(value)}, ${percent(value)}`}
                  onFocus={() => setSelected(i)}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => setSelected(i)}
                  onKeyDown={(e) => {
                    if (["Enter", " "].includes(e.key)) {
                      e.preventDefault();
                      setSelected(i);
                    }
                  }}
                />
              );
            })}
          </g>
          {type === "VONG" && (
            <text
              x="160"
              y="144"
              textAnchor="middle"
              className="trend-pie-total"
            >
              {number(total)} lượt
            </text>
          )}
        </svg>
        <div className="trend-pie-legend">
          {series.map(([key, label], i) => (
            <button
              type="button"
              key={key}
              aria-pressed={selected === i}
              onFocus={() => setSelected(i)}
              onClick={() => setSelected(i)}
            >
              <i style={{ background: colors[i] }} />
              <span>{label}</span>
              <b>
                {display(data.tong[key])} · {percent(data.tong[key])}
              </b>
            </button>
          ))}
        </div>
      </div>
      <div className="trend-detail" aria-live="polite">
        <strong>
          {data.nhan_khoang} · {series[selected][1]}
        </strong>
        <span>
          {display(data.tong[series[selected][0]])} lượt ·{" "}
          {percent(data.tong[series[selected][0]])}
        </span>
      </div>
    </>
  );
}

function Chart({ data, definition, type, onType }) {
  const [selected, setSelected] = useState(0);
  const { title, note, monetary, unit, id } = definition;
  const series = definition.series.filter(
    ([key]) => data.don_vi !== "GIO" || !["con_no", "lap_moi"].includes(key),
  );
  const points = data.diem,
    current = points[Math.min(selected, points.length - 1)];
  const display = monetary ? money : number;
  const circular = ["VONG", "TRON"].includes(type);
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
      <div className="trend-card-heading">
        <h3 id={`trend-${id}`}>{title}</h3>
        <Field label={`Kiểu biểu đồ — ${title}`}>
          <select value={type} onChange={(e) => onType(e.target.value)}>
            {Object.entries(id === "bookings" ? bookingTypes : timeTypes).map(
              ([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ),
            )}
          </select>
        </Field>
      </div>
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
      {!circular && (
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
      )}
      <p className="trend-unit">
        Đơn vị: {unit} ·{" "}
        {circular
          ? "Tỷ trọng trạng thái trong kỳ"
          : data.don_vi === "GIO"
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
      {type === "MIEN" && (
        <p className="trend-explanation">
          Các miền chồng để so sánh, không cộng dồn.
        </p>
      )}
      {circular ? (
        <Pie
          data={data}
          series={series}
          type={type}
          title={title}
          display={display}
        />
      ) : (
        <>
          <div
            className="trend-scroll"
            role="region"
            aria-label={`Biểu đồ ${title}, có thể cuộn ngang`}
            tabIndex={0}
          >
            <svg
              data-chart-type={type}
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
              <rect
                x={left + selected * step}
                y={top}
                width={step}
                height={plotHeight}
                fill="#edf4f0"
              />
              {type !== "COT" &&
                series.map(([key]) => {
                  const coords = points
                    .map(
                      (p, i) =>
                        `${left + i * step + step / 2},${top + plotHeight - ratio(p[key], max) * plotHeight}`,
                    )
                    .join(" ");
                  const color =
                    colors[definition.series.findIndex(([k]) => k === key)];
                  return (
                    <g key={key}>
                      {type === "MIEN" && (
                        <polygon
                          points={`${left + step / 2},${top + plotHeight} ${coords} ${left + (points.length - 0.5) * step},${top + plotHeight}`}
                          fill={color}
                          opacity="0.14"
                        />
                      )}
                      <polyline
                        points={coords}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.5"
                      />
                    </g>
                  );
                })}
              <g>
                {points.map((p, index) => (
                  <g
                    key={p.moc}
                    role="button"
                    tabIndex={selected === index ? 0 : -1}
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
                      fill="transparent"
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
                      return type !== "COT" ? (
                        <circle
                          key={key}
                          cx={left + index * step + step / 2}
                          cy={top + plotHeight - ratio(value, max) * plotHeight}
                          r={selected === index ? 4 : 2.5}
                          fill={
                            colors[
                              definition.series.findIndex(([k]) => k === key)
                            ]
                          }
                        />
                      ) : (
                        <rect
                          key={key}
                          x={left + index * step + 4 + j * barWidth}
                          y={top + plotHeight - h}
                          width={barWidth - 1}
                          height={h}
                          rx={2}
                          fill={
                            colors[
                              definition.series.findIndex(([k]) => k === key)
                            ]
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
        </>
      )}
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
  const { user } = useAuth();
  const preferenceKey = `chung-cu:dashboard-charts:v1:${user.ma_nguoi_dung}`;
  return (
    <ChartsPanel
      key={preferenceKey}
      preferenceKey={preferenceKey}
      refresh={refresh}
    />
  );
}
function ChartsPanel({ refresh, preferenceKey }) {
  const [preferences, setPreferences] = useState(() =>
    readPreferences(preferenceKey),
  );
  const [period, setPeriod] = useState("THANG"),
    [anchor, setAnchor] = useState(localDay),
    [revision, setRevision] = useState(0),
    [state, setState] = useState({ loading: true });
  const path = `/tong_quan/thong_ke?khoang=${period}&ngay=${anchor}`;
  const requestKey = `${path}:${refresh}:${revision}`;
  const enabled = preferences.expanded && preferences.visible.length > 0;
  useEffect(() => {
    try {
      localStorage.setItem(preferenceKey, JSON.stringify(preferences));
    } catch {
      /* Keep preferences in memory when storage is blocked. */
    }
  }, [preferenceKey, preferences]);
  useEffect(() => {
    if (!enabled) {
      setState({ loading: true });
      return;
    }
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
  }, [path, requestKey, enabled]);
  const resource = state.requestKey === requestKey ? state : { loading: true },
    data = resource.data;
  return (
    <section className="trends" aria-labelledby="trends-title">
      <div className="trends-heading">
        <div>
          <p className="eyebrow">THỐNG KÊ THEO THỜI GIAN</p>
          <h2 id="trends-title">Biểu đồ vận hành</h2>
          <p className="muted">
            {preferences.expanded
              ? "Chọn nhóm và kiểu biểu đồ cần xem."
              : "Mở khi cần xem thống kê theo thời gian."}
          </p>
        </div>
        <button
          type="button"
          aria-expanded={preferences.expanded}
          aria-controls="trends-body"
          onClick={() =>
            setPreferences((p) => ({ ...p, expanded: !p.expanded }))
          }
        >
          {preferences.expanded ? "Ẩn biểu đồ" : "Hiện biểu đồ"}
        </button>
      </div>
      {preferences.expanded && (
        <div id="trends-body">
          <fieldset className="trends-visibility">
            <legend>Biểu đồ muốn hiển thị</legend>
            {config.map((c) => (
              <label key={c.id}>
                <input
                  type="checkbox"
                  checked={preferences.visible.includes(c.id)}
                  onChange={(e) =>
                    setPreferences((p) => ({
                      ...p,
                      visible: e.target.checked
                        ? [...p.visible, c.id]
                        : p.visible.filter((id) => id !== c.id),
                    }))
                  }
                />
                {c.short}
              </label>
            ))}
          </fieldset>
          <p className="overview-note">
            Ngày chia theo giờ; tuần từ thứ Hai đến Chủ nhật. Thời gian tính
            theo giờ Việt Nam.
          </p>
          <div className="trends-filters">
            <Field label="Khoảng thống kê">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
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
              disabled={!enabled || resource.loading}
              onClick={() => setRevision((n) => n + 1)}
            >
              Cập nhật biểu đồ
            </button>
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
          {!enabled && (
            <p className="trend-empty">
              Chọn ít nhất một nhóm biểu đồ để xem. Các công việc bên dưới vẫn
              hiển thị.
            </p>
          )}
          <ErrorBox error={resource.error} />
          {enabled && resource.loading && <Loading />}
          {enabled && data && (
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
                  . Bộ lọc này áp dụng cho biểu đồ; các thẻ tổng quan vẫn phản
                  ánh số liệu hiện tại.
                </small>
              </p>
              <div className="trends-grid">
                {config
                  .filter((definition) =>
                    preferences.visible.includes(definition.id),
                  )
                  .map((definition) => (
                    <Chart
                      key={`${requestKey}:${definition.id}`}
                      data={data}
                      definition={definition}
                      type={preferences.types[definition.id]}
                      onType={(type) =>
                        setPreferences((p) => ({
                          ...p,
                          types: { ...p.types, [definition.id]: type },
                        }))
                      }
                    />
                  ))}
              </div>
              <p className="overview-note">
                Chạm, rê chuột hoặc dùng Tab để xem chi tiết. Với biểu đồ theo
                thời gian, dùng ← → để chuyển mốc. Biểu đồ tròn thể hiện tỷ
                trọng trạng thái trong toàn kỳ; bảng bên dưới vẫn có từng mốc
                thời gian.
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
```

### 2. `frontend/src/features/dashboard/DashboardCharts.css`

```css
.trends {
  margin: 8px 0 30px;
  min-width: 0;
}
.trends-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
.trends-heading h2 {
  margin: 0 0 6px;
}
.trends-heading p {
  margin-top: 0;
}
.trends-heading button {
  flex-shrink: 0;
}
.trends-filters {
  display: flex;
  align-items: end;
  gap: 14px;
  flex-wrap: wrap;
  padding: 18px;
  background: #fff;
  border: 1px solid #dce7e1;
  border-radius: 12px;
}
.trends-filters .field {
  margin: 0;
  min-width: 180px;
}
.trends-range {
  color: #527369;
  line-height: 1.7;
}
.trends-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}
.trend-card {
  min-width: 0;
  margin: 0;
  padding: 22px;
}
.trend-card h3 {
  margin: 0 0 16px;
  font-size: 1.15rem;
}
.trend-card-heading {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: start;
  gap: 8px 16px;
  margin-bottom: 12px;
}
.trend-card-heading h3 {
  flex: 1 1 170px;
}
.trend-card-heading .field {
  margin: 0;
  max-width: 100%;
}
.trend-card-heading .field label {
  font-size: 0.76rem;
}
.trend-card-heading select {
  padding: 8px 12px;
}
.trends-visibility {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 22px;
  border: 1px solid #dce7e1;
  border-radius: 10px;
  padding: 12px 16px;
  margin: 8px 0 12px;
}
.trends-visibility legend {
  color: #527369;
  font-size: 0.85rem;
  padding: 0 6px;
}
.trends-visibility label {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
}
.trends-visibility input {
  width: 18px;
  height: 18px;
  accent-color: #16776c;
}
.trend-pie-layout {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.trend-pie {
  display: block;
  flex: 1 1 220px;
  width: 100%;
  max-width: 320px;
  min-width: 0;
}
.trend-pie-total {
  fill: #234b43;
  font-weight: 700;
  font-size: 19px;
}
.trend-pie path[role="button"] {
  cursor: pointer;
}
.trend-pie path[role="button"]:focus {
  outline: none;
  stroke: #173d37;
  stroke-width: 4px;
}
.trend-pie-legend {
  flex: 1 1 160px;
  min-width: 0;
}
.trend-pie-legend button {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
  border: 0;
  text-align: left;
  padding: 10px;
  font-size: 0.85rem;
}
.trend-pie-legend button[aria-pressed="true"] {
  background: #edf4f0;
}
.trend-pie-legend i {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
.trend-pie-legend b {
  width: 100%;
  margin-left: 16px;
  overflow-wrap: anywhere;
}
.trend-totals {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin-bottom: 12px;
}
.trend-totals > div {
  min-width: 0;
  max-width: 100%;
}
.trend-totals span,
.trend-totals strong {
  display: block;
  overflow-wrap: anywhere;
}
.trend-totals span {
  font-size: 0.85rem;
  color: #527369;
}
.trend-totals strong {
  font-size: 1.25rem;
  font-variant-numeric: tabular-nums;
}
.trend-totals i,
.trend-legend i {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 6px;
}
.trend-explanation {
  font-size: 0.85rem;
  color: #526e64;
  line-height: 1.65;
}
.trend-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 0.8rem;
  margin: 16px 0 8px;
}
.trend-unit {
  font-size: 0.78rem;
  color: #526e64;
  margin: 0;
}
.trend-scroll {
  overflow-x: auto;
  max-width: 100%;
  overscroll-behavior-x: contain;
}
.trend-scroll svg {
  display: block;
  width: 100%;
}
.trend-axis {
  font-size: 11px;
  fill: #526e64;
}
.trend-scroll g[role="button"] {
  cursor: pointer;
  outline: none;
}
.trend-scroll g[role="button"]:focus > rect:first-child {
  stroke: #16776c;
  stroke-width: 2px;
}
.trend-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  padding: 12px;
  border-radius: 8px;
  background: #f1f6f3;
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}
.trend-detail > strong {
  width: 100%;
}
.trend-table {
  margin-top: 12px;
  font-size: 0.85rem;
}
.trend-table summary {
  cursor: pointer;
  color: #14635a;
  padding: 8px 0;
}
.trend-table table {
  min-width: 360px;
}
.trend-table th,
.trend-table td {
  white-space: nowrap;
}
.trend-table caption {
  text-align: left;
  padding: 12px 0;
  color: #526e64;
}
.trend-empty {
  color: #526e64;
  font-size: 0.85rem;
  padding: 10px;
  background: #f5f8f6;
  border-radius: 6px;
}
@media (max-width: 1200px) {
  .trends-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .trends-heading {
    flex-direction: column;
    margin-bottom: 14px;
  }
  .trends-filters {
    align-items: stretch;
    flex-direction: column;
  }
  .trends-filters .field {
    min-width: 0;
  }
  .trend-card {
    padding: 16px;
  }
}
```
