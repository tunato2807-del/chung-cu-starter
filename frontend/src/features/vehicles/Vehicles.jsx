import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";

const types = { O_TO: "Ô tô", XE_MAY: "Xe máy", XE_DAP: "Xe đạp" };
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const formValues = (event) =>
  Object.fromEntries(new FormData(event.currentTarget));

function OwnerPicker({ initialId, onChoose }) {
  const [q, setQ] = useState(""),
    [selected, setSelected] = useState(null);
  const resource = useResource(
    `/cu_dan?trang_thai=DANG_O&q=${encodeURIComponent(q)}${!q && initialId ? `&ma_cu_dan=${initialId}` : ""}`,
  );
  const matches = resource.result?.data || [];
  function choose(id) {
    const owner = matches.find((r) => String(r.ma_cu_dan) === id) || null;
    setSelected(owner);
    onChoose(owner);
  }
  return (
    <>
      <Field label="Tìm cư dân theo tên hoặc số điện thoại">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
        />
      </Field>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Field label="Cư dân đăng ký xe">
        <select
          name="ma_cu_dan"
          required
          value={selected?.ma_cu_dan || ""}
          onChange={(e) => choose(e.target.value)}
        >
          <option value="">Chọn cư dân đang ở</option>
          {selected &&
            !matches.some((r) => r.ma_cu_dan === selected.ma_cu_dan) && (
              <option value={selected.ma_cu_dan}>
                {selected.ho_va_ten} · {selected.so_dien_thoai} · Căn{" "}
                {selected.so_can_ho}
              </option>
            )}
          {matches.map((r) => (
            <option value={r.ma_cu_dan} key={r.ma_cu_dan}>
              {r.ho_va_ten} · {r.so_dien_thoai} · Căn {r.so_can_ho}
            </option>
          ))}
        </select>
      </Field>
      <input
        type="hidden"
        name="ma_lich_su_cu_tru"
        value={selected?.ma_lich_su_cu_tru || ""}
      />
      {selected && (
        <p>
          Căn chịu phí: <strong>{selected.so_can_ho}</strong> · Cư trú từ{" "}
          {selected.tu_ngay}.
        </p>
      )}
      {resource.result?.total > 20 && (
        <small>
          Có {resource.result.total} cư dân phù hợp. Nhập tên hoặc số điện thoại
          cụ thể để tìm.
        </small>
      )}
    </>
  );
}

function VehicleForm({ initialId, pending, onSave }) {
  const [type, setType] = useState("XE_MAY"),
    [owner, setOwner] = useState(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(formValues(e));
      }}
    >
      <fieldset disabled={pending}>
        <OwnerPicker initialId={initialId} onChoose={setOwner} />
        <Field label="Loại xe">
          <select
            name="loai_xe"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <Options values={types} />
          </select>
        </Field>
        <Field
          label={type === "XE_DAP" ? "Biển số (tùy chọn)" : "Biển số"}
          name="bien_so"
          required={type !== "XE_DAP"}
          maxLength={30}
          placeholder="Ví dụ: 59A-123.45"
        />
        <div className="form-grid">
          <Field label="Hãng xe" name="hang_xe" maxLength={50} />
          <Field label="Màu sắc" name="mau_sac" maxLength={50} />
        </div>
        <Field
          label="Ngày đăng ký xe"
          name="ngay_dang_ky"
          type="date"
          required
          min={owner?.tu_ngay || "1900-01-01"}
          max={today()}
          defaultValue={today()}
        />
        <small>
          Ngày đăng ký từ ngày bắt đầu đợt cư trú đến hôm nay. Xe đạp không bắt
          buộc có biển số.
        </small>
        <button className="primary" disabled={!owner}>
          {pending ? "Đang lưu…" : "Lưu đăng ký xe"}
        </button>
      </fieldset>
    </form>
  );
}

