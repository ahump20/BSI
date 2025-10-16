/**
 * BLAZE SPORTS INTEL - PERFORMANCE OPTIMIZER
 * Championship Intelligence Platform
 * Sub-100ms Latency Optimization System
 *
 * Staff Engineer: Austin Humphrey
 * Deep South Sports Authority
 */

class PerformanceOptimizer {
  constructor() {
    this.config = {
      CACHE_STRATEGIES: {
        'static-assets': { ttl: 86400, staleWhileRevalidate: true },
        'api-responses': { ttl: 300, bypassOnCookie: true },
        'live-data': { ttl: 30, backgroundUpdate: true },
        'user-data': { ttl: 3600, privateCache: true }
      },
      PRELOAD_THRESHOLD: 500, // milliseconds
      LAZY_LOAD_MARGIN: '100px',
      CRITICAL_RESOURCES: [
        '/css/critical.css',
        '/js/core.js',
        '/js/three.min.js'
      ]
    };

    this.metrics = {
      startTime: performance.now(),
      loadTimes: new Map(),
      cacheHits: 0,
      cacheMisses: 0,
      apiLatencies: []
    };

    this.initializeOptimizations();
  }

  // Initialize all performance optimizations
  initializeOptimizations() {
    this.setupServiceWorker();
    this.implementResourceHints();
    this.optimizeImageLoading();
    this.setupLazyLoading();
    this.implementPrefetching();
    this.optimizeThreeJS();
    this.setupPerformanceMonitoring();
    this.implementCriticalResourceLoading();
  }

