'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Sport = 'NFL' | 'NBA' | 'MLB' | 'NCAAFB' | 'CBB';
type Priority = 'high' | 'med' | 'low';
type GameTier = 'hero' | 'std' | 'marquee';
type GameStatus = 'Final' | 'Scheduled';

interface IntelItem {
  type: string;
  text: string;
  pri: Priority;
  ts: string;
}

interface QuarterScore {
  q: string;
  sea: number;
  ne: number;
}

interface RadarPoint {
  m: string;
  a: number;
  b: number;
}

interface GameStats {
  rush_sea: number;
  rush_ne: number;
  top_sea: string;
  top_ne: string;
  pen_sea: number;
  pen_ne: number;
}

interface Game {
  id: string;
  sport: Sport;
  tier: GameTier;
  label?: string;
  status: GameStatus;
  home: string;
  away: string;
  hs: number;
  as: number;
  hr: string;
  ar: string;
  hf: string;
  af: string;
  venue: string;
  time: string;
  wp?: number[];
  awp?: number[];
  qtr?: QuarterScore[];
  headline: string;
  intel: IntelItem[];
  stats?: GameStats;
  tag?: 'TONIGHT' | 'MARQUEE';
  fav?: string;
  pct?: number;
  radar?: RadarPoint[];
}

interface CrossIntelItem extends IntelItem {
  sport: Sport;
}

interface AllIntelItem extends IntelItem {
  sport: Sport;
  ctx?: string;
}

