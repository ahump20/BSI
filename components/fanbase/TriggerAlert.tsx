'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Flame,
  AlertTriangle,
  ChevronDown,
  Filter,
  Zap,
  Target,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { fetchSECTriggers, type APITriggerWithSchool } from '../../lib/fanbase/api-types';

export interface TriggerAlertProps {
  minIntensity?: number;
  maxTriggers?: number;
  className?: string;
}

type FilterType = 'all' | 'rivalry' | 'coaching' | 'historic';

const FILTER_OPTIONS: { value: FilterType; label: string; icon: LucideIcon }[] = [
  { value: 'all', label: 'All Triggers', icon: Flame },
  { value: 'rivalry', label: 'Rivalry', icon: Target },
  { value: 'coaching', label: 'Coaching', icon: MessageSquare },
  { value: 'historic', label: 'Historic', icon: Zap },
];

function IntensityBadge({ score }: { score: number }): React.ReactElement {
  let color = 'bg-warning/20 text-warning';
  let label = 'High';

  if (score >= 10) {
    color = 'bg-error/20 text-error';
    label = 'Max';
  } else if (score >= 9) {
    color = 'bg-ember/20 text-ember';
    label = 'Critical';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${color}`}
    >
      <Flame className="w-3 h-3" />
      {score}/10 {label}
    </span>
  );
}

function TriggerCard({ trigger }: { trigger: APITriggerWithSchool }): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg transition-all ${
        trigger.intensity_score >= 10
          ? 'bg-error/5 border-error/30'
          : trigger.intensity_score >= 9
            ? 'bg-ember/5 border-ember/30'
            : 'bg-warning/5 border-warning/30'
      }`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-white/40 uppercase tracking-wide">
                {trigger.school_name}
              </span>
              <IntensityBadge score={trigger.intensity_score} />
            </div>
            <h4 className="font-medium text-white mt-1 capitalize">
              {trigger.characteristic_key.replace(/_/g, ' ')}
            </h4>
            <p className={`text-sm text-white/60 mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}>
              {trigger.characteristic_value}
            </p>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-white/30 flex-shrink-0 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-white/5">
              <div className="pt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Source</span>
                  <span className="text-white/60 capitalize">{trigger.source_type}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Type</span>
                  <span className="text-white/60 capitalize">{trigger.characteristic_type}</span>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-white/40 mb-2">Content Planning Tips:</p>
                  <ul className="text-xs text-white/60 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-burnt-orange mt-0.5">-</span>
                      Use this topic to drive engagement on game days
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-burnt-orange mt-0.5">-</span>
                      High-intensity triggers generate strong reactions
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-burnt-orange mt-0.5">-</span>
                      Consider using around rivalry matchups
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FilterButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
        active
          ? 'bg-burnt-orange/20 text-burnt-orange border border-burnt-orange/30'
          : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

export function TriggerAlert({
  minIntensity = 8,
  maxTriggers,
  className = '',
}: TriggerAlertProps): React.ReactElement {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAllTriggers, setShowAllTriggers] = useState(false);

  const {
    data: triggers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sec-triggers'],
    queryFn: fetchSECTriggers,
    staleTime: 1000 * 60 * 10,
  });

  // Filter by intensity
  const highIntensityTriggers = triggers.filter((t) => t.intensity_score >= minIntensity);

  // Apply type filter
  const filteredTriggers = highIntensityTriggers.filter((t) => {
    if (filter === 'all') return true;
    const key = t.characteristic_key.toLowerCase();
    if (filter === 'rivalry') {
      return key.includes('rival') || key.includes('bowl') || key.includes('vs');
    }
    if (filter === 'coaching') {
      return (
        key.includes('coach') ||
        key.includes('heupel') ||
        key.includes('sarkisian') ||
        key.includes('freeze') ||
        key.includes('kiffin') ||
        key.includes('saban')
      );
    }
    if (filter === 'historic') {
      return (
        key.includes('kick') ||
        key.includes('era') ||
        key.includes('legacy') ||
        key.includes('success')
      );
    }
    return true;
  });

  // Sort by intensity descending
  const sortedTriggers = [...filteredTriggers].sort(
    (a, b) => b.intensity_score - a.intensity_score
  );

  // Limit display
  const displayLimit = showAllTriggers ? sortedTriggers.length : (maxTriggers ?? 10);
  const displayedTriggers = sortedTriggers.slice(0, displayLimit);
  const hasMore = sortedTriggers.length > displayLimit;

  // Stats
  const uniqueSchools = new Set(highIntensityTriggers.map((t) => t.school_id)).size;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-error mx-auto mb-2" />
          <p className="text-error">Failed to load triggers</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-error" />
              SEC Trigger Alerts
            </CardTitle>
            <p className="text-sm text-white/50 mt-1">
              High-intensity emotional triggers for content planning
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-error">{highIntensityTriggers.length}</p>
              <p className="text-xs text-white/40">Hot Triggers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-burnt-orange">{uniqueSchools}</p>
              <p className="text-xs text-white/40">Schools</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-white/40" />
          {FILTER_OPTIONS.map((opt) => (
            <FilterButton
              key={opt.value}
              active={filter === opt.value}
              icon={opt.icon}
              label={opt.label}
              onClick={() => setFilter(opt.value)}
            />
          ))}
        </div>

        {/* Trigger List */}
        <div className="space-y-3">
          {displayedTriggers.length === 0 ? (
            <div className="py-8 text-center text-white/50">
              No triggers match the current filter
            </div>
          ) : (
            displayedTriggers.map((trigger) => <TriggerCard key={trigger.id} trigger={trigger} />)
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAllTriggers(!showAllTriggers)}
            className="w-full py-2 text-sm text-burnt-orange hover:text-burnt-orange/80 transition-colors"
          >
            {showAllTriggers
              ? 'Show Less'
              : `Show ${sortedTriggers.length - displayLimit} more triggers`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
