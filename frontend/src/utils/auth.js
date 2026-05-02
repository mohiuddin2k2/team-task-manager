export function saveSession(data) {
  localStorage.setItem("ttm_token", data.token);
  localStorage.setItem("ttm_user", JSON.stringify(data));
}

export function clearSession() {
  localStorage.removeItem("ttm_token");
  localStorage.removeItem("ttm_user");
}

export function getStoredUser() {
  const raw = localStorage.getItem("ttm_user");
  return raw ? JSON.parse(raw) : null;
}
