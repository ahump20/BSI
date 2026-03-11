import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroSection } from '@/components/home/HeroSection';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ alt, fill: _fill, priority: _priority, ...props }: { alt: string; fill?: boolean; priority?: boolean } & ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={alt} {...props} />
  ),
}));

vi.mock('@/components/home/HeroScoreStrip', () => ({
  HeroScoreStrip: () => <div data-testid="hero-score-strip">Hero score strip</div>,
}));

describe('HeroSection', () => {
  it('renders the new product-first homepage message', () => {
    render(<HeroSection />);

    expect(screen.getByRole('heading', { name: /Coverage for the sports the spotlight skips\./i })).toBeTruthy();
    expect(screen.getByText(/Blaze Sports Intel brings live scores, editorial, and park-adjusted analytics/i)).toBeTruthy();
    expect(screen.getByText(/College baseball is the flagship\. The rest of the board still matters\./i)).toBeTruthy();
    expect(screen.getAllByText(/Born to Blaze the Path Beaten Less/i).length).toBeGreaterThan(0);
  });

  it('keeps the primary homepage routes visible in the hero', () => {
    render(<HeroSection />);

    expect(screen.getByRole('link', { name: /Start with College Baseball/i }).getAttribute('href')).toBe('/college-baseball');
    expect(screen.getByRole('link', { name: /Check Live Scores/i }).getAttribute('href')).toBe('/scores');
    expect(screen.getByRole('link', { name: /Open BSI Savant/i }).getAttribute('href')).toBe('/college-baseball/savant');
    expect(screen.getByTestId('hero-score-strip')).toBeTruthy();
  });
});
