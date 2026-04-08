import Section from './Section';
import ScrollReveal from './ScrollReveal';
import ProjectCard from './ProjectCard';

const projects = [
  {
    name: 'Blaze Sports Intel',
    slug: 'bsi',
    position:
      'The coverage gap between what fans care about and what media covers is the product. Six sports, 330 D1 programs, park-adjusted sabermetrics — all running on Cloudflare, all one person.',
    liveUrl: 'https://blazesportsintel.com',
    weight: 'featured' as const,
  },
  {
    name: 'Sandlot Sluggers',
    slug: 'sluggers',
    position:
      'Pick a real college team. The rosters come from the BSI API. The stats are real. The game runs in the browser.',
    liveUrl: 'https://arcade.blazesportsintel.com',
    weight: 'supporting' as const,
  },
  {
    name: 'BlazeCraft',
    slug: 'blazecraft',
    position:
      'I grew up in Warcraft III. When I needed to monitor 53 Workers, I built the dashboard I would actually want to use.',
    liveUrl: 'https://blazecraft.app',
    weight: 'supporting' as const,
  },
];

export default function ProjectGrid() {
  return (
    <Section id="projects" label="Also Shipping" title="Work">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-5">
        {projects.map((project, i) => (
          <ScrollReveal key={project.slug} delay={i * 0.1}>
            <ProjectCard {...project} />
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}
