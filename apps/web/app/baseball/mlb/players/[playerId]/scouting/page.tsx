'use client';

import { useState, useEffect } from 'react';

interface ScoutingReportData {
  player_id: number;
  player_name: string;
  position: string;
  team?: string;
  season: number;
  generated_at: string;
  overall_grade: number;
  tool_grades?: Record<string, number>;
  pitch_grades?: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  recommendations: string[];
  comparable_players: any[];
}

interface ScoutingPageProps {
  params: {
    playerId: string;
  };
}

export default function PlayerScoutingReportPage({ params }: ScoutingPageProps) {
  const [report, setReport] = useState<ScoutingReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [season, setSeason] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchReport();
  }, [params.playerId, season]);

  async function fetchReport() {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/mlb/players/${params.playerId}/scouting?season=${season}`);

      if (!response.ok) {
        throw new Error('Failed to generate scouting report');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const getGradeColor = (grade: number): string => {
    if (grade >= 70) return 'text-red-500';
    if (grade >= 60) return 'text-orange-500';
    if (grade >= 50) return 'text-yellow-500';
    if (grade >= 40) return 'text-blue-500';
    return 'text-gray-500';
  };

  const getGradeLabel = (grade: number): string => {
    if (grade >= 70) return 'Elite';
    if (grade >= 60) return 'Plus';
    if (grade >= 50) return 'Average';
    if (grade >= 40) return 'Below Average';
    return 'Poor';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href={`/baseball/mlb/players/${params.playerId}`}
             className="text-orange-500 hover:text-orange-400 mb-4 inline-block">
            ← Back to Player Profile
          </a>
          <h1 className="text-4xl font-bold mb-2">
            {report?.player_name || `Player ${params.playerId}`} - Scouting Report
          </h1>
          <p className="text-gray-400">
            Auto-generated scouting analysis based on performance data
          </p>
        </div>

        {/* Season Selector */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <label className="font-semibold">Season:</label>
            <select
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-orange-600 focus:outline-none"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              onClick={fetchReport}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition"
            >
              Regenerate
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
            <p className="text-gray-400">Generating scouting report...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-900 rounded-lg p-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Report Content */}
        {!loading && !error && report && (
          <>
            {/* Overall Grade */}
            <div className="bg-gray-900 rounded-lg p-8 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Overall Scouting Grade</h2>
                  <p className="text-gray-400">20-80 Scouting Scale</p>
                </div>
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getGradeColor(report.overall_grade)}`}>
                    {report.overall_grade.toFixed(0)}
                  </div>
                  <div className="text-xl text-gray-400 mt-2">
                    {getGradeLabel(report.overall_grade)}
                  </div>
                </div>
              </div>
            </div>

            {/* Tool Grades (for position players) */}
            {report.tool_grades && Object.keys(report.tool_grades).length > 0 && (
              <div className="bg-gray-900 rounded-lg p-8 mb-6">
                <h2 className="text-2xl font-bold mb-6">5-Tool Grades</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(report.tool_grades).map(([tool, grade]) => (
                    <div key={tool} className="bg-gray-800 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-400 mb-2 capitalize">{tool}</div>
                      <div className={`text-4xl font-bold ${getGradeColor(grade)}`}>
                        {grade.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{getGradeLabel(grade)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-sm text-gray-400">
                  <p><strong>Tool Descriptions:</strong></p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Hit:</strong> Contact ability and batting average potential</li>
                    <li><strong>Power:</strong> Home run and extra-base hit ability</li>
                    <li><strong>Speed:</strong> Running speed and base-stealing ability</li>
                    <li><strong>Fielding:</strong> Defensive skills and range</li>
                    <li><strong>Arm:</strong> Throwing strength and accuracy</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Pitch Grades (for pitchers) */}
            {report.pitch_grades && Object.keys(report.pitch_grades).length > 0 && (
              <div className="bg-gray-900 rounded-lg p-8 mb-6">
                <h2 className="text-2xl font-bold mb-6">Pitch Grades</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(report.pitch_grades).map(([pitch, grade]) => (
                    <div key={pitch} className="bg-gray-800 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-400 mb-2 uppercase">{pitch}</div>
                      <div className={`text-4xl font-bold ${getGradeColor(grade)}`}>
                        {grade.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{getGradeLabel(grade)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Executive Summary */}
            <div className="bg-gray-900 rounded-lg p-8 mb-6">
              <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
              <p className="text-gray-300 leading-relaxed">{report.summary}</p>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Strengths */}
              <div className="bg-gray-900 rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-4 text-green-500">Strengths</h2>
                <ul className="space-y-3">
                  {report.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-green-500 text-xl">✓</span>
                      <span className="text-gray-300">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-gray-900 rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-4 text-red-500">Weaknesses</h2>
                <ul className="space-y-3">
                  {report.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-red-500 text-xl">✗</span>
                      <span className="text-gray-300">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-8 mb-6">
                <h2 className="text-2xl font-bold mb-4">Recommendations</h2>
                <ul className="space-y-3">
                  {report.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-orange-500 text-xl">→</span>
                      <span className="text-gray-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* About the Report */}
            <div className="bg-gray-900 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-4">About This Report</h2>
              <div className="text-gray-400 space-y-4 text-sm">
                <p>
                  This scouting report is auto-generated using advanced statistical analysis and machine learning
                  algorithms. It evaluates player performance using the industry-standard 20-80 scouting scale.
                </p>
                <div>
                  <strong className="text-white">Scouting Scale Reference:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><span className="text-red-500 font-bold">80:</span> Best in MLB</li>
                    <li><span className="text-red-400 font-bold">70:</span> Elite / All-Star level</li>
                    <li><span className="text-orange-500 font-bold">60:</span> Above Average / Plus</li>
                    <li><span className="text-yellow-500 font-bold">50:</span> Major League Average</li>
                    <li><span className="text-blue-500 font-bold">40:</span> Below Average</li>
                    <li><span className="text-gray-500 font-bold">20-30:</span> Well Below Average</li>
                  </ul>
                </div>
                <p>
                  Report generated on: {new Date(report.generated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
