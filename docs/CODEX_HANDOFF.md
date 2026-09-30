# Handoff da Central

## Atualização 27/09/2026 — operação no mesmo contexto

- Os onze centros de capacidade deixaram de repetir conteúdo genérico e agora possuem formulários e indicadores do próprio domínio.
- Criar e editar `ControlResource` funciona na mesma página; a edição usa PATCH, incrementa versão e audita antes/depois.
- QA manual comprovou o fluxo em `/commercial/plans`, incluindo login, criação, seleção contextual, atualização e releitura da versão 2.
- `engine_options` agora impede opções exclusivas do PostgreSQL no SQLite de QA, corrigindo o login após reinício local.
- Próxima fatia: especializar Administração conforme Pessoa → Conta → Membership → Perfil → Função → Equipe → Setor → Unidade → Escopo → Exceção, começando por atribuição/acesso efetivo e sessões.
- O anexo de controle do MediaMind foi incorporado ao backlog: Tenant/User 360, permissões de telas e ações, chaves/roteamento/custos de IA, arquivos, import/export, logs, incidentes, playbooks e aprovações. Não marcar nenhum item como concluído sem ponte, persistência, autorização e auditoria.

- Estado: segundo produto do HUB, ainda em M0 e sem publicação em Render/Neon autorizada nesta sessão.
- Revalidação de 26/09/2026: backend lint/format, 59 testes de backend, 65 testes frontend, consistência de dependências, frontend build/lint/typecheck e integridade do export estão verdes. Migration, integração PostgreSQL e smoke estão falhando porque Docker Desktop e o PostgreSQL temporário local não estão ativos; nenhum dado publicado foi acessado. A migration `0006` gerou SQL PostgreSQL válido em modo offline, mas ainda precisa ser aplicada localmente.
- O build ainda emite aviso de configuração Base44 ausente e bundle principal elevado; isso não comprova funcionamento local.
- C0 em andamento: autenticação/sessão, catálogo de SaaS e administradores já usam a API nativa; 39 alterações frontend estão classificadas no registro de integridade.
- Cobertura do frontend: 65 testes em 13 arquivos; 28,80% statements, 20,30% branches, 22,87% functions e 29,57% lines. As 15 rotas declaradas renderizam em teste e as 11 administrativas negam acesso anônimo. Não declarar paridade completa.
- Dependências: correções compatíveis do `npm audit` aplicadas; restaram 2 vulnerabilidades baixas e 2 moderadas ligadas a React Router/Quill, cuja correção automática é incompatível e não deve ser forçada.
- Base técnica local existe; login, restauração de sessão, logout, lista/criação/detalhe de SaaS e lista/criação de administradores possuem contratos nativos. As demais telas de domínio ainda precisam ser classificadas e migradas.
- Padrão de entrada: `../../_documentacao/HUB_PLATFORM_STANDARD.md`.
- Plano executável: `CENTRAL_IMPLEMENTATION_PLAN.md`.
- Inventário C0 concluído em `FRONTEND_ROUTE_JOURNEY_INVENTORY.md`: 15 rotas declaradas, um componente histórico não roteado e os componentes transversais foram classificados como nativos, híbridos ou Base44.
- Próximo bloco desbloqueado: restaurar o PostgreSQL local, aplicar `0006_product_users` e migrar a aba `Configurações` do detalhe do SaaS. Não iniciar C1 antes do aceite de C0.
- Preservar independência de bancos e não copiar o domínio audiovisual do MediaMind.
- Git remoto confirmado: `origin` aponta para `alexmacielferreira1/saas_000_central`, branch `main`. Commit/push não equivalem a deploy; Render/Neon continuam fora de escopo sem autorização explícita.

## Bloco CEN-000 executado em 26/09/2026

- Estado anterior: gate desatualizado; teste de banco esperava a migration `0002_identity_auth`; nove alterações intencionais ainda não estavam registradas no manifesto aprovado.
- Estado novo: gate técnico verde e manifesto íntegro; M0 continua `blocked` por paridade funcional, cobertura de rotas/jornadas e classificação do Base44 restante.
- Migration: nenhuma nova; o teste foi alinhado à migration existente `0003_saas_registry` e à tabela `saas_products`.
- Testes: `scripts/check.ps1` executado com todos os checks automáticos aprovados; o comando encerra com código 1 porque o gate manual de paridade permanece corretamente `blocked`. `npm run test:coverage` foi aprovado com 27 testes.
- Jornada manual: não repetida neste bloco; a validação anterior de login/sessão/logout permanece registrada, sem ser promovida a paridade geral.
- Rollback: reverter o commit deste bloco restaura somente teste, documentação, status e registro de integridade; não há alteração de schema ou produção.

## Bloco de inventário C0 executado em 26/09/2026

