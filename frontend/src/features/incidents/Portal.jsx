import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/Auth.jsx";
import Icon from "../../shared/Icon.jsx";
import PhotoCarousel from "../../shared/PhotoCarousel.jsx";
import {
  filterServices,
  portalServices,
  serviceCategories,
} from "./portal-services.js";

export default function Portal() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const catalog = useRef(null);
  const services = portalServices(user);
  const results = filterServices(services, query, category);
  const categories = serviceCategories.filter(
    ([id]) =>
      id === "all" || services.some((service) => service.category === id),
  );

  function showCatalog(event) {
    event.preventDefault();
    catalog.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }

  return (
    <div className="resident-portal">
      <section className="resident-hero" aria-labelledby="portal-title">
        <div className="resident-hero-copy">
          <p className="resident-eyebrow">
            <span />
            Cổng dịch vụ cư dân
          </p>
          <h1 id="portal-title">
            Chung cư của bạn,
            <br />
            <span>trong tầm tay.</span>
          </h1>
          <p className="resident-intro">
            Gửi phản ánh, theo dõi hóa đơn và đặt lịch tiện ích. Kết nối với Ban
            quản lý để mọi việc trong căn hộ trở nên thuận tiện hơn.
          </p>
          <div className="resident-hero-actions">
            <a className="button primary" href="#dich-vu" onClick={showCatalog}>
              Khám phá dịch vụ
              <Icon name="arrow" size={18} />
            </a>
            <Link className="button resident-secondary" to="/quet-qr">
              <Icon name="qr" size={18} />
              Gửi phản ánh
            </Link>
          </div>
          <div className="resident-hero-note">
            <Icon name="shield" size={18} />
            <span>Phản ánh qua QR. Theo dõi bằng mã tra cứu riêng.</span>
          </div>
        </div>
        <div className="resident-hero-visual">
          <PhotoCarousel />
          <Link className="resident-photo-link" to="/tra-cuu">
            <span className="resident-photo-icon">
              <Icon name="message" size={22} />
            </span>
            <span>
              <strong>Đã gửi phản ánh?</strong>
              <small>Xem tiến độ xử lý của bạn</small>
            </span>
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>

      <div className="resident-service-strip" aria-label="Các nhóm dịch vụ">
        <p>
          Một không gian.
          <br />
          <strong>Mọi kết nối cần thiết.</strong>
        </p>
        {[
          ["message", "Phản ánh & hỗ trợ"],
          ["receipt", "Hóa đơn & thanh toán"],
          ["calendar", "Tiện ích & thông tin"],
        ].map(([icon, label]) => (
          <span key={label}>
            <Icon name={icon} size={23} />
            {label}
          </span>
        ))}
      </div>

      <section
        className="resident-catalog"
        id="dich-vu"
        ref={catalog}
        aria-labelledby="catalog-title"
      >
        <div className="resident-section-heading">
          <div>
            <p className="resident-kicker">Dịch vụ dành cho bạn</p>
            <h2 id="catalog-title">Bạn cần hỗ trợ điều gì?</h2>
            <p>
              Chọn dịch vụ để bắt đầu. Thông tin rõ ràng, thao tác thuận tiện.
            </p>
          </div>
          <span
            className="resident-catalog-count"
            role="status"
            aria-live="polite"
          >
            {results.length} dịch vụ
            {query.trim() ? ` cho “${query.trim()}”` : ""}
          </span>
        </div>
        <form
          className="resident-search"
          role="search"
          aria-label="Tìm dịch vụ cư dân"
          onSubmit={showCatalog}
        >
          <label htmlFor="service-search">Tìm dịch vụ</label>
          <div>
            <Icon name="search" size={22} />
            <input
              id="service-search"
              type="search"
              autoComplete="off"
              maxLength={80}
              placeholder="Tìm hóa đơn, đặt lịch, phản ánh…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCategory("all");
              }}
            />
            <button className="primary" type="submit">
              Tìm kiếm
              <Icon name="arrow" size={18} />
            </button>
          </div>
        </form>
        <div
          className="resident-categories"
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
          <ul className="resident-services" aria-label="Danh sách dịch vụ">
            {results.map((service) => (
              <ServiceCard key={service.id} service={service} user={user} />
            ))}
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

      <SupportProcess />
      <p className="resident-emergency">
        <Icon name="shield" size={18} />
        Trường hợp nguy hiểm tức thời, hãy liên hệ trực tiếp Ban quản lý hoặc cơ
        quan khẩn cấp.
      </p>
    </div>
  );
}

function ServiceCard({ service, user }) {
  const needsLogin = !user && !service.access;
  return (
    <li key={service.id}>
      <Link
        className={`resident-service${service.id === "feedback" ? " resident-service-featured" : ""}`}
        aria-label={service.title}
        to={needsLogin ? "/dang-nhap" : service.path}
        state={needsLogin ? { service: service.id } : undefined}
      >
        <div className="resident-service-top">
          <span className="resident-service-icon">
            <Icon name={service.icon} size={24} />
          </span>
          <span>
            {serviceCategories.find(([id]) => id === service.category)?.[1]}
          </span>
        </div>
        <h3>{service.title}</h3>
        <p>{service.description}</p>
        <div className="resident-service-bottom">
          <span>
            {service.access ||
              (needsLogin ? "Đăng nhập để sử dụng" : "Mở dịch vụ")}
          </span>
          <Icon name="arrow" size={20} />
        </div>
      </Link>
    </li>
  );
}

function SupportProcess() {
  return (
    <section className="resident-support" aria-labelledby="support-title">
      <div>
        <p className="resident-kicker">Luôn có kênh để lắng nghe</p>
        <h2 id="support-title">
          Một phản ánh.
          <br />
          Một khởi đầu tốt hơn.
        </h2>
        <p>
          Mô tả sự cố tại vị trí có mã QR. Ban quản lý tiếp nhận, phân công và
          cập nhật kết quả để bạn theo dõi.
        </p>
        <Link className="button primary" to="/tra-cuu">
          Tra cứu phản ánh
          <Icon name="arrow" size={18} />
        </Link>
      </div>
      <ol>
        {[
          [
            "Quét mã tại vị trí",
            "Mở mã QR tại khu vực hoặc thiết bị cần hỗ trợ.",
          ],
          [
            "Gửi nội dung và hình ảnh",
            "Mô tả vấn đề, đính kèm ảnh và giữ mã tra cứu.",
          ],
          [
            "Theo dõi kết quả",
            "Dùng mã tra cứu và số điện thoại để xem tiến độ.",
          ],
        ].map(([title, description], index) => (
          <li key={title}>
            <span aria-hidden="true">0{index + 1}</span>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <Icon name="shield" size={18} />
          </li>
        ))}
      </ol>
    </section>
  );
}
