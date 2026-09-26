import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/lib/AuthContext";

const TenantContext = createContext(null);

function tenantAvatar(name) {
  return name?.trim().charAt(0).toUpperCase() || "E";
}

export function TenantProvider({ children }) {
  const { memberships = [], selectedTenantId } = useAuth();
  const organizations = useMemo(() => memberships.map((membership) => ({
    id: membership.tenant_id,
    name: membership.tenant_name,
    avatar: tenantAvatar(membership.tenant_name),
    role: membership.role,
  })), [memberships]);
  const [orgId, setOrgIdState] = useState(selectedTenantId || organizations[0]?.id || null);

  useEffect(() => {
    const requested = selectedTenantId || organizations[0]?.id || null;
    setOrgIdState((current) => (
      organizations.some(({ id }) => id === current) ? current : requested
    ));
  }, [organizations, selectedTenantId]);

  const setOrgId = useCallback((id) => {
    if (organizations.some((organization) => organization.id === id)) {
      setOrgIdState(id);
    }
  }, [organizations]);

  return (
    <TenantContext.Provider value={{ orgId, setOrgId, organizations }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within a TenantProvider");
  return ctx;
}

export function useOrgId() {
  return useTenant().orgId;
}
