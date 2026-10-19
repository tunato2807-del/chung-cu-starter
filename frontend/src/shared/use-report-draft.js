import { useMemo, useState } from "react";
import { newRequestKey } from "./request-key.js";

const fields = [
  "loai_su_co",
  "tieu_de",
  "noi_dung",
  "ten_nguoi_gui",
  "so_dien_thoai",
  "can_ho_khai_bao",
];
const lifetime = 2 * 60 * 60 * 1000;

export function useReportDraft(token, userId) {
  const storageKey = `chung-cu:report-draft:${token}:${userId || "guest"}`;
  const [warning, setWarning] = useState("");
  const initial = useMemo(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey));
      if (
        saved &&
        Date.now() - saved.savedAt < lifetime &&
        saved.savedAt <= Date.now() &&
        /^[0-9a-f-]{36}$/i.test(saved.requestKey)
      ) {
        const values = {};
        for (const name of fields)
          if (typeof saved.values?.[name] === "string")
            values[name] = saved.values[name].slice(0, 5000);
        return { values, requestKey: saved.requestKey, restored: true };
      }
      sessionStorage.removeItem(storageKey);
    } catch {
      /* Storage can be disabled or a saved draft can be malformed. */
    }
    return { values: {}, requestKey: newRequestKey(), restored: false };
  }, [storageKey]);

  function save(form) {
    if (!form) return;
    const data = new FormData(form);
    const values = Object.fromEntries(
      fields.map((name) => [name, String(data.get(name) || "")]),
    );
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          values,
          requestKey: initial.requestKey,
          savedAt: Date.now(),
        }),
      );
    } catch {
      setWarning(
        "Trình duyệt không cho lưu nháp. Hãy giữ trang này mở khi chọn ảnh.",
      );
    }
  }

  function clear() {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* Keep successful submission usable. */
    }
  }

  return { ...initial, save, clear, warning };
}
