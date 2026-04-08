import Link from 'next/link';
import { HealthDot } from './HealthDot';

const footerLink = 'text-sm hover:text-burnt-orange transition-colors';
const sectionTitle = 'text-[10px] font-semibold uppercase tracking-[0.15em] mb-4 font-mono text-heritage-bronze';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border-vintage bg-surface-scoreboard pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row — BSI identity + ecosystem callout */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-12">
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-3">
              <img src="/images/brand/bsi-mascot-200.png" alt="BSI" className="h-10 w-auto opacity-80" loading="lazy" decoding="async" />
              <div>
                <span className="font-display text-lg font-bold uppercase tracking-wider text-bsi-bone">BSI</span>
                <span className="block text-[9px] font-mono uppercase tracking-[0.2em] text-bsi-dust">
                  Blaze Sports Intel
                </span>
              </div>
            </div>
            <p className="text-[11px] font-serif italic tracking-wide mb-2 text-bsi-primary opacity-85">
              Born to Blaze the Path Beaten Less
            </p>
            <p className="text-xs leading-relaxed font-serif italic text-bsi-dust">
              Park-adjusted sabermetrics, live scores, and original editorial across five sports.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <HealthDot />
            <a
              href="https://x.com/BlazeSportsHQ"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-burnt-orange transition-colors text-bsi-dust"
              aria-label="BSI on X"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Link grid — 6 columns, top fan tasks first */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8 mb-12 text-bsi-dust">
          <div>
            <h4 className={sectionTitle}>Start Here</h4>
            <ul className="space-y-2">
              <li><Link href="/scores" className={footerLink}>Live Scores</Link></li>
              <li><Link href="/college-baseball/savant" className={footerLink}>BSI Savant</Link></li>
              <li><Link href="/college-baseball/editorial" className={footerLink}>Editorial</Link></li>
              <li><Link href="/ask" className={footerLink}>Ask BSI</Link></li>
              <li><Link href="/intel" className={footerLink}>Intelligence</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={sectionTitle}>Sports</h4>
            <ul className="space-y-2">
              <li><Link href="/college-baseball" className={footerLink}>College Baseball</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={sectionTitle}>Tools</h4>
            <ul className="space-y-2">
              <li><Link href="/college-baseball/savant/glossary" className={footerLink}>Glossary</Link></li>
              <li><Link href="/pricing" className={footerLink}>Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={sectionTitle}>About</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className={footerLink}>About</Link></li>
              <li><Link href="/about/methodology" className={footerLink}>Methodology</Link></li>
              <li><Link href="/data-sources" className={footerLink}>Data Sources</Link></li>
              <li><Link href="/contact" className={footerLink}>Contact</Link></li>
              <li><Link href="/status" className={footerLink}>Status</Link></li>
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
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border-vintage">
          <p className="text-[10px] font-mono uppercase tracking-wider text-bsi-dust">
            &copy; {currentYear} Blaze Sports Intel
          </p>
          <p className="text-[10px] font-mono uppercase tracking-wider text-bsi-dust">
            Built on Cloudflare &middot; Austin, TX
          </p>
        </div>
      </div>
    </footer>
  );
}
