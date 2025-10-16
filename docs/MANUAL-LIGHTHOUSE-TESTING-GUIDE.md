# Manual Lighthouse Testing Guide

**Platform**: Blaze Sports Intel - College Baseball Tracker
**Test URL**: https://ff479c53.blazesportsintel.pages.dev
**Date Created**: October 16, 2025

---

## Why Manual Testing?

Google PageSpeed Insights API doesn't index new deployments immediately. Manual Chrome DevTools Lighthouse provides immediate results.

---

## Prerequisites

- **Chrome Browser**: Latest version (100+)
- **Device**: Desktop or laptop (mobile device testing separate)
- **Network**: Stable internet connection
- **Time Required**: 5-10 minutes

---

## Step-by-Step Instructions

### 1. Open the Test URL

```
https://ff479c53.blazesportsintel.pages.dev
```

- Verify the page loads correctly
- Check that "College Baseball Live" appears in the header
- Confirm live scores are loading from ESPN API

---

### 2. Open Chrome DevTools

**Method 1: Keyboard Shortcut**
- **Mac**: `Cmd + Option + I`
- **Windows/Linux**: `Ctrl + Shift + I`

**Method 2: Menu**
- Click the three-dot menu (⋮) in top-right
- Select "More tools" → "Developer tools"

---

### 3. Navigate to Lighthouse Tab

- In DevTools, click the **"Lighthouse"** tab
- If you don't see it, click the **">>"** button to reveal hidden tabs

---

### 4. Configure Lighthouse Settings

**Device:**
- ✅ Select **"Mobile"** (not Desktop)
- This simulates a mobile device viewport (375px width)

**Categories:**
- ✅ **Performance** (required)
- ✅ **Accessibility** (required)
- ⬜ Best Practices (optional)
- ⬜ SEO (optional)
- ⬜ PWA (optional)

**Mode:**
- ✅ Select **"Navigation"** (default)

**Throttling:**
- ✅ **"Simulated throttling (default)"**
- This simulates a 4G mobile connection with CPU throttling

---

### 5. Run the Audit

1. Click the **"Analyze page load"** button (blue button)
2. Wait 30-60 seconds while Lighthouse runs tests
3. DevTools will automatically:
   - Reload the page multiple times
   - Test various performance metrics
   - Check accessibility standards

**Note**: Do not interact with the browser during the audit.

---

### 6. Record the Results

Once the audit completes, you'll see a report with scores (0-100).

#### Performance Score

**Target**: 90+

Record the following metrics:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| **Performance Score** | 90+ | ___ | ⬜ |
| **First Contentful Paint (FCP)** | <1.8s | ___ | ⬜ |
| **Largest Contentful Paint (LCP)** | <2.5s | ___ | ⬜ |
| **Total Blocking Time (TBT)** | <200ms | ___ | ⬜ |
| **Cumulative Layout Shift (CLS)** | <0.1 | ___ | ⬜ |
| **Speed Index** | <3.4s | ___ | ⬜ |

#### Accessibility Score

**Target**: 95+

Record the following:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| **Accessibility Score** | 95+ | ___ | ⬜ |
| **Contrast Ratio Issues** | 0 | ___ | ⬜ |
| **Missing Alt Text** | 0 | ___ | ⬜ |
| **Keyboard Navigation** | Pass | ___ | ⬜ |
| **ARIA Labels** | Pass | ___ | ⬜ |

---

### 7. Review Opportunities

Lighthouse provides specific suggestions for improvement. Record the top 3 opportunities:

1. **Opportunity 1**: ____________________ (Estimated savings: ____ ms)
2. **Opportunity 2**: ____________________ (Estimated savings: ____ ms)
3. **Opportunity 3**: ____________________ (Estimated savings: ____ ms)

---

### 8. Save the Report (Optional)

To save the Lighthouse report for future reference:

1. Click the **"Download report"** button (📥 icon)
2. Save as HTML or JSON
3. Place in `/Users/AustinHumphrey/BSI/docs/lighthouse-reports/`

---

## Interpreting the Scores

### Performance Score Ranges

| Score | Meaning | Action Required |
|-------|---------|-----------------|
| **90-100** | 🟢 Excellent | No immediate action |
| **80-89** | 🟡 Good | Minor optimizations suggested |
| **50-79** | 🟠 Needs improvement | Investigate largest opportunities |
| **0-49** | 🔴 Poor | Immediate optimization required |

### Accessibility Score Ranges

