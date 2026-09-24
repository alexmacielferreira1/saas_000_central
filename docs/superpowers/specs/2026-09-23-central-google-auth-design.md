# Central — autenticação local e Google OAuth

## Objetivo

Substituir a autenticação Base44 da Central por autenticação própria, independente e compatível com o padrão comprovado no MediaMind. A Central deve permitir login por e-mail/senha e Google OAuth para contas locais previamente autorizadas, incluindo `alexmacielferreira@gmail.com` como superadmin.

Esta entrega não compartilha banco, cookies, sessão, cliente OAuth, credenciais ou código de domínio com o MediaMind. O MediaMind é referência de contrato e de erros aprendidos.

## Resultado esperado

1. `alexmacielferreira@gmail.com` existe no banco da Central como conta ativa.
2. A conta possui membership ativa e papel `superadmin` no escopo administrativo da Central.
3. A mesma conta pode entrar com senha ou Google.
4. Login Google nunca cria automaticamente usuário, tenant, membership, papel ou permissão.
5. A sessão sobrevive à navegação e ao refresh, pode ser revogada no logout e não expõe tokens ao JavaScript.
6. Contas ausentes, inativas, sem membership ou com e-mail Google não verificado são recusadas sem revelar detalhes internos.

## Decisões arquiteturais

### Identidade e autorização

- `User` representa a conta local da Central.
- `Tenant` representa um escopo administrável da Central.
- `Membership` relaciona usuário, tenant e papel.
- `AuthSession` guarda somente o hash de um token opaco, validade, revogação e tenant selecionado.
- O papel `superadmin` é persistido na membership; não é inferido no frontend nem concedido apenas pelo e-mail recebido do Google.
- O backend é a autoridade para identidade, tenant e autorização.

### Bootstrap do superadmin

Um comando de bootstrap separado e idempotente cria a conta administrativa inicial somente quando ela ainda não existe. Os dados vêm de variáveis seguras de ambiente, com `alexmacielferreira@gmail.com` configurado como e-mail administrativo do ambiente autorizado.

Localmente, o comando cria essa conta no PostgreSQL local. Quando a Central receber seu próprio banco Neon, o mesmo comando deve ser executado uma única vez apontando para o banco da Central. A conta existente no MediaMind não é visível nem copiada automaticamente porque os produtos possuem bancos independentes. `BOOTSTRAP_ADMIN_PASSWORD` é necessária para manter o login alternativo por e-mail; deve existir apenas durante a execução segura do bootstrap e pode ser removida das variáveis do serviço depois que a criação for comprovada. O hash permanece no banco. E-mail e nome podem ser mantidos apenas se forem úteis para recuperação operacional, mas o bootstrap nunca roda no startup comum.

Regras:

- não executar demo seed em produção;
- não criar superadmin durante callback OAuth;
- não redefinir senha, papel ou membership de conta existente;
- não promover conta existente silenciosamente;
- falhar de forma explícita se a configuração inicial estiver incompleta;
- registrar criação sem registrar senha ou segredo.

### Login por e-mail e senha

O frontend envia credenciais ao backend da Central. O backend normaliza o e-mail, usa hash de senha resistente, resposta pública uniforme para conta inexistente/senha inválida e bloqueio temporário após tentativas repetidas.

Sucesso cria sessão opaca revogável e retorna apenas perfil seguro, memberships e tenant selecionado. A senha e seu hash nunca aparecem na resposta ou nos logs.

### Login Google

1. O frontend redireciona para `GET /api/v1/auth/google/start` da Central.
2. O backend valida se o provider está configurado, gera `state` criptograficamente aleatório e grava cookie temporário `HttpOnly` com prazo curto.
3. O navegador é redirecionado ao Google com escopo `openid email profile`.
4. O Google retorna para `GET /api/v1/auth/google/callback` da Central.
5. O backend compara `state`, troca o código no servidor e consulta o perfil.
6. O e-mail precisa estar verificado e corresponder a um `User` local ativo com membership ativa.
7. O backend cria uma sessão da Central, apaga o cookie temporário e redireciona ao frontend.
8. Falha ou cancelamento também apagam o cookie temporário e retornam um código público seguro na tela de login.

O segredo Google e a troca de código nunca chegam ao frontend.

## Sessão e cookies

- Token de sessão aleatório, opaco e armazenado no banco apenas como hash.
- Cookie de sessão `HttpOnly`, `Path=/` e duração configurável.
- Local: `Secure=false`, `SameSite=Lax`.
- Produção com frontend e backend em origens diferentes: `Secure=true`, `SameSite=None`, sempre HTTPS.
- Frontend usa `credentials: include` em todas as requisições autenticadas.
- CORS aceita apenas a origem exata configurada da Central e permite credenciais.
- Nenhum token de autenticação em `localStorage`, `sessionStorage`, query string ou fragmento de URL.
- Logout revoga a sessão no banco e expira o cookie, inclusive de forma idempotente.

## Configuração por ambiente

Variáveis do backend da Central:

- `ENVIRONMENT`
- `DATABASE_URL`
- `FRONTEND_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `SESSION_COOKIE_SECURE`
- `SESSION_HOURS`
- `LOGIN_MAX_ATTEMPTS`
- `LOGIN_LOCKOUT_MINUTES`
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD`
- `BOOTSTRAP_ADMIN_NAME`

Essas três variáveis de bootstrap não são configuração permanente do fluxo Google. Em Neon/Render elas servem ao comando operacional inicial da Central; a senha em texto claro deve ser retirada do ambiente após a criação comprovada e nunca entra em Git, log ou imagem de container.

Variável de build do frontend:

- `VITE_API_URL`

