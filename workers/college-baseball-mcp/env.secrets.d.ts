// Secrets set via: wrangler secret put BSI_API_KEY && wrangler secret put HIGHLIGHTLY_API_KEY && wrangler secret put SPORTSDATAIO_API_KEY && wrangler secret put SAVANT_PRO_KEY
interface Env {
  BSI_API_KEY?: string;
  HIGHLIGHTLY_API_KEY?: string;
  SPORTSDATAIO_API_KEY?: string;
  /** Internal service key provisioned in BSI_KEYS KV with tier:'pro' for savant leaderboard access */
  SAVANT_PRO_KEY?: string;
}
