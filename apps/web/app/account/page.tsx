import Link from 'next/link';

const quickActions = [
  { href: '/auth/sign-in', label: 'Sign in to manage Diamond Pro' },
  { href: '/auth/sign-up', label: 'Create a Diamond Insights account' },
  { href: '/account/settings', label: 'Adjust notification settings' }
];

export default function AccountPage() {
  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · Account</span>
        <h1 className="di-page-title">Account Center</h1>
        <p className="di-page-subtitle">
          Authentication and subscription services are currently being wired to Clerk and Stripe. This placeholder keeps the
          route live, responsive, and aligned with the Diamond Insights design language.
        </p>
        <div className="di-card-grid">
          <article className="di-card">
            <h2>What to Expect</h2>
            <p>Manage Diamond Pro billing, saved teams, and alert thresholds from this surface once integrations are complete.</p>
            <ul className="di-list">
              <li>Profile management with security controls.</li>
              <li>Diamond Pro subscription upgrades and invoices.</li>
              <li>Personalized watchlists and push targets.</li>
            </ul>
          </article>
          <article className="di-card">
            <h2>Get Started</h2>
            <p>Use the links below while we finalize auth.</p>
            <ul className="di-list">
              {quickActions.map((action) => (
                <li key={action.href}>
                  <Link className="di-inline-link" href={action.href}>
                    {action.label}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
