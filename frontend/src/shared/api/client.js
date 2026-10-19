export async function getJson(path, options = {}) {
  const response = await fetch(`/api${path}`, options);
  if (!response.ok) throw new Error(`Yêu cầu thất bại (${response.status})`);
  return response.json();
}
