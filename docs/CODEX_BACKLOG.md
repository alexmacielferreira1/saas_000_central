# Backlog da Central

Fonte geral: `../../_documentacao/CODEX_BACKLOG.md`.

## Agora — C0

1. **Em andamento:** auditar a estrutura atual e definir o gate de reconstrução sem Base44.
2. **Em andamento:** ampliar a suíte de frontend iniciada com 3 testes de rotas; cobertura baseline atual é 4,42% de linhas e a meta progressiva permanece 100%.
3. **P0:** registrar jornadas e evidências visuais do export antes de substituir integrações.
4. **P0:** manter build, lint, typecheck, backend e migrations verdes durante a reconstrução.
5. **P0 segurança:** revisar isoladamente a migração do React Router 6 para 7 e o `react-quill-new`; o `npm audit fix` seguro removeu severidades altas, mas restaram 2 baixas e 2 moderadas que exigem mudança potencialmente incompatível.

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

Nenhum URL GitHub/Render/Neon deve ser inventado; cada alvo precisa ser fornecido ou confirmado.
