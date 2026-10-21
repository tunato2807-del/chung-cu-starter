import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorBox, Field, Loading, useResource } from "../../shared/ui.jsx";

export default function ApartmentFloorPicker({ apartment }) {
  const resource = useResource("/can_ho/so_do");
  const [code, setCode] = useState(
      apartment?.khoi_danh_muc || apartment?.khoi || "",
    ),
    [number, setNumber] = useState(apartment ? String(apartment.tang) : "");
  const block = resource.result?.data.khoi.find((item) => item.khoi === code);
  const floor = block?.tang.find((item) => String(item.tang) === number);
  return (
    <>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <div className="form-grid">
        <Field label="Khối">
          <select
            name="khoi"
            required
            value={block ? code : ""}
            onChange={(event) => {
              setCode(event.target.value);
              setNumber("");
            }}
          >
            <option value="">Chọn khối</option>
            {resource.result?.data.khoi.map((item) => (
              <option key={item.khoi} value={item.khoi}>
                {item.khoi}
                {item.ten_khoi ? ` · ${item.ten_khoi}` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tầng">
          <select
            name="tang"
            required
            value={floor ? number : ""}
            onChange={(event) => setNumber(event.target.value)}
          >
            <option value="">Chọn tầng</option>
            {block?.tang.map((item) => (
              <option key={item.tang} value={item.tang}>
                Tầng {item.tang}
                {item.ten_tang ? ` · ${item.ten_tang}` : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <input
        type="hidden"
        name="phien_ban_tang"
        value={floor?.phien_ban ?? ""}
      />
      <div className="actions">
        <button
          type="button"
          disabled={resource.loading}
          onClick={() => resource.reload()}
        >
          Tải lại khối/tầng
        </button>
        <Link to="/quan-tri/cau-truc-toa-nha">Khai báo khối/tầng mới</Link>
      </div>
    </>
  );
}
