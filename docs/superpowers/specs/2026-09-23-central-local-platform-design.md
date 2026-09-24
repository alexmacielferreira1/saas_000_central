# Central SaaS — reconstrução local e preparação para Render/Neon

Data: 23/09/2026

## 1. Objetivo aprovado

Transformar o projeto existente `000_central` no plano de controle do HUB SaaS, removendo a dependência funcional do Base44 e aplicando o padrão local comprovado no MediaMind. A Central deverá administrar produtos, ambientes, tenants, usuários, acessos, configurações, operações, incidentes, importações e integrações sem se tornar dependência operacional ou banco mestre dos SaaS.

O projeto será homologado localmente antes de receber repositório remoto e serviços Render/Neon. A especificação prepara o produto para esses ambientes, mas não autoriza publicação nem criação de recursos externos.

## 2. Estado de partida

O repositório já possui:

- frontend React/Vite histórico, com páginas de Home, SaaS 360, usuários, configurações, operações, incidentes, integrações, auditoria e resolução;
- backend FastAPI com health, readiness, versionamento, correlação, erros públicos e PostgreSQL/Alembic;
- scripts locais de setup, desenvolvimento, testes, migrations, smoke e readiness;
- baseline de integridade do export Base44;
- plano C0–C7 e documentação arquitetural.

Ainda faltam modelos de negócio, autenticação própria, tenant real, autorização, auditoria persistente, APIs das telas e validação funcional sem Base44. O frontend continua chamando o cliente de compatibilidade Base44 e usa organizações demonstrativas.

## 3. Princípios de arquitetura

1. A Central é `control plane`; os SaaS mantêm seu próprio `data plane`.
2. Nenhuma função da Central acessa diretamente o banco de um SaaS.
3. Cada produto continua operando quando a Central estiver indisponível.
4. Toda comunicação Central ↔ SaaS usa contratos versionados, autenticação de serviço, timeout, idempotência e auditoria.
5. Tenant e permissão são resolvidos no backend e negados por padrão.
6. IA sugere diagnósticos e ações; alterações relevantes exigem confirmação humana, testes e rollback.
7. Nenhum segredo, token de sessão ou credencial de integração fica no bundle, banco em texto puro ou logs.
8. O export Base44 e o frontend existente são preservados como referência até cada jornada ser substituída e comprovada.

## 4. Arquitetura alvo

```text
Navegador
  └─ React/Vite
       ├─ sessão por cookie HttpOnly
       ├─ contexto de usuário, tenant e permissões
       └─ cliente HTTP versionado /api/v1
             │
             ▼
FastAPI Central
  ├─ Identity / Session / OAuth
  ├─ Tenancy / Membership / Permissions
  ├─ Product Registry / Environments / Capabilities
  ├─ Administration / Configurations / Audit
  ├─ Operations / Incidents / Problems
  ├─ Import-Export Engine
  ├─ Connectors / Commands / Events
  └─ Jobs / Observability / AI Assistance
             │
             ├─ PostgreSQL próprio da Central
             └─ APIs administrativas versionadas dos SaaS
```

O backend usa camadas `api → service → repository → model`, com schemas públicos separados de modelos persistidos. Operações externas e assíncronas passam por jobs persistentes; respostas HTTP não aguardam processamento demorado.

## 5. Identidade, sessão e tenancy

Entidades iniciais:

- `User`: identidade local global da Central;
- `Tenant`: organização administrada;
- `Membership`: vínculo de usuário com tenant e estado ativo;
- `Role`, `Permission`, `RolePermission` e overrides individuais;
- `Session`: token opaco armazenado somente como hash, com expiração e revogação;
- `OAuthIdentity`: vínculo Google opcional, nunca criação automática de superadmin;
- `AuditEvent`: evento append-only com usuário, tenant, ação, alvo e correlação.

Regras:

- login por senha e Google usam o mesmo modelo de usuário/membership;
- cookies seguem a política local ou cross-origin segura conforme o ambiente;
- troca de tenant é validada no backend e registrada na sessão;
- superadmin pode usar escopo global explícito; demais usuários precisam de membership ativa;
- visualizar uma tela e executar uma ação são permissões diferentes;
- bootstrap é creation-only, idempotente e proibido de redefinir senha;
- demo seed só existe em local/test.

## 6. Registro dos SaaS

Entidades:

- `Product`: identidade, slug, proprietários e ciclo de vida;
- `ProductEnvironment`: local, staging ou production, URLs e estado;
- `Capability`: contrato e versão das capacidades oferecidas;
- `ProductCapability`: compatibilidade declarada por ambiente;
- `ProductTenantLink`: vínculo autorizado entre tenant e produto;
- `Entitlement`: capacidade/plano habilitado;
- `HealthSnapshot`: estado sanitizado de health/readiness/version;
- `ServiceCredentialReference`: referência protegida, nunca segredo exposto à UI.

