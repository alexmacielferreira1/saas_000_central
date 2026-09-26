const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');

if (import.meta.env.PROD && !configuredApiUrl) {
  throw new Error('VITE_API_URL precisa ser configurada para o build de producao.');
}

export const API_URL = configuredApiUrl || 'http://127.0.0.1:8011';

export class ApiError extends Error {
  constructor(message, { status, errorCode, retryable = false, publicReference } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.retryable = retryable;
    this.publicReference = publicReference;
  }

  static async fromResponse(response) {
    let payload = {};
    try {
      payload = await response.json();
    } catch {
      // Some proxies return an empty or non-JSON error body.
    }

    return new ApiError(payload.message || 'Nao foi possivel concluir a solicitacao.', {
      status: response.status,
      errorCode: payload.error_code,
      retryable: Boolean(payload.retryable),
      publicReference: payload.public_reference,
    });
  }
}

export function apiUrl(path) {
  return `${API_URL}/api/v1${path}`;
}

export async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(apiUrl(path), {
    method,
    credentials: 'include',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }

  return response.status === 204 ? null : response.json();
}
