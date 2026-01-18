# Three.js Ember System - Risk Register

**Last Updated:** 2025-12-27
**Review Cadence:** Before each phase gate

---

## Risk Matrix Legend

| Severity | Impact | Likelihood | Score |
| -------- | ------ | ---------- | ----- |
| Critical | 5      | 5          | 25    |
| High     | 4      | 4          | 16    |
| Medium   | 3      | 3          | 9     |
| Low      | 2      | 2          | 4     |
| Minimal  | 1      | 1          | 1     |

**Risk Score = Impact x Likelihood**

---

## RISK-001: Bundle Size Impact on Performance

| Attribute      | Value         |
| -------------- | ------------- |
| **Category**   | Performance   |
| **Impact**     | 4 (High)      |
| **Likelihood** | 4 (High)      |
| **Risk Score** | 16 (HIGH)     |
| **Owner**      | Frontend Lead |

### Description

Three.js core (~500KB minified, ~150KB gzipped) plus @react-three/fiber (~80KB) and @react-three/drei (~50KB) significantly increase initial bundle size, potentially degrading Lighthouse scores and Time to Interactive (TTI).

### Current State

- Dependencies installed but not loaded in production build
- Production site loads without Three.js overhead

### Mitigation Strategies

| Strategy                                  | Effort | Effectiveness | Confidence |
| ----------------------------------------- | ------ | ------------- | ---------- |
| Dynamic import with `ssr: false`          | Low    | High          | 90%        |
| Separate chunk via Next.js code splitting | Low    | High          | 85%        |
| Lazy load on viewport intersection        | Medium | Very High     | 95%        |
| Preload hint for fast connections         | Low    | Medium        | 70%        |

### Recommended Approach

```typescript
// Already implemented in HeroEmbers.tsx
const Canvas = dynamic(() => import('@react-three/fiber').then((mod) => mod.Canvas), {
  ssr: false,
});
```

### Acceptance Criteria

- LCP remains < 2.5s on 3G connection
- Initial JS bundle < 150KB (excluding Three.js chunk)
- Three.js chunk loads within 3s on first paint

### Monitoring

- Lighthouse CI in GitHub Actions
- Real User Monitoring (RUM) via Cloudflare Analytics
- Bundle analyzer reports on each PR

---

## RISK-002: Mobile Device Performance Degradation

| Attribute      | Value            |
| -------------- | ---------------- |
| **Category**   | Performance / UX |
| **Impact**     | 5 (Critical)     |
| **Likelihood** | 4 (High)         |
| **Risk Score** | 20 (CRITICAL)    |
| **Owner**      | Frontend Lead    |

### Description

WebGL rendering on mobile devices can cause:

- Battery drain (GPU acceleration)
- Device heating
- Frame drops / jank
- Memory pressure leading to tab crashes

### Current State

- Performance tier detection implemented
- CSS fallback exists for `tier=low`
- Mobile detection via User-Agent

### Mitigation Strategies

| Strategy                                  | Effort | Effectiveness | Confidence |
| ----------------------------------------- | ------ | ------------- | ---------- |
| Aggressive mobile fallback to CSS         | Low    | Very High     | 95%        |
| Reduce particle count on mobile (100 max) | Low    | High          | 85%        |
| Cap frame rate to 30fps on mobile         | Medium | High          | 80%        |
| Disable on battery saver mode             | Medium | Medium        | 70%        |

### Recommended Approach

```typescript
// Enhanced mobile detection
if (isMobile) {
  // Always use CSS fallback on mobile for v1
  return 'low';
}
```

### Acceptance Criteria

- Mobile devices ALWAYS render CSS fallback in Phase 1
- No user-reported heating issues
- Battery consumption comparable to CSS-only version

### Monitoring

- Device-specific performance telemetry
- User feedback collection
- A/B test mobile engagement metrics

---

## RISK-003: Memory Leaks from Improper Disposal

| Attribute      | Value            |
| -------------- | ---------------- |
| **Category**   | Stability        |
| **Impact**     | 4 (High)         |
| **Likelihood** | 3 (Medium)       |
| **Risk Score** | 12 (MEDIUM-HIGH) |
| **Owner**      | Frontend Lead    |

### Description

Three.js objects (geometries, materials, textures) must be explicitly disposed to free GPU memory. The current implementation creates objects in `useMemo` and `useEffect` without corresponding cleanup.

### Current State

