'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';

export interface DashboardPrefs {
  favoriteSports: string[];
  favoriteTeams: string[]; // team slugs
}

interface TeamOption {
  slug: string;
  name: string;
  abbreviation: string;
  logo: string;
  conference: string;
}

const SPORTS = ['College Baseball', 'MLB', 'NFL', 'NBA', 'College Football', 'College Basketball'];
const DEFAULT_PREFS: DashboardPrefs = { favoriteSports: ['College Baseball'], favoriteTeams: [] };
const STORAGE_KEY = 'bsi-dashboard-prefs';

export function useDashboardPrefs(): [DashboardPrefs, (prefs: DashboardPrefs) => void] {
  const [prefs, setPrefs] = useState<DashboardPrefs>(DEFAULT_PREFS);
  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) setPrefs(JSON.parse(s)); } catch {}
  }, []);
  const save = (next: DashboardPrefs) => {
    setPrefs(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };
  return [prefs, save];
}

interface DashboardConfiguratorProps {
  prefs: DashboardPrefs;
  onChange: (prefs: DashboardPrefs) => void;
  onClose: () => void;
}

export function DashboardConfigurator({ prefs, onChange, onClose }: DashboardConfiguratorProps) {
  const [local, setLocal] = useState(prefs);
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [teamSearch, setTeamSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch team list for typeahead
  useEffect(() => {
    fetch('/api/college-baseball/teams/all')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { teams?: TeamOption[] } | null) => {
        if (data?.teams) {
          setTeamOptions(
            data.teams.map((t) => ({
              slug: t.slug,
              name: t.name,
              abbreviation: t.abbreviation,
              logo: t.logo,
              conference: t.conference,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const toggleSport = (sport: string) => {
    setLocal((prev) => ({
      ...prev,
      favoriteSports: prev.favoriteSports.includes(sport)
        ? prev.favoriteSports.filter((s) => s !== sport)
        : [...prev.favoriteSports, sport],
    }));
  };

  const addTeam = (slug: string) => {
    if (!local.favoriteTeams.includes(slug)) {
      setLocal((prev) => ({
        ...prev,
        favoriteTeams: [...prev.favoriteTeams, slug],
      }));
    }
    setTeamSearch('');
    setShowDropdown(false);
  };

  const removeTeam = (slug: string) => {
    setLocal((prev) => ({
      ...prev,
      favoriteTeams: prev.favoriteTeams.filter((s) => s !== slug),
    }));
  };

  // Filter teams for typeahead
  const filteredTeams = useMemo(() => {
    if (!teamSearch) return [];
    const q = teamSearch.toLowerCase();
    return teamOptions
      .filter(
        (t) =>
          !local.favoriteTeams.includes(t.slug) &&
          (t.name.toLowerCase().includes(q) || t.abbreviation.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [teamSearch, teamOptions, local.favoriteTeams]);

  // Resolve slugs to team objects for display
  const favoriteTeamObjects = useMemo(() => {
    return local.favoriteTeams
      .map((slug) => teamOptions.find((t) => t.slug === slug))
      .filter((t): t is TeamOption => !!t);
  }, [local.favoriteTeams, teamOptions]);

  return (
    <Card padding="lg" className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold text-text-primary">CUSTOMIZE DASHBOARD</h2>
        <button onClick={onClose} className="text-text-tertiary hover:text-white transition-colors p-1" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Favorite Sports */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
          Favorite Sports
        </h3>
        <div className="flex flex-wrap gap-2">
          {SPORTS.map((sport) => (
            <button
              key={sport}
              onClick={() => toggleSport(sport)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                local.favoriteSports.includes(sport)
                  ? 'bg-burnt-orange text-white'
                  : 'bg-charcoal text-text-secondary hover:text-white'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      {/* Favorite Teams */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
          Favorite Teams
        </h3>

        {/* Current favorites */}
        {favoriteTeamObjects.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {favoriteTeamObjects.map((team) => (
              <div
                key={team.slug}
                className="flex items-center gap-2 px-3 py-1.5 bg-burnt-orange/15 text-burnt-orange rounded-lg text-sm"
              >
                <Image
                  src={team.logo}
                  alt=""
                  width={16}
                  height={16}
                  className="object-contain"
                  unoptimized
                />
                <span className="font-medium">{team.abbreviation}</span>
                <button
                  onClick={() => removeTeam(team.slug)}
                  className="hover:text-white transition-colors"
                  aria-label={`Remove ${team.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Typeahead search */}
        <div className="relative">
          <input
            ref={searchRef}
            type="text"
            value={teamSearch}
            onChange={(e) => {
              setTeamSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => {
              // Delay to allow click on dropdown item
              setTimeout(() => setShowDropdown(false), 200);
            }}
            placeholder="Search teams to add..."
            aria-label="Search teams to add to dashboard"
            className="w-full px-3 py-2 bg-charcoal border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-burnt-orange/50 transition-colors"
          />

          {/* Dropdown */}
          {showDropdown && filteredTeams.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-midnight border border-border rounded-lg overflow-hidden shadow-lg max-h-48 overflow-y-auto">
              {filteredTeams.map((team) => (
                <button
                  key={team.slug}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addTeam(team.slug)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-light transition-colors text-left"
                >
                  <Image
                    src={team.logo}
                    alt=""
                    width={20}
                    height={20}
                    className="object-contain flex-shrink-0"
                    unoptimized
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary truncate">{team.name}</p>
                    <p className="text-[10px] text-text-muted">{team.conference}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {teamOptions.length === 0 && (
          <p className="text-[11px] text-text-muted mt-2">
            Team search available when NCAA Baseball is selected
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => { onChange(local); onClose(); }}
          className="px-6 py-2 bg-burnt-orange hover:bg-burnt-orange/80 text-white rounded-lg font-medium transition-colors"
        >
          Save
        </button>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-charcoal text-text-secondary hover:text-white rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </Card>
  );
}
