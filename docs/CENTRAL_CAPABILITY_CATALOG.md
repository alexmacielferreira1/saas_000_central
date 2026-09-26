# Catálogo de capacidades da Central SaaS

Este documento reúne as telas, fluxos e capacidades administrativas planejadas para a Central. Ele descreve o destino do produto, não afirma que as funções estão implementadas. A Central controla e observa os SaaS por contratos; não acessa diretamente os bancos operacionais deles.

## Proveniência e cobertura

Este catálogo consolida, sem substituir, as fontes integrais abaixo:

- `../../_documentacao/Saas atualização 14092026.pdf`: páginas 154–189 (Administração e Reliability), 233–345 (busca, governança, constituição e catálogo do HUB) e 410–525 (especificação detalhada da Central e lifecycle dos SaaS);
- `../../_documentacao/AJUSTAR SAAS 16092026.pdf`: páginas 653–680 (Administração, usuários, perfis, permissões, telas, formulários e importação/exportação);
- `../../_documentacao/SOURCE_INTAKE_2026-09-25_TWO_MASTER_PDFS.md`: mapa integral das 1.591 páginas, classificação e destino de implementação.

Trechos repetidos foram reunidos numa única capacidade. Exemplos de UI, fornecedores e comandos históricos continuam como referência. Nenhum deles autoriza automaticamente alteração de produção, cloud, segredo ou código.

## 1. Home executiva

- visão consolidada de produtos, tenants, usuários, ambientes e receita;
- saúde geral, incidentes, custos, consumo de IA, storage e jobs;
- pendências que exigem decisão humana;
- atalhos por permissão e contexto;
- comparação entre staging e produção;
- feed de eventos relevantes e mudanças recentes.

## 2. Catálogo e SaaS 360

- lista de produtos, owners, versão, ambientes, status e capabilities;
- visão 360 de cada SaaS com saúde, tenants, serviços, integrações, custos e histórico;
- dependências compartilhadas e dedicadas;
- lifecycle: draft, provisioning, active, degraded, maintenance, suspended, archived, transfer e decommissioning;
- compatibilidade de contrato e versões;
- documentação, runbooks, repositório, deploy e contatos responsáveis.

## 3. Criador de novo SaaS

O primeiro estágio é um assistente de planejamento e geração controlada, não provisionamento irrestrito.

Etapas propostas:

1. identidade do produto, domínio, owners e finalidade;
2. seleção de capacidades compartilhadas;
3. definição de tenants, personas, papéis e dados sensíveis;
4. escolha da base visual/referências sem copiar domínio de outro produto;
5. geração do pacote documental e estrutura do repositório;
6. configuração de portas, banco, storage e ambientes;
7. checklist de GitHub, Render, Neon, DNS e secrets;
8. testes, segurança, readiness e aprovação;
9. registro na Central após o contrato mínimo funcionar.

Saídas: plano, arquivos iniciais, manifests, checklist, tarefas e relatório de conflitos. A criação automática de cloud fica bloqueada até service identities, escopos, idempotência, quotas e rollback estarem comprovados.

## 4. Tenant 360 e clientes

- empresas, grupos econômicos, tenants e vínculos com produtos;
- planos, módulos, limites, contratos e entitlements;
- usuários, equipes, departamentos e responsáveis;
- ambientes, integrações, consumo e custos;
- lifecycle do tenant, suspensão, exportação e exclusão controlada;
- impacto antes de ações destrutivas;
- portabilidade e histórico administrativo sem copiar dados operacionais privados.

## 5. Pessoas, perfis e acessos

- usuários globais e contas por produto;
- convites, bloqueio, suspensão, reativação e expiração;
- funções, cargos, perfis, grupos, equipes e parceiros;
- permissões por produto, tenant, módulo, tela, aba, ação e recurso;
- exceções por usuário com prazo e motivo;
- acesso temporário, step-up authentication, MFA e break glass;
- simulação segura de permissão efetiva;
- comparação de acesso esperado versus concedido;
- trilha completa de quem concedeu, alterou ou revogou acesso.

## 6. Governança de telas e módulos

- Screen Registry de produtos, módulos, telas, abas, widgets e ações;
- capability manifest informado por cada SaaS;
- ativação por plano, tenant, perfil ou feature flag;
- herança explícita: produto → segmento → tenant → departamento → perfil → usuário;
- preview do efeito antes de publicar uma regra;
- detecção de configurações órfãs ou incompatíveis;
- nenhuma configuração da Central substitui autorização real do backend do SaaS.

