'use client';

import { useEffect, useRef, useState, useCallback, createContext, useContext, ReactNode } from 'react';

/**
 * Confetti Celebration System
 *
 * Features:
 * - Multiple modes: explosion, rain, fireworks
 * - Customizable colors and particle count
 * - Canvas-based for performance
 * - Trigger from anywhere via context
 * - Sports-themed confetti shapes
 */

type ConfettiMode = 'explosion' | 'rain' | 'fireworks' | 'sports';

interface ConfettiConfig {
  mode?: ConfettiMode;
  particleCount?: number;
  duration?: number;
  colors?: string[];
  origin?: { x: number; y: number };
  spread?: number;
  startVelocity?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'baseball' | 'football' | 'basketball';
  opacity: number;
  life: number;
  maxLife: number;
}

interface ConfettiContextValue {
  fire: (config?: ConfettiConfig) => void;
  celebrate: () => void;
  sports: () => void;
}

const ConfettiContext = createContext<ConfettiContextValue | null>(null);

const BLAZE_COLORS = ['#BF5700', '#FF7D3C', '#FFD700', '#B0E0E6', '#4ADE80', '#60A5FA'];
const SPORTS_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

const DEFAULT_CONFIG: Required<ConfettiConfig> = {
  mode: 'explosion',
  particleCount: 100,
  duration: 3000,
  colors: BLAZE_COLORS,
  origin: { x: 0.5, y: 0.5 },
  spread: 360,
  startVelocity: 15,
};

function createParticle(
  canvas: HTMLCanvasElement,
  config: Required<ConfettiConfig>,
  mode: ConfettiMode
): Particle {
  const x = config.origin.x * canvas.width;
  const y = mode === 'rain' ? -10 : config.origin.y * canvas.height;

  const angle = (Math.random() * config.spread - config.spread / 2) * (Math.PI / 180);
  const velocity = config.startVelocity * (0.5 + Math.random() * 0.5);

  let vx = Math.sin(angle) * velocity;
  let vy = mode === 'rain' ? Math.random() * 3 + 2 : -Math.cos(angle) * velocity;

  if (mode === 'explosion') {
    const spreadAngle = Math.random() * Math.PI * 2;
    vx = Math.cos(spreadAngle) * velocity;
    vy = Math.sin(spreadAngle) * velocity * (Math.random() > 0.5 ? -1 : 0.5);
  }

  const shapes: Particle['shape'][] = mode === 'sports'
    ? ['baseball', 'football', 'basketball', 'star', 'circle']
    : ['circle', 'square', 'triangle', 'star'];

  return {
    x,
    y,
    vx,
    vy,
    color: config.colors[Math.floor(Math.random() * config.colors.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    opacity: 1,
    life: 0,
    maxLife: config.duration,
  };
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle) {
  ctx.save();
  ctx.translate(particle.x, particle.y);
  ctx.rotate(particle.rotation * Math.PI / 180);
  ctx.globalAlpha = particle.opacity;
  ctx.fillStyle = particle.color;
  ctx.strokeStyle = particle.color;
  ctx.lineWidth = 2;

  const size = particle.size;

  switch (particle.shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'square':
      ctx.fillRect(-size / 2, -size / 2, size, size);
      break;

    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(size / 2, size / 2);
      ctx.lineTo(-size / 2, size / 2);
      ctx.closePath();
      ctx.fill();
      break;

    case 'star':
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const x = Math.cos(angle) * size / 2;
        const y = Math.sin(angle) * size / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      break;

    case 'baseball':
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#CC0000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(-size / 4, 0, size / 3, 0, Math.PI, true);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(size / 4, 0, size / 3, 0, Math.PI);
      ctx.stroke();
      break;

    case 'football':
      ctx.beginPath();
      ctx.ellipse(0, 0, size / 2, size / 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#8B4513';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -size / 4);
      ctx.lineTo(0, size / 4);
      ctx.stroke();
      break;

    case 'basketball':
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#FF6B35';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-size / 2, 0);
      ctx.lineTo(size / 2, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(0, size / 2);
      ctx.stroke();
      break;
  }

  ctx.restore();
}

function updateParticle(particle: Particle, deltaTime: number): boolean {
  particle.life += deltaTime;

  const progress = particle.life / particle.maxLife;
  if (progress >= 1) return false;

  // Physics
  particle.vy += 0.2; // Gravity
  particle.vx *= 0.99; // Air resistance
  particle.vy *= 0.99;

  particle.x += particle.vx;
  particle.y += particle.vy;
  particle.rotation += particle.rotationSpeed;

  // Fade out in last 30%
  if (progress > 0.7) {
    particle.opacity = 1 - (progress - 0.7) / 0.3;
  }

  return true;
}

export function ConfettiProvider({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const [isActive, setIsActive] = useState(false);

  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      const alive = updateParticle(particle, deltaTime);
      if (alive) {
        drawParticle(ctx, particle);
      }
      return alive;
    });

    // Continue animation if particles exist
    if (particlesRef.current.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setIsActive(false);
    }
  }, []);

  const fire = useCallback((config: ConfettiConfig = {}) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resize canvas to window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const mergedConfig: Required<ConfettiConfig> = {
      ...DEFAULT_CONFIG,
      ...config,
      origin: config.origin || DEFAULT_CONFIG.origin,
    };

    // Create particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < mergedConfig.particleCount; i++) {
      newParticles.push(createParticle(canvas, mergedConfig, mergedConfig.mode));
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];

    // Start animation if not running
    if (!isActive) {
      setIsActive(true);
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [animate, isActive]);

  const celebrate = useCallback(() => {
    fire({
      mode: 'explosion',
      particleCount: 150,
      spread: 360,
      startVelocity: 20,
      colors: BLAZE_COLORS,
    });
  }, [fire]);

  const sports = useCallback(() => {
    fire({
      mode: 'sports',
      particleCount: 80,
      spread: 180,
      startVelocity: 18,
      colors: SPORTS_COLORS,
    });
  }, [fire]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && isActive) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isActive]);

  return (
    <ConfettiContext.Provider value={{ fire, celebrate, sports }}>
      {children}
      <canvas
        ref={canvasRef}
        className="confetti-canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 9999,
          display: isActive ? 'block' : 'none',
        }}
        aria-hidden="true"
      />
    </ConfettiContext.Provider>
  );
}

export function useConfetti(): ConfettiContextValue {
  const context = useContext(ConfettiContext);
  if (!context) {
    throw new Error('useConfetti must be used within a ConfettiProvider');
  }
  return context;
}

// Standalone celebration button for testing
export function CelebrationButton({ mode = 'celebrate' }: { mode?: 'celebrate' | 'sports' }) {
  const confetti = useConfetti();

  return (
    <button
      onClick={() => mode === 'sports' ? confetti.sports() : confetti.celebrate()}
      className="celebration-button"
    >
      {mode === 'sports' ? '🏆 Sports!' : '🎉 Celebrate!'}
    </button>
  );
}
