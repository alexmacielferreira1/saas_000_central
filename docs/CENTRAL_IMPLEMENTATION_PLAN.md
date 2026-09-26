# Plano de implementação da Central

Este plano inicia a reconstrução da `000_central` sem alterar o frontend histórico às cegas. Cada fase só avança quando seus critérios de aceite e testes estiverem comprovados. A Central reutiliza padrões de infraestrutura do HUB, mas mantém domínio, banco, repositório e deploy independentes.

## Estado de partida — 22/09/2026

- Backend local: FastAPI, configuração por ambiente, PostgreSQL/Alembic, health/version/readiness, correlação e erros públicos.
- Testes do backend: 22 aprovados na revalidação atual.
- Frontend histórico: lint, typecheck e build aprovados; bundle de produção gerado com aviso de dependência Base44 e tamanho elevado.
- Proteção inicial criada: Vitest, ambiente DOM, relatório de cobertura e 3 testes do contrato de rotas.
- Baseline de cobertura do export: 4,05% statements, 0,18% branches, 0,27% functions e 4,42% lines. Ainda está muito distante da meta de 100%.
- Bloqueio: login, dados e operações do frontend ainda dependem do Base44; não há paridade funcional local comprovada.
- Publicação: não há remote Git nem alvos GitHub/Render/Neon confirmados para a Central.

## C0 — Baseline e proteção contra regressão

Objetivo: tornar a base mensurável antes da substituição do Base44.

Entregas:

1. ampliar o runner já instalado com testes de inicialização, autenticação, navegação e componentes críticos;
2. manter inventário das rotas, páginas, entidades, funções e dependências Base44;
3. registrar screenshots e jornadas críticas do frontend original;
4. criar gate único para backend, frontend, migrations e integridade do original;
5. separar claramente mocks/demo de integrações reais.

Aceite:

- `test`, `test:coverage`, `lint`, `typecheck` e `build` do frontend passam;
- testes do backend e migrations passam;
- nenhum arquivo do baseline original muda sem registro explícito;
- warnings conhecidos ficam documentados e não são confundidos com sucesso funcional.

## C1 — Identidade, sessão e tenancy

Objetivo: substituir autenticação Base44 pelo padrão comum do HUB.

Entregas:

1. usuários, tenants, memberships, grupos, permissões e auditoria;
2. login demo local preservado fora de produção;
3. Google OAuth opcional por ambiente, com callback próprio da Central;
4. sessão segura por cookie, CORS/origens explícitas, expiração e logout;
5. bootstrap idempotente do superadmin configurado por ambiente;
6. isolamento de tenant em todos os repositórios e endpoints.

Aceite:

- usuário sem membership não acessa tenant;
- permissão é negada por padrão;
- Google OAuth desabilitado retorna erro público seguro e habilitado conclui login;
- segredos não aparecem em logs, respostas ou repositório;
- testes de autorização, sessão, CSRF/CORS, enumeração e isolamento passam.

## C2 — Registry de SaaS e ambientes

Objetivo: permitir que a Central conheça produtos sem acessar seus bancos internos.

Entregas:

1. cadastro de SaaS, versões, ambientes e responsáveis;
2. catálogo de capabilities e compatibilidade de contrato;
3. credenciais/referências externas protegidas por ambiente;
4. painel de estado ONLINE, DEGRADED, UNAVAILABLE e incompatível;
5. Tenant 360 com vínculos e entitlements, sem copiar dados operacionais privados.

Aceite:

- produtos podem evoluir e ficar indisponíveis independentemente;
- timeout ou resposta inválida de um SaaS não derruba a Central;
- credenciais são mascaradas e auditadas;
- connector possui doubles e testes de contrato para todos os estados.

## C3 — Contrato Central ↔ SaaS

Objetivo: padronizar observabilidade e comandos autorizados.

Entregas:

1. contrato versionado para health, readiness, versão e capabilities;
2. propagação de `correlation_id`, produto e tenant;
3. eventos com idempotência, ordenação conhecida e tratamento de duplicidade;
4. comandos administrativos com escopo, motivo, confirmação e auditoria;
5. histórico de execuções, falhas, tentativas e rollback quando suportado.

Aceite:

- incompatibilidade aparece como estado, nunca como sucesso falso;
- comando repetido não executa duas vezes;
- falha parcial é recuperável e observável;
- nenhuma ação destrutiva ocorre sem autorização e registro.

## C4 — Import Engine

Objetivo: oferecer importação reutilizável de Excel/CSV para os SaaS.

