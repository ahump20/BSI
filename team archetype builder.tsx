import React, { useState, useMemo } from 'react';

/**
 * BSI Team Archetype Builder (TAB) v3.0
 * Route: /tools/team-archetype-builder
 * 
 * Production component for blazesportsintel.com
 * Cloudflare Workers deployment ready
 * 
 * ACADEMIC FOUNDATIONS:
 * - NFL-PAT Competency Model (Goldstein, Yusko, Scherbaum, 2013)
 * - Athletic Intelligence Quotient (Bowman et al., 2020-2024)
 * - HEXACO Personality Model (Ashton & Lee, 2007)
 * - Big Five Factor Model (Costa & McCrae, 1992)
 * - Wood et al. (2008) Authenticity Scale
 * - Kernis & Goldman (2006) Multicomponent Authenticity
 * - MLB Scouting Bureau 20-80 Makeup Grades
 * - Situational Judgment Tests (Patterson et al., 2012)
 */

// BSI Design Tokens - matches blazesportsintel.com
const tokens = {
  colors: {
    midnight: '#0D0D0D',
    charcoal: '#1A1A1A',
    slate: '#2A2A2A',
    burntOrange: '#BF5700',
    texasSoil: '#8B4513',
    ember: '#FF6B35',
    bone: '#F5F5F0',
    muted: '#9CA3AF',
    subtle: '#6B7280',
    success: '#22C55E',
    warning: '#EAB308',
    // Archetype-specific
    stabilizer: '#3B82F6',
    catalyst: '#F97316',
    processor: '#8B5CF6',
    connector: '#22C55E',
    executor: '#92400E',
    regulator: '#EC4899',
  },
  fonts: {
    display: '"Playfair Display", Georgia, serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"JetBrains Mono", monospace',
  }
};

