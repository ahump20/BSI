/**
 * BSI infrastructure stats — single source of truth.
 * Used in HeroSection, StatsBand, and CtaSection.
 * Update here when workers/databases/sports change.
 */
export const BSI_STATS = {
  WORKERS: 53,
  D1_DATABASES: 12,
  SPORTS_COVERED: 5,
  SCORE_UPDATE_SECONDS: 30,
} as const;
