export const API_BASE = process.env.REACT_APP_API_BASE || "https://dexterluxuries-production.up.railway.app/api";

export async function apiRequest(path, { method = "GET", body, token, fallbackError = "Something went wrong. Try again." } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    const err = new Error("Can't reach the server. Check your connection and try again.");
    err.status = 0;
    throw err;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || fallbackError);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
