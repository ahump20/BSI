'use client';

import { useState } from 'react';

interface PlayerSearchResult {
  mlbam_id: number;
  name: string;
  birth_date?: string;
  position?: string;
  team?: string;
  active: boolean;
}

interface PlayerSearchResponse {
  query: string;
  results: PlayerSearchResult[];
  total_count: number;
}

export default function MLBPlayersSearchPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fuzzy, setFuzzy] = useState(false);
  const [searchResults, setSearchResults] = useState<PlayerSearchResponse | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!firstName && !lastName) {
      setError('Please enter at least a first name or last name');
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const params = new URLSearchParams();
      if (firstName) params.append('first_name', firstName);
      if (lastName) params.append('last_name', lastName);
      params.append('fuzzy', fuzzy.toString());

      const response = await fetch(`${apiUrl}/mlb/players/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: PlayerSearchResponse = await response.json();
      setSearchResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSearching(false);
    }
  }

  function handleClear() {
    setFirstName('');
    setLastName('');
    setFuzzy(false);
    setSearchResults(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">MLB Player Search</h1>
          <p className="text-gray-400">
            Search for MLB players and view their comprehensive profiles
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g., Mike"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-orange-600 focus:outline-none"
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g., Trout"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-orange-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Fuzzy Search Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="fuzzy"
                checked={fuzzy}
                onChange={(e) => setFuzzy(e.target.checked)}
                className="w-5 h-5 rounded bg-gray-800 border border-gray-700 text-orange-600 focus:ring-orange-600 focus:ring-2"
              />
              <label htmlFor="fuzzy" className="ml-3 text-sm text-gray-400">
                Enable fuzzy matching (finds similar names)
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={searching}
                className="px-8 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searching ? 'Searching...' : 'Search Players'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-900 rounded-lg p-6 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Search Results */}
        {searchResults && (
          <div className="bg-gray-900 rounded-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Search Results</h2>
              <p className="text-gray-400">
                Found {searchResults.total_count} player{searchResults.total_count !== 1 ? 's' : ''} matching "{searchResults.query}"
              </p>
            </div>

            {searchResults.total_count === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No players found. Try adjusting your search or enabling fuzzy matching.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.results.map((player) => (
                  <a
                    key={player.mlbam_id}
                    href={`/baseball/mlb/players/${player.mlbam_id}`}
                    className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold">{player.name}</h3>
                      {player.active && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-900 text-green-300">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      {player.team && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Team:</span>
                          <span className="font-semibold text-orange-500">{player.team}</span>
                        </div>
                      )}
                      {player.position && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Position:</span>
                          <span className="font-semibold">{player.position}</span>
                        </div>
                      )}
                      {player.birth_date && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Born:</span>
                          <span className="font-semibold">{new Date(player.birth_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Player ID:</span>
                        <span className="font-semibold text-xs text-gray-500">{player.mlbam_id}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <span className="text-orange-500 text-sm font-semibold hover:text-orange-400">
                        View Profile →
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Featured Players */}
        {!searchResults && (
          <div className="bg-gray-900 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Featured Players</h2>
            <p className="text-gray-400 mb-6">
              Search for your favorite players above or browse our leaderboards
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/baseball/mlb/leaderboards"
                 className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center font-semibold transition">
                Batting Leaders
              </a>
              <a href="/baseball/mlb/leaderboards"
                 className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center font-semibold transition">
                Pitching Leaders
              </a>
              <a href="/baseball/mlb/teams"
                 className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center font-semibold transition">
                Browse Teams
              </a>
              <a href="/baseball/mlb/dashboard"
                 className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center font-semibold transition">
                Live Dashboard
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
