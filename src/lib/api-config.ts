const resolveEnvValue = (value: string | undefined): string => value?.trim() ?? "";

const normalizeBaseUrl = (baseUrl: string): string => {
  if (!baseUrl) return "";
  return baseUrl.replace(/\/+$/, "");
};

const API_BASE_URL = normalizeBaseUrl(resolveEnvValue(import.meta.env.VITE_API_BASE_URL));
const API_AUTH_TOKEN = resolveEnvValue(import.meta.env.VITE_API_AUTH_TOKEN);

export const withApiBaseUrl = (path: string, fallbackUrl: string): string => {
  if (!API_BASE_URL) return fallbackUrl;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const buildApiHeaders = (overrides?: HeadersInit): Headers => {
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "1",
  });

  if (API_AUTH_TOKEN) {
    headers.set("Authorization", `Bearer ${API_AUTH_TOKEN}`);
  }

  if (overrides) {
    const overrideHeaders = new Headers(overrides);
    overrideHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
};

export const withApiRequestConfig = (requestInit: RequestInit = {}): RequestInit => ({
  ...requestInit,
  headers: buildApiHeaders(requestInit.headers),
});