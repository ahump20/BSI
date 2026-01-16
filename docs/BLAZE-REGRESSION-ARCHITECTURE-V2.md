# Blaze Sports Intel — Championship Regression & Predictive Architecture v2.0

**"ESPN shows you the score. We show you why it happened and what happens next."**

**Sport Priority:** College Baseball (hero) → MLB → College Football → NFL → College Basketball → Track & Field
**Exclusions:** Soccer (absolute prohibition)
**Stack:** Cloudflare Workers + D1 + KV + R2 + Workers AI + Vectorize + Durable Objects
**Philosophy:** Auditable coefficients. Explainable predictions. Mobile-first delivery. Evidence or no ship.

---

## 🎯 Executive Summary (The Blaze Difference)

While ESPN gives you box scores with zero context, **Blaze Sports Intel** delivers:

1. **Conference-Adjusted Performance Metrics** — SEC baseball ≠ MEAC baseball. Our models normalize by opponent strength, park factors, and scheduling bias.
2. **Video-First Mobile Predictions** — Tap a play → see the prediction + video breakdown + coefficient explanations in <2 seconds.
3. **Cross-Sport Transfer Learning** — A pitcher's biomechanics inform QB throwing motion models. Basketball spacing metrics inform defensive positioning in baseball.
4. **Championship Pressure Index™** — Regress micro-expressions, biometrics, and situational leverage into an 8-dimensional "clutch genome."
5. **Injury Risk Forecasting** — Workload + biomechanics + weather → probability distributions for UCL tears, hamstring pulls, concussion risk.
6. **Youth-to-Pro Trajectory Models** — Perfect Game showcase stats → college performance → draft projection with confidence intervals.

**Bottom line:** We turn intuition into auditable, deployable edge functions that run globally in <50ms and explain _why_ the model said what it said.

---

## 🏆 Unique Differentiators (Why We Win)

### 1. College Baseball as Hero Sport

**The Gap:** ESPN literally shows _only_ the score and inning for college baseball. No box score. No player stats. No preview. No recap.

**Our Answer:**

- **Complete Box Scores** with play-by-play, pitch sequences, and spray charts.
- **Conference-Normalized WAR** — Compare a Texas hitter to an LSU hitter on equal footing.
- **CWS Championship Pressure Metrics** — Who elevates in Omaha? Regress performance vs. seeding, opponent strength, and elimination game context.
- **Transfer Portal Impact Models** — Predict team performance delta from incoming/outgoing players using Ridge regression on historical portal moves.

### 2. Mobile-First Video Intelligence

**Implementation:**

- **Tap-to-Explain:** User taps a play on mobile → sees:
  - Predicted outcome (e.g., "72% swing-and-miss probability")
  - Top 3 contributing features with visual overlays on video
  - Calibration confidence band
  - Similar plays from history (vector search via Vectorize)
- **Progressive Web App (PWA)** with offline model caching via Service Workers.
- **Adaptive Bitrate Video** from R2 with Cloudflare Stream integration.

### 3. Cross-Sport Biomechanical Transfer Learning

**Novel Approach:**

- Train **shared latent space** for throwing mechanics (baseball pitcher ↔ football QB ↔ javelin thrower).
- Use **domain adaptation** (e.g., gradient reversal layers) to transfer learned features across sports.
- **Example:** A QB prospect's high school baseball stats (velo, spin, release consistency) inform draft projections.

**Implementation:**

```python
# Pseudo-code for cross-sport transfer
class BiomechEncoder(nn.Module):
    def __init__(self):
        self.shared_encoder = nn.Linear(biomech_dims, latent_dims)
        self.baseball_head = nn.Linear(latent_dims, baseball_outcomes)
        self.football_head = nn.Linear(latent_dims, football_outcomes)

    def forward(self, x, sport):
        z = self.shared_encoder(x)  # shared latent space
        if sport == 'baseball':
            return self.baseball_head(z)
        elif sport == 'football':
            return self.football_head(z)
```

Export to ONNX → serve via Workers AI with <100ms inference.

### 4. Real-Time Momentum Shift Detection

**The Gap:** Broadcasters talk about "momentum" but can't quantify it.

**Our Solution:**

- **Rolling Win Probability (WP) Delta** — Track WP change per play; flag inflection points.
- **Micro-Expression Shift Detector** — Computer vision on dugout/sideline reactions (via Workers AI vision models).
- **Biometric Stress Indicators** — HRV, skin conductance, pupil dilation (when available) regressed into "tilt state" probability.

**Mobile UX:**

```
📊 Momentum Alert: +18% WP swing in last 3 plays
🔥 Cardinals bench energy: 94th percentile
⚡ Top factor: Stolen base + pitcher distraction index
```

### 5. Injury Risk Prediction (Legal, Defensible)

**Regulatory Compliance:**

- **Disclaimer:** "Educational tool; not medical advice. Consult team physicians."
- **Aggregate-Only Public Display** — Individual player risk shown only to authenticated team staff.
- **Auditable Features** — No protected health info; only public workload data + biomechanics.

**Model:**

```python
# Logistic regression for UCL tear risk (pitchers)
features = [
    'pitches_last_7d',
    'pitches_last_30d',
    'max_velo_delta',      # sudden velo spikes = risk
    'spin_rate_variance',
    'elbow_varus_torque',  # from video biomech
    'days_since_rest',
    'opponent_strength',   # more stress vs elite hitters
    'temperature_f',       # cold = injury risk
    'career_innings'
]
target = 'ucl_tear_next_30d'  # binary

# Output: probability + confidence interval + top risk factors
```

**Dashboard (Team Access Only):**

```
🚨 High Risk (next 30 days):
  - Player #17: 23% UCL tear probability
    Top factors: 340 pitches last 7 days (+12% above safe threshold)
                 Velo spike +3.2 mph (84th percentile stress)
    Recommendation: 5-day rest + biomech review
```

### 6. Championship Pressure Index™ (8-Dimensional Model)

**Beyond Traditional "Clutch":**

| Dimension            | Features                                            | Target Variable                           |
| -------------------- | --------------------------------------------------- | ----------------------------------------- |
| **Clutch Gene**      | Leverage index, deficit size, elimination game flag | Performance delta vs. expected            |
| **Killer Instinct**  | Late-inning aggression, risk-taking frequency       | Win probability added in final 2 innings  |
| **Flow State**       | Reaction time consistency, biomech smoothness       | Performance variance (lower = better)     |
| **Mental Fortress**  | Error recovery speed, tilt resistance               | Next-play performance after failure       |
| **Predator Mindset** | First-pitch aggression, early-count dominance       | Damage on hitter's counts                 |
| **Champion Aura**    | Team WP lift when player enters, leadership proxies | Team performance delta with/without       |
| **Winner DNA**       | Career elimination game record, postseason splits   | Historical clutch performance             |
| **Beast Mode**       | Max effort plays, hustle metrics                    | Physical intensity in high-leverage spots |

**Regression Setup:**

```python
# Multi-task learning: 8 outputs from shared features
import torch.nn as nn

class ChampionEnigmaModel(nn.Module):
    def __init__(self):
        self.shared = nn.Sequential(
            nn.Linear(biomech_dims + context_dims + micro_expression_dims, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 64)
        )
        # 8 task-specific heads
        self.clutch_gene = nn.Linear(64, 1)
        self.killer_instinct = nn.Linear(64, 1)
        self.flow_state = nn.Linear(64, 1)
        # ... (6 more)

    def forward(self, x):
        shared_repr = self.shared(x)
        return {
            'clutch_gene': torch.sigmoid(self.clutch_gene(shared_repr)),
            'killer_instinct': torch.sigmoid(self.killer_instinct(shared_repr)),
            # ... (6 more)
        }
```

**Mobile Visualization:**

```
🏆 Championship Pressure Index
Player: John Smith, Texas Longhorns

        Clutch Gene ████████░░ 84th %ile
    Killer Instinct ██████████ 96th %ile
         Flow State ███████░░░ 71st %ile
    Mental Fortress ████████░░ 82nd %ile
   Predator Mindset █████████░ 88th %ile
      Champion Aura ██████░░░░ 63rd %ile
        Winner DNA ███████████ 99th %ile (CWS MVP)
        Beast Mode ████████░░ 79th %ile

📊 Confidence: 87% (n=156 high-leverage PAs)
🎯 Predicted CWS Performance: +.087 OPS vs regular season
```

---

