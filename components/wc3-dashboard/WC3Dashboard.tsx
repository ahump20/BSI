'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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

type IntelItem = {
  type: string;
  text: string;
  pri: Priority;
  ts: string;
};

type RadarMetric = {
  m: string;
  a: number;
  b: number;
};

type QuarterStat = {
  q: string;
  sea: number;
  ne: number;
};

type FinalGameStats = {
  rush_sea: number;
  rush_ne: number;
  top_sea: string;
  top_ne: string;
  pen_sea: number;
  pen_ne: number;
};

type Game = {
  id: string;
  sport: Sport;
  tier: GameTier;
  label?: string;
  status: 'Final' | 'Scheduled';
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
  tag?: string;
  fav?: string;
  pct?: number;
  headline: string;
  intel: IntelItem[];
  radar?: RadarMetric[];
  wp?: number[];
  awp?: number[];
  qtr?: QuarterStat[];
  stats?: FinalGameStats;
};

const T = {
  burnt: '#BF5700',
  soil: '#8B4513',
  charcoal: '#1A1A1A',
  midnight: '#0D0D0D',
  ember: '#FF6B35',
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
  mlb: '#BF5700',
  ncaafb: '#F59E0B',
  cbb: '#A855F7',
  card: '#161616',
  cardHover: '#1C1C1C',
  cardBorder: '#262626',
};

const F = {
  head: "'Oswald',sans-serif",
  body: "'Cormorant Garamond',serif",
  mono: "'JetBrains Mono',monospace",
};

const sc = (sport: string) => ({ NFL: T.nfl, NBA: T.nba, MLB: T.mlb, NCAAFB: T.ncaafb, CBB: T.cbb }[sport] || T.burnt);
const pc = (priority: Priority) => (priority === 'high' ? T.ember : priority === 'med' ? T.amber : T.dim);

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
      { type: 'RECAP', text: 'Seattle’s D-line held NE to 47 rush yards — lowest since SB XLVIII.', pri: 'high', ts: '2h ago' },
      {
        type: 'QB STAT',
        text: 'Darnold: 22/31, 283 yds, 3 TD, 0 INT. Passer rating 132.6 — 3rd highest in SB history.',
        pri: 'high',
        ts: '4h ago',
      },
      { type: 'TURNING PT', text: 'SEA scored 15 unanswered in Q3 off 2 NE turnovers. Game over by 4th.', pri: 'med', ts: '3h ago' },
    ],
    stats: { rush_sea: 142, rush_ne: 47, top_sea: '34:12', top_ne: '25:48', pen_sea: 4, pen_ne: 8 },
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
      { type: 'TREND', text: 'Brunson averaging 28.1 PPG at MSG. NY 8-2 last 10 home games.', pri: 'med', ts: '3h ago' },
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
    headline: 'Rockets’ defense suffocating at home. Clippers fade on back-to-backs.',
    intel: [
      { type: 'EDGE', text: 'Houston +6.2 home net rating — 4th best in NBA. 3rd in defensive rating.', pri: 'med', ts: '2h ago' },
      { type: 'FATIGUE', text: 'LAC on back-to-back. Teams in this spot are 38% ATS this season.', pri: 'med', ts: '4h ago' },
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
      { type: 'INJURY', text: 'Dončić (knee) questionable. DAL 4-11 without him, -8.3 net rating.', pri: 'high', ts: '1h ago' },
      { type: 'STREAK', text: 'Suns 8-2 last 10. Booker/Beal combining for 52 PPG in that stretch.', pri: 'med', ts: '3h ago' },
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
      { type: 'MVP WATCH', text: 'Wembanyama: 28.4/12.1/4.2 last 10 games. Leading MVP ladder.', pri: 'high', ts: '3h ago' },
      { type: 'MODEL', text: '52-48 Spurs — closest line tonight. Both teams top 5 in West.', pri: 'high', ts: '2h ago' },
      { type: 'MATCHUP', text: 'AD vs Wemby is the best individual matchup in the league right now.', pri: 'med', ts: '5h ago' },
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

const CROSS_INTEL = [
  {
    sport: 'MLB' as Sport,
    type: 'OFFSEASON',
    text: 'Texas finalizing rotation: deGrom, Gray, Eovaldi, Ragans, Leiter. Spring training Feb 14.',
    pri: 'med' as Priority,
    ts: '5h ago',
  },
  {
    sport: 'CBB' as Sport,
    type: 'PRESEASON',
    text: 'D1Baseball top 5: Texas, LSU, Florida, Tennessee, Virginia. Season opens Feb 14.',
    pri: 'med' as Priority,
    ts: '6h ago',
  },
  {
    sport: 'NCAAFB' as Sport,
    type: 'RECRUITING',
    text: 'Early signing wrap: Alabama, Ohio State, Georgia lead composite. Portal window closes Feb 15.',
    pri: 'low' as Priority,
    ts: '8h ago',
  },
];

const STANDINGS = {
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

const CTip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (!active || !payload?.length) return null;

  return (
    <div style={{ background: T.midnight, border: `1px solid ${T.slate}`, borderRadius: 4, padding: '5px 8px', fontFamily: F.mono, fontSize: 9 }}>
      <div style={{ color: T.muted, marginBottom: 1 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={`${p.name}-${i}`} style={{ color: p.color || T.burnt }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </div>
      ))}
    </div>
  );
};

const Badge = ({ children, color = T.burnt, ghost, small }: { children: ReactNode; color?: string; ghost?: boolean; small?: boolean }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: small ? '1px 4px' : '2px 7px',
      fontSize: small ? 7 : 9,
      fontFamily: F.mono,
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

const WinGradient = ({ pct, fav, opp, color }: { pct: number; fav: string; opp: string; color: string }) => (
  <div style={{ position: 'relative', height: 20, borderRadius: 4, overflow: 'hidden', background: T.ash }}>
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: `${pct}%`,
        background: `linear-gradient(90deg,${color}55,${color}30)`,
        transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
      }}
    />
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', padding: '0 8px' }}>
      <span style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, color }}>{fav} {pct}%</span>
      <span style={{ fontFamily: F.mono, fontSize: 9, color: T.dim }}>{opp} {100 - pct}%</span>
    </div>
  </div>
);

