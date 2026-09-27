# Central ↔ MediaMind Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a primeira ponte real e segura do HUB, permitindo que a Central descubra e monitore o MediaMind e envie um comando dry-run idempotente com resultado auditável nos dois produtos.

**Architecture:** O MediaMind expõe um adaptador Admin API independente com manifesto, saúde, prontidão, versão e executor local. A Central persiste conexão, ambiente, observações e comandos, consulta o adaptador por HTTP com identidade de serviço e distingue aceitação, execução e resultado. Os bancos e deploys permanecem independentes.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL 16/Neon, Pydantic, httpx, React 18/Vite, Vitest, pytest.

**Spec:** `docs/superpowers/specs/2026-09-27-central-universal-control-bridge-design.md`

## Global Constraints

- Nunca acessar diretamente banco, storage ou código interno de outro SaaS em runtime.
- Cada SaaS continua operacional quando a Central estiver indisponível.
- Nenhuma informação demonstrativa pode aparecer como saúde real.
- `HTTP 202` significa apenas aceitação; conclusão exige estado terminal confirmado.
- Autenticação serviço-a-serviço usa segredo de ambiente, audience/scopes e comparação segura; nenhum segredo vai ao navegador, banco de auditoria ou Git.
- Toda chamada propaga `X-Correlation-ID`; comandos exigem `Idempotency-Key`.
- A primeira allowlist contém somente `system.describe` e `media.count` em dry-run; nenhuma mutação de produção entra nesta entrega.
- UI em português simples; `tenant` aparece como `Cliente/organização`.
- Cards, linhas, alertas e indicadores operacionais não podem ser meros atalhos: o primeiro clique expande um painel contextual na própria tela, faz rolagem suave até ele e oferece a ação segura cabível ali mesmo. Navegação para uma página especializada permanece como opção secundária.
- Nenhuma ação contextual pode esconder origem, ambiente, horário, permissão, impacto, confirmação ou resultado. O painel deve preservar o contexto de onde o usuário partiu e permitir recolher/voltar sem perder filtros.
- Produção só é alterada depois de testes locais, homologação e checagem explícita dos destinos.

## Review Focus

- MediaMind offline: a Central registra `unavailable`, mantém o último dado e não quebra a Home.
- Resposta atrasada: observação expirada aparece `stale`, nunca `healthy` por cache antigo.
- Token/audience inválido: MediaMind retorna 401/403 seguro e não cria comando.
- Reenvio com a mesma idempotency key: retorna o mesmo comando e não repete efeito.
- Resposta fora de ordem: atualização antiga não regride um comando terminal.

---

### Task 1: Contrato Admin API no MediaMind

**Files:**
- Create: `C:/Users/Alex/Desktop/HUB_SAAS/001_mediamindai/backend/app/admin_api/schemas.py`
- Create: `C:/Users/Alex/Desktop/HUB_SAAS/001_mediamindai/backend/app/admin_api/auth.py`
- Create: `C:/Users/Alex/Desktop/HUB_SAAS/001_mediamindai/backend/app/api/v1/hub_admin.py`
- Modify: `C:/Users/Alex/Desktop/HUB_SAAS/001_mediamindai/backend/app/core/config.py`
- Modify: `C:/Users/Alex/Desktop/HUB_SAAS/001_mediamindai/backend/app/main.py`
- Test: `C:/Users/Alex/Desktop/HUB_SAAS/001_mediamindai/backend/tests/test_hub_admin_api.py`

**Interfaces:**
- Produces: `GET /.well-known/hub/manifest`, `GET /api/hub/v1/health`, `GET /api/hub/v1/readiness`, `GET /api/hub/v1/version`.
- Produces: `require_hub_service(request: Request, authorization: str) -> HubServiceIdentity`.

- [ ] **Step 1: Write failing contract tests** for public manifest shape; authenticated health/readiness/version; missing token 401; wrong audience/scope 403; no secret in response.
- [ ] **Step 2: Run** `pytest backend/tests/test_hub_admin_api.py -v` and confirm failures are missing routes/auth.
- [ ] **Step 3: Add settings** `HUB_ADMIN_TOKEN`, `HUB_ADMIN_AUDIENCE=central`, `HUB_PRODUCT_ID=mediamind-ai`, with production validation but no default secret.
- [ ] **Step 4: Implement schemas and auth** using constant-time token comparison and required `hub:observe` scope.
- [ ] **Step 5: Implement endpoints** with exact source, environment, observed_at, API/product versions and capability URLs.
- [ ] **Step 6: Run targeted and full MediaMind backend tests**; expected PASS.
- [ ] **Step 7: Update MediaMind architecture/status/handoff and commit** `feat(hub): expose authenticated admin manifest and health`.

### Task 2: Inbox e executor dry-run no MediaMind

