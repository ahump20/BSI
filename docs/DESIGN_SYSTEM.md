# Blaze Sports Intel — Design System Rules

## Brand Origin Story

**"Tennessee birth will be on Texas soil."** — El Campo Leader-News, May 6, 1995

John Austin Humphrey was born August 17, 1995, at Baptist Memorial Hospital East in Memphis, Tennessee—the same birthday as Davy Crockett, the legendary Tennessee Senator and folk hero who died defending the Alamo for Texas independence.

His parents placed Texas soil—taken from West Columbia, the birthplace of the Republic of Texas—beneath the hospital bed so their son would technically be born on Texas soil. When the doctor learned of this tradition, he said:

> "You know you ain't the first to do this—but they've ALL been from Texas."

This is the covenant: regardless of birth soil, Texas is a philosophy. A promise to never let each other stop dreaming.

The company name "Blaze Sports Intel" comes from Austin's childhood dachshund, Blaze, who was named after his first baseball team: the Bartlett Blaze.

---

## Brand Philosophy

**Tagline:** *Born to Blaze the Path Less Beaten*

**Core Belief:** Texas isn't just a place—it's how you choose to treat the best and worst of us. A covenant to never let each other stop dreaming, regardless of birth soil.

**Mission:** Cover the sports that big media ignores. Give college baseball the respect ESPN refuses to. Bring analytics, authenticity, and passion to the path less beaten.

---

## Color Palette

### Primary Colors
```css
--bsi-burnt-orange: #BF5700;      /* UT Official - Heritage, passion */
--bsi-texas-soil: #8B4513;        /* West Columbia earth - Roots */
--bsi-charcoal: #1A1A1A;          /* Deep black - Premium, editorial */
--bsi-midnight: #0D0D0D;          /* True dark - Backgrounds */
```

### Secondary Colors
```css
--bsi-cream: #FAF8F5;             /* Warm white - Newspaper aesthetic */
--bsi-warm-white: #FAFAFA;        /* Clean white - Text */
--bsi-ember: #FF6B35;             /* Accent orange - Interactive elements */
--bsi-titan-blue: #4B92DB;        /* Memphis heritage - Accents */
--bsi-cardinal-red: #C41E3A;      /* Cardinals heritage - Accents */
```

### Semantic Colors
```css
--bsi-success: #2E7D32;           /* Winning, positive stats */
--bsi-warning: #F9A825;           /* Caution, watch stats */
--bsi-danger: #C62828;            /* Losing, negative stats */
--bsi-info: #1976D2;              /* Informational, neutral */
```

### Gradients
```css
--bsi-hero-gradient: linear-gradient(135deg, #1A1A1A 0%, #BF5700 100%);
--bsi-soil-gradient: linear-gradient(180deg, #8B4513 0%, #5D3A1F 100%);
--bsi-ember-glow: radial-gradient(circle at 50% 50%, #FF6B35 0%, transparent 70%);
```

---

## Typography

### Font Stack
```css
/* Display/Headlines - Bold, memorable, Texas character */
--font-display: 'Playfair Display', 'Georgia', serif;

/* Body - Clean, readable, editorial */
--font-body: 'Source Serif 4', 'Georgia', serif;

/* UI/Data - Modern, technical, sports */
--font-ui: 'IBM Plex Sans', 'Helvetica Neue', sans-serif;

/* Mono/Stats - Clean data display */
--font-mono: 'IBM Plex Mono', 'Courier New', monospace;
```

### Type Scale
```css
--text-xs: 0.75rem;      /* 12px - Fine print, timestamps */
--text-sm: 0.875rem;     /* 14px - Captions, secondary */
--text-base: 1rem;       /* 16px - Body text */
--text-lg: 1.125rem;     /* 18px - Lead paragraphs */
--text-xl: 1.25rem;      /* 20px - Subheadings */
--text-2xl: 1.5rem;      /* 24px - Section headers */
--text-3xl: 1.875rem;    /* 30px - Page titles */
--text-4xl: 2.25rem;     /* 36px - Hero secondary */
--text-5xl: 3rem;        /* 48px - Hero primary */
--text-6xl: 3.75rem;     /* 60px - Display */
--text-7xl: 4.5rem;      /* 72px - Statement */
```

