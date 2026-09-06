const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export type AuthResponse = {
  access_token: string;
  token_type: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Request failed" }));
    const detail = typeof body.detail === "string" ? body.detail : "Request failed";
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

export function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export function saveAccessToken(token: string): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem("ai_gateway_access_token", token);
}

export function getAccessToken(): string | null {
  if (!isBrowser()) {
    return null;
  }
  return window.localStorage.getItem("ai_gateway_access_token");
}

export function clearAccessToken(): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem("ai_gateway_access_token");
}

export function authenticate(email: string, password: string, mode: "login" | "register") {
  return apiRequest<AuthResponse>(`/v1/auth/${mode}`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
