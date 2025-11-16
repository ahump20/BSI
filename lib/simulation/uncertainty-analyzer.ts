import { BootstrapConfidenceInterval, ConfidenceIntervalResult } from './types';

interface SimulationOutcomes {
  outcomes: number[];
  meanProbability: number;
}

export class UncertaintyAnalyzer {
  calculateConfidenceIntervals(
    simulation: SimulationOutcomes,
    confidenceLevel = 0.95
  ): ConfidenceIntervalResult {
    const sorted = [...simulation.outcomes].sort((a, b) => a - b);
    const n = sorted.length;

    if (n === 0) {
      return {
        pointEstimate: simulation.meanProbability,
        lowerBound: simulation.meanProbability,
        upperBound: simulation.meanProbability,
        standardError: 0,
      };
    }

    const lowerIndex = Math.max(0, Math.floor(n * (1 - confidenceLevel) / 2));
    const upperIndex = Math.min(n - 1, Math.floor(n * (1 + confidenceLevel) / 2));

    return {
      pointEstimate: simulation.meanProbability,
      lowerBound: sorted[lowerIndex],
      upperBound: sorted[upperIndex],
      standardError: this.calculateSE(sorted),
    };
  }

  calculateSE(data: number[]): number {
    const n = data.length;
    if (n === 0) {
      return 0;
    }

    const mean = data.reduce((acc, value) => acc + value, 0) / n;
    const variance = data.reduce((acc, value) => acc + (value - mean) ** 2, 0) / n;
    return Math.sqrt(variance / Math.max(1, n));
  }

  bootstrapCI(
    simulation: SimulationOutcomes,
    iterations = 1000,
    confidenceLevel = 0.95
  ): BootstrapConfidenceInterval {
    if (simulation.outcomes.length === 0) {
      return {
        pointEstimate: simulation.meanProbability,
        lowerBound: simulation.meanProbability,
        upperBound: simulation.meanProbability,
        standardError: 0,
        bootstrapIterations: 0,
      };
    }

    const bootstrapEstimates: number[] = [];

    for (let i = 0; i < iterations; i += 1) {
      const sample = this.resample(simulation.outcomes);
      bootstrapEstimates.push(this.calculateMean(sample));
    }

    const ci = this.calculateConfidenceIntervals({
      outcomes: bootstrapEstimates,
      meanProbability: this.calculateMean(bootstrapEstimates),
    }, confidenceLevel);

    return {
      ...ci,
      bootstrapIterations: iterations,
    };
  }

  private resample(data: number[]): number[] {
    return Array.from({ length: data.length }, () => {
      const idx = Math.floor(Math.random() * data.length);
      return data[idx];
    });
  }

  private calculateMean(data: number[]): number {
    if (data.length === 0) {
      return 0;
    }
    return data.reduce((acc, value) => acc + value, 0) / data.length;
  }
}
