/**
 * Championship 3D Visualizer
 * Advanced Three.js Visualizations with WebGL Optimization
 *
 * Blaze Sports Intel - Deep South Sports Authority
 * Elite championship analytics visualization platform
 */

class Championship3DVisualizer {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);

        if (!this.container) {
            throw new Error(`Container element with ID '${containerId}' not found`);
        }

        // Configuration
        this.config = {
            antialias: options.antialias !== false,
            alpha: options.alpha !== false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
            premultipliedAlpha: false,
            precision: 'highp',
            ...options
        };

        // Scene components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Animation and performance
        this.animationId = null;
        this.clock = new THREE.Clock();
        this.stats = null;
        this.performanceMonitor = new PerformanceMonitor();

        // Visualization data
        this.sportsData = new Map();
        this.visualElements = new Map();
        this.activeVisualizations = new Set();

        // Championship themes
        this.themes = {
            deepSouth: {
                colors: {
                    primary: 0xBF5700,    // Burnt Orange
                    secondary: 0x9BCBEB,  // Cardinal Sky Blue
                    accent: 0x00B2A9,     // Grizzly Teal
                    background: 0x002244  // Tennessee Deep
                },
                lighting: 'championship',
                effects: 'premium'
            },
            cardinals: {
                colors: {
                    primary: 0xC41E3A,    // Cardinals Red
                    secondary: 0xFFB81C,  // Cardinals Yellow
                    accent: 0x0C2340,     // Cardinals Navy
                    background: 0x1a1a1a
                },
                lighting: 'baseball',
                effects: 'stadium'
            },
            titans: {
                colors: {
                    primary: 0x0C2340,    // Titans Navy
                    secondary: 0x4B92DB,  // Titans Blue
                    accent: 0xC8102E,     // Titans Red
                    background: 0x1a1a1a
                },
                lighting: 'football',
                effects: 'gridiron'
            },
            grizzlies: {
                colors: {
                    primary: 0x5D76A9,    // Grizzlies Blue
                    secondary: 0xF5B112,  // Grizzlies Gold
                    accent: 0x12173F,     // Grizzlies Navy
                    background: 0x1a1a1a
                },
                lighting: 'basketball',
                effects: 'arena'
            }
        };

        this.currentTheme = 'deepSouth';
        this.initialize();
    }

    async initialize() {

        try {
            await this.setupRenderer();
            this.setupScene();
            this.setupCamera();
            this.setupLighting();
            this.setupControls();
            this.setupPostProcessing();
            this.setupEventListeners();

            // Start render loop
            this.startRenderLoop();

            return true;
        } catch (error) {
            console.error('❌ 3D Visualizer Initialization Failed:', error);
            return false;
        }
    }

    // ========================= CORE SETUP =========================

    async setupRenderer() {
        // Check WebGL support
        if (!this.isWebGLSupported()) {
            throw new Error('WebGL not supported');
        }

        // Create renderer with optimization
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.config.antialias,
            alpha: this.config.alpha,
            powerPreference: this.config.powerPreference,
            precision: this.config.precision
        });

        // Configure renderer
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Shadow settings for championship quality
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;

        // Performance optimizations
        this.renderer.info.autoReset = false;
        this.renderer.sortObjects = true;
        this.renderer.autoClear = true;

        this.container.appendChild(this.renderer.domElement);
    }

    setupScene() {
        this.scene = new THREE.Scene();

        // Set theme-based background
        const theme = this.themes[this.currentTheme];
        this.scene.background = new THREE.Color(theme.colors.background);

        // Add fog for depth
        this.scene.fog = new THREE.Fog(theme.colors.background, 50, 200);
    }

    setupCamera() {
        const aspect = this.container.clientWidth / this.container.clientHeight;

        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 20, 50);
        this.camera.lookAt(0, 0, 0);
    }

    setupLighting() {
        const theme = this.themes[this.currentTheme];

        // Remove existing lights
        this.scene.children = this.scene.children.filter(child => !(child instanceof THREE.Light));

        switch (theme.lighting) {
            case 'championship':
                this.setupChampionshipLighting();
                break;
            case 'baseball':
                this.setupStadiumLighting();
                break;
            case 'football':
                this.setupGridironLighting();
                break;
            case 'basketball':
                this.setupArenaLighting();
                break;
            default:
                this.setupChampionshipLighting();
        }
    }

    setupChampionshipLighting() {
        // Premium championship lighting setup
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
        mainLight.position.set(50, 100, 50);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 200;
        mainLight.shadow.camera.left = -50;
        mainLight.shadow.camera.right = 50;
        mainLight.shadow.camera.top = 50;
        mainLight.shadow.camera.bottom = -50;
        this.scene.add(mainLight);

        // Accent lights for depth
        const accentLight1 = new THREE.SpotLight(this.themes[this.currentTheme].colors.accent, 0.8, 100, Math.PI / 4, 0.1);
        accentLight1.position.set(-30, 40, 30);
        this.scene.add(accentLight1);

        const accentLight2 = new THREE.SpotLight(this.themes[this.currentTheme].colors.secondary, 0.6, 80, Math.PI / 6, 0.1);
        accentLight2.position.set(30, 30, -20);
        this.scene.add(accentLight2);
    }

    setupStadiumLighting() {
        // Baseball stadium lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // Stadium lights (4 corners)
        const stadiumPositions = [
            [40, 60, 40], [-40, 60, 40], [40, 60, -40], [-40, 60, -40]
        ];

        stadiumPositions.forEach((pos, index) => {
            const light = new THREE.SpotLight(0xffffff, 1.2, 150, Math.PI / 3, 0.2);
            light.position.set(...pos);
            light.target.position.set(0, 0, 0);
            light.castShadow = index < 2; // Only front lights cast shadows for performance
            if (light.castShadow) {
                light.shadow.mapSize.width = 1024;
                light.shadow.mapSize.height = 1024;
            }
            this.scene.add(light);
            this.scene.add(light.target);
        });
    }

    setupGridironLighting() {
        // Football field lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.35);
        this.scene.add(ambientLight);

        // Field lights (along sidelines)
        for (let i = 0; i < 6; i++) {
            const x = (i - 2.5) * 20;
            const leftLight = new THREE.SpotLight(0xffffff, 1.0, 120, Math.PI / 4, 0.15);
            leftLight.position.set(x, 50, 40);
            leftLight.target.position.set(x, 0, 0);

            const rightLight = new THREE.SpotLight(0xffffff, 1.0, 120, Math.PI / 4, 0.15);
            rightLight.position.set(x, 50, -40);
            rightLight.target.position.set(x, 0, 0);

            this.scene.add(leftLight, rightLight);
            this.scene.add(leftLight.target, rightLight.target);
        }
    }

    setupArenaLighting() {
        // Basketball arena lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Center court lighting
        const centerLight = new THREE.PointLight(0xffffff, 1.5, 100);
        centerLight.position.set(0, 40, 0);
        centerLight.castShadow = true;
        centerLight.shadow.mapSize.width = 1024;
        centerLight.shadow.mapSize.height = 1024;
        this.scene.add(centerLight);

        // Corner lights
        const cornerPositions = [[25, 35, 25], [-25, 35, 25], [25, 35, -25], [-25, 35, -25]];
        cornerPositions.forEach(pos => {
            const light = new THREE.SpotLight(0xffffff, 0.8, 80, Math.PI / 5, 0.1);
            light.position.set(...pos);
            light.target.position.set(0, 0, 0);
            this.scene.add(light);
            this.scene.add(light.target);
        });
    }

    setupControls() {
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2;
            this.controls.minDistance = 10;
            this.controls.maxDistance = 200;
            this.controls.autoRotate = false;
            this.controls.autoRotateSpeed = 0.5;
        }
    }

    setupPostProcessing() {
        // Advanced post-processing for championship quality
        if (typeof THREE.EffectComposer !== 'undefined') {
            this.composer = new THREE.EffectComposer(this.renderer);

            // Render pass
            const renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);

            // FXAA anti-aliasing
            if (THREE.FXAAShader) {
                const fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
                fxaaPass.material.uniforms['resolution'].value.x = 1 / this.container.clientWidth;
                fxaaPass.material.uniforms['resolution'].value.y = 1 / this.container.clientHeight;
                this.composer.addPass(fxaaPass);
            }

            // Bloom effect for championship glow
            if (THREE.UnrealBloomPass) {
                const bloomPass = new THREE.UnrealBloomPass(
                    new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
                    1.5, 0.4, 0.85
                );
                this.composer.addPass(bloomPass);
            }
        }
    }

    // ========================= SPORTS VISUALIZATIONS =========================

    async createBaseballVisualization(data) {

        const group = new THREE.Group();
        group.name = 'baseball_visualization';

        // Baseball field
        const field = this.createBaseballField();
        group.add(field);

        // Player positions
        if (data.players) {
            const players = this.createPlayerPositions(data.players, 'baseball');
            group.add(players);
        }

        // Analytics overlays
        if (data.analytics) {
            const analytics = this.createAnalyticsOverlay(data.analytics, 'baseball');
            group.add(analytics);
        }

        // Pitch trajectory visualization
        if (data.pitches) {
            const trajectories = this.createPitchTrajectories(data.pitches);
            group.add(trajectories);
        }

        this.scene.add(group);
        this.visualElements.set('baseball', group);
        this.activeVisualizations.add('baseball');

        return group;
    }

    async createFootballVisualization(data) {

        const group = new THREE.Group();
        group.name = 'football_visualization';

        // Football field
        const field = this.createFootballField();
        group.add(field);

        // Player formations
        if (data.formation) {
            const formation = this.createFormationVisualization(data.formation);
            group.add(formation);
        }

        // Play analysis
        if (data.plays) {
            const plays = this.createPlayAnalysis(data.plays);
            group.add(plays);
        }

        // Pressure visualization
        if (data.pressure) {
            const pressure = this.createPressureVisualization(data.pressure);
            group.add(pressure);
        }

        this.scene.add(group);
        this.visualElements.set('football', group);
        this.activeVisualizations.add('football');

        return group;
    }

    async createBasketballVisualization(data) {

        const group = new THREE.Group();
        group.name = 'basketball_visualization';

        // Basketball court
        const court = this.createBasketballCourt();
        group.add(court);

        // Shot charts
        if (data.shots) {
            const shotChart = this.createShotChart(data.shots);
            group.add(shotChart);
        }

        // Player movement
        if (data.movement) {
            const movement = this.createMovementVisualization(data.movement);
            group.add(movement);
        }

        // Defensive zones
        if (data.defense) {
            const defense = this.createDefensiveZones(data.defense);
            group.add(defense);
        }

        this.scene.add(group);
        this.visualElements.set('basketball', group);
        this.activeVisualizations.add('basketball');

        return group;
    }

    // ========================= FIELD/COURT CREATION =========================

    createBaseballField() {
        const field = new THREE.Group();

        // Infield dirt
        const infieldGeometry = new THREE.CircleGeometry(30, 32);
        const infieldMaterial = new THREE.MeshLambertMaterial({
            color: 0x8B4513,
            transparent: true,
            opacity: 0.8
        });
        const infield = new THREE.Mesh(infieldGeometry, infieldMaterial);
        infield.rotation.x = -Math.PI / 2;
        infield.receiveShadow = true;
        field.add(infield);

        // Grass
        const grassGeometry = new THREE.PlaneGeometry(100, 100);
        const grassMaterial = new THREE.MeshLambertMaterial({
            color: 0x228B22,
            transparent: true,
            opacity: 0.6
        });
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = -0.1;
        grass.receiveShadow = true;
        field.add(grass);

        // Base paths
        this.createBasePaths(field);

        // Pitcher's mound
        const moundGeometry = new THREE.CylinderGeometry(3, 3, 0.5, 16);
        const moundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const mound = new THREE.Mesh(moundGeometry, moundMaterial);
        mound.position.set(0, 0.25, 18.44); // 60'6" from home plate
        mound.castShadow = true;
        field.add(mound);

        return field;
    }

    createFootballField() {
        const field = new THREE.Group();

        // Field surface
        const fieldGeometry = new THREE.PlaneGeometry(120, 53.3); // 120 yards x 53.3 yards
        const fieldMaterial = new THREE.MeshLambertMaterial({
            color: 0x228B22,
            transparent: true,
            opacity: 0.8
        });
        const fieldSurface = new THREE.Mesh(fieldGeometry, fieldMaterial);
        fieldSurface.rotation.x = -Math.PI / 2;
        fieldSurface.receiveShadow = true;
        field.add(fieldSurface);

        // Yard lines
        this.createYardLines(field);

        // End zones
        this.createEndZones(field);

        // Hash marks
        this.createHashMarks(field);

        return field;
    }

    createBasketballCourt() {
        const court = new THREE.Group();

        // Court surface
        const courtGeometry = new THREE.PlaneGeometry(28.65, 15.24); // NBA court dimensions in meters
        const courtMaterial = new THREE.MeshLambertMaterial({
            color: 0xD2691E,
            transparent: true,
            opacity: 0.9
        });
        const courtSurface = new THREE.Mesh(courtGeometry, courtMaterial);
        courtSurface.rotation.x = -Math.PI / 2;
        courtSurface.receiveShadow = true;
        court.add(courtSurface);

        // Court lines
        this.createCourtLines(court);

        // Hoops
        this.createBasketballHoops(court);

        return court;
    }

    // ========================= HELPER METHODS FOR FIELD CREATION =========================

    createBasePaths(field) {
        const basePositions = [
            [0, 0, 0],      // Home plate
            [27.43, 0, 27.43], // First base
            [0, 0, 38.79],     // Second base
            [-27.43, 0, 27.43] // Third base
        ];

        basePositions.forEach((pos, index) => {
            if (index === 0) return; // Skip home plate for now

            const baseGeometry = new THREE.BoxGeometry(0.38, 0.05, 0.38);
            const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.set(...pos);
            base.position.y = 0.025;
            base.castShadow = true;
            field.add(base);
        });
    }

    createYardLines(field) {
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

        // Create yard lines every 5 yards
        for (let i = -50; i <= 50; i += 5) {
            const lineGeometry = new THREE.PlaneGeometry(0.1, 53.3);
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.set(i, 0.01, 0);
            line.rotation.x = -Math.PI / 2;
            field.add(line);
        }
    }

    createEndZones(field) {
        const endZoneMaterial = new THREE.MeshLambertMaterial({
            color: this.themes[this.currentTheme].colors.accent,
            transparent: true,
            opacity: 0.3
        });

        // End zones
        [-50, 50].forEach(x => {
            const endZoneGeometry = new THREE.PlaneGeometry(10, 53.3);
            const endZone = new THREE.Mesh(endZoneGeometry, endZoneMaterial);
            endZone.position.set(x, 0.005, 0);
            endZone.rotation.x = -Math.PI / 2;
            field.add(endZone);
        });
    }

    createHashMarks(field) {
        const hashMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

        for (let yard = -45; yard <= 45; yard += 5) {
            [-9.1, 9.1].forEach(z => {
                const hashGeometry = new THREE.PlaneGeometry(0.05, 0.6);
                const hash = new THREE.Mesh(hashGeometry, hashMaterial);
                hash.position.set(yard, 0.01, z);
                hash.rotation.x = -Math.PI / 2;
                field.add(hash);
            });
        }
    }

    createCourtLines(court) {
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

        // Three-point lines
        const threePointGeometry = new THREE.RingGeometry(7.24, 7.29, 0, Math.PI, 32);
        const threePointLeft = new THREE.Mesh(threePointGeometry, lineMaterial);
        threePointLeft.position.set(-11.33, 0.01, 0);
        threePointLeft.rotation.x = -Math.PI / 2;
        threePointLeft.rotation.z = Math.PI;
        court.add(threePointLeft);

        const threePointRight = new THREE.Mesh(threePointGeometry, lineMaterial);
        threePointRight.position.set(11.33, 0.01, 0);
        threePointRight.rotation.x = -Math.PI / 2;
        court.add(threePointRight);

        // Free throw circles
        const freeThrowGeometry = new THREE.RingGeometry(1.8, 1.85, 0, Math.PI * 2, 32);
        const freeThrowLeft = new THREE.Mesh(freeThrowGeometry, lineMaterial);
        freeThrowLeft.position.set(-5.8, 0.01, 0);
        freeThrowLeft.rotation.x = -Math.PI / 2;
        court.add(freeThrowLeft);

        const freeThrowRight = new THREE.Mesh(freeThrowGeometry, lineMaterial);
        freeThrowRight.position.set(5.8, 0.01, 0);
        freeThrowRight.rotation.x = -Math.PI / 2;
        court.add(freeThrowRight);
    }

    createBasketballHoops(court) {
        const hoopMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6600 });

        [-14.33, 14.33].forEach(x => {
            // Rim
            const rimGeometry = new THREE.RingGeometry(0.225, 0.23, 0, Math.PI * 2, 16);
            const rim = new THREE.Mesh(rimGeometry, hoopMaterial);
            rim.position.set(x, 3.05, 0);
            rim.rotation.x = -Math.PI / 2;
            court.add(rim);

            // Backboard
            const backboardGeometry = new THREE.PlaneGeometry(1.83, 1.07);
            const backboardMaterial = new THREE.MeshLambertMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.8
            });
            const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
            backboard.position.set(x, 3.5, 0);
            court.add(backboard);
        });
    }

    // ========================= ANALYTICS VISUALIZATIONS =========================

    createAnalyticsOverlay(analyticsData, sport) {
        const overlay = new THREE.Group();
        overlay.name = `${sport}_analytics_overlay`;

        // Create heat maps for different metrics
        if (analyticsData.heatmap) {
            const heatmap = this.createHeatMap(analyticsData.heatmap);
            overlay.add(heatmap);
        }

        // Performance indicators
        if (analyticsData.performance) {
            const indicators = this.createPerformanceIndicators(analyticsData.performance);
            overlay.add(indicators);
        }

        // Trend arrows
        if (analyticsData.trends) {
            const trends = this.createTrendVisualization(analyticsData.trends);
            overlay.add(trends);
        }

        return overlay;
    }

    createHeatMap(heatmapData) {
        const heatmap = new THREE.Group();

        heatmapData.points.forEach(point => {
            const intensity = point.value / heatmapData.maxValue;
            const color = new THREE.Color().setHSL(0.7 - (intensity * 0.7), 1, 0.5);

            const pointGeometry = new THREE.CircleGeometry(point.radius || 1, 16);
            const pointMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.6
            });

            const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
            pointMesh.position.set(point.x, 0.1, point.z);
            pointMesh.rotation.x = -Math.PI / 2;

            heatmap.add(pointMesh);
        });

        return heatmap;
    }

    createPerformanceIndicators(performanceData) {
        const indicators = new THREE.Group();

        performanceData.forEach(indicator => {
            // Create 3D bar or cylinder for each metric
            const height = indicator.value * 10; // Scale for visibility
            const geometry = new THREE.CylinderGeometry(0.5, 0.5, height, 8);

            // Color based on performance level
            let color = 0x00FF00; // Green for good
            if (indicator.value < 0.3) color = 0xFF0000; // Red for poor
            else if (indicator.value < 0.7) color = 0xFFFF00; // Yellow for average

            const material = new THREE.MeshLambertMaterial({ color });
            const mesh = new THREE.Mesh(geometry, material);

            mesh.position.set(indicator.x, height / 2, indicator.z);
            mesh.castShadow = true;

            // Add label
            if (indicator.label) {
                const labelSprite = this.createTextSprite(indicator.label);
                labelSprite.position.set(indicator.x, height + 2, indicator.z);
                indicators.add(labelSprite);
            }

            indicators.add(mesh);
        });

        return indicators;
    }

    createTrendVisualization(trendsData) {
        const trends = new THREE.Group();

        trendsData.forEach(trend => {
            // Create arrow indicating trend direction
            const arrowGeometry = new THREE.ConeGeometry(0.3, 2, 8);
            const arrowMaterial = new THREE.MeshLambertMaterial({
                color: trend.direction > 0 ? 0x00FF00 : 0xFF0000
            });

            const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
            arrow.position.set(trend.x, 1, trend.z);

            // Rotate based on trend direction
            if (trend.direction < 0) {
                arrow.rotation.z = Math.PI;
            }

            arrow.castShadow = true;
            trends.add(arrow);
        });

        return trends;
    }

    createTextSprite(text, options = {}) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const fontSize = options.fontSize || 32;

        canvas.width = 256;
        canvas.height = 64;

        context.fillStyle = options.backgroundColor || 'rgba(0,0,0,0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = options.textColor || '#ffffff';
        context.font = `${fontSize}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);

        sprite.scale.set(4, 1, 1);
        return sprite;
    }

    // ========================= ANIMATION & PERFORMANCE =========================

    startRenderLoop() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);

            // Update controls
            if (this.controls) {
                this.controls.update();
            }

            // Update performance monitor
            this.performanceMonitor.update();

            // Render scene
            if (this.composer) {
                this.composer.render();
            } else {
                this.renderer.render(this.scene, this.camera);
            }

            // Update stats
            if (this.stats) {
                this.stats.update();
            }
        };

        animate();
    }

    // ========================= UTILITY METHODS =========================

    isWebGLSupported() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (
                canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl')
            ));
        } catch (e) {
            return false;
        }
    }

    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle theme changes
        document.addEventListener('themeChange', (event) => {
            this.setTheme(event.detail.theme);
        });

        // Handle analytics updates
        document.addEventListener('analyticsUpdate', (event) => {
            this.updateVisualization(event.detail);
        });
    }

    handleResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);

        if (this.composer) {
            this.composer.setSize(width, height);
        }
    }

    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            this.setupLighting();

            // Update scene background
            const theme = this.themes[themeName];
            this.scene.background = new THREE.Color(theme.colors.background);
            this.scene.fog.color = new THREE.Color(theme.colors.background);
        }
    }

    updateVisualization(data) {
        const { sport, metric, data: metricData } = data;

        if (this.activeVisualizations.has(sport)) {
            // Update existing visualization
            this.refreshVisualizationData(sport, metric, metricData);
        }
    }

    refreshVisualizationData(sport, metric, data) {
        const visualization = this.visualElements.get(sport);
        if (!visualization) return;

        // Update analytics overlay
        const overlay = visualization.getObjectByName(`${sport}_analytics_overlay`);
        if (overlay) {
            // Remove old overlay
            visualization.remove(overlay);

            // Create new overlay with updated data
            const newOverlay = this.createAnalyticsOverlay(data, sport);
            visualization.add(newOverlay);
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        // Clean up all geometries and materials
        this.scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });

        this.container.removeChild(this.renderer.domElement);
    }
}

// ========================= PERFORMANCE MONITOR =========================

class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.memory = {};
    }

    update() {
        this.frameCount++;
        const currentTime = performance.now();

        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;

            // Monitor memory usage
            if (performance.memory) {
                this.memory = {
                    used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                    total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
                };
            }

            this.logPerformance();
        }
    }

    logPerformance() {
        if (this.fps < 30) {
            console.warn(`⚠️ Low FPS detected: ${this.fps}`);
        }

        if (this.memory.used && this.memory.used > 100) {
            console.warn(`⚠️ High memory usage: ${this.memory.used}MB`);
        }
    }

    getStats() {
        return {
            fps: this.fps,
            memory: this.memory,
            timestamp: new Date().toISOString()
        };
    }
}

// ========================= EXPORT =========================

// Make available globally
if (typeof window !== 'undefined') {
    window.Championship3DVisualizer = Championship3DVisualizer;
    window.PerformanceMonitor = PerformanceMonitor;
}

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Championship3DVisualizer, PerformanceMonitor };
}

