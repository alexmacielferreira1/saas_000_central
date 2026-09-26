# Matriz completa de telas da Central SaaS

## Finalidade

Esta matriz transforma as capacidades planejadas em telas e rotas concretas. Ela também impede dois erros recorrentes:

1. substituir uma tela existente por outra genérica sem aproveitar seu layout e componentes;
2. encerrar uma sessão apenas com novos documentos, mocks ou botões sem ação real.

Estados usados:

- **Existente — integrar/melhorar:** a rota/tela já existe; preservar identidade e completar dados, ações e estados.
- **Nova — criar:** a experiência ainda precisa ser implementada.
- **Subtela:** pode ser rota própria, aba ou drawer, conforme a navegação existente e a complexidade.
- **Futura:** especificada, mas bloqueada por dependência técnica.

## Regra de implementação

O trabalho normal deve entregar código. Documentação é parte da entrega, não a entrega inteira. Para cada tela selecionada:

1. preservar e melhorar o layout existente quando houver;
2. criar/ajustar rota e navegação;
3. conectar API e persistência reais;
4. implementar permissões no backend e refletir na UI;
5. adicionar loading, vazio, erro, sucesso, sem permissão e indisponibilidade;
6. implementar ações e botões de ponta a ponta;
7. adicionar testes;
8. atualizar documentação e estado somente depois da verificação.

Não criar várias telas vazias de uma vez. Entregar uma fatia vertical funcional por sessão sempre que possível.

## Telas que já existem e devem ser preservadas

| ID | Rota atual | Tela | Tratamento obrigatório |
|---|---|---|---|
| SCR-001 | `/` | Home | Manter composição visual; trocar métricas demonstrativas por dados reais e atalhos por permissão |
| SCR-002 | `/saas` | Lista de SaaS | Preservar cards/lista; concluir API, filtros, estados, criação e atualização |
| SCR-003 | `/saas/:id` | Detalhe do SaaS | Evoluir para SaaS 360 com abas reais; não substituir por tela genérica |
| SCR-004 | `/users` | Usuários e acessos | Preservar o que já existe; reorganizar em Administração e especializar subáreas |
| SCR-005 | `/configurations` | Configurações | Evoluir para configuração versionada, herdada, com preview e rollback |
| SCR-006 | `/operations` | Centro de Operações | Conectar health, jobs, comandos, serviços, filas e deploys reais |
| SCR-007 | `/audit` | Auditoria | Conectar AuditLog persistente, filtros, detalhe e exportação autorizada |
| SCR-008 | `/incidents` | Incidentes | Completar incidentes, problemas, timeline, owner, impacto e resolução |
| SCR-009 | `/integrations` | Integrações | Completar connectors, ambientes, contratos e Test Connection |
| SCR-010 | `/resolution` | Centro de Resolução | Evoluir para diagnóstico por IA e fluxo seguro de proposta/validação |
| SCR-011 | `/api-guides` | Guias de API | Tornar documentação viva de Admin API, manifests, eventos e comandos |
| SCR-012 | `/login` | Login | Manter layout e concluir sessão real, mensagens e acessibilidade |
| SCR-013 | `/register` | Registro | Definir se é convite/ativação; não permitir cadastro público indevido |
| SCR-014 | `/forgot-password` | Recuperar senha | Implementar fluxo real ou sinalizar indisponibilidade sem simulação |
| SCR-015 | `/reset-password` | Redefinir senha | Token de uso único, expiração, política e revogação de sessões |

## Home e comando executivo

| ID | Rota sugerida | Tela | Entrega funcional |
|---|---|---|---|
| SCR-020 | `/` | Home executiva | KPIs por permissão, produtos, tenants, saúde, incidentes, custos, uso, pendências e feed |
| SCR-021 | `/inbox` | Caixa administrativa | Aprovações, alertas, falhas, imports, tarefas e decisões pendentes |
| SCR-022 | `/search` | Busca global | Produtos, tenants, usuários, serviços, incidentes, configurações, docs e ações |
| SCR-023 | `Ctrl+K` | Command Palette | Navegação e ações registradas, autorizadas e auditáveis |
| SCR-024 | drawer/modal | `+ Novo` | Ações de criação permitidas pelo contexto e perfil |
| SCR-025 | `/activity` | Atividade recente | Eventos administrativos consolidados com origem e correlação |

