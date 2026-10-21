import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { ErrorBox, Field, Loading } from "../../shared/ui.jsx";
import "./BuildingMap.css";

// Associate results with the current path/revision; old floors never flash when
// filters change, and a slow response cannot overwrite the latest selection.
function useMapData(path, revision) {
  const key = JSON.stringify([path, revision]);
  const [state, setState] = useState({});
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    setState({ key, loading: true });
    getJson(path, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted)
          setState({ key, result, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ key, error, loading: false });
      });
    return () => controller.abort();
  }, [path, key]);
  if (!path) return { loading: false };
  return state.key === key ? state : { loading: true };
}

const number = (value) => Number(value).toLocaleString("vi-VN");
const states = {
  "": "Tất cả tình trạng",
  DANG_O: "Có người ở",
  TRONG: "Trống",
};

export default function BuildingMap() {
  const [params, setParams] = useSearchParams();
  const [revision, setRevision] = useState(0);
  const summary = useMapData("/can_ho/so_do", revision);
  const data = summary.result?.data;
  const block = params.has("khoi")
    ? data?.khoi.find((item) => item.khoi === params.get("khoi"))
    : data?.khoi[0];
  const floor = params.has("tang")
    ? block?.tang.find((item) => String(item.tang) === params.get("tang"))
    : block?.tang[0];
  const filters = new URLSearchParams({
    khoi: block?.khoi || "",
    tang: String(floor?.tang ?? ""),
    trang_thai: params.get("trang_thai") || "",
    q: params.get("q") || "",
    page: params.get("page") || "1",
  });
  const apartments = useMapData(floor ? `/can_ho?${filters}` : null, revision);
  function choose(next) {
    const changed = new URLSearchParams(params);
    changed.delete("page");
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === "") changed.delete(key);
      else changed.set(key, String(value));
    }
    setParams(changed);
  }
  return (
    <div className="building-map">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CẤU TRÚC TÒA NHÀ</p>
          <h1>Sơ đồ tòa nhà</h1>
        </div>
        <div className="actions">
          <Link className="button" to="/quan-tri/can-ho">
            Quản lý căn hộ
          </Link>
          <button
            onClick={() => setRevision((value) => value + 1)}
            disabled={summary.loading}
          >
            Cập nhật sơ đồ
          </button>
        </div>
      </div>
      <p>
        Sơ đồ phân cấp khối → tầng → căn hộ, được cập nhật từ danh sách căn hộ
        và các đợt cư trú đang mở.
      </p>
      {summary.loading && <Loading />}
      <ErrorBox error={summary.error} />
      {data && (
        <>
          <dl className="building-map-stats" aria-label="Tổng hợp tòa nhà">
            {[
              ["Khối", data.tong.so_khoi],
              ["Tầng trong các khối", data.tong.so_tang],
              ["Căn hộ", data.tong.so_can_ho],
              ["Có người ở", data.tong.co_nguoi_o],
              ["Trống", data.tong.trong],
              ["Cư dân đang ở", data.tong.so_cu_dan],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{number(value)}</dd>
              </div>
            ))}
          </dl>
          <p className="muted">
            “Trống” nghĩa là chưa có cư dân đang ở trong hệ thống; không thể
            hiện tình trạng mua bán, cho thuê hoặc miễn phí dịch vụ. Chỉ hiển
            thị khối và tầng đã có căn hộ.
          </p>
          {!data.khoi.length ? (
            <section className="card">
              <h2>Chưa có căn hộ để lập sơ đồ</h2>
              <Link to="/quan-tri/can-ho">Thêm căn hộ đầu tiên</Link>
            </section>
          ) : (
            <>
              <nav className="building-map-blocks" aria-label="Chọn khối">
                {data.khoi.map((item) => (
                  <button
                    key={item.khoi}
                    type="button"
                    aria-pressed={block?.khoi === item.khoi}
                    onClick={() => choose({ khoi: item.khoi, tang: null })}
                  >
                    <strong>Khối {item.khoi}</strong>
                    <span>
                      {number(item.so_can_ho)} căn · {number(item.trong)} trống
                    </span>
                  </button>
                ))}
              </nav>
              {!block ? (
                <div className="card" role="status">
                  Khối trong liên kết không còn trên sơ đồ. Hãy chọn khối khác.
                </div>
              ) : (
                <div className="building-map-layout">
                  <section
                    className="card building-map-floors"
                    aria-label={`Các tầng khối ${block.khoi}`}
                  >
                    <h2>Khối {block.khoi}</h2>
                    <p>
                      {number(block.tang.length)} tầng ·{" "}
                      {number(block.so_cu_dan)} cư dân đang ở
                    </p>
                    <nav aria-label="Chọn tầng">
                      {block.tang.map((item) => (
                        <button
                          key={item.tang}
                          type="button"
                          aria-pressed={floor?.tang === item.tang}
                          onClick={() =>
                            choose({ khoi: block.khoi, tang: item.tang })
                          }
                        >
                          <strong>Tầng {item.tang}</strong>
                          <span>
                            {number(item.so_can_ho)} căn · {number(item.trong)}{" "}
                            trống
                          </span>
                        </button>
                      ))}
                    </nav>
                  </section>
                  <section
                    className="card building-map-rooms"
                    aria-label="Căn hộ trên sơ đồ"
                  >
                    {!floor ? (
                      <p role="status">
                        Tầng trong liên kết không còn thuộc khối này. Hãy chọn
                        tầng khác.
                      </p>
                    ) : (
                      <>
                        <h2>
                          Khối {block.khoi} · Tầng {floor.tang}
                        </h2>
                        <p>
                          {number(floor.so_can_ho)} căn ·{" "}
                          {number(floor.co_nguoi_o)} có người ở ·{" "}
                          {number(floor.trong)} trống
                        </p>
                        <form
                          className="filters"
                          key={`${block.khoi}:${floor.tang}:${params.get("q") || ""}:${params.get("trang_thai") || ""}`}
                          onSubmit={(event) => {
                            event.preventDefault();
                            const form = new FormData(event.currentTarget);
                            choose({
                              khoi: block.khoi,
                              tang: floor.tang,
                              q: String(form.get("q")).trim(),
                              trang_thai: form.get("trang_thai"),
                            });
                          }}
                        >
                          <Field
                            label="Tìm căn hộ trong tầng"
                            name="q"
                            defaultValue={params.get("q") || ""}
                            maxLength={100}
                          />
                          <Field label="Tình trạng cư trú">
                            <select
                              name="trang_thai"
                              defaultValue={params.get("trang_thai") || ""}
                            >
                              {Object.entries(states).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <button>Lọc căn hộ</button>
                          <button
                            type="button"
                            onClick={() =>
                              choose({ q: null, trang_thai: null })
                            }
                          >
                            Xóa bộ lọc
                          </button>
                        </form>
                        {apartments.loading && <Loading />}
                        <ErrorBox error={apartments.error} />
                        {apartments.result && (
                          <>
                            <p role="status">
                              {number(apartments.result.total)} căn phù hợp ·
                              Trang {apartments.result.page}
                            </p>
                            <div className="building-map-tiles">
                              {apartments.result.data.map((item) => (
                                <article
                                  key={item.ma_can_ho}
                                  className={`building-map-tile ${item.so_cu_dan > 0 ? "occupied" : "vacant"}`}
                                >
                                  <h3>Căn {item.so_can_ho}</h3>
                                  <p className="building-map-state">
                                    {item.so_cu_dan > 0
                                      ? `Có người ở · ${number(item.so_cu_dan)} cư dân`
                                      : "Trống"}
                                  </p>
                                  <p>
                                    {number(item.dien_tich_m2)} m² ·{" "}
                                    {item.tinh_phi_dich_vu
                                      ? "Tính phí dịch vụ"
                                      : "Không tính phí dịch vụ"}
                                  </p>
                                  <Link
                                    to={`/quan-tri/can-ho?ma_can_ho=${item.ma_can_ho}`}
                                  >
                                    Xem / sửa căn {item.so_can_ho}
                                  </Link>
                                  <Link
                                    to={`/quan-tri/cu-dan?ma_can_ho=${item.ma_can_ho}&so=${encodeURIComponent(item.so_can_ho)}`}
                                  >
                                    Cư dân căn {item.so_can_ho}
                                  </Link>
                                </article>
                              ))}
                            </div>
                            {!apartments.result.total && (
                              <p>
                                Không có căn hộ phù hợp. Thử xóa bộ lọc hoặc
                                chọn tầng khác.
                              </p>
                            )}
                            <div className="actions building-map-pager">
                              <button
                                disabled={apartments.result.page <= 1}
                                onClick={() =>
                                  choose({ page: apartments.result.page - 1 })
                                }
                              >
                                Trang trước
                              </button>
                              <button
                                disabled={
                                  apartments.result.page * 20 >=
                                  apartments.result.total
                                }
                                onClick={() =>
                                  choose({ page: apartments.result.page + 1 })
                                }
                              >
                                Trang sau
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </section>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
