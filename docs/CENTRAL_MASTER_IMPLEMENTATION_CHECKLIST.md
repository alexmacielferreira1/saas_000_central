# Lista mestra de implementação da Central SaaS

## Como usar este documento no outro chat

Este é o ponto de entrada operacional para continuar a implementação da `000_central`. Ele reúne as tarefas que estavam distribuídas em vários Markdown e indica onde encontrar a especificação completa. Não substitua os documentos referenciados e não trate uma caixa marcada como prova suficiente: toda conclusão exige código, persistência, autorização, testes e evidência.

Ao iniciar uma sessão:

1. leia `AGENTS.md` e respeite a ordem de autoridade;
2. leia `docs/PROJECT_STATUS.md` e `project-status.json` para obter o estado real mais recente;
3. leia este documento e escolha o primeiro item desbloqueado da fase atual;
4. consulte o documento fonte indicado no item;
5. implemente uma fatia vertical pequena, testável e reversível;
6. atualize testes, migrations, `PROJECT_STATUS`, `project-status.json`, backlog e handoff;
7. faça commit apenas dos arquivos relacionados e não publique em produção sem autorização explícita.

## Resultado esperado da Central

A Central será o plano de controle administrativo dos SaaS. Ela deverá conseguir cadastrar, conhecer, consultar, monitorar e administrar produtos conectados por APIs e eventos versionados. Cada SaaS continua independente, com repositório, banco, storage, regras de negócio e deploy próprios.

```text
Central SaaS (control plane)
  ├─ identidade e acesso administrativo
  ├─ catálogo de produtos, serviços, ambientes e capacidades
  ├─ usuários, tenants, planos, configurações e governança
  ├─ operações, saúde, incidentes, auditoria e custos
  ├─ importação/exportação e automações autorizadas
  └─ contratos seguros com cada SaaS

SaaS conectado (data plane)
  ├─ continua sendo source of truth do próprio domínio
  ├─ aplica autorização e regras localmente
  ├─ expõe somente capacidades declaradas
  └─ continua funcionando quando a Central estiver indisponível
```

## Fontes obrigatórias

| Documento | Uso |
|---|---|
| `docs/PROJECT_STATUS.md` e `project-status.json` | estado verificado e gates atuais |
| `docs/CENTRAL_IMPLEMENTATION_PLAN.md` | fases C0–C9, dependências e aceite |
| `docs/CENTRAL_CAPABILITY_CATALOG.md` | catálogo completo de 23 áreas funcionais |
| `docs/CENTRAL_SCREEN_IMPLEMENTATION_MATRIX.md` | inventário explícito de mais de 100 telas/subtelas, rotas, tratamento e ordem de implementação |
| `docs/CODEX_BACKLOG.md` | fila curta do produto |
| `docs/DECISIONS.md` | decisões que não devem ser rediscutidas sem evidência nova |
| `docs/ARCHITECTURE.md` | arquitetura implementada e limites do produto |
| `docs/BASE44_MIGRATION_MAP.md` | substituição progressiva do runtime histórico |
| `docs/FRONTEND_BASELINE.md` | rotas, telas e contrato visual preservado |
| `docs/TESTING_STRATEGY.md` | gates e tipos de teste |
| `../../_documentacao/SOURCE_INTAKE_2026-09-25_TWO_MASTER_PDFS.md` | mapa das 1.591 páginas dos PDFs mestres |
| `../../_documentacao/ESCOPO_CENTRAL.md` | requisitos HUB-071–086 e HUB-186–202 |
| `../../_documentacao/SHARED_CAPABILITY_REGISTRY.md` | capacidades comuns e limites de compartilhamento |
| `../../_documentacao/standards/11-CENTRAL-CONTROL-PLANE.md` | regras normativas da Central |
| `../../_documentacao/standards/07A-INCIDENT-PROBLEM-RELEASE.md` | incidentes, problemas, IA, canário e rollback |
| `../../_documentacao/standards/08-UI-APPSHELL-SEARCH.md` | AppShell, busca, ações e governança de telas |
| `../../_documentacao/standards/09-CONFIG-JOBS-STORAGE.md` | configurações, jobs, storage e import/export |
| `../../_documentacao/standards/10-PRODUCT-LIFECYCLE-PORTABILITY.md` | lifecycle, exportação e desmembramento |
| `../../_documentacao/standards/12-COST-ENVIRONMENT-GOVERNANCE.md` | ambientes, FinOps e infraestrutura |

