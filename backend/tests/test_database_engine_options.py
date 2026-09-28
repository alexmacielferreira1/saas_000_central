from app.db.session import engine_options


def test_sqlite_engine_does_not_receive_postgres_only_options():
    options = engine_options("sqlite+pysqlite:///./qa.db")
    assert options["connect_args"] == {}
    assert "pool_size" not in options


def test_postgres_engine_keeps_timeouts_and_pool_limits():
    options = engine_options("postgresql+psycopg://central:secret@localhost/central")
    assert options["connect_args"]["connect_timeout"] == 3
    assert options["pool_size"] == 5
