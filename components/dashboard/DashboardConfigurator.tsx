'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

interface DashboardPrefs {
  favoriteSports: string[];
  favoriteTeams: string[];
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
  const toggleSport = (sport: string) => {
    setLocal((prev) => ({
      ...prev,
      favoriteSports: prev.favoriteSports.includes(sport)
        ? prev.favoriteSports.filter((s) => s !== sport)
        : [...prev.favoriteSports, sport],
    }));
  };

  return (
    <Card padding="lg" className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold text-text-primary">Customize Dashboard</h2>
        <button onClick={onClose} className="text-text-tertiary hover:text-white transition-colors" aria-label="Close">&times;</button>
      </div>
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Favorite Sports</h3>
        <div className="flex flex-wrap gap-2">
          {SPORTS.map((sport) => (
            <button key={sport} onClick={() => toggleSport(sport)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${local.favoriteSports.includes(sport) ? 'bg-burnt-orange text-white' : 'bg-charcoal text-text-secondary hover:text-white'}`}>{sport}</button>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => { onChange(local); onClose(); }} className="px-6 py-2 bg-burnt-orange hover:bg-burnt-orange/80 text-white rounded-lg font-medium transition-colors">Save</button>
        <button onClick={onClose} className="px-6 py-2 bg-charcoal text-text-secondary hover:text-white rounded-lg font-medium transition-colors">Cancel</button>
      </div>
    </Card>
  );
}
