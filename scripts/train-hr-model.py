#!/usr/bin/env python3
"""
Train Home Run Prediction Model (is_home_run_v1)
Logistic Regression with L2 regularization + Platt calibration
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import (
    roc_auc_score, average_precision_score, brier_score_loss,
    confusion_matrix, classification_report
)
from sklearn.calibration import calibration_curve
import matplotlib.pyplot as plt

# Feature definitions for NCAA baseball home run prediction
FEATURES = [
    # Contact quality (would come from video/sensors in production)
    'bat_speed',              # mph
    'attack_angle',           # degrees
    'on_plane_time_ms',       # milliseconds
    'contact_depth_cm',       # cm from home plate

    # Pitch context
    'pitch_velo',             # mph
    'zone_x',                 # -2 to 2 (left to right)
    'zone_y',                 # 0 to 5 (bottom to top)

    # Situational
    'leverage_index',         # 0-3+
    'opponent_conf_strength', # Conference Elo
]


def generate_synthetic_training_data(n_samples: int = 10000):
    """
    Generate synthetic training data for demonstration
    In production: load from D1 database with real play-by-play data
    """
    np.random.seed(42)

    # Features with realistic distributions for college baseball
    data = pd.DataFrame({
        # Contact quality (correlated with HR)
        'bat_speed': np.random.normal(68, 5, n_samples),
        'attack_angle': np.random.normal(14, 6, n_samples),
        'on_plane_time_ms': np.random.normal(30, 8, n_samples),
        'contact_depth_cm': np.random.normal(-10, 15, n_samples),

        # Pitch context
        'pitch_velo': np.random.normal(88, 5, n_samples),
        'zone_x': np.random.uniform(-1.5, 1.5, n_samples),
        'zone_y': np.random.uniform(1, 4, n_samples),

        # Situational
        'leverage_index': np.random.exponential(1.2, n_samples),
        'opponent_conf_strength': np.random.normal(1500, 80, n_samples),  # Elo
    })

    # Generate HR labels (rare event ~3% of batted balls)
    # Higher probability with: high bat speed, optimal attack angle (15-25°), middle zone
    hr_prob = (
        0.01 +  # Base rate
        0.002 * (data['bat_speed'] - 68) +
        0.001 * np.maximum(0, 20 - np.abs(data['attack_angle'] - 20)) +
        0.0005 * data['on_plane_time_ms'] +
        -0.0003 * np.abs(data['zone_x']) +  # Middle of plate better
        -0.00001 * data['opponent_conf_strength']  # Tougher pitchers reduce HRs
    )

    # Clip to [0, 1] and sample
    hr_prob = np.clip(hr_prob, 0, 0.15)
    data['is_hr'] = np.random.binomial(1, hr_prob)

    # Add game_date for time-series split
    dates = pd.date_range('2024-02-01', '2025-06-01', periods=n_samples)
    data['game_date'] = dates

    print(f"Generated {n_samples} samples")
    print(f"HR rate: {data['is_hr'].mean():.3%}")

    return data


def time_split(df: pd.DataFrame, val_frac: float = 0.2, test_frac: float = 0.1):
    """Time-based train/val/test split (no future leakage)"""
    df = df.sort_values('game_date')
    n = len(df)

    train_end = int(n * (1 - val_frac - test_frac))
    val_end = int(n * (1 - test_frac))

    train = df.iloc[:train_end]
    val = df.iloc[train_end:val_end]
    test = df.iloc[val_end:]

    return train, val, test


def tune_hyperparameters(X_train, y_train, param_grid):
    """Time-series cross-validation for hyperparameter tuning"""
    tscv = TimeSeriesSplit(n_splits=5)
    best_auc = -1
    best_params = None

    print("\n🔍 Hyperparameter search...")
    for C in param_grid['C']:
        fold_aucs = []

        for train_idx, val_idx in tscv.split(X_train):
            X_tr, X_va = X_train[train_idx], X_train[val_idx]
            y_tr, y_va = y_train[train_idx], y_train[val_idx]

            scaler = StandardScaler()
            X_tr_scaled = scaler.fit_transform(X_tr)
            X_va_scaled = scaler.transform(X_va)

            clf = LogisticRegression(
                penalty='l2',
                C=C,
                class_weight='balanced',
                solver='lbfgs',
                max_iter=1000,
                random_state=42
            )

            clf.fit(X_tr_scaled, y_tr)
            y_pred_proba = clf.predict_proba(X_va_scaled)[:, 1]

            auc = roc_auc_score(y_va, y_pred_proba)
            fold_aucs.append(auc)

        mean_auc = np.mean(fold_aucs)
        print(f"  C={C:5.2f}: AUC = {mean_auc:.4f}")

        if mean_auc > best_auc:
            best_auc = mean_auc
            best_params = {'C': C}

    print(f"\n✅ Best params: {best_params}, AUC: {best_auc:.4f}")
    return best_params


def expected_calibration_error(y_true, y_pred_proba, n_bins=10):
    """Calculate Expected Calibration Error (ECE)"""
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


def evaluate_model(y_true, y_pred_proba, threshold=0.5):
    """Comprehensive model evaluation"""
    y_pred_binary = (y_pred_proba >= threshold).astype(int)

    metrics = {
        'auc_roc': roc_auc_score(y_true, y_pred_proba),
        'auc_pr': average_precision_score(y_true, y_pred_proba),
        'brier_score': brier_score_loss(y_true, y_pred_proba),
        'ece': expected_calibration_error(y_true, y_pred_proba),
        'confusion_matrix': confusion_matrix(y_true, y_pred_binary).tolist(),
    }

    return metrics


def plot_calibration_curve(y_true, y_pred_proba, output_path: str):
    """Plot calibration curve"""
    prob_true, prob_pred = calibration_curve(y_true, y_pred_proba, n_bins=10)

    plt.figure(figsize=(8, 6))
    plt.plot(prob_pred, prob_true, marker='o', label='Model', linewidth=2)
    plt.plot([0, 1], [0, 1], linestyle='--', label='Perfect Calibration', color='gray')
    plt.xlabel('Predicted Probability', fontsize=12)
    plt.ylabel('Observed Frequency', fontsize=12)
    plt.title('Calibration Curve - Home Run Prediction', fontsize=14, fontweight='bold')
    plt.legend(fontsize=10)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    plt.close()

    print(f"✅ Saved calibration curve: {output_path}")


def export_artifact(clf, scaler, calibrated_clf, feature_names, metrics, model_key: str):
    """Export model artifact to JSON"""

    # Extract Platt scaling parameters
    calibrator = calibrated_clf.calibrated_classifiers_[0].calibrators[0]
    # Access internal parameters (a and b) from sigmoid calibration
    a = float(calibrator.a_)
    b = float(calibrator.b_)

    artifact = {
        'schema_version': '2.0',
        'model_key': model_key,
        'model_id': f"{model_key}-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}",
        'created_at': datetime.now(timezone.utc).isoformat(),
        'sport': 'baseball',
        'league': 'ncaa',
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

        'calibrator': {
            'type': 'platt',
            'a': a,
            'b': b,
        },

        'metadata': {
            'train_samples': int(metrics.get('train_samples', 0)),
            'val_samples': int(metrics.get('val_samples', 0)),
            'test_samples': int(metrics.get('test_samples', 0)),
            'notes': 'Synthetic training data for demonstration. Replace with real NCAA play-by-play data in production.',
        }
    }

    return artifact


def main():
    print("🔥 Blaze Sports Intel - Home Run Model Training")
    print("=" * 60)

    # 1. Generate/load training data
    print("\n📊 Loading training data...")
    data = generate_synthetic_training_data(n_samples=10000)

    # 2. Split data
    train, val, test = time_split(data)
    X_train = train[FEATURES].values
    y_train = train['is_hr'].values
    X_val = val[FEATURES].values
    y_val = val['is_hr'].values
    X_test = test[FEATURES].values
    y_test = test['is_hr'].values

    print(f"\nSplit sizes:")
    print(f"  Train: {len(train):,} samples (HR rate: {y_train.mean():.3%})")
    print(f"  Val:   {len(val):,} samples (HR rate: {y_val.mean():.3%})")
    print(f"  Test:  {len(test):,} samples (HR rate: {y_test.mean():.3%})")

    # 3. Hyperparameter tuning
    param_grid = {'C': [0.1, 0.5, 1.0, 2.0, 5.0]}
    best_params = tune_hyperparameters(X_train, y_train, param_grid)

    # 4. Train final model
    print("\n🤖 Training final model...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    clf = LogisticRegression(
        penalty='l2',
        C=best_params['C'],
        class_weight='balanced',
        solver='lbfgs',
        max_iter=1000,
        random_state=42
    )

    clf.fit(X_train_scaled, y_train)

    # 5. Calibrate on validation set
    print("\n📐 Calibrating probabilities...")
    calibrated_clf = CalibratedClassifierCV(clf, method='sigmoid', cv='prefit')
    calibrated_clf.fit(X_val_scaled, y_val)

    # 6. Evaluate on test set
    print("\n📊 Evaluating on test set...")
    y_pred_proba = calibrated_clf.predict_proba(X_test_scaled)[:, 1]

    metrics = evaluate_model(y_test, y_pred_proba)
    metrics['train_samples'] = len(train)
    metrics['val_samples'] = len(val)
    metrics['test_samples'] = len(test)

    print("\n🎯 Test Set Performance:")
    print(f"  AUC-ROC:      {metrics['auc_roc']:.4f}")
    print(f"  AUC-PR:       {metrics['auc_pr']:.4f}")
    print(f"  Brier Score:  {metrics['brier_score']:.4f}")
    print(f"  ECE:          {metrics['ece']:.4f}")

    # 7. Feature importance
    print("\n🔬 Feature Importance (by coefficient):")
    feature_importance = sorted(
        zip(FEATURES, clf.coef_[0]),
        key=lambda x: abs(x[1]),
        reverse=True
    )
    for feat, coef in feature_importance:
        sign = '+' if coef > 0 else ''
        print(f"  {feat:25s}: {sign}{coef:7.4f}")

    # 8. Generate calibration plot
    plot_calibration_curve(y_test, y_pred_proba, 'calibration_curve_hr_v1.png')

    # 9. Export artifact
    print("\n💾 Exporting model artifact...")
    artifact = export_artifact(
        clf, scaler, calibrated_clf,
        FEATURES, metrics,
        model_key='is_home_run_ncaa_v1'
    )

    output_path = 'models/is_home_run_ncaa_v1.json'
    with open(output_path, 'w') as f:
        json.dump(artifact, f, indent=2)

    print(f"✅ Artifact saved: {output_path}")
    print(f"\n🚀 Model ready for deployment:")
    print(f"   Model ID: {artifact['model_id']}")
    print(f"   AUC-ROC:  {artifact['performance']['auc_roc']:.4f}")
    print(f"   ECE:      {artifact['performance']['ece']:.4f}")


if __name__ == '__main__':
    main()
