# Visual Enhancement Quick Reference

**Ultra-Fast Copy-Paste Guide for Maximum Visual Fidelity**

---

## Quick Start (3 Steps)

### 1. Add CSS (in `<head>`)
```html
<link rel="stylesheet" href="/css/blaze-detail-maximizer.css">
```

### 2. Add Particles (before `</body>`)
```html
<script src="/js/blaze-particles.js"></script>
```

### 3. Upgrade Classes (on existing elements)
Replace basic classes with ultra variants (see below)

---

## Component Upgrades (Copy-Paste)

### Cards

**Before:**
```html
<div class="blaze-card">
  <!-- content -->
</div>
```

**After (Ultra):**
```html
<div class="blaze-card-ultra interact-hover lit-cinematic">
  <!-- content -->
</div>
```

**After (Interactive):**
```html
<div class="blaze-card-ultra interact-hover interact-glow lit-cinematic">
  <!-- content -->
</div>
```

**After (Live Game):**
```html
<div class="game-card-ultra live lit-rim effect-bloom">
  <!-- game content -->
</div>
```

---

### Buttons

**Before:**
```html
<button class="blaze-btn-primary">
  Click Me
</button>
```

**After:**
```html
<button class="blaze-btn-ultra interact-punch">
  Click Me
</button>
```

---

### Text

**Before:**
```html
<h1>Blaze Sports Intel</h1>
```

**After (Gradient):**
```html
<h1 class="text-gradient-enhanced" data-text="Blaze Sports Intel">
  Blaze Sports Intel
</h1>
```

**After (Depth):**
```html
<h1 class="text-depth">
  Blaze Sports Intel
</h1>
```

---

### Sections

**Before:**
```html
<section class="features-section">
  <!-- content -->
</section>
```

**After:**
```html
<section class="features-section effect-grain effect-vignette">
  <!-- content -->
</section>
```

---

## Class Reference (Alphabetical)

### Effects

| Class | Purpose | Example |
|-------|---------|---------|
| `.effect-bloom` | Glow on bright elements | Live scores |
| `.effect-chromatic` | RGB channel separation | LIVE indicators |
| `.effect-color-grade` | Cinematic color correction | Hero sections |
| `.effect-grain` | Film grain texture | Backgrounds |
| `.effect-vignette` | Darkened corners | Full-page sections |

### Interactions

| Class | Purpose | Example |
|-------|---------|---------|
| `.interact-hover` | Enhanced hover (scale/glow/tilt) | Cards |
| `.interact-tilt` | 3D tilt on hover | Feature cards |
| `.interact-glow` | Glow intensification | Buttons |
| `.interact-ripple` | Ripple on click | Buttons |
| `.interact-punch` | Scale down then up | CTAs |
| `.interact-color-shift` | Hue shift on hover | Icons |
| `.interact-magnetic` | Mouse attraction | Interactive elements |

### Lighting

| Class | Purpose | Example |
|-------|---------|---------|
| `.lit-cinematic` | Full 5-point lighting | Cards, modals |
| `.lit-key` | Top-left warm highlight | Headers |
| `.lit-fill` | Bottom-right cool shadow | Containers |
| `.lit-rim` | Edge glow | Live indicators |
| `.lit-back` | Halo behind element | Floating elements |
| `.lit-ambient` | Subtle radial gradient | Backgrounds |

### Materials

| Class | Purpose | Example |
|-------|---------|---------|
| `.material-glass-advanced` | 3-layer glass stack | Overlays |
| `.material-glass-frost` | Frosted texture | Backgrounds |
| `.material-metal` | Brushed metal | Icons |
| `.material-metal-rough` | Rough metal with noise | Borders |
| `.material-subsurface` | Glow from within | Highlights |
| `.material-fresnel` | Edge lighting | Cards |

### Shadows

