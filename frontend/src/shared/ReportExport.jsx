import React, { useEffect, useRef, useState } from "react";
import { ErrorBox } from "./ui.jsx";
import { fetchWithSession } from "./api/client.js";
export default function ReportExport({
  path,
  disabled = false,
  template = false,
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
      const r = await fetchWithSession(url, {
        credentials: "same-origin",
        headers: { "X-App-Request": "1" },
        signal: controller.signal,
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        const message =
          data.error?.message ||
          (r.status >= 500
            ? "Máy chủ chưa trả được tệp báo cáo. Kiểm tra backend đang chạy và lỗi trong terminal backend rồi thử lại."
            : `Không tải được báo cáo (${r.status}).`);
        throw new Error(message);
      }
      const mime =
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
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
          ? "Đã tải mẫu trống. Điền sheet Nhap từ dòng 2, lưu tệp rồi chọn lại để xem trước. Sheet Vi du chỉ minh họa."
          : `Đã tạo tệp ${format === "pdf" ? "PDF" : "Excel"} gồm ${Number(r.headers.get("X-Export-Rows") || 0).toLocaleString("vi-VN")} dòng. ${format === "xlsx" ? "Excel mở tại trang Chi tiết; bộ lọc và số liệu chung nằm ở trang Tổng hợp. " : ""}Kiểm tra mục Tệp đã tải xuống của trình duyệt.`,
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
    <section
      className="report-export"
      aria-label={template ? "Tải mẫu Excel" : "Xuất báo cáo"}
    >
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
        {!template && (
          <button
            type="button"
            disabled={disabled || !!pending}
            onClick={() => download("pdf")}
          >
            {pending === "pdf" ? "Đang tạo PDF…" : "Xuất PDF"}
          </button>
        )}
        <small>
          {template
            ? "Mẫu trống .xlsx: điền sheet Nhap từ dòng 2, tối đa 100 dòng. Ví dụ nằm riêng ở sheet Vi du."
            : "Xuất toàn bộ kết quả theo bộ lọc: tối đa 10.000 dòng Excel hoặc 1.000 dòng PDF. Excel có trang Chi tiết và Tổng hợp."}
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
