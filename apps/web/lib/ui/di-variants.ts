import { cva } from 'class-variance-authority';

export const layoutShell = cva(
  'min-h-screen w-full px-4 py-10 text-di-text sm:px-6 lg:px-8',
  {
    variants: {
      variant: {
        hero:
          'flex justify-center bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.18),_transparent_45%),_radial-gradient(circle_at_80%_20%,_rgba(251,191,36,0.18),_transparent_40%),_rgb(var(--di-color-bg))] pb-30',
        page:
          'bg-[radial-gradient(circle_at_10%_10%,_rgba(15,118,110,0.2),_transparent_40%),_rgb(var(--di-color-bg))]'
      }
    },
    defaultVariants: {
      variant: 'page'
    }
  }
);

export const layoutContainer = cva('mx-auto flex w-full max-w-5xl flex-col gap-18');

export const heroSection = cva('flex flex-col gap-6 text-balance');

export const heroPill = cva(
  'inline-flex items-center justify-center rounded-full border border-di-border/45 bg-di-surfaceMuted/40 px-3.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-di-accent'
);

export const heroTitle = cva('font-display text-4xl leading-tight sm:text-5xl lg:text-6xl');

export const heroSubtitle = cva('max-w-2xl text-base text-di-textMuted sm:text-lg');

export const actionRow = cva('flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center');

export const actionButton = cva(
  'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-di-accent focus-visible:ring-offset-2 focus-visible:ring-offset-di-bg sm:min-w-[13.75rem]',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-tr from-di-accent via-gold to-amber-400 text-di-bg shadow-[0_12px_28px_rgba(251,191,36,0.18)] hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(251,191,36,0.24)]',
        secondary:
          'border border-di-border/70 bg-transparent text-di-text hover:-translate-y-0.5 hover:border-di-accent/60'
      }
    },
    defaultVariants: {
      variant: 'primary'
    }
  }
);

export const section = cva('flex flex-col gap-6');

export const sectionHeader = cva('flex flex-col gap-3');

export const sectionTitle = cva('font-display text-3xl sm:text-4xl');

export const sectionSubtitle = cva('max-w-2xl text-base text-di-textMuted sm:text-lg');

export const navGrid = cva('grid gap-4 sm:grid-cols-2 lg:grid-cols-3');

export const navCard = cva(
  'group flex h-full flex-col gap-2 rounded-di border border-di-border/60 bg-di-surface/90 p-5 shadow-di-card transition hover:-translate-y-0.5 hover:border-di-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-di-accent focus-visible:ring-offset-2 focus-visible:ring-offset-di-bg'
);

export const cardGrid = cva(
  'grid gap-5',
  {
    variants: {
      columns: {
        standard: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        auth: 'grid-cols-1 md:grid-cols-2'
      }
    },
    defaultVariants: {
      columns: 'standard'
    }
  }
);

export const cardSurface = cva(
  'flex h-full flex-col gap-4 rounded-di border border-di-border/60 bg-di-surface p-6 shadow-di-card'
);

export const inlineLink = cva(
  "group inline-flex items-center gap-1 text-sm font-semibold text-di-accent transition hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-di-accent focus-visible:ring-offset-2 focus-visible:ring-offset-di-bg after:ml-1 after:text-xs after:transition after:content-['\\2192'] group-hover:after:translate-x-0.5"
);

export const microcopy = cva('text-xs font-semibold uppercase tracking-[0.24em] text-di-textMuted');

export const listStyles = cva('list-disc space-y-2 pl-5 text-sm text-di-textMuted');

export const kicker = cva('text-xs font-semibold uppercase tracking-[0.24em] text-di-accent');
