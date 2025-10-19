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

export default function SignInPage() {
  return (
    <main className={layoutShell()}>
      <section className={section()}>
        <span className={kicker()}>Diamond Insights · Auth</span>
        <h1 className={sectionTitle()}>Sign In</h1>
        <p className={sectionSubtitle()}>
          Clerk integration is in progress. While we finish hooking up the auth provider, this placeholder keeps the route,
          messaging, and responsive design intact.
        </p>
        <div className={cardGrid({ columns: 'auth' })}>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Next Steps</h2>
            <p className="text-sm text-di-textMuted sm:text-base">
              Diamond Pro members will authenticate here to access premium scouting tools.
            </p>
            <ul className={listStyles()}>
              <li>Secure magic links and passkeys.</li>
              <li>Multi-factor enrollment for staff accounts.</li>
              <li>Session management synced across devices.</li>
            </ul>
          </article>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Need an Account?</h2>
            <p className="text-sm text-di-textMuted sm:text-base">Choose an action below.</p>
            <ul className={listStyles()}>
              <li>
                <Link className={inlineLink()} href="/auth/sign-up">
                  Create a Diamond Insights account
                </Link>
              </li>
              <li>
                <Link className={inlineLink()} href="/account">
                  Return to Account Center
                </Link>
              </li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
