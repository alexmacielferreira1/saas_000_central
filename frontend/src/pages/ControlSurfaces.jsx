import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listSaas, listAuditLogs } from "@/api/saasRegistry";
import { listConnections, listObservations } from "@/api/integrations";
import { listOperations, updateOperationStatus } from "@/api/operations";
import { listManagers, listPermissions, listProfiles } from "@/api/access";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, EmptyState, ErrorState, KpiCard } from "@/components/ui-primitives";
import { Boxes, Network, Activity, AlertTriangle, TerminalSquare, RefreshCw, ShieldCheck, Users, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function useLoad(loader) {
  const [state,setState]=useState({loading:true,error:false,data:null});
  const load=async()=>{try{setState(s=>({...s,loading:true,error:false}));setState({loading:false,error:false,data:await loader()});}catch{setState({loading:false,error:true,data:null});}};
  useEffect(()=>{load();},[]); return {...state,load};
}
function Loading(){return <div className="h-64 animate-pulse rounded-xl bg-slate-100"/>;}

export function EcosystemMap(){
  const {data,loading,error,load}=useLoad(async()=>{const [products,connections,operations]=await Promise.all([listSaas(),listConnections(),listOperations()]);return{products,connections,operations};});
  if(loading)return <Loading/>; if(error)return <Card><ErrorState onRetry={load}/></Card>;
  return <div><PageHeader title="Mapa de controle" description="Tudo que a Central conhece, administra e ainda precisa conectar — em linguagem direta." icon={Network} actions={<Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-2 h-4 w-4"/>Atualizar</Button>}/>
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><KpiCard label="SaaS cadastrados" value={data.products.length} icon={Boxes} tone="indigo"/><KpiCard label="Conexões administrativas" value={data.connections.length} icon={Network} tone="emerald"/><KpiCard label="Operações acompanhadas" value={data.operations.length} icon={TerminalSquare} tone="amber"/></div>
    <div className="grid gap-4 lg:grid-cols-2">{data.products.map(product=>{const connection=data.connections.find(c=>c.product.id===product.id);const operations=data.operations.filter(o=>o.saas===product.name||o.saas===product.slug);return <Card key={product.id}><CardBody><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{product.name}</p><p className="text-xs text-slate-500">{product.description||product.slug}</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${connection?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{connection?"Conectado":"Somente inventário"}</span></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-lg bg-slate-50 p-2"><p className="text-xs text-slate-400">Usuários</p><p className="font-semibold">{product.user_count||0}</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-xs text-slate-400">Clientes</p><p className="font-semibold">{product.tenant_count||0}</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-xs text-slate-400">Operações</p><p className="font-semibold">{operations.length}</p></div></div><div className="mt-4 flex gap-2"><Button asChild size="sm" variant="outline"><Link to={`/saas/${product.id}`}>Abrir SaaS 360</Link></Button><Button asChild size="sm" variant="outline"><Link to="/integrations">Ver conexão</Link></Button></div></CardBody></Card>;})}</div>
  </div>;
}

export function HealthCenter(){
  const {data,loading,error,load}=useLoad(async()=>{const [connections,observations]=await Promise.all([listConnections(),listObservations()]);return{connections,observations};});
  const latest=useMemo(()=>{const map={};(data?.observations||[]).forEach(o=>{if(!map[o.connection_id])map[o.connection_id]=o;});return map;},[data]);
  if(loading)return <Loading/>; if(error)return <Card><ErrorState onRetry={load}/></Card>;
  return <div><PageHeader title="Saúde operacional" description="Estado confirmado, latência e idade da última evidência de cada ambiente." icon={Activity} actions={<Button asChild size="sm"><Link to="/integrations">Verificar conexões</Link></Button>}/><div className="space-y-3">{data.connections.length?data.connections.map(c=>{const o=latest[c.id];return <Card key={c.id}><CardBody className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]"><div><p className="font-semibold">{c.product.name}</p><p className="text-xs text-slate-500">{c.environment} · {c.base_url}</p></div><div><p className="text-xs text-slate-400">Estado</p><p className="text-sm font-semibold">{o?.status||c.status}</p></div><div><p className="text-xs text-slate-400">Latência</p><p className="text-sm font-semibold">{o?.latency_ms==null?"—":`${o.latency_ms} ms`}</p></div><div><p className="text-xs text-slate-400">Evidência</p><p className={`text-sm font-semibold ${o?.freshness==="stale"?"text-amber-600":"text-emerald-600"}`}>{o?.freshness==="confirmed"?"Atual":o?.freshness==="stale"?"Desatualizada":"Ausente"}</p></div></CardBody></Card>;}):<Card><EmptyState icon={Activity} title="Sem conexões monitoradas" description="Cadastre uma conexão na Central de Integrações."/></Card>}</div></div>;
}

export function ErrorCenter(){
  const {data,loading,error,load}=useLoad(async()=>{const [observations,audit]=await Promise.all([listObservations(),listAuditLogs()]);return{observations,audit};});
  if(loading)return <Loading/>; if(error)return <Card><ErrorState onRetry={load}/></Card>;
  const failures=data.observations.filter(o=>o.failure_code||!["healthy","degraded"].includes(o.status));
  return <div><PageHeader title="Erros e evidências" description="Falhas técnicas confirmadas pela Central, com origem e correlação para agir sem adivinhação." icon={AlertTriangle} actions={<Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-2 h-4 w-4"/>Atualizar</Button>}/><div className="mb-5 grid gap-4 sm:grid-cols-3"><KpiCard label="Falhas observadas" value={failures.length} icon={AlertTriangle} tone="rose"/><KpiCard label="Eventos auditados" value={data.audit.length} icon={ShieldCheck} tone="indigo"/><KpiCard label="Prontas para triagem" value={failures.filter(f=>f.freshness==="confirmed").length} icon={Activity} tone="amber"/></div>{failures.length?<div className="space-y-3">{failures.map(f=><Card key={f.id}><CardBody><div className="flex items-start justify-between"><div><p className="font-semibold text-slate-900">{f.failure_code||f.status}</p><p className="text-xs text-slate-500">{f.source} · {new Date(f.observed_at).toLocaleString("pt-BR")}</p></div><Button asChild size="sm" variant="outline"><Link to="/resolution">Abrir na resolução</Link></Button></div><p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{f.evidence?.message||"A integração informou estado não saudável."}</p></CardBody></Card>)}</div>:<Card><EmptyState icon={ShieldCheck} title="Nenhuma falha confirmada" description="Execute verificações nas integrações para produzir evidências atuais."/></Card>}</div>;
}

export function JobsCenter(){
  const {data,loading,error,load}=useLoad(()=>listOperations()); const [busy,setBusy]=useState("");
  const change=async(id,status)=>{try{setBusy(id);await updateOperationStatus(id,status,`Ação executada no painel de jobs: ${status}`);await load();}finally{setBusy("");}};
  if(loading)return <Loading/>; if(error)return <Card><ErrorState onRetry={load}/></Card>;
  return <div><PageHeader title="Jobs e execuções" description="Acompanhe, aprove, rejeite e reprocese trabalhos administrativos em um só lugar." icon={TerminalSquare}/>{data.length?<div className="space-y-3">{data.map(job=><Card key={job.id}><CardBody className="flex flex-wrap items-center gap-4"><div className="min-w-0 flex-1"><p className="font-semibold">{job.action} · {job.entity}</p><p className="text-xs text-slate-500">{job.saas} · {job.id}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{job.status}</span>{job.status==="awaiting_confirmation"&&<><Button size="sm" disabled={busy===job.id} onClick={()=>change(job.id,"executing")}><Play className="mr-2 h-4 w-4"/>Aprovar</Button><Button size="sm" variant="outline" disabled={busy===job.id} onClick={()=>change(job.id,"rejected")}><X className="mr-2 h-4 w-4"/>Rejeitar</Button></>}</CardBody></Card>)}</div>:<Card><EmptyState icon={TerminalSquare} title="Nenhuma execução" description="As operações administrativas aparecerão aqui."/></Card>}</div>;
}

export function AdministrationOverview(){
  const {data,loading,error,load}=useLoad(async()=>{const [managers,profiles,permissions,products]=await Promise.all([listManagers(),listProfiles(),listPermissions(),listSaas()]);return{managers,profiles,permissions,products};});
  if(loading)return <Loading/>; if(error)return <Card><ErrorState onRetry={load}/></Card>;
  const cards=[['Administradores',data.managers.length,'managers','Contas com responsabilidade sobre a Central.'],['Perfis de acesso',data.profiles.length,'profiles','Pacotes versionados de permissões.'],['Permissões',data.permissions.length,'permissions','Ações autorizáveis pelo backend.'],['SaaS administrados',data.products.length,'saas','Produtos sob controle desta organização.']];
  return <div><PageHeader title="Visão da administração" description="Pessoas, contas, perfis, permissões e produtos — separados para evitar acessos indevidos." icon={Users}/><div className="grid gap-4 md:grid-cols-2">{cards.map(([title,count,view,desc])=><Card key={view}><CardBody><div className="flex items-center justify-between"><p className="font-semibold">{title}</p><span className="text-2xl font-bold">{count}</span></div><p className="mt-2 text-sm text-slate-500">{desc}</p><Button asChild className="mt-4" size="sm" variant="outline"><Link to={`/administration?view=${view}`}>Administrar agora</Link></Button></CardBody></Card>)}</div></div>;
}
