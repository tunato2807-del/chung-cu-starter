# Cập nhật số lượng, chọn ngân hàng và giao diện thanh toán

Áp dụng sau bản điện bậc thang (commit `e4237c4`, migration 006). Tạo/thay đủ **3 file frontend** dưới đây trong VS Code. Không cần tải ZIP, cài thư viện hoặc chạy migration mới. Các file backend và dữ liệu hóa đơn giữ nguyên.

## Thay đổi

- Số lượng từ API là chuỗi thập phân. `1.000` nghĩa là 1 (một), không phải một nghìn. Hiển thị theo định dạng Việt Nam và bỏ số 0 thập phân thừa: 1 xe, 100 m², 5 m³, 15 kWh; `12.125` thành 12,125 m³. Lượng thực có số lẻ được giữ nguyên, không làm tròn thành số xe hoặc cắt mất phần lẻ của nước/điện. Đơn giá ví dụ `100000.00` hiện 100.000 đ.
- Đã rà backend: đếm riêng O_TO, XE_MAY, XE_DAP theo căn và ngày chốt (`ngay_dang_ky <= ngày chốt`, ngày kết thúc trống hoặc sau ngày chốt). Xe kết thúc ngay ngày chốt hoặc đăng ký sau ngày chốt không tính. Giao diện dùng số lượng đã lưu trên hóa đơn; nếu vừa sửa xe, chỉ bản nháp được tính lại, hóa đơn duyệt/gửi/thu vẫn giữ snapshot.
- BQL tìm/chọn ngân hàng theo tên (có thể gõ không dấu), không phải nhập mã BIN. Danh sách tích hợp 35 ngân hàng, chạy cục bộ. Không chọn sẵn ngân hàng nhận tiền; vẫn cần nhập số tài khoản và tên người nhận. Lọc danh sách không làm đổi ngân hàng đã chọn. Form gửi BIN tương ứng qua API cũ.
- Thẻ thanh toán trải hết chiều ngang khu vực nội dung, tổng tiền và QR nằm giữa; tên ngân hàng, tài khoản, người nhận, nội dung chuyển khoản và hạn trả ở dưới. Có nút tải ảnh QR. Màn hình điện thoại tự co nội dung, không tràn trang. Cư dân vẫn không tự xác nhận đã thanh toán.
- Hóa đơn cũ có BIN ngoài danh sách vẫn hiển thị mã đó, không đoán tên ngân hàng. Khi cần ngân hàng khác, thêm tên/BIN đúng vào banks.js. Danh sách là dữ liệu trong ứng dụng, không đồng bộ trực tuyến và không xác minh tài khoản nhận tiền.

## Chuẩn bị

Mở đúng thư mục dự án đang chạy. Nếu có chỉnh sửa riêng, lưu bản riêng của 2 file sẽ thay trước khi chép. Giữ `.env`, `.certs`, database, ảnh upload và các migration cũ. Tạo file banks.js trước rồi thay Billing.jsx và global.css. Chép đủ cả 3 file để tránh thiếu import hoặc thiếu kiểu giao diện.

## 1. `frontend/src/features/billing/banks.js`

Tạo file mới.

```js
// Local VietQR/NAPAS BIN directory. Selecting a bank never sends account data
// to a third-party service. Update this list when a bank changes its BIN/name.
export const banks = [
  ["970416", "ACB", "Ngân hàng TMCP Á Châu"],
  [
    "970405",
    "Agribank",
    "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam",
  ],
  ["970425", "ABBANK", "Ngân hàng TMCP An Bình"],
  ["970409", "Bac A Bank", "Ngân hàng TMCP Bắc Á"],
  ["970438", "BaoViet Bank", "Ngân hàng TMCP Bảo Việt"],
  ["970418", "BIDV", "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam"],
  ["970446", "Co-opBank", "Ngân hàng Hợp tác xã Việt Nam"],
  ["970431", "Eximbank", "Ngân hàng TMCP Xuất Nhập khẩu Việt Nam"],
  ["970437", "HDBank", "Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh"],
  ["970434", "Indovina Bank", "Ngân hàng TNHH Indovina"],
  ["970452", "KienlongBank", "Ngân hàng TMCP Kiên Long"],
  ["970449", "LPBank", "Ngân hàng TMCP Lộc Phát Việt Nam"],
  ["970422", "MB", "Ngân hàng TMCP Quân đội"],
  ["970426", "MSB", "Ngân hàng TMCP Hàng Hải Việt Nam"],
  ["970428", "Nam A Bank", "Ngân hàng TMCP Nam Á"],
  ["970419", "NCB", "Ngân hàng TMCP Quốc Dân"],
  ["970448", "OCB", "Ngân hàng TMCP Phương Đông"],
  ["970430", "PGBank", "Ngân hàng TMCP Thịnh vượng và Phát triển"],
  ["970412", "PVcomBank", "Ngân hàng TMCP Đại Chúng Việt Nam"],
  ["970403", "Sacombank", "Ngân hàng TMCP Sài Gòn Thương Tín"],
  ["970400", "Saigonbank", "Ngân hàng TMCP Sài Gòn Công Thương"],
  ["970429", "SCB", "Ngân hàng TMCP Sài Gòn"],
  ["970440", "SeABank", "Ngân hàng TMCP Đông Nam Á"],
  ["970443", "SHB", "Ngân hàng TMCP Sài Gòn – Hà Nội"],
  ["970424", "Shinhan Bank", "Ngân hàng TNHH MTV Shinhan Việt Nam"],
  ["970407", "Techcombank", "Ngân hàng TMCP Kỹ thương Việt Nam"],
  ["970423", "TPBank", "Ngân hàng TMCP Tiên Phong"],
  ["970458", "UOB", "Ngân hàng TNHH MTV United Overseas Bank Việt Nam"],
  ["970441", "VIB", "Ngân hàng TMCP Quốc tế Việt Nam"],
  ["970427", "Viet A Bank", "Ngân hàng TMCP Việt Á"],
  ["970433", "Vietbank", "Ngân hàng TMCP Việt Nam Thương Tín"],
  ["970436", "Vietcombank", "Ngân hàng TMCP Ngoại thương Việt Nam"],
  ["970415", "VietinBank", "Ngân hàng TMCP Công Thương Việt Nam"],
  ["970432", "VPBank", "Ngân hàng TMCP Việt Nam Thịnh Vượng"],
  ["970457", "Woori Bank", "Ngân hàng TNHH MTV Woori Việt Nam"],
]
  .map(([bin, shortName, name]) => ({ bin, shortName, name }))
  .sort((a, b) => a.shortName.localeCompare(b.shortName, "vi"));

export const bankName = (bin) =>
  banks.find((bank) => bank.bin === bin)?.shortName || `Ngân hàng (BIN ${bin})`;
export const bankSearch = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
```

