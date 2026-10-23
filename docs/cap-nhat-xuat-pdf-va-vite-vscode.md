# Sửa lỗi thiếu Vite và thêm lại Xuất PDF

Nhánh **codex/editorial-business-ui**. Bản này bổ sung trên bản sửa Excel/menu `95edeee`: giữ nhập bằng Excel .xlsx, thêm lại **Xuất PDF** cho danh sách và báo cáo. Không cần migration.

## Lỗi `'vite' is not recognized`

Vite đã được khai báo trong devDependencies của frontend. Lỗi này thường xảy ra khi dependency chưa cài, bị bỏ qua phần dev, hoặc thiếu lệnh node_modules/.bin/vite.cmd trên Windows. Không cần cài Vite toàn cục.

Ở PowerShell tại thư mục gốc có package.json, frontend và backend:

```powershell
npm ci --include=dev --workspaces --include-workspace-root --bin-links=true
npm run build
```

Cài xong bước đầu mới chạy build. Nếu npm ci thất bại, giữ thông báo lỗi cài đặt để xử lý; lệnh build không thể sửa một lần cài dependency bị lỗi. Có thể kiểm tra:

```powershell
Test-Path .\node_modules\.bin\vite.cmd
npm ls vite -w frontend
```

Test-Path cần trả True. Lệnh ci ở trên đã được thử với NODE_ENV=production và vẫn cài Vite nhờ --include=dev. Việc tạo .cmd cụ thể trên máy Windows của bạn chưa được kiểm tra từ xa.

## Cập nhật chức năng Xuất PDF

Chép đủ **6 file** bên dưới vào đúng đường dẫn. Các file là bản đầy đủ, không phải đoạn vá. Giữ bộ sửa Excel và header/menu trước đó; các file này chỉ cập nhật phần xuất và nhãn điều hướng.

| File | Thay đổi |
| --- | --- |
| frontend/src/shared/ReportExport.jsx | Nút Xuất PDF, kiểm tra MIME và tải tệp |
| frontend/src/features/data-exchange/DataExchange.jsx | Tách rõ nhập Excel và xuất Excel/PDF |
| frontend/src/app/navigation.js | Nhãn Nhập / xuất dữ liệu |
| backend/src/modules/report-exports/report-files.js | Tạo PDF có font tiếng Việt, giới hạn và header tải xuống |
| backend/src/modules/report-exports/report-exports.service.js | Chiều rộng cột PDF báo cáo tài chính |
| backend/src/modules/data-exchange/export.service.js | Chiều rộng cột PDF danh sách |

Sau khi chép code, cài thư viện xuất PDF và đầy đủ dependency:

```powershell
npm install -w backend pdfmake@0.2.23 --save-exact
npm ci --include=dev --workspaces --include-workspace-root --bin-links=true
npm run build
```

Lệnh install cập nhật backend/package.json và package-lock.json. Nếu bạn lấy trọn commit mới từ Git, hai file này đã có sẵn, chỉ cần npm ci rồi build. pdf-parse là devDependency phục vụ kiểm thử đọc lại PDF, không cần thêm thủ công để web xuất được PDF.

Dừng backend/frontend cũ trong terminal của chúng bằng Ctrl+C. Chạy lại backend, rồi mở frontend bằng lệnh HTTP hoặc HTTPS bạn đang dùng:

```powershell
npm run dev:backend
```

Ở terminal khác, chạy frontend. Giữ cấu hình HTTPS hiện tại nếu dùng camera điện thoại. Tải lại trang bằng Ctrl+Shift+R. Bản này thay cả frontend và backend, nên chép riêng nút Xuất PDF sẽ chưa đủ.

## Cách dùng

BQL mở danh sách căn hộ, cư dân, phương tiện, chỉ số, thiết bị, hóa đơn, phiếu bảo trì, lượt đặt tiện ích hoặc báo cáo công nợ/thu phí/sổ quỹ → áp dụng bộ lọc → **Xuất PDF**.

- Xuất đủ kết quả khớp bộ lọc, không chỉ trang đang xem.
- PDF tối đa 1.000 dòng; vượt giới hạn sẽ yêu cầu thu hẹp bộ lọc hoặc chọn Excel (tối đa 10.000 dòng).
- PDF có thời điểm, bộ lọc, số liệu tổng hợp, bảng chi tiết, tiếng Việt và số trang. Tệp giữ nguyên số tiền.
- Phần tải mẫu/nhập chỉ dùng Excel, không thêm lại mẫu PDF hoặc parser nhập PDF.

[Xem PDF mẫu](khoi-phuc-xuat-pdf/mau-cong-no.pdf) · [Ảnh xem trước](khoi-phuc-xuat-pdf/xem-truoc-pdf.png) · [Kiểm chứng](khoi-phuc-xuat-pdf/verification.md). Mẫu dùng dữ liệu giả lập, không phải chứng từ thật.

## Code từng file đầy đủ

### frontend/src/shared/ReportExport.jsx

