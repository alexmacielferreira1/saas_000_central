// Single source of truth for quick "create" actions shared between the
// Command Palette (Ações group) and the Topbar "Novo" dropdown.
import { Boxes, AlertTriangle, Settings2, TerminalSquare, ShieldCheck, UserPlus } from "lucide-react";

export const ACTIONS = [
  { id: "saas", label: "Novo SaaS", entity: "Saas", icon: Boxes, path: "/saas", param: "saas", tint: "sky", keywords: "registrar cadastrar adicionar saas produto app aplicativo plataforma sistema ferramenta" },
  { id: "incident", label: "Novo incidente", entity: "Incident", icon: AlertTriangle, path: "/incidents", param: "incident", tint: "rose", keywords: "registrar cadastrar abrir incidente problema alerta falha erro bug outage critico" },
  { id: "config", label: "Nova configuração", entity: "Configuration", icon: Settings2, path: "/configurations", param: "config", tint: "violet", keywords: "nova criar configuracao flag feature limite ajuste parametro setting" },
  { id: "operation", label: "Nova operação", entity: "AdminCommand", icon: TerminalSquare, path: "/operations", param: "operation", tint: "amber", keywords: "nova criar operacao comando acao remota escrita executar batch" },
  { id: "manager", label: "Novo administrador", entity: "Manager", icon: ShieldCheck, path: "/users", param: "manager", tint: "indigo", keywords: "novo administrador gestor manager admin acesso identity" },
  { id: "product-user", label: "Novo usuário SaaS", entity: "ProductUser", icon: UserPlus, path: "/users", param: "product", tint: "teal", keywords: "novo usuario saas membro conta adicionar" },
];

// Synonyms that trigger creation actions when typed in the palette.
export const CREATE_SYNONYMS = ["novo", "nova", "novo/nova", "cadastrar", "criar", "adicionar", "iniciar", "registrar"];

// Portuguese keywords per entity — added as a weight-1 field so typing the
// type name surfaces the records of that entity.
export const ENTITY_KEYWORDS = {
  Saas: "saas produto app aplicativo plataforma sistema ferramenta servico",
  Incident: "incidente problema alerta falha erro bug outage downtime critico indisponibilidade",
  Configuration: "configuracao configuracoes flag feature limite ajuste parametro setting toggle",
  AdminCommand: "operacao operacoes comando acao remota escrita executar batch job",
  Manager: "administrador gestor manager admin acesso identity identidade",
  ProductUser: "usuario usuarios user produto saas membro conta",
  Audit: "auditoria audit log trilha evento historico rastro registro",
};

export function runAction(actionId, navigate) {
  const a = ACTIONS.find((x) => x.id === actionId);
  if (!a) return;
  const url = `${a.path}?novo=${encodeURIComponent(a.param)}`;
  if (navigate) navigate(url);
  else window.location.assign(url);
}