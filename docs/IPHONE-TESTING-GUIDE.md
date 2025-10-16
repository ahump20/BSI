# iPhone Testing Guide - Blaze Sports Intel

## Overview

This guide provides comprehensive procedures for testing the Blaze Sports Intel platform on physical iPhone devices to ensure mobile-first design quality and performance.

## Test Devices

### Primary Test Devices
- **iPhone 14 Pro** (iOS 17+) - 6.1" display, 393x852 points
- **iPhone 13** (iOS 16+) - 6.1" display, 390x844 points
- **iPhone 12 Mini** (iOS 15+) - 5.4" display, 360x780 points

### Screen Specifications
| Device | Points | Pixels | Scale | Physical |
|--------|--------|--------|-------|----------|
| iPhone 14 Pro | 393×852 | 1179×2556 | 3x | 6.1" |
| iPhone 13 | 390×844 | 1170×2532 | 3x | 6.1" |
| iPhone 12 Mini | 360×780 | 1080×2340 | 3x | 5.4" |

### iOS Versions
- **Minimum supported**: iOS 15.0
- **Target**: iOS 17.0+
- **Test on**: Latest public release + one previous major version

## Test URLs

### Production
```
https://blazesportsintel.com/
https://blazesportsintel.com/football
https://blazesportsintel.com/?sport=baseball
https://blazesportsintel.com/?sport=football
```

### Staging (Latest Deployment)
Check Cloudflare Pages deployments:
```
https://[deployment-id].blazesportsintel.pages.dev/
```

## Pre-Test Setup

### 1. Device Preparation
```
□ Update iOS to target version
□ Clear Safari cache and cookies
□ Disable content blockers for test domain
□ Enable "Request Desktop Website" toggle OFF
□ Set Display Zoom to "Standard" (not "Zoomed")
□ Disable "Reduce Motion" for animation testing
□ Test with both WiFi and Cellular (4G/5G)
```

### 2. Safari Settings
```
Settings → Safari:
□ "Block Pop-ups" = OFF (for testing)
□ "Prevent Cross-Site Tracking" = OFF (for cookie testing)
□ "Block All Cookies" = OFF
□ "Fraudulent Website Warning" = ON
```

### 3. Network Conditions
Test under various conditions:
- **WiFi** (high speed)
- **5G** (typical mobile)
- **4G LTE** (slower mobile)
- **3G** (worst case - use developer throttling)

## Test Checklist

### A. Initial Load Performance

#### Baseball Homepage (/)
```
□ First Contentful Paint < 1.5s (WiFi)
□ First Contentful Paint < 3.0s (4G)
□ Time to Interactive < 3.0s (WiFi)
□ Total page size < 250KB (uncompressed)
□ JavaScript bundle loads without errors
□ No console errors in Web Inspector
□ Favicon loads correctly
□ Meta tags render properly (check Share preview)
```

#### Football Page (/football)
```
□ First Contentful Paint < 1.5s (WiFi)
□ Navigation from baseball → football < 1.0s
□ Shared vendor bundle cached (no re-download)
□ Sport-specific bundle < 10KB
□ No layout shifts during load
□ All images load and display correctly
```

### B. Viewport & Layout

#### Portrait Mode (Primary)
```
□ Content fits within viewport width (no horizontal scroll)
□ All text readable without zooming (minimum 16px body)
□ Header fits within viewport (logo + nav visible)
□ Footer properly aligned and accessible
□ Cards/sections properly sized and spaced
□ No content cut off at screen edges
□ Safe area insets respected (notch/Dynamic Island)
```

#### Landscape Mode (Secondary)
```
□ Layout adapts to landscape orientation
□ Content remains readable
□ Navigation accessible
□ No overlapping elements
□ Scroll behavior functions correctly
```

### C. SportSwitcher FAB

#### Positioning & Accessibility
```
□ FAB visible in bottom-right corner
□ FAB positioned in thumb-zone (24px from edges)
□ FAB size 48px × 48px (minimum touch target)
□ FAB z-index 1000 (above all other content)
□ FAB doesn't obscure critical content
□ FAB shadow/gradient renders correctly
```

#### Interaction
```
□ Single tap opens sport menu
□ Menu slides up with smooth animation
□ Menu items have 48px minimum height
□ Sport icons (⚾ 🏈) render correctly
□ Current sport button disabled/visually distinct
□ Tap outside menu closes it
□ Close button (✕) works correctly
□ No accidental taps on nearby content
```

#### Navigation
```
□ Tap "Baseball" navigates to /
□ Tap "Football" navigates to /football
□ Navigation completes within 500ms
□ Page transition smooth (no flash)
□ Scroll position resets to top after navigation
□ Browser back button works after navigation
```