// Academically-Grounded Psychological Archetypes
const archetypes = {
  stabilizer: {
    id: 'stabilizer',
    name: 'Stabilizer',
    color: tokens.colors.stabilizer,
    letter: 'S',
    tagline: 'Emotional Homeostasis',
    description: 'Maintains consistent performance variance under competitive stress. The psychological anchor whose presence reduces teammate anxiety and stabilizes team affect during high-leverage situations.',
    hexaco: ['Low Emotionality', 'High Conscientiousness'],
    bigFive: ['Low Neuroticism', 'High Emotional Stability'],
    nflPat: ['Stress Tolerance', 'Emotional Stability', 'Composure'],
    aiq: ['Decision Making under pressure', 'Consistent Reaction Time'],
    mlbMakeup: ['Poise', 'Composure', 'Mental Toughness'],
    proxies: [
      'WPA variance in high-leverage situations (LI > 2.0)',
      'Teammate performance correlation under pressure',
      'Post-error recovery metrics (next-play efficiency)',
      'Clutch performance splits vs. base performance'
    ],
    citations: [
      'Goldstein, Yusko, & Scherbaum (2013). NFL-PAT validation study',
      'Boone et al. (2025). Frontiers in Psychology - AIQ and NFL QBs',
      'Ashton & Lee (2007). HEXACO model development'
    ],
    exemplars: ['Tom Brady', 'Mariano Rivera', 'Tim Duncan', 'Derek Jeter']
  },
  catalyst: {
    id: 'catalyst',
    name: 'Catalyst',
    color: tokens.colors.catalyst,
    letter: 'X',
    tagline: 'Variance Generator',
    description: 'Produces high-variance outcomes that shift momentum. Comfortable with boom-or-bust performance profiles because explosive plays compensate for inconsistency. The disruptor archetype.',
    hexaco: ['High Extraversion', 'Low Conscientiousness (flexibility)'],
    bigFive: ['High Openness', 'High Extraversion'],
    nflPat: ['Risk Tolerance', 'Spontaneous Decision-Making', 'Creativity'],
    aiq: ['High Visual-Spatial Processing', 'Pattern Breaking'],
    mlbMakeup: ['Aggressiveness', 'Explosiveness', 'Instinct'],
    proxies: [
      'Big play rate (plays > 20 yards / EPA swings)',
      'Win Probability Added variance (σ WPA)',
      'Opponent adjustment necessity index',
      'Momentum shift plays per game'
    ],
    citations: [
      'Bowman et al. (2021). AIQ and MLB Visual-Spatial correlates',
      'Roberts & Woodman (2017). Personality and sport performance'
    ],
    exemplars: ['Tyreek Hill', 'Rickey Henderson', 'Kyrie Irving', 'Bo Jackson']
  },
  processor: {
    id: 'processor',
    name: 'Processor',
    color: tokens.colors.processor,
    letter: 'P',
    tagline: 'Cognitive Elite',
    description: 'Superior information processing speed and pattern recognition. Makes correct decisions faster than competition through preparation, adaptation, and real-time cognitive load management.',
    hexaco: ['High Openness to Experience'],
    bigFive: ['High Openness', 'High Conscientiousness'],
    nflPat: ['Learning Agility', 'Decision Making', 'Information Processing'],
    aiq: ['Visual-Spatial Processing', 'Learning Efficiency', 'Decision Making'],
    mlbMakeup: ['Baseball IQ', 'Aptitude', 'Feel for the Game', 'Instincts'],
    proxies: [
      'AIQ/S2 cognitive assessment scores',
      'Pre-snap adjustment success rate',
      'Pitch recognition metrics (chase rate, whiff rate)',
      'Adaptation velocity to new schemes'
    ],
    citations: [
      'Boone, Zambrotta, Manocchio, & Bowman (2025). AIQ and NFL QB performance',
      'Bowman et al. (2024). AIQ predicts MLB pitching outcomes',
      'Schneider & McGrew (2018). Cattell-Horn-Carroll cognitive theory'
    ],
    exemplars: ['Peyton Manning', 'Greg Maddux', 'Chris Paul', 'Jason Kidd']
  },
  connector: {
    id: 'connector',
    name: 'Connector',
    color: tokens.colors.connector,
    letter: 'C',
    tagline: 'Social Catalyst',
    description: 'Generates positive teammate effects measurable in on-off differentials. The social fabric that transforms individual talent into collective performance through communication and relational depth.',
    hexaco: ['High Agreeableness', 'High Extraversion', 'High Honesty-Humility'],
    bigFive: ['High Agreeableness', 'High Extraversion'],
    nflPat: ['Team Orientation', 'Communication', 'Interpersonal Effectiveness'],
    aiq: ['N/A - Social construct'],
    mlbMakeup: ['Leadership', 'Coachability', 'Clubhouse Presence'],
    proxies: [
      'Teammate on-off performance differentials',
      'Development velocity of younger players in orbit',
      'Free agent retention correlation',
      'Assist rate / secondary assists'
    ],
    citations: [
      'Kernis & Goldman (2006). Relational orientation in authenticity',
      'Wood et al. (2008). Authentic Living subscale correlates',
      'Walumbwa et al. (2008). Authentic leadership and job performance'
    ],
    exemplars: ['Jason Kelce', 'David Ross', 'Draymond Green', 'Shane Battier']
  },
  executor: {
    id: 'executor',
    name: 'Executor',
    color: tokens.colors.executor,
    letter: 'E',
    tagline: 'Relentless Consistency',
    description: 'High conscientiousness profile optimized for sustained effort and reliability. Earns trust through showing up consistently when others disappear. Outworks limitation through deliberate practice.',
    hexaco: ['High Conscientiousness', 'High Honesty-Humility'],
    bigFive: ['High Conscientiousness', 'High Agreeableness'],
    nflPat: ['Drive', 'Achievement Motivation', 'Perseverance'],
    aiq: ['Learning Efficiency', 'Consistent Reaction Time'],
    mlbMakeup: ['Work Ethic', 'Dedication', 'Hustle', 'Durability'],
    proxies: [
      'Effort metrics (sprint speed on routine plays)',
      'Consecutive games/snaps streaks',
      'Practice intensity ratings',
      'Performance consistency (low game-to-game variance)'
    ],
    citations: [
      'Costa & McCrae (1992). NEO-PI-R Conscientiousness facets',
      'Ashton & Lee (2007). HEXACO Conscientiousness definition',
      'Duckworth et al. (2007). Grit and deliberate practice'
    ],
    exemplars: ['Joe Thomas', 'Craig Biggio', 'Tim Hardaway Jr.', 'Frank Gore']
  },
  regulator: {
    id: 'regulator',
    name: 'Regulator',
    color: tokens.colors.regulator,
    letter: 'R',
    tagline: 'Pressure Seeker',
    description: 'Performance improves when stakes increase. Actively seeks high-leverage moments rather than merely tolerating them. Distinct from Stabilizer: seeks spotlight rather than providing stability.',
    hexaco: ['High Extraversion', 'Low Emotionality'],
    bigFive: ['High Extraversion', 'Low Neuroticism'],
    nflPat: ['Competitive Drive', 'Performance Under Scrutiny', 'Spotlight Affinity'],
    aiq: ['Decision Making in high-pressure scenarios'],
    mlbMakeup: ['Competitiveness', 'Confidence', 'Short Memory', 'Closer Mentality'],
    proxies: [
      'High-leverage performance premium (clutch - base)',
      'Postseason vs. regular season splits',
      'Fourth quarter / late-inning efficiency',
      'Self-nomination rate for pressure situations'
    ],
    citations: [
      'Kernis & Goldman (2006). Unbiased processing under pressure',
      'Wood et al. (2008). Authentic Living in high-stakes contexts'
    ],
    exemplars: ['Kobe Bryant', 'Mariano Rivera', 'Patrick Mahomes', 'Reggie Jackson']
  }
};

