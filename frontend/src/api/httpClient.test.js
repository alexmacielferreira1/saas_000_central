import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, request } from './httpClient';

function jsonResponse(payload, { status = 200 } = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('httpClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends JSON requests with the session cookie enabled', async () => {
    fetch.mockResolvedValue(jsonResponse({ ok: true }));

    await expect(request('/auth/login', {
      method: 'POST',
      body: { email: 'alex@example.com', password: 'secret' },
    })).resolves.toEqual({ ok: true });

    expect(fetch.mock.calls[0][0]).toMatch(/\/api\/v1\/auth\/login$/);
    expect(fetch.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alex@example.com', password: 'secret' }),
      }),
    );
  });

  it('returns null for a successful response without content', async () => {
    fetch.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(request('/auth/logout', { method: 'POST' })).resolves.toBeNull();
  });

  it('turns the backend error envelope into an ApiError', async () => {
    fetch.mockResolvedValue(jsonResponse({
      error_code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Verifique os dados enviados.',
      retryable: false,
      public_reference: 'ref-123',
    }, { status: 401 }));

    const error = await request('/auth/login').catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 401,
      errorCode: 'AUTH_INVALID_CREDENTIALS',
      message: 'Verifique os dados enviados.',
      retryable: false,
      publicReference: 'ref-123',
    });
  });
});
