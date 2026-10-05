import React from 'react'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'

import Adm2Layout from '@/components/adm2/Adm2Layout'
import Adm2StatusBadge from '@/components/adm2/Adm2StatusBadge'
import { ADM2_ITEMS } from '@/lib/adminWorkspaces'

function ModuleCard({ item }) {
  const body = (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition group-hover:border-blue-300 group-hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold text-slate-900">{item.label}</h2>
        <Adm2StatusBadge status={item.status} />
      </div>
      <p className="flex-1 text-sm leading-5 text-slate-600">{item.description}</p>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        {item.to ? <><span>Abrir módulo</span><ArrowRight className="h-3.5 w-3.5" /></> : <><LockKeyhole className="h-3.5 w-3.5" /><span>Aguardando integração</span></>}
      </div>
    </div>
  )

  return item.to ? <Link className="group" to={item.to}>{body}</Link> : body
}

export default function Adm2Overview() {
  return (
    <Adm2Layout>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ADM2_ITEMS.map((item) => <ModuleCard key={item.id} item={item} />)}
      </div>
    </Adm2Layout>
  )
}
