from app.core.config import get_settings
from app.db.session import SessionLocal
from app.services.bootstrap import bootstrap_initial_admin


def main() -> int:
    with SessionLocal() as session:
        result = bootstrap_initial_admin(session, get_settings())
    print(f"bootstrap_admin={result.status}")
    return 0 if result.status in {"created", "already_configured"} else 2


if __name__ == "__main__":
    raise SystemExit(main())
