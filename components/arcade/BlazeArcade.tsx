'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { colors } from '@/src/styles/tokens/colors';

// ============================================================================
// BLAZE ARCADE - COMPLETE GAME HUB
// Miniclip-style Easter egg collection for Blaze Sports Intel
// ============================================================================

// Design token integration with game-specific additions
const COLORS = {
  burntOrange: colors.brand.burntOrange,
  texasSoil: colors.brand.texasSoil,
  charcoal: colors.background.charcoal,
  midnight: colors.background.midnight,
  ember: colors.brand.ember,
  mustard: '#FFD700',
  ketchup: colors.sports.cardinals,
  grass: '#228B22',
  sky: '#87CEEB',
  dirt: '#8B7355',
};

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

interface GameProps {
  onBack: () => void;
  highScore: number;
  onUpdateHighScore: (score: number) => void;
}

interface Game {
  id: string;
  title: string;
  description: string;
  icon: string;
  component: React.FC<GameProps> | null;
}

interface HotDogItem {
  id: number;
  x: number;
  y: number;
  speed: number;
  isGolden: boolean;
  isPowerUp: boolean;
  powerUpType: string | null;
}

interface PowerUp {
  emoji: string;
  color: string;
  duration: number;
}

interface ChonkLevel {
  threshold: number;
  label: string;
  emoji: string;
}

interface Batter {
  name: string;
  power: number;
  contact: number;
  emoji: string;
}

interface PitchType {
  name: string;
  speed: number;
  movement: number;
  color: string;
}

interface BallFlight {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
}

interface Team {
  name: string;
  emoji: string;
  color: string;
  offense: number;
  defense: number;
}

interface OffensivePlay {
  name: string;
  icon: string;
  type: string;
  distance: string;
  risk: number;
  desc: string;
}

interface DefensivePlay {
  name: string;
  icon: string;
  type: string;
  counters: string[];
  desc: string;
}

interface SpecialTeamsPlay {
  name: string;
  icon: string;
  type: string;
  desc: string;
}

interface PlayResult {
  text: string;
  color: string;
  cpuPlay?: string;
}

interface HitResult {
  type: string;
  points: number;
  color: string;
  distance?: number;
}

interface ScoreBarItem {
  label: string;
  value: string | number;
  color?: string;
}

interface ArcadeHeaderProps {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
  showBack?: boolean;
}

interface GameCardProps {
  game: Game;
  highScore: number;
  onSelect: (id: string) => void;
}

interface GameOverlayProps {
  children: React.ReactNode;
  visible: boolean;
}

interface ActionButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  color?: string;
  small?: boolean;
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

const ArcadeHeader: React.FC<ArcadeHeaderProps> = ({ title, onBack, onClose, showBack = false }) => (
  <div style={{
    background: `linear-gradient(180deg, ${COLORS.midnight} 0%, rgba(13,13,13,0.95) 100%)`,
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `3px solid ${COLORS.burntOrange}`,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {showBack && onBack && (
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: COLORS.burntOrange,
          fontSize: '18px', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '8px',
        }}>←</button>
      )}
      <div style={{ color: COLORS.burntOrange, fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '24px' }}>🕹️</span>{title}
      </div>
    </div>
    {onClose && (
      <button onClick={onClose} style={{
        background: 'rgba(255,255,255,0.1)', border: 'none', color: '#888',
        fontSize: '20px', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '8px',
      }}>×</button>
    )}
  </div>
);

