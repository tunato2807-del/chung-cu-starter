import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { useReportDraft } from "../../shared/use-report-draft.js";
import { useAuth } from "../auth/Auth.jsx";
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
    const url = new URL(value, window.location.origin);
    if (
      url.origin !== window.location.origin ||
      !/^\/r\/[0-9a-f-]{36}$/i.test(url.pathname)
    )
      throw new Error("Mã QR không thuộc hệ thống này.");
    navigate(url.pathname);
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
