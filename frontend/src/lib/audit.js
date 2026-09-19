import { base44 } from "@/api/base44Client";

// Best-effort, UI-originated audit write. Actor resolved from the current session.
// Never throws — audit must not block the primary action.
export async function writeAudit({
  action, saas, tenant = "", entity, entityId, before = "", after = "", reason,
  result = "success", origin = "ui",
}) {
  try {
    let actor = "anonymous";
    try {
      const me = await base44.auth.me();
      if (me?.email) actor = me.email;
    } catch {}
    await base44.entities.Audit.create({
      actor,
      saas: saas || "central",
      tenant: tenant || "",
      action,
      entity: entity || "",
      entity_id: entityId || "",
      before: before || "",
      after: after || "",
      reason: reason || "",
      result,
      origin,
    });
  } catch {
    // audit is best-effort; swallow to avoid blocking the primary action
  }
}
