# Three.js Ember System - Phased Implementation Plan

**Version:** 1.0
**Date:** 2025-12-27
**Approval Required:** Yes - before each phase gate

---

## Phase Overview

```
Phase 0: Safety Rails (1 week)
    |
    +-- [GO/NO-GO Gate 0]
    |
Phase 1: Canary Deployment (1 week)
    |
    +-- [GO/NO-GO Gate 1]
    |
Phase 2: Gradual Rollout (2 weeks)
    |
    +-- [GO/NO-GO Gate 2]
    |
Phase 3: Full Production (ongoing)
```

---

## Phase 0: Safety Rails

**Duration:** 1 week
**Goal:** Add all safety mechanisms before any production exposure

### Deliverables

#### 0.1 Feature Flag System

**File:** `lib/feature-flags.ts`

```typescript
export const FEATURE_FLAGS = {
  THREE_JS_ENABLED: process.env.NEXT_PUBLIC_THREE_JS_ENABLED === 'true',
  THREE_JS_PERCENTAGE: parseInt(process.env.NEXT_PUBLIC_THREE_JS_PERCENTAGE || '0', 10),
};

export function isThreeJSEnabled(userId?: string): boolean {
  if (!FEATURE_FLAGS.THREE_JS_ENABLED) return false;
  if (FEATURE_FLAGS.THREE_JS_PERCENTAGE === 100) return true;
  if (!userId) return false;

  // Consistent bucketing based on user ID
  const hash = hashCode(userId);
  return hash % 100 < FEATURE_FLAGS.THREE_JS_PERCENTAGE;
}
```

**Environment Variables:**

```env
NEXT_PUBLIC_THREE_JS_ENABLED=false
NEXT_PUBLIC_THREE_JS_PERCENTAGE=0
```

#### 0.2 Error Boundary

**File:** `components/three/ThreeErrorBoundary.tsx`

```typescript
'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { CSSFallback } from './HeroEmbers';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ThreeErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring service
    console.error('[Three.js Error]', error, errorInfo);

    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'three_js_error', {
        error_message: error.message,
        component_stack: errorInfo.componentStack,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <CSSFallback reducedMotion={false} />;
    }
    return this.props.children;
  }
}
```

#### 0.3 Memory Cleanup

**Updates to:** `components/three/HeroEmbers.tsx`

```typescript
// Add cleanup effect
useEffect(() => {
  return () => {
    // Dispose geometry and materials on unmount
    if (meshRef.current) {
      meshRef.current.geometry?.dispose();
      const material = meshRef.current.material;
      if (Array.isArray(material)) {
        material.forEach((m) => m.dispose());
      } else if (material) {
        material.dispose();
      }
    }
  };
}, []);
```

#### 0.4 Performance Monitoring Hook

**File:** `components/three/usePerformanceMonitor.ts`

```typescript
import { useRef, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  avgFps: number;
  minFps: number;
  frameDrops: number;
  memoryUsage?: number;
}

export function usePerformanceMonitor(sampleWindow = 60) {
  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const metricsRef = useRef<PerformanceMetrics>({
    avgFps: 60,
    minFps: 60,
    frameDrops: 0,
  });

  const recordFrame = useCallback(() => {
    const now = performance.now();
    const delta = now - lastTimeRef.current;
    lastTimeRef.current = now;

    const fps = 1000 / delta;
    frameTimesRef.current.push(fps);

    if (frameTimesRef.current.length > sampleWindow) {
      frameTimesRef.current.shift();
    }

    const frames = frameTimesRef.current;
    metricsRef.current = {
      avgFps: frames.reduce((a, b) => a + b, 0) / frames.length,
      minFps: Math.min(...frames),
      frameDrops: frames.filter((f) => f < 30).length,
      memoryUsage: (performance as any).memory?.usedJSHeapSize,
    };

    // Degrade quality if performance is poor
    if (metricsRef.current.avgFps < 30) {
      console.warn('[Three.js] Poor performance detected, consider fallback');
    }
  }, [sampleWindow]);

  const getMetrics = useCallback(() => metricsRef.current, []);

  return { recordFrame, getMetrics };
}
```

#### 0.5 Mobile Hardening

**Updates to:** `components/three/usePerformanceTier.ts`

