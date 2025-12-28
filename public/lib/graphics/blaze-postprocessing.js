/**
 * Blaze Postprocessing Wrapper
 *
 * Provides graceful degradation for postprocessing effects.
 * If the postprocessing library fails to load (e.g., CDN 503),
 * the page continues to render without 3D effects.
 *
 * @version 2.0.0
 */

(function(global) {
  'use strict';

  // Check if postprocessing library loaded
  const hasPostprocessing = typeof global.POSTPROCESSING !== 'undefined';

  // Logging utility
  function log(level, message) {
    const prefix = '[BlazePostprocessing]';
    if (level === 'error') {
      console.error(prefix, message);
    } else if (level === 'warn') {
      console.warn(prefix, message);
    } else {
      console.log(prefix, message);
    }
  }

  // Feature detection
  const supportsWebGL2 = (function() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2'));
    } catch (e) {
      return false;
    }
  })();

  // Stub effect composer for graceful degradation
  class StubEffectComposer {
    constructor() {
      this.enabled = false;
    }
    addPass() {}
    removePass() {}
    render() {}
    setSize() {}
    dispose() {}
  }

  // Main BlazePostprocessing class
  class BlazePostprocessing {
    constructor(renderer, scene, camera, options = {}) {
      this.renderer = renderer;
      this.scene = scene;
      this.camera = camera;
      this.options = {
        bloom: options.bloom !== false,
        bloomIntensity: options.bloomIntensity || 0.5,
        bloomThreshold: options.bloomThreshold || 0.8,
        vignette: options.vignette !== false,
        vignetteIntensity: options.vignetteIntensity || 0.3,
        ...options
      };

      this.enabled = false;
      this.composer = null;

      this._initialize();
    }

    _initialize() {
      if (!hasPostprocessing) {
        log('warn', 'Postprocessing library not available - effects disabled');
        this.composer = new StubEffectComposer();
        return;
      }

      if (!supportsWebGL2) {
        log('warn', 'WebGL2 not supported - effects disabled');
        this.composer = new StubEffectComposer();
        return;
      }

      if (!this.renderer || !this.scene || !this.camera) {
        log('error', 'Missing required renderer, scene, or camera');
        this.composer = new StubEffectComposer();
        return;
      }

      try {
        const PP = global.POSTPROCESSING;

        // Create effect composer
        this.composer = new PP.EffectComposer(this.renderer);

        // Render pass
        const renderPass = new PP.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Bloom effect
        if (this.options.bloom) {
          const bloomEffect = new PP.BloomEffect({
            intensity: this.options.bloomIntensity,
            luminanceThreshold: this.options.bloomThreshold,
            luminanceSmoothing: 0.025,
            mipmapBlur: true
          });

          const bloomPass = new PP.EffectPass(this.camera, bloomEffect);
          this.composer.addPass(bloomPass);
        }

        // Vignette effect
        if (this.options.vignette) {
          const vignetteEffect = new PP.VignetteEffect({
            darkness: this.options.vignetteIntensity,
            offset: 0.3
          });

          const vignettePass = new PP.EffectPass(this.camera, vignetteEffect);
          this.composer.addPass(vignettePass);
        }

        this.enabled = true;
        log('info', 'Postprocessing initialized successfully');
      } catch (error) {
        log('error', 'Failed to initialize postprocessing: ' + error.message);
        this.composer = new StubEffectComposer();
      }
    }

    render(deltaTime) {
      if (!this.composer) return;

      try {
        if (this.enabled && this.composer.render) {
          this.composer.render(deltaTime);
        } else if (this.renderer && this.scene && this.camera) {
          // Fallback to basic rendering
          this.renderer.render(this.scene, this.camera);
        }
      } catch (error) {
        log('error', 'Render error: ' + error.message);
        // Fallback to basic rendering
        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
      }
    }

    setSize(width, height) {
      if (this.composer && this.composer.setSize) {
        try {
          this.composer.setSize(width, height);
        } catch (error) {
          log('error', 'setSize error: ' + error.message);
        }
      }
    }

    dispose() {
      if (this.composer && this.composer.dispose) {
        try {
          this.composer.dispose();
        } catch (error) {
          log('error', 'dispose error: ' + error.message);
        }
      }
      this.composer = null;
      this.enabled = false;
    }

    isEnabled() {
      return this.enabled;
    }
  }

  // Export to global scope
  global.BlazePostprocessing = BlazePostprocessing;

  // Also export status flags
  global.BlazePostprocessing.hasPostprocessing = hasPostprocessing;
  global.BlazePostprocessing.supportsWebGL2 = supportsWebGL2;

})(typeof window !== 'undefined' ? window : this);
