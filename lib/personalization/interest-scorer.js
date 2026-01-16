/**
 * Blaze Sports Intel - Interest Score Calculator
 *
 * Analyzes user behavioral data to calculate interest scores across content categories:
 * - Live games: Real-time game following behavior
 * - Predictions: Engagement with win probability, projections, injury risk
 * - Recruiting: Player development, draft projections, scouting
 * - Community: Discussion participation, post creation, voting
 * - Contests: Bracket participation, prediction contests
 * - Historical: Past matchup analysis, stat lookups
 *
 * Scoring methodology:
 * - Recency weighted (recent interactions = higher weight)
 * - Duration weighted (longer engagement = higher interest)
 * - Frequency weighted (repeated interactions = stronger signal)
 * - Engagement weighted (clicks < saves < shares)
 */

/**
 * Calculate interest scores from user behavioral data
 *
 * @param {Array} behaviorData - Array of user interaction records from last 30 days
 * @param {Object} preferences - User preferences object
 * @returns {Object} Interest scores by category (0-1 scale)
 */
export function calculateInterestScore(behaviorData, preferences) {
  const scores = {
    live_games: 0,
    predictions: 0,
    recruiting: 0,
    community: 0,
    contests: 0,
    historical: 0,
  };

  if (!behaviorData || behaviorData.length === 0) {
    // No behavioral data - use preference signals only
    return applyPreferenceBoost(scores, preferences);
  }

  // Group interactions by content type
  const interactionsByType = groupByContentType(behaviorData);

  // Calculate base scores from interaction frequency and engagement
  for (const [contentType, interactions] of Object.entries(interactionsByType)) {
    const category = mapContentTypeToCategory(contentType);
    if (!category) continue;

    scores[category] += calculateCategoryScore(interactions);
  }

  // Apply recency decay (more recent = higher weight)
  applyRecencyWeighting(scores, behaviorData);

  // Apply preference boost
  applyPreferenceBoost(scores, preferences);

  // Normalize to 0-1 scale
  normalizeScores(scores);

  return scores;
}

/**
 * Group interactions by content type
 */
function groupByContentType(behaviorData) {
  const grouped = {};

  for (const interaction of behaviorData) {
    const type = interaction.content_type;
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(interaction);
  }

  return grouped;
}

/**
 * Map content type to interest category
 */
function mapContentTypeToCategory(contentType) {
  const mapping = {
    live_game: 'live_games',
    game_preview: 'live_games',
    live_score: 'live_games',
    win_probability: 'predictions',
    player_projection: 'predictions',
    injury_risk: 'predictions',
    draft_prospect: 'recruiting',
    player_development: 'recruiting',
    scouting_report: 'recruiting',
    discussion_post: 'community',
    comment: 'community',
    upvote: 'community',
    contest_entry: 'contests',
    bracket: 'contests',
    prediction_game: 'contests',
    historical_matchup: 'historical',
    player_stats: 'historical',
    team_history: 'historical',
  };

  return mapping[contentType];
}

/**
 * Calculate score for a category based on interactions
 */
function calculateCategoryScore(interactions) {
  let score = 0;

  for (const interaction of interactions) {
    // Base score from interaction type
    const interactionWeight = getInteractionWeight(interaction.interaction_type);

    // Duration boost (longer engagement = higher interest)
    const durationSeconds = interaction.duration_seconds || 0;
    const durationBoost = Math.min(1.0, durationSeconds / 300); // Cap at 5 minutes

    // Engagement score (from 0-1, set during tracking)
    const engagementScore = interaction.engagement_score || 0.5;

    // Combined score
    score += interactionWeight * (1 + durationBoost) * engagementScore;
  }

  return score;
}

/**
 * Get weight for interaction type
 */
function getInteractionWeight(interactionType) {
  const weights = {
    view: 1.0,
    click: 1.5,
    save: 2.5,
    share: 3.0,
    comment: 3.5,
    create: 4.0,
    subscribe: 4.5,
  };

  return weights[interactionType] || 1.0;
}

/**
 * Apply recency weighting (exponential decay)
 */
function applyRecencyWeighting(scores, behaviorData) {
  const now = Date.now();
  const halfLifeDays = 7; // Interest decays 50% every 7 days

  const recentInteractions = {
    live_games: [],
    predictions: [],
    recruiting: [],
    community: [],
    contests: [],
    historical: [],
  };

  // Group interactions by category with timestamps
  for (const interaction of behaviorData) {
    const category = mapContentTypeToCategory(interaction.content_type);
    if (!category) continue;

    const timestamp = new Date(interaction.timestamp).getTime();
    const ageMs = now - timestamp;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    // Exponential decay: weight = 0.5^(age / halfLife)
    const recencyWeight = Math.pow(0.5, ageDays / halfLifeDays);

    recentInteractions[category].push({
      weight: recencyWeight,
      interaction,
    });
  }

  // Apply recency weights to scores
  for (const [category, interactions] of Object.entries(recentInteractions)) {
    if (interactions.length === 0) continue;

    const totalRecencyWeight = interactions.reduce((sum, item) => sum + item.weight, 0);
    const avgRecencyWeight = totalRecencyWeight / interactions.length;

    // Boost score by average recency weight
    scores[category] *= 0.5 + avgRecencyWeight * 0.5;
  }
}

