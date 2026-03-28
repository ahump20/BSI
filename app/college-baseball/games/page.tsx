'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { CalendarView } from '@/components/sports/CalendarView';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { Footer } from '@/components/layout-ds/Footer';

export default function CollegeBaseballGamesPage() {
  return (
    <>
      <div className="pt-6">
        <Section padding="lg">
          <Container>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/college-baseball" className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors">College Baseball</Link>
              <span className="text-[rgba(196,184,165,0.35)]">/</span>
              <span className="text-[var(--bsi-bone)]">Schedule</span>
            </div>

            <div className="mb-8">
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-[var(--bsi-bone)]">
                Game <span className="text-[var(--bsi-primary)]">Schedule</span>
              </h1>
              <p className="text-[var(--bsi-dust)] mt-2">NCAA Division I baseball schedule and calendar view</p>
            </div>

            <CalendarView />

            {/* Quick Links — prevents dead-end */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/scores" className="block p-4 rounded-sm border border-[var(--border-vintage)] hover:border-[var(--bsi-primary)]/30 transition-colors text-center group">
                <span className="text-xs text-[rgba(196,184,165,0.35)] uppercase tracking-wider block mb-1">Live</span>
                <span className="text-sm font-semibold text-[var(--bsi-bone)] group-hover:text-[var(--bsi-primary)] transition-colors">Scores</span>
              </Link>
              <Link href="/college-baseball/standings" className="block p-4 rounded-sm border border-[var(--border-vintage)] hover:border-[var(--bsi-primary)]/30 transition-colors text-center group">
                <span className="text-xs text-[rgba(196,184,165,0.35)] uppercase tracking-wider block mb-1">Current</span>
                <span className="text-sm font-semibold text-[var(--bsi-bone)] group-hover:text-[var(--bsi-primary)] transition-colors">Standings</span>
              </Link>
              <Link href="/college-baseball/rankings" className="block p-4 rounded-sm border border-[var(--border-vintage)] hover:border-[var(--bsi-primary)]/30 transition-colors text-center group">
                <span className="text-xs text-[rgba(196,184,165,0.35)] uppercase tracking-wider block mb-1">National</span>
                <span className="text-sm font-semibold text-[var(--bsi-bone)] group-hover:text-[var(--bsi-primary)] transition-colors">Rankings</span>
              </Link>
              <Link href="/college-baseball/editorial" className="block p-4 rounded-sm border border-[var(--border-vintage)] hover:border-[var(--bsi-primary)]/30 transition-colors text-center group">
                <span className="text-xs text-[rgba(196,184,165,0.35)] uppercase tracking-wider block mb-1">Latest</span>
                <span className="text-sm font-semibold text-[var(--bsi-bone)] group-hover:text-[var(--bsi-primary)] transition-colors">Editorial</span>
              </Link>
            </div>

            <DataAttribution lastUpdated="" source="ESPN" className="mt-6" />
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
