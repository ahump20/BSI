// Composite adapter that combines multiple data sources

import * as worker from './worker';
import * as files from './files';
import * as notion from './notion';
import type { Team, PortfolioItem } from '../schema';

interface DataSource {
  priority: number;
  adapter: any;
  fallback?: boolean;
}

class CompositeAdapter {
  private sources: Map<string, DataSource[]> = new Map();

  register(method: string, source: DataSource): void {
    const existing = this.sources.get(method) || [];
    existing.push(source);
    existing.sort((a, b) => a.priority - b.priority);
    this.sources.set(method, existing);
  }

  async execute<T>(method: string, ...args: any[]): Promise<T> {
    const sources = this.sources.get(method);
    if (!sources || sources.length === 0) {
      throw new Error(`No data source registered for method: ${method}`);
    }

    let lastError: Error | null = null;

    for (const source of sources) {
      try {
        if (typeof source.adapter[method] !== 'function') {
          continue;
        }

        return await source.adapter[method](...args);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Source failed for ${method}:`, error);

        if (!source.fallback) {
          throw error;
        }
      }
    }

    throw lastError || new Error(`All sources failed for method: ${method}`);
  }
}

// Create composite adapter
const composite = new CompositeAdapter();

// Register sources with priorities
composite.register('getTeams', { priority: 1, adapter: worker });
composite.register('getTeams', { priority: 2, adapter: files, fallback: true });

composite.register('getPortfolio', { priority: 1, adapter: notion });
composite.register('getPortfolio', { priority: 2, adapter: files, fallback: true });

// Export unified interface
export async function getTeams(league: string): Promise<Team[]> {
  return composite.execute('getTeams', league);
}

export async function getPortfolio(): Promise<PortfolioItem[]> {
  return composite.execute('getPortfolio');
}

// Re-export worker methods that don't need fallbacks
export {
  getKPI,
  getAccuracy,
  getAlerts,
  getLeaderboard,
  simulateMatch,
  getYearlyTrend,
  healthCheck,
  getBatchData,
} from './worker';
