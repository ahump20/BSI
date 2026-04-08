var t = Object.defineProperty,
  e = (e, n, s) =>
    ((e, n, s) =>
      n in e
        ? t(e, n, { enumerable: !0, configurable: !0, writable: !0, value: s })
        : (e[n] = s))(e, "symbol" != typeof n ? n + "" : n, s);
import "./vendor/modulepreload-polyfill-YP0FEG5d.js";
import {
  SESSION_PHASES,
  advanceGameStateForPlate,
  advanceDerbyState,
  buildLeaderboardMetadata,
  buildTeamGameplayProfile,
  computeCoinReward,
  computeRankedScore,
  computeTargetRuns,
  createFallbackTeamProfile,
  createInitialGameState,
  createSessionSeed,
  evaluateSwingContact,
  getDifficultyPreset,
  isGameOver,
  mapContactTierToLegacyQuality,
  resolveBallInPlay,
} from "./core.js";
import {
  M as n,
  O as s,
  B as o,
  F as i,
  S as a,
  U as r,
  V as l,
  W as c,
  H as h,
  N as u,
  C as d,
  a as p,
  b as m,
  A as f,
  c as g,
  T as b,
  d as y,
  e as w,
  L as x,
  f as v,
  g as A,
  h as T,
  i as S,
  j as M,
  k as C,
  P as k,
  D as R,
  I as P,
  Q as E,
  l as B,
  m as I,
  n as _,
  o as L,
  p as F,
  q as O,
  r as N,
  s as z,
  t as D,
  u as H,
  v as U,
  w as G,
  x as V,
  R as q,
  y as j,
  z as W,
  E as K,
  G as Y,
  J as $,
  K as X,
  X as Z,
  Y as Q,
  Z as J,
  _ as tt,
  $ as et,
  a0 as nt,
  a1 as st,
  a2 as ot,
  a3 as it,
  a4 as at,
  a5 as rt,
  a6 as lt,
  a7 as ct,
  a8 as ht,
  a9 as ut,
  aa as dt,
  ab as pt,
  ac as mt,
  ad as ft,
  ae as gt,
  af as bt,
  ag as yt,
  ah as wt,
  ai as xt,
  aj as vt,
  ak as At,
  al as Tt,
  am as St,
  an as Mt,
  ao as Ct,
  ap as kt,
  aq as Rt,
  ar as Pt,
  as as Et,
  at as Bt,
  au as It,
  av as _t,
  aw as Lt,
  ax as Ft,
  ay as Ot,
  az as Nt,
  aA as zt,
  aB as Dt,
  aC as Ht,
  aD as Ut,
  aE as Gt,
  aF as Vt,
  aG as qt,
} from "./vendor/three-CvQ0iah0.js";
const GsAsset = (t) => `${import.meta.env.BASE_URL}${String(t).replace(/^\/+/, "")}`;
const jt = {
  name: "CopyShader",
  uniforms: { tDiffuse: { value: null }, opacity: { value: 1 } },
  vertexShader:
    "\n\n\t\tvarying vec2 vUv;\n\n\t\tvoid main() {\n\n\t\t\tvUv = uv;\n\t\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n\t\t}",
  fragmentShader:
    "\n\n\t\tuniform float opacity;\n\n\t\tuniform sampler2D tDiffuse;\n\n\t\tvarying vec2 vUv;\n\n\t\tvoid main() {\n\n\t\t\tvec4 texel = texture2D( tDiffuse, vUv );\n\t\t\tgl_FragColor = opacity * texel;\n\n\n\t\t}",
};
class Wt {
  constructor() {
    ((this.isPass = !0),
      (this.enabled = !0),
      (this.needsSwap = !0),
      (this.clear = !1),
      (this.renderToScreen = !1));
  }
  setSize() {}
  render() {}
  dispose() {}
}
const Kt = new s(-1, 1, 1, -1, 0, 1);
const Yt = new (class extends o {
  constructor() {
    (super(),
      this.setAttribute("position", new i([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3)),
      this.setAttribute("uv", new i([0, 2, 0, 0, 2, 0], 2)));
  }
})();
class $t {
  constructor(t) {
    this._mesh = new n(Yt, t);
  }
  dispose() {
    this._mesh.geometry.dispose();
  }
  render(t) {
    t.render(this._mesh, Kt);
  }
  get material() {
    return this._mesh.material;
  }
  set material(t) {
    this._mesh.material = t;
  }
}
class Xt extends Wt {
  constructor(t, e) {
    (super(),
      (this.textureID = void 0 !== e ? e : "tDiffuse"),
      t instanceof a
        ? ((this.uniforms = t.uniforms), (this.material = t))
        : t &&
          ((this.uniforms = r.clone(t.uniforms)),
          (this.material = new a({
            name: void 0 !== t.name ? t.name : "unspecified",
            defines: Object.assign({}, t.defines),
            uniforms: this.uniforms,
            vertexShader: t.vertexShader,
            fragmentShader: t.fragmentShader,
          }))),
      (this.fsQuad = new $t(this.material)));
  }
  render(t, e, n) {
    (this.uniforms[this.textureID] &&
      (this.uniforms[this.textureID].value = n.texture),
      (this.fsQuad.material = this.material),
      this.renderToScreen
        ? (t.setRenderTarget(null), this.fsQuad.render(t))
        : (t.setRenderTarget(e),
          this.clear &&
            t.clear(t.autoClearColor, t.autoClearDepth, t.autoClearStencil),
          this.fsQuad.render(t)));
  }
  dispose() {
    (this.material.dispose(), this.fsQuad.dispose());
  }
}
class Zt extends Wt {
  constructor(t, e) {
    (super(),
      (this.scene = t),
      (this.camera = e),
      (this.clear = !0),
      (this.needsSwap = !1),
      (this.inverse = !1));
  }
  render(t, e, n) {
    const s = t.getContext(),
      o = t.state;
    let i, a;
    (o.buffers.color.setMask(!1),
      o.buffers.depth.setMask(!1),
      o.buffers.color.setLocked(!0),
      o.buffers.depth.setLocked(!0),
      this.inverse ? ((i = 0), (a = 1)) : ((i = 1), (a = 0)),
      o.buffers.stencil.setTest(!0),
      o.buffers.stencil.setOp(s.REPLACE, s.REPLACE, s.REPLACE),
      o.buffers.stencil.setFunc(s.ALWAYS, i, 4294967295),
      o.buffers.stencil.setClear(a),
      o.buffers.stencil.setLocked(!0),
      t.setRenderTarget(n),
      this.clear && t.clear(),
      t.render(this.scene, this.camera),
      t.setRenderTarget(e),
      this.clear && t.clear(),
      t.render(this.scene, this.camera),
      o.buffers.color.setLocked(!1),
      o.buffers.depth.setLocked(!1),
      o.buffers.color.setMask(!0),
      o.buffers.depth.setMask(!0),
      o.buffers.stencil.setLocked(!1),
      o.buffers.stencil.setFunc(s.EQUAL, 1, 4294967295),
      o.buffers.stencil.setOp(s.KEEP, s.KEEP, s.KEEP),
      o.buffers.stencil.setLocked(!0));
  }
}
class Qt extends Wt {
  constructor() {
    (super(), (this.needsSwap = !1));
  }
  render(t) {
    (t.state.buffers.stencil.setLocked(!1),
      t.state.buffers.stencil.setTest(!1));
  }
}
class Jt {
  constructor(t, e) {
    if (
      ((this.renderer = t),
      (this._pixelRatio = t.getPixelRatio()),
      void 0 === e)
    ) {
      const n = t.getSize(new l());
      ((this._width = n.width),
        (this._height = n.height),
        ((e = new c(
          this._width * this._pixelRatio,
          this._height * this._pixelRatio,
          { type: h },
        )).texture.name = "EffectComposer.rt1"));
    } else ((this._width = e.width), (this._height = e.height));
    ((this.renderTarget1 = e),
      (this.renderTarget2 = e.clone()),
      (this.renderTarget2.texture.name = "EffectComposer.rt2"),
      (this.writeBuffer = this.renderTarget1),
      (this.readBuffer = this.renderTarget2),
      (this.renderToScreen = !0),
      (this.passes = []),
      (this.copyPass = new Xt(jt)),
      (this.copyPass.material.blending = u),
      (this.clock = new d()));
  }
  swapBuffers() {
    const t = this.readBuffer;
    ((this.readBuffer = this.writeBuffer), (this.writeBuffer = t));
  }
  addPass(t) {
    (this.passes.push(t),
      t.setSize(
        this._width * this._pixelRatio,
        this._height * this._pixelRatio,
      ));
  }
  insertPass(t, e) {
    (this.passes.splice(e, 0, t),
      t.setSize(
        this._width * this._pixelRatio,
        this._height * this._pixelRatio,
      ));
  }
  removePass(t) {
    const e = this.passes.indexOf(t);
    -1 !== e && this.passes.splice(e, 1);
  }
  isLastEnabledPass(t) {
    for (let e = t + 1; e < this.passes.length; e++)
      if (this.passes[e].enabled) return !1;
    return !0;
  }
  render(t) {
    void 0 === t && (t = this.clock.getDelta());
    const e = this.renderer.getRenderTarget();
    let n = !1;
    for (let s = 0, o = this.passes.length; s < o; s++) {
      const e = this.passes[s];
      if (!1 !== e.enabled) {
        if (
          ((e.renderToScreen =
            this.renderToScreen && this.isLastEnabledPass(s)),
          e.render(this.renderer, this.writeBuffer, this.readBuffer, t, n),
          e.needsSwap)
        ) {
          if (n) {
            const e = this.renderer.getContext(),
              n = this.renderer.state.buffers.stencil;
            (n.setFunc(e.NOTEQUAL, 1, 4294967295),
              this.copyPass.render(
                this.renderer,
                this.writeBuffer,
                this.readBuffer,
                t,
              ),
              n.setFunc(e.EQUAL, 1, 4294967295));
          }
          this.swapBuffers();
        }
        void 0 !== Zt &&
          (e instanceof Zt ? (n = !0) : e instanceof Qt && (n = !1));
      }
    }
    this.renderer.setRenderTarget(e);
  }
  reset(t) {
    if (void 0 === t) {
      const e = this.renderer.getSize(new l());
      ((this._pixelRatio = this.renderer.getPixelRatio()),
        (this._width = e.width),
        (this._height = e.height),
        (t = this.renderTarget1.clone()).setSize(
          this._width * this._pixelRatio,
          this._height * this._pixelRatio,
        ));
    }
    (this.renderTarget1.dispose(),
      this.renderTarget2.dispose(),
      (this.renderTarget1 = t),
      (this.renderTarget2 = t.clone()),
      (this.writeBuffer = this.renderTarget1),
      (this.readBuffer = this.renderTarget2));
  }
  setSize(t, e) {
    ((this._width = t), (this._height = e));
    const n = this._width * this._pixelRatio,
      s = this._height * this._pixelRatio;
    (this.renderTarget1.setSize(n, s), this.renderTarget2.setSize(n, s));
    for (let o = 0; o < this.passes.length; o++) this.passes[o].setSize(n, s);
  }
  setPixelRatio(t) {
    ((this._pixelRatio = t), this.setSize(this._width, this._height));
  }
  dispose() {
    (this.renderTarget1.dispose(),
      this.renderTarget2.dispose(),
      this.copyPass.dispose());
  }
}
class te extends Wt {
  constructor(t, e, n = null, s = null, o = null) {
    (super(),
      (this.scene = t),
      (this.camera = e),
      (this.overrideMaterial = n),
      (this.clearColor = s),
      (this.clearAlpha = o),
      (this.clear = !0),
      (this.clearDepth = !1),
      (this.needsSwap = !1),
      (this._oldClearColor = new p()));
  }
  render(t, e, n) {
    const s = t.autoClear;
    let o, i;
    ((t.autoClear = !1),
      null !== this.overrideMaterial &&
        ((i = this.scene.overrideMaterial),
        (this.scene.overrideMaterial = this.overrideMaterial)),
      null !== this.clearColor &&
        (t.getClearColor(this._oldClearColor),
        t.setClearColor(this.clearColor)),
      null !== this.clearAlpha &&
        ((o = t.getClearAlpha()), t.setClearAlpha(this.clearAlpha)),
      1 == this.clearDepth && t.clearDepth(),
      t.setRenderTarget(this.renderToScreen ? null : n),
      !0 === this.clear &&
        t.clear(t.autoClearColor, t.autoClearDepth, t.autoClearStencil),
      t.render(this.scene, this.camera),
      null !== this.clearColor && t.setClearColor(this._oldClearColor),
      null !== this.clearAlpha && t.setClearAlpha(o),
      null !== this.overrideMaterial && (this.scene.overrideMaterial = i),
      (t.autoClear = s));
  }
}
const ee = {
  uniforms: {
    tDiffuse: { value: null },
    luminosityThreshold: { value: 1 },
    smoothWidth: { value: 1 },
    defaultColor: { value: new p(0) },
    defaultOpacity: { value: 0 },
  },
  vertexShader:
    "\n\n\t\tvarying vec2 vUv;\n\n\t\tvoid main() {\n\n\t\t\tvUv = uv;\n\n\t\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n\t\t}",
  fragmentShader:
    "\n\n\t\tuniform sampler2D tDiffuse;\n\t\tuniform vec3 defaultColor;\n\t\tuniform float defaultOpacity;\n\t\tuniform float luminosityThreshold;\n\t\tuniform float smoothWidth;\n\n\t\tvarying vec2 vUv;\n\n\t\tvoid main() {\n\n\t\t\tvec4 texel = texture2D( tDiffuse, vUv );\n\n\t\t\tvec3 luma = vec3( 0.299, 0.587, 0.114 );\n\n\t\t\tfloat v = dot( texel.xyz, luma );\n\n\t\t\tvec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );\n\n\t\t\tfloat alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );\n\n\t\t\tgl_FragColor = mix( outputColor, texel, alpha );\n\n\t\t}",
};
class ne extends Wt {
  constructor(t, e, n, s) {
    (super(),
      (this.strength = void 0 !== e ? e : 1),
      (this.radius = n),
      (this.threshold = s),
      (this.resolution = void 0 !== t ? new l(t.x, t.y) : new l(256, 256)),
      (this.clearColor = new p(0, 0, 0)),
      (this.renderTargetsHorizontal = []),
      (this.renderTargetsVertical = []),
      (this.nMips = 5));
    let o = Math.round(this.resolution.x / 2),
      i = Math.round(this.resolution.y / 2);
    ((this.renderTargetBright = new c(o, i, { type: h })),
      (this.renderTargetBright.texture.name = "UnrealBloomPass.bright"),
      (this.renderTargetBright.texture.generateMipmaps = !1));
    for (let a = 0; a < this.nMips; a++) {
      const t = new c(o, i, { type: h });
      ((t.texture.name = "UnrealBloomPass.h" + a),
        (t.texture.generateMipmaps = !1),
        this.renderTargetsHorizontal.push(t));
      const e = new c(o, i, { type: h });
      ((e.texture.name = "UnrealBloomPass.v" + a),
        (e.texture.generateMipmaps = !1),
        this.renderTargetsVertical.push(e),
        (o = Math.round(o / 2)),
        (i = Math.round(i / 2)));
    }
    const u = ee;
    ((this.highPassUniforms = r.clone(u.uniforms)),
      (this.highPassUniforms.luminosityThreshold.value = s),
      (this.highPassUniforms.smoothWidth.value = 0.01),
      (this.materialHighPassFilter = new a({
        uniforms: this.highPassUniforms,
        vertexShader: u.vertexShader,
        fragmentShader: u.fragmentShader,
      })),
      (this.separableBlurMaterials = []));
    const d = [3, 5, 7, 9, 11];
    ((o = Math.round(this.resolution.x / 2)),
      (i = Math.round(this.resolution.y / 2)));
    for (let a = 0; a < this.nMips; a++)
      (this.separableBlurMaterials.push(this.getSeperableBlurMaterial(d[a])),
        (this.separableBlurMaterials[a].uniforms.invSize.value = new l(
          1 / o,
          1 / i,
        )),
        (o = Math.round(o / 2)),
        (i = Math.round(i / 2)));
    ((this.compositeMaterial = this.getCompositeMaterial(this.nMips)),
      (this.compositeMaterial.uniforms.blurTexture1.value =
        this.renderTargetsVertical[0].texture),
      (this.compositeMaterial.uniforms.blurTexture2.value =
        this.renderTargetsVertical[1].texture),
      (this.compositeMaterial.uniforms.blurTexture3.value =
        this.renderTargetsVertical[2].texture),
      (this.compositeMaterial.uniforms.blurTexture4.value =
        this.renderTargetsVertical[3].texture),
      (this.compositeMaterial.uniforms.blurTexture5.value =
        this.renderTargetsVertical[4].texture),
      (this.compositeMaterial.uniforms.bloomStrength.value = e),
      (this.compositeMaterial.uniforms.bloomRadius.value = 0.1));
    ((this.compositeMaterial.uniforms.bloomFactors.value = [
      1, 0.8, 0.6, 0.4, 0.2,
    ]),
      (this.bloomTintColors = [
        new m(1, 1, 1),
        new m(1, 1, 1),
        new m(1, 1, 1),
        new m(1, 1, 1),
        new m(1, 1, 1),
      ]),
      (this.compositeMaterial.uniforms.bloomTintColors.value =
        this.bloomTintColors));
    const b = jt;
    ((this.copyUniforms = r.clone(b.uniforms)),
      (this.blendMaterial = new a({
        uniforms: this.copyUniforms,
        vertexShader: b.vertexShader,
        fragmentShader: b.fragmentShader,
        blending: f,
        depthTest: !1,
        depthWrite: !1,
        transparent: !0,
      })),
      (this.enabled = !0),
      (this.needsSwap = !1),
      (this._oldClearColor = new p()),
      (this.oldClearAlpha = 1),
      (this.basic = new g()),
      (this.fsQuad = new $t(null)));
  }
  dispose() {
    for (let t = 0; t < this.renderTargetsHorizontal.length; t++)
      this.renderTargetsHorizontal[t].dispose();
    for (let t = 0; t < this.renderTargetsVertical.length; t++)
      this.renderTargetsVertical[t].dispose();
    this.renderTargetBright.dispose();
    for (let t = 0; t < this.separableBlurMaterials.length; t++)
      this.separableBlurMaterials[t].dispose();
    (this.compositeMaterial.dispose(),
      this.blendMaterial.dispose(),
      this.basic.dispose(),
      this.fsQuad.dispose());
  }
  setSize(t, e) {
    let n = Math.round(t / 2),
      s = Math.round(e / 2);
    this.renderTargetBright.setSize(n, s);
    for (let o = 0; o < this.nMips; o++)
      (this.renderTargetsHorizontal[o].setSize(n, s),
        this.renderTargetsVertical[o].setSize(n, s),
        (this.separableBlurMaterials[o].uniforms.invSize.value = new l(
          1 / n,
          1 / s,
        )),
        (n = Math.round(n / 2)),
        (s = Math.round(s / 2)));
  }
  render(t, e, n, s, o) {
    (t.getClearColor(this._oldClearColor),
      (this.oldClearAlpha = t.getClearAlpha()));
    const i = t.autoClear;
    ((t.autoClear = !1),
      t.setClearColor(this.clearColor, 0),
      o && t.state.buffers.stencil.setTest(!1),
      this.renderToScreen &&
        ((this.fsQuad.material = this.basic),
        (this.basic.map = n.texture),
        t.setRenderTarget(null),
        t.clear(),
        this.fsQuad.render(t)),
      (this.highPassUniforms.tDiffuse.value = n.texture),
      (this.highPassUniforms.luminosityThreshold.value = this.threshold),
      (this.fsQuad.material = this.materialHighPassFilter),
      t.setRenderTarget(this.renderTargetBright),
      t.clear(),
      this.fsQuad.render(t));
    let a = this.renderTargetBright;
    for (let r = 0; r < this.nMips; r++)
      ((this.fsQuad.material = this.separableBlurMaterials[r]),
        (this.separableBlurMaterials[r].uniforms.colorTexture.value =
          a.texture),
        (this.separableBlurMaterials[r].uniforms.direction.value =
          ne.BlurDirectionX),
        t.setRenderTarget(this.renderTargetsHorizontal[r]),
        t.clear(),
        this.fsQuad.render(t),
        (this.separableBlurMaterials[r].uniforms.colorTexture.value =
          this.renderTargetsHorizontal[r].texture),
        (this.separableBlurMaterials[r].uniforms.direction.value =
          ne.BlurDirectionY),
        t.setRenderTarget(this.renderTargetsVertical[r]),
        t.clear(),
        this.fsQuad.render(t),
        (a = this.renderTargetsVertical[r]));
    ((this.fsQuad.material = this.compositeMaterial),
      (this.compositeMaterial.uniforms.bloomStrength.value = this.strength),
      (this.compositeMaterial.uniforms.bloomRadius.value = this.radius),
      (this.compositeMaterial.uniforms.bloomTintColors.value =
        this.bloomTintColors),
      t.setRenderTarget(this.renderTargetsHorizontal[0]),
      t.clear(),
      this.fsQuad.render(t),
      (this.fsQuad.material = this.blendMaterial),
      (this.copyUniforms.tDiffuse.value =
        this.renderTargetsHorizontal[0].texture),
      o && t.state.buffers.stencil.setTest(!0),
      this.renderToScreen
        ? (t.setRenderTarget(null), this.fsQuad.render(t))
        : (t.setRenderTarget(n), this.fsQuad.render(t)),
      t.setClearColor(this._oldClearColor, this.oldClearAlpha),
      (t.autoClear = i));
  }
  getSeperableBlurMaterial(t) {
    const e = [];
    for (let n = 0; n < t; n++)
      e.push((0.39894 * Math.exp((-0.5 * n * n) / (t * t))) / t);
    return new a({
      defines: { KERNEL_RADIUS: t },
      uniforms: {
        colorTexture: { value: null },
        invSize: { value: new l(0.5, 0.5) },
        direction: { value: new l(0.5, 0.5) },
        gaussianCoefficients: { value: e },
      },
      vertexShader:
        "varying vec2 vUv;\n\t\t\t\tvoid main() {\n\t\t\t\t\tvUv = uv;\n\t\t\t\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\t\t\t\t}",
      fragmentShader:
        "#include <common>\n\t\t\t\tvarying vec2 vUv;\n\t\t\t\tuniform sampler2D colorTexture;\n\t\t\t\tuniform vec2 invSize;\n\t\t\t\tuniform vec2 direction;\n\t\t\t\tuniform float gaussianCoefficients[KERNEL_RADIUS];\n\n\t\t\t\tvoid main() {\n\t\t\t\t\tfloat weightSum = gaussianCoefficients[0];\n\t\t\t\t\tvec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;\n\t\t\t\t\tfor( int i = 1; i < KERNEL_RADIUS; i ++ ) {\n\t\t\t\t\t\tfloat x = float(i);\n\t\t\t\t\t\tfloat w = gaussianCoefficients[i];\n\t\t\t\t\t\tvec2 uvOffset = direction * invSize * x;\n\t\t\t\t\t\tvec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;\n\t\t\t\t\t\tvec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;\n\t\t\t\t\t\tdiffuseSum += (sample1 + sample2) * w;\n\t\t\t\t\t\tweightSum += 2.0 * w;\n\t\t\t\t\t}\n\t\t\t\t\tgl_FragColor = vec4(diffuseSum/weightSum, 1.0);\n\t\t\t\t}",
    });
  }
  getCompositeMaterial(t) {
    return new a({
      defines: { NUM_MIPS: t },
      uniforms: {
        blurTexture1: { value: null },
        blurTexture2: { value: null },
        blurTexture3: { value: null },
        blurTexture4: { value: null },
        blurTexture5: { value: null },
        bloomStrength: { value: 1 },
        bloomFactors: { value: null },
        bloomTintColors: { value: null },
        bloomRadius: { value: 0 },
      },
      vertexShader:
        "varying vec2 vUv;\n\t\t\t\tvoid main() {\n\t\t\t\t\tvUv = uv;\n\t\t\t\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\t\t\t\t}",
      fragmentShader:
        "varying vec2 vUv;\n\t\t\t\tuniform sampler2D blurTexture1;\n\t\t\t\tuniform sampler2D blurTexture2;\n\t\t\t\tuniform sampler2D blurTexture3;\n\t\t\t\tuniform sampler2D blurTexture4;\n\t\t\t\tuniform sampler2D blurTexture5;\n\t\t\t\tuniform float bloomStrength;\n\t\t\t\tuniform float bloomRadius;\n\t\t\t\tuniform float bloomFactors[NUM_MIPS];\n\t\t\t\tuniform vec3 bloomTintColors[NUM_MIPS];\n\n\t\t\t\tfloat lerpBloomFactor(const in float factor) {\n\t\t\t\t\tfloat mirrorFactor = 1.2 - factor;\n\t\t\t\t\treturn mix(factor, mirrorFactor, bloomRadius);\n\t\t\t\t}\n\n\t\t\t\tvoid main() {\n\t\t\t\t\tgl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +\n\t\t\t\t\t\tlerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +\n\t\t\t\t\t\tlerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +\n\t\t\t\t\t\tlerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +\n\t\t\t\t\t\tlerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );\n\t\t\t\t}",
    });
  }
}
function se(t, e) {
  if (e === b) return t;
  if (e === y || e === w) {
    let n = t.getIndex();
    if (null === n) {
      const e = [],
        s = t.getAttribute("position");
      if (void 0 === s) return t;
      for (let t = 0; t < s.count; t++) e.push(t);
      (t.setIndex(e), (n = t.getIndex()));
    }
    const s = n.count - 2,
      o = [];
    if (e === y)
      for (let t = 1; t <= s; t++)
        (o.push(n.getX(0)), o.push(n.getX(t)), o.push(n.getX(t + 1)));
    else
      for (let t = 0; t < s; t++)
        t % 2 == 0
          ? (o.push(n.getX(t)), o.push(n.getX(t + 1)), o.push(n.getX(t + 2)))
          : (o.push(n.getX(t + 2)), o.push(n.getX(t + 1)), o.push(n.getX(t)));
    o.length;
    const i = t.clone();
    return (i.setIndex(o), i.clearGroups(), i);
  }
  return t;
}
((ne.BlurDirectionX = new l(1, 0)), (ne.BlurDirectionY = new l(0, 1)));
class oe extends x {
  constructor(t) {
    (super(t),
      (this.dracoLoader = null),
      (this.ktx2Loader = null),
      (this.meshoptDecoder = null),
      (this.pluginCallbacks = []),
      this.register(function (t) {
        return new he(t);
      }),
      this.register(function (t) {
        return new we(t);
      }),
      this.register(function (t) {
        return new xe(t);
      }),
      this.register(function (t) {
        return new ve(t);
      }),
      this.register(function (t) {
        return new de(t);
      }),
      this.register(function (t) {
        return new pe(t);
      }),
      this.register(function (t) {
        return new me(t);
      }),
      this.register(function (t) {
        return new fe(t);
      }),
      this.register(function (t) {
        return new ce(t);
      }),
      this.register(function (t) {
        return new ge(t);
      }),
      this.register(function (t) {
        return new ue(t);
      }),
      this.register(function (t) {
        return new ye(t);
      }),
      this.register(function (t) {
        return new be(t);
      }),
      this.register(function (t) {
        return new re(t);
      }),
      this.register(function (t) {
        return new Ae(t);
      }),
      this.register(function (t) {
        return new Te(t);
      }));
  }
  load(t, e, n, s) {
    const o = this;
    let i;
    if ("" !== this.resourcePath) i = this.resourcePath;
    else if ("" !== this.path) {
      const e = v.extractUrlBase(t);
      i = v.resolveURL(e, this.path);
    } else i = v.extractUrlBase(t);
    this.manager.itemStart(t);
    const a = function (e) {
        (s && s(e), o.manager.itemError(t), o.manager.itemEnd(t));
      },
      r = new A(this.manager);
    (r.setPath(this.path),
      r.setResponseType("arraybuffer"),
      r.setRequestHeader(this.requestHeader),
      r.setWithCredentials(this.withCredentials),
      r.load(
        t,
        function (n) {
          try {
            o.parse(
              n,
              i,
              function (n) {
                (e(n), o.manager.itemEnd(t));
              },
              a,
            );
          } catch (s) {
            a(s);
          }
        },
        n,
        a,
      ));
  }
  setDRACOLoader(t) {
    return ((this.dracoLoader = t), this);
  }
  setDDSLoader() {
    throw new Error(
      'THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".',
    );
  }
  setKTX2Loader(t) {
    return ((this.ktx2Loader = t), this);
  }
  setMeshoptDecoder(t) {
    return ((this.meshoptDecoder = t), this);
  }
  register(t) {
    return (
      -1 === this.pluginCallbacks.indexOf(t) && this.pluginCallbacks.push(t),
      this
    );
  }
  unregister(t) {
    return (
      -1 !== this.pluginCallbacks.indexOf(t) &&
        this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(t), 1),
      this
    );
  }
  parse(t, e, n, s) {
    let o;
    const i = {},
      a = {},
      r = new TextDecoder();
    if ("string" == typeof t) o = JSON.parse(t);
    else if (t instanceof ArrayBuffer) {
      if (r.decode(new Uint8Array(t, 0, 4)) === Se) {
        try {
          i[ae.KHR_BINARY_GLTF] = new ke(t);
        } catch (c) {
          return void (s && s(c));
        }
        o = JSON.parse(i[ae.KHR_BINARY_GLTF].content);
      } else o = JSON.parse(r.decode(t));
    } else o = t;
    if (void 0 === o.asset || o.asset.version[0] < 2)
      return void (
        s &&
        s(
          new Error(
            "THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.",
          ),
        )
      );
    const l = new Je(o, {
      path: e || this.resourcePath || "",
      crossOrigin: this.crossOrigin,
      requestHeader: this.requestHeader,
      manager: this.manager,
      ktx2Loader: this.ktx2Loader,
      meshoptDecoder: this.meshoptDecoder,
    });
    l.fileLoader.setRequestHeader(this.requestHeader);
    for (let h = 0; h < this.pluginCallbacks.length; h++) {
      const t = this.pluginCallbacks[h](l);
      (t.name, (a[t.name] = t), (i[t.name] = !0));
    }
    if (o.extensionsUsed)
      for (let h = 0; h < o.extensionsUsed.length; ++h) {
        const t = o.extensionsUsed[h],
          e = o.extensionsRequired || [];
        switch (t) {
          case ae.KHR_MATERIALS_UNLIT:
            i[t] = new le();
            break;
          case ae.KHR_DRACO_MESH_COMPRESSION:
            i[t] = new Re(o, this.dracoLoader);
            break;
          case ae.KHR_TEXTURE_TRANSFORM:
            i[t] = new Pe();
            break;
          case ae.KHR_MESH_QUANTIZATION:
            i[t] = new Ee();
            break;
          default:
            e.indexOf(t) >= 0 && a[t];
        }
      }
    (l.setExtensions(i), l.setPlugins(a), l.parse(n, s));
  }
  parseAsync(t, e) {
    const n = this;
    return new Promise(function (s, o) {
      n.parse(t, e, s, o);
    });
  }
}
function ie() {
  let t = {};
  return {
    get: function (e) {
      return t[e];
    },
    add: function (e, n) {
      t[e] = n;
    },
    remove: function (e) {
      delete t[e];
    },
    removeAll: function () {
      t = {};
    },
  };
}
const ae = {
  KHR_BINARY_GLTF: "KHR_binary_glTF",
  KHR_DRACO_MESH_COMPRESSION: "KHR_draco_mesh_compression",
  KHR_LIGHTS_PUNCTUAL: "KHR_lights_punctual",
  KHR_MATERIALS_CLEARCOAT: "KHR_materials_clearcoat",
  KHR_MATERIALS_IOR: "KHR_materials_ior",
  KHR_MATERIALS_SHEEN: "KHR_materials_sheen",
  KHR_MATERIALS_SPECULAR: "KHR_materials_specular",
  KHR_MATERIALS_TRANSMISSION: "KHR_materials_transmission",
  KHR_MATERIALS_IRIDESCENCE: "KHR_materials_iridescence",
  KHR_MATERIALS_ANISOTROPY: "KHR_materials_anisotropy",
  KHR_MATERIALS_UNLIT: "KHR_materials_unlit",
  KHR_MATERIALS_VOLUME: "KHR_materials_volume",
  KHR_TEXTURE_BASISU: "KHR_texture_basisu",
  KHR_TEXTURE_TRANSFORM: "KHR_texture_transform",
  KHR_MESH_QUANTIZATION: "KHR_mesh_quantization",
  KHR_MATERIALS_EMISSIVE_STRENGTH: "KHR_materials_emissive_strength",
  EXT_MATERIALS_BUMP: "EXT_materials_bump",
  EXT_TEXTURE_WEBP: "EXT_texture_webp",
  EXT_TEXTURE_AVIF: "EXT_texture_avif",
  EXT_MESHOPT_COMPRESSION: "EXT_meshopt_compression",
  EXT_MESH_GPU_INSTANCING: "EXT_mesh_gpu_instancing",
};
class re {
  constructor(t) {
    ((this.parser = t),
      (this.name = ae.KHR_LIGHTS_PUNCTUAL),
      (this.cache = { refs: {}, uses: {} }));
  }
  _markDefs() {
    const t = this.parser,
      e = this.parser.json.nodes || [];
    for (let n = 0, s = e.length; n < s; n++) {
      const s = e[n];
      s.extensions &&
        s.extensions[this.name] &&
        void 0 !== s.extensions[this.name].light &&
        t._addNodeRef(this.cache, s.extensions[this.name].light);
    }
  }
  _loadLight(t) {
    const e = this.parser,
      n = "light:" + t;
    let s = e.cache.get(n);
    if (s) return s;
    const o = e.json,
      i = (((o.extensions && o.extensions[this.name]) || {}).lights || [])[t];
    let a;
    const r = new p(16777215);
    void 0 !== i.color && r.setRGB(i.color[0], i.color[1], i.color[2], S);
    const l = void 0 !== i.range ? i.range : 0;
    switch (i.type) {
      case "directional":
        ((a = new R(r)), a.target.position.set(0, 0, -1), a.add(a.target));
        break;
      case "point":
        ((a = new k(r)), (a.distance = l));
        break;
      case "spot":
        ((a = new C(r)),
          (a.distance = l),
          (i.spot = i.spot || {}),
          (i.spot.innerConeAngle =
            void 0 !== i.spot.innerConeAngle ? i.spot.innerConeAngle : 0),
          (i.spot.outerConeAngle =
            void 0 !== i.spot.outerConeAngle
              ? i.spot.outerConeAngle
              : Math.PI / 4),
          (a.angle = i.spot.outerConeAngle),
          (a.penumbra = 1 - i.spot.innerConeAngle / i.spot.outerConeAngle),
          a.target.position.set(0, 0, -1),
          a.add(a.target));
        break;
      default:
        throw new Error("THREE.GLTFLoader: Unexpected light type: " + i.type);
    }
    return (
      a.position.set(0, 0, 0),
      (a.decay = 2),
      Ke(a, i),
      void 0 !== i.intensity && (a.intensity = i.intensity),
      (a.name = e.createUniqueName(i.name || "light_" + t)),
      (s = Promise.resolve(a)),
      e.cache.add(n, s),
      s
    );
  }
  getDependency(t, e) {
    if ("light" === t) return this._loadLight(e);
  }
  createNodeAttachment(t) {
    const e = this,
      n = this.parser,
      s = n.json.nodes[t],
      o = ((s.extensions && s.extensions[this.name]) || {}).light;
    return void 0 === o
      ? null
      : this._loadLight(o).then(function (t) {
          return n._getNodeRef(e.cache, o, t);
        });
  }
}
class le {
  constructor() {
    this.name = ae.KHR_MATERIALS_UNLIT;
  }
  getMaterialType() {
    return g;
  }
  extendParams(t, e, n) {
    const s = [];
    ((t.color = new p(1, 1, 1)), (t.opacity = 1));
    const o = e.pbrMetallicRoughness;
    if (o) {
      if (Array.isArray(o.baseColorFactor)) {
        const e = o.baseColorFactor;
        (t.color.setRGB(e[0], e[1], e[2], S), (t.opacity = e[3]));
      }
      void 0 !== o.baseColorTexture &&
        s.push(n.assignTexture(t, "map", o.baseColorTexture, M));
    }
    return Promise.all(s);
  }
}
class ce {
  constructor(t) {
    ((this.parser = t), (this.name = ae.KHR_MATERIALS_EMISSIVE_STRENGTH));
  }
  extendMaterialParams(t, e) {
    const n = this.parser.json.materials[t];
    if (!n.extensions || !n.extensions[this.name]) return Promise.resolve();
    const s = n.extensions[this.name].emissiveStrength;
    return (void 0 !== s && (e.emissiveIntensity = s), Promise.resolve());
  }
}
class he {
  constructor(t) {
    ((this.parser = t), (this.name = ae.KHR_MATERIALS_CLEARCOAT));
  }
  getMaterialType(t) {
    const e = this.parser.json.materials[t];
    return e.extensions && e.extensions[this.name] ? T : null;
  }
  extendMaterialParams(t, e) {
    const n = this.parser,
      s = n.json.materials[t];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const o = [],
      i = s.extensions[this.name];
    if (
      (void 0 !== i.clearcoatFactor && (e.clearcoat = i.clearcoatFactor),
      void 0 !== i.clearcoatTexture &&
        o.push(n.assignTexture(e, "clearcoatMap", i.clearcoatTexture)),
      void 0 !== i.clearcoatRoughnessFactor &&
        (e.clearcoatRoughness = i.clearcoatRoughnessFactor),
      void 0 !== i.clearcoatRoughnessTexture &&
        o.push(
          n.assignTexture(
            e,
            "clearcoatRoughnessMap",
            i.clearcoatRoughnessTexture,
          ),
        ),
      void 0 !== i.clearcoatNormalTexture &&
        (o.push(
          n.assignTexture(e, "clearcoatNormalMap", i.clearcoatNormalTexture),
        ),
        void 0 !== i.clearcoatNormalTexture.scale))
    ) {
      const t = i.clearcoatNormalTexture.scale;
      e.clearcoatNormalScale = new l(t, t);
    }
    return Promise.all(o);
  }
}
class ue {
  constructor(t) {
    ((this.parser = t), (this.name = ae.KHR_MATERIALS_IRIDESCENCE));
  }
  getMaterialType(t) {
    const e = this.parser.json.materials[t];
    return e.extensions && e.extensions[this.name] ? T : null;
  }
  extendMaterialParams(t, e) {
    const n = this.parser,
      s = n.json.materials[t];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const o = [],
      i = s.extensions[this.name];
    return (
      void 0 !== i.iridescenceFactor && (e.iridescence = i.iridescenceFactor),
      void 0 !== i.iridescenceTexture &&
        o.push(n.assignTexture(e, "iridescenceMap", i.iridescenceTexture)),
      void 0 !== i.iridescenceIor && (e.iridescenceIOR = i.iridescenceIor),
      void 0 === e.iridescenceThicknessRange &&
        (e.iridescenceThicknessRange = [100, 400]),
      void 0 !== i.iridescenceThicknessMinimum &&
        (e.iridescenceThicknessRange[0] = i.iridescenceThicknessMinimum),
      void 0 !== i.iridescenceThicknessMaximum &&
        (e.iridescenceThicknessRange[1] = i.iridescenceThicknessMaximum),
      void 0 !== i.iridescenceThicknessTexture &&
        o.push(
          n.assignTexture(
            e,
            "iridescenceThicknessMap",
            i.iridescenceThicknessTexture,
          ),
        ),
      Promise.all(o)
    );
  }
}
class de {
  constructor(t) {
    ((this.parser = t), (this.name = ae.KHR_MATERIALS_SHEEN));
  }
  getMaterialType(t) {
    const e = this.parser.json.materials[t];
    return e.extensions && e.extensions[this.name] ? T : null;
  }
  extendMaterialParams(t, e) {
    const n = this.parser,
      s = n.json.materials[t];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const o = [];
    ((e.sheenColor = new p(0, 0, 0)), (e.sheenRoughness = 0), (e.sheen = 1));
    const i = s.extensions[this.name];
    if (void 0 !== i.sheenColorFactor) {
      const t = i.sheenColorFactor;
      e.sheenColor.setRGB(t[0], t[1], t[2], S);
    }
    return (
      void 0 !== i.sheenRoughnessFactor &&
        (e.sheenRoughness = i.sheenRoughnessFactor),
      void 0 !== i.sheenColorTexture &&
        o.push(n.assignTexture(e, "sheenColorMap", i.sheenColorTexture, M)),
      void 0 !== i.sheenRoughnessTexture &&
        o.push(
          n.assignTexture(e, "sheenRoughnessMap", i.sheenRoughnessTexture),
        ),
      Promise.all(o)
    );
  }
}
class pe {
  constructor(t) {
    ((this.parser = t), (this.name = ae.KHR_MATERIALS_TRANSMISSION));
  }
  getMaterialType(t) {
    const e = this.parser.json.materials[t];
    return e.extensions && e.extensions[this.name] ? T : null;
  }
  extendMaterialParams(t, e) {
    const n = this.parser,
      s = n.json.materials[t];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const o = [],
      i = s.extensions[this.name];
    return (
      void 0 !== i.transmissionFactor &&
        (e.transmission = i.transmissionFactor),
      void 0 !== i.transmissionTexture &&
        o.push(n.assignTexture(e, "transmissionMap", i.transmissionTexture)),
      Promise.all(o)
    );
  }
}
class me {
  constructor(t) {
    ((this.parser = t), (this.name = ae.KHR_MATERIALS_VOLUME));
  }
  getMaterialType(t) {
    const e = this.parser.json.materials[t];
    return e.extensions && e.extensions[this.name] ? T : null;
  }
  extendMaterialParams(t, e) {
    const n = this.parser,
      s = n.json.materials[t];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const o = [],
      i = s.extensions[this.name];
    ((e.thickness = void 0 !== i.thicknessFactor ? i.thicknessFactor : 0),
      void 0 !== i.thicknessTexture &&
        o.push(n.assignTexture(e, "thicknessMap", i.thicknessTexture)),
      (e.attenuationDistance = i.attenuationDistance || 1 / 0));
    const a = i.attenuationColor || [1, 1, 1];
    return (
      (e.attenuationColor = new p().setRGB(a[0], a[1], a[2], S)),
      Promise.all(o)
    );
  }
}
class fe {
  constructor(t) {
    ((this.parser = t), (this.name = ae.KHR_MATERIALS_IOR));
  }
  getMaterialType(t) {
    const e = this.parser.json.materials[t];
    return e.extensions && e.extensions[this.name] ? T : null;
  }
  extendMaterialParams(t, e) {
    const n = this.parser.json.materials[t];
    if (!n.extensions || !n.extensions[this.name]) return Promise.resolve();
    const s = n.extensions[this.name];
    return ((e.ior = void 0 !== s.ior ? s.ior : 1.5), Promise.resolve());
  }
}
class ge {
  constructor(t) {
    ((this.parser = t), (this.name = ae.KHR_MATERIALS_SPECULAR));
  }
  getMaterialType(t) {
    const e = this.parser.json.materials[t];
    return e.extensions && e.extensions[this.name] ? T : null;
  }
  extendMaterialParams(t, e) {
    const n = this.parser,
      s = n.json.materials[t];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const o = [],
      i = s.extensions[this.name];
    ((e.specularIntensity = void 0 !== i.specularFactor ? i.specularFactor : 1),
      void 0 !== i.specularTexture &&
        o.push(n.assignTexture(e, "specularIntensityMap", i.specularTexture)));
    const a = i.specularColorFactor || [1, 1, 1];
    return (
      (e.specularColor = new p().setRGB(a[0], a[1], a[2], S)),
      void 0 !== i.specularColorTexture &&
        o.push(
          n.assignTexture(e, "specularColorMap", i.specularColorTexture, M),
        ),
      Promise.all(o)
    );
  }
}
class be {
  constructor(t) {
    ((this.parser = t), (this.name = ae.EXT_MATERIALS_BUMP));
  }
  getMaterialType(t) {
    const e = this.parser.json.materials[t];
    return e.extensions && e.extensions[this.name] ? T : null;
  }
  extendMaterialParams(t, e) {
    const n = this.parser,
      s = n.json.materials[t];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const o = [],
      i = s.extensions[this.name];
    return (
      (e.bumpScale = void 0 !== i.bumpFactor ? i.bumpFactor : 1),
      void 0 !== i.bumpTexture &&
        o.push(n.assignTexture(e, "bumpMap", i.bumpTexture)),
      Promise.all(o)
    );
  }
}
class ye {
  constructor(t) {
    ((this.parser = t), (this.name = ae.KHR_MATERIALS_ANISOTROPY));
  }
  getMaterialType(t) {
    const e = this.parser.json.materials[t];
    return e.extensions && e.extensions[this.name] ? T : null;
  }
  extendMaterialParams(t, e) {
    const n = this.parser,
      s = n.json.materials[t];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const o = [],
      i = s.extensions[this.name];
    return (
      void 0 !== i.anisotropyStrength && (e.anisotropy = i.anisotropyStrength),
      void 0 !== i.anisotropyRotation &&
        (e.anisotropyRotation = i.anisotropyRotation),
      void 0 !== i.anisotropyTexture &&
        o.push(n.assignTexture(e, "anisotropyMap", i.anisotropyTexture)),
      Promise.all(o)
    );
  }
}
class we {
  constructor(t) {
    ((this.parser = t), (this.name = ae.KHR_TEXTURE_BASISU));
  }
  loadTexture(t) {
    const e = this.parser,
      n = e.json,
      s = n.textures[t];
    if (!s.extensions || !s.extensions[this.name]) return null;
    const o = s.extensions[this.name],
      i = e.options.ktx2Loader;
    if (!i) {
      if (n.extensionsRequired && n.extensionsRequired.indexOf(this.name) >= 0)
        throw new Error(
          "THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures",
        );
      return null;
    }
    return e.loadTextureImage(t, o.source, i);
  }
}
class xe {
  constructor(t) {
    ((this.parser = t),
      (this.name = ae.EXT_TEXTURE_WEBP),
      (this.isSupported = null));
  }
  loadTexture(t) {
    const e = this.name,
      n = this.parser,
      s = n.json,
      o = s.textures[t];
    if (!o.extensions || !o.extensions[e]) return null;
    const i = o.extensions[e],
      a = s.images[i.source];
    let r = n.textureLoader;
    if (a.uri) {
      const t = n.options.manager.getHandler(a.uri);
      null !== t && (r = t);
    }
    return this.detectSupport().then(function (o) {
      if (o) return n.loadTextureImage(t, i.source, r);
      if (s.extensionsRequired && s.extensionsRequired.indexOf(e) >= 0)
        throw new Error(
          "THREE.GLTFLoader: WebP required by asset but unsupported.",
        );
      return n.loadTexture(t);
    });
  }
  detectSupport() {
    return (
      this.isSupported ||
        (this.isSupported = new Promise(function (t) {
          const e = new Image();
          ((e.src =
            "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA"),
            (e.onload = e.onerror =
              function () {
                t(1 === e.height);
              }));
        })),
      this.isSupported
    );
  }
}
class ve {
  constructor(t) {
    ((this.parser = t),
      (this.name = ae.EXT_TEXTURE_AVIF),
      (this.isSupported = null));
  }
  loadTexture(t) {
    const e = this.name,
      n = this.parser,
      s = n.json,
      o = s.textures[t];
    if (!o.extensions || !o.extensions[e]) return null;
    const i = o.extensions[e],
      a = s.images[i.source];
    let r = n.textureLoader;
    if (a.uri) {
      const t = n.options.manager.getHandler(a.uri);
      null !== t && (r = t);
    }
    return this.detectSupport().then(function (o) {
      if (o) return n.loadTextureImage(t, i.source, r);
      if (s.extensionsRequired && s.extensionsRequired.indexOf(e) >= 0)
        throw new Error(
          "THREE.GLTFLoader: AVIF required by asset but unsupported.",
        );
      return n.loadTexture(t);
    });
  }
  detectSupport() {
    return (
      this.isSupported ||
        (this.isSupported = new Promise(function (t) {
          const e = new Image();
          ((e.src =
            "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI="),
            (e.onload = e.onerror =
              function () {
                t(1 === e.height);
              }));
        })),
      this.isSupported
    );
  }
}
class Ae {
  constructor(t) {
    ((this.name = ae.EXT_MESHOPT_COMPRESSION), (this.parser = t));
  }
  loadBufferView(t) {
    const e = this.parser.json,
      n = e.bufferViews[t];
    if (n.extensions && n.extensions[this.name]) {
      const t = n.extensions[this.name],
        s = this.parser.getDependency("buffer", t.buffer),
        o = this.parser.options.meshoptDecoder;
      if (!o || !o.supported) {
        if (
          e.extensionsRequired &&
          e.extensionsRequired.indexOf(this.name) >= 0
        )
          throw new Error(
            "THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files",
          );
        return null;
      }
      return s.then(function (e) {
        const n = t.byteOffset || 0,
          s = t.byteLength || 0,
          i = t.count,
          a = t.byteStride,
          r = new Uint8Array(e, n, s);
        return o.decodeGltfBufferAsync
          ? o
              .decodeGltfBufferAsync(i, a, r, t.mode, t.filter)
              .then(function (t) {
                return t.buffer;
              })
          : o.ready.then(function () {
              const e = new ArrayBuffer(i * a);
              return (
                o.decodeGltfBuffer(
                  new Uint8Array(e),
                  i,
                  a,
                  r,
                  t.mode,
                  t.filter,
                ),
                e
              );
            });
      });
    }
    return null;
  }
}
class Te {
  constructor(t) {
    ((this.name = ae.EXT_MESH_GPU_INSTANCING), (this.parser = t));
  }
  createNodeMesh(t) {
    const e = this.parser.json,
      n = e.nodes[t];
    if (!n.extensions || !n.extensions[this.name] || void 0 === n.mesh)
      return null;
    const s = e.meshes[n.mesh];
    for (const r of s.primitives)
      if (
        r.mode !== Le.TRIANGLES &&
        r.mode !== Le.TRIANGLE_STRIP &&
        r.mode !== Le.TRIANGLE_FAN &&
        void 0 !== r.mode
      )
        return null;
    const o = n.extensions[this.name].attributes,
      i = [],
      a = {};
    for (const r in o)
      i.push(
        this.parser
          .getDependency("accessor", o[r])
          .then((t) => ((a[r] = t), a[r])),
      );
    return i.length < 1
      ? null
      : (i.push(this.parser.createNodeMesh(t)),
        Promise.all(i).then((t) => {
          const e = t.pop(),
            n = e.isGroup ? e.children : [e],
            s = t[0].count,
            o = [];
          for (const i of n) {
            const t = new B(),
              e = new m(),
              n = new E(),
              r = new m(1, 1, 1),
              l = new P(i.geometry, i.material, s);
            for (let o = 0; o < s; o++)
              (a.TRANSLATION && e.fromBufferAttribute(a.TRANSLATION, o),
                a.ROTATION && n.fromBufferAttribute(a.ROTATION, o),
                a.SCALE && r.fromBufferAttribute(a.SCALE, o),
                l.setMatrixAt(o, t.compose(e, n, r)));
            for (const s in a)
              if ("_COLOR_0" === s) {
                const t = a[s];
                l.instanceColor = new I(t.array, t.itemSize, t.normalized);
              } else
                "TRANSLATION" !== s &&
                  "ROTATION" !== s &&
                  "SCALE" !== s &&
                  i.geometry.setAttribute(s, a[s]);
            (_.prototype.copy.call(l, i),
              this.parser.assignFinalMaterial(l),
              o.push(l));
          }
          return e.isGroup ? (e.clear(), e.add(...o), e) : o[0];
        }));
  }
}
const Se = "glTF",
  Me = 1313821514,
  Ce = 5130562;
class ke {
  constructor(t) {
    ((this.name = ae.KHR_BINARY_GLTF),
      (this.content = null),
      (this.body = null));
    const e = new DataView(t, 0, 12),
      n = new TextDecoder();
    if (
      ((this.header = {
        magic: n.decode(new Uint8Array(t.slice(0, 4))),
        version: e.getUint32(4, !0),
        length: e.getUint32(8, !0),
      }),
      this.header.magic !== Se)
    )
      throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");
    if (this.header.version < 2)
      throw new Error("THREE.GLTFLoader: Legacy binary file detected.");
    const s = this.header.length - 12,
      o = new DataView(t, 12);
    let i = 0;
    for (; i < s; ) {
      const e = o.getUint32(i, !0);
      i += 4;
      const s = o.getUint32(i, !0);
      if (((i += 4), s === Me)) {
        const s = new Uint8Array(t, 12 + i, e);
        this.content = n.decode(s);
      } else if (s === Ce) {
        const n = 12 + i;
        this.body = t.slice(n, n + e);
      }
      i += e;
    }
    if (null === this.content)
      throw new Error("THREE.GLTFLoader: JSON content not found.");
  }
}
class Re {
  constructor(t, e) {
    if (!e)
      throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");
    ((this.name = ae.KHR_DRACO_MESH_COMPRESSION),
      (this.json = t),
      (this.dracoLoader = e),
      this.dracoLoader.preload());
  }
  decodePrimitive(t, e) {
    const n = this.json,
      s = this.dracoLoader,
      o = t.extensions[this.name].bufferView,
      i = t.extensions[this.name].attributes,
      a = {},
      r = {},
      l = {};
    for (const c in i) {
      const t = De[c] || c.toLowerCase();
      a[t] = i[c];
    }
    for (const c in t.attributes) {
      const e = De[c] || c.toLowerCase();
      if (void 0 !== i[c]) {
        const s = n.accessors[t.attributes[c]],
          o = Fe[s.componentType];
        ((l[e] = o.name), (r[e] = !0 === s.normalized));
      }
    }
    return e.getDependency("bufferView", o).then(function (t) {
      return new Promise(function (e, n) {
        s.decodeDracoFile(
          t,
          function (t) {
            for (const e in t.attributes) {
              const n = t.attributes[e],
                s = r[e];
              void 0 !== s && (n.normalized = s);
            }
            e(t);
          },
          a,
          l,
          S,
          n,
        );
      });
    });
  }
}
class Pe {
  constructor() {
    this.name = ae.KHR_TEXTURE_TRANSFORM;
  }
  extendTexture(t, e) {
    return (void 0 !== e.texCoord && e.texCoord !== t.channel) ||
      void 0 !== e.offset ||
      void 0 !== e.rotation ||
      void 0 !== e.scale
      ? ((t = t.clone()),
        void 0 !== e.texCoord && (t.channel = e.texCoord),
        void 0 !== e.offset && t.offset.fromArray(e.offset),
        void 0 !== e.rotation && (t.rotation = e.rotation),
        void 0 !== e.scale && t.repeat.fromArray(e.scale),
        (t.needsUpdate = !0),
        t)
      : t;
  }
}
class Ee {
  constructor() {
    this.name = ae.KHR_MESH_QUANTIZATION;
  }
}
class Be extends wt {
  constructor(t, e, n, s) {
    super(t, e, n, s);
  }
  copySampleValue_(t) {
    const e = this.resultBuffer,
      n = this.sampleValues,
      s = this.valueSize,
      o = t * s * 3 + s;
    for (let i = 0; i !== s; i++) e[i] = n[o + i];
    return e;
  }
  interpolate_(t, e, n, s) {
    const o = this.resultBuffer,
      i = this.sampleValues,
      a = this.valueSize,
      r = 2 * a,
      l = 3 * a,
      c = s - e,
      h = (n - e) / c,
      u = h * h,
      d = u * h,
      p = t * l,
      m = p - l,
      f = -2 * d + 3 * u,
      g = d - u,
      b = 1 - f,
      y = g - u + h;
    for (let w = 0; w !== a; w++) {
      const t = i[m + w + a],
        e = i[m + w + r] * c,
        n = i[p + w + a],
        s = i[p + w] * c;
      o[w] = b * t + y * e + f * n + g * s;
    }
    return o;
  }
}
const Ie = new E();
class _e extends Be {
  interpolate_(t, e, n, s) {
    const o = super.interpolate_(t, e, n, s);
    return (Ie.fromArray(o).normalize().toArray(o), o);
  }
}
const Le = {
    POINTS: 0,
    LINES: 1,
    LINE_LOOP: 2,
    LINE_STRIP: 3,
    TRIANGLES: 4,
    TRIANGLE_STRIP: 5,
    TRIANGLE_FAN: 6,
  },
  Fe = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
  },
  Oe = { 9728: V, 9729: G, 9984: U, 9985: H, 9986: D, 9987: z },
  Ne = { 33071: W, 33648: j, 10497: q },
  ze = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 },
  De = {
    POSITION: "position",
    NORMAL: "normal",
    TANGENT: "tangent",
    TEXCOORD_0: "uv",
    TEXCOORD_1: "uv1",
    TEXCOORD_2: "uv2",
    TEXCOORD_3: "uv3",
    COLOR_0: "color",
    WEIGHTS_0: "skinWeight",
    JOINTS_0: "skinIndex",
  },
  He = {
    scale: "scale",
    translation: "position",
    rotation: "quaternion",
    weights: "morphTargetInfluences",
  },
  Ue = { CUBICSPLINE: void 0, LINEAR: ut, STEP: ht },
  Ge = "OPAQUE",
  Ve = "MASK",
  qe = "BLEND";
function je(t) {
  return (
    void 0 === t.DefaultMaterial &&
      (t.DefaultMaterial = new X({
        color: 16777215,
        emissive: 0,
        metalness: 1,
        roughness: 1,
        transparent: !1,
        depthTest: !0,
        side: yt,
      })),
    t.DefaultMaterial
  );
}
function We(t, e, n) {
  for (const s in n.extensions)
    void 0 === t[s] &&
      ((e.userData.gltfExtensions = e.userData.gltfExtensions || {}),
      (e.userData.gltfExtensions[s] = n.extensions[s]));
}
function Ke(t, e) {
  void 0 !== e.extras &&
    "object" == typeof e.extras &&
    Object.assign(t.userData, e.extras);
}
function Ye(t, e) {
  if ((t.updateMorphTargets(), void 0 !== e.weights))
    for (let n = 0, s = e.weights.length; n < s; n++)
      t.morphTargetInfluences[n] = e.weights[n];
  if (e.extras && Array.isArray(e.extras.targetNames)) {
    const n = e.extras.targetNames;
    if (t.morphTargetInfluences.length === n.length) {
      t.morphTargetDictionary = {};
      for (let e = 0, s = n.length; e < s; e++)
        t.morphTargetDictionary[n[e]] = e;
    }
  }
}
function $e(t) {
  let e;
  const n = t.extensions && t.extensions[ae.KHR_DRACO_MESH_COMPRESSION];
  if (
    ((e = n
      ? "draco:" + n.bufferView + ":" + n.indices + ":" + Xe(n.attributes)
      : t.indices + ":" + Xe(t.attributes) + ":" + t.mode),
    void 0 !== t.targets)
  )
    for (let s = 0, o = t.targets.length; s < o; s++)
      e += ":" + Xe(t.targets[s]);
  return e;
}
function Xe(t) {
  let e = "";
  const n = Object.keys(t).sort();
  for (let s = 0, o = n.length; s < o; s++) e += n[s] + ":" + t[n[s]] + ";";
  return e;
}
function Ze(t) {
  switch (t) {
    case Int8Array:
      return 1 / 127;
    case Uint8Array:
      return 1 / 255;
    case Int16Array:
      return 1 / 32767;
    case Uint16Array:
      return 1 / 65535;
    default:
      throw new Error(
        "THREE.GLTFLoader: Unsupported normalized accessor component type.",
      );
  }
}
const Qe = new B();
class Je {
  constructor(t = {}, e = {}) {
    ((this.json = t),
      (this.extensions = {}),
      (this.plugins = {}),
      (this.options = e),
      (this.cache = new ie()),
      (this.associations = new Map()),
      (this.primitiveCache = {}),
      (this.nodeCache = {}),
      (this.meshCache = { refs: {}, uses: {} }),
      (this.cameraCache = { refs: {}, uses: {} }),
      (this.lightCache = { refs: {}, uses: {} }),
      (this.sourceCache = {}),
      (this.textureCache = {}),
      (this.nodeNamesUsed = {}));
    let n = !1,
      s = !1,
      o = -1;
    ("undefined" != typeof navigator &&
      ((n = !0 === /^((?!chrome|android).)*safari/i.test(navigator.userAgent)),
      (s = navigator.userAgent.indexOf("Firefox") > -1),
      (o = s ? navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1] : -1)),
      "undefined" == typeof createImageBitmap || n || (s && o < 98)
        ? (this.textureLoader = new L(this.options.manager))
        : (this.textureLoader = new F(this.options.manager)),
      this.textureLoader.setCrossOrigin(this.options.crossOrigin),
      this.textureLoader.setRequestHeader(this.options.requestHeader),
      (this.fileLoader = new A(this.options.manager)),
      this.fileLoader.setResponseType("arraybuffer"),
      "use-credentials" === this.options.crossOrigin &&
        this.fileLoader.setWithCredentials(!0));
  }
  setExtensions(t) {
    this.extensions = t;
  }
  setPlugins(t) {
    this.plugins = t;
  }
  parse(t, e) {
    const n = this,
      s = this.json,
      o = this.extensions;
    (this.cache.removeAll(),
      (this.nodeCache = {}),
      this._invokeAll(function (t) {
        return t._markDefs && t._markDefs();
      }),
      Promise.all(
        this._invokeAll(function (t) {
          return t.beforeRoot && t.beforeRoot();
        }),
      )
        .then(function () {
          return Promise.all([
            n.getDependencies("scene"),
            n.getDependencies("animation"),
            n.getDependencies("camera"),
          ]);
        })
        .then(function (e) {
          const i = {
            scene: e[0][s.scene || 0],
            scenes: e[0],
            animations: e[1],
            cameras: e[2],
            asset: s.asset,
            parser: n,
            userData: {},
          };
          return (
            We(o, i, s),
            Ke(i, s),
            Promise.all(
              n._invokeAll(function (t) {
                return t.afterRoot && t.afterRoot(i);
              }),
            ).then(function () {
              t(i);
            })
          );
        })
        .catch(e));
  }
  _markDefs() {
    const t = this.json.nodes || [],
      e = this.json.skins || [],
      n = this.json.meshes || [];
    for (let s = 0, o = e.length; s < o; s++) {
      const n = e[s].joints;
      for (let e = 0, s = n.length; e < s; e++) t[n[e]].isBone = !0;
    }
    for (let s = 0, o = t.length; s < o; s++) {
      const e = t[s];
      (void 0 !== e.mesh &&
        (this._addNodeRef(this.meshCache, e.mesh),
        void 0 !== e.skin && (n[e.mesh].isSkinnedMesh = !0)),
        void 0 !== e.camera && this._addNodeRef(this.cameraCache, e.camera));
    }
  }
  _addNodeRef(t, e) {
    void 0 !== e &&
      (void 0 === t.refs[e] && (t.refs[e] = t.uses[e] = 0), t.refs[e]++);
  }
  _getNodeRef(t, e, n) {
    if (t.refs[e] <= 1) return n;
    const s = n.clone(),
      o = (t, e) => {
        const n = this.associations.get(t);
        null != n && this.associations.set(e, n);
        for (const [s, i] of t.children.entries()) o(i, e.children[s]);
      };
    return (o(n, s), (s.name += "_instance_" + t.uses[e]++), s);
  }
  _invokeOne(t) {
    const e = Object.values(this.plugins);
    e.push(this);
    for (let n = 0; n < e.length; n++) {
      const s = t(e[n]);
      if (s) return s;
    }
    return null;
  }
  _invokeAll(t) {
    const e = Object.values(this.plugins);
    e.unshift(this);
    const n = [];
    for (let s = 0; s < e.length; s++) {
      const o = t(e[s]);
      o && n.push(o);
    }
    return n;
  }
  getDependency(t, e) {
    const n = t + ":" + e;
    let s = this.cache.get(n);
    if (!s) {
      switch (t) {
        case "scene":
          s = this.loadScene(e);
          break;
        case "node":
          s = this._invokeOne(function (t) {
            return t.loadNode && t.loadNode(e);
          });
          break;
        case "mesh":
          s = this._invokeOne(function (t) {
            return t.loadMesh && t.loadMesh(e);
          });
          break;
        case "accessor":
          s = this.loadAccessor(e);
          break;
        case "bufferView":
          s = this._invokeOne(function (t) {
            return t.loadBufferView && t.loadBufferView(e);
          });
          break;
        case "buffer":
          s = this.loadBuffer(e);
          break;
        case "material":
          s = this._invokeOne(function (t) {
            return t.loadMaterial && t.loadMaterial(e);
          });
          break;
        case "texture":
          s = this._invokeOne(function (t) {
            return t.loadTexture && t.loadTexture(e);
          });
          break;
        case "skin":
          s = this.loadSkin(e);
          break;
        case "animation":
          s = this._invokeOne(function (t) {
            return t.loadAnimation && t.loadAnimation(e);
          });
          break;
        case "camera":
          s = this.loadCamera(e);
          break;
        default:
          if (
            ((s = this._invokeOne(function (n) {
              return n != this && n.getDependency && n.getDependency(t, e);
            })),
            !s)
          )
            throw new Error("Unknown type: " + t);
      }
      this.cache.add(n, s);
    }
    return s;
  }
  getDependencies(t) {
    let e = this.cache.get(t);
    if (!e) {
      const n = this,
        s = this.json[t + ("mesh" === t ? "es" : "s")] || [];
      ((e = Promise.all(
        s.map(function (e, s) {
          return n.getDependency(t, s);
        }),
      )),
        this.cache.add(t, e));
    }
    return e;
  }
  loadBuffer(t) {
    const e = this.json.buffers[t],
      n = this.fileLoader;
    if (e.type && "arraybuffer" !== e.type)
      throw new Error(
        "THREE.GLTFLoader: " + e.type + " buffer type is not supported.",
      );
    if (void 0 === e.uri && 0 === t)
      return Promise.resolve(this.extensions[ae.KHR_BINARY_GLTF].body);
    const s = this.options;
    return new Promise(function (t, o) {
      n.load(v.resolveURL(e.uri, s.path), t, void 0, function () {
        o(
          new Error('THREE.GLTFLoader: Failed to load buffer "' + e.uri + '".'),
        );
      });
    });
  }
  loadBufferView(t) {
    const e = this.json.bufferViews[t];
    return this.getDependency("buffer", e.buffer).then(function (t) {
      const n = e.byteLength || 0,
        s = e.byteOffset || 0;
      return t.slice(s, s + n);
    });
  }
  loadAccessor(t) {
    const e = this,
      n = this.json,
      s = this.json.accessors[t];
    if (void 0 === s.bufferView && void 0 === s.sparse) {
      const t = ze[s.type],
        e = Fe[s.componentType],
        n = !0 === s.normalized,
        o = new e(s.count * t);
      return Promise.resolve(new O(o, t, n));
    }
    const o = [];
    return (
      void 0 !== s.bufferView
        ? o.push(this.getDependency("bufferView", s.bufferView))
        : o.push(null),
      void 0 !== s.sparse &&
        (o.push(this.getDependency("bufferView", s.sparse.indices.bufferView)),
        o.push(this.getDependency("bufferView", s.sparse.values.bufferView))),
      Promise.all(o).then(function (t) {
        const o = t[0],
          i = ze[s.type],
          a = Fe[s.componentType],
          r = a.BYTES_PER_ELEMENT,
          l = r * i,
          c = s.byteOffset || 0,
          h =
            void 0 !== s.bufferView
              ? n.bufferViews[s.bufferView].byteStride
              : void 0,
          u = !0 === s.normalized;
        let d, p;
        if (h && h !== l) {
          const t = Math.floor(c / h),
            n =
              "InterleavedBuffer:" +
              s.bufferView +
              ":" +
              s.componentType +
              ":" +
              t +
              ":" +
              s.count;
          let l = e.cache.get(n);
          (l ||
            ((d = new a(o, t * h, (s.count * h) / r)),
            (l = new N(d, h / r)),
            e.cache.add(n, l)),
            (p = new dt(l, i, (c % h) / r, u)));
        } else
          ((d = null === o ? new a(s.count * i) : new a(o, c, s.count * i)),
            (p = new O(d, i, u)));
        if (void 0 !== s.sparse) {
          const e = ze.SCALAR,
            n = Fe[s.sparse.indices.componentType],
            r = s.sparse.indices.byteOffset || 0,
            l = s.sparse.values.byteOffset || 0,
            c = new n(t[1], r, s.sparse.count * e),
            h = new a(t[2], l, s.sparse.count * i);
          null !== o && (p = new O(p.array.slice(), p.itemSize, p.normalized));
          for (let t = 0, s = c.length; t < s; t++) {
            const e = c[t];
            if (
              (p.setX(e, h[t * i]),
              i >= 2 && p.setY(e, h[t * i + 1]),
              i >= 3 && p.setZ(e, h[t * i + 2]),
              i >= 4 && p.setW(e, h[t * i + 3]),
              i >= 5)
            )
              throw new Error(
                "THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.",
              );
          }
        }
        return p;
      })
    );
  }
  loadTexture(t) {
    const e = this.json,
      n = this.options,
      s = e.textures[t].source,
      o = e.images[s];
    let i = this.textureLoader;
    if (o.uri) {
      const t = n.manager.getHandler(o.uri);
      null !== t && (i = t);
    }
    return this.loadTextureImage(t, s, i);
  }
  loadTextureImage(t, e, n) {
    const s = this,
      o = this.json,
      i = o.textures[t],
      a = o.images[e],
      r = (a.uri || a.bufferView) + ":" + i.sampler;
    if (this.textureCache[r]) return this.textureCache[r];
    const l = this.loadImageSource(e, n)
      .then(function (e) {
        ((e.flipY = !1),
          (e.name = i.name || a.name || ""),
          "" === e.name &&
            "string" == typeof a.uri &&
            !1 === a.uri.startsWith("data:image/") &&
            (e.name = a.uri));
        const n = (o.samplers || {})[i.sampler] || {};
        return (
          (e.magFilter = Oe[n.magFilter] || G),
          (e.minFilter = Oe[n.minFilter] || z),
          (e.wrapS = Ne[n.wrapS] || q),
          (e.wrapT = Ne[n.wrapT] || q),
          s.associations.set(e, { textures: t }),
          e
        );
      })
      .catch(function () {
        return null;
      });
    return ((this.textureCache[r] = l), l);
  }
  loadImageSource(t, e) {
    const n = this,
      s = this.json,
      o = this.options;
    if (void 0 !== this.sourceCache[t])
      return this.sourceCache[t].then((t) => t.clone());
    const i = s.images[t],
      a = self.URL || self.webkitURL;
    let r = i.uri || "",
      l = !1;
    if (void 0 !== i.bufferView)
      r = n.getDependency("bufferView", i.bufferView).then(function (t) {
        l = !0;
        const e = new Blob([t], { type: i.mimeType });
        return ((r = a.createObjectURL(e)), r);
      });
    else if (void 0 === i.uri)
      throw new Error(
        "THREE.GLTFLoader: Image " + t + " is missing URI and bufferView",
      );
    const c = Promise.resolve(r)
      .then(function (t) {
        return new Promise(function (n, s) {
          let i = n;
          (!0 === e.isImageBitmapLoader &&
            (i = function (t) {
              const e = new pt(t);
              ((e.needsUpdate = !0), n(e));
            }),
            e.load(v.resolveURL(t, o.path), i, void 0, s));
        });
      })
      .then(function (t) {
        var e;
        return (
          !0 === l && a.revokeObjectURL(r),
          (t.userData.mimeType =
            i.mimeType ||
            ((e = i.uri).search(/\.jpe?g($|\?)/i) > 0 ||
            0 === e.search(/^data\:image\/jpeg/)
              ? "image/jpeg"
              : e.search(/\.webp($|\?)/i) > 0 ||
                  0 === e.search(/^data\:image\/webp/)
                ? "image/webp"
                : "image/png")),
          t
        );
      })
      .catch(function (t) {
        throw t;
      });
    return ((this.sourceCache[t] = c), c);
  }
  assignTexture(t, e, n, s) {
    const o = this;
    return this.getDependency("texture", n.index).then(function (i) {
      if (!i) return null;
      if (
        (void 0 !== n.texCoord &&
          n.texCoord > 0 &&
          ((i = i.clone()).channel = n.texCoord),
        o.extensions[ae.KHR_TEXTURE_TRANSFORM])
      ) {
        const t =
          void 0 !== n.extensions
            ? n.extensions[ae.KHR_TEXTURE_TRANSFORM]
            : void 0;
        if (t) {
          const e = o.associations.get(i);
          ((i = o.extensions[ae.KHR_TEXTURE_TRANSFORM].extendTexture(i, t)),
            o.associations.set(i, e));
        }
      }
      return (void 0 !== s && (i.colorSpace = s), (t[e] = i), i);
    });
  }
  assignFinalMaterial(t) {
    const e = t.geometry;
    let n = t.material;
    const s = void 0 === e.attributes.tangent,
      o = void 0 !== e.attributes.color,
      i = void 0 === e.attributes.normal;
    if (t.isPoints) {
      const t = "PointsMaterial:" + n.uuid;
      let e = this.cache.get(t);
      (e ||
        ((e = new K()),
        Y.prototype.copy.call(e, n),
        e.color.copy(n.color),
        (e.map = n.map),
        (e.sizeAttenuation = !1),
        this.cache.add(t, e)),
        (n = e));
    } else if (t.isLine) {
      const t = "LineBasicMaterial:" + n.uuid;
      let e = this.cache.get(t);
      (e ||
        ((e = new $()),
        Y.prototype.copy.call(e, n),
        e.color.copy(n.color),
        (e.map = n.map),
        this.cache.add(t, e)),
        (n = e));
    }
    if (s || o || i) {
      let t = "ClonedMaterial:" + n.uuid + ":";
      (s && (t += "derivative-tangents:"),
        o && (t += "vertex-colors:"),
        i && (t += "flat-shading:"));
      let e = this.cache.get(t);
      (e ||
        ((e = n.clone()),
        o && (e.vertexColors = !0),
        i && (e.flatShading = !0),
        s &&
          (e.normalScale && (e.normalScale.y *= -1),
          e.clearcoatNormalScale && (e.clearcoatNormalScale.y *= -1)),
        this.cache.add(t, e),
        this.associations.set(e, this.associations.get(n))),
        (n = e));
    }
    t.material = n;
  }
  getMaterialType() {
    return X;
  }
  loadMaterial(t) {
    const e = this,
      n = this.json,
      s = this.extensions,
      o = n.materials[t];
    let i;
    const a = {},
      r = [];
    if ((o.extensions || {})[ae.KHR_MATERIALS_UNLIT]) {
      const t = s[ae.KHR_MATERIALS_UNLIT];
      ((i = t.getMaterialType()), r.push(t.extendParams(a, o, e)));
    } else {
      const n = o.pbrMetallicRoughness || {};
      if (
        ((a.color = new p(1, 1, 1)),
        (a.opacity = 1),
        Array.isArray(n.baseColorFactor))
      ) {
        const t = n.baseColorFactor;
        (a.color.setRGB(t[0], t[1], t[2], S), (a.opacity = t[3]));
      }
      (void 0 !== n.baseColorTexture &&
        r.push(e.assignTexture(a, "map", n.baseColorTexture, M)),
        (a.metalness = void 0 !== n.metallicFactor ? n.metallicFactor : 1),
        (a.roughness = void 0 !== n.roughnessFactor ? n.roughnessFactor : 1),
        void 0 !== n.metallicRoughnessTexture &&
          (r.push(
            e.assignTexture(a, "metalnessMap", n.metallicRoughnessTexture),
          ),
          r.push(
            e.assignTexture(a, "roughnessMap", n.metallicRoughnessTexture),
          )),
        (i = this._invokeOne(function (e) {
          return e.getMaterialType && e.getMaterialType(t);
        })),
        r.push(
          Promise.all(
            this._invokeAll(function (e) {
              return e.extendMaterialParams && e.extendMaterialParams(t, a);
            }),
          ),
        ));
    }
    !0 === o.doubleSided && (a.side = Z);
    const c = o.alphaMode || Ge;
    if (
      (c === qe
        ? ((a.transparent = !0), (a.depthWrite = !1))
        : ((a.transparent = !1),
          c === Ve &&
            (a.alphaTest = void 0 !== o.alphaCutoff ? o.alphaCutoff : 0.5)),
      void 0 !== o.normalTexture &&
        i !== g &&
        (r.push(e.assignTexture(a, "normalMap", o.normalTexture)),
        (a.normalScale = new l(1, 1)),
        void 0 !== o.normalTexture.scale))
    ) {
      const t = o.normalTexture.scale;
      a.normalScale.set(t, t);
    }
    if (
      (void 0 !== o.occlusionTexture &&
        i !== g &&
        (r.push(e.assignTexture(a, "aoMap", o.occlusionTexture)),
        void 0 !== o.occlusionTexture.strength &&
          (a.aoMapIntensity = o.occlusionTexture.strength)),
      void 0 !== o.emissiveFactor && i !== g)
    ) {
      const t = o.emissiveFactor;
      a.emissive = new p().setRGB(t[0], t[1], t[2], S);
    }
    return (
      void 0 !== o.emissiveTexture &&
        i !== g &&
        r.push(e.assignTexture(a, "emissiveMap", o.emissiveTexture, M)),
      Promise.all(r).then(function () {
        const n = new i(a);
        return (
          o.name && (n.name = o.name),
          Ke(n, o),
          e.associations.set(n, { materials: t }),
          o.extensions && We(s, n, o),
          n
        );
      })
    );
  }
  createUniqueName(t) {
    const e = Q.sanitizeNodeName(t || "");
    return e in this.nodeNamesUsed
      ? e + "_" + ++this.nodeNamesUsed[e]
      : ((this.nodeNamesUsed[e] = 0), e);
  }
  loadGeometries(t) {
    const e = this,
      n = this.extensions,
      s = this.primitiveCache;
    function i(t) {
      return n[ae.KHR_DRACO_MESH_COMPRESSION]
        .decodePrimitive(t, e)
        .then(function (n) {
          return tn(n, t, e);
        });
    }
    const a = [];
    for (let r = 0, l = t.length; r < l; r++) {
      const n = t[r],
        l = $e(n),
        c = s[l];
      if (c) a.push(c.promise);
      else {
        let t;
        ((t =
          n.extensions && n.extensions[ae.KHR_DRACO_MESH_COMPRESSION]
            ? i(n)
            : tn(new o(), n, e)),
          (s[l] = { primitive: n, promise: t }),
          a.push(t));
      }
    }
    return Promise.all(a);
  }
  loadMesh(t) {
    const e = this,
      s = this.json,
      o = this.extensions,
      i = s.meshes[t],
      a = i.primitives,
      r = [];
    for (let n = 0, l = a.length; n < l; n++) {
      const t =
        void 0 === a[n].material
          ? je(this.cache)
          : this.getDependency("material", a[n].material);
      r.push(t);
    }
    return (
      r.push(e.loadGeometries(a)),
      Promise.all(r).then(function (s) {
        const r = s.slice(0, s.length - 1),
          l = s[s.length - 1],
          c = [];
        for (let u = 0, d = l.length; u < d; u++) {
          const s = l[u],
            h = a[u];
          let d;
          const p = r[u];
          if (
            h.mode === Le.TRIANGLES ||
            h.mode === Le.TRIANGLE_STRIP ||
            h.mode === Le.TRIANGLE_FAN ||
            void 0 === h.mode
          )
            ((d = !0 === i.isSkinnedMesh ? new J(s, p) : new n(s, p)),
              !0 === d.isSkinnedMesh && d.normalizeSkinWeights(),
              h.mode === Le.TRIANGLE_STRIP
                ? (d.geometry = se(d.geometry, w))
                : h.mode === Le.TRIANGLE_FAN &&
                  (d.geometry = se(d.geometry, y)));
          else if (h.mode === Le.LINES) d = new tt(s, p);
          else if (h.mode === Le.LINE_STRIP) d = new et(s, p);
          else if (h.mode === Le.LINE_LOOP) d = new nt(s, p);
          else {
            if (h.mode !== Le.POINTS)
              throw new Error(
                "THREE.GLTFLoader: Primitive mode unsupported: " + h.mode,
              );
            d = new st(s, p);
          }
          (Object.keys(d.geometry.morphAttributes).length > 0 && Ye(d, i),
            (d.name = e.createUniqueName(i.name || "mesh_" + t)),
            Ke(d, i),
            h.extensions && We(o, d, h),
            e.assignFinalMaterial(d),
            c.push(d));
        }
        for (let n = 0, o = c.length; n < o; n++)
          e.associations.set(c[n], { meshes: t, primitives: n });
        if (1 === c.length) return (i.extensions && We(o, c[0], i), c[0]);
        const h = new ot();
        (i.extensions && We(o, h, i), e.associations.set(h, { meshes: t }));
        for (let t = 0, e = c.length; t < e; t++) h.add(c[t]);
        return h;
      })
    );
  }
  loadCamera(t) {
    let e;
    const n = this.json.cameras[t],
      o = n[n.type];
    if (o)
      return (
        "perspective" === n.type
          ? (e = new it(
              at.radToDeg(o.yfov),
              o.aspectRatio || 1,
              o.znear || 1,
              o.zfar || 2e6,
            ))
          : "orthographic" === n.type &&
            (e = new s(-o.xmag, o.xmag, o.ymag, -o.ymag, o.znear, o.zfar)),
        n.name && (e.name = this.createUniqueName(n.name)),
        Ke(e, n),
        Promise.resolve(e)
      );
  }
  loadSkin(t) {
    const e = this.json.skins[t],
      n = [];
    for (let s = 0, o = e.joints.length; s < o; s++)
      n.push(this._loadNodeShallow(e.joints[s]));
    return (
      void 0 !== e.inverseBindMatrices
        ? n.push(this.getDependency("accessor", e.inverseBindMatrices))
        : n.push(null),
      Promise.all(n).then(function (t) {
        const e = t.pop(),
          n = t,
          s = [],
          o = [];
        for (let i = 0, a = n.length; i < a; i++) {
          const t = n[i];
          if (t) {
            s.push(t);
            const n = new B();
            (null !== e && n.fromArray(e.array, 16 * i), o.push(n));
          }
        }
        return new rt(s, o);
      })
    );
  }
  loadAnimation(t) {
    const e = this.json,
      n = this,
      s = e.animations[t],
      o = s.name ? s.name : "animation_" + t,
      i = [],
      a = [],
      r = [],
      l = [],
      c = [];
    for (let h = 0, u = s.channels.length; h < u; h++) {
      const t = s.channels[h],
        e = s.samplers[t.sampler],
        n = t.target,
        o = n.node,
        u = void 0 !== s.parameters ? s.parameters[e.input] : e.input,
        d = void 0 !== s.parameters ? s.parameters[e.output] : e.output;
      void 0 !== n.node &&
        (i.push(this.getDependency("node", o)),
        a.push(this.getDependency("accessor", u)),
        r.push(this.getDependency("accessor", d)),
        l.push(e),
        c.push(n));
    }
    return Promise.all([
      Promise.all(i),
      Promise.all(a),
      Promise.all(r),
      Promise.all(l),
      Promise.all(c),
    ]).then(function (t) {
      const e = t[0],
        s = t[1],
        i = t[2],
        a = t[3],
        r = t[4],
        l = [];
      for (let o = 0, c = e.length; o < c; o++) {
        const t = e[o],
          c = s[o],
          h = i[o],
          u = a[o],
          d = r[o];
        if (void 0 === t) continue;
        t.updateMatrix && t.updateMatrix();
        const p = n._createAnimationTracks(t, c, h, u, d);
        if (p) for (let e = 0; e < p.length; e++) l.push(p[e]);
      }
      return new lt(o, void 0, l);
    });
  }
  createNodeMesh(t) {
    const e = this.json,
      n = this,
      s = e.nodes[t];
    return void 0 === s.mesh
      ? null
      : n.getDependency("mesh", s.mesh).then(function (t) {
          const e = n._getNodeRef(n.meshCache, s.mesh, t);
          return (
            void 0 !== s.weights &&
              e.traverse(function (t) {
                if (t.isMesh)
                  for (let e = 0, n = s.weights.length; e < n; e++)
                    t.morphTargetInfluences[e] = s.weights[e];
              }),
            e
          );
        });
  }
  loadNode(t) {
    const e = this,
      n = this.json.nodes[t],
      s = e._loadNodeShallow(t),
      o = [],
      i = n.children || [];
    for (let r = 0, l = i.length; r < l; r++)
      o.push(e.getDependency("node", i[r]));
    const a =
      void 0 === n.skin
        ? Promise.resolve(null)
        : e.getDependency("skin", n.skin);
    return Promise.all([s, Promise.all(o), a]).then(function (t) {
      const e = t[0],
        n = t[1],
        s = t[2];
      null !== s &&
        e.traverse(function (t) {
          t.isSkinnedMesh && t.bind(s, Qe);
        });
      for (let o = 0, i = n.length; o < i; o++) e.add(n[o]);
      return e;
    });
  }
  _loadNodeShallow(t) {
    const e = this.json,
      n = this.extensions,
      s = this;
    if (void 0 !== this.nodeCache[t]) return this.nodeCache[t];
    const o = e.nodes[t],
      i = o.name ? s.createUniqueName(o.name) : "",
      a = [],
      r = s._invokeOne(function (e) {
        return e.createNodeMesh && e.createNodeMesh(t);
      });
    return (
      r && a.push(r),
      void 0 !== o.camera &&
        a.push(
          s.getDependency("camera", o.camera).then(function (t) {
            return s._getNodeRef(s.cameraCache, o.camera, t);
          }),
        ),
      s
        ._invokeAll(function (e) {
          return e.createNodeAttachment && e.createNodeAttachment(t);
        })
        .forEach(function (t) {
          a.push(t);
        }),
      (this.nodeCache[t] = Promise.all(a).then(function (e) {
        let a;
        if (
          ((a =
            !0 === o.isBone
              ? new ct()
              : e.length > 1
                ? new ot()
                : 1 === e.length
                  ? e[0]
                  : new _()),
          a !== e[0])
        )
          for (let t = 0, n = e.length; t < n; t++) a.add(e[t]);
        if (
          (o.name && ((a.userData.name = o.name), (a.name = i)),
          Ke(a, o),
          o.extensions && We(n, a, o),
          void 0 !== o.matrix)
        ) {
          const t = new B();
          (t.fromArray(o.matrix), a.applyMatrix4(t));
        } else
          (void 0 !== o.translation && a.position.fromArray(o.translation),
            void 0 !== o.rotation && a.quaternion.fromArray(o.rotation),
            void 0 !== o.scale && a.scale.fromArray(o.scale));
        return (
          s.associations.has(a) || s.associations.set(a, {}),
          (s.associations.get(a).nodes = t),
          a
        );
      })),
      this.nodeCache[t]
    );
  }
  loadScene(t) {
    const e = this.extensions,
      n = this.json.scenes[t],
      s = this,
      o = new ot();
    (n.name && (o.name = s.createUniqueName(n.name)),
      Ke(o, n),
      n.extensions && We(e, o, n));
    const i = n.nodes || [],
      a = [];
    for (let r = 0, l = i.length; r < l; r++)
      a.push(s.getDependency("node", i[r]));
    return Promise.all(a).then(function (t) {
      for (let e = 0, n = t.length; e < n; e++) o.add(t[e]);
      return (
        (s.associations = ((t) => {
          const e = new Map();
          for (const [n, o] of s.associations)
            (n instanceof Y || n instanceof pt) && e.set(n, o);
          return (
            t.traverse((t) => {
              const n = s.associations.get(t);
              null != n && e.set(t, n);
            }),
            e
          );
        })(o)),
        o
      );
    });
  }
  _createAnimationTracks(t, e, n, s, o) {
    const i = [],
      a = t.name ? t.name : t.uuid,
      r = [];
    let l;
    switch (
      (He[o.path] === He.weights
        ? t.traverse(function (t) {
            t.morphTargetInfluences && r.push(t.name ? t.name : t.uuid);
          })
        : r.push(a),
      He[o.path])
    ) {
      case He.weights:
        l = ft;
        break;
      case He.rotation:
        l = gt;
        break;
      case He.position:
      case He.scale:
        l = mt;
        break;
      default:
        if (1 === n.itemSize) l = ft;
        else l = mt;
    }
    const c = void 0 !== s.interpolation ? Ue[s.interpolation] : ut,
      h = this._getArrayFromAccessor(n);
    for (let u = 0, d = r.length; u < d; u++) {
      const t = new l(r[u] + "." + He[o.path], e.array, h, c);
      ("CUBICSPLINE" === s.interpolation &&
        this._createCubicSplineTrackInterpolant(t),
        i.push(t));
    }
    return i;
  }
  _getArrayFromAccessor(t) {
    let e = t.array;
    if (t.normalized) {
      const t = Ze(e.constructor),
        n = new Float32Array(e.length);
      for (let s = 0, o = e.length; s < o; s++) n[s] = e[s] * t;
      e = n;
    }
    return e;
  }
  _createCubicSplineTrackInterpolant(t) {
    ((t.createInterpolant = function (t) {
      return new (this instanceof gt ? _e : Be)(
        this.times,
        this.values,
        this.getValueSize() / 3,
        t,
      );
    }),
      (t.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = !0));
  }
}
function tn(t, e, n) {
  const s = e.attributes,
    o = [];
  function i(e, s) {
    return n.getDependency("accessor", e).then(function (e) {
      t.setAttribute(s, e);
    });
  }
  for (const a in s) {
    const e = De[a] || a.toLowerCase();
    e in t.attributes || o.push(i(s[a], e));
  }
  if (void 0 !== e.indices && !t.index) {
    const s = n.getDependency("accessor", e.indices).then(function (e) {
      t.setIndex(e);
    });
    o.push(s);
  }
  return (
    bt.workingColorSpace,
    Ke(t, e),
    (function (t, e, n) {
      const s = e.attributes,
        o = new xt();
      if (void 0 === s.POSITION) return;
      {
        const t = n.json.accessors[s.POSITION],
          e = t.min,
          i = t.max;
        if (void 0 === e || void 0 === i) return;
        if (
          (o.set(new m(e[0], e[1], e[2]), new m(i[0], i[1], i[2])),
          t.normalized)
        ) {
          const e = Ze(Fe[t.componentType]);
          (o.min.multiplyScalar(e), o.max.multiplyScalar(e));
        }
      }
      const i = e.targets;
      if (void 0 !== i) {
        const t = new m(),
          e = new m();
        for (let s = 0, o = i.length; s < o; s++) {
          const o = i[s];
          if (void 0 !== o.POSITION) {
            const s = n.json.accessors[o.POSITION],
              i = s.min,
              a = s.max;
            if (void 0 !== i && void 0 !== a) {
              if (
                (e.setX(Math.max(Math.abs(i[0]), Math.abs(a[0]))),
                e.setY(Math.max(Math.abs(i[1]), Math.abs(a[1]))),
                e.setZ(Math.max(Math.abs(i[2]), Math.abs(a[2]))),
                s.normalized)
              ) {
                const t = Ze(Fe[s.componentType]);
                e.multiplyScalar(t);
              }
              t.max(e);
            }
          }
        }
        o.expandByVector(t);
      }
      t.boundingBox = o;
      const a = new vt();
      (o.getCenter(a.center),
        (a.radius = o.min.distanceTo(o.max) / 2),
        (t.boundingSphere = a));
    })(t, e, n),
    Promise.all(o).then(function () {
      return void 0 !== e.targets
        ? (function (t, e, n) {
            let s = !1,
              o = !1,
              i = !1;
            for (let c = 0, h = e.length; c < h; c++) {
              const t = e[c];
              if (
                (void 0 !== t.POSITION && (s = !0),
                void 0 !== t.NORMAL && (o = !0),
                void 0 !== t.COLOR_0 && (i = !0),
                s && o && i)
              )
                break;
            }
            if (!s && !o && !i) return Promise.resolve(t);
            const a = [],
              r = [],
              l = [];
            for (let c = 0, h = e.length; c < h; c++) {
              const h = e[c];
              if (s) {
                const e =
                  void 0 !== h.POSITION
                    ? n.getDependency("accessor", h.POSITION)
                    : t.attributes.position;
                a.push(e);
              }
              if (o) {
                const e =
                  void 0 !== h.NORMAL
                    ? n.getDependency("accessor", h.NORMAL)
                    : t.attributes.normal;
                r.push(e);
              }
              if (i) {
                const e =
                  void 0 !== h.COLOR_0
                    ? n.getDependency("accessor", h.COLOR_0)
                    : t.attributes.color;
                l.push(e);
              }
            }
            return Promise.all([
              Promise.all(a),
              Promise.all(r),
              Promise.all(l),
            ]).then(function (e) {
              const n = e[0],
                a = e[1],
                r = e[2];
              return (
                s && (t.morphAttributes.position = n),
                o && (t.morphAttributes.normal = a),
                i && (t.morphAttributes.color = r),
                (t.morphTargetsRelative = !0),
                t
              );
            });
          })(t, e.targets, n)
        : t;
    })
  );
}
const en = "SYB_Root",
  nn = {
    HOME: "SYB_Anchor_Home",
    FIRST_BASE: "SYB_Anchor_1B",
    SECOND_BASE: "SYB_Anchor_2B",
    THIRD_BASE: "SYB_Anchor_3B",
    MOUND: "SYB_Anchor_Mound",
    BATTER: "SYB_Anchor_Batter",
    CATCHER: "SYB_Anchor_Catcher",
    FIRST_BASEMAN: "SYB_Anchor_1B_F",
    SECOND_BASEMAN: "SYB_Anchor_2B_F",
    SHORTSTOP: "SYB_Anchor_SS_F",
    THIRD_BASEMAN: "SYB_Anchor_3B_F",
    LEFT_FIELD: "SYB_Anchor_LF",
    CENTER_FIELD: "SYB_Anchor_CF",
    RIGHT_FIELD: "SYB_Anchor_RF",
  },
  sn = { STRIKE_ZONE: "SYB_Aim_StrikeZone", MOUND: "SYB_Aim_Mound" },
  on = {
    BEHIND_BATTER: "SYB_Cam_BehindBatter",
    STRIKE_ZONE_HIGH: "SYB_Cam_StrikeZoneHigh",
    ISOMETRIC: "SYB_Cam_Isometric",
  },
  an = [en, ...Object.values(nn), ...Object.values(sn), ...Object.values(on)];
const rn = new oe();
async function ln(t) {
  const e = await (async function (t) {
    const { loader: e, url: n } = t,
      s = t.anchorPrefix ?? "SYB_Anchor_",
      o = t.aimPrefix ?? "SYB_Aim_",
      i = t.expectedRootName ?? en,
      a = await e.loadAsync(n),
      r = a.scene.getObjectByName(i) ?? a.scene,
      l = new Map(),
      c = new Map(),
      h = new Map(),
      u = new Map();
    return (
      r.traverse((t) => {
        t.name &&
          (l.set(t.name, t),
          t.isCamera && c.set(t.name, t),
          t.name.startsWith(s) && h.set(t.name, t),
          t.name.startsWith(o) && u.set(t.name, t));
      }),
      { gltf: a, root: r, nodes: l, cameras: c, anchors: h, aimTargets: u }
    );
  })({ loader: rn, url: t });
  return { scene: e.gltf.scene, index: e };
}
function cn(t) {
  return (function (t) {
    const e = [],
      n = [];
    for (const o of an) t.nodes.has(o) || e.push(o);
    0 === t.cameras.size &&
      n.push("No cameras found in GLB - fallback cameras will be used");
    const s = [nn.LEFT_FIELD, nn.CENTER_FIELD, nn.RIGHT_FIELD].filter(
      (e) => !t.anchors.has(e),
    );
    return (
      s.length > 0 &&
        n.push(
          `Missing outfielder anchors: ${s.join(", ")} - fielding may be inaccurate`,
        ),
      { valid: 0 === e.length, missing: e, warnings: n }
    );
  })(t);
}
function hn() {
  const t = new ot();
  t.name = "SYB_Bat";
  const e = new Mt(0.015, 0.02, 0.6, 8),
    s = new Mt(0.035, 0.025, 0.4, 12),
    o = new X({ color: 2759178, roughness: 0.9, metalness: 0 }),
    i = new X({ color: 9136404, roughness: 0.5, metalness: 0.05 }),
    a = new n(e, o);
  a.position.y = 0.3;
  const r = new n(s, i);
  return (
    (r.position.y = 0.8),
    t.add(a),
    t.add(r),
    t.rotation.set(0.2, 0, -0.5),
    (t.castShadow = !0),
    t
  );
}
const un = "pitcher_torso",
  dn = "pitcher_throwArm",
  pn = "pitcher_gloveArm",
  mn = "pitcher_leadLeg",
  fn = "pitcher_driveLeg",
  gn = "pitcher_head";
function bn() {
  const t = new ot();
  ((t.name = "SYB_Pitcher"), t.scale.setScalar(1.2));
  const e = new X({ color: 3355443, roughness: 0.8 }),
    s = new X({ color: 2039583, roughness: 0.85, metalness: 0.15 }),
    o = new X({ color: 1579032, roughness: 0.5, metalness: 0.2 }),
    i = new X({ color: 13935988, roughness: 0.7 }),
    a = new X({ color: 1118481, roughness: 0.9, metalness: 0.1 }),
    r = new X({ color: 9127187, roughness: 0.9 }),
    l = new ot();
  ((l.name = un), (l.position.z = 0.6));
  const c = new Ct(0.38, 0.22, 0.32),
    h = new n(c, e);
  ((h.position.z = 0.37), l.add(h));
  const u = new Ct(0.28, 0.2, 0.26),
    d = new n(u, e);
  ((d.position.z = 0.13), l.add(d));
  const p = new Ct(0.3, 0.22, 0.035),
    m = new X({ color: 2236962, roughness: 0.6, metalness: 0.15 }),
    f = new n(p, m);
  ((f.position.z = -0.01), l.add(f), t.add(l));
  const b = new ot();
  ((b.name = gn), (b.position.z = 1.3));
  const y = new At(0.11, 10, 10),
    w = new n(y, i);
  ((w.position.z = 0.12), b.add(w));
  const x = new At(0.12, 10, 6, 0, 2 * Math.PI, 0, Math.PI / 2),
    v = new n(x, o);
  ((v.position.z = 0.14), b.add(v));
  const A = new Mt(0.14, 0.14, 0.02, 8),
    T = new n(A, o);
  (T.position.set(0, 0.06, 0.16),
    (T.rotation.x = Math.PI / 10),
    b.add(T),
    t.add(b));
  const S = new ot();
  ((S.name = dn), S.position.set(0.19, 0, 0.97));
  const M = new Mt(0.04, 0.035, 0.35, 6),
    C = new n(M, e);
  (C.position.set(0, 0, -0.15), (C.rotation.z = -Math.PI / 6), S.add(C));
  const k = new At(0.035, 6, 4),
    R = new n(k, i);
  (R.position.set(0.04, 0, -0.32), S.add(R), t.add(S));
  const P = new ot();
  ((P.name = pn), P.position.set(-0.19, 0, 0.97));
  const E = new n(M, e);
  (E.position.set(0, 0, -0.12), (E.rotation.z = Math.PI / 4), P.add(E));
  const B = new At(0.07, 8, 6),
    I = new n(B, r);
  (I.position.set(-0.13, 0.02, -0.27), P.add(I), t.add(P));
  const _ = new ot();
  ((_.name = mn), _.position.set(-0.08, 0, 0.46));
  const L = new Ct(0.1, 0.1, 0.42),
    F = new n(L, s);
  ((F.position.z = -0.21), _.add(F));
  const O = new Ct(0.1, 0.14, 0.04),
    N = new n(O, a);
  (N.position.set(0, 0.01, -0.44), _.add(N), t.add(_));
  const z = new ot();
  ((z.name = fn), z.position.set(0.08, 0, 0.46));
  const D = new n(L, s);
  ((D.position.z = -0.21), z.add(D));
  const H = new n(O, a);
  (H.position.set(0, 0.01, -0.44), z.add(H), t.add(z));
  const U = new Pt(0.35, 16),
    G = new g({ color: 0, transparent: !0, opacity: 0.25, depthWrite: !1 }),
    V = new n(U, G);
  return (
    (V.rotation.x = -Math.PI / 2),
    (V.position.z = 0.01),
    t.add(V),
    (t.castShadow = !0),
    t
  );
}
const yn = {
  atBat: { position: new m(0, -5, 3.8), lookAt: new m(0, 16, 0.5), fov: 50 },
  fieldPlay: { position: new m(28, -18, 25), lookAt: new m(0, 20, 0), fov: 55 },
  homeRun: { position: new m(-8, -2, 0.6), lookAt: new m(0, 30, 5), fov: 70 },
};
class wn {
  constructor(t) {
    (e(this, "threeCamera"),
      e(this, "targetPosition", new m()),
      e(this, "targetLookAt", new m()),
      e(this, "currentLookAt", new m()),
      e(this, "targetFov"),
      e(this, "shakeIntensity", 0),
      e(this, "shakeOffset", new m()),
      e(this, "sceneIndex", null),
      e(this, "followTarget", null),
      e(this, "followLocked", !1),
      e(this, "followLockedPos", new m()),
      e(this, "overrideAtBatPos", null),
      e(this, "overrideFieldPlayPos", null),
      e(this, "overrideMoundY", null),
      e(this, "slowMoActive", !1),
      e(this, "slowMoRemaining", 0),
      e(this, "slowMoMult", 1),
      e(this, "shakeDecayRate", 8),
      e(this, "hrCelebActive", !1),
      e(this, "hrCelebAngle", 0),
      e(this, "hrCelebCenter", new m()),
      e(this, "hrCelebElapsed", 0),
      e(this, "hrCelebDuration", 3),
      e(this, "strikeoutSnapActive", !1),
      e(this, "strikeoutSnapElapsed", 0),
      e(this, "strikeoutSnapDuration", 0.3),
      e(this, "strikeoutSnapSavedPos", new m()),
      e(this, "strikeoutSnapSavedLookAt", new m()),
      e(this, "strikeoutSnapSavedFov", 50),
      e(this, "strikeoutSnapZoomPos", new m()),
      e(this, "batterIntroActive", !1),
      e(this, "batterIntroElapsed", 0),
      e(this, "batterIntroDuration", 1.2),
      e(this, "batterIntroZoomPos", new m()),
      e(this, "batterIntroZoomLookAt", new m()),
      e(this, "batterIntroEndPos", new m()),
      e(this, "batterIntroEndLookAt", new m()),
      e(this, "batterIntroEndFov", 50),
      e(this, "fovPunchActive", !1),
      e(this, "fovPunchAmount", 0),
      e(this, "fovPunchElapsed", 0),
      e(this, "fovPunchDuration", 0.15),
      e(this, "orbitActive", !1),
      e(this, "orbitAngle", 0),
      e(this, "orbitCenter", new m(0, 0, 0)),
      e(this, "sweepActive", !1),
      e(this, "sweepProgress", 0),
      e(this, "sweepDuration", 4),
      (this.threeCamera = new it(yn.atBat.fov, t, 0.1, 500)),
      this.threeCamera.position.copy(yn.atBat.position),
      this.targetPosition.copy(yn.atBat.position),
      this.currentLookAt.copy(yn.atBat.lookAt),
      this.targetLookAt.copy(yn.atBat.lookAt),
      (this.targetFov = yn.atBat.fov),
      this.threeCamera.lookAt(this.currentLookAt));
  }
  bindIndex(t) {
    this.sceneIndex = t;
    const e = t.nodes.get(on.BEHIND_BATTER);
    e && (this.overrideAtBatPos = e.position.clone());
    const n = t.nodes.get(on.ISOMETRIC);
    n && (this.overrideFieldPlayPos = n.position.clone());
    const s = t.anchors.get(nn.MOUND);
    s && (this.overrideMoundY = s.position.y);
  }
  switchTo(t) {
    if (
      (t === yn.atBat && this.overrideAtBatPos
        ? this.targetPosition.copy(this.overrideAtBatPos)
        : t === yn.fieldPlay && this.overrideFieldPlayPos
          ? this.targetPosition.copy(this.overrideFieldPlayPos)
          : this.targetPosition.copy(t.position),
      null !== this.overrideMoundY)
    ) {
      const e = t.lookAt.clone(),
        n = this.overrideMoundY / 16;
      ((e.y *= n), this.targetLookAt.copy(e));
    } else this.targetLookAt.copy(t.lookAt);
    this.targetFov = t.fov;
  }
  shake(t) {
    this.shakeIntensity = t;
  }
  fovPunch(t = 6, e = 0.15) {
    ((this.fovPunchActive = !0),
      (this.fovPunchAmount = t),
      (this.fovPunchElapsed = 0),
      (this.fovPunchDuration = e));
  }
  followBall(t, e = !1) {
    ((this.followTarget = t.clone()),
      this.targetLookAt.copy(t),
      this.followLocked ||
        ((this.followLocked = !0),
        this.followLockedPos.copy(this.threeCamera.position),
        (this.followLockedPos.z += 3),
        (this.followLockedPos.y -= 4)),
      this.targetPosition.copy(this.followLockedPos),
      (this.targetFov = e ? 58 : 52));
  }
  startHomeRunOrbit(t) {
    ((this.orbitActive = !0),
      (this.orbitAngle = 0.75 * Math.PI),
      this.orbitCenter.copy(t),
      (this.targetFov = 45));
  }
  stopOrbit() {
    this.orbitActive = !1;
  }
  startGameOverSweep(t) {
    ((this.sweepActive = !0),
      (this.sweepProgress = 0),
      (this.orbitActive = !1),
      (this.followTarget = null),
      (this.targetFov = 55),
      this.targetLookAt.set(t.x, t.y + 15, 2));
  }
  stopSweep() {
    this.sweepActive = !1;
  }
  updateSweep(t) {
    if (!this.sweepActive) return;
    this.sweepProgress += t / this.sweepDuration;
    const e = Math.min(this.sweepProgress, 1),
      n = e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2,
      s = new m(0, -4, 2.5),
      o = new m(20, -30, 25);
    this.targetPosition.lerpVectors(s, o, n);
    const i = new m(0, 14, 1),
      a = new m(0, 35, 0);
    (this.targetLookAt.lerpVectors(i, a, n), (this.targetFov = 50 + 15 * n));
  }
  updateOrbit(t) {
    if (!this.orbitActive) return;
    this.orbitAngle += 0.4 * t;
    (this.targetPosition.set(
      this.orbitCenter.x + 8 * Math.cos(this.orbitAngle),
      this.orbitCenter.y + 8 * Math.sin(this.orbitAngle),
      this.orbitCenter.z + 3,
    ),
      this.targetLookAt.copy(this.orbitCenter),
      (this.targetLookAt.z += 1));
  }
  stopFollow() {
    ((this.followTarget = null), (this.followLocked = !1));
  }
  triggerSlowMo(t = 1.5, e = 0.25) {
    ((this.slowMoActive = !0),
      (this.slowMoRemaining = t),
      (this.slowMoMult = e));
  }
  stopSlowMo() {
    ((this.slowMoActive = !1),
      (this.slowMoRemaining = 0),
      (this.slowMoMult = 1));
  }
  shakeCamera(t, e = 8) {
    ((this.shakeIntensity = t), (this.shakeDecayRate = e));
  }
  startHRCelebration(t) {
    ((this.orbitActive = !1),
      (this.followTarget = null),
      (this.sweepActive = !1),
      (this.hrCelebActive = !0),
      (this.hrCelebElapsed = 0),
      (this.hrCelebAngle = 0.75 * Math.PI),
      this.hrCelebCenter.copy(t),
      (this.targetFov = 42));
  }
  stopHRCelebration() {
    this.hrCelebActive = !1;
  }
  updateHRCelebration(t) {
    if (!this.hrCelebActive) return;
    this.hrCelebElapsed += t;
    const e = Math.min(this.hrCelebElapsed / this.hrCelebDuration, 1),
      n = e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2,
      s = this.hrCelebAngle + n * Math.PI,
      o = 3 + 4 * n;
    (this.targetPosition.set(
      this.hrCelebCenter.x + 12 * Math.cos(s),
      this.hrCelebCenter.y + 12 * Math.sin(s),
      this.hrCelebCenter.z + o,
    ),
      this.targetLookAt.set(
        this.hrCelebCenter.x,
        this.hrCelebCenter.y,
        this.hrCelebCenter.z + 1 - 0.5 * n,
      ),
      (this.targetFov = 42 + 6 * n),
      e >= 1 && (this.hrCelebActive = !1));
  }
  strikeoutSnap(t) {
    (this.strikeoutSnapSavedPos.copy(this.targetPosition),
      this.strikeoutSnapSavedLookAt.copy(this.targetLookAt),
      (this.strikeoutSnapSavedFov = this.targetFov),
      this.strikeoutSnapZoomPos.set(t.x + 2, t.y - 3, t.z + 1.5),
      (this.strikeoutSnapActive = !0),
      (this.strikeoutSnapElapsed = 0));
  }
  updateStrikeoutSnap(t) {
    if (!this.strikeoutSnapActive) return;
    this.strikeoutSnapElapsed += t;
    const e = Math.min(
      this.strikeoutSnapElapsed / this.strikeoutSnapDuration,
      1,
    );
    if (e < 0.5) {
      const t = 1 - Math.pow(1 - 2 * e, 3);
      (this.targetPosition.lerpVectors(
        this.strikeoutSnapSavedPos,
        this.strikeoutSnapZoomPos,
        t,
      ),
        (this.targetFov = this.strikeoutSnapSavedFov - 15 * t));
    } else {
      const t = Math.pow(2 * (e - 0.5), 2);
      (this.targetPosition.lerpVectors(
        this.strikeoutSnapZoomPos,
        this.strikeoutSnapSavedPos,
        t,
      ),
        (this.targetFov = this.strikeoutSnapSavedFov - 15 + 15 * t));
    }
    e >= 1 &&
      ((this.strikeoutSnapActive = !1),
      this.targetPosition.copy(this.strikeoutSnapSavedPos),
      this.targetLookAt.copy(this.strikeoutSnapSavedLookAt),
      (this.targetFov = this.strikeoutSnapSavedFov));
  }
  batterIntro(t) {
    if (
      ((this.strikeoutSnapActive = !1),
      (this.hrCelebActive = !1),
      (this.orbitActive = !1),
      (this.sweepActive = !1),
      (this.followTarget = null),
      (this.batterIntroActive = !0),
      (this.batterIntroElapsed = 0),
      this.batterIntroZoomPos.set(t.x + 2.5, t.y - 2, t.z + 1.8),
      this.batterIntroZoomLookAt.set(t.x, t.y, t.z + 1.2),
      this.overrideAtBatPos
        ? this.batterIntroEndPos.copy(this.overrideAtBatPos)
        : this.batterIntroEndPos.copy(yn.atBat.position),
      null !== this.overrideMoundY)
    ) {
      const t = yn.atBat.lookAt.clone();
      ((t.y *= this.overrideMoundY / 16), this.batterIntroEndLookAt.copy(t));
    } else this.batterIntroEndLookAt.copy(yn.atBat.lookAt);
    this.batterIntroEndFov = yn.atBat.fov;
  }
  updateBatterIntro(t) {
    if (!this.batterIntroActive) return;
    this.batterIntroElapsed += t;
    const e = this.batterIntroElapsed;
    if (e < 0.3) {
      const t = e / 0.3,
        n = 1 - Math.pow(1 - t, 2);
      (this.targetPosition.lerpVectors(
        this.batterIntroEndPos,
        this.batterIntroZoomPos,
        n,
      ),
        this.targetLookAt.lerpVectors(
          this.batterIntroEndLookAt,
          this.batterIntroZoomLookAt,
          n,
        ),
        (this.targetFov = this.batterIntroEndFov - 8 * n));
    } else if (e < 0.8)
      (this.targetPosition.copy(this.batterIntroZoomPos),
        this.targetLookAt.copy(this.batterIntroZoomLookAt),
        (this.targetFov = this.batterIntroEndFov - 8));
    else if (e < this.batterIntroDuration) {
      const t = (e - 0.8) / 0.4,
        n = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      (this.targetPosition.lerpVectors(
        this.batterIntroZoomPos,
        this.batterIntroEndPos,
        n,
      ),
        this.targetLookAt.lerpVectors(
          this.batterIntroZoomLookAt,
          this.batterIntroEndLookAt,
          n,
        ),
        (this.targetFov = this.batterIntroEndFov - 8 + 8 * n));
    } else
      ((this.batterIntroActive = !1),
        this.targetPosition.copy(this.batterIntroEndPos),
        this.targetLookAt.copy(this.batterIntroEndLookAt),
        (this.targetFov = this.batterIntroEndFov));
  }
  setAspect(t) {
    ((this.threeCamera.aspect = t), this.threeCamera.updateProjectionMatrix());
  }
  update(t) {
    (this.updateOrbit(t),
      this.updateSweep(t),
      this.updateHRCelebration(t),
      this.updateStrikeoutSnap(t),
      this.updateBatterIntro(t));
    let e = 1;
    this.slowMoActive &&
      ((this.slowMoRemaining -= t),
      this.slowMoRemaining <= 0 ? this.stopSlowMo() : (e = this.slowMoMult));
    const n = 1 - Math.exp(-4 * e * t);
    if (
      (this.threeCamera.position.lerp(this.targetPosition, n),
      this.currentLookAt.lerp(this.targetLookAt, n),
      (this.threeCamera.fov += (this.targetFov - this.threeCamera.fov) * n),
      this.fovPunchActive)
    ) {
      this.fovPunchElapsed += t;
      const e = Math.min(this.fovPunchElapsed / this.fovPunchDuration, 1),
        n = 1 - Math.pow(1 - e, 3);
      ((this.threeCamera.fov -= this.fovPunchAmount * (1 - n)),
        e >= 1 && (this.fovPunchActive = !1));
    }
    (this.threeCamera.updateProjectionMatrix(),
      this.shakeIntensity > 0.001 &&
        (this.shakeOffset.set(
          2 * (Math.random() - 0.5) * this.shakeIntensity,
          2 * (Math.random() - 0.5) * this.shakeIntensity,
          2 * (Math.random() - 0.5) * this.shakeIntensity,
        ),
        this.threeCamera.position.add(this.shakeOffset),
        (this.shakeIntensity *= Math.exp(-this.shakeDecayRate * t))),
      this.threeCamera.lookAt(this.currentLookAt));
  }
}
const xn = -32.17,
  vn = 0.3125,
  An = 0.121 * Math.PI * 0.121,
  Tn = 14 / 60.5,
  Sn = 60.5 / 14,
  Mn = 0.00118845 * 0.33 * An,
  Cn = 0.005,
  kn = 0.04,
  Rn = 0.17285714285714285,
  Pn = {
    Fastball: { x: 0, z: 14 },
    Curve: { x: 3, z: -18 },
    Slider: { x: 10, z: -4 },
    "Change-up": { x: 8, z: -6 },
    Cutter: { x: -5, z: 4 },
  };
const En = 0.22,
  Bn = 0.3,
  In = {
    MID_MID: { x: 0, z: 0 },
    IN_MID: { x: -0.154, z: 0 },
    OUT_MID: { x: 0.154, z: 0 },
    MID_HIGH: { x: 0, z: 0.21 },
    MID_LOW: { x: 0, z: -0.21 },
    IN_HIGH: { x: -0.154, z: 0.21 },
    IN_LOW: { x: -0.154, z: -0.21 },
    OUT_HIGH: { x: 0.154, z: 0.21 },
    OUT_LOW: { x: 0.154, z: -0.21 },
  };
class _n {
  constructor(t) {
    (e(this, "pool", []), e(this, "factory"), (this.factory = t));
    for (let e = 0; e < 3; e++) {
      const t = this.factory();
      ((t.visible = !1), this.pool.push(t));
    }
  }
  acquire() {
    const t = this.pool.pop() ?? this.factory();
    return ((t.visible = !0), t);
  }
  release(t) {
    ((t.visible = !1), t.removeFromParent(), this.pool.push(t));
  }
}
function Ln(t) {
  const {
      index: e,
      scene: n,
      lane: s,
      ballPool: i,
      onStrikeCross: a,
      speed: r = 1,
      breakScale: l = 1,
      trailColor: c,
    } = t,
    h = e.anchors.get(nn.MOUND),
    u = e.anchors.get(nn.HOME),
    d = h ? h.position.clone() : new m(0, 14, 0.3),
    p = u ? u.position.clone() : new m(0, 0, 0),
    g = In[s],
    b = new m(p.x + g.x, p.y, 0.8 + g.z),
    y = new m(d.x, d.y, d.z + 1.5),
    w = t.pitchTypeName ?? "Fastball",
    x = (function (t, e, n, s, o, i, a, r, l = 1) {
      const c = n * Sn,
        h = s * Sn,
        u = o * Sn,
        d = 1.46667 * t,
        p = i * Sn - c,
        m = a * Sn - h,
        f = r * Sn - u,
        g = Math.sqrt(p * p + m * m + f * f),
        b = g / d;
      let y = (p / g) * d,
        w = (m / g) * d,
        x = ((f + 16.085 * b * b * 0.6) / g) * d;
      const v = Pn[e] ?? { x: 0, z: 0 },
        A = v.x * l,
        T = v.z * l,
        S = [];
      let M = c,
        C = h,
        k = u,
        R = 0,
        P = 0;
      S.push(M * Tn, C * Tn, k * Tn);
      for (let E = 0; E < 600; E++) {
        const t = Math.sqrt(y * y + w * w + x * x);
        if (t < 1) break;
        const e = (Mn * t) / vn,
          n = -e * y,
          s = -e * w,
          o = -e * x,
          i = Math.min(R / (1.1 * b), 1),
          r = i * i;
        if (
          ((y += (n + A * r) * Cn),
          (w += s * Cn),
          (x += (o + xn + T * r) * Cn),
          (M += y * Cn),
          (C += w * Cn),
          (k += x * Cn),
          (R += Cn),
          E % 2 == 1 && S.push(M * Tn, C * Tn, k * Tn),
          C * Tn <= a)
        ) {
          ((P = y * y + w * w + x * x), S.push(M * Tn, C * Tn, k * Tn));
          break;
        }
      }
      return {
        positions: new Float32Array(S),
        sampleCount: S.length / 3,
        duration: R,
        plateVelocityMph: Math.sqrt(P) / 1.46667,
      };
    })(t.pitchMph ?? 85, w, y.x, y.y, y.z, b.x, b.y, b.z, l),
    v = x.duration,
    A = i.acquire();
  (A.position.copy(y), n.add(A));
  const T = Math.round(10 + 8 * r),
    S = Math.min(0.9, 0.4 + 0.3 * r);
  let M = null,
    C = null;
  if (void 0 !== c) {
    const t = new o();
    C = new Float32Array(3 * T);
    for (let n = 0; n < T; n++)
      ((C[3 * n] = y.x), (C[3 * n + 1] = y.y), (C[3 * n + 2] = y.z));
    t.setAttribute("position", new O(C, 3));
    const e = new $({
      color: c,
      transparent: !0,
      opacity: S,
      blending: f,
      depthWrite: !1,
      linewidth: 2,
    });
    ((M = new et(t, e)), (M.frustumCulled = !1), n.add(M));
  }
  let k = 0,
    R = !1;
  performance.now();
  const P = {
    active: !0,
    lastCross: null,
    update(t) {
      if (!P.active) return;
      k += t;
      const e = Math.min(k / v, 1),
        n = e * (x.sampleCount - 1),
        s = Math.floor(n),
        o = Math.min(s + 1, x.sampleCount - 1),
        i = n - s,
        l = x.positions;
      if (
        (A.position.set(
          l[3 * s] + (l[3 * o] - l[3 * s]) * i,
          l[3 * s + 1] + (l[3 * o + 1] - l[3 * s + 1]) * i,
          l[3 * s + 2] + (l[3 * o + 2] - l[3 * s + 2]) * i,
        ),
        (A.rotation.x += 15 * t * r),
        (A.rotation.z += 8 * t * r),
        C && M)
      ) {
        for (let t = T - 1; t > 0; t--)
          ((C[3 * t] = C[3 * (t - 1)]),
            (C[3 * t + 1] = C[3 * (t - 1) + 1]),
            (C[3 * t + 2] = C[3 * (t - 1) + 2]));
        ((C[0] = A.position.x),
          (C[1] = A.position.y),
          (C[2] = A.position.z),
          (M.geometry.attributes.position.needsUpdate = !0));
        M.material.opacity = Math.max(0.1, S * (1 - e));
      }
      if (!R && A.position.y <= 0.3) {
        R = !0;
        const t = Math.abs(A.position.x - p.x),
          e = Math.abs(A.position.z - 0.8),
          n = t <= En && e <= Bn,
          s = {
            position: A.position.clone(),
            isInZone: n,
            timing: performance.now(),
          };
        ((P.lastCross = s), a(s));
      }
      e >= 1 && (P.active = !1);
    },
    stop() {
      ((P.active = !1),
        (A.visible = !1),
        n.remove(A),
        i.release(A),
        M &&
          (n.remove(M),
          M.geometry.dispose(),
          M.material.dispose(),
          (M = null),
          (C = null)));
    },
  };
  return P;
}
function Fn(t) {
  let e = 0 | t;
  return () => {
    e = (e + 1831565813) | 0;
    let t = Math.imul(e ^ (e >>> 15), 1 | e);
    return (
      (t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t),
      ((t ^ (t >>> 14)) >>> 0) / 4294967296
    );
  };
}
function On(t, e, n, s, o, i = 1, a = 0, r = 65) {
  const l = Fn(s),
    c = n.position.x,
    h = (n.position.z - 0.8) / 0.3;
  let u, d, p, f;
  switch (t) {
    case "perfect":
      u = 6 * (l() - 0.5);
      break;
    case "good":
      u = 16 * (l() - 0.5);
      break;
    default:
      u = 30 * (l() - 0.5);
  }
  if ("foul" === t) ((d = 30 + 40 * l() + u), (p = 0.3 + 0.3 * l()), l());
  else if ("perfect" === t || "good" === t || "weak" === t) {
    if (h > 0.3) {
      d = 25 + 35 * Math.min((h - 0.3) / 0.7, 1) + u;
    } else if (h < -0.3) {
      d = 5 - 15 * Math.min((-0.3 - h) / 0.7, 1) + u;
    } else {
      d = 8 + 12 * ((h + 0.3) / 0.6) + u;
    }
    let e;
    switch (t) {
      case "perfect":
        ((e = 0.85 + 0.15 * l()), l());
        break;
      case "good":
        ((e = 0.6 + 0.25 * l()), l());
        break;
      default:
        ((e = 0.2 + 0.3 * l()), l());
    }
    const n = Math.min(1, Math.abs(h));
    p = e * Math.max(0.4, 1 - n * n * 0.5);
  } else ((d = 0), (p = 0));
  if ("foul" === t)
    f = (l() < 0.5 ? -1 : 1) * (0.35 * Math.PI + l() * Math.PI * 0.2);
  else {
    ((f =
      (0.7 * Math.max(-1, Math.min(1, a / 150)) + 0.3 * (6 * c)) *
        Math.PI *
        0.45 +
      0.15 * (l() - 0.5)),
      "perfect" === t && (f *= 0.85));
  }
  const g = new m();
  (g.set(Math.sin(f), Math.cos(f), Math.sin((d * Math.PI) / 180)).normalize(),
    (p *= i));
  const b = 110 * p;
  let y, w;
  switch (t) {
    case "perfect":
      ((y = 2e3 + 500 * l()), (w = 1e3 * (l() - 0.5)));
      break;
    case "good":
      ((y = 1500 + 500 * l()), (w = 1600 * (l() - 0.5)));
      break;
    default:
      ((y = 500 + 500 * l()), (w = 2e3 * (l() - 0.5)));
  }
  const x = (function (t, e, n, s, o, i, a, r, l = 65) {
      let c = i * Sn,
        h = a * Sn,
        u = r * Sn;
      const d = c,
        p = h,
        m = l * Sn,
        f = 1.46667 * t,
        g = (e * Math.PI) / 180,
        b = f * Math.cos(g),
        y = f * Math.sin(g);
      let w = b * Math.sin(n),
        x = b * Math.cos(n),
        v = y;
      const A = 0.003 * s,
        T = 0.002 * o,
        S = [];
      let M = 0,
        C = 0,
        k = !1,
        R = 0;
      S.push(c * Tn, h * Tn, u * Tn);
      for (let E = 0; E < 2e3; E++) {
        const t = Math.sqrt(w * w + x * x + v * v);
        if (t < 3 && C > 0) break;
        const e = (Mn * t) / vn,
          n = u > Rn + 0.5;
        ((w += (-e * w + (n ? T : 0)) * Cn),
          (x += -e * x * Cn),
          (v += (-e * v + xn + (n ? A : 0)) * Cn),
          (c += w * Cn),
          (h += x * Cn),
          (u += v * Cn),
          (M += Cn),
          u <= Rn &&
            ((u = Rn),
            C++,
            C >= 5 || Math.abs(v) < 2
              ? ((v = 0), (w *= 0.95), (x *= 0.95))
              : ((v = 0.35 * -v), (w *= 0.65), (x *= 0.65))));
        const s = c - d,
          o = h - p,
          i = s * s + o * o;
        if (
          (i > R && (R = i),
          !k && Math.sqrt(i) >= m && u > Rn + 3 && (k = !0),
          E % 4 == 3 && S.push(c * Tn, h * Tn, Math.max(u * Tn, kn)),
          C > 0 && t < 5)
        )
          break;
        if (M > 8) break;
        if (k && u <= Rn) break;
      }
      S.push(c * Tn, h * Tn, Math.max(u * Tn, kn));
      const P = Math.sqrt(R);
      return {
        positions: new Float32Array(S),
        sampleCount: S.length / 3,
        duration: M,
        distanceFt: P,
        clearedFence: k,
      };
    })(b, d, f, y, w, n.position.x, n.position.y, n.position.z, r),
    v = 3 * (x.sampleCount - 1),
    A = new m(x.positions[v], x.positions[v + 1], x.positions[v + 2]);
  return {
    quality: t,
    launchAngle: d,
    exitVelocity: p,
    direction: g,
    distance: x.distanceFt * Tn,
    flightPositions: x.positions,
    flightSampleCount: x.sampleCount,
    landingPos: A,
    flightDuration: x.duration,
    clearedFence: x.clearedFence,
  };
}
const Nn = {
    "1B_F": nn.FIRST_BASEMAN,
    "2B_F": nn.SECOND_BASEMAN,
    SS_F: nn.SHORTSTOP,
    "3B_F": nn.THIRD_BASEMAN,
    LF: nn.LEFT_FIELD,
    CF: nn.CENTER_FIELD,
    RF: nn.RIGHT_FIELD,
    C: nn.CATCHER,
  },
  zn = {
    "1B_F": [13, 13, 0.05],
    "2B_F": [6, 18, 0.05],
    SS_F: [-6, 18, 0.05],
    "3B_F": [-13, 13, 0.05],
    LF: [-22, 42, 0.05],
    CF: [0, 52, 0.05],
    RF: [22, 42, 0.05],
    C: [0, -1.2, 0.05],
  },
  Dn = [
    [13, 0, 0.05],
    [0, 18, 0.05],
    [-13, 0, 0.05],
  ],
  Hn = new X({ color: 9127187, roughness: 0.9 }),
  Un = new X({ color: 1118481, roughness: 0.9, metalness: 0.1 }),
  Gn = new X({ color: 13935988, roughness: 0.7 });
function Vn(t, e) {
  return (
    (Math.floor(((t >> 16) & 255) * e) << 16) |
    (Math.floor(((t >> 8) & 255) * e) << 8) |
    Math.floor((255 & t) * e)
  );
}
function qn(t, e = !1) {
  const s = new ot(),
    o = new X({ color: t, roughness: 0.8 }),
    i = new X({ color: Vn(t, 0.6), roughness: 0.85, metalness: 0.15 }),
    a = Vn(t, 0.45),
    r = new X({ color: a, roughness: 0.5, metalness: 0.2 }),
    l = e ? 0.55 : 0.85,
    c = e ? 0.95 : 1.42,
    h = e ? 0.18 : 0.25,
    u = e ? 0.28 : 0.42,
    d = e ? 0.55 : 0.82,
    p = new Ct(0.38, 0.22, e ? 0.28 : 0.32),
    m = new n(p, o);
  ((m.position.z = l + (e ? 0.08 : 0.12)), s.add(m));
  const f = new Ct(0.28, 0.2, e ? 0.22 : 0.26),
    g = new n(f, o);
  ((g.position.z = l - (e ? 0.1 : 0.12)), s.add(g));
  const b = new Ct(0.3, 0.22, 0.035),
    y = new X({ color: 2236962, roughness: 0.6, metalness: 0.15 }),
    w = new n(b, y);
  ((w.position.z = l - (e ? 0.22 : 0.26)), s.add(w));
  const x = new At(0.11, 10, 10),
    v = new n(x, Gn);
  ((v.position.z = c), s.add(v));
  const A = new At(0.12, 10, 6, 0, 2 * Math.PI, 0, Math.PI / 2),
    T = new n(A, r);
  ((T.position.z = c + 0.02), s.add(T));
  const S = new Mt(0.14, 0.14, 0.02, 8),
    M = new n(S, r);
  (M.position.set(0, 0.06, c + 0.04), (M.rotation.x = Math.PI / 10), s.add(M));
  const C = new Ct(0.1, 0.1, u),
    k = new n(C, i);
  (k.position.set(-0.08, 0, h), s.add(k));
  const R = new n(C, i);
  (R.position.set(0.08, 0, h), s.add(R));
  const P = new Ct(0.1, 0.14, 0.04),
    E = new n(P, Un);
  (E.position.set(-0.08, 0.01, h - u / 2 - 0.02), s.add(E));
  const B = new n(P, Un);
  (B.position.set(0.08, 0.01, h - u / 2 - 0.02), s.add(B));
  const I = new Mt(0.04, 0.035, 0.35, 6),
    _ = new n(I, o);
  (_.position.set(-0.24, 0.02, d), (_.rotation.z = Math.PI / 3.5), s.add(_));
  const L = new n(I, o);
  (L.position.set(0.2, 0, d - 0.05), (L.rotation.z = -Math.PI / 6), s.add(L));
  const F = new At(0.07, 8, 6),
    O = new n(F, Hn);
  return (
    O.position.set(-0.32, 0.04, e ? 0.42 : 0.68),
    s.add(O),
    (s.castShadow = !0),
    s
  );
}
const jn = "batter_torso",
  Wn = "batter_hips",
  Kn = "batter_frontArm",
  Yn = "batter_backArm",
  $n = "batter_frontLeg",
  Xn = "batter_backLeg",
  Zn = "batter_head";
class Qn {
  constructor(t, n, s, o) {
    (e(this, "scene"),
      e(this, "sceneIndex"),
      e(this, "fielders", new Map()),
      e(this, "runners", []),
      e(this, "runnerBasePositions", []),
      e(this, "batter", null),
      e(this, "batterHomePos", new m()),
      e(this, "chaserKey", null),
      e(this, "chaseTarget", null),
      e(this, "chaseComplete", !1),
      e(this, "returning", !1),
      e(this, "batterRunning", !1),
      e(this, "batterRunPath", []),
      e(this, "batterRunIndex", 0),
      e(this, "batterRunProgress", 0),
      e(this, "batterRunSpeed", 14),
      e(this, "batterRunComplete", !1),
      e(this, "pitcherMesh", null),
      e(this, "pitcherDeliveryActive", !1),
      e(this, "pitcherDeliveryProgress", 0),
      e(this, "pitcherOriginalZ", 0),
      e(this, "pitcherDeliveryDuration", 0.4),
      e(this, "batterSwingActive", !1),
      e(this, "batterSwingProgress", 0),
      e(this, "batterSwingDuration", 0.25),
      e(this, "throwBall", null),
      e(this, "throwStart", null),
      e(this, "throwEnd", null),
      e(this, "throwProgress", 0),
      e(this, "throwActive", !1),
      e(this, "catchAnimActive", !1),
      e(this, "catchAnimProgress", 0),
      e(this, "catchAnimKey", null),
      e(this, "catchAnimOrigZ", 0),
      e(this, "onBaseArrival", null),
      e(this, "lastBatterBaseIndex", -1),
      e(this, "basePositions", []),
      e(this, "pitcherFidgetPhase", 0),
      e(this, "backupShifts", new Map()),
      e(this, "relayPhase", "done"),
      e(this, "relayBall", null),
      e(this, "relayStart", new m()),
      e(this, "relayMid", new m()),
      e(this, "relayEnd", new m()),
      e(this, "relayProgress", 0),
      e(this, "walkInActive", !1),
      e(this, "walkInProgress", 0),
      e(this, "walkInStart", new m()),
      e(this, "WALK_IN_DURATION", 0.8),
      e(this, "prevBases", [!1, !1, !1]),
      e(this, "runnerAnimations", []),
      e(this, "infieldersCrouching", !1),
      e(this, "crouchProgress", 0),
      e(this, "INFIELD_KEYS", ["1B_F", "2B_F", "SS_F", "3B_F"]),
      e(this, "catcherPumpActive", !1),
      e(this, "catcherPumpProgress", 0),
      (this.scene = t),
      (this.sceneIndex = n),
      (this.onBaseArrival = o ?? null),
      this.cacheBasePositions(),
      this.placeFielders(s),
      this.placeBatterAndRunners(s),
      this.findPitcher());
  }
  cacheBasePositions() {
    const t = this.sceneIndex.anchors.get(nn.HOME);
    this.basePositions = [t?.position.clone() ?? new m(0, 0, 0.05)];
    const e = [nn.FIRST_BASE, nn.SECOND_BASE, nn.THIRD_BASE];
    for (let n = 0; n < 3; n++) {
      const t = this.sceneIndex.anchors.get(e[n]),
        s = Dn[n];
      this.basePositions.push(t?.position.clone() ?? new m(...s));
    }
  }
  placeFielders(t) {
    const e = ["1B_F", "2B_F", "SS_F", "3B_F", "LF", "CF", "RF", "C"],
      n = t ?? 4473924;
    for (const s of e) {
      const t = "C" === s,
        e = qn(n, t);
      e.name = `SYB_Fielder_${s}`;
      const o = Nn[s],
        i = this.sceneIndex.anchors.get(o),
        a = zn[s],
        r = i?.position.clone() ?? new m(...a);
      if ((e.position.copy(r), !t)) {
        const t = this.basePositions[0],
          n = new m(t.x, t.y, r.z);
        e.lookAt(n);
      }
      (this.scene.add(e),
        this.fielders.set(s, {
          mesh: e,
          homePos: r.clone(),
          currentPos: r.clone(),
        }));
    }
  }
  placeBatterAndRunners(t) {
    const e = t ?? 12539648,
      s = this.sceneIndex.anchors.get(nn.BATTER),
      o = s?.position.clone() ?? new m(-0.5, -0.3, 0.05);
    ((this.batter = (function (t) {
      const e = new ot(),
        s = new X({ color: t, roughness: 0.8 }),
        o = new X({ color: Vn(t, 0.6), roughness: 0.85, metalness: 0.15 }),
        i = new X({ color: Vn(t, 0.35), roughness: 0.4, metalness: 0.3 }),
        a = new ot();
      ((a.name = Wn), (a.position.z = 0.55), e.add(a));
      const r = new ot();
      ((r.name = jn), (r.position.z = 0.05));
      const l = new Ct(0.38, 0.22, 0.32),
        c = new n(l, s);
      ((c.position.z = 0.37), r.add(c));
      const h = new Ct(0.28, 0.2, 0.26),
        u = new n(h, s);
      ((u.position.z = 0.13), r.add(u));
      const d = new Ct(0.3, 0.22, 0.035),
        p = new X({ color: 2236962, roughness: 0.6, metalness: 0.15 }),
        m = new n(d, p);
      ((m.position.z = -0.01), r.add(m), a.add(r));
      const f = new ot();
      ((f.name = Zn), (f.position.z = 0.7));
      const g = new At(0.12, 10, 10),
        b = new n(g, Gn);
      ((b.position.z = 0.2), f.add(b));
      const y = new At(0.14, 10, 6, 0, 2 * Math.PI, 0, 0.6 * Math.PI),
        w = new n(y, i);
      ((w.position.z = 0.22), f.add(w));
      const x = new Mt(0.16, 0.16, 0.025, 10),
        v = new n(x, i);
      (v.position.set(0, 0.08, 0.26),
        (v.rotation.x = Math.PI / 8),
        f.add(v),
        r.add(f));
      const A = new ot();
      ((A.name = Kn), A.position.set(-0.19, 0, 0.37));
      const T = new Mt(0.04, 0.035, 0.34, 6),
        S = new n(T, s);
      (S.position.set(-0.03, -0.08, -0.07),
        (S.rotation.z = Math.PI / 4),
        (S.rotation.x = -Math.PI / 8),
        A.add(S),
        r.add(A));
      const M = new ot();
      ((M.name = Yn), M.position.set(0.19, 0, 0.37));
      const C = new n(T, s);
      (C.position.set(-0.01, -0.1, -0.02),
        (C.rotation.z = -Math.PI / 5),
        (C.rotation.x = -Math.PI / 6),
        M.add(C),
        r.add(M));
      const k = new ot();
      ((k.name = $n), k.position.set(-0.12, 0, 0.46));
      const R = new Ct(0.1, 0.1, 0.42),
        P = new n(R, o);
      ((P.position.z = -0.21), k.add(P));
      const E = new Ct(0.1, 0.14, 0.04),
        B = new n(E, Un);
      (B.position.set(0, 0.01, -0.44), k.add(B), e.add(k));
      const I = new ot();
      ((I.name = Xn), I.position.set(0.12, 0, 0.46));
      const _ = new n(R, o);
      ((_.position.z = -0.21), I.add(_));
      const L = new n(E, Un);
      return (
        L.position.set(0, 0.01, -0.44),
        I.add(L),
        e.add(I),
        (e.castShadow = !0),
        e
      );
    })(e)),
      (this.batter.name = "SYB_Batter"),
      this.batter.position.copy(o),
      this.batterHomePos.copy(o));
    const i = this.sceneIndex.anchors.get(nn.MOUND),
      a = i?.position ?? new m(0, 20, 0);
    (this.batter.lookAt(new m(a.x, a.y, o.z)), this.scene.add(this.batter));
    for (let n = 0; n < 3; n++) {
      const t = qn(e, !1);
      ((t.name = `SYB_Runner_${n + 1}B`), (t.visible = !1));
      const s = this.basePositions[n + 1].clone();
      (t.position.copy(s),
        this.scene.add(t),
        this.runners.push(t),
        this.runnerBasePositions.push(s.clone()));
    }
  }
  findPitcher() {
    ((this.pitcherMesh = this.sceneIndex.nodes.get("SYB_Pitcher") ?? null),
      this.pitcherMesh &&
        (this.pitcherOriginalZ = this.pitcherMesh.position.z));
  }
  updatePitcherIdle(t) {
    if (!this.pitcherMesh || this.pitcherDeliveryActive) return;
    this.pitcherFidgetPhase += t;
    const e = this.pitcherFidgetPhase,
      n = 0.03 * Math.sin(1.5 * e);
    this.pitcherMesh.position.x =
      (this.sceneIndex.anchors.get(nn.MOUND)?.position.x ?? 0) + n;
    const s = 0.02 * Math.sin(0.9 * e + 0.5);
    this.pitcherMesh.rotation.x = s;
    const o = e % 4;
    if (o > 3.6 && o < 3.9) {
      const t = (o - 3.6) / 0.3;
      this.pitcherMesh.position.z =
        this.pitcherOriginalZ + 0.04 * Math.sin(t * Math.PI);
    } else this.pitcherMesh.position.z = this.pitcherOriginalZ;
  }
  startPursuit(t) {
    ((this.chaseTarget = t.clone()),
      (this.chaseComplete = !1),
      (this.returning = !1),
      this.backupShifts.clear());
    let e = null,
      n = 1 / 0;
    for (const [s, o] of this.fielders) {
      if ("C" === s) continue;
      const i = o.homePos.distanceTo(t);
      i < n && ((n = i), (e = s));
    }
    if (((this.chaserKey = e), e))
      for (const [s, o] of this.fielders) {
        if ("C" === s || s === e) continue;
        if (o.homePos.distanceTo(t) < 40) {
          const e = o.homePos.clone().lerp(t, 0.25);
          ((e.z = o.homePos.z), this.backupShifts.set(s, e));
        }
      }
  }
  endPursuit(t) {
    if (this.chaserKey && this.chaseComplete) {
      const e = this.fielders.get(this.chaserKey);
      e &&
        (t && "MOUND" !== t
          ? this.startRelayThrow(e.currentPos.clone(), t)
          : this.startThrowBack(e.currentPos.clone()));
    }
    ((this.chaseTarget = null),
      (this.chaserKey = null),
      (this.chaseComplete = !1),
      (this.returning = !0));
  }
  startRelayThrow(t, e) {
    let s;
    s =
      "2B" === e
        ? (this.basePositions[2]?.clone() ?? new m(0, 18, 0.05))
        : "3B" === e
          ? (this.basePositions[3]?.clone() ?? new m(-13, 0, 0.05))
          : (this.basePositions[0]?.clone() ?? new m(0, 0, 0.05));
    const o = t.clone().lerp(s, 0.45);
    o.z = 0.05;
    const i = new At(0.035, 8, 6),
      a = new X({ color: 16119280, roughness: 0.6 });
    ((this.relayBall = new n(i, a)),
      this.relayBall.position.copy(t),
      (this.relayBall.position.z += 0.8),
      this.scene.add(this.relayBall),
      this.relayStart.copy(t).setZ(t.z + 0.8),
      this.relayMid.copy(o).setZ(o.z + 1),
      this.relayEnd.copy(s).setZ(s.z + 0.5),
      (this.relayProgress = 0),
      (this.relayPhase = "leg1"));
  }
  updateRelayThrow(t) {
    if ("done" === this.relayPhase || !this.relayBall) return;
    const e = this.relayStart.distanceTo(this.relayMid),
      n = this.relayMid.distanceTo(this.relayEnd);
    if (((this.relayProgress += t), "leg1" === this.relayPhase)) {
      const n = e / 35,
        s = Math.min(this.relayProgress / n, 1);
      (this.relayBall.position.lerpVectors(this.relayStart, this.relayMid, s),
        (this.relayBall.position.z += 0.06 * e * Math.sin(s * Math.PI)),
        (this.relayBall.rotation.x += 25 * t),
        s >= 1 && ((this.relayPhase = "leg2"), (this.relayProgress = 0)));
    } else if ("leg2" === this.relayPhase) {
      const e = n / 35,
        s = Math.min(this.relayProgress / e, 1);
      (this.relayBall.position.lerpVectors(this.relayMid, this.relayEnd, s),
        (this.relayBall.position.z += 0.05 * n * Math.sin(s * Math.PI)),
        (this.relayBall.rotation.x += 25 * t),
        s >= 1 &&
          ((this.relayPhase = "done"),
          this.scene.remove(this.relayBall),
          this.relayBall.geometry.dispose(),
          this.relayBall.material.dispose(),
          (this.relayBall = null)));
    }
  }
  startThrowBack(t) {
    const e = this.sceneIndex.anchors.get(nn.MOUND),
      s = e?.position.clone() ?? new m(0, 20, 0),
      o = new At(0.035, 8, 6),
      i = new X({ color: 16119280, roughness: 0.6 });
    ((this.throwBall = new n(o, i)),
      this.throwBall.position.copy(t),
      (this.throwBall.position.z += 0.8),
      this.scene.add(this.throwBall),
      (this.throwStart = t.clone()),
      (this.throwStart.z += 0.8),
      (this.throwEnd = s.clone()),
      (this.throwEnd.z += 1),
      (this.throwProgress = 0),
      (this.throwActive = !0));
  }
  startBatterRun() {
    this.batter &&
      ((this.batterRunning = !0),
      (this.batterRunComplete = !1),
      (this.batterRunSpeed = 14),
      (this.batterRunPath = [
        this.batterHomePos.clone(),
        this.basePositions[1].clone(),
      ]),
      (this.batterRunIndex = 0),
      (this.batterRunProgress = 0));
  }
  resolveBatterRun(t, e) {
    if (!this.batterRunning) return;
    if (e) return void (this.batterRunComplete = !0);
    if ("homeRun" === t)
      return (
        (this.batterRunSpeed = 8),
        void (this.batterRunPath = [
          this.batterHomePos.clone(),
          this.basePositions[1].clone(),
          this.basePositions[2].clone(),
          this.basePositions[3].clone(),
          this.batterHomePos.clone(),
        ])
      );
    const n = t;
    this.batterRunPath = [this.batterHomePos.clone()];
    for (let s = 1; s <= n; s++)
      this.batterRunPath.push(this.basePositions[s].clone());
  }
  resetBatter(t = !1) {
    if (
      ((this.batterRunning = !1),
      (this.batterRunComplete = !1),
      (this.batterRunPath = []),
      (this.batterRunIndex = 0),
      (this.batterRunProgress = 0),
      (this.lastBatterBaseIndex = -1),
      this.batter)
    )
      if (t)
        ((this.walkInActive = !0),
          (this.walkInProgress = 0),
          this.walkInStart.set(
            this.batterHomePos.x + 8,
            this.batterHomePos.y - 2,
            this.batterHomePos.z,
          ),
          this.batter.position.copy(this.walkInStart),
          this.batter.lookAt(
            new m(
              this.batterHomePos.x,
              this.batterHomePos.y,
              this.batterHomePos.z,
            ),
          ));
      else {
        this.batter.position.copy(this.batterHomePos);
        const t = this.sceneIndex.anchors.get(nn.MOUND),
          e = t?.position ?? new m(0, 20, 0);
        this.batter.lookAt(new m(e.x, e.y, this.batterHomePos.z));
      }
  }
  updateWalkIn(t) {
    if (!this.walkInActive || !this.batter) return;
    this.walkInProgress += t / this.WALK_IN_DURATION;
    const e = Math.min(this.walkInProgress, 1),
      n = 1 - Math.pow(1 - e, 2);
    this.batter.position.lerpVectors(this.walkInStart, this.batterHomePos, n);
    const s = 0.08 * Math.abs(Math.sin(e * Math.PI * 4));
    this.batter.position.z += s;
    const o = new m()
        .subVectors(this.batterHomePos, this.walkInStart)
        .normalize(),
      i = this.batter.position.clone().add(o);
    if (((i.z = this.batter.position.z), this.batter.lookAt(i), e >= 1)) {
      ((this.walkInActive = !1), this.batter.position.copy(this.batterHomePos));
      const t = this.sceneIndex.anchors.get(nn.MOUND),
        e = t?.position ?? new m(0, 20, 0);
      this.batter.lookAt(new m(e.x, e.y, this.batterHomePos.z));
    }
  }
  updateRunners(t) {
    for (let e = 2; e >= 0; e--)
      if (this.prevBases[e] && !t[e]) {
        const n = this.basePositions[e + 1].clone();
        let s;
        s =
          e < 2 && t[e + 1]
            ? this.basePositions[e + 2].clone()
            : this.basePositions[0].clone();
        const o = this.runners[e];
        o &&
          ((o.visible = !0),
          o.position.copy(n),
          this.runnerAnimations.push({
            runner: o,
            from: n,
            to: s,
            progress: 0,
            duration: 0.6,
          }));
      }
    (setTimeout(() => {
      for (let e = 0; e < 3; e++) {
        this.runnerAnimations.some((t) => t.runner === this.runners[e]) ||
          ((this.runners[e].visible = t[e]),
          t[e] && this.runners[e].position.copy(this.basePositions[e + 1]));
      }
    }, 50),
      (this.prevBases = [...t]));
  }
  updateRunnerAnimations(t) {
    for (let e = this.runnerAnimations.length - 1; e >= 0; e--) {
      const n = this.runnerAnimations[e];
      n.progress += t / n.duration;
      const s = Math.min(n.progress, 1);
      n.runner.position.lerpVectors(n.from, n.to, s);
      const o = 0.1 * Math.abs(Math.sin(s * Math.PI * 3));
      n.runner.position.z += o;
      const i = new m().subVectors(n.to, n.from).normalize();
      if (i.lengthSq() > 0) {
        const t = n.runner.position.clone().add(i);
        ((t.z = n.runner.position.z), n.runner.lookAt(t));
      }
      if (s >= 1) {
        (n.to.distanceTo(this.basePositions[0]) < 0.5 &&
          (n.runner.visible = !1),
          this.onBaseArrival?.(n.to.clone()),
          this.runnerAnimations.splice(e, 1));
      }
    }
  }
  crouchInfielders() {
    ((this.infieldersCrouching = !0), (this.crouchProgress = 0));
  }
  standInfielders() {
    ((this.infieldersCrouching = !1), (this.crouchProgress = 0));
    for (const t of this.INFIELD_KEYS) {
      const e = this.fielders.get(t);
      e && ((e.mesh.position.z = e.homePos.z), (e.mesh.rotation.x = 0));
    }
  }
  updateInfielderCrouch(t) {
    if (!this.infieldersCrouching) return;
    this.crouchProgress = Math.min(this.crouchProgress + 4 * t, 1);
    const e = this.crouchProgress;
    for (const n of this.INFIELD_KEYS) {
      const t = this.fielders.get(n);
      t &&
        this.chaserKey !== n &&
        ((t.mesh.position.z = t.homePos.z - 0.08 * e),
        (t.mesh.rotation.x = 0.15 * e));
    }
  }
  adjustForSituation(t, e, n, s) {
    const o = s[2],
      i = t >= 2 && e < 2;
    for (const [a, r] of this.fielders) {
      if ("C" === a) continue;
      if (this.chaserKey === a) continue;
      const t = "LF" === a || "CF" === a || "RF" === a;
      if (
        ("1B_F" === a || "2B_F" === a || "SS_F" === a || "3B_F" === a) &&
        o &&
        n < 2
      ) {
        const t = new m()
            .subVectors(this.basePositions[0], r.homePos)
            .normalize(),
          e = r.homePos.clone().addScaledVector(t, 3);
        ((e.z = r.homePos.z), r.mesh.position.copy(e), r.currentPos.copy(e));
      } else if (t && i) {
        const t = new m()
            .subVectors(r.homePos, this.basePositions[0])
            .normalize(),
          e = r.homePos.clone().addScaledVector(t, 4);
        ((e.z = r.homePos.z), r.mesh.position.copy(e), r.currentPos.copy(e));
      } else (r.mesh.position.copy(r.homePos), r.currentPos.copy(r.homePos));
    }
  }
  shiftCatcher(t) {
    const e = this.fielders.get("C");
    if (!e) return;
    const n = e.homePos.x + 0.3 * t;
    ((e.currentPos.x = n), (e.mesh.position.x = n));
  }
  resetCatcher() {
    const t = this.fielders.get("C");
    t && (t.currentPos.copy(t.homePos), t.mesh.position.copy(t.homePos));
  }
  triggerCatcherPump() {
    ((this.catcherPumpActive = !0), (this.catcherPumpProgress = 0));
  }
  updateCatcherPump(t) {
    if (!this.catcherPumpActive) return;
    const e = this.fielders.get("C");
    if (!e) return;
    this.catcherPumpProgress += t;
    const n = Math.min(this.catcherPumpProgress / 0.35, 1);
    if (n < 0.4) {
      const t = n / 0.4;
      e.mesh.position.z = e.homePos.z + 0.3 * t;
    } else if (n < 0.7) {
      const t = (n - 0.4) / 0.3;
      e.mesh.position.z = e.homePos.z + 0.3 + 0.15 * Math.sin(t * Math.PI);
    } else {
      const t = (n - 0.7) / 0.3;
      e.mesh.position.z = e.homePos.z + 0.3 * (1 - t);
    }
    n >= 1 &&
      ((this.catcherPumpActive = !1), (e.mesh.position.z = e.homePos.z));
  }
  triggerCatchAnimation() {
    if (!this.chaserKey) return;
    const t = this.fielders.get(this.chaserKey);
    t &&
      ((this.catchAnimActive = !0),
      (this.catchAnimProgress = 0),
      (this.catchAnimKey = this.chaserKey),
      (this.catchAnimOrigZ = t.homePos.z));
  }
  updateCatchAnimation(t) {
    if (!this.catchAnimActive || !this.catchAnimKey) return;
    const e = this.fielders.get(this.catchAnimKey);
    if (!e) return void (this.catchAnimActive = !1);
    this.catchAnimProgress += t;
    const n = Math.min(this.catchAnimProgress / 0.45, 1);
    if (n < 0.35) {
      const t = n / 0.35,
        s = Math.sin(t * Math.PI * 0.5);
      ((e.mesh.position.z = this.catchAnimOrigZ + 0.6 * s),
        (e.mesh.rotation.x = 0.2 * -s));
    } else if (n < 0.6) e.mesh.position.z = this.catchAnimOrigZ + 0.6;
    else {
      const t = (n - 0.6) / 0.4,
        s = 1 - Math.pow(1 - t, 2);
      ((e.mesh.position.z = this.catchAnimOrigZ + 0.6 * (1 - s)),
        (e.mesh.rotation.x = -0.2 * (1 - s)));
    }
    n >= 1 &&
      ((this.catchAnimActive = !1),
      (e.mesh.position.z = this.catchAnimOrigZ),
      (e.mesh.rotation.x = 0));
  }
  startPitcherDelivery(t) {
    this.pitcherMesh &&
      ((this.pitcherDeliveryActive = !0),
      (this.pitcherDeliveryProgress = 0),
      (this.pitcherDeliveryDuration = t ?? 0.4));
  }
  update(t) {
    (this.updateFielderPursuit(t),
      this.updateFielderReturn(t),
      this.updateBatterRun(t),
      this.updatePitcherDelivery(t),
      this.updateBatterSwing(t),
      this.updateThrowBack(t),
      this.updateRelayThrow(t),
      this.updateInfielderCrouch(t),
      this.updateCatcherPump(t),
      this.updateCatchAnimation(t),
      this.updateRunnerAnimations(t),
      this.updateWalkIn(t),
      this.chaserKey || this.returning || this.animateIdleSway());
  }
  animateIdleSway() {
    const t = 0.001 * performance.now();
    for (const [e, n] of this.fielders) {
      if ("C" === e) continue;
      if (this.chaserKey === e) continue;
      const s = 0.7 * e.charCodeAt(0),
        o = 0.04 * Math.sin(1.2 * t + s);
      n.mesh.position.x = n.homePos.x + o;
      const i = 0.02 * Math.sin(0.8 * t + 1.3 * s);
      n.mesh.position.y = n.homePos.y + i;
    }
  }
  updateFielderPursuit(t) {
    if (!this.chaserKey || !this.chaseTarget || this.chaseComplete) return;
    const e = this.fielders.get(this.chaserKey);
    if (!e) return;
    const n = new m().subVectors(this.chaseTarget, e.currentPos),
      s = n.length();
    if (s < 0.5) return void (this.chaseComplete = !0);
    n.normalize();
    const o = Math.min(18 * t, s);
    (e.currentPos.addScaledVector(n, o), e.mesh.position.copy(e.currentPos));
    const i = e.currentPos.clone().add(n);
    ((i.z = e.currentPos.z), e.mesh.lookAt(i));
    const a = 0.15 * Math.abs(Math.sin(0.012 * performance.now()));
    e.mesh.position.z = e.currentPos.z + a;
    for (const [r, l] of this.backupShifts) {
      const e = this.fielders.get(r);
      if (!e) continue;
      const n = new m().subVectors(l, e.currentPos),
        s = n.length();
      if (s > 0.2) {
        n.normalize();
        const o = Math.min(8 * t, s);
        (e.currentPos.addScaledVector(n, o),
          e.mesh.position.copy(e.currentPos));
        const i = e.currentPos.clone().add(n);
        ((i.z = e.currentPos.z), e.mesh.lookAt(i));
      }
    }
  }
  updateFielderReturn(t) {
    if (!this.returning) return;
    let e = !0;
    for (const [, n] of this.fielders) {
      const s = n.currentPos.distanceTo(n.homePos);
      if (s > 0.1) {
        e = !1;
        const o = new m().subVectors(n.homePos, n.currentPos);
        o.normalize();
        const i = Math.min(8 * t, s);
        (n.currentPos.addScaledVector(o, i),
          n.mesh.position.copy(n.currentPos));
        const a = n.currentPos.clone().add(o);
        ((a.z = n.currentPos.z), n.mesh.lookAt(a));
      } else (n.currentPos.copy(n.homePos), n.mesh.position.copy(n.homePos));
    }
    e && (this.returning = !1);
  }
  updateBatterRun(t) {
    if (!this.batterRunning || this.batterRunComplete || !this.batter) return;
    if (this.batterRunPath.length < 2) return;
    const e = this.batterRunPath[this.batterRunIndex],
      n = this.batterRunPath[this.batterRunIndex + 1];
    if (!e || !n) return void (this.batterRunComplete = !0);
    const s = e.distanceTo(n);
    if (s < 0.01)
      return (
        this.batterRunIndex++,
        void (
          this.batterRunIndex >= this.batterRunPath.length - 1 &&
          (this.batterRunComplete = !0)
        )
      );
    if (
      ((this.batterRunProgress += (this.batterRunSpeed * t) / s),
      this.batterRunProgress >= 1)
    )
      return (
        this.batter.position.copy(n),
        this.batterRunIndex++,
        (this.batterRunProgress = 0),
        this.batterRunIndex !== this.lastBatterBaseIndex &&
          ((this.lastBatterBaseIndex = this.batterRunIndex),
          this.onBaseArrival?.(n.clone())),
        void (
          this.batterRunIndex >= this.batterRunPath.length - 1 &&
          (this.batterRunComplete = !0)
        )
      );
    this.batter.position.lerpVectors(e, n, this.batterRunProgress);
    const o = 0.12 * Math.abs(Math.sin(0.014 * performance.now()));
    this.batter.position.z += o;
    const i = new m().subVectors(n, e).normalize(),
      a = this.batter.position.clone().add(i);
    ((a.z = this.batter.position.z), this.batter.lookAt(a));
  }
  updateThrowBack(t) {
    if (
      !(this.throwActive && this.throwBall && this.throwStart && this.throwEnd)
    )
      return;
    const e = this.throwStart.distanceTo(this.throwEnd),
      n = e / 35;
    this.throwProgress += t;
    const s = Math.min(this.throwProgress / n, 1);
    this.throwBall.position.lerpVectors(this.throwStart, this.throwEnd, s);
    const o = 0.08 * e;
    ((this.throwBall.position.z += o * Math.sin(s * Math.PI)),
      (this.throwBall.rotation.x += 25 * t),
      s >= 1 &&
        (this.scene.remove(this.throwBall),
        this.throwBall.geometry.dispose(),
        this.throwBall.material.dispose(),
        (this.throwBall = null),
        (this.throwActive = !1)));
  }
  updatePitcherDelivery(t) {
    if (!this.pitcherDeliveryActive || !this.pitcherMesh) return;
    this.pitcherDeliveryProgress += t;
    const e = this.pitcherDeliveryDuration,
      n = Math.min(this.pitcherDeliveryProgress / e, 1),
      s = this.pitcherMesh.getObjectByName(un),
      o = this.pitcherMesh.getObjectByName(dn),
      i = this.pitcherMesh.getObjectByName(pn),
      a = this.pitcherMesh.getObjectByName(mn),
      r = this.pitcherMesh.getObjectByName(fn),
      l = this.pitcherMesh.getObjectByName(gn),
      c = !!(s && o && i && a && r);
    if (c) {
      const t = (t) => Math.sin(t * Math.PI * 0.5);
      if (n < 0.15) {
        const e = t(n / 0.15);
        ((a.rotation.x = 1.4 * e),
          (r.rotation.x = -0.08 * e),
          (s.rotation.x = -0.06 * e),
          o && (o.rotation.x = 0.3 * e),
          i && (i.rotation.x = 0.3 * e),
          (this.pitcherMesh.position.z = this.pitcherOriginalZ + 0.08 * e));
      } else if (n < 0.4) {
        const e = t((n - 0.15) / 0.25);
        ((a.rotation.x = 1.4 * (1 - 0.9 * e)),
          (a.rotation.z = -0.15 * e),
          (r.rotation.x = -0.1 * e - 0.08),
          (s.rotation.x = 0.15 * e - 0.06),
          (s.rotation.y = -0.35 * e),
          o && ((o.rotation.x = 0.3 - 1.1 * e), (o.rotation.z = -0.7 * e)),
          i && ((i.rotation.x = 0.3 - 0.6 * e), (i.rotation.z = 0.3 * e)),
          (this.pitcherMesh.position.y -= 0.15 * e),
          (this.pitcherMesh.position.z =
            this.pitcherOriginalZ + 0.08 * (1 - 0.5 * e)));
      } else if (n < 0.55) {
        const e = t((n - 0.4) / 0.15);
        ((a.rotation.x = 1.4 * 0.1 + -0.15 * e),
          (r.rotation.x = -0.05 * e - 0.18),
          (s.rotation.x = 0.09 + 0.2 * e),
          (s.rotation.y = -0.35 - 0.25 * e),
          o &&
            ((o.rotation.x = -0.8 - 0.8 * e), (o.rotation.z = 0.2 * e - 0.7)),
          i &&
            ((i.rotation.x = -0.3 - 0.2 * e), (i.rotation.z = 0.3 + 0.15 * e)));
      } else if (n < 0.7) {
        const t = (n - 0.55) / 0.15,
          e = 1 - Math.pow(1 - t, 3);
        (o && ((o.rotation.x = 2.8 * e - 1.6), (o.rotation.z = 0.8 * e - 0.5)),
          (s.rotation.x = 0.29 + 0.35 * e),
          (s.rotation.y = 0.45 * e - 0.6),
          i &&
            ((i.rotation.x = 0.6 * e - 0.5), (i.rotation.z = 0.45 - 0.3 * e)),
          (a.rotation.x = -0.05 - 0.1 * e),
          (r.rotation.x = 0.1 * e - 0.23));
      } else if (n < 0.85) {
        const e = t((n - 0.7) / 0.15);
        (o && ((o.rotation.x = 1.2 + 0.3 * e), (o.rotation.z = 0.3 - 0.2 * e)),
          (s.rotation.x = 0.64 + 0.1 * e),
          (s.rotation.y = 0.1 * e - 0.15),
          (r.rotation.x = 0.4 * e - 0.13),
          i && (i.rotation.x = 0.1 - 0.1 * e));
      } else {
        const e = t((n - 0.85) / 0.15);
        (o && ((o.rotation.x = 1.5 * (1 - e)), (o.rotation.z = 0.1 * (1 - e))),
          i && ((i.rotation.x = 0 * (1 - e)), (i.rotation.z = 0)),
          (s.rotation.x = 0.74 * (1 - e)),
          (s.rotation.y = -0.05 * (1 - e)),
          (a.rotation.x = -0.15 * (1 - e)),
          (a.rotation.z = 0),
          (r.rotation.x = 0.27 * (1 - e)));
        const l = this.sceneIndex.anchors.get(nn.MOUND)?.position.y ?? 20;
        ((this.pitcherMesh.position.y += (l - this.pitcherMesh.position.y) * e),
          (this.pitcherMesh.position.z =
            this.pitcherOriginalZ + 0.04 * (1 - e)));
      }
      l && (l.rotation.x = -0.3 * s.rotation.x);
    } else if (n < 0.3) {
      const t = Math.sin((n / 0.3) * Math.PI * 0.5);
      this.pitcherMesh.position.z = this.pitcherOriginalZ + 0.15 * t;
    } else if (n < 0.7) {
      const t = Math.sin(((n - 0.3) / 0.4) * Math.PI * 0.5);
      ((this.pitcherMesh.position.z =
        this.pitcherOriginalZ + 0.15 * (1 - 0.8 * t)),
        (this.pitcherMesh.position.y -= 0.3 * t));
    } else {
      const t = 1 - Math.pow(1 - (n - 0.7) / 0.3, 3);
      this.pitcherMesh.position.z = this.pitcherOriginalZ + 0.03 * (1 - t);
      const e = this.sceneIndex.anchors.get(nn.MOUND)?.position.y ?? 20;
      this.pitcherMesh.position.y += (e - this.pitcherMesh.position.y) * t;
    }
    if (n >= 1) {
      ((this.pitcherDeliveryActive = !1),
        (this.pitcherDeliveryProgress = 0),
        c &&
          (s.rotation.set(0, 0, 0),
          o.rotation.set(0, 0, 0),
          i.rotation.set(0, 0, 0),
          a.rotation.set(0, 0, 0),
          r.rotation.set(0, 0, 0),
          l && l.rotation.set(0, 0, 0)),
        (this.pitcherMesh.rotation.x = 0),
        (this.pitcherMesh.position.z = this.pitcherOriginalZ));
      const t = this.sceneIndex.anchors.get(nn.MOUND)?.position.y ?? 20;
      this.pitcherMesh.position.y = t;
    }
  }
  startBatterSwing() {
    this.batter &&
      ((this.batterSwingActive = !0), (this.batterSwingProgress = 0));
  }
  get isBatterSwinging() {
    return this.batterSwingActive;
  }
  updateBatterSwing(t) {
    if (!this.batterSwingActive || !this.batter) return;
    this.batterSwingProgress += t;
    const e = Math.min(this.batterSwingProgress / this.batterSwingDuration, 1),
      n = this.batter.getObjectByName(Wn),
      s = this.batter.getObjectByName(jn),
      o = this.batter.getObjectByName(Kn),
      i = this.batter.getObjectByName(Yn),
      a = this.batter.getObjectByName($n),
      r = this.batter.getObjectByName(Xn),
      l = this.batter.getObjectByName(Zn);
    if (!!(!n || !s))
      return (
        (this.batter.rotation.z =
          e < 0.5 ? 2 * e * 0.3 : 0.3 * (1 - 2 * (e - 0.5))),
        void (
          e >= 1 &&
          ((this.batterSwingActive = !1), (this.batter.rotation.z = 0))
        )
      );
    const c = (t) => Math.sin(t * Math.PI * 0.5);
    if (e < 0.15) {
      const t = c(e / 0.15);
      ((n.rotation.y = 0.12 * t),
        s && (s.rotation.y = 0.18 * t),
        a && (a.rotation.x = 0.15 * t),
        r && (r.rotation.x = -0.08 * t),
        i && (i.rotation.z = -0.2 * t));
    } else if (e < 0.35) {
      const t = c((e - 0.15) / 0.2);
      ((n.rotation.y = 0.12 * (1 - 0.3 * t)),
        s && (s.rotation.y = 0.18 + 0.08 * t),
        a && (a.rotation.x = 0.15 - 0.25 * t),
        i && (i.rotation.z = -0.2 - 0.1 * t));
    } else if (e < 0.55) {
      const t = (e - 0.35) / 0.2,
        o = 1 - Math.pow(1 - t, 3);
      ((n.rotation.y = 0.084 - 1.2 * o),
        s && (s.rotation.y = 0.26 - 0.5 * o),
        a && (a.rotation.x = -0.1 - 0.1 * o),
        r && (r.rotation.x = 0.15 * o - 0.08));
    } else if (e < 0.75) {
      const t = (e - 0.55) / 0.2,
        a = 1 - Math.pow(1 - t, 3);
      ((n.rotation.y = -1.116 - 0.3 * a),
        s && (s.rotation.y = -0.24 - 1 * a),
        o && ((o.rotation.x = -0.4 * a), (o.rotation.z = -0.3 * a)),
        i && ((i.rotation.x = -0.3 * a), (i.rotation.z = 0.6 * a - 0.3)),
        r && (r.rotation.x = 0.07 + 0.25 * a));
    } else if (e < 0.85) {
      const t = c((e - 0.75) / 0.1);
      ((n.rotation.y = -1.416 - 0.1 * t),
        s && (s.rotation.y = -1.24 - 0.15 * t),
        r && (r.rotation.x = 0.32 + 0.1 * t));
    } else {
      const t = c((e - 0.85) / 0.15);
      ((n.rotation.y = -1.516 * (1 - 0.7 * t)),
        s && (s.rotation.y = -1.39 * (1 - 0.7 * t)),
        o && ((o.rotation.x = -0.4 * (1 - t)), (o.rotation.z = -0.3 * (1 - t))),
        i && ((i.rotation.x = -0.3 * (1 - t)), (i.rotation.z = 0.3 * (1 - t))),
        a && (a.rotation.x = a.rotation.x * (1 - t)),
        r && (r.rotation.x = 0.42 * (1 - t)));
    }
    (l && s && (l.rotation.y = 0.6 * -s.rotation.y),
      e >= 1 &&
        ((this.batterSwingActive = !1),
        (this.batterSwingProgress = 0),
        n.rotation.set(0, 0, 0),
        s && s.rotation.set(0, 0, 0),
        o && o.rotation.set(0, 0, 0),
        i && i.rotation.set(0, 0, 0),
        a && a.rotation.set(0, 0, 0),
        r && r.rotation.set(0, 0, 0),
        l && l.rotation.set(0, 0, 0)));
  }
  dispose() {
    for (const [, t] of this.fielders) this.scene.remove(t.mesh);
    for (const t of this.runners) this.scene.remove(t);
    (this.batter && this.scene.remove(this.batter),
      this.throwBall &&
        (this.scene.remove(this.throwBall),
        this.throwBall.geometry.dispose(),
        this.throwBall.material.dispose(),
        (this.throwBall = null)),
      this.relayBall &&
        (this.scene.remove(this.relayBall),
        this.relayBall.geometry.dispose(),
        this.relayBall.material.dispose(),
        (this.relayBall = null)),
      this.fielders.clear(),
      (this.runners = []));
  }
}
class Jn {
  constructor() {
    (e(this, "ctx", null),
      e(this, "masterGain", null),
      e(this, "ambientSource", null),
      e(this, "ambientGain", null),
      e(this, "isUnlocked", !1),
      e(this, "ambientLayers", []),
      e(this, "ambientLayerGains", []),
      e(this, "ambientMidFilter", null),
      e(this, "ambientHighFilter", null),
      e(this, "ambientLfoNode", null),
      e(this, "rallyMode", !1),
      e(this, "currentTensionStrikes", 0),
      e(this, "baseAmbientVolume", 0.08),
      e(this, "whooshSource", null),
      e(this, "whooshGain", null),
      e(this, "muted", !1));
    try {
      ((this.ctx = new (window.AudioContext || window.webkitAudioContext)()),
        (this.masterGain = this.ctx.createGain()),
        (this.masterGain.gain.value = 0.7),
        this.masterGain.connect(this.ctx.destination));
    } catch (t) {}
  }
  async unlock() {
    if (this.isUnlocked || !this.ctx) return;
    "suspended" === this.ctx.state && (await this.ctx.resume());
    const t = this.ctx.createBuffer(1, 1, 22050),
      e = this.ctx.createBufferSource();
    ((e.buffer = t),
      e.connect(this.ctx.destination),
      e.start(0),
      (this.isUnlocked = !0));
  }
  noise(t) {
    const e = this.ctx,
      n = e.sampleRate * t,
      s = e.createBuffer(1, n, e.sampleRate),
      o = s.getChannelData(0);
    for (let i = 0; i < n; i++) o[i] = 2 * Math.random() - 1;
    return s;
  }
  playCrack(t = "good") {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const e = this.ctx,
      n = e.currentTime,
      s = {
        perfect: { freq: 2800, q: 6, vol: 1, dur: 0.1 },
        good: { freq: 2200, q: 5, vol: 0.7, dur: 0.08 },
        weak: { freq: 1200, q: 3, vol: 0.4, dur: 0.06 },
        foul: { freq: 1600, q: 4, vol: 0.35, dur: 0.05 },
      },
      o = s[t] ?? s.good,
      i = e.createBufferSource();
    i.buffer = this.noise(o.dur);
    const a = e.createBiquadFilter();
    ((a.type = "bandpass"), (a.frequency.value = o.freq), (a.Q.value = o.q));
    const r = e.createGain();
    if (
      (r.gain.setValueAtTime(o.vol, n),
      r.gain.exponentialRampToValueAtTime(0.001, n + o.dur),
      i.connect(a),
      a.connect(r),
      r.connect(this.masterGain),
      i.start(n),
      "perfect" === t)
    ) {
      const t = e.createOscillator();
      ((t.type = "sine"), (t.frequency.value = 120));
      const s = e.createGain();
      (s.gain.setValueAtTime(0.3, n),
        s.gain.exponentialRampToValueAtTime(0.001, n + 0.15),
        t.connect(s),
        s.connect(this.masterGain),
        t.start(n),
        t.stop(n + 0.2));
    }
  }
  playWhiff() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime,
      n = t.createBufferSource();
    n.buffer = this.noise(0.15);
    const s = t.createBiquadFilter();
    ((s.type = "bandpass"),
      s.frequency.setValueAtTime(800, e),
      s.frequency.linearRampToValueAtTime(200, e + 0.15),
      (s.Q.value = 2));
    const o = t.createGain();
    (o.gain.setValueAtTime(0.4, e),
      o.gain.linearRampToValueAtTime(0, e + 0.15),
      n.connect(s),
      s.connect(o),
      o.connect(this.masterGain),
      n.start(e));
  }
  playCheer() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime,
      n = t.createBufferSource();
    n.buffer = this.noise(2);
    const s = t.createBiquadFilter();
    ((s.type = "bandpass"), (s.frequency.value = 1500), (s.Q.value = 0.5));
    const o = t.createOscillator();
    o.frequency.value = 3;
    const i = t.createGain();
    ((i.gain.value = 300),
      o.connect(i),
      i.connect(s.frequency),
      o.start(e),
      o.stop(e + 2));
    const a = t.createGain();
    (a.gain.setValueAtTime(0, e),
      a.gain.linearRampToValueAtTime(0.5, e + 0.2),
      a.gain.setValueAtTime(0.5, e + 1.2),
      a.gain.linearRampToValueAtTime(0, e + 2),
      n.connect(s),
      s.connect(a),
      a.connect(this.masterGain),
      n.start(e));
  }
  playGroan() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime,
      n = t.createBufferSource();
    n.buffer = this.noise(1);
    const s = t.createBiquadFilter();
    ((s.type = "bandpass"),
      s.frequency.setValueAtTime(600, e),
      s.frequency.linearRampToValueAtTime(300, e + 1),
      (s.Q.value = 0.8));
    const o = t.createGain();
    (o.gain.setValueAtTime(0.4, e),
      o.gain.linearRampToValueAtTime(0, e + 1),
      n.connect(s),
      s.connect(o),
      o.connect(this.masterGain),
      n.start(e));
  }
  playStrike() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime;
    [0, 0.12].forEach((n) => {
      const s = t.createOscillator();
      ((s.type = "square"),
        (s.frequency.value = 350),
        (s.detune.value = 40 * Math.random() - 20));
      const o = t.createGain();
      (o.gain.setValueAtTime(0.2, e + n),
        o.gain.exponentialRampToValueAtTime(0.001, e + n + 0.08),
        s.connect(o),
        o.connect(this.masterGain),
        s.start(e + n),
        s.stop(e + n + 0.1));
    });
  }
  playBall() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime,
      n = t.createOscillator();
    ((n.type = "square"),
      (n.frequency.value = 250),
      (n.detune.value = 40 * Math.random() - 20));
    const s = t.createGain();
    (s.gain.setValueAtTime(0.2, e),
      s.gain.exponentialRampToValueAtTime(0.001, e + 0.3),
      n.connect(s),
      s.connect(this.masterGain),
      n.start(e),
      n.stop(e + 0.35));
  }
  startPitchWhoosh(t) {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    this.stopPitchWhoosh();
    const e = this.ctx,
      n = e.currentTime,
      s = e.createBufferSource();
    s.buffer = this.noise(1.5);
    const o = e.createBiquadFilter();
    o.type = "bandpass";
    const i = 300 + 8 * t;
    (o.frequency.setValueAtTime(0.4 * i, n),
      o.frequency.linearRampToValueAtTime(i, n + 0.7),
      (o.Q.value = 1.5));
    const a = e.createGain();
    (a.gain.setValueAtTime(0, n),
      a.gain.linearRampToValueAtTime(0.15, n + 0.5),
      a.gain.setValueAtTime(0.15, n + 0.7),
      a.gain.linearRampToValueAtTime(0, n + 1),
      s.connect(o),
      o.connect(a),
      a.connect(this.masterGain),
      s.start(n),
      (this.whooshSource = s),
      (this.whooshGain = a));
  }
  stopPitchWhoosh() {
    if (this.whooshSource) {
      try {
        this.whooshSource.stop();
      } catch (t) {}
      this.whooshSource = null;
    }
    this.whooshGain = null;
  }
  playHomeRunHorn() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime;
    ([220, 440].forEach((n) => {
      const s = t.createOscillator();
      ((s.type = "sawtooth"), (s.frequency.value = n));
      const o = t.createBiquadFilter();
      ((o.type = "lowpass"), (o.frequency.value = 1200));
      const i = t.createGain();
      (i.gain.setValueAtTime(0, e),
        i.gain.linearRampToValueAtTime(0.3, e + 0.3),
        i.gain.setValueAtTime(0.3, e + 1),
        i.gain.linearRampToValueAtTime(0, e + 1.5),
        s.connect(o),
        o.connect(i),
        i.connect(this.masterGain),
        s.start(e),
        s.stop(e + 1.6));
    }),
      setTimeout(() => this.playCheer(), 200));
  }
  startAmbient() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain || this.ambientSource)
      return;
    const t = this.ctx;
    this.stopAmbientLayers();
    const e = t.createBuffer(1, 4 * t.sampleRate, t.sampleRate),
      n = e.getChannelData(0);
    let s = 0;
    for (let w = 0; w < n.length; w++) {
      ((s = (s + 0.02 * (2 * Math.random() - 1)) / 1.02), (n[w] = 3.5 * s));
    }
    const o = t.createBufferSource();
    ((o.buffer = e), (o.loop = !0));
    const i = t.createBiquadFilter();
    ((i.type = "lowpass"), (i.frequency.value = 250));
    const a = t.createGain();
    ((a.gain.value = this.baseAmbientVolume),
      o.connect(i),
      i.connect(a),
      a.connect(this.masterGain),
      o.start());
    const r = t.createBuffer(1, 6 * t.sampleRate, t.sampleRate),
      l = r.getChannelData(0);
    for (let w = 0; w < l.length; w++) l[w] = 0.6 * (2 * Math.random() - 1);
    const c = t.createBufferSource();
    ((c.buffer = r), (c.loop = !0));
    const h = t.createBiquadFilter();
    ((h.type = "bandpass"),
      (h.frequency.value = 650),
      (h.Q.value = 0.6),
      (this.ambientMidFilter = h));
    const u = t.createOscillator();
    ((u.type = "sine"), (u.frequency.value = 0.15));
    const d = t.createGain();
    ((d.gain.value = 150),
      u.connect(d),
      d.connect(h.frequency),
      u.start(),
      (this.ambientLfoNode = u));
    const p = t.createGain();
    ((p.gain.value = 0.7 * this.baseAmbientVolume),
      c.connect(h),
      h.connect(p),
      p.connect(this.masterGain),
      c.start());
    const m = t.createBuffer(1, 5 * t.sampleRate, t.sampleRate),
      f = m.getChannelData(0);
    for (let w = 0; w < f.length; w++) f[w] = 0.3 * (2 * Math.random() - 1);
    const g = t.createBufferSource();
    ((g.buffer = m), (g.loop = !0));
    const b = t.createBiquadFilter();
    ((b.type = "bandpass"),
      (b.frequency.value = 1800),
      (b.Q.value = 0.4),
      (this.ambientHighFilter = b));
    const y = t.createGain();
    ((y.gain.value = 0.35 * this.baseAmbientVolume),
      g.connect(b),
      b.connect(y),
      y.connect(this.masterGain),
      g.start(),
      (this.ambientSource = o),
      (this.ambientGain = a),
      (this.ambientLayers = [o, c, g]),
      (this.ambientLayerGains = [a, p, y]));
  }
  stopAmbientLayers() {
    for (const e of this.ambientLayers)
      try {
        e.stop();
      } catch (t) {}
    if (this.ambientLfoNode) {
      try {
        this.ambientLfoNode.stop();
      } catch (t) {}
      this.ambientLfoNode = null;
    }
    ((this.ambientLayers = []),
      (this.ambientLayerGains = []),
      (this.ambientMidFilter = null),
      (this.ambientHighFilter = null));
  }
  playOrganRiff() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime;
    [523.25, 659.25, 783.99].forEach((n, s) => {
      const o = t.createOscillator();
      ((o.type = "square"), (o.frequency.value = n));
      const i = t.createBiquadFilter();
      ((i.type = "lowpass"), (i.frequency.value = 2e3));
      const a = t.createGain(),
        r = e + 0.15 * s;
      (a.gain.setValueAtTime(0, r),
        a.gain.linearRampToValueAtTime(0.2, r + 0.03),
        a.gain.setValueAtTime(0.2, r + 0.12),
        a.gain.exponentialRampToValueAtTime(0.001, r + 0.3),
        o.connect(i),
        i.connect(a),
        a.connect(this.masterGain),
        o.start(r),
        o.stop(r + 0.35));
    });
  }
  playUmpireOut() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime;
    [280, 220].forEach((n, s) => {
      const o = t.createOscillator();
      ((o.type = "square"), (o.frequency.value = n));
      const i = t.createGain(),
        a = e + 0.18 * s;
      (i.gain.setValueAtTime(0.25, a),
        i.gain.exponentialRampToValueAtTime(0.001, a + 0.15),
        o.connect(i),
        i.connect(this.masterGain),
        o.start(a),
        o.stop(a + 0.2));
    });
  }
  playCrowdForStreak(t) {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    if (t < 2) return;
    const e = this.ctx,
      n = e.currentTime,
      s = Math.min(0.3 + 0.1 * t, 0.8),
      o = 0.8 + 0.3 * t,
      i = e.createBufferSource();
    i.buffer = this.noise(o);
    const a = e.createBiquadFilter();
    ((a.type = "bandpass"),
      (a.frequency.value = 1200 + 200 * t),
      (a.Q.value = 0.4));
    const r = e.createGain();
    (r.gain.setValueAtTime(0, n),
      r.gain.linearRampToValueAtTime(s, n + 0.1),
      r.gain.setValueAtTime(s, n + 0.6 * o),
      r.gain.linearRampToValueAtTime(0, n + o),
      i.connect(a),
      a.connect(r),
      r.connect(this.masterGain),
      i.start(n));
  }
  playWalkUp() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime;
    [349.23, 440, 523.25].forEach((n, s) => {
      const o = t.createOscillator();
      ((o.type = "sawtooth"), (o.frequency.value = n));
      const i = t.createBiquadFilter();
      ((i.type = "lowpass"), (i.frequency.value = 1500));
      const a = t.createGain(),
        r = e + 0.1 * s;
      (a.gain.setValueAtTime(0, r),
        a.gain.linearRampToValueAtTime(0.15, r + 0.02),
        a.gain.exponentialRampToValueAtTime(0.001, r + 0.2),
        o.connect(i),
        i.connect(a),
        a.connect(this.masterGain),
        o.start(r),
        o.stop(r + 0.25));
    });
  }
  playCrowdForHit(t) {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const e = this.ctx,
      n = e.currentTime,
      s = {
        single: { vol: 0.25, dur: 0.8, freq: 1200 },
        double: { vol: 0.35, dur: 1.2, freq: 1400 },
        triple: { vol: 0.45, dur: 1.6, freq: 1600 },
        homeRun: { vol: 0.55, dur: 2, freq: 1800 },
      },
      o = s[t] ?? s.single,
      i = e.createBufferSource();
    i.buffer = this.noise(o.dur);
    const a = e.createBiquadFilter();
    ((a.type = "bandpass"), (a.frequency.value = o.freq), (a.Q.value = 0.5));
    const r = e.createOscillator();
    r.frequency.value = 2.5;
    const l = e.createGain();
    ((l.gain.value = 200),
      r.connect(l),
      l.connect(a.frequency),
      r.start(n),
      r.stop(n + o.dur));
    const c = e.createGain();
    (c.gain.setValueAtTime(0, n),
      c.gain.linearRampToValueAtTime(o.vol, n + 0.08),
      c.gain.setValueAtTime(o.vol, n + 0.5 * o.dur),
      c.gain.linearRampToValueAtTime(0, n + o.dur),
      i.connect(a),
      a.connect(c),
      c.connect(this.masterGain),
      i.start(n));
  }
  playTwoOutTension() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime,
      n = t.createBufferSource();
    n.buffer = this.noise(1.5);
    const s = t.createBiquadFilter();
    ((s.type = "bandpass"), (s.frequency.value = 800), (s.Q.value = 0.6));
    const o = t.createGain();
    (o.gain.setValueAtTime(0, e),
      o.gain.linearRampToValueAtTime(0.12, e + 0.5),
      o.gain.setValueAtTime(0.12, e + 1),
      o.gain.linearRampToValueAtTime(0, e + 1.5),
      n.connect(s),
      s.connect(o),
      o.connect(this.masterGain),
      n.start(e));
  }
  playFullCountClap() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime;
    for (let n = 0; n < 6; n++) {
      const s = e + 0.33 * n,
        o = t.createBufferSource();
      o.buffer = this.noise(0.04);
      const i = t.createBiquadFilter();
      ((i.type = "bandpass"), (i.frequency.value = 3e3), (i.Q.value = 2));
      const a = t.createGain();
      (a.gain.setValueAtTime(0.15 + 0.02 * n, s),
        a.gain.exponentialRampToValueAtTime(0.001, s + 0.05),
        o.connect(i),
        i.connect(a),
        a.connect(this.masterGain),
        o.start(s));
    }
  }
  setCrowdEnergy(t, e, n, s) {
    if (!this.ctx || !this.ambientGain || this.muted) return;
    let o =
      0.06 +
      Math.min(0.012 * (e - 1), 0.05) +
      Math.min(0.006 * t, 0.04) +
      Math.min(0.01 * n, 0.03);
    (void 0 !== s && s >= 3
      ? (o *= 0.15)
      : void 0 !== s && s >= 2 && (o *= 0.5),
      void 0 !== s && s >= 1 && n >= 1 && (o *= 2));
    const i = this.ctx.currentTime;
    (this.ambientGain.gain.cancelScheduledValues(i),
      this.ambientGain.gain.setTargetAtTime(Math.min(o, 0.2), i, 0.5));
  }
  playInningTransition() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime,
      n = t.createBufferSource();
    n.buffer = this.noise(2);
    const s = t.createBiquadFilter();
    ((s.type = "bandpass"),
      s.frequency.setValueAtTime(600, e),
      s.frequency.linearRampToValueAtTime(1200, e + 0.8),
      s.frequency.linearRampToValueAtTime(800, e + 2),
      (s.Q.value = 0.5));
    const o = t.createGain();
    (o.gain.setValueAtTime(0, e),
      o.gain.linearRampToValueAtTime(0.25, e + 0.6),
      o.gain.setValueAtTime(0.25, e + 1),
      o.gain.linearRampToValueAtTime(0, e + 2),
      n.connect(s),
      s.connect(o),
      o.connect(this.masterGain),
      n.start(e));
  }
  playBigInning() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime,
      n = t.createBufferSource();
    n.buffer = this.noise(3);
    const s = t.createBiquadFilter();
    ((s.type = "bandpass"), (s.frequency.value = 1600), (s.Q.value = 0.4));
    const o = t.createOscillator();
    o.frequency.value = 4;
    const i = t.createGain();
    ((i.gain.value = 400),
      o.connect(i),
      i.connect(s.frequency),
      o.start(e),
      o.stop(e + 3));
    const a = t.createGain();
    (a.gain.setValueAtTime(0, e),
      a.gain.linearRampToValueAtTime(0.6, e + 0.15),
      a.gain.setValueAtTime(0.6, e + 1.5),
      a.gain.linearRampToValueAtTime(0, e + 3),
      n.connect(s),
      s.connect(a),
      a.connect(this.masterGain),
      n.start(e));
  }
  playClutchHit() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime;
    [587.33, 739.99, 880].forEach((n, s) => {
      const o = t.createOscillator();
      ((o.type = "sawtooth"), (o.frequency.value = n));
      const i = t.createBiquadFilter();
      ((i.type = "lowpass"), (i.frequency.value = 2500));
      const a = t.createGain(),
        r = e + 0.08 * s;
      (a.gain.setValueAtTime(0, r),
        a.gain.linearRampToValueAtTime(0.25, r + 0.03),
        a.gain.setValueAtTime(0.25, r + 0.15),
        a.gain.exponentialRampToValueAtTime(0.001, r + 0.5),
        o.connect(i),
        i.connect(a),
        a.connect(this.masterGain),
        o.start(r),
        o.stop(r + 0.55));
    });
  }
  playGlovePop() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime,
      n = t.createBufferSource();
    n.buffer = this.noise(0.04);
    const s = t.createBiquadFilter();
    ((s.type = "bandpass"), (s.frequency.value = 4200), (s.Q.value = 3));
    const o = t.createOscillator();
    ((o.type = "sine"), (o.frequency.value = 180));
    const i = t.createGain();
    (i.gain.setValueAtTime(0.15, e),
      i.gain.exponentialRampToValueAtTime(0.001, e + 0.05),
      o.connect(i),
      i.connect(this.masterGain),
      o.start(e),
      o.stop(e + 0.06));
    const a = t.createGain();
    (a.gain.setValueAtTime(0.35, e),
      a.gain.exponentialRampToValueAtTime(0.001, e + 0.04),
      n.connect(s),
      s.connect(a),
      a.connect(this.masterGain),
      n.start(e));
  }
  playFoulTick() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime,
      n = t.createBufferSource();
    n.buffer = this.noise(0.02);
    const s = t.createBiquadFilter();
    ((s.type = "highpass"), (s.frequency.value = 5e3), (s.Q.value = 2));
    const o = t.createGain();
    (o.gain.setValueAtTime(0.2, e),
      o.gain.exponentialRampToValueAtTime(0.001, e + 0.03),
      n.connect(s),
      s.connect(o),
      o.connect(this.masterGain),
      n.start(e));
  }
  playWallBounce() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime,
      n = t.createOscillator();
    ((n.type = "sine"), (n.frequency.value = 80));
    const s = t.createGain();
    (s.gain.setValueAtTime(0.3, e),
      s.gain.exponentialRampToValueAtTime(0.001, e + 0.12),
      n.connect(s),
      s.connect(this.masterGain),
      n.start(e),
      n.stop(e + 0.15));
    const o = t.createBufferSource();
    o.buffer = this.noise(0.08);
    const i = t.createBiquadFilter();
    ((i.type = "bandpass"), (i.frequency.value = 2800), (i.Q.value = 4));
    const a = t.createGain();
    (a.gain.setValueAtTime(0.2, e + 0.03),
      a.gain.exponentialRampToValueAtTime(0.001, e + 0.1),
      o.connect(i),
      i.connect(a),
      a.connect(this.masterGain),
      o.start(e + 0.03));
  }
  playBasesLoaded() {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const t = this.ctx,
      e = t.currentTime,
      n = t.createBufferSource();
    n.buffer = this.noise(3);
    const s = t.createBiquadFilter();
    ((s.type = "bandpass"), (s.frequency.value = 1e3), (s.Q.value = 0.3));
    const o = t.createOscillator();
    o.frequency.value = 2;
    const i = t.createGain();
    ((i.gain.value = 0.15),
      o.connect(i),
      i.connect(s.frequency),
      o.start(e),
      o.stop(e + 3));
    const a = t.createGain();
    (a.gain.setValueAtTime(0, e),
      a.gain.linearRampToValueAtTime(0.4, e + 0.3),
      a.gain.setValueAtTime(0.4, e + 2),
      a.gain.linearRampToValueAtTime(0, e + 3),
      n.connect(s),
      s.connect(a),
      a.connect(this.masterGain),
      n.start(e));
    for (let r = 0; r < 4; r++) {
      const n = e + 0.3 + 0.5 * r,
        s = t.createOscillator();
      ((s.type = "sine"), (s.frequency.value = 60));
      const o = t.createGain();
      (o.gain.setValueAtTime(0.2, n),
        o.gain.exponentialRampToValueAtTime(0.001, n + 0.1),
        s.connect(o),
        o.connect(this.masterGain),
        s.start(n),
        s.stop(n + 0.12));
    }
  }
  crowdReact(t) {
    if (!this.ctx || !this.isUnlocked || !this.masterGain) return;
    const e = this.ctx,
      n = e.currentTime;
    switch (t) {
      case "hit": {
        const t = e.createBufferSource();
        t.buffer = this.noise(1.2);
        const s = e.createBiquadFilter();
        ((s.type = "bandpass"),
          (s.frequency.value = 1100),
          (s.Q.value = 0.5),
          s.frequency.linearRampToValueAtTime(1400, n + 0.6));
        const o = e.createGain();
        (o.gain.setValueAtTime(0, n),
          o.gain.linearRampToValueAtTime(0.3, n + 0.1),
          o.gain.setValueAtTime(0.3, n + 0.5),
          o.gain.linearRampToValueAtTime(0, n + 1.2),
          t.connect(s),
          s.connect(o),
          o.connect(this.masterGain),
          t.start(n));
        break;
      }
      case "homerun": {
        const t = e.createBufferSource();
        t.buffer = this.noise(3);
        const s = e.createBiquadFilter();
        ((s.type = "bandpass"), (s.frequency.value = 600), (s.Q.value = 0.3));
        const o = e.createGain();
        (o.gain.setValueAtTime(0, n),
          o.gain.linearRampToValueAtTime(0.45, n + 0.2),
          o.gain.setValueAtTime(0.45, n + 1.8),
          o.gain.linearRampToValueAtTime(0, n + 3),
          t.connect(s),
          s.connect(o),
          o.connect(this.masterGain),
          t.start(n));
        const i = e.createBufferSource();
        i.buffer = this.noise(3);
        const a = e.createBiquadFilter();
        ((a.type = "bandpass"), (a.frequency.value = 1600), (a.Q.value = 0.4));
        const r = e.createOscillator();
        r.frequency.value = 3.5;
        const l = e.createGain();
        ((l.gain.value = 350),
          r.connect(l),
          l.connect(a.frequency),
          r.start(n),
          r.stop(n + 3));
        const c = e.createGain();
        (c.gain.setValueAtTime(0, n),
          c.gain.linearRampToValueAtTime(0.5, n + 0.15),
          c.gain.setValueAtTime(0.5, n + 2),
          c.gain.linearRampToValueAtTime(0, n + 3),
          i.connect(a),
          a.connect(c),
          c.connect(this.masterGain),
          i.start(n));
        const h = e.createBufferSource();
        h.buffer = this.noise(2.5);
        const u = e.createBiquadFilter();
        ((u.type = "bandpass"), (u.frequency.value = 3200), (u.Q.value = 0.5));
        const d = e.createGain();
        (d.gain.setValueAtTime(0, n),
          d.gain.linearRampToValueAtTime(0.2, n + 0.3),
          d.gain.setValueAtTime(0.2, n + 1.5),
          d.gain.linearRampToValueAtTime(0, n + 2.5),
          h.connect(u),
          u.connect(d),
          d.connect(this.masterGain),
          h.start(n));
        break;
      }
      case "strikeout": {
        const t = e.createBufferSource();
        t.buffer = this.noise(1.4);
        const s = e.createBiquadFilter();
        ((s.type = "bandpass"),
          s.frequency.setValueAtTime(500, n),
          s.frequency.linearRampToValueAtTime(250, n + 1),
          (s.Q.value = 0.7));
        const o = e.createGain();
        (o.gain.setValueAtTime(0, n),
          o.gain.linearRampToValueAtTime(0.3, n + 0.08),
          o.gain.setValueAtTime(0.3, n + 0.3),
          o.gain.linearRampToValueAtTime(0, n + 1.4),
          t.connect(s),
          s.connect(o),
          o.connect(this.masterGain),
          t.start(n));
        const i = e.createBufferSource();
        i.buffer = this.noise(1);
        const a = e.createBiquadFilter();
        ((a.type = "bandpass"),
          a.frequency.setValueAtTime(800, n),
          a.frequency.linearRampToValueAtTime(400, n + 0.8),
          (a.Q.value = 0.5));
        const r = e.createGain();
        (r.gain.setValueAtTime(0, n),
          r.gain.linearRampToValueAtTime(0.15, n + 0.06),
          r.gain.setValueAtTime(0.15, n + 0.25),
          r.gain.linearRampToValueAtTime(0, n + 1),
          i.connect(a),
          a.connect(r),
          r.connect(this.masterGain),
          i.start(n));
        break;
      }
      case "foul": {
        const t = e.createBufferSource();
        t.buffer = this.noise(0.7);
        const s = e.createBiquadFilter();
        ((s.type = "bandpass"), (s.frequency.value = 1e3), (s.Q.value = 0.6));
        const o = e.createGain();
        (o.gain.setValueAtTime(0, n),
          o.gain.linearRampToValueAtTime(0.2, n + 0.05),
          o.gain.setValueAtTime(0.2, n + 0.15),
          o.gain.linearRampToValueAtTime(0, n + 0.7),
          t.connect(s),
          s.connect(o),
          o.connect(this.masterGain),
          t.start(n));
        break;
      }
    }
  }
  setTension(t) {
    this.ctx &&
      !this.muted &&
      ((this.currentTensionStrikes = t), this.applyAmbientModulation());
  }
  setRallyMode(t) {
    this.ctx &&
      !this.muted &&
      ((this.rallyMode = t), this.applyAmbientModulation());
  }
  applyAmbientModulation() {
    if (!this.ctx || this.ambientLayerGains.length < 3) return;
    const t = this.ctx.currentTime,
      e = (1 + 0.2 * this.currentTensionStrikes) * (this.rallyMode ? 1.4 : 1),
      n = this.ambientLayerGains[0];
    (n.gain.cancelScheduledValues(t),
      n.gain.setTargetAtTime(this.baseAmbientVolume * e, t, 0.4));
    const s = this.ambientLayerGains[1];
    (s.gain.cancelScheduledValues(t),
      s.gain.setTargetAtTime(0.7 * this.baseAmbientVolume * e * 1.2, t, 0.4));
    const o = this.ambientLayerGains[2];
    if (
      (o.gain.cancelScheduledValues(t),
      o.gain.setTargetAtTime(0.35 * this.baseAmbientVolume * e, t, 0.4),
      this.ambientMidFilter)
    ) {
      const e = 650,
        n = 50 * this.currentTensionStrikes,
        s = this.rallyMode ? 100 : 0;
      (this.ambientMidFilter.frequency.cancelScheduledValues(t),
        this.ambientMidFilter.frequency.setTargetAtTime(e + n + s, t, 0.5));
    }
    this.ambientHighFilter && this.rallyMode
      ? (this.ambientHighFilter.frequency.cancelScheduledValues(t),
        this.ambientHighFilter.frequency.setTargetAtTime(2200, t, 0.5))
      : this.ambientHighFilter &&
        (this.ambientHighFilter.frequency.cancelScheduledValues(t),
        this.ambientHighFilter.frequency.setTargetAtTime(1800, t, 0.5));
  }
  stopAmbient() {
    (this.stopAmbientLayers(),
      (this.ambientSource = null),
      (this.ambientGain = null),
      (this.rallyMode = !1),
      (this.currentTensionStrikes = 0));
  }
  get isMuted() {
    return this.muted;
  }
  toggleMute() {
    return (
      (this.muted = !this.muted),
      this.masterGain && (this.masterGain.gain.value = this.muted ? 0 : 0.7),
      this.muted
    );
  }
  dispose() {
    (this.stopAmbient(),
      this.stopPitchWhoosh(),
      "closed" !== this.ctx?.state && this.ctx?.close());
  }
}
const ts = {
  perfectTrail: new p(16766720),
  perfectTrailAlt: new p(12539648),
  goodTrail: new p(16777215),
  dirt: new p(12887933),
  fireworkRed: new p(16729156),
  fireworkGold: new p(16766720),
  fireworkWhite: new p(16777215),
  dustMote: new p(16770229),
};
class es {
  constructor(t) {
    (e(this, "scene"),
      e(this, "systems", []),
      e(this, "trailSystem", null),
      e(this, "trailHead", 0),
      e(this, "TRAIL_COUNT", 60),
      e(this, "dustMotes", null),
      e(this, "streakAura", null),
      e(this, "streakAuraCenter", new m()),
      e(this, "streakActive", !1),
      e(this, "ballShadow", null),
      (this.scene = t));
  }
  startTrail(t) {
    this.stopTrail();
    const e = this.TRAIL_COUNT,
      n = new o(),
      s = new Float32Array(3 * e),
      i = new Float32Array(3 * e),
      a = new Float32Array(e),
      r = "perfect" === t ? ts.perfectTrail : ts.goodTrail;
    for (let o = 0; o < e; o++)
      ((s[3 * o] = 0),
        (s[3 * o + 1] = -999),
        (s[3 * o + 2] = 0),
        (i[3 * o] = r.r),
        (i[3 * o + 1] = r.g),
        (i[3 * o + 2] = r.b),
        (a[o] = "perfect" === t ? 0.08 : 0.05));
    (n.setAttribute("position", new O(s, 3)),
      n.setAttribute("color", new O(i, 3)),
      n.setAttribute("size", new O(a, 1)));
    const l = new K({
        size: "perfect" === t ? 0.08 : 0.05,
        vertexColors: !0,
        transparent: !0,
        opacity: 0.8,
        blending: f,
        depthWrite: !1,
      }),
      c = new st(n, l);
    ((c.frustumCulled = !1),
      this.scene.add(c),
      (this.trailSystem = {
        points: c,
        velocities: new Float32Array(3 * e),
        lifetimes: new Float32Array(e),
        maxLifetimes: new Float32Array(e).fill(0.5),
        alive: !0,
        elapsed: 0,
        duration: 5,
      }),
      (this.trailHead = 0));
  }
  updateTrail(t) {
    if (!this.trailSystem?.alive) return;
    const e = this.trailSystem.points.geometry,
      n = e.attributes.position.array,
      s = e.attributes.color.array,
      o = this.trailHead;
    ((n[3 * o] = t.x + 0.03 * (Math.random() - 0.5)),
      (n[3 * o + 1] = t.y + 0.03 * (Math.random() - 0.5)),
      (n[3 * o + 2] = t.z + 0.03 * (Math.random() - 0.5)),
      this.trailHead % 3 == 0 &&
        ((s[3 * o] = ts.perfectTrailAlt.r),
        (s[3 * o + 1] = ts.perfectTrailAlt.g),
        (s[3 * o + 2] = ts.perfectTrailAlt.b)),
      (this.trailHead = (this.trailHead + 1) % this.TRAIL_COUNT),
      (e.attributes.position.needsUpdate = !0),
      (e.attributes.color.needsUpdate = !0));
    const i = this.trailSystem.points.material;
    i.opacity = Math.max(0.3, i.opacity - 0.002);
  }
  stopTrail() {
    this.trailSystem &&
      (this.scene.remove(this.trailSystem.points),
      this.trailSystem.points.geometry.dispose(),
      this.trailSystem.points.material.dispose(),
      (this.trailSystem = null));
  }
  spawnImpact(t, e) {
    const n = "perfect" === e ? 40 : 20,
      s = new o(),
      i = new Float32Array(3 * n),
      a = new Float32Array(3 * n),
      r = new Float32Array(n),
      l = new Float32Array(n);
    for (let o = 0; o < n; o++) {
      ((i[3 * o] = t.x), (i[3 * o + 1] = t.y), (i[3 * o + 2] = t.z));
      const e = Math.random() * Math.PI * 2,
        n = 2 + 4 * Math.random();
      ((a[3 * o] = Math.cos(e) * n),
        (a[3 * o + 1] = Math.sin(e) * n * 0.3),
        (a[3 * o + 2] = 2 + 3 * Math.random()),
        (r[o] = 0),
        (l[o] = 0.3 + 0.4 * Math.random()));
    }
    s.setAttribute("position", new O(i, 3));
    const c = "perfect" === e ? ts.perfectTrail : ts.dirt,
      h = new K({
        size: "perfect" === e ? 0.06 : 0.04,
        color: c,
        transparent: !0,
        opacity: 1,
        blending: "perfect" === e ? f : Ot,
        depthWrite: !1,
      }),
      u = new st(s, h);
    ((u.frustumCulled = !1),
      this.scene.add(u),
      this.systems.push({
        points: u,
        velocities: a,
        lifetimes: r,
        maxLifetimes: l,
        alive: !0,
        elapsed: 0,
        duration: 0.8,
      }));
  }
  spawnFireworks(t) {
    for (let e = 0; e < 3; e++) {
      const n = 80,
        s = new o(),
        i = new Float32Array(3 * n),
        a = new Float32Array(3 * n),
        r = new Float32Array(3 * n),
        l = new Float32Array(n),
        c = new Float32Array(n),
        h = new m(
          8 * (Math.random() - 0.5),
          4 * (Math.random() - 0.5),
          3 * Math.random(),
        ),
        u = t.clone().add(h),
        d = [ts.fireworkRed, ts.fireworkGold, ts.fireworkWhite][e % 3];
      for (let t = 0; t < n; t++) {
        ((i[3 * t] = u.x), (i[3 * t + 1] = u.y), (i[3 * t + 2] = u.z));
        const e = Math.random() * Math.PI * 2,
          n = Math.acos(2 * Math.random() - 1),
          s = 3 + 6 * Math.random();
        ((a[3 * t] = Math.sin(n) * Math.cos(e) * s),
          (a[3 * t + 1] = Math.sin(n) * Math.sin(e) * s),
          (a[3 * t + 2] = Math.cos(n) * s),
          (r[3 * t] = d.r),
          (r[3 * t + 1] = d.g),
          (r[3 * t + 2] = d.b),
          (l[t] = 0),
          (c[t] = 0.8 + 0.6 * Math.random()));
      }
      (s.setAttribute("position", new O(i, 3)),
        s.setAttribute("color", new O(r, 3)));
      const p = new K({
          size: 0.12,
          vertexColors: !0,
          transparent: !0,
          opacity: 1,
          blending: f,
          depthWrite: !1,
        }),
        g = new st(s, p);
      ((g.frustumCulled = !1),
        setTimeout(() => {
          (this.scene.add(g),
            this.systems.push({
              points: g,
              velocities: a,
              lifetimes: l,
              maxLifetimes: c,
              alive: !0,
              elapsed: 0,
              duration: 1.5,
            }));
        }, 300 * e));
    }
  }
  startDustMotes() {
    if (this.dustMotes) return;
    const t = new o(),
      e = new Float32Array(300);
    for (let s = 0; s < 100; s++)
      ((e[3 * s] = 40 * (Math.random() - 0.5)),
        (e[3 * s + 1] = 30 * Math.random()),
        (e[3 * s + 2] = 8 * Math.random()));
    t.setAttribute("position", new O(e, 3));
    const n = new K({
      size: 0.03,
      color: ts.dustMote,
      transparent: !0,
      opacity: 0.3,
      depthWrite: !1,
    });
    ((this.dustMotes = new st(t, n)),
      (this.dustMotes.frustumCulled = !1),
      this.scene.add(this.dustMotes));
  }
  spawnFenceFlash(t) {
    const e = 50,
      n = new o(),
      s = new Float32Array(150),
      i = new Float32Array(150),
      a = new Float32Array(150),
      r = new Float32Array(e),
      l = new Float32Array(e);
    for (let o = 0; o < e; o++) {
      ((s[3 * o] = t.x), (s[3 * o + 1] = t.y), (s[3 * o + 2] = t.z));
      const e = Math.random() * Math.PI * 2,
        n = 4 + 6 * Math.random();
      ((i[3 * o] = Math.cos(e) * n),
        (i[3 * o + 1] = Math.sin(e) * n * 0.3),
        (i[3 * o + 2] = 1 + 2 * Math.random()));
      const c = o % 2 == 0 ? ts.fireworkGold : ts.fireworkWhite;
      ((a[3 * o] = c.r),
        (a[3 * o + 1] = c.g),
        (a[3 * o + 2] = c.b),
        (r[o] = 0),
        (l[o] = 0.4 + 0.3 * Math.random()));
    }
    (n.setAttribute("position", new O(s, 3)),
      n.setAttribute("color", new O(a, 3)));
    const c = new K({
        size: 0.1,
        vertexColors: !0,
        transparent: !0,
        opacity: 1,
        blending: f,
        depthWrite: !1,
      }),
      h = new st(n, c);
    ((h.frustumCulled = !1),
      this.scene.add(h),
      this.systems.push({
        points: h,
        velocities: i,
        lifetimes: r,
        maxLifetimes: l,
        alive: !0,
        elapsed: 0,
        duration: 0.8,
      }));
  }
  spawnCatchFlash(t) {
    const e = new o(),
      n = new Float32Array(36),
      s = new Float32Array(36),
      i = new Float32Array(12),
      a = new Float32Array(12);
    for (let o = 0; o < 12; o++) {
      ((n[3 * o] = t.x), (n[3 * o + 1] = t.y), (n[3 * o + 2] = t.z));
      const e = Math.random() * Math.PI * 2,
        r = 1 + 2 * Math.random();
      ((s[3 * o] = Math.cos(e) * r),
        (s[3 * o + 1] = Math.sin(e) * r * 0.5),
        (s[3 * o + 2] = 0.5 + Math.random()),
        (i[o] = 0),
        (a[o] = 0.15 + 0.15 * Math.random()));
    }
    e.setAttribute("position", new O(n, 3));
    const r = new K({
        size: 0.05,
        color: 16777215,
        transparent: !0,
        opacity: 0.9,
        blending: f,
        depthWrite: !1,
      }),
      l = new st(e, r);
    ((l.frustumCulled = !1),
      this.scene.add(l),
      this.systems.push({
        points: l,
        velocities: s,
        lifetimes: i,
        maxLifetimes: a,
        alive: !0,
        elapsed: 0,
        duration: 0.4,
      }));
  }
  spawnContactRing(t, e) {
    const n = 24,
      s = new o(),
      i = new Float32Array(72),
      a = new Float32Array(72),
      r = new Float32Array(n),
      l = new Float32Array(n),
      c = "perfect" === e ? 16766720 : "good" === e ? 3398997 : 16747520;
    for (let o = 0; o < n; o++) {
      const e = (o / n) * Math.PI * 2;
      ((i[3 * o] = t.x), (i[3 * o + 1] = t.y), (i[3 * o + 2] = t.z));
      const s = 3;
      ((a[3 * o] = Math.cos(e) * s),
        (a[3 * o + 1] = Math.sin(e) * s * 0.3),
        (a[3 * o + 2] = 0),
        (r[o] = 0),
        (l[o] = 0.2 + 0.1 * Math.random()));
    }
    s.setAttribute("position", new O(i, 3));
    const h = new K({
        size: 0.06,
        color: c,
        transparent: !0,
        opacity: 0.9,
        blending: f,
        depthWrite: !1,
      }),
      u = new st(s, h);
    ((u.frustumCulled = !1),
      this.scene.add(u),
      this.systems.push({
        points: u,
        velocities: a,
        lifetimes: r,
        maxLifetimes: l,
        alive: !0,
        elapsed: 0,
        duration: 0.35,
      }));
  }
  spawnPitchMarker(t, e) {
    const n = new o(),
      s = new Float32Array(24),
      i = new Float32Array(24),
      a = new Float32Array(8),
      r = new Float32Array(8);
    for (let o = 0; o < 8; o++)
      ((s[3 * o] = t.x + 0.05 * (Math.random() - 0.5)),
        (s[3 * o + 1] = t.y),
        (s[3 * o + 2] = t.z + 0.05 * (Math.random() - 0.5)),
        (i[3 * o] = 0.4 * (Math.random() - 0.5)),
        (i[3 * o + 1] = 0.4 * (Math.random() - 0.5)),
        (i[3 * o + 2] = 0.2 * Math.random()),
        (a[o] = 0),
        (r[o] = 0.3 + 0.2 * Math.random()));
    n.setAttribute("position", new O(s, 3));
    const l = new K({
        size: 0.08,
        color: e ? 16729156 : 4504388,
        transparent: !0,
        opacity: 0.8,
        blending: f,
        depthWrite: !1,
      }),
      c = new st(n, l);
    ((c.frustumCulled = !1),
      this.scene.add(c),
      this.systems.push({
        points: c,
        velocities: i,
        lifetimes: a,
        maxLifetimes: r,
        alive: !0,
        elapsed: 0,
        duration: 0.5,
      }));
  }
  spawnSwingArc(t) {
    const e = 16,
      n = new o(),
      s = new Float32Array(48),
      i = new Float32Array(48),
      a = new Float32Array(e),
      r = new Float32Array(e);
    for (let o = 0; o < e; o++) {
      const n = (o / e) * 1.1 - 0.5,
        l = 0.8 + 0.3 * Math.random();
      ((s[3 * o] = t.x + Math.cos(n) * l),
        (s[3 * o + 1] = t.y + Math.sin(n) * l * 0.3),
        (s[3 * o + 2] = t.z + 0.3 + 0.1 * Math.random()),
        (i[3 * o] = 2 * Math.cos(n)),
        (i[3 * o + 1] = 1 * Math.sin(n)),
        (i[3 * o + 2] = 0.5),
        (a[o] = 0),
        (r[o] = 0.1 + 0.08 * Math.random()));
    }
    n.setAttribute("position", new O(s, 3));
    const l = new K({
        size: 0.04,
        color: 16777215,
        transparent: !0,
        opacity: 0.6,
        blending: f,
        depthWrite: !1,
      }),
      c = new st(n, l);
    ((c.frustumCulled = !1),
      this.scene.add(c),
      this.systems.push({
        points: c,
        velocities: i,
        lifetimes: a,
        maxLifetimes: r,
        alive: !0,
        elapsed: 0,
        duration: 0.25,
      }));
  }
  spawnDirtKick(t) {
    const e = new o(),
      n = new Float32Array(24),
      s = new Float32Array(24),
      i = new Float32Array(8),
      a = new Float32Array(8);
    for (let o = 0; o < 8; o++) {
      ((n[3 * o] = t.x + 0.1 * (Math.random() - 0.5)),
        (n[3 * o + 1] = t.y + 0.1 * (Math.random() - 0.5)),
        (n[3 * o + 2] = t.z));
      const e = Math.random() * Math.PI * 2;
      ((s[3 * o] = Math.cos(e) * (0.5 + Math.random())),
        (s[3 * o + 1] = 0.3 * Math.sin(e)),
        (s[3 * o + 2] = 1 + 2 * Math.random()),
        (i[o] = 0),
        (a[o] = 0.2 + 0.15 * Math.random()));
    }
    e.setAttribute("position", new O(n, 3));
    const r = new K({
        size: 0.06,
        color: ts.dirt.getHex(),
        transparent: !0,
        opacity: 0.7,
        depthWrite: !1,
      }),
      l = new st(e, r);
    ((l.frustumCulled = !1),
      this.scene.add(l),
      this.systems.push({
        points: l,
        velocities: s,
        lifetimes: i,
        maxLifetimes: a,
        alive: !0,
        elapsed: 0,
        duration: 0.3,
      }));
  }
  spawnBaseDust(t) {
    const e = new o(),
      n = new Float32Array(30),
      s = new Float32Array(30),
      i = new Float32Array(10),
      a = new Float32Array(10);
    for (let o = 0; o < 10; o++) {
      ((n[3 * o] = t.x), (n[3 * o + 1] = t.y), (n[3 * o + 2] = t.z + 0.05));
      const e = Math.random() * Math.PI * 2;
      ((s[3 * o] = Math.cos(e) * (0.8 + Math.random())),
        (s[3 * o + 1] = Math.sin(e) * (0.8 + Math.random())),
        (s[3 * o + 2] = 0.3 + 0.5 * Math.random()),
        (i[o] = 0),
        (a[o] = 0.3 + 0.2 * Math.random()));
    }
    e.setAttribute("position", new O(n, 3));
    const r = new K({
        size: 0.07,
        color: ts.dirt.getHex(),
        transparent: !0,
        opacity: 0.5,
        depthWrite: !1,
      }),
      l = new st(e, r);
    ((l.frustumCulled = !1),
      this.scene.add(l),
      this.systems.push({
        points: l,
        velocities: s,
        lifetimes: i,
        maxLifetimes: a,
        alive: !0,
        elapsed: 0,
        duration: 0.4,
      }));
  }
  spawnWallImpact(t) {
    const e = 30,
      n = new o(),
      s = new Float32Array(90),
      i = new Float32Array(90),
      a = new Float32Array(90),
      r = new Float32Array(e),
      l = new Float32Array(e);
    for (let o = 0; o < e; o++) {
      ((s[3 * o] = t.x + 0.3 * (Math.random() - 0.5)),
        (s[3 * o + 1] = t.y),
        (s[3 * o + 2] = t.z + 0.5 * Math.random()));
      const e = Math.random() * Math.PI,
        n = 2 + 4 * Math.random();
      ((i[3 * o] = Math.cos(e) * n * 0.8),
        (i[3 * o + 1] = -(1 + 3 * Math.random())),
        (i[3 * o + 2] = 1 + 2 * Math.random()));
      const c = o % 3 == 0 ? ts.dirt : new p(2976286);
      ((a[3 * o] = c.r),
        (a[3 * o + 1] = c.g),
        (a[3 * o + 2] = c.b),
        (r[o] = 0),
        (l[o] = 0.3 + 0.3 * Math.random()));
    }
    (n.setAttribute("position", new O(s, 3)),
      n.setAttribute("color", new O(a, 3)));
    const c = new K({
        size: 0.08,
        vertexColors: !0,
        transparent: !0,
        opacity: 0.8,
        depthWrite: !1,
      }),
      h = new st(n, c);
    ((h.frustumCulled = !1),
      this.scene.add(h),
      this.systems.push({
        points: h,
        velocities: i,
        lifetimes: r,
        maxLifetimes: l,
        alive: !0,
        elapsed: 0,
        duration: 0.6,
      }));
  }
  startStreakAura(t) {
    if (this.streakAura) return;
    ((this.streakActive = !0), this.streakAuraCenter.copy(t));
    const e = 24,
      n = new o(),
      s = new Float32Array(72),
      i = new Float32Array(72),
      a = new Float32Array(e),
      r = new Float32Array(e);
    for (let o = 0; o < e; o++) {
      const n = (o / e) * Math.PI * 2,
        l = 0.6 + 0.3 * Math.random();
      ((s[3 * o] = t.x + Math.cos(n) * l),
        (s[3 * o + 1] = t.y + Math.sin(n) * l * 0.3),
        (s[3 * o + 2] = t.z + 0.5 + 1 * Math.random()),
        (i[3 * o] = 0),
        (i[3 * o + 1] = 0),
        (i[3 * o + 2] = 0.5 + 0.5 * Math.random()),
        (a[o] = Math.random()),
        (r[o] = 0.8 + 0.5 * Math.random()));
    }
    n.setAttribute("position", new O(s, 3));
    const l = new K({
        size: 0.06,
        color: ts.perfectTrail.getHex(),
        transparent: !0,
        opacity: 0.6,
        blending: f,
        depthWrite: !1,
      }),
      c = new st(n, l);
    ((c.frustumCulled = !1),
      this.scene.add(c),
      (this.streakAura = {
        points: c,
        velocities: i,
        lifetimes: a,
        maxLifetimes: r,
        alive: !0,
        elapsed: 0,
        duration: 999,
      }));
  }
  updateStreakAura(t) {
    if (!this.streakAura || !this.streakActive) return;
    const e = this.streakAura.points.geometry.attributes.position.array,
      n = e.length / 3;
    for (let s = 0; s < n; s++) {
      ((this.streakAura.lifetimes[s] += t),
        (e[3 * s + 2] += this.streakAura.velocities[3 * s + 2] * t));
      const o = 1.5,
        i = 0.001 * performance.now() * o + (s / n) * Math.PI * 2,
        a = 0.5 + 0.15 * Math.sin(2 * this.streakAura.lifetimes[s]);
      ((e[3 * s] = this.streakAuraCenter.x + Math.cos(i) * a),
        (e[3 * s + 1] = this.streakAuraCenter.y + Math.sin(i) * a * 0.3),
        this.streakAura.lifetimes[s] >= this.streakAura.maxLifetimes[s] &&
          ((this.streakAura.lifetimes[s] = 0),
          (e[3 * s + 2] = this.streakAuraCenter.z + 0.5 + 1 * Math.random())));
    }
    this.streakAura.points.geometry.attributes.position.needsUpdate = !0;
    this.streakAura.points.material.opacity =
      0.4 + 0.2 * Math.sin(0.003 * performance.now());
  }
  stopStreakAura() {
    (this.streakAura &&
      (this.scene.remove(this.streakAura.points),
      this.streakAura.points.geometry.dispose(),
      this.streakAura.points.material.dispose(),
      (this.streakAura = null)),
      (this.streakActive = !1));
  }
  createBallShadow() {
    if (this.ballShadow) return;
    const t = new Pt(0.15, 16),
      e = new g({
        color: 0,
        transparent: !0,
        opacity: 0.35,
        depthWrite: !1,
        side: Z,
      });
    ((this.ballShadow = new n(t, e)),
      (this.ballShadow.position.z = 0.02),
      (this.ballShadow.renderOrder = -1),
      this.scene.add(this.ballShadow));
  }
  updateBallShadow(t) {
    if (!this.ballShadow) return;
    ((this.ballShadow.visible = !0),
      (this.ballShadow.position.x = t.x),
      (this.ballShadow.position.y = t.y));
    const e = Math.max(0, t.z),
      n = 1 + 0.15 * e;
    this.ballShadow.scale.set(n, n, 1);
    this.ballShadow.material.opacity = Math.max(0.08, 0.35 - 0.012 * e);
  }
  removeBallShadow() {
    this.ballShadow &&
      (this.scene.remove(this.ballShadow),
      this.ballShadow.geometry.dispose(),
      this.ballShadow.material.dispose(),
      (this.ballShadow = null));
  }
  hideBallShadow() {
    this.ballShadow && (this.ballShadow.visible = !1);
  }
  update(t) {
    for (let e = this.systems.length - 1; e >= 0; e--) {
      const n = this.systems[e];
      if (!n.alive) continue;
      if (((n.elapsed += t), n.elapsed >= n.duration)) {
        (this.scene.remove(n.points),
          n.points.geometry.dispose(),
          n.points.material.dispose(),
          (n.alive = !1),
          this.systems.splice(e, 1));
        continue;
      }
      const s = n.points.geometry.attributes.position.array,
        o = s.length / 3;
      for (let e = 0; e < o; e++)
        ((n.lifetimes[e] += t),
          (s[3 * e] += n.velocities[3 * e] * t),
          (s[3 * e + 1] += n.velocities[3 * e + 1] * t),
          (s[3 * e + 2] += n.velocities[3 * e + 2] * t),
          (n.velocities[3 * e + 2] += -9.8 * t),
          (n.velocities[3 * e] *= 0.99),
          (n.velocities[3 * e + 1] *= 0.99));
      n.points.geometry.attributes.position.needsUpdate = !0;
      const i = n.points.material,
        a = n.elapsed / n.duration;
      i.opacity = Math.max(0, 1 - a * a);
    }
    if ((this.updateStreakAura(t), this.dustMotes)) {
      const t = this.dustMotes.geometry.attributes.position.array,
        e = t.length / 3;
      for (let n = 0; n < e; n++)
        ((t[3 * n] += 0.01 * (Math.random() - 0.5)),
          (t[3 * n + 1] += 0.003),
          (t[3 * n + 2] += 0.005 * (Math.random() - 0.5)),
          t[3 * n + 1] > 35 && (t[3 * n + 1] = -5));
      this.dustMotes.geometry.attributes.position.needsUpdate = !0;
    }
  }
  dispose() {
    (this.stopTrail(), this.stopStreakAura(), this.removeBallShadow());
    for (const t of this.systems)
      (this.scene.remove(t.points),
        t.points.geometry.dispose(),
        t.points.material.dispose());
    ((this.systems = []),
      this.dustMotes &&
        (this.scene.remove(this.dustMotes),
        this.dustMotes.geometry.dispose(),
        this.dustMotes.material.dispose(),
        (this.dustMotes = null)));
  }
}
const ns = "/api/college-baseball",
  ss = 3e5,
  os = { entry: null },
  is = new Map();
async function as(t) {
  const e = is.get(t);
  if (e && Date.now() - e.ts < ss) return e.data;
  try {
    const e = await fetch(`${ns}/teams/${t}`, {
      signal: AbortSignal.timeout(5e3),
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    const n = buildTeamGameplayProfile(await e.json(), t);
    const r = {
      ...n,
      batters: n.batters.map((t) => ({
        ...t,
        stats: { ...t.stats },
        gameplay: { ...t.gameplay },
      })),
    };
    return (is.set(t, { data: r, ts: Date.now() }), r);
  } catch (n) {
    return createFallbackTeamProfile({ id: t });
  }
}
function rs(t) {
  const e = Number(t.avg ?? 0.25),
    n = Number(t.obp ?? 0.32),
    s = Number(t.slg ?? 0.42),
    o = Number(t.bb ?? 0),
    i = Number(t.k ?? 0),
    a = Number(t.sb ?? 0),
    r = Number(t.gp ?? 1),
    l = 0.7 * (n - e) + 0.3 * Math.max(0, Math.min(1, o / Math.max(i, 1)));
  return {
    contactRating: Math.round(Math.max(35, Math.min(90, 35 + ((e - 0.22) / 0.12) * 55))),
    powerRating: Math.round(Math.max(35, Math.min(90, 35 + ((s - 0.32) / 0.3) * 55))),
    disciplineRating: Math.round(Math.max(35, Math.min(90, 35 + ((l - 0.05) / 0.13) * 55))),
    speedRating: Math.round(
      Math.max(40, Math.min(90, 40 + (((a / Math.max(r, 1)) - 0) / 1.2) * 50)),
    ),
  };
}
function ls(t) {
  return {
    pitchingRating: Number(t.pitchingRating ?? 55),
    pitchMixProfile: [...(t.pitchMixProfile ?? ["Fastball", "Slider", "Change-up"])],
    pitchSpeedBand: {
      min: Number(t.pitchSpeedBand?.min ?? 86),
      max: Number(t.pitchSpeedBand?.max ?? 91),
    },
    pitchWeights: [...(t.pitchWeights ?? [40, 8, 24, 20, 8])],
    speedMultiplier: Number(t.speedMultiplier ?? 1),
    movementMultiplier: Number(t.movementMultiplier ?? 1),
    zoneBias: t.zoneBias ?? "balanced",
  };
}
function cs(t) {
  return {
    wOBA: Number(t.wOBA ?? t.woba ?? t.stats?.wOBA ?? 0.32),
    wRCPlus: Number(t.wRCPlus ?? t.wrc_plus ?? t.stats?.wRCPlus ?? 100),
    avg: Number(t.avg ?? t.battingAvg ?? t.stats?.avg ?? 0.25),
    hr: Number(t.hr ?? t.homeRuns ?? t.stats?.hr ?? 0),
    rbi: Number(t.rbi ?? t.stats?.rbi ?? 0),
    ops: Number(t.ops ?? t.stats?.ops ?? 0.75),
  };
}
function hs(t, e, n) {
  const s = t
    .map((t) => Number(t[e] ?? t.stats?.[e]))
    .filter((t) => !isNaN(t) && t > 0);
  return 0 === s.length ? n : s.reduce((t, e) => t + e, 0) / s.length;
}
function us(t) {
  const e = [
      "Jackson",
      "Ryder",
      "Cole",
      "Maverick",
      "Wyatt",
      "Beau",
      "Cade",
      "Tanner",
      "Ridge",
      "Blaze",
      "Chase",
      "Tucker",
    ],
    n = ["SS", "CF", "2B", "RF", "1B", "3B", "LF", "C", "DH"];
  return {
    id: `generic-${t}`,
    name: e[t % e.length],
    position: n[t % n.length],
    number: String(t + 1),
    stats: { wOBA: 0.32, wRCPlus: 100, avg: 0.25, hr: 0, rbi: 0, ops: 0.75 },
  };
}
const ds = [
  {
    id: "126",
    name: "Texas Longhorns",
    abbreviation: "TEX",
    conference: "SEC",
    logoUrl: "",
    primaryColor: "#BF5700",
    secondaryColor: "#FFFFFF",
  },
  {
    id: "344",
    name: "Texas A&M Aggies",
    abbreviation: "TAMU",
    conference: "SEC",
    logoUrl: "",
    primaryColor: "#500000",
    secondaryColor: "#FFFFFF",
  },
  {
    id: "99",
    name: "LSU Tigers",
    abbreviation: "LSU",
    conference: "SEC",
    logoUrl: "",
    primaryColor: "#461D7C",
    secondaryColor: "#FDD023",
  },
  {
    id: "2633",
    name: "Vanderbilt Commodores",
    abbreviation: "VAN",
    conference: "SEC",
    logoUrl: "",
    primaryColor: "#866D4B",
    secondaryColor: "#000000",
  },
  {
    id: "2",
    name: "Florida Gators",
    abbreviation: "FLA",
    conference: "SEC",
    logoUrl: "",
    primaryColor: "#0021A5",
    secondaryColor: "#FA4616",
  },
  {
    id: "2483",
    name: "Ole Miss Rebels",
    abbreviation: "MISS",
    conference: "SEC",
    logoUrl: "",
    primaryColor: "#CE1126",
    secondaryColor: "#14213D",
  },
  {
    id: "2579",
    name: "Tennessee Volunteers",
    abbreviation: "TENN",
    conference: "SEC",
    logoUrl: "",
    primaryColor: "#FF8200",
    secondaryColor: "#FFFFFF",
  },
  {
    id: "2032",
    name: "Arkansas Razorbacks",
    abbreviation: "ARK",
    conference: "SEC",
    logoUrl: "",
    primaryColor: "#9D2235",
    secondaryColor: "#FFFFFF",
  },
  {
    id: "30",
    name: "Oregon State Beavers",
    abbreviation: "ORST",
    conference: "Pac-12",
    logoUrl: "",
    primaryColor: "#DC4405",
    secondaryColor: "#000000",
  },
  {
    id: "2305",
    name: "Wake Forest Demon Deacons",
    abbreviation: "WAKE",
    conference: "ACC",
    logoUrl: "",
    primaryColor: "#9E7E38",
    secondaryColor: "#000000",
  },
  {
    id: "228",
    name: "Clemson Tigers",
    abbreviation: "CLEM",
    conference: "ACC",
    logoUrl: "",
    primaryColor: "#F56600",
    secondaryColor: "#522D80",
  },
  {
    id: "2116",
    name: "Virginia Cavaliers",
    abbreviation: "UVA",
    conference: "ACC",
    logoUrl: "",
    primaryColor: "#232D4B",
    secondaryColor: "#F84C1E",
  },
];
function ps(t) {
  const e = (t.currentIndex + 1) % t.order.length,
    n = t.order[e];
  return { ...t, currentIndex: e, modifiers: n.gameplay ?? rs(n.stats) };
}
function ms(t, e, n = 0) {
  const s = [...t.boxScores],
    o = { ...s[t.currentIndex] };
  switch (e) {
    case "hit":
      (o.atBats++, o.hits++, (o.rbi += n));
      break;
    case "homeRun":
      (o.atBats++, o.hits++, o.homeRuns++, (o.rbi += n));
      break;
    case "out":
      o.atBats++;
      break;
    case "strikeout":
      (o.atBats++, o.strikeouts++);
      break;
    case "walk":
      (o.walks++, (o.rbi += n));
      break;
    case "sacFly":
      o.rbi += n;
  }
  return ((s[t.currentIndex] = o), { ...t, boxScores: s });
}
function fs(t) {
  return { ...t, strikes: t.strikes + 1 };
}
function gs(t) {
  const e = t.outs + 1,
    n = t.strikes >= 3 ? t.stats.strikeouts + 1 : t.stats.strikeouts,
    s = {
      ...t.stats,
      atBats: t.stats.atBats + 1,
      strikeouts: n,
      currentStreak: 0,
    };
  return e >= 3
    ? {
        ...t,
        outs: 0,
        strikes: 0,
        balls: 0,
        inning: t.inning + 1,
        bases: [!1, !1, !1],
        stats: s,
      }
    : { ...t, outs: e, strikes: 0, balls: 0, stats: s };
}
function bs(t) {
  if (t.strikes >= 3) return "strikeout";
  if (t.balls >= 4) return "walk";
  if (isGameOver(t)) return "gameOver";
  return "playing";
}
function ys(t) {
  return {
    ...t,
    strikes: 0,
    balls: 0,
    stats: {
      ...t.stats,
      derbyOuts: t.stats.derbyOuts + 1,
      currentStreak: 0,
      atBats: t.stats.atBats + 1,
    },
  };
}
const ws = [
  {
    name: "Fastball",
    speedMultiplier: 1.15,
    minMph: 88,
    maxMph: 97,
    trailColor: 16739125,
    breakX: 0.02,
    breakZ: 0.05,
  },
  {
    name: "Curve",
    speedMultiplier: 0.82,
    minMph: 72,
    maxMph: 82,
    trailColor: 4491519,
    breakX: 0.12,
    breakZ: -0.15,
  },
  {
    name: "Slider",
    speedMultiplier: 0.95,
    minMph: 80,
    maxMph: 88,
    trailColor: 11158783,
    breakX: 0.2,
    breakZ: -0.06,
  },
  {
    name: "Change-up",
    speedMultiplier: 0.85,
    minMph: 76,
    maxMph: 85,
    trailColor: 4508808,
    breakX: 0.04,
    breakZ: -0.12,
  },
  {
    name: "Cutter",
    speedMultiplier: 1.05,
    minMph: 84,
    maxMph: 92,
    trailColor: 16777215,
    breakX: 0.09,
    breakZ: 0.01,
  },
];
const xs = [
    "MID_MID",
    "IN_MID",
    "OUT_MID",
    "MID_HIGH",
    "MID_LOW",
    "IN_HIGH",
    "IN_LOW",
    "OUT_HIGH",
    "OUT_LOW",
  ],
  vs = 1.5;
function As(t) {
  const {
      canvas: e,
      glbUrl: s,
      mode: a,
      difficulty: r = "medium",
      teamRoster: c,
      opponentRoster: pitchRoster,
      sessionSeed: sessionSeed = createSessionSeed(),
      onPhaseChange: h,
      onGameUpdate: u,
      onGameOver: d,
      onLineupChange: f,
      onHitResult: b,
      onPitchDelivered: y,
      onContactFeedback: w,
    } = t,
    pitchPreset = getDifficultyPreset(r),
    x = pitchPreset.pitchSpeedMultiplier,
    v = pitchPreset.breakScaleMultiplier,
    A = new Nt({
      canvas: e,
      antialias: !0,
      powerPreference: "high-performance",
    });
  (A.setPixelRatio(Math.min(window.devicePixelRatio, 2)),
    A.setSize(e.clientWidth, e.clientHeight),
    (A.outputColorSpace = M),
    (A.toneMapping = zt),
    (A.toneMappingExposure = 1.1),
    (A.shadowMap.enabled = !0),
    (A.shadowMap.type = Dt));
  const T = new Ht();
  ((T.background = new p(3824266)), (T.fog = new Ut(6982320, 0.005)));
  const S = new wn(e.clientWidth / e.clientHeight);
  const playerRoster = c ?? createFallbackTeamProfile();
  const opponentProfile =
    pitchRoster ??
    ("teamMode" === a
      ? createFallbackTeamProfile({ id: "opponent", name: "Road Pitchers" })
      : createFallbackTeamProfile({ id: "house", name: "House Pitchers" }));
  const initialTargetRuns =
    "quickPlay" === a || "teamMode" === a
      ? computeTargetRuns({
          playerPrevention:
            "teamMode" === a
              ? playerRoster.pitchingRating
              : createFallbackTeamProfile().pitchingRating,
          opponentOffense:
            "teamMode" === a
              ? opponentProfile.targetOffenseRating
              : createFallbackTeamProfile({ id: "arcade-opp" }).targetOffenseRating,
          difficulty: r,
          seed: sessionSeed,
        })
      : null;
  let C = null,
    k = createInitialGameState({
      mode: a,
      teamId: playerRoster?.team?.id ?? null,
      opponentTeamId: opponentProfile?.team?.id ?? null,
      difficulty: r,
      sessionSeed,
      targetRuns: initialTargetRuns,
    }),
    P = "loading",
    E = !1,
    B = !1,
    I = 0,
    L = null,
    F = null,
    N = null,
    contactMetrics = null,
    z = 0,
    D = Date.now(),
    H = null,
    U = null,
    G = 0,
    V = !1,
    j = !1,
    W = !1;
  const Y = new _n(() =>
    (function () {
      const t = new At(0.037, 16, 12),
        e = new X({ color: 16119280, roughness: 0.6, metalness: 0 }),
        s = new n(t, e);
      s.castShadow = !0;
      const o = new Ft(0.037, 0.003, 8, 24),
        i = new X({ color: 13369344, roughness: 0.8 }),
        a = new n(o, i);
      ((a.rotation.x = Math.PI / 2), s.add(a));
      const r = new n(o, i);
      return ((r.rotation.z = Math.PI / 2), s.add(r), s);
    })(),
  );
  let Q = 65,
    J = null,
    et = 0,
    nt = 0,
    it = "",
    at = [],
    rt = 1,
    lt = !1,
    ct = null,
    ht = (function (t, e) {
      const n = t.batters.slice(0, 9),
        s = n[0],
        o = n.map((t) => ({
          player: t,
          atBats: 0,
          hits: 0,
          homeRuns: 0,
          rbi: 0,
          strikeouts: 0,
          walks: 0,
        }));
      return {
        roster: t,
        order: n,
        currentIndex: 0,
        boxScores: o,
        modifiers: s.gameplay ?? rs(s.stats),
        pitchMods: ls(e.pitcher),
      };
    })(playerRoster, opponentProfile),
    ut = null,
    dt = 0,
    pt = null,
    mt = !1,
    ft = 0;
  const gt = new Gt(0.2, 0, -0.5),
    bt = new Gt(0.25, 0, -0.7),
    yt = new Gt(0.2, 0, 1.1),
    wt = new Gt(0.15, 0.1, 1.5);
  let xt = "waggle",
    vt = 0,
    Ot = 0.2,
    jt = null,
    Wt = null,
    Kt = 0,
    Yt = !1;
  let $t = 0.4,
    Xt = null,
    Zt = !1,
    Qt = 0,
    ee = null,
    se = null,
    ie = !1,
    ae = 0;
  const re = new m(),
    le = new m();
  function ce() {
    C &&
      (function (t, e) {
        const n = t.nodes.get("SYB_ScoreboardCanvas");
        if (!n) return;
        const s = n._canvas,
          o = n._texture;
        if (!s || !o) return;
        const i = s.getContext("2d");
        if (i) {
          if (
            ((i.fillStyle = "#0a1a0a"),
            i.fillRect(0, 0, 512, 256),
            (i.fillStyle = "#FFD700"),
            (i.font = "bold 28px monospace"),
            (i.textAlign = "center"),
            i.fillText(e.teamName ?? "SANDLOT SLUGGERS", 256, 40),
            (i.fillStyle = "#BF5700"),
            i.fillRect(80, 52, 352, 2),
            (i.fillStyle = "rgba(255,255,255,0.5)"),
            (i.font = "14px monospace"),
            i.fillText("RUNS", 128, 85),
            i.fillText("HITS", 256, 85),
            i.fillText("HR", 384, 85),
            (i.fillStyle = "#33cc33"),
            (i.font = "bold 48px monospace"),
            i.fillText(String(e.runs), 128, 140),
            i.fillText(String(e.hits), 256, 140),
            i.fillText(String(e.homeRuns), 384, 140),
            (i.fillStyle = "rgba(255,255,255,0.4)"),
            (i.font = "16px monospace"),
            i.fillText(`INN ${e.inning}  |  ${e.outs} OUT`, 256, 185),
            e.lastPitchMph)
          ) {
            ((i.fillStyle = "#FF6B35"), (i.font = "bold 20px monospace"));
            const t = e.lastPitchName
              ? `${e.lastPitchName} ${e.lastPitchMph} MPH`
              : `${e.lastPitchMph} MPH`;
            i.fillText(t, 256, 212);
          }
          ((i.fillStyle = "#BF5700"),
            (i.font = "12px monospace"),
            i.fillText("BLAZE SPORTS INTEL", 256, 240),
            (o.needsUpdate = !0));
        }
      })(C, {
        runs: k.stats.runs,
        hits: k.stats.hits,
        homeRuns: k.stats.homeRuns,
        inning: k.inning,
        outs: k.outs,
        teamName: c?.team.name,
        lastPitchMph: nt || void 0,
        lastPitchName: it || void 0,
      });
  }
  let he = null,
    readyTimerStartedAt = 0,
    readyTimerDelayMs = pitchPreset.readyDelayMs,
    readyTimerRemainingMs = pitchPreset.readyDelayMs;
  function scheduleReadyTimer(t = pitchPreset.readyDelayMs) {
    (he && (clearTimeout(he), (he = null)),
      (readyTimerDelayMs = t),
      (readyTimerRemainingMs = t),
      (readyTimerStartedAt = performance.now()),
      (he = setTimeout(() => {
        ("ready" === P && E && !B && ke.startNextPitch(), (he = null));
      }, t)));
  }
  function clearReadyTimer(t = !1) {
    he &&
      (t &&
        (readyTimerRemainingMs = Math.max(
          0,
          readyTimerDelayMs - (performance.now() - readyTimerStartedAt),
        )),
      clearTimeout(he),
      (he = null));
  }
  function ue(t) {
    if (P !== t)
      switch (
        ((P = t),
        h?.(P),
        clearReadyTimer(!1),
        "ready" === P &&
          E &&
          !B &&
          scheduleReadyTimer(pitchPreset.readyDelayMs),
        P)
      ) {
        case "ready":
        case "pitching":
          S.switchTo(yn.atBat);
          break;
        case "fielding":
          S.switchTo(yn.fieldPlay);
          break;
        case "result":
          break;
        case "gameOver":
          S.switchTo(yn.homeRun);
      }
  }
  const de = ["IN_HIGH", "IN_LOW", "OUT_HIGH", "OUT_LOW"],
    pe = ["MID_MID", "IN_MID", "OUT_MID", "MID_HIGH", "MID_LOW"];
  let me = null;
  function fe(t) {
    if (!F || F.swingTriggered) return;
    if (
      ((ie = !0),
      "loading" === xt && ((xt = "relaxing"), (vt = 0)),
      L?.stop(),
      H?.stopPitchWhoosh(),
      "hrDerby" === k.mode)
    )
      return (
        (k = advanceDerbyState(k, { type: "out" })),
        u?.(k),
        ce(),
        (z = vs),
        void ue("result")
      );
    var e;
    (H?.playGlovePop(),
      t.isInZone
        ? ((k = fs(k)),
          setTimeout(() => H?.playStrike(), 80),
          H?.setTension(k.strikes))
        : ((e = k),
          (k = { ...e, balls: e.balls + 1 }),
          setTimeout(() => H?.playBall(), 80)),
      ct && ct.spawnPitchMarker(t.position, t.isInZone),
      u?.(k),
      ce(),
      3 === k.balls && 2 === k.strikes && H?.playFullCountClap());
    const n = k.strikes >= 3 ? "strikeout" : k.balls >= 4 ? "walk" : "playing";
    if ("strikeout" === n || "walk" === n) {
      if ("strikeout" === n) {
        ((k = advanceGameStateForPlate(k, { type: "strikeout" })),
          b?.("strikeout"),
          H?.playUmpireOut(),
          H?.crowdReact("strikeout"),
          H?.setTension(0),
          H?.setRallyMode(!1),
          Xt?.triggerCatcherPump());
        const t = C?.anchors.get("SYB_Anchor_Batter"),
          e = t?.position.clone() ?? new m(-0.5, -0.3, 0.05);
        (S.strikeoutSnap(e),
          ht &&
            ((ht = ms(ht, "strikeout")),
            (ht = ps(ht)),
            f?.(ht),
            H?.playWalkUp()));
      } else
        ((k = advanceGameStateForPlate(k, { type: "walk" })),
          b?.("walk"),
          ht &&
            ((ht = ms(ht, "walk", Math.max(0, k.stats.runs - (e?.stats?.runs ?? 0)))),
            (ht = ps(ht)),
            f?.(ht)));
      (Xt?.updateRunners(k.bases),
        k.inning > rt &&
          (H?.playInningTransition(), (at = []), (rt = k.inning)));
      const t = k.bases[0] && k.bases[1] && k.bases[2];
      (t && !lt && H?.playBasesLoaded(), (lt = t), u?.(k), ce());
    }
    ((z = vs), ue("result"));
  }
  function ge() {
    if (!L || !F || !C) return;
    ie = !0;
    const t = L.lastCross;
    if (!t) {
      if ("hrDerby" === k.mode) k = advanceDerbyState(k, { type: "out" });
      else if (((k = fs(k)), k.strikes >= 3)) {
        ((k = advanceGameStateForPlate(k, { type: "strikeout" })),
          b?.("strikeoutSwinging"),
          H?.playWhiff(),
          H?.crowdReact("strikeout"),
          H?.setTension(0),
          H?.setRallyMode(!1));
        const t = C.anchors.get("SYB_Anchor_Batter"),
          e = t?.position.clone() ?? new m(-0.5, -0.3, 0.05);
        (S.strikeoutSnap(e),
          ht &&
            ((ht = ms(ht, "strikeout")),
            (ht = ps(ht)),
            f?.(ht),
            H?.playWalkUp()));
      }
      return (u?.(k), ce(), (z = vs), void ue("result"));
    }
    const e = ht?.modifiers ?? rs(ht?.order?.[ht?.currentIndex]?.stats ?? {}),
      n = evaluateSwingContact({
        swingTimeMs: F.swingStartTime,
        strikeTimeMs: t.timing,
        contactPoint: { x: t.position.x, z: t.position.z },
        isInZone: t.isInZone,
        hitterRatings: e,
        pitchSpeedMph: nt || Q,
        difficulty: r,
      }),
      s = mapContactTierToLegacyQuality(n.tier);
    if (((contactMetrics = n), "whiff" === n.tier))
      return (
        H?.playWhiff(),
        "hrDerby" === k.mode
          ? (k = advanceDerbyState(k, { type: "out" }))
          : ((k = fs(k)),
            k.strikes >= 3 &&
              ((k = advanceGameStateForPlate(k, { type: "strikeout" })),
              b?.("strikeoutSwinging"),
              ht &&
                ((ht = ms(ht, "strikeout")),
                (ht = ps(ht)),
                f?.(ht),
                H?.playWalkUp()))),
        u?.(k),
        ce(),
        (z = vs),
        void ue("result")
      );
    if ("foul" === n.tier)
      return (
        be("foul"),
        H?.playCrack("foul"),
        H?.playFoulTick(),
        H?.crowdReact("foul"),
        S.shakeCamera(0.04, 10),
        "hrDerby" === k.mode
          ? (k = advanceDerbyState(k, { type: "foul" }))
          : k.strikes < 2 && (k = fs(k)),
        (function (t) {
          ((ve = Y.acquire()),
            ve.position.copy(t),
            T.add(ve),
            (Te = !0),
            (Se = 0));
          const e = D % 2 == 0 ? 1 : -1;
          Ae.set(
            e * (8 + 6 * Math.random()),
            -(4 + 4 * Math.random()),
            6 + 5 * Math.random(),
          );
        })(t.position),
        L.stop(),
        u?.(k),
        ce(),
        b?.("foul"),
        (z = vs),
        void ue("result")
      );
    H && H.playCrack(s);
    const o = F.swingStartTime - t.timing,
      i = Math.max(0.62, n.exitVelocityMph / 92) * (Q / 65);
    if (
      ((N = On(s, Math.abs(n.timingDeltaMs), t, D, 0, i, o, Q)),
      w && "whiff" !== n.tier && "foul" !== n.tier)
    ) {
      w({
        quality: s,
        contactTier: n.tier,
        timingLabel: n.timingLabel.toUpperCase(),
        exitVelocityMph: Math.round(n.exitVelocityMph),
        distanceFt: Math.round(n.distanceFt),
        launchAngleDeg: Math.round(n.launchAngleDeg),
      });
    }
    if (
      (!ct ||
        ("perfect" !== s &&
          "good" !== s &&
          "weak" !== s) ||
        ct.spawnContactRing(t.position, s),
      be(s),
      "perfect" === s
        ? (S.shakeCamera(0.15, 4), S.fovPunch(8, 0.15))
        : "good" === s
          ? (S.shakeCamera(0.08, 6), S.fovPunch(5, 0.12))
          : S.shakeCamera(0.03, 10),
      (ae =
        "perfect" === s ? 0.083 : "good" === s ? 0.05 : 0.017),
      H?.stopPitchWhoosh(),
      "perfect" === s)
    ) {
      const t = A.getClearColor(new p());
      (A.setClearColor(16777215),
        requestAnimationFrame(() => {
          A.setClearColor(t);
        }));
    }
    if (ct) {
      const e =
        "perfect" === s
          ? "perfect"
          : "good" === s
            ? "good"
            : "default";
      (ct.spawnImpact(t.position, e), ct.startTrail(e));
    }
    (!(function () {
      if (!N) return;
      if (((ut = Y.acquire()), N.flightSampleCount > 0)) {
        const t = N.flightPositions;
        ut.position.set(t[0], t[1], t[2]);
      }
      (T.add(ut),
        (dt = 0),
        ct?.createBallShadow(),
        ct && ut && ct.updateBallShadow(ut.position));
      ut && le.copy(ut.position);
    })(),
      Xt && N && N.flightSampleCount > 0 && Xt.startPursuit(N.landingPos),
      Xt?.startBatterRun(),
      L.stop(),
      ue("fielding"));
  }
  function be(t) {
    if (
      ((mt = !0),
      (ft = 0),
      (xt = "swinging"),
      (vt = 0),
      (jt = t ?? null),
      (Ot = "perfect" === t ? 0.22 : "good" === t ? 0.18 : 0.12),
      !pt && C && (pt = C.nodes.get("SYB_Bat") ?? null),
      ct && C)
    ) {
      const t = C.anchors.get("SYB_Anchor_Home"),
        e = t?.position.clone() ?? new m(0, 0, 0);
      ct.spawnSwingArc(e);
    }
    Xt?.startBatterSwing();
  }
  let ye = -1;
  function we() {
    (ut && (ut.scale.set(1, 1, 1), T.remove(ut), Y.release(ut), (ut = null)),
      ct?.stopTrail(),
      ct?.hideBallShadow(),
      (dt = 0));
  }
  function xe() {
    if (!N || !C) return;
    ct && N.flightSampleCount > 0 && ct.spawnImpact(N.landingPos, "default");
    const t = (function () {
        const t = resolveBallInPlay(
          k,
          contactMetrics ?? {
            tier: "weak",
            distanceFt: Math.round(5.5 * N.distance),
            launchAngleDeg: N.launchAngle,
            exitVelocityMph: Math.round(60 + 55 * N.exitVelocity),
          },
          D,
        );
        return {
          ...t,
          basesAdvanced:
            "homeRun" === t.type
              ? "homeRun"
              : "triple" === t.type
                ? 3
                : "double" === t.type
                  ? 2
                  : 1,
          isOut:
            "out" === t.type || "doublePlay" === t.type || "sacFly" === t.type,
          isSacFly: "sacFly" === t.type,
        };
      })(),
      e = k.stats.runs;
    ("hrDerby" === k.mode
      ? (k = advanceDerbyState(k, {
          type: "homeRun" === t.type ? "homeRun" : "out",
          contactTier: t.contactTier,
          distanceFt: t.distanceFt,
        }))
      : (k = advanceGameStateForPlate(k, {
          type: t.type,
          contactTier: t.contactTier,
          distanceFt: t.distanceFt,
        })));
    const n = k.stats.runs - e;
    if (
      (ht &&
        ((ht = "homeRun" === t.type
          ? ms(ht, "homeRun", n)
          : "sacFly" === t.type
            ? ms(ht, "sacFly", n)
            : t.isOut
              ? ms(ht, "out")
              : ms(ht, "hit", n)),
        (ht = ps(ht)),
        f?.(ht),
        H?.playWalkUp()),
      "doublePlay" === t.type
        ? b?.("doublePlay")
        : "sacFly" === t.type
          ? b?.("sacFly")
          : t.isOut
            ? b?.("out")
            : "homeRun" === t.basesAdvanced
              ? b?.("homeRun")
              : 3 === t.basesAdvanced
                ? b?.("triple")
                : 2 === t.basesAdvanced
                  ? b?.("double")
                  : b?.("single"),
      H?.setTension(0),
      !t.isOut)
    ) {
      const e =
        "homeRun" === t.basesAdvanced
          ? "homeRun"
          : 3 === t.basesAdvanced
            ? "triple"
            : 2 === t.basesAdvanced
              ? "double"
              : "single";
      if (
        (H?.playCrowdForHit(e),
        H?.crowdReact("homeRun" === e ? "homerun" : "hit"),
        k.stats.currentStreak >= 3 && H?.setRallyMode(!0),
        k.stats.currentStreak > 2 &&
          H?.playCrowdForStreak(k.stats.currentStreak),
        k.stats.currentStreak >= 3 && ct)
      ) {
        const t = C.anchors.get("SYB_Anchor_Batter"),
          e = t?.position.clone() ?? new m(-0.5, -0.3, 0.05);
        (ct.startStreakAura(e),
          pt &&
            pt.traverse((t) => {
              t instanceof n &&
                t.material instanceof X &&
                ((t.material.emissive = new p(16766720)),
                (t.material.emissiveIntensity = 0.3));
            }));
      }
    }
    if (
      (t.isOut &&
        (H?.setRallyMode(!1),
        ct?.stopStreakAura(),
        pt &&
          pt.traverse((t) => {
            t instanceof n &&
              t.material instanceof X &&
              (t.material.emissiveIntensity = 0);
          })),
      C)
    ) {
      const t = k.stats.runs;
      t > et &&
        (!(function (t) {
          const e = t.nodes.get("SYB_ScoreboardCanvas");
          if (!(e && e instanceof n)) return;
          const s = e,
            o = s.material;
          if (!o) return;
          ((o.emissive = new p(16766720)),
            (o.emissiveIntensity = 0.4),
            (o.needsUpdate = !0));
          const i = s.scale.clone(),
            a = performance.now();
          requestAnimationFrame(function t() {
            const e = performance.now() - a,
              n = Math.min(e / 600, 1);
            ((o.emissiveIntensity = 0.4 * (1 - n * n)), (o.needsUpdate = !0));
            const r = Math.sin(n * Math.PI * 2.5) * Math.exp(4 * -n),
              l = 1 + (1.08 - 1) * Math.max(0, r);
            (s.scale.set(i.x * l, i.y * l, i.z * l),
              n < 1
                ? requestAnimationFrame(t)
                : ((o.emissiveIntensity = 0), s.scale.copy(i)));
          });
        })(C),
        (et = t));
    }
    if ("homeRun" === t.basesAdvanced) {
      if (
        (G++,
        H?.playHomeRunHorn(),
        H?.playOrganRiff(),
        (function () {
          if (!J) return;
          const t = 1.4;
          ((J.intensity = 3), J.color.set(16777184));
          const e = performance.now(),
            n = 800;
          function s() {
            const o = performance.now() - e,
              i = Math.min(o / n, 1),
              a = 1 - Math.pow(1 - i, 2);
            J.intensity = 3 - (3 - t) * a;
            const r = 1 + (1.0035654105392158 - 1) * a,
              l = 1 + (232 / 255 - 1) * a,
              c = 0.88 + (192 / 255 - 0.88) * a;
            (J.color.setRGB(Math.min(r, 1), Math.min(l, 1), Math.min(c, 1)),
              i < 1 ? requestAnimationFrame(s) : J.color.set(16771264));
          }
          requestAnimationFrame(s);
        })(),
        ct)
      ) {
        const t = C.nodes.get("SYB_Scoreboard"),
          e = t?.position.clone() ?? new m(0, 74, 5);
        (ct.spawnFireworks(e),
          N && N.flightSampleCount > 0 && ct.spawnFenceFlash(N.landingPos));
      }
      G >= 3 &&
        !V &&
        (function () {
          if (V || j || !C) return;
          ((V = !0), (W = !1));
          new oe().load(
            GsAsset("/assets/blaze_mascot.glb"),
            (t) => {
              const e = t.scene;
              (e.scale.setScalar(1.5), T.add(e));
              const n = C,
                s = [
                  n.anchors.get("SYB_Anchor_Home")?.position.clone() ??
                    new m(0, 0, 0),
                  n.anchors.get("SYB_Anchor_1B")?.position.clone() ??
                    new m(19, 0, 19),
                  n.anchors.get("SYB_Anchor_2B")?.position.clone() ??
                    new m(0, 0, 27),
                  n.anchors.get("SYB_Anchor_3B")?.position.clone() ??
                    new m(-19, 0, 19),
                ];
              let i = 0,
                a = 0;
              const r = 1,
                l = 300,
                c = new o(),
                h = new Float32Array(3 * l),
                u = new Float32Array(3 * l),
                d = [];
              for (let o = 0; o < l; o++)
                ((h[3 * o] = 10 * (Math.random() - 0.5)),
                  (h[3 * o + 1] = 15 * Math.random() + 5),
                  (h[3 * o + 2] = 10 * (Math.random() - 0.5)),
                  (u[3 * o] = Math.random()),
                  (u[3 * o + 1] = Math.random()),
                  (u[3 * o + 2] = Math.random()),
                  d.push(
                    new m(
                      2 * (Math.random() - 0.5),
                      -2 - 3 * Math.random(),
                      2 * (Math.random() - 0.5),
                    ),
                  ));
              (c.setAttribute("position", new O(h, 3)),
                c.setAttribute("color", new O(u, 3)));
              const p = new K({
                  size: 0.15,
                  vertexColors: !0,
                  transparent: !0,
                  opacity: 1,
                }),
                f = new st(c, p);
              (f.position.copy(s[0]), T.add(f));
              const g = performance.now();
              function b() {
                if (W)
                  return (
                    T.remove(e),
                    T.remove(f),
                    c.dispose(),
                    p.dispose(),
                    void (V = !1)
                  );
                const t = (performance.now() - g) / 1e3;
                if (t > 4 * r + 1)
                  return (
                    T.remove(e),
                    T.remove(f),
                    c.dispose(),
                    p.dispose(),
                    void (V = !1)
                  );
                const n = Math.min(t, 4 * r);
                ((i = Math.min(Math.floor(n / r), 3)),
                  (a = n / r - i),
                  (a = Math.min(a, 1)));
                const o = s[i],
                  h = s[(i + 1) % 4];
                (e.position.lerpVectors(o, h, a),
                  (e.position.y = 1 * Math.abs(Math.sin(a * Math.PI))));
                const u = new m().subVectors(h, o).normalize();
                u.lengthSq() > 0 && e.lookAt(e.position.clone().add(u));
                const y = c.attributes.position.array;
                for (let e = 0; e < l; e++)
                  ((y[3 * e] += 0.016 * d[e].x),
                    (y[3 * e + 1] += 0.016 * d[e].y),
                    (y[3 * e + 2] += 0.016 * d[e].z));
                ((c.attributes.position.needsUpdate = !0),
                  t > 4 * r && (p.opacity = Math.max(0, 1 - (t - 4 * r))),
                  requestAnimationFrame(b));
              }
              requestAnimationFrame(b);
            },
            void 0,
            (t) => {
              ((j = !0), (V = !1));
            },
          );
        })();
      const t = C.anchors.get("SYB_Anchor_Home"),
        e = t?.position.clone() ?? new m(0, 0, 0);
      (S.triggerSlowMo(1.5), S.startHRCelebration(e));
    } else
      t.isOut &&
        (H?.playGroan(),
        ct && N && N.flightSampleCount > 0 && ct.spawnCatchFlash(N.landingPos),
        N && N.launchAngle >= 15 && Xt?.triggerCatchAnimation());
    if ("homeRun" !== t.basesAdvanced && N && N.flightSampleCount > 0) {
      const { landingPos: t } = N;
      Math.sqrt(t.x * t.x + t.y * t.y) >= Q - 8 &&
        (H?.playWallBounce(), ct?.spawnWallImpact(t));
    }
    if (
      (Xt?.resolveBatterRun(t.basesAdvanced, t.isOut),
      Xt?.updateRunners(k.bases),
      t.isOut || "homeRun" === t.basesAdvanced)
    )
      Xt?.endPursuit();
    else {
      const e =
        1 === t.basesAdvanced ? "2B" : 2 === t.basesAdvanced ? "3B" : "HOME";
      Xt?.endPursuit(e);
    }
    k.inning > rt && (H?.playInningTransition(), (at = []), (rt = k.inning));
    const s = k.bases[0] && k.bases[1] && k.bases[2];
    (s && !lt && H?.playBasesLoaded(),
      (lt = s),
      u?.(k),
      ce(),
      (N = null),
      (z = vs),
      ue("result"));
  }
  let ve = null,
    Ae = new m(),
    Te = !1,
    Se = 0;
  function Me(t) {
    if (
      (S.update(t),
      ct?.update(t),
      Xt?.update(t),
      (function (t) {
        if (pt) {
          if ("loading" === xt) {
            vt += t;
            const e = 0.15,
              n = Math.min(vt / e, 1),
              s = n * n;
            return void pt.rotation.set(
              gt.x + (bt.x - gt.x) * s,
              gt.y + (bt.y - gt.y) * s,
              gt.z + (bt.z - gt.z) * s,
            );
          }
          if ("swinging" === xt) {
            if (!mt) return;
            ft += t;
            const e = Math.min(ft / 0.12, 1),
              n = 1 - Math.pow(1 - e, 3);
            return (
              pt.rotation.set(
                bt.x + (yt.x - bt.x) * n,
                bt.y + (yt.y - bt.y) * n,
                bt.z + (yt.z - bt.z) * n,
              ),
              void (e >= 1 && ((xt = "followThrough"), (vt = 0), (mt = !1)))
            );
          }
          if ("followThrough" === xt) {
            vt += t;
            const e = Math.min(vt / Ot, 1),
              n = 1 - Math.pow(1 - e, 2),
              s = "perfect" === jt ? 1 : "good" === jt ? 0.7 : 0.4;
            return (
              pt.rotation.set(
                yt.x + (wt.x - yt.x) * n * s,
                yt.y + (wt.y - yt.y) * n * s,
                yt.z + (wt.z - yt.z) * n * s,
              ),
              void (
                e >= 1 &&
                ("fielding" === P && pt
                  ? ((Zt = !0),
                    (Qt = 0),
                    (ee = pt.position.clone()),
                    (xt = "waggle"))
                  : ((xt = "relaxing"), (vt = 0)))
              )
            );
          }
          if ("relaxing" === xt) {
            vt += t;
            const e = 0.15,
              n = Math.min(vt / e, 1),
              s = n * (2 - n),
              o = pt.rotation.x,
              i = pt.rotation.y,
              a = pt.rotation.z;
            (pt.rotation.set(
              o + (gt.x - o) * s,
              i + (gt.y - i) * s,
              a + (gt.z - a) * s,
            ),
              n >= 1 &&
                (pt.rotation.copy(gt), (xt = "waggle"), (vt = 0), (jt = null)));
          }
        }
      })(t),
      (function (t) {
        if (!Zt || !pt) return;
        Qt += t;
        const e = Math.min(Qt / 0.3, 1);
        (pt.rotation.set(yt.x + 0.5 * e, yt.y, yt.z + 1.5 * e),
          ee && (pt.position.z = ee.z * (1 - 0.8 * e)),
          e >= 1 && (Zt = !1));
      })(t),
      (function (t) {
        if (!Yt || !Wt || !C) return;
        Kt += t;
        const e = Math.min(Kt / $t, 1),
          n = C.anchors.get("SYB_Anchor_Mound"),
          s = n?.position.clone() ?? new m(0, 14, 0.3);
        if (e < 0.15) ((Wt.visible = !1), Wt.position.set(s.x, s.y, s.z + 0.5));
        else if (e < 0.55) {
          const t = (e - 0.15) / 0.4,
            n = t * t;
          ((Wt.visible = !1),
            Wt.position.set(s.x, s.y + 0.3 * n, s.z + 0.5 + 0.8 * n));
        } else if (e < 0.75) {
          const t = (e - 0.55) / 0.2,
            n = 1 - Math.pow(1 - t, 2);
          ((Wt.visible = !0),
            Wt.position.set(s.x, s.y - 1.4 * n, s.z + 1.3 - 0.2 * n));
        } else ((Wt.visible = !0), Wt.position.set(s.x, s.y - 1.4, s.z + 1.1));
        e >= 1 && (T.remove(Wt), Y.release(Wt), (Wt = null), (Yt = !1));
      })(t),
      (function (t) {
        Te &&
          ve &&
          ((Se += t),
          (ve.position.x += Ae.x * t),
          (ve.position.y += Ae.y * t),
          (ve.position.z += Ae.z * t),
          (Ae.z -= 15 * t),
          (ve.rotation.x += 18 * t),
          (ve.rotation.z += 10 * t),
          (Se > 1.5 || ve.position.z < -1) &&
            (T.remove(ve), Y.release(ve), (ve = null), (Te = !1)));
      })(t),
      ie && se)
    ) {
      const e = (function (t, e) {
        const n = t._edgesMat,
          s = t._fillMat;
        return (
          !n ||
          !s ||
          ((n.opacity = Math.max(0, n.opacity - 1.5 * e)),
          (s.opacity = Math.max(0, s.opacity - 0.2 * e)),
          n.opacity <= 0 && ((t.visible = !1), !0))
        );
      })(se, t);
      e && (ie = !1);
    }
    if (
      ("ready" === P && Xt?.updatePitcherIdle(t),
      pt &&
        !mt &&
        !Zt &&
        ("ready" === P || "pitching" === P) &&
        "waggle" === xt)
    )
      if ("pitching" === P && L?.active && !F?.swingTriggered)
        ((xt = "loading"), (vt = 0));
      else {
        let t = 0.004,
          e = 0.03;
        2 === k.strikes
          ? ((t = 0.007), (e = 0.05))
          : 3 === k.balls && 2 === k.strikes
            ? ((t = 0.008), (e = 0.06))
            : k.balls >= 3 && k.strikes < 2 && ((t = 0.003), (e = 0.02));
        const n = Math.sin(performance.now() * t) * e;
        pt.rotation.z = gt.z + n;
      }
    switch (P) {
      case "pitching":
        if (L?.active) {
          if ((L.update(t), F?.swingTriggered && !F.contactProcessed)) {
            (performance.now() - F.swingStartTime) / 1e3 >= 0.15 &&
              ((F.contactProcessed = !0), ge());
          }
        } else
          L &&
            !L.active &&
            (F?.swingTriggered && !F.contactProcessed
              ? ((F.contactProcessed = !0), ge())
              : (L.stop(), "pitching" === P && ((z = vs), ue("result"))));
        break;
      case "fielding":
        N && ut
          ? (function (t) {
              if (!ut || !N) return;
              dt += t;
              const e = Math.min(dt / N.flightDuration, 1),
                n = N.flightPositions,
                s = e * (N.flightSampleCount - 1),
                o = Math.floor(s),
                i = Math.min(o + 1, N.flightSampleCount - 1),
                a = s - o;
              (ut.position.set(
                n[3 * o] + (n[3 * i] - n[3 * o]) * a,
                n[3 * o + 1] + (n[3 * i + 1] - n[3 * o + 1]) * a,
                n[3 * o + 2] + (n[3 * i + 2] - n[3 * o + 2]) * a,
              ),
                ct &&
                  N.launchAngle < 10 &&
                  o !== ye &&
                  (ut.position.z < 0.08 &&
                    ye > 0 &&
                    ct.spawnDirtKick(ut.position),
                  (ye = o)));
              (N.launchAngle < 10
                ? ((ut.rotation.x += 20 * t), (ut.rotation.z += 3 * t))
                : ((ut.rotation.x += 12 * t), (ut.rotation.z += 6 * t)),
                ct?.updateBallShadow(ut.position),
                re.copy(ut.position).sub(le));
              const r = re.length() / Math.max(t, 0.001);
              if (r > 0.5) {
                const t = Math.min(1 + 0.012 * r, 1.35),
                  e = 1 / Math.sqrt(t);
                ut.scale.set(e, e, t);
                const n = ut.position.clone().add(re.normalize());
                ut.lookAt(n);
              } else ut.scale.set(1, 1, 1);
              (le.copy(ut.position), ct?.updateTrail(ut.position));
              const l = N.launchAngle < 10;
              (S.followBall(ut.position, l), e >= 1 && ((ye = -1), we(), xe()));
            })(t)
          : N && !ut && ((z += t), z >= 0.8 && (xe(), (z = 0)));
        break;
      case "result":
        if (((z -= t), z <= 0)) {
          if ("gameOver" === bs(k)) {
            (ue("gameOver"),
              S.stopOrbit(),
              S.stopFollow(),
              S.stopHRCelebration(),
              S.stopSlowMo());
            const t = C?.anchors.get("SYB_Anchor_Home"),
              e = t?.position.clone() ?? new m(0, 0, 0);
            (S.startGameOverSweep(e), d?.(k));
          } else {
            ((e = k),
              (k = { ...e, strikes: 0, balls: 0 }),
              u?.(k),
              ce(),
              Xt?.resetBatter(!0),
              Xt?.resetCatcher(),
              Xt?.standInfielders(),
              S.stopOrbit(),
              S.stopFollow(),
              S.stopHRCelebration(),
              S.stopSlowMo(),
              pt &&
                ((Zt = !1),
                (Qt = 0),
                (xt = "waggle"),
                (vt = 0),
                (jt = null),
                pt.rotation.copy(gt),
                ee && (pt.position.copy(ee), (ee = null))));
            const t = C?.anchors.get("SYB_Anchor_Batter"),
              n = t?.position.clone() ?? new m(-0.5, -0.3, 0.05);
            (S.batterIntro(n),
              2 === k.outs && H?.playTwoOutTension(),
              ue("ready"));
          }
        }
    }
    var e;
  }
  function Ce(t) {
    if (!E) return;
    const e = Math.min((t - I) / 1e3, 0.1);
    ((I = t),
      ae > 0 ? ((ae -= e), S.update(e)) : Me(e),
      U ? U.render(e) : A.render(T, S.threeCamera),
      requestAnimationFrame(Ce));
  }
  const ke = {
    async start() {
      (!(function () {
        const t = new Vt(16773344, 0.5);
        T.add(t);
        const e = new R(16771264, 1.4);
        ((J = e),
          e.position.set(25, -15, 35),
          (e.castShadow = !0),
          (e.shadow.mapSize.width = 4096),
          (e.shadow.mapSize.height = 4096),
          (e.shadow.camera.left = -70),
          (e.shadow.camera.right = 70),
          (e.shadow.camera.top = 80),
          (e.shadow.camera.bottom = -20),
          (e.shadow.camera.near = 0.5),
          (e.shadow.camera.far = 200),
          (e.shadow.bias = -5e-4),
          T.add(e));
        const n = new R(12638463, 0.25);
        (n.position.set(-15, 10, 8), T.add(n));
        const s = new qt(6982320, 2976286, 0.45);
        T.add(s);
      })(),
        (H = new Jn()),
        await H.unlock(),
        H.startAmbient());
      const t = s ?? GsAsset("/assets/sandlot_field.glb");
      try {
        const e = await ln(t);
        (T.add(e.scene), (C = e.index));
        (cn(C).valid,
          (function (t) {
            const e = new At(200, 32, 32),
              s = document.createElement("canvas");
            ((s.width = 1), (s.height = 256));
            const o = s.getContext("2d"),
              i = o.createLinearGradient(0, 0, 0, 256);
            (i.addColorStop(0, "#1a2a4a"),
              i.addColorStop(0.4, "#3a5a8a"),
              i.addColorStop(0.7, "#c89040"),
              i.addColorStop(1, "#f0c060"),
              (o.fillStyle = i),
              o.fillRect(0, 0, 1, 256));
            const a = new Tt(s),
              r = new g({ map: a, side: St, fog: !1 }),
              l = new n(e, r);
            t.add(l);
          })(T),
          (function (t, e) {
            const n = e.anchors.get(nn.MOUND),
              s = bn();
            (n ? s.position.copy(n.position) : s.position.set(0, 20, 0.15),
              t.add(s),
              e.nodes.set(s.name, s));
            const o = e.anchors.get(nn.BATTER),
              i = hn();
            (o
              ? (i.position.copy(o.position), (i.position.z += 0.6))
              : i.position.set(0.6, -0.5, 0.6),
              t.add(i),
              e.nodes.set(i.name, i));
          })(T, C),
          (function (t, e) {
            const s = e.nodes.get("Wall_Segment_5"),
              a = s ? Math.sqrt(s.position.x ** 2 + s.position.y ** 2) : 65,
              r = [];
            (t.traverse((t) => {
              t.name &&
                t.name.startsWith("Wall_Segment_") &&
                t.isMesh &&
                r.push(t);
            }),
              r.forEach((t) => {
                (t.parent?.remove(t), t.geometry && t.geometry.dispose());
              }));
            const l = 48,
              c = Math.PI / 4,
              h = (3 * Math.PI) / 4,
              u = h - c,
              d = a - 0.6,
              p = [],
              m = [],
              f = [];
            for (let n = 0; n <= l; n++) {
              const t = c + (n / l) * u,
                e = Math.cos(t),
                s = Math.sin(t);
              (p.push(a * e, a * s, 0),
                m.push(-e, -s, 0),
                p.push(a * e, a * s, 3),
                m.push(-e, -s, 0),
                p.push(d * e, d * s, 0),
                m.push(e, s, 0),
                p.push(d * e, d * s, 3),
                m.push(e, s, 0));
            }
            for (let n = 0; n < l; n++) {
              const t = 4 * n,
                e = 4 * (n + 1);
              (f.push(t, e, e + 1, t, e + 1, t + 1),
                f.push(t + 2, t + 3, e + 3, t + 2, e + 3, e + 2),
                f.push(t + 1, e + 1, e + 3, t + 1, e + 3, t + 3));
            }
            const g = new o();
            (g.setIndex(f),
              g.setAttribute("position", new i(p, 3)),
              g.setAttribute("normal", new i(m, 3)),
              g.computeVertexNormals(),
              g.computeBoundingSphere());
            const b = new X({ color: 1722906, roughness: 0.8, side: Z }),
              y = new n(g, b);
            ((y.name = "SYB_OutfieldWall"),
              (y.castShadow = !0),
              (y.receiveShadow = !0),
              t.add(y),
              e.nodes.set(y.name, y));
            const w = [],
              x = [];
            for (let n = 0; n <= l; n++) {
              const t = c + (n / l) * u,
                e = Math.cos(t),
                s = Math.sin(t);
              (w.push(a * e, a * s, 3),
                w.push(a * e, a * s, 3.2),
                w.push(d * e, d * s, 3),
                w.push(d * e, d * s, 3.2));
            }
            for (let n = 0; n < l; n++) {
              const t = 4 * n,
                e = 4 * (n + 1);
              (x.push(t, e, e + 1, t, e + 1, t + 1),
                x.push(t + 2, t + 3, e + 3, t + 2, e + 3, e + 2),
                x.push(t + 1, e + 1, e + 3, t + 1, e + 3, t + 3));
            }
            const v = new o();
            (v.setIndex(x),
              v.setAttribute("position", new i(w, 3)),
              v.computeVertexNormals(),
              v.computeBoundingSphere());
            const A = new X({ color: 994831, roughness: 0.7, side: Z });
            t.add(new n(v, A));
            const T = new X({
                color: 16766720,
                metalness: 0.3,
                roughness: 0.5,
              }),
              S = new Mt(0.08, 0.08, 10, 8),
              M = a * Math.cos(c),
              C = a * Math.sin(c),
              k = a * Math.cos(h),
              R = a * Math.sin(h),
              P = new n(S, T);
            (P.position.set(M, C, 5), (P.castShadow = !0), t.add(P));
            const E = new n(S, T);
            (E.position.set(k, R, 5), (E.castShadow = !0), t.add(E));
            for (let n = 0; n < 20; n++) {
              const s = c + ((n + 0.5) / 20) * u,
                o = e.nodes.get(`Wall_Segment_${n}`);
              if (o) o.position.set(a * Math.cos(s), a * Math.sin(s), 1.5);
              else {
                const o = new _();
                ((o.name = `Wall_Segment_${n}`),
                  o.position.set(a * Math.cos(s), a * Math.sin(s), 1.5),
                  t.add(o),
                  e.nodes.set(o.name, o));
              }
            }
          })(T, C),
          (function (t, e) {
            const s = e.anchors.get("SYB_Anchor_Home"),
              o = s?.position.clone() ?? new m(0, 0, 0),
              i = e.anchors.get("SYB_Anchor_Mound"),
              a = i?.position.clone() ?? new m(0, 14, 0),
              r = e.anchors.get("SYB_Anchor_1B"),
              l = e.anchors.get("SYB_Anchor_2B"),
              c = e.anchors.get("SYB_Anchor_3B"),
              h = [
                o,
                r?.position.clone() ?? new m(12.9381, 12.9381, 0),
                l?.position.clone() ?? new m(0, 25.8762, 0),
                c?.position.clone() ?? new m(-12.9381, 12.9381, 0),
              ],
              u = new X({ color: 12887412, roughness: 0.95 });
            for (let m = 0; m < 4; m++) {
              const e = h[m],
                s = h[(m + 1) % 4],
                o = s.x - e.x,
                i = s.y - e.y,
                a = Math.sqrt(o * o + i * i),
                r = Math.atan2(i, o),
                l = (e.x + s.x) / 2,
                c = (e.y + s.y) / 2,
                d = new Ct(a, 1.2, 0.02),
                p = new n(d, u);
              (p.position.set(l, c, 0.012),
                (p.rotation.z = r),
                (p.receiveShadow = !0),
                t.add(p));
            }
            const d = new Mt(1.5, 2.5, 0.4, 24),
              p = new X({ color: 12887933, roughness: 0.9 }),
              f = new n(d, p);
            (f.position.set(a.x, a.y, 0.2), (f.castShadow = !0), t.add(f));
            const g = new Ct(0.61, 0.03, 0.15),
              b = new X({ color: 16777215, roughness: 0.4 }),
              y = new n(g, b);
            (y.position.set(a.x, a.y, 0.42), t.add(y));
            const w = new X({ color: 16777215 }),
              x = new Ct(0.08, 0.01, 80),
              v = new n(x, w);
            (v.position.set(-20, 30, 0.01),
              (v.rotation.y = Math.PI / 4),
              t.add(v));
            const A = new n(x, w);
            (A.position.set(20, 30, 0.01),
              (A.rotation.y = -Math.PI / 4),
              t.add(A));
            const T = new X({ color: 16777215, roughness: 0.5 });
            function S(e) {
              const s = new Ct(0.04, 0.01, 1.8),
                i = new Ct(1.2, 0.01, 0.04),
                a = new n(s, T);
              (a.position.set(o.x + e - 0.6, o.y - 0.1, 0.005), t.add(a));
              const r = new n(s, T);
              (r.position.set(o.x + e + 0.6, o.y - 0.1, 0.005), t.add(r));
              const l = new n(i, T);
              (l.position.set(o.x + e, o.y - 0.1, 0.905), t.add(l));
              const c = new n(i, T);
              (c.position.set(o.x + e, o.y - 0.1, -0.895), t.add(c));
            }
            (S(-0.9), S(0.9));
            const M = new kt(0.8, 0.85, 24),
              C = new X({ color: 16777215, roughness: 0.5, side: Z }),
              k = new n(M, C);
            ((k.rotation.x = -Math.PI / 2),
              k.position.set(o.x + 5, o.y - 4, 0.015),
              t.add(k));
            const R = new n(M, C);
            ((R.rotation.x = -Math.PI / 2),
              R.position.set(o.x - 5, o.y - 4, 0.015),
              t.add(R));
          })(T, C),
          (function (t, e) {
            const s = e.nodes.get("Wall_Segment_5"),
              o = s ? Math.sqrt(s.position.x ** 2 + s.position.y ** 2) : 65,
              i = Math.PI / 4,
              a = (3 * Math.PI) / 4,
              r = new kt(o - 15, o - 2, 64, 1, 0.35 * -Math.PI, 0.7 * Math.PI),
              l = new X({ color: 12096874, roughness: 0.95 }),
              c = new n(r, l);
            ((c.rotation.x = -Math.PI / 2),
              (c.rotation.z = Math.PI / 2 + (0.35 * Math.PI) / 2),
              c.position.set(0, 45, 0.015),
              (c.receiveShadow = !0),
              t.add(c));
            const h = o * Math.cos(i),
              u = o * Math.sin(i),
              d = o * Math.cos(a),
              p = o * Math.sin(a);
            function m(e, n, s, o) {
              const i = document.createElement("canvas");
              ((i.width = 64), (i.height = 32));
              const a = i.getContext("2d");
              ((a.fillStyle = "#FFD700"),
                (a.font = "bold 22px monospace"),
                (a.textAlign = "center"),
                (a.textBaseline = "middle"),
                a.fillText(e, 32, 16));
              const r = new Tt(i),
                l = new Bt({ map: r }),
                c = new It(l);
              (c.position.set(n, s, o), c.scale.set(2.5, 1.25, 1), t.add(c));
            }
            (m("330", h, u, 3.8), m("400", 0, o, 3.8), m("330", d, p, 3.8));
            const f = document.createElement("canvas");
            ((f.width = 256), (f.height = 256));
            const g = f.getContext("2d");
            for (let n = 0; n < 8; n++)
              ((g.fillStyle = n % 2 == 0 ? "#2d6a1e" : "#247518"),
                g.fillRect(0, 32 * n, 256, 32));
            const b = new Tt(f);
            ((b.wrapS = q), (b.wrapT = q), b.repeat.set(5, 5));
            const y = new X({ map: b, roughness: 0.75, metalness: 0.02 }),
              w = new Rt(100, 60),
              x = new n(w, y);
            ((x.rotation.x = -Math.PI / 2),
              x.position.set(0, 35, 0.02),
              (x.receiveShadow = !0),
              t.add(x));
            const v = new X({ color: 5592422, roughness: 0.85 }),
              A = new Ct(30, 1, 3);
            for (let L = 0; L < 5; L++) {
              const e = new n(A, v);
              (e.position.set(0, -4 - 2.5 * L, 0.5 + 1.8 * L),
                (e.receiveShadow = !0),
                t.add(e));
            }
            const T = [13382451, 3368652, 13421619, 3381555, 13395507];
            for (let L = 0; L < 5; L++)
              for (let e = 0; e < 12; e++) {
                const s = new Ct(0.6, 0.8, 0.4),
                  o = new X({
                    color: T[(12 * L + e) % T.length],
                    roughness: 0.9,
                  }),
                  i = new n(s, o);
                (i.position.set(
                  1.4 * e - 8 + 0.3 * (Math.random() - 0.5),
                  -4 - 2.5 * L + 0.5,
                  1 + 1.8 * L,
                ),
                  t.add(i));
              }
            const S = new Ct(32, 12, 0.5),
              M = new n(S, v);
            (M.position.set(0, -16, 5), t.add(M));
            const C = new X({ color: 2763312, roughness: 0.9 }),
              k = new Ct(8, 2, 2.5),
              R = new Ct(9, 2.5, 0.15),
              P = new X({ color: 4473936, roughness: 0.7 }),
              E = new n(k, C);
            (E.position.set(15, -3, 1), (E.rotation.y = -0.2), t.add(E));
            const B = new n(R, P);
            (B.position.set(15, -3, 2.4), (B.rotation.y = -0.2), t.add(B));
            const I = new n(k, C);
            (I.position.set(-15, -3, 1), (I.rotation.y = 0.2), t.add(I));
            const _ = new n(R, P);
            (_.position.set(-15, -3, 2.4), (_.rotation.y = 0.2), t.add(_));
          })(T, C));
        const s = c?.team.primaryColor
          ? parseInt(c.team.primaryColor.replace("#", ""), 16)
          : void 0;
        ((Xt = new Qn(T, C, s, (t) => {
          ct?.spawnBaseDust(t);
        })),
          (Q = (function (t) {
            const e = t.anchors.get(nn.HOME),
              n = e?.position ?? new m(0, 0, 0),
              s = t.nodes.get("Wall_Segment_5");
            if (s) {
              const t = s.position.y - n.y,
                e = s.position.x - n.x;
              return Math.sqrt(e * e + t * t);
            }
            let o = 65;
            for (let i = 0; i <= 19; i++) {
              const e = t.nodes.get(`Wall_Segment_${i}`);
              if (e) {
                const t = e.position.y - n.y,
                  s = e.position.x - n.x,
                  i = Math.sqrt(s * s + t * t);
                i > o && (o = i);
              }
            }
            return o;
          })(C)));
        const a = C.nodes.get("Wall_Segment_5");
        (!(function (t, e, s) {
          const o = new Ct(12, 6, 0.3),
            i = new X({ color: 1718810, roughness: 0.8 }),
            a = new n(o, i);
          ((a.name = "SYB_Scoreboard"),
            a.position.set(0, s + 4, 5),
            (a.castShadow = !0),
            t.add(a),
            e.nodes.set(a.name, a));
          const r = document.createElement("canvas");
          ((r.width = 512), (r.height = 256));
          const l = r.getContext("2d");
          ((l.fillStyle = "#0a1a0a"),
            l.fillRect(0, 0, 512, 256),
            (l.fillStyle = "#FFD700"),
            (l.font = "bold 36px monospace"),
            (l.textAlign = "center"),
            l.fillText("SANDLOT SLUGGERS", 256, 60),
            (l.fillStyle = "#BF5700"),
            (l.font = "20px monospace"),
            l.fillText("BLAZE SPORTS INTEL", 256, 100),
            (l.fillStyle = "#33cc33"),
            (l.font = "bold 48px monospace"),
            l.fillText("PLAY BALL!", 256, 180));
          const c = new Tt(r),
            h = new n(new Rt(11.5, 5.5), new X({ map: c, roughness: 0.5 }));
          (h.position.set(0, s + 4, 5.16),
            t.add(h),
            e.nodes.set("SYB_ScoreboardCanvas", h),
            (h._canvas = r),
            (h._texture = c));
        })(T, C, a?.position.y ?? 87),
          S.bindIndex(C));
      } catch (r) {
        ((C = (function (t) {
          const e = new Map(),
            s = new Map(),
            a = new Map(),
            r = new Map(),
            l = new At(200, 32, 32),
            c = document.createElement("canvas");
          ((c.width = 1), (c.height = 256));
          const h = c.getContext("2d"),
            u = h.createLinearGradient(0, 0, 0, 256);
          (u.addColorStop(0, "#1a2a4a"),
            u.addColorStop(0.4, "#3a5a8a"),
            u.addColorStop(0.7, "#c89040"),
            u.addColorStop(1, "#f0c060"),
            (h.fillStyle = u),
            h.fillRect(0, 0, 1, 256));
          const d = new Tt(c),
            p = new g({ map: d, side: St, fog: !1 }),
            f = new n(l, p);
          t.add(f);
          const b = new Rt(150, 150),
            y = new X({ color: 2976286, roughness: 0.75, metalness: 0.02 }),
            w = new n(b, y);
          ((w.rotation.x = -Math.PI / 2), (w.receiveShadow = !0), t.add(w));
          const x = new o(),
            v = new Float32Array(600);
          for (let n = 0; n < 200; n++)
            ((v[3 * n] = 2 * (Math.random() - 0.5)),
              (v[3 * n + 1] = 0.5 * Math.random()),
              (v[3 * n + 2] = 2 * (Math.random() - 0.5)));
          x.setAttribute("position", new O(v, 3));
          const A = new K({
              color: 12887933,
              size: 0.02,
              transparent: !0,
              opacity: 0.4,
            }),
            T = new st(x, A);
          ((T.name = "SYB_DustParticles"), t.add(T));
          const S = document.createElement("canvas");
          ((S.width = 128), (S.height = 128));
          const M = S.getContext("2d");
          ((M.fillStyle = "#c4a77d"), M.fillRect(0, 0, 128, 128));
          for (let n = 0; n < 800; n++) {
            const t = 128 * Math.random(),
              e = 128 * Math.random(),
              n =
                Math.random() > 0.5
                  ? "rgba(180,140,100,0.3)"
                  : "rgba(210,180,140,0.2)";
            ((M.fillStyle = n), M.fillRect(t, e, 2, 2));
          }
          const C = new Tt(S);
          ((C.wrapS = q), (C.wrapT = q), C.repeat.set(3, 3));
          const k = new Pt(25, 48),
            R = new X({ map: C, color: 12887933, roughness: 0.95 }),
            P = new n(k, R);
          ((P.rotation.x = -Math.PI / 2), (P.position.y = 0.01), t.add(P));
          const E = new ot();
          ((E.name = en), t.add(E), e.set(E.name, E));
          const B = 18.3,
            I = 14;
          function L(t, n) {
            const s = new _();
            return (
              (s.name = t),
              s.position.copy(n),
              E.add(s),
              e.set(t, s),
              a.set(t, s),
              s
            );
          }
          function F(t, e) {
            const s = L(t, e),
              o = new Ct(0.38, 0.03, 0.38),
              i = new X({ color: 16777215, roughness: 0.4, metalness: 0 }),
              a = new n(o, i);
            return (
              (a.rotation.y = Math.PI / 4),
              (a.castShadow = !0),
              s.add(a),
              s
            );
          }
          (!(function () {
            const t = L(nn.HOME, new m(0, 0, 0)),
              e = new _t(),
              s = 0.215,
              o = 0.215;
            (e.moveTo(-s, 0),
              e.lineTo(-s, o),
              e.lineTo(0, o + 0.12),
              e.lineTo(s, o),
              e.lineTo(s, 0),
              e.lineTo(-s, 0));
            const i = new Lt(e, { depth: 0.02, bevelEnabled: !1 }),
              a = new X({ color: 16777215, roughness: 0.3 }),
              r = new n(i, a);
            ((r.rotation.x = -Math.PI / 2), (r.position.y = -0.12), t.add(r));
          })(),
            F(nn.FIRST_BASE, new m(12.9381, 12.9381, 0)),
            F(nn.SECOND_BASE, new m(0, 25.8762, 0)),
            F(nn.THIRD_BASE, new m(-12.9381, 12.9381, 0)));
          const N = new X({ color: 12887412, roughness: 0.95 }),
            z = [
              new m(0, 0, 0),
              new m(12.9381, 12.9381, 0),
              new m(0, 25.8762, 0),
              new m(-12.9381, 12.9381, 0),
            ];
          for (let o = 0; o < 4; o++) {
            const e = z[o],
              s = z[(o + 1) % 4],
              i = s.x - e.x,
              a = s.y - e.y,
              r = Math.sqrt(i * i + a * a),
              l = Math.atan2(a, i),
              c = (e.x + s.x) / 2,
              h = (e.y + s.y) / 2,
              u = new Ct(r, 1.2, 0.02),
              d = new n(u, N);
            (d.position.set(c, h, 0.012),
              (d.rotation.z = l),
              (d.receiveShadow = !0),
              t.add(d));
          }
          const D = new Mt(1.5, 2.5, 0.4, 24),
            H = new X({ color: 12887933, roughness: 0.9 }),
            U = new n(D, H);
          (U.position.set(0, I, 0.2), (U.castShadow = !0), t.add(U));
          const G = new Ct(0.61, 0.03, 0.15),
            V = new X({ color: 16777215, roughness: 0.4 }),
            j = new n(G, V);
          (j.position.set(0, I, 0.42),
            t.add(j),
            L(nn.MOUND, new m(0, I, 0.45)),
            L(nn.BATTER, new m(0.6, -0.5, 0)),
            L(nn.CATCHER, new m(0, -1.5, 0.3)),
            L(nn.FIRST_BASEMAN, new m(0.9 * B, 9.15, 0)),
            L(nn.SECOND_BASEMAN, new m(5.49, 1.1 * B, 0)),
            L(nn.SHORTSTOP, new m(-5.49, 1.1 * B, 0)),
            L(nn.THIRD_BASEMAN, new m(0.9 * -18.3, 9.15, 0)),
            L(nn.LEFT_FIELD, new m(-36, 48, 0)),
            L(nn.CENTER_FIELD, new m(0, 60, 0)),
            L(nn.RIGHT_FIELD, new m(36, 48, 0)));
          const W = new _();
          ((W.name = sn.STRIKE_ZONE),
            W.position.set(0, 0, 0.8),
            E.add(W),
            e.set(W.name, W),
            r.set(W.name, W));
          const Y = new _();
          ((Y.name = sn.MOUND),
            Y.position.set(0, I, 1.2),
            E.add(Y),
            e.set(Y.name, Y),
            r.set(Y.name, Y));
          const $ = new _();
          (($.name = on.BEHIND_BATTER),
            $.position.set(0, -3, 1.8),
            $.lookAt(0, I, 0.8),
            E.add($),
            e.set($.name, $));
          const Q = new _();
          ((Q.name = on.STRIKE_ZONE_HIGH),
            Q.position.set(0, -2, 2.5),
            Q.lookAt(0, 0, 0.8),
            E.add(Q),
            e.set(Q.name, Q));
          const J = new _();
          ((J.name = on.ISOMETRIC),
            J.position.set(25, -25, 20),
            J.lookAt(0, 15, 0),
            E.add(J),
            e.set(J.name, J));
          const tt = new kt(50, 55, 64, 1, 0.35 * -Math.PI, 0.7 * Math.PI),
            et = new X({ color: 12096874, roughness: 0.95 }),
            nt = new n(tt, et);
          ((nt.rotation.x = -Math.PI / 2),
            (nt.rotation.z = Math.PI / 2 + (0.35 * Math.PI) / 2),
            nt.position.set(0, 45, 0.015),
            (nt.receiveShadow = !0),
            t.add(nt));
          const it = 65,
            at = 48,
            rt = Math.PI / 4,
            lt = (3 * Math.PI) / 4,
            ct = lt - rt,
            ht = 64.4,
            ut = [],
            dt = [],
            pt = [];
          for (let n = 0; n <= at; n++) {
            const t = rt + (n / at) * ct,
              e = Math.cos(t),
              s = Math.sin(t);
            (ut.push(it * e, it * s, 0),
              dt.push(-e, -s, 0),
              ut.push(it * e, it * s, 3),
              dt.push(-e, -s, 0),
              ut.push(ht * e, ht * s, 0),
              dt.push(e, s, 0),
              ut.push(ht * e, ht * s, 3),
              dt.push(e, s, 0));
          }
          for (let n = 0; n < at; n++) {
            const t = 4 * n,
              e = 4 * (n + 1);
            (pt.push(t + 0, e + 0, e + 1, t + 0, e + 1, t + 1),
              pt.push(t + 2, t + 3, e + 3, t + 2, e + 3, e + 2),
              pt.push(t + 1, e + 1, e + 3, t + 1, e + 3, t + 3));
          }
          const mt = new o();
          (mt.setIndex(pt),
            mt.setAttribute("position", new i(ut, 3)),
            mt.setAttribute("normal", new i(dt, 3)),
            mt.computeVertexNormals(),
            mt.computeBoundingSphere());
          const ft = new X({ color: 1722906, roughness: 0.8, side: Z }),
            gt = new n(mt, ft);
          ((gt.name = "SYB_OutfieldWall"),
            (gt.castShadow = !0),
            (gt.receiveShadow = !0),
            t.add(gt),
            e.set(gt.name, gt));
          const bt = [],
            yt = [];
          for (let n = 0; n <= at; n++) {
            const t = rt + (n / at) * ct,
              e = Math.cos(t),
              s = Math.sin(t);
            (bt.push(it * e, it * s, 3),
              bt.push(it * e, it * s, 3.2),
              bt.push(ht * e, ht * s, 3),
              bt.push(ht * e, ht * s, 3.2));
          }
          for (let n = 0; n < at; n++) {
            const t = 4 * n,
              e = 4 * (n + 1);
            (yt.push(t, e, e + 1, t, e + 1, t + 1),
              yt.push(t + 2, t + 3, e + 3, t + 2, e + 3, e + 2),
              yt.push(t + 1, e + 1, e + 3, t + 1, e + 3, t + 3));
          }
          const wt = new o();
          (wt.setIndex(yt),
            wt.setAttribute("position", new i(bt, 3)),
            wt.computeVertexNormals(),
            wt.computeBoundingSphere());
          const xt = new X({ color: 994831, roughness: 0.7, side: Z });
          t.add(new n(wt, xt));
          for (let n = 0; n < 20; n++) {
            const s = rt + ((n + 0.5) / 20) * ct,
              o = new _();
            ((o.name = `Wall_Segment_${n}`),
              o.position.set(it * Math.cos(s), it * Math.sin(s), 1.5),
              t.add(o),
              e.set(o.name, o));
          }
          const vt = new X({ color: 16766720, metalness: 0.3, roughness: 0.5 }),
            Et = new Mt(0.08, 0.08, 10, 8),
            Ft = it * Math.cos(rt),
            Ot = it * Math.sin(rt),
            Nt = it * Math.cos(lt),
            zt = it * Math.sin(lt),
            Dt = new n(Et, vt);
          (Dt.position.set(Ft, Ot, 5), (Dt.castShadow = !0), t.add(Dt));
          const Ht = new n(Et, vt);
          function Ut(e, n, s, o) {
            const i = document.createElement("canvas");
            ((i.width = 64), (i.height = 32));
            const a = i.getContext("2d");
            ((a.fillStyle = "#FFD700"),
              (a.font = "bold 22px monospace"),
              (a.textAlign = "center"),
              (a.textBaseline = "middle"),
              a.fillText(e, 32, 16));
            const r = new Tt(i),
              l = new Bt({ map: r }),
              c = new It(l);
            (c.position.set(n, s, o), c.scale.set(2.5, 1.25, 1), t.add(c));
          }
          (Ht.position.set(Nt, zt, 5),
            (Ht.castShadow = !0),
            t.add(Ht),
            Ut("330", Ft, Ot, 3.8),
            Ut("400", 0, it, 3.8),
            Ut("330", Nt, zt, 3.8));
          const Gt = hn();
          (Gt.position.set(0.6, -0.5, 0.6), t.add(Gt), e.set(Gt.name, Gt));
          const Vt = bn();
          (Vt.position.set(0, I, 0.42), t.add(Vt), e.set(Vt.name, Vt));
          const qt = new Ct(12, 6, 0.3),
            jt = new X({ color: 1718810, roughness: 0.8 }),
            Wt = new n(qt, jt);
          ((Wt.name = "SYB_Scoreboard"),
            Wt.position.set(0, 69, 5),
            (Wt.castShadow = !0),
            t.add(Wt),
            e.set(Wt.name, Wt));
          const Kt = document.createElement("canvas");
          ((Kt.width = 512), (Kt.height = 256));
          const Yt = Kt.getContext("2d");
          ((Yt.fillStyle = "#0a1a0a"),
            Yt.fillRect(0, 0, 512, 256),
            (Yt.fillStyle = "#FFD700"),
            (Yt.font = "bold 36px monospace"),
            (Yt.textAlign = "center"),
            Yt.fillText("SANDLOT SLUGGERS", 256, 60),
            (Yt.fillStyle = "#BF5700"),
            (Yt.font = "20px monospace"),
            Yt.fillText("BLAZE SPORTS INTEL", 256, 100),
            (Yt.fillStyle = "#33cc33"),
            (Yt.font = "bold 48px monospace"),
            Yt.fillText("PLAY BALL!", 256, 180));
          const $t = new Tt(Kt),
            Xt = new n(new Rt(11.5, 5.5), new X({ map: $t, roughness: 0.5 }));
          (Xt.position.set(0, 69, 5.16), t.add(Xt));
          const Zt = new X({ color: 16777215 }),
            Qt = new Ct(0.08, 0.01, 80),
            Jt = new n(Qt, Zt);
          (Jt.position.set(-20, 30, 0.01),
            (Jt.rotation.y = Math.PI / 4),
            t.add(Jt));
          const te = new n(Qt, Zt);
          (te.position.set(20, 30, 0.01),
            (te.rotation.y = -Math.PI / 4),
            t.add(te));
          const ee = new X({ color: 16777215, roughness: 0.5 });
          function ne(e) {
            const s = new Ct(0.04, 0.01, 1.8),
              o = new Ct(1.2, 0.01, 0.04),
              i = new n(s, ee);
            (i.position.set(e - 0.6, -0.1, 0.005), t.add(i));
            const a = new n(s, ee);
            (a.position.set(e + 0.6, -0.1, 0.005), t.add(a));
            const r = new n(o, ee);
            (r.position.set(e, -0.1, 0.905), t.add(r));
            const l = new n(o, ee);
            (l.position.set(e, -0.1, -0.895), t.add(l));
          }
          (ne(-0.9), ne(0.9));
          const se = new kt(0.8, 0.85, 24),
            oe = new X({ color: 16777215, roughness: 0.5, side: Z }),
            ie = new n(se, oe);
          ((ie.rotation.x = -Math.PI / 2),
            ie.position.set(5, -4, 0.015),
            t.add(ie));
          const ae = new n(se, oe);
          ((ae.rotation.x = -Math.PI / 2),
            ae.position.set(-5, -4, 0.015),
            t.add(ae));
          const re = new X({ color: 5592422, roughness: 0.85 }),
            le = new Ct(30, 1, 3);
          for (let o = 0; o < 5; o++) {
            const e = new n(le, re);
            (e.position.set(0, -4 - 2.5 * o, 0.5 + 1.8 * o),
              (e.receiveShadow = !0),
              t.add(e));
          }
          const ce = [13382451, 3368652, 13421619, 3381555, 13395507];
          for (let o = 0; o < 5; o++)
            for (let e = 0; e < 12; e++) {
              const s = new Ct(0.6, 0.8, 0.4),
                i = new X({
                  color: ce[(12 * o + e) % ce.length],
                  roughness: 0.9,
                }),
                a = new n(s, i);
              (a.position.set(
                1.4 * e - 8 + 0.3 * (Math.random() - 0.5),
                -4 - 2.5 * o + 0.5,
                1 + 1.8 * o,
              ),
                t.add(a));
            }
          const he = new Ct(32, 12, 0.5),
            ue = new n(he, re);
          (ue.position.set(0, -16, 5), t.add(ue));
          const de = new X({ color: 2763312, roughness: 0.9 }),
            pe = new Ct(8, 2, 2.5),
            me = new n(pe, de);
          (me.position.set(15, -3, 1), (me.rotation.y = -0.2), t.add(me));
          const fe = new n(pe, de);
          (fe.position.set(-15, -3, 1), (fe.rotation.y = 0.2), t.add(fe));
          const ge = new Ct(9, 2.5, 0.15),
            be = new X({ color: 4473936, roughness: 0.7 }),
            ye = new n(ge, be);
          (ye.position.set(15, -3, 2.4), (ye.rotation.y = -0.2), t.add(ye));
          const we = new n(ge, be);
          (we.position.set(-15, -3, 2.4), (we.rotation.y = 0.2), t.add(we));
          const xe = document.createElement("canvas");
          ((xe.width = 256), (xe.height = 256));
          const ve = xe.getContext("2d");
          for (let n = 0; n < 8; n++)
            ((ve.fillStyle = n % 2 == 0 ? "#2d6a1e" : "#247518"),
              ve.fillRect(0, 32 * n, 256, 32));
          const Ae = new Tt(xe);
          ((Ae.wrapS = q), (Ae.wrapT = q), Ae.repeat.set(5, 5));
          const Te = new X({ map: Ae, roughness: 0.75, metalness: 0.02 }),
            Se = new Rt(100, 60),
            Me = new n(Se, Te);
          return (
            (Me.rotation.x = -Math.PI / 2),
            Me.position.set(0, 35, 0.02),
            (Me.receiveShadow = !0),
            t.add(Me),
            e.set("SYB_ScoreboardCanvas", Xt),
            (Xt._canvas = Kt),
            (Xt._texture = $t),
            {
              gltf: {
                scene: E,
                scenes: [E],
                cameras: [],
                animations: [],
                asset: { version: "2.0" },
                parser: null,
                userData: {},
              },
              root: E,
              nodes: e,
              cameras: s,
              anchors: a,
              aimTargets: r,
            }
          );
        })(T)),
          (Xt = new Qn(T, C, void 0, (t) => {
            ct?.spawnBaseDust(t);
          })));
      }
      (c &&
        C &&
        (function (t, e) {
          const n = new p(e),
            s = t.nodes.get("SYB_OutfieldWall");
          if (s && s.isMesh) {
            const t = s.material;
            t.isMeshStandardMaterial &&
              ((t.emissive = n),
              (t.emissiveIntensity = 0.15),
              (t.needsUpdate = !0));
          }
        })(C, c.team.primaryColor),
        ce(),
        (ct = new es(T)),
        ct.startDustMotes(),
        (pt = C.nodes.get("SYB_Bat") ?? null),
        (se = (function (t) {
          const e = t.anchors.get("SYB_Anchor_Home"),
            s = e?.position.clone() ?? new m(0, 0, 0),
            o = new ot();
          o.name = "SYB_StrikeZone";
          const i = new Ct(0.44, 0.02, 0.6),
            a = new $({
              color: 16777215,
              transparent: !0,
              opacity: 0.35,
              depthTest: !0,
              depthWrite: !1,
            }),
            r = new tt(new Et(i), a),
            l = new Rt(0.44, 0.6),
            c = new g({
              color: 16777215,
              transparent: !0,
              opacity: 0.04,
              side: Z,
              depthWrite: !1,
            }),
            h = new n(l, c);
          return (
            o.add(r),
            o.add(h),
            o.position.set(s.x, s.y + 0.3, 0.8),
            (o.visible = !1),
            (o._edgesMat = a),
            (o._fillMat = c),
            o
          );
        })(C)),
        T.add(se),
        (U = new Jt(A)),
        U.addPass(new te(T, S.threeCamera)));
      const a = new ne(new l(e.clientWidth, e.clientHeight), 0.3, 0.4, 0.85);
      (U.addPass(a),
        (E = !0),
        (I = performance.now()),
        ue("ready"),
        requestAnimationFrame(Ce));
    },
    stop() {
      ((E = !1),
        he && (clearTimeout(he), (he = null)),
        L?.stop(),
        we(),
        ct?.dispose(),
        (ct = null),
        Xt?.dispose(),
        (Xt = null),
        (W = !0),
        se && (T.remove(se), (se = null)),
        S.stopOrbit(),
        S.stopSweep(),
        S.stopHRCelebration(),
        S.stopSlowMo(),
        ve && (T.remove(ve), Y.release(ve), (ve = null), (Te = !1)),
        H?.dispose(),
        (H = null));
    },
    pause() {
      E && !B && ((B = !0), (E = !1), clearReadyTimer(!0));
    },
    resume() {
      B &&
        ((B = !1),
        (E = !0),
        (I = performance.now()),
        requestAnimationFrame(Ce),
        "ready" === P &&
          scheduleReadyTimer(
            Math.max(readyTimerRemainingMs, Math.min(250, pitchPreset.readyDelayMs)),
          ));
    },
    isPaused: () => B,
    triggerSwing() {
      "pitching" === P &&
        F &&
        !F.swingTriggered &&
        ((F.swingTriggered = !0), (F.swingStartTime = performance.now()));
    },
    startNextPitch() {
      if ("ready" !== P || !C) return;
      var t;
      ((t = k),
        (k = {
          ...t,
          stats: { ...t.stats, pitchCount: t.stats.pitchCount + 1 },
        }),
        u?.(k));
      const e = (function () {
        let t;
        ((D = (1103515245 * D + 12345) >>> 0),
          (t =
            k.strikes >= 2 && k.balls < 3
              ? de
              : k.balls >= 2 && k.strikes < 2
                ? pe
                : xs));
        let e = t[D % t.length];
        return (
          e === me &&
            t.length > 1 &&
            ((D = (1103515245 * D + 12345) >>> 0), (e = t[D % t.length])),
          (me = e),
          e
        );
      })();
      F = { swingTriggered: !1, swingStartTime: 0, contactProcessed: !1 };
      const n = (function (t, e, n, s = []) {
          let o;
          ((o =
            e > t && e >= 2
              ? [20, 35, 25, 15, 5]
              : t > e && t >= 2
                ? [55, 5, 10, 10, 20]
                : 3 === t && 2 === e
                  ? [35, 15, 20, 10, 20]
                  : [30, 20, 20, 15, 15]),
            s.length >= 1 && (o[s[s.length - 1]] = 0));
          if (s.length >= 2) {
            const t = s[s.length - 2];
            o[t] = Math.floor(0.5 * o[t]);
          }
          const i = o.reduce((t, e) => t + e, 0);
          if (0 === i) return ws[0];
          const a = n % i;
          let r = 0;
          for (let l = 0; l < o.length; l++)
            if (((r += o[l]), a < r)) return ws[l];
          return ws[0];
        })(k.balls, k.strikes, D, at),
        s = ws.indexOf(n);
      (at.push(s), at.length > 3 && at.shift());
      const o = Math.floor(
          n.minMph + (((7 * D) % 100) / 100) * (n.maxMph - n.minMph),
        ),
        i = 0.05 * (k.inning - 1),
        a = Math.min(0.02 * k.stats.currentStreak, 0.1),
        r = Math.max(0.88, 1 - 0.002 * k.stats.pitchCount),
        l = n.speedMultiplier * (1 + i + a) * r * x,
        c = Math.round(o * r),
        h = "#" + n.trailColor.toString(16).padStart(6, "0");
      ((nt = c),
        (it = n.name),
        y?.(n.name, c, h),
        se &&
          (!(function (t) {
            {
              t.visible = !0;
              const e = t._edgesMat,
                n = t._fillMat;
              (e && (e.opacity = 0.35), n && (n.opacity = 0.04));
            }
          })(se),
          (ie = !1)),
        ($t = 0.4 / r),
        (function () {
          if (!C) return;
          const t = C.anchors.get("SYB_Anchor_Mound"),
            e = t?.position.clone() ?? new m(0, 14, 0.3);
          ((Wt = Y.acquire()),
            Wt.position.set(e.x, e.y, e.z + 0.5),
            (Wt.visible = !1),
            T.add(Wt),
            (Kt = 0),
            (Yt = !0),
            Xt?.startPitcherDelivery($t));
        })());
      const d = In[e];
      (Xt?.shiftCatcher(d.x),
        Xt?.crouchInfielders(),
        Xt?.adjustForSituation(k.balls, k.strikes, k.outs, k.bases),
        (L = Ln({
          index: C,
          scene: T,
          lane: e,
          seed: D++,
          ballPool: Y,
          speed: l,
          breakScale: v,
          trailColor: n.trailColor,
          pitchTypeName: n.name,
          pitchMph: c,
          onStrikeCross: fe,
        })),
        H?.startPitchWhoosh(c),
        ue("pitching"));
    },
    getPhase: () => P,
    getGameState: () => k,
    getLineup: () => ht,
    resize(t, e) {
      (A.setSize(t, e), S.setAspect(t / e));
    },
    toggleMute: () => H?.toggleMute() ?? !1,
    setCrowdEnergy(t, e, n) {
      H?.setCrowdEnergy(t, e, n);
    },
    playInningTransition() {
      H?.playInningTransition();
    },
    playBigInning() {
      H?.playBigInning();
    },
    playClutchHit() {
      H?.playClutchHit();
    },
    renderToText: () => ({
      phase: P,
      gameState: {
        mode: k.mode,
        difficulty: k.difficulty,
        inning: k.inning,
        outs: k.outs,
        strikes: k.strikes,
        balls: k.balls,
        bases: k.bases,
        targetRuns: k.targetRuns,
        result: k.result,
        suddenDeath: k.suddenDeath,
        stats: k.stats,
      },
      lastPitch: L ? { type: it, mph: nt } : null,
    }),
    advanceTime(t) {
      Me(t / 1e3);
    },
  };
  return ke;
}
const Ts = "#BF5700",
  Ss = "#FFD700";
const Ms = `\n  .syb-hud {\n    position: absolute;\n    inset: 0;\n    pointer-events: none;\n    font-family: 'Oswald', 'Segoe UI', system-ui, sans-serif;\n    z-index: 50;\n    user-select: none;\n  }\n\n  .syb-hud * {\n    pointer-events: none;\n  }\n\n  /* ── 1. SCOREBOARD TOP BAR ── */\n\n  .syb-top-bar {\n    display: flex;\n    justify-content: space-between;\n    align-items: stretch;\n    padding: 10px 16px;\n    gap: 6px;\n  }\n\n  .syb-panel {\n    background: linear-gradient(180deg, rgba(13, 13, 13, 0.88) 0%, rgba(26, 26, 26, 0.82) 100%);\n    backdrop-filter: blur(8px);\n    border: 1px solid rgba(255, 255, 255, 0.06);\n    border-top: 2px solid ${Ts};\n    border-radius: 4px;\n    padding: 8px 14px;\n    position: relative;\n  }\n\n  /* Subtle inner light along the top edge */\n  .syb-panel::after {\n    content: '';\n    position: absolute;\n    top: 0;\n    left: 10%;\n    right: 10%;\n    height: 1px;\n    background: linear-gradient(90deg, transparent, rgba(191, 87, 0, 0.3), transparent);\n  }\n\n  /* ── 2. SCORE / RUNS / HITS ── */\n\n  .syb-score {\n    font-size: 32px;\n    font-weight: 700;\n    color: ${Ss};\n    line-height: 1;\n    font-variant-numeric: tabular-nums;\n  }\n\n  .syb-score-label {\n    font-size: 9px;\n    color: rgba(255, 255, 255, 0.5);\n    text-transform: uppercase;\n    letter-spacing: 2px;\n    margin-top: 2px;\n  }\n\n  .syb-hits {\n    font-size: 20px;\n    font-weight: 600;\n    color: rgba(255, 255, 255, 0.85);\n    line-height: 1;\n    font-variant-numeric: tabular-nums;\n  }\n\n  .syb-hits-label {\n    font-size: 9px;\n    color: rgba(255, 255, 255, 0.4);\n    text-transform: uppercase;\n    letter-spacing: 2px;\n    margin-top: 2px;\n  }\n\n  .syb-score-group {\n    display: flex;\n    gap: 16px;\n    align-items: flex-end;\n  }\n\n  /* Vertical divider between R and H columns */\n  .syb-score-divider {\n    width: 1px;\n    align-self: stretch;\n    background: rgba(255, 255, 255, 0.1);\n    margin: 2px 0;\n  }\n\n  /* ── COUNT DOTS (B/S/O) ── */\n\n  .syb-count {\n    display: flex;\n    gap: 14px;\n    align-items: center;\n  }\n\n  .syb-count-group {\n    text-align: center;\n  }\n\n  .syb-count-dots {\n    display: flex;\n    gap: 5px;\n    justify-content: center;\n    margin-bottom: 3px;\n  }\n\n  .syb-dot {\n    width: 11px;\n    height: 11px;\n    border-radius: 50%;\n    border: 1.5px solid rgba(255, 255, 255, 0.2);\n    transition: background 0.15s, border-color 0.15s, box-shadow 0.2s;\n    background: rgba(255, 255, 255, 0.04);\n  }\n\n  .syb-dot.active {\n    border-color: transparent;\n  }\n\n  .syb-dot.strike {\n    background: #ff4444;\n    border-color: #ff4444;\n    box-shadow: 0 0 4px 1px rgba(255, 68, 68, 0.25);\n  }\n\n  .syb-dot.strike.flash {\n    box-shadow: 0 0 10px 3px rgba(255, 68, 68, 0.7);\n  }\n\n  .syb-dot.ball {\n    background: #44bb44;\n    border-color: #44bb44;\n    box-shadow: 0 0 4px 1px rgba(68, 187, 68, 0.25);\n  }\n\n  .syb-dot.ball.flash {\n    box-shadow: 0 0 10px 3px rgba(68, 187, 68, 0.7);\n  }\n\n  .syb-dot.out {\n    background: ${Ts};\n    border-color: ${Ts};\n    box-shadow: 0 0 4px 1px rgba(191, 87, 0, 0.25);\n  }\n\n  .syb-dot.out.flash {\n    box-shadow: 0 0 10px 3px rgba(191, 87, 0, 0.7);\n  }\n\n  .syb-count-label {\n    font-size: 10px;\n    color: rgba(255, 255, 255, 0.45);\n    text-transform: uppercase;\n    letter-spacing: 1.5px;\n    font-weight: 600;\n  }\n\n  /* Count separator lines between B / S / O */\n  .syb-count-sep {\n    width: 1px;\n    height: 24px;\n    background: rgba(255, 255, 255, 0.08);\n  }\n\n  /* ── INNING PANEL ── */\n\n  .syb-inning {\n    font-size: 18px;\n    font-weight: 700;\n    color: rgba(255, 255, 255, 0.9);\n    text-align: center;\n    font-variant-numeric: tabular-nums;\n  }\n\n  .syb-inning-label {\n    font-size: 9px;\n    color: rgba(255, 255, 255, 0.4);\n    text-transform: uppercase;\n    letter-spacing: 2px;\n    margin-top: 2px;\n  }\n\n  /* ── STREAK ── */\n\n  .syb-streak {\n    position: absolute;\n    top: 104px;\n    right: 16px;\n    font-size: 14px;\n    font-weight: 700;\n    color: ${Ss};\n    opacity: 0;\n    transition: opacity 0.3s, transform 0.2s, font-size 0.2s;\n    text-shadow: 0 1px 6px rgba(255, 215, 0, 0.4);\n  }\n\n  .syb-streak.visible {\n    opacity: 1;\n  }\n\n  .syb-streak.hot {\n    font-size: 16px;\n    color: #ff8c00;\n    text-shadow: 0 0 8px rgba(255, 140, 0, 0.6);\n    animation: streak-pulse 0.6s ease-in-out infinite;\n  }\n\n  .syb-streak.fire {\n    font-size: 18px;\n    color: #ff4500;\n    text-shadow: 0 0 12px rgba(255, 69, 0, 0.7), 0 0 24px rgba(255, 69, 0, 0.3);\n    animation: streak-pulse 0.4s ease-in-out infinite;\n  }\n\n  @keyframes streak-pulse {\n    0%, 100% { transform: scale(1); }\n    50% { transform: scale(1.08); }\n  }\n\n  /* ── SWING BUTTON ── */\n\n  .syb-swing-btn {\n    position: absolute;\n    bottom: 32px;\n    left: 50%;\n    transform: translateX(-50%);\n    width: 80px;\n    height: 80px;\n    border-radius: 50%;\n    border: 3px solid ${Ts};\n    background: rgba(191, 87, 0, 0.2);\n    color: white;\n    font-family: 'Oswald', sans-serif;\n    font-size: 13px;\n    font-weight: 700;\n    text-transform: uppercase;\n    letter-spacing: 1px;\n    cursor: pointer;\n    pointer-events: auto !important;\n    touch-action: manipulation;\n    transition: transform 0.1s, background 0.15s;\n    -webkit-tap-highlight-color: transparent;\n  }\n\n  .syb-swing-btn:active {\n    transform: translateX(-50%) scale(0.92);\n    background: rgba(191, 87, 0, 0.5);\n  }\n\n  .syb-phase-hint {\n    position: absolute;\n    bottom: 124px;\n    left: 50%;\n    transform: translateX(-50%);\n    font-size: 12px;\n    font-family: 'Cormorant Garamond', 'Georgia', serif;\n    font-weight: 600;\n    color: rgba(255, 255, 255, 0.45);\n    text-align: center;\n    transition: opacity 0.3s;\n    white-space: nowrap;\n    letter-spacing: 0.5px;\n  }\n\n  /* ── CENTER MESSAGES ── */\n\n  .syb-message {\n    position: absolute;\n    top: 45%;\n    left: 50%;\n    transform: translate(-50%, -50%) scale(1);\n    font-size: 36px;\n    font-weight: 700;\n    color: white;\n    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);\n    opacity: 0;\n    transition: opacity 0.2s, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);\n    text-align: center;\n    white-space: nowrap;\n  }\n\n  .syb-message.visible {\n    opacity: 1;\n    transform: translate(-50%, -50%) scale(1);\n  }\n\n  .syb-message.pop {\n    transform: translate(-50%, -50%) scale(1.15);\n  }\n\n  .syb-message.msg-hr {\n    color: ${Ss};\n    font-size: 44px;\n    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5), 0 2px 12px rgba(0, 0, 0, 0.6);\n  }\n\n  .syb-message.msg-hit {\n    color: #33dd55;\n  }\n\n  .syb-message.msg-out {\n    color: #ff5555;\n  }\n\n  .syb-message.msg-walk {\n    color: #55bbff;\n  }\n\n  .syb-message.msg-inning {\n    font-size: 28px;\n    color: rgba(255, 255, 255, 0.7);\n    letter-spacing: 2px;\n    text-transform: uppercase;\n  }\n\n  /* ── RUNS SCORED TOAST ── */\n\n  .syb-runs-toast {\n    position: absolute;\n    top: 38%;\n    left: 50%;\n    transform: translateX(-50%);\n    font-size: 20px;\n    font-weight: 700;\n    color: ${Ss};\n    text-shadow: 0 0 12px rgba(255, 215, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.4);\n    opacity: 0;\n    transition: opacity 0.25s, transform 0.3s;\n    pointer-events: none;\n    letter-spacing: 2px;\n  }\n\n  .syb-runs-toast.visible {\n    opacity: 1;\n    transform: translateX(-50%) translateY(-6px);\n  }\n\n  /* v2: Team color accent on panels */\n  .syb-panel.team-accent {\n    border-top-color: var(--syb-team-color, ${Ts});\n  }\n\n  /* v2: Team logo in score panel */\n  .syb-team-logo {\n    width: 22px;\n    height: 22px;\n    object-fit: contain;\n    margin-right: 8px;\n    vertical-align: middle;\n    display: none;\n    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));\n  }\n\n  .syb-team-logo.visible {\n    display: inline-block;\n  }\n\n  /* v2: Batter info strip */\n  .syb-batter-strip {\n    position: absolute;\n    top: 62px;\n    left: 16px;\n    right: 16px;\n    text-align: center;\n    font-family: 'Cormorant Garamond', 'Georgia', serif;\n    font-size: 13px;\n    font-weight: 600;\n    color: rgba(255, 255, 255, 0.6);\n    letter-spacing: 0.5px;\n    opacity: 0;\n    transition: opacity 0.4s;\n    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);\n  }\n\n  .syb-batter-strip.visible {\n    opacity: 1;\n  }\n\n  .syb-batter-name {\n    color: ${Ss};\n    font-family: 'Oswald', sans-serif;\n    font-weight: 700;\n    text-transform: uppercase;\n    font-size: 12px;\n    letter-spacing: 1px;\n  }\n\n  .syb-batter-stat {\n    font-family: 'JetBrains Mono', monospace;\n    color: rgba(255, 255, 255, 0.45);\n    font-size: 10px;\n    letter-spacing: 0.5px;\n  }\n\n  /* v2: Base runner diamond */\n  .syb-diamond {\n    position: absolute;\n    top: 62px;\n    right: 16px;\n    width: 36px;\n    height: 36px;\n  }\n\n  .syb-base {\n    position: absolute;\n    width: 10px;\n    height: 10px;\n    transform: rotate(45deg);\n    border: 1.5px solid rgba(255, 255, 255, 0.2);\n    background: transparent;\n    transition: background 0.2s, border-color 0.2s;\n  }\n\n  .syb-base.occupied {\n    background: ${Ss};\n    border-color: ${Ss};\n  }\n\n  .syb-base.just-occupied {\n    animation: base-arrive 0.5s ease-out;\n  }\n\n  @keyframes base-arrive {\n    0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.8); transform: rotate(45deg) scale(1.3); }\n    50% { box-shadow: 0 0 10px 4px rgba(255, 215, 0, 0.4); }\n    100% { box-shadow: none; transform: rotate(45deg) scale(1); }\n  }\n\n  .syb-base-1 { bottom: 4px; right: 0; }\n  .syb-base-2 { top: 0; left: 13px; }\n  .syb-base-3 { bottom: 4px; left: 0; }\n\n  /* v2: Wider mobile swing zone */\n  @media (max-width: 768px) {\n    .syb-swing-btn {\n      width: 85%;\n      max-width: 360px;\n      height: 60px;\n      border-radius: 12px;\n      bottom: 20px;\n      font-size: 15px;\n      letter-spacing: 2px;\n    }\n  }\n\n  .syb-swing-btn.pulse {\n    animation: swing-pulse 0.8s ease-in-out infinite;\n    border-color: ${Ss};\n    background: rgba(255, 215, 0, 0.15);\n  }\n\n  @keyframes swing-pulse {\n    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }\n    50% { box-shadow: 0 0 0 8px rgba(255, 215, 0, 0); }\n  }\n\n  /* Desktop: hide swing button, show keyboard hints */\n  @media (min-width: 769px) {\n    .syb-swing-btn {\n      display: none;\n    }\n  }\n\n  /* Mobile: compact panels */\n  @media (max-width: 768px) {\n    .syb-score { font-size: 24px; }\n    .syb-hits { font-size: 16px; }\n    .syb-panel { padding: 6px 10px; }\n    .syb-message { font-size: 28px; }\n    .syb-phase-hint { bottom: 94px; font-size: 11px; }\n    .syb-batter-strip { top: 56px; font-size: 11px; }\n  }\n\n  @media (max-width: 400px) {\n    .syb-top-bar { padding: 8px 10px; }\n    .syb-score { font-size: 20px; }\n    .syb-hits { font-size: 14px; }\n    .syb-dot { width: 9px; height: 9px; }\n    .syb-batter-strip { top: 50px; font-size: 10px; }\n  }\n\n  /* Score pop on change */\n  .syb-score.score-change {\n    animation: score-pop 0.35s ease-out;\n  }\n\n  @keyframes score-pop {\n    0% { transform: scale(1.35); color: #fff; }\n    60% { transform: scale(0.95); }\n    100% { transform: scale(1); }\n  }\n\n  /* ── 5. INNING TRANSITION BANNER ── */\n\n  .syb-inning-banner {\n    position: absolute;\n    top: 36%;\n    left: 0;\n    right: 0;\n    height: 80px;\n    background: linear-gradient(180deg,\n      transparent,\n      rgba(13, 13, 13, 0.7) 15%,\n      rgba(13, 13, 13, 0.85) 50%,\n      rgba(13, 13, 13, 0.7) 85%,\n      transparent\n    );\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    justify-content: center;\n    gap: 0;\n    transform: scaleX(0);\n    opacity: 0;\n    transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s;\n    pointer-events: none;\n  }\n\n  .syb-inning-banner.active {\n    transform: scaleX(1);\n    opacity: 1;\n  }\n\n  .syb-inning-banner-rule {\n    width: 120px;\n    height: 1px;\n    background: linear-gradient(90deg, transparent, ${Ts}, transparent);\n  }\n\n  .syb-inning-banner-text {\n    font-size: 22px;\n    font-weight: 700;\n    color: ${Ss};\n    letter-spacing: 8px;\n    text-transform: uppercase;\n    text-shadow: 0 0 24px rgba(255, 215, 0, 0.4), 0 0 60px rgba(191, 87, 0, 0.15);\n    padding: 6px 0;\n  }\n\n  /* Out emphasis vignette -- red edges flash on outs */\n  .syb-vignette {\n    position: absolute;\n    inset: 0;\n    background: radial-gradient(ellipse at center, transparent 40%, rgba(255, 50, 50, 0.25) 100%);\n    opacity: 0;\n    transition: opacity 0.12s ease-in;\n    pointer-events: none;\n  }\n\n  .syb-vignette.active {\n    opacity: 1;\n    transition: opacity 0.05s;\n  }\n\n  /* Strikeout K stamp -- big dramatic letter */\n  .syb-message.msg-strikeout {\n    color: #ff4444;\n    font-size: 80px;\n    font-weight: 900;\n    animation: k-stamp 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);\n    text-shadow: 0 0 40px rgba(255, 68, 68, 0.5), 0 4px 20px rgba(0, 0, 0, 0.6);\n    letter-spacing: 4px;\n  }\n\n  @keyframes k-stamp {\n    0% { transform: translate(-50%, -50%) scale(3); opacity: 0; }\n    50% { transform: translate(-50%, -50%) scale(0.85); opacity: 1; }\n    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }\n  }\n\n  /* Swinging strikeout -- backward K (mirrored horizontally) */\n  .syb-message.msg-strikeout.swinging {\n    transform: translate(-50%, -50%) scaleX(-1);\n    animation: k-stamp-swing 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);\n  }\n\n  @keyframes k-stamp-swing {\n    0% { transform: translate(-50%, -50%) scaleX(-1) scale(3); opacity: 0; }\n    50% { transform: translate(-50%, -50%) scaleX(-1) scale(0.85); opacity: 1; }\n    100% { transform: translate(-50%, -50%) scaleX(-1) scale(1); opacity: 1; }\n  }\n\n  /* ── 4. TIMING TOAST + STAT LINE ── */\n\n  .syb-timing-toast {\n    position: absolute;\n    top: 52%;\n    left: 50%;\n    transform: translateX(-50%);\n    font-size: 14px;\n    font-weight: 700;\n    letter-spacing: 4px;\n    text-transform: uppercase;\n    opacity: 0;\n    transition: opacity 0.15s, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);\n    pointer-events: none;\n    padding: 4px 16px;\n    border-radius: 3px;\n    background: rgba(0, 0, 0, 0.5);\n    backdrop-filter: blur(4px);\n    border: 1px solid rgba(255, 255, 255, 0.08);\n  }\n\n  .syb-timing-toast.visible {\n    opacity: 1;\n    transform: translateX(-50%) translateY(-4px);\n  }\n\n  .syb-timing-toast.timing-perfect {\n    color: ${Ss};\n    border-color: rgba(255, 215, 0, 0.3);\n    background: rgba(255, 215, 0, 0.12);\n    text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);\n  }\n  .syb-timing-toast.timing-good {\n    color: #33dd55;\n    border-color: rgba(51, 221, 85, 0.25);\n    background: rgba(51, 221, 85, 0.1);\n  }\n  .syb-timing-toast.timing-early {\n    color: #55aaff;\n    border-color: rgba(85, 170, 255, 0.2);\n    background: rgba(85, 170, 255, 0.08);\n  }\n  .syb-timing-toast.timing-late {\n    color: #ff8c00;\n    border-color: rgba(255, 140, 0, 0.25);\n    background: rgba(255, 140, 0, 0.1);\n  }\n\n  /* Exit velocity / distance stat line */\n  .syb-stat-line {\n    position: absolute;\n    top: 58%;\n    left: 50%;\n    transform: translateX(-50%);\n    font-family: 'JetBrains Mono', monospace;\n    font-size: 12px;\n    font-weight: 400;\n    color: rgba(255, 255, 255, 0.55);\n    letter-spacing: 1px;\n    opacity: 0;\n    transition: opacity 0.25s;\n    pointer-events: none;\n    white-space: nowrap;\n    padding: 2px 10px;\n    border-left: 2px solid ${Ts};\n  }\n\n  .syb-stat-line.visible { opacity: 1; }\n\n  /* Character bark speech bubble */\n  .syb-bark-toast {\n    position: absolute;\n    bottom: 32%;\n    left: 50%;\n    transform: translateX(-50%) scale(0.8);\n    font-family: 'Oswald', sans-serif;\n    font-size: 13px;\n    font-weight: 600;\n    letter-spacing: 1px;\n    text-transform: uppercase;\n    color: #fff;\n    background: rgba(26, 26, 26, 0.75);\n    border: 1px solid rgba(191, 87, 0, 0.4);\n    border-radius: 6px;\n    padding: 5px 14px;\n    opacity: 0;\n    transition: opacity 0.2s, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);\n    pointer-events: none;\n    white-space: nowrap;\n    backdrop-filter: blur(4px);\n  }\n  .syb-bark-toast.visible {\n    opacity: 1;\n    transform: translateX(-50%) scale(1);\n  }\n\n  /* Enhanced timing toast — scale bounce on appear */\n  .syb-timing-toast.visible.timing-perfect {\n    animation: timing-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);\n  }\n  @keyframes timing-pop {\n    0% { transform: translateX(-50%) scale(0.6); }\n    60% { transform: translateX(-50%) translateY(-6px) scale(1.15); }\n    100% { transform: translateX(-50%) translateY(-4px) scale(1); }\n  }\n\n  /* ── 3. TUTORIAL HINT ── */\n\n  .syb-tutorial {\n    position: absolute;\n    bottom: 160px;\n    left: 50%;\n    transform: translateX(-50%);\n    font-family: 'Cormorant Garamond', 'Georgia', serif;\n    font-size: 16px;\n    font-weight: 600;\n    font-style: italic;\n    color: rgba(255, 255, 255, 0.65);\n    text-align: center;\n    letter-spacing: 0.5px;\n    opacity: 0;\n    transition: opacity 0.5s;\n    pointer-events: none;\n    padding: 6px 20px;\n    border-top: 1px solid rgba(191, 87, 0, 0.25);\n    border-bottom: 1px solid rgba(191, 87, 0, 0.25);\n  }\n\n  .syb-tutorial.visible {\n    opacity: 1;\n    animation: tutorial-glow 2.5s ease-in-out infinite;\n  }\n\n  @keyframes tutorial-glow {\n    0%, 100% { text-shadow: 0 0 0 transparent; border-color: rgba(191, 87, 0, 0.25); }\n    50% { text-shadow: 0 0 12px rgba(255, 215, 0, 0.3); border-color: rgba(191, 87, 0, 0.45); }\n  }\n\n  @media (max-width: 768px) {\n    .syb-timing-toast { font-size: 12px; letter-spacing: 3px; padding: 3px 12px; }\n    .syb-stat-line { font-size: 10px; }\n    .syb-tutorial { bottom: 130px; font-size: 14px; }\n  }\n\n  /* Clutch hit -- gold flash for final-inning heroics */\n  .syb-message.msg-clutch {\n    color: #FFD700;\n    font-size: 40px;\n    text-shadow: 0 0 30px rgba(255, 215, 0, 0.6), 0 2px 12px rgba(0, 0, 0, 0.6);\n    letter-spacing: 3px;\n    animation: clutch-flash 0.5s ease-out;\n  }\n\n  @keyframes clutch-flash {\n    0% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }\n    40% { transform: translate(-50%, -50%) scale(0.9); opacity: 1; }\n    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }\n  }\n\n  /* Extra-base hit / big inning screen flash overlay */\n  .syb-hit-flash {\n    position: absolute;\n    inset: 0;\n    opacity: 0;\n    transition: opacity 0.15s ease-out;\n    pointer-events: none;\n  }\n\n  .syb-hit-flash.active {\n    opacity: 1;\n    transition: opacity 0.05s;\n  }\n\n  .syb-hit-flash.flash-double {\n    background: radial-gradient(ellipse at center, transparent 30%, rgba(51, 221, 85, 0.15) 100%);\n  }\n\n  .syb-hit-flash.flash-triple {\n    background: radial-gradient(ellipse at center, transparent 25%, rgba(85, 170, 255, 0.2) 100%);\n  }\n\n  .syb-hit-flash.flash-big-inning {\n    background: radial-gradient(ellipse at center, transparent 20%, rgba(255, 215, 0, 0.2) 100%);\n  }\n\n  /* Pitch info toast -- positioned below top bar, left-center */\n  .syb-pitch-info {\n    position: absolute;\n    top: 64px;\n    left: 50%;\n    transform: translateX(-50%);\n    display: flex;\n    align-items: center;\n    gap: 6px;\n    font-size: 13px;\n    font-weight: 600;\n    color: rgba(255, 255, 255, 0.7);\n    letter-spacing: 1px;\n    opacity: 0;\n    transition: opacity 0.15s, transform 0.2s;\n    pointer-events: none;\n    white-space: nowrap;\n    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);\n  }\n\n  .syb-pitch-info.visible {\n    opacity: 1;\n    transform: translateX(-50%) translateY(-2px);\n  }\n\n  .syb-pitch-dot {\n    width: 8px;\n    height: 8px;\n    border-radius: 50%;\n    display: inline-block;\n  }\n\n  .syb-pitch-speed {\n    font-family: 'JetBrains Mono', monospace;\n    font-weight: 700;\n    color: rgba(255, 255, 255, 0.9);\n  }\n\n  @media (max-width: 768px) {\n    .syb-pitch-info { top: 58px; font-size: 11px; }\n  }\n\n  /* Two-strike danger glow on count panel */\n  .syb-panel.danger {\n    border-top-color: #ff4444;\n    box-shadow: 0 0 8px 1px rgba(255, 68, 68, 0.15), inset 0 0 6px rgba(255, 68, 68, 0.06);\n    transition: border-color 0.3s, box-shadow 0.3s;\n  }\n\n  /* Three-ball hitter's count glow */\n  .syb-panel.hitter-count {\n    border-top-color: #44bb44;\n    box-shadow: 0 0 8px 1px rgba(68, 187, 68, 0.15), inset 0 0 6px rgba(68, 187, 68, 0.06);\n    transition: border-color 0.3s, box-shadow 0.3s;\n  }\n`;
function Cs(t) {
  if (
    ((function () {
      if (document.querySelector("link[data-syb-font]")) return;
      const t = document.createElement("link");
      ((t.rel = "stylesheet"),
        (t.href =
          "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=JetBrains+Mono:wght@400;700&family=Oswald:wght@400;600;700&display=swap"),
        (t.dataset.sybFont = "1"),
        document.head.appendChild(t));
    })(),
    !document.querySelector("style[data-syb-hud]"))
  ) {
    const t = document.createElement("style");
    ((t.dataset.sybHud = "1"),
      (t.textContent = Ms),
      document.head.appendChild(t));
  }
  const e = document.createElement("div");
  e.className = "syb-hud";
  const n = document.createElement("div");
  n.className = "syb-top-bar";
  const s = document.createElement("div");
  s.className = "syb-panel";
  const o = document.createElement("img");
  ((o.className = "syb-team-logo"), (o.alt = ""));
  const i = document.createElement("div");
  i.className = "syb-score-group";
  const a = document.createElement("div"),
    r = document.createElement("div");
  ((r.className = "syb-score"), (r.textContent = "0"));
  const l = document.createElement("div");
  ((l.className = "syb-score-label"),
    (l.textContent = "Runs"),
    a.appendChild(r),
    a.appendChild(l));
  const c = document.createElement("div"),
    h = document.createElement("div");
  ((h.className = "syb-hits"), (h.textContent = "0"));
  const u = document.createElement("div");
  ((u.className = "syb-hits-label"),
    (u.textContent = "Hits"),
    c.appendChild(h),
    c.appendChild(u));
  const d = document.createElement("div");
  ((d.className = "syb-score-divider"),
    i.appendChild(a),
    i.appendChild(d),
    i.appendChild(c),
    s.appendChild(o),
    s.appendChild(i));
  const p = document.createElement("div");
  p.className = "syb-panel";
  const m = document.createElement("div");
  m.className = "syb-count";
  const f = ks("B", 4, "ball"),
    g = ks("S", 3, "strike"),
    b = ks("O", 3, "out"),
    y = document.createElement("div");
  y.className = "syb-count-sep";
  const w = document.createElement("div");
  ((w.className = "syb-count-sep"),
    m.appendChild(f.container),
    m.appendChild(y),
    m.appendChild(g.container),
    m.appendChild(w),
    m.appendChild(b.container),
    p.appendChild(m));
  const x = document.createElement("div");
  x.className = "syb-panel";
  const v = document.createElement("div");
  ((v.className = "syb-inning"), (v.textContent = "1"));
  const A = document.createElement("div");
  ((A.className = "syb-inning-label"),
    (A.textContent = "Inning"),
    x.appendChild(v),
    x.appendChild(A),
    n.appendChild(s),
    n.appendChild(p),
    n.appendChild(x));
  const T = document.createElement("div");
  T.className = "syb-streak";
  const S = document.createElement("button");
  ((S.className = "syb-swing-btn"),
    (S.textContent = "SWING"),
    S.addEventListener(
      "touchstart",
      (e) => {
        (e.preventDefault(), t.onSwing());
      },
      { passive: !1 },
    ),
    S.addEventListener("click", (e) => {
      (e.preventDefault(), t.onSwing());
    }));
  const M = document.createElement("div");
  ((M.className = "syb-phase-hint"), (M.textContent = "Tap or press Space"));
  const C = document.createElement("div");
  C.className = "syb-message";
  const k = document.createElement("div");
  k.className = "syb-runs-toast";
  const R = document.createElement("div");
  R.className = "syb-batter-strip";
  const targetChip = document.createElement("div");
  targetChip.className = "syb-target-chip";
  targetChip.style.cssText =
    "position:absolute;top:94px;left:50%;transform:translateX(-50%);padding:5px 14px;border-radius:999px;border:1px solid rgba(255,215,0,0.22);background:rgba(13,13,13,0.72);backdrop-filter:blur(8px);font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#FFD700;opacity:0;transition:opacity .25s;pointer-events:none;white-space:nowrap;";
  const P = document.createElement("div");
  P.className = "syb-diamond";
  const E = document.createElement("div");
  E.className = "syb-base syb-base-1";
  const B = document.createElement("div");
  B.className = "syb-base syb-base-2";
  const I = document.createElement("div");
  ((I.className = "syb-base syb-base-3"),
    P.appendChild(E),
    P.appendChild(B),
    P.appendChild(I));
  const _ = document.createElement("div");
  _.className = "syb-inning-banner";
  const L = document.createElement("div");
  L.className = "syb-inning-banner-rule";
  const F = document.createElement("div");
  F.className = "syb-inning-banner-text";
  const O = document.createElement("div");
  ((O.className = "syb-inning-banner-rule"),
    _.appendChild(L),
    _.appendChild(F),
    _.appendChild(O));
  const N = document.createElement("div");
  N.className = "syb-vignette";
  const z = document.createElement("div");
  z.className = "syb-timing-toast";
  const D = document.createElement("div");
  D.className = "syb-stat-line";
  const H = document.createElement("div");
  ((H.className = "syb-tutorial"),
    (H.textContent = "Press Space or tap to swing"));
  const U = document.createElement("div");
  U.className = "syb-hit-flash";
  const G = document.createElement("div");
  ((G.className = "syb-pitch-info"),
    e.appendChild(n),
    e.appendChild(R),
    e.appendChild(targetChip),
    e.appendChild(P),
    e.appendChild(T),
    e.appendChild(M),
    e.appendChild(S),
    e.appendChild(C),
    e.appendChild(k),
    e.appendChild(_),
    e.appendChild(N),
    e.appendChild(z),
    e.appendChild(D),
    e.appendChild(H),
    e.appendChild(U),
    e.appendChild(G));
  const V = document.createElement("div");
  ((V.className = "syb-bark-toast"),
    e.appendChild(V),
    t.parent.appendChild(e),
    (m._ballDots = f.dots),
    (m._strikeDots = g.dots),
    (m._outDots = b.dots));
  return {
    container: e,
    scoreDisplay: r,
    scoreLabel: l,
    countDisplay: m,
    outsDisplay: b.container,
    inningDisplay: v,
    inningLabel: A,
    streakDisplay: T,
    swingButton: S,
    messageOverlay: C,
    phaseHint: M,
    batterStrip: R,
    targetChip,
    teamLogo: o,
    panels: [s, p, x],
    bases: [E, B, I],
    runsToast: k,
    inningBanner: _,
    vignette: N,
    timingToast: z,
    statLine: D,
    tutorialHint: H,
    hitFlash: U,
    pitchInfo: G,
    hitsDisplay: h,
    hitsLabel: u,
    barkToast: V,
  };
}
function ks(t, e, n) {
  const s = document.createElement("div");
  s.className = "syb-count-group";
  const o = document.createElement("div");
  o.className = "syb-count-dots";
  const i = [];
  for (let r = 0; r < e; r++) {
    const t = document.createElement("div");
    ((t.className = "syb-dot"),
      (t.dataset.type = n),
      o.appendChild(t),
      i.push(t));
  }
  const a = document.createElement("div");
  return (
    (a.className = "syb-count-label"),
    (a.textContent = t),
    s.appendChild(o),
    s.appendChild(a),
    { container: s, dots: i }
  );
}
function Rs(t, e, n) {
  const s = "hrDerby" === e.mode ? e.stats.homeRuns : e.stats.runs;
  if (
    ("hrDerby" === e.mode
      ? ((t.scoreDisplay.textContent = String(e.stats.homeRuns)),
        (t.scoreLabel.textContent = "HRs"),
        (t.hitsDisplay.textContent = String(e.stats.hits)))
      : ((t.scoreDisplay.textContent = String(e.stats.runs)),
        (t.scoreLabel.textContent = "Runs"),
        (t.hitsDisplay.textContent = String(e.stats.hits))),
    s !== Bs &&
      s > 0 &&
      (t.scoreDisplay.classList.remove("score-change"),
      t.scoreDisplay.offsetWidth,
      t.scoreDisplay.classList.add("score-change")),
    (Bs = s),
    !_s)
  ) {
    const n = t.countDisplay;
    (Is(n._ballDots, e.balls, "ball"),
      Is(n._strikeDots, e.strikes, "strike"),
      Is(n._outDots, e.outs, "out"));
  }
  ("hrDerby" === e.mode
    ? ((t.inningDisplay.textContent = `${e.stats.derbyOuts}/${e.maxDerbyOuts}`),
      (t.inningLabel.textContent = "Outs"))
    : "practice" === e.mode
      ? ((t.inningDisplay.textContent = String(e.stats.pitchCount)),
        (t.inningLabel.textContent = "Pitches"))
      : ((t.inningDisplay.textContent = String(e.inning)),
        (t.inningLabel.textContent = e.suddenDeath ? "Sudden" : "Inning")),
    t.streakDisplay.classList.remove("visible", "hot", "fire"),
    e.stats.currentStreak >= 2 &&
      ((t.streakDisplay.textContent = `${e.stats.currentStreak}x Streak!`),
      t.streakDisplay.classList.add("visible"),
      e.stats.currentStreak >= 5
        ? t.streakDisplay.classList.add("fire")
        : e.stats.currentStreak >= 3 && t.streakDisplay.classList.add("hot")));
  if ("quickPlay" === e.mode || "teamMode" === e.mode) {
    ((t.targetChip.textContent = `Target ${e.targetRuns ?? 0} Runs`),
      (t.targetChip.style.opacity = "1"));
  } else t.targetChip.style.opacity = "0";
  for (let o = 0; o < 3; o++) {
    const n = !!e.bases[o];
    (n
      ? (t.bases[o].classList.add("occupied"),
        Es[o] ||
          (t.bases[o].classList.add("just-occupied"),
          setTimeout(() => t.bases[o].classList.remove("just-occupied"), 500)))
      : t.bases[o].classList.remove("occupied", "just-occupied"),
      (Es[o] = n));
  }
  switch (n) {
    case "ready":
      ((t.phaseHint.textContent = "Next pitch incoming..."),
        (t.phaseHint.style.opacity = "0.6"));
      break;
    case "pitching":
      ((t.phaseHint.textContent = "Swing!"), (t.phaseHint.style.opacity = "1"));
      break;
    default:
      t.phaseHint.style.opacity = "0";
  }
}
const Ps = { ball: 0, strike: 0, out: 0 },
  Es = [!1, !1, !1];
let Bs = 0;
function Is(t, e, n) {
  const s = Ps[n] ?? 0;
  Ps[n] = e;
  for (let o = 0; o < t.length; o++)
    o < e
      ? (t[o].classList.add("active", n),
        o >= s &&
          (t[o].classList.add("flash"),
          setTimeout(() => t[o].classList.remove("flash"), 400)))
      : t[o].classList.remove("active", n, "flash");
}
let _s = !1,
  Ls = null;
let Fs = null;
function Os(t, e) {
  if (!e) return void t.batterStrip.classList.remove("visible");
  const n = (function (t) {
      return t.order[t.currentIndex];
    })(e),
    s = n.position || "UT",
    o = e.currentIndex + 1,
    i = n.stats.avg > 0 ? n.stats.avg.toFixed(3).replace(/^0/, "") : ".000";
  ((t.batterStrip.innerHTML = `<span class="syb-batter-name">${n.name}</span>  <span class="syb-batter-stat">#${o} ${s} · ${i} AVG</span>`),
    t.batterStrip.classList.add("visible"));
}
const Ns = [
  "msg-hr",
  "msg-hit",
  "msg-out",
  "msg-walk",
  "msg-inning",
  "msg-strikeout",
  "msg-clutch",
  "pop",
  "swinging",
];
function zs(t, e, n, s) {
  (Fs && (clearTimeout(Fs), (Fs = null)),
    t.messageOverlay.classList.remove("visible", ...Ns),
    (t.messageOverlay.textContent = e),
    s && "default" !== s && t.messageOverlay.classList.add(`msg-${s}`),
    ("hr" !== s && "hit" !== s) ||
      (t.messageOverlay.classList.add("pop"),
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          t.messageOverlay.classList.remove("pop");
        });
      })),
    t.messageOverlay.classList.add("visible"),
    n > 0 &&
      (Fs = setTimeout(() => {
        (t.messageOverlay.classList.remove("visible", ...Ns), (Fs = null));
      }, n)));
}
let Ds = null;
function Hs(t, e) {
  e
    ? t.swingButton.classList.add("pulse")
    : t.swingButton.classList.remove("pulse");
}
const Us = ["timing-perfect", "timing-good", "timing-early", "timing-late"];
let Gs = null;
let Vs = null;
function qs(t, e) {
  (Vs && (clearTimeout(Vs), (Vs = null)),
    (t.statLine.textContent = e),
    t.statLine.classList.add("visible"),
    (Vs = setTimeout(() => {
      (t.statLine.classList.remove("visible"), (Vs = null));
    }, 1500)));
}
const js = ["flash-double", "flash-triple", "flash-big-inning"];
let Ws = null;
function Ks(t, e, n = 300) {
  (t.hitFlash.classList.remove("active", ...js),
    t.hitFlash.classList.add(`flash-${e}`),
    t.hitFlash.offsetWidth,
    t.hitFlash.classList.add("active"),
    setTimeout(() => t.hitFlash.classList.remove("active", ...js), n));
}
const Ys = {
  homeRun: [
    "Crushed it.",
    "See ya!",
    "Gone. Just gone.",
    "Outta here!",
    "Moonshot.",
  ],
  strikeout: ["Sit down!", "Paint.", "Too nasty.", "Next."],
  bigHit: ["Roped!", "Hard contact.", "Right on the barrel.", "Line drive!"],
  divingCatch: ["Not today.", "Robbed!", "Web gem!", "What a snag!"],
  rally: ["Here we go!", "Rally time!", "Keep it rolling!"],
  blownLead: ["That stings.", "Big trouble.", "Need an answer."],
  walkOff: ["Walk it off!", "Ballgame!", "That’s how you end it!"],
  walk: ["Take your base.", "Free pass."],
};
let $s = null;
function Xs(t, e, n = !1) {
  if (!n && Math.random() > 0.6) return;
  const s = Ys[e];
  if (!s || 0 === s.length) return;
  const o = s[Math.floor(Math.random() * s.length)];
  ($s && (clearTimeout($s), ($s = null)),
    t.barkToast.classList.remove("visible"),
    (t.barkToast.textContent = o),
    t.barkToast.offsetWidth,
    t.barkToast.classList.add("visible"),
    ($s = setTimeout(() => {
      (t.barkToast.classList.remove("visible"), ($s = null));
    }, 1800)));
}
function Zs(t) {
  if (!document.querySelector("style[data-ts-styles]")) {
    const t = document.createElement("style");
    ((t.dataset.tsStyles = "1"),
      (t.textContent =
        "\n  /* ── Overlay ── */\n  .ts-overlay {\n    position: absolute;\n    inset: 0;\n    background: linear-gradient(180deg,\n      rgba(10,10,26,.98) 0%,\n      rgba(20,12,8,.97) 40%,\n      rgba(30,15,5,.96) 70%,\n      rgba(191,87,0,.08) 100%);\n    backdrop-filter: blur(16px);\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    z-index: 210;\n    overflow-y: auto;\n    overflow-x: hidden;\n    padding: 28px 20px 40px;\n    transition: opacity .4s ease-out;\n    font-family: 'Oswald', 'Segoe UI', system-ui, sans-serif;\n    scrollbar-width: thin;\n    scrollbar-color: rgba(191,87,0,.3) transparent;\n  }\n  .ts-overlay::-webkit-scrollbar { width: 6px; }\n  .ts-overlay::-webkit-scrollbar-track { background: transparent; }\n  .ts-overlay::-webkit-scrollbar-thumb { background: rgba(191,87,0,.3); border-radius: 3px; }\n  .ts-overlay.hidden {\n    opacity: 0;\n    pointer-events: none;\n  }\n\n  /* ── Header ── */\n  .ts-header {\n    text-align: center;\n    margin-bottom: 20px;\n  }\n  .ts-title {\n    font-size: 40px;\n    font-weight: 800;\n    background: linear-gradient(135deg, #FFD700 0%, #BF5700 60%, #FF6B35 100%);\n    -webkit-background-clip: text;\n    -webkit-text-fill-color: transparent;\n    background-clip: text;\n    text-transform: uppercase;\n    letter-spacing: 2px;\n    line-height: 1.1;\n  }\n  .ts-subtitle {\n    color: rgba(255,255,255,.35);\n    font-size: 11px;\n    letter-spacing: 4px;\n    text-transform: uppercase;\n    margin-top: 6px;\n    font-family: 'Cormorant Garamond', Georgia, serif;\n    font-weight: 600;\n  }\n\n  /* ── Search bar ── */\n  .ts-search-wrap {\n    position: relative;\n    width: 100%;\n    max-width: 460px;\n    margin-bottom: 16px;\n  }\n  .ts-search-icon {\n    position: absolute;\n    left: 14px;\n    top: 50%;\n    transform: translateY(-50%);\n    color: rgba(255,255,255,.25);\n    font-size: 14px;\n    pointer-events: none;\n    transition: color .2s;\n  }\n  .ts-search-wrap:focus-within .ts-search-icon {\n    color: #FFD700;\n  }\n  .ts-search {\n    width: 100%;\n    padding: 12px 40px 12px 38px;\n    border: 2px solid rgba(191,87,0,.25);\n    border-radius: 10px;\n    background: rgba(10,10,26,.7);\n    color: #e0e0e0;\n    font-family: 'Oswald', sans-serif;\n    font-size: 14px;\n    outline: none;\n    transition: border-color .25s, box-shadow .25s;\n    box-sizing: border-box;\n  }\n  .ts-search:focus {\n    border-color: #FFD700;\n    box-shadow: 0 0 20px rgba(255,215,0,.12);\n  }\n  .ts-search::placeholder {\n    color: rgba(255,255,255,.2);\n    font-style: italic;\n  }\n  .ts-search-clear {\n    position: absolute;\n    right: 10px;\n    top: 50%;\n    transform: translateY(-50%);\n    width: 24px;\n    height: 24px;\n    border: none;\n    border-radius: 50%;\n    background: rgba(255,255,255,.08);\n    color: rgba(255,255,255,.4);\n    font-size: 14px;\n    cursor: pointer;\n    display: none;\n    align-items: center;\n    justify-content: center;\n    transition: background .2s, color .2s;\n    line-height: 1;\n    padding: 0;\n  }\n  .ts-search-clear.visible { display: flex; }\n  .ts-search-clear:hover {\n    background: rgba(191,87,0,.3);\n    color: #fff;\n  }\n\n  /* ── Match count ── */\n  .ts-match-count {\n    font-size: 11px;\n    color: rgba(255,255,255,.25);\n    letter-spacing: 2px;\n    text-transform: uppercase;\n    margin-bottom: 14px;\n    transition: color .2s;\n    font-family: 'JetBrains Mono', 'Courier New', monospace;\n  }\n  .ts-match-count.has-filter {\n    color: rgba(255,215,0,.5);\n  }\n\n  /* ── Conference tabs ── */\n  .ts-conf-tabs {\n    display: flex;\n    gap: 6px;\n    width: 100%;\n    max-width: 700px;\n    overflow-x: auto;\n    padding: 0 4px 12px;\n    margin-bottom: 8px;\n    scrollbar-width: none;\n    -ms-overflow-style: none;\n    scroll-behavior: smooth;\n    -webkit-overflow-scrolling: touch;\n  }\n  .ts-conf-tabs::-webkit-scrollbar { display: none; }\n  .ts-conf-tab {\n    flex-shrink: 0;\n    padding: 7px 16px;\n    border: 1.5px solid rgba(255,255,255,.08);\n    border-radius: 20px;\n    background: rgba(255,255,255,.03);\n    color: rgba(255,255,255,.45);\n    font-family: 'Oswald', sans-serif;\n    font-size: 11px;\n    font-weight: 500;\n    text-transform: uppercase;\n    letter-spacing: 1.5px;\n    cursor: pointer;\n    transition: all .2s;\n    white-space: nowrap;\n    user-select: none;\n    -webkit-user-select: none;\n  }\n  .ts-conf-tab:hover {\n    border-color: rgba(191,87,0,.4);\n    color: rgba(255,255,255,.7);\n    background: rgba(191,87,0,.08);\n  }\n  .ts-conf-tab.active {\n    border-color: #BF5700;\n    color: #FFD700;\n    background: rgba(191,87,0,.15);\n    box-shadow: 0 0 12px rgba(191,87,0,.2);\n  }\n\n  /* ── Grid ── */\n  .ts-grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));\n    gap: 12px;\n    width: 100%;\n    max-width: 700px;\n    margin-bottom: 24px;\n  }\n\n  /* ── Conference group header inside grid ── */\n  .ts-conf-header {\n    grid-column: 1 / -1;\n    display: flex;\n    align-items: center;\n    gap: 12px;\n    padding: 6px 0 2px;\n    margin-top: 8px;\n  }\n  .ts-conf-header:first-child { margin-top: 0; }\n  .ts-conf-header-label {\n    font-size: 11px;\n    font-weight: 600;\n    color: rgba(191,87,0,.7);\n    text-transform: uppercase;\n    letter-spacing: 3px;\n    white-space: nowrap;\n    font-family: 'Oswald', sans-serif;\n  }\n  .ts-conf-header-line {\n    flex: 1;\n    height: 1px;\n    background: linear-gradient(90deg, rgba(191,87,0,.25) 0%, transparent 100%);\n  }\n  .ts-conf-header-count {\n    font-size: 10px;\n    color: rgba(255,255,255,.2);\n    font-family: 'JetBrains Mono', monospace;\n  }\n\n  /* ── Team card ── */\n  .ts-card {\n    position: relative;\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    padding: 16px 10px 14px;\n    border: 2px solid rgba(255,255,255,.06);\n    border-radius: 12px;\n    background: linear-gradient(180deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.01) 100%);\n    cursor: pointer;\n    transition: all .25s cubic-bezier(.4,0,.2,1);\n    gap: 8px;\n    overflow: hidden;\n  }\n  .ts-card::before {\n    content: '';\n    position: absolute;\n    inset: 0;\n    border-radius: 12px;\n    opacity: 0;\n    transition: opacity .3s;\n    pointer-events: none;\n  }\n  .ts-card:hover {\n    border-color: rgba(255,215,0,.5);\n    transform: translateY(-3px) scale(1.03);\n    box-shadow: 0 8px 24px rgba(0,0,0,.3), 0 0 20px rgba(255,215,0,.08);\n  }\n  .ts-card:hover::before {\n    opacity: 1;\n  }\n  .ts-card:active {\n    transform: translateY(-1px) scale(1.01);\n    transition-duration: .1s;\n  }\n\n  /* ── Card color accent (top border glow via gradient stripe) ── */\n  .ts-card-accent {\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    height: 3px;\n    border-radius: 12px 12px 0 0;\n    opacity: 0.6;\n    transition: opacity .25s;\n  }\n  .ts-card:hover .ts-card-accent {\n    opacity: 1;\n  }\n\n  /* ── Logo ── */\n  .ts-logo-wrap {\n    width: 56px;\n    height: 56px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    border-radius: 50%;\n    background: rgba(255,255,255,.04);\n    transition: background .25s, box-shadow .25s;\n    flex-shrink: 0;\n  }\n  .ts-card:hover .ts-logo-wrap {\n    background: rgba(255,255,255,.08);\n    box-shadow: 0 0 16px rgba(255,215,0,.1);\n  }\n  .ts-logo {\n    width: 42px;\n    height: 42px;\n    object-fit: contain;\n  }\n  .ts-logo-placeholder {\n    width: 42px;\n    height: 42px;\n    border-radius: 50%;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    font-size: 15px;\n    font-weight: 700;\n    color: white;\n    text-transform: uppercase;\n    letter-spacing: 1px;\n  }\n\n  /* ── Card text ── */\n  .ts-team-name {\n    font-size: 12px;\n    font-weight: 600;\n    color: rgba(255,255,255,.85);\n    text-align: center;\n    line-height: 1.25;\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n    transition: color .2s;\n  }\n  .ts-card:hover .ts-team-name {\n    color: #FFD700;\n  }\n  .ts-team-conf {\n    font-size: 9px;\n    color: rgba(255,255,255,.25);\n    text-transform: uppercase;\n    letter-spacing: 1.5px;\n    font-family: 'JetBrains Mono', monospace;\n  }\n  .ts-team-abbr {\n    font-size: 9px;\n    color: rgba(255,255,255,.15);\n    font-family: 'JetBrains Mono', monospace;\n    letter-spacing: 2px;\n  }\n\n  /* ── Skip button ── */\n  .ts-skip {\n    font-family: 'Oswald', sans-serif;\n    padding: 12px 32px;\n    border: 1.5px solid rgba(255,255,255,.1);\n    border-radius: 10px;\n    background: transparent;\n    color: rgba(255,255,255,.35);\n    font-size: 13px;\n    cursor: pointer;\n    transition: all .25s;\n    text-transform: uppercase;\n    letter-spacing: 2px;\n  }\n  .ts-skip:hover {\n    color: rgba(255,255,255,.65);\n    border-color: rgba(255,255,255,.25);\n    background: rgba(255,255,255,.03);\n  }\n\n  /* ── States ── */\n  .ts-loading {\n    color: rgba(255,255,255,.3);\n    font-size: 14px;\n    margin: 40px 0;\n    letter-spacing: 2px;\n    text-transform: uppercase;\n  }\n  .ts-loading-dot {\n    display: inline-block;\n    animation: ts-dot-pulse 1.4s infinite ease-in-out both;\n  }\n  .ts-loading-dot:nth-child(2) { animation-delay: .16s; }\n  .ts-loading-dot:nth-child(3) { animation-delay: .32s; }\n\n  @keyframes ts-dot-pulse {\n    0%, 80%, 100% { opacity: .2; }\n    40% { opacity: 1; }\n  }\n\n  .ts-empty {\n    grid-column: 1 / -1;\n    color: rgba(255,255,255,.2);\n    font-size: 13px;\n    margin: 24px 0;\n    text-align: center;\n    letter-spacing: 1px;\n  }\n\n  /* ── Highlight match in search ── */\n  .ts-highlight {\n    color: #FFD700;\n    background: rgba(255,215,0,.1);\n    border-radius: 2px;\n    padding: 0 1px;\n  }\n\n  /* ── Entrance animation ── */\n  @keyframes ts-card-enter {\n    from {\n      opacity: 0;\n      transform: translateY(12px) scale(.95);\n    }\n    to {\n      opacity: 1;\n      transform: translateY(0) scale(1);\n    }\n  }\n\n  /* ── Responsive ── */\n  @media (max-width: 600px) {\n    .ts-overlay { padding: 20px 12px 32px; }\n    .ts-title { font-size: 30px; letter-spacing: 1px; }\n    .ts-grid {\n      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));\n      gap: 8px;\n    }\n    .ts-card { padding: 12px 8px 10px; }\n    .ts-logo-wrap { width: 44px; height: 44px; }\n    .ts-logo, .ts-logo-placeholder { width: 32px; height: 32px; font-size: 12px; }\n    .ts-team-name { font-size: 10px; }\n    .ts-conf-tab { padding: 6px 12px; font-size: 10px; }\n    .ts-search-wrap { max-width: 100%; }\n  }\n  @media (max-width: 400px) {\n    .ts-grid {\n      grid-template-columns: repeat(3, 1fr);\n      gap: 6px;\n    }\n    .ts-card { padding: 10px 6px 8px; gap: 6px; }\n    .ts-logo-wrap { width: 38px; height: 38px; }\n    .ts-logo, .ts-logo-placeholder { width: 28px; height: 28px; font-size: 11px; }\n    .ts-team-name { font-size: 9px; }\n  }\n"),
      document.head.appendChild(t));
  }
  const e = document.createElement("div");
  e.className = "ts-overlay hidden";
  const n = document.createElement("div");
  n.className = "ts-header";
  const s = document.createElement("div");
  ((s.className = "ts-title"),
    (s.textContent = t.title ?? "Pick Your Squad"),
    n.appendChild(s));
  const o = document.createElement("div");
  ((o.className = "ts-subtitle"),
    (o.textContent = t.subtitle ?? "Real College Baseball Rosters"),
    n.appendChild(o),
    e.appendChild(n));
  const i = document.createElement("div");
  i.className = "ts-search-wrap";
  const a = document.createElement("span");
  ((a.className = "ts-search-icon"),
    (a.innerHTML = "&#x1F50D;"),
    a.setAttribute("aria-hidden", "true"),
    i.appendChild(a));
  const r = document.createElement("input");
  ((r.className = "ts-search"),
    (r.type = "text"),
    (r.placeholder = "Search teams or conferences..."),
    r.setAttribute("autocomplete", "off"),
    r.setAttribute("spellcheck", "false"),
    i.appendChild(r));
  const l = document.createElement("button");
  ((l.className = "ts-search-clear"),
    (l.innerHTML = "&#x2715;"),
    (l.title = "Clear search"),
    l.addEventListener("click", () => {
      ((r.value = ""), l.classList.remove("visible"), T(), r.focus());
    }),
    i.appendChild(l),
    e.appendChild(i));
  const c = document.createElement("div");
  ((c.className = "ts-match-count"), e.appendChild(c));
  const h = document.createElement("div");
  ((h.className = "ts-conf-tabs"),
    h.setAttribute("role", "tablist"),
    e.appendChild(h));
  const u = document.createElement("div");
  ((u.className = "ts-grid"), e.appendChild(u));
  const d = document.createElement("button");
  ((d.className = "ts-skip"),
    (d.textContent = t.skipLabel ?? "Play Without Team"),
    d.addEventListener("click", () => {
      (M(), t.onSkip());
    }),
    e.appendChild(d));
  const p = document.createElement("div");
  ((p.className = "ts-loading"),
    (p.innerHTML =
      'Loading Teams<span class="ts-loading-dot">.</span><span class="ts-loading-dot">.</span><span class="ts-loading-dot">.</span>'),
    t.container.appendChild(e));
  let m = [],
    f = "";
  function g() {
    h.querySelectorAll(".ts-conf-tab").forEach((t) => {
      const e = t,
        n = "" === f ? !e.dataset.conf : e.dataset.conf === f;
      e.classList.toggle("active", n);
    });
  }
  function b(t) {
    u.innerHTML = "";
    const e = r.value.toLowerCase().trim(),
      n = !!e || !!f;
    if (
      ((c.textContent = n
        ? `${t.length} team${1 !== t.length ? "s" : ""} found`
        : `${t.length} teams available`),
      c.classList.toggle("has-filter", n),
      0 === t.length)
    ) {
      const t = document.createElement("div");
      return (
        (t.className = "ts-empty"),
        (t.textContent = e
          ? `No teams matching "${r.value.trim()}"`
          : "No teams found"),
        void u.appendChild(t)
      );
    }
    const s = (function (t) {
        const e = new Map();
        for (const n of t) {
          const t = n.conference || "Independent";
          (e.has(t) || e.set(t, []), e.get(t).push(n));
        }
        return Array.from(e.entries())
          .sort(([t], [e]) => t.localeCompare(e))
          .map(([t, e]) => ({ conference: t, teams: e }));
      })(t),
      o = s.length > 1 && !f;
    let i = 0;
    for (const a of s) {
      if (o) {
        const t = document.createElement("div");
        t.className = "ts-conf-header";
        const e = document.createElement("span");
        ((e.className = "ts-conf-header-label"),
          (e.textContent = a.conference));
        const n = document.createElement("div");
        n.className = "ts-conf-header-line";
        const s = document.createElement("span");
        ((s.className = "ts-conf-header-count"),
          (s.textContent = String(a.teams.length)),
          t.appendChild(e),
          t.appendChild(n),
          t.appendChild(s),
          u.appendChild(t));
      }
      for (const t of a.teams) {
        const n = y(t, e, i);
        (u.appendChild(n), i++);
      }
    }
  }
  function y(e, n, s) {
    const o = document.createElement("div");
    o.className = "ts-card";
    const i = Math.min(25 * s, 2e3);
    ((o.style.animation = `ts-card-enter .35s ${i}ms cubic-bezier(.4,0,.2,1) both`),
      o.style.setProperty("--team-color", e.primaryColor),
      o.querySelector("::before"),
      (o.style.cssText += `; --team-color: ${e.primaryColor};`),
      o.addEventListener("mouseenter", () => {
        o.style.background = `linear-gradient(180deg, ${A(e.primaryColor, 0.1)} 0%, rgba(255,255,255,.02) 100%)`;
      }),
      o.addEventListener("mouseleave", () => {
        o.style.background =
          "linear-gradient(180deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.01) 100%)";
      }));
    const a = document.createElement("div");
    ((a.className = "ts-card-accent"),
      (a.style.background = `linear-gradient(90deg, ${e.primaryColor}, ${e.secondaryColor})`),
      o.appendChild(a));
    const r = document.createElement("div");
    if (((r.className = "ts-logo-wrap"), e.logoUrl)) {
      const t = document.createElement("img");
      ((t.className = "ts-logo"),
        (t.src = e.logoUrl),
        (t.alt = e.name),
        (t.loading = "lazy"),
        (t.onerror = () => {
          t.replaceWith(w(e));
        }),
        r.appendChild(t));
    } else r.appendChild(w(e));
    o.appendChild(r);
    const l = document.createElement("div");
    if (
      ((l.className = "ts-team-name"),
      n ? (l.innerHTML = x(e.name, n)) : (l.textContent = e.name),
      o.appendChild(l),
      e.conference)
    ) {
      const t = document.createElement("div");
      ((t.className = "ts-team-conf"),
        n && e.conference.toLowerCase().includes(n)
          ? (t.innerHTML = x(e.conference, n))
          : (t.textContent = e.conference),
        o.appendChild(t));
    }
    return (
      o.addEventListener("click", () => {
        ((o.style.borderColor = "#FFD700"),
          (o.style.boxShadow = `0 0 30px ${A(e.primaryColor, 0.4)}, 0 0 60px rgba(255,215,0,.15)`),
          (o.style.transform = "scale(1.06)"),
          setTimeout(() => {
            (M(), t.onSelect(e));
          }, 150));
      }),
      o
    );
  }
  function w(t) {
    const e = document.createElement("div");
    return (
      (e.className = "ts-logo-placeholder"),
      (e.style.background = `linear-gradient(135deg, ${t.primaryColor}, ${t.secondaryColor || t.primaryColor})`),
      (e.textContent = t.abbreviation.slice(0, 3) || t.name.charAt(0)),
      e
    );
  }
  function x(t, e) {
    if (!e) return v(t);
    const n = t.toLowerCase().indexOf(e);
    if (-1 === n) return v(t);
    const s = t.slice(0, n),
      o = t.slice(n, n + e.length),
      i = t.slice(n + e.length);
    return v(s) + '<span class="ts-highlight">' + v(o) + "</span>" + v(i);
  }
  function v(t) {
    return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function A(t, e) {
    const n = t.replace("#", "");
    return `rgba(${parseInt(n.substring(0, 2), 16) || 0},${parseInt(n.substring(2, 4), 16) || 0},${parseInt(n.substring(4, 6), 16) || 0},${e})`;
  }
  function T() {
    const t = r.value.toLowerCase().trim(),
      e = f;
    l.classList.toggle("visible", r.value.length > 0);
    let n = m;
    (e && (n = n.filter((t) => t.conference === e)),
      t &&
        (n = n.filter(
          (e) =>
            e.name.toLowerCase().includes(t) ||
            e.abbreviation.toLowerCase().includes(t) ||
            e.conference.toLowerCase().includes(t),
        )),
      b(n));
  }
  async function S() {
    ((u.innerHTML = ""),
      u.appendChild(p),
      (c.textContent = ""),
      (m = await (async function () {
        if (os.entry && Date.now() - os.entry.ts < ss) return os.entry.data;
        try {
          const t = await fetch(`${ns}/teams/all`, {
            signal: AbortSignal.timeout(5e3),
          });
          if (!t.ok) throw new Error(`HTTP ${t.status}`);
          const e = await t.json(),
            n = e.teams ?? e ?? [];
          if (!Array.isArray(n))
            throw new Error("Unexpected team list response shape");
          const s = n.map((t) => ({
            id: String(t.id ?? t.teamId ?? t.slug),
            name: t.name ?? t.displayName ?? "",
            abbreviation: t.abbreviation ?? t.abbr ?? "",
            conference: t.conference ?? t.conf ?? "",
            logoUrl: t.logoUrl ?? t.logo ?? "",
            primaryColor: t.primaryColor ?? t.color ?? "#BF5700",
            secondaryColor: t.secondaryColor ?? t.altColor ?? "#FFD700",
          }));
          return ((os.entry = { data: s, ts: Date.now() }), s);
        } catch (t) {
          return ds;
        }
      })()));
    (!(function (t) {
      h.innerHTML = "";
      const e = document.createElement("button");
      ((e.className = "ts-conf-tab active"),
        (e.textContent = "All"),
        e.setAttribute("role", "tab"),
        e.addEventListener("click", () => {
          ((f = ""), g(), T());
        }),
        h.appendChild(e));
      for (const n of t) {
        const t = document.createElement("button");
        ((t.className = "ts-conf-tab"),
          (t.textContent = n),
          t.setAttribute("role", "tab"),
          (t.dataset.conf = n),
          t.addEventListener("click", () => {
            ((f = n),
              g(),
              T(),
              t.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center",
              }));
          }),
          h.appendChild(t));
      }
    })(
      (function (t) {
        const e = new Set(t.map((t) => t.conference).filter(Boolean));
        return Array.from(e).sort();
      })(m),
    ),
      b(m));
  }
  function M() {
    e.classList.add("hidden");
  }
  return (
    r.addEventListener("input", T),
    {
      show: function () {
        (e.classList.remove("hidden"),
          (r.value = ""),
          (f = ""),
          l.classList.remove("visible"),
          S(),
          setTimeout(() => r.focus(), 150));
      },
      hide: M,
      destroy: function () {
        e.remove();
      },
    }
  );
}
const Qs = "https://blazecraft.app/api/mini-games/leaderboard",
  Js = "sandlot-sluggers";
function to() {
  try {
    const t = localStorage.getItem("bsi-career");
    if (t) return JSON.parse(t);
  } catch (t) {
    SyntaxError;
  }
  return {
    games: 0,
    totalRuns: 0,
    totalHits: 0,
    totalHRs: 0,
    totalABs: 0,
    bestEV: 0,
    bestDistance: 0,
  };
}
function eo(t) {
  for (; t.firstChild; ) t.removeChild(t.firstChild);
}
function no(t, e, n) {
  const s = document.createElement(t);
  return (e && (s.className = e), n && (s.textContent = n), s);
}
const so = (t) => document.getElementById(t),
  oo = so("loading-screen"),
  io = so("loading-fill"),
  ao = so("loading-stage"),
  ro = so("mode-select"),
  lo = so("game-over"),
  co = so("go-stats"),
  ho = so("go-box-score"),
  uo = so("go-leaderboard"),
  po = so("go-restart"),
  mo = so("go-menu"),
  fo = so("go-share"),
  go = so("team-select-container"),
  bo = so("sound-toggle"),
  yo = so("go-team-logo"),
  wo = so("go-team-name"),
  xo = so("name-prompt"),
  vo = so("name-input"),
  Ao = so("name-submit"),
  To = so("go-rating"),
  So = so("go-rating-fill"),
  Mo = so("go-rating-value"),
  Co = so("go-lb-card"),
  ko = so("menu-btn"),
  Ro = so("pause-menu"),
  Po = so("pause-resume"),
  Eo = so("pause-quit"),
  Bo = so("diff-row"),
  Io = so("career-stats"),
  _o = so("career-grid");
function Lo(t, e) {
  (io && (io.style.width = `${Math.min(t, 100)}%`), ao && (ao.textContent = e));
}
function Fo() {
  (Ro?.classList.remove("active"), rii());
}
("1" === localStorage.getItem("bsi_arcade_muted") &&
  bo &&
  ((bo.textContent = "🔇"), bo.classList.add("muted")),
  bo?.addEventListener("click", () => {
    if (!Oo) return;
    const t = Oo.toggleMute();
    ((bo.textContent = t ? "🔇" : "🔊"),
      bo.classList.toggle("muted", t),
      localStorage.setItem("bsi_arcade_muted", t ? "1" : "0"));
  }),
  ko?.addEventListener("click", () => {
    (Oo && Oo.stop(),
      (Ho = null),
      (Uo = null),
      (teamModeOpponent = null),
      (teamModeOpponentRoster = null),
      (Go = null),
      ko.classList.remove("visible"),
      Vo());
  }),
  Po?.addEventListener("click", Fo),
  Eo?.addEventListener("click", () => {
    (Ro?.classList.remove("active"),
      Oo && (Oo.isPaused() && Oo.resume(), Oo.stop()),
      (Ho = null),
      (Uo = null),
      (teamModeOpponent = null),
      (teamModeOpponentRoster = null),
      (Go = null),
      ko?.classList.remove("visible"),
      Vo());
  }),
  Bo?.querySelectorAll(".diff-btn").forEach((t) => {
    t.addEventListener("click", () => {
      (Bo.querySelectorAll(".diff-btn").forEach((t) =>
        t.classList.remove("active"),
      ),
        t.classList.add("active"),
        (Do = t.dataset.diff));
    });
  }));
let Oo = null,
  No = null,
  zo = "quickPlay",
  Do = "medium",
  Ho = null,
  Uo = null,
  Go = null,
  teamModeOpponent = null,
  teamModeOpponentRoster = null,
  currentSessionPhase = SESSION_PHASES.BOOT,
  currentSessionSeed = createSessionSeed(),
  gameStartedAtMs = 0;
function tii(t) {
  switch (t) {
    case "ready":
      return SESSION_PHASES.PITCH_READY;
    case "pitching":
      return SESSION_PHASES.PITCH_FLIGHT;
    case "fielding":
      return SESSION_PHASES.BALL_IN_PLAY;
    case "result":
      return SESSION_PHASES.PLATE_RESULT;
    case "gameOver":
      return SESSION_PHASES.GAME_OVER;
    default:
      return currentSessionPhase;
  }
}
function nii(t) {
  currentSessionPhase = t;
}
function sii() {
  return !!go?.querySelector(".ts-overlay:not(.hidden)");
}
function oii() {
  return (
    !ro.classList.contains("hidden") ||
    !lo.classList.contains("hidden") ||
    !xo.classList.contains("hidden") ||
    sii() ||
    !!Ro?.classList.contains("active")
  );
}
function aii(t) {
  (Oo && !Oo.isPaused() && Oo.pause(), nii(t));
}
function rii() {
  (Oo && Oo.isPaused() && Oo.resume(), Oo && nii(tii(Oo.getPhase())));
}
function Vo() {
  (lo.classList.add("hidden"),
    ko?.classList.remove("visible"),
    ro.classList.add("hidden"));
  const t = ro.querySelectorAll(
    ".mode-title, .mode-sub, .mode-grid .mode-btn, .mode-btn-featured",
  );
  (t.forEach((t) => {
    t.style.animation = "none";
  }),
    ro.offsetHeight,
    t.forEach((t) => {
      t.style.animation = "";
    }),
    ro.classList.remove("hidden"),
    nii(SESSION_PHASES.HOME),
    (function () {
      if (!Io || !_o) return;
      const t = to();
      if (0 === t.games) return void (Io.style.display = "none");
      Io.style.display = "";
      const e = t.totalABs > 0 ? (t.totalHits / t.totalABs).toFixed(3) : ".000",
        n = [
          { label: "Games", value: String(t.games) },
          { label: "Home Runs", value: String(t.totalHRs) },
          { label: "Career AVG", value: e },
        ];
      eo(_o);
      for (const s of n) {
        const t = no("div", void 0);
        t.style.cssText = "text-align:center";
        const e = no("div", void 0, s.value);
        e.style.cssText =
          "font-size:18px;font-weight:700;color:#FFD700;font-family:Oswald,sans-serif";
        const n = no("div", void 0, s.label);
        ((n.style.cssText =
          "font-size:9px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1px"),
          t.appendChild(e),
          t.appendChild(n),
          _o.appendChild(t));
      }
    })());
}
function qo() {
  ro.classList.add("hidden");
}
ro.querySelectorAll(".mode-btn").forEach((t) => {
  t.addEventListener("click", () => {
    const e = t.dataset.mode;
    e &&
      ("teamMode" === e
        ? (qo(), Wo())
        : ((teamModeOpponent = null),
          (teamModeOpponentRoster = null),
          qo(),
          (Ho = null),
          (Uo = null),
          Qo(e)));
  });
});
let jo = null;
function WoFinalize() {
  (oo.classList.add("hidden"), Qo("teamMode"));
}
function Wot() {
  (jo && jo.destroy(),
    (jo = Zs({
      container: go,
      title: "Pick The Opponent",
      subtitle: "Choose The Staff You'll Face",
      skipLabel: "Use House Pitcher",
      onSelect: async (t) => {
        ((teamModeOpponent = t),
          jo?.hide(),
          oo.classList.remove("hidden"),
          oo.classList.add("loading-screen-minimal"));
        try {
          teamModeOpponentRoster = await as(t.id);
        } catch (e) {
          teamModeOpponentRoster = createFallbackTeamProfile({
            id: "house",
            name: "House Pitchers",
            abbreviation: "HSE",
            conference: "Sandlot League",
            primaryColor: "#243447",
            secondaryColor: "#9FB3C8",
          });
        }
        WoFinalize();
      },
      onSkip: () => {
        ((teamModeOpponentRoster = createFallbackTeamProfile({
          id: "house",
          name: "House Pitchers",
          abbreviation: "HSE",
          conference: "Sandlot League",
          primaryColor: "#243447",
          secondaryColor: "#9FB3C8",
        })),
          (teamModeOpponent = teamModeOpponentRoster.team),
          jo?.hide(),
          WoFinalize());
      },
    })),
    jo.show(),
    nii(SESSION_PHASES.TEAM_SELECT));
}
function Wo() {
  (jo && jo.destroy(),
    (jo = Zs({
      container: go,
      title: "Pick Your Squad",
      subtitle: "Real College Baseball Rosters",
      skipLabel: "Use Sandlot Squad",
      onSelect: async (t) => {
        ((Ho = t),
          jo?.hide(),
          oo.classList.remove("hidden"),
          oo.classList.add("loading-screen-minimal"));
        try {
          Uo = await as(t.id);
        } catch (e) {
          Uo = createFallbackTeamProfile();
          Ho = Uo.team;
        }
        (oo.classList.add("hidden"), Wot());
      },
      onSkip: () => {
        ((Uo = createFallbackTeamProfile()),
          (Ho = Uo.team),
          jo?.hide(),
          Wot());
      },
    })),
    jo.show(),
    nii(SESSION_PHASES.TEAM_SELECT));
}
function Ko(t) {
  if ("quickPlay" === t.mode || "teamMode" === t.mode) {
    return "win" === t.result
      ? { text: "TARGET CLEARED", color: "#FFD700" }
      : "loss" === t.result
        ? { text: "SHORT OF TARGET", color: "#ff4444" }
        : { text: "FINAL", color: "rgba(255,255,255,.7)" };
  }
  if ("hrDerby" === t.mode)
    return t.stats.homeRuns >= 5
      ? { text: "SLUGGER!", color: "#FFD700" }
      : t.stats.homeRuns >= 2
        ? { text: "FINAL", color: "#FFD700" }
        : { text: "GAME OVER", color: "#ff4444" };
  const e = t.stats.atBats > 0 ? t.stats.hits / t.stats.atBats : 0;
  return t.stats.runs >= 8
    ? { text: "BLOWOUT!", color: "#FFD700" }
    : t.stats.runs >= 4
      ? { text: "GREAT GAME!", color: "#33dd55" }
      : e >= 0.3
        ? { text: "FINAL", color: "#FFD700" }
        : 0 === t.stats.runs
          ? { text: "SHUTOUT", color: "#ff4444" }
          : { text: "FINAL", color: "rgba(255,255,255,.7)" };
}
function Zi(t, e) {
  (eo(t),
    e.forEach((e) => {
      const n = no("div", e.highlight ? "go-stat highlight" : "go-stat"),
        s = no("div", "go-stat-val", "0");
      (n.appendChild(s),
        n.appendChild(no("div", "go-stat-label", e.label)),
        t.appendChild(n));
      const o = "number" == typeof e.value ? e.value : parseFloat(e.value),
        i = "string" == typeof e.value && e.value.includes(".");
      if (!isNaN(o) && o > 0) {
        const t = 800,
          n = performance.now(),
          a = (r) => {
            const l = Math.min((r - n) / t, 1),
              c = 1 - Math.pow(1 - l, 3),
              h = o * c;
            ((s.textContent = i ? h.toFixed(3) : String(Math.round(h))),
              l < 1
                ? requestAnimationFrame(a)
                : (s.textContent = String(e.value)));
          };
        setTimeout(() => requestAnimationFrame(a), 300);
      } else s.textContent = String(e.value);
    }));
}
function Ji(t, e) {
  (eo(t), t.appendChild(no("div", "bs-title", `${e.roster.team.name} Box Score`)));
  const n = document.createElement("table"),
    s = document.createElement("thead"),
    o = document.createElement("tr");
  for (const m of ["Player", "AB", "H", "HR", "RBI", "K", "BB", "AVG"]) {
    const t = document.createElement("th");
    ((t.textContent = m), o.appendChild(t));
  }
  (s.appendChild(o), n.appendChild(s));
  const i = document.createElement("tbody"),
    a = e.boxScores.map((t) => ({
      name: t.player.name,
      position: t.player.position,
      ab: t.atBats,
      h: t.hits,
      hr: t.homeRuns,
      rbi: t.rbi,
      k: t.strikeouts,
      bb: t.walks,
      avg: t.atBats > 0 ? (t.hits / t.atBats).toFixed(3) : ".000",
    }));
  let r = 0,
    l = -1;
  for (let t = 0; t < a.length; t++) {
    const e = 100 * a[t].rbi + 50 * a[t].hr + 10 * a[t].h;
    e > l && ((l = e), (r = t));
  }
  const c = Math.max(...a.map((t) => t.h), 1),
    h = Math.max(...a.map((t) => t.rbi), 1);
  for (let t = 0; t < a.length; t++) {
    const e = a[t],
      n = document.createElement("tr");
    t === r && l > 0 && (n.className = "mvp-row");
    const s = document.createElement("td");
    ((s.textContent = `${e.name} ${e.position}`), n.appendChild(s));
    const o = document.createElement("td");
    ((o.textContent = String(e.ab)), n.appendChild(o));
    const i = document.createElement("td");
    ((i.textContent = String(e.h)),
      e.h === c && e.h > 0
        ? (i.className = "heat-high")
        : e.h > 0 && (i.className = "heat-med"),
      n.appendChild(i));
    const a = document.createElement("td");
    ((a.textContent = String(e.hr)),
      e.hr > 0 && (a.className = "heat-hr"),
      n.appendChild(a));
    const u = document.createElement("td");
    ((u.textContent = String(e.rbi)),
      e.rbi === h && e.rbi > 0
        ? (u.className = "heat-high")
        : e.rbi > 0 && (u.className = "heat-med"),
      n.appendChild(u));
    const d = document.createElement("td");
    ((d.textContent = String(e.k)),
      0 === e.k && (d.className = "heat-low"),
      n.appendChild(d));
    const p = document.createElement("td");
    ((p.textContent = String(e.bb)),
      0 === e.bb && (p.className = "heat-low"),
      n.appendChild(p));
    const m = document.createElement("td");
    m.textContent = e.avg;
    const f = parseFloat(e.avg);
    (f >= 0.4
      ? (m.className = "heat-hr")
      : f >= 0.3
        ? (m.className = "heat-high")
        : f >= 0.2
          ? (m.className = "heat-med")
          : e.ab > 0 && (m.className = "heat-low"),
      n.appendChild(m),
      i.appendChild(n));
  }
  const u = e.boxScores.reduce(
      (t, e) => ({
        ab: t.ab + e.atBats,
        h: t.h + e.hits,
        hr: t.hr + e.homeRuns,
        rbi: t.rbi + e.rbi,
        k: t.k + e.strikeouts,
        bb: t.bb + e.walks,
      }),
      { ab: 0, h: 0, hr: 0, rbi: 0, k: 0, bb: 0 },
    ),
    d = document.createElement("tr"),
    p = document.createElement("td");
  ((p.textContent = "TOTAL"), d.appendChild(p));
  for (const t of [
    u.ab,
    u.h,
    u.hr,
    u.rbi,
    u.k,
    u.bb,
    u.ab > 0 ? (u.h / u.ab).toFixed(3) : ".000",
  ]) {
    const e = document.createElement("td");
    ((e.textContent = String(t)), d.appendChild(e));
  }
  (i.appendChild(d), n.appendChild(i), t.appendChild(n));
}
function ta() {
  const t = new Date(),
    e = t.toISOString().slice(0, 10),
    n = new Date(t.getTime() - 864e5).toISOString().slice(0, 10);
  try {
    const t = JSON.parse(localStorage.getItem("bsi-daily-streak") ?? "{}"),
      s =
        t.lastPlayed === e
          ? Math.max(1, Number(t.streak ?? 1))
          : t.lastPlayed === n
            ? Math.max(1, Number(t.streak ?? 0) + 1)
            : 1;
    return (
      localStorage.setItem(
        "bsi-daily-streak",
        JSON.stringify({ lastPlayed: e, streak: s }),
      ),
      s
    );
  } catch (s) {
    return 1;
  }
}
function ea(t) {
  try {
    localStorage.setItem("bsi-career", JSON.stringify(t));
  } catch (e) {}
}
async function na(t, e, n) {
  try {
    const s = localStorage.getItem("bsi-player-name") || "Anonymous",
      o = await fetch(`${Qs}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: Js,
          playerName: s,
          score: t,
          metadata: e,
        }),
      });
    if (!o.ok) return !1;
    try {
      const t =
        localStorage.getItem("bsi-device-id") ??
        `device-${Math.random().toString(36).slice(2, 10)}`;
      (localStorage.setItem("bsi-device-id", t),
        await fetch(`${Qs.replace("/leaderboard", "")}/economy/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId: t }),
        }).catch(() => null),
        await fetch(`${Qs.replace("/leaderboard", "")}/economy/earn`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId: t,
            unitsKilled: 0,
            buildingsDestroyed: 0,
            resourcesGathered: Math.min(
              5e4,
              500 * Math.max(1, Math.floor(n / 5)),
            ),
            matchDurationSec: Math.max(0, e.durationSeconds ?? 0),
            victory: "win" === e.result,
          }),
        }).catch(() => null));
    } catch (i) {}
    return !0;
  } catch (s) {
    return !1;
  }
}
async function sa(t = 10, e = null, n = null) {
  try {
    const s = new URL(`${Qs}/${Js}`);
    (s.searchParams.set("limit", String(t)),
      e && s.searchParams.set("mode", e),
      n && s.searchParams.set("difficulty", n));
    const o = await fetch(s.toString());
    if (!o.ok) return [];
    const i = await o.json();
    return i.entries ?? i ?? [];
  } catch (s) {
    return [];
  }
}
function oa(t, e, n) {
  if ((eo(t), 0 === e.length))
    return void (Co && (Co.style.display = "none"));
  (t.appendChild(no("div", "go-lb-title", "Leaderboard")),
    e.forEach((e, s) => {
      const o = no("div", "go-lb-row" + (e.score === n ? " you" : ""));
      (o.appendChild(
        no("span", void 0, `#${s + 1} ${e.player_name ?? e.playerName}`),
      ),
        o.appendChild(no("span", void 0, String(e.score))),
        t.appendChild(o));
    }),
    Co && (Co.style.display = "block"));
}
function Yo(t) {
  (aii(SESSION_PHASES.GAME_OVER), ko?.classList.remove("visible"));
  const e = Ko(t),
    n = lo.querySelector(".go-title");
  n &&
    ((n.textContent = e.text),
      (n.style.color = e.color),
      (n.style.textShadow =
        "#FFD700" === e.color || "#33dd55" === e.color
          ? `0 0 40px ${e.color}33`
          : "0 0 40px rgba(255,68,68,.2)"));
  const s = [];
  if ("hrDerby" === t.mode)
    s.push(
      {
        label: "Home Runs",
        value: t.stats.homeRuns,
        highlight: t.stats.homeRuns >= 3,
      },
      {
        label: "Best Streak",
        value: t.stats.longestStreak,
        highlight: t.stats.longestStreak >= 3,
      },
      { label: "Outs", value: t.stats.derbyOuts },
      { label: "Pitches", value: t.stats.pitchCount },
    );
  else {
    const e =
      t.stats.atBats > 0 ? (t.stats.hits / t.stats.atBats).toFixed(3) : ".000";
    (s.push(
      { label: "Runs", value: t.stats.runs, highlight: t.stats.runs >= 4 },
      { label: "Hits", value: t.stats.hits, highlight: t.stats.hits >= 4 },
      {
        label: "Home Runs",
        value: t.stats.homeRuns,
        highlight: t.stats.homeRuns >= 2,
      },
      { label: "Batting Avg", value: e, highlight: parseFloat(e) >= 0.3 },
    ),
      oi > 0 &&
        s.push({ label: "Best EV", value: `${oi}`, highlight: oi >= 105 }),
      ii > 0 &&
        s.push({ label: "Longest Hit", value: `${ii}`, highlight: ii >= 400 }));
  }
  if (
    (Zi(co, s),
    "hrDerby" !== t.mode && To && So && Mo)
  ) {
    To.style.display = "block";
    const e = t.stats.atBats > 0 ? t.stats.hits / t.stats.atBats : 0,
      n = 100 * Math.min(e / 0.5, 1);
    let s = "#ff4444",
      o = "COLD";
    (e >= 0.4
      ? ((s = "#FFD700"), (o = "ELITE"))
      : e >= 0.3
        ? ((s = "#33dd55"), (o = "GREAT"))
        : e >= 0.25
          ? ((s = "#BF5700"), (o = "SOLID"))
          : e >= 0.2 && ((s = "#ff8c00"), (o = "FAIR")),
      (So.style.background = `linear-gradient(90deg, ${s}88, ${s})`),
      (Mo.textContent = o),
      (Mo.style.color = s),
      (So.style.width = "0%"),
      setTimeout(() => {
        So.style.width = `${n}%`;
      }, 400));
  } else To && (To.style.display = "none");
  (Ho && yo && wo
    ? ((yo.src = Ho.logoUrl),
      (yo.style.display = "block"),
      (wo.textContent = Ho.name),
      (wo.style.display = "block"))
    : (yo && (yo.style.display = "none"), wo && (wo.style.display = "none")));
  "teamMode" === t.mode && Go
    ? (Ji(ho, Go), (ho.style.display = "block"))
    : (ho.style.display = "none");
  const o = computeRankedScore(t),
    i = `bsi-best-${t.mode}-${t.difficulty ?? "medium"}`,
    a = parseInt(localStorage.getItem(i) ?? "0", 10),
    r = o > a && o > 0,
    l = lo.querySelector(".go-best-banner");
  (r && localStorage.setItem(i, String(o)),
    l &&
      (r
        ? ((l.textContent = "NEW PERSONAL BEST!"),
          (l.style.display = "block"),
          (l.style.color = "#ffd700"),
          (l.style.textShadow = "0 0 16px rgba(255,215,0,.4)"),
          (l.style.fontSize = "14px"))
        : a > 0
          ? ((l.textContent = `Best: ${a}`),
            (l.style.display = "block"),
            (l.style.color = "rgba(255,255,255,0.3)"),
            (l.style.textShadow = "none"),
            (l.style.fontSize = "12px"))
          : (l.style.display = "none")));
  const c = ta(),
    h = computeCoinReward({
      finalScore: o,
      win: "win" === t.result,
      currentDailyStreak: c,
      mode: t.mode,
    }),
    u = Math.max(
      1,
      Math.round((performance.now() - Math.max(gameStartedAtMs, 0)) / 1e3),
    ),
    d = {
      ...buildLeaderboardMetadata(t, {
        durationSeconds: u,
        coinsEarned: h,
      }),
      runs: t.stats.runs,
      hits: t.stats.hits,
      homeRuns: t.stats.homeRuns,
      innings: t.inning,
      teamName: Ho?.name ?? null,
      opponentTeamName: teamModeOpponent?.name ?? null,
    },
    p = to();
  ((p.games += 1),
    (p.totalRuns += t.stats.runs),
    (p.totalHits += t.stats.hits),
    (p.totalHRs += t.stats.homeRuns),
    (p.totalABs += t.stats.atBats),
    oi > p.bestEV && (p.bestEV = oi),
    ii > p.bestDistance && (p.bestDistance = ii),
    ea(p));
  if ("practice" !== t.mode)
    void na(o, d, h).finally(() => {
      sa(10, d.mode, d.difficulty).then((t) => {
        oa(uo, t, o);
      });
    });
  else (eo(uo), Co && (Co.style.display = "none"));
  ((lo.scrollTop = 0), lo.classList.remove("hidden"));
}
async function $o(t) {
  const e = await (function (t) {
    return new Promise((e, n) => {
      const s = 600,
        o = 340,
        i = document.createElement("canvas");
      ((i.width = s), (i.height = o));
      const a = i.getContext("2d");
      if (!a) return void n(new Error("No 2d context"));
      const r = Ho?.name ?? "Sandlot Sluggers",
        l = Ho?.primaryColor ?? "#BF5700",
        c = "hrDerby" === t.mode,
        h = Ko(t);
      ((a.fillStyle = "#0a0a1a"),
        a.fillRect(0, 0, s, o),
        a.save(),
        (a.globalAlpha = 0.04),
        (a.strokeStyle = "#FFD700"),
        (a.lineWidth = 40));
      for (let t = -o; t < 940; t += 80)
        (a.beginPath(), a.moveTo(t, 0), a.lineTo(t + o, o), a.stroke());
      a.restore();
      const u = a.createLinearGradient(0, 0, s, 0);
      (u.addColorStop(0, "#BF5700"),
        u.addColorStop(1, "#FFD700"),
        (a.fillStyle = u),
        a.fillRect(0, 0, s, 4),
        (a.fillStyle = l),
        a.beginPath(),
        a.arc(30, 36, 10, 0, 2 * Math.PI),
        a.fill(),
        (a.fillStyle = "#e0e0e0"),
        (a.font = "600 22px Oswald, sans-serif"),
        (a.textAlign = "left"),
        (a.textBaseline = "middle"),
        a.fillText(r, 50, 36),
        (a.fillStyle = h.color),
        (a.font = "700 26px Oswald, sans-serif"),
        (a.textAlign = "right"),
        a.fillText(h.text, 576, 36),
        (a.fillStyle = "rgba(255,255,255,0.06)"),
        a.fillRect(24, 58, 552, 1));
      const d =
          t.stats.atBats > 0
            ? (t.stats.hits / t.stats.atBats).toFixed(3)
            : ".000",
        p = c
          ? [
              {
                label: "HOME RUNS",
                value: String(t.stats.homeRuns),
                accent: !0,
              },
              { label: "BEST STREAK", value: String(t.stats.longestStreak) },
              { label: "OUTS", value: String(t.stats.derbyOuts) },
              { label: "PITCHES", value: String(t.stats.pitchCount) },
            ]
          : [
              { label: "RUNS", value: String(t.stats.runs), accent: !0 },
              { label: "HITS", value: String(t.stats.hits) },
              { label: "HOME RUNS", value: String(t.stats.homeRuns) },
              { label: "AVG", value: d },
            ],
        m = 552 / p.length;
      for (let t = 0; t < p.length; t++) {
        const e = p[t],
          n = 24 + m * t + m / 2;
        ((a.fillStyle = e.accent ? "#FFD700" : "#e0e0e0"),
          (a.font = "700 42px Oswald, sans-serif"),
          (a.textAlign = "center"),
          (a.textBaseline = "middle"),
          a.fillText(e.value, n, 106),
          (a.fillStyle = "rgba(255,255,255,0.35)"),
          (a.font = "400 11px Oswald, sans-serif"),
          (a.letterSpacing = "1.5px"),
          a.fillText(e.label, n, 140));
      }
      if (!c) {
        const e = 168;
        ((a.fillStyle = "rgba(255,255,255,0.06)"), a.fillRect(24, e, 552, 1));
        const n = t.inning - 1,
          s = 1 === n ? "inning" : "innings";
        ((a.fillStyle = "rgba(255,255,255,0.3)"),
          (a.font = "400 13px Oswald, sans-serif"),
          (a.textAlign = "center"),
          a.fillText(`${n} ${s} played`, 300, e + 20));
      }
      const f =
        {
          quickPlay: "QUICK PLAY",
          teamMode: "TEAM MODE",
          hrDerby: "HR DERBY",
          practice: "PRACTICE",
        }[t.mode] ?? "";
      if (f) {
        const t = c ? 168 : 198;
        a.fillStyle = "rgba(191,87,0,0.15)";
        const e = a.measureText(f).width + 20;
        (!(function (t, e, n, s, o, i) {
          (t.beginPath(),
            t.moveTo(e + i, n),
            t.lineTo(e + s - i, n),
            t.quadraticCurveTo(e + s, n, e + s, n + i),
            t.lineTo(e + s, n + o - i),
            t.quadraticCurveTo(e + s, n + o, e + s - i, n + o),
            t.lineTo(e + i, n + o),
            t.quadraticCurveTo(e, n + o, e, n + o - i),
            t.lineTo(e, n + i),
            t.quadraticCurveTo(e, n, e + i, n),
            t.closePath());
        })(a, 300 - e / 2, t, e, 22, 4),
          a.fill(),
          (a.fillStyle = "#BF5700"),
          (a.font = "600 10px Oswald, sans-serif"),
          (a.textAlign = "center"),
          a.fillText(f, 300, t + 12));
      }
      ((a.fillStyle = "rgba(255,255,255,0.06)"), a.fillRect(24, 284, 552, 1));
      const g = a.createLinearGradient(24, 0, 200, 0);
      (g.addColorStop(0, "#FFD700"),
        g.addColorStop(1, "#BF5700"),
        (a.fillStyle = g),
        (a.font = "700 16px Oswald, sans-serif"),
        (a.textAlign = "left"),
        a.fillText("SANDLOT SLUGGERS", 24, 310),
        (a.fillStyle = "rgba(255,255,255,0.25)"),
        (a.font = "400 11px Oswald, sans-serif"),
        (a.textAlign = "right"),
        a.fillText("arcade.blazesportsintel.com", 576, 304),
        (a.fillStyle = "rgba(255,255,255,0.15)"),
        (a.font = "400 9px Oswald, sans-serif"),
        a.fillText("BLAZE SPORTS INTEL", 576, 318),
        (a.fillStyle = u),
        a.fillRect(0, 336, s, 4),
        i.toBlob((t) => {
          t ? e(t) : n(new Error("Canvas toBlob failed"));
        }, "image/png"));
    });
  })(t);
  if (!Ho?.logoUrl) return e;
  const n = await ((s = Ho.logoUrl),
  s
    ? new Promise((t) => {
        const e = new Image();
        ((e.crossOrigin = "anonymous"),
          (e.onload = () => t(e)),
          (e.onerror = () => t(null)),
          (e.src = s),
          setTimeout(() => t(null), 2e3));
      })
    : Promise.resolve(null));
  var s;
  if (!n) return e;
  const o = new Image();
  return new Promise((t, s) => {
    ((o.onload = () => {
      const i = document.createElement("canvas");
      ((i.width = 600), (i.height = 340));
      const a = i.getContext("2d");
      if (!a) return void s(new Error("No 2d context"));
      a.drawImage(o, 0, 0);
      (a.drawImage(n, 19, 25, 22, 22),
        i.toBlob((n) => {
          t(n || e);
        }, "image/png"));
    }),
      (o.onerror = () => t(e)),
      (o.src = URL.createObjectURL(e)));
  });
}
function Xo() {
  window.addEventListener("keydown", (t) => {
    (("Space" !== t.code && " " !== t.key) || (t.preventDefault(), Zo()),
      "Escape" === t.key &&
        ro.classList.contains("hidden") &&
        lo.classList.contains("hidden") &&
        !sii() &&
        Oo &&
        (Oo.isPaused()
          ? Fo()
          : Oo && !Oo.isPaused() && (Oo.pause(), Ro?.classList.add("active"), nii(SESSION_PHASES.PAUSED))));
  });
  const t = document.getElementById("game-canvas");
  t &&
    (t.addEventListener("click", Zo),
    t.addEventListener(
      "touchstart",
      (t) => {
        (t.preventDefault(), Zo());
      },
      { passive: !1 },
    ));
}
function Zo() {
  if (!Oo) return;
  if (oii()) return;
  if (Oo.isPaused()) return;
  "pitching" === Oo.getPhase() && Oo.triggerSwing();
}
async function Qo(t) {
  const e = document.getElementById("game-canvas"),
    n = document.getElementById("game-container");
  if (!e || !n) return;
  const s = n.getBoundingClientRect();
  ((e.width = s.width),
    (e.height = s.height),
    (zo = t),
    (Go = null),
    (Jo = 1),
    (ti = 0),
    (ni = 0),
    (si = !1),
    (oi = 0),
    (ii = 0),
    (ri = 0),
    (ai = [!1, !1, !1]),
    (li = { single: !1, double: !1, triple: !1, homeRun: !1 }),
    (ci = !1),
    (currentSessionSeed = createSessionSeed()),
    ko?.classList.add("visible"),
    Oo && Oo.stop(),
    No && No.container.remove(),
    nii(SESSION_PHASES.PREGAME),
    oo.classList.remove("hidden", "loading-screen-minimal"),
    Lo(0, "Preparing field..."),
    Lo(10, "Setting up field..."),
    (No = Cs({ parent: n, onSwing: Zo })),
    Ho &&
      (function (t, e, n) {
        t.container.style.setProperty("--syb-team-color", n);
        for (const s of t.panels) s.classList.add("team-accent");
        e && ((t.teamLogo.src = e), t.teamLogo.classList.add("visible"));
      })(No, Ho.logoUrl, Ho.primaryColor),
    Lo(25, "Loading 3D assets..."),
    (Oo = As({
      canvas: e,
      glbUrl: GsAsset("/assets/sandlot_field.glb"),
      mode: t,
      difficulty: Do,
      teamRoster: Uo ?? void 0,
      opponentRoster: teamModeOpponentRoster ?? void 0,
      sessionSeed: currentSessionSeed,
      onPhaseChange: hi,
      onGameUpdate: di,
      onGameOver: (t) => Yo(t),
      onLineupChange: (t) => {
        ((Go = t), No && Os(No, t));
      },
      onHitResult: fi,
      onPitchDelivered: ui,
      onContactFeedback: pi,
    })),
    (window.render_game_to_text = () =>
      JSON.stringify(
        { sessionPhase: currentSessionPhase, engine: Oo.renderToText() },
        null,
        2,
      )),
    (window.advanceTime = (t) => Oo.advanceTime(t)),
    (window.triggerSwing = () => Oo.triggerSwing()),
    Lo(50, "Building the ballpark..."));
  try {
    (await Oo.start(),
      (gameStartedAtMs = performance.now()),
      "1" === localStorage.getItem("bsi_arcade_muted") && Oo.toggleMute(),
      Lo(100, "Play ball!"),
      await new Promise((t) => setTimeout(t, 400)),
      oo.classList.add("hidden"));
    const t = Ho ? Ho.name : "Ready!";
    (zs(No, t, 1500),
      Rs(No, Oo.getGameState(), Oo.getPhase()),
      localStorage.getItem("bsi-tutorial-seen") ||
        ((ei = !0), No.tutorialHint.classList.add("visible")),
      Oo.getLineup() && ((Go = Oo.getLineup()), Os(No, Go)));
  } catch (o) {
    zs(No, "Failed to load", 0);
  }
}
(po.addEventListener("click", () => {
  (lo.classList.add("hidden"), Qo(zo));
}),
  mo.addEventListener("click", () => {
    (lo.classList.add("hidden"),
      Oo && Oo.stop(),
      (Ho = null),
      (Uo = null),
      (Go = null),
      Vo());
  }),
  fo?.addEventListener("click", async () => {
    if (!Oo) return;
    const t = Oo.getGameState(),
      e = (function (t) {
        const e = Ho?.name ?? "Sandlot",
          n =
            t.stats.atBats > 0
              ? (t.stats.hits / t.stats.atBats).toFixed(3)
              : ".000";
        return [
          `Sandlot Sluggers | ${e}`,
          `${t.stats.runs} R | ${t.stats.hits} H | ${t.stats.homeRuns} HR | ${n} AVG`,
          t.inning - 1 + " innings played",
          "",
          "arcade.blazesportsintel.com/sandlot-sluggers",
        ].join("\n");
      })(t);
    try {
      const s = await $o(t),
        o = new File([s], "sandlot-sluggers-result.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [o] }))
        return void (await navigator.share({ text: e, files: [o] }));
      if (navigator.clipboard && "undefined" != typeof ClipboardItem)
        try {
          return (
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": s }),
            ]),
            fo && (fo.textContent = "Image Copied!"),
            void setTimeout(() => {
              fo && (fo.textContent = "Share");
            }, 2e3)
          );
        } catch (n) {}
      const i = URL.createObjectURL(s),
        a = document.createElement("a");
      ((a.href = i),
        (a.download = "sandlot-sluggers-result.png"),
        a.click(),
        URL.revokeObjectURL(i),
        fo && (fo.textContent = "Saved!"),
        setTimeout(() => {
          fo && (fo.textContent = "Share");
        }, 2e3));
    } catch (n) {
      navigator.share
        ? navigator.share({ text: e }).catch((t) => {})
        : navigator.clipboard &&
          navigator.clipboard
            .writeText(e)
            .then(() => {
              (fo && (fo.textContent = "Copied!"),
                setTimeout(() => {
                  fo && (fo.textContent = "Share");
                }, 1500));
            })
            .catch((t) => {});
    }
  }));
let Jo = 1,
  ti = 0,
  ei = !1,
  ni = 0,
  si = !1,
  oi = 0,
  ii = 0,
  ai = [!1, !1, !1],
  ri = 0,
  li = { single: !1, double: !1, triple: !1, homeRun: !1 },
  ci = !1,
  lastContactRibbon = null;
function hi(t) {
  if (!No || !Oo) return;
  nii(tii(t));
  const e = Oo.getGameState();
  if (
    (Rs(No, e, t), Hs(No, "pitching" === t), "ready" === t && e.inning > Jo)
  ) {
    Jo = e.inning;
    const t = e.stats.runs - ni,
      n = t > 0 ? `${t} run${t > 1 ? "s" : ""} scored` : "",
      s =
        "quickPlay" === e.mode || "teamMode" === e.mode
          ? e.suddenDeath
            ? `Sudden Death · Target ${e.targetRuns}`
            : `Inning ${e.inning} of ${e.maxInnings}`
          : `Inning ${e.inning}`;
    (!(function (t, e, n = 2e3) {
      const s = t.inningBanner.querySelector(".syb-inning-banner-text");
      (s && (s.textContent = e),
        t.inningBanner.classList.add("active"),
        setTimeout(() => t.inningBanner.classList.remove("active"), n));
    })(No, s, 2200),
      n && No && setTimeout(() => qs(No, n), 600),
      Oo?.playInningTransition(),
      (ni = e.stats.runs),
      (si = !1));
  }
}
function ui(t, e, n) {
  No &&
    (function (t, e, n, s) {
      Ws && (clearTimeout(Ws), (Ws = null));
      const o = s ?? "#FF6B35";
      ((t.pitchInfo.innerHTML = `<span class="syb-pitch-dot" style="background:${o}"></span>${e} <span class="syb-pitch-speed">${n}</span>`),
        t.pitchInfo.classList.add("visible"),
        (Ws = setTimeout(() => {
          (t.pitchInfo.classList.remove("visible"), (Ws = null));
        }, 1200)));
    })(No, t, e, n);
}
function di(t) {
  if (!No || !Oo) return;
  if ((Rs(No, t, Oo.getPhase()), t.stats.runs > ti)) {
    const s = t.stats.runs - ti;
    ((e = No),
      (n = s) <= 0 ||
        (Ds && (clearTimeout(Ds), (Ds = null)),
        (e.runsToast.textContent = `+${n} run${n > 1 ? "s" : ""}`),
        e.runsToast.classList.add("visible"),
        (Ds = setTimeout(() => {
          (e.runsToast.classList.remove("visible"), (Ds = null));
        }, 1400))));
  }
  var e, n;
  ((ti = t.stats.runs),
    Oo?.setCrowdEnergy(t.stats.runs, t.inning, t.stats.currentStreak),
    (function (t, e, n) {
      const s = t.panels[1];
      s &&
        (s.classList.remove("danger", "hitter-count"),
        e >= 2 && n < 3
          ? s.classList.add("danger")
          : n >= 3 && e < 2 && s.classList.add("hitter-count"));
    })(No, t.strikes, t.balls));
  const s = [...t.bases];
  ((s[0] !== ai[0] || s[1] !== ai[1] || s[2] !== ai[2]) &&
    (s[0] && s[1] && s[2]
      ? setTimeout(() => {
          No && zs(No, "BASES LOADED!", 1200, "inning");
        }, 1300)
      : s[2] &&
        !ai[2] &&
        setTimeout(() => {
          No && zs(No, "Runner on Third!", 1e3, "inning");
        }, 1300)),
    (ai = s),
    !si &&
      t.stats.runs - ni >= 3 &&
      ((si = !0),
      Oo?.playBigInning(),
      Ks(No, "big-inning", 500),
      setTimeout(() => {
        No && zs(No, "BIG INNING!", 1600, "clutch");
      }, 800)),
    (t.strikes >= 3 || t.balls >= 4) &&
      (function (t = 600) {
        ((_s = !0),
          Ls && clearTimeout(Ls),
          (Ls = setTimeout(() => {
            ((_s = !1), (Ls = null));
          }, t)));
      })(700),
    2 === t.strikes && 3 === t.balls
      ? zs(No, "Full Count!", 1e3, "inning")
      : t.strikes > 0 && t.strikes < 3 && 0 === t.balls
        ? zs(No, `Strike ${t.strikes}!`, 800, "out")
        : t.balls > 0 &&
          t.balls < 4 &&
          0 === t.strikes &&
          zs(No, `Ball ${t.balls}`, 800, "walk"));
}
function pi(t) {
  var e, n;
  No &&
    ((e = No),
    (n = t.timingLabel),
    Gs && (clearTimeout(Gs), (Gs = null)),
    e.timingToast.classList.remove("visible", ...Us),
    (e.timingToast.textContent = n),
    e.timingToast.classList.add(`timing-${n.toLowerCase()}`),
    e.timingToast.offsetWidth,
    e.timingToast.classList.add("visible"),
    (Gs = setTimeout(() => {
      (e.timingToast.classList.remove("visible", ...Us), (Gs = null));
    }, 1e3)),
    (lastContactRibbon = {
      contactTier: (t.contactTier ?? t.quality ?? "weak").toUpperCase(),
      exitVelocityMph: t.exitVelocityMph,
      launchAngleDeg: t.launchAngleDeg ?? null,
      distanceFt: t.distanceFt,
    }),
    t.exitVelocityMph > oi && (oi = t.exitVelocityMph),
    t.distanceFt > ii && (ii = t.distanceFt),
    (ri = t.distanceFt),
    ei &&
      (!(function (t) {
        t.tutorialHint.classList.remove("visible");
      })(No),
      (ei = !1),
      localStorage.setItem("bsi-tutorial-seen", "1")));
}
const mi = {
  single: { text: "SINGLE!", duration: 1e3, style: "hit" },
  double: { text: "DOUBLE!", duration: 1200, style: "hit" },
  triple: { text: "TRIPLE!", duration: 1400, style: "hit" },
  homeRun: { text: "HOME RUN!", duration: 1800, style: "hr" },
  out: { text: "Out", duration: 800, style: "out" },
  doublePlay: { text: "DOUBLE PLAY!", duration: 1400, style: "out" },
  sacFly: { text: "SAC FLY!", duration: 1200, style: "hit" },
  strikeout: { text: "K", duration: 1200, style: "strikeout" },
  strikeoutSwinging: { text: "K", duration: 1200, style: "strikeout" },
  walk: { text: "Walk!", duration: 1e3, style: "walk" },
  foul: { text: "Foul Ball!", duration: 900, style: "out" },
};
function fi(t) {
  if (!No || !Oo) return;
  const e = Oo.getGameState();
  if (lastContactRibbon) {
    const e =
      "homeRun" === t
        ? "HOME RUN"
        : "triple" === t
          ? "TRIPLE"
          : "double" === t
            ? "DOUBLE"
            : "single" === t
              ? "SINGLE"
              : "doublePlay" === t
                ? "DOUBLE PLAY"
                : "sacFly" === t
                  ? "SAC FLY"
                  : "foul" === t
                    ? "FOUL"
                    : "out" === t
                      ? "OUT"
                      : t.toUpperCase();
    qs(
      No,
      `${lastContactRibbon.contactTier} · ${lastContactRibbon.exitVelocityMph} MPH · ${lastContactRibbon.launchAngleDeg ?? 0}° · ${lastContactRibbon.distanceFt} FT · ${e}`,
    );
    lastContactRibbon = null;
  }
  if (
    (("single" !== t && "double" !== t && "triple" !== t && "homeRun" !== t) ||
      (li[t] = !0),
    "homeRun" === t && ri > 0)
  ) {
    const t = `${ri} FT BOMB!`;
    setTimeout(() => {
      No && qs(No, t);
    }, 1200);
  }
  const n =
    ("quickPlay" === e.mode || "teamMode" === e.mode) &&
    e.inning >= e.maxInnings &&
    2 === e.outs &&
    ("single" === t || "double" === t || "triple" === t || "homeRun" === t);
  if (n) {
    const e = "homeRun" === t ? "CLUTCH HR!" : `CLUTCH ${t.toUpperCase()}!`;
    (zs(No, e, 1800, "clutch"), Oo.playClutchHit(), Ks(No, "big-inning", 400));
  } else {
    const e = mi[t];
    (zs(No, e.text, e.duration, e.style),
      "strikeoutSwinging" === t && No.messageOverlay.classList.add("swinging"));
  }
  if (
    (!ci &&
      li.single &&
      li.double &&
      li.triple &&
      li.homeRun &&
      ((ci = !0),
      setTimeout(() => {
        No &&
          (zs(No, "HIT FOR THE CYCLE!", 2500, "clutch"),
          Ks(No, "big-inning", 600),
          Oo?.playClutchHit());
      }, 2e3)),
    ("out" !== t &&
      "doublePlay" !== t &&
      "strikeout" !== t &&
      "strikeoutSwinging" !== t) ||
      (function (t, e = 350) {
        (t.vignette.classList.add("active"),
          setTimeout(() => t.vignette.classList.remove("active"), e));
      })(No),
    "homeRun" === t)
  ) {
    Xs(No, n && "homeRun" === t ? "walkOff" : "homeRun", !0);
  } else
    "strikeout" === t || "strikeoutSwinging" === t
      ? Xs(No, "strikeout")
      : "double" === t || "triple" === t
        ? Xs(No, "bigHit")
        : "walk" === t && Xs(No, "walk");
  n ||
    ("double" === t && Ks(No, "double"),
    "triple" === t && Ks(No, "triple", 400));
}
function gi() {
  Xo();
  const t = new URLSearchParams(window.location.search).get("mode");
  (Lo(100, "Ready"), setTimeout(() => oo.classList.add("hidden"), 300));
  if (!localStorage.getItem("bsi-player-name") && xo && vo && Ao) {
    (xo.classList.remove("hidden"), nii(SESSION_PHASES.IDENTITY), vo.focus());
    const e = () => {
      (!(function (t) {
        const e = t.trim() || "Anonymous";
        localStorage.setItem("bsi-player-name", e);
      })(vo.value),
        xo.classList.add("hidden"),
        bi(t));
    };
    return (
      Ao.addEventListener("click", e),
      void vo.addEventListener("keydown", (t) => {
        "Enter" === t.key && e();
      })
    );
  }
  bi(t);
}
function bi(t) {
  "teamMode" === t
    ? Wo()
    : t && ["practice", "quickPlay", "hrDerby"].includes(t)
      ? Qo(t)
      : Vo();
}
(window.addEventListener("resize", () => {
  const t = document.getElementById("game-container"),
    e = document.getElementById("game-canvas");
  if (!t || !e || !Oo) return;
  const n = t.getBoundingClientRect();
  ((e.width = n.width), (e.height = n.height), Oo.resize(n.width, n.height));
}),
  "loading" === document.readyState
    ? document.addEventListener("DOMContentLoaded", gi)
    : gi());
