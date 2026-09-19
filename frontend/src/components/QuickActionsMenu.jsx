import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ACTIONS, runAction } from "@/lib/quickActions";
import { usePermissions } from "@/hooks/usePermissions";

export default function QuickActionsMenu() {
  const navigate = useNavigate();
  const { allowedActions } = usePermissions();
  if (allowedActions.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-xs text-slate-500">Criar novo</DropdownMenuLabel>
        {allowedActions.map((a) => (
          <DropdownMenuItem key={a.id} onClick={() => runAction(a.id, navigate)} className="gap-2">
            <a.icon className="h-4 w-4 text-slate-500" />
            <span className="flex-1 text-sm">{a.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}