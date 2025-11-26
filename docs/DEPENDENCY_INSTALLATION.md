# Dependency Installation Guide

This document provides information about dependencies across the BSI repository and any known installation issues.

## NPM/Node.js Dependencies

All npm dependencies have been successfully installed in the following locations:

### ✅ Root Directory
- **Location**: `/`
- **Status**: ✓ Installed
- **Key additions**: luxon, node-fetch, pg, @types/luxon, @types/pg
- **Installation**: `npm install`

### ✅ Web Application
- **Location**: `/apps/web`
- **Status**: ✓ Installed
- **Dependencies**: Next.js, React 19, BabylonJS, Three.js, Sentry, Datadog, Chart.js, Playwright
- **Installation**: `cd apps/web && npm install`

### ✅ API Worker
- **Location**: `/apps/api-worker`
- **Status**: ✓ Installed
- **Dependencies**: TypeScript
- **Installation**: `cd apps/api-worker && npm install`

### ✅ Sports Data QC Skill
- **Location**: `/lib/skills/sports-data-qc`
- **Status**: ✓ Installed
- **Dependencies**: Cloudflare Workers types, TypeScript, Wrangler, Bun
- **Installation**: `cd lib/skills/sports-data-qc && npm install`

## Python Dependencies

### ✅ Root Directory
- **Location**: `/`
- **Status**: ✓ Installed
- **File**: `requirements.txt`
- **Dependencies**: Core data science stack (numpy, pandas, scipy, matplotlib, scikit-learn), Computer vision (OpenCV, MediaPipe, Ultralytics), Web frameworks (FastAPI, Dash), ML (PyTorch, LightGBM), Database (PostgreSQL, Redis), and monitoring tools
- **Installation**: `pip install -r requirements.txt`

### ✅ API Feedback System
- **Location**: `/api/feedback`
- **Status**: ✓ Installed
- **File**: `requirements.txt`
- **Dependencies**: FastAPI, computer vision (OpenCV, MediaPipe), audio processing (librosa, soundfile), ML models (PyTorch, Transformers), Redis, PostgreSQL
- **Installation**: `cd api/feedback && pip install -r requirements.txt`

### ⚠️ Observability Drift Monitoring
- **Location**: `/observability/drift`
- **Status**: ⚠️ Partial (network issues)
- **File**: `requirements.txt`
- **Issue**: Network connectivity issues with PyPI during installation
- **Already Installed**: pandas, numpy, scipy, scikit-learn, pyyaml, python-dotenv, plotly, jinja2, markdown, aiohttp, redis, hiredis, psycopg2-binary, boto3, pytest, pytest-asyncio, pytest-cov, black, flake8, mypy
- **Missing**: loguru, statsmodels, kaleido, pymongo, google-cloud-storage, azure-storage-blob, cloudflare, PyGithub, jira, great-expectations, soda-core, prophet, statsforecast, pre-commit

## Known Issues

### PyPI Network Timeouts
When installing dependencies in `/observability/drift`, the installation process experiences network timeouts connecting to PyPI. This appears to be an infrastructure/network issue.

**Symptoms**:
```
pip._vendor.urllib3.exceptions.ReadTimeoutError: HTTPSConnectionPool(host='pypi.org', port=443): Read timed out.
```

**Workaround Options**:
1. Retry installation in a different network environment
2. Install missing packages individually when network is stable
3. Use a PyPI mirror or cache
4. Install missing packages as needed when running drift monitoring

**Command to retry**:
```bash
cd observability/drift
pip install --default-timeout=180 -r requirements.txt
```

## Verification

### Build Verification
All builds pass successfully:

```bash
# Root build
npm run build
# Output: ✓ built successfully

# TypeScript compilation
npm run build:lib
# Output: No errors
```

### Installed Package Counts
- **Root npm packages**: 394 packages
- **apps/web npm packages**: 582 packages
- **apps/api-worker npm packages**: 2 packages
- **sports-data-qc npm packages**: 68 packages
- **Python packages**: 291 packages (system-wide)

## Security

All npm dependencies have been checked against the GitHub Advisory Database:
- ✓ luxon@3.4.4 - No vulnerabilities
- ✓ node-fetch@3.3.2 - No vulnerabilities  
- ✓ pg@8.11.3 - No vulnerabilities

## Next Steps

1. Monitor for stable network connectivity to complete observability/drift installations
2. Consider setting up a private PyPI mirror for reliability
3. Update CI/CD pipelines to handle optional dependencies gracefully
4. Document which features require which optional dependencies
