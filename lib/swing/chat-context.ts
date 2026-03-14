/**
 * Build the Claude API system prompt from a user's swing analysis data.
 * This is the conversational AI differentiator — responses reference
 * specific frames, measurements, and trends from the user's actual swing.
 */

import type { SwingAnalysis, MetricResult } from './metrics-engine';
import { SPORT_MODELS, type SwingSport, METRIC_GROUPS } from './sport-models';
import { PHASE_LABELS } from './swing-phases';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SwingChatContext {
  systemPrompt: string;
  swingId: string;
  sport: SwingSport;
}

/** Build the full system prompt for swing analysis chat */
export function buildSwingSystemPrompt(
  analysis: SwingAnalysis,
  swingId: string,
  userLevel?: string,
  history?: SwingAnalysis[],
): string {
  const model = SPORT_MODELS[analysis.sport];

  const metricsBlock = analysis.metrics
    .map((m) => {
      const ideal = model.metrics[m.key]?.optimal;
      const idealStr = ideal ? `[ideal: ${ideal[0]}–${ideal[1]}]` : '';
      const rating = m.score >= 80 ? 'GOOD' : m.score >= 50 ? 'NEEDS WORK' : 'ISSUE';
      return `  ${m.label}: ${m.value} ${m.unit} (score: ${m.score}/100 — ${rating}) ${idealStr}`;
    })
    .join('\n');

  const phasesBlock = analysis.phases.phases
    .map((p) => `  ${PHASE_LABELS[p.phase]}: frame ${p.frameIndex} (${Math.round(p.timestamp)}ms)`)
    .join('\n');

  const groupsBlock = Object.entries(METRIC_GROUPS)
    .map(([groupName, keys]) => {
      const groupMetrics = keys
        .map((k) => analysis.metrics.find((m) => m.key === k))
        .filter(Boolean) as MetricResult[];
      const avgScore = Math.round(
        groupMetrics.reduce((sum, m) => sum + m.score, 0) / groupMetrics.length,
      );
      return `  ${groupName}: avg ${avgScore}/100`;
    })
    .join('\n');

  let historyBlock = '';
  if (history && history.length > 0) {
    historyBlock = `\n## Historical Swings (${history.length} previous)\n`;
    history.forEach((h, i) => {
      historyBlock += `Swing ${i + 1}: Overall ${h.overallScore}/100\n`;
      h.metrics.forEach((m) => {
        historyBlock += `  ${m.label}: ${m.value}\n`;
      });
      historyBlock += '\n';
    });
  }

  return `You are BSI Swing Intelligence — an AI batting coach analyzing a ${model.displayName} swing.

## Your Role
You help players improve by explaining exactly what their body is doing during the swing,
why it matters, and what drills will fix issues. You are specific, not generic.

## Current Swing Data (Swing ID: ${swingId})
Sport: ${model.displayName}
Overall Score: ${analysis.overallScore}/100
Total Frames: ${analysis.frameCount} at ${analysis.phases.fps}fps
Duration: ${Math.round(analysis.phases.durationMs)}ms

### Metrics (12 dimensions)
${metricsBlock}

### Phase Timing
${phasesBlock}

### Phase Group Scores
${groupsBlock}

### Sport-Specific Notes
${model.analysisNotes.map((n) => `- ${n}`).join('\n')}
${historyBlock}
## Rules
1. ALWAYS reference specific frame numbers and timestamps when discussing swing mechanics
2. ALWAYS include actual measurement values ("your hip-shoulder separation is 42°, the ideal range is 45-65°")
3. When suggesting improvements, explain the kinetic chain — how one fix cascades into others
4. Prescribe specific drills with clear descriptions when asked
5. Stay conversational and encouraging, but be direct about issues
6. If the user asks about something not in the data, say so — don't guess
7. When comparing to history (if available), note specific improvements or regressions
8. Use ${model.displayName}-specific language and mechanics${userLevel ? `\n9. Adjust complexity for player level: ${userLevel}` : ''}`;
}

/** Build a chat context object for the frontend */
export function createChatContext(
  analysis: SwingAnalysis,
  swingId: string,
  userLevel?: string,
  history?: SwingAnalysis[],
): SwingChatContext {
  return {
    systemPrompt: buildSwingSystemPrompt(analysis, swingId, userLevel, history),
    swingId,
    sport: analysis.sport,
  };
}