```jsx
import React, { useEffect, useRef, useState } from "react";
import { ErrorBox } from "./ui.jsx";
export default function ReportExport({
  path,
  disabled = false,
  template = false,
}) {
  const [pending, setPending] = useState(""),
    [error, setError] = useState(null),
    [notice, setNotice] = useState(""),
    active = useRef(null),
    currentPath = useRef(path);
  currentPath.current = path;
  useEffect(() => {
    active.current?.abort();
    active.current = null;
    setPending("");
    setError(null);
    setNotice("");
    return () => active.current?.abort();
  }, [path]);
  async function download(format) {
    const controller = new AbortController(),
      requestPath = path;
    active.current = controller;
    setPending(format);
    setError(null);
    setNotice("");
    try {
      const url = new URL("/api" + path, window.location.origin);
      url.searchParams.set("dinh_dang", format);
      const r = await fetch(url, {
        credentials: "same-origin",
        headers: { "X-App-Request": "1" },
        signal: controller.signal,
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        const message =
          data.error?.message ||
          (r.status >= 500
            ? "Máy chủ chưa trả được tệp báo cáo. Kiểm tra backend đang chạy và lỗi trong terminal backend rồi thử lại."
            : `Không tải được báo cáo (${r.status}).`);
        throw new Error(message);
      }
      const mime =
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      if (!r.headers.get("Content-Type")?.startsWith(mime))
        throw new Error("Máy chủ trả tệp không đúng định dạng. Hãy thử lại.");
      const blob = await r.blob();
      if (controller.signal.aborted || currentPath.current !== requestPath)
        return;
      const file =
        r.headers
          .get("Content-Disposition")
          ?.match(/filename="([a-zA-Z0-9_.-]+)"/)?.[1] || `bao-cao.${format}`;
      const link = document.createElement("a"),
        objectURL = URL.createObjectURL(blob);
      link.href = objectURL;
      link.download = file;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectURL), 60000);
      setNotice(
        template
          ? "Đã tải mẫu trống. Điền sheet Nhap từ dòng 2, lưu tệp rồi chọn lại để xem trước. Sheet Vi du chỉ minh họa."
          : `Đã tạo tệp ${format === "pdf" ? "PDF" : "Excel"} gồm ${Number(r.headers.get("X-Export-Rows") || 0).toLocaleString("vi-VN")} dòng. ${format === "xlsx" ? "Excel mở tại trang Chi tiết; bộ lọc và số liệu chung nằm ở trang Tổng hợp. " : ""}Kiểm tra mục Tệp đã tải xuống của trình duyệt.`,
      );
    } catch (e) {
      if (!controller.signal.aborted && currentPath.current === requestPath)
        setError(
          e.name === "TypeError"
            ? new Error(
                "Không kết nối được máy chủ để tải báo cáo. Hãy thử lại.",
              )
            : e,
        );
    } finally {
      if (active.current === controller) {
        active.current = null;
        setPending("");
      }
    }
  }
  return (
    <section
      className="report-export"
      aria-label={template ? "Tải mẫu Excel" : "Xuất báo cáo"}
    >
      <div className="actions">
        <button
          type="button"
          disabled={disabled || !!pending}
          onClick={() => download("xlsx")}
        >
          {pending === "xlsx"
            ? "Đang tạo Excel…"
            : template
              ? "Tải mẫu Excel"
              : "Xuất Excel"}
        </button>
        {!template && (
          <button
            type="button"
            disabled={disabled || !!pending}
            onClick={() => download("pdf")}
          >
            {pending === "pdf" ? "Đang tạo PDF…" : "Xuất PDF"}
          </button>
        )}
        <small>
          {template
            ? "Mẫu trống .xlsx: điền sheet Nhap từ dòng 2, tối đa 100 dòng. Ví dụ nằm riêng ở sheet Vi du."
            : "Xuất toàn bộ kết quả theo bộ lọc: tối đa 10.000 dòng Excel hoặc 1.000 dòng PDF. Excel có trang Chi tiết và Tổng hợp."}
        </small>
      </div>
      {notice && (
        <p className="note" role="status">
          {notice}
        </p>
      )}
      <ErrorBox error={error} />
    </section>
  );
}
```

### frontend/src/features/data-exchange/DataExchange.jsx

```jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { ErrorBox, Field, Loading, useResource } from "../../shared/ui.jsx";
import ReportExport from "../../shared/ReportExport.jsx";
import { newRequestKey as requestKey } from "../../shared/request-key.js";

function ImportPanel({ config, onDone }) {
  const [file, setFile] = useState(null),
    [preview, setPreview] = useState(null),
    [result, setResult] = useState(null),
    [pending, setPending] = useState(""),
    [error, setError] = useState(null),
    request = useRef(null),
    key = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  async function run(commit) {
    const controller = new AbortController();
    request.current = controller;
    setPending(commit ? "commit" : "preview");
    setError(null);
    if (!commit) {
      setPreview(null);
      setResult(null);
      key.current = requestKey();
    }
    try {
      const body = new FormData();
      body.append("tep", file);
      if (commit) {
        body.append("xac_nhan", preview.xac_nhan);
        body.append("khoa_yeu_cau", key.current);
      }
      const response = await getJson(
        `/trao_doi_du_lieu/${config.key}/${commit ? "nhap" : "xem_truoc"}`,
        { method: "POST", body, signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      if (commit) {
        setResult(response.data);
        setPreview(null);
        onDone();
      } else setPreview(response.data);
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(e);
        if (
          ["IMPORT_CHANGED", "PREVIEW_EXPIRED", "PREVIEW_REQUIRED"].includes(
            e.code,
          )
        )
          setPreview(null);
      }
    } finally {
      if (!controller.signal.aborted) setPending("");
    }
  }
  return (
    <section className="card data-import" aria-label="Nhập dữ liệu">
      <p className="eyebrow">THÊM MỚI TỪ TỆP</p>
      <h2>Nhập {config.title.toLowerCase()}</h2>
      <p>{config.note}</p>
      <ol className="import-steps">
        <li>Tải và điền mẫu</li>
        <li>Chọn tệp, xem trước</li>
        <li>Kiểm tra rồi xác nhận</li>
      </ol>
      <ReportExport
        path={`/trao_doi_du_lieu/${config.key}/mau`}
        template
        disabled={!!pending}
      />
      <details className="import-help">
        <summary>Hướng dẫn điền mẫu Excel</summary>
        <p>
          Excel: điền sheet <strong>Nhap</strong> từ dòng 2, giữ nguyên tên cột.
          Số điện thoại và mã căn cần là văn bản để giữ số 0 đầu. Ngày dùng
          YYYY-MM-DD, số thập phân dùng dấu chấm. Mẫu tải về chưa có dữ liệu;
          sheet Vi du chỉ minh họa và không được nhập tự động.
        </p>
        <div
          className="table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Hướng dẫn cột trong mẫu Excel"
        >
          <table>
            <thead>
              <tr>
                <th>Cột</th>
                <th>Ý nghĩa</th>
                <th>Ví dụ / hướng dẫn</th>
              </tr>
            </thead>
            <tbody>
              {config.fields.map((f) => (
                <tr key={f.key}>
                  <td>
                    <code>{f.key}</code>
                  </td>
                  <td>{f.label}</td>
                  <td>
                    {f.example}
                    {f.example && f.hint ? " · " : ""}
                    {f.hint}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="note">
        Phần đang nhập: <strong>{config.title}</strong>. Tệp phải thuộc đúng
        phần này.
      </p>
      {config.key === "phuong_tien" && (
        <p className="note">
          Mở <Link to="/quan-tri/cu-dan">Cư dân &amp; cư trú</Link>, bấm Sao
          chép ở mã cư dân và điền số đó vào cột ma_cu_dan trong tệp xe. Thay
          các ô THAY_MA_CU_DAN_1/2; không dùng tên tài khoản CH...
        </p>
      )}
      <Field label="Chọn tệp Excel .xlsx đã điền (tối đa 5 MB)">
        <input
          type="file"
          accept=".xlsx"
          disabled={!!pending}
          onChange={(e) => {
            const selected = e.target.files?.[0] || null;
            setFile(selected);
            setPreview(null);
            setResult(null);
            setError(
              selected && !/\.xlsx$/i.test(selected.name)
                ? new Error(
                    "Chỉ nhận tệp Excel .xlsx. Hãy chọn tệp đã điền trong sheet Nhap.",
                  )
                : selected?.size > 5 * 1024 * 1024
                  ? new Error("Tệp tối đa 5 MB.")
                  : null,
            );
            key.current = null;
          }}
        />
      </Field>
      <div className="actions">
        <button
          type="button"
          disabled={
            !file ||
            !/\.xlsx$/i.test(file.name) ||
            file.size > 5 * 1024 * 1024 ||
            !!pending
          }
          onClick={() => run(false)}
        >
          {pending === "preview" ? "Đang kiểm tra…" : "Xem trước tệp"}
        </button>
      </div>
      <ErrorBox error={error} />
      {preview && (
        <section aria-label="Bản xem trước" className="import-preview">
          <p className="muted">Vuốt hoặc cuộn ngang bảng để xem đủ các cột.</p>
          <h3>
            {preview.total} dòng · {preview.errors} dòng lỗi
          </h3>
          <p className="muted">
            Chưa lưu dữ liệu. Sửa tất cả dòng lỗi trong tệp rồi xem trước lại.
            Khi xác nhận, hệ thống kiểm tra lại và chỉ lưu nếu toàn bộ lô hợp
            lệ.
          </p>
          <div
            className="table-wrap"
            tabIndex={0}
            role="region"
            aria-label="Bản xem trước dữ liệu Excel"
          >
            <table>
              <thead>
                <tr>
                  <th>Dòng Excel</th>
                  {config.fields.map((f) => (
                    <th key={f.key}>{f.label}</th>
                  ))}
                  <th>Kiểm tra</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.line}>
                    <td>{r.line}</td>
                    {config.fields.map((f) => (
                      <td key={f.key}>{r.values[f.key] || "—"}</td>
                    ))}
                    <td className={r.error ? "import-row-error" : ""}>
                      {r.error || "Hợp lệ"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="primary"
            type="button"
            disabled={preview.errors > 0 || !preview.xac_nhan || !!pending}
            onClick={() => run(true)}
          >
            {pending === "commit"
              ? "Đang lưu toàn bộ lô…"
              : `Xác nhận nhập ${preview.total} dòng`}
          </button>
        </section>
      )}
      {result && (
        <section role="status" className="import-result">
          <h3>
            {result.da_nhap_truoc
              ? "Tệp này đã được nhập trước đó"
              : "Nhập thành công"}
          </h3>
          <p>
            Đã lưu {result.so_dong} dòng. Yêu cầu gửi lại không tạo dữ liệu
            trùng.
          </p>
          {!!result.tai_khoan_moi?.length && (
            <details open>
              <summary>
                Tài khoản căn hộ vừa cấp — chỉ hiện mật khẩu lần này
              </summary>
              <p>
                Sao chép và bàn giao riêng cho người phụ trách. Không đưa mật
                khẩu vào tệp danh sách.
              </p>
              <div
                className="table-wrap"
                tabIndex={0}
                role="region"
                aria-label="Tài khoản căn hộ vừa tạo"
              >
                <table>
                  <thead>
                    <tr>
                      <th>Dòng</th>
                      <th>Tên đăng nhập</th>
                      <th>Mật khẩu tạm thời</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.tai_khoan_moi.map((a) => (
                      <tr key={a.dong}>
                        <td>{a.dong}</td>
                        <td>{a.ten_dang_nhap}</td>
                        <td>
                          <code>{a.mat_khau_tam_thoi}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
          {result.da_nhap_truoc && (
            <p>
              Mật khẩu không được trả lại khi gửi lại yêu cầu. Nếu chưa nhận
              được, cấp lại tại Tài khoản căn hộ.
            </p>
          )}
          <Link className="button" to={config.path}>
            Mở danh sách {config.title.toLowerCase()}
          </Link>
        </section>
      )}
    </section>
  );
}
export default function DataExchange() {
  const [params, setParams] = useSearchParams(),
    resource = useResource("/trao_doi_du_lieu"),
    history = useResource("/trao_doi_du_lieu/lich_su"),
    items = resource.result?.data || [],
    config = items.find((c) => c.key === (params.get("phan_he") || "can_ho"));
  const filters = new URLSearchParams(
    (config?.key === "chi_so" ? ["ma_can_ho", "ky_thanh_toan"] : ["q"]).map(
      (key) => [key, params.get(key) || ""],
    ),
  );
  return (
    <>
      <p className="eyebrow">DỮ LIỆU & BÁO CÁO</p>
      <h1>Nhập Excel · Xuất Excel/PDF</h1>
      <p>
        Nhập hồ sơ theo mẫu và xuất danh sách để đối chiếu. Chỉ ban quản lý được
        sử dụng chức năng này.
      </p>
      <ErrorBox error={resource.error || history.error} />
      {resource.loading && <Loading />}
      <section className="card">
        <Field label="Phần dữ liệu">
          <select
            value={config?.key || ""}
            onChange={(e) => {
              setParams({ phan_he: e.target.value });
            }}
          >
            {items.map((c) => (
              <option key={c.key} value={c.key}>
                {c.title}
                {c.importable ? " · Nhập / xuất" : " · Xuất danh sách"}
              </option>
            ))}
          </select>
        </Field>
      </section>
      {!resource.loading && !config && (
        <p>Phần dữ liệu không hợp lệ. Chọn lại trong danh sách.</p>
      )}
      {config && (
        <>
          <section className="card">
            <h2>Xuất {config.title.toLowerCase()}</h2>
            <p>
              Xuất toàn bộ kết quả theo bộ lọc, tối đa 10.000 dòng Excel hoặc
              1.000 dòng PDF. Có thể xuất theo bộ lọc ngay tại{" "}
              <Link to={config.path}>màn danh sách</Link>.
            </p>
            <form
              className="filters"
              key={params.toString()}
              onSubmit={(e) => {
                e.preventDefault();
                setParams({
                  phan_he: config.key,
                  ...Object.fromEntries(new FormData(e.currentTarget)),
                });
              }}
            >
              {config.key === "chi_so" ? (
                <>
                  <Field label="Mã căn hộ">
                    <input
                      name="ma_can_ho"
                      defaultValue={params.get("ma_can_ho") || ""}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </Field>
                  <Field label="Kỳ">
                    <input
                      type="month"
                      name="ky_thanh_toan"
                      defaultValue={params.get("ky_thanh_toan") || ""}
                    />
                  </Field>
                </>
              ) : (
                <Field label="Tìm kiếm">
                  <input
                    name="q"
                    maxLength={100}
                    defaultValue={params.get("q") || ""}
                  />
                </Field>
              )}
              <button>Áp dụng bộ lọc xuất</button>
            </form>
            <ReportExport
              path={`/trao_doi_du_lieu/${config.key}/xuat?${filters}`}
            />
          </section>
          {config.importable ? (
            <ImportPanel
              key={config.key}
              config={config}
              onDone={history.reload}
            />
          ) : (
            <section className="card">
              <p>
                Phần này xuất dữ liệu đã ghi nhận. Tạo, duyệt hoặc xác nhận
                thanh toán tại màn nghiệp vụ để giữ đúng lịch sử.
              </p>
            </section>
          )}
        </>
      )}
      <section className="card">
        <h2>20 lần nhập gần nhất của bạn</h2>
        <div
          className="table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Lịch sử nhập Excel"
        >
          <table>
            <thead>
              <tr>
                <th>Phần dữ liệu</th>
                <th>Số dòng</th>
                <th>Thời điểm (Việt Nam)</th>
              </tr>
            </thead>
            <tbody>
              {(history.result?.data || []).map((r) => (
                <tr key={r.ma_dot_nhap}>
                  <td>
                    {items.find((i) => i.key === r.phan_he)?.title || r.phan_he}
                  </td>
                  <td>{r.so_dong}</td>
                  <td>
                    {new Date(
                      r.ngay_tao.replace(" ", "T") + "Z",
                    ).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!history.loading && !history.result?.data?.length && (
          <p className="muted">Chưa có lần nhập nào.</p>
        )}
      </section>
      <section className="card">
        <h2>Báo cáo tài chính</h2>
        <div className="actions">
          <Link to="/quan-tri/bao-cao-tai-chinh">
            Công nợ & thu phí · Excel / PDF
          </Link>
          <Link to="/quan-tri/quy">Sổ quỹ · Excel / PDF</Link>
        </div>
      </section>
    </>
  );
}
```

