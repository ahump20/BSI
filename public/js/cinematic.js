/**
 * BLAZE SPORTS INTEL - Cinematic Layer
 * =====================================
 * JavaScript utilities for cinematic visual effects.
 * Include this file on any static HTML page to enable effects.
 *
 * Features:
 * - Custom cursor (disabled on touch devices)
 * - Scroll reveal animations (IntersectionObserver)
 * - Noise overlay (CSS-only, auto-enabled)
 *
 * Usage:
 * <script src="/js/cinematic.js" defer></script>
 *
 * Optional: Add data attributes to configure
 * data-no-cursor - Disable custom cursor on this page
 * data-no-reveal - Disable scroll reveal on this page
 */

(function() {
  'use strict';

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const html = document.documentElement;

  // =========================================================================
  // CUSTOM CURSOR
  // =========================================================================

  function initCustomCursor() {
    if (prefersReducedMotion || isTouchDevice || html.dataset.noCursor !== undefined) {
      return;
    }

    // Create cursor elements
    const dot = document.createElement('div');
    const outline = document.createElement('div');
    dot.className = 'cursor-dot';
    outline.className = 'cursor-outline';
    document.body.appendChild(dot);
    document.body.appendChild(outline);

    // Hide default cursor
    document.body.style.cursor = 'none';

    let mouseX = 0;
    let mouseY = 0;
    let outlineX = 0;
    let outlineY = 0;

    // Update cursor position
    document.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
    });

    // Smooth outline follow
    function animateOutline() {
      outlineX += (mouseX - outlineX) * 0.15;
      outlineY += (mouseY - outlineY) * 0.15;
      outline.style.left = outlineX + 'px';
      outline.style.top = outlineY + 'px';
      requestAnimationFrame(animateOutline);
    }
    animateOutline();

    // Hover effects
    function addHoverListeners() {
      const interactiveElements = document.querySelectorAll('a, button, [role="button"], input, textarea, select, .image-frame, .blaze-card');
      interactiveElements.forEach(function(el) {
        el.addEventListener('mouseenter', function() {
          outline.classList.add('expanded');
        });
        el.addEventListener('mouseleave', function() {
          outline.classList.remove('expanded');
        });
      });
    }

    addHoverListeners();

    // Re-attach on DOM changes
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // =========================================================================
  // SCROLL REVEAL
  // =========================================================================

  function initScrollReveal() {
    if (prefersReducedMotion || html.dataset.noReveal !== undefined) {
      // If reduced motion, just show everything
      document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-up').forEach(function(el) {
        el.style.opacity = '1';
      });
      return;
    }

    const revealElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-up');

    if (revealElements.length === 0) return;

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '-50px 0px'
    });

    revealElements.forEach(function(el) {
      observer.observe(el);
    });
  }

  // =========================================================================
  // TICKER AUTO-DUPLICATE
  // =========================================================================

  function initTicker() {
    const tickerMoves = document.querySelectorAll('.ticker-move');
    tickerMoves.forEach(function(ticker) {
      // Duplicate content for seamless loop
      if (!ticker.dataset.duplicated) {
        ticker.innerHTML += ticker.innerHTML;
        ticker.dataset.duplicated = 'true';
      }
    });
  }

  // =========================================================================
  // INIT
  // =========================================================================

  function init() {
    initCustomCursor();
    initScrollReveal();
    initTicker();
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