## Estado real de partida

Confirmar novamente antes de editar. No snapshot documental de 26/09/2026:

- backend FastAPI, PostgreSQL, Alembic, health, readiness, versionamento, correlação e erros públicos existem;
- autenticação nativa por e-mail/senha, sessão opaca em cookie, logout e Google OAuth opcional existem no backend;
- `User`, `Tenant`, `Membership` e `AuthSession` existem;
- cadastro/listagem inicial de `SaasProduct` existe em `/api/v1/saas` e exige sessão; criação exige papel `admin` ou `superadmin`;
- login, restauração de sessão e logout foram validados localmente;
- build, lint, typecheck, testes, migration, integração com banco e smoke estavam verdes;
- o frontend ainda contém telas e integrações de domínio dependentes do Base44;
- M0 permanece bloqueado por falta de paridade funcional das telas de domínio;
- qualquer documento dizendo que ainda não existe autenticação ou endpoint de negócio está desatualizado e deve ser corrigido com base no código e nos testes atuais.

## Regras inegociáveis

- [ ] Não acessar diretamente banco, storage ou código interno de outro SaaS.
- [ ] Não transformar a Central em banco mestre dos dados operacionais.
- [ ] Não compartilhar credenciais no navegador, logs, documentação ou Git.
- [ ] Não considerar HTTP 200 como conclusão quando a operação for assíncrona.
- [ ] Não usar cargo ou nome de perfil hardcoded como política definitiva.
- [ ] Negar por padrão e verificar tenant, escopo, ação e recurso no backend.
- [ ] Toda mutação relevante deve ter ator, motivo, correlação, idempotência e auditoria.
- [ ] Ações críticas precisam de preview, confirmação e rollback ou compensação.
- [ ] IA pode diagnosticar e propor; não altera código, banco, auth, permissões ou produção silenciosamente.
- [ ] Cada SaaS deve continuar operando sem a Central.
- [ ] Não redesenhar ou apagar o frontend histórico antes de registrar paridade e evidência.
- [ ] Não iniciar cloud, deploy ou provisionamento automático sem destinos confirmados e autorização.
- [ ] Cada sessão de implementação deve alterar código funcional e testes; criar somente planos/documentos não conta como avanço, salvo quando o pedido for exclusivamente documental.
- [ ] Não refazer o layout de tela existente: preservar, conectar, completar e melhorar.
- [ ] Usar `CENTRAL_SCREEN_IMPLEMENTATION_MATRIX.md` para escolher a tela e marcar progresso somente após cumprir seu critério de conclusão.

---

# Fase 0 — fechar o baseline e a migração segura

Objetivo: eliminar ambiguidades sobre o que já funciona, preservar o frontend e criar proteção suficiente para substituir o Base44 por partes.

## CEN-000 / C0 — baseline

- [x] Executar o gate completo e registrar o resultado atual, sem reutilizar números antigos.
- [x] Conferir `git status` e separar alterações da sessão de alterações preexistentes.
- [x] Atualizar `ARCHITECTURE.md` para refletir auth, sessão, tenancy e `SaasProduct` já presentes.
- [x] Atualizar o inventário de rotas e jornadas do frontend.
- [ ] Registrar screenshots das telas históricas ainda relevantes.
- [x] Mapear por tela: origem dos dados, chamadas Base44, mocks, `localStorage`, botões e efeitos.
- [ ] Aumentar cobertura do frontend começando por autenticação, proteção de rota, menu e cadastro/listagem de SaaS.
- [ ] Manter a verificação de integridade do frontend original.
- [x] Registrar dependências vulneráveis sem aplicar atualização incompatível às cegas.
- [x] Definir quais páginas históricas serão mantidas, adaptadas ou substituídas.

Aceite da fase:

- [ ] build, lint, typecheck, testes, migrations, integração PostgreSQL e smoke passam;
- [x] todas as rotas críticas possuem pelo menos teste de acesso e renderização;
- [ ] toda dependência Base44 restante está localizada e classificada;
- [ ] existe uma jornada funcional local completa além de apenas abrir tela;
- [ ] `PROJECT_STATUS`, JSON de estado e handoff mostram a mesma situação.

Referências: `FRONTEND_BASELINE.md`, `BASE44_MIGRATION_MAP.md`, `TESTING_STRATEGY.md`, `CENTRAL_IMPLEMENTATION_PLAN.md#c0`.

