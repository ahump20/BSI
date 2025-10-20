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

export default function SignUpPage() {
  return (
    <main className={layoutShell()}>
      <section className={section()}>
        <span className={kicker()}>Diamond Insights · Auth</span>
        <h1 className={sectionTitle()}>Create Account</h1>
        <p className={sectionSubtitle()}>
          Registration flows are nearly online. This placeholder maintains the URL structure and dark-mode design while we hook
          Clerk onboarding, Stripe trials, and paywall states.
        </p>
        <div className={cardGrid({ columns: 'auth' })}>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Diamond Pro Access</h2>
            <p className="text-sm text-di-textMuted sm:text-base">
              Expect gated content, staff collaboration spaces, and live alert configuration post sign-up.
            </p>
            <ul className={listStyles()}>
              <li>Choose between Free and Diamond Pro tiers.</li>
              <li>Invite teammates with shared permissions.</li>
              <li>Sync saved boards to mobile devices.</li>
            </ul>
          </article>
          <article className={cardSurface()}>
            <h2 className="font-display text-2xl text-di-text">Already have an account?</h2>
            <p className="text-sm text-di-textMuted sm:text-base">Jump back to the sign-in flow.</p>
            <ul className={listStyles()}>
              <li>
                <Link className={inlineLink()} href="/auth/sign-in">
                  Sign in to Diamond Insights
                </Link>
              </li>
              <li>
                <Link className={inlineLink()} href="/account">
                  Manage existing settings
                </Link>
              </li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