**Files:**
- Create: `C:/Users/Alex/Desktop/HUB_SAAS/001_mediamindai/backend/app/models/hub_command.py`
- Create: `C:/Users/Alex/Desktop/HUB_SAAS/001_mediamindai/backend/app/admin_api/commands.py`
- Create: `C:/Users/Alex/Desktop/HUB_SAAS/001_mediamindai/alembic/versions/0007_hub_commands.py`
- Modify: `C:/Users/Alex/Desktop/HUB_SAAS/001_mediamindai/backend/app/api/v1/hub_admin.py`
- Test: `C:/Users/Alex/Desktop/HUB_SAAS/001_mediamindai/backend/tests/test_hub_commands_api.py`

**Interfaces:**
- Consumes: `require_hub_service` from Task 1 with scope `hub:command`.
- Produces: `POST /api/hub/v1/commands`, `GET /api/hub/v1/commands/{id}`.
- Produces: persisted `HubCommand` unique on `(source_service, idempotency_key)`.

- [ ] **Step 1: Write failing tests** for `system.describe`, `media.count`, unsupported action 422, non-dry-run 409, duplicate idempotency returning the same ID, and token failure creating no row.
- [ ] **Step 2: Run targeted tests** and verify missing model/routes.
- [ ] **Step 3: Add migration/model** with envelope, status, result JSON, correlation ID, timestamps and unique idempotency constraint.
- [ ] **Step 4: Implement allowlisted executor** returning only sane aggregate information; both initial actions finish as `succeeded` locally.
- [ ] **Step 5: Implement POST/GET** returning 202 for new acceptance and 200 for idempotent replay.
- [ ] **Step 6: Apply migration locally and run integration/full tests**.
- [ ] **Step 7: Update docs and commit** `feat(hub): add idempotent dry-run command inbox`.

### Task 3: Conexões, ambientes e observações na Central

**Files:**
- Create: `backend/app/models/integration.py`
- Create: `backend/app/schemas/integration.py`
- Create: `backend/app/api/v1/integrations.py`
- Create: `alembic/versions/0010_integration_observations.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/api/v1/router.py`
- Modify: `alembic/env.py`
- Test: `backend/tests/test_integrations_api.py`
- Test: `tests/integration/test_database.py`

**Interfaces:**
- Produces: `SaasConnection`, `SaasEnvironment`, `IntegrationObservation` tenant-scoped models.
- Produces: `GET/POST /api/v1/integrations/connections` and `GET /api/v1/integrations/observations`.

- [ ] **Step 1: Write failing API tests** for superadmin creation, viewer rejection, tenant isolation, masked credential reference and observation freshness states.
- [ ] **Step 2: Run targeted tests** and verify 404/missing models.
- [ ] **Step 3: Implement migration/models**; persist only a `credential_ref`, never token value.
- [ ] **Step 4: Implement schemas/routes** with explicit product/environment uniqueness and audited mutations.
- [ ] **Step 5: Add freshness function** `classify_observation(observed_at, ttl_seconds, now) -> confirmed|stale` and tests including timezone-naive DB values.
- [ ] **Step 6: Apply migration, update integration expectation and run backend/integration tests**.
- [ ] **Step 7: Commit** `feat(integrations): persist SaaS connections and observations`.

### Task 4: Cliente de conexão e diagnóstico da Central

**Files:**
- Create: `backend/app/integrations/hub_client.py`
- Create: `backend/app/services/integration_probe.py`
- Modify: `backend/app/api/v1/integrations.py`
- Modify: `backend/app/core/config.py`
- Test: `backend/tests/test_integration_probe.py`

**Interfaces:**
- Consumes: `SaasConnection`/`SaasEnvironment` from Task 3.
- Produces: `HubAdminClient.probe(connection, correlation_id) -> ProbeResult`.
- Produces: `POST /api/v1/integrations/connections/{id}/test` with per-stage DNS/TLS/auth/version/capabilities/readiness result.

- [ ] **Step 1: Write tests with `httpx.MockTransport`** for healthy, timeout, 401, incompatible manifest, stale fallback and sanitized provider error.
- [ ] **Step 2: Run targeted tests** and verify missing client/service.
- [ ] **Step 3: Implement HTTP client** with configured timeout, correlation header, bearer token resolved from environment by `credential_ref`, no automatic unsafe retries.
- [ ] **Step 4: Implement probe service** and persist an observation for every attempt, including failure and latency.
- [ ] **Step 5: Implement test-connection endpoint** restricted to administrators and audited.
- [ ] **Step 6: Run tests and manually probe local MediaMind**; verify source/time/environment in API response.
- [ ] **Step 7: Commit** `feat(integrations): add observable connection diagnostics`.

### Task 5: Despacho e reconciliação de comandos na Central

**Files:**
- Modify: `backend/app/models/operation.py`
- Modify: `backend/app/schemas/operation.py`
- Modify: `backend/app/api/v1/operations.py`
- Create: `backend/app/services/command_dispatcher.py`
- Create: `alembic/versions/0011_remote_command_tracking.py`
- Test: `backend/tests/test_command_dispatcher.py`
- Test: `backend/tests/test_operations_api.py`

**Interfaces:**
- Consumes: `HubAdminClient` and connection selected by product/environment.
- Produces: `dispatch_command(operation_id: str) -> AdminOperation` and `refresh_command(operation_id: str) -> AdminOperation`.
- Extends: `AdminOperation` with environment, connection_id, idempotency_key, remote_command_id, remote_status, progress, result and last_checked_at.

