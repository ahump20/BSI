/**
 * Blaze Blitz Football - React Embed Component
 *
 * Embeddable React component for integrating the Blitz Football
 * microgame into any React application.
 *
 * Usage:
 * ```tsx
 * import { BlitzFootballEmbed } from '@blaze/blitz-football';
 *
 * function App() {
 *   return (
 *     <BlitzFootballEmbed
 *       width="100%"
 *       height="600px"
 *       playerId="user_123"
 *       playerName="John Doe"
 *       onGameOver={(result) => console.log('Game over:', result)}
 *     />
 *   );
 * }
 * ```
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BlitzGameEngine, BlitzGameState, BlitzGameResult } from '@core/BlitzGameEngine';
import { FIREBIRDS, SHADOW_WOLVES, getPlayableTeams, BlitzTeam } from '@data/teams';

/** Props for the embed component */
export interface BlitzFootballEmbedProps {
  /** Width of the game container */
  width?: string | number;
  /** Height of the game container */
  height?: string | number;
  /** Player ID for leaderboard tracking */
  playerId?: string;
  /** Display name for leaderboard */
  playerName?: string;
  /** Callback when game ends */
  onGameOver?: (result: BlitzGameResult) => void;
  /** Callback when game state changes */
  onGameStateChange?: (state: BlitzGameState) => void;
  /** Initial team selection */
  defaultTeamId?: string;
  /** Whether to auto-start the game */
  autoStart?: boolean;
  /** API endpoint for score submission (default: /api/blitz) */
  apiEndpoint?: string;
  /** Custom CSS class for container */
  className?: string;
  /** Custom inline styles for container */
  style?: React.CSSProperties;
}

/** Game phase for UI state */
type GamePhase = 'menu' | 'playing' | 'gameover';

