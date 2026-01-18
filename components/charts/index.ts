/**
 * BSI Charts - uPlot React Wrappers
 *
 * Prerequisites: Install uplot
 *   npm install uplot
 *   # or
 *   pnpm add uplot
 *
 * Usage:
 *   import { WinProbabilityChart, Sparkline, UPlotChart } from '@/components/charts';
 *
 *   <WinProbabilityChart
 *     timestamps={[0, 1, 2, 3]}
 *     homeProbability={[0.5, 0.6, 0.55, 0.72]}
 *     homeTeam="Texas"
 *     awayTeam="Arkansas"
 *   />
 *
 *   <Sparkline data={[12, 15, 8, 22, 18]} />
 */

export { UPlotChart, BSI_CHART_COLORS, SERIES_COLORS, getBSIAxes } from './UPlotChart';
export { WinProbabilityChart } from './WinProbabilityChart';
export { Sparkline } from './Sparkline';

// Type exports for consumers
export type { Options as UPlotOptions, AlignedData as UPlotData } from 'uplot';
