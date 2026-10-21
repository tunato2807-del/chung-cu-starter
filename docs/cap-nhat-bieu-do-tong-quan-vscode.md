# Biểu đồ Tổng quan theo ngày, tuần, tháng, quý, năm — code đầy đủ 5 file

> Có bản cập nhật [chọn kiểu và hiện/ẩn biểu đồ — code đầy đủ 2 file](cap-nhat-kieu-va-an-hien-bieu-do-vscode.md). Sau khi áp dụng, không chép DashboardCharts.jsx/CSS cũ bên dưới đè lên.

Áp dụng sau [Tổng quan vận hành 73bafdb](cap-nhat-tong-quan-van-hanh-vscode.md) trên nhánh `codex/auth-qr-incidents`. Giữ các chức năng trước đây. Hướng dẫn này chứa toàn bộ code **5 file** để chép vào VS Code, không cần tải ZIP. Không thêm thư viện hoặc migration.

## Biểu đồ được thêm

| Nhóm | Chuỗi số liệu | Mốc tính |
|---|---|---|
| Thu phí và hạn công nợ | Đã thu, còn nợ theo hạn trả | Ngày/giờ xác nhận thu; ngày hạn thanh toán của hóa đơn hiện chưa thu |
| Phản ánh | Tiếp nhận, đã đóng | Ngày/giờ gửi và ngày/giờ nghiệm thu đóng hồ sơ |
| Bảo trì | Phiếu lập, nghiệm thu | Ngày lập nghiệp vụ và ngày/giờ nghiệm thu hoàn thành |
| Lượt đặt tiện ích | Đã duyệt, chờ duyệt, đã hủy, từ chối | Ngày/giờ bắt đầu sử dụng, phân theo trạng thái hiện tại |

Chọn **Khoảng thống kê** và **Ngày trong kỳ**. Ví dụ chọn Quý, ngày 20/10/2026 thì hiện quý 4/2026, không phải 3 tháng lùi từ ngày đó. Tuần từ thứ Hai đến Chủ nhật. Tất cả mốc theo giờ Việt Nam.

| Khoảng chọn | Cách chia cột |
|---|---|
| Ngày | 24 giờ |
| Tuần | 7 ngày |
| Tháng | 28–31 ngày theo lịch, gồm năm nhuận |
| Quý | 3 tháng trong quý |
| Năm | 12 tháng |

- Chạm/rê chuột lên cột để xem số chính xác, hoặc dùng Tab rồi phím ← → / Home / End. Mở **Xem bảng số liệu** để đối chiếu từng mốc và tổng. Trên điện thoại, cuộn ngang trong từng biểu đồ/bảng nếu cần.
- **Cập nhật biểu đồ** tải lại kỳ đang chọn. **Cập nhật số liệu** đầu trang cập nhật cả thẻ hiện tại và biểu đồ, giữ bộ lọc. **Về kỳ hiện tại** đặt ngày về hôm nay, giữ kiểu khoảng đang chọn.
- Bộ lọc biểu đồ không lọc các thẻ công nợ/phản ánh/hàng đợi hiện tại bên trên và bên dưới. Mỗi phần có thời điểm đọc riêng. Bốn biểu đồ cùng một lần đọc dùng chung snapshot database.
- Tiền tổng hợp dùng chuỗi nguyên đồng, hiển thị bằng BigInt; chỉ tỷ lệ chiều cao cột được đổi sang số vẽ. Dữ liệu trống hiện số 0 và thông báo trống; lỗi tải hiện thông báo để thử lại. Đổi bộ lọc bỏ kết quả kỳ trước, không để số cũ dưới nhãn kỳ mới.

## Những điểm cần hiểu khi đối chiếu

