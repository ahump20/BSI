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
} from '../../../lib/ui/di-variants';

const supportLinks = [
  { href: '/account', label: 'Account Overview' },
  { href: '/auth/sign-in', label: 'Secure Sign In' },
  { href: '/privacy', label: 'Privacy Center' }
];

export default function AccountSettingsPage() {
  return (
    <main className={layoutShell()}>
      <section className={section()}>
        <span className={kicker()}>Diamond Insights · Account Settings</span>
        <h1 className={sectionTitle()}>Settings & Personalization</h1>
        <p className={sectionSubtitle()}>
          Notification, alert routing, and saved content controls will live here. This placeholder ensures the route stays
          active with dark-mode theming and responsive layout until Clerk preferences are wired in.
        </p>
        <div className={cardGrid({ columns: 'auth' })}>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Upcoming Controls</h2>
            <p className="text-sm text-di-textMuted sm:text-base">
              Expect granular toggles for game states, recruiting updates, and Diamond Pro data exports.
            </p>
            <ul className={listStyles()}>
              <li>Mobile push & email alert matrix.</li>
              <li>Saved team + player watchlists synced across devices.</li>
              <li>Diamond Pro sharing permissions for staffers.</li>
            </ul>
          </article>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Support</h2>
            <p className="text-sm text-di-textMuted sm:text-base">Use these links until preference storage is online.</p>
            <ul className={listStyles()}>
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link className={inlineLink()} href={link.href}>
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
