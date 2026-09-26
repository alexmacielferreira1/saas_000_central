import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NewProductUserDialog from './NewProductUserDialog';
import { createProductUser, listSaas } from '@/api/saasRegistry';

vi.mock('@/api/saasRegistry', () => ({
  listSaas: vi.fn(),
  createProductUser: vi.fn(),
}));

describe('NewProductUserDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listSaas.mockResolvedValue([{ id: 'saas-1', name: 'MediaMind AI' }]);
    createProductUser.mockResolvedValue({ id: 'pu-1', email: 'editor@example.com' });
  });

  it('persists a product user using the SaaS id', async () => {
    const onCreated = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <NewProductUserDialog open onOpenChange={onOpenChange} onCreated={onCreated} />,
    );

    await waitFor(() => expect(listSaas).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText('SaaS *'), { target: { value: 'saas-1' } });
    fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'editor@example.com' } });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Editor' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => expect(createProductUser).toHaveBeenCalledWith(expect.objectContaining({
      saas_product_id: 'saas-1',
      email: 'editor@example.com',
      full_name: 'Editor',
    })));
    expect(onCreated).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
