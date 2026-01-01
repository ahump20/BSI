/**
 * BSI Twitter/X API Integration
 *
 * Cost-optimized polling strategy for Basic tier ($200/mo, 15K reads/month)
 * Targets high-value portal news sources with intelligent batching.
 *
 * Note: This module is Workers-compatible. Environment variables are passed
 * via setTwitterConfig() rather than process.env.
 */

// -----------------------------------------------------------------------------
// Configuration (Workers-compatible - no process.env)
// -----------------------------------------------------------------------------

let TWITTER_BEARER: string | undefined;

/**
 * Configure Twitter API credentials at runtime.
 * Call this before using any Twitter API functions.
 */
export function setTwitterConfig(config: { bearerToken?: string }): void {
  TWITTER_BEARER = config.bearerToken;
}

// Trusted accounts that break portal news (in priority order)
export const PORTAL_SOURCES = [
  { username: "kendallrogersD1", name: "Kendall Rogers", priority: 1 },
  { username: "d1baseball", name: "D1Baseball", priority: 1 },
  { username: "BaseballAmerica", name: "Baseball America", priority: 2 },
  { username: "NCAABaseball", name: "NCAA Baseball", priority: 2 },
  { username: "PG_Scouting", name: "Perfect Game", priority: 3 },
  { username: "prepbaseball", name: "Prep Baseball Report", priority: 3 },
] as const;

// Keywords that indicate portal entries
const PORTAL_KEYWORDS = [
  "entered the transfer portal",
  "in the transfer portal",
  "has entered the portal",
  "is in the portal",
  "entering the transfer portal",
  "portal entry",
  "#TransferPortal",
  "hits the portal",
];

// D1 schools for context extraction
const POWER_CONFERENCES = ["SEC", "ACC", "Big 12", "Big Ten", "Pac-12"];
const SEC_SCHOOLS = [
  "Texas", "Texas A&M", "LSU", "Florida", "Georgia", "Tennessee",
  "Alabama", "Auburn", "Ole Miss", "Mississippi State", "Arkansas",
  "Kentucky", "Missouri", "South Carolina", "Vanderbilt", "Oklahoma"
];

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface Tweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  author?: {
    id: string;
    username: string;
    name: string;
  };
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
  };
}

export interface PortalEntry {
  id: string;
  playerName: string | null;
  school: string | null;
  position: string | null;
  conference: string | null;
  tweetId: string;
  tweetText: string;
  author: string;
  authorUsername: string;
  timestamp: string;
  confidence: "high" | "medium" | "low";
  engagement: number;
}

export interface TwitterApiUsage {
  used: number;
  limit: number;
  remaining: number;
  resetAt: string;
}

// -----------------------------------------------------------------------------
// Rate Limiting & Cost Tracking
// -----------------------------------------------------------------------------

// Track API usage to stay within limits
let apiCallCount = 0;
let lastResetDate = new Date().toISOString().split("T")[0];

const MONTHLY_LIMIT = 15000;

export function getApiUsage(): TwitterApiUsage {
  const today = new Date().toISOString().split("T")[0];
  if (today !== lastResetDate) {
    // New day, but keep monthly count
    lastResetDate = today;
  }

  return {
    used: apiCallCount,
    limit: MONTHLY_LIMIT,
    remaining: MONTHLY_LIMIT - apiCallCount,
    resetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
  };
}

function incrementApiCalls(count: number = 1): void {
  apiCallCount += count;
  console.log(`[Twitter API] Calls this month: ${apiCallCount}/${MONTHLY_LIMIT}`);
}

// -----------------------------------------------------------------------------
// Core API Functions
// -----------------------------------------------------------------------------

interface SearchParams {
  query?: string;
  since?: string;
  sinceId?: string;
  limit?: number;
  includeMetrics?: boolean;
}

