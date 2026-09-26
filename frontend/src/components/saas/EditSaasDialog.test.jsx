import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import EditSaasDialog from './EditSaasDialog';

const updateSaas = vi.fn();

vi.mock('@/api/saasRegistry', () => ({
  updateSaas: (...args) => updateSaas(...args),
}));

const product = {
  id: 'saas-1',
  name: 'MediaMind AI',
  slug: 'mediamind-ai',
  description: 'Produto audiovisual',
  version: '1.0.0',
  base_url: 'https://example.com',
  color: '#06b6d4',
  icon: 'Boxes',
  status: 'active',
  health: 'healthy',
  compatibility: 'native',
  integration_level: 'domain_resources',
};

describe('EditSaasDialog', () => {
  it('prefills, updates and reports the persisted product', async () => {
    const onUpdated = vi.fn();
    const onOpenChange = vi.fn();
    updateSaas.mockResolvedValue({ ...product, name: 'MediaMind Control' });

    render(
      <EditSaasDialog
        open
        product={product}
        onOpenChange={onOpenChange}
        onUpdated={onUpdated}
      />,
    );

    const name = screen.getByLabelText('Nome *');
    expect(name.value).toBe('MediaMind AI');
    fireEvent.change(name, { target: { value: 'MediaMind Control' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(updateSaas).toHaveBeenCalledWith(
      'saas-1',
      expect.objectContaining({ name: 'MediaMind Control', slug: 'mediamind-ai' }),
    ));
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ name: 'MediaMind Control' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
