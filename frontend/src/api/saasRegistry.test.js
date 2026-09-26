import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createSaas,
  getCapabilityManifest,
  getSaas,
  listAuditLogs,
  listCapabilityManifests,
  listProductUsers,
  listSaas,
  createProductUser,
  updateSaas,
  upsertCapabilityManifest,
} from './saasRegistry';

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

  it('lists and loads native capability manifests', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 'manifest-1', saas_product_id: 'saas-1' }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'manifest-1', saas_product_id: 'saas-1' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(listCapabilityManifests()).resolves.toHaveLength(1);
    await expect(getCapabilityManifest('saas-1')).resolves.toMatchObject({ id: 'manifest-1' });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:8011/api/v1/manifests',
      expect.objectContaining({ credentials: 'include', method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:8011/api/v1/manifests/saas-1',
      expect.objectContaining({ credentials: 'include', method: 'GET' }),
    );
  });

  it('publishes a capability manifest through the native API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'manifest-1', version: '1.0.0' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const payload = { version: '1.0.0', capabilities: ['users.read'] };

    await upsertCapabilityManifest('saas-1', payload);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8011/api/v1/manifests/saas-1',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(payload) }),
    );
  });

  it('lists product users with an optional SaaS filter', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 'pu-1', email: 'editor@example.com' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(listProductUsers('saas-1')).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8011/api/v1/product-users?saas_product_id=saas-1',
      expect.objectContaining({ credentials: 'include', method: 'GET' }),
    );
  });

  it('creates a product user through the native API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'pu-1', email: 'editor@example.com' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const payload = { saas_product_id: 'saas-1', email: 'editor@example.com' };

    await createProductUser(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8011/api/v1/product-users',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }),
    );
  });
});
