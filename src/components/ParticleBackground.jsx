import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const MOBILE_BREAKPOINT = 768;
const MOBILE_PARTICLE_COUNT = 90;
const DESKTOP_PARTICLE_COUNT = 180;
const FRAME_INTERVAL = 1000 / 45; // cap at ~45fps to reduce work on slower devices

const COLOR_PALETTE = [
  0xbf5700, // Blaze Ember
  0xcc6600, // Blaze Flame
  0xd97b38, // Blaze Copper
  0xe68a4f, // Blaze Sunset
  0x8b0000, // Blaze Crimson
];

const ParticleBackground = () => {
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      1000,
    );
    camera.position.z = 220;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.zIndex = '-1';

    container.appendChild(renderer.domElement);
    const particleCount = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
      ? MOBILE_PARTICLE_COUNT
      : DESKTOP_PARTICLE_COUNT;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);

    const color = new THREE.Color();
    for (let i = 0; i < particleCount; i += 1) {
      const idx = i * 3;
      positions[idx] = (Math.random() * 2 - 1) * 400;
      positions[idx + 1] = (Math.random() * 2 - 1) * 400;
      positions[idx + 2] = (Math.random() * 2 - 1) * 400;

      velocities[i] = 0.12 + Math.random() * 0.18; // gentle drift speed

      color.setHex(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
      colors[idx] = color.r;
      colors[idx + 1] = color.g;
      colors[idx + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches ? 2.4 : 3.2,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      vertexColors: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const clock = new THREE.Clock();
    let lastFrame = 0;
    let isPaused = document.hidden;

    const animate = (time) => {
      if (isPaused) {
        return;
      }

      animationRef.current = requestAnimationFrame(animate);

      if (time - lastFrame < FRAME_INTERVAL) {
        return;
      }

      const delta = clock.getDelta();

      particles.rotation.y += delta * 0.05;
      particles.rotation.x += delta * 0.015;

      const positionsAttr = geometry.getAttribute('position');
      for (let i = 0; i < particleCount; i += 1) {
        const idx = i * 3;
        positionsAttr.array[idx + 1] -= velocities[i] * (delta * 60);

        if (positionsAttr.array[idx + 1] < -420) {
          positionsAttr.array[idx + 1] = 420;
        }
      }
      positionsAttr.needsUpdate = true;

      renderer.render(scene, camera);
      lastFrame = time;
    };

    const start = () => {
      if (!animationRef.current) {
        isPaused = false;
        clock.getDelta();
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    const stop = () => {
      isPaused = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);

    start();

    return () => {
      stop();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      scene.remove(particles);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="particle-background" aria-hidden="true" />;
};

export default ParticleBackground;
