# Code frontend đầy đủ — sửa Excel và menu

[Quay lại hướng dẫn cập nhật](../cap-nhat-excel-va-menu-vscode.md). Chép nội dung vào đúng đường dẫn; đây là bản đầy đủ nghiệp vụ trên nhánh `codex/editorial-business-ui`.

## frontend/src/shared/ReportExport.jsx

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
            ? "Máy chủ chưa trả được tệp Excel. Kiểm tra backend đang chạy và lỗi trong terminal backend rồi thử lại."
            : `Không tải được tệp Excel (${r.status}).`);
        throw new Error(message);
      }
      const mime =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
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
          : `Đã tạo tệp Excel gồm ${Number(r.headers.get("X-Export-Rows") || 0).toLocaleString("vi-VN")} dòng. Excel mở tại trang Chi tiết; bộ lọc và số liệu chung nằm ở trang Tổng hợp. Kiểm tra mục Tệp đã tải xuống của trình duyệt.`,
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
      aria-label={template ? "Tải mẫu Excel" : "Xuất báo cáo Excel"}
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
        <small>
          {template
            ? "Mẫu trống .xlsx: điền sheet Nhap từ dòng 2, tối đa 100 dòng. Ví dụ nằm riêng ở sheet Vi du."
            : "Xuất toàn bộ kết quả theo bộ lọc. Excel có trang Chi tiết và Tổng hợp; mở trực tiếp danh sách chi tiết."}
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

## frontend/src/shared/DataTools.jsx

```jsx
import React from "react";
import { Link } from "react-router-dom";
import ReportExport from "./ReportExport.jsx";
export default function DataTools({
  kind,
  params,
  importable = false,
  disabled = false,
}) {
  return (
    <div className="data-tools">
      <ReportExport
        path={`/trao_doi_du_lieu/${kind}/xuat?${params || ""}`}
        disabled={disabled}
      />
      {importable && (
        <Link className="button" to={`/quan-tri/nhap-xuat?phan_he=${kind}`}>
          Nhập Excel
        </Link>
      )}
    </div>
  );
}
```

## frontend/src/features/data-exchange/DataExchange.jsx

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
      <h1>Nhập / xuất Excel</h1>
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
              Xuất toàn bộ kết quả theo bộ lọc, tối đa 10.000 dòng Excel. Có thể
              xuất theo bộ lọc ngay tại{" "}
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
            Công nợ & thu phí · Excel
          </Link>
          <Link to="/quan-tri/quy">Sổ quỹ · Excel</Link>
        </div>
      </section>
    </>
  );
}
```

## frontend/src/app/navigation.js

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
        ["/quan-tri/nhap-xuat", "Nhập / xuất Excel", "file"],
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

## frontend/src/app/Layout.jsx

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
  const roleLabel = roleNames[user?.vai_tro];
  const showRole = user?.ho_va_ten?.trim() !== roleLabel;
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
          <span className="brand-copy">
            <strong>CHUNG CƯ</strong>
            <small>QUẢN LÝ VẬN HÀNH</small>
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
                  {showRole && <small>{roleLabel}</small>}
                </span>
                <Icon name="chevron" size={16} />
              </summary>
              <div className="profile-dropdown">
                <p>
                  {user.ho_va_ten}
                  {showRole && <small>{roleLabel}</small>}
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

## frontend/src/styles/residence.css

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
