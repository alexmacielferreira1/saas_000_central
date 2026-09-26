# Backlog da Central

Fonte geral: `../../_documentacao/CODEX_BACKLOG.md`.

Para execução em outro chat, usar `CENTRAL_MASTER_IMPLEMENTATION_CHECKLIST.md` como lista mestra. Ele reúne as tarefas dispersas e aponta para as especificações de origem; este backlog continua sendo a visão curta.

## Agora — C0

1. **Concluído neste bloco:** executar o gate completo, corrigir o teste de integração para a migration `0003_saas_registry` e registrar 39 alterações frontend aprovadas sem desligar a verificação de integridade.
2. **Em andamento:** ampliar a suíte frontend; há 57 testes em 11 arquivos e cobertura de 27,70% de linhas. A Home isolada possui 81,48% de linhas cobertas; as 15 rotas declaradas renderizam em teste e as 11 administrativas negam acesso anônimo. A meta continua progressiva e não autoriza declarar paridade.
3. **Concluído:** inventário das 15 rotas, jornadas, fontes, persistência, ações e dependências Base44 registrado em `FRONTEND_ROUTE_JOURNEY_INVENTORY.md`.
4. **P0 — próximo item desbloqueado:** registrar screenshots e evidências visuais das telas históricas relevantes.
5. **Concluído neste bloco:** cobrir acesso e renderização das 15 rotas declaradas; as 11 rotas administrativas também validam redirecionamento anônimo.
6. **Em andamento — SCR-002/SCR-003:** cadastro, listagem, detalhe e edição dos dados principais do SaaS usam API e persistência nativas; faltam auditoria persistente, evidência manual e migração das abas do detalhe.
7. **Concluído neste bloco — SCR-001 parcial:** Home usa resumo nativo e isolado por tenant para KPIs do catálogo; membership inativa é negada e operações/incidentes ainda não migrados aparecem como indisponíveis, sem falsos zeros.
8. **P0:** manter build, lint, typecheck, backend, migrations, PostgreSQL, smoke e integridade do frontend verdes durante a reconstrução.
9. **P0 segurança:** revisar isoladamente a migração do React Router 6 para 7 e o `react-quill-new`; o `npm audit fix` seguro removeu severidades altas, mas restaram 2 baixas e 2 moderadas que exigem mudança potencialmente incompatível.

## Próximas fases

7. **C1:** herdar configuração por ambiente, auth/sessão, tenant, migrations, health/readiness, testes e documentação do padrão HUB.
8. **C2:** modelar Registry de SaaS, ambientes, capacidades e versões.
9. **C3:** definir contrato Central ↔ SaaS para health, logs, auditoria, comandos autorizados e histórico.
10. **C4:** implementar Import Engine Excel/CSV com preview, mapeamento, validação, idempotência e histórico.
11. **C5:** implementar capacidades opcionais de mídia em lote, formulários e busca.
12. **C6:** implementar Error Center e diagnóstico por IA com aprovação humana e rollback.
13. **C7:** preparar staging/produção apenas com alvos cloud confirmados e gates aprovados.
14. **C8:** lifecycle, Service Registry, entitlements, usage/FinOps, governança de telas/configurações e LGPD.
15. **C9:** backup/restore, exportação, portabilidade, transferência e detachment test.

Detalhamento, critérios de aceite e dependências: `CENTRAL_IMPLEMENTATION_PLAN.md`.
Catálogo completo de telas, módulos e fluxos: `CENTRAL_CAPABILITY_CATALOG.md`.

Nenhum URL GitHub/Render/Neon deve ser inventado; cada alvo precisa ser fornecido ou confirmado.
