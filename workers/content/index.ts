/**
 * Content Generation Worker
 *
 * Generates game recaps and previews with fact-checking
 */

import {
  ArticleStatus,
  GameStatus,
  Prisma,
  PrismaClient,
  SeasonType,
} from '@prisma/client';
import type {
  Env,
  ContentRequest,
  ContentResponse,
  GameContext,
} from './types';
import { LLMProvider } from '../../lib/nlg/llm-provider';
import { FactChecker } from '../../lib/nlg/fact-checker';
import {
  RECAP_TEMPLATE,
  PREVIEW_TEMPLATE,
  fillRecapTemplate,
  fillPreviewTemplate,
} from '../../lib/nlg/prompt-templates';

const decimalToNumber = (value: Prisma.Decimal | number | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0;
  }

  return typeof value === 'number' ? value : value.toNumber();
};

const createArticleSlug = (gameId: string, type: 'recap' | 'preview'): string =>
  `game-${gameId}-${type}`.toLowerCase();

export default {
  /**
   * Scheduled handler for automatic content generation
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const cron = event.cron;

    try {
      if (cron === '*/15 * * * *') {
        // Every 15 minutes - Check for completed games needing recaps
        console.log('[ContentWorker] Checking for games needing recaps...');
        await generatePendingRecaps(env, ctx);
      } else if (cron === '0 */6 * * *') {
        // Every 6 hours - Check for upcoming games needing previews
        console.log('[ContentWorker] Checking for games needing previews...');
        await generatePendingPreviews(env, ctx);
      }
    } catch (error) {
      console.error('[ContentWorker] Scheduled job error:', error);

      // Log to Analytics Engine
      if (env.ANALYTICS) {
        env.ANALYTICS.writeDataPoint({
          blobs: ['content_generation_error'],
          doubles: [1],
          indexes: [cron],
        });
      }
    }
  },

  /**
   * HTTP handler for manual content generation
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          worker: 'content-generation',
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Manual content generation endpoint
    if (url.pathname === '/generate' && request.method === 'POST') {
      // Verify secret
      const authHeader = request.headers.get('Authorization');
      if (authHeader !== `Bearer ${env.CONTENT_SECRET}`) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
        const contentRequest: ContentRequest = await request.json();
        const result = await generateContent(contentRequest, env);

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('[ContentWorker] Generation error:', error);
        return new Response(
          JSON.stringify({ error: (error as Error).message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};

/**
 * Generate content for a specific game
 */
