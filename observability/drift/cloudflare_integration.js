/**
 * Blaze Intelligence - Cloudflare Analytics Engine Integration
 * Real-time drift metrics for championship analytics
 */

import { Analytics } from '@cloudflare/workers-analytics-engine';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle drift metric ingestion
    if (url.pathname === '/api/drift/ingest' && request.method === 'POST') {
      const driftData = await request.json();

      // Write to Analytics Engine
      env.DRIFT_ANALYTICS.writeDataPoint({
        indexes: [driftData.dataset],
        doubles: [
          driftData.ks_statistic || 0,
          driftData.psi_value || 0,
          driftData.quality_score || 0,
        ],
        blobs: [driftData.column, driftData.severity, driftData.test_type],
      });

      // Store critical drifts in KV
      if (driftData.severity === 'CRITICAL') {
        const key = `drift:${driftData.dataset}:${driftData.column}:${Date.now()}`;
        await env.DRIFT_KV.put(key, JSON.stringify(driftData), {
          expirationTtl: 2592000, // 30 days
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Query drift metrics
    if (url.pathname === '/api/drift/query' && request.method === 'GET') {
      const dataset = url.searchParams.get('dataset');
      const timeRange = url.searchParams.get('range') || '24h';

      const query = `
        SELECT
          index1 as dataset,
          blob1 as column,
          blob2 as severity,
          blob3 as test_type,
          double1 as ks_statistic,
          double2 as psi_value,
          double3 as quality_score,
          timestamp
        FROM drift_metrics
        WHERE index1 = '${dataset}'
        AND timestamp >= now() - interval '${timeRange}'
        ORDER BY timestamp DESC
        LIMIT 100
      `;

      const results = await env.DRIFT_ANALYTICS.query(query);

      return new Response(JSON.stringify(results), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=60',
        },
      });
    }

    // Drift dashboard endpoint
    if (url.pathname === '/api/drift/dashboard') {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Blaze Intelligence Drift Dashboard</title>
          <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
          <style>
            body {
              font-family: 'Inter', sans-serif;
              background: linear-gradient(135deg, #BF5700 0%, #002244 100%);
              color: white;
              margin: 0;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 30px;
            }
            h1 {
              font-size: 3em;
              margin: 0;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 20px;
              margin: 40px 0;
            }
            .metric-card {
              background: rgba(255,255,255,0.1);
              backdrop-filter: blur(10px);
              border-radius: 12px;
              padding: 20px;
              border: 1px solid rgba(255,255,255,0.2);
            }
            .metric-value {
              font-size: 2.5em;
              font-weight: bold;
              color: #00B2A9;
            }
            .metric-label {
              margin-top: 10px;
              opacity: 0.9;
            }
            #drift-chart {
              background: white;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔥 Blaze Intelligence Data Drift Monitor</h1>
            <p>Championship-Caliber Analytics for Cardinals, Titans, Longhorns & Grizzlies</p>
          </div>

          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value" id="total-drifts">0</div>
              <div class="metric-label">Total Drift Detections (24h)</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" id="critical-count">0</div>
              <div class="metric-label">Critical Issues</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" id="quality-score">0%</div>
              <div class="metric-label">Overall Data Quality</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" id="latency">0ms</div>
              <div class="metric-label">Processing Latency</div>
            </div>
          </div>

          <div id="drift-chart"></div>

          <script>
            async function loadDriftData() {
              const datasets = ['mlb_stats', 'nfl_titans', 'ncaa_longhorns', 'perfect_game'];
              const allData = [];

              for (const dataset of datasets) {
                const response = await fetch(\`/api/drift/query?dataset=\${dataset}&range=7d\`);
                const data = await response.json();
                allData.push(...data);
              }

              // Update metrics
              document.getElementById('total-drifts').textContent = allData.length;
              document.getElementById('critical-count').textContent =
                allData.filter(d => d.severity === 'CRITICAL').length;
              document.getElementById('quality-score').textContent =
                Math.round(allData.reduce((acc, d) => acc + d.quality_score, 0) / allData.length) + '%';

              // Create time series chart
              const traces = datasets.map(dataset => {
                const datasetData = allData.filter(d => d.dataset === dataset);
                return {
                  x: datasetData.map(d => new Date(d.timestamp)),
                  y: datasetData.map(d => d.ks_statistic),
                  type: 'scatter',
                  mode: 'lines+markers',
                  name: dataset,
                  line: { width: 2 }
                };
              });

              const layout = {
                title: 'KS Statistic Over Time',
                xaxis: { title: 'Time' },
                yaxis: { title: 'KS Statistic' },
                showlegend: true,
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'rgba(0,0,0,0.1)'
              };

              Plotly.newPlot('drift-chart', traces, layout, {responsive: true});
            }

            // Load data on page load
            loadDriftData();

            // Refresh every 60 seconds
            setInterval(loadDriftData, 60000);
          </script>
        </body>
        </html>
      `;

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Alert webhook for critical drifts
    if (url.pathname === '/api/drift/webhook' && request.method === 'POST') {
      const alert = await request.json();

      if (alert.severity === 'CRITICAL') {
        // Send to multiple channels
        const notifications = [];

        // GitHub Issue
        if (env.GITHUB_TOKEN) {
          notifications.push(
            fetch('https://api.github.com/repos/BlazeIntelligence/blazesportsintel/issues', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${env.GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: `[DRIFT] Critical drift in ${alert.dataset}`,
                body: `Detected critical drift: ${JSON.stringify(alert, null, 2)}`,
                labels: ['drift-alert', 'automated'],
              }),
            })
          );
        }

        // Email via Mailgun or SendGrid
        if (env.EMAIL_API_KEY) {
          // Implementation for email service
        }

        await Promise.all(notifications);
      }

      return new Response(JSON.stringify({ notified: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Blaze Intelligence Drift Monitoring API', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },

  async scheduled(event, env, ctx) {
    // Scheduled drift checks
    switch (event.cron) {
      case '0 2 * * *': // 2 AM CT daily
        await runNightlyDriftReport(env);
        break;
      case '*/15 * * * *': // Every 15 minutes
        await checkRealtimeDrift(env);
        break;
    }
  },
};

async function runNightlyDriftReport(env) {
  // Trigger Python drift detector via webhook
  const response = await fetch('https://blazesportsintel.com/api/drift/run-nightly', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.INTERNAL_API_KEY}`,
    },
  });

  if (!response.ok) {
    console.error('Nightly drift report failed:', await response.text());
  }
}

async function checkRealtimeDrift(env) {
  // Quick checks for real-time data streams
  const datasets = ['mlb_stats', 'biomechanics'];

  for (const dataset of datasets) {
    const recent = await env.DRIFT_KV.list({ prefix: `drift:${dataset}:` });

    if (recent.keys.length > 5) {
      // Too many recent drifts - escalate
      console.warn(`High drift rate detected for ${dataset}`);
    }
  }
}
