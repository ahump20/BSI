# Mobile Testing Quick Checklist

**Date**: _______________
**Tester**: _______________
**Device**: _______________
**iOS**: _______________

## Pre-Test Setup
- [ ] Safari cache cleared
- [ ] Cookies cleared
- [ ] Content blockers disabled
- [ ] "Request Desktop Website" OFF

## Test URLs
```
Production:
□ https://blazesportsintel.com/
□ https://blazesportsintel.com/football
□ https://blazesportsintel.com/?sport=baseball
□ https://blazesportsintel.com/?sport=football

Staging:
□ https://[deployment-id].blazesportsintel.pages.dev/
```

## Critical Path Testing

### 1. Initial Load (Baseball Homepage)
- [ ] Loads within 3 seconds (4G)
- [ ] No console errors
- [ ] All content visible without horizontal scroll
- [ ] Text readable without zooming

### 2. SportSwitcher FAB
- [ ] FAB visible in bottom-right corner
- [ ] FAB size adequate (48px minimum)
- [ ] Single tap opens menu
- [ ] Menu slides up smoothly
- [ ] Baseball/Football options visible
- [ ] Current sport disabled/distinct
- [ ] Tap outside closes menu

### 3. Navigation (Baseball → Football)
- [ ] Tap "Football" in FAB menu
- [ ] Navigates to /football
- [ ] Page loads within 1 second
- [ ] No layout shift
- [ ] All content renders correctly

### 4. Navigation (Football → Baseball)
- [ ] Tap "Baseball" in FAB menu
- [ ] Navigates to /
- [ ] Page loads within 1 second
- [ ] No layout shift
- [ ] All content renders correctly

### 5. Browser Back Button
- [ ] Back button works after navigation
- [ ] Returns to previous sport
- [ ] Page state preserved
- [ ] No errors

### 6. Seasonal Routing
**Current Month**: _______________

- [ ] Root (/) redirects correctly based on season
  - Oct-Dec → Football ✓
  - Mar-Jun → Baseball ✓
  - Jan-Feb → Football (off-season)
  - Jul → Baseball (off-season)
- [ ] ?sport=baseball stays on baseball
- [ ] ?sport=football redirects to /football
- [ ] Cookie set correctly (check DevTools)
- [ ] Cookie persists after closing Safari

### 7. Viewport & Layout (Portrait)
- [ ] No horizontal scrolling
- [ ] Safe area respected (notch/Dynamic Island)
- [ ] Header visible and aligned
- [ ] Footer visible and aligned
- [ ] All cards/sections properly sized
- [ ] No overlapping content

### 8. Viewport & Layout (Landscape)
- [ ] Layout adapts correctly
- [ ] Content remains readable
- [ ] Navigation accessible
- [ ] No overlapping elements

### 9. Touch Interactions
- [ ] All buttons tappable (48px min)
- [ ] No accidental adjacent taps
- [ ] Active states visible
- [ ] Scrolling smooth
- [ ] No accidental horizontal swipes

### 10. Typography
- [ ] Body text 16px minimum
- [ ] Headings properly sized
- [ ] Line height sufficient
- [ ] Color contrast adequate (WCAG AA)
- [ ] Font rendering clear

### 11. Performance (WiFi)
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.0s
- [ ] No layout shift (CLS < 0.1)
- [ ] Bundle size reasonable

### 12. Performance (4G)
- [ ] First Contentful Paint < 3.0s
- [ ] Progressive loading works
- [ ] Loading indicators shown
- [ ] No timeout errors

### 13. Accessibility
- [ ] VoiceOver announces all interactive elements
- [ ] Proper heading hierarchy
- [ ] Form labels associated
- [ ] Alt text on images
- [ ] Focus order logical

### 14. Edge Cases
- [ ] Private Browsing mode works
- [ ] Slow connection (< 1 Mbps) handled
- [ ] Connection interruption handled
- [ ] Low Data Mode works
- [ ] Text size 200% works

## Issues Found

| # | Priority | Description | Screenshot |
|---|----------|-------------|------------|
| 1 | P__ | | [ ] |
| 2 | P__ | | [ ] |
| 3 | P__ | | [ ] |
| 4 | P__ | | [ ] |
| 5 | P__ | | [ ] |

## Performance Metrics

| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| FCP (WiFi) | < 1.5s | _____ | [ ] |
| LCP (WiFi) | < 2.5s | _____ | [ ] |
| TTI (WiFi) | < 3.0s | _____ | [ ] |
| FCP (4G) | < 3.0s | _____ | [ ] |
| LCP (4G) | < 4.0s | _____ | [ ] |
| TTI (4G) | < 5.0s | _____ | [ ] |
| CLS | < 0.1 | _____ | [ ] |
| FID | < 100ms | _____ | [ ] |

## Bundle Sizes

| Bundle | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| Vendor (shared) | < 100KB | _____ | [ ] |
| Baseball | < 10KB | _____ | [ ] |
| Football | < 10KB | _____ | [ ] |
| Total First Load | < 120KB | _____ | [ ] |

## Sign-Off

- [ ] All critical path items passed
- [ ] All P0/P1 issues documented
- [ ] Performance benchmarks met
- [ ] Accessibility verified
- [ ] Screenshots captured

**Tester Signature**: _______________
**Date Completed**: _______________

---

**Notes**:
