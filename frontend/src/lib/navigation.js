import {
  LayoutDashboard, Boxes, Users, Settings2, ScrollText, TerminalSquare,
  AlertTriangle, Plug, ShieldCheck, Activity, BookOpen, DatabaseZap, Network,
  HeartPulse, Bug, ListTodo, Workflow, Coins, BrainCircuit, HardDrive, Rocket,
  Scale, Home, LayoutGrid, CircleDollarSign, Sparkles, PlusCircle, CloudUpload,
} from "lucide-react";

// Menu principal enxuto, no modelo do protótipo "Central SaaS — Protótipo" (Artifacts).
// Cada item aponta para uma tela real já existente; nada aqui é tela fictícia.
export const PRIMARY_NAV = [
  { to: "/", label: "Início", icon: Home, end: true },
  { to: "/saas", label: "Meus SaaS", icon: LayoutGrid },
  { to: "/health", label: "Saúde", icon: HeartPulse },
  { to: "/resolution", label: "Problemas", icon: AlertTriangle },
  { to: "/administration", label: "Usuários", icon: Users },
  { to: "/commercial/plans", label: "Financeiro", icon: CircleDollarSign },
  { to: "/usage", label: "IA e Custos", icon: Sparkles },
];

// Ações e áreas de gestão, abaixo do divisor (mesma ordem do protótipo).
// "Criar SaaS" abre o diálogo real de cadastro da lista de SaaS (?novo=saas).
export const SECONDARY_NAV = [
  { to: "/saas?novo=saas", label: "Criar SaaS", icon: PlusCircle, action: true },
  { to: "/operations/releases", label: "Publicações", icon: CloudUpload },
  { to: "/configurations", label: "Configurações", icon: Settings2 },
];

// Menu completo anterior, preservado em standby dentro do grupo "Arquivo".
export const ARCHIVE_NAV = [
  { to: "/", label: "Home do ecossistema", icon: LayoutDashboard, end: true },
  { to: "/control-map", label: "Mapa de controle", icon: Network },
  { to: "/resolution", label: "Central de Resolução", icon: Activity },
  { to: "/api-guides", label: "Guias das APIs", icon: BookOpen },
  { to: "/saas", label: "SaaS 360", icon: Boxes },
  { to: "/administration", label: "Administração", icon: Users },
  { to: "/experience/screens", label: "Governança de telas", icon: Workflow },
  { to: "/configurations", label: "Configurações & Flags", icon: Settings2 },
  { to: "/operations", label: "Centro de Operações", icon: TerminalSquare },
  { to: "/operations/jobs", label: "Jobs e execuções", icon: ListTodo },
  { to: "/audit", label: "Auditoria", icon: ScrollText },
  { to: "/incidents", label: "Incidentes", icon: AlertTriangle },
  { to: "/integrations", label: "Integrações & Saúde", icon: Plug },
  { to: "/health", label: "Saúde operacional", icon: HeartPulse },
  { to: "/errors", label: "Erros e evidências", icon: Bug },
  { to: "/data/imports/new", label: "Importar dados", icon: DatabaseZap },
  { to: "/commercial/plans", label: "Planos e produtos", icon: Boxes },
  { to: "/usage", label: "Uso e custos", icon: Coins },
  { to: "/ai/governance", label: "Governança de IA", icon: BrainCircuit },
  { to: "/storage", label: "Storage e arquivos", icon: HardDrive },
  { to: "/operations/releases", label: "Versões e publicações", icon: Rocket },
  { to: "/security", label: "Segurança", icon: ShieldCheck },
  { to: "/privacy/data-inventory", label: "Privacidade e LGPD", icon: Scale },
  { to: "/continuity/backups", label: "Continuidade e backups", icon: DatabaseZap },
  { to: "/docs", label: "Documentação", icon: BookOpen },
];

function matches(pathname, { to, end }) {
  const path = to.split("?")[0];
  if (end || path === "/") return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

// True quando a tela atual só é alcançável pelo Arquivo (abre o grupo automaticamente).
export function isArchiveOnlyPath(pathname) {
  const inMenu = [...PRIMARY_NAV, ...SECONDARY_NAV].some((item) => !item.action && matches(pathname, item));
  return !inMenu && ARCHIVE_NAV.some((item) => matches(pathname, item));
}
