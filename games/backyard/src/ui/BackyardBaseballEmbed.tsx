/**
 * Blaze Backyard Baseball - React Embed Component
 *
 * A responsive Next.js/React component that embeds the Babylon.js game
 * For use on BlazeSportsIntel.com and partner sites
 *
 * Usage:
 * ```tsx
 * import { BackyardBaseballEmbed } from '@/games/backyard/BackyardBaseballEmbed';
 *
 * export default function GamePage() {
 *   return (
 *     <BackyardBaseballEmbed
 *       width="100%"
 *       height="600px"
 *       onScoreSubmit={(result) => console.log('Score:', result.finalScore)}
 *     />
 *   );
 * }
 * ```
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

// Types
interface GameResult {
  finalScore: number;
  totalPitches: number;
  totalHits: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  whiffs: number;
  longestStreak: number;
  characterId: string;
  durationSeconds: number;
}

interface BackyardCharacter {
  id: string;
  name: string;
  nickname: string;
  power: number;
  contact: number;
  speed: number;
  uniformColor: string;
}

interface BackyardFieldConfig {
  id: string;
  name: string;
  description: string;
  theme: string;
  dimensions: {
    leftField: number;
    centerField: number;
    rightField: number;
    foulLineLength: number;
  };
  visuals: {
    grassColor: string;
    dirtColor: string;
    skyColor: string;
    ambientIntensity: number;
  };
  environmentalEffects: Array<{
    name: string;
    description: string;
    effect: 'bonus' | 'hazard';
  }>;
}

interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  characterId?: string;
}

interface BackyardBaseballEmbedProps {
  /** Width of the game container */
  width?: string | number;
  /** Height of the game container */
  height?: string | number;
  /** Custom player ID (defaults to auto-generated) */
  playerId?: string;
  /** Custom player name for leaderboard */
  playerName?: string;
  /** Pre-select a character by ID */
  defaultCharacterId?: string;
  /** Pre-select a field by ID */
  defaultFieldId?: string;
  /** Skip character/field selection and start immediately */
  autoStart?: boolean;
  /** API base URL for score submission */
  apiBaseUrl?: string;
  /** Callback when a game ends */
  onGameEnd?: (result: GameResult) => void;
  /** Callback when score is submitted */
  onScoreSubmit?: (result: GameResult, rank: number) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
  /** Show the leaderboard after game */
  showLeaderboard?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

type GameState = 'loading' | 'menu' | 'playing' | 'gameover';

/** Default starter characters */
const DEFAULT_CHARACTERS: BackyardCharacter[] = [
  {
    id: 'char_blaze_001',
    name: 'Ember Ellis',
    nickname: 'The Spark',
    power: 6,
    contact: 8,
    speed: 7,
    uniformColor: '#BF5700',
  },
  {
    id: 'char_blaze_002',
    name: 'Marcus "Mack" Jackson',
    nickname: 'Big Mac',
    power: 10,
    contact: 4,
    speed: 3,
    uniformColor: '#1A1A1A',
  },
  {
    id: 'char_blaze_003',
    name: 'Sofia "Speedy" Ramirez',
    nickname: 'Speedy',
    power: 4,
    contact: 7,
    speed: 10,
    uniformColor: '#FF6B35',
  },
  {
    id: 'char_blaze_004',
    name: 'Tommy "T-Bone" Chen',
    nickname: 'T-Bone',
    power: 6,
    contact: 6,
    speed: 6,
    uniformColor: '#228B22',
  },
];

/** Default starter fields */
const DEFAULT_FIELDS: BackyardFieldConfig[] = [
  {
    id: 'field_blaze_001',
    name: 'Dusty Acres Backyard',
    description: 'A classic Texas backyard diamond',
    theme: 'classic',
    dimensions: { leftField: 35, centerField: 45, rightField: 35, foulLineLength: 50 },
    visuals: { grassColor: '#228B22', dirtColor: '#8B4513', skyColor: '#87CEEB', ambientIntensity: 0.5 },
    environmentalEffects: [{ name: 'Home Field', description: '+5% contact', effect: 'bonus' }],
  },
  {
    id: 'field_blaze_002',
    name: 'Sunset Beach Diamond',
    description: 'Sandy basepaths along the coast',
    theme: 'beach',
    dimensions: { leftField: 32, centerField: 40, rightField: 32, foulLineLength: 45 },
    visuals: { grassColor: '#90EE90', dirtColor: '#F4A460', skyColor: '#FF7F50', ambientIntensity: 0.6 },
    environmentalEffects: [{ name: 'Ocean Breeze', description: 'Wind pushes fly balls', effect: 'bonus' }],
  },
];

