import './UpgradeCallouts.css'

function UpgradeCallouts({ recommendations, avgPressure }) {
  if (!recommendations || recommendations.length === 0) {
    return null
  }

  return (
    <section className="upgrade-callouts">
      <header className="upgrade-header">
        <div>
          <h2>Diamond Pro Upgrades</h2>
          <p>Standard over vibes. These modules unlock deeper reads on today&apos;s slate.</p>
        </div>
        <div className="pressure-chip" aria-label="Average leverage across live games">
          Avg leverage: <span>{(avgPressure * 100).toFixed(0)}%</span>
        </div>
      </header>

      <div className="upgrade-grid">
        {recommendations.map((item) => (
          <article key={item.id} className={`upgrade-card ${item.highlight ? 'highlight' : ''}`}>
            <div className="upgrade-heading">
              <h3>{item.title}</h3>
              {item.badge ? <span className="upgrade-badge">{item.badge}</span> : null}
            </div>
            <p className="upgrade-description">{item.description}</p>
            <p className="upgrade-reason">{item.reason}</p>
            <footer className="upgrade-footer">
              <span className="upgrade-tag">Diamond Pro</span>
              <a className="upgrade-link" href="/pricing" aria-label={`View ${item.title} details`}>
                See playbook →
              </a>
            </footer>
          </article>
        ))}
      </div>
    </section>
  )
}

export default UpgradeCallouts
