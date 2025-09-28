"""Monte Carlo profitability simulation for Blaze Intelligence."""
from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Optional

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator


class DistributionConfig(BaseModel):
    """Statistical distribution definition."""

    type: str = Field(pattern="^(normal|lognormal|triangular)$")
    mean: Optional[float] = None
    stddev: Optional[float] = None
    low: Optional[float] = None
    mode: Optional[float] = None
    high: Optional[float] = None

    @model_validator(mode="after")
    def validate_params(self) -> "DistributionConfig":
        dist_type = self.type
        if dist_type in {"normal", "lognormal"}:
            if self.mean is None or self.stddev is None:
                raise ValueError("normal/lognormal distributions require mean and stddev")
            if self.stddev <= 0:
                raise ValueError("stddev must be positive")
        if dist_type == "triangular":
            if None in (self.low, self.mode, self.high):
                raise ValueError("triangular distribution requires low, mode, and high")
            if not (self.low <= self.mode <= self.high):
                raise ValueError("triangular distribution requires low <= mode <= high")
        return self


class StreamConfig(BaseModel):
    """Configuration shared by revenue and cost entries."""

    name: str
    distribution: DistributionConfig
    market_key: Optional[str] = None
    market_sensitivity: float = Field(default=0.0, ge=0.0, le=1.0)
    notes: Optional[str] = None


class ThresholdConfig(BaseModel):
    monthly_profit_goal: float = 0.0
    roi_goal: float = 0.0


