/**
 * Blaze Sports Intel Design System - Button Component
 *
 * Usage:
 *   import { Button } from './components/Button.js';
 *
 *   const button = Button({
 *     text: 'Click Me',
 *     variant: 'primary',
 *     size: 'md',
 *     onClick: () => console.log('Clicked!')
 *   });
 *
 *   document.body.appendChild(button);
 *
 * @param {Object} options - Button configuration
 * @param {string} options.text - Button text content
 * @param {string} [options.variant='primary'] - Button variant: primary, secondary, tertiary, ghost
 * @param {string} [options.size='md'] - Button size: sm, md, lg
 * @param {boolean} [options.disabled=false] - Disabled state
 * @param {boolean} [options.loading=false] - Loading state with spinner
 * @param {string} [options.icon] - Icon HTML (optional, prepended to text)
 * @param {Function} [options.onClick] - Click handler
 * @param {string} [options.type='button'] - Button type: button, submit, reset
 * @param {string} [options.className] - Additional CSS classes
 * @param {Object} [options.attributes] - Additional HTML attributes
 * @returns {HTMLButtonElement} Button element
 */
export function Button(options = {}) {
  const {
    text = '',
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon = null,
    onClick = null,
    type = 'button',
    className = '',
    attributes = {},
  } = options;

  // Create button element
  const button = document.createElement('button');
  button.type = type;
  button.className = `bsi-button bsi-button--${variant} bsi-button--${size} ${className}`.trim();

  // Add disabled state
  if (disabled || loading) {
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
  }

  // Add loading state
  if (loading) {
    button.classList.add('bsi-button--loading');
    button.setAttribute('aria-busy', 'true');
  }

  // Build button content
  const contentWrapper = document.createElement('span');
  contentWrapper.className = 'bsi-button__content';

  // Add loading spinner
  if (loading) {
    const spinner = document.createElement('span');
    spinner.className = 'bsi-button__spinner';
    spinner.innerHTML = `
      <svg class="bsi-button__spinner-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle class="bsi-button__spinner-track" cx="12" cy="12" r="10" fill="none" stroke-width="2"/>
        <circle class="bsi-button__spinner-head" cx="12" cy="12" r="10" fill="none" stroke-width="2"/>
      </svg>
    `;
    button.appendChild(spinner);
  }

  // Add icon
  if (icon && !loading) {
    const iconWrapper = document.createElement('span');
    iconWrapper.className = 'bsi-button__icon';
    iconWrapper.innerHTML = icon;
    contentWrapper.appendChild(iconWrapper);
  }

  // Add text
  if (text) {
    const textWrapper = document.createElement('span');
    textWrapper.className = 'bsi-button__text';
    textWrapper.textContent = text;
    contentWrapper.appendChild(textWrapper);
  }

  button.appendChild(contentWrapper);

  // Add click handler
  if (onClick && typeof onClick === 'function') {
    button.addEventListener('click', (e) => {
      if (!disabled && !loading) {
        onClick(e);
      }
    });
  }

  // Add additional attributes
  Object.entries(attributes).forEach(([key, value]) => {
    button.setAttribute(key, value);
  });

  return button;
}

/**
 * Button Styles
 * Import this CSS into your stylesheet or add to <head>
 */
