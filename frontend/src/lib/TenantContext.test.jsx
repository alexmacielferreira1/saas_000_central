import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TenantProvider, useTenant } from './TenantContext';

const { updateMe } = vi.hoisted(() => ({ updateMe: vi.fn() }));

vi.mock('@/api/base44Client', () => ({
  base44: { auth: { updateMe } },
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    selectedTenantId: 'tenant-2',
    memberships: [
      { tenant_id: 'tenant-1', tenant_name: 'Central SaaS', role: 'superadmin' },
      { tenant_id: 'tenant-2', tenant_name: 'IAcervo Corp', role: 'admin' },
    ],
  }),
}));

function Probe() {
  const { orgId, organizations, setOrgId } = useTenant();
  return (
    <div>
      <span>{orgId}</span>
      {organizations.map((organization) => <span key={organization.id}>{organization.name}</span>)}
      <button onClick={() => setOrgId('tenant-1')}>Trocar empresa</button>
    </div>
  );
}

afterEach(() => {
  cleanup();
  updateMe.mockReset();
});

describe('TenantProvider', () => {
  it('derives selectable tenants only from backend memberships', () => {
    render(<TenantProvider><Probe /></TenantProvider>);

    expect(screen.getByText('tenant-2')).toBeInTheDocument();
    expect(screen.getByText('Central SaaS')).toBeInTheDocument();
    expect(screen.getByText('IAcervo Corp')).toBeInTheDocument();
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
  });

  it('switches locally without pretending to persist through Base44', () => {
    render(<TenantProvider><Probe /></TenantProvider>);

    fireEvent.click(screen.getByRole('button', { name: 'Trocar empresa' }));

    expect(screen.getByText('tenant-1')).toBeInTheDocument();
    expect(updateMe).not.toHaveBeenCalled();
  });
});
