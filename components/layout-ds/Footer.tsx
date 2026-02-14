import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#0D0D0D] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Sports</h4>
            <ul className="space-y-2">
              <li><Link href="/mlb" className="text-sm text-white/50 hover:text-[#BF5700] transition-colors">MLB</Link></li>
              <li><Link href="/nfl" className="text-sm text-white/50 hover:text-[#BF5700] transition-colors">NFL</Link></li>
              <li><Link href="/nba" className="text-sm text-white/50 hover:text-[#BF5700] transition-colors">NBA</Link></li>
              <li><Link href="/cfb" className="text-sm text-white/50 hover:text-[#BF5700] transition-colors">College Football</Link></li>
              <li><Link href="/college-baseball" className="text-sm text-white/50 hover:text-[#BF5700] transition-colors">College Baseball</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Tools</h4>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-sm text-white/50 hover:text-[#BF5700] transition-colors">Dashboard</Link></li>
              <li><Link href="/scores" className="text-sm text-white/50 hover:text-[#BF5700] transition-colors">Live Scores</Link></li>
              <li><Link href="/search" className="text-sm text-white/50 hover:text-[#BF5700] transition-colors">Search</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-white/50 hover:text-[#BF5700] transition-colors">About</Link></li>
              <li><Link href="/platform" className="text-sm text-white/50 hover:text-[#BF5700] transition-colors">Platform</Link></li>
              <li><Link href="/contact" className="text-sm text-white/50 hover:text-[#BF5700] transition-colors">Contact</Link></li>
              <li><Link href="/pricing" className="text-sm text-white/50 hover:text-[#BF5700] transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-white/50 hover:text-[#BF5700] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-white/50 hover:text-[#BF5700] transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/images/brand/bsi-logo-primary.png" alt="BSI" className="h-8 w-auto opacity-70" />
            <span className="text-sm text-white/40">Blaze Sports Intel</span>
          </div>
          <p className="text-xs text-white/30">
            &copy; {currentYear} Blaze Intelligence LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
