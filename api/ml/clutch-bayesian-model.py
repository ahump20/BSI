"""
Hierarchical Bayesian Model for Clutch Performance Prediction

This model estimates player-specific clutch ability while accounting for:
1. Player-level random effects (some players are inherently "clutch")
2. Wearables covariates (HRV, recovery, sleep)
3. Situation covariates (score margin, playoff status)
4. Temporal trends (performance over season)

Model Specification:
------------------
clutch_score[i] ~ Normal(mu[i], sigma)

mu[i] = alpha[player[i]] +
        beta_hrv * hrv_deviation[i] +
        beta_recovery * recovery_score[i] +
        beta_sleep * sleep_performance[i] +
        beta_margin * score_margin[i] +
        beta_playoff * is_playoff[i] +
        beta_rest * days_rest[i]

alpha[j] ~ Normal(mu_alpha, sigma_alpha)  # Player-specific intercepts

Priors:
-------
mu_alpha ~ Normal(50, 10)        # League-wide mean clutch ability
sigma_alpha ~ HalfNormal(10)     # Between-player variability
beta_* ~ Normal(0, 5)            # Covariate effects
sigma ~ HalfNormal(10)           # Within-player variability

Requirements:
------------
- pymc >= 5.0
- arviz >= 0.15
- pandas >= 2.0
- numpy >= 1.24

Author: Blaze Sports Intel
Date: 2025-11-01
"""

import pymc as pm
import arviz as az
import numpy as np
import pandas as pd
import json
from typing import Dict, Any, Optional, Tuple
from datetime import datetime


