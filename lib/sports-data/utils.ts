/**
 * BLAZE SPORTS INTEL | Utilities Module
 * Production-ready utility functions with America/Chicago timezone
 *
 * @module utils
 * @version 10.0.0
 */

// ==================== DATA FORMATTING ====================

export const formatNumber = (num: number, decimals: number = 1): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
  return num.toLocaleString();
};

export const formatCurrency = (value: number | string, currency: string = 'USD'): string => {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formats timestamps to America/Chicago timezone (as per user requirements)
 */
export const formatTimestamp = (timestamp: Date | string | number, format: 'short' | 'long' | 'relative' = 'short'): string => {
  const date = new Date(timestamp);

  if (format === 'relative') {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  if (format === 'long') {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Chicago',
      timeZoneName: 'short'
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Chicago'
  });
};

/**
 * Get current timestamp in America/Chicago timezone for data citations
 */
export const getDataStamp = (): string => {
  return new Date().toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Chicago',
    timeZoneName: 'short'
  });
};

// ==================== DATA ANALYSIS ====================

export const calculateTrend = (data: any[], threshold: number = 2): 'up' | 'down' | 'stable' => {
  if (!data || data.length < 2) return 'stable';

  const recent = data[data.length - 1].val;
  const previous = data[data.length - 2].val;
  const diff = recent - previous;

  if (diff > threshold) return 'up';
  if (diff < -threshold) return 'down';
  return 'stable';
};

export const calculateMovingAverage = (values: number[], period: number = 5): (number | null)[] => {
  const result: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
};

export const calculatePercentile = (value: number, dataset: number[]): number => {
  const sorted = [...dataset].sort((a, b) => a - b);
  const below = sorted.filter(v => v < value).length;
  return (below / sorted.length) * 100;
};

// ==================== COLOR & THEMING ====================

export const getRiskColor = (risk: number): string => {
  if (risk < 30) return '#10b981'; // Green - low risk
  if (risk < 60) return '#f59e0b'; // Yellow - moderate risk
  return '#ef4444'; // Red - high risk
};

export const getPerformanceColor = (rating: number): string => {
  if (rating >= 90) return '#10b981'; // Elite
  if (rating >= 75) return '#3b82f6'; // Good
  if (rating >= 60) return '#f59e0b'; // Average
  return '#ef4444'; // Below average
};

// ==================== DATA EXPORT ====================

export const exportToCSV = (data: any[], filename: string): void => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      const stringValue = String(value ?? '');
      return stringValue.includes(',') || stringValue.includes('"')
        ? `"${stringValue.replace(/"/g, '""')}"`
        : stringValue;
    }).join(','))
  ].join('\n');

  downloadFile(csvContent, `${filename}_${getTimestamp()}.csv`, 'text/csv');
};

export const exportToJSON = (data: any, filename: string, pretty: boolean = true): void => {
  const jsonContent = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  downloadFile(jsonContent, `${filename}_${getTimestamp()}.json`, 'application/json');
};

const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .split('.')[0];
};

// ==================== API HELPERS ====================

export const fetchAPI = async (url: string, options: RequestInit = {}): Promise<{success: boolean, data: any, error: string | null}> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data, error: null };
  } catch (error) {
    console.error('API Fetch Error:', error);
    return { success: false, data: null, error: (error as Error).message };
  }
};

// ==================== PERFORMANCE ====================

export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(func: T, limit: number) => {
  let inThrottle: boolean;
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
