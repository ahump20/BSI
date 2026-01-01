/**
 * Twitter API Connection Test
 *
 * Run with: npm run test
 * Requires: TWITTER_BEARER_TOKEN environment variable
 */

import { testTwitterConnection, getApiUsage, PORTAL_SOURCES } from "./tools/twitter.js";

async function main() {
  console.log("🔥 BSI Twitter API Test");
  console.log("=======================\n");

  // Check environment
  if (!process.env.TWITTER_BEARER_TOKEN) {
    console.log("❌ TWITTER_BEARER_TOKEN not set");
    console.log("\nTo set up Twitter API access:");
    console.log("1. Apply at https://developer.x.com (see docs/TWITTER-API-APPLICATION.md)");
    console.log("2. Create an App and generate Bearer Token");
    console.log("3. Run: export TWITTER_BEARER_TOKEN=your_token_here");
    console.log("4. Try again: npm run test\n");

    console.log("💡 Without Twitter API, the agent will use Puppeteer scraping (free).");
    return;
  }

  console.log("✓ TWITTER_BEARER_TOKEN is set\n");

  // Test connection
  console.log("Testing connection...");
  const result = await testTwitterConnection();

  if (result.success) {
    console.log(`✓ ${result.message}\n`);

    if (result.sampleTweets && result.sampleTweets.length > 0) {
      console.log("Sample portal tweets found:");
      for (const tweet of result.sampleTweets) {
        const author = tweet.author?.username || tweet.author_id;
        console.log(`  [@${author}] ${tweet.text.slice(0, 80)}...`);
      }
    }
  } else {
    console.log(`❌ ${result.message}`);
  }

  // Show API usage
  console.log("\n📊 API Usage:");
  const usage = getApiUsage();
  console.log(`  Used: ${usage.used}/${usage.limit} (${usage.remaining} remaining)`);
  console.log(`  Resets: ${usage.resetAt}`);

  // Show configured sources
  console.log("\n📡 Configured Portal Sources:");
  for (const source of PORTAL_SOURCES) {
    console.log(`  [P${source.priority}] @${source.username} - ${source.name}`);
  }
}

main().catch(console.error);
