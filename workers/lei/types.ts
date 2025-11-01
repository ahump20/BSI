import type { D1Database } from '@cloudflare/workers-types';
import type { PlayContext, LeverageResponse } from '../../lib/lei/types';

export interface Env {
  /** Optional D1 database for persisting request audit logs. */
  LEI_LOGS?: D1Database;
  /** Optional secret used to gate the endpoint. */
  LEI_API_TOKEN?: string;
}

export interface LEIRequestBody extends Partial<PlayContext> {
  sport: PlayContext['sport'];
  playoff_round?: PlayContext['playoffRound'];
  pre_play_win_prob?: number;
  post_play_win_prob?: number;
}

export interface LEIComputationResult extends LeverageResponse {
  context: PlayContext;
}
