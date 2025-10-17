/**
 * College Baseball Box Score Ingest Schedule
 * Runs every minute to capture latest live updates from Highlightly and SportsRadar.
 */

export default {
  async scheduled(event, env, ctx) {
    const module = await import('../ingest/baseball/boxscores.ts');
    const { ingestBaseballBoxscores } = module;
    await ingestBaseballBoxscores(env, { date: event.cron });
  },
};