## 📊 Data Architecture (Immutable, Auditable, Fast)

### Entity Model (Canonical IDs)

```
sport:league:season:entity_type:entity_id

Examples:
  baseball:ncaa:2025:team:texas-longhorns
  baseball:ncaa:2025:player:smith-john-12345
  baseball:ncaa:2025:game:20250519-texas-lsu
  baseball:ncaa:2025:play:20250519-texas-lsu-b3-p7
```

### D1 Schema (Minimal, Indexed, Time-Series Optimized)

```sql
-- Core Entities
CREATE TABLE teams (
  team_id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  league TEXT NOT NULL,
  name TEXT NOT NULL,
  conference TEXT,
  division TEXT,
  founded_year INT,
  venue_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_teams_league_conf ON teams(league, conference);

CREATE TABLE players (
  player_id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(team_id),
  first_name TEXT,
  last_name TEXT,
  jersey_number INT,
  position TEXT,
  height_cm INT,
  weight_kg INT,
  birthdate TEXT,
  throws TEXT,
  bats TEXT,
  draft_year INT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_players_team ON players(team_id);

CREATE TABLE games (
  game_id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  league TEXT NOT NULL,
  season INT NOT NULL,
  game_date TEXT NOT NULL,  -- ISO8601 America/Chicago
  home_team_id TEXT REFERENCES teams(team_id),
  away_team_id TEXT REFERENCES teams(team_id),
  home_score INT,
  away_score INT,
  venue_id TEXT,
  weather JSON,  -- {temp_f, wind_mph, precip, humidity}
  status TEXT,   -- scheduled, in_progress, final, postponed
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_season ON games(league, season);

-- Play-by-Play (Baseball Example)
CREATE TABLE plays_baseball (
  play_id TEXT PRIMARY KEY,
  game_id TEXT REFERENCES games(game_id) NOT NULL,
  inning INT NOT NULL,
  top_bot TEXT CHECK(top_bot IN ('top','bot')),
  outs INT CHECK(outs BETWEEN 0 AND 2),
  batter_id TEXT REFERENCES players(player_id),
  pitcher_id TEXT REFERENCES players(player_id),
  pitch_sequence JSON,  -- [{type, velo, spin, zone_x, zone_y, result}]
  play_outcome TEXT,    -- single, double, HR, K, BB, etc.
  runs_scored INT DEFAULT 0,
  base_state_before TEXT,  -- '---', '1--', '12-', '123', etc.
  base_state_after TEXT,
  leverage_index REAL,
  win_prob_before REAL,
  win_prob_after REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_plays_game ON plays_baseball(game_id);
CREATE INDEX idx_plays_pitcher ON plays_baseball(pitcher_id);
CREATE INDEX idx_plays_batter ON plays_baseball(batter_id);

-- Features (Denormalized for Speed)
CREATE TABLE features_baseball_batted_ball (
  feature_id TEXT PRIMARY KEY,
  play_id TEXT REFERENCES plays_baseball(play_id),
  exit_velo REAL,
  launch_angle REAL,
  spray_angle REAL,
  bat_speed REAL,
  attack_angle REAL,
  on_plane_time_ms REAL,
  contact_depth_cm REAL,
  swing_decision_time_ms REAL,
  hand_speed REAL,
  torso_rotation_deg REAL,
  head_stability_px REAL,
  stride_length_cm REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_features_bb_play ON features_baseball_batted_ball(play_id);

CREATE TABLE features_micro_expression (
  feature_id TEXT PRIMARY KEY,
  entity_type TEXT,  -- player, dugout, coach
  entity_id TEXT,
  timestamp TEXT,
  agency REAL CHECK(agency BETWEEN 0 AND 1),
  focus REAL CHECK(focus BETWEEN 0 AND 1),
  tension REAL CHECK(tension BETWEEN 0 AND 1),
  confidence REAL CHECK(confidence BETWEEN 0 AND 1),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_micro_expr_entity ON features_micro_expression(entity_type, entity_id);

-- Labels (Ground Truth)
CREATE TABLE labels (
  label_id TEXT PRIMARY KEY,
  entity_scope TEXT,  -- play, player, game, season
  entity_id TEXT,
  label_type TEXT,    -- is_barrel, is_hr, xwoba, run_value, injury_occurred
  value_numeric REAL,
  value_categorical TEXT,
  confidence REAL,    -- 0.0-1.0
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_labels_scope ON labels(entity_scope, entity_id);

-- Model Registry
CREATE TABLE model_registry (
  model_id TEXT PRIMARY KEY,
  model_key TEXT NOT NULL,     -- xwoba_batball_v1
  version TEXT NOT NULL,        -- semver or git hash
  artifact_r2_uri TEXT NOT NULL,
  algo TEXT,                    -- logistic_l2, ridge, lasso, elastic_net
  sport TEXT,
  league TEXT,
  train_date_start TEXT,
  train_date_end TEXT,
  features_json JSON,           -- [{name, mean, std}]
  hyperparams_json JSON,        -- {C: 1.0, alpha: 0.01}
  performance_metrics JSON,     -- {auc, rmse, ece, calibration_plot}
  status TEXT DEFAULT 'canary', -- canary, champion, archived
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_model_key ON model_registry(model_key);
CREATE INDEX idx_model_status ON model_registry(status);

-- Evaluation Snapshots
CREATE TABLE eval_snapshots (
  eval_id TEXT PRIMARY KEY,
  model_id TEXT REFERENCES model_registry(model_id),
  dataset_tag TEXT,  -- holdout_2025, val_fold_3
  eval_timestamp TEXT,
  metrics_json JSON, -- {auc, pr_auc, rmse, mae, ece, brier, lift_table, confusion_matrix}
  feature_importance_json JSON,
  calibration_plot_json JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_eval_model ON eval_snapshots(model_id);

-- Prediction Log (Audit Trail)
CREATE TABLE prediction_log (
  prediction_id TEXT PRIMARY KEY,
  model_id TEXT REFERENCES model_registry(model_id),
  entity_id TEXT,   -- play_id, player_id, etc.
  features_json JSON,
  prediction_value REAL,
  prediction_proba REAL,
  top_contributors_json JSON,  -- [{feature, weight, contribution}]
  actual_outcome REAL,  -- populated later when known
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_pred_log_model ON prediction_log(model_id);
CREATE INDEX idx_pred_log_timestamp ON prediction_log(timestamp);
```

### R2 Layout (Immutable Artifacts)

```
r2://bsi-models/
  baseball/
    ncaa/
      xwoba_batball_v1/
        xwoba_batball_v1-2025-10-19-7f3a45c/
          artifact.json          # Model weights, scaler params
          metadata.json          # Training info, Git hash
          calibration_plot.json
          feature_importance.png
          eval_metrics.json
      injury_ucl_v1/
        injury_ucl_v1-2025-10-19-8g4b56d/
          artifact.json
          ...
    mlb/
      ...
  football/
    ...

r2://bsi-raw-data/
  baseball/
    ncaa/
      2025/
        games/
          20250519-texas-lsu.parquet
        plays/
          20250519-texas-lsu-plays.parquet
        features/
          batted_ball/
            20250519-batch.parquet
```

### KV Namespace Layout (Hot Paths)

```
alias:xwoba_batball_v1 → "r2://bsi-models/.../artifact.json"
alias:injury_ucl_v1 → "r2://bsi-models/.../artifact.json"

cache:mlb:standings:2025 → {...}  # TTL: 5min
cache:ncaa:baseball:texas:roster → {...}  # TTL: 1hr

drift:xwoba_batball_v1:psi → 0.023  # Population Stability Index
drift:xwoba_batball_v1:status → "ok" | "warning" | "critical"

health:model:xwoba_batball_v1 → {last_check, auc_7d, ece_7d}
```

---

## 🧮 Feature Engineering (Sport-Specific)

### College Baseball (Priority 1)

#### Batted Ball Features

