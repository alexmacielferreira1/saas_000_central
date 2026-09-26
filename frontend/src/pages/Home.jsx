import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHomeSummary } from "@/api/home";
import { listSaas } from "@/api/saasRegistry";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, KpiCard, ErrorState } from "@/components/ui-primitives";
import StatusBadge from "@/components/StatusBadge";
import { SAAS_STATUS, HEALTH } from "@/lib/adminHelpers";
import { LayoutDashboard, Boxes, TerminalSquare, AlertTriangle, Activity, ArrowRight } from "lucide-react";
import MonthlyIncidentsChart from "@/components/incidents/MonthlyIncidentsChart";

export default function Home() {
  const navigate = useNavigate();
  const [saas, setSaas] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    try {
      setLoading(true); setError(false);
      const [s, homeSummary] = await Promise.all([
        listSaas(),
        getHomeSummary(),
      ]);
      setSaas(s || []);
      setSummary(homeSummary);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const productMetrics = summary?.products;
  const operationsAvailable = summary?.operations.availability === "available";
  const incidentsAvailable = summary?.incidents.availability === "available";
  const pendingValue = loading ? "…" : "—";
  const pendingLabel = loading ? "carregando" : "indisponível nesta etapa";

  return (
    <div>
      <PageHeader
        title="Home do ecossistema"
        description="Visão consolidada do Control Plane sobre todos os SaaS conectados."
        icon={LayoutDashboard}
      />

      {error ? (
        <Card><ErrorState onRetry={load} title="Falha ao carregar o painel" description="Não foi possível obter os dados do ecossistema. Verifique sua conexão e tente novamente." /></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="SaaS inventariados" value={productMetrics?.total ?? pendingValue} sub={productMetrics ? `${productMetrics.connected} conectados` : pendingLabel} icon={Boxes} tone="indigo" onClick={() => navigate("/saas")} />
        <KpiCard label="Health degradado" value={productMetrics?.degraded ?? pendingValue} sub={productMetrics ? (productMetrics.degraded ? "requer atenção" : "tudo saudável") : pendingLabel} icon={Activity} tone={productMetrics?.degraded ? "rose" : "emerald"} onClick={() => navigate("/integrations")} />
        <KpiCard label="Operações ativas" value={operationsAvailable ? summary.operations.active : pendingValue} sub={operationsAvailable ? "em execução / fila" : pendingLabel} icon={TerminalSquare} tone="sky" onClick={() => navigate("/operations")} />
        <KpiCard label="Incidentes abertos" value={incidentsAvailable ? summary.incidents.open : pendingValue} sub={incidentsAvailable ? "não resolvidos" : pendingLabel} icon={AlertTriangle} tone={incidentsAvailable && summary.incidents.open ? "amber" : "emerald"} onClick={() => navigate("/incidents")} />
      </div>

      <div className="mt-6">
        {incidentsAvailable ? (
          <MonthlyIncidentsChart items={[]} />
        ) : (
          <Card><CardBody><h2 className="text-sm font-semibold text-slate-700">Incidentes por mês</h2><p className="mt-2 text-sm text-slate-500">Os dados aparecerão aqui após a migração nativa do módulo de incidentes.</p></CardBody></Card>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">SaaS conectados</h2>
              <button onClick={() => navigate("/saas")} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                Ver todos <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((n) => <div key={n} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}
              </div>
            ) : saas.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Nenhum SaaS registrado ainda.</p>
            ) : (
              <div className="space-y-2">
                {saas.slice(0, 6).map((s) => (
                  <div key={s.id} onClick={() => navigate(`/saas/${s.id}`)} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-white" style={{ background: s.color || "#6366f1" }}>
                      {(s.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{s.name}</p>
                      <p className="truncate text-xs text-slate-400">{s.description || s.slug || "—"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge map={HEALTH} value={s.health} />
                      <StatusBadge map={SAAS_STATUS} value={s.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Operações recentes</h2>
            {!operationsAvailable ? (
              <p className="py-8 text-center text-sm text-slate-400">Os dados aparecerão aqui após a migração nativa do módulo de operações.</p>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">Nenhuma operação registrada.</p>
            )}
          </CardBody>
        </Card>
      </div>
        </>
      )}
    </div>
  );
}
