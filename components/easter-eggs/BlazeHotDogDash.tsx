'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { colors } from '@/src/styles/tokens/colors';

// Game colors derived from BSI design tokens
const gameColors = {
  burntOrange: colors.brand.burntOrange,
  texasSoil: colors.brand.texasSoil,
  charcoal: colors.background.charcoal,
  midnight: colors.background.midnight,
  ember: colors.brand.ember,
  mustard: '#FFD700',
  ketchup: colors.sports.cardinals,
  bun: '#DEB887',
  hotdog: '#CD5C5C',
  mustardYellow: '#FFD93D',
};

// Type definitions
interface ChonkLevel {
  threshold: number;
  label: string;
  emoji: string;
  description: string;
  index?: number;
}

interface PowerUpType {
  emoji: string;
  color: string;
  duration: number;
  description: string;
}

interface HotDogItem {
  id: number;
  x: number;
  y: number;
  speed: number;
  isGolden: boolean;
  isPowerUp: boolean;
  powerUpType: string | null;
  rotation: number;
  rotationSpeed: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  type: string;
  rotation: number;
  scale: number;
}

interface FloatingTextItem {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

interface BlazeHotDogDashProps {
  onClose: () => void;
}

// Chonk levels with funnier progression
const chonkLevels: ChonkLevel[] = [
  { threshold: 0, label: 'Aerodynamic Weiner', emoji: '💨', description: 'Built for speed' },
  { threshold: 5, label: 'Lil Snacker', emoji: '🌭', description: 'Just a taste...' },
  { threshold: 12, label: 'Snack Enthusiast', emoji: '😋', description: 'Getting warmed up' },
  { threshold: 20, label: 'Professional Muncher', emoji: '🏅', description: 'This is her calling' },
  { threshold: 30, label: 'Pleasantly Plump', emoji: '🐕', description: 'Healthy girl!' },
  { threshold: 42, label: 'Absolute Unit', emoji: '💪', description: 'In awe of this lass' },
  { threshold: 55, label: 'Certified Chonker', emoji: '👑', description: 'Round is a shape' },
  { threshold: 70, label: 'HEFTY GIRL', emoji: '🎺', description: "She comin'" },
  { threshold: 88, label: 'MEGA CHONK', emoji: '🌟', description: 'Approaching sphere' },
  { threshold: 108, label: 'OH LAWD SHE COMIN', emoji: '🚨', description: 'Earth orbit detected' },
  { threshold: 130, label: 'LEGENDARY LOAF', emoji: '🏆', description: 'Achieved final form' },
];

const getChonkLevel = (score: number): ChonkLevel & { index: number } => {
  for (let i = chonkLevels.length - 1; i >= 0; i--) {
    if (score >= chonkLevels[i].threshold) return { ...chonkLevels[i], index: i };
  }
  return { ...chonkLevels[0], index: 0 };
};

const getNextChonkLevel = (score: number): ChonkLevel | null => {
  for (let i = 0; i < chonkLevels.length; i++) {
    if (score < chonkLevels[i].threshold) return chonkLevels[i];
  }
  return null;
};

// Power-up types
const POWERUP_TYPES: Record<string, PowerUpType> = {
  MAGNET: { emoji: '🧲', color: '#E74C3C', duration: 5000, description: 'Hot Dog Magnet!' },
  DOUBLE: { emoji: '✖️2', color: '#9B59B6', duration: 6000, description: 'Double Points!' },
  SLOW: { emoji: '🐌', color: '#3498DB', duration: 5000, description: 'Slow Motion!' },
  TINY: { emoji: '🤏', color: '#2ECC71', duration: 4000, description: 'Diet Mode!' },
};

// Particle creator
const createParticle = (x: number, y: number, type: string): Particle => ({
  id: Math.random(),
  x,
  y,
  vx: (Math.random() - 0.5) * 6,
  vy: -Math.random() * 4 - 2,
  life: 1,
  type,
  rotation: Math.random() * 360,
  scale: 0.5 + Math.random() * 0.5,
});

// Floating text creator
const createFloatingText = (x: number, y: number, text: string, color: string): FloatingTextItem => ({
  id: Math.random(),
  x,
  y,
  text,
  color,
  life: 1,
});

// Hot Dog Component
const HotDog: React.FC<{
  x: number;
  y: number;
  isGolden: boolean;
  rotation: number;
  scale: number;
  isPowerUp: boolean;
  powerUpType: string | null;
}> = ({ x, y, isGolden, rotation, scale, isPowerUp, powerUpType }) => {
  if (isPowerUp && powerUpType) {
    const powerUp = POWERUP_TYPES[powerUpType];
    return (
      <div
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${powerUp.color}, ${powerUp.color}dd)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          boxShadow: `0 0 15px ${powerUp.color}, 0 0 30px ${powerUp.color}66`,
          animation: 'pulse-glow 0.5s ease-in-out infinite alternate',
          border: '2px solid white',
        }}
      >
        {powerUp.emoji}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
        width: '40px',
        height: '18px',
        filter: isGolden
          ? 'drop-shadow(0 0 8px #FFD700) drop-shadow(0 0 16px #FFD700)'
          : 'drop-shadow(2px 2px 3px rgba(0,0,0,0.4))',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: isGolden
            ? 'linear-gradient(180deg, #FFE566 0%, #FFD700 50%, #FFC107 100%)'
            : `linear-gradient(180deg, ${gameColors.bun} 0%, #D2A679 100%)`,
          borderRadius: '20px',
          boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '90%',
          height: '50%',
          left: '5%',
          top: '25%',
          background: isGolden
            ? 'linear-gradient(180deg, #FF6B6B 0%, #E55555 100%)'
            : `linear-gradient(180deg, ${gameColors.hotdog} 0%, #B84C4C 100%)`,
          borderRadius: '10px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '70%',
          height: '3px',
          left: '15%',
          top: '38%',
          background: gameColors.mustardYellow,
          clipPath:
            'polygon(0% 50%, 8% 0%, 16% 100%, 24% 0%, 32% 100%, 40% 0%, 48% 100%, 56% 0%, 64% 100%, 72% 0%, 80% 100%, 88% 0%, 96% 100%, 100% 50%)',
        }}
      />
      {isGolden && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            fontSize: '14px',
            animation: 'sparkle 0.6s ease-in-out infinite',
          }}
        >
          ✨
        </div>
      )}
    </div>
  );
};

