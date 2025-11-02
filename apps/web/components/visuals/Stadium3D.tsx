'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface Stadium3DProps {
  sport: 'baseball' | 'football' | 'basketball';
  teamColors?: { primary: string; secondary: string };
  data?: any[];
  width?: number;
  height?: number;
  showParticles?: boolean;
  animated?: boolean;
}

/**
 * Revolutionary 3D Stadium Visualization Component
 * Creates immersive 3D sports field/court with real-time data overlay
 * Features: Dynamic lighting, particle effects, camera animations
 */
export default function Stadium3D({
  sport,
  teamColors = { primary: '#BF5700', secondary: '#FF7D3C' },
  data = [],
  width = 800,
  height = 600,
  showParticles = true,
  animated = true,
}: Stadium3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);
    scene.fog = new THREE.Fog(0x0a0e1a, 50, 200);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0, 40, 60);
    cameraRef.current = camera;

    // Renderer setup with advanced settings
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 20;
    controls.maxDistance = 150;
    controlsRef.current = controls;

    // Lighting setup - cinematic three-point lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Key light (main stadium light)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(30, 60, 40);
    keyLight.castShadow = true;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 200;
    keyLight.shadow.camera.left = -50;
    keyLight.shadow.camera.right = 50;
    keyLight.shadow.camera.top = 50;
    keyLight.shadow.camera.bottom = -50;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.6);
    fillLight.position.set(-30, 40, -30);
    scene.add(fillLight);

    // Rim light (for dramatic effect)
    const rimLight = new THREE.DirectionalLight(0xff8844, 0.4);
    rimLight.position.set(0, 20, -50);
    scene.add(rimLight);

    // Point lights for stadium atmosphere
    const createStadiumLight = (x: number, z: number, color: number) => {
      const light = new THREE.PointLight(color, 1, 100);
      light.position.set(x, 45, z);
      return light;
    };

    scene.add(createStadiumLight(-40, -40, 0xffffff));
    scene.add(createStadiumLight(40, -40, 0xffffff));
    scene.add(createStadiumLight(-40, 40, 0xffffff));
    scene.add(createStadiumLight(40, 40, 0xffffff));

    // Create field based on sport
    const field = createField(sport, teamColors);
    scene.add(field);

    // Particle system for atmosphere
    if (showParticles) {
      const particles = createParticleSystem(teamColors.primary);
      particlesRef.current = particles;
      scene.add(particles);
    }

    // Data visualization overlay
    if (data.length > 0) {
      const dataViz = createDataVisualization(data, sport, teamColors);
      scene.add(dataViz);
    }

    setIsLoaded(true);

    // Animation loop
    let time = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      time += 0.01;

      if (animated) {
        // Animate particles
        if (particlesRef.current) {
          particlesRef.current.rotation.y = time * 0.05;
          const positions = particlesRef.current.geometry.attributes.position
            .array as Float32Array;
          for (let i = 1; i < positions.length; i += 3) {
            positions[i] = Math.sin(time + positions[i]) * 0.5 + 30;
          }
          particlesRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // Subtle camera movement
        camera.position.y = 40 + Math.sin(time * 0.2) * 2;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [sport, teamColors, data, width, height, showParticles, animated]);

  return (
    <div className="stadium-3d-container">
      <div
        ref={containerRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      />
      {!isLoaded && (
        <div className="loading-overlay">
          <div className="loading-spinner">Loading 3D Visualization...</div>
        </div>
      )}
    </div>
  );
}

/**
 * Creates sport-specific field geometry
 */
function createField(
  sport: 'baseball' | 'football' | 'basketball',
  teamColors: { primary: string; secondary: string }
): THREE.Group {
  const group = new THREE.Group();

  if (sport === 'baseball') {
    return createBaseballDiamond(teamColors);
  } else if (sport === 'football') {
    return createFootballField(teamColors);
  } else {
    return createBasketballCourt(teamColors);
  }
}

/**
 * Creates a detailed baseball diamond
 */
function createBaseballDiamond(teamColors: {
  primary: string;
  secondary: string;
}): THREE.Group {
  const group = new THREE.Group();

  // Infield dirt (diamond shape)
  const infieldShape = new THREE.Shape();
  infieldShape.moveTo(0, 0);
  infieldShape.lineTo(30, 30);
  infieldShape.lineTo(0, 60);
  infieldShape.lineTo(-30, 30);
  infieldShape.closePath();

  const infieldGeometry = new THREE.ShapeGeometry(infieldShape);
  const infieldMaterial = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    roughness: 0.9,
    metalness: 0.1,
  });
  const infield = new THREE.Mesh(infieldGeometry, infieldMaterial);
  infield.rotation.x = -Math.PI / 2;
  infield.receiveShadow = true;
  group.add(infield);

  // Outfield grass
  const outfieldGeometry = new THREE.CircleGeometry(50, 64);
  const outfieldMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a5f1a,
    roughness: 0.8,
    metalness: 0,
  });
  const outfield = new THREE.Mesh(outfieldGeometry, outfieldMaterial);
  outfield.rotation.x = -Math.PI / 2;
  outfield.position.y = -0.1;
  outfield.receiveShadow = true;
  group.add(outfield);

  // Bases
  const baseGeometry = new THREE.BoxGeometry(1.5, 0.2, 1.5);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.2,
  });

  const positions = [
    [0, 0.1, 0], // Home
    [30, 0.1, 30], // First
    [0, 0.1, 60], // Second
    [-30, 0.1, 30], // Third
  ];

  positions.forEach(([x, y, z]) => {
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(x, y, z);
    base.castShadow = true;
    group.add(base);
  });

  // Pitcher's mound
  const moundGeometry = new THREE.CylinderGeometry(3, 4, 0.5, 32);
  const moundMaterial = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    roughness: 0.9,
  });
  const mound = new THREE.Mesh(moundGeometry, moundMaterial);
  mound.position.set(0, 0.25, 30);
  mound.castShadow = true;
  group.add(mound);

  // Foul lines (glowing)
  const createFoulLine = (angle: number) => {
    const lineGeometry = new THREE.BoxGeometry(0.2, 0.1, 70);
    const lineMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
    });
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.set(0, 0.05, 35);
    line.rotation.y = angle;
    return line;
  };

  group.add(createFoulLine(Math.PI / 4));
  group.add(createFoulLine(-Math.PI / 4));

  return group;
}