Estados de produto: `draft`, `active`, `degraded`, `suspended`, `archived`, `transferring`, `decommissioning`.

Ações destrutivas não são tratadas como exclusão simples. Desconectar, arquivar, transferir e descomissionar têm fluxos e registros diferentes.

## 7. Contrato Central ↔ SaaS

Cada SaaS poderá expor, conforme capability:

- `GET /health`;
- `GET /ready`;
- `GET /version`;
- `GET /api/v1/admin/capabilities`;
- endpoints de comando autorizados e idempotentes;
- webhooks/eventos sanitizados para estado, auditoria e operações.

Toda chamada inclui product, environment, tenant quando aplicável, correlation ID e chave de idempotência. Timeout ou incompatibilidade afeta somente o produto consultado e aparece como estado explícito, nunca como sucesso falso.

## 8. Módulos funcionais da Central

### 8.1 Home e visão executiva

Resumo de produtos, tenants, usuários, saúde, incidentes, operações recentes, custos e pendências. Métricas demonstrativas devem ser rotuladas ou removidas; dados reais vêm das APIs e do banco da Central.

### 8.2 SaaS 360 e Tenant 360

Lista e detalhe de produtos, ambientes, capacidades, versões, responsáveis, clientes vinculados, consumo, custos, incidentes, integrações e histórico. Tenant 360 mostra acessos e vínculos autorizados sem copiar dados privados de domínio.

### 8.3 Administração

Usuários com detalhe lateral, pessoas, memberships, equipes, setores, unidades, funções, perfis, permissões, exceções, módulos/telas, formulários, integrações, segurança e configurações. Acesso efetivo deve explicar sua origem.

### 8.4 Configurações e governança

Configurações versionadas, feature flags, planos, subscriptions, entitlements, políticas, aprovação e histórico. Segredos são apenas referências a armazenamento seguro e nunca retornam o valor integral.

### 8.5 Operações, incidentes e problemas

Comandos administrativos rastreáveis, tentativas, resultados, incidentes, agrupamento de erros, causa raiz, ações corretivas/preventivas e revisão pós-incidente. Mudança em produção exige evidências, confirmação e rollback.

### 8.6 Integrações

Conectores versionados, webhooks, estado, credenciais referenciadas, teste de conexão, retry e circuit breaker. Falha de um conector não derruba o produto ou a Central.

### 8.7 Importação e exportação em massa

Motor compartilhável para usuários, pessoas, produtos, tenants, configurações e, por adaptadores, mídias/arquivos dos SaaS.

Fluxo:

`upload → preview → aba/tabela → mapeamento → transformações → validação → dry run → confirmação → job → resultado/histórico`.

A bancada possui três áreas: fontes/passos aplicados, grade central editável e inspetor de coluna/mapeamento. CSV UTF-8 e XLSX são os primeiros formatos; fórmulas nunca são executadas. A fonte original é imutável e transformações formam uma receita declarativa.

Nenhuma escrita ocorre na prévia ou no dry run. A execução é idempotente, auditada e produz resultado por linha e arquivo de rejeitados. Exportações respeitam tenant, permissão, LGPD, retenção e campos permitidos.

### 8.8 Busca e ações globais

Busca por produto, tenant, usuário, tela, incidente, configuração e ação, filtrada por permissão. Command palette e botão Novo usam registros de ações autorizadas, não rotas hardcoded espalhadas.

### 8.9 IA assistiva

IA pode resumir incidentes, sugerir diagnósticos, gerar relatórios e recomendar ações. Cada ferramenta possui schema, permissão, quota, timeout e auditoria. Prompt sensível não é armazenado integralmente. A IA não modifica permissões, banco, produção ou importações sem confirmação humana.

### 8.10 Custos e ciclo de vida

Custos diretos/compartilhados por produto e, quando possível, tenant. O ciclo de vida inclui criar, conectar, ativar, escalar, migrar, desconectar, arquivar, transferir/vender e descomissionar, sempre com checklist, exportação e retenção.

## 9. Migração do frontend Base44

A migração ocorre por jornada, não por troca global:

1. criar cliente HTTP local com `credentials: include` e erros estruturados;
2. substituir AuthContext e TenantContext por contratos próprios;
3. manter o layout e as rotas enquanto cada página troca entidades Base44 por APIs locais;
4. remover dialogs e ações simuladas somente quando houver equivalente real;
5. retirar SDK/plugin Base44 do runtime e build depois que a última jornada migrada estiver comprovada;
6. preservar a tag/export histórico.

