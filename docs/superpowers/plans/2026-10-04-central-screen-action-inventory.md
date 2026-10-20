# Central Screen Action Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produzir um inventário comprovado, ação por ação, das rotas `/`, `/saas` e `/saas/:id`, classificando corretamente frontend, backend, persistência, autorização, auditoria e testes.

**Architecture:** Um extrator estático pequeno gera candidatos a partir das três páginas e dos clientes de API; a matriz canônica é conferida manualmente contra rotas, repositórios, modelos e testes do backend. Um validador documental impede `INTEGRADO` ou `VALIDADO` sem evidências obrigatórias. Este plano não conecta lacunas ainda: ele produz a base exata para o plano TDD da primeira integração vertical.

**Tech Stack:** React/Vite/Vitest, FastAPI/Pydantic/SQLAlchemy/Pytest, PowerShell 5.1 para validação documental, Markdown.

**Spec:** `C:\Users\Alex\Desktop\HUB_SAAS\_documentacao\superpowers\specs\2026-10-04-screen-backend-validation-design.md`

## Global Constraints

- Trabalhar somente em `000_central` e documentação do HUB nesta fase.
- Não alterar produção, GitHub, Render, Neon, banco remoto ou secrets.
- Preservar alterações locais preexistentes e registrar `git status` antes/depois.
- Não declarar dado real a partir de nome de função, mensagem visual ou teste mockado.
- Não apagar Base44, fixtures, demos ou legado durante o inventário.
- Não promover M0 nem iniciar C1–C9 neste plano.
- Qualquer implementação funcional descoberta vira plano posterior, após a matriz indicar a menor lacuna vertical.

## Review Focus

- Botão que apenas abre modal/navega deve ser classificado separadamente da mutação executada no modal.
- Resposta de API sem persistência ou tenant enforcement não pode receber `INTEGRADO`.
- Teste frontend com cliente mockado não comprova endpoint, banco ou auditoria.
- Fallback de indisponibilidade não pode apresentar número demonstrativo como métrica real.
- Ação sem permissão backend explícita deve ficar `PARCIAL` ou `BLOQUEADO`, mesmo que a UI esconda o botão.

---

### Task 1: Congelar baseline e contrato da matriz

**Files:**
- Create: `docs/SCREEN_ACTION_BACKEND_MATRIX.md`
- Create: `scripts/validate-screen-action-matrix.ps1`
- Create: `tests/docs/test-screen-action-matrix.ps1`

**Interfaces:**
- Consumes: campos e estados definidos na especificação.
- Produces: matriz Markdown com uma linha por ação e validador executável.

- [ ] **Step 1: Registrar baseline sem modificar o índice Git**

Salvar em `.runtime/checks/screen-actions/git-status-before.txt` a saída de `git status --porcelain`; registrar hash de `Home.jsx`, `SaasList.jsx` e `SaasDetail.jsx`.

- [ ] **Step 2: Escrever teste documental inicialmente falho**

O teste deve exigir as três rotas, todos os campos canônicos, somente estados permitidos e evidência não vazia para linhas `INTEGRADO`/`VALIDADO`.

