import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Boxes, Users, Settings2, ScrollText, TerminalSquare,
  AlertTriangle, Plug, Search, Menu, ShieldCheck, LogOut,
  Activity, BookOpen,
} from "lucide-react";
import CommandPalette from "@/components/CommandPalette";
import { TenantProvider } from "@/lib/TenantContext";
import TenantSwitcher from "@/components/TenantSwitcher";
import QuickActionsMenu from "@/components/QuickActionsMenu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home do ecossistema", icon: LayoutDashboard, end: true },
  { to: "/resolution", label: "Central de Resolução", icon: Activity },
  { to: "/api-guides", label: "Guias das APIs", icon: BookOpen },
  { to: "/saas", label: "SaaS 360", icon: Boxes },
  { to: "/users", label: "Usuários & Acesso", icon: Users },
  { to: "/configurations", label: "Configurações & Flags", icon: Settings2 },
  { to: "/operations", label: "Centro de Operações", icon: TerminalSquare },
  { to: "/audit", label: "Auditoria", icon: ScrollText },
  { to: "/incidents", label: "Incidentes", icon: AlertTriangle },
  { to: "/integrations", label: "Integrações & Saúde", icon: Plug },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Central SaaS</p>
          <p className="text-[11px] text-slate-400">Plano de Controle</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-white/10 text-white font-medium"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
            {(user?.full_name || user?.email || "A")?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-xs font-medium text-white">{user?.full_name || "Administrador"}</p>
            <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Sair" onClick={handleLogout} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <TenantProvider>
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 bg-slate-900 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-slate-900">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
          <Button variant="ghost" size="icon" aria-label="Abrir menu" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <TenantSwitcher />
          <div className="relative max-sm:hidden flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-14 text-left text-sm text-slate-400 hover:border-slate-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <span className="truncate">Buscar no ecossistema…</span>
            </button>
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 md:block">
              ⌘K
            </kbd>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Buscar no ecossistema" className="sm:hidden" onClick={() => setPaletteOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>
            <QuickActionsMenu />
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-2 py-1 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {(user?.full_name || user?.email || "A")?.[0]?.toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="max-w-[120px] truncate text-xs font-medium text-slate-700">{user?.full_name || "Administrador"}</p>
                <p className="max-w-[120px] truncate text-[11px] text-slate-400">{user?.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" aria-label="Sair" onClick={handleLogout} className="h-9 w-9 text-slate-500 hover:text-slate-800">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
    </TenantProvider>
  );
}