## Produtos, SaaS 360 e criação de novos SaaS

| ID | Rota sugerida | Tela | Entrega funcional |
|---|---|---|---|
| SCR-030 | `/saas` | Catálogo de produtos | Lista, cards, filtros, status, owner, versão, saúde e compatibilidade |
| SCR-031 | `/saas/new` | Assistente de novo SaaS | Planejamento, capacidades, personas, segurança, estrutura e checklist; sem cloud automática inicialmente |
| SCR-032 | `/saas/:id/overview` | SaaS 360 — visão geral | Resumo, lifecycle, owner, tenants, usuários, serviços, saúde e pendências |
| SCR-033 | `/saas/:id/environments` | Ambientes | Local/test/staging/produção, URLs, versões, estado e configuração mascarada |
| SCR-034 | `/saas/:id/capabilities` | Capabilities | Manifest, versão, suporte, limitações e compatibilidade |
| SCR-035 | `/saas/:id/services` | Serviços | Instâncias, dependências, health, readiness e responsáveis |
| SCR-036 | `/saas/:id/versions` | Versões e releases | Frontend/backend/Admin API, changelog, compatibilidade e release health |
| SCR-037 | `/saas/:id/readiness` | Product Readiness | Checklist, evidências, bloqueios, homologação e decisão |
| SCR-038 | `/saas/:id/integrations` | Integrações do SaaS | Conectores, contratos, webhooks, scopes e teste de conexão |
| SCR-039 | `/saas/:id/tenants` | Tenants do SaaS | Clientes vinculados, plano, status, uso e acesso administrativo |
| SCR-040 | `/saas/:id/users` | Usuários do SaaS | Contas do produto, vínculos globais, estado e acesso efetivo |
| SCR-041 | `/saas/:id/operations` | Operações do SaaS | Jobs, comandos, falhas, retries e histórico |
| SCR-042 | `/saas/:id/audit` | Auditoria do SaaS | Eventos locais/remotos correlacionados |
| SCR-043 | `/saas/:id/costs` | Custos do SaaS | Banco, storage, IA, jobs, rede e rateio |
| SCR-044 | `/saas/:id/dependencies` | Dependency Map | Shared/dedicated, risco, substituição e impacto de desmembramento |
| SCR-045 | `/saas/:id/lifecycle` | Lifecycle | Ativar, manter, suspender, arquivar, transferir, descomissionar e excluir |
| SCR-046 | `/saas/:id/portability` | Portabilidade | Export package, score, checklist, integridade e detachment test |

## Clientes e Tenant 360

| ID | Rota sugerida | Tela | Entrega funcional |
|---|---|---|---|
| SCR-050 | `/tenants` | Lista de clientes/tenants | Busca, status, segmento, produtos, plano, uso, risco e pendências |
| SCR-051 | `/tenants/new` | Novo tenant | Identidade, produtos, plano, responsáveis, região e configuração inicial |
| SCR-052 | `/tenants/:id/overview` | Tenant 360 | Produtos, usuários, consumo, custos, integrações, incidentes e histórico |
| SCR-053 | `/tenants/:id/products` | Produtos contratados | Ativação, entitlement, módulo, limite, vigência e estado |
| SCR-054 | `/tenants/:id/users` | Usuários do tenant | Pessoas, memberships, equipes, perfis e exceções |
| SCR-055 | `/tenants/:id/usage` | Uso e quotas | Métricas, limites, alertas, tendência e bloqueios |
| SCR-056 | `/tenants/:id/settings` | Configurações efetivas | Herança, override, versão, preview e rollback |
| SCR-057 | `/tenants/:id/security` | Segurança do tenant | MFA, sessões, acessos privilegiados, riscos e eventos |
| SCR-058 | `/tenants/:id/data` | Dados e LGPD | Classificação, finalidade, retenção, exportação e solicitações |
| SCR-059 | `/tenants/:id/lifecycle` | Lifecycle do tenant | Suspender, reativar, exportar, anonimizar e excluir com impacto |

## Administração, pessoas e permissões