Cada página recebe estados de carregamento, vazio, erro e permissão negada. A UI não deduz autorização apenas por cargo ou por esconder botões.

## 10. Dados, migrations e compatibilidade

- IDs UUID e timestamps UTC;
- índices e constraints explícitos;
- migrations aditivas e reversíveis quando possível;
- migrations executadas antes da aplicação em cloud;
- seed local determinístico e separado do bootstrap de produção;
- sem reset automático de banco;
- banco Neon independente para a Central;
- importações e conectores nunca escrevem diretamente em bancos de outros SaaS.

## 11. Ambientes e preparação para Render/Neon

Ambientes: `local`, `test`, `staging`, `production`.

Configurações obrigatórias incluem URL do banco, origens CORS, URL do frontend/backend, política de cookie, chave de sessão, OAuth opcional e referências de integração. Valores de produção não entram no Git.

A preparação cloud deve fornecer:

- web service FastAPI;
- static site Vite com SPA rewrite;
- comando de migration separado/anterior ao startup;
- `/health`, `/ready` e `/version`;
- allowlist de origens e cookies cross-origin corretos;
- rollback, backup/restauração, smoke e canário;
- documentação das variáveis sem seus valores secretos.

Não se criam `render.yaml`, remoto Git ou banco Neon com identificadores inventados. Esses artefatos entram quando os alvos forem confirmados.

## 12. Tratamento de falhas

- erros públicos têm código, mensagem segura, referência e correlation ID;
- logs não incluem corpo, query, token, segredo ou mensagem interna não sanitizada;
- indisponibilidade de banco torna readiness 503, sem falsificar health;
- jobs registram tentativas, erro público, próxima tentativa e estado terminal;
- falhas parciais de importação e comando não perdem resultados concluídos;
- connectors usam timeout, retry limitado e circuit breaker;
- ações sem backend real aparecem indisponíveis, nunca como sucesso simulado.

## 13. Testes e gates

Backend:

- unidade para regras de domínio e autorização;
- integração PostgreSQL para constraints, tenant e migrations;
- API para sessão, CORS/Origin, erros, idempotência e isolamento;
- contratos com doubles para todos os estados dos SaaS;
- segurança de importação, arquivos e integrações.

Frontend:

- cliente HTTP, auth, tenant, permissão e rotas;
- jornadas por página com estados completos;
- acessibilidade e responsividade;
- regressão visual proporcional às telas de referência;
- ausência de Base44 no runtime ao fim da migração.

Gate por fatia:

1. teste falhou antes da implementação e depois passou;
2. suíte completa, lint, tipos e build passam;
3. migration do zero e upgrade compatível passam;
4. jornada funciona após refresh;
5. permitido, negado e outro tenant são testados;
6. documentação/status são atualizados.

## 14. Ordem de entrega

1. C0: reconciliar alterações locais, recuperar gate e ampliar baseline.
2. C1A: cliente HTTP, senha, sessão, logout e bootstrap seguro.
3. C1B: tenant, memberships, permissões e auditoria.
4. C1C: Google OAuth por ambiente e matriz funcional no navegador.
5. C2: Product Registry, ambientes, capabilities e SaaS 360.
6. C3: contratos Central ↔ SaaS e conexão inicial com MediaMind.
7. C4: Administração e Import/Export Engine.
8. C5: configurações, formulários, busca e capacidades horizontais.
9. C6: operações, incidentes, Error Center e IA assistiva.
10. C7: staging, GitHub, Render/Neon, canário e produção autorizada.

Cada item vira uma fatia vertical com backend, frontend, migration, permissão e testes. A existência de páginas históricas não antecipa a implementação do seu backend.

## 15. Fora da primeira execução

- copiar dados ou domínio audiovisual do MediaMind;
- banco compartilhado entre produtos;
- provisionamento cloud totalmente automático;
- correção autônoma de produção pela IA;
- billing financeiro completo antes de entitlements e custos confiáveis;
- excluir o frontend Base44 histórico antes da paridade;
- publicar sem alvos confirmados e sem gate verde.

## 16. Critérios finais de aceite

- a Central funciona sem Base44 e sem depender do MediaMind estar online;
- login, refresh, logout, Google opcional e troca de tenant funcionam de ponta a ponta;
- acessos são negados por padrão e isolados por tenant;
- páginas principais usam APIs e banco reais;
- produtos e ambientes podem ser registrados e monitorados sem acesso a seus bancos;
- importação permite prévia/edit/validação/dry run antes da escrita;
- comandos, incidentes, configurações e auditoria são persistentes;
- testes, migrations, lint, tipos, build, smoke e navegador passam;
- configuração está pronta para GitHub/Render/Neon sem secrets versionados;
- deploy só ocorre após homologação e autorização explícita.
