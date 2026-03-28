import { Badge } from '@/components/ui/Badge';

type Tier = 'Omaha Favorite' | 'Contender' | 'Dark Horse' | 'Bubble' | 'Sleeper' | 'Rebuilding';

const tierStyles: Record<Tier, string> = {
  'Omaha Favorite': 'bg-[#C9A227]/20 text-[#C9A227] border-[#C9A227]/30',
  Contender: 'bg-[var(--bsi-primary)]/20 text-ember border-[var(--bsi-primary)]/30',
  'Dark Horse': 'bg-surface text-[var(--bsi-dust)] border-[rgba(140,98,57,0.5)]',
  Bubble: 'bg-[var(--surface-press-box)] text-[rgba(196,184,165,0.35)] border-border',
  Sleeper: 'bg-[var(--surface-press-box)] text-[rgba(196,184,165,0.35)] border-border',
  Rebuilding: 'bg-[var(--surface-press-box)] text-[rgba(196,184,165,0.35)] border-[var(--border-vintage)]',
};

interface KeyPlayer {
  name: string;
  position: string;
  year: string;
  statLine: string;
}

interface TeamDossierData {
  slug: string;
  name: string;
  mascot: string;
  conference: string;
  record: string;
  tier: Tier;
  sport: string;
  date: string;
  readTime: string;
  runEnvironment: string;
  pitchingProfile: string;
  handednessSplit: string;
  howTheyWin: string[];
  howTheyLose: string[];
  keyPlayers: KeyPlayer[];
  scheduleDifficulty: string;
  outlook: string;
}

export type { TeamDossierData };

function TierBadge({ tier }: { tier: string }) {
  const style = tierStyles[tier as Tier] || tierStyles.Bubble;
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider border ${style}`}>
      {tier}
    </span>
  );
}

/**
 * TeamDossier — structured team analysis template.
 * Sections: identity, how they win/lose, key players, schedule difficulty, projection.
 */
export function TeamDossier({ dossier }: { dossier: TeamDossierData }) {
  return (
    <article className="max-w-3xl">
      {/* Identity Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="primary">{dossier.conference}</Badge>
          <span className="text-[rgba(196,184,165,0.35)] text-sm">{dossier.date}</span>
          <span className="text-[rgba(196,184,165,0.35)] text-sm">{dossier.readTime}</span>
        </div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-[var(--bsi-bone)]">
              {dossier.name}
            </h1>
            <p className="text-[rgba(196,184,165,0.35)] text-lg">{dossier.mascot}</p>
          </div>
          <div className="text-right shrink-0">
            <TierBadge tier={dossier.tier} />
            <p className="text-[rgba(196,184,165,0.35)] font-mono text-sm mt-2">{dossier.record}</p>
          </div>
        </div>

        {/* Identity Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Run Environment', value: dossier.runEnvironment },
            { label: 'Pitching Profile', value: dossier.pitchingProfile },
            { label: 'Handedness Split', value: dossier.handednessSplit },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-[var(--surface-press-box)] border border-[var(--border-vintage)] rounded-sm p-4"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-[rgba(196,184,165,0.35)]">
                {item.label}
              </span>
              <p className="text-sm text-[var(--bsi-dust)] mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How They Win / How They Lose */}
      <section className="mb-10">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-[var(--bsi-bone)] mb-4">
          Game Plan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--bsi-success)]/5 border border-[var(--bsi-success)]/10 rounded-sm p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--bsi-success)]/70 mb-3">
              How They Win
            </h3>
            <ul className="space-y-2">
              {dossier.howTheyWin.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-[rgba(196,184,165,0.35)] leading-relaxed">
                  <span className="text-[var(--bsi-success)]/50 mt-1 shrink-0">+</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[var(--bsi-danger)]/5 border border-[var(--bsi-danger)]/10 rounded-sm p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--bsi-danger)]/70 mb-3">
              How They Lose
            </h3>
            <ul className="space-y-2">
              {dossier.howTheyLose.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-[rgba(196,184,165,0.35)] leading-relaxed">
                  <span className="text-[var(--bsi-danger)]/50 mt-1 shrink-0">-</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Key Players */}
      {dossier.keyPlayers.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-[var(--bsi-bone)] mb-4">
            Key Players
          </h2>
          <div className="space-y-3">
            {dossier.keyPlayers.map((player) => (
              <div
                key={player.name}
                className="bg-[var(--surface-press-box)] border border-[var(--border-vintage)] rounded-sm p-4 flex items-start justify-between gap-4"
              >
                <div>
                  <span className="font-display text-sm font-bold text-[var(--bsi-bone)] uppercase">
                    {player.name}
                  </span>
                  <p className="text-xs text-[rgba(196,184,165,0.35)] mt-0.5">
                    {player.position} &middot; {player.year}
                  </p>
                </div>
                <span className="text-xs font-mono text-[rgba(196,184,165,0.35)] shrink-0">{player.statLine}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Schedule Difficulty */}
      <section className="mb-10">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-[var(--bsi-bone)] mb-4">
          Schedule Snapshot
        </h2>
        <div className="bg-[var(--surface-press-box)] border border-[var(--border-vintage)] rounded-sm p-5">
          <p className="text-sm text-[rgba(196,184,165,0.35)] leading-relaxed">{dossier.scheduleDifficulty}</p>
        </div>
      </section>

      {/* Outlook */}
      <section className="mb-10">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-[var(--bsi-bone)] mb-4">
          BSI Outlook
        </h2>
        <div className="bg-[var(--bsi-primary)]/5 border border-[var(--bsi-primary)]/15 rounded-sm p-5">
          <p className="text-sm text-[rgba(196,184,165,0.35)] leading-relaxed">{dossier.outlook}</p>
        </div>
      </section>
    </article>
  );
}
