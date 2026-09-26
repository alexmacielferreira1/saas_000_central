import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Login from './Login';

const login = vi.fn();
const loginWithGoogle = vi.fn();

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ login, loginWithGoogle }),
}));

function renderLogin(entry = '/login') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<div>Central dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Login', () => {
  beforeEach(() => {
    login.mockReset();
    loginWithGoogle.mockReset();
  });

  afterEach(cleanup);

  it('shows configuration guidance for a Google callback configuration error', () => {
    renderLogin('/login?google_error=not_configured');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Google ainda não está configurado neste ambiente',
    );
  });

  it('shows a safe message when the Google account is not allowed', () => {
    renderLogin('/login?google_error=account_not_allowed');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Esta conta Google ainda não possui acesso à Central',
    );
  });

  it('submits credentials through AuthContext and returns to the requested route', async () => {
    login.mockResolvedValue({});
    renderLogin('/login?returnTo=%2Fdashboard');

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alex@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('alex@example.com', 'secret'));
    expect(await screen.findByText('Central dashboard')).toBeInTheDocument();
  });

  it('starts Google login through AuthContext', () => {
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(loginWithGoogle).toHaveBeenCalledTimes(1);
  });
});
