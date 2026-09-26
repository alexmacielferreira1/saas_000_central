import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Home from './Home';

const apiMocks = vi.hoisted(() => ({
  getHomeSummary: vi.fn(),
  listSaas: vi.fn(),
}));

vi.mock('@/api/home', () => ({ getHomeSummary: apiMocks.getHomeSummary }));
vi.mock('@/api/saasRegistry', () => ({ listSaas: apiMocks.listSaas }));

const summary = {
  products: { total: 2, connected: 1, degraded: 1 },
  operations: { availability: 'unavailable', active: null },
  incidents: { availability: 'unavailable', open: null },
};

describe('Home', () => {
  beforeEach(() => {
    apiMocks.getHomeSummary.mockResolvedValue(summary);
    apiMocks.listSaas.mockResolvedValue([
      { id: 'one', name: 'MediaMind AI', slug: 'mediamind-ai', status: 'connected', health: 'healthy' },
      { id: 'two', name: 'Produto em implantação', slug: 'implantacao', status: 'unavailable', health: 'degraded' },
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders tenant-scoped API metrics and marks unmigrated modules unavailable', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>);

    expect(await screen.findByText('MediaMind AI')).toBeInTheDocument();
    expect(screen.getByText('1 conectados')).toBeInTheDocument();
    expect(screen.getByText('requer atenção')).toBeInTheDocument();
    expect(screen.getAllByText('indisponível nesta etapa')).toHaveLength(2);
    expect(apiMocks.getHomeSummary).toHaveBeenCalledTimes(1);
    expect(apiMocks.listSaas).toHaveBeenCalledTimes(1);
  });

  it('shows a retryable error instead of false zeroes when the native API fails', async () => {
    apiMocks.getHomeSummary.mockRejectedValue(new Error('offline'));

    render(<MemoryRouter><Home /></MemoryRouter>);

    expect(await screen.findByText('Falha ao carregar o painel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });
});
