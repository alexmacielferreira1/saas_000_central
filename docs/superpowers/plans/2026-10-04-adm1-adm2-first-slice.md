# Adm 1 / Adm 2 First Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar a Central atual em Adm 1 e criar um workspace Adm 2 isolado para evoluções, preservando rotas antigas e exibindo somente dados reais ou indisponibilidade explícita.

**Architecture:** O layout global passa a oferecer um seletor de workspace. Adm 1 funciona como índice das rotas atuais, sem duplicar componentes; Adm 2 possui layout, registry e rotas próprias sob `/adm2`, reutilizando clientes de API existentes. O primeiro lote implementa Minha manhã, Panorama e SaaS/Produtos sem criar backend novo.

**Tech Stack:** React 18, React Router 6, Vite/Vitest, Tailwind, clientes FastAPI existentes.

**Spec:** `C:\Users\Alex\Desktop\HUB_SAAS\000_central\docs\superpowers\specs\2026-10-04-adm1-adm2-promotion-design.md`

## Global Constraints

- Preservar todas as URLs atuais e seus componentes.
- Não apagar, mover ou renomear implementação atual neste lote.
- Não usar Base44, fixtures ou números inventados no Adm 2.
- Reutilizar somente APIs locais existentes; ausência vira `Não integrado`/`Indisponível`.
- Não alterar backend, banco, GitHub, Render, Neon ou produção.
- Criar backup local e registrar `git status --porcelain` antes/depois.
- Não incorporar alterações preexistentes em commit ou limpeza.

## Review Focus

- Link Adm 1 deve apontar para a rota atual correspondente, não para uma cópia incompleta.
- Recarregar uma URL `/adm2/...` deve renderizar a tela correta pelo roteador.
- Falha de API não pode reaparecer como zero ou métrica demonstrativa.
- Troca Adm 1/Adm 2 deve preservar sessão e tenant selecionado.
- Item planejado do registry não pode parecer clicável/funcional sem rota implementada.

---

### Task 1: Baseline, registry e testes de contrato

**Files:**
- Create: `frontend/src/lib/adminWorkspaces.js`
- Create: `frontend/src/lib/adminWorkspaces.test.js`
- Modify: `frontend/src/lib/routes.test.js`

**Interfaces:**
- Produces: `ADM1_ITEMS`, `ADM2_ITEMS`, `ADM2_IMPLEMENTED_ROUTES` e `getWorkspaceForPath(pathname)`.

- [ ] **Step 1: Criar backup e baseline**

Salvar cópias dos arquivos que serão alterados em `.runtime/backups/adm1-adm2-<timestamp>` e registrar status Git em `.runtime/checks/adm1-adm2/git-status-before.txt`.

- [ ] **Step 2: Escrever testes falhos do registry**

Exigir todas as rotas atuais em Adm 1, IDs únicos, estados permitidos no Adm 2, apenas itens implementados com `to`, e resolução correta de `/adm2`, `/adm2/panorama` e `/adm2/saas`.

- [ ] **Step 3: Executar RED**

Run: `npm test -- --run src/lib/adminWorkspaces.test.js src/lib/routes.test.js`

- [ ] **Step 4: Implementar registry mínimo**

Metadados Adm 2: `id`, `label`, `description`, `iconKey`, `status`, `to` opcional. Estados: `REAL`, `PARCIAL`, `PLANEJADO`, `INDISPONIVEL`, `BLOQUEADO`.

- [ ] **Step 5: Executar GREEN**

### Task 2: Seletor global e workspace Adm 1

**Files:**
- Create: `frontend/src/components/AdminWorkspaceSwitcher.jsx`
- Create: `frontend/src/pages/Adm1Workspace.jsx`
- Create: `frontend/src/pages/Adm1Workspace.test.jsx`
- Modify: `frontend/src/components/AdminLayout.jsx`
- Modify: `frontend/src/lib/routes.js`
- Modify: `frontend/src/lib/routes.render.test.jsx`

**Interfaces:**
- Consumes: `ADM1_ITEMS`, `getWorkspaceForPath`.
- Produces: rota `/adm1`, seletor persistente por URL e catálogo navegável das rotas atuais.

- [ ] **Step 1: Escrever testes falhos**

Cobrir alternância visível, Adm 1 listando todas as rotas atuais, links reais, URLs antigas ainda renderizando e ausência de duplicação dos componentes.

- [ ] **Step 2: Executar RED**

- [ ] **Step 3: Implementar seletor e página Adm 1**

O seletor navega para `/adm1` ou `/adm2`; não grava sessão paralela nem altera TenantProvider.

- [ ] **Step 4: Simplificar menu global sem remover acessibilidade**

