export type ShowSourceKind =
  | 'official_api'
  | 'compat_official_api'
  | 'official_web'
  | 'community_fallback'
  | 'bsi_internal';

export interface ShowSourceStatus {
  seasonLabel: string;
  requestedHost: string;
  resolvedHost: string;
  itemPageHost: string;
  gameCode: string;
  officialApiAvailable: boolean;
  officialWebAvailable: boolean;
  compatibilityMode: boolean;
  notes: string[];
  catalogReady?: boolean;
  marketReady?: boolean;
  collectionsReady?: boolean;
  acquisitionReady?: boolean;
  lastSyncAt?: string | null;
  cardCount?: number;
  collectionCount?: number;
  degradedReason?: string;
}

export interface ShowCardAttributes {
  stamina: number;
  pitchingClutch: number;
  hitsPerBf: number;
  kPerBf: number;
  bbPerBf: number;
  hrPerBf: number;
  pitchVelocity: number;
  pitchControl: number;
  pitchMovement: number;
  contactLeft: number;
  contactRight: number;
  powerLeft: number;
  powerRight: number;
  plateVision: number;
  plateDiscipline: number;
  battingClutch: number;
  buntingAbility: number;
  dragBuntingAbility: number;
  hittingDurability: number;
  fieldingDurability: number;
  fieldingAbility: number;
  armStrength: number;
  armAccuracy: number;
  reactionTime: number;
  blocking: number;
  speed: number;
  baserunningAbility: number;
  baserunningAggression: number;
}

export interface ShowCardSummary {
  id: string;
  name: string;
  overall: number;
  rarity: string;
  team: string;
  teamShortName: string;
  series: string;
  seriesYear: number | null;
  setName: string | null;
  isLiveSet: boolean;
  primaryPosition: string;
  secondaryPositions: string[];
  bats: string;
  throws: string;
  born: string | null;
  imageUrl: string;
  bakedImageUrl: string | null;
  locations: string[];
  isSellable: boolean;
  hasAugment: boolean;
  augmentText: string | null;
  isHitter: boolean;
  attributes: ShowCardAttributes;
  sourceKind: ShowSourceKind;
  sourceName: string;
  sourceUpdatedAt: string;
}

export interface ShowMarketCurrent {
  cardId: string;
  bestBuyNow: number | null;
  bestSellNow: number | null;
  lastSalePrice: number | null;
  midPrice: number | null;
  spread: number | null;
  listingCount: number | null;
  sourceKind: ShowSourceKind;
  sourceName: string;
  capturedAt: string;
}

export interface ShowCaptainBoostTier {
  tier: number;
  description: string;
  attributes: Array<{ name: string; value: number }>;
}

export interface ShowCaptainCard {
  id: string;
  name: string;
  team: string;
  overall: number;
  imageUrl: string;
  bakedImageUrl: string | null;
  position: string;
  abilityName: string;
  abilityDescription: string;
  updatedAt: string;
  boosts: ShowCaptainBoostTier[];
}

export interface ShowHistoryPoint {
  cardId: string;
  label: string;
  capturedAt: string;
  bestBuyNow: number | null;
  bestSellNow: number | null;
  spread: number | null;
  lastSalePrice: number | null;
  listingCount: number | null;
  seriesType: 'official_daily' | 'official_completed_orders' | 'bsi_intraday';
  sourceName: string;
}

export interface ShowAcquisitionPath {
  cardId: string;
  label: string;
  sourceName: string;
  sourceKind: ShowSourceKind;
  confidence: 'verified' | 'partial';
}

export interface ShowCollectionSummary {
  id: string;
  name: string;
  type: 'series' | 'set' | 'location';
  cardCount: number;
  lowStubCost: number | null;
  highStubCost: number | null;
}

export interface ShowCollectionDetail {
  collection: ShowCollectionSummary;
  cards: Array<ShowCardSummary & { market: ShowMarketCurrent | null; isCaptain: boolean }>;
  page: number;
  perPage: number;
  totalCards: number;
  totalPages: number;
}

export interface ShowWatchEvent {
  eventId: string;
  cardId: string;
  cardName: string;
  cardImageUrl: string | null;
  cardOverall: number | null;
  cardTeam: string | null;
  cardRarity: string | null;
  eventType: string;
  eventLabel: string;
  previousValue: number | null;
  currentValue: number | null;
  deltaValue: number | null;
  triggeredAt: string;
  details: Record<string, unknown>;
}

export interface ShowHistorySummary {
  sampleCount: number;
  latestValue: number | null;
  earliestValue: number | null;
  highValue: number | null;
  lowValue: number | null;
  deltaValue: number | null;
  deltaPct: number | null;
  averageValue: number | null;
  volatility: number | null;
  officialPoints: number;
  intradayPoints: number;
  completedSalePoints: number;
}

export interface ShowMarketOverview {
  totalCards: number;
  sellableCards: number;
  compatibilityMode: boolean;
  topBuyNow: Array<ShowCardSummary & { market: ShowMarketCurrent | null }>;
  topSellNow: Array<ShowCardSummary & { market: ShowMarketCurrent | null }>;
  captainSpotlight: ShowCaptainCard[];
  newlyTracked: ShowCardSummary[];
}

export interface ShowCardDetail {
  card: ShowCardSummary;
  market: ShowMarketCurrent | null;
  captain: ShowCaptainCard | null;
  acquisitionPaths: ShowAcquisitionPath[];
  collections: ShowCollectionSummary[];
  historyPreview: ShowHistoryPoint[];
  sourceStatus: ShowSourceStatus;
}

export interface DDRosterSlot {
  id: string;
  label: string;
  group: 'captain' | 'lineup' | 'bench' | 'rotation' | 'bullpen';
  accepts: string[];
}

export interface DDBuildCardSelection {
  slotId: string;
  cardId: string;
  displayName: string;
  team: string;
  primaryPosition: string;
  secondaryPositions: string[];
  overall: number;
  bats: string;
  bestSellNow: number | null;
  rarity: string;
  series: string;
  themeTag: string | null;
  localParallelLevel: number;
  localParallelModLabel: string | null;
}

export interface DDBuildSummary {
  totalStubCost: number;
  averageOverall: number;
  captainEligibleCount: number;
  hitterHandedness: {
    left: number;
    right: number;
    switch: number;
  };
  themeTeams: string[];
}

export interface DDBuildRecord {
  buildId: string;
  title: string;
  seasonLabel: string;
  captainCardId: string | null;
  cards: DDBuildCardSelection[];
  summary: DDBuildSummary;
  createdAt: string;
  updatedAt: string;
}
