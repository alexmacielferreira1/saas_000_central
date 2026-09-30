# Escopo obrigatório de execução dos PDFs mestres

Fontes normativas:

- `../_documentacao/Saas atualização 14092026.pdf`
- `../_documentacao/AJUSTAR SAAS 16092026.pdf`

Os caminhos acima são relativos à raiz do HUB; as fontes originais permanecem imutáveis. Este documento não substitui a matriz página a página existente nem autoriza antecipar marcos bloqueados.

## Regra de execução

A auditoria inicial já existe. Para cada bloco permitido pelo marco atual, executar **alterar → conectar → testar → corrigir → documentar**. Uma tela, model, endpoint ou botão isolado não conclui capacidade. Produção, GitHub, Render e Neon permanecem protegidos e exigem autorização explícita.

## Cobertura que não pode ser esquecida

1. Control Plane real: conexões, ambientes, observações, Manifest, Health e primeiro conector MediaMind.
2. Operações administrativas reais: aprovação, idempotência, retry, reconciliação e auditoria distribuída.
3. Migração progressiva do Base44 somente após substituição nativa comprovada.
4. Incidentes e Resolution Center nativos.
5. Administração completa: pessoa, conta, membership, perfil, função, equipe, setor, unidade, escopo e exceções temporárias.
6. Screen Registry: produto → módulo → tela → seção → widget → aba → ação; herança, versão, preview, diff, publicação e rollback.
7. Comercial: produto, plano, assinatura, entitlement, billing, uso, custo, receita e margem sem números fictícios.
8. Contratação e provisionamento rastreável, sem simular criação externa.
9. Importação persistente com mapping, validação, job, erros por linha, reprocessamento e auditoria.
10. Tenant 360, SaaS 360, Resource Explorer e Home operacional com origem/horário dos dados.
11. Governança de IA: providers, modelos, políticas, permissões, consumo, custos, quotas e auditoria.
12. Segurança, segredos, LGPD, retenção, portabilidade e separação de produto.
13. Formulários internos e mídia em massa conectados aos produtos, sem armazenar mídia pesada na Central.
14. Criador de SaaS com checklist e estados verificáveis, automatizando apenas integrações autorizadas.
15. Tradução dos termos técnicos na UI sem alterar contratos internos.

## Critério de conclusão

Quando aplicável: persistência + migration + schema + serviço + API + autorização + isolamento + frontend + loading/erro + auditoria + teste. Ausência de qualquer elemento necessário mantém o requisito como parcial.

## Ordem vigente

Respeitar `CENTRAL_MASTER_IMPLEMENTATION_CHECKLIST.md`, `CENTRAL_SCREEN_IMPLEMENTATION_MATRIX.md`, `CENTRAL_IMPLEMENTATION_PLAN.md`, `docs/PROJECT_STATUS.md` e `project-status.json`. M0 parcial não autoriza executar indiscriminadamente fases posteriores; requisitos fora do gate permanecem rastreados, não esquecidos.
