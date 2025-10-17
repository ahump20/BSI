import type { ReactNode } from 'react';
import Link from 'next/link';
import { canAccessDiamondPro } from '../lib/access-control';
import type { SessionData } from '../lib/session';

interface DiamondProGateProps {
  session: SessionData | null;
  children: ReactNode;
  featureName: string;
  returnTo: string;
}

export default function DiamondProGate({ session, children, featureName, returnTo }: DiamondProGateProps) {
  const hasAccess = canAccessDiamondPro(session?.roles);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <article className="di-card di-card--gated" aria-live="polite">
      <h2>Diamond Pro Required</h2>
      <p>
        <strong>{featureName}</strong> is part of the Diamond Pro toolkit. Upgrade to unlock recruiting intel, scouting packet
        exports, and late-inning win probability dashboards across the Deep South.
      </p>
      <div className="di-actions di-actions--inline">
        <Link className="di-action" href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}>
          Unlock Diamond Pro
        </Link>
        <Link className="di-inline-link" href="/account">
          View plans &amp; pricing
        </Link>
      </div>
    </article>
  );
}