```python
features_batted_ball = [
    # Contact Quality
    'bat_speed',              # mph (ShowIQ, Blast Motion)
    'attack_angle',           # degrees (optimal ~15-20°)
    'on_plane_time_ms',       # time bat is in hitting plane
    'contact_depth_cm',       # distance from home plate
    'swing_decision_time_ms', # reaction time

    # Body Mechanics
    'hand_speed',             # mph
    'torso_rotation_deg',     # degrees (hip-shoulder separation)
    'head_stability_px',      # video tracking (lower = better)
    'stride_length_cm',       # approach mechanics
    'weight_transfer_pct',    # force plate data

    # Pitch Context (Opponent Features)
    'pitch_velo',
    'pitch_spin_rpm',
    'pitch_movement_horizontal_in',
    'pitch_movement_vertical_in',
    'zone_x',                 # -1 to 1 (left to right)
    'zone_y',                 # 0 to 4 (bottom to top)
    'pitch_type_fastball',    # one-hot
    'pitch_type_breaking',
    'pitch_type_offspeed',

    # Situational Context
    'leverage_index',         # 0.0-3.0+ (LI)
    'run_expectancy_state',   # RE24 matrix lookup
    'outs',                   # 0, 1, 2
    'base_state_numeric',     # 0-7 encoding
    'deficit',                # negative = trailing
    'inning',                 # 1-9+

    # Conference/Opponent Adjustments
    'opponent_conference_strength',  # Elo-based
    'opponent_pitcher_k_rate_adj',   # conference-normalized
    'park_factor_runs',              # venue adjustments
    'temperature_f',
    'wind_speed_mph',
    'wind_direction_degrees',

    # Micro-Expressions (Video AI)
    'micro_expr_agency',      # 0.0-1.0
    'micro_expr_focus',       # 0.0-1.0
    'micro_expr_tension',     # 0.0-1.0 (inverted)
    'micro_expr_confidence',  # 0.0-1.0
]

# Target Variables (Multi-Task)
targets = {
    'is_barrel': binary,           # Savant definition: 98+ mph EV, 8-50° LA
    'is_home_run': binary,
    'is_extra_base_hit': binary,
    'xwoba': continuous,           # expected wOBA
    'run_value': continuous,       # run expectancy delta
    'launch_angle': continuous,    # for predicting trajectory
    'exit_velocity': continuous,
}
```

#### Conference Normalization

```python
def normalize_by_conference(player_stat, player_conference, league='ncaa_baseball'):
    """
    Adjust player stats by conference strength using hierarchical Bayesian priors.

    Example:
      A .350 hitter in the MEAC is not equal to a .350 hitter in the SEC.
      We regress toward conference mean weighted by conference Elo.
    """
    conference_elo = get_conference_elo(player_conference, league)
    league_avg_elo = get_league_avg_elo(league)

    # Shrinkage factor (James-Stein estimator)
    shrinkage = (conference_elo - league_avg_elo) / league_avg_elo
    adjusted_stat = player_stat * (1 + shrinkage)

    return adjusted_stat

# Example Usage
texas_hitter_ba = 0.350
sec_elo = 1520
league_avg_elo = 1450

adjusted_ba = normalize_by_conference(texas_hitter_ba, 'SEC', 'ncaa_baseball')
# adjusted_ba ≈ 0.367 (upgraded due to SEC strength)
```

### MLB Features (Similar but add MLB Statcast)

```python
features_mlb = features_batted_ball + [
    'xba',              # Statcast expected BA
    'xslg',             # Statcast expected SLG
    'sprint_speed',     # ft/sec
    'arm_strength',     # mph (outfielders)
    'framing_runs',     # catchers only
]
```

### Football Features (College + NFL)

```python
features_football = [
    # Pre-Snap
    'down',
    'distance',
    'field_position',
    'score_differential',
    'time_remaining',
    'personnel_grouping',  # 11, 12, 21, etc.
    'formation_hash',
    'motion_type',

    # QB Mechanics
    'time_to_throw',
    'pocket_depth',
    'release_angle',
    'ball_velocity',
    'throw_distance',

    # Receiver
    'separation_at_catch',
    'yards_after_catch',
    'contested_catch_rate',

    # Conference Adjustments
    'opponent_conference_strength',
    'opponent_def_efficiency',

    # Targets
    'epa': continuous,         # Expected Points Added
    'success': binary,         # EPA > 0
    'completion_prob': continuous,
    'yards_gained': continuous,
]
```

### Basketball Features

```python
features_basketball = [
    # Shot Quality
    'shot_distance',
    'shot_clock',
    'defender_distance',
    'shot_angle',
    'touch_time',

    # Lineup Context
    'lineup_spacing_metric',
    'pace_last_5_poss',
    'offensive_rebound_rate',

    # Targets
    'make_probability': continuous,
    'points_per_possession': continuous,
]
```

---

## 🤖 Model Architecture (Edge-Optimized)

### Base Models (Regularized Linear/Logistic)

#### 1. Logistic Regression (Binary Outcomes)

```python
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.calibration import CalibratedClassifierCV

# Example: Home Run Prediction
X_train, y_train = load_college_baseball_features('is_home_run')

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_train)

# L2 regularization (Ridge penalty)
clf = LogisticRegression(
    penalty='l2',
    C=1.0,              # Inverse of regularization strength
    solver='lbfgs',
    max_iter=1000,
    class_weight='balanced',  # Handle imbalanced data (HRs are rare)
    random_state=42
)

clf.fit(X_scaled, y_train)

# Calibration (Platt Scaling)
calibrated_clf = CalibratedClassifierCV(clf, method='sigmoid', cv=5)
calibrated_clf.fit(X_scaled, y_train)

# Export to JSON artifact
artifact = {
    'model_key': 'is_home_run_v1',
    'model_id': f'is_home_run_v1-{timestamp}',
    'algo': 'logistic_l2',
    'features': [
        {'name': feat, 'mean': scaler.mean_[i], 'std': scaler.scale_[i]}
        for i, feat in enumerate(feature_names)
    ],
    'coefficients': {
        feat: float(clf.coef_[0][i])
        for i, feat in enumerate(feature_names)
    },
    'intercept': float(clf.intercept_[0]),
    'calibrator': extract_platt_params(calibrated_clf),
}
```

#### 2. Ridge Regression (Continuous Targets)

```python
from sklearn.linear_model import Ridge

# Example: xwOBA Prediction
X_train, y_train = load_college_baseball_features('xwoba')

ridge = Ridge(
    alpha=10.0,         # L2 penalty strength
    solver='auto',
    random_state=42
)

ridge.fit(X_scaled, y_train)

# Same artifact export pattern
```

#### 3. Lasso Regression (Feature Selection)

```python
from sklearn.linear_model import Lasso

# Useful when you have 100+ features and want automatic selection
lasso = Lasso(
    alpha=0.01,
    max_iter=10000,
    random_state=42
)

lasso.fit(X_scaled, y_train)

# Extract non-zero coefficients for artifact
non_zero_features = [
    {'name': feature_names[i], 'coef': lasso.coef_[i]}
    for i in range(len(feature_names))
    if abs(lasso.coef_[i]) > 1e-6
]
```

#### 4. Elastic Net (Best of Both)

```python
from sklearn.linear_model import ElasticNet

elastic = ElasticNet(
    alpha=1.0,
    l1_ratio=0.5,  # 0.5 = equal mix of L1 and L2
    max_iter=10000,
    random_state=42
)

elastic.fit(X_scaled, y_train)
```

### Multi-Task Learning (Champion Enigma)

```python
import torch
import torch.nn as nn

class ChampionEnigmaModel(nn.Module):
    """
    8-dimensional regression from shared biomech + micro-expression features.
    Outputs percentile scores for each dimension.
    """
    def __init__(self, input_dim=50):
        super().__init__()

        # Shared feature extractor
        self.shared = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.2),
        )

        # Task-specific heads (8 dimensions)
        self.clutch_gene = nn.Linear(64, 1)
        self.killer_instinct = nn.Linear(64, 1)
        self.flow_state = nn.Linear(64, 1)
        self.mental_fortress = nn.Linear(64, 1)
        self.predator_mindset = nn.Linear(64, 1)
        self.champion_aura = nn.Linear(64, 1)
        self.winner_dna = nn.Linear(64, 1)
        self.beast_mode = nn.Linear(64, 1)

    def forward(self, x):
        shared_repr = self.shared(x)

        return {
            'clutch_gene': torch.sigmoid(self.clutch_gene(shared_repr)),
            'killer_instinct': torch.sigmoid(self.killer_instinct(shared_repr)),
            'flow_state': torch.sigmoid(self.flow_state(shared_repr)),
            'mental_fortress': torch.sigmoid(self.mental_fortress(shared_repr)),
            'predator_mindset': torch.sigmoid(self.predator_mindset(shared_repr)),
            'champion_aura': torch.sigmoid(self.champion_aura(shared_repr)),
            'winner_dna': torch.sigmoid(self.winner_dna(shared_repr)),
            'beast_mode': torch.sigmoid(self.beast_mode(shared_repr)),
        }

# Training with multi-task loss
def train_enigma(model, dataloader, optimizer, device):
    model.train()
    total_loss = 0

    for batch in dataloader:
        features, labels = batch  # labels = {clutch_gene: [0.7, ...], ...}
        features = features.to(device)

        optimizer.zero_grad()
        outputs = model(features)

        # Weighted loss for each task
        loss = 0
        for task_name in outputs.keys():
            task_labels = labels[task_name].to(device)
            task_loss = nn.MSELoss()(outputs[task_name].squeeze(), task_labels)
            loss += task_loss

        loss.backward()
        optimizer.step()
        total_loss += loss.item()

    return total_loss / len(dataloader)

# Export to ONNX for Workers AI
torch.onnx.export(
    model,
    dummy_input,
    "champion_enigma_v1.onnx",
    input_names=['features'],
    output_names=list(model.forward(dummy_input).keys()),
    dynamic_axes={'features': {0: 'batch_size'}}
)
```

