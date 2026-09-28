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
  listCapabilityManifests: vi.fn().mockResolvedValue([]),
  getCapabilityManifest: vi.fn().mockResolvedValue(null),
  upsertCapabilityManifest: vi.fn(),
  listProductUsers: vi.fn().mockResolvedValue([]),
  createProductUser: vi.fn(),
  listConfigurations: vi.fn().mockResolvedValue([]),
  createConfiguration: vi.fn(),
  listAuditLogs: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/api/access', () => ({
  listManagers: vi.fn().mockResolvedValue([]),
  createManager: vi.fn(),
  listPermissions: vi.fn().mockResolvedValue([]),
  createPermission: vi.fn(),
  listProfiles: vi.fn().mockResolvedValue([]),
  createProfile: vi.fn(),
}));

vi.mock('@/api/operations', () => ({
  listOperations: vi.fn().mockResolvedValue([]),
  createOperation: vi.fn(),
  updateOperationStatus: vi.fn(),
}));

vi.mock('@/api/integrations', () => ({
  listConnections: vi.fn().mockResolvedValue([]),
  listObservations: vi.fn().mockResolvedValue([]),
  createConnection: vi.fn(),
  probeConnection: vi.fn(),
}));

vi.mock('@/api/controlResources', () => ({
  listControlResources: vi.fn().mockResolvedValue([]),
  createControlResource: vi.fn(),
  updateControlResource: vi.fn(),
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
  ['/control-map', 'Mapa de controle'],
  ['/resolution', 'Central de Resolução'],
  ['/data/imports/new', 'PowerQuery de importação'],
  ['/api-guides', 'Guias das APIs (Guarda-chuva)'],
  ['/saas', 'SaaS 360'],
  ['/saas/saas-1', 'Produto de teste'],
  ['/administration', 'Administração'],
  ['/administration/overview', 'Visão da administração'],
  ['/experience/screens', 'Governança de telas'],
  ['/experience/feature-flags', 'Módulos e feature flags'],
  ['/users', 'Administração'],
  ['/configurations', 'Configurações & Feature Flags'],
  ['/operations', 'Centro de Operações'],
  ['/operations/jobs', 'Jobs e execuções'],
  ['/audit', 'Auditoria distribuída'],
  ['/incidents', 'Incidentes & Problemas'],
  ['/integrations', 'Integrações e saúde'],
  ['/health', 'Saúde operacional'],
  ['/errors', 'Erros e evidências'],
  ['/commercial/plans', 'Planos e produtos'],
  ['/usage', 'Uso e custos'],
  ['/costs', 'Uso e custos'],
  ['/ai/governance', 'Governança de IA'],
  ['/storage', 'Storage e arquivos'],
  ['/operations/releases', 'Versões e publicações'],
  ['/security', 'Segurança e acessos'],
  ['/privacy/data-inventory', 'Privacidade e LGPD'],
  ['/continuity/backups', 'Continuidade e backups'],
  ['/docs', 'Documentação operacional'],
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
