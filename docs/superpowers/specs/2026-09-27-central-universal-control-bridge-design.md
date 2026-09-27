# Central universal e ponte HUB — desenho aprovado

Data: 27/09/2026

## Objetivo

Transformar a Central no ponto diário de observação e comando de todos os SaaS do HUB. Cada produto continua independente, mas nasce com um contrato administrativo comum para publicar informações verificáveis e receber comandos autorizados. A primeira integração de referência será Central ↔ MediaMind.

A interface deve responder, em português simples:

1. O que está funcionando agora?
2. Qual informação é real, de qual ambiente e quando foi verificada?
3. O que exige atenção ou aprovação?
4. O que posso fazer daqui e qual será o impacto?
5. O comando foi apenas aceito, realmente executado ou falhou?
6. Como desfazer ou compensar uma mudança?

## Limites arquiteturais

- A Central é plano de controle; cada SaaS continua sendo a fonte dos próprios dados e regras.
- A Central nunca acessa diretamente banco, storage ou código interno de outro produto.
- Um SaaS continua funcionando se a Central estiver indisponível.
- Integração usa APIs e eventos versionados, autenticação de serviço, escopos e auditoria nos dois lados.
- Nenhuma informação demonstrativa pode aparecer como saúde real.
- Nenhuma resposta HTTP de aceitação equivale a operação concluída.
- IA pode investigar e propor; ações externas ou de produção precisam de permissão, prévia do impacto, confirmação proporcional ao risco, auditoria e verificação posterior.

## Modelo operacional

```text
SaaS local                         Central
──────────                         ───────
Manifesto de capacidades ───────► Catálogo e mapa funcional
Health/readiness/version ────────► Observações com validade
Eventos saneados/outbox ─────────► Inbox, auditoria e incidentes
                                  │
Executor local ◄───────────────── Comando autorizado e idempotente
Estado/resultado/evento ─────────► Acompanhamento, confirmação e histórico
```

## Contrato obrigatório de cada SaaS

Cada produto novo ou migrado deve fornecer um adaptador HUB com as seguintes capacidades mínimas.

### 1. Manifesto administrativo

`GET /.well-known/hub/manifest`

Contém:

- identidade e versão do produto;
- versão da Admin API;
- ambientes conhecidos;
- recursos e ações administrativas suportadas;
- eventos emitidos;
- scopes necessários;
- limites, timeout e política de idempotência;
- nível de compatibilidade;
- URLs de health, readiness, versão e comandos.

O manifesto descreve capacidade; não comprova disponibilidade.

### 2. Observabilidade verificável

- `GET /api/hub/v1/health`
- `GET /api/hub/v1/readiness`
- `GET /api/hub/v1/version`
- `GET /api/hub/v1/metrics/summary`

Toda observação armazenada na Central contém:

- produto, serviço e ambiente;
- fonte e horário observado;
- validade/TTL;
- resultado e latência;
- correlation ID;
- estado `confirmed`, `stale`, `unavailable` ou `not_integrated`;
- versão do contrato usado.

### 3. Comandos administrativos

- `POST /api/hub/v1/commands`
- `GET /api/hub/v1/commands/{command_id}`
- `POST /api/hub/v1/commands/{command_id}/cancel`, quando suportado.

Envelope mínimo:

- `command_id` global;
- `idempotency_key`;
- produto, ambiente e cliente/organização alvo;
- ação, recurso, parâmetros saneados e motivo;
- solicitante, aprovadores e scopes;
- risco, dry-run e prazo;
- correlation ID e versão do contrato.

Estados comuns:

`draft → validating → awaiting_confirmation → queued → executing → succeeded | partial_success | failed | cancelled | rolled_back`.

O executor do SaaS valida novamente autorização, contexto e regra local. A Central não força uma ação que o produto rejeite.

### 4. Eventos e resultados

O SaaS grava eventos em outbox local e os entrega à inbox da Central com tipo, versão, origem, ambiente, cliente, timestamp e chave idempotente. A Central aceita duplicidade com segurança e preserva eventos fora de ordem sem substituir silenciosamente estado mais novo.

Resultados de comandos informam progresso, itens processados, falhas por registro, evidências saneadas e possível compensação. O SaaS também registra localmente a decisão e o resultado recebidos da Central.

## Segurança da ponte

- Identidade própria por serviço/produto, nunca cookie de usuário compartilhado.
- Token curto ou assinatura assimétrica, com audience, scopes, validade e rotação.
- Segredos ficam em secret manager/variáveis do ambiente, nunca no navegador, payload persistido ou Git.
- Allowlist de ações declarada pelo manifesto e deny-by-default.
- Proteção contra replay com timestamp, nonce e idempotency key.
- Correlação e auditoria nos dois lados.
- Dados pessoais, tokens, conteúdo bruto de mídia e logs sensíveis são saneados antes do envio.
- Circuit breaker, timeout curto, retry com backoff e dead-letter; falha da ponte não derruba o SaaS.

## Experiência da Central

### Meu dia hoje

Primeira visão para o superadmin:

- falhas confirmadas e produtos sem informação recente;
- aprovações e comandos em execução;
- importações, tarefas e decisões pendentes;
- recomendações da IA ordenadas por impacto e confiança;
- atalhos para resolver ou delegar.