```typescript
function detectTier(): PerformanceTier {
  if (typeof window === 'undefined') return 'low';

  // PHASE 0: Always CSS fallback on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  if (isMobile) {
    console.log('[Three.js] Mobile detected, using CSS fallback');
    return 'low';
  }

  // ... rest of detection logic
}
```

### Phase 0 Tests

| Test                                         | Type   | Pass Criteria                    |
| -------------------------------------------- | ------ | -------------------------------- |
| Feature flag toggles rendering               | Unit   | Flag false = no Three.js imports |
| Error boundary catches WebGL errors          | Unit   | Fallback renders on error        |
| Memory stable after 100 mount/unmount cycles | E2E    | Memory growth < 10MB             |
| SSR produces no hydration errors             | E2E    | No console errors                |
| CSS fallback visually acceptable             | Visual | Screenshot comparison passes     |

### Phase 0 GO/NO-GO Checklist

- [ ] Feature flag system deployed and tested
- [ ] Error boundary wrapping all Three.js components
- [ ] Memory cleanup verified in DevTools
- [ ] Mobile always gets CSS fallback
- [ ] All CRITICAL risks mitigated
- [ ] Rollback tested (set flag false, verify CSS)

---

## Phase 1: Canary Deployment

**Duration:** 1 week
**Goal:** Validate in production with minimal blast radius

### Configuration

```env
NEXT_PUBLIC_THREE_JS_ENABLED=true
NEXT_PUBLIC_THREE_JS_PERCENTAGE=5
```

Only 5% of users (desktop only) see Three.js.

### Monitoring Dashboard

Create Cloudflare Analytics dashboard with:

- Three.js load rate
- Error rate by component
- FPS distribution
- Memory consumption
- User engagement (time on page, scroll depth)

### Alerting Thresholds

| Metric        | Warning    | Critical    | Action                     |
| ------------- | ---------- | ----------- | -------------------------- |
| Error Rate    | > 0.5%     | > 1%        | Investigate / Disable      |
| Avg FPS       | < 45       | < 30        | Reduce particles / Disable |
| Memory Growth | > 50MB/min | > 100MB/min | Investigate memory leak    |
| LCP           | > 2.5s     | > 3.5s      | Review bundle splitting    |

### A/B Test Metrics

| Metric         | Control (CSS) | Experiment (Three.js) | Significance |
| -------------- | ------------- | --------------------- | ------------ |
| Bounce Rate    | Baseline      | Measure               | p < 0.05     |
| Time on Page   | Baseline      | Measure               | p < 0.05     |
| Scroll Depth   | Baseline      | Measure               | p < 0.05     |
| CTA Click Rate | Baseline      | Measure               | p < 0.05     |

### Phase 1 GO/NO-GO Checklist

- [ ] 7 days of canary with no critical alerts
- [ ] Error rate < 0.5%
- [ ] Avg FPS > 45 on desktop
- [ ] No user-reported issues
- [ ] A/B metrics neutral or positive
- [ ] Memory stable over 24-hour period

---

## Phase 2: Gradual Rollout

**Duration:** 2 weeks
**Goal:** Expand to majority of desktop users

### Rollout Schedule

| Day   | Percentage     | Criteria to Proceed         |
| ----- | -------------- | --------------------------- |
| 1-3   | 10%            | Error rate < 0.5%           |
| 4-6   | 25%            | Error rate < 0.5%, FPS > 45 |
| 7-9   | 50%            | All metrics stable          |
| 10-12 | 75%            | All metrics stable          |
| 13-14 | 100% (desktop) | All metrics stable          |

### Rollback Triggers

**Immediate Rollback to 0%:**

- Error rate > 2%
- Any crash reports
- Memory leak confirmed

**Pause and Investigate:**

- Error rate 1-2%
- FPS drops below 40
- User complaints

### Phase 2 GO/NO-GO Checklist

- [ ] 14 days at 100% desktop with no issues
- [ ] Performance metrics meet targets
- [ ] No user complaints
- [ ] Memory usage stable
- [ ] Bundle size impact acceptable

---

## Phase 3: Full Production + Mobile Consideration

**Duration:** Ongoing
**Goal:** Maintain stability, consider mobile enablement

### Desktop Maintenance

- Continue monitoring all metrics
- Quarterly performance review
- Update Three.js dependencies as needed

### Mobile Evaluation Criteria

Mobile Three.js will be considered when:

- [ ] Desktop stable for 90+ days
- [ ] WebGPU adoption > 50% on mobile
- [ ] Battery-aware rendering implemented
- [ ] Frame limiting (30fps cap) tested
- [ ] User demand validated

### Mobile Tiers (Future)

| Device Tier | Criteria                      | Rendering                       |
| ----------- | ----------------------------- | ------------------------------- |
| Low         | deviceMemory < 4GB, cores < 4 | CSS only                        |
| Medium      | deviceMemory 4-6GB, cores 4-6 | Three.js @ 50 particles, 30fps  |
| High        | deviceMemory > 6GB, cores > 6 | Three.js @ 100 particles, 60fps |

---

## Rollback Procedures

### Emergency Rollback (< 5 minutes)

1. **Cloudflare Dashboard:**
   - Navigate to Pages > blazesportsintel > Settings > Environment Variables
   - Set `NEXT_PUBLIC_THREE_JS_ENABLED` to `false`
   - Trigger rebuild or wait for next deploy

2. **CLI Alternative:**
   ```bash
   # Update .env.production
   echo "NEXT_PUBLIC_THREE_JS_ENABLED=false" >> .env.production
   npm run deploy:production
   ```

### Standard Rollback (< 30 minutes)

1. Identify commit hash of last known good state
2. Create rollback PR
3. Deploy via standard CI/CD

### Verification Post-Rollback

1. Check production site renders CSS fallback
2. Verify no Three.js chunks in network requests
3. Confirm console has no WebGL errors
4. Monitor metrics return to baseline

---

## Testing Strategy

### Unit Tests

| Test                       | File                          | Coverage       |
| -------------------------- | ----------------------------- | -------------- |
| Performance tier detection | `usePerformanceTier.test.ts`  | All tiers      |
| Feature flag logic         | `feature-flags.test.ts`       | All branches   |
| Error boundary             | `ThreeErrorBoundary.test.tsx` | Error catching |

### Integration Tests

| Test                        | Tool                  | Coverage                  |
| --------------------------- | --------------------- | ------------------------- |
| Three.js renders on desktop | Playwright            | Chrome, Firefox, Safari   |
| CSS fallback on mobile      | Playwright            | iPhone, Android emulation |
| Memory stability            | Playwright + DevTools | 10-minute session         |

### Visual Regression Tests

| Test                       | Tool                   | Coverage          |
| -------------------------- | ---------------------- | ----------------- |
| Hero appearance (Three.js) | Playwright Screenshots | Desktop viewports |
| Hero appearance (CSS)      | Playwright Screenshots | Mobile viewports  |
| Reduced motion             | Playwright Screenshots | Static fallback   |

### Performance Tests

| Test        | Tool                    | Threshold                |
| ----------- | ----------------------- | ------------------------ |
| LCP         | Lighthouse CI           | < 2.5s                   |
| Bundle size | webpack-bundle-analyzer | < 180KB (Three.js chunk) |
| FPS         | Custom monitor          | > 45fps avg              |
| Memory      | Chrome DevTools         | No growth over time      |

---

## Appendix: File Changes Summary

### New Files

| File                                        | Purpose                 |
| ------------------------------------------- | ----------------------- |
| `lib/feature-flags.ts`                      | Feature flag management |
| `components/three/ThreeErrorBoundary.tsx`   | Error handling          |
| `components/three/usePerformanceMonitor.ts` | FPS/memory tracking     |

### Modified Files

| File                                     | Changes                                   |
| ---------------------------------------- | ----------------------------------------- |
| `components/three/HeroEmbers.tsx`        | Add cleanup, error boundary, feature flag |
| `components/three/usePerformanceTier.ts` | Harden mobile detection                   |
| `components/hero/HeroSection.tsx`        | Wrap with error boundary                  |
| `.env.production`                        | Add feature flag variables                |

### No Changes Needed

| File                                     | Reason                       |
| ---------------------------------------- | ---------------------------- |
| `components/three/ThreeCanvas.tsx`       | Already has proper structure |
| `components/three/index.ts`              | Export organization correct  |
| `components/hero/HeroSectionWrapper.tsx` | SSR handling correct         |

---

## Sign-Off

| Role             | Name | Date | Signature |
| ---------------- | ---- | ---- | --------- |
| Engineering Lead |      |      |           |
| Frontend Lead    |      |      |           |
| Product Owner    |      |      |           |
