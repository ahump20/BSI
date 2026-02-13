import { motion } from 'framer-motion';

const experiences = [
  {
    title: 'Founder & Builder',
    company: 'Blaze Sports Intel',
    location: 'San Antonio, TX',
    period: '2023 – Present',
    highlights: [
      'Architected production-grade sports analytics platform covering MLB, NFL, NCAA football, NBA, and college baseball — serving programs outside East/West Coast prestige coverage',
      'Built 53-worker serverless architecture on Cloudflare (Workers, D1, KV, R2) — same discipline that brought Texas soil to a Memphis hospital room',
      'Real-time data pipelines with 30-second update cadence for live scoring — showing up for every data point, every game, every market that matters',
      'AI-powered predictive modules and BlazeCraft system health monitoring',
      'Editorial voice for underserved markets: if geography shouldn\'t determine where you\'re born, it shouldn\'t determine whose stories get told',
    ],
  },
  {
    title: 'Advertising Account Executive',
    company: 'Spectrum Reach',
    location: 'Austin, TX',
    period: 'Nov 2022 – Dec 2025',
    highlights: [
      'Data-informed advertising strategies across linear TV, OTT/CTV, streaming, and digital',
      'Translated campaign performance into actionable insights for client renewals',
      'Cross-functional coordination for multi-channel campaigns',
    ],
  },
  {
    title: 'Financial Representative',
    company: 'Northwestern Mutual',
    location: 'Austin, TX',
    period: 'Dec 2020 – Aug 2022',
    highlights: [
      'Top-5 nationally ranked intern program',
      '"Power of 10" Award — top 10% nationally',
      'Structured financial modeling for comprehensive client plans',
    ],
  },
];

export default function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-heading" className="section-padding bg-sand">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 id="experience-heading" className="text-4xl md:text-6xl font-bold uppercase tracking-wider text-charcoal mb-6">
            Professional <span className="text-burnt-orange">Journey</span>
          </h2>

          <p className="text-lg text-charcoal/80 max-w-3xl mb-12 italic border-l-4 border-burnt-orange pl-6">
            The Texas soil covenant isn't just origin story — it's operational philosophy. Show up for every pitch,
            every client, every line of code. The same refusal to let geography determine opportunity that brought
            that soil to a Memphis hospital room now shapes how Blaze Sports Intel serves markets the coasts overlook.
          </p>

          <div className="relative space-y-12">
            {/* Timeline Line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-burnt-orange via-texas-soil to-burnt-orange hidden md:block" />
            {experiences.map((exp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="relative bg-white rounded-lg shadow-lg p-8 border-l-4 border-burnt-orange md:ml-8"
              >
                {/* Timeline Node */}
                <div className="absolute -left-10 top-8 hidden md:flex">
                  <div className="w-6 h-6 bg-burnt-orange rounded-full border-4 border-sand flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold font-sans uppercase text-charcoal">
                      {exp.title}
                    </h3>
                    <p className="text-lg text-burnt-orange font-semibold">
                      {exp.company}
                    </p>
                    <p className="text-sm font-mono text-charcoal/60">
                      {exp.location}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <span className="inline-block bg-burnt-orange/10 text-burnt-orange px-4 py-1 rounded-full font-mono text-sm font-semibold">
                      {exp.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 mt-6">
                  {exp.highlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-burnt-orange mt-1">▸</span>
                      <span className="text-charcoal/80 leading-relaxed">
                        {highlight}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-burnt-orange">
              <h3 className="text-xl font-bold font-sans uppercase text-charcoal mb-2">
                M.S. Entertainment Business – Sports Management
              </h3>
              <p className="text-burnt-orange font-semibold">Full Sail University</p>
              <p className="text-sm font-mono text-charcoal/60 mt-1">
                Expected Feb 2026 · GPA 3.56
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-burnt-orange">
              <h3 className="text-xl font-bold font-sans uppercase text-charcoal mb-2">
                B.A. International Relations & Global Studies
              </h3>
              <p className="text-burnt-orange font-semibold">
                University of Texas at Austin
              </p>
              <p className="text-sm font-mono text-charcoal/60 mt-1">
                2014 – 2020 · Minors: Economics, European Studies
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