### frontend/src/app/navigation.js

```js
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
        ["/quan-tri/nhap-xuat", "Nhập / xuất dữ liệu", "file"],
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

### backend/src/modules/report-exports/report-files.js

```js
import { choice, fail } from "../../lib/http.js";
import { pagination } from "../billing/billing.validation.js";
export const limits = { xlsx: 10000, pdf: 1000 };
export const format = (query) =>
  choice(query.dinh_dang || "xlsx", "dinh_dang", ["xlsx", "pdf"]);
export function reportPage(query, exportFormat) {
  const { page, offset } = pagination(exportFormat ? { page: 1 } : query);
  const limit = exportFormat
    ? limits[choice(exportFormat, "dinh_dang", ["xlsx", "pdf"])]
    : 20;
  return {
    page,
    offset,
    limit,
    check(total) {
      if (exportFormat && BigInt(total) > BigInt(limit))
        fail(
          422,
          "EXPORT_TOO_LARGE",
          `Báo cáo có ${Number(total).toLocaleString("vi-VN")} dòng, vượt giới hạn ${limit.toLocaleString("vi-VN")} dòng cho ${exportFormat === "pdf" ? "PDF" : "Excel"}. Hãy thu hẹp bộ lọc${exportFormat === "pdf" ? " hoặc chọn Excel" : ""}. Không có dữ liệu nào bị cắt bớt.`,
        );
    },
  };
}
// Two file renderers at a time, at most one per account, with bounded output rows.
// Load workbook/PDF code only when requested; ordinary reads stay light.
const active = new Set();
export function reserve(userId) {
  if (active.has(userId) || active.size >= 2)
    fail(
      429,
      "EXPORT_BUSY",
      "Đang tạo báo cáo. Vui lòng chờ tải xong rồi thử lại.",
    );
  active.add(userId);
  return () => active.delete(userId);
}
export const clean = (value) =>
  String(value ?? "").replace(
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,
    "",
  );
export const date = (value) =>
  value ? String(value).split("-").reverse().join("/") : "—";
export const money = (value) =>
  `${BigInt(value || 0).toLocaleString("vi-VN")} đ`;