## 2. `frontend/src/features/billing/Billing.jsx`

Thay toàn bộ nội dung file.

```jsx
import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import QRCode from "qrcode";
import { banks, bankName, bankSearch } from "./banks.js";
import { useAuth } from "../auth/Auth.jsx";
import { getJson } from "../../shared/api/client.js";
import {
  ErrorBox,
  Field,
  Loading,
  Options,
  useResource,
} from "../../shared/ui.jsx";

const fees = {
  PHI_QUAN_LY: "Phí quản lý",
  GUI_O_TO: "Gửi ô tô",
  GUI_XE_MAY: "Gửi xe máy",
  GUI_XE_DAP: "Gửi xe đạp",
  TIEN_NUOC: "Tiền nước",
  TIEN_DIEN: "Tiền điện",
};
const statuses = {
  NHAP: "Bản nháp",
  DA_DUYET: "Đã duyệt",
  DA_GUI: "Đã gửi",
  DA_THANH_TOAN: "Đã thanh toán",
  HUY: "Đã hủy",
};
const meterNames = { DIEN: "Điện", NUOC: "Nước" };
const eventNames = {
  LAP_NHAP: "Lập bản nháp",
  LAP_THAY_THE: "Lập bản thay thế",
  TINH_LAI: "Tính lại bản nháp",
  DUYET: "Duyệt hóa đơn",
  GUI: "Gửi hóa đơn",
  HUY: "Hủy hóa đơn",
  XAC_NHAN_THANH_TOAN: "Xác nhận đã thu",
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const money = (n) => `${BigInt(n || 0).toLocaleString("vi-VN")} đ`;
// Format API decimal strings without losing precision or displaying trailing zeros.
const number = (value) => {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(String(value ?? ""));
  if (!match) return "—";
  const fraction = (match[2] || "").replace(/0+$/, "");
  return `${BigInt(match[1]).toLocaleString("vi-VN")}${fraction ? `,${fraction}` : ""}`;
};
const values = (e) => Object.fromEntries(new FormData(e.currentTarget));
function billOptions(body) {
  for (const k of ["tinh_nuoc", "tinh_dien", "tinh_xe"])
    body[k] = body[k] === "1";
  return body;
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
      setNotice("Đã lưu thay đổi.");
      after?.(r.data);
      done?.();
    } catch (err) {
      setError(err);
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
function Pager({ resource }) {
  const [params, setParams] = useSearchParams(),
    page = resource.result?.page || 1,
    total = resource.result?.total || 0;
  function go(p) {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
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
function ApartmentField({ initialId = "", initialLabel = "" }) {
  const [q, setQ] = useState(""),
    [id, setId] = useState(String(initialId)),
    [label, setLabel] = useState(initialLabel);
  const resource = useResource(`/can_ho?q=${encodeURIComponent(q)}`),
    matches = resource.result?.data || [];
  return (
    <>
      <Field label="Tìm căn hộ để chọn">
        <input
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
        />
      </Field>
      <ErrorBox error={resource.error} />
      <Field label="Căn hộ">
        <select
          name="ma_can_ho"
          required
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setLabel(e.target.selectedOptions[0].textContent);
          }}
        >
          <option value="">Chọn căn hộ</option>
          {id && !matches.some((a) => String(a.ma_can_ho) === id) && (
            <option value={id}>{label || `Căn #${id}`}</option>
          )}
          {matches.map((a) => (
            <option key={a.ma_can_ho} value={a.ma_can_ho}>
              {a.so_can_ho}
            </option>
          ))}
        </select>
      </Field>
      {resource.result?.total > 20 && (
        <small>
          Nhập số căn cụ thể để thu hẹp {resource.result.total} kết quả.
        </small>
      )}
    </>
  );
}
function ChargeOptions({ bill }) {
  return (
    <div className="card">
      <p>
        Khoản thu áp dụng: phí quản lý theo cấu hình của căn hộ; các khoản khác
        chọn dưới đây.
      </p>
      {[
        ["tinh_nuoc", "Thu tiền nước", true],
        ["tinh_dien", "BQL thu tiền điện", false],
        ["tinh_xe", "Thu phí gửi xe", true],
      ].map(([key, label, defaultValue]) => (
        <label className="checkbox" key={key}>
          <input
            type="checkbox"
            name={key}
            value="1"
            defaultChecked={bill ? !!bill[key] : defaultValue}
          />
          {label}
        </label>
      ))}
      <small>
        Điện áp dụng biểu giá và thuế hiệu lực tại ngày chốt. Nếu cư dân trả
        trực tiếp cho EVN, không chọn BQL thu tiền điện. Phí xe theo số đăng ký
        hiệu lực tại ngày chốt, chưa chia theo ngày.
      </small>
    </div>
  );
}