function VehicleDetail({ id }) {
  const resource = useResource(`/phuong_tien/${id}`),
    record = resource.result?.data;
  return (
    <section className="card">
      <h2>Chi tiết đăng ký xe</h2>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      {record && (
        <>
          <h3>
            {record.ma_dang_ky} · {types[record.loai_xe]} ·{" "}
            {record.bien_so || "Không có biển số"}
          </h3>
          <p>
            <Link to={`/quan-tri/cu-dan/${record.ma_cu_dan}`}>
              {record.ho_va_ten}
            </Link>{" "}
            · {record.so_dien_thoai} · Căn chịu phí: {record.so_can_ho}
          </p>
          <p>
            Hãng xe: {record.hang_xe || "—"} · Màu sắc: {record.mau_sac || "—"}
          </p>
          <p>
            Từ ngày {record.ngay_dang_ky} ·{" "}
            {record.ngay_ket_thuc
              ? `Kết thúc trước ngày ${record.ngay_ket_thuc}`
              : "Đang gửi"}{" "}
            · Người tạo: {record.nguoi_tao}
          </p>
          {record.ngay_ket_thuc && (
            <p>
              Lý do kết thúc: {record.ly_do_ket_thuc} · Người ghi nhận:{" "}
              {record.nguoi_ket_thuc}
            </p>
          )}
          {record.ngay_ket_thuc === record.ngay_dang_ky && (
            <p>Đăng ký kết thúc trong ngày; bản ghi được giữ để xem lịch sử.</p>
          )}
          {record.ma_dang_ky_truoc && (
            <p>
              Chuyển tiếp từ{" "}
              <Link
                to={`/quan-tri/phuong-tien?q=${encodeURIComponent(record.dang_ky_truoc)}`}
              >
                {record.dang_ky_truoc}
              </Link>
              .
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default function Vehicles() {
  const [params, setParams] = useSearchParams();
  const resource = useResource(`/phuong_tien?${params}`);
  const [adding, setAdding] = useState(false),
    [ending, setEnding] = useState(null),
    [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [notice, setNotice] = useState("");
  async function save(path, body, message) {
    setPending(true);
    setError(null);
    setNotice("");
    try {
      await getJson(path, { method: "POST", body });
      setAdding(false);
      setEnding(null);
      setSelected(null);
      setNotice(message);
      resource.reload();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  function go(page) {
    const next = new URLSearchParams(params);
    next.set("page", String(page));
    setParams(next);
  }
  const page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Phương tiện</h1>
          <p>Quản lý đăng ký xe và căn hộ chịu phí theo từng đợt cư trú.</p>
        </div>
        <button
          className="primary"
          disabled={pending}
          onClick={() => {
            setAdding(!adding);
            setEnding(null);
          }}
        >
          {adding ? "Đóng biểu mẫu" : "Đăng ký xe"}
        </button>
      </div>
      {params.get("ma_cu_dan") && (
        <p>
          Đang lọc xe của cư dân #{params.get("ma_cu_dan")} ·{" "}
          <Link to="/quan-tri/phuong-tien">Xem tất cả</Link>
        </p>
      )}
      {notice && (
        <p className="note" role="status">
          {notice}
        </p>
      )}
      <ErrorBox error={error} />
      {adding && (
        <section className="card narrow">
          <h2>Đăng ký xe mới</h2>
          <VehicleForm
            initialId={params.get("ma_cu_dan")}
            pending={pending}
            onSave={(body) => save("/phuong_tien", body, "Đã tạo đăng ký xe.")}
          />
        </section>
      )}
      {ending && (
        <section className="card narrow">
          <h2>Kết thúc đăng ký {ending.ma_dang_ky}</h2>
          <p>
            {ending.bien_so || types[ending.loai_xe]} · Căn {ending.so_can_ho}.
            Bản ghi cũ sẽ được giữ trong lịch sử.
          </p>
          <form
            key={ending.ma_phuong_tien}
            onSubmit={(e) => {
              e.preventDefault();
              save(
                `/phuong_tien/${ending.ma_phuong_tien}/ket_thuc`,
                { ...formValues(e), phien_ban: ending.phien_ban },
                "Đã kết thúc đăng ký xe.",
              );
            }}
          >
            <fieldset disabled={pending}>
              <Field
                label="Ngày kết thúc đăng ký xe"
                name="ngay_ket_thuc"
                type="date"
                required
                min={ending.ngay_dang_ky}
                max={today()}
                defaultValue={today()}
              />
              <Field
                label="Lý do kết thúc"
                name="ly_do_ket_thuc"
                required
                minLength={3}
                maxLength={255}
              />
              <button className="primary">
                {pending ? "Đang lưu…" : "Xác nhận kết thúc"}
              </button>
            </fieldset>
          </form>
          <button disabled={pending} onClick={() => setEnding(null)}>
            Hủy
          </button>
        </section>
      )}
      <form
        key={params.toString()}
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          const next = new URLSearchParams(formValues(e));
          if (params.has("ma_cu_dan"))
            next.set("ma_cu_dan", params.get("ma_cu_dan"));
          setParams(next);
        }}
      >
        <Field
          label="Tìm biển số, mã đăng ký, cư dân hoặc căn hộ"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field label="Lọc loại xe">
          <select name="loai_xe" defaultValue={params.get("loai_xe") || ""}>
            <Options values={types} empty="Tất cả loại xe" />
          </select>
        </Field>
        <Field label="Tình trạng đăng ký">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <option value="">Tất cả đăng ký</option>
            <option value="DANG_GUI">Đang gửi</option>
            <option value="DA_KET_THUC">Đã kết thúc</option>
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
                <th>Mã đăng ký</th>
                <th>Loại / biển số</th>
                <th>Cư dân</th>
                <th>Căn chịu phí</th>
                <th>Thời gian</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((v) => (
                <tr key={v.ma_phuong_tien}>
                  <td>{v.ma_dang_ky}</td>
                  <td>
                    {types[v.loai_xe]}
                    <br />
                    {v.bien_so || "Không có biển số"}
                  </td>
                  <td>
                    <Link to={`/quan-tri/cu-dan/${v.ma_cu_dan}`}>
                      {v.ho_va_ten}
                    </Link>
                  </td>
                  <td>{v.so_can_ho}</td>
                  <td>
                    {v.ngay_dang_ky}
                    <br />
                    {v.ngay_ket_thuc
                      ? `Đến trước ${v.ngay_ket_thuc}`
                      : "Đang gửi"}
                  </td>
                  <td>
                    <div className="actions">
                      <button onClick={() => setSelected(v.ma_phuong_tien)}>
                        Chi tiết
                      </button>
                      {!v.ngay_ket_thuc && (
                        <button
                          disabled={pending}
                          onClick={() => {
                            setEnding(v);
                            setAdding(false);
                          }}
                        >
                          Kết thúc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!resource.loading && resource.result?.total === 0 && (
          <p>Chưa có đăng ký xe phù hợp.</p>
        )}
        <div className="actions">
          <button
            disabled={resource.loading || page <= 1}
            onClick={() => go(page - 1)}
          >
            Trang trước
          </button>
          <span>
            Trang {page} · {total} đăng ký
          </span>
          <button
            disabled={resource.loading || page * 20 >= total}
            onClick={() => go(page + 1)}
          >
            Trang sau
          </button>
        </div>
      </section>
      {selected && <VehicleDetail id={selected} />}
    </>
  );
}
