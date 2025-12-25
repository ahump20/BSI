/**
 * Blaze Card Interactions
 *
 * Provides interactive hover effects for data cards.
 * Works with or without Three.js - gracefully degrades to CSS.
 *
 * @version 1.0.0
 */

// Logging utility
function log(level, message) {
  const prefix = '[BlazeCardInteractions]';
  if (level === 'error') console.error(prefix, message);
  else if (level === 'warn') console.warn(prefix, message);
  else console.log(prefix, message);
}

/**
 * BlazeCardInteractions - Card hover and interaction effects
 */
export class BlazeCardInteractions {
  constructor(options = {}) {
    this.options = {
      selector: options.selector || '.blaze-card',
      perspective: options.perspective ?? 1000,
      maxTilt: options.maxTilt ?? 10,
      scale: options.scale ?? 1.02,
      speed: options.speed ?? 400,
      glare: options.glare !== false,
      glareMaxOpacity: options.glareMaxOpacity ?? 0.15,
      ...options
    };

    this.cards = [];
    this.initialized = false;

    this._initialize();
  }

  _initialize() {
    try {
      const elements = document.querySelectorAll(this.options.selector);

      if (elements.length === 0) {
        log('warn', `No elements found for selector: ${this.options.selector}`);
        return;
      }

      elements.forEach(card => this._setupCard(card));

      this.initialized = true;
      log('info', `Initialized interactions for ${elements.length} cards`);

    } catch (error) {
      log('error', 'Failed to initialize: ' + error.message);
    }
  }

  _setupCard(card) {
    // Store original transform
    const originalTransform = getComputedStyle(card).transform;

    // Set perspective on parent if needed
    if (card.parentElement) {
      card.parentElement.style.perspective = `${this.options.perspective}px`;
    }

    // Add transition
    card.style.transition = `transform ${this.options.speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`;
    card.style.transformStyle = 'preserve-3d';
    card.style.willChange = 'transform';

    // Add glare overlay
    let glareElement = null;
    if (this.options.glare) {
      glareElement = document.createElement('div');
      glareElement.className = 'blaze-glare';
      glareElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, ${this.options.glareMaxOpacity}) 0%,
          transparent 50%
        );
        opacity: 0;
        transition: opacity ${this.options.speed}ms ease;
        border-radius: inherit;
        z-index: 10;
      `;
      card.style.position = 'relative';
      card.style.overflow = 'hidden';
      card.appendChild(glareElement);
    }

    // Mouse move handler
    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      const rotateX = (mouseY / (rect.height / 2)) * -this.options.maxTilt;
      const rotateY = (mouseX / (rect.width / 2)) * this.options.maxTilt;

      card.style.transform = `
        perspective(${this.options.perspective}px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale3d(${this.options.scale}, ${this.options.scale}, ${this.options.scale})
      `;

      // Update glare position
      if (glareElement) {
        const glareX = ((e.clientX - rect.left) / rect.width) * 100;
        const glareY = ((e.clientY - rect.top) / rect.height) * 100;
        glareElement.style.background = `
          radial-gradient(
            circle at ${glareX}% ${glareY}%,
            rgba(255, 255, 255, ${this.options.glareMaxOpacity}) 0%,
            transparent 50%
          )
        `;
        glareElement.style.opacity = '1';
      }
    };

    // Mouse enter handler
    const handleMouseEnter = () => {
      card.style.transition = `transform ${this.options.speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`;
    };

    // Mouse leave handler
    const handleMouseLeave = () => {
      card.style.transform = originalTransform === 'none' ? '' : originalTransform;
      if (glareElement) {
        glareElement.style.opacity = '0';
      }
    };

    // Attach event listeners
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    // Store for cleanup
    this.cards.push({
      element: card,
      glare: glareElement,
      handlers: { handleMouseMove, handleMouseEnter, handleMouseLeave }
    });
  }

  refresh() {
    this.dispose();
    this._initialize();
  }

  dispose() {
    this.cards.forEach(({ element, glare, handlers }) => {
      element.removeEventListener('mousemove', handlers.handleMouseMove);
      element.removeEventListener('mouseenter', handlers.handleMouseEnter);
      element.removeEventListener('mouseleave', handlers.handleMouseLeave);

      if (glare && glare.parentNode) {
        glare.parentNode.removeChild(glare);
      }
    });

    this.cards = [];
    this.initialized = false;
    log('info', 'Card interactions disposed');
  }

  isInitialized() {
    return this.initialized;
  }
}

// Export as default
export default BlazeCardInteractions;

// Make available globally
if (typeof window !== 'undefined') {
  window.BlazeCardInteractions = BlazeCardInteractions;
}