| ID | Rota sugerida | Tela | Entrega funcional |
|---|---|---|---|
| SCR-060 | `/administration` | Visão geral da Administração | Indicadores, convites, bloqueios, exceções, riscos e atalhos |
| SCR-061 | `/administration/people` | Pessoas | Cadastro humano separado da conta de acesso |
| SCR-062 | `/administration/users` | Usuários | Conta global, estado, memberships, último acesso e ações |
| SCR-063 | `/administration/users/:id` | Usuário 360 | Dados, vínculos, sessões, permissões efetivas, auditoria e riscos |
| SCR-064 | `/administration/access-by-role` | Acessos por função | Preservar e evoluir a matriz existente de cargos/funções |
| SCR-065 | `/administration/roles` | Cargos e funções | Estrutura organizacional, responsabilidade e herança |
| SCR-066 | `/administration/profiles` | Perfis de acesso | Pacotes versionados de permissões |
| SCR-067 | `/administration/permissions` | Catálogo de permissões | Recursos, ações, escopos e uso |
| SCR-068 | `/administration/effective-access` | Permissão efetiva | Explicação de herança, exceções e simulação de usuário |
| SCR-069 | `/administration/teams` | Equipes | Membros, liderança, produtos e acesso |
| SCR-070 | `/administration/departments` | Setores/departamentos | Hierarquia, responsáveis e políticas |
| SCR-071 | `/administration/units` | Unidades | Estrutura física/lógica, tenants e responsáveis |
| SCR-072 | `/administration/invitations` | Convites | Estado, validade, reenvio, revogação e auditoria |
| SCR-073 | `/administration/sessions` | Sessões | Dispositivos, expiração e revogação |
| SCR-074 | `/administration/temporary-access` | Acesso temporário | Escopo, justificativa, aprovação e expiração |
| SCR-075 | `/administration/break-glass` | Break glass | Acesso emergencial, dupla confirmação e revisão posterior |

## Governança de telas, módulos e configurações

| ID | Rota sugerida | Tela | Entrega funcional |
|---|---|---|---|
| SCR-080 | `/experience/screens` | Screen Registry | Produtos, módulos, telas, abas, widgets e ações declaradas |
| SCR-081 | `/experience/modules` | Módulos | Ativação por produto, plano, tenant e perfil |
| SCR-082 | `/experience/policies` | Políticas de experiência | Herança produto → segmento → tenant → grupo → usuário |
| SCR-083 | `/experience/preview` | Preview de acesso/experiência | Simular menu, tela, widget e ação para um usuário/contexto |
| SCR-084 | `/experience/feature-flags` | Feature flags | Ambiente, vigência, rollout, owner, risco e rollback |
| SCR-085 | `/settings` | Central de configurações | Catálogo por produto/ambiente/tenant com busca e histórico |
| SCR-086 | `/settings/:key` | Detalhe da configuração | Valor mascarado, origem, schema, diff, aprovação e versões |
| SCR-087 | `/settings/branding` | Branding | Marca, textos, contatos e temas por escopo |
| SCR-088 | `/settings/notifications` | Preferências e canais | E-mail, push, webhook, regras, silêncio e escalonamento |
| SCR-089 | `/settings/templates` | Templates | E-mails, mensagens, documentos e versões |

## Importação, exportação e formulários

| ID | Rota sugerida | Tela | Entrega funcional |
|---|---|---|---|
| SCR-090 | `/data/imports` | Histórico de importações | Lotes, produto, tenant, estado, ator, resultado e reprocessamento |
| SCR-091 | `/data/imports/new` | Nova importação | Upload, aba, preview, mapeamento, validação e confirmação |
| SCR-092 | `/data/imports/:id/transform` | Bancada Power Query | Grade editável, tipos, colunas, filtros, regras e desfazer/refazer |
| SCR-093 | `/data/imports/:id/validation` | Validação e dry run | Criações, atualizações, conflitos, duplicados e rejeições |
| SCR-094 | `/data/imports/:id/result` | Resultado | Progresso, resultado por linha, erros, rejeitados e retry |
| SCR-095 | `/data/recipes` | Receitas de transformação | Versão, produto, schema, teste, publicação e histórico |
| SCR-096 | `/data/exports` | Exportações | Escopo, filtros, autorização, formato, jobs e downloads |
| SCR-097 | `/forms` | Catálogo de formulários | Produto, tenant, versão, vigência e estado |
| SCR-098 | `/forms/new` | Construtor de formulário | Campos, validações, condições, preview e acessibilidade |
| SCR-099 | `/forms/:id/responses` | Respostas | Busca, exportação, retenção e autorização |