  // Service Worker for aggressive caching
  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      }).then(registration => {

        // Update service worker when new version available
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New version available
                this.showUpdateNotification();
              }
            }
          });
        });
      }).catch(error => {
        console.warn('Service Worker registration failed:', error);
      });
    }
  }

  // Implement resource hints for faster loading
  implementResourceHints() {
    const head = document.head;

    // DNS prefetch for external domains
    const dnsPrefetchDomains = [
      'cdnjs.cloudflare.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'cdn.jsdelivr.net',
      'api.blazesportsintel.com'
    ];

    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      head.appendChild(link);
    });

    // Preconnect to critical domains
    const preconnectDomains = [
      'https://cdnjs.cloudflare.com',
      'https://fonts.googleapis.com'
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      head.appendChild(link);
    });
  }

  // Optimize image loading with WebP and lazy loading
  optimizeImageLoading() {
    // WebP detection and implementation
    const supportsWebP = this.detectWebPSupport();

    // Intersection Observer for lazy loading
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadOptimizedImage(img, supportsWebP);
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: this.config.LAZY_LOAD_MARGIN
    });

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Detect WebP support
  detectWebPSupport() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // Load optimized images
  loadOptimizedImage(img, supportsWebP) {
    const src = img.dataset.src;
    const webpSrc = img.dataset.webp;

    const imageToLoad = supportsWebP && webpSrc ? webpSrc : src;

    // Create new image for preloading
    const newImg = new Image();
    newImg.onload = () => {
      img.src = imageToLoad;
      img.classList.add('loaded');
      this.trackLoadTime('image', imageToLoad);
    };
    newImg.onerror = () => {
      // Fallback to original source
      img.src = src;
      img.classList.add('loaded', 'error');
    };
    newImg.src = imageToLoad;
  }

  // Setup comprehensive lazy loading
  setupLazyLoading() {
    // Lazy load non-critical sections
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const section = entry.target;
          this.loadSectionContent(section);
        }
      });
    }, {
      rootMargin: '200px'
    });

    document.querySelectorAll('.lazy-section').forEach(section => {
      sectionObserver.observe(section);
    });
  }

  // Load section content dynamically
  loadSectionContent(section) {
    const contentUrl = section.dataset.content;
    if (contentUrl) {
      this.fetchWithCache(contentUrl)
        .then(content => {
          section.innerHTML = content;
          section.classList.add('loaded');
        })
        .catch(error => {
          console.warn('Failed to load section content:', error);
        });
    }
  }

  // Implement intelligent prefetching
  implementPrefetching() {
    // Prefetch likely next pages based on user behavior
    const prefetchCandidates = [
      '/analytics',
      '/dashboard',
      '/nil-calculator',
      '/api/health'
    ];

    // Intersection Observer for hover prefetching
    document.addEventListener('mouseover', (event) => {
      const link = event.target.closest('a[href]');
      if (link && !link.dataset.prefetched) {
        this.prefetchResource(link.href);
        link.dataset.prefetched = 'true';
      }
    });

    // Prefetch critical resources after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        prefetchCandidates.forEach(url => {
          this.prefetchResource(url);
        });
      }, 2000);
    });
  }

  // Prefetch resource with cache strategy
  prefetchResource(url) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }

  // Optimize Three.js performance
  optimizeThreeJS() {
    // Three.js specific optimizations
    if (window.THREE) {
      // Set appropriate pixel ratio
      const pixelRatio = Math.min(window.devicePixelRatio, 2);

      // Optimize renderer settings
      if (window.renderer) {
        window.renderer.setPixelRatio(pixelRatio);
        window.renderer.shadowMap.enabled = true;
        window.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Enable performance monitoring
        window.renderer.info.autoReset = false;
      }

      // Implement LOD (Level of Detail) for complex models
      this.implementThreeJSLOD();
    }
  }

  // Implement LOD system for Three.js
  implementThreeJSLOD() {
    if (window.THREE && window.scene) {
      const lodObjects = window.scene.children.filter(child =>
        child.userData && child.userData.enableLOD
      );

      lodObjects.forEach(object => {
        const lod = new THREE.LOD();

        // High detail (close)
        lod.addLevel(object, 0);

        // Medium detail (medium distance)
        if (object.userData.mediumLOD) {
          lod.addLevel(object.userData.mediumLOD, 50);
        }

        // Low detail (far)
        if (object.userData.lowLOD) {
          lod.addLevel(object.userData.lowLOD, 100);
        }

        window.scene.add(lod);
        window.scene.remove(object);
      });
    }
  }

  // Setup comprehensive performance monitoring
  setupPerformanceMonitoring() {
    // Core Web Vitals monitoring
    this.monitorCoreWebVitals();

    // API latency monitoring
    this.monitorAPILatency();

    // Resource loading monitoring
    this.monitorResourceLoading();

    // Memory usage monitoring
    this.monitorMemoryUsage();

    // Report metrics periodically
    setInterval(() => {
      this.reportMetrics();
    }, 30000); // Every 30 seconds
  }

  // Monitor Core Web Vitals
  monitorCoreWebVitals() {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay would be measured on actual user interaction
    }
  }

  // Monitor API latency
  monitorAPILatency() {
    // Override fetch to monitor API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const latency = endTime - startTime;

        this.metrics.apiLatencies.push({
          url: args[0],
          latency,
          timestamp: Date.now(),
          status: response.status
        });

        // Alert if latency exceeds threshold
        if (latency > 100) {
          console.warn(`⚠️ High API latency: ${latency.toFixed(2)}ms for ${args[0]}`);
        }

        return response;
      } catch (error) {
        const endTime = performance.now();
        const latency = endTime - startTime;

        this.metrics.apiLatencies.push({
          url: args[0],
          latency,
          timestamp: Date.now(),
          error: true
        });

        throw error;
      }
    };
  }

  // Monitor resource loading
  monitorResourceLoading() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackLoadTime(entry.initiatorType, entry.name, entry.duration);

          // Alert for slow resources
          if (entry.duration > 2000) {
            console.warn(`🐌 Slow resource: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  // Monitor memory usage
  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.metrics.memoryUsage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          timestamp: Date.now()
        };

        // Alert if memory usage is high
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercent > 80) {
          console.warn(`🧠 High memory usage: ${usagePercent.toFixed(2)}%`);
        }
      }, 10000); // Every 10 seconds
    }
  }

  // Implement critical resource loading
  implementCriticalResourceLoading() {
    // Load critical CSS inline
    this.inlineCriticalCSS();

    // Defer non-critical CSS
    this.deferNonCriticalCSS();

    // Optimize font loading
    this.optimizeFontLoading();
  }

  // Inline critical CSS
  inlineCriticalCSS() {
    const criticalCSS = `
      /* Critical above-the-fold styles */
      .hero-section { display: flex; min-height: 100vh; }
      .nav-header { position: fixed; top: 0; width: 100%; z-index: 1000; }
      .loading-spinner { display: inline-block; animation: spin 1s linear infinite; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.appendChild(style);
  }

  // Defer non-critical CSS
  deferNonCriticalCSS() {
    const nonCriticalCSS = document.querySelectorAll('link[rel="stylesheet"][data-defer]');

    window.addEventListener('load', () => {
      nonCriticalCSS.forEach(link => {
        link.rel = 'stylesheet';
        link.removeAttribute('data-defer');
      });
    });
  }

  // Optimize font loading
  optimizeFontLoading() {
    if ('fonts' in document) {
      // Preload critical fonts
      const criticalFonts = [
        'Inter',
        'Bebas Neue',
        'Oswald'
      ];

      criticalFonts.forEach(fontFamily => {
        document.fonts.load(`1em ${fontFamily}`).then(() => {
        });
      });
    }
  }

  // Fetch with intelligent caching
  async fetchWithCache(url, options = {}) {
    const cacheKey = `fetch_${url}`;
    const strategy = this.getCacheStrategy(url);

    // Check cache first
    if ('caches' in window) {
      const cache = await caches.open('blaze-api-cache');
      const cachedResponse = await cache.match(url);

      if (cachedResponse) {
        this.metrics.cacheHits++;

        // Return cached response if still fresh
        const cacheDate = new Date(cachedResponse.headers.get('date'));
        const age = Date.now() - cacheDate.getTime();

        if (age < strategy.ttl * 1000) {
          return cachedResponse.text();
        }
      }
    }

    // Fetch fresh data
    this.metrics.cacheMisses++;
    const response = await fetch(url, options);

    // Cache the response
    if (response.ok && 'caches' in window) {
      const cache = await caches.open('blaze-api-cache');
      cache.put(url, response.clone());
    }

    return response.text();
  }

  // Get cache strategy for URL
  getCacheStrategy(url) {
    if (url.includes('/api/')) {
      return this.config.CACHE_STRATEGIES['api-responses'];
    } else if (url.includes('/live/')) {
      return this.config.CACHE_STRATEGIES['live-data'];
    } else if (url.match(/\.(js|css|png|jpg|webp)$/)) {
      return this.config.CACHE_STRATEGIES['static-assets'];
    } else {
      return this.config.CACHE_STRATEGIES['user-data'];
    }
  }

  // Track load times
  trackLoadTime(type, resource, duration = null) {
    const loadTime = duration || (performance.now() - this.metrics.startTime);

    if (!this.metrics.loadTimes.has(type)) {
      this.metrics.loadTimes.set(type, []);
    }

    this.metrics.loadTimes.get(type).push({
      resource,
      time: loadTime,
      timestamp: Date.now()
    });
  }

  // Report metrics to analytics
  reportMetrics() {
    const report = {
      timestamp: Date.now(),
      loadTimes: Object.fromEntries(this.metrics.loadTimes),
      cacheStats: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRatio: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
      },
      apiLatencies: this.metrics.apiLatencies.slice(-10), // Last 10 calls
      memoryUsage: this.metrics.memoryUsage,
      coreWebVitals: {
        fcp: this.metrics.fcp,
        lcp: this.metrics.lcp
      }
    };

    // Send to analytics endpoint
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/performance', JSON.stringify(report));
    }

  }

  // Show update notification
  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <span>🚀 New version available! Refresh for latest features.</span>
        <button onclick="window.location.reload()">Refresh</button>
      </div>
    `;
    document.body.appendChild(notification);
  }

  // Get performance score
  getPerformanceScore() {
    const avgApiLatency = this.metrics.apiLatencies.length > 0 ?
      this.metrics.apiLatencies.reduce((sum, call) => sum + call.latency, 0) / this.metrics.apiLatencies.length : 0;

    const cacheHitRatio = this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0;

    const score = {
      apiLatency: avgApiLatency < 100 ? 'excellent' : avgApiLatency < 300 ? 'good' : 'needs_improvement',
      cachePerformance: cacheHitRatio > 0.8 ? 'excellent' : cacheHitRatio > 0.6 ? 'good' : 'needs_improvement',
      fcp: this.metrics.fcp < 1800 ? 'excellent' : this.metrics.fcp < 3000 ? 'good' : 'needs_improvement',
      lcp: this.metrics.lcp < 2500 ? 'excellent' : this.metrics.lcp < 4000 ? 'good' : 'needs_improvement'
    };

    return score;
  }
}

// Initialize performance optimizer when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.blazePerformanceOptimizer = new PerformanceOptimizer();
  });
} else {
  window.blazePerformanceOptimizer = new PerformanceOptimizer();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceOptimizer;
}