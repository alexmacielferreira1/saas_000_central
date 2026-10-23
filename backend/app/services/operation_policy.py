"""Politica de aprovacao de operacoes administrativas (fonte de verdade).

A UI le esta lista em ``GET /api/v1/operations/policy``; o fallback em
``frontend/src/lib/adminHelpers.js`` deve ser identico (teste de paridade).
Uniao revisada das listas antigas do backend e da UI, com equivalentes em portugues.
A correspondencia e por substring: na duvida, a operacao exige aprovacao humana.
"""

SENSITIVE_ACTION_TERMS: tuple[str, ...] = (
    "delete",
    "remove",
    "drop",
    "purge",
    "destroy",
    "suspend",
    "disable",
    "revoke",
    "block",
    "rotate",
    "reset",
    "force",
    "elevate",
    "downgrade",
    "grant",
    "provision",
    "decommission",
    "migrate",
    "close",
    "excluir",
    "exclusão",
    "apagar",
    "remover",
    "remoção",
    "suspender",
    "suspensão",
    "desativar",
    "desabilitar",
    "bloquear",
    "revogar",
    "redefinir",
    "rotacionar",
    "conceder",
    "elevar",
    "rebaixar",
    "provisionar",
    "descomissionar",
    "migrar",
    "encerrar",
    "fechar",
)


def is_sensitive_action(action: str) -> bool:
    normalized = (action or "").lower()
    return any(term in normalized for term in SENSITIVE_ACTION_TERMS)
