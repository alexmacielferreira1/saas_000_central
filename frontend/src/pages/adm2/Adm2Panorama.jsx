import React, { useEffect, useState } from 'react'

import { getHomeSummary } from '@/api/home'
import Adm2Layout from '@/components/adm2/Adm2Layout'

const unavailable = 'Não integrado'

export default function Adm2Panorama() {
  const [state, setState] = useState({ loading: true, error: false, summary: null })
  useEffect(() => { getHomeSummary().then((summary) => setState({ loading: false, error: false, summary })).catch(() => setState({ loading: false, error: true, summary: null })) }, [])

  const summary = state.summary
  const rows = [
    ['Produtos inventariados', summary?.products?.total],
    ['Produtos conectados', summary?.products?.connected],
    ['Saúde degradada', summary?.products?.degraded],
    ['Operações ativas', summary?.operations?.availability === 'available' ? summary.operations.active : null],
    ['Incidentes abertos', summary?.incidents?.availability === 'available' ? summary.incidents.open : null],
  ]

  return (
    <Adm2Layout>
      <div className="space-y-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Dados da API da Central</p><h2 className="mt-1 text-xl font-semibold text-slate-950">Panorama do ecossistema</h2></div>
        {state.error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">Panorama indisponível. Nenhum valor foi presumido.</div> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{rows.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{state.loading ? 'Carregando…' : value ?? unavailable}</p></div>)}</div>}
      </div>
    </Adm2Layout>
  )
}
