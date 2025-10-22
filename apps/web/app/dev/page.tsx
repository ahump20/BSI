import Link from 'next/link';
import DeveloperModePanel from '../../components/DeveloperModePanel';

const devNavigation = [
  {
    href: '/dev/ue',
    title: 'UE Standards',
    description: 'Interaction models, typography, and motion principles for Diamond Insights.'
  },
  {
    href: '/dev/labs',
    title: 'Labs',
    description: 'GPU prototypes, worker experiments, and unreleased tooling for staff engineers.'
  }
];

const telemetryNotes = [
  {
    heading: 'Observability',
    body: 'Runtime events are piped through Datadog RUM + Edge logs. Use route_render events for page timing.'
  },
  {
    heading: 'Error Budgets',
    body: 'UI regressions trigger PagerDuty when diamond-engine p99 > 200ms for two consecutive intervals.'
  },
  {
    heading: 'Access Control',
    body: 'Developer Mode content requires authenticated staff accounts once Clerk hooks land.'
  }
];

export default function DeveloperHomePage() {
  return (
    <div className="dev-stack">
      <section className="dev-hero" aria-labelledby="developer-mode-hero">
        <div>
          <p className="dev-hero__eyebrow">Standard over vibes</p>
          <h1 id="developer-mode-hero" className="dev-hero__title">
            Developer Mode keeps Diamond Insights sharp
          </h1>
          <p className="dev-hero__subtitle">
            Feature flags, UE doctrine, and labs prototypes live here so every release keeps college baseball coaches ahead of
            the count.
          </p>
        </div>
        <DeveloperModePanel />
      </section>

      <nav className="dev-nav" aria-labelledby="developer-mode-nav">
        <div className="dev-nav__header">
          <h2 id="developer-mode-nav">Developer Surfaces</h2>
          <p>Move between UE specs and labs experiments. Routes stay dark-mode first and mobile-optimized.</p>
        </div>
        <ul className="dev-nav__list">
          {devNavigation.map((item) => (
            <li key={item.href}>
              <Link className="dev-nav__card" href={item.href}>
                <span>{item.title}</span>
                <p>{item.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className="dev-section" aria-labelledby="developer-telemetry">
        <h2 id="developer-telemetry">Operational Telemetry</h2>
        <div className="dev-grid">
          {telemetryNotes.map((note) => (
            <article key={note.heading} className="dev-card">
              <h3>{note.heading}</h3>
              <p>{note.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
