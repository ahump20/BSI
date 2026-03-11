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
  it('renders the current homepage hero message', () => {
    render(<HeroSection />);

    expect(screen.getByText(/Est\. 2024/i)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Blaze Sports/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Intel/i })).toBeTruthy();
    expect(screen.getByText(/Live scores, game intelligence, and park-adjusted analytics/i)).toBeTruthy();
    expect(screen.getByText(/Born to Blaze the Path Beaten Less/i)).toBeTruthy();
  });

  it('keeps the primary homepage routes visible in the hero', () => {
    render(<HeroSection />);

    expect(screen.getByRole('link', { name: /^College Baseball$/i }).getAttribute('href')).toBe('/college-baseball');
    expect(screen.getByRole('link', { name: /^Live Scores$/i }).getAttribute('href')).toBe('/scores');
    expect(screen.getByRole('link', { name: /^BSI Savant$/i }).getAttribute('href')).toBe('/college-baseball/savant');
    expect(screen.getByTestId('hero-score-strip')).toBeTruthy();
  });

  it('keeps the hero wrapper shrinkable on mobile', () => {
    render(<HeroSection />);

    const heroHeading = screen.getByRole('heading', { name: /Blaze Sports/i });
    const wrapper = heroHeading.parentElement;

    expect(wrapper?.className).toContain('w-full');
    expect(wrapper?.className).toContain('min-w-0');
  });
});
