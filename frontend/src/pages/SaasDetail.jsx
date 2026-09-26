import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getSaas } from "@/api/saasRegistry";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, EmptyState, ErrorState } from "@/components/ui-primitives";
import StatusBadge from "@/components/StatusBadge";
import { SAAS_STATUS, HEALTH, COMPATIBILITY, OP_STATUS, PRODUCT_USER_STATUS, fmtDate } from "@/lib/adminHelpers";
import { Boxes, ArrowLeft, Activity, Users, Settings2, TerminalSquare, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SaasDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saas, setSaas] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [users, setUsers] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("overview");

  const load = async () => {
    try {
      setLoading(true); setError(false);
      const s = await getSaas(id);
      setSaas(s);
      const [m, u, c, o] = await Promise.all([
        base44.entities.CapabilityManifest.filter({ saas_id: id }, "-version", 1).catch(() => []),
        base44.entities.ProductUser.filter({ saas_id: id }, "-last_sync", 10).catch(() => []),
        base44.entities.Configuration.filter({ saas_id: id }, "-created_date", 10).catch(() => []),
        base44.entities.AdminCommand.filter({ saas: s?.name }, "-created_date", 10).catch(() => []),
      ]);
      setManifest((m && m[0]) || null);
      setUsers(u || []);
      setConfigs(c || []);
      setOps(o || []);
    } catch { setError(true); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="h-64 animate-pulse rounded-xl bg-slate-100" />;
  if (error) return <Card><ErrorState onRetry={load} title="Falha ao carregar" description="Não foi possível carregar este SaaS." /></Card>;
  if (!saas) return <Card><EmptyState icon={Boxes} title="SaaS não encontrado" /></Card>;

  const TABS = [
    { key: "overview", label: "Visão geral", icon: Activity },
    { key: "manifest", label: "Capability Manifest", icon: FileJson },
    { key: "users", label: "Usuários", icon: Users },
    { key: "configs", label: "Configurações", icon: Settings2 },
    { key: "ops", label: "Operações", icon: TerminalSquare },
  ];

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3 gap-1 text-slate-500" onClick={() => navigate("/saas")}>
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <PageHeader
        title={saas.name}
        description={saas.description || saas.slug}
        icon={Boxes}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge map={SAAS_STATUS} value={saas.status} />
            <StatusBadge map={HEALTH} value={saas.health} />
            <StatusBadge map={COMPATIBILITY} value={saas.compatibility} />
          </div>
        }
      />

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors ${
              tab === key ? "border-indigo-600 text-indigo-600 font-medium" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card><CardBody>
            <p className="text-xs text-slate-400">Versão</p><p className="text-sm font-medium text-slate-800">{saas.version || "—"}</p>
          </CardBody></Card>
          <Card><CardBody>
            <p className="text-xs text-slate-400">Admin API</p><p className="text-sm font-medium text-slate-800">{saas.admin_api_version || "—"}</p>
          </CardBody></Card>
          <Card><CardBody>
            <p className="text-xs text-slate-400">Nível de integração</p><p className="text-sm font-medium text-slate-800 capitalize">{(saas.integration_level || "—").replace(/_/g, " ")}</p>
          </CardBody></Card>
          <Card><CardBody>
            <p className="text-xs text-slate-400">Base URL</p><p className="truncate text-sm font-medium text-slate-800">{saas.base_url || "—"}</p>
          </CardBody></Card>
          <Card><CardBody>
            <p className="text-xs text-slate-400">Último handshake</p><p className="text-sm font-medium text-slate-800">{fmtDate(saas.last_handshake)}</p>
          </CardBody></Card>
          <Card><CardBody>
            <p className="text-xs text-slate-400">Tenants / Usuários</p><p className="text-sm font-medium text-slate-800">{saas.tenant_count || 0} · {saas.user_count || 0}</p>
          </CardBody></Card>
          {saas.capabilities_summary && (
            <Card className="sm:col-span-2 lg:col-span-3"><CardBody>
              <p className="mb-1 text-xs text-slate-400">Resumo de capabilities</p>
              <p className="text-sm text-slate-700">{saas.capabilities_summary}</p>
            </CardBody></Card>
          )}
        </div>
      )}

      {tab === "manifest" && (
        <Card><CardBody>
          {manifest ? (
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-200">
{JSON.stringify({
  saas_id: manifest.saas_id,
  version: manifest.version,
  admin_api_version: manifest.admin_api_version,
  compatibility: manifest.compatibility,
  capabilities: manifest.capabilities,
  health: manifest.health,
  resources: manifest.resources,
  scopes: manifest.scopes,
  events: manifest.events,
  limits: manifest.limits,
}, null, 2)}
            </pre>
          ) : (
            <EmptyState icon={FileJson} title="Nenhum Capability Manifest publicado" description="O SaaS ainda não publicou um manifest versionado." />
          )}
        </CardBody></Card>
      )}

      {tab === "users" && (
        <Card><CardBody>
          {users.length === 0 ? <EmptyState icon={Users} title="Nenhum usuário sincronizado" /> : (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div><p className="text-sm font-medium text-slate-800">{u.full_name || u.email}</p><p className="text-xs text-slate-400">{u.role || "—"} · {u.tenant || "—"}</p></div>
                  <StatusBadge map={PRODUCT_USER_STATUS} value={u.status} />
                </div>
              ))}
            </div>
          )}
        </CardBody></Card>
      )}

      {tab === "configs" && (
        <Card><CardBody>
          {configs.length === 0 ? <EmptyState icon={Settings2} title="Nenhuma configuração" /> : (
            <div className="space-y-2">
              {configs.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div><p className="text-sm font-medium text-slate-800">{c.key}</p><p className="text-xs text-slate-400">{c.value} · {c.environment}</p></div>
                  <span className={`text-xs font-medium ${c.enabled ? "text-emerald-600" : "text-slate-400"}`}>{c.enabled ? "ativo" : "inativo"}</span>
                </div>
              ))}
            </div>
          )}
        </CardBody></Card>
      )}

      {tab === "ops" && (
        <Card><CardBody>
          {ops.length === 0 ? <EmptyState icon={TerminalSquare} title="Nenhuma operação" /> : (
            <div className="space-y-2">
              {ops.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div><p className="text-sm font-medium text-slate-800">{o.action} · {o.resource}</p><p className="text-xs text-slate-400">{fmtDate(o.created_date)}</p></div>
                  <StatusBadge map={OP_STATUS} value={o.status} />
                </div>
              ))}
            </div>
          )}
        </CardBody></Card>
      )}
    </div>
  );
}
