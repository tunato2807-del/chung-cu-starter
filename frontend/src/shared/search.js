// Tìm tiếng Việt có/không dấu; khoảng trắng và dấu nối không làm mất kết quả.
export function searchKey(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function matchesSearch(query, ...values) {
  const key = searchKey(query);
  return !key || values.some((value) => searchKey(value).includes(key));
}
