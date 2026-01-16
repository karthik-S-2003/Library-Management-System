export function saveAuth(data) {
  localStorage.setItem("auth", JSON.stringify(data));
}

export function getAuth() {
  const raw = localStorage.getItem("auth");
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth() {
  localStorage.removeItem("auth");
}
