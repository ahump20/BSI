import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Historical Comparisons — Blaze Sports Intel',
  description: 'Historical sports statistics and season-over-season comparisons across major leagues.'
};

export default function HistoricalComparisonsPage() {
  return (
    <main className="legal-content" id="historical-comparisons">
      <h1>Historical Comparisons</h1>

      <section>
        <h2>2025 Season Highlights</h2>
        <p>
          This page provides historical context and season comparisons for major sports leagues.
          Statistics are current as of the 2025 season.
        </p>
        <p className="di-microcopy">
          <strong>Last Updated:</strong> October 23, 2025
        </p>
      </section>

      <section>
        <h3>College Baseball 2025</h3>
        <div className="di-card">
          <h4>Texas Longhorns — First SEC Season</h4>
          <ul>
            <li><strong>Season Record:</strong> 44-14 overall (22-8 SEC)</li>
            <li><strong>Conference:</strong> SEC (First season after moving from Big 12)</li>
            <li><strong>SEC Regular Season Champion</strong></li>
            <li><strong>National Rankings:</strong> #5 D1Baseball final poll, #6 RPI</li>
            <li><strong>Historical Context:</strong> Successful first season in the SEC under head coach Jim Schlossnagle</li>
            <li><strong>College World Series:</strong> LSU Tigers won the 2025 national championship</li>
          </ul>
        </div>

        <div className="di-card">
          <h4>2025 Top Programs</h4>
          <ul>
            <li><strong>National Champion:</strong> LSU Tigers</li>
            <li><strong>Runner-up:</strong> North Carolina Tar Heels</li>
            <li><strong>RPI #1:</strong> Arkansas Razorbacks (0.6234)</li>
            <li><strong>SEC Dominance:</strong> 9 teams in final D1Baseball Top 25</li>
          </ul>
        </div>
      </section>

      <section>
        <h3>College Football 2025 (Through Week 9)</h3>
        <div className="di-card">
          <h4>Texas Longhorns — Second SEC Season</h4>
          <ul>
            <li><strong>Current Record:</strong> 7-0 overall (4-0 SEC)</li>
            <li><strong>CFP Ranking:</strong> #3 in initial College Football Playoff rankings</li>
            <li><strong>Conference:</strong> SEC (Second season)</li>
            <li><strong>Undefeated Status:</strong> One of multiple 7-0 teams including Ohio State, Texas A&M, Florida State, Washington, Oklahoma State</li>
          </ul>
        </div>
      </section>

      <section>
        <h3>MLB 2025</h3>
        <div className="di-card">
          <ul>
            <li><strong>Regular Season:</strong> Complete (All 2,430 games)</li>
            <li><strong>Best NL Record:</strong> Los Angeles Dodgers (104-58)</li>
            <li><strong>Best AL Record:</strong> Houston Astros (98-64)</li>
            <li><strong>World Series:</strong> Scheduled for October 24 - November 1, 2025 (Dodgers vs Astros)</li>
            <li><strong>Status as of Oct 23:</strong> Regular season complete, World Series not yet played</li>
          </ul>
        </div>
      </section>

      <section>
        <h3>NFL 2025 (Through Week 7)</h3>
        <div className="di-card">
          <ul>
            <li><strong>AFC Leaders:</strong> Baltimore Ravens (6-1), Kansas City Chiefs (6-1)</li>
            <li><strong>NFC Leader:</strong> Detroit Lions (6-1, best point differential +57)</li>
            <li><strong>Games Played:</strong> 56 of 272 regular season games</li>
            <li><strong>Season Status:</strong> Week 8 in progress</li>
          </ul>
        </div>
      </section>

      <section>
        <h2>Historical Data Methodology</h2>
        <p>
          All historical comparisons use verified data from official league sources. Records, rankings,
          and statistics are cross-referenced with Sports-Reference, official league websites, and licensed
          data providers to ensure accuracy.
        </p>
      </section>

      <section>
        <h2>Accessing Historical Data</h2>
        <p>
          For access to detailed historical statistics, season comparisons, or custom analysis:
        </p>
        <ul>
          <li>Browse our sport-specific pages for current season data</li>
          <li>Contact data@blazesportsintel.com for historical research requests</li>
          <li>Diamond Pro subscribers receive extended historical data access</li>
        </ul>
      </section>
    </main>
  );
}
