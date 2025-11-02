/**
 * Blaze Sports Intel - Community Moderation Tools
 *
 * Content moderation utilities for community posts and comments:
 * - Flag content for review
 * - Automated spam detection
 * - Moderator actions (approve, remove, lock, pin)
 * - User reputation scoring
 */

/**
 * Flag content for moderator review
 *
 * @param {Object} db - D1 database instance
 * @param {string} contentType - 'post' or 'comment'
 * @param {string} contentId - Post ID or comment ID
 * @param {string} userId - User who flagged the content
 * @param {string} reason - Reason for flagging
 * @param {string} details - Additional details (optional)
 * @returns {Object} Flag result
 */
export async function flagContent(db, contentType, contentId, userId, reason, details = '') {
  const validReasons = ['spam', 'harassment', 'offensive', 'misinformation', 'off-topic', 'other'];

  if (!validReasons.includes(reason)) {
    throw new Error(`Invalid flag reason. Must be one of: ${validReasons.join(', ')}`);
  }

  // Check if content exists
  const tableName = contentType === 'post' ? 'community_posts' : 'community_comments';
  const idColumn = contentType === 'post' ? 'post_id' : 'comment_id';

  const content = await db.prepare(`
    SELECT ${idColumn}, flagged FROM ${tableName} WHERE ${idColumn} = ? AND active = 1
  `).bind(contentId).first();

  if (!content) {
    throw new Error(`${contentType} not found`);
  }

  // Check if user already flagged this content
  const existingFlag = await db.prepare(`
    SELECT flag_id FROM content_flags
    WHERE content_type = ? AND content_id = ? AND user_id = ?
  `).bind(contentType, contentId, userId).first();

  if (existingFlag) {
    return {
      flagged: false,
      reason: 'Already flagged by this user'
    };
  }

  // Create flag record
  const flagId = `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.prepare(`
    INSERT INTO content_flags (
      flag_id, content_type, content_id, user_id, reason, details,
      status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    flagId,
    contentType,
    contentId,
    userId,
    reason,
    details,
    'pending',
    new Date().toISOString()
  ).run();

  // Update flagged status on content (after 3 flags, mark as flagged)
  const flagCount = await db.prepare(`
    SELECT COUNT(*) as count FROM content_flags
    WHERE content_type = ? AND content_id = ? AND status = 'pending'
  `).bind(contentType, contentId).first();

  if (flagCount.count >= 3) {
    await db.prepare(`
      UPDATE ${tableName} SET flagged = 1 WHERE ${idColumn} = ?
    `).bind(contentId).run();
  }

  return {
    flagged: true,
    flag_id: flagId,
    flag_count: flagCount.count,
    auto_flagged: flagCount.count >= 3
  };
}

/**
 * Get flagged content for moderator review
 *
 * @param {Object} db - D1 database instance
 * @param {Object} options - Query options (contentType, status, limit, offset)
 * @returns {Object} Flagged content list
 */
