# 🔥 Blaze Intelligence Data Drift Monitoring System

## The Deep South's Sports Intelligence Hub - Championship-Caliber Data Quality

This comprehensive data drift monitoring system ensures the highest quality analytics for Cardinals, Titans, Longhorns, Grizzlies, and youth sports data at blazesportsintel.com.

## 📊 Monitored Data Sources

### Professional Sports

- **MLB Cardinals Analytics** - Real-time batting averages, ERA, OPS+, leverage index, readiness scores
- **NFL Titans Performance** - QB pressure rates, hidden yardage metrics, defensive efficiency
- **NBA Grizzlies Metrics** - True shooting percentage, defensive rating, pace-adjusted efficiency

### College & Youth Sports

- **Texas Longhorns Football** - Recruiting composites, SP+ ratings, FEI rankings
- **Perfect Game Baseball** - Exit velocity, 60-yard dash, PG grades, commitment status
- **Texas HS Football** - Dave Campbell's model rankings, offensive/defensive stats

### Advanced Analytics

- **Biomechanics Vision AI** - Hip-shoulder separation, release point consistency, kinetic chain efficiency
- **Character Assessment** - Micro-expression confidence, trait stability scores
- **Championship Models** - Win/playoff/championship probability predictions
- **NIL Valuation** - Social media value, performance metrics, market valuations

## 🚀 Quick Start

### Installation

```bash
# Install Python dependencies
pip install -r observability/drift/requirements.txt

# Set up configuration
cp observability/drift/config/drift-config.example.yaml observability/drift/config/drift-config.yaml

# Run initial drift detection
python observability/drift/drift_detector.py
```

### CI/CD Integration

```bash
# Run drift gate in CI pipeline
./observability/drift/ci_drift_gate.sh

# Override critical drift (with caution)
DRIFT_OVERRIDE=true DRIFT_OVERRIDE_REASON="Expected schema change" ./observability/drift/ci_drift_gate.sh
```

## 📈 Drift Detection Methods

### Statistical Tests

#### Kolmogorov-Smirnov Test (Continuous Variables)

- **Used For**: Batting averages, ERA, ratings, velocities
- **Thresholds**:
  - Warning: KS statistic ≥ 0.1
  - Critical: KS statistic ≥ 0.2
- **Example**: Cardinals batting average drift detection

#### Population Stability Index (Categorical/Binned)

- **Used For**: Perfect Game grades, Texas HS classifications, NIL brackets
- **Thresholds**:
  - No drift: PSI < 0.1
  - Moderate: PSI 0.1-0.25
  - Significant: PSI > 0.25
- **Example**: Texas HS football classification distribution

### Custom Drift Detectors

#### Cardinals Readiness Drift

Composite metric combining:

- OPS+ (30% weight)
- Inverse ERA (30% weight)
- Leverage Index (40% weight)

#### Character Assessment Drift

Monitors biomechanical character indicators:

- Micro-expression detection confidence
- Character trait score variance
- Combined drift score threshold: 0.15

## 📝 Configuration

### drift-config.yaml Structure

```yaml
monitoring:
  enabled: true
  environment: production
  timezone: America/Chicago

datasets:
  dataset_name:
    source: 'api/endpoint'
    drift_thresholds:
      ks_statistic: 0.1
      psi_warning: 0.1
    columns:
      - name: column_name
        drift_method: ks_test|psi|custom
        baseline_window: 30d
```

### Key Configuration Options

| Option                            | Description                    | Default       |
| --------------------------------- | ------------------------------ | ------------- |
| `baseline_window`                 | Historical period for baseline | 30d           |
| `sampling.strategy`               | Data sampling method           | stratified    |
| `ci_integration.fail_on_critical` | Block CI on critical drift     | true          |
| `reporting.schedule`              | Cron for nightly reports       | 0 2 \* \* \*  |
| `alerting.channels`               | Notification methods           | github, email |

## 📊 Reporting

### Nightly Reports (2 AM CT)

Generated HTML reports include:

- Executive summary with drift score dashboard
- 30-day sparkline visualizations per column
- Statistical test results tables
- Root cause analysis suggestions
- Baseline distribution comparisons

### Report Sections