/**
 * Creates a detailed football field
 */
function createFootballField(teamColors: {
  primary: string;
  secondary: string;
}): THREE.Group {
  const group = new THREE.Group();

  // Main field
  const fieldGeometry = new THREE.PlaneGeometry(40, 100);
  const fieldMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d5f2d,
    roughness: 0.8,
  });
  const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
  field.rotation.x = -Math.PI / 2;
  field.receiveShadow = true;
  group.add(field);

  // Yard lines
  const lineColor = new THREE.Color(teamColors.primary);
  for (let i = -50; i <= 50; i += 5) {
    const lineGeometry = new THREE.BoxGeometry(40, 0.1, 0.3);
    const lineMaterial = new THREE.MeshStandardMaterial({
      color: i === 0 ? 0xffdd00 : 0xffffff,
      emissive: i === 0 ? 0xffdd00 : 0xffffff,
      emissiveIntensity: 0.3,
    });
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.set(0, 0.05, i);
    group.add(line);
  }

  // End zones
  const endzoneGeometry = new THREE.PlaneGeometry(40, 10);
  const endzoneMaterial = new THREE.MeshStandardMaterial({
    color: lineColor,
    roughness: 0.7,
    emissive: lineColor,
    emissiveIntensity: 0.2,
  });

  const endzone1 = new THREE.Mesh(endzoneGeometry, endzoneMaterial);
  endzone1.rotation.x = -Math.PI / 2;
  endzone1.position.set(0, 0.01, -55);
  group.add(endzone1);

  const endzone2 = new THREE.Mesh(endzoneGeometry, endzoneMaterial);
  endzone2.rotation.x = -Math.PI / 2;
  endzone2.position.set(0, 0.01, 55);
  group.add(endzone2);

  // Goal posts
  const createGoalPost = (z: number) => {
    const postGroup = new THREE.Group();
    const postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 20, 16);
    const postMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdd00,
      metalness: 0.8,
      roughness: 0.2,
    });

    const leftPost = new THREE.Mesh(postGeometry, postMaterial);
    leftPost.position.set(-9, 10, z);
    postGroup.add(leftPost);

    const rightPost = new THREE.Mesh(postGeometry, postMaterial);
    rightPost.position.set(9, 10, z);
    postGroup.add(rightPost);

    const crossbar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 18.6, 16),
      postMaterial
    );
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 10, z);
    postGroup.add(crossbar);

    return postGroup;
  };

  group.add(createGoalPost(-60));
  group.add(createGoalPost(60));

  return group;
}

