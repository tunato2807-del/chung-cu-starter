export async function getJson(path, options = {}) {
  const headers = { "X-App-Request": "1", ...options.headers };
  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(`/api${path}`, {
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
