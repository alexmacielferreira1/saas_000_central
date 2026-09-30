# Estado do projeto

Marco atual: **M0 — blocked**.

Verificado em 2026-09-29T21:55:00-03:00.

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
| frontend_functional_validation | blocked | A Administração possui estrutura organizacional, acesso efetivo e ciclo de conta inicial: criação, edição de nome/papel, suspensão e reativação contextual, persistida e auditada. São 79 testes backend e 110 frontend aprovados. Formulários, Import Engine persistente, executor remoto, Incidentes/Resolução nativos e o restante do IAM ainda bloqueiam paridade. |
| git_clean_at_check | pending | Snapshot before writing this report. Verify and commit reviewed work separately. |

M1–M7 continuam pendentes. Os relatórios não comprovam paridade nem uso em produção.
Não ignorar testes nem desligar verificações. Resolver a causa e executar novamente.

## Bloco de operação contextual em 27/09/2026

- Governança de telas, Comercial, Uso/custos, IA, Storage, Releases, Segurança, LGPD, Continuidade, Documentação e Feature Flags agora têm campos, indicadores, instruções e área de trabalho próprios.
- `Abrir e resolver aqui` mantém o administrador na página, rola para a bancada inferior e permite editar, versionar e auditar o registro.
- `PATCH /api/v1/control-resources/{id}` aplica isolamento por tenant, exige superadmin, incrementa versão e grava snapshots anterior/posterior.
- O engine de banco separa opções PostgreSQL e SQLite, corrigindo a queda do login no banco local de QA após reinício.
- Jornada real validada: login local, criação do Plano Profissional, reabertura contextual, cobrança anual, salvamento, versão 2 e confirmação auditada. Nenhum Render/Neon foi alterado.

## Bloco Administração e continuidade em 29/09/2026

- `OrganizationUnit` e `UserAccessAssignment` persistem departamentos/setores/equipes/unidades e o vínculo administrativo do usuário.
- A API lista e cria estruturas, salva atribuições e explica o acesso efetivo com perfil, origem, hierarquia e permissões negadas.
- A Administração permite executar essas ações na própria tela. O checklist `CENTRAL_NEXT_SESSIONS_CHECKLIST.md` preserva o escopo transversal de formulários, Excel/PowerQuery, ponte com SaaS, IA operacional e governança.
- Verificação fresca: 79 testes backend, 110 frontend, lint, typecheck e build aprovados. O marco permanece M0 bloqueado e nenhum deploy de produção foi executado.
- O administrador agora edita nome e papel e suspende/reativa contas no mesmo contexto; uma conta suspensa não autentica e a alteração é auditada.
