/**
 * Blaze Postprocessing Ultra V5
 *
 * Advanced postprocessing with modern ES modules support.
 * Provides graceful degradation when postprocessing library unavailable.
 *
 * @version 5.0.0
 */

// Check for postprocessing library availability
const hasPostprocessing = typeof window !== 'undefined' && typeof window.POSTPROCESSING !== 'undefined';
const hasThree = typeof window !== 'undefined' && typeof window.THREE !== 'undefined';

// Logging utility
function log(level, message) {
  const prefix = '[BlazePostprocessingUltra]';
  if (level === 'error') console.error(prefix, message);
  else if (level === 'warn') console.warn(prefix, message);
  else console.log(prefix, message);
}

// Stub composer for graceful degradation
class StubEffectComposer {
  constructor() { this.enabled = false; }
  addPass() {}
  removePass() {}
  render() {}
  setSize() {}
  dispose() {}
}

// BSI Brand colors
const BSI_COLORS = {
  burntOrange: 0xBF5700,
  ember: 0xFF6B35,
  gold: 0xC9A227,
  copper: 0xD97B38,
  midnight: 0x0D0D0D
};

/**
 * BlazePostprocessingUltra - Advanced postprocessing pipeline
 */
export class BlazePostprocessingUltra {
  constructor(renderer, scene, camera, options = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.options = {
      bloom: options.bloom !== false,
      bloomIntensity: options.bloomIntensity ?? 0.6,
      bloomThreshold: options.bloomThreshold ?? 0.7,
      vignette: options.vignette !== false,
      vignetteIntensity: options.vignetteIntensity ?? 0.35,
      chromaticAberration: options.chromaticAberration ?? false,
      filmGrain: options.filmGrain ?? false,
      ...options
    };

    this.enabled = false;
    this.composer = null;
    this.effects = {};

    this._initialize();
  }

  _initialize() {
    if (!hasPostprocessing) {
      log('warn', 'Postprocessing library not available - effects disabled');
      this.composer = new StubEffectComposer();
      return;
    }

    if (!hasThree) {
      log('warn', 'Three.js not available - effects disabled');
      this.composer = new StubEffectComposer();
      return;
    }

    if (!this.renderer || !this.scene || !this.camera) {
      log('error', 'Missing required renderer, scene, or camera');
      this.composer = new StubEffectComposer();
      return;
    }

    try {
      const PP = window.POSTPROCESSING;

      // Create effect composer
      this.composer = new PP.EffectComposer(this.renderer, {
        frameBufferType: window.THREE.HalfFloatType
      });

      // Render pass
      const renderPass = new PP.RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      // Collect effects for combined pass
      const effectsArray = [];

      // Bloom effect
      if (this.options.bloom) {
        this.effects.bloom = new PP.BloomEffect({
          intensity: this.options.bloomIntensity,
          luminanceThreshold: this.options.bloomThreshold,
          luminanceSmoothing: 0.03,
          mipmapBlur: true,
          radius: 0.85
        });
        effectsArray.push(this.effects.bloom);
      }

      // Vignette effect
      if (this.options.vignette) {
        this.effects.vignette = new PP.VignetteEffect({
          darkness: this.options.vignetteIntensity,
          offset: 0.35
        });
        effectsArray.push(this.effects.vignette);
      }

      // Chromatic aberration (subtle)
      if (this.options.chromaticAberration) {
        this.effects.chromatic = new PP.ChromaticAberrationEffect({
          offset: new window.THREE.Vector2(0.001, 0.001)
        });
        effectsArray.push(this.effects.chromatic);
      }

      // Film grain (subtle)
      if (this.options.filmGrain) {
        this.effects.noise = new PP.NoiseEffect({
          blendFunction: PP.BlendFunction.OVERLAY
        });
        this.effects.noise.blendMode.opacity.value = 0.15;
        effectsArray.push(this.effects.noise);
      }

      // Combined effect pass
      if (effectsArray.length > 0) {
        const effectPass = new PP.EffectPass(this.camera, ...effectsArray);
        this.composer.addPass(effectPass);
      }

      this.enabled = true;
      log('info', `Postprocessing Ultra initialized with ${effectsArray.length} effects`);

    } catch (error) {
      log('error', 'Failed to initialize postprocessing: ' + error.message);
      this.composer = new StubEffectComposer();
    }
  }

  render(deltaTime = 0.016) {
    if (!this.composer) return;

    try {
      if (this.enabled && typeof this.composer.render === 'function') {
        this.composer.render(deltaTime);
      } else if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    } catch (error) {
      log('error', 'Render error: ' + error.message);
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  setSize(width, height) {
    if (this.composer?.setSize) {
      try {
        this.composer.setSize(width, height);
      } catch (error) {
        log('error', 'setSize error: ' + error.message);
      }
    }
  }

  setBloomIntensity(intensity) {
    if (this.effects.bloom) {
      this.effects.bloom.intensity = intensity;
    }
  }

  setVignetteIntensity(intensity) {
    if (this.effects.vignette) {
      this.effects.vignette.darkness = intensity;
    }
  }

  dispose() {
    if (this.composer?.dispose) {
      try {
        this.composer.dispose();
      } catch (error) {
        log('error', 'dispose error: ' + error.message);
      }
    }
    this.effects = {};
    this.composer = null;
    this.enabled = false;
    log('info', 'Postprocessing Ultra disposed');
  }

  isEnabled() {
    return this.enabled;
  }

  // Static helpers
  static get hasPostprocessing() { return hasPostprocessing; }
  static get hasThree() { return hasThree; }
  static get COLORS() { return BSI_COLORS; }
}

// Also export as default
export default BlazePostprocessingUltra;

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.BlazePostprocessingUltra = BlazePostprocessingUltra;
}
