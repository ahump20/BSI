"""CFB data ingestion pipeline.

This module provides a reusable command line pipeline for assembling NCAA football
(College Football) data from the public CollegeFootballData.com API.  The script
focuses on building a unified SQLite archive that can be consumed by other Blaze
Sports Intel services and dashboards.  It intentionally scopes data acquisition
into configurable batches so that the process can be resumed across seasons and
extended with new endpoints.

Example usage::

    python -m etl.cfb_data_ingest --seasons 2014 2015 2016 \
        --datasets teams games stats recruiting --database data/cfb/cfb.sqlite

See ``docs/cfb_data_ingestion.md`` for a complete walkthrough and integration
details.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import sqlite3
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Optional

import httpx

CFBD_BASE_URL = "https://api.collegefootballdata.com"
DEFAULT_DB_PATH = Path("data/cfb/cfb.sqlite")
DEFAULT_DATASETS = ("teams", "games", "stats", "recruiting", "coaches")
MAX_CONCURRENCY = 5


@dataclass(slots=True)
class DatasetConfig:
    """Configuration metadata for a dataset endpoint."""

    name: str
    path: str
    requires_season: bool = True
    params: Dict[str, Any] = field(default_factory=dict)
    paginated: bool = False
    page_param: str = "page"
    results_key: Optional[str] = None


DATASET_REGISTRY: Mapping[str, DatasetConfig] = {
    "teams": DatasetConfig(
        name="teams",
        path="/teams/fbs",
        requires_season=False,
        params={"conference": None, "year": None},
    ),
    "games": DatasetConfig(
        name="games",
        path="/games",
        params={"seasonType": "regular", "division": "fbs"},
    ),
    "stats": DatasetConfig(
        name="stats",
        path="/stats/season",
        params={"teamType": "team", "category": "offense"},
    ),
    "recruiting": DatasetConfig(
        name="recruiting",
        path="/recruiting/class",
    ),
    "coaches": DatasetConfig(
        name="coaches",
        path="/coaches",
    ),
    "drives": DatasetConfig(
        name="drives",
        path="/drives",
    ),
    "plays": DatasetConfig(
        name="plays",
        path="/plays",
        paginated=True,
        params={"seasonType": "regular"},
    ),
}


def load_env_api_key() -> Optional[str]:
    """Return the CollegeFootballData API key from the environment if present."""

    return os.getenv("CFBD_API_KEY")


def ensure_database(path: Path) -> sqlite3.Connection:
    """Create the SQLite database and base tables if they do not exist."""

    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS cfb_payloads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dataset TEXT NOT NULL,
            season INTEGER,
            chunk_index INTEGER NOT NULL,
            payload TEXT NOT NULL,
            retrieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS cfb_ingest_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dataset TEXT NOT NULL,
            season INTEGER,
            detail TEXT,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    return conn


async def fetch_json(
    client: httpx.AsyncClient,
    dataset: DatasetConfig,
    params: MutableMapping[str, Any],
    season: Optional[int],
    page: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Perform a GET request against the dataset path and return JSON records."""

    query_params: Dict[str, Any] = {k: v for k, v in params.items() if v is not None}
    if dataset.requires_season and season is not None:
        query_params.setdefault("year", season)
    if page is not None:
        query_params[dataset.page_param] = page

    response = await client.get(dataset.path, params=query_params)
    response.raise_for_status()
    data = response.json()

    if isinstance(data, Mapping):
        key = dataset.results_key
        if key and key in data:
            items = data[key]
            if isinstance(items, list):
                return items
            raise TypeError(
                f"Expected list in '{key}' for dataset {dataset.name}, received {type(items)!r}."
            )
        return [data]  # Single object payload.

    if isinstance(data, list):
        return data

    raise TypeError(
        f"Unexpected response type {type(data)!r} for dataset {dataset.name}: {data!r}"
    )


async def harvest_dataset(
    client: httpx.AsyncClient,
    dataset: DatasetConfig,
    season: Optional[int],
    max_pages: Optional[int],
    *,
    semaphore: asyncio.Semaphore,
) -> List[List[Dict[str, Any]]]:
    """Collect the records for a dataset/season combination.

    Returns a list of JSON record chunks.  For non-paginated endpoints the list
    contains a single chunk.
    """

    params = dict(dataset.params)

    async with semaphore:
        if dataset.paginated:
            collected: List[List[Dict[str, Any]]] = []
            page = 1
            while True:
                if max_pages is not None and page > max_pages:
                    break
                records = await fetch_json(client, dataset, params, season, page=page)
                if not records:
                    break
                collected.append(records)
                page += 1
            return collected

        records = await fetch_json(client, dataset, params, season)
        return [records]


