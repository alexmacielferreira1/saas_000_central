import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useOrgId } from "@/lib/TenantContext";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, EmptyState, ErrorState } from "@/components/ui-primitives";
import StatusBadge from "@/components/StatusBadge";
import { MANAGER_ROLE, MANAGER_STATUS, PRODUCT_USER_STATUS, fmtDate } from "@/lib/adminHelpers";
import { Users, ShieldCheck, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import NewManagerDialog from "@/components/users/NewManagerDialog";
import NewProductUserDialog from "@/components/users/NewProductUserDialog";
import { usePermissions } from "@/hooks/usePermissions";

export default function UsersAccess() {
  const orgId = useOrgId();
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = usePermissions();
  const [managers, setManagers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [view, setView] = useState("managers");
  const [error, setError] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  const load = async () => {
    try {
      setError(false);
      setLoading(true);
      const filter = { organization_id: orgId };
      const [m, u] = await Promise.all([
        base44.entities.Manager.filter(filter),
        base44.entities.ProductUser.filter(filter, "-last_sync", 50),
      ]);
      setManagers(m || []);
      setUsers(u || []);
    } catch { setError(true); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [orgId]);

  // Abre o drawer de criação quando vier da Busca Global / Topbar (?novo=...)
  useEffect(() => {
    const novo = searchParams.get("novo");
    if (novo === "manager" && can("manager")) { setView("managers"); setManagerOpen(true); setSearchParams({}, { replace: true }); }
    else if (novo === "product" && can("product-user")) { setView("product"); setProductOpen(true); setSearchParams({}, { replace: true }); }
  }, [searchParams]);

  const filteredM = managers.filter((m) => !q || (m.full_name || "").toLowerCase().includes(q.toLowerCase()) || (m.email || "").toLowerCase().includes(q.toLowerCase()));
  const filteredU = users.filter((u) => !q || (u.email || "").toLowerCase().includes(q.toLowerCase()) || (u.full_name || "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Usuários & Acesso"
        description="Identidade global, roles e acessos por SaaS/tenant."
        icon={Users}
        actions={
          (view === "managers" ? can("manager") : can("product-user")) ? (
            <Button size="sm" className="gap-2" onClick={() => (view === "managers" ? setManagerOpen(true) : setProductOpen(true))}>
              <Plus className="h-4 w-4" /> {view === "managers" ? "Novo administrador" : "Novo usuário SaaS"}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          <button onClick={() => setView("managers")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === "managers" ? "bg-slate-900 text-white" : "text-slate-500"}`}>Administradores</button>
          <button onClick={() => setView("product")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === "product" ? "bg-slate-900 text-white" : "text-slate-500"}`}>Usuários dos SaaS</button>
        </div>
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
        </div>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      ) : error ? (
        <Card><ErrorState onRetry={load} description="Não foi possível carregar usuários e acessos." /></Card>
      ) : view === "managers" ? (
        <Card>
          {filteredM.length === 0 ? <EmptyState icon={ShieldCheck} title="Nenhum administrador" /> : (
            <div className="divide-y divide-slate-100">
              {filteredM.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">{(m.full_name || "?")[0].toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{m.full_name}</p>
                    <p className="truncate text-xs text-slate-400">{m.email}</p>
                  </div>
                  <div className="hidden text-xs text-slate-400 sm:block">{m.scope_saas || "—"}</div>
                  <StatusBadge map={MANAGER_ROLE} value={m.role} />
                  <StatusBadge map={MANAGER_STATUS} value={m.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card>
          {filteredU.length === 0 ? <EmptyState icon={Users} title="Nenhum usuário sincronizado" /> : (
            <div className="divide-y divide-slate-100">
              {filteredU.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{u.full_name || u.email}</p>
                    <p className="truncate text-xs text-slate-400">{u.saas_id} · {u.role || "—"} · {u.tenant || "—"}</p>
                  </div>
                  <span className="hidden text-xs text-slate-400 sm:block">{fmtDate(u.last_sync)}</span>
                  <StatusBadge map={PRODUCT_USER_STATUS} value={u.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <NewManagerDialog open={managerOpen} onOpenChange={setManagerOpen} onCreated={load} />
      <NewProductUserDialog open={productOpen} onOpenChange={setProductOpen} onCreated={load} />
    </div>
  );
}