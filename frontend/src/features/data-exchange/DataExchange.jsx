import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { ErrorBox, Field, Loading, useResource } from "../../shared/ui.jsx";
import ReportExport from "../../shared/ReportExport.jsx";
import { newRequestKey as requestKey } from "../../shared/request-key.js";

function ImportPanel({ config, onDone }) {
  const [file, setFile] = useState(null),
    [templateRows, setTemplateRows] = useState(3),
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
      <Field label="Số hồ sơ trong mẫu PDF">
        <select
          value={templateRows}
          disabled={!!pending}
          onChange={(e) => setTemplateRows(Number(e.target.value))}
        >
          {[1, 3, 5, 10].map((n) => (
            <option key={n} value={n}>
              {n} hồ sơ / {n} trang
            </option>
          ))}
        </select>
      </Field>
      <ReportExport
        path={`/trao_doi_du_lieu/${config.key}/mau?so_dong=${templateRows}`}
        template
        templateRows={templateRows}
        disabled={!!pending}
      />
      <details className="import-help">
        <summary>Hướng dẫn Excel và PDF biểu mẫu</summary>
        <p>
          Excel: điền sheet <strong>Nhap</strong> từ dòng 2, giữ nguyên tên cột.
          Số điện thoại và mã căn cần là văn bản để giữ số 0 đầu. Ngày dùng
          YYYY-MM-DD, số thập phân dùng dấu chấm.
        </p>
        <p>
          PDF: tải mẫu, mở bằng Chrome hoặc Adobe Acrobat, điền các ô rồi chọn{" "}
          <strong>Lưu / Save</strong>. Không dùng In / Print to PDF vì ô điền sẽ
          bị mất. Trang trống được bỏ qua. PDF scan và PDF báo cáo không dùng để
          nhập dữ liệu.
        </p>
        <div className="table-wrap">
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
      <Field label="Chọn tệp Excel hoặc PDF biểu mẫu (tối đa 5 MB)">
        <input
          type="file"
          accept=".xlsx,.pdf"
          disabled={!!pending}
          onChange={(e) => {
            const selected = e.target.files?.[0] || null;
            setFile(selected);
            setPreview(null);
            setResult(null);
            setError(
              selected?.size > 5 * 1024 * 1024
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
          disabled={!file || file.size > 5 * 1024 * 1024 || !!pending}
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
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Dòng / trang</th>
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
              <div className="table-wrap">
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
      <h1>Nhập / xuất Excel và PDF</h1>
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
              Xuất toàn bộ kết quả, tối đa 10.000 dòng Excel hoặc 1.000 dòng
              PDF. Có thể xuất theo bộ lọc ngay tại{" "}
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
        <div className="table-wrap">
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
