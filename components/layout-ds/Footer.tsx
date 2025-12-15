'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Container } from '../ui/Container';
import { Divider } from '../ui/Kicker';

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface FooterProps {
  /** Footer link sections */
  sections?: FooterSection[];
  /** Social links */
  socials?: Array<{
    label: string;
    href: string;
    icon: React.ReactNode;
  }>;
  /** Show newsletter signup */
  showNewsletter?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Footer component
 * 
 * Site footer with:
 * - Link sections
 * - Social links
 * - Optional newsletter signup
 * - Brand copyright
 */
export function Footer({
  sections = defaultSections,
  socials,
  showNewsletter = false,
  className,
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('bg-midnight border-t border-border-subtle', className)}>
      <Container>
        {/* Main footer content */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-8 lg:mb-0">
              <Link 
                href="/" 
                className="inline-block font-display text-xl font-bold text-text-primary hover:text-burnt-orange transition-colors"
              >
                BLAZE<span className="text-burnt-orange">SPORTS</span>
              </Link>
              <p className="mt-4 text-sm text-text-tertiary max-w-xs">
                Deep intelligence for the sports that matter. 
                College baseball first, always.
              </p>
              
              {/* Social links */}
              {socials && socials.length > 0 && (
                <div className="flex gap-4 mt-6">
                  {socials.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-tertiary hover:text-burnt-orange transition-colors"
                      aria-label={social.label}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Link sections */}
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-text-tertiary hover:text-burnt-orange transition-colors"
                        >
                          {link.label}
                          <span className="sr-only"> (opens in new tab)</span>
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-text-tertiary hover:text-burnt-orange transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Divider variant="subtle" spacing="none" />

        {/* Bottom bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            © {currentYear} Blaze Sports Intel. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link 
              href="/privacy" 
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Privacy
            </Link>
            <Link 
              href="/terms" 
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

// Default sections
const defaultSections: FooterSection[] = [
  {
    title: 'Sports',
    links: [
      { label: 'College Baseball', href: '/college-baseball' },
      { label: 'MLB', href: '/mlb' },
      { label: 'NFL', href: '/nfl' },
      { label: 'College Football', href: '/college-football' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Live Scores', href: '/scores' },
      { label: 'Analytics', href: '/analytics' },
      { label: 'API', href: '/api' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Blog', href: '/blog' },
    ],
  },
];

export default Footer;
