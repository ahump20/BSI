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
              <Link href="/college-baseball" className="text-white/40 hover:text-burnt-orange transition-colors">College Baseball</Link>
              <span className="text-white/40">/</span>
              <span className="text-white">Schedule</span>
            </div>

            <div className="mb-8">
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-white">
                Game <span className="text-burnt-orange">Schedule</span>
              </h1>
              <p className="text-white/60 mt-2">NCAA Division I baseball schedule and calendar view</p>
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
