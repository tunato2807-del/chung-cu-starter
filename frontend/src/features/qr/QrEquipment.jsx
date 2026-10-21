import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  date,
  useResource,
} from "../../shared/ui.jsx";

function EquipmentOptions({ path, onChoose, page, onPage }) {
  const resource = useResource(path);
  return (
    <>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Field label="Chọn thiết bị">
        <select
          value=""
          onChange={(event) => {
            const row = resource.result?.data.find(
              (item) => String(item.ma_thiet_bi) === event.target.value,
            );
            if (row) onChoose(row);
          }}
        >
          <option value="">Chọn trong kết quả tìm kiếm</option>
          {resource.result?.data.map((item) => (
            <option
              key={item.ma_thiet_bi}
              value={item.ma_thiet_bi}
              disabled={item.trang_thai === "NGUNG_SU_DUNG"}
            >
              {item.ma_tai_san} · {item.ten_thiet_bi}
              {item.trang_thai === "NGUNG_SU_DUNG" ? " · Đã ngừng sử dụng" : ""}
            </option>
          ))}
        </select>
      </Field>
      {resource.result && (
        <p className="muted">
          {resource.result.total} thiết bị phù hợp. Đang xem tối đa 20 thiết bị
          trên trang.
        </p>
      )}
      <div className="actions">
        <button
          type="button"
          disabled={resource.loading || page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Trang thiết bị trước
        </button>
        <span>Trang {page}</span>
        <button
          type="button"
          disabled={
            resource.loading ||
            !resource.result ||
            page * 20 >= resource.result.total
          }
          onClick={() => onPage(page + 1)}
        >
          Trang thiết bị sau
        </button>
      </div>
    </>
  );
}
export function EquipmentPicker({ value, onChange, initialId }) {
  const [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [error, setError] = useState(null);
  useEffect(() => {
    if (!initialId) return;
    const controller = new AbortController();
    getJson(`/thiet_bi/${encodeURIComponent(initialId)}`, {
      signal: controller.signal,
    })
      .then((result) => {
        if (!controller.signal.aborted) onChange(result.data);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err);
      });
    return () => controller.abort();
    // initialId identifies the device in the incoming equipment-page link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);
  const path = `/thiet_bi?${new URLSearchParams({ q: query, page: String(page) })}`;
  return (
    <div className="qr-equipment-picker">
      <Field
        label="Tìm thiết bị theo mã hoặc tên"
        value={query}
        maxLength={100}
        onChange={(event) => {
          setQuery(event.target.value);
          setPage(1);
        }}
      />
      <ErrorBox error={error} />
      <EquipmentOptions
        key={path}
        path={path}
        onChoose={onChange}
        page={page}
        onPage={setPage}
      />
      <p>
        {value
          ? `Đã chọn: ${value.ma_tai_san} · ${value.ten_thiet_bi}`
          : "Chưa liên kết hồ sơ thiết bị."}
      </p>
      {value && (
        <button type="button" onClick={() => onChange(null)}>
          Bỏ chọn thiết bị
        </button>
      )}
    </div>
  );
}
export function QrLinkEditor({ location, onSaved, onClose }) {
  const [device, setDevice] = useState(location.ma_thiet_bi ? location : null),
    [pending, setPending] = useState(false),
    [error, setError] = useState(null);
  const history = useResource(`/vi_tri_qr/${location.ma_vi_tri_qr}`);
  return (
    <section className="card no-print" aria-label="Liên kết thiết bị với QR">
      <h2>Liên kết thiết bị · {location.ten_vi_tri}</h2>
      <p>
        Liên kết áp dụng cho phản ánh gửi sau khi lưu. Phản ánh cũ giữ nguyên
        thiết bị lúc gửi. URL và ảnh QR không đổi; kiểm tra lại tem đang dán
        trước khi đổi sang thiết bị khác.
      </p>
      <ErrorBox error={error} />
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          try {
            await getJson(`/vi_tri_qr/${location.ma_vi_tri_qr}/thiet_bi`, {
              method: "PUT",
              body: {
                ma_thiet_bi: device?.ma_thiet_bi ?? null,
                phien_ban: location.phien_ban,
                xac_nhan_doi_lien_ket: true,
              },
            });
            onSaved();
          } catch (err) {
            setError(err);
          } finally {
            setPending(false);
          }
        }}
      >
        <fieldset disabled={pending}>
          <EquipmentPicker value={device} onChange={setDevice} />
          <label className="check">
            <input type="checkbox" required /> Tôi đã kiểm tra thiết bị trên tem
            QR và đồng ý thay đổi liên kết cho các phản ánh tiếp theo.
          </label>
          <div className="actions">
            <button className="primary">
              {pending ? "Đang lưu…" : "Lưu liên kết"}
            </button>
            <button type="button" onClick={onClose}>
              Đóng và tải lại
            </button>
          </div>
        </fieldset>
      </form>
      <details>
        <summary>20 thay đổi liên kết gần nhất</summary>
        {history.loading && <Loading />}
        <ErrorBox error={history.error} />
        <ul>
          {history.result?.data.lich_su_lien_ket.map((item) => (
            <li key={item.ma_lich_su}>
              {date(item.ngay_tao)} · {item.tai_san_cu || "Chưa liên kết"} →{" "}
              {item.tai_san_moi || "Bỏ liên kết"} · {item.nguoi_thuc_hien}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

export function EquipmentQrConnections({ id }) {
  const locations = useResource(`/vi_tri_qr?ma_thiet_bi=${id}`),
    incidents = useResource(`/phan_anh?ma_thiet_bi=${id}`);
  return (
    <section className="card" aria-label="QR và phản ánh của thiết bị">
      <h2>QR & phản ánh của thiết bị</h2>
      <div className="actions">
        <Link className="button" to={`/quan-tri/vi-tri-qr?ma_thiet_bi=${id}`}>
          Quản lý QR của thiết bị
        </Link>
        <Link className="button" to={`/quan-tri/phan-anh?ma_thiet_bi=${id}`}>
          Xem phản ánh của thiết bị
        </Link>
        <button
          onClick={() => {
            locations.reload();
            incidents.reload();
          }}
        >
          Cập nhật liên kết và phản ánh
        </button>
      </div>
      {(locations.loading || incidents.loading) && <Loading />}
      <ErrorBox error={locations.error || incidents.error} />
      {locations.result && (
        <p>
          {locations.result.total} vị trí QR đang liên kết (gồm cả vị trí đã vô
          hiệu hóa).
        </p>
      )}
      {incidents.result && (
        <>
          <p>
            {incidents.result.meta.total} phản ánh ghi nhận thiết bị này lúc
            gửi. Các phản ánh trước khi có liên kết không được tự gán lại.
          </p>
          <ul>
            {incidents.result.data.slice(0, 5).map((item) => (
              <li key={item.ma_phan_anh}>
                <Link to={`/quan-tri/phan-anh/${item.ma_phan_anh}`}>
                  #{item.ma_phan_anh} · {item.tieu_de}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
