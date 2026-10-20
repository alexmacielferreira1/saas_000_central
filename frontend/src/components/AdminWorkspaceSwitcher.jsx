import React from 'react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

const workspaces = [
  { to: '/adm1', label: 'Adm 1 — Atual' },
  { to: '/adm2', label: 'Adm 2 — Evolução' },
]

export default function AdminWorkspaceSwitcher({ compact = false }) {
  return (
    <nav aria-label="Alternar área administrativa" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
      {workspaces.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => cn(
            'rounded-lg px-3 py-2 text-center text-xs font-semibold transition-colors',
            isActive ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900',
          )}
        >
          {compact ? label.replace(/ — .+$/, '') : label}
        </NavLink>
      ))}
    </nav>
  )
}