Manter atalhos essenciais Home, Adm 1 e Adm 2. As entradas atuais continuam dentro de Adm 1 e acessíveis por suas URLs.

- [ ] **Step 5: Executar GREEN e testes de rotas completos**

### Task 3: Shell e catálogo honesto do Adm 2

**Files:**
- Create: `frontend/src/components/adm2/Adm2Layout.jsx`
- Create: `frontend/src/components/adm2/Adm2StatusBadge.jsx`
- Create: `frontend/src/pages/adm2/Adm2Overview.jsx`
- Create: `frontend/src/pages/adm2/Adm2Overview.test.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/lib/routes.js`

**Interfaces:**
- Consumes: `ADM2_ITEMS`, `ADM2_IMPLEMENTED_ROUTES`.
- Produces: `/adm2` com navegação interna, cards de módulos e estados não enganosos.

- [ ] **Step 1: Escrever testes falhos do catálogo**

Itens planejados exibem estado e descrição, não links ativos; itens implementados navegam; nenhum valor de negócio está hardcoded.

- [ ] **Step 2: Executar RED**

- [ ] **Step 3: Implementar shell e overview**

Usar identidade visual das referências (fundo claro, azul, navegação compacta) sem copiar números ou nomes demonstrativos.

- [ ] **Step 4: Executar GREEN**

### Task 4: Primeiro lote real do Adm 2

**Files:**
- Create: `frontend/src/pages/adm2/Adm2Home.jsx`
- Create: `frontend/src/pages/adm2/Adm2Home.test.jsx`
- Create: `frontend/src/pages/adm2/Adm2Panorama.jsx`
- Create: `frontend/src/pages/adm2/Adm2Panorama.test.jsx`
- Create: `frontend/src/pages/adm2/Adm2Products.jsx`
- Create: `frontend/src/pages/adm2/Adm2Products.test.jsx`
- Modify: `frontend/src/lib/routes.js`
- Modify: `frontend/src/lib/adminWorkspaces.js`

**Interfaces:**
- Consumes: `getHomeSummary`, `listSaas` e navegação existente para `/saas/:id`.
- Produces: `/adm2/home`, `/adm2/panorama`, `/adm2/saas`.

- [ ] **Step 1: Escrever testes falhos de dados reais e indisponibilidade**

Cobrir loading, erro, vazio, métricas disponíveis, métricas indisponíveis, lista real de produtos e navegação para detalhe atual.

- [ ] **Step 2: Executar RED**

- [ ] **Step 3: Implementar Minha manhã**

Mostrar apenas produtos e métricas retornados pelas APIs; tarefas, aprovações e IA ficam como módulos planejados, sem contadores.

- [ ] **Step 4: Implementar Panorama**

Reorganizar as mesmas métricas reais, sem calcular custos/usuários/clientes inexistentes.

- [ ] **Step 5: Implementar SaaS/Produtos**

Usar `listSaas`; filtros locais devem ser identificados como locais; criação e edição continuam nas telas atuais até migração específica.

- [ ] **Step 6: Executar GREEN**

### Task 5: Compatibilidade, qualidade e documentação

**Files:**
- Modify: `docs/FRONTEND_ROUTE_JOURNEY_INVENTORY.md`
- Create: `docs/ADM1_ADM2_STATUS.md`
- Modify: `docs/CODEX_HANDOFF.md`

**Interfaces:**
- Consumes: todas as entregas anteriores.
- Produces: evidência do primeiro lote e lista dos próximos módulos.

- [ ] **Step 1: Executar testes direcionados**

Run: `npm test -- --run src/lib/adminWorkspaces.test.js src/lib/routes.test.js src/lib/routes.render.test.jsx src/pages/Adm1Workspace.test.jsx src/pages/adm2/Adm2Overview.test.jsx src/pages/adm2/Adm2Home.test.jsx src/pages/adm2/Adm2Panorama.test.jsx src/pages/adm2/Adm2Products.test.jsx`

- [ ] **Step 2: Executar suíte frontend completa**

Run: `npm test`

- [ ] **Step 3: Executar lint, typecheck e build**

Run: `npm run lint`, `npm run typecheck`, `npm run build`.

- [ ] **Step 4: Validar no navegador**

Conferir `/adm1`, `/adm2`, `/adm2/home`, `/adm2/panorama`, `/adm2/saas`, alternância, responsividade básica e URLs antigas.

- [ ] **Step 5: Atualizar documentação com evidências reais**

Registrar módulos implementados, planejados, indisponíveis e a regra de promoção/aposentadoria.

- [ ] **Step 6: Comparar status Git**

Salvar `.runtime/checks/adm1-adm2/git-status-after.txt`; não limpar alterações anteriores.
