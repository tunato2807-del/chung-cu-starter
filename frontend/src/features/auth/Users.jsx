import React, { useState } from "react";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  roleNames,
  useResource,
} from "../../shared/ui.jsx";
export default function Users() {
  const resource = useResource("/nguoi_dung"),
    [error, setError] = useState(),
    [pending, setPending] = useState(false),
    [notice, setNotice] = useState("");
  async function run(action) {
    setPending(true);
    setError(null);
    try {
      await action();
      resource.reload();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <p className="eyebrow">CẤP VÀ QUẢN LÝ QUYỀN</p>
      <h1>Nhân sự & tài khoản</h1>
      <div className="detail-grid">
        <section className="card">
          <h2>Tài khoản hiện có</h2>
          <ErrorBox error={error} />
          {resource.loading && <Loading />}
          <ErrorBox error={resource.error} />
          <ul className="location-list">
            {resource.result?.data.map((u) => (
              <li key={u.ma_nguoi_dung}>
                <strong>{u.ho_va_ten}</strong>
                <span>
                  {u.so_dien_thoai} · {roleNames[u.vai_tro]}
                </span>
                <small>{u.dang_hoat_dong ? "Đang hoạt động" : "Đã khóa"}</small>
                {u.vai_tro !== "QUAN_TRI_VIEN" && (
                  <button
                    disabled={pending}
                    onClick={() =>
                      run(() =>
                        getJson(`/nguoi_dung/${u.ma_nguoi_dung}`, {
                          method: "PATCH",
                          body: { dang_hoat_dong: !u.dang_hoat_dong },
                        }),
                      )
                    }
                  >
                    {u.dang_hoat_dong ? "Khóa và kết thúc phiên" : "Mở khóa"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2>Cấp tài khoản</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const body = Object.fromEntries(new FormData(form));
              run(async () => {
                await getJson("/nguoi_dung", { method: "POST", body });
                form.reset();
                setNotice(
                  "Đã tạo tài khoản. Hãy chuyển mật khẩu cho người nhận qua kênh riêng.",
                );
              });
            }}
          >
            <Field
              label="Họ tên"
              name="ho_va_ten"
              minLength={2}
              maxLength={100}
              required
            />
            <Field
              label="Số điện thoại"
              name="so_dien_thoai"
              type="tel"
              required
            />
            <Field label="Vai trò">
              <select name="vai_tro">
                <Options
                  values={{ KY_THUAT_VIEN: "Kỹ thuật viên", CU_DAN: "Cư dân" }}
                />
              </select>
            </Field>
            <Field
              label="Chuyên môn (kỹ thuật viên)"
              name="chuyen_mon"
              maxLength={100}
            />
            <Field
              label="Mật khẩu ban đầu (ít nhất 10 ký tự)"
              name="mat_khau"
              type="password"
              minLength={10}
              required
              autoComplete="new-password"
            />
            <button className="primary" disabled={pending}>
              Cấp tài khoản
            </button>
            <p role="status">{notice}</p>
          </form>
        </section>
      </div>
    </>
  );
}
