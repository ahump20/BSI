import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Methodology | College Baseball Savant | BSI',
  description:
    'How BSI computes park-adjusted college baseball sabermetrics — wOBA linear weights, wRC+ normalization, FIP constants, park factor regression, and conference strength indexing for every D1 program.',
  alternates: { canonical: '/college-baseball/savant/methodology' },
  openGraph: {
    title: 'Methodology | College Baseball Savant',
    description:
      'How BSI computes wOBA, wRC+, FIP, park factors, and conference strength for every D1 program.',
    images: ogImage('/images/og-college-baseball.png'),
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'BSI Savant Methodology — Park-Adjusted College Baseball Sabermetrics',
  description:
    'How BSI computes wOBA, wRC+, FIP, ERA-, park factors, and conference strength for every D1 program using Tango-methodology linear weights.',
  author: {
    '@type': 'Person',
    name: 'Austin Humphrey',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Blaze Sports Intel',
    url: 'https://blazesportsintel.com',
  },
  datePublished: '2026-03-16',
  url: 'https://blazesportsintel.com/college-baseball/savant/methodology/',
  about: {
    '@type': 'Dataset',
    name: 'BSI College Baseball Sabermetrics',
    description: 'Park-adjusted advanced metrics for every D1 college baseball programs',
    license: 'https://blazesportsintel.com/terms/',
  },
};

