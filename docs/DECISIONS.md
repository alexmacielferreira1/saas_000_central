# Decisões específicas da Central

- A Central é control plane, não banco central dos domínios.
- Comunicação com SaaS ocorre por APIs/eventos autenticados e contratos versionados.
- Hierarquia administrativa: produto → segmento de cliente → função/cargo/perfil → exceção por usuário.
- Diagnóstico pode ser automático; correção estrutural, banco, auth, permissão ou produção exige aprovação e rollback.
- Criador de SaaS começa como planejamento/checklist; provisionamento cloud automático só depois de segurança e contratos validados.
