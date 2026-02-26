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
      <main id="main-content" className="pt-24">
        <Section padding="lg">
          <Container>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">College Baseball</Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">Schedule</span>
            </div>

            <div className="mb-8">
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-text-primary">
                Game <span className="text-burnt-orange">Schedule</span>
              </h1>
              <p className="text-text-secondary mt-2">NCAA Division I baseball schedule and calendar view</p>
            </div>

            <CalendarView />

            <DataAttribution lastUpdated="" source="ESPN" className="mt-6" />
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
