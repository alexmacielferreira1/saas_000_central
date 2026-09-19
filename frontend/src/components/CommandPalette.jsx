import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { base44 } from "@/api/base44Client";
import { useTenant } from "@/lib/TenantContext";
import { tokenize, rankItems } from "@/lib/searchUtils";
import { ACTIONS, CREATE_SYNONYMS, ENTITY_KEYWORDS, runAction } from "@/lib/quickActions";
import { usePermissions } from "@/hooks/usePermissions";
import { buildProblems, PROBLEM_TYPE, SEVERITY_LABEL } from "@/lib/problems";
import Highlight from "@/components/Highlight";
import {
  Boxes, Users, User, AlertTriangle, Settings2, TerminalSquare, ScrollText,
  LayoutDashboard, Activity, BookOpen, Search, CornerDownLeft, Zap,
} from "lucide-react";

// Static navigation shortcuts (always available, before the index loads).
const NAV_SHORTCUTS = [
  { to: "/", label: "Home do ecossistema", icon: LayoutDashboard, keywords: "home dashboard painel inicio visao geral resumo ecossistema panorama" },
  { to: "/resolution", label: "Central de Resolução", icon: Activity, keywords: "resolver corrigir solucao solucoes consertar arrumar problema problemas fix repair" },
  { to: "/api-guides", label: "Guias das APIs", icon: BookOpen, keywords: "api guia guias documentacao docs endpoints integracao referencia" },
  { to: "/saas", label: "SaaS 360", icon: Boxes, keywords: "saas produtos app aplicativo inventario 360 ecossistema" },
  { to: "/users", label: "Usuários & Acesso", icon: Users, keywords: "usuarios acesso identidade roles permissoes gestores admins pessoas" },
  { to: "/configurations", label: "Configurações & Flags", icon: Settings2, keywords: "configuracoes flags feature flag ajustes limites parametros" },
  { to: "/operations", label: "Centro de Operações", icon: TerminalSquare, keywords: "operacoes centro comando acoes remota escrita execucao" },
  { to: "/audit", label: "Auditoria", icon: ScrollText, keywords: "auditoria audit log trilha eventos historico rastro registros" },
  { to: "/incidents", label: "Incidentes", icon: AlertTriangle, keywords: "incidentes problemas alertas falhas outages status" },
  { to: "/integrations", label: "Integrações & Saúde", icon: Boxes, keywords: "integracoes saude conexoes oauth webhooks status handshake" },
];

// Severity → tint for the Pendências group.
const SEV_TINT = { critical: "rose", high: "amber", medium: "sky", low: "slate" };

// Data sources: how each entity becomes a searchable group.
const DATA_SOURCES = [
  {
    key: "Saas", heading: "SaaS", tint: "sky", icon: Boxes,
    fields: (r) => [{ text: r.name, weight: 3 }, { text: r.slug || r.base_url || "", weight: 2 }, { text: ENTITY_KEYWORDS.Saas, weight: 1 }],
    label: (r) => r.name, sub: (r) => r.slug || r.base_url || "",
    to: (r) => `/saas/${r.id}`,
  },
  {
    key: "Incident", heading: "Incidentes", tint: "rose", icon: AlertTriangle,
    fields: (r) => [{ text: r.title, weight: 3 }, { text: r.saas || "", weight: 2 }, { text: ENTITY_KEYWORDS.Incident, weight: 1 }],
    label: (r) => r.title, sub: (r) => `${r.saas || "—"} · ${SEVERITY_LABEL[r.severity] || r.severity || ""}`,
    to: () => "/incidents",
  },
  {
    key: "Configuration", heading: "Configurações", tint: "violet", icon: Settings2,
    fields: (r) => [{ text: r.key, weight: 3 }, { text: r.saas_id || "", weight: 2 }, { text: ENTITY_KEYWORDS.Configuration, weight: 1 }],
    label: (r) => r.key, sub: (r) => `${r.saas_id || "central"} · ${r.environment || ""}`,
    to: () => "/configurations",
  },
  {
    key: "AdminCommand", heading: "Operações", tint: "amber", icon: TerminalSquare,
    fields: (r) => [{ text: `${r.action || ""} ${r.resource || ""}`, weight: 3 }, { text: r.operation_id || "", weight: 2 }, { text: ENTITY_KEYWORDS.AdminCommand, weight: 1 }],
    label: (r) => `${r.action || "Operação"}${r.resource ? " · " + r.resource : ""}`, sub: (r) => r.operation_id || r.saas || "",
    to: () => "/operations",
  },
  {
    key: "Manager", heading: "Administradores", tint: "indigo", icon: Users,
    fields: (r) => [{ text: r.full_name, weight: 3 }, { text: r.email, weight: 2 }, { text: ENTITY_KEYWORDS.Manager, weight: 1 }],
    label: (r) => r.full_name, sub: (r) => r.email,
    to: () => "/users",
  },
  {
    key: "ProductUser", heading: "Usuários SaaS", tint: "teal", icon: User,
    fields: (r) => [{ text: r.full_name || r.email, weight: 3 }, { text: `${r.saas_id || ""} ${r.role || ""}`, weight: 2 }, { text: ENTITY_KEYWORDS.ProductUser, weight: 1 }],
    label: (r) => r.full_name || r.email, sub: (r) => `${r.saas_id || "—"} · ${r.role || "—"}`,
    to: () => "/users",
  },
];

