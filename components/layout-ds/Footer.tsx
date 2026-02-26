import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background-primary py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Sports</h4>
            <ul className="space-y-2">
              <li><Link href="/mlb" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">MLB</Link></li>
              <li><Link href="/nfl" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">NFL</Link></li>
              <li><Link href="/nba" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">NBA</Link></li>
              <li><Link href="/cfb" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">College Football</Link></li>
              <li><Link href="/college-baseball" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">College Baseball</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Tools</h4>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">Dashboard</Link></li>
              <li><Link href="/intel" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">Intel</Link></li>
              <li><Link href="/scores" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">Live Scores</Link></li>
              <li><Link href="/models" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">Models</Link></li>
              <li><Link href="/glossary" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">Glossary</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">About</Link></li>
              <li><Link href="/about/methodology" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">Methodology</Link></li>
              <li><Link href="/about/partnerships" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">Partnerships</Link></li>
              <li><Link href="/contact" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">Contact</Link></li>
              <li><Link href="/pricing" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-text-muted hover:text-burnt-orange transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/images/brand/bsi-logo-primary.png" alt="BSI" className="h-8 w-auto opacity-70" />
            <span className="text-sm text-text-muted">Blaze Sports Intel</span>
          </div>
          <p className="text-xs text-text-muted">
            &copy; {currentYear} Blaze Intelligence LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