export function time(value) {
  return value
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).format(new Date(value.replace(" ", "T") + "Z"))
    : "—";
}
function cellValue(value, type) {
  if (type === "money") {
    const n = BigInt(value || 0),
      digits = (n < 0n ? -n : n).toString().length;
    // Excel stores only 15 significant decimal digits, even when JS Number is safe.
    return digits <= 15 ? Number(n) : n.toString();
  }
  if (type === "count") return Number(value || 0);
  return clean(value);
}
export async function excel(report) {
  const { default: ExcelJS } = await import("exceljs"),
    wb = new ExcelJS.Workbook();
  wb.creator = "Quản lý chung cư";
  wb.created = new Date();
  // Mở danh sách ngay cả trong ứng dụng bỏ qua activeTab của workbook.
  const data = wb.addWorksheet("Chi tiết", {
      properties: { tabColor: { argb: "FF14635A" } },
    }),
    meta = wb.addWorksheet("Tổng hợp");
  wb.views = [{ activeTab: 0, firstSheet: 0, visibility: "visible" }];
  meta.columns = [{ width: 38 }, { width: 75 }];
  meta.addRow(["CHUNG CƯ · QUẢN LÝ VẬN HÀNH"]);
  meta.mergeCells("A1:B1");
  meta.addRow([report.title]);
  meta.mergeCells("A2:B2");
  meta.addRow(["Thời điểm dữ liệu (Việt Nam)", time(report.at)]);
  meta.addRow(["Số dòng chi tiết", report.rows.length]);
  const detailLink = meta.addRow([
    {
      text: `Xem danh sách ${report.rows.length.toLocaleString("vi-VN")} dòng tại trang Chi tiết →`,
      hyperlink: "#'Chi tiết'!A1",
      tooltip: "Mở danh sách đầy đủ theo bộ lọc đã áp dụng",
    },
  ]);
  meta.mergeCells(detailLink.number, 1, detailLink.number, 2);
  for (const [label, value] of report.filters)
    meta.addRow([label, clean(value)]);
  meta.addRow([]);
  meta.addRow(["TỔNG HỢP", "Số tiền / số lượng"]);
  const summaryHeader = meta.rowCount;
  for (const s of report.summary) {
    const row = meta.addRow([s.label, cellValue(s.value, s.type)]);
    if (s.type === "money") row.getCell(2).numFmt = '#,##0" đ";[Red]-#,##0" đ"';
  }
  meta.addRow([]);
  for (const note of [
    ...report.notes,
    ...(report.currency === false
      ? [
          "Các mã và số điện thoại được lưu dạng văn bản để giữ nguyên số 0 đầu.",
        ]
      : [
          "Tiền trên 15 chữ số được lưu dạng văn bản để giữ nguyên giá trị; các mã và số điện thoại luôn là văn bản.",
        ]),
  ]) {
    const row = meta.addRow([clean(note)]);
    meta.mergeCells(row.number, 1, row.number, 2);
    row.height = 42;
  }
  meta.eachRow((row) => {
    row.font = { name: "Calibri", size: 11, color: { argb: "FF183C3B" } };
    row.alignment = { vertical: "top", wrapText: true };
  });
  detailLink.getCell(1).font = {
    name: "Calibri",
    size: 12,
    bold: true,
    underline: true,
    color: { argb: "FF14635A" },
  };
  detailLink.height = 30;
  meta.views = [{ showGridLines: false, tabSelected: false }];
  for (const n of [1, 2, summaryHeader]) {
    const row = meta.getRow(n);
    row.font = {
      name: "Calibri",
      size: n === 2 ? 16 : 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    row.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF14635A" },
    };
    row.height = n === 2 ? 36 : 26;
  }
  data.columns = report.columns.map((c) => ({
    header: c.title,
    width: c.width || 20,
  }));
  for (const item of report.rows) {
    const row = data.addRow(
      report.columns.map((c) => cellValue(c.value(item), c.type)),
    );
    row.alignment = { vertical: "top", wrapText: true };
    row.font = { name: "Calibri", size: 10 };
    report.columns.forEach((c, i) => {
      if (c.type === "money")
        row.getCell(i + 1).numFmt = '#,##0" đ";[Red]-#,##0" đ"';
    });
    if (row.number % 2 === 0)
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF2F6F4" },
      };
  }
  data.getRow(1).height = 30;
  data.getRow(1).font = {
    name: "Calibri",
    size: 10,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  data.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF14635A" },
  };
  data.getRow(1).alignment = { vertical: "middle", wrapText: true };
  data.views = [
    { state: "frozen", ySplit: 1, activeCell: "A2", tabSelected: true },
  ];
  data.getCell("A1").note =
    `${clean(report.title)}\nCó ${report.rows.length.toLocaleString("vi-VN")} dòng dữ liệu. Bộ lọc và số liệu tổng hợp nằm ở trang Tổng hợp.`;
  data.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, data.rowCount), column: report.columns.length },
  };
  data.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: "1:1",
  };
  data.headerFooter.oddFooter = `&LQuản lý chung cư&CTrang &P / &N${report.currency === false ? "" : "&RĐơn vị: đồng"}`;
  return Buffer.from(await wb.xlsx.writeBuffer());
}
let printerPromise;
async function printer() {
  if (!printerPromise)
    printerPromise = Promise.all([
      import("pdfmake"),
      import("pdfmake/build/vfs_fonts.js"),
    ])
      .then(
        ([{ default: PdfPrinter }, { default: vfs }]) =>
          new PdfPrinter({
            Roboto: {
              normal: Buffer.from(vfs["Roboto-Regular.ttf"], "base64"),
              bold: Buffer.from(vfs["Roboto-Medium.ttf"], "base64"),
              italics: Buffer.from(vfs["Roboto-Italic.ttf"], "base64"),
              bolditalics: Buffer.from(
                vfs["Roboto-MediumItalic.ttf"],
                "base64",
              ),
            },
          }),
      )
      .catch((error) => {
        printerPromise = undefined;
        throw error;
      });
  return printerPromise;
}
export async function pdf(report) {
  const render = await printer(),
    wide = report.columns.length >= 9,
    pageWidth = 841.89,
    usable = pageWidth - 64;
  const weights = report.columns.map((c) => c.pdfWidth || 1),
    sum = weights.reduce((a, b) => a + b, 0),
    tableWidths = weights.map(
      (n) => ((usable - report.columns.length * 9) * n) / sum,
    );
  const definition = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [32, 30, 32, 38],
    info: {
      title: report.title,
      author: "Quản lý chung cư",
      subject: "Báo cáo theo dữ liệu đã ghi nhận",
    },
    defaultStyle: { font: "Roboto", fontSize: wide ? 7 : 8, color: "#171917" },
    footer: (current, total) => ({
      margin: [32, 12, 32, 0],
      columns: [
        { text: "CHUNG CƯ · QUẢN LÝ VẬN HÀNH", fontSize: 7, color: "#61665c" },
        {
          text: `Trang ${current} / ${total}${report.currency === false ? "" : " · Đơn vị: đồng"}`,
          alignment: "right",
          fontSize: 7,
          color: "#61665c",
        },
      ],
    }),
    content: [
      {
        text: "CHUNG CƯ · QUẢN LÝ VẬN HÀNH",
        fontSize: 9,
        color: "#52612b",
        bold: true,
        margin: [0, 0, 0, 6],
      },
      {
        text: clean(report.title),
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 8],
      },
      {
        text: `Dữ liệu lúc ${time(report.at)} (Việt Nam) · ${report.rows.length.toLocaleString("vi-VN")} dòng chi tiết`,
        color: "#61665c",
        margin: [0, 0, 0, 6],
      },
      {
        text: report.filters.map(([k, v]) => `${k}: ${clean(v)}`).join("  ·  "),
        margin: [0, 0, 0, 10],
      },
      {
        table: {
          widths: ["*", "*"],
          body: report.summary.map((s) => [
            { text: s.label, bold: true },
            {
              text: s.type === "money" ? money(s.value) : clean(s.value),
              alignment: "right",
              bold: true,
            },
          ]),
        },
        layout: {
          hLineWidth: () => 0.4,
          vLineWidth: () => 0,
          hLineColor: () => "#dddfd7",
          fillColor: (i) => (i % 2 === 0 ? "#f5f5f1" : null),
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
        margin: [0, 0, 0, 10],
      },
      ...report.notes.map((note) => ({
        text: clean(note),
        color: "#61665c",
        fontSize: 7,
        margin: [0, 0, 0, 4],
      })),
      {
        text: "CHI TIẾT BÁO CÁO",
        bold: true,
        color: "#52612b",
        margin: [0, 10, 0, 6],
      },
      {
        table: {
          headerRows: 1,
          widths: tableWidths,
          body: [
            report.columns.map((c) => ({
              text: c.title,
              bold: true,
              color: "white",
            })),
            ...report.rows.map((r) =>
              report.columns.map((c) => ({
                text:
                  c.type === "money"
                    ? money(c.value(r))
                    : c.type === "count" && Number.isFinite(Number(c.value(r)))
                      ? Number(c.value(r)).toLocaleString("vi-VN", {
                          maximumFractionDigits: 3,
                        })
                      : clean(c.value(r)),
                alignment: ["money", "count"].includes(c.type)
                  ? "right"
                  : "left",
              })),
            ),
          ],
        },
        layout: {
          fillColor: (i) =>
            i === 0 ? "#52612b" : i % 2 === 0 ? "#f5f5f1" : null,
          hLineWidth: () => 0.4,
          vLineWidth: () => 0,
          hLineColor: () => "#dddfd7",
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
      },
      ...(!report.rows.length
        ? [
            {
              text: "Không có dữ liệu phù hợp với bộ lọc.",
              margin: [0, 12, 0, 0],
            },
          ]
        : []),
    ],
  };
  const doc = render.createPdfKitDocument(definition);
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (x) => chunks.push(x));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}
export async function send(res, report, exportFormat = "xlsx") {
  format({ dinh_dang: exportFormat });
  const body = await (exportFormat === "pdf" ? pdf(report) : excel(report));
  res.set(
    "Content-Type",
    exportFormat === "pdf"
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.set(
    "Content-Disposition",
    `attachment; filename="${report.file}-${report.day}.${exportFormat}"`,
  );
  res.set("X-Export-Rows", String(report.rows.length));
  res.set("Content-Security-Policy", "sandbox; default-src 'none'");
  res.send(body);
}
```

### backend/src/modules/report-exports/report-exports.service.js

```js
import * as financial from "../financial-reports/financial-reports.service.js";
import { ledger } from "../treasury/treasury.service.js";
import { today } from "../billing/billing.validation.js";
import { date, format, reserve, send, time } from "./report-files.js";
const col = (key, title, type = "text", width = 20, pdfWidth = 1) => ({
  title,
  type,
  width,
  pdfWidth,
  value: typeof key === "function" ? key : (r) => r[key],
});
const metric = (label, value, type = "money") => ({ label, value, type });
const all = (v) => v || "Tất cả";
const categories = {
  BO_SUNG_QUY: "Bổ sung quỹ",
  THU_KHAC: "Thu khác",
  VAN_HANH: "Vận hành",
  BAO_TRI: "Bảo trì",
  MUA_SAM: "Mua sắm",
  CHI_KHAC: "Chi khác",
  DIEU_CHINH: "Đảo phiếu",
  THU_HOA_DON: "Thu hóa đơn",
};
const debtViews = {
  CAN_HO: "Theo căn hộ",
  HOA_DON: "Hóa đơn chưa thu",
  THEO_KY: "Tổng hợp theo kỳ",
};
export function debtModel(r) {
  const f = r.filters,
    s = r.summary,
    view = f.che_do;
  let columns;
  if (view === "CAN_HO")
    columns = [
      col("so_can_ho", "Căn hộ"),
      col("khoi", "Khối", "text", 12, 0.5),
      col(
        (x) => x.nguoi_phu_trach || "Chưa gắn chủ hộ",
        "Người phụ trách hiện tại",
        "text",
        28,
        1.4,
      ),
      col("dien_thoai_phu_trach", "Số điện thoại"),
      col("so_hoa_don_chua_thu", "Hóa đơn chưa thu", "count", 18, 0.7),
      col((x) => date(x.han_som_nhat), "Hạn sớm nhất"),
      col("con_phai_thu", "Còn phải thu", "money"),
      col("no_qua_han", "Nợ quá hạn", "money"),
    ];
  else if (view === "HOA_DON")
    columns = [
      col("so_hoa_don", "Hóa đơn"),
      col("so_can_ho", "Căn hộ"),
      col("khoi", "Khối", "text", 12, 0.5),
      col("ky_thanh_toan", "Kỳ hóa đơn"),
      col((x) => date(x.han_thanh_toan), "Hạn thanh toán"),
      col(
        (x) =>
          x.qua_han
            ? "Quá hạn"
            : x.han_thanh_toan
              ? "Chưa quá hạn"
              : "Chưa đặt hạn",
        "Tình trạng",
      ),
      col("tong_tien", "Còn phải thu", "money"),
    ];
  else
    columns = [
      col("ky_thanh_toan", "Kỳ hóa đơn"),
      col("so_hoa_don", "Số hóa đơn", "count", 15, 0.6),
      col("so_hoa_don_da_thu", "Đã thu (hóa đơn)", "count", 18, 0.7),
      col("so_hoa_don_chua_thu", "Chưa thu (hóa đơn)", "count", 18, 0.7),
      col("tong_da_gui", "Tổng đã gửi", "money"),
      col("da_thu", "Đã thu", "money"),
      col("con_phai_thu", "Còn phải thu", "money"),
      col("no_qua_han", "Nợ quá hạn", "money"),
    ];
  return {
    title: `Báo cáo công nợ · ${debtViews[view]}`,
    file: `cong-no-${view.toLowerCase().replaceAll("_", "-")}`,
    day: r.ngay_bao_cao,
    at: r.tai_luc,
    rows: r.data,
    columns,
    filters: [
      ["Từ kỳ", all(f.tu_ky)],
      ["Đến kỳ", all(f.den_ky)],
      ["Khối", all(f.khoi)],
      ["Tìm số căn", all(f.q)],
      ["Mã căn lọc riêng", all(f.ma_can_ho)],
      ["Chỉ quá hạn", f.qua_han === "1" ? "Có" : "Không"],
      ["Xét quá hạn đến", date(r.ngay_bao_cao)],
    ],
    summary: [
      metric("Tổng hóa đơn đã gửi", s.tong_da_gui),
      metric("Đã thu theo kỳ hóa đơn", s.da_thu),
      metric("Còn phải thu", s.con_phai_thu),
      metric("Nợ quá hạn", s.no_qua_han),
      metric("Số căn còn nợ", s.so_can_con_no, "count"),
      metric("Tỷ lệ đã thu (%)", String(s.ty_le_da_thu), "text"),
    ],
    notes: [
      "Công nợ hiện tại của các kỳ đã chọn; không phải số dư hồi tố tại một ngày trong quá khứ.",
      "Tổng hợp tính toàn bộ kỳ/khối/căn đã lọc. Cách xem hóa đơn chỉ liệt kê hóa đơn chưa thu; lọc quá hạn chỉ tác động chi tiết, không đổi tổng hợp.",
      "Ngày đến hạn hôm nay chưa là quá hạn. Người phụ trách là thông tin hiện tại; các bản nháp, chưa gửi và đã hủy không được cộng vào tổng.",
    ],
  };
}
export function collectionModel(r) {
  const f = r.filters,
    s = r.summary,
    grouped = f.che_do === "THEO_NGAY";
  return {
    title: `Báo cáo thu phí · ${grouped ? "Tổng hợp theo ngày" : "Các khoản đã thu"}`,
    file: `thu-phi-${grouped ? "theo-ngay" : "giao-dich"}`,
    day: r.ngay_bao_cao,
    at: r.tai_luc,
    rows: r.data,
    filters: [
      ["Từ ngày xác nhận", date(f.tu_ngay)],
      ["Đến ngày xác nhận", date(f.den_ngay)],
      ["Khối", all(f.khoi)],
      ["Tìm số căn", all(f.q)],
      ["Mã căn lọc riêng", all(f.ma_can_ho)],
    ],
    summary: [
      metric("Đã ghi nhận thu", s.tong_da_thu),
      metric("Số khoản thu", s.so_khoan_thu, "count"),
      metric("Số căn đã thu", s.so_can_da_thu, "count"),
    ],
    columns: grouped
      ? [
          col((x) => date(x.ngay_thu), "Ngày thu"),
          col("so_khoan_thu", "Số khoản thu", "count"),
          col("da_thu", "Đã thu", "money"),
        ]
      : [
          col("so_hoa_don", "Hóa đơn"),
          col("so_can_ho", "Căn hộ"),
          col("khoi", "Khối", "text", 12, 0.5),
          col("ky_thanh_toan", "Kỳ hóa đơn"),
          col(
            (x) => time(x.ngay_thanh_toan),
            "Thời điểm xác nhận (VN)",
            "text",
            28,
            1.3,
          ),
          col("ma_tham_chieu", "Mã tham chiếu", "text", 28, 1.2),
          col("nguoi_xac_nhan", "Người xác nhận", "text", 28, 1.2),
          col("so_tien_da_thu", "Đã thu", "money"),
        ],
    notes: [
      "Theo thời điểm BQL xác nhận thu trên phần mềm, quy đổi giờ Việt Nam, không phải kỳ hóa đơn hoặc ngày chuyển khoản ngân hàng.",
      "Khoảng ngày tính cả ngày đầu và ngày cuối. Chỉ các hóa đơn đã xác nhận thu mới được đưa vào báo cáo.",
    ],
  };
}
export function ledgerModel(r) {
  const f = r.filters,
    s = r.summary,
    grouped = f.che_do === "THEO_THANG";
  return {
    title: `Sổ quỹ · ${r.fund.ten_quy} · ${grouped ? "Theo tháng" : "Từng khoản thu / chi"}`,
    file: `so-quy-${r.fund.ma_quy}-${grouped ? "theo-thang" : "giao-dich"}`,
    day: today(),
    at: r.tai_luc,
    rows: r.data,
    filters: [
      ["Quỹ", r.fund.ten_quy],
      ["Từ ngày hạch toán", date(f.tu_ngay)],
      ["Đến ngày hạch toán", date(f.den_ngay)],
      [
        "Nguồn chi tiết",
        f.nguon === "PHIEU"
          ? "Phiếu thu / chi"
          : f.nguon === "HOA_DON"
            ? "Hóa đơn"
            : "Tất cả",
      ],
      [
        "Loại chi tiết",
        f.loai === "THU" ? "Thu" : f.loai === "CHI" ? "Chi" : "Tất cả",
      ],
      ["Tìm kiếm", all(f.q)],
    ],
    summary: [
      metric("Đầu kỳ", s.dau_ky),
      metric("Thu trong kỳ", s.tong_thu),
      metric("Chi trong kỳ", s.tong_chi),
      metric("Cuối kỳ", s.cuoi_ky),
    ],
    columns: grouped
      ? [
          col("ky", "Tháng"),
          col("tong_thu", "Tổng thu", "money"),
          col("tong_chi", "Tổng chi", "money"),
          col(
            (x) => (BigInt(x.tong_thu) - BigInt(x.tong_chi)).toString(),
            "Chênh lệch",
            "money",
          ),
        ]
      : [
          col((x) => date(x.ngay), "Ngày hạch toán", "text", 20, 0.8),
          col("so_chung_tu", "Chứng từ"),
          col(
            (x) => (x.nguon === "HOA_DON" ? "Hóa đơn" : "Phiếu thu / chi"),
            "Nguồn",
            "text",
            18,
            0.8,
          ),
          col((x) => categories[x.nhom] || x.nhom, "Nhóm", "text", 20, 0.8),
          col("doi_tac", "Người nộp / nhận", "text", 28, 1.2),
          col("dien_giai", "Diễn giải", "text", 60, 2.4),
          col(
            (x) => (x.loai === "THU" ? x.so_tien : "0"),
            "Thu",
            "money",
            22,
            1.1,
          ),
          col(
            (x) => (x.loai === "CHI" ? x.so_tien : "0"),
            "Chi",
            "money",
            22,
            1.1,
          ),
        ],
    notes: [
      "Số dư theo dữ liệu đã ghi nhận, cần đối soát tiền mặt và ngân hàng thực tế. Hạch toán lùi ngày có thể làm thay đổi số dư quá khứ.",
      "Tổng hợp là toàn quỹ trong khoảng ngày; nguồn/loại/tìm kiếm chỉ lọc chi tiết từng khoản. Chế độ tháng tổng hợp toàn quỹ, các tháng biên chỉ tính ngày thuộc khoảng đã chọn.",
      "Chỉ tính phiếu đã ghi sổ và hóa đơn đã xác nhận thu. Phiếu gốc và phiếu đảo đều được giữ để thể hiện đầy đủ lịch sử, không cộng lại một hóa đơn thành phiếu thu.",
    ],
  };
}
export async function download(req, res, kind, id) {
  const exportFormat = format(req.query);
  let release;
  try {
    release = reserve(req.user.ma_nguoi_dung);
    const result =
      kind === "cong_no"
        ? await financial.debts(req.query, exportFormat)
        : kind === "thu_phi"
          ? await financial.collections(req.query, exportFormat)
          : await ledger(id, req.query, exportFormat);
    const model =
      kind === "cong_no"
        ? debtModel(result)
        : kind === "thu_phi"
          ? collectionModel(result)
          : ledgerModel(result);
    await send(res, model, exportFormat);
  } catch (error) {
    if (error.code === "EXPORT_BUSY") res.set("Retry-After", "3");
    throw error;
  } finally {
    release?.();
  }
}
```

### backend/src/modules/data-exchange/export.service.js

```js
import * as residency from "../residency/residency.service.js";
import * as vehicles from "../vehicles/vehicles.service.js";
import * as billing from "../billing/billing.service.js";
import * as maintenance from "../maintenance/maintenance.service.js";
import * as amenities from "../amenities/amenities.service.js";
import { date, send } from "../report-exports/report-files.js";
import { today } from "../billing/billing.validation.js";
import { catalog } from "./catalog.js";

const configs = {
  can_ho: {
    read: (q, u, f) => residency.listApartments(q, f),
    filters: ["q", "tang"],
    columns: [
      ["ma_can_ho", "Mã căn"],
      ["so_can_ho", "Căn hộ"],
      ["khoi", "Khối"],
      ["tang", "Tầng", "count"],
      ["dien_tich_m2", "Diện tích (m²)", "count"],
      ["so_cu_dan", "Cư dân đang ở", "count"],
      ["tinh_phi_dich_vu", "Tính phí dịch vụ", "flag"],
    ],
  },
  cu_dan: {
    read: (q, u, f) => residency.listResidents(q, f),
    filters: ["q", "ma_can_ho", "ma_cu_dan", "trang_thai"],
    columns: [
      ["ma_cu_dan", "Mã cư dân"],
      ["ho_va_ten", "Họ tên"],
      ["so_dien_thoai", "Điện thoại"],
      ["so_can_ho", "Căn đang ở"],
      ["quan_he", "Quan hệ"],
      ["tu_ngay", "Ngày vào", "date"],
    ],
  },
  phuong_tien: {
    read: (q, u, f) => vehicles.list(q, f),
    filters: ["q", "loai_xe", "trang_thai", "ma_can_ho", "ma_cu_dan"],
    columns: [
      ["ma_dang_ky", "Mã đăng ký"],
      ["ma_cu_dan", "Mã cư dân"],
      ["ho_va_ten", "Cư dân"],
      ["so_can_ho", "Căn hộ"],
      ["loai_xe", "Loại xe"],
      ["bien_so", "Biển số"],
      ["ngay_dang_ky", "Ngày đăng ký", "date"],
      ["ngay_ket_thuc", "Ngày kết thúc", "date"],
    ],
  },
  chi_so: {
    read: (q, u, f) => billing.meters(q, f),
    filters: ["ma_can_ho", "ky_thanh_toan"],
    columns: [
      ["so_can_ho", "Căn hộ"],
      ["loai_dich_vu", "Dịch vụ"],
      ["ky_thanh_toan", "Kỳ"],
      ["chi_so_cu", "Chỉ số cũ", "count"],
      ["chi_so_moi", "Chỉ số mới", "count"],
      ["ngay_chot", "Ngày chốt", "date"],
      ["ghi_chu", "Ghi chú"],
    ],
  },
  thiet_bi: {
    read: (q, u, f) => maintenance.equipmentList(q, f),
    filters: ["q", "loai", "trang_thai", "lich"],
    columns: [
      ["ma_tai_san", "Mã tài sản"],
      ["ten_thiet_bi", "Tên thiết bị"],
      ["loai", "Loại"],
      ["vi_tri", "Vị trí"],
      ["so_serial", "Serial"],
      ["trang_thai", "Trạng thái"],
      ["chu_ky_ngay", "Chu kỳ (ngày)"],
      ["ngay_bao_tri_tiep_theo", "Bảo trì kế tiếp", "date"],
    ],
  },
  hoa_don: {
    read: billing.list,
    filters: ["q", "ma_can_ho", "ky_thanh_toan", "trang_thai"],
    columns: [
      ["so_hoa_don", "Số hóa đơn"],
      ["so_can_ho", "Căn hộ"],
      ["ky_thanh_toan", "Kỳ"],
      ["ngay_chot_phi", "Ngày chốt", "date"],
      ["trang_thai", "Trạng thái"],
      ["tong_tien", "Tổng tiền", "money"],
      ["han_thanh_toan", "Hạn trả", "date"],
    ],
  },
  bao_tri: {
    read: maintenance.jobs,
    filters: ["q", "ma_thiet_bi", "loai", "trang_thai", "qua_han"],
    columns: [
      ["ma_phieu_bao_tri", "Mã phiếu"],
      ["ma_tai_san", "Mã tài sản"],
      ["ten_thiet_bi_luc_lap", "Thiết bị"],
      ["tieu_de", "Công việc"],
      ["loai", "Loại"],
      ["ngay_den_han", "Đến hạn", "date"],
      ["trang_thai", "Trạng thái"],
      ["ky_thuat_vien", "Kỹ thuật viên"],
    ],
  },
  dat_lich: {
    read: amenities.bookings,
    filters: ["q", "ma_tien_ich", "ngay", "trang_thai"],
    columns: [
      ["ma_dat_lich", "Mã lượt"],
      ["ten_tien_ich", "Tiện ích"],
      ["ten_nguoi_dat", "Người đặt"],
      ["so_can_ho", "Căn hộ"],
      ["bat_dau", "Bắt đầu (giờ VN)"],
      ["ket_thuc", "Kết thúc (giờ VN)"],
      ["so_nguoi", "Số người", "count"],
      ["trang_thai", "Trạng thái"],
    ],
  },
};
const labels = {
  q: "Tìm kiếm",
  tang: "Tầng",
  ma_can_ho: "Mã căn",
  ma_cu_dan: "Mã cư dân",
  loai_xe: "Loại xe",
  trang_thai: "Trạng thái",
  ky_thanh_toan: "Kỳ",
  loai: "Loại",
  lich: "Lịch bảo trì",
  ma_thiet_bi: "Mã thiết bị",
  qua_han: "Quá hạn",
  ma_tien_ich: "Mã tiện ích",
  ngay: "Ngày",
};
export async function exportData(kind, query, user, format, res) {
  const config = configs[kind],
    filters = Object.fromEntries(
      config.filters
        .filter((k) => query[k] !== undefined && query[k] !== "")
        .map((k) => [k, query[k]]),
    );
  const result = await config.read(filters, user, format);
  const report = {
    currency: kind === "hoa_don",
    title: `Danh sách ${catalog[kind].title.toLowerCase()}`,
    file: `danh-sach-${kind.replaceAll("_", "-")}`,
    day: today(),
    at: new Date().toISOString().slice(0, 19).replace("T", " "),
    rows: result.data,
    filters: Object.entries(filters).map(([k, v]) => [labels[k], v]),
    summary: [
      {
        label: "Số dòng theo bộ lọc",
        value: result.data.length,
        type: "count",
      },
    ],
    notes: [
      "Tệp danh sách phục vụ đối chiếu và báo cáo. Để nhập mới, dùng tệp mẫu tại Nhập / xuất dữ liệu.",
      "Không bao gồm mật khẩu hoặc thông tin phiên đăng nhập.",
    ],
    columns: config.columns.map(([key, title, type]) => ({
      title,
      type: ["count", "money"].includes(type) ? type : "text",
      width: /tên|việc|thiết bị|Ghi chú/i.test(title) ? 32 : 21,
      pdfWidth: /tên|việc|thiết bị|Ghi chú/i.test(title) ? 1.7 : 1,
      value: (row) =>
        type === "date"
          ? date(row[key])
          : type === "flag"
            ? row[key]
              ? "Có"
              : "Không"
            : (row[key] ?? ""),
    })),
  };
  await send(res, report, format);
}
```
