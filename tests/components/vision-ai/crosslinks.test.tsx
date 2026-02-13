/**
 * Cross-Link Integrity Tests — Vision AI
 *
 * Verifies that the sport pages and ABS tracker link to /vision-ai,
 * and the ABS page renders the StrikeZoneModel.
 */

import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';

// Import sport pages
import MLBPage from '@/app/mlb/page';
import NFLPage from '@/app/nfl/page';
import NBAPage from '@/app/nba/page';
import CollegeBaseballPage from '@/app/college-baseball/page';
import CFBPage from '@/app/cfb/page';
import ABSPage from '@/app/mlb/abs/page';

function getLinks(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('a'))
    .map((a) => a.getAttribute('href'))
    .filter((h): h is string => h !== null);
}

describe('Sport page cross-links to Vision AI', () => {
  it('MLB page links to /vision-ai', async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<MLBPage />));
    });
    expect(getLinks(container)).toContain('/vision-ai');
  });

  it('NFL page links to /vision-ai', async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<NFLPage />));
    });
    expect(getLinks(container)).toContain('/vision-ai');
  });

  it('NBA page links to /vision-ai', async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<NBAPage />));
    });
    expect(getLinks(container)).toContain('/vision-ai');
  });

  it('College Baseball page links to /vision-ai', async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<CollegeBaseballPage />));
    });
    expect(getLinks(container)).toContain('/vision-ai');
  });

  it('CFB page links to /vision-ai', async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<CFBPage />));
    });
    expect(getLinks(container)).toContain('/vision-ai');
  });

  it('ABS page links to /vision-ai', async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<ABSPage />));
    });
    expect(getLinks(container)).toContain('/vision-ai');
  });

  it('ABS page renders the StrikeZoneModel SVG', async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<ABSPage />));
    });
    const svg = container.querySelector('svg[aria-label*="ABS Strike Zone Model"]');
    expect(svg).not.toBeNull();
  });

  it('MLB page links to /mlb/abs from CV section', async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<MLBPage />));
    });
    expect(getLinks(container)).toContain('/mlb/abs');
  });
});
