import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type PageHeaderProps = {
  kicker: string;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  className?: string;
  id?: string;
};

export function PageHeader({ kicker, title, description, actions, className, id }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-hero-gap', className)} id={id}>
      <div className="flex flex-col gap-4">
        <span className="inline-flex w-fit items-center rounded-di-pill border border-di-border/60 bg-di-surfaceMuted/20 px-3 py-1 text-xs font-semibold uppercase tracking-kicker text-di-accent">
          {kicker}
        </span>
        <h1 className="font-heading text-3xl leading-tight sm:text-4xl md:text-5xl">{title}</h1>
        <div className="max-w-3xl text-base leading-relaxed text-di-text-muted sm:text-lg">{description}</div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}
