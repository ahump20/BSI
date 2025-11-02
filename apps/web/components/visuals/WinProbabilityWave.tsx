'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './WinProbabilityWave.module.css';

interface WinProbabilityDataPoint {
  time: string;
  homeTeamProb: number;
  awayTeamProb: number;
  event?: string;
  leverage?: number;
}

interface WinProbabilityWaveProps {
  data: WinProbabilityDataPoint[];
  homeTeam: { name: string; color: string; logo?: string };
  awayTeam: { name: string; color: string; logo?: string };
  width?: number;
  height?: number;
  animated?: boolean;
  showEvents?: boolean;
}

/**
 * Revolutionary Win Probability Wave Visualization
 * Flowing, liquid-like visualization showing game momentum
 * Features: Smooth wave animations, event markers, gradient fills
 */
export default function WinProbabilityWave({
  data,
  homeTeam,
  awayTeam,
  width = 800,
  height = 400,
  animated = true,
  showEvents = true,
}: WinProbabilityWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
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
      if (animated) {
        timeRef.current += 0.01;
      }

      ctx.clearRect(0, 0, width, height);

      // Background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, 'rgba(10, 14, 26, 0.95)');
      bgGradient.addColorStop(1, 'rgba(22, 48, 61, 0.95)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw wave visualization
      drawWinProbabilityWave(
        ctx,
        data,
        homeTeam.color,
        awayTeam.color,
        width,
        height,
        timeRef.current,
        hoveredPoint
      );

      // Draw event markers
      if (showEvents) {
        drawEventMarkers(ctx, data, width, height, hoveredPoint);
      }

      // Draw axis and labels
      drawAxis(ctx, width, height, homeTeam, awayTeam);

      // Draw crosshair on hover
      if (hoveredPoint !== null) {
        drawCrosshair(ctx, data, hoveredPoint, width, height);
      }

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
  }, [data, homeTeam, awayTeam, width, height, animated, hoveredPoint, showEvents]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const index = Math.floor(((x - padding) / chartWidth) * data.length);

    if (index >= 0 && index < data.length) {
      setHoveredPoint(index);
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.header}>
        <div className={styles.teamInfo} style={{ color: awayTeam.color }}>
          {awayTeam.logo && (
            <div className={styles.logoWrapper}>
              <Image src={awayTeam.logo} alt={awayTeam.name} fill sizes="32px" style={{ objectFit: 'cover' }} />
            </div>
          )}
          <span>{awayTeam.name}</span>
        </div>
        <div className={styles.title}>Win Probability</div>
        <div className={styles.teamInfo} style={{ color: homeTeam.color }}>
          <span>{homeTeam.name}</span>
          {homeTeam.logo && (
            <div className={styles.logoWrapper}>
              <Image src={homeTeam.logo} alt={homeTeam.name} fill sizes="32px" style={{ objectFit: 'cover' }} />
            </div>
          )}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {hoveredPoint !== null && data[hoveredPoint] && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTime}>{data[hoveredPoint].time}</div>
          <div className={styles.tooltipProbs}>
            <div style={{ color: homeTeam.color }}>
              {homeTeam.name}: {(data[hoveredPoint].homeTeamProb * 100).toFixed(1)}%
            </div>
            <div style={{ color: awayTeam.color }}>
              {awayTeam.name}: {(data[hoveredPoint].awayTeamProb * 100).toFixed(1)}%
            </div>
          </div>
          {data[hoveredPoint].event && (
            <div className={styles.tooltipEvent}>{data[hoveredPoint].event}</div>
          )}
        </div>
      )}
    </div>
  );
}