```typescript
// PROBLEM: No cleanup in current code
const particles = useMemo(() => {
  const temp = new THREE.Object3D();
  // Creates Matrix4 and Vector3 objects
}, [count, THREE]);
```

### Mitigation Strategies

| Strategy                           | Effort | Effectiveness           | Confidence |
| ---------------------------------- | ------ | ----------------------- | ---------- |
| Add cleanup in useEffect return    | Low    | Very High               | 95%        |
| Use @react-three/drei's useDispose | Low    | High                    | 85%        |
| Pool and reuse objects             | Medium | Very High               | 90%        |
| Monitor memory in DevTools         | Low    | Medium (detection only) | 90%        |

### Recommended Fix

```typescript
useEffect(() => {
  // Setup code...

  return () => {
    if (meshRef.current) {
      meshRef.current.geometry.dispose();
      if (meshRef.current.material instanceof THREE.Material) {
        meshRef.current.material.dispose();
      }
    }
  };
}, []);
```

### Acceptance Criteria

- Memory usage stable over 10-minute session
- No memory growth on repeated navigation
- DevTools Memory snapshot shows no retained Three.js objects after unmount

### Monitoring

- Periodic memory snapshots in E2E tests
- Sentry for crash reports
- User-reported "tab crashed" incidents

---

## RISK-004: WebGL Compatibility Issues

| Attribute      | Value          |
| -------------- | -------------- |
| **Category**   | Compatibility  |
| **Impact**     | 3 (Medium)     |
| **Likelihood** | 2 (Low)        |
| **Risk Score** | 6 (LOW-MEDIUM) |
| **Owner**      | Frontend Lead  |

### Description

WebGL support varies across browsers and devices:

- Safari/iOS has WebGL quirks
- Older Android devices may have limited WebGL support
- Corporate proxies/VPNs may block WebGL
- WebGL 2 not universally supported

### Current State

- Code checks for WebGL context availability
- Fallback to CSS on WebGL failure

### Browser Support Matrix (2025)

| Browser          | WebGL 1 | WebGL 2 | Notes                           |
| ---------------- | ------- | ------- | ------------------------------- |
| Chrome 120+      | 98%     | 95%     | Full support                    |
| Safari 17+       | 95%     | 90%     | iOS has power management quirks |
| Firefox 120+     | 98%     | 95%     | Full support                    |
| Edge 120+        | 98%     | 95%     | Chromium-based                  |
| Samsung Internet | 90%     | 80%     | Android variants                |

### Mitigation Strategies

| Strategy                          | Effort       | Effectiveness | Confidence |
| --------------------------------- | ------------ | ------------- | ---------- |
| WebGL detection before rendering  | Low          | High          | 90%        |
| WebGL 1 fallback from WebGL 2     | Low          | Medium        | 75%        |
| Error boundary for WebGL failures | Low          | High          | 95%        |
| CSS fallback as ultimate backstop | Already done | Very High     | 98%        |

### Recommended Approach

```typescript
try {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) throw new Error('WebGL not supported');
} catch {
  return 'low'; // CSS fallback
}
```

### Acceptance Criteria

- Works on Chrome, Safari, Firefox latest
- Graceful fallback on unsupported browsers
- No console errors on fallback path

---

## RISK-005: SSR Hydration Mismatches

| Attribute      | Value         |
| -------------- | ------------- |
| **Category**   | Stability     |
| **Impact**     | 3 (Medium)    |
| **Likelihood** | 3 (Medium)    |
| **Risk Score** | 9 (MEDIUM)    |
| **Owner**      | Frontend Lead |

### Description

Three.js cannot render on the server. If components attempt to access `window` or WebGL during SSR, React hydration will fail with console errors or visual glitches.

### Current State

- `ssr: false` used in dynamic imports
- `useEffect` guards for client-only code
- Initial state defaults to `tier: 'low'` (CSS fallback)

### Mitigation Strategies

| Strategy                                | Effort       | Effectiveness | Confidence |
| --------------------------------------- | ------------ | ------------- | ---------- |
| Dynamic import with ssr: false          | Already done | Very High     | 95%        |
| useEffect for tier detection            | Already done | High          | 90%        |
| Suppress hydration warnings selectively | Low          | Medium        | 70%        |
| E2E tests for hydration errors          | Medium       | High          | 85%        |

### Acceptance Criteria

- No React hydration warnings in console
- Server render matches initial client render
- No flash of incorrect content

---

## RISK-006: Production Rollback Complexity

