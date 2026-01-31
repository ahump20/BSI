/**
 * Blaze Sports Intel - Advanced Chart Components Library
 *
 * Comprehensive visualization components built on Chart.js 4.4.0
 * Supports real-time updates, interactive features, and consistent theming.
 *
 * Chart Types:
 * - Line Charts (trends, time series)
 * - Bar Charts (comparisons, distributions)
 * - Pie/Doughnut Charts (proportions, breakdowns)
 * - Area Charts (cumulative data, ranges)
 * - Scatter Plots (correlations, clusters)
 * - Heat Maps (density, performance matrices)
 * - Radar Charts (multi-dimensional comparisons)
 * - Mixed Charts (combined visualizations)
 *
 * Features:
 * - Dark theme optimized
 * - Responsive design
 * - Real-time data updates
 * - Interactive tooltips
 * - Click handlers
 * - Zoom/pan capabilities
 * - Export to image
 * - Animation controls
 *
 * Usage:
 * const chart = new BlazeChart('canvas-id', 'line', data, options);
 * chart.updateData(newData);
 * chart.destroy();
 */

// Base theme configuration
const BLAZE_THEME = {
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#4ade80',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    light: '#f8fafc',
    dark: '#1a1a2e',
    grid: 'rgba(255, 255, 255, 0.1)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)'
  },
  gradients: {
    primary: ['#667eea', '#764ba2'],
    success: ['#4ade80', '#3b82f6'],
    warning: ['#f59e0b', '#ef4444'],
    multi: ['#667eea', '#764ba2', '#4ade80', '#f59e0b', '#ef4444', '#3b82f6']
  },
  fonts: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    size: {
      title: 16,
      label: 12,
      tick: 11
    }
  }
};

// Chart.js default configuration
Chart.defaults.color = BLAZE_THEME.colors.text;
Chart.defaults.borderColor = BLAZE_THEME.colors.grid;
Chart.defaults.font.family = BLAZE_THEME.fonts.family;

/**
 * Base Chart Class
 * All specific chart types extend this class
 */