// Blaze Component
const Blaze: React.FC<{
  chonkFactor: number;
  isWobbling: boolean;
  isCatching: boolean;
  isMoving: boolean;
  hasMagnet: boolean;
  hasDouble: boolean;
  isTiny: boolean;
}> = ({ chonkFactor, isWobbling, isCatching, isMoving, hasMagnet, hasDouble, isTiny }) => {
  const time = Date.now();
  const wobble = isWobbling ? Math.sin(time / 40) * 6 : 0;
  const breathe = Math.sin(time / 600) * 1.5;
  const tailWag = Math.sin(time / (isCatching ? 60 : 180)) * (isCatching ? 35 : 15);
  const earFlop = Math.sin(time / 400) * 4;
  const tongueWag = Math.sin(time / 150) * 4;
  const legAnim = isMoving ? Math.sin(time / 100) * 12 : 0;

  const cf = Math.min(chonkFactor, 1.8);
  const bodyWidth = 52 + (cf - 1) * 28;
  const bodyHeight = 24 + (cf - 1) * 10;
  const bellyShow = cf > 1.15;
  const bellySize = Math.max(0, (cf - 1.15) * 25);
  const cheekSize = Math.max(0, (cf - 1.2) * 12);
  const legHeight = Math.max(6, 14 - (cf - 1) * 10);
  const tinyScale = isTiny ? 0.7 : 1;

  return (
    <div
      style={{
        position: 'relative',
        width: '90px',
        height: '55px',
        transform: `rotate(${wobble}deg) scale(${tinyScale})`,
        transition: 'transform 0.05s ease-out',
      }}
    >
      {hasMagnet && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: '2px dashed #E74C3C',
            opacity: 0.5,
            animation: 'spin 2s linear infinite',
          }}
        />
      )}

      {hasDouble && (
        <div
          style={{
            position: 'absolute',
            top: '-15px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#9B59B6',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: 'bold',
          }}
        >
          x2
        </div>
      )}

      {/* Shadow */}
      <div
        style={{
          position: 'absolute',
          bottom: '0px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${bodyWidth + 10}px`,
          height: '8px',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Tail */}
      <div
        style={{
          position: 'absolute',
          left: '8px',
          top: '22px',
          width: '16px',
          height: '7px',
          background: `linear-gradient(90deg, ${gameColors.texasSoil} 0%, #7B4420 100%)`,
          borderRadius: '8px',
          transformOrigin: 'right center',
          transform: `rotate(${-25 + tailWag}deg)`,
        }}
      />

      {/* Back legs */}
      <div
        style={{
          position: 'absolute',
          left: '18px',
          bottom: '2px',
          width: '8px',
          height: `${legHeight}px`,
          background: `linear-gradient(180deg, ${gameColors.texasSoil} 0%, #6B3A10 100%)`,
          borderRadius: '0 0 4px 4px',
          transformOrigin: 'top center',
          transform: `rotate(${legAnim}deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '28px',
          bottom: '2px',
          width: '8px',
          height: `${legHeight}px`,
          background: `linear-gradient(180deg, ${gameColors.texasSoil} 0%, #6B3A10 100%)`,
          borderRadius: '0 0 4px 4px',
          transformOrigin: 'top center',
          transform: `rotate(${-legAnim}deg)`,
        }}
      />

      {/* Front legs */}
      <div
        style={{
          position: 'absolute',
          right: '22px',
          bottom: '2px',
          width: '8px',
          height: `${legHeight}px`,
          background: `linear-gradient(180deg, ${gameColors.texasSoil} 0%, #6B3A10 100%)`,
          borderRadius: '0 0 4px 4px',
          transformOrigin: 'top center',
          transform: `rotate(${-legAnim}deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '12px',
          bottom: '2px',
          width: '8px',
          height: `${legHeight}px`,
          background: `linear-gradient(180deg, ${gameColors.texasSoil} 0%, #6B3A10 100%)`,
          borderRadius: '0 0 4px 4px',
          transformOrigin: 'top center',
          transform: `rotate(${legAnim}deg)`,
        }}
      />

      {/* Main body */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: `${12 + breathe}px`,
          width: `${bodyWidth}px`,
          height: `${bodyHeight}px`,
          background: `linear-gradient(180deg, #A0522D 0%, ${gameColors.texasSoil} 40%, #6B3A10 100%)`,
          borderRadius: `${bodyHeight / 2}px`,
          boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)',
        }}
      />

      {/* Belly */}
      {bellyShow && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            top: `${22 + breathe + bellySize / 3}px`,
            width: `${bodyWidth * 0.65}px`,
            height: `${bellySize + 6}px`,
            background: 'linear-gradient(180deg, #DEBB98 0%, #D4A574 100%)',
            borderRadius: '0 0 50% 50% / 0 0 100% 100%',
            boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.1)',
          }}
        />
      )}

      {/* Collar */}
      <div
        style={{
          position: 'absolute',
          right: '18px',
          top: `${16 + breathe}px`,
          width: '12px',
          height: '7px',
          background: `linear-gradient(180deg, ${gameColors.burntOrange} 0%, #A04600 100%)`,
          borderRadius: '3px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: '-5px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '6px',
            height: '6px',
            background: `linear-gradient(135deg, ${gameColors.mustard} 0%, #DAA520 100%)`,
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Head */}
      <div
        style={{
          position: 'absolute',
          right: '0px',
          top: `${8 + breathe}px`,
          width: '30px',
          height: '26px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: `radial-gradient(ellipse at 35% 35%, #A0522D 0%, ${gameColors.texasSoil} 60%, #6B3A10 100%)`,
            borderRadius: '50% 50% 45% 45%',
          }}
        />

        {cheekSize > 0 && (
          <div
            style={{
              position: 'absolute',
              right: '-2px',
              top: '12px',
              width: `${cheekSize}px`,
              height: `${cheekSize * 0.8}px`,
              background: '#9B5A30',
              borderRadius: '50%',
              opacity: 0.6,
            }}
          />
        )}

        {/* Ear */}
        <div
          style={{
            position: 'absolute',
            left: '3px',
            top: '-6px',
            width: '12px',
            height: '18px',
            background: `linear-gradient(180deg, ${gameColors.texasSoil} 0%, #5D2E0C 100%)`,
            borderRadius: '45% 45% 40% 40%',
            transform: `rotate(${-20 + earFlop}deg)`,
            transformOrigin: 'bottom center',
          }}
        />

        {/* Snout */}
        <div
          style={{
            position: 'absolute',
            right: '-6px',
            bottom: '4px',
            width: '18px',
            height: '12px',
            background: 'linear-gradient(180deg, #7B4420 0%, #5D2E0C 100%)',
            borderRadius: '40%',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '1px',
              top: '2px',
              width: '9px',
              height: '7px',
              background: 'linear-gradient(135deg, #333 0%, #111 100%)',
              borderRadius: '40% 40% 45% 45%',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: '2px',
                width: '3px',
                height: '2px',
                background: 'rgba(255,255,255,0.4)',
                borderRadius: '50%',
              }}
            />
          </div>
        </div>

        {/* Eye */}
        {cf < 1.35 ? (
          <div
            style={{
              position: 'absolute',
              right: '10px',
              top: '7px',
              width: '9px',
              height: '9px',
              background: 'linear-gradient(135deg, #222 0%, #000 100%)',
              borderRadius: '50%',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: '2px',
                width: '3px',
                height: '3px',
                background: 'white',
                borderRadius: '50%',
              }}
            />
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              right: '8px',
              top: '9px',
              width: '12px',
              height: '5px',
              borderBottom: '3px solid #222',
              borderRadius: '0 0 50% 50%',
            }}
          />
        )}

        {/* Eyebrow */}
        <div
          style={{
            position: 'absolute',
            right: '8px',
            top: '4px',
            width: '11px',
            height: '2px',
            background: '#5D2E0C',
            borderRadius: '2px',
            transform: cf >= 1.35 ? 'rotate(-12deg)' : 'rotate(-5deg)',
          }}
        />

        {/* Blush */}
        {cf > 1.3 && (
          <div
            style={{
              position: 'absolute',
              right: '3px',
              top: '14px',
              width: '8px',
              height: '4px',
              background: 'rgba(255,130,130,0.5)',
              borderRadius: '50%',
              filter: 'blur(1px)',
            }}
          />
        )}

        {/* Tongue */}
        {(isCatching || cf > 1.25) && (
          <div
            style={{
              position: 'absolute',
              right: '2px',
              bottom: '0px',
              width: '8px',
              height: `${8 + Math.min((cf - 1) * 6, 8)}px`,
              background: 'linear-gradient(180deg, #FF8CAD 0%, #FF6B8A 100%)',
              borderRadius: '0 0 5px 5px',
              transform: `rotate(${tongueWag}deg)`,
              transformOrigin: 'top center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                width: '1px',
                height: '45%',
                background: 'rgba(0,0,0,0.15)',
              }}
            />
          </div>
        )}

        {/* Drool */}
        {cf > 1.5 && (
          <div
            style={{
              position: 'absolute',
              right: '8px',
              bottom: '-4px',
              width: '3px',
              height: `${4 + Math.sin(time / 400) * 2}px`,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(200,220,255,0.4) 100%)',
              borderRadius: '0 0 2px 2px',
            }}
          />
        )}
      </div>

      {/* Sleep bubbles */}
      {cf >= 1.7 && !isMoving && (
        <div
          style={{
            position: 'absolute',
            right: '-12px',
            top: '-5px',
            fontSize: '12px',
            opacity: 0.7,
            animation: 'float 1.5s ease-in-out infinite',
          }}
        >
          💤
        </div>
      )}
    </div>
  );
};

