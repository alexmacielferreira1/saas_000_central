import React from "react";
import { useTenant, ORGANIZATIONS } from "@/lib/TenantContext";
import { ChevronDown, Check, Building2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function TenantSwitcher() {
  const { orgId, setOrgId } = useTenant();
  const active = ORGANIZATIONS.find((o) => o.id === orgId) || ORGANIZATIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-[11px] font-semibold text-white">
            {active.avatar}
          </span>
          <span className="hidden max-w-[120px] truncate sm:block">{active.name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-slate-500">
          <Building2 className="h-3.5 w-3.5" /> Empresa ativa
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ORGANIZATIONS.map((o) => (
          <DropdownMenuItem
            key={o.id}
            onClick={() => setOrgId(o.id)}
            className="flex items-center gap-2"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-[11px] font-semibold text-white">
              {o.avatar}
            </span>
            <span className="flex-1 truncate text-sm">{o.name}</span>
            {o.id === orgId && <Check className="h-4 w-4 text-emerald-600" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-[11px] leading-snug text-slate-400">
          Trocar de empresa recarrega os dados da Busca Global sob o novo escopo — registros de outras empresas não aparecem.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}