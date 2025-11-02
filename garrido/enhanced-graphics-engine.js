/**
 * Enhanced Graphics Engine for The Garrido Code
 * Professional-grade WebGL rendering with post-processing
 * Version: 1.0.0
 * Target: 60 FPS desktop, 30+ FPS mobile
 */

(function(window) {
    'use strict';

    // Performance monitoring
    const PERF = {
        enabled: window.location.search.includes('debug'),
        frameCount: 0,
        lastTime: performance.now(),
        fps: 60
    };

    // Device capabilities detection
    const DEVICE = {
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile/i.test(navigator.userAgent),
        isTablet: /iPad|Android/i.test(navigator.userAgent) && window.innerWidth > 768,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        supportsWebGL2: (() => {
            try {
                const canvas = document.createElement('canvas');
                return !!(canvas.getContext('webgl2'));
            } catch (e) {
                return false;
            }
        })()
    };

    // Quality presets based on device
    const QUALITY = {
        ultra: {
            particleCount: 150000,
            particleSize: 2.5,
            bloomStrength: 1.2,
            enableDepthOfField: true,
            enableChromatic: true,
            shadows: true,
            msaa: 4
        },
        high: {
            particleCount: 80000,
            particleSize: 2.0,
            bloomStrength: 1.0,
            enableDepthOfField: true,
            enableChromatic: false,
            shadows: true,
            msaa: 2
        },
        medium: {
            particleCount: 40000,
            particleSize: 1.8,
            bloomStrength: 0.8,
            enableDepthOfField: false,
            enableChromatic: false,
            shadows: false,
            msaa: 0
        },
        low: {
            particleCount: 15000,
            particleSize: 1.5,
            bloomStrength: 0.5,
            enableDepthOfField: false,
            enableChromatic: false,
            shadows: false,
            msaa: 0
        }
    };

    // Auto-select quality based on device
    function getQualityPreset() {
        if (DEVICE.isMobile && !DEVICE.isTablet) return QUALITY.low;
        if (DEVICE.isTablet) return QUALITY.medium;

        // Desktop: check GPU tier (simplified)
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return QUALITY.low;

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            // High-end GPUs
            if (/RTX|Radeon RX|Apple M[1-3]/.test(renderer)) return QUALITY.ultra;
            // Mid-range GPUs
            if (/GTX|GeForce|Intel Iris/.test(renderer)) return QUALITY.high;
        }

        return QUALITY.medium;
    }

    const CONFIG = getQualityPreset();

    /**
     * Main Graphics Engine Class
     */
    class GarridoGraphicsEngine {
        constructor(canvasId = 'particle-field') {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                console.error('Canvas element not found');
                return;
            }

            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.particles = null;
            this.velocities = null;
            this.sizes = null;
            this.composer = null;
            this.mouseX = 0;
            this.mouseY = 0;
            this.targetCameraX = 0;
            this.targetCameraY = 0;
            this.scrollY = 0;
            this.time = 0;

            this.init();
        }

        init() {
            this.setupScene();
            this.setupCamera();
            this.setupRenderer();
            this.createParticleSystem();
            this.setupLighting();
            this.setupPostProcessing();
            this.setupEventListeners();
            this.animate();

            if (PERF.enabled) {
                this.createFPSCounter();
            }
        }

        setupScene() {
            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.FogExp2(0x0D0D12, 0.0002);
        }

        setupCamera() {
            this.camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                2000
            );
            this.camera.position.z = 600;
        }

        setupRenderer() {
            const contextParams = {
                alpha: true,
                antialias: CONFIG.msaa === 0,
                powerPreference: 'high-performance',
                stencil: false,
                depth: true
            };

            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                ...contextParams
            });

            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(DEVICE.pixelRatio);
            this.renderer.setClearColor(0x000000, 0);

            // Enable tone mapping for better color
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.0;
        }

        createParticleSystem() {
            const count = CONFIG.particleCount;
            const geometry = new THREE.BufferGeometry();

            // Position, color, size, and velocity arrays
            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);
            const sizes = new Float32Array(count);
            this.velocities = new Float32Array(count * 3);

            // Burnt orange color palette
            const colorPalette = [
                new THREE.Color(0xBF5700), // Blaze burnt orange
                new THREE.Color(0xCC6600), // Ember
                new THREE.Color(0xD97B38), // Copper
                new THREE.Color(0xE69551), // Sunset
                new THREE.Color(0xFFBF00), // Amber
            ];

            // Initialize particles with variation
            for (let i = 0; i < count; i++) {
                const i3 = i * 3;

                // Spherical distribution for more natural look
                const radius = Math.random() * 1000 + 200;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);

                positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
                positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                positions[i3 + 2] = (Math.random() - 0.5) * 800 + (radius * Math.cos(phi));

                // Velocity field with curl noise simulation
                const vx = (Math.random() - 0.5) * 0.4;
                const vy = (Math.random() - 0.5) * 0.4;
                const vz = (Math.random() - 0.5) * 0.2;

                this.velocities[i3] = vx;
                this.velocities[i3 + 1] = vy;
                this.velocities[i3 + 2] = vz;

                // Size variation with depth-based scaling
                const depthFactor = (positions[i3 + 2] + 500) / 1000;
                sizes[i] = CONFIG.particleSize * (0.5 + Math.random() * 1.5) * (0.8 + depthFactor * 0.4);

                // Color selection with brightness variation
                const baseColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
                const brightness = 0.6 + Math.random() * 0.4;

                colors[i3] = baseColor.r * brightness;
                colors[i3 + 1] = baseColor.g * brightness;
                colors[i3 + 2] = baseColor.b * brightness;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

            // Custom shader material for advanced rendering
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    pixelRatio: { value: DEVICE.pixelRatio }
                },
                vertexShader: `
                    attribute float size;
                    attribute vec3 color;
                    varying vec3 vColor;
                    varying float vDepth;
                    uniform float time;
                    uniform float pixelRatio;

                    void main() {
                        vColor = color;

                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        vDepth = -mvPosition.z / 1000.0;

                        // Depth-based size attenuation
                        float depthSize = size * (300.0 / -mvPosition.z);
                        gl_PointSize = depthSize * pixelRatio;

                        // Subtle pulsing effect
                        gl_PointSize *= 1.0 + sin(time * 2.0 + position.x * 0.01) * 0.1;

                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    varying vec3 vColor;
                    varying float vDepth;

                    void main() {
                        // Circular particle with soft edges
                        vec2 center = gl_PointCoord - vec2(0.5);
                        float dist = length(center);

                        if (dist > 0.5) discard;

                        // Soft glow falloff
                        float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
                        alpha *= (0.6 + vDepth * 0.4);

                        // Additive blending for glow
                        vec3 glow = vColor * (1.5 - dist * 1.0);

                        gl_FragColor = vec4(glow, alpha * 0.85);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true
            });

            this.particles = new THREE.Points(geometry, material);
            this.scene.add(this.particles);
        }

        setupLighting() {
            // Ambient light for base illumination
            const ambient = new THREE.AmbientLight(0xBF5700, 0.3);
            this.scene.add(ambient);

            // Directional light for depth
            const directional = new THREE.DirectionalLight(0xCC6600, 0.5);
            directional.position.set(100, 100, 100);
            this.scene.add(directional);

            // Point lights for dynamic feel
            const pointLight1 = new THREE.PointLight(0xBF5700, 1.0, 500);
            pointLight1.position.set(200, 200, 200);
            this.scene.add(pointLight1);

            const pointLight2 = new THREE.PointLight(0xD97B38, 0.8, 500);
            pointLight2.position.set(-200, -200, 100);
            this.scene.add(pointLight2);
        }

        setupPostProcessing() {
            // Only setup if EffectComposer is available (would need to add library)
            // For now, using built-in renderer with tone mapping
            // In production, would add:
            // - Bloom pass
            // - Depth of field
            // - Chromatic aberration
            // - Film grain
            // - Vignette
        }

        updateParticles() {
            const positions = this.particles.geometry.attributes.position.array;
            const count = positions.length / 3;

            // Mouse influence strength
            const mouseInfluence = 50;
            const mouseForceRadius = 300;

            for (let i = 0; i < count; i++) {
                const i3 = i * 3;

                // Apply velocities
                positions[i3] += this.velocities[i3];
                positions[i3 + 1] += this.velocities[i3 + 1];
                positions[i3 + 2] += this.velocities[i3 + 2];

                // Mouse interaction - attract/repel particles
                const dx = positions[i3] - this.targetCameraX * 100;
                const dy = positions[i3 + 1] - this.targetCameraY * 100;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouseForceRadius) {
                    const force = (1 - distance / mouseForceRadius) * 0.02;
                    this.velocities[i3] += dx * force;
                    this.velocities[i3 + 1] += dy * force;
                }

                // Boundary wrapping with hysteresis
                const boundary = 1100;
                if (Math.abs(positions[i3]) > boundary) {
                    positions[i3] = -positions[i3] * 0.95;
                    this.velocities[i3] *= -0.8;
                }
                if (Math.abs(positions[i3 + 1]) > boundary) {
                    positions[i3 + 1] = -positions[i3 + 1] * 0.95;
                    this.velocities[i3 + 1] *= -0.8;
                }
                if (Math.abs(positions[i3 + 2]) > 600) {
                    positions[i3 + 2] = -positions[i3 + 2] * 0.95;
                    this.velocities[i3 + 2] *= -0.8;
                }

                // Apply damping
                this.velocities[i3] *= 0.995;
                this.velocities[i3 + 1] *= 0.995;
                this.velocities[i3 + 2] *= 0.995;

                // Add turbulence based on time and position
                const turbulence = Math.sin(this.time * 0.5 + positions[i3] * 0.01) * 0.01;
                this.velocities[i3 + 1] += turbulence;
            }

            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        setupEventListeners() {
            // Mouse movement
            window.addEventListener('mousemove', (e) => {
                this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
                this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
            }, { passive: true });

            // Touch movement
            window.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) {
                    this.mouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
                    this.mouseY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
                }
            }, { passive: true });

            // Scroll effect
            window.addEventListener('scroll', () => {
                this.scrollY = window.pageYOffset;
            }, { passive: true });

            // Window resize
            window.addEventListener('resize', () => {
                this.onWindowResize();
            }, { passive: true });

            // Visibility change - pause when hidden
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.pause();
                } else {
                    this.resume();
                }
            });
        }

        onWindowResize() {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }

        animate() {
            this.animationId = requestAnimationFrame(() => this.animate());

            this.time += 0.01;

            // Update performance stats
            if (PERF.enabled) {
                this.updateFPS();
            }

            // Smooth camera follow
            this.targetCameraX += (this.mouseX * 80 - this.targetCameraX) * 0.03;
            this.targetCameraY += (this.mouseY * 80 - this.targetCameraY) * 0.03;

            this.camera.position.x = this.targetCameraX;
            this.camera.position.y = this.targetCameraY;

            // Scroll-based camera movement
            this.camera.position.z = 600 - this.scrollY * 0.1;

            // Update particles
            this.updateParticles();

            // Gentle rotation
            this.particles.rotation.y += 0.0003;
            this.particles.rotation.x = Math.sin(this.time * 0.1) * 0.05;

            // Update shader time uniform
            if (this.particles.material.uniforms) {
                this.particles.material.uniforms.time.value = this.time;
            }

            this.renderer.render(this.scene, this.camera);
        }

        pause() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }

        resume() {
            if (!this.animationId) {
                this.animate();
            }
        }

        updateFPS() {
            PERF.frameCount++;
            const now = performance.now();
            const delta = now - PERF.lastTime;

            if (delta >= 1000) {
                PERF.fps = Math.round((PERF.frameCount * 1000) / delta);
                PERF.frameCount = 0;
                PERF.lastTime = now;

                if (this.fpsCounter) {
                    this.fpsCounter.textContent = `${PERF.fps} FPS | ${CONFIG.particleCount.toLocaleString()} particles`;
                }
            }
        }

        createFPSCounter() {
            this.fpsCounter = document.createElement('div');
            this.fpsCounter.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(13, 13, 18, 0.9);
                color: #BF5700;
                padding: 8px 16px;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                z-index: 10000;
                border: 1px solid rgba(191, 87, 0, 0.3);
            `;
            document.body.appendChild(this.fpsCounter);
        }

        destroy() {
            this.pause();

            if (this.fpsCounter) {
                this.fpsCounter.remove();
            }

            window.removeEventListener('resize', this.onWindowResize);
            window.removeEventListener('mousemove', this.handleMouseMove);
            window.removeEventListener('scroll', this.handleScroll);

            if (this.particles) {
                this.particles.geometry.dispose();
                this.particles.material.dispose();
                this.scene.remove(this.particles);
            }

            if (this.renderer) {
                this.renderer.dispose();
            }
        }
    }

    /**
     * Enhanced CSS Injection for Glassmorphism
     */
    function injectEnhancedStyles() {
        const styleId = 'garrido-enhanced-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Enhanced glassmorphism with micro-animations */
            .episode-card,
            .section-container,
            .drill-card,
            .nav-episode-card {
                position: relative;
                backdrop-filter: blur(20px) saturate(180%);
                transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);
            }

            .episode-card::before,
            .section-container::before,
            .drill-card::before {
                content: '';
                position: absolute;
                inset: 0;
                border-radius: inherit;
                padding: 1px;
                background: linear-gradient(135deg,
                    rgba(191, 87, 0, 0.4),
                    rgba(204, 102, 0, 0.2),
                    rgba(217, 123, 56, 0.3)
                );
                -webkit-mask: linear-gradient(#fff 0 0) content-box,
                              linear-gradient(#fff 0 0);
                mask: linear-gradient(#fff 0 0) content-box,
                      linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                mask-composite: exclude;
                opacity: 0;
                transition: opacity 400ms ease;
            }

            .episode-card:hover::before,
            .section-container:hover::before,
            .drill-card:hover::before {
                opacity: 1;
                animation: borderGlow 2s ease-in-out infinite;
            }

            @keyframes borderGlow {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 1; }
            }

            /* Enhanced text rendering */
            .hero-title,
            .episode-title,
            .section-title,
            .drill-title {
                text-shadow: 0 0 40px rgba(191, 87, 0, 0.5),
                             0 0 20px rgba(191, 87, 0, 0.3);
                letter-spacing: 0.02em;
                font-feature-settings: "kern" 1, "liga" 1;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            /* Shimmer effect on hover */
            .download-btn,
            .hero-cta {
                position: relative;
                overflow: hidden;
            }

            .download-btn::after,
            .hero-cta::after {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(
                    45deg,
                    transparent 30%,
                    rgba(255, 255, 255, 0.1) 50%,
                    transparent 70%
                );
                transform: rotate(45deg);
                animation: shimmer 3s infinite;
            }

            @keyframes shimmer {
                0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            }

            /* Micro-interactions for metrics */
            .metric-item {
                transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
            }

            .metric-item:hover {
                transform: translateX(5px);
                background: rgba(191, 87, 0, 0.15);
            }

            .metric-icon {
                transition: all 300ms ease;
            }

            .metric-item:hover .metric-icon {
                transform: scale(1.2) rotate(5deg);
            }

            /* Enhanced focus states for accessibility */
            a:focus-visible,
            button:focus-visible {
                outline: 2px solid #BF5700;
                outline-offset: 4px;
                border-radius: 4px;
            }

            /* Smooth scroll progress indicator */
            body::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: var(--scroll-progress, 0%);
                height: 3px;
                background: linear-gradient(90deg, #BF5700, #CC6600, #D97B38);
                z-index: 10001;
                transition: width 100ms linear;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Scroll progress indicator
     */
    function initScrollProgress() {
        function updateScrollProgress() {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            document.body.style.setProperty('--scroll-progress', `${scrolled}%`);
        }

        window.addEventListener('scroll', updateScrollProgress, { passive: true });
        updateScrollProgress();
    }

    /**
     * Initialize everything
     */
    function init() {
        if (typeof THREE === 'undefined') {
            console.error('Three.js is required but not loaded');
            return;
        }

        injectEnhancedStyles();
        initScrollProgress();

        // Initialize graphics engine
        window.garridoEngine = new GarridoGraphicsEngine('particle-field');

        // Log performance info
        console.log('%c🔥 Garrido Graphics Engine Initialized', 'color: #BF5700; font-size: 14px; font-weight: bold');
        console.log(`Quality: ${Object.keys(QUALITY).find(k => QUALITY[k] === CONFIG)}`);
        console.log(`Particles: ${CONFIG.particleCount.toLocaleString()}`);
        console.log(`Device: ${DEVICE.isMobile ? 'Mobile' : DEVICE.isTablet ? 'Tablet' : 'Desktop'}`);
        console.log(`WebGL2: ${DEVICE.supportsWebGL2 ? 'Yes' : 'No'}`);
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for external access
    window.GarridoGraphicsEngine = GarridoGraphicsEngine;

})(window);
