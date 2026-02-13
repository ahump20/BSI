'use client';

/**
 * Interactive grid mapping CV companies to sports and maturity levels.
 * Filterable by sport — used on the Vision AI Hub page.
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';

type Maturity = 'production' | 'growth' | 'research';
type Sport = 'MLB' | 'NFL' | 'NBA' | 'NCAA Baseball' | 'NCAA Football' | 'All';

interface TechEntry {
  company: string;
  domain: string;
  maturity: Maturity;
  sports: Sport[];
  detail: string;
}

const TECH_ENTRIES: TechEntry[] = [
  { company: 'Hawk-Eye (Sony)', domain: 'Player Tracking', maturity: 'production', sports: ['MLB', 'NBA'], detail: '12 cameras/venue, sub-mm ball tracking, skeletal pose estimation' },
  { company: 'KinaTrax (Sony)', domain: 'Biomechanics', maturity: 'production', sports: ['MLB', 'NCAA Baseball'], detail: 'Markerless 3D motion capture — elbow torque, shoulder rotation' },
  { company: 'Statcast (MLB)', domain: 'Player Tracking', maturity: 'production', sports: ['MLB'], detail: '225+ metrics/pitch, bat tracking operational across all 30 parks' },
  { company: 'Second Spectrum', domain: 'Player Tracking', maturity: 'production', sports: ['NBA'], detail: 'Genius Sports analytics layer — 29 keypoints per player' },
  { company: 'Zebra RFID', domain: 'Player Tracking', maturity: 'production', sports: ['NFL'], detail: 'UWB tags at 10Hz — Next Gen Stats (not CV, but foundational)' },
  { company: 'Catapult', domain: 'Player Tracking', maturity: 'production', sports: ['NFL', 'NCAA Football'], detail: 'GPS/IMU dominant across SEC and Power 4' },
  { company: 'Rapsodo', domain: 'Scouting', maturity: 'production', sports: ['MLB', 'NCAA Baseball'], detail: '$3K-$5K camera units — accessible to mid-tier programs' },
  { company: 'TrackMan', domain: 'Scouting', maturity: 'production', sports: ['MLB', 'NCAA Baseball'], detail: 'Radar + optical — $20K+, gold standard for pitch analysis' },
  { company: 'Synergy Sports', domain: 'Scouting', maturity: 'production', sports: ['NBA', 'NCAA Baseball'], detail: '~90% of D1 baseball coverage, comprehensive play-type tagging' },
  { company: 'WSC Sports', domain: 'Fan Engagement', maturity: 'production', sports: ['MLB', 'NFL', 'NBA'], detail: 'AI-driven automated highlights from broadcast feeds' },
  { company: 'Pixellot', domain: 'Fan Engagement', maturity: 'production', sports: ['NCAA Baseball', 'NCAA Football'], detail: 'Automated unmanned camera systems for streaming' },
  { company: 'SkillCorner', domain: 'Player Tracking', maturity: 'growth', sports: ['NFL', 'NCAA Football'], detail: 'Broadcast-feed tracking — speed, separation, get-off time' },
  { company: 'Hudl IQ', domain: 'Play Recognition', maturity: 'growth', sports: ['NCAA Football'], detail: 'CV-based tracking from All-22 film' },
  { company: 'Sportlogiq', domain: 'Play Recognition', maturity: 'growth', sports: ['NCAA Football'], detail: 'Acquired by Teamworks (Jan 2026) — formation recognition' },
  { company: 'Beyond Sports (Sony)', domain: 'Fan Engagement', maturity: 'growth', sports: ['MLB', 'NFL', 'NBA'], detail: 'Real-time 3D visualization of game data' },
  { company: 'STATSports (Sony)', domain: 'Biomechanics', maturity: 'growth', sports: ['NFL', 'NCAA Football'], detail: 'Wearable + CV integration for workload monitoring' },
  { company: 'Driveline', domain: 'Biomechanics', maturity: 'growth', sports: ['MLB', 'NCAA Baseball'], detail: 'Motion capture for pitching mechanics optimization' },
  { company: 'Zone7', domain: 'Injury Prediction', maturity: 'growth', sports: ['MLB', 'NFL', 'NBA'], detail: 'AI-based injury risk modeling from tracking data' },
  { company: 'NFL Digital Athlete', domain: 'Injury Prediction', maturity: 'growth', sports: ['NFL'], detail: '38 cameras, 5K video, 83x faster impact detection' },
  { company: 'FIFA SAOT', domain: 'Officiating', maturity: 'production', sports: ['All'], detail: 'Semi-Automated Offside Technology — limb tracking for offside calls' },
  { company: 'PitcherNet', domain: 'Biomechanics', maturity: 'research', sports: ['MLB', 'NCAA Baseball'], detail: 'ML pitch classification from broadcast video' },
  { company: 'RF-DETR', domain: 'Player Tracking', maturity: 'research', sports: ['All'], detail: 'Real-time object detection — open source (Roboflow)' },
  { company: 'RTMPose', domain: 'Biomechanics', maturity: 'research', sports: ['All'], detail: 'Open-source real-time pose estimation (MMPose)' },
  { company: 'ByteTrack', domain: 'Player Tracking', maturity: 'research', sports: ['All'], detail: 'Multi-object tracking — associates detections across frames' },
];

const SPORTS: Sport[] = ['All', 'MLB', 'NFL', 'NBA', 'NCAA Baseball', 'NCAA Football'];

const maturityConfig: Record<Maturity, { label: string; variant: 'success' | 'warning' | 'secondary' }> = {
  production: { label: 'Production', variant: 'success' },
  growth: { label: 'Growth', variant: 'warning' },
  research: { label: 'Research', variant: 'secondary' },
};

export function TechMaturityMap({ className = '' }: { className?: string }) {
  const [activeSport, setActiveSport] = useState<Sport>('All');
  const [activeMaturity, setActiveMaturity] = useState<Maturity | 'all'>('all');

  const filtered = TECH_ENTRIES.filter((entry) => {
    const sportMatch = activeSport === 'All' || entry.sports.includes(activeSport) || entry.sports.includes('All');
    const maturityMatch = activeMaturity === 'all' || entry.maturity === activeMaturity;
    return sportMatch && maturityMatch;
  });

  // Group by domain
  const grouped: Record<string, TechEntry[]> = {};
  filtered.forEach((entry) => {
    if (!grouped[entry.domain]) grouped[entry.domain] = [];
    grouped[entry.domain].push(entry);
  });

  return (
    <div className={className}>
      {/* Sport filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SPORTS.map((sport) => (
          <button
            key={sport}
            onClick={() => setActiveSport(sport)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
              activeSport === sport
                ? 'bg-burnt-orange/20 text-burnt-orange border-burnt-orange/40'
                : 'bg-white/5 text-text-tertiary border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      {/* Maturity filter */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveMaturity('all')}
          className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full border transition-all ${
            activeMaturity === 'all'
              ? 'bg-white/10 text-white border-white/20'
              : 'bg-transparent text-text-tertiary border-white/5 hover:text-white'
          }`}
        >
          All Stages
        </button>
        {(Object.keys(maturityConfig) as Maturity[]).map((m) => (
          <button
            key={m}
            onClick={() => setActiveMaturity(m)}
            className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full border transition-all ${
              activeMaturity === m
                ? `bg-white/10 text-white border-white/20`
                : 'bg-transparent text-text-tertiary border-white/5 hover:text-white'
            }`}
          >
            {maturityConfig[m].label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([domain, entries]) => (
          <div key={domain}>
            <h4 className="text-xs uppercase tracking-wider text-text-tertiary font-semibold mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-burnt-orange" />
              {domain}
            </h4>
            <div className="grid gap-2">
              {entries.map((entry) => (
                <div
                  key={entry.company}
                  className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10 rounded-lg px-4 py-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm">{entry.company}</span>
                        <Badge variant={maturityConfig[entry.maturity].variant} size="sm">
                          {maturityConfig[entry.maturity].label}
                        </Badge>
                      </div>
                      <p className="text-text-tertiary text-xs mt-1 leading-relaxed">{entry.detail}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                      {entry.sports.filter((s) => s !== 'All').map((sport) => (
                        <span
                          key={sport}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-text-muted font-mono"
                        >
                          {sport}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-text-muted text-xs">
          {filtered.length} {filtered.length === 1 ? 'technology' : 'technologies'} shown
        </span>
        <div className="flex gap-3">
          {(Object.keys(maturityConfig) as Maturity[]).map((m) => {
            const count = filtered.filter((e) => e.maturity === m).length;
            return (
              <span key={m} className="text-[10px] text-text-muted flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  m === 'production' ? 'bg-green-500' : m === 'growth' ? 'bg-yellow-500' : 'bg-white/30'
                }`} />
                {count} {maturityConfig[m].label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
