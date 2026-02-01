import React, { useState, useEffect, useCallback, useRef } from 'react';

const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

const colors = {
  burntOrange: '#BF5700',
  texasSoil: '#8B4513',
  charcoal: '#1A1A1A',
  midnight: '#0D0D0D',
  ember: '#FF6B35',
  mustard: '#FFD700',
  ketchup: '#C41E3A',
  bun: '#DEB887',
  hotdog: '#CD5C5C',
  mustardYellow: '#FFD93D',
};

// Chonk levels with funnier progression
const chonkLevels = [
  { threshold: 0, label: 'Aerodynamic Weiner', emoji: '💨', description: 'Built for speed' },
  { threshold: 5, label: 'Lil Snacker', emoji: '🌭', description: 'Just a taste...' },
  { threshold: 12, label: 'Snack Enthusiast', emoji: '😋', description: 'Getting warmed up' },
  { threshold: 20, label: 'Professional Muncher', emoji: '🏅', description: 'This is her calling' },
  { threshold: 30, label: 'Pleasantly Plump', emoji: '🐕', description: 'Healthy girl!' },
  { threshold: 42, label: 'Absolute Unit', emoji: '💪', description: 'In awe of this lass' },
  { threshold: 55, label: 'Certified Chonker', emoji: '👑', description: 'Round is a shape' },
  { threshold: 70, label: 'HEFTY GIRL', emoji: '🎺', description: 'She comin\'' },
  { threshold: 88, label: 'MEGA CHONK', emoji: '🌟', description: 'Approaching sphere' },
  { threshold: 108, label: 'OH LAWD SHE COMIN', emoji: '🚨', description: 'Earth orbit detected' },
  { threshold: 130, label: 'LEGENDARY LOAF', emoji: '🏆', description: 'Achieved final form' },
];

const getChonkLevel = (score) => {
  for (let i = chonkLevels.length - 1; i >= 0; i--) {
    if (score >= chonkLevels[i].threshold) return { ...chonkLevels[i], index: i };
  }
  return { ...chonkLevels[0], index: 0 };
};

const getNextChonkLevel = (score) => {
  for (let i = 0; i < chonkLevels.length; i++) {
    if (score < chonkLevels[i].threshold) return chonkLevels[i];
  }
  return null;
};

// Power-up types
const POWERUP_TYPES = {
  MAGNET: { emoji: '🧲', color: '#E74C3C', duration: 5000, description: 'Hot Dog Magnet!' },
  DOUBLE: { emoji: '✖️2', color: '#9B59B6', duration: 6000, description: 'Double Points!' },
  SLOW: { emoji: '🐌', color: '#3498DB', duration: 5000, description: 'Slow Motion!' },
  TINY: { emoji: '🤏', color: '#2ECC71', duration: 4000, description: 'Diet Mode!' },
};

// Particle creator
const createParticle = (x, y, type) => ({
  id: Math.random(),
  x, y,
  vx: (Math.random() - 0.5) * 6,
  vy: -Math.random() * 4 - 2,
  life: 1,
  type,
  rotation: Math.random() * 360,
  scale: 0.5 + Math.random() * 0.5,
});

// Floating text creator
const createFloatingText = (x, y, text, color) => ({
  id: Math.random(),
  x, y,
  text,
  color,
  life: 1,
});

