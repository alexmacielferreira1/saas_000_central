# Backlog da Central

Fonte geral: `../../_documentacao/CODEX_BACKLOG.md`.

Para execução em outro chat, usar `CENTRAL_MASTER_IMPLEMENTATION_CHECKLIST.md` como lista mestra. Ele reúne as tarefas dispersas e aponta para as especificações de origem; este backlog continua sendo a visão curta.

## Agora — C0

0. **Em andamento — Administração:** `/administration` possui catálogo de SaaS, administradores, usuários de produto, perfis e permissões nativos. Próximas fatias: atribuição de perfil e acesso efetivo; depois pessoas, funções, equipes, setores, unidades e sessões.
0. **Em andamento — Operações:** criação, listagem, aprovação e rejeição agora são nativas e persistidas. Falta o executor assíncrono Central ↔ SaaS, idempotência, progresso, retries e rollback.
0. **Em andamento — Integração Central ↔ SaaS:** conexão, ambiente e observações de saúde têm persistência e API nativas, segredo por referência, isolamento por organização e classificação de evidência recente/desatualizada. Próximo: aplicar migration 0010 no PostgreSQL local, sondar o manifesto/health do MediaMind e ligar despacho/reconciliação às Operações.
0. **Entregue nesta sessão — expansão do Control Plane:** Integrações usa dados nativos e probe persistente; MediaMindConnector consulta health/manifest; 15 novos centros/rotas operacionais estão navegáveis. `control_resources` permite criar registros reais por tenant com permissão e auditoria. Próximo: executor remoto idempotente e migração nativa de Incidentes/Resolução.
0. **Em andamento — QA como usuário:** validar cada ação no navegador, inclusive painéis contextuais, persistência, estados de erro/vazio/permissão e, no MediaMind, arrasto, agulha da timeline e ordem integral da esteira de produção.

1. **Concluído neste bloco:** executar o gate completo, corrigir o teste de integração para a migration `0003_saas_registry` e registrar 39 alterações frontend aprovadas sem desligar a verificação de integridade.
2. **Em andamento:** ampliar a suíte frontend; há 106 testes em 14 arquivos. Todas as rotas declaradas renderizam e as rotas administrativas negam acesso anônimo. A meta continua progressiva e não autoriza declarar paridade.
3. **Concluído:** inventário das 15 rotas, jornadas, fontes, persistência, ações e dependências Base44 registrado em `FRONTEND_ROUTE_JOURNEY_INVENTORY.md`.
4. **P0 — próximo item desbloqueado:** migrar `Operações` para contrato nativo e restaurar PostgreSQL/API locais para aplicar e validar as migrations `0006_product_users` e `0007_configurations`.
5. **Concluído neste bloco:** cobrir acesso e renderização das 15 rotas declaradas; as 11 rotas administrativas também validam redirecionamento anônimo.
6. **Em andamento — SCR-002/SCR-003/SCR-011/SCR-034/SCR-040:** cadastro, listagem, detalhe, edição principal, Capability Manifest, projeções de usuários e Configurações usam API nativa; mutações geram auditoria persistente. Configurações possuem criação/listagem, escopo Central ou SaaS, ambiente, unicidade e autorização. Faltam aplicar migrations no PostgreSQL local, edição/histórico de configurações, sincronização assinada e a aba `Operações`.
7. **Concluído neste bloco — SCR-001 parcial:** Home usa resumo nativo e isolado por tenant para KPIs do catálogo; membership inativa é negada e operações/incidentes ainda não migrados aparecem como indisponíveis, sem falsos zeros.
8. **P0:** manter build, lint, typecheck, backend, migrations, PostgreSQL, smoke e integridade do frontend verdes durante a reconstrução.
9. **P0 segurança:** revisar isoladamente a migração do React Router 6 para 7 e o `react-quill-new`; o `npm audit fix` seguro removeu severidades altas, mas restaram 2 baixas e 2 moderadas que exigem mudança potencialmente incompatível.
10. **Em andamento — SCR-007/C1.4:** a tela de Auditoria lê `AuditLog` nativo por tenant e nega viewers; ainda faltam filtros avançados, detalhe, exportação controlada, retenção e auditoria dos demais domínios.

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