/**
 * Creates a detailed basketball court
 */
function createBasketballCourt(teamColors: {
  primary: string;
  secondary: string;
}): THREE.Group {
  const group = new THREE.Group();

  // Court floor
  const courtGeometry = new THREE.PlaneGeometry(28, 50);
  const courtMaterial = new THREE.MeshStandardMaterial({
    color: 0xc19a6b,
    roughness: 0.6,
    metalness: 0.1,
  });
  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.rotation.x = -Math.PI / 2;
  court.receiveShadow = true;
  group.add(court);

  // Court lines
  const lineColor = new THREE.Color(teamColors.primary);
  const lineMaterial = new THREE.MeshStandardMaterial({
    color: lineColor,
    emissive: lineColor,
    emissiveIntensity: 0.3,
  });

  // Three-point arcs
  const createThreePointArc = (z: number) => {
    const arcShape = new THREE.Shape();
    arcShape.absarc(0, 0, 7, 0, Math.PI, false);
    const arcGeometry = new THREE.ShapeGeometry(arcShape);
    const arc = new THREE.Mesh(arcGeometry, lineMaterial);
    arc.rotation.x = -Math.PI / 2;
    arc.position.set(0, 0.01, z);
    return arc;
  };

  group.add(createThreePointArc(-19));
  group.add(createThreePointArc(19));

  // Center circle
  const centerCircleGeometry = new THREE.RingGeometry(5.9, 6.1, 64);
  const centerCircle = new THREE.Mesh(centerCircleGeometry, lineMaterial);
  centerCircle.rotation.x = -Math.PI / 2;
  centerCircle.position.y = 0.01;
  group.add(centerCircle);

  // Paint areas
  const paintGeometry = new THREE.PlaneGeometry(12, 15);
  const paintMaterial = new THREE.MeshStandardMaterial({
    color: lineColor,
    roughness: 0.7,
    transparent: true,
    opacity: 0.2,
  });

  const paint1 = new THREE.Mesh(paintGeometry, paintMaterial);
  paint1.rotation.x = -Math.PI / 2;
  paint1.position.set(0, 0.005, -17.5);
  group.add(paint1);

  const paint2 = new THREE.Mesh(paintGeometry, paintMaterial);
  paint2.rotation.x = -Math.PI / 2;
  paint2.position.set(0, 0.005, 17.5);
  group.add(paint2);

  // Hoops
  const createHoop = (z: number) => {
    const hoopGroup = new THREE.Group();

    const rimGeometry = new THREE.TorusGeometry(0.75, 0.05, 16, 32);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      metalness: 0.9,
      roughness: 0.1,
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 5, z);
    hoopGroup.add(rim);

    const backboardGeometry = new THREE.BoxGeometry(6, 3.5, 0.2);
    const backboardMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      metalness: 0.5,
      roughness: 0.3,
    });
    const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
    backboard.position.set(0, 6, z);
    hoopGroup.add(backboard);

    return hoopGroup;
  };

  group.add(createHoop(-25));
  group.add(createHoop(25));

  return group;
}

/**
 * Creates an atmospheric particle system
 */
function createParticleSystem(primaryColor: string): THREE.Points {
  const particleCount = 2000;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const color = new THREE.Color(primaryColor);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 100;
    positions[i3 + 1] = Math.random() * 50;
    positions[i3 + 2] = (Math.random() - 0.5) * 100;

    const colorVariation = Math.random() * 0.3 + 0.7;
    colors[i3] = color.r * colorVariation;
    colors[i3 + 1] = color.g * colorVariation;
    colors[i3 + 2] = color.b * colorVariation;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.3,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geometry, material);
}

/**
 * Creates data visualization overlay on the field
 */
function createDataVisualization(
  data: any[],
  sport: string,
  teamColors: { primary: string; secondary: string }
): THREE.Group {
  const group = new THREE.Group();
  const color = new THREE.Color(teamColors.secondary);

  // Example: Create glowing data points
  data.forEach((point, index) => {
    const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.8,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // Position based on data (this would be customized per sport)
    sphere.position.set(
      (Math.random() - 0.5) * 40,
      2 + Math.random() * 3,
      (Math.random() - 0.5) * 40
    );

    group.add(sphere);
  });

  return group;
}