// Hot Dog Component
const HotDog = ({ x, y, isGolden, rotation, scale, isPowerUp, powerUpType }) => {
  if (isPowerUp) {
    const powerUp = POWERUP_TYPES[powerUpType];
    return (
      <div style={{
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
      }}>
        {powerUp.emoji}
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
      width: '40px',
      height: '18px',
      filter: isGolden ? 'drop-shadow(0 0 8px #FFD700) drop-shadow(0 0 16px #FFD700)' : 'drop-shadow(2px 2px 3px rgba(0,0,0,0.4))',
    }}>
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: isGolden 
          ? 'linear-gradient(180deg, #FFE566 0%, #FFD700 50%, #FFC107 100%)'
          : `linear-gradient(180deg, ${colors.bun} 0%, #D2A679 100%)`,
        borderRadius: '20px',
        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
      }} />
      <div style={{
        position: 'absolute',
        width: '90%',
        height: '50%',
        left: '5%',
        top: '25%',
        background: isGolden
          ? 'linear-gradient(180deg, #FF6B6B 0%, #E55555 100%)'
          : `linear-gradient(180deg, ${colors.hotdog} 0%, #B84C4C 100%)`,
        borderRadius: '10px',
      }} />
      <div style={{
        position: 'absolute',
        width: '70%',
        height: '3px',
        left: '15%',
        top: '38%',
        background: colors.mustardYellow,
        clipPath: 'polygon(0% 50%, 8% 0%, 16% 100%, 24% 0%, 32% 100%, 40% 0%, 48% 100%, 56% 0%, 64% 100%, 72% 0%, 80% 100%, 88% 0%, 96% 100%, 100% 50%)',
      }} />
      {isGolden && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          fontSize: '14px',
          animation: 'sparkle 0.6s ease-in-out infinite',
        }}>✨</div>
      )}
    </div>
  );
};

