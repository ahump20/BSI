/**
 * Blaze Sports Intel Design System - Modal Component
 *
 * Usage:
 *   import { Modal } from './components/Modal.js';
 *
 *   const modal = Modal({
 *     title: 'Confirm Action',
 *     content: '<p>Are you sure you want to proceed?</p>',
 *     footer: '<button>Cancel</button><button>Confirm</button>',
 *     size: 'md',
 *     animation: 'fade',
 *     closeOnBackdrop: true,
 *     closeOnEscape: true
 *   });
 *
 *   modal.open();
 *   modal.close();
 *
 * @param {Object} options - Modal configuration
 * @param {string} [options.title] - Modal title
 * @param {string|HTMLElement} [options.content] - Modal body content
 * @param {string|HTMLElement} [options.footer] - Modal footer content (optional)
 * @param {string} [options.size='md'] - Modal size: sm, md, lg, full
 * @param {string} [options.animation='fade'] - Animation: fade, slide, scale
 * @param {boolean} [options.closeButton=true] - Show close button
 * @param {boolean} [options.closeOnBackdrop=true] - Close when clicking backdrop
 * @param {boolean} [options.closeOnEscape=true] - Close when pressing ESC
 * @param {Function} [options.onOpen] - Callback when modal opens
 * @param {Function} [options.onClose] - Callback when modal closes
 * @param {string} [options.className] - Additional CSS classes
 * @param {Object} [options.attributes] - Additional HTML attributes
 * @returns {Object} Modal controller with open(), close(), destroy() methods
 */
export function Modal(options = {}) {
  const {
    title = null,
    content = '',
    footer = null,
    size = 'md',
    animation = 'fade',
    closeButton = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
    onOpen = null,
    onClose = null,
    className = '',
    attributes = {}
  } = options;

  let isOpen = false;
  let previousActiveElement = null;
  let focusableElements = [];
  let firstFocusable = null;
  let lastFocusable = null;

  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = `bsi-modal-overlay bsi-modal-overlay--${animation}`;
  overlay.setAttribute('role', 'presentation');
  overlay.setAttribute('aria-hidden', 'true');

  // Create modal dialog
  const dialog = document.createElement('div');
  dialog.className = `bsi-modal bsi-modal--${size} bsi-modal--${animation} ${className}`.trim();
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('tabindex', '-1');

  // Add additional attributes
  Object.entries(attributes).forEach(([key, value]) => {
    dialog.setAttribute(key, value);
  });

  // Create modal content container
  const modalContent = document.createElement('div');
  modalContent.className = 'bsi-modal__content';

  // Create modal header
  if (title || closeButton) {
    const header = document.createElement('div');
    header.className = 'bsi-modal__header';

    if (title) {
      const titleElement = document.createElement('h2');
      titleElement.className = 'bsi-modal__title';
      titleElement.id = `modal-title-${Math.random().toString(36).substr(2, 9)}`;
      titleElement.textContent = title;
      header.appendChild(titleElement);
      dialog.setAttribute('aria-labelledby', titleElement.id);
    }

    if (closeButton) {
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'bsi-modal__close';
      closeBtn.setAttribute('aria-label', 'Close modal');
      closeBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
      closeBtn.addEventListener('click', () => close());
      header.appendChild(closeBtn);
    }

    modalContent.appendChild(header);
  }

  // Create modal body
  if (content) {
    const body = document.createElement('div');
    body.className = 'bsi-modal__body';
    body.id = `modal-body-${Math.random().toString(36).substr(2, 9)}`;

    if (typeof content === 'string') {
      body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      body.appendChild(content);
    }

    dialog.setAttribute('aria-describedby', body.id);
    modalContent.appendChild(body);
  }

  // Create modal footer
  if (footer) {
    const footerElement = document.createElement('div');
    footerElement.className = 'bsi-modal__footer';

    if (typeof footer === 'string') {
      footerElement.innerHTML = footer;
    } else if (footer instanceof HTMLElement) {
      footerElement.appendChild(footer);
    }

    modalContent.appendChild(footerElement);
  }

  dialog.appendChild(modalContent);
  overlay.appendChild(dialog);

  // Focus trap implementation
  function updateFocusableElements() {
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    focusableElements = Array.from(dialog.querySelectorAll(focusableSelector)).filter(
      el => !el.hasAttribute('disabled') && el.offsetParent !== null
    );
    firstFocusable = focusableElements[0];
    lastFocusable = focusableElements[focusableElements.length - 1];
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  }

  // ESC key handler
  function handleEscape(e) {
    if (e.key === 'Escape' && closeOnEscape && isOpen) {
      close();
    }
  }

  // Backdrop click handler
  function handleBackdropClick(e) {
    if (closeOnBackdrop && e.target === overlay && isOpen) {
      close();
    }
  }

  // Lock body scroll
  function lockScroll() {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }

  // Unlock body scroll
  function unlockScroll() {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  // Open modal
  function open() {
    if (isOpen) return;

    // Save currently focused element
    previousActiveElement = document.activeElement;

    // Add to DOM
    document.body.appendChild(overlay);

    // Lock scroll
    lockScroll();

    // Trigger reflow for animation
    overlay.offsetHeight;

    // Show modal
    overlay.classList.add('bsi-modal-overlay--visible');
    dialog.classList.add('bsi-modal--visible');
    overlay.setAttribute('aria-hidden', 'false');

    // Set focus to first focusable element
    updateFocusableElements();
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      dialog.focus();
    }

    // Add event listeners
    dialog.addEventListener('keydown', trapFocus);
    document.addEventListener('keydown', handleEscape);
    overlay.addEventListener('click', handleBackdropClick);

    isOpen = true;

    // Call onOpen callback
    if (onOpen && typeof onOpen === 'function') {
      onOpen();
    }
  }

  // Close modal
  function close() {
    if (!isOpen) return;

    // Hide modal
    overlay.classList.remove('bsi-modal-overlay--visible');
    dialog.classList.remove('bsi-modal--visible');
    overlay.setAttribute('aria-hidden', 'true');

    // Wait for animation to complete
    const animationDuration = parseFloat(getComputedStyle(dialog).transitionDuration) * 1000 || 300;

    setTimeout(() => {
      // Remove from DOM
      if (overlay.parentElement) {
        overlay.parentElement.removeChild(overlay);
      }

      // Unlock scroll
      unlockScroll();

      // Restore focus
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }

      // Remove event listeners
      dialog.removeEventListener('keydown', trapFocus);
      document.removeEventListener('keydown', handleEscape);
      overlay.removeEventListener('click', handleBackdropClick);

      isOpen = false;

      // Call onClose callback
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
    }, animationDuration);
  }

  // Destroy modal
  function destroy() {
    close();
    focusableElements = [];
    firstFocusable = null;
    lastFocusable = null;
    previousActiveElement = null;
  }

  // Public API
  return {
    open,
    close,
    destroy,
    element: overlay,
    dialog,
    get isOpen() {
      return isOpen;
    }
  };
}