// BSI Proprietary Framework: Behavioral Authenticity Index (BAI™)
const baiFramework = {
  name: 'Behavioral Authenticity Index',
  trademark: 'BAI™',
  tagline: 'Measuring the Wake Character Leaves',
  description: `The Behavioral Authenticity Index (BAI™) operationalizes psychological authenticity for sports contexts by measuring observable behavioral consistency across situations. Built on Wood et al. (2008) and Kernis & Goldman (2006) frameworks, BAI™ captures the "wake" that character leaves in performance data.`,
  dimensions: [
    {
      name: 'Behavioral Congruence',
      code: 'BC',
      definition: 'Consistency between stated values/intentions and observable actions',
      academicBasis: 'Wood et al. (2008) Authentic Living subscale; Rogers (1961) congruence concept',
      proxies: ['Pre-game stated intent vs. actual performance', 'Interview sentiment vs. on-field behavior', 'Contract year performance stability'],
      weight: 0.30
    },
    {
      name: 'Situational Consistency',
      code: 'SC',
      definition: 'Performance variance across context types (pressure, routine, adversity)',
      academicBasis: 'Kernis & Goldman (2006) unbiased processing; Mischel & Shoda (1995) CAPS model',
      proxies: ['High vs. low leverage performance splits', 'Home/away consistency', 'Win/loss situation performance'],
      weight: 0.25
    },
    {
      name: 'Relational Integrity',
      code: 'RI',
      definition: 'Authenticity in interpersonal dynamics measurable through teammate effects',
      academicBasis: 'Kernis & Goldman (2006) relational orientation; Lopez & Rice (2006) relationship authenticity',
      proxies: ['Teammate on-off differentials', 'Younger player development velocity', 'Team chemistry indicators'],
      weight: 0.25
    },
    {
      name: 'Self-Awareness Indicators',
      code: 'SA',
      definition: 'Evidence of accurate self-perception without defensive distortion',
      academicBasis: 'Kernis & Goldman (2006) awareness component; Wood et al. (2008) Self-Alienation inverse',
      proxies: ['Interview accuracy vs. actual performance', 'Adjustment rate post-failure', 'Coaching receptivity metrics'],
      weight: 0.20
    }
  ],
  methodology: `BAI™ synthesizes four empirically-grounded dimensions derived from validated authenticity research. Unlike self-report inventories subject to social desirability bias, BAI™ relies exclusively on behavioral proxies observable in performance data. This approach aligns with Patterson et al. (2012) findings that Situational Judgment Tests demonstrate incremental validity over personality inventories (3-7%) while being less susceptible to faking.`,
  citations: [
    'Wood, A.M., Linley, P.A., Maltby, J., Baliousis, M., & Joseph, S. (2008). The authentic personality: A theoretical and empirical conceptualization. Journal of Counseling Psychology, 55(3), 385-399.',
    'Kernis, M.H. & Goldman, B.M. (2006). A multicomponent conceptualization of authenticity: Theory and research. Advances in Experimental Social Psychology, 38, 283-357.',
    'Patterson, F., et al. (2012). Evaluations of situational judgement tests to assess non-academic attributes in selection. Medical Education, 46(9), 850-868.',
    'Mischel, W. & Shoda, Y. (1995). A cognitive-affective system theory of personality. Psychological Review, 102, 246-268.',
    'Ashton, M.C. & Lee, K. (2007). Empirical, theoretical, and practical advantages of the HEXACO model. Personality and Social Psychology Review, 11(2), 150-166.'
  ]
};

