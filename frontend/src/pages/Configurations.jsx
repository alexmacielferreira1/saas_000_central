import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useOrgId } from "@/lib/TenantContext";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, EmptyState, ErrorState } from "@/components/ui-primitives";
import { Settings2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/adminHelpers";
import NewConfigurationDialog from "@/components/configurations/NewConfigurationDialog";
import { usePermissions } from "@/hooks/usePermissions";

const TYPE_TONE = {
  feature_flag: "bg-violet-50 text-violet-700",
  setting: "bg-sky-50 text-sky-700",
  limit: "bg-amber-50 text-amber-700",
};
const APPROVAL_TONE = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  auto: "bg-slate-100 text-slate-600",
};

export default function Configurations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState(false);

  const orgId = useOrgId();
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = usePermissions();

  const load = async () => {
    try {
      setError(false);
      setLoading(true);
      const data = await base44.entities.Configuration.filter({ organization_id: orgId }, "-created_date", 50);
      setItems(data || []);
    } catch { setError(true); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [orgId]);

  useEffect(() => {
    if (searchParams.get("novo") === "config" && can("config")) {
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const filtered = items.filter((c) => !q || (c.key || "").toLowerCase().includes(q.toLowerCase()) || (c.saas_id || "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Configurações & Feature Flags"
        description="Configuração versionada da Central e dos SaaS remotos."
        icon={Settings2}
        actions={can("config") ? <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Nova configuração</Button> : undefined}
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por chave ou SaaS..." className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      ) : error ? (
        <Card><ErrorState onRetry={load} description="Não foi possível carregar as configurações." /></Card>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={Settings2} title="Nenhuma configuração" description="Crie a primeira configuração ou feature flag." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{c.key}</p>
                    <p className="truncate text-xs text-slate-400">{c.saas_id} · {c.environment}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_TONE[c.type] || TYPE_TONE.setting}`}>{c.type}</span>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="truncate font-mono text-xs text-slate-700">{c.value || "—"}</span>
                  <span className={`ml-2 shrink-0 text-xs font-medium ${c.enabled ? "text-emerald-600" : "text-slate-400"}`}>{c.enabled ? "on" : "off"}</span>
                </div>
                {c.previous_value && <p className="mt-2 truncate text-xs text-slate-400">anterior: {c.previous_value}</p>}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-400">
                  <span>{c.author || "—"}</span>
                  <span className={`rounded-full px-2 py-0.5 font-medium ${APPROVAL_TONE[c.approval_status] || APPROVAL_TONE.auto}`}>{c.approval_status}</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <NewConfigurationDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={load} />
    </div>
  );
}