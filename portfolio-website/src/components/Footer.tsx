const quickLinks = [
  { label: 'Origin', href: '#origin' },
  { label: 'Experience', href: '#experience' },
  { label: 'Education', href: '#education' },
  { label: 'BSI', href: '#bsi' },
  { label: 'Covenant', href: '#covenant' },
  { label: 'Contact', href: '#contact' },
];

const bsiLinks = [
  { label: 'BlazeSportsIntel.com', href: 'https://blazesportsintel.com' },
  { label: 'BlazeCraft Dashboard', href: 'https://blazecraft.app' },
  { label: 'BSI Editorial', href: 'https://blazesportsintel.com/college-baseball/editorial' },
  { label: 'BSI Arcade', href: 'https://blazesportsintel.com/arcade' },
];

const socialLinks = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/ahump20' },
  { label: 'GitHub', href: 'https://github.com/ahump20' },
  { label: 'X / Twitter', href: 'https://x.com/BlazeSportsIntel' },
  { label: 'Email', href: 'mailto:Austin@BlazeSportsIntel.com' },
];

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
          {/* Quick Links */}
          <div>
            <h4 className="font-sans text-xs uppercase tracking-[0.2em] text-bone font-medium mb-4">
              Navigate
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-warm-gray hover:text-burnt-orange transition-colors duration-300">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* BSI Links */}
          <div>
            <h4 className="font-sans text-xs uppercase tracking-[0.2em] text-bone font-medium mb-4">
              BSI
            </h4>
            <ul className="space-y-2">
              {bsiLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-warm-gray hover:text-burnt-orange transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-sans text-xs uppercase tracking-[0.2em] text-bone font-medium mb-4">
              Social
            </h4>
            <ul className="space-y-2">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.startsWith('mailto') ? undefined : '_blank'}
                    rel={link.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                    className="text-sm text-warm-gray hover:text-burnt-orange transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / Info */}
          <div>
            <h4 className="font-sans text-xs uppercase tracking-[0.2em] text-bone font-medium mb-4">
              Info
            </h4>
            <ul className="space-y-2">
              <li className="text-sm text-warm-gray">San Antonio, Texas</li>
              <li>
                <a href="/Austin_Humphrey_Resume.pdf" download className="text-sm text-warm-gray hover:text-burnt-orange transition-colors duration-300">
                  Download Resume
                </a>
              </li>
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
        </div>
      </div>
    </footer>
  );
}
