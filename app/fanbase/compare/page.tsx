'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SentimentGauge, MetricBar, TraitBadges, CompareCard } from '@/components/fanbase';
import { Footer } from '@/components/layout-ds/Footer';
import type { FanbaseProfile, FanbaseRivalry } from '@/lib/fanbase/types';

// Mock data
const ALL_TEAMS: FanbaseProfile[] = [
  {
    id: 'texas-longhorns',
    school: 'University of Texas',
    shortName: 'Texas',
    mascot: 'Longhorns',
    conference: 'SEC',
    primaryColor: '#BF5700',
    secondaryColor: '#FFFFFF',
    sentiment: { overall: 0.45, optimism: 0.7, loyalty: 0.85, volatility: 0.6 },
    personality: {
      traits: ['passionate', 'demanding', 'traditional', 'loyal'],
      rivalries: ['Oklahoma', 'Texas A&M'],
      traditions: ["Hook 'em", 'The Eyes of Texas'],
      quirks: [],
    },
    engagement: {
      socialMediaActivity: 0.9,
      gameAttendance: 0.85,
      travelSupport: 0.75,
      merchandisePurchasing: 0.9,
    },
    demographics: {
      primaryAge: '25-45',
      geographicSpread: ['Texas', 'National'],
      alumniPercentage: 0.35,
    },
    meta: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'manual',
      confidence: 0.7,
      sampleSize: 0,
    },
  },
  {
    id: 'oklahoma-sooners',
    school: 'University of Oklahoma',
    shortName: 'Oklahoma',
    mascot: 'Sooners',
    conference: 'SEC',
    primaryColor: '#841617',
    secondaryColor: '#FDF9D8',
    sentiment: { overall: 0.35, optimism: 0.55, loyalty: 0.9, volatility: 0.65 },
    personality: {
      traits: ['loyal', 'passionate', 'traditional', 'intense'],
      rivalries: ['Texas', 'Oklahoma State'],
      traditions: ['Boomer Sooner', 'Sooner Schooner'],
      quirks: [],
    },
    engagement: {
      socialMediaActivity: 0.85,
      gameAttendance: 0.9,
      travelSupport: 0.85,
      merchandisePurchasing: 0.85,
    },
    demographics: {
      primaryAge: '25-50',
      geographicSpread: ['Oklahoma', 'Texas', 'Regional'],
      alumniPercentage: 0.4,
    },
    meta: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'manual',
      confidence: 0.7,
      sampleSize: 0,
    },
  },
  {
    id: 'georgia-bulldogs',
    school: 'University of Georgia',
    shortName: 'Georgia',
    mascot: 'Bulldogs',
    conference: 'SEC',
    primaryColor: '#BA0C2F',
    secondaryColor: '#000000',
    sentiment: { overall: 0.72, optimism: 0.85, loyalty: 0.9, volatility: 0.4 },
    personality: {
      traits: ['loyal', 'passionate', 'confident'],
      rivalries: ['Florida', 'Auburn', 'Georgia Tech'],
      traditions: ['Uga', 'Between the Hedges'],
      quirks: [],
    },
    engagement: {
      socialMediaActivity: 0.85,
      gameAttendance: 0.95,
      travelSupport: 0.9,
      merchandisePurchasing: 0.85,
    },
    demographics: {
      primaryAge: '25-50',
      geographicSpread: ['Georgia', 'Southeast'],
      alumniPercentage: 0.4,
    },
    meta: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'manual',
      confidence: 0.7,
      sampleSize: 0,
    },
  },
  {
    id: 'alabama-crimson-tide',
    school: 'University of Alabama',
    shortName: 'Alabama',
    mascot: 'Crimson Tide',
    conference: 'SEC',
    primaryColor: '#9E1B32',
    secondaryColor: '#FFFFFF',
    sentiment: { overall: 0.55, optimism: 0.65, loyalty: 0.95, volatility: 0.5 },
    personality: {
      traits: ['demanding', 'historic', 'intense'],
      rivalries: ['Auburn', 'Tennessee', 'LSU'],
      traditions: ['Roll Tide', 'Rammer Jammer'],
      quirks: [],
    },
    engagement: {
      socialMediaActivity: 0.95,
      gameAttendance: 0.95,
      travelSupport: 0.9,
      merchandisePurchasing: 0.95,
    },
    demographics: {
      primaryAge: '30-55',
      geographicSpread: ['Alabama', 'National'],
      alumniPercentage: 0.25,
    },
    meta: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'manual',
      confidence: 0.7,
      sampleSize: 0,
    },
  },
];

