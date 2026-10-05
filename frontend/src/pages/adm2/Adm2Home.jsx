import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getHomeSummary } from '@/api/home'
import { listSaas } from '@/api/saasRegistry'
import Adm2Layout from '@/components/adm2/Adm2Layout'

function Metric({ label, value, detail }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>
}

export default function Adm2Home() {
  const [state, setState] = useState({ loading: true, summaryError: false, productsError: false, summary: null, products: [] })

  useEffect(() => {
    Promise.allSettled([getHomeSummary(), listSaas()]).then(([summaryResult, productsResult]) => {
      setState({
        loading: false,
        summaryError: summaryResult.status === 'rejected',
        productsError: productsResult.status === 'rejected',
        summary: summaryResult.status === 'fulfilled' ? summaryResult.value : null,
        products: productsResult.status === 'fulfilled' ? productsResult.value || [] : [],
      })
    })
  }, [])

  const products = state.summary?.products
  const operations = state.summary?.operations
  const incidents = state.summary?.incidents

  return (
    <Adm2Layout>
      <div className="space-y-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Visão operacional</p><h2 className="mt-1 text-xl font-semibold text-slate-950">Minha manhã</h2></div>
        {state.summaryError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-6"><h3 className="font-semibold text-rose-900">Dados indisponíveis</h3><p className="mt-2 text-sm text-rose-700">A Central não conseguiu consultar o resumo real. Nenhuma métrica substituta foi exibida.</p></div> : <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="SaaS inventariados" value={state.loading ? 'Carregando…' : products?.total ?? 'Não integrado'} detail={products ? `${products.connected} conectado${products.connected === 1 ? '' : 's'}` : 'Origem indisponível'} />
          <Metric label="Saúde degradada" value={state.loading ? 'Carregando…' : products?.degraded ?? 'Não integrado'} detail="Conforme o registro atual" />
          <Metric label="Operações ativas" value={state.loading ? 'Carregando…' : operations?.availability === 'available' ? operations.active : 'Não integrado'} detail="Sem estimativas" />
          <Metric label="Incidentes abertos" value={state.loading ? 'Carregando…' : incidents?.availability === 'available' ? incidents.open : 'Não integrado'} detail="Sem dados demonstrativos" />
        </div>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">Produtos disponíveis</h3><Link className="text-sm font-semibold text-blue-700" to="/adm2/saas">Ver inventário</Link></div>
          {state.loading ? <p className="mt-4 text-sm text-slate-500">Carregando produtos…</p> : state.productsError ? <p className="mt-4 text-sm text-rose-700">Inventário de produtos indisponível.</p> : state.products.length === 0 ? <p className="mt-4 text-sm text-slate-500">Nenhum produto registrado.</p> : <div className="mt-4 grid gap-2 sm:grid-cols-2">{state.products.slice(0, 6).map((product) => <Link key={product.id} to={`/saas/${product.id}`} className="rounded-lg border border-slate-100 p-3 text-sm font-medium text-slate-800 hover:border-blue-200">{product.name}</Link>)}</div>}
        </section>
        <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5"><h3 className="font-semibold text-slate-800">Tarefas, aprovações e assistência por IA</h3><p className="mt-2 text-sm text-slate-600">Planejado. Ainda não há contrato backend real para exibir contadores ou ações.</p></section>
        </>}
      </div>
    </Adm2Layout>
  )
}
