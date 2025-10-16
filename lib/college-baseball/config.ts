/**
 * Blaze Sports Intel - College Baseball Configuration
 * Mobile-First Platform for NCAA Baseball Coverage
 * 
 * MVP Feature Set:
 * - Live game list with 30s updates
 * - Full sortable box scores
 * - Conference standings
 * - Team/player pages
 * - Favorites and push notifications
 */

export interface CollegeBaseballConfig {
  divisions: string[];
  conferences: Conference[];
  dataSources: DataSource[];
  caching: CachingStrategy;
  features: FeatureFlags;
}

export interface Conference {
  id: string;
  name: string;
  division: string;
  teams: string[];
}

export interface DataSource {
  name: string;
  type: 'scraper' | 'api';
  priority: number;
  endpoints: {
    games?: string;
    boxscores?: string;
    standings?: string;
    teams?: string;
    players?: string;
  };
  rateLimit?: {
    requestsPerMinute: number;
    burstLimit: number;
  };
}

export interface CachingStrategy {
  liveGame: {
    ttl: number; // seconds
    staleWhileRevalidate: number;
  };
  boxScore: {
    live: { ttl: number; staleWhileRevalidate: number };
    final: { ttl: number; staleWhileRevalidate: number };
  };
  standings: {
    ttl: number;
    staleWhileRevalidate: number;
  };
  teamPages: {
    ttl: number;
    staleWhileRevalidate: number;
  };
  playerPages: {
    ttl: number;
    staleWhileRevalidate: number;
  };
}

export interface FeatureFlags {
  liveScoring: boolean;
  pitchByPitch: boolean;
  advancedMetrics: boolean;
  pushNotifications: boolean;
  offlineCaching: boolean;
  nlgRecaps: boolean;
  nlgPreviews: boolean;
  videoHighlights: boolean;
  playerCareerLogs: boolean;
}

// Default configuration for MVP
export const COLLEGE_BASEBALL_CONFIG: CollegeBaseballConfig = {
  divisions: ['D1', 'D2', 'D3', 'JUCO'],
  
  conferences: [
    {
      id: 'sec',
      name: 'SEC',
      division: 'D1',
      teams: ['LSU', 'Tennessee', 'Texas', 'Arkansas', 'Vanderbilt', 'Florida', 'Texas A&M', 
              'Ole Miss', 'Mississippi State', 'Auburn', 'Georgia', 'South Carolina', 
              'Alabama', 'Kentucky', 'Missouri']
    },
    {
      id: 'acc',
      name: 'ACC',
      division: 'D1',
      teams: ['Wake Forest', 'Duke', 'Clemson', 'NC State', 'Virginia', 'Louisville', 
              'North Carolina', 'Florida State', 'Miami', 'Georgia Tech', 'Notre Dame']
    },
    {
      id: 'big12',
      name: 'Big 12',
      division: 'D1',
      teams: ['TCU', 'Oklahoma State', 'Texas Tech', 'West Virginia', 'Kansas State', 
              'Baylor', 'Kansas', 'Oklahoma']
    },
    {
      id: 'pac12',
      name: 'Pac-12',
      division: 'D1',
      teams: ['Stanford', 'Oregon State', 'UCLA', 'Arizona', 'USC', 'Washington', 
              'Oregon', 'Arizona State', 'Cal', 'Utah']
    },
    {
      id: 'big10',
      name: 'Big Ten',
      division: 'D1',
      teams: ['Nebraska', 'Maryland', 'Indiana', 'Michigan', 'Rutgers', 'Ohio State', 
              'Iowa', 'Minnesota', 'Illinois', 'Northwestern', 'Penn State', 'Purdue']
    }
  ],

  dataSources: [
    {
      name: 'D1Baseball',
      type: 'scraper',
      priority: 1,
      endpoints: {
        games: 'https://d1baseball.com/scores/',
        standings: 'https://d1baseball.com/standings/',
        teams: 'https://d1baseball.com/teams/',
      },
      rateLimit: {
        requestsPerMinute: 30,
        burstLimit: 10
      }
    },
    {
      name: 'NCAA Stats',
      type: 'scraper',
      priority: 2,
      endpoints: {
        games: 'https://stats.ncaa.org/season_divisions/',
        boxscores: 'https://stats.ncaa.org/contests/',
        standings: 'https://stats.ncaa.org/rankings/',
      },
      rateLimit: {
        requestsPerMinute: 20,
        burstLimit: 5
      }
    }
  ],

  // Aggressive caching per the problem statement
  caching: {
    liveGame: {
      ttl: 30, // 30 seconds for live game updates
      staleWhileRevalidate: 15
    },
    boxScore: {
      live: {
        ttl: 15, // 15s for live box scores
        staleWhileRevalidate: 10
      },
      final: {
        ttl: 3600, // 1 hour for final games
        staleWhileRevalidate: 300
      }
    },
    standings: {
      ttl: 300, // 5 minutes for standings
      staleWhileRevalidate: 60
    },
    teamPages: {
      ttl: 3600, // 1 hour for team pages
      staleWhileRevalidate: 300
    },
    playerPages: {
      ttl: 3600, // 1 hour for player pages
      staleWhileRevalidate: 300
    }
  },

  // MVP feature set
  features: {
    liveScoring: true,
    pitchByPitch: false, // Post-MVP
    advancedMetrics: false, // Post-MVP
    pushNotifications: true,
    offlineCaching: true,
    nlgRecaps: true,
    nlgPreviews: true,
    videoHighlights: false, // Post-MVP
    playerCareerLogs: false // Post-MVP
  }
};

// Helper functions
export function getConferenceTeams(conferenceId: string): string[] {
  const conference = COLLEGE_BASEBALL_CONFIG.conferences.find(c => c.id === conferenceId);
  return conference?.teams || [];
}

export function getCacheTTL(dataType: 'liveGame' | 'boxScore' | 'standings' | 'teamPages' | 'playerPages', status?: 'live' | 'final'): number {
  if (dataType === 'boxScore' && status) {
    return COLLEGE_BASEBALL_CONFIG.caching.boxScore[status].ttl;
  }
  const cacheConfig = COLLEGE_BASEBALL_CONFIG.caching[dataType];
  if (cacheConfig && 'ttl' in cacheConfig) {
    return cacheConfig.ttl;
  }
  return 300;
}

export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return COLLEGE_BASEBALL_CONFIG.features[feature] || false;
}