### Cross-Sport Transfer Learning

```python
class BiomechTransferModel(nn.Module):
    """
    Shared encoder for throwing mechanics across sports.
    Domain adaptation via gradient reversal.
    """
    def __init__(self, biomech_dims=20, latent_dims=16):
        super().__init__()

        # Shared encoder
        self.encoder = nn.Sequential(
            nn.Linear(biomech_dims, 64),
            nn.ReLU(),
            nn.Linear(64, latent_dims)
        )

        # Sport-specific decoders
        self.baseball_decoder = nn.Sequential(
            nn.Linear(latent_dims, 32),
            nn.ReLU(),
            nn.Linear(32, 3)  # [velo, spin, command]
        )

        self.football_decoder = nn.Sequential(
            nn.Linear(latent_dims, 32),
            nn.ReLU(),
            nn.Linear(32, 3)  # [velocity, accuracy, decision_time]
        )

        # Domain classifier (for adversarial training)
        self.domain_classifier = nn.Sequential(
            GradientReversal(),
            nn.Linear(latent_dims, 16),
            nn.ReLU(),
            nn.Linear(16, 2)  # [baseball, football]
        )

    def forward(self, x, sport):
        z = self.encoder(x)  # Shared latent space
        domain_pred = self.domain_classifier(z)

        if sport == 'baseball':
            return self.baseball_decoder(z), domain_pred
        elif sport == 'football':
            return self.football_decoder(z), domain_pred

class GradientReversal(nn.Module):
    """Gradient reversal layer for domain adaptation."""
    def __init__(self, alpha=1.0):
        super().__init__()
        self.alpha = alpha

    def forward(self, x):
        return GradientReversalFunction.apply(x, self.alpha)

# Training encourages domain-invariant features
```

---

## ⚡ Edge Inference (Cloudflare Workers)

### Artifact Schema (R2 JSON)

```json
{
  "schema_version": "2.0",
  "model_key": "xwoba_batball_ncaa_v1",
  "model_id": "xwoba_batball_ncaa_v1-2025-10-19-a7f3c4e",
  "sport": "baseball",
  "league": "ncaa",
  "created_at": "2025-10-19T14:30:00-05:00",
  "git_hash": "a7f3c4e",
  "algo": "logistic_l2",
  "performance": {
    "auc": 0.847,
    "ece": 0.023,
    "brier": 0.068,
    "calibration_slope": 1.02
  },
  "features": [
    { "name": "bat_speed", "mean": 68.3, "std": 5.1, "unit": "mph" },
    { "name": "attack_angle", "mean": 14.2, "std": 6.3, "unit": "degrees" },
    { "name": "leverage_index", "mean": 1.05, "std": 0.8, "unit": "dimensionless" }
  ],
  "coefficients": {
    "bat_speed": 0.094,
    "attack_angle": 0.037,
    "on_plane_time_ms": 0.015,
    "pitch_velo": 0.021,
    "leverage_index": 0.008,
    "opponent_conference_strength": -0.032
  },
  "intercept": -7.2,
  "calibrator": {
    "type": "platt",
    "a": 1.02,
    "b": -0.11
  },
  "metadata": {
    "train_samples": 45823,
    "val_samples": 11456,
    "train_date_range": ["2020-02-01", "2025-06-30"],
    "conferences": ["SEC", "ACC", "Big 12", "Pac-12", "Big Ten"],
    "notes": "Conference-adjusted model. No post-contact features."
  }
}
```

### Workers Inference (TypeScript)

```typescript
// /functions/api/v1/predict/[[model]].ts

export interface Env {
  KV: KVNamespace;
  R2: R2Bucket;
  ANALYTICS: AnalyticsEngineDataset;
}

interface Artifact {
  model_id: string;
  features: Array<{ name: string; mean: number; std: number }>;
  coefficients: Record<string, number>;
  intercept: number;
  calibrator?: { type: 'platt'; a: number; b: number };
}

function standardize(value: number, mean: number, std: number): number {
  return std > 0 ? (value - mean) / std : 0;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function plattCalibration(rawProb: number, a: number, b: number): number {
  const logit = Math.log(rawProb / (1 - rawProb + 1e-10));
  return sigmoid(a * logit + b);
}

async function loadModel(modelKey: string, env: Env): Promise<Artifact> {
  // Check KV for alias
  const aliasKey = `alias:${modelKey}`;
  const r2Uri = await env.KV.get(aliasKey);

  if (!r2Uri) {
    throw new Error(`Model alias not found: ${modelKey}`);
  }

  // Fetch from R2
  const obj = await env.R2.get(r2Uri);
  if (!obj) {
    throw new Error(`Artifact not found in R2: ${r2Uri}`);
  }

  return await obj.json<Artifact>();
}

function predict(artifact: Artifact, features: Record<string, number>) {
  let linear = artifact.intercept;
  const contributions: Array<{ feature: string; contribution: number }> = [];

  for (const feat of artifact.features) {
    const rawValue = features[feat.name] ?? 0;
    const zScore = standardize(rawValue, feat.mean, feat.std);
    const coef = artifact.coefficients[feat.name] ?? 0;
    const contrib = coef * zScore;

    linear += contrib;
    contributions.push({ feature: feat.name, contribution: contrib });
  }

  // Raw probability
  let prob = sigmoid(linear);

  // Calibration
  if (artifact.calibrator?.type === 'platt') {
    const { a, b } = artifact.calibrator;
    prob = plattCalibration(prob, a, b);
  }

  // Sort contributors by absolute value
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    probability: prob,
    linear_score: linear,
    top_contributors: contributions.slice(0, 5),
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const modelKey = params.model as string;

  try {
    const body = await request.json<{ features: Record<string, number> }>();
    const artifact = await loadModel(modelKey, env);
    const result = predict(artifact, body.features);

    // Log prediction for monitoring
    env.ANALYTICS.writeDataPoint({
      blobs: [modelKey, artifact.model_id],
      doubles: [result.probability],
      indexes: ['prediction'],
    });

    return new Response(
      JSON.stringify({
        model_id: artifact.model_id,
        prediction: result.probability,
        linear_score: result.linear_score,
        top_contributors: result.top_contributors,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store', // Predictions should not be cached
        },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

### Mobile API Request

```javascript
// Example: Predict HR probability for college baseball swing

const features = {
  bat_speed: 72.1,
  attack_angle: 16.5,
  on_plane_time_ms: 34,
  pitch_velo: 91.8,
  zone_x: 0.3,
  zone_y: 2.1,
  leverage_index: 1.8,
  opponent_conference_strength: 1520, // SEC Elo
  micro_expr_agency: 0.84,
  micro_expr_focus: 0.91,
};

const response = await fetch('https://blazesportsintel.com/api/v1/predict/xwoba_batball_ncaa_v1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userToken}`,
  },
  body: JSON.stringify({ features }),
});

const result = await response.json();
/*
{
  "model_id": "xwoba_batball_ncaa_v1-2025-10-19-a7f3c4e",
  "prediction": 0.327,
  "linear_score": -0.74,
  "top_contributors": [
    {"feature": "bat_speed", "contribution": 0.42},
    {"feature": "micro_expr_focus", "contribution": 0.31},
    {"feature": "attack_angle", "contribution": 0.18},
    {"feature": "leverage_index", "contribution": 0.09},
    {"feature": "opponent_conference_strength", "contribution": -0.21}
  ],
  "timestamp": "2025-10-19T19:45:12.334Z"
}
*/

