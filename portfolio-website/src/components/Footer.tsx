import { FOOTER_LINK_GROUPS, SITE_TAGLINE } from '../content/site';

export default function Footer() {
  return (
    <footer
      className="px-6 md:px-12 lg:px-16 py-16"
      style={{ borderTop: '1px solid rgba(245,240,235,0.06)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Link columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 mb-14">
          {FOOTER_LINK_GROUPS.map(group => (
            <div key={group.title}>
              <p
                className="font-mono text-[10px] tracking-[0.2em] uppercase mb-4"
                style={{ color: 'var(--color-accent)' }}
              >
                {group.title}
              </p>
              <ul className="space-y-2">
                {group.links.map(link => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...('external' in link && link.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="font-serif text-[14px] transition-colors duration-200 hover:text-[var(--color-accent)]"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-8"
          style={{ borderTop: '1px solid rgba(245,240,235,0.04)' }}
        >
          <p
            className="font-display text-[13px] italic"
            style={{ color: 'rgba(191,87,0,0.4)' }}
          >
            {SITE_TAGLINE}
          </p>
          <p
            className="font-mono text-[10px] tracking-wide"
            style={{ color: 'var(--color-text-muted)', opacity: 0.4 }}
          >
            &copy; {new Date().getFullYear()} Austin Humphrey
          </p>
        </div>
      </div>
    </footer>
  );
}
