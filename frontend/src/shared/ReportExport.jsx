import React, { useEffect, useRef, useState } from "react";
import { ErrorBox } from "./ui.jsx";
export default function ReportExport({
  path,
  disabled = false,
  template = false,
  templateRows = 3,
}) {
  const [pending, setPending] = useState(""),
    [error, setError] = useState(null),
    [notice, setNotice] = useState(""),
    active = useRef(null),
    currentPath = useRef(path);
  currentPath.current = path;
  useEffect(() => {
    active.current?.abort();
    active.current = null;
    setPending("");
    setError(null);
    setNotice("");
    return () => active.current?.abort();
  }, [path]);
  async function download(format) {
    const controller = new AbortController(),
      requestPath = path;
    active.current = controller;
    setPending(format);
    setError(null);
    setNotice("");
    try {
      const url = new URL("/api" + path, window.location.origin);
      url.searchParams.set("dinh_dang", format);
      const r = await fetch(url, {
        credentials: "same-origin",
        headers: { "X-App-Request": "1" },
        signal: controller.signal,
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(
          data.error?.message || `Không tải được báo cáo (${r.status}).`,
        );
      }
      const mime =
        format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf";
      if (!r.headers.get("Content-Type")?.startsWith(mime))
        throw new Error("Máy chủ trả tệp không đúng định dạng. Hãy thử lại.");
      const blob = await r.blob();
      if (controller.signal.aborted || currentPath.current !== requestPath)
        return;
      const file =
        r.headers
          .get("Content-Disposition")
          ?.match(/filename="([a-zA-Z0-9_.-]+)"/)?.[1] || `bao-cao.${format}`;
      const link = document.createElement("a"),
        objectURL = URL.createObjectURL(blob);
      link.href = objectURL;
      link.download = file;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectURL), 60000);
      setNotice(
        template
          ? "Đã tải mẫu. Điền dữ liệu rồi chọn tệp để xem trước."
          : `Đã tạo tệp ${format === "xlsx" ? "Excel" : "PDF"} gồm ${Number(r.headers.get("X-Export-Rows") || 0).toLocaleString("vi-VN")} dòng. Kiểm tra mục Tệp đã tải xuống của trình duyệt.`,
      );
    } catch (e) {
      if (!controller.signal.aborted && currentPath.current === requestPath)
        setError(
          e.name === "TypeError"
            ? new Error(
                "Không kết nối được máy chủ để tải báo cáo. Hãy thử lại.",
              )
            : e,
        );
    } finally {
      if (active.current === controller) {
        active.current = null;
        setPending("");
      }
    }
  }
  return (
    <section className="report-export" aria-label="Xuất báo cáo">
      <div className="actions">
        <button
          type="button"
          disabled={disabled || !!pending}
          onClick={() => download("xlsx")}
        >
          {pending === "xlsx"
            ? "Đang tạo Excel…"
            : template
              ? "Tải mẫu Excel"
              : "Xuất Excel"}
        </button>
        <button
          type="button"
          disabled={disabled || !!pending}
          onClick={() => download("pdf")}
        >
          {pending === "pdf"
            ? "Đang tạo PDF…"
            : template
              ? "Tải mẫu PDF"
              : "Xuất PDF"}
        </button>
        <small>
          {template
            ? `Mẫu Excel tối đa 100 dòng. Mẫu PDF có ${templateRows} trang, mỗi trang một hồ sơ.`
            : "Xuất toàn bộ kết quả theo bộ lọc đã áp dụng."}
        </small>
      </div>
      {notice && (
        <p className="note" role="status">
          {notice}
        </p>
      )}
      <ErrorBox error={error} />
    </section>
  );
}
