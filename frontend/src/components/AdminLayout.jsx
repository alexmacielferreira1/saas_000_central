import React, { useState, useEffect } from "react";
import { Outlet, NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Menu, LogOut, Layers, Archive, ChevronDown } from "lucide-react";
import CommandPalette from "@/components/CommandPalette";
import { TenantProvider } from "@/lib/TenantContext";
import TenantSwitcher from "@/components/TenantSwitcher";
import QuickActionsMenu from "@/components/QuickActionsMenu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { ARCHIVE_NAV, PRIMARY_NAV, SECONDARY_NAV, isArchiveOnlyPath } from "@/lib/navigation";

const ARCHIVE_STORAGE_KEY = "central.nav.archiveOpen";

function readArchiveOpen() {
  try { return window.localStorage.getItem(ARCHIVE_STORAGE_KEY) === "1"; } catch { return false; }
}

function writeArchiveOpen(value) {
  try { window.localStorage.setItem(ARCHIVE_STORAGE_KEY, value ? "1" : "0"); } catch { /* preferência opcional */ }
}

const itemClass = (isActive) =>
  cn(
    "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.8px] transition-colors",
    isActive
      ? "bg-blue-50 font-bold text-blue-600"
      : "font-medium text-slate-600 hover:bg-slate-100"
  );

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [archiveOpen, setArchiveOpen] = useState(() => readArchiveOpen() || isArchiveOnlyPath(pathname));

  useEffect(() => {
    if (isArchiveOnlyPath(pathname)) setArchiveOpen(true);
  }, [pathname]);

  const toggleArchive = () => {
    setArchiveOpen((value) => {
      writeArchiveOpen(!value);
      return !value;
    });
  };

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
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-gradient-to-br from-[#3D6BF0] to-[#2249B8]">
          <Layers className="h-[17px] w-[17px] text-white" />
        </div>
        <p className="text-base font-extrabold text-slate-900">Central SaaS</p>
      </div>

      <nav aria-label="Menu principal" className="flex-1 space-y-0.5 overflow-y-auto px-3.5 pb-3">
        {PRIMARY_NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => itemClass(isActive)}>
            <Icon className="h-[17px] w-[17px] shrink-0 opacity-85" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}

        <div className="mx-1.5 my-3 h-px bg-slate-200" />

        {SECONDARY_NAV.map(({ to, label, icon: Icon, action }) =>
          action ? (
            <Link key={to} to={to} onClick={() => setOpen(false)} className={itemClass(false)}>
              <Icon className="h-[17px] w-[17px] shrink-0 opacity-85" />
              <span className="truncate">{label}</span>
            </Link>
          ) : (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => itemClass(isActive)}>
              <Icon className="h-[17px] w-[17px] shrink-0 opacity-85" />
              <span className="truncate">{label}</span>
            </NavLink>
          )
        )}

        <div className="mx-1.5 my-3 h-px bg-slate-200" />

        <button
          type="button"
          onClick={toggleArchive}
          aria-expanded={archiveOpen}
          aria-controls="central-nav-archive"
          className={itemClass(false)}
        >
          <Archive className="h-[17px] w-[17px] shrink-0 opacity-85" />
          <span className="truncate">Arquivo</span>
          <ChevronDown className={cn("ml-auto h-4 w-4 shrink-0 transition-transform", archiveOpen && "rotate-180")} />
        </button>
        {archiveOpen && (
          <div id="central-nav-archive" role="group" aria-label="Arquivo" className="ml-3 space-y-0.5 border-l border-slate-200 pl-2">
            {ARCHIVE_NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={`${to}-${label}`}
                to={to}
                end={end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.8px] transition-colors",
                    isActive ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  )
                }
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700">
            {(user?.full_name || user?.email || "A")?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-bold text-slate-900">{user?.full_name || "Administrador"}</p>
            <p className="truncate text-[11.5px] text-slate-500">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Sair" onClick={handleLogout} className="h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
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
      <aside className="hidden w-[250px] shrink-0 border-r border-slate-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white">
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
