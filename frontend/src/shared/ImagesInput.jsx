import React, { useEffect, useId, useRef, useState } from "react";

export default function ImagesInput({ onBeforeChoose, disabled = false }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [stream, setStream] = useState(null);
  const input = useRef(null);
  const video = useRef(null);
  const activeStream = useRef(null);
  const generation = useRef(0);
  const inputId = useId();

  useEffect(() => {
    const images = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setPreviews(images);
    return () => images.forEach((image) => URL.revokeObjectURL(image.url));
  }, [files]);

  function closeCamera() {
    generation.current++;
    activeStream.current?.getTracks().forEach((track) => track.stop());
    activeStream.current = null;
    setStream(null);
    setCameraOpen(false);
    setStarting(false);
    setReady(false);
    setCapturing(false);
  }

  useEffect(
    () => () => {
      generation.current++;
      activeStream.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  useEffect(() => {
    if (!stream || !video.current) return;
    const element = video.current;
    element.srcObject = stream;
    element.play().catch(() => {
      if (activeStream.current === stream) {
        closeCamera();
        setError(
          "Không phát được camera. Hãy kiểm tra quyền Camera của trình duyệt.",
        );
      }
    });
    return () => {
      element.srcObject = null;
    };
  }, [stream]);

  useEffect(() => {
    function hidden() {
      if (document.hidden) closeCamera();
    }
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, []);

  useEffect(() => {
    if (disabled) closeCamera();
  }, [disabled]);

  async function openCamera() {
    onBeforeChoose?.();
    setError("");
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError(
        "Camera trong trang cần HTTPS được thiết bị tin cậy. Hãy mở đúng địa chỉ HTTPS và cấp quyền Camera.",
      );
      return;
    }
    const request = ++generation.current;
    setCameraOpen(true);
    setStarting(true);
    setReady(false);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (request !== generation.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      activeStream.current = media;
      setStream(media);
      setStarting(false);
    } catch (err) {
      if (request !== generation.current) return;
      closeCamera();
      setError(
        err.name === "NotAllowedError"
          ? "Bạn chưa cho phép Camera. Hãy cấp quyền Camera cho trang trong Chrome rồi thử lại."
          : "Không mở được camera. Hãy đóng ứng dụng khác đang dùng camera rồi thử lại.",
      );
    }
  }

  async function capture() {
    const element = video.current;
    if (!element?.videoWidth || !element.videoHeight || !ready) {
      setError("Camera chưa sẵn sàng. Hãy chờ hình ảnh xuất hiện rồi chụp.");
      return;
    }
    const request = generation.current;
    setCapturing(true);
    try {
      const canvas = document.createElement("canvas");
      const scale = Math.min(
        1,
        1600 / Math.max(element.videoWidth, element.videoHeight),
      );
      canvas.width = Math.round(element.videoWidth * scale);
      canvas.height = Math.round(element.videoHeight * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Không tạo được ảnh từ camera.");
      context.drawImage(element, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85),
      );
      if (request !== generation.current) return;
      if (!blob || blob.size > 5 * 1024 * 1024)
        throw new Error("Chưa tạo được ảnh hợp lệ dưới 5 MB. Hãy chụp lại.");
      const current = Array.from(input.current.files || []);
      if (current.length >= 5)
        throw new Error("Tối đa 5 ảnh. Hãy bỏ ảnh cũ trước khi chụp thêm.");
      const photo = new File([blob], `hien-truong-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const transfer = new DataTransfer();
      [...current, photo].forEach((file) => transfer.items.add(file));
      input.current.files = transfer.files;
      if (input.current.files.length !== current.length + 1)
        throw new Error(
          "Trình duyệt chưa gắn được ảnh vào form. Hãy thử Chrome phiên bản mới.",
        );
      setFiles(Array.from(input.current.files));
      setError("");
      closeCamera();
    } catch (err) {
      if (request === generation.current)
        setError(err.message || "Không lưu được ảnh vừa chụp. Hãy thử lại.");
    } finally {
      if (request === generation.current) setCapturing(false);
    }
  }

  function selected(event) {
    const picked = Array.from(event.currentTarget.files || []);
    const invalid = picked.some(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
        !/\.(jpe?g|png|webp)$/i.test(file.name),
    );
    if (
      picked.length > 5 ||
      picked.some((file) => file.size > 5 * 1024 * 1024) ||
      invalid
    ) {
      event.currentTarget.value = "";
      setFiles([]);
      setError(
        "Chọn tối đa 5 ảnh JPEG, PNG hoặc WebP, mỗi ảnh không quá 5 MB.",
      );
      return;
    }
    setFiles(picked);
    setError("");
  }

  return (
    <div className="field">
      <label htmlFor={inputId}>Ảnh hiện trường (JPEG, PNG, WebP)</label>
      <input
        ref={input}
        id={inputId}
        name="hinh_anh"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        disabled={disabled}
        onChange={selected}
      />
      <div className="actions">
        <button
          type="button"
          disabled={disabled || cameraOpen}
          onClick={() => {
            onBeforeChoose?.();
            input.current?.click();
          }}
        >
          Chọn ảnh từ thư viện
        </button>
        <button
          type="button"
          disabled={disabled || cameraOpen || files.length >= 5}
          onClick={openCamera}
        >
          Chụp ảnh
        </button>
        {files.length > 0 && (
          <button
            type="button"
            disabled={disabled || cameraOpen}
            onClick={() => {
              input.current.value = "";
              setFiles([]);
              setError("");
            }}
          >
            Bỏ ảnh đã chọn
          </button>
        )}
      </div>
      {cameraOpen && (
        <div
          className="card"
          role="group"
          aria-label="Camera chụp ảnh hiện trường"
        >
          <video
            ref={video}
            autoPlay
            muted
            playsInline
            aria-label="Hình camera trực tiếp"
            style={{
              width: "100%",
              maxHeight: 320,
              background: "#000",
              borderRadius: 8,
            }}
            onLoadedData={() => setReady(Boolean(video.current?.videoWidth))}
          />
          <p role="status">
            {starting
              ? "Đang mở camera…"
              : ready
                ? "Hướng camera vào hiện trường rồi bấm Chụp ảnh này."
                : "Đang chờ hình ảnh camera…"}
          </p>
          <div className="actions">
            <button
              type="button"
              className="primary"
              disabled={disabled || !ready || capturing}
              onClick={capture}
            >
              {capturing ? "Đang lưu ảnh…" : "Chụp ảnh này"}
            </button>
            <button type="button" onClick={closeCamera}>
              Đóng camera
            </button>
          </div>
        </div>
      )}
      <small>
        Tối đa 5 ảnh, mỗi ảnh 5 MB. Ảnh được tải lên khi bấm gửi. Chọn thư viện
        để thay ảnh, hoặc chụp để thêm ảnh.
      </small>
      <p role="status">
        {files.length ? `Đã chọn ${files.length} ảnh.` : "Chưa chọn ảnh."}
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="image-grid">
        {previews.map((image, index) => (
          <img
            key={index}
            src={image.url}
            loading="lazy"
            decoding="async"
            alt={`Xem trước ${image.name}`}
          />
        ))}
      </div>
    </div>
  );
}