// Fixed Blaze Component - proper proportions at all chonk levels
const Blaze = ({ chonkFactor, isWobbling, isCatching, isMoving, hasMagnet, hasDouble, isTiny }) => {
  const time = Date.now();
  const wobble = isWobbling ? Math.sin(time / 40) * 6 : 0;
  const breathe = Math.sin(time / 600) * 1.5;
  const tailWag = Math.sin(time / (isCatching ? 60 : 180)) * (isCatching ? 35 : 15);
  const earFlop = Math.sin(time / 400) * 4;
  const tongueWag = Math.sin(time / 150) * 4;
  const legAnim = isMoving ? Math.sin(time / 100) * 12 : 0;
  
  // Chonk affects specific parts, not overall scale
  // clamp chonkFactor for visual sanity
  const cf = Math.min(chonkFactor, 1.8);
  
  // Body gets wider and rounder, not taller
  const bodyWidth = 52 + (cf - 1) * 28;
  const bodyHeight = 24 + (cf - 1) * 10;
  const bellyShow = cf > 1.15;
  const bellySize = Math.max(0, (cf - 1.15) * 25);
  
  // Cheek puffiness
  const cheekSize = Math.max(0, (cf - 1.2) * 12);
  
  // Leg shortening (they get hidden by belly)
  const legHeight = Math.max(6, 14 - (cf - 1) * 10);
  
  // Apply tiny mode
  const tinyScale = isTiny ? 0.7 : 1;
  
  return (
    <div style={{
      position: 'relative',
      width: '90px',
      height: '55px',
      transform: `rotate(${wobble}deg) scale(${tinyScale})`,
      transition: 'transform 0.05s ease-out',
    }}>
      {/* Magnet effect ring */}
      {hasMagnet && (
        <div style={{
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
        }} />
      )}
      
      {/* Double points indicator */}
      {hasDouble && (
        <div style={{
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
        }}>x2</div>
      )}
      
      {/* Shadow */}
      <div style={{
        position: 'absolute',
        bottom: '0px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${bodyWidth + 10}px`,
        height: '8px',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />
      
      {/* Tail */}
      <div style={{
        position: 'absolute',
        left: '8px',
        top: '22px',
        width: '16px',
        height: '7px',
        background: `linear-gradient(90deg, ${colors.texasSoil} 0%, #7B4420 100%)`,
        borderRadius: '8px',
        transformOrigin: 'right center',
        transform: `rotate(${-25 + tailWag}deg)`,
      }} />
      
      {/* Back legs */}
      <div style={{
        position: 'absolute',
        left: '18px',
        bottom: '2px',
        width: '8px',
        height: `${legHeight}px`,
        background: `linear-gradient(180deg, ${colors.texasSoil} 0%, #6B3A10 100%)`,
        borderRadius: '0 0 4px 4px',
        transformOrigin: 'top center',
        transform: `rotate(${legAnim}deg)`,
      }} />
      <div style={{
        position: 'absolute',
        left: '28px',
        bottom: '2px',
        width: '8px',
        height: `${legHeight}px`,
        background: `linear-gradient(180deg, ${colors.texasSoil} 0%, #6B3A10 100%)`,
        borderRadius: '0 0 4px 4px',
        transformOrigin: 'top center',
        transform: `rotate(${-legAnim}deg)`,
      }} />
      
      {/* Front legs */}
      <div style={{
        position: 'absolute',
        right: '22px',
        bottom: '2px',
        width: '8px',
        height: `${legHeight}px`,
        background: `linear-gradient(180deg, ${colors.texasSoil} 0%, #6B3A10 100%)`,
        borderRadius: '0 0 4px 4px',
        transformOrigin: 'top center',
        transform: `rotate(${-legAnim}deg)`,
      }} />
      <div style={{
        position: 'absolute',
        right: '12px',
        bottom: '2px',
        width: '8px',
        height: `${legHeight}px`,
        background: `linear-gradient(180deg, ${colors.texasSoil} 0%, #6B3A10 100%)`,
        borderRadius: '0 0 4px 4px',
        transformOrigin: 'top center',
        transform: `rotate(${legAnim}deg)`,
      }} />
      
      {/* Main body - gets rounder with chonk */}
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        top: `${12 + breathe}px`,
        width: `${bodyWidth}px`,
        height: `${bodyHeight}px`,
        background: `linear-gradient(180deg, #A0522D 0%, ${colors.texasSoil} 40%, #6B3A10 100%)`,
        borderRadius: `${bodyHeight/2}px`,
        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.1)',
      }} />
      
      {/* Belly - cute round tummy that shows with chonk */}
      {bellyShow && (
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: `${22 + breathe + bellySize/3}px`,
          width: `${bodyWidth * 0.65}px`,
          height: `${bellySize + 6}px`,
          background: 'linear-gradient(180deg, #DEBB98 0%, #D4A574 100%)',
          borderRadius: '0 0 50% 50% / 0 0 100% 100%',
          boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.1)',
        }} />
      )}
      
      {/* Collar */}
      <div style={{
        position: 'absolute',
        right: '18px',
        top: `${16 + breathe}px`,
        width: '12px',
        height: '7px',
        background: `linear-gradient(180deg, ${colors.burntOrange} 0%, #A04600 100%)`,
        borderRadius: '3px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          position: 'absolute',
          bottom: '-5px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '6px',
          height: '6px',
          background: `linear-gradient(135deg, ${colors.mustard} 0%, #DAA520 100%)`,
          borderRadius: '50%',
        }} />
      </div>
      
      {/* Head - stays mostly same size */}
      <div style={{
        position: 'absolute',
        right: '0px',
        top: `${8 + breathe}px`,
        width: '30px',
        height: '26px',
      }}>
        {/* Head shape */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse at 35% 35%, #A0522D 0%, ${colors.texasSoil} 60%, #6B3A10 100%)`,
          borderRadius: '50% 50% 45% 45%',
        }} />
        
        {/* Chubby cheek */}
        {cheekSize > 0 && (
          <div style={{
            position: 'absolute',
            right: '-2px',
            top: '12px',
            width: `${cheekSize}px`,
            height: `${cheekSize * 0.8}px`,
            background: '#9B5A30',
            borderRadius: '50%',
            opacity: 0.6,
          }} />
        )}
        
        {/* Ear */}
        <div style={{
          position: 'absolute',
          left: '3px',
          top: '-6px',
          width: '12px',
          height: '18px',
          background: `linear-gradient(180deg, ${colors.texasSoil} 0%, #5D2E0C 100%)`,
          borderRadius: '45% 45% 40% 40%',
          transform: `rotate(${-20 + earFlop}deg)`,
          transformOrigin: 'bottom center',
        }} />
        
        {/* Snout */}
        <div style={{
          position: 'absolute',
          right: '-6px',
          bottom: '4px',
          width: '18px',
          height: '12px',
          background: `linear-gradient(180deg, #7B4420 0%, #5D2E0C 100%)`,
          borderRadius: '40%',
        }}>
          {/* Nose */}
          <div style={{
            position: 'absolute',
            right: '1px',
            top: '2px',
            width: '9px',
            height: '7px',
            background: 'linear-gradient(135deg, #333 0%, #111 100%)',
            borderRadius: '40% 40% 45% 45%',
          }}>
            <div style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              width: '3px',
              height: '2px',
              background: 'rgba(255,255,255,0.4)',
              borderRadius: '50%',
            }} />
          </div>
        </div>
        
        {/* Eye - changes expression with chonk */}
        {cf < 1.35 ? (
          // Normal eye
          <div style={{
            position: 'absolute',
            right: '10px',
            top: '7px',
            width: '9px',
            height: '9px',
            background: 'linear-gradient(135deg, #222 0%, #000 100%)',
            borderRadius: '50%',
          }}>
            <div style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              width: '3px',
              height: '3px',
              background: 'white',
              borderRadius: '50%',
            }} />
          </div>
        ) : (
          // Happy squinty eye
          <div style={{
            position: 'absolute',
            right: '8px',
            top: '9px',
            width: '12px',
            height: '5px',
            borderBottom: '3px solid #222',
            borderRadius: '0 0 50% 50%',
          }} />
        )}
        
        {/* Eyebrow */}
        <div style={{
          position: 'absolute',
          right: '8px',
          top: '4px',
          width: '11px',
          height: '2px',
          background: '#5D2E0C',
          borderRadius: '2px',
          transform: cf >= 1.35 ? 'rotate(-12deg)' : 'rotate(-5deg)',
        }} />
        
        {/* Blush */}
        {cf > 1.3 && (
          <div style={{
            position: 'absolute',
            right: '3px',
            top: '14px',
            width: '8px',
            height: '4px',
            background: 'rgba(255,130,130,0.5)',
            borderRadius: '50%',
            filter: 'blur(1px)',
          }} />
        )}
        
        {/* Tongue */}
        {(isCatching || cf > 1.25) && (
          <div style={{
            position: 'absolute',
            right: '2px',
            bottom: '0px',
            width: '8px',
            height: `${8 + Math.min((cf - 1) * 6, 8)}px`,
            background: 'linear-gradient(180deg, #FF8CAD 0%, #FF6B8A 100%)',
            borderRadius: '0 0 5px 5px',
            transform: `rotate(${tongueWag}deg)`,
            transformOrigin: 'top center',
          }}>
            <div style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              width: '1px',
              height: '45%',
              background: 'rgba(0,0,0,0.15)',
            }} />
          </div>
        )}
        
        {/* Drool at high chonk */}
        {cf > 1.5 && (
          <div style={{
            position: 'absolute',
            right: '8px',
            bottom: '-4px',
            width: '3px',
            height: `${4 + Math.sin(time / 400) * 2}px`,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(200,220,255,0.4) 100%)',
            borderRadius: '0 0 2px 2px',
          }} />
        )}
      </div>
      
      {/* Sleep bubbles at max chonk when idle */}
      {cf >= 1.7 && !isMoving && (
        <div style={{
          position: 'absolute',
          right: '-12px',
          top: '-5px',
          fontSize: '12px',
          opacity: 0.7,
          animation: 'float 1.5s ease-in-out infinite',
        }}>💤</div>
      )}
    </div>
  );
};

