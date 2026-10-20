# Estado dos workspaces Adm 1 e Adm 2

Atualizado em 04/10/2026.

## Entregue no primeiro lote

- `Adm 1 — Atual`: índice de todas as rotas anteriores, sem copiar suas implementações.
- `Adm 2 — Evolução`: shell visual isolado e catálogo com os estados `REAL`, `PARCIAL`, `PLANEJADO`, `INDISPONIVEL` e `BLOQUEADO`.
- Minha manhã: produtos e resumo da Central; operações e incidentes ausentes aparecem como `Não integrado`.
- Panorama: reorganiza exclusivamente as métricas de `/home/summary`.
- SaaS e produtos: lista `/saas`, identifica o filtro como local e abre o detalhe canônico em `/saas/:id`.
- Menu global reduzido a Home, Adm 1 e Adm 2. Todas as URLs antigas continuam válidas.

## Ainda não promovido

Clientes, usuários/acessos, ocorrências/decisões, automações/IA, jobs/processos, financeiro, relatórios e documentação continuam planejados ou bloqueados no registry. Nenhum deles possui link ativo no Adm 2.

## Regra de promoção

Uma função só sai dos workspaces e entra no aplicativo principal depois de comprovar contrato backend, persistência quando aplicável, autorização por tenant, auditoria, estados de loading/vazio/erro/proibição, testes, validação no navegador e rollback documentado.

## Regra de aposentadoria

Nada foi apagado neste lote. Candidatos futuros devem ter substituto canônico e equivalência comprovada antes de receber `SAFE_TO_REMOVE`; fontes, ZIPs, imagens, Word, Base44 histórico e documentação de origem permanecem preservados.

## Evidência automatizada

- suíte direcionada: 97 testes aprovados;
- suíte frontend completa: 142 testes aprovados;
- lint, typecheck e build: aprovados;
- backend, banco, GitHub, Render, Neon e produção: não alterados.
