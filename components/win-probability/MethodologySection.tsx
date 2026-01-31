import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const methodologyPoints = [
  {
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 20V10M18 20V4M6 20v-4" />
      </svg>
    ),
    title: 'Historical Analysis',
    description:
      'Built on 15+ years of play-by-play data across CFB, NFL, MLB, and college baseball. Each game state is matched against thousands of similar historical situations.',
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: 'Real-Time Factors',
    description:
      'Score differential, time/inning remaining, possession/baserunners, field position/count, and situational context are all weighted dynamically.',
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </svg>
    ),
    title: 'Team Strength Ratings',
    description:
      'Adjusted power ratings account for strength of schedule, margin of victory patterns, and recent performance trends.',
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Home Field Advantage',
    description:
      'Sport-specific home advantage factors: CFB (+2.5 pts), NFL (+1.5 pts), MLB (4%), College BB (varies by venue).',
  },
];

const sportModels = [
  {
    sport: 'College Football',
    accuracy: '82%',
    sampleSize: '12,500+',
    keyFactors: ['Score differential', 'Time remaining', 'Down & distance', 'Field position'],
  },
  {
    sport: 'NFL',
    accuracy: '78%',
    sampleSize: '8,200+',
    keyFactors: ['Score differential', 'Game clock', 'Possession', 'Timeout situation'],
  },
  {
    sport: 'MLB',
    accuracy: '71%',
    sampleSize: '45,000+',
    keyFactors: ['Score differential', 'Inning', 'Outs', 'Baserunner state'],
  },
  {
    sport: 'College Baseball',
    accuracy: '69%',
    sampleSize: '28,000+',
    keyFactors: ['Score differential', 'Inning', 'Run expectancy', 'Pitch count'],
  },
];

export function MethodologySection() {
  return (
    <div className="space-y-6 mt-8">
      {/* Overview */}
      <Card variant="default" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-burnt-orange"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary mb-6 leading-relaxed">
            BSI&apos;s Win Probability Calculator uses a proprietary model combining historical
            play-by-play data with real-time game context. Unlike simple score-based projections,
            our model accounts for situational factors that dramatically affect actual win
            likelihood.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {methodologyPoints.map((point) => (
              <div
                key={point.title}
                className="bg-bg-secondary rounded-lg p-4 border border-border-subtle hover:border-burnt-orange/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-burnt-orange/20 text-burnt-orange flex items-center justify-center">
                    {point.icon}
                  </div>
                  <h4 className="font-semibold text-white text-sm">{point.title}</h4>
                </div>
                <p className="text-text-tertiary text-sm leading-relaxed">{point.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Model Performance */}
      <Card variant="default" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-burnt-orange"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Model Performance by Sport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-3 px-4 text-text-tertiary font-medium">Sport</th>
                  <th className="text-center py-3 px-4 text-text-tertiary font-medium">Accuracy</th>
                  <th className="text-center py-3 px-4 text-text-tertiary font-medium">
                    Sample Size
                  </th>
                  <th className="text-left py-3 px-4 text-text-tertiary font-medium">
                    Key Factors
                  </th>
                </tr>
              </thead>
              <tbody>
                {sportModels.map((model, idx) => (
                  <tr
                    key={model.sport}
                    className={
                      idx !== sportModels.length - 1 ? 'border-b border-border-subtle' : ''
                    }
                  >
                    <td className="py-3 px-4 text-white font-medium">{model.sport}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-success font-semibold">{model.accuracy}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-text-secondary">
                      {model.sampleSize}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">{model.keyFactors.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-bg-tertiary rounded-lg border border-border-subtle">
            <p className="text-xs text-text-tertiary">
              <strong className="text-gold">Note on Accuracy:</strong> Model accuracy is measured by
              comparing predicted win probabilities against actual outcomes using Brier Score. A
              model predicting 70% home win probability should see home teams win approximately 70%
              of such games over a large sample.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Limitations & Caveats */}
      <Card variant="default" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gold"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Limitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-gold">1.</span>
              <p className="text-text-secondary text-sm">
                <strong className="text-white">Not a betting tool:</strong> Win probabilities are
                informational only and should not be used for gambling decisions.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-gold">2.</span>
              <p className="text-text-secondary text-sm">
                <strong className="text-white">Weather & injuries not included:</strong> Current
                model doesn&apos;t account for real-time weather conditions or injury reports.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-gold">3.</span>
              <p className="text-text-secondary text-sm">
                <strong className="text-white">Historical bias:</strong> Rare situations (4th & goal
                with 0:01 left) have smaller sample sizes and higher uncertainty.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-gold">4.</span>
              <p className="text-text-secondary text-sm">
                <strong className="text-white">Team ratings lag:</strong> Power ratings update
                weekly and may not reflect very recent roster changes.
              </p>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card variant="default" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-burnt-orange"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-bg-secondary rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-2">College Football</h4>
              <p className="text-xs text-text-tertiary">ESPN API, NCAA Stats</p>
            </div>
            <div className="bg-bg-secondary rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-2">NFL</h4>
              <p className="text-xs text-text-tertiary">ESPN API, Pro-Football-Reference</p>
            </div>
            <div className="bg-bg-secondary rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-2">MLB</h4>
              <p className="text-xs text-text-tertiary">MLB Stats API via Highlightly Pro</p>
            </div>
            <div className="bg-bg-secondary rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-2">College Baseball</h4>
              <p className="text-xs text-text-tertiary">D1Baseball, NCAA Portal</p>
            </div>
          </div>

          <p className="text-xs text-text-tertiary mt-6 text-center">
            Last model update: January 2025 &bull; Refreshed weekly during season
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