**Công nợ là khoản đang còn nợ theo hạn trả**, không phải số dư lịch sử tại cuối mỗi ngày/tháng. Chỉ hóa đơn `DA_GUI` hiện chưa thanh toán; hóa đơn chưa có hạn không vào biểu đồ này nhưng vẫn có trong tổng công nợ hiện tại của Tổng quan. Khi trả tiền, cột công nợ tương ứng sẽ giảm ở lần cập nhật sau.

**Thu phí theo ngày xác nhận thu**, không theo kỳ hóa đơn. Hóa đơn tháng cũ được xác nhận trong kỳ đang xem vẫn tính vào kỳ này. Không cộng phiếu thu quỹ thủ công vào tiền thu hóa đơn. Muốn đối chiếu, vào báo cáo Thu phí và chọn đúng từ ngày/đến ngày của biểu đồ.

**Phản ánh**: tiếp nhận tính mọi hồ sơ gửi trong kỳ, kể cả hồ sơ hiện đã bị từ chối/đánh dấu trùng. Đã đóng chỉ tính hồ sơ `DA_DONG` theo `ngay_dong`; không dùng ngày cập nhật gần nhất. Hai chuỗi là hai luồng sự kiện, không thể lấy tỷ lệ trực tiếp làm tỷ lệ hoàn thành của cùng nhóm hồ sơ.

**Bảo trì**: phiếu lập theo `ngay_lap`, bỏ phiếu đã hủy. Nghiệm thu tính phiếu `HOAN_THANH` theo `ngay_nghiem_thu`. Phiếu lập kỳ trước có thể nghiệm thu kỳ này.

**Tiện ích**: tính theo lịch bắt đầu dùng và trạng thái hiện tại, có thể xem cả kỳ tương lai. Không cộng lịch hủy/từ chối thành lượt sử dụng đã duyệt. Chỉ số này là lượt đặt, không phải tỷ lệ sử dụng sức chứa hoặc số khách thực tế đã đến.

**Riêng chế độ Ngày**: hạn trả hóa đơn và ngày lập phiếu chỉ có ngày, không có giờ. Hai số vẫn hiện ở tổng ngày của thẻ biểu đồ, nhưng không được vẽ thành sự kiện 00h giả. Biểu đồ giờ tài chính chỉ vẽ thu phí, bảo trì chỉ vẽ nghiệm thu. Chuyển sang Tuần/Tháng/Quý/Năm để thấy hai chuỗi còn lại trên cột.

## Chép vào VS Code

1. Dừng backend/frontend bằng Ctrl+C. Lưu các sửa đổi cá nhân trước khi thay file. Giữ `.env`, `.certs`, database, ảnh/chứng từ.
2. Mở thư mục dự án `D:\DO_AN\chung-cu-starter-codex-auth-qr-incidents`. Tạo đúng tên các file mới bên dưới; với file có sẵn thì **thay toàn bộ**, không nối cuối file. Chỉ chép nội dung trong khối code.
3. Chép đủ **5 file cùng đợt**. `Dashboard.jsx` gọi component biểu đồ mới; router backend đăng ký `/api/tong_quan/thong_ke`. Không lấy Dashboard.jsx/dashboard.routes.js từ hướng dẫn trước đè lên sau bản này. Các file App.jsx, app.js, Dashboard.css và các phần khác giữ bản đã có.
4. Không cần `npm install`, migration hoặc seed. Bản này không thay database schema. Mở terminal tại thư mục gốc:

```powershell
npm run dev:backend
```

Terminal thứ hai giữ lệnh frontend đang dùng, ví dụ HTTPS:

```powershell
npm run dev:frontend:https
```

Chỉ chạy một frontend trên cổng 5173. Nếu dùng HTTP LAN, giữ lệnh Vite của bạn. Restart backend để nhận router mới, sau đó Ctrl+F5 trình duyệt. Đăng nhập BQL → Tổng quan → Biểu đồ vận hành.

Nếu lấy bằng Git, lưu thay đổi riêng trước khi cập nhật nhánh `codex/auth-qr-incidents`; không cần tải lại ZIP hoặc tạo lại database.