const GameCard: React.FC<GameCardProps> = ({ game, highScore, onSelect }) => (
  <button
    onClick={() => game.component && onSelect(game.id)}
    style={{
      background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.midnight} 100%)`,
      border: `2px solid ${COLORS.texasSoil}`,
      borderRadius: '16px', padding: '20px', cursor: 'pointer',
      textAlign: 'center', transition: 'all 0.2s ease', width: '100%', maxWidth: '280px',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.burntOrange; e.currentTarget.style.transform = 'scale(1.03)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.texasSoil; e.currentTarget.style.transform = 'scale(1)'; }}
  >
    <div style={{ fontSize: '48px', marginBottom: '12px' }}>{game.icon}</div>
    <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '6px' }}>{game.title}</div>
    <div style={{ color: '#888', fontSize: '13px', marginBottom: '12px' }}>{game.description}</div>
    {highScore > 0 && (
      <div style={{ background: 'rgba(255,215,0,0.1)', borderRadius: '8px', padding: '6px 12px', display: 'inline-block' }}>
        <span style={{ color: COLORS.mustard, fontSize: '12px' }}>🏆 Best: {highScore}</span>
      </div>
    )}
  </button>
);

const ScoreBar: React.FC<{ items: ScoreBarItem[] }> = ({ items }) => (
  <div style={{ background: 'rgba(0,0,0,0.7)', padding: '10px 15px', display: 'flex', justifyContent: 'space-around', color: 'white' }}>
    {items.map((item, i) => (
      <div key={i} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '10px', color: '#888' }}>{item.label}</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: item.color || 'white' }}>{item.value}</div>
      </div>
    ))}
  </div>
);

const GameOverlay: React.FC<GameOverlayProps> = ({ children, visible }) => {
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: 'white', padding: '20px', zIndex: 100,
    }}>{children}</div>
  );
};

const ActionButton: React.FC<ActionButtonProps> = ({ children, onClick, color = COLORS.burntOrange, small = false }) => (
  <button onClick={onClick} style={{
    background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
    color: 'white', border: 'none', padding: small ? '8px 20px' : '14px 44px',
    fontSize: small ? '14px' : '18px', fontWeight: 'bold',
    borderRadius: '10px', cursor: 'pointer', boxShadow: `0 4px 20px ${color}66`,
  }}>{children}</button>
);

// ============================================================================
// GAME 1: HOT DOG DASH
// ============================================================================

const HOTDOG_POWERUPS: Record<string, PowerUp> = {
  MAGNET: { emoji: '🧲', color: '#E74C3C', duration: 5000 },
  DOUBLE: { emoji: '×2', color: '#9B59B6', duration: 6000 },
  SLOW: { emoji: '🐌', color: '#3498DB', duration: 5000 },
};

const CHONK_LEVELS: ChonkLevel[] = [
  { threshold: 0, label: 'Aerodynamic Weiner', emoji: '💨' },
  { threshold: 8, label: 'Snack Enthusiast', emoji: '😋' },
  { threshold: 20, label: 'Pleasantly Plump', emoji: '🐕' },
  { threshold: 35, label: 'Absolute Unit', emoji: '💪' },
  { threshold: 55, label: 'HEFTY GIRL', emoji: '🎺' },
  { threshold: 80, label: 'OH LAWD SHE COMIN', emoji: '🚨' },
  { threshold: 110, label: 'LEGENDARY LOAF', emoji: '🏆' },
];

const getChonkLevel = (score: number): ChonkLevel & { index: number } => {
  for (let i = CHONK_LEVELS.length - 1; i >= 0; i--) {
    if (score >= CHONK_LEVELS[i].threshold) return { ...CHONK_LEVELS[i], index: i };
  }
  return { ...CHONK_LEVELS[0], index: 0 };
};

const HotDog: React.FC<{ x: number; y: number; isGolden: boolean; isPowerUp: boolean; powerUpType: string | null }> = ({ x, y, isGolden, isPowerUp, powerUpType }) => {
  if (isPowerUp && powerUpType) {
    const p = HOTDOG_POWERUPS[powerUpType];
    return (
      <div style={{
        position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
        width: '36px', height: '36px', borderRadius: '50%', background: p.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
        boxShadow: `0 0 15px ${p.color}`, border: '2px solid white',
      }}>{p.emoji}</div>
    );
  }
  return (
    <div style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
      fontSize: '32px', filter: isGolden ? 'drop-shadow(0 0 8px gold)' : 'none',
    }}>{isGolden ? '⭐🌭' : '🌭'}</div>
  );
};

const BlazeSprite: React.FC<{ chonkFactor: number; isMoving: boolean }> = ({ chonkFactor, isMoving }) => {
  const cf = Math.min(chonkFactor, 1.8);
  const width = 50 + (cf - 1) * 30;
  return (
    <div style={{ position: 'relative', width: `${width}px`, height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: `${28 + (cf - 1) * 15}px`, transform: isMoving ? 'scaleX(-1)' : 'none' }}>🐕</div>
      <div style={{
        position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)',
        width: '12px', height: '6px', background: COLORS.burntOrange, borderRadius: '3px',
      }} />
    </div>
  );
};

const HotDogDashGame: React.FC<GameProps> = ({ onBack, onUpdateHighScore, highScore }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hotDogs, setHotDogs] = useState<HotDogItem[]>([]);
  const [timeLeft, setTimeLeft] = useState(45);
  const [activePowerUps, setActivePowerUps] = useState<Record<string, boolean>>({});
  const blazeXRef = useRef(50);
  const targetXRef = useRef(50);
  const [blazeX, setBlazeX] = useState(50);
  const [isMoving, setIsMoving] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const keysPressed = useRef({ left: false, right: false });

  const chonkFactor = Math.min(1.8, 1.0 + (score * 0.012));
  const currentChonkLevel = getChonkLevel(score);

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
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [gameStarted]);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    if (!gameStarted || !gameRef.current) return;
    e.preventDefault();
    const rect = gameRef.current.getBoundingClientRect();
    targetXRef.current = Math.max(8, Math.min(92, ((e.touches[0].clientX - rect.left) / rect.width) * 100));
  }, [gameStarted]);

  useEffect(() => {
    if (!gameStarted) return;
    const gameLoop = () => {
      if (keysPressed.current.left) targetXRef.current = Math.max(8, targetXRef.current - 2);
      if (keysPressed.current.right) targetXRef.current = Math.min(92, targetXRef.current + 2);
      const prevX = blazeXRef.current;
      blazeXRef.current += (targetXRef.current - blazeXRef.current) * 0.2;
      setBlazeX(blazeXRef.current);
      setIsMoving(Math.abs(blazeXRef.current - prevX) > 0.3);

      if (activePowerUps.MAGNET) {
        setHotDogs(prev => prev.map(dog => {
          if (dog.isPowerUp) return dog;
          const dist = Math.abs(dog.x - blazeXRef.current);
          if (dist < 25 && dog.y > 30) return { ...dog, x: dog.x + (blazeXRef.current - dog.x) * 0.08 };
          return dog;
        }));
      }

      const speedMult = activePowerUps.SLOW ? 0.5 : 1;
      setHotDogs(prev => {
        const hitboxWidth = 15 + (chonkFactor - 1) * 8;
        return prev.filter(dog => {
          const newY = dog.y + dog.speed * speedMult;
          if (newY >= 65 && newY <= 92 && Math.abs(dog.x - blazeXRef.current) < hitboxWidth) {
            if (dog.isPowerUp && dog.powerUpType) {
              const type = dog.powerUpType;
              setActivePowerUps(p => ({ ...p, [type]: true }));
              setTimeout(() => setActivePowerUps(p => { const n = { ...p }; delete n[type]; return n; }), HOTDOG_POWERUPS[type].duration);
            } else {
              let points = dog.isGolden ? 5 : 1;
              points += Math.floor(combo / 5);
              if (activePowerUps.DOUBLE) points *= 2;
              setScore(s => s + points);
              setCombo(c => c + 1);
            }
            return false;
          }
          if (newY > 105) { if (!dog.isPowerUp) setCombo(0); return false; }
          dog.y = newY;
          return true;
        });
      });
      frameRef.current = requestAnimationFrame(gameLoop);
    };
    frameRef.current = requestAnimationFrame(gameLoop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [gameStarted, chonkFactor, activePowerUps, combo]);

  useEffect(() => {
    if (!gameStarted) return;
    const interval = Math.max(900, 1600 - score * 4);
    const spawn = setInterval(() => {
      const isPowerUp = Math.random() < 0.06;
      setHotDogs(prev => [...prev, {
        id: Date.now() + Math.random(), x: Math.random() * 75 + 12, y: -5,
        speed: 0.8 + Math.random() * 0.4 + Math.min(score * 0.004, 0.4),
        isGolden: !isPowerUp && Math.random() < 0.18, isPowerUp,
        powerUpType: isPowerUp ? Object.keys(HOTDOG_POWERUPS)[Math.floor(Math.random() * 3)] : null,
      }]);
    }, interval);
    return () => clearInterval(spawn);
  }, [gameStarted, score]);

  useEffect(() => {
    if (!gameStarted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setGameStarted(false); if (score > highScore) onUpdateHighScore(score); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, timeLeft, score, highScore, onUpdateHighScore]);

  const startGame = () => {
    setGameStarted(true); setScore(0); setCombo(0); setTimeLeft(45); setHotDogs([]); setActivePowerUps({});
    blazeXRef.current = 50; targetXRef.current = 50; setBlazeX(50);
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(180deg, #0a2815 0%, #1a472a 30%, #2d5a27 60%, ${COLORS.texasSoil} 100%)`, fontFamily: 'system-ui', overflow: 'hidden', userSelect: 'none' }}>
      <ArcadeHeader title="Hot Dog Dash" onBack={onBack} showBack />
      <ScoreBar items={[
        { label: 'SCORE', value: score, color: COLORS.ember },
        { label: 'TIME', value: `${timeLeft}s`, color: timeLeft <= 10 ? COLORS.ketchup : 'white' },
        { label: 'COMBO', value: `×${combo}`, color: combo > 5 ? COLORS.mustard : 'white' },
        { label: 'BEST', value: highScore, color: COLORS.mustard },
      ]} />
      {gameStarted && (
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '6px 15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>{currentChonkLevel.emoji}</span>
          <span style={{ color: COLORS.ember, fontSize: '12px', fontWeight: 'bold' }}>{currentChonkLevel.label}</span>
        </div>
      )}
      <div ref={gameRef} onTouchMove={handleTouch} onTouchStart={handleTouch} style={{ position: 'relative', height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
        {combo >= 5 && <div style={{ position: 'absolute', top: '10%', right: '15px', fontSize: '28px', fontWeight: 'bold', color: COLORS.mustard }}>{combo}× 🔥</div>}
        {hotDogs.map(dog => <HotDog key={dog.id} x={dog.x} y={dog.y} isGolden={dog.isGolden} isPowerUp={dog.isPowerUp} powerUpType={dog.powerUpType} />)}
        <div style={{ position: 'absolute', left: `${blazeX}%`, bottom: '6%', transform: 'translateX(-50%)' }}>
          <BlazeSprite chonkFactor={chonkFactor} isMoving={isMoving} />
        </div>
        <GameOverlay visible={!gameStarted}>
          {timeLeft === 0 ? (
            <>
              <h2 style={{ color: COLORS.burntOrange, marginBottom: '12px' }}>Game Over!</h2>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>Score: <b style={{ color: COLORS.ember }}>{score}</b></div>
              <div style={{ fontSize: '18px', color: COLORS.mustard, marginBottom: '20px' }}>{currentChonkLevel.emoji} {currentChonkLevel.label}</div>
              <ActionButton onClick={startGame}>🔄 Play Again</ActionButton>
            </>
          ) : (
            <>
              <div style={{ fontSize: '70px', marginBottom: '12px' }}>🐕🌭</div>
              <h2 style={{ color: COLORS.burntOrange, marginBottom: '8px' }}>Hot Dog Dash</h2>
              <p style={{ color: '#aaa', marginBottom: '16px' }}>Catch hot dogs! Watch Blaze get chonky!</p>
              <ActionButton onClick={startGame}>🎮 Start Game</ActionButton>
              <p style={{ color: '#555', fontSize: '11px', marginTop: '16px' }}>← → or touch to move</p>
            </>
          )}
        </GameOverlay>
      </div>
    </div>
  );
};

