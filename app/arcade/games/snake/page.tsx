'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createSnakeGame,
  queueDirection,
  startSnakeGame,
  stepSnakeGame,
  toggleSnakePause,
  type SnakeDirection,
  type SnakeGameState,
} from '@/lib/arcade/snake';

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const BOARD_SIZE = GRID_SIZE * CELL_SIZE;
const TICK_MS = 120;

const KEY_TO_DIRECTION: Record<string, SnakeDirection> = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
};

function serializeGameState(state: SnakeGameState): string {
  return JSON.stringify({
    mode: state.mode,
    coordinateSystem: {
      origin: 'top-left',
      xAxis: 'positive right',
      yAxis: 'positive down',
      units: 'grid cells',
    },
    grid: {
      width: state.gridSize,
      height: state.gridSize,
      cellSize: CELL_SIZE,
    },
    snake: state.snake.map((segment) => ({ x: segment.x, y: segment.y })),
    direction: state.direction,
    queuedDirection: state.queuedDirection,
    food: { x: state.food.x, y: state.food.y },
    score: state.score,
    tickMs: TICK_MS,
  });
}

function drawBoard(ctx: CanvasRenderingContext2D, state: SnakeGameState) {
  const size = state.gridSize * CELL_SIZE;
  ctx.clearRect(0, 0, size, size);

  ctx.fillStyle = '#0D0D12';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  for (let index = 0; index <= state.gridSize; index += 1) {
    const offset = index * CELL_SIZE + 0.5;
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(size, offset);
    ctx.stroke();
  }

  state.snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? '#FDB913' : '#FF6B35';
    ctx.fillRect(
      segment.x * CELL_SIZE + 1,
      segment.y * CELL_SIZE + 1,
      CELL_SIZE - 2,
      CELL_SIZE - 2
    );
  });

  ctx.fillStyle = '#C41E3A';
  ctx.fillRect(
    state.food.x * CELL_SIZE + 1,
    state.food.y * CELL_SIZE + 1,
    CELL_SIZE - 2,
    CELL_SIZE - 2
  );
}