1. **Executive Summary** - High-level metrics and scores
2. **Drift Dashboard** - Visual KS/PSI charts
3. **Schema Changes** - New/missing/changed columns
4. **Statistical Analysis** - Detailed test results
5. **Data Quality Metrics** - Completeness, accuracy scores
6. **Root Cause Analysis** - Drift pattern insights
7. **Recommendations** - Actionable next steps

## 🚨 Alerting

### Severity Levels

- **INFO**: Metrics within normal bounds
- **WARNING**: Approaching threshold limits
- **CRITICAL**: Threshold breached, intervention required

### Alert Channels

1. **GitHub Issues** - Auto-created for critical drifts
2. **Email** - Sent to configured recipients
3. **Cloudflare Analytics** - Real-time metric streaming
4. **CI/CD Gates** - Build failures on critical drift

## 🔄 CI/CD Integration

### GitHub Actions Workflow

```yaml
on:
  schedule:
    - cron: '0 8 * * *' # 2 AM CT
  push:
    paths: ['data/**', 'api/**', 'models/**']
```

### CI Gate Logic

1. Cache baselines for performance
2. Run schema drift detection
3. Run statistical drift detection
4. Generate report if requested
5. Create issues for critical drifts
6. Upload to Cloudflare R2
7. Update Analytics Engine
8. Make gate decision (pass/fail)

## 📦 Output Structure

```
/observability/drift/
├── config/           # Configuration files
│   └── drift-config.yaml
├── reports/         # Nightly HTML reports
│   └── drift_report_YYYY-MM-DD.html
├── ci/             # CI/CD artifacts
│   ├── drift_results.json
│   ├── schema_changes.json
│   └── ci_gate.json
├── baselines/      # Stored baseline distributions
│   └── dataset_name/
├── logs/          # Execution logs
│   └── drift_detector.log
└── issues/        # Issue tracking metadata
    └── issue_NNNN.json
```

## 🏆 Performance Optimization

### Sampling Strategies

- **Stratified Sampling**: Maintains class distribution
- **Sample Size**: 100,000 records default
- **Confidence Level**: 95%

### Parallelization

- **Max Workers**: 8 concurrent processes
- **Column-level**: Parallel drift calculations
- **Dataset-level**: Concurrent dataset processing

### Caching

- **Redis Backend**: Sub-second baseline retrieval
- **TTL**: 3600 seconds (1 hour)
- **Baseline Versioning**: Git-like baseline management

## 🔧 Troubleshooting

### Common Issues

#### High False Positive Rate

- Review and adjust thresholds in config
- Increase baseline window period
- Consider seasonal patterns

#### Missing Baseline Data

```bash
# Rebuild baselines
python observability/drift/drift_detector.py --rebuild-baselines
```

#### CI Gate Failures

```bash
# Debug with verbose output
VERBOSE=true ./observability/drift/ci_drift_gate.sh

# Check artifacts
cat observability/drift/ci/ci_gate.json
```

## 🎯 Success Metrics

- **Drift Detection Rate**: < 5% false positives
- **Processing Time**: < 5 minutes for all datasets
- **Report Generation**: < 30 seconds
- **CI Gate Time**: < 2 minutes
- **Alert Latency**: < 1 minute for critical issues

## 📚 API Reference

### Python API

```python
from drift_detector import BlazeIntelligenceDriftDetector

detector = BlazeIntelligenceDriftDetector('config.yaml')
drift_results, schema_changes = await detector.run_monitoring_pipeline()
```

### REST API Endpoints

- `POST /api/drift/ingest` - Ingest drift metrics
- `GET /api/drift/query` - Query historical drift data
- `GET /api/drift/dashboard` - View real-time dashboard
- `POST /api/drift/webhook` - Receive drift alerts

## 🤝 Contributing

1. Follow existing code patterns
2. Add tests for new drift methods
3. Update configuration schema
4. Document threshold rationale
5. Test with production-like data

## 📞 Support

- **Email**: ahump20@outlook.com
- **GitHub Issues**: Create in repository
- **Documentation**: https://blazesportsintel.com/docs/drift-monitoring

---

_Championship-caliber data quality monitoring for the Deep South's premier sports intelligence platform_