const MOCK_RIVALRIES: FanbaseRivalry[] = [
  {
    id: 'red-river',
    teamA: 'texas-longhorns',
    teamB: 'oklahoma-sooners',
    name: 'Red River Rivalry',
    intensity: 0.95,
    historicalRecord: 'Texas leads 63-50-5',
    lastMeeting: 'Texas W 34-30 (2024)',
    trophyName: 'Golden Hat',
  },
];

function TeamSelector({
  selected,
  onSelect,
  exclude,
  label,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  exclude?: string;
  label: string;
}) {
  const availableTeams = ALL_TEAMS.filter((t) => t.id !== exclude);

  return (
    <div className="space-y-2">
      <label className="text-sm text-white/50">{label}</label>
      <select
        value={selected || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full px-4 py-2 bg-charcoal border border-border-subtle rounded-lg text-white focus:outline-none focus:border-burnt-orange"
      >
        <option value="">Select a team...</option>
        {availableTeams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.shortName} {team.mascot}
          </option>
        ))}
      </select>
    </div>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const teamsParam = searchParams.get('teams');
  const initialTeams = teamsParam ? teamsParam.split(',') : [];

  const [teamA, setTeamA] = useState<string | null>(initialTeams[0] || null);
  const [teamB, setTeamB] = useState<string | null>(initialTeams[1] || null);

  const profileA = ALL_TEAMS.find((t) => t.id === teamA) || null;
  const profileB = ALL_TEAMS.find((t) => t.id === teamB) || null;

  // Check for rivalry
  const rivalry =
    teamA && teamB
      ? MOCK_RIVALRIES.find(
          (r) =>
            (r.teamA === teamA && r.teamB === teamB) || (r.teamA === teamB && r.teamB === teamA)
        )
      : null;

  // Update URL when teams change
  useEffect(() => {
    if (teamA && teamB) {
      router.replace(`/fanbase/compare?teams=${teamA},${teamB}`, { scroll: false });
    } else if (teamA) {
      router.replace(`/fanbase/compare?teams=${teamA}`, { scroll: false });
    }
  }, [teamA, teamB, router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-midnight via-charcoal to-midnight">
      {/* Header */}
      <section className="py-12 border-b border-border-subtle">
        <Container>
          <nav className="mb-6">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link href="/fanbase" className="text-white/50 hover:text-white">
                  Fanbases
                </Link>
              </li>
              <li className="text-white/30">/</li>
              <li className="text-white">Compare</li>
            </ol>
          </nav>

          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Compare Fanbases</h1>
            <p className="text-white/70">
              Select two teams to compare their fanbase sentiment, engagement, and characteristics.
            </p>
          </div>
        </Container>
      </section>

      {/* Team Selection */}
      <section className="py-8">
        <Container>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <TeamSelector
              selected={teamA}
              onSelect={setTeamA}
              exclude={teamB || undefined}
              label="Team A"
            />
            <TeamSelector
              selected={teamB}
              onSelect={setTeamB}
              exclude={teamA || undefined}
              label="Team B"
            />
          </div>
        </Container>
      </section>

      {/* Comparison Results */}
      {profileA && profileB && (
        <section className="py-8">
          <Container>
            {/* Rivalry Banner */}
            {rivalry && (
              <div className="mb-8 p-4 rounded-lg bg-error/10 border border-error/30 text-center">
                <Badge variant="error" className="mb-2">
                  Historic Rivalry
                </Badge>
                <h2 className="text-xl font-bold text-white">{rivalry.name}</h2>
                {rivalry.trophyName && (
                  <p className="text-white/50 text-sm">Trophy: {rivalry.trophyName}</p>
                )}
                <p className="text-white/70 mt-2">{rivalry.historicalRecord}</p>
                {rivalry.lastMeeting && (
                  <p className="text-xs text-white/50 mt-1">Last: {rivalry.lastMeeting}</p>
                )}
              </div>
            )}

            {/* Head-to-Head Gauges */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-12">
              {/* Team A */}
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold"
                  style={{
                    backgroundColor: profileA.primaryColor,
                    color: profileA.secondaryColor,
                  }}
                >
                  {profileA.shortName.charAt(0)}
                </div>
                <h3 className="font-bold text-white text-lg">{profileA.shortName}</h3>
                <p className="text-white/50 text-sm">{profileA.mascot}</p>
                <SentimentGauge value={profileA.sentiment.overall} size="lg" className="mt-4" />
              </div>

              <span className="text-3xl font-bold text-white/30">VS</span>

              {/* Team B */}
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold"
                  style={{
                    backgroundColor: profileB.primaryColor,
                    color: profileB.secondaryColor,
                  }}
                >
                  {profileB.shortName.charAt(0)}
                </div>
                <h3 className="font-bold text-white text-lg">{profileB.shortName}</h3>
                <p className="text-white/50 text-sm">{profileB.mascot}</p>
                <SentimentGauge value={profileB.sentiment.overall} size="lg" className="mt-4" />
              </div>
            </div>

            {/* Metric Comparisons */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <CompareCard profileA={profileA} profileB={profileB} metric="sentiment" />
              <CompareCard profileA={profileA} profileB={profileB} metric="engagement" />
              <CompareCard profileA={profileA} profileB={profileB} metric="loyalty" />
            </div>

            {/* Detailed Comparison */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Team A Details */}
              <Card padding="lg">
                <CardHeader>
                  <CardTitle>{profileA.shortName}</CardTitle>
                  <Badge
                    style={{
                      backgroundColor: `${profileA.primaryColor}30`,
                      color: profileA.primaryColor,
                    }}
                  >
                    {profileA.conference}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm text-white/50 mb-3">Sentiment Metrics</p>
                    <div className="space-y-3">
                      <MetricBar
                        label="Optimism"
                        value={profileA.sentiment.optimism}
                        color={profileA.primaryColor}
                      />
                      <MetricBar
                        label="Loyalty"
                        value={profileA.sentiment.loyalty}
                        color={profileA.primaryColor}
                      />
                      <MetricBar
                        label="Volatility"
                        value={profileA.sentiment.volatility}
                        color="#ef4444"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-white/50 mb-3">Engagement</p>
                    <div className="space-y-3">
                      <MetricBar
                        label="Social Media"
                        value={profileA.engagement.socialMediaActivity}
                        color={profileA.primaryColor}
                      />
                      <MetricBar
                        label="Attendance"
                        value={profileA.engagement.gameAttendance}
                        color={profileA.primaryColor}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-white/50 mb-3">Traits</p>
                    <TraitBadges traits={profileA.personality.traits} variant="compact" />
                  </div>
                </CardContent>
              </Card>

              {/* Team B Details */}
              <Card padding="lg">
                <CardHeader>
                  <CardTitle>{profileB.shortName}</CardTitle>
                  <Badge
                    style={{
                      backgroundColor: `${profileB.primaryColor}30`,
                      color: profileB.primaryColor,
                    }}
                  >
                    {profileB.conference}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm text-white/50 mb-3">Sentiment Metrics</p>
                    <div className="space-y-3">
                      <MetricBar
                        label="Optimism"
                        value={profileB.sentiment.optimism}
                        color={profileB.primaryColor}
                      />
                      <MetricBar
                        label="Loyalty"
                        value={profileB.sentiment.loyalty}
                        color={profileB.primaryColor}
                      />
                      <MetricBar
                        label="Volatility"
                        value={profileB.sentiment.volatility}
                        color="#ef4444"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-white/50 mb-3">Engagement</p>
                    <div className="space-y-3">
                      <MetricBar
                        label="Social Media"
                        value={profileB.engagement.socialMediaActivity}
                        color={profileB.primaryColor}
                      />
                      <MetricBar
                        label="Attendance"
                        value={profileB.engagement.gameAttendance}
                        color={profileB.primaryColor}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-white/50 mb-3">Traits</p>
                    <TraitBadges traits={profileB.personality.traits} variant="compact" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>
      )}

      {/* Empty State */}
      {(!profileA || !profileB) && (
        <section className="py-16">
          <Container>
            <div className="text-center">
              <p className="text-white/50">Select two teams above to see a detailed comparison.</p>
            </div>
          </Container>
        </section>
      )}
    </main>
  );
}

export default function FanbaseComparePage() {
  return (
    <>
      <Suspense
        fallback={
          <main className="min-h-screen bg-gradient-to-b from-midnight via-charcoal to-midnight flex items-center justify-center">
            <div className="animate-pulse text-white/50">Loading comparison tool...</div>
          </main>
        }
      >
        <CompareContent />
      </Suspense>
      <Footer />
    </>
  );
}
