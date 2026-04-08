import Link from 'next/link';
import { Footer } from '@/components/layout-ds/Footer';

type BridgeAction = {
  href: string;
  label: string;
};

interface LegacyRouteBridgeProps {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: BridgeAction;
  secondaryAction?: BridgeAction;
  note?: string;
}

function BridgeLink({ href, label, primary }: BridgeAction & { primary?: boolean }) {
  return (
    <Link
      href={href}
      className={[
        'inline-flex items-center justify-center rounded-sm border px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition-colors',
        primary
          ? 'border-[var(--bsi-primary)] bg-[var(--bsi-primary)] text-[var(--midnight)] hover:bg-transparent hover:text-[var(--bsi-bone)]'
          : 'border-[rgba(191,87,0,0.25)] bg-transparent text-[var(--bsi-dust)] hover:border-[var(--bsi-primary)] hover:text-[var(--bsi-bone)]',
      ].join(' ')}
    >
      {label}
    </Link>
  );
}

export function LegacyRouteBridge({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  note,
}: LegacyRouteBridgeProps) {
  return (
    <main
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(ellipse at 50% 18%, rgba(191, 87, 0, 0.08) 0%, transparent 60%), var(--surface-scoreboard)',
      }}
    >
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-20 sm:px-6 lg:px-8">
        <div
          className="rounded-sm border px-6 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
          style={{
            background: 'rgba(13, 13, 13, 0.82)',
            borderColor: 'rgba(191, 87, 0, 0.18)',
          }}
        >
          <p
            className="mb-4 text-xs font-semibold uppercase tracking-[0.24em]"
            style={{ color: 'var(--bsi-primary)' }}
          >
            {eyebrow}
          </p>
          <h1
            className="mb-4 font-bold uppercase tracking-tight"
            style={{
              color: 'var(--bsi-bone)',
              fontFamily: 'var(--bsi-font-display-hero)',
              fontSize: 'clamp(2.25rem, 5vw, 4rem)',
              lineHeight: 0.95,
            }}
          >
            {title}
          </h1>
          <p
            className="max-w-2xl text-base leading-8 md:text-lg"
            style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-body)' }}
          >
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <BridgeLink {...primaryAction} primary />
            {secondaryAction ? <BridgeLink {...secondaryAction} /> : null}
          </div>

          {note ? (
            <p
              className="mt-6 text-sm uppercase tracking-[0.12em]"
              style={{ color: 'var(--bsi-dust)' }}
            >
              {note}
            </p>
          ) : null}
        </div>
      </section>
      <Footer />
    </main>
  );
}
