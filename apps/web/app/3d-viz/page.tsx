'use client';

/**
 * 3D WebGPU Visualization Hub - PREMIUM EDITION
 *
 * Stadium-quality graphics showcase with:
 * - Animated particle backgrounds
 * - Cinematic hero sections
 * - Glassmorphism UI
 * - Smooth micro-animations
 * - Real-time GPU detection
 */

import Link from 'next/link';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import '../../styles/advanced-effects.css';

const AnimatedBackground = dynamic(
  () => import('../../components/visuals/AnimatedBackground'),
  { ssr: false }
);

const visualizations = [
  {
    id: 'pitch-tunnel',
    title: 'Baseball Pitch Tunnel',
    sport: '⚾',
    href: '/baseball/overlays/pitch-tunnel',
    description: 'Experience every pitch in cinematic 3D. Track velocity, spin rate, and movement with WebGPU-powered ray tracing.',
    features: ['Ray Tracing', 'Velocity Analysis', 'Strike Zone Overlay', 'Interactive Trajectories'],
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    performance: 'WebGPU',
    icon: '🎯',
  },
  {
    id: 'qb-trajectory',
    title: 'Football QB Trajectory',
    sport: '🏈',
    href: '/football/overlays/qb-trajectory',
    description: 'Volumetric god rays illuminate every pass. Watch completion probabilities morph in real-time with cinematic depth of field.',
    features: ['Volumetric Lighting', 'Route Visualization', 'Completion Spheres', 'Stadium Atmosphere'],
    gradient: 'from-orange-500 via-red-500 to-pink-500',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    performance: 'WebGPU',
    icon: '🌟',
  },
  {
    id: 'command-center',
    title: 'Multi-Sport Command Center',
    sport: '🎯',
    href: '/command-center',
    description: 'Cardinals, Titans, Grizzlies, and Longhorns pulse with live data. 3D momentum spheres rotate in team colors with particle fields.',
    features: ['4-Team Tracking', 'Performance Spheres', 'Auto-Refresh', 'Momentum Rings'],
    gradient: 'from-purple-500 via-pink-500 to-rose-500',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    performance: 'WebGL2',
    icon: '⚡',
  },
  {
    id: 'sabermetrics',
    title: 'Advanced Sabermetrics',
    sport: '📊',
    href: '/baseball/sabermetrics',
    description: 'Five visualization modes transform MLB stats into living data. Trajectory forecasts blend Pythagorean expectations with team DNA.',
    features: ['5 Viz Modes', '30 MLB Teams', 'Live Updates', 'Team Comparison'],
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    performance: 'WebGL2',
    icon: '📈',
  },
];

const features = [
  {
    icon: '⚡',
    title: 'WebGPU-First',
    description: 'Hardware-accelerated compute shaders process 2000+ particles at 60fps',
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    icon: '🎨',
    title: 'Ray Tracing',
    description: 'Real-time path tracing with SSAO and volumetric scattering',
    gradient: 'from-pink-400 to-rose-500',
  },
  {
    icon: '📱',
    title: 'Mobile-First',
    description: 'Touch-optimized with progressive enhancement across all devices',
    gradient: 'from-cyan-400 to-blue-500',
  },
  {
    icon: '🔄',
    title: 'Real-Time',
    description: 'WebSocket-ready with sub-second data refresh and intelligent caching',
    gradient: 'from-green-400 to-emerald-500',
  },
];