- [ ] **Step 3: Executar e confirmar RED**

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests\docs\test-screen-action-matrix.ps1`

Expected: FAIL porque matriz e validador ainda não existem.

- [ ] **Step 4: Criar matriz vazia versionada e validador mínimo**

`validate-screen-action-matrix.ps1 -Path <string>` deve retornar erro por coluna/linha ausente e aceitar apenas os nove estados canônicos da especificação.

- [ ] **Step 5: Executar e confirmar GREEN para o contrato vazio controlado**

Expected: PASS com as três seções de rota presentes e nenhuma alegação funcional sem evidência.

### Task 2: Inventariar a Home `/`

**Files:**
- Modify: `docs/SCREEN_ACTION_BACKEND_MATRIX.md`
- Modify: `docs/FRONTEND_ROUTE_JOURNEY_INVENTORY.md`
- Test: `tests/docs/test-screen-action-matrix.ps1`

**Interfaces:**
- Consumes: `frontend/src/pages/Home.jsx`, `frontend/src/api/home.js`, `frontend/src/api/saasRegistry.js`, `backend/app/api/v1/home.py`, rotas/repositórios/modelos/testes alcançados.
- Produces: linhas verificadas de KPIs, lista de SaaS, navegação dos cards, estados loading/vazio/erro e origem de cada valor.

- [ ] **Step 1: Adicionar ao teste expectativas literais das ações visíveis da Home**

Cobrir quatro KPIs clicáveis, lista/abertura de produto, “ver todos”, loading, vazio e erro; o teste deve falhar enquanto faltarem linhas.

- [ ] **Step 2: Executar e confirmar RED**

- [ ] **Step 3: Rastrear cada ação até cliente e backend**

Para cada linha, registrar arquivo/linha, endpoint, origem persistente, tenant, autorização, auditoria e tipo de teste. Métrica indisponível deve permanecer indisponível, nunca demo silenciosa.

- [ ] **Step 4: Classificar as linhas e atualizar o inventário de jornadas**

Usar `PARCIAL` quando a API existir mas faltar alguma prova de persistência/autorização/estado; usar `VALIDADO` somente quando todos os critérios estiverem apontados.

- [ ] **Step 5: Executar teste documental e testes existentes da Home**

Run: `npm test -- --run src/pages/Home.test.jsx` em `frontend` quando o arquivo existir; caso contrário registrar explicitamente a ausência e manter as ações sem `VALIDADO`.

### Task 3: Inventariar a lista `/saas`

**Files:**
- Modify: `docs/SCREEN_ACTION_BACKEND_MATRIX.md`
- Modify: `docs/FRONTEND_ROUTE_JOURNEY_INVENTORY.md`
- Test: `tests/docs/test-screen-action-matrix.ps1`

**Interfaces:**
- Consumes: `SaasList.jsx`, `NewSaasDialog.jsx`, `api/saasRegistry.js`, `api/v1/saas.py`, schemas, repository, models and `test_saas_registry_api.py`.
- Produces: linhas de listar, buscar, filtrar por URL, abrir detalhe, abrir criação, submeter criação e estados de resposta.

- [ ] **Step 1: Ampliar o teste com as ações obrigatórias da lista e confirmar RED**

- [ ] **Step 2: Rastrear leitura, filtros e navegação sem confundir efeito local com backend**

- [ ] **Step 3: Rastrear criação até commit, auditoria, permissão e isolamento tenant**

- [ ] **Step 4: Registrar loading, vazio, erro, sucesso e proibido por ação**

- [ ] **Step 5: Executar o validador, testes frontend do diálogo/lista existentes e `pytest backend/tests/test_saas_registry_api.py`**

Expected: testes existentes passam ou a falha é registrada como bloqueio sem reclassificação otimista.

### Task 4: Inventariar o detalhe `/saas/:id`

**Files:**
- Modify: `docs/SCREEN_ACTION_BACKEND_MATRIX.md`
- Modify: `docs/FRONTEND_ROUTE_JOURNEY_INVENTORY.md`
- Test: `tests/docs/test-screen-action-matrix.ps1`

**Interfaces:**
- Consumes: `SaasDetail.jsx`, `EditSaasDialog.jsx`, `EditManifestDialog.jsx`, `NewProductUserDialog.jsx`, APIs de registry/operations e respectivas rotas/modelos/testes backend.
- Produces: linhas por aba e por ação de leitura/edição, manifest, usuários, configurações e operações.

- [ ] **Step 1: Ampliar teste com abas e ações observáveis; confirmar RED**

- [ ] **Step 2: Separar troca de aba/modal das mutações persistentes**

- [ ] **Step 3: Rastrear edição do SaaS e manifest até persistência, autorização e auditoria**

- [ ] **Step 4: Rastrear usuários, configurações e operações, incluindo ausências funcionais**

- [ ] **Step 5: Executar validador, testes frontend dos diálogos e testes backend direcionados**

Run: `pytest backend/tests/test_saas_registry_api.py` e testes específicos de operações/configurações usados pelas linhas.

### Task 5: Revisão cruzada e seleção da primeira lacuna vertical

**Files:**
- Modify: `docs/SCREEN_ACTION_BACKEND_MATRIX.md`
- Modify: `docs/FRONTEND_ROUTE_JOURNEY_INVENTORY.md`
- Create: `docs/SCREEN_ACTION_FIRST_GAP.md`

**Interfaces:**
- Consumes: matriz completa das Tasks 2–4.
- Produces: uma única lacuna priorizada com fronteiras exatas para o próximo plano TDD.

- [ ] **Step 1: Escrever teste que rejeita resumo sem contagens por estado e sem uma lacuna priorizada**

- [ ] **Step 2: Executar e confirmar RED**

- [ ] **Step 3: Revisar cada linha `INTEGRADO`/`VALIDADO` contra evidência executável**

Rebaixar qualquer linha sustentada apenas por mock, documento, UI ou nome de função.

- [ ] **Step 4: Selecionar uma lacuna P0/P1 pequena**

O documento deve indicar componente, cliente frontend, endpoint atual/ausente, modelo/persistência, permissão, auditoria e testes que precisarão falhar primeiro. Não implementar a lacuna neste plano.

- [ ] **Step 5: Executar validação final e suítes existentes relevantes**

Run: validador documental, testes frontend direcionados, `pytest backend/tests/test_saas_registry_api.py` e gate de documentação aplicável.

- [ ] **Step 6: Comparar baseline Git e registrar apenas arquivos tocados por este plano**

Não limpar nem incorporar alterações preexistentes. Registrar diferenças em `.runtime/checks/screen-actions/git-status-after.txt`.

### Task 6: Preparar o próximo plano de integração

**Files:**
- Create: `docs/superpowers/specs/<data>-<acao>-backend-integration-design.md`

**Interfaces:**
- Consumes: `docs/SCREEN_ACTION_FIRST_GAP.md` aprovado.
- Produces: desenho limitado a uma única fatia vertical, pronto para novo plano TDD.

- [ ] **Step 1: Escrever o desenho da lacuna sem alterar código funcional**

- [ ] **Step 2: Conferir contrato, persistência, autorização, auditoria, UX de erro e evidências**

- [ ] **Step 3: Submeter o desenho ao usuário antes da implementação funcional**

