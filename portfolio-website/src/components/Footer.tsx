import { CREDENTIALS, FOOTER_LINK_GROUPS, PRIMARY_EMAIL, RESUME_PATH, SITE_LOCATION, SITE_TAGLINE } from '../content/site';

export default function Footer() {
  return (
    <footer className="border-t border-bone/5 footer-bg">
      <div className="mx-auto max-w-5xl px-6 py-14 md:px-12 md:py-16 lg:px-16">
        <div className="grid gap-10 md:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,0.9fr)]">
          {FOOTER_LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-burnt-orange/82">
                {group.title}
              </p>
              <ul className="mt-5 space-y-3">
                {group.links.map((link) => {
                  const isExternal = 'external' in link && Boolean(link.external);
                  return (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noopener noreferrer' : undefined}
                        className="footer-link text-sm text-warm-gray transition-colors duration-300 hover:text-burnt-orange"
                      >
                        {link.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div>
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-burnt-orange/82">
              Info
            </p>
            <ul className="mt-5 space-y-3 text-sm text-warm-gray">
              <li>{SITE_LOCATION}</li>
              <li>
                <a href={RESUME_PATH} download className="footer-link transition-colors duration-300 hover:text-burnt-orange">
                  Download Resume
                </a>
              </li>
              <li className="break-all">{PRIMARY_EMAIL}</li>
            </ul>
          </div>
        </div>

        {/* Credentials line — replaces standalone Career section */}
        <div className="mt-10 border-t border-bone/5 pt-6">
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-warm-gray/50">
            {CREDENTIALS}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="font-sans text-sm font-medium uppercase tracking-[0.18em] text-burnt-orange/75">
            {SITE_TAGLINE}
          </p>
          <p className="text-sm font-mono text-warm-gray/58">
            &copy; {new Date().getFullYear()} Austin Humphrey
          </p>
        </div>
      </div>
    </footer>
  );
}
