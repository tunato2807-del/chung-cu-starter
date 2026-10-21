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
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(
      result.error?.message || `Yêu cầu thất bại (${response.status})`,
    );
    Object.assign(error, result.error, { status: response.status });
    throw error;
  }
  return result;
}