interface TooltipEntry {
  color?: string;
  name?: string;
  value?: number | string;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

const TOKENS = {
  burnt: '#BF5700', // token: --bsi-primary
  soil: '#8B4513', // token: --bsi-texas-soil
  charcoal: '#1A1A1A', // token: --bsi-charcoal
  midnight: '#0D0D0D', // token: --bsi-midnight
  ember: '#FF6B35', // token: --bsi-accent
  bone: '#F5F0EB',
  ash: '#2A2A2A',
  slate: '#3A3A3A',
  dim: '#666',
  muted: '#888',
  light: '#bbb',
  white: '#F0EDE8',
  green: '#34D399',
  red: '#EF4444',
  amber: '#F59E0B',
  blue: '#3B82F6',
  purple: '#A855F7',
  cyan: '#06B6D4',
  nfl: '#34D399',
  nba: '#3B82F6',
  mlb: '#BF5700', // token: --bsi-primary
  ncaafb: '#F59E0B',
  cbb: '#A855F7',
  card: '#161616',
  cardHover: '#1C1C1C',
  cardBorder: '#262626',
} as const;

const FONTS = {
  head: "'Oswald', sans-serif",
  body: "'Cormorant Garamond', serif",
  mono: "'JetBrains Mono', monospace",
} as const;

const getSportColor = (sport: Sport): string => {
  const map: Record<Sport, string> = {
    NFL: TOKENS.nfl,
    NBA: TOKENS.nba,
    MLB: TOKENS.mlb,
    NCAAFB: TOKENS.ncaafb,
    CBB: TOKENS.cbb,
  };
  return map[sport] ?? TOKENS.burnt;
};

const getPriorityColor = (priority: Priority): string => {
  if (priority === 'high') return TOKENS.ember;
  if (priority === 'med') return TOKENS.amber;
  return TOKENS.dim;
};

const GAMES: Game[] = [
  {
    id: 'sb',
    sport: 'NFL',
    tier: 'hero',
    label: 'SUPER BOWL LX',
    status: 'Final',
    home: 'NE',
    away: 'SEA',
    hs: 13,
    as: 29,
    hr: '14-3',
    ar: '14-3',
    hf: 'New England Patriots',
    af: 'Seattle Seahawks',
    venue: "Levi's Stadium",
    time: 'Final',
    wp: [52, 55, 48, 42, 38, 30, 24, 18, 14, 10],
    awp: [48, 45, 52, 58, 62, 70, 76, 82, 86, 90],
    qtr: [
      { q: 'Q1', sea: 7, ne: 10 },
      { q: 'Q2', sea: 0, ne: 3 },
      { q: 'Q3', sea: 15, ne: 0 },
      { q: 'Q4', sea: 7, ne: 0 },
    ],
    headline: 'Seattle dominated the second half, outscoring NE 22-3 after the break.',
    intel: [
      {
        type: 'RECAP',
        text: 'Seattle\'s D-line held NE to 47 rush yards - lowest since SB XLVIII.',
        pri: 'high',
        ts: '2h ago',
      },
      {
        type: 'QB STAT',
        text: 'Darnold: 22/31, 283 yds, 3 TD, 0 INT. Passer rating 132.6 - 3rd highest in SB history.',
        pri: 'high',
        ts: '4h ago',
      },
      {
        type: 'TURNING PT',
        text: 'SEA scored 15 unanswered in Q3 off 2 NE turnovers. Game effectively over by 4th.',
        pri: 'med',
        ts: '3h ago',
      },
    ],
    stats: {
      rush_sea: 142,
      rush_ne: 47,
      top_sea: '34:12',
      top_ne: '25:48',
      pen_sea: 4,
      pen_ne: 8,
    },
  },
  {
    id: 'nba1',
    sport: 'NBA',
    tier: 'std',
    status: 'Scheduled',
    home: 'NY',
    away: 'IND',
    hs: 0,
    as: 0,
    hr: '34-19',
    ar: '13-40',
    hf: 'New York Knicks',
    af: 'Indiana Pacers',
    venue: 'Madison Square Garden',
    time: '7:30 PM',
    tag: 'TONIGHT',
    fav: 'NY',
    pct: 81,
    headline: 'Knicks heavy favorites. Indiana worst road team in the East.',
    intel: [
      {
        type: 'MODEL',
        text: '81% NYK. IND ranks 29th in road efficiency, 26th in defensive rating.',
        pri: 'high',
        ts: '1h ago',
      },
      {
        type: 'TREND',
        text: 'Brunson averaging 28.1 PPG at MSG. NY 8-2 last 10 home games.',
        pri: 'med',
        ts: '3h ago',
      },
    ],
    radar: [
      { m: 'OFF', a: 88, b: 62 },
      { m: 'DEF', a: 82, b: 58 },
      { m: 'PACE', a: 75, b: 80 },
      { m: '3PT', a: 84, b: 66 },
      { m: 'REB', a: 86, b: 70 },
      { m: 'AST/TO', a: 90, b: 55 },
    ],
  },
  {
    id: 'nba2',
    sport: 'NBA',
    tier: 'std',
    status: 'Scheduled',
    home: 'HOU',
    away: 'LAC',
    hs: 0,
    as: 0,
    hr: '32-19',
    ar: '25-27',
    hf: 'Houston Rockets',
    af: 'LA Clippers',
    venue: 'Toyota Center',
    time: '8:00 PM',
    tag: 'TONIGHT',
    fav: 'HOU',
    pct: 72,
    headline: "Rockets' defense suffocating at home. Clippers fade on back-to-backs.",
    intel: [
      {
        type: 'EDGE',
        text: 'Houston +6.2 home net rating - 4th best in NBA. 3rd in defensive rating.',
        pri: 'med',
        ts: '2h ago',
      },
      {
        type: 'FATIGUE',
        text: 'LAC on back-to-back. Teams in this spot are 38% ATS this season.',
        pri: 'med',
        ts: '4h ago',
      },
    ],
  },
  {
    id: 'nba3',
    sport: 'NBA',
    tier: 'std',
    status: 'Scheduled',
    home: 'PHX',
    away: 'DAL',
    hs: 0,
    as: 0,
    hr: '31-22',
    ar: '19-33',
    hf: 'Phoenix Suns',
    af: 'Dallas Mavericks',
    venue: 'Footprint Center',
    time: '9:00 PM',
    tag: 'TONIGHT',
    fav: 'PHX',
    pct: 76,
    headline: 'Luka questionable. Dallas 4-11 without him this year.',
    intel: [
      {
        type: 'INJURY',
        text: 'Doncic (knee) questionable. DAL 4-11 without him, -8.3 net rating.',
        pri: 'high',
        ts: '1h ago',
      },
      {
        type: 'STREAK',
        text: 'Suns 8-2 last 10. Booker/Beal combining for 52 PPG in that stretch.',
        pri: 'med',
        ts: '3h ago',
      },
    ],
  },
  {
    id: 'nba4',
    sport: 'NBA',
    tier: 'marquee',
    status: 'Scheduled',
    home: 'LAL',
    away: 'SA',
    hs: 0,
    as: 0,
    hr: '32-20',
    ar: '36-16',
    hf: 'Los Angeles Lakers',
    af: 'San Antonio Spurs',
    venue: 'Crypto.com Arena',
    time: '10:30 PM',
    tag: 'MARQUEE',
    fav: 'SA',
    pct: 52,
    headline: 'Tightest model line tonight. Wembanyama on MVP trajectory.',
    intel: [
      {
        type: 'MVP WATCH',
        text: 'Wembanyama: 28.4/12.1/4.2 last 10 games. Leading MVP ladder.',
        pri: 'high',
        ts: '3h ago',
      },
      {
        type: 'MODEL',
        text: '52-48 Spurs - closest line tonight. Both teams top 5 in West.',
        pri: 'high',
        ts: '2h ago',
      },
      {
        type: 'MATCHUP',
        text: 'AD vs Wemby is the best individual matchup in the league right now.',
        pri: 'med',
        ts: '5h ago',
      },
    ],
    radar: [
      { m: 'OFF', a: 92, b: 85 },
      { m: 'DEF', a: 88, b: 80 },
      { m: 'PACE', a: 78, b: 82 },
      { m: '3PT', a: 85, b: 76 },
      { m: 'REB', a: 90, b: 84 },
      { m: 'AST/TO', a: 88, b: 70 },
    ],
  },
];

const CROSS_INTEL: CrossIntelItem[] = [
  {
    sport: 'MLB',
    type: 'OFFSEASON',
    text: 'Texas finalizing rotation: deGrom, Gray, Eovaldi, Ragans, Leiter. Spring training Feb 14.',
    pri: 'med',
    ts: '5h ago',
  },
  {
    sport: 'CBB',
    type: 'PRESEASON',
    text: 'D1Baseball top 5: Texas, LSU, Florida, Tennessee, Virginia. Season opens Feb 14.',
    pri: 'med',
    ts: '6h ago',
  },
  {
    sport: 'NCAAFB',
    type: 'RECRUITING',
    text: 'Early signing wrap: Alabama, Ohio State, Georgia lead composite. Portal window closes Feb 15.',
    pri: 'low',
    ts: '8h ago',
  },
];

const STANDINGS: Record<'west' | 'east', Array<{ tm: string; w: number; l: number }>> = {
  west: [
    { tm: 'SA', w: 36, l: 16 },
    { tm: 'OKC', w: 35, l: 17 },
    { tm: 'HOU', w: 32, l: 19 },
    { tm: 'LAL', w: 32, l: 20 },
    { tm: 'PHX', w: 31, l: 22 },
  ],
  east: [
    { tm: 'CLE', w: 39, l: 12 },
    { tm: 'BOS', w: 36, l: 16 },
    { tm: 'NY', w: 34, l: 19 },
    { tm: 'MIL', w: 30, l: 22 },
    { tm: 'ORL', w: 29, l: 24 },
  ],
};

const NET_RTG = [
  { t: 'SA', v: 12.1 },
  { t: 'OKC', v: 11.4 },
  { t: 'BOS', v: 10.2 },
  { t: 'CLE', v: 9.2 },
  { t: 'HOU', v: 8.2 },
  { t: 'NY', v: 7.0 },
];

const MODEL_ACC = [
  { w: 'W1', a: 68 },
  { w: 'W2', a: 71 },
  { w: 'W3', a: 66 },
  { w: 'W4', a: 74 },
  { w: 'W5', a: 72 },
  { w: 'W6', a: 78 },
  { w: 'W7', a: 75 },
  { w: 'W8', a: 73 },
  { w: 'W9', a: 79 },
  { w: 'W10', a: 77 },
  { w: 'W11', a: 81 },
  { w: 'W12', a: 76 },
];

const ChartTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: TOKENS.midnight,
        border: `1px solid ${TOKENS.slate}`,
        borderRadius: 4,
        padding: '5px 8px',
        fontFamily: FONTS.mono,
        fontSize: 9,
      }}
    >
      <div style={{ color: TOKENS.muted, marginBottom: 1 }}>{label}</div>
      {payload.map((entry, idx) => (
        <div key={`${entry.name ?? 'entry'}-${idx}`} style={{ color: entry.color ?? TOKENS.burnt }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
        </div>
      ))}
    </div>
  );
};