export async function getFlaggedContent(db, options = {}) {
  const contentType = options.contentType || 'all';
  const status = options.status || 'pending';
  const limit = Math.min(options.limit || 50, 100);
  const offset = options.offset || 0;

  const filters = [];
  const params = [];

  if (contentType !== 'all') {
    filters.push('content_type = ?');
    params.push(contentType);
  }

  if (status !== 'all') {
    filters.push('status = ?');
    params.push(status);
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

  // Get flagged items with content details
  const flags = await db.prepare(`
    SELECT
      cf.flag_id,
      cf.content_type,
      cf.content_id,
      cf.user_id as flagger_user_id,
      cf.reason,
      cf.details,
      cf.status,
      cf.created_at,
      cf.reviewed_at,
      cf.reviewed_by,
      COUNT(*) OVER (PARTITION BY cf.content_id) as flag_count
    FROM content_flags cf
    ${whereClause}
    ORDER BY cf.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all();

  // Enhance with content details
  const enhancedFlags = await Promise.all(
    (flags.results || []).map(async (flag) => {
      const contentDetails = await getContentDetails(db, flag.content_type, flag.content_id);

      return {
        ...flag,
        content: contentDetails
      };
    })
  );

  return {
    flags: enhancedFlags,
    pagination: {
      limit,
      offset,
      has_more: enhancedFlags.length === limit
    }
  };
}

/**
 * Get content details for flagged item
 */
async function getContentDetails(db, contentType, contentId) {
  if (contentType === 'post') {
    const post = await db.prepare(`
      SELECT post_id, user_id, author_name, title, content, sport, category, created_at
      FROM community_posts WHERE post_id = ?
    `).bind(contentId).first();

    return post;
  } else if (contentType === 'comment') {
    const comment = await db.prepare(`
      SELECT comment_id, post_id, user_id, author_name, content, created_at
      FROM community_comments WHERE comment_id = ?
    `).bind(contentId).first();

    return comment;
  }

  return null;
}

/**
 * Review flagged content (moderator action)
 *
 * @param {Object} db - D1 database instance
 * @param {string} flagId - Flag ID
 * @param {string} moderatorId - Moderator user ID
 * @param {string} action - Action to take (approve, remove, warn)
 * @param {string} notes - Moderator notes (optional)
 * @returns {Object} Review result
 */
export async function reviewFlag(db, flagId, moderatorId, action, notes = '') {
  const validActions = ['approve', 'remove', 'warn'];

  if (!validActions.includes(action)) {
    throw new Error(`Invalid action. Must be one of: ${validActions.join(', ')}`);
  }

  // Get flag details
  const flag = await db.prepare(`
    SELECT flag_id, content_type, content_id, status FROM content_flags WHERE flag_id = ?
  `).bind(flagId).first();

  if (!flag) {
    throw new Error('Flag not found');
  }

  if (flag.status !== 'pending') {
    throw new Error('Flag already reviewed');
  }

  // Update flag status
  await db.prepare(`
    UPDATE content_flags
    SET status = ?,
        reviewed_at = ?,
        reviewed_by = ?,
        moderator_notes = ?
    WHERE flag_id = ?
  `).bind(
    action === 'approve' ? 'approved' : 'removed',
    new Date().toISOString(),
    moderatorId,
    notes,
    flagId
  ).run();

  // Take action on content
  const tableName = flag.content_type === 'post' ? 'community_posts' : 'community_comments';
  const idColumn = flag.content_type === 'post' ? 'post_id' : 'comment_id';

  if (action === 'remove') {
    // Soft delete content
    await db.prepare(`
      UPDATE ${tableName} SET active = 0, flagged = 1 WHERE ${idColumn} = ?
    `).bind(flag.content_id).run();
  } else if (action === 'approve') {
    // Unflag content (if no other pending flags)
    const remainingFlags = await db.prepare(`
      SELECT COUNT(*) as count FROM content_flags
      WHERE content_id = ? AND status = 'pending'
    `).bind(flag.content_id).first();

    if (remainingFlags.count === 0) {
      await db.prepare(`
        UPDATE ${tableName} SET flagged = 0 WHERE ${idColumn} = ?
      `).bind(flag.content_id).run();
    }
  } else if (action === 'warn') {
    // Keep flagged status, send warning to author
    await db.prepare(`
      UPDATE ${tableName} SET flagged = 1 WHERE ${idColumn} = ?
    `).bind(flag.content_id).run();

    // TODO: Send warning notification to content author
  }

  return {
    reviewed: true,
    flag_id: flagId,
    action: action,
    content_type: flag.content_type,
    content_id: flag.content_id
  };
}

/**
 * Automated spam detection
 *
 * @param {Object} content - Content object (title + content or just content)
 * @returns {Object} Spam detection result
 */
export function detectSpam(content) {
  const text = content.title ? `${content.title} ${content.content}` : content.content;

  const spamIndicators = {
    excessive_caps: 0,
    excessive_links: 0,
    repeated_chars: 0,
    spam_keywords: 0,
    short_burst: 0
  };

  // Check for excessive caps (>50% uppercase)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5 && text.length > 50) {
    spamIndicators.excessive_caps = 1;
  }

  // Check for excessive links (>5 links)
  const linkCount = (text.match(/https?:\/\//g) || []).length;
  if (linkCount > 5) {
    spamIndicators.excessive_links = 1;
  }

  // Check for repeated characters (same char 5+ times)
  if (/(.)\1{4,}/.test(text)) {
    spamIndicators.repeated_chars = 1;
  }

  // Check for spam keywords
  const spamKeywords = [
    /\b(click here|buy now|limited time|act now|special offer)\b/i,
    /\b(make money|earn \$|work from home|free trial)\b/i,
    /\b(viagra|cialis|prescription|pharmacy)\b/i,
    /\b(lottery|prize|winner|congratulations)\b/i
  ];

  for (const pattern of spamKeywords) {
    if (pattern.test(text)) {
      spamIndicators.spam_keywords = 1;
      break;
    }
  }

  // Calculate spam score (0-1)
  const totalIndicators = Object.values(spamIndicators).reduce((sum, val) => sum + val, 0);
  const spamScore = totalIndicators / Object.keys(spamIndicators).length;

  return {
    is_spam: spamScore >= 0.6,
    spam_score: spamScore,
    indicators: spamIndicators,
    confidence: spamScore >= 0.8 ? 'high' : spamScore >= 0.6 ? 'medium' : 'low'
  };
}

/**
 * Calculate user reputation score
 *
 * @param {Object} db - D1 database instance
 * @param {string} userId - User ID
 * @returns {Object} Reputation score and stats
 */
export async function calculateUserReputation(db, userId) {
  // Get user's posts and comments
  const posts = await db.prepare(`
    SELECT COUNT(*) as count, SUM(upvotes) as total_upvotes, SUM(downvotes) as total_downvotes
    FROM community_posts WHERE user_id = ? AND active = 1
  `).bind(userId).first();

  const comments = await db.prepare(`
    SELECT COUNT(*) as count, SUM(upvotes) as total_upvotes, SUM(downvotes) as total_downvotes
    FROM community_comments WHERE user_id = ? AND active = 1
  `).bind(userId).first();

  // Get flagged content count
  const flaggedContent = await db.prepare(`
    SELECT COUNT(*) as count FROM content_flags
    WHERE user_id = ? AND status = 'removed'
  `).bind(userId).first();

  // Calculate reputation components
  const postKarma = (posts.total_upvotes || 0) - (posts.total_downvotes || 0);
  const commentKarma = (comments.total_upvotes || 0) - (comments.total_downvotes || 0);
  const totalKarma = postKarma + commentKarma;

  const postCount = posts.count || 0;
  const commentCount = comments.count || 0;
  const flaggedCount = flaggedContent.count || 0;

  // Reputation formula: karma + engagement - penalties
  let reputation = totalKarma;
  reputation += Math.log10(postCount + 1) * 10;
  reputation += Math.log10(commentCount + 1) * 5;
  reputation -= flaggedCount * 50;

  // Clamp to 0-1000 range
  reputation = Math.max(0, Math.min(1000, reputation));

  // Determine reputation tier
  let tier = 'newcomer';
  if (reputation >= 500) tier = 'trusted';
  else if (reputation >= 250) tier = 'established';
  else if (reputation >= 100) tier = 'active';

  return {
    user_id: userId,
    reputation: Math.round(reputation),
    tier: tier,
    stats: {
      post_count: postCount,
      comment_count: commentCount,
      post_karma: postKarma,
      comment_karma: commentKarma,
      total_karma: totalKarma,
      flagged_count: flaggedCount
    }
  };
}

/**
 * Moderator action: Lock post (disable new comments)
 */
export async function lockPost(db, postId, moderatorId, reason = '') {
  await db.prepare(`
    UPDATE community_posts
    SET locked = 1,
        updated_at = ?
    WHERE post_id = ?
  `).bind(new Date().toISOString(), postId).run();

  // Log moderator action
  await logModeratorAction(db, moderatorId, 'lock_post', postId, reason);

  return { locked: true, post_id: postId };
}

/**
 * Moderator action: Pin post (show at top of feed)
 */
export async function pinPost(db, postId, moderatorId, reason = '') {
  await db.prepare(`
    UPDATE community_posts
    SET pinned = 1,
        updated_at = ?
    WHERE post_id = ?
  `).bind(new Date().toISOString(), postId).run();

  // Log moderator action
  await logModeratorAction(db, moderatorId, 'pin_post', postId, reason);

  return { pinned: true, post_id: postId };
}

/**
 * Log moderator action for audit trail
 */
async function logModeratorAction(db, moderatorId, action, targetId, notes) {
  const logId = `modlog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.prepare(`
    INSERT INTO moderator_logs (log_id, moderator_id, action, target_id, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    logId,
    moderatorId,
    action,
    targetId,
    notes,
    new Date().toISOString()
  ).run();
}