export async function searchTweets(params: SearchParams): Promise<{
  tweets: Tweet[];
  newestId?: string;
  oldestId?: string;
}> {
  if (!TWITTER_BEARER) {
    throw new Error("TWITTER_BEARER_TOKEN not configured. Get one at developer.x.com");
  }

  // Build optimized query
  const baseQuery = params.query || buildPortalQuery();
  const fullQuery = `${baseQuery} -is:retweet lang:en`;

  const searchParams = new URLSearchParams({
    query: fullQuery,
    max_results: String(Math.min(params.limit || 25, 100)),
    "tweet.fields": "created_at,author_id,public_metrics",
    "user.fields": "username,name",
    expansions: "author_id",
  });

  if (params.sinceId) {
    searchParams.set("since_id", params.sinceId);
  }
  if (params.since) {
    const sinceDate = new Date(params.since);
    // Twitter only allows searching back 7 days on Basic tier
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (sinceDate > sevenDaysAgo) {
      searchParams.set("start_time", sinceDate.toISOString());
    }
  }

  const response = await fetch(
    `https://api.twitter.com/2/tweets/search/recent?${searchParams}`,
    {
      headers: {
        Authorization: `Bearer ${TWITTER_BEARER}`,
        "Content-Type": "application/json",
      },
    }
  );

  incrementApiCalls(1);

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 429) {
      throw new Error("Twitter rate limit exceeded. Wait before retrying.");
    }
    throw new Error(`Twitter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const tweets: Tweet[] = data.data || [];
  type UserInfo = { id: string; username: string; name: string };
  const users = new Map<string, UserInfo>(
    (data.includes?.users || []).map((u: UserInfo) => [u.id, u])
  );

  // Enrich tweets with author info
  const enrichedTweets: Tweet[] = tweets.map((tweet) => ({
    ...tweet,
    author: users.get(tweet.author_id),
  }));

  return {
    tweets: enrichedTweets,
    newestId: data.meta?.newest_id,
    oldestId: data.meta?.oldest_id,
  };
}

// Batched search for multiple sources in one query (cost-efficient)
export async function searchPortalSources(options: {
  sources?: typeof PORTAL_SOURCES;
  sinceId?: string;
  limit?: number;
}): Promise<{
  entries: PortalEntry[];
  newestId?: string;
  apiCallsUsed: number;
}> {
  const sources = options.sources || PORTAL_SOURCES.filter((s) => s.priority <= 2);

  // Batch up to 5 sources per query to minimize API calls
  const batchSize = 5;
  type PortalSource = (typeof PORTAL_SOURCES)[number];
  const batches: PortalSource[][] = [];

  for (let i = 0; i < sources.length; i += batchSize) {
    batches.push(sources.slice(i, i + batchSize));
  }

  const allEntries: PortalEntry[] = [];
  let newestId: string | undefined;
  let callsUsed = 0;

  for (const batch of batches) {
    const fromClause = batch.map((s) => `from:${s.username}`).join(" OR ");
    const query = `(${fromClause}) (portal OR transfer OR committed)`;

    try {
      const { tweets, newestId: batchNewestId } = await searchTweets({
        query,
        sinceId: options.sinceId,
        limit: options.limit || 50,
      });

      callsUsed++;

      // Parse tweets into portal entries
      const entries = tweets
        .map((tweet) => parsePortalTweet(tweet))
        .filter((entry): entry is PortalEntry => entry !== null);

      allEntries.push(...entries);

      if (batchNewestId && (!newestId || batchNewestId > newestId)) {
        newestId = batchNewestId;
      }
    } catch (error) {
      console.error(`Error searching batch:`, error);
    }
  }

  // Sort by engagement (high-engagement tweets = bigger news)
  allEntries.sort((a, b) => b.engagement - a.engagement);

  return {
    entries: allEntries,
    newestId,
    apiCallsUsed: callsUsed,
  };
}

// -----------------------------------------------------------------------------
// Query Building
// -----------------------------------------------------------------------------

function buildPortalQuery(): string {
  // Optimized query that captures portal news
  const keywords = PORTAL_KEYWORDS.slice(0, 4).map((k) => `"${k}"`).join(" OR ");
  return `(${keywords}) baseball`;
}

// Build a targeted query for specific schools
export function buildSchoolQuery(schools: string[]): string {
  const schoolClause = schools.map((s) => `"${s}"`).join(" OR ");
  return `(${schoolClause}) (portal OR transfer) baseball`;
}

// -----------------------------------------------------------------------------
// Tweet Parsing
// -----------------------------------------------------------------------------

function parsePortalTweet(tweet: Tweet): PortalEntry | null {
  const text = tweet.text;

  // Check if it's actually about portal
  const isPortalTweet = PORTAL_KEYWORDS.some((kw) =>
    text.toLowerCase().includes(kw.toLowerCase())
  );

  // Also check for commitment news
  const isCommitment = /commit|signed|announce|heading to|lands at/i.test(text);

  if (!isPortalTweet && !isCommitment) return null;

  // Extract player name, school, position
  let playerName: string | null = null;
  let school: string | null = null;
  let position: string | null = null;
  let conference: string | null = null;

  // Pattern: "[School] [Position] [Player Name] has entered..."
  const patterns = [
    /(?<school>\w+(?:\s+\w+)?)\s+(?<pos>RHP|LHP|C|1B|2B|SS|3B|OF|DH|INF|UTIL|P)\s+(?<name>[A-Z][a-z]+\s+[A-Z][a-z]+)/,
    /(?<name>[A-Z][a-z]+\s+[A-Z][a-z]+)\s+\((?<school>[^)]+)\)/,
    /(?<pos>RHP|LHP|C|1B|2B|SS|3B|OF|DH|INF|UTIL|P)\s+(?<name>[A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:from|of)\s+(?<school>\w+)/,
    /(?<name>[A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(?:a\s+)?(?<pos>RHP|LHP|C|1B|2B|SS|3B|OF|DH|INF|UTIL|pitcher|catcher|infielder|outfielder)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.groups) {
      playerName = playerName || match.groups.name || null;
      school = school || match.groups.school || null;
      position = position || match.groups.pos || null;
      break;
    }
  }

  // Fallback: check for known schools
  if (!school) {
    for (const s of SEC_SCHOOLS) {
      if (text.includes(s)) {
        school = s;
        conference = "SEC";
        break;
      }
    }
  }

  // Detect conference
  if (!conference && school) {
    for (const conf of POWER_CONFERENCES) {
      if (text.includes(conf)) {
        conference = conf;
        break;
      }
    }
  }

  // Calculate engagement score
  const metrics = tweet.public_metrics;
  const engagement = metrics
    ? metrics.retweet_count * 3 + metrics.like_count + metrics.reply_count * 2
    : 0;

  // Determine confidence
  let confidence: "high" | "medium" | "low" = "low";
  if (playerName && school && position) confidence = "high";
  else if (playerName && school) confidence = "medium";
  else if (playerName || school) confidence = "low";
  else return null; // Skip if we couldn't extract anything useful

  return {
    id: `portal-${tweet.id}`,
    playerName,
    school,
    position,
    conference,
    tweetId: tweet.id,
    tweetText: text,
    author: tweet.author?.name || "Unknown",
    authorUsername: tweet.author?.username || tweet.author_id,
    timestamp: tweet.created_at,
    confidence,
    engagement,
  };
}

// -----------------------------------------------------------------------------
// Polling Strategy
// -----------------------------------------------------------------------------

interface PollState {
  lastTweetId?: string;
  lastPollTime?: string;
  entriesFound: number;
}

const pollState: PollState = {
  entriesFound: 0,
};

export async function pollForPortalNews(): Promise<{
  entries: PortalEntry[];
  isNew: boolean;
  state: PollState;
}> {
  const { entries, newestId } = await searchPortalSources({
    sinceId: pollState.lastTweetId,
    limit: 50,
  });

  const isNew = entries.length > 0 && newestId !== pollState.lastTweetId;

  if (newestId) {
    pollState.lastTweetId = newestId;
  }
  pollState.lastPollTime = new Date().toISOString();
  pollState.entriesFound += entries.length;

  return {
    entries,
    isNew,
    state: pollState,
  };
}

// Recommended polling intervals based on portal season
export function getRecommendedPollInterval(): number {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const hour = now.getHours();

  // Portal hot windows: May-June (months 4-5)
  const isPortalSeason = month >= 4 && month <= 6;

  // Business hours in Central time (9am-9pm)
  const isActiveHours = hour >= 9 && hour <= 21;

  if (isPortalSeason && isActiveHours) {
    return 10 * 60 * 1000; // 10 minutes during peak
  } else if (isPortalSeason) {
    return 30 * 60 * 1000; // 30 minutes off-hours during season
  } else if (isActiveHours) {
    return 60 * 60 * 1000; // 1 hour during day, off-season
  } else {
    return 4 * 60 * 60 * 1000; // 4 hours overnight, off-season
  }
}

// -----------------------------------------------------------------------------
// Test Function
// -----------------------------------------------------------------------------

export async function testTwitterConnection(): Promise<{
  success: boolean;
  message: string;
  sampleTweets?: Tweet[];
}> {
  if (!TWITTER_BEARER) {
    return {
      success: false,
      message: "TWITTER_BEARER_TOKEN not set. Get one at https://developer.x.com",
    };
  }

  try {
    const { tweets } = await searchTweets({
      query: '"transfer portal" baseball',
      limit: 5,
    });

    return {
      success: true,
      message: `Connected! Found ${tweets.length} recent portal tweets.`,
      sampleTweets: tweets,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
