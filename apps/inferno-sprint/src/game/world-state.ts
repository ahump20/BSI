import { abs, clamp } from '../math/math';
import type { Vec2, Vec3 } from '../math/vectors';
import { levers, souls, SOULS_COUNT } from './models';
import { gameTime, lerpDamp, setGameTime } from './game-time';
import { exit_player_first_person } from '../page';
import { LEVER_ID_BOAT0, LEVER_ID_BOAT1 } from './levers-ids';
import { devLeverNames } from '../dev-tools/dev-models';

export const LOCAL_STORAGE_SAVED_GAME_KEY = 'BSI-InfernoSprint-v1';

// Sprint mode constants
export const SPRINT_TIME_LIMIT = 90; // 90 seconds for a complete run
export let sprintStartTime = 0;
export let sprintElapsed = 0;
export let sprintComplete = false;
export let personalBest: number | null = null;

// Load personal best from localStorage
try {
  const saved = localStorage.getItem('BSI-InfernoSprint-PB');
  if (saved) personalBest = parseFloat(saved);
} catch {}

export const getSprintRemaining = (): number => {
  if (sprintComplete) return 0;
  return Math.max(0, SPRINT_TIME_LIMIT - sprintElapsed);
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const camera_rotation: Vec2 = { x: 0, y: 180 } as Vec2;

export const player_position_final: Vec3 = { x: 0, y: 0, z: 0 };

export let souls_collected_count: number;

export let game_completed: 0 | 1 | undefined;

export let player_last_pulled_lever = LEVER_ID_BOAT0;

export let firstBoatLerp: number;

export let secondBoatLerp: number;

let _messageEndTime = 0.1;

export const worldStateUpdate = () => {
  // Update sprint elapsed time
  if (!sprintComplete) {
    sprintElapsed = gameTime;
  }

  secondBoatLerp = lerpDamp(
    secondBoatLerp,
    levers[LEVER_ID_BOAT1]!.$lerpValue2,
    0.2 + 0.3 * abs(levers[LEVER_ID_BOAT1]!.$lerpValue2 * 2 - 1)
  );

  if (game_completed) {
    exit_player_first_person();
    firstBoatLerp = lerpDamp(firstBoatLerp, -9, 0.015);
  } else {
    firstBoatLerp = lerpDamp(firstBoatLerp, clamp(gameTime / 3), 1);
  }

  if (_messageEndTime && gameTime > _messageEndTime) {
    _messageEndTime = 0;
    h4.innerHTML = '';
  }
};

export const showMessage = (message: string, duration: number) => {
  if (_messageEndTime < Infinity) {
    _messageEndTime = gameTime + duration;
    h4.innerHTML = message;
  }
};

const updateCollectedSoulsCounter = () => {
  h3.innerHTML =
    'Souls: ' +
    [0, 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'][
      (souls_collected_count = souls.reduce((acc, v) => v.$value + acc, 0))
    ]! +
    ' / XIII';
};

export const loadGame = () => {
  let _savedLevers: number[] = [];
  let _savedSouls: number[] = [];
  try {
    const [savedLevers, savedSouls, savedLastPulledLever, savedSecondBoatLerp, savedGameTime] =
      JSON.parse(localStorage[LOCAL_STORAGE_SAVED_GAME_KEY]!);
    _savedLevers = savedLevers;
    _savedSouls = savedSouls;
    player_last_pulled_lever = savedLastPulledLever;
    secondBoatLerp = savedSecondBoatLerp;
    setGameTime(savedGameTime);
  } catch (e) {
    if (DEBUG) {
      console.log(e);
    }
  }

  levers.map(
    (lever, index) =>
      (lever.$lerpValue =
        lever.$lerpValue2 =
        lever.$value =
          index !== LEVER_ID_BOAT0 && _savedLevers[index]! ? 1 : 0)
  );
  souls.map((soul, index) => (soul.$value = _savedSouls[index]! ? 1 : 0));

  updateCollectedSoulsCounter();
  firstBoatLerp = souls_collected_count || player_last_pulled_lever !== LEVER_ID_BOAT0 ? 1 : 0;
};

export const resetGame = () => {
  localStorage[LOCAL_STORAGE_SAVED_GAME_KEY] = '';
  location.reload();
};

export const saveGame = () => {
  localStorage[LOCAL_STORAGE_SAVED_GAME_KEY] = JSON.stringify([
    levers.map((v) => v.$value),
    souls.map((v) => v.$value),
    player_last_pulled_lever,
    secondBoatLerp,
    gameTime,
  ]);
};

// BSI-themed collection messages
const SOUL_MESSAGES = [
  '',
  'Nice grab! Keep moving!',
  '2 down, stay focused!',
  'Blazing through! 3 collected!',
  'Quarter way there! Push it!',
  'Halfway point coming up!',
  "6 souls! You're on fire!",
  "Lucky 7! Don't slow down!",
  '8 souls! Sprint mode activated!',
  'Single digits left! Go go go!',
  '10 souls! Almost there!',
  '11! Just 2 more!',
  '12! One more soul!',
  'ALL 13 COLLECTED!<br>Race back to the boat!',
];

export const onSoulCollected = () => {
  showMessage(SOUL_MESSAGES[souls_collected_count] || 'Soul collected!', 2);
  updateCollectedSoulsCounter();
  saveGame();
};

export const onPlayerPullLever = (leverIndex: number) => {
  player_last_pulled_lever = leverIndex;
  if (DEBUG) {
    console.log(
      (devLeverNames[leverIndex] || 'LEVER') + ' ' + leverIndex + ' = ' + levers[leverIndex]?.$value
    );
  }

  showMessage('* click *', 1);
  saveGame();
};

export const onFirstBoatLeverPulled = () => {
  if (souls_collected_count < SOULS_COUNT) {
    showMessage('Collect all 13 souls first!', 3);
  } else if (!game_completed) {
    game_completed = 1;
    sprintComplete = true;

    // Calculate final time and check for personal best
    const finalTime = sprintElapsed;
    let pbMessage = '';

    if (personalBest === null || finalTime < personalBest) {
      personalBest = finalTime;
      try {
        localStorage.setItem('BSI-InfernoSprint-PB', finalTime.toString());
      } catch {}
      pbMessage = "<br><span style='color:#ffa500'>NEW PERSONAL BEST!</span>";
    }

    showMessage(`SPRINT COMPLETE!<br>Time: ${formatTime(finalTime)}${pbMessage}`, Infinity);

    // Submit score to leaderboard (async, non-blocking)
    submitScore(finalTime);
  }
};

// Submit score to backend leaderboard
async function submitScore(time: number): Promise<void> {
  try {
    // Generate run receipt for anti-cheat validation
    const runData = {
      time,
      souls: souls_collected_count,
      seed: localStorage.getItem('BSI-InfernoSprint-Seed') || 'default',
      timestamp: Date.now(),
    };

    await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(runData),
    });
  } catch (e) {
    // Silently fail - leaderboard is optional
    if (DEBUG) console.log('Score submit failed:', e);
  }
}
