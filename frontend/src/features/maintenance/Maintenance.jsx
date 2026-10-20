import DataTools from "../../shared/DataTools.jsx";
import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { Field, ErrorBox, Loading, Options } from "../../shared/ui.jsx";
import { newRequestKey } from "../../shared/request-key.js";
import { useAuth } from "../auth/Auth.jsx";
const types = {
  THANG_MAY: "Thang máy",
  MAY_BOM: "Máy bơm",
  PCCC: "PCCC",
  DIEN: "Điện",
  NUOC: "Nước",
  CAMERA: "Camera",
  KHAC: "Khác",
};
const equipmentStates = {
  DANG_SU_DUNG: "Đang sử dụng",
  TAM_DUNG: "Tạm dừng",
  NGUNG_SU_DUNG: "Ngừng sử dụng",
};
const states = {
  MOI: "Chưa phân công",
  DA_PHAN_CONG: "Đã phân công",
  DANG_THUC_HIEN: "Đang thực hiện",
  CHO_NGHIEM_THU: "Chờ nghiệm thu",
  HOAN_THANH: "Hoàn thành",
  HUY: "Đã hủy",
};
const levels = { THUONG: "Bình thường", CAO: "Cao", KHAN_CAP: "Khẩn cấp" };
const schedules = {
  QUA_HAN: "Quá hạn",
  SAP_DEN_HAN: "Sắp / đến hạn",
  CHUA_DEN_HAN: "Chưa đến hạn",
  CHUA_CAU_HINH: "Chưa có lịch",
  NGUNG_THEO_DOI: "Ngừng theo dõi",
};
const events = {
  TAO_THIET_BI: "Tạo thiết bị",
  SUA_THIET_BI: "Sửa thiết bị",
  LAP_PHIEU: "Lập phiếu",
  PHAN_CONG: "Phân công",
  DOI_LICH: "Đổi lịch",
  BAT_DAU: "Bắt đầu",
  BAO_CAO: "Báo cáo kết quả",
  TRA_LAI: "Trả lại thực hiện",
  NGHIEM_THU: "Nghiệm thu",
  HUY: "Hủy phiếu",
};
const day = (x) => (x ? x.split("-").reverse().join("/") : "—");
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const time = (x) =>
  x
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(x.replace(" ", "T") + "Z"))
    : "—";
