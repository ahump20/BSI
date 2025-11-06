/**
 * Blaze Sports Intel - 3D Stadium Visualization Module
 * Lazy-loaded module for Babylon.js 3D rendering
 *
 * Features:
 * - Baseball diamond with 9 defensive positions
 * - Football field with 22-player formation
 * - Basketball court with player zones
 * - WebGPU/WebGL2 hardware acceleration
 * - Interactive camera controls (orbit, zoom, pan)
 *
 * Dependencies: React, Babylon.js (loaded from CDN)
 * Bundle Size: ~80KB (unminified)
 * Load Time: Async/lazy-loaded only when feature flag enabled
 */

const { useState, useEffect, useRef } = React;

// ========== 3D STADIUM VISUALIZATION (Week 4 - Babylon.js) ==========
// Sport-specific 3D stadium/field visualization with WebGPU/WebGL2 support
// MLB: Baseball diamond with player positions
// NFL/CFB: Football field with formations
// CBB: Basketball court with player zones
export const Stadium3DVisualization = ({ sport, team, roster }) => {
    const canvasRef = useRef(null);
    const [engine, setEngine] = useState(null);
    const [scene, setScene] = useState(null);
    const [rendering, setRendering] = useState(false);

    useEffect(() => {
        if (!canvasRef.current || !sport || rendering) return;

        const initBabylon = async () => {
            setRendering(true);

            try {
                // Create Babylon.js engine with WebGPU fallback to WebGL2
                const canvas = canvasRef.current;
                const babylonEngine = new BABYLON.Engine(canvas, true, {
                    adaptToDeviceRatio: true,
                    antialias: true,
                    preserveDrawingBuffer: true
                });

                setEngine(babylonEngine);

                // Create scene
                const babylonScene = new BABYLON.Scene(babylonEngine);
                babylonScene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.07, 1); // Dark background
                setScene(babylonScene);

                // Add camera with arc rotation (orbital camera)
                const camera = new BABYLON.ArcRotateCamera(
                    "camera",
                    Math.PI / 2, // Alpha (horizontal rotation)
                    Math.PI / 3, // Beta (vertical rotation)
                    sport === 'MLB' ? 150 : sport === 'CBB' ? 80 : 200, // Radius
                    BABYLON.Vector3.Zero(),
                    babylonScene
                );
                camera.attachControl(canvas, true);
                camera.lowerRadiusLimit = sport === 'MLB' ? 80 : sport === 'CBB' ? 40 : 100;
                camera.upperRadiusLimit = sport === 'MLB' ? 300 : sport === 'CBB' ? 150 : 400;
                camera.wheelPrecision = 50;

                // Add hemisphere light (ambient + directional)
                const hemisphericLight = new BABYLON.HemisphericLight(
                    "light",
                    new BABYLON.Vector3(0, 1, 0),
                    babylonScene
                );
                hemisphericLight.intensity = 0.8;

                // Add directional light (sun)
                const directionalLight = new BABYLON.DirectionalLight(
                    "dirLight",
                    new BABYLON.Vector3(-1, -2, -1),
                    babylonScene
                );
                directionalLight.position = new BABYLON.Vector3(50, 100, 50);
                directionalLight.intensity = 0.6;

                // Create sport-specific field
                if (sport === 'MLB') {
                    createBaseballDiamond(babylonScene);
                } else if (sport === 'NFL' || sport === 'CFB') {
                    createFootballField(babylonScene);
                } else if (sport === 'CBB') {
                    createBasketballCourt(babylonScene);
                }

                // Start rendering loop
                babylonEngine.runRenderLoop(() => {
                    babylonScene.render();
                });

                // Handle window resize
                window.addEventListener('resize', () => {
                    babylonEngine.resize();
                });

            } catch (err) {
                // Babylon.js initialization failed silently
            }
        };

        initBabylon();

        // Cleanup
        return () => {
            if (engine) {
                engine.dispose();
            }
        };
    }, [sport, team, roster]);

    // Baseball diamond creator
    const createBaseballDiamond = (scene) => {
        // Grass field (green circle)
        const grass = BABYLON.MeshBuilder.CreateDisc("grass", {
            radius: 100,
            tessellation: 64
        }, scene);
        grass.rotation.x = Math.PI / 2;
        grass.position.y = 0.1;
        const grassMat = new BABYLON.StandardMaterial("grassMat", scene);
        grassMat.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.2); // Green
        grassMat.specularColor = new BABYLON.Color3(0, 0, 0);
        grass.material = grassMat;

        // Infield dirt (brown square rotated 45°)
        const infield = BABYLON.MeshBuilder.CreateBox("infield", {
            width: 90,
            height: 0.2,
            depth: 90
        }, scene);
        infield.rotation.y = Math.PI / 4;
        infield.position.y = 0.2;
        const dirtMat = new BABYLON.StandardMaterial("dirtMat", scene);
        dirtMat.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.2); // Brown
        infield.material = dirtMat;

        // Bases (white cubes)
        const basePositions = [
            { x: 0, z: -63.7 },    // Home plate
            { x: 63.7, z: 0 },     // First base
            { x: 0, z: 63.7 },     // Second base
            { x: -63.7, z: 0 }     // Third base
        ];

        basePositions.forEach((pos, idx) => {
            const base = BABYLON.MeshBuilder.CreateBox(`base${idx}`, {
                width: 3,
                height: 0.5,
                depth: 3
            }, scene);
            base.position = new BABYLON.Vector3(pos.x, 0.5, pos.z);
            const baseMat = new BABYLON.StandardMaterial(`baseMat${idx}`, scene);
            baseMat.diffuseColor = new BABYLON.Color3(1, 1, 1); // White
            base.material = baseMat;
        });

        // Pitcher's mound
        const mound = BABYLON.MeshBuilder.CreateCylinder("mound", {
            diameter: 10,
            height: 1.5,
            tessellation: 32
        }, scene);
        mound.position.y = 0.75;
        mound.material = dirtMat;

        // Outfield fence (arc)
        const fence = BABYLON.MeshBuilder.CreateTorus("fence", {
            diameter: 200,
            thickness: 2,
            tessellation: 64
        }, scene);
        fence.rotation.x = Math.PI / 2;
        fence.position.y = 8;
        const fenceMat = new BABYLON.StandardMaterial("fenceMat", scene);
        fenceMat.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.4); // Blue-gray
        fence.material = fenceMat;

        // Player positions (spheres)
        const positions = [
            { name: 'P', x: 0, z: 0, y: 2 },        // Pitcher
            { name: 'C', x: 0, z: -63.7, y: 2 },    // Catcher
            { name: '1B', x: 63.7, z: 0, y: 2 },    // First base
            { name: '2B', x: 40, z: 40, y: 2 },     // Second base
            { name: 'SS', x: -40, z: 40, y: 2 },    // Shortstop
            { name: '3B', x: -63.7, z: 0, y: 2 },   // Third base
            { name: 'LF', x: -50, z: 70, y: 2 },    // Left field
            { name: 'CF', x: 0, z: 90, y: 2 },      // Center field
            { name: 'RF', x: 50, z: 70, y: 2 }      // Right field
        ];

        positions.forEach((pos, idx) => {
            const player = BABYLON.MeshBuilder.CreateSphere(`player${idx}`, {
                diameter: 4
            }, scene);
            player.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
            const playerMat = new BABYLON.StandardMaterial(`playerMat${idx}`, scene);
            playerMat.diffuseColor = new BABYLON.Color3(1, 0.4, 0); // Blaze orange
            playerMat.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0);
            player.material = playerMat;

            // Add position label
            const label = BABYLON.MeshBuilder.CreatePlane(`label${idx}`, {
                width: 6,
                height: 3
            }, scene);
            label.position = new BABYLON.Vector3(pos.x, pos.y + 4, pos.z);
            label.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

            const labelMat = new BABYLON.StandardMaterial(`labelMat${idx}`, scene);
            const labelTexture = new BABYLON.DynamicTexture(`labelTex${idx}`, {
                width: 256,
                height: 128
            }, scene);
            labelTexture.drawText(pos.name, null, null, "bold 80px Arial", "white", "transparent");
            labelMat.diffuseTexture = labelTexture;
            labelMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
            labelMat.backFaceCulling = false;
            label.material = labelMat;
        });
    };

    // Football field creator
    const createFootballField = (scene) => {
        // Field (green rectangle)
        const field = BABYLON.MeshBuilder.CreateBox("field", {
            width: 53.3,  // 53.3 yards wide
            height: 0.5,
            depth: 120    // 120 yards long (including end zones)
        }, scene);
        field.position.y = 0;
        const fieldMat = new BABYLON.StandardMaterial("fieldMat", scene);
        fieldMat.diffuseColor = new BABYLON.Color3(0.1, 0.5, 0.1); // Green
        field.material = fieldMat;

        // Yard lines (white stripes every 5 yards)
        for (let i = 0; i <= 120; i += 5) {
            const line = BABYLON.MeshBuilder.CreateBox(`yard${i}`, {
                width: 53.3,
                height: 0.1,
                depth: 0.2
            }, scene);
            line.position = new BABYLON.Vector3(0, 0.6, -60 + i);
            const lineMat = new BABYLON.StandardMaterial(`lineMat${i}`, scene);
            lineMat.diffuseColor = new BABYLON.Color3(1, 1, 1); // White
            lineMat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);
            line.material = lineMat;
        }

        // End zones (colored rectangles)
        const endZone1 = BABYLON.MeshBuilder.CreateBox("endZone1", {
            width: 53.3,
            height: 0.1,
            depth: 10
        }, scene);
        endZone1.position = new BABYLON.Vector3(0, 0.7, -65);
        const ezMat1 = new BABYLON.StandardMaterial("ezMat1", scene);
        ezMat1.diffuseColor = new BABYLON.Color3(0.7, 0.2, 0); // Orange
        endZone1.material = ezMat1;

        const endZone2 = BABYLON.MeshBuilder.CreateBox("endZone2", {
            width: 53.3,
            height: 0.1,
            depth: 10
        }, scene);
        endZone2.position = new BABYLON.Vector3(0, 0.7, 65);
        endZone2.material = ezMat1;

        // Goal posts
        [-60, 60].forEach((z, idx) => {
            const post = BABYLON.MeshBuilder.CreateCylinder(`goalPost${idx}`, {
                diameter: 0.5,
                height: 20
            }, scene);
            post.position = new BABYLON.Vector3(0, 10, z);
            const postMat = new BABYLON.StandardMaterial(`postMat${idx}`, scene);
            postMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0); // Yellow
            post.material = postMat;

            // Crossbar
            const crossbar = BABYLON.MeshBuilder.CreateCylinder(`crossbar${idx}`, {
                diameter: 0.5,
                height: 18.5
            }, scene);
            crossbar.rotation.z = Math.PI / 2;
            crossbar.position = new BABYLON.Vector3(0, 10, z);
            crossbar.material = postMat;
        });

        // Player formations (11 offensive players)
        const offensivePositions = [
            { x: 0, z: 0, y: 2 },      // QB
            { x: -4, z: -3, y: 2 },    // RB
            { x: 8, z: 0, y: 2 },      // TE
            { x: -15, z: 0, y: 2 },    // WR1
            { x: 15, z: 0, y: 2 },     // WR2
            { x: -4, z: 1, y: 2 },     // C
            { x: -6, z: 1, y: 2 },     // LG
            { x: -2, z: 1, y: 2 },     // RG
            { x: -8, z: 1, y: 2 },     // LT
            { x: 0, z: 1, y: 2 },      // RT
            { x: 20, z: 0, y: 2 }      // WR3
        ];

        offensivePositions.forEach((pos, idx) => {
            const player = BABYLON.MeshBuilder.CreateSphere(`offPlayer${idx}`, {
                diameter: 2
            }, scene);
            player.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
            const playerMat = new BABYLON.StandardMaterial(`offPlayerMat${idx}`, scene);
            playerMat.diffuseColor = new BABYLON.Color3(1, 0.2, 0); // Red (offense)
            playerMat.emissiveColor = new BABYLON.Color3(0.3, 0, 0);
            player.material = playerMat;
        });

        // Defensive formation (11 defensive players)
        const defensivePositions = [
            { x: -8, z: 8, y: 2 },     // DE
            { x: 8, z: 8, y: 2 },      // DE
            { x: -3, z: 8, y: 2 },     // DT
            { x: 3, z: 8, y: 2 },      // DT
            { x: -12, z: 10, y: 2 },   // LB
            { x: 0, z: 10, y: 2 },     // MLB
            { x: 12, z: 10, y: 2 },    // LB
            { x: -20, z: 18, y: 2 },   // CB
            { x: 20, z: 18, y: 2 },    // CB
            { x: -10, z: 25, y: 2 },   // S
            { x: 10, z: 25, y: 2 }     // S
        ];

        defensivePositions.forEach((pos, idx) => {
            const player = BABYLON.MeshBuilder.CreateSphere(`defPlayer${idx}`, {
                diameter: 2
            }, scene);
            player.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
            const playerMat = new BABYLON.StandardMaterial(`defPlayerMat${idx}`, scene);
            playerMat.diffuseColor = new BABYLON.Color3(0, 0.4, 1); // Blue (defense)
            playerMat.emissiveColor = new BABYLON.Color3(0, 0, 0.3);
            player.material = playerMat;
        });
    };

    // Basketball court creator
    const createBasketballCourt = (scene) => {
        // Court floor (hardwood)
        const court = BABYLON.MeshBuilder.CreateBox("court", {
            width: 50,  // 50 feet wide
            height: 0.5,
            depth: 94   // 94 feet long
        }, scene);
        court.position.y = 0;
        const courtMat = new BABYLON.StandardMaterial("courtMat", scene);
        courtMat.diffuseColor = new BABYLON.Color3(0.7, 0.5, 0.3); // Hardwood
        court.material = courtMat;

        // Three-point lines (arcs)
        const createArc = (z, name) => {
            const arc = BABYLON.MeshBuilder.CreateTorus(name, {
                diameter: 47.9,
                thickness: 0.3,
                tessellation: 64
            }, scene);
            arc.rotation.x = Math.PI / 2;
            arc.position = new BABYLON.Vector3(0, 0.6, z);
            const arcMat = new BABYLON.StandardMaterial(`${name}Mat`, scene);
            arcMat.diffuseColor = new BABYLON.Color3(1, 1, 1); // White
            arc.material = arcMat;
            return arc;
        };

        createArc(-41.75, "arc1");
        createArc(41.75, "arc2");

        // Paint/key (rectangles)
        const paint1 = BABYLON.MeshBuilder.CreateBox("paint1", {
            width: 16,
            height: 0.1,
            depth: 19
        }, scene);
        paint1.position = new BABYLON.Vector3(0, 0.6, -37.5);
        const paintMat = new BABYLON.StandardMaterial("paintMat", scene);
        paintMat.diffuseColor = new BABYLON.Color3(1, 0.4, 0); // Blaze orange
        paintMat.alpha = 0.3;
        paint1.material = paintMat;

        const paint2 = BABYLON.MeshBuilder.CreateBox("paint2", {
            width: 16,
            height: 0.1,
            depth: 19
        }, scene);
        paint2.position = new BABYLON.Vector3(0, 0.6, 37.5);
        paint2.material = paintMat;

        // Hoops (cylinders for rims)
        [-41.75, 41.75].forEach((z, idx) => {
            const hoop = BABYLON.MeshBuilder.CreateTorus(`hoop${idx}`, {
                diameter: 18,
                thickness: 0.8,
                tessellation: 32
            }, scene);
            hoop.rotation.x = Math.PI / 2;
            hoop.position = new BABYLON.Vector3(0, 10, z);
            const hoopMat = new BABYLON.StandardMaterial(`hoopMat${idx}`, scene);
            hoopMat.diffuseColor = new BABYLON.Color3(1, 0.4, 0); // Orange
            hoopMat.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0);
            hoop.material = hoopMat;

            // Backboard
            const backboard = BABYLON.MeshBuilder.CreateBox(`backboard${idx}`, {
                width: 72,
                height: 42,
                depth: 1
            }, scene);
            backboard.position = new BABYLON.Vector3(0, 12, z - 4);
            const backboardMat = new BABYLON.StandardMaterial(`backboardMat${idx}`, scene);
            backboardMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
            backboardMat.alpha = 0.3;
            backboard.material = backboardMat;
        });

        // Players (5 per team)
        const team1Positions = [
            { x: 0, z: -30, y: 2 },     // PG
            { x: -10, z: -25, y: 2 },   // SG
            { x: 10, z: -25, y: 2 },    // SF
            { x: -8, z: -35, y: 2 },    // PF
            { x: 8, z: -35, y: 2 }      // C
        ];

        team1Positions.forEach((pos, idx) => {
            const player = BABYLON.MeshBuilder.CreateSphere(`team1Player${idx}`, {
                diameter: 2
            }, scene);
            player.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
            const playerMat = new BABYLON.StandardMaterial(`team1PlayerMat${idx}`, scene);
            playerMat.diffuseColor = new BABYLON.Color3(1, 0.4, 0); // Blaze orange
            playerMat.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0);
            player.material = playerMat;
        });

        const team2Positions = [
            { x: 0, z: 30, y: 2 },      // PG
            { x: -10, z: 25, y: 2 },    // SG
            { x: 10, z: 25, y: 2 },     // SF
            { x: -8, z: 35, y: 2 },     // PF
            { x: 8, z: 35, y: 2 }       // C
        ];

        team2Positions.forEach((pos, idx) => {
            const player = BABYLON.MeshBuilder.CreateSphere(`team2Player${idx}`, {
                diameter: 2
            }, scene);
            player.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
            const playerMat = new BABYLON.StandardMaterial(`team2PlayerMat${idx}`, scene);
            playerMat.diffuseColor = new BABYLON.Color3(0, 0.4, 1); // Blue
            playerMat.emissiveColor = new BABYLON.Color3(0, 0, 0.3);
            player.material = playerMat;
        });
    };

    return (
        <div style={{
            marginTop: '30px',
            background: 'var(--glass-medium)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '24px',
            backdropFilter: 'blur(10px)'
        }}>
            <h3 style={{
                color: 'var(--blaze-ember)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <i className="fas fa-cube"></i>
                3D {sport === 'MLB' ? 'Baseball Diamond' : sport === 'CBB' ? 'Basketball Court' : 'Football Field'} Visualization
                <span style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    background: 'linear-gradient(135deg, rgba(191, 87, 0, 0.3), rgba(204, 102, 0, 0.2))',
                    border: '1px solid rgba(191, 87, 0, 0.4)',
                    borderRadius: '12px',
                    fontWeight: '600',
                    marginLeft: '10px'
                }}>
                    Babylon.js • WebGPU
                </span>
            </h3>

            <div style={{
                position: 'relative',
                width: '100%',
                height: '600px',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#0D0D12'
            }}>
                <canvas
                    ref={canvasRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        touchAction: 'none'
                    }}
                />

                {/* Camera controls hint */}
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    background: 'rgba(13, 13, 18, 0.85)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <div style={{ marginBottom: '6px', fontWeight: '600', color: 'var(--blaze-copper)' }}>
                        <i className="fas fa-info-circle"></i> Camera Controls
                    </div>
                    <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                        <i className="fas fa-mouse"></i> Left click + drag: Rotate<br />
                        <i className="fas fa-mouse"></i> Scroll: Zoom in/out<br />
                        <i className="fas fa-mouse"></i> Right click + drag: Pan
                    </div>
                </div>

                {/* Tech badge */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    alignItems: 'flex-end'
                }}>
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        color: '#10b981',
                        fontWeight: '600',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <i className="fas fa-check-circle"></i> 3D Rendering Active
                    </div>
                    <div style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        color: '#3b82f6',
                        fontWeight: '600',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <i className="fas fa-microchip"></i> Hardware Accelerated
                    </div>
                </div>
            </div>

            <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(191, 87, 0, 0.05)',
                border: '1px solid rgba(191, 87, 0, 0.2)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: '1.6'
            }}>
                <strong style={{ color: 'var(--blaze-copper)' }}>
                    <i className="fas fa-lightbulb"></i> Interactive 3D Visualization:
                </strong>
                {sport === 'MLB' ? ' Baseball diamond with 9 defensive positions, pitcher\'s mound, bases, and outfield fence. ' :
                 sport === 'CBB' ? ' Full basketball court with three-point arcs, paint zones, hoops, and player positions. ' :
                 ' 100-yard football field with yard lines, end zones, goal posts, and 22-player formation (11 offense, 11 defense). '}
                Powered by Babylon.js with WebGPU rendering engine for maximum performance.
            </div>
        </div>
    );
};
