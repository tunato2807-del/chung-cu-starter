import DataTools from "../../shared/DataTools.jsx";
import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../auth/Auth.jsx";
import { Field, ErrorBox, Loading, Options } from "../../shared/ui.jsx";
import { getJson } from "../../shared/api/client.js";
import { newRequestKey } from "../../shared/request-key.js";
const states = {
  CHO_DUYET: "Chờ duyệt",
  DA_DUYET: "Đã duyệt",
  TU_CHOI: "Từ chối",
  DA_HUY: "Đã hủy",
};
const events = {
  DAT_LICH: "Đặt lịch",
  DUYET: "Duyệt lịch",
  TU_CHOI: "Từ chối",
  HUY: "Hủy lịch",
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const day = (s) => s.split("-").reverse().join("/");
const when = (s) => `${s.slice(11, 16)} · ${day(s.slice(0, 10))}`;
const auditTime = (s) =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(s.replace(" ", "T") + "Z"));
const code = (id) => `DL${String(id).padStart(6, "0")}`;
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
function useData(path) {
  const [state, setState] = useState({ loading: true }),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!path) {
      setState({ path, revision, result: { data: null }, loading: false });
      return;
    }
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
    reload: () => setRevision((n) => n + 1),
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
      setNotice("Đã lưu thay đổi.");
      after?.(r.data);
      done?.();
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }
  return { pending, error, notice, run };
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
function Status({ value }) {
  return (
    <span className={`amenity-status amenity-${value}`}>{states[value]}</span>
  );
}
function Nav({ admin, detail = false }) {
  const base = admin ? "/quan-tri" : "/cu-dan";
  return (
    <div className="actions">
      <Link to={`${base}/tien-ich`}>
        {detail ? "← Danh sách tiện ích" : "Tiện ích"}
      </Link>
      <Link to={`${base}/dat-lich`}>
        {admin ? "Quản lý lượt đặt" : "Lịch đặt của tôi"}
      </Link>
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
function FacilityForm({ data, action, onSave, onCancel }) {
  return (
    <form
      className="card amenity-form"
      onSubmit={(e) => {
        e.preventDefault();
        const b = values(e);
        onSave({
          ...b,
          dang_mo: b.dang_mo === "1",
          ...(data ? { phien_ban: data.phien_ban } : {}),
        });
      }}
    >
      <h2>{data ? "Sửa tiện ích" : "Thêm tiện ích"}</h2>
      <Feedback action={action} />
      <Field label="Tên tiện ích">
        <input
          name="ten_tien_ich"
          required
          minLength={2}
          maxLength={120}
          defaultValue={data?.ten_tien_ich}
        />
      </Field>
      <Field label="Vị trí tiện ích">
        <input
          name="vi_tri"
          required
          minLength={2}
          maxLength={160}
          defaultValue={data?.vi_tri}
        />
      </Field>
      <Field label="Mô tả và quy định">
        <textarea
          name="mo_ta"
          rows={4}
          maxLength={2000}
          defaultValue={data?.mo_ta}
        />
      </Field>
      <div className="amenity-form-grid">
        <Field label="Sức chứa (người)">
          <input
            type="number"
            name="suc_chua"
            required
            min="1"
            max="1000"
            step="1"
            defaultValue={data?.suc_chua || 20}
          />
        </Field>
        <Field label="Mở nhận lịch">
          <select
            name="dang_mo"
            defaultValue={data ? String(Number(data.dang_mo)) : "1"}
          >
            <option value="1">Đang mở</option>
            <option value="0">Tạm ngừng nhận lịch mới</option>
          </select>
        </Field>
        <Field label="Giờ mở cửa">
          <input
            type="time"
            name="gio_mo"
            step="1800"
            required
            defaultValue={data?.gio_mo.slice(0, 5) || "06:00"}
          />
        </Field>
        <Field label="Giờ đóng cửa">
          <input
            type="time"
            name="gio_dong"
            step="1800"
            required
            defaultValue={data?.gio_dong.slice(0, 5) || "22:00"}
          />
        </Field>
        <Field label="Tối đa mỗi lượt (phút)">
          <input
            type="number"
            name="toi_da_phut"
            min="30"
            max="360"
            step="30"
            required
            defaultValue={data?.toi_da_phut || 120}
          />
        </Field>
        <Field label="Được đặt trước tối đa (ngày)">
          <input
            type="number"
            name="dat_truoc_ngay"
            min="1"
            max="90"
            step="1"
            required
            defaultValue={data?.dat_truoc_ngay || 30}
          />
        </Field>
      </div>
      <p className="muted">
        Mỗi lượt dùng riêng tiện ích. Khung giờ theo bước 30 phút, trong cùng
        ngày. Tạm ngừng chỉ chặn lịch mới và giữ các lịch đã đặt. Cấu hình mới
        phải phù hợp với các lịch đang giữ chỗ.
      </p>
      <div className="actions">
        <button className="primary" disabled={action.pending}>
          Lưu tiện ích
        </button>
        <button type="button" disabled={action.pending} onClick={onCancel}>
          Đóng biểu mẫu
        </button>
      </div>
    </form>
  );
}
export function Amenities() {
  const { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri" : "/cu-dan",
    [params, setParams] = useSearchParams(),
    resource = useData(`/tien_ich?${params}`),
    [form, setForm] = useState(false),
    navigate = useNavigate(),
    action = useAction();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">DỊCH VỤ CỘNG ĐỒNG</p>
          <h1>Tiện ích chung cư</h1>
          <p>Chọn không gian, xem lịch trống và đặt giờ sử dụng.</p>
        </div>
        {admin && (
          <button className="primary" onClick={() => setForm(true)}>
            Thêm tiện ích
          </button>
        )}
      </div>
      <Nav admin={admin} />
      <form
        className="card amenity-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(new URLSearchParams(values(e)));
        }}
      >
        <Field label="Tìm tiện ích">
          <input
            name="q"
            maxLength={100}
            defaultValue={params.get("q") || ""}
            placeholder="Tên hoặc vị trí"
          />
        </Field>
        <Field label="Trạng thái nhận lịch">
          <select name="dang_mo" defaultValue={params.get("dang_mo") ?? ""}>
            <option value="">Tất cả</option>
            <option value="1">Đang mở</option>
            <option value="0">Tạm ngừng</option>
          </select>
        </Field>
        <button>Tìm kiếm</button>
      </form>
      {form && (
        <FacilityForm
          action={action}
          onCancel={() => setForm(false)}
          onSave={(b) =>
            action.run("/tien_ich", "POST", b, (d) =>
              navigate(`${base}/tien-ich/${d.ma_tien_ich}`),
            )
          }
        />
      )}
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        <div className="amenity-cards">
          {resource.result?.data.map((f) => (
            <article className="card amenity-card" key={f.ma_tien_ich}>
              <span
                className={`amenity-open ${f.dang_mo ? "" : "amenity-paused"}`}
              >
                {f.dang_mo ? "Đang mở đặt lịch" : "Tạm ngừng nhận lịch"}
              </span>
              <h2>
                <Link to={`${base}/tien-ich/${f.ma_tien_ich}`}>
                  {f.ten_tien_ich}
                </Link>
              </h2>
              <p>{f.vi_tri}</p>
              <p className="amenity-description">
                {f.mo_ta || "Chưa có mô tả."}
              </p>
              <div className="amenity-card-meta">
                <span>
                  {f.gio_mo.slice(0, 5)} – {f.gio_dong.slice(0, 5)}
                </span>
                <span>Tối đa {f.suc_chua} người</span>
                <span>{f.toi_da_phut} phút / lượt</span>
              </div>
              <Link
                className="button primary"
                to={`${base}/tien-ich/${f.ma_tien_ich}`}
              >
                Xem lịch trống
              </Link>
            </article>
          ))}
        </div>
      )}
      {!resource.loading && resource.result?.total === 0 && (
        <p className="card muted">Chưa có tiện ích phù hợp.</p>
      )}
      <Pager resource={resource} />
    </>
  );
}
function Availability({ id, date, refresh, onChoose, selected }) {
  const resource = useData(
    `/tien_ich/${id}/lich?ngay=${date}&refresh=${refresh}`,
  );
  return (
    <section className="card">
      <div className="page-heading">
        <div>
          <h2>Lịch trống ngày {day(date)}</h2>
          <p className="muted">
            Giờ Việt Nam · Ô đã đặt gồm lịch chờ duyệt và đã duyệt.
          </p>
        </div>
      </div>
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        <div className="amenity-slots">
          {resource.result?.data.slots.map((s) => (
            <button
              type="button"
              key={s.gio_bat_dau}
              disabled={s.da_dat || !s.co_the_dat}
              className={
                s.da_dat
                  ? "amenity-slot-booked"
                  : selected === s.gio_bat_dau
                    ? "amenity-slot-selected"
                    : ""
              }
              aria-pressed={selected === s.gio_bat_dau}
              onClick={() => onChoose?.(s)}
              aria-label={`${s.gio_bat_dau} – ${s.gio_ket_thuc}: ${s.da_dat ? "Đã đặt" : s.co_the_dat ? "Còn trống" : "Không nhận lịch"}`}
            >
              <strong>
                {s.gio_bat_dau} – {s.gio_ket_thuc}
              </strong>
              <small>
                {s.da_dat
                  ? "Đã đặt"
                  : s.co_the_dat
                    ? "Còn trống"
                    : "Không nhận lịch"}
              </small>
            </button>
          ))}
        </div>
      )}
      <p className="muted">
        Lịch trống có thể thay đổi. Hệ thống kiểm tra lại khi bạn gửi yêu cầu.
      </p>
    </section>
  );
}
export function AmenityDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    resource = useData(`/tien_ich/${id}`),
    [editing, setEditing] = useState(false),
    [date, setDate] = useState(today),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [refresh, setRefresh] = useState(0),
    [requestKey, setRequestKey] = useState(newRequestKey),
    context = useData(admin ? null : "/cua_toi/dat_lich/ngu_canh"),
    navigate = useNavigate();
  const edit = useAction(() => {
      setEditing(false);
      resource.reload();
      setRefresh((n) => n + 1);
    }),
    book = useAction(),
    f = resource.result?.data;
  // A changed form is a different request. An unchanged retry keeps its original key.
  function changed() {
    setRequestKey(newRequestKey());
  }
  return (
    <>
      <Nav admin={admin} detail />
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        f && (
          <>
            <section className="card amenity-hero">
              <div>
                <p className="eyebrow">TIỆN ÍCH CỘNG ĐỒNG</p>
                <h1>{f.ten_tien_ich}</h1>
                <p>{f.vi_tri}</p>
                <span className="amenity-open">
                  {f.dang_mo ? "Đang mở đặt lịch" : "Tạm ngừng nhận lịch mới"}
                </span>
              </div>
              <div className="amenity-hero-meta">
                <strong>
                  {f.gio_mo.slice(0, 5)} – {f.gio_dong.slice(0, 5)}
                </strong>
                <span>
                  {f.suc_chua} người · {f.toi_da_phut} phút / lượt
                </span>
                <span>Đặt trước tối đa {f.dat_truoc_ngay} ngày</span>
              </div>
              <p className="amenity-text">
                {f.mo_ta || "Chưa có quy định bổ sung."}
              </p>
              {admin && (
                <button onClick={() => setEditing(true)}>Sửa tiện ích</button>
              )}
            </section>
            {editing && (
              <FacilityForm
                key={f.phien_ban}
                data={f}
                action={edit}
                onCancel={() => setEditing(false)}
                onSave={(b) => edit.run(`/tien_ich/${id}`, "PUT", b)}
              />
            )}
            <div className="card amenity-calendar-toolbar">
              <Field label="Ngày sử dụng">
                <input
                  type="date"
                  value={date}
                  min={today()}
                  required
                  onChange={(e) => {
                    if (e.target.value) {
                      setDate(e.target.value);
                      setStart("");
                      setEnd("");
                      changed();
                    }
                  }}
                />
              </Field>
              <button type="button" onClick={() => setRefresh((n) => n + 1)}>
                Tải lại lịch trống
              </button>
            </div>
            <Availability
              id={id}
              date={date}
              refresh={refresh}
              selected={start}
              onChoose={(s) => {
                if (!admin) {
                  setStart(s.gio_bat_dau);
                  setEnd(s.gio_ket_thuc);
                  changed();
                }
              }}
            />
            {!admin && (
              <section className="card amenity-booking-form">
                <h2>Đặt lịch sử dụng</h2>
                <ErrorBox error={context.error} />
                {context.loading ? (
                  <Loading />
                ) : !context.result?.data ? (
                  <p className="note">
                    Cần liên kết tài khoản với cư dân đang ở; tài khoản căn hộ
                    cần chủ hộ đang phụ trách. Hãy liên hệ BQL để được cập nhật.
                  </p>
                ) : (
                  <>
                    <p>
                      Đặt cho{" "}
                      <strong>căn {context.result.data.so_can_ho}</strong> ·{" "}
                      {context.result.data.ho_va_ten}
                    </p>
                    <p className="muted">
                      Một lượt giữ riêng tiện ích. Chờ BQL duyệt trước khi sử
                      dụng. Bạn có thể hủy trước giờ bắt đầu. Chức năng này chưa
                      thu phí tiện ích.
                    </p>
                    <form
                      onChange={changed}
                      onSubmit={(e) => {
                        e.preventDefault();
                        book.run(
                          `/tien_ich/${id}/dat_lich`,
                          "POST",
                          {
                            ...values(e),
                            ngay: date,
                            khoa_yeu_cau: requestKey,
                            phien_ban_tien_ich: f.phien_ban,
                          },
                          (d) => navigate(`/cu-dan/dat-lich/${d.ma_dat_lich}`),
                        );
                      }}
                    >
                      <Feedback action={book} />
                      <div className="amenity-form-grid">
                        <Field label="Giờ bắt đầu">
                          <input
                            name="gio_bat_dau"
                            type="time"
                            step="1800"
                            required
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                          />
                        </Field>
                        <Field label="Giờ kết thúc">
                          <input
                            name="gio_ket_thuc"
                            type="time"
                            step="1800"
                            required
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                          />
                        </Field>
                        <Field label="Số người tham gia">
                          <input
                            name="so_nguoi"
                            type="number"
                            min="1"
                            max={f.suc_chua}
                            required
                            defaultValue="1"
                          />
                        </Field>
                      </div>
                      <Field label="Ghi chú đặt lịch">
                        <textarea name="ghi_chu" rows={3} maxLength={1000} />
                      </Field>
                      <button
                        className="primary"
                        disabled={book.pending || !f.dang_mo}
                      >
                        Gửi yêu cầu đặt lịch
                      </button>
                    </form>
                  </>
                )}
              </section>
            )}
          </>
        )
      )}
    </>
  );
}
export function Bookings() {
  const { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri" : "/cu-dan",
    api = admin ? "/dat_lich_tien_ich" : "/cua_toi/dat_lich",
    [params, setParams] = useSearchParams(),
    resource = useData(`${api}?${params}`);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ĐẶT LỊCH TIỆN ÍCH</p>
          <h1>{admin ? "Quản lý lượt đặt" : "Lịch đặt của tôi"}</h1>
          <p>
            {admin
              ? "Duyệt yêu cầu và điều phối khung giờ sử dụng."
              : "Tài khoản căn hộ xem lịch của căn; tài khoản cá nhân xem lịch tự đặt."}
          </p>
        </div>
      </div>
      <Nav admin={admin} />
      {admin && (
        <DataTools
          kind="dat_lich"
          params={params}
          disabled={resource.loading}
        />
      )}
      <form
        className="card amenity-filters"
        onSubmit={(e) => {
          e.preventDefault();
          const b = values(e);
          if (params.get("ma_tien_ich"))
            b.ma_tien_ich = params.get("ma_tien_ich");
          setParams(new URLSearchParams(b));
        }}
      >
        <Field label="Tìm lượt đặt">
          <input
            name="q"
            maxLength={100}
            defaultValue={params.get("q") || ""}
            placeholder="Tiện ích, căn hộ, người đặt"
          />
        </Field>
        <Field label="Ngày đặt sử dụng">
          <input
            type="date"
            name="ngay"
            defaultValue={params.get("ngay") || ""}
          />
        </Field>
        <Field label="Trạng thái lượt đặt">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options values={states} empty="Tất cả" />
          </select>
        </Field>
        <button>Lọc lịch đặt</button>
      </form>
      {params.get("ma_tien_ich") && (
        <p className="note">
          Đang lọc theo tiện ích #{params.get("ma_tien_ich")}.{" "}
          <Link to={`${base}/dat-lich`}>Xem tất cả</Link>
        </p>
      )}
      <section className="card">
        <ErrorBox error={resource.error} />
        {resource.loading ? (
          <Loading />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lượt đặt</th>
                  <th>Tiện ích / căn hộ</th>
                  <th>Khung giờ</th>
                  <th>Số người</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {resource.result?.data.map((b) => (
                  <tr key={b.ma_dat_lich}>
                    <td>
                      <Link to={`${base}/dat-lich/${b.ma_dat_lich}`}>
                        {code(b.ma_dat_lich)}
                      </Link>
                    </td>
                    <td>
                      <strong>{b.ten_tien_ich}</strong>
                      <small className="amenity-subtitle">
                        Căn {b.so_can_ho} · {b.ten_nguoi_dat}
                      </small>
                    </td>
                    <td>
                      {when(b.bat_dau)}
                      <small className="amenity-subtitle">
                        đến {b.ket_thuc.slice(11, 16)}
                      </small>
                    </td>
                    <td>{b.so_nguoi}</td>
                    <td>
                      <Status value={b.trang_thai} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {resource.result?.total === 0 && (
              <p className="muted">Chưa có lượt đặt phù hợp.</p>
            )}
          </div>
        )}
        <Pager resource={resource} />
      </section>
    </>
  );
}
export function BookingDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri" : "/cu-dan",
    api = admin ? "/dat_lich_tien_ich" : "/cua_toi/dat_lich",
    resource = useData(`${api}/${id}`),
    action = useAction(resource.reload),
    b = resource.result?.data;
  return (
    <>
      <Link to={`${base}/dat-lich`}>← Danh sách lượt đặt</Link>
      <ErrorBox error={resource.error} />
      {resource.loading ? (
        <Loading />
      ) : (
        b && (
          <>
            <section className="card">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">{code(b.ma_dat_lich)}</p>
                  <h1>{b.ten_tien_ich}</h1>
                  <p>{b.vi_tri}</p>
                </div>
                <Status value={b.trang_thai} />
              </div>
              <div className="amenity-booking-summary">
                <div>
                  <span>Khung giờ Việt Nam</span>
                  <strong>
                    {b.bat_dau.slice(11, 16)} – {b.ket_thuc.slice(11, 16)}
                  </strong>
                  <span>{day(b.bat_dau.slice(0, 10))}</span>
                </div>
                <div>
                  <span>Căn hộ / người đặt</span>
                  <strong>Căn {b.so_can_ho}</strong>
                  <span>
                    {b.ten_nguoi_dat} · {b.so_nguoi} người
                  </span>
                </div>
              </div>
              <p className="amenity-text">{b.ghi_chu || "Không có ghi chú."}</p>
              <div className="actions">
                <Link to={`${base}/tien-ich/${b.ma_tien_ich}`}>
                  Xem tiện ích và lịch trống
                </Link>
                {admin && (
                  <Link to={`${base}/dat-lich?ma_tien_ich=${b.ma_tien_ich}`}>
                    Các lịch của tiện ích này
                  </Link>
                )}
              </div>
              {["CHO_DUYET", "DA_DUYET"].includes(b.trang_thai) &&
                new Date(b.bat_dau.replace(" ", "T") + "+07:00") <=
                  new Date() && (
                  <p className="note">
                    Đã tới giờ bắt đầu. Lịch này không còn cho phép duyệt, từ
                    chối hoặc hủy.
                    {b.trang_thai === "CHO_DUYET" &&
                      " Yêu cầu này chưa được duyệt để sử dụng."}
                  </p>
                )}
            </section>
            <Feedback action={action} />
            <div className="amenity-action-grid">
              {(admin && b.trang_thai === "CHO_DUYET" && b.co_the_huy
                ? ["duyet", "tu_choi"]
                : []
              )
                .concat(b.co_the_huy ? ["huy"] : [])
                .map((kind) => (
                  <form
                    className="card"
                    key={`${kind}-${b.phien_ban}`}
                    onSubmit={(e) => {
                      e.preventDefault();
                      action.run(`${api}/${id}/${kind}`, "POST", {
                        ...values(e),
                        phien_ban: b.phien_ban,
                      });
                    }}
                  >
                    <h2>
                      {
                        {
                          duyet: "Duyệt yêu cầu",
                          tu_choi: "Từ chối yêu cầu",
                          huy: "Hủy lượt đặt",
                        }[kind]
                      }
                    </h2>
                    <Field
                      label={
                        {
                          duyet: "Ghi chú duyệt",
                          tu_choi: "Lý do từ chối",
                          huy: "Lý do hủy lịch",
                        }[kind]
                      }
                    >
                      <textarea
                        name="ghi_chu"
                        maxLength={1000}
                        minLength={kind === "duyet" ? 0 : 5}
                        required={kind !== "duyet"}
                        rows={3}
                      />
                    </Field>
                    <button
                      className={kind === "duyet" ? "primary" : "danger"}
                      disabled={action.pending}
                    >
                      {
                        {
                          duyet: "Duyệt lịch",
                          tu_choi: "Từ chối lịch",
                          huy: "Xác nhận hủy lịch",
                        }[kind]
                      }
                    </button>
                  </form>
                ))}
            </div>
            <section className="card">
              <h2>Lịch sử đặt lịch</h2>
              <ol className="amenity-history">
                {b.history.map((h) => (
                  <li key={h.ma_lich_su}>
                    <strong>{events[h.su_kien]}</strong>
                    <small>
                      {auditTime(h.ngay_tao)} · {h.ho_va_ten}
                    </small>
                    <p className="amenity-text">{h.ghi_chu}</p>
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
