'use client';

import { useState, useMemo } from 'react';
import {
  calculateISO,
  calculateBABIP,
  calculateKPct,
  calculateBBPct,
  calculateWOBA,
  calculateWRCPlus,
  calculateOPSPlus,
  calculateFIP,
  calculateXFIP,
  calculateERAMinus,
  calculateK9,
  calculateBB9,
  calculateHR9,
  calculateKBB,
  calculateLOBPct,
  calculateEBA,
  calculateESLG,
  calculateEWOBA,
  calculateContactRate,
  calculatePlateDiscipline,
  calculateLinearWeightRuns,
  calculateSIERALite,
  calculateWorkloadScore,
  type BattingLine,
  MLB_WOBA_WEIGHTS,
  type LeagueContext,
} from '@/lib/analytics/savant-metrics';

// ---------------------------------------------------------------------------
// Default league context (D1 2026 derived from cbb_league_context)
// ---------------------------------------------------------------------------

const D1_LEAGUE: LeagueContext = {
  woba: 0.338,
  obp: 0.362,
  avg: 0.269,
  slg: 0.418,
  era: 4.21,
  runsPerPA: 0.118,
  wobaScale: 1.15,
  fipConstant: 3.80,
  hrFBRate: 0.11,
};

// ---------------------------------------------------------------------------
// Formula metadata for cards
// ---------------------------------------------------------------------------

interface FormulaCard {
  id: string;
  label: string;
  formula: string;
  description: string;
  range: string;
  interpret: string;
  tier: 'free' | 'pro';
}

const BATTING_CARDS: FormulaCard[] = [
  { id: 'avg', label: 'AVG', formula: 'H / AB', description: 'Batting average. Classic but incomplete — treats all hits equally and ignores walks.', range: '.200 – .400 D1', interpret: '>.340 elite, <.240 weak', tier: 'free' },
  { id: 'obp', label: 'OBP', formula: '(H + BB + HBP) / PA', description: 'On-base percentage. Better than AVG because walks and HBP count. A walk is as good as a single for not making an out.', range: '.300 – .460 D1', interpret: '>.390 elite, <.310 weak', tier: 'free' },
  { id: 'slg', label: 'SLG', formula: '(1B + 2·2B + 3·3B + 4·HR) / AB', description: 'Slugging. Measures power but weights all extra-base hits by arbitrary multipliers rather than actual run value.', range: '.360 – .650 D1', interpret: '>.500 elite, <.350 weak', tier: 'free' },
  { id: 'ops', label: 'OPS', formula: 'OBP + SLG', description: 'Combines on-base and power. Simple and surprisingly predictive, despite the methodological issue of adding two stats with different denominators.', range: '.680 – 1.100 D1', interpret: '>.900 elite, <.650 weak', tier: 'free' },
  { id: 'iso', label: 'ISO', formula: 'SLG − AVG', description: 'Isolated power. Strips singles out of slugging, leaving only extra-base hit contribution. Pure power metric.', range: '.060 – .350 D1', interpret: '>.220 elite power, <.080 contact-only', tier: 'free' },
  { id: 'babip', label: 'BABIP', formula: '(H − HR) / (AB − SO − HR + SF)', description: 'Batting average on balls in play. Captures how often non-HR batted balls drop in. Extreme deviation from .300 suggests luck, defense, or exit velocity.', range: '.250 – .420 D1', interpret: 'extreme > .380 or < .240 → likely luck', tier: 'free' },
  { id: 'kpct', label: 'K%', formula: 'SO / PA', description: 'Strikeout rate. The primary contact quality gate. High K% tanks BABIP and limits OBP ceiling regardless of power.', range: '12% – 35% D1', interpret: '<16% elite contact, >28% strikeout risk', tier: 'free' },
  { id: 'bbpct', label: 'BB%', formula: 'BB / PA', description: 'Walk rate. The clearest signal of plate discipline. Hard to fake over a full season.', range: '5% – 20% D1', interpret: '>15% elite discipline, <7% aggressive/undisciplined', tier: 'free' },
  { id: 'contact', label: 'Contact Rate', formula: '1 − K%', description: 'Fraction of plate appearances not ending in strikeout. Complement of K% — useful for framing hitter profile.', range: '65% – 88% D1', interpret: '>82% contact hitter profile', tier: 'free' },
  { id: 'discipline', label: 'Plate Discipline', formula: 'BB% / (BB% + K%)', description: 'Walks as share of all walk-or-strikeout outcomes. Filters out neutral contact events to isolate pure discipline signal.', range: '.15 – .55 D1', interpret: '>.40 highly disciplined, <.20 aggressive', tier: 'free' },
  { id: 'woba', label: 'wOBA', formula: '(wBB·BB + wHBP·HBP + w1B·1B + w2B·2B + w3B·3B + wHR·HR) / PA', description: 'Weighted On-Base Average. Assigns each event its actual run-production value from regression. The single best publicly available batting metric.', range: '.270 – .530 D1', interpret: '>.400 elite, <.290 below average', tier: 'pro' },
  { id: 'wrcplus', label: 'wRC+', formula: '((wOBA − lgwOBA) / wOBAScale + lgR/PA) / (lgR/PA) × 100', description: '100 = league average. Park-adjusted. 150 means 50% better than average. Gold standard for cross-context comparison.', range: '40 – 220 D1', interpret: '>145 elite, <75 well below average', tier: 'pro' },
  { id: 'opsplus', label: 'OPS+', formula: '100 × (OBP / lgOBP·PF + SLG / lgSLG·PF − 1)', description: 'Park-adjusted OPS on a 100-scale. Simpler than wRC+ but less precise because OBP and SLG have different denominators.', range: '40 – 220 D1', interpret: '>140 elite, <80 below average', tier: 'pro' },
  { id: 'lwr', label: 'Linear Weight Runs', formula: '0.47·1B + 0.77·2B + 1.04·3B + 1.42·HR + 0.33·BB + 0.34·HBP − 0.27·Outs', description: 'Absolute run contribution estimate. Unlike rate stats, this accumulates — useful for comparing total offensive value produced.', range: '−15 to +60 per season D1', interpret: '>40 elite total offensive value', tier: 'pro' },
  { id: 'eba', label: 'eBA', formula: 'regressed BABIP × (1 − K%) + HR% + conf_adj', description: 'Estimated Batting Average. Regresses BABIP 40% toward .300 to strip luck, then adjusts for strikeout and HR rate. Predictive, not descriptive.', range: '.240 – .400 D1', interpret: 'deviation from AVG reveals luck or true-talent gap', tier: 'pro' },
  { id: 'ewoba', label: 'ewOBA', formula: 'simplified wOBA-like weighting on eBA + eSLG + BB%', description: 'Estimated wOBA. Combines expected batting average, expected slugging, and walk rate through simplified linear weights. Forward-looking version of wOBA.', range: '.260 – .520 D1', interpret: 'large ewOBA – wOBA gap → regression candidate', tier: 'pro' },
];

