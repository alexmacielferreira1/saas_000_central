# Inventário de rotas e jornadas do frontend

Atualizado em 26/09/2026 para o CEN-000/C0. Este documento descreve o código existente; não declara paridade funcional nem autoriza remover o baseline visual.

## Legenda

- **Nativa:** leitura e mutação principais usam a API FastAPI local.
- **Híbrida:** parte usa API local e parte ainda usa Base44, dados estáticos ou ação não implementada.
- **Base44:** a jornada principal ainda depende do SDK/entidades Base44.
- **Histórica:** existe no export, mas não está ligada ao roteador atual ou depende de infraestrutura externa não reconstruída.

## Rotas públicas

| Rota | Tela | Fonte e persistência | Ações e efeitos | Estado | Destino |
|---|---|---|---|---|---|
| `/login` | Login | `/api/v1/auth/login`; sessão opaca em cookie HttpOnly | login, Google OAuth, retorno seguro | Nativa | manter e ampliar testes |
| `/register` | Cadastro | `base44.auth.register`, OTP e provider Google | criar conta, validar/reenviar OTP | Base44 | adaptar somente quando auto-cadastro for aprovado; hoje não é contrato nativo |
| `/forgot-password` | Recuperação | `base44.auth.resetPasswordRequest` | solicitar recuperação | Base44 | substituir por fluxo nativo em C1 se aprovado |
| `/reset-password` | Nova senha | `base44.auth.resetPassword` | trocar senha por token | Base44 | substituir por fluxo nativo em C1 se aprovado |

`OAuthConsent.jsx` consulta `/api/apps/{appId}/mcp/consent-info` e envia `/authorize-grant`, mas não está em `PUBLIC_ROUTES` nem `ADMIN_ROUTES`. É uma tela histórica do runtime MCP/Base44 e deve permanecer isolada até existir contrato nativo equivalente.

## Rotas administrativas

| Rota | Tela | Leituras | Mutações/efeitos | Estado | Decisão C0 |
|---|---|---|---|---|---|
| `/` | Home | `listSaas()` nativo; `AdminCommand` e `Incident` Base44 | navegação para detalhes e KPIs | Híbrida | manter layout; migrar operações/incidentes por contratos próprios |
| `/resolution` | Central de Resolução | `Incident`, `AdminCommand`, `Saas`, `Configuration` Base44 | aprovar/rejeitar operações, incidentes e configurações; IA por `functions.invoke` | Base44 | manter layout; substituir por APIs nativas após Operations/Error Center |
| `/api-guides` | Guias das APIs | `listSaas()` nativo; `CapabilityManifest` Base44 | atualizar lista, expandir guia, abrir SaaS | Híbrida | manter; criar manifest/capabilities nativos em C2–C4 |
| `/saas` | SaaS 360 | `/api/v1/saas` | criar SaaS e abrir detalhe | Nativa | manter e cobrir jornada completa |
| `/saas/:id` | Detalhe SaaS | `/api/v1/saas/{id}`; manifest, usuários, configurações e comandos Base44 | trocar abas e navegar | Híbrida | manter; migrar abas separadamente |
| `/users` | Usuários & Acesso | `/api/v1/access/managers`; usuários dos SaaS retornam lista vazia intencional | criar administrador nativo; cadastro de usuário SaaS exibe bloqueio explícito | Híbrida/parcial | manter; concluir pessoas, memberships e conectores em C1/C2 |
| `/configurations` | Configurações & Flags | `Configuration` Base44 por organização | criar configuração Base44 | Base44 | manter layout; API nativa exige auditoria/aprovação |
| `/operations` | Centro de Operações | `AdminCommand` Base44 | criar, aprovar e rejeitar; auditoria Base44 | Base44 | manter layout; migrar com idempotência e estados assíncronos |
| `/audit` | Auditoria | `Audit` Base44 por organização | busca local | Base44 | manter layout; substituir por `AuditLog` append-only em C1 |
| `/incidents` | Incidentes | `Incident` Base44 | criar, mudar estado e resolver | Base44 | manter layout; migrar em Operations/Error Center |
| `/integrations` | Integrações & Saúde | `/api/v1/saas` | atualizar e abrir detalhe | Nativa de inventário | manter; health remoto real permanece pendente |

