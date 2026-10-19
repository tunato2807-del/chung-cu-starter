import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getJson } from "../../shared/api/client.js";
import { newRequestKey } from "../../shared/request-key.js";
import { useAuth } from "../auth/Auth.jsx";
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
  return (
    <>
      <section className="hero">
        <p className="eyebrow">CỔNG DỊCH VỤ CHUNG CƯ</p>
        <h1>
          Một phản ánh.
          <br />
          Một không gian sống tốt hơn.
        </h1>
        <p>
          Gửi sự cố ngay tại vị trí, theo dõi tiến độ xử lý và kết nối với Ban
          quản lý.
        </p>
        <div className="actions">
          <Link className="button primary" to="/quet-qr">
            Quét QR để phản ánh
          </Link>
          <Link className="button" to="/tra-cuu">
            Tra cứu tiến độ
          </Link>
        </div>
      </section>
      <div className="three-columns">
        {[
          [
            "01",
            "Quét mã tại vị trí",
            "Dùng camera điện thoại quét mã QR tại khu vực hoặc thiết bị.",
          ],
          [
            "02",
            "Mô tả sự cố",
            "Chọn loại sự cố, nhập thông tin liên hệ và ảnh hiện trường.",
          ],
          [
            "03",
            "Theo dõi xử lý",
            "Giữ mã tra cứu riêng để theo dõi tiến độ cùng số điện thoại.",
          ],
        ].map(([n, t, d]) => (
          <article className="card" key={n}>
            <span className="step">{n}</span>
            <h2>{t}</h2>
            <p className="muted">{d}</p>
          </article>
        ))}
      </div>
      <p className="note">
        Không cần tài khoản để gửi phản ánh qua QR. Trường hợp nguy hiểm tức
        thời, hãy liên hệ trực tiếp Ban quản lý hoặc cơ quan khẩn cấp.
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
    { user } = useAuth(),
    resource = useResource(`/cong_khai/vi_tri_qr/${encodeURIComponent(token)}`);
  const [key] = useState(newRequestKey),
    [error, setError] = useState(),
    [pending, setPending] = useState(false),
    [receipt, setReceipt] = useState(),
    [confirmed, setConfirmed] = useState(false),
    [copy, setCopy] = useState("");
  if (resource.loading) return <Loading />;
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
      <p className="muted">{resource.result.data.mo_ta}</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          data.set("token_qr", token);
          data.set("khoa_yeu_cau", key);
          if (confirmed) data.set("xac_nhan_gui", "true");
          setPending(true);
          setError(null);
          try {
            setReceipt(
              (
                await getJson("/cong_khai/phan_anh", {
                  method: "POST",
                  body: data,
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
        <Field label="Loại sự cố">
          <select name="loai_su_co" required>
            <Options values={categories} />
          </select>
        </Field>
        <Field
          label="Tiêu đề"
          name="tieu_de"
          required
          minLength={3}
          maxLength={150}
          placeholder="Ví dụ: Đèn hành lang không sáng"
        />
        <Field label="Mô tả chi tiết">
          <textarea
            name="noi_dung"
            required
            minLength={10}
            maxLength={5000}
            rows={4}
          />
        </Field>
        <ImagesInput />
        <div className="form-grid">
          <Field
            label="Họ tên"
            name="ten_nguoi_gui"
            defaultValue={user?.ho_va_ten || ""}
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
          />
          <Field
            label="Số điện thoại"
            name="so_dien_thoai"
            type="tel"
            defaultValue={user?.so_dien_thoai || ""}
            required
            autoComplete="tel"
          />
        </div>
        <Field
          label="Căn hộ (tùy chọn)"
          name="can_ho_khai_bao"
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
