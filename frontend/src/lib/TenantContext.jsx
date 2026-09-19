import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// Available organizations (tenants) for the Control Plane switcher.
// "default" is the baseline org where legacy records live.
export const ORGANIZATIONS = [
  { id: "default", name: "Central (Padrão)", avatar: "C" },
  { id: "acme", name: "Acme Corp", avatar: "A" },
  { id: "globex", name: "Globex Inc.", avatar: "G" },
];

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const { user } = useAuth();
  const [orgId, setOrgIdState] = useState("default");

  // Hydrate active org from the persisted user profile (updateMe store).
  useEffect(() => {
    const persisted = user?.organization_id || user?.data?.organization_id;
    if (persisted) setOrgIdState(persisted);
  }, [user]);

  const setOrgId = useCallback(async (id) => {
    setOrgIdState(id);
    // Persist on the user so it survives reloads; best-effort.
    try {
      await base44.auth.updateMe({ organization_id: id });
    } catch {
      /* swallow — tenant switch is still effective in-session */
    }
  }, []);

  return (
    <TenantContext.Provider value={{ orgId, setOrgId, organizations: ORGANIZATIONS }}>
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