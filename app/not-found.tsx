import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-[80vh] flex items-center justify-center px-4"
      style={{ background: 'var(--surface-scoreboard, #0A0A0A)' }}
    >
      <div className="max-w-lg mx-auto text-center">
        {/* 404 number — Bebas Neue hero scale */}
        <h1
          className="font-bold leading-none mb-4"
          style={{
            fontFamily: 'var(--bsi-font-display-hero, var(--font-bebas))',
            fontSize: 'clamp(6rem, 20vw, 12rem)',
            color: 'var(--bsi-primary)',
            textShadow: '0 0 60px rgba(191, 87, 0, 0.25)',
          }}
        >
          404
        </h1>

        {/* Heading — Oswald */}
        <h2
          className="font-bold uppercase mb-4"
          style={{
            fontFamily: 'var(--bsi-font-display, var(--font-oswald))',
            fontSize: 'clamp(1.25rem, 4vw, 2rem)',
            letterSpacing: '0.08em',
            color: 'var(--bsi-bone)',
          }}
        >
          Page Not Found
        </h2>

        {/* Body — Cormorant Garamond */}
        <p
          className="mb-3 italic"
          style={{
            fontFamily: 'var(--bsi-font-body, var(--font-cormorant))',
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: 'var(--bsi-dust)',
            lineHeight: 1.6,
          }}
        >
          Looks like this play got called back. The page you are looking for does not exist or has
          been moved.
        </p>

        {/* Tagline */}
        <p
          className="italic mb-10"
          style={{
            fontFamily: 'var(--bsi-font-body, var(--font-cormorant))',
            fontSize: 'clamp(0.85rem, 2vw, 1rem)',
            color: 'var(--bsi-primary)',
            opacity: 0.75,
          }}
        >
          Born to Blaze the Path Beaten Less
        </p>

        {/* CTA — heritage button */}
        <Link href="/" className="btn-heritage-fill px-8 py-3 text-sm inline-block">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
