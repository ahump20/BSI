# Blaze Intelligence Monte Carlo Simulation

This package delivers a reproducible Monte Carlo engine for Blaze Intelligence revenue, cost, and profitability forecasting.

## Contents

- `monte_carlo.py` – simulation entrypoint with CLI
- `config.json` – adjustable scenario inputs
- `requirements.txt` – Python dependencies
- `run.sh` – helper script to create a virtual environment, install dependencies, and execute the simulation
- `output/` – generated analytics (CSV summaries, PNG visualizations, text report)

## Quick start

```bash
./analysis/monte_carlo/run.sh
```

The script will:

1. Create a dedicated virtual environment in `.venv-monte-carlo`
2. Install the pinned dependencies
3. Execute `monte_carlo.py` with `config.json`
4. Write fresh outputs inside `analysis/monte_carlo/output/`

## Configuration

Tweak `analysis/monte_carlo/config.json` to explore alternate scenarios:

- `iterations`: number of Monte Carlo draws (default 10,000)
- `random_seed`: optional seed for reproducibility
- `revenue_streams` / `cost_streams`: each entry defines the statistical distribution, optional market linkage, and documentation notes
- `target_thresholds`: monthly profit and ROI goals that are evaluated across all simulations

Supported distribution types:

- `normal` – parameters: `mean`, `stddev`
- `lognormal` – parameters: `mean`, `stddev` (interpreted as arithmetic mean/std; converted internally)
- `triangular` – parameters: `low`, `mode`, `high`

## Outputs

The simulation exports the following timestamped artifacts:

- `*_results.csv` – raw trial outcomes by revenue and cost stream
- `*_statistics.csv` – aggregate statistics (mean, median, confidence intervals, goal attainment probabilities)
- `*_sensitivity.csv` – Pearson correlations highlighting revenue levers linked to profitability
- `*_analysis.png` – visual dashboard (distributions, box plots, pie chart, CDF)
- `*_report.txt` – executive narrative summarizing critical insights and recommendations

These files are safe to share with leadership and can be versioned for scenario tracking.