---

# Fase 1 — identidade, organizações, acesso e auditoria

Objetivo: concluir a fundação administrativa antes de conectar os demais SaaS.

## C1.1 — usuários e sessões

- [ ] Validar normalização e unicidade de e-mail.
- [ ] Manter senha somente como hash forte e impedir vazamento em respostas/logs.
- [ ] Garantir lockout, expiração, revogação e limpeza de sessões expiradas.
- [ ] Implementar troca segura de senha e recuperação, se aprovada para esta fase.
- [ ] Implementar tela de sessões/dispositivos e revogação administrativa quando necessária.
- [ ] Garantir que Google OAuth somente aceite usuário previamente autorizado; não criar conta automaticamente em produção.
- [ ] Remover bootstrap do comando normal de startup; manter criação inicial idempotente e explícita.
- [ ] Cobrir cookies, CORS, Origin/CSRF, logout e callbacks por ambiente.

## C1.2 — tenants, memberships e contexto

- [ ] Criar seleção/troca explícita de tenant para usuários com múltiplos vínculos.
- [ ] Validar tenant em todos os repositórios e endpoints.
- [ ] Impedir acesso de usuário sem membership ativa.
- [ ] Modelar status, vigência e expiração da membership.
- [ ] Testar isolamento horizontal entre tenants.
- [ ] Separar pessoa global, conta de produto e vínculo administrativo.

## C1.3 — autorização real

- [ ] Substituir decisões finais baseadas apenas em `role` por permissões nomeadas.
- [ ] Criar recursos e ações: visualizar, criar, editar, excluir, aprovar, executar, exportar, administrar.
- [ ] Implementar RBAC como base e ABAC para contexto, risco, tenant e recurso.
- [ ] Implementar deny-by-default.
- [ ] Modelar grupos, funções/cargos, perfis de acesso, equipes, setores e unidades.
- [ ] Modelar exceções individuais com motivo, concedente e expiração.
- [ ] Implementar acesso temporário, step-up/MFA e break glass em fases controladas.
- [ ] Criar explicação da permissão efetiva e simulador de usuário.

## C1.4 — auditoria

Estado parcial em 26/09/2026: `AuditLog` e `GET /api/v1/audit` existem; criação e edição do catálogo de SaaS gravam ator, tenant, recurso, antes/depois saneado, resultado e correlação. Os itens abaixo permanecem abertos até cobertura de todos os domínios, busca/exportação e política de retenção.

- [ ] Criar `AuditLog` append-only com ator, tenant, ação, recurso, antes/depois saneado, resultado e correlação.
- [ ] Auditar login, logout, falha, lockout, mudanças de acesso, configurações e comandos.
- [ ] Garantir que logs técnicos e auditoria de negócio sejam conceitos separados.
- [ ] Criar busca e exportação controlada de auditoria.
- [ ] Definir retenção e proteção contra alteração.

Aceite da fase:

- [ ] jornadas de login, sessão, troca de tenant, logout e negação passam em E2E;
- [ ] usuário do tenant A não lê nem altera tenant B;
- [ ] permissões são verificadas no backend, não apenas escondidas na UI;
- [ ] bootstrap não redefine senha e não roda em todo deploy;
- [ ] eventos administrativos relevantes aparecem na auditoria sem segredo ou dado excessivo.

Referências: `CENTRAL_IMPLEMENTATION_PLAN.md#c1`, `DECISIONS.md`, padrões de identidade do HUB e requisitos `P0-001–005`, `P1-001–004` do backlog geral.

---

# Fase 2 — administração de pessoas, perfis e experiência

Objetivo: transformar a Central numa administração utilizável, sem misturar cadastro de pessoa, conta, função e permissão.

## HUB-ADM-001 — estrutura de Administração

- [ ] Criar página inicial de Administração com resumo, pendências e alertas.
- [ ] Criar lista e detalhe lateral/página de usuários.
- [ ] Criar gestão de pessoas separada das credenciais de acesso.
- [ ] Preservar a matriz histórica como `Acessos por função`.
- [ ] Criar páginas de Perfis e Funções.
- [ ] Criar catálogo de Permissões.
- [ ] Criar Equipes, Setores e Unidades.
- [ ] Criar Telas e Módulos.
- [ ] Criar Formulários.
- [ ] Criar Integrações, Segurança e Configurações.
- [ ] Mostrar origem, herança e exceção de todo acesso efetivo.
- [ ] Permitir comparação entre acesso esperado e concedido.
- [ ] Garantir que superadmin tenha visão global e gestores permaneçam no próprio escopo.

