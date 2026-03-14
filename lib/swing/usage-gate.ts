/**
 * Swing Intelligence freemium usage tracking.
 * Free tier: 3 analyses/month, 2 questions/swing, last 3 history entries.
 * Pro tier: unlimited everything.
 */

const FREE_ANALYSES_PER_MONTH = 3;
const FREE_QUESTIONS_PER_SWING = 2;
const FREE_HISTORY_LIMIT = 3;

export interface SwingUsage {
  analysesThisMonth: number;
  isPro: boolean;
}

/** Fetch usage data from the worker (authenticated) or localStorage (anonymous) */
export async function getSwingUsage(): Promise<SwingUsage> {
  const bsiKey = typeof window !== 'undefined' ? localStorage.getItem('bsi-api-key') : null;

  if (bsiKey) {
    try {
      const res = await fetch('/api/swing/usage', {
        headers: { 'X-BSI-Key': bsiKey },
      });
      if (res.ok) {
        return (await res.json()) as SwingUsage;
      }
    } catch {
      // Fall through to localStorage
    }
  }

  // Anonymous: count from localStorage
  const stored = typeof window !== 'undefined'
    ? localStorage.getItem('bsi-swing-usage')
    : null;

  if (stored) {
    try {
      const data = JSON.parse(stored) as { month: string; count: number };
      const currentMonth = new Date().toISOString().slice(0, 7); // "2026-03"
      if (data.month === currentMonth) {
        return { analysesThisMonth: data.count, isPro: false };
      }
    } catch {
      // Corrupted — reset
    }
  }

  return { analysesThisMonth: 0, isPro: false };
}

/** Increment anonymous usage in localStorage */
export function incrementLocalUsage(): void {
  if (typeof window === 'undefined') return;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const stored = localStorage.getItem('bsi-swing-usage');
  let count = 0;

  if (stored) {
    try {
      const data = JSON.parse(stored) as { month: string; count: number };
      if (data.month === currentMonth) {
        count = data.count;
      }
    } catch {
      // Reset
    }
  }

  localStorage.setItem('bsi-swing-usage', JSON.stringify({
    month: currentMonth,
    count: count + 1,
  }));
}

export function canAnalyze(usage: SwingUsage): boolean {
  if (usage.isPro) return true;
  return usage.analysesThisMonth < FREE_ANALYSES_PER_MONTH;
}

export function canAskQuestion(isPro: boolean, questionsThisSwing: number): boolean {
  if (isPro) return true;
  return questionsThisSwing < FREE_QUESTIONS_PER_SWING;
}

export function getHistoryLimit(isPro: boolean): number | undefined {
  return isPro ? undefined : FREE_HISTORY_LIMIT;
}

export { FREE_ANALYSES_PER_MONTH, FREE_QUESTIONS_PER_SWING, FREE_HISTORY_LIMIT };
