'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  SentimentChart,
  SentimentGauge,
  MetricBar,
  TraitBadges,
  RivalryBadges,
  TraditionBadges,
} from '@/components/fanbase';
import { Footer } from '@/components/layout-ds/Footer';
import type { FanbaseProfile, SentimentSnapshot } from '@/lib/fanbase/types';

// Mock data for initial implementation
const MOCK_PROFILES: Record<string, FanbaseProfile> = {
  'texas-longhorns': {
    id: 'texas-longhorns',
    school: 'University of Texas',
    shortName: 'Texas',
    mascot: 'Longhorns',
    conference: 'SEC',
    primaryColor: '#BF5700',
    secondaryColor: '#FFFFFF',
    sentiment: { overall: 0.45, optimism: 0.7, loyalty: 0.85, volatility: 0.6 },
    personality: {
      traits: ['passionate', 'demanding', 'traditional', 'loyal', 'intense'],
      rivalries: ['Oklahoma', 'Texas A&M', 'Arkansas'],
      traditions: ["Hook 'em", 'The Eyes of Texas', 'Bevo', 'Big Bertha'],
      quirks: ['Longhorn Network debates', "We're Back memes", 'Burnt Orange everything'],
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
      dataSource: 'x-research',
      confidence: 0.75,
      sampleSize: 500,
    },
  },
};

const MOCK_SNAPSHOTS: SentimentSnapshot[] = [
  {
    id: 'texas-2025-w1',
    fanbaseId: 'texas-longhorns',
    timestamp: '2025-08-30T00:00:00Z',
    week: 1,
    season: 2025,
    sentiment: { overall: 0.3, optimism: 0.6, coachConfidence: 0.7, playoffHope: 0.5 },
    context: { recentResult: '', record: '0-0', ranking: 5, keyEvents: ['Season opener'] },
    themes: ['optimistic', 'sec-debut'],
    meta: { dataSource: 'x-research', confidence: 0.7, sampleSize: 200 },
  },
  {
    id: 'texas-2025-w2',
    fanbaseId: 'texas-longhorns',
    timestamp: '2025-09-06T00:00:00Z',
    week: 2,
    season: 2025,
    sentiment: { overall: 0.5, optimism: 0.75, coachConfidence: 0.75, playoffHope: 0.65 },
    context: {
      recentResult: 'W vs Colorado State 52-10',
      record: '1-0',
      ranking: 4,
      keyEvents: ['Dominant opener'],
    },
    themes: ['confident', 'strong-start'],
    meta: { dataSource: 'x-research', confidence: 0.7, sampleSize: 250 },
  },
  {
    id: 'texas-2025-w3',
    fanbaseId: 'texas-longhorns',
    timestamp: '2025-09-13T00:00:00Z',
    week: 3,
    season: 2025,
    sentiment: { overall: 0.45, optimism: 0.7, coachConfidence: 0.7, playoffHope: 0.6 },
    context: {
      recentResult: 'W vs Michigan 31-12',
      record: '2-0',
      ranking: 3,
      keyEvents: ['Statement win'],
    },
    themes: ['playoff-contender', 'defense-elite'],
    meta: { dataSource: 'x-research', confidence: 0.75, sampleSize: 300 },
  },
];

function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-midnight via-charcoal to-midnight flex items-center justify-center">
      <div className="animate-pulse text-white/50">Loading fanbase profile...</div>
    </div>
  );
}

function NotFoundState({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-midnight via-charcoal to-midnight flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Fanbase Not Found</h1>
        <p className="text-white/50 mb-6">No profile found for &quot;{slug}&quot;</p>
        <Link href="/fanbase" className="text-burnt-orange hover:underline">
          ← Back to Fanbases
        </Link>
      </div>
    </div>
  );
}

