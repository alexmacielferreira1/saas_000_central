import '@testing-library/jest-dom/vitest';
import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from '@/components/ProtectedRoute';
import { ADMIN_ROUTES, PUBLIC_ROUTES } from './routes';

const { authState } = vi.hoisted(() => ({
  authState: { current: null },
}));

function authenticatedState() {
  return {
    user: { email: 'admin@example.com', role: 'superadmin' },
    memberships: [],
    selectedTenantId: 'tenant-1',
    isAuthenticated: true,
    isLoadingAuth: false,
    authChecked: true,
    authError: null,
  };
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

vi.mock('@/api/base44Client', () => {
  const emptyEntity = () => ({
    list: vi.fn().mockResolvedValue([]),
    filter: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
  });

  return { base44: {
    auth: {
      me: vi.fn().mockResolvedValue({}),
      register: vi.fn(),
      verifyOtp: vi.fn(),
      resendOtp: vi.fn(),
      resetPasswordRequest: vi.fn(),
      resetPassword: vi.fn(),
      loginWithProvider: vi.fn(),
      setToken: vi.fn(),
    },
    entities: {
      Saas: emptyEntity(),
      Incident: emptyEntity(),
      Configuration: emptyEntity(),
      AdminCommand: emptyEntity(),
      Manager: emptyEntity(),
      ProductUser: emptyEntity(),
      CapabilityManifest: emptyEntity(),
      Audit: emptyEntity(),
    },
    functions: { invoke: vi.fn().mockResolvedValue({ data: {} }) },
  } };
});

vi.mock('@/api/saasRegistry', () => ({
  listSaas: vi.fn().mockResolvedValue([]),
  createSaas: vi.fn(),
  updateSaas: vi.fn(),
  getSaas: vi.fn().mockResolvedValue({
    id: 'saas-1',
    name: 'Produto de teste',
    slug: 'produto-teste',
    status: 'connected',
    health: 'healthy',
  }),
}));

vi.mock('@/api/access', () => ({
  listManagers: vi.fn().mockResolvedValue([]),
  createManager: vi.fn(),
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => authState.current,
}));

vi.mock('@/lib/TenantContext', () => ({
  useOrgId: () => 'tenant-1',
  useTenant: () => ({ orgId: 'tenant-1', organizations: [] }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  authState.current = authenticatedState();
});

authState.current = authenticatedState();

const ADMIN_CASES = [
  ['/', 'Home do ecossistema'],
  ['/resolution', 'Central de Resolução'],
  ['/api-guides', 'Guias das APIs (Guarda-chuva)'],
  ['/saas', 'SaaS 360'],
  ['/saas/saas-1', 'Produto de teste'],
  ['/users', 'Usuários & Acesso'],
  ['/configurations', 'Configurações & Feature Flags'],
  ['/operations', 'Centro de Operações'],
  ['/audit', 'Auditoria distribuída'],
  ['/incidents', 'Incidentes & Problemas'],
  ['/integrations', 'Integrações & Health Center'],
];

describe('administrative route rendering', () => {
  it.each(ADMIN_CASES)('renders %s with its page heading', async (path, heading) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          {ADMIN_ROUTES.map(({ path: routePath, Component }) => (
            <Route key={routePath} path={routePath} element={<Component />} />
          ))}
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it.each(ADMIN_CASES)('blocks anonymous access to %s', async (path) => {
    authState.current = {
      ...authenticatedState(),
      user: null,
      isAuthenticated: false,
    };

    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
            {ADMIN_ROUTES.map(({ path: routePath, Component }) => (
              <Route key={routePath} path={routePath} element={<Component />} />
            ))}
          </Route>
          <Route path="/login" element={<h1>Tela de login protegida</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Tela de login protegida' })).toBeInTheDocument();
  });
});

const PUBLIC_CASES = [
  ['/login', 'Welcome back'],
  ['/register', 'Create your account'],
  ['/forgot-password', 'Reset password'],
  ['/reset-password?token=test-token', 'New password'],
];

describe('public route rendering', () => {
  it.each(PUBLIC_CASES)('renders %s with its page heading', async (path, heading) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          {PUBLIC_ROUTES.map(({ path: routePath, Component }) => (
            <Route key={routePath} path={routePath} element={<Component />} />
          ))}
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });
});
