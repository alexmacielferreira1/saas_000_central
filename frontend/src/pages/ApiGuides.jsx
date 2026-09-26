import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { listSaas } from "@/api/saasRegistry";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, EmptyState, ErrorState } from "@/components/ui-primitives";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { BookOpen, Plug, Search, ExternalLink, ChevronDown, Boxes } from "lucide-react";
import { SAAS_STATUS, HEALTH, COMPATIBILITY, fmtDate, toneClass } from "@/lib/adminHelpers";
import { cn } from "@/lib/utils";

const INTEGRATION_LEVEL = {
  inventory: {
    label: "Inventário",
    tone: "slate",
    guide:
      "Apenas catalogado, sem Admin API exposta. Próximo passo: expor um backend function /admin-manifest e fazer handshake para subir para 'Leitura'.",
  },
  read: {
    label: "Leitura",
    tone: "sky",
    guide:
      "Admin API somente leitura — a Central lê usuários, configs e health. Próximo: expor endpoints de configuração para subir a 'Usuários & Config'.",
  },
  users_config: {
    label: "Usuários & Config",
    tone: "violet",
    guide:
      "Leitura + configuração de usuários e flags. Próximo: expor execução controlada de comandos admin (write_controlled) com confirmação e auditoria.",
  },
  write_controlled: {
    label: "Escrita controlada",
    tone: "amber",
    guide:
      "Escrita administrativa via AdminCommand com confirmação e auditoria. Próximo: automatizar via workflows/eventos para chegar a 'Automação'.",
  },
  domain_resources: {
    label: "Recursos de domínio",
    tone: "emerald",
    guide:
      "Recursos de domínio expostos (ex.: folha, prontuário). Integrar eventos/webhooks para habilitar automação bidirecional.",
  },
  automation: {
    label: "Automação",
    tone: "emerald",
    guide:
      "Integração completa: eventos, webhooks e automação bidirecional. Manter o manifesto de capacidade versionado e atualizado.",
  },
};

export default function ApiGuides() {
  const navigate = useNavigate();
  const [saas, setSaas] = useState([]);
  const [manifests, setManifests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const safe = (p) => p.then((r) => r || []).catch(() => []);
      const [s, m] = await Promise.all([
        listSaas(),
        safe(base44.entities.CapabilityManifest.list("-updated_date", 100)),
      ]);
      setSaas(s);
      setManifests(m);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const manifestFor = (item) =>
    manifests.find((mm) => mm.saas_id === item.name || mm.saas_id === item.id);

  const filtered = saas.filter(
    (s) =>
      !q ||
      (s.name || "").toLowerCase().includes(q.toLowerCase()) ||
      (s.slug || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Guias das APIs (Guarda-chuva)"
        description="Administração das integrações e guia por SaaS: nível de integração, compatibilidade, manifestos de capacidade e como conectar bidirecionalmente."
        icon={BookOpen}
        actions={
          <Button size="sm" variant="outline" className="gap-2" onClick={load}>
            <Plug className="h-4 w-4" /> Reavaliar
          </Button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar SaaS..."
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <ErrorState onRetry={load} description="Não foi possível carregar os SaaS." />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={Boxes} title="Nenhum SaaS" description="Cadastre SaaS no inventário para ver os guias." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((s) => {
            const il = INTEGRATION_LEVEL[s.integration_level] || INTEGRATION_LEVEL.inventory;
            const mf = manifestFor(s);
            const isOpen = openId === s.id;
            return (
              <Card key={s.id}>
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: s.color || "#6366f1" }}
                      >
                        {(s.name || "?").slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{s.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          {s.slug} · v{s.version || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge map={HEALTH} value={s.health} />
                      <StatusBadge map={SAAS_STATUS} value={s.status} />
                    </div>
                  </div>

                  <p className="text-sm text-slate-600">{s.description || "—"}</p>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={cn("rounded-full px-2 py-0.5 font-medium", toneClass(il.tone))}>{il.label}</span>
                    <StatusBadge map={COMPATIBILITY} value={s.compatibility} />
                    <span className="text-slate-400">Admin API {s.admin_api_version || "—"}</span>
                    <span className="text-slate-400">Tenants {s.tenant_count || 0}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : s.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <span>Ver guia de integração</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="g"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 pt-1 text-sm">
                          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                            <p className="text-xs font-medium text-indigo-700">Nível atual: {il.label}</p>
                            <p className="mt-1 text-xs text-indigo-800/90">{il.guide}</p>
                          </div>

                          {mf && (
                            <div className="rounded-lg border border-slate-200 p-3">
                              <p className="text-xs font-medium text-slate-500">
                                Manifesto de capacidade (v{mf.version})
                              </p>
                              <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">
                                {mf.capabilities || "—"}
                              </p>
                              {mf.scopes && <p className="mt-1 text-xs text-slate-400">Scopes: {mf.scopes}</p>}
                              {mf.events && <p className="text-xs text-slate-400">Eventos: {mf.events}</p>}
                            </div>
                          )}

                          <div className="rounded-lg border border-slate-200 p-3">
                            <p className="text-xs font-medium text-slate-500">Conexão bidirecional</p>
                            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-600">
                              <li>
                                <b>Central → SaaS:</b> backend function na Central guarda a API key do SaaS (secret) e
                                lê manifest, usuários e configs; envia AdminCommands.
                              </li>
                              <li>
                                <b>SaaS → Central:</b> o SaaS chama <code>/functions/ingest</code> da Central com a API
                                key da Central para reportar eventos, health e heartbeats.
                              </li>
                              <li>
                                Cada SaaS deve expor: <code>GET /functions/admin-manifest</code>,{" "}
                                <code>GET /functions/admin/users</code>,{" "}
                                <code>POST /functions/admin/command</code>.
                              </li>
                            </ul>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5"
                              onClick={() => navigate(`/saas/${s.id}`)}
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> Detalhes
                            </Button>
                            <span className="text-xs text-slate-400">Handshake: {fmtDate(s.last_handshake)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
