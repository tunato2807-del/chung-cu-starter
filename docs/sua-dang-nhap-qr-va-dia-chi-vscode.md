# Sửa đăng nhập, QR cũ và địa chỉ frontend — code đầy đủ cho VS Code

Cập nhật **30/10/2026**, nhánh `codex/editorial-business-ui`. Có 9 file chạy ứng dụng cần cập nhật; mỗi file được chép đầy đủ ở cuối tài liệu này.

## 1. Vì sao cùng mạng nhưng tài khoản và QR cũ không dùng được?

- **Database:** `TAI-KHOAN.md` được tạo riêng cho database ghi ở tên bộ mẫu. Khi chạy `npm run start -w backend` ở terminal mới, backend lấy `DB_NAME` từ `.env`, trừ khi đã đặt biến môi trường trong terminal đó. Lệnh `$env:DB_NAME = ...` ở terminal hôm trước không còn tác dụng sau khi cửa sổ ấy đóng. Tài khoản của `chung_cu` và `chung_cu_nghiem_thu` có thể có cùng số điện thoại nhưng mật khẩu khác nhau; token QR cũng thuộc từng bộ.
- **Địa chỉ IP:** cùng Wi-Fi không bảo đảm máy tính luôn nhận cùng IPv4. Router có thể cấp IP khác qua DHCP. Vite cũng liệt kê cả adapter VPN/VMware; điện thoại thường cần IP Wi-Fi đang kết nối.
- **Cổng:** bản HTTP trước có thể tự chuyển từ 5173 sang 5174 nếu cổng đang bận. Bản này cố định cổng 5173 và báo lỗi khi bận.
- **QR:** ảnh đã in chứa cả địa chỉ cũ và token. Bộ quét trước đây từ chối ngay khi origin khác. Bản này nhận lại token từ URL nội bộ cũ, chỉ mở `/r/token` tại web hiện tại và vẫn để backend kiểm tra mã.
- **“Không bảo mật”:** nếu URL bắt đầu bằng HTTP thì cảnh báo này xuất hiện do chưa dùng HTTPS. Nếu đã là HTTPS mà vẫn cảnh báo, cần kiểm tra CA, IP trong chứng chỉ và hạn chứng chỉ. Cảnh báo này không tự làm đổi mật khẩu trong MySQL.

Các nguyên nhân về cấu hình trên cần đối chiếu với máy đang chạy. Chưa có URL đầy đủ/log khởi động trên máy bạn nên không kết luận rằng mọi lỗi đăng nhập đều do database.

## 2. Những file cần thay/tạo

| File | Thao tác |
| --- | --- |
| `package.json` | Thêm lệnh khởi động bộ nghiệm thu và chẩn đoán |
| `backend/src/server.js` | In rõ database và nơi lấy tài khoản khi khởi động |
| `frontend/vite.config.js` | Cố định cổng, giữ proxy API hiện tại |
| `frontend/src/shared/api/client.js` | Báo lỗi rõ khi máy chủ trả HTML/rỗng |
| `frontend/src/features/auth/Auth.jsx` | Xác minh cookie phiên trước khi vào trang đã đăng nhập |
| `frontend/src/features/incidents/PublicReports.jsx` | Dùng bộ đọc QR hỗ trợ IP nội bộ cũ |
| `frontend/src/features/qr/qr-link.js` | **Tạo mới** bộ đọc đường dẫn QR |
| `scripts/start-acceptance.js` | **Tạo mới** lệnh luôn chọn đúng database nghiệm thu |
| `scripts/diagnose-local.js` | **Tạo mới** công cụ chẩn đoán chỉ đọc |

Lưu các file đúng thư mục và đuôi `.js`/`.jsx`, không thêm `.txt`. Các file kiểm thử và báo cáo rà soát có trên GitHub, không bắt buộc chép vào máy chỉ để chạy web.

Hai dependency đã được vá riêng trong lockfile: `body-parser 2.4.0`, `multer 2.5.0`. Nếu cập nhật bằng Git, lấy cả `package-lock.json` của nhánh rồi cài theo lockfile. Nếu chép code thủ công, dừng backend/frontend của dự án rồi chạy tại gốc để cập nhật hai dependency trong range đang khai báo:

```powershell
npm update body-parser multer --ignore-scripts
npm ls body-parser multer
npm run build
```

Tại thời điểm rà soát, lệnh cập nhật chọn hai phiên bản ở trên. Nếu Windows báo `EBUSY`, lưu code, đóng các tiến trình đang giữ thư mục và thực hiện theo [hướng dẫn EBUSY](cap-nhat-can-chinh-tong-quan-vscode.md).

## 3. Chạy lại đúng bộ tài khoản trong file .md

Đầu tiên, nhấn **Ctrl+C** tại terminal backend cũ. Sau khi đã chép các file mới, chạy tại gốc dự án:

```powershell
npm run start:backend:acceptance
```

Lệnh luôn chọn `chung_cu_nghiem_thu`, kể cả terminal mới hoặc `.env` đang đặt `DB_NAME=chung_cu`. Dòng khởi động phải có:

```text
Database: "chung_cu_nghiem_thu"
Tài khoản bộ này: backend/storage/acceptance/chung_cu_nghiem_thu/TAI-KHOAN.md
```

Nếu dùng bộ khác như `chung_cu_nghiem_thu_b2`:

```powershell
npm run start:backend:acceptance -- chung_cu_nghiem_thu_b2
```

