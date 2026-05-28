const DEFAULT_FASTAPI_BASE_URL = "http://localhost:8000";

export function getFastApiBaseUrl(): string {
  return process.env.FASTAPI_BASE_URL ?? DEFAULT_FASTAPI_BASE_URL;
}

const DEFAULT_PROXY_TIMEOUT_MS = 15_000;

export async function proxyToFastApi(
  path: string,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_PROXY_TIMEOUT_MS,
): Promise<Response> {
  const base = getFastApiBaseUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return fetch(`${base}${normalizedPath}`, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(timeoutMs),
  });
}

export async function proxyJson(path: string, init?: RequestInit) {
  const response = await proxyToFastApi(path, init);
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = await response.json();
    return { response, data };
  }

  const text = await response.text();
  return { response, data: text };
}