async function generateContent(request: ContentRequest, env: Env): Promise<ContentResponse> {
  const prisma = new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
  });

  try {
    // Fetch game context from database
    const context = await fetchGameContext(request.gameId, prisma);
    const slug = createArticleSlug(request.gameId, request.type);

    // Initialize LLM provider
    const llmProvider = new LLMProvider(
      env.ANTHROPIC_API_KEY,
      env.OPENAI_API_KEY,
      env.GOOGLE_GEMINI_API_KEY
    );

    // Generate content based on type
    const systemPrompt =
      request.type === 'recap' ? RECAP_TEMPLATE.system : PREVIEW_TEMPLATE.system;
    const userPrompt =
      request.type === 'recap' ? fillRecapTemplate(context) : fillPreviewTemplate(context);

    // Generate with LLM
    const llmResponse = await llmProvider.generateWithRetry({
      systemPrompt,
      userPrompt,
      maxTokens: request.maxTokens ?? 2000,
      temperature: request.temperature ?? 0.7,
      provider: request.provider ?? 'anthropic',
    });

    // Extract title and content
    const { title, content } = parseGeneratedContent(llmResponse.content);

    // Fact-check the content
    const factChecker = new FactChecker(prisma, context);
    const factCheckResults = await factChecker.verifyContent(content);
    const verificationScore = factChecker.calculateVerificationScore(factCheckResults);

    // Generate summary (first 2 sentences)
    const summary = generateSummary(content);

    // Calculate reading time
    const wordCount = content.split(/\s+/).length;
    const readingTimeMinutes = Math.ceil(wordCount / 200); // 200 WPM average

    // Store article in database
    const article = await prisma.article.upsert({
      where: { slug },
      update: {
        title,
        content,
        summary,
        sport: context.game.sport,
        league: context.game.league,
        status: ArticleStatus.PUBLISHED,
        author: 'Diamond Insights AutoPen',
        teamId: request.type === 'recap' ? context.game.homeTeamId : null,
        publishedAt: new Date(),
        source: `auto-${request.type}-${llmResponse.provider}`,
      },
      create: {
        slug,
        title,
        summary,
        content,
        sport: context.game.sport,
        league: context.game.league,
        status: ArticleStatus.PUBLISHED,
        author: 'Diamond Insights AutoPen',
        teamId: request.type === 'recap' ? context.game.homeTeamId : null,
        publishedAt: new Date(),
        source: `auto-${request.type}-${llmResponse.provider}`,
      },
    });

    // Log to Analytics Engine
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: [`content_generated_${request.type}`],
        doubles: [verificationScore.overallScore],
        indexes: [llmResponse.provider],
      });
    }

    return {
      articleId: article.id,
      gameId: request.gameId,
      type: request.type,
      title,
      content,
      summary,
      factChecked: true,
      factCheckResults,
      provider: llmResponse.provider,
      generatedAt: article.publishedAt.toISOString(),
      wordCount,
      readingTimeMinutes,
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Fetch game context from database
 */
async function fetchGameContext(gameId: string, prisma: PrismaClient): Promise<GameContext> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      venue: {
        select: { name: true },
      },
      homeTeam: {
        include: {
          conference: {
            select: { name: true },
          },
          teamStats: {
            where: { season: new Date().getFullYear(), seasonType: SeasonType.REGULAR },
            take: 1,
          },
        },
      },
      awayTeam: {
        include: {
          conference: {
            select: { name: true },
          },
          teamStats: {
            where: { season: new Date().getFullYear(), seasonType: SeasonType.REGULAR },
            take: 1,
          },
        },
      },
      boxLines: {
        include: {
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true,
            },
          },
        },
        orderBy: {
          totalBases: 'desc',
        },
        take: 10,
      },
    },
  });

  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  const homeTeamStats = game.homeTeam.teamStats[0];
  const awayTeamStats = game.awayTeam.teamStats[0];

  const context: GameContext = {
    game: {
      id: game.id,
      scheduledAt: game.scheduledAt.toISOString(),
      status: game.status,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      currentInning: game.currentInning ?? undefined,
      venueId: game.venueId ?? undefined,
      venueName: game.venue?.name ?? undefined,
      sport: game.sport,
      league: game.league,
      homeTeamId: game.homeTeamId,
    },
    homeTeam: {
      id: game.homeTeam.id,
      name: game.homeTeam.name,
      school: game.homeTeam.school,
      conference: game.homeTeam.conference?.name ?? 'Independent',
      record: homeTeamStats ? `${homeTeamStats.wins}-${homeTeamStats.losses}` : '0-0',
    },
    awayTeam: {
      id: game.awayTeam.id,
      name: game.awayTeam.name,
      school: game.awayTeam.school,
      conference: game.awayTeam.conference?.name ?? 'Independent',
      record: awayTeamStats ? `${awayTeamStats.wins}-${awayTeamStats.losses}` : '0-0',
    },
  };

  if (game.status === GameStatus.FINAL && game.boxLines.length > 0) {
    const homeBoxLines = game.boxLines.filter((line) => line.teamId === game.homeTeamId);
    const awayBoxLines = game.boxLines.filter((line) => line.teamId === game.awayTeamId);

    context.boxScore = {
      homeStats: {
        runs: game.homeScore ?? 0,
        hits: homeBoxLines.reduce((sum, line) => sum + line.h, 0),
        errors: 0,
        leftOnBase: 0,
        battingAvg: homeTeamStats ? decimalToNumber(homeTeamStats.battingAvg) : 0,
        era: homeTeamStats ? decimalToNumber(homeTeamStats.era) : undefined,
      },
      awayStats: {
        runs: game.awayScore ?? 0,
        hits: awayBoxLines.reduce((sum, line) => sum + line.h, 0),
        errors: 0,
        leftOnBase: 0,
        battingAvg: awayTeamStats ? decimalToNumber(awayTeamStats.battingAvg) : 0,
        era: awayTeamStats ? decimalToNumber(awayTeamStats.era) : undefined,
      },
    };

    context.topPerformers = {
      hitting: game.boxLines
        .filter((line) => line.ab > 0)
        .slice(0, 5)
        .map((line) => ({
          playerId: line.player.id,
          playerName: `${line.player.firstName} ${line.player.lastName}`,
          position: line.player.position ?? 'UNKNOWN',
          stats: `${line.h}-${line.ab}, ${line.homeRuns} HR, ${line.rbi} RBI`,
          impact:
            line.homeRuns > 0 || line.rbi > 2
              ? 'high'
              : line.h >= 2
                ? 'medium'
                : 'low',
        })),
    };
  }

  return context;
}

