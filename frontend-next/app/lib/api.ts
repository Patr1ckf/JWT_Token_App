const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

type ApiOptions = RequestInit & {
  auth?: boolean;
};

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}

export async function apiFetch(
  path: string,
  { auth = true, headers, ...options }: ApiOptions = {}
) {
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...normalizeHeaders(headers),
  };

  if (auth) {
    const token = localStorage.getItem("access_token");
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: finalHeaders,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    const error = new Error(data?.error || "API error");
    (error as any).status = res.status;
    throw error;
  }

  return data;
}