class SimulationConfig(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    iterations: int = Field(gt=0, default=10_000)
    random_seed: Optional[int] = None
    output_directory: Path
    revenue_streams: List[StreamConfig]
    cost_streams: List[StreamConfig]
    target_thresholds: ThresholdConfig


@dataclass
class SimulationResult:
    """Container for simulation outputs."""

    config: SimulationConfig
    results: pd.DataFrame
    revenue_columns: List[str]
    cost_columns: List[str]

    @property
    def profit_series(self) -> pd.Series:
        return self.results["gross_profit"]

    @property
    def roi_series(self) -> pd.Series:
        return self.results["roi"]

    @property
    def profit_margin_series(self) -> pd.Series:
        return self.results["profit_margin"]


def load_config(path: Path) -> SimulationConfig:
    raw = json.loads(path.read_text())
    output_dir_raw = Path(raw["output_directory"])
    if not output_dir_raw.is_absolute():
        raw["output_directory"] = str((path.parent / output_dir_raw).resolve())
    else:
        raw["output_directory"] = str(output_dir_raw)
    try:
        return SimulationConfig(**raw)
    except ValidationError as exc:
        raise SystemExit(f"Invalid config: {exc}") from exc


def _sample_distribution(dist: DistributionConfig, size: int, rng: np.random.Generator) -> np.ndarray:
    if dist.type == "normal":
        return rng.normal(dist.mean, dist.stddev, size)
    if dist.type == "lognormal":
        mean = dist.mean
        stddev = dist.stddev
        variance = stddev ** 2
        mu = math.log((mean ** 2) / math.sqrt(variance + mean ** 2))
        sigma = math.sqrt(math.log(1 + (variance / (mean ** 2))))
        return rng.lognormal(mu, sigma, size)
    if dist.type == "triangular":
        return rng.triangular(dist.low, dist.mode, dist.high, size)
    raise ValueError(f"Unsupported distribution: {dist.type}")


def _build_market_drivers(streams: Iterable[StreamConfig], iterations: int, rng: np.random.Generator) -> Dict[str, np.ndarray]:
    keys = sorted({stream.market_key for stream in streams if stream.market_key})
    return {key: rng.standard_normal(iterations) for key in keys}


def _apply_market_sensitivity(samples: np.ndarray, driver: np.ndarray, sensitivity: float) -> np.ndarray:
    if sensitivity == 0 or driver is None:
        return samples
    adjusted = samples * (1 + sensitivity * driver / 3)
    return np.clip(adjusted, a_min=0.0, a_max=None)


def run_simulation(config: SimulationConfig) -> SimulationResult:
    rng = np.random.default_rng(config.random_seed)
    iterations = config.iterations

    revenue_drivers = _build_market_drivers(config.revenue_streams, iterations, rng)
    cost_drivers = _build_market_drivers(config.cost_streams, iterations, rng)

    revenue_data: Dict[str, np.ndarray] = {}
    for stream in config.revenue_streams:
        base_samples = _sample_distribution(stream.distribution, iterations, rng)
        driver = revenue_drivers.get(stream.market_key)
        revenue_data[stream.name] = _apply_market_sensitivity(base_samples, driver, stream.market_sensitivity)

    cost_data: Dict[str, np.ndarray] = {}
    for stream in config.cost_streams:
        base_samples = _sample_distribution(stream.distribution, iterations, rng)
        driver = cost_drivers.get(stream.market_key)
        cost_data[stream.name] = _apply_market_sensitivity(base_samples, driver, stream.market_sensitivity)

    df = pd.DataFrame(revenue_data | cost_data)
    df["total_revenue"] = df[[stream.name for stream in config.revenue_streams]].sum(axis=1)
    df["total_costs"] = df[[stream.name for stream in config.cost_streams]].sum(axis=1)
    df["gross_profit"] = df["total_revenue"] - df["total_costs"]
    df["roi"] = np.where(df["total_costs"] > 0, df["gross_profit"] / df["total_costs"], np.nan)
    df["profit_margin"] = np.where(df["total_revenue"] > 0, df["gross_profit"] / df["total_revenue"], np.nan)
    df["meets_profit_goal"] = df["gross_profit"] >= config.target_thresholds.monthly_profit_goal
    df["meets_roi_goal"] = df["roi"] >= config.target_thresholds.roi_goal

    return SimulationResult(config=config, results=df, revenue_columns=list(revenue_data.keys()), cost_columns=list(cost_data.keys()))


def _confidence_interval(series: pd.Series, level: float) -> tuple[float, float]:
    lower = series.quantile((1 - level) / 2)
    upper = series.quantile(1 - (1 - level) / 2)
    return float(lower), float(upper)


def summarize_results(result: SimulationResult) -> pd.DataFrame:
    df = result.results
    revenue_ci = _confidence_interval(df["total_revenue"], 0.95)
    profit_ci = _confidence_interval(df["gross_profit"], 0.95)
    roi_ci = _confidence_interval(df["roi"].dropna(), 0.95)
    pm_ci = _confidence_interval(df["profit_margin"].dropna(), 0.95)

    summary = {
        "metric": [
            "monthly_value_mean",
            "monthly_value_median",
            "monthly_value_ci_lower",
            "monthly_value_ci_upper",
            "roi_mean",
            "roi_median",
            "roi_ci_lower",
            "roi_ci_upper",
            "profit_margin_mean",
            "profit_margin_median",
            "profit_margin_ci_lower",
            "profit_margin_ci_upper",
            "probability_profit_goal",
            "probability_roi_goal",
        ],
        "value": [
            df["total_revenue"].mean(),
            df["total_revenue"].median(),
            revenue_ci[0],
            revenue_ci[1],
            df["roi"].mean(skipna=True),
            df["roi"].median(skipna=True),
            roi_ci[0],
            roi_ci[1],
            df["profit_margin"].mean(skipna=True),
            df["profit_margin"].median(skipna=True),
            pm_ci[0],
            pm_ci[1],
            df["meets_profit_goal"].mean(),
            df["meets_roi_goal"].mean(),
        ],
    }
    return pd.DataFrame(summary)


def sensitivity_analysis(result: SimulationResult) -> pd.DataFrame:
    df = result.results
    correlations: List[Dict[str, Any]] = []
    for column in result.revenue_columns:
        corr = df[[column, "gross_profit"]].corr().iloc[0, 1]
        correlations.append({"stream": column, "type": "revenue", "correlation_to_profit": corr})
    for column in result.cost_columns:
        corr = df[[column, "gross_profit"]].corr().iloc[0, 1]
        correlations.append({"stream": column, "type": "cost", "correlation_to_profit": corr})
    return pd.DataFrame(correlations).sort_values(by="correlation_to_profit", ascending=False)


def _format_currency(value: float) -> str:
    return f"${value:,.0f}"


def build_text_report(result: SimulationResult, summary: pd.DataFrame, sensitivity: pd.DataFrame) -> str:
    total_revenue_mean = summary.loc[summary["metric"] == "monthly_value_mean", "value"].iloc[0]
    total_revenue_median = summary.loc[summary["metric"] == "monthly_value_median", "value"].iloc[0]
    profit_ci_lower, profit_ci_upper = _confidence_interval(result.profit_series, 0.95)
    roi_mean = summary.loc[summary["metric"] == "roi_mean", "value"].iloc[0]
    profit_margin_mean = summary.loc[summary["metric"] == "profit_margin_mean", "value"].iloc[0]
    prob_profit = summary.loc[summary["metric"] == "probability_profit_goal", "value"].iloc[0]
    prob_roi = summary.loc[summary["metric"] == "probability_roi_goal", "value"].iloc[0]

    top_levers = sensitivity.head(3)
    levers_text = "\n".join(
        f"- {row['stream']}: correlation {row['correlation_to_profit']:.2f} ({row['type']})"
        for _, row in top_levers.iterrows()
    )

    report = (
        "Blaze Intelligence Monte Carlo Analysis\n"
        f"Generated: {datetime.now(UTC):%Y-%m-%d %H:%M UTC}\n\n"
    )
    report += "Key Highlights\n--------------\n"
    report += f"Expected monthly revenue: {_format_currency(total_revenue_mean)} (median {_format_currency(total_revenue_median)})\n"
    report += (
        f"95% confidence for gross profit: {_format_currency(profit_ci_lower)} to {_format_currency(profit_ci_upper)}\n"
    )
    report += f"Average ROI: {roi_mean:.1f}x\n"
    report += f"Average profit margin: {profit_margin_mean:.0%}\n"
    report += f"Probability of hitting profit goal: {prob_profit:.1%}\n"
    report += f"Probability of hitting ROI goal: {prob_roi:.1%}\n\n"
    report += "Top Profit Levers\n-----------------\n"
    report += f"{levers_text}\n\n"
    report += "Recommendations\n----------------\n"
    report += (
        "1. Prioritize the highest-correlation revenue levers to boost profitability.\n"
        "2. Track market driver sensitivities monthly to recalibrate assumptions.\n"
        "3. Reinvest surplus cash into pipeline automation to protect ROI.\n"
    )
    return report


def build_visualizations(result: SimulationResult, summary: pd.DataFrame, output_path: Path) -> None:
    plt.style.use("seaborn-v0_8")
    fig, axes = plt.subplots(2, 3, figsize=(16, 9))

    df = result.results

    axes[0, 0].hist(df["total_revenue"], bins=40, color="#ef6c00", alpha=0.7)
    axes[0, 0].set_title("Monthly Value Distribution")
    axes[0, 0].set_xlabel("Monthly Revenue ($)")
    axes[0, 0].set_ylabel("Frequency")

    axes[0, 1].hist(df["roi"].dropna(), bins=40, color="#00897b", alpha=0.7)
    axes[0, 1].set_title("Return on Investment Distribution")
    axes[0, 1].set_xlabel("ROI (x)")

    axes[0, 2].boxplot([df[column] for column in result.revenue_columns], vert=True)
    axes[0, 2].set_title("Revenue Streams Comparison")
    axes[0, 2].set_xticklabels(result.revenue_columns, rotation=45, ha="right")

    axes[1, 0].hist(df["profit_margin"].dropna(), bins=40, color="#3949ab", alpha=0.7)
    axes[1, 0].set_title("Profit Margin Distribution")
    axes[1, 0].set_xlabel("Profit Margin")

    cost_totals = df[result.cost_columns].mean()
    axes[1, 1].pie(cost_totals, labels=result.cost_columns, autopct="%1.1f%%")
    axes[1, 1].set_title("Average Cost Breakdown")

    sorted_profit = np.sort(df["gross_profit"])
    cdf = np.arange(1, len(sorted_profit) + 1) / len(sorted_profit)
    axes[1, 2].plot(sorted_profit, cdf, color="#d81b60")
    axes[1, 2].set_title("Cumulative Distribution Function")
    axes[1, 2].set_xlabel("Gross Profit ($)")
    axes[1, 2].set_ylabel("Cumulative Probability")

    plt.tight_layout()
    fig.suptitle("Blaze Intelligence Monte Carlo Analysis", fontsize=16)
    fig.subplots_adjust(top=0.92)
    fig.savefig(output_path, dpi=200)
    plt.close(fig)


def persist_outputs(result: SimulationResult) -> Dict[str, Path]:
    timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
    output_dir = result.config.output_directory
    output_dir.mkdir(parents=True, exist_ok=True)

    files: Dict[str, Path] = {}

    results_path = output_dir / f"blaze_intel_results_{timestamp}.csv"
    result.results.to_csv(results_path, index=False)
    files["results"] = results_path

    summary = summarize_results(result)
    summary_path = output_dir / f"blaze_intel_statistics_{timestamp}.csv"
    summary.to_csv(summary_path, index=False)
    files["summary"] = summary_path

    sensitivity = sensitivity_analysis(result)
    sensitivity_path = output_dir / f"blaze_intel_sensitivity_{timestamp}.csv"
    sensitivity.to_csv(sensitivity_path, index=False)
    files["sensitivity"] = sensitivity_path

    report_text = build_text_report(result, summary, sensitivity)
    report_path = output_dir / f"blaze_intel_report_{timestamp}.txt"
    report_path.write_text(report_text)
    files["report"] = report_path

    visualization_path = output_dir / f"blaze_intel_analysis_{timestamp}.png"
    build_visualizations(result, summary, visualization_path)
    files["visualization"] = visualization_path

    return files


def parse_args(argv: Optional[Iterable[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Blaze Intelligence Monte Carlo simulator")
    parser.add_argument("--config", type=Path, required=True, help="Path to simulation config JSON")
    parser.add_argument("--output-dir", type=Path, default=None, help="Override output directory")
    return parser.parse_args(list(argv) if argv is not None else None)


def main(argv: Optional[Iterable[str]] = None) -> None:
    args = parse_args(argv)
    config = load_config(args.config)
    if args.output_dir is not None:
        config.output_directory = args.output_dir

    result = run_simulation(config)
    files = persist_outputs(result)

    summary = summarize_results(result)
    sensitivity = sensitivity_analysis(result)

    print("Simulation complete. Key outputs:")
    for name, path in files.items():
        print(f"- {name}: {path}")

    print("\nHeadline metrics:")
    metrics = summary.set_index("metric")["value"]
    print(f"• Monthly revenue (mean): {_format_currency(metrics['monthly_value_mean'])}")
    print(f"• ROI (mean): {metrics['roi_mean']:.1f}x")
    print(f"• Profit margin (mean): {metrics['profit_margin_mean']:.0%}")
    top_lever = sensitivity.iloc[0]
    print(
        "• Top profitability lever: "
        f"{top_lever['stream']} ({top_lever['type']}, correlation {top_lever['correlation_to_profit']:.2f})"
    )


if __name__ == "__main__":
    main()
