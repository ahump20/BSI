'use client';

import { useEffect, useRef } from 'react';
import styles from './MomentumIndicator.module.css';

interface MomentumIndicatorProps {
  momentum: number; // -100 to 100 (negative = away team, positive = home team)
  homeTeam: { name: string; color: string };
  awayTeam: { name: string; color: string };
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Physics-Based Momentum Indicator
 * Shows game momentum with realistic physics simulation
 * Features: Spring physics, particle effects, dynamic colors
 */
export default function MomentumIndicator({
  momentum,
  homeTeam,
  awayTeam,
  animated = true,
  size = 'medium',
}: MomentumIndicatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentPositionRef = useRef(0);
  const velocityRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const dimensions = {
    small: { width: 200, height: 60 },
    medium: { width: 400, height: 100 },
    large: { width: 600, height: 150 },
  };

  const { width, height } = dimensions[size];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Physics constants
    const SPRING_STRENGTH = 0.05;
    const DAMPING = 0.85;
    const targetPosition = (momentum / 100) * (width * 0.4);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
    }> = [];

    const animate = () => {
      // Spring physics for smooth momentum indicator movement
      const force = (targetPosition - currentPositionRef.current) * SPRING_STRENGTH;
      velocityRef.current += force;
      velocityRef.current *= DAMPING;
      currentPositionRef.current += velocityRef.current;

      // Clear canvas
      ctx.fillStyle = 'rgba(10, 14, 26, 0.95)';
      ctx.fillRect(0, 0, width, height);

      // Draw track
      drawTrack(ctx, width, height);

      // Draw momentum bar
      drawMomentumBar(
        ctx,
        currentPositionRef.current,
        width,
        height,
        homeTeam.color,
        awayTeam.color
      );

      // Emit particles from indicator
      if (Math.abs(velocityRef.current) > 0.5 && animated) {
        const centerX = width / 2 + currentPositionRef.current;
        const centerY = height / 2;
        const color =
          currentPositionRef.current > 0 ? homeTeam.color : awayTeam.color;

        particles.push({
          x: centerX,
          y: centerY,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 1,
          color,
        });
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;

        if (p.life <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }
      }

      // Draw indicator
      drawIndicator(
        ctx,
        currentPositionRef.current,
        width,
        height,
        homeTeam.color,
        awayTeam.color
      );

      // Draw team labels
      drawTeamLabels(ctx, width, height, homeTeam, awayTeam);

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
  }, [momentum, homeTeam, awayTeam, width, height, animated]);

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.momentumValue}>
        {momentum > 0 ? '+' : ''}
        {momentum.toFixed(0)}
      </div>
    </div>
  );
}

function drawTrack(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const centerY = height / 2;
  const trackWidth = width * 0.8;
  const trackHeight = 8;
  const trackX = (width - trackWidth) / 2;

  ctx.save();

  // Track background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(trackX, centerY - trackHeight / 2, trackWidth, trackHeight);

  // Center marker
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2, centerY - 15);
  ctx.lineTo(width / 2, centerY + 15);
  ctx.stroke();

  ctx.restore();
}

function drawMomentumBar(
  ctx: CanvasRenderingContext2D,
  position: number,
  width: number,
  height: number,
  homeColor: string,
  awayColor: string
) {
  const centerY = height / 2;
  const centerX = width / 2;
  const barHeight = 12;

  ctx.save();

  if (position > 0) {
    // Home team momentum (right)
    const gradient = ctx.createLinearGradient(centerX, 0, centerX + position, 0);
    gradient.addColorStop(0, 'rgba(191, 87, 0, 0)');
    gradient.addColorStop(1, homeColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(centerX, centerY - barHeight / 2, position, barHeight);

    // Glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = homeColor;
    ctx.fillRect(centerX, centerY - barHeight / 2, position, barHeight);
  } else if (position < 0) {
    // Away team momentum (left)
    const gradient = ctx.createLinearGradient(centerX, 0, centerX + position, 0);
    gradient.addColorStop(0, 'rgba(176, 224, 230, 0)');
    gradient.addColorStop(1, awayColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(centerX + position, centerY - barHeight / 2, -position, barHeight);

    // Glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = awayColor;
    ctx.fillRect(centerX + position, centerY - barHeight / 2, -position, barHeight);
  }

  ctx.restore();
}

function drawIndicator(
  ctx: CanvasRenderingContext2D,
  position: number,
  width: number,
  height: number,
  homeColor: string,
  awayColor: string
) {
  const centerX = width / 2 + position;
  const centerY = height / 2;
  const radius = 16;
  const color = position > 0 ? homeColor : awayColor;

  ctx.save();

  // Outer glow ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.3;
  ctx.shadowBlur = 20;
  ctx.shadowColor = color;
  ctx.stroke();

  // Main indicator
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, '#FFFFFF');
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, color);

  ctx.fillStyle = gradient;
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 25;
  ctx.shadowColor = color;
  ctx.fill();

  // Border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Arrow indicator
  const arrowSize = 6;
  const arrowDirection = position > 0 ? 1 : -1;

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(centerX + arrowDirection * arrowSize, centerY);
  ctx.lineTo(centerX - arrowDirection * arrowSize / 2, centerY - arrowSize);
  ctx.lineTo(centerX - arrowDirection * arrowSize / 2, centerY + arrowSize);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawTeamLabels(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  homeTeam: { name: string; color: string },
  awayTeam: { name: string; color: string }
) {
  ctx.save();

  ctx.font = '12px monospace';
  ctx.textBaseline = 'top';

  // Away team (left)
  ctx.fillStyle = awayTeam.color;
  ctx.textAlign = 'left';
  ctx.fillText(awayTeam.name, 10, height - 20);

  // Home team (right)
  ctx.fillStyle = homeTeam.color;
  ctx.textAlign = 'right';
  ctx.fillText(homeTeam.name, width - 10, height - 20);

  ctx.restore();
}
