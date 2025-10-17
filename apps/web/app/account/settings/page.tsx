import Link from 'next/link';

const supportLinks = [
  { href: '/account', label: 'Account Overview' },
  { href: '/auth/login?returnTo=/account/settings', label: 'Secure Sign In' },
  { href: '/privacy', label: 'Privacy Center' }
];

export default function AccountSettingsPage() {
  return (
    <main className="di-page">
      <section className="di-section">
        <span className="di-kicker">Diamond Insights · Account Settings</span>
        <h1 className="di-page-title">Settings & Personalization</h1>
        <p className="di-page-subtitle">
          Notification, alert routing, and saved content controls land here soon. Auth0 backs identity and role assignments
          while we wire real-time preferences into the Diamond Insights stack.
        </p>
        <div className="di-card-grid">
          <article className="di-card">
            <h2>Upcoming Controls</h2>
            <p>Expect granular toggles for game states, recruiting updates, and Diamond Pro data exports.</p>
            <ul className="di-list">
              <li>Mobile push & email alert matrix.</li>
              <li>Saved team + player watchlists synced across devices.</li>
              <li>Diamond Pro sharing permissions for staffers.</li>
            </ul>
          </article>
          <article className="di-card">
            <h2>Support</h2>
            <p>Use these links until preference storage is online.</p>
            <ul className="di-list">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link className="di-inline-link" href={link.href}>
                    {link.label}
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
