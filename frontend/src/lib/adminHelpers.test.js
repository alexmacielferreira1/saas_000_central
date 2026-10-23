import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  SENSITIVE_KEYWORDS_FALLBACK,
  applyOperationPolicy,
  isSensitiveAction,
} from './adminHelpers';
import { getOperationPolicy } from '@/api/operations';

describe('sensitive operation policy', () => {
  afterEach(() => {
    applyOperationPolicy({ sensitive_terms: SENSITIVE_KEYWORDS_FALLBACK });
    vi.unstubAllGlobals();
  });

  it('uses the backend-identical fallback before the policy loads', () => {
    expect(isSensitiveAction('disable tenant X')).toBe(true);
    expect(isSensitiveAction('Excluir usuário')).toBe(true);
    expect(isSensitiveAction('close incident')).toBe(true);
    expect(isSensitiveAction('sync users')).toBe(false);
  });

  it('adopts the list served by the backend', () => {
    applyOperationPolicy({ sensitive_terms: ['SYNC'] });
    expect(isSensitiveAction('sync users')).toBe(true);
    expect(isSensitiveAction('delete user')).toBe(false);
  });

  it('ignores malformed policies and keeps the current list', () => {
    applyOperationPolicy({ sensitive_terms: [] });
    applyOperationPolicy({ sensitive_terms: ['ok', 3] });
    applyOperationPolicy(null);
    expect(isSensitiveAction('delete user')).toBe(true);
  });

  it('fetches the policy from the operations API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ sensitive_terms: ['delete'] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(getOperationPolicy()).resolves.toEqual({ sensitive_terms: ['delete'] });
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/operations\/policy$/);
  });
});
