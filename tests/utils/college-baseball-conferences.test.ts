import { describe, expect, it } from 'vitest';

import { normalizeCollegeBaseballConference } from '@/lib/data/collegeBaseballConferences';

describe('normalizeCollegeBaseballConference', () => {
  it('maps Pac-12 aliases to canonical conference id', () => {
    expect(normalizeCollegeBaseballConference('pac12')).toBe('Pac-12');
    expect(normalizeCollegeBaseballConference('pac-12')).toBe('Pac-12');
    expect(normalizeCollegeBaseballConference('Pac-12')).toBe('Pac-12');
  });

  it('maps canonical ids and returns null for unknown conferences', () => {
    expect(normalizeCollegeBaseballConference('SEC')).toBe('SEC');
    expect(normalizeCollegeBaseballConference('unknown')).toBeNull();
  });
});
