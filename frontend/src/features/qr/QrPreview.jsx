import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import "./QrPreview.css";

export const qrUrl = (location) =>
  `${window.location.origin}/r/${location.token_qr}`;
export const qrImage = (location) =>
  QRCode.toDataURL(qrUrl(location), {
    width: 512,
    margin: 3,
    errorCorrectionLevel: "M",
  });

export async function downloadQr(location) {
  const link = document.createElement("a");
  link.href = await qrImage(location);
  link.download = `vi-tri-${location.ma_vi_tri_qr}.png`;
  document.body.append(link);
  link.click();
  link.remove();
}

export async function printQr(location) {
  // Open during the click, before awaiting image generation, to retain user activation.
  const popup = window.open(
    "about:blank",
    "_blank",
    "popup,width=520,height=620",
  );
  if (!popup)
    throw new Error(
      "Trình duyệt đang chặn cửa sổ in. Hãy cho phép cửa sổ bật lên cho trang này rồi thử lại.",
    );
  popup.opener = null;
  try {
    const doc = popup.document;
    doc.title = `Mã QR ${location.ten_vi_tri}`;
    const style = doc.createElement("style");
    style.textContent =
      "@page{margin:15mm}body{margin:24px;background:#fff;display:grid;place-items:start center}img{display:block;width:70mm;max-width:100%;height:auto}@media print{body{margin:0}}";
    doc.head.append(style);
    const image = doc.createElement("img");
    image.alt = `Mã QR ${location.ten_vi_tri}`;
    const source = await qrImage(location);
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () =>
        reject(new Error("Chưa tải được ảnh QR để in. Vui lòng thử lại."));
      image.src = source;
      doc.body.append(image);
    });
    popup.onafterprint = () => popup.close();
    popup.focus();
    popup.print();
  } catch (error) {
    popup.close();
    throw error;
  }
}

export default function QrPreview({ id, location, anchor, onClose, onError }) {
  const ref = useRef(null);
  const [image, setImage] = useState("");
  const [position, setPosition] = useState(null);
  const url = qrUrl(location);
  useEffect(() => {
    let active = true;
    qrImage(location)
      .then((source) => {
        if (active) setImage(source);
      })
      .catch((error) => {
        if (active) {
          onError(error);
          onClose();
        }
      });
    return () => {
      active = false;
    };
  }, [url, onClose, onError]);

  useLayoutEffect(() => {
    const update = () => {
      if (!anchor?.isConnected) return onClose();
      const box = anchor.getBoundingClientRect();
      const width = document.documentElement.clientWidth,
        height = window.innerHeight;
      if (
        box.bottom < 0 ||
        box.top > height ||
        box.right < 0 ||
        box.left > width
      )
        return onClose();
      const size = Math.max(0, Math.min(260, width - 24, height - 24));
      const below = box.bottom + 8;
      const top = below + size <= height - 12 ? below : box.top - size - 8;
      setPosition({
        width: size,
        left: Math.max(12, Math.min(box.left, width - size - 12)),
        top: Math.max(12, Math.min(top, height - size - 12)),
      });
    };
    update();
    const outside = (event) => {
      if (
        !ref.current?.contains(event.target) &&
        !anchor.contains(event.target)
      )
        onClose();
    };
    const keyboard = (event) => {
      if (event.key === "Escape" || event.key === "Tab") {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
        }
        onClose();
        if (anchor.isConnected) anchor.focus({ preventScroll: true });
      }
    };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", keyboard, true);
    window.addEventListener("resize", update);
    document.addEventListener("scroll", update, true);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", keyboard, true);
      window.removeEventListener("resize", update);
      document.removeEventListener("scroll", update, true);
    };
  }, [anchor, onClose]);

  const positioned = position !== null;
  useLayoutEffect(() => {
    if (positioned) ref.current?.focus({ preventScroll: true });
  }, [positioned]);

  return createPortal(
    <div
      ref={ref}
      id={id}
      role="dialog"
      aria-label={`Mã QR ${location.ten_vi_tri}`}
      aria-busy={!image}
      tabIndex={-1}
      className="qr-popover"
      style={{ ...position, visibility: position ? "visible" : "hidden" }}
    >
      {image ? (
        <img
          src={image}
          alt={`Mã QR ${location.ten_vi_tri}`}
          width="512"
          height="512"
        />
      ) : (
        <div
          className="qr-popover-loading"
          role="status"
          aria-label="Đang tạo mã QR"
        >
          <span />
        </div>
      )}
    </div>,
    document.body,
  );
}
