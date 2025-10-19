"""Unit tests for the cache fallback logic."""

from __future__ import annotations

from pathlib import Path

import yaml

from api import cache as cache_module
from bsi_nil.config import reset_config_cache


class BrokenRedis:
    """Redis stub that simulates an outage by failing ping."""

    def __init__(self, *args, **kwargs):
        pass

    def ping(self):
        raise cache_module.redis.RedisError("redis unavailable")


def _configure_ttl(tmp_path: Path, ttl_seconds: int) -> Path:
    base_config_path = Path("config/settings.yaml")
    config = yaml.safe_load(base_config_path.read_text())
    config["redis"]["ttl_seconds"] = ttl_seconds
    config_path = tmp_path / "config.yaml"
    config_path.write_text(yaml.safe_dump(config))
    return config_path


def test_in_memory_cache_respects_ttl(monkeypatch, tmp_path):
    config_path = _configure_ttl(tmp_path, ttl_seconds=15)
    monkeypatch.setenv("BLAZE_CONFIG", str(config_path))
    reset_config_cache()

    # Force the cache client to use the in-memory fallback.
    monkeypatch.setattr(cache_module.redis, "Redis", BrokenRedis)

    current_time = {"value": 1_000.0}

    def fake_monotonic() -> float:
        return current_time["value"]

    monkeypatch.setattr(cache_module.time, "monotonic", fake_monotonic)

    cache_client = cache_module.CacheClient()
    assert cache_client.client is None

    payload = {"answer": 42}
    cache_client.set("sample", payload)
    assert cache_client.get("sample") == payload

    # Advance time but stay within the TTL window.
    current_time["value"] += 14
    assert cache_client.get("sample") == payload

    # Advance beyond the TTL threshold and ensure the value expires.
    current_time["value"] += 2
    assert cache_client.get("sample") is None
    assert "sample" not in cache_client._memory_store
    reset_config_cache()