function drawWinProbabilityWave(
  ctx: CanvasRenderingContext2D,
  data: WinProbabilityDataPoint[],
  homeColor: string,
  awayColor: string,
  width: number,
  height: number,
  time: number,
  hoveredPoint: number | null
) {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const stepX = chartWidth / (data.length - 1);

  // Draw home team area (bottom)
  ctx.save();
  ctx.beginPath();

  data.forEach((point, index) => {
    const x = padding + index * stepX;
    const y = padding + (1 - point.homeTeamProb) * chartHeight;

    // Add wave animation
    const waveOffset = Math.sin(time + index * 0.1) * 3;

    if (index === 0) {
      ctx.moveTo(x, y + waveOffset);
    } else {
      // Smooth curves using quadratic bezier
      const prevX = padding + (index - 1) * stepX;
      const prevY = padding + (1 - data[index - 1].homeTeamProb) * chartHeight;
      const cpX = (prevX + x) / 2;
      const cpY = (prevY + y) / 2 + waveOffset;
      ctx.quadraticCurveTo(prevX, prevY + waveOffset, cpX, cpY);
      ctx.lineTo(x, y + waveOffset);
    }
  });

  // Complete the path
  ctx.lineTo(padding + chartWidth, height - padding);
  ctx.lineTo(padding, height - padding);
  ctx.closePath();

  // Fill with gradient
  const homeGradient = ctx.createLinearGradient(0, height - padding, 0, padding);
  homeGradient.addColorStop(0, homeColor);
  homeGradient.addColorStop(1, 'rgba(191, 87, 0, 0)');
  ctx.fillStyle = homeGradient;
  ctx.fill();

  // Outline glow
  ctx.strokeStyle = homeColor;
  ctx.lineWidth = 3;
  ctx.shadowBlur = 15;
  ctx.shadowColor = homeColor;
  ctx.stroke();

  ctx.restore();

  // Draw away team area (top)
  ctx.save();
  ctx.beginPath();

  data.forEach((point, index) => {
    const x = padding + index * stepX;
    const y = padding + (1 - point.homeTeamProb) * chartHeight;
    const waveOffset = Math.sin(time + index * 0.1) * 3;

    if (index === 0) {
      ctx.moveTo(x, y + waveOffset);
    } else {
      const prevX = padding + (index - 1) * stepX;
      const prevY = padding + (1 - data[index - 1].homeTeamProb) * chartHeight;
      const cpX = (prevX + x) / 2;
      const cpY = (prevY + y) / 2 + waveOffset;
      ctx.quadraticCurveTo(prevX, prevY + waveOffset, cpX, cpY);
      ctx.lineTo(x, y + waveOffset);
    }
  });

  // Complete the path
  ctx.lineTo(padding + chartWidth, padding);
  ctx.lineTo(padding, padding);
  ctx.closePath();

  // Fill with gradient
  const awayGradient = ctx.createLinearGradient(0, padding, 0, height - padding);
  awayGradient.addColorStop(0, awayColor);
  awayGradient.addColorStop(1, 'rgba(176, 224, 230, 0)');
  ctx.fillStyle = awayGradient;
  ctx.fill();

  // Outline glow
  ctx.strokeStyle = awayColor;
  ctx.lineWidth = 3;
  ctx.shadowBlur = 15;
  ctx.shadowColor = awayColor;
  ctx.stroke();

  ctx.restore();

  // Draw center line (50%)
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  const centerY = padding + chartHeight / 2;
  ctx.beginPath();
  ctx.moveTo(padding, centerY);
  ctx.lineTo(width - padding, centerY);
  ctx.stroke();
  ctx.restore();

  // Highlight hovered point
  if (hoveredPoint !== null && data[hoveredPoint]) {
    const x = padding + hoveredPoint * stepX;
    const y = padding + (1 - data[hoveredPoint].homeTeamProb) * chartHeight;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = homeColor;
    ctx.shadowBlur = 20;
    ctx.shadowColor = homeColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

function drawEventMarkers(
  ctx: CanvasRenderingContext2D,
  data: WinProbabilityDataPoint[],
  width: number,
  height: number,
  hoveredPoint: number | null
) {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const stepX = chartWidth / (data.length - 1);

  data.forEach((point, index) => {
    if (!point.event) return;

    const x = padding + index * stepX;
    const y = padding + (1 - point.homeTeamProb) * chartHeight;

    // Leverage-based size
    const size = point.leverage ? 5 + point.leverage * 5 : 5;
    const isHovered = index === hoveredPoint;

    ctx.save();

    // Event marker
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? '#FFD700' : '#FF6B6B';
    ctx.shadowBlur = isHovered ? 25 : 15;
    ctx.shadowColor = isHovered ? '#FFD700' : '#FF6B6B';
    ctx.fill();

    // Ring
    ctx.beginPath();
    ctx.arc(x, y, size + 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vertical line to axis
    ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, height - padding);
    ctx.stroke();

    ctx.restore();
  });
}

function drawAxis(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  homeTeam: { name: string; color: string },
  awayTeam: { name: string; color: string }
) {
  const padding = 40;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '12px monospace';

  // Y-axis labels
  for (let i = 0; i <= 4; i++) {
    const y = padding + ((height - padding * 2) / 4) * i;
    const prob = 100 - (i * 25);

    ctx.textAlign = 'right';
    ctx.fillText(`${prob}%`, padding - 10, y + 4);
  }

  // Bottom labels
  ctx.textAlign = 'center';
  ctx.fillText('Start', padding, height - 10);
  ctx.fillText('End', width - padding, height - 10);

  ctx.restore();
}

function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  data: WinProbabilityDataPoint[],
  index: number,
  width: number,
  height: number
) {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const stepX = chartWidth / (data.length - 1);
  const x = padding + index * stepX;

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  // Vertical line
  ctx.beginPath();
  ctx.moveTo(x, padding);
  ctx.lineTo(x, height - padding);
  ctx.stroke();

  ctx.restore();
}
