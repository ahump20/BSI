'use client';

/**
 * BSI Quote Block
 *
 * Premium editorial quote component with serif typography
 * and large decorative quotation mark.
 */

import { cn } from '@/lib/utils';

interface QuoteBlockProps {
  quote: string;
  author?: string;
  className?: string;
}

export function QuoteBlock({ quote, author, className }: QuoteBlockProps) {
  return (
    <section className={cn('py-24 px-4 sm:px-6 lg:px-8 bg-true-black', className)}>
      <div className="max-w-4xl mx-auto relative">
        {/* Decorative Quote Mark */}
        <span className="quote-mark select-none" aria-hidden="true">
          "
        </span>

        {/* Quote Text */}
        <blockquote className="relative z-10">
          <p className="font-serif-quote text-2xl sm:text-3xl md:text-4xl text-white/90 leading-relaxed">
            "{quote}"
          </p>
          {author && (
            <footer className="mt-8">
              <cite className="not-italic text-burnt-orange-400 font-medium">
                — {author}
              </cite>
            </footer>
          )}
        </blockquote>
      </div>
    </section>
  );
}

export default QuoteBlock;
