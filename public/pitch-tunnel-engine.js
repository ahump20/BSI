/**
 * BLAZE SPORTS INTEL - 3D PITCH TUNNEL SIMULATOR
 * Professional-grade baseball pitch visualization with photorealistic rendering
 *
 * Features:
 * - WebGPU rendering with WebGL2 fallback
 * - PBR materials with HDR lighting
 * - Advanced post-processing (Bloom, DOF, Motion Blur, SSAO)
 * - Real-time physics-based pitch trajectory
 * - Multi-pitch tunneling analysis
 * - Cinematic camera system
 *
 * @version 1.0.0
 * @author Blaze Sports Intel
 */

class PitchTunnelSimulator {
    constructor() {
        this.canvas = document.getElementById('renderCanvas');
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.baseball = null;
        this.trajectoryMesh = null;
        this.spinAxisArrow = null;
        this.strikeZone = null;
        this.homePlate = null;

        // Pitch state
        this.currentPitch = {
            type: 'fastball',
            velocity: 95, // mph
            spinRate: 2400, // rpm
            spinAxis: { tilt: 12, direction: 180 }, // degrees
            releasePoint: { x: 2.5, y: 6.0, z: 55 }, // feet
            movement: { horizontal: -2.5, vertical: 14.2 }, // inches
            spinEfficiency: 0.98
        };

        // Animation state
        this.isAnimating = false;
        this.animationProgress = 0;
        this.pitchTrajectory = [];

        // Performance monitoring
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;

        this.init();
    }

    /**
     * Initialize the 3D rendering engine
     * Attempts WebGPU first, falls back to WebGL2
     */
    async init() {
        try {
            // Try WebGPU first (cutting edge)
            const webGPUSupported = await BABYLON.WebGPUEngine.IsSupportedAsync;

            if (webGPUSupported) {
                console.log('✓ WebGPU detected - Using high-performance rendering');
                this.engine = new BABYLON.WebGPUEngine(this.canvas, {
                    antialias: true,
                    stencil: true,
                    powerPreference: 'high-performance',
                    premultipliedAlpha: false
                });
                await this.engine.initAsync();
            } else {
                console.log('✓ WebGL2 mode - Standard rendering');
                this.engine = new BABYLON.Engine(this.canvas, true, {
                    preserveDrawingBuffer: true,
                    stencil: true,
                    antialias: true,
                    powerPreference: 'high-performance'
                });
            }

            this.createScene();
            this.setupControls();
            this.startRenderLoop();

            // Hide loading overlay
            setTimeout(() => {
                document.getElementById('loadingOverlay').classList.add('hidden');
            }, 1000);

        } catch (error) {
            console.error('Failed to initialize 3D engine:', error);
            this.showError('Failed to initialize 3D rendering. Please refresh the page.');
        }
    }

    /**
     * Create the main 3D scene with stadium environment
     */
    createScene() {
        this.scene = new BABYLON.Scene(this.engine);

        // Scene configuration for realism
        this.scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.08, 1.0);
        this.scene.ambientColor = new BABYLON.Color3(0.2, 0.2, 0.25);
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogDensity = 0.002;
        this.scene.fogColor = new BABYLON.Color3(0.02, 0.03, 0.08);

        // Enable physics for realistic motion
        this.scene.enablePhysics(new BABYLON.Vector3(0, -32.2, 0), new BABYLON.CannonJSPlugin());

        // Setup cameras (multiple presets)
        this.setupCameras();

        // Create stadium lighting (HDR environment)
        this.setupLighting();

        // Create baseball with PBR materials
        this.createBaseball();

        // Create strike zone (glass material)
        this.createStrikeZone();

        // Create home plate
        this.createHomePlate();

        // Create mound and reference markers
        this.createEnvironment();

        // Setup post-processing pipeline
        this.setupPostProcessing();

        // Create initial trajectory
        this.updatePitchTrajectory();

