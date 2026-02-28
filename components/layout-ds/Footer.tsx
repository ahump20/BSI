import Link from 'next/link';
import { HealthDot } from './HealthDot';

const footerLink = 'text-sm text-text-muted hover:text-burnt-orange transition-colors';
const sectionTitle = 'text-[10px] font-semibold text-text-secondary uppercase tracking-[0.15em] mb-4 font-mono';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background-primary pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row — BSI identity + ecosystem callout */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-12">
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-3">
              <img src="/images/brand/bsi-logo-primary.png" alt="BSI" className="h-10 w-auto opacity-80" />
              <div>
                <span className="font-display text-lg font-bold uppercase tracking-wider text-text-primary">BSI</span>
                <span className="block text-[9px] font-mono uppercase tracking-[0.2em] text-text-muted">
                  Blaze Sports Intel
                </span>
              </div>
            </div>
            <p className="text-xs text-text-muted leading-relaxed font-serif italic">
              Old-school scouting instinct fused with new-school sabermetrics.
              Five sports, one standard.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <HealthDot />
            <a
              href="https://x.com/BlazeSportsHQ"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-burnt-orange transition-colors"
              aria-label="BSI on X"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Link grid — 5 columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 mb-12">
          <div>
            <h4 className={sectionTitle}>Sports</h4>
            <ul className="space-y-2">
              <li><Link href="/college-baseball" className={footerLink}>College Baseball</Link></li>
              <li><Link href="/mlb" className={footerLink}>MLB</Link></li>
              <li><Link href="/nfl" className={footerLink}>NFL</Link></li>
              <li><Link href="/nba" className={footerLink}>NBA</Link></li>
              <li><Link href="/cfb" className={footerLink}>College Football</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={sectionTitle}>Tools</h4>
            <ul className="space-y-2">
              <li><Link href="/scores" className={footerLink}>Live Scores</Link></li>
              <li><Link href="/models" className={footerLink}>Models</Link></li>
              <li><Link href="/glossary" className={footerLink}>Glossary</Link></li>
              <li><Link href="/pricing" className={footerLink}>Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={sectionTitle}>Ecosystem</h4>
            <ul className="space-y-2">
              <li><a href="https://labs.blazesportsintel.com" target="_blank" rel="noopener noreferrer" className={footerLink}>BSI Savant <span className="text-[9px] opacity-40">↗</span></a></li>
              <li><a href="https://blazecraft.app" target="_blank" rel="noopener noreferrer" className={footerLink}>BlazeCraft <span className="text-[9px] opacity-40">↗</span></a></li>
              <li><Link href="/arcade" className={footerLink}>Arcade</Link></li>
              <li><a href="https://austinhumphrey.com" target="_blank" rel="noopener noreferrer" className={footerLink}>Austin Humphrey <span className="text-[9px] opacity-40">↗</span></a></li>
            </ul>
          </div>
          <div>
            <h4 className={sectionTitle}>Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className={footerLink}>About</Link></li>
              <li><Link href="/about/methodology" className={footerLink}>Methodology</Link></li>
              <li><Link href="/contact" className={footerLink}>Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={sectionTitle}>Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className={footerLink}>Privacy Policy</Link></li>
              <li><Link href="/terms" className={footerLink}>Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider">
            &copy; {currentYear} Blaze Intelligence LLC
          </p>
          <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider">
            Built on Cloudflare &middot; Austin, TX
          </p>
        </div>
      </div>
    </footer>
  );
}
