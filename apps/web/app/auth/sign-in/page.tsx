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

export default function SignInPage() {
  return (
    <main className={pageShell}>
      <section className={pageSection}>
        <span className={pageKicker}>Diamond Insights · Auth</span>
        <h1 className={pageTitle}>Sign In</h1>
        <p className={pageSubtitle}>
          Clerk integration is in progress. While we finish hooking up the auth provider, this placeholder keeps the route,
          messaging, and responsive design intact.
        </p>
        <div className={cardGrid}>
          <article className={card}>
            <h2 className={cardHeading}>Next Steps</h2>
            <p className={cardBody}>Diamond Pro members will authenticate here to access premium scouting tools.</p>
            <ul className={bulletList}>
              <li>Secure magic links and passkeys.</li>
              <li>Multi-factor enrollment for staff accounts.</li>
              <li>Session management synced across devices.</li>
            </ul>
          </article>
          <article className={card}>
            <h2 className={cardHeading}>Need an Account?</h2>
            <p className={cardBody}>Choose an action below.</p>
            <ul className={bulletList}>
              <li>
                <Link className={inlineLink} href="/auth/sign-up">
                  Create a Diamond Insights account
                  <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </li>
              <li>
                <Link className={inlineLink} href="/account">
                  Return to Account Center
                  <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
