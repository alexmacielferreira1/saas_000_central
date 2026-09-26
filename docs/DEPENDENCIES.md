# Dependências

Python 3.12.10 e Node 24.19.0 usados nesta máquina. PostgreSQL 16 via Docker Compose, banco por produto. `pyproject.toml` declara faixas; `requirements.lock` registra versões Python exatas instaladas. `setup` instala pelo lock e depois o projeto local sem resolver dependências novamente.

Backend: FastAPI, Uvicorn, SQLAlchemy 2, Pydantic Settings, psycopg e Alembic. Testes/verificação: pytest, httpx e ruff. Ver lock para versões e transitivas.

Frontend: `package.json` e `package-lock.json` preservam o SDK/plugin Base44 durante a migração progressiva. Instalação, build, lint, typecheck e Vitest foram verificados. Correções compatíveis do `npm audit` removeram severidades altas; permanecem 2 vulnerabilidades baixas e 2 moderadas ligadas à atualização potencialmente incompatível de React Router e `react-quill-new`. Não executar correção forçada sem revisão isolada de regressão.

Limitações: TestClient/Starlette emitem dois avisos de depreciação ligados a httpx/anyio; testes passaram. Build frontend relata ausência de configuração Base44 e bundle principal elevado. A auditoria de dependências não constitui aprovação de produção.

O remoto Git está configurado, mas teste local não prova CI verde nem publicação. Render/Neon permanecem fora do escopo sem autorização explícita.
