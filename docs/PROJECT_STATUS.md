# Estado do projeto

Marco atual: **M0 — blocked**.

Verificado em 2026-09-28T01:02:00+00:00.

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
| frontend_functional_validation | blocked | Os centros administrativos deixaram de compartilhar um formulário genérico: cada domínio possui campos, indicadores e orientação próprios, com criação/edição persistente e auditada no mesmo contexto. A jornada Comercial foi validada no navegador, incluindo rolagem contextual e atualização para a versão 2. São 76 testes backend e 109 frontend aprovados. Executor remoto, Incidentes/Resolução nativos, Import Engine persistente e a administração IAM completa ainda bloqueiam paridade. |
| git_clean_at_check | pending | Snapshot before writing this report. Verify and commit reviewed work separately. |

M1–M7 continuam pendentes. Os relatórios não comprovam paridade nem uso em produção.
Não ignorar testes nem desligar verificações. Resolver a causa e executar novamente.

## Bloco de operação contextual em 27/09/2026

- Governança de telas, Comercial, Uso/custos, IA, Storage, Releases, Segurança, LGPD, Continuidade, Documentação e Feature Flags agora têm campos, indicadores, instruções e área de trabalho próprios.
- `Abrir e resolver aqui` mantém o administrador na página, rola para a bancada inferior e permite editar, versionar e auditar o registro.
- `PATCH /api/v1/control-resources/{id}` aplica isolamento por tenant, exige superadmin, incrementa versão e grava snapshots anterior/posterior.
- O engine de banco separa opções PostgreSQL e SQLite, corrigindo a queda do login no banco local de QA após reinício.
- Jornada real validada: login local, criação do Plano Profissional, reabertura contextual, cobrança anual, salvamento, versão 2 e confirmação auditada. Nenhum Render/Neon foi alterado.
