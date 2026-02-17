import type { ReactNode } from 'react';

export interface DataAttributionSource {
  name: string;
  url?: string;
  timestamp?: string;
  description?: string;
}

export interface DataAttributionProps {
  sources?: DataAttributionSource[];
  className?: string;
  label?: string;
  footer?: ReactNode;
}

export function DataAttribution({
  sources = [],
  className = '',
  label = 'Data Sources',
  footer,
}: DataAttributionProps) {
  if (!sources.length && !footer) return null;

  return (
    <section className={`rounded-lg border border-white/10 bg-white/5 p-4 ${className}`.trim()}>
      {sources.length > 0 && (
        <>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/60">{label}</h3>
          <ul className="space-y-2 text-sm text-white/75">
            {sources.map((source) => (
              <li key={`${source.name}-${source.timestamp || 'none'}`}>
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-white hover:text-[#FF6B35]"
                  >
                    {source.name}
                  </a>
                ) : (
                  <span className="font-medium text-white">{source.name}</span>
                )}
                {source.description ? <span className="text-white/50"> — {source.description}</span> : null}
                {source.timestamp ? (
                  <div className="text-xs text-white/45">Updated {source.timestamp}</div>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
      {footer ? <div className="mt-3 text-xs text-white/50">{footer}</div> : null}
    </section>
  );
}

export default DataAttribution;
