'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Providers } from '@/app/providers';
import { PageTransition } from '@/components/motion/PageTransition';
import { MotionProvider } from '@/components/motion/MotionProvider';
import { AppSidebar } from '@/components/layout-ds/AppSidebar';
import { AppTopBar } from '@/components/layout-ds/AppTopBar';
import { BottomNavWrapper } from '@/components/layout-ds/BottomNavWrapper';
import { Navbar } from '@/components/layout-ds/Navbar';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { BreadcrumbBar } from '@/components/layout-ds/BreadcrumbBar';
import { Footer } from '@/components/layout-ds/Footer';
import { getMainNavItems, getAnalyticsNavItems } from '@/lib/navigation';

const CommandPalette = dynamic(() => import('@/components/layout-ds/CommandPalette').then((mod) => ({ default: mod.CommandPalette })));
const KonamiCodeWrapper = dynamic(() => import('@/components/easter-eggs').then((mod) => ({ default: mod.KonamiCodeWrapper })));
const FeedbackButton = dynamic(() => import('@/components/ui/FeedbackModal').then((mod) => ({ default: mod.FeedbackButton })));
const ScrollToTopButton = dynamic(() => import('@/components/ui/ScrollToTopButton').then((mod) => ({ default: mod.ScrollToTopButton })));
const PageTracker = dynamic(() => import('@/components/analytics/PageTracker').then((mod) => ({ default: mod.PageTracker })));
const PostHogProvider = dynamic(() => import('@/components/analytics/PostHogProvider').then((mod) => ({ default: mod.PostHogProvider })));

const APP_SHELL_PREFIXES = [
  '/',
  '/college-baseball/savant',
  '/college-baseball/standings',
  '/college-baseball/rankings',
  '/college-baseball/power-rankings',
  '/college-baseball/weekly-pulse',
  '/college-baseball/compare',
  '/college-baseball/conferences',
  '/college-baseball/games',
  '/scores',
  '/dashboard',
  '/search',
  '/settings',
  '/nil-valuation',
];

function usesAppShell(pathname: string): boolean {
  // Special case: exact match for root
  if (pathname === '/') return true;
  return APP_SHELL_PREFIXES
    .filter((p) => p !== '/')
    .some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const appShell = usesAppShell(pathname);

  const navData = useMemo(() => getMainNavItems(), []);
  const analyticsItems = useMemo(() => getAnalyticsNavItems(), []);

  return (
    <Providers>
      <MotionProvider>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {appShell ? (
          <div className="flex min-h-screen">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <AppTopBar />
              <ScrollProgress />
              <BreadcrumbBar />
              <CommandPalette />
              <KonamiCodeWrapper />
              <PageTracker />
              <PostHogProvider />
              <main id="main-content" className="flex-1 overflow-y-auto pb-20 md:pb-0">
                <PageTransition>{children}</PageTransition>
              </main>
              <Footer />
            </div>
          </div>
        ) : (
          <>
            <Navbar
              primary={navData.primary}
              leagues={navData.leagues}
              secondary={navData.secondary}
              analytics={analyticsItems}
            />
            <CommandPalette />
            <KonamiCodeWrapper />
            <PageTracker />
            <PostHogProvider />
            <main id="main-content" className="min-h-screen pb-24 md:pb-0">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
            <BottomNavWrapper />
          </>
        )}

        <FeedbackButton />
        <ScrollToTopButton />
      </MotionProvider>
    </Providers>
  );
}