- [ ] **Step 1: Write failing lifecycle tests** for approve→dispatch→succeeded, 202 remaining queued, idempotent replay, network failure, and old remote response not regressing terminal state.
- [ ] **Step 2: Run targeted tests** and verify missing dispatcher/columns.
- [ ] **Step 3: Add reversible migration/schema changes** and unique tenant/idempotency constraint.
- [ ] **Step 4: Implement dispatcher/reconciler** with allowed state transitions and sanitized result persistence.
- [ ] **Step 5: Wire approval to dispatch only after commit-safe validation**; keep explicit dry-run restriction for this release.
- [ ] **Step 6: Run local end-to-end Central → MediaMind twice with same key**; verify one MediaMind row and matching correlation IDs.
- [ ] **Step 7: Run full Central tests and commit** `feat(operations): dispatch idempotent MediaMind dry-runs`.

### Task 6: Integração 360 e operação compreensível no frontend

**Files:**
- Create: `frontend/src/api/integrations.js`
- Modify: `frontend/src/pages/Integrations.jsx`
- Modify: `frontend/src/pages/SaasDetail.jsx`
- Modify: `frontend/src/pages/OperationCenter.jsx`
- Create: `frontend/src/components/integrations/ConnectionEvidence.jsx`
- Test: `frontend/src/pages/Integrations.test.jsx`
- Test: `frontend/src/pages/OperationCenter.test.jsx`

**Interfaces:**
- Consumes: Tasks 3–5 endpoints.
- Produces: “Testar conexão”, evidência de fonte/ambiente/horário, estados em português and remote command progress.
- Produces: painéis contextuais expansíveis em Integrações, Detalhe do SaaS e Operações, com rolagem suave, foco acessível, ação imediata e link secundário opcional para a página completa.

- [ ] **Step 1: Write failing UI tests** for confirmed/stale/unavailable/not-integrated, admin-only test button, staged diagnostics, command accepted versus succeeded, Portuguese labels, expansion in place, focus/scroll to the expanded panel and contextual resolution without forced navigation.
- [ ] **Step 2: Run Vitest targeted tests** and confirm expected failures.
- [ ] **Step 3: Implement API client and evidence component** with explicit loading/error/no-permission states.
- [ ] **Step 4: Connect preserved Integrations/SaaS Detail layouts** without redesigning existing working areas; selecting a health item expands its evidence/actions immediately below or beside the source item and scrolls it into view.
- [ ] **Step 5: Extend Operations UI** with environment, progress, remote status, result, approval/retry guidance and inline resolution; never show accepted as completed and never force navigation merely to inspect or resolve.
- [ ] **Step 6: Run frontend tests, lint, typecheck, build and manual authenticated journey**.
- [ ] **Step 7: Update approved frontend hashes and commit** `feat(ui): show verified SaaS connection and command evidence`.

### Task 7: Gate, documentação e homologação da primeira ponte

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/CENTRAL_SCREEN_IMPLEMENTATION_MATRIX.md`
- Modify: `docs/PROJECT_STATUS.md`
- Modify: `project-status.json`
- Modify: `docs/CODEX_BACKLOG.md`
- Modify: `docs/CODEX_HANDOFF.md`
- Modify MediaMind equivalents in `C:/Users/Alex/Desktop/HUB_SAAS/001_mediamindai/docs/`
- Modify: `C:/Users/Alex/Desktop/HUB_SAAS/_documentacao/HUB_PLATFORM_STANDARD.md`

**Interfaces:**
- Consumes: verified evidence from Tasks 1–6.
- Produces: reusable contract definition and next plans for Home/Mapa, IA Resolution and SaaS adapter kit.

- [ ] **Step 1: Run complete gates independently** in Central and MediaMind; expected automatic checks green, manual parity may remain blocked for documented unrelated scope.
- [ ] **Step 2: Execute contract scenarios** healthy, degraded, unavailable, incompatible and auth failed; retain sanitized evidence.
- [ ] **Step 3: Validate restart and migration current** for both PostgreSQL databases.
- [ ] **Step 4: Update docs/status/handoff** with actual counts, limitations, rollback and exact next item.
- [ ] **Step 5: Commit and push each repository independently**; verify GitHub heads match local commits.
- [ ] **Step 6: Prepare, but do not silently perform, production rollout**: environment variables, migration commands, Render services, canary checks and rollback sequence.

## Subsequent Plans

After this bridge passes its acceptance criteria, create and execute three separate plans in this order:

1. `central-operational-home-and-ecosystem-map`: “Meu dia hoje”, capability coverage, provenance, glossary and drill-down contextual expansível sem transformar a Home em catálogo de atalhos.
2. `central-ai-resolution-pipeline`: sanitized log ingestion, fingerprinting, evidence, AI proposal, approval, canary and rollback.
3. `hub-saas-adapter-kit`: schemas, middleware, conformance tests and template integration for every subsequent SaaS.
