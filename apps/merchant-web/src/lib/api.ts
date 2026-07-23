const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7101";

type ApiOptions = RequestInit & { skipAuth?: boolean };

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
  const headers = new Headers(options.headers || {});

  if (!options.skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("jwt");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || "Request failed";
    throw new Error(message);
  }

  return data.data as T;
}

export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("jwt");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || "Upload failed";
    throw new Error(message);
  }

  return data.data as T;
}

export function decodeJwt(token: string) {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(decoded);
    if (!parsed.roles && parsed.role) {
      parsed.roles = [parsed.role];
    }
    return parsed;
  } catch {
    return null;
  }
}
