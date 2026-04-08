import { Link } from 'react-router-dom';
import { PROJECT_SCREENSHOTS } from '../content/site';

interface ProjectCardProps {
  name: string;
  slug: string;
  position: string;
  liveUrl: string;
  weight: 'featured' | 'supporting';
}

export default function ProjectCard({ name, slug, position, liveUrl, weight }: ProjectCardProps) {
  const screenshot = PROJECT_SCREENSHOTS[slug];

  return (
    <Link to={`/projects/${slug}`} className="group block h-full">
      <article
        className="card h-full overflow-hidden"
        style={{
          borderColor: weight === 'featured' ? 'rgba(191,87,0,0.25)' : undefined,
        }}
      >
        {/* Screenshot */}
        {screenshot && (
          <div className="overflow-hidden">
            <img
              src={screenshot}
              alt={`${name} — live application screenshot`}
              className="w-full transition-transform duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3
              className="font-sans text-sm font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text)' }}
            >
              {name}
            </h3>
            <span
              className="font-mono text-[10px] tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ color: 'var(--color-accent)' }}
            >
              &rarr;
            </span>
          </div>

          <p
            className="font-serif text-[15px] leading-relaxed"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {position}
          </p>

          {weight === 'featured' && (
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] tracking-wide hover:underline"
                style={{ color: 'var(--color-text-muted)' }}
                onClick={e => e.stopPropagation()}
              >
                {liveUrl.replace('https://', '')}
              </a>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
