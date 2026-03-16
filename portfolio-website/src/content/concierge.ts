import { PLATFORM_URLS, PRIMARY_EMAIL } from './site';

export const AI_CHAT_GREETING = 'Austin Humphrey — builder, BSI founder, Texas-born. Ask me anything.';

export const AI_CHAT_SUGGESTED_PROMPTS = [
  'What is BSI?',
  'Tell me about the Texas soil',
  "What's the tech stack?",
  'How do I reach Austin?',
] as const;

export const AI_CHAT_FALLBACK_RESPONSES: Array<{
  keywords: string[];
  response: string;
}> = [
  {
    keywords: ['bsi', 'blaze', 'sports intel', 'platform'],
    response:
      'Blaze Sports Intel is a production-grade sports analytics platform covering six leagues — MLB, NFL, NBA, NCAA football, college basketball, and college baseball. Dozens of specialized systems, multiple databases, all maintained by Austin.',
  },
  {
    keywords: ['contact', 'email', 'hire', 'reach', 'direct'],
    response:
      `Reach Austin at ${PRIMARY_EMAIL}, on LinkedIn at ${PLATFORM_URLS.linkedin.replace('https://', '')}, or on X at @BlazeSportsIntel.`,
  },
  {
    keywords: ['texas', 'soil', 'origin', 'born'],
    response:
      'Austin was born August 17, 1995 in Memphis. His parents brought Texas soil from West Columbia and placed it beneath his mother before he was born. The El Campo Leader-News ran the headline: "Tennessee Birth Will Be on Texas Soil."',
  },
  {
    keywords: ['education', 'school', 'ut', 'university', 'degree', 'full sail', 'mccombs'],
    response:
      'B.A. International Relations & Global Studies from UT Austin (minors in Economics and European Studies). M.S. Entertainment Business — Sports Management from Full Sail University (GPA 3.56). Currently pursuing an AI & Machine Learning Postgraduate Certificate from UT Austin McCombs.',
  },
  {
    keywords: ['experience', 'work', 'job', 'career', 'spectrum', 'northwestern'],
    response:
      'Founder & Builder at BSI (2023-present). Before that: Advertising Account Executive at Spectrum Reach covering Austin/San Antonio DMA (2022-2025), Financial Representative at Northwestern Mutual earning the "Power of 10" Award for top 10% nationally (2020-2022).',
  },
  {
    keywords: ['philosophy', 'covenant', 'believe', 'values'],
    response:
      '"For me, personally, I believe Texas is how you choose to treat the best and worst of us." It\'s a covenant with oneself — to never stop dreaming beyond the horizon, regardless of race, ethnicity, religion, or birth soil.',
  },
  {
    keywords: ['project', 'blazecraft', 'arcade', 'sandlot', 'game'],
    response:
      `Beyond BSI: BlazeCraft (${PLATFORM_URLS.blazecraft.replace('https://', '')}) is a Warcraft 3-style system health dashboard. The BSI Arcade features Sandlot Sluggers, a browser-based baseball game with real rosters via the BSI API.`,
  },
  {
    keywords: ['stack', 'tech', 'cloudflare', 'worker', 'infrastructure'],
    response:
      'Cloudflare everything — dozens of edge-powered specialists, multiple databases, KV caches, and storage buckets. Frontend: Next.js 16 (static export), React 19, TypeScript, Tailwind. All maintained solo.',
  },
  {
    keywords: ['bitch', 'idiot', 'stupid', 'trash', 'hood', 'dumb'],
    response:
      "I can do better than drive-by nonsense. Ask about Austin, BSI, the build, the Texas soil story, or how to reach him and I'll give you something useful.",
  },
] as const;
