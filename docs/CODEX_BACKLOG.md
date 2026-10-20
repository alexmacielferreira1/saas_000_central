# Backlog da Central

> Cobertura integral dos dois PDFs mestres e regra de execução: `PDF_EXECUTION_SCOPE_2026-09-29.md`. O documento amplia rastreabilidade, mas não antecipa gates do marco vigente.

Fonte geral: `../../_documentacao/CODEX_BACKLOG.md`.

Para execução em outro chat, usar `CENTRAL_MASTER_IMPLEMENTATION_CHECKLIST.md` como lista mestra. Ele reúne as tarefas dispersas e aponta para as especificações de origem; este backlog continua sendo a visão curta. Os requisitos recuperados dos anexos do Codex e sua ligação com as fases estão em `CODEX_ATTACHMENTS_REQUIREMENTS.md`; a proveniência completa por SHA-256 está no manifesto do HUB.

## Agora — C0

0. **Em andamento — Administração:** `/administration` possui catálogo de SaaS, administradores, usuários de produto, perfis e permissões nativos. Próximas fatias: atribuição de perfil e acesso efetivo; depois pessoas, funções, equipes, setores, unidades e sessões.
0. **Em andamento — Operações:** criação, listagem, aprovação e rejeição são nativas. A primeira execução remota somente leitura (`system.describe` e `media.count`, sempre dry-run) persiste ID/resultado, reaproveita idempotência do MediaMind, reconcilia replay e registra timeout como falha. Falta mover o despacho para worker durável, progresso, retries programados, cancelamento e rollback.
0. **Em andamento — Integração Central ↔ SaaS:** conexão, ambiente e observações de saúde têm persistência e API nativas. O conector agora descobre endpoints no manifesto do MediaMind, envia identidade de serviço completa e foi provado contra a aplicação real, incluindo 401/403, readiness 503 e replay idempotente. Próximo: automatizar essa prova na CI, restringir hosts/escopos por credencial e criar reconciliador durável.
0. **Entregue nesta sessão — expansão do Control Plane:** Integrações usa dados nativos e probe persistente; MediaMindConnector consulta health/manifest; 15 novos centros/rotas operacionais estão navegáveis. `control_resources` permite criar registros reais por tenant com permissão e auditoria. Próximo: executor remoto idempotente e migração nativa de Incidentes/Resolução.
0. **Em andamento — QA como usuário:** validar cada ação no navegador, inclusive painéis contextuais, persistência, estados de erro/vazio/permissão e, no MediaMind, arrasto, agulha da timeline e ordem integral da esteira de produção.
0. **Entregue nesta sessão — centros específicos e trabalho no contexto:** onze centros deixaram de repetir o mesmo formulário; criação e edição agora ocorrem na própria página, persistem, versionam e auditam. Próximo: Administração IAM completa (pessoas, vínculos, função, equipe, setor, unidade, escopo, exceções, sessões/MFA) e especialização relacional do Screen Registry/Comercial.
0. **Novo requisito incorporado — controle do MediaMind:** Tenant 360, usuários/equipes/perfis, matriz de telas/ações, AI Provider Manager, importação/exportação, arquivos, observabilidade, incidentes, playbooks, aprovações, assinatura e Copiloto precisam usar a ponte Central↔SaaS e autoridade final no backend. Executar em fatias verticais; não criar botões sem endpoint/persistência.
0. **Entregue — primeira fundação organizacional e de contas:** departamentos/setores/equipes/unidades, atribuição de perfil/função/escopo, explicação do acesso efetivo e edição/suspensão/reativação de administrador possuem API, persistência, autorização, auditoria, tela contextual e testes. Faltam convite, exclusão lógica, senha, validade, sessões/MFA, exceções temporárias, revisão de acesso e visões 360°.
0. **Novo escopo preservado:** Form Builder semelhante ao Google Forms e Import/Export persistente estilo PowerQuery entram logo após IAM. O detalhamento e a ordem consolidada estão em `CENTRAL_NEXT_SESSIONS_CHECKLIST.md`.

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

### Requisitos recuperados da auditoria de chats — 29/09/2026

- **CTL-NATIVE-001 — P0, in_progress:** fechar uma fatia vertical nativa por vez — UI, API, banco, autorização, auditoria e teste — até eliminar o uso operacional de Base44. Priorizar Incidentes/Resolução depois da fatia corrente.
- **CTL-LINK-001 — P0, in_progress:** completar manifest/health com autenticação de serviço, escopo por tenant/produto, compatibilidade de versão, dispatch idempotente, timeout, reconciliação e auditoria nos dois lados.
- **CTL-PERM-001 — P1, in_progress:** completar permissão efetiva RBAC+ABAC e preparar defesa RLS, incluindo exceções individuais/temporárias e explicação da origem da decisão.
- **CTL-IMPERSONATE-001 — P1, pending:** simular usuário/perfil/empresa sem assumir credenciais, em modo não destrutivo, escopado e auditado, usando a mesma engine de autorização do backend.
- **CTL-SCREEN-001 — P1, in_progress:** especializar o Screen Registry até tela/seção/widget/card/aba/ação e ligá-lo à autorização/navegação reais.
- **CTL-OPS-001 — P1, in_progress:** mover execução para backend durável com dry-run, válidos/inválidos/sem permissão/conflitantes, idempotência, retry, cancelamento seguro, progresso e auditoria.
- **CTL-ERROR-001 — P1, pending:** implementar fluxo nativo ErrorEvent → Incident → Problem → causa/known error → correção → validação → regressão; telas ou entidades Base44 não contam como conclusão.
- **CTL-HEALTH-001 — P1, in_progress:** persistir probes autenticados de health/readiness/version/capabilities/latência e histórico, com timeout e classificação de evidência.
- **CTL-COST-001 — P1, pending:** receber consumo do MediaMind e conciliar estimativa, reserva, uso real, franquia, excedente, BYO, cache/reuso e bloqueio de cobrança duplicada.
- **HUB-STATUS-001 — P0, pending:** após o próximo gate completo, sincronizar `PROJECT_STATUS.md`, `project-status.json`, backlog e handoff na mesma execução.
- **HUB-AUDIT-001 — P0, in_progress:** toda mutação sensível deve gerar auditoria autoritativa no servidor; eventos do frontend permanecem apenas telemetria complementar.

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
