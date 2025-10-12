# Performance Benchmarks Directory

This directory contains real-world performance benchmark data for the Blaze Graphics Engine V5, validating the "150K particles" marketing claim with evidence-based testing.

## Directory Structure

```
/docs/performance-benchmarks/
├── README.md                       # This file
├── SUMMARY.md                      # Aggregate results report (TO BE POPULATED)
│
├── desktop-high/                   # High-end desktop benchmarks
│   ├── benchmark-desktop-high-25K-[date].json
│   ├── benchmark-desktop-high-50K-[date].json
│   ├── benchmark-desktop-high-100K-[date].json
│   ├── benchmark-desktop-high-150K-[date].json
│   ├── benchmark-desktop-high-200K-[date].json
│   └── screenshots/
│       ├── device-info.png         # Device specifications
│       ├── results-150K.png        # 150K particle test results
│       └── results-200K.png        # 200K particle test results (optional)
│
├── mobile-high/                    # Flagship mobile benchmarks
│   ├── benchmark-mobile-high-25K-[date].json
│   ├── benchmark-mobile-high-50K-[date].json
│   ├── benchmark-mobile-high-100K-[date].json
│   ├── benchmark-mobile-high-150K-[date].json
│   └── screenshots/
│
├── desktop-mid/                    # Mid-range desktop benchmarks
│   └── [PENDING TESTS]
│
├── mobile-low/                     # Budget mobile benchmarks
│   └── [PENDING TESTS]
│
└── tablet/                         # Tablet benchmarks
    └── [PENDING TESTS]
```

## Quick Start

### 1. Run Benchmark Tests

Open the benchmark tool: https://blazesportsintel.com/performance-benchmark.html

**Critical Validation (Phase 1 - 30 minutes)**:
1. Desktop High-End: 150K particles, 60 seconds, 3 runs
2. Mobile High-End: 100K particles, 60 seconds, 3 runs

**Comprehensive Testing (Phase 2 - 2 hours)**:
- Test all 5 device classes
- Test multiple particle counts per device
- Export JSON after each test

### 2. Save Results

After each benchmark:
1. Click "Export Results as JSON"
2. Save file to appropriate device directory:
   - Filename format: `benchmark-{device-class}-{particle-count}K-{YYYYMMDD}.json`
   - Example: `benchmark-desktop-high-150K-20251012.json`

3. Take screenshot of results card
4. Save to `screenshots/` subdirectory

### 3. Update Documentation

After collecting benchmarks:
1. Open `SUMMARY.md`
2. Fill in device specifications from JSON exports
3. Populate performance tables with actual results
4. Update "Marketing Claims" section with verified data
5. Mark validation checkboxes (✅ = pass, ❌ = fail)

## Testing Protocol

See detailed instructions in:
- **PERFORMANCE-BENCHMARK-GUIDE.md**: Comprehensive methodology and expectations
- **PERFORMANCE-TESTING-CHECKLIST.md**: Step-by-step testing procedure

## Validation Criteria

### Desktop High-End (Critical)
- **Pass**: 150K particles @ ≥60 FPS avg, ≥30 FPS 1% low, <300 MB memory
- **Action if Fail**: Reduce marketing claim from 150K to 100K particles

### Mobile High-End (Critical)
- **Pass**: 100K particles @ ≥45 FPS avg, ≥25 FPS 1% low, <150 MB memory
- **Action if Fail**: Recommend 50K particles for mobile devices

## Data Format

Each JSON export contains:
```json
{
  "timestamp": "2025-10-12T14:30:00.000Z",
  "device": {
    "class": "desktop-high",
    "userAgent": "...",
    "platform": "MacIntel",
    "cores": 12,
    "memory": 32,
    "gpu": "Apple M3 Max",
    "screen": "3024x1964",
    "pixelRatio": 2
  },
  "results": [
    {
      "particleCount": 150000,
      "duration": 60,
      "interactionMode": "simulated",
      "avgFPS": "60.00",
      "minFPS": "58.00",
      "maxFPS": "60.00",
      "fps1Percent": "58.50",
      "fps01Percent": "58.00",
      "avgFrameTime": "16.67",
      "p99FrameTime": "17.24",
      "memoryUsage": {
        "used": "142.56",
        "total": "256.00",
        "limit": "4096.00"
      },
      "samples": 60
    }
  ]
}
```

## Current Status

**Benchmark Tool**: ✅ Live at https://blazesportsintel.com/performance-benchmark.html
**Documentation**: ✅ Complete
**Directory Structure**: ✅ Created
**Benchmark Data**: 🟡 Awaiting Execution

**Priority**: ⚠️ Critical Blocker #3 - "ZERO benchmarks for 150K particles claim"

## Red Flags to Watch For

If you encounter these during testing, STOP and investigate:

1. **Desktop High-End < 60 FPS at 150K**
   - Impact: Marketing claim needs correction
   - Action: Reduce claim to 100K particles

2. **Mobile High-End < 45 FPS at 100K**
   - Impact: Mobile experience needs optimization
   - Action: Recommend 50K for mobile

3. **Memory Usage > 500 MB**
   - Impact: May cause browser crashes on low-memory devices
   - Action: Investigate memory leaks

4. **Frame Time Variance > 50ms**
   - Impact: Poor user experience despite adequate average FPS
   - Action: Check for stuttering issues

## Next Steps

1. Run Phase 1 benchmarks on available devices
2. Validate 150K particle claim is accurate
3. Update `SUMMARY.md` with real data
4. Update marketing claims on homepage with verified performance
5. Deploy updated claims to production

---

**Created**: October 12, 2025
**Version**: 1.0.0
**Documentation**: /Users/AustinHumphrey/BSI/PERFORMANCE-BENCHMARK-GUIDE.md
**Testing Checklist**: /Users/AustinHumphrey/BSI/PERFORMANCE-TESTING-CHECKLIST.md
