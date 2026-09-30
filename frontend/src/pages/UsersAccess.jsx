import React, { useEffect, useState } from "react";
import {
  createOrganizationUnit, getEffectiveAccess, listAccessAssignments, listManagers,
  listOrganizationUnits, listPermissions, listProfiles, updateAccessAssignment,
} from "@/api/access";
import { listProductUsers, listSaas } from "@/api/saasRegistry";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card, EmptyState, ErrorState } from "@/components/ui-primitives";
import StatusBadge from "@/components/StatusBadge";
import { MANAGER_ROLE, MANAGER_STATUS, PRODUCT_USER_STATUS, fmtDate } from "@/lib/adminHelpers";
import { Users, ShieldCheck, Search, Plus, Boxes, ArrowRight, Building2, KeyRound, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import NewManagerDialog from "@/components/users/NewManagerDialog";
import NewProductUserDialog from "@/components/users/NewProductUserDialog";
import { NewPermissionDialog, NewProfileDialog } from "@/components/users/AccessCatalogDialogs";
import { usePermissions } from "@/hooks/usePermissions";

export default function UsersAccess() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [managers, setManagers] = useState([]);
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const allowedViews = ["saas", "managers", "product", "profiles", "permissions", "structure", "effective"];
  const requestedView = searchParams.get("view");
  const [view, setView] = useState(allowedViews.includes(requestedView) ? requestedView : "managers");
  const [error, setError] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [effective, setEffective] = useState(null);
  const [accessForm, setAccessForm] = useState({ profile_id: "", organization_unit_id: "", job_title: "", function_name: "", scope_products: "", allow_permissions: "", deny_permissions: "" });
  const [unitForm, setUnitForm] = useState({ kind: "department", name: "", parent_id: "" });
  const [contextMessage, setContextMessage] = useState("");

  const load = async () => {
    try {
      setError(false);
      setLoading(true);
      const [m, u, p, catalog, productsResponse, organizationResponse, assignmentResponse] = await Promise.all([
        listManagers(),
        listProductUsers(),
        listProfiles(),
        listPermissions(),
        listSaas(),
        listOrganizationUnits(),
        listAccessAssignments(),
      ]);
      setManagers(m || []);
      setUsers(u || []);
      setProfiles(p || []);
      setPermissions(catalog || []);
      setProducts(productsResponse || []);
      setUnits(organizationResponse || []);
      setAssignments(assignmentResponse || []);
    } catch { setError(true); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // Abre o drawer de criação quando vier da Busca Global / Topbar (?novo=...)
  useEffect(() => {
    const novo = searchParams.get("novo");
    if (novo === "manager" && can("manager")) { setView("managers"); setManagerOpen(true); setSearchParams({}, { replace: true }); }
    else if (novo === "product" && can("product-user")) { setView("product"); setProductOpen(true); setSearchParams({}, { replace: true }); }
  }, [searchParams]);

  useEffect(() => {
    const nextView = searchParams.get("view");
    if (allowedViews.includes(nextView)) setView(nextView);
  }, [searchParams]);

  const filteredM = managers.filter((m) => !q || (m.full_name || "").toLowerCase().includes(q.toLowerCase()) || (m.email || "").toLowerCase().includes(q.toLowerCase()));
  const filteredU = users.filter((u) => !q || (u.email || "").toLowerCase().includes(q.toLowerCase()) || (u.full_name || "").toLowerCase().includes(q.toLowerCase()));
  const filteredProfiles = profiles.filter((p) => !q || `${p.name} ${p.description}`.toLowerCase().includes(q.toLowerCase()));
  const filteredPermissions = permissions.filter((p) => !q || `${p.code} ${p.resource} ${p.action}`.toLowerCase().includes(q.toLowerCase()));
  const filteredProducts = products.filter((product) => !q || `${product.name} ${product.slug}`.toLowerCase().includes(q.toLowerCase()));

  const openEffectiveAccess = async (manager) => {
    const assignment = assignments.find((item) => item.user_id === manager.id);
    setSelectedUser(manager);
    setAccessForm({
      profile_id: assignment?.profile_id || "",
      organization_unit_id: assignment?.organization_unit_id || "",
      job_title: assignment?.job_title || "",
      function_name: assignment?.function_name || "",
      scope_products: (assignment?.scope?.products || []).join(", "),
      allow_permissions: (assignment?.allow_permissions || []).join(", "),
      deny_permissions: (assignment?.deny_permissions || []).join(", "),
    });
    setEffective(await getEffectiveAccess(manager.id));
    setContextMessage("");
    requestAnimationFrame(() => document.getElementById("effective-access-workspace")?.scrollIntoView?.({ behavior: "smooth", block: "start" }));
  };

  const saveAssignment = async (event) => {
    event.preventDefault();
    const split = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);
    await updateAccessAssignment(selectedUser.id, {
      profile_id: accessForm.profile_id || null,
      organization_unit_id: accessForm.organization_unit_id || null,
      job_title: accessForm.job_title,
      function_name: accessForm.function_name,
      scope: { products: split(accessForm.scope_products) },
      allow_permissions: split(accessForm.allow_permissions),
      deny_permissions: split(accessForm.deny_permissions),
    });
    await load();
    setEffective(await getEffectiveAccess(selectedUser.id));
    setContextMessage("Vínculo salvo; acesso efetivo recalculado e auditado.");
  };

  const saveUnit = async (event) => {
    event.preventDefault();
    await createOrganizationUnit({ ...unitForm, parent_id: unitForm.parent_id || null });
    setUnitForm({ kind: "department", name: "", parent_id: "" });
    setContextMessage("Estrutura criada e auditada.");
    await load();
  };

  const openCreate = () => {
    if (view === "saas") navigate("/saas");
    else if (view === "managers") setManagerOpen(true);
    else if (view === "product") setProductOpen(true);
    else if (view === "profiles") setProfileOpen(true);
    else if (view === "structure" || view === "effective") return;
    else setPermissionOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Administração"
        description="Administração de contas, perfis versionados e catálogo de permissões por tenant."
        icon={Users}
        actions={
          !["structure", "effective"].includes(view) && can(view === "product" ? "product-user" : view === "saas" ? "saas" : "manager") ? (
            <Button size="sm" className="gap-2" onClick={openCreate}>
              {view === "saas" ? <ArrowRight className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {view === "saas" ? "Gerenciar catálogo" : <>Novo {view === "managers" ? "administrador" : view === "product" ? "usuário SaaS" : view === "profiles" ? "perfil" : "permissão"}</>}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          <button onClick={() => setView("saas")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === "saas" ? "bg-slate-900 text-white" : "text-slate-500"}`}>SaaS</button>
          <button onClick={() => setView("managers")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === "managers" ? "bg-slate-900 text-white" : "text-slate-500"}`}>Administradores</button>
          <button onClick={() => setView("product")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === "product" ? "bg-slate-900 text-white" : "text-slate-500"}`}>Usuários dos SaaS</button>
          <button onClick={() => setView("profiles")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === "profiles" ? "bg-slate-900 text-white" : "text-slate-500"}`}>Perfis</button>
          <button onClick={() => setView("permissions")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === "permissions" ? "bg-slate-900 text-white" : "text-slate-500"}`}>Permissões</button>
          <button onClick={() => setView("structure")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === "structure" ? "bg-slate-900 text-white" : "text-slate-500"}`}>Estrutura</button>
          <button onClick={() => setView("effective")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === "effective" ? "bg-slate-900 text-white" : "text-slate-500"}`}>Acesso efetivo</button>
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
      ) : view === "saas" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.length ? filteredProducts.map((product) => (
            <Card key={product.id}>
              <button className="w-full p-4 text-left" onClick={() => navigate(`/saas/${product.id}`)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Boxes className="h-5 w-5" /></div>
                    <div className="min-w-0"><p className="truncate font-semibold text-slate-900">{product.name}</p><p className="truncate text-xs text-slate-400">{product.slug} · {product.version}</p></div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center">
                  <div><p className="text-xs text-slate-400">Usuários</p><p className="font-semibold">{product.user_count || 0}</p></div>
                  <div><p className="text-xs text-slate-400">Tenants</p><p className="font-semibold">{product.tenant_count || 0}</p></div>
                  <div><p className="text-xs text-slate-400">Integração</p><p className="truncate text-xs font-semibold capitalize">{(product.integration_level || "inventário").replace(/_/g, " ")}</p></div>
                </div>
              </button>
            </Card>
          )) : <Card><EmptyState icon={Boxes} title="Nenhum SaaS cadastrado" description="Cadastre o primeiro produto no catálogo da Central." /></Card>}
        </div>
      ) : view === "structure" ? (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <Card><form onSubmit={saveUnit} className="space-y-3 p-4"><div><p className="font-semibold text-slate-900">Nova estrutura</p><p className="text-xs text-slate-500">Departamento → setor → equipe → unidade.</p></div><label className="block text-sm">Tipo<select value={unitForm.kind} onChange={(e) => setUnitForm({ ...unitForm, kind: e.target.value })} className="mt-1 h-9 w-full rounded-lg border px-3"><option value="department">Departamento</option><option value="sector">Setor</option><option value="team">Equipe</option><option value="unit">Unidade</option></select></label><label className="block text-sm">Nome<input required value={unitForm.name} onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })} className="mt-1 h-9 w-full rounded-lg border px-3" /></label><label className="block text-sm">Estrutura superior<select value={unitForm.parent_id} onChange={(e) => setUnitForm({ ...unitForm, parent_id: e.target.value })} className="mt-1 h-9 w-full rounded-lg border px-3"><option value="">Nenhuma</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label><Button type="submit" className="w-full"><Plus className="h-4 w-4" />Criar estrutura</Button>{contextMessage && <p role="status" className="text-xs text-emerald-700">{contextMessage}</p>}</form></Card>
          <Card><div className="divide-y">{units.length ? units.map((unit) => <div key={unit.id} className="flex items-center gap-3 p-4"><Building2 className="h-5 w-5 text-indigo-600" /><div className="flex-1"><p className="font-medium">{unit.name}</p><p className="text-xs capitalize text-slate-500">{unit.kind} {unit.parent_id ? "· vinculada" : "· raiz"}</p></div><StatusBadge map={{ active: { label: "Ativa", tone: "emerald" }, inactive: { label: "Inativa", tone: "slate" } }} value={unit.is_active ? "active" : "inactive"} /></div>) : <EmptyState icon={Building2} title="Nenhuma estrutura cadastrada" description="Crie departamentos, setores, equipes e unidades." />}</div></Card>
        </div>
      ) : view === "effective" ? (
        <div className="space-y-4"><Card><div className="divide-y">{filteredM.map((manager) => <button key={manager.id} type="button" onClick={() => openEffectiveAccess(manager)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 font-semibold text-indigo-700">{manager.full_name[0]}</div><div className="flex-1"><p className="font-medium">{manager.full_name}</p><p className="text-xs text-slate-500">{manager.email} · {manager.role}</p></div><span className="text-sm text-indigo-600">Abrir e resolver aqui</span><ChevronDown className="h-4 w-4 text-indigo-600" /></button>)}</div></Card>
          {selectedUser && <Card id="effective-access-workspace" className="scroll-mt-6 border-indigo-300"><div className="p-5"><div className="mb-4"><p className="text-xs font-semibold uppercase text-indigo-600">Acesso efetivo</p><h2 className="text-xl font-semibold">{selectedUser.full_name}</h2><p className="text-sm text-slate-500">Configure o vínculo e confira abaixo o resultado herdado.</p></div><form onSubmit={saveAssignment} className="grid gap-3 md:grid-cols-2"><label className="text-sm">Perfil<select value={accessForm.profile_id} onChange={(e) => setAccessForm({ ...accessForm, profile_id: e.target.value })} className="mt-1 h-9 w-full rounded-lg border px-3"><option value="">Sem perfil</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} · v{profile.version}</option>)}</select></label><label className="text-sm">Equipe / setor / unidade<select value={accessForm.organization_unit_id} onChange={(e) => setAccessForm({ ...accessForm, organization_unit_id: e.target.value })} className="mt-1 h-9 w-full rounded-lg border px-3"><option value="">Sem vínculo</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name} ({unit.kind})</option>)}</select></label><label className="text-sm">Cargo<input value={accessForm.job_title} onChange={(e) => setAccessForm({ ...accessForm, job_title: e.target.value })} className="mt-1 h-9 w-full rounded-lg border px-3" /></label><label className="text-sm">Função<input value={accessForm.function_name} onChange={(e) => setAccessForm({ ...accessForm, function_name: e.target.value })} className="mt-1 h-9 w-full rounded-lg border px-3" /></label><label className="text-sm">Escopo de produtos<input value={accessForm.scope_products} onChange={(e) => setAccessForm({ ...accessForm, scope_products: e.target.value })} placeholder="mediamind-ai, produto-2" className="mt-1 h-9 w-full rounded-lg border px-3" /></label><label className="text-sm">Permissões adicionais<input value={accessForm.allow_permissions} onChange={(e) => setAccessForm({ ...accessForm, allow_permissions: e.target.value })} placeholder="conteudo.publicar" className="mt-1 h-9 w-full rounded-lg border px-3" /></label><label className="text-sm md:col-span-2">Permissões bloqueadas<input value={accessForm.deny_permissions} onChange={(e) => setAccessForm({ ...accessForm, deny_permissions: e.target.value })} placeholder="saas.excluir" className="mt-1 h-9 w-full rounded-lg border px-3" /></label><div className="md:col-span-2"><Button type="submit"><KeyRound className="h-4 w-4" />Salvar e recalcular acesso</Button></div></form>{effective && <div className="mt-5 grid gap-3 border-t pt-4 md:grid-cols-2"><div><p className="text-xs font-semibold uppercase text-slate-500">Origem e herança</p><p className="mt-1 text-sm">Papel: {effective.membership_role}</p><p className="text-sm">Perfil: {effective.profile?.name || "—"}</p><p className="text-sm">Estrutura: {effective.organization_path.join(" → ") || "—"}</p><div className="mt-2 flex flex-wrap gap-1">{effective.sources.map((source) => <span key={source} className="rounded bg-slate-100 px-2 py-1 text-xs">{source}</span>)}</div></div><div><p className="text-xs font-semibold uppercase text-slate-500">Resultado</p><div className="mt-2 flex flex-wrap gap-1">{effective.permissions.map((permission) => <span key={permission} className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{permission}</span>)}{effective.denied_permissions.map((permission) => <span key={permission} className="rounded bg-rose-50 px-2 py-1 text-xs text-rose-700">Bloqueada: {permission}</span>)}</div></div></div>}{contextMessage && <p role="status" className="mt-3 text-sm text-emerald-700">{contextMessage}</p>}</div></Card>}
        </div>
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
      ) : view === "product" ? (
        <Card>
          {filteredU.length === 0 ? <EmptyState icon={Users} title="Nenhum usuário sincronizado" /> : (
            <div className="divide-y divide-slate-100">
              {filteredU.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{u.full_name || u.email}</p>
                    <p className="truncate text-xs text-slate-400">{u.saas_product_id} · {u.role || "—"} · {u.product_tenant || "—"}</p>
                  </div>
                  <span className="hidden text-xs text-slate-400 sm:block">{fmtDate(u.last_sync)}</span>
                  <StatusBadge map={PRODUCT_USER_STATUS} value={u.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : view === "profiles" ? (
        <div className="grid gap-3 md:grid-cols-2">{filteredProfiles.length ? filteredProfiles.map((profile) => <Card key={profile.id}><div className="p-4"><div className="flex items-start justify-between"><div><p className="font-semibold text-slate-900">{profile.name}</p><p className="text-sm text-slate-500">{profile.description || "Sem descrição"}</p></div><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">v{profile.version}</span></div><div className="mt-3 flex flex-wrap gap-1">{profile.permissions.map((permission) => <span key={permission} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{permission}</span>)}</div></div></Card>) : <Card><EmptyState icon={ShieldCheck} title="Nenhum perfil cadastrado" description="Crie um perfil após cadastrar as permissões necessárias." /></Card>}</div>
      ) : (
        <Card>{filteredPermissions.length ? <div className="divide-y divide-slate-100">{filteredPermissions.map((permission) => <div key={permission.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"><div><p className="font-mono text-sm font-semibold">{permission.code}</p><p className="text-xs text-slate-500">{permission.description}</p></div><span className="text-sm text-slate-600">{permission.resource}</span><span className="text-sm text-slate-600">{permission.action}</span><span className="rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-700">{permission.scope}</span></div>)}</div> : <EmptyState icon={ShieldCheck} title="Nenhuma permissão cadastrada" description="Cadastre recursos e ações antes de montar perfis." />}</Card>
      )}

      <NewManagerDialog open={managerOpen} onOpenChange={setManagerOpen} onCreated={load} />
      <NewProductUserDialog open={productOpen} onOpenChange={setProductOpen} onCreated={load} />
      <NewPermissionDialog open={permissionOpen} onOpenChange={setPermissionOpen} onCreated={load} />
      <NewProfileDialog open={profileOpen} onOpenChange={setProfileOpen} onCreated={load} permissions={permissions} />
    </div>
  );
}
