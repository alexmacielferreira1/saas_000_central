// Shared status/label helpers for the Central SaaS admin hub

export const SAAS_STATUS = {
  connected: { label: "Conectado", tone: "emerald" },
  limited: { label: "Limitado", tone: "amber" },
  incompatible: { label: "Incompatível", tone: "rose" },
  auth_failed: { label: "Auth falhou", tone: "rose" },
  unavailable: { label: "Indisponível", tone: "slate" },
};

export const HEALTH = {
  healthy: { label: "Saudável", tone: "emerald" },
  degraded: { label: "Degradado", tone: "amber" },
  down: { label: "Down", tone: "rose" },
  unknown: { label: "Desconhecido", tone: "slate" },
};

export const COMPATIBILITY = {
  supported: { label: "Suportado", tone: "emerald" },
  deprecated: { label: "Deprecado", tone: "amber" },
  limited: { label: "Limitado", tone: "amber" },
  incompatible: { label: "Incompatível", tone: "rose" },
};

export const OP_STATUS = {
  draft: { label: "Rascunho", tone: "slate" },
  validating: { label: "Validando", tone: "sky" },
  awaiting_confirmation: { label: "Aguardando confirmação", tone: "amber" },
  queued: { label: "Na fila", tone: "violet" },
  executing: { label: "Executando", tone: "sky" },
  succeeded: { label: "Sucesso", tone: "emerald" },
  partial_success: { label: "Sucesso parcial", tone: "amber" },
  failed: { label: "Falhou", tone: "rose" },
  cancelled: { label: "Cancelado", tone: "slate" },
  rolled_back: { label: "Revertido", tone: "violet" },
};

export const INCIDENT_SEVERITY = {
  low: { label: "Baixa", tone: "slate" },
  medium: { label: "Média", tone: "sky" },
  high: { label: "Alta", tone: "amber" },
  critical: { label: "Crítica", tone: "rose" },
};

export const INCIDENT_STATUS = {
  open: { label: "Aberto", tone: "rose" },
  investigating: { label: "Investigando", tone: "amber" },
  resolved: { label: "Resolvido", tone: "emerald" },
  monitoring: { label: "Monitorando", tone: "sky" },
};

export const MANAGER_ROLE = {
  superadmin: { label: "Superadmin", tone: "violet" },
  delegated_admin: { label: "Admin delegado", tone: "sky" },
  operator: { label: "Operador", tone: "emerald" },
  viewer: { label: "Visualizador", tone: "slate" },
};

export const PRODUCT_USER_STATUS = {
  active: { label: "Ativo", tone: "emerald" },
  suspended: { label: "Suspenso", tone: "amber" },
  invited: { label: "Convidado", tone: "sky" },
  removed: { label: "Removido", tone: "slate" },
};

export const MANAGER_STATUS = {
  active: { label: "Ativo", tone: "emerald" },
  suspended: { label: "Suspenso", tone: "amber" },
  expired: { label: "Expirado", tone: "slate" },
  break_glass: { label: "Break glass", tone: "rose" },
};

export const RESULT_TONE = {
  success: "emerald",
  failed: "rose",
  partial: "amber",
  denied: "slate",
};

const TONE_CLASSES = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
};

export function toneClass(tone) {
  return TONE_CLASSES[tone] || TONE_CLASSES.slate;
}

export function pick(map, key) {
  return map[key] || { label: key || "—", tone: "slate" };
}

// Ações consideradas sensíveis — exigem confirmação manual antes de processar.
const SENSITIVE_KEYWORDS = [
  "delete", "remove", "drop", "purge", "destroy",
  "suspend", "disable", "revoke", "block",
  "rotate", "reset", "force", "elevate", "downgrade", "grant",
  "provision", "decommission", "migrate",
];

export function isSensitiveAction(action) {
  const a = (action || "").toLowerCase();
  return SENSITIVE_KEYWORDS.some((kw) => a.includes(kw));
}

export function fmtDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}