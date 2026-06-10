const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function getToken(): string | null {
  return localStorage.getItem("ms_token");
}

export function setToken(token: string) {
  localStorage.setItem("ms_token", token);
}

export function clearToken() {
  localStorage.removeItem("ms_token");
  localStorage.removeItem("ms_user");
}

export function setUser(user: { id: string; is_onboarded: boolean }) {
  localStorage.setItem("ms_user", JSON.stringify(user));
}

export function getUser(): { id: string; is_onboarded: boolean } | null {
  const s = localStorage.getItem("ms_user");
  return s ? JSON.parse(s) : null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "שגיאת שרת");
  }
  return res.json();
}