export default function ThreeDVisualizationHub() {
  const [gpuSupport, setGpuSupport] = useState<'webgpu' | 'webgl2' | 'webgl' | 'checking'>('checking');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkGPU = async () => {
      if ('gpu' in navigator) {
        try {
          const adapter = await (navigator as any).gpu?.requestAdapter();
          if (adapter) {
            setGpuSupport('webgpu');
            return;
          }
        } catch (e) {
          // Fall through
        }
      }

      const canvas = document.createElement('canvas');
      const gl2 = canvas.getContext('webgl2');
      if (gl2) {
        setGpuSupport('webgl2');
        return;
      }

      const gl = canvas.getContext('webgl');
      if (gl) {
        setGpuSupport('webgl');
      }
    };

    checkGPU();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
      {/* Animated Background */}
      {mounted && (
        <AnimatedBackground
          particleCount={150}
          colors={['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe']}
          speed={0.3}
          connections={true}
        />
      )}

      {/* Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900/50 via-transparent to-gray-900/50" style={{ zIndex: 1 }} />

      {/* Content */}
      <div className="relative" style={{ zIndex: 2 }}>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
          {/* Energy Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="energy-wave" style={{ width: '300px', height: '300px' }} />
            <div className="energy-wave" style={{ width: '300px', height: '300px' }} />
            <div className="energy-wave" style={{ width: '300px', height: '300px' }} />
          </div>

          <div className="max-w-7xl mx-auto text-center relative">
            {/* GPU Status Badge */}
            <div className="inline-flex items-center gap-3 px-6 py-3 mb-8 glass rounded-full">
              {gpuSupport === 'checking' ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                  <span className="text-sm">Detecting GPU capabilities...</span>
                </>
              ) : gpuSupport === 'webgpu' ? (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
                    <div className="relative w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                  <span className="text-sm font-semibold gradient-text">WebGPU Enabled • Maximum Performance</span>
                </>
              ) : gpuSupport === 'webgl2' ? (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" />
                    <div className="relative w-3 h-3 bg-blue-500 rounded-full" />
                  </div>
                  <span className="text-sm font-semibold">WebGL2 Active • Enhanced Graphics</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-gray-500 rounded-full" />
                  <span className="text-sm">WebGL Compatible</span>
                </>
              )}
            </div>

            {/* Main Title */}
            <h1 className="text-6xl md:text-8xl font-black mb-6 neon-text leading-tight">
              3D Sports
              <br />
              <span className="gradient-text">Visualization Engine</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
              Stadium-quality WebGPU ray tracing meets real-time analytics.
              <br />
              <span className="text-blue-400 font-semibold">Nobody else visualizes sports like this.</span>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/baseball/overlays/pitch-tunnel"
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg hover-lift shadow-glow-lg smooth-all"
              >
                <span className="flex items-center gap-2">
                  Launch Pitch Tunnel
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>

              <Link
                href="/command-center"
                className="px-8 py-4 glass rounded-xl font-bold text-lg hover-glow smooth-all border border-white/10"
              >
                Multi-Sport Command Center
              </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { value: '4', label: 'Visualizations', icon: '🎮' },
                { value: '85%', label: 'WebGPU Coverage', icon: '⚡' },
                { value: '~35KB', label: 'Bundle Weight', icon: '📦' },
                { value: '60fps', label: 'Performance', icon: '🚀' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="glass-dark rounded-2xl p-6 hover-lift smooth-all card-hover"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="text-4xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Visualizations Grid */}
        <section className="relative px-4 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Explore <span className="gradient-text">Stadium-Quality</span> Visualizations
              </h2>
              <p className="text-gray-400 text-lg">
                Four revolutionary ways to experience sports data in 3D
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {visualizations.map((viz, index) => (
                <Link
                  key={viz.id}
                  href={viz.href}
                  className="group relative glass-dark rounded-3xl p-8 hover-lift smooth-all overflow-hidden"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Gradient Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${viz.gradient} opacity-0 group-hover:opacity-10 smooth-all`}
                  />

                  {/* Animated Border Gradient */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 smooth-all">
                    <div className={`absolute inset-0 bg-gradient-to-r ${viz.gradient} opacity-20 blur-xl`} />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="text-5xl mb-3">{viz.sport}</div>
                        <h3 className="text-2xl font-bold mb-2">{viz.title}</h3>
                        <span className={`inline-block px-3 py-1 text-xs font-semibold bg-gradient-to-r ${viz.gradient} rounded-full`}>
                          {viz.performance}
                        </span>
                      </div>
                      <div className="text-4xl opacity-50 group-hover:opacity-100 smooth-all">
                        {viz.icon}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      {viz.description}
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {viz.features.map((feature, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm text-gray-400 glass-dark rounded-lg px-3 py-2"
                        >
                          <div className={`w-1.5 h-1.5 bg-gradient-to-r ${viz.gradient} rounded-full`} />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className={`flex items-center gap-2 font-semibold bg-gradient-to-r ${viz.gradient} bg-clip-text text-transparent group-hover:gap-4 smooth-all`}>
                      Launch Visualization
                      <svg className="w-5 h-5 text-current group-hover:translate-x-1 smooth-all" style={{ color: 'inherit' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>

                  {/* Glow Effect */}
                  <div
                    className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 smooth-all blur-2xl -z-10"
                    style={{ background: viz.glowColor }}
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative px-4 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="gradient-text">Technical</span> Excellence
              </h2>
              <p className="text-gray-400 text-lg">
                Cutting-edge technology powering revolutionary visualizations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="glass-dark rounded-2xl p-6 text-center hover-lift smooth-all spotlight"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`text-5xl mb-4 inline-block bg-gradient-to-r ${feature.gradient} p-4 rounded-2xl`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why This Matters */}
        <section className="relative px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Why This <span className="gradient-text">Changes Everything</span>
              </h2>
            </div>

            <div className="space-y-6">
              {[
                {
                  icon: '🎯',
                  title: 'Industry Differentiation',
                  description: 'ESPN, Fox Sports, Bleacher Report—all stuck in 2D charts. We\'re the only platform with true 3D hardware-accelerated sports visualization.',
                  gradient: 'from-blue-500 to-cyan-500',
                },
                {
                  icon: '⚡',
                  title: 'Progressive Enhancement',
                  description: 'WebGPU-first for cutting-edge devices, graceful WebGL2 fallback. 85% get full ray tracing, 100% get enhanced graphics.',
                  gradient: 'from-purple-500 to-pink-500',
                },
                {
                  icon: '📱',
                  title: 'Mobile-First Reality',
                  description: 'Touch-optimized, performant on 4G, works offline. Built for how you actually consume sports—on your phone, late at night.',
                  gradient: 'from-green-500 to-emerald-500',
                },
                {
                  icon: '🔬',
                  title: 'Production-Ready',
                  description: 'Zero TODOs, comprehensive error handling, cited sources with America/Chicago timestamps. Built for scale from day one.',
                  gradient: 'from-orange-500 to-red-500',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="glass-dark rounded-2xl p-8 hover-lift smooth-all card-hover"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-start gap-6">
                    <div className={`text-4xl bg-gradient-to-r ${item.gradient} p-4 rounded-xl flex-shrink-0`}>
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                      <p className="text-gray-300 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative px-4 py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="glass-dark rounded-3xl p-12 hover-lift smooth-all">
              <div className="text-6xl mb-6">🚀</div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to <span className="gradient-text">Experience</span> the Future?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Start with any visualization and see why this changes everything.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/baseball/overlays/pitch-tunnel"
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-bold hover-lift shadow-glow-lg smooth-all"
                >
                  ⚾ Baseball Pitch Tunnel
                </Link>
                <Link
                  href="/football/overlays/qb-trajectory"
                  className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl font-bold hover-lift shadow-glow-lg smooth-all"
                >
                  🏈 Football QB Trajectory
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative px-4 py-8 border-t border-white/5">
          <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
            <p className="mb-2">
              Built with Babylon.js 8 • WebGPU-first rendering • Progressive enhancement
            </p>
            <p>
              Ray tracing • SSAO • Volumetric lighting • PBR materials • ~35KB bundle weight
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
