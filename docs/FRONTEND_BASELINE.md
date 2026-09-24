# Baseline histórico do frontend original

Esta seção registra a primeira verificação do export, antes das correções auditadas posteriores. Naquele momento, em 19/09/2026, nenhum arquivo do export havia sido alterado.

- Central (porta 5174): rota /login abriu com formulário “Welcome back”, e-mail e senha.
- MediaMind (porta 5173): rota /login abriu com marca MediaMind AI, formulário e acesso rápido por papel explicitamente marcado como demonstração.
- Ambos: console registra falhas 404 no SDK Base44 e na consulta de configurações públicas. O ZIP não traz as variáveis de ligação com a Base44.
- Ambos: build compila; isso não comprova autenticação nem operações reais.
- Verificações de tipos falham nos dois exports. Lint da Central também falha; lint do MediaMind passou na primeira execução.

## Estado atual da Central

Depois desse baseline, 25 arquivos receberam correções de tipos ou imports sem intenção de alterar a interface. Os hashes e motivos estão em `docs/history/frontend-approved-changes.json`; a tag `base44-export` continua preservando o original. Build, lint e typecheck agora passam. A validação funcional continua bloqueada porque a configuração Base44 não foi fornecida.

O Vite carrega essa configuração a partir de `frontend/.env.local`. O arquivo versionado `frontend/.env.example` contém apenas os nomes esperados e placeholders vazios; valores reais e credenciais permanecem locais.

Não foram fornecidas credenciais, feitas publicações ou alterados dados externos. Não foi desligada autenticação para contornar o erro. A ligação das telas às APIs FastAPI ainda não foi implementada.

## Tratamento

Preservar o estado original como baseline. A tag `base44-export` e `docs/history/base44-manifest.json` comprovam o conteúdo recebido. Correções intencionais posteriores devem constar em `docs/history/frontend-approved-changes.json` com hash original, hash aprovado e motivo; qualquer hash diferente continua falhando no readiness. Não desabilitar typecheck/checkJs nem ocultar falhas para aprovar o marco.

A lista atualizada de verificações e seus logs está em PROJECT_STATUS.md e .runtime/checks/.