## HUB-071–086 — governança de telas

- [ ] Implementar Screen Registry de produto, módulo, tela, aba, widget e ação.
- [ ] Definir configuração padrão do produto.
- [ ] Aplicar herança: produto → segmento → tenant → departamento → função/perfil → usuário.
- [ ] Mostrar diff e preview antes de publicar configuração.
- [ ] Detectar referências órfãs, telas removidas e configuração incompatível.
- [ ] Manter autorização real no SaaS; configuração visual não concede acesso sozinha.
- [ ] Versionar configurações e permitir rollback.

## AppShell e experiência comum

- [ ] Menu e rotas respeitam permissão.
- [ ] Padrões consistentes de tabela, filtros, paginação, drawer, formulário e detalhe.
- [ ] Estados loading, vazio, erro, parcial, indisponível e sem permissão.
- [ ] Ações destrutivas com confirmação proporcional e impacto explicado.
- [ ] Notificações acionáveis e preferências por usuário.
- [ ] Acessibilidade, teclado, responsividade e design tokens.
- [ ] Ajuda contextual e ligação com documentação viva.

Aceite da fase:

- [ ] uma pessoa pode possuir contas/vínculos diferentes sem duplicação indevida;
- [ ] a UI explica por que alguém possui ou não possui acesso;
- [ ] nenhuma tela ou ação protegida depende somente de ocultação visual;
- [ ] alteração de acesso/configuração é versionada e auditada.

Referências: `CENTRAL_CAPABILITY_CATALOG.md` seções 5–7 e 10; `../../_documentacao/ESCOPO_CENTRAL.md`; páginas 653–680 de `AJUSTAR SAAS 16092026.pdf`.

---

# Fase 3 — Product Registry, Service Registry e SaaS 360

Objetivo: registrar os produtos e suas capacidades sem fingir que já estão integrados.

## CEN-001 / C2 — catálogo de SaaS

- [ ] Evoluir `SaasProduct` sem quebrar os registros existentes.
- [ ] Definir estados de lifecycle e separar status comercial, operacional e de integração.
- [ ] Criar owners técnicos, comerciais e operacionais.
- [ ] Criar ambientes por produto: local, test, staging e production quando existentes.
- [ ] Criar versões do produto, frontend, backend e Admin API.
- [ ] Criar Capability Manifest versionado.
- [ ] Criar níveis de integração: inventário, leitura, administração limitada e completa.
- [ ] Criar compatibilidade: supported, deprecated, limited e incompatible.
- [ ] Criar catálogo de dependências compartilhadas e dedicadas.
- [ ] Não guardar service token em campo comum ou retorná-lo ao navegador.

## HUB-186–202 — telas executivas

- [ ] Home com produtos, ambientes, tenants, usuários, saúde, incidentes, custos e pendências.
- [ ] Product Catalog com filtros, lifecycle, ownership e compatibilidade.
- [ ] SaaS 360 com resumo, serviços, capacidades, ambientes, integrações, custos e histórico.
- [ ] Tenant 360 com produtos, planos, usuários, uso, custos e integrações autorizadas.
- [ ] Product Readiness com checklist e evidências.
- [ ] Health Center e Reliability.
- [ ] Incidents, Problems e Operations Center.
- [ ] Integrations Center.
- [ ] Screen Governance, AI Governance, Security e Audit.
- [ ] Costs e Business Metrics.

## Criador de novo SaaS

- [ ] Começar como assistente de planejamento, não como provisionamento irrestrito.
- [ ] Coletar identidade, domínio, owner, personas, dados sensíveis e fronteiras.
- [ ] Selecionar capacidades compartilhadas explicitamente.
- [ ] Gerar pacote documental, estrutura, manifests, checklist e backlog.
- [ ] Preparar banco, storage, portas e ambientes sem inserir segredo.
- [ ] Exigir testes, readiness, segurança e aprovação antes do registro ativo.
- [ ] Adiar criação automática de GitHub/Render/Neon até contratos, service identities, quotas e rollback estarem comprovados.

Aceite da fase:

- [ ] cadastro/listagem/detalhe usam API e persistência reais;
- [ ] produto indisponível não derruba a Central;
- [ ] inventário não é exibido como integração concluída;
- [ ] cada informação mostra origem, atualização e eventual obsolescência.

