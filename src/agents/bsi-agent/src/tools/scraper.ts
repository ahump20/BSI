/**
 * BSI Portal Scraper - Puppeteer Fallback
 *
 * Zero-cost alternative to Twitter API ($200/mo savings).
 * Scrapes public Twitter profiles and D1Baseball portal page.
 * Use this when:
 * - Testing before committing to API costs
 * - API rate limits exhausted
 * - Backup data collection
 */

// Zod schemas could be added for runtime validation if needed

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ScrapedTweet {
  text: string;
  timestamp: string;
  username: string;
  displayName: string;
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
  };
}

export interface ScrapedPortalEntry {
  playerName: string;
  school: string;
  position: string | null;
  date: string;
  source: "twitter" | "d1baseball" | "baseballamerica";
}

export interface ScrapeResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  scrapedAt: string;
  source: string;
}

// -----------------------------------------------------------------------------
// Puppeteer Check
// -----------------------------------------------------------------------------

// Puppeteer types for dynamic import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let puppeteerModule: any = null;

async function getPuppeteer(): Promise<typeof import("puppeteer")> {
  if (puppeteerModule) return puppeteerModule;

  try {
    // Dynamic import returns the module - we need the default export
    puppeteerModule = await import("puppeteer");
    return puppeteerModule;
  } catch {
    throw new Error(
      "Puppeteer not installed. Run: npm install puppeteer\n" +
        "Or use the Twitter API instead (requires $200/mo Basic tier)."
    );
  }
}

// -----------------------------------------------------------------------------
// Browser Management
// -----------------------------------------------------------------------------

interface BrowserInstance {
  browser: Awaited<ReturnType<typeof import("puppeteer").launch>>;
  lastUsed: number;
}

let browserInstance: BrowserInstance | null = null;
const BROWSER_TIMEOUT = 5 * 60 * 1000; // 5 minutes idle timeout

async function getBrowser(): Promise<BrowserInstance["browser"]> {
  const pptr = await getPuppeteer();

  if (browserInstance && Date.now() - browserInstance.lastUsed < BROWSER_TIMEOUT) {
    browserInstance.lastUsed = Date.now();
    return browserInstance.browser;
  }

  // Close stale browser
  if (browserInstance) {
    try {
      await browserInstance.browser.close();
    } catch {
      // Ignore close errors
    }
  }

  const browser = await pptr.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1920,1080",
    ],
  });

  browserInstance = { browser, lastUsed: Date.now() };
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    try {
      await browserInstance.browser.close();
    } catch {
      // Ignore
    }
    browserInstance = null;
  }
}

// -----------------------------------------------------------------------------
// Twitter Profile Scraping (No API Required)
// -----------------------------------------------------------------------------

/**
 * Scrape tweets from a public Twitter profile.
 * Note: Twitter has anti-scraping measures. This may require:
 * - Rotating user agents
 * - Delays between requests
 * - Handling login walls
 */
export async function scrapeTwitterProfile(
  username: string,
  options: {
    maxTweets?: number;
    filterKeywords?: string[];
  } = {}
): Promise<ScrapeResult<ScrapedTweet>> {
  const { maxTweets = 20, filterKeywords = [] } = options;
  const errors: string[] = [];
  const tweets: ScrapedTweet[] = [];

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Navigate to profile
    await page.goto(`https://twitter.com/${username}`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for tweets to load
    await page.waitForSelector('article[data-testid="tweet"]', { timeout: 10000 });

    // Extract tweets
    const tweetElements = await page.$$('article[data-testid="tweet"]');

    for (const el of tweetElements.slice(0, maxTweets)) {
      try {
        const tweet = await el.evaluate((node) => {
          const textEl = node.querySelector('[data-testid="tweetText"]');
          const timeEl = node.querySelector("time");
          const likesEl = node.querySelector('[data-testid="like"] span');
          const retweetsEl = node.querySelector('[data-testid="retweet"] span');
          const repliesEl = node.querySelector('[data-testid="reply"] span');

          return {
            text: textEl?.textContent || "",
            timestamp: timeEl?.getAttribute("datetime") || "",
            likes: parseInt(likesEl?.textContent || "0", 10) || 0,
            retweets: parseInt(retweetsEl?.textContent || "0", 10) || 0,
            replies: parseInt(repliesEl?.textContent || "0", 10) || 0,
          };
        });

        // Apply keyword filter if specified
        if (filterKeywords.length > 0) {
          const hasKeyword = filterKeywords.some((kw) =>
            tweet.text.toLowerCase().includes(kw.toLowerCase())
          );
          if (!hasKeyword) continue;
        }

        tweets.push({
          text: tweet.text,
          timestamp: tweet.timestamp,
          username,
          displayName: username, // Would need additional extraction
          engagement: {
            likes: tweet.likes,
            retweets: tweet.retweets,
            replies: tweet.replies,
          },
        });
      } catch (err) {
        errors.push(`Failed to parse tweet: ${err}`);
      }
    }
  } catch (err) {
    errors.push(`Failed to scrape @${username}: ${err}`);
  } finally {
    await page.close();
  }

  return {
    success: tweets.length > 0,
    data: tweets,
    errors,
    scrapedAt: new Date().toISOString(),
    source: `twitter.com/${username}`,
  };
}

