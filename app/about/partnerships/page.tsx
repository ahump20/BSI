import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'Partnerships & Citations | BSI',
  description: 'BSI academic engagement, citation standards, and partnership approach.',
};

export default function PartnershipsPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <Breadcrumb
              items={[
                { label: 'About', href: '/about' },
                { label: 'Partnerships' },
              ]}
            />
          </Container>
        </Section>

        <Section padding="lg">
          <Container size="narrow">
            <Badge variant="primary" className="mb-4">Community</Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-white mb-4">
              Partnerships & Citations
            </h1>
            <p className="text-white/50 text-lg leading-relaxed mb-12">
              BSI&#39;s approach to academic engagement, industry partnerships, and citation
              standards. How BSI credits sources, engages with the analytics community, and
              maintains intellectual honesty.
            </p>

            {/* Academic Engagement */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                Academic & Industry Engagement
              </h2>
              <div className="space-y-3">
                {[
                  {
                    org: 'SABR',
                    full: 'Society for American Baseball Research',
                    approach: 'BSI aligns with SABR\'s mission of advancing baseball knowledge through data. BSI methodology pages use SABR-compatible definitions and cite SABR research where applicable.',
                  },
                  {
                    org: 'SSAC',
                    full: 'MIT Sloan Sports Analytics Conference',
                    approach: 'SSAC-presented research informs BSI\'s model development. When BSI adopts or adapts a methodology introduced at SSAC, the original paper is cited on the relevant model page.',
                  },
                  {
                    org: 'Open Source',
                    full: 'Community Analytics Tools',
                    approach: 'BSI builds on open-source tools (nflfastR, cfbfastR, baseballr) and credits them. When BSI develops novel methodology, it\'s documented publicly on the Models hub.',
                  },
                ].map((item) => (
                  <div
                    key={item.org}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-display text-sm font-bold text-white uppercase">{item.org}</span>
                      <span className="text-white/20 text-xs">&#8212; {item.full}</span>
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed">{item.approach}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Citation Standards */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                Citation Standards
              </h2>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 sm:p-6">
                <div className="space-y-4 text-sm text-white/50 leading-relaxed">
                  <p>
                    BSI follows these citation principles across all content:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex gap-2">
                      <span className="text-[#BF5700] mt-1 shrink-0">&#8226;</span>
                      <strong className="text-white/70">Source everything.</strong> Every data point
                      includes a source attribution and timestamp. If BSI can&#39;t verify where a
                      number came from, it doesn&#39;t publish it.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#BF5700] mt-1 shrink-0">&#8226;</span>
                      <strong className="text-white/70">Credit methodology.</strong> When BSI uses or
                      adapts a model from academic research, the original work is cited on the
                      relevant methodology page with a link to the source paper.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#BF5700] mt-1 shrink-0">&#8226;</span>
                      <strong className="text-white/70">Make BSI citable.</strong> Every model and
                      methodology page includes a &quot;Cite this page&quot; widget generating APA and
                      BibTeX format citations. BSI builds to be cited, not just consumed.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#BF5700] mt-1 shrink-0">&#8226;</span>
                      <strong className="text-white/70">Distinguish opinion from data.</strong> BSI
                      analysis (projections, tiers, outlooks) is labeled as analysis. Data (scores,
                      standings, stats) is labeled with source and timestamp. The reader always
                      knows which is which.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Partnership Interest */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                Partnership Interest
              </h2>
              <div className="bg-[#BF5700]/5 border border-[#BF5700]/15 rounded-xl p-5">
                <p className="text-sm text-white/50 leading-relaxed mb-3">
                  BSI is open to partnerships with academic institutions, analytics conferences,
                  and data providers that align with its mission of bringing depth coverage to
                  underserved sports markets. Contact:{' '}
                  <a
                    href="mailto:Austin@BlazeSportsIntel.com"
                    className="text-[#BF5700] hover:text-[#FF6B35] transition-colors"
                  >
                    Austin@BlazeSportsIntel.com
                  </a>
                </p>
              </div>
            </section>

            <div className="mt-12 flex flex-wrap gap-4 text-sm text-white/30">
              <Link href="/about" className="hover:text-white/60 transition-colors">
                &#8592; About BSI
              </Link>
              <Link href="/about/methodology" className="hover:text-white/60 transition-colors">
                Methodology
              </Link>
              <Link href="/models" className="hover:text-white/60 transition-colors">
                Models Hub
              </Link>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
