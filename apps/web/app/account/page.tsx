import Link from 'next/link';
import {
  bulletList,
  card,
  cardBody,
  cardGrid,
  cardHeading,
  inlineLink,
  pageKicker,
  pageSection,
  pageShell,
  pageSubtitle,
  pageTitle
} from '../../lib/ui/styles';

const quickActions = [
  { href: '/auth/sign-in', label: 'Sign in to manage Diamond Pro' },
  { href: '/auth/sign-up', label: 'Create a Diamond Insights account' },
  { href: '/account/settings', label: 'Adjust notification settings' }
];

export default function AccountPage() {
  return (
    <main className={pageShell}>
      <section className={pageSection}>
        <span className={pageKicker}>Diamond Insights · Account</span>
        <h1 className={pageTitle}>Account Center</h1>
        <p className={pageSubtitle}>
          Authentication and subscription services are currently being wired to Clerk and Stripe. This placeholder keeps the
          route live, responsive, and aligned with the Diamond Insights design language.
        </p>
        <div className={cardGrid}>
          <article className={card}>
            <h2 className={cardHeading}>What to Expect</h2>
            <p className={cardBody}>
              Manage Diamond Pro billing, saved teams, and alert thresholds from this surface once integrations are complete.
            </p>
            <ul className={bulletList}>
              <li>Profile management with security controls.</li>
              <li>Diamond Pro subscription upgrades and invoices.</li>
              <li>Personalized watchlists and push targets.</li>
            </ul>
          </article>
          <article className={card}>
            <h2 className={cardHeading}>Get Started</h2>
            <p className={cardBody}>Use the links below while we finalize auth.</p>
            <ul className={bulletList}>
              {quickActions.map((action) => (
                <li key={action.href}>
                  <Link className={inlineLink} href={action.href}>
                    {action.label}
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
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
