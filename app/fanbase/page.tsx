import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FanbaseCard, FanbaseListCard } from '@/components/fanbase';
import { Footer } from '@/components/layout-ds/Footer';
import type { FanbaseProfile, TrendingFanbase } from '@/lib/fanbase/types';

export const metadata: Metadata = {
  title: 'College Football Fanbases | Blaze Sports Intel',
  description:
    'Explore CFB fanbase sentiment, personality traits, and engagement metrics. Track how fan emotions change throughout the season.',
  openGraph: {
    title: 'College Football Fanbases | Blaze Sports Intel',
    description: 'Fanbase sentiment tracking and characteristics for college football teams.',
    url: 'https://blazesportsintel.com/fanbase',
    type: 'website',
  },
};

const SEC_TEAMS: FanbaseProfile[] = [
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
      traits: ['passionate', 'demanding', 'traditional'],
      rivalries: ['Oklahoma', 'Texas A&M'],
      traditions: ["Hook 'em", 'The Eyes of Texas'],
      quirks: ['Longhorn Network debates'],
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
      quirks: ['Barking at opponents'],
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
      quirks: ['Championship expectations'],
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

function TrendingSection({ trending }: { trending: TrendingFanbase[] }) {
  if (trending.length === 0) {
    return (
      <Card padding="md">
        <CardContent>
          <p className="text-white/50 text-center py-8">
            No trending data available yet. Check back during the season.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {trending.map((item) => (
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
  // Mock trending data - in production, fetch from API
  const trendingFanbases: TrendingFanbase[] = [];

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-midnight via-charcoal to-midnight">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="accent" className="mb-4">
                CFB Fanbases
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
                  href="#sec"
                  className="px-6 py-3 bg-charcoal text-white font-medium rounded-lg hover:bg-charcoal/70 transition-colors border border-border-subtle"
                >
                  Browse SEC
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
                  <Badge variant="secondary">16 Teams</Badge>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {SEC_TEAMS.map((profile) => (
                    <FanbaseCard
                      key={profile.id}
                      profile={profile}
                      trend="stable"
                      showEngagement={false}
                    />
                  ))}

                  {/* Placeholder cards for teams without data */}
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={`placeholder-${i}`} padding="md" className="opacity-50">
                      <CardContent className="text-center py-8">
                        <p className="text-white/30 text-sm">More teams coming soon</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Trending */}
                <Card padding="md">
                  <CardHeader>
                    <CardTitle size="sm">Trending This Week</CardTitle>
                    <Badge variant="primary">Week 1</Badge>
                  </CardHeader>
                  <CardContent>
                    <TrendingSection trending={trendingFanbases} />
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
                      href="/fanbase/texas-longhorns"
                      className="block p-3 rounded-lg bg-charcoal/50 hover:bg-charcoal transition-colors"
                    >
                      <p className="font-medium text-white">Texas Longhorns</p>
                      <p className="text-xs text-white/50">Featured fanbase profile</p>
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
