const PRODUCTION_API_URL = 'https://senafoodweb-production.up.railway.app';

const isLocalHost = (host) => host === 'localhost' || host === '127.0.0.1';

const normalizeConfiguredApiUrl = (configuredUrl) => {
  if (!configuredUrl) {
    return '';
  }

  if (typeof window === 'undefined') {
    return configuredUrl;
  }

  try {
    const parsedUrl = new URL(configuredUrl, window.location.origin);
    if (!isLocalHost(window.location.hostname) && isLocalHost(parsedUrl.hostname)) {
      return PRODUCTION_API_URL;
    }
    return parsedUrl.toString().replace(/\/$/, '');
  } catch {
    return configuredUrl;
  }
};

const getDefaultApiUrl = () => {
  if (typeof window !== 'undefined' && isLocalHost(window.location.hostname)) {
    return 'http://localhost:8000';
  }

  return PRODUCTION_API_URL;
};

const API_URL = normalizeConfiguredApiUrl(import.meta.env.VITE_API_URL) || getDefaultApiUrl();

export const buildApiUrl = (path) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_URL}${path}`;
};

const getErrorMessage = (payload) => {
  if (!payload) return 'Error en la solicitud.';
  if (typeof payload === 'string') return payload;
  if (payload.detail) return payload.detail;
  if (payload.message) return payload.message;
  return 'Error en la solicitud.';
};

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, headers, token } = options;
  const isFormData = body instanceof FormData;
  const requestHeaders = {
    ...(headers || {}),
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (body && !isFormData && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(buildApiUrl(path), {
    method,
    headers: requestHeaders,
    body: body
      ? isFormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  return payload;
}