## Thử sau khi cập nhật

1. Chọn Ngày → chọn ngày có thu phí: có 24 mốc, chạm đúng giờ để xem tiền thu. Kiểm tra ghi chú tổng ngày cho công nợ và phiếu lập.
2. Chọn Tuần, Tháng, Quý, Năm: kiểm tra 7 ngày, số ngày thực tế của tháng, 3 tháng và 12 tháng. Chọn ngày ở tháng 2/2024 để kiểm tra 29 ngày, tuần chứa 01/01 để kiểm tra qua năm.
3. Mở bảng ở từng biểu đồ. Đối chiếu tổng thu với báo cáo Thu phí cùng khoảng; đối chiếu công nợ theo hạn và trạng thái hiện tại của hóa đơn.
4. Xác nhận thu hoặc đổi trạng thái hồ sơ/lượt đặt ở màn nghiệp vụ, quay lại và bấm cập nhật. Kiểu khoảng/ngày đã chọn được giữ khi cập nhật tại trang.
5. Chọn kỳ không có dữ liệu: hiện số 0 và thông báo trống. Khi API lỗi, không giữ biểu đồ kỳ trước thành kỳ mới; bấm cập nhật để thử lại.
6. Kiểm tra trên điện thoại: chạm cột, cuộn ngang bên trong biểu đồ và mở bảng. Các phần còn lại của trang không bị tràn ngang.

## Danh sách file

1. [backend/src/modules/dashboard/dashboard-statistics.service.js](../backend/src/modules/dashboard/dashboard-statistics.service.js) — **Tạo mới**.
2. [backend/src/modules/dashboard/dashboard.routes.js](../backend/src/modules/dashboard/dashboard.routes.js) — **Thay toàn bộ**.
3. [frontend/src/features/dashboard/DashboardCharts.jsx](../frontend/src/features/dashboard/DashboardCharts.jsx) — **Tạo mới**.
4. [frontend/src/features/dashboard/DashboardCharts.css](../frontend/src/features/dashboard/DashboardCharts.css) — **Tạo mới**.
5. [frontend/src/features/dashboard/Dashboard.jsx](../frontend/src/features/dashboard/Dashboard.jsx) — **Thay toàn bộ**.

## Code đầy đủ

### 1. `backend/src/modules/dashboard/dashboard-statistics.service.js`

Tạo mới.

