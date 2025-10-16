/**
 * Blaze Sports Intel - Data Configuration
 * Championship Intelligence Platform
 * blazesportsintel.com
 *
 * Comprehensive sports data integration configuration
 * Optimized for Cloudflare Pages deployment
 */

export const DATA_CONFIG = {
  // Platform Configuration
  platform: {
    name: 'Blaze Sports Intel',
    domain: 'blazesportsintel.com',
    tagline: 'Deep South Sports Authority',
    mission: 'From Friday Night Lights to Sunday in the Show',
    description: 'The Dave Campbell\'s of SEC, Texas, and Deep South athletics'
  },

  // API Endpoints (Cloudflare Functions)
  endpoints: {
    base: 'https://blazesportsintel.com/api',
    sports_data: '/api/sports-data',
    live_scores: '/api/live-scores',
    analytics: '/api/analytics',
    predictions: '/api/predictions',
    nil_calculator: '/api/nil-calculator',
    perfect_game: '/api/perfect-game',
    texas_hs: '/api/texas-hs'
  },

  // Sports Coverage Configuration
  sports: {
    mlb: {
      enabled: true,
      featured_teams: ['Cardinals', 'Astros', 'Rangers', 'Braves'],
      data_sources: ['MLB Stats API', 'Baseball Reference', 'FanGraphs'],
      update_interval: 300, // 5 minutes
      endpoints: {
        standings: '/mlb/standings',
        scores: '/mlb/scores',
        stats: '/mlb/stats',
        prospects: '/mlb/prospects'
      }
    },

    nfl: {
      enabled: true,
      featured_teams: ['Titans', 'Texans', 'Cowboys', 'Saints'],
      data_sources: ['NFL API', 'Pro Football Reference', 'PFF'],
      update_interval: 300,
      endpoints: {
        standings: '/nfl/standings',
        scores: '/nfl/scores',
        stats: '/nfl/stats',
        draft: '/nfl/draft'
      }
    },

    nba: {
      enabled: true,
      featured_teams: ['Grizzlies', 'Mavericks', 'Spurs', 'Pelicans'],
      data_sources: ['NBA API', 'Basketball Reference'],
      update_interval: 300,
      endpoints: {
        standings: '/nba/standings',
        scores: '/nba/scores',
        stats: '/nba/stats'
      }
    },

    ncaa: {
      enabled: true,
      featured_programs: {
        football: ['Texas', 'Alabama', 'Georgia', 'LSU', 'Tennessee'],
        baseball: ['LSU', 'Tennessee', 'Texas', 'Arkansas', 'Vanderbilt'],
        basketball: ['Kentucky', 'Tennessee', 'Auburn', 'Alabama', 'Texas']
      },
      conferences: ['SEC', 'Big 12', 'ACC'],
      data_sources: ['NCAA API', 'College Football Data API'],
      update_interval: 600,
      endpoints: {
        football: '/ncaa/football',
        baseball: '/ncaa/baseball',
        basketball: '/ncaa/basketball',
        recruiting: '/ncaa/recruiting'
      }
    },

    college_baseball: {
      enabled: true,
      mobile_first: true,
      divisions: ['D1', 'D2', 'D3', 'JUCO'],
      featured_conferences: ['SEC', 'ACC', 'Big 12', 'Pac-12', 'Big Ten'],
      data_sources: ['D1Baseball', 'NCAA Stats API'],
      update_interval: 30, // 30 seconds for live games
      features: {
        live_scoring: true,
        pitch_by_pitch: false, // Post-MVP
        advanced_metrics: false, // Post-MVP
        push_notifications: true,
        offline_caching: true,
        nlg_recaps: true,
        nlg_previews: true,
        video_highlights: false, // Post-MVP
        player_career_logs: false // Post-MVP
      },
      caching: {
        live_game: 30, // seconds
        boxscore_live: 15,
        boxscore_final: 3600,
        standings: 300,
        team_pages: 3600,
        player_pages: 3600
      },
      endpoints: {
        games: '/college-baseball/games',
        boxscore: '/college-baseball/boxscore',
        standings: '/college-baseball/standings',
        teams: '/college-baseball/teams',
        players: '/college-baseball/players'
      }
    },

    perfect_game: {
      enabled: true,
      coverage: {
        showcases: true,
        tournaments: true,
        rankings: true,
        recruiting: true
      },
      regions: ['Texas', 'Louisiana', 'Mississippi', 'Alabama', 'Georgia'],
      age_groups: ['14U', '15U', '16U', '17U', '18U'],
      update_interval: 3600, // 1 hour
      endpoints: {
        rankings: '/perfect-game/rankings',
        events: '/perfect-game/events',
        prospects: '/perfect-game/prospects'
      }
    },

    texas_hs: {
      enabled: true,
      classifications: ['6A', '5A', '4A', '3A', '2A', '1A'],
      divisions: ['Division I', 'Division II'],
      regions: ['DFW', 'Houston', 'San Antonio', 'Austin', 'East Texas', 'West Texas'],
      data_sources: ['Dave Campbell\'s Texas Football', 'MaxPreps', 'UIL'],
      update_interval: 1800, // 30 minutes
      endpoints: {
        rankings: '/texas-hs/rankings',
        scores: '/texas-hs/scores',
        recruiting: '/texas-hs/recruiting',
        playoffs: '/texas-hs/playoffs'
      }
    }
  },

  // International Pipeline Configuration
  international: {
    latin_america: {
      enabled: true,
      countries: ['Dominican Republic', 'Venezuela', 'Cuba', 'Mexico', 'Puerto Rico'],
      focus: 'Baseball prospects and academies'
    },
    asia_pacific: {
      enabled: true,
      countries: ['Japan', 'South Korea', 'Taiwan'],
      leagues: ['NPB', 'KBO', 'CPBL'],
      focus: 'Professional players and posting system'
    }
  },

  // Caching Configuration (Cloudflare KV)
  caching: {
    live_scores: {
      ttl: 60, // 1 minute
      stale_while_revalidate: 30
    },
    standings: {
      ttl: 300, // 5 minutes
      stale_while_revalidate: 60
    },
    stats: {
      ttl: 3600, // 1 hour
      stale_while_revalidate: 300
    },
    prospects: {
      ttl: 86400, // 24 hours
      stale_while_revalidate: 3600
    }
  },

  // Analytics Configuration
  analytics: {
    metrics: {
      baseball: ['OPS+', 'wRC+', 'FIP', 'WAR', 'xBA', 'xSLG', 'Barrel%'],
      football: ['EPA', 'DVOA', 'Success Rate', 'YAC', 'Pressure Rate'],
      basketball: ['PER', 'TS%', 'USG%', 'BPM', 'VORP', 'Net Rating']
    },
    advanced: {
      monte_carlo: true,
      machine_learning: true,
      computer_vision: true,
      biomechanics: true
    }
  },

  // Data Refresh Schedule (Cron)
  refresh_schedule: {
    live_games: '*/1 * * * *', // Every minute during games
    scores: '*/5 * * * *', // Every 5 minutes
    standings: '*/30 * * * *', // Every 30 minutes
    stats: '0 */1 * * *', // Every hour
    prospects: '0 0 * * *' // Daily at midnight
  },

  // Cloudflare Configuration
  cloudflare: {
    workers: {
      routes: [
        'blazesportsintel.com/api/*',
        'api.blazesportsintel.com/*'
      ]
    },
    kv_namespaces: [
      'CACHE',
      'ANALYTICS_KV',
      'CONFIG',
      'SPORTS_CACHE'
    ],
    r2_buckets: [
      'MEDIA_BUCKET',
      'DATA_BUCKET',
      'ANALYTICS_BUCKET'
    ],
    d1_databases: [
      'blazesportsintel-production'
    ]
  },

  // Feature Flags
  features: {
    live_scoring: true,
    real_time_analytics: true,
    predictive_modeling: true,
    nil_valuation: true,
    recruiting_pipeline: true,
    international_scouting: true,
    biomechanical_analysis: true,
    character_assessment: true,
    championship_predictions: true
  },

  // Error Handling
  error_handling: {
    retry_attempts: 3,
    retry_delay: 1000, // 1 second
    fallback_to_cache: true,
    error_reporting: true,
    sentry_enabled: false // Set to true in production
  }
};

// Helper function to get sport configuration
export function getSportConfig(sport) {
  return DATA_CONFIG.sports[sport.toLowerCase()] || null;
}

// Helper function to get endpoint URL
export function getEndpointUrl(endpoint) {
  return `${DATA_CONFIG.endpoints.base}${endpoint}`;
}

// Helper function to check if feature is enabled
export function isFeatureEnabled(feature) {
  return DATA_CONFIG.features[feature] || false;
}

// Helper function to get cache TTL
export function getCacheTTL(dataType) {
  return DATA_CONFIG.caching[dataType]?.ttl || 300;
}

// Export for use in Cloudflare Functions
export default DATA_CONFIG;