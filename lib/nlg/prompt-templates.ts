/**
 * NLG Prompt Templates for Game Recaps and Previews
 *
 * Templates designed for fact-checkable content generation
 */

import type { GameContext, PromptTemplate } from '../../workers/content/types';

export const RECAP_TEMPLATE: PromptTemplate = {
  system: `You are a professional college baseball journalist writing for Diamond Insights, a data-driven baseball analytics platform.

Your writing style:
- Clear, concise, and engaging
- Data-focused with specific statistics
- No clichés or hyperbole
- Active voice, present tense for key moments
- 300-500 words target length

Critical rules:
1. ONLY use statistics and facts provided in the context
2. NEVER invent player names, scores, or statistics
3. If a statistic is missing, omit it rather than guess
4. Use exact numbers (e.g., "3-4 with 2 RBI" not "hit well")
5. Cite specific innings and situations
6. Focus on game-changing moments and top performers
7. End with forward-looking context (standings impact, next matchup)

Format:
- Title: Compelling headline with final score
- Lead paragraph: Game result + key takeaway
- Body: 2-3 paragraphs covering turning points and performances
- Closing: Standings/streak context and next game preview`,

  user: `Write a game recap for the following college baseball game:

## Game Result
- **Final Score**: {homeTeam.name} {homeScore}, {awayTeam.name} {awayScore}
- **Date**: {game.scheduledAt}
- **Venue**: {game.venueName}

## Team Records
- {homeTeam.name}: {homeTeam.record} ({homeTeam.conference})
- {awayTeam.name}: {awayTeam.record} ({awayTeam.conference})

## Box Score
### {homeTeam.name}
- Runs: {boxScore.homeStats.runs}
- Hits: {boxScore.homeStats.hits}
- Errors: {boxScore.homeStats.errors}
- Team Batting Avg: {boxScore.homeStats.battingAvg}

### {awayTeam.name}
- Runs: {boxScore.awayStats.runs}
- Hits: {boxScore.awayStats.hits}
- Errors: {boxScore.awayStats.errors}
- Team Batting Avg: {boxScore.awayStats.battingAvg}

## Top Performers
{topPerformers}

## Key Moments
{keyMoments}

## Historical Context
{historicalMatchup}

Generate a professional game recap following the style guidelines above.`,

  constraints: [
    'Use only provided statistics',
    'No invented player names or performances',
    'Specific inning references when available',
    'Include exact statistical lines',
    'Focus on game-changing plays',
    'End with standings/streak context',
    'Target 300-500 words',
    'Active voice, present tense for action',
  ],
};

export const PREVIEW_TEMPLATE: PromptTemplate = {
  system: `You are a professional college baseball analyst writing game previews for Diamond Insights.

Your analysis approach:
- Data-driven matchup analysis
- Recent form and trends
- Key player matchups
- Statistical context
- No predictions or score forecasts

Critical rules:
1. ONLY use provided team/player statistics
2. NEVER invent records, streaks, or player stats
3. Focus on verifiable trends (recent form, head-to-head)
4. Highlight key matchups (pitching vs. hitting)
5. Reference conference/ranking implications
6. Use "should" sparingly - focus on data
7. No final score predictions

Format:
- Title: Teams + stakes (rankings, conference race)
- Lead: Matchup setup with records and context
- Body: 2-3 paragraphs on recent form, key players, historical matchup
- Closing: What to watch for (specific matchups/storylines)`,

  user: `Write a game preview for the following college baseball matchup:

## Matchup
- **Teams**: {awayTeam.name} at {homeTeam.name}
- **Date**: {game.scheduledAt}
- **Venue**: {game.venueName}

## Team Records & Conference Standing
- {homeTeam.name}: {homeTeam.record} ({homeTeam.conference})
  - Recent Form (last 5): {homeTeam.recentForm}
- {awayTeam.name}: {awayTeam.record} ({awayTeam.conference})
  - Recent Form (last 5): {awayTeam.recentForm}

## Team Statistics
### {homeTeam.name}
{homeTeamStats}

### {awayTeam.name}
{awayTeamStats}

## Probable Starters
{probableStarters}

## Historical Matchup
{historicalMatchup}

## Stakes
{stakes}

Generate a data-driven game preview following the analysis guidelines above.`,

  constraints: [
    'Use only provided statistics',
    'No score predictions',
    'Focus on measurable trends',
    'Highlight key player matchups',
    'Reference conference/ranking implications',
    'Recent form analysis (last 5-10 games)',
    'Target 350-600 words',
    'Analytical tone, not predictive',
  ],
};

