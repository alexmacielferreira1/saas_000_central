# Histórico: sessão de qualidade, segurança e otimização para IAs (2026-10-23)

Registro completo de um chat de trabalho com o Claude Code (sessão na nuvem), para que nada se
perca ao arquivá-lo. Abrange Central e MediaMind; este arquivo descreve a Central. O contexto
geral (avaliação das skills, curadoria, kit) está em
`saas_001_mediamindai/docs/HISTORICO_QUALIDADE_2026-10-23.md`, seções 1, 6 e 7.

## 1. Resumo

1. Avaliação das skills do Matt Pocock; curadoria com fontes oficiais (Trail of Bits, Vercel,
   Supabase, Neon). Prompt único de auditoria e kit do HUB.
2. Auditoria da Central (somente leitura): 20 achados verificados (1 Crítico, 5 Altos, 9 Médios,
   5 Baixos), em `docs/AUDITORIA_QUALIDADE_2026-10-23.md`.
3. Correção do crítico, dos altos e de parte dos médios, com teste antes de cada correção.
4. `CLAUDE.md` (o Claude Code não lê `AGENTS.md` sozinho) e kit do HUB versionado em
   `docs/qualidade/kit-hub/`.

## 2. Commits

Branch `qualidade/kit-revisao-2026-10-23` (publicada no GitHub; PR aberto em https://github.com/alexmacielferreira1/saas_000_central/pull/2, ainda **sem merge**).

| Commit | O quê |
|---|---|
| `8d34052` | Kit: `.claude/skills/`, `.claude/settings.json`, `docs/REVISAO_QUALIDADE.md`, seção no `AGENTS.md`, relatório de auditoria |
| `f2c0b84` | `CLAUDE.md` importando `AGENTS.md` |
| `a3e284b` | **Crítico #1 (+#12)**: probe de integração. `credential_ref` precisa terminar em `_HUB_ADMIN_TOKEN` e não pode ser um segredo central; `base_url` validada na criação e no probe (https fora de local/test, sem IP privado/loopback/metadata após DNS, host ligado à credencial em `INTEGRATION_CREDENTIAL_HOSTS`), sem redirects nem proxy de ambiente; conexão do banco liberada antes da chamada HTTP. Conexões antigas fora da regra falham fechadas (`not_configured`) |
| `535f9b4` | **Alto #2 (+#17)**: dependência única `get_tenant_context` (sessão + tenant selecionado e ativo + membership ativa) em todas as rotas fora de `/auth`; suspender um gestor revoga as sessões dele; sessão sem tenant → 403 `TENANT_NOT_SELECTED` (antes 500) |
| `09a3b86` | **Alto #4**: solicitante não aprova a própria operação (migração `0013_operation_requester`); `approval_status` de configuração definido pelo servidor |
| `41839d3` | **Alto #3**: lista de ações sensíveis única no backend, servida em `GET /operations/policy`; a UI usa fallback idêntico (teste confere a paridade) |
| `c853136` | **Alto #5**: throttling de login por conta + IP (tabela `login_throttles`, migração `0014`), contador atômico, backoff 15/30/60 min até 24 h |
| `21f5617` | **Alto #6**: criação de administrador registrada na auditoria |
| `17d7bb8` | Médio: `/integrations/observations` com `limit` (padrão 100, máx. 500) e cursor `before` |
| `4a404a9` | Médio: `requested_by`/`author` vêm da sessão |
| `632cc35` | Médio: impede rebaixar ou suspender o último superadmin ativo |
| `ea97c69` | Kit do HUB em `docs/qualidade/kit-hub/` |
| `2aefe9e` | Detalhe do SaaS carrega os dados em paralelo |
| `7240989` | Páginas administrativas sob demanda (`React.lazy`) |
| `cf5bcc4` | Seção "Correções aplicadas" no relatório de auditoria |
| (seguinte) | `frontend/package-lock.json` sincronizado: faltavam `chokidar@5.0.0` e `readdirp@5.1.1`, e o `npm ci` (usado no build do Render) falhava com npm 10 |
| (este) | Este histórico |

Os hashes citados dentro do relatório de auditoria (seção de correções) são anteriores a uma
padronização de autoria dos commits; o conteúdo é o mesmo. A tabela acima traz os hashes atuais.

### Verificação
- Backend: 179 testes passando (eram 79). `ruff check backend` limpo; os arquivos tocados estão
  formatados (resta 1 arquivo antigo não formatado, `backend/app/schemas/control.py`, que já estava assim).
- Frontend: 117 testes passando (eram 110); lint, typecheck e build OK.
- Migrações `0013` e `0014`: upgrade, downgrade e upgrade conferidos num PostgreSQL 16 local;
  `alembic check` sem divergência. 40 logins errados simultâneos no PostgreSQL → contador exatamente 40.
- Bundle inicial: 1.199.639 B (347 kB gzip) → 525.748 B (170 kB gzip).
- Não verificado: nada foi executado contra Render, Neon ou serviços reais (DNS e HTTP simulados nos testes).

## 3. Antes de mesclar o PR (o Render faz deploy automático do `main`)

1. **`INTEGRATION_CREDENTIAL_HOSTS`** no serviço `central-saas-backend`, por exemplo
   `{"MEDIAMIND_HUB_ADMIN_TOKEN": ["mediamindai-backend.onrender.com"]}`. Sem ela o sistema sobe
   normalmente, mas em produção criar conexão e rodar o probe retornam `INTEGRATION_TARGET_NOT_ALLOWED`.
2. **`FORWARDED_ALLOW_IPS`** para o uvicorn no Render, para `request.client.host` ser o IP real
   do cliente. Sem isso, todos os logins parecem vir do proxy e o limite por conta + IP vira, na
   prática, limite por conta (com backoff). Conferir antes o formato do `X-Forwarded-For` do Render.
3. As variáveis de credencial devem seguir o padrão `<NOME>_HUB_ADMIN_TOKEN`
   (`MEDIAMIND_HUB_ADMIN_TOKEN` e `SAAS_HUB_ADMIN_TOKEN` continuam válidas).

## 4. Decisões pendentes do Alex

- **Registro de aprovações do Base44**: `OperationCenter.jsx`, `adminHelpers.js` e `SaasDetail.jsx`
  são arquivos originais do Base44 alterados nesta rodada. Os hashes aprovados em
  `docs/history/frontend-approved-changes.json` precisam ser atualizados **por você**: o agente foi
  bloqueado ao tentar, porque mexer no registro do próprio gate é decisão humana. O gate
  `original_frontend_integrity` já falhava antes (`AdminLayout.jsx`, `Integrations.jsx`,
  `UsersAccess.jsx`) e agora lista 6 arquivos.
- **Papel aprovador**: com "solicitante ≠ aprovador", uma organização com um só superadmin não
  consegue aprovar operações sensíveis (pergunta de negócio 3 do relatório).
- **MFA e política final contra força bruta** para o superadmin (pergunta 8).
- Aprovar a proposta de permissões e hooks do Claude Code (`docs/qualidade/kit-hub/proposta-config-claude/`).
- Demais perguntas de negócio do relatório de auditoria.

## 5. Trabalho restante (próximas sessões)

- Achados #7, #9, #10, #14, #15, #16 e #20 (fora do escopo ou dependem de decisão).
- #19 parcial: operações ainda filtradas pelo nome do produto (não existe coluna `saas_product_id`).
- #18 parcial: dependências sem uso no frontend (`three`, `jspdf`, `html2canvas`, `react-leaflet`, `@stripe/*`).
- Campos "Autor", "Status de aprovação" e solicitante ainda aparecem na UI, embora o backend os
  ignore. Removê-los é mudança visual em arquivos do Base44.
- `tests/integration/test_database.py` espera a revisão `0010` e já estava desatualizado antes desta
  rodada (head era `0012`, agora `0014`). Não foi corrigido nem executado.
- Validação de DNS: o IP é checado logo antes da chamada, mas não fica fixado na conexão. A
  ligação credencial → host reduz esse risco.
- Rodar `/security-review` sobre esta branch antes do merge.

## 6. Como retomar num chat novo

Cole no início:

> Leia `CLAUDE.md`, `docs/HISTORICO_QUALIDADE_2026-10-23.md` e
> `docs/AUDITORIA_QUALIDADE_2026-10-23.md`. Continue a partir das seções 3 a 5 do histórico, um
> item por vez, com teste antes de cada correção.
