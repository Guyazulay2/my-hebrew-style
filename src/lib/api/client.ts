const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const TOKEN_KEY = "ms_token";
const USER_KEY = "ms_user";

/* ── token helpers ── */

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  // Check JWT expiry without a library: decode the payload
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      // Expired — clear silently
      clearAuth();
      return null;
    }
  } catch {
    // Malformed token — clear it
    clearAuth();
    return null;
  }
  return token;
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  dispatchAuthChange();
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  dispatchAuthChange();
}

/** @deprecated use clearAuth */
export const clearToken = clearAuth;

export function setUser(user: { id: string; is_onboarded: boolean }) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): { id: string; is_onboarded: boolean } | null {
  const s = localStorage.getItem(USER_KEY);
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/* ── reactive auth state ── */

const AUTH_EVENT = "ms-auth-changed";

function dispatchAuthChange() {
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
}

export function onAuthChange(fn: () => void) {
  window.addEventListener(AUTH_EVENT, fn);
  return () => window.removeEventListener(AUTH_EVENT, fn);
}

/* ── API fetch ── */

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Auto-logout on 401
  if (res.status === 401) {
    clearAuth();
    throw new Error("פג תוקף החיבור — אנא התחברו מחדש");
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      // Don't leak raw server errors to UI — normalize them
      detail = typeof body.detail === "string" ? body.detail : "שגיאת שרת";
    } catch { /* ignore */ }
    throw new Error(detail);
  }

  return res.json();
}
