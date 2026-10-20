import DataTools from "../../shared/DataTools.jsx";
import React, { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";

const relations = {
  CHU_HO: "Chủ hộ",
  THANH_VIEN: "Thành viên",
  NGUOI_THUE: "Người thuê",
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const values = (event) => Object.fromEntries(new FormData(event.currentTarget));
const displayDay = (day) => day.split("-").reverse().join("/");

function ResidentCode({ value, label = false }) {
  const [notice, setNotice] = useState("");
  async function copy() {
    const code = String(value);
    let copied = false;
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(code);
        copied = true;
      } catch {
        /* Use the LAN-compatible fallback below. */
      }
    }
    if (!copied) {
      const previous = document.activeElement,
        input = document.createElement("textarea");
      input.value = code;
      input.readOnly = true;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      try {
        input.focus();
        input.select();
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      } finally {
        input.remove();
        previous?.focus?.({ preventScroll: true });
      }
    }
    setNotice(
      copied
        ? `Đã sao chép mã ${code}.`
        : "Chưa sao chép được. Hãy bôi đen mã số và sao chép thủ công.",
    );
  }
  return (
    <div className="resident-code">
      {label && <span>Mã cư dân:</span>}
      <code>{value}</code>
      <button
        type="button"
        aria-label={`Sao chép mã cư dân ${value}`}
        onClick={copy}
      >
        Sao chép
      </button>
      {notice && <small role="status">{notice}</small>}
    </div>
  );
}

