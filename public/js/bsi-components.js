/**
 * BSI Shared Components
 * Cinematic Grit / Texas Soil / Intel Dashboard
 *
 * Auto-injects navigation, footer, and mobile menu
 * Include at bottom of body: <script src="/js/bsi-components.js"></script>
 */

(function() {
  'use strict';

  // Configuration
  const BSI_CONFIG = {
    siteName: 'Blaze Sports Intel',
    tagline: 'Born to Blaze the Path Less Beaten',
    values: ['Courage', 'Grit', 'Leadership'],
    logoPath: '/images/bsi-logo-nav.png',
    currentYear: new Date().getFullYear()
  };

  // Navigation links
  const NAV_LINKS = [
    { href: '/', label: 'Home' },
    { href: '/college-baseball/', label: 'College Baseball' },
    { href: '/mlb/', label: 'MLB' },
    { href: '/nfl/', label: 'NFL' },
    { href: '/nil-valuation.html', label: 'NIL' },
    { href: '/pricing.html', label: 'Pricing' }
  ];

  // Footer columns
  const FOOTER_COLUMNS = [
    {
      title: 'Coverage',
      links: [
        { href: '/college-baseball/', label: 'College Baseball' },
        { href: '/mlb/', label: 'MLB Analytics' },
        { href: '/nfl/', label: 'NFL Intel' },
        { href: '/cbb/', label: 'College Basketball' },
        { href: '/cfb/', label: 'College Football' }
      ]
    },
    {
      title: 'Tools',
      links: [
        { href: '/nil-valuation.html', label: 'NIL Valuation' },
        { href: '/predict.html', label: 'Predictions' },
        { href: '/recruiting-intel.html', label: 'Recruiting' },
        { href: '/historical-research.html', label: 'Historical' }
      ]
    },
    {
      title: 'Company',
      links: [
        { href: '/about.html', label: 'About' },
        { href: '/pricing.html', label: 'Pricing' },
        { href: '/blog/', label: 'Blog' },
        { href: '/contact.html', label: 'Contact' }
      ]
    }
  ];

  // Get current path for active state
  function getCurrentPath() {
    return window.location.pathname;
  }

  // Check if link is active
  function isActive(href) {
    const current = getCurrentPath();
    if (href === '/') {
      return current === '/' || current === '/index.html';
    }
    return current.startsWith(href) || current === href;
  }

  // Create navigation HTML
  function createNavigation() {
    const currentPath = getCurrentPath();

    const navLinksHTML = NAV_LINKS.map(link => {
      const activeClass = isActive(link.href) ? ' active' : '';
      return `<a href="${link.href}" class="bsi-nav-link${activeClass}">${link.label}</a>`;
    }).join('');

    const mobileLinksHTML = NAV_LINKS.map(link => {
      return `<li><a href="${link.href}">${link.label}</a></li>`;
    }).join('');

    return `
      <nav class="bsi-nav" id="bsi-nav" role="navigation" aria-label="Main navigation">
        <div class="bsi-nav-inner">
          <a href="/" class="bsi-nav-logo" aria-label="${BSI_CONFIG.siteName} Home">
            <img src="${BSI_CONFIG.logoPath}" alt="${BSI_CONFIG.siteName}" width="32" height="32">
            <span>BSI</span>
          </a>

          <div class="bsi-nav-links">
            ${navLinksHTML}
            <button class="bsi-theme-toggle" id="bsi-theme-toggle" aria-label="Toggle dark/light mode" title="Toggle theme">
              <svg class="bsi-theme-icon bsi-theme-icon--sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              <svg class="bsi-theme-icon bsi-theme-icon--moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
            <a href="/login.html" class="bsi-btn bsi-btn-ghost">Sign In</a>
            <a href="/signup.html" class="bsi-btn bsi-btn-primary">Get Started</a>
          </div>

          <button class="bsi-menu-toggle" id="bsi-menu-toggle" aria-label="Toggle menu" aria-expanded="false">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <div class="bsi-mobile-menu" id="bsi-mobile-menu" aria-hidden="true">
        <ul>
          ${mobileLinksHTML}
          <li><a href="/login.html">Sign In</a></li>
          <li><a href="/signup.html" style="color: var(--bsi-burnt-orange);">Get Started</a></li>
          <li style="padding-top: var(--bsi-space-4); border-top: 1px solid rgba(255,255,255,0.1); margin-top: var(--bsi-space-4);">
            <button class="bsi-theme-toggle-mobile" id="bsi-theme-toggle-mobile" style="display: flex; align-items: center; gap: 0.5rem; background: none; border: none; color: var(--bsi-cream); font-family: var(--bsi-font-ui); font-size: 1rem; cursor: pointer; padding: 0;">
              <span class="bsi-theme-label">Switch to Light Mode</span>
            </button>
          </li>
        </ul>
      </div>
    `;
  }

  // Create footer HTML
  function createFooter() {
    const columnsHTML = FOOTER_COLUMNS.map(column => {
      const linksHTML = column.links.map(link =>
        `<li><a href="${link.href}">${link.label}</a></li>`
      ).join('');

      return `
        <div class="bsi-footer-column">
          <h4>${column.title}</h4>
          <ul>${linksHTML}</ul>
        </div>
      `;
    }).join('');

    const valuesHTML = BSI_CONFIG.values.map((v, i) =>
      i < BSI_CONFIG.values.length - 1 ? `<span>${v}</span><span>•</span>` : `<span>${v}</span>`
    ).join('');

    return `
      <footer class="bsi-footer" role="contentinfo">
        <div class="bsi-footer-inner">
          <div class="bsi-footer-top">
            <div class="bsi-footer-brand">
              <div class="bsi-footer-logo">
                <img src="${BSI_CONFIG.logoPath}" alt="${BSI_CONFIG.siteName}" width="40" height="40">
                <span>Blaze Sports Intel</span>
              </div>
              <p class="bsi-footer-tagline">${BSI_CONFIG.tagline}</p>
              <div class="bsi-footer-values">${valuesHTML}</div>
            </div>
            ${columnsHTML}
          </div>

          <div class="bsi-footer-bottom">
            <p>&copy; ${BSI_CONFIG.currentYear} Blaze Sports Intel. All rights reserved.</p>
            <div class="bsi-footer-legal">
              <a href="/privacy.html">Privacy Policy</a>
              <a href="/terms.html">Terms of Service</a>
              <a href="/accessibility.html">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  // Initialize navigation scroll behavior
  function initNavScroll() {
    const nav = document.getElementById('bsi-nav');
    if (!nav) return;

    let lastScroll = 0;
    const scrollThreshold = 50;

    window.addEventListener('scroll', function() {
      const currentScroll = window.pageYOffset;

      if (currentScroll > scrollThreshold) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }

      lastScroll = currentScroll;
    }, { passive: true });
  }

  // Initialize mobile menu
  function initMobileMenu() {
    const toggle = document.getElementById('bsi-menu-toggle');
    const menu = document.getElementById('bsi-mobile-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', function() {
      const isOpen = menu.classList.contains('open');

      menu.classList.toggle('open');
      toggle.classList.toggle('open');
      toggle.setAttribute('aria-expanded', !isOpen);
      menu.setAttribute('aria-hidden', isOpen);

      // Prevent body scroll when menu is open
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    // Close menu on escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });

    // Close menu on link click
    menu.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        menu.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }

  // Initialize scroll reveal animations
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.bsi-reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(function(el) {
      observer.observe(el);
    });
  }

  // Add skip link for accessibility
  function addSkipLink() {
    const main = document.querySelector('main') || document.querySelector('#main') || document.querySelector('[role="main"]');
    if (!main) return;

    if (!main.id) {
      main.id = 'main-content';
    }

    const skipLink = document.createElement('a');
    skipLink.href = '#' + main.id;
    skipLink.className = 'bsi-skip-link';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // Inject components
  function injectComponents() {
    // Check if page has custom nav (skip injection if found)
    const existingNav = document.querySelector('nav, .nav, .header, #nav, #header');
    const hasCustomNav = existingNav && !existingNav.classList.contains('bsi-nav');

    // Check if page has custom footer (skip injection if found)
    const existingFooter = document.querySelector('footer, .footer, #footer');
    const hasCustomFooter = existingFooter && !existingFooter.classList.contains('bsi-footer');

    // Only inject nav if no custom nav exists
    if (!hasCustomNav) {
      let navPlaceholder = document.getElementById('bsi-nav-placeholder');
      if (!navPlaceholder) {
        navPlaceholder = document.createElement('div');
        navPlaceholder.id = 'bsi-nav-placeholder';
        document.body.insertBefore(navPlaceholder, document.body.firstChild);
      }
      navPlaceholder.innerHTML = createNavigation();
      // Add body padding for fixed nav
      document.body.style.paddingTop = '64px';
    }

    // Only inject footer if no custom footer exists
    if (!hasCustomFooter) {
      let footerPlaceholder = document.getElementById('bsi-footer-placeholder');
      if (!footerPlaceholder) {
        footerPlaceholder = document.createElement('div');
        footerPlaceholder.id = 'bsi-footer-placeholder';
        document.body.appendChild(footerPlaceholder);
      }
      footerPlaceholder.innerHTML = createFooter();
    }
  }

  // Initialize theme toggle buttons
  function initThemeToggleButtons() {
    const desktopToggle = document.getElementById('bsi-theme-toggle');
    const mobileToggle = document.getElementById('bsi-theme-toggle-mobile');
    const mobileLabel = document.querySelector('.bsi-theme-label');

    function updateLabel() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      if (mobileLabel) {
        mobileLabel.textContent = current === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      }
    }

    if (desktopToggle) {
      desktopToggle.addEventListener('click', function() {
        toggleTheme();
        updateLabel();
      });
    }

    if (mobileToggle) {
      mobileToggle.addEventListener('click', function() {
        toggleTheme();
        updateLabel();
      });
    }

    updateLabel();
  }

  // Initialize everything when DOM is ready
  function init() {
    injectComponents();
    addSkipLink();
    initNavScroll();
    initMobileMenu();
    initScrollReveal();
    initThemeToggleButtons();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Theme toggle functionality
  function initThemeToggle() {
    // Check saved preference or system preference
    const savedTheme = localStorage.getItem('bsi-theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', theme);

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      if (!localStorage.getItem('bsi-theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('bsi-theme', next);
    return next;
  }

  // Initialize theme on load
  initThemeToggle();

  // Expose API for customization
  window.BSI = {
    config: BSI_CONFIG,
    navLinks: NAV_LINKS,
    footerColumns: FOOTER_COLUMNS,
    reinit: init,
    toggleTheme: toggleTheme
  };

})();
