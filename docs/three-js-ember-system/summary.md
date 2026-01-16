# Three.js Ember Particle System - Engineering Assessment

**Date:** 2025-12-27
**Author:** Staff Engineering Review
**Confidence Level:** 85%

---

## Executive Summary

The BSI codebase contains a **complete Three.js ember particle system implementation** that is NOT currently deployed to production. The components exist in the repository (`components/three/`) but the production site at blazesportsintel.com uses only CSS styling without WebGL rendering.

### Current State Assessment

| Component             | Status                    | Location                                  |
| --------------------- | ------------------------- | ----------------------------------------- |
| HeroEmbers.tsx        | Implemented, not deployed | `/components/three/HeroEmbers.tsx`        |
| ThreeCanvas.tsx       | Implemented, not deployed | `/components/three/ThreeCanvas.tsx`       |
| usePerformanceTier.ts | Implemented, not deployed | `/components/three/usePerformanceTier.ts` |
| Production Site       | CSS-only rendering        | blazesportsintel.com                      |

### Dependencies Installed

```json
{
  "three": "^0.170.0",
  "@react-three/fiber": "^9.0.0",
  "@react-three/drei": "^10.0.0"
}
```

**Estimated combined bundle size:** ~180KB gzipped (three.js core + r3f + drei)

---

## Key Decisions Required

1. **Deploy existing implementation** vs **Rewrite with optimizations**
2. **Feature flag strategy** for gradual rollout
3. **Mobile threshold** - At what performance tier do we fallback to CSS?
4. **Bundle splitting approach** - Dynamic import vs separate chunk

---

## Architecture Overview

The existing implementation follows a sound architecture:

```
HeroSectionWrapper (Server Component)
    |
    +-- HeroSection (Client, ssr: false)
            |
            +-- HeroEmbers (Performance-tier aware)
                    |
                    +-- [tier=low]  -> CSSFallback (static gradient)
                    +-- [tier=medium] -> Three.js @ 200 particles, DPR 1.5
                    +-- [tier=high]   -> Three.js @ 400 particles, DPR 2
```

### Strengths of Current Implementation

1. **Performance tier detection** - Uses deviceMemory, hardwareConcurrency, WebGL renderer detection
2. **CSS fallback** - Graceful degradation for low-end devices
3. **Reduced motion respect** - Honors prefers-reduced-motion
4. **Dynamic import** - Canvas component lazy-loaded
5. **Instanced rendering** - Efficient for many particles

### Gaps Identified

1. **No feature flag** - Cannot disable remotely
2. **No performance monitoring** - No FPS/memory metrics collection
3. **No error boundary** - WebGL failures could crash the page
4. **Memory leak potential** - Missing cleanup in useFrame loop
5. **Missing dispose calls** - Geometry/material not disposed on unmount

---

## Assumptions

1. Target audience includes mobile users (60%+ traffic estimate based on sports app patterns)
2. Cloudflare Pages handles asset caching/CDN efficiently
3. Next.js 16 dynamic imports work correctly with Three.js
4. Safari/iOS WebGL support is adequate for the tier=medium experience

---

## Tradeoffs Analysis

### Option A: Deploy As-Is with Minimal Changes

- **Pros:** Fastest to market, code exists
- **Cons:** Risk of memory leaks, no monitoring, no kill switch
- **Risk Level:** HIGH
- **Recommendation:** NOT recommended

### Option B: Add Safety Rails, Then Deploy

- **Pros:** Balanced risk/reward, can ship in 1-2 sprints
- **Cons:** Delays launch slightly
- **Risk Level:** MEDIUM
- **Recommendation:** RECOMMENDED

### Option C: Complete Rewrite with WebGPU Path

- **Pros:** Future-proof, best performance
- **Cons:** 4-6 week effort, browser support concerns
- **Risk Level:** LOW (but high effort)
- **Recommendation:** Future consideration

---

## Next Steps

1. Review Risk Register (`risk-register.md`)
2. Review Implementation Plan (`implementation-plan.md`)
3. Approve phased rollout approach
4. Begin Phase 0 (Safety Rails)
