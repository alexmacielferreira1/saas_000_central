# Estado do projeto

## Regra de fundação atualizada — 21/09/2026

A Central é o segundo produto do HUB e deve nascer seguindo o padrão de produção comprovado no MediaMind, sem copiar seu domínio ou sua interface. A referência comum está em `../../_documentacao/standards/19-PRODUCTION-DEPLOY-STANDARD.md` e inclui Render/Neon, sessão, cookies, CORS, SPA, migrations, bootstrap, health/readiness, OAuth e gate de homologação.

Os módulos de criador de SaaS, importações em massa, mídias em lote, formulários, observabilidade, diagnóstico por IA e correções com aprovação/rollback permanecem escopo planejado, não funcionalidade entregue.

## Revalidação local — 22/09/2026

| Verificação | Resultado atual |
|---|---|
| Backend | 22 testes aprovados, 1 integração omitida e 2 avisos deprecatórios |
| Frontend lint | aprovado |
| Frontend typecheck | aprovado |
| Frontend build | aprovado |
| Frontend testes | 3 testes de contrato de rotas aprovados com Vitest/jsdom |
| Cobertura frontend | baseline: 4,05% statements, 0,18% branches, 0,27% functions e 4,42% lines |
| Dependência Base44 | permanece; build avisa ausência de `VITE_BASE44_APP_ID` e `VITE_BASE44_APP_BASE_URL` |
| Bundle | 1.123,79 kB antes de gzip; code splitting entra no backlog de qualidade |
| Dependências frontend | `npm audit fix` compatível aplicado; restam 2 baixas e 2 moderadas que exigem revisão incompatível de Router/Quill |
| Git/cloud | branch local `bootstrap/m0`, sem remote configurado ou publicação confirmada |

O desdobramento de C0 a C7 está em `CENTRAL_IMPLEMENTATION_PLAN.md`. Esta revalidação não muda o marco: M0 continua bloqueado até existir validação funcional e cobertura significativa do frontend.

Marco atual: **M0 — blocked**.

Verificado em 2026-09-19T19:54:41.953179+00:00.

| Verificação | Estado | Evidência |
|---|---|---|
| backend_lint | passed | Exit 0; evidence: .runtime/checks/backend_lint.log |
| backend_format | passed | Exit 0; evidence: .runtime/checks/backend_format.log |
| unit_tests | passed | Exit 0; evidence: .runtime/checks/unit_tests.log |
| migration | passed | Exit 0; evidence: .runtime/checks/migration.log |
| database_integration | passed | Exit 0; evidence: .runtime/checks/database_integration.log |
| dependency_consistency | passed | Exit 0; evidence: .runtime/checks/dependency_consistency.log |
| frontend_build | passed | Exit 0; evidence: .runtime/checks/frontend_build.log |
| frontend_lint | passed | Exit 0; evidence: .runtime/checks/frontend_lint.log |
| frontend_typecheck | passed | Exit 0; evidence: .runtime/checks/frontend_typecheck.log |
| http_smoke | passed | Exit 0; evidence: .runtime/checks/http_smoke.log |
| original_frontend_integrity | passed | 147 original files; 25 approved typed corrections; 0 unapproved changes or missing.  |
| frontend_functional_validation | blocked | Original export requires Base44 configuration; frontend not validated in browser. See docs/BASE44_MIGRATION_MAP.md. HTTP/build alone is insufficient. |
| git_clean_at_check | passed | Snapshot before writing this report. Verify and commit reviewed work separately. |

M1–M7 continuam pendentes. Os relatórios não comprovam paridade nem uso em produção.
Não ignorar testes nem desligar verificações. Resolver a causa e executar novamente.
