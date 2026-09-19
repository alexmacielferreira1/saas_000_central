import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardBody } from "@/components/ui-primitives";
import StatusBadge from "@/components/StatusBadge";
import { INCIDENT_SEVERITY, INCIDENT_STATUS, fmtDate } from "@/lib/adminHelpers";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResolveIncidentDialog from "@/components/incidents/ResolveIncidentDialog";
import { writeAudit } from "@/lib/audit";

export default function IncidentCard({ incident, onUpdated }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [resolveOpen, setResolveOpen] = useState(false);
  const i = incident;
  const resolved = i.status === "resolved";

  const setStatus = async (status) => {
    setBusy(true); setErr("");
    try {
      await base44.entities.Incident.update(i.id, { status });
      writeAudit({ action: "incident.status_change", saas: i.saas || "central", entity: "Incident", entityId: i.id, before: JSON.stringify({ status: i.status }), after: JSON.stringify({ status }), reason: "Transição de status via Control Plane" });
      onUpdated?.();
    } catch { setErr("Não foi possível atualizar o incidente."); } finally { setBusy(false); }
  };

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{i.title}</p>
            <p className="mt-0.5 text-xs text-slate-400">{i.saas || "—"} · aberto {fmtDate(i.opened_at || i.created_date)}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusBadge map={INCIDENT_SEVERITY} value={i.severity} />
            <StatusBadge map={INCIDENT_STATUS} value={i.status} />
          </div>
        </div>
        {i.description && <p className="mt-2 line-clamp-2 text-xs text-slate-500">{i.description}</p>}
        {i.resolution && <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">{i.resolution}</p>}
        {i.linear_issue_id && <p className="mt-2 font-mono text-[11px] text-slate-400">Linear · {i.linear_issue_id}</p>}

        {!resolved && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-xs" disabled={busy} onClick={() => setStatus("investigating")}>Investigando</Button>
            <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-xs" disabled={busy} onClick={() => setStatus("monitoring")}>Monitorar</Button>
            <Button size="sm" className="h-7 gap-1.5 px-2.5 text-xs" disabled={busy} onClick={() => setResolveOpen(true)}>Resolver</Button>
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
            {err && <span className="text-xs text-rose-600">{err}</span>}
          </div>
        )}
      </CardBody>

      <ResolveIncidentDialog open={resolveOpen} onOpenChange={setResolveOpen} incident={i} onResolved={onUpdated} />
    </Card>
  );
}