## 7. Central de ajustes fáceis

Uma interface simples para mudanças operacionais autorizadas, sem editar banco ou `.env` manualmente.

- branding, textos, contatos, timezone, idioma e formatos;
- módulos, limites, quotas, notificações e retenção;
- integrações e callbacks por ambiente;
- feature flags e parâmetros de comportamento;
- templates de e-mail, formulários e workflows;
- validação, preview, diff antes/depois e data de vigência;
- aprovação adicional para configurações sensíveis;
- versionamento, rollback e auditoria;
- indicação clara de onde a configuração é herdada.

Secrets permanecem em cofre/variáveis protegidas; a UI mostra somente referência e estado, nunca o valor completo.

## 8. Importação e exportação em massa

- Excel, CSV e formatos adicionais por adapter;
- upload seguro, limites, antivírus e checksum;
- preview sem persistência;
- seleção de planilha/tabela e linha de cabeçalho;
- mapeamento visual de colunas;
- validação de tipo, obrigatoriedade, domínio, relacionamento e duplicidade;
- dry run com resumo de criação, atualização, conflito e rejeição;
- idempotência, retomada, cancelamento e progresso;
- resultado por linha, arquivo de erros e histórico;
- exportação filtrada, incremental e adequada à LGPD;
- regras específicas executadas pelo SaaS proprietário.

## 9. Experiência “Power Query simplificada”

A Central deve oferecer uma grade de preparação de dados compreensível para usuários administrativos:

- renomear, remover, ordenar e combinar colunas;
- alterar tipos e formatos;
- localizar/substituir, aparar espaços e normalizar acentos;
- dividir ou concatenar campos;
- preencher valores, aplicar condicionais e tabelas de correspondência;
- filtrar e deduplicar;
- detectar chaves e relacionamentos;
- salvar receitas versionadas por produto/tipo de importação;
- mostrar amostra, erros e efeito de cada etapa;
- desfazer/refazer e comparar origem com resultado;
- executar transformações em sandbox antes de gravar.

O motor comum prepara os dados. O SaaS valida e persiste suas entidades por API. A Central não escreve diretamente no banco do produto.

## 10. Formulários e automações administrativas

- construtor de formulários com schema e versão;
- campos, validações, dependências e condições;
- publicação por produto/tenant/perfil;
- aprovação e vigência;
- integração com importação, workflows e notificações;
- histórico de respostas e alterações conforme retenção;
- acessibilidade e preview responsivo.

## 11. Service Registry e integrações

- produtos, serviços, ambientes, instâncias, versões e endpoints;
- dependencies e health checks;
- service identities, audience e scopes;
- webhooks, eventos, connectors e credenciais referenciadas;
- timeouts, retries, circuit breakers e estado degradado;
- matriz shared versus dedicated;
- compatibilidade e janela de depreciação de contratos.

## 12. Centro de operações

- visão de health, readiness, latência, erros, filas, workers e storage;
- deploys, migrations, versões e release health;
- jobs travados, retries, DLQ e reprocessamento autorizado;
- manutenção, feature flags e comandos operacionais;
- correlação ponta a ponta entre Central e SaaS;
- runbooks e responsáveis;
- canário e rollback.

## 13. Pasta/caixa de entrada de erros para IA

A “pasta de erros” é uma caixa de entrada lógica e segura, alimentada por eventos sanitizados. Pode ter exportação controlada para arquivos, mas não deve depender de uma pasta local compartilhada nem receber dumps com secrets.

Cada item registra:

- produto, ambiente, serviço e versão;
- timestamp, fingerprint, severidade e frequência;
- correlation/request ID;
- rota/job/ação afetada;
- mensagem pública e evidências saneadas;
- primeiro/último evento e usuários/tenants impactados em forma agregada;
- deploy ou mudança relacionada;
- estado do incidente e owner.

## 14. IA de diagnóstico e correção segura

Fluxo obrigatório:

```text
Evento sanitizado
  -> agrupamento/fingerprint
  -> impacto e prioridade
  -> IA reúne logs, métricas, deploy e testes relacionados
  -> hipótese com evidências e confiança
  -> reprodução em ambiente isolado
  -> branch/diff de correção
  -> testes + security scan
  -> preview/staging
  -> aprovação humana conforme risco
  -> canário
  -> observação
  -> conclusão ou rollback
```

A IA pode executar automaticamente apenas remediações operacionais pré-aprovadas, reversíveis e limitadas, como tentar novamente um job idempotente, reiniciar um worker definido por política ou desativar uma feature flag específica. Alterações em código, banco, autenticação, permissões, dados ou produção exigem gate humano e rollback.

