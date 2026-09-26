# Backlog da Central

Fonte geral: `../../_documentacao/CODEX_BACKLOG.md`.

Para execução em outro chat, usar `CENTRAL_MASTER_IMPLEMENTATION_CHECKLIST.md` como lista mestra. Ele reúne as tarefas dispersas e aponta para as especificações de origem; este backlog continua sendo a visão curta.

## Agora — C0

1. **Concluído neste bloco:** executar o gate completo, corrigir o teste de integração para a migration `0003_saas_registry` e registrar 39 alterações frontend aprovadas sem desligar a verificação de integridade.
2. **Em andamento:** ampliar a suíte frontend; há 27 testes em 8 arquivos e cobertura baseline de 11,21% de linhas. A meta continua progressiva e não autoriza declarar paridade.
3. **Concluído:** inventário das 15 rotas, jornadas, fontes, persistência, ações e dependências Base44 registrado em `FRONTEND_ROUTE_JOURNEY_INVENTORY.md`.
4. **P0 — próximo item desbloqueado:** registrar screenshots e evidências visuais das telas históricas relevantes.
5. **P0:** cobrir acesso e renderização das rotas críticas e uma jornada local completa.
6. **P0:** manter build, lint, typecheck, backend, migrations, PostgreSQL, smoke e integridade do frontend verdes durante a reconstrução.
7. **P0 segurança:** revisar isoladamente a migração do React Router 6 para 7 e o `react-quill-new`; o `npm audit fix` seguro removeu severidades altas, mas restaram 2 baixas e 2 moderadas que exigem mudança potencialmente incompatível.

## Próximas fases

6. **C1:** herdar configuração por ambiente, auth/sessão, tenant, migrations, health/readiness, testes e documentação do padrão HUB.
7. **C2:** modelar Registry de SaaS, ambientes, capacidades e versões.
8. **C3:** definir contrato Central ↔ SaaS para health, logs, auditoria, comandos autorizados e histórico.
9. **C4:** implementar Import Engine Excel/CSV com preview, mapeamento, validação, idempotência e histórico.
10. **C5:** implementar capacidades opcionais de mídia em lote, formulários e busca.
11. **C6:** implementar Error Center e diagnóstico por IA com aprovação humana e rollback.
12. **C7:** preparar staging/produção apenas com alvos cloud confirmados e gates aprovados.
13. **C8:** lifecycle, Service Registry, entitlements, usage/FinOps, governança de telas/configurações e LGPD.
14. **C9:** backup/restore, exportação, portabilidade, transferência e detachment test.

Detalhamento, critérios de aceite e dependências: `CENTRAL_IMPLEMENTATION_PLAN.md`.
Catálogo completo de telas, módulos e fluxos: `CENTRAL_CAPABILITY_CATALOG.md`.

Nenhum URL GitHub/Render/Neon deve ser inventado; cada alvo precisa ser fornecido ou confirmado.
