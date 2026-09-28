import '@testing-library/jest-dom/vitest';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { CommercialCenter, ScreenGovernance } from './CapabilityCenters';

const { records } = vi.hoisted(() => ({
  records: [{
    id: 'resource-1', kind: 'plan', key: 'pro', name: 'Plano Pro', description: 'Plano completo',
    status: 'active', version: 1, data: { price: '199', currency: 'BRL', modules: 'Administração, IA' },
  }],
}));

vi.mock('@/api/saasRegistry', () => ({
  listSaas: vi.fn().mockResolvedValue([]),
  listCapabilityManifests: vi.fn().mockResolvedValue([]),
  listConfigurations: vi.fn().mockResolvedValue([]),
  listAuditLogs: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/api/integrations', () => ({ listConnections: vi.fn().mockResolvedValue([]), listObservations: vi.fn().mockResolvedValue([]) }));
vi.mock('@/api/operations', () => ({ listOperations: vi.fn().mockResolvedValue([]) }));
vi.mock('@/api/controlResources', () => ({
  listControlResources: vi.fn((kind) => Promise.resolve(kind === 'plan' ? records : [{ ...records[0], kind: 'product_module', data: { route: '/administration', owner: 'Plataforma' } }])),
  createControlResource: vi.fn(),
  updateControlResource: vi.fn().mockResolvedValue({ ...records[0], name: 'Plano Pro atualizado', version: 2 }),
}));

afterEach(() => cleanup());

describe('capability centers', () => {
  it('opens the selected item in an inline workspace instead of navigating away', async () => {
    render(<CommercialCenter />);
    fireEvent.click(await screen.findByRole('button', { name: /Abrir Plano Pro/i }));
    expect(screen.getByRole('heading', { name: 'Trabalhar no plano' })).toBeInTheDocument();
    expect(screen.getByLabelText('Preço mensal')).toHaveValue(199);
    expect(screen.getByLabelText('Moeda')).toHaveValue('BRL');
    expect(screen.queryByRole('link', { name: /Administrar no SaaS 360/i })).not.toBeInTheDocument();
  });

  it('persists contextual edits without leaving the screen', async () => {
    const { updateControlResource } = await import('@/api/controlResources');
    render(<CommercialCenter />);
    fireEvent.click(await screen.findByRole('button', { name: /Abrir Plano Pro/i }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Plano Pro atualizado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(updateControlResource).toHaveBeenCalledWith('resource-1', expect.objectContaining({ name: 'Plano Pro atualizado' })));
  });

  it('gives screen governance its own hierarchy fields', async () => {
    render(<ScreenGovernance />);
    fireEvent.click(await screen.findByRole('button', { name: /Abrir Plano Pro/i }));
    expect(screen.getByRole('heading', { name: 'Trabalhar no módulo' })).toBeInTheDocument();
    expect(screen.getByLabelText('Rota principal')).toHaveValue('/administration');
    expect(screen.getByLabelText('Responsável')).toHaveValue('Plataforma');
  });
});