Em produção, a aplicação deve recusar cookie inseguro, `FRONTEND_URL` HTTP ou callback Google HTTP. O callback cadastrado no Google precisa coincidir exatamente com `GOOGLE_REDIRECT_URI`.

Nenhuma variável da Central reutiliza implicitamente o valor do MediaMind. O mesmo projeto Google pode ser usado apenas se configurado conscientemente com callbacks distintos; a recomendação operacional é cliente OAuth separado por produto/ambiente para reduzir impacto e facilitar rotação.

## API inicial

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/google/start`
- `GET /api/v1/auth/google/callback`
- `GET /api/v1/auth/session`
- `POST /api/v1/auth/logout`

Respostas de sessão contêm perfil seguro, memberships e tenant selecionado. Erros seguem o envelope público existente da Central, com `correlation_id` e sem detalhes sensíveis.

## Frontend

- `AuthContext` deixa de depender do SDK Base44 para sessão e autenticação.
- A tela Login preserva o layout, mas usa a API da Central.
- O botão Google navega para o endpoint de início do backend.
- A aplicação restaura a sessão pelo endpoint `/auth/session`.
- Rotas protegidas aguardam a verificação inicial e redirecionam para `/login` apenas após uma resposta autenticada negativa.
- O retorno OAuth exibe mensagens claras para configuração ausente, consentimento negado, estado inválido, falha do provider e conta sem acesso.
- Cadastro automático e recuperação de senha ficam fora desta primeira fatia; as telas históricas podem permanecer visíveis somente quando houver comportamento seguro definido, sem chamar Base44.

## Erros do MediaMind que não podem se repetir

- `GOOGLE_OAUTH_NOT_CONFIGURED` sem orientação ou tratamento na interface.
- Callback diferente do cadastrado no Google.
- `localhost` ou HTTP em produção.
- Cookie cross-origin sem `Secure; SameSite=None`.
- Requisição frontend sem `credentials: include`.
- Login bem-sucedido seguido de `/session` 401.
- Loop entre login e rota protegida.
- Callback com parâmetros obrigatórios que transforma cancelamento em 422.
- Cookie de `state` não removido em falhas.
- Conta Google válida ganhando acesso sem usuário/membership local.
- Bootstrap redefinindo senha ou duplicando superadmin.
- Papel calculado apenas no frontend.
- Secret, token, código OAuth ou senha expostos em URL, resposta ou logs.

## Migrations

A primeira migration de identidade cria tabelas e índices para usuários, tenants, memberships e sessões, com unicidade para e-mail normalizado e slug do tenant. A migration não cria o superadmin e não depende de segredos; o bootstrap é comando operacional separado.

Downgrade destrutivo não será executado em produção como rotina. Antes de qualquer deploy, migrations são aplicadas em etapa separada e comprovadas contra PostgreSQL.

## Testes obrigatórios

### Backend unitário e API

- login por senha bem-sucedido e cookie seguro;
- resposta uniforme para usuário inexistente, senha errada e conta inativa;
- bloqueio temporário por tentativas repetidas;
- restauração, expiração e revogação da sessão;
- logout idempotente;
- Google start com `state` e configuração ausente;
- callback bem-sucedido para conta local autorizada;
- estado ausente/incorreto;
- consentimento negado;
- código ausente e provider indisponível;
- e-mail não verificado;
- usuário ausente, inativo ou sem membership;
- configuração de produção recusa HTTP e cookie inseguro;
- bootstrap cria uma vez e não redefine conta existente;
- superadmin possui autorização backend e usuário comum não.

### PostgreSQL

- migration sobe em banco vazio;
- constraints de unicidade e relacionamentos;
- sessão persiste entre requisições/processos;
- bootstrap é idempotente em banco real.

### Frontend

- restaura sessão com cookie;
- envia login por senha corretamente;
- inicia login Google pelo backend;
- apresenta erros públicos do callback;
- logout limpa estado local mesmo se a resposta já estiver revogada;
- rota protegida não entra em loop;
- nenhum token é gravado em storage.

### E2E e homologação

- senha e Google com `alexmacielferreira@gmail.com` em ambiente local/homologação;
- refresh, logout e nova autenticação;
- acesso a rota de superadmin;
- negação a usuário comum;
- teste cross-origin HTTPS antes de produção;
- callback exato no Google;
- prova no navegador publicado após autorização de deploy.

## Ordem de implementação

1. testes e modelos/migration de identidade;
2. serviços de senha e sessão;
3. API por e-mail/senha, sessão e logout;
4. OAuth Google e validações de configuração;
5. bootstrap administrativo idempotente;
6. cliente HTTP e `AuthContext` local;
7. tela Login e rotas protegidas;
8. integração PostgreSQL, suíte completa e validação no navegador;
9. documentação de ambiente, Render/Neon e Google Cloud;
10. deploy somente com autorização e alvos confirmados.

## Fora do escopo desta fatia

- criação automática de usuários pelo Google;
- cadastro público;
- convites e aprovação de acesso;
- recuperação de senha por e-mail;
- MFA e passkeys;
- SSO corporativo;
- compartilhamento de sessão entre Central e MediaMind;
- publicação automática em Render/Neon;
- extração imediata de pacote comum de autenticação.

Esses recursos podem ser adicionados depois que Central e MediaMind provarem o mesmo contrato com testes e operação real.

## Critério de aceite

A implementação só estará concluída quando senha e Google funcionarem com a conta superadmin local, a sessão persistir e revogar corretamente, usuários não autorizados forem negados, migrations/bootstrap forem idempotentes, testes passarem em PostgreSQL e frontend, e o fluxo for validado no navegador. Build isolado ou tela visível não comprovam autenticação.
