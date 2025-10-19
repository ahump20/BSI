/**
 * Content Generation Worker
 *
 * Generates game recaps and previews with fact-checking
 */

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
import { createPrismaClient, type EdgePrismaClient } from '../../lib/db/prisma';

function createEdgePrisma(env: Env): EdgePrismaClient {
  return createPrismaClient({
    datasourceUrl: env.PRISMA_ACCELERATE_URL ?? env.DATABASE_URL,
    accelerateUrl: env.PRISMA_ACCELERATE_URL,
  });
}

async function withPrisma<T>(env: Env, run: (prisma: EdgePrismaClient) => Promise<T>): Promise<T> {
  const prisma = createEdgePrisma(env);

  try {
    return await run(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

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
  return withPrisma(env, async prisma => {
    // Fetch game context from database
    const context = await fetchGameContext(request.gameId, prisma);

    // Initialize LLM provider
    const llmProvider = new LLMProvider(
      env.ANTHROPIC_API_KEY,
      env.OPENAI_API_KEY,
      env.GOOGLE_GEMINI_API_KEY
    );

    // Generate content based on type
    let systemPrompt: string;
    let userPrompt: string;

    if (request.type === 'recap') {
      systemPrompt = RECAP_TEMPLATE.system;
      userPrompt = fillRecapTemplate(context);
    } else {
      systemPrompt = PREVIEW_TEMPLATE.system;
      userPrompt = fillPreviewTemplate(context);
    }

    // Generate with LLM
    const llmResponse = await llmProvider.generateWithRetry({
      systemPrompt,
      userPrompt,
      maxTokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7,
      provider: request.provider || 'anthropic',
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
    const article = await prisma.article.create({
      data: {
        gameId: request.gameId,
        type: request.type,
        title,
        content,
        summary,
        provider: llmResponse.provider,
        model: llmResponse.model,
        tokensUsed: llmResponse.tokensUsed,
        factCheckScore: verificationScore.overallScore,
        factCheckResults: JSON.stringify(factCheckResults),
        wordCount,
        readingTimeMinutes,
        publishedAt: new Date(),
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
  });
}

/**
 * Fetch game context from database
 */
async function fetchGameContext(gameId: string, prisma: EdgePrismaClient): Promise<GameContext> {
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
          stats: {
            where: { season: new Date().getFullYear() },
            take: 1,
          },
        },
      },
      awayTeam: {
        include: {
          conference: {
            select: { name: true },
          },
          stats: {
            where: { season: new Date().getFullYear() },
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
          totalBases: 'desc', // Sort by impact
        },
        take: 10, // Top 10 performers
      },
    },
  });

  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  const homeTeamStats = game.homeTeam.stats[0];
  const awayTeamStats = game.awayTeam.stats[0];

  // Build context
  const context: GameContext = {
    game: {
      id: game.id,
      scheduledAt: game.scheduledAt.toISOString(),
      status: game.status,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      currentInning: game.currentInning || undefined,
      venueId: game.venueId || undefined,
      venueName: game.venue?.name || undefined,
    },
    homeTeam: {
      id: game.homeTeam.id,
      name: game.homeTeam.name,
      school: game.homeTeam.school,
      conference: game.homeTeam.conference.name,
      record: homeTeamStats ? `${homeTeamStats.wins}-${homeTeamStats.losses}` : '0-0',
    },
    awayTeam: {
      id: game.awayTeam.id,
      name: game.awayTeam.name,
      school: game.awayTeam.school,
      conference: game.awayTeam.conference.name,
      record: awayTeamStats ? `${awayTeamStats.wins}-${awayTeamStats.losses}` : '0-0',
    },
  };

  // Add box score if game is final
  if (game.status === 'FINAL' && game.boxLines.length > 0) {
    const homeBoxLines = game.boxLines.filter(bl => bl.teamId === game.homeTeamId);
    const awayBoxLines = game.boxLines.filter(bl => bl.teamId === game.awayTeamId);

    context.boxScore = {
      homeStats: {
        runs: game.homeScore || 0,
        hits: homeBoxLines.reduce((sum, bl) => sum + bl.hits, 0),
        errors: 0, // Would need separate tracking
        leftOnBase: 0, // Would need separate tracking
        battingAvg: homeTeamStats?.battingAvg || 0,
        era: homeTeamStats?.era,
      },
      awayStats: {
        runs: game.awayScore || 0,
        hits: awayBoxLines.reduce((sum, bl) => sum + bl.hits, 0),
        errors: 0,
        leftOnBase: 0,
        battingAvg: awayTeamStats?.battingAvg || 0,
        era: awayTeamStats?.era,
      },
    };

    // Top performers
    context.topPerformers = {
      hitting: game.boxLines
        .filter(bl => bl.atBats > 0)
        .slice(0, 5)
        .map(bl => ({
          playerId: bl.player.id,
          playerName: `${bl.player.firstName} ${bl.player.lastName}`,
          position: bl.player.position || 'UNKNOWN',
          stats: `${bl.hits}-${bl.atBats}, ${bl.homeRuns} HR, ${bl.rbi} RBI`,
          impact: bl.homeRuns > 0 || bl.rbi > 2 ? 'high' : bl.hits >= 2 ? 'medium' : 'low',
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
  await withPrisma(env, async prisma => {
    // Find games completed in last 15 minutes without articles
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    const games = await prisma.game.findMany({
      where: {
        status: 'FINAL',
        updatedAt: {
          gte: fifteenMinutesAgo,
        },
        articles: {
          none: {
            type: 'recap',
          },
        },
      },
      take: 5, // Limit to 5 games per run
    });

    console.log(`[ContentWorker] Found ${games.length} games needing recaps`);

    // Generate recaps
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
  });
}

/**
 * Generate previews for upcoming games
 */
async function generatePendingPreviews(env: Env, ctx: ExecutionContext): Promise<void> {
  await withPrisma(env, async prisma => {
    // Find games scheduled in next 6-12 hours without previews
    const now = new Date();
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    const games = await prisma.game.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          gte: sixHoursFromNow,
          lte: twelveHoursFromNow,
        },
        articles: {
          none: {
            type: 'preview',
          },
        },
      },
      take: 10, // Limit to 10 games per run
    });

    console.log(`[ContentWorker] Found ${games.length} games needing previews`);

    // Generate previews
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
  });
}
