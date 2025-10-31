'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './HolographicProjection.module.css';

interface HolographicProjectionProps {
  data: Array<{ label: string; value: number; color?: string }>;
  title?: string;
  type?: 'bar' | 'circle' | 'wave';
  animated?: boolean;
  interactive?: boolean;
  width?: number;
  height?: number;
}

/**
 * Holographic Data Projection Component
 * Creates futuristic, hologram-style data visualizations
 * Inspired by sci-fi interfaces and AR displays
 */
export default function HolographicProjection({
  data,
  title,
  type = 'bar',
  animated = true,
  interactive = true,
  width = 400,
  height = 300,
}: HolographicProjectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const animate = () => {
      timeRef.current += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Holographic grid background
      drawHolographicGrid(ctx, width, height, timeRef.current);

      // Draw data based on type
      if (type === 'bar') {
        drawHolographicBars(ctx, data, width, height, timeRef.current, hoveredIndex);
      } else if (type === 'circle') {
        drawHolographicCircle(ctx, data, width, height, timeRef.current, hoveredIndex);
      } else if (type === 'wave') {
        drawHolographicWave(ctx, data, width, height, timeRef.current);
      }

      // Scanline effect
      drawScanlines(ctx, width, height, timeRef.current);

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
  }, [data, type, animated, width, height, hoveredIndex]);

  // Interactive mouse handling
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate which data point is hovered
    if (type === 'bar') {
      const barWidth = width / (data.length * 1.5);
      const index = Math.floor(x / (barWidth * 1.5));
      setHoveredIndex(index >= 0 && index < data.length ? index : null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div ref={containerRef} className={styles.container}>
      {title && (
        <h3 className={styles.title}>
          <span className={styles.titleText}>{title}</span>
          <span className={styles.titleGlow}>{title}</span>
        </h3>
      )}
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipLabel}>{data[hoveredIndex].label}</div>
          <div className={styles.tooltipValue}>{data[hoveredIndex].value}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Draws holographic grid background
 */
function drawHolographicGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) {
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
  ctx.lineWidth = 1;

  const gridSize = 20;
  const offset = (time * 10) % gridSize;

  // Vertical lines
  for (let x = -offset; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines with perspective
  for (let y = 0; y < height; y += gridSize) {
    const perspective = 1 - y / height;
    ctx.globalAlpha = perspective * 0.3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

/**
 * Draws holographic bar chart
 */
function drawHolographicBars(
  ctx: CanvasRenderingContext2D,
  data: Array<{ label: string; value: number; color?: string }>,
  width: number,
  height: number,
  time: number,
  hoveredIndex: number | null
) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const barWidth = width / (data.length * 1.5);
  const padding = barWidth * 0.5;

  data.forEach((item, index) => {
    const x = index * (barWidth + padding) + padding;
    const barHeight = (item.value / maxValue) * (height * 0.7);
    const y = height - barHeight - 30;

    const isHovered = index === hoveredIndex;
    const color = item.color || '#00FFFF';

    // Glow effect
    ctx.shadowBlur = isHovered ? 30 : 15;
    ctx.shadowColor = color;

    // Main bar with gradient
    const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);

    // Wireframe effect
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Animated scan line
    const scanY = y + (time * 50) % barHeight;
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, scanY);
    ctx.lineTo(x + barWidth, scanY);
    ctx.stroke();

    // Label
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00FFFF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(item.label, x + barWidth / 2, height - 10);

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  });
}

/**
 * Draws holographic circular visualization
 */
function drawHolographicCircle(
  ctx: CanvasRenderingContext2D,
  data: Array<{ label: string; value: number; color?: string }>,
  width: number,
  height: number,
  time: number,
  hoveredIndex: number | null
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -Math.PI / 2;

  data.forEach((item, index) => {
    const sliceAngle = (item.value / total) * Math.PI * 2;
    const isHovered = index === hoveredIndex;
    const color = item.color || `hsl(${(index * 360) / data.length}, 100%, 50%)`;

    const radiusOffset = isHovered ? 10 : 0;
    const currentRadius = radius + radiusOffset;

    // Draw slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(
      centerX,
      centerY,
      currentRadius,
      currentAngle,
      currentAngle + sliceAngle
    );
    ctx.closePath();

    // Fill with gradient
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      currentRadius
    );
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
    gradient.addColorStop(1, color);

    ctx.fillStyle = gradient;
    ctx.fill();

    // Holographic outline
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.stroke();

    // Animated particles along the arc
    const particleCount = 5;
    for (let i = 0; i < particleCount; i++) {
      const particleAngle =
        currentAngle + (sliceAngle * i) / particleCount + time;
      const particleX = centerX + Math.cos(particleAngle) * currentRadius;
      const particleY = centerY + Math.sin(particleAngle) * currentRadius;

      ctx.beginPath();
      ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }

    currentAngle += sliceAngle;
    ctx.shadowBlur = 0;
  });

  // Center circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 3;
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#00FFFF';
  ctx.stroke();
  ctx.shadowBlur = 0;
}

/**
 * Draws holographic wave visualization
 */
function drawHolographicWave(
  ctx: CanvasRenderingContext2D,
  data: Array<{ label: string; value: number; color?: string }>,
  width: number,
  height: number,
  time: number
) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const stepX = width / (data.length - 1);

  // Draw multiple wave layers
  for (let layer = 0; layer < 3; layer++) {
    ctx.beginPath();
    const layerOffset = layer * 0.5;

    data.forEach((item, index) => {
      const x = index * stepX;
      const normalizedValue = item.value / maxValue;
      const y =
        height / 2 -
        normalizedValue * (height * 0.3) +
        Math.sin(time + x * 0.05 + layerOffset) * 10;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    const color = `rgba(0, 255, 255, ${0.6 - layer * 0.2})`;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 - layer;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00FFFF';
    ctx.stroke();
  }

  // Draw data points
  data.forEach((item, index) => {
    const x = index * stepX;
    const normalizedValue = item.value / maxValue;
    const y =
      height / 2 -
      normalizedValue * (height * 0.3) +
      Math.sin(time + x * 0.05) * 10;

    // Pulsing circle
    const pulseRadius = 3 + Math.sin(time * 2 + index) * 2;

    ctx.beginPath();
    ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#00FFFF';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00FFFF';
    ctx.fill();

    // Outer ring
    ctx.beginPath();
    ctx.arc(x, y, pulseRadius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  ctx.shadowBlur = 0;
}

/**
 * Draws CRT scanline effect
 */
function drawScanlines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) {
  ctx.globalAlpha = 0.1;
  for (let y = 0; y < height; y += 2) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, y, width, 1);
  }

  // Moving scanline
  const scanlineY = (time * 100) % height;
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#00FFFF';
  ctx.fillRect(0, scanlineY, width, 2);

  ctx.globalAlpha = 1;
}
