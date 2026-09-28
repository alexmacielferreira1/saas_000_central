import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listAuditLogs, listCapabilityManifests, listConfigurations, listSaas } from "@/api/saasRegistry";
import { listConnections, listObservations } from "@/api/integrations";
import { listOperations } from "@/api/operations";
import { createControlResource, listControlResources } from "@/api/controlResources";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, ErrorState, KpiCard } from "@/components/ui-primitives";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Boxes, Coins, Database, FileText, Flag, HardDrive, RefreshCw, Rocket, Scale, ShieldCheck, Workflow } from "lucide-react";

const definitions = {
  screens: { title:"Governança de telas", description:"Módulos, telas, ações e recursos declarados por cada SaaS.", icon:Workflow, kind:"product_module", singular:"módulo" },
  commercial: { title:"Planos e produtos", description:"Visão comercial consolidada dos produtos, clientes e disponibilidade.", icon:Boxes, kind:"plan", singular:"plano" },
  usage: { title:"Uso e custos", description:"Base para acompanhar consumo, operações e custos por SaaS.", icon:Coins, kind:"usage_record", singular:"registro de uso" },
  ai: { title:"Governança de IA", description:"Recursos de IA declarados, uso auditado e limites administrativos.", icon:BrainCircuit, kind:"ai_policy", singular:"política" },
  storage: { title:"Storage e arquivos", description:"Recursos de armazenamento declarados e sua disponibilidade.", icon:HardDrive, kind:"storage_policy", singular:"política" },
  releases: { title:"Versões e publicações", description:"Versões cadastradas, compatibilidade e evidências de atualização.", icon:Rocket, kind:"release", singular:"versão" },
  security: { title:"Segurança e acessos", description:"Eventos administrativos, conexões protegidas e pontos de atenção.", icon:ShieldCheck, kind:"security_review", singular:"revisão" },
  privacy: { title:"Privacidade e LGPD", description:"Inventário inicial de produtos, dados declarados e rastreabilidade.", icon:Scale, kind:"data_inventory", singular:"item de dados" },
  continuity: { title:"Continuidade e backups", description:"Situação de integrações e evidências necessárias para recuperação.", icon:Database, kind:"backup", singular:"backup" },
  docs: { title:"Documentação operacional", description:"Contratos, recursos disponíveis e acesso rápido aos SaaS.", icon:FileText, kind:"document", singular:"documento" },
  flags: { title:"Módulos e feature flags", description:"Configurações versionadas e recursos ativáveis por produto.", icon:Flag, kind:"feature_flag", singular:"flag" },
};

