import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Footer } from '@/components/layout-ds/Footer';
import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title:
    'The $1 Billion Experiment: Money, Power, and Transparency in the NCAA\u2019s NIL Era | BSI Research',
  description:
    'A scholarly analysis of NIL financial flows, gender equity, institutional leverage, and regulatory gaps in college athlete compensation (2021-2026). 43 references, 4 data tables, 35+ inline citations.',
  openGraph: {
    title:
      'The $1 Billion Experiment: Money, Power, and Transparency in the NCAA\u2019s NIL Era',
    description:
      'Scholarly analysis of NIL financial flows, gender equity, and regulatory gaps. BSI Research Division, March 2026.',
    images: ogImage('/images/og/nil-analysis.png'),
  },
  authors: [{ name: 'Austin Humphrey' }],
  keywords: [
    'NCAA',
    'NIL',
    'name image likeness',
    'college athletics',
    'Title IX',
    'House v NCAA',
    'antitrust',
    'athlete compensation',
    'collectives',
  ],
};

/* ── Table of Contents ────────────────────────────────────────────── */

const TOC = [
  { id: 'abstract', label: 'Abstract' },
  { id: 'introduction', label: 'I. Introduction' },
  { id: 'literature', label: 'II. Literature Review' },
  { id: 'market', label: 'III. Market Architecture' },
  { id: 'collectives', label: 'IV. The Collective Problem' },
  { id: 'gender', label: 'V. The Gender Equation' },
  { id: 'predatory', label: 'VI. Predatory Vehicles' },
  { id: 'house', label: 'VII. House v. NCAA' },
  { id: 'labor', label: 'VIII. The Labor Question' },
  { id: 'conclusion', label: 'IX. Conclusion' },
  { id: 'references', label: 'References' },
];

/* ── Reusable prose components ────────────────────────────────────── */

function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-[var(--bsi-bone)] mt-20 mb-8 scroll-mt-24 flex items-center gap-4"
    >
      <span className="w-8 h-px bg-[var(--bsi-primary)]/50 shrink-0 hidden md:block" />
      <span>{children}</span>
    </h2>
  );
}

function P({ children, drop }: { children: React.ReactNode; drop?: boolean }) {
  return (
    <p
      className={`font-serif text-[1.1rem] md:text-[1.15rem] leading-[1.9] text-[var(--bsi-dust)] mb-6 ${
        drop
          ? 'first-letter:text-5xl first-letter:font-display first-letter:font-bold first-letter:text-[var(--bsi-primary)] first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.8]'
          : ''
      }`}
    >
      {children}
    </p>
  );
}

function BlockQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="relative my-10 pl-8 md:pl-10">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full bg-gradient-to-b from-burnt-orange/50 via-burnt-orange/20 to-transparent" />
      <p className="font-serif text-lg md:text-xl italic text-[rgba(196,184,165,0.5)] leading-relaxed">
        {children}
      </p>
    </blockquote>
  );
}

function DataTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <figure className="my-10">
      <figcaption className="font-display text-xs uppercase tracking-[0.15em] text-[var(--bsi-primary)]/70 mb-4 flex items-center gap-3">
        <span className="w-4 h-px bg-[var(--bsi-primary)]/40" />
        {caption}
      </figcaption>
      <div className="overflow-x-auto rounded-sm border border-border/40">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-white/[0.02]">
              {headers.map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 border-b border-[var(--bsi-primary)]/15 font-mono text-[10px] uppercase tracking-[0.15em] text-[rgba(196,184,165,0.35)] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`${
                  i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]'
                } hover:bg-[var(--bsi-primary)]/[0.03] transition-colors`}
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`px-4 py-2.5 border-b border-border/30 whitespace-nowrap ${
                      j === 0
                        ? 'font-serif text-[var(--bsi-dust)] font-medium'
                        : 'font-mono text-xs text-[rgba(196,184,165,0.35)]'
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

function Ref({ children }: { children: React.ReactNode }) {
  return (
    <p className="pl-8 -indent-8 font-serif text-[0.85rem] leading-[1.7] text-[rgba(196,184,165,0.35)]/80 mb-2">
      {children}
    </p>
  );
}

function RefDoi({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-[var(--bsi-primary)]/50 hover:text-[var(--bsi-primary)] transition-colors break-all">
      {children}
    </a>
  );
}

function RefSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[10px] uppercase tracking-[0.2em] text-[var(--bsi-primary)]/40 mt-10 mb-4 flex items-center gap-3">
      <span className="w-6 h-px bg-[var(--bsi-primary)]/20" />
      {children}
    </p>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default function NILAnalysisPage() {
  return (
    <>
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/"
                className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors"
              >
                Home
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]/40">/</span>
              <Link
                href="/research"
                className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors"
              >
                Research
              </Link>
              <span className="text-[rgba(196,184,165,0.35)]/40">/</span>
              <span className="text-[var(--bsi-bone)]">NIL Analysis</span>
            </nav>
          </Container>
        </Section>

        {/* Hero — editorial authority */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/6 via-transparent to-transparent pointer-events-none" />
          <Container size="lg">
            <div className="max-w-4xl">
              {/* Research division marker */}
              <div className="flex items-center gap-3 mb-10">
                <div className="h-px w-8 bg-[var(--bsi-primary)]/60" />
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--bsi-primary)]/70">
                  BSI Research Division
                </span>
                <span className="text-[rgba(196,184,165,0.35)]/30">&middot;</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[rgba(196,184,165,0.35)]/50">
                  March 2026
                </span>
              </div>

              {/* Title block */}
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold uppercase tracking-wide mb-5 leading-[1.1]">
                The $1 Billion Experiment
              </h1>
              <p className="font-serif text-xl md:text-2xl text-[var(--bsi-primary)]/60 italic mb-8 max-w-3xl leading-relaxed">
                Money, Power, and Transparency in the NCAA&rsquo;s NIL Era
              </p>
              <p className="font-serif text-base md:text-lg text-[rgba(196,184,165,0.5)] leading-relaxed max-w-2xl">
                A scholarly analysis of name, image, and likeness financial flows, legal architecture,
                and institutional impact, 2021&ndash;2026
              </p>

              {/* Author attribution */}
              <div className="mt-10 pt-6 border-t border-border/30 flex flex-col sm:flex-row sm:items-center gap-4">
                <div>
                  <p className="text-sm text-[var(--bsi-dust)] font-medium">
                    Austin Humphrey
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(196,184,165,0.35)]/60 mt-0.5">
                    Founder &amp; Research Director
                  </p>
                </div>
                <div className="hidden sm:block h-8 w-px bg-border/30" />
                <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.15em] text-[rgba(196,184,165,0.35)]/50">
                  <span>43 references</span>
                  <span className="text-[rgba(196,184,165,0.35)]/20">&middot;</span>
                  <span>4 data tables</span>
                  <span className="text-[rgba(196,184,165,0.35)]/20">&middot;</span>
                  <span>35+ citations</span>
                  <span className="text-[rgba(196,184,165,0.35)]/20">&middot;</span>
                  <span>45 min read</span>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* Main Content with TOC sidebar */}
        <Section padding="lg" background="charcoal">
          <Container size="xl">
            <div className="flex gap-16">
              {/* Sticky TOC — desktop only */}
              <aside className="hidden xl:block w-56 shrink-0">
                <div className="sticky top-24">
                  <div className="rounded-sm bg-white/[0.02] border border-border/30 p-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--bsi-primary)]/50 mb-5">
                      Contents
                    </p>
                    <nav className="space-y-0.5">
                      {TOC.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className="block text-[13px] font-serif text-[rgba(196,184,165,0.35)]/60 hover:text-[var(--bsi-primary)] transition-colors py-1.5 border-l border-border/20 hover:border-[var(--bsi-primary)]/40 pl-4"
                        >
                          {item.label}
                        </a>
                      ))}
                    </nav>
                  </div>
                </div>
              </aside>

              {/* Article body */}
              <article className="min-w-0 max-w-3xl">
                {/* ── Abstract ──────────────────────────────────────── */}
                <SectionHeading id="abstract">Abstract</SectionHeading>
                <div className="bg-white/[0.02] border border-border/30 rounded-sm p-6 md:p-8 mb-12">
                  <P>
                    The NCAA&rsquo;s name, image, and likeness market &mdash; reaching an estimated $2.26 billion in annual activity by its fourth year and projected to exceed $2.75 billion under the <em>House v. NCAA</em> revenue-sharing framework (Opendorse, 2025) &mdash; is not a reform. It is an unregulated financial experiment conducted on eighteen- to twenty-two-year-olds, and the primary beneficiaries are not the athletes it was designed to liberate. This analysis examines how structural opacity in NIL financial flows concentrates advantage among intermediaries &mdash; collectives, platform companies, hedge fund&ndash;adjacent donor vehicles, and institutional compliance offices &mdash; while athletes navigate a marketplace with no standardized disclosure requirements, no collective bargaining rights, and no fiduciary protections. Findings span four domains: market concentration, where a small number of high-revenue sport athletes capture the overwhelming majority of NIL dollars while the median Division I athlete earns approximately $500&ndash;$713 annually; gender inequity, where women&rsquo;s sports athletes receive less than 3.5% of collective-backed funds despite generating measurable and growing marginal revenue; compliance fragmentation, where thirty-plus different state laws produce a regulatory patchwork that advantages programs in permissive jurisdictions; and predatory financial vehicles, where charitable-structure collectives and NIL hedge funds operate with minimal transparency obligations while functioning as de facto recruiting war chests and speculative instruments. The $2.8 billion <em>House v. NCAA</em> settlement, far from resolving these tensions, layers a revenue-sharing model atop an already opaque system &mdash; adding institutional money without institutional accountability. The central argument is straightforward: transparency is not a feature request. It is the minimum standard for any marketplace that routes billions of dollars through the labor of unpaid (or newly, unevenly paid) young people.
                  </P>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[rgba(196,184,165,0.35)]/50">
                    <strong className="text-[rgba(196,184,165,0.35)]/70">Keywords:</strong>{' '}
                    NCAA, name image and likeness, NIL, college athletics, antitrust, Title IX, athlete compensation, collectives, House v. NCAA, monopsony
                  </p>
                </div>

                {/* ── 1. Introduction ──────────────────────────────── */}
                <SectionHeading id="introduction">
                  I. Introduction &mdash; The Amateurism Myth Unravels
                </SectionHeading>
                <P drop>
                  Walter Byers spent thirty-six years as the NCAA&rsquo;s first executive director, building the regulatory architecture that governed college athletics from 1951 to 1987. He invented the term &ldquo;student-athlete&rdquo; &mdash; not as a description of reality, but as a legal shield. The phrase was designed to prevent injured athletes from claiming workers&rsquo; compensation benefits, and it worked (Gayles &amp; Blanchard, 2018). By the time Byers left the organization, the system he had constructed was generating hundreds of millions in television revenue, distributed to universities and conferences, built on the unpaid labor of athletes who were legally barred from sharing in the value they created. In 1995, Byers published <em>Unsportsmanlike Conduct: Exploiting College Athletes</em>, in which he described his own creation as a &ldquo;neo-plantation&rdquo; system &mdash; a structure where predominantly Black athletes in revenue sports generated wealth that overwhelmingly benefited predominantly white administrators, coaches, and institutional endowments (Byers &amp; Hammer, 1995). The man who built the machine named it for what it was. The NCAA spent the next quarter-century pretending he hadn&rsquo;t.
                </P>
                <P>
                  The mythology of amateurism in American college athletics has never been internally coherent. The NCAA was founded in 1906 in response to football deaths &mdash; eighteen players killed in a single season &mdash; and its original mandate was player safety, not economic regulation (Smith, 2011). The shift toward amateurism as an economic doctrine came later, accelerating through the mid-twentieth century as television transformed college football and basketball into billion-dollar spectacles. By the 1980s, the tension between amateurism&rsquo;s ideological claims and its economic reality had become structurally unsustainable.
                </P>
                <P>
                  The first major fracture came in <em>NCAA v. Board of Regents of the University of Oklahoma</em> (1984), where the Supreme Court struck down the NCAA&rsquo;s monopoly control over television broadcast rights. Justice John Paul Stevens&rsquo;s majority opinion contained a concession that would haunt the NCAA for decades: the Court acknowledged that the NCAA&rsquo;s restrictions on athlete compensation might be procompetitive, because they preserved the &ldquo;revered tradition of amateurism&rdquo; that made college sports appealing to consumers. That single phrase &mdash; amateurism as a consumer product &mdash; became the NCAA&rsquo;s primary legal defense for the next thirty-seven years. It was an argument about branding, not about education, and the courts eventually noticed.
                </P>
                <P>
                  <em>O&rsquo;Bannon v. NCAA</em> (2014) cracked the foundation. The Ninth Circuit ruled that the NCAA&rsquo;s blanket prohibition on compensating athletes for the use of their names, images, and likenesses violated antitrust law &mdash; but stopped short of requiring cash payments. The structural principle mattered more than the dollar figure. Amateurism was no longer a legal absolute; it was a policy choice, subject to antitrust scrutiny.
                </P>
                <P>
                  Seven years later, the Supreme Court finished the job. <em>NCAA v. Alston</em> (2021) demolished the NCAA&rsquo;s broader amateurism defense. Justice Neil Gorsuch&rsquo;s unanimous opinion stated that the NCAA was &ldquo;not above the antitrust laws.&rdquo; Justice Brett Kavanaugh&rsquo;s concurrence went further: &ldquo;Price-fixing labor is price-fixing labor. And price-fixing labor is ordinarily a textbook antitrust problem.&rdquo; He compared the NCAA&rsquo;s model to a scheme in which &ldquo;all restaurants in a region agreed to cut cooks&rsquo; wages&rdquo; &mdash; an analogy that reframed the entire debate from educational philosophy to labor exploitation.
                </P>
                <P>
                  The NCAA&rsquo;s response was not a considered policy reform. It was a capitulation. On July 1, 2021, the NCAA adopted an interim NIL policy that permitted athletes to profit from their names, images, and likenesses for the first time, subject to state laws where applicable (Romano, 2021). The policy contained no federal framework, no spending limits, no disclosure requirements, no collective bargaining mechanism, and no enforcement infrastructure. In effect, the NCAA told athletes they were free to enter a marketplace, then declined to build the marketplace itself. What filled the vacuum was predictable: intermediaries.
                </P>
                <P>
                  Within twelve months, first-year NIL spending reached approximately $917 million (Opendorse, 2024). Approximately eighty NIL collectives &mdash; donor-funded organizations operating outside university control but with obvious institutional affiliations &mdash; emerged to channel money toward athletes, primarily in football and men&rsquo;s basketball (Romano, 2023b). Platform companies positioned themselves as marketplaces, taking transaction fees from deals they facilitated. The result was not a market in any functional sense. It was a gold rush with no assay office.
                </P>

                {/* ── 2. Literature Review ─────────────────────────── */}
                <SectionHeading id="literature">
                  II. Literature Review &mdash; What Scholarship Says
                </SectionHeading>
                <P drop>
                  The peer-reviewed literature on NIL is growing but structurally incomplete &mdash; a field still catching up to a market that moved faster than any academic publishing cycle could track. What exists clusters around three questions: whether college athletes were exploited under the pre-NIL regime, how the value of athlete labor should be measured, and what institutional effects flow from tying athletic success to financial competition.
                </P>
                <P>
                  The exploitation question has the deepest empirical foundation. Brook and Hellen (2024) applied Pigouvian exploitation theory to men&rsquo;s and women&rsquo;s college basketball at public Division I universities. Their findings: approximately 25% of men&rsquo;s basketball players at public D1 institutions are compensated below their marginal revenue product. Among FBS men&rsquo;s basketball players, the exploitation rate rises to nearly half. For women&rsquo;s basketball, roughly 10% of players are Pigouvian-exploited &mdash; a lower figure that reflects revenue structures universities have built around men&rsquo;s sports rather than a statement about the value of women&rsquo;s athletics (Brook &amp; Hellen, 2024).
                </P>
                <P>
                  Agha, Berri, Brook, and Paulson (2024) extended this framework beyond basketball, finding that wage exploitation exists in college softball &mdash; many players generate more revenue in college than they would earn as professional softball players. Their study of 19,760 athletes demonstrates that exploitation in college athletics is &ldquo;no longer just a man&rsquo;s game&rdquo; (Agha et al., 2024).
                </P>
                <P>
                  Li and Derdenger (2025), publishing in <em>Management Science</em>, offered a counterintuitive finding on competitive balance: NIL may actually <em>increase</em> competitive balance by distributing talent more widely, especially among five-star and lower-ranked four-star recruits. The finding does not contradict the market concentration thesis &mdash; it refines it, suggesting that concentration operates at the individual athlete level rather than the institutional level.
                </P>
                <P>
                  The most significant gap in the literature is empirical. No comprehensive peer-reviewed study of total NIL spending by sport, by institution, by gender, or by division exists as of early 2026. The widely cited market size figures trace to industry estimates from Opendorse and On3 &mdash; platform companies with commercial interests in the market they serve &mdash; not to independent academic research.
                </P>

                {/* ── 3. Market Architecture ───────────────────────── */}
                <SectionHeading id="market">
                  III. Market Architecture &mdash; How NIL Money Flows
                </SectionHeading>
                <P drop>
                  The NIL market is not a market. It is a collection of financial channels &mdash; some institutional, some donor-driven, some platform-mediated, some predatory &mdash; that route money toward athletes through structures designed primarily to benefit the organizations that control the flow. The most credible public evidence now suggests NIL is better modeled as three adjacent markets &mdash; brand endorsements, collective roster spend, and direct institutional revenue share &mdash; whose borders are being redrawn by enforcement.
                </P>

                <DataTable
                  caption="Table 1: NIL Market Size by Year (2021&ndash;2026)"
                  headers={['Academic Year', 'Estimated Total', 'Collective', 'Commercial', 'Collegiate', 'Source', 'Confidence']}
                  rows={[
                    ['2021-22 (Yr 1)', '$917M', '$321M', '$597M', '$0', 'Opendorse NIL at 3', 'HIGH'],
                    ['2022-23 (Yr 2)', '$1.14B', '$911M', '$229M', '$0', 'Opendorse', 'HIGH'],
                    ['2023-24 (Yr 3)', '$1.17B', '$936M', '$234M', '$0', 'Opendorse NIL at 3', 'HIGH'],
                    ['2024-25 (Yr 4)', '$2.26B', '$1.3B', '$957M', '$0', 'Opendorse NIL at Four', 'HIGH'],
                    ['2025-26 (proj.)', '$2.3\u20132.75B', '$227M', '$995M', '$1.5\u20131.8B', 'Opendorse; nil-ncaa.com', 'MEDIUM'],
                  ]}
                />

                <P>
                  The timing of the Year 4 to Year 5 transition matters. June 2025 behaved like regulatory arbitrage. Front Office Sports reported that collectives funneled close to $20 million to athletes through Opendorse on June 30 alone, explicitly framed as offloading before NIL Go review became operational (Front Office Sports, 2025). Annual totals can mislead when rules change at the boundary of the measurement window.
                </P>
                <P>
                  Collective spending is projected to collapse from $1.3 billion to approximately $227 million &mdash; an 82% decline &mdash; as institutional revenue sharing under <em>House</em> absorbs the function collectives previously served. Commercial NIL rebounded from its Year 2 trough ($229 million) to nearly $1 billion by Year 4, suggesting brand-athlete partnerships have found sustainable footing independent of the collective infrastructure.
                </P>

                <DataTable
                  caption="Table 2: NIL Distribution by Sport"
                  headers={['Sport', '% of Collective Spending', 'Source', 'Confidence']}
                  rows={[
                    ['Football', '72.2%', 'Opendorse via Reach Capital', 'HIGH'],
                    ['Men\u2019s Basketball', '21.2%', 'Same', 'HIGH'],
                    ['Baseball', '~3% (3rd most compensated)', 'Opendorse NIL at 3', 'MEDIUM'],
                    ['Women\u2019s Basketball', '2.3%', 'Reach Capital', 'MEDIUM'],
                    ['All Other', '~1.3%', 'Derived', 'LOW'],
                  ]}
                />

                <P>
                  College baseball occupies a significant position as a &ldquo;middle market&rdquo; sport &mdash; real roster churn, unpriced transfer leverage, and meaningful local fan demand, yet systematic NIL accounting remains sparse. Reporting in <em>Baseball America</em> describes six-figure transfer offers as a recruiting mechanism, consistent with NIL functioning as price discovery in the transfer portal rather than purely as endorsement marketing (Baseball America, 2025).
                </P>
                <P>
                  The concentration dynamics within this system are severe. The average NIL deal at Power 4 schools is valued at $10,477, but the median is $500. More than half of all NIL deals are worth $100 or less. Athletes with agent representation earn 5.3 times more than those without. Athletes who transfer earn 1.7 times more than those who stay (Opendorse NIL at 3, 2024). The marketplace rewards mobility and professional representation &mdash; resources disproportionately available to athletes in revenue sports.
                </P>

                {/* ── 4. Collectives ────────────────────────────────── */}
                <SectionHeading id="collectives">
                  IV. The Collective Problem &mdash; Governance Without Guardrails
                </SectionHeading>
                <P drop>
                  The most consequential actors in the NIL economy are not the athletes. They are the collectives &mdash; donor-funded intermediaries that emerged to channel booster money to players, operating in a regulatory vacuum so total that even the NCAA&rsquo;s own president admitted the system runs on dishonesty. NCAA President Charlie Baker&rsquo;s assessment was blunt: &ldquo;The only thing that&rsquo;s true about NIL is everybody&rsquo;s lying and whatever you hear about it, basically, don&rsquo;t believe it&rdquo; (Stein &amp; Brolley, 2023).
                </P>
                <P>
                  By 2023, roughly eighty collectives had been identified (Romano, 2023b), a figure that Opendorse updated to more than 200 collectives across divisions by the market&rsquo;s second anniversary (Opendorse, 2023). Their legal architecture is telling: many organized as 501(c)(3) nonprofits. The IRS began scrutinizing whether collectives meet the charitable purpose test in 2023, issuing Chief Counsel Memorandum AM 2023-004 concluding that most fail the operational test. By October 2024, the IRS named NIL collectives as a 2025 compliance enforcement priority (Romano, 2023b).
                </P>
                <P>
                  The money concentrates at the top. Texas leads all programs with an estimated $22.2 million in football NIL spending, followed by Ohio State ($20.2 million) and LSU ($20.1 million) (247Sports, 2025). Texas A&amp;M athletes received $51.4 million in NIL revenue from July 2024 to June 2025 &mdash; but the gender distribution reveals the structural reality: $49.2 million (95.7%) went to men&rsquo;s sports, $2.2 million (4.3%) to women&rsquo;s (CBS Sports, 2025).
                </P>

                <DataTable
                  caption="Table 3: NIL Go Clearinghouse Compliance Data"
                  headers={['Metric', 'Value', 'Date', 'Source', 'Confidence']}
                  rows={[
                    ['Deals submitted', '17,845', 'Through Dec. 31, 2025', 'CSC via On3', 'HIGH'],
                    ['Deals cleared', '17,321 / $127.21M', 'Same', 'CSC via On3', 'HIGH'],
                    ['Deals rejected', '524 / $14.94M', 'Same', 'ESPN', 'HIGH'],
                    ['Rejection rate (by value)', '~10.5%', 'Same', 'Derived', 'HIGH'],
                    ['Deals in arbitration', '10', 'Same', 'CSC', 'HIGH'],
                    ['Est. basketball-only 3P market', '$500M+', '2025', 'nil-ncaa.com', 'MEDIUM'],
                    ['Past collective deals that would fail', '~70%', '2025', 'Sportico', 'MEDIUM'],
                    ['Public company deals that would pass', '90%+', '2025', 'nil-ncaa.com', 'MEDIUM'],
                    ['Resolved within 24 hours', '52%', 'Cumulative', 'CSC', 'HIGH'],
                    ['Resolved within 7 days', '73%', 'Cumulative', 'CSC', 'HIGH'],
                  ]}
                />

                <P>
                  The compliance gap is the table&rsquo;s most important finding. The $127 million cleared through NIL Go represents a fraction of the estimated third-party NIL market &mdash; the basketball market alone is estimated at $500 million. In late 2025, the CSC revised its &ldquo;valid business purpose&rdquo; guidance to avoid returning to court, expanding interpretive room for collective-related deals. The denial-rate split creates channel substitution pressure: market participants do not stop spending; they restructure spending to pass through channels that clear review.
                </P>

                {/* ── 5. Gender ─────────────────────────────────────── */}
                <SectionHeading id="gender">
                  V. The Gender Equation &mdash; Title IX Meets the Market
                </SectionHeading>
                <P drop>
                  NIL was supposed to be the great equalizer. The market decided otherwise. Through 2024, approximately 73.5% of all NIL compensation flowed to male athletes (Opendorse data; Rukstalis, 2023). Among collective-distributed funds, less than 3.5% went to women (Opendorse, 2024). Only nine women appeared among the top 100 NIL earners (On3, 2025). Men&rsquo;s basketball players in major conferences averaged $171,272 in NIL compensation in 2024; women&rsquo;s basketball players averaged $16,222 &mdash; a 10.6:1 ratio (LeRoy, 2025).
                </P>

                <DataTable
                  caption="Table 4: Gender Distribution of NIL Compensation"
                  headers={['Metric', 'Male Athletes', 'Female Athletes', 'Source', 'Confidence']}
                  rows={[
                    ['Share of total NIL compensation', '~74%', '~26%', 'Rukstalis (2023); Opendorse', 'HIGH'],
                    ['Share of collective compensation', '>96.5%', '<3.5%', 'Opendorse Three-Year Report', 'HIGH'],
                    ['NIL deals overall', '57%', '43%', 'SponsorUnited', 'HIGH'],
                    ['Top 100 most-endorsed (deal count)', '48%', '52%', 'SponsorUnited', 'HIGH'],
                    ['ON3 Top 100 NIL rankings', '91', '9', 'On3 (2025)', 'HIGH'],
                    ['Top 150 most-engaging social posts', '25%', '75%', 'SponsorUnited', 'HIGH'],
                    ['Deal growth rate (2022\u201324)', '8% annually', '12% annually', 'Opendorse', 'HIGH'],
                  ]}
                />

                <P>
                  The counterintuitive finding is in the commercial market. SponsorUnited reports men represent 57% of NIL deals and women 43% overall; among the top 100 most-endorsed athletes by deal volume, women represent 52% versus men at 48% (SponsorUnited, 2023). A narrow but important qualification: SponsorUnited measures brand partnership activity (deal volume), not total compensation. Dollar-share claims should be treated as plausible but not independently auditable from the public report alone. Women&rsquo;s basketball surpassed men&rsquo;s basketball in total commercial NIL activity share for the first time in Year 3: 10.2% versus 8.6% (Opendorse NIL at 3, 2024).
                </P>
                <BlockQuote>
                  The commercial market is not discriminating against women athletes. Collectives are.
                </BlockQuote>
                <P>
                  Recent peer-reviewed work has sharpened the analysis. Gonzales and Short (2025), in the <em>Journal of Business Venturing Insights</em>, examined the female athlete&rsquo;s dilemma in the NIL era &mdash; the tension between leveraging personal brand and navigating institutional expectations around femininity and appearance. Sailofsky (2025), in the <em>International Review for the Sociology of Sport</em>, explored the contradictions of NIL, gender, and feminism, arguing that the system privileges a narrow mode of feminine self-presentation as the primary path to NIL value for women.
                </P>
                <P>
                  The Title IX collision has produced whiplash rather than clarity. In January 2025, the Biden Department of Education issued a fact sheet declaring school-facilitated compensation constitutes Title IX-covered financial assistance (Bowers, 2025a). Eighteen days after the Trump administration took office, the DOE reversed course. Buzuvis (2025), writing in the <em>Fordham Law Review</em>, concluded that Title IX&rsquo;s equal treatment requirements apply to NIL compensation.
                </P>

                {/* ── 6. Predatory Vehicles ─────────────────────────── */}
                <SectionHeading id="predatory">
                  VI. Predatory Vehicles &mdash; Hedge Funds and Exploitative Contracts
                </SectionHeading>
                <P drop>
                  Big League Advantage, a private fund, provides college athletes with upfront capital in exchange for a percentage of their future professional earnings. A loan carries regulatory protections &mdash; disclosure requirements, usury limits, default provisions. An equity stake in a human being&rsquo;s future labor carries none of those guardrails, because no regulatory framework exists to govern it (Romano, 2023a).
                </P>
                <P>
                  The Gervon Dexter case exposed the terms at their sharpest. While at the University of Florida, Dexter agreed to pay Big League Advantage 15% of his future professional earnings for 25 years in exchange for $436,485. A second-round pick&rsquo;s four-year rookie contract averages roughly $8&ndash;10 million. The return profile resembles venture capital. The difference is that venture capital invests in companies with boards, auditors, and fiduciary obligations. BLA invested in a teenager.
                </P>
                <P>
                  YOKE, a gaming platform, offered student-athletes $20 in endorsement compensation &ldquo;in exchange for extensive rights, most of which are perpetual, royalty-free, and irrevocable&rdquo; (McCarthy, 2022a). Twenty dollars for permanent, unlimited commercial use of an athlete&rsquo;s name, image, and likeness.
                </P>

                {/* ── 7. House v. NCAA ──────────────────────────────── */}
                <SectionHeading id="house">
                  VII. House v. NCAA and the Revenue-Sharing Frontier
                </SectionHeading>
                <P drop>
                  The settlement arrived not as resolution but as architecture. <em>House v. NCAA</em> (2024) produced a $2.8 billion agreement spread across ten years. Judge Claudia Wilken presided &mdash; the same federal judge who oversaw <em>O&rsquo;Bannon</em> and <em>Alston</em>. Revenue sharing under <em>House</em> is opt-in: schools may share up to 22% of average Power 4 revenue &mdash; roughly $20.5 million in 2025&ndash;26, scaling to $32.9 million by 2034&ndash;35 (O&rsquo;Brien, 2025). A permissive cap without a floor means the wealthiest programs use revenue sharing as a recruiting weapon.
                </P>
                <P>
                  Three hundred eleven schools opted in. Fifty-four opted out. The Senate Commerce Committee&rsquo;s analysis quantified the widening gap: revenue differences between Power conference schools and everyone else have increased approximately 600% since 2002 (Senate Commerce Committee, 2025). More than 41 Division I programs have been cut since May 2024, affecting over 1,000 athletes (2aDays, 2025). Seventy-five percent of U.S. Olympians come from collegiate programs.
                </P>
                <P>
                  The post-<em>House</em> system did not end federal interest &mdash; it escalated it. In July 2025, the White House issued an executive order framing NIL as a system-risk issue. As of March 2026, Reuters reported the president called on Congress to address soaring college athletics costs and signaled potential further executive action (Reuters, 2026). The National Conference of State Legislatures published guidance acknowledging that thirty-plus state NIL laws now collide with a federal settlement framework that neither preempts nor harmonizes them (NCSL, 2025).
                </P>

                {/* ── 8. Labor ──────────────────────────────────────── */}
                <SectionHeading id="labor">
                  VIII. The Labor Question &mdash; Athletes as Employees
                </SectionHeading>
                <P drop>
                  The economic argument was settled before the legal one. Economists have long viewed the NCAA as a cartel &mdash; &ldquo;a formal economic agreement among agents or organizations that would normally compete with one another to not compete in some dimension&rdquo; (Humphreys, 2012). Brook and Hellen (2024) found that approximately 25% of men&rsquo;s basketball players are compensated below their marginal revenue product. The median broadcast NIL value for a college football player is $4,739 (Brook, 2025). Even under the <em>House</em> settlement&rsquo;s projected $2.297 billion in total athlete compensation, Division I athletes would receive roughly 12&ndash;13% of total revenue &mdash; far below the ~50% share professional athletes negotiate through collective bargaining.
                </P>
                <P>
                  Peer-reviewed research has begun to quantify NIL&rsquo;s recruiting effects directly. Owens (2025), in <em>Applied Economics</em>, found measurable impacts of NIL contracts on NCAA football recruiting outcomes. Pitts (2025), in the <em>Journal of Sports Economics</em>, documented the immediate impact of NIL on college football recruiting, confirming NIL compensation functions as a recruiting input rather than merely a post-enrollment benefit.
                </P>
                <P>
                  The tax dimension adds complexity. Messina and Messina (2022), in the <em>Journal of Athlete Development and Experience</em>, documented that all NIL income is taxable as self-employment income, subjecting athletes to federal and state income taxes plus self-employment tax. Athletes who fail to properly account for NIL income face IRS penalties and potential eligibility consequences.
                </P>
                <P>
                  In <em>Johnson v. NCAA</em> (2024), the Third Circuit held that college athletes cannot be categorically barred from asserting claims under the Fair Labor Standards Act. Ehrlich and Ternes (2025) identified the structural danger: the athletes may be granted some responsibilities of employment &mdash; tax liability, contractual obligation &mdash; without corresponding protections: minimum wage, workplace safety, collective bargaining, unemployment insurance. Half-measures in labor law do not produce half-outcomes. They produce new categories of vulnerability.
                </P>

                {/* ── 9. Conclusion ─────────────────────────────────── */}
                <SectionHeading id="conclusion">
                  IX. Conclusion &mdash; Transparency as the Minimum Standard
                </SectionHeading>
                <P drop>
                  The $1 billion experiment has run for five years without an audit. NIL money has flowed through collectives structured as nonprofits, hedge fund vehicles marketed to teenagers, and institutional slush funds disguised as academic support &mdash; and no single entity has the authority, the mandate, or the data to determine whether the system is functioning as intended.
                </P>
                <P>
                  The market is real. The question was never whether athletes generate measurable revenue &mdash; the MRP literature demolished that debate years ago. The question was always how compensation would be structured, who would control the architecture, and whether the athletes at the center of the system would have access to the information necessary to make informed decisions about their own economic lives.
                </P>
                <P>
                  A functional system would require mandatory disclosure of all NIL transactions. It would require independent oversight &mdash; regulatory authority vested outside the conferences that generate the revenue. It would require athlete protections against predatory contracts: caps on future-earnings deals, mandatory cooling-off periods, access to independent legal counsel. And it would require Title IX compliance mechanisms that account for revenue sharing &mdash; because a framework that distributes 75% of shared revenue to football and 1.1% to women&rsquo;s basketball does not become gender-equitable simply because the settlement document does not mention gender.
                </P>
                <P>
                  The historical arc bends toward disclosure, but it does not bend on its own. The NCAA&rsquo;s 1950s invention of &ldquo;student-athlete&rdquo; laundered a labor relationship into an educational one. Byers himself recanted. <em>O&rsquo;Bannon</em> cracked the commercial licensing wall. <em>Alston</em> established that the NCAA could not cap benefits without antitrust exposure. <em>House</em> opened the revenue-sharing frontier. Each step eroded the fiction of amateurism &mdash; and each step was resisted by the institutions that profited from the fiction until courts forced the concession. The pattern is consistent across seven decades: the NCAA does not reform voluntarily. It reforms judicially, then claims the reform as its own.
                </P>
                <P>
                  The $1 billion experiment needs an audit. Not a self-audit by the same institutions that invented &ldquo;student-athlete&rdquo; to avoid paying workers&rsquo; compensation. An independent one &mdash; with subpoena power, public reporting requirements, and the authority to follow the money from the booster&rsquo;s checkbook to the athlete&rsquo;s bank account and every intermediary pocket it passes through along the way.
                </P>

                {/* ── Interactive Tools CTA ─────────────────────────── */}
                <div className="my-12 p-6 rounded-sm border border-[var(--bsi-primary)]/20 bg-[var(--bsi-primary)]/[0.04]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--bsi-primary)] mb-3">
                    Explore the Data
                  </p>
                  <p className="text-[var(--bsi-dust)] text-sm leading-relaxed mb-4">
                    The market data, gender equity figures, and collective growth trends from
                    this research are now interactive on BSI.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href="/nil-valuation"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-[var(--bsi-primary)]/10 border border-[var(--bsi-primary)]/30 text-[var(--bsi-primary)] text-sm font-medium hover:bg-[var(--bsi-primary)]/20 transition-colors"
                    >
                      NIL Market Intelligence Dashboard
                      <span className="text-xs opacity-60">&rarr;</span>
                    </a>
                    <a
                      href="/nil-valuation/performance-index"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-white/[0.04] border border-white/10 text-[var(--bsi-dust)] text-sm font-medium hover:bg-white/[0.08] transition-colors"
                    >
                      Calculate a Player&rsquo;s NIL Index
                      <span className="text-xs opacity-60">&rarr;</span>
                    </a>
                  </div>
                </div>

                {/* ── References ────────────────────────────────────── */}
                <SectionHeading id="references">References</SectionHeading>
                <div className="space-y-1.5">
                  <RefSectionLabel>Peer-Reviewed &amp; Academic Sources</RefSectionLabel>
                  <Ref>Agha, N., Berri, D., Brook, S., &amp; Paulson, C. (2024). Exploitation in college sports: No longer just a &ldquo;man&rsquo;s game.&rdquo; <em>Journal of Sports Economics</em>, <em>25</em>(8). <RefDoi href="https://doi.org/10.1177/15270025241279530">https://doi.org/10.1177/15270025241279530</RefDoi></Ref>
                  <Ref>Barry, C. T., Moran-Miller, K., Levy, H. F., &amp; Gray, T. (2024). Social media engagement, perceptions of social media costs and benefits, and well-being in college student-athletes. <em>Journal of American College Health</em>. <RefDoi href="https://doi.org/10.1080/07448481.2022.2142797">https://doi.org/10.1080/07448481.2022.2142797</RefDoi></Ref>
                  <Ref>Bowers, B. (2025a). Gain insight into potential implications of Title IX&rsquo;s intersection with NIL. <em>Campus Legal Advisor</em>, <em>25</em>(7), 1&ndash;6. <RefDoi href="https://doi.org/10.1002/cala.41549">https://doi.org/10.1002/cala.41549</RefDoi></Ref>
                  <Ref>Bowers, B. (2025b). Gain insight into potential implications of Title IX&rsquo;s intersection with NIL. <em>College Athletics and the Law</em>, <em>21</em>(11), 1&ndash;11. <RefDoi href="https://doi.org/10.1002/catl.31417">https://doi.org/10.1002/catl.31417</RefDoi></Ref>
                  <Ref>Brook, S. L. (2025). Compensating college football players for their name, image, and likeness rights from live college football broadcasts. <em>Managerial and Decision Economics</em>, <em>46</em>(4), 2381&ndash;2387. <RefDoi href="https://doi.org/10.1002/mde.4465">https://doi.org/10.1002/mde.4465</RefDoi></Ref>
                  <Ref>Brook, S. L., &amp; Hellen, M. (2024). Are men&rsquo;s and women&rsquo;s college basketball players &ldquo;Pigouvian&rdquo; exploited? <em>Managerial and Decision Economics</em>, <em>45</em>(7), 4753&ndash;4762. <RefDoi href="https://doi.org/10.1002/mde.4288">https://doi.org/10.1002/mde.4288</RefDoi></Ref>
                  <Ref>Buzuvis, E. (2025). Title IX and athlete compensation in the postamateurism era. <em>Fordham Law Review</em>, <em>93</em>, 1579&ndash;1601.</Ref>
                  <Ref>Byers, W., &amp; Hammer, C. (1995). <em>Unsportsmanlike conduct: Exploiting college athletes</em>. University of Michigan Press.</Ref>
                  <Ref>Colvin, R., &amp; Jansa, J. M. (2023). Athletic competition between the states. <em>Policy Studies Journal</em>, <em>52</em>(2), 451&ndash;468. <RefDoi href="https://doi.org/10.1111/psj.12522">https://doi.org/10.1111/psj.12522</RefDoi></Ref>
                  <Ref>Ehrlich, S. C., &amp; Ternes, N. C. (2025). The paradox of &ldquo;non-union unions.&rdquo; <em>American Business Law Journal</em>, <em>62</em>(2), 95&ndash;115. <RefDoi href="https://doi.org/10.1111/ablj.12258">https://doi.org/10.1111/ablj.12258</RefDoi></Ref>
                  <Ref>Gayles, J. G., &amp; Blanchard, J. (2018). Playing outside the lines. <em>New Directions for Student Services</em>, <em>2018</em>(163), 23&ndash;32. <RefDoi href="https://doi.org/10.1002/ss.20267">https://doi.org/10.1002/ss.20267</RefDoi></Ref>
                  <Ref>Gonzales, M. C., &amp; Short, J. C. (2025). The female athlete&rsquo;s dilemma in the age of name, image, and likeness. <em>Journal of Business Venturing Insights</em>, <em>24</em>, e00561. <RefDoi href="https://doi.org/10.1016/j.jbvi.2025.e00561">https://doi.org/10.1016/j.jbvi.2025.e00561</RefDoi></Ref>
                  <Ref>Hollabaugh, W. L., Jeckell, A. S., &amp; Diamond, A. B. (2024). Name, image, and likeness and the health of the young athlete. <em>Sports Health</em>, <em>16</em>(2), 209&ndash;212. <RefDoi href="https://doi.org/10.1177/19417381231212645">https://doi.org/10.1177/19417381231212645</RefDoi></Ref>
                  <Ref>Humphreys, B. R. (2012). NCAA rule infractions. <em>Criminology &amp; Public Policy</em>, <em>11</em>(4), 707&ndash;712. <RefDoi href="https://doi.org/10.1111/j.1745-9133.2012.00848.x">https://doi.org/10.1111/j.1745-9133.2012.00848.x</RefDoi></Ref>
                  <Ref>LeRoy, M. H. (2025). NCAA women athletes and NIL pay disparities. <em>University of Cincinnati Law Review</em>, <em>93</em>(4), 979.</Ref>
                  <Ref>Li, I., &amp; Derdenger, T. (2025). Does personalized pricing increase competition? <em>Management Science</em>. <RefDoi href="https://doi.org/10.1287/mnsc.2024.06423">https://doi.org/10.1287/mnsc.2024.06423</RefDoi></Ref>
                  <Ref>McCarthy, C. (2022a). NIL collectives could trigger Title IX scrutiny. <em>College Athletics and the Law</em>, <em>19</em>(3), 6&ndash;8. <RefDoi href="https://doi.org/10.1002/catl.31040">https://doi.org/10.1002/catl.31040</RefDoi></Ref>
                  <Ref>McFarland, C., Groothuis, P. A., &amp; Guignet, D. (2024). The role of football win percentage on college applications. <em>Contemporary Economic Policy</em>, <em>42</em>(3), 474&ndash;482. <RefDoi href="https://doi.org/10.1111/coep.12642">https://doi.org/10.1111/coep.12642</RefDoi></Ref>
                  <Ref>Messina, M., &amp; Messina, F. (2022). A primer on the income tax consequences of the NCAA&rsquo;s NIL earnings for college athletes. <em>Journal of Athlete Development and Experience</em>, <em>4</em>(2), 189&ndash;196. <RefDoi href="https://doi.org/10.25035/jade.04.02.05">https://doi.org/10.25035/jade.04.02.05</RefDoi></Ref>
                  <Ref>O&rsquo;Brien, T. (2025). Gain insight into House settlement&rsquo;s impact on college athletics. <em>College Athletics and the Law</em>, <em>22</em>(4), 1&ndash;5. <RefDoi href="https://doi.org/10.1002/catl.31473">https://doi.org/10.1002/catl.31473</RefDoi></Ref>
                  <Ref>Owens, M. F. (2025). The impact of name, image, and likeness contracts on NCAA football recruiting outcomes. <em>Applied Economics</em>. <RefDoi href="https://doi.org/10.1080/00036846.2024.2331425">https://doi.org/10.1080/00036846.2024.2331425</RefDoi></Ref>
                  <Ref>Pitts, J. D. (2025). Show me the money! The immediate impact of NIL on college football recruiting. <em>Journal of Sports Economics</em>. <RefDoi href="https://doi.org/10.1177/15270025241301021">https://doi.org/10.1177/15270025241301021</RefDoi></Ref>
                  <Ref>Romano, R. J. (2021). Consider insights into NCAA&rsquo;s latest NIL (in)decision. <em>College Athletics and the Law</em>, <em>18</em>(5), 8. <RefDoi href="https://doi.org/10.1002/catl.30907">https://doi.org/10.1002/catl.30907</RefDoi></Ref>
                  <Ref>Romano, R. J. (2023a). Shed light on potential risks of signing NIL agreements with hedge fund companies. <em>College Athletics and the Law</em>, <em>20</em>(9), 8. <RefDoi href="https://doi.org/10.1002/catl.31255">https://doi.org/10.1002/catl.31255</RefDoi></Ref>
                  <Ref>Romano, R. J. (2023b). Reevaluate tax status of NIL collectives. <em>College Athletics and the Law</em>, <em>20</em>(6), 8. <RefDoi href="https://doi.org/10.1002/catl.31219">https://doi.org/10.1002/catl.31219</RefDoi></Ref>
                  <Ref>Rukstalis, L. (2023). Changing the game: The emergence of NIL contracts in collegiate athletics and the continued efficacy of Title IX. <em>Washington and Lee Journal of Civil Rights and Social Justice</em>, <em>29</em>(4).</Ref>
                  <Ref>Sailofsky, D. (2025). The privilege to do it all? Exploring the contradictions of NIL, gender and feminism. <em>International Review for the Sociology of Sport</em>. <RefDoi href="https://doi.org/10.1177/10126902241268278">https://doi.org/10.1177/10126902241268278</RefDoi></Ref>
                  <Ref>Smith, R. A. (2011). <em>Pay for play: A history of big-time college athletic reform</em>. University of Illinois Press.</Ref>

                  <RefSectionLabel>Industry &amp; Government Sources</RefSectionLabel>
                  <Ref>2aDays. (2025). College sports cuts 2025: A year of reckoning.</Ref>
                  <Ref>247Sports. (2025). College football NIL collective leaders for 2025.</Ref>
                  <Ref>Baseball America. (2025). College baseball NIL: What are the largest deals?</Ref>
                  <Ref>CBS Sports. (2025). Texas A&amp;M NIL figures nearly tripled from 2024.</Ref>
                  <Ref>Front Office Sports. (2025). NIL collectives paid college athletes $20 million on Monday.</Ref>
                  <Ref>National Conference of State Legislatures. (2025). What the NCAA settlement means for colleges and state legislatures.</Ref>
                  <Ref>nil-ncaa.com. (2025). NCAA revenue sharing &amp; NIL estimates 2025.</Ref>
                  <Ref>Opendorse. (2023). NIL at Two (report).</Ref>
                  <Ref>Opendorse. (2024). NIL at 3: The annual Opendorse report.</Ref>
                  <Ref>Opendorse. (2025). NIL at Four: Monetizing the New Reality (report).</Ref>
                  <Ref>Reuters. (2026, March 6). Trump calls for Congress to fix NIL while promising executive order.</Ref>
                  <Ref>SponsorUnited. (2023). NIL marketing partnerships 2023&ndash;24.</Ref>

                  <RefSectionLabel>Legal Citations</RefSectionLabel>
                  <Ref><em>Dexter v. Big League Advance Fund II, LP</em>, No. 23-cv-228 (N.D. Fla.).</Ref>
                  <Ref><em>House v. NCAA</em>, No. 4:20-cv-03919 (N.D. Cal. 2025).</Ref>
                  <Ref><em>Johnson v. NCAA</em>, No. 23-1900 (3d Cir. 2024).</Ref>
                  <Ref><em>NCAA v. Alston</em>, 594 U.S. 69 (2021).</Ref>
                  <Ref><em>NCAA v. Board of Regents of the University of Oklahoma</em>, 468 U.S. 85 (1984).</Ref>
                  <Ref><em>O&rsquo;Bannon v. NCAA</em>, 802 F.3d 1049 (9th Cir. 2015).</Ref>
                </div>

                {/* ── Footer attribution ─────────────────────────── */}
                <div className="mt-20 pt-8 border-t border-border/30">
                  <div className="flex items-start gap-4">
                    <div className="w-[3px] h-12 rounded-full bg-[var(--bsi-primary)]/30 shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-[var(--bsi-dust)] font-medium">
                        Austin Humphrey
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(196,184,165,0.35)]/50 mt-1">
                        BSI Research Division &middot; March 2026
                      </p>
                      <p className="text-xs text-[rgba(196,184,165,0.35)]/40 mt-3 max-w-xl leading-relaxed">
                        This analysis was produced by Blaze Sports Intel for publication on blazesportsintel.com.
                        All citations are to peer-reviewed or publicly verifiable sources. No fabricated statistics.
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
