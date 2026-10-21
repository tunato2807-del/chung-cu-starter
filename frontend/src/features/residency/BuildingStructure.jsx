import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { ErrorBox, Field, Loading, useResource } from "../../shared/ui.jsx";
import "./BuildingMap.css";

export default function BuildingStructure() {
  const resource = useResource("/cau_truc_toa_nha");
  const [selected, setSelected] = useState("");
  const [editor, setEditor] = useState(null),
    [confirmation, setConfirmation] = useState(null);
  const [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [notice, setNotice] = useState("");
  const blocks = resource.result?.data.khoi || [];
  const block = blocks.find((item) => item.khoi === selected) || blocks[0];
  function open(value) {
    setEditor(value);
    setConfirmation(null);
    setError(null);
    setNotice("");
  }
  async function change(path, method, body) {
    setPending(true);
    setError(null);
    setNotice("");
    try {
      const result = await getJson(path, { method, body });
      setSelected(result.data.khoi || block?.khoi || "");
      setEditor(null);
      setConfirmation(null);
      setNotice(
        method === "DELETE"
          ? "Đã xóa mục chưa sử dụng."
          : "Đã lưu cấu trúc tòa nhà.",
      );
      resource.reload();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="building-map">
      <div className="page-heading">
        <div>
          <p className="eyebrow">DANH MỤC TÒA NHÀ</p>
          <h1>Khối & tầng</h1>
        </div>
        <Link className="button" to="/quan-tri/so-do-toa-nha">
          Xem sơ đồ tòa nhà
        </Link>
      </div>
      <p>
        Khai báo khối và tầng trước khi thêm căn hộ. Khối/tầng được khai báo ở
        đây vẫn xuất hiện khi chưa có căn.
      </p>
      <div className="actions">
        <button
          className="primary"
          disabled={pending}
          onClick={() => open({ type: "block", row: null })}
        >
          Thêm khối
        </button>
        <button
          disabled={pending || resource.loading}
          onClick={() => {
            setEditor(null);
            setConfirmation(null);
            setError(null);
            resource.reload();
          }}
        >
          Tải lại danh mục
        </button>
      </div>
      {notice && <p role="status">{notice}</p>}
      <ErrorBox error={error || resource.error} />
      {resource.loading && <Loading />}
      {resource.result && (
        <section
          className="card building-structure-list"
          aria-label="Danh mục khối và tầng"
        >
          {!blocks.length ? (
            <p>Chưa có khối. Bấm Thêm khối để bắt đầu.</p>
          ) : (
            <>
              <Field label="Khối cần quản lý">
                <select
                  value={block?.khoi || ""}
                  disabled={pending}
                  onChange={(event) => {
                    setSelected(event.target.value);
                    open(null);
                  }}
                >
                  {blocks.map((item) => (
                    <option key={item.khoi} value={item.khoi}>
                      Khối {item.khoi}
                      {item.ten_khoi ? ` · ${item.ten_khoi}` : ""} ·{" "}
                      {item.so_can_ho} căn
                    </option>
                  ))}
                </select>
              </Field>
              <h2>
                Khối {block.khoi}
                {block.ten_khoi ? ` · ${block.ten_khoi}` : ""}
              </h2>
              {block.mo_ta && <p>{block.mo_ta}</p>}
              <p>
                {block.tang.length} tầng · {block.so_can_ho} căn hộ ·{" "}
                {block.so_cu_dan} cư dân đang ở
              </p>
              <div className="actions">
                <button
                  disabled={pending}
                  onClick={() => open({ type: "block", row: block })}
                >
                  Sửa khối
                </button>
                <button
                  disabled={pending}
                  onClick={() =>
                    open({ type: "floor", khoi: block.khoi, row: null })
                  }
                >
                  Thêm tầng
                </button>
                <button
                  className="danger"
                  disabled={pending || block.tang.length > 0}
                  onClick={() => {
                    setEditor(null);
                    setConfirmation({
                      type: "block",
                      khoi: block.khoi,
                      row: block,
                    });
                    setError(null);
                  }}
                >
                  Xóa khối
                </button>
              </div>
              <p className="muted">
                Chỉ xóa tầng không có căn hộ và khối không còn tầng. Đổi mã khối
                hoặc số tầng sẽ cập nhật vị trí cấu trúc của các căn, giữ nguyên
                mã căn, cư trú và hóa đơn.
              </p>
              {!block.tang.length ? (
                <p>Khối chưa có tầng. Bấm Thêm tầng để khai báo.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Tầng</th>
                        <th>Tên hiển thị</th>
                        <th>Căn hộ</th>
                        <th>Mô tả</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {block.tang.map((item) => (
                        <tr key={item.tang}>
                          <td>Tầng {item.tang}</td>
                          <td>{item.ten_tang || "—"}</td>
                          <td>{item.so_can_ho}</td>
                          <td>{item.mo_ta || "—"}</td>
                          <td>
                            <div className="actions">
                              <button
                                disabled={pending}
                                onClick={() =>
                                  open({
                                    type: "floor",
                                    khoi: block.khoi,
                                    row: item,
                                  })
                                }
                              >
                                Sửa tầng {item.tang}
                              </button>
                              <button
                                className="danger"
                                disabled={pending || item.so_can_ho > 0}
                                onClick={() => {
                                  setEditor(null);
                                  setConfirmation({
                                    type: "floor",
                                    khoi: block.khoi,
                                    row: item,
                                  });
                                  setError(null);
                                }}
                              >
                                Xóa tầng {item.tang}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      )}
      {editor && (
        <section
          className="card building-structure-editor"
          aria-label="Biểu mẫu khối tầng"
        >
          <h2>
            {editor.row ? "Sửa" : "Thêm"}{" "}
            {editor.type === "block" ? "khối" : `tầng · Khối ${editor.khoi}`}
          </h2>
          <form
            key={`${editor.type}:${editor.khoi}:${editor.row?.khoi}:${editor.row?.tang}:${editor.row?.phien_ban}`}
            onSubmit={(event) => {
              event.preventDefault();
              const body = Object.fromEntries(
                new FormData(event.currentTarget),
              );
              if (editor.row) body.phien_ban = editor.row.phien_ban;
              const path =
                editor.type === "block"
                  ? `/cau_truc_toa_nha/khoi${editor.row ? `/${encodeURIComponent(editor.row.khoi)}` : ""}`
                  : `/cau_truc_toa_nha/khoi/${encodeURIComponent(editor.khoi)}/tang${editor.row ? `/${editor.row.tang}` : ""}`;
              change(path, editor.row ? "PATCH" : "POST", body);
            }}
          >
            <fieldset disabled={pending}>
              {editor.type === "block" ? (
                <>
                  <Field
                    label="Mã khối"
                    name="khoi"
                    required
                    maxLength={10}
                    defaultValue={editor.row?.khoi || ""}
                  />
                  <Field
                    label="Tên hiển thị khối"
                    name="ten_khoi"
                    maxLength={100}
                    defaultValue={editor.row?.ten_khoi || ""}
                  />
                </>
              ) : (
                <>
                  <Field
                    label="Số tầng"
                    name="tang"
                    type="number"
                    required
                    min={0}
                    max={200}
                    step={1}
                    defaultValue={editor.row?.tang ?? 0}
                  />
                  <Field
                    label="Tên hiển thị tầng"
                    name="ten_tang"
                    maxLength={100}
                    defaultValue={editor.row?.ten_tang || ""}
                    placeholder="Ví dụ: Tầng trệt"
                  />
                </>
              )}
              <Field
                label="Mô tả"
                name="mo_ta"
                maxLength={255}
                defaultValue={editor.row?.mo_ta || ""}
              />
              {editor.row && (
                <p>
                  Đổi mã khối/số tầng áp dụng cho tất cả căn trong mục này. Các
                  biểu mẫu cũ phải tải lại trước khi lưu.
                </p>
              )}
              <div className="actions">
                <button className="primary">
                  {pending ? "Đang lưu…" : "Lưu cấu trúc"}
                </button>
                <button type="button" onClick={() => open(null)}>
                  Hủy sửa
                </button>
              </div>
            </fieldset>
          </form>
        </section>
      )}
      {confirmation && (
        <section
          className="card building-structure-editor"
          role="alertdialog"
          aria-label="Xác nhận xóa cấu trúc"
        >
          <h2>
            Xóa{" "}
            {confirmation.type === "block"
              ? `khối ${confirmation.khoi}`
              : `tầng ${confirmation.row.tang} · Khối ${confirmation.khoi}`}
            ?
          </h2>
          <p>
            Hệ thống sẽ kiểm tra lại mục này chưa được sử dụng trước khi xóa.
          </p>
          <div className="actions">
            <button
              className="danger"
              disabled={pending}
              onClick={() =>
                change(
                  `/cau_truc_toa_nha/khoi/${encodeURIComponent(confirmation.khoi)}${confirmation.type === "floor" ? `/tang/${confirmation.row.tang}` : ""}`,
                  "DELETE",
                  { phien_ban: confirmation.row.phien_ban },
                )
              }
            >
              Xác nhận xóa
            </button>
            <button disabled={pending} onClick={() => setConfirmation(null)}>
              Giữ lại
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