Referências: `CENTRAL_CAPABILITY_CATALOG.md` seções 1–4 e 11; `standards/11-CENTRAL-CONTROL-PLANE.md`; páginas 280–345 e 410–525 de `Saas atualização 14092026.pdf`.

---

# Fase 4 — contrato Central ↔ SaaS

Objetivo: substituir dados demonstrativos por integração progressiva, segura e observável.

## C3 — contrato mínimo

- [ ] Versionar endpoints de health, readiness, version e capabilities.
- [ ] Definir Admin Manifest e sua validação.
- [ ] Definir autenticação serviço-a-serviço, audience, scopes e rotação.
- [ ] Propagar correlation ID, product ID, environment e tenant quando aplicável.
- [ ] Definir timeout, retry com backoff, circuit breaker e modo degradado.
- [ ] Definir cache, TTL, proveniência e indicador de dado stale.
- [ ] Criar Test Connection: DNS, TLS, autenticação, versão, capabilities e permissões.
- [ ] Criar doubles e testes de contrato para online, degraded, unavailable, incompatible e auth failed.

## Eventos e webhooks

- [ ] Definir envelope versionado, tipo, origem, tenant, timestamp e idempotency key.
- [ ] Tratar duplicidade e entrega fora de ordem.
- [ ] Implementar outbox no SaaS e inbox/registro na Central quando necessário.
- [ ] Registrar tentativas, falhas e dead-letter.
- [ ] Não depender de evento para manter operação local essencial.

## Admin Commands

- [ ] Estados: draft, validating, awaiting confirmation, queued, executing, succeeded, partial success, failed, cancelled e rolled back.
- [ ] Separar aceitação HTTP do resultado final.
- [ ] Exigir ação, escopo, motivo, risco, solicitante e idempotência.
- [ ] Mostrar preview e impacto antes de confirmar.
- [ ] Retornar resultado por registro para operações em lote.
- [ ] Aplicar optimistic concurrency e detectar conflito.
- [ ] Implementar retry somente para operação segura/idempotente.
- [ ] Manter histórico e auditoria dos dois lados.

Aceite da fase:

- [ ] MediaMind ou um stub contratual completa handshake sem acesso cruzado a banco;
- [ ] falhas são claras, recuperáveis e não viram falso sucesso;
- [ ] repetição de comando não duplica efeito;
- [ ] desconectar a Central não impede o SaaS de operar.

Referências: `CENTRAL_IMPLEMENTATION_PLAN.md#c3`; `standards/11-CENTRAL-CONTROL-PLANE.md`; `DECISIONS.md`.

---

# Fase 5 — importação, exportação, formulários e entrada de dados

Objetivo: criar o motor transversal descrito como Admin + Forms + Power Query simplificado.

## CEN-002 / HUB-IMPORT-001 — Import Engine

- [ ] Suportar inicialmente CSV e Excel por adapters.
- [ ] Validar tamanho, extensão, MIME, checksum e segurança do arquivo.
- [ ] Criar preview sem escrita definitiva.
- [ ] Selecionar tabela/aba e linha de cabeçalho.
- [ ] Mapear colunas para campos do produto.
- [ ] Validar tipo, obrigatoriedade, domínio, relacionamento e duplicidade.
- [ ] Editar células antes da importação.
- [ ] Renomear, remover, ordenar, dividir, combinar e converter colunas.
- [ ] Localizar/substituir, aparar, normalizar e aplicar condicionais.
- [ ] Filtrar erros e revisar duplicados.
- [ ] Implementar desfazer/refazer e comparação origem/resultado.
- [ ] Salvar receitas versionadas por produto e tipo de importação.
- [ ] Executar dry run com criação, atualização, conflito e rejeição.
- [ ] Exigir confirmação antes da escrita.
- [ ] Executar como job assíncrono, retomável e cancelável.
- [ ] Produzir resultado por linha e arquivo de rejeitados.
- [ ] Permitir reprocessamento seguro sem duplicar registros.
- [ ] Auditar arquivo, receita, ator, tenant, resultado e correlação.

## Exportação

- [ ] Exportar somente campos autorizados e dentro do tenant.
- [ ] Permitir filtro, formato e versão do schema.
- [ ] Aplicar classificação, retenção e regras LGPD.
- [ ] Gerar checksum, manifesto e histórico.
- [ ] Suportar exportação incremental quando o adapter permitir.

## Formulários