export function BackyardBaseballEmbed({
  width = '100%',
  height = '600px',
  playerId,
  playerName,
  defaultCharacterId,
  defaultFieldId,
  autoStart = false,
  apiBaseUrl = '/api/backyard',
  onGameEnd,
  onScoreSubmit,
  onError,
  showLeaderboard = true,
  className = '',
  style = {},
}: BackyardBaseballEmbedProps): React.ReactElement {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameEngineRef = useRef<any>(null);

  // State
  const [gameState, setGameState] = useState<GameState>('loading');
  const [selectedCharacter, setSelectedCharacter] = useState<BackyardCharacter>(
    DEFAULT_CHARACTERS.find((c) => c.id === defaultCharacterId) || DEFAULT_CHARACTERS[0]
  );
  const [selectedField, setSelectedField] = useState<BackyardFieldConfig>(
    DEFAULT_FIELDS.find((f) => f.id === defaultFieldId) || DEFAULT_FIELDS[0]
  );
  const [currentScore, setCurrentScore] = useState(0);
  const [currentOuts, setCurrentOuts] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate player ID if not provided
  const resolvedPlayerId = useRef(
    playerId || `player_${Date.now()}_${Math.random().toString(36).substring(7)}`
  );

  /** Load the game engine dynamically */
  const loadGameEngine = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Dynamic import of the game engine
      const { BackyardGameEngine } = await import('@core/BackyardGameEngine');

      if (!canvasRef.current) {
        throw new Error('Canvas not available');
      }

      // Create and initialize the game engine
      gameEngineRef.current = await BackyardGameEngine.create({
        canvas: canvasRef.current,
        character: selectedCharacter as any,
        fieldConfig: selectedField as any,
        onGameStateChange: (state: any) => {
          setCurrentScore(state.score);
          setCurrentOuts(state.outs);
          setCurrentStreak(state.streak);
          setCurrentMultiplier(state.multiplier);
          setTimeRemaining(Math.ceil(state.timeRemaining / 1000));
        },
        onGameOver: handleGameOver,
      });

      setIsLoading(false);
      setGameState('menu');

      if (autoStart) {
        startGame();
      }
    } catch (err: any) {
      const error = new Error(`Failed to load game: ${err.message}`);
      setError(error.message);
      setIsLoading(false);
      onError?.(error);
    }
  }, [selectedCharacter, selectedField, autoStart, onError]);

  /** Start a new game */
  const startGame = useCallback(() => {
    if (gameEngineRef.current) {
      setGameState('playing');
      setCurrentScore(0);
      setCurrentOuts(0);
      setCurrentStreak(0);
      setCurrentMultiplier(1);
      setTimeRemaining(60);
      setGameResult(null);
      gameEngineRef.current.startGame();
    }
  }, []);

  /** Handle game over */
  const handleGameOver = useCallback(
    async (result: GameResult) => {
      setGameResult(result);
      setGameState('gameover');

      // Callback
      onGameEnd?.(result);

      // Submit score to API
      try {
        const response = await fetch(`${apiBaseUrl}/submit-score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: resolvedPlayerId.current,
            playerName,
            score: result.finalScore,
            characterId: result.characterId,
            stats: {
              totalPitches: result.totalPitches,
              totalHits: result.totalHits,
              singles: result.singles,
              doubles: result.doubles,
              triples: result.triples,
              homeRuns: result.homeRuns,
              whiffs: result.whiffs,
              longestStreak: result.longestStreak,
              durationSeconds: result.durationSeconds,
            },
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as { data?: { rank?: number } };
          setPlayerRank(data.data?.rank || null);
          onScoreSubmit?.(result, data.data?.rank || 0);
        }
      } catch (err: any) {
        console.error('Failed to submit score:', err);
      }

      // Fetch leaderboard
      if (showLeaderboard) {
        try {
          const response = await fetch(`${apiBaseUrl}/leaderboard?limit=10`);
          if (response.ok) {
            const data = (await response.json()) as { entries?: LeaderboardEntry[] };
            setLeaderboard(data.entries || []);
          }
        } catch (err) {
          console.error('Failed to fetch leaderboard:', err);
        }
      }
    },
    [apiBaseUrl, playerName, onGameEnd, onScoreSubmit, showLeaderboard]
  );

  /** Clean up on unmount */
  useEffect(() => {
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.dispose();
        gameEngineRef.current = null;
      }
    };
  }, []);

  /** Initialize game engine when character/field changes */
  useEffect(() => {
    if (gameState === 'menu' || gameState === 'loading') {
      loadGameEngine();
    }
  }, [loadGameEngine, gameState]);

  // Styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    backgroundColor: '#1A1A1A',
    borderRadius: '12px',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    ...style,
  };

  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: gameState === 'playing' ? 'block' : 'none',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    color: '#FAF8F5',
    padding: '1.5rem',
    textAlign: 'center',
  };

  return (
    <div ref={containerRef} className={`backyard-baseball-embed ${className}`} style={containerStyle}>
      {/* Game Canvas */}
      <canvas ref={canvasRef} style={canvasStyle} />

      {/* Loading State */}
      {gameState === 'loading' && (
        <div style={overlayStyle}>
          <div style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            {error ? error : 'Loading Blaze Backyard Baseball...'}
          </div>
          {!error && (
            <div
              style={{
                width: '200px',
                height: '4px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '50%',
                  height: '100%',
                  backgroundColor: '#BF5700',
                  animation: 'loading 1s ease-in-out infinite',
                }}
              />
            </div>
          )}
          {error && (
            <button
              onClick={() => loadGameEngine()}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#BF5700',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Menu State */}
      {gameState === 'menu' && !isLoading && (
        <div style={overlayStyle}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#BF5700' }}>
            Blaze Backyard Baseball
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
            60-Second Batting Challenge
          </p>

          {/* Character Selection */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#BF5700', marginBottom: '0.5rem' }}>
              SELECT BATTER
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {DEFAULT_CHARACTERS.map((char) => (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharacter(char)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor:
                      selectedCharacter.id === char.id ? 'rgba(191,87,0,0.3)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${selectedCharacter.id === char.id ? '#BF5700' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{char.nickname}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                    PWR:{char.power} CON:{char.contact}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={startGame}
            style={{
              padding: '1rem 3rem',
              fontSize: '1.25rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #BF5700, #FF6B35)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Play Ball!
          </button>
        </div>
      )}

      {/* Game UI Overlay */}
      {gameState === 'playing' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.75rem',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.6)' }}>SCORE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#C9A227' }}>
              {currentScore.toLocaleString()}
            </div>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.6)' }}>TIME</div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: timeRemaining <= 10 ? '#CC0000' : '#FAF8F5',
              }}
            >
              {timeRemaining}
            </div>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.6)' }}>OUTS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FAF8F5' }}>{currentOuts}/3</div>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.6)' }}>MULTIPLIER</div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: currentMultiplier > 1 ? '#FF6B35' : '#FAF8F5',
              }}
            >
              {currentMultiplier.toFixed(1)}x
            </div>
          </div>
        </div>
      )}

      {/* Game Over State */}
      {gameState === 'gameover' && gameResult && (
        <div style={overlayStyle}>
          <h2 style={{ fontSize: '1.5rem', color: '#BF5700', marginBottom: '0.5rem' }}>GAME OVER</h2>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: '#C9A227', marginBottom: '1rem' }}>
            {gameResult.finalScore.toLocaleString()}
          </div>

          {playerRank && (
            <div style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.6)' }}>
              Your Rank: #{playerRank}
            </div>
          )}

          {/* Stats */}
          <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            <div>Hits: {gameResult.totalHits}</div>
            <div>Home Runs: {gameResult.homeRuns}</div>
            <div>Longest Streak: {gameResult.longestStreak}</div>
          </div>

          {/* Leaderboard */}
          {showLeaderboard && leaderboard.length > 0 && (
            <div style={{ marginBottom: '1.5rem', width: '100%', maxWidth: '300px' }}>
              <div style={{ fontWeight: 700, color: '#BF5700', marginBottom: '0.5rem' }}>TOP SCORES</div>
              {leaderboard.slice(0, 5).map((entry, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor:
                      entry.playerId === resolvedPlayerId.current ? 'rgba(191,87,0,0.2)' : 'transparent',
                    borderRadius: '4px',
                  }}
                >
                  <span>#{i + 1} {entry.playerName || 'Anonymous'}</span>
                  <span style={{ color: '#C9A227' }}>{entry.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={startGame}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #BF5700, #FF6B35)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Play Again
            </button>
            <button
              onClick={() => setGameState('menu')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Change Batter
            </button>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

export default BackyardBaseballEmbed;