export function WC3Dashboard() {
  const [now, setNow] = useState(new Date());
  const [sport, setSport] = useState('ALL');
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

    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(interval);
      document.head.removeChild(link);
    };
  }, []);

  const openDetail = useCallback((game: Game) => {
    setDetail(game);
    setTimeout(() => setDetailAnim(true), 10);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailAnim(false);
    setTimeout(() => setDetail(null), 300);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && detail) closeDetail();
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

  const sports = ['ALL', 'NBA', 'NFL', 'MLB', 'NCAAFB', 'CBB'];

  const filtered = useMemo(() => {
    let games = sport === 'ALL' ? GAMES : GAMES.filter((g) => g.sport === sport);
    let cross = sport === 'ALL' ? CROSS_INTEL : CROSS_INTEL.filter((i) => i.sport === sport);

    if (search.trim()) {
      const q = search.toLowerCase();
      games = games.filter((g) => [g.home, g.away, g.hf, g.af, g.sport, g.label || ''].some((f) => f.toLowerCase().includes(q)));
      cross = cross.filter((i) => i.text.toLowerCase().includes(q) || i.sport.toLowerCase().includes(q));
    }

    return { games, cross };
  }, [sport, search]);

  const hero = filtered.games.find((g) => g.tier === 'hero');
  const marquee = filtered.games.find((g) => g.tier === 'marquee');
  const standard = filtered.games.filter((g) => g.tier === 'std');

  const allIntel = [
    ...GAMES.flatMap((g) => g.intel.map((i) => ({ ...i, sport: g.sport, ctx: `${g.away}@${g.home}` }))),
    ...CROSS_INTEL,
  ].filter((i) => i.pri === 'high');

  const HoverPreview = ({ g, style }: { g: Game; style: React.CSSProperties }) => {
    const clr = sc(g.sport);

    return (
      <div
        style={{
          position: 'absolute',
          zIndex: 100,
          width: 320,
          background: T.midnight,
          border: `1px solid ${clr}30`,
          borderRadius: 10,
          boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px ${clr}15`,
          padding: 16,
          pointerEvents: 'none',
          animation: 'fadeScale 0.15s ease-out',
          ...style,
        }}
      >
        <div style={{ fontFamily: F.body, fontSize: 14, color: T.white, lineHeight: 1.4, marginBottom: 10, fontStyle: 'italic' }}>{g.headline}</div>

        {g.fav && g.pct ? (
          <div style={{ marginBottom: 10 }}>
            <WinGradient pct={g.pct} fav={g.fav} opp={g.fav === g.home ? g.away : g.home} color={clr} />
          </div>
        ) : null}

        {g.intel.slice(0, 2).map((item, i) => (
          <div key={`${item.type}-${i}`} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'flex-start' }}>
            <Badge color={pc(item.pri)} small>
              {item.type}
            </Badge>
            <span style={{ fontFamily: F.body, fontSize: 12, color: T.light, lineHeight: 1.35, flex: 1 }}>{item.text}</span>
          </div>
        ))}

        {g.radar ? (
          <div style={{ marginTop: 6 }}>
            <ResponsiveContainer width="100%" height={110}>
              <RadarChart data={g.radar}>
                <PolarGrid stroke={T.ash} />
                <PolarAngleAxis dataKey="m" tick={{ fill: T.muted, fontSize: 7, fontFamily: F.mono }} />
                <Radar dataKey="a" name={g.away} stroke={clr} fill={clr} fillOpacity={0.15} strokeWidth={1.5} />
                <Radar dataKey="b" name={g.home} stroke={T.amber} fill={T.amber} fillOpacity={0.06} strokeWidth={1} />
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <span style={{ fontFamily: F.mono, fontSize: 7, color: clr }}>● {g.away}</span>
              <span style={{ fontFamily: F.mono, fontSize: 7, color: T.amber }}>● {g.home}</span>
            </div>
          </div>
        ) : null}

        <div style={{ fontFamily: F.mono, fontSize: 8, color: T.dim, marginTop: 8, textAlign: 'center' }}>Click for full breakdown →</div>
      </div>
    );
  };

  const GameCard = ({ g, wide }: { g: Game; wide?: boolean }) => {
    const clr = sc(g.sport);
    const isFinal = g.status === 'Final';
    const isHov = hovered === g.id;
    const isMarquee = g.tier === 'marquee';

    return (
      <div style={{ position: 'relative' }} onMouseEnter={() => setHovered(g.id)} onMouseLeave={() => setHovered(null)}>
        <div
          onClick={() => openDetail(g)}
          style={{
            background: isHov ? T.cardHover : T.card,
            borderRadius: 10,
            border: `1px solid ${isHov ? `${clr}35` : T.cardBorder}`,
            padding: wide ? '18px 22px' : '14px 16px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
            boxShadow: isHov ? `0 4px 20px ${clr}10` : 'none',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: `${clr}40`, borderRadius: '10px 0 0 10px' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <Badge color={clr} ghost>
                {g.sport}
              </Badge>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: F.head,
                    fontSize: wide ? 20 : 16,
                    fontWeight: 700,
                    color: isFinal && g.as > g.hs ? T.white : isFinal ? T.dim : T.white,
                    letterSpacing: '0.02em',
                  }}
                >
                  {g.away}
                </span>
                {isFinal ? (
                  <span style={{ fontFamily: F.mono, fontSize: wide ? 18 : 15, fontWeight: 700 }}>
                    <span style={{ color: g.as > g.hs ? T.white : T.dim }}>{g.as}</span>
                    <span style={{ color: T.dim, margin: '0 2px', fontSize: 11 }}>–</span>
                    <span style={{ color: g.hs > g.as ? T.white : T.dim }}>{g.hs}</span>
                  </span>
                ) : (
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: T.dim }}>@</span>
                )}
                <span
                  style={{
                    fontFamily: F.head,
                    fontSize: wide ? 20 : 16,
                    fontWeight: 700,
                    color: isFinal && g.hs > g.as ? T.white : isFinal ? T.dim : T.white,
                    letterSpacing: '0.02em',
                  }}
                >
                  {g.home}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {isMarquee ? (
                <Badge color={T.ember} small>
                  MARQUEE
                </Badge>
              ) : null}
              {isFinal ? <Badge color={T.muted} ghost small>FINAL</Badge> : <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: clr }}>{g.time}</span>}
            </div>
          </div>

          <div style={{ fontFamily: F.mono, fontSize: 8, color: T.dim, marginTop: 3 }}>{g.ar} vs {g.hr} · {g.venue}</div>

          {!isFinal && g.fav && g.pct ? (
            <div style={{ marginTop: 8 }}>
              <WinGradient pct={g.pct} fav={g.fav} opp={g.fav === g.home ? g.away : g.home} color={clr} />
            </div>
          ) : null}

          {g.intel[0] ? (
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                gap: 6,
                alignItems: 'flex-start',
                padding: '6px 8px',
                borderRadius: 5,
                background: `${T.midnight}60`,
                borderLeft: `2px solid ${pc(g.intel[0].pri)}`,
              }}
            >
              <Badge color={pc(g.intel[0].pri)} small>
                {g.intel[0].type}
              </Badge>
              <span
                style={{
                  fontFamily: F.body,
                  fontSize: 12,
                  color: T.light,
                  lineHeight: 1.35,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: wide ? 2 : 1,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {g.intel[0].text}
              </span>
            </div>
          ) : null}
        </div>

        {isHov && !detail && (g.intel.length > 1 || g.radar) ? (
          <HoverPreview g={g} style={{ top: '100%', left: wide ? 0 : '50%', transform: wide ? 'none' : 'translateX(-50%)', marginTop: 8 }} />
        ) : null}
      </div>
    );
  };

  const HeroCard = ({ g }: { g: Game }) => {
    const clr = sc(g.sport);

    return (
      <button
        type="button"
        onClick={() => openDetail(g)}
        style={{
          width: '100%',
          textAlign: 'left',
          background: T.card,
          borderRadius: 12,
          border: `1px solid ${T.cardBorder}`,
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg,${clr},${T.ember},${clr})` }} />

        <div style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Badge color={clr}>{g.sport}</Badge>
                <Badge color={T.muted} ghost>
                  FINAL
                </Badge>
              </div>
              <div style={{ fontFamily: F.head, fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', color: T.muted, textTransform: 'uppercase' }}>{g.label}</div>
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 8, color: T.dim }}>{g.venue}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: F.head, fontSize: 28, fontWeight: 700, color: T.white, letterSpacing: '0.05em' }}>{g.away}</div>
              <div style={{ fontFamily: F.mono, fontSize: 9, color: T.dim }}>{g.af} ({g.ar})</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: F.mono, fontSize: 40, fontWeight: 700, color: T.white }}>{g.as}</span>
              <span style={{ fontFamily: F.mono, fontSize: 20, color: T.dim }}>–</span>
              <span style={{ fontFamily: F.mono, fontSize: 40, fontWeight: 700, color: T.dim }}>{g.hs}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: F.head, fontSize: 28, fontWeight: 700, color: T.dim, letterSpacing: '0.05em' }}>{g.home}</div>
              <div style={{ fontFamily: F.mono, fontSize: 9, color: T.dim }}>{g.hf} ({g.hr})</div>
            </div>
          </div>

          <div style={{ fontFamily: F.body, fontSize: 15, fontStyle: 'italic', color: T.light, textAlign: 'center', lineHeight: 1.45, marginBottom: 14 }}>{g.headline}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 8, color: T.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Win Probability</div>
              <ResponsiveContainer width="100%" height={90}>
                <AreaChart data={(g.awp || []).map((v, i) => ({ i: `${(i + 1) * 10}%`, sea: v, ne: g.wp?.[i] }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.ash} />
                  <XAxis dataKey="i" tick={{ fill: T.dim, fontSize: 7, fontFamily: F.mono }} />
                  <YAxis domain={[0, 100]} tick={{ fill: T.dim, fontSize: 7, fontFamily: F.mono }} width={20} />
                  <Tooltip content={<CTip />} />
                  <Area type="monotone" dataKey="sea" name="SEA" stroke={clr} fill={clr} fillOpacity={0.1} strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="ne" name="NE" stroke={T.dim} fill={T.dim} fillOpacity={0.03} strokeWidth={1} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 8, color: T.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Scoring by Quarter</div>
              <ResponsiveContainer width="100%" height={90}>
                <BarChart data={g.qtr} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.ash} />
                  <XAxis dataKey="q" tick={{ fill: T.dim, fontSize: 7, fontFamily: F.mono }} />
                  <YAxis tick={{ fill: T.dim, fontSize: 7, fontFamily: F.mono }} width={18} />
                  <Tooltip content={<CTip />} />
                  <Bar dataKey="sea" name="SEA" fill={T.green} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="ne" name="NE" fill={T.dim} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8, overflowX: 'auto' }}>
            {g.intel.slice(0, 3).map((item, i) => (
              <div key={`${item.type}-${i}`} style={{ flex: '1 1 0', minWidth: 0, padding: '7px 10px', borderRadius: 6, background: `${T.midnight}70`, borderLeft: `2px solid ${pc(item.pri)}` }}>
                <Badge color={pc(item.pri)} small>
                  {item.type}
                </Badge>
                <div
                  style={{
                    fontFamily: F.body,
                    fontSize: 11,
                    color: T.light,
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

          <div style={{ fontFamily: F.mono, fontSize: 8, color: T.dim, textAlign: 'center', marginTop: 10 }}>Click for complete game breakdown</div>
        </div>
      </button>
    );
  };

  const DetailPanel = ({ g }: { g: Game }) => {
    const clr = sc(g.sport);
    const isFinal = g.status === 'Final';

    return (
      <>
        <button type="button" aria-label="Close panel" onClick={closeDetail} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', opacity: detailAnim ? 1 : 0, transition: 'opacity 0.3s', border: 'none' }} />

        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 480,
            maxWidth: '90vw',
            zIndex: 210,
            background: T.midnight,
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
                <Badge color={clr}>{g.sport}</Badge>
                {isFinal ? <Badge color={T.muted} ghost>FINAL</Badge> : null}
                {g.tag === 'MARQUEE' ? <Badge color={T.ember}>MARQUEE</Badge> : null}
              </div>
              <button type="button" onClick={closeDetail} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.ash}`, background: 'transparent', color: T.dim, cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              {g.label ? <div style={{ fontFamily: F.mono, fontSize: 8, color: T.muted, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>{g.label}</div> : null}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div>
                  <div style={{ fontFamily: F.head, fontSize: 24, fontWeight: 700, color: isFinal && g.as > g.hs ? T.white : isFinal ? T.dim : T.white }}>{g.away}</div>
                  <div style={{ fontFamily: F.mono, fontSize: 9, color: T.dim }}>{g.af}</div>
                  <div style={{ fontFamily: F.mono, fontSize: 8, color: T.dim }}>({g.ar})</div>
                </div>
                {isFinal ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 36, fontWeight: 700, color: g.as > g.hs ? T.white : T.dim }}>{g.as}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 16, color: T.dim }}>–</span>
                    <span style={{ fontFamily: F.mono, fontSize: 36, fontWeight: 700, color: g.hs > g.as ? T.white : T.dim }}>{g.hs}</span>
                  </div>
                ) : (
                  <div style={{ fontFamily: F.mono, fontSize: 11, color: T.dim }}>vs</div>
                )}
                <div>
                  <div style={{ fontFamily: F.head, fontSize: 24, fontWeight: 700, color: isFinal && g.hs > g.as ? T.white : isFinal ? T.dim : T.white }}>{g.home}</div>
                  <div style={{ fontFamily: F.mono, fontSize: 9, color: T.dim }}>{g.hf}</div>
                  <div style={{ fontFamily: F.mono, fontSize: 8, color: T.dim }}>({g.hr})</div>
                </div>
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 9, color: T.dim, marginTop: 6 }}>
                {g.venue} · {g.time}
              </div>
            </div>

            <div style={{ fontFamily: F.body, fontSize: 15, fontStyle: 'italic', color: T.light, textAlign: 'center', lineHeight: 1.5, marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: T.card, border: `1px solid ${T.cardBorder}` }}>
              {g.headline}
            </div>

            {!isFinal && g.fav && g.pct ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: F.mono, fontSize: 8, color: T.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>BSI Model Prediction</div>
                <WinGradient pct={g.pct} fav={g.fav} opp={g.fav === g.home ? g.away : g.home} color={clr} />
              </div>
            ) : null}

            {g.awp && g.wp ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: F.mono, fontSize: 8, color: T.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Win Probability</div>
                <ResponsiveContainer width="100%" height={130}>
                  <AreaChart data={g.awp.map((v, i) => ({ i: `${(i + 1) * 10}%`, away: v, home: g.wp?.[i] }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.ash} />
                    <XAxis dataKey="i" tick={{ fill: T.dim, fontSize: 8, fontFamily: F.mono }} />
                    <YAxis domain={[0, 100]} tick={{ fill: T.dim, fontSize: 8, fontFamily: F.mono }} width={22} />
                    <Tooltip content={<CTip />} />
                    <Area type="monotone" dataKey="away" name={g.away} stroke={clr} fill={clr} fillOpacity={0.1} strokeWidth={2} dot={{ r: 2, fill: clr }} />
                    <Area type="monotone" dataKey="home" name={g.home} stroke={T.dim} fill={T.dim} fillOpacity={0.03} strokeWidth={1} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : null}

            {g.qtr ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: F.mono, fontSize: 8, color: T.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Scoring</div>
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={g.qtr} barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.ash} />
                    <XAxis dataKey="q" tick={{ fill: T.dim, fontSize: 8, fontFamily: F.mono }} />
                    <YAxis tick={{ fill: T.dim, fontSize: 8, fontFamily: F.mono }} width={20} />
                    <Tooltip content={<CTip />} />
                    <Bar dataKey="sea" name="SEA" fill={T.green} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="ne" name="NE" fill={T.dim} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}

            {g.stats ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: F.mono, fontSize: 8, color: T.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Key Stats</div>
                <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.cardBorder}`, overflow: 'hidden' }}>
                  {[
                    ['Rush Yards', g.stats.rush_sea, g.stats.rush_ne],
                    ['Time of Possession', g.stats.top_sea, g.stats.top_ne],
                    ['Penalties', g.stats.pen_sea, g.stats.pen_ne],
                  ].map(([label, a, b], i) => (
                    <div key={String(label)} style={{ display: 'flex', alignItems: 'center', padding: '7px 14px', borderBottom: i < 2 ? `1px solid ${T.ash}18` : 'none' }}>
                      <span style={{ fontFamily: F.mono, fontSize: 11, color: clr, width: 60, textAlign: 'right', fontWeight: 600 }}>{String(a)}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 9, color: T.dim, flex: 1, textAlign: 'center' }}>{label}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 11, color: T.dim, width: 60, fontWeight: 600 }}>{String(b)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 14px' }}>
                  <span style={{ fontFamily: F.mono, fontSize: 7, color: clr }}>{g.away}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 7, color: T.dim }}>{g.home}</span>
                </div>
              </div>
            ) : null}

            {g.radar ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: F.mono, fontSize: 8, color: T.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Matchup Profile</div>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={g.radar}>
                    <PolarGrid stroke={T.ash} />
                    <PolarAngleAxis dataKey="m" tick={{ fill: T.muted, fontSize: 8, fontFamily: F.mono }} />
                    <Radar dataKey="a" name={g.away} stroke={clr} fill={clr} fillOpacity={0.15} strokeWidth={2} />
                    <Radar dataKey="b" name={g.home} stroke={T.amber} fill={T.amber} fillOpacity={0.06} strokeWidth={1.5} />
                    <Tooltip content={<CTip />} />
                  </RadarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
                  <span style={{ fontFamily: F.mono, fontSize: 8, color: clr }}>● {g.away}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 8, color: T.amber }}>● {g.home}</span>
                </div>
              </div>
            ) : null}

            <div>
              <div style={{ fontFamily: F.mono, fontSize: 8, color: T.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Intelligence ({g.intel.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {g.intel.map((item, i) => (
                  <div
                    key={`${item.type}-${i}`}
                    style={{
                      display: 'flex',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: T.card,
                      borderLeft: `2px solid ${pc(item.pri)}`,
                      border: `1px solid ${T.cardBorder}`,
                      alignItems: 'flex-start',
                    }}
                  >
                    <Badge color={pc(item.pri)} small>
                      {item.type}
                    </Badge>
                    <div style={{ flex: 1, fontFamily: F.body, fontSize: 13, color: T.light, lineHeight: 1.4 }}>{item.text}</div>
                    <span style={{ fontFamily: F.mono, fontSize: 7, color: T.dim, flexShrink: 0, marginTop: 2 }}>{item.ts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: T.midnight, color: T.white, fontFamily: F.body }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}} @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} @keyframes fadeScale{from{opacity:0;transform:scale(.97) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}} *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:${T.ash};border-radius:2px} ::-webkit-scrollbar-track{background:transparent} input::placeholder{color:${T.dim}}`}</style>

      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: `${T.midnight}F2`, backdropFilter: 'blur(14px)', borderBottom: `1px solid ${T.ash}55` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '10px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 5, background: `linear-gradient(135deg,${T.burnt},${T.ember})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.head, fontSize: 10, fontWeight: 700, color: '#fff' }}>
                BSI
              </div>
              <span style={{ fontFamily: F.head, fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Blaze Sports Intel</span>
            </div>

            <div style={{ position: 'relative', width: 220 }}>
              <input
                type="text"
                placeholder="Teams, games, signals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '5px 10px 5px 26px', borderRadius: 6, border: `1px solid ${T.ash}`, background: T.charcoal, fontFamily: F.mono, fontSize: 10, color: T.white, outline: 'none' }}
              />
              <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontFamily: F.mono, fontSize: 11, color: T.dim }}>⌕</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              {[
                ['5', 'Games', T.blue],
                ['76.4%', 'Model', T.green],
                [String(allIntel.length), 'Signals', T.ember],
              ].map(([v, l, c]) => (
                <div key={String(l)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 2, height: 20, borderRadius: 1, background: String(c) }} />
                  <div>
                    <div style={{ fontFamily: F.head, fontSize: 15, fontWeight: 700, color: T.white, lineHeight: 1 }}>{v}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 7, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.green, animation: 'pulse 2s infinite' }} />
                <span style={{ fontFamily: F.mono, fontSize: 8, color: T.green }}>LIVE</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 600, color: T.burnt }}>{ts}</div>
                <div style={{ fontFamily: F.mono, fontSize: 8, color: T.dim }}>{ds} CST</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {sports.map((sp) => {
              const c = sp === 'ALL' ? T.burnt : sc(sp);
              const act = sport === sp;

              return (
                <button
                  type="button"
                  key={sp}
                  onClick={() => setSport(sp)}
                  style={{
                    padding: '2px 10px',
                    fontFamily: F.mono,
                    fontSize: 8,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: act ? `${c}18` : 'transparent',
                    color: act ? c : T.dim,
                    border: `1px solid ${act ? `${c}35` : 'transparent'}`,
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
        {allIntel.length > 0 ? (
          <div style={{ marginBottom: 18, padding: '8px 14px', borderRadius: 8, background: `${T.ember}06`, border: `1px solid ${T.ember}18`, display: 'flex', gap: 10, alignItems: 'center', overflow: 'hidden' }}>
            <Badge color={T.ember}>{allIntel.length} PRIORITY</Badge>
            <div style={{ display: 'flex', gap: 14, flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {allIntel.slice(0, 5).map((item, i) => (
                <div key={`${item.type}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <Badge color={sc(item.sport)} small>
                    {item.sport}
                  </Badge>
                  <span style={{ fontFamily: F.body, fontSize: 11, color: T.light, whiteSpace: 'nowrap', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {hero && (sport === 'ALL' || sport === 'NFL') ? (
          <div style={{ marginBottom: 20, animation: 'fadeUp 0.3s ease' }}>
            <HeroCard g={hero} />
          </div>
        ) : null}

        {standard.length > 0 || marquee ? (
          <div style={{ fontFamily: F.mono, fontSize: 8, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.green, animation: 'pulse 2s infinite' }} />
            Tonight — {standard.length + (marquee ? 1 : 0)} Games
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {marquee ? (
            <div style={{ gridColumn: 'span 2', animation: 'fadeUp 0.3s ease 0.05s both' }}>
              <GameCard g={marquee} wide />
            </div>
          ) : null}
          {standard.map((g, i) => (
            <div key={g.id} style={{ animation: `fadeUp 0.3s ease ${(i + 1) * 0.06}s both` }}>
              <GameCard g={g} />
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
          <div>
            {filtered.cross.length > 0 ? (
              <>
                <div style={{ fontFamily: F.mono, fontSize: 8, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 1, background: T.muted }} />
                  Around the League
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filtered.cross.map((item, i) => (
                    <div key={`${item.type}-${i}`} style={{ display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 8, background: T.card, border: `1px solid ${T.cardBorder}`, borderLeft: `3px solid ${sc(item.sport)}25` }}>
                      <Badge color={sc(item.sport)}>{item.sport}</Badge>
                      <div style={{ flex: 1 }}>
                        <Badge color={pc(item.pri)} small>
                          {item.type}
                        </Badge>
                        <div style={{ fontFamily: F.body, fontSize: 13, color: T.light, lineHeight: 1.4, marginTop: 3 }}>{item.text}</div>
                      </div>
                      <span style={{ fontFamily: F.mono, fontSize: 7, color: T.dim, flexShrink: 0 }}>{item.ts}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(['west', 'east'] as const).map((conf) => (
              <div key={conf} style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.cardBorder}`, overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', borderBottom: `1px solid ${T.ash}18`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: F.head, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>NBA {conf}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 7, color: T.dim }}>TOP 5</span>
                </div>
                <div style={{ padding: '4px 12px 8px' }}>
                  {STANDINGS[conf].map((t, i) => (
                    <div key={t.tm} style={{ display: 'flex', alignItems: 'center', padding: '3px 0', gap: 6, borderBottom: i < 4 ? `1px solid ${T.ash}12` : 'none' }}>
                      <span style={{ fontFamily: F.mono, fontSize: 8, color: T.dim, width: 12, textAlign: 'right' }}>{i + 1}</span>
                      <span style={{ fontFamily: F.head, fontSize: 11, fontWeight: 600, color: i === 0 ? T.burnt : T.white, flex: 1 }}>{t.tm}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 9, color: T.light }}>{t.w}-{t.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.cardBorder}`, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: F.head, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Model Accuracy</span>
                <Badge color={T.green} ghost small>
                  76.4%
                </Badge>
              </div>
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart data={MODEL_ACC}>
                  <XAxis dataKey="w" tick={false} axisLine={false} />
                  <YAxis domain={[60, 85]} tick={false} axisLine={false} width={0} />
                  <Area type="monotone" dataKey="a" stroke={T.burnt} fill={T.burnt} fillOpacity={0.08} strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: F.mono, fontSize: 7, color: T.dim }}>12 weeks</span>
                <span style={{ fontFamily: F.mono, fontSize: 7, color: T.dim }}>today</span>
              </div>
            </div>

            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.cardBorder}`, padding: 12 }}>
              <div style={{ fontFamily: F.head, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Top Net Rating</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={NET_RTG} layout="vertical" barSize={8}>
                  <XAxis type="number" tick={{ fill: T.dim, fontSize: 7, fontFamily: F.mono }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="t" tick={{ fill: T.light, fontSize: 9, fontFamily: F.head, fontWeight: 600 }} width={26} axisLine={false} tickLine={false} />
                  <Tooltip content={<CTip />} />
                  <Bar dataKey="v" name="Net RTG" radius={[0, 3, 3, 0]} fill={T.burnt}>
                    {NET_RTG.map((e, i) => (
                      <Cell key={`${e.t}-${i}`} fill={i === 0 ? T.burnt : `${T.blue}80`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {filtered.games.length === 0 && filtered.cross.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, fontFamily: F.body, color: T.dim, fontStyle: 'italic', fontSize: 16 }}>
            {search ? `No results for "${search}"` : `No ${sport} coverage today.`}
          </div>
        ) : null}
      </div>

      <div style={{ borderTop: `1px solid ${T.ash}`, padding: '10px 24px', display: 'flex', justifyContent: 'space-between', maxWidth: 1120, margin: '0 auto' }}>
        <span style={{ fontFamily: F.mono, fontSize: 7, color: T.dim }}>© 2026 Blaze Sports Intel</span>
        <span style={{ fontFamily: F.mono, fontSize: 7, color: T.dim }}>Equal coverage · Every sport · Every signal</span>
      </div>

      {detail ? <DetailPanel g={detail} /> : null}
    </div>
  );
}
