import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// One-click AI resolution. Reads the problem's real context from the ecosystem
// (entity + related SaaS/manifest/audit), decides the best action via InvokeLLM,
// and APPLIES it server-side (resolve incident / approve-reject config & command /
// open incident for degraded SaaS). Sensitive operations are held for human review.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const type = body?.type;
    const entityId = body?.entityId;
    if (!type || !entityId) return Response.json({ error: 'type e entityId obrigatórios' }, { status: 400 });

    const SR = base44.asServiceRole;
    const safeList = async (name, ...args) => {
      try { return (await SR.entities[name].list(...args)) || []; } catch { return []; }
    };

    let promptContext = '';
    let applyDecision;

    if (type === 'incident') {
      const inc = await SR.entities.Incident.get(entityId);
      if (!inc) return Response.json({ error: 'Incidente não encontrado' }, { status: 404 });
      const saasList = await safeList('Saas', '-updated_date', 30);
      const saas = saasList.find((s) => s.name === inc.saas) || null;
      const audits = await safeList('Audit', '-created_date', 20);
      const relAudits = audits.filter((a) => (a.saas || '') === (inc.saas || '')).slice(0, 5);
      promptContext = [
        `INCIDENTE: ${inc.title}`,
        `SaaS: ${inc.saas} · Severidade: ${inc.severity} · Status: ${inc.status}`,
        `Descrição: ${inc.description || '—'}`,
        saas ? `SaaS health: ${saas.health} · status: ${saas.status} · handshake: ${saas.last_handshake || '—'}` : '',
        `Auditorias recentes do SaaS: ${relAudits.map((a) => `${a.action}(${a.result})`).join(', ') || 'nenhuma'}`,
      ].filter(Boolean).join('\n');
      applyDecision = async (d) => {
        if (d.decision === 'resolve') {
          await SR.entities.Incident.update(entityId, {
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolution: d.resolution,
          });
          await SR.entities.Audit.create({
            actor: user.email || 'ai', saas: inc.saas || 'central', action: 'incident.resolve',
            entity: 'Incident', entity_id: entityId,
            before: JSON.stringify({ status: inc.status }),
            after: JSON.stringify({ status: 'resolved', resolution: d.resolution }),
            reason: d.resolution, result: 'success', origin: 'automation',
          });
          return { applied: 'resolved' };
        }
        return { applied: 'none', note: 'A IA recomenda revisão humana.' };
      };
    } else if (type === 'config') {
      const cfg = await SR.entities.Configuration.get(entityId);
      if (!cfg) return Response.json({ error: 'Configuração não encontrada' }, { status: 404 });
      promptContext = [
        `CONFIGURAÇÃO: ${cfg.key}`,
        `SaaS: ${cfg.saas_id} · Ambiente: ${cfg.environment} · Tipo: ${cfg.type}`,
        `Valor: ${cfg.value || '—'} · anterior: ${cfg.previous_value || '—'}`,
        `Autor: ${cfg.author || '—'} · Motivo: ${cfg.reason || '—'} · Aprovação atual: ${cfg.approval_status}`,
      ].join('\n');
      applyDecision = async (d) => {
        if (d.decision === 'approve') {
          await SR.entities.Configuration.update(entityId, { approval_status: 'approved', enabled: true });
          await SR.entities.Audit.create({
            actor: user.email || 'ai', saas: cfg.saas_id || 'central', action: 'config.approve',
            entity: 'Configuration', entity_id: entityId,
            before: JSON.stringify({ approval_status: 'pending' }),
            after: JSON.stringify({ approval_status: 'approved' }),
            reason: d.resolution, result: 'success', origin: 'automation',
          });
          return { applied: 'approved' };
        }
        if (d.decision === 'reject') {
          await SR.entities.Configuration.update(entityId, { approval_status: 'rejected' });
          await SR.entities.Audit.create({
            actor: user.email || 'ai', saas: cfg.saas_id || 'central', action: 'config.reject',
            entity: 'Configuration', entity_id: entityId,
            before: JSON.stringify({ approval_status: 'pending' }),
            after: JSON.stringify({ approval_status: 'rejected' }),
            reason: d.resolution, result: 'success', origin: 'automation',
          });
          return { applied: 'rejected' };
        }
        return { applied: 'none', note: 'A IA recomenda revisão humana.' };
      };
    } else if (type === 'command') {
      const cmd = await SR.entities.AdminCommand.get(entityId);
      if (!cmd) return Response.json({ error: 'Operação não encontrada' }, { status: 404 });
      const sensitive = ['delete', 'remove', 'drop', 'purge', 'destroy', 'suspend', 'disable', 'revoke', 'block', 'rotate', 'reset', 'force', 'elevate', 'downgrade', 'grant', 'provision', 'decommission', 'migrate']
        .some((kw) => (cmd.action || '').toLowerCase().includes(kw));
      promptContext = [
        `OPERAÇÃO: ${cmd.action} · recurso: ${cmd.resource || '—'}`,
        `SaaS: ${cmd.saas} · tenant: ${cmd.tenant || '—'} · Solicitante: ${cmd.requested_by || '—'}`,
        `Permissão: ${cmd.permission || '—'} · Patch: ${cmd.patch || '—'}`,
        `Status: ${cmd.status} · Resultado: ${cmd.result || '—'} · Sensível: ${sensitive ? 'sim' : 'não'}`,
      ].join('\n');
      applyDecision = async (d) => {
        if (sensitive) return { applied: 'needs_human', note: 'Operação sensível exige confirmação humana.' };
        if (d.decision === 'approve') {
          await SR.entities.AdminCommand.update(entityId, { status: 'queued' });
          await SR.entities.Audit.create({
            actor: user.email || 'ai', saas: cmd.saas, tenant: cmd.tenant, action: 'operation.approve',
            entity: 'AdminCommand', entity_id: entityId,
            before: JSON.stringify({ status: cmd.status }), after: JSON.stringify({ status: 'queued' }),
            reason: d.resolution, result: 'success', origin: 'automation',
          });
          return { applied: 'approved' };
        }
        if (d.decision === 'reject') {
          await SR.entities.AdminCommand.update(entityId, { status: 'cancelled' });
          await SR.entities.Audit.create({
            actor: user.email || 'ai', saas: cmd.saas, tenant: cmd.tenant, action: 'operation.reject',
            entity: 'AdminCommand', entity_id: entityId,
            before: JSON.stringify({ status: cmd.status }), after: JSON.stringify({ status: 'cancelled' }),
            reason: d.resolution, result: 'success', origin: 'automation',
          });
          return { applied: 'rejected' };
        }
        return { applied: 'none', note: 'A IA recomanda revisão humana.' };
      };
    } else if (type === 'saas') {
      const s = await SR.entities.Saas.get(entityId);
      if (!s) return Response.json({ error: 'SaaS não encontrado' }, { status: 404 });
      const manifests = await safeList('CapabilityManifest', '-updated_date', 30);
      const mf = manifests.find((m) => m.saas_id === s.name || m.saas_id === s.id);
      promptContext = [
        `SaaS: ${s.name} (${s.slug}) · Status: ${s.status} · Health: ${s.health}`,
        `Compatibilidade: ${s.compatibility} · Nível: ${s.integration_level}`,
        `Handshake: ${s.last_handshake || '—'} · Base URL: ${s.base_url || '—'}`,
        `Capabilities: ${s.capabilities_summary || '—'}`,
        mf ? `Manifesto: ${mf.capabilities || '—'}` : '',
      ].filter(Boolean).join('\n');
      applyDecision = async (d) => {
        if (d.decision === 'open_incident') {
          const sev = s.health === 'down' ? 'critical' : s.status === 'auth_failed' ? 'high' : s.health === 'degraded' ? 'medium' : 'low';
          const created = await SR.entities.Incident.create({
            saas: s.name,
            title: `${s.name} — ${(d.resolution || '').slice(0, 60) || s.health || s.status}`,
            severity: sev, status: 'open', opened_at: new Date().toISOString(),
            description: d.resolution,
          });
          await SR.entities.Audit.create({
            actor: user.email || 'ai', saas: s.name, action: 'incident.create',
            entity: 'Incident', entity_id: created.id,
            reason: `Aberto por IA a partir de SaaS ${s.name} degradado`, result: 'success', origin: 'automation',
          });
          return { applied: 'opened_incident', incidentId: created.id };
        }
        return { applied: 'none', note: 'A IA recomenda investigação manual.' };
      };
    } else {
      return Response.json({ error: 'Tipo não suportado' }, { status: 400 });
    }

    const schema = {
      type: 'object',
      properties: {
        decision: { type: 'string', enum: ['resolve', 'approve', 'reject', 'open_incident', 'needs_human'] },
        resolution: { type: 'string' },
        summary: { type: 'string' },
      },
      required: ['decision', 'resolution', 'summary'],
    };
    const prompt = `Você é um administrador automatizado do ecossistema SaaS (Central SaaS Hub). Analise o contexto abaixo, leia os dados, decida a melhor ação e escreva a resolução em português. Se não houver certeza razoável, retorne decision "needs_human".\n\nCONTEXTO:\n${promptContext}`;
    const ai = await SR.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    const d = ai || {};
    const outcome = await applyDecision(d);
    return Response.json({ decision: d.decision, resolution: d.resolution, summary: d.summary, ...outcome });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}