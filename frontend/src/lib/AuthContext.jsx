import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { apiUrl, ApiError, request } from '@/api/httpClient';

const AuthContext = createContext(undefined);

function sessionState(payload) {
  const memberships = payload.memberships || [];
  const selectedTenantId = payload.selected_tenant_id || memberships[0]?.tenant_id || null;
  const selectedMembership = memberships.find(({ tenant_id }) => tenant_id === selectedTenantId)
    || memberships[0];

  return {
    user: {
      ...payload.user,
      name: payload.user.full_name,
      role: selectedMembership?.role || null,
    },
    memberships,
    selectedTenantId,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const clearSessionState = useCallback(() => {
    setUser(null);
    setMemberships([]);
    setSelectedTenantId(null);
    setIsAuthenticated(false);
  }, []);

  const applySession = useCallback((payload) => {
    const next = sessionState(payload);
    setUser(next.user);
    setMemberships(next.memberships);
    setSelectedTenantId(next.selectedTenantId);
    setIsAuthenticated(true);
    setAuthError(null);
    return next.user;
  }, []);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const payload = await request('/auth/session');
      applySession(payload);
      return payload;
    } catch (error) {
      clearSessionState();
      if (!(error instanceof ApiError && error.status === 401)) {
        setAuthError({
          type: error.errorCode || 'session_restore_failed',
          message: error.message || 'Nao foi possivel restaurar a sessao.',
          publicReference: error.publicReference,
        });
      }
      return null;
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, [applySession, clearSessionState]);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  const login = useCallback(async (email, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const payload = await request('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      applySession(payload);
      setAuthChecked(true);
      return payload;
    } catch (error) {
      clearSessionState();
      setAuthError({
        type: error.errorCode || 'login_failed',
        message: error.message || 'Nao foi possivel entrar.',
        publicReference: error.publicReference,
      });
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  }, [applySession, clearSessionState]);

  const loginWithGoogle = useCallback((navigate = (url) => window.location.assign(url)) => {
    const url = apiUrl('/auth/google/start');
    navigate(url);
    return url;
  }, []);

  const logout = useCallback(async (shouldRedirect = true) => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        throw error;
      }
    } finally {
      clearSessionState();
      setAuthError(null);
      setAuthChecked(true);
    }

    if (shouldRedirect) {
      window.location.assign('/login');
    }
  }, [clearSessionState]);

  const navigateToLogin = useCallback(() => {
    window.location.assign('/login');
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      memberships,
      selectedTenantId,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      authChecked,
      login,
      loginWithGoogle,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState: checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