/**
 * Apply preference boost from explicit user preferences
 */
function applyPreferenceBoost(scores, preferences) {
  if (!preferences) return scores;

  // Boost based on content preferences
  const contentPrefs = preferences.content_preferences || {};

  if (contentPrefs.show_predictions === true) {
    scores.predictions += 0.2;
    scores.recruiting += 0.1;
  }

  if (contentPrefs.show_community === true) {
    scores.community += 0.2;
  }

  if (contentPrefs.show_contests === true) {
    scores.contests += 0.2;
  }

  // Boost based on followed items
  const followedTeams = preferences.favorite_teams?.length || 0;
  const followedPlayers = preferences.favorite_players?.length || 0;

  if (followedTeams > 0) {
    scores.live_games += Math.min(0.3, followedTeams * 0.05);
  }

  if (followedPlayers > 0) {
    scores.predictions += Math.min(0.3, followedPlayers * 0.05);
    scores.recruiting += Math.min(0.2, followedPlayers * 0.04);
  }

  return scores;
}

/**
 * Normalize scores to 0-1 scale
 */
function normalizeScores(scores) {
  // Find max score
  const maxScore = Math.max(...Object.values(scores));

  if (maxScore === 0) {
    // No interactions - set all to 0.5 (neutral)
    for (const key of Object.keys(scores)) {
      scores[key] = 0.5;
    }
    return;
  }

  // Normalize each score
  for (const key of Object.keys(scores)) {
    scores[key] = Math.min(1.0, scores[key] / maxScore);
  }
}

/**
 * Calculate engagement score for a single interaction
 * (Used during behavioral tracking)
 *
 * @param {string} interactionType - Type of interaction (view, click, save, etc.)
 * @param {number} durationSeconds - Duration of engagement
 * @param {Object} context - Additional context (scroll depth, clicks, etc.)
 * @returns {number} Engagement score (0-1)
 */
export function calculateEngagementScore(interactionType, durationSeconds, context = {}) {
  let score = 0;

  // Base score from interaction type
  const typeScores = {
    view: 0.3,
    click: 0.5,
    save: 0.7,
    share: 0.85,
    comment: 0.9,
    create: 1.0,
  };

  score = typeScores[interactionType] || 0.3;

  // Duration boost (0-0.3 points)
  const durationScore = Math.min(0.3, durationSeconds / 600); // Max at 10 minutes
  score += durationScore;

  // Scroll depth boost (0-0.2 points)
  if (context.scroll_depth) {
    const scrollScore = context.scroll_depth * 0.2; // 0-100% → 0-0.2
    score += scrollScore;
  }

  // Click count boost (0-0.1 points)
  if (context.click_count) {
    const clickScore = Math.min(0.1, context.click_count * 0.02);
    score += clickScore;
  }

  // Return normalized score
  return Math.min(1.0, score);
}

/**
 * Predict user interest in specific content item
 * (Used for content recommendation ranking)
 *
 * @param {Object} userScores - User's interest scores by category
 * @param {Object} contentItem - Content item with type and metadata
 * @returns {number} Predicted interest score (0-1)
 */
export function predictContentInterest(userScores, contentItem) {
  const category = mapContentTypeToCategory(contentItem.content_type);
  if (!category) return 0.5;

  let score = userScores[category] || 0.5;

  // Boost for trending content
  if (contentItem.is_trending) {
    score *= 1.2;
  }

  // Boost for followed entities
  if (contentItem.involves_followed_team || contentItem.involves_followed_player) {
    score *= 1.5;
  }

  // Boost for high-priority alerts
  if (contentItem.priority === 'critical') {
    score *= 1.3;
  }

  return Math.min(1.0, score);
}

/**
 * Decay interest scores over time (run periodically)
 *
 * @param {Object} scores - Current interest scores
 * @param {number} daysSinceLastUpdate - Days since scores were last calculated
 * @returns {Object} Decayed scores
 */
export function decayInterestScores(scores, daysSinceLastUpdate) {
  const halfLifeDays = 14; // Interest decays 50% every 14 days without interaction

  const decayFactor = Math.pow(0.5, daysSinceLastUpdate / halfLifeDays);

  const decayedScores = {};
  for (const [category, score] of Object.entries(scores)) {
    // Decay towards 0.5 (neutral) rather than 0
    const decayedScore = 0.5 + (score - 0.5) * decayFactor;
    decayedScores[category] = Math.max(0, Math.min(1.0, decayedScore));
  }

  return decayedScores;
}
