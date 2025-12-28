/**
 * Postprocessing Fallback Shim
 *
 * Provides stub implementations when the postprocessing library fails to load.
 * This ensures the page continues to function even if the CDN is unavailable.
 *
 * Include this AFTER the CDN script tag to provide fallbacks.
 *
 * @version 1.0.0
 */

(function(global) {
  'use strict';

  // Check if postprocessing already loaded
  if (typeof global.POSTPROCESSING !== 'undefined') {
    console.log('[PostprocessingFallback] Library loaded successfully');
    return;
  }

  console.warn('[PostprocessingFallback] Postprocessing library not available - using stubs');

  // Create stub implementations
  const StubPass = function() {};
  StubPass.prototype.render = function() {};
  StubPass.prototype.setSize = function() {};
  StubPass.prototype.dispose = function() {};

  const StubEffect = function() {};
  StubEffect.prototype.dispose = function() {};

  const StubEffectComposer = function(renderer) {
    this.renderer = renderer;
    this.passes = [];
  };
  StubEffectComposer.prototype.addPass = function(pass) {
    this.passes.push(pass);
  };
  StubEffectComposer.prototype.removePass = function(pass) {
    const index = this.passes.indexOf(pass);
    if (index > -1) this.passes.splice(index, 1);
  };
  StubEffectComposer.prototype.render = function(delta) {
    // Fallback: just do basic render if renderer available
    if (this.renderer && this.passes.length > 0 && this.passes[0].scene && this.passes[0].camera) {
      this.renderer.render(this.passes[0].scene, this.passes[0].camera);
    }
  };
  StubEffectComposer.prototype.setSize = function(width, height) {};
  StubEffectComposer.prototype.dispose = function() {
    this.passes.forEach(function(pass) {
      if (pass.dispose) pass.dispose();
    });
    this.passes = [];
  };

  const StubRenderPass = function(scene, camera) {
    this.scene = scene;
    this.camera = camera;
  };
  StubRenderPass.prototype = Object.create(StubPass.prototype);

  const StubEffectPass = function(camera) {
    this.camera = camera;
  };
  StubEffectPass.prototype = Object.create(StubPass.prototype);

  // BlendFunction enum stub
  const BlendFunction = {
    SKIP: 0,
    ADD: 1,
    ALPHA: 2,
    AVERAGE: 3,
    COLOR_BURN: 4,
    COLOR_DODGE: 5,
    DARKEN: 6,
    DIFFERENCE: 7,
    EXCLUSION: 8,
    LIGHTEN: 9,
    MULTIPLY: 10,
    DIVIDE: 11,
    NEGATION: 12,
    NORMAL: 13,
    OVERLAY: 14,
    REFLECT: 15,
    SCREEN: 16,
    SOFT_LIGHT: 17,
    SUBTRACT: 18
  };

  // Stub effects
  var StubBloomEffect = function(options) {
    this.intensity = (options && options.intensity) || 1;
  };
  StubBloomEffect.prototype = Object.create(StubEffect.prototype);

  var StubVignetteEffect = function(options) {
    this.darkness = (options && options.darkness) || 0.5;
  };
  StubVignetteEffect.prototype = Object.create(StubEffect.prototype);

  var StubChromaticAberrationEffect = function(options) {};
  StubChromaticAberrationEffect.prototype = Object.create(StubEffect.prototype);

  var StubNoiseEffect = function(options) {
    this.blendMode = { opacity: { value: 0 } };
  };
  StubNoiseEffect.prototype = Object.create(StubEffect.prototype);

  var StubSMAAEffect = function() {};
  StubSMAAEffect.prototype = Object.create(StubEffect.prototype);

  // Export stubs to global POSTPROCESSING namespace
  global.POSTPROCESSING = {
    EffectComposer: StubEffectComposer,
    RenderPass: StubRenderPass,
    EffectPass: StubEffectPass,
    BloomEffect: StubBloomEffect,
    VignetteEffect: StubVignetteEffect,
    ChromaticAberrationEffect: StubChromaticAberrationEffect,
    NoiseEffect: StubNoiseEffect,
    SMAAEffect: StubSMAAEffect,
    BlendFunction: BlendFunction,
    // Mark as stub
    _isStub: true
  };

})(typeof window !== 'undefined' ? window : this);