/**
 * Modal Styles
 * Import this CSS into your stylesheet or add to <head>
 */
export const ModalStyles = `
<style>
/* ===== MODAL OVERLAY ===== */
.bsi-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-modal-backdrop, 1030);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4, 1rem);
  background: var(--color-bg-overlay, rgba(0, 0, 0, 0.8));
  opacity: 0;
  transition: opacity var(--transition-timing-base, 300ms) var(--transition-easing-ease-out, ease-out);
  overflow-y: auto;
}

.bsi-modal-overlay--visible {
  opacity: 1;
}

/* ===== MODAL DIALOG ===== */
.bsi-modal {
  position: relative;
  width: 100%;
  max-height: 90vh;
  background: var(--color-bg-secondary, #2A2A2A);
  border: 1px solid var(--color-border-default, rgba(255, 255, 255, 0.12));
  border-radius: var(--radius-lg, 1rem);
  box-shadow: var(--shadow-xl, 0 24px 48px -8px rgba(0, 0, 0, 0.25));
  z-index: var(--z-modal, 1040);
  overflow: hidden;
  outline: none;
}

/* ===== SIZE VARIANTS ===== */
.bsi-modal--sm {
  max-width: 400px;
}

.bsi-modal--md {
  max-width: 600px;
}

.bsi-modal--lg {
  max-width: 900px;
}

.bsi-modal--full {
  max-width: 100%;
  max-height: 100vh;
  height: 100%;
  border-radius: 0;
  margin: 0;
}

/* ===== ANIMATION VARIANTS ===== */
/* Fade Animation */
.bsi-modal-overlay--fade .bsi-modal {
  opacity: 0;
  transition: opacity var(--transition-timing-base, 300ms) var(--transition-easing-ease-out, ease-out);
}

.bsi-modal-overlay--fade .bsi-modal--visible {
  opacity: 1;
}

/* Slide Animation */
.bsi-modal-overlay--slide .bsi-modal {
  opacity: 0;
  transform: translateY(-40px);
  transition: opacity var(--transition-timing-base, 300ms) var(--transition-easing-ease-out, ease-out),
              transform var(--transition-timing-base, 300ms) var(--transition-easing-ease-out, ease-out);
}

.bsi-modal-overlay--slide .bsi-modal--visible {
  opacity: 1;
  transform: translateY(0);
}

/* Scale Animation */
.bsi-modal-overlay--scale .bsi-modal {
  opacity: 0;
  transform: scale(0.9);
  transition: opacity var(--transition-timing-base, 300ms) var(--transition-easing-ease-out, ease-out),
              transform var(--transition-timing-base, 300ms) var(--transition-easing-elastic, cubic-bezier(0.68, -0.55, 0.265, 1.55));
}

.bsi-modal-overlay--scale .bsi-modal--visible {
  opacity: 1;
  transform: scale(1);
}

/* ===== MODAL CONTENT ===== */
.bsi-modal__content {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

/* ===== MODAL HEADER ===== */
.bsi-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4, 1rem);
  padding: var(--spacing-6, 1.5rem);
  border-bottom: 1px solid var(--color-border-default, rgba(255, 255, 255, 0.12));
  flex-shrink: 0;
}

.bsi-modal__title {
  margin: 0;
  font-family: var(--font-family-display, 'Bebas Neue', sans-serif);
  font-size: var(--font-size-2xl, 1.5rem);
  font-weight: var(--font-weight-bold, 700);
  line-height: var(--line-height-tight, 1.25);
  color: var(--color-text-primary, #FFFFFF);
  letter-spacing: var(--letter-spacing-wide, 0.025em);
  flex: 1;
}

.bsi-modal__close {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.85));
  border-radius: var(--radius-base, 0.5rem);
  cursor: pointer;
  transition: background-color var(--transition-timing-fast, 150ms) var(--transition-easing-ease-out, ease-out),
              color var(--transition-timing-fast, 150ms) var(--transition-easing-ease-out, ease-out);
}

.bsi-modal__close:hover {
  background: var(--color-bg-tertiary, #3A3A3A);
  color: var(--color-text-primary, #FFFFFF);
}

.bsi-modal__close:focus-visible {
  outline: 2px solid var(--color-border-focus, #BF5700);
  outline-offset: 2px;
}

.bsi-modal__close svg {
  width: 24px;
  height: 24px;
}

/* ===== MODAL BODY ===== */
.bsi-modal__body {
  flex: 1;
  padding: var(--spacing-6, 1.5rem);
  overflow-y: auto;
  font-family: var(--font-family-sans, system-ui, sans-serif);
  font-size: var(--font-size-base, 1rem);
  line-height: var(--line-height-normal, 1.5);
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.85));
}

.bsi-modal__body p:first-child {
  margin-top: 0;
}

.bsi-modal__body p:last-child {
  margin-bottom: 0;
}

/* Custom scrollbar for modal body */
.bsi-modal__body::-webkit-scrollbar {
  width: 8px;
}

.bsi-modal__body::-webkit-scrollbar-track {
  background: var(--color-bg-tertiary, #3A3A3A);
  border-radius: var(--radius-base, 0.5rem);
}

.bsi-modal__body::-webkit-scrollbar-thumb {
  background: var(--color-brand-blaze-primary, #BF5700);
  border-radius: var(--radius-base, 0.5rem);
}

.bsi-modal__body::-webkit-scrollbar-thumb:hover {
  background: var(--color-brand-blaze-medium, #D4693B);
}

/* ===== MODAL FOOTER ===== */
.bsi-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-3, 0.75rem);
  padding: var(--spacing-6, 1.5rem);
  border-top: 1px solid var(--color-border-default, rgba(255, 255, 255, 0.12));
  flex-shrink: 0;
}

/* ===== RESPONSIVE ADJUSTMENTS ===== */
@media (max-width: 768px) {
  .bsi-modal-overlay {
    padding: var(--spacing-2, 0.5rem);
    align-items: flex-end;
  }

  .bsi-modal--sm,
  .bsi-modal--md,
  .bsi-modal--lg {
    max-width: 100%;
  }

  .bsi-modal__header,
  .bsi-modal__body,
  .bsi-modal__footer {
    padding: var(--spacing-4, 1rem);
  }

  .bsi-modal__title {
    font-size: var(--font-size-xl, 1.25rem);
  }

  /* Mobile: Slide up from bottom */
  .bsi-modal-overlay--slide .bsi-modal {
    transform: translateY(100%);
  }

  .bsi-modal-overlay--slide .bsi-modal--visible {
    transform: translateY(0);
  }
}

/* ===== ACCESSIBILITY ===== */
@media (prefers-reduced-motion: reduce) {
  .bsi-modal-overlay,
  .bsi-modal {
    transition-duration: 0.01ms;
  }

  .bsi-modal-overlay--slide .bsi-modal,
  .bsi-modal-overlay--scale .bsi-modal {
    transform: none;
  }
}

/* ===== PRINT ===== */
@media print {
  .bsi-modal-overlay {
    position: static;
    background: transparent;
  }

  .bsi-modal {
    box-shadow: none;
    border: 1px solid #CCCCCC;
    page-break-inside: avoid;
  }

  .bsi-modal__close {
    display: none;
  }
}

/* ===== FOCUS STATES ===== */
.bsi-modal:focus {
  outline: none;
}

.bsi-modal *:focus-visible {
  outline: 2px solid var(--color-border-focus, #BF5700);
  outline-offset: 2px;
}

/* ===== LOADING STATE (OPTIONAL) ===== */
.bsi-modal--loading .bsi-modal__body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.bsi-modal--loading .bsi-modal__body::after {
  content: '';
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-brand-blaze-primary, #BF5700);
  border-radius: 50%;
  border-top-color: transparent;
  animation: bsi-modal-spin 0.8s linear infinite;
}

@keyframes bsi-modal-spin {
  to { transform: rotate(360deg); }
}
</style>
`;