- Estado anterior: havia inventário por ocorrência, sem matriz por rota e sem decisão explícita de manutenção/adaptação.
- Estado novo: rotas públicas e administrativas, AppShell, persistência, ações e jornadas foram classificadas; o layout histórico permanece preservado.
- Migration: nenhuma.
- Testes: mudança documental; JSON e diff serão validados antes do commit, seguidos pelo gate do projeto.
- Risco principal: operações, incidentes, configurações, auditoria, resolução, recuperação e cadastro público ainda dependem do Base44.
- Próximo item: evidência visual e validação manual da jornada nativa.

## Bloco SCR-002/SCR-003 executado em 26/09/2026

- Estado anterior: cadastro, listagem e leitura do detalhe usavam API nativa, mas o produto não podia ser atualizado pela Central; faltavam testes de renderização das rotas.
- Estado novo: o detalhe preservado possui edição dos dados principais; `PATCH /api/v1/saas/{id}` aplica escopo do tenant, permite apenas `admin`/`superadmin`, bloqueia slug duplicado e persiste a alteração. As rotas declaradas possuem testes de renderização e proteção administrativa.
- Migration: nenhuma; a alteração usa campos existentes de `saas_products`.
- Testes: 49 testes backend e 55 frontend aprovados; build, lint, typecheck, cobertura e integridade aprovados. O gate completo permanece vermelho somente nos checks que dependem do PostgreSQL/API locais indisponíveis.
- Jornada manual: pendente; não declarar SCR-002/SCR-003 concluídas até evidência visual, auditoria persistente e migração das abas Base44.
- Rollback: reverter o bloco remove o endpoint PATCH, o diálogo e os testes sem alterar schema ou dados existentes.
- Próximo item desbloqueado: evidência visual da jornada nativa de catálogo/edição e screenshots C0.

## Bloco SCR-001 executado parcialmente em 26/09/2026

- Estado anterior: a Home combinava catálogo nativo com `AdminCommand` e `Incident` do Base44 e convertia silenciosamente falhas desses serviços em contagens zero.
- Estado novo: `GET /api/v1/home/summary` entrega KPIs reais de produtos isolados pelo tenant; membership inativa recebe 403. A Home preserva o layout, consome apenas APIs nativas e mostra indisponibilidade explícita para operações/incidentes ainda não migrados.
- Migration: nenhuma; o resumo agrega `saas_products` existente e não grava dados.
- Testes: 51 backend e 57 frontend aprovados; a Home possui testes próprios de sucesso e erro recuperável. Migrations, PostgreSQL e smoke voltaram a passar com banco local temporário.
- Jornada manual: aplicação reiniciada em `http://127.0.0.1:5174/`; captura visual autenticada ainda pendente e o marco permanece M0 bloqueado.
- Rollback: reverter este bloco remove o endpoint, cliente e testes sem alterar schema ou dados.
- Próximo item desbloqueado: evidência visual da Home e da jornada catálogo/edição; depois continuar a remoção incremental do Base44 sem avançar de fase.

## Bloco SCR-007/C1.4 parcial executado em 26/09/2026

- Estado anterior: a tela de Auditoria consultava a entidade `Audit` do Base44 e as mutações nativas do catálogo não produziam trilha de negócio.
- Estado novo: migration `0004_audit_logs`, modelo append-only, `GET /api/v1/audit` isolado por tenant e restrito a papéis administrativos; criação e edição de SaaS registram ator, recurso, snapshots saneados e correlation ID na mesma transação. A tela preservada agora consome a API nativa.
- Acesso local: o banco temporário estava sem identidades; o superadmin local foi recriado pelo bootstrap operacional e o login por e-mail foi validado. Nenhum ambiente Render/Neon foi alterado.
- Testes: 52 backend e 58 frontend aprovados; migration, integração PostgreSQL, build, lint, typecheck, smoke e integridade do frontend aprovados. Cobertura frontend: 27,66% de linhas; Auditoria possui 81,25%.
- Limites: faltam auditoria de login/logout/acesso/configurações/comandos, filtros avançados, detalhe, exportação controlada, retenção e evidência visual autenticada. M0 continua bloqueado e não houve deploy.
- Rollback: reverter este bloco e executar downgrade de `0004_audit_logs` remove somente a trilha nativa; o catálogo e a identidade permanecem.

## Bloco SCR-003/SCR-011/SCR-034 parcial executado em 26/09/2026

