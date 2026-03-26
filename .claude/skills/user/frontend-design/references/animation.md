# Animation Reference

## Contents
- Page Load Sequences
- Scroll-Triggered Entrances
- Hover and Interaction States
- CSS-Only Recipes
- Performance Guidelines
- Reduced Motion Support

## Page Load Sequences

The highest-impact animation: staggered element reveals on load.

```css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.6s ease forwards;
}

.reveal:nth-child(1) { animation-delay: 0.1s; }
.reveal:nth-child(2) { animation-delay: 0.2s; }
.reveal:nth-child(3) { animation-delay: 0.3s; }

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Variations
- `translateX(-20px)` for slide-from-left
- `scale(0.95)` for subtle zoom-in
- `blur(10px)` combined with opacity for soft focus reveal

## Scroll-Triggered Entrances

### With IntersectionObserver (preferred)
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.animate-on-scroll')
  .forEach(el => observer.observe(el));
```

```css
.animate-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.animate-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### With CSS scroll-timeline (modern browsers)
```css
@keyframes reveal {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.scroll-reveal {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 30%;
}
```

## Hover and Interaction States

### Card Hover (lift + shadow)
```css
.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
}
```

### Button Press (scale + color)
```css
.btn {
  transition: transform 0.15s ease, background-color 0.2s ease;
}
.btn:hover { background-color: var(--color-accent); }
.btn:active { transform: scale(0.97); }
```

### Image Zoom (overflow hidden container)
```css
.image-container {
  overflow: hidden;
  border-radius: 8px;
}
.image-container img {
  transition: transform 0.4s ease;
}
.image-container:hover img {
  transform: scale(1.05);
}
```

### Underline Grow (from center)
```css
.link {
  position: relative;
}
.link::after {
  content: '';
  position: absolute;
  bottom: 0; left: 50%;
  width: 0; height: 2px;
  background: var(--color-accent);
  transition: width 0.3s ease, left 0.3s ease;
}
.link:hover::after {
  width: 100%; left: 0;
}
```

## CSS-Only Background Effects

### Noise Texture
```css
.noise::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 1;
}
```

### Gradient Mesh
```css
.mesh-bg {
  background:
    radial-gradient(at 20% 30%, rgba(255,100,50,0.3) 0%, transparent 50%),
    radial-gradient(at 80% 70%, rgba(50,100,255,0.2) 0%, transparent 50%),
    radial-gradient(at 50% 50%, rgba(150,50,255,0.15) 0%, transparent 50%);
}
```

### Film Grain Overlay
```css
.grain::after {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.03;
  background: repeating-conic-gradient(#000 0.00015%, transparent 0.0005%);
  pointer-events: none;
  z-index: 9999;
}
```

## Performance Guidelines

- Animate only `transform` and `opacity` (composited properties)
- Avoid animating `width`, `height`, `top`, `left`, `margin`, `padding`
- Use `will-change` sparingly and only on elements about to animate
- Keep animations under 300ms for interactions, 600ms for transitions
- Stagger no more than 8-10 elements (beyond that, batch them)
- Test at 60fps — if janky, simplify

## Reduced Motion Support

Non-negotiable. Wrap all motion in this media query check:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Or provide static alternatives:
```css
@media (prefers-reduced-motion: no-preference) {
  .reveal { animation: fadeUp 0.6s ease forwards; }
}
```
