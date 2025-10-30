'use client';

import { useEffect, useState } from 'react';
import {
  getStoredMetrics,
  getAverageMetrics,
  getPerformanceScore,
  clearStoredMetrics,
  type WebVitalsMetric,
} from '../../lib/performance/web-vitals';

interface MetricCardProps {
  name: string;
  value: number;
  rating: string;
  count: number;
  description: string;
  unit: string;
}

function MetricCard({ name, value, rating, count, description, unit }: MetricCardProps) {
  const ratingColors = {
    good: 'bg-green-50 border-green-200',
    'needs-improvement': 'bg-orange-50 border-orange-200',
    poor: 'bg-red-50 border-red-200',
  };

  const ratingTextColors = {
    good: 'text-green-700',
    'needs-improvement': 'text-orange-700',
    poor: 'text-red-700',
  };

  const ratingIcons = {
    good: '✓',
    'needs-improvement': '◐',
    poor: '!',
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${ratingColors[rating as keyof typeof ratingColors]}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-medium text-gray-600">{name}</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-gray-900">
              {value.toFixed(value < 10 ? 2 : 0)}
            </span>
            <span className="text-sm text-gray-600">{unit}</span>
          </div>
        </div>
        <div className={`text-2xl ${ratingTextColors[rating as keyof typeof ratingTextColors]}`}>
          {ratingIcons[rating as keyof typeof ratingIcons]}
        </div>
      </div>
      <p className="text-xs text-gray-600 mb-2">{description}</p>
      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium capitalize ${ratingTextColors[rating as keyof typeof ratingTextColors]}`}>
          {rating.replace('-', ' ')}
        </span>
        <span className="text-gray-500">{count} measurements</span>
      </div>
    </div>
  );
}

function PerformanceScore({ score }: { score: number }) {
  let color = 'text-red-600';
  let bgColor = 'bg-red-50';
  let label = 'Poor';

  if (score >= 90) {
    color = 'text-green-600';
    bgColor = 'bg-green-50';
    label = 'Excellent';
  } else if (score >= 50) {
    color = 'text-orange-600';
    bgColor = 'bg-orange-50';
    label = 'Good';
  }

  return (
    <div className={`p-8 rounded-lg ${bgColor} border-2 ${color.replace('text', 'border')}`}>
      <div className="text-center">
        <h2 className="text-sm font-medium text-gray-600 mb-2">Overall Performance Score</h2>
        <div className={`text-6xl font-bold ${color} mb-2`}>{score}</div>
        <div className={`text-lg font-semibold ${color}`}>{label}</div>
        <p className="text-sm text-gray-600 mt-4">
          Based on Core Web Vitals measurements from your browsing sessions
        </p>
      </div>
    </div>
  );
}

function MetricHistory({ metrics }: { metrics: WebVitalsMetric[] }) {
  // Group by metric name
  const grouped: Record<string, WebVitalsMetric[]> = {};
  metrics.forEach((metric) => {
    if (!grouped[metric.name]) {
      grouped[metric.name] = [];
    }
    grouped[metric.name].push(metric);
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Measurements</h3>
      </div>
      <div className="p-6">
        {Object.keys(grouped).length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No metrics recorded yet. Browse the site to collect performance data.
          </p>
        ) : (
          <div className="space-y-6">
            {Object.keys(grouped).map((name) => {
              const metricGroup = grouped[name].slice(-10); // Last 10 measurements

              return (
                <div key={name}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">{name}</h4>
                  <div className="flex items-end gap-1 h-24">
                    {metricGroup.map((metric, index) => {
                      const maxValue = Math.max(...metricGroup.map((m) => m.value));
                      const height = (metric.value / maxValue) * 100;

                      const barColors = {
                        good: 'bg-green-500',
                        'needs-improvement': 'bg-orange-500',
                        poor: 'bg-red-500',
                      };

                      return (
                        <div
                          key={index}
                          className="flex-1 relative group"
                          title={`${metric.value.toFixed(2)} - ${metric.rating}`}
                        >
                          <div
                            className={`${barColors[metric.rating]} rounded-t transition-all`}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const [averages, setAverages] = useState<ReturnType<typeof getAverageMetrics>>({});
  const [score, setScore] = useState<number>(0);
  const [allMetrics, setAllMetrics] = useState<WebVitalsMetric[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadMetrics();

    // Refresh every 5 seconds to show live updates
    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = () => {
    setAverages(getAverageMetrics());
    setScore(getPerformanceScore());
    setAllMetrics(getStoredMetrics());
  };

  const handleClearMetrics = () => {
    if (confirm('Are you sure you want to clear all stored metrics?')) {
      clearStoredMetrics();
      loadMetrics();
    }
  };

  const handleRunBenchmark = () => {
    // Trigger a page reload to collect fresh metrics
    window.location.reload();
  };

  const metricDescriptions: Record<string, { description: string; unit: string }> = {
    LCP: {
      description: 'Largest Contentful Paint - Time to render the largest content element',
      unit: 'ms',
    },
    FID: {
      description: 'First Input Delay - Time from first interaction to browser response',
      unit: 'ms',
    },
    CLS: {
      description: 'Cumulative Layout Shift - Visual stability score',
      unit: 'score',
    },
    FCP: {
      description: 'First Contentful Paint - Time to first content render',
      unit: 'ms',
    },
    TTFB: {
      description: 'Time to First Byte - Server response time',
      unit: 'ms',
    },
    INP: {
      description: 'Interaction to Next Paint - Overall responsiveness',
      unit: 'ms',
    },
  };

  if (!isClient) {
    return (
      <main className="di-page">
        <section className="di-section">
          <span className="di-kicker">Diamond Insights · Performance</span>
          <h1 className="di-page-title">Performance Metrics</h1>
          <p className="di-page-subtitle">Loading...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="di-page">
      <section className="di-section">
        <div className="mb-8">
          <span className="di-kicker">Diamond Insights · Performance</span>
          <h1 className="di-page-title">Core Web Vitals Monitor</h1>
          <p className="di-page-subtitle">
            Real-time performance monitoring with automated benchmarking across Core Web Vitals metrics.
            Data is collected automatically as you navigate the site.
          </p>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={handleRunBenchmark}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Run Fresh Benchmark
          </button>
          <button
            onClick={handleClearMetrics}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Clear Data
          </button>
        </div>

        {Object.keys(averages).length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              No metrics collected yet
            </h2>
            <p className="text-blue-800 mb-4">
              Navigate through different pages to collect performance data. Metrics are captured automatically
              and will appear here.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <PerformanceScore score={score} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {Object.keys(averages).map((name) => {
                const avg = averages[name];
                const desc = metricDescriptions[name] || {
                  description: 'Performance metric',
                  unit: 'ms',
                };

                return (
                  <MetricCard
                    key={name}
                    name={name}
                    value={avg.value}
                    rating={avg.rating}
                    count={avg.count}
                    description={desc.description}
                    unit={desc.unit}
                  />
                );
              })}
            </div>

            <MetricHistory metrics={allMetrics} />
          </>
        )}

        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">About Core Web Vitals</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Core Web Vitals</strong> are a set of metrics defined by Google to measure user experience:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <strong>LCP (Largest Contentful Paint):</strong> Should be under 2.5s for good performance
              </li>
              <li>
                <strong>FID (First Input Delay):</strong> Should be under 100ms for good responsiveness
              </li>
              <li>
                <strong>CLS (Cumulative Layout Shift):</strong> Should be under 0.1 for visual stability
              </li>
              <li>
                <strong>INP (Interaction to Next Paint):</strong> Should be under 200ms for good interactivity
              </li>
            </ul>
            <p className="mt-4">
              These metrics are automatically collected as you use the site and stored locally in your browser.
              Use this dashboard to monitor performance and identify optimization opportunities.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
