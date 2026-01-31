'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  calculateWinProbability,
  type Team,
  type FootballState,
  type BaseballState,
} from '@/lib/prediction/client-probability';

export type Sport = 'cfb' | 'nfl' | 'mlb' | 'cbb';

export interface GameState {
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  timeRemaining?: number;
  possession?: 'home' | 'away';
  down?: number;
  distance?: number;
  fieldPosition?: number;
  inning?: number;
  inningHalf?: 'top' | 'bottom';
  outs?: number;
  runners?: string;
}

export interface ProbabilityResult {
  homeWinProbability: number;
  factors: {
    scoreImpact: number;
    timeRemaining?: number;
    fieldPosition?: number;
    runExpectancy?: number;
  };
}

interface ProbabilityCalculatorProps {
  onCalculate: (result: ProbabilityResult) => void;
  onGameStateChange: (state: GameState) => void;
}

interface APITeam {
  id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  logo?: string;
  record?: string;
  rating?: number;
  conference?: string;
  ranking?: number;
}

interface TeamsAPIResponse {
  teams: APITeam[];
  sport: string;
  cached: boolean;
}

const FALLBACK_TEAMS: Record<Sport, Team[]> = {
  cfb: [
    { id: '1', name: 'Georgia', rating: 94 },
    { id: '2', name: 'Ohio State', rating: 91 },
    { id: '3', name: 'Texas', rating: 90 },
    { id: '4', name: 'Oregon', rating: 89 },
  ],
  nfl: [
    { id: '1', name: 'Kansas City Chiefs', rating: 93 },
    { id: '2', name: 'Detroit Lions', rating: 92 },
    { id: '3', name: 'Philadelphia Eagles', rating: 91 },
    { id: '4', name: 'Buffalo Bills', rating: 90 },
  ],
  mlb: [
    { id: '1', name: 'Los Angeles Dodgers', rating: 92 },
    { id: '2', name: 'New York Yankees', rating: 90 },
    { id: '3', name: 'Philadelphia Phillies', rating: 89 },
    { id: '4', name: 'Cleveland Guardians', rating: 88 },
  ],
  cbb: [
    { id: '1', name: 'Tennessee', rating: 91 },
    { id: '2', name: 'Texas A&M', rating: 90 },
    { id: '3', name: 'LSU', rating: 89 },
    { id: '4', name: 'Arkansas', rating: 88 },
  ],
};

const sportConfig: Record<Sport, { label: string; icon: string; description: string }> = {
  cfb: {
    label: 'College Football',
    icon: '🏈',
    description: 'FBS teams with adjusted power ratings',
  },
  nfl: { label: 'NFL', icon: '🏈', description: 'All 32 teams with current season data' },
  mlb: { label: 'MLB', icon: '⚾', description: '30 teams with run expectancy models' },
  cbb: {
    label: 'College Baseball',
    icon: '⚾',
    description: 'D1 programs with conference metrics',
  },
};

