# ⚡ Quick Testing Guide - Next-Gen Features

**5-Minute Test Protocol**

## 🚀 Quick Start (Browser Console)

Open https://blazesportsintel.com/analytics and press **F12** for DevTools Console.

---

## Test 1: Real-Time Dashboard (30 seconds)

```javascript
FEATURE_FLAGS.realTimeDashboard = true;
location.reload();
```

**Expected**:

- ✅ New "Real-Time Dashboard" tab appears
- ✅ 6 cards display (Live Games, Standings, Quick Stats, AI, Performance, Status)
- ✅ Cards expand on click
- ✅ Auto-refresh badge shows

**If broken**: Set `false` and reload

---

## Test 2: MLB Statcast (30 seconds)

```javascript
FEATURE_FLAGS.mlbStatcast = true;
location.reload();
// Navigate: MLB > Teams > Click any team
```

**Expected**:

- ✅ "⚾ MLB Statcast" section below roster
- ✅ Canvas spray chart renders
- ✅ 4 stats show: xBA, Barrel Rate, Attack Angle, Exit Velo

**If broken**: Set `false` and reload

---

## Test 3: NFL Next Gen Stats (30 seconds)

```javascript
FEATURE_FLAGS.nflNextGenStats = true;
location.reload();
// Navigate: NFL > Teams > Click any team
```

**Expected**:

- ✅ "🏈 NFL Next Gen Stats" section appears
- ✅ Canvas field visualization renders
- ✅ 5 play buttons at top
- ✅ Stats show: Speed, Acceleration, Separation

**If broken**: Set `false` and reload

---

## Test 4: AI Predictions (45 seconds)

```javascript
FEATURE_FLAGS.aiPredictions = true;
location.reload();
// Navigate: Any sport > Teams > Click any team
```

**Expected**:

- ✅ "🤖 AI Predictions" section appears
- ✅ Two toggle buttons: "Injury Risk" and "Performance Forecast"
- ✅ Risk metrics display with color coding
- ✅ Canvas factor chart renders
- ✅ Disclaimers present at bottom

**If broken**: Set `false` and reload

---

## Test 5: Plotly WebGPU (30 seconds)

```javascript
FEATURE_FLAGS.plotlyWebGPU = true;
location.reload();
// Check playoff probability trends chart
```

**Expected**:

- ✅ Visualization mode toggle appears
- ✅ Plotly.js option available (if WebGPU supported)
- ✅ Chart renders with interactive hover
- ✅ Performance badge shows "⚡ Plotly WebGPU Mode"

**Fallback**: Chart.js mode if browser doesn't support WebGPU

---

## Test 6: deck.gl Heatmaps (30 seconds)

```javascript
FEATURE_FLAGS.deckGLVisualization = true;
location.reload();
// Navigate to heatmap section
```

**Expected**:

- ✅ Visualization mode toggle appears
- ✅ deck.gl option available (if WebGL2 supported)
- ✅ GPU-accelerated rendering active
- ✅ Performance badge shows "🌐 deck.gl GPU Mode"

**Fallback**: Canvas 2D mode if browser doesn't support WebGL2

---

## ✅ All Features Test (1 minute)

```javascript
// Enable everything
FEATURE_FLAGS.realTimeDashboard = true;
FEATURE_FLAGS.mlbStatcast = true;
FEATURE_FLAGS.nflNextGenStats = true;
FEATURE_FLAGS.aiPredictions = true;
FEATURE_FLAGS.plotlyWebGPU = true;
FEATURE_FLAGS.deckGLVisualization = true;
location.reload();
```

**Expected**:

- ✅ All 6 features active simultaneously
- ✅ No console errors
- ✅ Page loads in <5s
- ✅ No ErrorBoundary catches
- ✅ Memory usage <200MB

**Check Console**:

```
📊 Enabled Features: 6 / 6
```

---

## 🚨 Rollback (Instant)

```javascript
// Disable all
FEATURE_FLAGS.realTimeDashboard = false;
FEATURE_FLAGS.mlbStatcast = false;
FEATURE_FLAGS.nflNextGenStats = false;
FEATURE_FLAGS.aiPredictions = false;
FEATURE_FLAGS.deckGLVisualization = false;
FEATURE_FLAGS.plotlyWebGPU = false;
location.reload();
```

**Expected**:

- ✅ Back to baseline (existing features only)
- ✅ Zero impact from testing

---

## 📊 Browser Compatibility Quick Check

| Browser      | WebGPU | WebGL2 | All Features                   |
| ------------ | ------ | ------ | ------------------------------ |
| Chrome 113+  | ✅     | ✅     | ✅ Full support                |
| Edge 113+    | ✅     | ✅     | ✅ Full support                |
| Firefox 115+ | ❌     | ✅     | ⚠️ No WebGPU (WebGL2 fallback) |
| Safari 16+   | ⚠️     | ✅     | ⚠️ Limited WebGPU              |
| Mobile       | ❌     | ✅     | ⚠️ Canvas 2D fallback          |

---

## ⏱️ Performance Quick Check

**Open DevTools > Performance**:

1. Start recording
2. Enable all features + reload
3. Stop after page fully loaded

**Targets**:

- Load Time: <3s
- Memory: <200MB
- No layout shifts
- No red/yellow warnings

---

## 🎯 Production Rollout (Copy-Paste)

**Week 1, Day 1** (Real-Time Dashboard):

```bash
# Edit analytics.html line 580
# Change: realTimeDashboard: true

git add analytics.html
git commit -m "🚀 Enable Real-Time Dashboard"
~/.npm-global/bin/wrangler pages deploy . --project-name blazesportsintel --branch main --commit-dirty=true
```

**Week 1, Day 2** (+ MLB Statcast):

```bash
# Edit analytics.html line 581
# Change: mlbStatcast: true

git add analytics.html
git commit -m "⚾ Enable MLB Statcast"
~/.npm-global/bin/wrangler pages deploy . --project-name blazesportsintel --branch main --commit-dirty=true
```

**Week 1, Day 3** (+ NFL Next Gen Stats):

```bash
# Edit analytics.html line 582
# Change: nflNextGenStats: true

git add analytics.html
git commit -m "🏈 Enable NFL Next Gen Stats"
~/.npm-global/bin/wrangler pages deploy . --project-name blazesportsintel --branch main --commit-dirty=true
```

**Week 2, Day 7** (+ AI Predictions):

```bash
# Edit analytics.html line 583
# Change: aiPredictions: true

git add analytics.html
git commit -m "🤖 Enable AI Predictions"
~/.npm-global/bin/wrangler pages deploy . --project-name blazesportsintel --branch main --commit-dirty=true
```

**Week 3, Day 14** (+ Plotly WebGPU):

```bash
# Edit analytics.html line 585
# Change: plotlyWebGPU: true

git add analytics.html
git commit -m "⚡ Enable Plotly WebGPU"
~/.npm-global/bin/wrangler pages deploy . --project-name blazesportsintel --branch main --commit-dirty=true
```

**Week 3, Day 16** (+ deck.gl - ALL FEATURES):

```bash
# Edit analytics.html line 584
# Change: deckGLVisualization: true

git add analytics.html
git commit -m "🌐 Enable deck.gl - ALL NEXT-GEN FEATURES ACTIVE 🎉"
~/.npm-global/bin/wrangler pages deploy . --project-name blazesportsintel --branch main --commit-dirty=true
```

---

**Total Testing Time**: 5 minutes
**Total Rollout Time**: 3 weeks (recommended)
**Risk Level**: Zero with gradual approach
