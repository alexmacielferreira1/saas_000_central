# Próximas sessões — Central como plano de controle do HUB

Atualizado em 29/09/2026. Este documento preserva os pedidos recentes e os transforma em entregas verificáveis. Ele não declara como pronta nenhuma função ainda não implementada.

Contrato transversal de referência: [`../../_documentacao/standards/21-ADMIN-FORMS-DATA-ENTRY.md`](../../_documentacao/standards/21-ADMIN-FORMS-DATA-ENTRY.md).

## Estado já entregue

- Autenticação local e Google, estrutura multiempresa, catálogo de SaaS, integrações, operações, auditoria e centros administrativos iniciais.
- Áreas contextuais que abrem e resolvem na mesma tela, com persistência, versão e auditoria.
- Primeira fundação de Administração: estruturas organizacionais, vínculo de perfil/função/unidade e explicação do acesso efetivo.
- Primeira grade de importação estilo PowerQuery no frontend.

## Regra de aceite para todas as próximas entregas

Uma função somente pode ser marcada como concluída quando tiver interface compreensível, API, persistência, autorização no backend, isolamento por empresa, auditoria, estados de carregamento/erro/vazio/sem permissão e testes. Botões decorativos, dados falsos e páginas repetidas não contam. A ação principal deve abrir uma área contextual na própria página sempre que isso preservar a orientação do administrador.

## P0 — Administração universal

- [ ] Completar Pessoa → Conta → vínculo com empresa → Perfil → Função → Equipe → Setor → Unidade → Escopo → Exceção.
- [ ] Usuários: criar, convidar, editar, ativar, suspender, bloquear, reativar, exclusão lógica, troca/redefinição de senha, validade e histórico. **Parcial:** criação, edição de nome/papel, suspensão e reativação já estão persistidas, autorizadas e auditadas.
- [ ] Perfis: criar, editar, duplicar, comparar, clonar como base e personalizar por usuário sem alterar o perfil original.
- [ ] Matriz Perfil/Usuário × Produto × Módulo × Tela × Recurso × Ação.
- [ ] Explicar acesso efetivo, heranças, bloqueios e exceções; incluir simulador e comparação.
- [ ] Sessões/dispositivos, revogação de tokens, MFA/step-up, acesso temporário, break-glass, impersonação segura e campanhas de revisão.
- [ ] Visão 360° da empresa e do usuário, sempre filtrada no backend pelo tenant.

## P0 — Formulários e entrada de dados

- [ ] Construtor de formulários reutilizável por produto, empresa e processo, com campos, regras, condicionais, anexos e versão.
- [ ] Link público ou autenticado semelhante ao Google Forms para funcionário, cliente ou usuário preencher.
- [ ] Cada envio deve validar, pedir consentimento quando aplicável, criar/atualizar a entidade correta e manter protocolo e auditoria.
- [ ] Aprovação opcional antes de gravar; prevenção de duplicidade; webhook e notificação de resultado.
- [ ] Modelos iniciais por domínio: cadastro de usuário, funcionário, cliente, mídia/arquivo, configuração e solicitações internas.

## P0 — Excel, PowerQuery e operações em massa

- [ ] Upload CSV/XLSX → seleção de aba/tabela → mapeamento → transformação → validação → simulação → confirmação → processamento.
- [ ] Grade editável com tipos, campos obrigatórios, localizar/substituir, remover/renomear, dividir/combinar colunas, fórmulas simples e deduplicação.
- [ ] Receitas de transformação salvas e versionadas por produto/empresa.
- [ ] Processamento assíncrono persistente com progresso, resultado por linha, rejeitados, reprocessamento idempotente e rollback quando seguro.
- [ ] Importar e exportar usuários, pessoas, equipes, programas, produções, mídias, arquivos, metadados e configurações.
- [ ] Histórico de exportação com solicitante, filtros, classificação, retenção, LGPD e expiração do arquivo.

## P1 — Registro de telas e recursos

- [ ] Persistir ProductModule, Screen, ScreenSection, Widget, Action, ScreenRegistryVersion, ScreenConfiguration e ScreenOverride.
- [ ] Aplicar configuração em Global → Produto → Empresa → Departamento → Perfil → Usuário.
- [ ] Ocultar menu não basta: toda ação bloqueada na interface precisa ser bloqueada pela API.
- [ ] Feature flags globais e por plano/empresa/equipe/perfil/usuário, com beta, manutenção e rollout gradual.

