// Aggregates signals from across the ecosystem into a unified "problem" list
// for the Resolution Center. Each problem carries a how-to-resolve guide and
// enough context for in-place resolution actions.

import { INCIDENT_STATUS, OP_STATUS, SAAS_STATUS, HEALTH } from "@/lib/adminHelpers";

export const PROBLEM_TYPE = {
  incident: { label: "Incidente", tone: "rose" },
  command: { label: "Operação", tone: "amber" },
  saas: { label: "SaaS", tone: "sky" },
  config: { label: "Configuração", tone: "violet" },
};

export const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1 };
export const SEVERITY_LABEL = {
  critical: "Crítica",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const labelOf = (map, key) => (map[key] || { label: key || "—" }).label;

export function buildProblems({ incidents = [], commands = [], saas = [], configs = [] }) {
  const problems = [];

  incidents.forEach((i) => {
    if (i.status === "resolved") return;
    problems.push({
      id: `incident:${i.id}`,
      type: "incident",
      entityId: i.id,
      title: i.title || "Incidente sem título",
      saas: i.saas || "central",
      severity: i.severity || "medium",
      statusKey: i.status,
      statusLabel: labelOf(INCIDENT_STATUS, i.status),
      createdAt: i.opened_at || i.created_date,
      summary: i.description || "Incidente aberto no ecossistema.",
      guide:
        "Verifique a causa no SaaS afetado (health, handshake, logs). Confirmada a solução, registre a resolução — a tarefa vinculada no Linear é fechada automaticamente. Incidentes críticos: comunique stakeholders antes de fechar.",
      raw: i,
    });
  });

  commands.forEach((o) => {
    if (!["failed", "partial_success", "awaiting_confirmation", "draft"].includes(o.status)) return;
    const pending = o.status === "awaiting_confirmation" || o.status === "draft";
    const severity = o.status === "failed" ? "high" : "medium";
    const guide = pending
      ? "Operação aguardando confirmação. Valide solicitante, permissão usada, SaaS/tenant alvo e o patch before/after. Aprovar envia para a fila; Rejeitar cancela. Ações sensíveis exigem atenção extra."
      : "Analise o campo 'resultado' e o patch. Se for falha transitória, recrie a operação no Operation Center. Cancele se obsoleta. Reverta se houve efeito colateral.";
    problems.push({
      id: `command:${o.id}`,
      type: "command",
      entityId: o.id,
      title: `${o.action || "Operação"}${o.resource ? " · " + o.resource : ""}`,
      saas: o.saas || "central",
      severity,
      statusKey: o.status,
      statusLabel: labelOf(OP_STATUS, o.status),
      createdAt: o.created_date,
      summary: o.result ? `Resultado: ${o.result}` : `Solicitante: ${o.requested_by || "—"}`,
      guide,
      raw: o,
    });
  });

  saas.forEach((s) => {
    const badHealth = ["degraded", "down"].includes(s.health);
    const badStatus = ["auth_failed", "unavailable", "incompatible", "limited"].includes(s.status);
    if (!badHealth && !badStatus) return;
    let severity = "low";
    if (s.health === "down") severity = "critical";
    else if (s.status === "auth_failed") severity = "high";
    else if (s.health === "degraded") severity = "medium";
    let guide;
    if (s.status === "auth_failed")
      guide = "Autenticação com o SaaS falhou. Faça handshake/rotate da API key (secret SAAS_<SLUG>_API_KEY) e revalide. Abra um incidente se persistir.";
    else if (s.health === "down")
      guide = "SaaS sem resposta. Verifique base_url, health endpoints e last_handshake. Abra um incidente crítico e acesse os detalhes para diagnóstico.";
    else if (s.health === "degraded")
      guide = "SaaS degradado. Verifique last_handshake e health endpoints no detalhe. Abra um incidente se a degradação persistir.";
    else
      guide = "SaaS não conectado/integrado. Exponha o admin-manifest e os endpoints de admin; faça handshake para subir o nível de integração.";
    const statusLabel =
      s.health && s.health !== "unknown" ? labelOf(HEALTH, s.health) : labelOf(SAAS_STATUS, s.status);
    problems.push({
      id: `saas:${s.id}`,
      type: "saas",
      entityId: s.id,
      title: s.name,
      saas: s.name,
      severity,
      statusKey: (s.health && s.health !== "unknown" && s.health) || s.status,
      statusLabel,
      createdAt: s.last_handshake || s.updated_date,
      summary: s.capabilities_summary || s.description || "Integração com problema.",
      guide,
      raw: s,
    });
  });

  configs.forEach((c) => {
    if (c.approval_status !== "pending") return;
    problems.push({
      id: `config:${c.id}`,
      type: "config",
      entityId: c.id,
      title: c.key,
      saas: c.saas_id || "central",
      severity: "medium",
      statusKey: c.approval_status,
      statusLabel: "Aguardando aprovação",
      createdAt: c.created_date,
      summary: `Valor: ${c.value || "—"} · ${c.environment} · ${c.type}`,
      guide:
        "Revise chave, valor, ambiente, autor e motivo. Aprovar ativa a configuração; Rejeitar cancela. A validade (valid_from/until) deve cobrir o uso pretendido.",
      raw: c,
    });
  });

  problems.sort(
    (a, b) =>
      (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0) ||
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  return problems;
}