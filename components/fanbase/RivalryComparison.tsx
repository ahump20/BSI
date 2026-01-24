'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Swords, Flame, Trophy, Users, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { FanbaseSelector } from './FanbaseSelector';
import { fetchProfile, type APIFanbaseProfile } from '../../lib/fanbase/api-types';

export interface RivalryComparisonProps {
  initialTeamA?: string;
  initialTeamB?: string;
  className?: string;
}

function ComparisonBar({
  valueA,
  valueB,
  colorA,
  colorB,
  maxValue = 10,
}: {
  valueA: number;
  valueB: number;
  colorA: string;
  colorB: string;
  maxValue?: number;
}): React.ReactElement {
  const total = valueA + valueB;
  const widthA = total > 0 ? (valueA / total) * 100 : 50;
  const widthB = total > 0 ? (valueB / total) * 100 : 50;

  return (
    <div className="flex items-center gap-1 h-3">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${widthA}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="h-full rounded-l-full"
        style={{ backgroundColor: colorA }}
      />
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${widthB}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="h-full rounded-r-full"
        style={{ backgroundColor: colorB }}
      />
    </div>
  );
}

function ComparisonMetric({
  label,
  valueA,
  valueB,
  colorA,
  colorB,
  formatter = (v: number) => v.toString(),
}: {
  label: string;
  valueA: number;
  valueB: number;
  colorA: string;
  colorB: string;
  formatter?: (v: number) => string;
}): React.ReactElement {
  const winner = valueA > valueB ? 'A' : valueB > valueA ? 'B' : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span
          className={`font-medium ${winner === 'A' ? 'text-white' : 'text-white/50'}`}
          style={winner === 'A' ? { color: colorA } : undefined}
        >
          {formatter(valueA)}
        </span>
        <span className="text-white/40 text-xs uppercase tracking-wide">{label}</span>
        <span
          className={`font-medium ${winner === 'B' ? 'text-white' : 'text-white/50'}`}
          style={winner === 'B' ? { color: colorB } : undefined}
        >
          {formatter(valueB)}
        </span>
      </div>
      <ComparisonBar valueA={valueA} valueB={valueB} colorA={colorA} colorB={colorB} />
    </div>
  );
}

function TeamHeader({
  profile,
  side,
}: {
  profile: APIFanbaseProfile;
  side: 'left' | 'right';
}): React.ReactElement {
  const { school, currentState } = profile;
  const align = side === 'left' ? 'items-start text-left' : 'items-end text-right';

  return (
    <div className={`flex flex-col ${align}`}>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white mb-2"
        style={{ backgroundColor: school.primary_color }}
      >
        {school.name.charAt(0)}
      </div>
      <h3 className="font-bold text-white text-lg">{school.name}</h3>
      <p className="text-xs text-white/50 flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        {school.location_city}
      </p>
      <span
        className="mt-2 inline-block px-2 py-0.5 rounded text-xs font-medium capitalize"
        style={{
          backgroundColor: `${school.primary_color}20`,
          color: school.primary_color,
        }}
      >
        {currentState.overall_sentiment}
      </span>
    </div>
  );
}