// Mobile UI displays:
// 🎯 Home Run Probability: 32.7%
// 🔥 Top Factors:
//   • Bat Speed (+0.42) - Elite contact
//   • Focus (+0.31) - Locked in
//   • SEC Pitching (-0.21) - Tough opponent
```

---

## 📱 Mobile-First UX (The Differentiator)

### Tap-to-Explain Interaction

```javascript
// React Native / PWA Component

import React, { useState } from 'react';
import { Video } from 'cloudflare-stream-react';

function PlayPrediction({ playId }) {
  const [prediction, setPrediction] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handlePlayTap = async () => {
    // Fetch prediction from edge
    const response = await fetch(`/api/v1/plays/${playId}/prediction`);
    const data = await response.json();
    setPrediction(data);
    setShowExplanation(true);
  };

  return (
    <div className="play-card" onClick={handlePlayTap}>
      {/* Video player with overlay */}
      <Video
        controls={false}
        src={`https://customer-${STREAM_ID}.cloudflarestream.com/${playId}/manifest/video.m3u8`}
        className="play-video"
      />

      {showExplanation && prediction && (
        <div className="prediction-overlay">
          <div className="prediction-header">
            <span className="prob-badge">
              {(prediction.prediction * 100).toFixed(1)}% HR Probability
            </span>
            <span className="confidence">Confidence: {prediction.confidence}</span>
          </div>

          <div className="top-contributors">
            <h4>Why this prediction?</h4>
            {prediction.top_contributors.map((c, i) => (
              <div key={i} className="contributor-row">
                <span className="feature-name">{formatFeatureName(c.feature)}</span>
                <div className="contrib-bar">
                  <div
                    className={c.contribution > 0 ? 'positive' : 'negative'}
                    style={{ width: `${Math.abs(c.contribution) * 100}%` }}
                  />
                </div>
                <span className="contrib-value">
                  {c.contribution > 0 ? '+' : ''}
                  {c.contribution.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <button onClick={() => fetchSimilarPlays(playId)}>See Similar Plays</button>
        </div>
      )}
    </div>
  );
}
```

### Progressive Web App (PWA) Config

```json
{
  "name": "Blaze Sports Intel",
  "short_name": "Blaze",
  "description": "Championship Sports Analytics",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#FF6B00",
  "background_color": "#1A1A1A",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "orientation": "portrait",
  "categories": ["sports", "analytics"],
  "offline_enabled": true
}
```

### Service Worker (Offline Model Caching)

```javascript
// service-worker.js

const CACHE_VERSION = 'v2';
const MODEL_CACHE = `models-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// Cache model artifacts for offline use
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(MODEL_CACHE).then((cache) => {
      return cache.addAll([
        '/api/v1/models/xwoba_batball_ncaa_v1/artifact',
        '/api/v1/models/injury_ucl_v1/artifact',
        '/api/v1/models/champion_enigma_v1/artifact',
      ]);
    })
  );
});

// Serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/v1/models/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
```

---

## 🔬 Training Pipeline (Batch Jobs)

### Data Assembly (Parquet from R2)

```python
import pyarrow.parquet as pq
import pandas as pd
from cloudflare_r2 import R2Client

def assemble_training_data(sport='baseball', league='ncaa', season=2025):
    """
    Pull raw data from R2, join with features and labels, return training matrix.
    """
    r2 = R2Client(
        account_id=CLOUDFLARE_ACCOUNT_ID,
        access_key_id=R2_ACCESS_KEY,
        secret_access_key=R2_SECRET_KEY,
    )

    # Load plays
    plays_key = f'baseball/ncaa/{season}/plays/all_plays.parquet'
    plays_df = pq.read_table(r2.get_object('bsi-raw-data', plays_key)).to_pandas()

    # Load batted ball features
    features_key = f'baseball/ncaa/{season}/features/batted_ball/all_features.parquet'
    features_df = pq.read_table(r2.get_object('bsi-raw-data', features_key)).to_pandas()

    # Load labels
    labels_key = f'baseball/ncaa/{season}/labels/all_labels.parquet'
    labels_df = pq.read_table(r2.get_object('bsi-raw-data', labels_key)).to_pandas()

    # Join on play_id
    data = plays_df.merge(features_df, on='play_id', how='inner')
    data = data.merge(labels_df, on='play_id', how='inner')

    # Filter out plays with missing critical features
    data = data.dropna(subset=['bat_speed', 'attack_angle', 'pitch_velo'])

    # Add conference strength (from separate table)
    conference_elo = load_conference_elo(league, season)
    data = data.merge(conference_elo, on='team_id', how='left')

    return data

def time_split(df, val_frac=0.2, test_frac=0.1):
    """
    Time-based split (no future leakage).
    """
    df = df.sort_values('game_date')
    n = len(df)

    train_end = int(n * (1 - val_frac - test_frac))
    val_end = int(n * (1 - test_frac))

    train = df.iloc[:train_end]
    val = df.iloc[train_end:val_end]
    test = df.iloc[val_end:]

    return train, val, test
```

### Hyperparameter Search (Time-Series CV)

```python
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import roc_auc_score, mean_squared_error
import numpy as np

def tune_logistic_regression(X, y, param_grid):
    """
    Time-series cross-validation for hyperparameter tuning.
    """
    tscv = TimeSeriesSplit(n_splits=5)
    best_auc = -1
    best_params = None

    for C in param_grid['C']:
        for class_weight in param_grid['class_weight']:
            fold_aucs = []

            for train_idx, val_idx in tscv.split(X):
                X_train, X_val = X[train_idx], X[val_idx]
                y_train, y_val = y[train_idx], y[val_idx]

                scaler = StandardScaler()
                X_train_scaled = scaler.fit_transform(X_train)
                X_val_scaled = scaler.transform(X_val)

                clf = LogisticRegression(
                    penalty='l2',
                    C=C,
                    class_weight=class_weight,
                    solver='lbfgs',
                    max_iter=1000,
                    random_state=42
                )

                clf.fit(X_train_scaled, y_train)
                y_pred_proba = clf.predict_proba(X_val_scaled)[:, 1]

                auc = roc_auc_score(y_val, y_pred_proba)
                fold_aucs.append(auc)

            mean_auc = np.mean(fold_aucs)

            if mean_auc > best_auc:
                best_auc = mean_auc
                best_params = {'C': C, 'class_weight': class_weight}

    return best_params, best_auc

# Grid search
param_grid = {
    'C': [0.1, 0.5, 1.0, 2.0, 5.0],
    'class_weight': ['balanced', None],
}

best_params, best_auc = tune_logistic_regression(X_train, y_train, param_grid)
print(f"Best params: {best_params}, Best AUC: {best_auc:.4f}")
```

### Calibration (Platt Scaling)

```python
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
import matplotlib.pyplot as plt

def calibrate_model(clf, X_val, y_val):
    """
    Apply Platt scaling to calibrate probabilities.
    """
    calibrated_clf = CalibratedClassifierCV(clf, method='sigmoid', cv='prefit')
    calibrated_clf.fit(X_val, y_val)

    return calibrated_clf

def plot_calibration_curve(y_true, y_pred_proba, n_bins=10):
    """
    Plot calibration curve to visualize probability calibration.
    """
    prob_true, prob_pred = calibration_curve(y_true, y_pred_proba, n_bins=n_bins)

    plt.figure(figsize=(8, 6))
    plt.plot(prob_pred, prob_true, marker='o', label='Model')
    plt.plot([0, 1], [0, 1], linestyle='--', label='Perfect Calibration')
    plt.xlabel('Predicted Probability')
    plt.ylabel('Observed Frequency')
    plt.title('Calibration Curve')
    plt.legend()
    plt.grid(True)
    plt.savefig('calibration_curve.png')
    plt.close()

# After training
calibrated_clf = calibrate_model(clf, X_val_scaled, y_val)
y_pred_cal = calibrated_clf.predict_proba(X_test_scaled)[:, 1]
plot_calibration_curve(y_test, y_pred_cal)
```

### Evaluation Metrics

```python
from sklearn.metrics import (
    roc_auc_score, average_precision_score, brier_score_loss,
    confusion_matrix, classification_report
)

def evaluate_model(y_true, y_pred_proba, threshold=0.5):
    """
    Comprehensive model evaluation.
    """
    y_pred_binary = (y_pred_proba >= threshold).astype(int)

    metrics = {
        'auc_roc': roc_auc_score(y_true, y_pred_proba),
        'auc_pr': average_precision_score(y_true, y_pred_proba),
        'brier_score': brier_score_loss(y_true, y_pred_proba),
        'ece': expected_calibration_error(y_true, y_pred_proba),
        'confusion_matrix': confusion_matrix(y_true, y_pred_binary).tolist(),
        'classification_report': classification_report(y_true, y_pred_binary, output_dict=True),
    }

    return metrics

def expected_calibration_error(y_true, y_pred_proba, n_bins=10):
    """
    Calculate Expected Calibration Error (ECE).
    Lower is better (0 = perfect calibration).
    """
    bins = np.linspace(0, 1, n_bins + 1)
    bin_indices = np.digitize(y_pred_proba, bins) - 1

    ece = 0
    for i in range(n_bins):
        mask = bin_indices == i
        if mask.sum() > 0:
            bin_acc = y_true[mask].mean()
            bin_conf = y_pred_proba[mask].mean()
            ece += mask.sum() / len(y_true) * abs(bin_acc - bin_conf)

    return ece

# Evaluate
metrics = evaluate_model(y_test, y_pred_cal)
print(f"AUC-ROC: {metrics['auc_roc']:.4f}")
print(f"AUC-PR: {metrics['auc_pr']:.4f}")
print(f"Brier Score: {metrics['brier_score']:.4f}")
print(f"ECE: {metrics['ece']:.4f}")
```

### Artifact Export

```python
import json
from datetime import datetime, timezone

def export_artifact(clf, scaler, feature_names, model_key, metrics, calibrator=None):
    """
    Package model into JSON artifact for R2 storage.
    """
    artifact = {
        'schema_version': '2.0',
        'model_key': model_key,
        'model_id': f"{model_key}-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}",
        'created_at': datetime.now(timezone.utc).isoformat(),
        'algo': 'logistic_l2',
        'performance': {
            'auc_roc': float(metrics['auc_roc']),
            'auc_pr': float(metrics['auc_pr']),
            'brier_score': float(metrics['brier_score']),
            'ece': float(metrics['ece']),
        },
        'features': [
            {
                'name': name,
                'mean': float(scaler.mean_[i]),
                'std': float(scaler.scale_[i]),
            }
            for i, name in enumerate(feature_names)
        ],
        'coefficients': {
            name: float(clf.coef_[0][i])
            for i, name in enumerate(feature_names)
        },
        'intercept': float(clf.intercept_[0]),
    }

    if calibrator:
        # Extract Platt scaling params
        platt_lr = calibrator.calibrated_classifiers_[0].calibrators[0]
        artifact['calibrator'] = {
            'type': 'platt',
            'a': float(platt_lr.coef_[0][0]),
            'b': float(platt_lr.intercept_[0]),
        }

    return artifact

# Export
artifact = export_artifact(clf, scaler, feature_names, 'xwoba_batball_ncaa_v1', metrics, calibrated_clf)

# Save to R2
artifact_key = f"baseball/ncaa/xwoba_batball_v1/{artifact['model_id']}/artifact.json"
r2.put_object('bsi-models', artifact_key, json.dumps(artifact, indent=2))

print(f"✅ Artifact exported to r2://bsi-models/{artifact_key}")
```

---

## 📈 Monitoring & Drift Detection

### Population Stability Index (PSI)

```python
import numpy as np

def calculate_psi(expected, actual, bins=10):
    """
    Calculate Population Stability Index to detect feature drift.

    PSI < 0.1: No significant change
    0.1 ≤ PSI < 0.2: Moderate change
    PSI ≥ 0.2: Significant change (retrain recommended)
    """
    # Bin the data
    breakpoints = np.percentile(expected, np.linspace(0, 100, bins + 1))

    expected_hist = np.histogram(expected, bins=breakpoints)[0] / len(expected)
    actual_hist = np.histogram(actual, bins=breakpoints)[0] / len(actual)

    # Avoid log(0)
    expected_hist = np.where(expected_hist == 0, 1e-10, expected_hist)
    actual_hist = np.where(actual_hist == 0, 1e-10, actual_hist)

    psi = np.sum((actual_hist - expected_hist) * np.log(actual_hist / expected_hist))

    return psi

# Example: Monitor bat_speed drift
train_bat_speed = X_train[:, feature_names.index('bat_speed')]
prod_bat_speed = X_prod[:, feature_names.index('bat_speed')]

psi_bat_speed = calculate_psi(train_bat_speed, prod_bat_speed)

if psi_bat_speed >= 0.2:
    print(f"⚠️ ALERT: bat_speed PSI = {psi_bat_speed:.3f} (significant drift detected)")
elif psi_bat_speed >= 0.1:
    print(f"⚡ WARNING: bat_speed PSI = {psi_bat_speed:.3f} (moderate drift)")
else:
    print(f"✅ OK: bat_speed PSI = {psi_bat_speed:.3f} (stable)")
```

### Online Performance Monitoring (Cloudflare Worker)

```typescript
// Scheduled worker (runs every hour)

export const scheduled: ExportedHandler<Env>['scheduled'] = async (event, env, ctx) => {
  // Fetch recent predictions and actual outcomes
  const stmt = env.DB.prepare(`
    SELECT
      model_id,
      prediction_proba,
      actual_outcome,
      timestamp
    FROM prediction_log
    WHERE timestamp >= datetime('now', '-24 hours')
      AND actual_outcome IS NOT NULL
  `);

  const predictions = await stmt.all();

  // Calculate AUC, Brier score, ECE
  const modelMetrics = calculateMetrics(predictions.results);

  // Store in KV for dashboard
  for (const [modelId, metrics] of Object.entries(modelMetrics)) {
    await env.KV.put(
      `health:model:${modelId}:24h`,
      JSON.stringify(metrics),
      { expirationTtl: 86400 } // 24 hours
    );

    // Alert if metrics degrade
    if (metrics.auc < 0.75 || metrics.ece > 0.1) {
      await sendSlackAlert(
        `🚨 Model ${modelId} performance degradation detected!\n` +
          `AUC: ${metrics.auc.toFixed(3)}\n` +
          `ECE: ${metrics.ece.toFixed(3)}`
      );
    }
  }
};

function calculateMetrics(predictions: any[]) {
  const byModel: Record<string, any[]> = {};

  for (const pred of predictions) {
    if (!byModel[pred.model_id]) {
      byModel[pred.model_id] = [];
    }
    byModel[pred.model_id].push(pred);
  }

  const metrics: Record<string, any> = {};

  for (const [modelId, preds] of Object.entries(byModel)) {
    const y_true = preds.map((p) => p.actual_outcome);
    const y_pred = preds.map((p) => p.prediction_proba);

    metrics[modelId] = {
      auc: calculateAUC(y_true, y_pred),
      brier: calculateBrier(y_true, y_pred),
      ece: calculateECE(y_true, y_pred),
      n_predictions: preds.length,
    };
  }

  return metrics;
}
```

---

## 🚀 Deployment Pipeline

### Champion/Challenger Framework

```python
# deploy_model.py

import json
from cloudflare_kv import KVClient
from cloudflare_r2 import R2Client

def deploy_model_canary(model_key, artifact_path, canary_pct=10):
    """
    Deploy new model as canary (10% traffic).
    Monitor for 24-48 hours before promoting to champion.
    """
    r2 = R2Client()
    kv = KVClient()

    # Upload artifact to R2
    with open(artifact_path) as f:
        artifact = json.load(f)

    r2_key = f"{model_key}/{artifact['model_id']}/artifact.json"
    r2.put_object('bsi-models', r2_key, json.dumps(artifact))

    # Set canary alias in KV
    kv.put(
        f"alias:{model_key}:canary",
        f"r2://bsi-models/{r2_key}",
        metadata={'traffic_pct': canary_pct}
    )

    print(f"✅ Canary deployed: {artifact['model_id']} ({canary_pct}% traffic)")

def promote_to_champion(model_key):
    """
    Promote canary to champion (100% traffic) after validation.
    """
    kv = KVClient()

    # Get canary URI
    canary_uri = kv.get(f"alias:{model_key}:canary")

    # Archive old champion
    old_champion_uri = kv.get(f"alias:{model_key}")
    if old_champion_uri:
        kv.put(f"alias:{model_key}:archived", old_champion_uri)

    # Promote canary to champion
    kv.put(f"alias:{model_key}", canary_uri)

    print(f"✅ Promoted to champion: {model_key}")

def rollback_model(model_key):
    """
    Emergency rollback to previous champion.
    """
    kv = KVClient()

    archived_uri = kv.get(f"alias:{model_key}:archived")
    if not archived_uri:
        raise ValueError("No archived model found for rollback")

    kv.put(f"alias:{model_key}", archived_uri)

    print(f"⏮️ Rolled back to previous champion: {model_key}")
```

### CI/CD Integration (GitHub Actions)

```yaml
# .github/workflows/train-and-deploy-models.yml

name: Train and Deploy Models

on:
  schedule:
    - cron: '0 3 * * 0' # Weekly on Sunday at 3 AM
  workflow_dispatch:

jobs:
  train-baseball-models:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt

      - name: Assemble training data
        env:
          R2_ACCESS_KEY: ${{ secrets.R2_ACCESS_KEY }}
          R2_SECRET_KEY: ${{ secrets.R2_SECRET_KEY }}
        run: |
          python scripts/assemble_training_data.py --sport baseball --league ncaa

      - name: Train xwOBA model
        run: |
          python scripts/train_xwoba_model.py \
            --data data/baseball_ncaa_2025.parquet \
            --output models/xwoba_batball_ncaa_v1.json

      - name: Evaluate model
        run: |
          python scripts/evaluate_model.py \
            --artifact models/xwoba_batball_ncaa_v1.json \
            --test-data data/baseball_ncaa_2025_test.parquet

      - name: Deploy as canary
        if: success()
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          python scripts/deploy_model.py \
            --model-key xwoba_batball_ncaa_v1 \
            --artifact models/xwoba_batball_ncaa_v1.json \
            --canary-pct 10

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: trained-models
          path: models/
```

---

## 📊 Dashboards & Visualization

### Model Card (Internal)

```markdown
# Model Card: xwOBA Batted Ball (NCAA Baseball) v1

## Model Details

- **Model ID**: `xwoba_batball_ncaa_v1-20251019-143000`
- **Created**: 2025-10-19 14:30:00 CDT
- **Algorithm**: Logistic Regression with L2 regularization
- **Training Data**: 45,823 plate appearances (2020-2025 NCAA seasons)
- **Validation Data**: 11,456 plate appearances (2024-2025 holdout)
- **Test Data**: 5,728 plate appearances (2025 holdout)

## Intended Use

Predict home run probability for NCAA baseball batted balls based on:

- Contact quality (bat speed, attack angle, on-plane time)
- Pitch characteristics (velocity, spin, location)
- Situational context (leverage, base-out state)
- Conference-adjusted opponent strength

## Performance Metrics

| Metric      | Value | Interpretation                |
| ----------- | ----- | ----------------------------- |
| AUC-ROC     | 0.847 | Excellent discrimination      |
| AUC-PR      | 0.412 | Good precision/recall balance |
| Brier Score | 0.068 | Well-calibrated probabilities |
| ECE         | 0.023 | Minimal calibration error     |

## Feature Importance

| Feature                  | Coefficient | Interpretation                 |
| ------------------------ | ----------- | ------------------------------ |
| `bat_speed`              | +0.094      | Most important positive factor |
| `micro_expr_focus`       | +0.082      | Mental state matters           |
| `attack_angle`           | +0.037      | Launch angle critical          |
| `pitch_velo`             | +0.021      | Harder pitches = more power    |
| `opponent_conf_strength` | -0.032      | SEC pitching is tougher        |

## Calibration Plot

![Calibration Curve](calibration_plot.png)

## Limitations

- **Data bias**: Overrepresents Power 5 conferences
- **Missing data**: No video features for 15% of plays
- **Conference imbalance**: SEC (35%), ACC (22%), Big 12 (18%), Pac-12 (15%), Big Ten (10%)
- **Temporal drift**: Model trained on 2020-2025 data; may degrade for 2026+ without retraining

## Ethical Considerations

- **No player profiling**: Model does not use demographic data
- **Conference adjustment**: Ensures fair comparison across different competition levels
- **Uncertainty quantification**: Confidence intervals provided for all predictions
- **Transparency**: All features and coefficients publicly documented

## Maintenance

- **Retraining cadence**: Weekly during season, monthly off-season
- **Drift monitoring**: PSI checks on all features every 24 hours
- **Performance tracking**: AUC/ECE monitored hourly in production
- **Rollback plan**: Archived champion available for emergency rollback
```

### Player Scouting Dashboard (Mobile)

```javascript
// React component for mobile scouting view

import React from 'react';
import { RadarChart } from 'recharts';

function PlayerScoutingCard({ playerId }) {
  const [enigma, setEnigma] = React.useState(null);

  React.useEffect(() => {
    fetch(`/api/v1/players/${playerId}/champion-enigma`)
      .then((res) => res.json())
      .then((data) => setEnigma(data));
  }, [playerId]);

  if (!enigma) return <div>Loading...</div>;

  const radarData = [
    { dimension: 'Clutch Gene', value: enigma.clutch_gene * 100 },
    { dimension: 'Killer Instinct', value: enigma.killer_instinct * 100 },
    { dimension: 'Flow State', value: enigma.flow_state * 100 },
    { dimension: 'Mental Fortress', value: enigma.mental_fortress * 100 },
    { dimension: 'Predator Mindset', value: enigma.predator_mindset * 100 },
    { dimension: 'Champion Aura', value: enigma.champion_aura * 100 },
    { dimension: 'Winner DNA', value: enigma.winner_dna * 100 },
    { dimension: 'Beast Mode', value: enigma.beast_mode * 100 },
  ];

  return (
    <div className="scouting-card">
      <h2>{enigma.player_name}</h2>
      <p className="position">
        {enigma.position} • {enigma.team}
      </p>

      <div className="enigma-radar">
        <RadarChart width={300} height={300} data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="dimension" />
          <PolarRadiusAxis domain={[0, 100]} />
          <Radar
            name="Championship Index"
            dataKey="value"
            stroke="#FF6B00"
            fill="#FF6B00"
            fillOpacity={0.6}
          />
        </RadarChart>
      </div>

      <div className="enigma-details">
        <h3>Top Strengths</h3>
        <ul>
          {Object.entries(enigma)
            .filter(([k, v]) => typeof v === 'number')
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([dimension, value]) => (
              <li key={dimension}>
                <strong>{formatDimension(dimension)}</strong>: {(value * 100).toFixed(0)}th
                percentile
              </li>
            ))}
        </ul>

        <h3>Championship Projection</h3>
        <p>
          {enigma.cws_performance_delta > 0 ? '📈' : '📉'}
          Predicted CWS performance:{' '}
          <strong>
            {enigma.cws_performance_delta >= 0 ? '+' : ''}
            {(enigma.cws_performance_delta * 1000).toFixed(0)} OPS points
          </strong>{' '}
          vs. regular season
        </p>
        <p className="confidence">
          Confidence: {(enigma.confidence * 100).toFixed(0)}% (n={enigma.sample_size} high-leverage
          PAs)
        </p>
      </div>
    </div>
  );
}
```

---

## 🎓 Implementation Roadmap (90 Days)

### Phase 1: Foundation (Weeks 1-3)

**Goal**: Ship first production model with full inference pipeline

- [ ] **Week 1: Data Infrastructure**
  - ✅ Set up D1 schema (teams, players, games, plays, features, labels)
  - ✅ Configure R2 buckets (bsi-models, bsi-raw-data)
  - ✅ Create KV namespaces (aliases, cache, drift, health)
  - ✅ Build Python data ingestion scripts
  - ✅ Ingest 2024-2025 NCAA baseball data

- [ ] **Week 2: First Model**
  - ✅ Feature engineering for batted ball events
  - ✅ Train logistic regression: `is_home_run_v1`
  - ✅ Hyperparameter tuning with time-series CV
  - ✅ Calibration (Platt scaling)
  - ✅ Export to JSON artifact

- [ ] **Week 3: Edge Deployment**
  - ✅ Build Cloudflare Worker inference endpoint
  - ✅ Test inference latency (<100ms target)
  - ✅ Deploy canary (10% traffic)
  - ✅ Monitor AUC/ECE for 48 hours
  - ✅ Promote to champion

**Deliverable**: Working API endpoint for HR probability predictions with <100ms p95 latency

### Phase 2: Scale & Multi-Task (Weeks 4-7)

**Goal**: Add continuous targets and multi-sport coverage

- [ ] **Week 4: Regression Models**
  - Ridge regression for `xwoba`
  - Ridge regression for `run_value`
  - Elastic Net for feature selection
  - Conference normalization layer

- [ ] **Week 5: Champion Enigma v1**
  - Multi-task neural network (8 dimensions)
  - Train on leverage situations + micro-expressions
  - Export to ONNX
  - Workers AI integration

- [ ] **Week 6: Football Models**
  - EPA prediction (logistic + ridge)
  - Conference adjustments
  - Deploy to edge

- [ ] **Week 7: Basketball Models**
  - Shot make probability
  - Points per possession
  - Deploy to edge

**Deliverable**: 5+ production models covering 3 sports with full explainability

### Phase 3: Mobile & UX (Weeks 8-10)

**Goal**: Ship mobile-first experience with video integration

- [ ] **Week 8: PWA Foundation**
  - Service worker for offline caching
  - Manifest.json
  - Push notification setup
  - Adaptive video player (Cloudflare Stream)

- [ ] **Week 9: Tap-to-Explain**
  - Interactive play cards with predictions
  - Video overlays with feature highlights
  - Top contributors visualization
  - Similar plays search (Vectorize)

- [ ] **Week 10: Dashboards**
  - Player scouting cards
  - Team performance analytics
  - Championship pressure index views
  - Model performance monitoring

**Deliverable**: Production PWA with <2s play prediction load time

### Phase 4: Advanced Features (Weeks 11-12)

**Goal**: Differentiation through novel capabilities

- [ ] **Week 11: Cross-Sport Transfer**
  - Shared biomech encoder
  - Domain adaptation training
  - QB-pitcher correlation analysis

- [ ] **Week 12: Injury Forecasting**
  - UCL tear risk model
  - Workload monitoring
  - Team dashboards (access-controlled)

**Deliverable**: Unique features no competitor has

---

## 🔐 Security & Compliance

### Privacy Controls

```python
# Individual player risk shown ONLY to authenticated team staff

@app.route('/api/v1/players/<player_id>/injury-risk')
@require_auth
def get_injury_risk(player_id):
    user = get_current_user()

    # Verify user has permission for this player's data
    if not user.has_team_access(player_id):
        return jsonify({'error': 'Unauthorized'}), 403

    # Return individual risk metrics
    risk = predict_injury_risk(player_id)

    # Log access for audit trail
    audit_log(user.id, 'injury_risk_access', player_id)

    return jsonify(risk)

# Public endpoints show ONLY aggregate statistics
@app.route('/api/v1/teams/<team_id>/injury-risk-summary')
def get_team_injury_summary(team_id):
    # Aggregate only - no individual player identification
    summary = {
        'high_risk_count': count_high_risk_players(team_id),
        'avg_workload_percentile': get_avg_workload(team_id),
        'recommended_rest_days': calculate_recommended_rest(team_id),
    }

    return jsonify(summary)
```

### Legal Disclaimers

```html
<!-- Injury risk dashboard -->
<div class="legal-disclaimer">
  <h4>⚠️ Important Legal Notice</h4>
  <p>
    This injury risk assessment tool is for
    <strong>educational and informational purposes only</strong>. It is not medical advice and
    should not be used as a substitute for professional medical evaluation. Consult team physicians
    and certified athletic trainers for all medical decisions.
  </p>
  <p>
    Risk scores are probabilistic estimates based on public data (workload, biomechanics) and do not
    constitute a diagnosis or guarantee of outcomes.
  </p>
</div>
```

---

## 📚 Appendices

### A. Conference Strength Methodology

```python
def calculate_conference_elo(league='ncaa_baseball', season=2025):
    """
    Compute conference strength using Elo ratings.
    """
    games = load_games(league, season)

    # Initialize all teams at 1500 Elo
    elo = {team_id: 1500 for team_id in get_all_teams(league)}

    # Process games chronologically
    for game in sorted(games, key=lambda g: g.date):
        home_elo = elo[game.home_team_id]
        away_elo = elo[game.away_team_id]

        # Expected win probability
        expected_home = 1 / (1 + 10 ** ((away_elo - home_elo) / 400))

        # Actual result
        actual_home = 1 if game.home_score > game.away_score else 0

        # Update Elo (K=32 for college baseball)
        K = 32
        elo[game.home_team_id] += K * (actual_home - expected_home)
        elo[game.away_team_id] += K * ((1 - actual_home) - (1 - expected_home))

    # Aggregate by conference
    conference_elo = {}
    for team_id, team_elo in elo.items():
        conference = get_team_conference(team_id)
        if conference not in conference_elo:
            conference_elo[conference] = []
        conference_elo[conference].append(team_elo)

    # Return average Elo per conference
    return {
        conf: np.mean(elos)
        for conf, elos in conference_elo.items()
    }
```

### B. Video Feature Extraction (Workers AI)

```typescript
// Extract biomech features from video using Workers AI

async function extractBiomechFeatures(videoUrl: string, env: Env): Promise<BiomechFeatures> {
  // Load video frames
  const frames = await fetchVideoFrames(videoUrl);

  // Run pose estimation
  const poseResults = await env.AI.run('@cf/meta/llama-vision', {
    image: frames,
    prompt: 'Extract body keypoints for baseball swing analysis',
  });

  // Calculate biomech metrics from keypoints
  const metrics = {
    bat_speed: calculateBatSpeed(poseResults.keypoints),
    attack_angle: calculateAttackAngle(poseResults.keypoints),
    torso_rotation: calculateTorsoRotation(poseResults.keypoints),
    head_stability: calculateHeadStability(poseResults.keypoints),
  };

  return metrics;
}
```

### C. Similar Plays Search (Vectorize)

```typescript
// Find similar plays using vector embeddings

async function findSimilarPlays(playId: string, env: Env, limit: number = 5) {
  // Get play features
  const play = await env.DB.prepare('SELECT * FROM plays WHERE play_id = ?').bind(playId).first();

  // Generate embedding
  const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: JSON.stringify(play.features),
  });

  // Vector search
  const results = await env.VECTORIZE.query(embedding.data[0], {
    topK: limit,
    namespace: 'baseball_plays',
  });

  // Hydrate with full play data
  const similarPlays = await Promise.all(
    results.matches.map((match) =>
      env.DB.prepare('SELECT * FROM plays WHERE play_id = ?').bind(match.id).first()
    )
  );

  return similarPlays;
}
```

---

## 🎯 Success Metrics

### Technical Metrics

- **Inference Latency**: p95 <100ms, p99 <200ms
- **Model AUC**: >0.80 for binary classifiers
- **Calibration ECE**: <0.05
- **Uptime**: 99.9% (edge deployment)
- **Drift Detection**: PSI checks every 24h, alert if >0.2

### Business Metrics

- **Mobile Engagement**: Avg session >5min (vs ESPN ~2min)
- **Prediction Accuracy**: Public leaderboard vs actual outcomes
- **College Baseball Coverage**: 100% of D1 teams with full box scores
- **User Trust**: Transparency score >90% (all predictions explainable)

### Differentiation Metrics

- **Features ESPN Doesn't Have**: Conference-adjusted WAR, Championship Pressure Index, Injury Forecasting, Cross-Sport Transfer Insights
- **Data Freshness**: <60s for live games (vs ESPN's variable latency)
- **Mobile Performance**: Lighthouse score >90

---

## 🏁 Conclusion

This architecture transforms Blaze Sports Intel from "another sports site" into **the championship standard for predictive analytics**:

1. **College Baseball Hero**: We fill ESPN's massive gap with complete box scores, conference-normalized stats, and CWS pressure metrics.

2. **Mobile-First Innovation**: Tap-to-explain predictions with video integration in <2 seconds.

3. **Auditable Science**: Every prediction backed by explainable coefficients, calibration curves, and drift monitoring.

4. **Unique Moats**: Championship Pressure Index, cross-sport transfer learning, injury forecasting, conference adjustments.

5. **Edge-Optimized**: <100ms inference globally via Cloudflare Workers with offline PWA caching.

**Next Action**: Choose your ship path (Fast Track / Balanced / Full) and let's deploy the first model to production within 2 weeks.

---

_End Architecture v2.0 — Ready for production deployment._
