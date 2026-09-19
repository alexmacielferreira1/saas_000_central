import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// AI assistant for the Resolution Center. Explains a problem or suggests a
// concrete resolution, in Portuguese, using the built-in InvokeLLM integration.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const mode = body?.mode === 'suggest' ? 'suggest' : 'explain';
    const p = body?.problem || {};

    const context = [
      `Tipo: ${p.type}`,
      `Titulo: ${p.title || '—'}`,
      `SaaS: ${p.saas || '—'}`,
      `Severidade: ${p.severity || '—'}`,
      `Status: ${p.status || '—'}`,
      `Resumo: ${p.summary || '—'}`,
    ].join('\n');

    const task = mode === 'suggest'
      ? 'Sugira uma resolução concreta e acionavel em portugues, em ate 5 passos curtos. Comece pela acao principal a tomar agora.'
      : 'Explique em portugues, de forma simples e direta, o que e esse problema, por que costuma acontecer e o impacto. Maximo de 4 frases.';

    const prompt = `Voce e um assistente de administracao de um ecossistema SaaS (Central SaaS Hub). ${task}\n\nContexto do problema:\n${context}\n\nGuia interno de referencia: ${p.guide || ''}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    return Response.json({ text: typeof result === 'string' ? result : JSON.stringify(result), mode });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}