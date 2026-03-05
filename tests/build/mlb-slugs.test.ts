/**
 * Build-time assertion: MLB team detail page slugs must match canonical MLB_TEAMS data.
 *
 * Prevents the slug mismatch where generateStaticParams produces one set of slugs
 * (e.g. abbreviations like "kc") while MLB_TEAMS.slug uses another (e.g. "royals").
 * If these diverge, team detail pages 404 when visitors click through from the teams list.
 */
import { describe, it, expect } from 'vitest';
import { MLB_TEAMS } from '@/lib/utils/mlb-teams';

describe('MLB team slug consistency', () => {
  it('MLB_TEAMS has exactly 30 teams', () => {
    expect(MLB_TEAMS).toHaveLength(30);
  });

  it('every team has a non-empty slug', () => {
    for (const team of MLB_TEAMS) {
      expect(team.slug, `${team.name} missing slug`).toBeTruthy();
      expect(team.slug.length).toBeGreaterThan(0);
    }
  });

  it('no duplicate slugs', () => {
    const slugs = MLB_TEAMS.map((t) => t.slug);
    const unique = new Set(slugs);
    expect(unique.size, `Duplicate slugs: ${slugs.filter((s, i) => slugs.indexOf(s) !== i)}`).toBe(slugs.length);
  });

  it('slugs are URL-safe kebab-case', () => {
    for (const team of MLB_TEAMS) {
      expect(team.slug, `${team.name} slug "${team.slug}" is not kebab-case`).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it('every team has a valid abbreviation', () => {
    for (const team of MLB_TEAMS) {
      expect(team.abbreviation, `${team.name} missing abbreviation`).toBeTruthy();
      expect(team.abbreviation).toMatch(/^[A-Z]{2,3}$/);
    }
  });

  it('every team has league and division', () => {
    for (const team of MLB_TEAMS) {
      expect(['AL', 'NL']).toContain(team.league);
      expect(['East', 'Central', 'West']).toContain(team.division);
    }
  });
});
