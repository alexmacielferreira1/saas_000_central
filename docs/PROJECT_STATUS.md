# Estado do projeto

Marco atual: **M0 — blocked**.

Verificado em 2026-09-26T18:14:10.006846+00:00.

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
| original_frontend_integrity | passed | 147 original files; 40 approved typed corrections; 0 unapproved changes or missing.  |
| frontend_functional_validation | blocked | Autenticação, sessão, logout, Home de produtos, catálogo/detalhe/edição principal de SaaS, administradores, auditoria e Capability Manifest possuem integração nativa. A publicação do manifesto é persistida, isolada por tenant, autorizada e auditada; sua jornada foi validada manualmente no detalhe do SaaS e no Guia de APIs. Operações e incidentes ainda aparecem como indisponíveis na Home até seus contratos nativos existirem. As 15 rotas declaradas renderizam em teste e as 11 administrativas negam acesso anônimo. A suíte frontend tem 62 testes em 12 arquivos e 28,79% de cobertura de linhas. Paridade continua bloqueada pelas jornadas Base44 restantes, pelo histórico imutável do manifesto e pela migração das abas Usuários, Configurações e Operações do detalhe. |
| git_clean_at_check | pending | Snapshot before writing this report. Verify and commit reviewed work separately. |

M1–M7 continuam pendentes. Os relatórios não comprovam paridade nem uso em produção.
Não ignorar testes nem desligar verificações. Resolver a causa e executar novamente.
