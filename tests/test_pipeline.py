"""Integration-style tests for the NIL valuation scaffold."""

from __future__ import annotations

import importlib
from pathlib import Path

import yaml
from fastapi.testclient import TestClient

from bsi_nil.config import reset_config_cache
from etl.flows import nightly_pipeline
from models.database import reset_engine


def _prepare_test_config(tmp_path: Path) -> Path:
    base_config_path = Path("config/settings.yaml")
    config = yaml.safe_load(base_config_path.read_text())
    database_path = tmp_path / "test.db"
    config["database"]["url"] = f"sqlite+pysqlite:///{database_path}"
    config["storage"]["raw_path"] = str(tmp_path / "raw")
    config_path = tmp_path / "test_config.yaml"
    config_path.write_text(yaml.safe_dump(config))
    return config_path


def test_pipeline_runs_end_to_end(tmp_path, monkeypatch):
    config_path = _prepare_test_config(tmp_path)
    monkeypatch.setenv("BLAZE_CONFIG", str(config_path))
    reset_config_cache()
    reset_engine()

    result = nightly_pipeline()
    assert result["backtest"].coverage >= 0
    assert result["artifacts"].stage_a_rmse >= 0


def test_api_endpoints_return_data(tmp_path, monkeypatch):
    config_path = _prepare_test_config(tmp_path)
    monkeypatch.setenv("BLAZE_CONFIG", str(config_path))
    reset_config_cache()
    reset_engine()

    nightly_pipeline()

    # Reload API module to pick up new configuration
    api_main = importlib.import_module("api.main")
    importlib.reload(api_main)

    with TestClient(api_main.app) as client:
        leaderboard = client.get("/leaderboard")
        assert leaderboard.status_code == 200
        payload = leaderboard.json()
        assert payload["results"]
        athlete_id = payload["results"][0]["athlete_id"]

        athlete_resp = client.get(f"/athlete/{athlete_id}/value")
        assert athlete_resp.status_code == 200
        athlete_payload = athlete_resp.json()
        assert athlete_payload["athlete_id"] == athlete_id
        assert "Estimated value, not contractual" in athlete_payload["disclaimer"]
