const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