### Line Heights
```css
--leading-tight: 1.1;    /* Headlines */
--leading-snug: 1.25;    /* Subheadings */
--leading-normal: 1.5;   /* Body text */
--leading-relaxed: 1.625; /* Long-form */
--leading-loose: 2;      /* Spacious blocks */
```

---

## Spacing System

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
--space-32: 8rem;     /* 128px */
```

---

## Component Patterns

### Storytelling Blocks
Origin story elements use a newspaper-inspired aesthetic:
- Cream backgrounds with subtle paper texture
- Sepia-toned image overlays for historical photos
- Pull quotes in Playfair Display italic
- Newspaper clipping frames with torn edges

### Data Cards
Stats and analytics use a modern sports aesthetic:
- Dark charcoal backgrounds
- Burnt orange accents for key metrics
- IBM Plex Mono for numbers
- Subtle grid lines reminiscent of baseball scorecards

### Hero Sections
Large visual impact with the origin story:
- Full-bleed images with gradient overlays
- Statement typography
- Asymmetric layouts
- Ember glow effects on key elements

---

## Image Treatment

### Historical Photos
- Sepia overlay: `filter: sepia(30%) contrast(1.1);`
- Subtle vignette
- Grain texture overlay
- Worn edge effects

### Current Photos
- High contrast
- Slight warm color grade
- Sharp focus
- No filters unless intentional mood

### Logo Usage
- Primary: Full lockup on dark backgrounds
- Secondary: Mark only for small applications
- Minimum clear space: Height of the "B" on all sides
- Never distort, recolor outside brand palette, or add effects

---

## Responsive Breakpoints

```css
--bp-mobile: 320px;     /* Small mobile */
--bp-mobile-lg: 425px;  /* Large mobile */
--bp-tablet: 768px;     /* Tablet portrait */
--bp-laptop: 1024px;    /* Small laptop */
--bp-desktop: 1280px;   /* Desktop */
--bp-wide: 1536px;      /* Wide screens */
```

Mobile-first approach: Base styles for mobile, enhance up.

---

## Animation Principles

### Timing
```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-slower: 800ms;

--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0.0, 1, 1);
--ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Motion Philosophy
- Purposeful, not decorative
- Reveals content hierarchy through staggered animations
- Ember glow effects for interactive elements
- Subtle parallax on storytelling sections
- Stats counters animate on scroll

---

## Voice & Tone

### Writing Style
- Direct, no corporate fluff
- Lead with answers
- Show the work, don't explain it
- Honest about limitations
- Passionate but not homer
- Respectful of all sports equally (except soccer—that's explicitly out of scope)

### Headlines
- Active voice
- Specific, not vague
- Data when relevant
- Questions that provoke thought

### Body Copy
- Short paragraphs
- No jargon without explanation
- Statistics with context
- Sources always cited

---

## Accessibility

- Color contrast: WCAG AA minimum (4.5:1 for text)
- Focus states: Visible, on-brand orange outline
- Alt text: All images, descriptive and contextual
- Motion: Respect prefers-reduced-motion
- Touch targets: Minimum 44x44px

---

## File Structure

```
/
├── index.html              # Home - Origin story + value prop
├── about/                  # Full birth story + philosophy
├── coverage/               # Sports we cover
│   ├── college-baseball/   # Primary focus
│   ├── mlb/
│   ├── college-football/
│   └── nfl/
├── analytics/              # Live data + tools
├── assets/
│   ├── images/
│   │   ├── origin/         # Birth story photos
│   │   ├── logo/           # Brand marks
│   │   └── content/        # Editorial images
│   ├── fonts/
│   └── icons/
└── styles/
    ├── tokens.css          # Design tokens
    ├── base.css            # Reset + foundations
    ├── components.css      # Reusable patterns
    └── utilities.css       # Helper classes
```

---

## The Non-Negotiables

1. **No fake data.** Better to ship nothing than ship lies.
2. **No corporate speak.** Talk like a human who loves sports.
3. **No generic aesthetics.** Every pixel should feel intentionally BSI.
4. **No soccer.** It's explicitly out of scope.
5. **No homerism in public content.** Personal loyalty, professional objectivity.
6. **Always cite sources.** With timestamps and confidence intervals.
7. **Mobile-first.** Because 70% of sports content is consumed on phones.

---

*Born in Memphis. Rooted in Texas soil. Blazing the path less beaten.*
