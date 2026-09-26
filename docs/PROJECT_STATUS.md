# Estado do projeto

Marco atual: **M0 — failed**.

Verificado em 2026-09-26T15:42:21.639424+00:00.

| Verificação | Estado | Evidência |
|---|---|---|
| backend_lint | passed | Exit 0; evidence: .runtime/checks/backend_lint.log |
| backend_format | passed | Exit 0; evidence: .runtime/checks/backend_format.log |
| unit_tests | passed | Exit 0; evidence: .runtime/checks/unit_tests.log |
| migration | failed | Exit 1; evidence: .runtime/checks/migration.log |
| database_integration | failed | Exit 1; evidence: .runtime/checks/database_integration.log |
| dependency_consistency | passed | Exit 0; evidence: .runtime/checks/dependency_consistency.log |
| frontend_build | passed | Exit 0; evidence: .runtime/checks/frontend_build.log |
| frontend_lint | passed | Exit 0; evidence: .runtime/checks/frontend_lint.log |
| frontend_typecheck | passed | Exit 0; evidence: .runtime/checks/frontend_typecheck.log |
| http_smoke | failed | Exit 1; evidence: .runtime/checks/http_smoke.log |
| original_frontend_integrity | passed | 147 original files; 39 approved typed corrections; 0 unapproved changes or missing.  |
| frontend_functional_validation | blocked | Autenticação, sessão, logout, catálogo/detalhe/edição principal de SaaS e administradores possuem integração nativa. As 15 rotas declaradas renderizam em teste e as 11 administrativas negam acesso anônimo. A suíte frontend tem 55 testes em 10 arquivos e 28,49% de cobertura de linhas. Paridade continua bloqueada pelas jornadas Base44, evidências visuais e migração das abas do detalhe. |
| git_clean_at_check | pending | Snapshot before writing this report. Verify and commit reviewed work separately. |

M1–M7 continuam pendentes. Os relatórios não comprovam paridade nem uso em produção.
Não ignorar testes nem desligar verificações. Resolver a causa e executar novamente.