const PITCHING_CARDS: FormulaCard[] = [
  { id: 'era', label: 'ERA', formula: '(ER × 9) / IP', description: 'Earned Run Average. Most-cited pitching stat but highly sensitive to defense quality and strand rate luck.', range: '2.8 – 7.0 D1', interpret: '<3.50 elite, >5.50 well below average', tier: 'free' },
  { id: 'whip', label: 'WHIP', formula: '(H + BB) / IP', description: 'Walks + hits per inning. Cleaner than ERA because it removes run-scoring luck, but still includes defense.', range: '0.90 – 1.90 D1', interpret: '<1.20 elite, >1.60 high traffic', tier: 'free' },
  { id: 'k9', label: 'K/9', formula: '(SO × 9) / IP', description: 'Strikeouts per 9 innings. Primary stuff/swing-and-miss indicator. Directly controlled by the pitcher.', range: '5.0 – 14.0 D1', interpret: '>11.0 elite swing-and-miss, <6.5 contact-dependent', tier: 'free' },
  { id: 'bb9', label: 'BB/9', formula: '(BB × 9) / IP', description: 'Walks per 9 innings. Command metric. High BB/9 forces the pitcher into hitter-friendly counts and inflates pitch counts.', range: '1.5 – 6.5 D1', interpret: '<2.5 elite command, >4.5 control risk', tier: 'free' },
  { id: 'hr9', label: 'HR/9', formula: '(HR × 9) / IP', description: 'Home runs per 9. Subject to park and launch angle; use with park factor context. Partially skill (FB tendency) and partially luck.', range: '0.3 – 1.8 D1', interpret: '<0.7 low HR risk, >1.3 concerning', tier: 'free' },
  { id: 'kbb', label: 'K/BB', formula: 'SO / BB', description: 'K-to-BB ratio. Simple but effective command-vs-stuff summary. Best single-number pitcher quality proxy at small sample sizes.', range: '1.5 – 6.0 D1', interpret: '>4.0 elite, <2.0 command concern', tier: 'free' },
  { id: 'fip', label: 'FIP', formula: '(13·HR + 3·(BB+HBP) − 2·K) / IP + cFIP', description: 'Fielding Independent Pitching. Isolates what the pitcher controls — strikeouts, walks, HBP, HR — from defense and luck on balls in play. ERA-scaled.', range: '2.50 – 6.50 D1', interpret: '<3.50 elite, >5.50 poor', tier: 'pro' },
  { id: 'xfip', label: 'xFIP', formula: 'FIP with expected HR (FB × lgHR/FB rate) instead of actual HR', description: 'Expected FIP. Replaces actual HR with expected HR based on league HR/FB rate. Smooths home run variance. More predictive than FIP over small samples.', range: '2.50 – 6.50 D1', interpret: 'large FIP – xFIP gap → HR luck regression incoming', tier: 'pro' },
  { id: 'eraminus', label: 'ERA−', formula: '100 × (ERA / lgERA) / PF', description: '100 = league average. Lower is better. Park-adjusted. 80 ERA− = 20% better than average. Easier to interpret than raw ERA across contexts.', range: '40 – 180 D1', interpret: '<75 elite, >130 well below average', tier: 'pro' },
  { id: 'lobpct', label: 'LOB%', formula: '(H + BB + HBP − ER) / (H + BB + HBP − HR)', description: 'Left on base percentage. How often the pitcher strands baserunners. D1 average ~71%. Extreme LOB% tends to regress — useful for identifying overperformers or underperformers.', range: '60% – 84% D1', interpret: '>79% likely outperforming ERA, <64% likely underperforming', tier: 'pro' },
  { id: 'siera', label: 'SIERA-Lite', formula: '6.145 − 16.986·K% + 11.434·BB% + 1.858·(HR/BF)·9', description: 'Simplified Skill-Interactive ERA. SIERA strips batted-ball data from ERA. Without Statcast, this version uses K%, BB%, and HR rate as proxies. Most predictive ERA estimator available from box scores.', range: '2.8 – 7.5 D1', interpret: '<3.80 elite, >5.50 poor', tier: 'pro' },
  { id: 'workload', label: 'Workload Score', formula: '(IP/G ÷ baseline) × 50 + last7d × 6', description: 'Fatigue index 0–100. Combines IP density with recent-appearance frequency. 50 = average starter load. Used for identifying arms under stress or candidates for rest.', range: '0 – 100', interpret: '>75 high-stress arm, <35 well-rested', tier: 'free' },
];

