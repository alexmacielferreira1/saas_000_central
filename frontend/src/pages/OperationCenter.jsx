import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useOrgId } from "@/lib/TenantContext";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, EmptyState, ErrorState } from "@/components/ui-primitives";
import StatusBadge from "@/components/StatusBadge";
import { OP_STATUS, fmtDate, isSensitiveAction } from "@/lib/adminHelpers";
import { writeAudit } from "@/lib/audit";
import { TerminalSquare, Plus, Search, ShieldAlert, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import NewOperationDialog from "@/components/operations/NewOperationDialog";
import { usePermissions } from "@/hooks/usePermissions";

export default function OperationCenter() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState("");

  const orgId = useOrgId();
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = usePermissions();

  const load = async () => {
    try {
      setError(false);
      setLoading(true);
      const data = await base44.entities.AdminCommand.filter({ organization_id: orgId }, "-created_date", 100);
      setItems(data || []);
    } catch { setError(true); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [orgId]);

  useEffect(() => {
    if (searchParams.get("novo") === "operation" && can("operation")) {
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const filtered = items.filter((o) => !q || (o.action || "").toLowerCase().includes(q.toLowerCase()) || (o.saas || "").toLowerCase().includes(q.toLowerCase()) || (o.operation_id || "").toLowerCase().includes(q.toLowerCase()));

  const setStatus = async (o, status) => {
    setBusyId(o.id); setActionError("");
    try {
      await base44.entities.AdminCommand.update(o.id, { status });
      writeAudit({ action: status === "queued" ? "operation.approve" : "operation.reject", saas: o.saas, tenant: o.tenant, entity: "AdminCommand", entityId: o.id, before: JSON.stringify({ status: o.status }), after: JSON.stringify({ status }), reason: status === "queued" ? "Operação aprovada via Operation Center" : "Operação rejeitada via Operation Center" });
      await load();
    } catch { setActionError(`Não foi possível atualizar a operação "${o.action}". Tente novamente.`); } finally { setBusyId(null); }
  };

  return (
    <div>
      <PageHeader
        title="Centro de Operações"
        description="Toda escrita remota vira uma operação rastreável com estado e auditoria. Operações sensíveis exigem aprovação manual."
        icon={TerminalSquare}
        actions={can("operation") ? <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Nova operação</Button> : undefined}
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por ação, SaaS ou operation ID..." className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{actionError}</div>
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      ) : error ? (
        <Card><ErrorState onRetry={load} description="Não foi possível carregar as operações." /></Card>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={TerminalSquare} title="Nenhuma operação registrada" description="Operações administrativas remotas aparecem aqui." /></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                  <th className="px-4 py-3 font-medium">Operação</th>
                  <th className="px-4 py-3 font-medium">SaaS / Tenant</th>
                  <th className="px-4 py-3 font-medium">Solicitante</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Criado</th>
                  <th className="px-4 py-3 font-medium">Retry</th>
                  <th className="px-4 py-3 font-medium text-right">Aprovação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((o) => {
                  const pending = o.status === "awaiting_confirmation" || o.status === "draft";
                  const sensitive = isSensitiveAction(o.action);
                  const busy = busyId === o.id;
                  return (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800">{o.action} · {o.resource}</p>
                          {sensitive && (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                              <ShieldAlert className="h-3 w-3" /> sensível
                            </span>
                          )}
                          {o.dry_run && <span className="inline-block rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">dry run</span>}
                        </div>
                        {o.operation_id && <p className="font-mono text-[11px] text-slate-400">{o.operation_id}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{o.saas}<br /><span className="text-xs text-slate-400">{o.tenant || "—"}</span></td>
                      <td className="px-4 py-3 text-slate-600">{o.requested_by || "—"}</td>
                      <td className="px-4 py-3"><StatusBadge map={OP_STATUS} value={o.status} /></td>
                      <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(o.created_date)}</td>
                      <td className="px-4 py-3 text-slate-600">{o.retry_count || 0}</td>
                      <td className="px-4 py-3">
                        {pending ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" className="h-8 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50" disabled={busy} onClick={() => setStatus(o, "queued")}>
                              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Aprovar
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50" disabled={busy} onClick={() => setStatus(o, "cancelled")}>
                              <X className="h-3.5 w-3.5" /> Rejeitar
                            </Button>
                          </div>
                        ) : (
                          <p className="text-right text-xs text-slate-300">—</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <NewOperationDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={load} />
    </div>
  );
}