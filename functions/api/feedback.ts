/**
 * User Feedback API - Phase 18 Implementation
 * POST /api/feedback
 *
 * Captures user feedback from the feedback widget and stores it in:
 * - D1 Database (permanent storage for analysis)
 * - KV Namespace (recent feedback cache for quick retrieval)
 *
 * Feedback includes:
 * - Rating (1-5 stars)
 * - Category (bug, feature, performance, data-quality, other)
 * - Comment text
 * - Page URL
 * - User agent and screen size (for context)
 */

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
}

interface FeedbackRequest {
  rating: number;
  category: string;
  comment: string;
  page: string;
  userAgent: string;
  screenSize: string;
}

interface FeedbackResponse {
  success: boolean;
  message: string;
  feedbackId?: string;
  timestamp?: string;
  error?: string;
}

const VALID_CATEGORIES = ['bug', 'feature', 'performance', 'data-quality', 'other'];

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only accept POST
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method not allowed. Use POST.',
      } as FeedbackResponse),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    // Parse request body
    const body: FeedbackRequest = await request.json();

    // Validate required fields
    if (!body.rating || !body.category || !body.comment || !body.page) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: rating, category, comment, page',
        } as FeedbackResponse),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Validate rating range
    if (body.rating < 1 || body.rating > 5) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rating must be between 1 and 5',
        } as FeedbackResponse),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(body.category)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
        } as FeedbackResponse),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Validate comment length
    if (body.comment.length > 2000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Comment must be 2000 characters or less',
        } as FeedbackResponse),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Generate feedback ID
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Prepare feedback data
    const feedbackData = {
      id: feedbackId,
      rating: body.rating,
      category: body.category,
      comment: body.comment.trim(),
      page: body.page,
      userAgent: body.userAgent || 'Unknown',
      screenSize: body.screenSize || 'Unknown',
      timestamp,
    };

    // Store in D1 Database (permanent storage)
    try {
      // Create feedback table if it doesn't exist
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS feedback (
          id TEXT PRIMARY KEY,
          rating INTEGER NOT NULL,
          category TEXT NOT NULL,
          comment TEXT NOT NULL,
          page TEXT NOT NULL,
          user_agent TEXT,
          screen_size TEXT,
          timestamp TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Insert feedback
      await env.DB.prepare(`
        INSERT INTO feedback (id, rating, category, comment, page, user_agent, screen_size, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          feedbackData.id,
          feedbackData.rating,
          feedbackData.category,
          feedbackData.comment,
          feedbackData.page,
          feedbackData.userAgent,
          feedbackData.screenSize,
          feedbackData.timestamp
        )
        .run();
    } catch (dbError) {
      console.error('[Feedback API] D1 insertion error:', dbError);
      // Continue even if D1 fails - still cache in KV
    }

    // Store in KV (recent feedback cache - 7 days retention)
    try {
      await env.CACHE?.put(
        `feedback:${feedbackId}`,
        JSON.stringify(feedbackData),
        {
          expirationTtl: 60 * 60 * 24 * 7, // 7 days
        }
      );

      // Update recent feedback list
      const recentKey = 'feedback:recent';
      const recentRaw = await env.CACHE?.get(recentKey);
      const recent: string[] = recentRaw ? JSON.parse(recentRaw) : [];

      // Add new feedback ID to the front
      recent.unshift(feedbackId);

      // Keep only last 100 feedback IDs
      const trimmed = recent.slice(0, 100);

      await env.CACHE?.put(recentKey, JSON.stringify(trimmed), {
        expirationTtl: 60 * 60 * 24 * 7, // 7 days
      });
    } catch (kvError) {
      console.error('[Feedback API] KV storage error:', kvError);
      // Continue even if KV fails - D1 is primary storage
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Thank you for your feedback!',
        feedbackId,
        timestamp,
      } as FeedbackResponse),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[Feedback API] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to process feedback. Please try again.',
        message: error instanceof Error ? error.message : String(error),
      } as FeedbackResponse),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
