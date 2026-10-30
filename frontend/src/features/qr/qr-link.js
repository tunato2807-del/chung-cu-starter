function localHostname(hostname) {
  if (["localhost", "[::1]"].includes(hostname)) return true;
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return false;
  const [a, b] = hostname.split(".").map(Number);
  return (
    a === 127 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

export function reportPathFromQr(value, currentOrigin) {
  const invalid = () =>
    new Error("Mã QR không hợp lệ hoặc không thuộc hệ thống này.");
  if (typeof value !== "string" || !value.trim() || value.length > 2048)
    throw invalid();
  let url, current;
  try {
    current = new URL(currentOrigin);
    url = new URL(value.trim(), current.origin);
  } catch {
    throw invalid();
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^\/r\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(url.pathname) ||
    (url.origin !== current.origin &&
      url.hostname !== current.hostname &&
      !localHostname(url.hostname))
  )
    throw invalid();
  // Old LAN addresses are never fetched or opened. The current backend must
  // still validate the token, its active state and the selected database.
  return url.pathname;
}
