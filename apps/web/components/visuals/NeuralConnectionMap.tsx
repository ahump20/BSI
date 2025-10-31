'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './NeuralConnectionMap.module.css';

interface Player {
  id: string;
  name: string;
  position: string;
  stats?: any;
}

interface Connection {
  from: string;
  to: string;
  strength: number; // 0-1
  type?: 'pass' | 'assist' | 'block' | 'rebound';
}

interface NeuralConnectionMapProps {
  players: Player[];
  connections: Connection[];
  centerPlayer?: string;
  width?: number;
  height?: number;
  animated?: boolean;
  interactive?: boolean;
}

/**
 * Neural Network Style Player Connection Map
 * Visualizes player interactions and relationships
 * Like a synaptic network showing team chemistry
 */
export default function NeuralConnectionMap({
  players,
  connections,
  centerPlayer,
  width = 600,
  height = 600,
  animated = true,
  interactive = true,
}: NeuralConnectionMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(centerPlayer || null);
  const animationFrameRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const nodePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  useEffect(() => {
    // Initialize node positions
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    if (selectedPlayer) {
      // Arrange around selected player
      nodePositionsRef.current.set(selectedPlayer, { x: centerX, y: centerY });

      const connectedPlayers = players.filter(p => p.id !== selectedPlayer);
      connectedPlayers.forEach((player, index) => {
        const angle = (index / connectedPlayers.length) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        nodePositionsRef.current.set(player.id, { x, y });
      });
    } else {
      // Circular arrangement
      players.forEach((player, index) => {
        const angle = (index / players.length) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        nodePositionsRef.current.set(player.id, { x, y });
      });
    }
  }, [players, selectedPlayer, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const animate = () => {
      if (animated) {
        timeRef.current += 0.02;
      }

      ctx.clearRect(0, 0, width, height);

      // Dark background
      ctx.fillStyle = 'rgba(10, 14, 26, 0.98)';
      ctx.fillRect(0, 0, width, height);

      // Draw connections
      connections.forEach(connection => {
        const fromPos = nodePositionsRef.current.get(connection.from);
        const toPos = nodePositionsRef.current.get(connection.to);

        if (!fromPos || !toPos) return;

        const isHighlighted =
          hoveredPlayer === connection.from ||
          hoveredPlayer === connection.to ||
          selectedPlayer === connection.from ||
          selectedPlayer === connection.to;

        drawConnection(
          ctx,
          fromPos,
          toPos,
          connection.strength,
          isHighlighted,
          connection.type,
          timeRef.current
        );
      });

      // Draw nodes
      players.forEach(player => {
        const pos = nodePositionsRef.current.get(player.id);
        if (!pos) return;

        const isSelected = selectedPlayer === player.id;
        const isHovered = hoveredPlayer === player.id;

        drawNode(
          ctx,
          pos,
          player,
          isSelected,
          isHovered,
          timeRef.current
        );
      });

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
  }, [players, connections, width, height, animated, hoveredPlayer, selectedPlayer]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked player
    for (const [playerId, pos] of nodePositionsRef.current) {
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 30) {
        setSelectedPlayer(playerId === selectedPlayer ? null : playerId);
        return;
      }
    }

    setSelectedPlayer(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let found = false;
    for (const [playerId, pos] of nodePositionsRef.current) {
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 30) {
        setHoveredPlayer(playerId);
        found = true;
        break;
      }
    }

    if (!found) {
      setHoveredPlayer(null);
    }
  };

  const hoveredPlayerData = players.find(p => p.id === hoveredPlayer);

  return (
    <div className={styles.container}>
      <div className={styles.title}>Team Chemistry Network</div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPlayer(null)}
      />
      {hoveredPlayerData && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipName}>{hoveredPlayerData.name}</div>
          <div className={styles.tooltipPosition}>{hoveredPlayerData.position}</div>
        </div>
      )}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ background: '#00FFFF' }} />
          <span>Pass</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ background: '#FF6B6B' }} />
          <span>Assist</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ background: '#FFD700' }} />
          <span>Block</span>
        </div>
      </div>
    </div>
  );
}

function drawConnection(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  strength: number,
  highlighted: boolean,
  type: string = 'pass',
  time: number
) {
  // Connection color based on type
  const colors = {
    pass: '#00FFFF',
    assist: '#FF6B6B',
    block: '#FFD700',
    rebound: '#9B59B6',
  };
  const color = colors[type as keyof typeof colors] || '#00FFFF';

  ctx.save();

  // Bezier curve for natural connection
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const controlX = midX - dy * 0.2;
  const controlY = midY + dx * 0.2;

  // Line
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(controlX, controlY, to.x, to.y);

  ctx.strokeStyle = color;
  ctx.lineWidth = highlighted ? 3 * strength : 1 * strength;
  ctx.globalAlpha = highlighted ? 0.8 : 0.3 * strength;
  ctx.shadowBlur = highlighted ? 15 : 5;
  ctx.shadowColor = color;
  ctx.stroke();

  // Animated particles along connection
  if (highlighted) {
    const progress = (time % 1);
    const t = progress;
    const x = from.x * (1 - t) * (1 - t) + 2 * controlX * (1 - t) * t + to.x * t * t;
    const y = from.y * (1 - t) * (1 - t) + 2 * controlY * (1 - t) * t + to.y * t * t;

    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 20;
    ctx.fill();
  }

  ctx.restore();
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  player: Player,
  selected: boolean,
  hovered: boolean,
  time: number
) {
  ctx.save();

  const radius = selected ? 30 : hovered ? 25 : 20;
  const pulseRadius = radius + Math.sin(time * 2) * 3;

  // Outer glow
  if (selected || hovered) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pulseRadius + 10, 0, Math.PI * 2);
    ctx.fillStyle = selected ? 'rgba(191, 87, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
    ctx.fill();
  }

  // Node circle
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);

  // Gradient fill
  const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
  gradient.addColorStop(0, selected ? '#FF7D3C' : '#BF5700');
  gradient.addColorStop(1, selected ? '#BF5700' : '#9C4500');

  ctx.fillStyle = gradient;
  ctx.fill();

  // Border
  ctx.strokeStyle = selected ? '#FF7D3C' : hovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = selected ? 3 : 2;
  ctx.shadowBlur = selected ? 20 : 10;
  ctx.shadowColor = selected ? '#BF5700' : '#000000';
  ctx.stroke();

  // Player initials
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${selected ? '14px' : '12px'} monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 0;

  const initials = player.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  ctx.fillText(initials, pos.x, pos.y);

  // Position label
  if (selected || hovered) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '10px monospace';
    ctx.fillText(player.position, pos.x, pos.y + radius + 15);
  }

  ctx.restore();
}
