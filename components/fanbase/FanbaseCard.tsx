'use client';

import Link from 'next/link';
import { Card, CardContent } from '../ui/Card';
import { TraitBadges } from './TraitBadges';
import { SentimentGauge, MetricBar } from './SentimentChart';
import type { FanbaseProfile, SentimentTrend } from '../../lib/fanbase/types';

export interface FanbaseCardProps {
  profile: FanbaseProfile;
  trend?: SentimentTrend;
  showEngagement?: boolean;
  compact?: boolean;
  className?: string;
}

function TrendIndicator({ trend }: { trend: SentimentTrend }) {
  if (trend === 'rising') {
    return (
      <span className="inline-flex items-center gap-1 text-success text-xs font-medium">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
        Rising
      </span>
    );
  }

  if (trend === 'falling') {
    return (
      <span className="inline-flex items-center gap-1 text-error text-xs font-medium">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
        Falling
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-white/50 text-xs font-medium">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
      Stable
    </span>
  );
}

export function FanbaseCard({
  profile,
  trend,
  showEngagement = false,
  compact = false,
  className = '',
}: FanbaseCardProps) {
  return (
    <Link href={`/fanbase/${profile.id}`} className="block">
      <Card
        variant="hover"
        padding={compact ? 'sm' : 'md'}
        className={`relative overflow-hidden group ${className}`}
      >
        {/* Team color accent */}
        <div
          className="absolute top-0 left-0 w-1 h-full"
          style={{ backgroundColor: profile.primaryColor }}
        />

        <CardContent className="pl-3">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {profile.logo && (
                <img src={profile.logo} alt={profile.mascot} className="w-10 h-10 object-contain" />
              )}
              <div>
                <h3 className="font-semibold text-white group-hover:text-burnt-orange transition-colors">
                  {profile.shortName} {profile.mascot}
                </h3>
                <p className="text-xs text-white/50">{profile.conference}</p>
              </div>
            </div>

            {/* Sentiment gauge */}
            <SentimentGauge value={profile.sentiment.overall} size="sm" showValue={true} />
          </div>

          {/* Traits */}
          {profile.personality.traits.length > 0 && (
            <TraitBadges
              traits={profile.personality.traits}
              variant="compact"
              limit={compact ? 2 : 4}
              className="mb-3"
            />
          )}

          {/* Trend */}
          {trend && (
            <div className="flex items-center justify-between">
              <TrendIndicator trend={trend} />
              <span className="text-xs text-white/30">View Profile →</span>
            </div>
          )}

          {/* Engagement metrics (optional) */}
          {showEngagement && !compact && (
            <div className="mt-4 pt-4 border-t border-border-subtle space-y-2">
              <MetricBar
                label="Social Activity"
                value={profile.engagement.socialMediaActivity}
                color={profile.primaryColor}
              />
              <MetricBar
                label="Attendance"
                value={profile.engagement.gameAttendance}
                color={profile.primaryColor}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export interface FanbaseListCardProps {
  profile: FanbaseProfile;
  rank?: number;
  delta?: number;
  className?: string;
}

export function FanbaseListCard({ profile, rank, delta, className = '' }: FanbaseListCardProps) {
  return (
    <Link href={`/fanbase/${profile.id}`} className="block">
      <div
        className={`flex items-center gap-4 p-3 rounded-lg bg-charcoal/50 hover:bg-charcoal transition-colors group ${className}`}
      >
        {rank !== undefined && (
          <span className="w-8 text-center text-lg font-bold text-white/30">{rank}</span>
        )}

        <div className="w-1 h-10 rounded-full" style={{ backgroundColor: profile.primaryColor }} />

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white truncate group-hover:text-burnt-orange transition-colors">
            {profile.shortName} {profile.mascot}
          </h4>
          <p className="text-xs text-white/50">{profile.conference}</p>
        </div>

        <div className="flex items-center gap-3">
          {delta !== undefined && (
            <span
              className={`text-sm font-medium ${
                delta > 0 ? 'text-success' : delta < 0 ? 'text-error' : 'text-white/50'
              }`}
            >
              {delta > 0 ? '+' : ''}
              {(delta * 100).toFixed(0)}
            </span>
          )}

          <div className="text-right">
            <p className="text-sm font-semibold text-white">
              {profile.sentiment.overall > 0 ? '+' : ''}
              {(profile.sentiment.overall * 100).toFixed(0)}
            </p>
            <p className="text-xs text-white/50">sentiment</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export interface CompareCardProps {
  profileA: FanbaseProfile;
  profileB: FanbaseProfile;
  metric: 'sentiment' | 'engagement' | 'loyalty';
  className?: string;
}

export function CompareCard({ profileA, profileB, metric, className = '' }: CompareCardProps) {
  const getMetricValue = (profile: FanbaseProfile): number => {
    switch (metric) {
      case 'sentiment':
        return profile.sentiment.overall;
      case 'engagement':
        return (
          (profile.engagement.socialMediaActivity +
            profile.engagement.gameAttendance +
            profile.engagement.travelSupport +
            profile.engagement.merchandisePurchasing) /
          4
        );
      case 'loyalty':
        return profile.sentiment.loyalty;
      default:
        return 0;
    }
  };

  const valueA = getMetricValue(profileA);
  const valueB = getMetricValue(profileB);
  const advantage = valueA > valueB ? 'A' : valueB > valueA ? 'B' : null;

  const metricLabels = {
    sentiment: 'Overall Sentiment',
    engagement: 'Fan Engagement',
    loyalty: 'Fan Loyalty',
  };

  return (
    <Card padding="sm" className={className}>
      <p className="text-xs text-white/50 mb-3">{metricLabels[metric]}</p>

      <div className="flex items-center justify-between">
        {/* Team A */}
        <div className={`text-center ${advantage === 'A' ? 'opacity-100' : 'opacity-60'}`}>
          <p className="text-lg font-bold text-white">
            {metric === 'sentiment' && valueA > 0 ? '+' : ''}
            {(valueA * 100).toFixed(0)}
          </p>
          <p className="text-xs text-white/50 truncate max-w-[80px]">{profileA.shortName}</p>
          {advantage === 'A' && (
            <span className="inline-block mt-1 text-[10px] text-success">Winner</span>
          )}
        </div>

        {/* VS */}
        <span className="text-white/30 font-medium">vs</span>

        {/* Team B */}
        <div className={`text-center ${advantage === 'B' ? 'opacity-100' : 'opacity-60'}`}>
          <p className="text-lg font-bold text-white">
            {metric === 'sentiment' && valueB > 0 ? '+' : ''}
            {(valueB * 100).toFixed(0)}
          </p>
          <p className="text-xs text-white/50 truncate max-w-[80px]">{profileB.shortName}</p>
          {advantage === 'B' && (
            <span className="inline-block mt-1 text-[10px] text-success">Winner</span>
          )}
        </div>
      </div>
    </Card>
  );
}
