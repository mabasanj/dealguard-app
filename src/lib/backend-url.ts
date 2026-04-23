const DEFAULT_LOCAL_BACKEND_API_URL = 'http://localhost:5000/api';
const DEFAULT_RENDER_BACKEND_API_URL = 'https://dealguard-backend.onrender.com/api';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function ensureApiSuffix(value: string): string {
  const normalized = trimTrailingSlash(value);
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}

export function getBackendApiBaseUrl(): string {
  const explicitBackend = process.env.BACKEND_API_URL;
  if (explicitBackend) {
    return ensureApiSuffix(explicitBackend);
  }

  const publicApi = process.env.NEXT_PUBLIC_API_URL;
  if (publicApi && /^https?:\/\//i.test(publicApi)) {
    return ensureApiSuffix(publicApi);
  }

  if (process.env.RENDER) {
    return DEFAULT_RENDER_BACKEND_API_URL;
  }

  return DEFAULT_LOCAL_BACKEND_API_URL;
}

export function getSocketServerUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return trimTrailingSlash(process.env.NEXT_PUBLIC_SOCKET_URL);
  }

  const backendApiBase = getBackendApiBaseUrl();
  return backendApiBase.replace(/\/api$/, '');
}