const Badge = ({
  children,
  color = TOKENS.burnt,
  ghost,
  small,
}: {
  children: ReactNode;
  color?: string;
  ghost?: boolean;
  small?: boolean;
}) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: small ? '1px 4px' : '2px 7px',
        fontSize: small ? 7 : 9,
        fontFamily: FONTS.mono,
        fontWeight: 700,
        letterSpacing: '0.08em',
        borderRadius: 3,
        background: ghost ? 'transparent' : `${color}15`,
        color,
        border: ghost ? `1px solid ${color}30` : 'none',
        textTransform: 'uppercase',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
};

const WinGradient = ({
  pct,
  fav,
  opp,
  color,
}: {
  pct: number;
  fav: string;
  opp: string;
  color: string;
}) => (
  <div style={{ position: 'relative', height: 20, borderRadius: 4, overflow: 'hidden', background: TOKENS.ash }}>
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}55, ${color}30)`,
        transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
      }}
    />
    <div
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        padding: '0 8px',
      }}
    >
      <span style={{ fontFamily: FONTS.mono, fontSize: 9, fontWeight: 700, color }}>
        {fav} {pct}%
      </span>
      <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: TOKENS.dim }}>
        {opp} {100 - pct}%
      </span>
    </div>
  </div>
);

const getOpponent = (game: Game): string => {
  if (!game.fav) return '';
  return game.fav === game.home ? game.away : game.home;
};

export function WC3Dashboard() {
  const [now, setNow] = useState<Date>(new Date());
  const [sport, setSport] = useState<'ALL' | Sport>('ALL');
  const [search, setSearch] = useState('');
  const [hovered, setHovered] = useState<string | null>(null);
  const [detail, setDetail] = useState<Game | null>(null);
  const [detailAnim, setDetailAnim] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.href =
      'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const timer = window.setInterval(() => setNow(new Date()), 1000);

    return () => {
      window.clearInterval(timer);
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const openDetail = useCallback((game: Game) => {
    setDetail(game);
    window.setTimeout(() => setDetailAnim(true), 10);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailAnim(false);
    window.setTimeout(() => setDetail(null), 300);
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && detail) {
        closeDetail();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [detail, closeDetail]);

  const ts = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Chicago',
  });

  const ds = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Chicago',
  });

  const accuracyPct = useMemo(() => {
    const total = MODEL_ACC.reduce((acc, point) => acc + point.a, 0);
    return `${(total / MODEL_ACC.length).toFixed(1)}%`;
  }, []);

  const sports = useMemo<Array<'ALL' | Sport>>(() => ['ALL', 'NBA', 'NFL', 'MLB', 'NCAAFB', 'CBB'], []);

  const { games, cross } = useMemo(() => {
    let filteredGames = sport === 'ALL' ? GAMES : GAMES.filter((game) => game.sport === sport);
    let filteredCross = sport === 'ALL' ? CROSS_INTEL : CROSS_INTEL.filter((item) => item.sport === sport);

    if (search.trim()) {
      const query = search.toLowerCase();

      filteredGames = filteredGames.filter((game) =>
        [game.home, game.away, game.hf, game.af, game.sport, game.label ?? ''].some((field) =>
          field.toLowerCase().includes(query),
        ),
      );

      filteredCross = filteredCross.filter(
        (item) => item.text.toLowerCase().includes(query) || item.sport.toLowerCase().includes(query),
      );
    }

    return { games: filteredGames, cross: filteredCross };
  }, [sport, search]);

  const hero = useMemo(() => games.find((game) => game.tier === 'hero'), [games]);
  const marquee = useMemo(() => games.find((game) => game.tier === 'marquee'), [games]);
  const standard = useMemo(() => games.filter((game) => game.tier === 'std'), [games]);

  const allIntel = useMemo<AllIntelItem[]>(() => {
    return [
      ...GAMES.flatMap((game) =>
        game.intel.map((item) => ({
          ...item,
          sport: game.sport,
          ctx: `${game.away}@${game.home}`,
        })),
      ),
      ...CROSS_INTEL,
    ].filter((item) => item.pri === 'high');
  }, []);

  const HoverPreview = ({ game, style }: { game: Game; style?: CSSProperties }) => {
    const clr = getSportColor(game.sport);

    return (
      <div
        style={{
          position: 'absolute',
          zIndex: 100,
          width: 320,
          background: TOKENS.midnight,
          border: `1px solid ${clr}30`,
          borderRadius: 10,
          boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px ${clr}15`,
          padding: 16,
          pointerEvents: 'none',
          animation: 'fadeScale 0.15s ease-out',
          ...style,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 14,
            color: TOKENS.white,
            lineHeight: 1.4,
            marginBottom: 10,
            fontStyle: 'italic',
          }}
        >
          {game.headline}
        </div>

        {game.fav && typeof game.pct === 'number' && (
          <div style={{ marginBottom: 10 }}>
            <WinGradient pct={game.pct} fav={game.fav} opp={getOpponent(game)} color={clr} />
          </div>
        )}

        {game.intel.slice(0, 2).map((item, idx) => (
          <div key={`${item.type}-${idx}`} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'flex-start' }}>
            <Badge color={getPriorityColor(item.pri)} small>
              {item.type}
            </Badge>
            <span style={{ fontFamily: FONTS.body, fontSize: 12, color: TOKENS.light, lineHeight: 1.35, flex: 1 }}>
              {item.text}
            </span>
          </div>
        ))}

        {game.radar && (
          <div style={{ marginTop: 6 }}>
            <ResponsiveContainer width="100%" height={110}>
              <RadarChart data={game.radar}>
                <PolarGrid stroke={TOKENS.ash} />
                <PolarAngleAxis dataKey="m" tick={{ fill: TOKENS.muted, fontSize: 7, fontFamily: FONTS.mono }} />
                <Radar
                  dataKey="a"
                  name={game.away}
                  stroke={clr}
                  fill={clr}
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                />
                <Radar
                  dataKey="b"
                  name={game.home}
                  stroke={TOKENS.amber}
                  fill={TOKENS.amber}
                  fillOpacity={0.06}
                  strokeWidth={1}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: 7, color: clr }}>* {game.away}</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 7, color: TOKENS.amber }}>* {game.home}</span>
            </div>
          </div>
        )}

        <div style={{ fontFamily: FONTS.mono, fontSize: 8, color: TOKENS.dim, marginTop: 8, textAlign: 'center' }}>
          Click for full breakdown -&gt;
        </div>
      </div>
    );
  };

  const GameCard = ({ game, wide }: { game: Game; wide?: boolean }) => {
    const clr = getSportColor(game.sport);
    const isFinal = game.status === 'Final';
    const isHov = hovered === game.id;
    const isMarquee = game.tier === 'marquee';

    return (
      <div style={{ position: 'relative' }} onMouseEnter={() => setHovered(game.id)} onMouseLeave={() => setHovered(null)}>
        <button
          type="button"
          onClick={() => openDetail(game)}
          style={{
            width: '100%',
            textAlign: 'left',
            background: isHov ? TOKENS.cardHover : TOKENS.card,
            borderRadius: 10,
            border: `1px solid ${isHov ? `${clr}35` : TOKENS.cardBorder}`,
            padding: wide ? '18px 22px' : '14px 16px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
            boxShadow: isHov ? `0 4px 20px ${clr}10` : 'none',
            position: 'relative',
            overflow: 'hidden',
          }}
          aria-label={`Open details for ${game.away} at ${game.home}`}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 3,
              height: '100%',
              background: `${clr}40`,
              borderRadius: '10px 0 0 10px',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <Badge color={clr} ghost>
                {game.sport}
              </Badge>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: FONTS.head,
                    fontSize: wide ? 20 : 16,
                    fontWeight: 700,
                    color: isFinal && game.as > game.hs ? TOKENS.white : isFinal ? TOKENS.dim : TOKENS.white,
                    letterSpacing: '0.02em',
                  }}
                >
                  {game.away}
                </span>
                {isFinal ? (
                  <span style={{ fontFamily: FONTS.mono, fontSize: wide ? 18 : 15, fontWeight: 700 }}>
                    <span style={{ color: game.as > game.hs ? TOKENS.white : TOKENS.dim }}>{game.as}</span>
                    <span style={{ color: TOKENS.dim, margin: '0 2px', fontSize: 11 }}>-</span>
                    <span style={{ color: game.hs > game.as ? TOKENS.white : TOKENS.dim }}>{game.hs}</span>
                  </span>
                ) : (
                  <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.dim }}>@</span>
                )}
                <span
                  style={{
                    fontFamily: FONTS.head,
                    fontSize: wide ? 20 : 16,
                    fontWeight: 700,
                    color: isFinal && game.hs > game.as ? TOKENS.white : isFinal ? TOKENS.dim : TOKENS.white,
                    letterSpacing: '0.02em',
                  }}
                >
                  {game.home}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {isMarquee && (
                <Badge color={TOKENS.ember} small>
                  MARQUEE
                </Badge>
              )}
              {isFinal ? (
                <Badge color={TOKENS.muted} ghost small>
                  FINAL
                </Badge>
              ) : (
                <span style={{ fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600, color: clr }}>{game.time}</span>
              )}
            </div>
          </div>

          <div style={{ fontFamily: FONTS.mono, fontSize: 8, color: TOKENS.dim, marginTop: 3 }}>
            {game.ar} vs {game.hr} - {game.venue}
          </div>

          {!isFinal && game.fav && typeof game.pct === 'number' && (
            <div style={{ marginTop: 8 }}>
              <WinGradient pct={game.pct} fav={game.fav} opp={getOpponent(game)} color={clr} />
            </div>
          )}

          {game.intel[0] && (
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                gap: 6,
                alignItems: 'flex-start',
                padding: '6px 8px',
                borderRadius: 5,
                background: `${TOKENS.midnight}60`,
                borderLeft: `2px solid ${getPriorityColor(game.intel[0].pri)}`,
              }}
            >
              <Badge color={getPriorityColor(game.intel[0].pri)} small>
                {game.intel[0].type}
              </Badge>
              <span
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  color: TOKENS.light,
                  lineHeight: 1.35,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: wide ? 2 : 1,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {game.intel[0].text}
              </span>
            </div>
          )}
        </button>

        {isHov && !detail && (game.intel.length > 1 || Boolean(game.radar)) && (
          <HoverPreview
            game={game}
            style={{ top: '100%', left: wide ? 0 : '50%', transform: wide ? 'none' : 'translateX(-50%)', marginTop: 8 }}
          />
        )}
      </div>
    );
  };

  const HeroCard = ({ game }: { game: Game }) => {
    const clr = getSportColor(game.sport);

    return (
      <button
        type="button"
        onClick={() => openDetail(game)}
        style={{
          width: '100%',
          textAlign: 'left',
          background: TOKENS.card,
          borderRadius: 12,
          border: `1px solid ${TOKENS.cardBorder}`,
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.borderColor = `${clr}40`;
          event.currentTarget.style.boxShadow = `0 6px 30px ${clr}12`;
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.borderColor = TOKENS.cardBorder;
          event.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg,${clr},${TOKENS.ember},${clr})` }} />

        <div style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Badge color={clr}>{game.sport}</Badge>
                <Badge color={TOKENS.muted} ghost>
                  FINAL
                </Badge>
              </div>
              <div
                style={{
                  fontFamily: FONTS.head,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  color: TOKENS.muted,
                  textTransform: 'uppercase',
                }}
              >
                {game.label}
              </div>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 8, color: TOKENS.dim }}>{game.venue}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: FONTS.head, fontSize: 28, fontWeight: 700, color: TOKENS.white, letterSpacing: '0.05em' }}>
                {game.away}
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: TOKENS.dim }}>
                {game.af} ({game.ar})
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: 40, fontWeight: 700, color: TOKENS.white }}>{game.as}</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 20, color: TOKENS.dim }}>-</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 40, fontWeight: 700, color: TOKENS.dim }}>{game.hs}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: FONTS.head, fontSize: 28, fontWeight: 700, color: TOKENS.dim, letterSpacing: '0.05em' }}>
                {game.home}
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: TOKENS.dim }}>
                {game.hf} ({game.hr})
              </div>
            </div>
          </div>

          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 15,
              fontStyle: 'italic',
              color: TOKENS.light,
              textAlign: 'center',
              lineHeight: 1.45,
              marginBottom: 14,
            }}
          >
            {game.headline}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 8,
                  color: TOKENS.muted,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                Win Probability
              </div>
              <ResponsiveContainer width="100%" height={90}>
                <AreaChart
                  data={(game.awp ?? []).map((value, idx) => ({
                    i: `${(idx + 1) * 10}%`,
                    sea: value,
                    ne: game.wp?.[idx] ?? 0,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={TOKENS.ash} />
                  <XAxis dataKey="i" tick={{ fill: TOKENS.dim, fontSize: 7, fontFamily: FONTS.mono }} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: TOKENS.dim, fontSize: 7, fontFamily: FONTS.mono }}
                    width={20}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="sea"
                    name="SEA"
                    stroke={clr}
                    fill={clr}
                    fillOpacity={0.1}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="ne"
                    name="NE"
                    stroke={TOKENS.dim}
                    fill={TOKENS.dim}
                    fillOpacity={0.03}
                    strokeWidth={1}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 8,
                  color: TOKENS.muted,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                Scoring by Quarter
              </div>
              <ResponsiveContainer width="100%" height={90}>
                <BarChart data={game.qtr ?? []} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke={TOKENS.ash} />
                  <XAxis dataKey="q" tick={{ fill: TOKENS.dim, fontSize: 7, fontFamily: FONTS.mono }} />
                  <YAxis tick={{ fill: TOKENS.dim, fontSize: 7, fontFamily: FONTS.mono }} width={18} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="sea" name="SEA" fill={TOKENS.green} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="ne" name="NE" fill={TOKENS.dim} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8, overflowX: 'auto' }}>
            {game.intel.slice(0, 3).map((item, idx) => (
              <div
                key={`${item.type}-${idx}`}
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  padding: '7px 10px',
                  borderRadius: 6,
                  background: `${TOKENS.midnight}70`,
                  borderLeft: `2px solid ${getPriorityColor(item.pri)}`,
                }}
              >
                <Badge color={getPriorityColor(item.pri)} small>
                  {item.type}
                </Badge>
                <div
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 11,
                    color: TOKENS.light,
                    lineHeight: 1.35,
                    marginTop: 3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {item.text}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontFamily: FONTS.mono, fontSize: 8, color: TOKENS.dim, textAlign: 'center', marginTop: 10 }}>
            Click for complete game breakdown
          </div>
        </div>
      </button>
    );
  };

  const DetailPanel = ({ game }: { game: Game }) => {
    const clr = getSportColor(game.sport);
    const isFinal = game.status === 'Final';

    return (
      <>
        <div
          onClick={closeDetail}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              closeDetail();
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            opacity: detailAnim ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
          aria-label="Close detail panel"
        />

        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 480,
            maxWidth: '90vw',
            zIndex: 210,
            background: TOKENS.midnight,
            borderLeft: `1px solid ${clr}25`,
            overflowY: 'auto',
            overflowX: 'hidden',
            transform: detailAnim ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${clr},transparent)` }} />

          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <Badge color={clr}>{game.sport}</Badge>
                {isFinal && (
                  <Badge color={TOKENS.muted} ghost>
                    FINAL
                  </Badge>
                )}
                {game.tag === 'MARQUEE' && <Badge color={TOKENS.ember}>MARQUEE</Badge>}
              </div>
              <button
                type="button"
                onClick={closeDetail}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: `1px solid ${TOKENS.ash}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontFamily: FONTS.mono,
                  fontSize: 12,
                  color: TOKENS.dim,
                  transition: 'all 0.15s',
                  background: 'transparent',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.borderColor = TOKENS.burnt;
                  event.currentTarget.style.color = TOKENS.burnt;
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.borderColor = TOKENS.ash;
                  event.currentTarget.style.color = TOKENS.dim;
                }}
                aria-label="Close detail panel"
              >
                X
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              {game.label && (
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 8,
                    color: TOKENS.muted,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  {game.label}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div>
                  <div
                    style={{
                      fontFamily: FONTS.head,
                      fontSize: 24,
                      fontWeight: 700,
                      color: isFinal && game.as > game.hs ? TOKENS.white : isFinal ? TOKENS.dim : TOKENS.white,
                    }}
                  >
                    {game.away}
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: TOKENS.dim }}>{game.af}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 8, color: TOKENS.dim }}>({game.ar})</div>
                </div>

                {isFinal ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: 36,
                        fontWeight: 700,
                        color: game.as > game.hs ? TOKENS.white : TOKENS.dim,
                      }}
                    >
                      {game.as}
                    </span>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 16, color: TOKENS.dim }}>-</span>
                    <span
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: 36,
                        fontWeight: 700,
                        color: game.hs > game.as ? TOKENS.white : TOKENS.dim,
                      }}
                    >
                      {game.hs}
                    </span>
                  </div>
                ) : (
                  <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.dim }}>vs</div>
                )}

                <div>
                  <div
                    style={{
                      fontFamily: FONTS.head,
                      fontSize: 24,
                      fontWeight: 700,
                      color: isFinal && game.hs > game.as ? TOKENS.white : isFinal ? TOKENS.dim : TOKENS.white,
                    }}
                  >
                    {game.home}
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: TOKENS.dim }}>{game.hf}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 8, color: TOKENS.dim }}>({game.hr})</div>
                </div>
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: TOKENS.dim, marginTop: 6 }}>
                {game.venue} - {game.time}
              </div>
            </div>

            {game.headline && (
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 15,
                  fontStyle: 'italic',
                  color: TOKENS.light,
                  textAlign: 'center',
                  lineHeight: 1.5,
                  marginBottom: 20,
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: TOKENS.card,
                  border: `1px solid ${TOKENS.cardBorder}`,
                }}
              >
                {game.headline}
              </div>
            )}

            {!isFinal && game.fav && typeof game.pct === 'number' && (
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 8,
                    color: TOKENS.muted,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  BSI Model Prediction
                </div>
                <WinGradient pct={game.pct} fav={game.fav} opp={getOpponent(game)} color={clr} />
              </div>
            )}

            {game.awp && game.wp && (
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 8,
                    color: TOKENS.muted,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Win Probability
                </div>
                <ResponsiveContainer width="100%" height={130}>
                  <AreaChart
                    data={game.awp.map((value, idx) => ({
                      i: `${(idx + 1) * 10}%`,
                      away: value,
                      home: game.wp?.[idx] ?? 0,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={TOKENS.ash} />
                    <XAxis dataKey="i" tick={{ fill: TOKENS.dim, fontSize: 8, fontFamily: FONTS.mono }} />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: TOKENS.dim, fontSize: 8, fontFamily: FONTS.mono }}
                      width={22}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="away"
                      name={game.away}
                      stroke={clr}
                      fill={clr}
                      fillOpacity={0.1}
                      strokeWidth={2}
                      dot={{ r: 2, fill: clr }}
                    />
                    <Area
                      type="monotone"
                      dataKey="home"
                      name={game.home}
                      stroke={TOKENS.dim}
                      fill={TOKENS.dim}
                      fillOpacity={0.03}
                      strokeWidth={1}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {game.qtr && (
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 8,
                    color: TOKENS.muted,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Scoring
                </div>
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={game.qtr} barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" stroke={TOKENS.ash} />
                    <XAxis dataKey="q" tick={{ fill: TOKENS.dim, fontSize: 8, fontFamily: FONTS.mono }} />
                    <YAxis tick={{ fill: TOKENS.dim, fontSize: 8, fontFamily: FONTS.mono }} width={20} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="sea" name="SEA" fill={TOKENS.green} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="ne" name="NE" fill={TOKENS.dim} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {game.stats && (
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 8,
                    color: TOKENS.muted,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Key Stats
                </div>
                <div
                  style={{
                    background: TOKENS.card,
                    borderRadius: 8,
                    border: `1px solid ${TOKENS.cardBorder}`,
                    overflow: 'hidden',
                  }}
                >
                  {[
                    ['Rush Yards', game.stats.rush_sea, game.stats.rush_ne],
                    ['Time of Possession', game.stats.top_sea, game.stats.top_ne],
                    ['Penalties', game.stats.pen_sea, game.stats.pen_ne],
                  ].map(([label, awayValue, homeValue], idx) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '7px 14px',
                        borderBottom: idx < 2 ? `1px solid ${TOKENS.ash}18` : 'none',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: 11,
                          color: clr,
                          width: 60,
                          textAlign: 'right',
                          fontWeight: 600,
                        }}
                      >
                        {String(awayValue)}
                      </span>
                      <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: TOKENS.dim, flex: 1, textAlign: 'center' }}>
                        {label}
                      </span>
                      <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.dim, width: 60, fontWeight: 600 }}>
                        {String(homeValue)}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 14px' }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 7, color: clr }}>{game.away}</span>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 7, color: TOKENS.dim }}>{game.home}</span>
                </div>
              </div>
            )}

            {game.radar && (
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 8,
                    color: TOKENS.muted,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Matchup Profile
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={game.radar}>
                    <PolarGrid stroke={TOKENS.ash} />
                    <PolarAngleAxis dataKey="m" tick={{ fill: TOKENS.muted, fontSize: 8, fontFamily: FONTS.mono }} />
                    <Radar dataKey="a" name={game.away} stroke={clr} fill={clr} fillOpacity={0.15} strokeWidth={2} />
                    <Radar
                      dataKey="b"
                      name={game.home}
                      stroke={TOKENS.amber}
                      fill={TOKENS.amber}
                      fillOpacity={0.06}
                      strokeWidth={1.5}
                    />
                    <Tooltip content={<ChartTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: clr }}>* {game.away}</span>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: TOKENS.amber }}>* {game.home}</span>
                </div>
              </div>
            )}

            {game.intel.length > 0 && (
              <div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 8,
                    color: TOKENS.muted,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  Intelligence ({game.intel.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {game.intel.map((item, idx) => (
                    <div
                      key={`${item.type}-${idx}`}
                      style={{
                        display: 'flex',
                        gap: 8,
                        padding: '8px 12px',
                        borderRadius: 6,
                        background: TOKENS.card,
                        borderLeft: `2px solid ${getPriorityColor(item.pri)}`,
                        border: `1px solid ${TOKENS.cardBorder}`,
                        alignItems: 'flex-start',
                      }}
                    >
                      <Badge color={getPriorityColor(item.pri)} small>
                        {item.type}
                      </Badge>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.light, lineHeight: 1.4 }}>
                          {item.text}
                        </div>
                      </div>
                      <span style={{ fontFamily: FONTS.mono, fontSize: 7, color: TOKENS.dim, flexShrink: 0, marginTop: 2 }}>
                        {item.ts}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: TOKENS.midnight, color: TOKENS.white, fontFamily: FONTS.body }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeScale { from { opacity: 0; transform: scale(.97) translateY(-4px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        * { box-sizing: border-box; margin: 0; padding: 0 }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-thumb { background: ${TOKENS.ash}; border-radius: 2px }
        ::-webkit-scrollbar-track { background: transparent }
        input::placeholder { color: ${TOKENS.dim} }
      `}</style>

      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: `${TOKENS.midnight}F2`,
          backdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${TOKENS.ash}55`,
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '10px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 5,
                  background: `linear-gradient(135deg, ${TOKENS.burnt}, ${TOKENS.ember})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONTS.head,
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                BSI
              </div>
              <span style={{ fontFamily: FONTS.head, fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Blaze Sports Intel
              </span>
            </div>

            <div style={{ position: 'relative', width: 220 }}>
              <input
                type="text"
                placeholder="Teams, games, signals..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 10px 5px 26px',
                  borderRadius: 6,
                  border: `1px solid ${TOKENS.ash}`,
                  background: TOKENS.charcoal,
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  color: TOKENS.white,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(event) => {
                  event.target.style.borderColor = `${TOKENS.burnt}50`;
                }}
                onBlur={(event) => {
                  event.target.style.borderColor = TOKENS.ash;
                }}
                aria-label="Search games and signals"
              />
              <span
                style={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontFamily: FONTS.mono,
                  fontSize: 11,
                  color: TOKENS.dim,
                }}
              >
                ?
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              {[
                [String(GAMES.length), 'Games', TOKENS.blue],
                [accuracyPct, 'Model', TOKENS.green],
                [String(allIntel.length), 'Signals', TOKENS.ember],
              ].map(([value, label, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 2, height: 20, borderRadius: 1, background: String(color) }} />
                  <div>
                    <div style={{ fontFamily: FONTS.head, fontSize: 15, fontWeight: 700, color: TOKENS.white, lineHeight: 1 }}>
                      {value}
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: 7,
                        color: TOKENS.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {label}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: TOKENS.green, animation: 'pulse 2s infinite' }} />
                <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: TOKENS.green }}>LIVE</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 600, color: TOKENS.burnt }}>{ts}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 8, color: TOKENS.dim }}>{ds} CST</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
            {sports.map((sp) => {
              const color = sp === 'ALL' ? TOKENS.burnt : getSportColor(sp);
              const active = sport === sp;
              return (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSport(sp)}
                  style={{
                    padding: '2px 10px',
                    fontFamily: FONTS.mono,
                    fontSize: 8,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: active ? `${color}18` : 'transparent',
                    color: active ? color : TOKENS.dim,
                    border: `1px solid ${active ? `${color}35` : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  {sp === 'CBB' ? 'COLLEGE BB' : sp === 'NCAAFB' ? 'NCAA FB' : sp}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '20px 24px 48px' }}>
        {allIntel.length > 0 && (
          <div
            style={{
              marginBottom: 18,
              padding: '8px 14px',
              borderRadius: 8,
              background: `${TOKENS.ember}06`,
              border: `1px solid ${TOKENS.ember}18`,
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            <Badge color={TOKENS.ember}>{allIntel.length} PRIORITY</Badge>
            <div style={{ display: 'flex', gap: 14, flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {allIntel.slice(0, 5).map((item, idx) => (
                <div key={`${item.type}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <Badge color={getSportColor(item.sport)} small>
                    {item.sport}
                  </Badge>
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 11,
                      color: TOKENS.light,
                      whiteSpace: 'nowrap',
                      maxWidth: 280,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hero && (sport === 'ALL' || sport === 'NFL') && (
          <div style={{ marginBottom: 20, animation: 'fadeUp 0.3s ease' }}>
            <HeroCard game={hero} />
          </div>
        )}

        {(standard.length > 0 || marquee) && (
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 8,
              color: TOKENS.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: TOKENS.green, animation: 'pulse 2s infinite' }} />
            Tonight - {standard.length + (marquee ? 1 : 0)} Games
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {marquee && (
            <div style={{ gridColumn: 'span 2', animation: 'fadeUp 0.3s ease 0.05s both' }}>
              <GameCard game={marquee} wide />
            </div>
          )}
          {standard.map((game, idx) => (
            <div key={game.id} style={{ animation: `fadeUp 0.3s ease ${(idx + 1) * 0.06}s both` }}>
              <GameCard game={game} />
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
          <div>
            {cross.length > 0 && (
              <>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 8,
                    color: TOKENS.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ width: 12, height: 1, background: TOKENS.muted }} />Around the League
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cross.map((item, idx) => (
                    <div
                      key={`${item.type}-${idx}`}
                      style={{
                        display: 'flex',
                        gap: 8,
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: TOKENS.card,
                        border: `1px solid ${TOKENS.cardBorder}`,
                        borderLeft: `3px solid ${getSportColor(item.sport)}25`,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.borderColor = `${getSportColor(item.sport)}30`;
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.borderColor = TOKENS.cardBorder;
                      }}
                    >
                      <Badge color={getSportColor(item.sport)}>{item.sport}</Badge>
                      <div style={{ flex: 1 }}>
                        <Badge color={getPriorityColor(item.pri)} small>
                          {item.type}
                        </Badge>
                        <div style={{ fontFamily: FONTS.body, fontSize: 13, color: TOKENS.light, lineHeight: 1.4, marginTop: 3 }}>
                          {item.text}
                        </div>
                      </div>
                      <span style={{ fontFamily: FONTS.mono, fontSize: 7, color: TOKENS.dim, flexShrink: 0 }}>{item.ts}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(['west', 'east'] as const).map((conference) => (
              <div
                key={conference}
                style={{ background: TOKENS.card, borderRadius: 8, border: `1px solid ${TOKENS.cardBorder}`, overflow: 'hidden' }}
              >
                <div
                  style={{
                    padding: '8px 12px',
                    borderBottom: `1px solid ${TOKENS.ash}18`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONTS.head,
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    NBA {conference}
                  </span>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 7, color: TOKENS.dim }}>TOP 5</span>
                </div>

                <div style={{ padding: '4px 12px 8px' }}>
                  {STANDINGS[conference].map((team, idx) => (
                    <div
                      key={team.tm}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '3px 0',
                        gap: 6,
                        borderBottom: idx < 4 ? `1px solid ${TOKENS.ash}12` : 'none',
                      }}
                    >
                      <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: TOKENS.dim, width: 12, textAlign: 'right' }}>
                        {idx + 1}
                      </span>
                      <span
                        style={{
                          fontFamily: FONTS.head,
                          fontSize: 11,
                          fontWeight: 600,
                          color: idx === 0 ? TOKENS.burnt : TOKENS.white,
                          flex: 1,
                        }}
                      >
                        {team.tm}
                      </span>
                      <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: TOKENS.light }}>
                        {team.w}-{team.l}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ background: TOKENS.card, borderRadius: 8, border: `1px solid ${TOKENS.cardBorder}`, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span
                  style={{
                    fontFamily: FONTS.head,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  Model Accuracy
                </span>
                <Badge color={TOKENS.green} ghost small>
                  {accuracyPct}
                </Badge>
              </div>
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart data={MODEL_ACC}>
                  <XAxis dataKey="w" tick={false} axisLine={false} />
                  <YAxis domain={[60, 85]} tick={false} axisLine={false} width={0} />
                  <Area
                    type="monotone"
                    dataKey="a"
                    stroke={TOKENS.burnt}
                    fill={TOKENS.burnt}
                    fillOpacity={0.08}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: FONTS.mono, fontSize: 7, color: TOKENS.dim }}>12 weeks</span>
                <span style={{ fontFamily: FONTS.mono, fontSize: 7, color: TOKENS.dim }}>today</span>
              </div>
            </div>

            <div style={{ background: TOKENS.card, borderRadius: 8, border: `1px solid ${TOKENS.cardBorder}`, padding: 12 }}>
              <div
                style={{
                  fontFamily: FONTS.head,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Top Net Rating
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={NET_RTG} layout="vertical" barSize={8}>
                  <XAxis
                    type="number"
                    tick={{ fill: TOKENS.dim, fontSize: 7, fontFamily: FONTS.mono }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="t"
                    tick={{ fill: TOKENS.light, fontSize: 9, fontFamily: FONTS.head, fontWeight: 600 }}
                    width={26}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="v" name="Net RTG" radius={[0, 3, 3, 0]} fill={TOKENS.burnt}>
                    {NET_RTG.map((entry, idx) => (
                      <Cell key={`${entry.t}-${idx}`} fill={idx === 0 ? TOKENS.burnt : `${TOKENS.blue}80`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {games.length === 0 && cross.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, fontFamily: FONTS.body, color: TOKENS.dim, fontStyle: 'italic', fontSize: 16 }}>
            {search ? `No results for "${search}"` : `No ${sport} coverage today.`}
          </div>
        )}
      </div>

      <div
        style={{
          borderTop: `1px solid ${TOKENS.ash}`,
          padding: '10px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          maxWidth: 1120,
          margin: '0 auto',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={{ fontFamily: FONTS.mono, fontSize: 7, color: TOKENS.dim }}>(c) 2026 Blaze Sports Intel</span>
        <span style={{ fontFamily: FONTS.mono, fontSize: 7, color: TOKENS.dim }}>Equal coverage - Every sport - Every signal</span>
      </div>

      {detail && <DetailPanel game={detail} />}
    </div>
  );
}
