import { authenticate } from "./auth.service.js";
import { fail } from "../../lib/http.js";
export async function optionalAuth(req, res, next) {
  const token = req.headers.cookie
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("session="))
    ?.slice(8);
  req.user = token ? await authenticate(token) : null;
  // Do not silently submit an authenticated resident's report as a guest after expiry.
  if (token && !req.user)
    fail(401, "SESSION_EXPIRED", "Phiên đã hết hạn. Vui lòng đăng nhập lại.");
  next();
}
export function requireAuth(req, res, next) {
  if (!req.user) fail(401, "UNAUTHORIZED", "Vui lòng đăng nhập.");
  next();
}
export const roles =
  (...allowed) =>
  (req, res, next) => {
    if (!allowed.includes(req.user?.vai_tro))
      fail(403, "FORBIDDEN", "Bạn không có quyền thực hiện thao tác này.");
    next();
  };
