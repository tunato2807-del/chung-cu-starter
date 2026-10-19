import React, { useEffect, useState, useId, useRef } from "react";
import { getJson } from "./api/client.js";
export const statuses = {
  MOI: "Mới tiếp nhận",
  DA_PHAN_CONG: "Đã phân công",
  DANG_XU_LY: "Đang xử lý",
  DA_XU_LY: "Chờ nghiệm thu",
  DA_DONG: "Đã đóng",
  TU_CHOI: "Từ chối",
  TRUNG: "Gộp trùng",
};
export const categories = {
  DIEN: "Điện",
  NUOC: "Nước",
  THANG_MAY: "Thang máy",
  VE_SINH: "Vệ sinh",
  AN_NINH: "An ninh",
  KHAC: "Khác",
};
export const priorities = {
  THAP: "Thấp",
  TRUNG_BINH: "Bình thường",
  CAO: "Cao",
  KHAN_CAP: "Khẩn cấp",
};
export const roleNames = {
  QUAN_TRI_VIEN: "Ban quản lý",
  KY_THUAT_VIEN: "Kỹ thuật viên",
  CU_DAN: "Cư dân",
};
export const homeFor = (u) =>
  u?.vai_tro === "QUAN_TRI_VIEN"
    ? "/quan-tri"
    : u?.vai_tro === "KY_THUAT_VIEN"
      ? "/ky-thuat/cong-viec"
      : "/cu-dan/phan-anh";
export const date = (value) =>
  value
    ? new Date(
        value.replace(" ", "T") + (value.endsWith("Z") ? "" : "Z"),
      ).toLocaleString("vi-VN")
    : "—";
export function Badge({ status }) {
  return (
    <span className={`badge status-${status}`}>
      {statuses[status] || status}
    </span>
  );
}
export function Options({ values, empty }) {
  return (
    <>
      {empty && <option value="">{empty}</option>}
      {Object.entries(values).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </>
  );
}
export function ErrorBox({ error }) {
  return error ? (
    <div className="error" role="alert">
      <strong>{error.message}</strong>
      {error.field_errors && (
        <ul>
          {Object.entries(error.field_errors).map(([k, v]) => (
            <li key={k}>
              {fieldNames[k] || k}: {v}
            </li>
          ))}
        </ul>
      )}
    </div>
  ) : null;
}
const fieldNames = {
  so_dien_thoai: "Số điện thoại",
  tieu_de: "Tiêu đề",
  noi_dung: "Mô tả",
  ten_nguoi_gui: "Họ tên",
  ho_va_ten: "Họ tên",
  ghi_chu: "Ghi chú",
  mat_khau: "Mật khẩu",
  mat_khau_moi: "Mật khẩu mới",
  ten_vi_tri: "Tên vị trí",
};
export function Field({ label, name, children, ...props }) {
  const generatedId = useId();
  const id = props.id || children?.props?.id || generatedId;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children ? (
        React.cloneElement(children, { id })
      ) : (
        <input name={name} {...props} id={id} />
      )}
    </div>
  );
}
export function useResource(path) {
  const [state, setState] = useState({ loading: true }),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    getJson(path, { signal: controller.signal })
      .then((result) => setState({ result, loading: false }))
      .catch((error) => {
        if (!controller.signal.aborted) setState({ error, loading: false });
      });
    return () => controller.abort();
  }, [path, revision]);
  return { ...state, reload: () => setRevision((n) => n + 1) };
}
export function Loading() {
  return (
    <p className="muted" role="status">
      Đang tải dữ liệu…
    </p>
  );
}
export function Timeline({ items }) {
  return (
    <ol className="timeline">
      {items.map((item, index) => (
        <li key={item.ma_lich_su_phan_anh || index}>
          <div>
            <Badge status={item.trang_thai_moi} />
            <time>{date(item.ngay_tao)}</time>
          </div>
          {item.noi_dung_cong_khai && <p>{item.noi_dung_cong_khai}</p>}
          {item.ghi_chu && <p className="muted">Nội bộ: {item.ghi_chu}</p>}
          {item.nguoi_thuc_hien && <small>{item.nguoi_thuc_hien}</small>}
        </li>
      ))}
    </ol>
  );
}
export function ImagesInput({ onBeforeChoose, disabled = false }) {
  const [files, setFiles] = useState([]),
    [error, setError] = useState("");
  const gallery = useRef(null),
    camera = useRef(null);
  const galleryId = useId(),
    cameraId = useId();
  useEffect(
    () => () => files.forEach((f) => URL.revokeObjectURL(f.url)),
    [files],
  );
  function choose(input) {
    onBeforeChoose?.();
    input.current?.click();
  }
  function selected(event, other) {
    const input = event.currentTarget;
    const picked = Array.from(input.files || []);
    if (!picked.length) {
      if (!other.current?.files?.length) setFiles([]);
      return;
    }
    if (
      picked.length > 5 ||
      picked.some((file) => file.size > 5 * 1024 * 1024)
    ) {
      input.value = "";
      if (!other.current?.files?.length) setFiles([]);
      setError(
        "Tối đa 5 ảnh, mỗi ảnh không quá 5 MB. Nội dung bạn đã nhập vẫn được giữ lại.",
      );
      return;
    }
    if (
      picked.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
          !/\.(jpe?g|png|webp)$/i.test(file.name),
      )
    ) {
      input.value = "";
      if (!other.current?.files?.length) setFiles([]);
      setError("Chọn ảnh JPEG, PNG hoặc WebP. Ảnh HEIC chưa được hỗ trợ.");
      return;
    }
    if (other.current) other.current.value = "";
    setError("");
    setFiles(
      picked.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    );
  }
  return (
    <div className="field">
      <label htmlFor={galleryId}>Ảnh hiện trường (JPEG, PNG, WebP)</label>
      <input
        ref={gallery}
        id={galleryId}
        name="hinh_anh"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        disabled={disabled}
        onChange={(event) => selected(event, camera)}
      />
      <input
        ref={camera}
        id={cameraId}
        aria-label="Chụp ảnh hiện trường"
        name="hinh_anh"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        hidden
        disabled={disabled}
        onChange={(event) => selected(event, gallery)}
      />
      <div className="actions">
        <button
          type="button"
          disabled={disabled}
          onClick={() => choose(gallery)}
        >
          Chọn ảnh từ thư viện
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => choose(camera)}
        >
          Chụp ảnh
        </button>
        {files.length > 0 && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              gallery.current.value = "";
              camera.current.value = "";
              setFiles([]);
              setError("");
            }}
          >
            Bỏ ảnh đã chọn
          </button>
        )}
      </div>
      <small>
        Tối đa 5 ảnh, mỗi ảnh 5 MB. Ảnh được tải lên khi bạn bấm gửi. Chọn lại
        để thay các ảnh đã chọn.
      </small>
      <p role="status">
        {files.length > 0 ? `Đã chọn ${files.length} ảnh.` : "Chưa chọn ảnh."}
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="image-grid">
        {files.map((f, i) => (
          <img
            key={i}
            src={f.url}
            loading="lazy"
            decoding="async"
            alt={`Xem trước ${f.name}`}
          />
        ))}
      </div>
    </div>
  );
}