### D. Seasonal Routing

#### Root Path Behavior (/)
```
□ October visit redirects to /football (current month)
□ Redirect happens before content loads (no flash)
□ Redirect uses 302 (temporary) not 301
□ Address bar updates to show /football
```

#### Query Parameter Overrides
```
□ /?sport=baseball stays on baseball page
□ /?sport=football redirects to /football
□ Cookie set with 30-day expiration
□ Cookie includes Path=/, SameSite=Lax
□ Cookie preference persists across sessions
□ Clear cookies resets to seasonal default
```

#### Cookie Persistence
```
□ Set ?sport=baseball → cookie stored
□ Close Safari completely
□ Reopen blazesportsintel.com/
□ Still shows baseball (cookie honored)
□ Cookie expires after 30 days
```

### E. Typography & Readability

#### Font Rendering
```
□ Body text minimum 16px (1rem)
□ Headings properly sized (h1: 2rem+, h2: 1.5rem+)
□ Line height sufficient for readability (1.5+)
□ Letter spacing appropriate
□ Font weight renders correctly (not too thin)
□ System fonts render properly (-apple-system)
```

#### Text Content
```
□ All text readable without zoom
□ No text overflow or cut-off
□ Paragraphs width < 75 characters
□ Links clearly distinguishable
□ Color contrast meets WCAG AA (4.5:1)
```

### F. Touch Interactions

#### Tap Targets
```
□ All buttons minimum 48px × 48px
□ Links have sufficient padding
□ Form inputs easily tappable
□ No accidental taps on adjacent elements
□ Active states visible on tap
□ Hover states translate to tap feedback
```

#### Gestures
```
□ Vertical scroll smooth and responsive
□ Horizontal scroll disabled (no accidental swipes)
□ Pull-to-refresh works in Safari
□ Pinch-to-zoom disabled (meta viewport prevents)
□ Double-tap zoom disabled
□ Text selection works correctly
```

### G. Forms & Inputs (If Applicable)

#### Input Fields
```
□ Input fields large enough to tap
□ Keyboard opens without layout shift
□ Input type triggers correct keyboard (email, tel, etc.)
□ Autocomplete/autofill works
□ Focus states clearly visible
□ Placeholder text readable
□ Required field indicators visible
```

#### Buttons & CTAs
```
□ Primary buttons clearly distinguishable
□ Loading states visible during submission
□ Error states clearly displayed
□ Success confirmations visible
□ Cancel/back buttons easily accessible
```

### H. Images & Media

#### Image Loading
```
□ All images load within 2 seconds
□ Lazy loading works correctly
□ No layout shift as images load
□ Alt text present for accessibility
□ Image dimensions set (width/height)
□ Responsive images serve appropriate sizes
□ Retina images load on 3x displays
```

#### Performance
```
□ Images compressed (WebP with JPEG fallback)
□ Total image payload < 1MB
□ Progressive loading implemented
□ No blocking image loads
```

### I. Animation & Transitions

#### Sport Switcher Animations
```
□ FAB hover effect on tap (scale/shadow)
□ Menu slide-up animation smooth (60fps)
□ Menu items stagger correctly
□ Close animation smooth (no jank)
□ Transition timing feels natural (300ms cubic-bezier)
```

#### Page Transitions
```
□ Navigation transitions smooth
□ No flash of unstyled content (FOUC)
□ Loading indicators appear for slow loads
□ Skeleton screens display properly
```

#### Reduced Motion
```
Enable Settings → Accessibility → Motion → Reduce Motion:
□ Animations disabled or simplified
□ Transitions instant or minimal
□ No vestibular triggers
□ Functionality still works without animations
```

### J. Network Resilience

#### Offline Behavior
```
□ Offline message displayed when no connection
□ Cached content available offline
□ Service Worker registers (if implemented)
□ Graceful degradation without JavaScript
```

#### Slow Connection (4G/3G)
```
□ Content progressively loads
□ Critical content prioritized
□ Loading indicators shown
□ Timeouts handled gracefully
□ No infinite loading states
```

#### Connection Interruption
```
□ Resume loading when connection restored
□ Retry failed requests automatically
□ User notified of connection issues
□ Form data preserved during interruption
```

### K. Safari-Specific Features

#### iOS Safari Features
```
□ Add to Home Screen works
□ App icon displays correctly (180px)
□ Splash screen shows on launch (if PWA)
□ Status bar color correct (meta theme-color)
□ Safe area insets respected (env(safe-area-inset-*))
□ Pull-to-refresh doesn't break layout
```

