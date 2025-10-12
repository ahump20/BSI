# Phase 1: Critical Benchmark Execution Guide

**Time Required**: 30 minutes
**Priority**: ⚠️ CRITICAL - Validates "150K particles" marketing claim
**Devices Needed**: Desktop High-End + Mobile High-End (your current devices)

---

## Desktop High-End Test (15 minutes)

### Device: MacBook Pro M3 Max

**Goal**: Validate "150K particles @ 60 FPS" claim

### Step 1: Open Benchmark Tool

```
URL: https://blazesportsintel.com/performance-benchmark.html
Browser: Chrome or Safari (latest version)
```

### Step 2: Verify Device Detection

You should see at top of page:
- **Device Class**: Desktop High-End
- **CPU Cores**: 12 (or similar)
- **Memory**: 32GB (or similar)
- **GPU**: Apple M3 Max

✅ Take screenshot of device info section → Save as `desktop-high/screenshots/device-info.png`

### Step 3: Configure Test

Set these parameters:
- **Particle Count**: `150000` (150K)
- **Test Duration**: `60 seconds`
- **Interaction Mode**: `Simulated Movement`
- **Test Runs**: `3 runs (averaged)`

### Step 4: Run Benchmark

1. Click **"Start Benchmark"** button
2. **DO NOT touch your computer** for ~3 minutes
3. Watch FPS counter during test (should stay near 60 FPS)

### Step 5: Record Results

After test completes:

1. ✅ Take screenshot of results card → Save as `desktop-high/screenshots/results-150K.png`

2. ✅ Click **"Export Results as JSON"** button

3. ✅ Save file as: `desktop-high/benchmark-desktop-high-150K-20251012.json`

4. ✅ Check these critical metrics:

```
PASS CRITERIA:
[ ] Average FPS: ≥ 60.00 FPS
[ ] 1% Low FPS: ≥ 30.00 FPS
[ ] Memory Usage: < 300 MB
```

### Step 6: Interpret Results

**If ALL pass criteria met**:
- ✅ "150K particles" claim is VALIDATED
- ✅ Proceed to mobile test

**If ANY criteria FAIL**:
- ❌ Marketing claim is INCORRECT
- ❌ Must reduce claim to "100K particles"
- ❌ Document failure reason in SUMMARY.md

---

## Mobile High-End Test (15 minutes)

### Device: iPhone 15 Pro / Galaxy S24+

**Goal**: Validate "100K particles @ 50 FPS" mobile performance claim

### Step 1: Open Benchmark Tool (Mobile)

```
URL: https://blazesportsintel.com/performance-benchmark.html
Browser: Safari (iOS) or Chrome (Android)
```

⚠️ **Important**: Ensure device is:
- Fully charged or plugged in
- Not in low-power mode
- All other apps closed

### Step 2: Verify Device Detection

You should see:
- **Device Class**: Mobile High-End
- **CPU Cores**: 6 or more
- **Memory**: 4GB or more

✅ Take screenshot → Save as `mobile-high/screenshots/device-info.png`

### Step 3: Configure Test

Set these parameters:
- **Particle Count**: `100000` (100K)
- **Test Duration**: `60 seconds`
- **Interaction Mode**: `Simulated Movement`
- **Test Runs**: `3 runs (averaged)`

### Step 4: Run Benchmark

1. Click **"Start Benchmark"** button
2. **DO NOT touch your phone** for ~3 minutes
3. Watch FPS counter (expected: 45-55 FPS)

### Step 5: Record Results

After test completes:

1. ✅ Take screenshot → Save as `mobile-high/screenshots/results-100K.png`

2. ✅ Tap **"Export Results as JSON"**

3. ✅ Share/save file as: `mobile-high/benchmark-mobile-high-100K-20251012.json`

4. ✅ Check these critical metrics:

```
PASS CRITERIA:
[ ] Average FPS: ≥ 45.00 FPS
[ ] 1% Low FPS: ≥ 25.00 FPS
[ ] Memory Usage: < 150 MB
```

### Step 6: Interpret Results

**If ALL pass criteria met**:
- ✅ Mobile performance claim is VALIDATED
- ✅ Can advertise "100K particles on mobile flagships"

**If ANY criteria FAIL**:
- ❌ Must recommend "50K particles for mobile"
- ❌ Document failure reason in SUMMARY.md

---

## After Testing: Update Documentation

### 1. Open SUMMARY.md

```bash
# Navigate to benchmarks directory
cd /Users/AustinHumphrey/BSI/docs/performance-benchmarks

# Open in text editor
code SUMMARY.md  # or vim/nano
```

### 2. Fill In Device Specifications

Extract from JSON exports:

**Desktop High-End Section**:
```markdown
**Device Specifications**:
- CPU: [Copy from JSON: device.cores + " cores"]
- Memory: [Copy from JSON: device.memory + "GB"]
- GPU: [Copy from JSON: device.gpu]
- Screen: [Copy from JSON: device.screen]
- Browser: [Copy from JSON: device.userAgent]
```

### 3. Fill In Performance Tables

From your JSON results file, extract:

```markdown
| 150K | [avgFPS] | [fps1Percent] | [fps01Percent] | [avgFrameTime] | [p99FrameTime] | [memoryUsage.used] | [✅/⚠️/❌] |
```

Example:
```markdown
| 150K | 60.00 | 58.50 | 58.00 | 16.67 | 17.24 | 142.56 | ✅ Excellent |
```

### 4. Update Target Validation Checkboxes

Replace `❓` with `✅` or `❌`:

```markdown
**Target Validation**:
- ✅ 150K particles: ≥ 60 FPS average → PASS (60.00 FPS)
- ✅ 150K particles: ≥ 30 FPS (1% low) → PASS (58.50 FPS)
- ✅ Memory usage: < 300 MB → PASS (142.56 MB)
```