export default function SnakeGamePage() {
  const [gameState, setGameState] = useState<SnakeGameState>(() => createSnakeGame({ gridSize: GRID_SIZE }));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const gameStateRef = useRef(gameState);

  const commitState = useCallback((nextState: SnakeGameState) => {
    gameStateRef.current = nextState;
    setGameState(nextState);
  }, []);

  const runSteps = useCallback(
    (stepCount: number) => {
      let nextState = gameStateRef.current;

      for (let index = 0; index < stepCount; index += 1) {
        const updatedState = stepSnakeGame(nextState);
        if (updatedState === nextState) {
          break;
        }
        nextState = updatedState;
        if (nextState.mode === 'game-over' || nextState.mode === 'won') {
          break;
        }
      }

      if (nextState !== gameStateRef.current) {
        commitState(nextState);
      }
    },
    [commitState]
  );

  const advanceByMs = useCallback(
    (ms: number) => {
      const stepCount = Math.max(1, Math.round(ms / TICK_MS));
      runSteps(stepCount);
    },
    [runSteps]
  );

  const restartGame = useCallback(() => {
    commitState(createSnakeGame({ gridSize: GRID_SIZE }));
  }, [commitState]);

  const setDirection = useCallback(
    (direction: SnakeDirection) => {
      commitState(queueDirection(gameStateRef.current, direction));
    },
    [commitState]
  );

  const handlePrimaryAction = useCallback(() => {
    const current = gameStateRef.current;
    if (current.mode === 'ready') {
      commitState(startSnakeGame(current));
      return;
    }
    if (current.mode === 'running' || current.mode === 'paused') {
      commitState(toggleSnakePause(current));
    }
  }, [commitState]);

  const toggleFullscreen = useCallback(async () => {
    const canvasWrap = canvasWrapRef.current;
    if (!canvasWrap) {
      return;
    }

    if (!document.fullscreenElement) {
      await canvasWrap.requestFullscreen();
      return;
    }

    if (document.fullscreenElement === canvasWrap) {
      await document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    drawBoard(ctx, gameState);
  }, [gameState]);

  useEffect(() => {
    if (gameState.mode !== 'running') {
      return;
    }
    const timer = window.setInterval(() => runSteps(1), TICK_MS);
    return () => window.clearInterval(timer);
  }, [gameState.mode, runSteps]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mappedDirection = KEY_TO_DIRECTION[event.key];
      if (mappedDirection) {
        event.preventDefault();
        setDirection(mappedDirection);
        return;
      }

      if (event.key === 'p' || event.key === 'P' || event.key === ' ') {
        event.preventDefault();
        handlePrimaryAction();
        return;
      }

      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        restartGame();
        return;
      }

      if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        void toggleFullscreen();
        return;
      }

      if (event.key === 'Escape' && document.fullscreenElement) {
        event.preventDefault();
        void document.exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrimaryAction, restartGame, setDirection, toggleFullscreen]);

  useEffect(() => {
    window.render_game_to_text = () => serializeGameState(gameStateRef.current);
    window.advanceTime = (ms: number) => advanceByMs(ms);

    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [advanceByMs]);

  const statusText =
    gameState.mode === 'ready'
      ? 'Press Start or move to begin.'
      : gameState.mode === 'paused'
        ? 'Paused'
        : gameState.mode === 'game-over'
          ? 'Game over. Restart to play again.'
          : gameState.mode === 'won'
            ? 'You filled the board. You win.'
            : 'Running';

  return (
    <main className="min-h-screen bg-midnight pt-24 md:pt-28 pb-16">
      <section className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <span
              className="inline-block mb-3 px-3 py-1 rounded text-xs font-display uppercase tracking-widest"
              style={{ background: 'rgba(255, 107, 53, 0.2)', color: '#FF6B35' }}
            >
              Classic Snake
            </span>
            <h1 className="text-3xl md:text-4xl font-display text-white uppercase tracking-wide">
              Snake Arcade Route
            </h1>
            <p className="text-white/60 mt-3 max-w-2xl">
              Arrow keys or WASD to move. Press P or Space to pause. Press R to restart.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/arcade/games"
              className="btn-secondary px-5 py-3 rounded-lg text-sm font-semibold uppercase tracking-wide"
            >
              Back to Games
            </Link>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="btn-primary px-5 py-3 rounded-lg text-sm font-semibold uppercase tracking-wide"
              style={{ background: '#FDB913', color: '#0D0D12' }}
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (F)'}
            </button>
          </div>
        </div>

        <div className="glass-elevated rounded-2xl p-5">
          <div className="flex items-center justify-between text-white/80 text-sm mb-4">
            <span>Score: {gameState.score}</span>
            <span>{statusText}</span>
          </div>

          <div ref={canvasWrapRef} className="mx-auto w-full max-w-[420px]">
            <canvas
              ref={canvasRef}
              width={BOARD_SIZE}
              height={BOARD_SIZE}
              className="w-full h-auto rounded-lg border border-white/10"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="px-4 py-2 rounded-md text-sm font-semibold uppercase tracking-wide"
              style={{ background: '#FF6B35', color: '#0D0D12' }}
            >
              {gameState.mode === 'ready'
                ? 'Start'
                : gameState.mode === 'paused'
                  ? 'Resume'
                  : gameState.mode === 'running'
                    ? 'Pause'
                    : 'Start'}
            </button>
            <button
              type="button"
              onClick={restartGame}
              className="px-4 py-2 rounded-md text-sm font-semibold uppercase tracking-wide bg-white/10 text-white"
            >
              Restart (R)
            </button>
          </div>

          <div className="md:hidden mt-4">
            <div className="max-w-[220px] mx-auto grid grid-cols-3 gap-2">
              <span />
              <button
                type="button"
                onClick={() => setDirection('up')}
                className="px-3 py-3 rounded-md bg-white/10 text-white font-semibold"
                aria-label="Move up"
              >
                ↑
              </button>
              <span />
              <button
                type="button"
                onClick={() => setDirection('left')}
                className="px-3 py-3 rounded-md bg-white/10 text-white font-semibold"
                aria-label="Move left"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => setDirection('down')}
                className="px-3 py-3 rounded-md bg-white/10 text-white font-semibold"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => setDirection('right')}
                className="px-3 py-3 rounded-md bg-white/10 text-white font-semibold"
                aria-label="Move right"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
