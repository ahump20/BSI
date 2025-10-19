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
} from '../../../lib/ui/styles';

const supportLinks = [
  { href: '/account', label: 'Account Overview' },
  { href: '/auth/sign-in', label: 'Secure Sign In' },
  { href: '/privacy', label: 'Privacy Center' }
];

export default function AccountSettingsPage() {
  return (
    <main className={pageShell}>
      <section className={pageSection}>
        <span className={pageKicker}>Diamond Insights · Account Settings</span>
        <h1 className={pageTitle}>Settings & Personalization</h1>
        <p className={pageSubtitle}>
          Notification, alert routing, and saved content controls will live here. This placeholder ensures the route stays
          active with dark-mode theming and responsive layout until Clerk preferences are wired in.
        </p>
        <div className={cardGrid}>
          <article className={card}>
            <h2 className={cardHeading}>Upcoming Controls</h2>
            <p className={cardBody}>Expect granular toggles for game states, recruiting updates, and Diamond Pro data exports.</p>
            <ul className={bulletList}>
              <li>Mobile push & email alert matrix.</li>
              <li>Saved team + player watchlists synced across devices.</li>
              <li>Diamond Pro sharing permissions for staffers.</li>
            </ul>
          </article>
          <article className={card}>
            <h2 className={cardHeading}>Support</h2>
            <p className={cardBody}>Use these links until preference storage is online.</p>
            <ul className={bulletList}>
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link className={inlineLink} href={link.href}>
                    {link.label}
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