// League Position Mappings with Academic Grounding
const leagues = {
  nfl: {
    id: 'nfl',
    name: 'NFL',
    fullName: 'National Football League',
    methodology: 'Based on NFL-PAT competency models (Goldstein, Yusko, Scherbaum, 2013), AIQ cognitive assessments (Bowman et al., 2020-2024), and position-specific psychological demands validated through 2013-present Combine data.',
    positions: [
      { pos: 'QB', name: 'Quarterback', primary: 'stabilizer', secondary: 'processor', rationale: 'Down 10 in the 4th, everyone watches the QB\'s face. Stress Tolerance and Decision Making are the two most predictive NFL-PAT traits for QB success. AIQ Visual-Spatial and Decision Making correlate with Passer Rating (Boone et al., 2025).', example: 'Tom Brady—Down 28-3, same body language as opening drive. AIQ and NFL-PAT profiles exemplify Stabilizer-Processor archetype.' },
      { pos: 'LT', name: 'Left Tackle', primary: 'executor', secondary: 'stabilizer', rationale: 'Joe Thomas: 10,363 consecutive snaps. Thankless consistency protecting the blind side. NFL-PAT Drive and Perseverance metrics correlate with OL performance longevity.', example: 'Joe Thomas—Pure Executor. Zero variance execution over a decade.' },
      { pos: 'C', name: 'Center', primary: 'connector', secondary: 'processor', rationale: 'Makes protection calls, communicates pre-snap reads. Cognitive demands (Processor) applied through communication hub (Connector). NFL-PAT Team Orientation essential.', example: 'Jason Kelce—Eagles O-line works because he\'s the communication hub.' },
      { pos: 'WR1', name: 'Wide Receiver (X)', primary: 'catalyst', secondary: 'regulator', rationale: 'High variance tolerated for explosive production. NFL-PAT Risk Tolerance and Spontaneous Decision-Making correlate with big-play receivers.', example: 'Tyreek Hill—Maximum Catalyst variance, seeks the spotlight in crucial moments.' },
      { pos: 'RB', name: 'Running Back', primary: 'executor', secondary: 'catalyst', rationale: 'Short career, high contact. Every carry costs. Executor mentality extends the window; Catalyst burst creates yards after contact.', example: 'Frank Gore—16 seasons of 4.3 YPC. Showed up, kept running.' },
      { pos: 'EDGE', name: 'Edge Rusher', primary: 'catalyst', secondary: 'regulator', rationale: 'Pass rush is inherently high-variance. Comfortable with 3 quiet quarters if you get 2 sacks in the 4th. Seeks the sack moment.', example: 'Von Miller, Super Bowl 50—Catalyst energy, Regulator mentality when stakes rose.' },
      { pos: 'MLB', name: 'Middle Linebacker', primary: 'connector', secondary: 'processor', rationale: 'Defensive quarterback. NFL-PAT Communication and Information Processing are highest-weighted traits for MLB evaluation.', example: 'Ray Lewis—Elite Connector communication getting defense aligned; Processor reading offenses.' },
      { pos: 'CB1', name: 'Cornerback', primary: 'regulator', secondary: 'stabilizer', rationale: 'Isolated on an island. Needs short memory (Stabilizer security) but must want the WR1 matchup (Regulator pressure-seeking).', example: 'Darrelle Revis—Asked for the best receiver. Regulator mentality, Stabilizer composure.' },
      { pos: 'FS', name: 'Free Safety', primary: 'stabilizer', secondary: 'processor', rationale: 'Last line. One wrong read equals touchdown. Must have security (Stabilizer) and cognitive processing (Processor) to diagnose.', example: 'Ed Reed—Studied so he could trust his instincts. Preparation bred security.' }
    ]
  },
  mlb: {
    id: 'mlb',
    name: 'MLB',
    fullName: 'Major League Baseball',
    methodology: 'Based on MLB Scouting Bureau 20-80 makeup grades, AIQ validation studies (Bowman et al., 2021, 2024) showing Visual-Spatial correlates with hitting and Reaction Time with pitching outcomes, and traditional scouting intangibles literature.',
    positions: [
      { pos: 'C', name: 'Catcher', primary: 'connector', secondary: 'stabilizer', rationale: 'Runs the pitching staff, calls the game. Faces the entire field—if the catcher is rattled, everyone sees it. MLB makeup grades emphasize Leadership and Poise.', example: 'Yadier Molina—Cardinals staff ERA differential with/without him is the most studied Connector effect in baseball.' },
      { pos: 'SP', name: 'Starting Pitcher', primary: 'stabilizer', secondary: 'processor', rationale: 'Gets the ball in October. Must maintain composure through bad calls, early deficits. MLB makeup reports focus on mound presence. AIQ Reaction Time predicts ERA (Bowman et al., 2024).', example: 'Madison Bumgarner, 2014 postseason—Same body language in Game 7 as spring training.' },
      { pos: 'CL', name: 'Closer', primary: 'regulator', secondary: 'stabilizer', rationale: 'Must actively want the 9th inning rather than merely tolerate it. Failed closer conversions often stem from misdiagnosing Stabilizers as Regulators.', example: 'Mariano Rivera—Never looked like he was anywhere but exactly where he belonged.' },
      { pos: 'SS', name: 'Shortstop', primary: 'connector', secondary: 'processor', rationale: 'Field general. Positions outfielders, controls defensive tempo. Leadership is structural—the SS makes the defense function.', example: 'Derek Jeter—The "flip play" in 2001 ALDS. Elite Processor instincts, elite Connector awareness.' },
      { pos: 'CF', name: 'Center Field', primary: 'catalyst', secondary: 'connector', rationale: 'Commands outfield communication (Connector) while covering maximum ground with explosive athleticism (Catalyst). AIQ Visual-Spatial correlates with range metrics.', example: 'Willie Mays—"Say Hey Kid" captured Connector energy with Catalyst tools.' },
      { pos: '2B', name: 'Second Base', primary: 'executor', secondary: 'connector', rationale: 'Middle infield demands consistency. Takes the throw with a runner sliding in. Rarely the star, always the glue.', example: 'Dustin Pedroia—Undersized, never stopped competing, made the double play turn nobody else would attempt.' },
      { pos: 'DH', name: 'Designated Hitter', primary: 'regulator', secondary: 'catalyst', rationale: 'Pure offensive role. Must produce in high-leverage at-bats without defensive engagement to stay in rhythm.', example: 'David Ortiz—Big Papi in October is the Regulator archetype applied to hitting.' }
    ]
  },
  nba: {
    id: 'nba',
    name: 'NBA',
    fullName: 'National Basketball Association',
    methodology: 'Based on AIQ validation studies (Bowman et al., 2023) showing cognitive abilities predict PER and eFG% beyond draft placement, NBA Combine psychiatric evaluations, and ecological dynamics research on basketball decision-making.',
    positions: [
      { pos: 'PG', name: 'Point Guard', primary: 'processor', secondary: 'connector', rationale: 'Floor general. AIQ Decision Making and Visual-Spatial Processing correlate with assist rate and turnover avoidance. Must process defensive schemes in real-time while facilitating teammates.', example: 'Chris Paul—Elite Processor of defensive schemes, Connector who elevates every roster.' },
      { pos: 'SG', name: 'Shooting Guard', primary: 'regulator', secondary: 'catalyst', rationale: 'Primary scoring option in clutch situations. Must want the ball with the game on the line (Regulator) while providing explosive offensive variance (Catalyst).', example: 'Kobe Bryant—Defined by seeking pressure moments. "I want to take that shot."' },
      { pos: 'SF', name: 'Small Forward', primary: 'catalyst', secondary: 'executor', rationale: 'Modern SF is the versatility position. Catalyst athleticism and shot creation balanced with Executor defensive consistency and effort.', example: 'LeBron James—Catalyst playmaking with Executor-level defensive effort and durability.' },
      { pos: 'PF', name: 'Power Forward', primary: 'executor', secondary: 'connector', rationale: 'Dirty work: screens, rebounds, help defense. Executor consistency on unglamorous tasks. Modern stretch-4 adds Connector spacing.', example: 'Tim Duncan—Fundamental Executor. "The Big Fundamental" earned through consistency.' },
      { pos: 'C', name: 'Center', primary: 'stabilizer', secondary: 'connector', rationale: 'Rim protection anchors defense psychologically. When the center is rattled, help defense breaks down. Must communicate (Connector) while maintaining presence (Stabilizer).', example: 'Rudy Gobert—Defensive anchor whose presence changes opponent shot selection.' }
    ]
  }
};

