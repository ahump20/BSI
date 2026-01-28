'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Container } from '@/components/ui/Container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FanbaseListCard } from '@/components/fanbase';
import { Footer } from '@/components/layout-ds/Footer';
import { fetchSchools, fetchTrending, type APISchool } from '@/lib/fanbase/api-types';
import type { TrendingFanbase } from '@/lib/fanbase/types';

function SchoolCard({ school }: { school: APISchool }) {
  return (
    <Link href={`/fanbase/${school.id}`} className="block">
      <Card variant="hover" padding="md" className="relative overflow-hidden group">
        <div
          className="absolute top-0 left-0 w-1 h-full"
          style={{ backgroundColor: school.primary_color }}
        />
        <CardContent className="pl-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                style={{ backgroundColor: school.primary_color }}
              >
                {school.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-burnt-orange transition-colors">
                  {school.name}
                </h3>
                <p className="text-xs text-white/50">{school.mascot}</p>
              </div>
            </div>
            <Badge variant="secondary" size="sm">
              {school.conference}
            </Badge>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-white/40">
              {school.location_city}, {school.location_state}
            </p>
            <span className="text-xs text-white/30 group-hover:text-burnt-orange/60 transition-colors">
              View Profile
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SchoolsGrid({ schools }: { schools: APISchool[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {schools.map((school) => (
        <SchoolCard key={school.id} school={school} />
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} padding="md" className="animate-pulse">
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TrendingSection({
  trending,
  isLoading,
}: {
  trending: TrendingFanbase[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (trending.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-white/50 text-sm">
          No trending data available yet. Check back during the season.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trending.slice(0, 5).map((item) => (
        <FanbaseListCard
          key={item.fanbase.id}
          profile={item.fanbase}
          rank={item.rank}
          delta={item.delta.overallChange}
        />
      ))}
    </div>
  );
}

export default function FanbaseLandingPage() {
  const {
    data: schools = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sec-schools'],
    queryFn: fetchSchools,
    staleTime: 1000 * 60 * 10,
  });

  const { data: trendingFanbases = [], isLoading: isTrendingLoading } = useQuery({
    queryKey: ['fanbase-trending'],
    queryFn: fetchTrending,
    staleTime: 1000 * 60 * 5, // 5 minute cache
  });

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-midnight via-charcoal to-midnight">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="accent" className="mb-4">
                SEC Fanbases
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                College Football Fanbase Intelligence
              </h1>
              <p className="text-lg text-white/70 mb-8">
                Track sentiment, personality traits, and engagement metrics for CFB fanbases.
                Understand how fan emotions shift throughout the season.
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/fanbase/compare"
                  className="px-6 py-3 bg-burnt-orange text-white font-medium rounded-lg hover:bg-burnt-orange/90 transition-colors"
                >
                  Compare Fanbases
                </Link>
                <Link
                  href="/fanbase/triggers"
                  className="px-6 py-3 bg-charcoal text-white font-medium rounded-lg hover:bg-charcoal/70 transition-colors border border-border-subtle"
                >
                  View Triggers
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <Container>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* SEC Fanbases */}
              <div className="lg:col-span-2" id="sec">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">SEC Fanbases</h2>
                    <p className="text-white/50 text-sm">
                      Sentiment and characteristics for SEC teams
                    </p>
                  </div>
                  <Badge variant="secondary">{schools.length} Teams</Badge>
                </div>

                {isLoading ? (
                  <LoadingSkeleton />
                ) : error ? (
                  <Card padding="md">
                    <CardContent className="text-center py-8">
                      <p className="text-error">Failed to load schools</p>
                      <p className="text-sm text-white/50 mt-1">
                        {error instanceof Error ? error.message : 'Unknown error'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <SchoolsGrid schools={schools} />
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Trending */}
                <Card padding="md">
                  <CardHeader>
                    <CardTitle size="sm">Trending This Week</CardTitle>
                    <Badge variant={trendingFanbases.length > 0 ? 'accent' : 'secondary'}>
                      {trendingFanbases.length > 0 ? 'Live' : 'Offseason'}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <TrendingSection trending={trendingFanbases} isLoading={isTrendingLoading} />
                  </CardContent>
                </Card>

                {/* Quick Links */}
                <Card padding="md">
                  <CardHeader>
                    <CardTitle size="sm">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link
                      href="/fanbase/compare"
                      className="block p-3 rounded-lg bg-charcoal/50 hover:bg-charcoal transition-colors"
                    >
                      <p className="font-medium text-white">Compare Tool</p>
                      <p className="text-xs text-white/50">Side-by-side fanbase comparison</p>
                    </Link>
                    <Link
                      href="/fanbase/triggers"
                      className="block p-3 rounded-lg bg-charcoal/50 hover:bg-charcoal transition-colors"
                    >
                      <p className="font-medium text-white">Trigger Alerts</p>
                      <p className="text-xs text-white/50">High-intensity emotional triggers</p>
                    </Link>
                  </CardContent>
                </Card>

                {/* About */}
                <Card padding="md">
                  <CardHeader>
                    <CardTitle size="sm">About This Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-white/70 mb-3">
                      Fanbase sentiment is researched manually using X.com posts, fan forums, and
                      community discussions. No direct quotes are stored.
                    </p>
                    <p className="text-xs text-white/50">
                      Data is updated weekly during the CFB season.
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