// ---------------------------------------------------------------------------
// Shared input styles
// ---------------------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(191,87,0,0.25)',
  borderRadius: '4px',
  color: '#FAF8F5',
  padding: '4px 8px',
  fontSize: '0.8125rem',
  fontFamily: 'JetBrains Mono, monospace',
  width: '72px',
  textAlign: 'right',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: 'rgba(250,248,245,0.5)',
  fontFamily: 'JetBrains Mono, monospace',
  marginBottom: '2px',
};

// ---------------------------------------------------------------------------
// Number input helper
// ---------------------------------------------------------------------------

function NumInput({ label, value, onChange, step = 1, min = 0 }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <div style={labelStyle}>{label}</div>
      <input
        type="number"
        style={inputStyle}
        value={value}
        step={step}
        min={min}
        onChange={e => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric result display
// ---------------------------------------------------------------------------

function MetricResult({ label, value, tier }: { label: string; value: string; tier: 'free' | 'pro' }) {
  return (
    <div style={{
      background: tier === 'pro' ? 'rgba(255,107,53,0.08)' : 'rgba(26,26,26,0.8)',
      border: tier === 'pro' ? '1px solid rgba(255,107,53,0.2)' : '1px solid rgba(191,87,0,0.15)',
      borderRadius: '6px',
      padding: '8px 12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: '8px',
    }}>
      <span style={{ fontSize: '0.75rem', color: tier === 'pro' ? '#FF6B35' : 'rgba(250,248,245,0.6)', fontFamily: 'JetBrains Mono, monospace' }}>
        {label}
      </span>
      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#FAF8F5', fontFamily: 'JetBrains Mono, monospace' }}>
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formula card (expandable)
// ---------------------------------------------------------------------------

function FormulaCardView({ card, isOpen, onToggle }: { card: FormulaCard; isOpen: boolean; onToggle: () => void }) {
  return (
    <div style={{
      border: '1px solid rgba(191,87,0,0.15)',
      borderRadius: '6px',
      overflow: 'hidden',
      background: '#1A1A1A',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', textAlign: 'left', padding: '10px 14px',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#FAF8F5', fontSize: '0.875rem', fontFamily: 'JetBrains Mono, monospace' }}>
            {card.label}
          </span>
          <span style={{
            background: card.tier === 'pro' ? 'rgba(255,107,53,0.15)' : 'rgba(250,248,245,0.08)',
            color: card.tier === 'pro' ? '#FF6B35' : 'rgba(250,248,245,0.4)',
            padding: '1px 6px', borderRadius: '3px', fontSize: '0.625rem',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {card.tier}
          </span>
        </div>
        <span style={{ color: 'rgba(250,248,245,0.35)', fontSize: '0.75rem' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <code style={{ display: 'block', padding: '8px 10px', background: '#111', borderRadius: '4px', color: '#BF5700', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', margin: '10px 0 8px' }}>
            {card.formula}
          </code>
          <p style={{ color: 'rgba(250,248,245,0.7)', fontSize: '0.8125rem', margin: '0 0 6px', lineHeight: 1.5 }}>
            {card.description}
          </p>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'rgba(250,248,245,0.45)', fontFamily: 'JetBrains Mono, monospace' }}>
            <span>Range: {card.range}</span>
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#BF5700', fontFamily: 'JetBrains Mono, monospace' }}>
            ↳ {card.interpret}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Batting Calculator
// ---------------------------------------------------------------------------

function BattingCalculator() {
  const [stats, setStats] = useState<BattingLine>({
    pa: 87, ab: 76, h: 27, doubles: 7, triples: 1, hr: 6,
    bb: 10, hbp: 1, so: 18, sf: 1,
  });
  const [parkFactor, setParkFactor] = useState(1.0);
  const [openCard, setOpenCard] = useState<string | null>(null);

  const set = (key: keyof BattingLine, v: number) => setStats(s => ({ ...s, [key]: v }));

  const computed = useMemo(() => {
    const avg = stats.ab > 0 ? stats.h / stats.ab : 0;
    const singles = Math.max(0, stats.h - stats.doubles - stats.triples - stats.hr);
    const slg = stats.ab > 0 ? (singles + 2 * stats.doubles + 3 * stats.triples + 4 * stats.hr) / stats.ab : 0;
    const obp = stats.pa > 0 ? (stats.h + stats.bb + stats.hbp) / stats.pa : 0;
    const ops = obp + slg;
    const iso = calculateISO(slg, avg);
    const babip = calculateBABIP(stats.h, stats.hr, stats.ab, stats.so, stats.sf ?? 0);
    const kPct = calculateKPct(stats.so, stats.pa);
    const bbPct = calculateBBPct(stats.bb, stats.pa);
    const contact = calculateContactRate(stats.so, stats.pa);
    const discipline = calculatePlateDiscipline(stats.bb, stats.so, stats.pa);
    const woba = calculateWOBA(stats, MLB_WOBA_WEIGHTS);
    const wrcPlus = calculateWRCPlus(woba, D1_LEAGUE, parkFactor);
    const opsPlus = calculateOPSPlus(obp, slg, D1_LEAGUE.obp, D1_LEAGUE.slg, parkFactor);
    const outs = stats.ab - stats.h;
    const lwr = calculateLinearWeightRuns(singles, stats.doubles, stats.triples, stats.hr, stats.bb, stats.hbp, outs);
    const hrRate = stats.ab > 0 ? stats.hr / stats.ab : 0;
    const eBA = calculateEBA(babip, hrRate, kPct);
    const eSLG = calculateESLG(iso, eBA);
    const eWOBA = calculateEWOBA(eBA, eSLG, bbPct, MLB_WOBA_WEIGHTS);
    return { avg, obp, slg, ops, iso, babip, kPct, bbPct, contact, discipline, woba, wrcPlus, opsPlus, lwr, eBA, eSLG, eWOBA };
  }, [stats, parkFactor]);

  const fmt3 = (n: number) => n.toFixed(3);
  const fmtPct = (n: number) => (n * 100).toFixed(1) + '%';
  const fmtInt = (n: number) => Math.round(n).toString();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Inputs */}
      <div style={{ background: '#1A1A1A', borderRadius: '8px', border: '1px solid rgba(191,87,0,0.2)', padding: '1rem' }}>
        <div style={{ fontSize: '0.7rem', color: '#BF5700', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          Raw Inputs
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <NumInput label="PA" value={stats.pa} onChange={v => set('pa', v)} />
          <NumInput label="AB" value={stats.ab} onChange={v => set('ab', v)} />
          <NumInput label="H" value={stats.h} onChange={v => set('h', v)} />
          <NumInput label="2B" value={stats.doubles} onChange={v => set('doubles', v)} />
          <NumInput label="3B" value={stats.triples} onChange={v => set('triples', v)} />
          <NumInput label="HR" value={stats.hr} onChange={v => set('hr', v)} />
          <NumInput label="BB" value={stats.bb} onChange={v => set('bb', v)} />
          <NumInput label="HBP" value={stats.hbp} onChange={v => set('hbp', v)} />
          <NumInput label="SO" value={stats.so} onChange={v => set('so', v)} />
          <NumInput label="SF" value={stats.sf ?? 0} onChange={v => set('sf', v)} />
          <NumInput label="PF" value={parkFactor} onChange={setParkFactor} step={0.01} min={0.5} />
        </div>
      </div>

      {/* Results grid */}
      <div>
        <div style={{ fontSize: '0.7rem', color: '#BF5700', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          Computed Metrics
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
          <MetricResult label="AVG" value={fmt3(computed.avg)} tier="free" />
          <MetricResult label="OBP" value={fmt3(computed.obp)} tier="free" />
          <MetricResult label="SLG" value={fmt3(computed.slg)} tier="free" />
          <MetricResult label="OPS" value={fmt3(computed.ops)} tier="free" />
          <MetricResult label="ISO" value={fmt3(computed.iso)} tier="free" />
          <MetricResult label="BABIP" value={fmt3(computed.babip)} tier="free" />
          <MetricResult label="K%" value={fmtPct(computed.kPct)} tier="free" />
          <MetricResult label="BB%" value={fmtPct(computed.bbPct)} tier="free" />
          <MetricResult label="Contact Rate" value={fmtPct(computed.contact)} tier="free" />
          <MetricResult label="Plate Discipline" value={fmt3(computed.discipline)} tier="free" />
          <MetricResult label="wOBA" value={fmt3(computed.woba)} tier="pro" />
          <MetricResult label="wRC+" value={fmtInt(computed.wrcPlus)} tier="pro" />
          <MetricResult label="OPS+" value={fmtInt(computed.opsPlus)} tier="pro" />
          <MetricResult label="LW Runs" value={computed.lwr.toFixed(1)} tier="pro" />
          <MetricResult label="eBA" value={fmt3(computed.eBA)} tier="pro" />
          <MetricResult label="eSLG" value={fmt3(computed.eSLG)} tier="pro" />
          <MetricResult label="ewOBA" value={fmt3(computed.eWOBA)} tier="pro" />
        </div>
      </div>

      {/* Formula reference */}
      <div>
        <div style={{ fontSize: '0.7rem', color: '#BF5700', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          Formula Reference
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {BATTING_CARDS.map(card => (
            <FormulaCardView
              key={card.id}
              card={card}
              isOpen={openCard === card.id}
              onToggle={() => setOpenCard(prev => prev === card.id ? null : card.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pitching Calculator
// ---------------------------------------------------------------------------

function PitchingCalculator() {
  const [ip, setIp] = useState(32.1);
  const [h, setH] = useState(28);
  const [er, setEr] = useState(11);
  const [hr, setHr] = useState(3);
  const [bb, setBb] = useState(8);
  const [hbp, setHbp] = useState(2);
  const [so, setSo] = useState(41);
  const [g, setG] = useState(7);
  const [gs, setGs] = useState(7);
  const [last7d, setLast7d] = useState(1);
  const [fb, setFb] = useState(45);
  const [parkFactor, setParkFactor] = useState(1.0);
  const [openCard, setOpenCard] = useState<string | null>(null);

  const computed = useMemo(() => {
    const era = ip > 0 ? (er * 9) / ip : 0;
    const whip = ip > 0 ? (h + bb) / ip : 0;
    const k9 = calculateK9(so, ip);
    const bb9 = calculateBB9(bb, ip);
    const hr9 = calculateHR9(hr, ip);
    const kbb = calculateKBB(so, bb);
    const fip = calculateFIP(hr, bb, hbp, so, ip, D1_LEAGUE.fipConstant);
    const xfip = D1_LEAGUE.hrFBRate ? calculateXFIP(fb, D1_LEAGUE.hrFBRate, bb, hbp, so, ip, D1_LEAGUE.fipConstant) : null;
    const eraminus = calculateERAMinus(era, D1_LEAGUE.era, parkFactor);
    const lobpct = calculateLOBPct(h, bb, hbp, er, hr);
    const siera = calculateSIERALite(so, bb, hr, ip);
    const workload = calculateWorkloadScore(g, gs, ip, last7d);
    return { era, whip, k9, bb9, hr9, kbb, fip, xfip, eraminus, lobpct, siera, workload };
  }, [ip, h, er, hr, bb, hbp, so, g, gs, last7d, fb, parkFactor]);

  const fmt2 = (n: number) => n.toFixed(2);
  const fmt1 = (n: number) => n.toFixed(1);
  const fmtPct = (n: number) => (n * 100).toFixed(1) + '%';
  const fmtInt = (n: number) => Math.round(n).toString();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: '#1A1A1A', borderRadius: '8px', border: '1px solid rgba(191,87,0,0.2)', padding: '1rem' }}>
        <div style={{ fontSize: '0.7rem', color: '#BF5700', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          Raw Inputs
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <NumInput label="IP" value={ip} onChange={setIp} step={0.1} />
          <NumInput label="H" value={h} onChange={setH} />
          <NumInput label="ER" value={er} onChange={setEr} />
          <NumInput label="HR" value={hr} onChange={setHr} />
          <NumInput label="BB" value={bb} onChange={setBb} />
          <NumInput label="HBP" value={hbp} onChange={setHbp} />
          <NumInput label="SO" value={so} onChange={setSo} />
          <NumInput label="G" value={g} onChange={setG} />
          <NumInput label="GS" value={gs} onChange={setGs} />
          <NumInput label="FB" value={fb} onChange={setFb} />
          <NumInput label="L7d App" value={last7d} onChange={setLast7d} />
          <NumInput label="PF" value={parkFactor} onChange={setParkFactor} step={0.01} min={0.5} />
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.7rem', color: '#BF5700', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          Computed Metrics
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
          <MetricResult label="ERA" value={fmt2(computed.era)} tier="free" />
          <MetricResult label="WHIP" value={fmt2(computed.whip)} tier="free" />
          <MetricResult label="K/9" value={fmt1(computed.k9)} tier="free" />
          <MetricResult label="BB/9" value={fmt1(computed.bb9)} tier="free" />
          <MetricResult label="HR/9" value={fmt1(computed.hr9)} tier="free" />
          <MetricResult label="K/BB" value={fmt2(computed.kbb)} tier="free" />
          <MetricResult label="FIP" value={fmt2(computed.fip)} tier="pro" />
          <MetricResult label="xFIP" value={computed.xfip !== null ? fmt2(computed.xfip) : '—'} tier="pro" />
          <MetricResult label="ERA−" value={fmtInt(computed.eraminus)} tier="pro" />
          <MetricResult label="LOB%" value={fmtPct(computed.lobpct)} tier="pro" />
          <MetricResult label="SIERA-Lite" value={fmt2(computed.siera)} tier="pro" />
          <MetricResult label="Workload" value={fmtInt(computed.workload)} tier="free" />
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.7rem', color: '#BF5700', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          Formula Reference
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {PITCHING_CARDS.map(card => (
            <FormulaCardView
              key={card.id}
              card={card}
              isOpen={openCard === card.id}
              onToggle={() => setOpenCard(prev => prev === card.id ? null : card.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function PlaygroundMetrics() {
  const [tab, setTab] = useState<'batting' | 'pitching'>('batting');

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
        {(['batting', 'pitching'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 18px', borderRadius: '4px', cursor: 'pointer',
              fontFamily: 'Oswald, sans-serif', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em',
              background: tab === t ? 'rgba(191,87,0,0.2)' : 'transparent',
              border: tab === t ? '1px solid #BF5700' : '1px solid rgba(191,87,0,0.2)',
              color: tab === t ? '#FAF8F5' : 'rgba(250,248,245,0.5)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'batting' ? <BattingCalculator /> : <PitchingCalculator />}
    </div>
  );
}