export const ButtonStyles = `
<style>
/* ===== BASE BUTTON STYLES ===== */
.bsi-button {
  /* Reset browser defaults */
  margin: 0;
  border: none;
  background: none;
  cursor: pointer;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;

  /* Layout */
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2, 0.5rem);

  /* Typography */
  font-family: var(--font-family-sans, system-ui, sans-serif);
  font-weight: var(--font-weight-semibold, 600);
  text-decoration: none;
  white-space: nowrap;

  /* Transitions */
  transition-property: background-color, border-color, color, transform, box-shadow;
  transition-duration: var(--transition-timing-base, 300ms);
  transition-timing-function: var(--transition-easing-ease-out, ease-out);

  /* Interaction */
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  /* Accessibility */
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.bsi-button:focus-visible {
  outline-color: var(--color-border-focus, #BF5700);
}

/* ===== SIZE VARIANTS ===== */
.bsi-button--sm {
  padding: var(--spacing-2, 0.5rem) var(--spacing-4, 1rem);
  font-size: var(--font-size-sm, 0.875rem);
  line-height: var(--line-height-tight, 1.25);
  border-radius: var(--radius-base, 0.5rem);
  min-height: 36px;
}

.bsi-button--md {
  padding: var(--spacing-3, 0.75rem) var(--spacing-6, 1.5rem);
  font-size: var(--font-size-base, 1rem);
  line-height: var(--line-height-tight, 1.25);
  border-radius: var(--radius-md, 0.75rem);
  min-height: 44px;
}

.bsi-button--lg {
  padding: var(--spacing-4, 1rem) var(--spacing-8, 2rem);
  font-size: var(--font-size-lg, 1.125rem);
  line-height: var(--line-height-tight, 1.25);
  border-radius: var(--radius-lg, 1rem);
  min-height: 52px;
}

/* ===== PRIMARY VARIANT ===== */
.bsi-button--primary {
  background: linear-gradient(135deg, var(--color-brand-blaze-primary, #BF5700), var(--color-brand-blaze-medium, #D4693B));
  color: var(--color-text-primary, #FFFFFF);
  box-shadow: var(--shadow-base, 0 4px 6px rgba(0, 0, 0, 0.1));
}

.bsi-button--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-brand-blaze-medium, #D4693B), var(--color-brand-blaze-light, #FFB84D));
  box-shadow: var(--shadow-md, 0 8px 12px rgba(0, 0, 0, 0.15));
  transform: translateY(-2px);
}

.bsi-button--primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
}

/* ===== SECONDARY VARIANT ===== */
.bsi-button--secondary {
  background: var(--color-bg-secondary, #2A2A2A);
  color: var(--color-text-primary, #FFFFFF);
  border: 1px solid var(--color-border-default, rgba(255, 255, 255, 0.12));
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
}

.bsi-button--secondary:hover:not(:disabled) {
  background: var(--color-bg-tertiary, #3A3A3A);
  border-color: var(--color-border-hover, rgba(255, 255, 255, 0.24));
  box-shadow: var(--shadow-base, 0 4px 6px rgba(0, 0, 0, 0.1));
}

.bsi-button--secondary:active:not(:disabled) {
  background: var(--color-bg-secondary, #2A2A2A);
}

/* ===== TERTIARY VARIANT ===== */
.bsi-button--tertiary {
  background: transparent;
  color: var(--color-brand-blaze-primary, #BF5700);
  border: 1px solid var(--color-brand-blaze-primary, #BF5700);
}

.bsi-button--tertiary:hover:not(:disabled) {
  background: var(--color-brand-blaze-primary, #BF5700);
  color: var(--color-text-primary, #FFFFFF);
  box-shadow: var(--shadow-glow-blaze, 0 0 24px rgba(191, 87, 0, 0.3));
}

/* ===== GHOST VARIANT ===== */
.bsi-button--ghost {
  background: transparent;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.85));
}

.bsi-button--ghost:hover:not(:disabled) {
  background: var(--color-bg-secondary, #2A2A2A);
  color: var(--color-text-primary, #FFFFFF);
}

/* ===== DISABLED STATE ===== */
.bsi-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
}

/* ===== LOADING STATE ===== */
.bsi-button--loading {
  cursor: wait;
  pointer-events: none;
}

.bsi-button--loading .bsi-button__content {
  visibility: hidden;
}

.bsi-button__spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
}

.bsi-button__spinner-icon {
  width: 100%;
  height: 100%;
  animation: bsi-button-spin 1s linear infinite;
}

.bsi-button__spinner-track {
  stroke: currentColor;
  opacity: 0.25;
}

.bsi-button__spinner-head {
  stroke: currentColor;
  stroke-dasharray: 62.83;
  stroke-dashoffset: 47.12;
  stroke-linecap: round;
  animation: bsi-button-spin-head 1.5s ease-in-out infinite;
}

@keyframes bsi-button-spin {
  to { transform: rotate(360deg); }
}

@keyframes bsi-button-spin-head {
  0% {
    stroke-dashoffset: 62.83;
  }
  50% {
    stroke-dashoffset: 15.71;
  }
  100% {
    stroke-dashoffset: 62.83;
  }
}

/* ===== CONTENT LAYOUT ===== */
.bsi-button__content {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2, 0.5rem);
}

.bsi-button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
}

.bsi-button__icon svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

/* ===== ACCESSIBILITY ===== */
@media (prefers-reduced-motion: reduce) {
  .bsi-button {
    transition-duration: 0.01ms;
  }

  .bsi-button:hover:not(:disabled) {
    transform: none;
  }

  .bsi-button__spinner-icon,
  .bsi-button__spinner-head {
    animation: none;
  }
}

/* ===== PRINT ===== */
@media print {
  .bsi-button {
    box-shadow: none;
    background: transparent;
    border: 1px solid currentColor;
  }
}
</style>
`;