def store_chunks(
    conn: sqlite3.Connection,
    dataset_name: str,
    season: Optional[int],
    chunks: Iterable[Iterable[Mapping[str, Any]]],
) -> int:
    """Persist JSON chunks into the database and return the row count."""

    cursor = conn.cursor()
    inserted = 0
    for index, chunk in enumerate(chunks):
        payload = json.dumps(list(chunk), separators=(",", ":"))
        cursor.execute(
            "INSERT INTO cfb_payloads (dataset, season, chunk_index, payload) VALUES (?, ?, ?, ?)",
            (dataset_name, season, index, payload),
        )
        inserted += 1
    conn.commit()
    return inserted


def log_ingest(
    conn: sqlite3.Connection,
    dataset_name: str,
    season: Optional[int],
    status: str,
    detail: str,
) -> None:
    """Write a log entry for visibility and observability."""

    conn.execute(
        "INSERT INTO cfb_ingest_log (dataset, season, status, detail) VALUES (?, ?, ?, ?)",
        (dataset_name, season, status, detail),
    )
    conn.commit()


async def ingest(
    datasets: Iterable[str],
    seasons: Iterable[int],
    database_path: Path,
    *,
    max_pages: Optional[int] = None,
    timeout: int = 60,
) -> None:
    """Coordinate asynchronous ingestion across datasets and seasons."""

    conn = ensure_database(database_path)
    api_key = load_env_api_key()

    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    logging.info("Connecting to CollegeFootballData API at %s", CFBD_BASE_URL)
    limits = httpx.Limits(max_connections=MAX_CONCURRENCY)
    async with httpx.AsyncClient(
        base_url=CFBD_BASE_URL,
        headers=headers,
        timeout=httpx.Timeout(timeout),
        limits=limits,
    ) as client:
        semaphore = asyncio.Semaphore(MAX_CONCURRENCY)
        tasks = []
        for dataset_name in datasets:
            config = DATASET_REGISTRY.get(dataset_name)
            if not config:
                logging.warning("Dataset '%s' is not registered; skipping", dataset_name)
                continue
            target_seasons = list(seasons) if config.requires_season else [None]
            for season in target_seasons:
                tasks.append(
                    asyncio.create_task(
                        process_dataset(client, conn, config, season, max_pages, semaphore)
                    )
                )

        await asyncio.gather(*tasks)
    conn.close()


async def process_dataset(
    client: httpx.AsyncClient,
    conn: sqlite3.Connection,
    dataset: DatasetConfig,
    season: Optional[int],
    max_pages: Optional[int],
    semaphore: asyncio.Semaphore,
) -> None:
    """Fetch and store a single dataset-season combination."""

    season_label = season if season is not None else "all"
    logging.info("Ingesting %s for season %s", dataset.name, season_label)

    try:
        chunks = await harvest_dataset(client, dataset, season, max_pages, semaphore=semaphore)
        inserted = store_chunks(conn, dataset.name, season, chunks)
        log_ingest(
            conn,
            dataset.name,
            season,
            "success",
            f"Stored {inserted} chunk(s) for season {season_label}",
        )
        logging.info(
            "Completed %s season %s with %s chunk(s)", dataset.name, season_label, inserted
        )
    except httpx.HTTPStatusError as exc:
        log_ingest(
            conn,
            dataset.name,
            season,
            "http_error",
            f"HTTP error {exc.response.status_code}: {exc!s}",
        )
        logging.error("HTTP error while ingesting %s season %s: %s", dataset.name, season_label, exc)
    except Exception as exc:  # noqa: BLE001 - surface unexpected issues in logs
        log_ingest(conn, dataset.name, season, "failure", str(exc))
        logging.exception("Unexpected error while ingesting %s season %s", dataset.name, season_label)


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Assemble NCAA football data into a unified SQLite archive.",
    )
    parser.add_argument(
        "--seasons",
        nargs="*",
        type=int,
        default=[2024],
        help="List of seasons to ingest (4-digit year).",
    )
    parser.add_argument(
        "--datasets",
        nargs="*",
        default=list(DEFAULT_DATASETS),
        choices=sorted(DATASET_REGISTRY.keys()),
        help="Datasets to ingest.",
    )
    parser.add_argument(
        "--database",
        type=Path,
        default=DEFAULT_DB_PATH,
        help="Path to the SQLite database where payloads will be stored.",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=None,
        help="Optional pagination limit for endpoints like plays and drives.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=60,
        help="HTTP timeout in seconds.",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        help="Logging level for stdout output.",
    )
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> None:
    args = parse_args(argv)
    logging.basicConfig(
        level=getattr(logging, args.log_level.upper()),
        format="%(asctime)s | %(levelname)s | %(message)s",
    )

    logging.info(
        "Starting ingestion for datasets=%s seasons=%s", args.datasets, args.seasons
    )
    asyncio.run(
        ingest(
            datasets=args.datasets,
            seasons=args.seasons,
            database_path=args.database,
            max_pages=args.max_pages,
            timeout=args.timeout,
        )
    )


if __name__ == "__main__":
    main()