## Integrações, operações e confiabilidade

| ID | Rota sugerida | Tela | Entrega funcional |
|---|---|---|---|
| SCR-100 | `/integrations` | Integration Center | Produtos, conectores, estado, ambiente e alertas |
| SCR-101 | `/integrations/:id` | Integração 360 | Endpoint, versão, scopes, webhooks, tentativas e auditoria |
| SCR-102 | `/integrations/:id/test` | Test Connection | DNS, TLS, auth, versão, capabilities e permissões |
| SCR-103 | `/operations` | Operations Center | Visão global de serviços, filas, jobs, deploys e comandos |
| SCR-104 | `/operations/jobs` | Jobs | Estado, progresso, custo, retry, cancelamento e DLQ |
| SCR-105 | `/operations/commands` | Admin Commands | Rascunho, validação, confirmação, execução e resultado |
| SCR-106 | `/operations/releases` | Release Health | Versão, erros, performance, canário e rollback |
| SCR-107 | `/operations/maintenance` | Manutenção | Janelas, comunicação, serviços e responsáveis |
| SCR-108 | `/health` | Health Center | Produtos/serviços online, degraded, unavailable e stale |
| SCR-109 | `/errors` | Error Center | Fingerprints, severidade, frequência, impacto e deploy relacionado |
| SCR-110 | `/errors/:id` | Detalhe do erro | Evidências saneadas, correlação, eventos, hipótese e vínculo com incidente |
| SCR-111 | `/incidents` | Incidentes | Estado, severidade, impacto, owner, SLA e timeline |
| SCR-112 | `/incidents/:id` | Incidente 360 | Eventos, comunicação, ações, evidências e resolução |
| SCR-113 | `/problems` | Problemas | Recorrência, causa raiz, workaround, correção e prevenção |
| SCR-114 | `/known-errors` | Known Error Database | Sintoma, causa, workaround, versão e status |
| SCR-115 | `/reliability` | Reliability | SLO/SLA, taxa de erro, recorrência, MTTR e tendências |

## IA e resolução segura

| ID | Rota sugerida | Tela | Entrega funcional |
|---|---|---|---|
| SCR-120 | `/resolution` | Centro de Resolução | Fila de diagnósticos, confiança, risco, estado e responsável |
| SCR-121 | `/resolution/:id/evidence` | Evidências | Logs saneados, métricas, mudanças, testes e incidentes semelhantes |
| SCR-122 | `/resolution/:id/proposal` | Proposta da IA | Hipótese, limites, diff/plano, testes e rollback |
| SCR-123 | `/resolution/:id/validation` | Validação | Sandbox, testes, security scan e regressão |
| SCR-124 | `/resolution/:id/approval` | Aprovação | Risco, impacto, aprovadores, confirmação e segregação |
| SCR-125 | `/resolution/:id/rollout` | Canário e monitoramento | Progresso, métricas, critérios de aborto e rollback |
| SCR-126 | `/ai/governance` | Governança de IA | Provedores, modelos, tarefas, quotas, políticas e dados permitidos |
| SCR-127 | `/ai/usage` | Uso e custos de IA | Produto, tenant, modelo, tarefa, tokens/minutos e orçamento |
| SCR-128 | `/ai/audit` | Auditoria de IA | Entrada saneada, ferramenta, decisão, aprovação e resultado |

## Planos, uso, custos e negócio

| ID | Rota sugerida | Tela | Entrega funcional |
|---|---|---|---|
| SCR-130 | `/commercial/products` | Catálogo comercial | Produtos, disponibilidade, ownership e formas de venda |
| SCR-131 | `/commercial/plans` | Planos | Preço, vigência, limites, módulos e addons |
| SCR-132 | `/commercial/entitlements` | Entitlements | Direitos contratados por tenant/produto |
| SCR-133 | `/commercial/subscriptions` | Assinaturas | Estado, vigência, alteração, suspensão e histórico |
| SCR-134 | `/usage` | Usage global | Métricas por produto, tenant e capacidade |
| SCR-135 | `/costs` | FinOps | Custos, rateio, orçamento, anomalias e tendência |
| SCR-136 | `/costs/products/:id` | Custo por produto | Shared/dedicated, infraestrutura, IA, storage e jobs |
| SCR-137 | `/costs/tenants/:id` | Custo por tenant | Consumo, rateio, margem e alertas |
| SCR-138 | `/business-metrics` | Métricas de negócio | MRR, clientes, ativação, retenção e definições |