Lấy tài khoản từ thư mục **cùng tên database**. Ở trang đăng nhập, dùng định danh tại cột **Định danh**, mật khẩu tại cột **Mật khẩu** của dòng BQL và chọn **Tài khoản cá nhân / Ban quản lý** hoặc **Tự nhận diện**. Tài khoản bị khóa hoặc đang trong thời gian khóa tạm vẫn cần xử lý theo trạng thái thực tế.

Khi đang sửa backend, thay `start:backend:acceptance` bằng `dev:backend:acceptance` để tự khởi động lại khi lưu file.

Để dùng database làm việc từ `.env`: dừng backend, chạy `Remove-Item Env:DB_NAME -ErrorAction SilentlyContinue`, rồi `npm run dev:backend`. Tài khoản demo tương ứng nằm trong `backend/.demo-credentials`. Đăng xuất/đăng nhập lại khi đổi bộ dữ liệu.

## 4. Mở frontend HTTPS và QR

Ở terminal thứ hai:

```powershell
npm run dev:frontend:https
```

Mở `https://localhost:5173/` trên máy tính. Trên điện thoại cùng Wi-Fi, mở `https://IP-WIFI-HIEN-TAI:5173/`. Dùng `ipconfig` để lấy IPv4 của adapter Wi-Fi đang kết nối. Nếu đổi IP, tạo lại chứng chỉ có IP mới và khởi động lại frontend theo [hướng dẫn HTTPS](https-local.md).

**Để dùng ảnh QR đã in chứa IP cũ:** mở trang `/quet-qr` ở địa chỉ hiện tại, rồi dùng camera trong trang để quét ảnh cũ hoặc dán URL cũ vào ô liên kết. Bộ quét giữ token và kiểm tra nó trên backend hiện tại. QR đã thu hồi, ngừng sử dụng hoặc thuộc database khác vẫn bị từ chối.

Nếu dùng ứng dụng Camera ngoài web để quét, nó mở nguyên URL cũ trong ảnh. Khi IP cũ không còn đến được máy tính, code của web chưa thể chạy để chuyển hướng. Khi đó dùng bộ quét trong trang hiện tại hoặc in lại ảnh QR. Để giữ URL đã in ổn định lâu dài, cấu hình DHCP reservation cho máy tính trên router, hoặc dùng một hostname/tên miền ổn định đã cấu hình DNS và chứng chỉ phù hợp.

## 5. Chẩn đoán nếu vẫn không đăng nhập được

Giữ backend chạy; tại terminal mới ở gốc dự án:

```powershell
npm run diagnose
```

Để đối chiếu một QR cũ, thay liên kết ví dụ bằng liên kết bạn có:

```powershell
npm run diagnose -- --qr "https://IP-CU:5173/r/UUID-CUA-MA"
```

Công cụ cho biết:

- `health`/`ready` của API loopback, cấu hình cookie có yêu cầu HTTPS không.
- Database đang cấu hình trong **terminal chẩn đoán**; đối chiếu với dòng `Database` ở **terminal backend** vì hai terminal có thể đặt biến khác nhau.
- Số tài khoản BQL có thể đăng nhập/đang khóa tạm và số QR đang hoạt động trong các database liên quan mà tài khoản MySQL có quyền đọc.
- QR được kiểm tra có thuộc database nào, còn hoạt động hay không.
- Đường dẫn file tài khoản tương ứng có tồn tại không, địa chỉ IPv4 của các adapter, IP có trong chứng chỉ phát triển hay không.

Công cụ chỉ thực hiện SELECT và đọc chứng chỉ công khai `dev-cert.pem`; không đọc file mật khẩu/khóa riêng, không thử đăng nhập, không tăng số lần nhập sai, không cấp lại mật khẩu và không thay token. Nếu cần hỗ trợ tiếp, gửi kết quả chẩn đoán và URL trên trình duyệt; không gửi file tài khoản hoặc mật khẩu.

## 6. Rà soát và kiểm chứng

Xem [báo cáo rà soát theo agent-skills](ra-soat-du-an-2026-10-30.md) để biết phạm vi, ca tái hiện, kết quả kiểm thử và các giới hạn còn lại.

## 7. Mã nguồn đầy đủ từng file


### `package.json`

```json
{
  "name": "chung-cu-starter",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "dev:frontend": "npm run dev -w frontend",
    "dev:backend": "npm run dev -w backend",
    "start:backend:acceptance": "node --env-file-if-exists=.env scripts/start-acceptance.js",
    "dev:backend:acceptance": "node --env-file-if-exists=.env --watch scripts/start-acceptance.js",
    "diagnose": "node --env-file-if-exists=.env scripts/diagnose-local.js",
    "build": "npm run build -w frontend",
    "init:local": "node scripts/init-local.js",
    "db:up": "docker compose up -d --wait",
    "db:migrate": "npm run db:migrate -w backend",
    "db:seed": "npm run db:seed -w backend",
    "test": "node scripts/test-local.js",
    "test:e2e": "node scripts/test-local.js e2e",
    "format": "prettier --write \"backend/**/*.js\" \"frontend/src/**/*.{js,jsx,css}\" \"scripts/*.js\" \"e2e/*.js\" playwright.config.js",
    "dev:frontend:https": "npm run dev:https -w frontend",
    "test:https": "node scripts/test-https.js"
  },
  "type": "module",
  "devDependencies": {
    "@playwright/test": "^1.64.1",
    "@sparticuz/chromium": "^153.0.0",
    "prettier": "^3.6.2"
  }
}
```

### `backend/src/server.js`

