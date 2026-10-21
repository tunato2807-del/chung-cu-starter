import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Link, useSearchParams } from "react-router-dom";
import { EquipmentPicker, QrLinkEditor } from "./QrEquipment.jsx";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";
function QrCard({ location }) {
  const [image, setImage] = useState(""),
    [error, setError] = useState();
  const url = `${window.location.origin}/r/${location.token_qr}`;
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, { width: 320, margin: 2, errorCorrectionLevel: "M" })
      .then((x) => {
        if (active) setImage(x);
      })
      .catch(setError);
    return () => {
      active = false;
    };
  }, [url]);
  return (
    <section className="qr-print card">
      <h2>{location.ten_vi_tri}</h2>
      {location.ma_thiet_bi && (
        <p>
          {location.ma_tai_san} · {location.ten_thiet_bi}
        </p>
      )}
      <p>Quét mã để gửi phản ánh tại vị trí</p>
      {image && (
        <img
          className="qr-image"
          src={image}
          alt={`Mã QR ${location.ten_vi_tri}`}
        />
      )}
      <ErrorBox error={error} />
      <p className="qr-url">{url}</p>
      <div className="actions no-print">
        <Link className="button" to={`/r/${location.token_qr}`}>
          Mở thử biểu mẫu
        </Link>
        {image && (
          <a
            className="button"
            href={image}
            download={`vi-tri-${location.ma_vi_tri_qr}.png`}
          >
            Tải ảnh QR
          </a>
        )}
        <button onClick={() => window.print()}>In mã này</button>
      </div>
      <p className="muted">
        Để quét trên điện thoại, hãy mở hệ thống bằng tên miền HTTPS mà điện
        thoại truy cập được trước khi in.
      </p>
    </section>
  );
}
export default function Locations() {
  const [params, setParams] = useSearchParams();
  const resource = useResource(`/vi_tri_qr?${params}`),
    [type, setType] = useState(
      params.get("ma_thiet_bi") ? "THIET_BI" : "KHU_VUC",
    ),
    [device, setDevice] = useState(null),
    [editingLink, setEditingLink] = useState(null),
    [selected, setSelected] = useState(),
    [error, setError] = useState(),
    [pending, setPending] = useState(false),
    [confirmation, setConfirmation] = useState();
  async function change(action) {
    setPending(true);
    setError(null);
    try {
      await action();
      setSelected(null);
      setConfirmation(null);
      setEditingLink(null);
      resource.reload();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">DANH MỤC TÒA NHÀ</p>
          <h1>Vị trí & mã QR</h1>
        </div>
      </div>
      <ErrorBox error={error} />
      <form
        className="filters no-print"
        onSubmit={(event) => {
          event.preventDefault();
          const next = new URLSearchParams(params);
          next.set("q", new FormData(event.currentTarget).get("q"));
          next.delete("page");
          setParams(next);
        }}
      >
        <Field
          label="Tìm vị trí hoặc thiết bị"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <button>Tìm vị trí</button>
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setEditingLink(null);
            resource.reload();
          }}
        >
          Tải lại vị trí
        </button>
        {params.get("ma_thiet_bi") && (
          <Link to="/quan-tri/vi-tri-qr">Xem tất cả vị trí</Link>
        )}
      </form>
      <div className="detail-grid">
        <section className="card no-print">
          <h2>Thêm vị trí</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const body = Object.fromEntries(new FormData(form));
              body.ma_thiet_bi =
                type === "THIET_BI" ? (device?.ma_thiet_bi ?? null) : null;
              change(async () => {
                await getJson("/vi_tri_qr", { method: "POST", body });
                form.reset();
                setDevice(null);
                setType("KHU_VUC");
              });
            }}
          >
            <fieldset disabled={pending}>
              <Field
                label="Tên vị trí"
                name="ten_vi_tri"
                required
                minLength={2}
                maxLength={100}
              />
              <Field label="Loại vị trí">
                <select
                  name="loai"
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value);
                    setDevice(null);
                  }}
                >
                  <Options
                    values={{ KHU_VUC: "Khu vực", THIET_BI: "Thiết bị" }}
                  />
                </select>
              </Field>
              {type === "THIET_BI" && (
                <fieldset disabled={pending}>
                  <EquipmentPicker
                    value={device}
                    onChange={setDevice}
                    initialId={params.get("ma_thiet_bi")}
                  />
                </fieldset>
              )}
              <Field label="Mô tả" name="mo_ta" maxLength={255} />
              <button className="primary" disabled={pending}>
                Tạo vị trí và mã QR
              </button>
            </fieldset>
          </form>
          <h2>Danh sách vị trí</h2>
          {resource.loading && <Loading />}
          <ErrorBox error={resource.error} />
          <ul className="location-list">
            {resource.result?.data.map((l) => (
              <li key={l.ma_vi_tri_qr}>
                <strong>{l.ten_vi_tri}</strong>
                <small>
                  {l.dang_hoat_dong ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                </small>
                {l.ma_thiet_bi && (
                  <p>
                    <Link to={`/quan-tri/thiet-bi/${l.ma_thiet_bi}`}>
                      {l.ma_tai_san} · {l.ten_thiet_bi}
                    </Link>
                  </p>
                )}
                <div className="actions">
                  <button
                    onClick={() => {
                      setSelected(l);
                      setConfirmation(null);
                    }}
                    disabled={!l.dang_hoat_dong}
                  >
                    Xem QR
                  </button>
                  <button
                    disabled={pending}
                    onClick={() =>
                      change(() =>
                        getJson(`/vi_tri_qr/${l.ma_vi_tri_qr}`, {
                          method: "PATCH",
                          body: {
                            dang_hoat_dong: !l.dang_hoat_dong,
                            phien_ban: l.phien_ban,
                          },
                        }),
                      )
                    }
                  >
                    {l.dang_hoat_dong ? "Vô hiệu hóa" : "Kích hoạt"}
                  </button>
                  {l.loai === "THIET_BI" && (
                    <button
                      disabled={pending}
                      onClick={() => {
                        setEditingLink(l);
                        setSelected(null);
                        setConfirmation(null);
                      }}
                    >
                      Liên kết thiết bị
                    </button>
                  )}
                  <button
                    disabled={pending || !l.dang_hoat_dong}
                    onClick={() => setConfirmation(l)}
                  >
                    Thay mã
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {resource.result?.data.length === 0 && <p>Chưa có vị trí nào.</p>}
          {resource.result && (
            <div className="actions">
              <button
                disabled={resource.loading || resource.result.page <= 1}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set("page", String(resource.result.page - 1));
                  setParams(next);
                }}
              >
                Trang vị trí trước
              </button>
              <span>
                {resource.result.total} vị trí · Trang {resource.result.page}
              </span>
              <button
                disabled={
                  resource.loading ||
                  resource.result.page * 20 >= resource.result.total
                }
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set("page", String(resource.result.page + 1));
                  setParams(next);
                }}
              >
                Trang vị trí sau
              </button>
            </div>
          )}
        </section>
        <div>
          {editingLink && (
            <QrLinkEditor
              key={`${editingLink.ma_vi_tri_qr}:${editingLink.phien_ban}`}
              location={editingLink}
              onSaved={() => {
                setEditingLink(null);
                resource.reload();
              }}
              onClose={() => {
                setEditingLink(null);
                resource.reload();
              }}
            />
          )}
          {confirmation && (
            <section className="card no-print" role="alert">
              <h2>Thay QR: {confirmation.ten_vi_tri}?</h2>
              <p>Mã đã in sẽ mất hiệu lực. Bạn cần in và dán mã mới.</p>
              <div className="actions">
                <button
                  className="danger"
                  disabled={pending}
                  onClick={() =>
                    change(() =>
                      getJson(
                        `/vi_tri_qr/${confirmation.ma_vi_tri_qr}/sinh_lai_qr`,
                        {
                          method: "POST",
                          body: { phien_ban: confirmation.phien_ban },
                        },
                      ),
                    )
                  }
                >
                  Xác nhận thay mã
                </button>
                <button onClick={() => setConfirmation(null)}>Hủy</button>
              </div>
            </section>
          )}
          {selected ? (
            <QrCard key={selected.token_qr} location={selected} />
          ) : editingLink ? null : (
            <div className="card no-print">
              <h2>In mã tại vị trí</h2>
              <p className="muted">
                Chọn “Xem QR” để xem trước, tải ảnh hoặc in mã dán.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
