const experiencePillars = [
  {
    title: 'Thumb-First Navigation',
    body: 'Primary actions sit within 60px of the bottom nav rail. Avoid top-heavy controls that break one-hand use.'
  },
  {
    title: 'Contrast & Clarity',
    body: 'Use di-surface tokens and maintain WCAG 2.2 AA minimums. Gold accents mark interactive states.'
  },
  {
    title: 'Motion With Restraint',
    body: 'Animations stay under 200ms with 0.1 ease-out curves. Only use motion to confirm a user decision.'
  }
];

const specChecklist = [
  'Audit every screen at 375px, 428px, and 1024px breakpoints.',
  'Prefer grid-based cards with 16px gutters over free-form layouts.',
  'Document analytics events for every interactive element touching recruiting or game workflows.',
  'Never log PII in console, network payloads, or analytics metadata.'
];

export default function DeveloperUEPage() {
  return (
    <div className="dev-stack">
      <section className="dev-section" aria-labelledby="ue-standards">
        <span className="dev-badge">UE Doctrine</span>
        <h1 id="ue-standards">Diamond Insights Experience Standards</h1>
        <p className="dev-section__subtitle">
          Build every surface for SEC staffs checking scores on the bus. Dark backgrounds, fast loads, ruthless clarity.
        </p>
      </section>

      <section className="dev-section" aria-labelledby="experience-pillars">
        <h2 id="experience-pillars">Pillars</h2>
        <div className="dev-grid">
          {experiencePillars.map((pillar) => (
            <article key={pillar.title} className="dev-card">
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dev-section" aria-labelledby="ue-checklist">
        <h2 id="ue-checklist">Ship Checklist</h2>
        <ul className="dev-list">
          {specChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
