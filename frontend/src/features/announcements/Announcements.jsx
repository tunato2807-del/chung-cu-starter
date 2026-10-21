import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../auth/Auth.jsx";
import { getJson } from "../../shared/api/client.js";
import {
  date,
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";

const states = {
  NHAP: "Bản nháp",
  DA_GUI: "Đã phát hành",
  THU_HOI: "Đã thu hồi",
};
const scopes = {
  TOAN_BO: "Toàn chung cư",
  KHOI: "Theo khối",
  CAN_HO: "Một căn hộ",
};
const levels = { THUONG: "Bình thường", QUAN_TRONG: "Quan trọng" };
const types = { THONG_BAO: "Thông báo chung", NHAC_PHI: "Nhắc thanh toán" };
const events = {
  TAO_NHAP: "Tạo bản nháp",
  SUA_NHAP: "Sửa bản nháp",
  PHAT_HANH: "Phát hành",
  THU_HOI: "Thu hồi",
  NHAC_PHI: "Nhắc thanh toán",
};
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
const changed = () => window.dispatchEvent(new Event("notifications:changed"));

export function useUnreadCount(user, pathname) {
  const [result, setResult] = useState({ key: "", count: 0 });
  const key =
    user?.vai_tro === "CU_DAN"
      ? `${user.ma_nguoi_dung}:${user.phien_ban_token}`
      : "";
  useEffect(() => {
    if (!key) return;
    let active = true,
      sequence = 0;
    const controller = new AbortController();
    async function refresh() {
      const run = ++sequence;
      try {
        const r = await getJson("/cua_toi/thong_bao/chua_doc", {
          signal: controller.signal,
        });
        if (active && sequence === run)
          setResult({ key, count: r.data.so_chua_doc });
      } catch {
        if (active && sequence === run) setResult({ key, count: 0 });
      }
    }
    refresh();
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    window.addEventListener("notifications:changed", refresh);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("notifications:changed", refresh);
    };
  }, [key, pathname]);
  return key && result.key === key ? result.count : 0;
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
      setNotice("Đã lưu thông báo.");
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
function Target({ initial }) {
  const [scope, setScope] = useState(initial?.pham_vi || "TOAN_BO"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(String(initial?.ma_can_ho || ""));
  const apartments = useResource(`/can_ho?q=${encodeURIComponent(query)}`);
  const matches = apartments.result?.data || [];
  return (
    <>
      <Field label="Phạm vi nhận">
        <select
          name="pham_vi"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        >
          <Options values={scopes} />
        </select>
      </Field>
      {scope === "KHOI" && (
        <Field
          label="Khối nhận thông báo"
          name="khoi"
          required
          maxLength={10}
          defaultValue={initial?.khoi || ""}
          placeholder="Ví dụ A"
        />
      )}
      {scope === "CAN_HO" && (
        <>
          <Field label="Tìm căn hộ nhận thông báo">
            <input
              value={query}
              maxLength={100}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Field>
          <ErrorBox error={apartments.error} />
          <Field label="Căn hộ nhận thông báo">
            <select
              name="ma_can_ho"
              required
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Chọn căn hộ</option>
              {selected &&
                !matches.some((a) => String(a.ma_can_ho) === selected) && (
                  <option value={selected}>
                    {initial?.so_can_ho || `Căn đã chọn #${selected}`}
                  </option>
                )}
              {matches.map((a) => (
                <option key={a.ma_can_ho} value={a.ma_can_ho}>
                  {a.so_can_ho} · Khối {a.khoi}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}
    </>
  );
}
function Editor({ initial, action, onSave }) {
  return (
    <form
      key={initial?.phien_ban ?? "new"}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(values(e));
      }}
    >
      <fieldset disabled={action.pending}>
        <Field
          label="Tiêu đề thông báo"
          name="tieu_de"
          required
          minLength={3}
          maxLength={160}
          defaultValue={initial?.tieu_de || ""}
        />
        <Field label="Nội dung thông báo">
          <textarea
            name="noi_dung"
            rows={7}
            required
            minLength={3}
            maxLength={6000}
            defaultValue={initial?.noi_dung || ""}
          />
        </Field>
        <Target initial={initial} />
        <Field label="Mức độ">
          <select name="muc_do" defaultValue={initial?.muc_do || "THUONG"}>
            <Options values={levels} />
          </select>
        </Field>
        <button className="primary">
          {initial ? "Lưu bản nháp" : "Tạo bản nháp"}
        </button>
      </fieldset>
    </form>
  );
}
function Meta({ item, admin }) {
  return (
    <div className="notification-meta">
      <span className={`notification-priority priority-${item.muc_do}`}>
        {levels[item.muc_do]}
      </span>
      <span>{types[item.loai]}</span>
      {admin ? (
        <>
          <span>{states[item.trang_thai]}</span>
          <span>
            {scopes[item.pham_vi]}
            {item.pham_vi === "KHOI"
              ? ` ${item.khoi}`
              : item.pham_vi === "CAN_HO"
                ? ` ${item.so_can_ho}`
                : ""}
          </span>
        </>
      ) : (
        <span>
          {item.chua_doc ? "Chưa đọc" : item.ngay_doc ? "Đã đọc" : "Đã xử lý"}
        </span>
      )}
      <time>{date(item.ngay_gui || item.ngay_tao)}</time>
      {item.trang_thai_hoa_don === "DA_THANH_TOAN" && (
        <span className="badge">Đã thanh toán</span>
      )}
    </div>
  );
}
export function Announcements() {
  const { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri/thong-bao" : "/cu-dan/thong-bao",
    api = admin ? "/thong_bao" : "/cua_toi/thong_bao";
  const [params, setParams] = useSearchParams(),
    resource = useResource(`${api}?${params}`),
    [adding, setAdding] = useState(false),
    action = useAction(),
    navigate = useNavigate();
  const page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(page) {
    const next = new URLSearchParams(params);
    next.set("page", page);
    setParams(next);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Kết nối cư dân</p>
          <h1>{admin ? "Thông báo và nhắc phí" : "Thông báo của tôi"}</h1>
        </div>
        {admin && (
          <button className="primary" onClick={() => setAdding(!adding)}>
            {adding ? "Đóng biểu mẫu" : "Soạn thông báo"}
          </button>
        )}
      </div>
      <p className="muted">
        {admin
          ? "Thông báo xuất hiện trên web sau khi phát hành. Nhắc phí tại chi tiết hóa đơn đã gửi, tối đa một lần mỗi ngày cho mỗi hóa đơn."
          : "Thông báo dành cho căn hộ hiện tại. Nhắc phí chỉ dành cho tài khoản căn hộ và người phụ trách thanh toán."}
      </p>
      <Feedback action={action} />
      {adding && (
        <section className="card narrow">
          <h2>Soạn thông báo</h2>
          <Editor
            action={action}
            onSave={(body) =>
              action.run(api, "POST", body, (n) =>
                navigate(`${base}/${n.ma_thong_bao}`),
              )
            }
          />
        </section>
      )}
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Tìm thông báo"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field label="Loại thông báo">
          <select name="loai" defaultValue={params.get("loai") || ""}>
            <Options values={types} empty="Tất cả" />
          </select>
        </Field>
        {admin ? (
          <Field label="Trạng thái thông báo">
            <select
              name="trang_thai"
              defaultValue={params.get("trang_thai") || ""}
            >
              <Options values={states} empty="Tất cả" />
            </select>
          </Field>
        ) : (
          <Field label="Trạng thái đọc">
            <select name="chua_doc" defaultValue={params.get("chua_doc") || ""}>
              <option value="">Tất cả</option>
              <option value="1">Chưa đọc</option>
            </select>
          </Field>
        )}
        <button>Lọc thông báo</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section
        className="card notification-inbox"
        aria-label="Danh sách thông báo"
      >
        {resource.result?.data.map((n) => (
          <article
            key={n.ma_thong_bao}
            className={`notification-item ${n.chua_doc ? "is-unread" : ""}`}
          >
            <Meta item={n} admin={admin} />
            <h2>
              <Link to={`${base}/${n.ma_thong_bao}`}>{n.tieu_de}</Link>
            </h2>
            <p>{n.tom_tat}</p>
          </article>
        ))}
        {resource.result?.total === 0 && <p>Chưa có thông báo phù hợp.</p>}
        <div className="actions">
          <button
            disabled={resource.loading || page <= 1}
            onClick={() => go(page - 1)}
          >
            Trang trước
          </button>
          <span>
            Trang {page} · {total} thông báo
          </span>
          <button
            disabled={resource.loading || page * 20 >= total}
            onClick={() => go(page + 1)}
          >
            Trang sau
          </button>
        </div>
      </section>
    </>
  );
}
export function AnnouncementDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri/thong-bao" : "/cu-dan/thong-bao",
    api = admin ? "/thong_bao" : "/cua_toi/thong_bao";
  const resource = useResource(`${api}/${id}`),
    n = resource.result?.data,
    action = useAction(resource.reload),
    [read, setRead] = useState(false),
    [readError, setReadError] = useState(null),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    if (admin || !n) return;
    let active = true;
    setRead(false);
    setReadError(null);
    getJson(`${api}/${id}/da_doc`, { method: "POST", body: {} })
      .then(() => {
        if (active) {
          setRead(true);
          changed();
        }
      })
      .catch((e) => {
        if (active) setReadError(e);
      });
    return () => {
      active = false;
    };
  }, [admin, api, id, n, retry]);
  const run = (name, body = {}) =>
    action.run(`${api}/${id}${name ? `/${name}` : ""}`, name ? "POST" : "PUT", {
      ...body,
      phien_ban: n.phien_ban,
    });
  return (
    <>
      <Link to={base}>← Danh sách thông báo</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Feedback action={action} />
      <ErrorBox error={readError} />
      {readError && (
        <button onClick={() => setRetry((x) => x + 1)}>
          Thử đánh dấu đã đọc
        </button>
      )}
      {n && (
        <>
          <section className="card notification-detail">
            <Meta
              item={read ? { ...n, chua_doc: 0, ngay_doc: n.ngay_gui } : n}
              admin={admin}
            />
            <h1>{n.tieu_de}</h1>
            <div className="notification-body">{n.noi_dung}</div>
            {n.ma_hoa_don && (
              <div className="notification-bill">
                <p>
                  {n.trang_thai_hoa_don === "DA_THANH_TOAN"
                    ? "Hóa đơn đã được xác nhận thanh toán."
                    : n.trang_thai_hoa_don === "HUY"
                      ? "Hóa đơn đã hủy."
                      : "Kiểm tra chi tiết hóa đơn và mã QR trước khi chuyển tiền."}
                </p>
                <Link
                  className="button primary"
                  to={`${admin ? "/quan-tri" : "/cu-dan"}/hoa-don/${n.ma_hoa_don}`}
                >
                  Xem hóa đơn
                </Link>
              </div>
            )}
            {n.ly_do_thu_hoi && (
              <p className="note">Lý do thu hồi: {n.ly_do_thu_hoi}</p>
            )}
          </section>
          {admin && n.trang_thai === "NHAP" && (
            <section className="card narrow">
              <h2>Chỉnh sửa bản nháp</h2>
              <Editor
                initial={n}
                action={action}
                onSave={(body) => run("", body)}
              />
              <p className="muted">
                Kiểm tra và lưu nội dung trước khi phát hành. Thông báo đã phát
                hành chỉ có thể thu hồi.
              </p>
              <button
                className="primary"
                disabled={action.pending}
                onClick={() => run("phat_hanh")}
              >
                Phát hành thông báo đã lưu
              </button>
            </section>
          )}
          {admin && n.trang_thai !== "THU_HOI" && (
            <section className="card narrow">
              <h2>Thu hồi thông báo</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run("thu_hoi", values(e));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Lý do thu hồi"
                    name="ly_do"
                    required
                    minLength={3}
                    maxLength={255}
                  />
                  <button>Thu hồi thông báo</button>
                </fieldset>
              </form>
            </section>
          )}
          {admin && (
            <section className="card">
              <h2>Lịch sử thông báo</h2>
              <ul>
                {n.history.map((h) => (
                  <li key={h.ma_lich_su}>
                    {date(h.ngay_tao)} · {events[h.su_kien] || h.su_kien} ·{" "}
                    {h.ho_va_ten}
                    {h.ghi_chu && ` · ${h.ghi_chu}`}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