// Floating Text Component
const FloatingText: React.FC<{ item: FloatingTextItem }> = ({ item }) => (
  <div
    style={{
      position: 'absolute',
      left: `${item.x}%`,
      top: `${item.y}%`,
      transform: 'translate(-50%, -50%)',
      color: item.color,
      fontSize: '18px',
      fontWeight: 'bold',
      textShadow: '0 0 10px rgba(0,0,0,0.5)',
      opacity: item.life,
      pointerEvents: 'none',
    }}
  >
    {item.text}
  </div>
);

// Particle Component
const ParticleComponent: React.FC<{ particle: Particle }> = ({ particle }) => {
  const emojis: Record<string, string[]> = {
    catch: ['✨', '⭐', '💫'],
    golden: ['👑', '💎', '🌟'],
    combo: ['🔥', '💥', '⚡'],
  };
  const emoji = emojis[particle.type]?.[Math.floor(particle.id * 3) % 3] || '✨';

  return (
    <div
      style={{
        position: 'absolute',
        left: `${particle.x}%`,
        top: `${particle.y}%`,
        fontSize: `${14 * particle.scale}px`,
        opacity: particle.life,
        transform: `rotate(${particle.rotation}deg)`,
        pointerEvents: 'none',
      }}
    >
      {emoji}
    </div>
  );
};

