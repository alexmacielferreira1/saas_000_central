# Estado do projeto

Marco atual: **M0 — blocked**.

Verificado em 2026-09-27T12:56:33.622882+00:00.

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
| original_frontend_integrity | passed | 147 original files; 41 approved typed corrections; 0 unapproved changes or missing.  |
| frontend_functional_validation | blocked | Autenticação, sessão, Home, catálogo/detalhe de SaaS, administradores, auditoria, manifests, usuários, configurações, PowerQuery local e Administração de perfis/permissões possuem contratos nativos. A migration 0008 foi aplicada; a API local criou e releu permissões e perfil auditados. As 17 rotas renderizam em teste, as 13 administrativas negam acesso anônimo e 72 testes frontend passam. Paridade continua bloqueada por Operações/Resolução ainda dependentes do Base44, pelo motor persistente de importação e pelas demais subtelas administrativas. |
| git_clean_at_check | pending | Snapshot before writing this report. Verify and commit reviewed work separately. |

M1–M7 continuam pendentes. Os relatórios não comprovam paridade nem uso em produção.
Não ignorar testes nem desligar verificações. Resolver a causa e executar novamente.
