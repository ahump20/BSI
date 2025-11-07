import { headers } from 'next/headers';
import type { CFPTop25Response } from '@/lib/cfp';
import { cfpTop25Data } from '@/lib/cfp';
import { Top25Board, ScenarioSimulator, InsightsPanel } from '@/components/cfp';

async function getTop25Data(): Promise<CFPTop25Response> {
  const host = headers().get('host');
  const preferredBase = process.env.NEXT_PUBLIC_SITE_URL ?? null;
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const derivedBase = host ? `${protocol}://${host}` : null;
  const baseUrl = preferredBase ?? derivedBase;

  if (baseUrl) {
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/u, '')}/api/cfp/top25`, {
        next: { revalidate: 120 }
      });

      if (response.ok) {
        return (await response.json()) as CFPTop25Response;
      }
    } catch (error) {
      console.error('[CFP Route] Failed to fetch API data, falling back to static payload:', error);
    }
  }

  return JSON.parse(JSON.stringify(cfpTop25Data)) as CFPTop25Response;
}

export default async function CFPIntelligenceRoute() {
  const data = await getTop25Data();

  return (
    <div className="di-shell">
      <main className="di-container" aria-labelledby="cfp-route-hero">
        <section className="di-hero" id="cfp-route-hero">
          <span className="di-pill">Gridiron Intelligence</span>
          <h1 className="di-title">College Football Playoff Control Center</h1>
          <p className="di-subtitle">
            Track the Blaze Sports Intel composite Top 25, evaluate playoff leverage, and stress test scenarios with our Monte
            Carlo playoff intelligence engine.
          </p>
        </section>

        <Top25Board data={data} />
        <InsightsPanel data={data} />
        <ScenarioSimulator baseline={data} />
      </main>
    </div>
  );
}
