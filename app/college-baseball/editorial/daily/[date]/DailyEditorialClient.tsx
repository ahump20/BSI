'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout-ds/Footer';
import { ScrollReveal } from '@/components/cinematic';
import { DataAttribution } from '@/components/ui/DataAttribution';

interface EditorialData {
  date: string;
  title: string;
  content: string;
  teams?: string;
  wordCount?: number;
  meta?: { source: string; fetched_at: string };
  error?: string;
}

export default function DailyEditorialClient() {
  const params = useParams();
  const dateParam = params?.date as string;
  const [data, setData] = useState<EditorialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dateParam) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/college-baseball/editorial/daily/${dateParam}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<EditorialData>;
      })
      .then((result) => {
        if (!cancelled) {
          if (result.error) {
            setError(result.error);
          } else {
            setData(result);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load editorial');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [dateParam]);

  const formattedDate = dateParam
    ? new Date(dateParam + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24 bg-gradient-to-b from-charcoal to-midnight">
          <Container size="narrow">
            <ScrollReveal direction="up">
              <nav className="flex items-center gap-3 mb-6 text-sm">
                <Link href="/college-baseball" className="text-white/30 hover:text-burnt-orange transition-colors">
                  College Baseball
                </Link>
                <span className="text-white/20">/</span>
                <Link href="/college-baseball/editorial" className="text-white/30 hover:text-burnt-orange transition-colors">
                  Editorial
                </Link>
                <span className="text-white/20">/</span>
                <span className="text-white/60">Daily Digest</span>
              </nav>

              <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-wide mb-2">
                BSI Daily Digest
              </h1>
              <p className="text-white/40 text-sm">{formattedDate}</p>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="lg" className="bg-midnight">
          <Container size="narrow">
            {loading && (
              <Card padding="lg" className="text-center">
                <div className="py-12">
                  <div className="w-8 h-8 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white/40 text-sm">Loading editorial...</p>
                </div>
              </Card>
            )}

            {error && !loading && (
              <Card padding="lg" className="text-center">
                <div className="py-8">
                  <p className="text-red-400 mb-2">{error}</p>
                  <Link
                    href="/college-baseball/editorial"
                    className="text-burnt-orange hover:text-burnt-orange/80 transition-colors text-sm"
                  >
                    Back to Editorial
                  </Link>
                </div>
              </Card>
            )}

            {data && !loading && (
              <ScrollReveal direction="up">
                <article className="prose prose-invert prose-lg max-w-none">
                  <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide mb-6">
                    {data.title}
                  </h2>
                  <div
                    className="text-white/80 leading-relaxed space-y-4 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-burnt-orange [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:mt-6 [&_h3]:mb-2"
                    dangerouslySetInnerHTML={{ __html: data.content }}
                  />
                </article>

                {data.teams && (
                  <div className="mt-8 pt-4 border-t border-white/10">
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Teams mentioned</p>
                    <div className="flex flex-wrap gap-2">
                      {data.teams.split(',').map((team) => (
                        <span
                          key={team.trim()}
                          className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-white/50 text-xs"
                        >
                          {team.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <DataAttribution
                  lastUpdated={data.meta?.fetched_at ?? ''}
                  source={data.meta?.source ?? 'BSI Analytics Engine'}
                  className="mt-8"
                />
              </ScrollReveal>
            )}
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
