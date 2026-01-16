// src/api.js
const API_URL = "http://127.0.0.1:8081";

async function parseJson(res) {
  // Handle empty responses or JSON errors gracefully
  const data = await res.json().catch(() => ({})); 
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export async function apiLogin(username, password) {
  const body = new URLSearchParams();
  body.append("username", username);
  body.append("password", password);

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  return parseJson(res);
}

export async function apiGet(path, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { headers });
  return parseJson(res);
}

// ✅ UPDATED POST FUNCTION
export async function apiPost(endpoint, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",   // <--- THIS LINE IS CRITICAL. MUST BE "POST"
    headers,
    body: JSON.stringify(body),
  });

  return parseJson(res);
}


export async function apiRegister(userData) {
  const res = await fetch(`${API_URL}/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return parseJson(res);
}
