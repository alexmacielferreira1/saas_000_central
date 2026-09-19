import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useOrgId } from "@/lib/TenantContext";
import PageHeader from "@/components/PageHeader";
import { Card, EmptyState, ErrorState } from "@/components/ui-primitives";
import StatusBadge from "@/components/StatusBadge";
import { SAAS_STATUS, HEALTH, COMPATIBILITY } from "@/lib/adminHelpers";
import { Boxes, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import NewSaasDialog from "@/components/saas/NewSaasDialog";
import { usePermissions } from "@/hooks/usePermissions";

export default function SaasList() {
  const navigate = useNavigate();
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
      const data = await base44.entities.Saas.filter({ organization_id: orgId }, "-updated_date", 100);
      setItems(data || []);
    } catch { setError(true); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [orgId]);

  // Abre o drawer de criação quando vier da Busca Global / Topbar (?novo=saas)
  useEffect(() => {
    if (searchParams.get("novo") === "saas" && can("saas")) {
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const filtered = items.filter((s) =>
    !q || (s.name || "").toLowerCase().includes(q.toLowerCase()) || (s.slug || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="SaaS 360"
        description="Inventário e estado de cada produto do ecossistema."
        icon={Boxes}
        actions={can("saas") ? <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Registrar SaaS</Button> : undefined}
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome ou slug..."
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => <div key={n} className="h-40 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : error ? (
        <Card><ErrorState onRetry={load} description="Não foi possível carregar o inventário de SaaS." /></Card>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={Boxes} title="Nenhum SaaS encontrado" description="Registre o primeiro produto para começar." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/saas/${s.id}`)}>
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-semibold text-white" style={{ background: s.color || "#6366f1" }}>
                    {(s.name || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{s.name}</p>
                    <p className="truncate text-xs text-slate-400">{s.slug || s.base_url || "—"}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-xs text-slate-500 min-h-[2rem]">{s.description || "Sem descrição."}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <StatusBadge map={SAAS_STATUS} value={s.status} />
                  <StatusBadge map={HEALTH} value={s.health} />
                  <StatusBadge map={COMPATIBILITY} value={s.compatibility} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <span>v{s.version || "—"}</span>
                  <span>{s.tenant_count || 0} tenants · {s.user_count || 0} users</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <NewSaasDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={load} />
    </div>
  );
}
