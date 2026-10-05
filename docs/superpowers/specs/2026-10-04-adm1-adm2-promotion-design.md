# Adm 1, Adm 2 e promoção gradual para a Central

Data: 04/10/2026

## Objetivo

Separar claramente a Central existente das novas referências recebidas no pacote `001_melhorar central`, permitindo experimentar, conectar e validar novas telas sem misturar, substituir ou perder o que já funciona. Funcionalidades comprovadas serão promovidas ao app principal; alternativas sem utilidade serão aposentadas de forma recuperável depois de comparação e registro.

## Princípio operacional

```text
Adm 1 — estado atual preservado
       ↓ comparação
Adm 2 — laboratório das novas referências
       ↓ integração e validação
App principal — funcionalidades promovidas
       ↓ equivalência comprovada
Arquivo recuperável — alternativas não utilizadas
```

Adm 1 e Adm 2 são workspaces temporários de evolução. O destino final é um app principal simples, sem duplicações permanentes.

## Adm 1

Adm 1 reúne a navegação e as telas atuais da Central:

- Home do ecossistema;
- mapa de controle;
- Central de Resolução;
- guias de API;
- SaaS 360;
- Administração;
- governança de telas;
- configurações;
- operações e jobs;
- auditoria, incidentes, integrações e saúde;
- importação, planos, custos, IA, storage, releases, segurança, privacidade, continuidade e documentação.

Regras:

- componentes e URLs existentes continuam funcionando;
- rotas antigas não são renomeadas em massa;
- nenhum comportamento atual é removido para abrir espaço ao Adm 2;
- o menu unificado de Adm 1 aponta para as rotas atuais por compatibilidade.

## Adm 2

Adm 2 recebe exclusivamente as novas referências visuais e funcionais:

- Minha manhã;
- Panorama;
- SaaS/Produtos e detalhe 360;
- Clientes/Empresas;
- Usuários e Acessos;
- Configurações e Flags;
- Ocorrências, Error Center e Central de Decisões;
- Automações e IA;
- Jobs e Processos;
- Health Center;
- Integrações;
- Segurança;
- Financeiro, custos e uso;
- importação;
- formulários;
- relatórios;
- documentação e runbooks;
- auditoria.

Rotas novas usam o prefixo `/adm2`. O primeiro nível será `/adm2`, com navegação interna própria. Telas Adm 2 podem reutilizar APIs e componentes do Adm 1, mas não podem importar dados fictícios para parecer completas.

## Navegação

O menu lateral global terá duas entradas administrativas explícitas:

- `Adm 1 — Atual`;
- `Adm 2 — Evolução`.

Ao entrar em um workspace, um menu interno mostra suas áreas. O seletor permanece visível para alternar entre os dois. Busca, tenant, usuário e logout continuam compartilhados.

O menu global não deve renderizar simultaneamente dezenas de entradas dos dois workspaces.

## Dados e estados

Cada card, indicador, tabela e ação do Adm 2 recebe uma das classificações:

- `REAL`: origem, contrato e evidência identificados;
- `PARCIAL`: parte real e parte ainda não integrada;
- `DEMO`: exemplo explicitamente rotulado e restrito ao desenvolvimento;
- `PLANEJADO`: UI ou capacidade ainda sem backend;
- `INDISPONIVEL`: backend ou dependência indisponível;
- `BLOQUEADO`: decisão ou dependência impede avanço.

Números, nomes, custos, saldos, incidentes, usuários, tarefas, uso, saúde ou consumo não podem ser inventados para preencher as telas.

Quando um valor real não existir, a UI mostra `Não integrado`, `Não configurado`, `Indisponível` ou estado vazio orientativo.

## Primeira entrega

O primeiro lote cria apenas a estrutura segura:

1. seletor Adm 1/Adm 2;
2. menu interno do Adm 1 apontando para todas as rotas atuais;
3. rota `/adm2` e shell visual independente;
4. catálogo de módulos do Adm 2 com estados reais de implementação;
5. páginas iniciais Minha manhã, Panorama e SaaS/Produtos usando somente APIs existentes ou estados de indisponibilidade;
6. testes de isolamento das rotas e compatibilidade das URLs antigas.