export function fillRecapTemplate(context: GameContext): string {
  const { game, homeTeam, awayTeam, boxScore, topPerformers, keyMoments, historicalMatchup } = context;

  let userPrompt = RECAP_TEMPLATE.user
    .replace('{homeTeam.name}', homeTeam.name)
    .replace('{awayTeam.name}', awayTeam.name)
    .replace('{homeScore}', String(game.homeScore ?? 0))
    .replace('{awayScore}', String(game.awayScore ?? 0))
    .replace('{game.scheduledAt}', new Date(game.scheduledAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Chicago'
    }))
    .replace('{game.venueName}', game.venueName || 'Unknown Venue')
    .replace('{homeTeam.record}', homeTeam.record)
    .replace('{awayTeam.record}', awayTeam.record)
    .replace('{homeTeam.conference}', homeTeam.conference)
    .replace('{awayTeam.conference}', awayTeam.conference);

  // Replace box score placeholders
  if (boxScore) {
    userPrompt = userPrompt
      .replace('{boxScore.homeStats.runs}', String(boxScore.homeStats.runs))
      .replace('{boxScore.homeStats.hits}', String(boxScore.homeStats.hits))
      .replace('{boxScore.homeStats.errors}', String(boxScore.homeStats.errors))
      .replace('{boxScore.homeStats.battingAvg}', boxScore.homeStats.battingAvg.toFixed(3))
      .replace('{boxScore.awayStats.runs}', String(boxScore.awayStats.runs))
      .replace('{boxScore.awayStats.hits}', String(boxScore.awayStats.hits))
      .replace('{boxScore.awayStats.errors}', String(boxScore.awayStats.errors))
      .replace('{boxScore.awayStats.battingAvg}', boxScore.awayStats.battingAvg.toFixed(3));
  }

  // Format top performers
  let performersText = '';
  if (topPerformers) {
    if (topPerformers.hitting && topPerformers.hitting.length > 0) {
      performersText += '### Hitting\n';
      topPerformers.hitting.forEach(p => {
        performersText += `- ${p.playerName} (${p.position}): ${p.stats}\n`;
      });
    }
    if (topPerformers.pitching && topPerformers.pitching.length > 0) {
      performersText += '\n### Pitching\n';
      topPerformers.pitching.forEach(p => {
        performersText += `- ${p.playerName}: ${p.stats}\n`;
      });
    }
  }
  userPrompt = userPrompt.replace('{topPerformers}', performersText || 'No standout performances logged.');

  // Format key moments
  let momentsText = '';
  if (keyMoments && keyMoments.length > 0) {
    keyMoments.forEach((moment, i) => {
      momentsText += `${i + 1}. ${moment}\n`;
    });
  }
  userPrompt = userPrompt.replace('{keyMoments}', momentsText || 'No key moments recorded.');

  // Format historical matchup
  let historyText = '';
  if (historicalMatchup) {
    historyText = `Series Record: ${homeTeam.name} ${historicalMatchup.homeTeamWins}-${historicalMatchup.awayTeamWins} ${awayTeam.name} (${historicalMatchup.gamesPlayed} games)`;
    if (historicalMatchup.lastMeetingDate) {
      historyText += `\nLast Meeting: ${new Date(historicalMatchup.lastMeetingDate).toLocaleDateString('en-US', { timeZone: 'America/Chicago' })}`;
      if (historicalMatchup.lastMeetingWinner) {
        historyText += ` (${historicalMatchup.lastMeetingWinner} won)`;
      }
    }
  }
  userPrompt = userPrompt.replace('{historicalMatchup}', historyText || 'First meeting this season.');

  return userPrompt;
}

export function fillPreviewTemplate(context: GameContext, additionalContext?: {
  homeTeamStats?: string;
  awayTeamStats?: string;
  probableStarters?: string;
  stakes?: string;
}): string {
  const { game, homeTeam, awayTeam, historicalMatchup } = context;

  let userPrompt = PREVIEW_TEMPLATE.user
    .replace('{awayTeam.name}', awayTeam.name)
    .replace('{homeTeam.name}', homeTeam.name)
    .replace('{game.scheduledAt}', new Date(game.scheduledAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago'
    }))
    .replace('{game.venueName}', game.venueName || 'Unknown Venue')
    .replace('{homeTeam.record}', homeTeam.record)
    .replace('{awayTeam.record}', awayTeam.record)
    .replace('{homeTeam.conference}', homeTeam.conference)
    .replace('{awayTeam.conference}', awayTeam.conference)
    .replace('{homeTeam.recentForm}', homeTeam.recentForm || 'Not available')
    .replace('{awayTeam.recentForm}', awayTeam.recentForm || 'Not available');

  // Add additional context
  userPrompt = userPrompt
    .replace('{homeTeamStats}', additionalContext?.homeTeamStats || 'Team batting avg: .XXX\nTeam ERA: X.XX')
    .replace('{awayTeamStats}', additionalContext?.awayTeamStats || 'Team batting avg: .XXX\nTeam ERA: X.XX')
    .replace('{probableStarters}', additionalContext?.probableStarters || 'Starters TBA')
    .replace('{stakes}', additionalContext?.stakes || 'Regular season matchup');

  // Format historical matchup
  let historyText = '';
  if (historicalMatchup) {
    historyText = `All-time series: ${homeTeam.name} ${historicalMatchup.homeTeamWins}-${historicalMatchup.awayTeamWins} ${awayTeam.name}`;
    if (historicalMatchup.lastMeetingDate) {
      historyText += `\nLast meeting: ${new Date(historicalMatchup.lastMeetingDate).toLocaleDateString('en-US', { timeZone: 'America/Chicago' })}`;
    }
  }
  userPrompt = userPrompt.replace('{historicalMatchup}', historyText || 'First meeting in series.');

  return userPrompt;
}