| Attribute      | Value                  |
| -------------- | ---------------------- |
| **Category**   | Operations             |
| **Impact**     | 4 (High)               |
| **Likelihood** | 2 (Low)                |
| **Risk Score** | 8 (MEDIUM)             |
| **Owner**      | DevOps / Frontend Lead |

### Description

If Three.js causes issues in production, we need a fast rollback mechanism that doesn't require a full redeploy.

### Current State

- No feature flag system
- Rollback requires code change and deploy

### Mitigation Strategies

| Strategy                          | Effort | Effectiveness      | Confidence |
| --------------------------------- | ------ | ------------------ | ---------- |
| Environment variable feature flag | Low    | High               | 90%        |
| Cloudflare KV feature flag        | Medium | Very High          | 95%        |
| Client-side localStorage override | Low    | Medium (debugging) | 80%        |
| Git revert and redeploy           | Low    | High (but slow)    | 95%        |

### Recommended Approach

```typescript
// Environment-based feature flag
const ENABLE_THREE_JS = process.env.NEXT_PUBLIC_ENABLE_THREE_JS === 'true';

// In component
if (!ENABLE_THREE_JS) {
  return <CSSFallback />;
}
```

### Acceptance Criteria

- Can disable Three.js within 5 minutes
- No code deploy required for emergency disable
- Feature flag checked before any Three.js import

---

## RISK-007: Animation Frame Budget Exceeded

| Attribute      | Value         |
| -------------- | ------------- |
| **Category**   | Performance   |
| **Impact**     | 3 (Medium)    |
| **Likelihood** | 3 (Medium)    |
| **Risk Score** | 9 (MEDIUM)    |
| **Owner**      | Frontend Lead |

### Description

The `useFrame` loop runs every animation frame (~16.67ms at 60fps). If particle updates exceed budget, frames will drop causing visible jank.

### Current State

```typescript
// Current implementation in useFrame
for (let i = 0; i < count; i++) {
  mesh.getMatrixAt(i, temp.matrix);
  temp.matrix.decompose(temp.position, temp.quaternion, temp.scale);
  // ... updates
  temp.updateMatrix();
  mesh.setMatrixAt(i, temp.matrix);
}
```

### Performance Budget

- 60fps target = 16.67ms per frame
- Animation budget = 4ms (leaving room for React, layout, paint)
- 400 particles @ 4ms = 10 microseconds per particle

### Mitigation Strategies

| Strategy                                        | Effort | Effectiveness | Confidence |
| ----------------------------------------------- | ------ | ------------- | ---------- |
| Reduce particle count                           | Low    | High          | 90%        |
| Skip frames (update every 2nd frame)            | Low    | Medium        | 75%        |
| GPU-based animation via shaders                 | High   | Very High     | 85%        |
| Use delta-based updates (framerate independent) | Low    | Medium        | 80%        |

### Recommended Quick Win

```typescript
// Reduce update frequency on lower tiers
useFrame((state, delta) => {
  frameCount.current++;
  if (tier === 'medium' && frameCount.current % 2 !== 0) return;
  // ... rest of animation
});
```

### Acceptance Criteria

- Maintain 60fps on high-tier devices
- Maintain 30fps on medium-tier devices
- No visible jank during scrolling

---

## Summary Risk Matrix

| Risk ID  | Risk Name          | Score | Status      | Phase to Address |
| -------- | ------------------ | ----- | ----------- | ---------------- |
| RISK-002 | Mobile Performance | 20    | CRITICAL    | Phase 0          |
| RISK-001 | Bundle Size        | 16    | HIGH        | Phase 0          |
| RISK-003 | Memory Leaks       | 12    | MEDIUM-HIGH | Phase 0          |
| RISK-005 | SSR Hydration      | 9     | MEDIUM      | Phase 0          |
| RISK-007 | Frame Budget       | 9     | MEDIUM      | Phase 1          |
| RISK-006 | Rollback           | 8     | MEDIUM      | Phase 0          |
| RISK-004 | WebGL Compat       | 6     | LOW-MEDIUM  | Phase 1          |

---

## Risk Acceptance Threshold

**GO Criteria for Phase 1 Deployment:**

- All CRITICAL risks mitigated to MEDIUM or below
- All HIGH risks have documented mitigation in place
- Feature flag operational and tested
- Rollback procedure validated

**NO-GO Triggers:**

- Any unmitigated CRITICAL risk
- Memory leak detected in testing
- LCP > 3s on 3G connection
- Mobile crash rate > 0.1%
