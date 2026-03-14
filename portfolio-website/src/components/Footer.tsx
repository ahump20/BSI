import { FOOTER_LINK_GROUPS, PRIMARY_EMAIL, RESUME_PATH, SITE_LOCATION, SITE_TAGLINE } from '../content/site';

export default function Footer() {
  return (
    <footer className="relative border-t border-bone/5">
      {/* Angular accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, #BF5700 30%, #FF6B35 50%, #BF5700 70%, transparent)',
        }}
      />

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {FOOTER_LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="font-sans text-xs uppercase tracking-[0.2em] text-bone font-medium mb-4">
                {group.title}
              </h4>
              <ul className="space-y-2">
                {group.links.map((link) => {
                  const isExternal = 'external' in link && Boolean(link.external);

                  return (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noopener noreferrer' : undefined}
                        className="text-sm text-warm-gray hover:text-burnt-orange transition-colors duration-300"
                      >
                        {link.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Legal / Info */}
          <div>
            <h4 className="font-sans text-xs uppercase tracking-[0.2em] text-bone font-medium mb-4">
              Info
            </h4>
            <ul className="space-y-2">
              <li className="text-sm text-warm-gray">{SITE_LOCATION}</li>
              <li>
                <a href={RESUME_PATH} download className="text-sm text-warm-gray hover:text-burnt-orange transition-colors duration-300">
                  Download Resume
                </a>
              </li>
              <li className="text-sm text-warm-gray break-all">{PRIMARY_EMAIL}</li>
            </ul>

            {/* Built on Cloudflare badge */}
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded bg-bone/5 border border-bone/5">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-warm-gray">
                <path d="M16.5 9.4l-3.7 8.2c-.1.3-.4.4-.7.4H6.8c-.3 0-.5-.2-.6-.5l-1-2.8c-.4-1.2.1-2.5 1.2-3.1l4.5-2.5c.2-.1.2-.3 0-.4l-1.3-.6c-.2-.1-.2-.4.1-.4l7.1.5c.2 0 .3.2.2.4l-.5 1zm2.3-1.2l-1.4-.1c-.1 0-.2-.1-.2-.2l-.3-1.3c-.2-.7-.8-1.1-1.5-1.1h-1.8c-.1 0-.2.1-.2.2l-.4 1.8c0 .1-.1.2-.2.2l-8.4.6c-1 .1-1.8.8-2 1.8l-.3 1.5c0 .1 0 .2.1.2h1.5c.1 0 .2-.1.2-.2l.2-.8c.1-.4.5-.7.9-.7h12.8c.5 0 1 .4 1.1.9l.1.6c0 .1.1.2.2.2h1.3c.1 0 .2-.1.2-.2l-.1-1.4c-.1-.9-.8-1.7-1.7-1.8z" fill="currentColor" />
              </svg>
              <span className="font-mono text-[0.6rem] text-warm-gray/80 uppercase tracking-wider">
                Built on Cloudflare
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-bone/5 text-center">
          <p className="text-sm font-mono text-warm-gray/80">
            &copy; {new Date().getFullYear()} Austin Humphrey. All rights reserved.
          </p>
          <p className="text-xs font-mono text-warm-gray/40 mt-3 italic">
            {SITE_TAGLINE}
          </p>
        </div>
      </div>
    </footer>
  );
}
