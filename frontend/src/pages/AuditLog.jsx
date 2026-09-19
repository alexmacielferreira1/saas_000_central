import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useOrgId } from "@/lib/TenantContext";
import PageHeader from "@/components/PageHeader";
import { Card, EmptyState, ErrorState } from "@/components/ui-primitives";
import { ScrollText, Search } from "lucide-react";
import { fmtDate, RESULT_TONE, toneClass } from "@/lib/adminHelpers";

export default function AuditLog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState(false);

  const orgId = useOrgId();

  const load = async () => {
    try {
      setError(false);
      setLoading(true);
      const data = await base44.entities.Audit.filter({ organization_id: orgId }, "-created_date", 100);
      setItems(data || []);
    } catch { setError(true); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [orgId]);

  const filtered = items.filter((a) => !q || (a.actor || "").toLowerCase().includes(q.toLowerCase()) || (a.action || "").toLowerCase().includes(q.toLowerCase()) || (a.saas || "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="Auditoria distribuída" description="Quem, onde, o quê, antes/depois, motivo e resultado — em ambos os lados." icon={ScrollText} />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por ator, ação ou SaaS..." className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      ) : error ? (
        <Card><ErrorState onRetry={load} description="Não foi possível carregar o log de auditoria." /></Card>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={ScrollText} title="Nenhum registro de auditoria" /></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                  <th className="px-4 py-3 font-medium">Ator</th>
                  <th className="px-4 py-3 font-medium">Ação</th>
                  <th className="px-4 py-3 font-medium">SaaS / Tenant</th>
                  <th className="px-4 py-3 font-medium">Entidade</th>
                  <th className="px-4 py-3 font-medium">Resultado</th>
                  <th className="px-4 py-3 font-medium">Origem</th>
                  <th className="px-4 py-3 font-medium">Quando</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{a.actor}</td>
                    <td className="px-4 py-3 text-slate-600">{a.action}</td>
                    <td className="px-4 py-3 text-slate-600">{a.saas || "—"}<br /><span className="text-xs text-slate-400">{a.tenant || "—"}</span></td>
                    <td className="px-4 py-3 text-slate-600">{a.entity}<br /><span className="font-mono text-[11px] text-slate-400">{a.entity_id || "—"}</span></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${toneClass(RESULT_TONE[a.result] || "slate")}`}>{a.result}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{a.origin || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(a.created_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}