export default function FanbaseProfileClient({ schoolId }: { schoolId: string }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<FanbaseProfile | null>(null);
  const [snapshots, setSnapshots] = useState<SentimentSnapshot[]>([]);

  useEffect(() => {
    // In production, fetch from API
    // const response = await fetch(`/api/v1/fanbase/${schoolId}`);
    // const data = await response.json();

    // Mock implementation
    const mockProfile = MOCK_PROFILES[schoolId];
    if (mockProfile) {
      setProfile(mockProfile);
      setSnapshots(MOCK_SNAPSHOTS.filter((s) => s.fanbaseId === schoolId));
    }
    setLoading(false);
  }, [schoolId]);

  if (loading) return <LoadingState />;
  if (!profile) return <NotFoundState slug={schoolId} />;

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-midnight via-charcoal to-midnight">
        {/* Hero/Header */}
        <section
          className="relative py-12 md:py-16 border-b border-border-subtle"
          style={{
            background: `linear-gradient(to right, ${profile.primaryColor}20, transparent)`,
          }}
        >
          <Container>
            {/* Breadcrumb */}
            <nav className="mb-6">
              <ol className="flex items-center gap-2 text-sm">
                <li>
                  <Link href="/fanbase" className="text-white/50 hover:text-white">
                    Fanbases
                  </Link>
                </li>
                <li className="text-white/30">/</li>
                <li className="text-white">{profile.shortName}</li>
              </ol>
            </nav>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              {/* Team Info */}
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold"
                  style={{
                    backgroundColor: profile.primaryColor,
                    color: profile.secondaryColor,
                  }}
                >
                  {profile.shortName.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">
                    {profile.shortName} {profile.mascot}
                  </h1>
                  <p className="text-white/50">
                    {profile.school} · {profile.conference}
                  </p>
                </div>
              </div>

              {/* Sentiment Gauge */}
              <div className="flex items-center gap-6">
                <SentimentGauge
                  value={profile.sentiment.overall}
                  label="Overall Sentiment"
                  size="lg"
                />
                <div className="text-right">
                  <p className="text-xs text-white/50 mb-1">Last Updated</p>
                  <p className="text-sm text-white">
                    {new Date(profile.meta.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Main Content */}
        <section className="py-8 md:py-12">
          <Container>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Sentiment Chart */}
                <Card padding="lg">
                  <CardHeader>
                    <CardTitle>Sentiment Timeline</CardTitle>
                    <Badge variant="secondary">2025 Season</Badge>
                  </CardHeader>
                  <CardContent>
                    {snapshots.length > 0 ? (
                      <SentimentChart
                        snapshots={snapshots}
                        height={280}
                        showMetrics={['overall', 'optimism', 'playoffHope']}
                      />
                    ) : (
                      <div className="h-[280px] flex items-center justify-center">
                        <p className="text-white/50">
                          Sentiment tracking begins when the season starts.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Personality & Traits */}
                <Card padding="lg">
                  <CardHeader>
                    <CardTitle>Fanbase Personality</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <p className="text-sm text-white/50 mb-3">Traits</p>
                      <TraitBadges traits={profile.personality.traits} />
                    </div>

                    <div>
                      <p className="text-sm text-white/50 mb-3">Rivalries</p>
                      <RivalryBadges rivalries={profile.personality.rivalries} limit={5} />
                    </div>

                    <div>
                      <p className="text-sm text-white/50 mb-3">Traditions</p>
                      <TraditionBadges traditions={profile.personality.traditions} limit={5} />
                    </div>

                    {profile.personality.quirks.length > 0 && (
                      <div>
                        <p className="text-sm text-white/50 mb-3">Quirks & Behaviors</p>
                        <ul className="space-y-1">
                          {profile.personality.quirks.map((quirk) => (
                            <li
                              key={quirk}
                              className="text-sm text-white/70 flex items-start gap-2"
                            >
                              <span className="text-burnt-orange mt-1">•</span>
                              {quirk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Weekly Snapshots */}
                {snapshots.length > 0 && (
                  <Card padding="lg">
                    <CardHeader>
                      <CardTitle>Weekly Snapshots</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {snapshots
                          .slice()
                          .reverse()
                          .map((snapshot) => (
                            <div
                              key={snapshot.id}
                              className="p-4 rounded-lg bg-charcoal/50 border border-border-subtle"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-medium text-white">Week {snapshot.week}</p>
                                  <p className="text-xs text-white/50">
                                    {snapshot.context.record}{' '}
                                    {snapshot.context.ranking && `· #${snapshot.context.ranking}`}
                                  </p>
                                </div>
                                <SentimentGauge
                                  value={snapshot.sentiment.overall}
                                  size="sm"
                                  showValue
                                />
                              </div>
                              {snapshot.context.recentResult && (
                                <p className="text-sm text-white/70 mb-2">
                                  {snapshot.context.recentResult}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {snapshot.themes.map((theme) => (
                                  <span
                                    key={theme}
                                    className="px-2 py-0.5 rounded text-xs bg-white/5 text-white/50"
                                  >
                                    #{theme}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Metrics */}
                <Card padding="lg">
                  <CardHeader>
                    <CardTitle size="sm">Sentiment Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <MetricBar
                      label="Optimism"
                      value={profile.sentiment.optimism}
                      color="#22c55e"
                    />
                    <MetricBar
                      label="Loyalty"
                      value={profile.sentiment.loyalty}
                      color={profile.primaryColor}
                    />
                    <MetricBar
                      label="Volatility"
                      value={profile.sentiment.volatility}
                      color="#ef4444"
                    />
                  </CardContent>
                </Card>

                {/* Engagement */}
                <Card padding="lg">
                  <CardHeader>
                    <CardTitle size="sm">Fan Engagement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <MetricBar
                      label="Social Media"
                      value={profile.engagement.socialMediaActivity}
                      color={profile.primaryColor}
                    />
                    <MetricBar
                      label="Game Attendance"
                      value={profile.engagement.gameAttendance}
                      color={profile.primaryColor}
                    />
                    <MetricBar
                      label="Travel Support"
                      value={profile.engagement.travelSupport}
                      color={profile.primaryColor}
                    />
                    <MetricBar
                      label="Merch Purchasing"
                      value={profile.engagement.merchandisePurchasing}
                      color={profile.primaryColor}
                    />
                  </CardContent>
                </Card>

                {/* Demographics */}
                <Card padding="lg">
                  <CardHeader>
                    <CardTitle size="sm">Demographics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Primary Age</span>
                      <span className="text-white">{profile.demographics.primaryAge}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Alumni %</span>
                      <span className="text-white">
                        {Math.round(profile.demographics.alumniPercentage * 100)}%
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-white/50 block mb-1">Geographic Spread</span>
                      <div className="flex flex-wrap gap-1">
                        {profile.demographics.geographicSpread.map((geo) => (
                          <Badge key={geo} variant="secondary" size="sm">
                            {geo}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compare CTA */}
                <Card padding="lg" className="border-burnt-orange/30">
                  <CardContent>
                    <p className="text-sm text-white/70 mb-4">
                      Compare {profile.shortName} against another fanbase
                    </p>
                    <Link
                      href={`/fanbase/compare?teams=${profile.id}`}
                      className="block w-full text-center px-4 py-2 bg-burnt-orange text-white font-medium rounded-lg hover:bg-burnt-orange/90 transition-colors"
                    >
                      Compare Fanbases
                    </Link>
                  </CardContent>
                </Card>

                {/* Data Source */}
                <Card padding="md">
                  <CardContent>
                    <p className="text-xs text-white/30 mb-1">Data Source</p>
                    <p className="text-sm text-white/50">{profile.meta.dataSource}</p>
                    <p className="text-xs text-white/30 mt-2">
                      Confidence: {Math.round(profile.meta.confidence * 100)}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
