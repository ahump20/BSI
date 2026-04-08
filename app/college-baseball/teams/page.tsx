import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { preseason2026 } from '@/lib/data/preseason-2026';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';
import {
  COLLEGE_BASEBALL_CONFERENCES,
  normalizeCollegeBaseballConference,
} from '@/lib/data/collegeBaseballConferences';
import { AllTeamsSearch } from './AllTeamsSearch';

export const metadata: Metadata = {
  title: 'College Baseball Teams | Blaze Sports Intel',
  description:
    'Browse all D1 college baseball teams by conference. Complete team profiles, rosters, and analytics.',
  openGraph: {
    title: 'College Baseball Teams | Blaze Sports Intel',
    description: 'Browse all D1 college baseball teams by conference.',
  },
};

interface TeamEntry {
  name: string;
  slug: string;
}

/**
 * Derive conference groups from the canonical teamMetadata registry.
 * Conference order comes from COLLEGE_BASEBALL_CONFERENCES (Power 5 first).
 * Adding a team to teamMetadata automatically adds it to this page.
 */
const conferences: { name: string; fullName: string; teams: TeamEntry[] }[] = (() => {
  const teamsByConf = new Map<string, TeamEntry[]>();

  for (const [slug, meta] of Object.entries(teamMetadata)) {
    const confId = normalizeCollegeBaseballConference(meta.conference);
    if (!confId) continue;
    if (!teamsByConf.has(confId)) teamsByConf.set(confId, []);
    teamsByConf.get(confId)!.push({ name: meta.shortName, slug });
  }

  // Sort teams alphabetically within each conference
  for (const teams of teamsByConf.values()) {
    teams.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Build in COLLEGE_BASEBALL_CONFERENCES order (Power 5 first, then alphabetical)
  return COLLEGE_BASEBALL_CONFERENCES
    .filter((conf) => teamsByConf.has(conf.id))
    .map((conf) => ({
      name: conf.shortName,
      fullName: conf.displayName,
      teams: teamsByConf.get(conf.id)!,
    }));
})();

function TeamCard({ team }: { team: TeamEntry }) {
  const meta = teamMetadata[team.slug];
  const preseason = preseason2026[team.slug];
  const logoUrl = meta ? getLogoUrl(meta.espnId, meta.logoId) : null;
  const teamColor = meta?.colors?.primary ?? 'var(--bsi-primary)';

  return (
    <Link
      href={`/college-baseball/teams/${team.slug}`}
      className="group block rounded-sm border transition-all duration-200 overflow-hidden"
      style={{
        borderColor: 'var(--border-vintage)',
        background: 'var(--surface-dugout)',
      }}
    >
      {/* Team color accent strip */}
      <div className="h-[3px] transition-opacity duration-200 opacity-40 group-hover:opacity-100" style={{ background: teamColor }} />

      <div className="flex flex-col items-center gap-2 px-2 py-3">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={`${team.name} logo`}
            width={56}
            height={56}
            className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-transform duration-200 group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        )}
        <span
          className="font-medium text-[11px] text-center leading-tight"
          style={{ fontFamily: 'var(--font-oswald)', color: 'var(--bsi-bone)' }}
        >
          {team.name}
        </span>
        {preseason && (
          <span
            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm"
            style={{ background: `${teamColor}22`, color: teamColor, border: `1px solid ${teamColor}33` }}
          >
            #{preseason.rank}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function TeamsPage() {
  return (
    <>
      <div>
        {/* ── Hero band with R2 stadium atmosphere ── */}
        <section
          className="relative overflow-hidden"
          style={{ borderBottom: '1px solid var(--border-vintage)' }}
        >
          {/* R2 stadium background */}
          <img
            src="/api/assets/images/blaze-stadium-hero.png"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ opacity: 0.15 }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, rgba(10,10,10,0.6) 0%, rgba(10,10,10,0.4) 50%, var(--surface-scoreboard) 100%)`,
            }}
          />
          <div className="absolute inset-0 pointer-events-none grain-overlay" style={{ opacity: 0.3 }} />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-8">
            <Breadcrumb
              className="mb-4"
              items={[
                { label: 'Home', href: '/' },
                { label: 'College Baseball', href: '/college-baseball' },
                { label: 'Teams' },
              ]}
            />
            <ScrollReveal direction="up">
              <div className="text-center">
                <span
                  className="inline-block text-[10px] font-bold uppercase tracking-[0.15em] px-2 py-1 rounded-sm mb-4"
                  style={{
                    fontFamily: 'var(--font-oswald, var(--font-display))',
                    color: 'var(--bsi-primary)',
                    background: 'rgba(191,87,0,0.1)',
                    border: '1px solid rgba(191,87,0,0.2)',
                  }}
                >
                  2026 Season
                </span>
                <h1
                  className="text-3xl md:text-4xl font-bold uppercase tracking-[0.1em] mb-3"
                  style={{ fontFamily: 'var(--font-bebas, var(--font-hero))', color: 'var(--bsi-bone)' }}
                >
                  College Baseball Teams
                </h1>
                <p
                  className="text-sm max-w-lg mx-auto"
                  style={{ fontFamily: 'var(--font-cormorant, serif)', color: 'var(--bsi-dust)', fontStyle: 'italic' }}
                >
                  {Object.keys(teamMetadata).length} programs across {conferences.length} conferences.
                  Every team has a profile with roster, schedule, and analytics.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── Teams directory ── */}
        <Section padding="lg">
          <Container>
            {/* Client-side searchable team browser */}
            <AllTeamsSearch />

            <div className="space-y-10">
              {conferences.map((conference, confIndex) => (
                <ScrollReveal key={conference.name} direction="up" delay={confIndex * 40}>
                  <div
                    className="rounded-sm border overflow-hidden"
                    style={{ borderColor: 'var(--border-vintage)', background: 'var(--surface-scoreboard)' }}
                  >
                    {/* Conference header — Heritage stamp pattern */}
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: '1px solid var(--border-vintage)', background: 'var(--surface-press-box)' }}
                    >
                      <div className="flex items-center gap-3">
                        <h2
                          className="text-sm font-bold uppercase tracking-[0.12em]"
                          style={{ fontFamily: 'var(--font-oswald, var(--font-display))', color: 'var(--bsi-primary)' }}
                        >
                          {conference.name}
                        </h2>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--bsi-dust)' }}>
                          {conference.fullName}
                        </span>
                      </div>
                      <span
                        className="text-[9px] font-mono tabular-nums"
                        style={{ color: 'rgba(196,184,165,0.5)' }}
                      >
                        {conference.teams.length} teams
                      </span>
                    </div>

                    {/* Team grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4">
                      {conference.teams.map((team) => (
                        <TeamCard key={team.slug} team={team} />
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal direction="up" delay={300}>
              <div className="mt-16 text-center">
                <p className="text-text-tertiary text-sm">
                  {Object.keys(teamMetadata).length} D1 programs across {conferences.length} conferences. Every team in the registry gets a profile page.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
