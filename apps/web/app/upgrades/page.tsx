import type { Metadata } from 'next';
import { SiteHeader } from '../../components/site-header';
import { getBranchInsights } from '../../../../config/branch-insights.js';

export const metadata: Metadata = {
  title: 'Branch Upgrades | Blaze Sports Intel',
  description:
    'Snapshot of the Blaze Sports Intel branch-specific differentiators and upgrade roadmap for Diamond Insights.'
};

export default function BranchUpgradesPage() {
  const branchName =
    process.env.NEXT_PUBLIC_BRANCH_NAME ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    process.env.GIT_BRANCH ||
    'main';
  const includeExperimental = process.env.NEXT_PUBLIC_INCLUDE_EXPERIMENTAL === 'true';
  const insights = getBranchInsights(branchName, { includeExperimental });

  return (
    <>
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content" className="upgrade-main">
        <section className="upgrade-hero">
          <p className="status-badge">Branch: {insights.normalizedBranch}</p>
          <h1>Branch Differentiators &amp; Upgrade Roadmap</h1>
          {insights.summary ? <p className="upgrade-summary">{insights.summary}</p> : null}
          <dl className="upgrade-meta">
            <div>
              <dt>Last Updated</dt>
              <dd>{new Date(insights.lastUpdated).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt>Generated</dt>
              <dd>{new Date(insights.generatedAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Experimental Tracks</dt>
              <dd>{insights.experimentalIncluded ? 'Included' : 'Hidden'}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="unique-properties-heading" className="unique-section">
          <div className="section-header">
            <h2 id="unique-properties-heading">Unique Properties</h2>
            <p>Why this branch matters when we scout the college diamond.</p>
          </div>
          <div className="unique-grid">
            {insights.uniqueProperties.map(property => (
              <article key={property.key} className="insight-card">
                <header>
                  <h3>{property.title}</h3>
                  <span className={`status-tag status-${property.status.toLowerCase()}`}>
                    {property.status}
                  </span>
                </header>
                <p>{property.description}</p>
                {property.evidence ? (
                  <p className="insight-evidence">{property.evidence}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="upgrade-roadmap-heading" className="upgrade-section">
          <div className="section-header">
            <h2 id="upgrade-roadmap-heading">Upgrade Roadmap</h2>
            <p>Active build queue ranked by impact and readiness.</p>
          </div>
          <div className="upgrade-grid">
            {insights.upgrades.map(upgrade => (
              <article key={upgrade.key} className="upgrade-card">
                <header>
                  <div>
                    <h3>{upgrade.title}</h3>
                    <p className="upgrade-stage">Stage: {upgrade.stage}</p>
                  </div>
                  <span className={`status-tag status-${upgrade.status.replace(/\s+/g, '-').toLowerCase()}`}>
                    {upgrade.status}
                  </span>
                </header>
                <p>{upgrade.description}</p>
                <dl className="upgrade-details">
                  <div>
                    <dt>Priority</dt>
                    <dd>{upgrade.priority}</dd>
                  </div>
                  <div>
                    <dt>Target Date</dt>
                    <dd>{upgrade.eta ? new Date(upgrade.eta).toLocaleDateString() : 'TBD'}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
