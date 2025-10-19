import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const MOBILE_PARTICLE_COUNT = 140;
const DESKTOP_PARTICLE_COUNT = 280;
const COLOR_PALETTE = ['#FBBF24', '#DC2626', '#2D3748', '#1A202C', '#E2E8F0'];

const createColorArray = (count) => {
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    color.set(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  return colors;
};

const ParticleBackground = () => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);
  const mediaQueryRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const particlesRef = useRef(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return () => {};
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      1000,
    );
    camera.position.z = 200;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.zIndex = '0';

    container.appendChild(renderer.domElement);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

    const mobileQuery = window.matchMedia('(max-width: 768px)');
    mediaQueryRef.current = mobileQuery;

    const buildParticles = (count) => {
      if (!sceneRef.current) {
        return;
      }

      if (particlesRef.current) {
        const { points, geometry, material } = particlesRef.current;
        sceneRef.current.remove(points);
        geometry.dispose();
        material.dispose();
      }

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);

      for (let i = 0; i < count; i += 1) {
        const index = i * 3;
        positions[index] = (Math.random() - 0.5) * 400;
        positions[index + 1] = (Math.random() - 0.5) * 300;
        positions[index + 2] = (Math.random() - 0.5) * 200;

        velocities[index] = (Math.random() - 0.5) * 0.08;
        velocities[index + 1] = (Math.random() - 0.5) * 0.08;
        velocities[index + 2] = (Math.random() - 0.5) * 0.02;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(createColorArray(count), 3));

      const size = mobileQuery.matches ? 1.1 : 1.6;
      const material = new THREE.PointsMaterial({
        size,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      particlesRef.current = {
        points,
        geometry,
        material,
        velocities,
        boundary: {
          x: 220,
          y: 180,
          z: 220,
        }, // Soft bounds that keep motion subtle without hard resets.
      };
    };

    buildParticles(mobileQuery.matches ? MOBILE_PARTICLE_COUNT : DESKTOP_PARTICLE_COUNT);

    const animate = () => {
      if (pausedRef.current) {
        animationFrameRef.current = null;
        return;
      }

      animationFrameRef.current = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();

      if (particlesRef.current) {
        const { geometry, velocities, boundary } = particlesRef.current;
        const positions = geometry.attributes.position.array;

        for (let i = 0; i < positions.length; i += 3) {
          // Scale velocity by delta to keep motion smooth across devices.
          positions[i] += velocities[i] * delta * 60;
          positions[i + 1] += velocities[i + 1] * delta * 60;
          positions[i + 2] += velocities[i + 2] * delta * 60;

          if (positions[i] > boundary.x || positions[i] < -boundary.x) {
            velocities[i] *= -1;
          }
          if (positions[i + 1] > boundary.y || positions[i + 1] < -boundary.y) {
            velocities[i + 1] *= -1;
          }
          if (positions[i + 2] > boundary.z || positions[i + 2] < -boundary.z) {
            velocities[i + 2] *= -1;
          }
        }

        geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    const startAnimation = () => {
      if (!animationFrameRef.current) {
        pausedRef.current = false;
        clockRef.current.getDelta();
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    const stopAnimation = () => {
      pausedRef.current = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopAnimation();
      } else {
        startAnimation();
      }
    };

    const handleMediaChange = (event) => {
      // Rebuild the particle geometry when the viewport crosses the mobile breakpoint.
      buildParticles(event.matches ? MOBILE_PARTICLE_COUNT : DESKTOP_PARTICLE_COUNT);
    };

    const handleBlur = () => stopAnimation();
    const handleFocus = () => startAnimation();

    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', handleMediaChange);
    } else {
      mobileQuery.addListener(handleMediaChange);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    startAnimation();

    return () => {
      stopAnimation();

      if (mediaQueryRef.current) {
        if (mediaQueryRef.current.removeEventListener) {
          mediaQueryRef.current.removeEventListener('change', handleMediaChange);
        } else {
          mediaQueryRef.current.removeListener(handleMediaChange);
        }
      }

      window.removeEventListener('resize', handleResize);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);

      if (particlesRef.current) {
        const { points, geometry, material } = particlesRef.current;
        scene.remove(points);
        geometry.dispose();
        material.dispose();
        particlesRef.current = null;
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
        const dom = rendererRef.current.domElement;
        if (dom && dom.parentNode) {
          dom.parentNode.removeChild(dom);
        }
        if (typeof rendererRef.current.forceContextLoss === 'function') {
          rendererRef.current.forceContextLoss();
        }
        rendererRef.current = null;
      }

      clockRef.current.stop();
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, []);

  return <div className="particle-background" ref={containerRef} aria-hidden />;
};

export default ParticleBackground;

