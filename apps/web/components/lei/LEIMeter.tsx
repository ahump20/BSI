'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './LEIMeter.module.css';

interface LEIMeterProps {
  score: number; // 0-100
  label?: string;
  animated?: boolean;
  showParticles?: boolean;
  variant?: 'default' | 'championship' | 'legendary';
}

/**
 * Stunning LEI Meter Component
 * Features:
 * - Radial gradient meter with animated fill
 * - Particle burst effects for high scores
 * - Holographic glow and pulse animations
 * - Dynamic color scaling (cold → warm → legendary)
 * - 3D depth effect with multiple layers
 */
export default function LEIMeter({
  score,
  label,
  animated = true,
  showParticles = true,
  variant = 'default',
}: LEIMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);

  // Animate score counting up
  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }

    const duration = 1500; // 1.5 seconds
    const startTime = Date.now();
    const startScore = displayScore;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayScore(startScore + (score - startScore) * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [score]);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;

    const animate = () => {
      timeRef.current += 0.016; // ~60fps
      ctx.clearRect(0, 0, size, size);

      // Draw background rings (depth effect)
      drawBackgroundRings(ctx, centerX, centerY, radius, timeRef.current);

      // Draw main meter
      drawLEIMeter(ctx, centerX, centerY, radius, displayScore, timeRef.current, variant);

      // Draw particles for high scores
      if (showParticles && displayScore > 50) {
        updateParticles(displayScore);
        drawParticles(ctx, particlesRef.current);
      }

      // Draw center glow
      drawCenterGlow(ctx, centerX, centerY, displayScore, timeRef.current);

      // Draw holographic scanlines
      drawScanlines(ctx, size, timeRef.current);

      if (animated) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [displayScore, animated, showParticles, variant]);

  // Particle system
  const updateParticles = (score: number) => {
    // Spawn new particles for legendary scores
    if (score > 80 && Math.random() < 0.1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      particlesRef.current.push({
        x: 150,
        y: 150,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        size: 2 + Math.random() * 3,
        color: score > 90 ? '#FFD700' : '#00FFFF',
      });
    }

    // Update existing particles
    particlesRef.current = particlesRef.current
      .map((p) => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        life: p.life - 0.015,
      }))
      .filter((p) => p.life > 0);
  };

  const getScoreColor = (score: number): string => {
    if (score < 10) return '#3B82F6'; // Blue - standard
    if (score < 20) return '#06B6D4'; // Cyan - important
    if (score < 40) return '#10B981'; // Green - high-leverage
    if (score < 60) return '#F59E0B'; // Amber - elite
    if (score < 80) return '#EF4444'; // Red - championship
    return '#FFD700'; // Gold - legendary
  };

  const getScoreLabel = (score: number): string => {
    if (score < 10) return 'STANDARD';
    if (score < 20) return 'IMPORTANT';
    if (score < 40) return 'HIGH LEVERAGE';
    if (score < 60) return 'ELITE';
    if (score < 80) return 'CHAMPIONSHIP';
    return 'LEGENDARY';
  };

  return (
    <div ref={containerRef} className={`${styles.container} ${styles[variant]}`}>
      <div className={styles.canvasWrapper}>
        <canvas ref={canvasRef} className={styles.canvas} />

        {/* Score display */}
        <div className={styles.scoreDisplay}>
          <div className={styles.scoreValue} style={{ color: getScoreColor(displayScore) }}>
            {Math.round(displayScore)}
          </div>
          <div className={styles.scoreLabel}>{getScoreLabel(displayScore)}</div>
        </div>

        {/* Holographic overlay */}
        <div className={styles.holographicOverlay} />
      </div>

      {label && <div className={styles.meterLabel}>{label}</div>}

      {/* Achievement badges for high scores */}
      {displayScore > 80 && (
        <div className={styles.achievementBadge}>
          <span className={styles.badgeIcon}>⭐</span>
          <span className={styles.badgeText}>CLUTCH LEGEND</span>
        </div>
      )}
    </div>
  );
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

/**
 * Draw background rings for depth effect
 */
function drawBackgroundRings(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number
) {
  for (let i = 3; i > 0; i--) {
    const ringRadius = radius + i * 15;
    const alpha = 0.05 + Math.sin(time + i) * 0.02;

    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/**
 * Draw main LEI meter with gradient and glow
 */
function drawLEIMeter(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  score: number,
  time: number,
  variant: string
) {
  const percentage = score / 100;
  const endAngle = -Math.PI / 2 + percentage * Math.PI * 2;

  // Outer track (background)
  ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Active arc with gradient
  const gradient = ctx.createLinearGradient(
    centerX - radius,
    centerY,
    centerX + radius,
    centerY
  );

  if (score < 20) {
    gradient.addColorStop(0, '#3B82F6');
    gradient.addColorStop(1, '#06B6D4');
  } else if (score < 40) {
    gradient.addColorStop(0, '#06B6D4');
    gradient.addColorStop(1, '#10B981');
  } else if (score < 60) {
    gradient.addColorStop(0, '#10B981');
    gradient.addColorStop(1, '#F59E0B');
  } else if (score < 80) {
    gradient.addColorStop(0, '#F59E0B');
    gradient.addColorStop(1, '#EF4444');
  } else {
    gradient.addColorStop(0, '#EF4444');
    gradient.addColorStop(0.5, '#FF6B6B');
    gradient.addColorStop(1, '#FFD700');
  }

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 20;
  ctx.lineCap = 'round';

  // Animated glow
  ctx.shadowBlur = 20 + Math.sin(time * 2) * 5;
  ctx.shadowColor = score > 80 ? '#FFD700' : '#00FFFF';

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle);
  ctx.stroke();

  // Inner accent ring
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 25, -Math.PI / 2, endAngle);
  ctx.stroke();

  // Tick marks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 10; i++) {
    const angle = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    const x1 = centerX + Math.cos(angle) * (radius - 30);
    const y1 = centerY + Math.sin(angle) * (radius - 30);
    const x2 = centerX + Math.cos(angle) * (radius - 35);
    const y2 = centerY + Math.sin(angle) * (radius - 35);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
}

/**
 * Draw center glow effect
 */
function drawCenterGlow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  score: number,
  time: number
) {
  const pulseSize = 40 + Math.sin(time * 2) * 5;
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    pulseSize
  );

  if (score > 80) {
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
  } else if (score > 50) {
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
  } else {
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
  }

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw particles
 */
function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach((p) => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = p.color;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

/**
 * Draw holographic scanlines
 */
function drawScanlines(ctx: CanvasRenderingContext2D, size: number, time: number) {
  ctx.globalAlpha = 0.05;
  for (let y = 0; y < size; y += 2) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, y, size, 1);
  }

  // Moving scanline
  const scanlineY = (time * 80) % size;
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#00FFFF';
  ctx.fillRect(0, scanlineY, size, 2);

  ctx.globalAlpha = 1;
}
