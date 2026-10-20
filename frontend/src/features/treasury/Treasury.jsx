import React, { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { Field, ErrorBox, Loading, Options } from "../../shared/ui.jsx";
import { newRequestKey } from "../../shared/request-key.js";
const money = (n) => `${BigInt(n || 0).toLocaleString("vi-VN")} đ`;
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const day = (n) => (n ? n.split("-").reverse().join("/") : "—");
const time = (n) =>
  n
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(n.replace(" ", "T") + "Z"))
    : "—";
const code = (p) =>
  `${p.loai === "THU" ? "PT" : "PC"}${String(p.ma_phieu).padStart(6, "0")}`;
const types = { THU: "Phiếu thu", CHI: "Phiếu chi" },
  states = { NHAP: "Bản nháp", DA_GHI_SO: "Đã ghi sổ", HUY: "Đã hủy" };
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
const allowed = {
  THU: ["BO_SUNG_QUY", "THU_KHAC"],
  CHI: ["VAN_HANH", "BAO_TRI", "MUA_SAM", "CHI_KHAC"],
};
const events = {
  TAO_NHAP: "Lập nháp",
  SUA_NHAP: "Sửa nháp",
  GHI_SO: "Duyệt và ghi sổ",
  HUY: "Hủy nháp",
  DAO_PHIEU: "Đảo phiếu gốc",
  TAO_DAO: "Lập phiếu đảo",
  THEM_CHUNG_TU: "Thêm chứng từ",
  XOA_CHUNG_TU: "Xóa chứng từ",
};
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
function useData(path) {
  const [state, setState] = useState({ loading: true }),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setState({ path, revision, loading: true });
    getJson(path, { signal: c.signal })
      .then((result) => {
        if (!c.signal.aborted)
          setState({ path, revision, result, loading: false });
      })
      .catch((error) => {
        if (!c.signal.aborted)
          setState({ path, revision, error, loading: false });
      });
    return () => c.abort();
  }, [path, revision]);
  return {
    ...(state.path === path && state.revision === revision
      ? state
      : { loading: true }),
    reload: () => setRevision((x) => x + 1),
  };
}
function useAction(done) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [notice, setNotice] = useState("");
  async function run(path, method, body, after) {
    setPending(true);
    setError(null);
    setNotice("");
    try {
      const r = await getJson(path, { method, body });
      setNotice(
        r.data.replay
          ? "Đã mở lại kết quả đã lưu trước đó."
          : "Đã lưu thay đổi.",
      );
      after?.(r.data);
      done?.();
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }
  return {
    pending,
    error,
    notice,
    run,
    clear: () => {
      setError(null);
      setNotice("");
    },
  };
}
function Feedback({ action }) {
  return (
    <>
      {action.notice && (
        <p className="note" role="status">
          {action.notice}
        </p>
      )}
      <ErrorBox error={action.error} />
    </>
  );
}
function Nav() {
  return (
    <div className="actions">
      <Link to="/quan-tri/quy">Danh sách quỹ</Link>
      <Link to="/quan-tri/phieu-thu-chi">Phiếu thu / chi</Link>
    </div>
  );
}
function Pager({ resource }) {
  const [params, setParams] = useSearchParams(),
    page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(n) {
    const next = new URLSearchParams(params);
    next.set("page", n);
    setParams(next);
  }
  return (
    <div className="actions">
      <button
        disabled={resource.loading || page <= 1}
        onClick={() => go(page - 1)}
      >
        Trang trước
      </button>
      <span>
        Trang {page} · {total} bản ghi
      </span>
      <button
        disabled={resource.loading || page * 20 >= total}
        onClick={() => go(page + 1)}
      >
        Trang sau
      </button>
    </div>
  );
}
function FundForm({ fund, action, onSave, onCancel }) {
  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        const b = values(e);
        onSave({
          ...b,
          dang_hoat_dong: fund?.nhan_thu_hoa_don
            ? true
            : b.dang_hoat_dong === "1",
          ...(fund ? { phien_ban: fund.phien_ban } : {}),
        });
      }}
    >
      <h2>{fund ? "Sửa thông tin quỹ" : "Tạo quỹ"}</h2>
      <Feedback action={action} />
      <Field label="Tên quỹ">
        <input
          name="ten_quy"
          required
          minLength={2}
          maxLength={120}
          defaultValue={fund?.ten_quy}
        />
      </Field>
      <Field label="Mô tả quỹ">
        <textarea
          name="mo_ta"
          rows={3}
          maxLength={1000}
          defaultValue={fund?.mo_ta}
        />
      </Field>
      <Field label="Trạng thái quỹ">
        <select
          name="dang_hoat_dong"
          disabled={!!fund?.nhan_thu_hoa_don}
          defaultValue={fund ? String(Number(fund.dang_hoat_dong)) : "1"}
        >
          <option value="1">Đang hoạt động</option>
          <option value="0">Tạm ngừng lập / duyệt phiếu mới</option>
        </select>
      </Field>
      <p className="muted">
        Quỹ mới bắt đầu từ 0. Ghi nhận số tiền ban đầu bằng phiếu Thu / Bổ sung
        quỹ và duyệt để ghi sổ. Chưa có chuyển tiền tự động giữa các quỹ.
      </p>
      <div className="actions">
        <button className="primary" disabled={action.pending}>
          Lưu quỹ
        </button>
        <button type="button" disabled={action.pending} onClick={onCancel}>
          Đóng biểu mẫu
        </button>
      </div>
    </form>
  );
}
export function Funds() {
  const [params, setParams] = useSearchParams(),
    resource = useData(`/quy?${params}`),
    [form, setForm] = useState(false),
    navigate = useNavigate(),
    action = useAction();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TÀI CHÍNH CHUNG CƯ</p>
          <h1>Thu chi và quỹ</h1>
          <p>Theo dõi tiền đã ghi nhận, chứng từ và số dư từng quỹ.</p>
        </div>
        <button className="primary" onClick={() => setForm(true)}>
          Tạo quỹ
        </button>
      </div>
      <Nav />
      <p className="note">
        Tiền hóa đơn đã xác nhận thu tự xuất hiện trong quỹ vận hành. Không lập
        thêm phiếu thu khác cho cùng khoản tiền đó. Số dư phần mềm cần đối soát
        với tiền mặt và ngân hàng thực tế.
      </p>
      <form
        className="card treasury-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field label="Tìm quỹ">
          <input
            name="q"
            maxLength={100}
            defaultValue={params.get("q") || ""}
          />
        </Field>
        <button>Tìm kiếm</button>
      </form>
      {form && (
        <FundForm
          action={action}
          onCancel={() => setForm(false)}
          onSave={(b) =>
            action.run("/quy", "POST", b, (d) =>
              navigate(`/quan-tri/quy/${d.ma_quy}`),
            )
          }
        />
      )}
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        <div className="treasury-funds">
          {resource.result?.data.map((f) => (
            <article className="card" key={f.ma_quy}>
              <span
                className={`treasury-tag ${f.dang_hoat_dong ? "" : "treasury-closed"}`}
              >
                {f.dang_hoat_dong ? "Đang hoạt động" : "Tạm ngừng"}
              </span>
              <h2>
                <Link to={`/quan-tri/quy/${f.ma_quy}`}>{f.ten_quy}</Link>
              </h2>
              <p className="treasury-text">{f.mo_ta}</p>
              {!!f.nhan_thu_hoa_don && (
                <p className="muted">
                  Tự tổng hợp các hóa đơn đã xác nhận thu.
                </p>
              )}
              <Link className="button" to={`/quan-tri/quy/${f.ma_quy}`}>
                Mở sổ quỹ
              </Link>
            </article>
          ))}
        </div>
      )}
      {!resource.loading && resource.result?.total === 0 && (
        <p className="card">Chưa có quỹ phù hợp.</p>
      )}
      <Pager resource={resource} />
    </>
  );
}
export function FundDetail() {
  const { id } = useParams(),
    [params, setParams] = useSearchParams(),
    resource = useData(`/quy/${id}/so_quy?${params}`),
    [edit, setEdit] = useState(false),
    action = useAction(() => {
      setEdit(false);
      resource.reload();
    }),
    r = resource.result,
    f = r?.fund,
    s = r?.summary,
    monthly = r?.filters.che_do === "THEO_THANG";
  return (
    <>
      <Nav />
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        f && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">SỔ QUỸ</p>
                <h1>{f.ten_quy}</h1>
                <p className="treasury-text">{f.mo_ta}</p>
              </div>
              <div className="actions">
                <button onClick={() => setEdit(true)}>Sửa quỹ</button>
                <Link
                  className="button primary"
                  to={`/quan-tri/phieu-thu-chi/moi?ma_quy=${id}`}
                >
                  Lập phiếu thu / chi
                </Link>
              </div>
            </div>
            {edit && (
              <FundForm
                fund={f}
                action={action}
                onCancel={() => setEdit(false)}
                onSave={(b) => action.run(`/quy/${id}`, "PUT", b)}
              />
            )}
            <p className="note">
              Chỉ tính phiếu đã ghi sổ và hóa đơn đã xác nhận thu. Dữ liệu lúc{" "}
              {time(r.tai_luc)}. Tổng hợp theo ngày hạch toán tại Việt Nam; bộ
              lọc nguồn/loại/tìm kiếm chỉ thay danh sách.
            </p>
            <form
              className="card treasury-filters"
              key={params.toString()}
              onSubmit={(e) => {
                e.preventDefault();
                setParams(values(e));
              }}
            >
              <Field label="Từ ngày hạch toán">
                <input
                  type="date"
                  name="tu_ngay"
                  required
                  max={today()}
                  defaultValue={r.filters.tu_ngay}
                />
              </Field>
              <Field label="Đến ngày hạch toán">
                <input
                  type="date"
                  name="den_ngay"
                  required
                  max={today()}
                  defaultValue={r.filters.den_ngay}
                />
              </Field>
              <Field label="Cách xem sổ quỹ">
                <select name="che_do" defaultValue={r.filters.che_do}>
                  <option value="GIAO_DICH">Từng khoản thu / chi</option>
                  <option value="THEO_THANG">Tổng hợp theo tháng</option>
                </select>
              </Field>
              <Field label="Nguồn ghi sổ">
                <select
                  name="nguon"
                  disabled={monthly}
                  defaultValue={params.get("nguon") || ""}
                >
                  <option value="">Tất cả nguồn</option>
                  <option value="PHIEU">Phiếu thu / chi</option>
                  <option value="HOA_DON">Hóa đơn</option>
                </select>
              </Field>
              <Field label="Loại giao dịch">
                <select
                  name="loai"
                  disabled={monthly}
                  defaultValue={params.get("loai") || ""}
                >
                  <Options values={{ THU: "Thu", CHI: "Chi" }} empty="Tất cả" />
                </select>
              </Field>
              <Field label="Tìm trong sổ quỹ">
                <input
                  name="q"
                  disabled={monthly}
                  maxLength={100}
                  defaultValue={params.get("q") || ""}
                />
              </Field>
              <button>Lọc sổ quỹ</button>
            </form>
            <div className="treasury-metrics" aria-label="Tổng hợp số dư">
              {[
                ["Đầu kỳ", s.dau_ky],
                ["Thu trong kỳ", s.tong_thu],
                ["Chi trong kỳ", s.tong_chi],
                ["Cuối kỳ", s.cuoi_ky],
              ].map(([label, n]) => (
                <div className="card" key={label}>
                  <span>{label}</span>
                  <strong>{money(n)}</strong>
                </div>
              ))}
            </div>
            {BigInt(s.cuoi_ky) < 0n && (
              <p className="error">
                Số dư cuối kỳ âm. Kiểm tra dữ liệu đầu kỳ và các khoản hạch toán
                lùi ngày.
              </p>
            )}
            <section className="card">
              <div className="actions">
                <Link to={`/quan-tri/phieu-thu-chi?ma_quy=${id}`}>
                  Xem phiếu nháp / đã ghi sổ của quỹ
                </Link>
                <button onClick={resource.reload}>Cập nhật sổ quỹ</button>
              </div>
              <p className="muted">
                Số dư bắt đầu từ 0 trước dữ liệu đầu tiên. Hạch toán lùi ngày có
                thể làm số dư quá khứ âm dù lúc duyệt chi quỹ đủ tiền. Đây chưa
                phải báo cáo ngân hàng đã đối soát.
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {(monthly
                        ? ["Tháng", "Tổng thu", "Tổng chi", "Chênh lệch"]
                        : [
                            "Ngày hạch toán",
                            "Chứng từ / nguồn",
                            "Người nộp / nhận",
                            "Diễn giải",
                            "Thu",
                            "Chi",
                          ]
                      ).map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.data.map((p, i) =>
                      monthly ? (
                        <tr key={p.ky}>
                          <td>{p.ky}</td>
                          <td>{money(p.tong_thu)}</td>
                          <td>{money(p.tong_chi)}</td>
                          <td>
                            {money(BigInt(p.tong_thu) - BigInt(p.tong_chi))}
                          </td>
                        </tr>
                      ) : (
                        <tr key={`${p.nguon}-${p.ma_ban_ghi}`}>
                          <td>{day(p.ngay)}</td>
                          <td>
                            <Link
                              to={
                                p.nguon === "HOA_DON"
                                  ? `/quan-tri/hoa-don/${p.ma_ban_ghi}`
                                  : `/quan-tri/phieu-thu-chi/${p.ma_ban_ghi}`
                              }
                            >
                              {p.so_chung_tu}
                            </Link>
                            <small className="treasury-subtitle">
                              {categories[p.nhom] || p.nhom}
                            </small>
                          </td>
                          <td>{p.doi_tac}</td>
                          <td className="treasury-text">{p.dien_giai}</td>
                          <td className="treasury-money">
                            {p.loai === "THU" ? money(p.so_tien) : "—"}
                          </td>
                          <td className="treasury-money">
                            {p.loai === "CHI" ? money(p.so_tien) : "—"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
              {!r.total && <p className="muted">Chưa có giao dịch phù hợp.</p>}
              <Pager resource={resource} />
            </section>
          </>
        )
      )}
    </>
  );
}
function VoucherForm({ fund, data, action, onSave, onCancel, onChange }) {
  const [type, setType] = useState(data?.loai || "THU");
  return (
    <form
      className="card"
      onChange={onChange}
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...values(e),
          ma_quy: fund.ma_quy,
          ...(data ? { phien_ban: data.phien_ban } : {}),
        });
      }}
    >
      <h2>{data ? "Sửa phiếu nháp" : "Lập phiếu thu / chi"}</h2>
      <p>
        Quỹ: <strong>{fund.ten_quy}</strong>
      </p>
      <Feedback action={action} />
      <div className="treasury-form-grid">
        <Field label="Loại phiếu">
          <select
            name="loai"
            value={type}
            disabled={!!data}
            onChange={(e) => setType(e.target.value)}
          >
            <Options values={types} />
          </select>
        </Field>
        {data && <input type="hidden" name="loai" value={data.loai} />}
        <Field label="Nhóm thu / chi">
          <select
            name="nhom"
            key={type}
            defaultValue={data?.nhom || allowed[type][0]}
          >
            <Options
              values={Object.fromEntries(
                allowed[type].map((k) => [k, categories[k]]),
              )}
            />
          </select>
        </Field>
        <Field label="Ngày hạch toán">
          <input
            type="date"
            name="ngay_hach_toan"
            max={today()}
            required
            defaultValue={data?.ngay_hach_toan || today()}
          />
        </Field>
        <Field label="Số tiền (đồng)">
          <input
            name="so_tien"
            inputMode="numeric"
            pattern="[0-9]{1,14}"
            required
            defaultValue={data?.so_tien}
            placeholder="Ví dụ: 1500000"
          />
        </Field>
      </div>
      <Field label="Người nộp / người nhận">
        <input
          name="doi_tac"
          required
          minLength={2}
          maxLength={150}
          defaultValue={data?.doi_tac}
        />
      </Field>
      <Field label="Diễn giải thu / chi">
        <textarea
          name="dien_giai"
          required
          minLength={5}
          maxLength={1000}
          rows={4}
          defaultValue={data?.dien_giai}
        />
      </Field>
      <p className="muted">
        Lưu nháp chưa thay đổi số dư. Sau khi lưu, thêm chứng từ rồi duyệt để
        ghi sổ; phiếu chi bắt buộc có ít nhất một chứng từ. Không lập phiếu thu
        khác cho khoản hóa đơn đã được xác nhận thu.
      </p>
      <div className="actions">
        <button className="primary" disabled={action.pending}>
          Lưu phiếu nháp
        </button>
        {onCancel && (
          <button type="button" disabled={action.pending} onClick={onCancel}>
            Đóng biểu mẫu
          </button>
        )}
      </div>
    </form>
  );
}
export function VoucherNew() {
  const [params] = useSearchParams(),
    id = params.get("ma_quy") || "0",
    resource = useData(`/quy/${id}`),
    navigate = useNavigate(),
    [key, setKey] = useState(newRequestKey),
    action = useAction(),
    fund = resource.result?.data;
  return (
    <>
      <Nav />
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        fund && (
          <VoucherForm
            fund={fund}
            action={action}
            onChange={() => setKey(newRequestKey())}
            onSave={(b) =>
              action.run(
                "/phieu_thu_chi",
                "POST",
                { ...b, khoa_yeu_cau: key },
                (d) => navigate(`/quan-tri/phieu-thu-chi/${d.ma_phieu}`),
              )
            }
          />
        )
      )}
    </>
  );
}
export function Vouchers() {
  const [params, setParams] = useSearchParams(),
    resource = useData(`/phieu_thu_chi?${params}`);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CHỨNG TỪ NỘI BỘ</p>
          <h1>Phiếu thu và phiếu chi</h1>
        </div>
        <Link
          className="button primary"
          to={
            params.get("ma_quy")
              ? `/quan-tri/phieu-thu-chi/moi?ma_quy=${params.get("ma_quy")}`
              : "/quan-tri/quy"
          }
        >
          Chọn quỹ để lập phiếu
        </Link>
      </div>
      <Nav />
      <form
        className="card treasury-filters"
        onSubmit={(e) => {
          e.preventDefault();
          const b = values(e);
          if (params.get("ma_quy")) b.ma_quy = params.get("ma_quy");
          setParams(b);
        }}
      >
        <Field label="Tìm phiếu thu chi">
          <input
            name="q"
            defaultValue={params.get("q") || ""}
            maxLength={100}
            placeholder="Người nộp/nhận hoặc diễn giải"
          />
        </Field>
        <Field label="Lọc loại phiếu">
          <select name="loai" defaultValue={params.get("loai") || ""}>
            <Options values={types} empty="Tất cả" />
          </select>
        </Field>
        <Field label="Trạng thái phiếu">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options values={states} empty="Tất cả" />
          </select>
        </Field>
        <button>Lọc phiếu</button>
      </form>
      {params.get("ma_quy") && (
        <p className="note">
          Đang lọc quỹ #{params.get("ma_quy")}.{" "}
          <Link to="/quan-tri/phieu-thu-chi">Bỏ lọc quỹ</Link>
        </p>
      )}
      <ErrorBox error={resource.error} />
      <section className="card">
        {resource.loading ? (
          <Loading />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Phiếu</th>
                    <th>Quỹ / đối tác</th>
                    <th>Ngày hạch toán</th>
                    <th>Diễn giải</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {resource.result?.data.map((p) => (
                    <tr key={p.ma_phieu}>
                      <td>
                        <Link to={`/quan-tri/phieu-thu-chi/${p.ma_phieu}`}>
                          {code(p)}
                        </Link>
                        <small className="treasury-subtitle">
                          {types[p.loai]}
                        </small>
                      </td>
                      <td>
                        {p.ten_quy}
                        <small className="treasury-subtitle">{p.doi_tac}</small>
                      </td>
                      <td>{day(p.ngay_hach_toan)}</td>
                      <td className="treasury-text">{p.dien_giai}</td>
                      <td className="treasury-money">{money(p.so_tien)}</td>
                      <td>
                        {states[p.trang_thai]}
                        {p.ma_phieu_goc && (
                          <small className="treasury-subtitle">Phiếu đảo</small>
                        )}
                        {p.ma_phieu_dao && (
                          <small className="treasury-subtitle">
                            Đã có phiếu đảo
                          </small>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!resource.result?.total && (
              <p className="muted">Chưa có phiếu phù hợp.</p>
            )}
          </>
        )}
        <Pager resource={resource} />
      </section>
    </>
  );
}
function Proofs({ p, reload }) {
  const [files, setFiles] = useState([]),
    form = useRef(null),
    action = useAction(reload);
  return (
    <section className="card">
      <h2>Chứng từ đính kèm</h2>
      <Feedback action={action} />
      {p.chung_tu.length === 0 ? (
        <p className="muted">Chưa có chứng từ.</p>
      ) : (
        <ul className="treasury-proofs">
          {p.chung_tu.map((f) => (
            <li key={f.ma_chung_tu}>
              <a
                href={`/api/phieu_thu_chi/${p.ma_phieu}/chung_tu/${f.ma_chung_tu}`}
                download
              >
                {f.ten_tep}
              </a>
              <small>
                {Math.ceil(f.kich_thuoc / 1024)} KB ·{" "}
                {f.loai_tep === "application/pdf" ? "PDF" : "Ảnh JPEG"}
              </small>
              {p.trang_thai === "NHAP" && (
                <button
                  className="danger"
                  disabled={action.pending}
                  onClick={() =>
                    action.run(
                      `/phieu_thu_chi/${p.ma_phieu}/chung_tu/${f.ma_chung_tu}`,
                      "DELETE",
                      { phien_ban: p.phien_ban },
                    )
                  }
                >
                  Xóa chứng từ #{f.ma_chung_tu}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {p.ma_phieu_goc && (
        <p className="note">
          Chứng từ gốc được giữ tại{" "}
          <Link to={`/quan-tri/phieu-thu-chi/${p.ma_phieu_goc}`}>
            phiếu gốc
          </Link>
          .
        </p>
      )}
      {p.trang_thai === "NHAP" && (
        <form
          ref={form}
          onSubmit={(e) => {
            e.preventDefault();
            const b = new FormData();
            b.set("phien_ban", p.phien_ban);
            for (const f of files) b.append("chung_tu", f, f.name);
            action.run(
              `/phieu_thu_chi/${p.ma_phieu}/chung_tu`,
              "POST",
              b,
              () => {
                setFiles([]);
                form.current?.reset();
              },
            );
          }}
        >
          <Field label="Chọn chứng từ ảnh hoặc PDF">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </Field>
          <p role="status">
            {files.length
              ? `Đã chọn ${files.length} tệp: ${files.map((f) => f.name).join(", ")}`
              : "Chưa chọn tệp để tải lên."}
          </p>
          <p className="muted">
            Tối đa 5 chứng từ mỗi phiếu, 5 MB mỗi tệp. Ảnh JPEG/PNG/WebP được
            chuyển JPEG và bỏ metadata; PDF chỉ tải xuống. Chọn tệp rồi bấm Tải
            chứng từ lên, sau đó mới duyệt phiếu.
          </p>
          <button disabled={action.pending || !files.length}>
            Tải chứng từ lên
          </button>
        </form>
      )}
    </section>
  );
}
function historyNote(h) {
  if (["TAO_NHAP", "SUA_NHAP"].includes(h.su_kien)) {
    try {
      const p = JSON.parse(h.ghi_chu);
      return `${p.dien_giai}\n${day(p.ngay_hach_toan)} · ${p.doi_tac} · ${money(p.so_tien)}`;
    } catch {
      return h.ghi_chu;
    }
  }
  return h.ghi_chu;
}
export function VoucherDetail() {
  const { id } = useParams(),
    resource = useData(`/phieu_thu_chi/${id}`),
    [editing, setEditing] = useState(false),
    action = useAction(() => {
      setEditing(false);
      resource.reload();
    }),
    navigate = useNavigate(),
    p = resource.result?.data;
  return (
    <>
      <Nav />
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        p && (
          <>
            <section className="card">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">{types[p.loai]}</p>
                  <h1>{code(p)}</h1>
                  <Link to={`/quan-tri/quy/${p.ma_quy}`}>{p.ten_quy}</Link>
                </div>
                <span className={`treasury-tag treasury-${p.trang_thai}`}>
                  {states[p.trang_thai]}
                </span>
              </div>
              <div className="treasury-voucher-summary">
                <div>
                  <span>Số tiền</span>
                  <strong>{money(p.so_tien)}</strong>
                  <span>{categories[p.nhom]}</span>
                </div>
                <div>
                  <span>Ngày hạch toán / người nộp, nhận</span>
                  <strong>{day(p.ngay_hach_toan)}</strong>
                  <span>{p.doi_tac}</span>
                </div>
              </div>
              <p className="treasury-text">{p.dien_giai}</p>
              <p className="muted">
                Lập bởi {p.nguoi_lap} · {time(p.ngay_tao)}
                {p.nguoi_duyet &&
                  ` · Duyệt bởi ${p.nguoi_duyet} lúc ${time(p.ngay_duyet)}`}
              </p>
              {p.ma_phieu_dao && (
                <p className="note">
                  Đã có{" "}
                  <Link to={`/quan-tri/phieu-thu-chi/${p.ma_phieu_dao}`}>
                    phiếu đảo
                  </Link>
                  . Cả hai khoản được giữ trong sổ để theo dõi điều chỉnh.
                </p>
              )}
              {p.ma_phieu_goc && (
                <p className="note">
                  Đây là phiếu đảo của{" "}
                  <Link to={`/quan-tri/phieu-thu-chi/${p.ma_phieu_goc}`}>
                    phiếu gốc
                  </Link>
                  ; không đảo tiếp phiếu này.
                </p>
              )}
              {p.trang_thai === "NHAP" && (
                <button onClick={() => setEditing(true)}>Sửa phiếu nháp</button>
              )}
            </section>
            <Feedback action={action} />
            {editing && (
              <VoucherForm
                key={p.phien_ban}
                fund={{ ma_quy: p.ma_quy, ten_quy: p.ten_quy }}
                data={p}
                action={action}
                onCancel={() => setEditing(false)}
                onSave={(b) => action.run(`/phieu_thu_chi/${id}`, "PUT", b)}
              />
            )}
            <Proofs
              p={p}
              reload={() => {
                action.clear();
                resource.reload();
              }}
            />
            <div className="treasury-action-grid">
              {(p.trang_thai === "NHAP"
                ? ["duyet", "huy"]
                : p.trang_thai === "DA_GHI_SO" &&
                    !p.ma_phieu_goc &&
                    !p.ma_phieu_dao
                  ? ["dao"]
                  : []
              ).map((kind) => (
                <form
                  className="card"
                  key={`${kind}-${p.phien_ban}`}
                  onSubmit={(e) => {
                    e.preventDefault();
                    action.run(
                      `/phieu_thu_chi/${id}/${kind}`,
                      "POST",
                      { ...values(e), phien_ban: p.phien_ban },
                      kind === "dao"
                        ? (d) =>
                            navigate(`/quan-tri/phieu-thu-chi/${d.ma_phieu}`)
                        : undefined,
                    );
                  }}
                >
                  <h2>
                    {
                      {
                        duyet: "Duyệt và ghi sổ",
                        huy: "Hủy phiếu nháp",
                        dao: "Đảo phiếu đã ghi sổ",
                      }[kind]
                    }
                  </h2>
                  <p className="muted">
                    {
                      {
                        duyet:
                          "Chỉ duyệt khi khoản tiền thực tế và chứng từ đã được kiểm tra. Duyệt chi cần quỹ đủ số dư hiện tại.",
                        huy: "Hủy nháp không thay đổi số dư quỹ.",
                        dao: "Giữ phiếu gốc và tạo khoản ngược chiều cùng số tiền, hạch toán hôm nay. Đảo khoản thu cần quỹ đủ số dư.",
                      }[kind]
                    }
                  </p>
                  <Field
                    label={
                      kind === "duyet"
                        ? "Ghi chú duyệt phiếu"
                        : kind === "huy"
                          ? "Lý do hủy phiếu"
                          : "Lý do đảo phiếu"
                    }
                  >
                    <textarea
                      name={kind === "duyet" ? "ghi_chu" : "ly_do"}
                      rows={3}
                      maxLength={1000}
                      minLength={kind === "duyet" ? 0 : 5}
                      required={kind !== "duyet"}
                    />
                  </Field>
                  <button
                    className={kind === "duyet" ? "primary" : "danger"}
                    disabled={action.pending}
                  >
                    {
                      {
                        duyet: "Xác nhận duyệt và ghi sổ",
                        huy: "Xác nhận hủy nháp",
                        dao: "Lập phiếu đảo",
                      }[kind]
                    }
                  </button>
                </form>
              ))}
            </div>
            <section className="card">
              <h2>Lịch sử phiếu</h2>
              <ol className="treasury-history">
                {p.history.map((h) => (
                  <li key={h.ma_lich_su}>
                    <strong>{events[h.su_kien] || h.su_kien}</strong>
                    <small>
                      {time(h.ngay_tao)} · {h.ho_va_ten}
                    </small>
                    <p className="treasury-text">{historyNote(h)}</p>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )
      )}
    </>
  );
}