async function fetchTeams(sport: Sport): Promise<Team[]> {
  try {
    const response = await fetch(`/api/v1/teams/${sport}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: TeamsAPIResponse = await response.json();
    return (data.teams || []).map((t: APITeam) => ({
      id: t.id,
      name: t.displayName || t.name,
      rating: t.rating ?? 70,
      record: t.record,
      ranking: t.ranking,
    }));
  } catch {
    return FALLBACK_TEAMS[sport];
  }
}

type Step = 1 | 2 | 3;

export function ProbabilityCalculator({
  onCalculate,
  onGameStateChange,
}: ProbabilityCalculatorProps) {
  const [step, setStep] = useState<Step>(1);
  const [sport, setSport] = useState<Sport | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Team search
  const [homeSearch, setHomeSearch] = useState('');
  const [awaySearch, setAwaySearch] = useState('');
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);

  // Game state
  const [homeScore, setHomeScore] = useState(14);
  const [awayScore, setAwayScore] = useState(10);
  const [timeRemaining, setTimeRemaining] = useState(22.5);
  const [possession, setPossession] = useState<'home' | 'away'>('home');
  const [down, setDown] = useState(1);
  const [distance, setDistance] = useState(10);
  const [fieldPosition, setFieldPosition] = useState(45);
  const [inning, setInning] = useState(7);
  const [inningHalf, setInningHalf] = useState<'top' | 'bottom'>('bottom');
  const [outs, setOuts] = useState(0);
  const [runners, setRunners] = useState('000');

  const isBaseball = sport === 'mlb' || sport === 'cbb';

  // Fetch teams when sport is selected
  useEffect(() => {
    if (!sport) return;
    let cancelled = false;
    setIsLoading(true);
    fetchTeams(sport).then((fetched) => {
      if (!cancelled && fetched.length > 0) {
        setTeams(fetched);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [sport]);

  // Filtered team lists for search
  const filteredHomeTeams = useMemo(() => {
    if (!homeSearch.trim()) return teams.slice(0, 20);
    const q = homeSearch.toLowerCase();
    return teams.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 20);
  }, [teams, homeSearch]);

  const filteredAwayTeams = useMemo(() => {
    if (!awaySearch.trim()) return teams.slice(0, 20);
    const q = awaySearch.toLowerCase();
    return teams.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 20);
  }, [teams, awaySearch]);

  const formatTime = (mins: number): string => {
    const quarter = Math.ceil((60 - mins) / 15);
    const qMins = mins % 15 || 15;
    const display = quarter > 4 ? 'OT' : `Q${quarter}`;
    return `${Math.floor(qMins)}:${String(Math.round((qMins % 1) * 60)).padStart(2, '0')} ${display}`;
  };

  const formatFieldPosition = (yards: number): string => {
    if (yards <= 10) return `${yards} (Red Zone)`;
    if (yards >= 45 && yards <= 55) return 'Midfield';
    return `${yards} yard line`;
  };

  const handleCalculate = useCallback(() => {
    if (!sport || !homeTeam || !awayTeam) return;

    let gameState: FootballState | BaseballState | undefined;
    if (isBaseball) {
      gameState = { inning, inningHalf, outs, runners } as BaseballState;
    } else {
      gameState = { timeRemaining, possession, down, distance, fieldPosition } as FootballState;
    }

    const result = calculateWinProbability({
      sport,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      gameState,
    });

    const output: ProbabilityResult = {
      homeWinProbability: result.homeWinProbability,
      factors: {
        scoreImpact: result.factors.scoreDiff,
        ...(isBaseball ? { runExpectancy: 0.48 } : { timeRemaining, fieldPosition }),
      },
    };
    onCalculate(output);

    const stateOutput: GameState = {
      sport,
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      homeScore,
      awayScore,
      ...(isBaseball
        ? { inning, inningHalf, outs, runners }
        : { timeRemaining, possession, down, distance, fieldPosition }),
    };
    onGameStateChange(stateOutput);
  }, [
    sport,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    isBaseball,
    inning,
    inningHalf,
    outs,
    runners,
    timeRemaining,
    possession,
    down,
    distance,
    fieldPosition,
    onCalculate,
    onGameStateChange,
  ]);

  // Step navigation
  const canAdvanceToStep3 = homeTeam !== null && awayTeam !== null && homeTeam.id !== awayTeam.id;

  const selectSport = (s: Sport) => {
    setSport(s);
    setHomeTeam(null);
    setAwayTeam(null);
    setHomeSearch('');
    setAwaySearch('');
    // Reset scores to sport-appropriate defaults
    if (s === 'mlb' || s === 'cbb') {
      setHomeScore(4);
      setAwayScore(3);
    } else {
      setHomeScore(14);
      setAwayScore(10);
    }
    setStep(2);
  };

  const stepLabels = ['Sport', 'Teams', 'Situation'];

  return (
    <Card variant="default" padding="lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-burnt-orange"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Win Probability Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {stepLabels.map((label, i) => {
            const stepNum = (i + 1) as Step;
            const isActive = step === stepNum;
            const isComplete = step > stepNum;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={`w-8 h-0.5 ${isComplete ? 'bg-burnt-orange' : 'bg-bg-tertiary'}`}
                  />
                )}
                <button
                  onClick={() => {
                    if (isComplete) setStep(stepNum);
                  }}
                  disabled={!isComplete && !isActive}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-burnt-orange text-white'
                      : isComplete
                        ? 'bg-burnt-orange/20 text-burnt-orange cursor-pointer hover:bg-burnt-orange/30'
                        : 'bg-bg-tertiary text-text-tertiary'
                  }`}
                >
                  <span className="w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold bg-white/20">
                    {isComplete ? '✓' : stepNum}
                  </span>
                  {label}
                </button>
              </div>
            );
          })}
        </div>

        {/* Step 1: Pick Sport */}
        {step === 1 && (
          <div>
            <p className="text-text-secondary text-sm mb-4">Which sport are you watching?</p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(sportConfig) as [Sport, typeof sportConfig.cfb][]).map(
                ([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => selectSport(key)}
                    className={`p-4 rounded-xl border text-left transition-all hover:border-burnt-orange/50 hover:bg-bg-secondary ${
                      sport === key
                        ? 'border-burnt-orange bg-burnt-orange/10'
                        : 'border-border-subtle bg-bg-tertiary'
                    }`}
                  >
                    <span className="text-2xl">{cfg.icon}</span>
                    <p className="text-white font-semibold text-sm mt-2">{cfg.label}</p>
                    <p className="text-text-tertiary text-xs mt-1">{cfg.description}</p>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Step 2: Pick Teams */}
        {step === 2 && sport && (
          <div>
            <p className="text-text-secondary text-sm mb-4">Pick the two teams. Type to search.</p>

            {isLoading ? (
              <div className="text-center py-8 text-text-tertiary">Loading teams...</div>
            ) : (
              <div className="space-y-4">
                {/* Home team search */}
                <div>
                  <label className="block text-xs font-medium text-text-tertiary mb-2">
                    Home Team
                  </label>
                  {homeTeam ? (
                    <div className="flex items-center justify-between px-3 py-2.5 bg-burnt-orange/10 border border-burnt-orange/30 rounded-lg">
                      <span className="text-white text-sm font-medium">
                        {homeTeam.ranking ? `#${homeTeam.ranking} ` : ''}
                        {homeTeam.name}
                        {homeTeam.record ? ` (${homeTeam.record})` : ''}
                      </span>
                      <button
                        onClick={() => {
                          setHomeTeam(null);
                          setHomeSearch('');
                        }}
                        className="text-text-tertiary hover:text-white text-xs"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={homeSearch}
                        onChange={(e) => setHomeSearch(e.target.value)}
                        placeholder="Search teams..."
                        className="w-full px-3 py-2.5 bg-bg-secondary border border-border-subtle rounded-lg text-white text-sm focus:outline-none focus:border-burnt-orange placeholder:text-text-tertiary"
                        autoFocus
                      />
                      <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-border-subtle bg-bg-secondary">
                        {filteredHomeTeams.map((team) => (
                          <button
                            key={team.id}
                            onClick={() => {
                              setHomeTeam(team);
                              setHomeSearch('');
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-white transition-colors"
                          >
                            {team.ranking ? (
                              <span className="text-gold">#{team.ranking} </span>
                            ) : null}
                            {team.name}
                            {team.record ? (
                              <span className="text-text-tertiary ml-1">({team.record})</span>
                            ) : null}
                          </button>
                        ))}
                        {filteredHomeTeams.length === 0 && (
                          <p className="px-3 py-2 text-xs text-text-tertiary">No teams found</p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Away team search */}
                <div>
                  <label className="block text-xs font-medium text-text-tertiary mb-2">
                    Away Team
                  </label>
                  {awayTeam ? (
                    <div className="flex items-center justify-between px-3 py-2.5 bg-gold/10 border border-gold/30 rounded-lg">
                      <span className="text-white text-sm font-medium">
                        {awayTeam.ranking ? `#${awayTeam.ranking} ` : ''}
                        {awayTeam.name}
                        {awayTeam.record ? ` (${awayTeam.record})` : ''}
                      </span>
                      <button
                        onClick={() => {
                          setAwayTeam(null);
                          setAwaySearch('');
                        }}
                        className="text-text-tertiary hover:text-white text-xs"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={awaySearch}
                        onChange={(e) => setAwaySearch(e.target.value)}
                        placeholder="Search teams..."
                        className="w-full px-3 py-2.5 bg-bg-secondary border border-border-subtle rounded-lg text-white text-sm focus:outline-none focus:border-burnt-orange placeholder:text-text-tertiary"
                      />
                      <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-border-subtle bg-bg-secondary">
                        {filteredAwayTeams.map((team) => (
                          <button
                            key={team.id}
                            onClick={() => {
                              setAwayTeam(team);
                              setAwaySearch('');
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-white transition-colors"
                          >
                            {team.ranking ? (
                              <span className="text-gold">#{team.ranking} </span>
                            ) : null}
                            {team.name}
                            {team.record ? (
                              <span className="text-text-tertiary ml-1">({team.record})</span>
                            ) : null}
                          </button>
                        ))}
                        {filteredAwayTeams.length === 0 && (
                          <p className="px-3 py-2 text-xs text-text-tertiary">No teams found</p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {homeTeam && awayTeam && homeTeam.id === awayTeam.id && (
                  <p className="text-error text-xs">Pick two different teams.</p>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 border border-border-subtle rounded-lg text-text-secondary text-sm hover:bg-bg-secondary transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canAdvanceToStep3}
                className="flex-1 px-4 py-2.5 bg-burnt-orange text-white rounded-lg text-sm font-semibold hover:bg-burnt-orange/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Set Up Situation
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Game Situation */}
        {step === 3 && sport && homeTeam && awayTeam && (
          <div>
            <div className="flex items-center gap-2 mb-4 text-sm">
              <span className="text-burnt-orange font-semibold">{homeTeam.name}</span>
              <span className="text-text-tertiary">vs</span>
              <span className="text-gold font-semibold">{awayTeam.name}</span>
              <span className="text-text-tertiary">({sportConfig[sport].label})</span>
            </div>

            {/* Current Score */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-text-tertiary mb-2">
                Current Score
              </label>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-[10px] text-text-tertiary mb-1">{homeTeam.name}</p>
                  <input
                    type="number"
                    value={homeScore}
                    onChange={(e) => setHomeScore(Number(e.target.value))}
                    min={0}
                    className="w-20 px-3 py-2.5 bg-bg-secondary border border-border-subtle rounded-lg text-white text-lg font-semibold text-center focus:outline-none focus:border-burnt-orange"
                  />
                </div>
                <span className="text-text-tertiary mt-4">-</span>
                <div className="text-center">
                  <p className="text-[10px] text-text-tertiary mb-1">{awayTeam.name}</p>
                  <input
                    type="number"
                    value={awayScore}
                    onChange={(e) => setAwayScore(Number(e.target.value))}
                    min={0}
                    className="w-20 px-3 py-2.5 bg-bg-secondary border border-border-subtle rounded-lg text-white text-lg font-semibold text-center focus:outline-none focus:border-burnt-orange"
                  />
                </div>
              </div>
            </div>

            {/* Football-specific */}
            {!isBaseball && (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-medium text-text-tertiary">Time Remaining</label>
                    <span className="text-sm font-semibold text-gold">
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    step={0.5}
                    value={timeRemaining}
                    onChange={(e) => setTimeRemaining(Number(e.target.value))}
                    className="w-full h-1.5 bg-bg-secondary rounded-lg appearance-none cursor-pointer accent-burnt-orange"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-tertiary mb-2">
                    Possession
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['home', 'away'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPossession(p)}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          possession === p
                            ? 'bg-burnt-orange text-white'
                            : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                        }`}
                      >
                        {p === 'home' ? homeTeam.name : awayTeam.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-tertiary mb-2">
                      Down
                    </label>
                    <select
                      value={down}
                      onChange={(e) => setDown(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-bg-secondary border border-border-subtle rounded-lg text-white text-sm focus:outline-none focus:border-burnt-orange"
                    >
                      <option value={1}>1st Down</option>
                      <option value={2}>2nd Down</option>
                      <option value={3}>3rd Down</option>
                      <option value={4}>4th Down</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-tertiary mb-2">
                      Distance
                    </label>
                    <input
                      type="number"
                      value={distance}
                      onChange={(e) => setDistance(Number(e.target.value))}
                      min={1}
                      max={99}
                      className="w-full px-3 py-2.5 bg-bg-secondary border border-border-subtle rounded-lg text-white text-sm focus:outline-none focus:border-burnt-orange"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-medium text-text-tertiary">
                      Field Position (yards to goal)
                    </label>
                    <span className="text-sm font-semibold text-gold">
                      {formatFieldPosition(fieldPosition)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={99}
                    value={fieldPosition}
                    onChange={(e) => setFieldPosition(Number(e.target.value))}
                    className="w-full h-1.5 bg-bg-secondary rounded-lg appearance-none cursor-pointer accent-burnt-orange"
                  />
                </div>
              </div>
            )}

            {/* Baseball-specific */}
            {isBaseball && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-tertiary mb-2">
                      Inning
                    </label>
                    <select
                      value={inning}
                      onChange={(e) => setInning(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-bg-secondary border border-border-subtle rounded-lg text-white text-sm focus:outline-none focus:border-burnt-orange"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                        <option key={i} value={i}>
                          {i === 1 ? '1st' : i === 2 ? '2nd' : i === 3 ? '3rd' : `${i}th`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-tertiary mb-2">
                      Half
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['top', 'bottom'] as const).map((h) => (
                        <button
                          key={h}
                          onClick={() => setInningHalf(h)}
                          className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            inningHalf === h
                              ? 'bg-burnt-orange text-white'
                              : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                          }`}
                        >
                          {h === 'top' ? 'Top' : 'Bot'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-tertiary mb-2">
                      Outs
                    </label>
                    <div className="flex gap-2">
                      {[0, 1, 2].map((o) => (
                        <button
                          key={o}
                          onClick={() => setOuts(o)}
                          className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            outs === o
                              ? 'bg-burnt-orange text-white'
                              : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                          }`}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-tertiary mb-2">
                      Runners
                    </label>
                    <select
                      value={runners}
                      onChange={(e) => setRunners(e.target.value)}
                      className="w-full px-3 py-2.5 bg-bg-secondary border border-border-subtle rounded-lg text-white text-sm focus:outline-none focus:border-burnt-orange"
                    >
                      <option value="000">Bases Empty</option>
                      <option value="100">Runner on 1st</option>
                      <option value="010">Runner on 2nd</option>
                      <option value="001">Runner on 3rd</option>
                      <option value="110">1st &amp; 2nd</option>
                      <option value="101">1st &amp; 3rd</option>
                      <option value="011">2nd &amp; 3rd</option>
                      <option value="111">Bases Loaded</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2.5 border border-border-subtle rounded-lg text-text-secondary text-sm hover:bg-bg-secondary transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCalculate}
                className="flex-1 px-4 py-2.5 bg-burnt-orange text-white rounded-lg text-sm font-semibold hover:bg-burnt-orange/90 transition-colors"
              >
                Calculate Win Probability
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