export default function MethodologyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-scoreboard, #0A0A0A)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs mb-6" style={{ fontFamily: 'var(--bsi-font-data, monospace)', color: 'var(--bsi-dust, #C4B8A5)' }}>
          <a href="/" className="hover:underline" style={{ color: 'var(--heritage-columbia-blue, #4B9CD3)' }}>Home</a>
          <span>/</span>
          <a href="/college-baseball" className="hover:underline" style={{ color: 'var(--heritage-columbia-blue, #4B9CD3)' }}>College Baseball</a>
          <span>/</span>
          <a href="/college-baseball/savant" className="hover:underline" style={{ color: 'var(--heritage-columbia-blue, #4B9CD3)' }}>Savant</a>
          <span>/</span>
          <span style={{ color: 'var(--bsi-primary, #BF5700)' }}>Methodology</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <p
            className="heritage-stamp text-xs tracking-[0.2em] mb-3"
            style={{ color: 'var(--bsi-primary, #BF5700)' }}
          >
            BSI SAVANT
          </p>
          <h1
            className="font-oswald uppercase text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide mb-4"
            style={{ color: 'var(--bsi-bone, #F5F2EB)' }}
          >
            Methodology
          </h1>
          <p
            className="font-cormorant text-lg sm:text-xl leading-relaxed max-w-2xl"
            style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
          >
            How BSI computes park-adjusted sabermetrics for every D1 college baseball
            programs. Every number on the Savant Explorer traces back to a specific
            methodology documented here.
          </p>
        </header>

        {/* Pipeline Overview */}
        <section className="mb-12">
          <h2
            className="font-oswald uppercase text-xl tracking-wider mb-4"
            style={{ color: 'var(--bsi-bone, #F5F2EB)' }}
          >
            Data Pipeline
          </h2>
          <div
            className="heritage-card p-6 mb-6"
            style={{ background: 'var(--surface-dugout, #161616)', border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))' }}
          >
            <div
              className="font-mono text-sm leading-relaxed"
              style={{ color: 'var(--heritage-columbia-blue, #4B9CD3)' }}
            >
              ESPN Box Scores → Highlightly Pro (330 teams) → BSI Ingest Worker → D1 Raw Stats → BSI Savant Compute (6h cycle) → Advanced Metrics in D1 → KV Cache → Savant API → You
            </div>
            <p
              className="font-cormorant mt-4 text-sm"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              Every 6 hours, the Savant Compute engine pulls raw box score data,
              applies Tango-methodology linear weights, regresses park factors,
              computes conference-adjusted metrics, and writes the results to long-term
              storage. The API serves cached reads with a 5-minute refresh window.
            </p>
          </div>
        </section>

        {/* wOBA */}
        <section className="mb-12">
          <h2
            className="font-oswald uppercase text-xl tracking-wider mb-4"
            style={{ color: 'var(--bsi-bone, #F5F2EB)' }}
          >
            wOBA — Weighted On-Base Average
          </h2>
          <div
            className="heritage-card p-6"
            style={{ background: 'var(--surface-dugout, #161616)', border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))' }}
          >
            <p
              className="font-cormorant mb-4"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              wOBA assigns run values to each offensive outcome based on how much
              each event contributes to scoring. A home run is worth more than a
              single, and wOBA captures that gap precisely.
            </p>
            <div
              className="font-mono text-sm p-4 mb-4"
              style={{ background: 'var(--surface-press-box, #111111)', color: 'var(--heritage-columbia-blue, #4B9CD3)' }}
            >
              wOBA = (0.69×BB + 0.72×HBP + 0.89×1B + 1.27×2B + 1.62×3B + 2.10×HR) / (AB + BB + SF + HBP)
            </div>
            <p
              className="font-cormorant mb-3"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              <strong style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>BSI adaptation for college baseball:</strong>{' '}
              The weights above are derived from Tom Tango&apos;s linear weight methodology
              as applied to MLB run environments. College baseball has a higher run
              environment (~5.5 runs/game vs. ~4.5 in MLB), so BSI recalibrates
              the wOBA scale factor annually to normalize to the D1 OBP baseline.
            </p>
            <p
              className="font-cormorant"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              <strong style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>Stabilization:</strong>{' '}
              ~150 plate appearances. Below this threshold, BSI displays the value
              with a sample-size indicator. The metric is most reliable after
              conference play begins (Week 6+).
            </p>
          </div>
        </section>

        {/* wRC+ */}
        <section className="mb-12">
          <h2
            className="font-oswald uppercase text-xl tracking-wider mb-4"
            style={{ color: 'var(--bsi-bone, #F5F2EB)' }}
          >
            wRC+ — Weighted Runs Created Plus
          </h2>
          <div
            className="heritage-card p-6"
            style={{ background: 'var(--surface-dugout, #161616)', border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))' }}
          >
            <p
              className="font-cormorant mb-4"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              wRC+ answers the question: &ldquo;How productive is this hitter compared
              to the league average, adjusted for park and conference?&rdquo; 100 is
              average. 120 means 20% better than average. 80 means 20% worse.
            </p>
            <p
              className="font-cormorant mb-3"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              <strong style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>Why it matters for college baseball:</strong>{' '}
              A .350 hitter at a bandbox in the Big South is not the same as a .320
              hitter at Lindsey Nelson Stadium in the SEC. wRC+ strips away the park
              and conference context to give you a true comparison. It is the single
              best cross-conference batting metric.
            </p>
            <p
              className="font-cormorant"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              <strong style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>Stabilization:</strong>{' '}
              ~200 plate appearances. Most reliable in the second half of the season.
            </p>
          </div>
        </section>

        {/* FIP */}
        <section className="mb-12">
          <h2
            className="font-oswald uppercase text-xl tracking-wider mb-4"
            style={{ color: 'var(--bsi-bone, #F5F2EB)' }}
          >
            FIP — Fielding Independent Pitching
          </h2>
          <div
            className="heritage-card p-6"
            style={{ background: 'var(--surface-dugout, #161616)', border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))' }}
          >
            <p
              className="font-cormorant mb-4"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              ERA tells you what happened. FIP tells you what the pitcher actually
              controlled. By isolating strikeouts, walks, hit-by-pitches, and home
              runs — the outcomes that don&apos;t depend on fielders — FIP is a better
              predictor of future ERA than ERA itself.
            </p>
            <div
              className="font-mono text-sm p-4 mb-4"
              style={{ background: 'var(--surface-press-box, #111111)', color: 'var(--heritage-columbia-blue, #4B9CD3)' }}
            >
              FIP = ((13×HR + 3×(BB+HBP) - 2×K) / IP) + FIP constant
            </div>
            <p
              className="font-cormorant mb-3"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              <strong style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>The FIP constant:</strong>{' '}
              BSI computes a D1-specific FIP constant each season by setting league
              FIP equal to league ERA. This centers the scale so that a 4.00 FIP
              means &ldquo;average for college baseball,&rdquo; not for MLB.
            </p>
            <p
              className="font-cormorant"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              <strong style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>Stabilization:</strong>{' '}
              ~60 innings pitched. Below this, the K/BB ratio is a more reliable
              indicator of true talent.
            </p>
          </div>
        </section>

        {/* ERA- */}
        <section className="mb-12">
          <h2
            className="font-oswald uppercase text-xl tracking-wider mb-4"
            style={{ color: 'var(--bsi-bone, #F5F2EB)' }}
          >
            ERA- — Adjusted ERA
          </h2>
          <div
            className="heritage-card p-6"
            style={{ background: 'var(--surface-dugout, #161616)', border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))' }}
          >
            <p
              className="font-cormorant"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              ERA- adjusts a pitcher&apos;s ERA for park and conference context, then
              scales to 100. Below 100 is better than average. A pitcher with 80
              ERA- allowed 20% fewer runs than the conference-adjusted average.
              This is the best cross-conference pitching comparison metric —
              a 3.50 ERA in the SEC is not the same as a 3.50 ERA in the SWAC,
              and ERA- accounts for that difference.
            </p>
          </div>
        </section>

        {/* Park Factors */}
        <section className="mb-12">
          <h2
            className="font-oswald uppercase text-xl tracking-wider mb-4"
            style={{ color: 'var(--bsi-bone, #F5F2EB)' }}
          >
            Park Factors
          </h2>
          <div
            className="heritage-card p-6"
            style={{ background: 'var(--surface-dugout, #161616)', border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))' }}
          >
            <p
              className="font-cormorant mb-4"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              Every stadium affects offense differently. BSI computes park factors by
              comparing run-scoring at each venue to the league baseline, then
              regressing toward 1.0 to account for small sample sizes.
            </p>
            <p
              className="font-cormorant mb-3"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              <strong style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>Regression toward 1.0:</strong>{' '}
              A park that shows a 1.30 runs factor over 15 games is regressed toward
              1.0 more aggressively than a park with 40 games of data. This prevents
              early-season noise from distorting player metrics. BSI uses a
              sample-size weighting function: the more games, the more the raw factor
              is trusted.
            </p>
            <p
              className="font-cormorant"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              <strong style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>Factors computed:</strong>{' '}
              Runs, hits, home runs, walks, strikeouts — each with independent
              regression rates. Currently tracking 195 D1 venues.
            </p>
          </div>
        </section>

        {/* Conference Strength Index */}
        <section className="mb-12">
          <h2
            className="font-oswald uppercase text-xl tracking-wider mb-4"
            style={{ color: 'var(--bsi-bone, #F5F2EB)' }}
          >
            Conference Strength Index
          </h2>
          <div
            className="heritage-card p-6"
            style={{ background: 'var(--surface-dugout, #161616)', border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))' }}
          >
            <p
              className="font-cormorant mb-4"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              The Conference Strength Index combines inter-conference win percentage,
              average run environment, aggregate wOBA, aggregate ERA, and RPI average
              into a single composite score. This powers the conference adjustments
              in wRC+ and ERA-.
            </p>
            <p
              className="font-cormorant"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              <strong style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>Why it matters:</strong>{' '}
              A .320 wOBA in the SEC represents fundamentally different offensive
              production than a .340 wOBA in the Big South. The conference strength
              index quantifies that difference so that cross-conference player
              comparisons are meaningful, not misleading.
            </p>
          </div>
        </section>

        {/* Data Sources */}
        <section className="mb-12">
          <h2
            className="font-oswald uppercase text-xl tracking-wider mb-4"
            style={{ color: 'var(--bsi-bone, #F5F2EB)' }}
          >
            Data Sources
          </h2>
          <div
            className="heritage-card p-6"
            style={{ background: 'var(--surface-dugout, #161616)', border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))' }}
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span
                  className="heritage-stamp text-[10px] mt-1 shrink-0"
                  style={{ color: 'var(--bsi-primary, #BF5700)' }}
                >
                  PRIMARY
                </span>
                <p className="font-cormorant" style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>Highlightly Pro</strong>{' '}
                  — 330 D1 teams, live game data, venue metadata, win predictions.
                  Updated every 30-60 seconds during live games.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className="heritage-stamp text-[10px] mt-1 shrink-0"
                  style={{ color: 'var(--bsi-primary, #BF5700)' }}
                >
                  SECONDARY
                </span>
                <p className="font-cormorant" style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>ESPN</strong>{' '}
                  — Box scores, standings, rankings, schedules. Fallback data source
                  when Highlightly is unavailable.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className="heritage-stamp text-[10px] mt-1 shrink-0"
                  style={{ color: 'var(--bsi-primary, #BF5700)' }}
                >
                  COMPUTE
                </span>
                <p className="font-cormorant" style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>BSI Savant Compute</strong>{' '}
                  — Proprietary engine running on Cloudflare. Ingests raw box scores,
                  applies Tango linear weights, computes park-adjusted metrics, and
                  writes to D1 every 6 hours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI-Accessible via MCP */}
        <section className="mb-12">
          <h2
            className="font-oswald uppercase text-xl tracking-wider mb-4"
            style={{ color: 'var(--bsi-bone, #F5F2EB)' }}
          >
            AI-Accessible via MCP
          </h2>
          <div
            className="heritage-card p-6"
            style={{ background: 'var(--surface-dugout, #161616)', border: '1px solid var(--bsi-primary, #BF5700)' }}
          >
            <p
              className="font-cormorant mb-4"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              Every metric on this platform is available programmatically through the
              BSI College Baseball Sabermetrics MCP server — the only AI-accessible
              college baseball analytics interface in existence.
            </p>
            <p
              className="font-cormorant mb-4"
              style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}
            >
              AI assistants like Claude can query live scores, standings, rankings,
              team sabermetrics, player stats, conference strength indices, and
              national leaderboards directly. Nine tools, 330 D1 programs, updated
              every 30-60 seconds during live games.
            </p>
            <div
              className="font-mono text-xs p-3"
              style={{ background: 'var(--surface-press-box, #111)', color: 'var(--heritage-columbia-blue, #4B9CD3)' }}
            >
              sabermetrics.blazesportsintel.com
            </div>
          </div>
        </section>

        {/* Limitations */}
        <section className="mb-16">
          <h2
            className="font-oswald uppercase text-xl tracking-wider mb-4"
            style={{ color: 'var(--bsi-bone, #F5F2EB)' }}
          >
            Known Limitations
          </h2>
          <div
            className="heritage-card p-6"
            style={{ background: 'var(--surface-dugout, #161616)', border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))' }}
          >
            <ul className="space-y-3">
              <li className="font-cormorant" style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>No Statcast data.</strong>{' '}
                College baseball does not have exit velocity, launch angle, or spin
                rate tracking at scale. BSI metrics are computed from traditional
                box score data, not TrackMan/Hawk-Eye data.
              </li>
              <li className="font-cormorant" style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>BABIP instability.</strong>{' '}
                BABIP requires ~400 plate appearances to stabilize. Most college
                hitters never reach this threshold in a single season (~200-250 PA).
                BSI displays BABIP but flags it as high-variance.
              </li>
              <li className="font-cormorant" style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>Park factor regression.</strong>{' '}
                Early-season park factors are heavily regressed toward 1.0 due to
                small sample sizes. Mid-season factors (30+ games) are more reliable.
              </li>
              <li className="font-cormorant" style={{ color: 'var(--bsi-dust, #C4B8A5)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>6-hour refresh cycle.</strong>{' '}
                Advanced metrics update every 6 hours. Live box scores update in
                real-time, but derived metrics (wOBA, wRC+, FIP) reflect the last
                compute cycle.
              </li>
            </ul>
          </div>
        </section>

        {/* Footer CTA */}
        <footer className="text-center">
          <p
            className="font-cormorant text-sm italic"
            style={{ color: 'var(--bsi-dust, #C4B8A5)' }}
          >
            Questions about the methodology? Reach out at{' '}
            <a
              href="mailto:austin@blazesportsintel.com"
              className="underline"
              style={{ color: 'var(--heritage-columbia-blue, #4B9CD3)' }}
            >
              austin@blazesportsintel.com
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