- [ ] Criar schemas e versões de formulários.
- [ ] Campos, validações, dependências, condicionais e acessibilidade.
- [ ] Publicação por produto, tenant, perfil e vigência.
- [ ] Preview responsivo e aprovação.
- [ ] Integração com imports, workflows, notificações e auditoria.

Aceite da fase:

- [ ] preview/dry run nunca grava dados;
- [ ] validação específica ocorre no SaaS proprietário;
- [ ] reenvio do mesmo lote não duplica efeito;
- [ ] falhas parciais e rejeitados são visíveis e exportáveis;
- [ ] dados sensíveis não vazam em preview, log ou exportação.

Referências: `CENTRAL_CAPABILITY_CATALOG.md` seções 8–10; `standards/09-CONFIG-JOBS-STORAGE.md`; PDF de atualização páginas 154–156 e PDF de ajustes páginas 679–680.

---

# Fase 6 — operações, confiabilidade e IA segura

Objetivo: transformar erros em fluxo operacional rastreável sem permitir “autocorreção” perigosa.

## CEN-003 — Operations e Health

- [ ] Painel de health, readiness, latência, erro, fila, worker, banco e storage.
- [ ] Release health por versão/deploy.
- [ ] Jobs com progresso, retry, cancelamento, DLQ e custo.
- [ ] Configuração de alertas por produto, ambiente, perfil e severidade.
- [ ] Runbooks, responsáveis, SLA e escalonamento.
- [ ] Modo manutenção e feature flags autorizadas.

## Error Center

- [ ] Receber eventos sanitizados, não dumps brutos.
- [ ] Criar fingerprint e agrupamento.
- [ ] Registrar produto, ambiente, versão, severidade, frequência e impacto.
- [ ] Registrar correlation/request ID e mudança/deploy relacionado.
- [ ] Diferenciar ErrorEvent, Incident e Problem.
- [ ] Manter Known Error Database.
- [ ] Criar timeline, owner, workaround, causa raiz e resolução.
- [ ] Não guardar milhões de linhas de log bruto no banco transacional da Central.

## CEN-005 — IA de confiabilidade

- [ ] Reunir apenas evidências autorizadas e saneadas.
- [ ] Produzir hipótese, evidências, confiança e limitações.
- [ ] Relacionar logs, métricas, versão, deploy, testes e incidentes semelhantes.
- [ ] Reproduzir em ambiente isolado quando possível.
- [ ] Gerar proposta/diff em branch separada.
- [ ] Executar testes, análise de segurança e verificação de regressão.
- [ ] Exigir aprovação humana conforme risco.
- [ ] Liberar por staging/canário e monitorar.
- [ ] Fazer rollback automático apenas segundo política previamente aprovada.
- [ ] Transformar bugs relevantes em testes de regressão.
- [ ] Medir recorrência após correção.

A IA pode automatizar somente remediações operacionais pequenas, reversíveis e pré-aprovadas, como retry idempotente, reinício de worker permitido ou desligamento de flag específica. Código, migrations, banco, autenticação, permissões e produção exigem gate humano.

Aceite da fase:

- [ ] secrets, tokens, cookies e dados privados são saneados antes da análise;
- [ ] toda hipótese mostra evidência e confiança;
- [ ] nenhuma alteração estrutural é aplicada silenciosamente;
- [ ] incidente resolvido possui causa, ação corretiva/preventiva e barreira contra recorrência.

Referências: `CENTRAL_CAPABILITY_CATALOG.md` seções 12–16; `standards/07A-INCIDENT-PROBLEM-RELEASE.md`; páginas 157–189 de `Saas atualização 14092026.pdf`.

---

# Fase 7 — busca, command palette, assistente e documentação viva

## Busca universal

- [ ] Criar Search Registry por produto/capability.
- [ ] Normalização, palavras parciais, sinônimos, vocabulário e ranking.
- [ ] Resultados agrupados: ações, páginas, registros, relatórios, configurações e ajuda.
- [ ] Respeitar tenant e permissão antes de retornar resultado.
- [ ] Mostrar origem, tipo, contexto e deep link sem ambiguidade.
- [ ] Registrar analytics de busca sem conteúdo sensível.
- [ ] Permitir à IA propor sinônimos; exigir revisão antes de publicar vocabulário.

## Ações rápidas