/**
 * Parse generated content to extract title and body
 */
function parseGeneratedContent(raw: string): { title: string; content: string } {
  // Look for title patterns
  const lines = raw.split('\n').filter(line => line.trim().length > 0);

  // First non-empty line is typically the title
  let title = lines[0];

  // Remove markdown formatting
  title = title.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();

  // Rest is content
  const content = lines.slice(1).join('\n').trim();

  return { title, content };
}

/**
 * Generate summary from content (first 2 sentences)
 */
function generateSummary(content: string): string {
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.slice(0, 2).join(' ').trim();
}

/**
 * Generate recaps for recently completed games
 */
async function generatePendingRecaps(env: Env, ctx: ExecutionContext): Promise<void> {
  const prisma = new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
  });

  try {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    const candidateGames = await prisma.game.findMany({
      where: {
        status: GameStatus.FINAL,
        updatedAt: {
          gte: fifteenMinutesAgo,
        },
      },
      select: {
        id: true,
      },
      take: 5,
    });

    const recapSlugs = candidateGames.map((game) => createArticleSlug(game.id, 'recap'));
    const existingRecaps = await prisma.article.findMany({
      where: {
        slug: { in: recapSlugs },
      },
      select: { slug: true },
    });
    const existingRecapSet = new Set(existingRecaps.map((article) => article.slug));

    const games = candidateGames.filter(
      (game, index) => !existingRecapSet.has(recapSlugs[index])
    );

    console.log(`[ContentWorker] Found ${games.length} games needing recaps`);

    for (const game of games) {
      try {
        await generateContent(
          {
            type: 'recap',
            gameId: game.id,
            provider: 'anthropic',
          },
          env
        );

        console.log(`[ContentWorker] Generated recap for game ${game.id}`);
      } catch (error) {
        console.error(`[ContentWorker] Failed to generate recap for game ${game.id}:`, error);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Generate previews for upcoming games
 */
async function generatePendingPreviews(env: Env, ctx: ExecutionContext): Promise<void> {
  const prisma = new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
  });

  try {
    const now = new Date();
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    const candidateGames = await prisma.game.findMany({
      where: {
        status: GameStatus.SCHEDULED,
        scheduledAt: {
          gte: sixHoursFromNow,
          lte: twelveHoursFromNow,
        },
      },
      select: {
        id: true,
      },
      take: 10,
    });

    const previewSlugs = candidateGames.map((game) => createArticleSlug(game.id, 'preview'));
    const existingPreviews = await prisma.article.findMany({
      where: {
        slug: { in: previewSlugs },
      },
      select: { slug: true },
    });
    const existingPreviewSet = new Set(existingPreviews.map((article) => article.slug));

    const games = candidateGames.filter(
      (game, index) => !existingPreviewSet.has(previewSlugs[index])
    );

    console.log(`[ContentWorker] Found ${games.length} games needing previews`);

    for (const game of games) {
      try {
        await generateContent(
          {
            type: 'preview',
            gameId: game.id,
            provider: 'anthropic',
          },
          env
        );

        console.log(`[ContentWorker] Generated preview for game ${game.id}`);
      } catch (error) {
        console.error(`[ContentWorker] Failed to generate preview for game ${game.id}:`, error);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}