- Estado anterior: o detalhe e o Guia de APIs dependiam do Base44 para ler um manifesto de integração sem persistência nativa, permissão central ou auditoria transacional.
- Estado novo: migration `0005_capability_manifests`, modelo isolado por tenant e produto, endpoints nativos de leitura/listagem/publicação, validação estruturada, permissão administrativa e `AuditLog` na mesma transação. O detalhe preservado permite publicar/editar e o Guia de APIs exibe capacidades, recursos, escopos, eventos, health check e limites vindos da API.
- Testes: 56 backend e 62 frontend aprovados; lint, format, typecheck, build, migrations, integração PostgreSQL, smoke HTTP e integridade do frontend aprovados. Cobertura frontend: 28,79% de linhas.
- Jornada manual: login local, abertura do MediaMind AI, publicação do manifesto, reabertura como edição e conferência do conteúdo estruturado no Guia de APIs foram validados no navegador. Nenhum ambiente Render/Neon foi alterado.
- Limites: existe uma versão corrente por produto; histórico imutável, assinatura do SaaS e ingestão automática continuam pendentes. As abas `Usuários`, `Configurações` e `Operações` ainda usam Base44. M0 permanece bloqueado.
- Rollback: reverter este bloco e executar downgrade de `0005_capability_manifests` remove o contrato nativo e seus dados locais sem alterar catálogo, identidade ou auditoria existente.
- Próximo item desbloqueado: migrar a aba `Usuários` do detalhe do SaaS mantendo o layout atual.

## Bloco SCR-003/SCR-004/SCR-040 parcial executado em 26/09/2026

- Estado anterior: a aba de usuários do detalhe consultava `ProductUser` no Base44; a Administração retornava lista vazia e o botão de cadastro sempre lançava uma mensagem de indisponibilidade.
- Estado novo: `ProductUser` é uma projeção administrativa separada das credenciais globais, isolada por tenant e produto. `GET/POST /api/v1/product-users` lista e cria contas projetadas, bloqueia duplicidade, valida papel administrativo, atualiza `user_count` e grava `product_user.create` no `AuditLog` na mesma transação. O detalhe e a Administração preservados usam o contrato nativo e permitem cadastro.
- Migration: `0006_product_users` criada e validada por SQL PostgreSQL offline. A aplicação local está pendente porque Docker Desktop/PostgreSQL não iniciaram; Neon/Render não foram acessados.
- Testes: TDD vermelho→verde; 59 backend e 65 frontend aprovados. Ruff, formatação, lint, typecheck, build e integridade aprovados. Gate geral permanece `failed` por migration, integração e smoke dependentes do banco/API local indisponíveis.
- Limites: ainda faltam vínculo com pessoa global, edição/revogação, sincronização assinada pelo SaaS, acesso efetivo e validação manual no navegador com banco migrado.
- Rollback: downgrade de `0006_product_users` remove somente as projeções locais; contas globais, catálogo e dados dos SaaS permanecem.
- Próximo item: restaurar o banco local, validar a jornada e migrar `Configurações`.

## Bloco SCR-003/SCR-006 Configurações parcial executado em 26/09/2026

- Estado novo: migration `0007_configurations`, modelo isolado por tenant e escopo, `GET/POST /api/v1/configurations`, permissão administrativa, prevenção de duplicidade e auditoria transacional. A tela global e a aba do detalhe preservam o layout e agora consomem a API nativa; o formulário permite Central ou um SaaS cadastrado.
- Testes: 59 backend e 65 frontend aprovados; Ruff, lint e build aprovados. O SQL PostgreSQL da migration foi gerado offline com sucesso.
- Limites: PostgreSQL/API locais continuam indisponíveis, portanto a migration não foi aplicada e a jornada autenticada não foi validada no navegador. Edição, histórico/versionamento, aprovação operacional e propagação para SaaS remoto permanecem pendentes. Nenhum ambiente Render/Neon foi alterado.
- Rollback: downgrade de `0007_configurations` remove apenas as configurações nativas.
- Próximo item desbloqueado: migrar `Operações` para contrato nativo e depois restaurar banco/API para validação integral.

## Bloco SCR-091/SCR-092 parcial executado em 26/09/2026

- Nova rota `/data/imports/new` e item `Importar dados` no menu.
- A bancada PowerQuery aceita CSV, cria prévia tabular editável, permite marcar colunas obrigatórias, destaca linhas inválidas, substitui valores em massa e exporta o CSV tratado.
- Limite explícito: a confirmação persistente, histórico, receitas e importação assíncrona no backend ainda não foram implementados; a tela não declara escrita definitiva.
- Verificação: parser/edição/substituição/validação cobertos por testes; rota coberta por renderização, lint e build.

## Bloco SCR-060/SCR-066/SCR-067 parcial executado em 27/09/2026

