import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { writeAudit } from "@/lib/audit";
import { Check, X, Loader2, ExternalLink, AlertTriangle } from "lucide-react";

// Context-dependent quick actions rendered inside an expanded ProblemCard.
// Each branch performs a real entity mutation + audit, then calls onMutated to reload.
export default function ResolutionActions({ problem, onMutated, navigate, resolution, setResolution }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { type, raw } = problem;

  const run = async (fn, auditPayload) => {
    setBusy(true);
    setErr("");
    try {
      await fn();
      if (auditPayload) await writeAudit(auditPayload);
      onMutated?.();
    } catch (e) {
      setErr(e?.message || "Falha ao executar a ação.");
    } finally {
      setBusy(false);
    }
  };

  if (type === "incident") {
    const investigating = raw.status === "investigating";
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600">Resolução</label>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={2}
            disabled={busy}
            placeholder="Descreva a causa e a ação tomada..."
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="h-8 gap-1.5"
            disabled={busy || !resolution.trim()}
            onClick={() =>
              run(
                () =>
                  base44.entities.Incident.update(raw.id, {
                    status: "resolved",
                    resolved_at: new Date().toISOString(),
                    resolution: resolution.trim(),
                  }),
                {
                  action: "incident.resolve",
                  saas: raw.saas || "central",
                  entity: "Incident",
                  entityId: raw.id,
                  before: JSON.stringify({ status: raw.status }),
                  after: JSON.stringify({ status: "resolved" }),
                  reason: resolution.trim() || "Resolução via Central de Resolução",
                }
              )
            }
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Resolver incidente
          </Button>
          {!investigating && (
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              disabled={busy}
              onClick={() =>
                run(
                  () => base44.entities.Incident.update(raw.id, { status: "investigating" }),
                  {
                    action: "incident.investigate",
                    saas: raw.saas || "central",
                    entity: "Incident",
                    entityId: raw.id,
                    before: JSON.stringify({ status: raw.status }),
                    after: JSON.stringify({ status: "investigating" }),
                  }
                )
              }
            >
              Marcar investigando
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-8" onClick={() => navigate("/incidents")}>
            Ver no painel
          </Button>
        </div>
        {err && <p className="text-xs text-rose-600">{err}</p>}
      </div>
    );
  }

  if (type === "command") {
    const pending = ["awaiting_confirmation", "draft"].includes(raw.status);
    if (pending) {
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              disabled={busy}
              onClick={() =>
                run(
                  () => base44.entities.AdminCommand.update(raw.id, { status: "queued" }),
                  {
                    action: "operation.approve",
                    saas: raw.saas,
                    tenant: raw.tenant,
                    entity: "AdminCommand",
                    entityId: raw.id,
                    before: JSON.stringify({ status: raw.status }),
                    after: JSON.stringify({ status: "queued" }),
                    reason: "Aprovado via Central de Resolução",
                  }
                )
              }
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"
              disabled={busy}
              onClick={() =>
                run(
                  () => base44.entities.AdminCommand.update(raw.id, { status: "cancelled" }),
                  {
                    action: "operation.reject",
                    saas: raw.saas,
                    tenant: raw.tenant,
                    entity: "AdminCommand",
                    entityId: raw.id,
                    before: JSON.stringify({ status: raw.status }),
                    after: JSON.stringify({ status: "cancelled" }),
                    reason: "Rejeitado via Central de Resolução",
                  }
                )
              }
            >
              <X className="h-3.5 w-3.5" /> Rejeitar
            </Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => navigate("/operations")}>
              Ver no Operation Center
            </Button>
          </div>
          {err && <p className="text-xs text-rose-600">{err}</p>}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"
            disabled={busy}
            onClick={() =>
              run(
                () => base44.entities.AdminCommand.update(raw.id, { status: "cancelled" }),
                {
                  action: "operation.cancel",
                  saas: raw.saas,
                  entity: "AdminCommand",
                  entityId: raw.id,
                  before: JSON.stringify({ status: raw.status }),
                  after: JSON.stringify({ status: "cancelled" }),
                }
              )
            }
          >
            <X className="h-3.5 w-3.5" /> Cancelar operação
          </Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={() => navigate("/operations")}>
            Ver no Operation Center
          </Button>
        </div>
        {err && <p className="text-xs text-rose-600">{err}</p>}
      </div>
    );
  }

  if (type === "config") {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            disabled={busy}
            onClick={() =>
              run(
                () =>
                  base44.entities.Configuration.update(raw.id, { approval_status: "approved", enabled: true }),
                {
                  action: "config.approve",
                  saas: raw.saas_id || "central",
                  entity: "Configuration",
                  entityId: raw.id,
                  before: JSON.stringify({ approval_status: "pending" }),
                  after: JSON.stringify({ approval_status: "approved", enabled: true }),
                  reason: "Aprovado via Central de Resolução",
                }
              )
            }
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Aprovar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"
            disabled={busy}
            onClick={() =>
              run(
                () => base44.entities.Configuration.update(raw.id, { approval_status: "rejected" }),
                {
                  action: "config.reject",
                  saas: raw.saas_id || "central",
                  entity: "Configuration",
                  entityId: raw.id,
                  before: JSON.stringify({ approval_status: "pending" }),
                  after: JSON.stringify({ approval_status: "rejected" }),
                  reason: "Rejeitado via Central de Resolução",
                }
              )
            }
          >
            <X className="h-3.5 w-3.5" /> Rejeitar
          </Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={() => navigate("/configurations")}>
            Ver configs
          </Button>
        </div>
        {err && <p className="text-xs text-rose-600">{err}</p>}
      </div>
    );
  }

  if (type === "saas") {
    const sev =
      raw.health === "down" ? "critical" : raw.status === "auth_failed" ? "high" : raw.health === "degraded" ? "medium" : "low";
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="h-8 gap-1.5"
            disabled={busy}
            onClick={() =>
              run(
                async () => {
                  await base44.entities.Incident.create({
                    saas: raw.name,
                    title: `${raw.name} — ${raw.health || raw.status}`,
                    severity: sev,
                    status: "open",
                    opened_at: new Date().toISOString(),
                    description: `Incidente aberto via Central de Resolução. Health: ${raw.health || "?"} · Status: ${raw.status || "?"}.`,
                  });
                },
                {
                  action: "incident.create",
                  saas: raw.name,
                  entity: "Incident",
                  reason: `Aberto a partir de SaaS ${raw.name} degradado`,
                  origin: "ui",
                }
              )
            }
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />} Abrir incidente
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => navigate(`/saas/${raw.id}`)}>
            <ExternalLink className="h-3.5 w-3.5" /> Ver detalhes
          </Button>
        </div>
        {err && <p className="text-xs text-rose-600">{err}</p>}
      </div>
    );
  }

  return null;
}