import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { newRequestKey } from "../../shared/request-key.js";
import { ErrorBox, Field, Loading } from "../../shared/ui.jsx";
import "./BatchBills.css";

const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const money = (n) => `${BigInt(n).toLocaleString("vi-VN")} đ`;
const decimal = (s) => {
  const [whole, fraction = ""] = String(s).split(".");
  const tail = fraction.replace(/0+$/, "");
  return `${BigInt(whole).toLocaleString("vi-VN")}${tail ? `,${tail}` : ""}`;
};
export default function BatchBills({ onDone, onBusy }) {
  const [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [directory, setDirectory] = useState({ loading: true });
  const [selected, setSelected] = useState([]),
    [month, setMonth] = useState(() => today().slice(0, 7)),
    [date, setDate] = useState(today);
  const [options, setOptions] = useState({
      tinh_nuoc: true,
      tinh_dien: true,
      tinh_xe: true,
    }),
    [preview, setPreview] = useState(null),
    [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [result, setResult] = useState(null);
  const path = `/can_ho?q=${encodeURIComponent(query)}&page=${page}`;
  useEffect(() => {
    const controller = new AbortController();
    setDirectory({ path, loading: true });
    getJson(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setDirectory({ path, data, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setDirectory({ path, error, loading: false });
      });
    return () => controller.abort();
  }, [path]);
  const source = directory.path === path ? directory : { loading: true };
  function edit() {
    setPreview(null);
    setConfirmed(false);
    setResult(null);
    setError(null);
  }
  function toggle(apartment) {
    edit();
    setSelected((old) =>
      old.some((a) => a.ma_can_ho === apartment.ma_can_ho)
        ? old.filter((a) => a.ma_can_ho !== apartment.ma_can_ho)
        : old.length < 50
          ? [...old, apartment]
          : old,
    );
  }
  async function run(commit) {
    setPending(true);
    onBusy(true);
    setError(null);
    try {
      const body = {
        ma_can_ho: selected.map((a) => a.ma_can_ho),
        ky_thanh_toan: month,
        ngay_chot_phi: date,
        ...options,
      };
      if (commit) {
        body.xac_nhan = preview.data.xac_nhan;
        body.khoa_yeu_cau = preview.key;
      }
      const { data } = await getJson(
        `/hoa_don/hang_loat/${commit ? "xac_nhan" : "xem_truoc"}`,
        { method: "POST", body },
      );
      if (commit) {
        setResult(data);
        setPreview(null);
        setConfirmed(false);
        onDone();
      } else {
        setPreview({ data, key: newRequestKey() });
        setConfirmed(false);
      }
    } catch (err) {
      setError(err);
      // A network error may happen after commit. Keep the same UUID/token for an exact retry.
      if (
        !commit ||
        err.status === 409 ||
        err.status === 401 ||
        err.status === 403
      ) {
        setPreview(null);
        setConfirmed(false);
      }
    } finally {
      setPending(false);
      onBusy(false);
    }
  }
  return (
    <section className="card batch-bills" aria-labelledby="batch-title">
      <h2 id="batch-title">Lập hóa đơn hàng loạt</h2>
      <p>
        Chọn tối đa 50 căn mỗi đợt. Xem trước không lưu hóa đơn. Khi xác nhận,
        tất cả căn phải hợp lệ; hệ thống chỉ tạo bản nháp để BQL tiếp tục duyệt
        và gửi.
      </p>
      <ErrorBox error={error} />
      <fieldset disabled={pending}>
        <div className="batch-settings">
          <Field label="Kỳ lập hàng loạt">
            <input
              type="month"
              value={month}
              max={today().slice(0, 7)}
              required
              onChange={(e) => {
                edit();
                setMonth(e.target.value);
              }}
            />
          </Field>
          <Field label="Ngày chốt hàng loạt">
            <input
              type="date"
              value={date}
              max={today()}
              required
              onChange={(e) => {
                edit();
                setDate(e.target.value);
              }}
            />
          </Field>
        </div>
        <p>Phí quản lý theo cấu hình từng căn. Các khoản thu thêm:</p>
        <div className="batch-options">
          {[
            ["tinh_nuoc", "Tiền nước"],
            ["tinh_dien", "Tiền điện"],
            ["tinh_xe", "Phí gửi xe"],
          ].map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={options[key]}
                onChange={(e) => {
                  edit();
                  setOptions((o) => ({ ...o, [key]: e.target.checked }));
                }}
              />
              {label}
            </label>
          ))}
        </div>
        <Field label="Tìm căn cho đợt hóa đơn">
          <input
            type="search"
            value={query}
            maxLength={100}
            placeholder="Nhập số căn hoặc khối"
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </Field>
        <ErrorBox error={source.error} />
        {source.loading && <Loading />}
        {source.data && (
          <>
            <div className="actions">
              <button
                type="button"
                disabled={
                  selected.length +
                    source.data.data.filter(
                      (a) => !selected.some((s) => s.ma_can_ho === a.ma_can_ho),
                    ).length >
                    50 || !source.data.data.length
                }
                onClick={() => {
                  edit();
                  setSelected((old) => [
                    ...old,
                    ...source.data.data.filter(
                      (a) => !old.some((s) => s.ma_can_ho === a.ma_can_ho),
                    ),
                  ]);
                }}
              >
                Chọn các căn trên trang
              </button>
              <button
                type="button"
                disabled={!selected.length}
                onClick={() => {
                  edit();
                  setSelected([]);
                }}
              >
                Bỏ chọn tất cả căn
              </button>
            </div>
            <div className="batch-apartments">
              {source.data.data.map((a) => (
                <label key={a.ma_can_ho}>
                  <input
                    type="checkbox"
                    checked={selected.some((s) => s.ma_can_ho === a.ma_can_ho)}
                    disabled={
                      selected.length >= 50 &&
                      !selected.some((s) => s.ma_can_ho === a.ma_can_ho)
                    }
                    onChange={() => toggle(a)}
                  />
                  <span>
                    {a.so_can_ho}
                    <small>
                      Khối {a.khoi} · Tầng {a.tang} · {decimal(a.dien_tich_m2)}{" "}
                      m²
                    </small>
                  </span>
                </label>
              ))}
            </div>
            {!source.data.total && <p>Không có căn phù hợp.</p>}
            <div className="actions">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trang căn trước
              </button>
              <span>
                Trang {page} · {source.data.total} căn
              </span>
              <button
                type="button"
                disabled={page * 20 >= source.data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang căn sau
              </button>
            </div>
          </>
        )}
        <div className="batch-selection">
          <strong>Đã chọn {selected.length}/50 căn</strong>
          <div className="actions">
            {selected.map((a) => (
              <button
                key={a.ma_can_ho}
                type="button"
                aria-label={`Bỏ căn ${a.so_can_ho}`}
                onClick={() => toggle(a)}
              >
                {a.so_can_ho} ×
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          disabled={!selected.length || !month || !date}
          onClick={() => run(false)}
        >
          {pending ? "Đang xử lý…" : "Xem trước đợt hóa đơn"}
        </button>
        {preview && (
          <div className="batch-preview">
            <h3>Kiểm tra trước khi tạo</h3>
            <p>
              {preview.data.so_can} căn · {preview.data.so_can_loi} căn lỗi ·
              Tổng căn hợp lệ: <strong>{money(preview.data.tong_tien)}</strong>
            </p>
            {preview.data.so_can_loi > 0 && (
              <p className="note">
                Chưa lưu căn nào. Bổ sung dữ liệu hoặc bỏ các căn lỗi rồi xem
                trước lại.
              </p>
            )}
            {preview.data.so_can_loi > 0 &&
              preview.data.so_can_loi < preview.data.so_can && (
                <button
                  type="button"
                  onClick={() => {
                    const valid = new Set(
                      preview.data.rows
                        .filter((r) => !r.loi.length)
                        .map((r) => r.ma_can_ho),
                    );
                    edit();
                    setSelected((old) =>
                      old.filter((a) => valid.has(a.ma_can_ho)),
                    );
                  }}
                >
                  Chỉ giữ căn hợp lệ
                </button>
              )}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Căn hộ</th>
                    <th>Tạm tính</th>
                    <th>Kiểm tra và khoản thu</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.data.rows.map((r) => (
                    <tr key={r.ma_can_ho}>
                      <td>
                        {r.so_can_ho} · {r.khoi}
                      </td>
                      <td>{money(r.tong_tien)}</td>
                      <td>
                        {r.loi.length ? (
                          <ul>
                            {r.loi.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        ) : (
                          <span>Hợp lệ</span>
                        )}
                        <details>
                          <summary>Xem khoản thu căn {r.so_can_ho}</summary>
                          <ul>
                            {r.chi_tiet.map((l, i) => (
                              <li key={i}>
                                {l.dien_giai}: {decimal(l.so_luong)}{" "}
                                {l.don_vi_tinh} × {decimal(l.don_gia)} ={" "}
                                {money(l.thanh_tien)}
                              </li>
                            ))}
                          </ul>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!preview.data.so_can_loi && (
              <>
                <label className="batch-confirm">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  Tôi đã kiểm tra kỳ, căn hộ và các khoản thu trong bản xem
                  trước.
                </label>
                <button
                  type="button"
                  className="primary"
                  disabled={!confirmed || !preview.data.xac_nhan}
                  onClick={() => run(true)}
                >
                  Xác nhận tạo {preview.data.so_can} bản nháp
                </button>
                <p className="muted">
                  Bản xem trước có hiệu lực 15 phút. Nếu lỗi mạng, bấm xác nhận
                  lại để lấy đúng kết quả của yêu cầu cũ.
                </p>
              </>
            )}
          </div>
        )}
        {result && (
          <div className="batch-result" role="status">
            <h3>
              {result.da_lap_truoc
                ? "Đợt này đã được tạo trước đó"
                : "Đã tạo đợt hóa đơn"}
            </h3>
            <p>
              {result.so_hoa_don} bản nháp · {money(result.tong_tien)}. Chưa
              duyệt hoặc gửi cho cư dân.
            </p>
            <ul>
              {result.hoa_don.map((r) => (
                <li key={r.ma_hoa_don}>
                  <Link to={`/quan-tri/hoa-don/${r.ma_hoa_don}`}>
                    Căn {r.so_can_ho} · Hóa đơn #{r.ma_hoa_don}
                  </Link>{" "}
                  · {money(r.tong_tien)}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                edit();
                setSelected([]);
              }}
            >
              Bắt đầu đợt mới
            </button>
          </div>
        )}
      </fieldset>
    </section>
  );
}
