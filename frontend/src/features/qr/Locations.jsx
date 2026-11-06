import React, { useCallback, useId, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EquipmentPicker, QrLinkEditor } from "./QrEquipment.jsx";
import QrPreview, { downloadQr, printQr } from "./QrPreview.jsx";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";
export default function Locations() {
  const [params, setParams] = useSearchParams();
  const previewId = useId();
  const resource = useResource(`/vi_tri_qr?${params}`),
    [type, setType] = useState(
      params.get("ma_thiet_bi") ? "THIET_BI" : "KHU_VUC",
    ),
    [device, setDevice] = useState(null),
    [editingLink, setEditingLink] = useState(null),
    [selected, setSelected] = useState(),
    [error, setError] = useState(),
    [pending, setPending] = useState(false),
    [exportPending, setExportPending] = useState(false),
    [confirmation, setConfirmation] = useState();
  const closePreview = useCallback(() => setSelected(null), []);
  async function exportQr(location, operation) {
    setExportPending(true);
    setError(null);
    try {
      await operation(location);
    } catch (error) {
      setError(error);
    } finally {
      setExportPending(false);
    }
  }
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
          setSelected(null);
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
      <div className={editingLink || confirmation ? "detail-grid" : undefined}>
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
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={
                      selected?.location.ma_vi_tri_qr === l.ma_vi_tri_qr
                    }
                    aria-controls={
                      selected?.location.ma_vi_tri_qr === l.ma_vi_tri_qr
                        ? previewId
                        : undefined
                    }
                    onClick={(event) => {
                      const anchor = event.currentTarget;
                      setSelected((current) =>
                        current?.anchor === anchor
                          ? null
                          : { location: l, anchor },
                      );
                      setConfirmation(null);
                      setEditingLink(null);
                    }}
                    disabled={!l.dang_hoat_dong}
                  >
                    Xem QR
                  </button>
                  <button
                    type="button"
                    disabled={!l.dang_hoat_dong || pending || exportPending}
                    onClick={() => exportQr(l, downloadQr)}
                  >
                    Tải ảnh QR
                  </button>
                  <button
                    type="button"
                    disabled={!l.dang_hoat_dong || pending || exportPending}
                    onClick={() => exportQr(l, printQr)}
                  >
                    In mã này
                  </button>
                  {!!l.dang_hoat_dong && (
                    <Link className="button" to={`/r/${l.token_qr}`}>
                      Mở thử biểu mẫu
                    </Link>
                  )}
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
                    onClick={() => {
                      setSelected(null);
                      setEditingLink(null);
                      setConfirmation(l);
                    }}
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
                  setSelected(null);
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
                  setSelected(null);
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
        {(editingLink || confirmation) && (
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
          </div>
        )}
      </div>
      {selected && (
        <QrPreview
          key={selected.location.token_qr}
          id={previewId}
          location={selected.location}
          anchor={selected.anchor}
          onClose={closePreview}
          onError={setError}
        />
      )}
    </>
  );
}
