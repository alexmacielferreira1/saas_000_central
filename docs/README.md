# Índice da documentação da Central SaaS

Use este índice para localizar rapidamente a fonte correta. Não execute documentos históricos como listas atuais de tarefas.

## Começar aqui

1. [`CENTRAL_MASTER_IMPLEMENTATION_CHECKLIST.md`](CENTRAL_MASTER_IMPLEMENTATION_CHECKLIST.md) — lista mestra para implementar ou continuar em outro chat.
2. [`PROJECT_STATUS.md`](PROJECT_STATUS.md) e [`../project-status.json`](../project-status.json) — estado técnico verificado mais recente.
3. [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md) — contexto curto da última sessão.
4. [`CODEX_BACKLOG.md`](CODEX_BACKLOG.md) — prioridades resumidas.

## Planejamento e escopo

- [`CENTRAL_IMPLEMENTATION_PLAN.md`](CENTRAL_IMPLEMENTATION_PLAN.md) — fases C0–C9, dependências e critérios de aceite.
- [`CENTRAL_CAPABILITY_CATALOG.md`](CENTRAL_CAPABILITY_CATALOG.md) — catálogo completo das telas, módulos e capacidades planejadas.
- [`DECISIONS.md`](DECISIONS.md) — decisões vigentes da Central.
- [`../../_documentacao/ESCOPO_CENTRAL.md`](../../_documentacao/ESCOPO_CENTRAL.md) — requisitos rastreáveis HUB-071–086 e HUB-186–202.
- [`../../_documentacao/SOURCE_INTAKE_2026-09-25_TWO_MASTER_PDFS.md`](../../_documentacao/SOURCE_INTAKE_2026-09-25_TWO_MASTER_PDFS.md) — cobertura e destino das 1.591 páginas dos dois PDFs mestres.

## Arquitetura e desenvolvimento

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — arquitetura atual e limites.
- [`DEVELOPMENT_WORKFLOW.md`](DEVELOPMENT_WORKFLOW.md) — fluxo de trabalho local.
- [`DEPENDENCIES.md`](DEPENDENCIES.md) — dependências e ferramentas.
- [`adr/0001-independent-local-bootstrap.md`](adr/0001-independent-local-bootstrap.md) — decisão do bootstrap independente.

## Migração e frontend histórico

- [`BASE44_MIGRATION_MAP.md`](BASE44_MIGRATION_MAP.md) — inventário e substituição progressiva do Base44.
- [`FRONTEND_BASELINE.md`](FRONTEND_BASELINE.md) — baseline visual/funcional preservado.
- [`history/base44-manifest.json`](history/base44-manifest.json) — manifesto histórico.
- [`history/frontend-approved-changes.json`](history/frontend-approved-changes.json) — alterações aprovadas sobre o frontend original.

## Testes e qualidade

- [`TESTING_STRATEGY.md`](TESTING_STRATEGY.md) — estratégia, gates e evidências.
- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) — último resultado registrado dos gates.

## Planos e especificações concluídas

- [`superpowers/specs/2026-09-23-central-google-auth-design.md`](superpowers/specs/2026-09-23-central-google-auth-design.md) — desenho da autenticação Google.
- [`superpowers/plans/2026-09-23-central-google-auth.md`](superpowers/plans/2026-09-23-central-google-auth.md) — plano de implementação correspondente.
- [`superpowers/specs/2026-09-23-central-local-platform-design.md`](superpowers/specs/2026-09-23-central-local-platform-design.md) — desenho da plataforma local.

## Padrões gerais do HUB aplicáveis

- [`../../_documentacao/HUB_PLATFORM_STANDARD.md`](../../_documentacao/HUB_PLATFORM_STANDARD.md) — constituição técnica do HUB.
- [`../../_documentacao/SHARED_CAPABILITY_REGISTRY.md`](../../_documentacao/SHARED_CAPABILITY_REGISTRY.md) — capacidades obrigatórias, opcionais e específicas.
- [`../../_documentacao/standards/07A-INCIDENT-PROBLEM-RELEASE.md`](../../_documentacao/standards/07A-INCIDENT-PROBLEM-RELEASE.md) — confiabilidade e incidentes.
- [`../../_documentacao/standards/08-UI-APPSHELL-SEARCH.md`](../../_documentacao/standards/08-UI-APPSHELL-SEARCH.md) — AppShell, busca e ações.
- [`../../_documentacao/standards/09-CONFIG-JOBS-STORAGE.md`](../../_documentacao/standards/09-CONFIG-JOBS-STORAGE.md) — configurações, jobs, storage e import/export.
- [`../../_documentacao/standards/10-PRODUCT-LIFECYCLE-PORTABILITY.md`](../../_documentacao/standards/10-PRODUCT-LIFECYCLE-PORTABILITY.md) — lifecycle e portabilidade.
- [`../../_documentacao/standards/11-CENTRAL-CONTROL-PLANE.md`](../../_documentacao/standards/11-CENTRAL-CONTROL-PLANE.md) — papel e limites da Central.
- [`../../_documentacao/standards/12-COST-ENVIRONMENT-GOVERNANCE.md`](../../_documentacao/standards/12-COST-ENVIRONMENT-GOVERNANCE.md) — ambientes, custos e governança.

## Regra de manutenção

- Nova ideia extensa entra primeiro no intake de fontes.
- Requisito aprovado entra no catálogo e recebe ID no backlog/lista mestra.
- Implementação atualiza código, testes, migration, status e handoff juntos.
- Documento antigo divergente é marcado como histórico ou corrigido; não se cria mais uma versão concorrente sem necessidade.
- Toda página nova deve ser ligada neste índice ou em um documento já indexado.