class BlazeChart {
  constructor(canvasId, type, data, customOptions = {}) {
    this.canvasId = canvasId;
    this.type = type;
    this.canvas = document.getElementById(canvasId);

    if (!this.canvas) {
      console.error(`Canvas element not found: ${canvasId}`);
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.data = data;
    this.customOptions = customOptions;
    this.chart = null;
    this.animationFrame = null;

    this.init();
  }

  init() {
    const config = {
      type: this.type,
      data: this.prepareData(this.data),
      options: this.getOptions()
    };

    this.chart = new Chart(this.ctx, config);
  }

  prepareData(data) {
    // Override in subclasses for specific data transformations
    return data;
  }

  getBaseOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: BLAZE_THEME.colors.text,
            font: {
              size: BLAZE_THEME.fonts.size.label,
              family: BLAZE_THEME.fonts.family
            },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          titleColor: BLAZE_THEME.colors.text,
          bodyColor: BLAZE_THEME.colors.text,
          borderColor: BLAZE_THEME.colors.primary,
          borderWidth: 2,
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          callbacks: this.getTooltipCallbacks()
        }
      },
      animation: {
        duration: 750,
        easing: 'easeInOutQuart'
      }
    };
  }

  getOptions() {
    const baseOptions = this.getBaseOptions();
    return this.mergeDeep(baseOptions, this.customOptions);
  }

  getTooltipCallbacks() {
    return {
      label: function(context) {
        let label = context.dataset.label || '';
        if (label) {
          label += ': ';
        }
        if (context.parsed.y !== null) {
          label += context.parsed.y.toLocaleString();
        }
        return label;
      }
    };
  }

  updateData(newData) {
    if (!this.chart) return;

    this.data = newData;
    this.chart.data = this.prepareData(newData);
    this.chart.update('active');
  }

  updateOptions(newOptions) {
    if (!this.chart) return;

    this.customOptions = newOptions;
    this.chart.options = this.getOptions();
    this.chart.update();
  }

  addData(label, data) {
    if (!this.chart) return;

    this.chart.data.labels.push(label);
    this.chart.data.datasets.forEach((dataset, index) => {
      dataset.data.push(data[index]);
    });
    this.chart.update();
  }

  removeData() {
    if (!this.chart) return;

    this.chart.data.labels.shift();
    this.chart.data.datasets.forEach((dataset) => {
      dataset.data.shift();
    });
    this.chart.update();
  }

  exportImage(format = 'png') {
    if (!this.chart) return null;

    return this.canvas.toDataURL(`image/${format}`);
  }

  downloadImage(filename = 'chart', format = 'png') {
    const dataUrl = this.exportImage(format);
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
    link.href = dataUrl;
    link.click();
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  mergeDeep(target, source) {
    const output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.mergeDeep(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
}

/**
 * Line Chart Component
 * Perfect for trends, time series data, and comparisons over time
 */
class LineChart extends BlazeChart {
  constructor(canvasId, data, options = {}) {
    super(canvasId, 'line', data, options);
  }

  prepareData(data) {
    const prepared = {
      labels: data.labels || [],
      datasets: (data.datasets || []).map((dataset, index) => ({
        label: dataset.label || `Series ${index + 1}`,
        data: dataset.data || [],
        borderColor: dataset.borderColor || BLAZE_THEME.gradients.multi[index % BLAZE_THEME.gradients.multi.length],
        backgroundColor: dataset.backgroundColor || this.getGradientFill(dataset.borderColor || BLAZE_THEME.gradients.multi[index]),
        borderWidth: dataset.borderWidth || 3,
        tension: dataset.tension !== undefined ? dataset.tension : 0.4,
        fill: dataset.fill !== undefined ? dataset.fill : true,
        pointRadius: dataset.pointRadius || 4,
        pointHoverRadius: dataset.pointHoverRadius || 6,
        pointBackgroundColor: dataset.pointBackgroundColor || dataset.borderColor || BLAZE_THEME.colors.primary,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: dataset.borderColor || BLAZE_THEME.colors.primary
      }))
    };

    return prepared;
  }

  getGradientFill(color) {
    if (!this.ctx) return color;

    const gradient = this.ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, this.hexToRgba(color, 0.4));
    gradient.addColorStop(1, this.hexToRgba(color, 0.0));
    return gradient;
  }

  getOptions() {
    const baseOptions = super.getOptions();
    const lineOptions = {
      scales: {
        x: {
          ticks: {
            color: BLAZE_THEME.colors.textSecondary,
            font: {
              size: BLAZE_THEME.fonts.size.tick
            },
            maxTicksLimit: 12
          },
          grid: {
            color: BLAZE_THEME.colors.grid,
            drawBorder: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: BLAZE_THEME.colors.textSecondary,
            font: {
              size: BLAZE_THEME.fonts.size.tick
            },
            callback: function(value) {
              return value.toLocaleString();
            }
          },
          grid: {
            color: BLAZE_THEME.colors.grid,
            drawBorder: false
          }
        }
      }
    };

    return this.mergeDeep(baseOptions, lineOptions);
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

/**
 * Bar Chart Component
 * Ideal for comparing values across categories or time periods
 */
class BarChart extends BlazeChart {
  constructor(canvasId, data, options = {}) {
    const defaultOptions = {
      horizontal: false,
      stacked: false
    };
    super(canvasId, options.horizontal ? 'bar' : 'bar', data, { ...defaultOptions, ...options });
  }

  prepareData(data) {
    const prepared = {
      labels: data.labels || [],
      datasets: (data.datasets || []).map((dataset, index) => ({
        label: dataset.label || `Series ${index + 1}`,
        data: dataset.data || [],
        backgroundColor: dataset.backgroundColor || this.getBarGradient(index),
        borderColor: dataset.borderColor || BLAZE_THEME.gradients.multi[index % BLAZE_THEME.gradients.multi.length],
        borderWidth: dataset.borderWidth || 2,
        borderRadius: dataset.borderRadius || 8,
        borderSkipped: false,
        barPercentage: dataset.barPercentage || 0.8,
        categoryPercentage: dataset.categoryPercentage || 0.9
      }))
    };

    return prepared;
  }

  getBarGradient(index) {
    if (!this.ctx) return BLAZE_THEME.gradients.multi[index % BLAZE_THEME.gradients.multi.length];

    const gradient = this.ctx.createLinearGradient(0, 0, 0, 400);
    const color = BLAZE_THEME.gradients.multi[index % BLAZE_THEME.gradients.multi.length];
    gradient.addColorStop(0, this.hexToRgba(color, 0.8));
    gradient.addColorStop(1, this.hexToRgba(color, 0.4));
    return gradient;
  }

  getOptions() {
    const baseOptions = super.getOptions();
    const barOptions = {
      indexAxis: this.customOptions.horizontal ? 'y' : 'x',
      scales: {
        x: {
          stacked: this.customOptions.stacked || false,
          ticks: {
            color: BLAZE_THEME.colors.textSecondary,
            font: {
              size: BLAZE_THEME.fonts.size.tick
            }
          },
          grid: {
            color: BLAZE_THEME.colors.grid,
            drawBorder: false
          }
        },
        y: {
          stacked: this.customOptions.stacked || false,
          beginAtZero: true,
          ticks: {
            color: BLAZE_THEME.colors.textSecondary,
            font: {
              size: BLAZE_THEME.fonts.size.tick
            },
            callback: function(value) {
              return value.toLocaleString();
            }
          },
          grid: {
            color: BLAZE_THEME.colors.grid,
            drawBorder: false
          }
        }
      }
    };

    return this.mergeDeep(baseOptions, barOptions);
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

/**
 * Pie/Doughnut Chart Component
 * Great for showing proportions and percentages
 */
class PieChart extends BlazeChart {
  constructor(canvasId, data, options = {}) {
    const defaultOptions = {
      doughnut: false,
      cutout: '50%'
    };
    const mergedOptions = { ...defaultOptions, ...options };
    super(canvasId, mergedOptions.doughnut ? 'doughnut' : 'pie', data, mergedOptions);
  }

  prepareData(data) {
    const prepared = {
      labels: data.labels || [],
      datasets: [{
        data: data.data || [],
        backgroundColor: data.backgroundColor || BLAZE_THEME.gradients.multi,
        borderColor: data.borderColor || BLAZE_THEME.colors.dark,
        borderWidth: data.borderWidth || 3,
        hoverOffset: 15
      }]
    };

    return prepared;
  }

  getOptions() {
    const baseOptions = super.getOptions();
    const pieOptions = {
      cutout: this.customOptions.doughnut ? this.customOptions.cutout : 0,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            generateLabels: (chart) => {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i];
                  const percentage = ((value / total) * 100).toFixed(1);
                  return {
                    text: `${label}: ${percentage}%`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    hidden: false,
                    index: i
                  };
                });
              }
              return [];
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toLocaleString()} (${percentage}%)`;
            }
          }
        }
      }
    };

    return this.mergeDeep(baseOptions, pieOptions);
  }
}

/**
 * Area Chart Component
 * Shows cumulative data and ranges between values
 */
class AreaChart extends LineChart {
  constructor(canvasId, data, options = {}) {
    const areaOptions = {
      ...options,
      fill: true,
      tension: 0.4
    };
    super(canvasId, data, areaOptions);
  }

  prepareData(data) {
    const lineData = super.prepareData(data);

    // Ensure all datasets have fill enabled
    lineData.datasets = lineData.datasets.map(dataset => ({
      ...dataset,
      fill: true,
      backgroundColor: this.getGradientFill(dataset.borderColor)
    }));

    return lineData;
  }
}

/**
 * Scatter Plot Component
 * Visualizes correlations and clusters in data
 */
class ScatterChart extends BlazeChart {
  constructor(canvasId, data, options = {}) {
    super(canvasId, 'scatter', data, options);
  }

  prepareData(data) {
    const prepared = {
      datasets: (data.datasets || []).map((dataset, index) => ({
        label: dataset.label || `Series ${index + 1}`,
        data: dataset.data || [],
        backgroundColor: dataset.backgroundColor || BLAZE_THEME.gradients.multi[index % BLAZE_THEME.gradients.multi.length],
        borderColor: dataset.borderColor || BLAZE_THEME.gradients.multi[index % BLAZE_THEME.gradients.multi.length],
        pointRadius: dataset.pointRadius || 6,
        pointHoverRadius: dataset.pointHoverRadius || 8,
        pointBorderWidth: 2,
        pointBorderColor: '#ffffff'
      }))
    };

    return prepared;
  }

  getOptions() {
    const baseOptions = super.getOptions();
    const scatterOptions = {
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          ticks: {
            color: BLAZE_THEME.colors.textSecondary,
            font: {
              size: BLAZE_THEME.fonts.size.tick
            }
          },
          grid: {
            color: BLAZE_THEME.colors.grid,
            drawBorder: false
          },
          title: {
            display: this.customOptions.xAxisLabel ? true : false,
            text: this.customOptions.xAxisLabel || '',
            color: BLAZE_THEME.colors.text,
            font: {
              size: BLAZE_THEME.fonts.size.label
            }
          }
        },
        y: {
          ticks: {
            color: BLAZE_THEME.colors.textSecondary,
            font: {
              size: BLAZE_THEME.fonts.size.tick
            }
          },
          grid: {
            color: BLAZE_THEME.colors.grid,
            drawBorder: false
          },
          title: {
            display: this.customOptions.yAxisLabel ? true : false,
            text: this.customOptions.yAxisLabel || '',
            color: BLAZE_THEME.colors.text,
            font: {
              size: BLAZE_THEME.fonts.size.label
            }
          }
        }
      }
    };

    return this.mergeDeep(baseOptions, scatterOptions);
  }

  getTooltipCallbacks() {
    return {
      label: function(context) {
        const point = context.parsed;
        return `(${point.x}, ${point.y})`;
      }
    };
  }
}

/**
 * Radar Chart Component
 * Multi-dimensional comparisons (player stats, team metrics)
 */
class RadarChart extends BlazeChart {
  constructor(canvasId, data, options = {}) {
    super(canvasId, 'radar', data, options);
  }

  prepareData(data) {
    const prepared = {
      labels: data.labels || [],
      datasets: (data.datasets || []).map((dataset, index) => ({
        label: dataset.label || `Series ${index + 1}`,
        data: dataset.data || [],
        borderColor: dataset.borderColor || BLAZE_THEME.gradients.multi[index % BLAZE_THEME.gradients.multi.length],
        backgroundColor: dataset.backgroundColor || this.hexToRgba(
          BLAZE_THEME.gradients.multi[index % BLAZE_THEME.gradients.multi.length],
          0.2
        ),
        borderWidth: dataset.borderWidth || 3,
        pointRadius: dataset.pointRadius || 4,
        pointHoverRadius: dataset.pointHoverRadius || 6,
        pointBackgroundColor: dataset.borderColor || BLAZE_THEME.gradients.multi[index % BLAZE_THEME.gradients.multi.length],
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }))
    };

    return prepared;
  }

  getOptions() {
    const baseOptions = super.getOptions();
    const radarOptions = {
      scales: {
        r: {
          beginAtZero: true,
          ticks: {
            color: BLAZE_THEME.colors.textSecondary,
            backdropColor: 'transparent',
            font: {
              size: BLAZE_THEME.fonts.size.tick
            }
          },
          grid: {
            color: BLAZE_THEME.colors.grid
          },
          pointLabels: {
            color: BLAZE_THEME.colors.text,
            font: {
              size: BLAZE_THEME.fonts.size.label
            }
          }
        }
      }
    };

    return this.mergeDeep(baseOptions, radarOptions);
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

/**
 * Real-time Data Stream Handler
 * Manages live data updates for charts
 */
class RealTimeChartUpdater {
  constructor(chart, updateInterval = 1000) {
    this.chart = chart;
    this.updateInterval = updateInterval;
    this.isRunning = false;
    this.intervalId = null;
    this.dataFetcher = null;
  }

  start(dataFetcher) {
    if (this.isRunning) return;

    this.dataFetcher = dataFetcher;
    this.isRunning = true;

    this.intervalId = setInterval(async () => {
      try {
        const newData = await this.dataFetcher();
        if (newData) {
          this.chart.updateData(newData);
        }
      } catch (error) {
        console.error('Real-time update error:', error);
      }
    }, this.updateInterval);
  }

  stop() {
    if (!this.isRunning) return;

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    this.dataFetcher = null;
  }

  setInterval(newInterval) {
    const wasRunning = this.isRunning;
    if (wasRunning) {
      const fetcher = this.dataFetcher;
      this.stop();
      this.updateInterval = newInterval;
      this.start(fetcher);
    } else {
      this.updateInterval = newInterval;
    }
  }
}

/**
 * Chart Factory
 * Simplified chart creation interface
 */
class ChartFactory {
  static create(type, canvasId, data, options = {}) {
    switch (type.toLowerCase()) {
      case 'line':
        return new LineChart(canvasId, data, options);
      case 'bar':
        return new BarChart(canvasId, data, options);
      case 'pie':
        return new PieChart(canvasId, data, options);
      case 'doughnut':
        return new PieChart(canvasId, data, { ...options, doughnut: true });
      case 'area':
        return new AreaChart(canvasId, data, options);
      case 'scatter':
        return new ScatterChart(canvasId, data, options);
      case 'radar':
        return new RadarChart(canvasId, data, options);
      default:
        console.error(`Unknown chart type: ${type}`);
        return null;
    }
  }

  static createRealTime(type, canvasId, data, dataFetcher, options = {}) {
    const chart = this.create(type, canvasId, data, options);
    if (!chart) return null;

    const updater = new RealTimeChartUpdater(chart, options.updateInterval || 1000);
    updater.start(dataFetcher);

    return {
      chart,
      updater
    };
  }
}

/**
 * Mixed Chart Component
 * Combines multiple chart types in one visualization (e.g., line + bar)
 */
class MixedChart extends BlazeChart {
  constructor(canvasId, data, options = {}) {
    super(canvasId, 'bar', data, options);
  }

  prepareData(data) {
    const prepared = {
      labels: data.labels || [],
      datasets: (data.datasets || []).map((dataset, index) => {
        const baseDataset = {
          label: dataset.label || `Series ${index + 1}`,
          data: dataset.data || [],
          type: dataset.type || 'bar',
          borderColor: dataset.borderColor || BLAZE_THEME.gradients.multi[index % BLAZE_THEME.gradients.multi.length],
          backgroundColor: dataset.backgroundColor || this.getGradientForType(dataset.type, index),
          borderWidth: dataset.borderWidth || 2,
          yAxisID: dataset.yAxisID || 'y'
        };

        // Type-specific properties
        if (dataset.type === 'line') {
          baseDataset.tension = dataset.tension !== undefined ? dataset.tension : 0.4;
          baseDataset.fill = dataset.fill !== undefined ? dataset.fill : false;
          baseDataset.pointRadius = dataset.pointRadius || 4;
          baseDataset.pointHoverRadius = 6;
        } else if (dataset.type === 'bar') {
          baseDataset.borderRadius = 8;
          baseDataset.barPercentage = 0.8;
        }

        return baseDataset;
      })
    };

    return prepared;
  }

  getGradientForType(type, index) {
    if (!this.ctx) return BLAZE_THEME.gradients.multi[index % BLAZE_THEME.gradients.multi.length];

    const color = BLAZE_THEME.gradients.multi[index % BLAZE_THEME.gradients.multi.length];

    if (type === 'line') {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, this.hexToRgba(color, 0.3));
      gradient.addColorStop(1, this.hexToRgba(color, 0.0));
      return gradient;
    } else {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, this.hexToRgba(color, 0.8));
      gradient.addColorStop(1, this.hexToRgba(color, 0.4));
      return gradient;
    }
  }

  getOptions() {
    const baseOptions = super.getOptions();
    const mixedOptions = {
      scales: {
        x: {
          ticks: {
            color: BLAZE_THEME.colors.textSecondary,
            font: { size: BLAZE_THEME.fonts.size.tick }
          },
          grid: {
            color: BLAZE_THEME.colors.grid,
            drawBorder: false
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          ticks: {
            color: BLAZE_THEME.colors.textSecondary,
            font: { size: BLAZE_THEME.fonts.size.tick },
            callback: function(value) {
              return value.toLocaleString();
            }
          },
          grid: {
            color: BLAZE_THEME.colors.grid,
            drawBorder: false
          }
        },
        y1: {
          type: 'linear',
          display: this.customOptions.dualAxis || false,
          position: 'right',
          beginAtZero: true,
          ticks: {
            color: BLAZE_THEME.colors.textSecondary,
            font: { size: BLAZE_THEME.fonts.size.tick }
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    };

    return this.mergeDeep(baseOptions, mixedOptions);
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

/**
 * Chart Zoom and Pan Plugin Wrapper
 * Adds interactive zoom and pan capabilities to charts
 */
class ChartZoomPlugin {
  constructor(chart, options = {}) {
    this.chart = chart;
    this.options = {
      enabled: options.enabled !== undefined ? options.enabled : true,
      mode: options.mode || 'xy',
      limits: options.limits || {},
      ...options
    };
  }

  enable() {
    if (!this.chart.chart) return;

    const zoomOptions = {
      zoom: {
        wheel: {
          enabled: this.options.enabled
        },
        pinch: {
          enabled: this.options.enabled
        },
        mode: this.options.mode
      },
      pan: {
        enabled: this.options.enabled,
        mode: this.options.mode
      },
      limits: this.options.limits
    };

    this.chart.chart.options.plugins = this.chart.chart.options.plugins || {};
    this.chart.chart.options.plugins.zoom = zoomOptions;
    this.chart.chart.update();
  }

  resetZoom() {
    if (this.chart.chart && this.chart.chart.resetZoom) {
      this.chart.chart.resetZoom();
    }
  }
}

/**
 * Advanced Chart Export Manager
 * Handles multiple export formats (PNG, SVG, PDF)
 */
class ChartExportManager {
  constructor(chart) {
    this.chart = chart;
  }

  exportPNG(filename = 'chart', quality = 1.0) {
    if (!this.chart.canvas) return null;

    const dataUrl = this.chart.canvas.toDataURL('image/png', quality);
    this.downloadFile(dataUrl, `${filename}.png`);
    return dataUrl;
  }

  exportSVG(filename = 'chart') {
    if (!this.chart.canvas) return null;

    // Convert canvas to SVG using canvas2svg or similar technique
    const svgData = this.canvasToSVG();
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    this.downloadFile(url, `${filename}.svg`);
    URL.revokeObjectURL(url);
    return svgData;
  }

  exportPDF(filename = 'chart') {
    // Requires jsPDF library
    if (typeof window.jspdf === 'undefined') {
      console.warn('jsPDF library not loaded. Cannot export to PDF.');
      return null;
    }

    const dataUrl = this.chart.canvas.toDataURL('image/png');
    const pdf = new window.jspdf.jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [this.chart.canvas.width, this.chart.canvas.height]
    });

    pdf.addImage(dataUrl, 'PNG', 0, 0, this.chart.canvas.width, this.chart.canvas.height);
    pdf.save(`${filename}.pdf`);
  }

  canvasToSVG() {
    // Simplified SVG conversion (would need full implementation)
    const width = this.chart.canvas.width;
    const height = this.chart.canvas.height;
    const dataUrl = this.chart.canvas.toDataURL('image/png');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image xlink:href="${dataUrl}" width="${width}" height="${height}"/>
</svg>`;
  }

  downloadFile(dataUrl, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  copyToClipboard() {
    if (!this.chart.canvas) return false;

    this.chart.canvas.toBlob((blob) => {
      try {
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        console.log('Chart copied to clipboard');
        return true;
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
      }
    });
  }
}

/**
 * Advanced Animation Controller
 * Custom animations and transitions for charts
 */
class ChartAnimationController {
  constructor(chart) {
    this.chart = chart;
    this.animations = [];
  }

  staggeredAnimation(delay = 50) {
    if (!this.chart.chart) return;

    this.chart.chart.options.animation = {
      duration: 1000,
      easing: 'easeInOutQuart',
      delay: (context) => {
        let delay = 0;
        if (context.type === 'data' && context.mode === 'default') {
          delay = context.dataIndex * 50 + context.datasetIndex * 100;
        }
        return delay;
      }
    };

    this.chart.chart.update();
  }

  progressiveReveal(duration = 2000) {
    if (!this.chart.chart) return;

    this.chart.chart.options.animation = {
      onProgress: (animation) => {
        const progress = animation.currentStep / animation.numSteps;
        this.chart.chart.data.datasets.forEach((dataset, i) => {
          dataset.data = dataset.data.map((value, j) => {
            return j / dataset.data.length <= progress ? value : 0;
          });
        });
      },
      onComplete: () => {
        this.chart.chart.update('none');
      },
      duration: duration,
      easing: 'easeInOutQuart'
    };

    this.chart.chart.update();
  }

  pulseEffect(element = 'point') {
    if (!this.chart.chart) return;

    const animate = () => {
      this.chart.chart.update('active');
      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  stopAnimations() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}

/**
 * Chart Synchronization Manager
 * Syncs interactions across multiple charts
 */
class ChartSynchronizer {
  constructor() {
    this.charts = [];
    this.enabled = true;
  }

  addChart(chart) {
    this.charts.push(chart);
    this.attachListeners(chart);
  }

  removeChart(chart) {
    const index = this.charts.indexOf(chart);
    if (index > -1) {
      this.charts.splice(index, 1);
    }
  }

  attachListeners(chart) {
    if (!chart.canvas) return;

    chart.canvas.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;

      const rect = chart.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.syncTooltips(x, y, chart);
    });
  }

  syncTooltips(x, y, sourceChart) {
    this.charts.forEach(chart => {
      if (chart === sourceChart || !chart.chart) return;

      // Trigger tooltip update on other charts
      const activeElements = chart.chart.getElementsAtEventForMode(
        { x, y },
        'nearest',
        { intersect: false },
        false
      );

      if (activeElements.length > 0) {
        chart.chart.tooltip.setActiveElements(activeElements);
        chart.chart.update('none');
      }
    });
  }

  syncZoom(zoomLevel) {
    this.charts.forEach(chart => {
      if (chart.chart && chart.chart.zoom) {
        chart.chart.zoom(zoomLevel);
      }
    });
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}

/**
 * Sports-Specific Chart Templates
 * Pre-configured charts for common sports analytics
 */
class SportsChartTemplates {
  /**
   * Player Performance Radar Chart
   */
  static playerRadar(canvasId, playerData) {
    const data = {
      labels: playerData.metrics || ['Speed', 'Accuracy', 'Power', 'Defense', 'Stamina', 'Skill'],
      datasets: [{
        label: playerData.name || 'Player',
        data: playerData.values || [0, 0, 0, 0, 0, 0],
        borderColor: BLAZE_THEME.colors.primary,
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        pointBackgroundColor: BLAZE_THEME.colors.primary
      }]
    };

    return new RadarChart(canvasId, data, {
      scales: {
        r: {
          max: 100,
          min: 0,
          ticks: {
            stepSize: 20
          }
        }
      }
    });
  }

  /**
   * Team Win Probability Line Chart
   */
  static winProbability(canvasId, teamData) {
    const data = {
      labels: teamData.games || [],
      datasets: [{
        label: 'Win Probability',
        data: teamData.probabilities || [],
        borderColor: BLAZE_THEME.colors.success,
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };

    return new LineChart(canvasId, data, {
      scales: {
        y: {
          max: 100,
          min: 0,
          ticks: {
            callback: (value) => `${value}%`
          }
        }
      }
    });
  }

  /**
   * Season Performance Mixed Chart (Goals + Win Rate)
   */
  static seasonPerformance(canvasId, seasonData) {
    const data = {
      labels: seasonData.weeks || [],
      datasets: [
        {
          type: 'bar',
          label: 'Points Scored',
          data: seasonData.points || [],
          backgroundColor: 'rgba(102, 126, 234, 0.6)',
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'Win Rate',
          data: seasonData.winRate || [],
          borderColor: BLAZE_THEME.colors.success,
          backgroundColor: 'rgba(74, 222, 128, 0.1)',
          fill: true,
          yAxisID: 'y1'
        }
      ]
    };

    return new MixedChart(canvasId, data, {
      dualAxis: true,
      scales: {
        y: {
          title: {
            display: true,
            text: 'Points'
          }
        },
        y1: {
          title: {
            display: true,
            text: 'Win Rate (%)'
          },
          max: 100,
          min: 0
        }
      }
    });
  }

  /**
   * Player Stats Comparison Bar Chart
   */
  static playerComparison(canvasId, players) {
    const data = {
      labels: players.map(p => p.name),
      datasets: [{
        label: 'Performance Score',
        data: players.map(p => p.score),
        backgroundColor: BLAZE_THEME.gradients.multi,
        borderColor: BLAZE_THEME.gradients.multi,
        borderWidth: 2,
        borderRadius: 8
      }]
    };

    return new BarChart(canvasId, data, {
      horizontal: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    });
  }

  /**
   * Team Statistics Doughnut Chart
   */
  static teamStats(canvasId, statsData) {
    const data = {
      labels: statsData.categories || ['Wins', 'Losses', 'Draws'],
      data: statsData.values || [0, 0, 0],
      backgroundColor: [
        BLAZE_THEME.colors.success,
        BLAZE_THEME.colors.danger,
        BLAZE_THEME.colors.warning
      ]
    };

    return new PieChart(canvasId, data, {
      doughnut: true,
      cutout: '60%'
    });
  }

  /**
   * Historical Trend Area Chart
   */
  static historicalTrend(canvasId, trendData) {
    const data = {
      labels: trendData.seasons || [],
      datasets: [{
        label: trendData.metric || 'Performance',
        data: trendData.values || [],
        borderColor: BLAZE_THEME.colors.primary,
        backgroundColor: 'rgba(102, 126, 234, 0.3)',
        fill: true,
        tension: 0.4
      }]
    };

    return new AreaChart(canvasId, data);
  }
}

/**
 * Enhanced Chart Factory
 * Extended factory with advanced chart types and templates
 */
class AdvancedChartFactory extends ChartFactory {
  static create(type, canvasId, data, options = {}) {
    switch (type.toLowerCase()) {
      case 'mixed':
      case 'combo':
        return new MixedChart(canvasId, data, options);
      default:
        return super.create(type, canvasId, data, options);
    }
  }

  static createSportsChart(templateName, canvasId, data) {
    switch (templateName) {
      case 'playerRadar':
        return SportsChartTemplates.playerRadar(canvasId, data);
      case 'winProbability':
        return SportsChartTemplates.winProbability(canvasId, data);
      case 'seasonPerformance':
        return SportsChartTemplates.seasonPerformance(canvasId, data);
      case 'playerComparison':
        return SportsChartTemplates.playerComparison(canvasId, data);
      case 'teamStats':
        return SportsChartTemplates.teamStats(canvasId, data);
      case 'historicalTrend':
        return SportsChartTemplates.historicalTrend(canvasId, data);
      default:
        console.error(`Unknown template: ${templateName}`);
        return null;
    }
  }

  static withZoom(chart, options = {}) {
    const zoomPlugin = new ChartZoomPlugin(chart, options);
    zoomPlugin.enable();
    chart.zoomPlugin = zoomPlugin;
    return chart;
  }

  static withExport(chart) {
    chart.exportManager = new ChartExportManager(chart);
    return chart;
  }

  static withAnimations(chart) {
    chart.animationController = new ChartAnimationController(chart);
    return chart;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BlazeChart,
    LineChart,
    BarChart,
    PieChart,
    AreaChart,
    ScatterChart,
    RadarChart,
    MixedChart,
    RealTimeChartUpdater,
    ChartFactory,
    AdvancedChartFactory,
    ChartZoomPlugin,
    ChartExportManager,
    ChartAnimationController,
    ChartSynchronizer,
    SportsChartTemplates,
    BLAZE_THEME
  };
}
