import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Transparency — Blaze Sports Intel',
  description: 'Comprehensive data transparency report for Blaze Sports Intel sports analytics platform.'
};

export default function DataTransparencyPage() {
  return (
    <main className="legal-content" id="data-transparency">
      <h1>Data Transparency</h1>

      <section>
        <h2>Data Sources and Game Coverage</h2>
        <p>
          Blaze Sports Intel aggregates data from multiple verified sources to deliver accurate sports intelligence
          across multiple leagues and competitions. Our data coverage includes:
        </p>

        <h3>Current Data Holdings (As of October 23, 2025)</h3>
        <ul>
          <li><strong>MLB 2025:</strong> Complete regular season (2,430 games), postseason in progress</li>
          <li><strong>NFL 2025:</strong> Week 7 complete (56 games of 272 regular season games)</li>
          <li><strong>College Football 2025:</strong> Week 9 complete (approximately 650 games)</li>
          <li><strong>College Baseball 2025:</strong> Complete season including postseason and College World Series</li>
          <li><strong>NCAA Basketball:</strong> Data available for 2024-25 season</li>
        </ul>

        <p className="di-microcopy">
          <strong>Last Updated:</strong> October 23, 2025
        </p>
      </section>

      <section>
        <h2>Data Retention Policy</h2>
        <p>
          We maintain historical data for the current and previous two seasons (2024-2026) for analysis and
          comparison purposes. Older historical data is archived and available upon request for research purposes.
        </p>
      </section>

      <section>
        <h2>Data Quality and Verification</h2>
        <p>
          All data is verified against official league sources before publication. We update standings, scores,
          and statistics within minutes of official confirmation. Any discrepancies are investigated and corrected
          immediately.
        </p>

        <h3>Verification Process:</h3>
        <ul>
          <li>Cross-reference with official league APIs and websites</li>
          <li>Automated consistency checks on all statistical data</li>
          <li>Manual review of high-profile games and playoff results</li>
          <li>Community feedback integration for error reporting</li>
        </ul>
      </section>

      <section>
        <h2>Data Attribution</h2>
        <p>
          Sports data is sourced from official league providers, public APIs, and licensed data partners.
          We acknowledge all sources and comply with all data licensing requirements.
        </p>
      </section>

      <section>
        <h2>Contact for Data Inquiries</h2>
        <p>
          For questions about our data sources, methodology, or to report data discrepancies:
        </p>
        <ul>
          <li>Email: data@blazesportsintel.com</li>
          <li>Report errors via our feedback system</li>
        </ul>
      </section>
    </main>
  );
}
