import React, { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import "./PhotoCarousel.css";

const slides = [
  {
    src: "/images/residences/apartment-balconies.webp",
    alt: "Các ban công kính của một tòa căn hộ dưới bầu trời xanh",
    title: "Không gian sống hiện đại",
    description: "Kết nối cư dân và Ban quản lý trong cùng một nền tảng.",
    position: "50% 48%",
  },
  {
    src: "/images/residences/residential-building.webp",
    alt: "Mặt ngoài tòa nhà nhiều tầng với các ô cửa và ban công",
    title: "An tâm trong từng trải nghiệm",
    description:
      "Gửi phản ánh, theo dõi tiến độ và sử dụng dịch vụ thuận tiện.",
    position: "50% 48%",
  },
  {
    src: "/images/residences/modern-residence.webp",
    alt: "Cận cảnh ban công và mặt ngoài một khu nhà ở hiện đại",
    title: "Kết nối từ những điều nhỏ",
    description: "Thông tin rõ ràng để mỗi ngày sống thêm thuận tiện.",
    position: "50% 52%",
  },
];
const interval = 6000;

export default function PhotoCarousel({ variant = "portal" }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [visible, setVisible] = useState(
    () => document.visibilityState !== "hidden",
  );
  const [inView, setInView] = useState(false);
  const [failed, setFailed] = useState([]);
  const root = useRef(null);
  const enabled = !paused && !reducedMotion;
  const running =
    enabled && !hovered && visible && inView && failed.length < slides.length;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    const updateVisibility = () =>
      setVisible(document.visibilityState !== "hidden");
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(root.current);
    return () => {
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % slides.length),
      interval,
    );
    return () => window.clearInterval(timer);
  }, [running, index]);

  function select(next) {
    setPaused(true);
    setIndex((next + slides.length) % slides.length);
  }

  return (
    <section
      ref={root}
      className={`photo-carousel photo-carousel--${variant}`}
      aria-label="Ảnh minh họa không gian sống"
      aria-roledescription="trình chiếu"
      data-slide={index + 1}
      data-playing={running}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (!event.target.closest("[data-rotation]")) setPaused(true);
      }}
    >
      <div className="photo-carousel-viewport">
        {slides.map((slide, number) => (
          <div
            className={`photo-slide${number === index ? " is-current" : ""}`}
            key={slide.src}
            aria-hidden={number !== index}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              width="800"
              height="700"
              decoding="async"
              fetchPriority={number === 0 ? "high" : "low"}
              style={{ objectPosition: slide.position }}
              onError={() =>
                setFailed((current) =>
                  current.includes(number) ? current : [...current, number],
                )
              }
            />
            {failed.includes(number) && (
              <div className="photo-fallback">
                <Icon name="building" size={42} />
                <span>Ảnh minh họa chưa tải được</span>
              </div>
            )}
          </div>
        ))}
        <span className="photo-carousel-label">
          <span className="live-dot" />
          ẢNH CHỤP MINH HỌA
        </span>
        <div
          className="photo-carousel-caption"
          aria-live={enabled ? "off" : "polite"}
          aria-atomic="true"
        >
          <p>{slides[index].title}</p>
          <span>{slides[index].description}</span>
        </div>
      </div>
      <div className="photo-carousel-toolbar">
        <div className="photo-carousel-arrows">
          <button
            type="button"
            aria-label="Ảnh trước"
            onClick={() => select(index - 1)}
          >
            <Icon name="previous" size={18} />
          </button>
          <button
            type="button"
            aria-label="Ảnh tiếp theo"
            onClick={() => select(index + 1)}
          >
            <Icon name="next" size={18} />
          </button>
        </div>
        <div className="photo-carousel-dots" role="group" aria-label="Chọn ảnh">
          {slides.map((slide, number) => (
            <button
              type="button"
              key={slide.src}
              aria-label={`Xem ảnh ${number + 1}`}
              aria-current={number === index ? "true" : undefined}
              onClick={() => select(number)}
            >
              <span />
            </button>
          ))}
        </div>
        <button
          className="photo-carousel-rotation"
          type="button"
          data-rotation="true"
          disabled={reducedMotion}
          aria-label={
            reducedMotion
              ? "Tự chuyển ảnh tắt theo cài đặt giảm chuyển động"
              : paused
                ? "Bật tự động chuyển ảnh"
                : "Dừng tự động chuyển ảnh"
          }
          aria-pressed={enabled}
          onClick={() => setPaused((value) => !value)}
        >
          <Icon name={enabled ? "pause" : "play"} size={16} />
          <span>{enabled ? "Tự động" : "Đã dừng"}</span>
        </button>
      </div>
    </section>
  );
}