// Power-up notification
const PowerUpNotification: React.FC<{ powerUp: string }> = ({ powerUp }) => (
  <div
    style={{
      position: 'absolute',
      top: '25%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: `${POWERUP_TYPES[powerUp].color}ee`,
      padding: '12px 24px',
      borderRadius: '12px',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '18px',
      animation: 'popIn 0.3s ease-out',
      zIndex: 50,
      boxShadow: `0 0 30px ${POWERUP_TYPES[powerUp].color}`,
    }}
  >
    {POWERUP_TYPES[powerUp].emoji} {POWERUP_TYPES[powerUp].description}
  </div>
);

// Chonk Level Up
const LevelUpNotification: React.FC<{ level: ChonkLevel; onComplete: () => void }> = ({
  level,
  onComplete,
}) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0,0,0,0.95)',
        border: `3px solid ${gameColors.burntOrange}`,
        borderRadius: '16px',
        padding: '16px 28px',
        textAlign: 'center',
        animation: 'popIn 0.3s ease-out, fadeOut 0.4s ease-in 1.6s forwards',
        zIndex: 100,
      }}
    >
      <div style={{ fontSize: '36px', marginBottom: '6px' }}>{level.emoji}</div>
      <div
        style={{
          color: gameColors.burntOrange,
          fontSize: '14px',
          fontWeight: 'bold',
          letterSpacing: '1px',
        }}
      >
        CHONK UP!
      </div>
      <div style={{ color: gameColors.mustard, fontSize: '18px', fontWeight: 'bold', margin: '4px 0' }}>
        {level.label}
      </div>
      <div style={{ color: '#888', fontSize: '12px' }}>{level.description}</div>
    </div>
  );
};

