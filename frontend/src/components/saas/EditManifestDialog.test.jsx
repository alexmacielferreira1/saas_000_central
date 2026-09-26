import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import EditManifestDialog from './EditManifestDialog';

const upsertCapabilityManifest = vi.fn();

vi.mock('@/api/saasRegistry', () => ({
  upsertCapabilityManifest: (...args) => upsertCapabilityManifest(...args),
}));

describe('EditManifestDialog', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('validates JSON and publishes the structured manifest', async () => {
    const onPublished = vi.fn();
    const onOpenChange = vi.fn();
    upsertCapabilityManifest.mockResolvedValue({
      id: 'manifest-1',
      version: '1.1.0',
      capabilities: ['users.read'],
    });

    render(
      <EditManifestDialog
        open
        productId="saas-1"
        manifest={{ version: '1.0.0', capabilities: ['users.read'] }}
        onOpenChange={onOpenChange}
        onPublished={onPublished}
      />,
    );

    fireEvent.change(screen.getByLabelText('Versão do manifesto *'), {
      target: { value: '1.1.0' },
    });
    fireEvent.change(screen.getByLabelText('Capabilities (JSON)'), {
      target: { value: '["users.read"]' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publicar manifesto' }));

    await waitFor(() => expect(upsertCapabilityManifest).toHaveBeenCalledWith(
      'saas-1',
      expect.objectContaining({ version: '1.1.0', capabilities: ['users.read'] }),
    ));
    expect(onPublished).toHaveBeenCalledWith(expect.objectContaining({ id: 'manifest-1' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not submit invalid JSON', async () => {
    render(
      <EditManifestDialog
        open
        productId="saas-1"
        onOpenChange={vi.fn()}
        onPublished={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Capabilities (JSON)'), {
      target: { value: '[invalid' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publicar manifesto' }));

    expect((await screen.findByRole('alert')).textContent).toContain('JSON inválido');
    expect(upsertCapabilityManifest).not.toHaveBeenCalled();
  });
});