function Pager({ resource }) {
  const [params, setParams] = useSearchParams();
  const page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(next) {
    const p = new URLSearchParams(params);
    p.set("page", String(next));
    setParams(p);
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
        Trang {page} · {total} hồ sơ
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
function useChange(reload) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(),
    [credentials, setCredentials] = useState(null);
  async function change(path, method, body, done) {
    setPending(true);
    setError(null);
    setCredentials(null);
    try {
      const result = await getJson(path, { method, body });
      const fresh = result.data?.tai_khoan_can_ho || result.data;
      if (fresh?.mat_khau_tam_thoi) setCredentials(fresh);
      done?.(result.data);
      reload();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return {
    pending,
    error,
    change,
    credentials,
    clearCredentials: () => setCredentials(null),
  };
}
function Credentials({ action }) {
  const account = action.credentials;
  return (
    account && (
      <section className="card" aria-label="Thông tin bàn giao tài khoản">
        <h2>Thông tin đăng nhập tài khoản căn hộ</h2>
        <p>
          Tên đăng nhập: <strong>{account.ten_dang_nhap}</strong>
        </p>
        {account.dien_thoai_phu_trach && (
          <p>
            Số điện thoại đăng nhập:{" "}
            <strong>{account.dien_thoai_phu_trach}</strong>
          </p>
        )}
        <p>
          Mật khẩu mới:{" "}
          <code style={{ overflowWrap: "anywhere" }}>
            {account.mat_khau_tam_thoi}
          </code>
        </p>
        <p>
          {account.nguoi_phu_trach
            ? `Bàn giao cho: ${account.nguoi_phu_trach}.`
            : "Chưa gắn cư dân phụ trách."}{" "}
          Mật khẩu chỉ hiển thị lần này. Chủ hộ nên đổi mật khẩu tại mục Tài
          khoản sau khi nhận.
        </p>
        <button onClick={action.clearCredentials}>
          Đã lưu thông tin, ẩn mật khẩu
        </button>
      </section>
    )
  );
}
export function ApartmentAccount({ id, onChange }) {
  const resource = useResource(`/can_ho/${id}`);
  const action = useChange(() => {
      resource.reload();
      onChange?.();
    }),
    apartment = resource.result?.data,
    account = apartment?.tai_khoan_can_ho;
  const owners = (apartment?.residents || []).filter(
    (r) => r.quan_he === "CHU_HO",
  );
  return (
    <section className="card">
      <h2>Tài khoản thanh toán căn hộ</h2>
      {apartment && <p>Căn {apartment.so_can_ho}</p>}
      <Credentials action={action} />
      {resource.loading && <Loading />}
      <ErrorBox error={action.error || resource.error} />
      {account ? (
        <>
          <p>
            Tên đăng nhập: <strong>{account.ten_dang_nhap}</strong> ·{" "}
            {account.dang_hoat_dong ? "Đang hoạt động" : "Đang khóa"}
          </p>
          <p>
            Số điện thoại đăng nhập:{" "}
            <strong>{account.dien_thoai_phu_trach || "Chưa gắn chủ hộ"}</strong>
          </p>
          <p>
            Người phụ trách:{" "}
            {account.ma_cu_dan_phu_trach ? (
              <Link to={`/quan-tri/cu-dan/${account.ma_cu_dan_phu_trach}`}>
                {account.nguoi_phu_trach}
              </Link>
            ) : (
              "Chưa gắn cư dân"
            )}
          </p>
          <p className="note">
            Tài khoản đi theo căn hộ và xem các hóa đơn đã gửi của căn. Bàn giao
            hoặc cấp lại mật khẩu sẽ ngắt mọi phiên cũ. Khi người phụ trách
            chuyển đi, tài khoản tạm khóa đến khi BQL bàn giao/cấp lại.
          </p>
          <button
            disabled={action.pending}
            onClick={() =>
              action.change(
                `/can_ho/${apartment.ma_can_ho}/tai_khoan`,
                "POST",
                {
                  thao_tac: "cap_lai_mat_khau",
                  phien_ban_ban_giao: account.phien_ban_ban_giao,
                },
              )
            }
          >
            Cấp lại mật khẩu và ngắt phiên cũ
          </button>
          {owners.some((r) => r.ma_cu_dan !== account.ma_cu_dan_phu_trach) && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const body = values(e);
                body.thao_tac = "ban_giao";
                body.phien_ban_ban_giao = account.phien_ban_ban_giao;
                body.xac_nhan_ban_giao = body.xac_nhan_ban_giao === "1";
                action.change(
                  `/can_ho/${apartment.ma_can_ho}/tai_khoan`,
                  "POST",
                  body,
                );
              }}
            >
              <fieldset disabled={action.pending}>
                <h3>Bàn giao người phụ trách</h3>
                <Field label="Chủ hộ nhận tài khoản">
                  <select name="ma_cu_dan" required defaultValue="">
                    <option value="">Chọn chủ hộ đang ở</option>
                    {owners
                      .filter(
                        (r) => r.ma_cu_dan !== account.ma_cu_dan_phu_trach,
                      )
                      .map((r) => (
                        <option key={r.ma_cu_dan} value={r.ma_cu_dan}>
                          {r.ho_va_ten} · {r.so_dien_thoai}
                        </option>
                      ))}
                  </select>
                </Field>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    name="xac_nhan_ban_giao"
                    value="1"
                    required={!!account.ma_cu_dan_phu_trach}
                  />
                  Xác nhận bàn giao và đổi mật khẩu tài khoản căn hộ
                </label>
                <button className="primary">Bàn giao tài khoản</button>
              </fieldset>
            </form>
          )}
        </>
      ) : (
        <p>
          Tài khoản chưa được khởi tạo. Hãy chạy migration mới nhất và tải lại.
        </p>
      )}
      {apartment?.lich_su_ban_giao?.length > 0 && (
        <details>
          <summary>Lịch sử bàn giao tài khoản</summary>
          <ul>
            {apartment.lich_su_ban_giao.map((row) => (
              <li key={row.ma_ban_giao}>
                {row.ngay_thuc_hien} ·{" "}
                {
                  {
                    TAO_TAI_KHOAN: "Tạo tài khoản",
                    BAN_GIAO_CHU_HO: "Bàn giao chủ hộ",
                    CAP_LAI_MAT_KHAU: "Cấp lại mật khẩu",
                    NGUNG_PHU_TRACH: "Ngừng phụ trách",
                    DOI_SO_DIEN_THOAI: "Đổi số điện thoại đăng nhập",
                  }[row.su_kien]
                }{" "}
                · {row.nguoi_thuc_hien}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function Apartments() {
  const [params, setParams] = useSearchParams();
  const resource = useResource(`/can_ho?${params}`);
  const [editing, setEditing] = useState(null),
    [selected, setSelected] = useState(null);
  const action = useChange(() => {
    resource.reload();
    setSelected(null);
  });
  return (
    <>
      <h1>Căn hộ</h1>
      <DataTools
        kind="can_ho"
        params={params}
        importable
        disabled={resource.loading}
      />
      <p>Trạng thái có người ở được xác định từ các đợt cư trú đang mở.</p>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Tìm số căn hộ hoặc khối"
          name="q"
          defaultValue={params.get("q") || ""}
          maxLength={100}
        />
        <Field
          label="Tầng (tùy chọn)"
          name="tang"
          type="number"
          min={0}
          max={200}
          defaultValue={params.get("tang") || ""}
        />
        <button>Tìm kiếm</button>
      </form>
      <ErrorBox error={resource.error || action.error} />
      <Credentials action={action} />
      <div className="detail-grid">
        <section className="card">
          <h2>Danh sách căn hộ</h2>
          {resource.loading && <Loading />}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Căn hộ</th>
                  <th>Khối / tầng</th>
                  <th>Diện tích</th>
                  <th>Cư dân</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {resource.result?.data.map((a) => (
                  <tr key={a.ma_can_ho}>
                    <td>{a.so_can_ho}</td>
                    <td>
                      {a.khoi} / {a.tang}
                    </td>
                    <td>{a.dien_tich_m2} m²</td>
                    <td>{a.so_cu_dan ? `${a.so_cu_dan} đang ở` : "Trống"}</td>
                    <td>
                      <div className="actions">
                        <button
                          onClick={() => {
                            action.clearCredentials();
                            setSelected(a.ma_can_ho);
                          }}
                        >
                          Xem
                        </button>
                        <button
                          disabled={action.pending}
                          onClick={() => setEditing(a)}
                        >
                          Sửa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!resource.loading && resource.result?.total === 0 && (
            <p>Chưa có căn hộ phù hợp.</p>
          )}
          <Pager resource={resource} />
        </section>
        <section className="card">
          <h2>{editing ? `Sửa căn ${editing.so_can_ho}` : "Thêm căn hộ"}</h2>
          <form
            key={editing?.ma_can_ho || "new"}
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget,
                body = values(e);
              body.tinh_phi_dich_vu = body.tinh_phi_dich_vu === "1";
              if (editing) body.phien_ban = editing.phien_ban;
              action.change(
                `/can_ho${editing ? `/${editing.ma_can_ho}` : ""}`,
                editing ? "PATCH" : "POST",
                body,
                () => {
                  form.reset();
                  setEditing(null);
                },
              );
            }}
          >
            <fieldset disabled={action.pending}>
              <Field
                label="Số căn hộ"
                name="so_can_ho"
                required
                maxLength={20}
                defaultValue={editing?.so_can_ho || ""}
              />
              <div className="form-grid">
                <Field
                  label="Khối"
                  name="khoi"
                  required
                  maxLength={10}
                  defaultValue={editing?.khoi || ""}
                />
                <Field
                  label="Tầng"
                  name="tang"
                  type="number"
                  required
                  min={0}
                  max={200}
                  defaultValue={editing?.tang ?? 1}
                />
              </div>
              <Field
                label="Diện tích (m²)"
                name="dien_tich_m2"
                type="number"
                required
                min="0.01"
                max="999999.99"
                step="0.01"
                defaultValue={editing?.dien_tich_m2 || ""}
              />
              <Field label="Tính phí dịch vụ">
                <select
                  name="tinh_phi_dich_vu"
                  defaultValue={editing?.tinh_phi_dich_vu === 0 ? "0" : "1"}
                >
                  <option value="1">Có</option>
                  <option value="0">Không</option>
                </select>
              </Field>
              <button className="primary">
                {action.pending ? "Đang lưu…" : "Lưu căn hộ"}
              </button>
            </fieldset>
          </form>
          {editing && (
            <button disabled={action.pending} onClick={() => setEditing(null)}>
              Hủy sửa
            </button>
          )}
        </section>
      </div>
      {selected && <ApartmentResidents id={selected} />}
    </>
  );
}
function ApartmentResidents({ id: selected }) {
  const detail = useResource(`/can_ho/${selected}`);
  return (
    <section className="card">
      {detail.loading && <Loading />}
      <ErrorBox error={detail.error} />
      <ApartmentAccount id={selected} key={selected} />
      {detail.result && (
        <>
          <h2>Cư dân căn {detail.result.data.so_can_ho}</h2>
          <Link
            className="button"
            to={`/quan-tri/cu-dan?ma_can_ho=${selected}&so=${encodeURIComponent(detail.result.data.so_can_ho)}`}
          >
            Thêm hoặc xem cư dân căn này
          </Link>
          <ul>
            {detail.result.data.residents.map((r) => (
              <li key={r.ma_cu_dan}>
                <Link to={`/quan-tri/cu-dan/${r.ma_cu_dan}`}>
                  {r.ho_va_ten}
                </Link>{" "}
                · {r.so_dien_thoai} · {relations[r.quan_he]} · Từ {r.tu_ngay}
              </li>
            ))}
          </ul>
          {!detail.result.data.residents.length && (
            <p>Chưa có cư dân đang ở.</p>
          )}
        </>
      )}
    </section>
  );
}

function ApartmentPicker({ initialId = "", initialLabel = "" }) {
  const [q, setQ] = useState(""),
    [id, setId] = useState(String(initialId)),
    [label, setLabel] = useState(initialLabel);
  const resource = useResource(`/can_ho?q=${encodeURIComponent(q)}`);
  const apartments = resource.result?.data || [];
  return (
    <>
      <Field label="Tìm căn hộ">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nhập số căn hộ hoặc khối"
        />
      </Field>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Field label="Căn hộ">
        <select
          name="ma_can_ho"
          required
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setLabel(e.target.selectedOptions[0].textContent);
          }}
        >
          <option value="">Chọn căn hộ</option>
          {id && !apartments.some((a) => String(a.ma_can_ho) === id) && (
            <option value={id}>{label || `Căn hộ #${id}`}</option>
          )}
          {apartments.map((a) => (
            <option key={a.ma_can_ho} value={a.ma_can_ho}>
              {a.so_can_ho} · Khối {a.khoi} · Tầng {a.tang}
            </option>
          ))}
        </select>
      </Field>
      {resource.result?.total > 20 && (
        <small>
          Có {resource.result.total} căn phù hợp. Nhập số căn cụ thể để thu hẹp
          danh sách.
        </small>
      )}
    </>
  );
}

function ProfileFields({ resident }) {
  const [q, setQ] = useState(""),
    [accountId, setAccountId] = useState(String(resident?.ma_nguoi_dung || ""));
  const users = useResource(`/cu_dan/tai_khoan?q=${encodeURIComponent(q)}`);
  const accounts = users.result?.data || [];
  return (
    <>
      <Field
        label="Họ tên"
        name="ho_va_ten"
        required
        minLength={2}
        maxLength={100}
        defaultValue={resident?.ho_va_ten || ""}
      />
      <Field
        label="Số điện thoại"
        name="so_dien_thoai"
        type="tel"
        required
        maxLength={15}
        defaultValue={resident?.so_dien_thoai || ""}
      />
      <ErrorBox error={users.error} />
      <Field label="Tìm tài khoản cá nhân theo tên hoặc số điện thoại">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
        />
      </Field>
      <input type="hidden" name="ma_nguoi_dung" value={accountId} />
      <Field label="Tài khoản cá nhân (tùy chọn)">
        <select
          disabled={users.loading || !!users.error}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          <option value="">Chưa gắn tài khoản</option>
          {accountId &&
            !accounts.some((u) => String(u.ma_nguoi_dung) === accountId) && (
              <option value={accountId}>Tài khoản đã chọn #{accountId}</option>
            )}
          {accounts.map((u) => (
            <option key={u.ma_nguoi_dung} value={u.ma_nguoi_dung}>
              {u.ho_va_ten} · {u.so_dien_thoai}
            </option>
          ))}
        </select>
      </Field>
      {users.result?.total > 20 && (
        <small>
          Nhập tên hoặc số điện thoại cụ thể để tìm trong {users.result.total}{" "}
          tài khoản.
        </small>
      )}
      <small>
        Đây là tài khoản cá nhân tùy chọn. Khi chọn vai trò Chủ hộ, hệ thống tự
        gắn thêm tài khoản thanh toán cố định của căn, không cần tạo thủ công
        tại mục Nhân sự.
      </small>
    </>
  );
}
function StayFields({
  current,
  initialId,
  initialLabel,
  minDay = "1900-01-01",
}) {
  const [relation, setRelation] = useState(current?.quan_he || "THANH_VIEN");
  return (
    <>
      <ApartmentPicker initialId={initialId} initialLabel={initialLabel} />
      <Field label="Quan hệ với căn hộ">
        <select
          name="quan_he"
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
        >
          <Options values={relations} />
        </select>
      </Field>
      {relation === "CHU_HO" && (
        <>
          <p className="note">
            Tự gắn tài khoản thanh toán của căn cho chủ hộ này và cấp mật khẩu
            mới để bàn giao.
          </p>
          <label className="checkbox">
            <input type="checkbox" name="xac_nhan_ban_giao" value="1" />
            Bàn giao tài khoản nếu căn đang có người phụ trách (ngắt mọi phiên
            cũ)
          </label>
        </>
      )}
      <Field
        label="Ngày bắt đầu / chuyển căn"
        name="ngay"
        type="date"
        required
        min={minDay}
        max={today()}
        defaultValue={today()}
      />
      {!current && (
        <small>
          Nhập ngày thực tế bắt đầu ở căn hộ, có thể trước ngày lập hồ sơ.
        </small>
      )}
    </>
  );
}

export function Residents() {
  const [params, setParams] = useSearchParams(),
    [adding, setAdding] = useState(false);
  const filter = new URLSearchParams(params);
  filter.delete("so");
  const resource = useResource(`/cu_dan?${filter}`);
  const action = useChange(resource.reload);
  return (
    <>
      <div className="page-heading">
        <h1>Cư dân</h1>
        <button
          className="primary"
          disabled={action.pending}
          onClick={() => setAdding(!adding)}
        >
          {adding ? "Đóng biểu mẫu" : "Thêm cư dân"}
        </button>
      </div>
      {params.get("ma_can_ho") && (
        <p>
          Đang lọc căn {params.get("so") || `#${params.get("ma_can_ho")}`} ·{" "}
          <Link to="/quan-tri/cu-dan">Xem tất cả cư dân</Link>
        </p>
      )}
      <ErrorBox error={action.error} />
      <DataTools
        kind="cu_dan"
        params={filter}
        importable
        disabled={resource.loading}
      />
      <Credentials action={action} />
      {adding && (
        <section className="card narrow">
          <h2>Hồ sơ và đợt cư trú đầu tiên</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const body = values(e);
              body.xac_nhan_ban_giao = body.xac_nhan_ban_giao === "1";
              action.change("/cu_dan", "POST", body, () => setAdding(false));
            }}
          >
            <fieldset disabled={action.pending}>
              <ProfileFields />
              <StayFields
                initialId={params.get("ma_can_ho") || ""}
                initialLabel={params.get("so") || ""}
              />
              <button className="primary">
                {action.pending ? "Đang lưu…" : "Lưu cư dân"}
              </button>
            </fieldset>
          </form>
        </section>
      )}
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          const p = new URLSearchParams(values(e));
          for (const key of ["ma_can_ho", "so"])
            if (params.has(key)) p.set(key, params.get(key));
          setParams(p);
        }}
      >
        <Field
          label="Tìm tên hoặc số điện thoại"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field
          label="Mã cư dân (tùy chọn)"
          name="ma_cu_dan"
          type="number"
          min={1}
          max={4294967295}
          step={1}
          defaultValue={params.get("ma_cu_dan") || ""}
        />
        <Field label="Tình trạng cư trú">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <option value="">Tất cả</option>
            <option value="DANG_O">Đang ở</option>
            <option value="DA_CHUYEN_DI">Đã chuyển đi</option>
          </select>
        </Field>
        <button>Tìm kiếm</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã cư dân</th>
                <th>Họ tên</th>
                <th>Số điện thoại</th>
                <th>Căn hộ hiện tại</th>
                <th>Quan hệ</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((r) => (
                <tr key={r.ma_cu_dan}>
                  <td>
                    <ResidentCode value={r.ma_cu_dan} />
                  </td>
                  <td>
                    <Link to={`/quan-tri/cu-dan/${r.ma_cu_dan}`}>
                      {r.ho_va_ten}
                    </Link>
                  </td>
                  <td>{r.so_dien_thoai}</td>
                  <td>{r.so_can_ho || "Đã chuyển đi"}</td>
                  <td>{relations[r.quan_he] || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!resource.loading && resource.result?.total === 0 && (
          <p>Chưa có cư dân phù hợp.</p>
        )}
        <Pager resource={resource} />
      </section>
    </>
  );
}

export function ResidentDetail() {
  const { id } = useParams(),
    resource = useResource(`/cu_dan/${id}`);
  const [mode, setMode] = useState("");
  const action = useChange(resource.reload);
  const resident = resource.result?.data,
    current = resident?.history.find((s) => !s.den_ngay);
  const minDay = current
    ? current.tu_ngay
    : resident?.history[0]?.den_ngay || "1900-01-01";
  const dateBlocked = mode !== "profile" && minDay > today();
  return (
    <>
      <Link to="/quan-tri/cu-dan">← Danh sách cư dân</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error || action.error} />
      <Credentials action={action} />
      {resident && (
        <>
          <h1>{resident.ho_va_ten}</h1>
          <ResidentCode value={resident.ma_cu_dan} label />
          <p className="muted">
            Dùng mã số này khi nhập phương tiện. Tên đăng nhập CH... là tài
            khoản căn hộ, không phải mã cư dân.
          </p>
          <p>
            {resident.so_dien_thoai} ·{" "}
            {current ? `Đang ở căn ${current.so_can_ho}` : "Đã chuyển đi"}
          </p>
          {resident.tai_khoan_can_ho && (
            <p>
              Đang phụ trách tài khoản thanh toán{" "}
              <strong>{resident.tai_khoan_can_ho.ten_dang_nhap}</strong> ·{" "}
              {resident.tai_khoan_can_ho.dang_hoat_dong
                ? "Hoạt động"
                : "Đang khóa"}
            </p>
          )}
          {current && (
            <p>
              Đợt cư trú hiện tại bắt đầu ngày {displayDay(current.tu_ngay)}.
            </p>
          )}
          <p>
            <Link
              className="button"
              to={`/quan-tri/phuong-tien?ma_cu_dan=${id}`}
            >
              Phương tiện của cư dân
            </Link>
          </p>
          <div className="actions">
            {[
              ["profile", "Sửa hồ sơ"],
              ...(current
                ? [
                    ["chuyen_can", "Chuyển căn"],
                    ["chuyen_di", "Ghi nhận chuyển đi"],
                  ]
                : [["nhap_cu", "Ghi nhận quay lại"]]),
            ].map(([value, label]) => (
              <button
                key={value}
                disabled={action.pending}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {mode && (
            <section className="card narrow">
              <h2>
                {
                  {
                    profile: "Sửa hồ sơ",
                    chuyen_can: "Chuyển căn",
                    chuyen_di: "Ghi nhận chuyển đi",
                    nhap_cu: "Ghi nhận quay lại",
                  }[mode]
                }
              </h2>
              {mode !== "profile" && (
                <p className="note" role="status">
                  {dateBlocked
                    ? `Chưa có ngày hợp lệ: ngày sớm nhất là ${displayDay(minDay)}, sau ngày hiện tại ${displayDay(today())}.`
                    : `Có thể chọn ngày từ ${displayDay(minDay)} đến ${displayDay(today())}, kể cả chuyển căn trong ngày bắt đầu ở. Lịch sử căn cũ vẫn được giữ.`}
                </p>
              )}
              <form
                key={`${mode}:${resident.phien_ban}`}
                onSubmit={(e) => {
                  e.preventDefault();
                  const body = { ...values(e), phien_ban: resident.phien_ban };
                  body.xac_nhan_ban_giao = body.xac_nhan_ban_giao === "1";
                  if (mode === "chuyen_can")
                    body.chuyen_phuong_tien = body.chuyen_phuong_tien === "1";
                  action.change(
                    `/cu_dan/${id}${mode === "profile" ? "" : `/${mode}`}`,
                    mode === "profile" ? "PATCH" : "POST",
                    body,
                    () => setMode(""),
                  );
                }}
              >
                <fieldset disabled={action.pending || dateBlocked}>
                  {mode === "profile" ? (
                    <ProfileFields resident={resident} />
                  ) : mode === "chuyen_di" ? (
                    <>
                      <p>Kết thúc đợt cư trú hiện tại và giữ lại lịch sử.</p>
                      <Field
                        label="Ngày chuyển đi"
                        name="ngay"
                        type="date"
                        required
                        min={minDay}
                        max={today()}
                        defaultValue={today()}
                      />
                    </>
                  ) : (
                    <StayFields current={current} minDay={minDay} />
                  )}
                  {mode === "chuyen_can" && (
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        name="chuyen_phuong_tien"
                        value="1"
                        defaultChecked
                      />{" "}
                      Chuyển đăng ký xe đang gửi sang căn mới
                    </label>
                  )}
                  {mode === "chuyen_can" && (
                    <p>
                      Đăng ký xe ở căn cũ sẽ kết thúc cùng ngày chuyển. Khi chọn
                      chuyển xe, hệ thống tạo đăng ký mới và giữ lịch sử căn cũ.
                    </p>
                  )}
                  {mode === "chuyen_di" && (
                    <p>
                      Tất cả đăng ký xe đang gửi của cư dân sẽ kết thúc cùng
                      ngày chuyển đi và được giữ trong lịch sử.
                    </p>
                  )}
                  <button className="primary">
                    {action.pending ? "Đang lưu…" : "Xác nhận lưu"}
                  </button>
                </fieldset>
              </form>
              <button disabled={action.pending} onClick={() => setMode("")}>
                Hủy
              </button>
            </section>
          )}
          <section className="card">
            <h2>Lịch sử cư trú</h2>
            <p>
              Ngày kết thúc không thuộc đợt cũ; khi chuyển căn, đợt mới bắt đầu
              cùng ngày đó. Các đợt bắt đầu và kết thúc cùng ngày được giữ để
              ghi nhận chuyển trong ngày; hệ thống không phân chia theo giờ.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Căn hộ</th>
                    <th>Quan hệ</th>
                    <th>Từ ngày</th>
                    <th>Đến trước ngày</th>
                    <th>Người ghi nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {resident.history.map((s) => (
                    <tr key={s.ma_lich_su_cu_tru}>
                      <td>{s.so_can_ho}</td>
                      <td>{relations[s.quan_he]}</td>
                      <td>{s.tu_ngay}</td>
                      <td>
                        {s.den_ngay || "Đang ở"}
                        {s.den_ngay === s.tu_ngay && (
                          <small> · Chuyển trong ngày</small>
                        )}
                      </td>
                      <td>{s.nguoi_ghi_nhan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