| Class | Purpose | Example |
|-------|---------|---------|
| `.shadow-photorealistic` | 5-layer ultimate depth | Cards |
| `.shadow-elevated-brand` | Floating with glow | Buttons |
| `.shadow-float` | AAA game UI style | Modals |
| `.shadow-inset-deep` | Pressed/recessed | Inputs |

### Typography

| Class | Purpose | Example |
|-------|---------|---------|
| `.text-depth` | Multi-layer shadow | Headings |
| `.text-gradient-enhanced` | 5-stop gradient | Titles |
| `.text-crisp` | GPU-accelerated sharp | Body text |

### Component Variants

| Class | Purpose | Example |
|-------|---------|---------|
| `.blaze-card-ultra` | Enhanced card | All cards |
| `.blaze-btn-ultra` | Enhanced button | CTAs |
| `.game-card-ultra` | Enhanced game card | Live games |
| `.skeleton-ultra` | Enhanced skeleton | Loading states |
| `.blaze-spinner-ultra` | Enhanced spinner | Loading |

---

## Common Combinations

### Hero Title (Maximum Impact)
```html
<h1 class="text-gradient-enhanced text-depth lit-cinematic" data-text="Hero Title">
  Hero Title
</h1>
```

### Interactive Card (Full Enhancement)
```html
<div class="blaze-card-ultra interact-hover interact-glow lit-cinematic material-glass-advanced">
  <div class="card-header">
    <h3 class="text-depth">Card Title</h3>
  </div>
  <div class="card-body">
    Content here
  </div>
</div>
```

### Live Game Card (Maximum Intensity)
```html
<div class="game-card-ultra live lit-rim effect-bloom interact-hover">
  <div class="card-header">
    <h3>LIVE</h3>
  </div>
  <div class="card-body">
    Game content
  </div>
</div>
```

### CTA Button (Maximum Conversion)
```html
<button class="blaze-btn-ultra interact-punch interact-glow lit-cinematic">
  Get Started
</button>
```

### Section Background (Cinematic)
```html
<section class="features-section effect-grain effect-vignette lit-ambient">
  <!-- content -->
</section>
```

---

## Particle System API

### Global Instance
```javascript
// Access particle system
const particles = window.blazeParticles;
```

### Configuration
```javascript
// Set particle count (1,000 - 200,000)
particles.setParticleCount(100000);

// Set repulsion radius (50 - 300px)
particles.setRepulsionRadius(200);

// Set repulsion strength (0 - 2)
particles.setRepulsionStrength(0.8);
```

### Control
```javascript
// Pause/resume
particles.pause();
particles.start();

// Destroy
particles.destroy();
```

### Particle Burst
```javascript
// Burst at coordinates
createParticleBurst(mouseX, mouseY, 50);
```

### URL Parameters
```
?particles=false  - Disable particles
?debug=true      - Show FPS counter
```

---

## Performance Tips

### GPU Acceleration
Always use these properties for animations:
- `transform: translateZ(0)`
- `will-change: transform, opacity`
- `backface-visibility: hidden`

### Reduce Complexity on Mobile
```css
@media (max-width: 768px) {
  /* Simplify shadows */
  .shadow-photorealistic {
    box-shadow: var(--shadow-lg);
  }

  /* Reduce blur */
  .material-glass-advanced {
    backdrop-filter: blur(8px);
  }
}
```

### Lazy Load Effects
```javascript
// Add effects only when element is visible
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('effect-bloom', 'lit-cinematic');
    }
  });
});

observer.observe(document.querySelector('.hero'));
```

---

## Accessibility Checklist

- [ ] Focus indicators visible (2px solid)
- [ ] Color contrast WCAG AA (4.5:1)
- [ ] Keyboard navigation works
- [ ] Screen reader announcements
- [ ] Reduced motion support

### Reduced Motion Override
```css
@media (prefers-reduced-motion: reduce) {
  .interact-hover:hover {
    transform: none !important;
  }

  .effect-bloom::after {
    display: none !important;
  }
}
```

---

## Debugging

