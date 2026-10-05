import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { listSaas } from '@/api/saasRegistry'
import Adm2Layout from '@/components/adm2/Adm2Layout'

export default function Adm2Products() {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => { listSaas().then((data) => setItems(data || [])).catch(() => setError(true)).finally(() => setLoading(false)) }, [])
  const filtered = useMemo(() => items.filter((item) => `${item.name || ''} ${item.slug || ''}`.toLowerCase().includes(query.toLowerCase())), [items, query])

  return (
    <Adm2Layout>
      <div className="space-y-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Inventário conectado</p><h2 className="mt-1 text-xl font-semibold text-slate-950">SaaS e produtos</h2><p className="mt-2 text-sm text-slate-600">Criação e edição permanecem nas telas atuais até uma migração específica ser validada.</p></div>
        <label className="block max-w-md text-xs font-semibold uppercase tracking-wide text-slate-500">Filtro local<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nome ou slug" className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm normal-case tracking-normal text-slate-900" /></label>
        {loading ? <p className="text-sm text-slate-500">Carregando inventário real…</p> : error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-5"><h3 className="font-semibold text-rose-900">Inventário indisponível</h3><p className="mt-1 text-sm text-rose-700">Não foram inseridos produtos demonstrativos.</p></div> : filtered.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">{query ? 'Nenhum produto corresponde ao filtro local.' : 'Nenhum produto registrado.'}</p> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <Link key={item.id} to={`/saas/${item.id}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300"><h3 className="font-semibold text-slate-900">{item.name}</h3><p className="mt-1 text-sm text-slate-500">{item.slug || 'Sem slug'}</p><div className="mt-4 flex gap-2 text-xs text-slate-600"><span>{item.status || 'Status indisponível'}</span><span>·</span><span>{item.health || 'Saúde indisponível'}</span></div></Link>)}</div>}
      </div>
    </Adm2Layout>
  )
}