Nunca enviar para o diagnóstico:

- cookies, tokens, senhas ou chaves;
- connection strings privadas;
- corpo integral de requisições;
- prontuários, documentos ou mídia confidencial;
- dados pessoais quando identificadores agregados bastarem.

## 15. Incidentes, problemas e conhecimento operacional

- incidente, impacto, timeline e comunicação;
- agrupamento de incidentes em problema;
- causa raiz, workaround, correção e prevenção;
- Known Error Database;
- ações corretivas/preventivas e responsáveis;
- post-incident review;
- vínculo com commits, deploys, testes e rollback;
- aprendizado da IA baseado em evidências aprovadas, não em suposições.

## 16. Notificações e tarefas

- inbox administrativa por prioridade;
- e-mail, push, webhook e canais configuráveis;
- escalonamento, SLA e plantão;
- preferências por usuário e tenant;
- deduplicação e silêncio controlado;
- tarefas geradas por incidentes, imports, aprovações e lifecycle.

## 17. Planos, entitlements, billing e usage

- produtos, planos, addons, limites e período de vigência;
- módulos e capabilities contratadas;
- medição de usuários, storage, IA, jobs, mensagens e integrações;
- alertas de quota e prevenção de estouro;
- conciliação entre uso medido e faturado;
- alteração de plano com simulação de impacto;
- suspensão sem apagar dados;
- billing como módulo separado das regras operacionais dos SaaS.

## 18. FinOps

- custo por produto, tenant, ambiente e serviço;
- divisão entre compartilhado e dedicado;
- IA por modelo/provedor/tarefa;
- storage, banco, rede, workers, e-mail e observabilidade;
- orçamento, previsão, anomalia e tendência;
- custo por funcionalidade ou job quando rastreável;
- recomendação de otimização com confirmação humana.

## 19. Backup, restore e disaster recovery

- inventário de bancos, buckets, arquivos e configurações;
- último backup e último restore realmente testado;
- RPO/RTO por produto;
- criptografia, retenção e localização;
- exercícios e evidências;
- restauração por produto e, quando viável, tenant;
- plano de continuidade quando Central ou serviço compartilhado estiver indisponível.

## 20. Segurança, auditoria e LGPD

- Security Center e riscos por produto/ambiente;
- sessões, MFA, acessos privilegiados e anomalias;
- auditoria append-only com busca e exportação controlada;
- inventário de dados, finalidade, base legal e classificação;
- retenção, portabilidade, anonimização e eliminação;
- solicitação do titular e evidência de atendimento;
- secrets, certificados e rotações sem exibir valores;
- segregação de deveres e dupla aprovação onde necessário.

## 21. Busca universal e command palette

- pesquisa de produtos, tenants, usuários, serviços, incidentes, configurações e documentação;
- Search, Action e Vocabulary Registries;
- linguagem natural convertida em consulta ou ação proposta;
- resultados filtrados por permissão;
- ações com preview, confirmação e auditoria;
- deep links para telas de detalhe.

## 22. Relatórios e documentação viva

- relatórios operacionais, segurança, custos, uso e conformidade;
- documentação de APIs, capabilities e versões;
- runbooks, decisões e ADRs;
- status de implementação versus telas planejadas;
- evidências de testes e homologação;
- exportação sem expor dados além do escopo autorizado.

## 23. Portabilidade e transferência

- detachment test por SaaS;
- mapa de banco, storage, domínio, secrets, serviços e owners;
- exportação e validação de integridade;
- migração de shared para dedicated;
- transferência de propriedade e revogação de acessos antigos;
- operação do SaaS sem dependência da Central.

## Ordem de entrega

1. C0/C1: baseline, sessão, tenant, permissões e auditoria.
2. C2/C3: Product/Service Registry e contratos Central ↔ SaaS.
3. Administração de pessoas, perfis, telas e ajustes fáceis.
4. Importação/exportação e Power Query simplificada.
5. Centro de operações, caixa de erros e incidentes.
6. Diagnóstico por IA com correção segura e aprovação.
7. Lifecycle, entitlements, usage e FinOps.
8. Backup/restore, LGPD, portabilidade e detachment.
9. Criador de SaaS com automação progressiva e controlada.

## Regra de conclusão

Uma tela não está pronta porque abre ou contém botões. Precisa de API, persistência, autorização, estados de erro/loading, auditoria, testes e evidência. Funções destrutivas ou de produção também precisam de confirmação, idempotência e rollback.
