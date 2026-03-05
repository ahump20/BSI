import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Texas 12, UC Davis 2: 2026 Season Opener Recap | Blaze Sports Intel',
  description:
    'Dylan Volantis opened his first career Friday start with 5 shutout innings. Texas scored in six of seven frames to take the 2026 opener 12-2 over UC Davis at UFCU Disch-Falk Field. Full box score and analysis.',
  openGraph: {
    title: 'Texas 12, UC Davis 2 — Season Opener Recap | Blaze Sports Intel',
    description:
      'Volantis dealt. The lineup produced from top to bottom. The 2026 Longhorns answered opening night emphatically.',
    type: 'article',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
