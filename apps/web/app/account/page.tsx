import Link from 'next/link';

import {
  cardGrid,
  cardSurface,
  inlineLink,
  kicker,
  layoutShell,
  listStyles,
  section,
  sectionSubtitle,
  sectionTitle
} from '../../lib/ui/di-variants';

const quickActions = [
  { href: '/auth/sign-in', label: 'Sign in to manage Diamond Pro' },
  { href: '/auth/sign-up', label: 'Create a Diamond Insights account' },
  { href: '/account/settings', label: 'Adjust notification settings' }
];

export default function AccountPage() {
  return (
    <main className={layoutShell()}>
      <section className={section()}>
        <span className={kicker()}>Diamond Insights · Account</span>
        <h1 className={sectionTitle()}>Account Center</h1>
        <p className={sectionSubtitle()}>
          Authentication and subscription services are currently being wired to Clerk and Stripe. This placeholder keeps the
          route live, responsive, and aligned with the Diamond Insights design language.
        </p>
        <div className={cardGrid({ columns: 'auth' })}>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">What to Expect</h2>
            <p className="text-sm text-di-textMuted sm:text-base">
              Manage Diamond Pro billing, saved teams, and alert thresholds from this surface once integrations are complete.
            </p>
            <ul className={listStyles()}>
              <li>Profile management with security controls.</li>
              <li>Diamond Pro subscription upgrades and invoices.</li>
              <li>Personalized watchlists and push targets.</li>
            </ul>
          </article>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Get Started</h2>
            <p className="text-sm text-di-textMuted sm:text-base">Use the links below while we finalize auth.</p>
            <ul className={listStyles()}>
              {quickActions.map((action) => (
                <li key={action.href}>
                  <Link className={inlineLink()} href={action.href}>
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
