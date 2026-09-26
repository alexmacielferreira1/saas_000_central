import '@testing-library/jest-dom/vitest';
import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from './AuthContext';

const sessionPayload = {
  user: {
    id: 'user-1',
    email: 'alexmacielferreira@gmail.com',
    full_name: 'Alex Maciel',
  },
  memberships: [
    { tenant_id: 'tenant-1', tenant_name: 'Central SaaS', role: 'superadmin' },
  ],
  selected_tenant_id: 'tenant-1',
};

function jsonResponse(payload, { status = 200 } = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

let latestAuth;

function Probe() {
  latestAuth = useAuth();
  return (
    <div>
      <span>{latestAuth.user?.email || 'anonymous'}</span>
      <span>{latestAuth.authError?.message || 'no-error'}</span>
      <span>{latestAuth.user?.role || 'no-role'}</span>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    latestAuth = undefined;
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('restores a credentialed session without browser storage', async () => {
    fetch.mockResolvedValue(jsonResponse(sessionPayload));

    render(<AuthProvider><Probe /></AuthProvider>);

    expect(await screen.findByText('alexmacielferreira@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('superadmin')).toBeInTheDocument();
    expect(fetch.mock.calls[0][0]).toMatch(/\/api\/v1\/auth\/session$/);
    expect(fetch.mock.calls[0][1]).toEqual(expect.objectContaining({ credentials: 'include' }));
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('treats a 401 session restore as anonymous without a noisy error', async () => {
    fetch.mockResolvedValue(jsonResponse({ message: 'Sessao ausente.' }, { status: 401 }));

    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(latestAuth.authChecked).toBe(true));
    expect(screen.getByText('anonymous')).toBeInTheDocument();
    expect(screen.getByText('no-error')).toBeInTheDocument();
    expect(latestAuth.isAuthenticated).toBe(false);
  });

  it('exposes a non-401 session restoration failure', async () => {
    fetch.mockResolvedValue(jsonResponse({ message: 'Servico indisponivel.' }, { status: 503 }));

    render(<AuthProvider><Probe /></AuthProvider>);

    expect(await screen.findByText('Servico indisponivel.')).toBeInTheDocument();
    expect(latestAuth.isAuthenticated).toBe(false);
  });

  it('updates the authenticated state after email login', async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({ message: 'Sessao ausente.' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse(sessionPayload));

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(latestAuth.authChecked).toBe(true));

    await act(async () => {
      await latestAuth.login('alexmacielferreira@gmail.com', 'secret');
    });

    expect(screen.getByText('alexmacielferreira@gmail.com')).toBeInTheDocument();
    expect(latestAuth.memberships).toEqual(sessionPayload.memberships);
    expect(latestAuth.selectedTenantId).toBe('tenant-1');
  });

  it.each([204, 401])('clears local state when logout responds with %s', async (status) => {
    fetch
      .mockResolvedValueOnce(jsonResponse(sessionPayload))
      .mockResolvedValueOnce(status === 204
        ? new Response(null, { status: 204 })
        : jsonResponse({ message: 'Sessao ja encerrada.' }, { status: 401 }));

    render(<AuthProvider><Probe /></AuthProvider>);
    expect(await screen.findByText('alexmacielferreira@gmail.com')).toBeInTheDocument();

    await act(async () => {
      await latestAuth.logout(false);
    });

    expect(screen.getByText('anonymous')).toBeInTheDocument();
    expect(latestAuth.isAuthenticated).toBe(false);
  });

  it('builds the backend Google start URL without creating a browser token', async () => {
    fetch.mockResolvedValue(jsonResponse({ message: 'Sessao ausente.' }, { status: 401 }));
    const navigate = vi.fn();

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(latestAuth.authChecked).toBe(true));

    const url = latestAuth.loginWithGoogle(navigate);

    expect(navigate.mock.calls[0][0]).toMatch(/\/api\/v1\/auth\/google\/start$/);
    expect(url).toMatch(/\/api\/v1\/auth\/google\/start$/);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
