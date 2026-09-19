import { useCallback, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { ACTIONS } from "@/lib/quickActions";
import { tierForUser, ROLE_CAPABILITIES } from "@/lib/permissions";

export function usePermissions() {
  const { user } = useAuth();
  const tier = tierForUser(user);
  const allowedIds = useMemo(() => new Set(ROLE_CAPABILITIES[tier] || []), [tier]);
  const can = useCallback((actionId) => allowedIds.has(actionId), [allowedIds]);
  const allowedActions = useMemo(() => ACTIONS.filter((a) => allowedIds.has(a.id)), [allowedIds]);
  return { tier, allowedIds, allowedActions, can };
}