// Progress Bar
const ChonkProgressBar: React.FC<{
  score: number;
  currentLevel: ChonkLevel;
  nextLevel: ChonkLevel | null;
}> = ({ score, currentLevel, nextLevel }) => {
  const progress = nextLevel
    ? ((score - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100
    : 100;

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.6)',
        padding: '8px 15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <span style={{ fontSize: '18px' }}>{currentLevel.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ color: gameColors.ember, fontSize: '12px', fontWeight: 'bold' }}>
            {currentLevel.label}
          </span>
          {nextLevel && (
            <span style={{ color: '#666', fontSize: '10px' }}>
              {nextLevel.threshold - score} to {nextLevel.label}
            </span>
          )}
        </div>
        <div
          style={{
            height: '5px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${gameColors.burntOrange} 0%, ${gameColors.ember} 100%)`,
              borderRadius: '3px',
              transition: 'width 0.3s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Combo Display
const ComboDisplay: React.FC<{ combo: number }> = ({ combo }) => {
  if (combo < 3) return null;

  const intensity = Math.min(combo / 10, 1);

  return (
    <div
      style={{
        position: 'absolute',
        top: '15%',
        right: '10px',
        textAlign: 'right',
        animation: 'pulse 0.3s ease-out',
      }}
    >
      <div
        style={{
          fontSize: `${24 + intensity * 12}px`,
          fontWeight: 'bold',
          color: intensity > 0.5 ? gameColors.mustard : gameColors.ember,
          textShadow: `0 0 ${10 + intensity * 20}px ${intensity > 0.5 ? gameColors.mustard : gameColors.ember}`,
        }}
      >
        {combo}x
      </div>
      <div style={{ fontSize: '11px', color: '#888' }}>COMBO</div>
      {combo >= 10 && <div style={{ fontSize: '14px' }}>🔥</div>}
    </div>
  );
};

// Main Game Component
export default function BlazeHotDogDash({ onClose }: BlazeHotDogDashProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [hotDogs, setHotDogs] = useState<HotDogItem[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const [timeLeft, setTimeLeft] = useState(45);
  const [levelUpNotif, setLevelUpNotif] = useState<ChonkLevel | null>(null);
  const [lastChonkIndex, setLastChonkIndex] = useState(0);
  const [screenShake, setScreenShake] = useState(0);

  // Power-ups
  const [activePowerUps, setActivePowerUps] = useState<Record<string, boolean>>({});
  const [powerUpNotif, setPowerUpNotif] = useState<string | null>(null);

  // Refs for smooth animation
  const blazeXRef = useRef(50);
  const targetXRef = useRef(50);
  const [blazeX, setBlazeX] = useState(50);
  const [isCatching, setIsCatching] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const keysPressed = useRef({ left: false, right: false });
  const lastFrameTime = useRef(0);

  const chonkFactor = Math.min(1.8, 1.0 + score * 0.012);
  const currentChonkLevel = getChonkLevel(score);
  const nextChonkLevel = getNextChonkLevel(score);

  // Active power-up checks
  const hasMagnet = !!activePowerUps.MAGNET;
  const hasDouble = !!activePowerUps.DOUBLE;
  const hasSlow = !!activePowerUps.SLOW;
  const hasTiny = !!activePowerUps.TINY;

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('blaze-hotdog-highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Check for level up
  useEffect(() => {
    if (currentChonkLevel.index > lastChonkIndex && gameStarted) {
      setLevelUpNotif(currentChonkLevel);
      setLastChonkIndex(currentChonkLevel.index);
      setScreenShake(5);
    }
  }, [currentChonkLevel.index, lastChonkIndex, gameStarted]);

  // Keyboard controls
  useEffect(() => {
    if (!gameStarted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysPressed.current.left = true;
      if (e.key === 'ArrowRight') keysPressed.current.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysPressed.current.left = false;
      if (e.key === 'ArrowRight') keysPressed.current.right = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted]);

  // Touch controls
  const handleTouch = useCallback(
    (e: React.TouchEvent) => {
      if (!gameStarted || !gameRef.current) return;
      e.preventDefault();
      const rect = gameRef.current.getBoundingClientRect();
      const touchX = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
      targetXRef.current = Math.max(8, Math.min(92, touchX));
    },
    [gameStarted]
  );

  // Main game loop
  useEffect(() => {
    if (!gameStarted) return;

    const gameLoop = (timestamp: number) => {
      const deltaTime = Math.min(timestamp - lastFrameTime.current, 32);
      lastFrameTime.current = timestamp;

      // Movement
      const moveSpeed = 0.12;
      if (keysPressed.current.left) {
        targetXRef.current = Math.max(8, targetXRef.current - moveSpeed * deltaTime);
      }
      if (keysPressed.current.right) {
        targetXRef.current = Math.min(92, targetXRef.current + moveSpeed * deltaTime);
      }

      const prevX = blazeXRef.current;
      blazeXRef.current += (targetXRef.current - blazeXRef.current) * 0.2;
      setBlazeX(blazeXRef.current);
      setIsMoving(Math.abs(blazeXRef.current - prevX) > 0.3);

      // Magnet effect
      if (hasMagnet) {
        setHotDogs((prev) =>
          prev.map((dog) => {
            if (dog.isPowerUp) return dog;
            const dist = Math.abs(dog.x - blazeXRef.current);
            if (dist < 25 && dog.y > 30) {
              const pull = ((25 - dist) / 25) * 0.5;
              return { ...dog, x: dog.x + (blazeXRef.current - dog.x) * pull * 0.1 };
            }
            return dog;
          })
        );
      }

      // Update hot dogs
      const speedMult = hasSlow ? 0.5 : 1;

      setHotDogs((prev) => {
        const hitboxWidth = 15 + (chonkFactor - 1) * 8;
        const updated: HotDogItem[] = [];

        prev.forEach((dog) => {
          const newY = dog.y + dog.speed * speedMult * (deltaTime / 16);

          // Collision
          if (newY >= 65 && newY <= 92 && Math.abs(dog.x - blazeXRef.current) < hitboxWidth) {
            if (dog.isPowerUp && dog.powerUpType) {
              // Activate power-up
              const powerUpType = dog.powerUpType;
              const powerUp = POWERUP_TYPES[powerUpType];
              setActivePowerUps((p) => ({ ...p, [powerUpType]: true }));
              setPowerUpNotif(powerUpType);
              setTimeout(() => setPowerUpNotif(null), 1500);
              setTimeout(() => {
                setActivePowerUps((p) => {
                  const next = { ...p };
                  delete next[powerUpType];
                  return next;
                });
              }, powerUp.duration);
            } else {
              // Score points
              let points = dog.isGolden ? 5 : 1;
              const comboBonus = Math.floor(combo / 5);
              points += comboBonus;
              if (hasDouble) points *= 2;
              if (hasTiny) points = Math.ceil(points * 0.5);

              setScore((s) => s + points);
              setCombo((c) => {
                const newCombo = c + 1;
                setMaxCombo((m) => Math.max(m, newCombo));
                return newCombo;
              });

              // Visual feedback
              setFloatingTexts((t) => [
                ...t,
                createFloatingText(
                  dog.x,
                  newY - 5,
                  `+${points}${hasDouble ? '!' : ''}`,
                  dog.isGolden ? gameColors.mustard : 'white'
                ),
              ]);

              // Particles
              const particleType = combo >= 10 ? 'combo' : dog.isGolden ? 'golden' : 'catch';
              for (let i = 0; i < (dog.isGolden ? 6 : 3); i++) {
                setParticles((p) => [...p, createParticle(dog.x, newY, particleType)]);
              }

              setIsCatching(true);
              setTimeout(() => setIsCatching(false), 150);

              if (combo > 0 && combo % 10 === 9) {
                setScreenShake(3);
              }
            }
          } else if (newY < 105) {
            updated.push({
              ...dog,
              y: newY,
              rotation: (dog.rotation || 0) + (dog.rotationSpeed || 0),
            });
          } else if (!dog.isPowerUp) {
            setCombo(0);
          }
        });

        return updated;
      });

      // Update particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.08,
            y: p.y + p.vy * 0.08,
            vy: p.vy + 0.12,
            life: p.life - 0.025,
            rotation: p.rotation + 4,
          }))
          .filter((p) => p.life > 0)
      );

      // Update floating texts
      setFloatingTexts((prev) =>
        prev
          .map((t) => ({
            ...t,
            y: t.y - 0.4,
            life: t.life - 0.02,
          }))
          .filter((t) => t.life > 0)
      );

      // Screen shake decay
      setScreenShake((s) => Math.max(0, s - 0.3));

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    lastFrameTime.current = performance.now();
    frameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [gameStarted, chonkFactor, hasMagnet, hasDouble, hasSlow, hasTiny, combo]);

  // Spawn hot dogs
  useEffect(() => {
    if (!gameStarted) return;

    const baseInterval = 1600;
    const minInterval = 900;
    const interval = Math.max(minInterval, baseInterval - score * 4);

    const spawnInterval = setInterval(() => {
      const isPowerUp = Math.random() < 0.06;

      const newDog: HotDogItem = {
        id: Date.now() + Math.random(),
        x: Math.random() * 75 + 12,
        y: -5,
        speed: 0.6 + Math.random() * 0.3 + Math.min(score * 0.003, 0.3),
        isGolden: !isPowerUp && Math.random() < 0.18,
        isPowerUp,
        powerUpType: isPowerUp
          ? Object.keys(POWERUP_TYPES)[Math.floor(Math.random() * 4)]
          : null,
        rotation: Math.random() * 20 - 10,
        rotationSpeed: (Math.random() - 0.5) * 1.5,
      };
      setHotDogs((prev) => [...prev, newDog]);
    }, interval);

    return () => clearInterval(spawnInterval);
  }, [gameStarted, score]);

  // Timer
  useEffect(() => {
    if (!gameStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameStarted(false);
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('blaze-hotdog-highscore', score.toString());
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, timeLeft, score, highScore]);

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(45);
    setHotDogs([]);
    setParticles([]);
    setFloatingTexts([]);
    setActivePowerUps({});
    blazeXRef.current = 50;
    targetXRef.current = 50;
    setBlazeX(50);
    setLastChonkIndex(0);
    setLevelUpNotif(null);
    setScreenShake(0);
    keysPressed.current = { left: false, right: false };
  };

  const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 2 : 0;
  const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 2 : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: `linear-gradient(180deg, #0a2815 0%, #1a472a 30%, #2d5a27 60%, ${gameColors.texasSoil} 100%)`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        userSelect: 'none',
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(180deg, ${gameColors.midnight} 0%, rgba(13,13,13,0.95) 100%)`,
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `3px solid ${gameColors.burntOrange}`,
        }}
      >
        <div
          style={{
            color: gameColors.burntOrange,
            fontWeight: 'bold',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '22px' }}>🌭</span>
          Blaze&apos;s Hot Dog Dash
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#888',
            fontSize: '18px',
            cursor: 'pointer',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
          }}
        >
          ×
        </button>
      </div>

      {/* Score Bar */}
      <div
        style={{
          background: 'rgba(0,0,0,0.7)',
          padding: '10px 15px',
          display: 'flex',
          justifyContent: 'space-around',
          color: 'white',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#888' }}>SCORE</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: gameColors.ember }}>{score}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#888' }}>TIME</div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: timeLeft <= 10 ? gameColors.ketchup : 'white',
              animation: timeLeft <= 10 ? 'pulse 0.5s infinite' : 'none',
            }}
          >
            {timeLeft}s
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#888' }}>BEST</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: gameColors.mustard }}>
            {highScore}
          </div>
        </div>
      </div>

      {/* Chonk Progress */}
      {gameStarted && (
        <ChonkProgressBar
          score={score}
          currentLevel={currentChonkLevel}
          nextLevel={nextChonkLevel}
        />
      )}

      {/* Active Power-ups Display */}
      {Object.keys(activePowerUps).length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '140px',
            left: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            zIndex: 40,
          }}
        >
          {Object.keys(activePowerUps).map((key) => (
            <div
              key={key}
              style={{
                background: POWERUP_TYPES[key].color,
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              {POWERUP_TYPES[key].emoji}
            </div>
          ))}
        </div>
      )}

      {/* Game Area */}
      <div
        ref={gameRef}
        onTouchMove={handleTouch}
        onTouchStart={handleTouch}
        style={{
          position: 'relative',
          height: 'calc(100vh - 170px)',
          overflow: 'hidden',
        }}
      >
        {/* Combo Display */}
        <ComboDisplay combo={combo} />

        {/* Hot Dogs */}
        {hotDogs.map((dog) => (
          <HotDog
            key={dog.id}
            x={dog.x}
            y={dog.y}
            isGolden={dog.isGolden}
            rotation={dog.rotation || 0}
            scale={dog.isGolden ? 1.1 : 1}
            isPowerUp={dog.isPowerUp}
            powerUpType={dog.powerUpType}
          />
        ))}

        {/* Particles */}
        {particles.map((p) => (
          <ParticleComponent key={p.id} particle={p} />
        ))}

        {/* Floating Texts */}
        {floatingTexts.map((t) => (
          <FloatingText key={t.id} item={t} />
        ))}

        {/* Blaze */}
        <div
          style={{
            position: 'absolute',
            left: `${blazeX}%`,
            bottom: '6%',
            transform: 'translateX(-50%)',
          }}
        >
          <Blaze
            chonkFactor={chonkFactor}
            isWobbling={isCatching}
            isCatching={isCatching}
            isMoving={isMoving}
            hasMagnet={hasMagnet}
            hasDouble={hasDouble}
            isTiny={hasTiny}
          />
        </div>

        {/* Power-up Notification */}
        {powerUpNotif && <PowerUpNotification powerUp={powerUpNotif} />}

        {/* Level Up */}
        {levelUpNotif && (
          <LevelUpNotification level={levelUpNotif} onComplete={() => setLevelUpNotif(null)} />
        )}

        {/* Start/Game Over Overlay */}
        {!gameStarted && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.92)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              padding: '20px',
            }}
          >
            {timeLeft === 0 ? (
              <>
                <h2 style={{ color: gameColors.burntOrange, marginBottom: '12px', fontSize: '28px' }}>
                  Game Over!
                </h2>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '16px 32px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                    Final Score:{' '}
                    <b style={{ color: gameColors.ember, fontSize: '26px' }}>{score}</b>
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      color: gameColors.mustard,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{currentChonkLevel.emoji}</span>
                    <span>{currentChonkLevel.label}</span>
                  </div>
                  <div style={{ color: '#666', fontSize: '12px', marginTop: '6px' }}>
                    {currentChonkLevel.description}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '12px', fontSize: '13px' }}>
                  <span>
                    Max Combo: <b style={{ color: gameColors.ember }}>x{maxCombo}</b>
                  </span>
                  {score === highScore && score > 0 && (
                    <span style={{ color: gameColors.mustard }}>🏆 NEW BEST!</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: '70px',
                    marginBottom: '12px',
                    animation: 'wiggle 0.6s ease-in-out infinite',
                  }}
                >
                  🐕
                </div>
                <h2 style={{ color: gameColors.burntOrange, fontSize: '24px', marginBottom: '4px' }}>
                  Blaze&apos;s Hot Dog Dash
                </h2>
                <p style={{ color: '#666', fontSize: '12px', marginBottom: '12px' }}>
                  A Blaze Sports Intel Easter Egg
                </p>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '10px',
                    padding: '12px 20px',
                    marginBottom: '16px',
                    textAlign: 'center',
                    fontSize: '13px',
                  }}
                >
                  <p style={{ color: '#aaa', marginBottom: '6px' }}>Catch hot dogs to feed Blaze!</p>
                  <p style={{ color: gameColors.mustard, marginBottom: '6px' }}>
                    ⭐ Golden = 5 pts &nbsp; 🧲💜🐌🤏 = Power-ups!
                  </p>
                  <p style={{ color: '#666', fontSize: '11px' }}>(Watch her get chubbier 🥹)</p>
                </div>
              </>
            )}
            <button
              onClick={startGame}
              style={{
                background: `linear-gradient(180deg, ${gameColors.burntOrange} 0%, #A04600 100%)`,
                color: 'white',
                border: 'none',
                padding: '14px 44px',
                fontSize: '18px',
                fontWeight: 'bold',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(191,87,0,0.4)',
              }}
            >
              {timeLeft === 0 ? '🔄 Play Again' : '🎮 Start Game'}
            </button>
            <p style={{ color: '#555', fontSize: '11px', marginTop: '16px' }}>
              ← → Arrow keys or touch to move
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes sparkle { 0%, 100% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.2) rotate(180deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes pulse-glow { 0% { box-shadow: 0 0 10px currentColor; } 100% { box-shadow: 0 0 25px currentColor; } }
        @keyframes wiggle { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
        @keyframes popIn { 0% { transform: translate(-50%, -50%) scale(0); } 70% { transform: translate(-50%, -50%) scale(1.1); } 100% { transform: translate(-50%, -50%) scale(1); } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes spin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
      `}</style>
    </div>
  );
}
