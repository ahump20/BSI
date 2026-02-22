'use client';

import Link from 'next/link';
import { getTeamBySlug } from '@/lib/college-baseball/team-registry';
import { TeamProfileTemplate } from '@/components/college-baseball/TeamProfileTemplate';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout-ds/Footer';

export default function TeamProfilePage({ teamId }: { teamId: string }) {
  const team = getTeamBySlug(teamId);

  if (!team) {
    return (
      <>
        <main className="min-h-screen pt-24">
          <Section padding="lg">
            <Container>
              <Card padding="lg" className="text-center">
                <div className="text-[#BF5700] text-4xl mb-4">!</div>
                <h3 className="text-xl font-semibold text-white mb-2">Team Not Found</h3>
                <p className="text-white/50 mb-4">
                  No profile data for &ldquo;{teamId}&rdquo;. This team may not be in a Power 5 conference.
                </p>
                <Link
                  href="/college-baseball/teams"
                  className="inline-block px-6 py-2 bg-[#BF5700] text-white font-semibold rounded-lg hover:bg-[#BF5700]/90 transition-colors"
                >
                  Browse All Teams
                </Link>
              </Card>
            </Container>
          </Section>
        </main>
        <Footer />
      </>
    );
  }

  return <TeamProfileTemplate team={team} />;
}
