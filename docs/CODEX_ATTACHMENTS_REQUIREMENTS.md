# Requisitos da Central recuperados dos anexos do Codex

Fonte consolidada: `../../_documentacao/CODEX_ATTACHMENTS_REQUIREMENTS_CONSOLIDATED_2026-09-29.md`.  
Manifesto: `../../_documentacao/CODEX_ATTACHMENTS_SOURCE_MANIFEST_2026-09-29.md`.

Este documento é uma ponte para execução. O checklist mestre continua sendo a fila autoritativa e nenhum item abaixo está concluído sem código, API, persistência, autorização, auditoria e testes.

## Trilhas obrigatórias

| Trilha | Resultado funcional esperado | Destino de execução |
|---|---|---|
| Control Plane | conexão autenticada, manifest, health, recursos, comandos e reconciliação por SaaS | fases 3–4 do checklist mestre |
| Administração | Pessoa → Conta → Membership → Perfil → Função → Equipe → Setor → Unidade → Escopo → Exceção | fase 2 |
| Segurança | sessões/dispositivos, MFA/step-up, break-glass, acesso temporário, access review, secrets e acesso efetivo explicável | fases 1, 2 e 9 |
| Screen Registry | módulo, tela, seção, widget, ação, versão, configuração e override hierárquico | fase 2 |
| Tenant/SaaS 360 | visão real de produto, ambiente, versão, cliente, plano, usuários, saúde, uso, custo e histórico | fases 3 e 8 |
| Dados | PowerQuery simplificado, formulários, import/export, receitas, dry-run, rejeitados e histórico | fase 5 |
| Operação | jobs, filas, erros, incidentes, problemas, reliability, releases, maintenance e alertas | fase 6 |
| Resolução | logs → diagnóstico IA → proposta → aprovação → operação → validação → regressão | fase 6 |
| Comercial | Plan, Subscription, Entitlement, UsageRecord e CostRecord | fase 8 |
| IA | provider, modelo, política, quota, custo, auditoria e Resolution Engine | fases 6–8 |
| Governança | LGPD, contratos, backup/restore, DR, propriedade, portabilidade e detachment | fase 9 |

## Regra de experiência administrativa

- Priorizar expansão, painel lateral e seção rolada para investigar e resolver no mesmo contexto.
- Não transformar a Home ou SaaS 360 em uma coleção de links.
- Cada centro precisa ter dados e ações próprios, não cartões genéricos repetidos.
- Usar português claro, explicar termos técnicos e mostrar origem/frescor da informação.
- Indicador sem telemetria real deve dizer `sem dados` ou `não integrado`, nunca simular saúde.
- Ações sensíveis exigem escopo, confirmação, idempotência, auditoria e resultado verificável.

## Contrato com o MediaMind e futuros SaaS

- A Central consome APIs/manifestos; não acessa bancos internos.
- O SaaS declara capabilities e ações permitidas.
- Comandos incluem correlation ID, ator, tenant, ambiente, dry-run quando aplicável e chave idempotente.
- Eventos de health, uso, custo, erro e auditoria são versionados e reconciliáveis.
- O SaaS continua operando se a Central estiver indisponível.
- A primeira integração completa deve ser Central ↔ MediaMind e servir como contrato de referência, sem copiar o domínio audiovisual para a Central.

## Fontes únicas principais

- `0FD53E3BADF1`: controle administrativo do MediaMind pela Central.
- `72794C6DE81A`, `EFA5E13D9A30`: escopo funcional amplo da Central.
- `7FB7E5C1557A`, `F5788C7BD372`, `E6C9CBC16EA6`: lacunas do Control Plane e ordem de implementação.
- `EB9D48BED08C`: administração de usuários, funções, permissões, telas e módulos.
- `6FE0D7858698`: padrão HUB, criação de SaaS e importação/formulários.
- `A5A89C4F348A`: prioridades gerais do portfólio.

As hashes completas e os caminhos estão no manifesto do HUB.