| Score | Meaning | Action Required |
|-------|---------|-----------------|
| **95-100** | 🟢 Excellent | No immediate action |
| **90-94** | 🟡 Good | Fix minor issues |
| **80-89** | 🟠 Needs improvement | Address accessibility violations |
| **0-79** | 🔴 Poor | Immediate fixes required (WCAG AA failure) |

---

## Common Issues and Solutions

### Issue 1: Performance Score Below 90

**Likely Causes:**
- Large JavaScript bundle (React vendor chunk = 96KB)
- Unoptimized images
- Render-blocking resources
- Slow server response

**Immediate Solutions:**
- Implement lazy loading for React vendor chunk
- Convert to Preact (~4KB vs 96KB)
- Add CDN caching headers
- Optimize ESPN API response time

---

### Issue 2: Accessibility Score Below 95

**Likely Causes:**
- Color contrast issues (dark theme with gray text)
- Missing ARIA labels
- Keyboard navigation problems
- Missing alt text on images

**Immediate Solutions:**
- Increase text contrast (gray → white)
- Add `aria-label` to interactive elements
- Ensure tab navigation works
- Add descriptive alt text

---

### Issue 3: Large Largest Contentful Paint (LCP > 2.5s)

**Likely Causes:**
- React vendor bundle loading before content
- ESPN API response delay
- No loading skeleton (shows spinner only)

**Immediate Solutions:**
- Implement critical CSS inlining
- Show content skeleton before API response
- Preload React vendor chunk
- Use Service Worker for offline support

---

## Mobile Device Testing (Separate from Lighthouse)

After running Lighthouse on desktop, test on real devices:

### iPhone Testing

1. **iPhone 12/13/14** (375px width)
   - Open Safari: https://ff479c53.blazesportsintel.pages.dev
   - Verify no horizontal scrolling
   - Check that text is readable without zoom
   - Test touch targets (44x44px minimum)
   - Verify auto-refresh works every 30 seconds

2. **iPhone SE** (320px width - smallest modern iPhone)
   - Ensure layout doesn't break
   - Check that game cards stack vertically

### iPad Testing

1. **iPad Mini** (768px width)
   - Verify 2-column grid displays correctly
   - Check that spacing feels natural

---

## Next Steps After Testing

### If Performance Score < 90:

1. Implement recommendations from Lighthouse "Opportunities"
2. Consider switching to Preact for bundle size reduction
3. Add lazy loading for non-critical components
4. Set up Cloudflare Workers caching

### If Accessibility Score < 95:

1. Fix all contrast ratio issues
2. Add missing ARIA labels
3. Test with screen reader (VoiceOver on Mac)
4. Ensure keyboard navigation works

### If All Scores Pass (90+ Performance, 95+ Accessibility):

1. Document results in `PHASE-1-PERFORMANCE-BASELINE.md`
2. Celebrate 🎉
3. Proceed to Phase 2: Football development

---

## Reporting Template

Copy this template to `docs/PHASE-1-PERFORMANCE-BASELINE.md` after testing:

```markdown
## Actual Lighthouse Scores (Manual Testing)

**Test Date**: [Date]
**Tester**: [Your Name]
**Device**: Chrome Desktop (Mobile Simulation)
**URL**: https://ff479c53.blazesportsintel.pages.dev

### Performance

- **Score**: __/100 ([Pass/Fail] - Target: 90+)
- **First Contentful Paint**: __ s
- **Largest Contentful Paint**: __ s
- **Total Blocking Time**: __ ms
- **Cumulative Layout Shift**: __
- **Speed Index**: __ s

### Accessibility

- **Score**: __/100 ([Pass/Fail] - Target: 95+)
- **Contrast Issues**: [Number of issues]
- **ARIA Issues**: [Number of issues]
- **Keyboard Navigation**: [Pass/Fail]

### Top Opportunities

1. [Opportunity name] - Estimated savings: __ ms
2. [Opportunity name] - Estimated savings: __ ms
3. [Opportunity name] - Estimated savings: __ ms

### Action Items

- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]
```

---

## Questions?

If you encounter issues or need clarification:
1. Check Chrome DevTools Console for errors
2. Verify the deployment is live (https://ff479c53.blazesportsintel.pages.dev should respond with HTTP 200)
3. Try refreshing the page and running the audit again

---

**Document Version**: 1.0
**Last Updated**: October 16, 2025
**Author**: Claude (Sonnet 4.5) - Blaze Sports Intel
