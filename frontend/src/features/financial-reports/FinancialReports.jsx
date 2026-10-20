import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { ErrorBox, Field, Loading, useResource } from "../../shared/ui.jsx";

const money = (n) => `${BigInt(n || 0).toLocaleString("vi-VN")} đ`;
const day = (value) =>
  value ? value.split("-").reverse().join("/") : "Chưa đặt hạn";
const time = (value) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value.replace(" ", "T") + "Z"))
    : "—";
function Metric({ label, amount, hint, tone = "", onClick, selected }) {
  const body = (
    <>
      <span className="finance-metric-label">{label}</span>
      <strong>{money(amount)}</strong>
      <small>{hint}</small>
    </>
  );
  return onClick ? (
    <button
      className={`finance-metric ${tone}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {body}
    </button>
  ) : (
    <div className={`finance-metric ${tone}`}>{body}</div>
  );
}
function Pager({ result, loading, go }) {
  return (
    <div className="actions finance-pager">
      <button
        disabled={loading || (result?.page || 1) <= 1}
        onClick={() => go(result.page - 1)}
      >
        Trang trước
      </button>
      <span>
        Trang {result?.page || 1} · {result?.total || 0} bản ghi
      </span>
      <button
        disabled={loading || (result?.page || 1) * 20 >= (result?.total || 0)}
        onClick={() => go(result.page + 1)}
      >
        Trang sau
      </button>
    </div>
  );
}
// Tag results with their request so switching report types never renders stale columns/totals.
function useReport(path) {
  const [state, setState] = useState({ loading: true }),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ path, revision, loading: true });
    getJson(path, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted)
          setState({ path, revision, result, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ path, revision, error, loading: false });
      });
    return () => controller.abort();
  }, [path, revision]);
  return {
    ...(state.path === path && state.revision === revision
      ? state
      : { loading: true }),
    reload: () => setRevision((n) => n + 1),
  };
}

function OverdueFilter({ value, loading, label, onChange }) {
  const [checked, setChecked] = useState(value);
  useEffect(() => setChecked(value), [value]);
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        disabled={loading}
        checked={checked}
        onChange={(e) => {
          const next = e.target.checked;
          // Reflect the click immediately while router navigation updates the URL.
          setChecked(next);
          onChange(next);
        }}
      />
      {label}
    </label>
  );
}

export default function FinancialReports() {
  const calendarDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [params, setParams] = useSearchParams();
  const cash = params.get("bao_cao") === "THU_PHI",
    endpoint = cash ? "thu_phi" : "cong_no";
  const query = new URLSearchParams(params);
  query.delete("bao_cao");
  const resource = useReport(`/bao_cao/${endpoint}?${query}`),
    blocks = useResource("/bao_cao/bo_loc"),
    result = resource.result,
    f = result?.filters,
    s = result?.summary;
  const view = params.get("che_do") || (cash ? "GIAO_DICH" : "CAN_HO"),
    overdue = params.get("qua_han") === "1";
  function setView(che_do, more = {}) {
    const next = new URLSearchParams(params);
    next.set("che_do", che_do);
    next.delete("page");
    next.delete("qua_han");
    for (const [k, v] of Object.entries(more)) next.set(k, v);
    setParams(next);
  }
  function switchReport(report) {
    const next = new URLSearchParams();
    next.set("bao_cao", report);
    for (const k of ["khoi", "q"])
      if (params.get(k)) next.set(k, params.get(k));
    setParams(next);
  }
  function showApartment(id) {
    setView("HOA_DON", { ma_can_ho: String(id) });
  }
  const billLink = (b) => (
    <Link to={`/quan-tri/hoa-don/${b.ma_hoa_don}`}>{b.so_hoa_don}</Link>
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Theo dõi tài chính</p>
          <h1>Báo cáo công nợ và thu phí</h1>
        </div>
        <button disabled={resource.loading} onClick={resource.reload}>
          Cập nhật số liệu
        </button>
      </div>
      <div className="finance-tabs" role="group" aria-label="Loại báo cáo">
        <button
          className={!cash ? "primary" : ""}
          aria-pressed={!cash}
          onClick={() => switchReport("CONG_NO")}
        >
          Công nợ theo kỳ hóa đơn
        </button>
        <button
          className={cash ? "primary" : ""}
          aria-pressed={cash}
          onClick={() => switchReport("THU_PHI")}
        >
          Thu phí theo ngày xác nhận
        </button>
      </div>
      <p className="muted">
        {cash
          ? "Tổng tiền BQL đã ghi nhận thu trong khoảng ngày tại Việt Nam, gồm cả khoản thu cho kỳ hóa đơn cũ. Thời điểm xác nhận có thể khác ngày cư dân chuyển khoản."
          : "Công nợ hiện tại của các kỳ hóa đơn đã chọn. Tổng đã gửi = đã thu + còn phải thu; nợ quá hạn nằm trong số còn phải thu. Mặc định xem tất cả kỳ để không bỏ sót nợ cũ."}
      </p>
      <form
        className="filters finance-filters"
        key={`${endpoint}:${params}`}
        onSubmit={(e) => {
          e.preventDefault();
          const next = new URLSearchParams(
            Object.fromEntries(new FormData(e.currentTarget)),
          );
          next.set("bao_cao", cash ? "THU_PHI" : "CONG_NO");
          next.set("che_do", view);
          if (!cash && overdue && view !== "THEO_KY") next.set("qua_han", "1");
          setParams(next);
        }}
      >
        {cash ? (
          <>
            <Field
              label="Từ ngày xác nhận"
              type="date"
              name="tu_ngay"
              required
              max={calendarDay}
              defaultValue={
                params.get("tu_ngay") || `${calendarDay.slice(0, 7)}-01`
              }
            />
            <Field
              label="Đến ngày xác nhận"
              type="date"
              name="den_ngay"
              required
              max={calendarDay}
              defaultValue={params.get("den_ngay") || calendarDay}
            />
          </>
        ) : (
          <>
            <Field
              label="Từ kỳ hóa đơn"
              type="month"
              name="tu_ky"
              defaultValue={params.get("tu_ky") || ""}
            />
            <Field
              label="Đến kỳ hóa đơn"
              type="month"
              name="den_ky"
              defaultValue={params.get("den_ky") || ""}
            />
          </>
        )}
        <Field label="Khối">
          <select name="khoi" defaultValue={params.get("khoi") || ""}>
            <option value="">Tất cả khối</option>
            {params.get("khoi") &&
              !blocks.result?.data.some(
                (b) => b.khoi === params.get("khoi"),
              ) && (
                <option value={params.get("khoi")}>{params.get("khoi")}</option>
              )}
            {blocks.result?.data.map((b) => (
              <option value={b.khoi} key={b.khoi}>
                {b.khoi}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Tìm số căn hộ"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        {params.get("ma_can_ho") && (
          <input
            type="hidden"
            name="ma_can_ho"
            value={params.get("ma_can_ho")}
          />
        )}
        <button className="primary" disabled={resource.loading}>
          Xem báo cáo
        </button>
        <button
          type="button"
          onClick={() => setParams({ bao_cao: cash ? "THU_PHI" : "CONG_NO" })}
        >
          Xóa bộ lọc
        </button>
      </form>
      <ErrorBox error={blocks.error} />
      <ErrorBox error={resource.error} />
      {resource.loading && <Loading />}
      {s && (
        <>
          <p className="finance-snapshot">
            Dữ liệu lúc {time(result.tai_luc)} · Giờ Việt Nam
            {!cash && ` · Xét quá hạn đến ${day(result.ngay_bao_cao)}`}
          </p>
          {cash ? (
            <div
              className="finance-metrics finance-metrics-cash"
              aria-label="Tổng hợp thu phí"
            >
              <Metric
                label="Đã ghi nhận thu"
                amount={s.tong_da_thu}
                hint={`${s.so_khoan_thu} khoản · ${s.so_can_da_thu} căn hộ`}
                tone="is-paid"
              />
              <div className="finance-date-range">
                <span>Khoảng ngày xác nhận</span>
                <strong>
                  {day(f.tu_ngay)} — {day(f.den_ngay)}
                </strong>
                <small>
                  Theo thời điểm xác nhận trên hệ thống, không phải kỳ hóa đơn.
                </small>
              </div>
            </div>
          ) : (
            <>
              <div className="finance-metrics" aria-label="Tổng hợp công nợ">
                <Metric
                  label="Tổng đã gửi"
                  amount={s.tong_da_gui}
                  hint={`${s.so_hoa_don} hóa đơn đã gửi hoặc đã thu`}
                />
                <Metric
                  label="Đã thu theo kỳ hóa đơn"
                  amount={s.da_thu}
                  hint={`${s.so_hoa_don_da_thu} hóa đơn đã thu`}
                  tone="is-paid"
                />
                <Metric
                  label="Còn phải thu"
                  amount={s.con_phai_thu}
                  hint={`${s.so_hoa_don_chua_thu} hóa đơn · ${s.so_can_con_no} căn còn nợ`}
                  onClick={() => setView("CAN_HO")}
                  selected={view === "CAN_HO" && !overdue}
                />
                <Metric
                  label="Nợ quá hạn"
                  amount={s.no_qua_han}
                  hint={`${s.so_hoa_don_qua_han} hóa đơn quá hạn · Bấm để xem`}
                  tone="is-overdue"
                  onClick={() => setView("HOA_DON", { qua_han: "1" })}
                  selected={view === "HOA_DON" && overdue}
                />
              </div>
              <div className="finance-progress">
                <div>
                  <strong>
                    Tỷ lệ đã thu:{" "}
                    {s.ty_le_da_thu.toLocaleString("vi-VN", {
                      maximumFractionDigits: 2,
                    })}
                    %
                  </strong>
                  <span>Tính theo giá trị hóa đơn</span>
                </div>
                <progress
                  value={s.ty_le_da_thu}
                  max="100"
                  aria-label="Tỷ lệ đã thu theo giá trị hóa đơn"
                />
              </div>
              <p className="muted">
                Không tính bản nháp, hóa đơn chưa gửi hoặc đã hủy. Đây là số dư
                hiện tại, không phải số dư hồi tố tại một ngày trong quá khứ.
              </p>
            </>
          )}
        </>
      )}
      <section className="card finance-results" aria-label="Chi tiết báo cáo">
        <div
          className="finance-tabs"
          role="group"
          aria-label="Cách xem chi tiết"
        >
          {(cash
            ? [
                ["GIAO_DICH", "Các khoản đã thu"],
                ["THEO_NGAY", "Tổng hợp theo ngày"],
              ]
            : [
                ["CAN_HO", "Công nợ theo căn"],
                ["HOA_DON", "Hóa đơn chưa thu"],
                ["THEO_KY", "Tổng hợp theo kỳ"],
              ]
          ).map(([key, label]) => (
            <button
              key={key}
              aria-pressed={view === key}
              className={view === key ? "primary" : ""}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {!cash && view !== "THEO_KY" && (
          <OverdueFilter
            value={overdue}
            loading={resource.loading}
            label={
              view === "CAN_HO"
                ? "Chỉ căn có nợ quá hạn"
                : "Chỉ hóa đơn quá hạn"
            }
            onChange={(checked) =>
              setView(view, { qua_han: checked ? "1" : "0" })
            }
          />
        )}
        {params.get("ma_can_ho") && (
          <p className="note">
            Đang xem riêng căn đã chọn.{" "}
            <button
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("ma_can_ho");
                next.delete("page");
                setParams(next);
              }}
            >
              Xem mọi căn trong bộ lọc
            </button>
          </p>
        )}
        {!cash && (
          <p className="muted">
            Các số tổng ở trên theo bộ lọc kỳ/khối/căn. Chọn cách xem hoặc chỉ
            xem quá hạn chỉ đổi bảng chi tiết.
            {view === "CAN_HO" &&
              " Mỗi căn vẫn gồm toàn bộ nợ của các kỳ đã chọn. Người phụ trách là người hiện tại, không tự thay nghĩa vụ tài chính của hóa đơn cũ."}
          </p>
        )}
        {result && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {cash ? (
                      view === "THEO_NGAY" ? (
                        <>
                          <th>Ngày xác nhận (VN)</th>
                          <th>Số khoản</th>
                          <th>Đã thu</th>
                        </>
                      ) : (
                        <>
                          <th>Hóa đơn</th>
                          <th>Căn / khối / kỳ</th>
                          <th>Thời điểm xác nhận (VN)</th>
                          <th>Tham chiếu</th>
                          <th>Người xác nhận</th>
                          <th>Số tiền đã thu</th>
                        </>
                      )
                    ) : view === "CAN_HO" ? (
                      <>
                        <th>Căn / khối</th>
                        <th>Người phụ trách hiện tại</th>
                        <th>Hóa đơn chưa thu</th>
                        <th>Hạn sớm nhất</th>
                        <th>Còn phải thu</th>
                        <th>Nợ quá hạn</th>
                        <th>Chi tiết</th>
                      </>
                    ) : view === "HOA_DON" ? (
                      <>
                        <th>Hóa đơn</th>
                        <th>Căn / khối</th>
                        <th>Kỳ hóa đơn</th>
                        <th>Hạn thanh toán</th>
                        <th>Tình trạng</th>
                        <th>Còn phải thu</th>
                        <th>Xử lý</th>
                      </>
                    ) : (
                      <>
                        <th>Kỳ hóa đơn</th>
                        <th>Số hóa đơn</th>
                        <th>Tổng đã gửi</th>
                        <th>Đã thu</th>
                        <th>Còn phải thu</th>
                        <th>Nợ quá hạn</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((r, i) => (
                    <tr
                      key={
                        r.ma_hoa_don ||
                        r.ma_can_ho ||
                        r.ky_thanh_toan ||
                        r.ngay_thu ||
                        i
                      }
                    >
                      {cash ? (
                        view === "THEO_NGAY" ? (
                          <>
                            <td>{day(r.ngay_thu)}</td>
                            <td>{r.so_khoan_thu}</td>
                            <td className="finance-number">
                              {money(r.da_thu)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{billLink(r)}</td>
                            <td>
                              {r.so_can_ho} · {r.khoi}
                              <br />
                              {r.ky_thanh_toan}
                            </td>
                            <td>{time(r.ngay_thanh_toan)}</td>
                            <td>{r.ma_tham_chieu}</td>
                            <td>{r.nguoi_xac_nhan || "—"}</td>
                            <td className="finance-number">
                              {money(r.so_tien_da_thu)}
                            </td>
                          </>
                        )
                      ) : view === "CAN_HO" ? (
                        <>
                          <td>
                            <strong>{r.so_can_ho}</strong>
                            <br />
                            Khối {r.khoi}
                          </td>
                          <td>
                            {r.nguoi_phu_trach || "Chưa gắn chủ hộ"}
                            {r.dien_thoai_phu_trach && (
                              <small className="finance-contact">
                                {r.dien_thoai_phu_trach}
                              </small>
                            )}
                          </td>
                          <td>{r.so_hoa_don_chua_thu}</td>
                          <td>{day(r.han_som_nhat)}</td>
                          <td className="finance-number">
                            {money(r.con_phai_thu)}
                          </td>
                          <td
                            className={`finance-number ${r.no_qua_han !== "0" ? "finance-overdue" : ""}`}
                          >
                            {money(r.no_qua_han)}
                          </td>
                          <td>
                            <button onClick={() => showApartment(r.ma_can_ho)}>
                              Xem hóa đơn
                            </button>
                          </td>
                        </>
                      ) : view === "HOA_DON" ? (
                        <>
                          <td>{billLink(r)}</td>
                          <td>
                            {r.so_can_ho} · {r.khoi}
                          </td>
                          <td>{r.ky_thanh_toan}</td>
                          <td>{day(r.han_thanh_toan)}</td>
                          <td>
                            {r.qua_han ? (
                              <span className="finance-overdue">Quá hạn</span>
                            ) : r.han_thanh_toan ? (
                              "Chưa quá hạn"
                            ) : (
                              "Chưa đặt hạn"
                            )}
                          </td>
                          <td className="finance-number">
                            {money(r.tong_tien)}
                          </td>
                          <td>
                            <Link
                              className="button"
                              to={`/quan-tri/hoa-don/${r.ma_hoa_don}`}
                            >
                              Kiểm tra / nhắc phí
                            </Link>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{r.ky_thanh_toan}</td>
                          <td>{r.so_hoa_don}</td>
                          <td className="finance-number">
                            {money(r.tong_da_gui)}
                          </td>
                          <td className="finance-number">{money(r.da_thu)}</td>
                          <td className="finance-number">
                            {money(r.con_phai_thu)}
                          </td>
                          <td className="finance-number">
                            {money(r.no_qua_han)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.total === 0 && (
              <p className="finance-empty">
                {cash
                  ? "Chưa có khoản thu trong khoảng ngày và bộ lọc đã chọn."
                  : "Không có dữ liệu phù hợp với cách xem và bộ lọc đã chọn."}
              </p>
            )}
            <Pager
              result={result}
              loading={resource.loading}
              go={(page) => {
                const next = new URLSearchParams(params);
                next.set("page", page);
                setParams(next);
              }}
            />
          </>
        )}
      </section>
    </>
  );
}