function CharacteristicComparison({
  profileA,
  profileB,
}: {
  profileA: APIFanbaseProfile;
  profileB: APIFanbaseProfile;
}): React.ReactElement {
  // Get trigger counts for each team
  const triggersA = profileA.characteristics.triggers.length;
  const triggersB = profileB.characteristics.triggers.length;

  // Get average intensity
  const avgIntensityA =
    profileA.characteristics.triggers.reduce((sum, t) => sum + t.intensity_score, 0) /
    (triggersA || 1);
  const avgIntensityB =
    profileB.characteristics.triggers.reduce((sum, t) => sum + t.intensity_score, 0) /
    (triggersB || 1);

  // Get rivalry with each other if exists
  const mutualRivalry =
    profileA.rivalries.find((r) => r.rival_school_id === profileB.school.id) ??
    profileB.rivalries.find((r) => r.rival_school_id === profileA.school.id);

  return (
    <div className="space-y-4">
      <ComparisonMetric
        label="Emotional Triggers"
        valueA={triggersA}
        valueB={triggersB}
        colorA={profileA.school.primary_color}
        colorB={profileB.school.primary_color}
      />
      <ComparisonMetric
        label="Avg Intensity"
        valueA={avgIntensityA}
        valueB={avgIntensityB}
        colorA={profileA.school.primary_color}
        colorB={profileB.school.primary_color}
        formatter={(v) => v.toFixed(1)}
      />
      <ComparisonMetric
        label="Identity Traits"
        valueA={profileA.characteristics.identity.length}
        valueB={profileB.characteristics.identity.length}
        colorA={profileA.school.primary_color}
        colorB={profileB.school.primary_color}
      />
      <ComparisonMetric
        label="Rivalries"
        valueA={profileA.rivalries.length}
        valueB={profileB.rivalries.length}
        colorA={profileA.school.primary_color}
        colorB={profileB.school.primary_color}
      />
      <ComparisonMetric
        label="Confidence"
        valueA={profileA.currentState.confidence_level}
        valueB={profileB.currentState.confidence_level}
        colorA={profileA.school.primary_color}
        colorB={profileB.school.primary_color}
      />

      {mutualRivalry && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-4 bg-error/10 border border-error/30 rounded-lg"
        >
          <div className="flex items-center justify-center gap-2 text-error">
            <Swords className="w-5 h-5" />
            <span className="font-bold">Direct Rivalry!</span>
          </div>
          {mutualRivalry.rivalry_name && (
            <p className="text-center text-white mt-1">{mutualRivalry.rivalry_name}</p>
          )}
          {mutualRivalry.trophy_name && (
            <p className="flex items-center justify-center gap-1 text-warning text-sm mt-2">
              <Trophy className="w-4 h-4" />
              {mutualRivalry.trophy_name}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 mt-2">
            <Flame className="w-4 h-4 text-error" />
            <span className="text-white/60 text-sm">
              Intensity: {mutualRivalry.intensity_score}/10
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function RivalryComparison({
  initialTeamA,
  initialTeamB,
  className = '',
}: RivalryComparisonProps): React.ReactElement {
  const [teamAId, setTeamAId] = useState<string | null>(initialTeamA ?? null);
  const [teamBId, setTeamBId] = useState<string | null>(initialTeamB ?? null);

  const { data: profileA, isLoading: loadingA } = useQuery({
    queryKey: ['fanbase-profile', teamAId],
    queryFn: () => fetchProfile(teamAId!),
    enabled: Boolean(teamAId),
    staleTime: 1000 * 60 * 5,
  });

  const { data: profileB, isLoading: loadingB } = useQuery({
    queryKey: ['fanbase-profile', teamBId],
    queryFn: () => fetchProfile(teamBId!),
    enabled: Boolean(teamBId),
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = loadingA || loadingB;
  const hasProfiles = profileA && profileB;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-burnt-orange" />
          Fanbase Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
              Team A
            </label>
            <FanbaseSelector
              value={teamAId}
              onChange={setTeamAId}
              placeholder="Select first team"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">
              Team B
            </label>
            <FanbaseSelector
              value={teamBId}
              onChange={setTeamBId}
              placeholder="Select second team"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
          </div>
        )}

        {/* Comparison Content */}
        {hasProfiles && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Team Headers */}
            <div className="flex items-start justify-between">
              <TeamHeader profile={profileA} side="left" />
              <div className="flex flex-col items-center justify-center pt-4">
                <span className="text-2xl font-bold text-white/20">VS</span>
              </div>
              <TeamHeader profile={profileB} side="right" />
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Metrics */}
            <CharacteristicComparison profileA={profileA} profileB={profileB} />

            {/* Hopes & Concerns */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div className="space-y-3">
                <p className="text-xs text-white/40 uppercase tracking-wide">
                  {profileA.school.name.split(' ')[0]} Hopes
                </p>
                <p className="text-sm text-white/70">{profileA.currentState.primary_hopes}</p>
              </div>
              <div className="space-y-3 text-right">
                <p className="text-xs text-white/40 uppercase tracking-wide">
                  {profileB.school.name.split(' ')[0]} Hopes
                </p>
                <p className="text-sm text-white/70">{profileB.currentState.primary_hopes}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!hasProfiles && !isLoading && (
          <div className="h-48 flex flex-col items-center justify-center text-center">
            <Users className="w-12 h-12 text-white/20 mb-3" />
            <p className="text-white/50">Select two teams to compare their fanbases</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