- [ ] Action Registry único para `+ Novo`, command palette e assistente.
- [ ] Mostrar apenas ações permitidas e relevantes ao contexto.
- [ ] Exigir preview/confirmação em ações sensíveis.
- [ ] Não apresentar botão ou item morto.

## Assistente de IA

- [ ] Explicar o que pretende consultar ou executar.
- [ ] Usar APIs internas autorizadas, não acesso direto a banco.
- [ ] Aplicar quotas, orçamento, auditoria e proteção contra prompt injection.
- [ ] Separar resposta informativa de proposta de ação.
- [ ] Exigir confirmação para escrita.

## Documentação viva

- [ ] Exibir capabilities, versões, contratos, runbooks e ADRs.
- [ ] Ligar requisito → tela/API → teste → evidência → versão publicada.
- [ ] Mostrar planejado, implementado, homologado e publicado como estados diferentes.

Referências: `CENTRAL_CAPABILITY_CATALOG.md` seções 21–22; `standards/08-UI-APPSHELL-SEARCH.md`; páginas 233–279 de `Saas atualização 14092026.pdf`.

---

# Fase 8 — planos, cobrança, uso e custos

## CEN-006/CEN-007 — produto e negócio

- [ ] Modelar produtos, planos, addons, versões e vigência.
- [ ] Modelar entitlements separados de permissões administrativas.
- [ ] Medir usage por usuários, storage, IA, jobs, mensagens e integrações.
- [ ] Alertar quota antes de bloquear.
- [ ] Simular impacto de mudança de plano.
- [ ] Suspender sem apagar dados.
- [ ] Separar billing das regras operacionais do SaaS.
- [ ] Conciliar uso medido e faturado.

## FinOps

- [ ] Custos por produto, tenant, ambiente e serviço.
- [ ] Separar custo compartilhado e dedicado.
- [ ] Ratear banco, storage, rede, jobs, observabilidade e e-mail.
- [ ] Medir IA por provedor, modelo e tarefa.
- [ ] Orçamento, previsão, tendência e anomalia.
- [ ] Recomendações de economia com confirmação humana.
- [ ] Métricas de negócio com definição, período, origem e atualização claros.

Aceite da fase:

- [ ] toda medição possui fonte e unidade;
- [ ] permissões não são confundidas com direitos comerciais;
- [ ] rateio é explicável e reproduzível;
- [ ] mudança de plano não apaga dados silenciosamente.

Referências: `CENTRAL_CAPABILITY_CATALOG.md` seções 17–18; `standards/12-COST-ENVIRONMENT-GOVERNANCE.md`.

---

# Fase 9 — segurança, LGPD, backup e portabilidade

## Segurança e LGPD

- [ ] Security Center por produto e ambiente.
- [ ] Inventário e rotação de secrets/certificados sem exibir valores.
- [ ] Sessões privilegiadas, MFA, anomalias e segregação de deveres.
- [ ] Classificação: public, internal, confidential, sensitive e restricted.
- [ ] Finalidade, base legal, retenção e minimização.
- [ ] Fluxos de acesso, correção, exportação, anonimização e eliminação.
- [ ] Evidência de atendimento ao titular.
- [ ] Dupla aprovação para ações críticas definidas por política.

## CEN-008 — backup e restore

- [ ] Inventariar bancos, buckets, arquivos e configurações por produto.
- [ ] Registrar último backup e último restore realmente testado.
- [ ] Definir RPO/RTO por produto.
- [ ] Criptografia, retenção, localização e acesso.
- [ ] Exercícios periódicos com evidência.
- [ ] Não declarar backup saudável sem restore comprovado.

## Portabilidade e detachment

- [ ] Dependency Map de banco, storage, domínio, secrets, serviços e owners.
- [ ] Portability Package versionado e verificável.
- [ ] Portability Score explicável.
- [ ] Migração de serviço shared para dedicated.
- [ ] Transferência de propriedade e revogação dos acessos antigos.
- [ ] Arquivar, desconectar, transferir e excluir como ações distintas.
- [ ] Provar operação do SaaS sem domínio, banco ou disponibilidade da Central.

Referências: `CENTRAL_CAPABILITY_CATALOG.md` seções 19, 20 e 23; `standards/10-PRODUCT-LIFECYCLE-PORTABILITY.md`.

---

# Fase 10 — cloud, homologação e produção

Executar somente com alvos confirmados e autorização explícita.

