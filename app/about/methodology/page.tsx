import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CiteWidget } from '@/components/ui/CiteWidget';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'Methodology | BSI',
  description: 'How BSI monitors sports conversation, validates claims, and prioritizes content across platforms.',
};

export default function MethodologyPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <Breadcrumb
              items={[
                { label: 'About', href: '/about' },
                { label: 'Methodology' },
              ]}
            />
          </Container>
        </Section>

        <Section padding="lg">
          <Container size="narrow">
            <Badge variant="primary" className="mb-4">Process</Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-white mb-4">
              Editorial Methodology
            </h1>
            <p className="text-white/50 text-lg leading-relaxed mb-12">
              How BSI identifies stories, monitors conversation across platforms, validates claims
              before publishing, and prioritizes content. The process behind the product.
            </p>

            {/* Topic Monitoring */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                Topic Monitoring
              </h2>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 sm:p-6">
                <p className="text-sm text-white/50 leading-relaxed mb-4">
                  BSI tracks conversation across sports media and fan communities using keyword
                  packs organized by sport and topic. Monitoring serves two purposes: identifying
                  stories the audience cares about, and catching claims that need fact-checking
                  before BSI amplifies them.
                </p>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3">
                  Keyword Packs
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { pack: 'College Baseball', examples: 'CWS, regionals, super regionals, RPI, transfer portal, pitching staff, weekend series' },
                    { pack: 'MLB Analytics', examples: 'xwOBA, barrel rate, spin rate, Statcast, expected stats, pitch model' },
                    { pack: 'CFB/NFL', examples: 'EPA, CPOE, win probability, transfer portal, NIL, coaching carousel' },
                    { pack: 'BSI Brand', examples: 'blazesportsintel, BSI, blaze sports, Austin Humphrey' },
                  ].map((kp) => (
                    <div key={kp.pack} className="bg-white/[0.02] rounded-lg p-3">
                      <span className="text-xs font-bold text-[#BF5700]">{kp.pack}</span>
                      <p className="text-[10px] text-white/30 mt-1">{kp.examples}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Sentiment Buckets */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                Sentiment Classification
              </h2>
              <div className="space-y-3">
                {[
                  { bucket: 'Excitement', color: 'text-green-400', description: 'Genuine enthusiasm around a topic — breakout player, upset win, unexpected storyline' },
                  { bucket: 'Frustration', color: 'text-red-400', description: 'Fan/media dissatisfaction — coverage gap, data error, poor decision by a program' },
                  { bucket: 'Curiosity', color: 'text-blue-400', description: 'Questions being asked that nobody has answered yet — content opportunity' },
                  { bucket: 'Skepticism', color: 'text-yellow-400', description: 'Claims being challenged — fact-checking opportunity or methodology validation' },
                  { bucket: 'Noise', color: 'text-white/30', description: 'High volume, low signal — hot takes, rage bait, engagement farming. Filtered out.' },
                ].map((b) => (
                  <div
                    key={b.bucket}
                    className="flex gap-4 items-start bg-white/[0.03] border border-white/[0.06] rounded-lg p-4"
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 shrink-0 w-20 ${b.color}`}>
                      {b.bucket}
                    </span>
                    <p className="text-sm text-white/50 leading-relaxed">{b.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Platform-Specific */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                Platform Monitoring
              </h2>
              <div className="space-y-3">
                {[
                  { platform: 'X (Twitter)', approach: 'Beat writers, team accounts, analytics community. Primary signal source for breaking news and real-time reaction.' },
                  { platform: 'Reddit', approach: 'Sport-specific subreddits (r/collegebaseball, r/baseball, r/CFB). Longer-form discussion surfaces questions BSI can answer with data.' },
                  { platform: 'IG / TikTok', approach: 'Highlight clips and short-form analysis. Monitored for viral moments and fan sentiment, not treated as factual sources.' },
                ].map((p) => (
                  <div
                    key={p.platform}
                    className="flex gap-4 items-start bg-white/[0.03] border border-white/[0.06] rounded-lg p-4"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#BF5700] mt-0.5 shrink-0 w-20">
                      {p.platform}
                    </span>
                    <p className="text-sm text-white/50 leading-relaxed">{p.approach}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Claim Validation */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                Claim Validation
              </h2>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                <p className="text-sm text-white/50 leading-relaxed">
                  Before BSI publishes a statistical claim or analytical finding, it goes through a
                  three-step validation: (1) verify the underlying data against official sources,
                  (2) confirm the methodology is sound and the comparison is fair, (3) check whether
                  the conclusion follows from the evidence. If any step fails, the claim gets
                  reframed or cut. BSI doesn&#39;t publish stats it can&#39;t source.
                </p>
              </div>
            </section>

            {/* Citation */}
            <CiteWidget
              title="BSI Editorial Methodology"
              path="/about/methodology"
              date="2026-02-17"
            />

            <div className="mt-12 flex flex-wrap gap-4 text-sm text-white/30">
              <Link href="/about" className="hover:text-white/60 transition-colors">
                &#8592; About BSI
              </Link>
              <Link href="/models" className="hover:text-white/60 transition-colors">
                Models & Methodology
              </Link>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
