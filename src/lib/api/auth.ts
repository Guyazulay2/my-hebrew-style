import { apiFetch, setToken, setUser, clearAuth } from "./client";

export function logout() {
  clearAuth();
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  is_onboarded: boolean;
}

export async function register(
  email: string,
  password: string,
  full_name: string
): Promise<TokenResponse> {
  const res = await apiFetch<TokenResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, full_name }),
  });
  setToken(res.access_token);
  setUser({ id: res.user_id, is_onboarded: res.is_onboarded });
  return res;
}

export async function login(
  email: string,
  password: string
): Promise<TokenResponse> {
  const res = await apiFetch<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(res.access_token);
  setUser({ id: res.user_id, is_onboarded: res.is_onboarded });
  return res;
}
