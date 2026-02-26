import { Badge } from '@/components/ui/Badge';

type Tier = 'Omaha Favorite' | 'Contender' | 'Dark Horse' | 'Bubble' | 'Sleeper' | 'Rebuilding';

const tierStyles: Record<Tier, string> = {
  'Omaha Favorite': 'bg-[#C9A227]/20 text-[#C9A227] border-[#C9A227]/30',
  Contender: 'bg-[#BF5700]/20 text-[#FF6B35] border-[#BF5700]/30',
  'Dark Horse': 'bg-surface text-text-secondary border-border-strong',
  Bubble: 'bg-surface-light text-text-muted border-border',
  Sleeper: 'bg-surface-light text-text-muted border-border',
  Rebuilding: 'bg-surface-light text-text-muted border-border-subtle',
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
    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${style}`}>
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
          <span className="text-text-muted text-sm">{dossier.date}</span>
          <span className="text-text-muted text-sm">{dossier.readTime}</span>
        </div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-text-primary">
              {dossier.name}
            </h1>
            <p className="text-text-muted text-lg">{dossier.mascot}</p>
          </div>
          <div className="text-right shrink-0">
            <TierBadge tier={dossier.tier} />
            <p className="text-text-muted font-mono text-sm mt-2">{dossier.record}</p>
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
              className="bg-surface-light border border-border-subtle rounded-lg p-4"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {item.label}
              </span>
              <p className="text-sm text-text-secondary mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How They Win / How They Lose */}
      <section className="mb-10">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-text-primary mb-4">
          Game Plan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-green-400/70 mb-3">
              How They Win
            </h3>
            <ul className="space-y-2">
              {dossier.howTheyWin.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-text-muted leading-relaxed">
                  <span className="text-green-400/50 mt-1 shrink-0">+</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-400/70 mb-3">
              How They Lose
            </h3>
            <ul className="space-y-2">
              {dossier.howTheyLose.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-text-muted leading-relaxed">
                  <span className="text-red-400/50 mt-1 shrink-0">-</span>
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
          <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-text-primary mb-4">
            Key Players
          </h2>
          <div className="space-y-3">
            {dossier.keyPlayers.map((player) => (
              <div
                key={player.name}
                className="bg-surface-light border border-border-subtle rounded-lg p-4 flex items-start justify-between gap-4"
              >
                <div>
                  <span className="font-display text-sm font-bold text-text-primary uppercase">
                    {player.name}
                  </span>
                  <p className="text-xs text-text-muted mt-0.5">
                    {player.position} &middot; {player.year}
                  </p>
                </div>
                <span className="text-xs font-mono text-text-muted shrink-0">{player.statLine}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Schedule Difficulty */}
      <section className="mb-10">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-text-primary mb-4">
          Schedule Snapshot
        </h2>
        <div className="bg-surface-light border border-border-subtle rounded-xl p-5">
          <p className="text-sm text-text-muted leading-relaxed">{dossier.scheduleDifficulty}</p>
        </div>
      </section>

      {/* Outlook */}
      <section className="mb-10">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-text-primary mb-4">
          BSI Outlook
        </h2>
        <div className="bg-burnt-orange/5 border border-burnt-orange/15 rounded-xl p-5">
          <p className="text-sm text-text-muted leading-relaxed">{dossier.outlook}</p>
        </div>
      </section>
    </article>
  );
}
