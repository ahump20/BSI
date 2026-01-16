'use client';

import { cn } from '@/lib/utils';
import { ScrollReveal } from '../motion/ScrollReveal';

export interface CovenantQuoteProps {
  /** Quote text */
  quote: string;
  /** Attribution (optional) */
  attribution?: string;
  /** Variant style */
  variant?: 'default' | 'minimal' | 'featured';
  /** Additional class names */
  className?: string;
}

/**
 * CovenantQuote component
 *
 * Special treatment for the Texas philosophy/covenant quotes.
 * Uses Playfair Display italic for elegant presentation.
 *
 * Canonical quote:
 * "Texas is how you choose to treat the best and worst of us —
 *  a covenant with oneself and the company he keeps to never
 *  stop dreaming beyond the horizon…"
 */
export function CovenantQuote({
  quote,
  attribution,
  variant = 'default',
  className,
}: CovenantQuoteProps) {
  return (
    <ScrollReveal direction="fade" duration={1000}>
      <blockquote
        className={cn(
          'relative',
          variant === 'default' && 'py-12 md:py-16',
          variant === 'minimal' && 'py-8',
          variant === 'featured' && 'py-16 md:py-24',
          className
        )}
      >
        {/* Decorative elements for featured variant */}
        {variant === 'featured' && (
          <>
            {/* Decorative lines */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-b from-transparent via-burnt-orange/50 to-transparent" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-t from-transparent via-burnt-orange/50 to-transparent" />
          </>
        )}

        {/* Opening quote mark */}
        <span
          className={cn(
            'absolute font-serif text-burnt-orange/20',
            variant === 'default' && 'text-6xl md:text-8xl -top-4 -left-2 md:-left-8',
            variant === 'minimal' && 'text-4xl -top-2 -left-1',
            variant === 'featured' &&
              'text-8xl md:text-[10rem] -top-8 md:-top-12 left-0 md:-left-12'
          )}
          aria-hidden="true"
        >
          "
        </span>

        {/* Quote text */}
        <p
          className={cn(
            'font-serif italic text-text-primary leading-relaxed',
            'relative z-10',
            variant === 'default' && 'text-xl md:text-2xl lg:text-3xl max-w-3xl',
            variant === 'minimal' && 'text-lg md:text-xl max-w-2xl',
            variant === 'featured' &&
              'text-2xl md:text-3xl lg:text-4xl max-w-4xl mx-auto text-center'
          )}
        >
          {quote}
        </p>

        {/* Attribution */}
        {attribution && (
          <footer
            className={cn('mt-6 text-text-tertiary', variant === 'featured' && 'text-center')}
          >
            <span className="text-burnt-orange mr-2">—</span>
            <cite className="not-italic text-sm uppercase tracking-wider">{attribution}</cite>
          </footer>
        )}

        {/* Closing quote mark for featured */}
        {variant === 'featured' && (
          <span
            className="absolute font-serif text-burnt-orange/20 text-8xl md:text-[10rem] -bottom-16 md:-bottom-20 right-0 md:-right-12"
            aria-hidden="true"
          >
            "
          </span>
        )}
      </blockquote>
    </ScrollReveal>
  );
}

// Preset for the canonical Texas covenant quote
export function TexasCovenantQuote({
  variant = 'featured',
  className,
}: Omit<CovenantQuoteProps, 'quote'>) {
  return (
    <CovenantQuote
      quote="Texas is how you choose to treat the best and worst of us — a covenant with oneself and the company he keeps to never stop dreaming beyond the horizon…"
      variant={variant}
      className={className}
    />
  );
}

export default CovenantQuote;
