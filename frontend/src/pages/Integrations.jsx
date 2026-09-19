import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, EmptyState, ErrorState, KpiCard } from "@/components/ui-primitives";
import StatusBadge from "@/components/StatusBadge";
import { SAAS_STATUS, HEALTH, fmtDate } from "@/lib/adminHelpers";
import { Plug, Boxes, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Integrations() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    try {
      setError(false);
      const data = await base44.entities.Saas.list();
      setItems(data || []);
    } catch { setError(true); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const healthy = items.filter((s) => s.health === "healthy").length;
  const degraded = items.filter((s) => s.health === "degraded").length;
  const down = items.filter((s) => s.health === "down").length;

  return (
    <div>
      <PageHeader
        title="Integrações & Health Center"
        description="Handshake, capabilities e estado de cada conexão do ecossistema."
        icon={Plug}
        actions={<Button variant="outline" size="sm" className="gap-2" onClick={load}><RefreshCw className="h-3.5 w-3.5" /> Atualizar</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="SaaS inventariados" value={items.length} icon={Boxes} tone="indigo" />
        <KpiCard label="Saudáveis" value={healthy} icon={CheckCircle2} tone="emerald" />
        <KpiCard label="Degradados" value={degraded} icon={AlertTriangle} tone={degraded ? "amber" : "emerald"} />
        <KpiCard label="Down" value={down} icon={XCircle} tone={down ? "rose" : "emerald"} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => <div key={n} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : error ? (
        <Card><ErrorState onRetry={load} description="Não foi possível carregar as integrações." /></Card>
      ) : items.length === 0 ? (
        <Card><EmptyState icon={Plug} title="Nenhuma integração" description="Registre SaaS no inventário para ver o health center." /></Card>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <Card key={s.id} className="cursor-pointer hover:shadow-md" onClick={() => navigate(`/saas/${s.id}`)}>
              <CardBody className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-semibold text-white" style={{ background: s.color || "#6366f1" }}>
                  {(s.name || "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{s.name}</p>
                  <p className="truncate text-xs text-slate-400">{s.base_url || s.slug || "—"} · API v{s.admin_api_version || "—"}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs text-slate-400">último handshake</p>
                  <p className="text-xs font-medium text-slate-600">{fmtDate(s.last_handshake)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge map={HEALTH} value={s.health} />
                  <StatusBadge map={SAAS_STATUS} value={s.status} />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
