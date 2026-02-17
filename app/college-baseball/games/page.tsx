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
              <Link href="/college-baseball" className="text-[#666] hover:text-[#BF5700] transition-colors">College Baseball</Link>
              <span className="text-[#666]">/</span>
              <span className="text-white">Schedule</span>
            </div>

            <div className="mb-8">
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-white">
                Game <span className="text-[#BF5700]">Schedule</span>
              </h1>
              <p className="text-[#999] mt-2">NCAA Division I baseball schedule and calendar view</p>
            </div>

            <CalendarView />

            <DataAttribution lastUpdated="" className="mt-6" />
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
