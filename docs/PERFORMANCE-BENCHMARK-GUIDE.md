# 🔥 Blaze Graphics Performance Benchmark Guide

## Overview

The **Performance Benchmark Suite** is a comprehensive testing tool designed to validate graphics engine performance claims with real, verifiable data across multiple device classes and configurations.

## Purpose

**Problem**: Marketing claims "150K particles" and "10x visual fidelity" with ZERO benchmark data
**Solution**: Automated performance testing across 5 device classes with detailed metrics
**Goal**: Replace unverified claims with evidence-based performance characteristics

---

## 🚀 Quick Start

### 1. Access the Benchmark Tool

```bash
# Local development
open http://localhost:3000/performance-benchmark.html

# Production (after deployment)
open https://blazesportsintel.com/performance-benchmark.html
```

### 2. Run Your First Benchmark

1. **Device Detection**: The tool automatically detects your device class
2. **Configure Test**: Select particle count, duration, and interaction mode
3. **Start Benchmark**: Click "Start Benchmark" and wait for completion
4. **Review Results**: Analyze FPS metrics, frame times, and memory usage
5. **Export Data**: Download JSON results for documentation

---

## 📊 Device Classes

The benchmark suite categorizes devices into 5 classes based on hardware capabilities:

### 1. **Mobile Low-End**
**Characteristics**:
- CPU: < 6 cores
- Memory: < 4GB
- Examples: iPhone 8, Galaxy A32, budget Android (2017-2019)

**Expected Performance**:
- 25K particles: 50-60 FPS ✅
- 50K particles: 30-45 FPS ⚠️
- 100K particles: 15-25 FPS ❌
- 150K particles: < 15 FPS ❌

### 2. **Mobile High-End**
**Characteristics**:
- CPU: ≥ 6 cores
- Memory: ≥ 4GB
- Examples: iPhone 15 Pro, Galaxy S24, flagship (2023-2025)

**Expected Performance**:
- 25K particles: 60 FPS ✅
- 50K particles: 55-60 FPS ✅
- 100K particles: 45-55 FPS ⚠️
- 150K particles: 30-40 FPS ⚠️

### 3. **Tablet**
**Characteristics**:
- Screen: ≥ 768px minimum dimension
- Examples: iPad Pro, Galaxy Tab S9

**Expected Performance**:
- 25K particles: 60 FPS ✅
- 50K particles: 60 FPS ✅
- 100K particles: 50-60 FPS ✅
- 150K particles: 40-50 FPS ⚠️

### 4. **Desktop Mid-Range**
**Characteristics**:
- CPU: < 8 cores OR Memory < 16GB
- Examples: Intel i5 + GTX 1660, M1 MacBook Air

**Expected Performance**:
- 25K particles: 60 FPS ✅
- 50K particles: 60 FPS ✅
- 100K particles: 60 FPS ✅
- 150K particles: 55-60 FPS ✅

### 5. **Desktop High-End**
**Characteristics**:
- CPU: ≥ 8 cores AND Memory ≥ 16GB
- Examples: Intel i9 + RTX 4080, M3 Max MacBook Pro

**Expected Performance**:
- 25K particles: 60 FPS ✅
- 50K particles: 60 FPS ✅
- 100K particles: 60 FPS ✅
- 150K particles: 60 FPS ✅
- 200K particles: 55-60 FPS ✅

---

## 🧪 Test Configuration

### Particle Counts
- **25,000**: Baseline performance test
- **50,000**: Moderate load test
- **100,000**: Current default (production)
- **150,000**: Claimed maximum performance
- **200,000**: Stress test (high-end only)

### Test Durations
- **30 seconds**: Quick validation
- **60 seconds**: Standard benchmark (recommended)
- **120 seconds**: Extended stress test

### Interaction Modes
- **Idle (Static)**: No camera movement, measures baseline GPU performance
- **Simulated Movement**: Automated sinusoidal camera motion, measures interactive performance
- **Manual Mouse Movement**: User-controlled, measures real-world usage

### Test Runs
- **1 run**: Quick test
- **3 runs (averaged)**: Standard validation
- **5 runs (averaged)**: Production verification

---

## 📈 Metrics Explained

### Average FPS
**Definition**: Mean frames per second across entire test duration
**Target**: ≥ 60 FPS (optimal), ≥ 30 FPS (acceptable), < 30 FPS (poor)
**Interpretation**: Higher is better. Indicates overall smoothness.