## Segurança, auditoria e LGPD

| ID | Rota sugerida | Tela | Entrega funcional |
|---|---|---|---|
| SCR-140 | `/security` | Security Center | Riscos, sessões, privilégios, vulnerabilidades e alertas |
| SCR-141 | `/security/secrets` | Inventário de secrets | Referência, owner, rotação e validade; nunca mostrar valor |
| SCR-142 | `/security/access-reviews` | Revisões de acesso | Campanhas, decisões, revogações e evidências |
| SCR-143 | `/audit` | Auditoria global | Filtros, correlação, ator, recurso, resultado e exportação |
| SCR-144 | `/privacy/data-inventory` | Inventário de dados | Classificação, finalidade, base legal, localização e retenção |
| SCR-145 | `/privacy/requests` | Solicitações LGPD | Acesso, correção, portabilidade, anonimização e eliminação |
| SCR-146 | `/privacy/retention` | Políticas de retenção | Escopo, prazo, exceção, execução e evidência |

## Backup, continuidade e portabilidade

| ID | Rota sugerida | Tela | Entrega funcional |
|---|---|---|---|
| SCR-150 | `/continuity/backups` | Backups | Produto, ambiente, último backup, integridade e retenção |
| SCR-151 | `/continuity/restores` | Restore tests | Execuções, duração, resultado, RPO/RTO e evidências |
| SCR-152 | `/continuity/disaster-recovery` | Disaster Recovery | Planos, responsáveis, exercícios e lacunas |
| SCR-153 | `/portability` | Portabilidade | Produtos, score, dependências e estado do pacote |
| SCR-154 | `/portability/:saasId/package` | Pacote de portabilidade | Banco, storage, domínio, serviços, owners e checksums |
| SCR-155 | `/portability/:saasId/detachment` | Detachment test | Prova de independência, falhas e plano de separação |
| SCR-156 | `/transfers` | Transferências | Propriedade, checklist, aprovações e revogação de acessos |

## Documentação e suporte operacional

| ID | Rota sugerida | Tela | Entrega funcional |
|---|---|---|---|
| SCR-160 | `/docs` | Central de documentação | Produtos, contratos, versões, runbooks, ADRs e busca |
| SCR-161 | `/docs/apis` | APIs | Endpoints, schemas, exemplos seguros e compatibilidade |
| SCR-162 | `/docs/events` | Eventos e webhooks | Catálogo, payloads, versionamento e retry |
| SCR-163 | `/docs/commands` | Admin Commands | Ações, riscos, scopes, estados e resultados |
| SCR-164 | `/docs/runbooks` | Runbooks | Diagnóstico, operação, incidentes, rollback e responsáveis |
| SCR-165 | `/implementation` | Cobertura de implementação | Requisito → tela → API → teste → evidência → versão |

## Ordem prática de criação das telas

1. Concluir as telas existentes de Login, Home, SaaS List e SaaS Detail com APIs reais.
2. Criar Administração: visão geral, usuários, usuário 360, acessos por função, perfis e permissões.
3. Completar SaaS 360: ambientes, capabilities, services, readiness e integrations.
4. Criar Tenant 360 e seus vínculos.
5. Implementar Integration/Operations/Health Center.
6. Implementar imports, Power Query, exportações e formulários.
7. Implementar Error Center, incidentes, problemas e Resolution Center seguro.
8. Implementar governança de telas/configurações, busca e command palette.
9. Implementar planos, entitlements, usage, custos e métricas.
10. Implementar LGPD, backups, portabilidade e detachment.

## Critério para marcar uma tela concluída

- [ ] rota acessível e navegação integrada;
- [ ] layout existente preservado/melhorado quando aplicável;
- [ ] dados reais carregados por API;
- [ ] botões executam a ação prometida;
- [ ] persistência e migration verificadas;
- [ ] autorização e tenant testados no backend;
- [ ] auditoria/correlação presentes;
- [ ] estados loading, vazio, erro, sem permissão e indisponível;
- [ ] responsividade, teclado e acessibilidade básica;
- [ ] testes automatizados relevantes;
- [ ] jornada manual validada;
- [ ] documentação e status atualizados.