### Mapa do ecossistema

Agrupa os produtos por saúde real, integração e cobertura administrativa. Cada item mostra:

- ambiente e última verificação;
- origem e validade do dado;
- capacidades disponíveis, limitadas ou ausentes;
- número de clientes, usuários e operações;
- ações permitidas ao usuário atual;
- link para o SaaS 360.

### SaaS 360

Um produto reúne visão geral, ambientes, serviços, versões, capacidades, clientes, usuários, configurações, integrações, operações, erros, custos, segurança e auditoria. Abas sem contrato funcional aparecem como `Ainda não integrado`, não como listas vazias.

### Central de ação e resolução

O usuário pode pesquisar ou pedir por IA em linguagem natural, por exemplo:

- “Mostre os SaaS com erros desde ontem.”
- “Quais clientes do MediaMind estão próximos do limite?”
- “Simule a suspensão do usuário X.”
- “Explique por que esta integração está degradada.”
- “Prepare uma correção e os testes, sem aplicar.”

O assistente transforma a intenção em consulta ou comando estruturado, explica os termos, mostra fontes, risco e impacto, solicita confirmação quando necessário e acompanha o resultado. Prompts frequentes podem ser salvos como receitas autorizadas.

## Linguagem e UX

- `Tenant` aparece como `Cliente/organização`; o termo técnico pode ser mostrado como ajuda secundária.
- `Health` aparece como `Saúde`; `readiness`, como `Pronto para operar`; `stale`, como `Informação desatualizada`.
- Toda tela informa “o que é”, “para que serve” e “o que fazer agora”.
- A complexidade técnica fica em detalhes expansíveis, não na decisão principal.
- Busca global e paleta de comandos levam a páginas e ações reais.
- Estados obrigatórios: carregando, vazio, erro, sem permissão, indisponível, desatualizado, não integrado e sucesso verificável.

## Regra de conclusão funcional

Protótipo apenas visual só é permitido quando solicitado explicitamente e precisa ser identificado como tal. Fora disso, uma capacidade só conta como entregue quando possui:

- interface compreensível;
- API e persistência reais;
- autorização no backend e isolamento por cliente;
- auditoria e correlação;
- estados de erro e indisponibilidade;
- teste automatizado e jornada manual;
- prova do efeito prometido;
- documentação, status e rollback/compensação quando aplicável.

## Implementação incremental

### Fatia 1 — contrato e observações reais

- Modelar conexões, ambientes e observações na Central.
- Criar cliente Central para manifesto/health/readiness/version.
- Criar adaptador HUB no MediaMind.
- Implementar “Testar conexão” com diagnóstico por etapa.
- Mostrar origem, atualização e validade no Mapa/SaaS 360.

### Fatia 2 — comandos de ponta a ponta

- Evoluir `AdminOperation` para `AdminCommand` idempotente.
- Criar executor local no MediaMind com allowlist inicial de ações seguras.
- Implementar polling/evento de progresso e resultado.
- Gravar auditoria correlacionada nos dois produtos.
- Validar dry-run, confirmação, falha e retry.

### Fatia 3 — Home operacional e mapa funcional

- Reorganizar Home como “Meu dia hoje”.
- Criar mapa do ecossistema e cobertura de capacidades.
- Adicionar explicações em português e ajuda contextual.
- Integrar busca e comandos autorizados.

### Fatia 4 — resolução assistida por IA

- Ingerir somente logs/eventos saneados.
- Agrupar erros por fingerprint e correlacionar versões/mudanças.
- Gerar diagnóstico, evidência, proposta, testes e rollback.
- Executar apenas por pipeline autorizado e acompanhar canário.

### Fatia 5 — padrão para os próximos SaaS

- Extrair contrato, schemas, testes de conformidade e kit de adaptador.
- Inserir o adaptador no template de todo novo produto.
- Bloquear readiness de produto que declare uma capacidade sem passar o teste de contrato.

## Critérios de aceite da primeira ponte

1. A Central descobre o MediaMind pelo manifesto real.
2. Health, readiness e versão mostram fonte, ambiente e horário real.
3. Indisponibilidade do MediaMind deixa a Central degradada, sem quebrá-la.
4. Um comando dry-run é criado na Central, validado e processado no MediaMind.
5. Ambos registram o mesmo command/correlation ID.
6. A Central mostra aceitação, execução e resultado como estados diferentes.
7. Reenvio com a mesma chave não duplica o efeito.
8. Usuário sem scope recebe negação nos dois lados.
9. Nenhum segredo ou conteúdo sensível aparece na UI, logs ou auditoria.
10. Testes de contrato cobrem healthy, degraded, unavailable, incompatible e auth failed.

## Decisões

- A abordagem escolhida é híbrida: cockpit diário + mapa do ecossistema + SaaS 360 + centro universal de resolução.
- O MediaMind é o primeiro produto integrado, não um banco ou módulo interno da Central.
- A ponte será construída por fatias verticais completas, não por várias telas vazias.
- A execução começa por observabilidade e comando dry-run; automações destrutivas ficam bloqueadas até idempotência, confirmação e rollback estarem comprovados.
