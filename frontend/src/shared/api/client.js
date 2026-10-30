import { expireAuthSession, getAuthSession } from "../auth-session.js";

// JSON requests and file downloads must observe the same session generation.
export async function fetchWithSession(input, options = {}) {
  const requestSession = getAuthSession();
  const response = await fetch(input, options);
  const pathname = new URL(
    typeof input === "string" ? input : input.url || String(input),
    "http://app.invalid",
  ).pathname;
  if (
    response.status === 401 &&
    pathname.replace(/\/+$/, "") !== "/api/xac_thuc/dang_nhap"
  ) {
    expireAuthSession(requestSession);
    if (!requestSession.user) {
      // On first load there is no user yet. Only an explicit expired-cookie
      // response distinguishes that session from an ordinary anonymous visit.
      const data = await response
        .clone()
        .json()
        .catch(() => null);
      if (data?.error?.code === "SESSION_EXPIRED")
        expireAuthSession(requestSession, true);
    }
  }
  return response;
}

export async function getJson(path, options = {}) {
  const requestSession = getAuthSession();
  const pathname = path.split(/[?#]/, 1)[0];
  if (
    requestSession.expired &&
    /^\/cong_khai\/phan_anh\/?$/.test(pathname) &&
    !["GET", "HEAD"].includes((options.method || "GET").toUpperCase())
  )
    throw Object.assign(
      new Error(
        "Phiên đã hết hạn. Vui lòng đăng nhập lại trước khi gửi. Nội dung và ảnh trong biểu mẫu vẫn được giữ lại.",
      ),
      { status: 401, code: "SESSION_EXPIRED" },
    );
  const headers = { "X-App-Request": "1", ...options.headers };
  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetchWithSession(`/api${path}`, {
      ...options,
      headers,
      body,
      credentials: "same-origin",
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Không kết nối được máy chủ. Thông tin trong biểu mẫu vẫn được giữ lại.",
    );
  }
  let result;
  try {
    result = await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw Object.assign(
      new Error(
        `Máy chủ chưa trả được phản hồi hợp lệ (HTTP ${response.status}). Vui lòng thử lại sau.`,
      ),
      { status: response.status, code: "API_RESPONSE_INVALID" },
    );
  }
  if (!result || typeof result !== "object" || Array.isArray(result))
    throw Object.assign(
      new Error("Phản hồi từ máy chủ không hợp lệ. Vui lòng tải lại trang."),
      {
        status: response.status,
        code: "API_RESPONSE_INVALID",
      },
    );
  if (!response.ok) {
    const error = new Error(
      result.error?.message || `Yêu cầu thất bại (${response.status})`,
    );
    Object.assign(error, result.error, { status: response.status });
    throw error;
  }
  return result;
}
