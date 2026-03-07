'use client';

interface BracketSlot {
  label: string;
  seed: string;
  team?: string;
}

interface BracketRound {
  title: string;
  date: string;
  slots: [BracketSlot, BracketSlot];
}

const QF_ROUNDS: BracketRound[] = [
  {
    title: 'QF 1',
    date: 'Mar 13 · Miami',
    slots: [
      { label: 'Pool A Winner', seed: 'A1', team: 'TBD' },
      { label: 'Pool D Runner-Up', seed: 'D2', team: 'TBD' },
    ],
  },
  {
    title: 'QF 2',
    date: 'Mar 13 · Miami',
    slots: [
      { label: 'Pool D Winner', seed: 'D1', team: 'TBD' },
      { label: 'Pool A Runner-Up', seed: 'A2', team: 'TBD' },
    ],
  },
  {
    title: 'QF 3',
    date: 'Mar 14 · Miami',
    slots: [
      { label: 'Pool B Winner', seed: 'B1', team: 'TBD' },
      { label: 'Pool C Runner-Up', seed: 'C2', team: 'TBD' },
    ],
  },
  {
    title: 'QF 4',
    date: 'Mar 14 · Miami',
    slots: [
      { label: 'Pool C Winner', seed: 'C1', team: 'TBD' },
      { label: 'Pool B Runner-Up', seed: 'B2', team: 'TBD' },
    ],
  },
];

function MatchupCard({ round }: { round: BracketRound }) {
  return (
    <div className="bg-surface-light/20 border border-border-subtle rounded-xl p-4">
      <div className="text-xs text-burnt-orange font-semibold mb-1">{round.title}</div>
      <div className="text-text-muted text-xs mb-3">{round.date}</div>
      <div className="space-y-2">
        {round.slots.map((slot) => (
          <div key={slot.seed} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-text-muted bg-surface-light px-1.5 py-0.5 rounded">
                {slot.seed}
              </span>
              <span className="text-text-secondary text-sm">{slot.label}</span>
            </div>
            <span className="text-text-muted text-xs italic">{slot.team}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TournamentBracket() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-text-primary">
          Tournament Bracket
        </h2>
        <p className="text-text-muted text-sm mt-1">
          All knockout rounds at LoanDepot Park, Miami · Mar 13–17
        </p>
      </div>

      {/* Pool play → QF routing diagram */}
      <div className="mb-8 p-4 sm:p-6 rounded-xl border border-border-subtle bg-surface-light/10">
        <div className="text-xs text-text-muted mb-4 uppercase tracking-wider font-semibold">Advancement Routing</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="font-semibold text-text-primary mb-1">Pool A</div>
            <div className="text-text-muted text-xs">San Juan</div>
            <div className="mt-2 space-y-1">
              <div className="text-[11px] px-2 py-0.5 bg-burnt-orange/10 rounded text-burnt-orange">A1 → QF 1</div>
              <div className="text-[11px] px-2 py-0.5 bg-burnt-orange/10 rounded text-burnt-orange">A2 → QF 2</div>
            </div>
          </div>
          <div>
            <div className="font-semibold text-text-primary mb-1">Pool B</div>
            <div className="text-text-muted text-xs">Houston</div>
            <div className="mt-2 space-y-1">
              <div className="text-[11px] px-2 py-0.5 bg-ember/10 rounded text-ember">B1 → QF 3</div>
              <div className="text-[11px] px-2 py-0.5 bg-ember/10 rounded text-ember">B2 → QF 4</div>
            </div>
          </div>
          <div>
            <div className="font-semibold text-text-primary mb-1">Pool C</div>
            <div className="text-text-muted text-xs">Tokyo</div>
            <div className="mt-2 space-y-1">
              <div className="text-[11px] px-2 py-0.5 bg-ember/10 rounded text-ember">C1 → QF 4</div>
              <div className="text-[11px] px-2 py-0.5 bg-ember/10 rounded text-ember">C2 → QF 3</div>
            </div>
          </div>
          <div>
            <div className="font-semibold text-text-primary mb-1">Pool D</div>
            <div className="text-text-muted text-xs">Miami</div>
            <div className="mt-2 space-y-1">
              <div className="text-[11px] px-2 py-0.5 bg-burnt-orange/10 rounded text-burnt-orange">D1 → QF 2</div>
              <div className="text-[11px] px-2 py-0.5 bg-burnt-orange/10 rounded text-burnt-orange">D2 → QF 1</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quarterfinals */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Quarterfinals</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QF_ROUNDS.map((round) => (
            <MatchupCard key={round.title} round={round} />
          ))}
        </div>
      </div>

      {/* Semifinals + Final */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Semifinals</h3>
          <div className="space-y-4">
            {[{ title: 'SF 1', date: 'Mar 15 · Miami', qf: 'QF1 winner vs QF2 winner' }, { title: 'SF 2', date: 'Mar 16 · Miami', qf: 'QF3 winner vs QF4 winner' }].map((sf) => (
              <div key={sf.title} className="bg-surface-light/20 border border-border-subtle rounded-xl p-4">
                <div className="text-xs text-burnt-orange font-semibold mb-1">{sf.title}</div>
                <div className="text-text-muted text-xs mb-2">{sf.date}</div>
                <div className="text-text-secondary text-sm italic">{sf.qf}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Championship</h3>
          <div className="bg-gradient-to-br from-burnt-orange/15 to-ember/5 border border-burnt-orange/30 rounded-xl p-6 h-full flex flex-col justify-center">
            <div className="text-center">
              <div className="text-xs text-burnt-orange font-bold uppercase tracking-wider mb-2">WBC Final</div>
              <div className="text-text-muted text-sm mb-2">March 17, 2026</div>
              <div className="text-text-secondary text-sm mb-3">LoanDepot Park, Miami</div>
              <div className="text-2xl font-bold text-text-primary font-display uppercase tracking-wide">
                SF1 Winner
              </div>
              <div className="text-text-muted text-sm my-2">vs</div>
              <div className="text-2xl font-bold text-text-primary font-display uppercase tracking-wide">
                SF2 Winner
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-text-muted text-xs mt-4 pt-3 border-t border-border-subtle">
        Bracket updates as pool play results are finalized · All times CT
      </p>
    </div>
  );
}