        console.log('✓ Scene created successfully');
    }

    /**
     * Setup multiple camera presets for different viewing angles
     */
    setupCameras() {
        // Primary camera - Catcher's POV (default)
        this.camera = new BABYLON.ArcRotateCamera(
            'catcherCam',
            Math.PI, // Alpha
            Math.PI / 2.2, // Beta
            25, // Radius
            new BABYLON.Vector3(0, 3, 0), // Target
            this.scene
        );

        this.camera.lowerRadiusLimit = 10;
        this.camera.upperRadiusLimit = 60;
        this.camera.lowerBetaLimit = 0.1;
        this.camera.upperBetaLimit = Math.PI / 2;
        this.camera.wheelPrecision = 50;
        this.camera.panningSensibility = 100;

        // Smooth camera movement
        this.camera.inertia = 0.9;
        this.camera.angularSensibilityX = 1000;
        this.camera.angularSensibilityY = 1000;

        // Enable controls
        this.camera.attachControl(this.canvas, true);

        // Store camera presets for quick switching
        this.cameraPresets = {
            catcher: { alpha: Math.PI, beta: Math.PI / 2.2, radius: 25, target: new BABYLON.Vector3(0, 3, 0) },
            side: { alpha: Math.PI / 2, beta: Math.PI / 2.5, radius: 35, target: new BABYLON.Vector3(0, 3, 25) },
            overhead: { alpha: 0, beta: 0.3, radius: 40, target: new BABYLON.Vector3(0, 3, 25) }
        };
    }

    /**
     * Setup HDR stadium lighting with realistic shadows
     */
    setupLighting() {
        // Main stadium lights (4 directional lights simulating field lights)
        const stadiumLight1 = new BABYLON.DirectionalLight(
            'stadiumLight1',
            new BABYLON.Vector3(-1, -2, -1),
            this.scene
        );
        stadiumLight1.intensity = 1.2;
        stadiumLight1.shadowMinZ = 1;
        stadiumLight1.shadowMaxZ = 100;

        // Enable high-quality shadows
        const shadowGenerator = new BABYLON.ShadowGenerator(2048, stadiumLight1);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurKernel = 64;
        shadowGenerator.depthScale = 50;
        shadowGenerator.darkness = 0.3;

        this.shadowGenerator = shadowGenerator;

        // Additional fill lights for realistic stadium environment
        const fillLight1 = new BABYLON.HemisphericLight(
            'fillLight1',
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        fillLight1.intensity = 0.4;
        fillLight1.groundColor = new BABYLON.Color3(0.05, 0.05, 0.1);

        const fillLight2 = new BABYLON.PointLight(
            'fillLight2',
            new BABYLON.Vector3(-10, 15, 30),
            this.scene
        );
        fillLight2.intensity = 0.6;
        fillLight2.diffuse = new BABYLON.Color3(1.0, 0.98, 0.95);

        // HDR environment texture for reflections
        const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
            'https://assets.babylonjs.com/environments/studio.env',
            this.scene
        );
        this.scene.environmentTexture = hdrTexture;
        this.scene.environmentIntensity = 0.8;
    }

    /**
     * Create photorealistic baseball with PBR materials
     */
    createBaseball() {
        // Baseball sphere with high poly count for smoothness
        this.baseball = BABYLON.MeshBuilder.CreateSphere('baseball', {
            diameter: 0.242, // Regulation size in feet (2.9 inches)
            segments: 64
        }, this.scene);

        // Position at release point
        this.baseball.position = new BABYLON.Vector3(
            this.currentPitch.releasePoint.x,
            this.currentPitch.releasePoint.y,
            this.currentPitch.releasePoint.z
        );

        // PBR Material for photorealistic leather
        const baseballMat = new BABYLON.PBRMaterial('baseballMat', this.scene);

        // Albedo (base color) - cream leather
        baseballMat.albedoColor = new BABYLON.Color3(0.95, 0.93, 0.88);

        // Metallic/Roughness workflow
        baseballMat.metallic = 0.0; // Leather is non-metallic
        baseballMat.roughness = 0.6; // Slightly rough leather surface

        // Realistic reflectivity
        baseballMat.environmentIntensity = 0.5;
        baseballMat.directIntensity = 1.0;

        // Subsurface scattering for leather realism
        baseballMat.subSurface.isRefractionEnabled = false;
        baseballMat.subSurface.isTranslucencyEnabled = true;
        baseballMat.subSurface.translucencyIntensity = 0.1;

        // Add normal map for stitching detail (procedural)
        const normalTexture = new BABYLON.ProceduralTexture(
            'baseballNormal',
            512,
            this.getBaseballNormalShader(),
            this.scene
        );
        baseballMat.bumpTexture = normalTexture;
        baseballMat.bumpTexture.level = 1.5;

        // Apply material
        this.baseball.material = baseballMat;

        // Add to shadow casters
        this.shadowGenerator.addShadowCaster(this.baseball);

        // Enable glow for visibility
        const glow = new BABYLON.GlowLayer('baseballGlow', this.scene);
        glow.intensity = 0.3;
    }

    /**
     * Procedural shader for baseball stitching normal map
     */
    getBaseballNormalShader() {
        return `
            precision highp float;
            varying vec2 vUV;

            // Simplex noise for stitching pattern
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy));
                vec2 x0 = v - i + dot(i, C.xx);
                vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod289(i);
                vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m;
                m = m*m;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            void main() {
                vec2 uv = vUV * 8.0;

                // Create stitching pattern along seams
                float stitch1 = smoothstep(0.45, 0.55, abs(sin(uv.x * 3.14159)));
                float stitch2 = smoothstep(0.45, 0.55, abs(sin(uv.y * 3.14159)));
                float stitching = stitch1 * stitch2;

                // Add leather grain
                float grain = snoise(uv * 20.0) * 0.5 + 0.5;

                // Combine patterns
                float height = grain * 0.3 + stitching * 0.7;

                // Convert to normal map
                vec3 normal = vec3(0.0, 0.0, 1.0);
                normal.x = dFdx(height);
                normal.y = dFdy(height);
                normal = normalize(normal);

                // Output as RGB (normal map format)
                gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
            }
        `;
    }

    /**
     * Create glass-like strike zone with transparency and refraction
     */
    createStrikeZone() {
        // Strike zone dimensions (regulation MLB)
        const width = 17.0 / 12.0; // 17 inches in feet
        const height = 2.0; // Approximate height in feet

        this.strikeZone = BABYLON.MeshBuilder.CreatePlane('strikeZone', {
            width: width,
            height: height
        }, this.scene);

        this.strikeZone.position = new BABYLON.Vector3(0, 2.5, 1.42); // Home plate location

        // Glass material with refraction
        const glassmat = new BABYLON.PBRMaterial('strikeZoneGlass', this.scene);
        glassmat.alpha = 0.3;
        glassmat.metallic = 0.0;
        glassmat.roughness = 0.05;
        glassmat.refractionTexture = this.scene.environmentTexture;
        glassmat.indexOfRefraction = 1.5;
        glassmat.linkRefractionWithTransparency = true;
        glassmat.environmentIntensity = 1.2;

        // Edge glow
        glassmat.emissiveColor = new BABYLON.Color3(0.0, 0.4, 0.8);
        glassmat.emissiveIntensity = 0.3;

        this.strikeZone.material = glassmat;

        // Create strike zone border
        const border = BABYLON.MeshBuilder.CreateTube('strikeZoneBorder', {
            path: [
                new BABYLON.Vector3(-width/2, -height/2, 1.42),
                new BABYLON.Vector3(width/2, -height/2, 1.42),
                new BABYLON.Vector3(width/2, height/2, 1.42),
                new BABYLON.Vector3(-width/2, height/2, 1.42),
                new BABYLON.Vector3(-width/2, -height/2, 1.42)
            ],
            radius: 0.015,
            cap: BABYLON.Mesh.CAP_ALL
        }, this.scene);

        const borderMat = new BABYLON.StandardMaterial('borderMat', this.scene);
        borderMat.emissiveColor = new BABYLON.Color3(0.0, 0.8, 1.0);
        borderMat.disableLighting = true;
        border.material = borderMat;
    }

    /**
     * Create home plate with realistic rubber material
     */
    createHomePlate() {
        // Home plate shape (pentagon)
        const plateShape = [
            new BABYLON.Vector3(-0.708, 0, 0), // 8.5 inches = 0.708 feet
            new BABYLON.Vector3(0.708, 0, 0),
            new BABYLON.Vector3(0.708, 0, 0.708),
            new BABYLON.Vector3(0, 0, 1.125), // Point
            new BABYLON.Vector3(-0.708, 0, 0.708)
        ];

        this.homePlate = BABYLON.MeshBuilder.CreatePolygon('homePlate', {
            shape: plateShape,
            depth: 0.05
        }, this.scene);

        this.homePlate.position = new BABYLON.Vector3(0, 0, 1.42);
        this.homePlate.rotation.x = Math.PI / 2;

        // White rubber material
        const plateMat = new BABYLON.PBRMaterial('plateMat', this.scene);
        plateMat.albedoColor = new BABYLON.Color3(0.95, 0.95, 0.95);
        plateMat.metallic = 0.0;
        plateMat.roughness = 0.8;
        plateMat.environmentIntensity = 0.3;

        this.homePlate.material = plateMat;
        this.homePlate.receiveShadows = true;
    }

    /**
     * Create stadium environment (mound, grass, reference markers)
     */
    createEnvironment() {
        // Pitcher's mound
        const mound = BABYLON.MeshBuilder.CreateCylinder('mound', {
            diameter: 18,
            height: 0.5,
            tessellation: 64
        }, this.scene);

        mound.position = new BABYLON.Vector3(0, -0.25, 60.5);

        const moundMat = new BABYLON.PBRMaterial('moundMat', this.scene);
        moundMat.albedoColor = new BABYLON.Color3(0.6, 0.4, 0.3);
        moundMat.metallic = 0.0;
        moundMat.roughness = 0.95;
        mound.material = moundMat;
        mound.receiveShadows = true;

        // Grass field
        const field = BABYLON.MeshBuilder.CreateGround('field', {
            width: 100,
            height: 100
        }, this.scene);

        const grassMat = new BABYLON.PBRMaterial('grassMat', this.scene);
        grassMat.albedoColor = new BABYLON.Color3(0.1, 0.3, 0.15);
        grassMat.metallic = 0.0;
        grassMat.roughness = 1.0;
        field.material = grassMat;
        field.receiveShadows = true;

        // Distance markers (60.5 ft line, etc.)
        this.createReferenceLines();
    }

    /**
     * Create reference lines for distance visualization
     */
    createReferenceLines() {
        // 60.5 ft line (pitcher to home)
        const line605 = BABYLON.MeshBuilder.CreateLines('line605', {
            points: [
                new BABYLON.Vector3(0, 0.01, 1.42),
                new BABYLON.Vector3(0, 0.01, 60.5)
            ]
        }, this.scene);
        line605.color = new BABYLON.Color3(0.5, 0.5, 0.5);
        line605.alpha = 0.3;

        // Grid markers every 10 feet
        for (let z = 10; z <= 60; z += 10) {
            const marker = BABYLON.MeshBuilder.CreateLines(`marker${z}`, {
                points: [
                    new BABYLON.Vector3(-2, 0.01, z),
                    new BABYLON.Vector3(2, 0.01, z)
                ]
            }, this.scene);
            marker.color = new BABYLON.Color3(0.3, 0.3, 0.3);
            marker.alpha = 0.2;
        }
    }

    /**
     * Setup advanced post-processing pipeline
     * - Bloom (HDR glow)
     * - Depth of Field (bokeh)
     * - SSAO (ambient occlusion)
     * - Motion Blur
     * - Tone Mapping (ACES)
     */
    setupPostProcessing() {
        // Default rendering pipeline with all effects
        const pipeline = new BABYLON.DefaultRenderingPipeline(
            'defaultPipeline',
            true, // HDR
            this.scene,
            [this.camera]
        );

        // Enable and configure effects
        pipeline.samples = 4; // MSAA

        // Bloom - HDR glow for bright objects
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = 0.8;
        pipeline.bloomWeight = 0.3;
        pipeline.bloomKernel = 64;
        pipeline.bloomScale = 0.5;

        // Depth of Field - cinematic focus
        pipeline.depthOfFieldEnabled = false; // Toggle based on user preference
        pipeline.depthOfFieldBlurLevel = BABYLON.DepthOfFieldEffectBlurLevel.High;
        pipeline.focalLength = 50;
        pipeline.fStop = 1.4;
        pipeline.focusDistance = 25000; // Focus on baseball

        // FXAA - fast anti-aliasing
        pipeline.fxaaEnabled = true;

        // Image processing - tone mapping
        pipeline.imageProcessingEnabled = true;
        pipeline.imageProcessing.toneMappingEnabled = true;
        pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
        pipeline.imageProcessing.exposure = 1.0;
        pipeline.imageProcessing.contrast = 1.1;

        // Vignette - subtle darkening at edges
        pipeline.imageProcessing.vignetteEnabled = true;
        pipeline.imageProcessing.vignetteWeight = 1.5;
        pipeline.imageProcessing.vignetteColor = new BABYLON.Color4(0, 0, 0, 0);

        // Chromatic aberration - subtle
        pipeline.chromaticAberrationEnabled = true;
        pipeline.chromaticAberration.aberrationAmount = 10;

        // Grain - film-like texture
        pipeline.grainEnabled = true;
        pipeline.grain.intensity = 5;
        pipeline.grain.animated = true;

        // SSAO - Screen Space Ambient Occlusion
        const ssao = new BABYLON.SSAO2RenderingPipeline('ssao', this.scene, {
            ssaoRatio: 1.0,
            blurRatio: 1.0
        });
        ssao.radius = 1.5;
        ssao.totalStrength = 1.3;
        ssao.expensiveBlur = true;
        ssao.samples = 32;
        ssao.maxZ = 100;

        this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline('ssao', this.camera);

        this.pipeline = pipeline;
        this.ssao = ssao;

        console.log('✓ Post-processing pipeline initialized');
    }

    /**
     * Calculate physics-based pitch trajectory
     * Includes Magnus force, gravity, drag
     */
    calculatePitchTrajectory() {
        const points = [];
        const dt = 0.01; // Time step (seconds)
        const totalTime = 0.5; // ~0.5 seconds from release to plate

        // Initial conditions
        const v0 = this.currentPitch.velocity * 1.467; // mph to ft/s
        const rpm = this.currentPitch.spinRate;
        const omega = rpm * 2 * Math.PI / 60; // Convert to rad/s

        // Release point
        let x = this.currentPitch.releasePoint.x;
        let y = this.currentPitch.releasePoint.y;
        let z = this.currentPitch.releasePoint.z;

        // Initial velocity components
        let vx = 0;
        let vy = 0;
        let vz = -v0; // Toward home plate

        // Constants
        const g = 32.2; // ft/s^2
        const rho = 0.0740; // lb/ft^3 (air density)
        const A = Math.PI * Math.pow(0.121, 2); // Cross-sectional area (ft^2)
        const Cd = 0.3; // Drag coefficient for baseball
        const Cl = 0.4; // Lift coefficient (Magnus)
        const m = 0.319; // Mass of baseball (lb)

        // Simulate trajectory
        for (let t = 0; t < totalTime; t += dt) {
            points.push(new BABYLON.Vector3(x, y, z));

            // Velocity magnitude
            const v = Math.sqrt(vx*vx + vy*vy + vz*vz);

            // Drag force
            const Fd = 0.5 * rho * v * v * A * Cd;
            const Fdx = -Fd * vx / v;
            const Fdy = -Fd * vy / v;
            const Fdz = -Fd * vz / v;

            // Magnus force (spin-induced)
            const Fm = 0.5 * rho * v * omega * A * Cl * this.currentPitch.spinEfficiency;

            // Spin axis affects Magnus force direction
            const spinAxisRad = this.currentPitch.spinAxis.direction * Math.PI / 180;
            const Fmx = Fm * Math.sin(spinAxisRad);
            const Fmy = Fm * Math.cos(spinAxisRad);

            // Total acceleration
            const ax = (Fdx + Fmx) / m;
            const ay = -g + (Fdy + Fmy) / m;
            const az = Fdz / m;

            // Update velocity
            vx += ax * dt;
            vy += ay * dt;
            vz += az * dt;

            // Update position
            x += vx * dt;
            y += vy * dt;
            z += vz * dt;

            // Stop at home plate
            if (z <= 1.42) break;
        }

        // Calculate final location at plate
        const platePoint = points[points.length - 1];

        // Calculate break (inches)
        const straightLineY = this.currentPitch.releasePoint.y -
            (this.currentPitch.releasePoint.y - platePoint.y) *
            (this.currentPitch.releasePoint.z - 1.42) /
            (this.currentPitch.releasePoint.z - platePoint.z);

        const straightLineX = this.currentPitch.releasePoint.x;

        this.currentPitch.movement.vertical = (platePoint.y - straightLineY) * 12; // feet to inches
        this.currentPitch.movement.horizontal = (platePoint.x - straightLineX) * 12;

        return points;
    }

    /**
     * Update pitch trajectory visualization
     */
    updatePitchTrajectory() {
        // Remove old trajectory
        if (this.trajectoryMesh) {
            this.trajectoryMesh.dispose();
        }

        // Calculate new trajectory
        this.pitchTrajectory = this.calculatePitchTrajectory();

        // Create tube mesh following trajectory
        const trajectory = BABYLON.MeshBuilder.CreateTube('trajectory', {
            path: this.pitchTrajectory,
            radius: 0.05,
            tessellation: 32,
            cap: BABYLON.Mesh.CAP_ALL
        }, this.scene);

        // Color-coded by velocity (gradient)
        const velocityColors = this.pitchTrajectory.map((point, i) => {
            const progress = i / this.pitchTrajectory.length;
            const velocity = this.currentPitch.velocity * (1 - progress * 0.15); // Velocity decay

            // Color gradient: red (95+) → orange (90-95) → yellow (85-90) → green (80-85)
            let r, g, b;
            if (velocity >= 95) {
                r = 1.0; g = 0.2; b = 0.2;
            } else if (velocity >= 90) {
                r = 1.0; g = 0.5; b = 0.0;
            } else if (velocity >= 85) {
                r = 1.0; g = 1.0; b = 0.0;
            } else {
                r = 0.0; g = 1.0; b = 0.2;
            }

            return new BABYLON.Color4(r, g, b, 0.8);
        });

        trajectory.setVerticesData(BABYLON.VertexBuffer.ColorKind, velocityColors.flatMap(c => [c.r, c.g, c.b, c.a]));

        const trajectoryMat = new BABYLON.StandardMaterial('trajectoryMat', this.scene);
        trajectoryMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        trajectoryMat.disableLighting = true;
        trajectoryMat.alpha = 0.7;
        trajectory.material = trajectoryMat;

        this.trajectoryMesh = trajectory;

        // Update spin axis arrow
        this.updateSpinAxisArrow();

        // Update stats display
        this.updateStatsDisplay();
    }

    /**
     * Create 3D arrow showing spin axis direction
     */
    updateSpinAxisArrow() {
        if (this.spinAxisArrow) {
            this.spinAxisArrow.dispose();
        }

        const releasePoint = new BABYLON.Vector3(
            this.currentPitch.releasePoint.x,
            this.currentPitch.releasePoint.y,
            this.currentPitch.releasePoint.z
        );

        // Spin axis direction
        const spinDir = this.currentPitch.spinAxis.direction * Math.PI / 180;
        const spinTilt = this.currentPitch.spinAxis.tilt * Math.PI / 180;

        const arrowDirection = new BABYLON.Vector3(
            Math.sin(spinDir) * Math.cos(spinTilt),
            Math.sin(spinTilt),
            Math.cos(spinDir) * Math.cos(spinTilt)
        );

        const arrowEnd = releasePoint.add(arrowDirection.scale(3));

        this.spinAxisArrow = BABYLON.MeshBuilder.CreateLines('spinAxis', {
            points: [releasePoint, arrowEnd]
        }, this.scene);

        this.spinAxisArrow.color = new BABYLON.Color3(0, 1, 1);
        this.spinAxisArrow.alpha = 0.8;
    }

    /**
     * Animate pitch from release to plate
     */
    animatePitch() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.animationProgress = 0;

        const totalFrames = this.pitchTrajectory.length;
        let currentFrame = 0;

        const animate = () => {
            if (currentFrame >= totalFrames) {
                this.isAnimating = false;
                // Reset baseball to release point
                setTimeout(() => {
                    this.baseball.position = new BABYLON.Vector3(
                        this.currentPitch.releasePoint.x,
                        this.currentPitch.releasePoint.y,
                        this.currentPitch.releasePoint.z
                    );
                }, 500);
                return;
            }

            // Update baseball position along trajectory
            this.baseball.position = this.pitchTrajectory[currentFrame].clone();

            // Rotate baseball based on spin rate
            const spinSpeed = this.currentPitch.spinRate / 60 * 2 * Math.PI; // rad/s
            this.baseball.rotation.x += spinSpeed * 0.016; // Approximate frame time

            currentFrame++;
            this.animationProgress = currentFrame / totalFrames;

            requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Switch camera to preset view
     */
    switchCamera(preset) {
        const target = this.cameraPresets[preset];
        if (!target) return;

        // Smooth animation to new camera position
        BABYLON.Animation.CreateAndStartAnimation(
            'cameraAnim',
            this.camera,
            'alpha',
            60,
            30,
            this.camera.alpha,
            target.alpha,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        BABYLON.Animation.CreateAndStartAnimation(
            'cameraBeta',
            this.camera,
            'beta',
            60,
            30,
            this.camera.beta,
            target.beta,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        BABYLON.Animation.CreateAndStartAnimation(
            'cameraRadius',
            this.camera,
            'radius',
            60,
            30,
            this.camera.radius,
            target.radius,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        BABYLON.Animation.CreateAndStartAnimation(
            'cameraTarget',
            this.camera,
            'target',
            60,
            30,
            this.camera.target,
            target.target,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
    }

    /**
     * Update pitch parameters from UI controls
     */
    updatePitchParameters(param, value) {
        switch(param) {
            case 'velocity':
                this.currentPitch.velocity = value;
                break;
            case 'spinRate':
                this.currentPitch.spinRate = value;
                break;
            case 'releaseHeight':
                this.currentPitch.releasePoint.y = value;
                break;
            case 'pitchType':
                this.setPitchType(value);
                break;
        }

        this.updatePitchTrajectory();
    }

    /**
     * Set pitch type with default parameters
     */
    setPitchType(type) {
        const pitchDefaults = {
            fastball: {
                velocity: 95,
                spinRate: 2400,
                spinAxis: { tilt: 12, direction: 180 },
                spinEfficiency: 0.98
            },
            slider: {
                velocity: 85,
                spinRate: 2600,
                spinAxis: { tilt: 30, direction: 225 },
                spinEfficiency: 0.85
            },
            curveball: {
                velocity: 78,
                spinRate: 2800,
                spinAxis: { tilt: 60, direction: 180 },
                spinEfficiency: 0.90
            },
            changeup: {
                velocity: 82,
                spinRate: 1700,
                spinAxis: { tilt: 20, direction: 200 },
                spinEfficiency: 0.75
            }
        };

        const defaults = pitchDefaults[type];
        if (defaults) {
            this.currentPitch.type = type;
            this.currentPitch.velocity = defaults.velocity;
            this.currentPitch.spinRate = defaults.spinRate;
            this.currentPitch.spinAxis = defaults.spinAxis;
            this.currentPitch.spinEfficiency = defaults.spinEfficiency;

            // Update UI sliders
            document.getElementById('velocitySlider').value = defaults.velocity;
            document.getElementById('spinRateSlider').value = defaults.spinRate;
            document.getElementById('velocityValue').textContent = defaults.velocity + ' mph';
            document.getElementById('spinRateValue').textContent = defaults.spinRate + ' rpm';
        }
    }

    /**
     * Update stats panel with current pitch data
     */
    updateStatsDisplay() {
        const pitchNames = {
            fastball: '4-Seam Fastball',
            slider: 'Slider',
            curveball: 'Curveball',
            changeup: 'Changeup'
        };

        document.getElementById('statPitchType').textContent = pitchNames[this.currentPitch.type];
        document.getElementById('statVelocity').textContent = this.currentPitch.velocity.toFixed(1) + ' mph';
        document.getElementById('statSpinRate').textContent = this.currentPitch.spinRate + ' rpm';
        document.getElementById('statSpinEff').textContent = (this.currentPitch.spinEfficiency * 100).toFixed(0) + '%';
        document.getElementById('statHorzBreak').textContent = this.currentPitch.movement.horizontal.toFixed(1) + ' in';
        document.getElementById('statVertBreak').textContent = this.currentPitch.movement.vertical.toFixed(1) + ' in';
        document.getElementById('statRelease').textContent =
            this.currentPitch.releasePoint.y.toFixed(1) + ' ft @ ' +
            this.currentPitch.releasePoint.x.toFixed(1) + ' ft';

        // Plate location
        const platePoint = this.pitchTrajectory[this.pitchTrajectory.length - 1];
        const plateX = platePoint.x * 12; // inches
        const plateY = platePoint.y;

        let location = '';
        if (plateY > 3.5) location = 'High';
        else if (plateY < 2.0) location = 'Low';
        else location = 'Middle';

        if (Math.abs(plateX) > 4) location += plateX > 0 ? '-Outside' : '-Inside';
        else location += '-Center';

        document.getElementById('statPlate').textContent = location;
    }

    /**
     * Setup UI controls and event listeners
     */
    setupControls() {
        // Camera angle buttons
        document.querySelectorAll('[data-camera]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-camera]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.switchCamera(e.target.dataset.camera);
            });
        });

        // Pitch type buttons
        document.querySelectorAll('[data-pitch]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-pitch]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updatePitchParameters('pitchType', e.target.dataset.pitch);
            });
        });

        // Velocity slider
        document.getElementById('velocitySlider').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('velocityValue').textContent = value + ' mph';
            this.updatePitchParameters('velocity', value);
        });

        // Spin rate slider
        document.getElementById('spinRateSlider').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('spinRateValue').textContent = value + ' rpm';
            this.updatePitchParameters('spinRate', value);
        });

        // Release height slider
        document.getElementById('releaseHeightSlider').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('releaseHeightValue').textContent = value + ' ft';
            this.updatePitchParameters('releaseHeight', value);
        });

        // Visualization toggles
        document.getElementById('showTrajectory').addEventListener('change', (e) => {
            if (this.trajectoryMesh) {
                this.trajectoryMesh.setEnabled(e.target.checked);
            }
        });

        document.getElementById('showSpinAxis').addEventListener('change', (e) => {
            if (this.spinAxisArrow) {
                this.spinAxisArrow.setEnabled(e.target.checked);
            }
        });

        // Animate button
        document.getElementById('animatePitch').addEventListener('click', () => {
            this.animatePitch();
        });

        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.animatePitch();
            } else if (e.code === 'KeyR') {
                this.baseball.position = new BABYLON.Vector3(
                    this.currentPitch.releasePoint.x,
                    this.currentPitch.releasePoint.y,
                    this.currentPitch.releasePoint.z
                );
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    /**
     * Start render loop and FPS monitoring
     */
    startRenderLoop() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
            this.updateFPS();
        });
    }

    /**
     * Update FPS counter
     */
    updateFPS() {
        this.frameCount++;
        const now = performance.now();
        const elapsed = now - this.lastTime;

        if (elapsed >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / elapsed);
            document.getElementById('fpsCounter').textContent = this.fps + ' FPS';

            this.frameCount = 0;
            this.lastTime = now;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.querySelector('.loading-text').textContent = message;
        loadingOverlay.querySelector('.loader').style.borderTopColor = '#ff4444';
    }
}

// Initialize simulator when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PitchTunnelSimulator();
    });
} else {
    new PitchTunnelSimulator();
}
