import { motion } from 'framer-motion';
import OptimizedImage from './OptimizedImage';

const heritageProjects = [
  {
    title: 'Texas Longhorns Legacy',
    category: 'Family Tradition',
    image: '/assets/young-austin-longhorns.jpg',
    description:
      'Born in Memphis but raised on Texas tradition. Family held UT season tickets for over 40 years—longer than my lifetime. Witnessed Ricky Williams break the rushing record as a kid. Texas was never just a place; it was a covenant.',
    tags: ['Heritage', 'UT Austin', 'Family'],
  },
  {
    title: 'Multi-Sport Athlete',
    category: 'Boerne-Champion HS',
    image: '/assets/football-uniform.jpg',
    description:
      'Football: Running back & long snapper. Scored first touchdown against rival Kerrville Tivy. First play of 7th grade season, 70-yard TD run. Baseball: Pitcher who started with "Little League Blue" team. Track: AAU State competition.',
    tags: ['Football', 'Baseball', 'Track'],
  },
  {
    title: 'Baseball Heritage',
    category: 'Memphis to Texas',
    image: '/assets/baseball-with-father.jpg',
    description:
      'Started playing organized baseball in Memphis, continued through Texas. The "Bartlett Blaze" team name from my childhood became the foundation for Blaze Sports Intel years later. Baseball wasn\'t just a sport — it was the thread connecting family, place, and purpose.',
    tags: ['Baseball', 'Family', 'Origins'],
  },
  {
    title: 'Blaze Sports Intel',
    category: 'Named After My Dog',
    image: '/assets/blaze-dog.jpg',
    description:
      'Named BlazeSportsIntel.com after my dog "Bartlett Blaze," who was named after my first baseball team. The name carries the full arc: youth baseball → family pet → professional sports analytics platform. It\'s not corporate branding — it\'s lived history.',
    tags: ['BSI', 'Authenticity', 'Origins'],
  },
];

const technicalProjects = [
  {
    title: 'Blaze Sports Intel',
    category: 'Live Production Platform',
    image: '/assets/bsi-logo.png',
    link: 'https://blazesportsintel.com',
    description:
      'Production-grade sports analytics covering MLB, NFL, NBA, NCAA football, and college baseball. Real-time data pipelines, API integrations, mobile-first dashboards. 30-second update cadence for live scoring. Serves underserved markets outside East/West Coast prestige coverage.',
    tags: ['TypeScript', 'Cloudflare', 'AI', 'Live'],
  },
  {
    title: 'BlazeCraft System Health',
    category: 'Infrastructure Monitoring',
    image: '/assets/bsi-logo.png',
    link: 'https://blazecraft.app',
    description:
      'Built Warcraft 3: Frozen Throne–style system health dashboard to monitor 53 Cloudflare Workers, 12 D1 databases, 45 KV namespaces, and 18 R2 buckets. Real-time visibility into the entire BSI infrastructure with vintage RTS game aesthetics.',
    tags: ['Cloudflare', 'DevOps', 'Monitoring', 'Live'],
  },
];

export default function Projects() {
  return (
    <section id="projects" aria-labelledby="projects-heading" className="section-padding bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 id="projects-heading" className="text-4xl md:text-6xl font-bold uppercase tracking-wider text-charcoal mb-4">
            Athletic Heritage &<br />
            <span className="text-burnt-orange">Technical Projects</span>
          </h2>

          <p className="text-lg text-charcoal/70 max-w-3xl mb-12">
            From youth sports to professional platform engineering — the same discipline,
            the same grit, the same refusal to accept that geography should determine access.
          </p>

          {/* Heritage Projects - 2x2 Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {heritageProjects.map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-sand rounded-lg overflow-hidden shadow-xl hover:shadow-2xl hover:scale-[1.02] hover:border-2 hover:border-burnt-orange transition-all duration-300 ease-out-expo cursor-pointer"
              >
                <div className="h-64 overflow-hidden">
                  <OptimizedImage
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="p-6">
                  <p className="text-xs font-mono uppercase tracking-wider text-burnt-orange mb-2">
                    {project.category}
                  </p>
                  <h3 className="text-2xl font-bold font-sans text-charcoal mb-3">
                    {project.title}
                  </h3>
                  <p className="text-charcoal/70 leading-relaxed mb-4">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs font-mono bg-burnt-orange/10 text-burnt-orange px-3 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative my-16 py-12"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-burnt-orange/10 via-burnt-orange/20 to-burnt-orange/10 rounded-lg" />
            <div className="relative text-center">
              <p className="text-2xl md:text-4xl font-bold uppercase tracking-wider text-charcoal">
                From Playing the Game to<br />
                <span className="text-burnt-orange">Building the Platform</span>
              </p>
            </div>
          </motion.div>

          {/* Technical Projects - Larger Cards with Live Links */}
          <div className="grid md:grid-cols-2 gap-8">
            {technicalProjects.map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-charcoal rounded-lg overflow-hidden shadow-2xl hover:shadow-[0_20px_60px_rgba(191,87,0,0.3)] hover:scale-[1.02] hover:border-2 hover:border-burnt-orange transition-all duration-300 ease-out-expo"
              >
                <div className="h-80 overflow-hidden relative">
                  <OptimizedImage
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/50 to-transparent" />
                </div>

                <div className="p-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-mono uppercase tracking-wider text-burnt-orange">
                      {project.category}
                    </p>
                    <span className="flex items-center gap-1 text-xs font-mono text-ember">
                      <span className="w-2 h-2 bg-ember rounded-full animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold font-sans text-sand mb-4">
                    {project.title}
                  </h3>
                  <p className="text-sand/80 leading-relaxed mb-6">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs font-mono bg-burnt-orange/20 text-burnt-orange px-3 py-1 rounded-full border border-burnt-orange/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-burnt-orange font-sans font-semibold uppercase tracking-wider hover:text-ember transition-colors duration-300 group"
                  >
                    View Live Platform
                    <svg
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
