/**
 * BSI Video & Record Book Components
 * 
 * Usage:
 * import { InlineClip, HeroReel, LeagueDeepDive, HistoricalRecordBook } from '@bsi/components';
 */

// Stream Video Components
export { 
  InlineClip, 
  HeroReel, 
  LeagueDeepDive, 
  BaseStreamPlayer 
} from './StreamVideo';

export type { 
  StreamVideoProps, 
  BasePlayerProps 
} from './StreamVideo';

// Historical Record Book
export { 
  HistoricalRecordBook 
} from './HistoricalRecordBook';

// Re-export types from HistoricalRecordBook if needed
// (Types are internal to the component for now)
