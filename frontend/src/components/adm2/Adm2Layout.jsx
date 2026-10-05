import React from 'react'
import { NavLink } from 'react-router-dom'

import Adm2StatusBadge from './Adm2StatusBadge'
import { ADM2_ITEMS } from '@/lib/adminWorkspaces'
import { cn } from '@/lib/utils'

export default function Adm2Layout({ children }) {
  const available = ADM2_ITEMS.filter((item) => item.to)

  return (
    <section className="space-y-5">
      <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-6 text-white shadow-xl shadow-blue-950/10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Área isolada de evolução</p>
        <h1 className="mt-2 text-2xl font-semibold">Adm 2 — Evolução</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Novas telas são conectadas gradualmente. Cada módulo informa se usa dados reais, integração parcial ou se ainda está planejado.</p>
      </header>

      <nav aria-label="Navegação do Adm 2" className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {available.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.to === '/adm2'}
            className={({ isActive }) => cn('whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div>{children}</div>
      <footer className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>Leitura dos estados:</span>
        <Adm2StatusBadge status="REAL" />
        <Adm2StatusBadge status="PARCIAL" />
        <Adm2StatusBadge status="PLANEJADO" />
      </footer>
    </section>
  )
}
