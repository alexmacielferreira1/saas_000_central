import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ResolutionCenter from './ResolutionCenter';

const api = vi.hoisted(() => ({
  listSaas: vi.fn(),
  listConfigurations: vi.fn(),
  listOperations: vi.fn(),
  updateOperationStatus: vi.fn(),
  listConnections: vi.fn(),
  probeConnection: vi.fn(),
}));

vi.mock('@/api/saasRegistry', () => ({ listSaas: api.listSaas, listConfigurations: api.listConfigurations }));
vi.mock('@/api/operations', () => ({
  listOperations: api.listOperations,
  updateOperationStatus: api.updateOperationStatus,
}));
vi.mock('@/api/integrations', () => ({
  listConnections: api.listConnections,
  probeConnection: api.probeConnection,
}));
vi.mock('@/api/base44Client', () => ({ base44: {} }));
vi.mock('@/lib/audit', () => ({ writeAudit: vi.fn() }));

const neverConnected = {
  id: 'saas-1',
  name: 'Viaje Mais',
  description: 'Reservas',
  status: 'unavailable',
  health: 'unknown',
  last_handshake: null,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ResolutionCenter />
    </MemoryRouter>
  );
}

describe('ResolutionCenter', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    api.listConfigurations.mockResolvedValue([]);
    api.listOperations.mockResolvedValue([]);
  });
  afterEach(cleanup);

  it('lists never-connected SaaS from the native registry instead of an all-clear', async () => {
    api.listSaas.mockResolvedValue([neverConnected]);

    renderPage();

    expect(await screen.findByText('Viaje Mais')).toBeInTheDocument();
    expect(screen.getByText('Não conectado')).toBeInTheDocument();
    expect(screen.queryByText('Tudo limpo')).not.toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('Incidentes ainda não foram migrados');
  });

  it('shows an error, never an empty state, when a native source fails', async () => {
    api.listSaas.mockRejectedValue(new Error('offline'));

    renderPage();

    expect(await screen.findByText('Não foi possível carregar os problemas do ecossistema.')).toBeInTheDocument();
    expect(screen.queryByText(/Nenhum problema/)).not.toBeInTheDocument();
  });

  it('pending native operations are approved through the operations API', async () => {
    api.listSaas.mockResolvedValue([]);
    api.listOperations.mockResolvedValue([
      {
        id: 'op-1',
        saas: 'mediamind-ai',
        product_tenant: 't1',
        resource: 'user',
        action: 'suspend',
        requested_by: 'alex',
        status: 'awaiting_confirmation',
        created_at: '2026-10-19T00:00:00Z',
      },
    ]);
    api.updateOperationStatus.mockResolvedValue({});

    renderPage();
    fireEvent.click(await screen.findByText('suspend · user'));
    fireEvent.click(screen.getByRole('button', { name: /Aprovar/ }));

    await waitFor(() =>
      expect(api.updateOperationStatus).toHaveBeenCalledWith('op-1', 'queued', 'Aprovado via Central de Resolução')
    );
  });

  it('verifies a SaaS now through its connection', async () => {
    api.listSaas.mockResolvedValue([neverConnected]);
    api.listConnections.mockResolvedValue([{ id: 'conn-9', product: { id: 'saas-1' } }]);
    api.probeConnection.mockResolvedValue({ status: 'healthy', failure_code: null });

    renderPage();
    fireEvent.click(await screen.findByText('Viaje Mais'));
    fireEvent.click(screen.getByRole('button', { name: /Verificar agora/ }));

    await waitFor(() => expect(api.probeConnection).toHaveBeenCalledWith('conn-9'));
  });

  it('explains how to connect a SaaS that has no connection yet', async () => {
    api.listSaas.mockResolvedValue([neverConnected]);
    api.listConnections.mockResolvedValue([]);

    renderPage();
    fireEvent.click(await screen.findByText('Viaje Mais'));
    fireEvent.click(screen.getByRole('button', { name: /Verificar agora/ }));

    expect(await screen.findByText(/Cadastre-a em Integrações/)).toBeInTheDocument();
    expect(api.probeConnection).not.toHaveBeenCalled();
  });
});
