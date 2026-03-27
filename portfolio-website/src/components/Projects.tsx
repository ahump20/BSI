import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';
import { PORTFOLIO_PROJECTS, type Project } from '../content/site';

function ProjectCard({ project, flagship }: { project: Project; flagship?: boolean }) {
  return (
    <motion.a
      variants={staggerItem}
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => window.posthog?.capture('project_clicked', { project: project.name })}
      className={`group block rounded-sm transition-all duration-300 ${
        flagship
          ? 'md:col-span-2 border-l-2 border-l-burnt-orange/50 border border-bone/5 bg-charcoal/30 p-8 hover:bg-charcoal/50 hover:border-bone/10'
          : 'border border-bone/5 bg-charcoal/20 p-6 hover:bg-charcoal/40 hover:border-bone/10'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3
          className={`font-sans font-bold uppercase tracking-wider text-bone group-hover:text-burnt-orange transition-colors duration-300 ${
            flagship ? 'text-xl' : 'text-base'
          }`}
        >
          {project.name}
        </h3>
        <svg
          className="w-4 h-4 text-bone/20 group-hover:text-burnt-orange group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 shrink-0 mt-1"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path d="M5 15L15 5M15 5H8M15 5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-burnt-orange/80 mb-2">
        {project.category}
      </p>

      <p className="text-bone/70 text-sm leading-relaxed mb-4">
        {project.outcome}
      </p>

      <p className="font-mono text-[0.6rem] text-warm-gray/60 tracking-wider">
        {project.techs.join(' · ')}
      </p>
    </motion.a>
  );
}

export default function Projects() {
  const [flagship, ...rest] = PORTFOLIO_PROJECTS;

  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      className="section-padding"
    >
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <p className="section-label">// The Work</p>
            <h2 id="work-heading" className="section-title">Projects</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            <ProjectCard project={flagship} flagship />
            {rest.map((project) => (
              <ProjectCard key={project.name} project={project} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