// Floating Text Component
const FloatingText = ({ item }) => (
  <div style={{
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
  }}>
    {item.text}
  </div>
);

// Particle Component
const Particle = ({ particle }) => {
  const emojis = {
    catch: ['✨', '⭐', '💫'],
    golden: ['👑', '💎', '🌟'],
    combo: ['🔥', '💥', '⚡'],
  };
  const emoji = emojis[particle.type]?.[Math.floor(particle.id * 3) % 3] || '✨';
  
  return (
    <div style={{
      position: 'absolute',
      left: `${particle.x}%`,
      top: `${particle.y}%`,
      fontSize: `${14 * particle.scale}px`,
      opacity: particle.life,
      transform: `rotate(${particle.rotation}deg)`,
      pointerEvents: 'none',
    }}>
      {emoji}
    </div>
  );
};

// Power-up notification
const PowerUpNotification = ({ powerUp }) => (
  <div style={{
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
  }}>
    {POWERUP_TYPES[powerUp].emoji} {POWERUP_TYPES[powerUp].description}
  </div>
);

// Chonk Level Up
const LevelUpNotification = ({ level, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div style={{
      position: 'absolute',
      top: '30%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0,0,0,0.95)',
      border: `3px solid ${colors.burntOrange}`,
      borderRadius: '16px',
      padding: '16px 28px',
      textAlign: 'center',
      animation: 'popIn 0.3s ease-out, fadeOut 0.4s ease-in 1.6s forwards',
      zIndex: 100,
    }}>
      <div style={{ fontSize: '36px', marginBottom: '6px' }}>{level.emoji}</div>
      <div style={{ color: colors.burntOrange, fontSize: '14px', fontWeight: 'bold', letterSpacing: '1px' }}>
        CHONK UP!
      </div>
      <div style={{ color: colors.mustard, fontSize: '18px', fontWeight: 'bold', margin: '4px 0' }}>
        {level.label}
      </div>
      <div style={{ color: '#888', fontSize: '12px' }}>{level.description}</div>
    </div>
  );
};

