"""Database utilities and SQLAlchemy session management."""

from __future__ import annotations

import contextlib
import logging
import os
from pathlib import Path
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import Session, sessionmaker

from bsi_nil.config import load_config

logger = logging.getLogger(__name__)

_ENGINE = None
_SESSION_FACTORY = None


def _resolve_database_url(config: dict[str, object]) -> str:
    env_var = config.get("env_var", "DATABASE_URL")
    if isinstance(env_var, str):
        database_url = os.getenv(env_var)
        if database_url:
            return database_url

    fallback = config.get("url")
    if isinstance(fallback, str) and fallback:
        return fallback

    raise RuntimeError(
        "DATABASE_URL environment variable is not set and no fallback URL is configured."
    )


def _create_engine():
    config = load_config()
    database_config: dict[str, object] = config.get("database", {})
    database_url = _resolve_database_url(database_config)
    echo = bool(database_config.get("echo", False))

    url: URL = make_url(database_url)
    connect_args: dict[str, object] = {}
    engine_kwargs: dict[str, object] = {"echo": echo, "future": True}

    if url.drivername.startswith("sqlite"):
        database = url.database or ""
        if database not in {"", ":memory:"}:
            db_path = Path(database).expanduser()
            if not db_path.is_absolute():
                db_path = Path.cwd() / db_path
            db_path.parent.mkdir(parents=True, exist_ok=True)
            url = url.set(database=str(db_path))
        connect_args["check_same_thread"] = False

    if url.drivername.startswith("postgresql"):
        ssl_config = database_config.get("ssl", {}) if isinstance(database_config, dict) else {}
        if isinstance(ssl_config, dict):
            ssl_mode = ssl_config.get("mode", "require")
            if ssl_mode:
                connect_args["sslmode"] = ssl_mode
            root_cert = ssl_config.get("root_cert_path")
            if root_cert:
                connect_args["sslrootcert"] = str(root_cert)

        pool_config = (
            database_config.get("pool", {}) if isinstance(database_config, dict) else {}
        )
        if isinstance(pool_config, dict):
            engine_kwargs["pool_size"] = int(pool_config.get("size", 5))
            engine_kwargs["max_overflow"] = int(pool_config.get("max_overflow", 10))
            engine_kwargs["pool_timeout"] = int(pool_config.get("timeout", 30))
            engine_kwargs["pool_recycle"] = int(pool_config.get("recycle", 1800))

        engine_kwargs["pool_pre_ping"] = True

    if connect_args:
        engine_kwargs["connect_args"] = connect_args

    engine = create_engine(url, **engine_kwargs)
    return engine


def get_engine():
    global _ENGINE
    if _ENGINE is None:
        _ENGINE = _create_engine()
    return _ENGINE


def get_session_factory():
    global _SESSION_FACTORY
    if _SESSION_FACTORY is None:
        engine = get_engine()
        _SESSION_FACTORY = sessionmaker(bind=engine, class_=Session, autoflush=False)
    return _SESSION_FACTORY


@contextlib.contextmanager
def session_scope() -> Iterator[Session]:
    """Provide a transactional scope around a series of operations."""

    session_factory = get_session_factory()
    session = session_factory()
    try:
        yield session
        session.commit()
    except Exception:  # pragma: no cover - defensive rollback
        session.rollback()
        raise
    finally:
        session.close()


def reset_engine() -> None:
    """Dispose of the cached SQLAlchemy engine (for tests)."""

    global _ENGINE, _SESSION_FACTORY
    if _ENGINE is not None:
        _ENGINE.dispose()
    _ENGINE = None
    _SESSION_FACTORY = None