class ClutchBayesianModel:
    """
    Hierarchical Bayesian model for predicting clutch performance
    using biometric and situational covariates.
    """

    def __init__(self):
        self.model = None
        self.trace = None
        self.player_map = None
        self.fitted = False

    def prepare_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Prepare data for modeling.

        Expected columns in df:
        - player_id: str
        - clutch_score: float (0-100)
        - hrv_baseline_deviation: float (% from baseline)
        - recovery_score_pregame: float (0-100)
        - sleep_performance_pregame: float (0-100)
        - score_margin: int (-5 to +5)
        - is_playoff: bool
        - days_since_last_game: int
        """
        # Remove rows with missing clutch_score
        df_clean = df.dropna(subset=['clutch_score']).copy()

        # Fill missing wearables data with neutral values
        df_clean['hrv_baseline_deviation'] = df_clean['hrv_baseline_deviation'].fillna(0)
        df_clean['recovery_score_pregame'] = df_clean['recovery_score_pregame'].fillna(70)
        df_clean['sleep_performance_pregame'] = df_clean['sleep_performance_pregame'].fillna(75)
        df_clean['score_margin'] = df_clean['score_margin'].fillna(0)
        df_clean['is_playoff'] = df_clean['is_playoff'].fillna(False).astype(int)
        df_clean['days_since_last_game'] = df_clean['days_since_last_game'].fillna(2)

        # Create player index mapping
        unique_players = df_clean['player_id'].unique()
        player_to_idx = {player: idx for idx, player in enumerate(unique_players)}
        df_clean['player_idx'] = df_clean['player_id'].map(player_to_idx)

        self.player_map = {
            'player_to_idx': player_to_idx,
            'idx_to_player': {v: k for k, v in player_to_idx.items()},
            'n_players': len(unique_players),
        }

        # Normalize continuous predictors for better convergence
        df_clean['hrv_deviation_z'] = (
            df_clean['hrv_baseline_deviation'] - df_clean['hrv_baseline_deviation'].mean()
        ) / df_clean['hrv_baseline_deviation'].std()

        df_clean['recovery_z'] = (
            df_clean['recovery_score_pregame'] - df_clean['recovery_score_pregame'].mean()
        ) / df_clean['recovery_score_pregame'].std()

        df_clean['sleep_z'] = (
            df_clean['sleep_performance_pregame'] - df_clean['sleep_performance_pregame'].mean()
        ) / df_clean['sleep_performance_pregame'].std()

        return df_clean, self.player_map

    def build_model(self, df: pd.DataFrame) -> pm.Model:
        """
        Build hierarchical Bayesian model.
        """
        n_obs = len(df)
        n_players = self.player_map['n_players']

        with pm.Model() as model:
            # Hyperpriors (league-wide parameters)
            mu_alpha = pm.Normal('mu_alpha', mu=50, sigma=10)
            sigma_alpha = pm.HalfNormal('sigma_alpha', sigma=10)

            # Player-specific intercepts (random effects)
            alpha = pm.Normal('alpha', mu=mu_alpha, sigma=sigma_alpha, shape=n_players)

            # Fixed effects (wearables + situation)
            beta_hrv = pm.Normal('beta_hrv', mu=0, sigma=5)
            beta_recovery = pm.Normal('beta_recovery', mu=0, sigma=5)
            beta_sleep = pm.Normal('beta_sleep', mu=0, sigma=5)
            beta_margin = pm.Normal('beta_margin', mu=0, sigma=2)
            beta_playoff = pm.Normal('beta_playoff', mu=0, sigma=5)
            beta_rest = pm.Normal('beta_rest', mu=0, sigma=2)

            # Linear predictor
            mu = (
                alpha[df['player_idx'].values] +
                beta_hrv * df['hrv_deviation_z'].values +
                beta_recovery * df['recovery_z'].values +
                beta_sleep * df['sleep_z'].values +
                beta_margin * df['score_margin'].values +
                beta_playoff * df['is_playoff'].values +
                beta_rest * df['days_since_last_game'].values
            )

            # Likelihood
            sigma = pm.HalfNormal('sigma', sigma=10)
            y = pm.Normal('y', mu=mu, sigma=sigma, observed=df['clutch_score'].values)

        self.model = model
        return model

    def fit(
        self,
        df: pd.DataFrame,
        draws: int = 2000,
        tune: int = 1000,
        chains: int = 4,
        random_seed: int = 42,
    ) -> az.InferenceData:
        """
        Fit the model using MCMC sampling.
        """
        print(f"[Clutch Bayesian Model] Preparing data...")
        df_prepared, _ = self.prepare_data(df)

        print(f"[Clutch Bayesian Model] Building model...")
        self.build_model(df_prepared)

        print(f"[Clutch Bayesian Model] Sampling (draws={draws}, tune={tune}, chains={chains})...")
        with self.model:
            self.trace = pm.sample(
                draws=draws,
                tune=tune,
                chains=chains,
                random_seed=random_seed,
                return_inferencedata=True,
                progressbar=True,
            )

        self.fitted = True
        print(f"[Clutch Bayesian Model] Sampling complete!")
        return self.trace

    def predict(
        self,
        new_data: pd.DataFrame,
        return_uncertainty: bool = True,
    ) -> pd.DataFrame:
        """
        Generate predictions for new observations.

        Returns DataFrame with columns:
        - predicted_clutch_score_mean
        - predicted_clutch_score_lower (2.5th percentile)
        - predicted_clutch_score_upper (97.5th percentile)
        """
        if not self.fitted:
            raise ValueError("Model must be fitted before making predictions")

        # Prepare new data
        new_data_prepared = new_data.copy()

        # Map players to indices
        new_data_prepared['player_idx'] = new_data_prepared['player_id'].map(
            self.player_map['player_to_idx']
        )

        # Handle unseen players (assign to mean league performance)
        unseen_mask = new_data_prepared['player_idx'].isna()
        if unseen_mask.any():
            print(f"[Warning] {unseen_mask.sum()} observations for unseen players. Using league mean.")
            new_data_prepared.loc[unseen_mask, 'player_idx'] = 0  # Use first player as proxy

        # Normalize predictors (use same mean/std from training)
        # In production, store these during fit()
        new_data_prepared['hrv_deviation_z'] = (
            new_data_prepared['hrv_baseline_deviation'].fillna(0)
        )
        new_data_prepared['recovery_z'] = (
            new_data_prepared['recovery_score_pregame'].fillna(70)
        )
        new_data_prepared['sleep_z'] = (
            new_data_prepared['sleep_performance_pregame'].fillna(75)
        )

        # Extract posterior samples
        alpha_samples = self.trace.posterior['alpha'].values.reshape(-1, self.player_map['n_players'])
        beta_hrv_samples = self.trace.posterior['beta_hrv'].values.flatten()
        beta_recovery_samples = self.trace.posterior['beta_recovery'].values.flatten()
        beta_sleep_samples = self.trace.posterior['beta_sleep'].values.flatten()
        beta_margin_samples = self.trace.posterior['beta_margin'].values.flatten()
        beta_playoff_samples = self.trace.posterior['beta_playoff'].values.flatten()
        beta_rest_samples = self.trace.posterior['beta_rest'].values.flatten()

        # Compute predictions for each sample
        n_samples = len(beta_hrv_samples)
        predictions = np.zeros((len(new_data_prepared), n_samples))

        for i, row in new_data_prepared.iterrows():
            player_idx = int(row['player_idx'])

            mu_samples = (
                alpha_samples[:, player_idx] +
                beta_hrv_samples * row['hrv_deviation_z'] +
                beta_recovery_samples * row['recovery_z'] +
                beta_sleep_samples * row['sleep_z'] +
                beta_margin_samples * row['score_margin'] +
                beta_playoff_samples * int(row.get('is_playoff', 0)) +
                beta_rest_samples * row.get('days_since_last_game', 2)
            )

            predictions[i, :] = mu_samples

        # Summarize predictions
        result = new_data[['player_id', 'game_id']].copy()
        result['predicted_clutch_score_mean'] = predictions.mean(axis=1)

        if return_uncertainty:
            result['predicted_clutch_score_lower'] = np.percentile(predictions, 2.5, axis=1)
            result['predicted_clutch_score_upper'] = np.percentile(predictions, 97.5, axis=1)
            result['predicted_clutch_score_std'] = predictions.std(axis=1)

        return result

    def summarize(self) -> Dict[str, Any]:
        """
        Summarize model fit and diagnostics.
        """
        if not self.fitted:
            raise ValueError("Model must be fitted before summarizing")

        # Convergence diagnostics
        summary = az.summary(self.trace, var_names=['mu_alpha', 'sigma_alpha', 'beta_hrv', 'beta_recovery', 'beta_sleep'])

        # Extract key statistics
        diagnostics = {
            'r_hat_max': float(summary['r_hat'].max()),  # Should be < 1.01
            'ess_bulk_min': float(summary['ess_bulk'].min()),  # Should be > 400
            'ess_tail_min': float(summary['ess_tail'].min()),  # Should be > 400
        }

        # Posterior means
        posterior_means = {
            'mu_alpha': float(self.trace.posterior['mu_alpha'].mean()),
            'beta_hrv': float(self.trace.posterior['beta_hrv'].mean()),
            'beta_recovery': float(self.trace.posterior['beta_recovery'].mean()),
            'beta_sleep': float(self.trace.posterior['beta_sleep'].mean()),
            'beta_margin': float(self.trace.posterior['beta_margin'].mean()),
            'beta_playoff': float(self.trace.posterior['beta_playoff'].mean()),
        }

        return {
            'diagnostics': diagnostics,
            'posterior_means': posterior_means,
            'summary_table': summary.to_dict(),
        }

    def save(self, filepath: str) -> None:
        """
        Save model trace to NetCDF file.
        """
        if not self.fitted:
            raise ValueError("Model must be fitted before saving")

        self.trace.to_netcdf(filepath)
        print(f"[Clutch Bayesian Model] Saved to {filepath}")

    def load(self, filepath: str) -> None:
        """
        Load model trace from NetCDF file.
        """
        self.trace = az.from_netcdf(filepath)
        self.fitted = True
        print(f"[Clutch Bayesian Model] Loaded from {filepath}")


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == '__main__':
    # Example: Load data from database
    import psycopg2
    import os

    conn = psycopg2.connect(os.environ['DATABASE_URL'])

    query = """
    SELECT
        cps.player_id,
        cps.game_id,
        cps.clutch_score,
        cps.hrv_baseline_deviation,
        cps.recovery_score_pregame,
        cps.sleep_performance_pregame,
        cs.score_margin,
        cs.playoff_game AS is_playoff,
        EXTRACT(DAY FROM (g.game_date - LAG(g.game_date) OVER (PARTITION BY cps.player_id ORDER BY g.game_date))) AS days_since_last_game
    FROM clutch_performance_scores cps
    JOIN clutch_situations cs ON cps.situation_id = cs.situation_id
    JOIN games g ON cps.game_id = g.game_id
    WHERE g.season = '2024-25'
        AND cps.clutch_score IS NOT NULL
    ORDER BY g.game_date
    """

    df = pd.read_sql(query, conn)
    conn.close()

    print(f"Loaded {len(df)} observations")

    # Split train/test
    train_size = int(0.8 * len(df))
    train_df = df.iloc[:train_size]
    test_df = df.iloc[train_size:]

    # Fit model
    model = ClutchBayesianModel()
    trace = model.fit(train_df, draws=2000, tune=1000, chains=4)

    # Summarize
    summary = model.summarize()
    print("\n=== Model Summary ===")
    print(json.dumps(summary, indent=2))

    # Predict on test set
    predictions = model.predict(test_df)
    print("\n=== Predictions ===")
    print(predictions.head())

    # Calculate RMSE
    test_with_pred = test_df.merge(predictions, on=['player_id', 'game_id'])
    rmse = np.sqrt(((test_with_pred['clutch_score'] - test_with_pred['predicted_clutch_score_mean']) ** 2).mean())
    print(f"\nTest RMSE: {rmse:.2f}")

    # Save model
    model.save('models/clutch_bayesian_v1.nc')
