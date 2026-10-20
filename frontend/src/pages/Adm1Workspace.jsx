import React from 'react'
import { ArrowUpRight, Layers3 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ADM1_ITEMS } from '@/lib/adminWorkspaces'

export default function Adm1Workspace() {
  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-slate-900 p-2.5 text-white"><Layers3 className="h-5 w-5" /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Workspace preservado</p>
            <h1 className="text-2xl font-semibold text-slate-950">Adm 1 — Atual</h1>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
          Todas as telas atuais continuam nas rotas originais. Este índice organiza o acesso sem copiar nem substituir a implementação existente.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ADM1_ITEMS.map((item) => (
          <Link
            key={item.id}
            to={item.entryTo}
            aria-label={item.to.includes('/:') ? `${item.label} — abrir pelo catálogo` : item.label}
            className="group flex min-h-20 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
          >
            <span>{item.label}{item.to.includes('/:') && <span className="ml-1 text-xs font-normal text-slate-400">(abrir pelo catálogo)</span>}</span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-indigo-600" />
          </Link>
        ))}
      </div>
    </section>
  )
}