### 5. Update Marketing Claims Section

Replace `[PENDING BENCHMARK VALIDATION]` with verified claim:

**If ALL tests passed**:
```markdown
### AFTER (Verified - October 12, 2025)
> "Advanced particle system with 150,000 particles on high-end desktops
> (sustained 60 FPS on M3 Max), 100,000 particles on mobile flagships
> (52 FPS on iPhone 15 Pro), and adaptive scaling for optimal performance
> across all devices."
>
> **Evidence**: [See Benchmarks](/docs/performance-benchmarks/SUMMARY.md)
```

**If Desktop test FAILED**:
```markdown
### AFTER (Verified - October 12, 2025)
> "WebGL2 rendering engine with up to 100,000 particles on high-end
> desktops and 50,000 particles on mobile devices, ensuring smooth
> 60 FPS performance across all supported platforms."
>
> **Note**: Initial 150K particle claim was not validated by benchmarks.
> **Evidence**: [See Benchmarks](/docs/performance-benchmarks/SUMMARY.md)
```

---

## Critical Decision Matrix

| Test Results | Marketing Claim | Action Required |
|--------------|----------------|-----------------|
| Desktop ✅ + Mobile ✅ | "150K desktop, 100K mobile" | ✅ Deploy verified claims |
| Desktop ✅ + Mobile ❌ | "150K desktop, 50K mobile" | ⚠️ Update mobile recommendations |
| Desktop ❌ + Mobile ✅ | "100K desktop, 100K mobile" | ⚠️ Reduce desktop claim |
| Desktop ❌ + Mobile ❌ | "100K desktop, 50K mobile" | ❌ Full claim revision required |

---

## Next Steps After Phase 1

### If Tests PASS ✅

1. **Update Homepage** (index.html):
   ```html
   <!-- Replace line ~67 -->
   <p>Advanced particle system with 150,000 particles on high-end desktops
   (sustained 60 FPS), adaptive scaling for all devices.</p>
   <a href="/docs/performance-benchmarks/SUMMARY.md">See Benchmarks →</a>
   ```

2. **Update Analytics Page** (analytics.html):
   ```html
   <!-- Add device recommendations section -->
   <div class="performance-recommendations">
     <h3>Recommended Particle Counts</h3>
     <ul>
       <li><strong>Desktop (High-End)</strong>: 150K particles @ 60 FPS</li>
       <li><strong>Mobile (Flagship)</strong>: 100K particles @ 50 FPS</li>
       <li><a href="/docs/performance-benchmarks/SUMMARY.md">See full benchmarks →</a></li>
     </ul>
   </div>
   ```

3. **Commit Changes**:
   ```bash
   git add docs/performance-benchmarks/
   git commit -m "📊 EVIDENCE: Add verified performance benchmarks (150K @ 60 FPS validated)"
   ```

4. **Deploy to Production**:
   ```bash
   /Users/AustinHumphrey/.npm-global/bin/wrangler pages deploy . \
     --project-name blazesportsintel \
     --branch main \
     --commit-message="✅ Update marketing with verified performance data"
   ```

### If Tests FAIL ❌

1. **Update Claims Immediately**:
   - Reduce particle count claims
   - Add "[Tested Performance]" label
   - Link to benchmark evidence

2. **Investigate Performance Issues**:
   - Review Three.js configuration
   - Check for memory leaks
   - Profile rendering bottlenecks

3. **Re-test After Optimizations**:
   - Run benchmarks again
   - Document improvements
   - Update claims with new data

---

## Troubleshooting

### Benchmark Won't Start

**Problem**: Click "Start Benchmark" but nothing happens

**Solutions**:
1. Check browser console for errors (F12 → Console tab)
2. Verify Three.js CDN loaded (look for "THREE is not defined" error)
3. Try different browser (Chrome/Safari/Firefox)
4. Disable browser extensions temporarily

### Low FPS on High-End Device

**Problem**: Getting 30 FPS instead of 60 FPS on M3 Max

**Solutions**:
1. Check power settings (disable battery saver mode)
2. Close all other applications
3. Let device cool down if warm
4. Try wired power connection
5. Clear browser cache and reload

### Memory Usage Increasing Over Time

**Problem**: Memory usage climbs above 500 MB during test

**Solutions**:
1. This indicates a memory leak - document in SUMMARY.md
2. Check for orphaned event listeners in code
3. Verify Three.js geometry/material disposal
4. Report as Critical Issue for investigation

### Can't Export JSON

**Problem**: Export button doesn't download file

**Solutions**:
1. Check browser download settings
2. Allow pop-ups for blazesportsintel.com
3. Try right-click → "Save Link As"
4. Copy results manually from results card

---

## Checklist

Before starting tests:
- [ ] Benchmark tool accessible at https://blazesportsintel.com/performance-benchmark.html
- [ ] Desktop device ready (high-end Mac/PC)
- [ ] Mobile device ready (flagship phone)
- [ ] Screenshot capture tool ready
- [ ] File organization folders created

During tests:
- [ ] Device detection verified
- [ ] Test configuration set correctly
- [ ] No interruptions during 3-minute test run
- [ ] Screenshots captured
- [ ] JSON exports saved with correct filenames

After tests:
- [ ] SUMMARY.md updated with real data
- [ ] Target validations checked (✅/❌)
- [ ] Marketing claims updated
- [ ] Decision made: deploy verified claims or revise

---

**Time Estimate**: 30 minutes (15 min desktop + 15 min mobile)
**Priority**: CRITICAL - Unblocks production deployment
**Impact**: Moves credibility from 58/100 → 85+/100 with evidence-based claims
**Next Document**: SUMMARY.md (to be populated with your results)