## AppShell e componentes transversais

| Componente | Estado atual | Risco ou pendência |
|---|---|---|
| `AuthContext` | sessão/login/logout/Google nativos; não grava token em storage | cobertura existente; completar cookies, CORS, CSRF e ambientes em C1 |
| `ProtectedRoute` | protege todas as rotas administrativas | adicionar teste de renderização para cada rota crítica |
| `TenantContext` | deriva organizações das memberships e troca somente estado local | seleção não persiste no backend; isolamento completo ainda não comprovado |
| `usePermissions` | permissões calculadas no navegador por tier/role | proteção transitória; backend deve negar por permissão real em C1 |
| `CommandPalette` | atalhos estáticos funcionam; índice de SaaS, incidentes, configurações, operações, gestores e usuários usa Base44 | migrar fonte por entidade; não remover atalhos visuais |
| `QuickActionsMenu` | navega com `?novo=` para seis ações | SaaS e administrador são nativos; incidente/config/operação são Base44; usuário SaaS é bloqueado |
| `PageNotFound` | consulta `base44.auth.me()` | substituir pela sessão nativa sem alterar a apresentação |
| `writeAudit` | grava `Audit` no Base44 | não usar como auditoria definitiva; migrar para backend append-only |

## Persistência no navegador

- A autenticação nativa usa cookie HttpOnly; `AuthContext` não persiste token em `localStorage` ou `sessionStorage`.
- `app-params.js` ainda remove chaves históricas `base44_access_token` e `token` do `localStorage`.
- `OAuthConsent.jsx` contém compatibilidade com token histórico e endpoints do runtime MCP.
- O estado do menu lateral é persistido em cookie de preferência visual; não é credencial.
- A troca de tenant permanece apenas em memória durante a sessão da página.

## Jornadas observáveis

| Jornada | Passos atuais | Situação |
|---|---|---|
| Sessão administrativa | login → restaurar sessão → rota protegida → logout | funcional e coberta parcialmente |
| Catálogo SaaS | login → SaaS 360 → registrar SaaS → abrir detalhe | API nativa; falta teste integrado de renderização e evidência visual |
| Administração | login → Usuários & Acesso → criar administrador → filtrar lista | API nativa; falta teste integrado de renderização e evidência visual |
| Saúde básica | login → Integrações & Saúde → atualizar → abrir produto | usa inventário nativo, ainda sem handshake remoto |
| Operação controlada | criar → aprovar/rejeitar → auditar | dependente do Base44; não considerar funcional localmente |
| Incidente | registrar → investigar/monitorar → resolver | dependente do Base44; não considerar funcional localmente |
| Configuração | criar → aprovar/rejeitar → refletir flag | dependente do Base44; não considerar funcional localmente |
| Busca global | abrir por botão/Ctrl+K → buscar → navegar/criar | navegação estática funciona; dados e parte das ações dependem do Base44 |

## Ordem de migração sem redesenho

1. Cobrir renderização/acesso das 15 rotas declaradas e o fallback 404.
2. Fechar evidência da jornada nativa de catálogo SaaS e administradores.
3. Remover Base44 de `PageNotFound` e das fontes já nativas da Command Palette.
4. Concluir C1: sessão/tenant/permissões/auditoria.
5. Migrar detalhe e manifests/capabilities.
6. Migrar configurações, operações, incidentes e Central de Resolução em contratos separados.
7. Só remover SDK Base44 quando não houver referência executável classificada.

## Critério de manutenção

Uma rota só muda de Base44/híbrida para nativa quando leitura, mutação, autorização, persistência, loading/vazio/erro, teste e evidência estiverem presentes. Preservar o layout atual durante cada substituição.
