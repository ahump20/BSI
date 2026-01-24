'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Flame,
  Heart,
  Sparkles,
  BookOpen,
  Trophy,
  AlertTriangle,
  TrendingUp,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { fetchProfile, type APICharacteristic } from '../../lib/fanbase/api-types';

export interface FanbaseProfileViewProps {
  schoolId: string;
  className?: string;
}

function IntensityBar({ score, color }: { score: number; color: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score * 10}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-white/50 w-4 text-right">{score}</span>
    </div>
  );
}

function CharacteristicCard({
  item,
  icon: Icon,
  accentColor,
}: {
  item: APICharacteristic;
  icon: LucideIcon;
  accentColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 bg-white/5 rounded-lg border border-white/5"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white text-sm capitalize mb-1">
            {item.characteristic_key.replace(/_/g, ' ')}
          </h4>
          <p className="text-xs text-white/60 leading-relaxed">{item.characteristic_value}</p>
          <div className="mt-2">
            <IntensityBar score={item.intensity_score} color={accentColor} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const sentimentStyles: Record<string, { bg: string; text: string; icon: LucideIcon }> = {
    triumphant: { bg: 'bg-success/20', text: 'text-success', icon: TrendingUp },
    optimistic: { bg: 'bg-burnt-orange/20', text: 'text-burnt-orange', icon: Sparkles },
    cautious: { bg: 'bg-warning/20', text: 'text-warning', icon: AlertTriangle },
    frustrated: { bg: 'bg-error/20', text: 'text-error', icon: AlertTriangle },
    hopeful: { bg: 'bg-info/20', text: 'text-info', icon: Heart },
    rebuilding: { bg: 'bg-texas-soil/20', text: 'text-texas-soil', icon: Sparkles },
    default: { bg: 'bg-white/10', text: 'text-white/70', icon: Sparkles },
  };

  const style = sentimentStyles[sentiment.toLowerCase()] ?? sentimentStyles.default;
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${style.bg} ${style.text}`}
    >
      <Icon className="w-4 h-4" />
      {sentiment}
    </span>
  );
}

function LexiconCard({
  term,
  meaning,
  context,
  weight,
}: {
  term: string;
  meaning: string;
  context: string;
  weight: string;
}): React.ReactElement {
  const weightColors: Record<string, string> = {
    positive: 'border-success/30 bg-success/5',
    negative: 'border-error/30 bg-error/5',
    neutral: 'border-white/10 bg-white/5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-3 rounded-lg border ${weightColors[weight] ?? weightColors.neutral}`}
    >
      <p className="font-semibold text-burnt-orange text-base">{term}</p>
      <p className="text-sm text-white/80 mt-1">{meaning}</p>
      <p className="text-xs text-white/40 mt-1">Usage: {context}</p>
    </motion.div>
  );
}

function RivalryCard({
  name,
  rival,
  intensity,
  trophy,
  color,
}: {
  name: string | null;
  rival: string;
  intensity: number;
  trophy: string | null;
  color: string;
}): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 bg-error/5 border border-error/20 rounded-lg"
    >
      <div className="w-10 h-10 rounded-lg bg-error/20 flex items-center justify-center">
        <Flame className="w-5 h-5 text-error" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{name ?? `vs ${rival}`}</p>
        <div className="flex items-center gap-2 mt-1">
          {trophy && (
            <span className="inline-flex items-center gap-1 text-xs text-warning">
              <Trophy className="w-3 h-3" />
              {trophy}
            </span>
          )}
          <span className="text-xs text-white/40">vs {rival}</span>
        </div>
        <div className="mt-1.5">
          <IntensityBar score={intensity} color={color} />
        </div>
      </div>
    </motion.div>
  );
}

function ProfileSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 bg-white/5 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-white/5 rounded-lg" />
        <div className="h-48 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
}

export function FanbaseProfileView({
  schoolId,
  className = '',
}: FanbaseProfileViewProps): React.ReactElement {
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['fanbase-profile', schoolId],
    queryFn: () => fetchProfile(schoolId),
    enabled: Boolean(schoolId),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return <ProfileSkeleton />;

  if (error || !profile) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <p className="text-error">Failed to load profile</p>
          <p className="text-sm text-white/50 mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { school, characteristics, currentState, rivalries, lexicon } = profile;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${school.primary_color}20 0%, transparent 60%)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-midnight/90 to-transparent" />
        <div className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl text-white"
                style={{ backgroundColor: school.primary_color }}
              >
                {school.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{school.name}</h1>
                <p className="flex items-center gap-1.5 text-white/60 mt-1">
                  <MapPin className="w-4 h-4" />
                  {school.location_city}, {school.location_state}
                </p>
                <p className="text-sm text-white/40">{school.conference}</p>
              </div>
            </div>
            <SentimentBadge sentiment={currentState.overall_sentiment} />
          </div>

          {/* Current State */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-white/40 uppercase tracking-wide">Primary Hopes</p>
              <p className="text-sm text-white/80 mt-1">{currentState.primary_hopes}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-white/40 uppercase tracking-wide">Primary Concerns</p>
              <p className="text-sm text-white/80 mt-1">{currentState.primary_concerns}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identity */}
        {characteristics.identity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-burnt-orange" />
                Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {characteristics.identity.map((item) => (
                <CharacteristicCard
                  key={item.id}
                  item={item}
                  icon={Heart}
                  accentColor={school.primary_color}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Triggers */}
        {characteristics.triggers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-error" />
                Emotional Triggers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {characteristics.triggers.map((item) => (
                <CharacteristicCard key={item.id} item={item} icon={Flame} accentColor="#ef4444" />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Rivalries */}
        {rivalries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                Rivalries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rivalries.map((r) => (
                <RivalryCard
                  key={r.id}
                  name={r.rivalry_name}
                  rival={r.rival_name}
                  intensity={r.intensity_score}
                  trophy={r.trophy_name}
                  color={school.primary_color}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Lexicon */}
        {lexicon.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-info" />
                Fan Lexicon
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lexicon.map((l) => (
                <LexiconCard
                  key={l.id}
                  term={l.term}
                  meaning={l.meaning}
                  context={l.usage_context}
                  weight={l.emotional_weight}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Traditions */}
      {characteristics.traditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-texas-soil" />
              Traditions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {characteristics.traditions.map((item) => (
              <CharacteristicCard key={item.id} item={item} icon={Sparkles} accentColor="#8B4513" />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
