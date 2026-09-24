# Handoff da Central

- Estado: segundo produto do HUB, ainda em M0 e sem publicação confirmada.
- Revalidação de 22/09/2026: backend com 22 testes aprovados, 1 integração omitida e 2 avisos deprecatórios; frontend com lint, typecheck e build aprovados.
- O build ainda emite aviso de configuração Base44 ausente e bundle principal elevado; isso não comprova funcionamento local.
- C0 iniciado: Vitest e cobertura V8 adicionados; contrato das 4 rotas públicas e 11 administrativas protegido por 3 testes.
- Baseline de cobertura do frontend: 4,05% statements, 0,18% branches, 0,27% functions e 4,42% lines. Não declarar cobertura adequada.
- Dependências: correções compatíveis do `npm audit` aplicadas; restaram 2 vulnerabilidades baixas e 2 moderadas ligadas a React Router/Quill, cuja correção automática é incompatível e não deve ser forçada.
- Base técnica local existe; validação funcional sem Base44 continua bloqueada.
- Padrão de entrada: `../../_documentacao/HUB_PLATFORM_STANDARD.md`.
- Plano executável: `CENTRAL_IMPLEMENTATION_PLAN.md`.
- Próximo bloco: ampliar C0 com smoke da aplicação, autenticação e baseline visual; depois iniciar C1 por sessão/tenant em fatia vertical.
- Preservar independência de bancos e não copiar o domínio audiovisual do MediaMind.
- Não há remote Git configurado na Central; não tentar publicar até o alvo ser confirmado.
