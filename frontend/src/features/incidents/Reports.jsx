import React, { useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { useAuth } from "../auth/Auth.jsx";
import {
  Badge,
  categories,
  date,
  ErrorBox,
  Field,
  ImagesInput,
  Loading,
  Options,
  priorities,
  statuses,
  Timeline,
  useResource,
} from "../../shared/ui.jsx";
export const reportBase = (user) =>
  user.vai_tro === "QUAN_TRI_VIEN"
    ? "/quan-tri/phan-anh"
    : user.vai_tro === "KY_THUAT_VIEN"
      ? "/ky-thuat/cong-viec"
      : "/cu-dan/phan-anh";
function ReportTable({ items, base, search = "" }) {
  if (!items.length)
    return (
      <div className="empty">
        <h2>Chưa có phản ánh</h2>
        <p>Không có phản ánh trong phạm vi hoặc bộ lọc hiện tại.</p>
      </div>
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Phản ánh</th>
            <th>Trạng thái</th>
            <th>Phụ trách</th>
            <th>Ngày gửi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.ma_phan_anh}>
              <td>
                <Link to={`${base}/${r.ma_phan_anh}`} state={{ search }}>
                  #{r.ma_phan_anh} · {r.tieu_de}
                </Link>
                <small>
                  {r.ten_vi_tri} · {categories[r.loai_su_co]} ·{" "}
                  {priorities[r.do_uu_tien]}
                </small>
              </td>
              <td>
                <Badge status={r.trang_thai} />
              </td>
              <td>{r.ten_ky_thuat_vien || "Chưa phân công"}</td>
              <td>{date(r.ngay_tao)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ReportList() {
  const { user } = useAuth(),
    [params, setParams] = useSearchParams();
  const resource = useResource(`/phan_anh?${params}`);
  const base = reportBase(user),
    title =
      user.vai_tro === "KY_THUAT_VIEN"
        ? "Công việc của tôi"
        : user.vai_tro === "CU_DAN"
          ? "Phản ánh của tôi"
          : "Bàn làm việc phản ánh";
  function filter(k, v) {
    const next = new URLSearchParams(params);
    next.set(k, v);
    next.delete("page");
    setParams(next, { replace: true });
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TIẾP NHẬN & XỬ LÝ</p>
          <h1>{title}</h1>
        </div>
        {user.vai_tro === "CU_DAN" && (
          <Link className="button primary" to="/quet-qr">
            Gửi phản ánh qua QR
          </Link>
        )}
      </div>
      <section className="card">
        {params.get("ma_thiet_bi") && (
          <p>
            Đang lọc theo thiết bị được ghi nhận lúc gửi phản ánh.{" "}
            <button
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("ma_thiet_bi");
                next.delete("page");
                setParams(next);
              }}
            >
              Bỏ lọc thiết bị
            </button>
          </p>
        )}
        <div className="filters">
          <Field label="Tìm tiêu đề hoặc vị trí">
            <input
              type="search"
              value={params.get("q") || ""}
              onChange={(e) => filter("q", e.target.value)}
              placeholder="Tìm phản ánh…"
            />
          </Field>
          <Field label="Trạng thái">
            <select
              value={params.get("trang_thai") || ""}
              onChange={(e) => filter("trang_thai", e.target.value)}
            >
              <Options
                values={{ DANG_MO: "Đang mở (chưa đóng)", ...statuses }}
                empty="Tất cả trạng thái"
              />
            </select>
          </Field>
          <Field label="Loại sự cố">
            <select
              value={params.get("loai_su_co") || ""}
              onChange={(e) => filter("loai_su_co", e.target.value)}
            >
              <Options values={categories} empty="Tất cả loại" />
            </select>
          </Field>
        </div>
        {resource.loading && <Loading />}
        <ErrorBox error={resource.error} />
        {resource.result && (
          <>
            <ReportTable
              items={resource.result.data}
              base={base}
              search={params.toString()}
            />
            <div className="pagination">
              <button
                disabled={resource.result.meta.page <= 1}
                onClick={() =>
                  setParams((p) => {
                    const n = new URLSearchParams(p);
                    n.set("page", resource.result.meta.page - 1);
                    return n;
                  })
                }
              >
                Trước
              </button>
              <span>
                Trang {resource.result.meta.page} · {resource.result.meta.total}{" "}
                phản ánh
              </span>
              <button
                disabled={
                  resource.result.meta.page * 20 >= resource.result.meta.total
                }
                onClick={() =>
                  setParams((p) => {
                    const n = new URLSearchParams(p);
                    n.set("page", resource.result.meta.page + 1);
                    return n;
                  })
                }
              >
                Sau
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
export function ReportDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    location = useLocation(),
    resource = useResource(`/phan_anh/${id}`);
  const [error, setError] = useState(),
    [pending, setPending] = useState(false);
  const r = resource.result?.data;
  async function mutate(path, body) {
    setPending(true);
    setError(null);
    try {
      await getJson(`/phan_anh/${id}/${path}`, { method: "PATCH", body });
      resource.reload();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <Link
        className="back"
        to={`${reportBase(user)}${location.state?.search ? "?" + location.state.search : ""}`}
      >
        ← Về danh sách
      </Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      {r && (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">PHẢN ÁNH #{r.ma_phan_anh}</p>
              <h1>{r.tieu_de}</h1>
            </div>
            <Badge status={r.trang_thai} />
          </div>
          <div className="detail-grid">
            <div>
              <section className="card">
                <h2>{r.ten_vi_tri}</h2>
                {r.ma_thiet_bi && (
                  <div className="note">
                    <p>
                      Thiết bị lúc gửi: {r.ma_tai_san_luc_gui} ·{" "}
                      {r.ten_thiet_bi_luc_gui}
                    </p>
                    <p>{r.vi_tri_thiet_bi_luc_gui}</p>
                    {user.vai_tro === "QUAN_TRI_VIEN" && (
                      <Link to={`/quan-tri/thiet-bi/${r.ma_thiet_bi}`}>
                        Mở hồ sơ thiết bị
                      </Link>
                    )}
                  </div>
                )}
                <div className="tags">
                  <span>{categories[r.loai_su_co]}</span>
                  <span>Ưu tiên: {priorities[r.do_uu_tien]}</span>
                </div>
                <p className="pre-wrap">{r.noi_dung}</p>
                <dl className="metadata">
                  <dt>Người gửi</dt>
                  <dd>{r.ten_nguoi_gui}</dd>
                  <dt>Số điện thoại</dt>
                  <dd>{r.so_dien_thoai_nguoi_gui}</dd>
                  <dt>Căn hộ khai báo</dt>
                  <dd>{r.can_ho_khai_bao || "Không cung cấp"}</dd>
                  <dt>Ngày tiếp nhận</dt>
                  <dd>{date(r.ngay_tao)}</dd>
                  <dt>Kỹ thuật viên</dt>
                  <dd>{r.ten_ky_thuat_vien || "Chưa phân công"}</dd>
                </dl>
                {["PHAN_ANH", "NGHIEM_THU"].map((type) => (
                  <React.Fragment key={type}>
                    <h3>
                      {type === "PHAN_ANH"
                        ? "Ảnh hiện trường"
                        : "Ảnh nghiệm thu"}
                    </h3>
                    <div className="image-grid">
                      {r.hinh_anh
                        .filter((img) => img.loai === type)
                        .map((img) => (
                          <a
                            key={img.ma_hinh_anh_phan_anh}
                            href={`/api/phan_anh/${id}/hinh_anh/${img.ma_hinh_anh_phan_anh}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img
                              loading="lazy"
                              src={`/api/phan_anh/${id}/hinh_anh/${img.ma_hinh_anh_phan_anh}`}
                              alt={`${type === "PHAN_ANH" ? "Hiện trường" : "Nghiệm thu"} · lượt ${img.luot_xu_ly}`}
                            />
                          </a>
                        ))}
                    </div>
                    {!r.hinh_anh.some((img) => img.loai === type) && (
                      <p className="muted">Chưa có ảnh.</p>
                    )}
                  </React.Fragment>
                ))}
              </section>
              <section className="card">
                <h2>Lịch sử xử lý</h2>
                <Timeline items={r.lich_su} />
              </section>
            </div>
            <section className="card action-panel">
              <h2>Thao tác</h2>
              <ErrorBox error={error} />
              {error?.status === 409 && (
                <button
                  onClick={() => {
                    resource.reload();
                    setError(null);
                  }}
                >
                  Tải lại dữ liệu mới nhất
                </button>
              )}
              {user.vai_tro === "QUAN_TRI_VIEN" &&
                ["MOI", "DA_PHAN_CONG", "DANG_XU_LY"].includes(
                  r.trang_thai,
                ) && (
                  <Assignment
                    key={`assign-${r.phien_ban}`}
                    report={r}
                    pending={pending}
                    onSubmit={(body) => mutate("phan_cong", body)}
                  />
                )}
              {user.vai_tro === "QUAN_TRI_VIEN" &&
                ["MOI", "DA_XU_LY"].includes(r.trang_thai) && (
                  <AdminDecision
                    key={`decision-${r.phien_ban}`}
                    report={r}
                    pending={pending}
                    onSubmit={(body) => mutate("trang_thai", body)}
                  />
                )}
              {user.vai_tro === "KY_THUAT_VIEN" &&
                r.trang_thai === "DA_PHAN_CONG" && (
                  <>
                    <p>Bắt đầu khi bạn sẵn sàng xử lý tại hiện trường.</p>
                    <button
                      className="primary"
                      disabled={pending}
                      onClick={() =>
                        mutate("trang_thai", {
                          phien_ban: r.phien_ban,
                          trang_thai: "DANG_XU_LY",
                        })
                      }
                    >
                      Bắt đầu xử lý
                    </button>
                  </>
                )}
              {user.vai_tro === "KY_THUAT_VIEN" &&
                r.trang_thai === "DANG_XU_LY" && (
                  <form
                    key={r.phien_ban}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const data = new FormData(e.currentTarget);
                      data.set("phien_ban", r.phien_ban);
                      data.set("trang_thai", "DA_XU_LY");
                      mutate("trang_thai", data);
                    }}
                  >
                    <Field label="Kết quả xử lý (bắt buộc)">
                      <textarea
                        name="ghi_chu"
                        required
                        maxLength={500}
                        rows={4}
                      />
                    </Field>
                    <Field label="Phản hồi công khai (tùy chọn)">
                      <textarea
                        name="noi_dung_cong_khai"
                        maxLength={500}
                        rows={3}
                      />
                    </Field>
                    <p className="muted">
                      Cần ảnh nghiệm thu mới của lượt xử lý hiện tại.
                    </p>
                    <ImagesInput />
                    <button className="primary" disabled={pending}>
                      Hoàn thành và gửi nghiệm thu
                    </button>
                  </form>
                )}
              {(user.vai_tro === "CU_DAN" ||
                ["DA_DONG", "TU_CHOI", "TRUNG"].includes(r.trang_thai) ||
                (user.vai_tro === "KY_THUAT_VIEN" &&
                  r.trang_thai === "DA_XU_LY")) && (
                <p className="muted">
                  {r.trang_thai === "DA_XU_LY"
                    ? "Kết quả đã gửi, đang chờ Ban quản lý nghiệm thu."
                    : "Không có thao tác cập nhật ở trạng thái này."}
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
function Assignment({ report: r, pending, onSubmit }) {
  const resource = useResource("/nguoi_dung");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...Object.fromEntries(new FormData(e.currentTarget)),
          phien_ban: r.phien_ban,
        });
      }}
    >
      <h3>
        {r.trang_thai === "MOI"
          ? "Phân công kỹ thuật viên"
          : "Điều chỉnh phân công"}
      </h3>
      <ErrorBox error={resource.error} />
      <Field label="Kỹ thuật viên">
        <select
          name="ma_ky_thuat_vien"
          required
          defaultValue={r.ma_ky_thuat_vien || ""}
        >
          <option value="">Chọn kỹ thuật viên</option>
          {resource.result?.data
            .filter((u) => u.vai_tro === "KY_THUAT_VIEN" && u.dang_hoat_dong)
            .map((u) => (
              <option value={u.ma_nguoi_dung} key={u.ma_nguoi_dung}>
                {u.ho_va_ten}
              </option>
            ))}
        </select>
      </Field>
      <Field label="Độ ưu tiên">
        <select name="do_uu_tien" defaultValue={r.do_uu_tien}>
          <Options values={priorities} />
        </select>
      </Field>
      <Field label="Ghi chú nội bộ">
        <textarea name="ghi_chu" maxLength={500} rows={2} />
      </Field>
      <button className="primary" disabled={pending || resource.loading}>
        Lưu phân công
      </button>
    </form>
  );
}
function AdminDecision({ report: r, pending, onSubmit }) {
  const options =
    r.trang_thai === "MOI"
      ? { TU_CHOI: "Từ chối", TRUNG: "Gộp vào phản ánh khác" }
      : { DA_DONG: "Nghiệm thu đạt và đóng", DANG_XU_LY: "Trả lại xử lý" };
  const [target, setTarget] = useState(Object.keys(options)[0]);
  return (
    <form
      className="decision"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...Object.fromEntries(new FormData(e.currentTarget)),
          phien_ban: r.phien_ban,
          trang_thai: target,
        });
      }}
    >
      <h3>
        {r.trang_thai === "MOI" ? "Quyết định khác" : "Nghiệm thu kết quả"}
      </h3>
      <Field label="Thao tác">
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <Options values={options} />
        </select>
      </Field>
      {target === "TRUNG" && (
        <Field
          label="Mã số phản ánh gốc (cùng vị trí)"
          name="ma_phan_anh_goc"
          type="number"
          min="1"
          required
        />
      )}
      <Field
        label={target === "DA_DONG" ? "Ghi chú nội bộ" : "Lý do (bắt buộc)"}
      >
        <textarea
          name="ghi_chu"
          required={target !== "DA_DONG"}
          maxLength={500}
          rows={3}
        />
      </Field>
      <Field label="Phản hồi công khai">
        <textarea name="noi_dung_cong_khai" maxLength={500} rows={3} />
      </Field>
      <button
        disabled={pending}
        className={target === "DA_DONG" ? "primary" : "danger"}
      >
        Xác nhận quyết định
      </button>
    </form>
  );
}
