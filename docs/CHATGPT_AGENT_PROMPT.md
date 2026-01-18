# 🤖 ChatGPT Agent Mode - Activation Prompt

**Copy and paste this entire prompt into ChatGPT Agent Mode to begin testing:**

---

## Your Mission

You are a QA testing agent for the Blaze Sports Intelligence platform. I need you to thoroughly test 6 next-generation sports analytics features that are deployed but currently disabled via feature flags.

**Why you?** You have browser capabilities that Claude Code (who built these features) does not have. Claude cannot open browsers, see visual elements, click buttons, or verify user experience. That's where you come in.

## Your Task

1. **Navigate** to https://blazesportsintel.com/analytics
2. **Follow** the comprehensive testing plan in the document below
3. **Test** all 6 features individually and together
4. **Report back** with detailed findings using the provided template

## Testing Plan Document

Read and follow this complete testing plan:

**File Location**: `/Users/AustinHumphrey/BSI/docs/CHATGPT_TESTING_PLAN.md`

**Or access it here**: https://blazesportsintel.com/analytics

## Quick Start Instructions

### Step 1: Open the Page

Navigate to: **https://blazesportsintel.com/analytics**

### Step 2: Open Browser DevTools

- Press `F12` (or `Ctrl+Shift+I` on Windows / `Cmd+Option+I` on Mac)
- Click the **Console** tab

### Step 3: Verify Base State

You should see in console:

```
🚀 Blaze Sports Intel - Next-Gen Feature Flags: {...}
📊 Enabled Features: 0 / 6
```

### Step 4: Start Testing

**Quick Test All Features**:

```javascript
FEATURE_FLAGS.realTimeDashboard = true;
FEATURE_FLAGS.mlbStatcast = true;
FEATURE_FLAGS.nflNextGenStats = true;
FEATURE_FLAGS.aiPredictions = true;
FEATURE_FLAGS.plotlyWebGPU = true;
FEATURE_FLAGS.deckGLVisualization = true;
location.reload();
```

## The 6 Features You're Testing

1. **Real-Time Dashboard** - 6-card grid with live games, standings, stats
2. **MLB Statcast** - Baseball analytics with spray charts, xBA, barrel rate
3. **NFL Next Gen Stats** - Football tracking with 10Hz data, field visualization
4. **AI Predictions** - LSTM injury risk + XGBoost performance forecasting
5. **Plotly WebGPU** - GPU-accelerated charts for million-point datasets
6. **deck.gl Heatmaps** - GPU geospatial visualizations

## What to Test For

### Visual Verification ✅

- Do components render without visual glitches?
- Are colors, fonts, and layouts professional?
- Do animations run smoothly (200-400ms transitions)?
- Are charts and visualizations crisp and clear?

### Interaction Testing 🖱️

- Do buttons respond to clicks?
- Do toggle switches work correctly?
- Do cards expand/collapse smoothly?
- Do hover effects display properly?

### Error Detection 🐛

- Are there red errors in the console?
- Does the page crash or freeze?
- Are there "undefined" or "NaN" values displayed?
- Do ErrorBoundary messages appear?

### Performance Check ⚡

- Does page load in <5 seconds?
- Is memory usage <200MB?
- Are there layout shifts during load?
- Is scrolling smooth and responsive?

## Report Format

When you're done testing, provide a report with:

### 1. Feature Status Table

```
Feature               | Status | Notes
---------------------|--------|------------------
Real-Time Dashboard  | ✅/❌  | [Brief findings]
MLB Statcast         | ✅/❌  | [Brief findings]
NFL Next Gen Stats   | ✅/❌  | [Brief findings]
AI Predictions       | ✅/❌  | [Brief findings]
Plotly WebGPU        | ✅/❌  | [Brief findings]
deck.gl Heatmaps     | ✅/❌  | [Brief findings]
```

### 2. Critical Issues

List any blocking bugs that prevent features from working

### 3. Performance Metrics

- Page load time: X seconds
- Memory usage: X MB
- Console errors: X errors

### 4. UX Observations

- What works well?
- What could be improved?
- Does it feel production-ready?

### 5. Final Recommendation

Choose one:

- ✅ **Option 2: Ready for Gradual Rollout** - Features work, enable in production following Week 1-3 plan
- ⚠️ **Option 3: Build Real APIs First** - Features work but sample data too fake, need real endpoints
- ❌ **Fix Bugs First** - Found critical issues, must fix before any rollout

## Screenshots Needed

Please capture:

1. Real-Time Dashboard with 6 cards visible
2. MLB Statcast section with spray chart
3. NFL Next Gen Stats with field visualization
4. AI Predictions showing both injury risk and performance views
5. Plotly chart with mode toggle
6. deck.gl heatmap with GPU mode
7. Full page with all features enabled
8. Browser console showing "📊 Enabled Features: 6 / 6"

## Time Estimate

- **Individual feature tests**: 2-3 minutes each = 12-18 minutes
- **Full integration test**: 5 minutes
- **Report writing**: 5-10 minutes
- **Total**: ~20-30 minutes for comprehensive testing

## Context: What Claude Code Built

Over the past development session, Claude Code implemented:

- **~2,400 lines** of production-ready React code
- **7 git commits** with full documentation
- **Zero breaking changes** to existing functionality
- **Complete safety mechanisms**: ErrorBoundary + feature flags
- **Comprehensive documentation**: 3 guides totaling ~1,500 lines

The code is deployed to production but safely disabled. Your testing determines if we:

1. Enable features for users (gradual 3-week rollout), or
2. Build real API endpoints first (replace sample data)

## If Things Break

Instant rollback command:

```javascript
FEATURE_FLAGS.realTimeDashboard = false;
FEATURE_FLAGS.mlbStatcast = false;
FEATURE_FLAGS.nflNextGenStats = false;
FEATURE_FLAGS.aiPredictions = false;
FEATURE_FLAGS.plotlyWebGPU = false;
FEATURE_FLAGS.deckGLVisualization = false;
location.reload();
```

This disables everything and returns page to working state.

## Questions?

If anything is unclear during testing:

- Check the full testing plan in `CHATGPT_TESTING_PLAN.md`
- Console log messages provide debugging context
- ErrorBoundary will catch and display component errors
- All features are safe to test - cannot break production

---

**Ready? Navigate to https://blazesportsintel.com/analytics and begin testing!** 🚀

Report your findings when complete so Claude Code can make the rollout decision.
