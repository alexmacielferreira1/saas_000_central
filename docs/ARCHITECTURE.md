# Arquitetura da Central SaaS

A Central é o plano de controle administrativo do HUB. Cada produto permanece independente, com repositório, backend, frontend, configuração, banco, storage, migrations e regras de negócio próprios. A Central só se comunica com os produtos por contratos de API e eventos versionados; não importa código nem acessa diretamente bancos de outro SaaS.

## Base técnica implementada

O backend usa FastAPI com app factory, Pydantic Settings, SQLAlchemy 2, PostgreSQL 16 e Alembic. As revisões atuais são:

- `0001_bootstrap`: estabelece o histórico inicial;
- `0002_identity_auth`: cria `users`, `tenants`, `memberships` e `auth_sessions`;
- `0003_saas_registry`: cria `saas_products` e o registro inicial dos produtos do ecossistema.
- `0004_audit_logs`: cria a trilha append-only por tenant, ator, recurso e correlação.

As rotas operacionais `/health`, `/version` e `/ready` cobrem liveness, versão e conexão com o banco. Toda requisição recebe correlation/request ID validado ou gerado. Erros públicos usam código, mensagem segura, referência pública, correlation ID e indicação de retry; logs estruturados não registram corpo, query, credenciais ou texto bruto de exceções.

## Identidade, sessão e tenancy

A autenticação nativa por e-mail e senha está disponível em `/api/v1/auth/login`, com senha armazenada somente como hash. A sessão é opaca, persistida em `auth_sessions` e transportada por cookie HttpOnly. `/api/v1/auth/session` restaura a identidade e memberships; `/api/v1/auth/logout` revoga a sessão.

O Google OAuth é opcional e usa `/api/v1/auth/google/start` e `/api/v1/auth/google/callback`. Sem credenciais configuradas, a API retorna erro público controlado; não há segredo versionado. A política atual só permite associar identidade Google a usuário previamente cadastrado.

`User`, `Tenant` e `Membership` existem, porém a seleção explícita de tenant, isolamento completo em todos os repositórios e permissões granulares ainda pertencem à C1. A primeira trilha persistente de auditoria foi conectada às mutações do catálogo de SaaS; login, acesso, configurações e comandos ainda precisam aderir ao mesmo contrato. Os papéis atuais são uma proteção transitória e não substituem o RBAC/ABAC planejado.

## Registro de produtos e acessos administrativos

`SaasProduct` é a fonte local inicial do catálogo da Central. `/api/v1/saas` lista e cria produtos; `/api/v1/saas/{product_id}` lê e atualiza parcialmente os dados principais com `PATCH`. Todas as rotas exigem sessão; criação e atualização exigem membership ativa com papel `admin` ou `superadmin`, respeitam o tenant selecionado e rejeitam conflito de slug. Essas mutações gravam `AuditLog` na mesma transação, com snapshot saneado, ator e correlation ID. `GET /api/v1/audit` restringe a leitura da trilha ao escopo selecionado e aos papéis administrativos. `GET /api/v1/home/summary` agrega os KPIs do catálogo somente para o tenant selecionado e nega memberships inativas. Operações e incidentes são declarados como indisponíveis nesse contrato até seus módulos nativos existirem, evitando apresentar falha de integração como contagem zero. O catálogo alimenta Home, SaaS 360/lista, Guias das APIs, detalhe e Integrações & Saúde. Conectores reais, manifests, capabilities, ambientes e health remoto ainda não foram implementados.

`/api/v1/access/managers` lista e cadastra administradores vinculados à Central. A interface de Usuários & Acesso já consome esse contrato. A matriz completa de pessoas, perfis, funções, permissões, equipes e exceções permanece pendente.

## Frontend e migração do Base44

O frontend mantém o layout React/Vite do export histórico. Login, sessão, logout, Home para KPIs de produtos, registro/listagem/detalhe de SaaS, administradores e Auditoria já foram migrados para a API local. A Home não consulta mais entidades Base44 e informa explicitamente quando operações e incidentes ainda estão indisponíveis. As demais páginas continuam total ou parcialmente dependentes do SDK Base44, mocks ou dados estáticos. O SDK não será removido em bloco: cada jornada será substituída por uma fatia vertical com API, persistência, autorização, testes e evidência visual.

A tag `base44-export`, `docs/history/base44-manifest.json` e `docs/history/frontend-approved-changes.json` preservam o baseline e registram as alterações aprovadas. O gate falha quando um arquivo original muda sem classificação.

## Limites atuais

Ainda não existem RBAC/ABAC definitivo, auditoria completa de todos os domínios, outbox, idempotência geral, conectores Admin API, jobs assíncronos, Error Center, Import Engine ou contratos remotos completos. M0 permanece bloqueado até haver paridade funcional suficiente, classificação das dependências restantes e jornadas críticas cobertas. Nenhum estado local comprova publicação ou prontidão de produção.

Shared packages só serão extraídos depois de uma capacidade ser validada em pelo menos dois produtos. Regras audiovisuais do MediaMind não pertencem à Central.