Não serão criados ainda AI Gateway, provedores pagos, jobs novos, custos estimados ou dados demonstrativos tratados como reais.

## Promoção ao app principal

Uma tela ou funcionalidade do Adm 2 só pode ser promovida quando:

1. possui contrato backend real;
2. persistência e reload foram comprovados quando aplicáveis;
3. autorização backend, tenant e auditoria foram verificados;
4. loading, vazio, erro, proibido e indisponibilidade estão tratados;
5. testes frontend e backend pertinentes passam;
6. fluxo visual foi conferido no navegador;
7. comparação registra o que substitui ou complementa;
8. rollback ou retorno ao comportamento anterior está documentado.

A promoção move a entrada para a navegação principal e registra a origem `Adm 1`, `Adm 2` ou composição de ambas. Não copiar duas implementações equivalentes para o app final.

## Aposentadoria e remoção

Depois da promoção:

1. inventariar arquivos, rotas, testes e dados candidatos;
2. comprovar que não são a única fonte de requisito ou comportamento;
3. registrar substituto canônico e evidência de equivalência;
4. preservar fontes, ZIPs, imagens, tag `base44-export` e documentação histórica;
5. mover código/telas aposentados para arquivo recuperável quando necessário;
6. executar testes sem o candidato ativo;
7. marcar `SAFE_TO_REMOVE` somente após revisão;
8. fazer exclusão definitiva apenas por lote explicitamente confirmado.

Não apagar automaticamente legado, arquivos pessoais, fontes recebidas, dados, volumes ou elementos de outros projetos.

## Estrutura técnica

Componentes propostos:

- `AdminWorkspaceChooser`: seletor Adm 1/Adm 2;
- `Adm1Workspace`: catálogo navegável das rotas atuais;
- `Adm2Layout`: shell e menu interno do laboratório;
- `Adm2Overview`: catálogo de módulos e estado de integração;
- `Adm2Home`, `Adm2Panorama`, `Adm2Products`: primeiro lote visual;
- `adm2Registry`: metadados de navegação, estado, origem e rota, sem números de negócio;
- rotas `/adm1`, `/adm2`, `/adm2/panorama`, `/adm2/saas` e `/adm2/saas/:id`.

`/adm1` funciona como índice do atual; as URLs atuais permanecem canônicas durante a fase de transição.

## Testes

- URLs antigas continuam renderizando os componentes atuais;
- Adm 1 lista todas as rotas atuais sem duplicar implementação;
- Adm 2 não importa fixtures de negócio nem SDK Base44;
- páginas Adm 2 exibem estados indisponíveis quando a API não fornece o dado;
- alternância entre workspaces preserva tenant e sessão;
- permissões atuais continuam aplicadas;
- nenhum menu aponta para rota inexistente;
- build, lint e typecheck continuam passando;
- testes de páginas e rotas cobrem navegação e isolamento.

## Segurança e limites

- Nenhuma operação em GitHub, Render, Neon ou produção.
- Nenhum provedor pago é ativado ou contratado.
- Nenhum secret é criado, copiado ou exposto.
- AI Gateway e módulos futuros permanecem `PLANEJADO` até especificação própria.
- A raiz HUB não recebe Git; alterações de produto permanecem no repositório da Central.
- Alterações existentes do usuário não são incorporadas ou descartadas silenciosamente.

## Critério de pronto do primeiro lote

- Adm 1 e Adm 2 são visualmente e estruturalmente distintos;
- toda navegação atual está acessível por Adm 1 e pelas URLs antigas;
- Adm 2 contém apenas o primeiro lote e catálogo honesto dos módulos futuros;
- dados exibidos no Adm 2 são reais ou explicitamente indisponíveis;
- suíte direcionada, lint, typecheck e build passam;
- comparação e próximos lotes estão documentados.
