"""Alembic environment configuration for Blaze NIL warehouse."""

from __future__ import annotations

import logging
from typing import Any

from alembic import context
from sqlalchemy import engine_from_config, pool

from bsi_nil.config import load_config
from models.database import _resolve_database_url
from models.schema import Base

logger = logging.getLogger(__name__)

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

target_metadata = Base.metadata


def _get_database_url() -> str:
    config_dict = load_config()
    database_config = config_dict.get("database", {})
    return _resolve_database_url(database_config)  # type: ignore[arg-type]


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""

    url = _get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    url = _get_database_url()
    configuration: dict[str, Any] = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