// ============================================================================
// GAME 2: SANDLOT SLUGGER
// ============================================================================

const PITCH_TYPES: PitchType[] = [
  { name: 'Fastball', speed: 1.8, movement: 0, color: '#FF4444' },
  { name: 'Curveball', speed: 1.2, movement: 0.3, color: '#44FF44' },
  { name: 'Changeup', speed: 0.9, movement: 0.1, color: '#4444FF' },
  { name: 'Slider', speed: 1.4, movement: -0.25, color: '#FFFF44' },
];

const BATTERS: Batter[] = [
  { name: 'Blaze Jr.', power: 85, contact: 90, emoji: '🐕' },
  { name: 'Slugger Steve', power: 95, contact: 70, emoji: '💪' },
  { name: 'Quick Quinn', power: 65, contact: 95, emoji: '⚡' },
  { name: 'Big Bertha', power: 100, contact: 60, emoji: '🎯' },
];

const SandlotSluggerGame: React.FC<GameProps> = ({ onBack, onUpdateHighScore, highScore }) => {
  const [gameState, setGameState] = useState<'select' | 'playing' | 'gameover'>('select');
  const [selectedBatter, setSelectedBatter] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [outs, setOuts] = useState(0);
  const [pitch, setPitch] = useState<PitchType | null>(null);
  const [pitchY, setPitchY] = useState(-10);
  const [pitchX, setPitchX] = useState(50);
  const [swingTiming, setSwingTiming] = useState<number | null>(null);
  const [hitResult, setHitResult] = useState<HitResult | null>(null);
  const [ballFlight, setBallFlight] = useState<BallFlight | null>(null);
  const [isSwinging, setIsSwinging] = useState(false);
  const [combo, setCombo] = useState(0);
  const [totalHRs, setTotalHRs] = useState(0);
  const frameRef = useRef<number | undefined>(undefined);

  const throwPitch = useCallback(() => {
    const pitchType = PITCH_TYPES[Math.floor(Math.random() * PITCH_TYPES.length)];
    setPitch(pitchType);
    setPitchY(-10);
    setPitchX(50 + (Math.random() - 0.5) * 20);
    setSwingTiming(null);
    setHitResult(null);
    setBallFlight(null);
    setIsSwinging(false);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing' || !pitch) return;
    const animate = () => {
      setPitchY(prev => {
        const newY = prev + pitch.speed * 1.5;
        const progress = newY / 85;
        setPitchX(() => 50 + Math.sin(progress * Math.PI) * pitch.movement * 30);
        if (newY > 95 && !swingTiming) {
          setOuts(o => { const newOuts = o + 1; if (newOuts >= 10) { setGameState('gameover'); if (score > highScore) onUpdateHighScore(score); } return newOuts; });
          setCombo(0);
          setTimeout(() => throwPitch(), 1000);
          return 100;
        }
        return newY;
      });
      if (pitchY < 95) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [gameState, pitch, pitchY, swingTiming, throwPitch, score, highScore, onUpdateHighScore]);

  const handleSwing = useCallback(() => {
    if (gameState !== 'playing' || !pitch || swingTiming !== null || isSwinging || selectedBatter === null) return;
    setIsSwinging(true);
    const perfectZone = 75;
    const timing = (pitchY - perfectZone) / 20;
    setSwingTiming(timing);

    setTimeout(() => {
      const batter = BATTERS[selectedBatter];
      const contactRoll = Math.random() * 100;
      const powerRoll = Math.random() * 100;

      if (Math.abs(timing) > 0.5 || contactRoll > batter.contact) {
        setHitResult({ type: 'STRIKE!', points: 0, color: '#FF4444' });
        setOuts(o => { const newOuts = o + 1; if (newOuts >= 10) setTimeout(() => { setGameState('gameover'); if (score > highScore) onUpdateHighScore(score); }, 1500); return newOuts; });
        setCombo(0);
      } else {
        const powerFactor = (batter.power / 100) * (1 - Math.abs(timing));
        const distance = 150 + powerFactor * 350 + powerRoll * 2;

        if (Math.abs(timing) < 0.1 && powerFactor > 0.7 && distance > 400) {
          const points = Math.floor(100 + combo * 25 + (distance - 400));
          setHitResult({ type: '💥 HOME RUN!', points, color: COLORS.mustard, distance: Math.floor(distance) });
          setScore(s => s + points);
          setCombo(c => c + 1);
          setTotalHRs(t => t + 1);
          setBallFlight({ startX: 50, startY: 75, endX: 50 + timing * 40, endY: -20, duration: 2000 });
        } else if (distance > 350) {
          setHitResult({ type: 'DEEP FLY OUT', points: 10, color: '#88FF88', distance: Math.floor(distance) });
          setScore(s => s + 10);
          setOuts(o => { const newOuts = o + 1; if (newOuts >= 10) setTimeout(() => { setGameState('gameover'); if (score > highScore) onUpdateHighScore(score); }, 1500); return newOuts; });
          setCombo(0);
          setBallFlight({ startX: 50, startY: 75, endX: 50 + timing * 30, endY: 20, duration: 1500 });
        } else if (distance > 200) {
          const points = 25 + combo * 5;
          setHitResult({ type: 'BASE HIT!', points, color: '#44FF44' });
          setScore(s => s + points);
          setBallFlight({ startX: 50, startY: 75, endX: 50 + timing * 25, endY: 45, duration: 1000 });
        } else {
          setHitResult({ type: 'GROUNDER', points: 5, color: '#AAAAAA' });
          setScore(s => s + 5);
          setOuts(o => { const newOuts = o + 1; if (newOuts >= 10) setTimeout(() => { setGameState('gameover'); if (score > highScore) onUpdateHighScore(score); }, 1500); return newOuts; });
          setCombo(0);
        }
      }
      setTimeout(() => { if (outs < 9) throwPitch(); setIsSwinging(false); }, 2000);
    }, 150);
  }, [gameState, pitch, swingTiming, pitchY, selectedBatter, isSwinging, combo, outs, score, highScore, onUpdateHighScore, throwPitch]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const handleKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); handleSwing(); }};
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, handleSwing]);

  const startGame = (batterIndex: number) => {
    setSelectedBatter(batterIndex); setScore(0); setOuts(0); setCombo(0); setTotalHRs(0); setGameState('playing');
    setTimeout(() => throwPitch(), 500);
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(180deg, ${COLORS.sky} 0%, #5BA3D9 40%, ${COLORS.grass} 40%, #1B5E20 100%)`, fontFamily: 'system-ui', overflow: 'hidden', userSelect: 'none' }}>
      <ArcadeHeader title="Sandlot Slugger" onBack={onBack} showBack />
      {gameState !== 'select' && (
        <ScoreBar items={[
          { label: 'SCORE', value: score, color: COLORS.ember },
          { label: 'OUTS', value: `${outs}/10`, color: outs >= 7 ? COLORS.ketchup : 'white' },
          { label: 'HRs', value: totalHRs, color: COLORS.mustard },
          { label: 'COMBO', value: `×${combo}`, color: combo > 0 ? COLORS.mustard : 'white' },
        ]} />
      )}
      <div style={{ position: 'relative', height: gameState === 'select' ? 'calc(100vh - 60px)' : 'calc(100vh - 130px)', overflow: 'hidden' }}
           onClick={gameState === 'playing' ? handleSwing : undefined}
           onTouchStart={gameState === 'playing' ? handleSwing : undefined}>

        {gameState === 'select' && (
          <div style={{ padding: '30px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '10px' }}>⚾</div>
            <h2 style={{ color: COLORS.charcoal, marginBottom: '8px' }}>Choose Your Slugger!</h2>
            <p style={{ color: '#555', marginBottom: '24px', fontSize: '14px' }}>10 outs per round. Swing for the fences!</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', maxWidth: '400px', margin: '0 auto' }}>
              {BATTERS.map((batter, i) => (
                <button key={i} onClick={() => startGame(i)} style={{
                  background: 'white', border: `3px solid ${COLORS.texasSoil}`, borderRadius: '12px',
                  padding: '16px', cursor: 'pointer', width: '150px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>{batter.emoji}</div>
                  <div style={{ fontWeight: 'bold', color: COLORS.charcoal }}>{batter.name}</div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>PWR: {batter.power} | CON: {batter.contact}</div>
                </button>
              ))}
            </div>
            {highScore > 0 && <p style={{ marginTop: '24px', color: COLORS.mustard }}>🏆 Best Score: {highScore}</p>}
          </div>
        )}

        {gameState === 'playing' && (
          <>
            <div style={{ position: 'absolute', top: '15%', left: '10%', right: '10%', height: '4px', background: '#8B4513', borderRadius: '2px' }} />
            {pitch && (
              <div style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '8px', color: pitch.color, fontWeight: 'bold', fontSize: '14px' }}>{pitch.name}</div>
            )}
            {pitch && pitchY < 95 && !ballFlight && (
              <div style={{ position: 'absolute', left: `${pitchX}%`, top: `${pitchY}%`, transform: 'translate(-50%, -50%)', width: '20px', height: '20px', background: 'radial-gradient(circle at 30% 30%, white, #ddd)', borderRadius: '50%', boxShadow: '2px 2px 4px rgba(0,0,0,0.3)' }} />
            )}
            <div style={{ position: 'absolute', left: '50%', top: '70%', transform: 'translate(-50%, -50%)', width: '80px', height: '100px', border: '3px solid rgba(255,255,255,0.3)', borderRadius: '4px' }} />
            <div style={{ position: 'absolute', left: '50%', top: '82%', transform: 'translateX(-50%)', fontSize: '50px', transition: 'transform 0.1s', transformOrigin: 'bottom center', ...(isSwinging && { transform: 'translateX(-50%) rotate(-45deg)' }) }}>
              {selectedBatter !== null ? BATTERS[selectedBatter].emoji : '🧑'}
            </div>
            <div style={{ position: 'absolute', left: '58%', top: '78%', width: '60px', height: '8px', background: 'linear-gradient(90deg, #8B4513 0%, #D2691E 80%, #A0522D 100%)', borderRadius: '0 4px 4px 0', transformOrigin: 'left center', transform: isSwinging ? 'rotate(-90deg)' : 'rotate(45deg)', transition: 'transform 0.1s' }} />
            {hitResult && (
              <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.85)', padding: '20px 40px', borderRadius: '16px', textAlign: 'center', animation: 'popIn 0.3s ease-out' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: hitResult.color, marginBottom: '8px' }}>{hitResult.type}</div>
                {hitResult.distance && <div style={{ color: '#aaa', fontSize: '14px' }}>{hitResult.distance} feet</div>}
                {hitResult.points > 0 && <div style={{ color: COLORS.ember, fontSize: '20px', marginTop: '8px' }}>+{hitResult.points}</div>}
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '5%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: '8px', color: 'white', fontSize: '14px', textAlign: 'center' }}>
              <div>TAP or SPACE to swing!</div>
            </div>
          </>
        )}

        {gameState === 'gameover' && (
          <GameOverlay visible={true}>
            <div style={{ fontSize: '64px', marginBottom: '12px' }}>⚾</div>
            <h2 style={{ color: COLORS.burntOrange, marginBottom: '12px' }}>Game Over!</h2>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px 40px', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>Final Score: <b style={{ color: COLORS.ember, fontSize: '28px' }}>{score}</b></div>
              <div style={{ fontSize: '14px', color: '#888' }}>Home Runs: <b style={{ color: COLORS.mustard }}>{totalHRs}</b></div>
            </div>
            {score > highScore && <div style={{ color: COLORS.mustard, marginBottom: '16px' }}>🏆 NEW HIGH SCORE!</div>}
            <ActionButton onClick={() => setGameState('select')}>🔄 Play Again</ActionButton>
          </GameOverlay>
        )}
      </div>
      <style>{`@keyframes popIn { 0% { transform: translate(-50%, -50%) scale(0); } 100% { transform: translate(-50%, -50%) scale(1); } }`}</style>
    </div>
  );
};

// ============================================================================
// GAME 3: GRIDIRON BLITZ
// ============================================================================

const OFFENSIVE_PLAYS: OffensivePlay[] = [
  { name: 'Hail Mary', icon: '🎯', type: 'pass', distance: 'long', risk: 0.35, desc: 'Deep bomb' },
  { name: 'Slant Route', icon: '↗️', type: 'pass', distance: 'short', risk: 0.75, desc: 'Quick pass' },
  { name: 'Power Run', icon: '💪', type: 'run', distance: 'short', risk: 0.65, desc: 'Up the gut' },
  { name: 'Screen Pass', icon: '🛡️', type: 'pass', distance: 'short', risk: 0.70, desc: 'Behind line' },
  { name: 'Deep Post', icon: '📮', type: 'pass', distance: 'medium', risk: 0.50, desc: 'Downfield' },
  { name: 'Draw Play', icon: '🎭', type: 'run', distance: 'medium', risk: 0.55, desc: 'Fake pass' },
  { name: 'Out Route', icon: '➡️', type: 'pass', distance: 'medium', risk: 0.60, desc: 'Sideline' },
  { name: 'Sweep', icon: '🏃', type: 'run', distance: 'medium', risk: 0.50, desc: 'Outside run' },
  { name: 'Play Action', icon: '🎬', type: 'pass', distance: 'long', risk: 0.45, desc: 'Fake & throw' },
  { name: 'QB Sneak', icon: '🐍', type: 'run', distance: 'short', risk: 0.80, desc: 'Short yardage' },
];

const DEFENSIVE_PLAYS: DefensivePlay[] = [
  { name: 'All-Out Blitz', icon: '⚡', type: 'blitz', counters: ['pass'], desc: 'Max rush' },
  { name: 'Zone Cover', icon: '🏰', type: 'zone', counters: ['run', 'pass'], desc: 'Area defense' },
  { name: 'Man Cover', icon: '👤', type: 'man', counters: ['pass'], desc: '1-on-1' },
  { name: 'Run Stuff', icon: '🧱', type: 'stuff', counters: ['run'], desc: 'Load the box' },
  { name: 'Prevent', icon: '🛑', type: 'prevent', counters: ['pass'], desc: 'Deep zone' },
  { name: 'Nickel', icon: '🪙', type: 'nickel', counters: ['pass'], desc: 'Extra DB' },
  { name: 'Goal Line', icon: '🎯', type: 'goalline', counters: ['run'], desc: 'Short D' },
  { name: 'QB Spy', icon: '🕵️', type: 'spy', counters: ['run', 'pass'], desc: 'Contain QB' },
  { name: 'Cover 2', icon: '✌️', type: 'cover2', counters: ['pass'], desc: 'Split safety' },
  { name: 'Press', icon: '🤜', type: 'press', counters: ['pass'], desc: 'Jam WRs' },
];

const SPECIAL_TEAMS: SpecialTeamsPlay[] = [
  { name: 'Field Goal', icon: '🥅', type: 'fg', desc: '3 points' },
  { name: 'Punt', icon: '🦶', type: 'punt', desc: 'Flip field' },
  { name: 'Go For It!', icon: '🎲', type: 'goforit', desc: '4th down try' },
];

const TEAMS: Team[] = [
  { name: 'Blaze Hounds', emoji: '🐕', color: COLORS.burntOrange, offense: 85, defense: 75 },
  { name: 'TX Longshots', emoji: '🤘', color: '#BF5700', offense: 80, defense: 80 },
  { name: 'Grit City', emoji: '💪', color: '#1A472A', offense: 70, defense: 90 },
  { name: 'Air Raiders', emoji: '✈️', color: '#4169E1', offense: 95, defense: 65 },
];

const GridironBlitzGame: React.FC<GameProps> = ({ onBack, onUpdateHighScore, highScore }) => {
  const [gamePhase, setGamePhase] = useState<'teamSelect' | 'play' | 'halftime' | 'gameover'>('teamSelect');
  const [playerTeam, setPlayerTeam] = useState<Team | null>(null);
  const [cpuTeam, setCpuTeam] = useState<Team | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [quarter, setQuarter] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [possession, setPossession] = useState<'player' | 'cpu'>('player');
  const [ballPosition, setBallPosition] = useState(20);
  const [down, setDown] = useState(1);
  const [yardsToGo, setYardsToGo] = useState(10);
  const [lineOfScrimmage, setLineOfScrimmage] = useState(20);
  const [playResult, setPlayResult] = useState<PlayResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [turboMeter, setTurboMeter] = useState(100);
  const [showPlaybook, setShowPlaybook] = useState(true);
  const [playbookTab, setPlaybookTab] = useState<'plays' | 'special'>('plays');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetDrive = useCallback((team: 'player' | 'cpu', startPos = 25) => {
    setPossession(team);
    setBallPosition(startPos);
    setLineOfScrimmage(startPos);
    setDown(1);
    setYardsToGo(10);
    setShowPlaybook(true);
    setPlaybookTab('plays');
  }, []);

  useEffect(() => {
    if (gamePhase !== 'play' || isAnimating) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (quarter < 4) {
            setQuarter(q => q + 1);
            if (quarter === 2) {
              setGamePhase('halftime');
              return 60;
            }
            resetDrive(possession === 'player' ? 'cpu' : 'player', 25);
            return 60;
          } else {
            setGamePhase('gameover');
            if (playerScore > highScore) onUpdateHighScore(playerScore);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gamePhase, quarter, isAnimating, playerScore, highScore, onUpdateHighScore, possession, resetDrive]);

  const startGame = (teamIndex: number) => {
    setPlayerTeam(TEAMS[teamIndex]);
    const cpuIndex = (teamIndex + 1 + Math.floor(Math.random() * 3)) % 4;
    setCpuTeam(TEAMS[cpuIndex]);
    setPlayerScore(0);
    setCpuScore(0);
    setQuarter(1);
    setTimeLeft(60);
    setTurboMeter(100);
    resetDrive('player', 25);
    setGamePhase('play');
  };

  const executePlay = (play: OffensivePlay | DefensivePlay | SpecialTeamsPlay, isSpecialTeams = false) => {
    if (isAnimating || !playerTeam || !cpuTeam) return;
    setShowPlaybook(false);
    setIsAnimating(true);

    const isPlayerOffense = possession === 'player';
    const offenseTeam = isPlayerOffense ? playerTeam : cpuTeam;
    const defenseTeam = isPlayerOffense ? cpuTeam : playerTeam;

    // Handle special teams
    if (isSpecialTeams && 'type' in play) {
      if (play.type === 'fg') {
        const distance = 100 - ballPosition + 17;
        const makePct = Math.max(0.2, 1 - (distance - 20) * 0.02);

        setTimeout(() => {
          if (Math.random() < makePct) {
            setPlayResult({ text: '🥅 FIELD GOAL IS GOOD! +3', color: COLORS.mustard });
            if (isPlayerOffense) setPlayerScore(s => s + 3);
            else setCpuScore(s => s + 3);
          } else {
            setPlayResult({ text: '❌ NO GOOD! Wide ' + (Math.random() > 0.5 ? 'left' : 'right'), color: COLORS.ketchup });
          }

          setTimeout(() => {
            resetDrive(isPlayerOffense ? 'cpu' : 'player', 25);
            setPlayResult(null);
            setIsAnimating(false);
          }, 2000);
        }, 1000);
        return;
      }

      if (play.type === 'punt') {
        setTimeout(() => {
          const puntYards = 35 + Math.floor(Math.random() * 20);
          const newPos = Math.max(5, Math.min(95, 100 - (ballPosition + puntYards)));
          setPlayResult({ text: `🦶 Punt for ${puntYards} yards!`, color: '#88FF88' });

          setTimeout(() => {
            resetDrive(isPlayerOffense ? 'cpu' : 'player', newPos);
            setPlayResult(null);
            setIsAnimating(false);
          }, 1500);
        }, 800);
        return;
      }
    }

    // CPU picks defense (or offense if defending)
    let cpuPlay: DefensivePlay | OffensivePlay;
    if (isPlayerOffense) {
      cpuPlay = DEFENSIVE_PLAYS[Math.floor(Math.random() * DEFENSIVE_PLAYS.length)];
    } else {
      cpuPlay = OFFENSIVE_PLAYS[Math.floor(Math.random() * OFFENSIVE_PLAYS.length)];
    }

    setTimeout(() => {
      let yards = 0;
      let resultText = '';
      let resultColor = 'white';
      let isTurnover = false;

      if (isPlayerOffense && 'risk' in play) {
        const offPlay = play as OffensivePlay;
        const defPlay = cpuPlay as DefensivePlay;
        const baseSuccess = offPlay.risk + (offenseTeam.offense - defenseTeam.defense) / 200;
        const countered = defPlay.counters && defPlay.counters.includes(offPlay.type);
        const successChance = countered ? baseSuccess * 0.5 : baseSuccess;

        if (Math.random() < successChance) {
          if (offPlay.distance === 'long') yards = 25 + Math.floor(Math.random() * 35);
          else if (offPlay.distance === 'medium') yards = 10 + Math.floor(Math.random() * 15);
          else yards = 3 + Math.floor(Math.random() * 8);

          if (turboMeter > 50 && Math.random() < 0.25) {
            yards = Math.floor(yards * 1.5);
            resultText = '🔥 TURBO! ';
            setTurboMeter(t => Math.max(0, t - 30));
          }

          if (yards > 20) {
            resultText += `💥 BIG PLAY! +${yards} yards!`;
            resultColor = COLORS.mustard;
          } else {
            resultText += `Gain of ${yards} yards`;
            resultColor = '#88FF88';
          }
        } else {
          if (countered && defPlay.type === 'blitz' && offPlay.type === 'pass') {
            yards = -8;
            resultText = '💀 SACKED! -8 yards!';
            resultColor = COLORS.ketchup;
          } else if (Math.random() < 0.12) {
            isTurnover = true;
            resultText = offPlay.type === 'pass' ? '🏈 INTERCEPTED!' : '🏈 FUMBLE!';
            resultColor = COLORS.ketchup;
          } else {
            yards = offPlay.type === 'run' ? Math.floor(Math.random() * 3) : 0;
            resultText = yards > 0 ? `Short gain, ${yards} yards` : 'No gain';
            resultColor = '#AAAAAA';
          }
        }
      } else if (!isPlayerOffense && 'counters' in play) {
        const cpuOffensePlay = cpuPlay as OffensivePlay;
        const playerDefensePlay = play as DefensivePlay;

        const baseSuccess = cpuOffensePlay.risk + (cpuTeam.offense - playerTeam.defense) / 200;
        const countered = playerDefensePlay.counters && playerDefensePlay.counters.includes(cpuOffensePlay.type);
        const successChance = countered ? baseSuccess * 0.4 : baseSuccess;

        if (Math.random() < successChance) {
          if (cpuOffensePlay.distance === 'long') yards = 20 + Math.floor(Math.random() * 30);
          else if (cpuOffensePlay.distance === 'medium') yards = 8 + Math.floor(Math.random() * 12);
          else yards = 2 + Math.floor(Math.random() * 6);
          resultText = `${cpuTeam.emoji} gains ${yards} yards`;
          resultColor = '#FFAA88';
        } else {
          if (countered) {
            if (playerDefensePlay.type === 'blitz' && cpuOffensePlay.type === 'pass') {
              yards = -7;
              resultText = '⚡ SACK! Great call!';
              resultColor = COLORS.mustard;
            } else if (Math.random() < 0.18) {
              isTurnover = true;
              resultText = '🎉 TURNOVER! Ball is yours!';
              resultColor = COLORS.mustard;
            } else {
              yards = 0;
              resultText = 'STUFFED! No gain!';
              resultColor = '#88FF88';
            }
          } else {
            yards = Math.floor(Math.random() * 3);
            resultText = yards > 0 ? `${cpuTeam.emoji} gains ${yards}` : 'Stopped for no gain';
            resultColor = '#AAAAAA';
          }
        }
      }

      setPlayResult({ text: resultText, color: resultColor, cpuPlay: cpuPlay.name });

      setTimeout(() => {
        if (isTurnover) {
          const newPos = 100 - ballPosition;
          resetDrive(possession === 'player' ? 'cpu' : 'player', newPos);
          setPlayResult(null);
          setIsAnimating(false);
          return;
        }

        const newPosition = ballPosition + yards;

        if (newPosition >= 100) {
          const scoringTeam = possession;
          if (scoringTeam === 'player') {
            setPlayerScore(s => s + 7);
            setPlayResult({ text: '🏈 TOUCHDOWN! +7', color: COLORS.mustard });
          } else {
            setCpuScore(s => s + 7);
            setPlayResult({ text: `😱 ${cpuTeam.emoji} Touchdown! +7`, color: COLORS.ketchup });
          }

          setTimeout(() => {
            resetDrive(scoringTeam === 'player' ? 'cpu' : 'player', 25);
            setTurboMeter(t => Math.min(100, t + 25));
            setPlayResult(null);
            setIsAnimating(false);
          }, 2000);
          return;
        }

        if (newPosition <= 0) {
          const scoringTeam = possession === 'player' ? 'cpu' : 'player';
          if (scoringTeam === 'player') {
            setPlayerScore(s => s + 2);
            setPlayResult({ text: '🛡️ SAFETY! +2', color: COLORS.mustard });
          } else {
            setCpuScore(s => s + 2);
            setPlayResult({ text: `😬 Safety! ${cpuTeam.emoji} +2`, color: COLORS.ketchup });
          }

          setTimeout(() => {
            resetDrive(possession, 20);
            setPlayResult(null);
            setIsAnimating(false);
          }, 2000);
          return;
        }

        setBallPosition(Math.max(1, Math.min(99, newPosition)));
        const yardsGained = newPosition - lineOfScrimmage;

        if (yardsGained >= yardsToGo) {
          setDown(1);
          setYardsToGo(10);
          setLineOfScrimmage(newPosition);
          if (!playResult?.text?.includes('TURBO') && !playResult?.text?.includes('BIG PLAY')) {
            setPlayResult(prev => prev ? { ...prev, text: prev.text + ' - FIRST DOWN!' } : null);
          }
        } else {
          const newDown = down + 1;
          if (newDown > 4) {
            setPlayResult({ text: 'TURNOVER ON DOWNS!', color: COLORS.ketchup });
            setTimeout(() => {
              resetDrive(possession === 'player' ? 'cpu' : 'player', 100 - newPosition);
              setPlayResult(null);
              setIsAnimating(false);
            }, 1500);
            return;
          }
          setDown(newDown);
          setYardsToGo(Math.max(1, yardsToGo - yards));
        }

        setTurboMeter(t => Math.min(100, t + 5));

        setTimeout(() => {
          setPlayResult(null);
          setIsAnimating(false);
          setShowPlaybook(true);
          setPlaybookTab('plays');
        }, 1500);
      }, 1200);
    }, 800);
  };

  const renderField = () => (
    <div style={{
      position: 'relative', height: '180px', margin: '10px',
      background: `linear-gradient(90deg,
        ${possession === 'player' ? COLORS.ketchup : COLORS.mustard}44 0%,
        ${possession === 'player' ? COLORS.ketchup : COLORS.mustard}44 10%,
        ${COLORS.grass} 10%, ${COLORS.grass} 90%,
        ${possession === 'player' ? COLORS.mustard : COLORS.ketchup}44 90%,
        ${possession === 'player' ? COLORS.mustard : COLORS.ketchup}44 100%)`,
      borderRadius: '8px', border: '4px solid white', overflow: 'hidden',
    }}>
      {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(yard => (
        <div key={yard} style={{
          position: 'absolute', left: `${yard}%`, top: 0, bottom: 0,
          width: '2px', background: 'rgba(255,255,255,0.3)',
        }}>
          <span style={{ position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 'bold' }}>
            {yard === 50 ? '50' : yard < 50 ? yard : 100 - yard}
          </span>
        </div>
      ))}

      <div style={{
        position: 'absolute', left: `${lineOfScrimmage}%`, top: 0, bottom: 0,
        width: '3px', background: '#4169E1', boxShadow: '0 0 8px #4169E1',
      }} />

      <div style={{
        position: 'absolute', left: `${Math.min(100, lineOfScrimmage + yardsToGo)}%`, top: 0, bottom: 0,
        width: '3px', background: COLORS.mustard, boxShadow: `0 0 10px ${COLORS.mustard}`,
      }} />

      <div style={{
        position: 'absolute', left: `${ballPosition}%`, top: '50%',
        transform: 'translate(-50%, -50%)', fontSize: '24px',
        transition: 'left 0.5s ease-out',
      }}>🏈</div>

      <div style={{ position: 'absolute', left: '2%', top: '10px', fontSize: '20px' }}>
        {possession === 'player' ? '🏰' : cpuTeam?.emoji}
      </div>
      <div style={{ position: 'absolute', right: '2%', top: '10px', fontSize: '20px' }}>
        {possession === 'player' ? playerTeam?.emoji : '🏰'}
      </div>
    </div>
  );

  const renderPlaybook = () => {
    const isPlayerOffense = possession === 'player';
    const plays = isPlayerOffense ? OFFENSIVE_PLAYS : DEFENSIVE_PLAYS;
    const canSpecialTeams = isPlayerOffense && down === 4;

    return (
      <div style={{ margin: '10px' }}>
        {canSpecialTeams && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', justifyContent: 'center' }}>
            <button onClick={() => setPlaybookTab('plays')} style={{
              background: playbookTab === 'plays' ? COLORS.burntOrange : 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: '8px', padding: '8px 16px', color: 'white', cursor: 'pointer',
            }}>📋 Plays</button>
            <button onClick={() => setPlaybookTab('special')} style={{
              background: playbookTab === 'special' ? COLORS.mustard : 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: '8px', padding: '8px 16px', color: playbookTab === 'special' ? 'black' : 'white', cursor: 'pointer',
            }}>⭐ Special Teams</button>
          </div>
        )}

        <div style={{ color: '#888', fontSize: '11px', marginBottom: '8px', textAlign: 'center' }}>
          {playbookTab === 'special' ? '4TH DOWN OPTIONS:' : (isPlayerOffense ? `OFFENSE - ${down}${['st','nd','rd','th'][Math.min(down-1,3)]} & ${yardsToGo}` : 'PICK YOUR DEFENSE:')}
        </div>

        {playbookTab === 'special' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {SPECIAL_TEAMS.map((play, i) => (
              <button key={i} onClick={() => executePlay(play, true)} style={{
                background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.midnight} 100%)`,
                border: `2px solid ${COLORS.mustard}`, borderRadius: '10px', padding: '12px 8px', cursor: 'pointer', color: 'white',
              }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>{play.icon}</div>
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{play.name}</div>
                <div style={{ fontSize: '9px', color: '#888' }}>{play.desc}</div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
            {plays.map((play, i) => (
              <button key={i} onClick={() => executePlay(play)} style={{
                background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.midnight} 100%)`,
                border: `2px solid ${isPlayerOffense ? COLORS.burntOrange : '#4CAF50'}`,
                borderRadius: '8px', padding: '10px 6px', cursor: 'pointer', color: 'white', textAlign: 'center',
              }}>
                <div style={{ fontSize: '20px', marginBottom: '2px' }}>{play.icon}</div>
                <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{play.name}</div>
                <div style={{ fontSize: '9px', color: '#666' }}>{play.desc}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: possession === 'player'
        ? `linear-gradient(180deg, ${playerTeam?.color || COLORS.charcoal}44 0%, ${COLORS.midnight} 100%)`
        : `linear-gradient(180deg, ${cpuTeam?.color || COLORS.charcoal}44 0%, ${COLORS.midnight} 100%)`,
      fontFamily: 'system-ui', overflow: 'hidden', userSelect: 'none', transition: 'background 0.5s',
    }}>
      <ArcadeHeader title="Gridiron Blitz" onBack={onBack} showBack />

      {gamePhase !== 'teamSelect' && (
        <ScoreBar items={[
          { label: playerTeam?.name?.split(' ')[0] || 'YOU', value: playerScore, color: playerTeam?.color || 'white' },
          { label: 'QTR', value: quarter, color: 'white' },
          { label: 'TIME', value: timeLeft, color: timeLeft <= 10 ? COLORS.ketchup : 'white' },
          { label: cpuTeam?.name?.split(' ')[0] || 'CPU', value: cpuScore, color: cpuTeam?.color || 'white' },
        ]} />
      )}

      <div style={{ padding: '5px' }}>
        {gamePhase === 'teamSelect' && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '10px' }}>🏈</div>
            <h2 style={{ color: COLORS.burntOrange, marginBottom: '8px' }}>GRIDIRON BLITZ</h2>
            <p style={{ color: '#888', marginBottom: '24px', fontSize: '14px' }}>4 quarters × 60 seconds. Call plays. Score big!</p>
            <p style={{ color: 'white', marginBottom: '16px' }}>Choose your team:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', maxWidth: '400px', margin: '0 auto' }}>
              {TEAMS.map((team, i) => (
                <button key={i} onClick={() => startGame(i)} style={{
                  background: `linear-gradient(135deg, ${team.color}44 0%, ${COLORS.midnight} 100%)`,
                  border: `3px solid ${team.color}`, borderRadius: '12px',
                  padding: '16px', cursor: 'pointer', width: '150px', textAlign: 'center', color: 'white',
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>{team.emoji}</div>
                  <div style={{ fontWeight: 'bold' }}>{team.name}</div>
                  <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>OFF: {team.offense} | DEF: {team.defense}</div>
                </button>
              ))}
            </div>
            {highScore > 0 && <p style={{ marginTop: '24px', color: COLORS.mustard }}>🏆 Best: {highScore} pts</p>}
          </div>
        )}

        {gamePhase === 'play' && (
          <>
            {renderField()}

            <div style={{
              textAlign: 'center', padding: '8px',
              background: 'rgba(0,0,0,0.5)', borderRadius: '8px', margin: '5px 10px',
            }}>
              <span style={{ color: possession === 'player' ? COLORS.mustard : '#FF8888', fontWeight: 'bold', fontSize: '16px' }}>
                {possession === 'player' ? `${playerTeam?.emoji} YOUR BALL` : `${cpuTeam?.emoji} DEFENSE`}
              </span>
              <span style={{ color: 'white', marginLeft: '12px', fontSize: '14px' }}>
                {down}{['st','nd','rd','th'][Math.min(down-1,3)]} & {yardsToGo} at the {ballPosition < 50 ? ballPosition : 100 - ballPosition}
              </span>
            </div>

            <div style={{ margin: '5px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '6px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: COLORS.ember, fontSize: '11px' }}>⚡ TURBO</span>
                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${turboMeter}%`, background: `linear-gradient(90deg, ${COLORS.ember} 0%, ${COLORS.mustard} 100%)`, transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>

            {playResult && (
              <div style={{
                textAlign: 'center', padding: '14px', margin: '10px',
                background: 'rgba(0,0,0,0.85)', borderRadius: '12px', animation: 'popIn 0.3s ease-out',
              }}>
                <div style={{ color: playResult.color, fontSize: '18px', fontWeight: 'bold' }}>{playResult.text}</div>
                {playResult.cpuPlay && <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>vs {playResult.cpuPlay}</div>}
              </div>
            )}

            {showPlaybook && !isAnimating && renderPlaybook()}
          </>
        )}

        {gamePhase === 'halftime' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎺</div>
            <h2 style={{ color: COLORS.burntOrange, marginBottom: '16px' }}>HALFTIME!</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#888' }}>{playerTeam?.name}</div>
                <div style={{ fontSize: '36px', color: playerTeam?.color, fontWeight: 'bold' }}>{playerScore}</div>
              </div>
              <div style={{ color: '#444', fontSize: '24px', alignSelf: 'center' }}>-</div>
              <div>
                <div style={{ fontSize: '14px', color: '#888' }}>{cpuTeam?.name}</div>
                <div style={{ fontSize: '36px', color: cpuTeam?.color, fontWeight: 'bold' }}>{cpuScore}</div>
              </div>
            </div>
            <ActionButton onClick={() => { setQuarter(3); setTimeLeft(60); resetDrive(possession === 'player' ? 'cpu' : 'player', 25); setGamePhase('play'); }}>
              ▶️ Start 2nd Half
            </ActionButton>
          </div>
        )}

        {gamePhase === 'gameover' && (
          <GameOverlay visible={true}>
            <div style={{ fontSize: '64px', marginBottom: '12px' }}>
              {playerScore > cpuScore ? '🏆' : playerScore < cpuScore ? '😢' : '🤝'}
            </div>
            <h2 style={{ color: COLORS.burntOrange, marginBottom: '12px' }}>
              {playerScore > cpuScore ? 'VICTORY!' : playerScore < cpuScore ? 'DEFEAT' : 'TIE GAME'}
            </h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#888' }}>{playerTeam?.name}</div>
                <div style={{ fontSize: '36px', color: playerTeam?.color, fontWeight: 'bold' }}>{playerScore}</div>
              </div>
              <div style={{ color: '#444', fontSize: '24px', alignSelf: 'center' }}>-</div>
              <div>
                <div style={{ fontSize: '14px', color: '#888' }}>{cpuTeam?.name}</div>
                <div style={{ fontSize: '36px', color: cpuTeam?.color, fontWeight: 'bold' }}>{cpuScore}</div>
              </div>
            </div>
            {playerScore > highScore && <div style={{ color: COLORS.mustard, marginBottom: '16px' }}>🏆 NEW HIGH SCORE!</div>}
            <ActionButton onClick={() => setGamePhase('teamSelect')}>🔄 Play Again</ActionButton>
          </GameOverlay>
        )}
      </div>

      <style>{`@keyframes popIn { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
};

// ============================================================================
// GAME REGISTRY (NO COMING SOON)
// ============================================================================

const GAMES: Game[] = [
  { id: 'hotdog-dash', title: "Hot Dog Dash", description: "Help Blaze catch falling hot dogs!", icon: "🌭", component: HotDogDashGame },
  { id: 'sandlot-slugger', title: "Sandlot Slugger", description: "Backyard home run derby!", icon: "⚾", component: SandlotSluggerGame },
  { id: 'gridiron-blitz', title: "Gridiron Blitz", description: "Fast arcade football action!", icon: "🏈", component: GridironBlitzGame },
];

// ============================================================================
// ARCADE HUB
// ============================================================================

interface ArcadeHubProps {
  onSelectGame: (id: string) => void;
  onClose: () => void;
  highScores: Record<string, number>;
}

const ArcadeHub: React.FC<ArcadeHubProps> = ({ onSelectGame, onClose, highScores }) => {
  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${COLORS.midnight} 0%, ${COLORS.charcoal} 50%, #1a1a2e 100%)`, fontFamily: 'system-ui' }}>
      <ArcadeHeader title="Blaze Arcade" onClose={onClose} />
      <div style={{ padding: '30px 20px', textAlign: 'center' }}>
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontSize: '64px', marginBottom: '10px' }}>🐕🎮</div>
          <h1 style={{ color: COLORS.burntOrange, fontSize: '28px', marginBottom: '8px' }}>Blaze Arcade</h1>
          <p style={{ color: '#888', fontSize: '14px' }}>A Blaze Sports Intel Easter Egg Collection</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', maxWidth: '640px', margin: '0 auto' }}>
          {GAMES.map(game => (
            <GameCard key={game.id} game={game} highScore={highScores[game.id] || 0} onSelect={onSelectGame} />
          ))}
        </div>
        <div style={{ marginTop: '40px', color: '#555', fontSize: '12px' }}>
          <p style={{ marginTop: '8px', opacity: 0.6 }}>blazesportsintel.com</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

interface BlazeArcadeProps {
  onClose: () => void;
}

const STORAGE_KEY = 'blaze-arcade-highscores';

export default function BlazeArcade({ onClose }: BlazeArcadeProps) {
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [highScores, setHighScores] = useState<Record<string, number>>({});

  // Load high scores from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHighScores(JSON.parse(saved));
      }
    } catch {
      // localStorage not available
    }
  }, []);

  // Save high scores to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(highScores));
    } catch {
      // localStorage not available
    }
  }, [highScores]);

  const updateHighScore = (gameId: string, score: number) => {
    setHighScores(prev => {
      const currentHigh = prev[gameId] || 0;
      if (score > currentHigh) {
        return { ...prev, [gameId]: score };
      }
      return prev;
    });
  };

  if (currentGame) {
    const game = GAMES.find(g => g.id === currentGame);
    if (game?.component) {
      const GameComponent = game.component;
      return (
        <GameComponent
          onBack={() => setCurrentGame(null)}
          highScore={highScores[currentGame] || 0}
          onUpdateHighScore={(score) => updateHighScore(currentGame, score)}
        />
      );
    }
  }

  return <ArcadeHub onSelectGame={setCurrentGame} onClose={onClose} highScores={highScores} />;
}
