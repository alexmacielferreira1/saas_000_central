import React from 'react'

const styles = {
  REAL: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  PARCIAL: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  PLANEJADO: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  INDISPONIVEL: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  BLOQUEADO: 'bg-orange-50 text-orange-700 ring-orange-600/20',
}

export default function Adm2StatusBadge({ status }) {
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold tracking-wide ring-1 ring-inset ${styles[status]}`}>{status}</span>
}