function CapabilityCenter({ kind }) {
  const definition=definitions[kind]; const Icon=definition.icon;
  const [state,setState]=useState({loading:true,error:false,data:null}); const [query,setQuery]=useState(""); const [creating,setCreating]=useState(false); const [form,setForm]=useState({key:"",name:"",description:"",status:"draft"});
  const load=async()=>{try{setState(s=>({...s,loading:true,error:false}));const [products,manifests,configurations,connections,observations,operations,audit,records]=await Promise.all([listSaas(),listCapabilityManifests(),listConfigurations(),listConnections(),listObservations(),listOperations(),listAuditLogs(),listControlResources(definition.kind)]);setState({loading:false,error:false,data:{products,manifests,configurations,connections,observations,operations,audit,records}});}catch{setState({loading:false,error:true,data:null});}};
  useEffect(()=>{load();},[]);
  const products=useMemo(()=>state.data?.products?.filter(p=>!query||`${p.name} ${p.slug}`.toLowerCase().includes(query.toLowerCase()))||[],[state.data,query]);
  if(state.loading)return <div className="h-64 animate-pulse rounded-xl bg-slate-100"/>;
  if(state.error)return <Card><ErrorState onRetry={load}/></Card>;
  const d=state.data;
  const submit=async(e)=>{e.preventDefault();await createControlResource({...form,kind:definition.kind,data:{source:"central-ui"}});setForm({key:"",name:"",description:"",status:"draft"});setCreating(false);await load();};
  return <div><PageHeader title={definition.title} description={definition.description} icon={Icon} actions={<div className="flex gap-2"><Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-2 h-4 w-4"/>Atualizar</Button><Button size="sm" onClick={()=>setCreating(v=>!v)}>Novo {definition.singular}</Button></div>}/>
    {creating&&<Card className="mb-5"><form onSubmit={submit} className="grid gap-3 p-4 md:grid-cols-2"><label className="text-sm">Chave técnica<input required pattern="[a-z0-9][a-z0-9_.-]+" value={form.key} onChange={e=>setForm({...form,key:e.target.value.toLowerCase()})} className="mt-1 h-9 w-full rounded-lg border px-3" placeholder="exemplo.chave"/></label><label className="text-sm">Nome<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1 h-9 w-full rounded-lg border px-3"/></label><label className="text-sm md:col-span-2">Descrição<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="mt-1 w-full rounded-lg border px-3 py-2" rows={2}/></label><div className="flex gap-2"><Button type="submit">Salvar</Button><Button type="button" variant="outline" onClick={()=>setCreating(false)}>Cancelar</Button></div></form></Card>}
    <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4"><KpiCard label="Produtos" value={d.products.length} icon={Boxes} tone="indigo"/><KpiCard label="Recursos declarados" value={d.manifests.length} icon={Workflow} tone="emerald"/><KpiCard label="Configurações" value={d.configurations.length} icon={Flag} tone="amber"/><KpiCard label="Evidências" value={d.observations.length+d.audit.length} icon={ShieldCheck} tone="indigo"/></div>
    {d.records.length>0&&<div className="mb-5 grid gap-3 md:grid-cols-2">{d.records.map(record=><Card key={record.id}><CardBody><div className="flex justify-between gap-3"><div><p className="font-semibold">{record.name}</p><p className="text-xs text-slate-500">{record.key} · v{record.version}</p></div><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">{record.status}</span></div><p className="mt-2 text-sm text-slate-600">{record.description||"Sem descrição"}</p></CardBody></Card>)}</div>}
    <div className="mb-4 flex flex-wrap gap-2"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar SaaS..." className="h-9 min-w-64 rounded-lg border border-slate-200 px-3 text-sm"/><Button asChild variant="outline" size="sm"><Link to="/control-map">Ver mapa completo</Link></Button><Button asChild variant="outline" size="sm"><Link to="/operations">Abrir operações</Link></Button></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{products.map(product=>{const manifest=d.manifests.find(m=>m.saas_product_id===product.id);const connection=d.connections.find(c=>c.product.id===product.id);const configs=d.configurations.filter(c=>c.saas_product_id===product.id);return <Card key={product.id}><CardBody><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{product.name}</p><p className="text-xs text-slate-500">v{product.version||"—"} · {product.slug}</p></div><span className={`rounded-full px-2 py-1 text-xs font-medium ${connection?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-600"}`}>{connection?"Conectado":"Inventário"}</span></div><div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded bg-slate-50 p-2"><p className="text-slate-400">Recursos</p><p className="font-semibold">{manifest?.capabilities?.length||0}</p></div><div className="rounded bg-slate-50 p-2"><p className="text-slate-400">Config.</p><p className="font-semibold">{configs.length}</p></div><div className="rounded bg-slate-50 p-2"><p className="text-slate-400">Clientes</p><p className="font-semibold">{product.tenant_count||0}</p></div></div><Button asChild size="sm" variant="outline" className="mt-4"><Link to={`/saas/${product.id}`}>Administrar no SaaS 360</Link></Button></CardBody></Card>;})}</div>
  </div>;
}

export const ScreenGovernance=()=> <CapabilityCenter kind="screens"/>;
export const CommercialCenter=()=> <CapabilityCenter kind="commercial"/>;
export const UsageCostCenter=()=> <CapabilityCenter kind="usage"/>;
export const AiGovernance=()=> <CapabilityCenter kind="ai"/>;
export const StorageCenter=()=> <CapabilityCenter kind="storage"/>;
export const ReleaseCenter=()=> <CapabilityCenter kind="releases"/>;
export const SecurityCenter=()=> <CapabilityCenter kind="security"/>;
export const PrivacyCenter=()=> <CapabilityCenter kind="privacy"/>;
export const ContinuityCenter=()=> <CapabilityCenter kind="continuity"/>;
export const DocumentationCenter=()=> <CapabilityCenter kind="docs"/>;
export const FeatureCenter=()=> <CapabilityCenter kind="flags"/>;