// Composition Calculator
const calculateComposition = (positions) => {
  const counts = {};
  Object.keys(archetypes).forEach(a => counts[a] = 0);
  positions.forEach(p => {
    counts[p.primary] += 1;
    counts[p.secondary] += 0.4;
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return Object.entries(counts)
    .map(([key, count]) => ({ archetype: key, percentage: (count / total) * 100, count }))
    .sort((a, b) => b.percentage - a.percentage);
};

// Components
const ArchetypeBadge = ({ type, isPrimary = false, size = 'default' }) => {
  const arch = archetypes[type];
  const sizeClasses = size === 'small' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded font-medium ${sizeClasses}`}
      style={{ 
        backgroundColor: arch.color + (isPrimary ? '25' : '15'),
        color: isPrimary ? arch.color : tokens.colors.muted,
        border: isPrimary ? `1px solid ${arch.color}40` : '1px solid transparent'
      }}>
      <span className="w-4 h-4 rounded flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: arch.color, color: '#fff' }}>{arch.letter}</span>
      {arch.name}
    </span>
  );
};

const CompositionBar = ({ positions }) => {
  const composition = useMemo(() => calculateComposition(positions), [positions]);
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: tokens.colors.charcoal }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tokens.colors.success }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: tokens.colors.burntOrange }}>
          Optimal Composition
        </span>
      </div>
      <div className="flex h-3 rounded overflow-hidden mb-3" style={{ backgroundColor: tokens.colors.midnight }}>
        {composition.filter(c => c.percentage > 0).map(({ archetype, percentage }) => (
          <div key={archetype} className="transition-all"
            style={{ backgroundColor: archetypes[archetype].color, width: `${percentage}%` }}
            title={`${archetypes[archetype].name}: ${percentage.toFixed(1)}%`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {composition.filter(c => c.percentage > 5).map(({ archetype, percentage }) => (
          <div key={archetype} className="flex items-center gap-1.5 text-xs" style={{ color: tokens.colors.muted }}>
            <div className="w-2 h-2 rounded" style={{ backgroundColor: archetypes[archetype].color }} />
            <span>{archetypes[archetype].name}</span>
            <span style={{ color: tokens.colors.subtle }}>{percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ArchetypeCard = ({ archetype, isSelected, onSelect, onDetail }) => {
  const arch = archetypes[archetype];
  return (
    <button onClick={() => onSelect(isSelected ? null : archetype)}
      className="p-3 rounded-lg text-left transition-all w-full"
      style={{ 
        backgroundColor: isSelected ? arch.color + '15' : tokens.colors.midnight,
        border: isSelected ? `1px solid ${arch.color}40` : '1px solid transparent'
      }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: arch.color, color: '#fff' }}>{arch.letter}</span>
        <span className="text-sm font-medium" style={{ color: tokens.colors.bone }}>{arch.name}</span>
      </div>
      <p className="text-xs mb-2" style={{ color: tokens.colors.subtle }}>{arch.tagline}</p>
      {isSelected && (
        <button onClick={(e) => { e.stopPropagation(); onDetail(archetype); }}
          className="text-xs font-medium" style={{ color: tokens.colors.burntOrange }}>
          View Research →
        </button>
      )}
    </button>
  );
};

const PositionRow = ({ position, isExpanded, onToggle }) => {
  const primaryArch = archetypes[position.primary];
  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: tokens.colors.charcoal }}>
      <button onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/5 transition-colors">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
          style={{ backgroundColor: primaryArch.color, color: '#fff' }}>{position.pos}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate" style={{ color: tokens.colors.bone }}>{position.name}</h3>
          <div className="flex gap-2 mt-1.5">
            <ArchetypeBadge type={position.primary} isPrimary={true} size="small" />
            <ArchetypeBadge type={position.secondary} size="small" />
          </div>
        </div>
        <span style={{ color: tokens.colors.subtle }}>{isExpanded ? '−' : '+'}</span>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="pt-4" style={{ borderTop: `1px solid ${tokens.colors.slate}` }}>
            <p className="text-sm leading-relaxed mb-3" style={{ color: tokens.colors.muted }}>{position.rationale}</p>
            <div className="flex items-start gap-2">
              <span className="text-xs" style={{ color: tokens.colors.subtle }}>Example:</span>
              <span className="text-sm" style={{ color: primaryArch.color }}>{position.example}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BAIPanel = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={onClose}>
    <div className="rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: tokens.colors.charcoal }} onClick={e => e.stopPropagation()}>
      <div className="p-6" style={{ borderBottom: `1px solid ${tokens.colors.slate}` }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded" 
                style={{ backgroundColor: tokens.colors.burntOrange + '20', color: tokens.colors.burntOrange }}>
                BSI Proprietary
              </span>
            </div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: tokens.fonts.display, color: tokens.colors.bone }}>
              {baiFramework.name} <span style={{ color: tokens.colors.burntOrange }}>{baiFramework.trademark}</span>
            </h2>
            <p className="text-sm mt-1" style={{ color: tokens.colors.muted }}>{baiFramework.tagline}</p>
          </div>
          <button onClick={onClose} className="text-2xl" style={{ color: tokens.colors.subtle }}>×</button>
        </div>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: tokens.colors.muted }}>{baiFramework.description}</p>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: tokens.colors.subtle }}>Four Dimensions</h3>
          <div className="space-y-3">
            {baiFramework.dimensions.map((dim, i) => (
              <div key={i} className="rounded-lg p-4" style={{ backgroundColor: tokens.colors.midnight }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: tokens.colors.burntOrange, color: '#fff' }}>{dim.code}</span>
                    <span className="font-medium" style={{ color: tokens.colors.bone }}>{dim.name}</span>
                  </div>
                  <span className="text-xs" style={{ color: tokens.colors.subtle }}>{(dim.weight * 100).toFixed(0)}%</span>
                </div>
                <p className="text-sm mb-2" style={{ color: tokens.colors.muted }}>{dim.definition}</p>
                <p className="text-xs italic mb-2" style={{ color: tokens.colors.subtle }}>{dim.academicBasis}</p>
                <div className="flex flex-wrap gap-1">
                  {dim.proxies.map((proxy, j) => (
                    <span key={j} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: tokens.colors.slate, color: tokens.colors.muted }}>{proxy}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: tokens.colors.midnight, borderLeft: `3px solid ${tokens.colors.burntOrange}` }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: tokens.colors.subtle }}>Methodology Note</h3>
          <p className="text-sm" style={{ color: tokens.colors.muted }}>{baiFramework.methodology}</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: tokens.colors.subtle }}>Academic Citations</h3>
          <ul className="space-y-1">
            {baiFramework.citations.map((cite, i) => (
              <li key={i} className="text-xs" style={{ color: tokens.colors.subtle }}>• {cite}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const ArchetypeDetailModal = ({ archetypeId, onClose }) => {
  const arch = archetypes[archetypeId];
  if (!arch) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={onClose}>
      <div className="rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: tokens.colors.charcoal }} onClick={e => e.stopPropagation()}>
        <div className="p-6" style={{ borderBottom: `1px solid ${tokens.colors.slate}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold"
                style={{ backgroundColor: arch.color, color: '#fff' }}>{arch.letter}</div>
              <div>
                <h2 className="text-2xl font-bold" style={{ fontFamily: tokens.fonts.display, color: tokens.colors.bone }}>{arch.name}</h2>
                <p className="text-sm" style={{ color: arch.color }}>{arch.tagline}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-2xl" style={{ color: tokens.colors.subtle }}>×</button>
          </div>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: tokens.colors.muted }}>{arch.description}</p>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: tokens.colors.subtle }}>HEXACO Traits</h4>
              <div className="flex flex-wrap gap-1">{arch.hexaco.map(t => <span key={t} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: tokens.colors.midnight, color: tokens.colors.muted }}>{t}</span>)}</div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: tokens.colors.subtle }}>Big Five</h4>
              <div className="flex flex-wrap gap-1">{arch.bigFive.map(t => <span key={t} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: tokens.colors.midnight, color: tokens.colors.muted }}>{t}</span>)}</div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: tokens.colors.subtle }}>NFL-PAT Competencies</h4>
            <div className="flex flex-wrap gap-1">{arch.nflPat.map(t => <span key={t} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: tokens.colors.midnight, color: tokens.colors.muted }}>{t}</span>)}</div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: tokens.colors.subtle }}>AIQ Cognitive Correlates</h4>
            <div className="flex flex-wrap gap-1">{arch.aiq.map(t => <span key={t} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: tokens.colors.midnight, color: tokens.colors.muted }}>{t}</span>)}</div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: tokens.colors.subtle }}>MLB Makeup Grades</h4>
            <div className="flex flex-wrap gap-1">{arch.mlbMakeup.map(t => <span key={t} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: tokens.colors.midnight, color: tokens.colors.muted }}>{t}</span>)}</div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: tokens.colors.subtle }}>Measurable Proxies</h4>
            <ul className="space-y-1">{arch.proxies.map((p, i) => <li key={i} className="flex items-start gap-2 text-sm" style={{ color: tokens.colors.muted }}><span style={{ color: arch.color }}>→</span>{p}</li>)}</ul>
          </div>
          <div className="rounded-lg p-4" style={{ backgroundColor: tokens.colors.midnight }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: tokens.colors.subtle }}>Academic Citations</h4>
            <ul className="space-y-1">{arch.citations.map((c, i) => <li key={i} className="text-xs" style={{ color: tokens.colors.subtle }}>• {c}</li>)}</ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: tokens.colors.subtle }}>Historical Exemplars</h4>
            <div className="flex flex-wrap gap-2">{arch.exemplars.map(name => <span key={name} className="px-3 py-1.5 rounded text-sm font-medium" style={{ backgroundColor: arch.color + '20', color: arch.color }}>{name}</span>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function BSITeamArchetypeBuilder() {
  const [league, setLeague] = useState('nfl');
  const [expandedPos, setExpandedPos] = useState(null);
  const [selectedArchetype, setSelectedArchetype] = useState(null);
  const [detailArchetype, setDetailArchetype] = useState(null);
  const [showBAI, setShowBAI] = useState(false);

  const currentLeague = leagues[league];
  const positions = currentLeague.positions;
  const filteredPositions = selectedArchetype 
    ? positions.filter(p => p.primary === selectedArchetype || p.secondary === selectedArchetype)
    : positions;

  return (
    <div className="min-h-screen" style={{ backgroundColor: tokens.colors.midnight, fontFamily: tokens.fonts.body }}>
      <header style={{ borderBottom: `1px solid ${tokens.colors.slate}` }}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tokens.colors.success }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: tokens.colors.burntOrange }}>Interactive Tool</span>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: tokens.fonts.display, color: tokens.colors.bone }}>
            Team Archetype <span style={{ color: tokens.colors.burntOrange }}>Builder</span>
          </h1>
          <p style={{ color: tokens.colors.muted }} className="text-sm max-w-2xl">
            Position-by-position psychological profiles grounded in NFL-PAT competency models, AIQ cognitive assessments, HEXACO/Big Five personality research, and MLB scouting makeup grades.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            {Object.entries(leagues).map(([key, data]) => (
              <button key={key} onClick={() => { setLeague(key); setExpandedPos(null); setSelectedArchetype(null); }}
                className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
                style={{ backgroundColor: league === key ? tokens.colors.burntOrange : tokens.colors.charcoal, color: league === key ? '#fff' : tokens.colors.muted }}>
                {data.name}
              </button>
            ))}
          </div>
          <button onClick={() => setShowBAI(true)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ backgroundColor: tokens.colors.midnight, border: `1px solid ${tokens.colors.burntOrange}`, color: tokens.colors.burntOrange }}>
            BAI™ Framework
          </button>
        </div>

        <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: tokens.colors.charcoal, borderLeft: `3px solid ${tokens.colors.burntOrange}`, color: tokens.colors.muted }}>
          <span className="font-semibold" style={{ color: tokens.colors.bone }}>Methodology: </span>{currentLeague.methodology}
        </div>

        <CompositionBar positions={positions} />

        <div className="rounded-lg p-4" style={{ backgroundColor: tokens.colors.charcoal }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: tokens.colors.muted }}>Psychological Archetypes</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.keys(archetypes).map(key => (
              <ArchetypeCard key={key} archetype={key} isSelected={selectedArchetype === key} onSelect={setSelectedArchetype} onDetail={setDetailArchetype} />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: tokens.colors.subtle }}>
              {filteredPositions.length} Position{filteredPositions.length !== 1 ? 's' : ''}
              {selectedArchetype && <span style={{ color: tokens.colors.muted }}> matching {archetypes[selectedArchetype].name}</span>}
            </h3>
            {selectedArchetype && <button onClick={() => setSelectedArchetype(null)} className="text-xs" style={{ color: tokens.colors.burntOrange }}>Clear Filter</button>}
          </div>
          {filteredPositions.map(pos => (
            <PositionRow key={pos.pos} position={pos} isExpanded={expandedPos === pos.pos} onToggle={() => setExpandedPos(expandedPos === pos.pos ? null : pos.pos)} />
          ))}
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: tokens.colors.charcoal }}>
          <h3 className="text-lg font-bold mb-3" style={{ fontFamily: tokens.fonts.display, color: tokens.colors.bone }}>The Construction Principle</h3>
          <p className="text-sm leading-relaxed mb-4" style={{ color: tokens.colors.muted }}>
            Championship rosters aren't built by stacking one archetype. They're built by understanding which positions demand <strong style={{ color: tokens.colors.bone }}>emotional homeostasis</strong> (Stabilizer), which benefit from <strong style={{ color: tokens.colors.bone }}>social catalyst energy</strong> (Connector), where you need <strong style={{ color: tokens.colors.bone }}>cognitive processing speed</strong> (Processor), and where you can afford <strong style={{ color: tokens.colors.bone }}>high-variance explosive players</strong> (Catalyst).
          </p>
          <div className="rounded-lg p-4" style={{ backgroundColor: tokens.colors.midnight, borderLeft: `3px solid ${tokens.colors.burntOrange}` }}>
            <p className="text-sm italic" style={{ color: tokens.colors.subtle }}>
              "You can't measure character directly. But you can measure the wake it leaves: teammate splits, pressure performance, comeback win rate, clubhouse retention, development velocity of young players in their orbit."
            </p>
            <p className="text-xs mt-2" style={{ color: tokens.colors.burntOrange }}>— BSI Behavioral Authenticity Framework</p>
          </div>
        </div>

        <footer className="text-center py-8" style={{ borderTop: `1px solid ${tokens.colors.slate}` }}>
          <p className="text-xs mb-1" style={{ color: tokens.colors.burntOrange }}>Born to Blaze the Path Less Beaten</p>
          <p className="text-xs mb-2" style={{ color: tokens.colors.subtle }}>© 2025 Blaze Sports Intel</p>
          <p className="text-xs" style={{ color: tokens.colors.subtle }}>
            Sources: NFL-PAT (Goldstein et al., 2013), AIQ (Bowman et al., 2020-2024), HEXACO (Ashton & Lee, 2007), Wood et al. (2008) Authenticity Scale
          </p>
        </footer>
      </main>

      {detailArchetype && <ArchetypeDetailModal archetypeId={detailArchetype} onClose={() => setDetailArchetype(null)} />}
      {showBAI && <BAIPanel onClose={() => setShowBAI(false)} />}
    </div>
  );
}
