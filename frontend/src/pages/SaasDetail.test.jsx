import '@testing-library/jest-dom/vitest';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import SaasDetail from './SaasDetail';
import { getCapabilityManifest, getSaas, listConfigurations, listProductUsers } from '@/api/saasRegistry';
import { listOperations } from '@/api/operations';

vi.mock('@/api/saasRegistry', () => ({
  getSaas: vi.fn(),
  getCapabilityManifest: vi.fn().mockResolvedValue(null),
  listProductUsers: vi.fn().mockResolvedValue([]),
  listConfigurations: vi.fn().mockResolvedValue([]),
  updateSaas: vi.fn(),
  upsertCapabilityManifest: vi.fn(),
  createProductUser: vi.fn(),
  listSaas: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/api/operations', () => ({ listOperations: vi.fn().mockResolvedValue([]) }));

vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => false }) }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SaasDetail loading', () => {
  it('requests product data in parallel instead of waiting for the product', async () => {
    /** @type {(value: any) => void} */
    let resolveSaas = () => {};
    vi.mocked(getSaas).mockReturnValue(new Promise((resolve) => { resolveSaas = resolve; }));

    render(
      <MemoryRouter initialEntries={['/saas/saas-1']}>
        <Routes>
          <Route path="/saas/:id" element={<SaasDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(getSaas).toHaveBeenCalledWith('saas-1');
    expect(getCapabilityManifest).toHaveBeenCalledWith('saas-1');
    expect(listProductUsers).toHaveBeenCalledWith('saas-1');
    expect(listConfigurations).toHaveBeenCalledWith('saas-1');
    expect(listOperations).not.toHaveBeenCalled();

    resolveSaas({ id: 'saas-1', name: 'Produto de teste', slug: 'produto-teste', status: 'active', health: 'healthy' });

    expect(await screen.findByRole('heading', { name: 'Produto de teste' })).toBeInTheDocument();
    expect(listOperations).toHaveBeenCalledWith('Produto de teste');
  });
});
