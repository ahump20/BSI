/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BLAZE SPORTS INTEL - CHART LIBRARY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Production-grade chart integration for blazesportsintel.com
 * Version: 2.0.0
 * Dependencies: Chart.js 4.x
 *
 * Features:
 * - Responsive charts with glassmorphism styling
 * - Accessible keyboard navigation
 * - Custom branded tooltips
 * - Mobile-optimized interactions
 * - Real-time data updates
 * ═══════════════════════════════════════════════════════════════════════════
 */

/* ========================================================================== */
/* 1. GLOBAL CHART CONFIGURATION - ENHANCED                                   */
/* ========================================================================== */

const BlazeCharts = {
  // Default configuration for all charts (ENHANCED)
  defaults: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'start',
        labels: {
          color: 'rgba(255, 255, 255, 0.92)',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 14,
            weight: 500,
          },
          padding: 16,
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          // Enhanced with text shadow
          generateLabels: function(chart) {
            const original = Chart.defaults.plugins.legend.labels.generateLabels;
            const labels = original.call(this, chart);

            // Add glow effect to legend labels
            labels.forEach(label => {
              label.fontColor = 'rgba(255, 255, 255, 0.92)';
            });

            return labels;
          }
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        titleColor: '#BF5700',
        bodyColor: 'rgba(255, 255, 255, 0.92)',
        footerColor: 'rgba(255, 255, 255, 0.75)',
        borderColor: 'rgba(191, 87, 0, 0.8)',
        borderWidth: 2,
        cornerRadius: 16,
        padding: 20,
        displayColors: true,
        boxWidth: 14,
        boxHeight: 14,
        boxPadding: 6,
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 15,
          weight: 700,
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 14,
          weight: 400,
        },
        footerFont: {
          family: 'SF Mono, Consolas, monospace',
          size: 12,
          weight: 400,
        },
        // Enhanced shadow
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        shadowBlur: 12,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        callbacks: {
          // Custom label formatting
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
            }
            return label;
          },
          // Add footer with data source
          footer: function(tooltipItems) {
            return `Data: ${new Date().toLocaleDateString('en-US')}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.08)',
          lineWidth: 1,
          // Add glow to grid lines
          drawTicks: true,
          tickLength: 8,
          tickColor: 'rgba(191, 87, 0, 0.3)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.75)',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
          },
          padding: 12,
        },
        border: {
          color: 'rgba(191, 87, 0, 0.5)',
          width: 2,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.08)',
          lineWidth: 1,
          drawTicks: true,
          tickLength: 8,
          tickColor: 'rgba(191, 87, 0, 0.3)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.75)',
          font: {
            family: 'SF Mono, Consolas, monospace',
            size: 12,
          },
          padding: 12,
        },
        border: {
          color: 'rgba(191, 87, 0, 0.5)',
          width: 2,
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
      // Enhanced animation with delay
      delay: (context) => {
        let delay = 0;
        if (context.type === 'data' && context.mode === 'default') {
          delay = context.dataIndex * 30 + context.datasetIndex * 100;
        }
        return delay;
      },
    },
    // Add glow effect plugin
    plugins: [
      {
        id: 'chartGlow',
        beforeDraw: (chart) => {
          const ctx = chart.ctx;
          ctx.save();
          ctx.shadowColor = 'rgba(191, 87, 0, 0.3)';
          ctx.shadowBlur = 15;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        },
        afterDraw: (chart) => {
          chart.ctx.restore();
        }
      }
    ]
  },

  // Brand colors
  colors: {
    primary: '#BF5700',
    secondary: '#9C4500',
    tertiary: '#D66D1A',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },

  // Color palettes for multi-dataset charts
  palettes: {
    brand: [
      '#BF5700', '#CC6600', '#D97B38', '#E69551', '#FFB366'
    ],
    categorical: [
      '#BF5700', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
      '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'
    ],
  },
};

/* ========================================================================== */
/* 2. STANDINGS PROGRESSION LINE CHART                                        */
/* ========================================================================== */

/**
 * Create a line chart showing win percentage progression over the season
 * @param {string} canvasId - Canvas element ID
 * @param {Array} teams - Array of team objects with standings data
 * @param {Object} options - Additional chart options
 */
BlazeCharts.createStandingsProgressionChart = function(canvasId, teams, options = {}) {
  const ctx = document.getElementById(canvasId).getContext('2d');

  // Process data for multiple teams
  const datasets = teams.map((team, index) => {
    const color = BlazeCharts.palettes.categorical[index % BlazeCharts.palettes.categorical.length];

    return {
      label: team.name,
      data: team.winPercentageHistory, // Array of {x: date, y: winPct}
      borderColor: color,
      backgroundColor: `${color}33`, // Add alpha for area fill
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: color,
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      tension: 0.4,
      fill: false,
    };
  });

  const config = {
    type: 'line',
    data: { datasets },
    options: {
      ...BlazeCharts.defaults,
      ...options,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'week',
            displayFormats: {
              week: 'MMM D'
            }
          },
          ...BlazeCharts.defaults.scales.x,
          title: {
            display: true,
            text: 'Date',
            color: 'rgba(255, 255, 255, 0.75)',
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 14,
              weight: 600,
            }
          }
        },
        y: {
          ...BlazeCharts.defaults.scales.y,
          min: 0,
          max: 1,
          ticks: {
            ...BlazeCharts.defaults.scales.y.ticks,
            callback: function(value) {
              return (value * 100).toFixed(0) + '%';
            }
          },
          title: {
            display: true,
            text: 'Win Percentage',
            color: 'rgba(255, 255, 255, 0.75)',
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 14,
              weight: 600,
            }
          }
        }
      },
      plugins: {
        ...BlazeCharts.defaults.plugins,
        title: {
          display: true,
          text: 'Conference Standings Progression',
          color: '#BF5700',
          font: {
            family: 'Bebas Neue, Impact, sans-serif',
            size: 24,
            weight: 700,
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
          ...BlazeCharts.defaults.plugins.tooltip,
          callbacks: {
            label: function(context) {
              const team = context.dataset.label;
              const winPct = (context.parsed.y * 100).toFixed(1);
              return `${team}: ${winPct}%`;
            },
            footer: function(tooltipItems) {
              const date = new Date(tooltipItems[0].parsed.x);
              return `Date: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            }
          }
        }
      }
    }
  };

  return new Chart(ctx, config);
};