```js
import { pool, rows } from "../../lib/db.js";
import { choice } from "../../lib/http.js";
import { day, today } from "../billing/billing.validation.js";

const iso = (date) => date.toISOString().slice(0, 10);
const date = (s) => new Date(`${s}T00:00:00Z`);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const localUtc = (s) =>
  new Date(`${s}T00:00:00+07:00`).toISOString().slice(0, 19).replace("T", " ");
const keys = [
  "da_thu",
  "con_no",
  "tiep_nhan",
  "da_dong",
  "lap_moi",
  "nghiem_thu",
  "cho_duyet",
  "da_duyet",
  "da_huy",
  "tu_choi",
];

// Calendar arithmetic uses UTC only as a date container. Business dates are Vietnam dates.
export function statisticsRange(query = {}, currentDay = today()) {
  const khoang = choice(query.khoang ?? "THANG", "khoang", [
    "NGAY",
    "TUAN",
    "THANG",
    "QUY",
    "NAM",
  ]);
  const ngay = day(query.ngay ?? currentDay, true);
  const anchor = date(ngay),
    year = anchor.getUTCFullYear(),
    month = anchor.getUTCMonth();
  let start = anchor,
    end,
    don_vi = "NGAY",
    nhan_khoang;
  if (khoang === "NGAY") {
    end = addDays(start, 1);
    don_vi = "GIO";
    nhan_khoang = `Ngày ${ngay.split("-").reverse().join("/")}`;
  } else if (khoang === "TUAN") {
    start = addDays(anchor, -((anchor.getUTCDay() + 6) % 7));
    end = addDays(start, 7);
    nhan_khoang = "Tuần từ thứ Hai đến Chủ nhật";
  } else if (khoang === "THANG") {
    start = new Date(Date.UTC(year, month, 1));
    end = new Date(Date.UTC(year, month + 1, 1));
    nhan_khoang = `Tháng ${month + 1}/${year}`;
  } else {
    const quarterMonth = Math.floor(month / 3) * 3;
    start = new Date(Date.UTC(year, khoang === "NAM" ? 0 : quarterMonth, 1));
    end = new Date(Date.UTC(year, khoang === "NAM" ? 12 : quarterMonth + 3, 1));
    don_vi = "THANG";
    nhan_khoang =
      khoang === "NAM"
        ? `Năm ${year}`
        : `Quý ${Math.floor(month / 3) + 1}/${year}`;
  }
  const diem = [];
  if (don_vi === "GIO") {
    for (let h = 0; h < 24; h++)
      diem.push({
        moc: `${ngay} ${String(h).padStart(2, "0")}:00:00`,
        nhan: `${String(h).padStart(2, "0")}h`,
      });
  } else {
    for (
      let d = start;
      d < end;
      d =
        don_vi === "THANG"
          ? new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
          : addDays(d, 1)
    ) {
      const s = iso(d);
      diem.push({
        moc: don_vi === "THANG" ? s.slice(0, 7) : s,
        nhan:
          don_vi === "THANG"
            ? `T${d.getUTCMonth() + 1}`
            : s.slice(5).split("-").reverse().join("/"),
      });
    }
  }
  return {
    khoang,
    ngay,
    tu_ngay: iso(start),
    den_ngay: iso(addDays(end, -1)),
    den_truoc_ngay: iso(end),
    don_vi,
    nhan_khoang,
    diem,
  };
}

export async function statistics(query = {}) {
  // Validate before acquiring a connection; all SQL expressions below are server constants.
  const range = statisticsRange(query);
  const db = await pool.getConnection();
  try {
    await db.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await db.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
    const [clock] = await rows(db, "SELECT UTC_TIMESTAMP(6) AS tai_luc");
    const points = range.diem.map((p) => ({
      ...p,
      ...Object.fromEntries(
        keys.map((k) => [k, ["da_thu", "con_no"].includes(k) ? "0" : 0]),
      ),
    }));
    const format =
      range.don_vi === "GIO"
        ? "%Y-%m-%d %H:00:00"
        : range.don_vi === "THANG"
          ? "%Y-%m"
          : "%Y-%m-%d";
    const aggregate = async (table, column, values, condition, utc = true) => {
      const businessTime = utc ? `DATE_ADD(${column},INTERVAL 7 HOUR)` : column;
      const result = await rows(
        db,
        `SELECT DATE_FORMAT(${businessTime},'${format}') AS moc,${values} FROM ${table}
        WHERE ${column}>=? AND ${column}<? ${condition ? `AND ${condition}` : ""} GROUP BY moc`,
        utc
          ? [localUtc(range.tu_ngay), localUtc(range.den_truoc_ngay)]
          : [range.tu_ngay, range.den_truoc_ngay],
      );
      const lookup = new Map(result.map((r) => [r.moc, r]));
      for (const point of points)
        if (lookup.has(point.moc)) Object.assign(point, lookup.get(point.moc));
    };
    await aggregate(
      "hoa_don",
      "ngay_thanh_toan",
      "CAST(SUM(so_tien_da_thu) AS CHAR) AS da_thu",
      "trang_thai='DA_THANH_TOAN'",
    );
    // A DATE has no hour: daily debt/maintenance totals are never assigned a fake hour.
    const dateFormat = range.don_vi === "THANG" ? "%Y-%m" : "%Y-%m-%d";
    const daily = async (table, column, values, condition) => {
      const result = await rows(
        db,
        `SELECT DATE_FORMAT(${column},'${dateFormat}') AS moc,${values} FROM ${table}
        WHERE ${column}>=? AND ${column}<? ${condition ? `AND ${condition}` : ""} GROUP BY moc`,
        [range.tu_ngay, range.den_truoc_ngay],
      );
      const lookup = new Map(result.map((r) => [r.moc, r]));
      // Day-only quantities are returned separately rather than inventing a midnight event.
      if (range.don_vi === "GIO") return result[0] || {};
      for (const point of points)
        if (lookup.has(point.moc)) Object.assign(point, lookup.get(point.moc));
      return {};
    };
    const debtDay = await daily(
      "hoa_don",
      "han_thanh_toan",
      "CAST(SUM(tong_tien) AS CHAR) AS con_no",
      "trang_thai='DA_GUI'",
    );
    await aggregate("phan_anh", "ngay_tao", "COUNT(*) AS tiep_nhan");
    await aggregate(
      "phan_anh",
      "ngay_dong",
      "COUNT(*) AS da_dong",
      "trang_thai='DA_DONG'",
    );
    const jobsDay = await daily(
      "phieu_bao_tri",
      "ngay_lap",
      "COUNT(*) AS lap_moi",
      "trang_thai<>'HUY'",
    );
    await aggregate(
      "phieu_bao_tri",
      "ngay_nghiem_thu",
      "COUNT(*) AS nghiem_thu",
      "trang_thai='HOAN_THANH'",
    );
    await aggregate(
      "dat_lich_tien_ich",
      "bat_dau",
      "CAST(SUM(trang_thai='CHO_DUYET') AS UNSIGNED) AS cho_duyet,CAST(SUM(trang_thai='DA_DUYET') AS UNSIGNED) AS da_duyet,CAST(SUM(trang_thai='DA_HUY') AS UNSIGNED) AS da_huy,CAST(SUM(trang_thai='TU_CHOI') AS UNSIGNED) AS tu_choi",
      "",
      false,
    );
    const tong = Object.fromEntries(
      keys.map((key) => [
        key,
        ["da_thu", "con_no"].includes(key)
          ? points.reduce((s, p) => s + BigInt(p[key]), 0n).toString()
          : points.reduce((s, p) => s + Number(p[key]), 0),
      ]),
    );
    if (range.don_vi === "GIO") {
      tong.con_no = debtDay.con_no || "0";
      tong.lap_moi = jobsDay.lap_moi || 0;
    }
    await db.commit();
    return { ...range, ...clock, diem: points, tong };
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}
```

### 2. `backend/src/modules/dashboard/dashboard.routes.js`

Thay toàn bộ.

```js
import { Router } from "express";
import { optionalAuth, requireAuth, roles } from "../auth/auth.middleware.js";
import { overview } from "./dashboard.service.js";
import { statistics } from "./dashboard-statistics.service.js";
export const dashboardRouter = Router();
dashboardRouter.use(optionalAuth, requireAuth, roles("QUAN_TRI_VIEN"));
dashboardRouter.get("/", async (req, res) =>
  res.json({ data: await overview() }),
);
dashboardRouter.get("/thong_ke", async (req, res) =>
  res.json({ data: await statistics(req.query) }),
);
```

### 3. `frontend/src/features/dashboard/DashboardCharts.jsx`

Tạo mới.

```jsx
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
```

### 4. `frontend/src/features/dashboard/DashboardCharts.css`

Tạo mới.

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

### 5. `frontend/src/features/dashboard/Dashboard.jsx`

Thay toàn bộ.

```jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { Badge, ErrorBox, Loading, priorities } from "../../shared/ui.jsx";
import "./Dashboard.css";
import DashboardCharts from "./DashboardCharts.jsx";

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
      <span>{title}</span>
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
```
