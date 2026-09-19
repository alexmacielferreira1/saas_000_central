# Estratégia de testes da Central

Este documento aplica o padrão global `../../_documentacao/standards/17-TESTING-STANDARD.md` à Central. É um roteiro progressivo; itens futuros não estão implementados nem aprovados.

## Baseline atual

M0 possui 23 casos executados e aprovados na última suíte completa. Eles cobrem liveness, versão, correlação, IDs inválidos, contrato de erros, disponibilidade do banco, cabeçalhos HTTP, referência pública de erro, cálculo dos gates, integridade auditada do frontend e banco PostgreSQL real. Build, lint e typecheck do frontend passaram. A validação funcional continua bloqueada pela configuração Base44 ausente.

## Cobertura planejada

| Marco | Áreas da Central |
|---|---|
| M1 | autenticação administrativa, usuários, papéis, tenants globais, auditoria e acesso de suporte |
| M2 | registro de produtos, connectors, Admin API, capabilities, readiness e eventos |
| M3–M4 | clientes, licenças, planos, entitlements, configurações, comandos e Tenant 360 |
| M5 | segurança ampliada, idempotência, concorrência, carga, alertas e regressão |
| M6–M7 | E2E em staging, backup/restauração, rollback, smoke pós-publicação e canários |

## Cenários críticos futuros

- MediaMind online, degradado, indisponível, lento, incompatível e com resposta inválida;
- timeout de um SaaS não derruba a Central nem bloqueia a consulta aos demais;
- `correlation_id`, produto e tenant são preservados ao atravessar o connector;
- comandos repetidos usam idempotência e nunca executam duas vezes por acidente;
- operação destrutiva exige autorização, motivo, confirmação e auditoria;
- suporte não assume identidade de cliente sem escopo, prazo e registro;
- tenant ou produto errado não pode ser consultado, alterado ou comandado;
- eventos duplicados, atrasados e fora de ordem são tratados explicitamente;
- capabilities e versões incompatíveis produzem estado visível, sem sucesso falso;
- Central continua útil quando um produto está fora do ar.

## Organização quando cada área nascer

Regras puras ficam em `backend/tests/unit/`. Banco, API e auditoria ficam em `backend/tests/integration/`. Connectors e Admin APIs ficam em `backend/tests/contract/`. Jornadas administrativas ficam em `tests/e2e/`. Todo connector terá doubles para ONLINE, DEGRADED, UNAVAILABLE, timeout, erro de protocolo e resposta malformada.

Marcadores previstos: `unit`, `integration`, `contract`, `security` e `slow`. Os testes rápidos não farão chamadas reais para SaaS, cloud ou provedores externos.
