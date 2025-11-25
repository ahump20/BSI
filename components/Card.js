/**
 * Blaze Sports Intel Design System - Card Component
 *
 * Usage:
 *   import { Card } from './components/Card.js';
 *
 *   const card = Card({
 *     title: 'MLB Standings',
 *     content: '<p>Content goes here</p>',
 *     variant: 'glass',
 *     padding: 'lg'
 *   });
 *
 *   document.body.appendChild(card);
 *
 * @param {Object} options - Card configuration
 * @param {string} [options.title] - Card title (optional)
 * @param {string} [options.subtitle] - Card subtitle (optional)
 * @param {string|HTMLElement} [options.content] - Card body content
 * @param {string|HTMLElement} [options.footer] - Card footer content (optional)
 * @param {string} [options.variant='glass'] - Card variant: glass, solid, outline
 * @param {string} [options.padding='md'] - Padding size: sm, md, lg
 * @param {boolean} [options.interactive=false] - Enable hover effects
 * @param {string} [options.href] - If provided, wraps card in <a> tag
 * @param {Function} [options.onClick] - Click handler
 * @param {string} [options.className] - Additional CSS classes
 * @param {Object} [options.attributes] - Additional HTML attributes
 * @returns {HTMLElement} Card element
 */
export function Card(options = {}) {
  const {
    title = null,
    subtitle = null,
    content = '',
    footer = null,
    variant = 'glass',
    padding = 'md',
    interactive = false,
    href = null,
    onClick = null,
    className = '',
    attributes = {},
  } = options;

  // Determine container element (anchor or div)
  const container = href ? document.createElement('a') : document.createElement('div');
  container.className = `bsi-card bsi-card--${variant} bsi-card--padding-${padding} ${
    interactive ? 'bsi-card--interactive' : ''
  } ${className}`.trim();

  // Add href if provided
  if (href) {
    container.href = href;
    container.setAttribute('rel', 'noopener noreferrer');
  }

  // Add click handler
  if (onClick && typeof onClick === 'function') {
    container.style.cursor = 'pointer';
    container.addEventListener('click', (e) => {
      if (!href) {
        e.preventDefault();
      }
      onClick(e);
    });
  }

  // Build card structure
  if (title || subtitle) {
    const header = document.createElement('div');
    header.className = 'bsi-card__header';

    if (title) {
      const titleElement = document.createElement('h3');
      titleElement.className = 'bsi-card__title';
      titleElement.textContent = title;
      header.appendChild(titleElement);
    }

    if (subtitle) {
      const subtitleElement = document.createElement('p');
      subtitleElement.className = 'bsi-card__subtitle';
      subtitleElement.textContent = subtitle;
      header.appendChild(subtitleElement);
    }

    container.appendChild(header);
  }

  // Add body content
  if (content) {
    const body = document.createElement('div');
    body.className = 'bsi-card__body';

    if (typeof content === 'string') {
      body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      body.appendChild(content);
    }

    container.appendChild(body);
  }

  // Add footer
  if (footer) {
    const footerElement = document.createElement('div');
    footerElement.className = 'bsi-card__footer';

    if (typeof footer === 'string') {
      footerElement.innerHTML = footer;
    } else if (footer instanceof HTMLElement) {
      footerElement.appendChild(footer);
    }

    container.appendChild(footerElement);
  }

  // Add additional attributes
  Object.entries(attributes).forEach(([key, value]) => {
    container.setAttribute(key, value);
  });

  return container;
}

/**
 * Card Styles
 * Import this CSS into your stylesheet or add to <head>
 */
