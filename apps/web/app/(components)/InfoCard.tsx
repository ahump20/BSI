import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type InfoCardProps = {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function InfoCard({ title, description, children, className }: InfoCardProps) {
  return (
    <article
      className={cn(
        'flex flex-col gap-4 rounded-di-card border border-di-border/60 bg-di-surface/95 p-card-padding shadow-[0_12px_32px_rgba(8,15,35,0.35)] backdrop-blur-sm transition-colors duration-200 hover:border-di-accent/50',
        className
      )}
    >
      <div className="space-y-3">
        <h2 className="font-heading text-2xl">{title}</h2>
        {description ? <p className="text-base leading-relaxed text-di-text-muted">{description}</p> : null}
      </div>
      {children}
    </article>
  );
}
