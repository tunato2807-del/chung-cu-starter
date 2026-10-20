import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { newRequestKey } from "../../shared/request-key.js";
import { ErrorBox, Field, Loading } from "../../shared/ui.jsx";
import { banks, bankName, bankSearch } from "./banks.js";
import "./BatchBills.css";
import "./BatchBillActions.css";

const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const money = (s) => `${BigInt(s).toLocaleString("vi-VN")} đ`;
export default function BatchBillActions({ onDone, onBusy }) {
  const [operation, setOperation] = useState("DUYET"),
    [month, setMonth] = useState(() => today().slice(0, 7)),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [revision, setRevision] = useState(0);
  const [directory, setDirectory] = useState({ loading: true }),
    [selected, setSelected] = useState([]),
    [preview, setPreview] = useState(null),
    [confirmed, setConfirmed] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [result, setResult] = useState(null);
  const [bankQuery, setBankQuery] = useState(""),
    [payment, setPayment] = useState({
      han_thanh_toan: today(),
      ma_ngan_hang: "",
      so_tai_khoan: "",
      ten_nguoi_nhan: "",
    });
  const path = `/hoa_don?trang_thai=${operation === "DUYET" ? "NHAP" : "DA_DUYET"}&ky_thanh_toan=${month}&q=${encodeURIComponent(query)}&page=${page}`;
  useEffect(() => {
    const controller = new AbortController();
    setDirectory({ path, revision, loading: true });
    getJson(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setDirectory({ path, revision, data, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setDirectory({ path, revision, error, loading: false });
      });
    return () => controller.abort();
  }, [path, revision]);
  const source =
    directory.path === path && directory.revision === revision
      ? directory
      : { loading: true };
  const matches = banks.filter((b) =>
    bankSearch(`${b.name} ${b.shortName} ${b.bin}`).includes(
      bankSearch(bankQuery),
    ),
  );
  const currentBank = banks.find((b) => b.bin === payment.ma_ngan_hang);
  function edit() {
    setPreview(null);
    setConfirmed(false);
    setResult(null);
    setError(null);
  }
  function switchOperation(next) {
    edit();
    setOperation(next);
    setSelected([]);
    setPage(1);
  }
  function toggle(bill) {
    edit();
    setSelected((old) =>
      old.some((b) => b.ma_hoa_don === bill.ma_hoa_don)
        ? old.filter((b) => b.ma_hoa_don !== bill.ma_hoa_don)
        : old.length < 50
          ? [...old, bill]
          : old,
    );
  }
  function changePayment(key, value) {
    edit();
    setPayment((old) => ({ ...old, [key]: value }));
  }
  async function run(commit) {
    setPending(true);
    onBusy(true);
    setError(null);
    try {
      const body = {
        thao_tac: operation,
        hoa_don: selected.map((b) => ({
          ma_hoa_don: b.ma_hoa_don,
          phien_ban: b.phien_ban,
        })),
        ...(operation === "GUI" ? payment : {}),
      };
      if (commit) {
        body.xac_nhan = preview.data.xac_nhan;
        body.khoa_yeu_cau = preview.key;
      }
      const { data } = await getJson(
        `/hoa_don/xu_ly_hang_loat/${commit ? "xac_nhan" : "xem_truoc"}`,
        { method: "POST", body },
      );
      if (commit) {
        setResult(data);
        setSelected([]);
        setPreview(null);
        setConfirmed(false);
        setRevision((n) => n + 1);
        onDone();
      } else {
        setPreview({ data, key: newRequestKey() });
        setConfirmed(false);
      }
    } catch (error) {
      setError(error);
      if (!commit || [401, 403, 409].includes(error.status)) {
        setPreview(null);
        setConfirmed(false);
      }
    } finally {
      setPending(false);
      onBusy(false);
    }
  }
  return (
    <section
      className="card batch-bills batch-actions"
      aria-labelledby="bill-actions-title"
    >
      <h2 id="bill-actions-title">Duyệt và gửi hóa đơn hàng loạt</h2>
      <p>
        Mỗi đợt chọn tối đa 50 hóa đơn. Xem trước chỉ kiểm tra; xác nhận chỉ
        thực hiện khi toàn bộ đợt còn hợp lệ.
      </p>
      <ErrorBox error={error} />
      <fieldset disabled={pending}>
        <div className="batch-settings">
          <Field label="Thao tác hàng loạt">
            <select
              value={operation}
              onChange={(e) => switchOperation(e.target.value)}
            >
              <option value="DUYET">Duyệt bản nháp</option>
              <option value="GUI">Gửi hóa đơn đã duyệt</option>
            </select>
          </Field>
          <Field label="Kỳ hóa đơn cần xử lý">
            <input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setPage(1);
              }}
            />
          </Field>
        </div>
        <p>
          {operation === "DUYET"
            ? "Kiểm tra số liệu, nguồn phí và chi tiết từng bản nháp trước khi chuyển sang Đã duyệt."
            : "Gửi làm hóa đơn hiển thị trong Hóa đơn của tôi trên web cư dân kèm thông tin thanh toán VietQR. Hạn trả và tài khoản nhận bên dưới áp dụng chung cho các hóa đơn đã chọn."}
        </p>
        {operation === "GUI" && (
          <div className="bill-actions-payment">
            <Field label="Hạn thanh toán chung">
              <input
                type="date"
                min={today()}
                value={payment.han_thanh_toan}
                onChange={(e) =>
                  changePayment("han_thanh_toan", e.target.value)
                }
              />
            </Field>
            <Field label="Tìm ngân hàng nhận chung">
              <input
                value={bankQuery}
                maxLength={100}
                onChange={(e) => setBankQuery(e.target.value)}
              />
            </Field>
            <Field label="Ngân hàng nhận chung">
              <select
                value={payment.ma_ngan_hang}
                onChange={(e) => changePayment("ma_ngan_hang", e.target.value)}
              >
                <option value="">Chọn ngân hàng</option>
                {currentBank &&
                  !matches.some((b) => b.bin === currentBank.bin) && (
                    <option value={currentBank.bin}>
                      {currentBank.shortName} — {currentBank.name}
                    </option>
                  )}
                {matches.map((b) => (
                  <option key={b.bin} value={b.bin}>
                    {b.shortName} — {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Số tài khoản nhận chung">
              <input
                value={payment.so_tai_khoan}
                inputMode="numeric"
                maxLength={30}
                onChange={(e) => changePayment("so_tai_khoan", e.target.value)}
              />
            </Field>
            <Field label="Tên người nhận chung">
              <input
                value={payment.ten_nguoi_nhan}
                minLength={2}
                maxLength={100}
                onChange={(e) =>
                  changePayment("ten_nguoi_nhan", e.target.value)
                }
              />
            </Field>
          </div>
        )}
        <Field label="Tìm hóa đơn để xử lý">
          <input
            type="search"
            maxLength={100}
            value={query}
            placeholder="Số hóa đơn hoặc căn hộ"
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </Field>
        <div className="actions bill-actions-tools">
          <button
            type="button"
            onClick={() => {
              edit();
              setSelected([]);
              setRevision((n) => n + 1);
            }}
          >
            Tải lại và chọn lại
          </button>
          <button
            type="button"
            disabled={!selected.length}
            onClick={() => {
              edit();
              setSelected([]);
            }}
          >
            Bỏ chọn mọi hóa đơn
          </button>
        </div>
        <ErrorBox error={source.error} />
        {source.loading && <Loading />}
        {source.data && (
          <>
            <button
              type="button"
              disabled={
                !source.data.data.length ||
                selected.length +
                  source.data.data.filter(
                    (b) => !selected.some((s) => s.ma_hoa_don === b.ma_hoa_don),
                  ).length >
                  50
              }
              onClick={() => {
                edit();
                setSelected((old) => [
                  ...old,
                  ...source.data.data.filter(
                    (b) => !old.some((s) => s.ma_hoa_don === b.ma_hoa_don),
                  ),
                ]);
              }}
            >
              Chọn hóa đơn trên trang
            </button>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Chọn</th>
                    <th>Hóa đơn / căn</th>
                    <th>Kỳ</th>
                    <th>Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {source.data.data.map((b) => (
                    <tr key={b.ma_hoa_don}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Chọn hóa đơn ${b.so_hoa_don}`}
                          checked={selected.some(
                            (s) => s.ma_hoa_don === b.ma_hoa_don,
                          )}
                          disabled={
                            selected.length >= 50 &&
                            !selected.some((s) => s.ma_hoa_don === b.ma_hoa_don)
                          }
                          onChange={() => toggle(b)}
                        />
                      </td>
                      <td>
                        <Link to={`/quan-tri/hoa-don/${b.ma_hoa_don}`}>
                          {b.so_hoa_don}
                        </Link>
                        <small>Căn {b.so_can_ho}</small>
                      </td>
                      <td>{b.ky_thanh_toan}</td>
                      <td>{money(b.tong_tien)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!source.data.total && (
              <p>Không có hóa đơn phù hợp với thao tác và bộ lọc.</p>
            )}
            <div className="actions">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((n) => n - 1)}
              >
                Trang hóa đơn trước
              </button>
              <span>
                Trang {page} · {source.data.total} hóa đơn
              </span>
              <button
                type="button"
                disabled={page * 20 >= source.data.total}
                onClick={() => setPage((n) => n + 1)}
              >
                Trang hóa đơn sau
              </button>
            </div>
          </>
        )}
        <div className="batch-selection">
          <strong>Đã chọn {selected.length}/50 hóa đơn</strong>
          <p className="muted">
            Giữ lựa chọn khi đổi bộ lọc; đổi thao tác sẽ bỏ lựa chọn. Nếu có
            phiên bản mới, bấm Tải lại và chọn lại.
          </p>
          <div className="actions">
            {selected.map((b) => (
              <button
                key={b.ma_hoa_don}
                type="button"
                aria-label={`Bỏ hóa đơn ${b.so_hoa_don}`}
                onClick={() => toggle(b)}
              >
                {b.so_hoa_don} ×
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          disabled={!selected.length}
          onClick={() => run(false)}
        >
          {pending ? "Đang xử lý…" : "Xem trước thao tác"}
        </button>
        {preview && (
          <div className="batch-preview">
            <h3>
              {operation === "DUYET"
                ? "Kiểm tra đợt duyệt"
                : "Kiểm tra đợt gửi"}
            </h3>
            <p>
              {preview.data.so_hoa_don} hóa đơn · {preview.data.so_loi} hóa đơn
              lỗi · Tổng hợp lệ:{" "}
              <strong>{money(preview.data.tong_tien)}</strong>
            </p>
            {operation === "GUI" && (
              <p className="bill-actions-summary">
                Nhận tại <strong>{bankName(payment.ma_ngan_hang)}</strong> ·{" "}
                {payment.so_tai_khoan} · {payment.ten_nguoi_nhan}
                <br />
                Hạn trả: {payment.han_thanh_toan.split("-").reverse().join("/")}
              </p>
            )}
            {!!preview.data.so_loi && (
              <p className="note">
                Chưa xử lý hóa đơn nào. Mở hóa đơn để bổ sung/tính lại, hoặc bỏ
                hóa đơn lỗi rồi xem trước lại.
              </p>
            )}
            {!!preview.data.so_loi &&
              preview.data.so_loi < preview.data.so_hoa_don && (
                <button
                  type="button"
                  onClick={() => {
                    const valid = new Set(
                      preview.data.rows
                        .filter((r) => !r.loi.length)
                        .map((r) => r.ma_hoa_don),
                    );
                    edit();
                    setSelected((old) =>
                      old.filter((b) => valid.has(b.ma_hoa_don)),
                    );
                  }}
                >
                  Chỉ giữ hóa đơn hợp lệ
                </button>
              )}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Hóa đơn / căn</th>
                    <th>Kỳ / tiền</th>
                    <th>Kiểm tra</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.data.rows.map((r) => (
                    <tr key={r.ma_hoa_don}>
                      <td>
                        <Link to={`/quan-tri/hoa-don/${r.ma_hoa_don}`}>
                          {r.so_hoa_don}
                        </Link>
                        <small>Căn {r.so_can_ho}</small>
                      </td>
                      <td>
                        {r.ky_thanh_toan}
                        <br />
                        {money(r.tong_tien)}
                      </td>
                      <td>
                        {r.loi.length ? (
                          <ul>
                            {r.loi.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        ) : (
                          "Hợp lệ"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!preview.data.so_loi && (
              <>
                <label className="batch-confirm">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  {operation === "DUYET"
                    ? "Tôi đã kiểm tra và đồng ý duyệt các hóa đơn đã chọn."
                    : "Tôi đã kiểm tra hóa đơn, hạn trả và thông tin ngân hàng chung trước khi gửi."}
                </label>
                <button
                  type="button"
                  className="primary"
                  disabled={!confirmed || !preview.data.xac_nhan}
                  onClick={() => run(true)}
                >
                  {operation === "DUYET" ? "Xác nhận duyệt" : "Xác nhận gửi"}{" "}
                  {preview.data.so_hoa_don} hóa đơn
                </button>
                <p className="muted">
                  Xem trước có hiệu lực 15 phút. Nếu lỗi mạng sau xác nhận, giữ
                  nguyên thông tin và bấm lại để lấy kết quả cũ.
                </p>
              </>
            )}
          </div>
        )}
        {result && (
          <div className="batch-result" role="status">
            <h3>
              {result.da_xu_ly_truoc
                ? "Đợt này đã được xử lý trước đó"
                : "Đã hoàn tất đợt xử lý"}
            </h3>
            <p>
              Đã {result.thao_tac === "DUYET" ? "duyệt" : "gửi"}{" "}
              {result.so_hoa_don} hóa đơn · {money(result.tong_tien)}. Mở từng
              hóa đơn để xem trạng thái hiện tại.
            </p>
            <ul>
              {result.hoa_don.map((r) => (
                <li key={r.ma_hoa_don}>
                  <Link to={`/quan-tri/hoa-don/${r.ma_hoa_don}`}>
                    {r.so_hoa_don} · Căn {r.so_can_ho}
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
                setRevision((n) => n + 1);
              }}
            >
              Bắt đầu đợt xử lý mới
            </button>
            {result.thao_tac === "DUYET" && (
              <button type="button" onClick={() => switchOperation("GUI")}>
                Chuyển sang chọn hóa đơn để gửi
              </button>
            )}
          </div>
        )}
      </fieldset>
    </section>
  );
}