export const CardStyles = `
<style>
/* ===== BASE CARD STYLES ===== */
.bsi-card {
  /* Reset */
  margin: 0;
  padding: 0;
  border: none;
  text-decoration: none;
  color: inherit;

  /* Layout */
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4, 1rem);

  /* Transitions */
  transition-property: background-color, border-color, box-shadow, transform;
  transition-duration: var(--transition-timing-base, 300ms);
  transition-timing-function: var(--transition-easing-ease-out, ease-out);
}

/* ===== PADDING VARIANTS ===== */
.bsi-card--padding-sm {
  padding: var(--spacing-4, 1rem);
}

.bsi-card--padding-md {
  padding: var(--spacing-6, 1.5rem);
}

.bsi-card--padding-lg {
  padding: var(--spacing-8, 2rem);
}

/* ===== GLASS VARIANT (PRIMARY STYLE) ===== */
.bsi-card--glass {
  background: var(--color-bg-glass, rgba(26, 26, 26, 0.75));
  backdrop-filter: blur(var(--effect-glass-blur, 16px));
  -webkit-backdrop-filter: blur(var(--effect-glass-blur, 16px));
  border: var(--effect-glass-border, 1px solid rgba(255, 255, 255, 0.12));
  border-radius: var(--radius-lg, 1rem);
  box-shadow: var(--shadow-base, 0 4px 6px rgba(0, 0, 0, 0.1));
}

.bsi-card--glass.bsi-card--interactive:hover {
  background: rgba(42, 42, 42, 0.85);
  border-color: var(--color-border-hover, rgba(255, 255, 255, 0.24));
  box-shadow: var(--shadow-lg, 0 16px 24px rgba(0, 0, 0, 0.2));
  transform: translateY(-4px);
}

/* ===== SOLID VARIANT ===== */
.bsi-card--solid {
  background: var(--color-bg-secondary, #2A2A2A);
  border: 1px solid var(--color-border-default, rgba(255, 255, 255, 0.12));
  border-radius: var(--radius-lg, 1rem);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
}

.bsi-card--solid.bsi-card--interactive:hover {
  background: var(--color-bg-tertiary, #3A3A3A);
  border-color: var(--color-border-hover, rgba(255, 255, 255, 0.24));
  box-shadow: var(--shadow-md, 0 8px 12px rgba(0, 0, 0, 0.15));
  transform: translateY(-2px);
}

/* ===== OUTLINE VARIANT ===== */
.bsi-card--outline {
  background: transparent;
  border: 2px solid var(--color-border-default, rgba(255, 255, 255, 0.12));
  border-radius: var(--radius-lg, 1rem);
}

.bsi-card--outline.bsi-card--interactive:hover {
  background: var(--color-bg-secondary, #2A2A2A);
  border-color: var(--color-brand-blaze-primary, #BF5700);
  box-shadow: var(--shadow-glow-blaze, 0 0 24px rgba(191, 87, 0, 0.3));
}

/* ===== INTERACTIVE CARDS (CLICKABLE) ===== */
.bsi-card--interactive {
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.bsi-card--interactive::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(191, 87, 0, 0) 0%,
    rgba(191, 87, 0, 0.05) 50%,
    rgba(191, 87, 0, 0) 100%
  );
  opacity: 0;
  transition: opacity var(--transition-timing-base, 300ms) var(--transition-easing-ease-out, ease-out);
  pointer-events: none;
}

.bsi-card--interactive:hover::before {
  opacity: 1;
}

.bsi-card--interactive:active {
  transform: translateY(0);
}

/* ===== CARD HEADER ===== */
.bsi-card__header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2, 0.5rem);
}

.bsi-card__title {
  margin: 0;
  font-family: var(--font-family-display, 'Bebas Neue', sans-serif);
  font-size: var(--font-size-2xl, 1.5rem);
  font-weight: var(--font-weight-bold, 700);
  line-height: var(--line-height-tight, 1.25);
  color: var(--color-text-primary, #FFFFFF);
  letter-spacing: var(--letter-spacing-wide, 0.025em);
}

.bsi-card__subtitle {
  margin: 0;
  font-family: var(--font-family-sans, system-ui, sans-serif);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-normal, 400);
  line-height: var(--line-height-normal, 1.5);
  color: var(--color-text-tertiary, rgba(255, 255, 255, 0.65));
}

/* ===== CARD BODY ===== */
.bsi-card__body {
  flex: 1;
  font-family: var(--font-family-sans, system-ui, sans-serif);
  font-size: var(--font-size-base, 1rem);
  line-height: var(--line-height-normal, 1.5);
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.85));
}

.bsi-card__body p:first-child {
  margin-top: 0;
}

.bsi-card__body p:last-child {
  margin-bottom: 0;
}

/* ===== CARD FOOTER ===== */
.bsi-card__footer {
  display: flex;
  align-items: center;
  gap: var(--spacing-3, 0.75rem);
  padding-top: var(--spacing-4, 1rem);
  border-top: 1px solid var(--color-border-default, rgba(255, 255, 255, 0.12));
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-text-tertiary, rgba(255, 255, 255, 0.65));
}

/* ===== LINK CARDS (ANCHOR TAGS) ===== */
a.bsi-card {
  text-decoration: none;
  color: inherit;
}

a.bsi-card:focus-visible {
  outline: 2px solid var(--color-border-focus, #BF5700);
  outline-offset: 2px;
}

/* ===== RESPONSIVE ADJUSTMENTS ===== */
@media (max-width: 768px) {
  .bsi-card--padding-lg {
    padding: var(--spacing-6, 1.5rem);
  }

  .bsi-card--padding-md {
    padding: var(--spacing-4, 1rem);
  }

  .bsi-card__title {
    font-size: var(--font-size-xl, 1.25rem);
  }
}

/* ===== ACCESSIBILITY ===== */
@media (prefers-reduced-motion: reduce) {
  .bsi-card {
    transition-duration: 0.01ms;
  }

  .bsi-card--interactive:hover {
    transform: none;
  }

  .bsi-card--interactive::before {
    transition-duration: 0.01ms;
  }
}

/* ===== DARK MODE SUPPORT (IF NEEDED) ===== */
@media (prefers-color-scheme: light) {
  .bsi-card--glass {
    background: rgba(255, 255, 255, 0.75);
    border-color: rgba(0, 0, 0, 0.12);
  }

  .bsi-card--solid {
    background: #F5F5F5;
    border-color: rgba(0, 0, 0, 0.12);
  }

  .bsi-card__title {
    color: var(--color-text-on-light, #1A1A1A);
  }

  .bsi-card__body {
    color: rgba(26, 26, 26, 0.85);
  }

  .bsi-card__footer {
    border-top-color: rgba(0, 0, 0, 0.12);
    color: rgba(26, 26, 26, 0.65);
  }
}

/* ===== PRINT ===== */
@media print {
  .bsi-card {
    box-shadow: none;
    border: 1px solid #CCCCCC;
  }

  .bsi-card--interactive::before {
    display: none;
  }
}
</style>
`;