// -----------------------------------------------------------------------------
// D1Baseball Portal Page Scraping
// -----------------------------------------------------------------------------

/**
 * Scrape the D1Baseball transfer portal page.
 * This is often the canonical source for portal entries.
 */
export async function scrapeD1BaseballPortal(options: {
  maxEntries?: number;
  conference?: string;
} = {}): Promise<ScrapeResult<ScrapedPortalEntry>> {
  const { maxEntries = 100, conference } = options;
  const errors: string[] = [];
  const entries: ScrapedPortalEntry[] = [];

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // D1Baseball portal tracker URL (may need updating)
    await page.goto("https://d1baseball.com/transfer-tracker/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for table to load
    await page.waitForSelector("table", { timeout: 10000 });

    // Extract portal entries from table
    const rows = await page.$$("table tbody tr");

    for (const row of rows.slice(0, maxEntries)) {
      try {
        const entry = await row.evaluate((node) => {
          const cells = node.querySelectorAll("td");
          return {
            playerName: cells[0]?.textContent?.trim() || "",
            school: cells[1]?.textContent?.trim() || "",
            position: cells[2]?.textContent?.trim() || null,
            date: cells[3]?.textContent?.trim() || "",
            conference: cells[4]?.textContent?.trim() || "",
          };
        });

        // Apply conference filter if specified
        if (conference && !entry.conference.toLowerCase().includes(conference.toLowerCase())) {
          continue;
        }

        if (entry.playerName && entry.school) {
          entries.push({
            playerName: entry.playerName,
            school: entry.school,
            position: entry.position,
            date: entry.date || new Date().toISOString(),
            source: "d1baseball",
          });
        }
      } catch (err) {
        errors.push(`Failed to parse row: ${err}`);
      }
    }
  } catch (err) {
    errors.push(`Failed to scrape D1Baseball: ${err}`);
  } finally {
    await page.close();
  }

  return {
    success: entries.length > 0,
    data: entries,
    errors,
    scrapedAt: new Date().toISOString(),
    source: "d1baseball.com/transfer-tracker",
  };
}

// -----------------------------------------------------------------------------
// Baseball America Portal Scraping
// -----------------------------------------------------------------------------

export async function scrapeBaseballAmericaPortal(options: {
  maxEntries?: number;
} = {}): Promise<ScrapeResult<ScrapedPortalEntry>> {
  const { maxEntries = 100 } = options;
  const errors: string[] = [];
  const entries: ScrapedPortalEntry[] = [];

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // BA portal tracker (may require subscription for full access)
    await page.goto("https://www.baseballamerica.com/transfer-portal/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Check for paywall
    const paywalled = await page.$(".paywall, .subscription-required");
    if (paywalled) {
      errors.push("Baseball America requires subscription for full portal access");
      return {
        success: false,
        data: [],
        errors,
        scrapedAt: new Date().toISOString(),
        source: "baseballamerica.com/transfer-portal",
      };
    }

    // Extract portal entries
    const entryElements = await page.$$(".portal-entry, .transfer-item, article");

    for (const el of entryElements.slice(0, maxEntries)) {
      try {
        const entry = await el.evaluate((node) => {
          const nameEl = node.querySelector("h3, .player-name, .title");
          const schoolEl = node.querySelector(".school, .from-school");
          const posEl = node.querySelector(".position");
          const dateEl = node.querySelector(".date, time");

          return {
            playerName: nameEl?.textContent?.trim() || "",
            school: schoolEl?.textContent?.trim() || "",
            position: posEl?.textContent?.trim() || null,
            date: dateEl?.textContent?.trim() || "",
          };
        });

        if (entry.playerName && entry.school) {
          entries.push({
            ...entry,
            date: entry.date || new Date().toISOString(),
            source: "baseballamerica",
          });
        }
      } catch (err) {
        errors.push(`Failed to parse entry: ${err}`);
      }
    }
  } catch (err) {
    errors.push(`Failed to scrape Baseball America: ${err}`);
  } finally {
    await page.close();
  }

  return {
    success: entries.length > 0,
    data: entries,
    errors,
    scrapedAt: new Date().toISOString(),
    source: "baseballamerica.com/transfer-portal",
  };
}

// -----------------------------------------------------------------------------
// Multi-Source Portal Aggregation
// -----------------------------------------------------------------------------

