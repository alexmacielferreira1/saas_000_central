import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Card, EmptyState, ErrorState, KpiCard } from "@/components/ui-primitives";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, ShieldCheck, Boxes, Search, RefreshCw } from "lucide-react";
import { buildProblems } from "@/lib/problems";
import ProblemCard from "@/components/resolution/ProblemCard";
import { cn } from "@/lib/utils";

const TYPE_FILTERS = [
  { key: "all", label: "Tudo" },
  { key: "incident", label: "Incidentes" },
  { key: "command", label: "Operações" },
  { key: "saas", label: "SaaS" },
  { key: "config", label: "Configs" },
];

export default function ResolutionCenter() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sevFilter, setSevFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const safe = (p) => p.then((r) => r || []).catch(() => []);
      const [incidents, commands, saas, configs] = await Promise.all([
        safe(base44.entities.Incident.list("-opened_at", 100)),
        safe(base44.entities.AdminCommand.list("-created_date", 100)),
        safe(base44.entities.Saas.list("-updated_date", 100)),
        safe(base44.entities.Configuration.list("-created_date", 100)),
      ]);
      setProblems(buildProblems({ incidents, commands, saas, configs }));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      problems.filter((p) => {
        if (typeFilter !== "all" && p.type !== typeFilter) return false;
        if (sevFilter !== "all" && p.severity !== sevFilter) return false;
        if (q) {
          const t = `${p.title} ${p.saas} ${p.summary}`.toLowerCase();
          if (!t.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [problems, typeFilter, sevFilter, q]
  );

  const kpis = useMemo(() => {
    const critical = problems.filter((p) => p.severity === "critical").length;
    const resolvable = problems.filter((p) => ["incident", "command", "config"].includes(p.type)).length;
    const affectedSaas = new Set(problems.filter((p) => p.type === "saas").map((p) => p.saas)).size;
    return { total: problems.length, critical, resolvable, affectedSaas };
  }, [problems]);

  return (
    <div>
      <PageHeader
        title="Central de Resolução"
        description="Visão única do ecossistema: incidentes, operações falhas, SaaS degradados e aprovações pendentes. Clique para expandir, leia o guia e resolva em poucos cliques."
        icon={Activity}
        actions={
          <Button size="sm" variant="outline" className="gap-2" onClick={load}>
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Problemas ativos" value={kpis.total} icon={AlertTriangle} tone="rose" />
        <KpiCard label="Críticos" value={kpis.critical} icon={ShieldCheck} tone="rose" />
        <KpiCard label="Resolvíveis aqui" value={kpis.resolvable} icon={Activity} tone="emerald" />
        <KpiCard label="SaaS afetados" value={kpis.affectedSaas} icon={Boxes} tone="amber" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar problema, SaaS..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  typeFilter === f.key ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={sevFilter}
            onChange={(e) => setSevFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-600 focus:outline-none"
          >
            <option value="all">Todas severidades</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <ErrorState onRetry={load} description="Não foi possível carregar os problemas do ecossistema." />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title="Tudo limpo"
            description="Nenhum problema ativo no ecossistema. Incidentes resolvidos, operações concluídas e SaaS saudáveis."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <ProblemCard key={p.id} problem={p} onMutated={load} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
}