export function Rates() {
  const [params, setParams] = useSearchParams(),
    resource = useResource(`/cau_hinh_phi?${params}`),
    action = useAction(resource.reload),
    [type, setType] = useState("PHI_QUAN_LY"),
    [method, setMethod] = useState("BAC_THANG"),
    [vat, setVat] = useState(""),
    [tiers, setTiers] = useState(
      [50, 100, 200, 300, 400, null].map((upper) => ({
        den_kwh: upper,
        don_gia: "",
      })),
    );
  function setTier(index, key, value) {
    setTiers((all) =>
      all.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  }
  return (
    <>
      <h1>Đơn giá phí</h1>
      <p>
        Đơn giá theo ngày hiệu lực. Phiên bản mới kết thúc khoảng giá trước đó;
        các đơn giá và chi tiết hóa đơn đã lưu được giữ lại.
      </p>
      <Feedback action={action} />
      <section className="card narrow">
        <h2>Thêm phiên bản giá</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const body = values(e);
            if (type === "TIEN_DIEN") {
              body.cach_tinh = method;
              body.thue_gtgt = vat;
              if (method === "BAC_THANG")
                body.bac_dien = tiers.map((r, i) => ({
                  den_kwh: i === tiers.length - 1 ? null : Number(r.den_kwh),
                  don_gia: r.don_gia,
                }));
            }
            action.run("/cau_hinh_phi", "POST", body, () => {
              form.reset();
              setType("PHI_QUAN_LY");
              setMethod("BAC_THANG");
              setVat("");
              setTiers(
                [50, 100, 200, 300, 400, null].map((upper) => ({
                  den_kwh: upper,
                  don_gia: "",
                })),
              );
            });
          }}
        >
          <fieldset disabled={action.pending}>
            <Field label="Loại phí">
              <select
                name="loai_phi"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <Options values={fees} />
              </select>
            </Field>
            {type === "TIEN_DIEN" && (
              <>
                <Field label="Cách tính điện">
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option value="BAC_THANG">Bậc thang lũy tiến</option>
                    <option value="DON_GIA">
                      Một đơn giá theo cấu hình thu điện
                    </option>
                  </select>
                </Field>
                <p>
                  Đối chiếu biểu giá, định mức và thuế áp dụng trước khi lưu.
                  Công tơ do EVN thu trực tiếp không đưa vào hóa đơn BQL.
                </p>
                <Field label="Thuế GTGT điện (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={vat}
                    onChange={(e) => setVat(e.target.value)}
                  />
                </Field>
                {method === "BAC_THANG" && (
                  <>
                    <p>
                      Nhập ngưỡng cộng dồn: 50, 100, 200... kWh. Điện vượt mỗi
                      ngưỡng được tính ở bậc tiếp theo.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTiers(
                          [50, 100, 200, 300, 400, null].map((upper, i) => ({
                            den_kwh: upper,
                            don_gia: String(
                              [1984, 2050, 2380, 2998, 3350, 3460][i],
                            ),
                          })),
                        );
                        setVat("8");
                      }}
                    >
                      Điền mẫu 6 bậc và thuế 8%
                    </button>
                    <small>
                      Mẫu theo số liệu tham khảo bạn cung cấp, chưa xác minh
                      hiệu lực; có thể sửa trước khi lưu.
                    </small>
                    {tiers.map((row, i) => (
                      <div className="form-grid" key={i}>
                        <Field label={`Bậc ${i + 1}: đến kWh`}>
                          {i === tiers.length - 1 ? (
                            <span>Không giới hạn</span>
                          ) : (
                            <input
                              type="number"
                              min="1"
                              max="999999999"
                              step="1"
                              required
                              value={row.den_kwh ?? ""}
                              onChange={(e) =>
                                setTier(i, "den_kwh", e.target.value)
                              }
                            />
                          )}
                        </Field>
                        <Field label={`Đơn giá bậc ${i + 1} (đồng/kWh)`}>
                          <input
                            type="number"
                            min="0"
                            max="9999999999.99"
                            step="0.01"
                            required
                            value={row.don_gia}
                            onChange={(e) =>
                              setTier(i, "don_gia", e.target.value)
                            }
                          />
                        </Field>
                      </div>
                    ))}
                    <div className="actions">
                      <button
                        type="button"
                        disabled={tiers.length >= 12}
                        onClick={() =>
                          setTiers((all) => [
                            ...all.slice(0, -1),
                            { den_kwh: "", don_gia: "" },
                            all.at(-1),
                          ])
                        }
                      >
                        Thêm bậc
                      </button>
                      <button
                        type="button"
                        disabled={tiers.length <= 2}
                        onClick={() =>
                          setTiers((all) => [...all.slice(0, -2), all.at(-1)])
                        }
                      >
                        Bớt bậc
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
            {(type !== "TIEN_DIEN" || method === "DON_GIA") && (
              <Field
                label="Đơn giá (đồng/đơn vị)"
                name="don_gia"
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
                required
              />
            )}
            <Field
              label="Áp dụng từ ngày"
              name="tu_ngay"
              type="date"
              required
              defaultValue={today()}
            />
            <button className="primary">Lưu đơn giá</button>
          </fieldset>
        </form>
      </section>
      <form
        className="filters"
        key={params.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field label="Lọc loại phí">
          <select name="loai_phi" defaultValue={params.get("loai_phi") || ""}>
            <Options values={fees} empty="Tất cả" />
          </select>
        </Field>
        <button>Lọc</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Loại phí</th>
                <th>Đơn giá</th>
                <th>Đơn vị</th>
                <th>Từ ngày</th>
                <th>Đến trước ngày</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((r) => (
                <tr key={r.ma_cau_hinh_phi}>
                  <td>{r.ten_phi}</td>
                  <td>
                    {r.cach_tinh === "BAC_THANG" ? (
                      <details>
                        <summary>Biểu giá bậc thang</summary>
                        <ol>
                          {(typeof r.bac_dien === "string"
                            ? JSON.parse(r.bac_dien)
                            : r.bac_dien
                          ).map((tier, i) => (
                            <li key={i}>
                              Đến {tier.den_kwh ?? "không giới hạn"} kWh:{" "}
                              {number(tier.don_gia)} đ/kWh
                            </li>
                          ))}
                        </ol>
                      </details>
                    ) : (
                      number(r.don_gia)
                    )}
                    {r.loai_phi === "TIEN_DIEN" && (
                      <small> · Thuế GTGT {number(r.thue_gtgt)}%</small>
                    )}
                  </td>
                  <td>{r.don_vi_tinh}</td>
                  <td>{r.tu_ngay}</td>
                  <td>{r.den_ngay || "Chưa kết thúc"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có đơn giá.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
export function Meters() {
  const [params, setParams] = useSearchParams(),
    resource = useResource(`/chi_so_dich_vu?${params}`),
    [editing, setEditing] = useState(null),
    action = useAction(resource.reload);
  return (
    <>
      <h1>Chỉ số điện nước</h1>
      <p>
        Nhập lần lượt từng kỳ. Chỉ số đầu kỳ phải khớp cuối kỳ liền trước; kỳ
        đầu cần xác nhận riêng.
      </p>
      <Feedback action={action} />
      <section className="card narrow">
        <h2>{editing ? "Sửa chỉ số" : "Ghi chỉ số"}</h2>
        <form
          key={editing?.ma_chi_so_dich_vu || "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const body = values(e);
            body.ky_dau = body.ky_dau === "1";
            if (editing) body.phien_ban = editing.phien_ban;
            action.run("/chi_so_dich_vu", "PUT", body, () => setEditing(null));
          }}
        >
          <fieldset disabled={action.pending}>
            {editing ? (
              <>
                <p>
                  Căn {editing.so_can_ho} · Kỳ {editing.ky_thanh_toan} ·{" "}
                  {meterNames[editing.loai_dich_vu]}
                </p>
                <input
                  type="hidden"
                  name="ma_can_ho"
                  value={editing.ma_can_ho}
                />
                <input
                  type="hidden"
                  name="loai_dich_vu"
                  value={editing.loai_dich_vu}
                />
                <input
                  type="hidden"
                  name="ky_thanh_toan"
                  value={editing.ky_thanh_toan}
                />
              </>
            ) : (
              <>
                <ApartmentField />
                <Field label="Dịch vụ">
                  <select name="loai_dich_vu">
                    <option value="NUOC">Nước</option>
                    <option value="DIEN">Điện</option>
                  </select>
                </Field>
                <Field
                  label="Kỳ ghi chỉ số"
                  name="ky_thanh_toan"
                  type="month"
                  required
                  max={today().slice(0, 7)}
                  defaultValue={today().slice(0, 7)}
                />
              </>
            )}
            <div className="form-grid">
              <Field
                label="Chỉ số đầu kỳ"
                name="chi_so_cu"
                type="number"
                min="0"
                step="0.001"
                required
                defaultValue={editing?.chi_so_cu || ""}
              />
              <Field
                label="Chỉ số cuối kỳ"
                name="chi_so_moi"
                type="number"
                min="0"
                step="0.001"
                required
                defaultValue={editing?.chi_so_moi || ""}
              />
            </div>
            <Field
              label="Ngày chốt chỉ số"
              name="ngay_chot"
              type="date"
              required
              max={today()}
              defaultValue={editing?.ngay_chot || today()}
            />
            <Field
              label="Ghi chú chỉ số"
              name="ghi_chu"
              maxLength={255}
              defaultValue={editing?.ghi_chu || ""}
            />
            {!editing && (
              <label className="checkbox">
                <input type="checkbox" name="ky_dau" value="1" />
                Đây là kỳ đầu tiên của căn đối với dịch vụ này
              </label>
            )}
            <button className="primary">Lưu chỉ số</button>
          </fieldset>
        </form>
        {editing && (
          <button disabled={action.pending} onClick={() => setEditing(null)}>
            Hủy sửa
          </button>
        )}
      </section>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(values(e));
        }}
      >
        <Field
          label="Lọc kỳ chỉ số"
          name="ky_thanh_toan"
          type="month"
          defaultValue={params.get("ky_thanh_toan") || ""}
        />
        <button>Lọc chỉ số</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Căn</th>
                <th>Kỳ / dịch vụ</th>
                <th>Đầu kỳ</th>
                <th>Cuối kỳ</th>
                <th>Ngày chốt</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((r) => (
                <tr key={r.ma_chi_so_dich_vu}>
                  <td>{r.so_can_ho}</td>
                  <td>
                    {r.ky_thanh_toan} · {meterNames[r.loai_dich_vu]}
                  </td>
                  <td>{number(r.chi_so_cu)}</td>
                  <td>{number(r.chi_so_moi)}</td>
                  <td>{r.ngay_chot}</td>
                  <td>
                    <button
                      disabled={action.pending}
                      onClick={() => setEditing(r)}
                    >
                      Sửa chỉ số
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager resource={resource} />
      </section>
    </>
  );
}

export function Bills() {
  const { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri/hoa-don" : "/cu-dan/hoa-don",
    api = admin ? "/hoa_don" : "/cua_toi/hoa_don";
  const [params, setParams] = useSearchParams(),
    resource = useResource(`${api}?${params}`),
    [adding, setAdding] = useState(false),
    navigate = useNavigate(),
    action = useAction(resource.reload);
  return (
    <>
      <div className="page-heading">
        <h1>{admin ? "Phí và hóa đơn" : "Hóa đơn của tôi"}</h1>
        {admin && (
          <button
            className="primary"
            disabled={action.pending}
            onClick={() => setAdding(!adding)}
          >
            {adding ? "Đóng biểu mẫu" : "Lập hóa đơn"}
          </button>
        )}
      </div>
      <Feedback action={action} />
      {adding && (
        <section className="card narrow">
          <h2>Lập bản nháp cho căn hộ</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action.run("/hoa_don/lap", "POST", billOptions(values(e)), (r) =>
                navigate(`${base}/${r.ma_hoa_don}`),
              );
            }}
          >
            <fieldset disabled={action.pending}>
              <ApartmentField />
              <Field
                label="Kỳ hóa đơn"
                name="ky_thanh_toan"
                type="month"
                required
                max={today().slice(0, 7)}
                defaultValue={today().slice(0, 7)}
              />
              <Field
                label="Ngày chốt phí"
                name="ngay_chot_phi"
                type="date"
                required
                max={today()}
                defaultValue={today()}
              />
              <ChargeOptions />
              <button className="primary">Tạo bản nháp</button>
            </fieldset>
          </form>
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
          label="Tìm số hóa đơn hoặc căn hộ"
          name="q"
          maxLength={100}
          defaultValue={params.get("q") || ""}
        />
        <Field
          label="Lọc kỳ hóa đơn"
          name="ky_thanh_toan"
          type="month"
          defaultValue={params.get("ky_thanh_toan") || ""}
        />
        <Field label="Trạng thái hóa đơn">
          <select
            name="trang_thai"
            defaultValue={params.get("trang_thai") || ""}
          >
            <Options
              values={
                admin
                  ? statuses
                  : {
                      DA_GUI: statuses.DA_GUI,
                      DA_THANH_TOAN: statuses.DA_THANH_TOAN,
                    }
              }
              empty="Tất cả"
            />
          </select>
        </Field>
        <button>Tìm hóa đơn</button>
      </form>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Số hóa đơn</th>
                <th>Căn / kỳ</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Hạn trả</th>
              </tr>
            </thead>
            <tbody>
              {resource.result?.data.map((b) => (
                <tr key={b.ma_hoa_don}>
                  <td>
                    <Link to={`${base}/${b.ma_hoa_don}`}>{b.so_hoa_don}</Link>
                  </td>
                  <td>
                    {b.so_can_ho} · {b.ky_thanh_toan}
                  </td>
                  <td>{money(b.tong_tien)}</td>
                  <td>
                    {statuses[b.trang_thai]}
                    {b.qua_han && " · Quá hạn"}
                  </td>
                  <td>{b.han_thanh_toan || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resource.result?.total === 0 && <p>Chưa có hóa đơn phù hợp.</p>}
        <Pager resource={resource} />
      </section>
    </>
  );
}
function BankSelect() {
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState("");
  const matches = banks.filter((bank) =>
    bankSearch(`${bank.shortName} ${bank.name} ${bank.bin}`).includes(
      bankSearch(query),
    ),
  );
  const current = banks.find((bank) => bank.bin === selected);
  const option = (bank) => (
    <option key={bank.bin} value={bank.bin}>
      {bank.shortName} — {bank.name}
    </option>
  );
  return (
    <div className="bank-picker">
      <Field label="Tìm ngân hàng">
        <input
          type="search"
          value={query}
          maxLength={100}
          placeholder="Nhập tên ngân hàng, ví dụ Vietcombank"
          onChange={(e) => setQuery(e.target.value)}
        />
      </Field>
      <Field label="Ngân hàng nhận tiền">
        <select
          name="ma_ngan_hang"
          required
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Chọn ngân hàng</option>
          {current &&
            !matches.some((bank) => bank.bin === selected) &&
            option(current)}
          {matches.map(option)}
        </select>
      </Field>
      {!matches.length && (
        <p className="muted">
          Không tìm thấy ngân hàng. Hãy thử tên khác hoặc xóa từ khóa.
        </p>
      )}
      {current && (
        <p className="bank-selection">
          Đã chọn: <strong>{current.shortName}</strong>
        </p>
      )}
    </div>
  );
}
function PaymentQR({ bill }) {
  const [image, setImage] = useState(""),
    [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    setImage("");
    setError(null);
    if (bill.qr_payload)
      QRCode.toDataURL(bill.qr_payload, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "M",
      })
        .then((url) => {
          if (active) setImage(url);
        })
        .catch((e) => {
          if (active) setError(e);
        });
    return () => {
      active = false;
    };
  }, [bill.qr_payload]);
  if (!bill.qr_payload) return null;
  return (
    <section
      className="card payment-card"
      aria-label="Thông tin thanh toán hóa đơn"
    >
      <header className="payment-header">
        <span className="payment-status">Chờ thanh toán</span>
        <h2>Chuyển khoản bằng VietQR</h2>
        <p>
          Căn {bill.so_can_ho} · Kỳ {bill.ky_thanh_toan}
        </p>
      </header>
      <div className="payment-body">
        <p className="payment-amount-label">Số tiền cần thanh toán</p>
        <p className="payment-amount">{money(bill.tong_tien)}</p>
        <div className="payment-qr-frame">
          <span className="payment-qr-brand">VIETQR</span>
          {image ? (
            <img
              src={image}
              alt={`VietQR hóa đơn ${bill.so_hoa_don}`}
              width="320"
              height="320"
            />
          ) : (
            !error && <p role="status">Đang tạo mã QR…</p>
          )}
          <ErrorBox error={error} />
          <span className="payment-qr-caption">
            Quét mã bằng ứng dụng ngân hàng
          </span>
        </div>
        <dl className="payment-details">
          <div>
            <dt>Ngân hàng</dt>
            <dd>{bankName(bill.ma_ngan_hang)}</dd>
          </div>
          <div>
            <dt>Số tài khoản</dt>
            <dd className="payment-account">{bill.so_tai_khoan}</dd>
          </div>
          <div>
            <dt>Người nhận</dt>
            <dd>{bill.ten_nguoi_nhan}</dd>
          </div>
          <div className="payment-reference">
            <dt>Nội dung chuyển khoản</dt>
            <dd>{bill.so_hoa_don}</dd>
          </div>
          <div>
            <dt>Hạn thanh toán</dt>
            <dd>{bill.han_thanh_toan?.split("-").reverse().join("/")}</dd>
          </div>
        </dl>
        {image && (
          <a
            className="button payment-download"
            href={image}
            download={`VietQR-${bill.so_hoa_don}.png`}
          >
            Tải mã QR
          </a>
        )}
        <p className="payment-notice">
          Kiểm tra người nhận, số tiền và giữ đúng nội dung chuyển khoản. Ban
          quản lý sẽ xác nhận sau khi đối soát giao dịch.
        </p>
      </div>
    </section>
  );
}
export function BillDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    admin = user.vai_tro === "QUAN_TRI_VIEN",
    base = admin ? "/quan-tri/hoa-don" : "/cu-dan/hoa-don",
    resource = useResource(`${admin ? "/hoa_don" : "/cua_toi/hoa_don"}/${id}`),
    action = useAction(resource.reload),
    navigate = useNavigate(),
    bill = resource.result?.data;
  const run = (name, body = {}, after) =>
    action.run(
      `/hoa_don/${id}/${name}`,
      "POST",
      { ...body, phien_ban: bill.phien_ban },
      after,
    );
  return (
    <>
      <Link to={base}>← Danh sách hóa đơn</Link>
      {resource.loading && <Loading />}
      <ErrorBox error={resource.error} />
      <Feedback action={action} />
      {bill && (
        <>
          <h1>Hóa đơn {bill.so_hoa_don}</h1>
          <p>
            Căn {bill.so_can_ho} · Kỳ {bill.ky_thanh_toan} · Chốt ngày{" "}
            {bill.ngay_chot_phi}
          </p>
          <p>
            {statuses[bill.trang_thai]}
            {bill.qua_han && " · Quá hạn"} · Hạn trả:{" "}
            {bill.han_thanh_toan || "Chưa gửi"}
          </p>
          {admin && bill.loi_du_lieu.length > 0 && (
            <div className="error" role="alert">
              <strong>Cần bổ sung trước khi duyệt:</strong>
              <ul>
                {bill.loi_du_lieu.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <section className="card bill-lines">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Khoản thu</th>
                    <th>Số lượng</th>
                    <th>Đơn vị</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.lines.map((l, i) => (
                    <tr key={i}>
                      <td>{l.dien_giai}</td>
                      <td className="bill-number">{number(l.so_luong)}</td>
                      <td>{l.don_vi_tinh}</td>
                      <td className="bill-number">{number(l.don_gia)} đ</td>
                      <td className="bill-number bill-line-total">
                        {money(l.thanh_tien)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 className="bill-total">Tổng cộng: {money(bill.tong_tien)}</h2>
          </section>
          <PaymentQR bill={bill} />
          {bill.trang_thai === "DA_THANH_TOAN" && (
            <p className="note">
              Đã ghi nhận {money(bill.so_tien_da_thu)} · Tham chiếu:{" "}
              {bill.ma_tham_chieu}
            </p>
          )}
          {admin && bill.trang_thai === "NHAP" && (
            <section className="card narrow">
              <h2>Tính lại bản nháp</h2>
              <form
                key={bill.phien_ban}
                onSubmit={(e) => {
                  e.preventDefault();
                  run("tinh_lai", billOptions(values(e)));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Ngày chốt phí"
                    name="ngay_chot_phi"
                    type="date"
                    required
                    max={today()}
                    defaultValue={bill.ngay_chot_phi}
                  />
                  <ChargeOptions bill={bill} />
                  <button>Tính lại bản nháp</button>
                </fieldset>
              </form>
              <button
                className="primary"
                disabled={
                  action.pending ||
                  bill.loi_du_lieu.length > 0 ||
                  BigInt(bill.tong_tien) <= 0n
                }
                onClick={() => run("duyet")}
              >
                Duyệt hóa đơn
              </button>
            </section>
          )}
          {admin && bill.trang_thai === "DA_DUYET" && (
            <section className="card narrow bill-publish">
              <h2>Gửi hóa đơn cho cư dân</h2>
              <p className="muted">
                Chọn ngân hàng và điền thông tin nhận tiền để tạo mã thanh toán
                cho hóa đơn.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run("gui", values(e));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Hạn thanh toán"
                    name="han_thanh_toan"
                    type="date"
                    min={today()}
                    defaultValue={today()}
                    required
                  />
                  <BankSelect />
                  <Field
                    label="Số tài khoản nhận"
                    name="so_tai_khoan"
                    inputMode="numeric"
                    pattern="[0-9]{6,30}"
                    required
                  />
                  <Field
                    label="Tên người nhận"
                    name="ten_nguoi_nhan"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                  <button className="primary">Gửi hóa đơn</button>
                </fieldset>
              </form>
            </section>
          )}
          {admin && bill.trang_thai === "DA_GUI" && (
            <section className="card narrow">
              <h2>Xác nhận thu tiền</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run("xac_nhan_thanh_toan", values(e));
                }}
              >
                <fieldset disabled={action.pending}>
                  <Field
                    label="Số tiền đã đối soát"
                    name="so_tien"
                    type="number"
                    step="1"
                    min="1"
                    required
                    defaultValue={bill.tong_tien}
                  />
                  <Field
                    label="Mã tham chiếu giao dịch"
                    name="ma_tham_chieu"
                    required
                    minLength={3}
                    maxLength={100}
                  />
                  <label className="checkbox">
                    <input type="checkbox" required />
                    Đã đối soát đủ số tiền hóa đơn
                  </label>
                  <button className="primary">Xác nhận đã thu</button>
                </fieldset>
              </form>
            </section>
          )}
          {admin &&
            ["NHAP", "DA_DUYET", "DA_GUI"].includes(bill.trang_thai) && (
              <section className="card narrow">
                <h2>Hủy hóa đơn</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run("huy", values(e));
                  }}
                >
                  <fieldset disabled={action.pending}>
                    <Field
                      label="Lý do hủy"
                      name="ly_do"
                      required
                      minLength={3}
                      maxLength={255}
                    />
                    <button>Hủy hóa đơn</button>
                  </fieldset>
                </form>
              </section>
            )}
          {admin && bill.trang_thai === "HUY" && (
            <section className="card">
              <p>Lý do hủy: {bill.ly_do_huy}</p>
              <button
                className="primary"
                disabled={action.pending}
                onClick={() =>
                  run("lap_thay_the", {}, (r) =>
                    navigate(`${base}/${r.ma_hoa_don}`),
                  )
                }
              >
                Lập bản thay thế
              </button>
            </section>
          )}
          {admin && (
            <section className="card">
              <h2>Lịch sử hóa đơn</h2>
              <ul>
                {bill.history.map((h) => (
                  <li key={h.ma_lich_su_hoa_don}>
                    {h.ngay_tao} · {eventNames[h.su_kien] || h.su_kien} ·{" "}
                    {h.ho_va_ten}
                    {h.ghi_chu && ` · ${h.ghi_chu}`}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
```

## 3. `frontend/src/styles/global.css`

Thay toàn bộ nội dung file.

```css
:root {
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  color: #183c3b;
  background: #f2f5f3;
  line-height: 1.6;
  font-synthesis: none;
  font-weight: 400;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
}
a {
  color: #14635a;
  text-underline-offset: 3px;
}
button,
input,
textarea,
select {
  font: inherit;
}
button,
.button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 9px 16px;
  border: 1px solid #b7c9c3;
  border-radius: 8px;
  background: white;
  color: #224b44;
  cursor: pointer;
  text-decoration: none;
  font-weight: 600;
  line-height: 1.4;
}
button:hover,
.button:hover {
  background: #edf5f0;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.primary {
  background: #14635a;
  color: white;
  border-color: #14635a;
}
.primary:hover {
  background: #0a4c45;
}
.danger {
  color: #a33e30;
  background: #fff5f1;
  border-color: #dfb4a9;
}
:focus-visible {
  outline: 3px solid #d99b27;
  outline-offset: 3px;
}
input,
select,
textarea {
  width: 100%;
  padding: 10px 12px;
  min-height: 44px;
  border: 1px solid #b6c6c0;
  border-radius: 6px;
  color: #183c3b;
  background: #fff;
  max-width: 100%;
}
textarea {
  resize: vertical;
}
input[type="checkbox"] {
  width: 20px;
  min-height: 20px;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 4vw;
  border-bottom: 1px solid #dce5df;
  background: white;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  text-decoration: none;
  line-height: 1.4;
}
.brand-icon {
  background: #14635a;
  color: white;
  border-radius: 10px;
  padding: 10px;
  font-size: 18px;
}
.brand small {
  display: block;
  letter-spacing: 1.7px;
  font-size: 9px;
  color: #627c73;
}
.top-links {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
}
.top-links > a {
  text-decoration: none;
}
.workspace {
  display: grid;
  grid-template-columns: 225px minmax(0, 1fr);
  min-height: 80vh;
  max-width: 1600px;
  margin: auto;
}
.sidebar {
  padding: 30px 18px;
  border-right: 1px solid #dce5df;
  background: #fff;
}
.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.sidebar nav a {
  display: block;
  padding: 12px 14px;
  border-radius: 7px;
  text-decoration: none;
  color: #47645b;
}
.sidebar nav a.active {
  background: #e3f0e8;
  color: #13584a;
  font-weight: 700;
}
.public-link {
  display: block;
  margin: 30px 14px;
}
.workspace main {
  padding: 32px;
  min-width: 0;
}
.public-space {
  max-width: 1120px;
  margin: auto;
  padding: 40px 24px;
  min-height: 76vh;
}
h1 {
  font-size: 30px;
  line-height: 1.25;
  margin: 5px 0 24px;
  letter-spacing: -0.7px;
}
h2 {
  font-size: 19px;
  line-height: 1.4;
  margin: 0 0 16px;
}
h3 {
  font-size: 15px;
  margin: 24px 0 12px;
}
p {
  margin: 8px 0 18px;
}
small {
  font-size: 12px;
}
.eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.4px;
  color: #648379;
  margin-bottom: 8px;
}
.card {
  border: 1px solid #dbe5de;
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px #294d3a04;
}
.narrow {
  max-width: 650px;
  margin: 0 auto 24px;
}
.muted,
.note {
  color: #637b72;
}
.note {
  font-size: 13px;
  margin: 24px 0;
}
.hero {
  padding: 35px 0 50px;
  max-width: 800px;
}
.hero h1 {
  font-size: clamp(36px, 5vw, 56px);
  line-height: 1.15;
  letter-spacing: -1.5px;
  margin: 18px 0 24px;
}
.hero p:not(.eyebrow) {
  max-width: 610px;
  color: #60776f;
  font-size: 18px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.hero .actions {
  margin-top: 30px;
}
.three-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.step {
  display: block;
  color: #93aa9f;
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 24px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
  font-size: 14px;
}
.card fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
.field > span,
.field > label {
  font-weight: 600;
}
.field small {
  color: #6d7e77;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.full {
  width: 100%;
  margin-top: 20px;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 18px 0;
}
.error {
  padding: 12px 14px;
  background: #fff2ed;
  color: #9a3428;
  border: 1px solid #efc4b8;
  border-radius: 8px;
  font-size: 14px;
  margin: 15px 0;
  overflow-wrap: anywhere;
}
.error ul {
  padding-left: 20px;
  margin-bottom: 0;
}
.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.page-heading h1,
.page-heading h2 {
  margin-bottom: 0;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin: 28px 0;
}
.stat {
  text-decoration: none;
  color: inherit;
}
.stat span {
  font-size: 13px;
  color: #637b72;
}
.stat strong {
  display: block;
  font-size: 40px;
  font-weight: 650;
  line-height: 1.6;
}
.stat small {
  color: #14635a;
}
.table-wrap {
  overflow: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}
th {
  font-size: 11px;
  color: #698176;
  background: #f5f8f5;
  font-weight: 600;
  white-space: nowrap;
}
th,
td {
  padding: 14px 12px;
  border-bottom: 1px solid #edf1ed;
}
td:first-child {
  min-width: 220px;
}
td a {
  font-weight: 650;
  text-decoration: none;
}
td small {
  display: block;
  color: #71857c;
  margin-top: 5px;
}
td:last-child {
  white-space: nowrap;
  color: #698176;
}
.badge {
  display: inline-block;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  background: #edf1ef;
  color: #52665b;
}
.status-MOI {
  background: #e6efff;
  color: #365c9b;
}
.status-DA_PHAN_CONG {
  background: #e8e7ff;
  color: #5c519b;
}
.status-DANG_XU_LY {
  background: #fff1d9;
  color: #9a6c18;
}
.status-DA_XU_LY {
  background: #e4f3f5;
  color: #2c737e;
}
.status-DA_DONG {
  background: #e3f3e8;
  color: #2c7351;
}
.status-TU_CHOI {
  background: #f9e8e2;
  color: #ad5244;
}
.filters {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 8px;
}
.pagination {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  margin-top: 20px;
}
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(280px, 1fr);
  gap: 24px;
}
.action-panel {
  align-self: start;
}
.tags {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #667e73;
  margin-bottom: 20px;
}
.metadata {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 8px;
  font-size: 13px;
  border-top: 1px solid #e3eae4;
  padding-top: 20px;
}
.metadata dt {
  color: #74897f;
}
.metadata dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.pre-wrap {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.image-grid img {
  width: 120px;
  height: 110px;
  object-fit: cover;
  border-radius: 7px;
  border: 1px solid #dce6de;
  max-width: 100%;
}
.timeline {
  list-style: none;
  padding: 0 0 0 18px;
  border-left: 2px solid #e0e9e1;
  margin-left: 5px;
}
.timeline li {
  position: relative;
  padding: 0 0 26px;
}
.timeline li:before {
  content: "";
  position: absolute;
  left: -25px;
  top: 7px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #73a38c;
  border: 2px solid white;
}
.timeline li > div {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.timeline time {
  font-size: 11px;
  color: #75877e;
}
.timeline p {
  font-size: 13px;
  margin: 8px 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.timeline small {
  color: #75877e;
}
.location-list {
  list-style: none;
  padding: 0;
}
.location-list li {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 6px;
  border-top: 1px solid #e3ebe4;
  padding: 18px 0;
}
.location-list small {
  color: #71857c;
}
.location-list button {
  font-size: 12px;
  padding: 7px 10px;
}
.qr-print {
  text-align: center;
}
.qr-image {
  max-width: 100%;
  width: 280px;
  aspect-ratio: 1;
}
.qr-url {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.qr-print .actions {
  justify-content: center;
}
.qr-print .muted {
  font-size: 12px;
  margin-top: 24px;
}
.decision {
  border-top: 1px solid #e0e8e1;
  margin-top: 22px;
}
.empty {
  padding: 32px;
  text-align: center;
  color: #71857c;
}
.back {
  display: inline-block;
  font-size: 13px;
  margin-bottom: 20px;
}
.lookup-result {
  border-top: 1px solid #e0e8e1;
  margin-top: 26px;
  padding-top: 24px;
}
.lookup-result .timeline {
  margin-top: 24px;
}
hr {
  border: 0;
  border-top: 1px solid #dce5df;
  margin: 25px 0;
}
#qr-reader {
  margin-bottom: 20px;
  overflow: hidden;
}
footer {
  font-size: 11px;
  text-align: center;
  color: #7c9085;
  border-top: 1px solid #dce5df;
  padding: 24px;
}
/* Invoice quantities use Vietnamese separators and align with their prices. */
.bill-lines th:nth-child(2),
.bill-lines th:nth-child(4),
.bill-lines th:nth-child(5),
.bill-number {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.bill-lines .bill-line-total {
  color: #183c3b;
  font-weight: 600;
}
.bill-total {
  margin: 0;
  padding-top: 22px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.bank-picker {
  padding: 18px;
  margin-bottom: 18px;
  border: 1px solid #dce8e2;
  border-radius: 10px;
  background: #f7faf8;
}
.bank-picker select {
  text-overflow: ellipsis;
}
.bank-selection {
  margin: 0;
  font-size: 13px;
  color: #47645b;
}
.bill-publish > .muted {
  font-size: 14px;
  margin-bottom: 24px;
}
.payment-card {
  padding: 0;
  overflow: hidden;
}
.payment-header {
  padding: 28px 24px 24px;
  text-align: center;
  border-bottom: 1px solid #dce8e2;
  background: linear-gradient(135deg, #f2f8f4, #eaf4ef);
}
.payment-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  background: #fff5da;
  color: #805800;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 14px;
}
.payment-header h2 {
  font-size: 24px;
  margin-bottom: 8px;
}
.payment-header p {
  color: #537168;
  margin: 0;
  font-size: 14px;
}
.payment-body {
  max-width: 720px;
  margin: 0 auto;
  padding: 28px 24px;
  text-align: center;
}
.payment-amount-label {
  margin: 0 0 4px;
  color: #637b72;
  font-size: 13px;
}
.payment-amount {
  margin: 0 0 24px;
  font-size: clamp(26px, 4vw, 36px);
  font-weight: 750;
  line-height: 1.3;
  color: #13584a;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.payment-qr-frame {
  width: min(340px, 100%);
  margin: 0 auto;
  padding: 16px;
  border: 1px solid #d4e1d9;
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 24px #1a4d3a0a;
}
.payment-qr-brand {
  display: block;
  font-size: 18px;
  letter-spacing: 2px;
  font-weight: 800;
  color: #164e57;
}
.payment-qr-frame img {
  display: block;
  width: 100%;
  max-width: 320px;
  height: auto;
  aspect-ratio: 1;
  margin: 8px auto;
}
.payment-qr-caption {
  display: block;
  font-size: 12px;
  color: #637b72;
}
.payment-details {
  margin: 28px auto 20px;
  max-width: 560px;
  text-align: left;
  font-size: 14px;
}
.payment-details > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #edf1ed;
}
.payment-details dt {
  color: #637b72;
}
.payment-details dd {
  margin: 0;
  text-align: right;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.payment-account {
  font-size: 17px;
  letter-spacing: 0.4px;
  font-variant-numeric: tabular-nums;
}
.payment-details .payment-reference {
  margin-top: 6px;
  padding: 14px 12px;
  border: 1px solid #d8e6dd;
  border-radius: 8px;
  background: #f2f8f4;
}
.payment-download {
  min-width: 180px;
}
.payment-notice {
  max-width: 500px;
  margin: 20px auto 0;
  font-size: 13px;
  color: #637b72;
}
@media (max-width: 1000px) {
  .workspace {
    grid-template-columns: 185px minmax(0, 1fr);
  }
  .workspace main {
    padding: 24px 20px;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 650px) {
  .topbar {
    padding: 12px 16px;
    align-items: start;
  }
  .brand {
    font-size: 12px;
    gap: 8px;
  }
  .brand-icon {
    padding: 8px;
    font-size: 13px;
  }
  .top-links {
    gap: 8px;
    flex-wrap: wrap;
    justify-content: end;
    font-size: 12px;
    max-width: 55%;
  }
  .top-links .button,
  .top-links button {
    font-size: 11px;
    padding: 8px;
  }
  .workspace {
    display: block;
  }
  .sidebar {
    padding: 12px 16px;
    border-right: 0;
    border-bottom: 1px solid #dce5df;
  }
  .sidebar .eyebrow {
    display: none;
  }
  .sidebar nav {
    flex-direction: row;
    overflow: auto;
  }
  .sidebar nav a {
    font-size: 12px;
    white-space: nowrap;
    padding: 10px;
  }
  .public-link {
    display: none;
  }
  .workspace main {
    padding: 24px 16px;
  }
  .public-space {
    padding: 28px 16px;
  }
  .three-columns {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .hero {
    padding-top: 10px;
  }
  .card {
    padding: 20px;
  }
  .payment-card {
    padding: 0;
  }
  .payment-body {
    padding: 24px 18px;
  }
  .payment-header {
    padding: 24px 18px 20px;
  }
  .payment-header h2 {
    font-size: 21px;
  }
  .payment-details {
    font-size: 13px;
  }
  .payment-details > div {
    gap: 10px;
  }
  .bank-picker {
    padding: 14px;
  }
  .filters {
    grid-template-columns: 1fr;
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .page-heading {
    align-items: start;
    flex-direction: column;
  }
  h1 {
    font-size: 25px;
  }
  .stats {
    gap: 10px;
  }
  .stat {
    padding: 16px;
  }
  .stat strong {
    font-size: 32px;
  }
  .metadata {
    grid-template-columns: 115px 1fr;
  }
  .pagination {
    flex-wrap: wrap;
  }
  .pagination span {
    order: 3;
    width: 100%;
    text-align: center;
  }
  .image-grid img {
    width: 100px;
    height: 90px;
  }
}
@media print {
  body {
    background: white;
  }
  .topbar,
  .sidebar,
  footer,
  .no-print,
  .page-heading {
    display: none !important;
  }
  .workspace,
  .detail-grid {
    display: block;
  }
  .workspace main {
    padding: 0;
  }
  .qr-print {
    border: 0;
    box-shadow: none;
    margin: 0;
  }
  .qr-print .muted {
    display: none;
  }
}
```

## Chạy và thử

Nếu frontend đang chạy, đợi Vite cập nhật rồi tải lại trang (Ctrl+F5). Nếu cần khởi động lại, mở terminal tại thư mục gốc dự án:

```powershell
npm run dev:frontend:https
```

Giữ backend đang chạy. Nếu backend chưa chạy, mở terminal khác:

```powershell
npm run dev:backend
```

1. Mở hóa đơn: kiểm tra từng dòng phí xe và đơn vị. Một xe phải hiện **1** ở cột số lượng. Đơn giá có dấu chấm hàng nghìn; số lượng có số lẻ dùng dấu phẩy.
2. Nếu nháp chưa cập nhật đăng ký xe, bấm **Tính lại bản nháp**. Số lượng tính tại ngày chốt, không phải tổng số xe hiện có trong mọi thời điểm.
3. Sau khi duyệt: tại **Gửi hóa đơn cho cư dân**, tìm tên rồi chọn ngân hàng. Điền tài khoản/tên người nhận và gửi. Không có ô nhập BIN thủ công.
4. Mở hóa đơn đã gửi bằng BQL hoặc cư dân: QR nằm giữa thẻ thanh toán; đối chiếu tên ngân hàng, tài khoản, tổng và nội dung trước khi chuyển tiền. Có thể bấm **Tải mã QR** để lưu ảnh.

Đã kiểm tra luồng thực qua database ở màn hình 1440px và 375px với 1 ô tô, 2 xe máy, 3 xe đạp, xe đã kết thúc và xe đăng ký sau ngày chốt; kiểm tra cả nước có số lẻ, chọn ngân hàng, QR/tổng tiền và ghi nhận đã thu. Build frontend thành công. Việc chuyển tiền thực tế vẫn cần đối soát ngân hàng.
