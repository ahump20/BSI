import { useEffect, useRef } from 'react';

const sidebarFacts = [
  { label: 'Born', value: 'August 17, 1995' },
  { label: 'Birthplace', value: 'Memphis, Tennessee' },
  { label: 'Birth Soil', value: 'West Columbia, TX' },
  { label: 'Family in Texas', value: '127+ years' },
  { label: 'Shares Birthday', value: 'Davy Crockett' },
  { label: 'Named After', value: 'Austin, Texas' },
];

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll('.reveal');
    if (!els) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.15 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="origin"
      aria-labelledby="origin-heading"
      className="section-padding section-border"
    >
      <div className="container-custom">
        <div className="reveal">
          <p className="section-label">// The Origin</p>
          <h2 id="origin-heading" className="section-title">
            Born in Memphis. Rooted in Texas Soil.
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Narrative column */}
          <div className="lg:col-span-2 space-y-6 text-bone/90 text-lg leading-relaxed">
            <div className="reveal">
              <p>
                On <strong className="text-bone">August 17, 1995</strong>, I was born in Memphis,
                Tennessee — the same day as <strong className="text-bone">Davy Crockett</strong>,
                the legendary folk hero who famously declared "You may all go to hell,
                and I will go to Texas" before defending the Alamo.
              </p>
            </div>

            <div className="reveal">
              <p>
                But my parents had a plan. They brought{' '}
                <strong className="text-burnt-orange">Texas soil</strong> from{' '}
                <strong className="text-bone">West Columbia</strong> — the birthplace
                of the Republic of Texas, where the first capital stood and Stephen F. Austin's
                vision took root. That soil was placed beneath my mother before I was born.
              </p>
            </div>

            <div className="reveal">
              <blockquote className="border-l-2 border-burnt-orange pl-6 py-4 my-8 text-warm-gray italic text-xl">
                The doctor looked at my parents and said:
                <br />
                <span className="text-burnt-orange font-semibold not-italic">
                  "You know you ain't the first to do this, but they've ALL been from Texas."
                </span>
              </blockquote>
            </div>

            <div className="reveal">
              <p>
                The next day, the <strong className="text-bone">El Campo Leader-News</strong> ran the headline:{' '}
                <span className="font-sans font-bold text-burnt-orange uppercase text-base tracking-wider">
                  "Tennessee Birth Will Be on Texas Soil"
                </span>
              </p>
            </div>

            <div className="reveal">
              <p>
                My grandfather <strong className="text-bone">Bill</strong> served in World War II,
                then came home and put down roots running banks in{' '}
                <strong className="text-bone">El Campo, Texas</strong>. My family has been in Texas
                for over <strong className="text-burnt-orange">127 years</strong>. The soil wasn't
                a stunt — it was a continuation.
              </p>
            </div>

            <div className="reveal">
              <p>
                In <strong className="text-bone">1998</strong>, I watched{' '}
                <strong className="text-bone">Ricky Williams</strong> break the NCAA rushing record
                in burnt orange. My family held UT season tickets for over 40 years.
                Texas was never just geography — it was identity.
              </p>
            </div>

            <div className="reveal">
              <p>
                The name <strong className="text-burnt-orange">Blaze Sports Intel</strong> comes
                from my dachshund, <strong className="text-bone">Bartlett Blaze</strong> — who was
                named after my first baseball team, the Bartlett Blaze from youth ball.
                The name carries the full arc: youth baseball, family pet, professional platform.
                It's not corporate branding — it's lived history.
              </p>
            </div>

            <div className="reveal">
              <p>
                That Texas soil still sits in my home today. Not as nostalgia — as
                a <strong className="text-burnt-orange">covenant</strong>. A reminder that where
                you're from matters less than how you choose to show up.
              </p>
            </div>
          </div>

          {/* Sidebar facts — sticky on desktop */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6 reveal">
              <div className="card p-6">
                <h3 className="section-label mb-6">Quick Facts</h3>
                <div className="space-y-4">
                  {sidebarFacts.map((fact) => (
                    <div key={fact.label} className="flex justify-between items-baseline">
                      <span className="text-sm font-mono text-warm-gray">{fact.label}</span>
                      <span className="text-sm font-semibold text-bone text-right">{fact.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6 bg-gradient-to-br from-burnt-orange/5 to-texas-soil/5">
                <p className="text-sm italic text-warm-gray leading-relaxed">
                  "You may all go to hell, and I will go to Texas."
                </p>
                <p className="text-xs font-mono text-burnt-orange mt-3">— Davy Crockett, 1835</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