#### Share Menu
```
□ Share button works (if present)
□ Preview image loads (og:image)
□ Title and description correct (og:title, og:description)
□ URL canonical (no tracking params)
```

### L. Accessibility

#### VoiceOver Testing
```
Enable Settings → Accessibility → VoiceOver:
□ All interactive elements announced
□ Proper heading hierarchy (h1 → h2 → h3)
□ ARIA labels present where needed
□ Focus order logical
□ Images have meaningful alt text
□ Form labels associated with inputs
□ Error messages announced
□ Dynamic content updates announced
```

#### Text Scaling
```
Settings → Display & Brightness → Text Size → Larger Text:
□ Text scales up to 200% without breaking layout
□ No text overflow or cut-off
□ Touch targets remain accessible
□ Layout adapts to larger text
```

### M. Cross-Page Consistency

#### Navigation Between Sports
```
□ Baseball → Football navigation smooth
□ Football → Baseball navigation smooth
□ Browser back button works correctly
□ Forward button works correctly
□ URL updates reflect current sport
□ Page title updates correctly
□ Scroll position resets appropriately
```

#### Shared Components
```
□ Header consistent across pages
□ Footer consistent across pages
□ SportSwitcher FAB consistent position
□ Color scheme consistent
□ Typography consistent
□ Spacing/padding consistent
```

### N. Edge Cases

#### Unusual Conditions
```
□ Very slow connection (< 1 Mbps)
□ Intermittent connection drops
□ Very small screen (iPhone SE - 375px wide)
□ Very large text size (200% zoom)
□ Dark mode (if supported)
□ Low Power Mode enabled
□ Low Data Mode enabled
□ Content Blockers enabled (Safari Extensions)
```

#### Browser Quirks
```
□ Private Browsing mode works
□ Cookies blocked scenario
□ JavaScript disabled (graceful degradation)
□ CSS not loading scenario
□ Mixed content warnings (none expected)
```

## Performance Benchmarks

### Target Metrics (WiFi)
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.0s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### Target Metrics (4G)
- **First Contentful Paint**: < 3.0s
- **Largest Contentful Paint**: < 4.0s
- **Time to Interactive**: < 5.0s

### Bundle Size Targets
- **Vendor bundle** (shared): < 100KB gzipped
- **Baseball bundle**: < 10KB gzipped
- **Football bundle**: < 10KB gzipped
- **Total first load**: < 120KB gzipped

## Testing Tools

### Safari Web Inspector
```
iPhone → Settings → Safari → Advanced → Web Inspector → ON
Mac → Safari → Develop → [iPhone] → [Page]
```

**Use for**:
- Console errors
- Network timing
- DOM inspection
- JavaScript debugging

### Xcode Simulator (Backup)
```
Xcode → Open Developer Tool → Simulator
```

**Note**: Simulator doesn't match real device performance. Always test on physical devices for final validation.

### Lighthouse CI (Desktop Testing)
```bash
npm install -g @lhci/cli
lhci autorun --collect.url=https://blazesportsintel.com/
```

**Note**: Mobile Lighthouse scores from desktop are estimates. Use physical devices for true mobile testing.

## Bug Reporting

### Issue Template
See: `docs/MOBILE-BUG-TEMPLATE.md`

### Critical Issues
Report immediately if:
- Content completely inaccessible on mobile
- Horizontal scrolling required
- Touch targets < 44px
- Text unreadable without zooming
- Navigation completely broken
- JavaScript errors block functionality

### Priority Levels
1. **P0 (Blocker)**: Prevents core functionality
2. **P1 (Critical)**: Major usability issue affecting >50% users
3. **P2 (High)**: Significant issue affecting specific workflows
4. **P3 (Medium)**: Minor visual/UX issue
5. **P4 (Low)**: Enhancement or edge case

## Test Schedule

### Pre-Release Testing
- **Every PR merge**: Spot check on one device
- **Before production deploy**: Full test suite on all devices
- **After production deploy**: Smoke test critical paths

### Regular Testing
- **Weekly**: Regression test on primary device (iPhone 14 Pro)
- **Monthly**: Full test suite on all devices
- **After iOS updates**: Compatibility verification

## Sign-Off Checklist

Before marking mobile testing complete:

```
□ All test categories completed
□ All P0/P1 issues resolved
□ All P2 issues documented
□ Performance benchmarks met
□ Accessibility requirements met
□ Cross-device consistency verified
□ Network resilience confirmed
□ Safari-specific features working
□ Documentation updated
□ Screenshots/videos captured for reference
```

---

**Testing Lead**: Austin Humphrey
**Last Updated**: October 16, 2025
**Document Version**: 1.0.0