/* ========================================================================== */
/* 3. RPI DISTRIBUTION HISTOGRAM                                              */
/* ========================================================================== */

/**
 * Create a bar chart showing RPI distribution across teams
 * @param {string} canvasId - Canvas element ID
 * @param {Array} teams - Array of team objects with RPI data
 * @param {Object} options - Additional chart options
 */
BlazeCharts.createRPIHistogram = function(canvasId, teams, options = {}) {
  const ctx = document.getElementById(canvasId).getContext('2d');

  // Sort teams by RPI
  const sortedTeams = [...teams].sort((a, b) => a.rpi - b.rpi);

  // Color code by tournament seed likelihood
  const backgroundColors = sortedTeams.map((team, index) => {
    if (index < 8) return BlazeCharts.colors.success; // Tournament locks
    if (index < 16) return BlazeCharts.colors.warning; // Bubble teams
    return BlazeCharts.colors.error; // Outside looking in
  });

  const config = {
    type: 'bar',
    data: {
      labels: sortedTeams.map(t => t.abbreviation || t.name.substring(0, 10)),
      datasets: [{
        label: 'RPI Ranking',
        data: sortedTeams.map(t => t.rpi),
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(c => c + 'CC'),
        borderWidth: 2,
        borderRadius: 8,
      }]
    },
    options: {
      ...BlazeCharts.defaults,
      ...options,
      indexAxis: 'y', // Horizontal bars
      scales: {
        x: {
          ...BlazeCharts.defaults.scales.x,
          title: {
            display: true,
            text: 'RPI Ranking (Lower is Better)',
            color: 'rgba(255, 255, 255, 0.75)',
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 14,
              weight: 600,
            }
          },
          reverse: true, // Lower RPI = better ranking
        },
        y: {
          ...BlazeCharts.defaults.scales.y,
          grid: {
            display: false,
          }
        }
      },
      plugins: {
        ...BlazeCharts.defaults.plugins,
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: 'RPI Rankings & Tournament Implications',
          color: '#BF5700',
          font: {
            family: 'Bebas Neue, Impact, sans-serif',
            size: 24,
            weight: 700,
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
          ...BlazeCharts.defaults.plugins.tooltip,
          callbacks: {
            label: function(context) {
              const team = sortedTeams[context.dataIndex];
              return [
                `RPI: ${team.rpi}`,
                `Record: ${team.wins}-${team.losses}`,
                `SOS: ${team.sos}`,
              ];
            },
            title: function(tooltipItems) {
              return sortedTeams[tooltipItems[0].dataIndex].name;
            },
            footer: function(tooltipItems) {
              const index = tooltipItems[0].dataIndex;
              if (index < 8) return 'Tournament Lock';
              if (index < 16) return 'Bubble Team';
              return 'Needs Strong Finish';
            }
          }
        }
      }
    }
  };

  return new Chart(ctx, config);
};

/* ========================================================================== */
/* 4. PLAYER PERFORMANCE SPARKLINE                                            */
/* ========================================================================== */

/**
 * Create a small inline sparkline chart for player stats
 * @param {string} canvasId - Canvas element ID
 * @param {Array} dataPoints - Array of stat values over time
 * @param {Object} options - Additional chart options
 */
BlazeCharts.createSparkline = function(canvasId, dataPoints, options = {}) {
  const ctx = document.getElementById(canvasId).getContext('2d');

  const config = {
    type: 'line',
    data: {
      labels: dataPoints.map((_, i) => `Game ${i + 1}`),
      datasets: [{
        data: dataPoints,
        borderColor: BlazeCharts.colors.primary,
        backgroundColor: `${BlazeCharts.colors.primary}33`,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: BlazeCharts.colors.primary,
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          titleColor: '#BF5700',
          bodyColor: 'rgba(255, 255, 255, 0.92)',
          borderColor: 'rgba(191, 87, 0, 0.5)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: function(tooltipItems) {
              return `Game ${tooltipItems[0].dataIndex + 1}`;
            },
            label: function(context) {
              return `${context.parsed.y.toFixed(3)}`;
            }
          }
        }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      },
      animation: {
        duration: 500,
      },
      ...options,
    }
  };

  return new Chart(ctx, config);
};

/* ========================================================================== */
/* 5. HEAT MAP (Shot Charts / Field Position)                                 */
/* ========================================================================== */

/**
 * Create a heat map for spatial data (batting spray charts, field positions)
 * @param {string} canvasId - Canvas element ID
 * @param {Array} dataPoints - Array of {x, y, value} objects
 * @param {Object} options - Additional chart options
 */
BlazeCharts.createHeatMap = function(canvasId, dataPoints, options = {}) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');

  // Custom heat map rendering (Chart.js doesn't have native heat map support)
  const width = canvas.width;
  const height = canvas.height;

  // Find min/max for scaling
  const values = dataPoints.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  // Draw heat map points
  dataPoints.forEach(point => {
    const intensity = (point.value - minVal) / (maxVal - minVal);
    const radius = 20 + (intensity * 30); // 20-50px radius

    // Create gradient
    const gradient = ctx.createRadialGradient(
      point.x * width,
      point.y * height,
      0,
      point.x * width,
      point.y * height,
      radius
    );

    // Color based on intensity
    const alpha = 0.3 + (intensity * 0.5); // 0.3-0.8 alpha
    const color = intensity > 0.7 ? BlazeCharts.colors.error :
                  intensity > 0.4 ? BlazeCharts.colors.warning :
                  BlazeCharts.colors.success;

    gradient.addColorStop(0, `${color}${Math.round(alpha * 255).toString(16)}`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x * width, point.y * height, radius, 0, 2 * Math.PI);
    ctx.fill();
  });

  // Add tooltip on hover
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) / rect.width;
    const mouseY = (event.clientY - rect.top) / rect.height;

    // Find nearest data point
    let nearest = null;
    let minDist = Infinity;

    dataPoints.forEach(point => {
      const dist = Math.sqrt(
        Math.pow(point.x - mouseX, 2) + Math.pow(point.y - mouseY, 2)
      );
      if (dist < minDist && dist < 0.05) { // Within 5% of canvas
        minDist = dist;
        nearest = point;
      }
    });

    if (nearest) {
      canvas.title = `Value: ${nearest.value.toFixed(2)}`;
      canvas.style.cursor = 'pointer';
    } else {
      canvas.title = '';
      canvas.style.cursor = 'default';
    }
  });

  return { canvas, ctx };
};

