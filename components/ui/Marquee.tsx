'use client';

import { cn } from '@/lib/utils';

const MARQUEE_PHRASES = [
  'TENNESSEE BORN',
  'TEXAS SOIL',
  'AUGUST 17, 1995',
  'DAVY CROCKETT',
  'BARTLETT BLAZE',
  'BOERNE CHAMPION',
  'GRIT OVER FLASH',
  'SUBSTANCE OVER STYLE',
  'LONGHORN FAITHFUL',
  'BORN TO BLAZE',
];

interface MarqueeProps {
  className?: string;
  speed?: 'slow' | 'normal' | 'fast';
  pauseOnHover?: boolean;
  reverse?: boolean;
  phrases?: string[];
}

export function Marquee({
  className,
  speed = 'normal',
  pauseOnHover = true,
  reverse = false,
  phrases = MARQUEE_PHRASES,
}: MarqueeProps) {
  const speedClass = {
    slow: 'animate-marquee',
    normal: 'animate-marquee',
    fast: 'animate-marquee-fast',
  }[speed];

  const animationClass = reverse ? 'animate-marquee-reverse' : speedClass;

  return (
    <div className={cn('marquee-container relative overflow-hidden py-4 bg-true-black border-y border-white/10', className)}>
      <div
        className={cn(
          'marquee-track inline-flex gap-12',
          animationClass,
          pauseOnHover && 'hover:[animation-play-state:paused]'
        )}
      >
        {/* Double the content for seamless loop */}
        {[...phrases, ...phrases].map((phrase, index) => (
          <span
            key={`${phrase}-${index}`}
            className="text-sm md:text-base font-display uppercase tracking-[0.25em] text-white/60 whitespace-nowrap flex items-center gap-12"
          >
            {phrase}
            <span className="text-burnt-orange-500/40">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default Marquee;