- [ ] Confirmar repositório, conta, região, serviços e banco.
- [ ] Separar local, test, staging e production.
- [ ] Configurar secrets fora do Git.
- [ ] Rodar migrations como etapa separada do startup.
- [ ] Não executar bootstrap de usuário em todo deploy.
- [ ] Configurar frontend/API, cookies, CORS e callbacks reais.
- [ ] Configurar health, readiness, observabilidade e alertas.
- [ ] Executar backup antes de migration de risco.
- [ ] Homologar E2E em staging.
- [ ] Definir rollback de código e banco.
- [ ] Publicar em canário e acompanhar release health.
- [ ] Registrar versão, evidência e decisão de promoção.

Referências: `CENTRAL_IMPLEMENTATION_PLAN.md#c7`; padrão de produção do HUB.

---

# Matriz resumida de telas da Central

| Área | Telas mínimas | Fase |
|---|---|---:|
| Início | Home executiva, pendências, alertas, ações rápidas | 3 |
| Produtos | Catálogo, SaaS 360, readiness, versões, ambientes | 3 |
| Clientes | Tenant 360, planos, produtos, usuários, consumo | 3/8 |
| Administração | visão geral, pessoas, usuários, acessos por função, perfis, permissões, equipes | 2 |
| Experiência | telas/módulos, widgets, ações, feature flags, configurações | 2/8 |
| Dados | importação, transformação, histórico, exportação, formulários | 5 |
| Integrações | conexões, manifests, webhooks, contratos e Test Connection | 4 |
| Operações | health, jobs, comandos, filas, deploys e migrations | 6 |
| Confiabilidade | erros, incidentes, problemas, known errors e release health | 6 |
| IA | diagnóstico, propostas, governança, custos e auditoria | 6/7/8 |
| Segurança | sessões, acessos privilegiados, riscos, secrets e LGPD | 1/9 |
| Financeiro | planos, entitlements, usage, billing e FinOps | 8 |
| Continuidade | backup, restore, DR, exportação e detachment | 9 |
| Conhecimento | busca global, command palette, docs, runbooks e ADRs | 7 |

# Contrato de conclusão de qualquer item

Só marcar uma tarefa como concluída quando todos os pontos aplicáveis forem comprovados:

- [ ] interface funcional e não apenas estática;
- [ ] API real e contrato documentado;
- [ ] persistência e migration quando necessárias;
- [ ] tenant e autorização no backend;
- [ ] auditoria e correlação;
- [ ] idempotência para mutações repetíveis;
- [ ] loading, vazio, erro, indisponível e sem permissão;
- [ ] testes unitários, integração e jornada crítica;
- [ ] compatibilidade/migração de dados antigos;
- [ ] acessibilidade e responsividade;
- [ ] segurança, privacidade e ausência de secrets;
- [ ] documentação e estado atualizados;
- [ ] evidência reproduzível;
- [ ] rollback ou compensação quando houver risco.

# Ordem curta recomendada para o outro chat

1. Revalidar o estado e corrigir documentos desatualizados sobre o que já existe.
2. Terminar C0 sem quebrar autenticação nativa já implementada.
3. Concluir C1: tenant, permissões granulares e auditoria persistente.
4. Migrar uma jornada administrativa real do frontend para a API local.
5. Evoluir Product Registry/SaaS 360 sobre `SaasProduct` existente.
6. Implementar o contrato mínimo Central ↔ SaaS com um stub ou o MediaMind.
7. Construir Administração e governança de telas.
8. Construir Import Engine/Power Query simplificado.
9. Construir Operations/Error Center e depois IA de diagnóstico segura.
10. Adicionar busca/ações, lifecycle, entitlements, usage/FinOps e portabilidade.
11. Homologar staging antes de qualquer produção.

# Modelo de atualização por sessão

Ao terminar cada bloco, registrar:

```text
ID da tarefa:
Estado anterior:
Estado novo:
Arquivos alterados:
Migration:
Testes executados e resultado:
Jornada manual validada:
Riscos/pendências:
Rollback:
Próximo item desbloqueado:
```

# Limites de escopo

- O MediaMind é referência de padrão técnico, não fonte de domínio para a Central.
- Timeline, roteiro, CEDOC e Clip Engine permanecem específicos do MediaMind.
- Os originais Base44 dos demais SaaS só entram quando houver autorização para iniciar cada produto.
- Benchmark, sugestão de fornecedor e texto gerado por IA são discovery até validação.
- Ideia documentada não equivale a funcionalidade aprovada, implementada ou publicada.