### Check Particle System
```javascript
console.log({
  fps: window.blazeParticles?.fps,
  particleCount: window.blazeParticles?.particleCount,
  tier: window.blazeParticles?.currentTier,
});
```

### Check GPU Layers
```javascript
// Chrome DevTools > Rendering > Layer Borders
// Green outline = GPU-accelerated layer
```

### Check Performance
```javascript
// Chrome DevTools > Performance > Record
// Look for 60fps green line (no red zones)
```

---

## Browser-Specific Fixes

### Safari Blur Fix
```css
/* Ensure -webkit- prefix */
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
```

### Firefox Shadow Fix
```css
/* Use simpler shadows if needed */
box-shadow:
  0 2px 4px rgba(0,0,0,0.3),
  0 0 30px rgba(191,87,0,0.3);
```

### Chrome OKLCH Fallback
```css
/* Provide fallback for older browsers */
background: #bf5700; /* fallback */
background: oklch(55% 0.18 40); /* modern */
```

---

## Common Issues & Fixes

### Issue: Particles Not Showing
```javascript
// Check if reduced motion is enabled
window.matchMedia('(prefers-reduced-motion: reduce)').matches
// If true, particles are disabled

// Force enable
window.blazeParticles.reducedMotion = false;
window.blazeParticles.start();
```

### Issue: Low FPS
```javascript
// Manually reduce particle count
window.blazeParticles.setParticleCount(10000);
```

### Issue: Shadows Look Flat
```css
/* Ensure element has GPU layer */
transform: translateZ(0);
will-change: transform;
```

### Issue: Blur Not Working
```css
/* Check browser support */
@supports (backdrop-filter: blur(10px)) {
  /* Use blur */
}

@supports not (backdrop-filter: blur(10px)) {
  /* Fallback */
  background: rgba(255,255,255,0.1);
}
```

---

## Copy-Paste Snippets

### Full-Enhanced Card
```html
<div class="blaze-card-ultra interact-hover interact-glow lit-cinematic material-glass-advanced shadow-photorealistic">
  <div class="card-header">
    <h3 class="text-depth">Card Title</h3>
    <span class="badge-live lit-rim">LIVE</span>
  </div>
  <div class="card-body">
    <p class="text-crisp">Card content with maximum visual fidelity.</p>
  </div>
  <div class="card-footer">
    <button class="blaze-btn-ultra interact-punch">
      View Details
    </button>
  </div>
</div>
```

### Cinematic Hero Section
```html
<section class="hero effect-grain effect-vignette lit-ambient">
  <div class="hero-content">
    <h1 class="text-gradient-enhanced text-depth lit-cinematic" data-text="Hero Title">
      Hero Title
    </h1>
    <p class="text-crisp">Hero subtitle with photorealistic depth.</p>
    <button class="blaze-btn-ultra interact-punch interact-glow">
      Get Started
    </button>
  </div>
</section>
```

### Enhanced Data Table
```html
<div class="blaze-table-container material-glass-advanced shadow-elevated-brand">
  <table class="blaze-table">
    <thead>
      <tr>
        <th class="text-depth">Team</th>
        <th class="text-depth">W-L</th>
        <th class="text-depth">PCT</th>
      </tr>
    </thead>
    <tbody>
      <tr class="interact-hover">
        <td>Texas Longhorns</td>
        <td class="stat-cell">15-3</td>
        <td class="stat-cell">.833</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Final Checklist

- [ ] CSS added to all pages
- [ ] Particle system loaded
- [ ] Cards upgraded to `.blaze-card-ultra`
- [ ] Buttons upgraded to `.blaze-btn-ultra`
- [ ] Text has depth (`.text-depth`)
- [ ] Live elements have `.lit-rim` and `.effect-bloom`
- [ ] Interactions added (`.interact-hover`, `.interact-punch`)
- [ ] Lighting applied (`.lit-cinematic`)
- [ ] Tested on multiple devices
- [ ] FPS at 60 on desktop
- [ ] Accessibility verified

---

**Done! Deploy and watch the pixels shine. 🔥**