// Progress Bar
const ChonkProgressBar = ({ score, currentLevel, nextLevel }) => {
  const progress = nextLevel 
    ? ((score - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100
    : 100;
    
  return (
    <div style={{
      background: 'rgba(0,0,0,0.6)',
      padding: '8px 15px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}>
      <span style={{ fontSize: '18px' }}>{currentLevel.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ color: colors.ember, fontSize: '12px', fontWeight: 'bold' }}>
            {currentLevel.label}
          </span>
          {nextLevel && (
            <span style={{ color: '#666', fontSize: '10px' }}>
              {nextLevel.threshold - score} to {nextLevel.label}
            </span>
          )}
        </div>
        <div style={{
          height: '5px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${colors.burntOrange} 0%, ${colors.ember} 100%)`,
            borderRadius: '3px',
            transition: 'width 0.3s ease-out',
          }} />
        </div>
      </div>
    </div>
  );
};

// Combo Display
const ComboDisplay = ({ combo }) => {
  if (combo < 3) return null;
  
  const intensity = Math.min(combo / 10, 1);
  
  return (
    <div style={{
      position: 'absolute',
      top: '15%',
      right: '10px',
      textAlign: 'right',
      animation: 'pulse 0.3s ease-out',
    }}>
      <div style={{
        fontSize: `${24 + intensity * 12}px`,
        fontWeight: 'bold',
        color: intensity > 0.5 ? colors.mustard : colors.ember,
        textShadow: `0 0 ${10 + intensity * 20}px ${intensity > 0.5 ? colors.mustard : colors.ember}`,
      }}>
        {combo}x
      </div>
      <div style={{ fontSize: '11px', color: '#888' }}>COMBO</div>
      {combo >= 10 && <div style={{ fontSize: '14px' }}>🔥</div>}
    </div>
  );
};

export default function BlazeHotDogDash() {
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [hotDogs, setHotDogs] = useState([]);
  const [particles, setParticles] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [timeLeft, setTimeLeft] = useState(45);
  const [konamiIndex, setKonamiIndex] = useState(0);
  const [levelUpNotif, setLevelUpNotif] = useState(null);
  const [lastChonkIndex, setLastChonkIndex] = useState(0);
  const [screenShake, setScreenShake] = useState(0);
  
  // Power-ups
  const [activePowerUps, setActivePowerUps] = useState({});
  const [powerUpNotif, setPowerUpNotif] = useState(null);
  
  // Refs for smooth animation
  const blazeXRef = useRef(50);
  const targetXRef = useRef(50);
  const [blazeX, setBlazeX] = useState(50);
  const [isCatching, setIsCatching] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const gameRef = useRef(null);
  const frameRef = useRef(null);
  const keysPressed = useRef({ left: false, right: false });
  const lastFrameTime = useRef(0);

  const chonkFactor = Math.min(1.8, 1.0 + (score * 0.012));
  const currentChonkLevel = getChonkLevel(score);
  const nextChonkLevel = getNextChonkLevel(score);
  
  // Active power-up checks
  const hasMagnet = !!activePowerUps.MAGNET;
  const hasDouble = !!activePowerUps.DOUBLE;
  const hasSlow = !!activePowerUps.SLOW;
  const hasTiny = !!activePowerUps.TINY;

  // Check for level up
  useEffect(() => {
    if (currentChonkLevel.index > lastChonkIndex && gameStarted) {
      setLevelUpNotif(currentChonkLevel);
      setLastChonkIndex(currentChonkLevel.index);
      setScreenShake(5);
    }
  }, [currentChonkLevel.index, lastChonkIndex, gameStarted]);

  // Konami code
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameActive && gameStarted) return;
      if (e.code === KONAMI_CODE[konamiIndex]) {
        const newIndex = konamiIndex + 1;
        setKonamiIndex(newIndex);
        if (newIndex === KONAMI_CODE.length) {
          setGameActive(true);
          setKonamiIndex(0);
        }
      } else {
        setKonamiIndex(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [konamiIndex, gameActive, gameStarted]);

  // Keyboard controls
  useEffect(() => {
    if (!gameStarted) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') keysPressed.current.left = true;
      if (e.key === 'ArrowRight') keysPressed.current.right = true;
    };
    const handleKeyUp = (e) => {
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
  const handleTouch = useCallback((e) => {
    if (!gameStarted || !gameRef.current) return;
    e.preventDefault();
    const rect = gameRef.current.getBoundingClientRect();
    const touchX = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    targetXRef.current = Math.max(8, Math.min(92, touchX));
  }, [gameStarted]);

  // Main game loop
  useEffect(() => {
    if (!gameStarted) return;

    const gameLoop = (timestamp) => {
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
      
      // Magnet effect - pull nearby hotdogs
      if (hasMagnet) {
        setHotDogs(prev => prev.map(dog => {
          if (dog.isPowerUp) return dog;
          const dist = Math.abs(dog.x - blazeXRef.current);
          if (dist < 25 && dog.y > 30) {
            const pull = (25 - dist) / 25 * 0.5;
            return { ...dog, x: dog.x + (blazeXRef.current - dog.x) * pull * 0.1 };
          }
          return dog;
        }));
      }
      
      // Update hot dogs
      const speedMult = hasSlow ? 0.5 : 1;
      
      setHotDogs(prev => {
        const hitboxWidth = 15 + (chonkFactor - 1) * 8;
        const updated = [];
        
        prev.forEach(dog => {
          const newY = dog.y + dog.speed * speedMult * (deltaTime / 16);
          
          // Collision
          if (newY >= 65 && newY <= 92 && Math.abs(dog.x - blazeXRef.current) < hitboxWidth) {
            if (dog.isPowerUp) {
              // Activate power-up
              const powerUpType = dog.powerUpType;
              const powerUp = POWERUP_TYPES[powerUpType];
              setActivePowerUps(p => ({ ...p, [powerUpType]: true }));
              setPowerUpNotif(powerUpType);
              setTimeout(() => setPowerUpNotif(null), 1500);
              setTimeout(() => {
                setActivePowerUps(p => {
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
              
              setScore(s => s + points);
              setCombo(c => {
                const newCombo = c + 1;
                setMaxCombo(m => Math.max(m, newCombo));
                return newCombo;
              });
              
              // Visual feedback
              setFloatingTexts(t => [...t, createFloatingText(
                dog.x, newY - 5,
                `+${points}${hasDouble ? '!' : ''}`,
                dog.isGolden ? colors.mustard : 'white'
              )]);
              
              // Particles
              const particleType = combo >= 10 ? 'combo' : (dog.isGolden ? 'golden' : 'catch');
              for (let i = 0; i < (dog.isGolden ? 6 : 3); i++) {
                setParticles(p => [...p, createParticle(dog.x, newY, particleType)]);
              }
              
              setIsCatching(true);
              setTimeout(() => setIsCatching(false), 150);
              
              if (combo > 0 && combo % 10 === 9) {
                setScreenShake(3);
              }
            }
          } else if (newY < 105) {
            updated.push({ ...dog, y: newY, rotation: (dog.rotation || 0) + (dog.rotationSpeed || 0) });
          } else if (!dog.isPowerUp) {
            setCombo(0);
          }
        });
        
        return updated;
      });
      
      // Update particles
      setParticles(prev => 
        prev.map(p => ({
          ...p,
          x: p.x + p.vx * 0.08,
          y: p.y + p.vy * 0.08,
          vy: p.vy + 0.12,
          life: p.life - 0.025,
          rotation: p.rotation + 4,
        })).filter(p => p.life > 0)
      );
      
      // Update floating texts
      setFloatingTexts(prev =>
        prev.map(t => ({
          ...t,
          y: t.y - 0.4,
          life: t.life - 0.02,
        })).filter(t => t.life > 0)
      );
      
      // Screen shake decay
      setScreenShake(s => Math.max(0, s - 0.3));
      
      frameRef.current = requestAnimationFrame(gameLoop);
    };

    lastFrameTime.current = performance.now();
    frameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [gameStarted, chonkFactor, hasMagnet, hasDouble, hasSlow, hasTiny, combo]);

  // Spawn hot dogs
  useEffect(() => {
    if (!gameStarted) return;
    
    // Gradual difficulty - starts easy
    const baseInterval = 1600;
    const minInterval = 900;
    const interval = Math.max(minInterval, baseInterval - score * 4);
    
    const spawnInterval = setInterval(() => {
      // Small chance for power-up
      const isPowerUp = Math.random() < 0.06;
      
      const newDog = {
        id: Date.now() + Math.random(),
        x: Math.random() * 75 + 12,
        y: -5,
        speed: 0.6 + Math.random() * 0.3 + Math.min(score * 0.003, 0.3),
        isGolden: !isPowerUp && Math.random() < 0.18,
        isPowerUp,
        powerUpType: isPowerUp ? Object.keys(POWERUP_TYPES)[Math.floor(Math.random() * 4)] : null,
        rotation: Math.random() * 20 - 10,
        rotationSpeed: (Math.random() - 0.5) * 1.5,
      };
      setHotDogs(prev => [...prev, newDog]);
    }, interval);

    return () => clearInterval(spawnInterval);
  }, [gameStarted, score]);

  // Timer
  useEffect(() => {
    if (!gameStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameStarted(false);
          setHighScore(h => Math.max(h, score));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, timeLeft, score]);

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

  const closeGame = () => {
    setGameActive(false);
    setGameStarted(false);
    setScore(0);
    setTimeLeft(45);
    setHotDogs([]);
    setParticles([]);
    setFloatingTexts([]);
    setActivePowerUps({});
  };

  // Unlock screen
  if (!gameActive) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.midnight} 0%, ${colors.charcoal} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: 'white',
        padding: '20px',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px', animation: 'bounce 1s ease-in-out infinite' }}>🌭</div>
        <h2 style={{ color: colors.burntOrange, marginBottom: '10px', fontSize: '24px' }}>Secret Unlockable</h2>
        <p style={{ color: '#888', fontSize: '14px', textAlign: 'center' }}>
          Enter the classic cheat code...<br/>
          <span style={{ fontSize: '16px', opacity: 0.7, fontFamily: 'monospace' }}>↑↑↓↓←→←→BA</span>
        </p>
        <div style={{
          marginTop: '25px',
          padding: '15px 30px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          border: `2px solid ${konamiIndex > 0 ? colors.burntOrange : colors.texasSoil}`,
        }}>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            {KONAMI_CODE.map((_, i) => (
              <div key={i} style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: i < konamiIndex ? colors.ember : 'rgba(255,255,255,0.2)',
                boxShadow: i < konamiIndex ? `0 0 8px ${colors.ember}` : 'none',
              }} />
            ))}
          </div>
        </div>
        <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
      </div>
    );
  }

  const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 2 : 0;
  const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 2 : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(180deg, #0a2815 0%, #1a472a 30%, #2d5a27 60%, ${colors.texasSoil} 100%)`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
      userSelect: 'none',
      transform: `translate(${shakeX}px, ${shakeY}px)`,
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(180deg, ${colors.midnight} 0%, rgba(13,13,13,0.95) 100%)`,
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `3px solid ${colors.burntOrange}`,
      }}>
        <div style={{ color: colors.burntOrange, fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '22px' }}>🌭</span>
          Blaze's Hot Dog Dash
        </div>
        <button onClick={closeGame} style={{
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: '#888',
          fontSize: '18px',
          cursor: 'pointer',
          width: '28px',
          height: '28px',
          borderRadius: '6px',
        }}>×</button>
      </div>

      {/* Score Bar */}
      <div style={{
        background: 'rgba(0,0,0,0.7)',
        padding: '10px 15px',
        display: 'flex',
        justifyContent: 'space-around',
        color: 'white',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#888' }}>SCORE</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: colors.ember }}>{score}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#888' }}>TIME</div>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: timeLeft <= 10 ? colors.ketchup : 'white',
            animation: timeLeft <= 10 ? 'pulse 0.5s infinite' : 'none',
          }}>{timeLeft}s</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#888' }}>BEST</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: colors.mustard }}>{highScore}</div>
        </div>
      </div>

      {/* Chonk Progress */}
      {gameStarted && (
        <ChonkProgressBar score={score} currentLevel={currentChonkLevel} nextLevel={nextChonkLevel} />
      )}

      {/* Active Power-ups Display */}
      {Object.keys(activePowerUps).length > 0 && (
        <div style={{
          position: 'absolute',
          top: '140px',
          left: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          zIndex: 40,
        }}>
          {Object.keys(activePowerUps).map(key => (
            <div key={key} style={{
              background: POWERUP_TYPES[key].color,
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'white',
              fontWeight: 'bold',
            }}>
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
        {hotDogs.map(dog => (
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
        {particles.map(p => <Particle key={p.id} particle={p} />)}
        
        {/* Floating Texts */}
        {floatingTexts.map(t => <FloatingText key={t.id} item={t} />)}

        {/* Blaze */}
        <div style={{
          position: 'absolute',
          left: `${blazeX}%`,
          bottom: '6%',
          transform: 'translateX(-50%)',
        }}>
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
        {levelUpNotif && <LevelUpNotification level={levelUpNotif} onComplete={() => setLevelUpNotif(null)} />}

        {/* Start/Game Over Overlay */}
        {!gameStarted && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            padding: '20px',
          }}>
            {timeLeft === 0 ? (
              <>
                <h2 style={{ color: colors.burntOrange, marginBottom: '12px', fontSize: '28px' }}>Game Over!</h2>
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  padding: '16px 32px',
                  marginBottom: '12px',
                }}>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                    Final Score: <b style={{ color: colors.ember, fontSize: '26px' }}>{score}</b>
                  </div>
                  <div style={{ fontSize: '20px', color: colors.mustard, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>{currentChonkLevel.emoji}</span>
                    <span>{currentChonkLevel.label}</span>
                  </div>
                  <div style={{ color: '#666', fontSize: '12px', marginTop: '6px' }}>{currentChonkLevel.description}</div>
                </div>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '12px', fontSize: '13px' }}>
                  <span>Max Combo: <b style={{ color: colors.ember }}>x{maxCombo}</b></span>
                  {score === highScore && score > 0 && <span style={{ color: colors.mustard }}>🏆 NEW BEST!</span>}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '70px', marginBottom: '12px', animation: 'wiggle 0.6s ease-in-out infinite' }}>🐕</div>
                <h2 style={{ color: colors.burntOrange, fontSize: '24px', marginBottom: '4px' }}>Blaze's Hot Dog Dash</h2>
                <p style={{ color: '#666', fontSize: '12px', marginBottom: '12px' }}>A Blaze Sports Intel Easter Egg</p>
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  marginBottom: '16px',
                  textAlign: 'center',
                  fontSize: '13px',
                }}>
                  <p style={{ color: '#aaa', marginBottom: '6px' }}>Catch hot dogs to feed Blaze!</p>
                  <p style={{ color: colors.mustard, marginBottom: '6px' }}>⭐ Golden = 5 pts &nbsp; 🧲💜🐌🤏 = Power-ups!</p>
                  <p style={{ color: '#666', fontSize: '11px' }}>(Watch her get chubbier 🥹)</p>
                </div>
              </>
            )}
            <button
              onClick={startGame}
              style={{
                background: `linear-gradient(180deg, ${colors.burntOrange} 0%, #A04600 100%)`,
                color: 'white',
                border: 'none',
                padding: '14px 44px',
                fontSize: '18px',
                fontWeight: 'bold',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: `0 4px 20px rgba(191,87,0,0.4)`,
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
