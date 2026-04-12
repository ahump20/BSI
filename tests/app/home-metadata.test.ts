import { describe, expect, it, vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Cormorant_Garamond: () => ({ variable: '--font-cormorant' }),
  Oswald: () => ({ variable: '--font-oswald' }),
  JetBrains_Mono: () => ({ variable: '--font-jetbrains-mono' }),
  IBM_Plex_Mono: () => ({ variable: '--font-ibm-plex-mono' }),
  Bebas_Neue: () => ({ variable: '--font-bebas' }),
  Syne: () => ({ variable: '--font-syne' }),
  DM_Sans: () => ({ variable: '--font-dm-sans' }),
}));

import { metadata as homeMetadata } from '@/app/page';
import { metadata as layoutMetadata } from '@/app/layout';
import { websiteJsonLd } from '@/lib/seo/structured-data';

describe('homepage metadata', () => {
  it('positions the homepage as multi-sport with college baseball lead', () => {
    expect(homeMetadata.title).toContain('Blaze Sports Intel');
    expect(homeMetadata.title).toContain('College Baseball');
    expect(homeMetadata.description).toContain('college baseball');
    expect(homeMetadata.description).toContain('NFL');
    expect(homeMetadata.description).toContain('NBA');
  });

  it('keeps site-wide metadata aligned with the homepage positioning', () => {
    expect(layoutMetadata.title).toBe('Blaze Sports Intel | Analytics and Editorial for Every Athlete, Every Game');
    expect(layoutMetadata.description).toContain('college football');
  });

  it('publishes multi-sport website structured data', () => {
    const jsonLd = websiteJsonLd();

    expect(jsonLd.description).toContain('college football');
    expect(jsonLd.description).toContain('college baseball');
    expect(jsonLd.description).toContain('advanced analytics');
  });
});