const code = (id) => `BT${String(id).padStart(6, "0")}`;
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
function useData(path) {
  const [state, setState] = useState({ loading: true }),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ path, revision, loading: true });
    getJson(path, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted)
          setState({ path, revision, result, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ path, revision, error, loading: false });
      });
    return () => controller.abort();
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
      setNotice(
        r.data.replay
          ? "Phiếu đã được tạo trước đó. Đã mở lại đúng phiếu."
          : "Đã lưu thay đổi bảo trì.",
      );
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
function History({ items, title = "Lịch sử thực hiện" }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <ol className="maintenance-history">
        {items.map((h) => (
          <li key={h.ma_lich_su}>
            <div>
              <strong>{events[h.su_kien] || h.su_kien}</strong>
              <time>
                {time(h.ngay_tao)} · {h.ho_va_ten}
              </time>
            </div>
            <p>{h.ghi_chu}</p>
          </li>
        ))}
      </ol>
    </section>
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
function TechnicianSelect({ required = false }) {
  const [q, setQ] = useState(""),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState(""),
    [label, setLabel] = useState(""),
    resource = useData(
      `/bao_tri/ky_thuat_vien?q=${encodeURIComponent(q)}&page=${page}`,
    ),
    matches = resource.result?.data || [];
  return (
    <div className="maintenance-staff">
      <Field label="Tìm kỹ thuật viên theo tên">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </Field>
      <ErrorBox error={resource.error} />
      <Field label="Kỹ thuật viên nhận phiếu">
        <select
          name="ma_ky_thuat_vien"
          required={required}
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            setLabel(e.target.selectedOptions[0].text);
          }}
        >
          <option value="">
            {required ? "Chọn kỹ thuật viên" : "Chưa phân công"}
          </option>
          {selected &&
            !matches.some((u) => String(u.ma_nguoi_dung) === selected) && (
              <option value={selected}>{label}</option>
            )}
          {matches.map((u) => (
            <option key={u.ma_nguoi_dung} value={u.ma_nguoi_dung}>
              {u.ho_va_ten}
              {u.chuyen_mon ? ` · ${u.chuyen_mon}` : ""}
            </option>
          ))}
        </select>
      </Field>
      <div className="actions">
        <button
          type="button"
          disabled={resource.loading || page === 1}
          onClick={() => setPage((n) => n - 1)}
        >
          KTV trang trước
        </button>
        <span>Trang {page}</span>
        <button
          type="button"
          disabled={
            resource.loading || page * 20 >= (resource.result?.total || 0)
          }
          onClick={() => setPage((n) => n + 1)}
        >
          KTV trang sau
        </button>
      </div>
    </div>
  );
}
function EquipmentForm({ initial, action, onSave }) {
  return (
    <form
      key={initial?.phien_ban ?? "new"}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(values(e));
      }}
    >
      <fieldset disabled={action.pending}>
        {!initial ? (
          <Field
            label="Mã tài sản"
            name="ma_tai_san"
            required
            minLength={2}
            maxLength={30}
            pattern="[A-Za-z0-9][A-Za-z0-9_-]{1,29}"
            placeholder="Ví dụ TM-A-01"
          />
        ) : (
          <p>
            Mã tài sản: <strong>{initial.ma_tai_san}</strong>
          </p>
        )}
        <div className="form-grid">
          <Field
            label="Tên thiết bị"
            name="ten_thiet_bi"
            required
            minLength={2}
            maxLength={150}
            defaultValue={initial?.ten_thiet_bi || ""}
          />
          <Field label="Loại thiết bị">
            <select name="loai" defaultValue={initial?.loai || "THANG_MAY"}>
              <Options values={types} />
            </select>
          </Field>
          <Field
            label="Vị trí lắp đặt"
            name="vi_tri"
            required
            minLength={2}
            maxLength={160}
            defaultValue={initial?.vi_tri || ""}
          />
          <Field
            label="Số serial"
            name="so_serial"
            maxLength={100}
            defaultValue={initial?.so_serial || ""}
          />
          <Field
            label="Ngày lắp đặt"
            name="ngay_lap_dat"
            type="date"
            max={today()}
            defaultValue={initial?.ngay_lap_dat || ""}
          />
          <Field label="Trạng thái thiết bị">
            <select
              name="trang_thai"
              defaultValue={initial?.trang_thai || "DANG_SU_DUNG"}
            >
              <Options values={equipmentStates} />
            </select>
          </Field>
        </div>
        <Field label="Ghi chú thiết bị">
          <textarea
            name="ghi_chu"
            rows={3}
            maxLength={1000}
            defaultValue={initial?.ghi_chu || ""}
          />
        </Field>
        <h3>Lịch bảo trì định kỳ</h3>
        <p className="muted">
          Nhập cả chu kỳ và ngày kế tiếp; bỏ trống cả hai nếu chưa lập lịch.
          Ngày kế tiếp cập nhật sau khi BQL nghiệm thu phiếu định kỳ.
        </p>
        <div className="form-grid">
          <Field
            label="Chu kỳ bảo trì (ngày)"
            name="chu_ky_ngay"
            type="number"
            min="1"
            max="3650"
            step="1"
            defaultValue={initial?.chu_ky_ngay || ""}
          />
          <Field
            label="Ngày bảo trì kế tiếp"
            name="ngay_bao_tri_tiep_theo"
            type="date"
            defaultValue={initial?.ngay_bao_tri_tiep_theo || ""}
          />
          <Field
            label="Nhắc trước (ngày)"
            name="nhac_truoc_ngay"
            type="number"
            min="0"
            max="90"
            step="1"
            required
            defaultValue={initial?.nhac_truoc_ngay ?? 7}
          />
        </div>
        <button className="primary">
          {initial ? "Lưu thiết bị" : "Thêm thiết bị"}
        </button>
      </fieldset>
    </form>
  );
}
function NewJob({ equipment, type, action, onSave }) {
  const [key] = useState(newRequestKey);
  return (
    <section className="card narrow">
      <h2>{type === "DINH_KY" ? "Lập phiếu định kỳ" : "Lập phiếu đột xuất"}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...values(e),
            loai: type,
            khoa_yeu_cau: key,
            phien_ban_thiet_bi: equipment.phien_ban,
          });
        }}
      >
        <fieldset disabled={action.pending}>
          {type === "DINH_KY" ? (
            <p>
              Hạn thực hiện:{" "}
              <strong>{day(equipment.ngay_bao_tri_tiep_theo)}</strong> · Chu kỳ{" "}
              {equipment.chu_ky_ngay} ngày.
            </p>
          ) : (
            <>
              <Field
                label="Tiêu đề công việc"
                name="tieu_de"
                required
                minLength={3}
                maxLength={180}
              />
              <Field label="Nội dung cần thực hiện">
                <textarea
                  name="noi_dung"
                  required
                  minLength={3}
                  maxLength={2000}
                  rows={4}
                />
              </Field>
              <Field
                label="Hạn thực hiện"
                name="ngay_den_han"
                type="date"
                required
                defaultValue={today()}
              />
            </>
          )}
          <Field label="Ưu tiên">
            <select name="do_uu_tien" defaultValue="THUONG">
              <Options values={levels} />
            </select>
          </Field>
          <TechnicianSelect />
          <button className="primary">Tạo phiếu bảo trì</button>
        </fieldset>
      </form>
    </section>
  );
}
export function EquipmentList() {
  const [params, setParams] = useSearchParams(),
    resource = useData(`/thiet_bi?${params}`),
    [adding, setAdding] = useState(false),
    action = useAction(),
    navigate = useNavigate(),
    s = resource.result?.summary;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Vận hành thiết bị</p>
          <h1>Thiết bị và lịch bảo trì</h1>
        </div>
        <div className="actions">
          <Link className="button" to="/quan-tri/bao-tri">
            Danh sách phiếu bảo trì
          </Link>
          <button className="primary" onClick={() => setAdding(!adding)}>
            {adding ? "Đóng biểu mẫu" : "Thêm thiết bị"}
          </button>
        </div>
      </div>
      <Feedback action={action} />
      <DataTools
        kind="thiet_bi"
        params={params}
        importable
        disabled={resource.loading}
      />
      {adding && (
        <section className="card">
          <h2>Đăng ký thiết bị</h2>
          <EquipmentForm
            action={action}
            onSave={(body) =>
              action.run("/thiet_bi", "POST", body, (e) =>
                navigate(`/quan-tri/thiet-bi/${e.ma_thiet_bi}`),
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
          label="Tìm mã, tên hoặc vị trí thiết bị"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field label="Lọc loại thiết bị">
          <select name="loai" defaultValue={params.get("loai") || ""}>
            <Options values={types} empty="Tất cả loại" />
          </select>
        </Field>
        <Field label="Lọc trạng thái thiết bị">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options values={equipmentStates} empty="Tất cả trạng thái" />
          </select>
        </Field>
        <Field label="Lọc lịch bảo trì">
          <select name="lich" defaultValue={params.get("lich") || ""}>
            <option value="">Tất cả lịch</option>
            <option value="QUA_HAN">Quá hạn</option>
            <option value="SAP_DEN_HAN">Sắp / đến hạn</option>
            <option value="CHUA_CAU_HINH">Chưa có lịch</option>
          </select>
        </Field>
        <button>Lọc thiết bị</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      {s && (
        <>
          <p className="muted">
            Trong bộ lọc · Ngày {day(resource.result.ngay_hien_tai)} tại Việt
            Nam
          </p>
          <div className="maintenance-stats">
            <div className="card">
              <span>Thiết bị</span>
              <strong>{s.total}</strong>
            </div>
            <div className="card">
              <span>Sắp / đến hạn</span>
              <strong>{s.sap_den_han}</strong>
            </div>
            <div className="card">
              <span>Quá hạn</span>
              <strong className="maintenance-overdue">{s.qua_han}</strong>
            </div>
          </div>
        </>
      )}
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã / thiết bị</th>
                <th>Vị trí</th>
                <th>Trạng thái</th>
                <th>Bảo trì kế tiếp</th>
                <th>Lịch</th>
                <th>Phiếu định kỳ</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((e) => (
                <tr key={e.ma_thiet_bi}>
                  <td>
                    <Link to={`/quan-tri/thiet-bi/${e.ma_thiet_bi}`}>
                      {e.ma_tai_san}
                    </Link>
                    <small className="maintenance-subtitle">
                      {e.ten_thiet_bi} · {types[e.loai]}
                    </small>
                  </td>
                  <td>{e.vi_tri}</td>
                  <td>{equipmentStates[e.trang_thai]}</td>
                  <td>
                    {day(e.ngay_bao_tri_tiep_theo)}
                    {e.chu_ky_ngay && (
                      <small className="maintenance-subtitle">
                        Mỗi {e.chu_ky_ngay} ngày
                      </small>
                    )}
                  </td>
                  <td>
                    <span
                      className={`maintenance-tag due-${e.tinh_trang_lich}`}
                    >
                      {schedules[e.tinh_trang_lich]}
                    </span>
                  </td>
                  <td>
                    {e.phieu_dinh_ky_dang_mo ? (
                      <Link to={`/quan-tri/bao-tri/${e.phieu_dinh_ky_dang_mo}`}>
                        {code(e.phieu_dinh_ky_dang_mo)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có thiết bị phù hợp.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
export function EquipmentDetail() {
  const { id } = useParams(),
    resource = useData(`/thiet_bi/${id}`),
    e = resource.result?.data,
    [editing, setEditing] = useState(false),
    [creating, setCreating] = useState(""),
    action = useAction(resource.reload),
    navigate = useNavigate();
  return (
    <>
      <Link to="/quan-tri/thiet-bi">← Danh sách thiết bị</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Feedback action={action} />
      {e && (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">{e.ma_tai_san}</p>
              <h1>{e.ten_thiet_bi}</h1>
            </div>
            <button
              disabled={action.pending}
              onClick={() => {
                setEditing(!editing);
                setCreating("");
              }}
            >
              Sửa thiết bị / lịch
            </button>
          </div>
          <section className="card">
            <dl className="maintenance-info">
              <div>
                <dt>Loại / trạng thái</dt>
                <dd>
                  {types[e.loai]} · {equipmentStates[e.trang_thai]}
                </dd>
              </div>
              <div>
                <dt>Vị trí</dt>
                <dd>{e.vi_tri}</dd>
              </div>
              <div>
                <dt>Serial / ngày lắp</dt>
                <dd>
                  {e.so_serial || "—"} · {day(e.ngay_lap_dat)}
                </dd>
              </div>
              <div>
                <dt>Ngày bảo trì kế tiếp</dt>
                <dd>
                  {day(e.ngay_bao_tri_tiep_theo)} ·{" "}
                  <span className={`maintenance-tag due-${e.tinh_trang_lich}`}>
                    {schedules[e.tinh_trang_lich]}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Chu kỳ / nhắc trước</dt>
                <dd>
                  {e.chu_ky_ngay
                    ? `${e.chu_ky_ngay} ngày · nhắc trước ${e.nhac_truoc_ngay} ngày`
                    : "Chưa có lịch định kỳ"}
                </dd>
              </div>
            </dl>
            {e.ghi_chu && <p className="maintenance-text">{e.ghi_chu}</p>}
            <div className="actions">
              <Link
                className="button"
                to={`/quan-tri/bao-tri?ma_thiet_bi=${id}`}
              >
                Xem phiếu và lịch sử bảo trì
              </Link>
              {e.trang_thai !== "NGUNG_SU_DUNG" && (
                <>
                  <button
                    disabled={
                      !e.chu_ky_ngay ||
                      !!e.phieu_dinh_ky_dang_mo ||
                      action.pending
                    }
                    onClick={() => {
                      setCreating("DINH_KY");
                      setEditing(false);
                    }}
                  >
                    Lập phiếu định kỳ
                  </button>
                  <button
                    disabled={action.pending}
                    onClick={() => {
                      setCreating("DOT_XUAT");
                      setEditing(false);
                    }}
                  >
                    Lập phiếu đột xuất
                  </button>
                </>
              )}
              {e.phieu_dinh_ky_dang_mo && (
                <Link to={`/quan-tri/bao-tri/${e.phieu_dinh_ky_dang_mo}`}>
                  Phiếu định kỳ đang mở: {code(e.phieu_dinh_ky_dang_mo)}
                </Link>
              )}
            </div>
          </section>
          {editing && (
            <section className="card">
              <h2>Sửa thông tin và lịch</h2>
              <EquipmentForm
                initial={e}
                action={action}
                onSave={(body) =>
                  action.run(
                    `/thiet_bi/${id}`,
                    "PUT",
                    { ...body, phien_ban: e.phien_ban },
                    () => setEditing(false),
                  )
                }
              />
            </section>
          )}
          {creating && (
            <NewJob
              key={creating}
              equipment={e}
              type={creating}
              action={action}
              onSave={(body) =>
                action.run(`/thiet_bi/${id}/phieu_bao_tri`, "POST", body, (j) =>
                  navigate(`/quan-tri/bao-tri/${j.ma_phieu_bao_tri}`),
                )
              }
            />
          )}
          <History items={e.history} title="Lịch sử thông tin thiết bị" />
        </>
      )}
    </>
  );
}
export function MaintenanceList() {
  const { user } = useAuth(),
    isAdmin = user.vai_tro === "QUAN_TRI_VIEN",
    base = isAdmin ? "/quan-tri/bao-tri" : "/ky-thuat/bao-tri",
    [params, setParams] = useSearchParams(),
    resource = useData(`/bao_tri?${params}`);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Theo dõi thực hiện</p>
          <h1>{isAdmin ? "Phiếu bảo trì thiết bị" : "Bảo trì được giao"}</h1>
        </div>
        {isAdmin && (
          <Link className="button" to="/quan-tri/thiet-bi">
            Thiết bị và lịch
          </Link>
        )}
      </div>
      {isAdmin && (
        <DataTools kind="bao_tri" params={params} disabled={resource.loading} />
      )}
      <p className="muted">
        {isAdmin
          ? "Lập phiếu từ trang thiết bị. Phiếu định kỳ cập nhật lịch tiếp theo khi BQL nghiệm thu đạt."
          : "Chỉ hiển thị phiếu hiện đang được giao cho bạn. Báo cáo kết quả để BQL nghiệm thu."}
      </p>
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams({
            ...values(e),
            ...(params.get("ma_thiet_bi")
              ? { ma_thiet_bi: params.get("ma_thiet_bi") }
              : {}),
          });
        }}
      >
        <Field
          label="Tìm phiếu, mã hoặc tên thiết bị"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field label="Trạng thái phiếu">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options values={states} empty="Tất cả trạng thái" />
          </select>
        </Field>
        <Field label="Loại phiếu">
          <select name="loai" defaultValue={params.get("loai") || ""}>
            <option value="">Tất cả loại</option>
            <option value="DINH_KY">Định kỳ</option>
            <option value="DOT_XUAT">Đột xuất</option>
          </select>
        </Field>
        <Field label="Hạn thực hiện">
          <select name="qua_han" defaultValue={params.get("qua_han") || "0"}>
            <option value="0">Tất cả hạn</option>
            <option value="1">Chỉ phiếu quá hạn</option>
          </select>
        </Field>
        <button>Lọc phiếu</button>
      </form>
      {params.get("ma_thiet_bi") && (
        <p className="note">
          Đang lọc riêng một thiết bị. <Link to={base}>Xem mọi thiết bị</Link>
        </p>
      )}
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Phiếu</th>
                <th>Thiết bị</th>
                <th>Hạn / ưu tiên</th>
                <th>Trạng thái</th>
                <th>Kỹ thuật viên</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((j) => (
                <tr key={j.ma_phieu_bao_tri}>
                  <td>
                    <Link to={`${base}/${j.ma_phieu_bao_tri}`}>
                      {code(j.ma_phieu_bao_tri)}
                    </Link>
                    <small className="maintenance-subtitle">{j.tieu_de}</small>
                  </td>
                  <td>
                    {j.ma_tai_san}
                    <small className="maintenance-subtitle">
                      {j.ten_thiet_bi_luc_lap}
                    </small>
                  </td>
                  <td>
                    {day(j.ngay_den_han)} · {levels[j.do_uu_tien]}
                    {j.qua_han === 1 && (
                      <span className="maintenance-tag due-QUA_HAN">
                        Quá hạn
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`maintenance-tag work-${j.trang_thai}`}>
                      {states[j.trang_thai]}
                    </span>
                  </td>
                  <td>{j.ky_thuat_vien || "Chưa phân công"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có phiếu phù hợp.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
function ActionForm({ title, button, action, onSubmit, children }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(values(e));
        }}
      >
        <fieldset disabled={action.pending}>
          {children}
          <button className="primary">{button}</button>
        </fieldset>
      </form>
    </section>
  );
}
export function MaintenanceDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    isAdmin = user.vai_tro === "QUAN_TRI_VIEN",
    base = isAdmin ? "/quan-tri/bao-tri" : "/ky-thuat/bao-tri",
    resource = useData(`/bao_tri/${id}`),
    j = resource.result?.data,
    action = useAction(resource.reload);
  const run = (name, body = {}) =>
    action.run(`/bao_tri/${id}/${name}`, "POST", {
      ...body,
      phien_ban: j.phien_ban,
    });
  const open = j && !["HOAN_THANH", "HUY"].includes(j.trang_thai);
  return (
    <>
      <Link to={base}>← Danh sách phiếu bảo trì</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Feedback action={action} />
      {j && (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {code(j.ma_phieu_bao_tri)} ·{" "}
                {j.loai === "DINH_KY" ? "Định kỳ" : "Đột xuất"}
              </p>
              <h1>{j.tieu_de}</h1>
            </div>
            <span className={`maintenance-tag work-${j.trang_thai}`}>
              {states[j.trang_thai]}
            </span>
          </div>
          <section className="card">
            <dl className="maintenance-info">
              <div>
                <dt>Thiết bị lúc lập phiếu</dt>
                <dd>
                  {j.ma_tai_san} · {j.ten_thiet_bi_luc_lap}
                </dd>
              </div>
              <div>
                <dt>Vị trí lúc lập</dt>
                <dd>{j.vi_tri_luc_lap}</dd>
              </div>
              <div>
                <dt>Hạn thực hiện</dt>
                <dd>
                  {day(j.ngay_den_han)}
                  {j.qua_han && (
                    <span className="maintenance-tag due-QUA_HAN">Quá hạn</span>
                  )}{" "}
                  · {levels[j.do_uu_tien]}
                </dd>
              </div>
              <div>
                <dt>Kỹ thuật viên</dt>
                <dd>{j.ky_thuat_vien || "Chưa phân công"}</dd>
              </div>
              <div>
                <dt>Ngày lập / lượt thực hiện</dt>
                <dd>
                  {day(j.ngay_lap)} · Lượt {j.luot_thuc_hien}
                </dd>
              </div>
            </dl>
            <p className="maintenance-text">{j.noi_dung}</p>
            {(j.ten_hien_tai !== j.ten_thiet_bi_luc_lap ||
              j.vi_tri_hien_tai !== j.vi_tri_luc_lap) && (
              <p className="muted">
                Hiện tại: {j.ten_hien_tai} · {j.vi_tri_hien_tai}
              </p>
            )}
            {isAdmin && (
              <Link to={`/quan-tri/thiet-bi/${j.ma_thiet_bi}`}>
                Mở hồ sơ thiết bị
              </Link>
            )}
          </section>
          {j.ket_qua && (
            <section className="card">
              <h2>Kết quả thực hiện</h2>
              <p>
                Ngày thực hiện: {day(j.ngay_thuc_hien)} · Lượt{" "}
                {j.luot_thuc_hien}
              </p>
              <p className="maintenance-text">{j.ket_qua}</p>
              {j.nhan_xet_nghiem_thu && (
                <p className="note">
                  Nhận xét nghiệm thu: {j.nhan_xet_nghiem_thu}
                </p>
              )}
            </section>
          )}
          {!isAdmin && j.trang_thai === "DA_PHAN_CONG" && (
            <section className="card">
              <h2>Thực hiện công việc</h2>
              <button
                className="primary"
                disabled={action.pending}
                onClick={() => run("bat_dau")}
              >
                Bắt đầu bảo trì
              </button>
            </section>
          )}
          {!isAdmin && j.trang_thai === "DANG_THUC_HIEN" && (
            <ActionForm
              title="Gửi kết quả để nghiệm thu"
              button="Gửi báo cáo bảo trì"
              action={action}
              onSubmit={(body) => run("bao_cao", body)}
            >
              <Field
                label="Ngày thực hiện"
                name="ngay_thuc_hien"
                type="date"
                required
                min={j.ngay_lap}
                max={today()}
                defaultValue={today()}
              />
              <Field label="Kết quả bảo trì">
                <textarea
                  name="ket_qua"
                  required
                  minLength={10}
                  maxLength={4000}
                  rows={6}
                  placeholder="Ghi rõ việc đã làm, tình trạng sau bảo trì và vấn đề còn lại."
                />
              </Field>
            </ActionForm>
          )}
          {isAdmin &&
            ["MOI", "DA_PHAN_CONG", "DANG_THUC_HIEN"].includes(
              j.trang_thai,
            ) && (
              <ActionForm
                title={
                  j.ma_ky_thuat_vien ? "Đổi kỹ thuật viên" : "Giao công việc"
                }
                button="Lưu phân công"
                action={action}
                onSubmit={(body) => run("phan_cong", body)}
              >
                <TechnicianSelect required />
                <Field
                  label="Ghi chú / lý do đổi người"
                  name="ghi_chu"
                  required={!!j.ma_ky_thuat_vien}
                  minLength={j.ma_ky_thuat_vien ? 3 : 0}
                  maxLength={500}
                />
              </ActionForm>
            )}
          {isAdmin && ["MOI", "DA_PHAN_CONG"].includes(j.trang_thai) && (
            <ActionForm
              title="Điều chỉnh lịch thực hiện"
              button="Lưu lịch mới"
              action={action}
              onSubmit={(body) => run("doi_lich", body)}
            >
              <Field
                label="Hạn thực hiện mới"
                name="ngay_den_han"
                type="date"
                required
                defaultValue={j.ngay_den_han}
              />
              <Field
                label="Lý do đổi lịch"
                name="ly_do"
                required
                minLength={3}
                maxLength={500}
              />
            </ActionForm>
          )}
          {isAdmin && j.trang_thai === "CHO_NGHIEM_THU" && (
            <div className="maintenance-action-grid">
              <ActionForm
                title="Nghiệm thu kết quả"
                button="Nghiệm thu đạt"
                action={action}
                onSubmit={(body) => run("nghiem_thu", body)}
              >
                <Field label="Nhận xét nghiệm thu">
                  <textarea
                    name="nhan_xet"
                    required
                    minLength={3}
                    maxLength={1000}
                    rows={4}
                  />
                </Field>
                {j.loai === "DINH_KY" && (
                  <p className="muted">
                    Ngày bảo trì kế tiếp = ngày thực hiện đã nghiệm thu +{" "}
                    {j.chu_ky_ngay} ngày. Hệ thống không tự lập phiếu kỳ sau.
                  </p>
                )}
              </ActionForm>
              <ActionForm
                title="Yêu cầu thực hiện lại"
                button="Trả lại kỹ thuật viên"
                action={action}
                onSubmit={(body) => run("tra_lai", body)}
              >
                <Field label="Lý do chưa đạt">
                  <textarea
                    name="ly_do"
                    required
                    minLength={3}
                    maxLength={1000}
                    rows={4}
                  />
                </Field>
                <p className="muted">
                  Kết quả lượt trước giữ trong lịch sử. Kỹ thuật viên cần gửi
                  báo cáo mới.
                </p>
              </ActionForm>
            </div>
          )}
          {isAdmin && open && (
            <ActionForm
              title="Hủy phiếu"
              button="Hủy phiếu bảo trì"
              action={action}
              onSubmit={(body) => run("huy", body)}
            >
              <Field
                label="Lý do hủy phiếu"
                name="ly_do"
                required
                minLength={3}
                maxLength={500}
              />
              <p className="muted">
                Hủy phiếu không cập nhật ngày bảo trì kế tiếp và không xóa lịch
                sử.
              </p>
            </ActionForm>
          )}
          {j.trang_thai === "HUY" && (
            <p className="note">Lý do hủy: {j.ly_do_huy}</p>
          )}
          <History items={j.history} />
        </>
      )}
    </>
  );
}
