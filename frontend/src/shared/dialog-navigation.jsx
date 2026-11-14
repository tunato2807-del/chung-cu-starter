import React, { forwardRef, useCallback } from "react";
import {
  Link,
  resolvePath,
  useLocation,
  useNavigate,
  useResolvedPath,
} from "react-router-dom";
import { topDialog } from "./dialog-state.js";

const records =
  /^\/(?:quan-tri|cu-dan|ky-thuat)\/(?:cu-dan|phan-anh|cong-viec|quy|phieu-thu-chi|tien-ich|dat-lich|thiet-bi|bao-tri|hoa-don|thong-bao)\/(?:\d+|moi)\/?$/;
const key = "workflowBackground";

export function dialogLocations(location) {
  const layers = [location];
  const seen = new Set([location.key]);
  let previous = location.state?.[key];
  while (previous && layers.length < 8) {
    if (
      typeof previous.pathname !== "string" ||
      !previous.pathname.startsWith("/") ||
      typeof previous.key !== "string" ||
      seen.has(previous.key)
    )
      return [location];
    seen.add(previous.key);
    layers.unshift(previous);
    previous = previous.state?.[key];
  }
  return previous ? [location] : layers;
}

export const DetailLink = forwardRef(function DetailLink(
  { to, state, onClick, target, dialog = false, ...props },
  ref,
) {
  const location = useLocation();
  const navigate = useNavigate();
  const external =
    typeof to === "string" && /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(to);
  const resolved = useResolvedPath(external ? location.pathname : to);
  const previous = location.state?.[key];
  const backLabel =
    typeof props.children === "string" && props.children.trim().startsWith("←");
  const returning =
    previous &&
    (backLabel ||
      (resolved.pathname === previous.pathname &&
        !resolved.search &&
        !resolved.hash));
  const overlay =
    !external &&
    (dialog || records.test(resolved.pathname)) &&
    dialogLocations(location).length < 8;
  return (
    <Link
      {...props}
      ref={ref}
      to={to}
      target={target}
      state={overlay ? { ...state, [key]: location } : state}
      onClick={(event) => {
        onClick?.(event);
        if (
          returning &&
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          (!target || target === "_self")
        ) {
          event.preventDefault();
          navigate(-1);
        }
      }}
    />
  );
});

export function useDialogNavigate() {
  const location = useLocation();
  const navigate = useNavigate();
  return useCallback(
    (to, options = {}) => {
      if (typeof to === "number") return navigate(to);
      const resolved = resolvePath(to, location.pathname);
      const previous = location.state?.[key];
      if (
        previous &&
        resolved.pathname === previous.pathname &&
        !resolved.search
      )
        return navigate(-1);
      if ((previous || topDialog()) && records.test(resolved.pathname)) {
        const replacing = !!previous && location.pathname.endsWith("/moi");
        return navigate(to, {
          ...options,
          replace: replacing,
          state: { ...options.state, [key]: replacing ? previous : location },
        });
      }
      return navigate(to, options);
    },
    [navigate, location],
  );
}

export function dialogTitle(pathname) {
  const entity = pathname.split("/")[2];
  if (pathname.endsWith("/moi")) return "Lập phiếu thu / chi";
  return (
    {
      "cu-dan": "Chi tiết cư dân",
      "phan-anh": "Chi tiết phản ánh",
      "cong-viec": "Chi tiết công việc",
      quy: "Chi tiết quỹ",
      "phieu-thu-chi": "Chi tiết phiếu thu / chi",
      "tien-ich": "Chi tiết tiện ích",
      "dat-lich": "Chi tiết đặt lịch",
      "thiet-bi": "Hồ sơ thiết bị",
      "bao-tri": "Phiếu bảo trì",
      "hoa-don": "Chi tiết hóa đơn",
      "thong-bao": "Chi tiết thông báo",
      "phuong-tien": "Phương tiện cư dân",
      "cau-truc-toa-nha": "Khối và tầng tòa nhà",
    }[entity] || "Chi tiết"
  );
}
