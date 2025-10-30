import PropTypes from 'prop-types'

const SectionHeader = ({ title, subtitle }) => (
  <header className="branch-highlights__section-header">
    <h2>{title}</h2>
    {subtitle ? <p>{subtitle}</p> : null}
  </header>
)

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string
}

const HighlightCard = ({ label, title, description, meta }) => (
  <article className="highlight-card">
    <span className="highlight-card__label">{label}</span>
    <h3>{title}</h3>
    <p>{description}</p>
    {meta ? (
      <dl className="highlight-card__meta">
        {meta.map((item) => (
          <div key={item.term} className="highlight-card__meta-item">
            <dt>{item.term}</dt>
            <dd>{item.definition}</dd>
          </div>
        ))}
      </dl>
    ) : null}
  </article>
)

HighlightCard.propTypes = {
  label: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  meta: PropTypes.arrayOf(
    PropTypes.shape({
      term: PropTypes.string.isRequired,
      definition: PropTypes.string.isRequired
    })
  )
}

const uniqueProperties = [
  {
    label: 'Unique Edge',
    title: 'Mobile-first live scoreboard tuned for 60s refresh',
    description:
      'Optimized polling cadence, dark-mode UI, and on-card status chips keep live data fresh without hammering the ESPN feed.',
    meta: [
      { term: 'Refresh cadence', definition: '60 seconds (configurable)' },
      { term: 'Design', definition: 'Dark-mode, phone-first grid' }
    ]
  },
  {
    label: 'Unique Edge',
    title: 'ESPN event normalization pipeline',
    description:
      'Maps ESPN events into Blaze-standard game objects so every downstream module sees consistent keys, records, and rankings.',
    meta: [
      { term: 'Normalizer', definition: 'mapEspnEventsToGames()' },
      { term: 'Buckets', definition: 'Live, On Deck, Finals' }
    ]
  },
  {
    label: 'Unique Edge',
    title: 'Sport-aware floating switcher',
    description:
      'SportSwitcher FAB respects the active sport, paving the way for softball and summer wood-bat ladders without rewriting navigation.',
    meta: [
      { term: 'Current sport', definition: 'College baseball' },
      { term: 'Extensibility', definition: 'Future multi-sport ready' }
    ]
  }
]

const upgradePath = [
  {
    label: 'Upgrade Path',
    title: 'Diamond Pro notifications',
    description:
      'Stripe-gated push alerts for scoring plays, pitching changes, and RPI swings with 1-minute SLA on live queues.',
    meta: [
      { term: 'Status', definition: 'In design' },
      { term: 'Stack', definition: 'Clerk auth + Upstash fan-out' }
    ]
  },
  {
    label: 'Upgrade Path',
    title: 'In-game win expectancy modeling',
    description:
      'Hook Monte Carlo engine to live pitch counts to project win probability charts directly inside each GameCard.',
    meta: [
      { term: 'Data', definition: 'Pitch-by-pitch ingest worker' },
      { term: 'Target', definition: 'Launch by SEC play' }
    ]
  },
  {
    label: 'Upgrade Path',
    title: 'Player match-up overlays',
    description:
      'Surface platoon splits and Stuff+ deltas on hover so scouts spot matchup edges before the next AB.',
    meta: [
      { term: 'Access', definition: 'Diamond Pro exclusive' },
      { term: 'Data source', definition: 'Prisma + historical splits' }
    ]
  }
]

const BranchHighlights = ({ className = '' }) => (
  <section className={`branch-highlights ${className}`.trim()}>
    <SectionHeader
      title="Why this branch matters"
      subtitle="Inventory the differentiators we ship today and the next set of premium upgrades on deck."
    />

    <div className="branch-highlights__grid" aria-label="Unique properties">
      {uniqueProperties.map((item) => (
        <HighlightCard key={item.title} {...item} />
      ))}
    </div>

    <SectionHeader
      title="Upgrades already scoped"
      subtitle="Each item aligns with Diamond Pro monetization and keeps refresh latency under a minute."
    />

    <div className="branch-highlights__grid" aria-label="Upgrade path">
      {upgradePath.map((item) => (
        <HighlightCard key={item.title} {...item} />
      ))}
    </div>
  </section>
)

BranchHighlights.propTypes = {
  className: PropTypes.string
}

export default BranchHighlights
