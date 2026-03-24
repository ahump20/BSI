export interface Team {
  id: string;
  league: string;
  name: string;
  abbreviation: string;
  city?: string | null;
  raw?: unknown;
}

export interface SearchResult {
  id: string;
  type: 'team' | 'player' | 'article' | 'game';
  label: string;
  sport?: string | null;
  raw?: unknown;
}
