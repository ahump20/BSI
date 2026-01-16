#!/usr/bin/env python3
"""
Test script for Blaze Intelligence Data Drift Monitoring
Validates the monitoring system with sample data
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import asyncio
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from drift_detector import BlazeIntelligenceDriftDetector, DriftResult, SchemaChange

def generate_sample_data():
    """Generate sample sports data for testing"""

    # Cardinals baseball data
    cardinals_baseline = pd.DataFrame({
        'player_id': range(1, 26),
        'batting_average': np.random.normal(0.275, 0.03, 25).clip(0.150, 0.350),
        'era': np.random.exponential(3.5, 25).clip(1.0, 7.0),
        'ops_plus': np.random.normal(100, 15, 25).clip(70, 150),
        'leverage_index': np.random.uniform(0.5, 2.0, 25),
        'readiness_score': np.random.normal(75, 10, 25).clip(50, 100)
    })

    # Introduce drift in current data
    cardinals_current = pd.DataFrame({
        'player_id': range(1, 26),
        'batting_average': np.random.normal(0.285, 0.04, 25).clip(0.150, 0.350),  # Slight increase
        'era': np.random.exponential(4.0, 25).clip(1.0, 8.0),  # Higher ERA (worse)
        'ops_plus': np.random.normal(95, 20, 25).clip(60, 150),  # Lower OPS+
        'leverage_index': np.random.uniform(0.4, 2.2, 25),  # Wider range
        'readiness_score': np.random.normal(70, 15, 25).clip(40, 100),  # Lower readiness
        'new_column': np.random.random(25)  # Schema change
    })

    # Perfect Game youth baseball data
    perfect_game_baseline = pd.DataFrame({
        'player_id': range(1, 101),
        'exit_velocity': np.random.normal(85, 8, 100).clip(65, 105),
        'sixty_yard_dash': np.random.normal(7.0, 0.5, 100).clip(6.0, 8.5),
        'pg_grade': np.random.choice([7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0], 100,
                                     p=[0.15, 0.20, 0.25, 0.20, 0.10, 0.07, 0.03]),
        'commitment_status': np.random.choice(['uncommitted', 'committed', 'signed'], 100,
                                              p=[0.60, 0.30, 0.10])
    })

    # Introduce significant drift in Perfect Game data
    perfect_game_current = pd.DataFrame({
        'player_id': range(1, 101),
        'exit_velocity': np.random.normal(88, 10, 100).clip(65, 110),  # Higher velocity
        'sixty_yard_dash': np.random.normal(6.8, 0.6, 100).clip(5.8, 8.5),  # Faster times
        'pg_grade': np.random.choice([7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0], 100,
                                     p=[0.10, 0.15, 0.20, 0.25, 0.15, 0.10, 0.05]),  # Grade inflation
        'commitment_status': np.random.choice(['uncommitted', 'committed', 'signed'], 100,
                                              p=[0.45, 0.40, 0.15])  # More commitments
    })

    # Texas HS Football data
    texas_hs_baseline = pd.DataFrame({
        'team_id': range(1, 51),
        'team_ranking': range(1, 51),
        'offensive_yards_per_game': np.random.normal(350, 75, 50).clip(150, 550),
        'defensive_ppg_allowed': np.random.normal(21, 8, 50).clip(7, 42),
        'classification': np.random.choice(['6A', '5A-DI', '5A-DII', '4A-DI'], 50)
    })

    texas_hs_current = pd.DataFrame({
        'team_id': range(1, 51),
        'team_ranking': range(1, 51),
        'offensive_yards_per_game': np.random.normal(375, 85, 50).clip(150, 600),
        'defensive_ppg_allowed': np.random.normal(18, 10, 50).clip(3, 45),
        'classification': np.random.choice(['6A', '5A-DI', '5A-DII', '4A-DI', '3A-DI'], 50)  # New class
    })

    # Biomechanics data
    biomechanics_baseline = pd.DataFrame({
        'session_id': range(1, 201),
        'hip_shoulder_separation_deg': np.random.normal(45, 8, 200).clip(20, 70),
        'release_point_consistency': np.random.normal(0.85, 0.08, 200).clip(0.5, 1.0),
        'kinetic_chain_efficiency': np.random.normal(0.75, 0.10, 200).clip(0.4, 0.95),
        'micro_expression_confidence': np.random.normal(0.80, 0.05, 200).clip(0.6, 0.95),
        'character_trait_score': np.random.normal(7.5, 1.0, 200).clip(4, 10)
    })

    # Significant drift in biomechanics (sensor calibration issue)
    biomechanics_current = pd.DataFrame({
        'session_id': range(1, 201),
        'hip_shoulder_separation_deg': np.random.normal(42, 12, 200).clip(15, 75),  # More variance
        'release_point_consistency': np.random.normal(0.80, 0.12, 200).clip(0.4, 1.0),  # Less consistent
        'kinetic_chain_efficiency': np.random.normal(0.72, 0.15, 200).clip(0.3, 0.95),
        'micro_expression_confidence': np.random.normal(0.65, 0.10, 200).clip(0.4, 0.90),  # Major drop
        'character_trait_score': np.random.normal(7.2, 1.5, 200).clip(3, 10)  # More variance
    })

    return {
        'mlb_stats': (cardinals_baseline, cardinals_current),
        'perfect_game': (perfect_game_baseline, perfect_game_current),
        'texas_hs_football': (texas_hs_baseline, texas_hs_current),
        'biomechanics': (biomechanics_baseline, biomechanics_current)
    }

async def test_drift_detection():
    """Test the drift detection system"""

    print("🔥 Blaze Intelligence Data Drift Monitoring Test")
    print("=" * 60)
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} CT")
    print()

    # Initialize detector
    config_path = "/Users/AustinHumphrey/BSI/observability/drift/config/drift-config.yaml"
    detector = BlazeIntelligenceDriftDetector(config_path)

    # Generate test data
    test_data = generate_sample_data()

    all_drift_results = []
    all_schema_changes = []

    print("📊 Testing Drift Detection on Sample Data")
    print("-" * 60)

    for dataset_name, (baseline_df, current_df) in test_data.items():
        print(f"\n📈 Dataset: {dataset_name}")
        print(f"  Baseline shape: {baseline_df.shape}")
        print(f"  Current shape: {current_df.shape}")

        # Test schema drift
        schema_changes = detector.detect_schema_drift(dataset_name, current_df,
                                                      detector._extract_schema(baseline_df))

        if schema_changes:
            print(f"  ⚠️ Schema changes detected: {len(schema_changes)}")
            for change in schema_changes:
                print(f"    - {change.change_type}: {change.column_name} ({change.severity})")
                all_schema_changes.append(change)
        else:
            print("  ✅ No schema changes")

        # Test statistical drift
        print(f"  📊 Statistical drift tests:")

        # Test each numeric column
        numeric_cols = baseline_df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if col not in current_df.columns:
                continue

            baseline_data = baseline_df[col].values
            current_data = current_df[col].values

            # KS Test for continuous variables
            if col not in ['team_ranking', 'player_id', 'team_id', 'session_id']:
                drift_result = detector.kolmogorov_smirnov_test(
                    baseline_data, current_data, threshold=0.1
                )

                if drift_result:
                    drift_result.dataset = dataset_name
                    drift_result.column = col
                    drift_result.baseline_period = "test_baseline"
                    drift_result.current_period = "test_current"

                    status = "🔴 DRIFT" if drift_result.is_drift else "🟢 OK"
                    print(f"    - {col}: KS={drift_result.statistic:.4f} {status} ({drift_result.severity})")

                    all_drift_results.append(drift_result)

        # Test categorical columns with PSI
        categorical_cols = baseline_df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if col not in current_df.columns:
                continue

            baseline_data = baseline_df[col].values
            current_data = current_df[col].values

            drift_result = detector.population_stability_index(
                baseline_data, current_data, categorical=True
            )

            if drift_result:
                drift_result.dataset = dataset_name
                drift_result.column = col
                drift_result.baseline_period = "test_baseline"
                drift_result.current_period = "test_current"

                status = "🔴 DRIFT" if drift_result.is_drift else "🟢 OK"
                print(f"    - {col}: PSI={drift_result.statistic:.4f} {status} ({drift_result.severity})")

                all_drift_results.append(drift_result)

        # Test custom drift methods for specific datasets
        if dataset_name == 'mlb_stats':
            print("  🎯 Testing custom Cardinals readiness drift...")
            custom_result = detector.custom_cardinals_readiness_drift(baseline_df, current_df)
            if custom_result:
                custom_result.dataset = dataset_name
                custom_result.column = "readiness_composite"
                print(f"    - Readiness: Score={custom_result.statistic:.4f} ({custom_result.severity})")
                all_drift_results.append(custom_result)

        elif dataset_name == 'biomechanics':
            print("  🧠 Testing custom character assessment drift...")
            custom_result = detector.custom_character_assessment_drift(baseline_df, current_df)
            if custom_result:
                print(f"    - Character: Score={custom_result.statistic:.4f} ({custom_result.severity})")
                all_drift_results.append(custom_result)

    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("-" * 60)

    # Summary statistics
    total_drifts = len(all_drift_results)
    critical_drifts = sum(1 for r in all_drift_results if r.severity == 'CRITICAL')
    warning_drifts = sum(1 for r in all_drift_results if r.severity == 'WARNING')
    info_drifts = sum(1 for r in all_drift_results if r.severity == 'INFO')

    print(f"Total Drift Detections: {total_drifts}")
    print(f"  🔴 Critical: {critical_drifts}")
    print(f"  🟠 Warning: {warning_drifts}")
    print(f"  🟢 Info: {info_drifts}")
    print(f"\nSchema Changes: {len(all_schema_changes)}")

    # Test report generation
    print("\n📝 Generating test report...")
    report_path = await detector.generate_drift_report(
        all_drift_results,
        all_schema_changes,
        "/Users/AustinHumphrey/BSI/observability/drift/reports"
    )
    print(f"✅ Report generated: {report_path}")

    # Test CI/CD artifacts
    print("\n🔧 Saving CI/CD artifacts...")
    detector._save_ci_artifacts(all_drift_results, all_schema_changes)

    # Check CI gate decision
    with open("/Users/AustinHumphrey/BSI/observability/drift/ci/ci_gate.json") as f:
        ci_decision = json.load(f)

    print(f"\n🚦 CI Gate Decision: {'PASS ✅' if ci_decision['pass'] else 'FAIL ❌'}")
    print(f"  Critical Drifts: {ci_decision['critical_drifts']}")
    print(f"  Critical Schema Changes: {ci_decision['critical_schema_changes']}")

    # Test GitHub issue creation (mock)
    if critical_drifts > 0:
        print("\n📋 Would create GitHub issues for critical drifts:")
        for result in all_drift_results[:3]:  # Show first 3
            if result.severity == 'CRITICAL':
                print(f"  - Issue: [DRIFT] Critical drift in {result.dataset}.{result.column}")

    print("\n" + "=" * 60)
    print("✅ Drift Monitoring Test Complete!")
    print(f"Championship-caliber monitoring for Blaze Intelligence")
    print("=" * 60)

    return ci_decision['pass']

if __name__ == "__main__":
    # Create necessary directories
    os.makedirs("/Users/AustinHumphrey/BSI/observability/drift/reports", exist_ok=True)
    os.makedirs("/Users/AustinHumphrey/BSI/observability/drift/ci", exist_ok=True)
    os.makedirs("/Users/AustinHumphrey/BSI/observability/drift/logs", exist_ok=True)

    # Run test
    success = asyncio.run(test_drift_detection())

    # Exit with appropriate code for CI
    sys.exit(0 if success else 1)