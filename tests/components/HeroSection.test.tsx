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
  it('renders the cinematic homepage hero message', () => {
    const { container } = render(<HeroSection />);

    expect(screen.getByText(/Austin, Texas \/\/ Est\. 2024/i)).toBeTruthy();
    expect(screen.getByText(/Blaze Sports Intel/i)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /The Real Game Lives Between The Coasts/i })).toBeTruthy();
    expect(screen.getByText(/Live boards, park-adjusted analytics, and original reporting/i)).toBeTruthy();
    expect(container.querySelector('[data-home-hero]')).toBeTruthy();
    expect(container.querySelector('[data-home-proof-ribbon]')).toBeTruthy();
  });

  it('keeps the primary homepage routes visible in the hero', () => {
    render(<HeroSection />);

    expect(screen.getByRole('link', { name: /^Open Scores$/i }).getAttribute('href')).toBe('/scores');
    expect(screen.getByRole('link', { name: /^Start With College Baseball$/i }).getAttribute('href')).toBe('/college-baseball');
    expect(screen.getByRole('link', { name: /^See BSI Savant$/i }).getAttribute('href')).toBe('/college-baseball/savant');
    expect(screen.getByTestId('hero-score-strip')).toBeTruthy();
  });

  it('keeps the proof ribbon outside the poster viewport content', () => {
    const { container } = render(<HeroSection />);

    const hero = container.querySelector('[data-home-hero]');
    const ribbon = container.querySelector('[data-home-proof-ribbon]');

    expect(hero).toBeTruthy();
    expect(ribbon).toBeTruthy();
    expect(hero?.nextElementSibling).toBe(ribbon);
  });
});