```js
import { app } from "./app.js";
import { pool } from "./lib/db.js";
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  throw new Error(
    "JWT_SECRET must contain at least 32 characters. Run npm run init:local.",
  );
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, "127.0.0.1", () => {
  console.log(`API: http://127.0.0.1:${port}/api/health`);
  const database = process.env.DB_NAME || "chung_cu";
  console.log(`Database: ${JSON.stringify(database)}`);
  if (/^chung_cu_nghiem_thu(?:_[a-z0-9]{1,20})?$/.test(database))
    console.log(
      `Tài khoản bộ này: backend/storage/acceptance/${database}/TAI-KHOAN.md`,
    );
  else if (database === "chung_cu")
    console.log(
      "Tài khoản demo: backend/.demo-credentials (khác tài khoản nghiệm thu).",
    );
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  });
```

### `frontend/vite.config.js`

```js
import { defineConfig } from "vite";
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": process.env.API_TARGET || "http://127.0.0.1:3000",
    },
  },
});
```

### `frontend/src/shared/api/client.js`

```js
export async function getJson(path, options = {}) {
  const headers = { "X-App-Request": "1", ...options.headers };
  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers,
      body,
      credentials: "same-origin",
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Không kết nối được máy chủ. Thông tin trong biểu mẫu vẫn được giữ lại.",
    );
  }
  let result;
  try {
    result = await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw Object.assign(
      new Error(
        `Máy chủ chưa trả được phản hồi hợp lệ (HTTP ${response.status}). Vui lòng thử lại sau.`,
      ),
      { status: response.status, code: "API_RESPONSE_INVALID" },
    );
  }
  if (!result || typeof result !== "object" || Array.isArray(result))
    throw Object.assign(
      new Error("Phản hồi từ máy chủ không hợp lệ. Vui lòng tải lại trang."),
      {
        status: response.status,
        code: "API_RESPONSE_INVALID",
      },
    );
  if (!response.ok) {
    const error = new Error(
      result.error?.message || `Yêu cầu thất bại (${response.status})`,
    );
    Object.assign(error, result.error, { status: response.status });
    throw error;
  }
  return result;
}
```

### `frontend/src/features/auth/Auth.jsx`

```jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import Icon from "../../shared/Icon.jsx";
import PhotoCarousel from "../../shared/PhotoCarousel.jsx";
import { serviceDestination } from "../incidents/portal-services.js";
import {
  ErrorBox,
  Field,
  Loading,
  homeFor,
  roleNames,
} from "../../shared/ui.jsx";
const Context = createContext(null);
export const useAuth = () => useContext(Context);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    getJson("/xac_thuc/toi")
      .then((r) => setUser(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const logout = async () => {
    await getJson("/xac_thuc/dang_xuat", { method: "POST" });
    setUser(null);
  };
  return (
    <Context.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </Context.Provider>
  );
}
export function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/dang-nhap" replace />;
  if (roles && !roles.includes(user.vai_tro))
    return (
      <div className="card">
        <h1>Bạn không có quyền mở trang này</h1>
        <Link to={homeFor(user)}>Về không gian của tôi</Link>
      </div>
    );
  return children;
}
export function Login() {
  const { user, setUser } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [error, setError] = useState(),
    [pending, setPending] = useState(false),
    [showPassword, setShowPassword] = useState(false);
  if (user)
    return (
      <Navigate
        to={serviceDestination(user, location.state?.service) || homeFor(user)}
        replace
      />
    );
  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <span className="auth-story-label">
          <Icon name="building" size={18} />
          Không gian sống, kết nối mỗi ngày
        </span>
        <h2>
          Dịch vụ tòa nhà,
          <br />
          trong tầm tay bạn.
        </h2>
        <p>
          Theo dõi hóa đơn, gửi phản ánh và sử dụng dịch vụ chung cư ngay trong
          tài khoản của bạn.
        </p>
        <PhotoCarousel variant="auth" />
        <div className="auth-trust">
          <Icon name="shield" />
          <span>Thông tin và dịch vụ theo tài khoản được cấp.</span>
        </div>
      </aside>
      <section className="card auth-form">
        <p className="eyebrow">Chào mừng bạn trở lại</p>
        <h1>Đăng nhập</h1>
        <p className="muted">Sử dụng tài khoản do Ban quản lý cấp.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            setError(null);
            try {
              const result = await getJson("/xac_thuc/dang_nhap", {
                method: "POST",
                body: Object.fromEntries(new FormData(e.currentTarget)),
              });
              let session;
              try {
                session = await getJson("/xac_thuc/toi");
              } catch (sessionError) {
                if (sessionError.status !== 401) throw sessionError;
                throw new Error(
                  "Trình duyệt chưa lưu được phiên đăng nhập. Hãy mở đúng địa chỉ web, kiểm tra quyền cookie và dùng HTTPS, rồi thử lại.",
                );
              }
              if (
                !session.data?.ma_nguoi_dung ||
                session.data.ma_nguoi_dung !== result.data?.ma_nguoi_dung
              )
                throw new Error(
                  "Không duy trì được phiên đăng nhập. Vui lòng đăng nhập lại tại cùng địa chỉ web.",
                );
              setUser(session.data);
              navigate(
                serviceDestination(session.data, location.state?.service) ||
                  homeFor(session.data),
              );
            } catch (err) {
              setError(err);
            } finally {
              setPending(false);
            }
          }}
        >
          <Field
            label="Số điện thoại hoặc tài khoản căn hộ"
            name="so_dien_thoai"
            type="text"
            required
            autoComplete="username"
          />
          <Field label="Loại tài khoản">
            <select name="loai_tai_khoan" defaultValue="TU_DONG">
              <option value="TU_DONG">Tự nhận diện</option>
              <option value="CAN_HO">Tài khoản căn hộ</option>
              <option value="CA_NHAN">Tài khoản cá nhân / Ban quản lý</option>
            </select>
          </Field>
          <details className="login-help">
            <summary>Dùng số điện thoại hay mã căn hộ?</summary>
            <p>
              Tài khoản căn hộ dùng số điện thoại của chủ hộ phụ trách hiện tại
              hoặc mã CH. Nếu số điện thoại dùng chung với tài khoản cá nhân,
              chọn loại tài khoản phù hợp.
            </p>
          </details>
          <div className="password-field">
            <Field
              label="Mật khẩu"
              name="mat_khau"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              <Icon name={showPassword ? "eyeOff" : "eye"} />
            </button>
          </div>
          <ErrorBox error={error} />
          <button className="primary auth-submit" disabled={pending}>
            {pending ? "Đang đăng nhập…" : "Đăng nhập"}
            <Icon name="arrow" size={18} />
          </button>
        </form>
        <p className="muted">
          Chưa có tài khoản hoặc quên mật khẩu? Liên hệ Ban quản lý để được xác
          minh.
        </p>
        <Link to="/">Về cổng dịch vụ</Link>
      </section>
    </div>
  );
}
export function Account() {
  const { user, setUser } = useAuth();
  const [error, setError] = useState(),
    [pending, setPending] = useState(false),
    [done, setDone] = useState(false);
  if (done)
    return (
      <div className="card">
        <h1>Đã đổi mật khẩu</h1>
        <p>Tất cả phiên cũ đã kết thúc.</p>
        <Link to="/dang-nhap" onClick={() => setUser(null)}>
          Đăng nhập lại
        </Link>
      </div>
    );
  return (
    <section className="card narrow">
      <h1>Tài khoản</h1>
      <p>
        {user.ho_va_ten} · {roleNames[user.vai_tro]}
      </p>
      <p>{user.ten_dang_nhap || user.so_dien_thoai}</p>
      {user.ma_can_ho_thanh_toan && (
        <p>
          Số điện thoại đăng nhập:{" "}
          {user.dien_thoai_dang_nhap || "Chưa gắn chủ hộ"}
        </p>
      )}
      <h2>Đổi mật khẩu</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          setError(null);
          if (form.get("mat_khau_moi") !== form.get("xac_nhan")) {
            setError(new Error("Mật khẩu xác nhận không khớp."));
            return;
          }
          setPending(true);
          try {
            await getJson("/xac_thuc/doi_mat_khau", {
              method: "POST",
              body: Object.fromEntries(form),
            });
            setDone(true);
          } catch (err) {
            setError(err);
          } finally {
            setPending(false);
          }
        }}
      >
        <Field
          label="Mật khẩu hiện tại"
          name="mat_khau_cu"
          type="password"
          required
          autoComplete="current-password"
        />
        <Field
          label="Mật khẩu mới (ít nhất 10 ký tự)"
          name="mat_khau_moi"
          type="password"
          minLength={10}
          required
          autoComplete="new-password"
        />
        <Field
          label="Nhập lại mật khẩu mới"
          name="xac_nhan"
          type="password"
          minLength={10}
          required
          autoComplete="new-password"
        />
        <ErrorBox error={error} />
        <button className="primary" disabled={pending}>
          Đổi mật khẩu và kết thúc mọi phiên
        </button>
      </form>
    </section>
  );
}
```

### `frontend/src/features/incidents/PublicReports.jsx`

```jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { useReportDraft } from "../../shared/use-report-draft.js";
import { useAuth } from "../auth/Auth.jsx";
import { reportPathFromQr } from "../qr/qr-link.js";
import Icon from "../../shared/Icon.jsx";
import PhotoCarousel from "../../shared/PhotoCarousel.jsx";
import {
  filterServices,
  portalServices,
  serviceCategories,
} from "./portal-services.js";
import {
  Badge,
  categories,
  ErrorBox,
  Field,
  ImagesInput,
  Loading,
  Options,
  Timeline,
  useResource,
} from "../../shared/ui.jsx";
export function Portal() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const catalog = useRef(null);
  const services = portalServices(user);
  const results = filterServices(services, query, category);
  const technician = user?.vai_tro === "KY_THUAT_VIEN";
  const suggestions = technician
    ? ["Công việc", "Bảo trì", "Phản ánh"]
    : ["Hóa đơn", "Đặt lịch", "Phản ánh"];
  const categories = serviceCategories.filter(
    ([id]) =>
      id === "all" || services.some((service) => service.category === id),
  );
  function showCatalog(event) {
    event.preventDefault();
    catalog.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }
  return (
    <>
      <section className="portal-hero">
        <div className="hero">
          <p className="eyebrow">Dịch vụ dành cho cư dân</p>
          <h1>
            Bạn cần hỗ trợ
            <br />
            điều gì hôm nay?
          </h1>
          <p>
            {technician
              ? "Phản ánh sự cố, theo dõi công việc và bảo trì thiết bị. Tìm đúng dịch vụ và bắt đầu ngay tại đây."
              : "Phản ánh sự cố, thanh toán hóa đơn hay đặt lịch tiện ích. Tìm đúng dịch vụ và bắt đầu ngay tại đây."}
          </p>
          <form
            className="catalog-search"
            role="search"
            aria-label="Tìm dịch vụ cư dân"
            onSubmit={showCatalog}
          >
            <label className="sr-only" htmlFor="service-search">
              Tìm dịch vụ
            </label>
            <Icon name="search" size={22} />
            <input
              id="service-search"
              type="search"
              autoComplete="off"
              maxLength={80}
              placeholder="Bạn đang tìm dịch vụ gì?"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCategory("all");
              }}
            />
            <button type="submit">
              Tìm kiếm
              <Icon name="arrow" size={18} />
            </button>
          </form>
          <div className="hero-suggestions">
            <span>Thường dùng:</span>
            {suggestions.map((label) => (
              <button
                key={label}
                type="button"
                onClick={(event) => {
                  setQuery(label);
                  setCategory("all");
                  showCatalog(event);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <Link className="hero-qr-link" to="/quet-qr">
            <Icon name="qr" size={18} />
            Quét QR để phản ánh
            <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="portal-illustration">
          <PhotoCarousel />
        </div>
      </section>
      <section
        className="service-catalog"
        aria-labelledby="catalog-title"
        id="dich-vu"
        ref={catalog}
      >
        <div className="catalog-heading">
          <div>
            <h2 id="catalog-title">Chọn dịch vụ bạn cần</h2>
            <p>Thông tin rõ ràng, thao tác ngay khi cần.</p>
          </div>
          <span role="status" aria-live="polite">
            {results.length} dịch vụ
            {query.trim() ? ` cho “${query.trim()}”` : ""}
          </span>
        </div>
        <div
          className="catalog-categories"
          role="group"
          aria-label="Danh mục dịch vụ"
        >
          {categories.map(([id, label]) => (
            <button
              type="button"
              key={id}
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {results.length ? (
          <ul className="service-grid" aria-label="Danh sách dịch vụ">
            {results.map((service) => {
              const needsLogin = !user && !service.access;
              return (
                <li key={service.id}>
                  <Link
                    className="service-card"
                    aria-label={service.title}
                    to={needsLogin ? "/dang-nhap" : service.path}
                    state={needsLogin ? { service: service.id } : undefined}
                  >
                    <div
                      className={`service-card-top service-tone-${service.category}`}
                    >
                      <span className="service-symbol">
                        <Icon name={service.icon} size={24} />
                      </span>
                      <span>
                        {
                          serviceCategories.find(
                            ([id]) => id === service.category,
                          )?.[1]
                        }
                      </span>
                    </div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <div className="service-card-bottom">
                      <span>
                        {service.access ||
                          (needsLogin ? "Đăng nhập để sử dụng" : "Mở dịch vụ")}
                      </span>
                      <Icon name="arrow" size={18} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="catalog-empty">
            <Icon name="search" size={28} />
            <h3>Chưa tìm thấy dịch vụ phù hợp</h3>
            <p>
              Thử từ khóa “hóa đơn”, “đặt lịch” hoặc xem lại tất cả dịch vụ.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
            >
              Xem tất cả dịch vụ
            </button>
          </div>
        )}
      </section>
      <section className="portal-how" aria-labelledby="how-title">
        <div>
          <p className="eyebrow">Khi có sự cố tại tòa nhà</p>
          <h2 id="how-title">
            Phản ánh dễ dàng.
            <br />
            Theo dõi rõ ràng.
          </h2>
          <p>
            Không cần đăng nhập để gửi phản ánh qua QR. Mã tra cứu riêng giúp
            bạn theo dõi từng bước xử lý.
          </p>
          <Link to="/tra-cuu">
            Tôi đã gửi phản ánh
            <Icon name="arrow" size={16} />
          </Link>
        </div>
        <ol className="portal-steps">
          {[
            [
              "Quét mã tại vị trí",
              "Mở camera điện thoại và quét QR tại khu vực hoặc thiết bị.",
            ],
            [
              "Mô tả và gửi ảnh",
              "Chọn loại sự cố, nhập thông tin liên hệ và thêm ảnh hiện trường.",
            ],
            [
              "Theo dõi kết quả",
              "Lưu mã tra cứu, xem tiến độ và phản hồi sau khi xử lý.",
            ],
          ].map(([title, description], i) => (
            <li key={title}>
              <span aria-hidden="true">0{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <p className="portal-emergency">
        <Icon name="shield" size={18} />
        Trường hợp nguy hiểm tức thời, hãy liên hệ trực tiếp Ban quản lý hoặc cơ
        quan khẩn cấp.
      </p>
    </>
  );
}
export function Scanner() {
  const navigate = useNavigate(),
    [error, setError] = useState(),
    [running, setRunning] = useState(false);
  const scanner = useRef(),
    mounted = useRef(true);
  function open(value) {
    navigate(reportPathFromQr(value, window.location.origin));
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (scanner.current?.isScanning) scanner.current.stop().catch(() => {});
    };
  }, []);
  async function start() {
    setError(null);
    if (!window.isSecureContext) {
      setError(
        new Error(
          "Không mở được camera vì địa chỉ HTTP qua IP mạng nội bộ chưa có kết nối bảo mật. Hãy dùng HTTPS đã được thiết bị tin cậy, hoặc dùng ứng dụng Camera điện thoại quét mã QR đang hiển thị trên máy tính.",
        ),
      );
      return;
    }
    setRunning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!mounted.current) return;
      scanner.current = new Html5Qrcode("qr-reader");
      await scanner.current.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: 220 },
        (value) => {
          try {
            open(value);
          } catch (err) {
            if (mounted.current) setError(err);
          }
        },
        () => {},
      );
      if (!mounted.current && scanner.current.isScanning)
        await scanner.current.stop();
    } catch {
      if (mounted.current) {
        setRunning(false);
        setError(
          new Error(
            "Không mở được camera. Hãy cấp quyền và dùng HTTPS, hoặc quét mã bằng camera điện thoại rồi mở liên kết.",
          ),
        );
      }
    }
  }
  return (
    <section className="card narrow">
      <h1>Quét mã QR</h1>
      <p>Đưa camera hướng về mã QR của vị trí cần phản ánh.</p>
      <p className="muted">
        Mã đã in bằng địa chỉ mạng cũ sẽ được kiểm tra tại hệ thống đang mở.
      </p>
      <div id="qr-reader" />
      {!running && (
        <button className="primary" onClick={start}>
          Mở camera
        </button>
      )}
      <ErrorBox error={error} />
      <hr />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            open(new FormData(e.currentTarget).get("url"));
          } catch (err) {
            setError(err);
          }
        }}
      >
        <Field
          label="Hoặc dán liên kết QR của tòa nhà"
          name="url"
          type="text"
          required
          placeholder="/r/…"
        />
        <button>Mở biểu mẫu</button>
      </form>
    </section>
  );
}
export function SubmitReport() {
  const { token } = useParams(),
    { user, loading: authLoading } = useAuth(),
    resource = useResource(`/cong_khai/vi_tri_qr/${encodeURIComponent(token)}`);
  const form = useRef(null);
  const draft = useReportDraft(token, user?.ma_nguoi_dung);
  const [error, setError] = useState(),
    [pending, setPending] = useState(false),
    [receipt, setReceipt] = useState(),
    [confirmed, setConfirmed] = useState(false),
    [copy, setCopy] = useState("");
  if (resource.loading || authLoading) return <Loading />;
  if (resource.error)
    return (
      <div className="card">
        <h1>Không mở được vị trí</h1>
        <ErrorBox error={resource.error} />
        <Link to="/quet-qr">Quét mã khác</Link>
      </div>
    );
  if (receipt)
    return (
      <section className="card narrow">
        <p className="eyebrow">ĐÃ TIẾP NHẬN</p>
        <h1>Cảm ơn bạn đã phản ánh</h1>
        <p>Ban quản lý sẽ kiểm tra và phân công xử lý.</p>
        <Field label="Mã tra cứu riêng">
          <textarea readOnly value={receipt.ma_tra_cuu} rows={3} />
        </Field>
        <p className="muted">
          Lưu mã này và dùng cùng số điện thoại đã nhập. Không chia sẻ mã công
          khai.
        </p>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(receipt.ma_tra_cuu);
              setCopy("Đã sao chép mã.");
            } catch {
              setCopy("Hãy chọn và sao chép mã trong ô phía trên.");
            }
          }}
        >
          Sao chép mã
        </button>
        <p role="status">{copy}</p>
        <Link
          className="button primary"
          to="/tra-cuu"
          state={{ code: receipt.ma_tra_cuu }}
        >
          Tra cứu tiến độ
        </Link>
      </section>
    );
  return (
    <section className="card narrow">
      <p className="eyebrow">PHẢN ÁNH TẠI VỊ TRÍ</p>
      <h1>{resource.result.data.ten_vi_tri}</h1>
      {resource.result.data.thiet_bi && (
        <p className="note">
          Thiết bị: {resource.result.data.thiet_bi.ma_tai_san} ·{" "}
          {resource.result.data.thiet_bi.ten_thiet_bi}
        </p>
      )}
      <p className="muted">{resource.result.data.mo_ta}</p>
      {draft.restored && (
        <p className="note" role="status">
          Đã khôi phục nội dung bản nháp. Nếu trước đó đã chọn ảnh, hãy chọn lại
          ảnh trước khi gửi.
        </p>
      )}
      {draft.warning && (
        <p className="note" role="status">
          {draft.warning}
        </p>
      )}
      <form
        ref={form}
        onInput={(event) => draft.save(event.currentTarget)}
        onSubmit={async (e) => {
          e.preventDefault();
          draft.save(e.currentTarget);
          const data = new FormData(e.currentTarget);
          data.set("token_qr", token);
          if (resource.result.data.phien_ban_qr !== undefined)
            data.set("phien_ban_qr", String(resource.result.data.phien_ban_qr));
          data.set("khoa_yeu_cau", draft.requestKey);
          if (confirmed) data.set("xac_nhan_gui", "true");
          setPending(true);
          setError(null);
          try {
            const result = await getJson("/cong_khai/phan_anh", {
              method: "POST",
              body: data,
            });
            draft.clear();
            setReceipt(result.data);
          } catch (err) {
            setError(err);
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="Loại sự cố">
          <select
            name="loai_su_co"
            required
            defaultValue={draft.values.loai_su_co || "DIEN"}
          >
            <Options values={categories} />
          </select>
        </Field>
        <Field
          label="Tiêu đề"
          name="tieu_de"
          defaultValue={draft.values.tieu_de || ""}
          required
          minLength={3}
          maxLength={150}
          placeholder="Ví dụ: Đèn hành lang không sáng"
        />
        <Field label="Mô tả chi tiết">
          <textarea
            name="noi_dung"
            defaultValue={draft.values.noi_dung || ""}
            required
            minLength={10}
            maxLength={5000}
            rows={4}
          />
        </Field>
        <ImagesInput
          disabled={pending}
          onBeforeChoose={() => draft.save(form.current)}
        />
        <div className="form-grid">
          <Field
            label="Họ tên"
            name="ten_nguoi_gui"
            defaultValue={draft.values.ten_nguoi_gui ?? user?.ho_va_ten ?? ""}
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
          />
          <Field
            label="Số điện thoại"
            name="so_dien_thoai"
            type="tel"
            defaultValue={
              draft.values.so_dien_thoai ?? user?.so_dien_thoai ?? ""
            }
            required
            autoComplete="tel"
          />
        </div>
        <Field
          label="Căn hộ (tùy chọn)"
          name="can_ho_khai_bao"
          defaultValue={draft.values.can_ho_khai_bao || ""}
          maxLength={40}
        />
        <small className="muted">
          Thông tin căn hộ do người gửi khai báo, chưa được xác minh.
        </small>
        <ErrorBox error={error} />
        {error?.code === "SIMILAR_REPORT" && (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Tôi vẫn muốn gửi phản ánh riêng
          </label>
        )}
        <button
          className="primary full"
          disabled={pending || (error?.code === "SIMILAR_REPORT" && !confirmed)}
        >
          {pending ? "Đang gửi…" : "Gửi phản ánh"}
        </button>
      </form>
    </section>
  );
}
export function LookupReport({ initialCode = "" }) {
  const [result, setResult] = useState(),
    [error, setError] = useState(),
    [pending, setPending] = useState(false);
  return (
    <section className="card narrow">
      <p className="eyebrow">THEO DÕI TIẾN ĐỘ</p>
      <h1>Tra cứu phản ánh</h1>
      <p className="muted">
        Nhập mã được cấp khi gửi và số điện thoại tương ứng.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          setResult(null);
          try {
            setResult(
              (
                await getJson("/cong_khai/phan_anh/tra_cuu", {
                  method: "POST",
                  body: Object.fromEntries(new FormData(e.currentTarget)),
                })
              ).data,
            );
          } catch (err) {
            setError(err);
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="Mã tra cứu">
          <textarea
            name="ma_tra_cuu"
            defaultValue={initialCode}
            required
            minLength={64}
            maxLength={64}
            rows={3}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <Field
          label="Số điện thoại"
          name="so_dien_thoai"
          type="tel"
          required
          autoComplete="tel"
        />
        <ErrorBox error={error} />
        <button className="primary" disabled={pending}>
          {pending ? "Đang tra cứu…" : "Tra cứu"}
        </button>
      </form>
      {result && (
        <div className="lookup-result">
          <h2>{result.ten_vi_tri}</h2>
          <Badge status={result.trang_thai} />
          <Timeline items={result.lich_su} />
        </div>
      )}
    </section>
  );
}
```

### `frontend/src/features/qr/qr-link.js`

```js
function localHostname(hostname) {
  if (["localhost", "[::1]"].includes(hostname)) return true;
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return false;
  const [a, b] = hostname.split(".").map(Number);
  return (
    a === 127 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

export function reportPathFromQr(value, currentOrigin) {
  const invalid = () =>
    new Error("Mã QR không hợp lệ hoặc không thuộc hệ thống này.");
  if (typeof value !== "string" || !value.trim() || value.length > 2048)
    throw invalid();
  let url, current;
  try {
    current = new URL(currentOrigin);
    url = new URL(value.trim(), current.origin);
  } catch {
    throw invalid();
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^\/r\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(url.pathname) ||
    (url.origin !== current.origin &&
      url.hostname !== current.hostname &&
      !localHostname(url.hostname))
  )
    throw invalid();
  // Old LAN addresses are never fetched or opened. The current backend must
  // still validate the token, its active state and the selected database.
  return url.pathname;
}
```

### `scripts/start-acceptance.js`

```js
import path from "node:path";
import { fileURLToPath } from "node:url";

export function acceptanceDatabase(args) {
  const database = args[0] || "chung_cu_nghiem_thu";
  if (
    args.length > 1 ||
    !/^chung_cu_nghiem_thu(?:_[a-z0-9]{1,20})?$/.test(database)
  )
    throw new Error(
      "Dùng npm run start:backend:acceptance [-- chung_cu_nghiem_thu_<mã bộ mẫu>].",
    );
  return database;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.env.DB_NAME = acceptanceDatabase(process.argv.slice(2));
  await import("../backend/src/server.js");
}
```

### `scripts/diagnose-local.js`

```js
import { X509Certificate } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { checkApi } from "./check-local.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export function diagnosticOptions(args, port = "3000") {
  const options = { api: `http://127.0.0.1:${port}`, token: null };
  for (let i = 0; i < args.length; i += 2) {
    const value = args[i + 1];
    if (!value || !["--api", "--qr"].includes(args[i]))
      throw new Error(
        'Dùng npm run diagnose [-- --api http://127.0.0.1:3000 --qr "liên kết QR"].',
      );
    if (args[i] === "--api") options.api = value;
    else {
      const url = new URL(value, "http://localhost");
      const token = url.pathname.split("/")[2];
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        !uuid.test(token || "") ||
        url.pathname !== `/r/${token}`
      )
        throw new Error("Liên kết QR cần có dạng http(s)://địa-chỉ/r/UUID.");
      options.token = token;
    }
  }
  const api = new URL(options.api);
  if (
    !["http:", "https:"].includes(api.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(api.hostname) ||
    api.username ||
    api.password ||
    api.pathname !== "/" ||
    api.search ||
    api.hash
  )
    throw new Error("Chỉ kiểm tra API loopback của máy đang chạy lệnh.");
  return options;
}

export function credentialFile(database) {
  if (/^chung_cu_nghiem_thu(?:_[a-z0-9]{1,20})?$/.test(database))
    return `backend/storage/acceptance/${database}/TAI-KHOAN.md`;
  return database === "chung_cu" ? "backend/.demo-credentials" : null;
}

// Counts and account status only. Never read password hashes or credentials.
export async function databaseSummary(db, database, token) {
  const prefix = mysql.escapeId(database);
  const [[admin]] = await db.query(
    `SELECT COUNT(*) AS total,
      COALESCE(SUM(dang_hoat_dong=1 AND (khoa_den_luc IS NULL OR khoa_den_luc<=UTC_TIMESTAMP())),0) AS available,
      COALESCE(SUM(dang_hoat_dong=1 AND khoa_den_luc>UTC_TIMESTAMP()),0) AS temporarily_locked
      FROM ${prefix}.nguoi_dung WHERE vai_tro='QUAN_TRI_VIEN'`,
  );
  const [[qr]] = await db.query(
    `SELECT COUNT(*) AS total,COALESCE(SUM(dang_hoat_dong=1),0) AS active FROM ${prefix}.vi_tri_qr`,
  );
  let match;
  if (token) {
    const [[row]] = await db.execute(
      `SELECT COUNT(*) AS found,COALESCE(SUM(dang_hoat_dong=1),0) AS active FROM ${prefix}.vi_tri_qr WHERE token_qr=?`,
      [token],
    );
    match = { found: Number(row.found), active: Number(row.active) };
  }
  return { database, admin, qr, match };
}

async function main() {
  const options = diagnosticOptions(process.argv.slice(2), process.env.PORT);
  const selected = process.env.DB_NAME || "chung_cu";
  console.log(
    `Database cấu hình trong terminal này: ${JSON.stringify(selected)}`,
  );
  console.log(
    "Đối chiếu với dòng Database ở terminal backend; hai terminal có thể đặt DB_NAME khác nhau.",
  );
  console.log(
    `COOKIE_SECURE=${process.env.COOKIE_SECURE === "true"}; COOKIE_SECURE=true cần mở frontend qua HTTPS.`,
  );
  for (const check of await checkApi(options.api)) {
    console.log(`[${check.level.toUpperCase()}] ${check.message}`);
    if (check.level === "error") process.exitCode = 1;
  }

  let db;
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3307),
      user: process.env.DB_USER || "chung_cu",
      password: process.env.DB_PASSWORD,
      connectTimeout: 5000,
    });
    const names = [...new Set([selected, "chung_cu", "chung_cu_nghiem_thu"])];
    const [available] = await db.execute(
      `SELECT SCHEMA_NAME AS name FROM information_schema.SCHEMATA WHERE SCHEMA_NAME IN (${names.map(() => "?").join(",")})`,
      names,
    );
    if (!available.some(({ name }) => name === selected)) {
      console.log(
        "[ERROR] Database đang chọn chưa có hoặc tài khoản MySQL không có quyền đọc.",
      );
      process.exitCode = 1;
    }
    for (const { name } of available) {
      try {
        const summary = await databaseSummary(db, name, options.token);
        console.log(
          `[DB ${JSON.stringify(name)}] BQL: ${summary.admin.total} tài khoản, ${summary.admin.available} có thể đăng nhập, ${summary.admin.temporarily_locked} đang khóa tạm. QR: ${summary.qr.active}/${summary.qr.total} hoạt động.`,
        );
        if (summary.match)
          console.log(
            `[QR] ${summary.match.found ? (summary.match.active ? "Có mã đang hoạt động" : "Mã đã ngừng sử dụng") : "Không có token này"} trong ${JSON.stringify(name)}.`,
          );
        const file = credentialFile(name);
        if (file) {
          const exists = await access(path.join(root, file)).then(
            () => true,
            () => false,
          );
          console.log(
            `[FILE] ${file}: ${exists ? "có trên máy" : "chưa tìm thấy"}.`,
          );
        }
      } catch (error) {
        console.log(
          `[DB ${JSON.stringify(name)}] Chưa đọc được schema (${error.code || "DATABASE_ERROR"}); kiểm tra migration/quyền đọc.`,
        );
      }
    }
  } catch (error) {
    console.log(
      `[ERROR] Chưa kết nối được MySQL (${error.code || "DATABASE_ERROR"}). Kiểm tra dịch vụ, cổng và cấu hình kết nối.`,
    );
    process.exitCode = 1;
  } finally {
    await db?.end();
  }

  let certificate;
  try {
    certificate = new X509Certificate(
      await readFile(new URL("../.certs/dev-cert.pem", import.meta.url)),
    );
    console.log(`[TLS] Chứng chỉ phát triển hết hạn: ${certificate.validTo}.`);
  } catch {
    console.log(
      "[TLS] Chưa đọc được .certs/dev-cert.pem. Xem docs/https-local.md.",
    );
  }
  console.log(
    "Địa chỉ mạng hiện có (chọn adapter Wi-Fi đang dùng; VPN/VMware có thể không đến được từ điện thoại):",
  );
  for (const [name, addresses] of Object.entries(networkInterfaces()))
    for (const address of addresses || [])
      if (!address.internal && address.family === "IPv4")
        console.log(
          `  ${name}: https://${address.address}:5173/; ${certificate?.checkIP(address.address) ? "IP có trong chứng chỉ" : "chưa xác nhận IP trong chứng chỉ"}.`,
        );
  console.log(
    "Công cụ chỉ đọc trạng thái; không thử mật khẩu, không mở khóa tài khoản và không thay token QR.",
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
```