/** Blitz Football Embed Component */
export const BlitzFootballEmbed: React.FC<BlitzFootballEmbedProps> = ({
  width = '100%',
  height = '600px',
  playerId,
  playerName,
  onGameOver,
  onGameStateChange,
  defaultTeamId = 'team_firebirds',
  autoStart = false,
  apiEndpoint = '/api/blitz',
  className,
  style,
}) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BlitzGameEngine | null>(null);

  // State
  const [phase, setPhase] = useState<GamePhase>(autoStart ? 'playing' : 'menu');
  const [selectedTeam, setSelectedTeam] = useState<BlitzTeam>(
    getPlayableTeams().find((t) => t.id === defaultTeamId) || FIREBIRDS
  );
  const [gameState, setGameState] = useState<BlitzGameState | null>(null);
  const [gameResult, setGameResult] = useState<BlitzGameResult | null>(null);
  const [highScore, setHighScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load high score from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('blitz_high_score');
    if (stored) {
      setHighScore(parseInt(stored, 10));
    }
  }, []);

  // Generate or get player ID
  const getPlayerId = useCallback((): string => {
    if (playerId) return playerId;

    let storedId = localStorage.getItem('blitz_player_id');
    if (!storedId) {
      storedId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('blitz_player_id', storedId);
    }
    return storedId;
  }, [playerId]);

  // Handle game state changes
  const handleGameStateChange = useCallback(
    (state: BlitzGameState) => {
      setGameState(state);
      onGameStateChange?.(state);
    },
    [onGameStateChange]
  );

  // Handle game over
  const handleGameOver = useCallback(
    async (result: BlitzGameResult) => {
      setGameResult(result);
      setPhase('gameover');

      // Update high score
      if (result.finalScore > highScore) {
        setHighScore(result.finalScore);
        localStorage.setItem('blitz_high_score', result.finalScore.toString());
      }

      // Submit score to API
      try {
        await fetch(`${apiEndpoint}/submit-score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: getPlayerId(),
            playerName,
            score: result.finalScore,
            teamId: result.teamId,
            stats: {
              yardsGained: result.yardsGained,
              touchdowns: result.touchdowns,
              firstDowns: result.firstDowns,
              bigPlays: result.bigPlays,
              turnovers: result.turnovers,
              tacklesMade: result.tacklesMade,
              stiffArms: result.stiffArms,
              jukes: result.jukes,
              turboYards: result.turboYards,
              longestPlay: result.longestPlay,
              durationSeconds: result.durationSeconds,
              result: result.result,
            },
          }),
        });
      } catch (error) {
        console.error('Failed to submit score:', error);
      }

      onGameOver?.(result);
    },
    [highScore, apiEndpoint, getPlayerId, playerName, onGameOver]
  );

  // Start game
  const startGame = useCallback(async () => {
    if (!canvasRef.current) return;

    setIsLoading(true);
    setPhase('playing');
    setGameResult(null);

    // Dispose existing engine
    if (engineRef.current) {
      engineRef.current.dispose();
    }

    // Create new engine
    try {
      engineRef.current = await BlitzGameEngine.create({
        canvas: canvasRef.current,
        homeTeam: selectedTeam,
        awayTeam: SHADOW_WOLVES,
        onGameStateChange: handleGameStateChange,
        onGameOver: handleGameOver,
      });

      engineRef.current.startGame();
    } catch (error) {
      console.error('Failed to start game:', error);
      setPhase('menu');
    }

    setIsLoading(false);
  }, [selectedTeam, handleGameStateChange, handleGameOver]);

  // Auto-start if configured
  useEffect(() => {
    if (autoStart && canvasRef.current) {
      startGame();
    }
  }, [autoStart, startGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

  // Render team selection card
  const renderTeamCard = (team: BlitzTeam) => (
    <button
      key={team.id}
      onClick={() => setSelectedTeam(team)}
      style={{
        background:
          selectedTeam.id === team.id
            ? `linear-gradient(135deg, ${team.primaryColor}33, ${team.primaryColor}11)`
            : 'rgba(255, 255, 255, 0.05)',
        border: `2px solid ${selectedTeam.id === team.id ? '#39FF14' : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: '4px',
        padding: '1rem',
        cursor: 'pointer',
        textAlign: 'center',
        transform: 'skewX(-5deg)',
        transition: 'all 0.2s ease',
        color: 'white',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: team.primaryColor,
          margin: '0 auto 0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Russo One', sans-serif",
          fontSize: '1.5rem',
          transform: 'skewX(5deg)',
          boxShadow: `0 0 15px ${team.primaryColor}`,
        }}
      >
        {team.shortName.charAt(0)}
      </div>
      <div
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: '1rem',
          color: team.primaryColor,
          transform: 'skewX(5deg)',
          marginBottom: '0.25rem',
        }}
      >
        {team.name}
      </div>
      <div
        style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.6)',
          transform: 'skewX(5deg)',
        }}
      >
        OFF {team.offense} | DEF {team.defense} | SPD {team.speed}
      </div>
    </button>
  );

  return (
    <div
      className={className}
      style={{
        width,
        height,
        background: '#0D0D0D',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, sans-serif",
        ...style,
      }}
    >
      {/* Canvas (always rendered for Babylon.js) */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: phase === 'playing' ? 'block' : 'none',
          touchAction: 'none',
        }}
      />

      {/* Menu Screen */}
      {phase === 'menu' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'linear-gradient(180deg, #0D0D0D 0%, #050510 100%)',
          }}
        >
          <h1
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: 'clamp(2rem, 8vw, 3.5rem)',
              textTransform: 'uppercase',
              color: '#39FF14',
              textShadow: '0 0 20px #39FF14, 4px 4px 0 #BF5700',
              transform: 'skewX(-5deg)',
              marginBottom: '0.5rem',
            }}
          >
            Blitz Football
          </h1>

          <p
            style={{
              fontFamily: "'Russo One', sans-serif",
              color: '#FF6EC7',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1rem',
            }}
          >
            60 Second Challenge
          </p>

          <p
            style={{
              fontFamily: "'Russo One', sans-serif",
              color: '#FFD700',
              marginBottom: '1.5rem',
            }}
          >
            High Score: {highScore.toLocaleString()}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              width: '100%',
              maxWidth: '500px',
              marginBottom: '1.5rem',
            }}
          >
            {getPlayableTeams().map(renderTeamCard)}
          </div>

          <button
            onClick={startGame}
            disabled={isLoading}
            style={{
              padding: '1rem 3rem',
              fontFamily: "'Russo One', sans-serif",
              fontSize: '1.5rem',
              textTransform: 'uppercase',
              background: 'linear-gradient(180deg, #39FF14 0%, #20CC10 100%)',
              color: '#0D0D0D',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transform: 'skewX(-5deg)',
              boxShadow: '0 4px 0 #1A8C0A, 0 0 30px rgba(57, 255, 20, 0.4)',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Loading...' : 'Start Game'}
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {phase === 'gameover' && gameResult && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'rgba(0, 0, 0, 0.95)',
          }}
        >
          <h2
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: '2rem',
              color: '#FF6EC7',
              textShadow: '0 0 20px #FF6EC7',
              transform: 'skewX(-10deg)',
              marginBottom: '0.5rem',
            }}
          >
            Game Over
          </h2>

          <p
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: '1.25rem',
              color: '#00FFFF',
              marginBottom: '1rem',
            }}
          >
            {gameResult.result === 'touchdown'
              ? 'TOUCHDOWN!'
              : gameResult.result === 'turnover'
                ? 'TURNOVER ON DOWNS'
                : 'TIME EXPIRED'}
          </p>

          <p
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: '4rem',
              color: '#39FF14',
              textShadow: '0 0 30px #39FF14',
              marginBottom: '1.5rem',
            }}
          >
            {gameResult.finalScore.toLocaleString()}
          </p>

          <div
            style={{
              width: '100%',
              maxWidth: '300px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Yards</span>
              <span style={{ fontFamily: "'Russo One'", color: '#FFD700' }}>{gameResult.yardsGained}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Touchdowns</span>
              <span style={{ fontFamily: "'Russo One'", color: '#FFD700' }}>{gameResult.touchdowns}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>First Downs</span>
              <span style={{ fontFamily: "'Russo One'", color: '#FFD700' }}>{gameResult.firstDowns}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Longest Play</span>
              <span style={{ fontFamily: "'Russo One'", color: '#FFD700' }}>{gameResult.longestPlay} yds</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={startGame}
              style={{
                padding: '0.75rem 2rem',
                fontFamily: "'Russo One', sans-serif",
                fontSize: '1rem',
                textTransform: 'uppercase',
                background: 'linear-gradient(180deg, #39FF14 0%, #20CC10 100%)',
                color: '#0D0D0D',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transform: 'skewX(-5deg)',
              }}
            >
              Play Again
            </button>
            <button
              onClick={() => setPhase('menu')}
              style={{
                padding: '0.75rem 2rem',
                fontFamily: "'Russo One', sans-serif",
                fontSize: '1rem',
                textTransform: 'uppercase',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                cursor: 'pointer',
                transform: 'skewX(-5deg)',
              }}
            >
              Menu
            </button>
          </div>
        </div>
      )}

      {/* Game UI Overlay */}
      {phase === 'playing' && gameState && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            padding: '1rem',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              padding: '0.5rem 1rem',
              border: '2px solid #39FF14',
              transform: 'skewX(-10deg)',
            }}
          >
            <div
              style={{
                fontFamily: "'Russo One'",
                fontSize: '0.625rem',
                color: '#00FFFF',
                transform: 'skewX(10deg)',
              }}
            >
              SCORE
            </div>
            <div
              style={{
                fontFamily: "'Russo One'",
                fontSize: '1.5rem',
                color: '#39FF14',
                transform: 'skewX(10deg)',
                textShadow: '0 0 10px #39FF14',
              }}
            >
              {gameState.score.toLocaleString()}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              padding: '0.5rem 1rem',
              border: '2px solid #39FF14',
              transform: 'skewX(-10deg)',
            }}
          >
            <div
              style={{
                fontFamily: "'Russo One'",
                fontSize: '0.625rem',
                color: '#00FFFF',
                transform: 'skewX(10deg)',
              }}
            >
              TIME
            </div>
            <div
              style={{
                fontFamily: "'Russo One'",
                fontSize: '1.5rem',
                color: Math.ceil(gameState.timeRemaining / 1000) <= 10 ? '#FF6EC7' : '#FFD700',
                transform: 'skewX(10deg)',
                textShadow: '0 0 10px currentColor',
              }}
            >
              {Math.ceil(gameState.timeRemaining / 1000)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlitzFootballEmbed;