- A navegação agora usa `/administration`, mantendo `/users` como alias. A página preservada ganhou visão dos SaaS com acesso direto ao detalhe, além de administradores, usuários de produto, perfis e permissões.
- A migration `0008_access_profiles` cria `permission_definitions` e `access_profiles` por tenant. `GET/POST /api/v1/access/permissions` e `GET/POST /api/v1/access/profiles` persistem dados reais; escrita exige superadmin, valida permissões desconhecidas e grava auditoria.
- A migration foi aplicada no PostgreSQL local. A jornada local autenticada criou duas permissões e o perfil `Administrador de SaaS`, confirmando leitura e persistência pela API.
- Verificação do bloco: 62 testes backend, integração PostgreSQL e 72 testes frontend aprovados; lint, typecheck e build aprovados. Ainda faltam atribuição/edição de perfis, pessoas, funções, equipes, setores, unidades, sessões, acesso efetivo e RBAC/ABAC definitivo.

## Bloco SCR-103/SCR-105 parcial executado em 27/09/2026

- `AdminOperation` e a migration `0009_admin_operations` substituem o Base44 no Centro de Operações e na aba Operações do SaaS.
- A API nativa lista por tenant/SaaS, registra comandos, classifica ações sensíveis como `awaiting_confirmation` e permite aprovação/rejeição auditada somente por administradores autorizados.
- A migration foi aplicada no PostgreSQL local e uma operação dry-run foi criada e relida pela API. O login local também foi desbloqueado e revalidado com sessão/cookie.
- Permanecem pendentes execução assíncrona real no SaaS remoto, idempotência, progresso, retry, cancelamento, resultado por registro e rollback/compensação.

## Bloco Central ↔ SaaS — conexão e evidência parcial em 27/09/2026

- Foram adicionados `SaasConnection`, `SaasEnvironment` e `IntegrationObservation`, com migration `0010_integration_observations` e endpoints nativos de cadastro/listagem por organização.
- A credencial é persistida somente como referência de ambiente; respostas e auditoria não expõem o valor. Escrita exige papel autorizado e dados de outra organização não ficam visíveis.
- Observações distinguem evidência confirmada de evidência desatualizada pelo prazo de validade configurado, sem transformar ausência de dado em saúde falsa.
- Verificação disponível: 68 testes backend e lint da fatia aprovados. O Docker Desktop não respondeu ao pipe local, portanto aplicação da migration e teste PostgreSQL permanecem pendentes; nenhum Neon/Render foi alterado.
- Próximo bloco: cliente HTTP autenticado para manifesto/health/readiness/version do MediaMind, persistência das observações e despacho idempotente de comandos dry-run.

## Bloco Control Plane expandido em 27/09/2026

- `Integrations.jsx` passou a consumir conexões, ambientes e observações nativas. O botão `Verificar agora` executa `POST /api/v1/integrations/connections/{id}/probe`, persiste evidência e auditoria e atualiza o estado exibido.
- Foi criada a interface `BaseSaasConnector` e o primeiro `MediaMindConnector`, que consulta Health e Capability Manifest com timeout, correlação, segredo somente no backend e classificação de falha.
- Novas telas navegáveis e conectadas: Mapa de controle, Saúde operacional, Erros e evidências, Jobs e execuções, Visão da administração, Governança de telas, Planos e produtos, Uso e custos, Governança de IA, Storage, Versões, Segurança, LGPD, Continuidade e Documentação.
- A migration `0011_control_resources` e `GET/POST /api/v1/control-resources` criam a primeira persistência tenant-scoped e auditada para módulos, telas, planos, políticas, releases, inventários, backups e demais registros administrativos. A jornada real no navegador criou e releu `Administração Central` em Governança de telas.
- Validação: 72 testes backend (incluindo probe/connector e catálogo), 106 frontend, Ruff, lint e build aprovados. O SQL da migration foi gerado; aplicação no PostgreSQL configurado falhou por timeout de conexão. A base SQLite de QA criou a tabela e validou a jornada.
- Limites ainda abertos: executor remoto de AdminOperation, incidentes e Resolution nativos, importação persistente, especialização dos domínios comerciais/Screen Registry e administração completa de pessoas/acesso efetivo. Nenhum Render/Neon foi alterado.

## Bloco Administração/IAM e requisitos consolidados em 29/09/2026

- Commit-base `b7b5b38`: migration `0012_organization_access`, entidades de estrutura organizacional e atribuição, endpoints tenant-scoped e auditados e interface contextual em `/administration`.
- O acesso efetivo agora explicita papel, perfil, caminho organizacional, fontes, permissões concedidas e bloqueadas. Esta é a primeira fatia, não a Administração completa.
- A continuidade obrigatória está em `CENTRAL_NEXT_SESSIONS_CHECKLIST.md`. A próxima fatia funcional é completar o ciclo de vida do usuário e exceções temporárias; depois Form Builder e Import Engine persistente estilo PowerQuery.
- Verificação fresca desta sessão: 78 testes backend, 109 frontend, lint e typecheck aprovados. Nenhum Render/Neon foi alterado.
