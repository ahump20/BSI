from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from analysis.monte_carlo.monte_carlo import (
    SimulationConfig,
    StreamConfig,
    ThresholdConfig,
    DistributionConfig,
    run_simulation,
    summarize_results,
)


def test_run_simulation_basic(tmp_path: Path) -> None:
    config = SimulationConfig(
        iterations=500,
        random_seed=123,
        output_directory=tmp_path,
        revenue_streams=[
            StreamConfig(
                name="subscriptions",
                distribution=DistributionConfig(type="normal", mean=1000, stddev=100),
            ),
            StreamConfig(
                name="custom_projects",
                distribution=DistributionConfig(type="triangular", low=300, mode=500, high=900),
            ),
        ],
        cost_streams=[
            StreamConfig(
                name="data",
                distribution=DistributionConfig(type="normal", mean=200, stddev=40),
            ),
            StreamConfig(
                name="delivery",
                distribution=DistributionConfig(type="lognormal", mean=250, stddev=60),
            ),
        ],
        target_thresholds=ThresholdConfig(monthly_profit_goal=200, roi_goal=1.5),
    )

    result = run_simulation(config)
    assert result.results.shape[0] == 500
    assert set(result.revenue_columns) == {"subscriptions", "custom_projects"}
    assert set(result.cost_columns) == {"data", "delivery"}

    summary = summarize_results(result)
    metrics = summary.set_index("metric")["value"]

    revenue_series = result.results["total_revenue"]

    assert metrics["monthly_value_mean"] == pytest.approx(float(revenue_series.mean()))
    assert metrics["monthly_value_median"] == pytest.approx(float(revenue_series.median()))
    assert metrics["monthly_value_ci_lower"] == pytest.approx(float(revenue_series.quantile(0.025)))
    assert metrics["monthly_value_ci_upper"] == pytest.approx(float(revenue_series.quantile(0.975)))
    assert 0 < metrics["profit_margin_mean"] < 1
    assert not np.isnan(metrics["roi_mean"])
    assert isinstance(result.results, pd.DataFrame)