const safe = (p) => p.then((r) => (Array.isArray(r) ? r : (r?.items ? r.items : []))).catch(() => []);

export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const { orgId } = useTenant();
  const { can } = usePermissions();
  const [query, setQuery] = useState("");
  const [data, setData] = useState({});
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const filter = { organization_id: orgId };
    const [saas, incidents, configs, ops, managers, productUsers] = await Promise.all([
      safe(base44.entities.Saas.filter(filter, "-updated_date", 200)),
      safe(base44.entities.Incident.filter(filter, "-opened_at", 200)),
      safe(base44.entities.Configuration.filter(filter, "-updated_date", 200)),
      safe(base44.entities.AdminCommand.filter(filter, "-created_date", 200)),
      safe(base44.entities.Manager.filter(filter, "-updated_date", 200)),
      safe(base44.entities.ProductUser.filter(filter, "-last_sync", 200)),
    ]);
    setData({ Saas: saas, Incident: incidents, Configuration: configs, AdminCommand: ops, Manager: managers, ProductUser: productUsers });
    setLoaded(true);
  }, [orgId]);

  // Load on first open; invalidate cache (reset) whenever the active org changes.
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // Reset query when the palette closes.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (to) => {
    onOpenChange(false);
    navigate(to);
  };

  const tokens = tokenize(query);

  // --- Ações group (static, available before the index loads) ---
  const actionItems = useMemo(() => {
    const items = ACTIONS.filter((a) => can(a.id)).map((a) => ({
      kind: "acao",
      id: `acao:${a.id}`,
      label: a.label,
      icon: a.icon,
      tint: "emerald",
      fields: [
        { text: a.label, weight: 3 },
        { text: a.keywords || "", weight: 2 },
        { text: CREATE_SYNONYMS.join(" "), weight: 2 },
        { text: ENTITY_KEYWORDS[a.entity] || a.entity, weight: 2 },
      ],
      onSelect: () => runAction(a.id, go),
      shortcut: "↵ criar",
    }));
    return rankItems(items, tokens, 12);
  }, [tokens, can]);

  // --- Data groups (one per entity, only after the index loads) ---
  const dataGroups = useMemo(() => {
    if (!loaded) return [];
    return DATA_SOURCES.map((src) => {
      const records = data[src.key] || [];
      const items = records.map((r) => ({
        kind: "data",
        id: `${src.key}:${r.id}`,
        label: src.label(r),
        sub: src.sub(r),
        icon: src.icon,
        tint: src.tint,
        fields: src.fields(r),
        onSelect: () => go(src.to(r)),
      }));
      return { heading: src.heading, tint: src.tint, items: rankItems(items, tokens, 12) };
    }).filter((g) => g.items.length > 0);
  }, [loaded, data, tokens]);

  // --- Pendências group (reuses buildProblems) ---
  const pendItems = useMemo(() => {
    if (!loaded) return [];
    const problems = buildProblems({
      incidents: data.Incident || [],
      commands: data.AdminCommand || [],
      saas: data.Saas || [],
      configs: data.Configuration || [],
    });
    const items = problems.map((p) => {
      const to =
        p.type === "incident" ? "/incidents"
        : p.type === "command" ? "/operations"
        : p.type === "config" ? "/configurations"
        : p.type === "saas" && p.entityId ? `/saas/${p.entityId}` : "/saas";
      return {
        kind: "pend",
        id: `pend:${p.id}`,
        label: p.title,
        sub: `${p.saas || "central"} · ${p.statusLabel || ""}`,
        icon: PROBLEM_TYPE[p.type] ? AlertTriangle : AlertTriangle,
        tint: SEV_TINT[p.severity] || "slate",
        fields: [
          { text: p.title, weight: 3 },
          { text: p.saas || "", weight: 2 },
          { text: p.statusLabel || "", weight: 2 },
          { text: PROBLEM_TYPE[p.type]?.label || p.type, weight: 1 },
        ],
        onSelect: () => go(to),
      };
    });
    return rankItems(items, tokens, 12);
  }, [loaded, data, tokens]);

  // --- Navegação group (static) ---
  const navItems = useMemo(() => {
    const items = NAV_SHORTCUTS.map((s) => ({
      kind: "nav",
      id: `nav:${s.to}`,
      label: s.label,
      icon: s.icon,
      tint: "slate",
      fields: [{ text: s.label, weight: 3 }, { text: s.keywords || "", weight: 2 }, { text: s.to, weight: 1 }],
      onSelect: () => go(s.to),
    }));
    return rankItems(items, tokens, 12);
  }, [tokens]);

  const hasResults =
    actionItems.length > 0 || dataGroups.some((g) => g.items.length > 0) || pendItems.length > 0 || navItems.length > 0;

  // Static literal classes — Tailwind purges dynamic `bg-${tint}-500/15` names.
  const TINT = {
    emerald: { chip: "bg-emerald-500/15 text-emerald-300", icon: "text-emerald-300" },
    slate: { chip: "bg-slate-500/15 text-slate-300", icon: "text-slate-300" },
    sky: { chip: "bg-sky-500/15 text-sky-300", icon: "text-sky-300" },
    rose: { chip: "bg-rose-500/15 text-rose-300", icon: "text-rose-300" },
    amber: { chip: "bg-amber-500/15 text-amber-300", icon: "text-amber-300" },
    violet: { chip: "bg-violet-500/15 text-violet-300", icon: "text-violet-300" },
    indigo: { chip: "bg-indigo-500/15 text-indigo-300", icon: "text-indigo-300" },
    teal: { chip: "bg-teal-500/15 text-teal-300", icon: "text-teal-300" },
  };
  const tintClasses = (tint) => TINT[tint] || TINT.slate;

  const GroupHeading = ({ tint, children }) => (
    <div className="flex items-center gap-2 px-3 pt-3 pb-1">
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tintClasses(tint).chip}`}>
        {children}
      </span>
    </div>
  );

  const Item = ({ item, showShortcut }) => (
    <CommandPrimitive.Item
      value={`${item.label} ${item.sub || ""}`}
      onSelect={item.onSelect}
      className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none data-[selected=true]:bg-emerald-500/10 data-[selected=true]:ring-1 data-[selected=true]:ring-emerald-500/30"
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${tintClasses(item.tint).chip}`}>
        {item.icon ? <item.icon className={`h-3.5 w-3.5 ${tintClasses(item.tint).icon}`} /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-slate-100">
          <Highlight text={item.label} query={query} />
        </span>
        {item.sub && (
          <span className="block truncate text-xs text-slate-400">
            <Highlight text={item.sub} query={query} />
          </span>
        )}
      </span>
      {showShortcut && item.shortcut && (
        <span className="shrink-0 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          {item.shortcut}
        </span>
      )}
      {!showShortcut && (
        <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-slate-600 opacity-0 group-data-[selected=true]:opacity-100" />
      )}
    </CommandPrimitive.Item>
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12%] z-50 flex max-h-[78vh] w-[92vw] max-w-[640px] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <CommandPrimitive shouldFilter={false} className="flex min-h-0 flex-1 flex-col">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-slate-800 px-4">
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <CommandPrimitive.Input
              autoFocus
              placeholder="Buscar ou criar — registros, ações e atalhos…"
              onValueChange={setQuery}
              className="h-12 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
            <kbd className="shrink-0 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
              esc
            </kbd>
          </div>

          <CommandPrimitive.List className="flex-1 overflow-y-auto overflow-x-hidden py-1">
            {hasResults ? (
              <>
                {actionItems.length > 0 && (
                  <CommandPrimitive.Group>
                    <GroupHeading tint="emerald">Ações</GroupHeading>
                    <div className="px-1">
                      {actionItems.map((it) => <Item key={it.id} item={it} showShortcut />)}
                    </div>
                  </CommandPrimitive.Group>
                )}

                {dataGroups.map((g) => (
                  <CommandPrimitive.Group key={g.heading}>
                    <GroupHeading tint={g.tint}>{g.heading}</GroupHeading>
                    <div className="px-1">
                      {g.items.map((it) => <Item key={it.id} item={it} />)}
                    </div>
                  </CommandPrimitive.Group>
                ))}

                {pendItems.length > 0 && (
                  <CommandPrimitive.Group>
                    <GroupHeading tint="amber">Pendências</GroupHeading>
                    <div className="px-1">
                      {pendItems.map((it) => <Item key={it.id} item={it} />)}
                    </div>
                  </CommandPrimitive.Group>
                )}

                {navItems.length > 0 && (
                  <CommandPrimitive.Group>
                    <GroupHeading tint="slate">Navegação</GroupHeading>
                    <div className="px-1">
                      {navItems.map((it) => <Item key={it.id} item={it} />)}
                    </div>
                  </CommandPrimitive.Group>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-800">
                  <Zap className="h-5 w-5 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-200">Nada encontrado para “{query}”</p>
                <p className="mt-1 text-xs text-slate-500">Tente outro termo, ou use uma ação rápida para criar.</p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  {[
                    ["↑↓", "navegar"],
                    ["↵", "abrir"],
                    ["esc", "fechar"],
                  ].map(([k, l]) => (
                    <span key={k} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/60 px-2.5 py-1 text-[11px] text-slate-400">
                      <kbd className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">{k}</kbd>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CommandPrimitive.List>

          {/* Footer hint */}
          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <CornerDownLeft className="h-3 w-3" /> abre o detalhe
            </span>
            <span>{loaded ? "Índice carregado" : "Carregando índice…"} · org: {orgId}</span>
          </div>
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
