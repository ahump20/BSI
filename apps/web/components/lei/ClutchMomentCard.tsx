'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ClutchMomentCard.module.css';
import LEIMeter from './LEIMeter';

interface ClutchMomentCardProps {
  play: {
    play_id: string;
    description: string;
    players: string[];
    sport: 'baseball' | 'football';
    playoff_round: string;
    season: number;
    lei: number;
    components: {
      wpa: number;
      championship_weight: number;
      scarcity: number;
    };
    context: string;
  };
  rank?: number;
  interactive?: boolean;
  variant?: '2d' | '3d' | 'holographic';
}

/**
 * 3D Clutch Moment Card with Advanced Graphics
 * Features:
 * - 3D transform effects on hover
 * - Holographic gradient overlays
 * - Particle effects for legendary moments
 * - Animated stat reveals
 * - Dynamic lighting based on LEI score
 */
export default function ClutchMomentCard({
  play,
  rank,
  interactive = true,
  variant = '3d',
}: ClutchMomentCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isFlipped, setIsFlipped] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0.5, y: 0.5 });
  };

  const handleClick = () => {
    if (interactive) {
      setIsFlipped(!isFlipped);
    }
  };

  // Calculate 3D rotation based on mouse position
  const rotateX = variant === '3d' && isHovered ? (mousePosition.y - 0.5) * -20 : 0;
  const rotateY = variant === '3d' && isHovered ? (mousePosition.x - 0.5) * 20 : 0;

  // Dynamic glow color based on LEI score
  const getGlowColor = (lei: number): string => {
    if (lei >= 60) return 'rgba(255, 215, 0, 0.6)'; // Gold - Legendary
    if (lei >= 40) return 'rgba(239, 68, 68, 0.5)'; // Red - Elite
    if (lei >= 20) return 'rgba(245, 158, 11, 0.4)'; // Amber - High Leverage
    return 'rgba(6, 182, 212, 0.3)'; // Cyan - Important
  };

  const getSportIcon = (sport: string): string => {
    return sport === 'baseball' ? '⚾' : '🏈';
  };

  return (
    <div
      ref={cardRef}
      className={`${styles.cardContainer} ${styles[variant]}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={
        {
          '--rotate-x': `${rotateX}deg`,
          '--rotate-y': `${rotateY}deg`,
          '--glow-color': getGlowColor(play.lei),
          '--mouse-x': mousePosition.x,
          '--mouse-y': mousePosition.y,
        } as React.CSSProperties
      }
    >
      <div className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}>
        {/* Front of card */}
        <div className={styles.cardFront}>
          {/* Rank badge */}
          {rank !== undefined && (
            <div className={styles.rankBadge}>
              <div className={styles.rankNumber}>#{rank}</div>
            </div>
          )}

          {/* Holographic overlay */}
          {variant === 'holographic' && <div className={styles.holographicOverlay} />}

          {/* Gradient background based on LEI */}
          <div
            className={styles.cardBackground}
            style={{
              background:
                play.lei >= 60
                  ? 'linear-gradient(135deg, #1a0a00 0%, #4a1f00 50%, #1a0a00 100%)'
                  : play.lei >= 40
                  ? 'linear-gradient(135deg, #1a0000 0%, #4a0000 50%, #1a0000 100%)'
                  : 'linear-gradient(135deg, #001a1a 0%, #004a4a 50%, #001a1a 100%)',
            }}
          />

          {/* Content */}
          <div className={styles.cardContent}>
            {/* Header */}
            <div className={styles.cardHeader}>
              <span className={styles.sportIcon}>{getSportIcon(play.sport)}</span>
              <span className={styles.season}>{play.season}</span>
              <span className={styles.round}>
                {play.playoff_round.toUpperCase()}
              </span>
            </div>

            {/* Play description */}
            <h3 className={styles.playDescription}>{play.description}</h3>

            {/* Players */}
            <div className={styles.players}>
              {play.players.slice(0, 2).map((player, idx) => (
                <span key={idx} className={styles.playerName}>
                  {player}
                </span>
              ))}
            </div>

            {/* LEI Score Display */}
            <div className={styles.leiDisplay}>
              <div className={styles.leiLabel}>LEVERAGE INDEX</div>
              <div className={styles.leiScore}>{Math.round(play.lei)}</div>
              <div className={styles.leiBar}>
                <div
                  className={styles.leiBarFill}
                  style={{ width: `${play.lei}%` }}
                />
              </div>
            </div>

            {/* Stats grid */}
            <div className={styles.statsGrid}>
              <div className={styles.stat}>
                <div className={styles.statLabel}>WPA</div>
                <div className={styles.statValue}>
                  {(play.components.wpa * 100).toFixed(1)}%
                </div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>WEIGHT</div>
                <div className={styles.statValue}>
                  {play.components.championship_weight}x
                </div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>SCARCITY</div>
                <div className={styles.statValue}>
                  {(play.components.scarcity * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* Animated border glow */}
          <div className={styles.borderGlow} />

          {/* Corner accents */}
          <div className={styles.cornerAccent} data-corner="tl" />
          <div className={styles.cornerAccent} data-corner="tr" />
          <div className={styles.cornerAccent} data-corner="bl" />
          <div className={styles.cornerAccent} data-corner="br" />
        </div>

        {/* Back of card (detailed stats) */}
        <div className={styles.cardBack}>
          <div className={styles.cardBackContent}>
            <h4 className={styles.backTitle}>CLUTCH ANALYTICS</h4>

            <div className={styles.meterWrapper}>
              <LEIMeter score={play.lei} variant={play.lei > 60 ? 'legendary' : 'default'} />
            </div>

            <div className={styles.context}>{play.context}</div>

            <button className={styles.flipBack} onClick={handleClick}>
              ← BACK
            </button>
          </div>
        </div>
      </div>

      {/* Particle effects for legendary moments */}
      {play.lei > 60 && isHovered && <ParticleEffect color={getGlowColor(play.lei)} />}
    </div>
  );
}

/**
 * Particle effect component
 */
function ParticleEffect({ color }: { color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 600;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      size: number;
    }> = [];

    // Create particles
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: Math.random(),
        size: Math.random() * 3 + 1,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.005;

        if (p.life <= 0) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.life = 1;
        }

        ctx.globalAlpha = p.life;
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [color]);

  return <canvas ref={canvasRef} className={styles.particleCanvas} />;
}
