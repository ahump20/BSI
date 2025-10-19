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

export default function SignUpPage() {
  return (
    <main className={pageShell}>
      <section className={pageSection}>
        <span className={pageKicker}>Diamond Insights · Auth</span>
        <h1 className={pageTitle}>Create Account</h1>
        <p className={pageSubtitle}>
          Registration flows are nearly online. This placeholder maintains the URL structure and dark-mode design while we hook
          Clerk onboarding, Stripe trials, and paywall states.
        </p>
        <div className={cardGrid}>
          <article className={card}>
            <h2 className={cardHeading}>Diamond Pro Access</h2>
            <p className={cardBody}>Expect gated content, staff collaboration spaces, and live alert configuration post sign-up.</p>
            <ul className={bulletList}>
              <li>Choose between Free and Diamond Pro tiers.</li>
              <li>Invite teammates with shared permissions.</li>
              <li>Sync saved boards to mobile devices.</li>
            </ul>
          </article>
          <article className={card}>
            <h2 className={cardHeading}>Already have an account?</h2>
            <p className={cardBody}>Jump back to the sign-in flow.</p>
            <ul className={bulletList}>
              <li>
                <Link className={inlineLink} href="/auth/sign-in">
                  Sign in to Diamond Insights
                  <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </li>
              <li>
                <Link className={inlineLink} href="/account">
                  Manage existing settings
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
