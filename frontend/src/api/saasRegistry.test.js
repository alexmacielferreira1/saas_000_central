import { afterEach, describe, expect, it, vi } from 'vitest';

import { createSaas, getSaas, listAuditLogs, listSaas, updateSaas } from './saasRegistry';

describe('native SaaS registry client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lists products through the native credentialed API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: '1', name: 'MediaMind AI' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(listSaas()).resolves.toEqual([{ id: '1', name: 'MediaMind AI' }]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8011/api/v1/saas',
      expect.objectContaining({ credentials: 'include', method: 'GET' }),
    );
  });

  it('creates products through the native API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: '1', name: 'MediaMind AI' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await createSaas({ name: 'MediaMind AI', slug: 'mediamind-ai' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8011/api/v1/saas',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'MediaMind AI', slug: 'mediamind-ai' }),
      }),
    );
  });

  it('loads one product through the native API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'saas-1', name: 'MediaMind AI' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getSaas('saas-1')).resolves.toMatchObject({ name: 'MediaMind AI' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8011/api/v1/saas/saas-1',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('updates one product through the native API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'saas-1', name: 'MediaMind Control' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await updateSaas('saas-1', { name: 'MediaMind Control' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8011/api/v1/saas/saas-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'MediaMind Control' }),
      }),
    );
  });

  it('loads tenant audit events through the native API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 'audit-1', action: 'saas.update' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(listAuditLogs()).resolves.toEqual([{ id: 'audit-1', action: 'saas.update' }]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8011/api/v1/audit',
      expect.objectContaining({ credentials: 'include', method: 'GET' }),
    );
  });
});
