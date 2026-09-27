# Estado do projeto

Marco atual: **M0 — blocked**.

Verificado em 2026-09-27T13:12:48.061952+00:00.

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
| original_frontend_integrity | passed | 147 original files; 42 approved typed corrections; 0 unapproved changes or missing.  |
| frontend_functional_validation | blocked | Autenticação, sessão, Home, catálogo/detalhe de SaaS, administradores, auditoria, manifests, usuários, configurações, PowerQuery local, perfis/permissões e Operações possuem contratos nativos. Conexões Central ↔ SaaS, ambientes e observações de saúde agora têm modelos e API nativos, com segredo referenciado e isolamento por organização. São 68 testes backend e 72 frontend aprovados. A migration 0010 ainda precisa ser aplicada no PostgreSQL local; execução remota dos comandos, QA integral no navegador, Resolução por logs, motor persistente de importação e subtelas administrativas continuam bloqueando a paridade. |
| git_clean_at_check | pending | Snapshot before writing this report. Verify and commit reviewed work separately. |

M1–M7 continuam pendentes. Os relatórios não comprovam paridade nem uso em produção.
Não ignorar testes nem desligar verificações. Resolver a causa e executar novamente.
