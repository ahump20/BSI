/**
 * Branch-specific differentiators and upgrade roadmap for Blaze Sports Intel.
 * Shared between the API layer and the Next.js web client.
 */

const sharedUniqueProperties = [
  {
    key: 'data-lineage',
    title: 'Deterministic Data Lineage',
    description:
      'Every stat ingested into Blaze Sports Intel is tagged with immutable lineage metadata so analysts can trace calculations back to the raw provider payload.',
    status: 'available',
    evidence: 'Lineage hash persisted with each event in Postgres and surfaced through the observability dashboard.'
  },
  {
    key: 'sub-second-refresh',
    title: 'Sub-Second Diamond Refresh',
    description:
      'Live college baseball games stream through an Upstash-backed cache with a strict 60-second TTL cap, keeping the dugout view fresh without overloading upstream feeds.',
    status: 'available',
    evidence: 'Redis edge cache with proactive invalidation triggered by Cloudflare Workers.'
  },
  {
    key: 'compliance-shell',
    title: 'Compliance-Ready Privacy Shell',
    description:
      'CCPA/GDPR flows, NIL consent logging, and data access tooling are wired into the base stack, so every new feature inherits the same legal guardrails.',
    status: 'available',
    evidence: 'Unified privacy routes inside the App Router backed by automated audit exports.'
  }
];

const sharedUpgrades = [
  {
    key: 'mobile-scoreboard',
    title: 'Mobile Scoreboard Shell',
    description: 'Progressive web shell for NCAA Division I scoreboards with offline hydration for travel days.',
    status: 'in-progress',
    stage: 'beta',
    eta: '2025-03-15',
    priority: 1
  },
  {
    key: 'diamond-pro-workflows',
    title: 'Diamond Pro Workflow Gate',
    description: 'Feature toggles and metered paywall separating free recruiting hub from pro scouting workbenches.',
    status: 'planned',
    stage: 'ga',
    eta: '2025-04-30',
    priority: 2
  },
  {
    key: 'automated-recap-engine',
    title: 'Two-Pass Recap Engine',
    description: 'Automated recaps validated against database truth with templated fallback for fact mismatches.',
    status: 'planned',
    stage: 'experimental',
    eta: '2025-05-20',
    priority: 4
  }
];

const branchOverrides = {
  main: {
    summary: 'Production baseline for the Diamond Insights platform—stable, audited, and already feeding staff notebooks.',
    uniqueProperties: [
      {
        key: 'ncaa-base-models',
        title: 'NCAA Baseball Model Pack',
        description:
          'Elastic run prevention, exit velocity clustering, and opponent-adjusted win expectancy tuned for SEC, ACC, and Big 12 schedules.',
        status: 'available',
        evidence: 'Model versions locked in ML metadata store with weekly drift reports.'
      }
    ],
    upgrades: [
      {
        key: 'pro-scout-export',
        title: 'Pro Scout CSV Exports',
        description: 'Diamond Pro users pull consolidated TrackMan + Synergy cuts in a single export.',
        status: 'planned',
        stage: 'beta',
        eta: '2025-03-22',
        priority: 3
      }
    ]
  },
  staging: {
    summary: 'Pre-production sandbox where NIL tooling and ingest automation bake before shipping to Diamond Pro.',
    uniqueProperties: [
      {
        key: 'sandbox-rate-limits',
        title: 'Branch-Scoped Rate Guardrails',
        description: 'Sandbox isolates experimental APIs with throttles independent from production traffic.',
        status: 'beta',
        evidence: 'Dedicated Redis namespace keyed by branch slug.'
      }
    ],
    upgrades: [
      {
        key: 'recruiting-timeline',
        title: 'Recruiting Timeline Heatmap',
        description: 'Temporal heatmap for commitments, portal moves, and MLB draft decisions.',
        status: 'in-progress',
        stage: 'beta',
        eta: '2025-03-08',
        priority: 2
      }
    ]
  },
  'diamond-pro': {
    summary: 'Diamond Pro branch integrates payments, roster intelligence, and premium storytelling for paying subscribers.',
    uniqueProperties: [
      {
        key: 'stripe-metering',
        title: 'Stripe Metering Hooks',
        description: 'Usage metering pipeline tied to Stripe billing to protect analyst workloads.',
        status: 'beta',
        evidence: 'Webhook replay buffer with idempotent charge guards.'
      }
    ],
    upgrades: [
      {
        key: 'pro-radar-hub',
        title: 'Pro Radar Hub',
        description: 'Consolidated pitch-level visualization merging Hawkeye, TrackMan, and Synergy tagging.',
        status: 'in-progress',
        stage: 'experimental',
        eta: '2025-05-01',
        priority: 1
      }
    ]
  }
};

const defaults = {
  branch: 'main',
  includeExperimentalBranches: ['staging', 'diamond-pro', 'develop']
};

/**
 * Build branch insight payload.
 *
 * @param {string} branchName
 * @param {{ includeExperimental?: boolean }} [options]
 * @returns {{
 *   branch: string,
 *   normalizedBranch: string,
 *   summary?: string,
 *   uniqueProperties: Array<{ key: string; title: string; description: string; status: string; evidence?: string }>,
 *   upgrades: Array<{ key: string; title: string; description: string; status: string; stage: string; eta?: string; priority: number }>,
 *   lastUpdated: string,
 *   generatedAt: string,
 *   experimentalIncluded: boolean
 * }}
 */
export function getBranchInsights(branchName, options = {}) {
  const normalizedBranch = typeof branchName === 'string' && branchName.trim() !== ''
    ? branchName.trim().toLowerCase()
    : defaults.branch;

  const includeExperimental =
    options.includeExperimental === true ||
    defaults.includeExperimentalBranches.includes(normalizedBranch);

  const branchConfig = branchOverrides[normalizedBranch] ?? branchOverrides[defaults.branch] ?? {};

  const uniqueProperties = [
    ...sharedUniqueProperties,
    ...(branchConfig.uniqueProperties ?? [])
  ];

  let upgrades = [
    ...sharedUpgrades,
    ...(branchConfig.upgrades ?? [])
  ];

  if (!includeExperimental) {
    upgrades = upgrades.filter(upgrade => upgrade.stage !== 'experimental');
  }

  upgrades.sort((a, b) => a.priority - b.priority);

  return {
    branch: branchName || defaults.branch,
    normalizedBranch,
    summary: branchConfig.summary,
    uniqueProperties,
    upgrades,
    lastUpdated: '2025-02-18T00:00:00.000Z',
    generatedAt: new Date().toISOString(),
    experimentalIncluded: includeExperimental
  };
}

export const branchInsightsConfig = {
  sharedUniqueProperties,
  sharedUpgrades,
  branchOverrides,
  defaults
};

export default branchInsightsConfig;