export interface AggregatedPortalData {
  entries: ScrapedPortalEntry[];
  sources: {
    name: string;
    success: boolean;
    count: number;
    errors: string[];
  }[];
  scrapedAt: string;
  totalEntries: number;
}

/**
 * Scrape multiple portal sources and deduplicate.
 * This is the main function for comprehensive portal tracking without API costs.
 */
export async function scrapeAllPortalSources(options: {
  includeTwitter?: boolean;
  twitterAccounts?: string[];
  conference?: string;
} = {}): Promise<AggregatedPortalData> {
  const {
    includeTwitter = false,
    twitterAccounts = ["kendallrogersD1", "d1baseball"],
    conference,
  } = options;

  const allEntries: ScrapedPortalEntry[] = [];
  const sources: AggregatedPortalData["sources"] = [];

  // Scrape D1Baseball (primary source)
  const d1Result = await scrapeD1BaseballPortal({ conference });
  sources.push({
    name: "D1Baseball",
    success: d1Result.success,
    count: d1Result.data.length,
    errors: d1Result.errors,
  });
  allEntries.push(...d1Result.data);

  // Scrape Baseball America (may be paywalled)
  const baResult = await scrapeBaseballAmericaPortal();
  sources.push({
    name: "Baseball America",
    success: baResult.success,
    count: baResult.data.length,
    errors: baResult.errors,
  });
  allEntries.push(...baResult.data);

  // Optionally scrape Twitter
  if (includeTwitter) {
    for (const username of twitterAccounts) {
      const twitterResult = await scrapeTwitterProfile(username, {
        filterKeywords: ["portal", "transfer", "committed"],
      });

      // Convert tweets to portal entries
      const twitterEntries = twitterResult.data
        .map((tweet) => parsePortalFromTweet(tweet))
        .filter((e): e is ScrapedPortalEntry => e !== null);

      sources.push({
        name: `Twitter @${username}`,
        success: twitterResult.success,
        count: twitterEntries.length,
        errors: twitterResult.errors,
      });
      allEntries.push(...twitterEntries);
    }
  }

  // Deduplicate by player name + school
  const seen = new Set<string>();
  const deduped = allEntries.filter((entry) => {
    const key = `${entry.playerName.toLowerCase()}|${entry.school.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    entries: deduped,
    sources,
    scrapedAt: new Date().toISOString(),
    totalEntries: deduped.length,
  };
}

// -----------------------------------------------------------------------------
// Tweet to Portal Entry Parser
// -----------------------------------------------------------------------------

function parsePortalFromTweet(tweet: ScrapedTweet): ScrapedPortalEntry | null {
  const text = tweet.text;

  // Pattern matching for portal announcements
  const patterns = [
    /(?<name>[A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:has\s+)?entered\s+(?:the\s+)?(?:transfer\s+)?portal/i,
    /(?<name>[A-Z][a-z]+\s+[A-Z][a-z]+)\s+is\s+in\s+the\s+portal/i,
    /PORTAL:\s*(?<name>[A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /(?<name>[A-Z][a-z]+\s+[A-Z][a-z]+)\s+\((?<school>[^)]+)\)\s+(?:has\s+)?(?:entered|in)\s+(?:the\s+)?portal/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.groups?.name) {
      // Try to extract school from context
      let school = match.groups.school || "";
      if (!school) {
        const schoolMatch = text.match(
          /(?:from|of|former)\s+(?<school>(?:[A-Z][a-z]+\s*)+(?:State|University|College)?)/i
        );
        school = schoolMatch?.groups?.school || "Unknown";
      }

      // Try to extract position
      const posMatch = text.match(
        /(?<pos>RHP|LHP|C|1B|2B|SS|3B|OF|DH|INF|UTIL|P|pitcher|catcher)/i
      );
      const position = posMatch?.groups?.pos?.toUpperCase() || null;

      return {
        playerName: match.groups.name.trim(),
        school: school.trim(),
        position,
        date: tweet.timestamp,
        source: "twitter",
      };
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// Test Function
// -----------------------------------------------------------------------------

export async function testScraper(): Promise<{
  success: boolean;
  message: string;
  results?: AggregatedPortalData;
}> {
  try {
    // Quick test: just scrape D1Baseball
    const result = await scrapeD1BaseballPortal({ maxEntries: 5 });

    if (result.success) {
      return {
        success: true,
        message: `Scraper working! Found ${result.data.length} portal entries from D1Baseball.`,
        results: {
          entries: result.data,
          sources: [
            {
              name: "D1Baseball",
              success: result.success,
              count: result.data.length,
              errors: result.errors,
            },
          ],
          scrapedAt: result.scrapedAt,
          totalEntries: result.data.length,
        },
      };
    } else {
      return {
        success: false,
        message: `Scraper failed: ${result.errors.join(", ")}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    await closeBrowser();
  }
}
