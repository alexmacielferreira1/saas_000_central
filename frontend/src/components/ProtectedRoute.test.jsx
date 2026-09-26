import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ProtectedRoute from './ProtectedRoute';

let authState;

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => authState,
}));

function renderProtected(overrides = {}) {
  authState = {
    isAuthenticated: false,
    isLoadingAuth: false,
    authChecked: true,
    authError: null,
    checkUserAuth: vi.fn(),
    user: null,
    ...overrides,
  };

  return render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route
          element={(
            <ProtectedRoute
              unauthenticatedElement={<Navigate to="/login" replace />}
              fallback={<div data-testid="auth-loading">Carregando</div>}
            />
          )}
        >
          <Route path="/private" element={<div>Conteudo privado</div>} />
        </Route>
        <Route path="/login" element={<div>Tela de login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('ProtectedRoute', () => {
  it('does not redirect while session restoration is pending', () => {
    renderProtected({ isLoadingAuth: true, authChecked: false });

    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
    expect(screen.queryByText('Tela de login')).not.toBeInTheDocument();
  });

  it('redirects after the anonymous session check has settled', () => {
    renderProtected();

    expect(screen.getByText('Tela de login')).toBeInTheDocument();
  });

  it('renders the private route for an authenticated superadmin', () => {
    renderProtected({
      isAuthenticated: true,
      user: { email: 'alex@example.com', role: 'superadmin' },
    });

    expect(screen.getByText('Conteudo privado')).toBeInTheDocument();
  });
});