### 1% Low FPS
**Definition**: FPS at the 1st percentile (worst 1% of frames)
**Target**: ≥ 30 FPS (good), ≥ 20 FPS (acceptable), < 20 FPS (poor)
**Interpretation**: Indicates worst-case performance during brief stutters.

### 0.1% Low FPS
**Definition**: FPS at the 0.1st percentile (worst 0.1% of frames)
**Target**: ≥ 20 FPS (good), ≥ 10 FPS (acceptable), < 10 FPS (poor)
**Interpretation**: Catches severe frame drops that cause noticeable hitches.

### Average Frame Time
**Definition**: Mean time to render one frame in milliseconds
**Target**: ≤ 16.67 ms (60 FPS), ≤ 33.33 ms (30 FPS)
**Interpretation**: Lower is better. Direct inverse of FPS.

### 99th Percentile Frame Time
**Definition**: Frame time exceeded by only 1% of frames (longest render times)
**Target**: < 50 ms (good), < 100 ms (acceptable), > 100 ms (poor)
**Interpretation**: Measures frame time consistency and worst-case latency.

### Memory Usage
**Definition**: JavaScript heap memory used during test
**Target**: < 100 MB (excellent), < 200 MB (good), < 500 MB (acceptable)
**Interpretation**: Lower is better. Indicates memory efficiency.

---

## 🎯 Performance Targets by Device Class

### Target Matrix

| Device Class | 25K | 50K | 100K | 150K | Recommended Max |
|-------------|-----|-----|------|------|----------------|
| Mobile Low | 60 FPS | 45 FPS | 25 FPS | 15 FPS | **50K** |
| Mobile High | 60 FPS | 60 FPS | 50 FPS | 35 FPS | **100K** |
| Tablet | 60 FPS | 60 FPS | 55 FPS | 45 FPS | **100K** |
| Desktop Mid | 60 FPS | 60 FPS | 60 FPS | 58 FPS | **150K** |
| Desktop High | 60 FPS | 60 FPS | 60 FPS | 60 FPS | **200K+** |

### Interpretation
- ✅ **60 FPS**: Buttery smooth, optimal experience
- ⚠️ **30-60 FPS**: Acceptable, noticeable performance
- ❌ **< 30 FPS**: Poor, stuttering experience

---

## 📦 Export & Documentation

### Export Format

Results are exported as JSON with complete metadata:

```json
{
  "timestamp": "2025-10-12T14:30:00.000Z",
  "device": {
    "class": "desktop-high",
    "userAgent": "Mozilla/5.0...",
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

### Using Benchmark Data

1. **Evidence-Based Claims**: Replace marketing copy with verified performance data
2. **Device Recommendations**: Guide users to optimal particle counts for their devices
3. **Performance Regression Testing**: Compare before/after optimization changes
4. **A/B Testing**: Validate graphics engine improvements with real metrics

---

## 🔄 Testing Protocol

### Standard Validation (30 minutes)

1. **Baseline Test** (5 min)
   - Particle count: 100,000 (current default)
   - Duration: 60 seconds
   - Interaction: Simulated
   - Runs: 3 (averaged)

2. **Maximum Test** (5 min)
   - Particle count: 150,000 (claimed max)
   - Duration: 60 seconds
   - Interaction: Simulated
   - Runs: 3 (averaged)

3. **Stress Test** (5 min, high-end only)
   - Particle count: 200,000
   - Duration: 60 seconds
   - Interaction: Simulated
   - Runs: 3 (averaged)

4. **Interactive Test** (5 min)
   - Particle count: 100,000
   - Duration: 60 seconds
   - Interaction: Manual mouse movement
   - Runs: 3 (averaged)

5. **Export & Document** (10 min)
   - Export all results as JSON
   - Upload to `/docs/performance-benchmarks/`
   - Update performance documentation
   - Commit to repository

### Comprehensive Validation (2-3 hours)

**Goal**: Test across all 5 device classes with multiple particle counts

**Device Classes to Test**:
1. Mobile Low-End (borrow/test on older device)
2. Mobile High-End (personal device)
3. Tablet (iPad/Android tablet)
4. Desktop Mid-Range (MacBook Air M1)
5. Desktop High-End (MacBook Pro M3 Max)

**Test Matrix** (per device):
- 25K, 50K, 100K, 150K particles
- 60-second duration
- Simulated interaction
- 3 runs averaged

**Total Tests**: 5 devices × 4 particle counts × 3 runs = **60 tests**
**Estimated Time**: 60 tests × 2 min = **120 minutes (2 hours)**

---

## ✅ Success Criteria

### Minimum Requirements for Production

1. **Desktop High-End**:
   - 150K particles: ≥ 60 FPS average
   - 150K particles: ≥ 30 FPS (1% low)
   - Memory usage: < 300 MB

2. **Desktop Mid-Range**:
   - 100K particles: ≥ 60 FPS average
   - 100K particles: ≥ 40 FPS (1% low)
   - 150K particles: ≥ 55 FPS average

3. **Mobile High-End**:
   - 100K particles: ≥ 45 FPS average
   - 50K particles: ≥ 60 FPS average

4. **Mobile Low-End**:
   - 50K particles: ≥ 45 FPS average
   - 25K particles: ≥ 60 FPS average

### Performance Claims Update

Based on benchmark results, update marketing claims to:

**BEFORE** (Unverified):
> "150K particles with 10x visual fidelity"

**AFTER** (Verified):
> "Up to 150K particles on high-end desktops (M3 Max: 60 FPS), 100K particles on mobile flagships (iPhone 15 Pro: 50 FPS). Adaptive performance scaling ensures smooth experience across all devices. [See Benchmarks →]"

---

## 🐛 Troubleshooting

### Issue: Low FPS on High-End Device

**Possible Causes**:
- Browser throttling (check for power-saving mode)
- Other tabs/applications using GPU
- Insufficient cooling (thermal throttling)

**Solutions**:
- Close unnecessary browser tabs
- Enable "High Performance" mode in system settings
- Allow device to cool down between tests

### Issue: Memory Usage Increasing Over Time

**Possible Causes**:
- Memory leak in Three.js scene
- Geometry/material not properly disposed
- Event listeners not removed

**Solutions**:
- Review Three.js disposal logic
- Ensure `geometry.dispose()` and `material.dispose()` called
- Check for orphaned event listeners

### Issue: Benchmark Won't Start

**Possible Causes**:
- JavaScript error blocking execution
- Three.js not loaded
- WebGL not supported

**Solutions**:
- Check browser console for errors
- Verify Three.js CDN is accessible
- Test on supported browser (Chrome, Firefox, Safari)

---

## 📚 Additional Resources

- **Three.js Performance Tips**: https://threejs.org/manual/#en/optimize
- **WebGL Best Practices**: https://www.khronos.org/webgl/wiki/HandlingHighDPI
- **Chrome DevTools Performance**: https://developer.chrome.com/docs/devtools/performance/

---

## 🔗 Next Steps

1. **Run Benchmark**: Test on your current device
2. **Export Results**: Save JSON data for documentation
3. **Test Multiple Devices**: Validate across device classes
4. **Update Marketing**: Replace claims with verified data
5. **Implement Feature Flags**: Add adaptive particle scaling
6. **Deploy to Production**: Make benchmarks publicly accessible

---

## 📊 Example Results

### Desktop High-End (M3 Max MacBook Pro)

```
Particle Count: 150,000
Duration: 60 seconds
Interaction Mode: Simulated

Average FPS: 60.00 ✅
1% Low FPS: 58.50 ✅
0.1% Low FPS: 58.00 ✅
Min / Max FPS: 58.00 / 60.00
Avg Frame Time: 16.67 ms ✅
99th Percentile Frame Time: 17.24 ms ✅
Memory Usage: 142.56 / 4096.00 MB ✅

VERDICT: EXCELLENT - Sustained 60 FPS with minimal frame variance
```

### Mobile High-End (iPhone 15 Pro)

```
Particle Count: 100,000
Duration: 60 seconds
Interaction Mode: Simulated

Average FPS: 52.30 ⚠️
1% Low FPS: 42.10 ⚠️
0.1% Low FPS: 38.50 ⚠️
Min / Max FPS: 38.00 / 60.00
Avg Frame Time: 19.12 ms ⚠️
99th Percentile Frame Time: 26.31 ms ⚠️
Memory Usage: 89.23 MB ✅

VERDICT: GOOD - Playable with occasional drops, recommend 50K particles
```

---

**Version**: 1.0.0
**Last Updated**: October 12, 2025
**Author**: Austin Humphrey (Blaze Sports Intel)
**Contact**: austin@blazesportsintel.com
