import { afterEach, describe, expect, it, vi } from 'vitest';

import { createManager, listManagers, updateManager } from './access';

describe('native access client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lists tenant administrators', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: '1', email: 'alex@example.com' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ));
    await expect(listManagers()).resolves.toHaveLength(1);
  });

  it('creates an administrator with a temporary password', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: '2', email: 'gestora@example.com' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const values = { email: 'gestora@example.com', password: 'temporaria-segura' };
    await createManager(values);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8011/api/v1/access/managers',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(values) }),
    );
  });

  it('updates an administrator lifecycle state', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: '2', status: 'suspended' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await updateManager('2', { status: 'suspended' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8011/api/v1/access/managers/2',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'suspended' }) }),
    );
  });
});
