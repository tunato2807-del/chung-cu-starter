import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Field, ErrorBox, Loading, useResource } from "../../shared/ui.jsx";
import { ApartmentAccount } from "./Residency.jsx";

export default function ApartmentAccounts() {
  const [params, setParams] = useSearchParams(),
    resource = useResource(`/can_ho/tai_khoan?${params}`),
    [selected, setSelected] = useState(null),
    page = resource.result?.page || 1;
  function go(next) {
    const query = new URLSearchParams(params);
    query.set("page", String(next));
    setParams(query);
  }
  return (
    <>
      <h1>Tài khoản căn hộ</h1>
      <p>
        Mỗi căn có một tài khoản thanh toán. Đăng nhập bằng số điện thoại của
        chủ hộ phụ trách hiện tại hoặc mã CH, với mật khẩu tài khoản căn hộ.
      </p>
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams(new URLSearchParams(new FormData(e.currentTarget)));
        }}
      >
        <Field
          label="Tìm căn hộ, mã tài khoản, chủ hộ hoặc số điện thoại"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field label="Trạng thái tài khoản căn hộ">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <option value="">Tất cả</option>
            <option value="DANG_HOAT_DONG">Đang hoạt động</option>
            <option value="DA_KHOA">Đã khóa</option>
          </select>
        </Field>
        <button>Tìm tài khoản căn hộ</button>
      </form>
      <ErrorBox error={resource.error} />
      {resource.loading && <Loading />}
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Căn hộ</th>
                <th>Mã tài khoản</th>
                <th>Chủ hộ phụ trách</th>
                <th>Số điện thoại đăng nhập</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((account) => (
                <tr key={account.ma_nguoi_dung}>
                  <td>
                    {account.so_can_ho}
                    <small>
                      Khối {account.khoi} · Tầng {account.tang}
                    </small>
                  </td>
                  <td>{account.ten_dang_nhap}</td>
                  <td>
                    {account.ma_cu_dan_phu_trach ? (
                      <Link
                        to={`/quan-tri/cu-dan/${account.ma_cu_dan_phu_trach}`}
                      >
                        {account.nguoi_phu_trach}
                      </Link>
                    ) : (
                      "Chưa gắn chủ hộ"
                    )}
                  </td>
                  <td>
                    {account.dien_thoai_phu_trach || "Chưa có số điện thoại"}
                  </td>
                  <td>
                    {account.dang_hoat_dong ? "Đang hoạt động" : "Đã khóa"}
                  </td>
                  <td>
                    <button
                      onClick={() => setSelected(account.ma_can_ho_thanh_toan)}
                    >
                      Quản lý tài khoản
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && (
          <p>Chưa có tài khoản căn hộ phù hợp.</p>
        )}
        <div className="pagination">
          <button
            disabled={resource.loading || page <= 1}
            onClick={() => go(page - 1)}
          >
            Trang trước
          </button>
          <span>
            Trang {page} · {resource.result?.total || 0} tài khoản
          </span>
          <button
            disabled={
              resource.loading || page * 20 >= (resource.result?.total || 0)
            }
            onClick={() => go(page + 1)}
          >
            Trang sau
          </button>
        </div>
      </section>
      {selected && (
        <>
          <div className="actions">
            <button onClick={() => setSelected(null)}>
              Đóng quản lý tài khoản
            </button>
          </div>
          <ApartmentAccount
            key={selected}
            id={selected}
            onChange={resource.reload}
          />
        </>
      )}
    </>
  );
}
