import { randomUUID } from "node:crypto";
export class HttpError extends Error {
  constructor(status, code, message, field_errors) {
    super(message);
    Object.assign(this, { status, code, field_errors });
  }
}
export function fail(status, code, message, fields) {
  throw new HttpError(status, code, message, fields);
}
export function text(value, field, min = 1, max = 255) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    fail(422, "VALIDATION", "Vui lòng kiểm tra thông tin đã nhập.", {
      [field]: `Cần từ ${min} đến ${max} ký tự.`,
    });
  return value.trim();
}
export function phone(value) {
  const p = text(value, "so_dien_thoai", 10, 15);
  if (!/^(0\d{9}|\+84\d{9})$/.test(p))
    fail(422, "VALIDATION", "Số điện thoại không hợp lệ.", {
      so_dien_thoai: "Nhập 10 chữ số bắt đầu bằng 0 hoặc +84.",
    });
  return p.replace(/^\+84/, "0");
}
export function choice(value, field, allowed) {
  if (!allowed.includes(value))
    fail(422, "VALIDATION", "Lựa chọn không hợp lệ.", {
      [field]: "Chọn một giá trị trong danh sách.",
    });
  return value;
}
export function integer(value, field) {
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)))
    fail(422, "VALIDATION", "Mã hoặc phiên bản không hợp lệ.", {
      [field]: "Cần số nguyên không âm.",
    });
  return Number(value);
}
export function requestContext(req, res, next) {
  req.requestId = randomUUID();
  res.set("X-Request-ID", req.requestId);
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Cache-Control", "no-store");
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    (req.get("X-App-Request") !== "1" ||
      req.get("Sec-Fetch-Site") === "cross-site")
  )
    return next(
      new HttpError(403, "CSRF", "Yêu cầu không hợp lệ. Hãy tải lại trang."),
    );
  next();
}
// Memory is bounded; account lockouts are also persisted in MySQL.
export function rateLimit(limit, windowMs) {
  const entries = new Map();
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, item] of entries) if (item.end < now) entries.delete(key);
    const key = req.ip;
    if (!entries.has(key) && entries.size >= 10000)
      return next(
        new HttpError(429, "RATE_LIMIT", "Hệ thống bận. Vui lòng thử lại sau."),
      );
    const item = entries.get(key) || { count: 0, end: now + windowMs };
    entries.set(key, item);
    item.count++;
    if (item.count > limit) {
      res.set("Retry-After", String(Math.ceil((item.end - now) / 1000)));
      return next(
        new HttpError(
          429,
          "RATE_LIMIT",
          "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
        ),
      );
    }
    next();
  };
}