Entregas:

1. upload seguro e validação de arquivo;
2. preview, mapeamento de colunas e regras por produto;
3. validação em lote com erros por linha;
4. execução idempotente e retomável;
5. histórico, auditoria, exportação de erros e rollback quando possível.

Aceite:

- arquivo malicioso, excessivo ou inválido é rejeitado com segurança;
- preview não grava dados;
- reenvio do mesmo lote não duplica registros;
- isolamento de tenant e autorização são testados.

## C5 — Mídias, formulários e busca compartilhável

Objetivo: disponibilizar capacidades transversais sem impor domínio audiovisual a todos os produtos.

Entregas:

1. contrato opcional para mídia em lote e metadados;
2. formulários configuráveis com esquema versionado;
3. busca por capacidades e referências autorizadas;
4. armazenamento e processamento desacoplados por adapter;
5. quotas, direitos, retenção e trilha de auditoria.

Aceite:

- cada SaaS habilita apenas capabilities pertinentes;
- arquivos e formulários respeitam tenant, permissão, quota e retenção;
- a indisponibilidade do serviço compartilhado degrada com clareza, sem corromper o SaaS.

## C6 — Error Center e diagnóstico por IA

Objetivo: centralizar incidentes sem permitir correções autônomas inseguras.

Entregas:

1. ingestão normalizada de erros e sinais operacionais;
2. agrupamento, prioridade, impacto e histórico;
3. diagnóstico assistido por IA com evidências e grau de confiança;
4. proposta de correção, diff e plano de rollback;
5. aprovação humana obrigatória para alterações;
6. integração opcional com rastreador de issues.

Aceite:

- IA não executa mudança silenciosa;
- dados sensíveis são removidos antes do diagnóstico;
- toda sugestão registra entrada, modelo, decisão e resultado;
- rollback e falhas são exercitados em teste.

## C7 — Cloud e produção

Objetivo: publicar somente uma base homologada.

Pré-condições:

- remote Git, repositório, serviços Render e banco Neon fornecidos ou confirmados;
- variáveis e callbacks definidos por ambiente;
- backup/restauração, migrations, rollback e smoke test documentados;
- suite completa e E2E de staging aprovados.

Aceite:

- deploy não depende de Base44;
- health/readiness e migrations funcionam em staging/produção;
- autenticação e cookies funcionam no domínio real;
- canário pós-publicação detecta regressão sem expor segredos.

## C8 — Governança, lifecycle e FinOps

Objetivo: administrar o portfólio sem transformar a Central em banco operacional dos produtos.

Entregas:

1. lifecycle de produto, serviço, ambiente e tenant;
2. Service Registry, dependências, capabilities e compatibilidade;
3. planos, entitlements, subscriptions e usage por contrato;
4. custos diretos e rateio de infraestrutura, IA, storage e jobs;
5. governança de telas, módulos, configurações e feature flags;
6. classificação LGPD, finalidade, retenção, exportação e eliminação.

Aceite:

- a Central explica origem e vigência de cada configuração;
- custo e consumo são atribuíveis a produto, ambiente e tenant;
- mudança de lifecycle ou entitlement gera evento e auditoria;
- dados operacionais continuam no SaaS proprietário.

## C9 — Portabilidade e recuperação

Objetivo: garantir que cada SaaS possa ser restaurado, migrado, destacado ou transferido.

Entregas:

1. inventário de banco, storage, secrets, domínios, serviços e owners;
2. estado e evidência de backups e restore tests;
3. exportação administrativa por produto/tenant conforme contrato;
4. checklist de detachment e transferência de propriedade;
5. RPO/RTO, disaster recovery e histórico de exercícios.

Aceite:

- a Central não considera backup saudável sem restore testado;
- o detachment test identifica dependências compartilhadas e plano de separação;
- nenhum produto depende do domínio ou banco da Central para operar.

## Ordem executável imediata

1. concluir C0 com testes automatizados do frontend;
2. congelar o contrato visual/rotas de referência;
3. implementar C1 em uma fatia vertical mínima, começando por sessão e tenant;
4. migrar uma tela real do Base44 para a API local e validar ponta a ponta;
5. repetir por módulo antes de iniciar C2.

Não iniciar C4–C9 apenas porque as telas existem no export. Cada módulo exige contrato, persistência, autorização e testes próprios. O plano transversal do portfólio está em `../../_documentacao/PORTFOLIO_IMPLEMENTATION_PLAN.md`.
