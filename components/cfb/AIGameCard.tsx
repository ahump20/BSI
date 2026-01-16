'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface GameTeam {
  name: string;
  abbreviation: string;
  logo: string;
  score: string;
  record: string;
}

interface CFBGame {
  id: string;
  name: string;
  date: string;
  status: string;
  completed: boolean;
  homeTeam: GameTeam;
  awayTeam: GameTeam;
  venue: string;
  broadcast: string;
  contentType: 'preview' | 'recap';
  aiContent: string;
}

interface AIGameCardProps {
  game: CFBGame;
}

interface ArticlesResponse {
  articles?: CFBArticle[];
  previews?: CFBArticle[];
  recaps?: CFBArticle[];
}

interface GamesResponse {
  games?: CFBGame[];
}

export function AIGameCard({ game }: AIGameCardProps) {
  const gameDate = new Date(game.date);
  const formattedDate = gameDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Chicago',
  });
  const formattedTime = gameDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Chicago',
  });

  return (
    <Card className="overflow-hidden hover:border-burnt-orange/50 transition-all duration-300">
      {/* Game Header */}
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <Badge variant={game.completed ? 'success' : 'warning'}>
            {game.completed ? 'Final' : game.status}
          </Badge>
          <div className="text-right text-xs text-text-tertiary">
            <div>{formattedDate}</div>
            {!game.completed && <div>{formattedTime} CT</div>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Matchup */}
        <div className="flex items-center justify-between gap-4">
          {/* Away Team */}
          <div className="flex-1 text-center">
            {game.awayTeam.logo && (
              <div className="w-12 h-12 mx-auto mb-2 relative">
                <Image
                  src={game.awayTeam.logo}
                  alt={game.awayTeam.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <div className="font-semibold text-white text-sm">{game.awayTeam.abbreviation}</div>
            <div className="text-xs text-text-tertiary">{game.awayTeam.record}</div>
            {game.completed && (
              <div className="text-2xl font-bold text-white mt-1">{game.awayTeam.score}</div>
            )}
          </div>

          {/* VS / Score Separator */}
          <div className="text-text-tertiary font-medium">{game.completed ? '-' : '@'}</div>

          {/* Home Team */}
          <div className="flex-1 text-center">
            {game.homeTeam.logo && (
              <div className="w-12 h-12 mx-auto mb-2 relative">
                <Image
                  src={game.homeTeam.logo}
                  alt={game.homeTeam.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <div className="font-semibold text-white text-sm">{game.homeTeam.abbreviation}</div>
            <div className="text-xs text-text-tertiary">{game.homeTeam.record}</div>
            {game.completed && (
              <div className="text-2xl font-bold text-white mt-1">{game.homeTeam.score}</div>
            )}
          </div>
        </div>

        {/* Venue & Broadcast */}
        <div className="text-xs text-text-tertiary text-center border-t border-border-subtle pt-3">
          {game.venue && <div>{game.venue}</div>}
          {game.broadcast && <div className="text-burnt-orange">{game.broadcast}</div>}
        </div>

        {/* AI Content */}
        <div className="bg-charcoal/50 rounded-lg p-4 border border-border-subtle">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-burnt-orange">
              AI {game.contentType === 'preview' ? 'Preview' : 'Recap'}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              Workers AI
            </Badge>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
            {game.aiContent}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Article Types & Components for Coded Content API
// ============================================================

interface CFBArticle {
  id: number;
  article_type: 'preview' | 'recap' | 'analysis';
  game_id: number | null;
  title: string;
  slug: string;
  summary: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  game_date: string | null;
  conference: string | null;
  published_at: string;
  metadata: {
    source?: string;
    model?: string;
  } | null;
}

interface ArticleCardProps {
  article: CFBArticle;
}

export function CFBArticleCard({ article }: ArticleCardProps) {
  const formattedDate = new Date(article.published_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  });

  const typeColors = {
    preview: 'primary',
    recap: 'success',
    analysis: 'secondary',
  } as const;

  return (
    <Link href={`/cfb/articles/${article.slug}`}>
      <Card className="h-full overflow-hidden hover:border-burnt-orange/50 transition-all duration-300 cursor-pointer group">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <Badge variant={typeColors[article.article_type]}>
              {article.article_type.charAt(0).toUpperCase() + article.article_type.slice(1)}
            </Badge>
            {article.conference && (
              <span className="text-xs text-text-tertiary">{article.conference}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-white text-base mb-2 line-clamp-2 group-hover:text-burnt-orange transition-colors">
            {article.title}
          </h3>

          {/* Teams */}
          {article.away_team_name && article.home_team_name && (
            <div className="text-sm text-text-secondary mb-3">
              {article.away_team_name} @ {article.home_team_name}
            </div>
          )}

          {/* Summary */}
          {article.summary && (
            <p className="text-sm text-text-tertiary line-clamp-2 mb-4">{article.summary}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <span className="text-xs text-text-tertiary">{formattedDate}</span>
            {article.metadata?.source && (
              <span className="text-xs text-burnt-orange flex items-center gap-1">
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 stroke-burnt-orange fill-none stroke-[1.5]"
                >
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <circle cx="9" cy="9" r="1.5" />
                  <circle cx="15" cy="9" r="1.5" />
                  <path d="M9 15h6" />
                </svg>
                {article.metadata.source === 'workers-ai' ? 'Workers AI' : 'SportsDataIO'}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface CFBArticleListProps {
  type: 'preview' | 'recap' | 'all';
  limit?: number;
  showEmpty?: boolean;
}

export function CFBArticleList({ type, limit = 6, showEmpty = true }: CFBArticleListProps) {
  const [articles, setArticles] = useState<CFBArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticles() {
      try {
        setLoading(true);

        // Determine which endpoint to use
        let url: string;
        if (type === 'preview') {
          url = `/api/college-football/previews`;
        } else if (type === 'recap') {
          url = `/api/college-football/recaps`;
        } else {
          url = `/api/college-football/content?limit=${limit}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch articles');

        const data = (await response.json()) as ArticlesResponse;
        const articleList = data.articles || data.previews || data.recaps || [];
        setArticles(Array.isArray(articleList) ? articleList.slice(0, limit) : []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, [type, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(Math.min(limit, 3))].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5">
              <div className="h-5 bg-charcoal rounded w-20 mb-3" />
              <div className="h-6 bg-charcoal rounded w-3/4 mb-2" />
              <div className="h-4 bg-charcoal rounded w-1/2 mb-4" />
              <div className="h-12 bg-charcoal rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error && showEmpty) {
    return (
      <Card className="text-center py-10">
        <CardContent>
          <p className="text-text-tertiary">{error}</p>
          <p className="text-sm text-burnt-orange mt-2">
            CFB {type === 'preview' ? 'previews' : type === 'recap' ? 'recaps' : 'content'} will be
            available during the season.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (articles.length === 0 && showEmpty) {
    return (
      <Card className="text-center py-10">
        <CardContent>
          <p className="text-text-tertiary">
            No {type === 'preview' ? 'previews' : type === 'recap' ? 'recaps' : 'articles'}{' '}
            available.
          </p>
          <p className="text-sm text-burnt-orange mt-2">
            Check back during the CFB season for AI-powered{' '}
            {type === 'preview' ? 'game previews' : type === 'recap' ? 'game recaps' : 'content'}.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <CFBArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}

interface CFBGamesListProps {
  date?: string;
  limit?: number;
}

export function CFBGamesList({ date, limit = 6 }: CFBGamesListProps) {
  const [games, setGames] = useState<CFBGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGames() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (date) params.set('date', date);
        params.set('limit', limit.toString());

        const response = await fetch(`/api/cfb/games?${params}`);
        if (!response.ok) throw new Error('Failed to fetch games');

        const data = (await response.json()) as GamesResponse;
        setGames(data.games || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load games');
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, [date, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(limit)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-charcoal rounded w-1/4 mb-4" />
              <div className="flex justify-between items-center mb-4">
                <div className="w-12 h-12 bg-charcoal rounded-full" />
                <div className="h-6 bg-charcoal rounded w-8" />
                <div className="w-12 h-12 bg-charcoal rounded-full" />
              </div>
              <div className="h-20 bg-charcoal rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-text-tertiary">{error}</p>
          <p className="text-sm text-text-tertiary mt-2">
            CFB AI previews and recaps will be available during the season.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (games.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-text-tertiary">No games scheduled for this date.</p>
          <p className="text-sm text-burnt-orange mt-2">
            Check back during the CFB season for AI-powered previews and recaps.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map((game) => (
        <AIGameCard key={game.id} game={game} />
      ))}
    </div>
  );
}

export default CFBGamesList;