/* ========================================================================== */
/* 6. UTILITY FUNCTIONS                                                       */
/* ========================================================================== */

/**
 * Update chart data dynamically
 * @param {Chart} chart - Chart.js instance
 * @param {Array} newData - New dataset
 */
BlazeCharts.updateChartData = function(chart, newData) {
  chart.data.datasets.forEach((dataset, index) => {
    dataset.data = newData[index];
  });
  chart.update('active');
};

/**
 * Destroy and recreate chart (for major config changes)
 * @param {Chart} chart - Chart.js instance
 */
BlazeCharts.refreshChart = function(chart) {
  const canvas = chart.canvas;
  const config = chart.config;
  chart.destroy();
  return new Chart(canvas, config);
};

/**
 * Export chart as image
 * @param {Chart} chart - Chart.js instance
 * @param {string} filename - Output filename
 */
BlazeCharts.exportChartImage = function(chart, filename = 'chart.png') {
  const url = chart.toBase64Image();
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
};

/**
 * Create responsive chart container
 * @param {string} containerId - Container element ID
 * @param {string} canvasId - Canvas element ID
 * @param {number} aspectRatio - Width/Height ratio (default: 2)
 */
BlazeCharts.createChartContainer = function(containerId, canvasId, aspectRatio = 2) {
  const container = document.getElementById(containerId);
  container.style.position = 'relative';
  container.style.width = '100%';
  container.style.paddingBottom = `${(1 / aspectRatio) * 100}%`;

  const canvas = document.createElement('canvas');
  canvas.id = canvasId;
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  container.appendChild(canvas);
  return canvas;
};

/* ========================================================================== */
/* 7. ACCESSIBILITY ENHANCEMENTS                                              */
/* ========================================================================== */

/**
 * Add keyboard navigation to chart
 * @param {Chart} chart - Chart.js instance
 */
BlazeCharts.addKeyboardNavigation = function(chart) {
  const canvas = chart.canvas;
  canvas.tabIndex = 0;

  let currentIndex = 0;

  canvas.addEventListener('keydown', (event) => {
    const dataLength = chart.data.datasets[0].data.length;

    switch (event.key) {
      case 'ArrowRight':
        currentIndex = (currentIndex + 1) % dataLength;
        chart.setActiveElements([{ datasetIndex: 0, index: currentIndex }]);
        chart.tooltip.setActiveElements([{ datasetIndex: 0, index: currentIndex }]);
        chart.update();
        event.preventDefault();
        break;

      case 'ArrowLeft':
        currentIndex = (currentIndex - 1 + dataLength) % dataLength;
        chart.setActiveElements([{ datasetIndex: 0, index: currentIndex }]);
        chart.tooltip.setActiveElements([{ datasetIndex: 0, index: currentIndex }]);
        chart.update();
        event.preventDefault();
        break;
    }
  });

  // Announce to screen readers
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', chart.options.plugins.title?.text || 'Chart visualization');
};

/**
 * Generate accessible data table from chart
 * @param {Chart} chart - Chart.js instance
 * @returns {string} HTML table string
 */
BlazeCharts.generateAccessibleTable = function(chart) {
  let html = '<table class="blaze-table"><thead><tr><th>Label</th>';

  chart.data.datasets.forEach(dataset => {
    html += `<th>${dataset.label}</th>`;
  });

  html += '</tr></thead><tbody>';

  chart.data.labels.forEach((label, index) => {
    html += `<tr><td>${label}</td>`;
    chart.data.datasets.forEach(dataset => {
      html += `<td class="stat-cell">${dataset.data[index]}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
};

/* ========================================================================== */
/* END OF CHART LIBRARY                                                       */
/* ========================================================================== */

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlazeCharts;
}
