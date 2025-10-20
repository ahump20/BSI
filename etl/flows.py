"""Prefect flow orchestrating the NIL valuation pipeline."""

from __future__ import annotations

from prefect import flow, get_run_logger, task

from bsi_nil.config import load_config
from etl import mock_sources
from etl.normalization import build_id_map, normalize_ids
from etl.raw_storage import RawStorageClient
from models import backtest, baseball_analytics, features as feature_eng
from models import repository, training


@task
def ingest_sources():
    logger = get_run_logger()
    logger.info("Loading mock data sources for Blaze Intelligence")
    athletes = mock_sources.load_athlete_directory()
    box_scores = mock_sources.generate_box_scores()
    social = mock_sources.generate_social_stats()
    search = mock_sources.generate_search_interest()
    nil_deals = mock_sources.get_mock_nil_deals()
    return athletes, box_scores, social, search, nil_deals


@task
def persist_raw(athletes, box_scores, social, search, nil_deals):
    storage = RawStorageClient()
    storage.save_dataframe(athletes, "athletes")
    storage.save_dataframe(box_scores, "box_scores")
    storage.save_dataframe(social, "social_stats")
    storage.save_dataframe(search, "search_interest")
    storage.save_dataframe(nil_deals, "nil_deals")


@task
def persist_baseball_snapshot():
    logger = get_run_logger()
    snapshot = baseball_analytics.refresh_snapshot()
    storage = RawStorageClient()
    artifact_path = storage.save_json(snapshot, "college_baseball_diamond_snapshot")
    logger.info("Wrote Diamond Pro baseball analytics snapshot to %s", artifact_path)
    return snapshot.get("generated_at")


@task
def load_warehouse(athletes, box_scores, social, search):
    repository.initialize_database()
    repository.upsert_athletes(athletes)
    repository.load_box_scores(box_scores)
    repository.load_social_stats(social)
    repository.load_search_interest(search)


@task
def engineer_features(athletes, box_scores, social, search):
    attention = feature_eng.compute_attention_scores(social, search)
    performance = feature_eng.compute_performance_index(box_scores)
    enriched = feature_eng.join_with_context(athletes, attention, performance)
    repository.store_features(
        enriched[[
            "athlete_id",
            "as_of",
            "attention_score",
            "performance_index",
        ]]
    )
    return enriched


@task
def train_and_score(features_df, social, search, nil_deals, box_scores):
    models, artifacts, stage_a_predictions = training.train_models(
        social_stats=social,
        search_interest=search,
        features=features_df[[
            "athlete_id",
            "attention_score",
            "performance_index",
            "context_multiplier",
            "adjusted_performance",
        ]].assign(attention_score=features_df["attention_score"]),
        nil_deals=nil_deals,
    )
    game_counts = box_scores.groupby("athlete_id").size()
    valuations = training.generate_valuations(
        features=features_df[[
            "athlete_id",
            "attention_score",
            "performance_index",
            "context_multiplier",
            "adjusted_performance",
        ]],
        stage_a_predictions=stage_a_predictions,
        models=models,
        game_counts=game_counts,
    )
    repository.store_valuations(valuations)
    return valuations, artifacts


@task
def run_backtest(valuations, nil_deals):
    result = backtest.backtest(valuations, nil_deals)
    return result


@flow(name="blaze_nil_nightly")
def nightly_pipeline():
    config = load_config()
    logger = get_run_logger()
    logger.info("Starting Blaze Intelligence NIL valuation pipeline")

    (
        athletes,
        box_scores,
        social,
        search,
        nil_deals,
    ) = ingest_sources()

    id_map = build_id_map(athletes)
    box_scores = normalize_ids(box_scores, "athlete_id", id_map)
    social = normalize_ids(social, "athlete_id", id_map)
    search = normalize_ids(search, "athlete_id", id_map)
    nil_deals = normalize_ids(nil_deals, "athlete_id", id_map)

    persist_raw(athletes, box_scores, social, search, nil_deals)
    persist_baseball_snapshot()
    load_warehouse(athletes, box_scores, social, search)

    features_df = engineer_features(athletes, box_scores, social, search)
    valuations, artifacts = train_and_score(features_df, social, search, nil_deals, box_scores)
    backtest_result = run_backtest(valuations, nil_deals)

    logger.info(
        "Training RMSE stage_a=%.2f stage_b=%.2f",
        artifacts.stage_a_rmse,
        artifacts.stage_b_rmse,
    )
    logger.info(
        "Backtest coverage=%.2f mape=%.2f bias=%.2f",
        backtest_result.coverage,
        backtest_result.mape,
        backtest_result.bias,
    )
    logger.info(config["project"]["disclaimer"])
    return {
        "artifacts": artifacts,
        "backtest": backtest_result,
    }


if __name__ == "__main__":
    nightly_pipeline()
