import React, { useEffect, useMemo, useState } from "react";
import { listSaas } from "@/api/saasRegistry";
import { createConnection, listConnections, listObservations, probeConnection } from "@/api/integrations";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, EmptyState, ErrorState, KpiCard } from "@/components/ui-primitives";
import { Plug, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Plus, ChevronDown, ChevronUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

const styles = { healthy: "bg-emerald-50 text-emerald-700", degraded: "bg-amber-50 text-amber-700", unavailable: "bg-rose-50 text-rose-700", not_configured: "bg-slate-100 text-slate-600", not_tested: "bg-slate-100 text-slate-600" };
const labels = { healthy: "Saudável", degraded: "Degradado", unavailable: "Indisponível", not_configured: "Não configurado", not_tested: "Não testado" };
function Status({ value }) { return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[value] || styles.not_tested}`}>{labels[value] || value}</span>; }

export default function Integrations() {
  const [connections, setConnections] = useState([]); const [observations, setObservations] = useState([]); const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(false); const [expanded, setExpanded] = useState(null);
  const [creating, setCreating] = useState(false); const [probing, setProbing] = useState("");
  const [form, setForm] = useState({ saas_product_id: "", name: "Admin API", environment: "local", base_url: "http://127.0.0.1:8000", credential_ref: "SAAS_HUB_ADMIN_TOKEN", freshness_ttl_seconds: 90 });
  const load = async () => { try { setError(false); setLoading(true); const [c,o,p] = await Promise.all([listConnections(), listObservations(), listSaas()]); setConnections(c||[]); setObservations(o||[]); setProducts(p||[]); } catch { setError(true); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const latest = useMemo(() => { const result={}; observations.forEach((o)=>{ if(!result[o.connection_id]) result[o.connection_id]=o; }); return result; }, [observations]);
  const statuses = connections.map((c)=>latest[c.id]?.status || c.status);
  const submit = async (e) => { e.preventDefault(); await createConnection({...form, freshness_ttl_seconds:Number(form.freshness_ttl_seconds)}); setCreating(false); await load(); };
  const probe = async (id) => { try { setProbing(id); await probeConnection(id); await load(); setExpanded(id); } finally { setProbing(""); } };
  return <div>
    <PageHeader title="Integrações e saúde" description="Conexões administrativas reais, ambientes, verificações e evidências do ecossistema." icon={Plug} actions={<div className="flex gap-2"><Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-2 h-4 w-4"/>Atualizar</Button><Button size="sm" onClick={()=>setCreating(v=>!v)}><Plus className="mr-2 h-4 w-4"/>Nova conexão</Button></div>}/>
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"><KpiCard label="Conexões" value={connections.length} icon={Plug} tone="indigo"/><KpiCard label="Saudáveis" value={statuses.filter(s=>s==="healthy").length} icon={CheckCircle2} tone="emerald"/><KpiCard label="Degradadas" value={statuses.filter(s=>s==="degraded").length} icon={AlertTriangle} tone="amber"/><KpiCard label="Ação necessária" value={statuses.filter(s=>!["healthy","degraded"].includes(s)).length} icon={XCircle} tone="rose"/></div>
    {creating && <Card className="mb-5"><form onSubmit={submit} className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
      <label className="text-sm">SaaS<select required value={form.saas_product_id} onChange={e=>setForm({...form,saas_product_id:e.target.value})} className="mt-1 h-10 w-full rounded-lg border px-3"><option value="">Selecione</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label className="text-sm">Nome<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1 h-10 w-full rounded-lg border px-3"/></label>
      <label className="text-sm">Ambiente<select value={form.environment} onChange={e=>setForm({...form,environment:e.target.value})} className="mt-1 h-10 w-full rounded-lg border px-3"><option value="local">Local</option><option value="development">Desenvolvimento</option><option value="staging">Homologação</option><option value="production">Produção</option></select></label>
      <label className="text-sm md:col-span-2">Endereço da API<input required type="url" value={form.base_url} onChange={e=>setForm({...form,base_url:e.target.value})} className="mt-1 h-10 w-full rounded-lg border px-3"/></label>
      <label className="text-sm">Referência segura<input required value={form.credential_ref} onChange={e=>setForm({...form,credential_ref:e.target.value.toUpperCase()})} className="mt-1 h-10 w-full rounded-lg border px-3 font-mono"/></label>
      <div className="flex items-end gap-2"><Button type="submit">Salvar conexão</Button><Button type="button" variant="outline" onClick={()=>setCreating(false)}>Cancelar</Button></div>
    </form></Card>}
    {loading ? <div className="h-60 animate-pulse rounded-xl bg-slate-100"/> : error ? <Card><ErrorState onRetry={load} description="Não foi possível carregar as conexões."/></Card> : connections.length===0 ? <Card><EmptyState icon={Plug} title="Nenhuma conexão configurada" description="Crie a primeira conexão e execute uma verificação real."/></Card> : <div className="space-y-3">{connections.map(c=>{ const o=latest[c.id], open=expanded===c.id; return <Card key={c.id}><CardBody><div className="flex flex-wrap items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Plug className="h-5 w-5"/></div><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{c.product.name}</p><p className="truncate text-xs text-slate-500">{c.environment} · {c.base_url}</p></div><Status value={o?.status||c.status}/><Button size="sm" variant="outline" disabled={probing===c.id} onClick={()=>probe(c.id)}><Activity className="mr-2 h-4 w-4"/>{probing===c.id?"Verificando...":"Verificar agora"}</Button><Button size="icon" variant="ghost" aria-label="Mostrar detalhes" onClick={()=>setExpanded(open?null:c.id)}>{open?<ChevronUp/>:<ChevronDown/>}</Button></div>
      {open && <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-3"><div><p className="text-xs text-slate-400">Credencial</p><p className="font-mono text-sm">{c.credential_ref_hint}</p></div><div><p className="text-xs text-slate-400">Última evidência</p><p className="text-sm">{o?new Date(o.observed_at).toLocaleString("pt-BR"):"Ainda não verificada"}</p></div><div><p className="text-xs text-slate-400">Atualidade</p><p className="text-sm">{o?.freshness==="confirmed"?"Confirmada":o?.freshness==="stale"?"Desatualizada":"Sem dados"}</p></div>{o&&<div className="md:col-span-3 rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-600">Evidência técnica saneada</p><pre className="mt-2 overflow-auto text-xs text-slate-600">{JSON.stringify(o.evidence,null,2)}</pre>{o.failure_code&&<p className="mt-2 text-xs font-semibold text-rose-600">Código: {o.failure_code}</p>}</div>}</div>}</CardBody></Card>;})}</div>}
  </div>;
}