## P1 — Ponte Central ↔ SaaS

- [ ] Contrato versionado de registro, manifest/capacidades, heartbeat, saúde e inventário de telas de cada SaaS.
- [ ] Comandos assinados, idempotentes e auditados; resultado devolvido à Central sem acesso direto ao banco do SaaS.
- [ ] Adaptador MediaMindAI inicial: empresas, usuários/equipes, telas/permissões, arquivos, IA, import/export, produção e métricas.
- [ ] Caixa de entrada e saída, retry, dead-letter, correlation ID e reconciliação de estado.
- [ ] Diferenciar claramente dado confirmado, atrasado, degradado, simulado e indisponível.

## P1 — Comercial e FinOps

- [ ] Plan, Subscription, Entitlement, PlanLimit, UsageRecord e CostRecord.
- [ ] Trial, ativo, pagamento pendente, vencido, tolerância, somente leitura, suspenso e cancelado.
- [ ] Limites e sobrescritas por empresa para usuários, storage, módulos, IA, APIs, integrações, importações e exportações.
- [ ] Painéis de receita, custos, consumo e alertas; nunca bloquear cliente por uma falha isolada de cobrança.

## P2 — IA, observabilidade e resolução

- [ ] AI Provider, modelos, chaves criptografadas, teste de conexão, roteamento, fallback, política, quota, tokens, latência e custo.
- [ ] Central de logs técnicos separada da auditoria, com tenant, serviço, severidade e correlation ID.
- [ ] Saúde real de frontend, backend, banco, workers, filas, storage, webhooks, integrações e provedores de IA.
- [ ] Agrupar logs correlatos em incidentes; IA gera evidências, diagnóstico, confiança, risco e proposta de solução.
- [ ] Níveis 0–4 de automação: detectar, recomendar, aprovar, autocorrigir ações reversíveis e executar playbooks aprovados.
- [ ] Toda remediação exige pré-checagem, snapshot quando aplicável, validação posterior, rollback e interrupção em regressão.
- [ ] Relatórios horários/diários/semanais/mensais e Central de Aprovações.
- [ ] Copiloto com comandos administrativos e respostas limitadas pelas permissões do operador.

## P2 — Operação avançada

- [ ] Jobs, workers, filas, retry, cancelamento e dead-letter.
- [ ] Releases, ambientes, janelas de manutenção, notificações, alertas e página interna de status.
- [ ] Arquivos: propriedade, classificação, autorização, quarentena, retenção, restauração e histórico de acesso.
- [ ] Pesquisa global e paleta de comandos para empresa, usuário, arquivo, incidente, log, job, integração e identificadores.

## P3 — Segurança, LGPD e continuidade

- [ ] Security Center, inventário de secrets/API keys/OAuth, tentativas de login e atividades suspeitas.
- [ ] LGPD: bases legais, consentimentos, solicitações do titular, retenção, anonimização, exclusão e portabilidade.
- [ ] Backups, testes de restauração, DR, RPO/RTO, contratos, propriedade, transferência e desligamento seguro do produto.
- [ ] Quarentena e modo manutenção por sistema, empresa, módulo e funcionalidade.

## Ordem recomendada de execução

1. Completar Administração/IAM e visões 360°.
2. Tornar Import/Export persistente e entregar Form Builder.
3. Entregar Screen Registry e autorização por ação.
4. Fechar a ponte Central ↔ MediaMindAI com dados e comandos reais.
5. Completar comercial/FinOps.
6. Entregar observabilidade, incidentes, IA e remediação segura.
7. Fechar segurança, LGPD, backup e portabilidade.

## Resultado esperado

A Central deve permitir responder e agir, no mesmo contexto: quem acessa o quê; qual empresa ou serviço está com problema; qual dado é atual e confiável; quanto cada empresa consome; quais chaves e integrações falham; qual solução é segura; quem aprovou; o que mudou; e como desfazer. O padrão deve ser reaproveitável nos demais SaaS sem copiar regras específicas do MediaMindAI.
