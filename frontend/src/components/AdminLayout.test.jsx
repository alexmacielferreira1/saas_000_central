import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AdminLayout from './AdminLayout';
import { ARCHIVE_NAV, PRIMARY_NAV, SECONDARY_NAV, isArchiveOnlyPath } from '@/lib/navigation';
import { ADMIN_ROUTES } from '@/lib/routes';

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: { full_name: 'Alex', email: 'admin@central.test' }, logout: vi.fn() }),
}));
vi.mock('@/lib/TenantContext', () => ({ TenantProvider: ({ children }) => <>{children}</> }));
vi.mock('@/components/TenantSwitcher', () => ({ default: () => null }));
vi.mock('@/components/QuickActionsMenu', () => ({ default: () => null }));
vi.mock('@/components/CommandPalette', () => ({ default: () => null }));

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="*" element={<div>Conteúdo</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

const desktopNav = () => screen.getAllByRole('navigation', { name: 'Menu principal' })[0];

describe('AdminLayout navigation', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it('shows the compact prototype menu in order', () => {
    renderAt('/');
    const nav = desktopNav();
    const labels = within(nav).getAllByRole('link').map((link) => link.textContent);
    expect(labels).toEqual([
      'Início', 'Meus SaaS', 'Saúde', 'Problemas', 'Usuários', 'Financeiro', 'IA e Custos',
      'Criar SaaS', 'Publicações', 'Configurações',
    ]);
    expect(within(nav).getByRole('link', { name: 'Início' })).toHaveClass('bg-blue-50');
  });

  it('keeps the previous menu collapsed inside Arquivo and expands it on demand', () => {
    renderAt('/');
    const nav = desktopNav();
    const toggle = within(nav).getByRole('button', { name: 'Arquivo' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(within(nav).queryByRole('group', { name: 'Arquivo' })).not.toBeInTheDocument();

    fireEvent.click(toggle);

    const archive = within(desktopNav()).getByRole('group', { name: 'Arquivo' });
    expect(within(archive).getAllByRole('link').map((link) => link.textContent)).toEqual(
      ARCHIVE_NAV.map((item) => item.label)
    );
    expect(window.localStorage.getItem('central.nav.archiveOpen')).toBe('1');
  });

  it('opens Arquivo automatically on a screen reachable only from it', () => {
    renderAt('/audit');
    const archive = within(desktopNav()).getByRole('group', { name: 'Arquivo' });
    expect(within(archive).getByRole('link', { name: 'Auditoria' })).toHaveClass('bg-blue-50');
  });

  it('points Criar SaaS to the real creation dialog without marking it active', () => {
    renderAt('/saas');
    const nav = desktopNav();
    expect(within(nav).getByRole('link', { name: 'Criar SaaS' })).toHaveAttribute('href', '/saas?novo=saas');
    expect(within(nav).getByRole('link', { name: 'Criar SaaS' })).not.toHaveClass('bg-blue-50');
    expect(within(nav).getByRole('link', { name: 'Meus SaaS' })).toHaveClass('bg-blue-50');
  });
});

describe('navigation contract', () => {
  it('only links to registered admin routes', () => {
    const routes = new Set(ADMIN_ROUTES.map((route) => route.path));
    for (const item of [...PRIMARY_NAV, ...SECONDARY_NAV, ...ARCHIVE_NAV]) {
      expect(routes.has(item.to.split('?')[0])).toBe(true);
    }
  });

  it('classifies archive-only screens', () => {
    expect(isArchiveOnlyPath('/audit')).toBe(true);
    expect(isArchiveOnlyPath('/saas/abc')).toBe(false);
    expect(isArchiveOnlyPath('/')).toBe(false);
    expect(isArchiveOnlyPath('/nao-existe')).toBe(false);
  });
});
